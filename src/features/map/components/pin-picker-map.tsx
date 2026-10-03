"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { VALENCIA_CENTER } from "@/lib/utils";
import { MAP_STYLE } from "../style";

/** Mini map with a draggable pin used in the publish/edit form. */
export function PinPickerMap({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: lng != null && lat != null ? [lng, lat] : VALENCIA_CENTER,
      zoom: lat != null ? 14 : 11,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    const el = document.createElement("div");
    el.style.cssText =
      "width:22px;height:22px;border-radius:50%;background:#d6521d;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);cursor:grab";

    const marker = new maplibregl.Marker({ element: el, draggable: true })
      .setLngLat(lng != null && lat != null ? [lng, lat] : VALENCIA_CENTER)
      .addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLngLat();
      onChangeRef.current(pos.lat, pos.lng);
    });
    map.on("click", (e) => {
      marker.setLngLat(e.lngLat);
      onChangeRef.current(e.lngLat.lat, e.lngLat.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow external changes (e.g. initial values loaded async)
  useEffect(() => {
    if (lat == null || lng == null || !markerRef.current) return;
    markerRef.current.setLngLat([lng, lat]);
  }, [lat, lng]);

  return <div ref={containerRef} className="h-64 w-full rounded-xl border" />;
}
