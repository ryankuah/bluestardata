import BLSQCEW from "./BLSQCEW";

const BLS_API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/";

export type BLSDataSummary = {
    year: string;
    data: Record<string, Record<string, number>>;
};

type BLSResponse = {
    Results?: {
        series?: {
            seriesID: string;
            data?: { year: string; value: string }[];
        }[];
    };
};

type IndustryData = {
    employees: number;
    establishments: number;
    industry: string;
    countyName: string;
    naicsCode: string;
};

export async function fetchBLSData(stateFips: string, countyFips: string): Promise<BLSDataSummary[]> {
    const areaCode = stateFips + countyFips;
    const dataTypes = ["1", "2", "3", "4", "5"];
    const size = "0";
    const ownership = "5";

    const labourResponse = await fetch(
        `https://api.census.gov/data/2022/cbp?get=EMP,ESTAB,NAICS2017_LABEL,NAME&for=county:${countyFips}&in=state:${stateFips}&NAICS2017=*`
    ).catch((err) => console.error("Error fetching Census CBP data:", err));

    if (!labourResponse?.ok) {
        throw new Error("Failed to fetch Census CBP data");
    }

    const labourData = (await labourResponse.json()) as [string, string, string, string, string, string, string][];

    if (!Array.isArray(labourData) || labourData.length < 2) {
        throw new Error("Invalid response from Census API");
    }

    const topIndustries: IndustryData[] = Object.values(
        labourData
            .slice(1)
            .map((entry: string[]): IndustryData | null => {
                const [employees, establishments, industry, countyName, naics] = entry;
    
                if (!industry || !countyName || !naics) return null;
    
                const cleanedNaics = naics.includes("-") ? naics.split("-")[0] : naics;
    
                return {
                    employees: Number(employees) || 0,
                    establishments: Number(establishments) || 0,
                    industry,
                    countyName,
                    naicsCode: cleanedNaics || "",
                };
            })
            .filter((entry): entry is IndustryData => entry !== null && entry.naicsCode !== "00")
            .reduce<Record<string, IndustryData>>((acc, entry) => {
                const existingEntry = acc[entry.industry];
    
                if (!existingEntry || Number(entry.naicsCode) < Number(existingEntry.naicsCode)) {
                    acc[entry.industry] = entry;
                }
                return acc;
            }, {})
    )
        .sort((a, b) => b.employees - a.employees)
        .slice(0, 5);
    
    const industryMap = Object.fromEntries(topIndustries.map(({ naicsCode, industry }) => [naicsCode, industry]));
    industryMap["10"] = "Total, all industries";

    const industryCodes = ["10", ...topIndustries.map((industry) => industry.naicsCode)];

    const seriesIds = industryCodes.flatMap((industry) =>
        dataTypes.map((dataType) => `ENU${areaCode}${dataType}${size}${ownership}${industry}`)
    );

    const payload = {
        seriesid: seriesIds,
        registrationkey: process.env.NEXT_PUBLIC_BLS_API_KEY,
        startyear: "2010",
        endyear: "2023",
    };

    const response = await fetch(BLS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch data from BLS API");
    }

    const json = (await response.json()) as BLSResponse;

    if (!json.Results?.series?.length) {
        throw new Error("No results returned from BLS API");
    }

    const summary: Record<string, BLSDataSummary> = {};

    for (const series of json.Results.series) {
        if (!series.seriesID || !series.data) continue;

        const match = /ENU\d{5}(\d)(\d)(\d)(\d+)/.exec(series.seriesID);
        if (!match || match.length < 5) continue;

        const dataType = match[1];
        const industry = match[4];

        if (!dataType || !industry) continue;

        const industryName = industryMap[industry] ?? `NAICS ${industry}`;

        for (const { year, value } of series.data) {
            summary[year] ??= { year, data: {} };
            summary[year].data[dataType] ??= {};
            summary[year].data[dataType][industryName] = Number(value) ?? 0;
        }
    }

    return Object.values(summary).sort((a, b) => Number(a.year) - Number(b.year));
}

export default async function BLSDataFetcher({
    _state,
    _county,
    stateFips,
    countyFips,
}: {
    _state: string;
    _county: string;
    stateFips: string;
    countyFips: string;
}) {
    try {
        const summaryData = await fetchBLSData(stateFips, countyFips);
        return <BLSQCEW data={summaryData} state={_state} county={_county} />;
    } catch (error) {
        console.error("Error fetching BLS data:", error);
        return <div className="text-red-500 text-center">Failed to load data</div>;
    }
}
