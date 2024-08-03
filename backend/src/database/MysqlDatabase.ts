import BaseDatabase, {sqlmap, sqlquerykeymap, device_table, TelegrafMetric, deviceswch, devicebatt, devicebcreg, devicetsen, devicecpu, devicemag, devicegyro, devicemtr, devicerw, deviceimu, devicessen, devicegps, EventResourceUpdateBody, MissionEvent, sqlquerytranslate, locstruc_table, devicealign, GFDeviceType} from "database/BaseDatabase";
import mysql from 'mysql2';
import {Pool} from "mysql2/promise";
import {mjd_to_unix} from '../utils/time';
import {AppError} from 'exceptions/AppError';
import {StatusCodes} from 'http-status-codes';
import {attitude, eci_position, geod_position, geos_position, lvlh_attitude, icrf_att, icrf_lvlh_att, icrf_geoc_att, relative_angle_range, orbit_position, icrf_att_total, mtr_torque, rw_torque} from '../transforms/cosmos';
import {TimeRange, cosmosresponse, KeyType, timepoint, qvatt, qaatt, GF_mtr_torque, GF_rw_torque} from 'types/cosmos_types';
import {QueryObject, QueryType, QueryFilter} from 'types/query_types';
import {table_schema} from './inittables';


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

    public async end_connection(): Promise<void> {
        await this.promisePool.end();
        this.pool.end();
    }

    // public async clearDatabase(): Promise<void> {
    //     console.log('Clear databases');
    // }

    public async write_telem(telem: TelegrafMetric[]): Promise<void> {
        for (let i = 0; i < telem.length; i++) {
            console.log('telem:', telem[i]);
            this.pool.query(telem[i].fields.value, (err) => {
                if (err) {
                    console.error(err);
                }
            });
            // this.pool.execute(
            //     'INSERT IGNORE INTO telem (node_id, name, time, value) VALUES (?,?,?,?)',
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
    //             'INSERT IGNORE INTO telem (node_id, name, time, value) VALUES (?,?,?,?)',
    //             [telem[i].node_id, telem[i].name, datestring, telem[i].value],
    //             (err) => {
    //                 if (err) {
    //                     console.log('err:',err);
    //                 }
    //             }
    //         );
    //     } 
    // }

    public async write_device(devices: device_table[]): Promise<void> {
        // Clear out current device table TODO remove after development 
        try {
            await this.promisePool.query('DELETE FROM device');
        } catch (error) {
            console.error(error);
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
                    'INSERT IGNORE INTO device (node_name, type, cidx, didx, name) VALUES (?,?,?,?,?)',
                    [devices[i].node_name, devices[i].type, devices[i].cidx, devices[i].didx, devices[i].name]
                );
            } catch (error) {
                console.error(error);
                throw new AppError({
                    httpCode: StatusCodes.BAD_REQUEST,
                    description: 'Failure adding devices'
                });
            }

        }
    }


    public async reset_db(tableArray: string[]): Promise<void> {
        // SIM delete table contents statement for array of sql table names 
        try {
            for (let i = 0; i < tableArray.length; i++) {
                await this.promisePool.query('DELETE FROM ' + tableArray[i]);
            }
        } catch (error) {
            console.error(error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Error clearing table'
            });
        }
    }

    public async write_device_align(aligns: devicealign[]): Promise<void> {
        // Load in new devices mappings
        for (let i = 0; i < aligns.length; i++) {
            try {
                await this.promisePool.execute(
                    `INSERT IGNORE INTO devalignstruc (node_name, type, didx, align_w, align_x, align_y, align_z) 
                        SELECT ?,?,?,?,?,?,?
                        FROM dual
                        WHERE NOT EXISTS (SELECT * FROM devalignstruc where node_name = ? AND type = ? AND didx = ?);`,
                    [aligns[i].node_name, aligns[i].type, aligns[i].didx, aligns[i].align_w, aligns[i].align_x, aligns[i].align_y, aligns[i].align_z, aligns[i].node_name, aligns[i].type, aligns[i].didx]
                );
            } catch (error) {
                console.error(error);
                throw new AppError({
                    httpCode: StatusCodes.BAD_REQUEST,
                    description: 'Failure adding aligns'
                });
            }

        }
    }

    // dynamic function maps over sql tables, takes parsed array of single type specific objects, constructs insert statement
    // pools response to post each row object using constructed insert statement
    public async write_beacon(table: string, objectArray: any[]): Promise<void> {
        // build the insert statement and extract the column list for the applicable table type
        let insert_statement: string = "";
        let dynamic_col_array: Array<any> = [];
        try {
            for (const [key, value] of Object.entries(sqlmap)) {
                // console.log(`${key}: ${value}`);
                if (key === table) {
                    let dynamic_insert: string = 'INSERT IGNORE INTO ' + key;
                    let table_cols: string = ' (';
                    let table_variables: string = ') VALUES (';
                    for (let i = 0; i < value.length; i++) {
                        dynamic_col_array.push(value[i]);
                        if ((i + 1) == value.length) {
                            table_cols += "`" + value[i] + "`";
                            table_variables += '?)'
                        } else {
                            table_cols += "`" + value[i] + "`, ";
                            table_variables += '?,'
                        }
                    }
                    insert_statement = dynamic_insert.concat(table_cols, table_variables);
                    // console.log("insert statement construct: ", insert_statement);
                    // console.log("dynamic col array: ", dynamic_col_array);
                }
            }
        } catch (error) {
            console.error(error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Error writing sql insert statement'
            });
        }

        // console.log("object array: ", objectArray);

        // // Load in new beacon mappings
        // transition from array of row objects through each row object
        for (let i = 0; i < objectArray.length; i++) {
            let row_value_array: Array<any> = [];
            row_value_array = dynamic_col_array.map(x => objectArray[i][x]);
            // console.log("parsed row values array: ", row_value_array);

            try {
                await this.promisePool.execute(
                    insert_statement,
                    row_value_array
                );
            } catch (error) {
                console.error(error);
                // throw new AppError({
                //     httpCode: StatusCodes.BAD_REQUEST,
                //     description: 'Failure adding row'
                // });
            }

        }
    }

    // depreciated .. TODO delete 
    // public async write_swchstruc(swchstruc: deviceswch[]): Promise<void> {
    //     try {
    //         await this.promisePool.query('DELETE FROM swchstruc');
    //     } catch (error) {
    //         console.error(error);
    //         throw new AppError({
    //             httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
    //             description: 'Error updating swch struc'
    //         });
    //     }
    //     // Load in new beacon mappings
    //     for (let i = 0; i < swchstruc.length; i++) {
    //         try {
    //             await this.promisePool.execute(
    //                 // [{"node_name":"mothership","utc":59970.36829050926,"didx":1,"amp":0,"volt":-0.15899999,"power":-0,"temp":0}]
    //                 'INSERT IGNORE INTO swchstruc (node_name, didx, utc, volt, amp, power, temp) VALUES (?,?,?,?,?,?,?)',
    //                 [swchstruc[i].node_name, swchstruc[i].didx, swchstruc[i].utc, swchstruc[i].volt, swchstruc[i].amp, swchstruc[i].power, swchstruc[i].temp]
    //             );
    //         } catch (error) {
    //             console.error(error);
    //             throw new AppError({
    //                 httpCode: StatusCodes.BAD_REQUEST,
    //                 description: 'Failure adding devices'
    //             });
    //         }

    //     }
    // }

    // depreciated .. TODO delete 
    // public async write_battstruc(battstruc: devicebatt[]): Promise<void> {
    //     try {
    //         await this.promisePool.query('DELETE FROM battstruc');
    //     } catch (error) {
    //         console.error(error);
    //         throw new AppError({
    //             httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
    //             description: 'Error updating batt struc'
    //         });
    //     }
    //     // Load in new beacon mappings
    //     for (let i = 0; i < battstruc.length; i++) {
    //         try {
    //             await this.promisePool.execute(
    //                 // [{"node_name":"mothership","utc":59970.36829050926,"didx":1,"amp":0,"volt":-0.15899999,"power":-0,"temp":0,"percentage":0.92000002}]
    //                 'INSERT IGNORE INTO battstruc (node_name, didx, utc, volt, amp, power, temp, percentage) VALUES (?,?,?,?,?,?,?,?)',
    //                 [battstruc[i].node_name, battstruc[i].didx, battstruc[i].utc, battstruc[i].volt, battstruc[i].amp, battstruc[i].power, battstruc[i].temp, battstruc[i].percentage]
    //             );
    //         } catch (error) {
    //             console.error(error);
    //             throw new AppError({
    //                 httpCode: StatusCodes.BAD_REQUEST,
    //                 description: 'Failure adding devices'
    //             });
    //         }

    //     }
    // }

    // POST write event resource impact function, dynamic pool call for update and delete values, dynamic event+resource id 
    public async update_eventresourceimpact(event_id: number, resourceimpact: EventResourceUpdateBody[]): Promise<void> {
        // let dynamic_update: string = `UPDATE event_resource_impact
        //                               SET resource_change = ?
        //                               WHERE second_index = ? AND event_id = ? AND resource_id = ?;`;
        // // [resourceimpact[i].resource_change, resourceimpact[i].second_index, resourceimpact[i].event_id, resourceimpact[i].resource_id]
        let dynamic_update: string = `INSERT IGNORE INTO event_resource_impact 
                                    (resource_change, second_index, event_id, resource_id) 
                                    VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE resource_change = ?;`;
        // [resourceimpact[i].resource_change, resourceimpact[i].second_index, resourceimpact[i].event_id, resourceimpact[i].resource_id, resourceimpact[i].resource_change]

        // IF resource_change = 0
        let dynamic_delete: string = `DELETE FROM event_resource_impact
                                      WHERE event_id = ? AND resource_id = ? AND second_index = ?;`;
        // [resourceimpact[i].event_id, resourceimpact[i].resource_id, resourceimpact[i].second_index]

        let event_id_value: number = event_id;
        for (const resource of resourceimpact) {
            const resource_id: number = resource.resource_id;
            for (const row of resource.row_packet) {
                if (row.resource_change == 0) {
                    try {
                        await this.promisePool.execute(
                            dynamic_delete,
                            [event_id_value, resource_id, row.second_index]
                        );
                    } catch (error) {
                        console.error(error);
                        throw new AppError({
                            httpCode: StatusCodes.BAD_REQUEST,
                            description: 'Failure deleting event resource impact'
                        });
                    }
                } else {
                    try {
                        await this.promisePool.execute(
                            dynamic_update,
                            [row.resource_change, row.second_index, event_id_value, resource_id, row.resource_change]
                        );
                    } catch (error) {
                        console.error(error);
                        throw new AppError({
                            httpCode: StatusCodes.BAD_REQUEST,
                            description: 'Failure updating event resource impact'
                        });
                    }
                }
            }
        }
    }

    // POST write new event AND/OR
    // update event row ; primary key (id) 
    // TODO update for logic of self-assigned unique key, validate or seperate out new/duplicate entries, or split functions
    public async post_event(event: MissionEvent[]): Promise<void> {
        let post_event: string = `INSERT IGNORE INTO event 
                                    (name, type, duration_seconds) 
                                    VALUES (?, ?, ?);`;
        // post no id
        // []
        try {
            await this.promisePool.execute(
                post_event,
                [event[0].event_name, event[0].event_type, event[0].event_duration]
            );
        } catch (error) {
            console.error(error);
            throw new AppError({
                httpCode: StatusCodes.BAD_REQUEST,
                description: 'Failure updating event resource impact'
            });
        }
    }


    // delete event row ; primary key (id) // call resource delete as well for cascade association ?


    // POST write new resource

    // update resource row ; primary key (id) 

    // delete resource row ; primary key (id) // call from event delete as well for cascade association ?


    // // // /// 
    // get list of unique device keys given empty query return for given struc type
    // keytype: dtype is the typeid of the device (refer to jsondef.h), and dname is the name of the device type
    // queryObj: The query submitted by the frontend, used to filter results
    // "device": ["node_name", "type", "cidx", "didx", "name"],
    // "device_type": ["name", "id"],
    public async get_device_keys(keytype: KeyType, queryObj: QueryObject): Promise<cosmosresponse> {
        try {
            const node_filter = queryObj.filters.find((v) => v.filterType === 'node' && v.compareType === 'equals');
            const sql_query =
                `SELECT
node_name,
didx,
name
FROM device
WHERE\n`
                + (node_filter !== undefined ? `node_name = ? AND\n` : '')
                + `type = ? limit 1000`;
            const query_arg_array = [
                node_filter?.filterValue,
                keytype.dtype,
            ].filter((v) => v !== undefined);
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                sql_query,
                query_arg_array,
            );
            // console.log(rows[0])
            const ret = {[keytype.dname]: rows};
            // console.log("device return: ", ret);
            return ret;
        }
        catch (error) {
            console.error('Error in get_device_keys:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }
    // // // /// 

    public async get_nodes(): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT
*
FROM node
limit 1000`,
            );
            // console.log(rows[0])
            const ret = {nodes: rows};
            // console.log("device return: ", ret);
            return ret;
        }
        catch (error) {
            console.error('Error in get_nodes:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    // // // /// 
    // get list of unique device keys given empty query return for given struc type
    // "device": ["node_name", "type", "cidx", "didx", "name"],
    // "device_type": ["name", "id"],
    public async get_event_resource_impact(keytype: KeyType): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT
                event_id,
                resource_id,
                second_index,
                resource_change
FROM event_resource_impact
WHERE
event_id = ? limit 1000`,
                [keytype.dtype],
            );
            // console.log(rows[0])
            const dname: string = keytype.dname;
            const ret = {dname: rows};
            return ret;
        }
        catch (error) {
            console.error('Error in get_event_resource:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }
    // // // /// 

    // TODO: fix return type and table
    public async get_attitude(query: QueryType): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT
utc AS "time",
s_x AS qsx,
s_y AS qsy,
s_z AS qsz,
s_w AS qsw
FROM attstruc_icrf
WHERE utc BETWEEN ? and ? ORDER BY Time limit 1000`,
                [query.from, query.to],
            );
            const [vrows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT
utc AS "time",
omega_x AS qvx,
omega_y AS qvy,
omega_z AS qvz
FROM attstruc_icrf
WHERE utc BETWEEN ? and ? ORDER BY Time limit 1000`,
                [query.from, query.to],
            );
            const [arows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT
utc AS "time",
alpha_x AS qax,
alpha_y AS qay,
alpha_z AS qaz
FROM attstruc_icrf
WHERE utc BETWEEN ? and ? ORDER BY Time limit 1000`,
                [query.from, query.to],
            );
            const ret = {"avectors": attitude(rows), "qvatts": vrows, "qaatts": arows};
            return ret;
        }
        catch (error) {
            console.error('Error in get_attitude:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }
    // old sql table .... still used though depreciated
    public async get_event(query: QueryType): Promise<cosmosresponse> {
        try {
            const queryObj: QueryObject = JSON.parse(query.query);
            const node_filter = queryObj.filters.find((v) => v.filterType === 'node' && v.compareType === 'equals');
            const sql_query =
                `SELECT 
utc AS "time",
node_name,
duration,
event_id,
type,
event_name
FROM cosmos_event
WHERE\n`
                + (node_filter !== undefined ? `node_name = ? AND\n` : '')
                + `utc BETWEEN ? and ? ORDER BY time limit 1000`;
            const query_arg_array = [
                node_filter?.filterValue,
                query.from,
                query.to
            ].filter((v) => v !== undefined);
            console.log('sql_query:', sql_query);
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                sql_query,
                query_arg_array,
            );
            console.log('get_event rows', rows[0])
            const ret = {"events": rows};
            return ret;
        }
        catch (error) {
            console.error('Error in get_event:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    // no time range applicable ? timerange: TimeRange
    public async get_event_list(): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT 
id,
name as "event_name",
type as "event_type",
duration_seconds
FROM event
ORDER BY id limit 1000;`
            );
            console.log(rows[0])
            const ret = {"events": rows};
            return ret;
        }
        catch (error) {
            console.error('Error in get_event_list:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    public async get_resource_list(): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT 
id,
name as "resource_name",
type as "resource_type"
FROM resource
ORDER BY resource_name limit 1000;`
            );
            console.log(rows[0])
            const ret = {"resources": rows};
            return ret;
        }
        catch (error) {
            console.error('Error in get_resource_list:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    public async get_event_resource_list(eventid: number): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT DISTINCT
id as "resource_id",
name as "resource_name",
type as "resource_type"
FROM resource
INNER JOIN event_resource_impact ON resource.id = event_resource_impact.resource_id
WHERE
event_resource_impact.event_id = ? 
ORDER BY resource_name limit 1000;`,
                [eventid],
            );
            console.log(rows[0])
            const ret = {"event_resources": rows};
            return ret;
        }
        catch (error) {
            console.error('Error in get_resource_list:', error);
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
    // ['ONLY_FULL_GROUP_BY','STRICT_TRANS_TABLES','NO_ZERO_IN_DATE','NO_ZERO_DATE','ERROR_FOR_DIVISION_BY_ZERO','NO_ENGINE_SUBSTITUTION'];
    // remove the specified config with:
    // SET GLOBAL sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));
    // SET GLOBAL sql_mode=(SELECT REPLACE(@@sql_mode,'STRICT_TRANS_TABLES','ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'));


    // this needs a fix... sql seems to update and revert back to only full group by on restart... TODO
    // TODO remove depreciated; this is now integrated into each function with query 2.0
    public async get_now(query: QueryType): Promise<cosmosresponse> {
        let query_statement: string = "";
        try {
            // parse the internal query from the request packet
            const queryObj: QueryObject = JSON.parse(query.query);
            // translate the query type into the database table name
            let databasetable: string = "";
            for (const [key, value] of Object.entries(sqlquerytranslate)) {
                if (queryObj.type === key) {
                    databasetable = value;
                }
            }
            // map through SQLmap JSON of COSMOS tables and columns 
            for (const [key, value] of Object.entries(sqlmap)) {
                // console.log(`${key}: ${value}`);
                // argument here is the DB table name exact; see sqlmap in BaseDatabase for reference
                if (key === databasetable) {
                    let dynamic_query: string = 'SELECT ';
                    let table: string = ' FROM ' + key;
                    let condition: string = ' WHERE utc = (select max(utc) from ' + key + ')';
                    // refactor to avoid gross aggregation in sql
                    let mtime: string = '';
                    for (let i = 0; i < value.length; i++) {
                        if (value[i] === "utc") {
                            // mtime = 'MAX(utc) as "latest_timestamp"';
                            mtime = 'utc as "latest_timestamp"';
                        }
                        else {
                            dynamic_query += value[i] + ", ";
                        }
                    }
                    // define unique key pairing when excludes utc, which is part of primary key... 
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
                    // query_statement = dynamic_query.concat(mtime, table, query_group, condition);
                    //updated temp patch of query; excludes group by, should return unique node:didx pairing for max(utc) as array of rows with data columns
                    query_statement = dynamic_query.concat(mtime, table, condition);
                    console.log("query max(utc) statement construct: ", query_statement);
                }
            }
        } catch (error) {
            console.error(error);
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
            // console.log(rows[0])
            const ret = {table: rows};
            return ret;
        }
        catch (error) {
            console.error('Error in get_now:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    // LocType adds output type option variable to the function inputs // , type: string
    // rename get_locstruc, and pass position and attitude endpoints to this function
    public async get_position(query: QueryType): Promise<cosmosresponse> {
        try {
            const queryObj: QueryObject = JSON.parse(query.query);
            const node_filter = queryObj.filters.find((v) => v.filterType === 'node' && v.compareType === 'equals');
            console.log("node filter: ", node_filter);

            let rows: mysql.RowDataPacket[];
            // filter for latestOnly
            if (queryObj.latestOnly) {
                console.log("Latest Only");
                [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
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
WHERE locstruc.utc = (select max(locstruc.utc) from locstruc) \n`
                    + (node_filter !== undefined ? ` AND locstruc.node_name = ? \n` : '')
                    + ` ORDER BY time limit 10000;`,
                    [node_filter?.filterValue].filter((v) => v !== undefined),
                );
            } else {
                [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
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
WHERE `
                    + (node_filter !== undefined ? ` locstruc.node_name = ? AND \n` : '')
                    + ` locstruc.utc BETWEEN ? and ? ORDER BY time limit 10000;`,
                    [node_filter?.filterValue, query.from, query.to].filter((v) => v !== undefined),
                );
            }
            console.log(rows[0])
            // let rows_undef: boolean = false;
            if (rows.length === 0) {
                console.log("empty rows");
                // rows_undef = true;
                // logic for returning list of nodes in given type on empty row return
                const key_array = await this.get_nodes();
                // console.log("key_array: ", key_array);
                const locrows: Array<locstruc_table> = [];
                for (const [qkey, qvalue] of Object.entries(key_array)) {
                    // console.log("qkey, qvalue: ", qkey, " ", qvalue);
                    if (qkey === 'nodes') {
                        for (let i = 0; i < qvalue.length; i++) {
                            // console.log("qvalue[i]: ", qvalue[i]);
                            const locstruc: locstruc_table = {
                                node_name: qvalue[i].node_name,
                                utc: query.to,
                                eci_s_x: 0,
                                eci_s_y: 0,
                                eci_s_z: 0,
                                eci_v_x: 0,
                                eci_v_y: 0,
                                eci_v_z: 0,
                                icrf_s_x: 0,
                                icrf_s_y: 0,
                                icrf_s_z: 0,
                                icrf_s_w: 0,
                                icrf_v_x: 0,
                                icrf_v_y: 0,
                                icrf_v_z: 0,
                            }
                            locrows.push({...locstruc});
                        }
                    }
                }
                const ret = {"ecis": locrows};
                // console.log("compiled mock batt return: ", ret);
                return ret;
                // end of logic for returning list of nodes on empty row return
            }
            // else statement here for case where time range is valid and rows have data in return TODO
            // else {}
            let type = queryObj.arg;
            if (type == "eci") {
                const ret = {"ecis": eci_position(rows)};
                return ret;
            } else if (type == "geod") {
                const ret = {"geoidposs": geod_position(rows)};
                return ret;
            } else if (type == "geos") {
                const ret = {"spherposs": geos_position(rows)};
                return ret;
            } else if (type == "lvlh") {
                const ret = {"qatts": lvlh_attitude(rows)};
                return ret;
            } else if (type == "icrf") {
                const ret = {"adcsstrucs": icrf_att(rows)};
                return ret;
            } else if (type == "geoc") {
                const ret = {"geocadcsstrucs": icrf_geoc_att(rows)};
                return ret;
            } else if (type == "eul_lvlh") {
                // update return combined Euler Angle from return of LVLH conversion quatt... call both in new custom formula
                // ... to single array of aatstruc type, s v a of avectors... 
                const ret = {"lvlhadcsstrucs": icrf_lvlh_att(rows)};
                return ret;
            } else if (type == "orbit") {
                const ret = {"orbits": orbit_position(rows)};
                return ret;
            } else if (type == "att_total") {
                const ret = {"atttotals": icrf_att_total(rows)};
                return ret;
            }
            const ret = {"ecis": eci_position(rows)};
            // switch statement here also to parse type option passed in from request
            // passing the type for the list of sub-structures { geoidpos ... }
            return ret;
        }
        catch (error) {
            console.error('Error in get_position:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    // Returns relative angle ranges from an origin node to other nodes
    public async get_relative_angle_range(query: QueryType): Promise<cosmosresponse> {
        try {
            const queryObj: QueryObject = JSON.parse(query.query);
            // queryObj.arg to contain name of the origin node
            const originNodeName = queryObj.arg;
            // Sorts by time, and within time, sorts the desired node_name to be first
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
WHERE locstruc.utc BETWEEN ? and ?
AND (node.node_type = 0 OR node.node_type = 1)
ORDER BY time, FIELD(locstruc.node_name, ?) DESC
LIMIT 10000`,
                [query.from, query.to, queryObj.arg],
            );
            console.log(rows[0])
            if (rows.length === 0) {
                console.log("empty rows");
            }
            const originNodeRows = rows.filter((row) => row.node_name === queryObj.arg);
            const ret = {
                "svectors": relative_angle_range(rows, queryObj.arg),
                "avectors": attitude(originNodeRows),
                "geoidposs": geod_position(rows)
            };
            return ret;
        }
        catch (error) {
            console.error('Error in get_relative_angle_range:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    public async get_target(query: QueryType): Promise<cosmosresponse> {
        try {
            const queryObj: QueryObject = JSON.parse(query.query);
            const node_filter = queryObj.filters.find((v) => v.filterType === 'node' && v.compareType === 'equals');
            console.log("node filter: ", node_filter);

            let rows: mysql.RowDataPacket[];
            [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT
name,
type,
lat, lon, h,
area
FROM target`,
            );
            const ret = {"targets": rows};
            // switch statement here also to parse type option passed in from request
            // passing the type for the list of sub-structures { geoidpos ... }
            return ret;
        }
        catch (error) {
            console.error('Error in get_position:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    public async get_battery(query: QueryType): Promise<cosmosresponse> {
        try {
            const queryObj: QueryObject = JSON.parse(query.query);
            const node_filter = queryObj.filters.find((v) => v.filterType === 'node' && v.compareType === 'equals');
            const sql_query =
                `SELECT
  devspec.utc AS "time",
  devspec.node_name as "node_name",
  device.name as "name",
  devspec.amp,
  devspec.volt,
  devspec.power,
  devspec.temp,
  devspec.percentage
FROM battstruc AS devspec
INNER JOIN device ON devspec.didx = device.didx
WHERE
device.type = 12 AND\n`
                + (node_filter !== undefined ? `devspec.node_name = ? AND\n` : '')
                + `devspec.utc BETWEEN ? and ? ORDER BY time limit 1000`;
            const query_arg_array = [
                node_filter?.filterValue,
                query.from,
                query.to
            ].filter((v) => v !== undefined);
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                sql_query,
                query_arg_array,
            );
            if (rows.length === 0) {
                // console.log("empty rows");
                const key_array = await this.get_device_keys({dtype: 12, dname: "batts"}, queryObj);
                // console.log("key_array: ", key_array);
                const battrows: Array<devicebatt & Partial<device_table> & timepoint> = [];
                for (const [_, qvalue] of Object.entries(key_array)) {
                    for (let i = 0; i < qvalue.length; i++) {
                        // console.log("qvalue[i]: ", qvalue[i]);
                        const devbatt: devicebatt = {
                            node_name: qvalue[i].node_name,
                            // extract out device name
                            didx: qvalue[i].didx,
                            utc: query.from,
                            volt: 0,
                            amp: 0,
                            power: 0,
                            temp: 0,
                            percentage: 0
                        }
                        battrows.push({name: qvalue[i].name, Time: query.from, ...devbatt});
                    }
                }
                const ret = {"batts": battrows};
                console.log('get_battery rows', battrows[0])
                return ret;
            } else {
                const ret = {"batts": rows};
                console.log('get_battery rows', rows[0])
                return ret;
            }
        }
        catch (error) {
            console.error('Error in get_battery:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    public async get_bcreg(query: QueryType): Promise<cosmosresponse> {
        try {
            const queryObj: QueryObject = JSON.parse(query.query);
            const node_filter = queryObj.filters.find((v) => v.filterType === 'node' && v.compareType === 'equals');
            const sql_query =
                `SELECT
devspec.utc AS "time",
devspec.node_name as "node_name",
device.name as "name",
devspec.volt,
devspec.amp,
devspec.power, devspec.temp,
devspec.mpptin_amp, devspec.mpptin_volt,
devspec.mpptout_amp, devspec.mpptout_volt
FROM bcregstruc AS devspec
INNER JOIN device ON devspec.didx = device.didx
WHERE
device.type = 30 AND\n`
                + (node_filter !== undefined ? `devspec.node_name = ? AND\n` : '')
                + `devspec.utc BETWEEN ? and ? ORDER BY time limit 1000`;
            const query_arg_array = [
                node_filter?.filterValue,
                query.from,
                query.to
            ].filter((v) => v !== undefined);
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                sql_query,
                query_arg_array,
            );
            //
            if (rows.length === 0) {
                // console.log("empty rows");
                const key_array = await this.get_device_keys({dtype: 30, dname: "bcreg"}, queryObj);
                // console.log("key_array: ", key_array);
                const bcregrows: Array<devicebcreg & Partial<device_table> & timepoint> = [];
                for (const [_, qvalue] of Object.entries(key_array)) {
                    for (let i = 0; i < qvalue.length; i++) {
                        const devbcreg: devicebcreg = {
                            node_name: qvalue[i].node_name,
                            didx: qvalue[i].didx,
                            utc: query.from,
                            volt: 0,
                            amp: 0,
                            power: 0,
                            temp: 0,
                            mpptin_amp: 0,
                            mpptin_volt: 0,
                            mpptout_amp: 0,
                            mpptout_volt: 0,
                        }
                        bcregrows.push({name: qvalue[i].name, Time: query.from, ...devbcreg});
                    }
                }
                console.log('get_bcreg bcregrows', bcregrows[0])
                const ret = {"bcregs": bcregrows};
                return ret;
            } else {
                console.log('get_bcreg rows', rows[0])
                const ret = {"bcregs": rows};
                return ret;
            }
            // const ret = { "bcregs": rows };
            // return ret;
        }
        catch (error) {
            console.error('Error in get_bcreg:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    public async get_tsen(query: QueryType): Promise<cosmosresponse> {
        try {
            const queryObj: QueryObject = JSON.parse(query.query);
            const node_filter = queryObj.filters.find((v) => v.filterType === 'node' && v.compareType === 'equals');
            const sql_query =
                `SELECT
  devspec.utc AS "time",
  devspec.node_name as "node_name",
  device.name as "name",
  temp
FROM tsenstruc AS devspec
INNER JOIN device ON devspec.didx = device.didx
WHERE
device.type = 15 AND\n`
                + (node_filter !== undefined ? `devspec.node_name = ? AND\n` : '')
                + `devspec.utc BETWEEN ? and ? ORDER BY time limit 1000`;
            const query_arg_array = [
                node_filter?.filterValue,
                query.from,
                query.to
            ].filter((v) => v !== undefined);
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                sql_query,
                query_arg_array,
            );
            if (rows.length === 0) {
                const key_array = await this.get_device_keys({dtype: 15, dname: "tsen"}, queryObj);
                const tsenrows: Array<devicetsen & Partial<device_table> & timepoint> = [];
                for (const [_, qvalue] of Object.entries(key_array)) {
                    for (let i = 0; i < qvalue.length; i++) {
                        const devtsen: devicetsen = {
                            node_name: qvalue[i].node_name,
                            didx: qvalue[i].didx,
                            utc: query.from,
                            temp: 0,
                        }
                        tsenrows.push({name: qvalue[i].name, Time: query.from, ...devtsen});
                    }
                }
                const ret = {"tsens": tsenrows};
                console.log('get_tsen rows', tsenrows[0])
                return ret;
            } else {
                const ret = {"tsens": rows};
                console.log('get_tsen rows', rows[0])
                return ret;
            }
        }
        catch (error) {
            console.error('Error in get_tsen:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    public async get_cpu(query: QueryType): Promise<cosmosresponse> {
        try {
            const queryObj: QueryObject = JSON.parse(query.query);
            const node_filter = queryObj.filters.find((v) => v.filterType === 'node' && v.compareType === 'equals');
            const sql_query =
                `SELECT
  devspec.utc AS "time",
  devspec.node_name as "node_name",
  device.name as "name",
  temp,
  uptime,
  \`load\`,
  gib,
  boot_count,
  storage
FROM cpustruc AS devspec
INNER JOIN device ON devspec.didx = device.didx
WHERE
device.type = 5 AND\n`
                + (node_filter !== undefined ? `devspec.node_name = ? AND\n` : '')
                + `devspec.utc BETWEEN ? and ? ORDER BY time limit 1000`;
            const query_arg_array = [
                node_filter?.filterValue,
                query.from,
                query.to
            ].filter((v) => v !== undefined);
            // console.log('sql_query:', sql_query);
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                sql_query,
                query_arg_array,
            );
            if (rows.length === 0) {
                const key_array = await this.get_device_keys({dtype: 5, dname: "cpu"}, queryObj)
                const cpurows: Array<devicecpu & Partial<device_table> & timepoint> = [];
                for (const [_, qvalue] of Object.entries(key_array)) {
                    for (let i = 0; i < qvalue.length; i++) {
                        const devcpu: devicecpu = {
                            node_name: qvalue[i].node_name,
                            didx: qvalue[i].didx,
                            utc: query.from,
                            temp: 0,
                            uptime: 0,
                            load: 0,
                            gib: 0,
                            boot_count: 0,
                            storage: 0,
                        }
                        cpurows.push({name: qvalue[i].name, Time: query.from, ...devcpu});
                    }
                }
                const ret = {"cpus": cpurows};
                console.log('get_cpu rows', cpurows[0])
                return ret;
            } else {
                const ret = {"cpus": rows};
                console.log('get_cpu rows', rows[0])
                return ret;
            }
            // const ret = { "cpus": rows };
            // return ret;
        }
        catch (error) {
            console.error('Error in get_cpu:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }


    public async get_mag(query: QueryType): Promise<cosmosresponse> {
        try {
            const queryObj: QueryObject = JSON.parse(query.query);
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
                [query.from, query.to],
            );
            console.log(rows[0])
            if (rows.length === 0) {
                const key_array = await this.get_device_keys({dtype: 32, dname: "mag"}, queryObj);
                const magrows: Array<devicemag & Partial<device_table> & timepoint> = [];
                for (const [qkey, qvalue] of Object.entries(key_array)) {
                    for (let i = 0; i < qvalue.length; i++) {
                        const devmag: devicemag = {
                            node_device: qvalue[i].node_name + ":" + qvalue[i].name,
                            didx: qvalue[i].didx,
                            utc: query.to,
                            mag_x: 0,
                            mag_y: 0,
                            mag_z: 0,
                        }
                        magrows.push({name: qvalue[i].name, Time: query.from, ...devmag});
                    }
                }
                const ret = {"mags": magrows};
                return ret;
            } else {
                const ret = {"mags": rows};
                return ret;
            }
            // const ret = { "mags": rows };
            // return ret;
        }
        catch (error) {
            console.error('Error in get_mag:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    public async get_gyro(query: QueryType): Promise<cosmosresponse> {
        try {
            const queryObj: QueryObject = JSON.parse(query.query);
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT 
utc AS "time",
node_name,
didx,
omega
FROM gyrostruc
WHERE utc BETWEEN ? and ? ORDER BY time limit 1000;`,
                [query.from, query.to],
            );
            console.log(rows[0])
            if (rows.length === 0) {
                const key_array = await this.get_device_keys({dtype: 31, dname: "gyro"}, queryObj);
                const gyrorows: Array<devicegyro & Partial<device_table> & timepoint> = [];
                for (const [qkey, qvalue] of Object.entries(key_array)) {
                    for (let i = 0; i < qvalue.length; i++) {
                        const devgyro: devicegyro = {
                            node_device: qvalue[i].node_name + ":" + qvalue[i].name,
                            didx: qvalue[i].didx,
                            time: query.to,
                            omega: 0,
                        }
                        gyrorows.push({name: qvalue[i].name, Time: query.from, ...devgyro});
                    }
                }
                const ret = {"gyros": gyrorows};
                return ret;
            } else {
                const ret = {"gyros": rows};
                return ret;
            }
        }
        catch (error) {
            console.error('Error in get_gyro:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    // MTR is type 4
    public async get_mtr(query: QueryType): Promise<cosmosresponse> {
        try {
            const queryObj: QueryObject = JSON.parse(query.query);
            const node_filter = queryObj.filters.find((v) => v.filterType === 'node' && v.compareType === 'equals');
            const sql_query =
                `SELECT
  devspec.utc AS "time",
  devspec.node_name as "node_name",
  device.name as "name",
  device.didx as "didx",
  devalignstruc.align_w as "align_w",
  devalignstruc.align_x as "align_x",
  devalignstruc.align_y as "align_y",
  devalignstruc.align_z as "align_z",
  locstruc.eci_s_x as "eci_s_x",
  locstruc.eci_s_y as "eci_s_y", 
  locstruc.eci_s_z as "eci_s_z",
  locstruc.eci_v_x as "eci_v_x", 
  locstruc.eci_v_y as "eci_v_y", 
  locstruc.eci_v_z as "eci_v_z",
  locstruc.icrf_s_x as "icrf_s_x", 
  locstruc.icrf_s_y as "icrf_s_y", 
  locstruc.icrf_s_z as "icrf_s_z", 
  locstruc.icrf_s_w as "icrf_s_w", 
  locstruc.icrf_v_x as "icrf_v_x", 
  locstruc.icrf_v_y as "icrf_v_y", 
  locstruc.icrf_v_z as "icrf_v_z",
  mom,
  amp
FROM mtrstruc AS devspec
INNER JOIN locstruc ON devspec.node_name = locstruc.node_name
AND devspec.utc = locstruc.utc
INNER JOIN devalignstruc ON devspec.didx = devalignstruc.didx
AND devalignstruc.type = 4 \n`
                + (node_filter !== undefined ? ` AND devalignstruc.node_name = ? \n` : '')
                + `INNER JOIN device ON devspec.node_name = device.node_name AND devspec.didx = device.didx AND device.type = 4 \n`
                + (node_filter !== undefined ? ` AND devspec.node_name = ? \n` : '')
                + ` AND devspec.utc BETWEEN ? and ? ORDER BY time limit 1000`;
            const query_arg_array = [
                node_filter?.filterValue,
                node_filter?.filterValue,
                query.from,
                query.to
            ].filter((v) => v !== undefined);
            // console.log('sql_query:', sql_query);
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                sql_query,
                query_arg_array,
            );

            if (rows.length === 0) {
                const key_array = await this.get_device_keys({dtype: 4, dname: "mtr"}, queryObj);
                const mtrrows: Array<GF_mtr_torque & GFDeviceType & timepoint> = [];
                for (const [qkey, qvalue] of Object.entries(key_array)) {
                    for (let i = 0; i < qvalue.length; i++) {
                        const devmtr: GF_mtr_torque = {
                            // node_device: qvalue[i].node_name + ":" + qvalue[i].name,
                            // node_name: qvalue[i].node_name,
                            // didx: qvalue[i].didx,
                            time: query.to,
                            // mom: 0,
                            amp: 0,
                            torq: 0
                            // align_w: 0,
                            // align_x: 0,
                            // align_y: 0,
                            // align_z: 0,
                        }
                        mtrrows.push({Time: query.from, Node_name: qvalue[i].node_name, Device_name: qvalue[i].name, didx: qvalue[i].didx, ...devmtr});
                    }
                }
                const ret = {"mtrs": mtrrows};
                return ret;
            } else {
                // parse torque value from COSMOS functions
                const ret = {"mtrs": mtr_torque(rows)};
                // const ret = {"mtrs": (rows)};
                return ret;
            }
        }
        catch (error) {
            console.error('Error in get_mtr:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    // RW is type 3
    public async get_rw(query: QueryType): Promise<cosmosresponse> {
        try {
            const queryObj: QueryObject = JSON.parse(query.query);
            const node_filter = queryObj.filters.find((v) => v.filterType === 'node' && v.compareType === 'equals');
            const sql_query =
                `SELECT
  devspec.utc AS "time",
  devspec.node_name as "node_name",
  device.name as "name",
  device.didx as "didx",
  devalignstruc.align_w as "align_w",
  devalignstruc.align_x as "align_x",
  devalignstruc.align_y as "align_y",
  devalignstruc.align_z as "align_z",
  locstruc.eci_s_x as "eci_s_x",
  locstruc.eci_s_y as "eci_s_y", 
  locstruc.eci_s_z as "eci_s_z",
  locstruc.eci_v_x as "eci_v_x", 
  locstruc.eci_v_y as "eci_v_y", 
  locstruc.eci_v_z as "eci_v_z",
  locstruc.icrf_s_x as "icrf_s_x", 
  locstruc.icrf_s_y as "icrf_s_y", 
  locstruc.icrf_s_z as "icrf_s_z", 
  locstruc.icrf_s_w as "icrf_s_w", 
  locstruc.icrf_v_x as "icrf_v_x", 
  locstruc.icrf_v_y as "icrf_v_y", 
  locstruc.icrf_v_z as "icrf_v_z",
  omg,
  romg,
  amp
FROM rwstruc AS devspec
INNER JOIN locstruc ON devspec.node_name = locstruc.node_name
AND devspec.utc = locstruc.utc
INNER JOIN devalignstruc ON devspec.didx = devalignstruc.didx
AND devalignstruc.type = 3 \n`
                + (node_filter !== undefined ? ` AND devalignstruc.node_name = ? \n` : '')
                + `INNER JOIN device ON devspec.node_name = device.node_name AND devspec.didx = device.didx AND device.type = 3 \n`
                + (node_filter !== undefined ? ` AND device.node_name = ? \n` : '')
                + ` AND devspec.utc BETWEEN ? and ? ORDER BY time limit 1000`;
            const query_arg_array = [
                node_filter?.filterValue,
                node_filter?.filterValue,
                query.from,
                query.to
            ].filter((v) => v !== undefined);
            // console.log('sql_query:', sql_query);
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                sql_query,
                query_arg_array,
            );

            console.log(rows[0])
            if (rows.length === 0) {
                const key_array = await this.get_device_keys({dtype: 3, dname: "rw"}, queryObj);
                const rwrows: Array<GF_rw_torque & GFDeviceType & timepoint> = [];
                for (const [qkey, qvalue] of Object.entries(key_array)) {
                    for (let i = 0; i < qvalue.length; i++) {
                        const devrw: GF_rw_torque = {
                            // node_device: qvalue[i].node_name + ":" + qvalue[i].name,
                            // node_name: qvalue[i].node_name,
                            // didx: qvalue[i].didx,
                            time: query.to,
                            // amp: 0,
                            omg: 0,
                            torq: 0,
                            // romg: 0,
                            // align_w: 0,
                            // align_x: 0,
                            // align_y: 0,
                            // align_z: 0,
                        }
                        rwrows.push({Time: query.from, Node_name: qvalue[i].node_name, Device_name: qvalue[i].name, didx: qvalue[i].didx, ...devrw});
                    }
                }
                const ret = {"rws": rwrows};
                return ret;
            } else {
                // parse torque value from COSMOS functions
                const ret = {"rws": rw_torque(rows)};
                // const ret = {"rws": (rows)};
                return ret;
            }
        }
        catch (error) {
            console.error('Error in get_rw:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    public async get_imu(query: QueryType): Promise<cosmosresponse> {
        try {
            const queryObj: QueryObject = JSON.parse(query.query);
            const node_filter = queryObj.filters.find((v) => v.filterType === 'node' && v.compareType === 'equals');
            const sql_query =
                `SELECT
  devspec.utc AS "time",
  devspec.node_name as "node_name",
  device.name as "Device_name",
  device.didx as "didx",
  theta_x,
theta_y,
theta_z,
theta_w,
omega_x,
omega_y,
omega_z,
mag_x,
mag_y,
mag_z
FROM imustruc AS devspec
INNER JOIN device ON devspec.didx = device.didx
WHERE
device.type = 2 AND\n`
                + (node_filter !== undefined ? `devspec.node_name = ? AND\n` : '')
                + `devspec.utc BETWEEN ? and ? ORDER BY time limit 1000`;
            const query_arg_array = [
                node_filter?.filterValue,
                query.from,
                query.to
            ].filter((v) => v !== undefined);
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                sql_query,
                query_arg_array,
            );
            if (rows.length === 0) {
                const key_array = await this.get_device_keys({dtype: 2, dname: "imu"}, queryObj);
                const imurows: Array<Partial<deviceimu> & GFDeviceType & timepoint> = [];
                for (const [_, qvalue] of Object.entries(key_array)) {
                    for (let i = 0; i < qvalue.length; i++) {
                        const devimu: deviceimu = {
                            node_name: qvalue[i].node_name,
                            didx: qvalue[i].didx,
                            utc: query.from,
                            theta_x: 0,
                            theta_y: 0,
                            theta_z: 0,
                            theta_w: 0,
                            omega_x: 0,
                            omega_y: 0,
                            omega_z: 0,
                            mag_x: 0,
                            mag_y: 0,
                            mag_z: 0,
                        }
                        imurows.push({Time: query.from, Node_name: qvalue[i].node_name, Device_name: qvalue[i].Device_name, ...devimu});
                    }
                }
                const ret = {"imus": imurows};
                console.log('get_imu rows', imurows[0])
                return ret;
            } else {
                const ret = {"imus": rows};
                console.log('get_imu rows', rows[0])
                return ret;
            }
        }
        catch (error) {
            console.error('Error in get_imu:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    public async get_ssen(query: QueryType): Promise<cosmosresponse> {
        try {
            const queryObj: QueryObject = JSON.parse(query.query);
            const node_filter = queryObj.filters.find((v) => v.filterType === 'node' && v.compareType === 'equals');
            const sql_query =
                `SELECT
  devspec.utc AS "time",
  devspec.node_name as "node_name",
  device.name as "Device_name",
  qva,
qvb,
qvc,
qvd,
azi,
elev
FROM ssenstruc AS devspec
INNER JOIN device ON devspec.didx = device.didx
WHERE
device.type = 1 AND\n`
                + (node_filter !== undefined ? `devspec.node_name = ? AND\n` : '')
                + `devspec.utc BETWEEN ? and ? ORDER BY time limit 1000`;
            const query_arg_array = [
                node_filter?.filterValue,
                query.from,
                query.to
            ].filter((v) => v !== undefined);
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                sql_query,
                query_arg_array,
            );
            if (rows.length === 0) {
                const key_array = await this.get_device_keys({dtype: 1, dname: "ssen"}, queryObj);
                const ssenrows: Array<Partial<devicessen> & GFDeviceType & timepoint> = [];
                for (const [_, qvalue] of Object.entries(key_array)) {
                    for (let i = 0; i < qvalue.length; i++) {
                        const devssen: devicessen = {
                            node_name: qvalue[i].node_name,
                            didx: qvalue[i].didx,
                            utc: query.from,
                            qva: 0,
                            qvb: 0,
                            qvc: 0,
                            qvd: 0,
                            azi: 0,
                            elev: 0,
                        }
                        ssenrows.push({Time: query.from, Node_name: qvalue[i].node_name, Device_name: qvalue[i].Device_name, ...devssen});
                    }
                }
                const ret = {"ssens": ssenrows};
                console.log('get_ssen rows', ssenrows[0])
                return ret;
            } else {
                const ret = {"ssens": rows};
                console.log('get_ssen rows', rows[0])
                return ret;
            }
        }
        catch (error) {
            console.error('Error in get_ssen:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    public async get_gps(query: QueryType): Promise<cosmosresponse> {
        try {
            const queryObj: QueryObject = JSON.parse(query.query);
            const node_filter = queryObj.filters.find((v) => v.filterType === 'node' && v.compareType === 'equals');
            const sql_query =
                `SELECT
  devspec.utc AS "time",
  devspec.node_name as "node_name",
  device.name as "Device_name",
  geocs_x,
  geocs_y,
  geocs_z,
geods_lat,
geods_lon,
geods_alt
FROM gpsstruc AS devspec
INNER JOIN device ON devspec.didx = device.didx
WHERE
device.type = 6 AND\n`
                + (node_filter !== undefined ? `devspec.node_name = ? AND\n` : '')
                + `devspec.utc BETWEEN ? and ? ORDER BY time limit 1000`;
            const query_arg_array = [
                node_filter?.filterValue,
                query.from,
                query.to
            ].filter((v) => v !== undefined);
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                sql_query,
                query_arg_array,
            );
            if (rows.length === 0) {
                const key_array = await this.get_device_keys({dtype: 6, dname: "gps"}, queryObj);
                const gpsrows: Array<Partial<devicegps> & GFDeviceType & timepoint> = [];
                for (const [_, qvalue] of Object.entries(key_array)) {
                    for (let i = 0; i < qvalue.length; i++) {
                        const devgps: devicegps = {
                            node_name: qvalue[i].node_name,
                            didx: qvalue[i].didx,
                            utc: query.from,
                            geocs_x: 0,
                            geocs_y: 0,
                            geocs_z: 0,
                            geods_lat: 0,
                            geods_lon: 0,
                            geods_alt: 0,
                        }
                        gpsrows.push({Time: query.from, Node_name: qvalue[i].node_name, Device_name: qvalue[i].Device_name, ...devgps});
                    }
                }
                const ret = {"gpss": gpsrows};
                console.log('get_gps rows', gpsrows[0])
                return ret;
            } else {
                const ret = {"gpss": rows};
                console.log('get_gps rows', rows[0])
                return ret;
            }
        }
        catch (error) {
            console.error('Error in get_gps:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    public async init_tables(): Promise<void> {
        // init table schema for new db
        try {
            for (let i = 0; i < table_schema.length; i++) {
                await this.promisePool.query(table_schema[i].statement);
                console.log("table init for: ", table_schema[i].table);
            }
        } catch (error) {
            console.error(error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Error initiating table'
            });
        }
    }

    // dynamic get dev for 2.0 query type
    // TODO: refactor each query addition by type, i.e. so all WHERE clauses can be concatanated under the single section with appropriate syntax
    //  solution could be to create array of each query part type, then map over each at the end to build the full statement. 
    // TODO: consider join scenarios by endpoint query type, create a map to address each scenario dynamically
    // TODO: need to handle input verification and validation; security and sql injection risks
    // TODO: add 'join' conditions to endpoint keyword translation dictionary
    // TODO: filter select statement columns based on if 'col' filter is utilized
    public async get_dynamic(query: QueryType): Promise<cosmosresponse> {
        try {
            // parse internal query type object string
            const queryObj: QueryObject = JSON.parse(query.query);

            // map over translation from query type to sql table
            let databasetable: string = "locstruc";
            for (const [key, value] of Object.entries(sqlquerytranslate)) {
                if (key === queryObj.type) {
                    databasetable = value;
                }
            }

            // build select sql query string 
            let dynamic_query: string = 'SELECT ';
            let query_time: string = ' ';

            // map through SQLmap JSON of COSMOS tables and columns 
            for (const [key, value] of Object.entries(sqlmap)) {
                // argument here is the DB table name exact; see sqlmap in BaseDatabase for reference
                if (key === databasetable) {
                    for (let i = 0; i < value.length; i++) {
                        if (value[i] === "utc") {
                            // mtime = 'MAX(utc) as "latest_timestamp"';
                            query_time = 'utc as "time"';
                        } else if ((i + 1) == value.length) {
                            dynamic_query += value[i];
                            // table_variables += '?)'
                        }
                        else {
                            dynamic_query += value[i] + ", ";
                        }
                    }
                }
            }
            dynamic_query.concat(query_time);
            console.log("dynamic GET query, select part: ", dynamic_query);

            // define table dynamically 
            let table_query: string = ' FROM ' + databasetable;
            console.log("dynamic GET table: ", table_query);

            // define WHERE conditions, build dynamic array
            let query_filter_string: string = ' WHERE ';
            let query_where_filter_array: Array<string> = [];
            // build string based on query conditions... 
            // query filterType
            if (queryObj.filters[0].filterType) {
                // proceed if the filter list has one or more entries
                console.log("Query filter: ", queryObj.filters);
                // iterate over each filter entry
                for (const filter of queryObj.filters) {
                    let where_query_filter: string = ' ';
                    // check for filter type domain 
                    if (filter.filterType == 'node') {
                        where_query_filter += databasetable + '.node_name ';
                    } else if (filter.filterType == 'name') {
                        where_query_filter += ' name ';
                    }
                    // TODO: refine this query parameter... needs to edit or change the sql column schema map
                    // note this will change what columns are returned, not the WHERE clause
                    // note this will break the grafana datasource return type? or perhaps does not mind missing columns 
                    // else if (filter.filterType == 'col') {
                    // }

                    // now check for operator compare type and define target value
                    if (filter.compareType == 'equals') {
                        where_query_filter += '= ' + '"' + filter.filterValue + '"';
                    } else if (filter.compareType == 'contains') {
                        where_query_filter += 'LIKE ' + '"%' + filter.filterValue + '%"';
                    }
                    query_where_filter_array.push(where_query_filter)
                }
                // console.log("Dynamic GET query, array of WHERE: ", query_where_filter_array);
            }
            // filter for latestOnly
            if (queryObj.latestOnly) {
                console.log("Latest Only true");
                // let condition: string = ' WHERE utc = (select max(utc) from ' + key + ')';
                let latestOnlycondition: string = ' utc = (select max(utc) from ' + databasetable + ')';
                query_where_filter_array.push(latestOnlycondition);
            } else {
                // case for from & to timerange WHERE condition
                //.utc BETWEEN ? and ? 
                //[query.from, query.to]
                let timerange: string = ' utc BETWEEN ' + query.from + ' and ' + query.to + ' ';
                query_where_filter_array.push(timerange);
            }
            console.log("Dynamic GET query, array of WHERE: ", query_where_filter_array);
            for (let i = 0; i < query_where_filter_array.length; i++) {
                if ((i + 1) == query_where_filter_array.length) {
                    query_filter_string += query_where_filter_array[i];
                } else {
                    query_filter_string += query_where_filter_array[i] + " AND ";
                }
            }
            console.log("Dynamic GET query, string statement of WHERE: ", query_filter_string);

            // TODO: refactor how functions are passed and handled in query

            //  build final query string
            let full_get_query_statement: string = "";
            full_get_query_statement = dynamic_query.concat(table_query, query_filter_string, ';');
            console.log("Dynamic GET query, full statement: ", full_get_query_statement);

            // final SQL call
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                full_get_query_statement
            );
            console.log(rows[0])
            // TODO create mapping from table to return code; for now it is the SQL table name
            const dname: string = databasetable;
            type getPacket = {
                [key: string]: mysql.RowDataPacket[]
            }
            const ret: getPacket = {};
            ret[dname] = rows;
            // const ret = { dname: rows };
            // console.log('ret', ret, 'ret1 ', ret1);
            return ret;
        }
        catch (error) {
            console.error('Error in get_dynamic:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    // Logs history of executed agent commands
    public async write_command_history(command: string): Promise<void> {
        try {
            await this.promisePool.execute(
                'INSERT IGNORE INTO command_history (command) VALUES (?)',
                [command]
            );
        } catch (error) {
            console.error(error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Error writing to command_history'
            });
        }
    }

}