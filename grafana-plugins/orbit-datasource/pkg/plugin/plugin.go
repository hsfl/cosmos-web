package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"net"
	"time"

	"github.com/influxdata/influxdb-client-go/v2/api"

	influxdb2 "github.com/influxdata/influxdb-client-go/v2"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

// Make sure SampleDatasource implements required interfaces. This is important to do
// since otherwise we will only get a not implemented error response from plugin in
// runtime. In this example datasource instance implements backend.QueryDataHandler,
// backend.CheckHealthHandler, backend.StreamHandler interfaces. Plugin should not
// implement all these interfaces - only those which are required for a particular task.
// For example if plugin does not need streaming functionality then you are free to remove
// methods that implement backend.StreamHandler. Implementing instancemgmt.InstanceDisposer
// is useful to clean up resources used by previous datasource instance when a new datasource
// instance created upon datasource settings changed.
var (
	_ backend.QueryDataHandler      = (*SampleDatasource)(nil)
	_ backend.CheckHealthHandler    = (*SampleDatasource)(nil)
	_ backend.StreamHandler         = (*SampleDatasource)(nil)
	_ instancemgmt.InstanceDisposer = (*SampleDatasource)(nil)
)

// NewSampleDatasource creates a new datasource instance.
func NewSampleDatasource(_ backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	return &SampleDatasource{}, nil
}

// SampleDatasource is an example datasource which can respond to data queries, reports
// its health and has streaming skills.
type SampleDatasource struct{}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a new instance
// created. As soon as datasource settings change detected by SDK old datasource instance will
// be disposed and a new one will be created using NewSampleDatasource factory function.
func (d *SampleDatasource) Dispose() {
	// Clean up datasource instance resources.
}

// QueryData handles multiple queries and returns multiple responses.
// req contains the queries []DataQuery (where each query contains RefID as a unique identifier).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response
// contains Frames ([]*Frame).
func (d *SampleDatasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	log.DefaultLogger.Info("QueryData called", "request", req)

	// create response struct
	response := backend.NewQueryDataResponse()

	// Create new influxdb client
	//var client influxdb2.Options
	client := influxdb2.NewClient("http://influxdb:8086", "INFLUXDBINITADMINTOKEN")
	queryAPI := client.QueryAPI("hsfl")

	// loop over queries and execute them individually.
	for _, q := range req.Queries {
		res := d.query(ctx, queryAPI, req.PluginContext, q)

		// save the response in a hashmap
		// based on with RefID as identifier
		response.Responses[q.RefID] = res
	}

	client.Close()

	return response, nil
}

type queryModel struct {
	// WithStreaming bool `json:"withStreaming"`
	EnableSimMode bool            `json:"enableSimMode"`
	Sim           propagator_args `json:"sim"`
}

// Send an array of these to the propagator
type propagator_args struct {
	Node_name string  `json:"node_name"`
	Utc       float64 `json:"utc"`
	Px        float64 `json:"px"`
	Py        float64 `json:"py"`
	Pz        float64 `json:"pz"`
	Vx        float64 `json:"vx"`
	Vy        float64 `json:"vy"`
	Vz        float64 `json:"vz"`
	Simdt     float64 `json:"simdt,omitempty"`
	Runcount  int32   `json:"runcount,omitempty"`
	StartUtc  float64 `json:"startUtc"`
}

var buffer = make([]byte, 60000)

type czmlPosition struct {
	Interval       string        `json:"interval,omitempty"`
	Epoch          string        `json:"epoch,omitempty"`
	Cartesian      []interface{} `json:"cartesian"`
	ReferenceFrame string        `json:"referenceFrame,omitempty"`
}

type czmlColor struct {
	Rgba [4]int32 `json:"rgba"`
}
type czmlPoint struct {
	Color        czmlColor  `json:"color"`
	OutlineColor *czmlColor `json:"outlineColor,omitempty"`
	OutlineWidth float64    `json:"outlineWidth,omitempty"`
	PixelSize    float64    `json:"pixelSize"`
}

