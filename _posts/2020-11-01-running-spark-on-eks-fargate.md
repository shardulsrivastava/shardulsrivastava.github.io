---
layout: post
title:  "Running Apache Spark on EKS Fargate"
author: shardul
categories: [ spark, kubernetes ]
tags: [spark, kubernetes]
image: assets/images/spark.jpg
description: "Running Apache Spark on EKS Fargate"
featured: true
comments: false
---

Apache Spark is one of the most famous Big Data frameworks that allows you to process data at any scale. 

Spark jobs can run on the Kubernetes cluster and have native support for the Kubernetes scheduler from [release 3.1.1](https://spark.apache.org/releases/spark-release-3-1-1.html) onwards.

Spark comes with a `spark-submit` script that allows submitting spark applications on a cluster using a single interface without the need to customize the script for different cluster managers.

`spark-submit` on Kubernetes cluster works as follows:

1. Spark creates a Spark driver running within a Kubernetes pod.
2. The driver creates executors which are also running within Kubernetes pods and connects to them and executes application code.
3. When the application completes, the executor pods terminate and are cleaned up, but the driver pod persists logs and remains in “completed” state in the Kubernetes API until it’s eventually garbage collected or manually cleaned up.

![spark-eks](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/mxarfncezl1094ravi9h.png)

To submit a spark job on a kubernetes cluster using `spark-submit` :

```bash
./bin/spark-submit \
    --master k8s://https://<k8s-apiserver-host>:<k8s-apiserver-port> \
    --deploy-mode cluster \
    --name spark-pi \
    --class org.apache.spark.examples.SparkPi \
    --conf spark.executor.instances=5 \
    --conf spark.kubernetes.container.image=<spark-image> \
    local:///path/to/examples.jar
```

While `spark-submit` provides support for several Kubernetes features such as `secrets`, `persistentVolumes`, `rbac` via [configuration parameters](https://spark.apache.org/docs/latest/running-on-kubernetes.html#configuration), it still lacks a lot of features thus it's not suitable to use in production effectively.

#### Spark on K8s Operator

[Spark on K8s Operator](https://github.com/GoogleCloudPlatform/spark-on-k8s-operator) is a project from Google that allows submitting spark applications on Kubernetes cluster using CustomResource Definition [SparkApplication](https://github.com/GoogleCloudPlatform/spark-on-k8s-operator/blob/master/docs/api-docs.md#sparkoperator.k8s.io/v1beta2.SparkApplication).
It uses mutating admission webhook to modify the pod spec and add the features not officially supported by `spark-submit`.

The Kubernetes Operator for Apache Spark consists of:

1. A `SparkApplication` controller that watches events of creation, updates, and deletion of `SparkApplication` objects and acts on the watch events,
a submission runner that runs `spark-submit` for submissions received from the controller,
2. A Spark pod monitor that watches for Spark pods and sends pod status updates to the controller,
3. A [Mutating Admission Webhook](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/) that handles customizations for Spark driver and executor pods based on the annotations on the pods added by the controller,
4. A command-line tool named `sparkctl` for working with the operator.

The following diagram shows how different components interact and work together.

![spark-operator](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/izwol4kmf92ybjpx0p4g.png)

#### Setup Spark on K8s Operator on EKS Fargate

1. Setup EKS cluster using `eksctl` with fargate profile for `default`, `kube-system`, and `spark` namespaces.

    ```bash
    eksctl apply -f - <<EOF
    apiVersion: eksctl.io/v1alpha5
    kind: ClusterConfig
    metadata:
      name: spark-cluster
      region: us-east-1
      version: "1.21"
    availabilityZones: 
      - us-east-1a
      - us-east-1b
      - us-east-1c
    fargateProfiles:
      - name: fp-all
        selectors:
          - namespace: kube-system
          - namespace: default
          - namespace: spark
    EOF
    ```

2. Install `Spark on K8s Operator` using helm3 in the `spark` namespace.

    ```bash
    helm repo add spark-operator https://googlecloudplatform.github.io/spark-on-k8s-operator
    helm upgrade \
        --install \
        spark-operator \
        spark-operator/spark-operator \
        --namespace spark \
        --create-namespace \
        --set webhook.enable=true \
        --set sparkJobNamespace=spark \
        --set serviceAccounts.spark.name=spark \
        --set logLevel=10 \
        --version 1.1.6 \
        --wait
    ```
3. Verify Operator installation

    ```bash
    kubectl get pods -n spark
    ```

#### Submit SparkPi on EKS Cluster

1. Submit the `SparkPi` application to the EKS cluster 

    ```bash
    kubectl apply -f - <<EOF
    apiVersion: "sparkoperator.k8s.io/v1beta2"
    kind: SparkApplication
    metadata:
      name: spark-pi
      namespace: spark
    spec:
      type: Scala
      mode: cluster
      image: "gcr.io/spark-operator/spark:v3.1.1"
      imagePullPolicy: Always
      mainClass: org.apache.spark.examples.SparkPi
      mainApplicationFile: "local:///opt/spark/examples/jars/spark-examples_2.12-3.1.1.jar"
      sparkVersion: "3.1.1"
      restartPolicy:
        type: Never
      driver:
        cores: 1
        coreLimit: "1200m"
        memory: "512m"
        labels:
          version: 3.1.1
        serviceAccount: spark
      executor:
        cores: 1
        instances: 1
        memory: "512m"
        labels:
          version: 3.1.1
    EOF
    ``` 
    Note: [hostPath](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath) volume mounts are not supported in Fargate.

2. Check the status of `SparkApplication` 

    ```bash
    kubectl -n spark describe sparkapplications.sparkoperator.k8s.io spark-pi
    ```

3. Access Spark UI by port-forwarding to the `spark-pi-ui-svc`

    ```bash
    kubectl -n spark port-forward svc/spark-pi-ui-svc 4040:4040
    ```

    ![spark-pi](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/soqlp8l157tkci21kry9.png)
