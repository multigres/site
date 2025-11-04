---
slug: generalized-consensus-part6
authors: [sougou]
date: 2025-10-30
tags: [planetpg, consensus, distributed-systems, durability]
---

# Generalized Consensus: Revocation and Candidacy

This section covers ways to satisfy the prerequisites for a leader change: Revoke previous leaderships and recruit nodes for the new leader candidate.

<!--truncate-->

Reiterating the relevant part of the rules.

### Rules

1. Durability: Every decision is a distributed decision.
    1. A distributed decision must be made durable.
    2. A decision that has been made durable can be applied.
2. Consistency: Decisions must be applied sequentially.
    1. Every agent must revoke the ability of all previous agents to make further progress before taking any action.
        1. Inference: Every agent must provide a way for future agents to revoke its ability to make progress.
    2. (skipped)

In the previous post:

- We covered the need for term numbers and some guidelines about how they should be generated.
- We discussed the need for nodes to participate in terms, and also covered the governing rules about what they can and cannot do.
- We also concluded that a leader can execute multiple requests within its current term.

In this post, we will conclude Rule 2a by focusing on Revocation along with its counterpart: Candidacy.

# Recruitment

For a coordinator to successfully give instructions to a node, their term numbers must match. To enable this, the coordinator should first recruit the node to participate in its term. If the node’s own term number is lower, it will accept the recruitment and update its term number to match the coordinator’s term. Otherwise, it will reject the recruitment.

The coordinator does not need not specify a reason at the time of recruitment. It can choose what to do with the recruited nodes at a later time.

# Leader revocation

To revoke an existing leadership, a coordinator can:

1. Directly recruit the leader. This will make it relinquish its leadership and wait for further requests.
2. Recruit its quorum nodes. This will stop them from accepting requests from the current leader.

Performing one of these actions will satisfy rule 2a.

import AnimatedSVG from '@site/src/components/AnimatedSVG';
import { part06Fig1 } from '@site/src/components/part06Fig1';
import useBaseUrl from '@docusaurus/useBaseUrl';

<AnimatedSVG
  src={useBaseUrl('/img/consensus/part06-fig1.svg')}
  onAnimate={part06Fig1}
  autoPlay={true}
  showRestartButton={true}
  alt="Figure 1: Revocation methods"
  width={900}
  height={300}
  style={{display: 'block', margin: '1rem 0', overflow: 'visible', transform: 'translateX(-50px)'}}
/>

Recruiting the leader, if reachable, gives us the advantage of a clean shutdown. The leader can ensure that in-flight requests are completed. It could inform its callers of an impending change in leadership, among other things.

The advantage of the second method is that it can succeed when the leader may be unreachable. This works even if it is still attempting to process requests on the other side of a partition. In our use case, if N1 is the leader, recruiting N2 or N3 is sufficient to revoke its leadership.

Both these examples are illustrated in Figure 1.

# Coordinator revocation

Rule 1 states that every decision is distributed and must be made durable. This rule applies to coordinators also.

We also noted that durability rules depend on which node is the leader. The coordinator’s role is to appoint a new leader, hereafter called the `candidate`. The coordinator is expected to interact with the candidate and the nodes it relies on for its quorum. The specifics of these changes will be explained in the next post. For now, we can assume that it will need to:

- Recruit the candidate.
- Recruit the minimum number of nodes necessary for the candidate to fulfill requests successfully.

These recruitment actions with the intent to establish leadership are what constitute the `Candidacy`. This satisfies the rule 2a(i) requirement, because this candidacy can be revoked by requesting these nodes to participate in a newer term.

The revocation action for the candidacy is the same as the revocation action for leadership. This is not a coincidence because revocation is achieved by disrupting the ability for decisions to be made durable, and the only durability rules that exist in the system apply to leaderships.

***What if the coordinator completes its work of appointing a leader before the revocation process begins?** The answer to this question depends on whether we want the appointed leader to start a term that is newer than the process that is performing the revocation. Deciding to go this route makes things more complicated: As a newer agent, it must also follow rule 2a, which will be a repetition of the coordinator’s work.*

It is simpler for the established leadership to inherit the same term as the coordinator. The reasoning is that, under the coordinator's assigned term, the goal is to follow all the steps needed to appoint a leader, which involves rules 2a, 2b, and 1. Once this is accomplished, the term is delegated to the leader. Because this is a delegation, the leader does not have to revoke anything. It can therefore fulfill requests by continuing to iterate on rule 1. This is also consistent with Raft, where the candidate acts as the coordinator and eventually becomes the leader, all within the same term.

