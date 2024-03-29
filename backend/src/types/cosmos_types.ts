import {node, event} from "database/BaseDatabase";

export interface attitude {
    node_id: number;
    node_loc_att_icrf_utc: number;
    node_loc_att_icrf_s_d_x: number;
    node_loc_att_icrf_s_d_y: number;
    node_loc_att_icrf_s_d_z: number;
    node_loc_att_icrf_s_w: number;
}

export interface CosmosModule {
    a_quaternion2euler: (arg: any) => avector;
    ecitogeod: (arg: any) => geoidpos;
    check_get_cos: (arg: any) => string;
    loc2lvlh: (arg: any) => qatt; //(arg: [number, string]) => ((arg0: number, arg1: string) // => (arg0: cartpos, arg1: qatt)  
    loc2geoc: (arg: any) => qatt;
    loc2eci: (arg: any) => cartpos;
    loc2geos: (arg: any) => spherpos;
    loc2sunv: (arg: any) => rvector;
    eci2geod: (arg: any) => geoidpos;
    loc2kepbeta: (arg: any) => number;
    loc2mtrtorq: (loc: locstruc, mtr: cosmos_mtrstruc) => number;
    loc2rwtorq: (loc: locstruc, rw: cosmos_rwstruc) => number;
    groundstation: (satellite: locstruc, groundstation: locstruc) => svector;
}

export interface avector {
    h: number;
    e: number;
    b: number;
}

// reference class for aattstruc; that is icrf/ lvlh type
// TODO update, this is wrong. attempted to combine s attitude of avector with v + a velocity and accl rvectors. 
// rename to custom type for ADCS return
export interface adcsstruc {
    // utc: number; // double
    q_s: quaternion;
    s: avector;
    v: rvector;
    a: rvector;
    sun: rvector;
    nad: rvector;
}

export interface EulAdcsstruc {
    // utc: number; // double
    icrfs: avector;
    q_s: quaternion;
    s: avector;
    v: rvector;
    a: rvector;
    sun: rvector;
    nad: rvector;
    sqatt: quaternion;
}

export interface gfadcstotal {
    s: avector;
    v: rvector;
    a: rvector;
    v_deg: rvector;
    pos_geod_s: gvector;
}

export interface cvector {
    x: number;
    y: number;
    z: number;
}

export function is_cvector(obj: any): obj is rvector {
    return (typeof obj.x === 'number' && typeof obj.y === 'number' && typeof obj.z === 'number')
}

export interface quaternion {
    d: cvector;
    w: number;
}

export function is_quaternion(obj: any): obj is quaternion {
    if (obj === undefined) {
        return false;
    }
    return (is_cvector(obj.d) && typeof obj.w === 'number');
}

// Merge with any other interface to associate it with a timestamp
export interface timepoint {
    Time: number;
}

export interface TimeRange {
    from: number;
    to: number;
}

// export interface LocType {
//     from: number;
//     to: number;
//     type: string;
// }

export interface EventType {
    eventid: number;
}

export interface NowType {
    from: number;
    to: number;
    type: string;
    latestOnly: boolean;
}

export interface KeyType {
    dtype: number;
    dname: string;
}

export interface qsatt {
    qsx: number;
    qsy: number;
    qsz: number;
}
export interface qvatt {
    qvx: number;
    qvy: number;
    qvz: number;
}
export interface qaatt {
    qax: number;
    qay: number;
    qaz: number;
}
export interface TimePacket {
    "Time"?: number;
    [column: string]: any;
}

export interface cosmosresponse {
    [column: string]: TimePacket[];
}

//ECI to Geod types
export interface locstruc {
    utc: number;
    pos: posstruc;
    att: attstruc;
}

export function is_locstruc_pos_eci_att_icrf(obj: any): obj is locstruc {
    if (obj === undefined) {
        return false;
    }
    return is_posstruc_eci(obj.pos) && is_attstruc_icrf(obj.att);
}

export interface posstruc {
    utc: number; // double
    icrf: cartpos;
    eci: cartpos;
    sci: cartpos;
    geoc: cartpos;
    selc: cartpos;
    geod: geoidpos; // geoidpos
    selg: geoidpos; // geoidpos
    //
    geos: spherpos; // spherpos
    //
    extra: extrapos; // extrapos
    earthsep: number; // float
    moonsep: number; // float
    sunsize: number; // float
    sunradiance: number; // float
    bearth: rvector;
    orbit: number; // double
}

