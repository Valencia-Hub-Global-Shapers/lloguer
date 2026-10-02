"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE } from "../style";

/** Static-ish mini map showing the (truncated) public location of a listing. */
export function ListingMiniMap({ lat, lng }: { lat: number; lng: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [lng, lat],
      zoom: 13,
      interactive: false,
      attributionControl: false,
    });

    const el = document.createElement("div");
    el.style.cssText =
      "width:56px;height:56px;border-radius:50%;background:rgba(214,82,29,.25);border:2px solid #d6521d";
    new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);

    return () => map.remove();
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className="h-48 w-full rounded-xl border"
      aria-label="Approximate location map"
    />
  );
}
