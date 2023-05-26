import { CosmosModule, quaternion, avector, timepoint, locstruc, spherpos, qatt, geoidpos, gfcartpos, svector, is_locstruc_pos_eci_att_icrf } from '../types/cosmos_types';
import mysql from 'mysql2';
import { GFNodeType, deviceswch, devicebatt, beacontype, locstruc_table, node, is_node } from '../database/BaseDatabase';


const COSMOSJS = require('/root/web_core_dist/CosmosWebCore.js');
// TODO: probably a better way of loading binary compilation of COSMOS C++ functions 
let cosmos: CosmosModule;
COSMOSJS().then((cosmos_module: CosmosModule) => {
    cosmos = cosmos_module;
    console.log('CosmosModule successfully imported');
    return;
});

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
        const av: avector = (cosmos.a_quaternion2euler(q));
        //const time  
        ret.push({ Time: row.time, Node_name: row.node_name, Node_type: row.node_type, ...av });
    });
    console.log('attitude iret:', rows[0], ret[0]);
    return ret;
};

const getNewLocstruc = ():  locstruc => ({
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
    const loc = getNewLocstruc();
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
    const loc = getNewLocstruc();
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
    for (let i=0; i<rows.length; i++) {
        const row = rows[i];
        // Perform groundstation() for all new entries found on the previous runs of the same timestamps
        if (row.time > currentTime || i === rows.length) {
            const originNodeUpdated = locsUpdated.get(originNode);
            // Skip computations until originNode has been found
            if (originNodeUpdated !== undefined) {
                // Compute groundstation() for every node if originNode has been updated
                if (originNodeUpdated) {
                    locsUpdated.forEach((_,key) => locsUpdated.set(key, true));
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
                    loc.pos.geod = cosmos.ecitogeod(loc);
                    const relativeAngleRange = cosmos.groundstation(originNodeLoc, loc);
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

export const parse_device_swch = (deviceswch: Object) : deviceswch[] => {
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

export const parse_device_batt = (devicebatt: Object) => {
    const ret: Array<devicebatt> = [];
    let Ob: devicebatt = {
        node_name: "",
        didx: 0,
        utc: 0,
        amp: 0,
        volt: 0,
        power: 0,
        temp: 0,
        percentage: 0,
    };
    for (const [key, value] of Object.entries(devicebatt)) {
        // console.log(`${key}: ${value}`);
        if (key.includes("device_batt_utc")) {
            let tid = key.slice(16, 19);
            // three digit id string is parsed into an integer... i.e. "001" becomes 1
            Ob.didx = parseInt(tid);
            // console.log("didx parsed string to int: ", Ob.didx);
            Ob.utc = value;
        }
        if (key.includes("device_batt_amp") && key.includes(String(Ob.didx))) {
            let tid = key.slice(16, 19);
            Ob.amp = value;
        }
        if (key.includes("device_batt_volt") && key.includes(String(Ob.didx))) {
            let tid = key.slice(17, 20);
            Ob.volt = value;
        }
        if (key.includes("device_batt_power") && key.includes(String(Ob.didx))) {
            let tid = key.slice(18, 21);
            Ob.power = value;
        }
        if (key.includes("device_batt_temp") && key.includes(String(Ob.didx))) {
            let tid = key.slice(17, 20);
            Ob.temp = value;
        }
        if (key.includes("device_batt_percentage") && key.includes(String(Ob.didx))) {
            let tid = key.slice(23, 26);
            Ob.percentage = value;
            // runs after all columns have been parsed
            // set type object
            const device_batt_object: devicebatt = {
                node_name: Ob.node_name,
                utc: Ob.utc,
                didx: Ob.didx,
                amp: Ob.amp,
                volt: Ob.volt,
                power: Ob.power,
                temp: Ob.temp,
                percentage: Ob.percentage
            };
            // push object to type array
            ret.push(device_batt_object);
            // reset type object
            Ob.node_name = "";
            Ob.didx = 0;
            Ob.utc = 0;
            Ob.amp = 0;
            Ob.volt = 0;
            Ob.power = 0;
            Ob.temp = 0;
            Ob.percentage = 0;
        }
    }
    return ret
};

export const parse_locstruc = (loc: Object) => {
    let obj: locstruc_table = {
        node_name: "",
        utc: 0,
        eci_s_x: 0,
        eci_s_y: 0,
        eci_s_z: 0,
        eci_v_x: 0,
        eci_v_y: 0,
        eci_v_z: 0,
        icrf_s_x: 0,
        icrf_s_y: 0,
        icrf_s_z: 0,
        icrf_s_w: 0,
        icrf_v_x: 0,
        icrf_v_y: 0,
        icrf_v_z: 0,
    };
    for (const [k,v] of Object.entries(loc)) {
        switch(k) {
        case "node_loc":
            if (!is_locstruc_pos_eci_att_icrf(v)) {
                return [];
            }
            const node_loc = v as locstruc;
            obj.utc = node_loc.pos.eci.utc;
            obj.eci_s_x = node_loc.pos.eci.s.col[0];
            obj.eci_s_y = node_loc.pos.eci.s.col[1];
            obj.eci_s_z = node_loc.pos.eci.s.col[2];
            obj.eci_v_x = node_loc.pos.eci.v.col[0];
            obj.eci_v_y = node_loc.pos.eci.v.col[1];
            obj.eci_v_z = node_loc.pos.eci.v.col[2];
            obj.icrf_s_w = node_loc.att.icrf.s.w;
            obj.icrf_s_x = node_loc.att.icrf.s.d.x;
            obj.icrf_s_y = node_loc.att.icrf.s.d.y;
            obj.icrf_s_z = node_loc.att.icrf.s.d.z;
            obj.icrf_v_x = node_loc.att.icrf.v.col[0];
            obj.icrf_v_y = node_loc.att.icrf.v.col[1];
            obj.icrf_v_z = node_loc.att.icrf.v.col[2];
        break;
        case "node_name":
            obj.node_name = v;
        break;
        default:
            return [];
        }
    }

    return [obj];
}

export const parse_node = (obj: Object) => {
    let node: node = {
        node_id: 0,
        node_name: '',
        node_type: 0,
        agent_name: '',
        utc: 0,
        utcstart: 0
    };
    for (const [k,v] of Object.entries(obj)) {
        switch(k) {
        case "node":
            if (!is_node(v)) {
                return [];
            }
            const v_as_node = v as node;
            node.node_id = v_as_node.node_id;
            node.node_name = v_as_node.node_name;
            node.node_type = v_as_node.node_type;
            node.agent_name = v_as_node.agent_name;
            node.utc = v_as_node.utc;
            node.utcstart = v_as_node.utcstart;
        break;
        default:
            return [];
        }
    }

    return [node];
}

// SQL POST request format must be an array of dictionaries; SQL sub function requires a type specific array of object
// return list of objects for single type
export const beacon2obj = (beacon: string): [string, beacontype[] | []] => {
    const object: Object = JSON.parse(beacon);
    // console.log("beacon Telem Object fields.value string: ", object);
    // console.log("object 1 key ", Object.entries(object)[1][0]);

    // locstruc
    if ('node_loc' in object) {
        const locstruc_array = parse_locstruc(object);
        if (locstruc_array.length === 0) {
            return ['error', locstruc_array];
        }
        return ['locstruc', locstruc_array];
    }

    // node
    if ("node" in object) {
        const node_array = parse_node(object);
        if (node_array.length === 0) {
            return ['error', node_array];
        }
        return ['node', node_array];
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

    // device_batt
    if (typekey == "device_batt") {
        // function to parse device batt, returns list of objects for type
        const device_batt_array = parse_device_batt(object);
        // add the format ["sqlTableName", [{}, {}, {}, ...]] for the response to the db.ts call
        // console.log("device object type: ", (ret)[0]);
        return ["battstruc", device_batt_array];
    }

    return ["error", []];
};

