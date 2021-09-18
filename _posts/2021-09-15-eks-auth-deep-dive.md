---
layout: post
title:  EKS Auth Deep Dive
author: shardul
tags: [eks, monitoring, aws, auth]
categories: [eks, monitoring, aws, auth]
image: https://dev-to-uploads.s3.amazonaws.com/uploads/articles/jbemhazm86o66bkuixyf.png
description: "EKS Auth Deep Dive"
featured: true
comments: false
---

If you use EKS then you have found yourself in a situation where a user can't access the cluster despite having all the IAM permissions and gets an `Unauthorized` message like [Eddie](https://friends.fandom.com/wiki/Eddie_Menuek) here.

![eddie-locked](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/hpykbg9lncvvkmduyp9b.jpeg)

AWS EKS uses `IAM credentials` for `authentication` and `Kubernetes RBAC` for `authorization`. As per [EKS docs](https://docs.aws.amazon.com/eks/latest/userguide/managing-auth.html):
> `EKS uses IAM permissions for authentication of valid entities such IAM users or roles. All the permissions for interacting with the EKS cluster is managed through Kubernetes RBAC`

or simply put, EKS doesn't work the same way as other services such as S3 where if you have `AmazonS3FullAccess`, you can access any S3 bucket and create or delete files/folders. In EKS, IAM permissions are only used to check if the user has valid IAM credentials and permissions to run any command using `kubectl` such as `kubectl get pods` is managed by Kubernetes API that uses [RBAC](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) to control the access.


![aws-eks-auth](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/q70jx5gnhh9s4wrj27jc.png)

By default, the `IAM Role` or `IAM User` that was used to create the cluster, is added to the `system:masters` group and gets cluster-wide admin permission with `cluster-admin` ClusterRole.

As per [Kubernetes documentation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#user-facing-roles) `system:masters` group is one of the `default` ClusterRoleBindings available in the Kubernetes cluster, it's attached to the `cluster-admin` ClusterRole that gives the user admin permissions in the cluster.

<style>
table {
  font-family: Merriweather;
  border-collapse: collapse;
  width: 100%;
}

td, th {
  border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;
}
</style>

| Default ClusterRole | Default ClusterRoleBinding | Description |
|---------------------|----------------------------|-------------|
| cluster-admin       | system:masters  group      | Allows super-user access to perform any action on any resource.|

<br>

![unlimited-power](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/f1hm3xhl2kugcp747tid.jpeg)

**Note:** This mapping of creator IAM User or Role to `system:masters` group is not visible in any configuration such as `aws-auth` configmap.

EKS allows giving access to other users by adding them in a configmap `aws-auth` in `kube-system` namespace. By default, this configmap is empty. However, If you are using `eksctl` to create the cluster, this config map will have the role created by `eksctl` for the node group and this role is attached to the `system:bootstrappers` and `system:nodes` groups.


`aws-auth` configmap is based on [aws-iam-authenticator](https://github.com/kubernetes-sigs/aws-iam-authenticator) and has several configuration options:

1. **mapRoles**
2. **mapUsers**
3. **mapAccounts**

## Using mapRoles to Map an IAM Role to the Cluster

`mapRoles` allows mapping an `IAM role` in the cluster to allow any entity or user assuming that role to access the cluster. After mapping an IAM role with `mapRoles`, any user or entity assuming this role is allowed to access the cluster, However, the level of access is defined by the `groups` attribute.

`mapRoles` has three attributes:
 
1. **rolearn** - IAM Role ARN to map to EKS cluster.
2. **username** - Username for the IAM Role to map in Kubernetes, this could be a static value like `eks-developer` or `ci-account` or a templated variable like {% raw %}`{{AccountID}}/{{SessionName}}/{{EC2PrivateDNSName}}`{% endraw %} or both. This value would be printed in the `aws-authenticator` Cloudwatch logs if logging is enabled. 
3. **groups** - List of Kubernetes groups that are defined in `ClusterRoleBinding/RoleBinding`. Example

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

Once created, this cluster would have one NodeGroup and the IAM role associated with this node group would be added to the `aws-auth` configmap. 

Check the contents of `aws-auth` configMap :

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
      username: system:node:{% raw %}{{EC2PrivateDNSName}}{% endraw %}
kind: ConfigMap
metadata:
  name: aws-auth
  namespace: kube-system
```

By default, only `IAM Role` that created the cluster would have access to the cluster, any other IAM Role has to be added separately added in `aws-auth`. Let's try to assume the `eks-developer` IAM role and try to access the cluster with that role.

```bash
kubectl get pods

error: You must be logged in to the server (Unauthorized)
```

As expected, `eks-developer` IAM role would not be allowed access. To allow `eks-developer` IAM role access to the cluster, add the mapping in the `aws-auth` configMap to map this role to `eks-developer` Kubernetes user. We can either directly edit the configMap or use `eksctl` to add this mapping:

```bash
eksctl create iamidentitymapping \
  --cluster iam-auth-cluster \
  --region us-east-1 \
  --arn "arn:aws:iam::<AWS_ACCOUNT_ID>:role/eks-developer" \
  --username "eks-developer"
```

this would create an entry under the `mapRoles` section in `aws-auth` configMap :

```yaml
apiVersion: v1
data:
  mapRoles: |
    - groups:
      - system:bootstrappers
      - system:nodes
      rolearn: arn:aws:iam::<AWS_ACCOUNT_ID>:role/eksctl-iam-auth-cluster-nodegroup-NodeInstanceRole-1RNKIEA50ZD0B
      username: system:node:{% raw %}{{EC2PrivateDNSName}}{% endraw %}

    - rolearn: arn:aws:iam::<AWS_ACCOUNT_ID>:role/eks-developer
      username: eks-developer
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

**1. RBAC permissions with Kubernetes User**<br>
**2. RBAC permissions with Kubernetes Groups**

### RBAC permissions with Kubernetes User

We can assign RBAC permissions to an IAM role by binding mapped `Kubernetes User` in `aws-auth` i.e `eks-developer` to a `ClusterRole`/`Role`.

1. Create a **ClusterRole** `eks-developer-cluster-role` with permissions to `get`, `list` or `watch` the `pods` resources : 

    ```yaml
    apiVersion: rbac.authorization.k8s.io/v1beta1
    kind: ClusterRole
    metadata:
      name: eks-developer-cluster-role
    rules:
      - apiGroups: [""] # Pod is part of Core API Group and "" indicates the core API group
        resources: ["pods"] # pods resource
        verbs: ["get", "list", "watch"] # Allow user to get, list of watch the pods.
    ```

2. We have mapped IAM role `arn:aws:iam::<AWS_ACCOUNT_ID>:role/eks-developer` to Kubernetes user `eks-developer` in `aws-auth`, now create a **ClusterRoleBinding** to bind `developer-cluster-role` to the Kubernetes user `eks-developer`.

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

### RBAC permissions with Kubernetes Groups

While assigning permissions directly to the Kubernetes User works just fine for most of the use-cases however this approach is not so great if you want to audit who is assuming the IAM role and accessing the cluster and would like additional information captured in the audit logs.

One such use-case is **AWS SSO**, where many users are assigned to a permission set and whenever these users log in using their credentials, they assume the same `IAM role`.

We can assign IAM permissions to an IAM role by creating a Kubernetes Group and add it to the `mapRoles.groups` field of IAM Role mapping in `aws-auth`.

Let's take the earlier example of the `eks-developer` IAM role and create a ClusterRoleBinding with Kubernetes Group `developer` bound to `eks-developer-cluster-role` and add Kubernetes Group `developer` in the mapping of this IAM role in `aws-auth`.


1. First delete the earlier ClusterRoleBinding `eks-developer-user-cluster-role-binding` :

    ```bash
    kubectl delete clusterrolebindings eks-developer-user-cluster-role-binding
    clusterrolebinding.rbac.authorization.k8s.io "eks-developer-user-cluster-role-binding" deleted
    ```

    As soon as we delete the `ClusterRolebinding`, `eks-developer` IAM role won't be able to list the pods, let's check the access by assuming the `eks-developer` IAM role :

    ```bash
    kubectl get pods -A
    Error from server (Forbidden): pods is forbidden: User "eks-developer" cannot list resource "pods" in API group "" in the namespace "default"
    ```

2. Delete **IAM Mapping** from `aws-auth` :

    ```bash
    eksctl delete iamidentitymapping \
          --cluster iam-auth-cluster \
          --region us-east-1 \
          --arn "arn:aws:iam::<AWS_ACCOUNT_ID>:role/eks-developer"
    ```

3. Create a **ClusterRoleBinding** to bind Kubernetes Group `developer` to cluster role `eks-developer-cluster-role`:

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

4. Add Kubernetes Group `developer` to IAM role mapping of `eks-developer` in `aws-auth` and include the session name in username using templated variable {% raw %}`{{SessionName}}`{% endraw %}:

    ```bash
    eksctl create iamidentitymapping \
      --cluster iam-auth-cluster \
      --region us-east-1 \
      --arn "arn:aws:iam::<AWS_ACCOUNT_ID>:role/eks-developer" \
      --username "eks-developer:{% raw %}{{SessionName}}{% endraw %}" \
      --group "developer"
    ```

    this would create an entry under `mapRoles` section in `aws-auth` configmap as:

    ```yaml
    mapRoles: |
      - groups:
        - developer
        rolearn: arn:aws:iam::017558828988:role/eks-developer
        username: eks-developer:{% raw %}{{SessionName}}{% endraw %}
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


There is one problem here, if your EKS cluster is being accessed from **multiple AWS accounts**, it would not be possible to track the AWS account of the user who accessed the EKS cluster just by session name.

![baby-what-now](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/s1k1t6y9yf2462qtwzzq.jpeg)


{% raw %}`{{AccountID}}`{% endraw %} comes to the rescue, we can use this templated variable to get the **AWS account ID** of the user who is assuming the role, so we can set the username to :

```bash
{% raw %}aws:{{AccountID}}:eks-developer:{{SessionName}}{% endraw %}
```

Please note that `iamidentitymapping` can't be overridden with `eksctl`, so you have to delete it and create it again.

```bash

eksctl delete iamidentitymapping \
      --cluster "iam-auth-cluster" \
      --region "us-east-1" \
      --arn "arn:aws:iam::<AWS_ACCOUNT_ID>:role/eks-developer"

eksctl create iamidentitymapping \
      --cluster "iam-auth-cluster" \
      --region "us-east-1" \
      --arn "arn:aws:iam::<AWS_ACCOUNT_ID>:role/eks-developer" \
      --username "{% raw %}aws:{{AccountID}}:eks-developer:{{SessionName}}{% raw %}n" \
      --group "developer"
```

Now we would get the `AWS Account ID` along with `Session Name` in cloudwatch logs :

> ```time="2021-09-14T18:26:33Z" level=info msg="access granted" arn="arn:aws:iam::017558828988:role/eks-developer" client="127.0.0.1:39752" groups="[developer]" method=POST path=/authenticate sts=sts.us-east-1.amazonaws.com uid="heptio-authenticator-aws:0175XXXXXXXX:AROAQIFUWO66PDOXKSLMQ" username="aws:0175XXXXXXXX:eks-developer:my-develper-session-123456789"```

**Note: {% raw %}If you want session name in raw format, you can use templated variable `{{SessionNameRaw}}` instead. However as of EKS 1.21, these two variables `{{AccessKeyID}}` and `{{SessionNameRaw}}`{% endraw %} don't work.**


## Using mapUser to Map an IAM User to the Cluster

`mapUsers` allows mapping an `IAM User` to the cluster and add the user to one or more Kubernetes Groups. It has 3 attributes :

1. **userarn** - ARN of IAM User to map to EKS cluster. This could be an IAM user from the same AWS account or another account.
2. **username** - Static username to map this IAM User to, in Kubernetes. 
3. **groups** - List of Kubernetes groups that are defined in `ClusterRoleBinding/RoleBinding`.

** Note: Templated variables are not supported in `username` field with mapUser.**

To add an IAM user with ARN `arn:aws:iam::<AWS_ACCOUNT_ID>:user/dev-user` in `aws-auth` configmap, we can run the below command:

```bash
eksctl create iamidentitymapping \
  --cluster iam-auth-cluster \
  --region us-east-1 \
  --arn "arn:aws:iam::<AWS_ACCOUNT_ID>:user/dev-user" \
  --username "dev-user"
```

this command would add these lines in `aws-auth` configMap:

```yaml
  mapUsers: |
    - userarn: arn:aws:iam::<AWS_ACCOUNT_ID>:user/dev-user
      username: dev-user
```

Since we didn't specify any group, `dev-user` would be able to authenticate to the cluster, however wouldn't be able to `list` or `get` any resources.

For users mapped using `mapUsers`, RBAC permission can be given in two ways :

**1. RBAC permissions with Kubernetes User**<br>
**2. RBAC permissions with Kubernetes Groups**

### RBAC permissions with Kubernetes User

We can assign RBAC permissions to an `IAM user` by binding mapped `Kubernetes User` in `aws-auth` i.e `dev-user` to a `ClusterRole`/`Role`.

1. Create a **ClusterRoleBinding** to bind Kubernetes user `dev-user` to the `developer-cluster-role`:

    ```yaml
    apiVersion: rbac.authorization.k8s.io/v1beta1
    kind: ClusterRoleBinding
    metadata:
      name: dev-user-cluster-role-binding
    subjects:
      - kind: User
        name: dev-user # Kubernetes User mapped to the IAM user in aws-auth configmap.
        apiGroup: ""
    roleRef:
      kind: ClusterRole
      name: eks-developer-cluster-role
      apiGroup: ""
    ```

2. Map IAM user `arn:aws:iam::<AWS_ACCOUNT_ID>:user/dev-user` to Kubernetes user `dev-user` in `aws-auth` configMap:

  ```bash
  eksctl create iamidentitymapping \
    --cluster iam-auth-cluster \
    --region us-east-1 \
    --arn "arn:aws:iam::<AWS_ACCOUNT_ID>:user/dev-user" \
    --username "dev-user"
  ```

Once this `ClusterRoleBinding` is created and the IAM user is mapped in `aws-auth`, IAM user `dev-user` would be able to get, list, or watch pods in any namespace.

### RBAC permissions with Kubernetes Groups

If we need to give the same set of permissions to multiple users, then instead of creating multiple `ClusterRoleBindings`, we can use Kubernetes Groups and attach that group to the users for whom those permissions are required.


1. Create a ClusterRoleBinding to bind Kubernetes Group `developer` to cluster role `eks-developer-cluster-role`:

    ```yaml
    apiVersion: rbac.authorization.k8s.io/v1beta1
    kind: ClusterRoleBinding
    metadata:
      name: dev-user-group-cluster-role-binding
    subjects:
      - kind: Group
        name: dev
        apiGroup: ""
    roleRef:
      kind: ClusterRole
      name: eks-developer-cluster-role
      apiGroup: ""
    ```

2. Map IAM user `arn:aws:iam::<AWS_ACCOUNT_ID>:user/dev-user` to Kubernetes user `dev-user` with `dev` group in `aws-auth` configMap:

    ```bash
    eksctl create iamidentitymapping \
      --cluster iam-auth-cluster \
      --region us-east-1 \
      --arn "arn:aws:iam::<AWS_ACCOUNT_ID>:role/dev-user" \
      --username "dev-user" \
      --group "dev"
    ```
    
    this would create an entry under `mapUsers` section in `aws-auth` configmap as:

    ```yaml
    mapUsers: |
      - groups:
        - dev
        userarn: arn:aws:iam::<AWS_ACCOUNT_ID>:role/dev-user
        username: dev-user
    ```

## Using mapAccounts to Map IAM ARN in an AWS Account to the Cluster

`mapAccounts` allows mapping all the `IAM Users` or `IAM Roles` of an **AWS account** to the cluster. It accepts the list of AWS Account IDs:

```yaml
mapAccounts: |
  - "<AWS_ACCOUNT_ID_1>"
  - "<AWS_ACCOUNT_ID_2>"
```

After mapping the AWS accounts to the cluster, we can use **Kubernetes User** and **Kubernetes Group** to assign permissions to those IAM entities.

