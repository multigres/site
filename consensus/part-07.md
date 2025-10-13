---
sidebar_position: 7
title: "Part 7: Discovering and Honoring Requests"
---

# Part 7: Discovering and Honoring Requests

import Author from '@site/src/components/Author';

<Author
  name="Sugu Sougoumarane"
  title="Creator of Multigres, Vitess"
  imageUrl="https://github.com/sougou.png"
/>

Rules covered in this section:

### Rules

1. Durability: Every decision is a distributed decision.
    1. A distributed decision must be made durable.
    2. A decision that has been made durable can be applied.
2. Consistency: Decisions must be applied sequentially.
    1. (skipped)
    2. Every agent must discover decisions that were previously made durable, but not applied, and honor them. Clarifications:
        1. There are situations where it will be impossible to know if a decision met the durability criteria. If so, the agent must honor such decisions because they might have been applied.
        2. Decisions that get honored must be made durable and applied as a new decision made by the current agent (rule 1).
        3. Inference: If an agent discovers multiple conflicting timelines, the newest one must be chosen.

In the previous section, we covered how new coordinators ensured that they followed rule 2a, essentially ensuring that only one was able to take action at a given point of time. We discussed revocation and candidacy.

In this post, we will discuss:

- Discovery of timelines
- Propagation
- Establishment of leadership

# Discovery

The act of revocation has a serendipitous side effect: It also lets you discover all completed requests. The nodes that were recruited were necessary for the leader to complete its requests. By definition, it means that one of those nodes must have all the requests that were completed.

Beyond the completed requests, some of those nodes may also contain requests that were attempted.

![Generalized durability policy](/img/consensus/genpolicy.svg)

![Figure 1: Discovery](/img/consensus/part07-fig1.svg)

Let us take the example in Figure 1. The durability rules are the same as the previous examples: N1 requires requests to reach both N2 and N3 for completion. In the above scenario:

- N1 has completed A. This request must not be lost.
- B has met the durability criteria. This request must also not be lost.
- C and D have not met the durability criteria.

If the coordinator manages to recruit all three nodes, it will know the whole truth: Requests A and B must be completed. C and D can be discarded. This is the hard requirement from rule 2b.

The follow-up question is: Is there harm in also completing C and D? There is no harm. After all, they were valid requests that the leader was trying to complete. We will need and use this flexibility in other failure scenarios.

Suppose there is a network partition, and the coordinator is only able to recruit N3, with no visibility into N1 or N2. Based on the log information, all it can infer is that A and B might have been applied. This is where we use the inference 2b(i): We honor A and B.

If the coordinator recruits N2, the same logic applies. But in this case, all it can infer is that A, B, and C might have been applied. Here, we honor A, B, and C.

If the coordinator recruits N2 and N3, it knows that C was not complete, and it has the option of discarding it. In this case, we can choose to honor just A and B, or A, B, and C. However, a general rule to honor the most progressed timeline is safe and simpler.

*The outcome of what will be honored after a failure is non-deterministic: If N3 were the only discovered node, C would be abandoned. If N2 were discovered, C would be included in the recovery. However, B will not be abandoned because it has already met the durability criteria.*

This algorithm would be simple if a coordinator always succeeded in establishing leadership. However, multiple failures can occur during propagation. If that happens, newer coordinators may see conflicting timelines. We will discuss these scenarios after analyzing propagation.

# Propagation

For a leader, the `decisions` it was fulfilling were `requests`.

A coordinator’s intent is not to fulfill requests. The `decision` it needs to fulfill is to establish a leadership using the `timeline` it has selected.

If the rules from the previous post were followed, the coordinator would have already recruited the candidacy nodes into the current term number. The goal now is to propagate this timeline to those nodes. Once this occurs, it can delegate its term to the candidate. This will establish its leadership, allowing the new leader to begin accepting external requests.

Since a timeline includes multiple requests, the standard action performed by a leader cannot be used for propagation; A leader has the right to apply each request individually. According to Rule 1, the entire timeline must be made durable before it is applied.

Before discussing implementation options, let's briefly review Rule 2b(ii). It states that propagation must be made durable as a new decision. This means that decisions should be versioned and their sequence should be known. We need to do this because we assume these attempts may fail. If they do, we must know the order in which these propagations were attempted. Without this, we cannot apply Rule 2b(iii).

This gives rise to a few implementation choices:

### The Paxos way

Paxos is a protocol meant for finalizing a single value. The way to reconcile this with logs that have multiple values is to treat each timeline as a composite value. Our goal will be to finalize a chosen timeline.

