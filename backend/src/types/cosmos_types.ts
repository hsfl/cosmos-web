export interface cosmos_types {

}

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
    loc2eci: (arg: any) => cartpos;
    loc2geos: (arg: any) => spherpos;
    eci2geod: (arg: any) => geoidpos;
}

export interface avector {
    h: number;
    e: number;
    b: number;
}

export interface cvector {
    x: number;
    y: number;
    z: number;
}

export interface quaternion {
    d: cvector;
    w: number;
}

// Merge with any other interface to associate it with a timestamp
export interface timepoint {
    Time: number;
}

export interface TimeRange {
    from: number;
    to: number;
}

export interface LocType {
    from: number;
    to: number;
    type: string;
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

export interface cartpos {
    utc: number; // double
    s: rvector; // rvector
    v: rvector; // rvector
    a: rvector; // rvector
    pass: number; // uint32_t
}

// grafana parsed solution
export interface gfcartpos {
    utc: number; // double
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

export interface rvector {
    col: [number, number, number];
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