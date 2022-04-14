import React, { useRef } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import {
  buildModuleUrl,
  TileMapServiceImageryProvider,
  Viewer as CesiumViewer,
  CzmlDataSource as CesiumCzmlDataSource,
} from 'cesium';
import { CesiumComponentRef, CzmlDataSource, Globe, Viewer } from 'resium';

require('../node_modules/cesium/Source/Widgets/widgets.css');

const globeTexture = new TileMapServiceImageryProvider({
  url: buildModuleUrl('Assets/Textures/NaturalEarthII'),
});

interface CzmlPacket {
  id: string;
  version?: string;
  availability?: string;
  position?: {
    interval?: string;
    epoch: string;
    cartesian: Number[];
    referenceFrame?: string;
  };
  point?: {
    color: {
      rgba: Number[];
    };
    outlineColor?: {
      rgba: Number[];
    };
    outlineWidth?: Number;
    pixelSize: Number;
  };
  model?: {
    gltf: string;
    scale: Number;
    minimumPixelSize?: Number;
  };
  path?: {
    material: {
      polylineOutline: {
        color: {
          rgba: Number[];
        };
        outlineColor?: {
          rgba: Number[];
        };
        outlineWidth?: Number;
      };
    };
    width: Number;
    leadTime?: Number;
    trailTime?: Number;
    resolution?: Number;
  };
}

interface Props extends PanelProps<SimpleOptions> {}

export const SimplePanel: React.FC<Props> = ({ options, data, width, height }) => {
  const viewer = useRef<CesiumComponentRef<CesiumViewer>>(null);
  //let [dat, setdat] = useState<CzmlPacket[] | undefined>();
  //   let dat = 0;
  const czml0 = [
    {
      id: 'document',
      name: 'Cesium Orbit Display for Cosmos Web',
      version: '1.0',
    },
  ];
  //   const czml1 = [
  //     {
  //       id: 'document',
  //       version: '1.0',
  //     },
  //     {
  //       id: 'point',
  //       availability: '2012-08-04T16:00:00Z/2012-08-04T16:03:00Z',
  //       position: {
  //         interval: '2012-08-04T16:00:00Z/2012-08-04T16:02:00Z',
  //         epoch: '2012-08-04T16:00:00Z',
  //         cartographicDegrees: [0, -60, 10, 150000, 120, -70, 18, 150000],
  //       },
  //     },
  //   ];

  //   setInterval(() => {
  //     dat = dat + 1;
  //     console.log('changed dat', dat);
  //     if (viewer.current?.cesiumElement && viewer.current?.cesiumElement.dataSources.length) {
  //       // viewer.current.cesiumElement is the Cesium Viewer
  //       let myczml = viewer.current.cesiumElement.dataSources.getByName('myczml') as CesiumCzmlDataSource[];
  //       if (myczml.length === 1) {
  //         // myczml[0] is our CZMLDataSource
  //         myczml[0].process(czml1);
  //       }
  //     }
  //     //setblah(!blah);
  //   }, 5000);
  //console.log(buildModuleUrl('Assets/Textures/NaturalEarthII'));
  setTimeout(() => {
    console.log('i1');
    if (viewer.current?.cesiumElement && viewer.current?.cesiumElement.dataSources.length) {
      // viewer.current.cesiumElement is the Cesium Viewer
      console.log('i2');
      let myczml = viewer.current.cesiumElement.dataSources.getByName(
        'Cesium Orbit Display for Cosmos Web'
      ) as CesiumCzmlDataSource[];
      if (myczml.length === 1) {
        // myczml[0] is our CZMLDataSource
        let czmlres: CzmlPacket = JSON.parse(data.series[0].fields[0].values.get(0));
        console.log(czmlres);
        myczml[0].process(czmlres);
      }
    }
  }, 2000);

  const handlechange = (e: CesiumCzmlDataSource) => {
    console.log('detected change');
    //setdat(czml1);
  };

  console.log('rerender globe panel');

  return (
    <div>
      <div id="cesiumContainer"></div>
      <Viewer
        // Don't touch these three as it enables offline Cesium use
        imageryProvider={globeTexture}
        baseLayerPicker={false}
        geocoder={false}
        // These two control the time controls
        animation={true}
        timeline={true}
        // Various others to keep disabled
        fullscreenButton={false}
        homeButton={false}
        id="cesium-container-id"
        infoBox={false}
        navigationHelpButton={false}
        ref={viewer}
      >
        <CzmlDataSource data={czml0} onChange={handlechange}></CzmlDataSource>
        <Globe enableLighting />
      </Viewer>
      Sample text
    </div>
  );
};
