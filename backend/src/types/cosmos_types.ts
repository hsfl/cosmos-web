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
    a_quaternion2euler: (arg:any) => avector;
}

export interface avector {
    h:number;
    e:number;
    b:number;
}

export interface cvector {
    x:number;
    y:number;
    z:number;
}

export interface quaternion {
    d:cvector;
    w:number;
}

// Merge with any other interface to associate it with a timestamp
export interface timepoint {
    Time: number;
}

export interface TimeRange {
    from: string;
    to: string;
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
