# COSMOS Web v2.0

COSMOS Web - a web application to visualize telemetry data from a satellite using Grafana. 

![59270 9](https://user-images.githubusercontent.com/1541868/159378681-836b043d-a14a-44c6-a586-7de8fca09ad0.png)

We recommend installing COSMOS via Docker. Refer to the instructions on the main cosmos repository: https://github.com/hsfl/cosmos to get started (if you have not done it yet)


## Install Instructions

**Installing Grafana plugins**

Download the three .zip files on the [cosmos-grafana-plugins latest release page](https://github.com/hsfl/cosmos-grafana-plugins/releases/latest) under Assets and unzip them into the grafana-plugins folder (cw-button.zip, orbit-datasource.zip, orbitdisplay.zip).

You can also do this on the terminal on Linux:

First go to the grafana-plugins folder in your cosmos-web installation location. If you followed the instructions on the [main cosmos repository](https://github.com/hsfl/cosmos), it should be in ~/cosmos/tools/cosmos-web/grafana-plugins:
```
cd ~/cosmos/tools/cosmos-web/grafana-plugins
```
Download the grafana plugins:
```
wget https://github.com/hsfl/cosmos-grafana-plugins/releases/latest/download/cosmos-sim-plugin.zip
```
```
wget https://github.com/hsfl/cosmos-grafana-plugins/releases/latest/download/orbit-display.zip
```
```
wget https://github.com/hsfl/cosmos-grafana-plugins/releases/latest/download/orbit-datasource.zip
```
Unzip the files:
```
unzip '*.zip'
```
If unzip is not installed, install with 
```
sudo apt install unzip
```
or unzip manually in a file explorer.

If you are using the docker install of cosmos, restart the grafana container with
```
docker restart cosmos_grafana
```

## Grafana Instructions

### Configuring Grafana

Now that both COSMOS Web and the Grafana plugins are installed, we can create a dashboard in Grafana to display some data.

#### Add Influxdb to Grafana

If your COSMOS docker containers are not running, return to the instructions on the [main COSMOS repository](https://github.com/hsfl/cosmos) for help. You can check to see if they are running with:
```
docker ps
```

With your Grafana container running, go to http://localhost:3000 in your browser and log in with the username and password you specified in the .env file under GF_ADMIN_USER and GF_ADMIN_PASSWORD.

After successfully logging in, look for a gear icon on the left side navigation bar and click on Data sources.

