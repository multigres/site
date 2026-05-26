---
slug: high-availability-from-first-principles
authors: [rafael]
date: 2026-05-28T09:00
tags: [postgres, multigres, high-availability, consensus, failover]
---

# High availability from first principles

In order to run services at scale and in a reliable way, high availability is a critical cornerstone. What it means in practice could vary from user to user. What follows is what high availability means in Multigres, what it is built on, and what a failover looks like in practice. The short version is that Multigres treats HA as a consensus problem, anchors that consensus in a [generalized](https://multigres.com/blog/generalized-consensus) model, and runs failovers that complete in a matter of seconds without violating durability.

<!--truncate-->

The full demo is here: [TODO].

## Two definitions

The shallow definition of HA is "promote a replica when the primary dies." A loop watches a health check, picks a candidate, and runs `pg_promote`. There's a tension between preventing data loss and maximizing uptime. There are many practical approaches to implementing high availability when durability guarantees are not strict and you can tolerate small amounts of data loss.

The deeper definition is harder. HA is a contract where every committed write survives failures including multiple failures close to each other, and that the cluster reaches agreement on which writes are committed before allowing any further writes. This deeper definition requires a consensus implementation.

Multigres is built around the second version. The HA implementation is anchored in a body of work the team calls generalized consensus, and every failover the orchestrator performs has to satisfy a small set of invariants drawn from that work.

## What we get from generalized consensus

The series of blog posts on the Multigres blog walks through generalized consensus in detail. The summary, for the purposes of this post, is that the work gives the implementation two things.

The first is a set of invariants. There is a small list of properties that any consensus implementation has to maintain, regardless of the specific algorithm. If the implementation maintains them, it is correct. If it violates any of them, even briefly, it is not. The invariants are not specific to Raft, Paxos, or any other named algorithm. They are the underlying rules that all of them happen to satisfy.

The second is a template. Given the invariants, there is a sequence of steps that, if followed, cannot violate them. The template covers leader election, membership changes, request completion, and discovery. The template is what the implementation runs. The invariants are what the template is checked against.

The two together let the team make changes to the implementation with confidence. A new edge case in failover does not require re-deriving the safety properties of the whole system. It requires checking the change against the existing invariants.

## MultiOrch: the coordinator

In a Raft system, every node is a candidate. Nodes vote among themselves, elect a leader, and replicate the log. The members do all the work.

Generalized consensus separates the roles. Leaders accept and complete requests. Followers help make requests durable. Observers replicate completed requests for read scaling. Coordinators run health checks, detect failures, and drive rule changes (including leadership changes).

In Multigres, the Postgres processes are leaders, followers, and observers depending on their state. MultiOrch is the coordinator. In our deployments, we run our Postgres cluster spread across three availability zones. So for redundancy and to account for coordinators being network partitioned from the rest of the cluster, we run MultiOrch in different AZs. There are normally two or three MultiOrch instances per shard, one per cell, watching the cluster from independent vantage points. They can all act independently, and they don't talk to each other directly. They each watch the state of the shard, each detect failures independently, and race to fix them when they do.

The race is bounded by the consensus rules. A coordinator that wants to perform a leadership change has to obtain a fresh term number, revoke the old leader's ability to make further progress, recruit a quorum of followers under the current ruleset, and discover the most progressed log among them before the new primary can accept writes. The candidate has to satisfy the durability rules of the cluster, which are externally specified by policy and combined with the current cohort to produce a concrete ruleset.

If two coordinators race, only one can complete the sequence. The other one notices, abandons its attempt, and watches the cluster re-converge. The cluster does not split.

## What happens during a failover

The demo shows the full sequence of a primary failover in a local Kubernetes cluster. This is what happens in that sequence of events from the consensus perspective:

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

In a planned failover, that window is closed because the primary stops accepting new writes before the new primary takes over. In an unplanned failover, that window is real. A primary can crash holding writes that no replica ever saw.

When that primary comes back, it has WAL records on disk that the rest of the cluster does not have. Its timeline diverges from the cluster's timeline at the failover point. If you let it stream from the new primary directly, Postgres will refuse, because the timelines do not match. If you reset its WAL position naively, you lose the new primary's writes.

The right answer is `pg_rewind`, which finds the last common WAL position between the old primary and the new primary and rewinds the old primary to that point. The old primary's local writes after the divergence are discarded. The new primary's writes are then streamed forward.

Multigres runs `pg_rewind` automatically as part of bringing the old primary back. The disconnected state in the UI is the rewind in progress. Once it completes, the old primary attaches as a replica, streams the WAL it missed, and rejoins the cluster as a follower.

## What a failover gives you

A failover that completes in seconds is table stakes. The interesting promise is the one underneath: every committed write survives the failover, every uncommitted write is discarded, the cluster reaches agreement on which is which before any new writes happen, and no human has to be paged.

Multigres can deliver this because it owns the problem as a cohesive solution. The HA promise depends on Postgres, the orchestrator, our connection pooling, and query gateway playing a role in an interconnected way. Multigres gives us one integrated stack where those pieces are designed to operate as a single system.

## Further reading

- [Generalized Consensus: Recap](https://multigres.com/blog/generalized-consensus-part11)
