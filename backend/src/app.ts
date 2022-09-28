import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
// Import .env file environment variables into process.env
dotenv.config({path: path.resolve(__dirname, '../.env')});
import router from './routes/routes';
//import BaseDatabase from 'database/BaseDatabase';

export default class App {
    public express: Express;

    constructor() {
        this.express = express();
        // Middlewares
        this.express.use(cors({origin: true}), express.json());
        // Routes
        this.express.use(router);
    }
}
