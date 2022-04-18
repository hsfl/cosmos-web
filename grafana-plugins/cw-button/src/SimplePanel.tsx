import React from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { Button } from '@grafana/ui';

interface Props extends PanelProps<SimpleOptions> {}

const url = 'http://localhost:10093/';
//const url = "http://cosmos_web_backend:10093";
const options = (cmdID: Number) => {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cmdID: cmdID,
    }),
  };
};

// Sends the packet id number to backend
const handleOnClick = async (e: React.MouseEvent, route: String, cmdID: Number) => {
  await fetch(url + route, options(cmdID))
    .then((response) => response.json())
    .then((data) => data);
};

export const SimplePanel: React.FC<Props> = ({ options, data, width, height }) => {
  return (
    <div>
      <Button onClick={(e) => handleOnClick(e, options.route, options.cmdID)}>Button Text</Button>
    </div>
  );
};
