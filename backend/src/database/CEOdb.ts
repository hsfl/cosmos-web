import mysql from 'mysql2';
import { Pool } from "mysql2/promise";
import { AppError } from '../exceptions/AppError';
import { StatusCodes } from 'http-status-codes';
import { DynaDBHandler, mmgr } from './DBHandler';


export default class CEOdatabase {
    // Connection to database
    private pool: mysql.Pool;
    private promisePool: Pool;
    private db_array: DynaDBHandler;

    constructor(host: string | undefined, user: string | undefined, password: string | undefined, database: string | undefined) {
        if (host === undefined || user === undefined || password === undefined || database === undefined) {
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Mysql database connection configuration invalid',
                isOperational: false,
            });
        }
        // ceo mysql db pool
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
        // dynamic handler instance on server
        this.db_array = new DynaDBHandler();
    }

    public async end_connection(): Promise<void> {
        await this.promisePool.end();
        this.pool.end();
    }

    // public async clearDatabase(): Promise<void> {
    //     console.log('Clear databases');
    // }

    public async write_mission(dbmission: dbmission[]): Promise<void> {
        // Load in new devices mappings
        for (let i = 0; i < dbmission.length; i++) {
            try {
                // db_name must be unique/ primary key. mission_name for human readable alias
                await this.promisePool.execute(
                    'INSERT INTO mission_map (mission_name, host, user, db_access, db_name) VALUES (?,?,?,?,?)',
                    [dbmission[i].mission_name, dbmission[i].host, dbmission[i].user, dbmission[i].db_access, dbmission[i].db_name]
                );
            } catch (error) {
                console.log(error);
                throw new AppError({
                    httpCode: StatusCodes.BAD_REQUEST,
                    description: 'Failure adding CEO mission to database'
                });
            }

        }
    }

    public async write_db(dbmission: dbmission[]): Promise<void> {
        // Load in new devices mappings
        for (let i = 0; i < dbmission.length; i++) {

            // Ran thru sql terminal:
            // generates super backend user, to create new tables dynamically... 
            // GRANT ALL PRIVILEGES ON *.* TO 'backend_user'@'%' IDENTIFIED BY 'password';
            // show grants for 'backend_user'@'%';
            // GRANT SELECT, INSERT, UPDATE, DELETE ON cosmos12.* TO 'backend_user'@'%';

            // create database
            try {
                await this.promisePool.query(
                    // "CREATE USER IF NOT EXISTS 'backend_user'@'%' IDENTIFIED BY 'password';"
                    // "GRANT CREATE, SELECT, INSERT, UPDATE, DELETE ON *.* TO `backend_user'@'%`;"
                    // 'CREATE DATABASE cosmos4'
                    'CREATE DATABASE ' +
                    dbmission[i].db_name
                );
                // init mission db handler and push to db_array db_map
                const mission = this.db_array.new_mission(
                    dbmission[i].mission_name,
                    dbmission[i].host,
                    dbmission[i].user,
                    dbmission[i].db_access,
                    dbmission[i].db_name,
                );
                // console.log("new mission: ", mission);
                // console.log("db map array: ", this.db_array.database_set);

                //  db_array function to get mission by name, and then apply function to init table schema;
                this.db_array.select_mission_init(dbmission[i].mission_name);

            } catch (error) {
                console.log(error);
                throw new AppError({
                    httpCode: StatusCodes.BAD_REQUEST,
                    description: 'Failure creating mission database'
                });
            }
        }
        // push whole dbmission post packet to write_mission to CEOdb mysql database
        await this.write_mission(dbmission);
    }

    public async get_mission_list(): Promise<ceoresponse> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT 
mission_name,
host,
user,
db_access,
db_name
FROM mission_map;`,
            );
            // returns data list packet of all mission databases
            const ret = { "missions": rows };
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
    // this.db_array
    public async init_mission_list(): Promise<mmgr[]> {
        try {
            const [rows] = await this.promisePool.execute<mysql.RowDataPacket[]>(
                `SELECT 
mission_name,
host,
user,
db_access,
db_name
FROM mission_map;`,
            );
            // this code populates the CEOdb db_array on restart; can ref this.db_array from db.ts on array mission name
            for (let i = 0; i < rows.length; i++) {
                let dbmission: dbmission = {
                    mission_name: rows[i].mission_name,
                    host: rows[i].host,
                    user: rows[i].user,
                    db_access: rows[i].db_access,
                    db_name: rows[i].db_name
                }
                // push to CEOdb db_array with 
                const mission = this.db_array.new_mission(
                    dbmission.mission_name,
                    dbmission.host,
                    dbmission.user,
                    dbmission.db_access,
                    dbmission.db_name,
                );
                // console.log("Init ceo handler on restart: mission iterator: ", rows[i]);
            }
            console.log("Init ceo handler on restart");
            const ret = this.db_array.database_set;
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
    //

    //     const ret_array = db_array.database_set; Array<mmgr>
    public async get_mission_array(): Promise<mmgr[]> {
        try {
            // console.log(this.db_array.database_set);
            // returns the init array of mission database handlers
            return this.db_array.database_set;
        }
        catch (error) {
            console.log('Error in get_event:', error);
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Failure getting rows'
            });
        }
    }
    //
}

export interface dbmission {
    mission_name: string;
    host: string;
    user: string;
    db_access: string;
    db_name: string;
}

export interface TimePacket {
    "Time"?: number;
    [column: string]: any;
}

export interface ceoresponse {
    [column: string]: TimePacket[];
}