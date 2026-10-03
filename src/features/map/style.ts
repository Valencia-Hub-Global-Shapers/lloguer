import type { StyleSpecification } from "maplibre-gl";

/**
 * Basemap. Defaults to the public OpenStreetMap raster tiles, which are fine
 * for light use only (see https://operations.osmfoundation.org/policies/tiles/).
 * Before serving real traffic, set NEXT_PUBLIC_MAP_TILE_URL to a provider or
 * self-hosted endpoint (MapTiler, Stadia Maps, Protomaps…) and
 * NEXT_PUBLIC_MAP_TILE_ATTRIBUTION to its required attribution string.
 */
const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

const tileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? OSM_TILES;
const attribution = process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ?? OSM_ATTRIBUTION;

export const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [tileUrl],
      tileSize: 256,
      maxzoom: 19,
      attribution,
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};
