// import express from 'express';
// import app from '../../src/app';
import mysql from 'mysql2';
import { Pool } from 'mysql2/promise';
// import Pool from 'mysql2/typings/mysql/lib/Pool';

export default class DBSetup {
    public static promisePool: Pool;
    private static pool: mysql.Pool;

    public async init(): Promise<void> {
        // First create test database and users
        // const dbinit = 
    }

    public static async getPromisePool(): Promise<Pool> {
        if (this.promisePool) {
            return this.promisePool;
        }
        if (this.pool) {
            this.promisePool = this.pool.promise();
            return this.promisePool;
        }
        this.pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: 'root',
            password: process.env.DB,

        })

        return this.promisePool;
    }

    public clearDatabase(): void {
        console.log('clear database');
    }
}
