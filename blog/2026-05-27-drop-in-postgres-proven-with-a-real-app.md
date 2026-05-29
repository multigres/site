---
slug: drop-in-postgres-proven-with-a-real-app
authors: [manan]
date: 2026-05-27T10:00
tags: [postgres, multigres, connection-pooling, drop-in, scaling]
---

# Drop-in Postgres, proven with a real app

Most replacements for Postgres make a small bet: they ask you to give up something on the way in. A different wire protocol. A subset of SQL. A custom client library. A subset of extensions. The reasoning is that scaling Postgres requires breaking with Postgres, at least at the surface.

Multigres makes a different bet. The surface stays Postgres. Existing clients connect, existing extensions load, existing apps work without code changes. The scaling happens behind the gateway, where the application cannot see it.

This post is about two parts of that bet. The first is the drop-in claim, which is easy to test with a real Postgres app. The second is what happens when you push that drop-in past anything Postgres-on-its-own can handle, which is where Multigres earns its keep.

<!--truncate-->

The full demo:

<iframe
  style={{width: '100%', aspectRatio: '16 / 9'}}
  src="https://www.youtube-nocookie.com/embed/vSjnbtfQEoA"
  title="YouTube video"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
></iframe>

## The drop-in test

The cleanest way to test a "drop-in for Postgres" claim is to point a real Postgres app at the new system and see if it notices.

Miniflux is a self-hosted feed reader written against Postgres. Its docs explicitly say it requires Postgres, not "a Postgres-compatible database". It uses extensions for search, JSON columns for feed metadata, full-text search, LISTEN/NOTIFY, and standard Postgres features that compatibility layers usually fudge.

The Miniflux Docker image takes a Postgres connection string. Pointing it at a Multigres MultiGateway works the same way as pointing it at a Postgres instance. The app starts up, runs its migrations, creates its tables, and begins fetching feeds. It does not know it is talking to a gateway. The gateway speaks the Postgres wire protocol on the front and forwards queries to a MultiPooler, which in turn manages a real Postgres connection. From the application's point of view, this is Postgres.

That is the first half of the bet. A real Postgres app, not a curated benchmark, runs unmodified.

## Why this works

The wire protocol matters because almost everything else in Postgres tooling layers on top of it. ORMs, connection libraries, extensions that ship their own client tools, schema migration frameworks. All of them speak the wire protocol or shell out to clients that do.

A gateway that speaks the wire protocol end-to-end can route queries to a backing Postgres instance without translation. Statements arrive as parsed messages, not strings. Extended Query Protocol prepared statements survive the round trip. Session state, cursors, and transactions travel through the same connection.

The cost of speaking the protocol is real. The gateway has to handle every message type Postgres handles, including the awkward ones around startup, authentication, and replication. Multigres pays that cost so the application does not have to.

## Where the scaling lives

A drop-in is only interesting if it gives you something Postgres alone does not.

The simplest "give you something" story is connection scale. Postgres uses a process per connection. A few thousand connections is the practical ceiling on a serious instance. Real applications, especially anything serverless or anything fronted by a pool of edge workers, can ask for tens or hundreds of thousands of concurrent connections.

Multigres splits that job in two. The MultiGateway is the tier that accepts client connections, and it scales horizontally: connection capacity grows by adding gateways, not by tuning a single process. That is where the large connection counts come from. Behind it, MultiPooler runs next to every Postgres instance and manages the real Postgres connections - a small, stable set that all those client connections are multiplexed onto. The gateway gives you the connections; the pooler keeps the backend side small. Both are folded into the cluster as first-class components, supervised by the same machinery that runs replication and failover.

How the gateway and pooler are built, and what the pooler does once it owns the connections, are their own topics. Earlier posts go deep on each piece:

- [Two jobs, two processes](/blog/two-jobs-two-processes) - why the pooler is part of the cluster rather than a sidecar in front of it.
- [Per-user pools that share fairly](/blog/per-user-pools-that-share-fairly) - per-user pooling and max-min fairness when demand is unknown.
- [Pooling without choosing a mode](/blog/pooling-without-choosing-a-mode) - how the pooler recycles connections automatically instead of making you pick transaction, session, or statement mode up front.
- [One parse per query, no matter how many gateways](/blog/one-parse-per-query-no-matter-how-many-gateways) - how prepared statements stay deduplicated on the backend even as you scale gateways out horizontally.

## The 20,000-connection demo

The way to test that the architecture actually works is to push it.

The demo runs an app called SuperFireHose configured for twenty thousand concurrent connections, high read and write QPS, and a churn rate of two thousand connections per second. That last number is the interesting one. Real workloads do not just hold connections open. They open, use, drop, and re-open. A pooler that handles a steady twenty thousand connections but falls over when the connections churn is not useful.

The client connections land on the MultiGateway, the horizontally scalable tier that holds them. Behind it, the pooler multiplexes those connections onto a small, stable set of real Postgres connections. What's under test is that path end to end, under churn: connections opening and tearing down at a high rate without the backend connection set growing to match.

The demo is running on a single Mac laptop. The connection count climbs steadily, settles in the sixteen-to-eighteen thousand range, and stays there. The ceiling is the laptop, not Multigres. The gateway is happy to take more, but the kernel runs out of file descriptors and the CPU heats up before that becomes interesting.

The number is not the headline. The shape is. A pgbouncer-style pool with static limits would either reject the new connections or wedge under churn. The Multigres gateway absorbs the churn of client connections while the pooler keeps the backend connection set stable, and the application never notices.

## Pooling as a property of the cluster

The deeper point is that connection pooling in Multigres is a property of the cluster, not a service bolted on in front of it. Each Postgres instance has its own MultiPooler, co-located with it and registered in the same topology as the rest of the cluster.

The pooler is also what supervises that Postgres instance. If Postgres goes down, the pooler is the component that notices and brings it back, through pgctld. MultiOrch handles failover across instances, and the gateway watches the topology - when the primary moves, the gateway routes to whichever pooler now owns it. The application keeps talking to the gateway and does not know any of this happened.

That is what end-to-end looks like, and it is what makes Multigres a drop-in replacement instead of a Postgres-shaped wrapper around a separate stack.

The next post in the series moves up the stack to the part the application notices most: high availability.
