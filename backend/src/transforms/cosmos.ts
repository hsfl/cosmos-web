import { CosmosModule, quaternion, avector, beacontype, devspecstruc, timepoint, locstruc, spherpos, qatt, geoidpos, gfcartpos, svector, is_locstruc_pos_eci_att_icrf, is_battstruc, is_bcregstruc, is_cpustruc, is_devicestruc, is_tsenstruc, targetstruc, is_targetstruc, adcsstruc, EulAdcsstruc, rvector, gforbit, gfadcstotal, cartpos } from 'types/cosmos_types';
import mysql from 'mysql2';
import { device_table, GFNodeType, devicebatt, devicebcreg, devicecpu, deviceswch, devicetsen, cosmos_table_row, locstruc_table, node, table_type, is_node, event, is_event } from 'database/BaseDatabase';

const COSMOSJS = require('/root/web_core_dist/CosmosWebCore.js');

export class Cosmos {
    // ALWAYS RUN `await loadCosmosModule()` or this will be uninitialized at runtime!
    public static module: CosmosModule;
    constructor() { }

    // Loads the emscripten module. Called by App::Init()
    public static async loadCosmosModule(): Promise<void> {
        this.module = await COSMOSJS();
        console.log('CosmosModule successfully imported');
    }
}

// TODO: use interfaces
export const attitude = (rows: mysql.RowDataPacket[]) => {

    const ret: Array<avector & timepoint & GFNodeType> = [];
    rows.forEach((row) => {
        const q: quaternion = {
            d: {
                x: row.icrf_s_x,
                y: row.icrf_s_y,
                z: row.icrf_s_z,
            },
            w: row.icrf_s_w,
        };
        const av: avector = (Cosmos.module.a_quaternion2euler(q));
        //const time  
        ret.push({ Time: row.time, Node_name: row.node_name, Node_type: row.node_type, ...av });
    });
    console.log('attitude iret:', rows[0], ret[0]);
    return ret;
};

const getNewLocstruc = (): locstruc => ({
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
});


export const icrf_att = (rows: mysql.RowDataPacket[]) => {

    const ret: Array<adcsstruc & timepoint & GFNodeType> = [];
    const loc = getNewLocstruc();
    // TODO index rows on time; create variable in state for "time -1", then update on each iteration of forEach, adding current time
    // behavior will return 0s for the first utc, then computation for every delta following
    let prev_vrv: rvector = {
        col: [0, 0, 0]
    };
    let prev_utc: number = 0;
    rows.sort((a, b) => (a.time > b.time) ? 1 : ((b.time > a.time) ? -1 : 0))
    // console.log("sorted row packet", rows);
    rows.forEach((row) => {
        loc.pos.eci.utc = row.time;
        loc.pos.eci.pass = 1;
        loc.pos.eci.s = { col: [row.eci_s_x, row.eci_s_y, row.eci_s_z] };
        loc.pos.eci.v = { col: [row.eci_v_x, row.eci_v_y, row.eci_v_z] };
        // this object not in database
        // loc.pos.eci.a = { col: [row.eci_a_x, row.eci_a_y, row.eci_a_z] };
        loc.pos.eci.a = { col: [0, 0, 0] };
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
        loc.att.icrf.v = { col: [row.icrf_v_x, row.icrf_v_y, row.icrf_v_z] };
        const q: quaternion = {
            d: {
                x: row.icrf_s_x,
                y: row.icrf_s_y,
                z: row.icrf_s_z,
            },
            w: row.icrf_s_w,
        };
        const sav: avector = (Cosmos.module.a_quaternion2euler(q));
        // TODO pending conversion to second derivative: Angular Vel (rad/s) /// should be rvector ? combined for ADCS? 
        // TODO make this just an rvector 
        const vrv: rvector = {
            col: [row.icrf_v_x, row.icrf_v_y, row.icrf_v_z]
        };
        // database does not account for third derivative: Angular Accel (rad/s2) 
        // TODO compute this as delta v over delta t, use row index mapping above... 
        // TODO make this just an rvector X, Y, Z
        let arv: rvector = {
            col: [0, 0, 0]
        };
        const delta_time: number = (row.time - prev_utc);
        if ((delta_time) < .000012) {
            const arv_x: number = (row.icrf_v_x - prev_vrv.col[0]) / (delta_time);
            const arv_y: number = (row.icrf_v_y - prev_vrv.col[1]) / (delta_time);
            const arv_z: number = (row.icrf_v_z - prev_vrv.col[2]) / (delta_time);
            arv = {
                col: [arv_x, arv_y, arv_z]
            };
        };
        const sunv: rvector = (Cosmos.module.loc2sunv(loc));
        const nadir: rvector = { col: [(-1 * row.eci_s_x), (-1 * row.eci_s_y), (-1 * row.eci_s_z)] };

        const adcs: adcsstruc = {
            // utc: row.time,
            q_s: q,
            s: sav,
            v: vrv,
            a: arv,
            sun: sunv,
            nad: nadir
        };
        //const time  
        ret.push({ Time: row.time, Node_name: row.node_name, Node_type: row.node_type, ...adcs });
        // load the current v values for next iteration
        prev_utc = row.time;
        prev_vrv = {
            col: [row.icrf_v_x, row.icrf_v_y, row.icrf_v_z]
        };
    });
    console.log('attitude iret:', rows[0], ret[0]);
    return ret;
};



