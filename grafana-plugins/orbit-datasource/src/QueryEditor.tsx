import { defaults } from 'lodash';

import React, { ChangeEvent, FormEvent, useState } from 'react';
import { Button, InlineField, InlineFieldRow, InlineFormLabel, Input, InlineSwitch } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

//export class QueryEditor extends PureComponent<Props> {
export const QueryEditor = (props: Props) => {
  const query = defaults(props.query, defaultQuery);
  const { queryText, enableSimMode, sim } = query;
  const [simMode, setSimMode] = useState<boolean>(enableSimMode || false);

  const onSimFieldsChange = (event: FormEvent<HTMLInputElement>, field: string) => {
    const { onChange, query } = props;
    switch (field) {
      case 'node_name':
        onChange({ ...query, sim: { ...sim, node_name: event.currentTarget.value } });
        break;
      case 'utc':
        onChange({ ...query, sim: { ...sim, utc: parseFloat(event.currentTarget.value) } });
        break;
      case 'px':
        onChange({ ...query, sim: { ...sim, px: parseFloat(event.currentTarget.value) } });
        break;
      case 'py':
        onChange({ ...query, sim: { ...sim, py: parseFloat(event.currentTarget.value) } });
        break;
      case 'pz':
        onChange({ ...query, sim: { ...sim, pz: parseFloat(event.currentTarget.value) } });
        break;
      case 'vx':
        onChange({ ...query, sim: { ...sim, vx: parseFloat(event.currentTarget.value) } });
        break;
      case 'vy':
        onChange({ ...query, sim: { ...sim, vy: parseFloat(event.currentTarget.value) } });
        break;
      case 'vz':
        onChange({ ...query, sim: { ...sim, vz: parseFloat(event.currentTarget.value) } });
        break;
    }
  };

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

  const onSubmitClick = () => {
    const { onRunQuery } = props;
    onRunQuery();
  };

  const SimulationMode = () => {
    return (
      <div>
        <InlineFieldRow>
          <InlineField labelWidth={13.8} label="Node name" tooltip="Name of this node. Must be unique">
            <Input
              width={20}
              type="text"
              value={sim.node_name || ''}
              onChange={(e) => onSimFieldsChange(e, 'node_name')}
            />
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
          <Input width={20} type="number" value={sim.utc} onChange={(e) => onSimFieldsChange(e, 'utc')} />
        </InlineField>
        <InlineFieldRow>
          <InlineFormLabel width={5} tooltip="Position of the satellite in ECI coordinate frame">
            Position
          </InlineFormLabel>
          <InlineField labelWidth={3} label="X">
            <Input type="number" value={sim.px} onChange={(e) => onSimFieldsChange(e, 'px')} />
          </InlineField>
          <InlineField labelWidth={3} label="Y">
            <Input type="number" value={sim.py} onChange={(e) => onSimFieldsChange(e, 'py')} />
          </InlineField>
          <InlineField labelWidth={3} label="Z">
            <Input type="number" value={sim.pz} onChange={(e) => onSimFieldsChange(e, 'pz')} />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineFormLabel width={5} tooltip="Velocity of the satellite in ECI coordinate frame">
            Velocity
          </InlineFormLabel>
          <InlineField labelWidth={3} label="X">
            <Input type="number" value={sim.vx} onChange={(e) => onSimFieldsChange(e, 'vx')} />
          </InlineField>
          <InlineField labelWidth={3} label="Y">
            <Input type="number" value={sim.vy} onChange={(e) => onSimFieldsChange(e, 'vy')} />
          </InlineField>
          <InlineField labelWidth={3} label="Z">
            <Input type="number" value={sim.vz} onChange={(e) => onSimFieldsChange(e, 'vz')} />
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

  return (
    <div>
      {simMode ? SimulationMode() : RegularMode()}
      <InlineFieldRow>
        <Button onClick={onSubmitClick}>Run Propagator</Button>
      </InlineFieldRow>
    </div>
  );
};