For those that are not familiar with Paxos, we actually need to track three variables:

1. The proposal number the node has agreed to participate in
2. The current value
3. The proposal number that was used to accept the value

The proposal number for the value is stored in a variable different from the proposal number that was accepted from the `prepare` request. We will now explain why it should be tracked separately.

Figure 2 shows an illustration of how this works.

![Figure 2: Timeline propagation](/img/consensus/part07-fig2.svg)

As mentioned above, we will treat each timeline as a composite value like T0, T1, and T2, as shown in Figure 2.

In this scenario, let us start with N6, which contains timeline T1 which has two requests in its log.

The node has the following variables:

- Node name: N6
- Node’s term: 5
- Value: T1 (two requests)
- Value’s term: 5. This is the new variable we are introducing, which stores the term number when the value was accepted.

When C6 recruits N6, this will update the node’s term to 6. However, the value T1 and the `value’s term` 5 stay the same. At this point, if a new coordinator asks about N6, it will see the node’s term as 6 and the value as T1. But that timeline was set under term 5 and is not the correct value for term 6. That’s why we need to add a new variable to track the value’s term.

When C6 requests the node to change its timeline to T2, then the timeline and the value’s terms are updated. This, in essence, is rule 2b(ii). The decision made by C6 to change N6’s timeline from T0 to T1 is executed as a new decision under term number 6.

**This change must be atomic**: If C6 crashes while still writing T2, then no change should happen. It would not be acceptable for part of T2 to overwrite T1. In this state, it would have destroyed the previous timeline and replaced it with an incomplete portion of itself. This can lead to data loss.

**The change is authoritative**: The previous timeline may conflict with the new one. No matter, the new timeline must completely overwrite the previous one.

An extension of this rule is that regular leadership requests also have the value’s term associated with them. But they don’t change during the completion of requests because they are all under the same term.

*The value’s term must be persisted for the same reasons why the node’s term must be persisted.*

### The Raft way

Raft has a different approach.

Raft does not have the term as a separate variable. Instead, each request includes a term number, which is part of the log. When it comes to completing requests, Raft and Paxos are equivalent. One could say that Paxos is more storage-efficient than Raft because storing the single value is functionally equivalent to what Raft achieves by storing the term number for every request.

But they differ on how the timeline is propagated. Let us take the following animated example:

import AnimatedSVG from '@site/src/components/AnimatedSVG';
import { part07Fig3Raft } from '@site/src/components/part07Fig3Raft';
import useBaseUrl from '@docusaurus/useBaseUrl';

<AnimatedSVG
  src={useBaseUrl('/img/consensus/part07-fig3.svg')}
  onAnimate={part07Fig3Raft}
  autoPlay={false}
  showControls={true}
  alt="Figure 3: Raft timeline propagation"
  width={800}
  height={400}
  style={{display: 'block', margin: '1rem 0', overflow: 'visible'}}
/>

Let us assume that term 7 is trying to propagate N1’s timeline ABCD to N6, which initially has AB in its log.

In Raft, the log is propagated non-atomically. When N1 has two additional entries, it could propagate to N6 in two steps (steps 1 and 2). Additionally, the term number associated with those log entries remains the old term 5. This appears to violate rule 2b(ii). According to this rule, propagation must use the latest term number.

However, the rule is valid, and Raft follows it. The reason: Raft has an addendum to how it implements durability. The updated rule is as follows:

*For a request to be durable, it must reach quorum. Additionally, the term number of the request must match the current term.*

In other words, from a new term’s perspective, events from all previous terms are considered non-durable. They only become durable when a new event using the current term is appended to the logs. This requires the entire timeline to become durable under the new term before it can be applied.

On Step 4, a new request with term 7 is created and replicated. This is what makes the timeline meet the term number matching requirement for durability. Once the necessary followers have also received the amended timeline, it can be safely applied. This behavior meets the requirements of rule 2b(ii).

We intentionally left a gap to accommodate a complication that term 6 might have brought in, which term 7 is not unaware of. We will cover this in a later section.

### The timestamp way

Sometimes, you might not have control over the data you can add to the log replication. The specific use case is Postgres WAL replication: There is no simple way to add extra metadata, like a term number, to that log.

However, WAL commit events have timestamps. Assuming that clock skews are within tolerable limits, these timestamps can serve the same purpose as term numbers: they mark the order in which decisions are made.