export function is_posstruc_eci(obj: any): obj is posstruc {
    if (obj === undefined) {
        return false;
    }
    return is_cartpos_s_v(obj.eci);
}

export interface cartpos {
    utc: number; // double
    s: rvector; // rvector
    v: rvector; // rvector
    a: rvector; // rvector
    pass: number; // uint32_t
}

export function is_cartpos_s_v(obj: any): obj is cartpos {
    if (obj === undefined) {
        return false;
    }
    return (typeof obj.utc === 'number' && is_rvector(obj.s) && is_rvector(obj.v));
}


// grafana parsed solution
export interface gfcartpos {
    // utc: number; // double
    s_x: number;
    s_y: number;
    s_z: number;
    v_x: number;
    v_y: number;
    v_z: number;
    a_x: number;
    a_y: number;
    a_z: number;
}

export interface gforbit {
    // utc: number; // double
    eci_s_x: number;
    eci_s_y: number;
    eci_s_z: number;
    geod_s_lat: number;
    geod_s_lon: number;
    geod_s_h: number;
    q_s: quaternion;
    // v_x: number;
    // v_y: number;
    // v_z: number;
    // a_x: number;
    // a_y: number;
    // a_z: number;
    sunbeta: number;
}

export interface rvector {
    col: [number, number, number];
}

export function is_rvector(obj: any): obj is rvector {
    if (!Array.isArray(obj.col)) {
        return false;
    }
    const arr = obj.col as Array<any>;
    if (arr.length !== 3) {
        return false;
    }
    return arr.every(item => typeof item === "number");
}

export interface attstruc {
    utc: number; // double
    topo: qatt; // qatt
    lvlh: qatt; // qatt
    geoc: qatt; // qatt
    selc: qatt; // qatt
    icrf: qatt; // qatt
    extra: extraatt; // extraatt
}

export function is_attstruc_icrf(obj: any): obj is attstruc {
    if (obj === undefined) {
        return false;
    }
    return is_qatt_s_v(obj.icrf);
}

// reference class for geoidpos
export interface geoidpos {
    utc: number; // double
    s: gvector;
    v: gvector;
    a: gvector;
    pass: number; // uint32_t
}

// grafana parsed solution
export interface gfgeoidpos {
    utc: number; // double
    s_lat: number;
    s_lon: number;
    s_h: number;
    v_lat: number;
    v_lon: number;
    v_h: number;
    a_lat: number;
    a_lon: number;
    a_h: number;
}

export interface gvector {
    lat: number; // double
    lon: number; // double
    h: number; // double
}

//refernece class for spherpos
export interface spherpos {
    utc: number; // double
    s: svector;
    v: svector;
    a: svector;
    pass: number; // uint32_t
}

// grafana parsed solution
export interface gfspherpos {
    utc: number; // double
    s_phi: number; // double
    s_lambda: number; // double
    s_r: number; // double
    v_phi: number; // double
    v_lambda: number; // double
    v_r: number; // double
    a_phi: number; // double
    a_lambda: number; // double
    a_r: number; // double
}

export interface svector {
    phi: number; // double
    lambda: number; // double
    r: number; // double
}

// reference class for qatt
export interface qatt {
    utc: number; // double
    s: quaternion;
    v: rvector;
    a: rvector;
    pass: number; // uint32_t
}

export function is_qatt_s_v(obj: any): obj is qatt {
    if (obj === undefined) {
        return false;
    }
    return (typeof obj.utc === 'number' && is_quaternion(obj.s) && is_rvector(obj.v));
}

// grafana parsed solution
export interface gfqatt {
    utc: number; // double
    s_d_x: number;
    s_d_y: number;
    s_d_z: number;
    s_w: number;
    v_x: number;
    v_y: number;
    v_z: number;
    a_x: number;
    a_y: number;
    a_z: number;
}

// struct extrapos 
export interface extrapos {
    utc: number; // double
    tt: number; // double
    ut: number; // double
    tdb: number; // double
    j2e: rmatrix;
    dj2e: rmatrix;
    ddj2e: rmatrix;
    //
    e2j: rmatrix;
    de2j: rmatrix;
    dde2j: rmatrix;
    j2t: rmatrix;
    j2s: rmatrix;
    t2j: rmatrix;
    s2j: rmatrix;
    s2t: rmatrix;
    ds2t: rmatrix;
    t2s: rmatrix;
    dt2s: rmatrix;
    sun2earth: cartpos;
    sungeo: gvector;
    sun2moon: cartpos;
    moongeo: gvector;
    closest: number; //uint16_t
}

