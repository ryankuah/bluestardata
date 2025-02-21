import type { DataSet } from "@/utils/db/types";
export type CountyPageData = {
  county: {
    name: string;
    fipsCode: string;
    geoId: string;
  };
  state: {
    name: string;
    fipsCode: string;
  };
  data: Record<string, Record<string, Record<string, DataSet[]>>>;
};
