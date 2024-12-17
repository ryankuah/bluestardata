"use client";
import { type Observations } from "@/utils";
import { useState } from "react";
import { fetchObservation, addObservation } from "@/utils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

export function FREDData({
  observations,
  code,
  place,
}: {
  observations: Observations[];
  code: [string, string][];
  place: string;
}) {
  const [observation, setObservation] = useState<Observations[]>(observations);

  const [open, setOpen] = useState(false);

  const [codes, setCodes] = useState<[string, string][]>(code);

  return (
    <div className="mr-2 flex flex-col">
      <div className="flex flex-row">
        <div className="mx-auto"></div>
        <button
          className="rounded-sm bg-red-100 outline outline-black"
          onClick={() => setOpen(!open)}
        >
          {open ? "See Data" : "Add More Series"}
        </button>
      </div>
      {open ? (
        <FREDSeriesPage
          observations={observation}
          setObservation={setObservation}
          codes={codes}
          setCodes={setCodes}
          place={place}
        />
      ) : (
        <FREDDataPage observations={observation} />
      )}
    </div>
  );
}

function FREDDataPage({ observations }: { observations: Observations[] }) {
  return (
    <div>
      {observations.map((observation) => (
        <div key={observation.code}>
          <Chart observation={observation} />
        </div>
      ))}
    </div>
  );
}

function Chart({ observation }: { observation: Observations }) {
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
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: observation.name,
      },
    },
  };
  const labels = observation.observations.map((obs) => obs.date);
  const data = {
    labels,
    datasets: [
      {
        label: "Dataset 1",
        data: observation.observations.map((obs) => obs.value),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };
  return <Line options={options} data={data} />;
}

function FREDSeriesPage({
  observations,
  setObservation,
  codes,
  setCodes,
  place,
}: {
  codes: [string, string][];
  setCodes: React.Dispatch<React.SetStateAction<[string, string][]>>;
  observations: Observations[];
  setObservation: React.Dispatch<React.SetStateAction<Observations[]>>;
  place: string;
}) {
  const handleSubmit = async (code: [string, string], county: string) => {
    setCodes(codes.filter((existingCode) => existingCode !== code));
    const newObservation = await fetchObservation(code[0], code[1]);
    console.log("hi");
    await addObservation(code, county);
    setObservation([...observations, newObservation]);
  };
  return (
    <div className="flex h-full w-full flex-col overflow-y-scroll">
      {codes.map((code) => (
        <div
          key={code[0]}
          className="my-2 flex h-max w-full flex-row rounded-md border border-black p-2"
        >
          <div className="flex flex-col">
            <p>{code[0]} </p>
            <p>{code[1]} </p>
          </div>
          <div className="mx-auto"></div>
          <button
            className="rounded-md border border-black bg-green-700"
            onClick={async () => await handleSubmit(code, place)}
          >
            Add Series
          </button>
        </div>
      ))}
    </div>
  );
}