// extraatt class
export interface extraatt {
    utc: number; // double
    j2b: rmatrix; //! Transform from ICRF to Body frame
    b2j: rmatrix; //! Transform from Body frame to ICRF
}

// rmatrix
export interface rmatrix {
    row: [rvector, rvector, rvector];
}

// Beacons received for writing to the db, essentially a cosmosstruc
// The type after JSON unmarshalling a beacon.
// Utilize this interface as Partial<beacontype> and perform explicit
// member checking.
export interface beacontype {
    node_name: string;
    node_loc: Partial<locstruc>;
    node: Partial<node>;
    target: Partial<targetstruc>;
    device: Partial<devicestruc>[];
    devspec: Partial<devspecstruc>;
    event: Partial<event>;
}

// Cosmos type

export interface targetstruc {
    id: number;
    type: number;
    name: string;
    lat: number;
    lon: number;
    h: number;
    area: number;
}

export function is_targetstruc(obj: any): obj is targetstruc {
    if (obj === undefined) {
        return false;
    }
    return (
        typeof obj.id === 'number'
        && typeof obj.type === 'number'
        && typeof obj.name === 'string'
        && typeof obj.lat === 'number'
        && typeof obj.lon === 'number'
        && typeof obj.h === 'number'
        && typeof obj.area === 'number'
    );
}

export interface devicestruc {
    type: number;
    cidx: number;
    didx: number;
    name: string;
}

export function is_devicestruc(obj: any): obj is devicestruc {
    if (obj === undefined) {
        return false;
    }
    return (
        typeof obj.type === 'number'
        && typeof obj.cidx === 'number'
        && typeof obj.didx === 'number'
        && typeof obj.name === 'string'
    );
}

// Cosmos type
export interface devspecstruc {
    batt: battstruc[];
    bcreg: bcregstruc[];
    cpu: cpustruc[];
    tsen: tsenstruc[];
    gps: beacon_gpsstruc[];
    imu: beacon_imustruc[];
    ssen: beacon_ssenstruc[];
    mtr: beacon_mtrstruc[];
    rw: beacon_rwstruc[];
}

// Cosmos type
export interface battstruc {
    didx: number;
    utc: number;
    volt: number;
    amp: number;
    power: number;
    temp: number;
    percentage: number;
}

export function is_battstruc(obj: any): obj is battstruc {
    if (obj === undefined) {
        return false;
    }
    return (
        typeof obj.didx === 'number'
        && typeof obj.utc === 'number'
        && typeof obj.volt === 'number'
        && typeof obj.amp === 'number'
        && typeof obj.power === 'number'
        && typeof obj.temp === 'number'
        && typeof obj.percentage === 'number'
    );
}

// Cosmos type
export interface bcregstruc {
    didx: number;
    utc: number;
    volt: number;
    amp: number;
    power: number;
    temp: number;
    mpptin_amp: number;
    mpptin_volt: number;
    mpptout_amp: number;
    mpptout_volt: number;
}

export function is_bcregstruc(obj: any): obj is bcregstruc {
    if (obj === undefined) {
        return false;
    }
    return (
        typeof obj.didx === 'number'
        && typeof obj.utc === 'number'
        && typeof obj.volt === 'number'
        && typeof obj.amp === 'number'
        && typeof obj.power === 'number'
        && typeof obj.temp === 'number'
        && typeof obj.mpptin_amp === 'number'
        && typeof obj.mpptin_volt === 'number'
        && typeof obj.mpptout_amp === 'number'
        && typeof obj.mpptout_volt === 'number'
    );
}

// Cosmos type
export interface cpustruc {
    didx: number;
    utc: number;
    temp: number;
    uptime: number;
    load: number;
    gib: number;
    boot_count: number;
    storage: number;
}

export function is_cpustruc(obj: any): obj is cpustruc {
    if (obj === undefined) {
        return false;
    }
    return (
        typeof obj.didx === 'number'
        && typeof obj.utc === 'number'
        && typeof obj.temp === 'number'
        && typeof obj.uptime === 'number'
        && typeof obj.load === 'number'
        && typeof obj.gib === 'number'
        && typeof obj.boot_count === 'number'
        && typeof obj.storage === 'number'
    );
}

// Cosmos type
export interface tsenstruc {
    didx: number;
    utc: number;
    temp: number;
}

export function is_tsenstruc(obj: any): obj is tsenstruc {
    if (obj === undefined) {
        return false;
    }
    return (
        typeof obj.didx === 'number'
        && typeof obj.utc === 'number'
        && typeof obj.temp === 'number'
    );
}