A newer agent will be capable of revoking the progress of the above term at any stage, even long after the leadership is established.

This sounds suboptimal for the use case we are trying to address: A newer coordinator may unnecessarily disrupt a leadership that was just established. Since our rules do not allow the usage of elapsed time, we have to accept this as a possibility. However, there are other ways to avoid such disruptions, and we will cover those options later.

# All possible leaders

As discussed earlier, a coordinator is unlikely to know upfront whether other coordinators are active and, if so, who their candidate is. For this reason, a coordinator must assume that there may be multiple other coordinators racing with it, and they could be aiming to promote any of the eligible leaders. Therefore, it must revoke all possible leaderships in the cohort. We will cover how to do this with an example.

# Overlapping nodes

Can there be an overlap between the nodes that are needed for revocation and the nodes that are needed for the candidate?

The answer is yes. In fact, it is likely the case for most practical scenarios. Fortunately, the act of recruitment does not have to differentiate between these two intents. This is also simpler and more efficient because a single recruitment message can be sent to all the nodes in parallel.

Once recruited, the nodes will be asked to do different things depending on their role in the new Candidacy.

# Example

In this example, we will first illustrate targeted revocations and then outline the requirements for a general revocation.

![Generalized durability policy](/img/consensus/genpolicy.svg)

As a reminder, the example config is as follows:

- The cohort has six nodes: N1-N6.
- Only N1 and N4 are eligible leaders.
- Durability criteria for N1: Data must reach both N2 and N3
- Durability criteria for N4: Data must reach either N5 or N6

Let us assume that the current leader is N1 at term 5.

## Revocation

A coordinator decides to appoint a new leader and begins term 6, now called C6. Method 1 revocation requires recruiting N1 into term 6, which will cause N1 to step down from leadership. For method 2, recruiting the quorum nodes N2 or N3 into term 6 is sufficient. This will cause them to reject requests from N1, which is still on term 5. Both actions meet the requirements of rule 2a for the current leader.

This is illustrated in Figure 1. Ideally, the coordinator would try to recruit all the nodes. However, the two examples shown are sufficient for the revocation.

## Candidacy

For the following scenarios, we will assume that N3 has been recruited by C6 for the sake of revoking N1’s leadership.

### Scenario 1: no race

C6 must now satisfy 2a(i) by recruiting the nodes needed for candidacy. Let us assume that it chose N4 to be the candidate. Then it must recruit N4 and N5, or N4 and N6, or all three. After the recruitment, those nodes will be on term 6. In the animation below, C6 recruits N4 and N5, which is sufficient for candidacy. This action is sufficient even if the other three nodes, N1, N2, and N6, are not reachable.

If the network partition was what caused C6 to act, then N1 might not have known that N3 was recruited and may still think that it is the leader. But it would not be able to fulfill any requests.

import { part06Fig2Scenario1 } from '@site/src/components/part06Fig2Scenario1';

<div style={{textAlign: 'center', width: '100%', position: 'relative'}}>
  <AnimatedSVG
    src={useBaseUrl('/img/consensus/part06-fig2.svg')}
    onAnimate={part06Fig2Scenario1}
    autoPlay={false}
    showControls={true}
    alt="Figure 2: Scenario 1 - No race"
    width={1200}
    height={400}
    style={{display: 'inline-block', margin: '1rem 0', overflow: 'visible', transform: 'translateX(-120px)', clipPath: 'inset(0 0 0 300px)'}}
  />
</div>

### Scenario 2: newer term steals the nodes

If a different coordinator decides on a newer term 7 (C7), it must attempt to revoke both terms 5 and 6. For revoking term 5, it has the same goal as C6, but does not have to follow the same method. For revoking term 6, it must recruit N4, or both N5 and N6.

If this happens before C6 reaches these nodes, then C6 will fail to recruit them due to them being on a higher term.

import { part06Fig2Scenario2 } from '@site/src/components/part06Fig2Scenario2';

<div style={{textAlign: 'center', width: '100%', position: 'relative'}}>
  <AnimatedSVG
    src={useBaseUrl('/img/consensus/part06-fig2.svg')}
    onAnimate={part06Fig2Scenario2}
    autoPlay={false}
    showControls={true}
    alt="Figure 2: Scenario 2 - Newer term steals nodes"
    width={1200}
    height={400}
    style={{display: 'inline-block', margin: '1rem 0', overflow: 'visible', transform: 'translateX(-170px)', clipPath: 'inset(0 0 0 300px)'}}
  />
