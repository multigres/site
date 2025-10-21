---
sidebar_position: 9
title: "Part 9: Consistent Reads"
---

# Part 9: Consistent Reads

import Author from '@site/src/components/Author';

<Author
  name="Sugu Sougoumarane"
  title="Creator of Multigres, Vitess"
  imageUrl="https://github.com/sougou.png"
/>

Most official publications of consensus protocols have paid lip service to the issue of consistent reads. Implementors of these protocols have each developed their own methods for achieving consistency, and they all involve trade-offs.

The reason for this avoidance is that no solution is both perfect and performant. These properties determine the trade-offs.

- Consensus is a replicated system. There is no guarantee that a follower has the latest data.
- The current leader is guaranteed to have the latest data, but there is no guarantee that you know who the current leader is.

One important factor to keep in mind is that leader terms are expected to last a long time in the order of days. A planned leader change typically happens once a week. Unplanned leader changes might be even less common. This is a key factor to consider when choosing your solution.

At this point, we have the opportunity to reintroduce `observers`. These nodes are not part of the cohort, but they receive completed requests and can be used for reads. We will refer to the combination of followers and observers as replicas.

Here are a few approaches:

# Leader lease

The lease approach involves giving a leader a lease once appointed. During this period, the system will not revoke its leadership. The leader can renew its lease either by completing requests or through heartbeats. If a leader cannot renew its lease, it will stop serving reads before the lease expires.

There are a few disadvantages:

- We trust the clock.
- If the leader becomes unreachable, you have to wait till the lease expires before appointing another leader.
- We lose the opportunity to distribute reads across the replicas.

*For reference, Spanner supposedly uses this approach with a lease period of ten seconds.*

# Leader heartbeat read

In this approach, the leader sends out heartbeats for every read. If a valid quorum of followers respond with the same term number, then it knows the leadership has not been revoked yet. It can respond to the read request.

Downsides:

- The cost of a read is as high as the network cost of completing requests.
- We lose the opportunity to distribute reads across the replicas.

# Log index based read

This method works for a single client. For each successful write request, the leader returns the log position of the request. The client can request a read from any replica by requiring it to wait until it reaches that position before serving the read.

An advantage of this approach is that reads can be load-balanced across multiple replicas.

Downsides:

- Replica lag or network partitions can impact read performance.
- Only the client that wrote the last request knows the latest position of its request.

# Replica heartbeat read

This is a combination of the leader heartbeat read and the log index-based read. In this case, the read is sent to a replica, which sends out a heartbeat to the current leader and its quorum nodes. For its response, it must receive matching term numbers as well as the latest apply index from the leader. The replica waits until its own apply index reaches that of the leader, and then it can serve the read.

This allows reads to be load-balanced across multiple replicas. Also, this read works even if the client did not perform the last write.

Downsides:

- The cost of a read is as high as the network cost of completing requests.
- Replica lag or network partitions can impact read performance.

# Eventually consistent reads

If the application can tolerate stale reads, those reads can be directed to any replica. There are many use cases where a certain level of staleness is acceptable. Based on this, we recommend setting a staleness tolerance and having the system reject reads that exceed this limit.
