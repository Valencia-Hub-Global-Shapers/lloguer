"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Bounds, ListingPin } from "@/features/listings/types";
import { useI18n } from "@/i18n/client";
import { VALENCIA_CENTER } from "@/lib/utils";
import { formatCount } from "../clustering";
import { MAP_STYLE } from "../style";

const MAX_CLUSTER_CLICK_ZOOM = 16;

type Props = {
  pins: ListingPin[];
  activeId: string | null;
  onBoundsChange: (bounds: Bounds, zoom: number) => void;
  onPinClick: (id: string) => void;
  onPinHover?: (id: string | null) => void;
  initialBounds?: [number, number, number, number];
  /** Fly the map to these bounds whenever the value changes. */
  focusBounds?: [number, number, number, number] | null;
};

export function ExplorerMap({
  pins,
  activeId,
  onBoundsChange,
  onPinClick,
  onPinHover,
  initialBounds,
  focusBounds,
}: Props) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const pillByIdRef = useRef(new Map<string, HTMLElement>());
  const callbacksRef = useRef({ onBoundsChange, onPinClick, onPinHover });
  callbacksRef.current = { onBoundsChange, onPinClick, onPinHover };

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: VALENCIA_CENTER,
      zoom: 11.5,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    if (initialBounds) {
      map.fitBounds(
        [
          [initialBounds[0], initialBounds[1]],
          [initialBounds[2], initialBounds[3]],
        ],
        { padding: 40, duration: 0 },
      );
    }

    const emitBounds = () => {
      const b = map.getBounds();
      if (!b) return;
      callbacksRef.current.onBoundsChange(
        {
          minLat: b.getSouth(),
          minLng: b.getWest(),
          maxLat: b.getNorth(),
          maxLng: b.getEast(),
        },
        map.getZoom(),
      );
    };

    map.on("load", emitBounds);
    map.on("moveend", emitBounds);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to a place picked in the filters
  const focusKey = focusBounds?.join(",");
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusBounds) return;
    map.fitBounds(
      [
        [focusBounds[0], focusBounds[1]],
        [focusBounds[2], focusBounds[3]],
      ],
      { padding: 40, maxZoom: 15, duration: 800 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  // Draw the markers the server sent: single listings as price pills, grid
  // cells holding several listings as count badges.
  useEffect(() => {
    const draw = () => {
      const map = mapRef.current;
      if (!map) return;

      for (const m of markersRef.current) m.remove();
      markersRef.current = [];
      pillByIdRef.current.clear();

      for (const pin of pins) {
        const el = document.createElement("button");
        el.type = "button";

        if (pin.count > 1 || pin.id == null) {
          el.className = "map-cluster";
          el.textContent = formatCount(pin.count);
          el.setAttribute("aria-label", t("home.clusterLabel", { count: pin.count }));
          el.addEventListener("click", () => {
            map.easeTo({
              center: [pin.lng, pin.lat],
              zoom: Math.min(map.getZoom() + 2, MAX_CLUSTER_CLICK_ZOOM),
            });
          });
        } else {
          const id = pin.id;
          el.className = "map-price-pill";
          el.textContent = `${pin.price} €`;
          el.setAttribute("aria-label", `${pin.price} €`);
          el.dataset.active = "false";
          el.addEventListener("click", () => callbacksRef.current.onPinClick(id));
          el.addEventListener("mouseenter", () => callbacksRef.current.onPinHover?.(id));
          el.addEventListener("mouseleave", () => callbacksRef.current.onPinHover?.(null));
          pillByIdRef.current.set(id, el);
        }

        markersRef.current.push(
          new maplibregl.Marker({ element: el }).setLngLat([pin.lng, pin.lat]).addTo(map),
        );
      }
    };

    const map = mapRef.current;
    if (map?.isStyleLoaded()) draw();
    else map?.once("load", draw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins]);

  // Highlight active pill
  useEffect(() => {
    for (const [id, el] of pillByIdRef.current) {
      el.dataset.active = id === activeId ? "true" : "false";
    }
  }, [activeId, pins]);

  return <div ref={containerRef} className="absolute inset-0" aria-hidden={false} />;
}
