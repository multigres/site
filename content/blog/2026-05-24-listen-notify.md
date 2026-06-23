---
title: "How Multigres Supports LISTEN/NOTIFY Across Pooled Connections"
description: "LISTEN/NOTIFY is a per-session feature, and Multigres pools connections away from clients. Here's how we keep Postgres's pub/sub working when no client owns a backend session."
date: "2026-06-23"
author: "haritabh"
image: "/img/blog/listen-notify/establish-pooler-owned-listener.png"
tags: [postgres, multigres, listen-notify, connection-pooling]
---

Postgres `LISTEN`/`NOTIFY` has a scaling problem: the more clients listen, the slower every notification gets — by orders of magnitude once you're into the thousands. [Multigres](https://www.multigres.com) keeps that line flat, even though it pools connections away from clients — the one thing the feature depends on. How it pulls that off, and the edge cases you have to get right to make it behave exactly like Postgres, is what this post is about.

## A quick refresher on LISTEN/NOTIFY

`LISTEN`/`NOTIFY` is Postgres's built-in publish/subscribe mechanism. A session subscribes to a named channel:

```sql
LISTEN events;
```

Another session publishes to it:

```sql
NOTIFY events, 'cache invalidated: user:42';
```

Every session currently listening on `events` receives an asynchronous message containing the notifying backend's PID, the channel name, and the payload. On the wire, the server pushes it to the client as a `NotificationResponse` (message type `'A'`) outside the normal request/response flow. Applications lean on this for cache invalidation, job queues, and realtime fan-out precisely because it avoids polling.

A `LISTEN` registers the *current session* as a listener, and that registration is cleared the moment the session ends; it's per-connection state. *Delivery*, on the other hand, is broader: a `NOTIFY` reaches every session in the **same database** that is listening on the channel, no matter which backend connection it sits on. Postgres implements this with a single cluster-wide queue on disk (`pg_notify/`), tags each notification with the sender's database OID to keep it database-local, and signals every listening backend to come read it. In short, **registration is per-session, delivery is per-database**.

## Why pooling breaks it

Notice what Postgres ties the feature to: a *session*. And a pooler's whole job is to stop clients from owning one. Multigres deliberately decouples a client connection from any single Postgres backend, a client's queries can land on a different backend connection from one statement to the next. With no durable session to live in, `LISTEN` has nothing to attach to:

1. **`LISTEN` can't run on a borrowed connection.** If `LISTEN events` executed on whatever backend happened to be free, the very next statement could be routed elsewhere, and the registration would be stranded on a connection the client no longer holds.

2. **Notifications would arrive where the client can't see them.** Postgres *would* faithfully deliver to whatever backend ran the `LISTEN`, but in a pooler that backend isn't the client's to keep. The message would land on a connection that has already been handed back to the pool and reused by someone else.

