---
layout: post
title:  "Canary Deployment with Istio on EKS"
author: shardul
tags: [istio, canary, kubernetes, eks]
image: assets/images/istio-eks.png
description: "Canary Deployment with Istio on EKS"
featured: true
comments: false
---

Canary deployment is a way of deploying the application in a phased manner. In this pattern, we deploy a new version of the application alongside the production version, then rollout the change to a small subset of servers. 
Once new version of application is tested by the real users, then rollout the change out to the rest of the servers.

Canary deployments can be complex and involve testing in production and manual verification.

![canary-release](/assets/images/canary-release.png)

To demonstrate Canary deployments, we will setup an EKS cluster, install Istio, deploy sample application and setup canary release of new version of application.

#### Setup EKS Cluster

Setup an EKS cluster of version `1.21` in `us-east-1` region with a managed node group `default-pool` of machine type `t3a-medium`. 

1. Download and install the latest version of `eksctl`

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
          --node-type t3a.medium \
          --nodes 3 \
          --nodes-min 0 \
          --nodes-max 4 \
          --managed
   ```
   Once the Control plane is ready, you should see the output like this 

   ```bash
   2021-08-13 23:59:52 [ℹ]  waiting for the control plane availability...
   2021-08-13 23:59:52 [✔]  saved kubeconfig as "/Users/shardulsrivastava/.kube/config"
   2021-08-13 23:59:52 [ℹ]  no tasks
   2021-08-13 23:59:52 [✔]  all EKS cluster resources for "dev-cluster" have been created
   2021-08-14 00:01:57 [ℹ]  kubectl command should work with "/Users/shardulsrivastava/.kube/config", try 'kubectl get nodes'
   2021-08-14 00:01:57 [✔]  EKS cluster "dev-cluster" in "ap-southeast-1" region is ready
  ```
   Note: You would need a minimum of [these permissions](https://eksctl.io/usage/minimum-iam-policies/) to run the eksctl commands above.

3. Download and install `kubectl`

   ```bash
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
   ```

4. Check the pods running in cluster:
   
   ```bash
   kubectl get pods -A
   ```

   At this point, your cluster would have only the `core-dns`, `kube-proxy`, and `amazon-vpc-cni` plugins.

   ![eks-cluster](/assets/images/eks-cluster.png)


#### Setup Istio

Istio provides a convenient binary `istioctl` to set up and interact with Istio components.

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

   Once installed, you should see the output like this for a successful installation.

   ![istioctl-output](/assets/images/istioctl-output.png)


   Note: If you get the below error, you should check the instance type you are using as there is a limit to the number of pods that can be scheduled on the node based on the node's instance type. See [here](https://github.com/awslabs/amazon-eks-ami/blob/master/files/eni-max-pods.txt) for the list of instance types and the max pods.

   ![istioctl-error](/assets/images/istioctl-error.png)

3. Istio injects a [envoy proxy](https://github.com/envoyproxy/envoy) side-car container to the pods to intercept traffic from pods, this behavior is enabled using label `istio-injection=enabled` on the namespace level and `sidecar.istio.io/inject=true` on the pod level.

   Add this label to the `default` namespace to instruct Istio to automatically inject Envoy sidecar proxies.

   ```bash
   kubectl label namespace default istio-injection=enabled
   ```

   Read more about Istio side-car injection [here](https://istio.io/latest/docs/setup/additional-setup/sidecar-injection/).

4. Install `Kiali`, `Prometheus` and `Grafana` to monitor and visualize mesh
   
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/istio/istio/1.10.3/samples/addons/prometheus.yaml
   kubectl apply -f https://raw.githubusercontent.com/istio/istio/1.10.3/samples/addons/grafana.yaml
   kubectl apply -f https://raw.githubusercontent.com/istio/istio/1.10.3/samples/addons/kiali.yaml
   ```

   Note: If you get an error like this `unable to recognize "https://raw.githubusercontent.com/istio/istio/1.10.3/samples/addons/kiali.yaml": no matches for kind "MonitoringDashboard" in version "monitoring.kiali.io/v1alpha1"`, then re-run the command:

   ```bash
   kubectl apply -f https://raw.githubusercontent.com/istio/istio/1.10.3/samples/addons/kiali.yaml
   ```

#### Setup sample application

To demonstrate how canary deployment works, let's set up version `v1` of an Nginx-based sample application and set up a service to expose it at port `80`.

1. Deploy `v1` vesion of sample application :

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     labels:
       app: nginx
     name: nginx-v1
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: nginx
         version: v1
     template:
       metadata:
         labels:
           app: nginx
           version: v1
       spec:
         containers:
         - image: quay.io/shardul/nginx:v1
           name: nginx-v1
           imagePullPolicy: Always
           ports:
           - name: http
             containerPort: 80
           livenessProbe:
             httpGet:
               path: /health
               port: 80
           readinessProbe:
             httpGet:
               path: /health
               port: 80
   ```

2. Expose the application as a service:

   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     labels:
       app: nginx
     name: nginx
   spec:
     ports:
     - name: http
       port: 80
     selector:
       app: nginx
   ```

