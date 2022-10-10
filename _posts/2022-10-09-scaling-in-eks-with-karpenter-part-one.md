---
layout: post
title:  Scaling in EKS with Karpenter - Part 1
canonical_url: https://dev.to/aws-builders/scaling-in-eks-with-karpenter-part-1-3c7e
author: shardul
tags: [eks, karpenter, autoscaler]
categories: [eks, karpenter, autoscaler]
image: assets/images/karpenter-ca.png
description: "Scaling in EKS with Karpenter - Part 1"
featured: true
comments: false
---
Kubernetes has become a de-facto standard because it takes care of a lot of complexities internally. One of those complexities is cluster autoscaling i.e provisioning of nodes based on the increased number of workloads.

[Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler) is a project maintained by a community called `sig-autoscaling`, one of the communities under `Kubernetes`. Check out more about Kubernetes Communities [here](https://github.com/kubernetes/community).

`Cluster autoscaler` supports a number of [cloud providers](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler/cloudprovider) including EKS. [here](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler/cloudprovider/aws) is the guide to setup `cluster autoscaler` on EKS and various configuration [examples](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler/cloudprovider/aws/examples).

`Cluster autoscaler` runs in the cluster as an addon and adds or removes the nodes in the cluster to allow the scheduling of workloads. It kicks in when any of the pods are not able to schedule due to insufficient resources. Node groups in EKS are backed by `EC2 Auto Scaling Groups` and `CA` updates the number of nodes in the ASG dynamically to ensure pods are scheduled. It also supports **Mixed Instance policy** for Spot instances that allows users to save costs with Spot instances with the added risk of workload interruption.

While `CA` takes care of the scaling efficiently, there are still issues that EKS users face such as :

1. When there are no node in the Node group that matches the requirements of the pod and the pod remains unscheduled, which could cause an outage.
> While debugging these types of issues a common error message in autoscaler logs is `pod didn't trigger scale-up (it wouldn't fit if a new node is added)`

2. Using too big instances in node groups, which leads to low resource utilization and increased cost.

3. Using too low instances in Node groups, which leads to node groups maxing out and resulting in unscheduled pods.

4. No way to identify the optimal choice of instance types based on workloads.

All of these issues and many more can be solved with...

![khaby](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/lmpjvhoxdnpfj79740e8.jpeg)

## Karpenter

[Karpenter](https://karpenter.sh/) is an open-source project by AWS that improves the efficiency and cost of running workloads on **Kubernetes clusters** (not just EKS, it's designed to have support for multiple cloud providers). 

Karpenter is group less i.e it works by provisioning nodes based on the workload and the provisioned nodes are not part of any ASG.

This allows `Karpenter` to scale nodes more efficiently, retry in a few milliseconds when node capacity is not available instead of waiting for minutes in case of an ASG and gives the flexibility to provision instances from a variety of instance types without creating hundreds of node groups.

## Karpenter Installation

`Karpenter controller` runs on the cluster as a deployment and relies on a CRD called [Provisioner](https://karpenter.sh/v0.17.0/provisioner/) to configure it's behaviour to handle workloads such as consolidate them to save costs, move them to another node with a different instance type and scale down nodes when they are empty.

### Setup an EKS Cluster with Karpenter enabled

`Karpenter` can be installed by following the steps in the [Karpenter - Getting Started Guide](https://karpenter.sh/v0.17.0/getting-started/) which involves creating several Cloudformation stacks, IAM role cluster bindings. IMO, the simplest way to get started is to use `eksctl` that has support for `karpenter` installation out-of-box.

Let's create a cluster with `eksctl` with a managed node group and `karpenter` installed:

```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: karpenter-cluster
  region: eu-west-1
  version: "1.22"
  tags:
    karpenter.sh/discovery: karpenter-cluster # Special tag for Karpenter that it uses to discover subnets and security groups
iam:
  withOIDC: true # required

karpenter:
  version: '0.15.0' # Current version of eksctl only supports 0.15.0 of karpenter.
  createServiceAccount: true 

managedNodeGroups:
  - name: managed-ng-1 # Managed node group for karpenter controller itself, could use fargate too that would be much simpler.
    minSize: 1
    maxSize: 10
    desiredCapacity: 1
    instanceType: t3.large
    amiFamily: AmazonLinux2
```

this would create an EKS cluster `karpenter-cluster` in the `eu-west-1` region with a managed Node group `managed-ng-1`, install few of components for `karpenter` to work : 

1. `eksctl-KarpenterControllerPolicy-karpenter-cluster` - An [IAM policy](https://github.com/aws/karpenter/blob/30a4a5af24fb065471c9ec1203db861d9eb45ac4/website/content/en/v0.15.0/getting-started/getting-started-with-eksctl/cloudformation.yaml#L34-L66) with permissions to provision nodes and spot instances.
2. `eksctl-karpenter-cluster-iamservice-role` - An IAM role with IAM policy `eksctl-KarpenterControllerPolicy-karpenter-cluster` and attached to the service account used by `karpenter` to allow it to provision instances.
2. `eksctl-KarpenterNodeRole-karpenter-cluster` - An [IAM role](https://github.com/aws/karpenter/blob/30a4a5af24fb065471c9ec1203db861d9eb45ac4/website/content/en/v0.15.0/getting-started/getting-started-with-eksctl/cloudformation.yaml#L15-L33) for provisioned nodes to work and get registered with the cluster.
3. `eksctl-KarpenterNodeInstanceProfile-karpenter-cluster` - An [Instance profile](https://github.com/aws/karpenter/blob/30a4a5af24fb065471c9ec1203db861d9eb45ac4/website/content/en/v0.15.0/getting-started/getting-started-with-eksctl/cloudformation.yaml#L8-L14) for instance provisioned by `Karpenter`.
4. `karpenter Helm Release` - Installation of `karpenter` using [Helm chart](https://github.com/aws/karpenter/tree/main/charts/karpenter).

### Setup Karpenter Provisioner

To configure `Karpenter`, you need to create a [Provisioner](https://karpenter.sh/v0.17.0/provisioner/) resource that defines how `Karpenter` provisions nodes and removes them. It has several configuration options but we will start with the basic **Provisioner** :

```yaml
apiVersion: karpenter.sh/v1alpha5
kind: Provisioner
metadata:
  name: default
spec:
  provider: 
    subnetSelector:
      karpenter.sh/discovery: karpenter-cluster
    securityGroupSelector:
      karpenter.sh/discovery: karpenter-cluster
```
> For the sake of simplicity, we are using `provider` definiton directly, however recommendaion is to create another CRD of type `AWSNodeTemplate` and refer to it using `providerRef` configuration.

Here `subnetSelector` and `securityGroupSelector` values allow `karpenter` to discover **subnets** and **security groups** i.e `karpenter` would discover the subnets and security groups using these tags and create the node in one of these subnets and attach the discovered security groups to the node.

Let's create a sample deployment for `Nginx` with CPU request as `1`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: nginx
  name: nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - image: quay.io/shardul/nginx:v1
        name: nginx
        imagePullPolicy: Always
        resources:
          requests:
            cpu: 1
```

Check if pods are running : 

```bash
kubectl get pods
```
![pending pods](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/0glsctppx7ovfebtn8kg.png)

Initially Nginx pod is pending, `karpenter` detects a pending pod and kicks in to create a node to accomodate the pending pod, Check the `karpenter` cntroller logs to see the details : 

```bash
kubectl -n karpenter logs -f -l app.kubernetes.io/instance=karpenter -c controller

2022-10-09T15:35:31.066Z  INFO  controller.provisioning Computed 1 new node(s) will fit 1 pod(s)  {"commit": "3d87474"}
2022-10-09T15:35:31.253Z  DEBUG controller.provisioning.cloudprovider Discovered subnets: [subnet-0bb805312e46db35f (eu-west-1b) subnet-05bd621d69320799a (eu-west-1c) subnet-02828f6cf56a0eabc (eu-west-1a) subnet-0d94022cc49b76aeb (eu-west-1a) subnet-09ebfc5011dbf69fb (eu-west-1b) subnet-084a73ba681d60241 (eu-west-1c)] {"commit": "3d87474", "provisioner": "default"}
2022-10-09T15:35:31.387Z  DEBUG controller.provisioning.cloudprovider Discovered security groups: [sg-03a9dd659d9a0b8fd sg-00a2bf520128db45b] {"commit": "3d87474", "provisioner": "default"}
2022-10-09T15:35:31.390Z  DEBUG controller.provisioning.cloudprovider Discovered kubernetes version 1.22  {"commit": "3d87474", "provisioner": "default"}
2022-10-09T15:35:31.425Z  DEBUG controller.provisioning.cloudprovider Discovered ami-04f335c3e4d6dcfad for query "/aws/service/eks/optimized-ami/1.22/amazon-linux-2-arm64/recommended/image_id"  {"commit": "3d87474", "provisioner": "default"}
2022-10-09T15:35:31.446Z  DEBUG controller.provisioning.cloudprovider Discovered ami-0ed22cc46dcbf16ed for query "/aws/service/eks/optimized-ami/1.22/amazon-linux-2/recommended/image_id"  {"commit": "3d87474", "provisioner": "default"}
2022-10-09T15:35:31.483Z  DEBUG controller.provisioning.cloudprovider Discovered launch template Karpenter-karpenter-cluster-5093968976540638239  {"commit": "3d87474", "provisioner": "default"}
2022-10-09T15:35:31.523Z  DEBUG controller.provisioning.cloudprovider Discovered launch template Karpenter-karpenter-cluster-9263159034123731516  {"commit": "3d87474", "provisioner": "default"}
2022-10-09T15:35:33.829Z  INFO  controller.provisioning.cloudprovider Launched instance: i-0aa11b1f2eb52b92d, hostname: ip-192-168-32-230.eu-west-1.compute.internal, type: t3.medium, zone: eu-west-1c, capacityType: spot {"commit": "3d87474", "provisioner": "default"}
2022-10-09T15:35:33.837Z  INFO  controller.provisioning Created node with 1 pods requesting {"cpu":"1125m","pods":"3"} from types t4g.micro, t3a.micro, t3.micro, t4g.small, t3a.small and 477 other(s) {"commit": "3d87474", "provisioner": "default"}
```

Immediately we can see that there is an **additional node** `ip-192-168-32-230.eu-west-1.compute.internal` launched by `karpenter`

![karpenter node provisioning](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/d32ehnon5ejhuk6kjw9q.png)

and the pod is running on this node:

![running pods](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/p3ie67un6m2gwnajr5d1.png)

Let's inspect the node created by the `karpenter` :

```bash
kubectl get node ip-192-168-32-230.eu-west-1.compute.internal -ojson | jq -r '.metadata.labels'
```

![exlore provisioned node](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/5k96cb913tn671rg1yql.png)

We can see that it's a [spot instance](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html) of type `t3.medium`. 

By default, `karpenter` provisions **spot instance**. However, we can change it to `on-demand` instance too based on our requirements. Let's try to delete the deployment to see if `karpenter` removes the instances.

```bash
kubectl delete deployment nginx
```

![no pods](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/cezbqyqu40n88kifs7y9.png)

and the pod is gone, but the node is still there :

![node still there](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/5j1uo2dpth2547l6765g.png)

### ttlSecondsAfterEmpty

With `ttlSecondsAfterEmpty`, Karpenter deletes empty instances after the TTL is elapsed.

Let's update the Provisioner to this value :

```yaml
apiVersion: karpenter.sh/v1alpha5
kind: Provisioner
metadata:
  name: default
spec:
  ttlSecondsAfterEmpty: 60
  provider:
    subnetSelector:
      karpenter.sh/discovery: karpenter-cluster
    securityGroupSelector:
      karpenter.sh/discovery: karpenter-cluster
```

Now `karpenter` will wait for 60 seconds before it cordons, drains, and deletes the empty node. We can check the details in the `karpenter` logs:

```bash
kubectl -n karpenter logs -f -l app.kubernetes.io/instance=karpenter -c controller

2022-10-09T16:17:08.000Z  INFO  controller.node Triggering termination after 1m0s for empty node  {"commit": "3d87474", "node": "ip-192-168-32-230.eu-west-1.compute.internal"}
2022-10-09T16:17:08.024Z  INFO  controller.termination  Cordoned node {"commit": "3d87474", "node": "ip-192-168-32-230.eu-west-1.compute.internal"}
2022-10-09T16:17:08.184Z  INFO  controller.termination  Deleted node  {"commit": "3d87474", "node": "ip-192-168-32-230.eu-west-1.compute.internal"}
```

**Note:**
For the nodes provisioned by `Karpenter`,  it adds a [finalizer](https://kubernetes.io/docs/concepts/overview/working-with-objects/finalizers/) for graceful node termination, we can check this by inspecting the node:

```bash
kubectl get nodes ip-192-168-32-230.eu-west-1.compute.internal -ojson | jq -r  '.metadata.finalizers'
[
  "karpenter.sh/termination"
]
```

