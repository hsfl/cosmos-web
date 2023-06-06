import express from 'express';
import App from 'app';
import MysqlDatabase from 'database/MysqlDatabase';
import CEOdatabase from 'database/CEOdb';

export default class IntegrationHelpers {
    public static app: App;

    // Currently defaults to DBHandler
    // public static init(database: BaseDatabase): void {
    //     DBHandler.set_database(database);
    // };

    public static async getApp(): Promise<express.Application> {
        if (this.app) {
            return this.app.express;
        }
        const app = new App();
        console.log('before init');
        await app.Init(
            new MysqlDatabase(
                process.env.DB_HOST,
                'backend_user',
                process.env.DB_BACKEND_USER_PASSWORD,
                'cosmos_test',
            ),
            new MysqlDatabase(
                process.env.DB_HOST,
                'backend_user',
                process.env.DB_BACKEND_USER_PASSWORD,
                'sim_cosmos'
            ),
            new CEOdatabase(
                process.env.DB_HOST,
                'backend_user',
                process.env.DB_BACKEND_USER_PASSWORD,
                'cosmos_ceo'
            )
        )
        this.app = app;
        return this.app.express;
    }

    public static async closeApp(): Promise<void> {
        await this.app.close();
    }

    public async resetDatabase(): Promise<boolean> {
        console.log('Resetting database');
        // const db = DBHandler.app_db();
        // await db.reset_db(table_array);

        return true;
    }
}
