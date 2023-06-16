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
    
    it('Can post device beacon', async () => {
        const beacon = {
            metrics: [
                {
                    fields: {
                        value: '{"device": [{"cidx": 0, "didx": 0, "name": "Battery0", "type": 12}, {"cidx": 1, "didx": 1, "name": "Battery1", "type": 12}, {"cidx": 2, "didx": 0, "name": "Left", "type": 30}, {"cidx": 3, "didx": 1, "name": "Right", "type": 30}, {"cidx": 4, "didx": 0, "name": "Camera", "type": 15}, {"cidx": 5, "didx": 1, "name": "Heat sink", "type": 15}, {"cidx": 6, "didx": 2, "name": "CPU", "type": 15}], "node_name": "mother"}'
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

    it('Can post battery beacon', async () => {
        const beacon = {
            metrics: [
                {
                    fields: {
                        value: '{"devspec": {"batt": [{"amp": 0.920093834400177, "didx": 0, "percentage": 0.58953201004282196, "power": 5.6890773773193359, "temp": 394.57748059396516, "utc": 60101.0, "volt": 6.1831488609313965}, {"amp": 0.95582365989685059, "didx": 1, "percentage": 0.5804688784435712, "power": 5.3455910682678223, "temp": 383.38056889287225, "utc": 60101.0, "volt": 5.5926542282104492}]}, "node_name": "mother"}'
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

    it('Can post bcreg beacon', async () => {
        const beacon = {
            metrics: [
                {
                    fields: {
                        value: '{"devspec": {"bcreg": [{"amp": 0.63888734579086304, "didx": 0, "mpptin_amp": 0.57499861121177676, "mpptin_volt": 5.9957190513610845, "mpptout_amp": 0.31944367289543152, "mpptout_volt": 3.3309550285339355, "power": 4.2562098503112793, "temp": 386.93492629655401, "utc": 60101.0, "volt": 6.6619100570678711}, {"amp": 0.81443548202514648, "didx": 1, "mpptin_amp": 0.73299193382263184, "mpptin_volt": 5.4849178791046143, "mpptout_amp": 0.40721774101257324, "mpptout_volt": 3.0471765995025635, "power": 4.9634575843811035, "temp": 387.83502275489036, "utc": 60101.0, "volt": 6.094353199005127}]}, "node_name": "mother"}'
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

    it('Can post tsen beacon', async () => {
        const beacon = {
            metrics: [
                {
                    fields: {
                        value: '{"devspec": {"tsen": [{"didx": 0, "temp": 398.80574312936784, "utc": 60101.0}, {"didx": 1, "temp": 397.90487670009253, "utc": 60101.0}, {"didx": 2, "temp": 390.89279319899754, "utc": 60101.0}]}, "node_name": "mother"}'
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

    it('Can get battery', async () => {
        const queryObject: QueryObject = {
            type: 'battery',
            arg: '',
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
            .get('/db/battery')
            .set('Accept', 'application/json')
            .query(query)
            .expect((res: request.Response) => {
                expect(res.body.message).toBe('success');
                expect(res.body.payload.batts).not.toHaveLength(0);
            })
            .expect(StatusCodes.OK);
    });

    it('Can get bcreg', async () => {
        const queryObject: QueryObject = {
            type: 'bcreg',
            arg: '',
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
            .get('/db/bcreg')
            .set('Accept', 'application/json')
            .query(query)
            .expect((res: request.Response) => {
                expect(res.body.message).toBe('success');
                expect(res.body.payload.bcregs).not.toHaveLength(0);
            })
            .expect(StatusCodes.OK);
    });

    it('Can get tsen', async () => {
        const queryObject: QueryObject = {
            type: 'tsen',
            arg: '',
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
            .get('/db/tsen')
            .set('Accept', 'application/json')
            .query(query)
            .expect((res: request.Response) => {
                expect(res.body.message).toBe('success');
                expect(res.body.payload.tsens).not.toHaveLength(0);
            })
            .expect(StatusCodes.OK);
    });
});
