---
slug: generalized-consensus-part3
authors: [sugu]
date: 2025-10-27
---

# Generalized Consensus: Governing Rules

As we solve the problem of durability, we will realize that there is a simple set of governing rules that we will be applying repetitively. We will develop these as we progress in our design. However, we will share their entirety upfront.

If you followed these rules, you should actually be able to implement any kind of consensus system. Here are some definitions and rules:

<!--truncate-->

### Definitions

- A consensus system executes a series of consistent distributed decisions made by multiple agents.
- A `decision` is an intent to make a change to the state of the system.
- An `agent` fulfills decisions.

### Rules

1. Durability: Every decision is a distributed decision.
    1. A distributed decision must be made durable.
    2. A decision that has been made durable can be applied.
2. Consistency: Decisions must be applied sequentially.
    1. Every agent must revoke the ability of all previous agents to make further progress before taking any action.
        1. Inference: Every agent must provide a way for future agents to revoke its ability to make progress.
    2. Every agent must discover decisions that were previously made durable, but not applied, and honor them. Clarifications:
        1. There are situations where it will be impossible to know if a decision met the durability criteria. If so, the agent must honor such decisions because they might have been applied.
        2. Decisions that get honored must be made durable and applied as a new decision made by the current agent (rule 1).
        3. Inference: If an agent discovers multiple conflicting timelines, the newest one must be chosen.

These rules have a hierarchy. If you can satisfy the top-level rule, you do not have to follow the sub-parts. To accommodate all possible algorithms, the rules also avoid dictating any approach or implementation.

For a leader-based system, there are three types of `decisions`:

- Fulfilling requests
- Changing leadership
- Changing durability rules

In the next few posts, we will discuss implementation strategies for these decisions.

In Raft, a `leader` is an `agent`. In our analysis, we will introduce one other agent: the `coordinator`.

### Questions

Are we claiming that algorithms like Paxos and Raft follow these rules?

*Yes. We’ll validate this as we expand on rules.*

If one were to implement a system that followed these rules, but didn’t follow anything like what Paxos or Raft did, would it still work?

*Yes.*

What do these generalizations allow that previous algorithms didn’t?

- *Durability rules can be arbitrarily complex.*
- *The number of nodes need not dictate the durability rules. This was already demonstrated in FlexPaxos. This generalization includes this flexibility.*
- *The rules don’t dictate implementation: We have the flexibility to separate concerns in an implementation or implement them differently. We can also reuse existing parts of other systems to compose a full system.*

# Durability vs Discoverability

Durability and discoverability are two sides of the same coin. We need to define durability rules for two purposes:

1. Data must survive node failures.
2. Data must be discoverable if there are network partitions.

For a majority quorum, if there is a single network partition, data that reached durability can always be discovered. This is because one side of the partition will have a majority and one of those nodes will have the data. However, more than one network partition can cause the data to not be discoverable.

In real life, network partitions are not totally random. So, you can craft durability rules based on expected failure patterns.

If there is a failure, the agent that performs the discovery can compute the minimum set of nodes that need to be visited to ensure that it discovers all completed requests. If one of those nodes is not reachable, the recovery will stall. People will get paged, and everyone can panic.

In other words, if the durability criteria do not take discovery into account, the system can stall. For all practical purposes, it is equivalent to a data loss. This is because production systems are required to meet specific availability requirements. The business priorities may force us to abandon the unreachable node in favor of serving new requests.

# Meaning of Apply

The meaning of ‘apply’ depends on the system that implements the protocol. For example, in the case of a database, a `commit` would count as an apply. For a file system, an `fsync` would count as an apply.

An apply is considered to be an irreversible process. It should be done only when we are certain that a request will not be abandoned.

The consensus system is not concerned with the semantics of apply. However, the request stored in the log should be such that the outcome of the apply is deterministic.

# Missing terminology

You’ll notice that there are some expected terms that are missing:

- **Leader, Follower, Candidate**: These are states that agents go through during the process of fulfilling their decisions. We will introduce these as needed.
- **Proposal number/term**: These are implementation details, used to enforce the ordering of decisions. There are other options.
- **Majority quorum**: We’ve already covered this. This is not a necessity.
- **Intersecting quorums**: This concept was introduced by FlexPaxos in place of majority quorums. We will instead discuss discovery, revocation, and candidacy.
- **Voting** is also not used, because it is misleading. There is no election either. A leader is appointed, not elected.

With all the groundwork laid out, it’s time to jump into the actual algorithms.

## Navigating the Series

In the next part, we'll look at how to fulfill requests.

* Previous: [Part 2: Setting the Requirements](/blog/generalized-consensus-part2)
* Next: Part 4: Fulfilling Requests (coming soon)
* [Full Series Overview](/blog/generalized-consensus)
