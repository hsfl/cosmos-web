import { cosmosresponse, TimeRange } from '../types/cosmos_types';

export interface Telem {
    node_id: number;
    name: string;
    time: number;
    value: number | null;
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

    public async write_telem(telem: Telem[]): Promise<void> {
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
}