---
sidebar_position: 5
title: "Part 5: Before and After"
---

# Part 5: Before and After

import Author from '@site/src/components/Author';

<Author
  name="Sugu Sougoumarane"
  title="Creator of Multigres, Vitess"
  imageUrl="https://github.com/sougou.png"
/>

Let us reiterate the relevant rules from part 3.

### Rules

1. (not needed for this section)
2. Consistency: Decisions must be applied sequentially.
    1. Every agent must revoke the ability of all previous agents to make further progress before taking any action.
        1. Inference: Every agent must provide a way for future agents to revoke its ability to make progress.

There will come a time when a new Leader must be chosen. It may be due to a planned event, such as a software rollout, or a failure.

A leadership change is essentially a new decision, but it differs from a traditional request because it involves a change in roles. This requires applying the complete ruleset to execute a new decision. The outcome will be a leadership change. In this post, we will lay the groundwork for the approach we will use to satisfy rule 2a.

Before diving into the details, let us introduce some concepts.

# Failure detection

Failure detection is a necessary component for high availability in consensus systems. However, it is not a necessity for reasoning about safety. Therefore, we will cover this topic after we have completed the analysis of the core algorithms. For now, we can assume that failures can trigger an action to change leadership.

# The coordinator

Majority-based systems, such as Raft, typically have either three or five nodes in their cohort. A larger number becomes inefficient because the number of acks needed to make a request durable becomes too high. Due to this limited number, the nodes also take on the tasks of health checking and performing leadership changes.

However, in a generalized setup, the number of nodes can be much larger. You might have ten or twenty nodes in the cohort. In that case, it isn't practical for all of them to perform health checks or coordinate leadership changes.

![Figure 1: Coordinator setup](/img/consensus/part05-fig1.svg)

This task is logically separate and can be performed by agents that are not part of the cohort. We will name them the `coordinators`. Figure 1 illustrates an example setup of six nodes deployed across three availability zones, each with its own coordinator.

To summarize, the role of a coordinator is as follows:

- Perform health checks on all the nodes of the cohort.
- In case of a failure, perform a failover by appointing a new leader and ensuring that requests that the previous leader might have applied are honored.
- A coordinator can optionally provide the functionality to perform a “planned leader change”.

A smaller number of these coordinators can be strategically placed in different availability zones so that at least one of them has the necessary connectivity to appoint a new leader.

This does not preclude a cohort node from acting as a coordinator. We are highlighting that it is an independent role.

# A detour

One way to satisfy Rule 2a is to ensure that no two coordinators act simultaneously.

For example, a coordinator could obtain a distributed lock with exclusive rights to take action until a timeout, and then act. The [Redis distributed](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/) lock is one such example. The coordinator that obtains the lock must ensure that it finishes its work before the timeout.

The advantage of this approach is that it eliminates races, thereby simplifying implementation. As we will see below, an algorithm that allows coordinators to race will be substantially more complex.

Unfortunately, this approach cannot be used for a theoretical proof due to the following reasons:

- It is impossible to guarantee how long a process will take to complete its work. While it is in the middle of taking a critical action, the timeout may pass, and a new coordinator may start to act, thereby violating sequentiality.
- Clocks are imperfect: Clock skews could cause the coordinator to think that it still has time to finish its work, while the time might have elapsed for the other clocks. Another coordinator may then start to act, and again, violate sequentiality.

We shouldn’t dismiss this approach. After all, real-life systems rely on clocks and timing. Even High Availability, which is essential for consensus protocols, depends on timing. From a practical standpoint, using locks and timeouts remains viable as long as we understand the trade-offs and implement safeguards against potential issues. In fact, Vitess employs this approach.

The bigger point we’d like to make here is that you can approach this problem in radically different ways.

# Elapsed time

A theoretically correct solution should not depend on elapsed time: there should be no reliance on a clock or assumptions about how long actions take. For example, our reasoning should consider that an action can take one microsecond or one year. The same assumption applies to observing a previous action also: it might have occurred a few seconds ago or many weeks ago.

On the other hand, multiple coordinators could decide to act simultaneously and compete with each other. If so, we must ensure a consistent outcome.

The intuitive approach to solving a race condition is to favor the first coordinator. However, if the first coordinator takes too long, or even crashes before completing its work, no other coordinator can ever supersede it. In other words, this works only if we set a time limit for the completion of the task. This is the same as the lock-based approach described above.

