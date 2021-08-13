---
layout: post
title:  "Canary Deployment with Istio in EKS"
author: shardul
tags: [istio, canary, kubernetes, eks]
image: assets/images/istio-eks.png
description: "Canary Deployment with Istio in EKS"
featured: true
comments: false
---

Canary deployment is a way of deploying application in a phased manner. In this pattern, we deploy a new version of the application alongside production vesion, then split a percentage of traffic to the canary version and test it.
Once 



#### Setup EKS Cluster

Setup an EKS cluster of version `1.21` in `us-east-1` region with a managed node group `default-pool` of machine type `t3-small`. 

1. Download and install latest version of `eksctl`

   ```bash
   curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
   sudo mv /tmp/eksctl /usr/local/bin
   ```
   for Mac and other operating systems, follow the steps [here](https://eksctl.io/introduction/#installation).


2. Create EKS cluster
   ```bash
   eksctl create cluster --name dev-cluster \
          --version 1.21 \
          --region us-east-1 \
          --nodegroup-name default-pool \
          --node-type t3a.small \
          --nodes 3 \
          --nodes-min 0 \
          --nodes-max 4 \
          --managed
   ```
   Once Control plane is ready, you should see the output like this 

   ```bash
   2021-08-13 23:59:52 [ℹ]  waiting for the control plane availability...
   2021-08-13 23:59:52 [✔]  saved kubeconfig as "/Users/shardulsrivastava/.kube/config"
   2021-08-13 23:59:52 [ℹ]  no tasks
   2021-08-13 23:59:52 [✔]  all EKS cluster resources for "dev-cluster" have been created
   2021-08-14 00:01:57 [ℹ]  kubectl command should work with "/Users/shardulsrivastava/.kube/config", try 'kubectl get nodes'
   2021-08-14 00:01:57 [✔]  EKS cluster "dev-cluster" in "ap-southeast-1" region is ready
  ```
   Note: You would need minimum of [these permissions](https://eksctl.io/usage/minimum-iam-policies/) to run eksctl commands above.

3. Download and install `kubectl`

   ```bash
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
   ```

4. Check the pods running in cluster:
   
   ```bash
   kubectl get pods -A
   ```

   At this point, your cluster would have only `core-dns`, `kube-proxy` and `amazon-vpc-cni` plugin.

   ![eks-cluster](/assets/images/eks-cluster.png)


#### Setup Istio

Istio provides a convenient binary `istioctl` to setup and interact with Istio components.

1. Install `istioctl` and if you're running these commands from an ec2 instance, add the installation directory to system path:

   ```bash
   curl -L https://istio.io/downloadIstio | sh -
   export PATH="$PATH:/home/ec2-user/istio-1.11.0/bin"
   ```

2. Istio has multiple configuration [profiles](https://istio.io/latest/docs/setup/additional-setup/config-profiles/), these profiles provide customization of the Istio control plane and of the sidecars for the Istio data plane.
   `default` profile is recommended for production deployments.

   ```bash
   istioctl install --set profile=default -y
   ```

   alternatively, you can also take the dump of the manifests and apply using kubectl:

   ```bash
    istioctl manifest generate --set profile=default > generated-manifest.yaml
    kubectl apply -f generated-manifest.yaml
   ```

   Once installed, you should see the output like this for successful installation.

   ![istioctl-output](/assets/images/istioctl-output.png)


   Note: If you get the below error, you should check the the instance type you are using as there is a limit to the number of pods that can be scheduled on the node based on the node's instance type. See [here](https://github.com/awslabs/amazon-eks-ami/blob/master/files/eni-max-pods.txt) for the list of instance types and the max pods.

   ![istioctl-error](/assets/images/istioctl-error.png)

3. Istio injects a [envoy proxy](https://github.com/envoyproxy/envoy) side-car container to the pods to intercept traffic from pods, this behaviour is enabled using label `istio-injection=enabled` on the namespace level and `sidecar.istio.io/inject=true` on the pod level.

   Add this label to default namespace to instruct Istio to automatically inject Envoy sidecar proxies.

   ```bash
   kubectl label namespace default istio-injection=enabled
   ```

   Read more about Istio side-car injection [here](https://istio.io/latest/docs/setup/additional-setup/sidecar-injection/).

#### Setup two versions of sample Application




