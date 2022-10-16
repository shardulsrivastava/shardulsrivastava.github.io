---
layout: post
title:  Most Useful kubectl Plugins
canonical_url: https://dev.to/aws-builders/most-useful-kubectl-plugins-11i1
author: shardul
tags: [kubectl, kubernetes, plugins]
categories: [kubectl, kubernetes, plugins]
image: assets/images/kubectl-plugins.png
description: "Scaling in EKS with Karpenter - Part 1"
featured: true
comments: false
---
Kubernetes provides a convenient utility `kubectl` to interact with the cluster. `kubectl` talks to [kube-apiserver](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-apiserver/) and allows you to create, update and delete objects/resources in the cluster.

## How To Pronounce kubectl

When you start using `kubectl`, the first thing that comes to mind is `how the heck do you pronounce this`. There are different pronunciations used by different people, as long as everybody is referring to the same command line tool, it's all good. 

Here are the three different pronunciations that I have heard people using:

1. `kube-control`
2. `kube-cuttle`
3. `kube-cee-tee-ell` &larr;

> P.S: I use the last one 😄

## What are kubectl Plugins
Kubernetes provides a way to extend the functionality of `kubectl` using plugins. Plugins allow us to add additional functionality to the `kubectl` command line tool.

`kubectl plugins` are executables whose names start with `kubectl-`. These executables should be part of the `PATH` so that `kubectl` can discover them. kubectl automatically detects them and runs them for you.

Eg: If we have a plugin called `hello` then you can invoke it by using the command:

```yaml
kubectl hello
```

here kubectl would look for an executable with the name `kubectl-hello` in the `PATH`

