import BaseDatabase, { Device, Node, TelegrafMetric } from "./BaseDatabase";
import mysql from 'mysql2';
import { Pool } from "mysql2/promise";
import { mjd_to_unix } from '../utils/time';
import { AppError } from '../exceptions/AppError';
import { StatusCodes } from 'http-status-codes';
import { attitude, eci_position, geod_position, geos_position, lvlh_attitude } from '../transforms/cosmos';
import { TimeRange, cosmosresponse, LocType } from '../types/cosmos_types';


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

    public async write_telem(telem: TelegrafMetric[]): Promise<void> {
        for (let i = 0; i < telem.length; i++) {
            console.log('telem:', telem[i]);
            this.pool.query(telem[i].fields.value, (err) => {
                if (err) {
                    console.log(err);
                }
            });
            // this.pool.execute(
            //     'INSERT INTO telem (node_id, name, time, value) VALUES (?,?,?,?)',
            //     [telem[i].node_id, telem[i].name, datestring, telem[i].value],
            //     (err) => {
            //         if (err) {
            //             console.log('err:',err);
            //         }
            //     }
            // );
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
        for (let i = 0; i < nodes.length; i++) {
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
        for (let i = 0; i < devices.length; i++) {
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
utc AS "Time",
s_x AS qsx,
s_y AS qsy,
s_z AS qsz,
s_w AS qsw
FROM attstruc_icrf
WHERE utc BETWEEN ? and ? ORDER BY Time limit 1000`,
                [timerange.from, timerange.to],
            );
            const [vrows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT
utc AS "Time",
omega_x AS qvx,
omega_y AS qvy,
omega_z AS qvz
FROM attstruc_icrf
WHERE utc BETWEEN ? and ? ORDER BY Time limit 1000`,
                [timerange.from, timerange.to],
            );
            const [arows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT
utc AS "Time",
alpha_x AS qax,
alpha_y AS qay,
alpha_z AS qaz
FROM attstruc_icrf
WHERE utc BETWEEN ? and ? ORDER BY Time limit 1000`,
                [timerange.from, timerange.to],
            );
            const ret = { "avectors": attitude(rows), "qvatts": vrows, "qaatts": arows };
            //const ret = attitude(rows);;
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

    public async get_event(timerange: TimeRange): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT 
utc AS "time",
node_name,
duration,
event_id,
event_name
FROM cosmos_event
WHERE utc BETWEEN ? and ? ORDER BY time limit 1000;`,
                [timerange.from, timerange.to],
            );
            console.log(rows[0])
            const ret = { "events": rows };
            return ret;
        }
        catch (error) {
            console.log('Error in get_event:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    public async get_mag(timerange: TimeRange): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT 
utc AS "time",
node_name,
didx,
mag_x,
mag_y,
mag_z
FROM magstruc
WHERE utc BETWEEN ? and ? ORDER BY time limit 1000;`,
                [timerange.from, timerange.to],
            );
            console.log(rows[0])
            const ret = { "mags": rows };
            return ret;
        }
        catch (error) {
            console.log('Error in get_position:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }
    // add output type option variable to the function inputs // , type: string
    public async get_position(loctype: LocType): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT
locstruc.utc AS "time", 
locstruc.node_name as "node_name",
node.node_type as "node_type",
eci_s_x, eci_s_y, eci_s_z,
eci_v_x, eci_v_y, eci_v_z,
icrf_s_x, icrf_s_y, icrf_s_z, 
icrf_s_w, icrf_v_x, icrf_v_y, 
icrf_v_z
FROM locstruc 
INNER JOIN node ON locstruc.node_name = node.node_name
WHERE locstruc.utc BETWEEN ? and ? ORDER BY time limit 1000`,
                [loctype.from, loctype.to],
            );
            console.log(rows[0])
            // let type = "eci";
            let type = loctype.type;
            if (type == "eci") {
                const ret = { "ecis": eci_position(rows) };
                return ret;
            } else if (type == "geod") {
                const ret = { "geoidposs": geod_position(rows) };
                return ret;
            } else if (type == "geos") {
                const ret = { "spherposs": geos_position(rows) };
                return ret;
            } else if (type == "lvlh") {
                const ret = { "qatts": lvlh_attitude(rows) };
                return ret;
            }
            const ret = { "ecis": eci_position(rows) };
            // switch statement here also to parse type option passed in from request
            // passing the type for the list of sub-structures { geoidpos ... }
            return ret;
        }
        catch (error) {
            console.log('Error in get_position:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    public async get_battery(timerange: TimeRange): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT
  utc AS "time",
  CONCAT(devspec.node_name, ':', device.name) as "node",
  amp,
  power
FROM battstruc AS devspec
INNER JOIN device ON device.didx = devspec.didx
WHERE
  device.type = 12 AND
devspec.utc BETWEEN ? and ? ORDER BY time limit 1000`,
                [timerange.from, timerange.to],
            );
            console.log(rows[0])
            const ret = { "batts": rows };
            //const ret = attitude(rows);
            return ret;
        }
        catch (error) {
            console.log('Error in get_battery:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    public async get_bcreg(timerange: TimeRange): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT
  device_bcreg_utc AS "time",
  CONCAT(node_name, ':', didx) as node,
  device_bcreg_amp AS amp,
  device_bcreg_power AS power
FROM device_bcreg
INNER JOIN node ON device_bcreg.node_id = node.node_id
WHERE device_bcreg_utc BETWEEN ? and ? ORDER BY time limit 1000`,
                [timerange.from, timerange.to],
            );
            console.log(rows[0])
            const ret = { "bcregs": rows };
            //const ret = attitude(rows);
            return ret;
        }
        catch (error) {
            console.log('Error in get_bcreg:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    public async get_tsen(timerange: TimeRange): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT
utc AS "time",
CONCAT(devspec.node_name, ':', device.name) as "node:device",
devspec.temp
FROM tsenstruc AS devspec
INNER JOIN device ON device.didx = devspec.didx
WHERE
  device.type = 15 AND
devspec.utc BETWEEN ? and ? ORDER BY time limit 1000`,
                [timerange.from, timerange.to],
            );
            console.log(rows[0])
            const ret = { "tsens": rows };
            //const ret = attitude(rows);
            return ret;
        }
        catch (error) {
            console.log('Error in get_tsen:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    public async get_cpu(timerange: TimeRange): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT
  utc AS "time",
  CONCAT(node_name, ':', didx) as node,
  cpu_load as "load",
  gib,
  storage
FROM cpustruc
WHERE utc BETWEEN ? and ? ORDER BY time limit 1000`,
                [timerange.from, timerange.to],
            );
            console.log(rows[0])
            const ret = { "cpus": rows };
            //const ret = attitude(rows);
            return ret;
        }
        catch (error) {
            console.log('Error in get_cpu:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }
}
