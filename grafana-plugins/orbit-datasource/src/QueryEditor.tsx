import { defaults } from 'lodash';

import React, { ChangeEvent /*, SyntheticEvent*/, useState } from 'react';
import { InlineField, InlineFieldRow, InlineFormLabel, Input, InlineSwitch } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

//export class QueryEditor extends PureComponent<Props> {
export const QueryEditor = (props: Props) => {
  const query = defaults(props.query, defaultQuery);
  const { queryText, constant, enableSimMode } = query;
  const [simMode, setSimMode] = useState<boolean>(enableSimMode || false);

  // const onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   const { onChange, query } = props;
  //   onChange({ ...query, queryText: event.target.value });
  // };

  // const onConstantChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   const { onChange, query, onRunQuery } = props;
  //   onChange({ ...query, constant: parseFloat(event.target.value) });
  //   // executes the query
  //   onRunQuery();
  // };

  const onEnableSimModeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = props;
    onChange({ ...query, enableSimMode: event.target.checked });
    setSimMode(event.target.checked);
  };

  const SimulationMode = () => {
    return (
      <div>
        <InlineFieldRow>
          <InlineField labelWidth={14} label="Node name" tooltip="Name of this node. Must be unique">
            <Input width={20} type="text" value={queryText || ''} onChange={(e) => null} />
          </InlineField>
          <InlineFormLabel tooltip="Generate a full orbit from initial conditions in simulation mode">
            Simulation Mode
          </InlineFormLabel>
          <InlineSwitch value={enableSimMode || false} onChange={onEnableSimModeChange} />
        </InlineFieldRow>
        <InlineField
          labelWidth={14}
          label="Time"
          tooltip="Timestamp in Modified Julian Date. Full orbit will be generated starting from this time"
        >
          <Input width={20} type="number" value={constant} onChange={(e) => null} />
        </InlineField>
        <InlineFieldRow>
          <InlineFormLabel width={5} tooltip="Position of the satellite in ECI coordinate frame">
            Position
          </InlineFormLabel>
          <InlineField labelWidth={3} label="X">
            <Input type="number" value={constant} onChange={(e) => null} />
          </InlineField>
          <InlineField labelWidth={3} label="Y">
            <Input type="number" value={constant} onChange={(e) => null} />
          </InlineField>
          <InlineField labelWidth={3} label="Z">
            <Input type="number" value={constant} onChange={(e) => null} />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineFormLabel width={5} tooltip="Velocity of the satellite in ECI coordinate frame">
            Velocity
          </InlineFormLabel>
          <InlineField labelWidth={3} label="X">
            <Input type="number" value={constant} onChange={(e) => null} />
          </InlineField>
          <InlineField labelWidth={3} label="Y">
            <Input type="number" value={constant} onChange={(e) => null} />
          </InlineField>
          <InlineField labelWidth={3} label="Z">
            <Input type="number" value={constant} onChange={(e) => null} />
          </InlineField>
        </InlineFieldRow>
      </div>
    );
  };

  const RegularMode = () => {
    return (
      <InlineFieldRow>
        <InlineField labelWidth={14} label="Node name" tooltip="Name of this node. Must be unique">
          <Input width={20} type="text" value={queryText || ''} onChange={(e) => null} />
        </InlineField>
        <InlineFormLabel tooltip="Generate a full orbit from initial conditions in simulation mode">
          Simulation Mode
        </InlineFormLabel>
        <InlineSwitch value={enableSimMode || false} onChange={onEnableSimModeChange} />
      </InlineFieldRow>
    );
  };

  return <div>{simMode ? SimulationMode() : RegularMode()}</div>;
};
