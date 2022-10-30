Apache Kafka is one of the most famous data stores. It's a go-to tool to collect streaming data at scale and process them with either [Kafka streams](https://kafka.apache.org/documentation/streams/) or [Apache Spark](https://spark.apache.org/docs/latest/structured-streaming-kafka-integration.html).

Getting started with Kafka is challenging as it involves familiarizing a lot of new concepts such as topics, replication, and offsets, and then you have to understand what a Zookeeper is.

If only there was a better way to get started with Kafka. Well, look on further. Confluent comes to your rescue, Confluent is a company specializing in Kafka with their cloud-based offering called Confluent cloud.

Why are we talking about a company with a SaaS offering, AWS has Managed Streaming Kafka why not them? Well, the reason is simple, Confluent has one focus which is Kafka and they have created some great tools to help with Kafka such as [KsqlDB](https://www.confluent.io/product/ksqldb/) that allows us to query streaming data (It's amazing, try it).

Apart from that Confluent has great articles on understanding Kafka internals and is one of the biggest contributors to the Kafka open-source project.

<!-- https://developer.confluent.io/quickstart/kafka-docker/ -->

## Kafka with Docker

To get started with Kafka on Docker, we are going to use confluent Kafka images.

1. Create a docker-compose.yaml file with one zookeeper and one Kafka container:

```yaml
version: '3'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    container_name: zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:latest
    container_name: broker
    ports:
      - "9092:9092"
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: 'zookeeper:2181'
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_INTERNAL:PLAINTEXT
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092,PLAINTEXT_INTERNAL://kafka:29092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
```

Start both containers in detached mode:
```bash
docker-compose up -d
```

this starts zookeeper on port `2181` and Kafka on port `9092` along with some configurations:
1. Zookeeper
	1. **`ZOOKEEPER_CLIENT_PORT`** - Port where Zookeeper would be available.
	2. **`ZOOKEEPER_TICK_TIME `**- the length of a single tick.

2. Kafka
	1. **`KAFKA_ZOOKEEPER_CONNECT`** - Instructs Kafka how to connect to ZooKeeper.
	2. **`KAFKA_LISTENER_SECURITY_PROTOCOL_MAP`** - Defines key/value pairs for the security protocol to use, per listener name.
	3. **`KAFKA_ADVERTISED_LISTENERS`** - A comma-separated list of listeners with their host/IP and port.
	4. **`KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR`** - Equivalent of broker configuration `offsets.topic.replication.factor` which is the replication factor for the offsets topic. Since we are running with just one Kafka node, we need to set this to 1.



> To learn more about Kafka listeners, check out these blog posts:
> 1. https://www.confluent.io/blog/kafka-listeners-explained/
> 2. https://www.confluent.io/blog/kafka-client-cannot-connect-to-broker-on-aws-on-docker-etc/

<!--
Ref -
https://rmoff.net/2018/08/02/kafka-listeners-explained/
-->

## Create Topics in Kafka

Kafka topics are like database tables(except for a few other details). Just like a database, we have to create a table to start storing the data, for Kafka we have to create a topic.

Unlike a database that has a command to create a database, Kafka comes with some utility scripts, one of which is to create a topic that requires mandatory input as the topic name and a few other optional arguments.

1. log in to the Kafka container

```bash
docker-compose exec kafka bash
```

2. Create a topic by the name `kafka-test`

```bash
/usr/bin/kafka-topics \
             --bootstrap-server broker:9092 \
             --create \
             --topic kafka-test \ 
             --replication-factor 
Created topic kafka-test.
```

Try running it again and you will get this error: 

> Error while executing the topic command: Topic 'kafka-test' already exists.

So, Not so much CI friendly ?? `--if-not-exists` allows to create a topic only when it doesn't exist:

```bash
/usr/bin/kafka-topics \
             --bootstrap-server broker:9092 \
             --create \
             --if-not-exists \
             --topic kafka-test \
             --replication-factor 1
```

There are a couple of other arguments that are essential for a good understanding of Kafka:

1. **`--partitions`** - Kafka topics are partitioned i.e the data of topics are spread across multiple brokers for scalability.
2.  **`--replication-factor`** - To make data in a topic fault-tolerant and highly-available, every topic can be replicated, so that there are always multiple brokers that have a copy of the data.

## What's a Kafka Message
Once we have the topic created, we can start sending messages to the topic. A Message consists of a variable-length header, a key, and a value. Let's talk about each of these.

1. Header - Headers are key-value pairs and give the ability to add some metadata about the kafka message. Read the original KIP(Kafka Improvement Proposals) proposing headers [here](https://cwiki.apache.org/confluence/display/KAFKA/KIP-82+-+Add+Record+Headers)

2. Key - Key for the kafka message. The key value can be null. Randomly chosen keys (i.e. serial numbers and UUID) are the best example of message keys. Read more about when you should use a key [here](https://forum.confluent.io/t/what-should-i-use-as-the-key-for-my-kafka-message/312/2).

3.  Value - Actual data to be stored in kafka. Could be a string, json, Protobuf, or AVRO data format.

## Writing to a Kafka Topic
Kafka provides a [Producer API](https://docs.confluent.io/platform/current/clients/producer.html) to send a message to the Kafka topic. This API is available in java with [kafka-clients](https://kafka.apache.org/33/javadoc/index.html?org/apache/kafka/clients/producer/KafkaProducer.html) library and python with [kafka-python](https://kafka-python.readthedocs.io/en/master/apidoc/KafkaProducer.html).

Luckily for us, we don't have to write any of these. Kafka comes with several out of box script that allows us to write data to a kafka topic. 

Run the command and as soon as the command returns `>` with a new line, enter the Json message:

```bash
/usr/bin/kafka-console-producer \
	--bootstrap-server kafka:9092 \
	--topic kafka-test
>{"tickers": [{"name": "AMZN", "price": 1902}, {"name": "MSFT", "price": 107}, {"name": "AAPL", "price": 215}]}
```

We have successfully sent a message to the topic. 

> Enter `Control + C` to stop the script.

however this message was sent without any key, To send a key we have to set the properties `parse.key` to allow sending the key and `key.separator` to set the separator for the key and value. 

> Default key separator is `\t(tab)`,we can set it wi `--property "key.separator=:"`

Let's try to send a message with a random key `stocks-123` this time:

```bash
/usr/bin/kafka-console-producer \
	--bootstrap-server kafka:9092 \
	--topic kafka-test \
	--property "parse.key=true"
>stocks-123	{"tickers": [{"name": "AMZN", "price": 1902}, {"name": "MSFT", "price": 107}, {"name": "AAPL", "price": 215}]}
```

With the release of kafka version [3.2.0](https://archive.apache.org/dist/kafka/3.2.0/RELEASE_NOTES.html), it's possible to [send headers using ConsoleProducer](https://cwiki.apache.org/confluence/display/KAFKA/KIP-798%3A+Add+possibility+to+write+kafka+headers+in+Kafka+Console+Producer) by setting the property `parse.headers` to **true**.


```bash
/usr/bin/kafka-console-producer \
	--bootstrap-server kafka:9092 \
	--topic kafka-test \
	--property "parse.key=true" \
	--property "parse.headers=true"
>stock_source:nyse	stocks-123	{"tickers": [{"name": "AMZN", "price": 1902}, {"name": "MSFT", "price": 107}, {"name": "AAPL", "price": 215}]}
```

Check out supported properties for kafka-consoler-producer [here](https://github.com/apache/kafka/blob/trunk/core/src/main/scala/kafka/tools/ConsoleProducer.scala#L221-L240).

![baby-scream-yeah.gif](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/dwub7kn4d7nhy0ojs6e2.gif)

## Reading from a Kafka Topic
Kafka provides a [Consumer API](https://docs.confluent.io/platform/current/clients/consumer.html) to read messages from a Kafka topic. This API is available in java with [kafka-clients](https://kafka.apache.org/33/javadoc/index.html?org/apache/kafka/clients/consumer/KafkaConsumer.html) library and python with [kafka-python](https://kafka-python.readthedocs.io/en/master/apidoc/KafkaConsumer.html).

kafka comes with out of box script to read messages from the kafka topic :

```bash
/usr/bin/kafka-console-consumer \
    --bootstrap-server kafka:9092 \
    --topic kafka-test \
    --from-beginning
```

However, this command only prints the values of the kafka message, To print the key and headers, we have to set the properties

```bash
/usr/bin/kafka-console-consumer \
    --bootstrap-server kafka:9092 \
    --topic kafka-test \
    --from-beginning \
	--property print.headers=true \
	--property print.timestamp=true \
	--property print.key=true
```

There is other information too such as `partition` and `offset`, they can be printed by setting the properties `--property print.offset=true` and  `--property print.partition=true`.

If you think, what we discussed above is too much to remember then don't.
We have an easier way of reading and writing from Kafka topics.

![baby-yoda](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/y6isvqojqtkmwe85pdsk.jpeg)

## kcat Utility
[kcat](https://github.com/edenhill/kcat) is an awesome tool to make our life easier, it allows us to read and write from kafka topics without tons of scripts and in a more user-friendly way.

As Confluent puts it, "It is a swiss-army knife of tools for inspecting and creating data in Kafka"

`kcat` has two modes, it runs in producer mode by specifying the argument `-P` and consumer mode by specifying the argument `-C`.It also automatically selects its mode depending on the terminal or pipe type. If data is being piped to kcat it will automatically select producer (-P) mode. If data is being piped from kcat (e.g. standard terminal output) it will automatically select consumer (-C) mode.

1. To read data from kafka topics, simply run
	```bash
	kcat -b localhost:9092 -t kafka-test
	```

2. To write data to a Kafka topic, run
	```bash
	kcat -P -b localhost:9092 -t kafka-test
	```

Take a look at the examples [here](https://github.com/edenhill/kcat#examples) to find out more about the usage.

[here](https://www.confluent.io/blog/5-things-every-kafka-developer-should-know/) are some tips and tricks of using Kafka.

