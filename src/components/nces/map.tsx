"use client";
import { bbox } from "@turf/bbox";
import { Map, Source, Layer, Marker, Popup } from "react-map-gl";
import { type Feature } from "geojson";
import type { LayerProps } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useState, useCallback } from "react";
import type { PublicNCESData, PrivateNCESData } from "@/utils/nces/types";
import { IoIosSchool } from "react-icons/io";
import { type MapboxEvent } from "mapbox-gl";

export default function CountyMap({
  feature,
  token,
  publicData,
  privateData,
}: {
  feature: Feature;
  token: string;
  publicData: PublicNCESData[];
  privateData: PrivateNCESData[];
}) {
  const [minLng, minLat, maxLng, maxLat] = bbox(feature);
  const [popup, setPopup] = useState<PublicNCESData | PrivateNCESData | null>(
    null,
  );
  const [minZoomLevel, setMinZoomLevel] = useState(0); // Start with a low default
  const handleMapLoad = useCallback((evt: MapboxEvent) => {
    const map = evt.target;
    const currentZoom = map.getZoom();
    setMinZoomLevel(currentZoom);
  }, []);
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
      onLoad={handleMapLoad}
      minZoom={minZoomLevel}
    >
      {publicData.map((school) => {
        return (
          <Marker
            key={school.NAME}
            longitude={Number(school.LONGITUDE)}
            latitude={Number(school.LATITUDE)}
            pitchAlignment="map"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setPopup(school);
            }}
          >
            <IoIosSchool color="red" />
          </Marker>
        );
      })}
      {privateData.map((school) => {
        return (
          <Marker
            key={school.NAME}
            longitude={Number(school.LONGITUDE)}
            latitude={Number(school.LATITUDE)}
            pitchAlignment="map"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setPopup(school);
            }}
          >
            <IoIosSchool color="green" />
          </Marker>
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
