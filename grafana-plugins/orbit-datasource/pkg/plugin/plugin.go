package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"net"
	"time"

	"github.com/influxdata/influxdb-client-go/v2/api"

	influxdb2 "github.com/influxdata/influxdb-client-go/v2"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana-plugin-sdk-go/live"
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
	WithStreaming bool `json:"withStreaming"`
}

var buffer = make([]byte, 60000)

var testczml = `[{"id": "document","name": "Cesium Orbit Display for Cosmos Web","version": "1.0"},
{"id": "node0","availability": "2022-04-14T02:45:31Z/2022-04-14T03:30:31Z","position": {"epoch": "2022-04-14T02:45:31Z","referenceFrame": "INERTIAL","cartesian": [
59.985286,184458.62,6183754.9,2762759.5,
119.98529,-132330.3,6040943,3065395,
179.98529,-448508.3,5870274.2,3353853.2,
239.98529,-762618.08,5672545.7,3626806.1,
299.98529,-1073213.2,5448679.9,3882998.9,
359.98529,-1378864.8,5199719.6,4121255.9,
419.98529,-1678168.2,4926822.9,4340486.1,
479.98529,-1969749.6,4631257.2,4539687.4,
539.98529,-2252272.1,4314393.6,4717951.5,
599.98529,-2524442,3977699.7,4874468,
659.98529,-2785014.6,3622733.1,5008527.4,
719.98529,-3032799.8,3251133.5,5119524.5,
779.98529,-3266667.6,2864615.4,5206961.3,
839.98529,-3485553,2464959.8,5270448.1,
899.98529,-3688460.5,2054005.8,5309706,
959.98529,-3874469.1,1633642.1,5324567.3,
1019.9853,-4042735.5,1205798.2,5314976.1,
1079.9853,-4192498.1,772435.94,5280988.4,
1139.9853,-4323080.2,335540.14,5222771.3,
1199.9853,-4433893,-102889.92,5140602.4,
1259.9853,-4524437.8,-540849.64,5034868.3,
1319.9853,-4594308.7,-976338.12,4906062.7,
1379.9853,-4643193.7,-1407367.1,4754784,
1439.9853,-4670876.7,-1831969.9,4581732.5,
1499.9853,-4677237.9,-2248210.3,4387707.2,
1559.9853,-4662254.5,-2654191.1,4173602.4,
1619.9853,-4626000.8,-3048063.1,3940403.2,
1679.9853,-4568647.6,-3428032.6,3689181.3,
1739.9853,-4490461.7,-3792370.4,3421089.9,
1799.9853,-4391804.4,-4139419,3137358.7,
1859.9853,-4273130,-4467600.6,2839288.1,
1919.9853,-4134983.7,-4775423.6,2528243.2,
1979.9853,-3977998.8,-5061489.7,2205647.7,
2039.9853,-3802894.1,-5324500.3,1872977.5,
2099.9853,-3610470.4,-5563261.9,1531753.9,
2159.9853,-3401607.4,-5776691.9,1183536.4,
2219.9853,-3177258.7,-5963823.4,829916.32,
2279.9853,-2938448.6,-6123809.4,472508.74,
2339.9853,-2686266.5,-6255926.8,112945.57,
2399.9853,-2421862.4,-6359579.7,-247132.11,
2459.9853,-2146441.4,-6434301.9,-606081.52,
2519.9853,-1861258.1,-6479758.8,-962265.67,
2579.9853,-1567611.2,-6495748.8,-1314060.8,
2639.9853,-1266837.2,-6482204.2,-1659863.6,
2699.9853,-960304.5,-6439191.4,-1998098.6]},"model": {"gltf":"./public/plugins/testorg-testplugin/img/HyTI.glb","scale":4.0,"minimumPixelSize": 50},"path": {"material": {"polylineOutline": {"color": {"rgba": [255, 0, 255, 255]}}},"width": 5,"leadTime": 5400,"trailTime": 5400,"resolution": 1},"orientation": {"epoch": "2022-04-14T02:45:31Z","interpolationAlgorithm": "LINEAR","interpolationDegree": 1,"unitQuaternion": [
59.985286,-0.81577456,0.12328405,-0.48696348,0.28666963,
119.98529,-0.83103921,0.11530717,-0.45951441,0.29141826,
179.98529,-0.84538747,0.1073383,-0.43154379,0.29591969,
239.98529,-0.85880542,0.099422245,-0.40305779,0.30018809,
299.98529,-0.87128066,0.09156195,-0.37408981,0.30420919,
359.98529,-0.88280189,0.083759114,-0.34467412,0.30796914,
419.98529,-0.89335878,0.076014231,-0.31484581,0.31145473,
479.98529,-0.90294206,0.068326628,-0.28464073,0.3146534,
539.98529,-0.91154347,0.060694522,-0.25409544,0.31755344,
599.98529,-0.91915575,0.053115103,-0.22324711,0.32014405,
659.98529,-0.92577266,0.045584598,-0.19213347,0.3224155,
719.98529,-0.93138894,0.038098365,-0.16079275,0.32435914,
779.98529,-0.93600032,0.030650981,-0.12926359,0.32596755,
839.98529,-0.93960352,0.023236344,-0.097584929,0.3272346,
899.98529,-0.94219622,0.015847776,-0.065795971,0.32815549,
959.98529,-0.94377706,0.0084781523,-0.033936061,0.32872681,
1019.9853,-0.94434565,0.001120022,-0.0020446106,0.32894658,
1079.9853,-0.94390251,-0.0062342447,0.029838996,0.32881426,
1139.9853,-0.94244909,-0.013592314,0.061675493,0.32833076,
1199.9853,-0.93998776,-0.020961745,0.093425817,0.32749844,
1259.9853,-0.93652179,-0.02834985,0.12505119,0.32632106,
1319.9853,-0.93205531,-0.03576356,0.15651322,0.32480375,
1379.9853,-0.92659338,-0.043209316,0.18777392,0.32295296,
1439.9853,-0.92014189,-0.050692952,0.21879587,0.3207764,
1499.9853,-0.91270759,-0.058219599,0.2495422,0.31828293,
1559.9853,-0.9042981,-0.065793588,0.27997668,0.31548251,
1619.9853,-0.89492184,-0.073418363,0.31006381,0.3123861,
1679.9853,-0.8845881,-0.081096392,0.33976882,0.30900553,
1739.9853,-0.87330696,-0.088829095,0.36905778,0.30535341,
1799.9853,-0.86108932,-0.096616779,0.39789759,0.30144302,
1859.9853,-0.84794691,-0.10445858,0.42625605,0.29728813,
1919.9853,-0.83389224,-0.11235245,0.45410189,0.29290294,
1979.9853,-0.81893866,-0.12029506,0.48140481,0.2883019,
2039.9853,-0.80310028,-0.1282819,0.50813547,0.28349961,
2099.9853,-0.78639208,-0.13630717,0.53426554,0.27851067,
2159.9853,-0.76882979,-0.14436383,0.55976769,0.27334955,
2219.9853,-0.75043,-0.15244363,0.58461562,0.26803047,
2279.9853,-0.73121013,-0.16053715,0.60878403,0.26256729,
2339.9853,-0.71118841,-0.16863378,0.63224868,0.25697335,
2399.9853,-0.69038395,-0.17672185,0.65498634,0.25126139,
2459.9853,-0.66881668,-0.18478869,0.67697482,0.24544344,
2519.9853,-0.64650741,-0.19282068,0.69819294,0.23953073,
2579.9853,-0.62347781,-0.20080336,0.71862054,0.23353362,
2639.9853,-0.59975043,-0.20872155,0.73823845,0.22746149,
2699.9853,-0.57534871,-0.21655941,0.75702849,0.22132271]}},{"id": "node1","availability": "2022-04-14T02:45:31Z/2022-04-14T03:30:31Z","position": {"epoch": "2022-04-14T02:45:31Z","referenceFrame": "INERTIAL","cartesian": [
59.999952,76504.802,6185929.3,2762990.4,
119.99995,-237743.05,6037598.8,3065620.6,
179.99995,-550893.88,5861426.9,3354072.5,
239.99995,-861504.52,5658236.1,3627018,
299.99995,-1168144.9,5428974,3883202.5,
359.99995,-1469404.5,5174708.2,4121450.4,
419.99995,-1763899.1,4896621,4340670.5,
479.99995,-2050277.4,4596003.9,4539860.9,
539.99995,-2327226.4,4274251,4718113.3,
599.99995,-2593478.3,3932852.4,4874617.3,
659.99995,-2847815.8,3573387,5008663.6,
719.99995,-3089077.6,3197515.2,5119647,
779.99995,-3316163.7,2806971.1,5207069.4,
839.99995,-3528040.4,2403553.8,5270541.4,
899.99996,-3723744.6,1989119.7,5309784.1,
959.99996,-3902388.2,1565573.1,5324629.8,
1020,-4063161.8,1134858.1,5315022.9,
1080,-4205338.1,698949.29,5281019.1,
1140,-4328275.3,259843.15,5222785.9,
1200,-4431419.3,-180451.13,5140600.9,
1260,-4514306.7,-619920.55,5034850.7,
1320,-4576566.3,-1056557.4,4906029.1,
1380,-4617921.2,-1488368.4,4754734.4,
1440,-4638189.5,-1913383.3,4581667.2,
1500,-4637285.1,-2329664.2,4387626.5,
1560,-4615218.4,-2735313.8,4173506.7,
1620,-4572096,-3128484.4,3940292.8,
1680,-4508120.1,-3507385.6,3689056.8,
1740,-4423587.4,-3870293.4,3420951.8,
1800,-4318888.4,-4215556.7,3137207.7,
1860,-4194504.6,-4541605.9,2839124.8,
1920,-4051007.1,-4846959.3,2528068.4,
1980,-3889053.7,-5130230,2205462.2,
2040,-3709385.7,-5390131.9,1872782.2,
2100,-3512824.6,-5625486.1,1531549.6,
2160,-3300268.7,-5835225.3,1183324.1,
2220,-3072688.7,-6018399.4,829696.93,
2280,-2831123.1,-6174179.7,472283.27,
2340,-2576674,-6301862.2,112715.05,
2400,-2310501.6,-6400871.2,-247366.63,
2460,-2033818.9,-6470761.7,-606318.98,
2520,-1747886.2,-6511221.1,-962505.01,
2580,-1454005.5,-6522070.5,-1314300.9,
2640,-1153514.2,-6503265.7,-1660103.5,
2700,-847779.43,-6454896.8,-1998337.2]},"model": {"gltf":"./public/plugins/testorg-testplugin/img/HyTI.glb","scale":4.0,"minimumPixelSize": 50},"path": {"material": {"polylineOutline": {"color": {"rgba": [255, 0, 255, 255]}}},"width": 5,"leadTime": 5400,"trailTime": 5400,"resolution": 1},"orientation": {"epoch": "2022-04-14T02:45:31Z","interpolationAlgorithm": "LINEAR","interpolationDegree": 1,"unitQuaternion": [
59.999952,-0.81681934,0.11616047,-0.4844433,0.29090822,
119.99995,-0.8320138,0.10805067,-0.45695385,0.29541712,
179.99995,-0.84629198,0.099956883,-0.42894502,0.29967429,
239.99995,-0.85964033,0.091924031,-0.40042286,0.30369394,
299.99995,-0.87204651,0.083955165,-0.37142089,0.30746208,
359.99995,-0.8834992,0.076052086,-0.34197352,0.3109652,
419.99995,-0.89398811,0.068215376,-0.31211593,0.31419035,
479.99995,-0.90350394,0.060444445,-0.28188409,0.31712532,
539.99995,-0.91203842,0.052737582,-0.25131465,0.31975869,
599.99995,-0.91958427,0.045092038,-0.22044488,0.32208002,
659.99995,-0.92613521,0.037504096,-0.1893126,0.32407987,
719.99995,-0.93168594,0.029969158,-0.15795612,0.32574994,
779.99995,-0.93623215,0.022481837,-0.12641412,0.32708316,
839.99995,-0.93977051,0.015036057,-0.094725611,0.32807372,
899.99996,-0.94229863,0.007625158,-0.062929834,0.32871717,
959.99996,-0.94381511,0.00024202576,-0.031066162,0.32901044,
1020,-0.94431947,-0.007120789,0.00082597703,0.3289519,
1080,-0.94381217,-0.01447092,0.032707198,0.32854136,
1140,-0.9422946,-0.021816045,0.064538244,0.32778006,
1200,-0.93976905,-0.02916374,0.096280076,0.3266707,
1260,-0.93623874,-0.03652134,0.12789395,0.32521739,
1320,-0.93170775,-0.043895811,0.15934152,0.32342559,
1380,-0.92618105,-0.051293632,0.19058487,0.32130208,
1440,-0.91966451,-0.058720687,0.22158664,0.31885489,
1500,-0.91216482,-0.066182165,0.25231002,0.3160932,
1560,-0.90368956,-0.073682462,0.28271891,0.3130273,
1620,-0.89424714,-0.0812251,0.31277787,0.30966844,
1680,-0.8838468,-0.088812629,0.34245225,0.30602878,
1740,-0.87249862,-0.096446559,0.37170823,0.3021212,
1800,-0.8602135,-0.1041273,0.40051281,0.29795928,
1860,-0.84700317,-0.11185409,0.42883393,0.29355707,
1920,-0.83288017,-0.11962497,0.45664045,0.28892904,
1980,-0.81785785,-0.12743677,0.48390218,0.28408992,
2040,-0.8019504,-0.13528507,0.51058992,0.27905455,
2100,-0.78517281,-0.14316421,0.53667546,0.27383777,
2160,-0.7675409,-0.15106729,0.5621316,0.2684543,
2220,-0.74907132,-0.1589862,0.58693216,0.26291859,
2280,-0.72978156,-0.16691167,0.61105198,0.25724471,
2340,-0.70968997,-0.17483325,0.63446693,0.25144621,
2400,-0.68881573,-0.18273945,0.65715389,0.24553604,
2460,-0.6671789,-0.19061775,0.67909077,0.23952642,
2520,-0.6448004,-0.19845473,0.7002565,0.23342878,
2580,-0.62170204,-0.20623611,0.720631,0.22725362,
2640,-0.59790648,-0.21394692,0.74019519,0.22101051,
2700,-0.5734373,-0.22157152,0.75893096,0.21470798]}}]`

