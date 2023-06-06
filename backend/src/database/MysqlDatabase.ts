import BaseDatabase, { sqlmap, sqlquerykeymap, Device, TelegrafMetric, deviceswch, devicebatt, devicebcreg, devicetsen, devicecpu, devicemag, devicegyro, devicemtr, devicerw, EventResourceUpdateBody, EventResourceImpact, sqlquerytranslate, locstruc_table } from "database/BaseDatabase";
import mysql from 'mysql2';
import { Pool } from "mysql2/promise";
import { mjd_to_unix } from '../utils/time';
import { AppError } from 'exceptions/AppError';
import { StatusCodes } from 'http-status-codes';
import { attitude, eci_position, geod_position, geos_position, lvlh_attitude, relative_angle_range } from '../transforms/cosmos';
import { TimeRange, cosmosresponse, KeyType } from 'types/cosmos_types';
import { QueryObject, QueryType, QueryFilter } from 'types/query_types';
import { table_schema } from './inittables';


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
                    console.error(err);
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

    public async write_device(devices: Device[]): Promise<void> {
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
                    'INSERT INTO device (node_name, type, cidx, didx, name) VALUES (?,?,?,?,?)',
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
            console.log("parsed row values array: ", row_value_array);

            try {
                await this.promisePool.execute(
                    insert_statement,
                    row_value_array
                );
            } catch (error) {
                console.error(error);
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
            console.error(error);
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
                console.error(error);
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
            console.error(error);
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
                console.error(error);
                throw new AppError({
                    httpCode: StatusCodes.BAD_REQUEST,
                    description: 'Failure adding devices'
                });
            }

        }
    }

    // POST write event resource impact function, dynamic pool call for update and delete values, dynamic event+resource id 
    public async update_eventresourceimpact(event_id: number, resourceimpact: EventResourceUpdateBody[]): Promise<void> {
        let dynamic_update: string = `UPDATE event_resource_impact
                                      SET resource_change = ?
                                      WHERE second_index = ? AND event_id = ? AND resource_id = ?;`;
        // [resourceimpact[i].resource_change, resourceimpact[i].second_index, resourceimpact[i].event_id, resourceimpact[i].resource_id]

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
                            [row.resource_change, row.second_index, event_id_value, resource_id]
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

    // POST write new event

    // update event row ; primary key (id) 

    // delete event row ; primary key (id) // call resource delete as well for cascade association ?


    // POST write new resource

    // update resource row ; primary key (id) 

    // delete resource row ; primary key (id) // call from event delete as well for cascade association ?


    // // // /// 
    // get list of unique device keys given empty query return for given struc type
    // "device": ["node_name", "type", "cidx", "didx", "name"],
    // "device_type": ["name", "id"],
    public async get_device_keys(keytype: KeyType): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT
                node_name,
                didx,
                name
FROM device
WHERE
  type = ? limit 1000`,
                [keytype.dtype],
            );
            // console.log(rows[0])
            const dname: string = keytype.dname;
            const ret = { dname: rows };
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
            const ret = { nodes: rows };
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
            const ret = { dname: rows };
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
            const ret = { "avectors": attitude(rows), "qvatts": vrows, "qaatts": arows };
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

    public async get_event(query: QueryType): Promise<cosmosresponse> {
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
                [query.from, query.to],
            );
            console.log(rows[0])
            const ret = { "events": rows };
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
            const ret = { "events": rows };
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
            const ret = { "resources": rows };
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
id,
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
            const ret = { "event_resources": rows };
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
    //
    // remove the specified config with:
    // SET GLOBAL sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));

    // this needs a fix... sql seems to update and revert back to only full group by on restart... TODO

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
            console.error('Error in get_now:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    // LocType adds output type option variable to the function inputs // , type: string
    public async get_position(query: QueryType): Promise<cosmosresponse> {
        try {
            const queryObj: QueryObject = JSON.parse(query.query);
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
WHERE locstruc.utc = (select max(locstruc.utc) from locstruc) ORDER BY time limit 10000`,
                    [query.from, query.to],
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
WHERE locstruc.utc BETWEEN ? and ? ORDER BY time limit 10000`,
                    [query.from, query.to],
                );
            }
            console.log(rows[0])
            if (rows.length == 0) {
                console.log("empty rows");
                // logic for returning list of nodes in given type on empty row return
                const key_array = await this.get_nodes();
                // console.log("key_array: ", key_array);
                const locrows: Array<locstruc_table> = [];
                for (const [qkey, qvalue] of Object.entries(key_array)) {
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
                        locrows.push({ ...locstruc });
                    }
                }
                // const ret = { "ecis": locrows };
                // console.log("compiled mock batt return: ", ret);
                // return ret;
                // end of logic for returning list of nodes on empty row return
            }
            // else statement here for case where time range is valid and rows have data in return TODO
            // else {}
            let type = queryObj.arg;
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
            if (rows.length == 0) {
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

    public async get_battery(query: QueryType): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT
  utc AS "time",
  CONCAT(devspec.node_name, ':', device.name) as "node:device",
  amp,
  power
FROM battstruc AS devspec
INNER JOIN device ON device.didx = devspec.didx
WHERE
  device.type = 12 AND
devspec.utc BETWEEN ? and ? ORDER BY time limit 1000`,
                [query.from, query.to],
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
                            node_name: qvalue[i].node_name + ":" + qvalue[i].name,
                            // extract out device name
                            didx: qvalue[i].didx,
                            utc: query.to,
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
            console.error('Error in get_battery:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }

    public async get_bcreg(query: QueryType): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT
  devspec.utc AS "time",
  CONCAT(devspec.node_name, ':', device.name) as "node:device",
  volt,
  amp,
  power, temp,
  mpptin_amp, mpptin_volt,
  mpptout_amp, mpptout_volt
FROM bcregstruc AS devspec
INNER JOIN device ON devspec.didx = device.didx
WHERE
  device.type = 30 AND
devspec.utc BETWEEN ? and ? ORDER BY time limit 1000`,
                [query.from, query.to],
            );
            console.log(rows[0])
            //
            if (rows.length == 0) {
                // console.log("empty rows");
                const key_array = await this.get_device_keys({ dtype: 30, dname: "bcreg" })
                // console.log("key_array: ", key_array);
                const bcregrows: Array<devicebcreg> = [];
                for (const [qkey, qvalue] of Object.entries(key_array)) {
                    for (let i = 0; i < qvalue.length; i++) {
                        const devbcreg: devicebcreg = {
                            node_device: qvalue[i].node_name + ":" + qvalue[i].name,
                            didx: qvalue[i].didx,
                            time: query.to,
                            volt: 0,
                            amp: 0,
                            power: 0,
                            temp: 0,
                            mpptin_amp: 0,
                            mpptin_volt: 0,
                            mpptout_amp: 0,
                            mpptout_volt: 0,
                        }
                        bcregrows.push({ ...devbcreg });
                    }
                }
                const ret = { "bcregs": bcregrows };
                return ret;
            } else {
                const ret = { "bcregs": rows };
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
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT
utc AS "time",
CONCAT(devspec.node_name, ':', device.name) as "node:device",
devspec.temp
FROM tsenstruc AS devspec
INNER JOIN device ON devspec.didx = device.didx
WHERE
  device.type = 15 AND
devspec.utc BETWEEN ? and ? ORDER BY time limit 1000`,
                [query.from, query.to],
            );
            console.log(rows[0])
            // tsenstruc sql
            // export interface devicetsen {
            //     node_name: string;
            //     didx: number;
            //     time: number; // utc
            //     temp: number;
            // }
            if (rows.length == 0) {
                const key_array = await this.get_device_keys({ dtype: 15, dname: "tsen" })
                const tsenrows: Array<devicetsen> = [];
                for (const [qkey, qvalue] of Object.entries(key_array)) {
                    for (let i = 0; i < qvalue.length; i++) {
                        const devtsen: devicetsen = {
                            node_device: qvalue[i].node_name + ":" + qvalue[i].name,
                            didx: qvalue[i].didx,
                            time: query.to,
                            temp: 0,
                        }
                        tsenrows.push({ ...devtsen });
                    }
                }
                const ret = { "tsens": tsenrows };
                return ret;
            } else {
                const ret = { "tsens": rows };
                return ret;
            }
            // const ret = { "tsens": rows };
            // return ret;
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
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT
  utc AS "time",
  CONCAT(node_name, ':', didx) as node,
  cpu_load as "load",
  temp, uptime,
  gib, boot_count,
  storage
FROM cpustruc
WHERE utc BETWEEN ? and ? ORDER BY time limit 1000`,
                [query.from, query.to],
            );
            console.log(rows[0])
            if (rows.length == 0) {
                const key_array = await this.get_device_keys({ dtype: 5, dname: "cpu" })
                const cpurows: Array<devicecpu> = [];
                for (const [qkey, qvalue] of Object.entries(key_array)) {
                    for (let i = 0; i < qvalue.length; i++) {
                        const devcpu: devicecpu = {
                            node_device: qvalue[i].node_name + ":" + qvalue[i].name,
                            didx: qvalue[i].didx,
                            time: query.to,
                            temp: 0,
                            uptime: 0,
                            cpu_load: 0,
                            gib: 0,
                            boot_count: 0,
                            storage: 0,
                        }
                        cpurows.push({ ...devcpu });
                    }
                }
                const ret = { "cpus": cpurows };
                return ret;
            } else {
                const ret = { "cpus": rows };
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
            if (rows.length == 0) {
                const key_array = await this.get_device_keys({ dtype: 32, dname: "mag" })
                const magrows: Array<devicemag> = [];
                for (const [qkey, qvalue] of Object.entries(key_array)) {
                    for (let i = 0; i < qvalue.length; i++) {
                        const devmag: devicemag = {
                            node_device: qvalue[i].node_name + ":" + qvalue[i].name,
                            didx: qvalue[i].didx,
                            time: query.to,
                            mag_x: 0,
                            mag_y: 0,
                            mag_z: 0,
                        }
                        magrows.push({ ...devmag });
                    }
                }
                const ret = { "mags": magrows };
                return ret;
            } else {
                const ret = { "mags": rows };
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
            if (rows.length == 0) {
                const key_array = await this.get_device_keys({ dtype: 31, dname: "gyro" })
                const gyrorows: Array<devicegyro> = [];
                for (const [qkey, qvalue] of Object.entries(key_array)) {
                    for (let i = 0; i < qvalue.length; i++) {
                        const devgyro: devicegyro = {
                            node_device: qvalue[i].node_name + ":" + qvalue[i].name,
                            didx: qvalue[i].didx,
                            time: query.to,
                            omega: 0,
                        }
                        gyrorows.push({ ...devgyro });
                    }
                }
                const ret = { "gyros": gyrorows };
                return ret;
            } else {
                const ret = { "gyros": rows };
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

    public async get_mtr(query: QueryType): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT 
    utc AS "time",
    node_name,
    didx,
    mom, align_w,
    align_x, align_y, align_z
    FROM mtrstruc
    WHERE utc BETWEEN ? and ? ORDER BY time limit 1000;`,
                [query.from, query.to],
            );
            console.log(rows[0])
            if (rows.length == 0) {
                const key_array = await this.get_device_keys({ dtype: 4, dname: "mtr" })
                const mtrrows: Array<devicemtr> = [];
                for (const [qkey, qvalue] of Object.entries(key_array)) {
                    for (let i = 0; i < qvalue.length; i++) {
                        const devmtr: devicemtr = {
                            node_device: qvalue[i].node_name + ":" + qvalue[i].name,
                            didx: qvalue[i].didx,
                            time: query.to,
                            mom: 0,
                            align_w: 0,
                            align_x: 0,
                            align_y: 0,
                            align_z: 0,
                        }
                        mtrrows.push({ ...devmtr });
                    }
                }
                const ret = { "mtrs": mtrrows };
                return ret;
            } else {
                const ret = { "mtrs": rows };
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

    public async get_rw(query: QueryType): Promise<cosmosresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT 
utc AS "time",
node_name,
didx,
amp, omg,
romg
FROM rwstruc
WHERE utc BETWEEN ? and ? ORDER BY time limit 1000;`,
                [query.from, query.to],
            );
            console.log(rows[0])
            if (rows.length == 0) {
                const key_array = await this.get_device_keys({ dtype: 3, dname: "rw" })
                const rwrows: Array<devicerw> = [];
                for (const [qkey, qvalue] of Object.entries(key_array)) {
                    for (let i = 0; i < qvalue.length; i++) {
                        const devrw: devicerw = {
                            node_device: qvalue[i].node_name + ":" + qvalue[i].name,
                            didx: qvalue[i].didx,
                            time: query.to,
                            amp: 0,
                            omg: 0,
                            romg: 0,
                        }
                        rwrows.push({ ...devrw });
                    }
                }
                const ret = { "rws": rwrows };
                return ret;
            } else {
                const ret = { "rws": rows };
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
                        where_query_filter += ' node_name ';
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
                        where_query_filter += '= ' + filter.filterValue;
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

            // TODO build final query string
            let full_get_query_statement: string = "";
            full_get_query_statement.concat(dynamic_query, table_query, query_filter_string)
            console.log("Dynamic GET query, full statement: ", full_get_query_statement);

            // final SQL call
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                full_get_query_statement
            );
            console.log(rows[0])
            // TODO create mapping from table to return code; for now it is the SQL table name
            const dname: string = databasetable;
            const ret = { dname: rows };
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

}