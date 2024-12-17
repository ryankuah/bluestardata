"use client";
import { Map, Source, Layer, type MapMouseEvent } from "react-map-gl";
import { useRouter } from "next/navigation";
import { dataLayer } from "./dataLayer";
import { type FeatureCollection as GeoJSON, type Feature } from "geojson";
import { useState, useEffect, useCallback } from "react";

export function StateMap({ token, data }: { token: string; data: GeoJSON }) {
  const router = useRouter();
  const [states, setStates] = useState<GeoJSON>();
  const [hoverInfo, setHoverInfo] = useState<{
    feature: Feature;
    x: number;
    y: number;
  } | null>(null);
  useEffect(() => {
    const coloredData = data.features.map((feature: Feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        percentile: Math.floor(Math.random() * (10 - 1 + 1)),
      },
    })) as unknown as Feature[];
    const coloredCollection = {
      type: "FeatureCollection",
      features: coloredData,
    } as GeoJSON;
    setStates(coloredCollection);
    console.log(coloredData);
  }, [data]);
  const onHover = useCallback((event: MapMouseEvent) => {
    const {
      features,
      point: { x, y },
    } = event;
    if (!features) {
      return;
    }
    const hoveredFeature = features[0] as unknown as Feature;
    setHoverInfo(hoveredFeature && { feature: hoveredFeature, x, y });
  }, []);
  return (
    <Map
      initialViewState={{
        latitude: 40,
        longitude: -100,
        zoom: 3,
      }}
      mapStyle="mapbox://styles/mapbox/light-v9"
      mapboxAccessToken={token}
      style={{ width: "100vw", height: "100vh" }}
      interactiveLayerIds={["data"]}
      onMouseMove={onHover}
      onClick={(e) => {
        router.push(`/states/${e.features?.[0]?.properties?.name}`);
      }}
    >
      <Source type="geojson" data={states}>
        <Layer {...dataLayer} />
      </Source>
      {hoverInfo && (
        <div
          className="absolute m-2 h-max w-max bg-gray-500 p-1"
          style={{ left: hoverInfo.x, top: hoverInfo.y }}
        >
          <div>{hoverInfo.feature.properties!.name}</div>
        </div>
      )}
    </Map>
  );
}