This means that algorithms that resolve conflicting timelines will work equally well if we use event timestamps instead of term numbers.

In part 5 of our series, we discussed an alternate way of using locks and timeouts to enforce the sequencing of coordinators. Combining this timestamp method with the locks and timeouts approach creates a complete system that satisfies all our rules. This combination eliminates the need for term numbers entirely.

# Discovery revisited

### Selecting Timelines

In a network with intermittent failures, multiple coordinator attempts can fail, and each time, a coordinator may get to see only a subset of the nodes. Over time, a coordinator may see variety of timelines, and has to ensure that it chooses a safe one that does not violate the requirements of durability and consistency.

The rules for selecting a safe timeline are simple:

- The coordinator must recruit enough nodes to ensure that all possible leaderships are revoked. If this is not possible, then no progress can be made.
- Among the recruited nodes, the timeline with the latest decision (term) is always safe.
- If there are multiple timelines with the same term, then the most progressed timeline is always safe.

The reasoning is as follows:

- Every previous decision that was made was a safe one for that term. This applies recursively back to the oldest decision.
- The last discovered decision might have reached durability. It is even possible that some nodes have started applying that decision. This possibility makes all decisions previous to the last one unsafe.

What if we encounter a timeline that is more progressed than a newer decision? This only means that the timeline did not reach durability. Otherwise, the newer decision would have honored it. But now, we have to discard that progressed timeline because there is a chance that the newer decision has been finalized already.

What if there exists a decision that is newer, but we don’t see it among the recruited nodes? If so, the decision did not reach durability, and need not be honored. We can choose the most appropriate timeline among those we discovered, and make sure to propagate it as the newest decision.

### Failure scenarios

 We will now cover the following failure scenarios:

1. A coordinator may not be able to reach enough nodes to make any progress.
2. A coordinator may attempt to propagate a timeline and fail before making it durable.
3. A coordinator may attempt a timeline that differs from the previous one, try to propagate it, and fail.
4. A coordinator may succeed at propagating a timeline, but fail before promoting the leader.
5. A final coordinator may see all these attempts and must make a decision that does not compromise safety.

In the above sequence of failures, the most critical requirement is that attempt 5 must successfully discover attempt 4 and honor it.

We will analyze these scenarios assuming that we are using the Raft method of propagation. However, the strategy will work for all methods.

<AnimatedSVG
  src={useBaseUrl('/img/consensus/part07-fig3.svg')}
  onAnimate={part07Fig3Raft}
  autoPlay={false}
  showControls={false}
  alt="Figure 4: Initial state"
  width={800}
  height={400}
  style={{display: 'block', margin: '1rem 0', overflow: 'visible'}}
/>

Let us restart with the example shown in the Raft section:

- N1 is the primary at term 5. It has received requests ABCD.
- N2 is a quorum requirement for N1. It has received requests ABC.
- N3 is a quorum requirement for N1. It has received requests AB.
- N5 is not a quorum requirement of N1 and has received A.
- N4 and N6 are not quorum requirements of N1 and have both received AB.

### Scenario 1

*Scenario 1 is a no op. The coordinator cannot make any progress.*

### Scenario 2

*A coordinator may attempt to propagate a timeline and fail before making it durable.*

import { part07Fig3Scenario2 } from '@site/src/components/part07Fig3Scenario2';

<AnimatedSVG
  src={useBaseUrl('/img/consensus/part07-fig3.svg')}
  onAnimate={part07Fig3Scenario2}
  autoPlay={false}
  showControls={true}
  alt="Figure 5: Scenario 2"
  width={800}
  height={400}
  style={{display: 'block', margin: '1rem 0', overflow: 'visible'}}
/>

C6 recruits N3, N4 and N5:
- N3 & N4 for revocation
- N4 & N5 for candidacy of N4

C7 recruited N1, N4 and N6:
- N1 & N4 for revocation
- N4 & N6 for candidacy of N4

Note that N4 is common between the two coordinators. But C7 would have superseded C6 in the recruitment.

If C6 failed after completing step 6.3, this would be scenario 2. For it to complete its work, it still needed to replicate the requests to N4.

### Scenario 3

*A coordinator may attempt a timeline that is different from the previous one, try to propagate it, and fail.*

Looking at Figure 5 again, C7 did not discover any of C6’s activity. Based on what it discovered, it decided to propagate N1 to N6. If C7 failed after completing step 7.4, this would be scenario 3.

import { part07Fig3Scenario3 } from '@site/src/components/part07Fig3Scenario3';

