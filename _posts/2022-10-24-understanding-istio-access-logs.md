---
layout: post
title:  Understanding Istio Access Logs
canonical_url: https://dev.to/shardulsrivastava/understanding-istio-access-logs-2k5o
author: shardul
tags: [istio, kubernetes, logs]
categories: [istio, kubernetes, logs]
image: assets/images/istio-access-logging.png
description: "Understanding Istio Access Logs"
featured: true
comments: false
---
Istio access logs are very helpful to understand the incoming traffic pattern. These logs are produced by the Envoy proxy and can be viewed overall at the Istio Ingress gateway or at the individual pod that is injected with the envoy proxy sidecar.

## Enable Istio Access Logs

Istio access logs are not enabled by default, it can be enabled by setting the `meshConfig.accessLogFile` of the `IstioOperator` resource.

A basic istio installation with access logs enabled would look like this:

```yaml
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  meshConfig:
    accessLogFile: /dev/stdout
``` 

Here the value `/dev/stdout` outputs the access logs to standard output. By default these access logs are in **TEXT** format i.e it looks like this :

```bash
[2022-10-23T20:38:15.413Z] "GET / HTTP/1.1" 200 - via_upstream - "-" 0 37 0 0 "-" "curl/7.35.0" "3ce3e159-9dba-4617-9e85-feb1106a682c" "nginx" "192.168.42.152:80" inbound|80|| 127.0.0.6:52375 192.168.42.152:80 192.168.59.90:34854 outbound_.80_._.nginx.default.svc.cluster.local default
``` 

it can be changed to json by setting `.spec.meshConfig.accessLogEncoding` to `JSON` and logs would change to:

```json
{
    "response_code_details": "via_upstream",
    "downstream_remote_address": "192.168.59.90:58478",
    "downstream_local_address": "192.168.42.152:80",
    "request_id": "e2873f51-0a42-4da4-a8e8-f711b46dea5c",
    "authority": "nginx",
    "requested_server_name": "outbound_.80_._.nginx.default.svc.cluster.local",
    "upstream_cluster": "inbound|80||",
    "path": "/",
    "bytes_sent": 37,
    "user_agent": "curl/7.35.0",
    "method": "GET",
    "upstream_local_address": "127.0.0.6:41549",
    "x_forwarded_for": null,
    "start_time": "2022-10-23T22:15:39.663Z",
    "response_code": 200,
    "upstream_transport_failure_reason": null,
    "duration": 0,
    "upstream_service_time": "0",
    "response_flags": "-",
    "upstream_host": "192.168.42.152:80",
    "route_name": "default",
    "bytes_received": 0,
    "protocol": "HTTP/1.1",
    "connection_termination_details": null
}
```

<!-- TO-DO: A Helm chart-based installation access logs  --> 

## Istio Access Logs Format
When Istio access logs are enabled, they are by default in this format

```bash
[%START_TIME%] \"%REQ(:METHOD)% %REQ(X-ENVOY-ORIGINAL-PATH?:PATH)% %PROTOCOL%\" %RESPONSE_CODE% %RESPONSE_FLAGS% %RESPONSE_CODE_DETAILS% %CONNECTION_TERMINATION_DETAILS%
\"%UPSTREAM_TRANSPORT_FAILURE_REASON%\" %BYTES_RECEIVED% %BYTES_SENT% %DURATION% %RESP(X-ENVOY-UPSTREAM-SERVICE-TIME)% \"%REQ(X-FORWARDED-FOR)%\" \"%REQ(USER-AGENT)%\" \"%REQ(X-REQUEST-ID)%\"
\"%REQ(:AUTHORITY)%\" \"%UPSTREAM_HOST%\" %UPSTREAM_CLUSTER% %UPSTREAM_LOCAL_ADDRESS% %DOWNSTREAM_LOCAL_ADDRESS% %DOWNSTREAM_REMOTE_ADDRESS% %REQUESTED_SERVER_NAME% %ROUTE_NAME%\n
```

here `%` is used to define a field to be printed in the access logs. To print the response code we can use `%RESPONSE_CODE%`. Let's look at some of the important fields here:

