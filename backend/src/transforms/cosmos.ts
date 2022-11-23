import { CosmosModule, quaternion, avector, timepoint } from '../types/cosmos_types';
import mysql from 'mysql2';

const COSMOSJS = require('/root/web_core_dist/CosmosWebCore.js');
// TODO: probably a better way of doing this
let cosmos:CosmosModule;
COSMOSJS().then((cosmos_module:CosmosModule) => {
    cosmos = cosmos_module;
    console.log('CosmosModule successfully imported');
    return;
});

export const attitude = (rows: mysql.RowDataPacket[]) => {
    
    const ret:Array<avector & timepoint> = [];
    rows.forEach((row) => {
        const q:quaternion = {
            d:{
                x:row.qx,
                y:row.qy,
                z:row.qz,
            },
            w:row.qw,
        };
        const av:avector = (cosmos.a_quaternion2euler(q));
        //const time  
        ret.push({Time: row.Time, ...av});
    });
    console.log('iret:', rows[0], ret[0]);
    return ret;
};
