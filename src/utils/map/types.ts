export type GeoJSON = {
  type: "FeatureCollection";
  features: Feature[];
};

export type Feature = {
  type: "Feature";
  id: string;
  properties: {
    name: string;
    percentile: number;
    fipsCode?: number;
    geoId?: string;
  };
  geometry: Geometry;
};

export type Geometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][];
};
export type County = {
  fipsCode: number;
  name: string;
  border: Feature;
  stateId: number;
  geoId: string;
};

export type States = {
  fipsCode: number;
  name: string;
  abbreviation: string;
  border: Feature;
};

export type AllCounties = States & {
  counties: County[];
};
