import React from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { Button } from '@grafana/ui';

interface Props extends PanelProps<SimpleOptions> {}

const WEB_API_PORT = 10090;
//const url = `http://localhost:${WEB_API_PORT}/`;
const url = `http://192.168.150.123:${WEB_API_PORT}/`;

const msg = (options: SimpleOptions) => {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dest: options.dest,
      cmdID: options.cmdID,
      args: options.args,
      radioout: options.radioout,
    }),
  };
};

// Sends the packet id number to backend
const handleOnClick = async (e: React.MouseEvent, options: SimpleOptions) => {
  await fetch(url + options.route, msg(options))
    .then((response) => response.json())
    .then((data) => data);
};

export const SimplePanel: React.FC<Props> = ({ options, data, width, height }) => {
  return (
    <div>
      <Button onClick={(e) => handleOnClick(e, options)}>{options.btnLabel}</Button>
    </div>
  );
};
