---
layout: post
title:  "EKS IAM Deep Dive"
author: shardul
tags: [eks, iam, serviceaccount, deepdive]
categories: [eks, iam, serviceaccount, deepdive]
image: assets/images/aws-eks-iam.png
description: "EKS IAM Deep Dive"
featured: true
comments: false
---

Amazon EKS cluster consists of [Managed NodeGroups](https://docs.aws.amazon.com/eks/latest/userguide/managed-node-groups.html), [Self Managed NodeGroups](https://docs.aws.amazon.com/eks/latest/userguide/worker.html) and [Fargate profiles](https://docs.aws.amazon.com/eks/latest/userguide/fargate-profile.html). NodeGroups are autoscaling groups behind the scene, while Fargate is serverless and creates one fargate node per pod.

IAM permissions in EKS can be defined in two ways:
1. IAM Role for NodeGroups
2. IAM role for Service Accounts(IRSA)


## IAM Role for NodeGroups
Whenever we create an EKS cluster using `eksctl` with node groups like the below configuration :

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
```

`eksctl` automatically creates an IAM role with minimum IAM permissions required for the cluster to work and attaches it to the nodes part of the cluster. All the pods running on these nodes inherit these permissions.

This role has 3 policies attached that give basic access to the node :

1. `AmazonEKSWorkerNodePolicy` - This policy allows EKS worker nodes to connect to EKS clusters.
2. `AmazonEC2ContainerRegistryReadOnly` - This policy gives read-only access to ECR.
3. `AmazonEKS_CNI_Policy` - This policy is required for [amazon-vpc-cni](https://github.com/aws/amazon-vpc-cni-k8s#setup) plugin to function properly on nodes which is deployed as part of `aws-node` daemonset in `kube-system` namespace.

These permissions may not be enough if you are running workloads that require various other IAM permissions. `eksctl` provides several ways to define additional permissions for the Node.


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

      # AWS Managed or Customer Managed IAM Policy ARN.
      - arn:aws:iam::aws:policy/AmazonS3FullAccess
```

Please note that while specifying IAM policy ARNs using `attachPolicyARNs`, it's mandatory to include the above 3 IAM policies as they are required for the node to function properly.

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
      instanceRoleARN: "<IAM Role ARN>"
```

### Attach Addons IAM Policy

`eksctl` provides out-of-box IAM policies for the cluster add-ons such as `cluster autoscaler`, `external DNS`, `cert-manager`.

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


While all the above options allow you to define IAM permissions for the node group, there is a problem with defining IAM permissions at the node level.

![problem](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ot1yz308b4adguc5wcme.jpeg)

All the pods running on nodes part of the node group will have these permissions thus not adhering to the **principle of least privilege**. For example, if we attach `EC2 Admin` and `Cloudformation` permissions to the node group to run `CI server`, any other pods running on this node group will effectively inherit these permissions.

One way to overcome this problem is to create a separate node group for the CI server. ( Use [taints](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/#concepts) and [affinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#node-affinity) to ensure only CI pods are deployed on this node group)

However AWS access is not just required for CI servers, many applications use AWS services such as `S3`, `SQS`, and `KMS` and would require fine-grained IAM permissions. Creating one node group for every such application would not be an ideal solution and can lead to **maintenance issues**, **higher cost**, and **low resource consumption**.

![solution](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/b1bzi3gm71dyrfkdfvji.jpeg)


## IAM Roles for Service Accounts

Amazon EKS supports `IAM Roles for Service Accounts (IRSA)` that allows us to map AWS IAM Roles to Kubernetes Service Accounts. With IRSA, instead of defining IAM permissions on the node, we can attach an **IAM role** to a **Kubernetes Service Account** and attach the service account to the **pod/deployment**.

IAM role is added to the Kubernetes service account by adding annotation `eks.amazonaws.com/role-arn` with value as the `IAM Role ARN`.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-serviceaccount
  annotations:
    eks.amazonaws.com/role-arn: "<IAM Role ARN>"
```

EKS uses Mutating Admission Webhook [pod-identity-webhook](https://github.com/aws/amazon-eks-pod-identity-webhook/)) to intercept the pod creation request and update the pod spec to include IAM credentials.

Check the [Mutating Admission Webhooks](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/#mutatingadmissionwebhook) in the cluster :

```bash
kubectl get mutatingwebhookconfigurations.admissionregistration.k8s.io

NAME                                             WEBHOOKS   AGE
0500-amazon-eks-fargate-mutation.amazonaws.com   2          21m
pod-identity-webhook                             1          28m
vpc-resource-mutating-webhook                    1          28m
```

`pod-identity-webhook` supports several configuration options:

1. `eks.amazonaws.com/role-arn` - IAM Role ARN to attach to the service account.
2. `eks.amazonaws.com/audience` - Intended autience of the [token](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/#service-account-token-volume-projection), defaults to "sts.amazonaws.com" if not set.
3. `eks.amazonaws.com/sts-regional-endpoints` - AWS STS is a global service, however, we can use regional STS endpoints to reduce latency. Set to `true` to use regional STS endpoints.
4. `eks.amazonaws.com/token-expiration` - AWS STS Token expiration duration, default is `86400 seconds` or `24 hours`.
5. `eks.amazonaws.com/skip-containers` - A comma-separated list of containers to skip adding volume and environment variables.


```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-serviceaccount
  annotations:
    eks.amazonaws.com/role-arn: "<IAM Role ARN>"
    eks.amazonaws.com/audience: "sts.amazonaws.com"
    eks.amazonaws.com/sts-regional-endpoints: "true"
    eks.amazonaws.com/token-expiration: "86400"
```

### How IRSA Works

When you define the IAM role for a service account using `eks.amazonaws.com/role-arn` annotation and add this service account to the pod, mutating webhook mutates the pod spec additional `environment variables` and [projected mount volumes](https://kubernetes.io/docs/concepts/storage/volumes/#projected).

These are the environment variables by the webhook in the pod spec :

```yaml
  env:
    - name: AWS_DEFAULT_REGION
      value: us-east-1
    - name: AWS_REGION
      value: us-east-1
    - name: AWS_ROLE_ARN
      value: "<IAM ROLE ARN>"
    - name: AWS_WEB_IDENTITY_TOKEN_FILE
      value: "/var/run/secrets/eks.amazonaws.com/serviceaccount/token"
```

1. `AWS_DEFAULT_REGION` and `AWS_REGION` - Cluster Region 

2. `AWS_ROLE_ARN` - IAM Role ARN.

3. `AWS_WEB_IDENTITY_TOKEN_FILE` - Path to the tokens file

Mutating Webhook also adds a projected volume for service account :

```yaml
    volumeMounts:
    - mountPath: "/var/run/secrets/eks.amazonaws.com/serviceaccount"
      name: aws-iam-token
  volumes:
  - name: aws-iam-token
    projected:
      sources:
      - serviceAccountToken:
          audience: "sts.amazonaws.com"
          expirationSeconds: 86400
          path: token
```

a projected volume is created with the name `aws-iam-token` and mounted to the container at `/var/run/secrets/eks.amazonaws.com/serviceaccount`.


**Let's test it out.**

* Create an EKS cluster with a Managed NodeGroup and a IAM service account `s3-reader` in default namespace with `AmazonS3ReadOnlyAccess` IAM permissions :

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
iam:
  withOIDC: true
  serviceAccounts:
  - metadata:
      name: s3-reader
    attachPolicyARNs:
    - "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
managedNodeGroups:
  - name: managed-ng-1
    instanceType: t3a.medium
    minSize: 1
    maxSize: 4
    desiredCapacity: 4
```

**Note:**  We can also attach IAM Role directly using `attachRoleARN`. However, the role should have below `trust policy` to allow the pods to use this role :

```json
{
 "Version": "2012-10-17",
 "Statement": [
  {
   "Effect": "Allow",
   "Principal": {
    "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/oidc.<REGION>.eks.amazonaws.com/<CLUSTER_ID>"
   },
   "Action": "sts:AssumeRoleWithWebIdentity",
   "Condition": {
    "StringEquals": {
     "oidc.<REGION>.eks.amazonaws.com/<CLUSTER_ID>:sub": "system:serviceaccount:default:my-serviceaccount"
    },
    "StringLike": {
     "oidc.<REGION>.eks.amazonaws.com/<CLUSTER_ID>:sub": "system:serviceaccount:default:*"
    }
   }
  }
 ]
}
```

* Check the role created by `eksctl` for service account `s3-reader`

```bash
eksctl get iamserviceaccount s3-reader --cluster=iam-cluster --region=us-east-1
2021-08-25 02:51:14 [ℹ]  eksctl version 0.61.0
2021-08-25 02:51:14 [ℹ]  using region us-east-1
NAMESPACE NAME    ROLE ARN
default   s3-reader <IAM ROLE ARN>
```

* Check the service account to verify `eks.amazonaws.com/role-arn` annotation:

```bash
kubectl get sa s3-reader -oyaml
```

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  annotations:
    eks.amazonaws.com/role-arn: <IAM ROLE ARN>
  labels:
    app.kubernetes.io/managed-by: eksctl
  name: s3-reader
  namespace: default
secrets:
- name: s3-reader-token-5hnn7
```

we can see that `eksctl` has created the IAM role, service account and automatically added this annotation to the service account.

Since `eksctl` doesn't support all of the annotations, let's add them manually:

```bash
kubectl annotate \
  sa s3-reader \
    "eks.amazonaws.com/audience=test" \
    "eks.amazonaws.com/token-expiration=43200" \
    "eks.amazonaws.com/audience=test"
```

**Note:** As of August'21 these two annotations `eks.amazonaws.com/sts-regional-endpoints` and `eks.amazonaws.com/skip-containers` are not working in `EKS v1.21`.

By default audience is set to `sts.amazonaws.com`. To allow a different value for `audience`:

* Go to [IAM Console](https://console.aws.amazon.com/iamv2/home) and click on `Indentity Providers`, add the audience to the Identity provider :

![oidc-audience](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/1dwuj8anj8r01yrc8495.png)

* Modify the trust policy of the IAM Role used with the service account to add add this `audience` :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/oidc.eks.<REGION>.amazonaws.com/id/<CLUSTER_ID>"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "oidc.eks.<REGION>.amazonaws.com/id/<CLUSTER_ID>:sub": "system:serviceaccount:default:s3-reader"
        },
        "ForAnyValue:StringNotEquals" : {
            "oidc.eks.<REGION>.amazonaws.com/id/<CLUSTER_ID>:aud": [
                "sts.amazonaws.com",
                "test"
            ]
        }
      }
    }
  ]
}
```

* Create a pod to test the IAM permissions on the pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: iam-test
spec:
  serviceAccountName: s3-reader
  containers:
  - name: iam-test
    image: amazon/aws-cli
    args: [ "sts", "get-caller-identity" ]
``` 

```bash
kubectl apply -f iam-test.yaml
```

* Once the pod is ready, check the environment variables in the pod:

```bash
kubectl get pods iam-test -ojson|jq -r '.spec.containers[0].env'
```

```json
[
  {
    "name": "AWS_DEFAULT_REGION",
    "value": "us-east-1"
  },
  {
    "name": "AWS_REGION",
    "value": "us-east-1"
  },
  {
    "name": "AWS_ROLE_ARN",
    "value": "<IAM ROLE ARN>"
  },
  {
    "name": "AWS_WEB_IDENTITY_TOKEN_FILE",
    "value": "/var/run/secrets/eks.amazonaws.com/serviceaccount/token"
  }
]
```

* Check the `aws-iam-token volume` in the pod:

```bash
kubectl get pods iam-test -ojson|jq -r '.spec.volumes[]| select(.name=="aws-iam-token")'
```

```json
{
  "name": "aws-iam-token",
  "projected": {
    "defaultMode": 420,
    "sources": [
      {
        "serviceAccountToken": {
          "audience": "sts.amazonaws.com",
          "expirationSeconds": 43200,
          "path": "token"
        }
      }
    ]
  }
}
```

we can see that `expirationSeconds` is `43200` as specified in the annotation `eks.amazonaws.com/token-expiration`.

* Check the `volumeMounts` in the pod:

```bash
kubectl get pods iam-test -ojson|jq -r '.spec.containers[0].volumeMounts'
```

```json
[
  {
    "mountPath": "/var/run/secrets/kubernetes.io/serviceaccount",
    "name": "kube-api-access-xjjqv",
    "readOnly": true
  },
  {
    "mountPath": "/var/run/secrets/eks.amazonaws.com/serviceaccount",
    "name": "aws-iam-token",
    "readOnly": true
  }
]
```


