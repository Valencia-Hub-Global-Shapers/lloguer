import { setWorkerUrl } from "maplibre-gl";

let configured = false;

/**
 * Point MapLibre at the worker copy served from /public (see
 * scripts/copy-maplibre-worker.mjs). Without this, v6 can't locate the worker
 * in a production bundle and the map stays blank. Idempotent: call it before
 * creating any map.
 */
export function ensureMapWorker(): void {
  if (configured) return;
  setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
  configured = true;
}
