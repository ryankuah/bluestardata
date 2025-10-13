"use client";

import { bbox } from "@turf/bbox";
import { Map, Source, Layer, Marker, Popup } from "react-map-gl";
import { type Feature } from "geojson";
import type { LayerProps } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useState, useCallback, useEffect } from "react";
import { type MapboxEvent } from "mapbox-gl";
import { FaHospital, FaUserMd, FaClinicMedical } from "react-icons/fa";

interface Provider {
  number: string;
  name: string;
  address: string;
  primaryTaxonomy: string;
  otherTaxonomies: string;
  latitude: number | null;
  longitude: number | null;
}

interface Hospital {
  name: string;
  address: string;
  city: string;
  state: string;
  statefips: string;
  type: string;
  population: number;
  county: string;
  countyfips: number;
  naics_desc: string;
  owner: string;
  beds: number;
  trauma: string;
  latitude: number | null;
  longitude: number | null;
}

export default function HealthcareMap({
  feature,
  token,
  providers,
  hospitals: initialHospitals,
  stateFips,
  countyFips,
}: {
  feature: Feature;
  token: string;
  providers: Provider[];
  hospitals: Hospital[];
  stateFips: string;
  countyFips: string;
}) {
  const [hospitals, setHospitals] = useState<Hospital[]>(initialHospitals);
  const [isLoadingGeocode, setIsLoadingGeocode] = useState(false);
  const [minLng, minLat, maxLng, maxLat] = bbox(feature);
  const [popup, setPopup] = useState<
    ((Provider | Hospital) & { type: "provider" | "hospital" }) | null
  >(null);
  const [minZoomLevel, setMinZoomLevel] = useState(0);

  // Fetch geocoded hospitals in the background
  useEffect(() => {
    setIsLoadingGeocode(true);
    fetch(`/api/healthcare/geocode?state=${stateFips}&county=${countyFips}`)
      .then((res) => res.json())
      .then((data) => {
        setHospitals(data.hospitals);
        setIsLoadingGeocode(false);
      })
      .catch((err) => {
        console.error("Failed to load geocoded hospitals:", err);
        setIsLoadingGeocode(false);
      });
  }, [stateFips, countyFips]);

  const handleMapLoad = useCallback((evt: MapboxEvent) => {
    const map = evt?.target;
    const currentZoom = typeof map?.getZoom === "function" ? map.getZoom() : 0;
    setMinZoomLevel(currentZoom);
  }, []);

  const getProviderIcon = (primaryTaxonomy: string) => {
    if (primaryTaxonomy.toLowerCase().includes("hospital")) {
      return FaHospital;
    } else if (primaryTaxonomy.toLowerCase().includes("clinic")) {
      return FaClinicMedical;
    } else {
      return FaUserMd;
    }
  };

  const getProviderColor = (primaryTaxonomy: string) => {
    if (primaryTaxonomy.toLowerCase().includes("hospital")) {
      return "#dc2626";
    } else if (primaryTaxonomy.toLowerCase().includes("clinic")) {
      return "#059669";
    } else if (primaryTaxonomy.toLowerCase().includes("specialist")) {
      return "#7c3aed";
    } else if (primaryTaxonomy.toLowerCase().includes("dentist")) {
      return "#ea580c";
    } else {
      return "#2563eb";
    }
  };

  const getHospitalColor = (trauma: string, _beds: number) => {
    switch (trauma) {
      case "LEVEL I":
        return "#dc2626";
      case "LEVEL II":
        return "#ea580c";
      case "LEVEL III":
        return "#d97706";
      case "LEVEL IV":
        return "#65a30d";
      default:
        return "#6b7280";
    }
  };

  const getHospitalSize = (beds: number) => {
    if (beds > 500) return 24;
    if (beds > 200) return 20;
    if (beds > 100) return 16;
    if (beds > 50) return 14;
    return 12;
  };

  return (
    <div className="w-full">
      <div className="mb-4 rounded-lg bg-white p-4 shadow-md">
        <h2 className="mb-2 text-xl font-semibold text-gray-700">
          Healthcare Facilities Map
          {isLoadingGeocode && (
            <span className="ml-2 text-sm text-gray-500">
              (Loading locations...)
            </span>
          )}
        </h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FaHospital className="text-red-600" />
            <span>
              Hospitals (
              {
                hospitals.filter(
                  (h) => Boolean(h.latitude) && Boolean(h.longitude),
                ).length
              }
              )
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FaClinicMedical className="text-emerald-600" />
            <span>
              Clinics (
              {
                providers.filter(
                  (p) =>
                    p.primaryTaxonomy.toLowerCase().includes("clinic") &&
                    Boolean(p.latitude) &&
                    Boolean(p.longitude),
                ).length
              }
              )
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FaUserMd className="text-blue-600" />
            <span>
              Other Providers (
              {
                providers.filter(
                  (p) =>
                    !p.primaryTaxonomy.toLowerCase().includes("clinic") &&
                    Boolean(p.latitude) &&
                    Boolean(p.longitude),
                ).length
              }
              )
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg shadow-md">
        <Map
          initialViewState={{
            bounds: [minLng, minLat, maxLng, maxLat],
            fitBoundsOptions: {
              padding: {
                left: 40,
                right: 40,
                top: 40,
                bottom: 40,
              },
            },
          }}
          mapStyle="mapbox://styles/mapbox/light-v9"
          mapboxAccessToken={token}
          style={{ height: "70vh", width: "100%" }}
          onLoad={handleMapLoad}
          minZoom={minZoomLevel}
        >
          {/* Render Hospital Markers */}
          {hospitals.map((hospital, index) => {
            if (hospital.latitude == null || hospital.longitude == null)
              return null;

            return (
              <Marker
                key={`hospital-${hospital.name}-${index}`}
                longitude={hospital.longitude}
                latitude={hospital.latitude}
                pitchAlignment="map"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setPopup({ ...hospital, type: "hospital" });
                }}
              >
                <FaHospital
                  color={getHospitalColor(hospital.trauma, hospital.beds)}
                  size={getHospitalSize(hospital.beds)}
                  className="cursor-pointer drop-shadow-sm transition-all hover:drop-shadow-md"
                />
              </Marker>
            );
          })}

          {/* Render Provider Markers */}
          {providers.map((provider, index) => {
            if (provider.latitude == null || provider.longitude == null)
              return null;

            const IconComponent = getProviderIcon(provider.primaryTaxonomy);

            return (
              <Marker
                key={`provider-${provider.number}-${index}`}
                longitude={provider.longitude}
                latitude={provider.latitude}
                pitchAlignment="map"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setPopup({ ...provider, type: "provider" });
                }}
              >
                <IconComponent
                  color={getProviderColor(provider.primaryTaxonomy)}
                  size={14}
                  className="cursor-pointer drop-shadow-sm transition-all hover:drop-shadow-md"
                />
              </Marker>
            );
          })}

          {/* Popup */}
          {popup && popup.latitude && popup.longitude && (
            <Popup
              longitude={popup.longitude}
              latitude={popup.latitude}
              anchor="top"
              onClose={() => setPopup(null)}
              closeOnClick={false}
            >
              <div className="max-w-xs">
                <h3 className="mb-1 text-sm font-semibold text-gray-800">
                  {popup.name}
                </h3>
                <p className="mb-2 text-xs text-gray-600">
                  {popup.address}
                  {popup.type === "hospital" && (popup as Hospital).city && (
                    <>, {(popup as Hospital).city}</>
                  )}
                </p>

                {popup.type === "hospital" ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium">
                        {(popup as Hospital).type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Beds:</span>
                      <span className="font-medium">
                        {(popup as Hospital).beds || "N/A"}
                      </span>
                    </div>
                    {(popup as Hospital).trauma && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Trauma Level:</span>
                        <span
                          className={`rounded px-1 py-0.5 text-xs font-medium ${
                            (popup as Hospital).trauma === "LEVEL I"
                              ? "bg-red-100 text-red-800"
                              : (popup as Hospital).trauma === "LEVEL II"
                                ? "bg-orange-100 text-orange-800"
                                : (popup as Hospital).trauma === "LEVEL III"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : (popup as Hospital).trauma === "LEVEL IV"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {(popup as Hospital).trauma}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Owner:</span>
                      <span className="text-right font-medium">
                        {(popup as Hospital).owner}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <p className="mt-1 text-xs font-medium">
                        {(popup as Provider).primaryTaxonomy}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          )}

          {/* County Border */}
          <Source type="geojson" data={feature}>
            <Layer {...borderLayer} />
          </Source>
        </Map>
      </div>
    </div>
  );
}

const borderLayer: LayerProps = {
  id: "healthcare-borders",
  type: "line",
  paint: {
    "line-color": "#374151",
    "line-width": 2,
    "line-opacity": 0.8,
  },
};
