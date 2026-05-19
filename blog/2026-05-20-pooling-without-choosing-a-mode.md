---
slug: pooling-without-choosing-a-mode
authors: [manan]
date: 2026-05-20T11:00
tags: [planetpg, postgres, connection-pooling]
---

# Pooling without choosing a mode

import ThemedImage from '@theme/ThemedImage';

_Part 3 of a series. Start with [Two jobs, two processes](/blog/two-jobs-two-processes) for the architecture and motivation._

Connection pool modes aren't an arbitrary choice. They exist because Postgres connections carry session state - temp tables, prepared statements, settings, transactions in progress - and it's not always safe to give one client's connection to a different client. The traditional answer is to pick a mode at configuration time and live with it. We didn't want users to have to make that pick. This post is about how Multigres figures it out per-query, automatically.

<!--truncate-->

## The mode tradeoff

PgBouncer's pooling mode is operator-configured per database, not client-negotiated. You pick one of three:

- **Statement mode**: connection released to the pool after every statement. Maximum reuse. But anything that spans more than one statement breaks - temp tables, multi-statement transactions, named portals, server-side prepared statements.
- **Transaction mode**: connection released after every transaction. Good reuse. But session state outside the transaction (temp tables, server-side prepared statements) gets dropped silently.
- **Session mode**: connection held for the entire client session. Fully correct. But poor reuse - your effective connection count scales with the number of clients, not the number of active queries.

Each mode has a sweet spot. Most apps don't fit cleanly into any one of them. Some queries need transaction-mode reuse; some queries actively rely on session state. The choice ends up being an upfront tradeoff between performance and correctness.

| Capability                      | PgBouncer Statement | PgBouncer Transaction | PgBouncer Session |   Multigres    |
| ------------------------------- | :-----------------: | :-------------------: | :---------------: | :--------------: |
| Multi-statement transactions    |         ❌          |          ✅           |        ✅         |        ✅        |
| Temp tables across queries      |         ❌          |          ❌           |        ✅         |        ✅        |
| Server-side prepared statements |         ❌          |          ❌           |        ✅         |        ✅        |
| Suspended portals / cursors     |         ❌          |          ❌           |        ✅         |        ✅        |
| Connection reuse                |        High         |         High          |        Low        | High<sup>1</sup> |

<sup>1</sup> _High when no reservation reasons are set; the connection moves to the reserved pool only when one or more are set. Multigres is the only column that gets ✅ across the board without paying the session-mode reuse cost._

The cleanest answer is: don't make the user choose. Recycle aggressively when it's safe, hold the connection when it isn't, and figure out which is which on the fly.

## When is a connection free?

The question we have to answer, per query, is: at the end of this operation, can the connection go back into the pool?

A connection is free when nothing is keeping it pinned to the current client. Multipooler tracks five distinct reasons a connection might be pinned.

### TRANSACTION

The client is inside a transaction. Everything between `BEGIN` and `COMMIT`/`ROLLBACK` runs on the same connection. Recycling mid-transaction would either lose the transaction's writes or corrupt the database, neither is acceptable. The TRANSACTION reason is set when the gateway parses a `BEGIN` and cleared on `COMMIT`/`ROLLBACK`.

### TEMP_TABLE

Temp tables are session-scoped. They live for the lifetime of the connection and disappear when the session ends. If we recycle a connection that has temp tables, those temp tables either disappear from the client's perspective (if the connection is reset) or leak into the next client (if it isn't). Both are wrong.

We detect temp table creation in the gateway's planner - it parses `CREATE TEMP TABLE` (and friends) and tells multipooler to set the TEMP_TABLE reservation. Once set, it's cleared when the temp tables are explicitly dropped, when the client issues `DISCARD TEMP`, or when the client disconnects.

### COPY

`COPY IN` and `COPY OUT` are streaming operations. The protocol enters a special mode where data flows back and forth without normal request/response framing. You can't interleave another query in the middle. The COPY reason is set when we see a COPY initiation, cleared when the COPY completes.

### PORTAL

A portal, in extended-query-protocol terms, is a prepared statement bound to specific parameter values and ready to execute. When you call Execute with a row limit, the portal returns the first N rows and stays _suspended,_ you can come back later for more. The portal's state lives on the connection.

