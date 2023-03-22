import express, { Request, Response } from 'express';
import { AppError } from '../exceptions/AppError';
import { StatusCodes } from 'http-status-codes';
import DBHandler from '../database/DBHandler';
import { new_api_response } from '../utils/response';
import { TimeRange, LocType } from '../types/cosmos_types';
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
 */
router.post('/device', async (req: Request, res: Response) => {
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
// // curl --request GET "http://localhost:10090/db/position?from=59874.83333333&to=59874.87333333&type=eci"
router.get('/position', async (req: Request<{}, {}, {}, LocType>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined || req.query.type === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    // console.log(req.query.from, " from, type> ", req.query.type);
    const ret = await db.get_position({ from: req.query.from, to: req.query.to, type: req.query.type });
    const response = new_api_response('success');
    response.payload = ret;
    res.status(200).json(response);
});

// // curl --request GET "http://localhost:10090/db/position-eci?from=59874.83333333&to=59874.87333333"
// router.get('/position-eci', async (req: Request<{}, {}, {}, TimeRange>, res: Response) => {
//     const db = DBHandler.app_db();
//     if (req.query.from === undefined || req.query.to === undefined) {
//         throw new AppError({
//             httpCode: StatusCodes.BAD_REQUEST,
//             description: 'URL Query incorrect, must provide time range from and to'
//         });
//     }
//     // console.log(req.query.from, " from, type> ", req.query.type);
//     const ret = await db.get_position({ from: req.query.from, to: req.query.to, type: "eci" });
//     const response = new_api_response('success');
//     response.payload = ret;
//     res.status(200).json(response);
// });

// // curl --request GET "http://localhost:10090/db/position-geos?from=59874.83333333&to=59874.87333333"
// router.get('/position-geos', async (req: Request<{}, {}, {}, TimeRange>, res: Response) => {
//     const db = DBHandler.app_db();
//     if (req.query.from === undefined || req.query.to === undefined) {
//         throw new AppError({
//             httpCode: StatusCodes.BAD_REQUEST,
//             description: 'URL Query incorrect, must provide time range from and to'
//         });
//     }
//     // console.log(req.query.from, " from, type> ", req.query.type);
//     const ret = await db.get_position({ from: req.query.from, to: req.query.to, type: "geos" });
//     const response = new_api_response('success');
//     response.payload = ret;
//     res.status(200).json(response);
// });

// // curl --request GET "http://localhost:10090/db/position-geod?from=59874.83333333&to=59874.87333333"
// router.get('/position-geod', async (req: Request<{}, {}, {}, TimeRange>, res: Response) => {
//     const db = DBHandler.app_db();
//     if (req.query.from === undefined || req.query.to === undefined) {
//         throw new AppError({
//             httpCode: StatusCodes.BAD_REQUEST,
//             description: 'URL Query incorrect, must provide time range from and to'
//         });
//     }
//     // console.log(req.query.from, " from, type> ", req.query.type);
//     const ret = await db.get_position({ from: req.query.from, to: req.query.to, type: "geod" });
//     const response = new_api_response('success');
//     response.payload = ret;
//     res.status(200).json(response);
// });

// // curl --request GET "http://localhost:10090/db/position-lvlh?from=59874.83333333&to=59874.87333333"
// router.get('/position-lvlh', async (req: Request<{}, {}, {}, TimeRange>, res: Response) => {
//     const db = DBHandler.app_db();
//     if (req.query.from === undefined || req.query.to === undefined) {
//         throw new AppError({
//             httpCode: StatusCodes.BAD_REQUEST,
//             description: 'URL Query incorrect, must provide time range from and to'
//         });
//     }
//     // console.log(req.query.from, " from, type> ", req.query.type);
//     const ret = await db.get_position({ from: req.query.from, to: req.query.to, type: "lvlh" });
//     const response = new_api_response('success');
//     response.payload = ret;
//     res.status(200).json(response);
// });

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