export const icrf_att_total = (rows: mysql.RowDataPacket[]) => {

    const ret: Array<gfadcstotal & timepoint & GFNodeType> = [];
    const loc = getNewLocstruc();
    // TODO index rows on time; create variable in state for "time -1", then update on each iteration of forEach, adding current time
    // behavior will return 0s for the first utc, then computation for every delta following
    let prev_vrv: rvector = {
        col: [0, 0, 0]
    };
    let prev_utc: number = 0;
    rows.sort((a, b) => (a.time > b.time) ? 1 : ((b.time > a.time) ? -1 : 0))
    // console.log("sorted row packet", rows);
    rows.forEach((row) => {
        loc.pos.eci.utc = row.time;
        loc.pos.eci.pass = 1;
        loc.pos.eci.s = { col: [row.eci_s_x, row.eci_s_y, row.eci_s_z] };
        loc.pos.eci.v = { col: [row.eci_v_x, row.eci_v_y, row.eci_v_z] };
        // this object not in database
        // loc.pos.eci.a = { col: [row.eci_a_x, row.eci_a_y, row.eci_a_z] };
        loc.pos.eci.a = { col: [0, 0, 0] };
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
        loc.att.icrf.v = { col: [row.icrf_v_x, row.icrf_v_y, row.icrf_v_z] };
        const q: quaternion = {
            d: {
                x: row.icrf_s_x,
                y: row.icrf_s_y,
                z: row.icrf_s_z,
            },
            w: row.icrf_s_w,
        };
        const sav: avector = (Cosmos.module.a_quaternion2euler(q));
        const vrv: rvector = {
            col: [row.icrf_v_x, row.icrf_v_y, row.icrf_v_z]
        };
        // database does not account for third derivative: Angular Accel (rad/s2) 
        let arv: rvector = {
            col: [0, 0, 0]
        };
        const delta_time: number = (row.time - prev_utc);
        if ((delta_time) < .000012) {
            const arv_x: number = (row.icrf_v_x - prev_vrv.col[0]) / (delta_time);
            const arv_y: number = (row.icrf_v_y - prev_vrv.col[1]) / (delta_time);
            const arv_z: number = (row.icrf_v_z - prev_vrv.col[2]) / (delta_time);
            arv = {
                col: [arv_x, arv_y, arv_z]
            };
        };
        const rad2deg: number = 180 / Math.PI;
        let v_deg_rv: rvector = {
            col: [(row.icrf_v_x * rad2deg), (row.icrf_v_y * rad2deg), (row.icrf_v_z * rad2deg)]
        };
        const geod: geoidpos = (Cosmos.module.ecitogeod(loc));

        const adcs_total: gfadcstotal = {
            s: sav,
            v: vrv,
            a: arv,
            v_deg: v_deg_rv,
            pos_geod_s: geod.s,
        };
        //const time  
        ret.push({ Time: row.time, Node_name: row.node_name, Node_type: row.node_type, ...adcs_total });
        // load the current v values for next iteration
        prev_utc = row.time;
        prev_vrv = {
            col: [row.icrf_v_x, row.icrf_v_y, row.icrf_v_z]
        };
    });
    console.log('attitude iret:', rows[0], ret[0]);
    return ret;
};