Postgres is not the problem here. It delivers a notification across *different* backend connections perfectly well, as long as they share the same database on the same instance. Multigres leans on exactly that behavior — but only after solving the session-ownership problem above. The naive fix (pin every listening client to a dedicated backend connection) throws away pooling for exactly the workloads (lots of long-lived listeners) where pooling matters most. We needed listeners to stay [poolable](https://multigres.com/blog/pooling-without-choosing-a-mode#when-is-a-connection-free).

## The shared listener connection

The core idea: **clients never own a Postgres session for listening. The pooler does.**

Each pooler maintains a single, long-lived *listener connection* to its Postgres backend, separate from the query pool. It is acquired lazily (the first time any client issues a `LISTEN`, not before) and it is reserved, so the pool treats it as permanently checked out for as long as anyone is listening and never recycles it out from under us.

This one connection listens on behalf of *every* client connected to that pooler. The listener tracks channels with a refcount: the first subscriber to a channel triggers a real `LISTEN channel` on the backend, and the last unsubscribe triggers the matching `UNLISTEN`, so we issue exactly one backend subscription per distinct channel regardless of how many clients want it.

Because the listener connection has to *send* `LISTEN`/`UNLISTEN` commands while simultaneously *receiving* a continuous stream of notifications, it runs with a split read/write model over the single socket: a reader goroutine drains incoming messages while an event loop writes subscription changes. That avoids tearing down and re-establishing the connection every time the set of channels changes, which would itself be a window for lost notifications.

![Subscribe: a client's LISTEN is recorded by the gateway, which opens a StreamNotifications stream to the pooler; the pooler issues the backend LISTEN, waits for Postgres to acknowledge it, then signals ready — and only then does the gateway return OK to the client](/img/blog/listen-notify/establish-pooler-owned-listener.png)

Now `NOTIFY` falls out naturally. Multigres doesn't treat it as anything special at execution time — the planner routes it to a single fixed target as an ordinary query. That fixed routing is deliberate: a Postgres notification never crosses from one instance to a *separate* one, so every `NOTIFY` has to land on the same instance the listener connection is watching for the two to meet. The `NOTIFY` runs on a normal backend connection, and Postgres delivers the notification to every session *in that database* listening on the channel, including the pooler's shared listener, which is just another backend on the same instance. This is the step that depends entirely on Postgres's native cross-backend delivery: the publisher and the listener are different physical connections, and Postgres is the thing that bridges them. The notification lands on the listener connection, and from there Multigres takes over delivery.

## The fan-out path

Getting a notification from a Postgres backend back to the right client is a two-level fan-out: once inside the pooler, once inside the gateway.

![Publish and deliver: a client's NOTIFY is routed as an ordinary query to a fixed target, Postgres delivers it natively to the pooler's listener connection, which fans out over the gRPC StreamNotifications stream to the gateway, which enqueues per client and emits the NotificationResponse 'A' on the wire](/img/blog/listen-notify/publish-and-deliver.png)

Walking it from the bottom up:

**Pooler → gateway.** The gateway subscribes to a pooler over a long-lived gRPC stream, `StreamNotifications`, which accepts a set of channels. When the pooler's listener receives a notification, it fans out to every subscriber registered for that channel and the stream carries it to each interested gateway.

**Gateway → client.** The gateway keeps per-connection state for every client. Each listening connection has its own notification queue, and the gateway's notification manager fans the incoming stream out to the connections subscribed to that channel. Each queue is bounded, a few hundred pending notifications deep.

Notification delivery is asynchronous and a slow client must not stall the shared delivery path for everyone else. If a connection's buffer fills, the overflow is dropped and logged rather than allowed to block, which matches Postgres's own fire-and-forget posture toward `NOTIFY` (a notification is best-effort once emitted, not a durable message).

**To the wire.** Each client connection runs a background writer that pulls from its notification channel and emits the `NotificationResponse` `'A'` message. Notifications can arrive at any moment, including mid-query, so the writer acquires the connection's buffer lock per packet to keep the `'A'` message from interleaving with whatever else is being written to the socket. Any notifications buffered while a query was in flight are flushed before the connection sends `ReadyForQuery`, so a client never sees a stale view of its subscriptions at a transaction boundary.

## Getting the edges right

A shared listener and a fan-out tree get the happy path working. The rest of the work is making it behave *exactly* like Postgres in the corners, which is where compatibility usually breaks.

### LISTEN inside a transaction

In Postgres, `LISTEN` and `UNLISTEN` are transactional: issue them inside a `BEGIN` and they only take effect if the transaction commits; roll back and it's as if you never ran them. Multigres has to honor that even though the actual subscription work happens on a shared connection that isn't inside the client's transaction at all.

The gateway solves this by buffering. A `LISTEN`/`UNLISTEN` issued inside a transaction isn't applied immediately — it's recorded as a pending action on the connection's state. At commit, Multigres replays the pending actions in order and computes the **net** change against the pre-transaction subscription set.

So `LISTEN a; LISTEN b; UNLISTEN a;` inside one transaction resolves to a single net subscribe to `b` at commit time, and a rollback resolves to nothing at all. Only after the net diff is computed does the gateway actually sync subscriptions with the pooler.

### Closing the gap between LISTEN and the first notification

There's a subtle race: once a client's `LISTEN` returns OK, it expects to receive every notification published afterward. If the gateway returned OK *before* the backend `LISTEN` was actually active, notifications fired in that window would be lost, and the client would have no way to know.

Multigres closes the gap with a readiness handshake. When the gateway opens its `StreamNotifications` stream, the pooler issues the backend `LISTEN`, waits for Postgres to acknowledge it, and only then sends an initial ready signal down the stream. The gateway blocks on that signal before reporting `LISTEN` success to the client. By the time the client sees OK, the subscription is genuinely live all the way down to Postgres.

The pooler side reinforces this: after sending `LISTEN`/`UNLISTEN`, it drains command-completion acknowledgements before continuing, and crucially it keeps forwarding any notifications that arrive *during* that drain rather than discarding them.

### Surviving a reconnect

If the listener connection drops (backend restart, network blip), every channel it was listening on has to be re-established, or clients silently stop receiving notifications. Because the listener keeps its set of active channels in memory, recovery is just a replay: on reconnect it re-issues `LISTEN` for every channel still referenced.

### Matching Postgres's quirks

Small details, but compatibility is the sum of them:

- **Channel name length.** Postgres truncates channel identifiers to `NAMEDATALEN - 1` (63 characters). The gateway applies the same truncation at planning time, so a client listening on a long name and a client notifying it agree on the same channel even after truncation.
- **Identifier quoting.** Channel names are quoted as SQL identifiers before being sent in the backend `LISTEN`/`UNLISTEN`, preserving mixed-case and special-character channel names.

## What's next

`LISTEN`/`NOTIFY` looks like a small feature until you try to support it on top of connection pooling, where the one thing Postgres assumes, a stable session per listener, is the one thing you've taken away. Multigres handles it by moving the session into the pooler: a single shared, reserved listener connection subscribes on everyone's behalf, refcounts channels so each backend `LISTEN` happens once, and fans notifications back out through the gateway to each client's wire connection. That gets single-instance pub/sub right, and there's more of the surface still to build out:

- **Closing the reconnect gap.** If the shared listener or a gRPC stream drops, any notification published during the reconnect window is lost and subscribers aren't told there was a gap. Today we re-subscribe on reconnect and track how long the gap lasted; narrowing or signaling that window is the next step.
- **NOTIFY beyond a single shard.** `NOTIFY` is currently routed to one fixed target so it always meets the listener watching that instance. Extending pub/sub across a sharded cluster is future work.
- **Consolidating notification streams.** The gateway opens one `StreamNotifications` stream per channel today; a single bidirectional stream with dynamic channel add/remove would cut per-channel overhead at high channel counts.

`LISTEN`/`NOTIFY` is one piece of the broader Postgres-compatibility surface Multigres is building out, and we'll cover more of it in upcoming posts.
