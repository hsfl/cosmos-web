# COSMOS Web v2.0

COSMOS Web - a web application to visualize telemetry data from a satellite using Grafana. 

![59270 9](https://user-images.githubusercontent.com/1541868/159378681-836b043d-a14a-44c6-a586-7de8fca09ad0.png)

Before you install cosmos web we reccomend you install cosmos core by following the instructions [here](https://github.com/hsfl/cosmos).

## Install Instructions (via Docker)

Once you have cosmos-core installed we are going to clone the cosmos-web repository. Open your terminal window, copy and run the following command.

On Windows: clone cosmos to c:/cosmos/cosmos-web (recommended path)
```shell
git clone https://github.com/hsfl/cosmos-web.git c:/cosmos/cosmos-web
```

On Linux and macOS: clone cosmos to the home folder ~/cosmos/cosmos-web (recommended path)
```shell
git clone https://github.com/hsfl/cosmos-web.git ~/cosmos/cosmos-web
```

To build the cosmos image go into the newly created folder and run the Docker build command (this step may take several minutes to complete):

1. Open terminal in your newely created cosmos-web folder
2. run this to get the containers up in the terminal
starts the telegraf, influxdb, and grafana (eventually) containers (this process may take a few minutes)
```
docker-compose up
```

run this to get the containers up in detached mode
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
