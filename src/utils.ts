"use server";
import { env } from "@/env.js";
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
  id: number;
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
  console.log(allCategories);
  return allCategories;
}

export async function fetchSeries(id = 0) {
  const allSeries = (
    (await fetch(
      `https://api.stlouisfed.org/fred/category/series?category_id=${id}&api_key=${env.FRED_API_KEY}&file_type=json`,
    ).then((res) => res.json())) as unknown as FredSeries
  ).seriess as unknown as Series[];
  console.log(allSeries);
  return allSeries;
}
