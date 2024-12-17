"use client";
import { Map as MapGL, Source, Layer } from "react-map-gl";
import { dataLayer } from "@/app/dataLayer";
import { type counties, type msas } from "@/server/db/schema";

import { type FeatureCollection, type Geometry } from "geojson";

type County = typeof counties.$inferSelect;
type MSA = typeof msas.$inferSelect;

export function Map({
  token,
  minLng,
  minLat,
  maxLng,
  maxLat,
  countyData,
  counties,
  msas,
  state,
}: {
  token: string;
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
  countyData: FeatureCollection;
  counties: County[];
  msas: MSA[];
  state: string;
}) {
  return (
    <MapGL
      initialViewState={{
        bounds: [minLng, minLat, maxLng, maxLat],
        fitBoundsOptions: {
          padding: {
            left: 100,
            right: 100,
            top: 100,
            bottom: 100,
          },
        },
      }}
      mapStyle="mapbox://styles/mapbox/light-v9"
      mapboxAccessToken={token}
      style={{ height: "100vh", width: "100vw" }}
    >
      <Source type="geojson" data={countyData}>
        <Layer {...dataLayer} />
      </Source>
      <div className="absolute left-0 top-0 h-max w-max">
        {counties.map((county) => {
          return (
            <a key={county.id} href={`/states/${state}/county/${county.name}`}>
              <div key={county.id} className="flex flex-row">
                <div className="flex flex-col">
                  <h1 className="text-sm">{county.name}</h1>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </MapGL>
  );
}
