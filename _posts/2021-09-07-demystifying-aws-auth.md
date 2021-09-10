---
layout: post
title:  "Demystifying aws-auth"
author: shardul
tags: [eks, monitoring, aws, auth]
categories: [eks, monitoring, aws, auth]
description: "Demystifying aws-auth"
featured: false
comments: false
---

AWS EKS uses `IAM credentials` for `authentication` and `Kubernetes RBAC` for `authorization`. When you create an EKS cluster, the IAM Role or User is that was used to create the cluster is added to the `system:masters` group by default.

As per [Kubernetes documentation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#user-facing-roles) `system:masters` group is one of the default ClusterRoleBindings available in the Kubernetes cluster, it's attached to the `cluster-admin` ClusterRole that gives the user admin permissions in the cluster.


| Default ClusterRole | Default ClusterRoleBinding | Description |
|---------------------|----------------------------|-------------|
| cluster-admin       | system:masters  group      | Allows super-user access to perform any action on any resource.|

<br>
**Note:** This mapping of creator IAM User or Role to `system:masters` group is not visible in any configuration such as `aws-auth` configmap.


# aws-auth ConfigMap

EKS allows giving access of the cluster to other users by adding them in a configmap `aws-auth` in `kube-system` namespace. By default, this configmap is empty. However If you are using `eksctl` to create the cluster, this config map will have the role created by `eksctl` for the node group and this role is attached to the `system:bootstrappers` and `system:nodes` groups.

`aws-auth` configmap is based on [aws-iam-authenticator](https://github.com/kubernetes-sigs/aws-iam-authenticator) configuration and has a number of options:

1. mapRoles
2. mapUsers
3. mapAccounts

## Using mapRoles to Map an IAM Role to the Cluster

`mapRoles` allows to map an IAM role in the cluster to allow any entity or user assuming that role to access the cluster. Although with this, any user or entity assuming this role is allowed to access the cluster, however the level of access is defined by `groups` defined .

It has three attributes:
 
1. **roleARN** - IAM Role ARN to map to this cluster.
2. **username** - Username for the IAM Role, this could be a static value like `eks-dev` or `ci-account` or a templated variable like `{{AccountID}}/{{SessionName}}/{{EC2PrivateDNSName}}`or both. This value would be printed in the aws-authenticator logs if enabled. 
3. **groups** - Kubernetes group that is defined in `ClusterRoleBinding/RoleBinding`. Example

	```yaml
	subjects:
	- kind: Group
	  name: "my-group"
	  apiGroup: ""
	```

Let's create two IAM roles `eks-admin` and `eks-dev` and assume the `eks-admin` role to create a cluster with one node group:

```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: iam-cluster
  region: us-east-1
  version: "1.21"

availabilityZones: 
  - us-east-1a
  - us-east-1b
  - us-east-1c

cloudWatch:
  clusterLogging:
    enableTypes: ["authenticator"]

managedNodeGroups:
  - name: managed-ng-1
    instanceType: t3a.medium
    minSize: 1
    maxSize: 4
    desiredCapacity: 4
```

Once created this cluster would only have one NodeGroup and the IAM role associated with this node group would be added to the `aws-auth` configmap. 

Check the contents of `aws-auth` :

```bash
kubectl get configmap aws-auth -n kube-system -oyaml
```

Be default, only IAM Role that created the cluster would have access to the cluster, any other IAM Role has to be added seperately added in `aws-auth`. Let's try to assume `eks-dev` IAM role and try to access the cluster with that role.

```bash
kubectl get pods
error: You must be logged in to the server (Unauthorized).
```

As expected, this `eks-dev` would not be allowed access. To allow access, lets add the mapping in the `aws-auth` configmap and map this role to `eks-dev` user with `groups` empty. We can either directly edit the configmap or use `eksctl`.

```yaml
eksctl create iamidentitymapping \
  --cluster iam-cluster \
  --region us-east-1 \
  --arn "arn:aws:iam::<AWS_ACCOUNT_ID>:role/eks-dev" \
  --username "eks-developer"
```

Let's try again accessing cluster by assuming `eks-dev` IAM role:

```bash
kubectl get pods
```

This time, we are able to access the cluster, however not allowed to list pods in the cluster due to not having enough RBAC permissions. RBAC permissions can be assigned to this user in two ways :

1. Using RBAC Group
2. Using RBAC User


### Using RBAC Group


### Using RBAC User

