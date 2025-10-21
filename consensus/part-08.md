---
sidebar_position: 8
title: "Part 8: Changing the Rules"
---

# Part 8: Changing the Rules

import Author from '@site/src/components/Author';

<Author
  name="Sugu Sougoumarane"
  title="Creator of Multigres, Vitess"
  imageUrl="https://github.com/sougou.png"
/>

So far, we have analyzed fulfillment of requests and leadership changes for a consensus system. In reality, these two actions alone are not sufficient to maintain long-running clusters. In addition to these, we also need the following capabilities:

- Adding and removing nodes to the cohort.
- Changing the durability rules
- Adding and removing agents

The ability to add and remove agents is already satisfied since the proposed approach has no explicit constraints on them. However, there was an implicit assumption that the agents knew the current durability rules. If these rules are going to change, we need to discuss how the agents will learn about these changes and maintain the cluster's safety.

Conceptually, adding and removing nodes to the cohort is a change in the durability rules. We wanted to list them out separately because they are different use cases. Otherwise, the general approach of changing durability rules should work equally well for adding and removing nodes.

We will present two approaches for changing the durability rules.

# Policy vs Rules

So far, we have not explicitly distinguished between the terms 'policy' and 'rules.' They are subtly different: A policy is an abstract requirement. For example, “I want my data to be in more than one AZ” is a policy. When the policy is combined with the list of nodes in the cohort, it results in a set of rules.

A change of policy may require you to install a new plugin. This type of change will be out of scope for this discussion. Any type of rule change that a single plugin can handle is in scope.

We will call this the `ruleset`. This ruleset must be known and understood by all agents. Additionally, since changes to rulesets are treated as distributed decisions, they must also reach quorum, which means that each cohort node must store the ruleset.

This also makes the cohort nodes the authoritative source for rulesets.

A coordinator can be initialized by pointing it at one of the nodes of the cohort. From that node, it can fetch the ruleset and the current term. Using this information, it can discover the rest of the nodes in the cohort.

# Coordinator method

We can use the coordinator to modify the ruleset. For this, we have to interpret and apply the rules for the type of change we are making.

In this cluster, let us assume that we want to change the leadership rules for N1 from “both N2 and N3” to “either N2 or N3”. We will call them rs1 and rs2, respectively.

![Figure 1: Ruleset change validation](/img/consensus/part08-fig1.svg)

The coordinator performs the same actions as a leader change, but validates the recruited nodes for revocation and candidacy against both rulesets, as shown in Figure 1. Additionally, instead of inserting a standard `completion` event, it inserts a special `ruleset change` event.

Every node that receives and applies this ruleset change event updates its ruleset accordingly. If N1 is the new leader, it changes its behavior to “either N2 or N3” for all subsequent requests.

*It is actually sufficient if the coordinator satisfies rs1. However, recovery from subsequent failures will need to satisfy both rulesets. For uniformity, it is preferable to apply both rulesets to all situations.*

import AnimatedSVG from '@site/src/components/AnimatedSVG';
import { part08Fig3a } from '@site/src/components/part08Fig3a';
import useBaseUrl from '@docusaurus/useBaseUrl';

<AnimatedSVG
  src={useBaseUrl('/img/consensus/part08-fig3.svg')}
  onAnimate={part08Fig3a}
  autoPlay={false}
  showControls={true}
  alt="Figure 3a: Ruleset change scenario 1"
  width={800}
  height={400}
  style={{display: 'block', margin: '1rem 0', overflow: 'visible'}}
/>

Figure 2 above shows an example where a coordinator in term 6 propagates N3 to N1 and N2, thereby satisfying rs1 and rs2 for N1’s candidacy.

### Corner case

Suppose the coordinator made the ruleset change durable and delegated leadership to N1. This allows N1 to apply the change and proceed. At this stage, if N3 gets partitioned, N1 can still complete requests because it now uses rs2, which can be satisfied with an ack from N2.

Let's consider a scenario where a different coordinator (C7) assumes the system is still using rs1 and attempts to change leadership. From its perspective, recruiting N3 is enough to revoke N1’s leadership. This recruitment leads to the discovery of a pending ruleset change in the logs. This discovery informs the coordinator that it needs to recruit N2 to revoke N1’s leadership successfully.

