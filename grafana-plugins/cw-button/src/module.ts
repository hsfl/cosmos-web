import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { SimplePanel } from './SimplePanel';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions((builder) => {
  return builder
    .addTextInput({
      path: 'btnLabel',
      name: 'Button Label',
      description: 'Text inside button',
      defaultValue: 'Click Me',
    })
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
    .addSelect({
      path: 'dest',
      name: 'Destination',
      description: 'Which node to send command to',
      settings: {
        options: [
          {
            value: 'iobcfm',
            label: 'iOBC',
          },
          {
            value: 'unibapfm',
            label: 'Unibap',
          },
        ],
      },
      defaultValue: 'iobcfm',
    })
    .addNumberInput({
      path: 'cmdID',
      name: 'Packet command ID',
      description: 'Command ID as described in the protocol',
      defaultValue: 0,
      showIf: (config) => config.route === 'comm',
    })
    .addTextInput({
      path: 'args',
      name: 'Arguments',
      description: 'Additional arguments to pass to command',
      defaultValue: '',
      showIf: (config) => config.route === 'comm',
    })
    .addSelect({
      path: 'radioout',
      name: 'Radio Out',
      description: 'Radio to send out from',
      showIf: (config) => config.route === 'comm',
      settings: {
        options: [
          {
            value: 'RXS',
            label: 'RXS',
          },
          {
            value: 'TXS',
            label: 'TXS',
          },
          {
            value: 'UHF',
            label: 'UHF',
          },
          {
            value: 'Simplex',
            label: 'Simplex',
          },
          {
            value: 'Net',
            label: 'Net',
          },
          {
            value: 'All',
            label: 'All',
          },
        ],
      },
      defaultValue: 'UHF',
    });
});
