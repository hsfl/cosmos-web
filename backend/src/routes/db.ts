import express, { Request, Response } from 'express';
import { AppError } from 'exceptions/AppError';
import { StatusCodes } from 'http-status-codes';
import { DBHandler, SIMDBHandler, DynaDBHandler, CEOHandler } from 'database/DBHandler';
import { new_api_response } from 'utils/response';
import { KeyType, EventType } from 'types/cosmos_types';
import { QueryType, QueryObject } from 'types/query_types';
import { beacon2obj } from 'transforms/cosmos';
import { TelegrafBody, EventResourceUpdate } from 'database/BaseDatabase';
import { dbmission } from 'database/CEOdb';


export const router = express.Router();

// call CEO handler database array and populate the db_array as loop iterator over return. 
export async function initiate_ceo_handler() {
    const ceodb = CEOHandler.app_db()
    // query CEO db to init CEOdb db_array multi mission manager on server start up
    const ret_array = await ceodb.init_mission_list();
}


// curl -X POST -H "Content-Type: application/json" --data '{"mission_name": "mission1","host": "cosmos_db", "user": "backend_user", "db_access": "password", "db_name": "cosmos1"}' http://localhost:10090/db/dbmission
router.post('/dbmission', async (req: Request, res: Response) => {
    // console.log(req.body);
    if ((req.body) === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'Argument format incorrect. Must be list of objects'
        });
    }
    // parse request, pass in variables: req.body...
    let dbmission: dbmission = req.body;

    // call ceo database connection, then insert dbmission to create new mission database;
    // check for unique name
    // check for error, if error: break

    const ceodb = CEOHandler.app_db()
    // create new mission database; write to mission handler array; init table schema; post dbmission packet to CEOdb
    await ceodb.write_db([dbmission]);
    res.status(202).json(new_api_response('success'));
});

// curl --request GET "http://localhost:10090/db/dbmissionall?from=59874.83333333&to=59874.87333333&type=node"
router.get('/dbmissionall', async (req: Request<{}, {}, {}, QueryType>, res: Response) => {
    if (req.query.from === undefined || req.query.to === undefined || req.query.query === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to; type = table name string'
        });
    }
    const ceodb = CEOHandler.app_db()
    // successful return of ceo db handler instance of db_array dyna db handler ... returns the this.db_array.database_set from within ceo db handler
    const ret_array = await ceodb.get_mission_array();
    // console.log("db mission array get: ", ret_array);
    // the array will be regenerated on every server restart, and pulls from CEO db of database details
    for (const instance of ret_array) {
        console.log("db return_array [i].mission : ", instance.mission);
    }
    // example database call for random 3 object in array, to the device list enpoint query, specified for type batts 
    const dummyQuery = {type: '', arg: '', latestOnly: false, filters: [], functions: []};
    const ret = await ret_array[2].dbin.get_device_keys({ dtype: 12, dname: "batts" }, dummyQuery);
    console.log("db return_array [2].dbin.get_device_keys : ", ret);
    const response = new_api_response('success');
    // response.payload = ret_array[0].dbin.get_event; .... ret
    res.status(200).json(response);
});



/** route POST /db/propagator
    Calls propagator with parameters in body
    
    node_id: Node ID of origin of telem point
    name: Telem key name
    time: Timestamp of telem point (in UTC)
    value: Value of the telem point

    test with:
    curl --data "PUTTELEMHERE" \
      --request POST \
      --header "Content-Type: application/json" \
      http://localhost:10090/sim/propagator
*/
router.post('/telem', async (req: Request<{}, {}, TelegrafBody>, res: Response) => {
    // console.log('in telem', req.body.metrics);
    if (req.body === undefined || req.body.metrics === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'Argument format incorrect.'
        });
    }
    const db = DBHandler.app_db();
    await db.write_telem(req.body.metrics);

    res.status(202).json(new_api_response('success'));
});