type czmlModel struct {
	Gltf             string  `json:"gltf"`
	Scale            float64 `json:"scale"`
	MinimumPixelSize float64 `json:"minimumPixelSize,omitempty"`
}

type czmlPolylineOutline struct {
	Color        czmlColor  `json:"color"`
	OutlineColor *czmlColor `json:"outlineColor,omitempty"`
	OutlineWidth float64    `json:"outlineWidth,omitempty"`
}

type czmlMaterial struct {
	PolylineOutline czmlPolylineOutline `json:"polylineOutline"`
}
type czmlPath struct {
	Material   czmlMaterial `json:"material"`
	Width      float64      `json:"width"`
	LeadTime   float64      `json:"leadTime,omitempty"`
	TrailTime  float64      `json:"trailTime,omitempty"`
	Resolution float64      `json:"resolution,omitempty"`
}

type czmlStruct struct {
	Id           string        `json:"id"`
	Name         string        `json:"name,omitempty"`
	Version      string        `json:"version,omitempty"`
	Availability string        `json:"availability,omitempty"`
	Position     *czmlPosition `json:"position,omitempty"`
	Point        *czmlPoint    `json:"point,omitempty"`
	Model        *czmlModel    `json:"model,omitempty"`
	Path         *czmlPath     `json:"path,omitempty"`
	// This is not marshalled into json, it is only for holding velocity values for the latest timestamp
	vel [3]float64
}

