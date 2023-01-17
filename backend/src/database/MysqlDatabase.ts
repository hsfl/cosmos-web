import BaseDatabase, { Device, Node, Telem } from "./BaseDatabase";
import mysql from 'mysql2';
import { Pool } from "mysql2/promise";
import { mjd_to_unix } from '../utils/time';
import { AppError } from '../exceptions/AppError';
import { StatusCodes } from 'http-status-codes';
import { attitude } from '../transforms/cosmos';
import { TimeRange, cosmosresponse } from '../types/cosmos_types';


// MySQL Implementation of Database class
export default class MysqlDatabase extends BaseDatabase {
    // Connection to database
    private pool: mysql.Pool;
    private promisePool: Pool;

    constructor(host: string | undefined, user: string | undefined, password: string | undefined, database: string | undefined) {
        super();
        if (host === undefined || user === undefined || password === undefined || database === undefined) {
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Mysql database connection configuration invalid',
                isOperational: false,
            });
        }
        this.pool = mysql.createPool({
            host: host,
            user: user,
            password: password,
            database: database,
            decimalNumbers: true,
            supportBigNumbers: true,
            bigNumberStrings: false,
        });
        this.promisePool = this.pool.promise();
    }

    public async clearDatabase(): Promise<void> {
        console.log('Clear databases');
    }

    public async write_telem(telem: Telem[]): Promise<void> {
        for (let i =0; i < telem.length; i++) {
            // Format MJD timestamp to mysql-friendly string
            const time = mjd_to_unix(telem[i].time);
            // Date takes unix milliseconds
            const date = new Date(time*1000);
            const datestring = date.toJSON().replace('T', ' ').slice(0,-1);
            this.pool.execute(
                'INSERT INTO telem (node_id, name, time, value) VALUES (?,?,?,?)',
                [telem[i].node_id, telem[i].name, datestring, telem[i].value],
                (err) => {
                    if (err) {
                        console.log('err:',err);
                    }
                }
            );
        }
    }

    // public async write_telem_bulk(): Promise<void> {
    //     for (let i =0; i < telem.length; i++) {
    //         // Format MJD timestamp to mysql-friendly string
    //         const time = mjd_to_unix(telem[i].time);
    //         // Date takes unix milliseconds
    //         const date = new Date(time*1000);
    //         const datestring = date.toJSON().replace('T', ' ').slice(0,-1);
    //         this.pool.execute(
    //             'INSERT INTO telem (node_id, name, time, value) VALUES (?,?,?,?)',
    //             [telem[i].node_id, telem[i].name, datestring, telem[i].value],
    //             (err) => {
    //                 if (err) {
    //                     console.log('err:',err);
    //                 }
    //             }
    //         );
    //     } 
    // }

    public async write_node(nodes: Node[]): Promise<void> {
        // Clear out current node table
        this.pool.query('DELETE FROM node', (err) => {
            if (err) {
                console.log(err);
            }
        });
        // Load in new nodes
        for (let i=0; i < nodes.length; i++) {
            this.pool.execute(
                'INSERT INTO node (id, name) VALUES (?,?)',
                [nodes[i].id, nodes[i].name],
                (err) => {
                    if (err) {
                        console.log(err);
                    }
                }
            );
        }
    }

    public async write_device(devices: Device[]): Promise<void> {
        // Clear out current device table
        try {
            await this.promisePool.query('DELETE FROM device');
        } catch (error) {
            console.log(error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Error updating devices'
            });
        }
        // Load in new devices mappings
        for (let i=0; i < devices.length; i++) {
            try {
                await this.promisePool.execute(
                    'INSERT INTO device (node_id, name, dname) VALUES (?,?,?)',
                    [devices[i].node_id, devices[i].name, devices[i].dname]
                );
            } catch (error) {
                console.log(error);
                throw new AppError({
                    httpCode: StatusCodes.BAD_REQUEST,
                    description: 'Failure adding devices'
                });
            }
            
        }
    }
    // TODO: fix return type
    public async get_attitude(timerange: TimeRange): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
`SELECT
node_loc_att_icrf_utc AS "Time",
node_loc_att_icrf_s_d_x AS qsx,
node_loc_att_icrf_s_d_y AS qsy,
node_loc_att_icrf_s_d_z AS qsz,
node_loc_att_icrf_s_w AS qsw
FROM node_loc_att_icrf_s
WHERE node_loc_att_icrf_utc BETWEEN ? and ? ORDER BY Time limit 1000`,
                [timerange.from, timerange.to],
            );
            const [vrows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
`SELECT
node_loc_att_icrf_utc AS "Time",
node_loc_att_icrf_v_col_0 AS qvx,
node_loc_att_icrf_v_col_1 AS qvy,
node_loc_att_icrf_v_col_2 AS qvz
FROM node_loc_att_icrf_v
WHERE node_loc_att_icrf_utc BETWEEN ? and ? ORDER BY Time limit 1000`,
                [timerange.from, timerange.to],
            );
            const [arows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
`SELECT
node_loc_att_icrf_utc AS "Time",
node_loc_att_icrf_a_col_0 AS qax,
node_loc_att_icrf_a_col_1 AS qay,
node_loc_att_icrf_a_col_2 AS qaz
FROM node_loc_att_icrf_a
WHERE node_loc_att_icrf_utc BETWEEN ? and ? ORDER BY Time limit 1000`,
                [timerange.from, timerange.to],
            );
            const ret = {"avectors":attitude(rows), "qvatts": vrows, "qaatts":arows};
            //const ret = attitude(rows);
            return ret;
        }
        catch (error) {
            console.log('Error in get_attitude:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }
}