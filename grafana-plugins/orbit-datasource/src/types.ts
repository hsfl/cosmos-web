import { DataQuery, DataSourceJsonData } from '@grafana/data';

// Front-end options
export interface MyQuery extends DataQuery {
  queryText?: string;
  constant: number;
  enableSimMode: boolean;
}

export const defaultQuery: Partial<MyQuery> = {
  constant: 6.5,
  enableSimMode: false,
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
