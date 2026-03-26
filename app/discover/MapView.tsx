"use client";

import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Stakeholder } from "../api/discover/route";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

const TYPE_COLORS: Record<Stakeholder["type"], string> = {
  government: "#1d4ed8",
  private: "#0f766e",
  ngo: "#7e22ce",
  media: "#b45309",
  academic: "#0369a1",
  international: "#0d9488",
};

const STANCE_COLORS: Record<Stakeholder["stance"], string> = {
  supportive: "#4ade80",
  neutral: "#facc15",
  opposed: "#f87171",
};

function buildPopupHTML(s: Stakeholder): string {
  const stanceColor = STANCE_COLORS[s.stance];
  const stanceLabel = s.stance.charAt(0).toUpperCase() + s.stance.slice(1);
  const bars = Array.from({ length: 10 })
    .map((_, i) => {
      const color = i < s.influence_score
        ? i < 4 ? "#cc2936" : i < 7 ? "#f59e0b" : "#ef4444"
        : "rgba(255,255,255,0.12)";
      return `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${color};margin-right:1px;"></span>`;
    })
    .join("");

  return `
    <div style="background:#0d1530;color:#fff;padding:12px 14px;border-radius:4px;min-width:240px;max-width:300px;font-family:system-ui,sans-serif;">
      <div style="font-weight:700;font-size:13px;margin-bottom:2px;">${escapeHtml(s.name)}</div>
      <div style="font-size:11px;color:#8892a4;margin-bottom:6px;">${escapeHtml(s.organization)}</div>
      <div style="font-size:10px;color:#6b7a8d;margin-bottom:6px;">${escapeHtml(s.category)}</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;background:${stanceColor}22;color:${stanceColor};border:1px solid ${stanceColor}55;">${stanceLabel}</span>
        <span style="display:flex;align-items:center;gap:2px;">${bars}<span style="font-size:10px;color:#8892a4;margin-left:4px;font-weight:700;">${s.influence_score}/10</span></span>
      </div>
      <div style="font-size:11px;color:#b0bac8;line-height:1.4;">${escapeHtml(s.engagement_recommendation)}</div>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface MapViewProps {
  stakeholders: Stakeholder[];
}

export default function MapView({ stakeholders }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const activePopupRef = useRef<mapboxgl.Popup | null>(null);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [35.5, 33.89], // Default: Beirut
      zoom: 3,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when stakeholders change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers and active popup
    if (activePopupRef.current) {
      activePopupRef.current.remove();
      activePopupRef.current = null;
    }
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    const validStakeholders = stakeholders.filter(
      (s) => s.coordinates && s.coordinates[0] !== 0 && s.coordinates[1] !== 0
    );

    for (const s of validStakeholders) {
      const color = TYPE_COLORS[s.type] || "#cc2936";
      const lngLat: [number, number] = [s.coordinates[0], s.coordinates[1]];

      const marker = new mapboxgl.Marker({ color, scale: 0.85 })
        .setLngLat(lngLat)
        .addTo(map);

      marker.getElement().addEventListener("click", (e) => {
        e.stopPropagation();

        // Close any existing popup
        if (activePopupRef.current) {
          activePopupRef.current.remove();
          activePopupRef.current = null;
        }

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: true,
          maxWidth: "320px",
          className: "stakeholder-popup",
        })
          .setLngLat(lngLat)
          .setHTML(buildPopupHTML(s))
          .addTo(map);

        popup.on("close", () => {
          if (activePopupRef.current === popup) {
            activePopupRef.current = null;
          }
        });

        activePopupRef.current = popup;
      });

      markersRef.current.push(marker);
    }

    // Fit bounds to show all markers
    if (validStakeholders.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      for (const s of validStakeholders) {
        bounds.extend([s.coordinates[0], s.coordinates[1]]);
      }
      map.fitBounds(bounds, { padding: 60, maxZoom: 10, duration: 800 });
    }
  }, [stakeholders]);

  return (
    <>
      <style>{`
        .stakeholder-popup .mapboxgl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
          border-radius: 4px !important;
        }
        .stakeholder-popup .mapboxgl-popup-tip {
          border-top-color: #0d1530 !important;
          border-bottom-color: #0d1530 !important;
        }
        .stakeholder-popup .mapboxgl-popup-close-button {
          color: #8892a4 !important;
          font-size: 16px !important;
          padding: 4px 8px !important;
        }
        .stakeholder-popup .mapboxgl-popup-close-button:hover {
          color: #fff !important;
          background: transparent !important;
        }
      `}</style>
      <div
        ref={containerRef}
        className="w-full rounded"
        style={{
          height: "600px",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      />
    </>
  );
}