We are now left with the alternate approach where a newer coordinator must be able to supersede an older one. This is why rule 2a uses the terms “current” and “previous” agents. It’s a lock-free algorithm and, therefore, naturally more complex than a lock-based algorithm.

# Ordering

When two coordinators decide to act and are expected to race, we need a way to ensure that their actions are serialized. This means that the system must assign an order to those decisions. In a distributed system, there are two types of ordering:

### Time ordering

Time ordering is the use of timestamps to determine the order in which coordinators make their decisions. The problem with timestamps is that clocks are unreliable.

In other words, time ordering is inaccurate.

### Encounter ordering

Encounter ordering refers to the physical sequence in which coordinators interact with a common node. This is also equivalent to causal ordering. It is accurate.

However, encounter ordering is unpredictable.

This unpredictability is acute because a coordinator can crash and never finish. Per the [FLP theorem](https://groups.csail.mit.edu/tds/papers/Lynch/jacm85.pdf), this is theoretically indistinguishable from a slow coordinator.

*The lock-based approach is an attempt to control this unpredictability.*

### Choosing the order

The unpredictability of encounter ordering is unavoidable because coordinators need to ask the cohort nodes to do work. If they race against each other, their actions are likely to be interleaved.

We need an algorithm that can withstand this unpredictability. The best approach is to assign an order to these coordinators in advance and set rules that cover actions occurring out of order.

Assigning an approximate timestamp when a coordinator decides to act can satisfy these requirements as long as we can ensure that the timestamps don’t collide. Additionally, we need to consider rogue clocks.

Raft offers a better approach: have the coordinators visit a set of overlapping nodes and use that information to determine a sequence. The benefit of this method is that it is precise due to the usage of encounter ordering. The clever part of this approach is that it does this before taking any action, meeting the above constraints. We will explain this in part 10.

# The term number

The assignment of an order between two independent nodes deciding to act is what Paxos calls a proposal number, and Raft calls a term number. This number must be universally unique, and is expected to increase monotonically. For clarity, we will use the RAFT terminology and refer to it as the term number. The rules around term numbers apply to all agents. This includes coordinators as well as leaders.

To handle agents acting out of sequence, we’ll specify that a newer agent always supersedes an older one. This is a prerequisite for Rule 2a(i). To achieve this, we will make agents `recruit` nodes into their term:

- An existing agent is expected to give instructions to a node using its current term number as authority.
- A newer agent can use its term number as authority and instruct those nodes to stop accepting further requests from the existing agent.

![Figure 2: Term number rules](/img/consensus/part05-fig2.svg)

For this to work correctly, the nodes should obey the following rules, also shown in Figure 2:

- Every node in the cohort must have a persistent term number.
- A node must honor requests from an agent with a matching term number.
- A node must reject requests from an agent with a lower term number.
- A node can be recruited into a term whose number is higher than the current one.

In Figure 2, the last example shows an agent implicitly recruiting a node that is from a lower term. This is allowed because it is equivalent to a recruitment followed by a request.

*The term number must be persisted to survive restarts. Otherwise, a restarted node that does not remember the term number it last agreed to may accept requests from a coordinator with a lower term and break rule 2a.*

# Reinterpreting Leadership

In the previous post, we talked about a leader being able to fulfill multiple requests. We now need to define how the term numbers interact with these actions.

One approach would be to assign a term number for each request. This has a disadvantage: a new coordinator that intends to change the leadership must come up with a number that is not only greater than the current term but also greater than other terms the leader could be generating as it fulfills more requests.

An alternate approach is to treat these requests as sub-terms. So, if a leader started under term 5, its requests would have the terms 5-1, 5-2, etc., or alternatively, a log position under term 5. This way, a coordinator that starts a term 6 is guaranteed to supersede the current leadership.

This is the reason why we chose the term “term”: It implies that it is long-lived and can fulfill multiple requests.

This also simplifies our reasoning: Within a term, we only pay attention to rule 1. To start a new term, we have to follow the entire ruleset.

***Do we need a term number once leadership is established? Yes.** If the system becomes chaotic with multiple coordinators and leaderships partially succeeding and failing, we need the ability to know the order in which events took place. In these situations, the term number can be used as an authoritative source to determine this order.*

Essentially, every leadership starts under a term that is newer than the previous one, until a newer term replaces it.

In the next section, we will see how to safely perform these leadership changes by following rule 2a.
