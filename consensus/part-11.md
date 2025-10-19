---
sidebar_position: 11
title: "Part 11: Recap"
---

# Part 11: Recap

import Author from '@site/src/components/Author';

<Author
  name="Sugu Sougoumarane"
  title="Creator of Multigres, Vitess"
  imageUrl="https://github.com/sougou.png"
/>

We covered a lot of ground in this series. We started with the following objectives:

- Propose an alternate and more approachable definition of consensus.
- Expand the definition into concrete requirements.
- Break the problem down into goal-oriented rules.
- Provide algorithms and approaches to satisfy the rules with adequate explanations to prove correctness and safety.
- Show that existing algorithms are special cases of this generalization.

Below is a summary of the topics we covered.

# Definition

We introduced an alternate informal definition for a consensus system:

*A consensus system must ensure that every request is saved elsewhere before it is completed and acknowledged. If there is a failure after the acknowledgment, the system must have the ability to find the saved requests, complete them, and resume operations from that point.*

# Durability Policy

We declared that durability policies can be specified externally, such as a plugin. The algorithm should not have to change if the rules change. The rules have the following restrictions:

- The rules must depend on the current nodes in the cohort.
- Properties of cohort nodes (like AZ) can be used, as long as they are static.
- The rules cannot depend on external variables, such as time.
- Each leader can have different rules.

The ruleset data structure would conceptually look like this:

- List of cohort nodes
- List of eligible primaries, each containing:
    - A list of node groups, where each node group is a valid durability combination

It may be possible to add more flexibility to the rules, but we think this is sufficient for most of today’s requirements.

# Governing Rules

We introduced a set of governing rules.

Using these rules as a foundation, we proposed multiple ways to achieve consensus by focusing on different sections of the rules. We also included existing approaches and explained how they adhered to the governing rules.

The rules are as follows:

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
    2. Every agent must discover decisions that were previously made durable, but not applied, and honor them.
        1. There are situations where it will be impossible to know if a decision met the durability criteria. If so, the agent must honor such decisions because they might have been applied.
        2. Decisions that get honored must be made durable and applied as a new decision made by the current agent (rule 1).
        3. Inference: If an agent discovers multiple conflicting timelines, the newest one must be chosen.

These rules have a hierarchy. If you can satisfy the top-level rule, you do not have to follow the sub-parts. To accommodate all possible algorithms, the rules also avoid dictating any approach or implementation.

We demonstrated that these rules could be applied to the three types of `decisions` that a leader-based system would make:

- Fulfilling requests
- Changing leadership
- Changing durability rules

# Scoping

For the sake of practicality, we narrowed down the scope of our analysis when exploring solutions:

- We adopted Raft’s log replication as a requirement.
- We assumed a leader-based approach.

We re-introduced the following terminology from existing consensus protocols:

- A `leader` is an `agent`. It is a designated node in the cohort that is empowered to accept and complete requests. It continues to serve requests until its leadership is revoked.
- The rest of the nodes in the cohort are `followers`. Their role is to assist the leader in its workflow to make requests durable.
- `Observers` are nodes that are not part of the cohort. They are replicas that only accept requests that the leader completes.

# Coordinator

We introduced a specialized agent called the `coordinator`. This separate role is necessary because a generalized approach allows for a large number of nodes in the cohort, making it impractical for every node to health check and respond to failures.

The coordinator is responsible for the following actions:

- Perform health checks on all the nodes of the cohort.
- In case of a failure, perform a failover by appointing a new leader and ensuring that requests that the previous leader might have applied are honored.
- A coordinator can optionally provide the functionality to perform a “planned leader change”.

Coordinators are not part of the cohort. Multiple coordinators can be deployed, and they do not need to be aware of each other’s existence.

In Raft, `leaders` are agents that fulfill requests, and `followers` act as agents when they choose to become candidates. In our approach, the task of changing leadership is taken on by the `coordinators` instead.

For small cohort sizes, nodes can take on the role of coordinators, just like in Raft.

# Term Numbers

We analyzed the problem of ordering in a distributed system. We concluded that assigning monotonically increasing and unique term numbers to each decision resulted in safer solutions.

The agents would use this term number to recruit nodes from older terms. If they succeed at recruiting a sufficient number of them to execute a leadership change, they move forward with the rest of the actions.

As a counterpoint, we demonstrated an engineering approach that utilized locks and timeouts to achieve ordering without relying on term numbers. However, it has trade-offs due to the reliance on clocks and execution time.

