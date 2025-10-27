---
slug: generalized-consensus-part4
authors: [sugu]
date: 2025-10-28
tags: [planetpg, consensus, distributed-systems, durability]
---

# Generalized Consensus: Fulfilling Requests

Let’s restate the subset of rules that are relevant to this section:

1. Durability: Every decision is a distributed decision.
    1. A distributed decision must be made durable.
    2. A decision that has been made durable can be applied.

<!--truncate-->

# Definitions

- The `cohort` is the full set of nodes that are responsible for fulfilling the durability requirements of the system. In other words, these nodes are responsible for persisting their logs.
- A `quorum` is any combination of nodes that are needed to meet the `durability criteria`. We will use these terms interchangeably depending on the context.

### Roles

- A `leader` is a designated node in the cohort that is empowered to accept and complete requests. It continues to serve requests until its leadership is revoked.
- The rest of the nodes in the cohort are `followers`. Their role is to assist the leader in its workflow to make requests durable.
- `Observers` are nodes that are not part of the cohort. They are replicas that only accept requests that are ready to be applied by the leader.

# Sample use case

For better understanding, we will use the following example setup:

- A six-node cohort: N1-N6.
- Only N1 and N4 are eligible leaders.
- Durability criteria for N1: Data must reach both N2 and N3
- Durability criteria for N4: Data must reach either N5 or N6

![Generalized durability policy](/img/consensus/genpolicy.svg)

This is an impractical configuration. However, it has some unique properties that will help us demonstrate that a system can work with arbitrary rules:

- Eligible leaders have different durability rules.
- Not all nodes are eligible leaders.
- It has an even number of nodes.

The role of a leader is well understood in practical terms: It is a node that is authorized to accept requests from the application and fulfill them while also making the requests durable. As covered before, this is achieved by replicating a log to other followers.

# Initial State

Let us start with the initial state as follows:

- N1 is the leader
- Nodes N2-N6 are followers

# Processing requests

The algorithm explained below is very similar to the way Raft fulfills requests. The only difference is in the method used to determine if the durability criteria is met. For Raft, durability is determined by counting the number of followers that have acked a request. If it’s a majority, the request has become durable. In the generalized approach, the specific criteria has to be met. For N1’s leadership, acks from N2 and N3 must be received. No other acks count.

In Raft, each node must have a log of the requests being processed. Requests get appended to the log, and there is a trailing commit index (aka applied index) that determines the point up to which the events of the log have been applied.

The figure below shows a step-by-step animation of how requests get fulfilled by a generalized consensus system.

import AnimatedSVG from '@site/src/components/AnimatedSVG';
import { requestProcessing } from '@site/src/components/requestProcessing';
import useBaseUrl from '@docusaurus/useBaseUrl';

<AnimatedSVG
  src={useBaseUrl('/img/consensus/requestProcessing.svg')}
  onAnimate={requestProcessing}
  autoPlay={false}
  showControls={true}
  alt="Multigres consensus and replication diagram"
/>

When a leader receives a request, it appends it to the log and also sends it out in sequential order to all the nodes of the cohort. Every node that receives the event appends the request to its own log and responds with an acknowledgement (ack) stating that the event has been received. At this point, nothing has been applied.

The leader may receive other requests while waiting for an ack. If so, it can continue to append them to the log and transmit them to the followers.

The leader (N1) must wait until it receives the necessary acks to reach quorum. In this case, the acks must come from nodes N2 and N3. Once both those acks are received, N1 is allowed to move the applied index forward and apply the event. At this point, N1 can also return to the caller with a success response. At the same time, it must send an apply message (update applied index) to all the followers to apply the event.

We call this method of replication “Two-Phase Sync”.

### Additional Observations

- Acks from any nodes other than N2 and N3 do not count towards the durability criteria, and must be ignored by N1.
- If N4 were the leader, a single ack from either N5 or N6 would be sufficient.
- Other nodes are still required to apply the logs as they receive the apply messages.
- While N1 is the leader, acks from N4, N5, and N6 do not count. They could optionally be configured as observers for as long as N1 is the leader. However, as we will see much later, there are some advantages to them continuing to act as followers, and have N1 ignore their acks instead.

