import { cosmosresponse, TimeRange } from '../types/cosmos_types';

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
}

export interface Device {
    node_id: number;
    name: string;
    dname: string;
}

// Base database class, derived classes should override the interfaces
export default class BaseDatabase {
    constructor() {}

    public async clearDatabase(): Promise<void> {
        console.log('Clear database');
    }

    public async write_telem(telem: TelegrafMetric[]): Promise<void> {
        console.log('Writing telem point', telem);
    }

    public async write_telem_bulk(): Promise<void> {
        console.log('Writing telem in bulk', )
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

    public async get_position(timerange: TimeRange): Promise<cosmosresponse> {
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

}
