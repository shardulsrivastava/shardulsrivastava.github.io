---
layout: post
title:  "Running Apache Spark on Kubernetes"
author: shardul
categories: [ spark, kubernetes ]
tags: [spark, kubernetes]
image: assets/images/spark.jpg
description: "A tutorial on runnning apache spark on Kubernetes using spark submit and Spark on K8s Operator"
featured: true
hidden: true
comments: false
---

Apache Spark is one of the most famous Big Data framework that allows you to process data at any scale.

#### Spark Submit

It's actually really simple! Add the rating in your YAML front matter. It also supports halfs:

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


#### Spark on K8s Operator

Install Spark on K8s operator by following the steps here and then submit a SparkApplication.


```bash
	kubectl apply -f my-spark-application.yaml 
```