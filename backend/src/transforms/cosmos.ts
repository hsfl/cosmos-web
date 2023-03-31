import { CosmosModule, quaternion, avector, timepoint, locstruc, spherpos, cartpos, qatt, geoidpos, gfgeoidpos, gfcartpos, gfspherpos, gfqatt } from '../types/cosmos_types';
import mysql from 'mysql2';
import { GFNodeType } from '../database/BaseDatabase';

const COSMOSJS = require('/root/web_core_dist/CosmosWebCore.js');
// TODO: probably a better way of doing this
let cosmos: CosmosModule;
COSMOSJS().then((cosmos_module: CosmosModule) => {
    cosmos = cosmos_module;
    console.log('CosmosModule successfully imported');
    return;
});

export const attitude = (rows: mysql.RowDataPacket[]) => {

    const ret: Array<avector & timepoint> = [];
    rows.forEach((row) => {
        const q: quaternion = {
            d: {
                x: row.qsx,
                y: row.qsy,
                z: row.qsz,
            },
            w: row.qsw,
        };
        const av: avector = (cosmos.a_quaternion2euler(q));
        //const time  
        ret.push({ Time: row.Time, ...av });
    });
    console.log('iret:', rows[0], ret[0]);
    return ret;
};

const loc: locstruc = {
    utc: 0, // 59874.83333533
    pos: {
        utc: 0, // 59976.086354162231
        icrf:
        {
            utc: 0,
            s: { col: [0, 0, 0] },
            v: { col: [0, 0, 0] },
            a: { col: [0, 0, 0] },
            pass: 0
        },
        eci: {
            utc: 0,
            s: { col: [0, 0, 0] },
            v: { col: [0, 0, 0] },
            a: { col: [0, 0, 0] },
            pass: 0
        },
        sci: {
            utc: 0,
            s: { col: [0, 0, 0] },
            v: { col: [0, 0, 0] },
            a: { col: [0, 0, 0] },
            pass: 0
        },
        geoc:
        {
            utc: 0,
            s: { col: [0, 0, 0] },
            v: { col: [0, 0, 0] },
            a: { col: [0, 0, 0] },
            pass: 0
        },
        selc:
        {
            utc: 0,
            s: { col: [0, 0, 0] },
            v: { col: [0, 0, 0] },
            a: { col: [0, 0, 0] },
            pass: 0
        },
        geod: {
            utc: 0,
            s: {
                lat: 0,
                lon: 0,
                h: 0
            },
            v: {
                lat: 0,
                lon: 0,
                h: 0
            },
            a: {
                lat: 0,
                lon: 0,
                h: 0
            },
            pass: 0,
        },
        selg: {
            utc: 0,
            s: {
                lat: 0,
                lon: 0,
                h: 0
            },
            v: {
                lat: 0,
                lon: 0,
                h: 0
            },
            a: {
                lat: 0,
                lon: 0,
                h: 0
            },
            pass: 0,
        },
        geos: {
            utc: 0,
            s: {
                phi: 0,
                lambda: 0,
                r: 0
            },
            v: {
                phi: 0,
                lambda: 0,
                r: 0
            },
            a: {
                phi: 0,
                lambda: 0,
                r: 0
            },
            pass: 0,
        },
        //
        extra: {
            utc: 0, // updated to trigger utc2tt  59976.08635416
            tt: 0,
            ut: 0,
            tdb: 0,
            j2e:
            {
                row: [{ col: [0, 0, 0] },
                { col: [0, 0, 0] },
                { col: [0, 0, 0] }]
            },
            dj2e:
            {
                row: [{ col: [0, 0, 0] },
                { col: [0, 0, 0] },
                { col: [0, 0, 0] }]
            },
            ddj2e:
            {
                row: [{ col: [0, 0, 0] },
                { col: [0, 0, 0] },
                { col: [0, 0, 0] }]
            },
            e2j:
            {
                row: [{ col: [0, 0, 0] },
                { col: [0, 0, 0] },
                { col: [0, 0, 0] }]
            },
            de2j:
                { row: [{ col: [0, 0, 0] }, { col: [0, 0, 0] }, { col: [0, 0, 0] }] },
            dde2j:
                { row: [{ col: [0, 0, 0] }, { col: [0, 0, 0] }, { col: [0, 0, 0] }] },
            j2t:
                { row: [{ col: [0, 0, 0] }, { col: [0, 0, 0] }, { col: [0, 0, 0] }] },
            j2s:
                { row: [{ col: [0, 0, 0] }, { col: [0, 0, 0] }, { col: [0, 0, 0] }] },
            t2j:
                { row: [{ col: [0, 0, 0] }, { col: [0, 0, 0] }, { col: [0, 0, 0] }] },
            s2j:
                { row: [{ col: [0, 0, 0] }, { col: [0, 0, 0] }, { col: [0, 0, 0] }] },
            s2t:
                { row: [{ col: [0, 0, 0] }, { col: [0, 0, 0] }, { col: [0, 0, 0] }] },
            ds2t:
                { row: [{ col: [0, 0, 0] }, { col: [0, 0, 0] }, { col: [0, 0, 0] }] },
            t2s:
                { row: [{ col: [0, 0, 0] }, { col: [0, 0, 0] }, { col: [0, 0, 0] }] },
            dt2s:
                { row: [{ col: [0, 0, 0] }, { col: [0, 0, 0] }, { col: [0, 0, 0] }] },
            sun2earth:
            {
                utc: 0,
                s: { col: [0, 0, 0] },
                v: { col: [0, 0, 0] },
                a: { col: [0, 0, 0] },
                pass: 0 //1 trigger 
            },
            sungeo: {
                lat: 0,
                lon: 0,
                h: 0
            },
            sun2moon: {
                utc: 0,
                s: { col: [0, 0, 0] },
                v: { col: [0, 0, 0] },
                a: { col: [0, 0, 0] },
                pass: 0 //trigger
            },
            moongeo: {
                lat: 0,
                lon: 0,
                h: 0
            },
            closest: 0, //trigger ???
        },
        earthsep: 0,
        moonsep: 0,
        sunsize: 0,
        sunradiance: 0,
        bearth: { col: [0, 0, 0] },
        orbit: 0
    },
    att: {
        utc: 0,
        topo: {
            utc: 0,
            s: {
                d: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                w: 0
            },
            v: { col: [0, 0, 0] },
            a: { col: [0, 0, 0] },
            pass: 0,
        },
        lvlh: {
            utc: 0,
            s: {
                d: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                w: 0
            },
            v: { col: [0, 0, 0] },
            a: { col: [0, 0, 0] },
            pass: 0,
        },
        geoc:
        {
            utc: 0,
            s: {
                d: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                w: 0
            },
            v: { col: [0, 0, 0] },
            a: { col: [0, 0, 0] },
            pass: 0,
        },
        selc:
        { //trigger with loc.pos.extra.closest = 1
            utc: 0,
            s:
            {
                d: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                w: 0
            },
            v: { col: [0, 0, 0] },
            a: { col: [0, 0, 0] },
            pass: 0,
        },
        icrf: { //trigger key for att . lvlh . s ~ onl the att . icrf . s
            utc: 0,
            s:
            {
                d: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                w: 0
            },
            v: { col: [0, 0, 0] },
            a: { col: [0, 0, 0] },
            pass: 0,
        },
        extra: {
            utc: 0, //  59976.08635416 trigger
            j2b:
                { row: [{ col: [0, 0, 0] }, { col: [0, 0, 0] }, { col: [0, 0, 0] }] },
            b2j:
                { row: [{ col: [0, 0, 0] }, { col: [0, 0, 0] }, { col: [0, 0, 0] }] },
        }
    }
};


