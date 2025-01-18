"use client";
import React, { useMemo } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

export function LabourDoughnut({
  doughnutData,
}: {
  doughnutData: DoughnutData[];
}) {
  ChartJS.register(ArcElement, Tooltip, Legend);

  const colors: string[] = useMemo(() => {
    const hashToColor = (str: string): string => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const color = `rgb(${(hash & 0xff0000) >> 16},${(hash & 0x00ff00) >> 8},${hash & 0x0000ff})`;
      return color;
    };
    return doughnutData.map((item) => hashToColor(item.label));
  }, [doughnutData]);

  const sortedEmpData = [...doughnutData]
    .sort((a, b) => b.emp - a.emp)
    .slice(0, 5);

  const sortedEstabData = [...doughnutData]
    .sort((a, b) => b.estab - a.estab)
    .slice(0, 5);

  const empData = {
    labels: doughnutData.map((item) => item.label),
    datasets: [
      {
        label: "Number of Employees by Industry",
        data: doughnutData.map((item) => item.emp),
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1,
      },
    ],
  };

  const estabData = {
    labels: doughnutData.map((item) => item.label),
    datasets: [
      {
        label: "Number of Establishments by Industry",
        data: doughnutData.map((item) => item.estab),
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="flex items-start justify-center gap-8 w-full">
      <div className="flex flex-row items-center gap-6">
        <div className="flex flex-col items-center">
          <h3 className="mb-4 text-lg font-semibold">Employment Distribution</h3>
          <div className="h-[250px] w-[250px]">
            <Doughnut
              data={empData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = context.raw;
                        return `${context.label}: ${value?.toLocaleString()}`;
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>
        <div className="flex flex-col text-left">
          {sortedEmpData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span
                className="h-4 w-4"
                style={{
                  backgroundColor: colors[index],
                }}
              ></span>
              <span className="text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-[1px] bg-gray-300"></div>

      <div className="flex flex-row items-center gap-6">
        <div className="flex flex-col items-center">
          <h3 className="mb-4 text-lg font-semibold">Establishment Distribution</h3>
          <div className="h-[250px] w-[250px]">
            <Doughnut
              data={estabData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = context.raw;
                        return `${context.label}: ${value?.toLocaleString()}`;
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>
        <div className="flex flex-col text-left">
          {sortedEstabData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span
                className="h-4 w-4"
                style={{
                  backgroundColor: colors[index],
                }}
              ></span>
              <span className="text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export type DoughnutData = {
  emp: number;
  estab: number;
  label: string;
};
