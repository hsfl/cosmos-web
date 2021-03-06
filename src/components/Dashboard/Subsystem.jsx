import React from 'react';
import PropTypes from 'prop-types';

import { Badge } from 'antd';
import { CheckCircleTwoTone } from '@ant-design/icons';

import DisplayValue from './DisplayValue';
import BaseComponent from '../BaseComponent';

function Subsystem({
  name,
}) {
  return (
    <BaseComponent
      name={name}
      movable
      className="flex-col p-4"
    >
      <div className="flex">
        <div className="flex-col shadow overflow-y-auto p-4 m-1 bg-white w-full lg:w-1/4">
          <div>
            <Badge status="success" />
            <span className="text-lg font-bold">
              eps
            </span>
          </div>
          <div className="flex-col pl-3 pt-2">
            <div>
              <CheckCircleTwoTone twoToneColor="#52c41a" />
              &nbsp;Nominal.
            </div>
          </div>
        </div>
        <div className="flex-col shadow overflow-y-auto p-4 m-1 bg-white w-3/4">
          <span className="text-lg font-bold">
            Activity
          </span>
          <div className="flex-col pt-2">
            Hi
          </div>
        </div>
      </div>
      <div className="flex m-1">
        <div
          className="w-1/2 mr-2"
        >
          <DisplayValue
            name="Temperature"
          />
        </div>
        <div
          className="w-1/2"
        >
          <DisplayValue
            name="Voltages and Currents"
          />
        </div>
      </div>
    </BaseComponent>
  );
}

Subsystem.propTypes = {
  /** Name of component to display at the top */
  name: PropTypes.string.isRequired,
};

export default Subsystem;
