"use client";

import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import Supercluster from "supercluster";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Bounds, ListingPin } from "@/features/listings/types";
import { VALENCIA_CENTER } from "@/lib/utils";

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
export const hasMapboxToken =
  MAPBOX_TOKEN.length > 0 && !MAPBOX_TOKEN.startsWith("your-");

const MAP_STYLE = "mapbox://styles/mapbox/light-v11";
const CLUSTER_MAX_ZOOM = 13;

type Props = {
  pins: ListingPin[];
  activeId: string | null;
  onBoundsChange: (bounds: Bounds) => void;
  onPinClick: (id: string) => void;
  onPinHover?: (id: string | null) => void;
  initialBounds?: [number, number, number, number];
  /** Fly the map to these bounds whenever the value changes. */
  focusBounds?: [number, number, number, number] | null;
};

type PinProps = { id: string; price: number; type: string };

function pinToFeature(pin: ListingPin): Supercluster.PointFeature<PinProps> {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [pin.lng, pin.lat] },
    properties: { id: pin.id, price: pin.price, type: pin.type },
  };
}

export function ExplorerMap({
  pins,
  activeId,
  onBoundsChange,
  onPinClick,
  onPinHover,
  initialBounds,
  focusBounds,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const pillByIdRef = useRef(new Map<string, HTMLElement>());
  const clusterRenderRef = useRef<(() => void) | null>(null);
  const callbacksRef = useRef({ onBoundsChange, onPinClick, onPinHover });
  callbacksRef.current = { onBoundsChange, onPinClick, onPinHover };

  const clusterIndex = useMemo(() => {
    const index = new Supercluster<PinProps>({
      radius: 60,
      maxZoom: CLUSTER_MAX_ZOOM,
    });
    index.load(pins.map(pinToFeature));
    return index;
  }, [pins]);

  // Init map once
  useEffect(() => {
    if (!hasMapboxToken || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: VALENCIA_CENTER,
      zoom: 11.5,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

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
      callbacksRef.current.onBoundsChange({
        minLat: b.getSouth(),
        minLng: b.getWest(),
        maxLat: b.getNorth(),
        maxLng: b.getEast(),
      });
    };

    map.on("load", emitBounds);
    map.on("moveend", () => {
      emitBounds();
      renderClusters();
    });

    const renderClusters = () => {
      // implemented in effect below via ref
      clusterRenderRef.current?.();
    };
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

  // Render clusters whenever the index changes
  useEffect(() => {
    clusterRenderRef.current = () => {
      const map = mapRef.current;
      if (!map || !map.isStyleLoaded()) return;

      for (const m of markersRef.current) m.remove();
      markersRef.current = [];
      pillByIdRef.current.clear();

      const bounds = map.getBounds();
      const zoom = map.getZoom();
      if (!bounds) return;

      const clusters = clusterIndex.getClusters(
        [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
        Math.floor(zoom),
      );

      for (const feature of clusters) {
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties;

        const el = document.createElement("button");
        el.type = "button";

        if ("cluster" in props && props.cluster) {
          el.className = "map-cluster";
          el.textContent = String(props.point_count_abbreviated ?? props.point_count);
          el.setAttribute("aria-label", `${props.point_count} listings`);
          el.addEventListener("click", () => {
            const expansionZoom = Math.min(
              clusterIndex.getClusterExpansionZoom(props.cluster_id as number),
              16,
            );
            map.easeTo({ center: [lng, lat], zoom: expansionZoom });
          });
        } else {
          el.className = "map-price-pill";
          el.textContent = `${props.price} €`;
          el.setAttribute("aria-label", `${props.price} €`);
          el.dataset.active = "false";
          el.addEventListener("click", () => callbacksRef.current.onPinClick(props.id as string));
          el.addEventListener("mouseenter", () => callbacksRef.current.onPinHover?.(props.id as string));
          el.addEventListener("mouseleave", () => callbacksRef.current.onPinHover?.(null));
          pillByIdRef.current.set(props.id as string, el);
        }

        const marker = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
        markersRef.current.push(marker);
      }
    };

    if (mapRef.current?.isStyleLoaded()) {
      clusterRenderRef.current();
    } else {
      mapRef.current?.once("load", () => clusterRenderRef.current?.());
    }
  }, [clusterIndex]);

  // Highlight active pill
  useEffect(() => {
    for (const [id, el] of pillByIdRef.current) {
      el.dataset.active = id === activeId ? "true" : "false";
    }
  }, [activeId, pins]);

  return <div ref={containerRef} className="absolute inset-0" aria-hidden={false} />;
}
