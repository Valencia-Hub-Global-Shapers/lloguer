import type { StyleSpecification } from "maplibre-gl";

/**
 * Basemap: public OpenStreetMap raster tiles, no API key. Fine for a modest
 * traffic site; see https://operations.osmfoundation.org/policies/tiles/ and
 * switch to a tile provider (or self-host) before serving heavy traffic.
 */
export const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};
