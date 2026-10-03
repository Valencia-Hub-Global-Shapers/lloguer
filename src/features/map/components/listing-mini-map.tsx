"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE } from "../style";
import { ensureMapWorker } from "../worker";

/** Static-ish mini map showing the (truncated) public location of a listing. */
export function ListingMiniMap({
  lat,
  lng,
  interactive = false,
  className,
}: {
  lat: number;
  lng: number;
  interactive?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    ensureMapWorker();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [lng, lat],
      zoom: 13,
      interactive,
      attributionControl: false,
    });
    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    }

    const el = document.createElement("div");
    el.style.cssText =
      "width:56px;height:56px;border-radius:50%;background:rgba(214,82,29,.25);border:2px solid #d6521d";
    new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);

    return () => map.remove();
  }, [lat, lng, interactive]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-48 w-full rounded-xl border"}
      aria-label="Approximate location map"
    />
  );
}
