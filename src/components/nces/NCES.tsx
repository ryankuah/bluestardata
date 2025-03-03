import { type Feature } from "geojson";
import Table from "@/components/dataUI/Table";
import Map from "./map";
import type { NCESData } from "@/utils/nces/types";

export default function NCES({
  feature,
  token,
  state,
  county,
  stateFips,
  countyFips,
  data,
}: {
  feature: Feature;
  token: string;
  state: string;
  county: string;
  countyFips: string;
  stateFips: string;
  data: NCESData[];
}) {
  const tableData = Object.values(data);
  const headers = [
    {
      header: "School Name",
      accessorKey: "NAME",
    },
    {
      header: "School Level",
      accessorKey: "SCHOOLLEVEL",
    },
    {
      header: "School Type",
      accessorKey: "SCHOOLTYPE",
    },
    {
      header: "Status",
      accessorKey: "STATUS",
    },
    {
      header: "Free Lunches",
      accessorKey: "FREELUNCH",
    },
    {
      header: "Reduced Lunches",
      accessorKey: "REDUCELUNCH",
    },
    {
      header: "Direct Certificate",
      accessorKey: "DIRECTCERT",
    },
    {
      header: "Pre-K",
      accessorKey: "PK",
    },
    {
      header: "Kindergarden",
      accessorKey: "KG",
    },
    {
      header: "Grade 1",
      accessorKey: "G1",
    },
    {
      header: "Grade 2",
      accessorKey: "G2",
    },
    {
      header: "Grade 3",
      accessorKey: "G3",
    },
    {
      header: "Grade 4",
      accessorKey: "G4",
    },
    {
      header: "Grade 5",
      accessorKey: "G5",
    },
    {
      header: "Grade 6",
      accessorKey: "G6",
    },
    {
      header: "Grade 7",
      accessorKey: "G7",
    },
    {
      header: "Grade 8",
      accessorKey: "G8",
    },
    {
      header: "Grade 9",
      accessorKey: "G9",
    },
    {
      header: "Grade 10",
      accessorKey: "G10",
    },
    {
      header: "Grade 11",
      accessorKey: "G11",
    },
    {
      header: "Grade 12",
      accessorKey: "G12",
    },
    {
      header: "Grade 13",
      accessorKey: "G13",
    },
    {
      header: "Not in a Grade",
      accessorKey: "UNGRADED",
    },
    {
      header: "Adult Students",
      accessorKey: "ADULT",
    },
    {
      header: "Male Students",
      accessorKey: "MALE",
    },
    {
      header: "Female Students",
      accessorKey: "FEMALE",
    },
    {
      header: "Teachers",
      accessorKey: "TEACHERS",
    },
  ];

  return (
    <div>
      <Map feature={feature} token={token} data={tableData} />
      <Table
        data={tableData}
        state={state}
        county={county}
        name="Public Schools"
        headers={headers}
      />
    </div>
  );
}