// beacon_gpsstruc
// beacon type
export interface beacon_gpsstruc {
    didx: number;
    utc: number;
    geocs: rvector;
    geods: gvector;
}

export function is_beacon_gpsstruc(obj: any): obj is beacon_gpsstruc {
    if (obj === undefined) {
        return false;
    }
    return (
        typeof obj.didx === 'number'
        && typeof obj.utc === 'number'
        && typeof obj.geocs.col[0] === 'number'
        && typeof obj.geocs.col[1] === 'number'
        && typeof obj.geocs.col[2] === 'number'
        && typeof obj.geods.lat === 'number'
        && typeof obj.geods.lon === 'number'
        && typeof obj.geods.h === 'number'
    );
}

// beacon_imustruc
// beacon type
export interface beacon_imustruc {
    didx: number;
    utc: number;
    mag: rvector;
    omega: rvector;
    theta: quaternion;
}

export function is_beacon_imustruc(obj: any): obj is beacon_imustruc {
    if (obj === undefined) {
        return false;
    }
    return (
        typeof obj.didx === 'number'
        && typeof obj.utc === 'number'
        && typeof obj.mag.col[0] === 'number'
        && typeof obj.mag.col[1] === 'number'
        && typeof obj.mag.col[2] === 'number'
        && typeof obj.omega.col[0] === 'number'
        && typeof obj.omega.col[1] === 'number'
        && typeof obj.omega.col[2] === 'number'
        && typeof obj.theta.d.x === 'number'
        && typeof obj.theta.d.y === 'number'
        && typeof obj.theta.d.z === 'number'
        && typeof obj.theta.w === 'number'
    );
}

// beacon_ssenstruc
// beacon type
export interface beacon_ssenstruc {
    didx: number;
    utc: number;
    azimuth: number;
    elevation: number;
    qva: number;
    qvb: number;
    qvc: number;
    qvd: number;
}

export function is_beacon_ssenstruc(obj: any): obj is beacon_ssenstruc {
    if (obj === undefined) {
        return false;
    }
    return (
        typeof obj.didx === 'number'
        && typeof obj.utc === 'number'
        && typeof obj.azimuth === 'number'
        && typeof obj.elevation === 'number'
        && typeof obj.qva === 'number'
        && typeof obj.qvb === 'number'
        && typeof obj.qvc === 'number'
        && typeof obj.qvd === 'number'
    );
}

// Cosmos type
export interface cosmos_mtrstruc {
    align: quaternion;
    npoly: [number, number, number, number, number, number, number];
    ppoly: [number, number, number, number, number, number, number];
    mxmom: number;
    tc: number;
    rmom: number;
    mom: number;
}
// Grafana type
export interface GF_mtr_torque {
    time: number;
    amp: number;
    torq: number;
}
// beacon type
export interface beacon_mtrstruc {
    align: quaternion;
    didx: number;
    utc: number;
    mom: number;
    amp: number;
}

export function is_beacon_mtrstruc(obj: any): obj is beacon_mtrstruc {
    if (obj === undefined) {
        return false;
    }
    return (
        typeof obj.didx === 'number'
        && typeof obj.utc === 'number'
        && typeof obj.mom === 'number'
        && typeof obj.amp === 'number'
        && typeof obj.align.d.x === 'number'
        && typeof obj.align.d.y === 'number'
        && typeof obj.align.d.z === 'number'
        && typeof obj.align.w === 'number'
    );
}

// Cosmos type
export interface cosmos_rwstruc {
    align: quaternion;
    mom: rvector;
    mxomg: number;
    mxalp: number;
    tc: number;
    omg: number;
    alp: number;
    romg: number;
    ralp: number;
}
// Grafana type
export interface GF_rw_torque {
    time: number;
    omg: number;
    torq: number;
}
// beacon type
export interface beacon_rwstruc {
    align: quaternion;
    utc: number;
    didx: number;
    omg: number;
    romg: number;
    amp: number;
}

export function is_beacon_rwstruc(obj: any): obj is beacon_rwstruc {
    if (obj === undefined) {
        return false;
    }
    return (
        typeof obj.didx === 'number'
        && typeof obj.utc === 'number'
        && typeof obj.omg === 'number'
        && typeof obj.romg === 'number'
        && typeof obj.amp === 'number'
        && typeof obj.align.d.x === 'number'
        && typeof obj.align.d.y === 'number'
        && typeof obj.align.d.z === 'number'
        && typeof obj.align.w === 'number'
    );
}
