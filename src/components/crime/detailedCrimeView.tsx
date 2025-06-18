// src/components/crime/DetailedCrimeView.tsx
"use client";

import React, { useState, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from "recharts";

// Interface for a single year's summarized data (annualized specific crime)
interface SummarizedYearData {
  year: number;
  population?: number;
  [key: string]: number | undefined;
}

// This is the JSON structure for Arrest Demographics you provided
interface ArrestDemographicsData {
  "Arrestee Sex": Record<string, number>;
  "Offense Name": Record<string, number>;
  "Arrestee Race": Record<string, number>;
  "Offense Category": Record<string, number>;
  "Offense Breakdown": Record<string, number>;
  "Male Arrests By Age": Record<string, number>;
  "Female Arrests By Age": Record<string, number>;
  cde_properties?: Record<string, Record<string, string>>;
}

// Interface for offense-specific yearly data
interface OffenseYearlyData {
  year: number;
  total: number;
  male?: number;
  female?: number;
  byRace?: Record<string, number>;
  byAge?: Record<string, number>;
}

// Unified API response structure from our backend
interface AppCrimeApiResponse {
  dataType:
    | "summarized_offense_annual"
    | "arrest_demographics_total"
    | "offense_yearly_trend";
  summaries?: SummarizedYearData[];
  crimeTypeKey?: string;
  arrestDemographics?: ArrestDemographicsData;
  offenseYearlyData?: OffenseYearlyData[];
  offenseName?: string;
  message?: string;
}

interface DetailedCrimeViewProps {
  stateFips: string;
  stateName: string;
}

const currentYear = new Date().getFullYear();
const yearOptions: number[] = Array.from(
  { length: 30 },
  (_, i) => currentYear - i,
).sort((a, b) => a - b);

// FBI offense codes mapping
const OFFENSE_CODES: Record<string, string> = {
  all: "All Offenses",
  "11": "Murder and Nonnegligent Homicide",
  "23": "Rape",
  "30": "Robbery",
  "60": "Burglary",
  "210": "Stolen Property",
  "220": "Vandalism",
  "250": "Offenses Against Family and Children",
  "260": "Driving Under the Influence",
  "280": "Drunkenness",
  "520": "Weapons Violations",
  "180": "Drug Abuse Violations",
  "190": "Gambling",
  "140": "Aggravated Assault",
  "150": "Simple Assault",
  "200": "Arson",
  "240": "Motor Vehicle Theft",
  "270": "Embezzlement",
  "290": "All Other Offenses",
};

const availableCrimeTypes: {
  value: string;
  label: string;
  targetKey: string;
  category: string;
}[] = [
  // Original summarized offense options
  {
    value: "V",
    label: "All Violent Crimes (Annual Summary)",
    targetKey: "violent_crime",
    category: "summary",
  },
  {
    value: "HOM",
    label: "Homicide (Annual Summary)",
    targetKey: "homicide",
    category: "summary",
  },
  {
    value: "P",
    label: "All Property Crimes (Annual Summary)",
    targetKey: "property_crime",
    category: "summary",
  },
  // Arrest Demographics options
  {
    value: "ARREST_DEMOGRAPHICS_OVERALL",
    label: "Arrest Demographics (Total for Range)",
    targetKey: "arrest_demographics",
    category: "demographics",
  },
  // Individual offense tracking options
  ...Object.entries(OFFENSE_CODES).map(([code, name]) => ({
    value: `OFFENSE_${code}`,
    label: `${name} (Yearly Trend)`,
    targetKey: code,
    category: "offense_trend",
  })),
];

// Color palette for charts
const COLORS = [
  "#1976d2",
  "#d81b60",
  "#388e3c",
  "#f57c00",
  "#7b1fa2",
  "#0288d1",
  "#c2185b",
  "#689f38",
  "#ffa726",
  "#ab47bc",
];

export default function DetailedCrimeView({
  stateFips,
  stateName,
}: DetailedCrimeViewProps) {
  const [crimeData, setCrimeData] = useState<AppCrimeApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fromYear, setFromYear] = useState<number>(
    yearOptions[yearOptions.length - 6] ?? yearOptions[0] ?? currentYear - 5,
  );
  const [toYear, setToYear] = useState<number>(
    yearOptions[yearOptions.length - 1] ?? currentYear,
  );
  const [selectedCrimeConfig, setSelectedCrimeConfig] = useState<{
    value: string;
    label: string;
    targetKey: string;
    category: string;
  }>(
    availableCrimeTypes.find((ct) => ct.value === "OFFENSE_all") ??
      availableCrimeTypes[0] ?? {
        value: "all",
        label: "All Offenses (Yearly Trend)",
        targetKey: "all",
        category: "offense_trend",
      },
  );

  const handleFetchData = useCallback(async () => {
    if (!fromYear || !toYear || !selectedCrimeConfig.value) {
      setError("Please select From Year, To Year, and a Data Type.");
      return;
    }
    if (fromYear > toYear) {
      setError("From Year cannot be after To Year.");
      return;
    }

    setLoading(true);
    setError(null);
    setCrimeData(null);
    const yearsToFetch = Array.from(
      { length: toYear - fromYear + 1 },
      (_, i) => fromYear + i,
    );

    try {
      const response = await fetch("/api/crime-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stateFips,
          years: yearsToFetch,
          crimeTypeSlug: selectedCrimeConfig.value,
          targetKey: selectedCrimeConfig.targetKey,
          category: selectedCrimeConfig.category,
        }),
      });

      const responseData = (await response.json()) as AppCrimeApiResponse;
      if (!response.ok) {
        throw new Error(
          responseData.message ?? `API request failed: ${response.status}`,
        );
      }

      setCrimeData(responseData);

      // Check for empty results based on dataType
      if (
        responseData.dataType === "summarized_offense_annual" &&
        (!responseData.summaries || responseData.summaries.length === 0)
      ) {
        setError(
          `No ${selectedCrimeConfig.label} data found for ${stateName} between ${fromYear} and ${toYear}.`,
        );
      } else if (
        responseData.dataType === "arrest_demographics_total" &&
        !responseData.arrestDemographics
      ) {
        setError(
          `No Arrest Demographics data found for ${stateName} between ${fromYear} and ${toYear}.`,
        );
      } else if (
        responseData.dataType === "offense_yearly_trend" &&
        (!responseData.offenseYearlyData ||
          responseData.offenseYearlyData.length === 0)
      ) {
        setError(
          `No yearly data found for ${selectedCrimeConfig.label} in ${stateName} between ${fromYear} and ${toYear}.`,
        );
      }
    } catch (err) {
      console.error("Error fetching crime data:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      );
    } finally {
      setLoading(false);
    }
  }, [stateFips, fromYear, toYear, selectedCrimeConfig, stateName]);

  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null || isNaN(num)) return "N/A";
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (value: number, total: number): string => {
    if (total === 0) return "0%";
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  // Custom tooltip for charts
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    label?: string | number;
  }) => {
    if (active && payload?.length) {
      return (
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <p
            style={{ margin: "0 0 5px 0", fontWeight: "bold" }}
          >{`Year: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: "2px 0", color: entry.color }}>
              {`${entry.name}: ${formatNumber(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render offense yearly trend charts
  const renderOffenseTrendCharts = (
    offenseData: OffenseYearlyData[],
    offenseName: string,
  ) => {
    const chartData = offenseData.map((d) => ({
      year: d.year,
      total: d.total,
      male: d.male ?? 0,
      female: d.female ?? 0,
    }));

    // Calculate year-over-year changes
    const changeData = chartData.map((d, i) => {
      if (i === 0) return { ...d, change: 0, changePercent: 0 };
      const prevData = chartData[i - 1];
      const prevTotal = prevData?.total ?? 0;
      const change = d.total - prevTotal;
      const changePercent = prevTotal > 0 ? (change / prevTotal) * 100 : 0;
      return { ...d, change, changePercent };
    });

    return (
      <div style={{ marginTop: "30px" }}>
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#333",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          {offenseName} Arrests in {stateName} ({fromYear} - {toYear})
        </h2>

        {/* Summary Statistics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              backgroundColor: "#e3f2fd",
              padding: "20px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <div
              style={{ fontSize: "28px", fontWeight: "bold", color: "#1976d2" }}
            >
              {formatNumber(chartData.reduce((sum, d) => sum + d.total, 0))}
            </div>
            <div style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
              Total Arrests ({fromYear}-{toYear})
            </div>
          </div>
          <div
            style={{
              backgroundColor: "#ffebee",
              padding: "20px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <div
              style={{ fontSize: "28px", fontWeight: "bold", color: "#d32f2f" }}
            >
              {formatNumber(
                Math.round(
                  chartData.reduce((sum, d) => sum + d.total, 0) /
                    chartData.length,
                ),
              )}
            </div>
            <div style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
              Average Per Year
            </div>
          </div>
          <div
            style={{
              backgroundColor: "#e8f5e9",
              padding: "20px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color:
                  (changeData[changeData.length - 1]?.changePercent ?? 0) > 0
                    ? "#d32f2f"
                    : "#388e3c",
              }}
            >
              {(changeData[changeData.length - 1]?.changePercent ?? 0) > 0
                ? "+"
                : ""}
              {changeData[changeData.length - 1]?.changePercent.toFixed(1)}%
            </div>
            <div style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
              Change from {toYear - 1} to {toYear}
            </div>
          </div>
        </div>

        {/* Total Arrests Trend Line Chart */}
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ fontSize: "18px", marginBottom: "15px", color: "#333" }}>
            Total Arrests Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#1976d2"
                strokeWidth={3}
                dot={{ r: 6 }}
                activeDot={{ r: 8 }}
                name="Total Arrests"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Breakdown Chart */}
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ fontSize: "18px", marginBottom: "15px", color: "#333" }}>
            Arrests by Gender
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="male" stackId="a" fill="#1976d2" name="Male" />
              <Bar dataKey="female" stackId="a" fill="#d81b60" name="Female" />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#333"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Total"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Year-over-Year Change Chart */}
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ fontSize: "18px", marginBottom: "15px", color: "#333" }}>
            Year-over-Year Change
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={changeData.slice(1)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Bar dataKey="changePercent" fill="#666666" name="Change %">
                {changeData.slice(1).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.changePercent > 0 ? "#d32f2f" : "#388e3c"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Enhanced function to render key-value pairs with better formatting and percentage calculations
  const renderDataObject = (
    data: Record<string, number> | undefined,
    title: string,
    showPercentages = true,
    maxItems = 20,
  ) => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <div
          style={{
            backgroundColor: "#f9f9f9",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#666",
              marginBottom: "10px",
            }}
          >
            {title}
          </h3>
          <p style={{ color: "#888" }}>
            No {title.toLowerCase()} data available.
          </p>
        </div>
      );
    }

    // Calculate total for percentages
    const total = Object.values(data).reduce(
      (sum, value) => sum + (value || 0),
      0,
    );

    // Sort by count descending and filter out null/undefined values
    const sortedEntries = Object.entries(data)
      .filter(
        ([key, value]) => value !== null && value !== undefined && value !== 0,
      )
      .sort(([, a], [, b]) => (b || 0) - (a || 0))
      .slice(0, maxItems);

    if (sortedEntries.length === 0) {
      return (
        <div
          style={{
            backgroundColor: "#f9f9f9",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#666",
              marginBottom: "10px",
            }}
          >
            {title}
          </h3>
          <p style={{ color: "#888" }}>
            No significant {title.toLowerCase()} data after filtering.
          </p>
        </div>
      );
    }

    return (
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #ddd",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#333",
            marginBottom: "15px",
            borderBottom: "2px solid #eee",
            paddingBottom: "10px",
          }}
        >
          {title}
          <span
            style={{
              fontSize: "14px",
              fontWeight: "normal",
              color: "#666",
              marginLeft: "8px",
            }}
          >
            (Total: {formatNumber(total)})
          </span>
        </h3>
        <div>
          {sortedEntries.map(([key, value]) => (
            <div
              key={key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                marginBottom: "4px",
                borderRadius: "4px",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f5f5")
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
            >
              <span
                style={{
                  color: "#555",
                  fontWeight: "500",
                  textTransform: "capitalize",
                }}
              >
                {key.replace(/_/g, " ")}
              </span>
              <div style={{ textAlign: "right" }}>
                <span style={{ color: "#333", fontWeight: "600" }}>
                  {formatNumber(value)}
                </span>
                {showPercentages && total > 0 && (
                  <span
                    style={{
                      color: "#888",
                      fontSize: "12px",
                      marginLeft: "8px",
                    }}
                  >
                    ({formatPercentage(value || 0, total)})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Enhanced age demographics display
  const renderAgeData = (
    maleData: Record<string, number> | undefined,
    femaleData: Record<string, number> | undefined,
    title: string,
  ) => {
    if (!maleData && !femaleData) {
      return (
        <div
          style={{
            backgroundColor: "#f9f9f9",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
            gridColumn: "1 / -1",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#666",
              marginBottom: "10px",
            }}
          >
            {title}
          </h3>
          <p style={{ color: "#888" }}>No age demographic data available.</p>
        </div>
      );
    }

    const combinedAgeData: Record<
      string,
      { male: number; female: number; total: number }
    > = {};

    if (maleData) {
      Object.entries(maleData).forEach(([age, count]) => {
        if (!combinedAgeData[age]) {
          combinedAgeData[age] = { male: 0, female: 0, total: 0 };
        }
        combinedAgeData[age].male = count || 0;
        combinedAgeData[age].total += count || 0;
      });
    }

    if (femaleData) {
      Object.entries(femaleData).forEach(([age, count]) => {
        if (!combinedAgeData[age]) {
          combinedAgeData[age] = { male: 0, female: 0, total: 0 };
        }
        combinedAgeData[age].female = count || 0;
        combinedAgeData[age].total += count || 0;
      });
    }

    const ageOrder = [
      "Under 10",
      "Under 11",
      "10-12",
      "11-12",
      "13-14",
      "15",
      "16",
      "17",
      "18",
      "19",
      "20",
      "21",
      "22",
      "23",
      "24",
      "25-29",
      "30-34",
      "35-39",
      "40-44",
      "45-49",
      "50-54",
      "55-59",
      "60-64",
      "65 and over",
      "Adult Other",
      "Juvenile Other",
    ];

    const sortedAgeData = Object.entries(combinedAgeData)
      .filter(([, data]) => data.total > 0)
      .sort(([a], [b]) => {
        const aIndex = ageOrder.indexOf(a);
        const bIndex = ageOrder.indexOf(b);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.localeCompare(b);
      });

    const totalArrests = sortedAgeData.reduce(
      (sum, [, data]) => sum + data.total,
      0,
    );

    if (sortedAgeData.length === 0) {
      return (
        <div
          style={{
            backgroundColor: "#f9f9f9",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
            gridColumn: "1 / -1",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#666",
              marginBottom: "10px",
            }}
          >
            {title}
          </h3>
          <p style={{ color: "#888" }}>
            No significant age demographic data after filtering.
          </p>
        </div>
      );
    }

    return (
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #ddd",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          gridColumn: "1 / -1",
          marginBottom: "20px",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#333",
            marginBottom: "15px",
            borderBottom: "2px solid #eee",
            paddingBottom: "10px",
          }}
        >
          {title}
          <span
            style={{
              fontSize: "14px",
              fontWeight: "normal",
              color: "#666",
              marginLeft: "8px",
            }}
          >
            (Total Arrests: {formatNumber(totalArrests)})
          </span>
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              fontSize: "14px",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "12px 16px",
                    fontWeight: "600",
                    color: "#555",
                    borderBottom: "2px solid #dee2e6",
                  }}
                >
                  Age Range
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "12px 16px",
                    fontWeight: "600",
                    color: "#555",
                    borderBottom: "2px solid #dee2e6",
                  }}
                >
                  Male
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "12px 16px",
                    fontWeight: "600",
                    color: "#555",
                    borderBottom: "2px solid #dee2e6",
                  }}
                >
                  Female
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "12px 16px",
                    fontWeight: "600",
                    color: "#555",
                    borderBottom: "2px solid #dee2e6",
                  }}
                >
                  Total
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "12px 16px",
                    fontWeight: "600",
                    color: "#555",
                    borderBottom: "2px solid #dee2e6",
                  }}
                >
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAgeData.map(([age, data]) => (
                <tr
                  key={age}
                  style={{
                    borderTop: "1px solid #dee2e6",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8f9fa")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "")
                  }
                >
                  <td
                    style={{
                      padding: "12px 16px",
                      fontWeight: "500",
                      color: "#555",
                    }}
                  >
                    {age}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      color: "#1976d2",
                    }}
                  >
                    {formatNumber(data.male)}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      color: "#d81b60",
                    }}
                  >
                    {formatNumber(data.female)}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontWeight: "600",
                      color: "#333",
                    }}
                  >
                    {formatNumber(data.total)}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      color: "#666",
                    }}
                  >
                    {formatPercentage(data.total, totalArrests)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          marginBottom: "20px",
          color: "#333",
          textAlign: "center",
        }}
      >
        FBI Crime Data Explorer: {stateName}
      </h1>

      {/* Input Controls Section */}
      <div
        style={{
          marginBottom: "30px",
          display: "flex",
          gap: "15px",
          alignItems: "flex-end",
          flexWrap: "wrap",
          justifyContent: "center",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
        }}
      >
        <div>
          <label
            htmlFor="from-year-select"
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            From Year:
          </label>
          <select
            id="from-year-select"
            value={fromYear}
            onChange={(e) => setFromYear(Number(e.target.value))}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "2px solid #ddd",
              fontSize: "14px",
            }}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="to-year-select"
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            To Year:
          </label>
          <select
            id="to-year-select"
            value={toYear}
            onChange={(e) => setToYear(Number(e.target.value))}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "2px solid #ddd",
              fontSize: "14px",
            }}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="crime-type-select"
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Data Type / Crime:
          </label>
          <select
            id="crime-type-select"
            value={selectedCrimeConfig.value}
            onChange={(e) => {
              const selected = availableCrimeTypes.find(
                (ct) => ct.value === e.target.value,
              );
              if (selected) setSelectedCrimeConfig(selected);
            }}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "2px solid #ddd",
              minWidth: "300px",
              fontSize: "14px",
            }}
          >
            <optgroup label="Summary Reports">
              {availableCrimeTypes
                .filter((ct) => ct.category === "summary")
                .map((crimeType) => (
                  <option key={crimeType.value} value={crimeType.value}>
                    {crimeType.label}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Demographics">
              {availableCrimeTypes
                .filter((ct) => ct.category === "demographics")
                .map((crimeType) => (
                  <option key={crimeType.value} value={crimeType.value}>
                    {crimeType.label}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Offense Trends">
              {availableCrimeTypes
                .filter((ct) => ct.category === "offense_trend")
                .map((crimeType) => (
                  <option key={crimeType.value} value={crimeType.value}>
                    {crimeType.label}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
        <button
          onClick={handleFetchData}
          disabled={loading || !selectedCrimeConfig.value}
          style={{
            padding: "12px 20px",
            backgroundColor:
              loading || !selectedCrimeConfig.value ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor:
              loading || !selectedCrimeConfig.value ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) => {
            if (!(loading || !selectedCrimeConfig.value)) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "#0056b3";
            }
          }}
          onMouseLeave={(e) => {
            if (!(loading || !selectedCrimeConfig.value)) {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "#007bff";
            }
          }}
        >
          {loading ? "Loading..." : "Fetch Data"}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            border: "2px solid #d32f2f",
            color: "#d32f2f",
            backgroundColor: "#ffebee",
            borderRadius: "8px",
          }}
        >
          <strong>⚠️ Data Retrieval Issue:</strong> {error}
        </div>
      )}

      {/* Loading / Initial Message */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            fontSize: "18px",
            color: "#666",
          }}
        >
          Loading crime data...
        </div>
      )}
      {!loading && !error && !crimeData && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            backgroundColor: "#e3f2fd",
            borderRadius: "8px",
            color: "#1565c0",
            fontSize: "16px",
            border: "1px solid #bbdefb",
          }}
        >
          Please select parameters and click &quot;Fetch Data&quot; to explore
          crime statistics.
        </div>
      )}

      {/* Conditional Data Display */}
      {crimeData && !error && (
        <div>
          {/* Summarized Offense Annual Table */}
          {crimeData.dataType === "summarized_offense_annual" &&
            crimeData.summaries &&
            crimeData.summaries.length > 0 &&
            crimeData.crimeTypeKey && (
              <div>
                <h2
                  style={{
                    fontSize: "24px",
                    marginBottom: "20px",
                    color: "#333",
                    textAlign: "center",
                  }}
                >
                  {selectedCrimeConfig.label} Data for {stateName} ({fromYear} -{" "}
                  {toYear})
                </h2>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    border: "1px solid #ddd",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f8f9fa" }}>
                      <th
                        style={{
                          padding: "12px 15px",
                          borderBottom: "2px solid #dee2e6",
                          textAlign: "left",
                          fontWeight: "600",
                          fontSize: "14px",
                          color: "#333",
                        }}
                      >
                        Year
                      </th>
                      <th
                        style={{
                          padding: "12px 15px",
                          borderBottom: "2px solid #dee2e6",
                          textAlign: "right",
                          fontWeight: "600",
                          fontSize: "14px",
                          color: "#333",
                        }}
                      >
                        {selectedCrimeConfig.label} Count
                      </th>
                      <th
                        style={{
                          padding: "12px 15px",
                          borderBottom: "2px solid #dee2e6",
                          textAlign: "right",
                          fontWeight: "600",
                          fontSize: "14px",
                          color: "#333",
                        }}
                      >
                        Population
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {crimeData.summaries.map((summary) => (
                      <tr
                        key={summary.year}
                        style={{ borderTop: "1px solid #eee" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#f5f5f5")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "white")
                        }
                      >
                        <td
                          style={{
                            padding: "10px 15px",
                            fontWeight: "500",
                            fontSize: "14px",
                            color: "#333",
                          }}
                        >
                          {summary.year}
                        </td>
                        <td
                          style={{
                            padding: "10px 15px",
                            textAlign: "right",
                            fontSize: "14px",
                            color: "#333",
                          }}
                        >
                          {formatNumber(summary[crimeData.crimeTypeKey!])}
                        </td>
                        <td
                          style={{
                            padding: "10px 15px",
                            textAlign: "right",
                            fontSize: "14px",
                            color: "#555",
                          }}
                        >
                          {formatNumber(summary.population)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          {/* Offense Yearly Trend Charts */}
          {crimeData.dataType === "offense_yearly_trend" &&
            crimeData.offenseYearlyData &&
            crimeData.offenseYearlyData.length > 0 &&
            renderOffenseTrendCharts(
              crimeData.offenseYearlyData,
              crimeData.offenseName ?? selectedCrimeConfig.label,
            )}

          {/* Arrest Demographics Total */}
          {crimeData.dataType === "arrest_demographics_total" &&
            crimeData.arrestDemographics && (
              <div>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#333",
                    marginBottom: "20px",
                    textAlign: "center",
                  }}
                >
                  Arrest Demographics for {stateName} ({fromYear} - {toYear})
                </h2>

                {/* Summary Statistics */}
                <div
                  style={{
                    backgroundColor: "#e3f2fd",
                    padding: "20px",
                    borderRadius: "8px",
                    border: "1px solid #bbdefb",
                    marginBottom: "30px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      color: "#1565c0",
                      marginBottom: "15px",
                      borderBottom: "1px solid #bbdefb",
                      paddingBottom: "10px",
                    }}
                  >
                    Key Statistics
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    <div
                      style={{
                        textAlign: "center",
                        padding: "10px",
                        backgroundColor: "rgba(255,255,255,0.5)",
                        borderRadius: "6px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "26px",
                          fontWeight: "bold",
                          color: "#1976d2",
                        }}
                      >
                        {formatNumber(
                          (crimeData.arrestDemographics["Arrestee Sex"]?.Male ??
                            0) +
                            (crimeData.arrestDemographics["Arrestee Sex"]
                              ?.Female ?? 0),
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#424242",
                          marginTop: "5px",
                        }}
                      >
                        Total Arrests
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "10px",
                        backgroundColor: "rgba(255,255,255,0.5)",
                        borderRadius: "6px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "26px",
                          fontWeight: "bold",
                          color: "#1976d2",
                        }}
                      >
                        {formatNumber(
                          crimeData.arrestDemographics["Arrestee Sex"]?.Male ??
                            0,
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#424242",
                          marginTop: "5px",
                        }}
                      >
                        Male Arrests
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "10px",
                        backgroundColor: "rgba(255,255,255,0.5)",
                        borderRadius: "6px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "26px",
                          fontWeight: "bold",
                          color: "#d81b60",
                        }}
                      >
                        {formatNumber(
                          crimeData.arrestDemographics["Arrestee Sex"]
                            ?.Female ?? 0,
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#424242",
                          marginTop: "5px",
                        }}
                      >
                        Female Arrests
                      </div>
                    </div>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "10px",
                        backgroundColor: "rgba(255,255,255,0.5)",
                        borderRadius: "6px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "26px",
                          fontWeight: "bold",
                          color: "#388e3c",
                        }}
                      >
                        {
                          Object.keys(
                            crimeData.arrestDemographics["Offense Name"] || {},
                          ).length
                        }
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#424242",
                          marginTop: "5px",
                        }}
                      >
                        Offense Types Reported
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrestee Demographics (Sex & Race) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                    gap: "20px",
                    marginBottom: "30px",
                  }}
                >
                  {renderDataObject(
                    crimeData.arrestDemographics["Arrestee Sex"],
                    "Arrests by Sex",
                    true,
                    10,
                  )}
                  {renderDataObject(
                    crimeData.arrestDemographics["Arrestee Race"],
                    "Arrests by Race",
                    true,
                    10,
                  )}
                </div>

                {/* Offense Details Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
                    gap: "20px",
                    marginBottom: "30px",
                  }}
                >
                  {renderDataObject(
                    crimeData.arrestDemographics["Offense Category"],
                    "Top Offense Categories",
                    true,
                    15,
                  )}
                  {renderDataObject(
                    crimeData.arrestDemographics["Offense Name"],
                    "Top Offense Names",
                    true,
                    15,
                  )}
                </div>

                {/* Arrests by Age Table */}
                {renderAgeData(
                  crimeData.arrestDemographics["Male Arrests By Age"],
                  crimeData.arrestDemographics["Female Arrests By Age"],
                  "Arrests by Age and Sex",
                )}

                {/* Data Source Information */}
                {crimeData.arrestDemographics.cde_properties && (
                  <div
                    style={{
                      backgroundColor: "#fafafa",
                      padding: "20px",
                      borderRadius: "8px",
                      border: "1px solid #e0e0e0",
                      marginTop: "20px",
                      gridColumn: "1 / -1",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#424242",
                        marginBottom: "15px",
                        borderBottom: "1px solid #e0e0e0",
                        paddingBottom: "10px",
                      }}
                    >
                      Data Source Information
                    </h3>
                    <ul
                      style={{
                        listStyle: "none",
                        paddingLeft: 0,
                        fontSize: "14px",
                      }}
                    >
                      {Object.entries(
                        crimeData.arrestDemographics.cde_properties,
                      ).map(([key, valueObj]) =>
                        Object.entries(valueObj).map(([source, date]) => (
                          <li
                            key={`${key}-${source}`}
                            style={{ padding: "6px 0", color: "#555" }}
                          >
                            <span style={{ fontWeight: "500" }}>
                              {`${key.replace(/_/g, " ")} (${source})`}:
                            </span>{" "}
                            <strong>{date}</strong>
                          </li>
                        )),
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