If we recycle a connection that has a suspended portal, the next Execute against that portal would fail. The PORTAL reason is set when an Execute returns suspended (the portal hasn't been fully consumed); cleared when the portal is executed to completion or explicitly closed.

### LISTEN

There's a fifth reason, LISTEN - for connections dedicated to Postgres's LISTEN/NOTIFY pub/sub. Unlike the other four, it's set by the pool itself rather than triggered by client queries, and it's not exposed to clients in any direct way. The mechanics are out of scope for this post; we'll cover them separately.

## The combined rule

A connection returns to the regular pool only when _all reasons are clear_. That's the rule.

Concretely, the pool maintains a bitmask per connection. Each reason is one bit. When any bit is set, the connection is reserved.

<ThemedImage
alt="The reservation-reasons bitmask: five bits labelled TRANSACTION, TEMP_TABLE, COPY, PORTAL, LISTEN."
sources={{
    light: '/img/blog/connection-pooling/reservation-reasons-bitmask-light.png',
    dark: '/img/blog/connection-pooling/reservation-reasons-bitmask-dark.png',
  }}
/>

A worked example. The client runs `SELECT 1` (bitmask `00000`, connection in the regular pool), then `BEGIN` (sets TRANSACTION → reserved), then `CREATE TEMP TABLE t (…)` (also sets TEMP_TABLE — two reasons now), then `INSERT INTO t VALUES (…)` (no change), then `COMMIT` (clears TRANSACTION, but TEMP_TABLE remains — connection stays reserved despite the transaction ending), and finally `DISCARD TEMP` (clears the last bit, connection returns to the regular pool). The `COMMIT` step is the one that distinguishes multipooler from PgBouncer's transaction mode, which would silently drop the temp table there.

<ThemedImage
alt="Step-by-step walk through a client session: SELECT 1, BEGIN, CREATE TEMP TABLE, INSERT, COMMIT, DISCARD TEMP — showing the bitmask flipping bits and the connection moving between regular and reserved pools."
sources={{
    light: '/img/blog/connection-pooling/bitmask-layout-light.png',
    dark: '/img/blog/connection-pooling/bitmask-layout-dark.png',
  }}
/>

The bitmask approach is what makes this composable. A connection can be in a transaction _and_ hold temp tables at the same time. Each reason is set and cleared independently. Releasing one doesn't release the others.

## Three pool tiers

This model produces a natural three-tier pool architecture:

- **Regular pool**: connections with no reservation reasons set. Recyclable. Most queries get served from here.
- **Reserved pool**: connections with at least one reservation reason. Pinned to a single client. They move back to the regular pool when all reasons clear.
- **Admin pool**: a small, separate pool for cluster operations like `pg_terminate_backend` that have to work even when the regular pool is fully occupied.

The admin pool exists for a chicken-and-egg reason: if the regular pool is exhausted and you want to free it by terminating a stuck connection, you need a connection to send `pg_terminate_backend` on. If the only place to get one is the regular pool itself, the system can deadlock. Reserving a small set of connections specifically for management operations sidesteps that.

Most queries pull a connection from the regular pool, run to completion with no reasons set, and the connection goes right back. That's the fast path, comparable to what statement-mode pooling would give you. Some queries set one or more reasons (because the client opened a transaction, or created a temp table); those connections move to the reserved pool until the reasons clear. Each reason corresponds to a different shape of safety: TRANSACTION acts like transaction-mode pooling, TEMP_TABLE acts like session-mode pooling, and so on. The pool applies whichever one matches the query at hand.

The user doesn't pick. The pool routes connections through the right path based on what each query actually needs.

## The inactivity safety net

What if a client disconnects in the middle of a transaction? Or sets up temp tables and then never cleans them up?

A naive system would just leak the reserved connection forever. Multipooler has an inactivity killer: if a reserved connection sits idle - no queries, no protocol activity - for longer than a configured timeout, the pool kills it (`pg_terminate_backend`) and frees the underlying Postgres connection. The client's session is gone, but the connection budget is recovered.

It's worth being precise: this is about idle time, not total duration. A long-running transaction that's actively doing work is fine, every query resets the idle timer, and the connection can stay reserved for as long as the work takes. The killer only goes after connections that have been reserved and then forgotten about.

The threshold is tunable. The default is aggressive enough to reclaim budget from abandoned clients quickly, but lenient enough that a slow transaction doing real work has all the time it needs.

## Tradeoffs

A few honest costs:

**More state in the pool.** The bitmask, the parsing, the timeouts, they add up. Multipooler does more bookkeeping than a vanilla connection pooler, and that bookkeeping is on the hot path.

**The detection has to be exhaustive.** Missing a reason means we'd recycle a connection we shouldn't have, with consequences ranging from bug reports to data corruption. We've worked hard to make sure we catch all the cases the Postgres wire protocol can produce, but it's a category of bug we have to keep watching for.

**The regular/reserved split is a config-time choice.** The total connection budget is divided between the two pools by a configurable ratio. Size the reserved pool too small and session-state-heavy workloads queue up while the regular pool has slack. Size it too large and stateless workloads run on a smaller regular pool than they could've had. The default works for most workloads, but heavily skewed ones may need tuning.

We accept these costs because the payoff is significant: the mode choice goes away. You don't tell multipooler whether to be statement-mode, transaction-mode, or session-mode - it figures out which one each query needs, on its own. The reservation reasons are the bookkeeping that makes that tractable. The bitmask is the data structure. The regular/reserved split is the runtime shape. None of it leaks out to the user, which is the whole idea.

## What's next

One deep dive left in this series: [One parse per query, no matter how many gateways](/blog/one-parse-per-query-no-matter-how-many-gateways) - what happens when the same prepared statement shows up on ten gateways and only one Postgres instance has to remember it.

Code: [github.com/multigres/multigres](https://github.com/multigres/multigres). If you can break the mode detection with a query we didn't think of, we want to hear about it.
