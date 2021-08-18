---
layout: post
title:  "EKS IAM Permissions Deep Dive"
author: shardul
tags: [eks, iam, serviceaccount, deepdive]
categories: [eks, iam, serviceaccount, deepdive]
image: assets/images/aws-
eks-iam.png
description: "EKS IAM Permissions Deep Dive"
featured: true
comments: false
---

Amazon EKS cluster consists of [Managed Node Groups](https://docs.aws.amazon.com/eks/latest/userguide/managed-node-groups.html), [Self Managed Node Groups](https://docs.aws.amazon.com/eks/latest/userguide/worker.html) and [Fargate profiles](https://docs.aws.amazon.com/eks/latest/userguide/fargate-profile.html). EKS fargate is serverless and creates one fargate node for every pod and is attached to one or more namespace or selector while nodegroups are autoscaling groups with actual ec2 instances.


## IAM Permissions for Managed Nodegroups
Whenever we create an EKS cluster using `eksctl` with nodegroups like below configuration :

```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: monitoring-cluster
  region: us-east-1
  version: "1.21"

availabilityZones: 
  - us-east-1a
  - us-east-1b
  - us-east-1c

managedNodeGroups:
  - name: managed-ng-1
    instanceType: t3a.medium
    minSize: 1
    maxSize: 4
    desiredCapacity: 4
```

`eksctl` automatically creates an IAM role with minimum IAM permissions required for cluster to work and attaches it to the nodes part of the cluster. All the pods running on these nodes inherit these permissions.

This role has 3 policies attached that gives basic access to the node :

1. `AmazonEKSWorkerNodePolicy` - This policy allows EKS worker nodes to connect to EKS clusters.
2. `AmazonEC2ContainerRegistryReadOnly` - This policy gives read only access to ECR.
3. `AmazonEKS_CNI_Policy` - This policy is required for [amazon-vpc-cni](https://github.com/aws/amazon-vpc-cni-k8s#setup) plugin to function properly on nodes which is deployed as part of `aws-node` daemonset in `kube-system` namespace.

These permissions may not be enough if you are running pods that are calling a variety of AWS APIs. `eksctl` provides a variety of ways to define additional permissions for the Node.


### Attach IAM Policies using ARN to the Node Group.

`eksctl` allows you to attach IAM policies to a node group using `attachPolicyARNs`. 


```yaml
managedNodeGroups:
  - name: managed-ng-1
    iam:
      attachPolicyARNs:
      # Mandatory IAM Policies for NodeGroup.
      - arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy
      - arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy
      - arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly

      # AWS Mannaged or Customer Managed IAM Policy ARN.
      - arn:aws:iam::aws:policy/AmazonS3FullAccess
```

Please note that while specifying IAM policy ARNs using `attachPolicyARNs`, its mandatory to include the above 3 IAM policies as they are required for the node to function properly.

If you missed specifying these 3 IAM policies, you will get an error like this :

```bash
AWS::EKS::Nodegroup/ManagedNodeGroup: CREATE_FAILED – "The provided role doesn't have the Amazon EKS Managed Policies associated with it. Please ensure the following policies [arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy, arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly] are attached "
```

### Attach IAM Role and Instance Profile to the Node Group

If you have an existing `IAM Role` and `Instance Profile`, then you can define that for a node group :

```yaml
managedNodeGroups:
  - name: managed-ng-1
    iam:
      instanceProfileARN: "<Instance Profile ARN>"
      instanceRoleARN: "<Instance Role ARN>"
```

### Attach Addons IAM Policy

`eksctl` provides out of box IAM policies for the cluster add-ons such as `cluster autoscaler`, `external DNS`, `cert-manager`.

```yaml
managedNodeGroups:
  - name: managed-ng-1
    iam:
      withAddonPolicies:
        imageBuilder: true
        autoScaler: true
        externalDNS: true
        certManager: true
        appMesh: true
        ebs: true
        fsx: true
        efs: true
        albIngress: true
        xRay: true
        cloudWatch: true
```

1. `imageBuilder` - Full ECR access with `AmazonEC2ContainerRegistryPowerUser`.

2. `autoScaler` - IAM policy for [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler/cloudprovider/aws#iam-policy).

3. `externalDNS` - IAM policy for [External DNS](https://github.com/kubernetes-sigs/external-dns/blob/master/docs/tutorials/aws.md#iam-policy).

4. `certManager` - IAM Policy for [Cert Manager](https://cert-manager.io/docs/configuration/acme/dns01/route53/#set-up-an-iam-role).

5. `appMesh` - IAM policy for [AWS App Mesh](https://github.com/aws/aws-app-mesh-controller-for-k8s/blob/master/config/iam/controller-iam-policy.json).

6. `ebs` - IAM Policy for [AWS EBS CSI Driver](https://github.com/kubernetes-sigs/aws-ebs-csi-driver/blob/master/docs/example-iam-policy.json).

7. `fsx` - IAM Policy for [AWS FSX Lustre](https://github.com/kubernetes-sigs/aws-fsx-csi-driver/tree/master/docs#installation).

8. `efs` - IAM Policy for [AWS EFS CSI Driver](https://github.com/kubernetes-sigs/aws-efs-csi-driver/blob/master/docs/iam-policy-example.json).

9. `albIngress` - IAM Policy for [ALB Ingress Controller](https://github.com/kubernetes-sigs/aws-load-balancer-controller/blob/main/docs/install/iam_policy.json).

10. `xRay` - IAM Policy `AWSXRayDaemonWriteAccess` for [AWS X-ray Daemon](https://github.com/aws/aws-xray-daemon) 

11. `cloudWatch` - IAM Policy `CloudWatchAgentServerPolicy` for [AWS Cloudwatch Agent](https://github.com/aws/amazon-cloudwatch-agent).


