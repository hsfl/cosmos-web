import { cosmosresponse, TimeRange, KeyType } from '../types/cosmos_types';
import { QueryType } from 'types/query_types';

// map of cosmos sql tables; 
// note the column order must match sql order; key names must match sql table names; naming must be exact
export const sqlmap: Object = {
    "swchstruc": ["node_name", "didx", "utc", "volt", "amp", "power", "temp"],
    "battstruc": ["node_name", "didx", "utc", "volt", "amp", "power", "temp", "percentage"],
    "bcregstruc": ["node_name", "didx", "utc", "volt", "amp", "power", "temp", "mpptin_amp", "mpptin_volt", "mpptout_amp", "mpptout_volt"],
    "cpustruc": ["node_name", "didx", "utc", "temp", "uptime", "load", "gib", "boot_count", "storage"],
    "device": ["node_name", "type", "cidx", "didx", "name"],
    "device_type": ["name", "id"],
    "locstruc": ["node_name", "utc", "eci_s_x", "eci_s_y", "eci_s_z", "eci_v_x", "eci_v_y", "eci_v_z", "icrf_s_x", "icrf_s_y", "icrf_s_z", "icrf_s_w", "icrf_v_x", "icrf_v_y", "icrf_v_z"],
    "magstruc": ["node_name", "didx", "utc", "mag_x", "mag_y", "mag_z"],
    "node": ["node_id", "node_name", "node_type", "agent_name", "utc", "utcstart"],
    "tsenstruc": ["node_name", "didx", "utc", "temp"],
    "resource": ["id", "name", "type", "min_level", "max_level"],
    "event": ["id", "name", "type", "duration_seconds"],
    "event_resource_impact": ["event_id", "resource_id", "second_index", "resource_change"]
}

// ADD PRIMARY KEY FOR CONDITIONAL QUERY TO MAP
// group by unique key, not primary key (not utc) for max aggregation function... 
// needed? or is it to query all of the type at latest timestamp... 
export const sqlquerykeymap: Object = {
    "swchstruc": ["node_name", "didx"],
    "battstruc": ["node_name", "didx"],
    "bcregstruc": ["node_name", "didx"],
    "cpustruc": ["node_name", "didx"],
    "device": ["node_name", "type", "didx"], // is type needed
    "device_type": ["id"],
    "locstruc": ["node_name"],
    "magstruc": ["node_name", "didx"],
    "node": ["node_name"],
    "tsenstruc": ["node_name", "didx"]
}

// iCOSMOS front end query to database tables
// Key: Front end Query parameter
// Value: DB table

// export const queryOptions: Array<SelectOption<string>> = [
//     { label: 'Attitude', value: 'attitude' },
//     { label: 'Position', value: 'position' },
//     { label: 'Battery', value: 'battery' },
//     { label: 'BC Regulator', value: 'bcreg' },
//     { label: 'CPU', value: 'cpu' },
//     { label: 'Events', value: 'event' },
//     { label: 'Thermal', value: 'tsen' },
//     { label: 'Nodal Awareness', value: 'nodalaware', description: 'Relative angle/range to other nodes' },
//   ];
export const sqlquerytranslate: Object = {
    // "": "swchstruc",
    "battery": "battstruc",
    "bcreg": "bcregstruc",
    "cpu": "cpustruc",
    // "": "device",
    // "": "device_type",
    "position": "locstruc",
    "attitude": "locstruc",
    // "": "magstruc",
    // "": "node",
    "tsen": "tsenstruc",
}

export interface TelegrafMetric {
    fields: {
        value: string;
    };
    name: string;
    tags: {
        host: string;
    };
    timestamp: number;
}

export interface TelegrafBody {
    metrics: TelegrafMetric[]
}

export interface EventResourceImpact {
    second_index: number;
    resource_change: number;
}

export interface EventResourceUpdateBody {
    resource_id: number;
    resource_name: string;
    row_packet: EventResourceImpact[];
}

export interface EventResourceUpdate {
    event_id: number;
    event_name: string;
    update: EventResourceUpdateBody[];
}

export interface MissionEvent {
    event_id: number;
    event_name: string;
    event_type: string;
    event_duration: number;
}

export interface node {
    node_id: number;
    node_name: string;
    node_type: number;
    agent_name: string;
    utc: number;
    utcstart: number;
}

export function is_node(obj: any): obj is node {
    if (obj === undefined) {
        return false;
    }
    return (
        typeof obj.node_id === 'number'
        && typeof obj.node_name === 'string'
        && typeof obj.node_type === 'number'
        && typeof obj.agent_name === 'string'
        && typeof obj.utc === 'number'
        && typeof obj.utcstart === 'number'
    );
}

export type cosmos_table_row = device_table | deviceswch | devicebatt | devicebcreg | devicetsen | devicecpu | devicemag | devicegyro | devicemtr | devicerw | locstruc_table | node;

// swchstruc sql
export interface deviceswch {
    node_name: string;
    didx: number;
    utc: number; // utc
    volt: number;
    amp: number;
    power: number;
    temp: number;
}

export type table_type = devicebatt | devicebcreg | devicecpu | devicetsen;

// battstruc sql
export interface devicebatt {
    node_name: string;
    didx: number;
    utc: number; // utc
    volt: number;
    amp: number;
    power: number;
    temp: number;
    percentage: number;
}

