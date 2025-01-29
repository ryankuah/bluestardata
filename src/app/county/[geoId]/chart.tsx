"use client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";

export type Unemployments = {
  state: (number | null)[];
  county: (number | null)[];
  country: (number | null)[];
  label: string[];
  countyName: string;
  stateName: string;
};

export function Chart({ unemployments }: { unemployments: Unemployments }) {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
  );
  const options = {
    scales: {
      y: {
        ticks: {
          callback: function (value: number) {
            return (value * 100).toFixed(1) + "%";
          },
        },
      },
    },
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<"line">) {
            return (context.parsed.y * 100).toFixed(2) + "%";
          },
        },
      },
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Unemployment Rate",
      },
    },
  };
  const data = {
    labels: unemployments.label,
    datasets: [
      {
        label: unemployments.countyName,
        data: unemployments.county,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        spanGaps: true,
      },
      {
        label: unemployments.stateName,
        data: unemployments.state,
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        spanGaps: true,
      },
      {
        label: "United States",
        data: unemployments.country,
        borderColor: "rgb(255, 206, 86)",
        backgroundColor: "rgba(255, 206, 86, 0.5)",
        spanGaps: true,
      },
    ],
  };
  // @ts-expect-error-imoverthis
  return <Line options={options} data={data} />;
}