export const icrf_lvlh_att = (rows: mysql.RowDataPacket[]) => {
    const ret: Array<adcsstruc & timepoint & GFNodeType> = [];
    const loc = getNewLocstruc();
    rows.forEach((row) => {
        loc.pos.eci.utc = row.time;
        loc.pos.eci.pass = 1;
        loc.pos.eci.s = { col: [row.eci_s_x, row.eci_s_y, row.eci_s_z] };
        loc.pos.eci.v = { col: [row.eci_v_x, row.eci_v_y, row.eci_v_z] };
        // this object not in database
        // loc.pos.eci.a = { col: [row.eci_a_x, row.eci_a_y, row.eci_a_z] };
        loc.pos.eci.a = { col: [0, 0, 0] };
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
        loc.att.icrf.v = { col: [row.icrf_v_x, row.icrf_v_y, row.icrf_v_z] };
        // translate icrf_sav
        const icrf_q: quaternion = {
            d: {
                x: row.icrf_s_x,
                y: row.icrf_s_y,
                z: row.icrf_s_z,
            },
            w: row.icrf_s_w,
        };
        const icrf_sav: avector = (Cosmos.module.a_quaternion2euler(icrf_q));

        // need to get pos in lvlh
        // need to write math; lvlh qatt transforms lvlh to body
        const lvlh: qatt = (Cosmos.module.loc2lvlh(loc));
        // console.log("lvlh qatt: ", lvlh);

        const q: quaternion =
        // lvlh.s;
        {
            d: {
                x: -lvlh.s.d.x,
                y: -lvlh.s.d.y,
                z: -lvlh.s.d.z,
            },
            w: lvlh.s.w,
        };
        const sav: avector = (Cosmos.module.a_quaternion2euler(q));
        // console.log("sav avector: ", sav);

        // COSMOS module lvlh conversion for second derivative: Angular Vel (rad/s) 
        const vrv: rvector = {
            col: [lvlh.v.col[0], lvlh.v.col[1], lvlh.v.col[2]]
        };
        // COSMOS module lvlh conversion for third derivative: Angular Accel (rad/s2) 
        const arv: rvector = {
            col: [lvlh.a.col[0], lvlh.a.col[1], lvlh.a.col[2]]
        };
        const sunv: rvector = (Cosmos.module.loc2sunv(loc));
        const nadir: rvector = { col: [(-1 * row.eci_s_x), (-1 * row.eci_s_y), (-1 * row.eci_s_z)] };
        // const nadir: rvector = { col: [(-1 * sav.b), (-1 * sav.e), (-1 * sav.h)] };

        const adcs: EulAdcsstruc = {
            // utc: row.time,
            icrfs: icrf_sav,
            q_s: loc.att.icrf.s,
            s: sav,
            v: vrv,
            a: arv,
            sun: sunv,
            nad: nadir,
            sqatt: lvlh.s
        };
        //const time  
        ret.push({ Time: row.time, Node_name: row.node_name, Node_type: row.node_type, ...adcs });
    });
    console.log('attitude iret:', rows[0], ret[0]);
    return ret;
};


export const icrf_geoc_att = (rows: mysql.RowDataPacket[]) => {
    const ret: Array<adcsstruc & timepoint & GFNodeType> = [];
    const loc = getNewLocstruc();
    rows.forEach((row) => {
        loc.pos.eci.utc = row.time;
        loc.pos.eci.pass = 1;
        loc.pos.eci.s = { col: [row.eci_s_x, row.eci_s_y, row.eci_s_z] };
        loc.pos.eci.v = { col: [row.eci_v_x, row.eci_v_y, row.eci_v_z] };
        // this object not in database
        // loc.pos.eci.a = { col: [row.eci_a_x, row.eci_a_y, row.eci_a_z] };
        loc.pos.eci.a = { col: [0, 0, 0] };
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
        loc.att.icrf.v = { col: [row.icrf_v_x, row.icrf_v_y, row.icrf_v_z] };
        const geoc: qatt = (Cosmos.module.loc2geoc(loc));
        // const geoc: qatt = (Cosmos.module.loc2attgeoc(loc));
        // console.log("geoc qatt: ", lvlh);
        const q: quaternion =
        // geoc.s;
        {
            d: {
                x: -geoc.s.d.x,
                y: -geoc.s.d.y,
                z: -geoc.s.d.z
            },
            w: geoc.s.w
        };
        const sav: avector = (Cosmos.module.a_quaternion2euler(q));
        // console.log("sav avector: ", sav);

        // translate icrf_sav
        const icrf_q: quaternion = {
            d: {
                x: row.icrf_s_x,
                y: row.icrf_s_y,
                z: row.icrf_s_z,
            },
            w: row.icrf_s_w,
        };
        const icrf_sav: avector = (Cosmos.module.a_quaternion2euler(icrf_q));

        // COSMOS module lvlh conversion for second derivative: Angular Vel (rad/s) 
        const vrv: rvector = {
            col: [geoc.v.col[0], geoc.v.col[1], geoc.v.col[2]]
        };
        // COSMOS module lvlh conversion for third derivative: Angular Accel (rad/s2) 
        const arv: rvector = {
            col: [geoc.a.col[0], geoc.a.col[1], geoc.a.col[2]]
        };
        const sunv: rvector = (Cosmos.module.loc2sunv(loc));
        const nadir: rvector = { col: [(-1 * row.eci_s_x), (-1 * row.eci_s_y), (-1 * row.eci_s_z)] };

        const adcs: EulAdcsstruc = {
            // utc: row.time,
            icrfs: icrf_sav,
            q_s: loc.att.icrf.s,
            s: sav,
            v: vrv,
            a: arv,
            sun: sunv,
            nad: nadir,
            sqatt: geoc.s
        };
        //const time  
        ret.push({ Time: row.time, Node_name: row.node_name, Node_type: row.node_type, ...adcs });
    });
    console.log('attitude iret:', rows[0], ret[0]);
    return ret;
};