/**
 * beacon: Request = list of single type beacon objects in namespace 1.0
 * dynamic function parses beacon data for type, and translates into formated row objects
 * parsed beacon returns array of ["sql_table_name", [{database type row object}, ...] ]
 * this array[0] and array[1] are passed to dynamic sql insert statement function
 * 
 * curl -X POST -H "Content-Type: application/json" --data '{"device_batt_utc_000":59970.640430555555,"device_batt_amp_000":-0.061999999,"device_batt_volt_000":15.382,"device_batt_power_000":-0.95368397,"device_batt_temp_000":296.88,"device_batt_percentage_000":0.92000002,"device_batt_utc_001":59970.640430555555,"device_batt_amp_001":-0.064000003,"device_batt_volt_001":15.384,"device_batt_power_001":-0.98457605,"device_batt_temp_001":298.44,"device_batt_percentage_001":0.9011111111,"device_batt_utc_002":59970.640430555555,"device_batt_amp_002":0.001,"device_batt_volt_002":15.381,"device_batt_power_002":0.015381,"device_batt_temp_002":272.32999,"device_batt_percentage_002":0.92222222}
' http://localhost:10090/db/beacon

curl -X POST -H "Content-Type: application/json" --data '{
    "device_swch_utc_000": 59970.2222222222, "device_swch_amp_000": 0, "device_swch_volt_000": -0.15899999, "device_swch_power_000": -0.222222222,
        "device_swch_utc_001": 59970.368290509257, "device_swch_amp_001": 0, "device_swch_volt_001": -0.15899999, "device_swch_power_001": -0,
            "device_swch_utc_002": 59970.368290509257, "device_swch_amp_002": 0, "device_swch_volt_002": -0.16599999, "device_swch_power_002": -0,
                "device_swch_utc_003": 59970.368290509257, "device_swch_amp_003": 0, "device_swch_volt_003": -0.15899999, "device_swch_power_003": -0,
                    "device_swch_utc_004": 59970.368290509257, "device_swch_amp_004": 0, "device_swch_volt_004": -0.15899999, "device_swch_power_004": -0.222222222
}
' http://localhost:10090/db/beacon
 */

router.post('/beacon', async (req: Request<{}, {}, TelegrafBody>, res: Response) => {
    // console.log(req.body);
    if ((req.body) === undefined || req.body.metrics === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'Argument format incorrect. Must be list of objects'
        });
    }
    // extract body, format of object as string
    for (let i = 0; i < req.body.metrics.length; i++) {
        // parse string object into appropriate array of ["sql_table_name", [{database type row object}, ...] ]
        // console.log(req.body.metrics[i].fields.value);
        const [table_name, parsedbeacon] = beacon2obj(req.body.metrics[i].fields.value);
        // check to make sure beacon is parsed with successful response, then sort on key
        if (table_name !== "error") {
            // open database connection
            const db = DBHandler.app_db();
            // dynamic sql insert statement; takes (table: string, objectArray: any[])
            await db.write_beacon(table_name, parsedbeacon);
        }
    }
    res.status(202).json(new_api_response('success'));
});

/**
 * 
curl -X POST -H "Content-Type: application/json" --data '{ "swchstruc": true, "battstruc": true, "bcregstruc": true, "cpustruc": true, "device": true, "device_type": true, "locstruc": true, "magstruc": true, "node": true, "tsenstruc": true, "rwstruc": true, "mtrstruc": true, "attstruc_icrf": true, "cosmos_event": true, "event_type": true, "gyrostruc": true, "locstruc_eci": true }' http://localhost:10090/db/resetdanger
 */
// DANGER ZONE
router.post('/resetdanger', async (req: Request<{}, {}, TelegrafBody>, res: Response) => {
    console.log('reset called');
    if (req.body === undefined || req.body.metrics === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'Argument format incorrect. Must be list of strings'
        });
    }
    let table_array: Array<string> = [];
    // extract array of tables
    for (let i = 0; i < req.body.metrics.length; i++) {
        const jobj = JSON.parse(req.body.metrics[i].fields.value);
        for (const [key, value] of Object.entries(jobj)) {
            if (value == true) {
                table_array.push(key);
            }
        }
    }
    // open database connection
    const db = DBHandler.app_db();
    await db.reset_db(table_array);
    res.status(202).json(new_api_response('success'));

});

/**
 * devices: list of {node_id:number, name:string, dname:string} node dicts
 * 
 * curl -X POST -H "Content-Type: application/json" --data '[{"node_name":"mothership","type":1,"cidx":5,"didx":8,"name":"test"}]' http://localhost:10090/db/device
 */

