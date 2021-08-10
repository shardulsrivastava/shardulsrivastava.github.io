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


![cncf-chaos-engineering]({{ site.baseurl }}/assets/images/cncf-chaos-engineering.png)


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

1. Setup a Nginx pod and expose it as a service on port 80. 

   ```bash
   kubectl run nginx --image=nginx --labels="app=nginx" --port=80 --expose
   ```

2. Open another terminal and setup a test pod to test the connectivity to nginx service :

   ```bash
   kubectl run -it test-connection --image=radial/busyboxplus:curl -- sh
   curl nginx
   ```
   this should show the response like this :

   ![nginx-test]({{ site.baseurl }}/assets/images/nginx-test.png)


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
       latency: '2s'
     duration: '60s'
   EOF
   ```

   this will create a CRD of type `NetworkChaos` that will introduce a latency of `1 seconds` in the response of application with labels `app:nginx` i.e nginx service for the next 60 seconds.

4. Test the response of you nginx service now to see the delay of 1 seconds.

