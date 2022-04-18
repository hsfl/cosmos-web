import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { SimplePanel } from './SimplePanel';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions((builder) => {
  return builder
    .addSelect({
      path: 'route',
      name: 'Route',
      description: 'Cosmos Web backend API endpoint route',
      settings: {
        options: [
          {
            value: 'comm',
            label: 'Packet Protocol (/comm)',
          },
          {
            value: 'orbit',
            label: 'Orbit Propagator (/orbit)',
          },
        ],
      },
      defaultValue: 'comm',
    })
    .addNumberInput({
      path: 'cmdID',
      name: 'Packet command ID',
      description: 'Command ID as described in the protocol',
      defaultValue: 0,
      showIf: (config) => config.route === 'comm',
    });
});