### Followers

A follower can be in one of these states:

- It might have just been rebuilt from a backup, or it may be lagging in replication: In this state, the follower’s latest logs would be behind the commit index of the primary. If so, the leader sends the committed logs as final until the commit index is reached.
- Caught up: In this state, the follower’s latest logs are past the commit index of the primary. The primary sends events in two-phase mode, and the follower responds with corresponding acks.
- Conflicting entries: In case of a conflict where a follower’s unapplied log does not match that of the leader, the follower should accept the leader’s logs as authoritative and discard conflicting entries.

### Observers

Observers only receive finalized apply requests.

# Validation

Let us now validate if the above algorithm follows Rule 1. In this scenario, the fulfillment of a request is a decision. From this perspective:

- Sending the request to all followers and waiting for the necessary acks is rule 1a.
- Moving the commit index forward and applying the event is rule 1b.

There are other replication modes, but they don’t follow rule 1:

- Async replication: The leader appends and applies the request, and asynchronously sends the events to the followers. This breaks rules 1a and 1b. This can lead to data loss if the leader node crashes.
- Synchronous replication: The leader sends the request to the followers as final. The followers apply the change and send an ack to the leader. The leader applies the change when the ack is received. This follows rule 1a, but breaks rule 1b. This is because the followers apply the change before the request has met the durability criteria. This can lead to inconsistent “split-brain” states.

*Postgres can rewind transactions. When a split-brain scenario happens, it is possible to identify the transactions that must be rewound to restore system consistency. Using this approach, it is possible to design a system that meets the necessary durability criteria. Details about this are covered in our earlier [blog post](https://multigres.com/blog/postgres-ha-full-sync#existing-replication-pitfalls).*

### Rule 2

During this explanation, we did not pay attention to rule 2: Consistency: Decisions must be applied sequentially.

Because this is the initial state, there is no previous agent. So, there is no need to revoke anything or honor any previous work.

However, rule 2 does apply to subsequent requests that follow the first one. In this case, we follow the title of rule 2: “Decisions must be applied sequentially”. As long as we append to the log, we are following the entire rule, which is sufficient.

# Roles

In the above scenarios, nodes have taken on two roles: Leader and Follower. Of these, the Leader is the active agent making decisions. The followers support the leader by making requests durable and by responding with acks.

### An alternate type of leadership

Reviewing our cohort setup again, we had instinctively linked a log to each node. However, the rules do not require this; they only specify that decisions must be made durable.

For example, we could detach the leader from its log and make it an independent node. ~~It~~ This detached leader will still need to send events to all nodes required for a quorum. In this case, it would be N1, N2, and N3, where all three nodes are followers. This is also valid because it satisfies the same rules.

This is how systems like Aurora and Neon achieve distributed durability even though they don’t resemble Paxos or Raft.

In the interest of focus, we will not expand on this scenario.

# Steady State

A leader can continue to serve a large number of requests in the current state. This is usually interrupted if there is a need to update the software or if a failure occurs.

When the leader has to change, we have new decisions to make. We will talk about those in the next post.

# How is this different from traditional consensus?

The two-phase mechanism of sending out the requests, waiting for the necessary acks, and then sending out messages to apply the requests is nothing new. This is how RAFT also works. The part that differs is that the rules for what constitutes durable can be arbitrary.

If we provided a plugin mechanism for the rules, these acks would be handled by the plugin, which would validate them against the durability rules. This would allow the main algorithm to remain agnostic of the durability policy.

We have also shown that the rules allow for an alternate way to meet the durability criteria with a leader that is detached from its logs.

## Navigating the Series

In the next part, we'll look at how to order events consistently.

* Previous: [Part 3: Governing Rules](/blog/generalized-consensus-part3)
* Next: Part 5: Ordering Decisions (coming soon)
* [Full Series Overview](/blog/generalized-consensus)
