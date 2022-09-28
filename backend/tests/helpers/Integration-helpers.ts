import express from 'express';
import App from '../../src/app';
import DBHandler from '../../src/database/DBHandler';
import BaseDatabase from '../../src/database/BaseDatabase';

export default class IntegrationHelpers {
    public static appInstance: express.Application;

    public static init(database: BaseDatabase): void {
        DBHandler.set_database(database);
    };

    public static async getApp(): Promise<express.Application> {
        if (this.appInstance) {
            return this.appInstance;
        }
        const app = new App();
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

    public clearDatabase(): void {
        console.log('clear database');
    }
}
