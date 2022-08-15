# COSMOS Web v2.0

COSMOS Web - a web application to visualize telemetry data from a satellite using Grafana. 

![59270 9](https://user-images.githubusercontent.com/1541868/159378681-836b043d-a14a-44c6-a586-7de8fca09ad0.png)

We recommend installing COSMOS via Docker. Refer to the instructions on the main cosmos repository: https://github.com/hsfl/cosmos to get started (if you have not done it yet)


## Install Instructions

**Installing Grafana plugins**

Download the three .zip files on the [cosmos-grafana-plugins latest release page](https://github.com/hsfl/cosmos-grafana-plugins/releases/latest) under Assets and unzip them (cw-button.zip, orbit-datasource.zip, orbitdisplay.zip) into the grafana-plugins folder (~/cosmos/tools/cosmos-web/grafana-plugins).

You can also do this on the terminal on Linux:

First go to the grafana-plugins folder in your cosmos-web installation location. If you followed the instructions on the [main cosmos repository](https://github.com/hsfl/cosmos) this folder should be in ~/cosmos/tools/cosmos-web/grafana-plugins:
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

![config](https://user-images.githubusercontent.com/40340250/181689735-ebddd500-1d52-450d-b303-3faa41f390a1.png)

In the Data sources tab of the Configuration page that shows up, search for InfluxDB and click on the InfluxDB data source option that shows up.

![search](https://user-images.githubusercontent.com/40340250/181689931-ffa7dad8-2af5-4918-b9ce-41bda782e4ed.png)

You will be asked to configure the InfluxDB data source. First change the Query Language from InfluxQL to Flux. Then under the HTTP section, enter http://influxdb:8086 into the URL input. The other options in the HTTP section can stay their defaults.

![flux](https://user-images.githubusercontent.com/40340250/181690011-02be9b43-2fc0-4dac-afcb-d4d181cb84e3.png)
![http](https://user-images.githubusercontent.com/40340250/181690193-61e66432-facb-418f-9da4-df054f8aa165.png)

In the Auth section, enter in the username and password you specified in the .env file under INFLUXDB_INIT_ADMIN_USERNAME and INFLUXDB_INIT_ADMIN_PASSWORD. The other options can stay their defaults.

![auth](https://user-images.githubusercontent.com/40340250/181690434-3ab81720-8190-4abf-99c1-47ace7faabcd.png)

In the final section, InfluxDB Details, enter in for Organization and Token the values you specified in the .env file under INFLUXDB_INIT_ORG and INFLUXDB_INIT_ADMIN_TOKEN, respectively. In the Default Bucket input, enter Simulator_Data, as this is the bucket that simulated data will be sent to. The other options can stay their defaults.

![influxdb](https://user-images.githubusercontent.com/40340250/181690736-636a1b5f-fbcf-40ea-a33c-af060dc15bb9.png)


Click on Save & Test.

#### Add Grafana Plugins

While any plugins in the grafana-plugin folders should be installed by default, you can also add them manually in the Plugins tab in the Configuration page. The Configuration page you access in the same way as the Data sources tab, by clicking on the gear in the navigation bar on the left side of the screen. If you do not see the Grafana plugins downloaded earlier in this guide, try to restart the Grafana container again with
```
docker restart cosmos_grafana
```

#### Create a Dashboard
In the navigation bar on the left side, hover over the Dashboards icon, which looks like four squares, and click on New Dashboard.

![dashboards](https://user-images.githubusercontent.com/40340250/181691917-49e50515-08d7-444e-9c2d-aedb61dea0e6.png)

You will be taken to a new dashboard page with a panel creator in the layout for you. If you wish to add more panels in the future, you can add a panel creator to the layout by clicking on the Add Panel button in the top bar. Click on Add a new panel.

![newpanel](https://user-images.githubusercontent.com/40340250/181692310-cda18667-0080-45ca-9b90-4eea533c8a52.png)

You can change the type of visualization that the panel will use on the upper right drop-down menu which is initially Time series. Click on the dropdown and select Orbit Display.

![timeseries](https://user-images.githubusercontent.com/40340250/181692642-aff5f3f3-9847-482a-9f25-db3006553dd9.png)
![orbitdisplayselect](https://user-images.githubusercontent.com/40340250/181692752-4a36662e-d7a6-42b7-b6cc-c410a42c6a9d.png)

You can select the datasource that the visualization will fetch its data from on the below the visualization panel. In the Data sources dropdown, select orbit-datasource. If it does not show up by default, see that the zip plugin was correctly placed and unzipped, the Grafana container was restarted, and you may have to add it in the Data sources configurations similarly to how you added the InfluxDB data source.

![orbitdatasource](https://user-images.githubusercontent.com/40340250/181693111-91265b56-0d67-48c1-adb2-b7f980586796.png)

In the Name input of the orbit-datasource, enter node0.

![orbitdisplay](https://user-images.githubusercontent.com/40340250/181693349-5fdd447a-8163-4cd7-8d9b-f1741842ce08.png)

Similarly, add the Cosmos Simulator panel.

![final](https://user-images.githubusercontent.com/40340250/181693774-268bd86b-bc91-443b-82c6-a35a809d8cb3.png)

In the Data source select 'InfluxDB'. 

<img width="903" alt="Screen Shot 2022-08-15 at 8 52 28 PM" src="https://user-images.githubusercontent.com/1541868/184697721-06604b91-52d4-4010-9e85-5e12b9d07e33.png">

The Cosmos Simulator plugin allows you to create some simulated orbital data for a number of numbers. The default values will generate an orbit for a number of satellites in a trailing formation. Click Submit to send the request, which will populate the database with data. The Orbital Display panel will then visualize this data. You can click on the refresh button on the top right of the screen to have all panels in the dashboard resend their queries. The Orbital Display panel should then display a nice orbit to view.
