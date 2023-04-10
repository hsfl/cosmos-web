import express, { Request, Response } from 'express';
import { AppError } from '../exceptions/AppError';
import { StatusCodes } from 'http-status-codes';
import DBHandler from '../database/DBHandler';
import { new_api_response } from '../utils/response';
import { TimeRange, LocType } from '../types/cosmos_types';
import { beacon2obj } from '../transforms/cosmos';
import { TelegrafBody } from '../database/BaseDatabase';
const router = express.Router();



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
    console.log('in telem', req.body.metrics);
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

router.post('/beacon', async (req: Request, res: Response) => {
    // console.log(req.body);
    if ((req.body) === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'Argument format incorrect. Must be list of objects'
        });
    }
    // extract body, format of object as string
    const body_ob: string = JSON.stringify(req.body);
    // parse string object into appropriate array of ["sql_table_name", [{database type row object}, ...] ]
    const parsedbeacon = beacon2obj(body_ob);
    // check to make sure beacon is parsed with successful response, then sort on key
    if (parsedbeacon !== undefined) {
        // open database connection
        const db = DBHandler.app_db();
        // dynamic sql insert statement; takes (table: string, objectArray: any[])
        await db.write_beacon(parsedbeacon[0], parsedbeacon[1]);
        res.status(202).json(new_api_response('success'));
    }
});


/**
 * nodes: list of {id:number, name:string} node dicts
 */
router.post('/node', async (req: Request, res: Response) => {
    if (req.body === undefined || !Array.isArray(req.body)) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'Argument format incorrect. Must be list of {id:number, name:string} dicts.'
        });
    }
    const db = DBHandler.app_db();
    await db.write_node(req.body);

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

/**
 * devices: list of {node_id:number, name:string, dname:string} node dicts
 * 
 * test with:
    curl --request GET "http://localhost:10090/db/attitude?from=59874.83333333&to=59874.87333333"
 */
router.get('/attitude', async (req: Request<{}, {}, {}, TimeRange>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    const ret = await db.get_attitude({ from: req.query.from, to: req.query.to });
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// curl --request GET "http://localhost:10090/db/event?from=59874.83333333&to=59874.87333333"
router.get('/event', async (req: Request<{}, {}, {}, TimeRange>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    const ret = await db.get_event({ from: req.query.from, to: req.query.to });
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// curl --request GET "http://localhost:10090/db/now?from=59874.83333333&to=59874.87333333&type=swchstruc"
// curl --request GET "http://localhost:10090/db/now?from=59874.83333333&to=59874.87333333&type=node"
router.get('/now', async (req: Request<{}, {}, {}, LocType>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined || req.query.type === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to; type = table name string'
        });
    }
    const ret = await db.get_now(req.query.type, { from: req.query.from, to: req.query.to });
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// // curl --request GET "http://localhost:10090/db/position?from=59874.83333333&to=59874.87333333&type=eci"
router.get('/position', async (req: Request<{}, {}, {}, LocType>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined || req.query.type === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    const ret = await db.get_position({ from: req.query.from, to: req.query.to, type: req.query.type });
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

router.get('/battery', async (req: Request<{}, {}, {}, TimeRange>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    const ret = await db.get_battery({ from: req.query.from, to: req.query.to });
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

router.get('/bcreg', async (req: Request<{}, {}, {}, TimeRange>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    const ret = await db.get_bcreg({ from: req.query.from, to: req.query.to });
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

router.get('/tsen', async (req: Request<{}, {}, {}, TimeRange>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    const ret = await db.get_tsen({ from: req.query.from, to: req.query.to });
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

router.get('/cpu', async (req: Request<{}, {}, {}, TimeRange>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    const ret = await db.get_cpu({ from: req.query.from, to: req.query.to });
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

module.exports = router;

// TODOs:
// return proper error struct in res.json (try using the cosmossimpanel with name as node_name instead, for example, you'll
// get Success! Error must have a name, or something like that. Which makes no sense. Follow the line of error from front
// to end and back)
// Figure out mysql user host
// Handle errors caused by bad connection due to incorrect credentials and what not
