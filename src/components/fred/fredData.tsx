"use client";
import { type Observations } from "@/utils/fred/types";
import { useState, useRef, useEffect } from "react";
import { fetchObservation } from "@/utils/fred/utils";
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
import { HiChevronDown, HiX } from "react-icons/hi";

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
  const [search, setSearch] = useState<string>("");
  const [codes, setCodes] = useState<[string, string][]>(
    Array.from(new Set(code.map((item) => JSON.stringify(item)))).map(
      (item) => JSON.parse(item) as [string, string],
    ),
  );
  const [selectedCodes, setSelectedCodes] = useState<[string, string][]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isDropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCodes = codes.filter((c) =>
    c[1].toLowerCase().includes(search.toLowerCase()),
  );

  const handleCheckboxChange = async (code: [string, string]) => {
    const isSelected = selectedCodes.some((c) => c[0] === code[0]);
    if (isSelected) {
      setSelectedCodes(selectedCodes.filter((c) => c[0] !== code[0]));
      setObservation(observation.filter((obs) => obs.code !== code[0]));
    } else {
      setSelectedCodes([...selectedCodes, code]);
      const newObservation = await fetchObservation(code[0], code[1]);
      setObservation([...observation, newObservation]);
    }
  };

  const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);

  const toggleTab = (seriesCode: string) => {
    setExpanded((prev) => (prev === seriesCode ? null : seriesCode));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="mr-2 flex flex-col">
      <div className="relative mb-4">
        <input
          type="text"
          className="w-full rounded-md border p-2 outline-none"
          placeholder="Search or select series..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClick={toggleDropdown}
        />
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-white shadow-lg"
          >
            {filteredCodes.map((code) => (
              <label
                key={code[0]}
                className="flex items-center px-3 py-2 hover:bg-gray-100"
              >
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={!!selectedCodes.find((c) => c[0] === code[0])}
                  onChange={() => handleCheckboxChange(code)}
                />
                {code[1]}
              </label>
            ))}
            {filteredCodes.length === 0 && (
              <div className="px-3 py-2 text-gray-500">No results found</div>
            )}
          </div>
        )}
      </div>
      <div>
        <h2 className="mb-2 text-xl font-semibold">Selected Observations</h2>
        <div className="flex flex-col gap-2">
          {observation.length === 0 ? (
            <div className="py-4 text-center text-gray-500">
              No Observations Selected
            </div>
          ) : (
            observation.map((obs) => (
              <div
                key={obs.code}
                className="rounded-md border border-gray-300 shadow-sm"
              >
                <div className="flex items-center justify-between bg-gray-100 px-3 py-2">
                  <span>{obs.name}</span>
                  <div className="flex items-center gap-2">
                    <button className="p-1" onClick={() => toggleTab(obs.code)}>
                      <HiChevronDown
                        className={`h-5 w-5 ${
                          expanded === obs.code ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <button
                      className="p-1 text-red-500 hover:text-red-700"
                      onClick={() => handleCheckboxChange([obs.code, obs.name])}
                    >
                      <HiX className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {expanded === obs.code && (
                  <div className="p-3">
                    <Chart observation={obs} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
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