export const orbit_position = (rows: mysql.RowDataPacket[]) => {
    const ret: Array<gforbit & timepoint & GFNodeType> = [];
    const loc = getNewLocstruc();
    rows.forEach((row) => {
        loc.pos.eci.utc = row.time;
        loc.pos.eci.pass = 1;
        loc.pos.eci.s = { col: [row.eci_s_x, row.eci_s_y, row.eci_s_z] };
        loc.pos.eci.v = { col: [row.eci_v_x, row.eci_v_y, row.eci_v_z] };
        // this object not in database
        // loc.pos.eci.a = { col: [row.eci_a_x, row.eci_a_y, row.eci_a_z] };
        loc.pos.eci.a = { col: [0, 0, 0] };
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
        const eci: cartpos = {
            utc: row.time,
            pass: 1,
            s: { col: [row.eci_s_x, row.eci_s_y, row.eci_s_z] },
            v: { col: [row.eci_v_x, row.eci_v_y, row.eci_v_z] },
            a: { col: [0, 0, 0] }
        }
        loc.att.icrf.v = { col: [row.icrf_v_x, row.icrf_v_y, row.icrf_v_z] };
        const sunbeta: number = (Cosmos.module.loc2kepbeta(loc));
        // const geod: geoidpos = (Cosmos.module.ecitogeod(loc));
        const geod: geoidpos = (Cosmos.module.eci2geod(eci));
        // console.log('sun b', sunbeta);

        const gforbit: gforbit = {
            // utc: row.time,
            eci_s_x: row.eci_s_x,
            eci_s_y: row.eci_s_y,
            eci_s_z: row.eci_s_z,
            geod_s_lat: geod.s.lat,
            geod_s_lon: geod.s.lon,
            geod_s_h: geod.s.h,
            q_s: loc.att.icrf.s,
            sunbeta: sunbeta
        }
        ret.push({ Time: row.time, Node_name: row.node_name, Node_type: row.node_type, ...gforbit });
    });
    console.log('iret:', rows[0], ret[0]);
    return ret;
};

