import BaseDatabase from "./BaseDatabase";
import MysqlDatabase from './MysqlDatabase';
import { AppError } from '../exceptions/AppError';
import { StatusCodes } from 'http-status-codes';
import CEOdatabase, { dbmission } from './CEOdb';

// Holds the static reference to the database used by the app
export class DBHandler {
    private static database: BaseDatabase;

    public static set_database(database: BaseDatabase): void {
        this.database = database;
    };

    public static reset_database(): void {
        // this.database.reset_db();
    }

    public static app_db(): BaseDatabase {
        return this.database;
    }

    public static async end_connection(): Promise<void> {
        await this.database.end_connection();
    }
}

export class SIMDBHandler {
    private static database: BaseDatabase;

    public static set_database(database: BaseDatabase): void {
        this.database = database;
    };

    public static app_db(): BaseDatabase {
        return this.database;
    }

    public static async end_connection(): Promise<void> {
        await this.database.end_connection();
    }
}

export interface mmgr {
    mission: string;
    dbin: MysqlDatabase;
}

export class DynaDBHandler {
    // database Array<mission_name & MysqlDatabase> 
    private db_map: Array<mmgr>;
    // separate array for database meta data ? i.e. ip address, name, descriptor ... 
    private db_index: Array<any>;
    // create custom object type... include database, and name for project database, and ip address, etc... 
    constructor() {
        this.db_map = [];
        this.db_index = [];
    }

    new_mission(mission_name: string, host: string | undefined, user: string | undefined, password: string | undefined, database: string | undefined) {
        if (host === undefined || user === undefined || password === undefined || database === undefined) {
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'Mysql database connection configuration invalid',
                isOperational: false,
            });
        }
        let mission: MysqlDatabase = (new MysqlDatabase(
            host,
            user,
            password,
            database
        ));
        this.db_map.push({ mission: mission_name, dbin: mission });
        // console.log("db map: ", this.db_map);
        // console.log("db new mission: ", mission);
        // console.log("loaded mission into dyna handler: ", mission_name);
        return mission;
    }

    // returns the array of active mission database handlers, call by mission_name
    get database_set() {
        return this.db_map
    }

    // function to init tables for only specific database instance for match on mission name
    select_mission_init(mission_name: string | undefined) {
        if (mission_name === undefined) {
            throw new AppError({
                httpCode: StatusCodes.INTERNAL_SERVER_ERROR,
                description: 'name key invalid',
                isOperational: false,
            });
        }
        // this.db_map.keys 
        for (const [key, value] of Object.entries(this.db_map)) {
            // console.log(`${key}: ${value}`);
            if (value.mission === mission_name) {
                console.log("select mission handler: init tables for: ", mission_name);
                value.dbin.init_tables()
            }
        }
    }
}

export class CEOHandler {
    private static database: CEOdatabase;

    public static set_database(database: CEOdatabase): void {
        this.database = database;
    };

    public static app_db(): CEOdatabase {
        return this.database;
    }

    public static async end_connection(): Promise<void> {
        await this.database.end_connection();
    }
}
