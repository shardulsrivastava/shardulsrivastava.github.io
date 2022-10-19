---
layout: post
title:  Getting Started with ACK RDS Controller
canonical_url: 
author: shardul
tags: [rds, ack, controller, kubernetes]
categories: [rds, ack, controller, kubernetes]
image: assets/images/ack-controller-for-rds.png
description: "Getting Started with ACK RDS Controller"
featured: true
comments: false
---
[ACK controller for RDS](https://github.com/aws-controllers-k8s/rds-controller) is a [Kubernetes Controller](https://kubernetes.io/docs/concepts/architecture/controller/) for provisioning RDS instances in a kubernetes native way.

`ACK controller for RDS` supports creating these database engines:

1. Amazon Aurora (MySQL & PostgreSQL)
2. Amazon RDS for PostgreSQL
3. Amazon RDS for MySQL
4. Amazon RDS for MariaDB
5. Amazon RDS for Oracle
6. Amazon RDS for SQL Server

## Install ACK Controller for RDS

Let's start by setting up an EKS cluster. `ACK Controller for RDS` requires `AmazonRDSFullAccess` to create and manage RDS instances.
We will also create a service account `ack-rds-controller` for `ACK Controller for RDS` and attach [AmazonRDSFullAccess](https://github.com/aws-controllers-k8s/rds-controller/blob/main/helm/values.yaml#L81) IAM permissions to this service account with the help of [IRSA](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html).

```bash
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: ack-cluster
  region: eu-west-1
  version: "1.22"
iam:
  withOIDC: true
  serviceAccounts:
    - metadata:
        # Service account used by rds-controller https://github.com/aws-controllers-k8s/rds-controller/blob/main/helm/values.yaml#L81
        name: ack-rds-controller
        namespace: ack-system
      # https://github.com/aws-controllers-k8s/rds-controller/blob/main/config/iam/recommended-policy-arn
      attachPolicyARNs: 
      - "arn:aws:iam::aws:policy/AmazonRDSFullAccess"

managedNodeGroups:
  - name: managed-ng-1
    minSize: 1
    maxSize: 10
    desiredCapacity: 1
    instanceType: t3.large
    amiFamily: AmazonLinux2
```

```bash
eksctl create cluster -f ack-cluster.yaml
```
 Once the cluster is created, install the `ACK Controller for RDS` using [Helm chart](https://gallery.ecr.aws/aws-controllers-k8s/rds-chart). `ACK Controller for RDS` helm charts are stored in the public ECR repository.

 **Note:** Check the latest version of the helm chart [here](https://gallery.ecr.aws/aws-controllers-k8s/rds-chart)

 Authenticate to the ECR repo using your AWS credentials :

 ```bash
 aws ecr-public get-login-password --region us-east-1 | helm registry login --username AWS --password-stdin public.ecr.aws
 Login Succeeded
 ```

 Once you're authenticated, install `ACK Controller for RDS` in the `ack-system` namespace :

 ```bash
 helm upgrade \
	--install \
	--create-namespace \
	ack-rds \
	-n ack-system \
	oci://public.ecr.aws/aws-controllers-k8s/rds-chart \
	--version=v0.1.1 \
	--set=aws.region=eu-west-1 \
	--set=serviceAccount.create=false \
	--set=log.level=debug
 ```

During installation, we are setting these values in the Helm chart:

1. `aws.region` - AWS Region for API Calls.
2. `serviceAccount.create` - Setting this to false, since serviceAccount is created by eksctl during cluster creation above.
3. `log.level` - Setting this to `debug` to see detailed logs.

`ACK controller for RDS` installs several CRDs that allow you to provision RDS instances and related components:

1. **`GlobalCluster`** - Custom resource to create [Aurora Global cluster](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html).
2. **`DBCluster`** - Custom resource to create [Amazon Aurora DB Cluster](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html).
3. **`DBInstance`** - Custom resource to create [Amazon RDS DB Instances](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.DBInstance.html).
4. **`DBClusterParameterGroup`** - Custom resource to create [DB cluster parameter groups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithDBClusterParamGroups.html).
5. **`DBParameterGroup`** - Custom resource to create [DB parameter groups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithDBInstanceParamGroups.html).
6. **`DBProxy`** - Custom resource to create [Amazon RDS Proxy](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html)
7. **`DBSubnetGroup`** - Custom resource to create [DB Subnet Group](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_VPC.WorkingWithRDSInstanceinaVPC.html).

**Note:**. Refer [here](https://aws-controllers-k8s.github.io/community/reference/rds/v1alpha1/dbcluster/) for the reference of these CRDs. 

Check `ACK controller for RDS` logs in cluster:

```bash
kubectl logs -f -l app.kubernetes.io/instance=ack-rds
```

### Create Autora PostgreSQL Cluster with RDS Controller

To create an Aurora PostgreSQL Cluster with `ACK controller for RDS`, we have to first create a DB Subnet Group using `DBSubnetGroup`, then create a Aurora Cluster using `DBCluster` and add two Aurora Database instances in the cluster using `DBInstance`.

1. Create a DB Subnet Group `test-ack-subnetgroup` with all the subnets that are part of the VPC created by eksctl or use your existing subnets:

	```yaml
	apiVersion: rds.services.k8s.aws/v1alpha1
	kind: DBSubnetGroup
	metadata:
	  name: "test-ack-subnetgroup"
	spec:
	  name: "test-ack-subnetgroup"
	  description: "Test ACK Subnet Group"
	  subnetIDs:
	    - "subnet-011e4c822231b65fa"
	    - "subnet-001ce16b9b7c3578f"
	    - "subnet-0a90579d9b066ecf7"
	    - "subnet-00e6d2e90ea132c8b"
	    - "subnet-0fbc22e542749c98c"
	    - "subnet-080c0b1ed39b0aa91"
	  tags:
	    - key: "created-by"
	      value: "ack-rds"
	```

	**Note:** To get all the subnets created by eksctl, run command:
	```bash
	eksctl get cluster ack-cluster -o json| jq -r '.[0].ResourcesVpcConfig.SubnetIds' 
	```

2. Check the status of `test-ack-subnetgroup` DB Subnet Group :
	```bash
	kubectl get dbsubnetgroup test-ack-subnetgroup -ojson| jq -r '.status.subnetGroupStatus'
	Complete
	```
	if it returns `Complete`, then `DB Subnet group` is successfully created.

3. Create a secret to store the password of the master user :

	```bash
	kubectl create secret generic "test-ack-master-password" --from-literal=DATABASE_PASSWORD="mypassword"
	secret/test-ack-master-password created
	```

4. Create an Aurora DB Cluster `test-ack-aurora-cluster` using `DBCluster` :
	```yaml
	apiVersion: rds.services.k8s.aws/v1alpha1
	kind: DBCluster
	metadata:
	  name: "test-ack-aurora-cluster"
	spec:
	  engine: aurora-postgresql
	  engineVersion: "14.4"
	  engineMode: provisioned
	  dbClusterIdentifier: "test-ack-aurora-cluster"
	  databaseName: test-ack
	  dbSubnetGroupName: test-ack-subnetgroup
	  deletionProtection: true
	  masterUsername: "test"
	  masterUserPassword:
	    namespace: "default"
	    name: "test-ack-master-password"
	    key: "DATABASE_PASSWORD"
	  storageEncrypted: true
	  enableCloudwatchLogsExports:
	    - postgresql
	  backupRetentionPeriod: 14
	  copyTagsToSnapshot: true
	  preferredBackupWindow: 00:00-01:59
	  preferredMaintenanceWindow: sat:02:00-sat:04:00

	```
5. Once created, check the status of `DBCluster` resource `test-ack-aurora-cluster`:

	```bash
	kubectl describe DBCluster test-ack-aurora-cluster
	```

	if the status is `available` then Aurora DB Cluster is successfully created.

6. After `DBCluster` is successfully created, add two Aurora DB Instances `test-ack-aurora-instance-1` and `test-ack-aurora-instance-2` to the DB cluster using `DBInstance` : 
	```yaml
	apiVersion: rds.services.k8s.aws/v1alpha1
	kind: DBInstance
	metadata:
	  name: test-ack-aurora-instance-1
	spec:
	  dbInstanceClass: db.t4g.medium
	  dbInstanceIdentifier: test-ack-aurora-instance-1
	  dbClusterIdentifier: "test-ack"
	  engine: aurora-postgresql
	---
	apiVersion: rds.services.k8s.aws/v1alpha1
	kind: DBInstance
	metadata:
	  name: test-ack-aurora-instance-2
	spec:
	  dbInstanceClass: db.t4g.medium
	  dbInstanceIdentifier: test-ack-aurora-instance-2
	  dbClusterIdentifier: "test-ack"
	  engine: aurora-postgresql
	```

	When these instances are available, one of them will be a **Writer Instance** and other one will be a **Reader Instance**.

7. Check the status of `DBInstance` :

	```bash
	kubectl describe DBInstance test-ack-aurora-instance-1
	kubectl describe DBInstance test-ack-aurora-instance-2
	```

	![rds-instance-status](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/os1m6jt0qf7rxd685fzj.png)


	Status `available` means that DB Instances are ready to use now.
 

8. Get the `Writer Endpoint` of the Aurora RDS cluster:

	```bash
	kubectl get dbcluster test-ack-aurora-cluster -ojson| jq -r '.status.endpoint'

	test-ack-aurora-cluster.cluster-cncphmukmdde.eu-west-1.rds.amazonaws.com
	```

9. Get the `Reader Endpoint` of the Aurora RDS cluster:

	```bash
	kubectl get dbcluster test-ack-aurora-cluster -ojson| jq -r '.status.readerEndpoint'

	test-ack-aurora-cluster.cluster-ro-cncphmukmdde.eu-west-1.rds.amazonaws.com
	```


When you have the Aurora DB Cluster provisioned, you would want to extract values such as `Reader Endpoint` and `Writer Endpoint` and configure them in the application to connect to the cluster.

`ACK controller for RDS` provides a way to import these values directly from the `DBCluster` or `DBInstance` resource to a desired `Configmap` or `Secret`.

### Export the Database Details in a Configmap

`FieldExport` CRD allows you to export any spec or status field from a `DBCluster` or `DBInstance` resource into a ConfigMap.

1. Create an empty `ConfigMap` :

	```bash
	kubectl create cm ack-cluster-config
	configmap/ack-cluster-config created
	```

2. Create a `FieldExport` to import the value of `.status.endpoint` from `test-ack-aurora-cluster` DBCluster resource to the ConfigMap `ack-cluster-config` :

	```yaml
	apiVersion: services.k8s.aws/v1alpha1
	kind: FieldExport
	metadata:
	  name: ack-cm-field-export
	spec:
	  from:
	    resource:
	      group: rds.services.k8s.aws
	      kind: DBCluster
	      name: test-ack-aurora-cluster
	    path: ".status.endpoint"
	  to:
	    kind: configmap
	    name: ack-cluster-config
	    key: DATABASE_HOST
	```

3. Inspect the values of ConfigMap `ack-cluster-config`

	```bash
	kubectl get cm ack-cluster-config -ojson|jq -r '.data'
	```

	![ack-field-export-cm](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/lo1dnn2lld88r6ii4krt.png)

### Export the Database Details in a Secret

`FieldExport` CRD allows you to export any spec or status field from a `DBCluster` or `DBInstance` into a Secret.

1. Create an empty `Secret` :

	```bash
	kubectl create secret generic ack-cluster-secret
	secret/ack-cluster-secret created
	```

2. Create a `FieldExport` to import the value of `.status.endpoint` from `test-ack-aurora-cluster` DBCluster resource to the Secret `ack-cluster-secret` :

	```yaml
	apiVersion: services.k8s.aws/v1alpha1
	kind: FieldExport
	metadata:
	  name: ack-secret-field-export
	spec:
	  from:
	    resource:
	      group: rds.services.k8s.aws
	      kind: DBCluster
	      name: test-ack-aurora-cluster
	    path: ".status.endpoint"
	  to:
	    kind: secret
	    name: ack-cluster-secret
	    key: DATABASE_HOST
	```

3. Inspect the values of Secret `ack-cluster-secret`

	```bash
	kubectl view-secret ack-cluster-secret --all
	```

	![ack-field-export-secret](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ha83dbp7fsdvj5ls0zf7.png)

	**Note:** `view-secret` is a kubectl plugin, check out my [blog](https://shardul.dev/most-useful-kubectl-plugins/) on how to use this plugin.

## Important - Clean up

To clean up the clusters, first disable the delete protection by setting `.spec.deletionProtection` to false for the `test-ack-aurora-cluster` DBCluster resource:

```bash
kubectl apply -f test-ack-aurora-cluster.yaml

dbcluster.rds.services.k8s.aws/test-ack-aurora-cluster configured
```

Now, you can proceed to delete the instances first and then cluster:

```bash
kubectl delete -f test-ack-aurora-instance.yaml
kubectl delete -f test-ack-aurora-cluster.yaml
```

