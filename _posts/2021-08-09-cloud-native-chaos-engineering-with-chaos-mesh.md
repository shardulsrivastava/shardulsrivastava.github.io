---
layout: post
title:  "Cloud Native Chaos Engineering with Chaos Mesh"
author: shardul
categories: [ chaosengineering, kubernetes ]
tags: [chaosengineering, kubernetes]
image: assets/images/chaos-mesh-cncf.png
description: "Cloud Native Chaos Engineering with Chaos Mesh"
featured: true
comments: false
---

With Cloud, distributed architectures have grown even more complex and with complexity comes the uncertainty in how the system could fail.

Chaos Engineering aims to test system resiliency by injecting faults to identify weaknesses before they cause massive outages such as improper fallback settings for a service, cascading failures due to a single point of failure or retry storms due to misconfigured timeouts.


#### History

Chaos Engineering started at Netflix back in 2010 when Netflix moved from on-prem servers to AWS infrastructure to test the resiliency of their infrastructure. 

In 2012, Netfix open-sourced [ChaosMonkey](https://github.com/Netflix/chaosmonkey) under Apache 2.0 license as a tool to test the resilience of your application infrastructure. 


#### Cloud Native Chaos Engineering in CNCF Landscape

CNCF focuses on Cloud Native Chaos Engineering defined as engineering practices focused on (and built on) Kubernetes environments, applications, microservices, and infrastructure.

Cloud Native Chaos Engineering has 4 core principles:
1. Open source
2. CRDs for Chaos Management 
3. Extensible and pluggable
4. Broad Community adoption


CNCF has two sandbox projects for Cloud Native Chaos Engineering [ChaosMesh](https://github.com/chaos-mesh/chaos-mesh) and [Litmus Chaos](https://github.com/litmuschaos/litmus).


![cncf-chaos-engineering]({{ site.baseurl }}/assets/images/cncf-chaos-engineering.png)


#### Chaos Mesh

