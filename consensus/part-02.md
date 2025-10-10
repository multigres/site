---
sidebar_position: 2
title: "Part 2: Building the Foundation"
---

# Part 2: Building the Foundation

In our previous post, we came up with an informal definition :

*A consensus system must ensure that every request is saved elsewhere before it is completed and acknowledged. If there is a failure after the acknowledgment, the system must have the ability to find the saved requests, complete them, and resume operations from that point.*

Let us stick to this definition and expand on some of these rules.

# Single value vs log replication

The original [Paxos](https://lamport.azurewebsites.net/pubs/lamport-paxos.pdf) paper was for a set of nodes to accept a single value. Although not practical, it is foundational. Understanding the single-value behavior will help us extend it for multiple values.

If we ask a Paxos system to accept a value and it succeeds, subsequent attempts to set a different value will fail. If the first attempt had an ambiguous outcome, the system might still finalize it later. A subsequent attempt may succeed or fail depending on the outcome of the first. This is shown in Figure 1 below.

![Figure 1: Single value consensus](/img/consensus/part02-fig1.svg)

Most practical systems need to accept multiple requests. To accommodate this, we have to modify this rule a bit: If the first attempt (A) succeeds, then a subsequent attempt (B) must be accepted and recorded as having occurred after A. If the outcome of A was ambiguous, then B requires the system to make a final resolution on A. If A is recovered and accepted, B is recorded after A. Otherwise, A is discarded, and only B is accepted. The system changes into one that consistently orders a series of requests. This is illustrated in Figure 2 below.

![Figure 2: Log replication](/img/consensus/part02-fig2.svg)

This was well understood by Raft, which is why it redefined this as a log replication problem. Since this is more practical, we will adopt Raft’s approach of replicating a log.

Depending on the type of system being implemented, these attempts can mean different things. For a key-value store, it may be a `SetKey`. For a database, it may be a `transaction`. For the sake of uniformity, we will generalize these as `requests`. Also, the data needed to persist a request may be physically different from the request sent by the application. For simplicity, we will treat them as equivalent.

### Consensus state diagram

![Figure 3: Request state diagram](/img/consensus/part02-fig3.svg)

Figure 3 above shows the state diagram for a request.

- A node can crash as soon as a request is received. This results in an abandonment.
- A received request could have been logged, but might not have met the durability criteria. If there is a failure, the request may not be discovered by the recovery process. If so, it will be abandoned.
- A request that has not yet become durable might get discovered by the recovery process. The process will replicate the request to make it durable.
- A request that has become durable will not be abandoned. This gives confidence for every node in the system to apply the request.

If a request gets applied without experiencing any failures, it will be acknowledged as a success to the requester. Otherwise, its outcome will be resolved later by a recovery process.

### Rejections and failures

The system can reject an invalid request. If so, the application can assume that it was not accepted. However, if a failure occurs due to a timeout or a node failing, the outcome would be unknown. The application must reconnect to the system and verify if the previous request was accepted or not. It is the application’s responsibility to know the difference between these two errors.

Many of us would have experienced this when we click on the “Pay” button while shopping online, and it spins and times out 😂.

# Durability Requirements

The problem definition states: “*every request is saved elsewhere”.*

This requirement is open-ended because durability requirements are user-defined. We want to accommodate all reasonable use cases.

Today’s cloud environments have complex architectures with nodes, racks, zones, and regions. They have pricing structures that may encourage specific layouts. Additionally, enterprises often bring in their own policies. Combining these could result in complex requirements.

Here are some examples:

- We want X nodes to receive the data before a request is deemed durable.
- We need Y total nodes to ensure availability when there’s a failure.
- Something more sophisticated: We want to deploy eight nodes across four zones, with two nodes in each zone. Our durability requirement is that at least one node in a zone other than the primary must hold the data. This ensures protection against a zone failure and a network partition between zones. We choose two nodes per zone to prevent leadership from switching zones during routine maintenance.

These requirements do not necessarily fit the pattern of a majority quorum. What ends up happening is that we configure a majority quorum system in such a way that these requirements are met. Sometimes, the configurations end up being sub-optimal.

We need a design that can accommodate these types of complexities.

### Pluggable Durability

Since such durability requirements can be arbitrarily complex, let’s make these rules pluggable, but add some restrictions:

- The rules must depend on the current set of nodes.
- Properties of nodes (like AZ) can be used, as long as they are static.
- The rules cannot depend on external variables, such as time.
- Each leader can have different rules.

Additionally, the rules must be sensible for the system to function effectively. If not, it may lose data, not perform well, or stall.

The ruleset data structure would conceptually look like this:

- List of participants
- List of eligible primaries. For every primary:
    - A list of node groups, where each node group is a valid durability combination

This could be further generalized by removing leadership from the picture and specifying durability as a set of acceptable node combinations. This approach would be more theoretically pure, but it would not improve the flexibility of the system. On the other hand, a leader-based approach is easier to reason about.

This sounds ambitious, but it is possible to build such a system.

# Orders of Magnitude

In real-life scenarios, a leader is expected to fulfill a large volume of requests, in the range of thousands of requests per second. A leadership term also lasts a long time, typically many days, and sometimes longer. The durability policies can be tuned to take this into account.

For example, you can choose to have a five-node system, but require the leader to reach only one other node for durability. This configuration will give you the performance benefit of a three-node cluster. At the same time, a node crashing will cause less anxiety because you still have four other nodes running. The trade-off is that a leadership change will require the coordination of more nodes.

You might find this hard to believe: Vitess operated a consensus system at YouTube with over fifty replicas worldwide. We mainly depended on the fact that a neighboring replica is likely to have received the transaction before the distant ones. There was one incident when a transaction somehow reached a single node at a remote location. Fortunately, the system detected this and still managed to preserve the transaction.

Although I wouldn't recommend something this audacious, it shows that you can run a system with an unusually large number of nodes without sacrificing performance and safety.

# Leader-Based Consensus

We will focus on leader-based consensus systems. I am aware of the existence of some leaderless algorithms, but I am not familiar with how they operate. I also don’t know if the principles we discover during this design will cover those approaches.
