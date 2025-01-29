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

export type FredCategory = {
  categories: Category[];
};

export type Category = {
  id: number;
  name: string;
  parentId: number;
};

export type FredSeries = {
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

export type FredObservations = {
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