func (d *SampleDatasource) query(_ context.Context, queryAPI api.QueryAPI, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {
	response := backend.DataResponse{}

	// Unmarshal the JSON into our queryModel.
	var qm queryModel

	response.Error = json.Unmarshal(query.JSON, &qm)
	if response.Error != nil {
		return response
	}

	// create data frame response.
	frame := data.NewFrame("response")

	// Get flux query result
	result, err := queryAPI.Query(context.Background(),
		`from(bucket: "HyTI_SOH")
			|> range(start: -70d)
			|> filter(fn: (r) => r["_measurement"] == "unibapfm")
			|> filter(fn: (r) => r["_field"] == "pos[0]")
			|> filter(fn: (r) => r["soh_key"] == "node_loc_pos_eci")
			|> last()`)

	if err != nil {
		log.DefaultLogger.Error("query error", err.Error())
		response.Error = err
		return response
	}

	// Iterate over query result lines
	for result.Next() {
		// Observe when there is new grouping key producing new table
		if result.TableChanged() {
			log.DefaultLogger.Info("Table: ", result.TableMetadata().String())
		}
		// Read result
		log.DefaultLogger.Info("Row: ", result.Record().Field(), result.Record().Value())
		if result.Err() != nil {
			log.DefaultLogger.Error("Query error:", result.Err().Error())
		}
	}

	// add fields
	// frame.Fields = append(frame.Fields,
	// 	data.NewField("czmldata", nil, []string{testczml}),
	// )

	// Attempt propagator_web call
	raddr, err := net.ResolveUDPAddr("udp", "cosmos:10090")
	if err != nil {
		response.Error = err
		return response
	}
	conn, err := net.DialUDP("udp", nil, raddr)
	if err != nil {
		response.Error = err
		return response
	}
	defer conn.Close()
	// Send message
	//n, addr, err := conn.ReadFrom(buffer)
	n, err := fmt.Fprintf(conn, "[1]")
	if err != nil {
		response.Error = err
		log.DefaultLogger.Error("UDP SEND ERROR", err.Error())
		return response
	}
	// TODO: add read timeout
	// Receive response
	log.DefaultLogger.Info("UDP RECEIVE 1")
	n, err = conn.Read(buffer)
	if err != nil {
		response.Error = err
		log.DefaultLogger.Error("UDP RECV ERROR", err.Error())
		return response
	}
	czml_response := string(buffer[0:n])
	// log.DefaultLogger.Info("UDP RECEIVE", n, s)
	frame.Fields = append(frame.Fields,
		data.NewField("czmldata", nil, []string{czml_response}),
	)
	log.DefaultLogger.Info("UDP RECEIVE", "n", n, "len(s)", len(czml_response))

	// If query called with streaming on then return a channel
	// to subscribe on a client-side and consume updates from a plugin.
	// Feel free to remove this if you don't need streaming for your datasource.
	if qm.WithStreaming {
		channel := live.Channel{
			Scope:     live.ScopeDatasource,
			Namespace: pCtx.DataSourceInstanceSettings.UID,
			Path:      "stream",
		}
		frame.SetMeta(&data.FrameMeta{Channel: channel.String()})
	}

	// add the frames to the response.
	response.Frames = append(response.Frames, frame)

	return response
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
