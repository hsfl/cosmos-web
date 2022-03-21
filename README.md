# COSMOS Web v2.0

COSMOS Web - a web application to visualize telemetry data from a satellite. UI Repository.

## Install Instructions (via Docker)

1. Open terminal in cosmos-web folder
2. run this to get the containers up in the terminal
starts the telegraf, influxdb, and grafana (eventually) containers (this process may take a few minutes)
```
docker-compose up
```

run this to get the containers up in detached mode
```
docker-compose up -d
```

# Running (via Docker)

View grafana in the browser using this url
http://localhost:3000/

type user and pass (admin: admin), skip new pass (or change it if you want it)


# Demo 

Run agent_cpu on cosmos core
```
./comos/bin/agent_cpu 
```

## Installing

Follow the instructions on the [COSMOS Web Installation page](https://hsfl.github.io/cosmos-docs/pages/2-getting_started/install/cosmos-web.html)
