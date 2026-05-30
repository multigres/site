---
slug: deploying-the-multigres-operator
authors: [joe]
date: 2026-05-29T09:00
tags: [multigres, postgres, kubernetes]
---

# Deploying the Multigres Operator

This post walks through deploying a multi-zone Multigres cluster on EKS using the operator, connecting to it, and scaling replicas up and down.

<!--truncate-->

Demo Video:

<iframe
  style={{width: '100%', aspectRatio: '16 / 9'}}
  src="https://www.youtube-nocookie.com/embed/ds0bdNlaAoQ"
  title="YouTube video"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
></iframe>

## What the operator manages

The operator manages pods directly, which means it can be primary-aware in ways that StatefulSet rolling updates cannot. When the operator needs to restart pods — for a config change, a scaling event, or a failover — it knows which pod holds the primary and acts accordingly.

The components the operator provisions from a single `MultigresCluster` manifest are:

**GlobalTopoServer** is a managed etcd cluster that records the topology state: which databases exist, which cells they live in, and where every component is registered. Cells are user-defined groupings that map to availability zones. In a multi-zone deployment, the topology splits into a global server for cluster-wide state and per-cell servers for local discovery, so a partitioned cell keeps operating against its own local view.

**MultiAdmin** is the management plane for the cluster, including a web UI.

**MultiGateway** speaks the Postgres wire protocol. Your application connects to a gateway, which forwards queries to the right MultiPooler over gRPC. Adding more gateways scales Multigres’ connection capacity horizontally.

**MultiOrch:** the orchestrator. One set of MultiOrch instances per shard, running across cells. It watches replication health, appoints leaders through a consensus protocol, runs failovers, and coordinates bootstrap, backup, restore, and scaling events. When you apply the manifest, MultiOrch runs bootstrap as a consensus-backed election. This is the same code path as every later failover. So there is no separate provisioning script that can race with itself.

**Postgres** pods themselves, managed by pgctld which owns the local Postgres process and MultiPooler. One pooler per Postgres instance.

## Deploying on EKS

The EKS getting started guide published today covers prerequisites, zone labels, storage, S3 backup identity, and the full cluster manifest. The short version of what you need is a kubeconfig pointed at an EKS cluster with the operator installed and a manifest that looks roughly like this:

```yaml
apiVersion: multigres.com/v1alpha1
kind: MultigresCluster
metadata:
  name: <CLUSTER_NAME>               # e.g. demo-multi-az
  namespace: <NAMESPACE>             # e.g. eks-demo
  annotations:
    multigres.com/project-ref: <PROJECT_REF>  # e.g. proj-release-v01-demo
spec:
  pvcDeletionPolicy:
    whenDeleted: Delete
    whenScaled: Delete

  durabilityPolicy: AT_LEAST_2

  templateDefaults:
    coreTemplate: eks-smallest
    cellTemplate: eks-smallest
    shardTemplate: eks-smallest

  postgresPasswordSecretRef:
    name: <PASSWORD_SECRET_NAME>     # e.g. multigres-admin-password
    key: password

  backup:
    type: filesystem
    filesystem:
      path: /backups
      storage:
        size: 10Gi

  images:
    imagePullPolicy: Always

    # Same Multigres runtime image used by all Multigres components.
    multiadmin: <ECR_REGISTRY>/multigres:<IMAGE_TAG>
    multigateway: <ECR_REGISTRY>/multigres:<IMAGE_TAG>
    multiorch: <ECR_REGISTRY>/multigres:<IMAGE_TAG>
    multipooler: <ECR_REGISTRY>/multigres:<IMAGE_TAG>

    # pgctld/Postgres image.
    postgres: <ECR_REGISTRY>/pgctld:<IMAGE_TAG>

    # Web UI image.
    multiadminWeb: ghcr.io/multigres/multiadmin-web:<MULTIADMIN_WEB_TAG>

  cells:
    - name: <CELL_NAME_A>            # e.g. zone-a
      zoneId: <ZONE_ID_A>            # e.g. use1-az1
    - name: <CELL_NAME_B>            # e.g. zone-b
      zoneId: <ZONE_ID_B>            # e.g. use1-az2
    - name: <CELL_NAME_C>            # e.g. zone-d
      zoneId: <ZONE_ID_C>            # e.g. use1-az6

  databases:
    - name: postgres
      default: true
      backup:
        type: s3
        s3:
          bucket: <S3_BUCKET>        # e.g. multigres-backups-dev-242108887234
          region: <AWS_REGION>       # e.g. us-east-1
          keyPrefix: <S3_KEY_PREFIX> # e.g. eks-demo-demo-multi-az-v0.1/
          serviceAccountName: <BACKUP_SERVICE_ACCOUNT>  # e.g. multigres-backup
      tablegroups:
        - name: default
          default: true
          shards:
            - name: 0-inf
              spec:
                pools:
                  default:
                    replicasPerCell: <REPLICAS_PER_CELL>  # e.g. 1
                    storage: {}
                    multipooler:
                      resources: {}
                    postgres:
                      resources: {}
                multiorch:
                  resources: {}
```

Three cells, each mapped to a real AWS availability zone. `AT_LEAST_2` durability means every committed write is acknowledged by one standby (one primary and one standby). The operator infers everything else from the templates — resource limits, gateway configuration, topo server sizing — and builds the full topology.

`kubectl apply -f demo-multi-az.yaml` and then `kubectl get pods -w`. Within a minute you have a global topo server, MultiAdmin, MultiGateway, MultiOrch across three zones, and Postgres pool pods across three zones.

### Apply the YAML

```bash
kubectl apply -f demo-multi-az.yaml
```

Watch the pods come up:

```bash
kubectl get pods -w
```

You should eventually see pods for global topo, multiadmin, multigateway, multiorch, and three poolers.

### Verify the cluster

Check the Multigres resources:

```bash
kubectl get multigresclusters
kubectl get shards
```

Check the pods:

```bash
kubectl get pods
```

## Scaling

Scaling replicas is a spec change on the `MultigresCluster`. Child resources are owned by the operator and reconciled back to the desired state if edited directly. To add a replica per cell:

```bash
kubectl patch multigrescluster demo-multi-az \
  --type=json \
  -p='[{"op":"replace","path":"/spec/databases/0/tablegroups/0/shards/0/spec/pools/default/replicasPerCell","value":2}]'
```

The operator provisions new standby pods across all three zones simultaneously. Scale back down by patching the value to `1`. The operator drains standbys out of the replication set before terminating their pods.

### Scaling down

```bash
kubectl patch multigrescluster demo-multi-az -n eks-demo --type=json -p \
  '[{"op":"replace","path":"/spec/databases/0/tablegroups/0/shards/0/spec/pools/default/replicasPerCell","value":1}]'
```

## Connecting

Applications inside the cluster connect through the MultiGateway service:

`postgresql://postgres:<password>@demo-multi-az-multigateway:5432/postgres`

The gateway speaks standard Postgres wire protocol. The gateway routes writes to the primary's pooler and, if the application opts in, routes reads to replicas.
