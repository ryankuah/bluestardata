import type { NCESData } from "@/utils/nces/types";

export type DataSet = {
  name: string;
  data: Record<string, string | number>;
  units: string;
};

export type CountyData = {
  id: number;
  countyId: string;
  category: string | null;
  source: string | null;
  name: string;
  dataSet: DataSet[];
};
