import type { Bounds } from "@/features/listings/types";

/** Pins are clustered at this zoom and below; closer in, every listing is its own pin. */
export const CLUSTER_MAX_ZOOM = 13;

/** Target on-screen size of a cluster cell, in CSS pixels. */
const CLUSTER_CELL_PX = 60;

const MAPBOX_TILE_SIZE = 512;

/**
 * Grid cell size in degrees of longitude for server-side clustering at a given
 * map zoom (about CLUSTER_CELL_PX on screen). 0 means "do not cluster".
 */
export function clusterCellSize(zoom: number | null | undefined): number {
  if (zoom == null || !Number.isFinite(zoom) || zoom > CLUSTER_MAX_ZOOM) return 0;
  const z = Math.max(0, zoom);
  return (CLUSTER_CELL_PX * 360) / (MAPBOX_TILE_SIZE * 2 ** z);
}

/** Approximate zoom at which a viewport of the given pixel width shows `bounds`. */
export function zoomForBounds(bounds: Bounds, viewportWidthPx = 900): number {
  const lngSpan = Math.max(bounds.maxLng - bounds.minLng, 1e-6);
  return Math.log2((360 * viewportWidthPx) / (MAPBOX_TILE_SIZE * lngSpan));
}

/** Compact count for cluster badges: 999, 1.2k, 15k. */
export function formatCount(count: number): string {
  if (count < 1000) return String(count);
  const k = count / 1000;
  return `${k < 10 ? k.toFixed(1).replace(/\.0$/, "") : Math.round(k)}k`;
}
