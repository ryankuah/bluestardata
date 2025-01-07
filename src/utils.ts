"use server";
import { env } from "@/env.js";
import { db } from "@/server/db";
import { fredData } from "@/server/db/schema";

export type FredData = {
  id: number;
  seriesCode: string;
  name: string;
  type: string;
  countryId: number;
  stateId: number;
  countyId: number;
  msaId: number;
};

type FredCategory = {
  categories: Category[];
};
export type Category = {
  id: number;
  name: string;
  parentId: number;
};

type FredSeries = {
  realtime_start: string;
  realtime_end: string;
  order_by: string;
  sort_order: string;
  count: number;
  offset: number;
  limit: number;
  seriess: Series[];
};

export type Series = {
  id: string;
  realtime_start: string;
  realtime_end: string;
  title: string;
  observation_start: string;
  observation_end: string;
  frequency: string;
  frequency_short: string;
  units: string;
  units_short: string;
  seasonal_adjustment: string;
  seasonal_adjustment_short: string;
  last_updated: string;
  popularity: number;
  group_popularity: number;
  notes: string;
};

export async function fetchCategories(id = 0) {
  const allCategories = (
    (await fetch(
      `https://api.stlouisfed.org/fred/category/children?category_id=${id}&api_key=${env.FRED_API_KEY}&file_type=json`,
    ).then((res) => res.json())) as unknown as FredCategory
  ).categories as unknown as Category[];
  return allCategories;
}

export async function fetchSeries(id = 0) {
  const allSeries = (
    (await fetch(
      `https://api.stlouisfed.org/fred/category/series?category_id=${id}&api_key=${env.FRED_API_KEY}&file_type=json`,
    ).then((res) => res.json())) as unknown as FredSeries
  ).seriess as unknown as Series[];
  return allSeries;
}

type FredObservations = {
  realtime_start: string;
  realtime_end: string;
  observation_start: string;
  observation_end: string;
  units: string;
  output_type: number;
  file_type: string;
  order_by: string;
  sort_order: string;
  count: number;
  offset: number;
  limit: number;
  observations: {
    realtime_start: string;
    realtime_end: string;
    date: string;
    value: string;
  }[];
};

export type Observations = {
  code: string;
  units: string;
  name: string;
  observations: {
    date: string;
    value: string;
  }[];
};

export async function fetchObservations(fredObj: FredData[]) {
  const out: Observations[] = [];
  for (const obj of fredObj) {
    const code = obj.seriesCode;
    const observations = await fetchObservation(code, obj.name);
    out.push(observations);
  }
  return out;
}

export async function fetchObservation(code: string, name: string) {
  const fredObservation = (await fetch(
    `https://api.stlouisfed.org/fred/series/observations?series_id=${code}&file_type=json&api_key=${env.FRED_API_KEY}`,
  ).then((res) => res.json())) as unknown as FredObservations;

  const observations: Observations = {
    code: code,
    units: fredObservation.units,
    name: name ?? code,
    observations: fredObservation.observations.map((observation) => ({
      date: observation.date,
      value: observation.value,
    })),
  };
  return observations;
}

export async function addObservation(code: [string, string], place: string) {
  const stateId = await db.query.states.findFirst({
    where: (states, { eq }) => eq(states.name, place),
    columns: {
      id: true,
    },
  });
  let countyId;
  let msaId;
  if (!stateId) {
    countyId = await db.query.counties.findFirst({
      where: (counties, { eq }) => eq(counties.name, place),
      columns: {
        id: true,
      },
    });
  } else if (!countyId) {
    msaId = await db.query.msas.findFirst({
      where: (msas, { eq }) => eq(msas.name, place),
      columns: {
        id: true,
      },
    });
  }
  await db.insert(fredData).values({
    seriesCode: code[0],
    name: code[1],
    countryId: 1,
    countyId: countyId?.id ?? null,
    stateId: stateId?.id ?? null,
    msaId: msaId?.id ?? null,
  });
}

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
  };
  geometry: Geometry;
};

export type Geometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][];
};

type DBFeature = {
  stateBorder: {
    id: string;
    type: string;
    geometry: { type: string; coordinates: [[number, number][]] };
    properties: { name: string };
  };
};
export async function getStateGeoJSON() {
  const features = (await db.query.states.findMany({
    columns: {
      stateBorder: true,
    },
  })) as unknown as DBFeature[];
  const filteredFeatures = features.filter((item) => item.stateBorder !== null);

  const geoJSON: GeoJSON = {
    type: "FeatureCollection",
    features: filteredFeatures.map((feature) => ({
      type: feature.stateBorder.type,
      id: feature.stateBorder.id,
      properties: feature.stateBorder.properties,
      geometry: feature.stateBorder.geometry,
    })) as unknown as Feature[],
  };
  return geoJSON;
}

export type County = {
  id: number;
  fredId: number;
  stateId: number;
  name: string;
  countyBorder: {
    id: string;
    type: string;
    geometry: { type: string; coordinates: [[number, number][]] };
    properties: {
      NAME: string;
      STATEFP: string;
      COUNTYFP: string;
      COUNTYNS: string;
      LSAD: string;
      ALAND: string;
      AWATER: string;
    };
  };
  fipsCode: number;
  gnisId: number;
  lsad: number;
  aland: string;
  awater: string;
};