router.post('/device', async (req: Request, res: Response) => {
    // console.log(req.body);
    if (!Array.isArray(req.body)) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'Argument format incorrect. Must be list of {node_id:number, name:string, dname:string} dicts'
        });
    }
    const db = DBHandler.app_db();
    await db.write_device(req.body);

    res.status(200).json();
});


// POST event resource impact change / delete rows endpoint 
router.post('/eventresourceimpact', async (req: Request<{}, {}, EventResourceUpdate>, res: Response) => {
    // console.log(req.body);
    if (!Array.isArray(req.body)) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'Argument format incorrect. Must be object of {event_id:number, update:{resource_name:{second_index:number, resource_change:number}}} dicts'
        });
    }
    const db = DBHandler.app_db();
    // parse out event_id and pass a first argument, then the event resource update body as second argument
    const event_id: number = req.body.event_id;
    await db.update_eventresourceimpact(event_id, req.body.update);

    res.status(200).json();
});


/**
 * devices: list of {node_id:number, name:string, dname:string} node dicts
 * 
 * test with:
    curl --request GET "http://localhost:10090/db/attitude?from=59874.83333333&to=59874.87333333"
 */
router.get('/attitude', async (req: Request<{}, {}, {}, QueryType>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    const ret = await db.get_attitude(req.query);
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// curl --request GET "http://localhost:10090/db/event?from=59874.83333333&to=59874.87333333"
router.get('/event', async (req: Request<{}, {}, {}, QueryType>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    const ret = await db.get_event(req.query);
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// curl --request GET "http://localhost:10090/db/missionevent"
router.get('/missionevent', async (req: Request<{}, {}, {}>, res: Response) => {
    const db = DBHandler.app_db();
    // if (req.query.from === undefined || req.query.to === undefined) {
    //     throw new AppError({
    //         httpCode: StatusCodes.BAD_REQUEST,
    //         description: 'URL Query incorrect, must provide time range from and to'
    //     });
    // }
    const ret = await db.get_event_list();
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// curl --request GET "http://localhost:10090/db/missionresource"
router.get('/missionresource', async (req: Request<{}, {}, {}>, res: Response) => {
    const db = DBHandler.app_db();
    // if (req.query.from === undefined || req.query.to === undefined) {
    //     throw new AppError({
    //         httpCode: StatusCodes.BAD_REQUEST,
    //         description: 'URL Query incorrect, must provide time range from and to'
    //     });
    // }
    const ret = await db.get_resource_list();
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// curl --request GET "http://localhost:10090/db/evnetmissionresource?eventid=1"
router.get('/evnetmissionresource', async (req: Request<{}, {}, {}, EventType>, res: Response) => {
    const db = DBHandler.app_db();
    // if (req.query.from === undefined || req.query.to === undefined) {
    //     throw new AppError({
    //         httpCode: StatusCodes.BAD_REQUEST,
    //         description: 'URL Query incorrect, must provide time range from and to'
    //     });
    // }
    const ret = await db.get_event_resource_list(req.query.eventid);
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// curl --request GET "http://localhost:10090/db/missioneventresourceimpact?dtype=1&dname=test"
router.get('/missioneventresourceimpact', async (req: Request<{}, {}, {}, KeyType>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.dtype === undefined || req.query.dname === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide key type id and name'
        });
    }
    const ret = await db.get_event_resource_impact({ dtype: req.query.dtype, dname: req.query.dname });
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// curl --request GET "http://localhost:10090/db/now?from=59874.83333333&to=59874.87333333&type=swchstruc"
// curl --request GET "http://localhost:10090/db/now?from=59874.83333333&to=59874.87333333&type=node"
// curl --request GET "http://localhost:10090/db/now?from=59874.83333333&to=59874.87333333&query="

router.get('/now', async (req: Request<{}, {}, {}, QueryType>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined || req.query.query === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to; type = table name string'
        });
    }
    // takes the table: string as argument, where table is exact name of DB table
    const ret = await db.get_now(req.query);
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// // curl --request GET "http://localhost:10090/db/position?from=59874.83333333&to=59874.87333333&type=eci&latestOnly=true"
/**
 * position: test
 * 
 * 
 * curl -X GET -H "Content-Type: application/json" --data '{"query": { "type":"position", "arg":"eci", "latestOnly":false, "filters":[], "functions":[]}, "from":59874.83333333, "to":59874.87333333}' http://localhost:10090/db/position
 */
router.get('/position', async (req: Request<{}, {}, {}, QueryType>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined || req.query.query === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    console.log("position curl request: ", req.query);
    const ret = await db.get_position(req.query);
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// // curl --request GET "http://localhost:10090/db/battery?from=59874.83333333&to=59874.87333333"
// out of range device key test: 
// curl --request GET "http://localhost:10090/db/battery?from=69874.83333333&to=69874.87333333"
router.get('/battery', async (req: Request<{}, {}, {}, QueryType>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    // const simdb = SIMDBHandler.app_db()
    // const simret = await simdb.get_battery({ from: req.query.from, to: req.query.to });
    // const response = new_api_response('success');
    // response.payload = simret;
    // res.status(200).json(response);
    const ret = await db.get_battery(req.query);
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// // curl --request GET "http://localhost:10090/db/bcreg?from=59874.83333333&to=59874.87333333"
// out of range device key test: 
// curl --request GET "http://localhost:10090/db/bcreg?from=69874.83333333&to=69874.87333333"
router.get('/bcreg', async (req: Request<{}, {}, {}, QueryType>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    const ret = await db.get_bcreg(req.query);
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// // curl --request GET "http://localhost:10090/db/tsen?from=59874.83333333&to=59874.87333333"
// out of range device key test: 
// curl --request GET "http://localhost:10090/db/tsen?from=69874.83333333&to=69874.87333333"
router.get('/tsen', async (req: Request<{}, {}, {}, QueryType>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    const ret = await db.get_tsen(req.query);
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// // curl --request GET "http://localhost:10090/db/cpu?from=59874.83333333&to=59874.87333333"
// out of range device key test: 
// curl --request GET "http://localhost:10090/db/cpu?from=69874.83333333&to=69874.87333333"
router.get('/cpu', async (req: Request<{}, {}, {}, QueryType>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    const ret = await db.get_cpu(req.query);
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// // curl --request GET "http://localhost:10090/db/mag?from=59874.83333333&to=59874.87333333"
// out of range device key test: 
// curl --request GET "http://localhost:10090/db/mag?from=69874.83333333&to=69874.87333333"
router.get('/mag', async (req: Request<{}, {}, {}, QueryType>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    const ret = await db.get_mag(req.query);
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// // curl --request GET "http://localhost:10090/db/gyro?from=59874.83333333&to=59874.87333333"
// out of range device key test: 
// curl --request GET "http://localhost:10090/db/gyro?from=69874.83333333&to=69874.87333333"
router.get('/gyro', async (req: Request<{}, {}, {}, QueryType>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    const ret = await db.get_gyro(req.query);
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// // curl --request GET "http://localhost:10090/db/mtr?from=59874.83333333&to=59874.87333333"
// out of range device key test: 
// curl --request GET "http://localhost:10090/db/mtr?from=69874.83333333&to=69874.87333333"
router.get('/mtr', async (req: Request<{}, {}, {}, QueryType>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    const ret = await db.get_mtr(req.query);
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// // curl --request GET "http://localhost:10090/db/rw?from=59874.83333333&to=59874.87333333"
// out of range device key test: 
// curl --request GET "http://localhost:10090/db/rw?from=69874.83333333&to=69874.87333333"
router.get('/rw', async (req: Request<{}, {}, {}, QueryType>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    const ret = await db.get_rw(req.query);
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});


// Returns the relative angle/range from an origin node to other nodes
// curl --request GET "http://localhost:10090/db/nodalaware?from=59874.83333333&to=59874.87333333&type=eci&latestOnly=true"
router.get('/nodalaware', async (req: Request<{}, {}, {}, QueryType>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined || req.query.query === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    const ret = await db.get_relative_angle_range(req.query);
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// TODOs:
// return proper error struct in res.json (try using the cosmossimpanel with name as node_name instead, for example, you'll
// get Success! Error must have a name, or something like that. Which makes no sense. Follow the line of error from front
// to end and back)
// Figure out mysql user host
// Handle errors caused by bad connection due to incorrect credentials and what not
