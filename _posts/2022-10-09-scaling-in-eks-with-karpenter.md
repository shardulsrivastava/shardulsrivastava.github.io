---
layout: post
title:  Scaling in EKS with Karpenter
canonical_url: https://dev.to/aws-builders/scaling-in-eks-with-karpenter
author: shardul
tags: [eks, karpenter, autoscaler]
categories: [eks, karpenter, autoscaler]
image: assets/images/karpenter-ca.png
description: "Scaling in EKS with Karpenter"
featured: true
comments: false
---
Kubernetes has become a de-facto standard because it takes care of a lot of complexities internally. One of those complexities is cluster autoscaling i.e provisioning of nodes based on the increased number of workloads.

[Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler) is a project maintained by a community called `sig-autoscaling`, one of the communities under `Kubernetes`. Check out more about Kubernetes Communities [here](https://github.com/kubernetes/community).

Cluster autoscaler supports a number of [cloud providers](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler/cloudprovider) including EKS. [here](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler/cloudprovider/aws) is the guide to setup cluster autoscaler on EKS and various configuration [examples](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler/cloudprovider/aws/examples).

Cluster autoscaler runs in the cluster as an addon and adds or removes the nodes in the cluster to allow the scheduling of workloads. It kicks in when any of the pods are not able to schedule due to insufficient resources. Node groups in EKS are backed by `EC2 Auto Scaling Groups` and CA updates the number of nodes in the ASG based on scale up or down. It also supports Mixed Instance policy for Spot instances that allows users to save costs with Spot instances with the added risk of workload interruption.

While CA takes care of scaling efficiently, there are still issues that EKS users face such as :

1. When there are no instances in the Node group of matching requirements for the workload to be scheduled. It prints these messages in the logs:
```bash
pod didn't trigger scale-up (it wouldn't fit if a new node is added)
```

2. Using too big instances in node groups, leads to low resource utilization and increased cost.

3. Using too low instances in Node groups, leading to node groups maxing out and resulting in unscheduled pods.

4. No way to identify the optimal choice instance types based on workloads.

All of these issues and many more can be solved with...

![khaby]({{ site.baseurl }}/assets/images/khaby.jpeg)

## Karpenter

[Karpenter](https://karpenter.sh/) is an open-source project by AWS that improves the efficiency and cost of running workloads on Kubernetes clusters. It's group less i.e it works by provisioning nodes based on the workload and the nodes provisioned are not part of any ASG.

This allows Karpenter to scale nodes more efficiently and retry in a few milliseconds when node capacity is not available instead of waiting for minutes in case of an ASG and gives the flexibility to provision Instances from a variety of instance types without creating hundreds of node groups.

## Karpenter Installation

Karpenter controller runs on the cluster as deployment and relies on a CRD called [Provisioner](https://karpenter.sh/v0.17.0/provisioner/) to determine how to handle workloads such as consolidate them to save costs, move them to another node with a different instance type to save cost and scale down nodes when they are empty.

### Setup an EKS Cluster with Karpenter enabled

Karpenter can be installed by following the steps in the [Getting Started Guide](https://karpenter.sh/v0.17.0/getting-started/getting-started-with-eksctl/) which involved creating several Cloudformation stacks, IAM role cluster bindings. however, the simplest way to get started is to use `eksctl` that supports out-of-box `karpenter` installation.

Let's create a cluster with `eksctl` with a managed node group and `karpenter` installed:

```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: karpenter-cluster
  region: eu-west-1
  version: "1.22"
  tags:
    karpenter.sh/discovery: karpenter-cluster # Special tag for Karpenter
iam:
  withOIDC: true # required

karpenter:
  version: '0.15.0'
  createServiceAccount: true 

managedNodeGroups:
  - name: managed-ng-1
    minSize: 1
    maxSize: 10
    desiredCapacity: 1
    instanceType: t3.large
    amiFamily: AmazonLinux2
```

this would create a cluster `karpenter-cluster` in the `eu-west-1` region with a managed Node group `managed-ng-1` and a couple of components for `karpenter` to work:

1. `eksctl-KarpenterControllerPolicy-karpenter-cluster` - An [IAM policy](https://github.com/aws/karpenter/blob/30a4a5af24fb065471c9ec1203db861d9eb45ac4/website/content/en/v0.15.0/getting-started/getting-started-with-eksctl/cloudformation.yaml#L34-L66) with permissions to provision nodes and spot instances.
2. `eksctl-karpenter-cluster-iamservice-role` - An IAM role with IAM policy `eksctl-KarpenterControllerPolicy-karpenter-cluster` and attached to the service account used by karpenter to allow it to provision instances.
2. `eksctl-KarpenterNodeRole-karpenter-cluster` - An [IAM role](https://github.com/aws/karpenter/blob/30a4a5af24fb065471c9ec1203db861d9eb45ac4/website/content/en/v0.15.0/getting-started/getting-started-with-eksctl/cloudformation.yaml#L15-L33) for provisioned nodes to work and get registered with the cluster.
3. `eksctl-KarpenterNodeInstanceProfile-karpenter-cluster` - An [Instance profile](https://github.com/aws/karpenter/blob/30a4a5af24fb065471c9ec1203db861d9eb45ac4/website/content/en/v0.15.0/getting-started/getting-started-with-eksctl/cloudformation.yaml#L8-L14) for instance provisioned by Karpenter.
4. `karpenter Helm Release` - Installation of karpenter using [Helm chart](https://github.com/aws/karpenter/tree/main/charts/karpenter).

Now we have `karpenter` installed in the cluster.

### Setup Karpenter Provisioner

To configure Karpenter, you need to create a [Provisioner](https://karpenter.sh/v0.17.0/provisioner/) resource that defines how Karpenter provisions nodes and deletes them. Karpenter has several configuration options. Let's start with the basic Provisioner :

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

Here `subnetSelector` and `securityGroupSelector` values allow karpenter to discover subnets and security groups i.e karpenter would discover the subnets and security groups using these tags and create the node in one of these subnets and attach the discovered security groups to the node.

Let's create a sample `Nginx` deployment with CPU request as `1`

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
![pending pods]({{ site.baseurl }}/assets/images/pod-pending.png)

we can see that at first pod is pending, however then karpenter kicks in as evident from karpenter logs :

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

Immediately we can see that there is an additional launched `ip-192-168-32-230.eu-west-1.compute.internal` by `karpenter`

![karpenter node provisioning]({{ site.baseurl }}/assets/images/node-provisioning.png)

and the pod is running on this node :

![running pods]({{ site.baseurl }}/assets/images/pod-running.png)

Let's inspect the node created by the `karpenter` :

```bash
kubectl get node ip-192-168-32-230.eu-west-1.compute.internal -ojson | jq -r '.metadata.labels'
```

![exlore provisioned node]({{ site.baseurl }}/assets/images/explore-provisioned-node.png)

We can see that it's a spot instance of type `t3.medium`. 

By default, `karpenter` provisions spot instance. However, we can change it to `on-demand` instance too based on our requirements. Let's try to delete the deployment to see if `karpenter` removes the instances.

```bash
kubectl delete deployment nginx
```

![no pods]({{ site.baseurl }}/assets/images/no-pods.png)

and the pod is gone, but the node is still there :

![node still there]({{ site.baseurl }}/assets/images/node-still-there.png)

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

Now karpenter will wait for 60 seconds before it cordons, drains, and deletes the empty node. We can check the details in the `karpenter` logs:

```bash
kubectl -n karpenter logs -f -l app.kubernetes.io/instance=karpenter -c controller

2022-10-09T16:17:08.000Z  INFO  controller.node Triggering termination after 1m0s for empty node  {"commit": "3d87474", "node": "ip-192-168-32-230.eu-west-1.compute.internal"}
2022-10-09T16:17:08.024Z  INFO  controller.termination  Cordoned node {"commit": "3d87474", "node": "ip-192-168-32-230.eu-west-1.compute.internal"}
2022-10-09T16:17:08.184Z  INFO  controller.termination  Deleted node  {"commit": "3d87474", "node": "ip-192-168-32-230.eu-west-1.compute.internal"}
```

**Note:**
For the nodes provisioned by Karpenter,  it adds a [finalizer](https://kubernetes.io/docs/concepts/overview/working-with-objects/finalizers/) for graceful node termination, we can check this by inspecting the node:

```bash
kubectl get nodes ip-192-168-32-230.eu-west-1.compute.internal -ojson | jq -r  '.metadata.finalizers'
[
  "karpenter.sh/termination"
]
```