There are two possibilities here:

#### Scenario 1

After the new ruleset rs2 became durable, N1 gets promoted and completes additional requests. But it just uses N2 for its acks, which is sufficient to satisfy rs2.

C7 assumes rs1 is currently active. It recruits N2, which it thinks is sufficient to revoke N1’s leadership. However, it notices the ruleset change in the unapplied logs. Therefore, it must continue its revocation and also recruit N2. Recruitment of N2 leads to the discovery of a more progressed timeline. It must therefore propagate N2's timeline instead of N3’s timeline. In this case, it can use rs2 because the ruleset change has already been applied. At this point, it will realize that the minimum conditions are already met, and it could delegate leadership of the 7th term back to N1. N1 will eventually propagate the changes to N3. This scenario is shown in the animation below:

import { part08Fig3b } from '@site/src/components/part08Fig3b';

<AnimatedSVG
  src={useBaseUrl('/img/consensus/part08-fig3.svg')}
  onAnimate={part08Fig3b}
  autoPlay={false}
  showControls={true}
  alt="Figure 3b: Ruleset change scenario 2"
  width={800}
  height={400}
  style={{display: 'block', margin: '1rem 0', overflow: 'visible'}}
/>

#### Scenario 2

In this scenario, let us assume that no further progress was made after rs2 became durable.

The story starts off the same as scenario 1: C7 recruits N3, discovers the ruleset change, which makes it recruit N2. This time, it discovers the same timeline as N3. This allows it to append a completion event for the 7th term. However, the log now contains a mix of events from both rulesets. Therefore, its propagation must satisfy both rulesets: the requests must reach N1, N2 and N3. This scenario is shown in the animation below:

import { part08Fig3c } from '@site/src/components/part08Fig3c';

<AnimatedSVG
  src={useBaseUrl('/img/consensus/part08-fig3.svg')}
  onAnimate={part08Fig3c}
  autoPlay={false}
  showControls={true}
  alt="Figure 3c: Ruleset change scenario 3"
  width={800}
  height={400}
  style={{display: 'block', margin: '1rem 0', overflow: 'visible'}}
/>


In reality, the coordinator would try to recruit all nodes. We presented it as a two-step process to demonstrate safety. If it could only recruit N3 and not N2, it would mean N2 was unreachable, which would cause the attempt to fail.

### Summary of rules

A coordinator that intends to change leadership must perform an initial discovery using its last known ruleset.

Among the discovered nodes, it must obtain the ruleset of the most advanced node. It must also inspect the logs for any changes to the ruleset. If changes are present, then its recruitment and propagation must satisfy the ruleset of the current node as well as the rulesets present in the log.

For this to work, we need to make one change to the node’s behavior: upon recruitment, the node should return the current term number *as well as the current ruleset*. The coordinator must correspondingly preserve the last known ruleset.

# Leader Method

One problem with the coordinator method is that it is disruptive because it requires revoking the previous leadership. However, there is a way to implement this exact ruleset change with no disruption in traffic.

For this, we issue a request to the leader for the ruleset change. The leader fulfills this like any other request. The only difference is that the quorum rules for this specific request are expanded to include both rulesets. This is the same rule that was followed by the coordinator method. Once this is applied, the leader can switch to the new ruleset.

In this case, there is no change in the term number. Other than the different quorum rules, there is nothing special about this request.

If a failure occurs during this process, the above coordinator method can be used to appoint a new leader safely.

### Planned leadership change

The request-based approach of changing rulesets can also be used to make planned leadership changes. In this case, we create a special request called `leadership change`, and the quorum rules are expanded to include those of the intended leader.

Once the request is successfully applied, the current leader can step down to be a follower. The intended leader will observe this event and promote itself as the leader. The followers will also start expecting requests from the new leader as they see this event.

Again, there is no need to start a new term number for this method.

### Adding and removing cohort nodes

Adding and removing cohort nodes are, in fact, a special case of a ruleset change. This is because the ruleset contains the list of cohort nodes. There are policies where the addition or removal of a node changes the quorum rules of a leader. A majority quorum is one such example. If so, that has to be taken into account while applying this special event.
