import express, { Request, Response } from 'express';
import { AppError } from '../exceptions/AppError';
import { StatusCodes } from 'http-status-codes';
import DBHandler from '../database/DBHandler';
import { new_api_response } from '../utils/response';
import { TimeRange } from '../types/cosmos_types';
const router = express.Router();



/** route POST /db/propagator
    Calls propagator with parameters in body
    
    node_id: Node ID of origin of telem point
    name: Telem key name
    time: Timestamp of telem point (in UTC)
    value: Value of the telem point

    test with:
    curl --data '{"start":59270,"runcount":5,"simdt":60,"telem":["poseci"],"nodes":[{"name":"node0","phys":{"lat":0.371876,"lon":-2.755147,"alt":400000,"angle":0.942478}}]}' \
      --request POST \
      --header "Content-Type: application/json" \
      http://localhost:10090/sim/propagator
*/
router.post('/telem', async (req: Request, res: Response) => {
    if (req.body === undefined || !Array.isArray(req.body)) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'Argument format incorrect. Must be list of telem dicts.'
        });
    }
    const db = DBHandler.app_db();
    await db.write_telem(req.body);
    
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
    curl --request POST \
      --header "Content-Type: application/json" \
      http://localhost:10090/db/attitude
 */
 router.get('/attitude', async (req: Request<{},{},{},TimeRange>, res: Response) => {
    const db = DBHandler.app_db();
    if (req.query.from === undefined || req.query.to === undefined) {
        throw new AppError({
            httpCode: StatusCodes.BAD_REQUEST,
            description: 'URL Query incorrect, must provide time range from and to'
        });
    }
    const ret = await db.get_attitude({from:req.query.from, to: req.query.to});
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
