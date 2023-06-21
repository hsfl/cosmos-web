import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import router from 'routes/routes';

import { DBHandler, SIMDBHandler, CEOHandler } from './database/DBHandler';
import BaseDatabase from 'database/BaseDatabase';
import CEOdatabase from 'database/CEOdb';
import { Cosmos } from 'transforms/cosmos';
import { initiate_ceo_handler } from 'routes/db';


// Import .env file environment variables into process.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export default class App {
    public express: Express;

    constructor() {
        this.express = express();
        // Middlewares
        this.express.use(
            cors({ origin: true }),
            express.json({ limit: '50mb' }),
            express.urlencoded({ limit: '50mb' })
        );
        // Routes
        this.express.use(router);
    }

    // Load all static variables
    public async Init(db: BaseDatabase, simDb: BaseDatabase, ceoDb: CEOdatabase): Promise<App> {
        // Don't progress app state until cosmos module successfully loads
        await Cosmos.loadCosmosModule();

        // Specify database the app will use
        DBHandler.set_database(db);
        await DBHandler.init_database();

        // Integrate simulated database 
        SIMDBHandler.set_database(simDb);

        // Get handled missions
        CEOHandler.set_database(ceoDb);
        await initiate_ceo_handler();

        return this;
    }

    public async close(): Promise<void> {
        await DBHandler.end_connection();
        await SIMDBHandler.end_connection();
        // TODO: investigate why CEOHandler is hanging on some kind of async operation,
        // commenting this out makes test hang indefinitely.
        await CEOHandler.end_connection();
    }
}
