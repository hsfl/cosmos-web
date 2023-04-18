import { cosmosresponse, TimeRange, LocType } from '../types/cosmos_types';

// map of cosmos sql tables; 
// note the column order must match sql order; key names must match sql table names; naming must be exact
export const sqlmap: Object = {
    "swchstruc": ["node_name", "didx", "utc", "volt", "amp", "power", "temp"],
    "battstruc": ["node_name", "didx", "utc", "volt", "amp", "power", "temp", "percentage"],
    "bcregstruc": ["node_name", "didx", "utc", "volt", "amp", "power", "temp", "mpptin_amp", "mpptin_volt", "mpptout_amp", "mpptout_volt"],
    "cpustruc": ["node_name", "didx", "utc", "temp", "uptime", "cpu_load", "gib", "boot_count", "storage"],
    "device": ["node_name", "type", "cidx", "didx", "name"],
    "device_type": ["name", "id"],
    "locstruc": ["node_name", "utc", "eci_s_x", "eci_s_y", "eci_s_z", "eci_v_x", "eci_v_y", "eci_v_z", "icrf_s_x", "icrf_s_y", "icrf_s_z", "icrf_s_w", "icrf_v_x", "icrf_v_y", "icrf_v_z"],
    "magstruc": ["node_name", "didx", "utc", "mag_x", "mag_y", "mag_z"],
    "node": ["node_id", "node_name", "node_type", "agent_name", "utc", "utcstart"],
    "tsenstruc": ["node_name", "didx", "utc", "temp"]
}

// ADD PRIMARY KEY FOR CONDITIONAL QUERY TO MAP
// group by unique key, not primary key (not utc)
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

export interface Node {
    id: number;
    name: string;
    type: number;
}

export interface NodeType {
    id: number;
    name: string;
}

// swchstruc sql
export interface deviceswch {
    node_device: string;
    didx: number;
    utc: number; // utc
    volt: number;
    amp: number;
    power: number;
    temp: number;
}

// battstruc sql
export interface devicebatt {
    node_device: string;
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
    node_device: string;
    didx: number;
    time: number; // utc
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
    node_device: string;
    didx: number;
    time: number; // utc
    temp: number;
}

// cpustruc sql
export interface devicecpu {
    node_device: string;
    didx: number;
    time: number; // utc
    temp: number;
    uptime: number;
    cpu_load: number;
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

export interface GFNodeType {
    Node_name: string;
    Node_type: number;
}

export interface Device {
    node_name: string;
    type: number;
    cidx: number;
    didx: number;
    name: string;
}

// Base database class, derived classes should override the interfaces
export default class BaseDatabase {
    constructor() { }

    public async clearDatabase(): Promise<void> {
        console.log('Clear database');
    }

    public async write_telem(telem: TelegrafMetric[]): Promise<void> {
        console.log('Writing telem point', telem);
    }

    public async write_telem_bulk(): Promise<void> {
        console.log('Writing telem in bulk',)
    }

    public async write_node(nodes: Node[]): Promise<void> {
        console.log('Writing nodes', nodes);
    }

    public async write_device(devices: Device[]): Promise<void> {
        console.log('Writing devices', devices);
    }

    public async get_attitude(timerange: TimeRange): Promise<cosmosresponse> {
        console.log('Getting attitude');
        return {};
    }

    public async get_position(loctype: LocType): Promise<cosmosresponse> {
        console.log('Getting position');
        return {};
    }

    public async get_battery(timerange: TimeRange): Promise<cosmosresponse> {
        console.log('Getting batteries');
        return {};
    }

    public async get_bcreg(timerange: TimeRange): Promise<cosmosresponse> {
        console.log('Getting bcregs');
        return {};
    }

    public async get_tsen(timerange: TimeRange): Promise<cosmosresponse> {
        console.log('Getting tsens');
        return {};
    }

    public async get_cpu(timerange: TimeRange): Promise<cosmosresponse> {
        console.log('Getting cpus');
        return {};
    }

    public async get_event(timerange: TimeRange): Promise<cosmosresponse> {
        console.log('Getting events');
        return {};
    }

    public async get_mag(timerange: TimeRange): Promise<cosmosresponse> {
        console.log('Getting mags');
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

    public async get_now(table: string, timerange: TimeRange): Promise<cosmosresponse> {
        console.log('Getting now for table type');
        return {};
    }


}
