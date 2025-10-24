---
slug: generalized-consensus
authors: [sugu]
date: 2025-10-20
---

# Introducing Generalized Consensus: An Alternate Approach to Distributed Durability

Today, we're releasing a series that presents a fresh perspective on consensus algorithms. Rather than treating consensus as a monolithic black box, we propose a conceptual framework that makes these systems more approachable, adaptable, and flexible.

<!--truncate-->

## Why Another Take on Consensus?

Consensus algorithms like Paxos and Raft have been foundational to distributed systems for decades. Paxos, while powerful, has been notoriously difficult to understand. Raft improved accessibility but remains a monolithic algorithm that's risky to modify. This has effectively limited our flexibility in adapting consensus systems to modern cloud architectures.

The problem is twofold:
1. **The problem itself is not well-defined** - most explanations focus on what consensus does rather than what problem it solves
2. **Research has focused on proving specific algorithms** rather than building conceptual frameworks

This series takes a different approach.

## What We Cover

### A New Definition

We start by redefining consensus around the actual problem it solves:

*Consensus solves the problem of Distributed Durability and High Availability.*

In simpler terms: A consensus system must ensure that every request is saved elsewhere before it is acknowledged. If there is a failure, the system must have the ability to find the saved requests, complete them, and resume operations.

This definition shifts the focus from the algorithm to the goal, making it easier to reason about different approaches and implementations.

### Breaking Free from Majority Quorum

Today's cloud environments have complex topologies with nodes, racks, availability zones, and regions. Yet we're stuck with rigid majority quorum requirements that don't align with these realities.

What if you want durability that requires:
- At least one replica in a different availability zone?
- Two replicas across any two distinct regions?
- A specific combination based on your network topology and cost structure?

The series demonstrates how to accommodate arbitrarily complex durability policies without changing the core algorithm. We introduce the concept of **pluggable durability policies** that can be specified externally, like a plugin.

### Goal-Oriented Rules

Instead of prescribing a specific algorithm, we establish a set of governing rules that any consensus implementation must satisfy:

1. **Durability**: Every decision must be made durable according to the policy
2. **Consistency**: Decisions must be applied sequentially, with proper revocation and discovery mechanisms

These rules avoid dictating specific implementations, allowing for diverse approaches while maintaining safety guarantees.

### Practical Applications

The series isn't purely theoretical. We demonstrate:
- How existing algorithms (Paxos, Raft) are special cases of this generalization
- A concrete implementation approach inspired by Raft that supports flexible durability policies
- How to separate concerns like failure detection into independent components (coordinators)
- Practical considerations for building real systems, including handling ruleset changes

## The Complete Series

The series consists of 11 parts:

1. **[Defining the Problem](/blog/generalized-consensus-part1)** - Reframing consensus around distributed durability
2. **[Setting the Requirements](/blog/generalized-consensus-part2)** - Log replication, durability requirements, and pluggable policies
3. **Governing Rules** - The core rules every consensus system must follow
4. **Fulfilling Requests** - How leaders process and durably commit requests
5. **Before and After** - Finding a way to order events consistently
6. **Revocation and Candidacy** - Satisfying the prerequisites for a leader change
7. **Discovery and Propagation** - Finding and honoring previously committed decisions
8. **Changing the Rules** - Changing the ruleset dynamically
9. **Consistent Reads** - How to serve consistent reads
10. **Addenda** - Topics we deferred, like health checks, term numbers, etc.
11. **Recap** - Bringing it all together with a complete Raft-inspired implementation

## Why This Matters for Multigres

This work directly supports our goals for [Multigres](https://multigres.com). Postgres currently lacks a native consensus protocol. Existing solutions appear to use Raft as a black box, which limits their ability to optimize for Postgres's WAL replication model.

By building on this generalized framework, Multigres will support:
- Flexible durability policies (cross-AZ, cross-region, custom combinations)
- Better integration with Postgres's replication mechanisms
- The ability to scale to larger cohort sizes without performance degradation
- Native two-phase sync replication as a foundation for consensus

## Start Reading

The series is designed to be read sequentially, with each part building on previous concepts. Familiarity with Raft or Paxos will be beneficial, though not required.

[Start with: Defining the Problem](/blog/generalized-consensus-part1)

We believe this framework opens new possibilities for consensus systems that can adapt to modern cloud architectures while maintaining the safety guarantees we depend on.
