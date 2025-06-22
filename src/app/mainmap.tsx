"use client";
import {
  Map,
  Source,
  Layer,
  type MapMouseEvent,
  type MapRef,
} from "react-map-gl";
import { dataLayer, borderLayer } from "./dataLayer";
import {
  type GeoJSON,
  type Feature,
  type AllCounties,
} from "@/utils/map/types";
import { useState, useCallback, useRef } from "react";
import { bbox } from "@turf/bbox";
import { useRouter } from "next/navigation";
import { LocationSearcher } from "@/components/map/LocationSearcher";

export function MainMap({
  token,
  state,
  allCounties,
}: {
  token: string;
  state: GeoJSON;
  allCounties: AllCounties[];
}) {
  const [hoverInfo, setHoverInfo] = useState<{
    feature: Feature;
    x: number;
    y: number;
  } | null>(null);

  const [data, setData] = useState<GeoJSON>(state);
  const [currentLevel, setCurrentLevel] = useState<"state" | "county">("state");

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

  const mapRef = useRef<MapRef>(null);

  const onClick = (e: MapMouseEvent) => {
    if (currentLevel === "state") {
      stateClick(e);
      setCurrentLevel("county");
    } else if (currentLevel === "county") {
      countyClick(e);
    }
  };

  const router = useRouter();

  const countyClick = (e: MapMouseEvent) => {
    console.log("county click");
    console.log(e.features);
    router.push(`/county/${e.features![0]!.properties!.geoId}`);
    console.log(e.features![0]!.properties!.geoId);
  };

  const handleStateSelect = (feature: Feature) => {
    // Same logic as stateClick but triggered by search
    const stateCounty = allCounties.find(
      (county) => county.fipsCode === feature.properties?.fipsCode,
    );
    if (!stateCounty) return;

    const [minLng, minLat, maxLng, maxLat] = bbox(
      feature.geometry as unknown as GeoJSON.Geometry,
    );

    mapRef.current?.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: 40,
        duration: 1000,
      },
    );

    setData({
      type: "FeatureCollection",
      features: stateCounty.counties.map((county) => ({
        type: "Feature",
        geometry: county.border.geometry,
        properties: {
          name: county.name,
          geoId: county.geoId,
          fipsCode: county.fipsCode,
          percentile:
            Math.abs(
              county.name
                .split("")
                .reduce(
                  (hash, char) => (hash << 5) - hash + char.charCodeAt(0),
                  0,
                ),
            ) % 9,
        },
      })) as unknown as Feature[],
    });

    setCurrentLevel("county");
  };

  const stateClick = (e: MapMouseEvent) => {
    const feature = e.features![0];
    if (!feature) return;
    handleStateSelect(feature as unknown as Feature);
  };

  return (
    <div className="relative">
      <div className="absolute left-4 top-4 z-10 w-80">
        <LocationSearcher
          states={state.features}
          allCounties={allCounties}
          onStateSelect={handleStateSelect}
          className="shadow-lg"
        />
      </div>
      <Map
        ref={mapRef}
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
        onClick={(e: MapMouseEvent) => {
          onClick(e);
        }}
      >
        <Source type="geojson" data={data}>
          <Layer {...dataLayer} />
          <Layer {...borderLayer} />
        </Source>
        {hoverInfo && (
          <div
            className="absolute m-2 h-max w-max bg-gray-500 p-1"
            style={{ left: hoverInfo.x, top: hoverInfo.y }}
          >
            <div>{hoverInfo.feature.properties.name}</div>
          </div>
        )}
      </Map>
    </div>
  );
}
