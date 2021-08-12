---
layout: post
title:  "Cloud Native Chaos Engineering with Chaos Mesh"
author: shardul
tags: [chaosengineering, kubernetes]
image: assets/images/chaos-engineering.jpg
description: "Cloud Native Chaos Engineering with Chaos Mesh"
featured: true
comments: false
---

With Cloud, distributed architectures have grown even more complex and with complexity comes the uncertainty in how the system could fail.

Chaos Engineering aims to test system resiliency by injecting faults to identify weaknesses before they cause massive outages such as improper fallback settings for a service, cascading failures due to a single point of failure, or retry storms due to misconfigured timeouts.


#### History

Chaos Engineering started at Netflix back in 2010 when Netflix moved from on-prem servers to AWS infrastructure to test the resiliency of their infrastructure. 

In 2012, Netflix open-sourced [ChaosMonkey](https://github.com/Netflix/chaosmonkey) under Apache 2.0 license that randomly terminates instances to ensure that services are resilient to instance failures.


#### Cloud Native Chaos Engineering in CNCF Landscape
    
CNCF focuses on Cloud Native Chaos Engineering defined as engineering practices focused on (and built on) Kubernetes environments, applications, microservices, and infrastructure.

Cloud Native Chaos Engineering has 4 core principles:
1. Open source
2. CRDs for Chaos Management 
3. Extensible and pluggable
4. Broad Community adoption

CNCF has two sandbox projects for Cloud Native Chaos Engineering 

1. [ChaosMesh](https://github.com/chaos-mesh/chaos-mesh)
2. [Litmus Chaos](https://github.com/litmuschaos/litmus)


![cncf-chaos-engineering](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/gmb5uh3kd7q6izwjsf3i.png)


#### Chaos Mesh

Chaos Mesh is a cloud-native Chaos Engineering platform that orchestrates chaos on Kubernetes environments. It is based on [Kubernetes Operator pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/) and provides a Chaos Operator to inject into the applications and Kubernetes infrastructure in a manageable way.

Chaos Operator uses Custom Resource Defition(CRD) to define chaos objects. It provides a variety of these CRDs for fault injection such as :

1. [PodChaos](https://chaos-mesh.org/docs/simulate-pod-chaos-on-kubernetes/)
2. [NetworkChaos](https://chaos-mesh.org/docs/simulate-network-chaos-on-kubernetes)
3. [DNSChaos](https://chaos-mesh.org/docs/simulate-dns-chaos-on-kubernetes)
4. [HTTPChaos](https://chaos-mesh.org/docs/simulate-http-chaos-on-kubernetes)
5. [StressChaos](https://chaos-mesh.org/docs/simulate-heavy-stress-on-kubernetes)
6. [IOChaos](https://chaos-mesh.org/docs/simulate-io-chaos-on-kubernetes)
7. [TimeChaos](https://chaos-mesh.org/docs/simulate-time-chaos-on-kubernetes)
8. [KernelChaos](https://chaos-mesh.org/docs/simulate-kernel-chaos-on-kubernetes)
9. [AWSChaos](https://chaos-mesh.org/docs/simulate-aws-chaos)
10. [GCPChaos](https://chaos-mesh.org/docs/simulate-gcp-chaos)
11. [JVMChaos](https://chaos-mesh.org/docs/simulate-jvm-application-chaos)


#### Chaos Mesh Installation 

Chaos Mesh can be installed quickly using [installtion script](https://chaos-mesh.org/docs/quick-start#quick-installation). However, it's recommended to use Helm 3 chart in production environments.

To install Chaos Mesh using Helm :

1. Add the Chaos Mesh repository to the Helm repository.

   ```bash
   helm repo add chaos-mesh https://charts.chaos-mesh.org
   ``` 

2. It's recommended to install ChaosMesh in a separate namespace, so you can either create a namespace `chaos-testing` manually or let Helm create it automatically, if it doesn't exist :

   ```bash
   helm upgrade \
        --install \
        chaos-mesh \
        chaos-mesh/chaos-mesh \
        -n chaos-testing \
        --create-namespace \
        --version v2.0.0 \
        --wait
   ```

   Note: If you're using GKE or EKS with `containerd`, then use

   ```bash
   helm upgrade \
        --install \
        chaos-mesh \
        chaos-mesh/chaos-mesh \
        -n chaos-testing \
        --create-namespace \
        --set chaosDaemon.runtime=containerd \
        --set chaosDaemon.socketPath=/run/containerd/containerd.sock \
        --version v2.0.0 \
        --wait
   ```

3. Verify if pods are running :

   ```bash
   kubectl get pods -n chaos-testing
   ```

#### Run First Chaos Mesh Experiment

Chaos Experiment describes what type of fault is injected and how.

1. Setup an Nginx pod and expose it on port 80.

   ```bash
   kubectl run nginx --image=nginx --labels="app=nginx" --port=80
   ```
2. Get the IP of the nginx pod

   ```bash
   kubectl get pods nginx -ojsonpath="{.status.podIP}"
   ```

3. Open another terminal and setup a test pod to test the connectivity to nginx pod :

   ```bash
   kubectl run -it test-connection --image=radial/busyboxplus:curl -- sh
   ping <IP of the Nginx Pod> -c 2
   ```

   this should show you the time it takes to ping the IP :

   ![nginx-pod-connectivity](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/tpjo9rn4tw0gy2rb6mao.png)


3. Create your first Chaos Experiment by running :

   ```bash
   kubectl apply -f - <<EOF
   apiVersion: chaos-mesh.org/v1alpha1
   kind: NetworkChaos
   metadata:
     name: nginx-network-delay
   spec:
     action: delay
     mode: one
     selector:
       namespaces:
         - default
       labelSelectors:
         'app': 'nginx'
     delay:
       latency: '1s'
     duration: '60s'
   EOF
   ```

   this will create a CRD of type `NetworkChaos` that will introduce a latency of `1 second` in the network of pods with labels `app:nginx` i.e nginx pod for the next `60 seconds`.

4. Test the response of ping to the nginx pod now to see the delay of `1 second`.


   ![nginx-pod-connectivity-with-delay](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/z0m58z0ya82bmf6hiwix.png)


#### Run HTTPChaos Experiment

`HTTPChaos` allows you to inject faults in the request and response of an HTTP server. It supports `abort`,`delay`,`replace`,`patch` fault types.

`Note: Before proceeding, delete the NetworkChaos experiment created earlier.`


1. Check the response time of nginx pod :

   ```bash
   kubectl exec -it test-connection -- sh
   time curl <IP of the Nginx Pod>
   ```
   
   ![nginx-pod-httpchaos](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/tspvf7p8ynhxh5gdnsfj.png)

2. Create `HTTPSChaos` experiment by running:

   ```bash
   apiVersion: chaos-mesh.org/v1alpha1
   kind: HTTPChaos
   metadata:
     name: nginx-http-delay
   spec:
     mode: all
     selector:
       labelSelectors:
         app: nginx
     target: Request
     port: 80
     delay: 1s
     method: GET
     path: /
     duration: 5m
   ```

   this will create a CRD of type `HTTPChaos` that will introduce a latency of `1 seconds` to the requests sent to the pods with labels `app:nginx` i.e nginx pod on port 80 for the next `5 mins`.

   Note: If you get an error like `admission webhook "vauth.kb.io" denied the request`, as of version 2.0 there is an open issue [2187](https://github.com/chaos-mesh/chaos-mesh/issues/2187) and a temporary fix is to delete the validating webhook.

   ```bash
   kubectl delete validatingwebhookconfigurations.admissionregistration.k8s.io validate-auth
   ```

3. Test the response time of nginx pod :

   ```bash
   time curl <IP of the Nginx Pod>
   ```

   you will see the additional `1 second` latency in the response.

   ![nginx-pod-httpchaos-delay](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/hscss8vmlksy2sv9zp3e.png)