# A Raft inspired approach

We will now cover an example inspired by Raft that demonstrates one approach to implementing a system that can accommodate an externally specified durability policy.

As a bonus, we will also show how a change in durability rules can be trivially included as part of this algorithm.

This approach assumes that you are familiar with Raft. For brevity, we will skip over the common parts.

## Components

### Coordinator

The coordinator does not need to persist any information. However, it needs either the current ruleset or a way to discover the existing cohort nodes to initialize itself. While active, it needs the following information:

- Term number
- Ruleset

### Node

A node needs to persist the following:

- Term number
- Ruleset
- A log that allows requests to be appended. You can also truncate the log at a specified point, which will cause all entries up to the end of the log to be deleted.
    - Every log entry contains the term under which the request was made.
- An “applied index” that trails behind the end of the log. It is the point up to which it is safe to apply requests that are present in the log.

Term number rules for cohort nodes:

- A node must honor requests from an agent with a matching term number.
- A node must reject requests from an agent with a lower term number.
- In response to a recruitment, a node must agree to participate in a term number that is higher than the current one.
- A node responds to only one agent for a new term number. If another agent attempts to recruit the node with the same term number, it is rejected.

When recruited, each node returns the following information:

- The current log index
- The term number of the last log entry
- The current ruleset
- The list of ruleset changes in the unapplied parts of the log

### Ruleset

The Ruleset is a data structure that is embedded in the node and persisted by it. Functionally, the ruleset must answer questions about durability, revocation, and candidacy. The following is an example of what a ruleset could look like.

- Name
- List of cohort nodes
- List of eligible primaries, each containing:
    - A list of node groups, where each node group is a valid durability combination

## Completing requests

Unlike Raft, which validates durability by waiting for acks from a majority of followers, the generalized approach validates the acks against the ruleset. Aside from this, the entire algorithm remains the same.

If the request is a ruleset change, the durability rules must satisfy both the previous and the new ruleset. After the ruleset is applied, the leader can proceed with the newer ruleset.

## Leadership Change

In Raft, failure detection and leadership change are handled by individual nodes. In our generalized approach, separate coordinators perform these tasks. However, the actions taken by a coordinator still closely resemble those performed by the candidate in Raft. We do want to highlight how it “thinks” differently.

A coordinator that has decided to change leadership has the following goals:

- Obtain a term number
- Revocation
- Candidacy
- Discovery
- Propagation
- Establishment

Note that these are a restatement of rule 2, except that they are goal-oriented.

### Obtaining a term number, Revocation, Candidacy, and Discovery

A single step achieves the above four goals: The coordinator increments its current term number and sends a message to recruit all the nodes in the cohort.

For the nodes that were successfully recruited, it discovers the most progressed node:

- The log with the highest term number is the most progressed.
- For logs with identical term numbers, the one with the highest index is the most progressed.

From the most progressed node:

- It saves the ruleset returned by that node for subsequent attempts.
- If additional rulesets were returned, they are stored in a temporary list.

It validates revocation and candidacy by ensuring that the recruited nodes satisfy all the rulesets, which include the one returned by the node and the secondary list of in-flight ruleset changes:

- No leader of an older term must be able to complete any more requests.
- The nodes must contain a candidate (or the intended candidate) with a sufficient set of nodes needed to reach quorum.

If these criteria are not met, then the change of leadership cannot proceed. This can happen either because the coordinator was unable to reach all the necessary nodes or because a different coordinator recruited those nodes under the same term.

### Propagation

By now, the coordinator should have identified a candidate and the most progressed node. At this stage, the propagation mechanism can be the same as how Raft’s `AppendEntries` works. However, if there are multiple rulesets, the propagation must satisfy the quorum rules for all of them.

Raft requires that you can commit only when the log's term number matches the current term. We interpret this as an additional constraint on the durability requirements. This requires the entire timeline to become durable under the new term before it can be applied. It is an indirect way to satisfy Rule 2b(ii).

Propagation succeeds when the quorum rules for the candidate are met.

### Establisment

The coordinator moves the applied index to the end of the log and delegates its term number to the candidate. At this point, the candidate becomes the new leader.

# Conclusion

We believe that we have satisfied our goal of generalizing consensus in the following ways:

- Accommodating arbitrarily complex durability requirements.
- Providing a set of governing rules that can be used for different approaches and implementations.

We also have a goal of implementing this approach in Multigres.

If you have any feedback or questions, please create a [Multigres discussion](https://github.com/multigres/multigres/discussions).
