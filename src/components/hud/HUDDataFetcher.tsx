"use client"

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { env } from "@/env";

type HUDData = {
  fmr: {
    year: number;
    data: {
      efficiency: number;
      oneBedroom: number;
      twoBedroom: number;
      threeBedroom: number;
      fourBedroom: number;
    };
  }[];
  il: {
    year: number;
    data: {
      onePerson: number;
      twoPerson: number;
      threePerson: number;
      fourPerson: number;
    };
  }[];
  mstp: {
    year: number;
    data: {
      oneBedroom: number;
      twoBedroom: number;
      threeBedroom: number;
      fourBedroom: number;
    };
  }[];
};

async function fetchHUDData(stateFips: string, countyFips: string): Promise<HUDData> {
  const baseUrl = "https://www.huduser.gov/hudapi/public";
  const headers = {
    Authorization: `Bearer ${env.NEXT_PUBLIC_HUD_API_TOKEN}`,
  };

  const entityId = `${stateFips}${countyFips}99999`;
  const currentYear = new Date().getFullYear();

  const safeParseNumber = (val: any): number => isNaN(Number(val)) ? 0 : Number(val);

  const fmrPromises = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - i;
    return fetch(`${baseUrl}/fmr/data/${entityId}?year=${year}`, { headers })
      .then(res => res.json())
      .catch(() => null);
  });

  const fmrResults = await Promise.all(fmrPromises);
  const fmrData = fmrResults.reverse().map((result, i) => ({
    year: currentYear - 4 + i,
    data: {
      efficiency: safeParseNumber(result?.data?.basicdata?.Efficiency),
      oneBedroom: safeParseNumber(result?.data?.basicdata?.["One-Bedroom"]),
      twoBedroom: safeParseNumber(result?.data?.basicdata?.["Two-Bedroom"]),
      threeBedroom: safeParseNumber(result?.data?.basicdata?.["Three-Bedroom"]),
      fourBedroom: safeParseNumber(result?.data?.basicdata?.["Four-Bedroom"]),
    }
  }));

  const ilPromises = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - i;
    return fetch(`${baseUrl}/il/data/${entityId}?year=${year}`, { headers })
      .then(res => res.json())
      .catch(() => null);
  });

  const ilResults = await Promise.all(ilPromises);
  const ilData = ilResults.reverse().map((result, i) => ({
    year: currentYear - 4 + i,
    data: {
      onePerson: safeParseNumber(result?.data?.low?.il80_p1),
      twoPerson: safeParseNumber(result?.data?.low?.il80_p2),
      threePerson: safeParseNumber(result?.data?.low?.il80_p3),
      fourPerson: safeParseNumber(result?.data?.low?.il80_p4),
    }
  }));

  const mstpPromises = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - i;
    return fetch(`${baseUrl}/mtspil/data/${entityId}?year=${year}`, { headers })
      .then(res => res.json())
      .catch(() => null);
  });

  const mstpResults = await Promise.all(mstpPromises);
  const mstpData = mstpResults.reverse().map((result, i) => ({
    year: currentYear - 4 + i,
    data: {
      oneBedroom: safeParseNumber(result?.data?.["60percent"]?.il60_p2),
      twoBedroom: safeParseNumber(result?.data?.["60percent"]?.il60_p3),
      threeBedroom: safeParseNumber(result?.data?.["60percent"]?.il60_p4),
      fourBedroom: safeParseNumber(result?.data?.["60percent"]?.il60_p5),
    }
  }));

  return {
    fmr: fmrData,
    il: ilData,
    mstp: mstpData,
  };
}


export default function HUDDataFetcher({
  state,
  county,
  stateFips,
  countyFips,
}: {
  state: string;
  county: string;
  stateFips: string;
  countyFips: string;
}) {
  const [data, setData] = useState<HUDData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const hudData = await fetchHUDData(stateFips, countyFips);
        setData(hudData);
      } catch (err) {
        setError("Failed to fetch HUD data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [stateFips, countyFips]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg text-gray-600">Loading HUD data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-lg text-gray-600">No HUD data available</div>
      </div>
    );
  }

  // Transform data for charts
  const fmrChartData = data.fmr.map((year) => ({
    year: year.year,
    ...year.data,
  }));

  const ilChartData = data.il.map((year) => ({
    year: year.year,
    ...year.data,
  }));

  const mstpChartData = data.mstp.map((year) => ({
    year: year.year,
    ...year.data,
  }));

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-gray-700">
        HUD Housing Data for {county}, {state}
      </h2>

      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-lg font-medium text-gray-700">
            Fair Market Rents (FMR)
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            Represents the 40th percentile of gross rents for standard quality units in a given area. 
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fmrChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#8884d8"
                  name="Efficiency"
                />
                <Line
                  type="monotone"
                  dataKey="oneBedroom"
                  stroke="#82ca9d"
                  name="1 Bedroom"
                />
                <Line
                  type="monotone"
                  dataKey="twoBedroom"
                  stroke="#ffc658"
                  name="2 Bedroom"
                />
                <Line
                  type="monotone"
                  dataKey="threeBedroom"
                  stroke="#ff8042"
                  name="3 Bedroom"
                />
                <Line
                  type="monotone"
                  dataKey="fourBedroom"
                  stroke="#0088fe"
                  name="4 Bedroom"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-medium text-gray-700">
            Income Limits (IL)
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            Maximum income for a household to be considered "low income" and potentially eligible for housing assistance programs.
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ilChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="onePerson"
                  stroke="#8884d8"
                  name="1 Person"
                />
                <Line
                  type="monotone"
                  dataKey="twoPerson"
                  stroke="#82ca9d"
                  name="2 Person"
                />
                <Line
                  type="monotone"
                  dataKey="threePerson"
                  stroke="#ffc658"
                  name="3 Person"
                />
                <Line
                  type="monotone"
                  dataKey="fourPerson"
                  stroke="#ff8042"
                  name="4 Person"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-medium text-gray-700">
            Small Area Fair Market Rents (MSTP)
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            ZIP level rent ceilings per bedroom size, used to set ZIP specific voucher limits.
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mstpChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="oneBedroom"
                  stroke="#8884d8"
                  name="1 Bedroom"
                />
                <Line
                  type="monotone"
                  dataKey="twoBedroom"
                  stroke="#82ca9d"
                  name="2 Bedroom"
                />
                <Line
                  type="monotone"
                  dataKey="threeBedroom"
                  stroke="#ffc658"
                  name="3 Bedroom"
                />
                <Line
                  type="monotone"
                  dataKey="fourBedroom"
                  stroke="#ff8042"
                  name="4 Bedroom"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
} 