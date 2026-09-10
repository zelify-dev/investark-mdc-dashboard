"use client";

import { useEffect, useRef, useState } from "react";

export type LocationSelectData = {
  lat: number;
  lng: number;
  address?: string;
  colonia?: string;
};

type Props = {
  latitude: number | null;
  longitude: number | null;
  branchName?: string;
  orgLogoUrl?: string;
  orgName?: string;
  address?: string;
  onLocationSelect: (data: LocationSelectData) => void;
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildPopupHtml(
  branchName?: string,
  orgLogoUrl?: string,
  orgName?: string,
  address?: string
): string {
  const displayBranch = branchName?.trim() || "Nueva sucursal";
  const displayOrg = orgName?.trim() || "Organización";
  const logo = orgLogoUrl || "/mdc-navbar-logo.svg";
  const initial = displayOrg.charAt(0).toUpperCase() || "O";

  return `
    <div class="mdc-suc-popup">
      <div class="mdc-suc-popup__logo-box" style="background: transparent !important; border: none !important; box-shadow: none !important; border-radius: 0 !important; padding: 0 !important;">
        <img 
          src="${escapeHtml(logo)}" 
          alt="${escapeHtml(displayOrg)}" 
          class="mdc-suc-popup__logo-img" 
          style="background: transparent !important; border-radius: 0 !important; max-width: 100%; max-height: 100%; object-fit: contain;"
          onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';"
        />
        <div class="mdc-suc-popup__logo-fallback" style="display: none; background: transparent !important;">
          ${escapeHtml(initial)}
        </div>
      </div>
      <div class="mdc-suc-popup__body">
        <div class="mdc-suc-popup__org-tag">${escapeHtml(displayOrg)}</div>
        <div class="mdc-suc-popup__branch-title">${escapeHtml(displayBranch)}</div>
        ${
          address?.trim()
            ? `<div class="mdc-suc-popup__addr">${escapeHtml(address.trim())}</div>`
            : `<div class="mdc-suc-popup__coords-hint">Ubicación asignada en el mapa</div>`
        }
      </div>
    </div>
  `;
}

export function MdcSucursalMapPicker({
  latitude,
  longitude,
  branchName,
  orgLogoUrl,
  orgName,
  address,
  onLocationSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [addressStatus, setAddressStatus] = useState<string | null>(null);

  // Keep latest props in ref for event handlers
  const propsRef = useRef({ branchName, orgLogoUrl, orgName, address });
  propsRef.current = { branchName, orgLogoUrl, orgName, address };

  // Keep latest onLocationSelect in ref to avoid re-binding click listener
  const onLocationSelectRef = useRef(onLocationSelect);
  onLocationSelectRef.current = onLocationSelect;

  // Function to perform reverse geocoding via OpenStreetMap Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    setLoadingAddress(true);
    setAddressStatus("Obteniendo dirección…");
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: {
            "Accept-Language": "es",
          },
        }
      );
      if (response.ok) {
        const data = (await response.json()) as {
          address?: {
            road?: string;
            pedestrian?: string;
            street?: string;
            house_number?: string;
            suburb?: string;
            neighbourhood?: string;
            quarter?: string;
            residential?: string;
            city_district?: string;
            city?: string;
            town?: string;
            village?: string;
          };
        };

        const addr = data.address || {};
        const streetName = addr.road || addr.pedestrian || addr.street || "";
        const houseNum = addr.house_number ? ` ${addr.house_number}` : "";
        const fullAddress = streetName ? `${streetName}${houseNum}` : "";
        const colonia =
          addr.neighbourhood ||
          addr.suburb ||
          addr.quarter ||
          addr.residential ||
          addr.city_district ||
          "";

        setAddressStatus(fullAddress || colonia ? "Dirección detectada" : "Coordenadas fijadas");
        onLocationSelectRef.current({
          lat,
          lng,
          address: fullAddress,
          colonia,
        });

        // Update marker popup with the detected address
        if (markerRef.current) {
          const updatedHtml = buildPopupHtml(
            propsRef.current.branchName,
            propsRef.current.orgLogoUrl,
            propsRef.current.orgName,
            fullAddress || propsRef.current.address
          );
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          markerRef.current.setPopupContent(updatedHtml);
        }
      } else {
        setAddressStatus("Coordenadas fijadas");
      }
    } catch {
      setAddressStatus("Coordenadas fijadas");
    } finally {
      setLoadingAddress(false);
      setTimeout(() => {
        setAddressStatus(null);
      }, 3000);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    void import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      // Fix Leaflet default icon path
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const initialCenter: [number, number] =
        latitude !== null && longitude !== null
          ? [latitude, longitude]
          : [23.6345, -102.5528]; // Centro de México

      const initialZoom = latitude !== null && longitude !== null ? 14 : 5;

      const map = L.map(containerRef.current!, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: true,
        attributionControl: false,
      });

      // ESRI World Street Map (Clean Voyager-style pastel aesthetics, warm roads, zero watermark, no API key required)
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom',
        }
      ).addTo(map);

      // Create pin helper with pulse animation
      const createPinIcon = () =>
        L.divIcon({
          html: `
            <div class="mdc-suc-map-pin">
              <span class="mdc-suc-map-pin__pulse"></span>
              <svg viewBox="0 0 24 24" fill="currentColor" width="34" height="34">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          `,
          className: "mdc-suc-map-pin-wrap",
          iconSize: [34, 34],
          iconAnchor: [17, 34],
          popupAnchor: [0, -32],
        });

      // Initial marker if coordinates exist
      if (latitude !== null && longitude !== null) {
        const initialPopup = buildPopupHtml(
          propsRef.current.branchName,
          propsRef.current.orgLogoUrl,
          propsRef.current.orgName,
          propsRef.current.address
        );
        markerRef.current = L.marker([latitude, longitude], { icon: createPinIcon() })
          .addTo(map)
          .bindPopup(initialPopup, {
            className: "mdc-suc-leaflet-popup",
            offset: [0, -20],
            closeButton: true,
          });
      }

      // Map Click Handler
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        const { lat, lng } = e.latlng;
        const currentPopup = buildPopupHtml(
          propsRef.current.branchName,
          propsRef.current.orgLogoUrl,
          propsRef.current.orgName,
          propsRef.current.address
        );

        // Place or move marker
        if (markerRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          markerRef.current.setLatLng([lat, lng]);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          markerRef.current.setPopupContent(currentPopup);
        } else {
          markerRef.current = L.marker([lat, lng], { icon: createPinIcon() })
            .addTo(map)
            .bindPopup(currentPopup, {
              className: "mdc-suc-leaflet-popup",
              offset: [0, -20],
              closeButton: true,
            });
        }

        // Open popup immediately on pin placement so user sees organization logo and branch name
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        markerRef.current.openPopup();

        // Set immediate coordinates so form fields update with zero lag
        onLocationSelectRef.current({ lat, lng });

        // Trigger reverse geocoding for address and colonia
        void reverseGeocode(lat, lng);
      });

      mapRef.current = map;

      // Invalidate size in case container rendered with slight animation
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    });

    return () => {
      if (mapRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update popup content when branchName, orgLogoUrl, orgName, or address change
  useEffect(() => {
    if (!markerRef.current) return;
    const updatedHtml = buildPopupHtml(branchName, orgLogoUrl, orgName, address);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    markerRef.current.setPopupContent(updatedHtml);
  }, [branchName, orgLogoUrl, orgName, address]);

  // Update marker position if latitude/longitude changes from outside
  useEffect(() => {
    if (!mapRef.current || latitude === null || longitude === null) return;

    void import("leaflet").then((L) => {
      if (!mapRef.current) return;

      const createPinIcon = () =>
        L.divIcon({
          html: `
            <div class="mdc-suc-map-pin">
              <span class="mdc-suc-map-pin__pulse"></span>
              <svg viewBox="0 0 24 24" fill="currentColor" width="34" height="34">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          `,
          className: "mdc-suc-map-pin-wrap",
          iconSize: [34, 34],
          iconAnchor: [17, 34],
          popupAnchor: [0, -32],
        });

      const currentPopup = buildPopupHtml(
        propsRef.current.branchName,
        propsRef.current.orgLogoUrl,
        propsRef.current.orgName,
        propsRef.current.address
      );

      if (markerRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        markerRef.current.setLatLng([latitude, longitude]);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        markerRef.current.setPopupContent(currentPopup);
      } else {
        markerRef.current = L.marker([latitude, longitude], { icon: createPinIcon() })
          .addTo(mapRef.current)
          .bindPopup(currentPopup, {
            className: "mdc-suc-leaflet-popup",
            offset: [0, -20],
            closeButton: true,
          });
      }

      // Smoothly pan map to new coordinates if outside immediate center
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const center = mapRef.current.getCenter();
        const dist = Math.hypot(center.lat - latitude, center.lng - longitude);
        if (dist > 0.0008) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          mapRef.current.setView([latitude, longitude], Math.max(mapRef.current.getZoom(), 15), {
            animate: true,
          });
        }
      } catch {
        // ignore
      }
    });
  }, [latitude, longitude]);

  return (
    <div className="mdc-suc-map-picker">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div ref={containerRef} className="mdc-suc-map-picker__canvas" />

      {/* Floating status bar */}
      {addressStatus && (
        <div className={`mdc-suc-map-picker__status ${loadingAddress ? "is-loading" : "is-done"}`}>
          {loadingAddress && <span className="mdc-suc-map-picker__spinner" />}
          <span>{addressStatus}</span>
        </div>
      )}
    </div>
  );
}
