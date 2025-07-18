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

  await Promise.all(
    Array.from({ length: 2024 - 2014 }, async (_, index) => {
      const i = 2014 + index;

      const [tempState, tempCountry, tempCounty] = (await Promise.all([
        fetch(
          `https://api.census.gov/data/${i}/acs/acsse?get=NAME,K202301_003E,K202301_005E&for=state:${stateFips}`,
        )
          .then((res) => res.json())
          .catch(() => {
            console.log("State", i);
            return null;
          }),

        fetch(
          `https://api.census.gov/data/${i}/acs/acsse?get=NAME,K202301_003E,K202301_005E&for=us`,
        )
          .then((res) => res.json())
          .catch(() => {
            console.log("Country", i);
            return null;
          }),

        fetch(
          `https://api.census.gov/data/${i}/acs/acsse?get=NAME,K202301_003E,K202301_005E&for=county:${countyFips}&in=state:${stateFips}`,
        )
          .then((res) => res.json())
          .catch(() => {
            console.log("County", i);
            return null;
          }),
      ])) as [result, result, result];

      unemployments.state[index] =
        (tempState?.[1]?.[2] ?? 0) / (tempState?.[1]?.[1] ?? 1) || null;
      unemployments.country[index] =
        (tempCountry?.[1]?.[2] ?? 0) / (tempCountry?.[1]?.[1] ?? 1) || null;
      unemployments.county[index] =
        (tempCounty?.[1]?.[2] ?? 0) / (tempCounty?.[1]?.[1] ?? 1) || null;
      unemployments.label[index] = i.toString();
    }),
  );
  console.log(unemployments);
  return <Chart unemployments={unemployments} />;
}
