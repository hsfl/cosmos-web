import 'jest';
import express from 'express';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import IntegrationHelpers from 'tests/helpers/Integration-helpers';
import { QueryObject, QueryType } from 'types/query_types';

describe('GET /', () => {
    let app: express.Application;

    beforeAll(async() => {
        // Call endpoints with the app
        app = await IntegrationHelpers.getApp();
        // Reset the database
        const resetCall = {
            metrics: [
                {
                    fields: {
                        value: '{ "swchstruc": true, "battstruc": true, "bcregstruc": true, "cpustruc": true, "device": true, "device_type": true, "locstruc": true, "magstruc": true, "node": true, "tsenstruc": true, "rwstruc": true, "mtrstruc": true, "attstruc_icrf": true, "cosmos_event": true, "event_type": true, "gyrostruc": true, "locstruc_eci": true }'
                    },
                    name: 'socket_listener',
                    tags: { host: '12345678' },
                    timestamp: 12345678
                },
            ]
        };
        await request(app)
            .post('/db/resetdanger')
            .set('Accept', 'application/json')
            .send(resetCall)
            .expect((res: request.Response) => {
                expect(res.body.message).toBe('success');
            })
            .expect(StatusCodes.ACCEPTED);
    });

    afterAll(async() => {
        await IntegrationHelpers.closeApp();
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

    it('Can post node beacon', async () => {
        const beacon = {
            metrics: [
                {
                    fields: {
                        value: '{"node": {"agent_name": "sim", "node_id": 0, "node_name": "mother", "node_type": 0, "utc": 60101.0, "utcstart": 60101.0}}'
                    },
                    name: 'socket_listener',
                    tags: { host: '12345678' },
                    timestamp: 12345678
                },
            ]
        };
        await request(app)
            .post('/db/beacon')
            .set('Accept', 'application/json')
            .send(beacon)
            .expect((res: request.Response) => {
                expect(res.body.message).toBe('success');
            })
            .expect(StatusCodes.ACCEPTED);
    });

    it('Can post locstruc beacon', async () => {
        const beacon = {
            metrics: [
                {
                    fields: {
                        value: '{"node_loc": {"att": {"icrf": {"s": {"d": {"x": -0.76761564395003334, "y": -0.3026701599679319, "z": -0.27617031199510783}, "w": 0.49283562797416258}, "utc": 60101.0, "v": {"col": [-0.00079922728782835231, 0.00038492038174982063, 0.00070548069757078963]}}}, "pos": {"eci": {"s": {"col": [-845974.91094568907, -6257648.0464564562, 2455871.640470353]}, "utc": 60101.0, "v": {"col": [5359.9662644033779, 1365.9664518780316, 5326.9162539796353]}}}}, "node_name": "mother"}'
                    },
                    name: 'socket_listener',
                    tags: { host: '12345678' },
                    timestamp: 12345678
                },
            ]
        };
        await request(app)
            .post('/db/beacon')
            .set('Accept', 'application/json')
            .send(beacon)
            .expect((res: request.Response) => {
                expect(res.body.message).toBe('success');
            })
            .expect(StatusCodes.ACCEPTED);
    });

    it('Can get eci positions', async () => {
        const queryObject: QueryObject = {
            type: 'position',
            arg: 'eci',
            latestOnly: false,
            filters: [],
            functions: []
        }
        const query: QueryType = {
            query: JSON.stringify(queryObject),
            from: 60101.0,
            to: 60101.1
        }
        await request(app)
            .get('/db/position')
            .set('Accept', 'application/json')
            .query(query)
            .expect((res: request.Response) => {
                expect(res.body.message).toBe('success');
                expect(res.body.payload.ecis).not.toHaveLength(0);
            })
            .expect(StatusCodes.OK);
    });
});
