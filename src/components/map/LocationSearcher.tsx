import { Search } from "@/components/ui/search";
import { type Feature, type AllCounties } from "@/utils/map/types";
import { useRouter } from "next/navigation";

interface SearchOption {
  value: string;
  label: string;
  data?: unknown;
}

interface LocationData {
  type: "state" | "county";
  feature?: Feature;
  geoId?: string;
}

interface LocationSearcherProps {
  states: Feature[];
  allCounties: AllCounties[];
  onStateSelect: (feature: Feature) => void;
  className?: string;
}

export function LocationSearcher({
  states,
  allCounties,
  onStateSelect,
  className,
}: LocationSearcherProps) {
  const router = useRouter();

  // Create search options for both states and counties
  const searchOptions: SearchOption[] = [
    // Add states
    ...states.map((state) => ({
      value: `state-${state.properties.fipsCode?.toString() ?? state.id}`,
      label: state.properties.name,
      data: {
        type: "state" as const,
        feature: state,
      } as LocationData,
    })),
    // Add counties
    ...allCounties.flatMap((state) =>
      state.counties.map((county) => ({
        value: `county-${county.geoId}`,
        label: `${county.name}, ${state.name}`,
        data: {
          type: "county" as const,
          geoId: county.geoId,
        } as LocationData,
      })),
    ),
  ];

  const handleLocationSelect = (option: SearchOption) => {
    const locationData = option.data as LocationData;

    if (locationData.type === "state" && locationData.feature) {
      // Handle state selection - zoom to state
      onStateSelect(locationData.feature);
    } else if (locationData.type === "county" && locationData.geoId) {
      // Handle county selection - redirect to county page
      router.push(`/county/${locationData.geoId}`);
    }
  };

  return (
    <Search
      options={searchOptions}
      placeholder="Search for a state or county..."
      onSelect={handleLocationSelect}
      className={className}
    />
  );
}
