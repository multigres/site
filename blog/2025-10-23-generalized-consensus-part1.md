---
slug: generalized-consensus-part1
authors: [sougou]
date: 2025-10-23
tags: [planetpg, consensus, distributed-systems, durability]
---

# Generalized Consensus: Defining the Problem

In this blog series, I have the following goals:

- Propose an alternate and more approachable definition of consensus.
- Expand the definition into concrete requirements.
- Break the problem down into goal-oriented rules.
- Provide algorithms and approaches to satisfy the rules with adequate explanations to prove correctness and safety.
- Show that existing algorithms are special cases of this generalization.

<!--truncate-->

The first research paper that gained popularity was [Paxos](https://lamport.azurewebsites.net/pubs/lamport-paxos.pdf), and it was intimidating. Most people still don't fully understand it. Around the same time, another paper called [Viewstamped Replication](http://pmg.csail.mit.edu/papers/vr.pdf) was published, but it didn't achieve as much popularity. Later, [Raft](https://raft.github.io/) was introduced, providing an alternative approach that was easier to understand. It also included practical improvements that made it more usable in real-world scenarios. Specifically, it added failure detection and an enhancement to support log replication instead of the single-decree algorithm used by Paxos.

However, Raft remains a monolithic algorithm and is mostly used as a black box these days. Making changes to it is risky because you don't know what rules you might break. This fear has halted most progress in this area.

There are two reasons why consensus has remained a mystery for most:

1. The problem is not well-defined.
2. Previous research has focused on proving the correctness and safety of specific algorithms, rather than conceptualization.

Let's conceptualize instead. If we succeed, verifying the correctness of existing algorithms will become easier. More importantly, we can be bolder about modifying them to meet our needs better or creating entirely new ones.

There is a paper by Heidi Howard on [Generalized Consensus](https://arxiv.org/abs/1902.06776). I have read it, but I cannot claim to fully understand it. The paper is too theoretical for me, and I couldn't find an easy way to adapt it to real-world problems. It's quite possible that, if translated, it would be even more generic than what I intend to propose. However, I believe the goals differ: the paper focuses on a unified algorithm that can accommodate all existing consensus protocols. My goal is to develop a conceptual framework that enables the adaptation of consensus systems across diverse environments. Still, I did notice some overlaps between the topics discussed here and the paper. The concepts of revocation and flexible durability rules are definitely present in that paper.

I've made a previous attempt at this in my earlier [blog series](https://planetscale.com/blog/consensus-algorithms-at-scale-part-1), but it was incomplete. The series also had a bias because I wanted to demonstrate how to achieve this in [Vitess](http://vitess.io), despite its constraints. This time, I intend to be more precise and provide a foundation for something that can lead to a formal proof.

## Why are we even doing this?

Above all, it never hurts to gain a better understanding of a system we depend so much on.

Additionally, the existing implementations are based on a majority quorum, which is too rigid. We are continuing to live with them because we don't have better options. [FlexPaxos](https://fpaxos.github.io/) proved that you don't need a majority quorum. However, no implementation has yet adopted those learnings.

We are also stuck with implementations that cannot be separated into meaningful concerns. This makes it hard to adapt them to other systems.

For this reason, there is still no native consensus protocol in Postgres. The few commercial organizations that offer solutions appear to have utilized Raft, but the details are not publicly known. Anecdotal information seems to imply that they used Raft as a black box.

Instead, we should ask how to make consensus work for the Postgres WAL replication. In Multigres, we plan to do precisely this. The additions we will add to Postgres will enable the implementation of many consensus protocols, including Raft.

## Redefining the problem

![correctproblem.png](/img/consensus/correctproblem.png)

I've asked people about what they think consensus is. I've heard a variety of answers:

- An algorithm to make a group of nodes agree on a value
- Consistency
- Majority quorum

There is some truth to all those answers. But there is a more appropriate definition:

:::tip Key Definition
Consensus solves the problem of Distributed Durability.
:::

If you look back at all the places where consensus has been used, you'll realize that durability is the primary reason why it gets used.

Beyond durability, we want the system to recover and resume operation quickly in case of a failure. For this, we need automation that detects and responds to such failures. From a theoretical viewpoint, failure detection isn't in scope. However, we can't build a usable system without this capability. Therefore, we should make it a requirement:

:::tip Key Definition
Consensus also solves the problem of High Availability.
:::

Of course, we also want to ensure that nodes don't diverge while fulfilling the above two requirements. In a way, this is an implicit requirement, because a system that diverges has essentially failed at durability.

To restate in simple words:

*A consensus system must ensure that every request is saved elsewhere before it is completed and acknowledged. If there is a failure after the acknowledgment, the system must have the ability to find the saved requests, complete them, and resume operations from that point.*

With the problem defined this way, we will work on a focused solution. As we progress, we will learn concepts and establish rules. We will also explore different implementation options. Then, we can verify the current algorithms against these rules.

* [Full Series Overview](/blog/generalized-consensus)