</div>

In the above example, C7 revokes N1’s leadership by recruiting N2, which is different from what C6 recruited. This is acceptable because it is still a successful revocation of N1’s leadership. C7 also revokes the candidacy for N4 by recruiting N5 and N6, which is different from what C6 recruited. This is also sufficient because C6 will fail to make progress. After all, N5, which it recruited, is now in term 7.

In other words, coordinators can each recruit a different set of nodes for revocation and candidacy, and they will still preserve safety.

### Scenario 3: newer term starts after scenario 1

If C7 started after scenario 1 finishes, it will still end up recruiting the nodes that were recruited by C6, which will prevent C6 from making further progress.

C6 could have completed the rest of the actions needed to establish the new leadership. If so, C7 will end up revoking that leadership.

The result of scenario 3 would look the same as the result of scenario 2.

import { part06Fig2Scenario3 } from '@site/src/components/part06Fig2Scenario3';

<div style={{textAlign: 'center', width: '100%', position: 'relative'}}>
  <AnimatedSVG
    src={useBaseUrl('/img/consensus/part06-fig2.svg')}
    onAnimate={part06Fig2Scenario3}
    autoPlay={false}
    showControls={true}
    alt="Figure 2: Scenario 3 - Newer term starts after scenario 1"
    width={1200}
    height={400}
    style={{display: 'inline-block', margin: '1rem 0', overflow: 'visible', transform: 'translateX(-200px)', clipPath: 'inset(0 0 0 300px)'}}
  />
</div>

### All possible leaders

So far, we targeted specific nodes for revocation and candidacy. This was mainly to illustrate the logic. As explained before, a coordinator must actually attempt to revoke all possible leaderships in the cohort. To achieve this, it must recruit a combination from each group:

For N1:
- N1
- N2
- N3

For N4:
- N4
- N5, N6

For example, N1, N4 is a valid combination. N1, N5, N6 is also a valid combination, etc.

To recruit for leadership:
- For N1, it must recruit N1, N2, N3.
- For N4, it must recruit N4, N5 or N4, N6.

To perform a leadership change to N4, a coordinator must recruit for both revocation and candidacy. This would be any combination from the first set and a combination needed for N4’s leadership. A valid set would be: N3, N4, and N5, which is illustrated in scenario 1. The animation below shows a few examples of valid combinations:

import { part06Fig3 } from '@site/src/components/part06Fig3';

<div style={{textAlign: 'center', width: '100%', maxWidth: '100%', overflow: 'hidden', position: 'relative'}}>
  <AnimatedSVG
    src={useBaseUrl('/img/consensus/part06-fig3.svg')}
    onAnimate={part06Fig3}
    autoPlay={false}
    showControls={true}
    alt="Figure 3: All possible leaders"
    width={2000}
    height={700}
    style={{display: 'inline-block', margin: '1rem 0', overflow: 'hidden', transform: 'translateX(-700px)'}}
  />
</div>

# Summarizing the rules

The summarized rules are more straightforward than the explanation: The coordinator must try to recruit all reachable nodes to participate in the new term. After the recruitment, the following criteria must be met among the nodes that were successfully recruited:

- No leader of an older term must be able to complete any requests.
- They must contain a candidate (or the intended candidate) with a sufficient set of nodes needed for its quorum.

# Which parts of Paxos or Raft do this?

For Paxos, this is the `prepare` message where it sends a proposal number to all nodes. For Raft, it is the `RequestForVote` message.

For both algorithms, the requirement is that the candidate recruit a majority of the nodes. This is sufficient because a majority satisfies both the requirements of revocation and candidacy.

Suppose a majority is not needed for quorum, like in the case of FlexPaxos. In that case, the nodes required for revocation will be different from those that are necessary for candidacy. FlexPaxos used an approach of intersecting quorums to ensure safety. However, it was essentially implementing Rule 2a without being explicit about it.

It took a lot of explanation to unravel the concepts behind such a simple action. But without this understanding, we can't safely modify these algorithms. Additionally, this understanding will help us when discussing rule changes in a later post.

## Navigating the Series

In the next part, we'll look at how to discover timelines and ways to propagate them.

* [Full Series Overview](/blog/generalized-consensus)
