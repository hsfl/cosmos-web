import express from 'express';
import App from 'app';
import { DBHandler } from 'database/DBHandler';
import BaseDatabase from 'database/BaseDatabase';

export default class IntegrationHelpers {
    public static appInstance: express.Application;

    // Currently defaults to DBHandler
    public static init(database: BaseDatabase): void {
        DBHandler.set_database(database);
    };

    public static async getApp(): Promise<express.Application> {
        if (this.appInstance) {
            return this.appInstance;
        }
        const app = new App();
        await app.loadCosmosModule();
        this.appInstance = app.express;
        return this.appInstance;
    }

    // public static async getPromisePool(): Promise<Pool> {
    //     if (this.promisePool) {
    //         return this.promisePool;
    //     }
    //     if (this.pool) {
    //         this.promisePool = this.pool.promise();
    //         return this.promisePool;
    //     }
    //     this.pool = mysql.createPool({
    //         host: process.env.DB_HOST,
    //         user: 'root',
    //         password: process.env.DB,

    //     })

    //     return this.promisePool;
    // }

    public async resetDatabase(): Promise<boolean> {
        console.log('Resetting database');
        // const db = DBHandler.app_db();
        // await db.reset_db(table_array);

        return true;
    }
}