export const eci_position = (rows: mysql.RowDataPacket[]) => {
    const ret: Array<gfcartpos & timepoint & GFNodeType> = [];
    rows.forEach((row) => {
        const gfeci: gfcartpos = {
            utc: row.time,
            s_x: row.eci_s_x,
            s_y: row.eci_s_y,
            s_z: row.eci_s_z,
            v_x: row.eci_v_x,
            v_y: row.eci_v_y,
            v_z: row.eci_v_z,
            a_x: 0,
            a_y: 0,
            a_z: 0
            // a_x: row.eci_a_x,
            // a_y: row.eci_a_y,
            // a_z: row.eci_a_z
        }
        ret.push({ Time: row.time, Node_name: row.node_name, Node_type: row.node_type, ...gfeci });
    });
    console.log('iret:', rows[0], ret[0]);
    return ret;
}

export const geod_position = (rows: mysql.RowDataPacket[]) => {
    const ret: Array<geoidpos & timepoint & GFNodeType> = [];
    rows.forEach((row) => {
        loc.pos.eci.utc = row.time;
        loc.pos.eci.pass = 1;
        loc.pos.eci.s = { col: [row.eci_s_x, row.eci_s_y, row.eci_s_z] };
        loc.pos.eci.v = { col: [row.eci_v_x, row.eci_v_y, row.eci_v_z] };
        loc.pos.eci.a = { col: [row.eci_a_x, row.eci_a_y, row.eci_a_z] };
        // const typed_node: GFNodeType = {
        //     name: row.node_name,
        //     type: 0,
        // }

        const geod: geoidpos = (cosmos.ecitogeod(loc));
        // const gfgeod: gfgeoidpos = {
        //     utc: geod.utc,
        //     s_lat: geod.s.lat,
        //     s_lon: geod.s.lon,
        //     s_h: geod.s.h,
        //     v_lat: geod.v.lat,
        //     v_lon: geod.v.lon,
        //     v_h: geod.v.h,
        //     a_lat: geod.a.lat,
        //     a_lon: geod.a.lon,
        //     a_h: geod.a.h,
        // }
        //const time  
        ret.push({ Time: row.time, Node_name: row.node_name, Node_type: row.node_type, ...geod });
    });
    loc.pos.eci.utc = 0;
    loc.pos.eci.pass = 0;
    loc.pos.eci.s = { col: [0, 0, 0] };
    loc.pos.eci.v = { col: [0, 0, 0] };
    loc.pos.eci.a = { col: [0, 0, 0] };
    console.log('iret:', rows[0], ret[0]);
    return ret;
}

