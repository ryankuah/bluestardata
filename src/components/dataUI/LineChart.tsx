import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import type { DataSet } from "@/utils/db/types";

export default function LineChart({ dataSet }: { dataSet: DataSet[] }) {
  if (!dataSet[0]?.data) throw new Error("Data not found");

  const data = dataSet.map((dataYear) => {
    return {
      name: dataYear.name,
      ...dataYear.data,
    };
  });

  const dataKeys = Object.keys(dataSet[0].data);

  console.log("datasdfdsa", data);
  console.log("dataKeys", dataKeys);

  return (
    <ResponsiveContainer width="100%" height={400} className="p-1">
      <RechartsLineChart data={data}>
        <XAxis dataKey={"name"} />
        <YAxis />
        <Tooltip formatter={(value: number) => value.toLocaleString()} />
        <Legend />
        {dataKeys.map((key, index) => (
          <Line
            key={index}
            type="monotone"
            dataKey={key}
            stroke={strokeColors[index]}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

const strokeColors = [
  "#8884d8",
  "#82ca9d",
  "#ff7300",
  "#ffbb28",
  "#d62728",
  "#17becf",
];
