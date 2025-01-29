"use client";
import { bbox } from "@turf/bbox";
import { Map, Source, Layer } from "react-map-gl";
import { type Feature } from "geojson";
import { dataLayer } from "../../dataLayer";

export default function CountyMap({
  feature,
  token,
}: {
  feature: Feature;
  token: string;
}) {
  const [minLng, minLat, maxLng, maxLat] = bbox(feature);
  return (
    <Map
      initialViewState={{
        bounds: [minLng, minLat, maxLng, maxLat],
        fitBoundsOptions: {
          padding: {
            left: 10,
            right: 10,
            top: 10,
            bottom: 10,
          },
        },
      }}
      mapStyle="mapbox://styles/mapbox/light-v9"
      mapboxAccessToken={token}
      style={{ height: "30vh", width: "30vw" }}
    >
      <Source type="geojson" data={feature}>
        <Layer {...dataLayer} />
      </Source>
    </Map>
  );
}
