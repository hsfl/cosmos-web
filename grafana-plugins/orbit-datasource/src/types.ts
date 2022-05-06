import { DataQuery, DataSourceJsonData } from '@grafana/data';

interface SimFields {
  node_name: string;
  utc: number;
  px: number;
  py: number;
  pz: number;
  vx: number;
  vy: number;
  vz: number;
}

// Front-end options
export interface MyQuery extends DataQuery {
  queryText?: string;
  constant: number;
  enableSimMode: boolean;
  sim: SimFields;
}

export const defaultQuery: Partial<MyQuery> = {
  constant: 6.5,
  enableSimMode: false,
  sim: {
    node_name: '',
    utc: 0,
    px: 0,
    py: 0,
    pz: 0,
    vx: 0,
    vy: 0,
    vz: 0,
  },
};

/**
 * These are options configured for each DataSource instance.
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  path?: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  apiKey?: string;
}