3. Setup a test pod to test the connectivity to the nginx service :

   ```bash
   kubectl run -it test-connection --image=radial/busyboxplus:curl -- sh
   [ root@test-connection:/ ]$ while true; do curl nginx && echo ; done
   You're at the root of nginx server v1
   You're at the root of nginx server v1
   You're at the root of nginx server v1
   You're at the root of nginx server v1
   ```

#### Canary Deployment with Istio

With Istio, traffic routing and replica deployment are totally independent of each other. Istio [routing rules](https://istio.io/latest/docs/concepts/traffic-management/#routing-rules) provide fine-grained control over how to route traffic based on `host`, `port`, `headers`, `uri`, `method`, `source labels` and control the distribution of traffic.

1. Deploy another version `v2` of the same application that uses image `quay.io/shardul/nginx:v2`.

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     labels:
       app: nginx
     name: nginx-v2
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: nginx
         version: v2
     template:
       metadata:
         labels:
           app: nginx
           version: v2
       spec:
         containers:
         - image: quay.io/shardul/nginx:v2
           name: nginx-v2
           imagePullPolicy: Always
           ports:
           - name: http
             containerPort: 80
           livenessProbe:
             httpGet:
               path: /health
               port: 80
           readinessProbe:
             httpGet:
               path: /health
               port: 80
   ```

   Once the `v2` version is deployed, when we hit the service again, we would get the below output :

   ```bash
   kubectl exec -it test-connection -- sh
   [ root@test-connection:/ ]$ while true; do curl nginx && echo ; done
   You're at the root of nginx server v2
   You're at the root of nginx server v2
   You're at the root of nginx server v1
   You're at the root of nginx server v1
   You're at the root of nginx server v2
   You're at the root of nginx server v1
   You're at the root of nginx server v1
   You're at the root of nginx server v2
   ```

   Since there are two deployments with different versions exposed from the same service, whenever you hit the service, it will hit the different versions of the application in a round-robin manner and hence this output.


2. [Istio Gateway](https://istio.io/latest/docs/reference/config/networking/gateway/) acts as a load balancer receiving incoming and outgoing HTTP/TCP connections and it's bound to the `istio-ingressgateway` resource created during installation as a `LoadBalancer` service.

   Setup a `default-gateway` for all the incoming traffic on port `80` :

   ```yaml
   apiVersion: networking.istio.io/v1alpha3
   kind: Gateway
   metadata:
     name: default-gateway
     namespace: istio-system
   spec:
     selector:
       istio: ingressgateway
     servers:
     - hosts:
       - '*'
       port:
         name: http
         number: 80
         protocol: HTTP
   ```

   ![istio-ingressgateway](/assets/images/istio-ingressgateway.png)

3. [Destination Rule](https://istio.io/latest/docs/reference/config/networking/destination-rule/) allows you to define [subsets](https://istio.io/latest/docs/reference/config/networking/destination-rule/#Subset) of an application based on a set of labels. For example, we have deployed two subsets `v1` and `v2` of an application, and they are identified by the label `version`.

   Setup a DestinationRule `nginx-dest-rule` to define two subsets `v1` and `v2`:

   ```yaml
   apiVersion: networking.istio.io/v1alpha3
   kind: DestinationRule
   metadata:
     name: nginx-dest-rule
   spec:
     host: nginx
     subsets:
     - name: v1
       labels:
         version: v1
     - name: v2
       labels:
         version: v2
   ```

4. [Virtual Service](https://istio.io/latest/docs/reference/config/networking/virtual-service/) acts just like an Ingress resource and matches traffic and directs it to a service based on the HTTP routing rules.
   
   It can operate on internal as well as external service and can match traffic based on HTTP host, path (with full regular expression support), method, headers, ports, query parameters.

   Setup a VirtualService `nginx-virtual-svc` for host `nginx` that receives the incoming traffic on `default-gateway` and routes 90% of the traffic to the subset `v1` and 10% to subset `v2` defined in `nginx-dest-rule`.

   ```yaml
   apiVersion: networking.istio.io/v1alpha3
   kind: VirtualService
   metadata:
     name: nginx-virtual-svc
   spec:
     hosts:
     - nginx
     gateways:
     - istio-system/default-gateway
     http:
     - route:
       - destination:
           host: nginx
           subset: v1
         weight: 90
       - destination:
           host: nginx
           subset: v2
         weight: 10
   ```

After applying, `90%` of the traffic will be routed to version `v1` and `10%` to `v2` of the `nginx` service. Access the nginx service via `istio-ingressgateway`.

```bash
kubectl exec -it test-connection -- sh
while true; do curl -H "Host: nginx" istio-ingressgateway.istio-system && echo ; done
```
We can visualize the traffic flow using the Kiali dashboard:

```bash
istioctl dashboard kiali
```

![istio-canary-routing](/assets/images/istio-canary-routing.png)

In production, after testing the `canary version` to ensure that it's working fine, we can update the VirtualService to route 100% of the traffic to this version and rollout the newer version for all the users.

