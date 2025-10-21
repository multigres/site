---
sidebar_position: 10
title: "Part 10: Addenda"
---

# Part 10: Addenda

import Author from '@site/src/components/Author';

<Author
  name="Sugu Sougoumarane"
  title="Creator of Multigres, Vitess"
  imageUrl="https://github.com/sougou.png"
/>

# Health checks

In a distributed system, there are no accurate methods of detecting failure. When a node becomes unreachable, it could be one of the following problems:

- It could be a network partition
- The node could have crashed
- The network could be too slow

Attempting to make decisions based on failure with an incorrect diagnosis may actually end up disrupting an already healthy system.

However, we must do the best we can.

We have previously stated that coordinators will perform health checks on all nodes in the cohort. We also assume that the coordinators are strategically positioned to handle expected failure scenarios. This approach offers several advantages because it allows us to draw reliable inferences.

### Responsibilities

Each coordinator must connect to all cohort nodes and perform regular health checks. This can be achieved either through polling or by having the nodes stream their health status at regular intervals.

During health checks, the coordinator can keep the current leader, term, and ruleset up to date.

Each leader must send regular heartbeats to all nodes in the cohort.

### Failure detection

This is a topic that requires its own study. However, Raft’s simple approach seems to have satisfied most deployments. The coordinator performing health checks is slightly better than Raft because it checks the health of all nodes before making a decision. In Raft, a follower makes a decision simply because it hasn’t received a heartbeat from the leader.

When the coordinator detects a failure, it must answer these two questions:

1. Is the leader able to complete requests? We determine the answer to this question using the following data:
    - Is the leader itself reachable?
    - Among reachable nodes, are they receiving heartbeats from the leader?
    - Among those receiving heartbeats, are they enough for the leader to complete its requests?
    - Are the nodes still completing requests from the leader?
    - How long has this been going on?
2. Can the coordinator reach enough nodes to perform a leader change?

Answers to these questions should lead us through a decision tree where the outcome is either a decision to perform a leadership change or not to take any action.

# Term numbers

We previously promised that we would cover ways to generate term numbers. Here are some options:

### The Raft approach

Raft uses a clever method that lets nodes compete by using the same term number. The first coordinator to reach a majority of nodes wins that term number and gets permission to change leadership.

Those who do not win must wait for a timeout period and then try again using a higher term number. If the cluster is healed by that time, they have no action to take. This approach provides a mitigation for the livelock problem, where nodes can continuously race with each other, preventing anyone from succeeding.

import AnimatedSVG from '@site/src/components/AnimatedSVG';
import { part06Fig3 } from '@site/src/components/part06Fig3';
import useBaseUrl from '@docusaurus/useBaseUrl';

<div style={{textAlign: 'center', width: '100%', position: 'relative'}}>
  <AnimatedSVG
    src={useBaseUrl('/img/consensus/part06-fig3.svg')}
    onAnimate={part06Fig3}
    autoPlay={false}
    showControls={true}
    alt="Figure 1: Term number competition"
    width={2000}
    height={700}
    style={{display: 'inline-block', margin: '1rem 0', overflow: 'visible', transform: 'translateX(-450px)'}}
  />
</div>

The animation above is a reproduction of the one from the section on Revocation and Candidacy.

Applying the same approach to our pluggable durability, the coordinators do not need to reach a majority. If you examine the rightmost recruitment options, you will see that each option  shares at least one node with every other option. This is a necessary property of recruitment.

We can utilize this property, similar to Raft, to have the coordinators compete against each other to recruit the necessary nodes for a leadership change. Whoever succeeds first wins the term. By definition, others must fail.

### Time

The current time can be used as a term number. There are a couple of risk factors associated with this:

- Timestamps can theoretically collide. Adding extra bits, such as a unique coordinator ID, may be necessary to ensure collision avoidance.
- Rogue clocks can accelerate by a vast margin. Such incidents will require human intervention to reset the system.

### etcd

You can use an external system, such as etcd, to acquire a lock and generate a unique, monotonically increasing number. This method also solves the livelock problem. Some might say that this is impure. But it is still a wise engineering choice.

# Alternate durability

We previously discussed the need to revoke all possible leaderships for a safe leadership change. With this assumption, it is sufficient that a request reach any leader’s quorum. The current leader can consider that the request is durable and apply it.

If there is a failure, the act of global revocation will also discover any unapplied logs from the alternate group of nodes.
