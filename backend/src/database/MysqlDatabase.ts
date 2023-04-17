import BaseDatabase, { sqlmap, sqlquerykeymap, Device, Node, TelegrafMetric, deviceswch, devicebatt } from "./BaseDatabase";
import mysql from 'mysql2';
import { Pool } from "mysql2/promise";
import { mjd_to_unix } from '../utils/time';
import { AppError } from '../exceptions/AppError';
import { StatusCodes } from 'http-status-codes';
import { attitude, eci_position, geod_position, geos_position, lvlh_attitude } from '../transforms/cosmos';
import { TimeRange, cosmosresponse, LocType, KeyType } from '../types/cosmos_types';


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
        // Clear out current device table TODO remove after development 
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
                    // node_name, type, cidx, didx, name
                    // string, int, int, int, string
                    // [{"node_name":"mothership","type":1,"cidx":5,"didx":8,"name":"test"}]
                    'INSERT INTO device (node_name, type, cidx, didx, name) VALUES (?,?,?,?,?)',
                    [devices[i].node_name, devices[i].type, devices[i].cidx, devices[i].didx, devices[i].name]
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

    // dynamic function maps over sql tables, takes parsed array of single type specific objects, constructs insert statement
    // pools response to post each row object using constructed insert statement
    public async write_beacon(table: string, objectArray: any[]): Promise<void> {
        // map of cosmos sql tables; 
        // note the column order must match sql order; key names must match sql table names; naming must be exact
        // const sqlmap: Object = {
        //     "swchstruc": ["node_name", "didx", "utc", "volt", "amp", "power", "temp"],
        //     "battstruc": ["node_name", "didx", "utc", "volt", "amp", "power", "temp", "percentage"],
        //     "bcregstruc": ["node_name", "didx", "utc", "volt", "amp", "power", "temp", "mpptin_amp", "mpptin_volt", "mpptout_amp", "mpptout_volt"],
        //     "cpustruc": ["node_name", "didx", "utc", "temp", "uptime", "cpu_load", "gib", "boot_count", "storage"],
        //     "device": ["node_name", "type", "cidx", "didx", "name"],
        //     "device_type": ["name", "id"],
        //     "locstruc": ["node_name", "utc", "eci_s_x", "eci_s_y", "eci_s_z", "eci_v_x", "eci_v_y", "eci_v_z", "icrf_s_x", "icrf_s_y", "icrf_s_z", "icrf_s_w", "icrf_v_x", "icrf_v_y", "icrf_v_z"],
        //     "magstruc": ["node_name", "didx", "utc", "mag_x", "mag_y", "mag_z"],
        //     "node": ["node_id", "node_name", "node_type", "agent_name", "utc", "utcstart"],
        //     "tsenstruc": ["node_name", "didx", "utc", "temp"]
        // }
        // build the insert statement and extract the column list for the applicable table type
        let insert_statement: string = "";
        let dynamic_col_array: Array<any> = [];
        try {
            for (const [key, value] of Object.entries(sqlmap)) {
                // console.log(`${key}: ${value}`);
                if (key === table) {
                    let dynamic_insert: string = 'INSERT INTO ' + key;
                    let table_cols: string = ' (';
                    let table_variables: string = ') VALUES (';
                    for (let i = 0; i < value.length; i++) {
                        dynamic_col_array.push(value[i]);
                        if ((i + 1) == value.length) {
                            table_cols += value[i];
                            table_variables += '?)'
                        } else {
                            table_cols += value[i] + ", ";
                            table_variables += '?,'
                        }
                    }
                    insert_statement = dynamic_insert.concat(table_cols, table_variables);
                    console.log("insert statement construct: ", insert_statement);
                    // console.log("dynamic col array: ", dynamic_col_array);
                }
            }
        } catch (error) {
            console.log(error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Error writing sql insert statement'
            });
        }


        // development delete table contents statement for repeat sample posts TODO remove 
        try {
            await this.promisePool.query('DELETE FROM ' + table);
        } catch (error) {
            console.log(error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Error clearing table'
            });
        }

        // console.log("object array: ", objectArray);

        // // Load in new beacon mappings
        // transition from array of row objects through each row object
        for (let i = 0; i < objectArray.length; i++) {
            let row_value_array: Array<any> = [];
            row_value_array = dynamic_col_array.map(x => objectArray[i][x]);
            console.log("parsed row values array: ", row_value_array);

            try {
                await this.promisePool.execute(
                    insert_statement,
                    row_value_array
                );
            } catch (error) {
                console.log(error);
                throw new AppError({
                    httpCode: StatusCodes.BAD_REQUEST,
                    description: 'Failure adding row'
                });
            }

        }
    }

    public async write_swchstruc(swchstruc: deviceswch[]): Promise<void> {
        try {
            await this.promisePool.query('DELETE FROM swchstruc');
        } catch (error) {
            console.log(error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Error updating swch struc'
            });
        }
        // Load in new beacon mappings
        for (let i = 0; i < swchstruc.length; i++) {
            try {
                await this.promisePool.execute(
                    // [{"node_name":"mothership","utc":59970.36829050926,"didx":1,"amp":0,"volt":-0.15899999,"power":-0,"temp":0}]
                    'INSERT INTO swchstruc (node_name, didx, utc, volt, amp, power, temp) VALUES (?,?,?,?,?,?,?)',
                    [swchstruc[i].node_name, swchstruc[i].didx, swchstruc[i].utc, swchstruc[i].volt, swchstruc[i].amp, swchstruc[i].power, swchstruc[i].temp]
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

    public async write_battstruc(battstruc: devicebatt[]): Promise<void> {
        try {
            await this.promisePool.query('DELETE FROM battstruc');
        } catch (error) {
            console.log(error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Error updating batt struc'
            });
        }
        // Load in new beacon mappings
        for (let i = 0; i < battstruc.length; i++) {
            try {
                await this.promisePool.execute(
                    // [{"node_name":"mothership","utc":59970.36829050926,"didx":1,"amp":0,"volt":-0.15899999,"power":-0,"temp":0,"percentage":0.92000002}]
                    'INSERT INTO battstruc (node_name, didx, utc, volt, amp, power, temp, percentage) VALUES (?,?,?,?,?,?,?,?)',
                    [battstruc[i].node_name, battstruc[i].didx, battstruc[i].utc, battstruc[i].volt, battstruc[i].amp, battstruc[i].power, battstruc[i].temp, battstruc[i].percentage]
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

    // // // /// 
    // get list of unique device keys given empty query return for given struc type
    // "device": ["node_name", "type", "cidx", "didx", "name"],
    // "device_type": ["name", "id"],
    public async get_device_keys(keytype: KeyType): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT
                node_name,
                didx
FROM device
WHERE
  type = ? limit 1000`,
                [keytype.dtype],
            );
            console.log(rows[0])
            const dname: string = keytype.dname;
            // const ret = { dname: rows };
            const ret = { dname: rows };
            console.log("device return: ", ret);
            //const ret = attitude(rows);
            return ret;
        }
        catch (error) {
            console.log('Error in get_device_keys:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }
    // // // /// 

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

    // get latest position
    // dynamic query of most recent row value for type table, for all unique node / node+device keys 

    // need to return list of latest values for list of each unique key
    // future need: return specific latest column value for unique key

    // function requires sql_mode variable configuration to exclude ONLY_FULL_GROUP_BY
    // run this command from sql terminal to check:
    // SELECT @@sql_mode ;
    // or also
    // SHOW GLOBAL VARIABLES LIKE 'sql_mode';
    //
    // remove the specified config with:
    // SET GLOBAL sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));

    // this needs a fix... sql seems to update and revert back to only full group by on restart... TODO

    public async get_now(table: string, timerange: TimeRange): Promise<cosmosresponse> {
        let query_statement: string = "";
        try {
            for (const [key, value] of Object.entries(sqlmap)) {
                // console.log(`${key}: ${value}`);
                if (key === table) {
                    let dynamic_query: string = 'SELECT ';
                    let table: string = ' FROM ' + key;
                    let mtime: string = '';
                    for (let i = 0; i < value.length; i++) {
                        if (value[i] === "utc") {
                            mtime = 'MAX(utc) as "latest_timestamp"';
                        }
                        else {
                            dynamic_query += value[i] + ", ";
                        }
                    }
                    let query_group: string = ' GROUP BY ';
                    for (const [qkey, qvalue] of Object.entries(sqlquerykeymap)) {
                        // console.log(`${key}: ${value}`);
                        if (qkey === key) {
                            for (let i = 0; i < qvalue.length; i++) {
                                if ((i + 1) == qvalue.length) {
                                    query_group += qvalue[i];
                                } else {
                                    query_group += qvalue[i] + ", ";
                                }
                            }
                        }
                    }
                    query_statement = dynamic_query.concat(mtime, table, query_group);
                    console.log("query max(utc) statement construct: ", query_statement);
                }
            }
        } catch (error) {
            console.log(error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Error writing sql insert statement'
            });
        }
        // query_statement ... need to add timerange limits, and row length limit? or is simple max(utc) ok
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                query_statement
            );
            // const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
            //     `SELECT
            //     node_name,
            //     node_type,
            //     node_id,
            //     agent_name,
            //     MAX(utc) as "latest timestamp"
            //     FROM node
            //     WHERE node_name="mothership" and utc BETWEEN ? and ? ORDER BY time limit 1000`,
            //     [timerange.from, timerange.to],
            // );

            console.log(rows[0])
            const ret = { table: rows };
            return ret;
        }
        catch (error) {
            console.log('Error in get_now:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    // LocType adds output type option variable to the function inputs // , type: string
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
            if (rows.length == 0) {
                console.log("empty rows");
            }
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
            if (rows.length == 0) {
                // console.log("empty rows");
                const key_array = await this.get_device_keys({ dtype: 12, dname: "batts" })
                // console.log("key_array: ", key_array);
                const battrows: Array<devicebatt> = [];
                for (const [qkey, qvalue] of Object.entries(key_array)) {
                    for (let i = 0; i < qvalue.length; i++) {
                        // console.log("qvalue[i]: ", qvalue[i]);
                        const devbatt: devicebatt = {
                            node_name: qvalue[i].node_name,
                            didx: qvalue[i].didx,
                            utc: timerange.to,
                            volt: 0,
                            amp: 0,
                            power: 0,
                            temp: 0,
                            percentage: 0
                        }
                        battrows.push({ ...devbatt });
                    }
                }
                const ret = { "batts": battrows };
                // console.log("compiled mock batt return: ", ret);
                return ret;
            } else {
                const ret = { "batts": rows };
                return ret;
            }
            // const ret = { "batts": rows };
            // return ret;
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
