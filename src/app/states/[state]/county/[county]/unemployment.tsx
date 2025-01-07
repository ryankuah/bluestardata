type result = [string, number, number, number][];
import { Chart, type Unemployments } from "./chart";
export default async function Unemployment({
  state,
  county,
  stateFips,
  countyFips,
}: {
  state: string;
  county: string;
  stateFips: string;
  countyFips: string;
}) {
  const unemployments: Unemployments = {
    state: [],
    county: [],
    country: [],
    label: [],
    countyName: county,
    stateName: state,
  };

  for (let i = 2014; i <= 2023; i++) {
    const tempState = (await fetch(
      `https://api.census.gov/data/${i}/acs/acsse?get=NAME,K202301_002E,K202301_005E&for=state:${stateFips}`,
    )
      .then((res) => res.json())
      .catch(() => console.log("State", i))) as result;
    const tempCountry = (await fetch(
      `https://api.census.gov/data/${i}/acs/acsse?get=NAME,K202301_002E,K202301_005E&for=us`,
    )
      .then((res) => res.json())
      .catch(() => console.log("Country", i))) as result;
    const tempCounty = (await fetch(
      `https://api.census.gov/data/${i}/acs/acsse?get=NAME,K202301_002E,K202301_005E&for=county:${countyFips}&in=state:${stateFips}`,
    )
      .then((res) => res.json())
      .catch(() => console.log("County", i))) as result;
    unemployments.state.push(
      (tempState?.[1]?.[2] ?? 0) / (tempState?.[1]?.[1] ?? 1) || null,
    );
    unemployments.country.push(
      (tempCountry?.[1]?.[2] ?? 0) / (tempCountry?.[1]?.[1] ?? 1) || null,
    );
    unemployments.county.push(
      (tempCounty?.[1]?.[2] ?? 0) / (tempCounty?.[1]?.[1] ?? 1) || null,
    );
    unemployments.label.push(i.toString());
  }
  return <Chart unemployments={unemployments} />;
}
