import type { FillLayer, LayerProps } from "react-map-gl";

export const dataLayer: FillLayer = {
  id: "data",
  type: "fill",
  source: "mapbox",
  paint: {
    "fill-color": {
      property: "percentile",
      stops: [
        [0, "#3288bd"],
        [1, "#66c2a5"],
        [2, "#abdda4"],
        [3, "#e6f598"],
        [4, "#ffffbf"],
        [5, "#fee08b"],
        [6, "#fdae61"],
        [7, "#f46d43"],
        [8, "#d53e4f"],
      ],
    },
    "fill-opacity": 0.8,
  },
};

export const borderLayer: LayerProps = {
  id: "borders",
  type: "line",
  paint: {
    "line-color": "#000",
    "line-width": 1,
    "line-opacity": 0.8,
  },
};
