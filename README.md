# COSMOS Web v2.0

COSMOS Web - a web application to visualize telemetry data from a satellite using Grafana. 

![59270 9](https://user-images.githubusercontent.com/1541868/159378681-836b043d-a14a-44c6-a586-7de8fca09ad0.png)

We recommend installing COSMOS via Docker. By using Docker containers you will get all the COSMOS dependencies automatically resolved. This process works well for users and developers.

* [Install Docker Desktop](https://www.docker.com/get-started/)
* [Install Docker Compose](https://docs.docker.com/compose/install/) (Only needed for a Linux OS. Docker compose is automatically installed on Docker Desktop on Windows and macOS)

## Install Instructions (via Docker)

**Windows Instructions:** 

Open a command prompt window and enter the following two commands: 

```shell
git clone https://github.com/hsfl/cosmos.git c:/cosmos/docker/cosmos
```
this git clones clone cosmos core to c:/cosmos/docker/cosmos
 
```shell
git clone https://github.com/hsfl/cosmos-web.git c:/cosmos/docker/cosmos-web
```
this git clones clone cosmos web to c:/cosmos/docker/cosmos-web


**macOS Instructions:**

Open a terminal window and enter the following two commands: 

```shell
git clone https://github.com/hsfl/cosmos.git ~/cosmos/docker/cosmos
```
this git clones clone cosmos core to ~/cosmos/docker/cosmos
 
```shell
git clone https://github.com/hsfl/cosmos-web.git ~/cosmos/docker/cosmos-web
```
this git clones clone cosmos web to ~/cosmos/docker/cosmos-web

**AFTER you have completed the prior steps, continue with the following steps. Note these steps are the same for both operating systems.** 

Building the cosmos image:

1. Open terminal in your newly created cosmos-web folder
```shell
cd cosmos/docker/cosmos-web
```
2. Next, run the following command to get the containers up in the terminal, this builds the telegraf, influxdb, and grafana containers needed for COSMOS. (this process may take a few minutes)
```
docker-compose build
```

3. Finally, run this command to create the containers in Docker. 
```
docker-compose up -d
```

## Running COSMOS Web (via Docker)

View grafana in the browser using this url
http://localhost:3000/

type user and pass (admin: admin), skip new pass (or change it if you want it)

(old instructions: Follow the instructions on the [COSMOS Web Installation page](https://hsfl.github.io/cosmos-docs/pages/2-getting_started/install/cosmos-web.html))


## Demo 

Start COSMOS Docker

Run agent_cpu
```
./comos/bin/agent_cpu 
```


Run propagator_simple. Propagate position and attitude in the satellite orbit for a specific node/satellite
```
./comos/bin/propagator_simple
```

Run agent_web? (WIP): State of Health collector agent.
```
./comos/bin/agent_web
```

Open Grafana to see the agent_cpu and propagator data by opening the standard widget.
