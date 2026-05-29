---
slug: high-availability-from-first-principles
authors: [rafael]
date: 2026-05-28T09:00
tags: [postgres, multigres, high-availability, consensus, failover]
---

# Postgres High Availability from first principles

High Availability is a critical feature for running services reliably at scale. What "HA" means in practice varies from user to user. This post describes how we approach high availability in Multigres and what a failover looks like in practice. 

The short version is that Multigres treats HA as a consensus problem, using [generalized consensus](/blog/generalized-consensus). It completes failovers in a matter of seconds, without violating durability.

<!--truncate-->

The full demo:

<iframe
  style={{width: '100%', aspectRatio: '16 / 9'}}
  src="https://www.youtube-nocookie.com/embed/5k_H0FbOVUo"
  title="YouTube video"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
></iframe>

## Approaches to High Availability

The simple definition of HA is "promote a replica when the primary dies". A loop watches a health check, picks a candidate, and runs `pg_promote`. There's a tension between preventing data loss and maximizing uptime. Many HA systems prioritize availability and accept that a small amount of recently-committed data may be lost during failover.

The stricter definition of HA is more demanding. Every committed write must survive failures, including multiple failures that happen in quick succession. Before the cluster can accept new writes, all participating nodes must agree on which writes are committed and which are not. This version of HA requires a consensus implementation.

Multigres provides strict guarantees. The HA implementation is anchored in a body of work we call [generalized consensus](/blog/generalized-consensus). Every failover performed by the orchestrator must satisfy a small set of invariants drawn from that work.

## HA using generalized consensus

[This series](/blog/generalized-consensus) walks through generalized consensus in detail. The summary is that the implementation provides two things:

**A set of invariants.** There is a small list of properties that any consensus implementation has to maintain, regardless of the algorithm. If the implementation maintains them, it is correct. If it violates any of them, even briefly, it is not. The invariants are not specific to Raft, Paxos, or any other named algorithm. They are the underlying rules that all of them happen to satisfy.

**A template.** Given the invariants, there is a sequence of steps that, if followed, cannot violate them. The template covers leader election, membership changes, request completion, and discovery. 

Together, these enable the team change the implementation with confidence. New failover scenarios do not require re-proving the safety of the entire system. Instead, each change is evaluated against a well-defined set of invariants that preserve the core guarantees.

## MultiOrch: the coordinator

The HA coodinator in Multigres is called "MultiOrch". It uses a more efficient approach to HA than most other database implementations. Take a Raft implementation, where every node is a candidate: nodes vote among themselves, elect a leader, and replicate the log. The members do all the work.

Generalized consensus separates the roles:

1. `Leaders` accept and complete requests. 
2. `Followers` help make requests durable. 
3. `Observers` replicate completed requests for read scaling. 
4. `Coordinators` run health checks, detect failures, and drive rule changes (including leadership changes).

In Multigres, MultiOrch is the coordinator and Postgres processes can be leaders, followers, or observers depending on their state.

In our deployments, we spread each Postgres cluster across three availability zones to provide cross-AZ redundancy. We also run MultiOrch in multiple AZs so that the system can tolerate a coordinator becoming network-partitioned from part of the cluster.

Typically there are two or three MultiOrch instances per shard, one per cell, each watching the cluster from an independent vantage point. They can all act independently and they do not talk to each other directly. Each instance observes the state of the shard, detects failures independently, and races to repair the cluster when it sees a problem.

The remediation follows the consensus rules. A coordinator that wants to perform a leadership change has to:

1. obtain the authority to do so,
2. revoke the old leader's ability to make further progress,
3. recruit a quorum of followers under the current ruleset, and 
4. discover the most progressed log among them before the new primary can accept writes.

The candidate must satisfy the cluster's durability requirements. Those requirements are externally specified by policy and combined with the current cohort to produce the concrete ruleset for the shard.

If two coordinators race, only one can complete the sequence. The other one notices, abandons its attempt, and watches the cluster re-converge. The cluster does not split.

## What happens during a failover

The demo video above demonstrates the full sequence of a primary failover in a local Kubernetes cluster. This is what happens in that sequence of events from the consensus perspective:

**Detection:** The cluster is healthy: one primary, two replicas, three MultiOrch instances watching. A demo button kills the Postgres process on the primary. Within a configurable timeout, every MultiOrch notices that the primary's pooler has stopped reporting healthy status.

**Race:** Each MultiOrch starts a failover attempt. Each one picks a new term number, one higher than any term it has observed on the cohort, and asks the replicas to pledge to it. Replicas accept only one coordinator per term, so only one MultiOrch can gather a quorum of pledges for this round. The losers back off and retry later if needed.

**Revocation:** The quorum's pledge to a new term is the revocation, and we recruit enough replicas for it to do two things. First, the old primary can no longer satisfy the cluster's durability policy with whatever replicas remain, so it can't durably commit any new writes under the old term. Second, we recruit enough replicas that they can't be part of any other quorum either, preventing a network-partitioned slice of the cluster from forming an independent quorum and electing a competing leader. This gives the coordinator sole authority to establish the next rule (in this demo the new leadership).

**Discovery:** The winning MultiOrch inspects the WAL position reported by each pledged replica and identifies the most-advanced replica that satisfies the durability requirements.

**Candidacy:** The new leader is chosen from the nodes already tied at that most-advanced position. There may be more than one; any of them is safe. Reachability and the cluster's durability policy are checked against the proposed cohort before the choice is finalized.

**Propagation:** The chosen node is installed as the new primary under the new term. Other followers reconcile their logs to its timeline, and the new primary is fully wired up.

**Establishment:** At this point the new primary can start accepting writes and the new term has started.

The full sequence completes in seconds. The application sees a brief delay on writes. Reads against replicas continue.

## Why the old primary stays disconnected

A subtle part of the demo is the part where the old primary, after it comes back, stays in a disconnected state for a moment before rejoining the cluster.

Postgres makes a guarantee that is weaker than the consensus contract. A primary acknowledges a write once it is durable on local storage. A replica acknowledges it once it has streamed and applied the WAL. There is a window where a primary considers a write committed and a replica does not yet.

In a planned failover, that window is closed because the primary stops accepting new writes before the new primary takes over. In an *unplanned* failover the window still exists. A primary can crash holding writes that no replica ever sees.

When that primary comes back, it has WAL records on disk that the rest of the cluster does not have. Its timeline diverges from the cluster's timeline at the failover point. If you let it stream from the new primary directly, Postgres will refuse, because the timelines do not match. We need to safely rewind the old primary so it can join the cluster again. 

The right answer is `pg_rewind`, which finds the last common WAL position between the old primary and the new primary and rewinds the old primary to that point. The old primary's local writes after the divergence are discarded. The new primary's writes are then streamed forward.

Multigres runs `pg_rewind` automatically as part of bringing the old primary back. The disconnected state in the UI is the rewind in progress. Once it completes, the old primary attaches as a replica, streams the WAL it missed, and rejoins the cluster as a follower.

## Multigres failover guarantees

Our implementation provides timely remediation (within seconds), minimum disruption to clients and strict durability guarantees: every committed write survives the failover, every uncommitted write is discarded, the cluster reaches agreement on which is which before any new writes happen, and no human has to be paged.

Multigres can deliver this because it owns the problem as a cohesive solution. The HA promise depends on Postgres, the orchestrator, our connection pooling, and query gateway playing a role in an interconnected way. Multigres provides an integrated stack where all the pieces are designed to operate as a single operating system.

## Further reading

- [Generalized Consensus: Recap](/blog/generalized-consensus-part11)