export const eci_position = (rows: mysql.RowDataPacket[]) => {
    const ret: Array<gfcartpos & timepoint & GFNodeType> = [];
    rows.forEach((row) => {
        const gfeci: gfcartpos = {
            // utc: row.time,
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
};

export const geod_position = (rows: mysql.RowDataPacket[]) => {
    const ret: Array<geoidpos & timepoint & GFNodeType> = [];
    const loc = getNewLocstruc();
    rows.forEach((row) => {
        loc.pos.eci.utc = row.time;
        loc.pos.eci.pass = 1;
        loc.pos.eci.s = { col: [row.eci_s_x, row.eci_s_y, row.eci_s_z] };
        loc.pos.eci.v = { col: [row.eci_v_x, row.eci_v_y, row.eci_v_z] };
        // loc.pos.eci.a = { col: [row.eci_a_x, row.eci_a_y, row.eci_a_z] };
        loc.pos.eci.a = { col: [0, 0, 0] };
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
        loc.att.icrf.v = { col: [row.icrf_v_x, row.icrf_v_y, row.icrf_v_z] };
        // const typed_node: GFNodeType = {
        //     name: row.node_name,
        //     type: 0,
        // }

        const geod: geoidpos = (Cosmos.module.ecitogeod(loc));
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
};

export const geos_position = (rows: mysql.RowDataPacket[]) => {
    const ret: Array<spherpos & timepoint & GFNodeType> = [];
    const loc = getNewLocstruc();
    rows.forEach((row) => {
        loc.pos.eci.utc = row.time;
        loc.pos.eci.pass = 1;
        loc.pos.eci.s = { col: [row.eci_s_x, row.eci_s_y, row.eci_s_z] };
        loc.pos.eci.v = { col: [row.eci_v_x, row.eci_v_y, row.eci_v_z] };
        // loc.pos.eci.a = { col: [row.eci_a_x, row.eci_a_y, row.eci_a_z] };
        loc.pos.eci.a = { col: [0, 0, 0] };
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
        loc.att.icrf.v = { col: [row.icrf_v_x, row.icrf_v_y, row.icrf_v_z] };

        const geos: spherpos = (Cosmos.module.loc2geos(loc));
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
    const loc = getNewLocstruc();
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
        loc.att.icrf.v = { col: [row.icrf_v_x, row.icrf_v_y, row.icrf_v_z] };
        const lvlh: qatt = (Cosmos.module.loc2lvlh(loc));
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

// Convert a RowDataPacket row from a locstruc query into a locstruc object
// loc: existing locstruc
// row: a locstruc query result
const locstrucRowToLocstruc = (loc: locstruc, row: mysql.RowDataPacket) => {
    // TODO: add interface definitions
    loc.utc = row.time;
    loc.pos.utc = row.time;
    loc.pos.eci.utc = row.time;
    loc.pos.eci.s.col[0] = row.eci_s_x;
    loc.pos.eci.s.col[1] = row.eci_s_y;
    loc.pos.eci.s.col[2] = row.eci_s_z;
    loc.pos.eci.v.col[0] = row.eci_v_x;
    loc.pos.eci.v.col[1] = row.eci_v_y;
    loc.pos.eci.v.col[2] = row.eci_v_z;
    loc.att.utc = row.time;
    loc.att.icrf.utc = row.time;
    loc.att.icrf.s.w = row.icrf_s_w;
    loc.att.icrf.s.d.x = row.icrf_s_x;
    loc.att.icrf.s.d.y = row.icrf_s_y;
    loc.att.icrf.s.d.z = row.icrf_s_z;
    loc.att.icrf.v.col[0] = row.icrf_v_x;
    loc.att.icrf.v.col[1] = row.icrf_v_y;
    loc.att.icrf.v.col[2] = row.icrf_v_z;
    return loc;
}

export const relative_angle_range = (rows: mysql.RowDataPacket[], originNode: string) => {
    // Assumes the desired node to be the first within each timestamp collection
    const ret: Array<svector & timepoint & GFNodeType> = [];
    if (originNode === undefined || originNode === '') {
        return ret;
    }
    // The current timestamp being handled. Used to determine the collection of new entries for the
    // current timestamp, since it is possible not all nodes will have the same
    let currentTime = 0;
    const locs = new Map<string, locstruc>();
    // Keep track of which locs are newly found. Only compute groundstation() for new/updated entries.
    // If originNode is updated, then recompute for every node.
    const locsUpdated = new Map<string, boolean>();
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        // Perform groundstation() for all new entries found on the previous runs of the same timestamps
        if (row.time > currentTime || i === rows.length) {
            const originNodeUpdated = locsUpdated.get(originNode);
            // Skip computations until originNode has been found
            if (originNodeUpdated !== undefined) {
                // Compute groundstation() for every node if originNode has been updated
                if (originNodeUpdated) {
                    locsUpdated.forEach((_, key) => locsUpdated.set(key, true));
                    locsUpdated.set(originNode, false);
                }
                // Now compute for each updated node
                const originNodeLoc = locs.get(originNode);
                if (originNodeLoc === undefined) {
                    continue;
                }
                locs.forEach((loc, key) => {
                    if (key === originNode) {
                        return;
                    }
                    const locUpdated = locsUpdated.get(key) ?? false;
                    if (!locUpdated) {
                        return;
                    }
                    // TODO: better to handle the need-to-be-geod requirement in c++
                    loc.pos.eci.pass = 99;
                    loc.pos.geod = Cosmos.module.ecitogeod(loc);
                    const relativeAngleRange = Cosmos.module.groundstation(originNodeLoc, loc);
                    ret.push({ Time: currentTime, Node_name: key, Node_type: 0, ...relativeAngleRange });
                    locsUpdated.set(key, false);
                });
            }
            // This logic uses one-past-the-end handling, so break if we really are past the end
            if (i === rows.length) {
                break;
            }
        }
        // This is still within the current collection of the same timestamp,
        // or we have just finished wrapping up the previous collection and have just entered
        // a new timestamp collection (in which case the code block above would have run).
        currentTime = row.time;
        if (locs.get(row.node_name) === undefined) {
            locs.set(row.node_name, getNewLocstruc());
        }
        locstrucRowToLocstruc(locs.get(row.node_name)!, row)
        locsUpdated.set(row.node_name, true);
    }
    console.log('relative_angle_range iret:', rows[0], ret[0]);
    return ret;
}


/// beacon parsing section

// node name needed. append to object for post into SQL database,
// determine when node is assigned, where sourced in beacon parsing

// TODO remaining sql tables for namespace 1.0
// completed: device_swch, device_batt

export const parse_device_swch = (deviceswch: Object): deviceswch[] => {
    const ret: Array<deviceswch> = [];
    let Ob: deviceswch = {
        node_name: "",
        didx: 0,
        utc: 0,
        amp: 0,
        volt: 0,
        power: 0,
        temp: 0,
    };
    for (const [key, value] of Object.entries(deviceswch)) {
        // console.log(`${key}: ${value}`);
        if (key.includes("device_swch_utc")) {
            let tid = key.slice(16, 19);
            // three digit id string is parsed into an integer... i.e. "001" becomes 1
            Ob.didx = parseInt(tid);
            // console.log("didx parsed string to int: ", Ob.didx);
            Ob.utc = value;
        }
        if (key.includes("device_swch_amp") && key.includes(String(Ob.didx))) {
            let tid = key.slice(16, 19);
            Ob.amp = value;
        }
        if (key.includes("device_swch_volt") && key.includes(String(Ob.didx))) {
            let tid = key.slice(17, 20);
            Ob.volt = value;
        }
        if (key.includes("device_swch_power") && key.includes(String(Ob.didx))) {
            let tid = key.slice(18, 21);
            Ob.power = value;
            // runs after all columns have been parsed
            // set type object
            const deviceswchobject: deviceswch = {
                node_name: Ob.node_name,
                utc: Ob.utc,
                didx: Ob.didx,
                amp: Ob.amp,
                volt: Ob.volt,
                power: Ob.power,
                temp: 0,
            };
            // push object to type array
            ret.push(deviceswchobject);
            // reset type object
            Ob.node_name = "";
            Ob.didx = 0;
            Ob.utc = 0;
            Ob.amp = 0;
            Ob.volt = 0;
            Ob.power = 0;
            Ob.temp = 0;
        }
    }
    return ret
};

export const parse_locstruc = (obj: Partial<beacontype>) => {
    if (!is_locstruc_pos_eci_att_icrf(obj.node_loc)) {
        return [];
    }
    if (obj.node_name === undefined) {
        return [];
    }
    const ret: locstruc_table = {
        node_name: obj.node_name,
        utc: obj.node_loc.pos.eci.utc,
        eci_s_x: obj.node_loc.pos.eci.s.col[0],
        eci_s_y: obj.node_loc.pos.eci.s.col[1],
        eci_s_z: obj.node_loc.pos.eci.s.col[2],
        eci_v_x: obj.node_loc.pos.eci.v.col[0],
        eci_v_y: obj.node_loc.pos.eci.v.col[1],
        eci_v_z: obj.node_loc.pos.eci.v.col[2],
        icrf_s_x: obj.node_loc.att.icrf.s.d.x,
        icrf_s_y: obj.node_loc.att.icrf.s.d.y,
        icrf_s_z: obj.node_loc.att.icrf.s.d.z,
        icrf_s_w: obj.node_loc.att.icrf.s.w,
        icrf_v_x: obj.node_loc.att.icrf.v.col[0],
        icrf_v_y: obj.node_loc.att.icrf.v.col[1],
        icrf_v_z: obj.node_loc.att.icrf.v.col[2],
    };

    return [ret];
}

export const parse_node = (obj: Partial<beacontype>) => {
    if (!is_node(obj.node)) {
        return [];
    }
    const ret: node = {
        node_id: obj.node.node_id,
        node_name: obj.node.node_name,
        node_type: obj.node.node_type,
        agent_name: obj.node.agent_name,
        utc: obj.node.utc,
        utcstart: obj.node.utcstart
    };

    return [ret];
}

// Parses the json of an array of targetstrucs into an array of rows of target data
// Called by beacon2obj when a target beacon is to be written to the db
export const parse_target = (obj: Partial<beacontype>): targetstruc[] => {
    if (!Array.isArray(obj.target)) {
        return [];
    }
    const ret: targetstruc[] = [];
    obj.target.forEach((target) => {
        if (!is_targetstruc(target)) {
            return;
        }
        ret.push({
            id: target.id,
            type: target.type,
            name: target.name,
            lat: target.lat,
            lon: target.lon,
            h: target.h,
            area: target.area,
        })
    });

    return ret;
}

// Parses the json of an array of eventstruc into an array of rows of event data
// Called by beacon2obj when a event beacon is to be written to the db
export const parse_event = (obj: Partial<beacontype>): event[] => {
    if (!Array.isArray(obj.event)) {
        return [];
    }
    const ret: event[] = [];
    obj.event.forEach((e) => {
        if (!is_event(e)) {
            return;
        }
        ret.push({
            node_name: e.node_name,
            utc: e.utc,
            duration: e.duration,
            event_id: e.event_id,
            type: e.type,
            event_name: e.event_name,
        })
    });

    return ret;
}

// Parses the json of an array of devicestrucs into an array of rows of device data
// Called by beacon2obj when a device beacon is to be written to the db
export const parse_device = (obj: Partial<beacontype>): device_table[] => {
    if (!Array.isArray(obj.device) || obj.node_name === undefined || typeof obj.node_name !== 'string') {
        return [];
    }
    const ret: device_table[] = [];
    obj.device.forEach((device) => {
        if (!is_devicestruc(device)) {
            return;
        }
        ret.push({
            node_name: obj.node_name!,
            type: device.type,
            cidx: device.cidx,
            didx: device.didx,
            name: device.name,
        })
    });

    return ret;
}

// Parses a json of devspec into an array of rows of specific device data
// Called by beacon2obj when a devspec beacon is to be written to the db
export const parse_devspec = (obj: Partial<beacontype>): [string, table_type[]] => {
    if (obj.devspec === undefined || typeof obj.devspec !== 'object' || obj.node_name === undefined || typeof obj.node_name !== 'string') {
        return ['error', []];
    }
    let device_type: string = '';
    let ret: table_type[] = [];

    if (obj.devspec.batt !== undefined) {
        device_type = 'battstruc';
        ret = parse_devspec_batt(obj.node_name, obj.devspec);
    } else if (obj.devspec.bcreg !== undefined) {
        device_type = 'bcregstruc';
        ret = parse_devspec_bcreg(obj.node_name, obj.devspec);
    } else if (obj.devspec.cpu !== undefined) {
        device_type = 'cpustruc';
        ret = parse_devspec_cpu(obj.node_name, obj.devspec);
    } else if (obj.devspec.tsen !== undefined) {
        device_type = 'tsenstruc';
        ret = parse_devspec_tsen(obj.node_name, obj.devspec);
    } else {
        return ["error", []];
    }
    return [device_type, ret];
}

// Parses a json array of battstrucs into rows of data to be written to the battstruc table
// node_name: The name of the node, determined earlier in the call stack
// devspec: An object containing batt -- an array of battstrucs, type checked inside this function
export const parse_devspec_batt = (node_name: string, devspec: Partial<devspecstruc>): devicebatt[] => {
    if (!Array.isArray(devspec.batt)) {
        return [];
    }
    let ret: devicebatt[] = [];

    devspec.batt.forEach((batt: any) => {
        if (!is_battstruc(batt)) {
            return;
        }
        ret.push({
            node_name: node_name as string,
            didx: batt.didx,
            utc: batt.utc,
            volt: batt.volt,
            amp: batt.amp,
            power: batt.power,
            temp: batt.temp,
            percentage: batt.percentage,
        });
    });

    return ret;
}

// Parses a json array of bcregstrucs into rows of data to be written to the bcreg table
// node_name: The name of the node, determined earlier in the call stack
// devspec: An object containing bcreg -- an array of bcregstrucs, type checked inside this function
export const parse_devspec_bcreg = (node_name: string, devspec: Partial<devspecstruc>): devicebcreg[] => {
    if (!Array.isArray(devspec.bcreg)) {
        return [];
    }
    let ret: devicebcreg[] = [];

    devspec.bcreg.forEach((bcreg: any) => {
        if (!is_bcregstruc(bcreg)) {
            return;
        }
        ret.push({
            node_name: node_name as string,
            didx: bcreg.didx,
            utc: bcreg.utc,
            volt: bcreg.volt,
            amp: bcreg.amp,
            power: bcreg.power,
            temp: bcreg.temp,
            mpptin_amp: bcreg.mpptin_amp,
            mpptin_volt: bcreg.mpptin_volt,
            mpptout_amp: bcreg.mpptout_amp,
            mpptout_volt: bcreg.mpptout_volt,
        });
    });

    return ret;
}

// Parses a json array of cpustrucs into rows of data to be written to the cpu table
// node_name: The name of the node, determined earlier in the call stack
// devspec: An object containing cpu -- an array of cpustrucs, type checked inside this function
export const parse_devspec_cpu = (node_name: string, devspec: Partial<devspecstruc>): devicecpu[] => {
    if (!Array.isArray(devspec.cpu)) {
        return [];
    }
    let ret: devicecpu[] = [];

    devspec.cpu.forEach((cpu: any) => {
        if (!is_cpustruc(cpu)) {
            return;
        }
        ret.push({
            node_name: node_name as string,
            didx: cpu.didx,
            utc: cpu.utc,
            temp: cpu.temp,
            uptime: cpu.uptime,
            load: cpu.load,
            gib: cpu.gib,
            boot_count: cpu.boot_count,
            storage: cpu.storage,
        });
    });

    return ret;
}


// Parses a json array of tsenstrucs into rows of data to be written to the tsen table
// node_name: The name of the node, determined earlier in the call stack
// devspec: An object containing tsen -- an array of tsenstrucs, type checked inside this function
export const parse_devspec_tsen = (node_name: string, devspec: Partial<devspecstruc>): devicetsen[] => {
    if (!Array.isArray(devspec.tsen)) {
        return [];
    }
    let ret: devicetsen[] = [];

    devspec.tsen.forEach((tsen: any) => {
        if (!is_tsenstruc(tsen)) {
            return;
        }
        ret.push({
            node_name: node_name as string,
            didx: tsen.didx,
            utc: tsen.utc,
            temp: tsen.temp,
        });
    });

    return ret;
}

// SQL POST request format must be an array of dictionaries; SQL sub function requires a type specific array of object
// return the table name and list of objects for single type
export const beacon2obj = (beacon: string): [string, cosmos_table_row[]] => {
    const object: Partial<beacontype> = JSON.parse(beacon);
    // console.log("beacon Telem Object fields.value string: ", object);
    // console.log("object 1 key ", Object.entries(object)[1][0]);

    // locstruc
    if (object.node_loc !== undefined) {
        const locstruc_array = parse_locstruc(object);
        if (locstruc_array.length === 0) {
            return ['error', locstruc_array];
        }
        return ['locstruc', locstruc_array];
    }

    // node
    if (object.node !== undefined) {
        const node_array = parse_node(object);
        if (node_array.length === 0) {
            return ['error', node_array];
        }
        return ['node', node_array];
    }

    // target
    if (object.target !== undefined) {
        const target_array = parse_target(object);
        if (target_array.length === 0) {
            return ['error', target_array];
        }
        return ['target', target_array];
    }

    // device
    if (object.device !== undefined) {
        const device_array = parse_device(object);
        if (device_array.length === 0) {
            return ['error', device_array];
        }
        return ['device', device_array];
    }

    // All specific devices
    if (object.devspec !== undefined) {
        const [device_type, devspec_array] = parse_devspec(object);
        if (devspec_array.length === 0) {
            return ['error', devspec_array];
        }
        return [device_type, devspec_array];
    }

    if (object.event !== undefined) {
        const event_array = parse_event(object);
        if (event_array.length === 0) {
            return ['error', event_array];
        }
        return ['cosmos_event', event_array];
    }

    const keycomp: Array<string> = Object.entries(object)[1][0].split('_');
    const typekey: string = keycomp[0] + "_" + keycomp[1];
    // console.log("type key: ", typekey);

    // device_swch
    if (typekey == "device_swch") {
        // function to parse device swch, returns list of objects for type
        const device_swch_array = parse_device_swch(object);
        // add the format ["sqlTableName", [{}, {}, {}, ...]] for the response to the db.ts call
        // console.log("device object type: ", (ret)[0]);
        return ["swchstruc", device_swch_array];
    }

    return ['error', []];
};