export const geos_position = (rows: mysql.RowDataPacket[]) => {
    const ret: Array<spherpos & timepoint & GFNodeType> = [];
    rows.forEach((row) => {
        loc.pos.eci.utc = row.time;
        loc.pos.eci.pass = 1;
        loc.pos.eci.s = { col: [row.eci_s_x, row.eci_s_y, row.eci_s_z] };
        loc.pos.eci.v = { col: [row.eci_v_x, row.eci_v_y, row.eci_v_z] };
        loc.pos.eci.a = { col: [row.eci_a_x, row.eci_a_y, row.eci_a_z] };

        const geos: spherpos = (cosmos.loc2geos(loc));
        // const gfgeos: gfspherpos = {
        //     utc: geos.utc,
        //     s_phi: geos.s.phi,
        //     s_lambda: geos.s.lambda,
        //     s_r: geos.s.r,
        //     v_phi: geos.v.phi,
        //     v_lambda: geos.v.lambda,
        //     v_r: geos.v.r,
        //     a_phi: geos.a.phi,
        //     a_lambda: geos.a.lambda,
        //     a_r: geos.a.r
        // }
        //const time  
        ret.push({ Time: row.time, Node_name: row.node_name, Node_type: row.node_type, ...geos });
    });
    loc.pos.eci.utc = 0;
    loc.pos.eci.pass = 0;
    loc.pos.eci.s = { col: [0, 0, 0] };
    loc.pos.eci.v = { col: [0, 0, 0] };
    loc.pos.eci.a = { col: [0, 0, 0] };
    console.log('iret:', rows[0], ret[0]);
    return ret;
}

export const lvlh_attitude = (rows: mysql.RowDataPacket[]) => {
    const ret: Array<qatt & timepoint & GFNodeType> = [];
    rows.forEach((row) => {
        loc.pos.eci.utc = row.time;
        loc.pos.eci.pass = 1;
        loc.pos.eci.s = { col: [row.eci_s_x, row.eci_s_y, row.eci_s_z] };
        loc.pos.eci.v = { col: [row.eci_v_x, row.eci_v_y, row.eci_v_z] };
        // this object not in database
        loc.pos.eci.a = { col: [row.eci_a_x, row.eci_a_y, row.eci_a_z] };
        // icrf_s_x, icrf_s_y, icrf_s_z, icrf_s_w
        loc.att.icrf.pass = 1;
        loc.att.icrf.utc = row.time;
        // s element needed to populate lvlh s element 
        loc.att.icrf.s = {
            d: {
                x: row.icrf_s_x,
                y: row.icrf_s_y,
                z: row.icrf_s_z
            },
            w: row.icrf_s_w
        };
        const lvlh: qatt = (cosmos.loc2lvlh(loc));
        // const gflvlh: gfqatt = {
        //     utc: lvlh.utc,
        //     s_d_x: lvlh.s.d.x,
        //     s_d_y: lvlh.s.d.y,
        //     s_d_z: lvlh.s.d.z,
        //     s_w: lvlh.s.w,
        //     v_x: lvlh.v.col[0],
        //     v_y: lvlh.v.col[1],
        //     v_z: lvlh.v.col[2],
        //     a_x: lvlh.a.col[0],
        //     a_y: lvlh.a.col[1],
        //     a_z: lvlh.a.col[2],
        // }
        //const time  
        ret.push({ Time: row.time, Node_name: row.node_name, Node_type: row.node_type, ...lvlh });
    });
    loc.pos.eci.utc = 0;
    loc.pos.eci.pass = 0;
    loc.pos.eci.s = { col: [0, 0, 0] };
    loc.pos.eci.v = { col: [0, 0, 0] };
    loc.pos.eci.a = { col: [0, 0, 0] };
    loc.att.icrf.pass = 0;
    loc.att.icrf.utc = 0;
    loc.att.icrf.s = {
        d: {
            x: 0,
            y: 0,
            z: 0
        },
        w: 0
    };
    loc.att.icrf.v = { col: [0, 0, 0] };
    loc.att.icrf.a = { col: [0, 0, 0] };
    console.log('iret:', rows[0], ret[0]);
    return ret;
}

