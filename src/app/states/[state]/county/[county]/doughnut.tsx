"use client";
import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

export function LabourDoughnut({
  doughnutData,
}: {
  doughnutData: DoughnutData[];
}) {
  ChartJS.register(ArcElement, Tooltip, Legend);

  const colors = [];
  for (const _ of doughnutData) {
    colors.push(
      `rgb(${Math.floor(Math.random() * 256)},${Math.floor(
        Math.random() * 256,
      )},${Math.floor(Math.random() * 256)})`,
    );
  }

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
    <div className="flex flex-row">
      <Doughnut data={empData} options={{ responsive: true }} />
      <Doughnut data={estabData} options={{ responsive: true }} />
    </div>
  );
}

export type DoughnutData = {
  emp: number;
  estab: number;
  label: string;
};
