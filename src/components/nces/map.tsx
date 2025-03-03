"use client";
import { bbox } from "@turf/bbox";
import { Map, Source, Layer, Marker, Popup } from "react-map-gl";
import { type Feature } from "geojson";
import type { LayerProps } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useState, useEffect } from "react";
import type { NCESData } from "@/utils/nces/types";

export default function CountyMap({
  feature,
  token,
  data: data,
}: {
  feature: Feature;
  token: string;
  data: NCESData[];
}) {
  const [minLng, minLat, maxLng, maxLat] = bbox(feature);
  const [popup, setPopup] = useState<NCESData | null>(null);
  return (
    <Map
      initialViewState={{
        bounds: [minLng, minLat, maxLng, maxLat],
        fitBoundsOptions: {
          padding: {
            left: 20,
            right: 20,
            top: 20,
            bottom: 20,
          },
        },
      }}
      mapStyle="mapbox://styles/mapbox/light-v9"
      mapboxAccessToken={token}
      style={{ height: "70vh", width: "70vw" }}
    >
      {data.map((school) => {
        return (
          //i'm too lazy to define the type so here are squiggly lines
          <Marker
            key={school.NAME}
            longitude={Number(school.LONGITUDE)}
            latitude={Number(school.LATITUDE)}
            pitchAlignment="map"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setPopup(school);
            }}
          />
        );
      })}
      {popup && (
        <Popup
          longitude={Number(popup.LONGITUDE)}
          latitude={Number(popup.LATITUDE)}
          anchor="top"
          onClose={() => setPopup(null)}
        >
          <div>
            <h1 className="text-md font-semibold">{popup.NAME}</h1>
            <p>{popup.ADDRESS}</p>
          </div>
        </Popup>
      )}
      <Source type="geojson" data={feature}>
        <Layer {...borderLayer} />
      </Source>
    </Map>
  );
}

const borderLayer: LayerProps = {
  id: "borders",
  type: "line",
  paint: {
    "line-color": "#000",
    "line-width": 1,
    "line-opacity": 0.8,
  },
};