<AnimatedSVG
  src={useBaseUrl('/img/consensus/part07-fig3.svg')}
  onAnimate={part07Fig3Scenario3}
  autoPlay={false}
  showControls={true}
  alt="Figure 6: Scenario 3"
  width={800}
  height={400}
  style={{display: 'block', margin: '1rem 0', overflow: 'visible'}}
/>


### Scenario 4

*A coordinator may succeed at propagating a timeline, may apply it to the leader, but fail before applying it to the followers.*

Let us now assume that Coordinator 8 (C8) attempts another leadership role. Let us also assume that it recruits the same nodes that C6 recruited. It will discover the following terms in the timeline:

- N3: 556
- N5: 556
- N4: 55

From this, C8 infers that C6 tried to propagate timeline AB (55), which makes it a legitimate decision. It propagates `6:ok` to N4. Following this, it appends `8:ok` to N5, and propagates it to N3 and N4.

This action makes the timeline durable. C8 can delegate leadership to N4, which can then apply this timeline and request that N5 and N3 apply it as well.

import { part07Fig3Scenario4 } from '@site/src/components/part07Fig3Scenario4';

<AnimatedSVG
  src={useBaseUrl('/img/consensus/part07-fig3.svg')}
  onAnimate={part07Fig3Scenario4}
  autoPlay={false}
  showControls={true}
  alt="Figure 7: Scenario 4"
  width={800}
  height={400}
  style={{display: 'block', margin: '1rem 0', overflow: 'visible'}}
/>


### Scenario 5

*A final coordinator may see all these attempts and must make a decision that does not compromise safety.*

After scenario 4, the cluster’s state is as shown in Scenario 5, which shows three distinct timelines.

In this particular scenario, the coordinator C9 sees all the nodes. It can see that N6 has a more progressed timeline. However, its term is lower than the highest term so far, which is 8.

It could make a "smart" inference and choose N6's timeline. However, the most safe decision would be to choose the timeline with the highest term. This is because choosing the highest term can never be wrong.

The animation below shows the outcome of C9 choosing the timeline of N4 that is on term 8. You will also notice that the propagation overwrites any conflicting timelines by truncating the logs of the targets as needed.

import { part07Fig3Scenario5 } from '@site/src/components/part07Fig3Scenario5';

<AnimatedSVG
  src={useBaseUrl('/img/consensus/part07-fig3.svg')}
  onAnimate={part07Fig3Scenario5}
  autoPlay={false}
  showControls={true}
  alt="Figure 8: Scenario 5"
  width={800}
  height={400}
  style={{display: 'block', margin: '1rem 0', overflow: 'visible'}}
/>


Let us repeat the reasoning from above using this specific example:

- When C6 made its decision, that decision was based on its visibility. This means that C6 had a chance to reach quorum and get applied.
- C7 also made a decision, but it did not discover the actions of C6. That means that C6 failed at reaching quorum. C7 had the authority to choose the most progressed timeline among the nodes it recruited, which it propagated to N6.
- C8 discovered artifacts of C6, but not of C7. That only means that C7 also failed at reaching quorum. However, C8 does not know that there was even a C7. From its point of view, it sees the work by C6. For safety, it has to assume that C6 might have reached quorum. So, it must honor every action taken by term 6. This time, C8 succeeds at reaching quorum.
- We finally come to C9, which may discover any combination of the above nodes. However, every combination is guaranteed to include the work done by C8.

In other words, we expect each term to make a safe decision. This remains true even if the decision conflicts with a previous term’s decision. For a new term, the only safe option is to honor the actions of the most recent term among those discovered.

This, in essence, is rule 2b(iii).

![Figure 6: Timeline Priority](/img/consensus/part07-fig6.svg)

The timeline selection priority is as shown in Figure 6. If timeline 5568 was not discovered, 55557 would be chosen, and so on.

If N4 had applied its timeline before C9 intervened, the system would stay consistent, and the end result would remain the same. The only difference is that the applied indexes would be at different points.

As mentioned earlier, the action that supersedes these timelines must be either non-destructive or atomic. In other words, events A and B should not be deleted before accepting the new timeline. Instead, anything following A and B should be truncated, and any remaining events from the source should be appended after the truncation.

At this point, C9 can delegate its term to N4, allowing it to accept new requests.

# Intermission

This completes the expected parts of consensus systems that are traditionally required to prove correctness. However, we will discuss a few more points in upcoming blog posts. These are necessary for a consensus system to work effectively.
