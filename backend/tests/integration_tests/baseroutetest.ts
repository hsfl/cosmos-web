import 'jest';
import express from 'express';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import IntegrationHelpers from 'tests/helpers/Integration-helpers';
import MysqlDatabase from 'database/MysqlDatabase';

describe('GET /', () => {
    let app: express.Application;

    beforeAll(async() => {
        // Initialize test with the test database
        IntegrationHelpers.init(new MysqlDatabase(
            process.env.DB_HOST,
            'backend_user',
            process.env.DB_BACKEND_USER_PASSWORD,
            'cosmos_test'
        ));
        // Call endpoints with the app
        app = await IntegrationHelpers.getApp();
    });

    it('Can get server time', async () => {
        await request(app)
            .get('/')
            .set('Accept', 'application/json')
            .expect((res: request.Response) => {
                expect(res.text).toBe('Hello World!\n');
            })
            .expect(StatusCodes.OK);
    });
    // it('Can post new node table', async () => {
    //     const nodes = [{name: 'iobc', id: 0}];
    //     await request(app)
    //         .post('/db/node')
    //         .set('Accept', 'application/json')
    //         .send(nodes)
    //         .expect((res: request.Response) => {
    //             expect(res.body).toBe('success');
    //         })
    //         .expect(StatusCodes.OK);
    // });
});
