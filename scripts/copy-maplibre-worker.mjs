/**
 * MapLibre GL v6 loads and decodes tiles in a web worker. Bundlers (webpack /
 * Turbopack) cannot resolve that worker's URL from `import.meta.url`, so in a
 * production build it comes out empty, the worker never starts and the map is
 * left as a flat background. Copy the worker and its sibling chunk into
 * `public/maplibre/` and point MapLibre at them with `setWorkerUrl()`
 * (see src/features/map/worker.ts).
 */
import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const distDir = dirname(require.resolve("maplibre-gl/dist/maplibre-gl-worker.mjs"));
const outDir = resolve(process.cwd(), "public/maplibre");

await mkdir(outDir, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  await copyFile(resolve(distDir, file), resolve(outDir, file));
}
console.log(`copied MapLibre worker -> ${outDir}`);
