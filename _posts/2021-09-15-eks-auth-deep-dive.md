---
layout: post
title:  EKS Auth Deep Dive
author: shardul
tags: [eks, monitoring, aws, auth]
categories: [eks, monitoring, aws, auth]
description: "EKS Auth Deep Dive"
featured: false
comments: false
---

AWS EKS uses `IAM credentials` for `authentication` and `Kubernetes RBAC` for `authorization`. When you create an EKS cluster, the IAM Role or User is that was used to create the cluster is added to the `system:masters` group by default.

As per [Kubernetes documentation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#user-facing-roles) `system:masters` group is one of the default ClusterRoleBindings available in the Kubernetes cluster, it's attached to the `cluster-admin` ClusterRole that gives the user admin permissions in the cluster.


| Default ClusterRole | Default ClusterRoleBinding | Description |
|---------------------|----------------------------|-------------|
| cluster-admin       | system:masters  group      | Allows super-user access to perform any action on any resource.|

**Note:** This mapping of creator IAM User or Role to `system:masters` group is not visible in any configuration such as `aws-auth` configmap.


## aws-auth ConfigMap

EKS allows giving access to other users by adding them in a configmap `aws-auth` in `kube-system` namespace. By default, this configmap is empty. However, If you are using `eksctl` to create the cluster, this config map will have the role created by `eksctl` for the node group and this role is attached to the `system:bootstrappers` and `system:nodes` groups.

`aws-auth` configmap is based on [aws-iam-authenticator](https://github.com/kubernetes-sigs/aws-iam-authenticator) configuration and has several options:

1. **mapRoles**
2. **mapUsers**
3. **mapAccounts**

## Using mapRoles to Map an IAM Role to the Cluster

`mapRoles` allows mapping an `IAM role` in the cluster to allow any entity or user assuming that role to access the cluster. After mapping an IAM role with `mapRoles`, any user or entity assuming this role is allowed to access the cluster, However the level of access is defined by the `groups` attribute.

`mapRoles` has three attributes:
 
1. **roleARN** - IAM Role ARN to map to this cluster.
2. **username** - Username for the IAM Role to map in Kubernetes, this could be a static value like `eks-developer` or `ci-account` or a templated variable like `{{AccountID}}/{{SessionName}}/{{EC2PrivateDNSName}}` or both. This value would be printed in the `aws-authenticator` Cloudwatch logs if enabled. 
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
  name: iam-auth-cluster
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
    instanceType: t2.micro
    minSize: 1
    maxSize: 4
    desiredCapacity: 4
```

Once created this cluster would only have one NodeGroup and the IAM role associated with this node group would be added to the `aws-auth` configmap. 

Check the contents of `aws-auth` :

```bash
kubectl get configmap aws-auth -n kube-system -oyaml
```

```yaml
apiVersion: v1
data:
  mapRoles: |
    - groups:
      - system:bootstrappers
      - system:nodes
      rolearn: arn:aws:iam::<AWS_ACCOUNT_ID>:role/eksctl-iam-auth-cluster-nodegroup-NodeInstanceRole-1RNKIEA50ZD0B
      username: system:node:{{EC2PrivateDNSName}}
kind: ConfigMap
metadata:
  name: aws-auth
  namespace: kube-system
```

By default, only IAM Role that created the cluster would have access to the cluster, any other IAM Role has to be added separately added in `aws-auth`. Let's try to assume the `eks-developer` IAM role and try to access the cluster with that role.

```bash
kubectl get pods
error: You must be logged in to the server (Unauthorized)
```

As expected, this `eks-developer` would not be allowed access. To allow access, let's add the mapping in the `aws-auth` configmap and map this role to `eks-developer` user with `groups` empty. We can either directly edit the configmap or use `eksctl`.

```yaml
eksctl create iamidentitymapping \
  --cluster iam-auth-cluster \
  --region us-east-1 \
  --arn "arn:aws:iam::<AWS_ACCOUNT_ID>:role/eks-developer" \
  --username "eks-developer"
```

this would create an entry under the `mapRoles` section in `aws-auth` configmap :

```yaml
apiVersion: v1
data:
  mapRoles: |
    - groups:
      - system:bootstrappers
      - system:nodes
      rolearn: arn:aws:iam::<AWS_ACCOUNT_ID>:role/eksctl-iam-auth-cluster-nodegroup-NodeInstanceRole-1RNKIEA50ZD0B
      username: system:node:{{EC2PrivateDNSName}}

    - rolearn: arn:aws:iam::<AWS_ACCOUNT_ID>:role/eks-developer
      username: eks-developer
  mapUsers: |
    []
kind: ConfigMap
metadata:
  name: aws-auth
  namespace: kube-system
```


Let's try again accessing cluster by assuming the `eks-developer` IAM role:

```bash
kubectl get pods

Error from server (Forbidden): pods is forbidden: User "eks-developer" cannot list resource "pods" in API group "" at the cluster scope
```

This time, we can access the cluster, however not allowed to list pods in the cluster due to not having enough RBAC permissions. RBAC permissions can be assigned to this IAM role in two ways :

1. RBAC permissions with User
2. RBAC permissions with Group

### RBAC permissions with User

We can assign RBAC permissions to an IAM role by binding mapped Kubernetes User in `aws-auth` i.e `eks-developer` to a `ClusterRole`/`Role`.

1. Create a `ClusterRole eks-developer-cluster-role` with permissions to list or get the pods : 

    ```yaml
    apiVersion: rbac.authorization.k8s.io/v1beta1
    kind: ClusterRole
    metadata:
      name: eks-developer-cluster-role
    rules:
      - apiGroups: [""] # Pod is part of Core API Group, "" indicates the core API group
        resources: ["pods"] # pods resource
        verbs: ["get", "list", "watch"] # Allow user to get, list of watch the pods.
    ```

2. We have mapped IAM role `arn:aws:iam::<AWS_ACCOUNT_ID>:role/eks-developer` to Kubernetes user `eks-developer` in `aws-auth`, so let's create a `ClusterRoleBinding` to bind `developer-cluster-role` to the Kubernetes user `eks-developer`.

    ```yaml
    apiVersion: rbac.authorization.k8s.io/v1beta1
    kind: ClusterRoleBinding
    metadata:
      name: eks-developer-user-cluster-role-binding
    subjects:
      - kind: User
        name: eks-developer # Kubernetes User mapped to the IAM role in aws-auth configmap.
        apiGroup: ""
    roleRef:
      kind: ClusterRole
      name: eks-developer-cluster-role
      apiGroup: ""
    ```

3. Access the cluster again by assuming the IAM role `eks-developer`

    ```bash
    kubectl get pods -A

    NAMESPACE     NAME                       READY   STATUS    RESTARTS   AGE
    kube-system   aws-node-f584p             1/1     Running   0          79m
    kube-system   coredns-66cb55d4f4-8hjj2   1/1     Running   0          91m
    kube-system   coredns-66cb55d4f4-vtf6j   1/1     Running   0          91m
    kube-system   kube-proxy-psjk5           1/1     Running   0          79m
    ```

and this time it works!!!

![baby-yess](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rqeckq1k61yci21ddmpo.jpeg)

We can also verify the access granted to the users by checking the `authenticator` logs in Cloudwatch:

> ```time="2021-09-13T16:29:14Z" level=info msg="access granted" arn="arn:aws:iam::01755xxxxx:role/eks-developer" client="127.0.0.1:50410" groups="[]" method=POST path=/authenticate sts=sts.us-east-1.amazonaws.com uid="heptio-authenticator-aws:01755xxxxx:AROAQIFUWO66PDOXKSLMQ" username=eks-developer```

### RBAC permissions with Group

While assigning permissions directly to the Kubernetes User works just fine for most of the use-cases however this approach is not so great if you want to audit who is assuming the IAM role and accessing the cluster and would like additional information captured in audit logs.

One such use-case is AWS SSO, where many users are assigned the same permission sets and whenever these users log in using their credentials, they assume the same IAM role.

We can assign IAM permissions to an IAM role by creating a Kubernetes Group and add it to the `mapRoles.groups` field of an IAM Role mapping in `aws-auth`.

Let's take the earlier example of the `eks-developer` IAM role and create a ClusterRoleBinding with Kubernetes Group `developer` bound to `eks-developer-cluster-role` and add Kubernetes Group `developer` in the mapping of this IAM role in `aws-auth`.


1. First delete the ClusterRoleBinding `eks-developer-user-cluster-role-binding` :

    ```bash
    kubectl delete clusterrolebindings eks-developer-user-cluster-role-binding
    clusterrolebinding.rbac.authorization.k8s.io "eks-developer-user-cluster-role-binding" deleted
    ```

    As soon as we delete the `ClusterRolebinding`, we won't be able to list the pods, let's check the access by assuming the `eks-developer` IAM role :

    ```bash
    kubectl get pods -A
    Error from server (Forbidden): pods is forbidden: User "eks-developer" cannot list resource "pods" in API group "" in the namespace "default"
    ```

2. Delete IAM Mapping from aws-auth :

    ```bash
    eksctl delete iamidentitymapping \
          --cluster iam-auth-cluster \
          --region us-east-1 \
          --arn "arn:aws:iam::<AWS_ACCOUNT_ID>:role/eks-developer"
    ```

3. Create a ClusterRoleBinding to bind Kubernetes Group `developer` to cluster role `eks-developer-cluster-role`:

    ```yaml
    apiVersion: rbac.authorization.k8s.io/v1beta1
    kind: ClusterRoleBinding
    metadata:
      name: eks-developer-group-cluster-role-binding
    subjects:
      - kind: Group
        name: developer
        apiGroup: ""
    roleRef:
      kind: ClusterRole
      name: eks-developer-cluster-role
      apiGroup: ""
    ```

4. Add Kubernetes Group `developer` to IAM role mapping of `eks-developer` in `aws-auth` and include the session name in username using templated variable `{{SessionName}}`:

    ```bash
    eksctl create iamidentitymapping \
      --cluster iam-auth-cluster \
      --region us-east-1 \
      --arn "arn:aws:iam::<AWS_ACCOUNT_ID>:role/eks-developer" \
      --username "eks-developer:{{SessionName}}" \
      --group "developer"
    ```

    this would create an entry under `mapRoles` section in `aws-auth` configmap as:

    ```yaml
    mapRoles: |
      - groups:
        - developer
        rolearn: arn:aws:iam::017558828988:role/eks-developer
        username: eks-developer:{{SessionName}}
    ```

Check the Cloudwatch `authenticator` logs for the authenticated user assuming `eks-developer` IAM role and we can see that this time session name is appended to the username in logs:

> ```time="2021-09-13T17:57:46Z" level=info msg="access granted" arn="arn:aws:iam::0175XXXXXXXX:role/eks-developer" client="127.0.0.1:48520" groups="[developer]" method=POST path=/authenticate sts=sts.us-east-1.amazonaws.com uid="heptio-authenticator-aws:0175XXXXXXXX:AROAQIFUWO66PDOXKSLMQ" username="eks-developer:eks-developer-session"```


If the session name consists of `@`, it would be replaced with `-`. Let's assume the IAM role `eks-developer` with session name containing `@` :

```bash
aws sts assume-role \
    --role-arn "<IAM_ROLE_ARN>" \
    --role-session-name "my-develper-session@123456789" \
    --duration-seconds 3600
```

Now Cloudwatch logs would have session name printed as `eks-developer:my-developer-session-123456789`.


> ```time="2021-09-14T17:50:25Z" level=info msg="access granted" arn="arn:aws:iam::017558828988:role/eks-developer" client="127.0.0.1:57794" groups="[developer]" method=POST path=/authenticate sts=sts.us-east-1.amazonaws.com uid="heptio-authenticator-aws:017558828988:AROAQIFUWO66PDOXKSLMQ" username="eks-developer:my-develper-session-123456789"```


There is one problem here, if your EKS cluster is being accessed from multiple AWS accounts, it would not be possible to track the AWS account of the user who accessed the EKS cluster just by session name.

![baby-what-now](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/s1k1t6y9yf2462qtwzzq.jpeg)


`{{AccountID}}` comes to the rescue, we can use this templated variable to get the account ID of the user who is assuming the role, so we can set the username to :

```bash
aws:{{AccountID}}:eks-developer:{{SessionName}}
```

Please note that you can't override an `iamidentitymapping` with `eksctl`, so you have to delete it and create it again.

```bash

eksctl delete iamidentitymapping \
      --cluster "iam-auth-cluster" \
      --region "us-east-1" \
      --arn "arn:aws:iam::<AWS_ACCOUNT_ID>:role/eks-developer"
eksctl create iamidentitymapping \
      --cluster "iam-auth-cluster" \
      --region "us-east-1" \
      --arn "arn:aws:iam::<AWS_ACCOUNT_ID>:role/eks-developer" \
      --username "aws:{{AccountID}}:eks-developer:{{SessionName}}" \
      --group "developer"
```

Now we would get the `AWS Account ID` along with `Session Name` in cloudwatch logs :

> ```time="2021-09-14T18:26:33Z" level=info msg="access granted" arn="arn:aws:iam::017558828988:role/eks-developer" client="127.0.0.1:39752" groups="[developer]" method=POST path=/authenticate sts=sts.us-east-1.amazonaws.com uid="heptio-authenticator-aws:0175XXXXXXXX:AROAQIFUWO66PDOXKSLMQ" username="aws:0175XXXXXXXX:eks-developer:my-develper-session-123456789"```

**Note: If you want session name in raw format, you can use templated variable `{{SessionNameRaw}}` instead. However as of EKS 1.21, these two variables `{{AccessKeyID}}` and `{{SessionNameRaw}}` don't work.**


## Using mapUser to Map an IAM User to the Cluster


`mapUsers` allows mapping an `IAM User` to the cluster and add the user to one or more Kubernetes Groups. 