func (d *SampleDatasource) query(_ context.Context, queryAPI api.QueryAPI, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {
	response := backend.DataResponse{}

	// Unmarshal the front-end query option JSON into our queryModel.
	var qm queryModel

	response.Error = json.Unmarshal(query.JSON, &qm)
	if response.Error != nil {
		return response
	}

	// Perform different tasks depending on run mode: simulation or non-simulation
	if qm.EnableSimMode {
		response = d.SimMode(qm, pCtx)
	} else {
		response = d.NonSimMode(queryAPI, pCtx)
	}

	return response
}

// Simulation takes a set of initial conditions and propagates a full orbit with the orbital propagator
func (d *SampleDatasource) SimMode(qm queryModel, pCtx backend.PluginContext) backend.DataResponse {
	response := backend.DataResponse{}

	// create data frame response.
	frame := data.NewFrame("response")

	var pargs []propagator_args
	pargs = append(pargs, propagator_args{
		Node_name: qm.Sim.Node_name,
		Utc:       qm.Sim.Utc,
		Px:        qm.Sim.Px,
		Py:        qm.Sim.Py,
		Pz:        qm.Sim.Pz,
		Vx:        qm.Sim.Vx,
		Vy:        qm.Sim.Vy,
		Vz:        qm.Sim.Vz,
		Runcount:  90,
		StartUtc:  qm.Sim.Utc,
	})
	// Call orbital propagator to generate full orbit
	predicted_orbit, err := orbitalPropagatorCall(pargs)
	if err != nil {
		log.DefaultLogger.Error("Error in orbitalPropagatorCall", err.Error())
		response.Error = err
		return response
	}

	// Create fields
	frame.Fields = append(frame.Fields,
		data.NewField("historical", nil, []string{""}),
		data.NewField("predicted", nil, []string{predicted_orbit}),
	)

	// add the frames to the response.
	response.Frames = append(response.Frames, frame)
	return response
}

func (d *SampleDatasource) NonSimMode(queryAPI api.QueryAPI, pCtx backend.PluginContext) backend.DataResponse {
	response := backend.DataResponse{}

	// create data frame response.
	frame := data.NewFrame("response")

	// Get flux query result
	result, err := queryAPI.Query(context.Background(),
		`from(bucket: "SOH_Bucket")
			|> range(start: -7d)
			|> filter(fn: (r) => r["_measurement"] == "node1")
			|> filter(fn: (r) => r["beacon_type"] == "EPSPVBeaconL")
			|> filter(fn: (r) => r["_field"] == "node.loc.pos.eci.s.col[0]"
						or r["_field"] == "node.loc.pos.eci.s.col[1]"
						or r["_field"] == "node.loc.pos.eci.s.col[2]"
						or r["_field"] == "node.loc.pos.eci.v.col[0]"
						or r["_field"] == "node.loc.pos.eci.v.col[1]"
						or r["_field"] == "node.loc.pos.eci.v.col[2]")
			|> group(columns: ["_measurement", "_time"])
			//|> last()`)

	if err != nil {
		log.DefaultLogger.Error("query error", err.Error())
		response.Error = err
		return response
	}

	czmlresp, err := toCzml(result)
	if err != nil {
		log.DefaultLogger.Error("Error in toCzml", err.Error())
		response.Error = err
		return response
	}
	//log.DefaultLogger.Info("json string", "historical", czmlresp.historical, "predicted", czmlresp.predicted)

	// log.DefaultLogger.Info("UDP RECEIVE", n, s)
	frame.Fields = append(frame.Fields,
		data.NewField("historical", nil, []string{czmlresp.historical}),
		data.NewField("predicted", nil, []string{czmlresp.predicted}),
	)
	// log.DefaultLogger.Info("UDP RECEIVE", "n", n, "len(s)", len(czml_response))

	// If query called with streaming on then return a channel
	// to subscribe on a client-side and consume updates from a plugin.
	// Feel free to remove this if you don't need streaming for your datasource.
	//log.DefaultLogger.Info("qm", "qm", qm)
	// if qm.WithStreaming {
	// 	channel := live.Channel{
	// 		Scope:     live.ScopeDatasource,
	// 		Namespace: pCtx.DataSourceInstanceSettings.UID,
	// 		Path:      "stream",
	// 	}
	// 	frame.SetMeta(&data.FrameMeta{Channel: channel.String()})
	// }

	// add the frames to the response.
	response.Frames = append(response.Frames, frame)

	return response
}

// Return value of toCzml() that will be the response from this backend datasource
type czml_response struct {
	historical string
	predicted  string
}

// Take query result and convert to czml format
func toCzml(result *api.QueryTableResult) (czml_response, error) {
	// Start czml response construction
	var czmlPacket []czmlStruct
	czmlPacket = append(czmlPacket, czmlStruct{})
	var idx int = 0
	czmlPacket[idx].Id = "document"
	czmlPacket[idx].Name = "OrbitDatasourceResponse-Historical"
	czmlPacket[idx].Version = "1.0"

	// Reusable arrays for positional data
	px_name := "node.loc.pos.eci.s.col[0]"
	py_name := "node.loc.pos.eci.s.col[1]"
	pz_name := "node.loc.pos.eci.s.col[2]"
	vx_name := "node.loc.pos.eci.v.col[0]"
	vy_name := "node.loc.pos.eci.v.col[1]"
	vz_name := "node.loc.pos.eci.v.col[2]"

	// For determining if orbital propagator needs to be called
	targetTime := time.Now()
	var latestTime time.Time

	// New table number is new point
	var tableNum int = -1
	// Iterate over query result lines
	for result.Next() {
		if result.Err() != nil {
			log.DefaultLogger.Error("Query error:", result.Err().Error())
			break
		}
		// Observe when there is new grouping key producing new table
		if result.TableChanged() {
			//log.DefaultLogger.Info("Table: ", result.TableMetadata().String())
			tableNum = -1
		}
		// Add a new packet entry for new node
		if result.Record().Measurement() != czmlPacket[idx].Id {
			czmlPacket = append(czmlPacket, czmlStruct{})
			idx++
			czmlPacket[idx].Id = result.Record().Measurement()
			// czmlPacket[idx].Availability = ...
			czmlPacket[idx].Position = &czmlPosition{}
			// czmlPacket[idx].Position.Interval = ...
			// czmlPacket[idx].Position.Epoch = result.Record().Time().Format(time.RFC3339)
			czmlPacket[idx].Position.ReferenceFrame = "INERTIAL"
			czmlPacket[idx].Model = &czmlModel{}
			czmlPacket[idx].Model.Gltf = "./public/plugins/testorg-testplugin/img/HyTI.glb"
			czmlPacket[idx].Model.Scale = 4.0
			czmlPacket[idx].Model.MinimumPixelSize = 50
			czmlPacket[idx].Path = &czmlPath{}
			czmlPacket[idx].Path.Material.PolylineOutline.Color.Rgba = [4]int32{255, 255, 255, 128}
			czmlPacket[idx].Path.LeadTime = 5400
			czmlPacket[idx].Path.TrailTime = 5400
			czmlPacket[idx].Path.Width = 5
			czmlPacket[idx].Path.Resolution = 1
		}
		// New point, add timestamp and append positional arrays
		if tableNum != result.Record().Table() {
			tableNum = result.Record().Table()
			// Save latest time to determine whether we need to call orbital predictor or not
			latestTime = result.Record().Time()
			czmlPacket[idx].Position.Cartesian = append(czmlPacket[idx].Position.Cartesian, result.Record().Time().Format(time.RFC3339), 0, 0, 0)
		}
		// Populate positional fields
		switch result.Record().Field() {
		case px_name:
			czmlPacket[idx].Position.Cartesian[len(czmlPacket[idx].Position.Cartesian)-3] = result.Record().Value().(float64)
		case py_name:
			czmlPacket[idx].Position.Cartesian[len(czmlPacket[idx].Position.Cartesian)-2] = result.Record().Value().(float64)
		case pz_name:
			czmlPacket[idx].Position.Cartesian[len(czmlPacket[idx].Position.Cartesian)-1] = result.Record().Value().(float64)
		case vx_name:
			czmlPacket[idx].vel[0] = result.Record().Value().(float64)
		case vy_name:
			czmlPacket[idx].vel[1] = result.Record().Value().(float64)
		case vz_name:
			czmlPacket[idx].vel[2] = result.Record().Value().(float64)
		default:
			continue
		}
		//log.DefaultLogger.Info("Row: ", "Time", result.Record().Time(), result.Record().Field(), result.Record().Value(), "Table", result.Record().Table(), "Measurement", result.Record().Measurement())
	}
	czmlbytes, err := json.Marshal(czmlPacket)
	if err != nil {
		log.DefaultLogger.Error("json.Marshal error", err.Error())
		return czml_response{}, err
	}

	dt := math.Abs(latestTime.Sub(targetTime).Minutes())
	// Need to call orbital propagator to generate remainder of ~90min orbit
	predicted_orbit := ""
	if dt < 50 {
		var pargs []propagator_args
		for i := range czmlPacket {
			if i == 0 {
				continue
			}
			utc, err := time.Parse(time.RFC3339, czmlPacket[i].Position.Cartesian[len(czmlPacket[i].Position.Cartesian)-3].(string))
			if err != nil {
				log.DefaultLogger.Error("Error in time parse", err.Error())
				return czml_response{}, err
			}
			unixut := utc.UnixMicro()
			// 40587 is day offset between unix time and MJD
			mjdt := 40587 + (float64(unixut)/1000000)/86400
			pargs = append(pargs, propagator_args{
				Node_name: czmlPacket[i].Id,
				Utc:       mjdt,
				Px:        czmlPacket[i].Position.Cartesian[len(czmlPacket[i].Position.Cartesian)-3].(float64),
				Py:        czmlPacket[i].Position.Cartesian[len(czmlPacket[i].Position.Cartesian)-2].(float64),
				Pz:        czmlPacket[i].Position.Cartesian[len(czmlPacket[i].Position.Cartesian)-1].(float64),
				Vx:        czmlPacket[i].vel[0],
				Vy:        czmlPacket[i].vel[1],
				Vz:        czmlPacket[i].vel[2],
			})
		}
		predicted_orbit, err = orbitalPropagatorCall(pargs)
		if err != nil {
			log.DefaultLogger.Error("Error in orbitalPropagatorCall", err.Error())
			return czml_response{}, err
		}
	}

	return czml_response{historical: string(czmlbytes), predicted: predicted_orbit}, nil
}

func orbitalPropagatorCall(pargs []propagator_args) (string, error) {
	// Create arg array
	pargs_bytes, err := json.Marshal(pargs)
	if err != nil {
		log.DefaultLogger.Error("json.Marshal error", err.Error())
		return "", err
	}
	log.DefaultLogger.Info("pargs json marshal", string(pargs_bytes))

	// Attempt propagator_web call
	const PROPAGATOR_WEB_PORT int = 10092
	raddr, err := net.ResolveUDPAddr("udp", "cosmos:"+fmt.Sprint(PROPAGATOR_WEB_PORT))
	if err != nil {
		return "", err
	}
	conn, err := net.DialUDP("udp", nil, raddr)
	if err != nil {
		return "", err
	}
	defer conn.Close()
	// Send message
	//n, addr, err := conn.ReadFrom(buffer)
	n, err := fmt.Fprintf(conn, string(pargs_bytes))
	if err != nil {
		log.DefaultLogger.Error("UDP SEND ERROR", err.Error())
		return "", err
	}
	// TODO: add read timeout
	// Receive response
	n, err = conn.Read(buffer)
	if err != nil {
		err = fmt.Errorf("%w. Is propagator_web running?", err)
		log.DefaultLogger.Error("UDP RECV ERROR", err.Error())
		return "", err
	}
	czml_predicted_orbit := string(buffer[0:n])

	return czml_predicted_orbit, nil
}

// CheckHealth handles health checks sent from Grafana to the plugin.
// The main use case for these health checks is the test button on the
// datasource configuration page which allows users to verify that
// a datasource is working as expected.
func (d *SampleDatasource) CheckHealth(_ context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	log.DefaultLogger.Info("CheckHealth called", "request", req)

	var status = backend.HealthStatusOk
	var message = "Data source is working"

	if rand.Int()%2 == 0 {
		status = backend.HealthStatusError
		message = "randomized error"
	}

	return &backend.CheckHealthResult{
		Status:  status,
		Message: message,
	}, nil
}

// SubscribeStream is called when a client wants to connect to a stream. This callback
// allows sending the first message.
func (d *SampleDatasource) SubscribeStream(_ context.Context, req *backend.SubscribeStreamRequest) (*backend.SubscribeStreamResponse, error) {
	log.DefaultLogger.Info("SubscribeStream called", "request", req)

	status := backend.SubscribeStreamStatusPermissionDenied
	if req.Path == "stream" {
		// Allow subscribing only on expected path.
		status = backend.SubscribeStreamStatusOK
	}
	return &backend.SubscribeStreamResponse{
		Status: status,
	}, nil
}

// RunStream is called once for any open channel.  Results are shared with everyone
// subscribed to the same channel.
func (d *SampleDatasource) RunStream(ctx context.Context, req *backend.RunStreamRequest, sender *backend.StreamSender) error {
	log.DefaultLogger.Info("RunStream called", "request", req)

	// Create the same data frame as for query data.
	frame := data.NewFrame("response")

	// Add fields (matching the same schema used in QueryData).
	frame.Fields = append(frame.Fields,
		data.NewField("time", nil, make([]time.Time, 1)),
		data.NewField("values", nil, make([]int64, 1)),
	)

	counter := 0

	// Stream data frames periodically till stream closed by Grafana.
	for {
		select {
		case <-ctx.Done():
			log.DefaultLogger.Info("Context done, finish streaming", "path", req.Path)
			return nil
		case <-time.After(time.Second):
			// Send new data periodically.
			frame.Fields[0].Set(0, time.Now())
			frame.Fields[1].Set(0, int64(rand.Intn(100)))

			counter++

			err := sender.SendFrame(frame, data.IncludeAll)
			if err != nil {
				log.DefaultLogger.Error("Error sending frame", "error", err)
				continue
			}
		}
	}
}

// PublishStream is called when a client sends a message to the stream.
func (d *SampleDatasource) PublishStream(_ context.Context, req *backend.PublishStreamRequest) (*backend.PublishStreamResponse, error) {
	log.DefaultLogger.Info("PublishStream called", "request", req)

	// Do not allow publishing at all.
	return &backend.PublishStreamResponse{
		Status: backend.PublishStreamStatusPermissionDenied,
	}, nil
}