## Install kubectl Plugins with Krew
`kubectl plugins` can be installed in numerous ways, the easiest way would be to install the official plugin manager called [krew](https://github.com/kubernetes-sigs/krew/).

Install `krew` by following the instructions for your operating system [here](https://krew.sigs.k8s.io/docs/user-guide/setup/install/).

For Mac, it can be installed with the `brew` package manager:

```bash
brew install krew
```

### Installing official plugins

krew maintains an index of officially maintained plugins called [krew plugin index](https://krew.sigs.k8s.io/plugins/). There are about *206* plugins maintained in the official krew index by the maintainers.

Let's take a look at some of the most useful plugins

#### neat Plugin

Install [neat](https://github.com/itaysk/kubectl-neat) plugin with krew : 

```bash
kubectl krew install neat
```

`neat` is my favorite plugin. While working with Kubernetes, you often would want to check the resource spec in the cluster, however, when you run the command, you get more fields than intended as part of the spec.

```bash
kubectl get pods nginx-7fd68f74d-ntpdc -oyaml
```
```yaml
apiVersion: v1
kind: Pod
metadata:
  creationTimestamp: "2022-10-14T16:18:08Z"
  generateName: nginx-7fd68f74d-
  labels:
    app: nginx
    pod-template-hash: 7fd68f74d
  name: nginx-7fd68f74d-ntpdc
  namespace: default
  ownerReferences:
  - apiVersion: apps/v1
    blockOwnerDeletion: true
    controller: true
    kind: ReplicaSet
    name: nginx-7fd68f74d
    uid: 4ff93f8e-a3c3-4c81-9556-e69eb47e9011
  resourceVersion: "85985"
  uid: 714bf0d2-2456-4efc-a527-71f29943662c
spec:
  containers:
  - image: quay.io/shardul/nginx:v1
    imagePullPolicy: Always
    name: nginx
    resources:
      requests:
        cpu: "1"
    terminationMessagePath: /dev/termination-log
    terminationMessagePolicy: File
    volumeMounts:
    - mountPath: /var/run/secrets/kubernetes.io/serviceaccount
      name: kube-api-access-qskm4
      readOnly: true
  dnsPolicy: ClusterFirst
```

the output is too verbose for troubleshooting. This is where `neat` plugin comes to our rescue.


Let's get the pod details, this time add `| kubectl neat` at the end of the command :

```bash
kubectl get pods nginx-7fd68f74d-ntpdc -oyaml | kubectl neat
```
```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: nginx
    pod-template-hash: 7fd68f74d
  name: nginx-7fd68f74d-ntpdc
  namespace: default
spec:
  containers:
  - image: quay.io/shardul/nginx:v1
    imagePullPolicy: Always
    name: nginx
    resources:
      requests:
        cpu: "1"
    volumeMounts:
    - mountPath: /var/run/secrets/kubernetes.io/serviceaccount
      name: kube-api-access-qskm4
      readOnly: true
```

`kubectl-neat` omits `managedFields`, `default values` and `status` fields and some metadata fields such as `creationTimestamp`, `resourceVersion`,`selfLink` and `uid`.

#### view-secret Plugin

Install [view-secret](https://github.com/elsesiy/kubectl-view-secret) plugin with krew: 

```bash
kubectl krew install view-secret
```

`view-secret` plugin saves a lot of time when you want to view a secret in the cluster, especially if it's a secret with multiple keys and values. Normally to view a secret you would do:
```bash
kubectl get secret my-secret -o yaml
```

```yaml
apiVersion: v1
data:
  key1: c3VwZXJzZWNyZXQ=
  key2: dG9wc2VjcmV0
kind: Secret
metadata:
  creationTimestamp: "2022-10-14T19:58:25Z"
  name: my-secret
  namespace: default
  resourceVersion: "88915"
  uid: 4b6fbf40-f27f-4744-ab61-2d7457a41ce6
type: Opaque
```

then copy the values such as `c3VwZXJzZWNyZXQ=` and decode it with base64:

```bash
echo "c3VwZXJzZWNyZXQ=" | base64 -d
supersecret
```

With the `view-secret` plugin, you can just do :

```yaml
kubectl view-secret my-secret --all
key1=supersecret
key2=topsecret
```

#### access-matrix Plugin
Install [access-matrix](https://github.com/corneliusweig/rakkess) plugin with krew : 

```bash
kubectl krew install access-matrix
```

The `access-matrix` plugin is very useful to visualize your access in the cluster or to find out who can access a particular resource in the cluster.

#### blame Plugin
Install [blame](https://github.com/knight42/kubectl-blame) plugin with krew : 

```bash
kubectl krew install blame
```

The `blame` plugin helps you to figure out who changed several fields of an object in the cluster - `kubectl`, `kube-controller-manager` or `helm`. It internally uses the `.metadata.manageFields` field of the object to get this information. 

> Read more about `metadata.managedFields` [here](https://kubernetes.io/docs/reference/using-api/server-side-apply/).

If we edit a deployment `nginx` manually and update the replias to 2. We can see those details using the `blame` plugin that changes were done using `kubectl edit`

```bash
kubectl blame deploy nginx  
```

```yaml
                                                  spec:
kubectl-client-side-apply (Update    8 hours ago)   progressDeadlineSeconds: 600
kubectl-edit              (Update 26 minutes ago)   replicas: 2
kubectl-client-side-apply (Update    8 hours ago)   revisionHistoryLimit: 10
```

#### df-pv Plugin
Install [df-pv](https://github.com/yashbhutwala/kubectl-df-pv) plugin with krew : 
```bash
kubectl krew install df-pv
```

If you are familiar with the `df` command in Linux and Mac, then you would love the `df-pv` plugin. It provides the same functionality as `df` provides, except that it provides details for [Persistent volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) in a human-readable format.

The `df-pv` plugin comes in handy if you want to get an overall view of PVs in the cluster. It shows you details like `Size`, `Used`, `Available`, and `%Used`.

## Installing plugins directly from repositories

Apart from the krew index, `plugins` can be installed from private repositories via manual steps or using a custom plugin index.

> In the end plugins are just executables. 

### clean plugin
Install [clean](https://github.com/shardulsrivastava/kubectl-plugin#kubectl-clean) plugin manually : 
```bash
git clone git@github.com:shardulsrivastava/kubectl-plugin.git
cd kubectl-plugin/plugins/clean
mv kubectl-clean /usr/local/bin
kubectl clean --help
```

The `clean` plugin comes handy if you're using EKS or GKE where you have orphaned pods lying around cluttering the cluster. It cleans them all up in one go.

To delete all the orphaned pods in your cluster 

```bash
kubectl clean all
```

or you can clean up a particular namespace:

```bash
kubectl clean my-namespace
```

### gke-outdated plugin
Install [gke-outdated](https://github.com/shardulsrivastava/kubectl-plugin#kubectl-gke-outdated) plugin manually : 
```bash
git clone git@github.com:shardulsrivastava/kubectl-plugin.git
cd kubectl-plugin/plugins/gke-outdated
mv kubectl-gke_outdated print-table /usr/local/bin
kubectl gke-outdated --help
```

The `gke-outdated` plugin finds all the outdated GKE clusters in your GCP organization's folder.

To check all the GKE clusters running outdated kubernetes versions inside folder Id `907623304376` :

```bash
kubectl gke-outdated 907623304376 1.22
```

this will list all the GKE clusters inside of folder `907623304376` that are running a version less than `1.22`.
