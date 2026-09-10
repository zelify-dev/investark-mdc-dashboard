"use client";

import { useEffect, useRef } from "react";
import type { Branch } from "../types/branch.types";

import "./branches-map.css";

type Props = {
  branches: Branch[];
  selectedId: string | null;
  onMapClick: (lat: number, lng: number) => void;
  onBranchClick: (branch: Branch) => void;
  pendingPin: { lat: number; lng: number } | null;
};

export function BranchesMap({ branches, selectedId, onMapClick, onBranchClick, pendingPin }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingMarkerRef = useRef<any>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamic import to avoid SSR issues
    void import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      // Fix Leaflet default icon path in Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        center: [23.6345, -102.5528], // Mexico center
        zoom: 5,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
        pendingMarkerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update branch markers when branches list changes
  useEffect(() => {
    if (!mapRef.current) return;

    void import("leaflet").then((L) => {
      if (!mapRef.current) return;

      // Clear existing branch markers
      markersRef.current.forEach((m) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        m.remove();
      });
      markersRef.current = [];

      branches
        .filter((b) => b.latitude != null && b.longitude != null)
        .forEach((branch) => {
          const isSelected = branch.id === selectedId;

          // Custom icon: purple for selected, navy for default
          const iconHtml = `
            <div class="branches-map__pin ${isSelected ? "branches-map__pin--selected" : ""}">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          `;

          const icon = L.divIcon({
            html: iconHtml,
            className: "",
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36],
          });

          const marker = L.marker([branch.latitude!, branch.longitude!], { icon })
            .addTo(mapRef.current)
            .bindPopup(
              `<div class="branches-map__popup">
                <strong>${branch.name}</strong>
                ${branch.address ? `<span>${branch.address}</span>` : ""}
                ${branch.colonia ? `<span>${branch.colonia}</span>` : ""}
                <span class="branches-map__popup-status ${branch.status === "ACTIVE" ? "is-active" : "is-inactive"}">
                  ${branch.status === "ACTIVE" ? "Activo" : "Inactivo"}
                </span>
              </div>`
            );

          marker.on("click", () => {
            onBranchClick(branch);
          });

          markersRef.current.push(marker);
        });

      // Fit map to markers if there are any with coordinates
      const withCoords = branches.filter((b) => b.latitude != null && b.longitude != null);
      if (withCoords.length > 0 && markersRef.current.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const group = L.featureGroup(markersRef.current);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        mapRef.current.fitBounds(group.getBounds(), { padding: [60, 60], maxZoom: 13 });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches, selectedId]);

  // Handle pending pin (from map click when form is open)
  useEffect(() => {
    if (!mapRef.current) return;

    void import("leaflet").then((L) => {
      if (!mapRef.current) return;

      if (pendingMarkerRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        pendingMarkerRef.current.remove();
        pendingMarkerRef.current = null;
      }

      if (pendingPin) {
        const iconHtml = `<div class="branches-map__pin branches-map__pin--pending"></div>`;
        const icon = L.divIcon({
          html: iconHtml,
          className: "",
          iconSize: [24, 24],
          iconAnchor: [12, 24],
        });
        pendingMarkerRef.current = L.marker([pendingPin.lat, pendingPin.lng], { icon })
          .addTo(mapRef.current)
          .bindPopup("Ubicación seleccionada")
          .openPopup();
      }
    });
  }, [pendingPin]);

  // Pan to selected branch
  useEffect(() => {
    if (!mapRef.current || !selectedId) return;
    const branch = branches.find((b) => b.id === selectedId);
    if (branch?.latitude != null && branch?.longitude != null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      mapRef.current.setView([branch.latitude, branch.longitude], 14, { animate: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <div className="branches-map__wrapper">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div ref={containerRef} className="branches-map__container" id="branches-leaflet-map" />
      <div className="branches-map__click-hint">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        Haz clic en el mapa para seleccionar una ubicación
      </div>
    </div>
  );
}
