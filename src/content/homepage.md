# Multigres

> Multigres is a horizontally scalable architecture for PostgreSQL supporting multi-tenant, highly available, and globally distributed deployments, while staying true to standard Postgres.

Multigres adds horizontal scaling, connection pooling, and cluster orchestration to PostgreSQL without forking it. It runs unmodified PostgreSQL workloads behind a wire-protocol-compatible proxy layer.

## Components

- **Multigateway** — PostgreSQL wire-protocol proxy. Accepts client connections, parses SQL, applies routing rules, and routes queries to poolers.
- **Multipooler** — connection pooler managing pools per PostgreSQL instance, session state, prepared statements, and transactions.
- **Pgctld** — PostgreSQL process manager: start/stop/restart instances, base backups, WAL archiving.
- **Multiorch** — cluster orchestration with Raft-based consensus, primary election, and failover coordination.
- **Multiadmin** — administrative API for cluster management operations.
- **Operator** — Kubernetes operator for deploying and managing Multigres clusters.

## Learn more

- Documentation: https://multigres.com/docs
- Blog: https://multigres.com/blog
- Source: https://github.com/multigres/multigres
