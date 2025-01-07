"use client";
import { Map as MapGL, Source, Layer, type MapMouseEvent } from "react-map-gl";
import { type counties, type msas } from "@/server/db/schema";
import { useState, useEffect, useCallback } from "react";
import { dataLayer } from "./dataLayer";
import { useRouter } from "next/navigation";
import { type Feature, type GeoJSON } from "@/utils";

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
  countyData: GeoJSON;
  counties: County[];
  msas: MSA[];
  state: string;
}) {
  const router = useRouter();
  const [geoCounties, setCounties] = useState<GeoJSON>();
  const [hoverInfo, setHoverInfo] = useState<{
    feature: Feature;
    x: number;
    y: number;
  } | null>(null);
  useEffect(() => {
    const coloredData = countyData.features.map((feature: Feature) => ({
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
    setCounties(coloredCollection);
  }, [countyData]);
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
      interactiveLayerIds={["data"]}
      onMouseMove={onHover}
      onClick={(e) => {
        router.push(
          `/states/${state}/county/${e.features?.[0]?.properties?.name}`,
        );
      }}
    >
      <Source type="geojson" data={geoCounties}>
        <Layer {...dataLayer} />
      </Source>
      {hoverInfo && (
        <div
          className="absolute m-2 h-max w-max bg-gray-500 p-1"
          style={{ left: hoverInfo.x, top: hoverInfo.y }}
        >
          <div>{hoverInfo.feature.properties.name}</div>
        </div>
      )}
    </MapGL>
  );
}