// bcregstruc sql
export interface devicebcreg {
    node_name: string;
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

// tsenstruc sql
export interface devicetsen {
    node_name: string;
    didx: number;
    utc: number;
    temp: number;
}

// cpustruc sql
export interface devicecpu {
    node_name: string;
    didx: number;
    utc: number;
    temp: number;
    uptime: number;
    load: number;
    gib: number;
    boot_count: number;
    storage: number;
}

// magstruc sql
export interface devicemag {
    node_device: string;
    didx: number;
    time: number; // utc
    mag_x: number;
    mag_y: number;
    mag_z: number;
}

// gyrostruc sql
export interface devicegyro {
    node_device: string;
    didx: number;
    time: number; // utc
    omega: number;
}

// mtrstruc sql
export interface devicemtr {
    node_device: string;
    didx: number;
    time: number; // utc
    mom: number;
    align_w: number;
    align_x: number;
    align_y: number;
    align_z: number;
}

// rwstruc sql
export interface devicerw {
    node_device: string;
    didx: number;
    time: number; // utc
    amp: number;
    omg: number;
    romg: number;
}

// locstruc sql
export interface locstruc_table {
    node_name: string;
    utc: number;
    eci_s_x: number;
    eci_s_y: number;
    eci_s_z: number;
    eci_v_x: number;
    eci_v_y: number;
    eci_v_z: number;
    icrf_s_x: number;
    icrf_s_y: number;
    icrf_s_z: number;
    icrf_s_w: number;
    icrf_v_x: number;
    icrf_v_y: number;
    icrf_v_z: number;
}

// 34 device types in Cosmos jsondef.h ... sql tables for 9 device struc types ... 

export interface GFNodeType {
    Node_name: string;
    Node_type: number;
}

export interface device_table {
    node_name: string;
    type: number;
    cidx: number;
    didx: number;
    name: string;
}

// Base database class, derived classes should override the interfaces
export default class BaseDatabase {
    constructor() { }

    public async end_connection(): Promise<void> {
        console.log('Clear database');
    }

    public async clearDatabase(): Promise<void> {
        console.log('Clear database');
    }

    public async init_tables(): Promise<void> {
        console.log('Init database');
    }

    public async write_telem(telem: TelegrafMetric[]): Promise<void> {
        console.log('Writing telem point', telem);
    }

    public async reset_db(tableArray: any[]): Promise<void> {
        console.log('Reset database, clearing data')
    }

    public async write_device(devices: device_table[]): Promise<void> {
        console.log('Writing devices', devices);
    }

    public async update_eventresourceimpact(event_id: number, resourceimpact: EventResourceUpdateBody[]): Promise<void> {
        console.log('Writing event resource impact updates');
    }

    public async get_attitude(query: QueryType): Promise<cosmosresponse> {
        console.log('Getting attitude');
        return {};
    }

    public async get_position(query: QueryType): Promise<cosmosresponse> {
        console.log('Getting position');
        return {};
    }

    public async get_relative_angle_range(query: QueryType): Promise<cosmosresponse> {
        console.log('Getting relative angle and ranges');
        return {};
    }

    public async get_battery(query: QueryType): Promise<cosmosresponse> {
        console.log('Getting batteries');
        return {};
    }

    public async get_bcreg(query: QueryType): Promise<cosmosresponse> {
        console.log('Getting bcregs');
        return {};
    }

    public async get_tsen(query: QueryType): Promise<cosmosresponse> {
        console.log('Getting tsens');
        return {};
    }

    public async get_cpu(query: QueryType): Promise<cosmosresponse> {
        console.log('Getting cpus');
        return {};
    }

    public async get_event(query: QueryType): Promise<cosmosresponse> {
        console.log('Getting events');
        return {};
    }

    public async get_event_list(): Promise<cosmosresponse> {
        console.log('Getting events list');
        return {};
    }

    public async get_resource_list(): Promise<cosmosresponse> {
        console.log('Getting resource list');
        return {};
    }

    public async get_event_resource_list(eventid: number): Promise<cosmosresponse> {
        console.log('Getting event resource list');
        return {};
    }


    public async get_event_resource_impact(keytype: KeyType): Promise<cosmosresponse> {
        console.log('Getting event resource impact list');
        return {};
    }

    public async get_mag(query: QueryType): Promise<cosmosresponse> {
        console.log('Getting mags');
        return {};
    }

    public async get_gyro(query: QueryType): Promise<cosmosresponse> {
        console.log('Getting gyros');
        return {};
    }

    public async get_mtr(query: QueryType): Promise<cosmosresponse> {
        console.log('Getting mtrs');
        return {};
    }

    public async get_rw(query: QueryType): Promise<cosmosresponse> {
        console.log('Getting rws');
        return {};
    }

    public async write_beacon(table: string, objectArray: any[]): Promise<void> {
        console.log('Writing beacon');
    }

    public async write_swchstruc(swchstruc: deviceswch[]): Promise<void> {
        console.log('Writing swchstruc');
    }

    public async write_battstruc(swchstruc: devicebatt[]): Promise<void> {
        console.log('Writing battstruc');
    }

    public async get_now(query: QueryType): Promise<cosmosresponse> {
        console.log('Getting now for table type');
        return {};
    }


}
