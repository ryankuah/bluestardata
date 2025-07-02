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
  fred: {
    stateId: number | null;
    countyId: number | null;
    stateName: string;
    countyName: string;
  };
  acsse: Record<string, Record<string, DataSet[]>>;
  publicNCES: object[];
  privateNCES: object[];
};