1. **`%START_TIME%`**  - Request start time.
2. **`%RESPONSE_CODE%`** - Response code of the request.
3. **`%RESPONSE_FLAGS%`** - Additional details about response.  More details [here](https://www.envoyproxy.io/docs/envoy/latest/configuration/observability/access_log/usage#command-operators:~:text=typed%20JSON%20logs.-,%25RESPONSE_FLAGS%25,-Additional%20details%20about)
4. **`%RESPONSE_CODE_DETAILS%`** - Response code details. More details [here](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_conn_man/response_code_details#response-code-details).
5. **`%DURATION%`** - Total duration of the request.
6. **`%UPSTREAM_HOST%`** - Upstream where the request is routed to, this would have the pod where the request went. 
7. **`%REQ()%`** - This is used for printing request headers `%REQ(-FORWARDED-FOR)%` would print the `X-FORWARDED-FOR` request header.
8. **`%RESP()%`** - This is used for printing response headers `%RESP(CONTENT-TYPE)%` would print the `CONTENT-TYPE` header in the response.

An exhausting list of fields that can be used to show access log information can be found [here](https://www.envoyproxy.io/docs/envoy/latest/configuration/observability/access_log/usage#command-operators). 

## Customize Access Logs Format
If you want to parse your logs with a tool like [Loki](https://grafana.com/oss/loki/), json format logs would be well suited. Access logs format can be changed by setting the `meshConfig.accessLogFormat`. 

Eg: To print json logs in a custom format

```yaml
spec:
  meshConfig:
    accessLogFile: /dev/stdout
    accessLogEncoding: JSON
    accessLogFormat: |
      {
        "protocol": "%PROTOCOL%",
        "upstream_service_time": "%REQ(X-ENVOY-UPSTREAM_SERVICE_TIME)%",
        "upstream_local_address": "%UPSTREAM_LOCAL_ADDRESS%",
        "duration": "%DURATION%",
        "upstream_transport_failure_reason": "%UPSTREAM_TRANSPORT_FAILURE_REASON%",
        "route_name": "%ROUTE_NAME%",
        "downstream_local_address": "%DOWNSTREAM_LOCAL_ADDRESS%",
        "user_agent": "%REQ(USER-AGENT)%",
        "response_code": "%RESPONSE_CODE%",
        "response_flags": "%RESPONSE_FLAGS%",
        "start_time": "%START_TIME%",
        "method": "%REQ(:METHOD)%",
        "request_id": "%REQ(X-REQUEST-ID)%",
        "upstream_host": "%UPSTREAM_HOST%",
        "x_forwarded_for": "%REQ(X-FORWARDED-FOR)%",
        "client_ip": "%REQ(TRUE-Client-IP)%",
        "requested_server_name": "%REQUESTED_SERVER_NAME%",
        "bytes_received": "%BYTES_RECEIVED%",
        "bytes_sent": "%BYTES_SENT%",
        "upstream_cluster": "%UPSTREAM_CLUSTER%",
        "downstream_remote_address": "%DOWNSTREAM_REMOTE_ADDRESS%",
        "authority": "%REQ(:AUTHORITY)%",
        "path": "%REQ(X-ENVOY-ORIGINAL-PATH?:PATH)%",
        "response_code_details": "%RESPONSE_CODE_DETAILS%"
      }
```

### Printing Known Request and Response Headers
EnvoyProxy allows printing request headers and response headers with `%REQ(X?Y):Z%` and `%RESP(X?Y):Z%` respectively. This can be used to print any request header or response header and if the header is not present an alternative header can be given optionally.

**`%REQ(X-ENVOY-ORIGINAL-PATH?:PATH)%` would print the `X-ENVOY-ORIGINAL-PATH` header, if it didn't exist `PATH` header would be printer and if even the `PATH` header is not present then `-` would be printed instead.

So we can print all the headers that we know the name of, but how about any dynamic headers whose name changes with every request.

![Istio Access logs IDK]({{ site.baseurl }}/assets/images/istio-logging-think.jpeg)

### Printing Request Headers and Request Body

Istio uses EnvoyProxy which is extensible by design, `EnvoyFilter` provides a mechanism to customize the Envoy configuration. 

The `HTTP Lua filter` allows Lua scripts to be run during both the request and response flows. This Envoy HTTP Lua filter prints all the request headers :


```yaml
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: request-filter
  namespace: istio-system
spec:
  configPatches:
    - applyTo: HTTP_FILTER
      match:
        context: GATEWAY
        listener:
          filterChain:
            filter:
              name: envoy.filters.network.http_connection_manager
              subFilter:
                name: envoy.filters.http.router
      patch:
        operation: INSERT_BEFORE
        value:
          name: envoy.lua
          typed_config:
            '@type': type.googleapis.com/envoy.extensions.filters.http.lua.v3.Lua
            inlineCode: |
              -- Called on the request path.
              function envoy_on_request(request_handle)
                  request_handle:logCritical("Printing Request Headers => ")
                  for key, value in pairs(request_handle:headers()) do
                    request_handle:logCritical(key .. " => " .. value)
                  end
                  for chunk in request_handle:bodyChunks() do
                    request_handle:logCritical("Printing Request body => " .. chunk:getBytes(0, chunk:length()))
                  end
              end
  workloadSelector:
    labels:
      app: istio-ingressgateway
```

```bash
kubectl apply -f istio-filter.yaml
```

once applied, all the headers will be printed in the logs:

```
2022-10-23T23:48:39.750646Z critical  envoy lua script log: Printing Request Headers => 
2022-10-23T23:48:39.750688Z critical  envoy lua script log: :authority => 54.77.207.3
2022-10-23T23:48:39.750691Z critical  envoy lua script log: :path => /
2022-10-23T23:48:39.750693Z critical  envoy lua script log: :method => GET
2022-10-23T23:48:39.750695Z critical  envoy lua script log: :scheme => http
2022-10-23T23:48:39.750697Z critical  envoy lua script log: user-agent => Mozilla/5.0 (Windows NT 6.2;en-US) AppleWebKit/537.32.36 (KHTML, live Gecko) Chrome/56.0.3006.85 Safari/537.32
2022-10-23T23:48:39.750699Z critical  envoy lua script log: accept-encoding => gzip, deflate
2022-10-23T23:48:39.750701Z critical  envoy lua script log: accept => */*
2022-10-23T23:48:39.750714Z critical  envoy lua script log: x-forwarded-for => 192.168.59.163
2022-10-23T23:48:39.750716Z critical  envoy lua script log: x-forwarded-proto => http
2022-10-23T23:48:39.750717Z critical  envoy lua script log: x-envoy-internal => true
2022-10-23T23:48:39.750719Z critical  envoy lua script log: x-request-id => 0d1def76-2d84-4ddb-9aa3-62b2445cc1f8
2022-10-23T23:48:39.750747Z critical  envoy lua script log: x-envoy-peer-metadata-id => router~192.168.45.105~istio-ingressgateway-94b448d6d-pbsqj.istio-system~istio-system.svc.cluster.local

```

Read more about EnvoyFilter [here](https://istio.io/latest/docs/reference/config/networking/envoy-filter/)

> Note: Here I am using `request_handle:logCritical` method because by default logLevel us WARN, you could also use `request_handle:logInfo` too if logLevel is changed to Info.
