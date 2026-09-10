"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { BranchSidebar } from "../components/branch-sidebar";
import { branchesService } from "../services/branches.service";
import type { Branch, BranchFormData, BranchStatus } from "../types/branch.types";

import "@/components/ui/templates/workspace-page.css";
import "./branches-screen.css";

// Dynamic import: Leaflet requires browser APIs and cannot run on the server
const BranchesMap = dynamic(
  () => import("../components/branches-map").then((m) => m.BranchesMap),
  {
    ssr: false,
    loading: () => (
      <div className="branches-screen__map-loading">
        <div className="branches-screen__map-spinner" />
        <span>Cargando mapa…</span>
      </div>
    ),
  }
);

type Mode = "idle" | "create" | "edit";

const EMPTY_FORM: BranchFormData = {
  organizationId: "",
  name: "",
  address: "",
  colonia: "",
  region: "",
  latitude: null,
  longitude: null,
  status: "ACTIVE",
  type: "SECUNDARIA",
  isPrincipal: false,
};

function generateBranchId(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.substring(0, 3).toUpperCase())
    .join("-");
  return `BR-${slug}-${Date.now().toString(36).toUpperCase()}`;
}

export function BranchesScreen() {
  const [organizationId, setOrganizationId] = useState("ORG-ZELIFY");
  const [organizationName, setOrganizationName] = useState("Organización");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("idle");
  const [form, setForm] = useState<BranchFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null);

  // ── Data loading ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const payload = await branchesService.getHierarchy();
      setOrganizationName(payload.organization?.name ?? "Organización");
      setOrganizationId(payload.organization?.id ?? "ORG-ZELIFY");
      setBranches(payload.branches);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo cargar sucursales.";
      setErrorMessage(message);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ── Map interaction ─────────────────────────────────────────────────────────
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      // Only capture coordinates when the form is open
      if (mode === "idle") {
        const hasPrincipal = branches.some((b) => b.type === "PRINCIPAL" || b.isPrincipal);
        setForm((prev) => ({
          ...EMPTY_FORM,
          organizationId,
          type: hasPrincipal ? "SECUNDARIA" : "PRINCIPAL",
          isPrincipal: !hasPrincipal,
          latitude: lat,
          longitude: lng,
        }));
        setMode("create");
        setPendingPin({ lat, lng });
      } else {
        // Update coordinates in existing form
        setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        setPendingPin({ lat, lng });
      }
    },
    [branches, mode, organizationId]
  );

  const handleBranchClick = useCallback((branch: Branch) => {
    setSelectedBranch(branch);
    setMode("idle");
    setPendingPin(null);
  }, []);

  // ── Form handlers ───────────────────────────────────────────────────────────
  const handleNew = useCallback(() => {
    const hasPrincipal = branches.some((b) => b.type === "PRINCIPAL" || b.isPrincipal);
    setForm({
      ...EMPTY_FORM,
      organizationId,
      type: hasPrincipal ? "SECUNDARIA" : "PRINCIPAL",
      isPrincipal: !hasPrincipal,
    });
    setSelectedBranch(null);
    setPendingPin(null);
    setMode("create");
  }, [branches, organizationId]);

  const handleSelectBranch = useCallback((branch: Branch) => {
    const isP = branch.type === "PRINCIPAL" || Boolean(branch.isPrincipal);
    setSelectedBranch(branch);
    setForm({
      organizationId: branch.organizationId,
      name: branch.name,
      address: branch.address ?? "",
      colonia: branch.colonia ?? "",
      region: branch.region ?? "",
      latitude: branch.latitude ?? null,
      longitude: branch.longitude ?? null,
      status: branch.status,
      type: isP ? "PRINCIPAL" : "SECUNDARIA",
      isPrincipal: isP,
    });
    setPendingPin(branch.latitude != null && branch.longitude != null
      ? { lat: branch.latitude, lng: branch.longitude }
      : null
    );
    setMode("edit");
  }, []);

  const handleCancel = useCallback(() => {
    setMode("idle");
    setPendingPin(null);
    setSelectedBranch(null);
  }, []);

  const handleFormChange = useCallback((patch: Partial<BranchFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    // Keep pending pin in sync when lat/lng changes
    if (patch.latitude !== undefined || patch.longitude !== undefined) {
      setForm((prev) => {
        const lat = patch.latitude !== undefined ? patch.latitude : prev.latitude;
        const lng = patch.longitude !== undefined ? patch.longitude : prev.longitude;
        if (lat != null && lng != null) setPendingPin({ lat, lng });
        return { ...prev, ...patch };
      });
    }
  }, []);

  // ── CRUD in-memory (no DB required) ────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!form.name.trim()) return;
    setSaving(true);

    const isP = form.type === "PRINCIPAL" || Boolean(form.isPrincipal);

    if (mode === "create") {
      const id = generateBranchId(form.name);
      const newBranch: Branch = {
        id,
        organizationId: form.organizationId || organizationId,
        name: form.name.trim(),
        address: form.address || null,
        colonia: form.colonia || null,
        region: form.region || "",
        latitude: form.latitude,
        longitude: form.longitude,
        status: form.status as BranchStatus,
        type: isP ? "PRINCIPAL" : "SECUNDARIA",
        isPrincipal: isP,
        centres: [],
        portfolio: null,
        users: [],
      };
      setBranches((prev) => [...prev, newBranch]);
    } else if (mode === "edit" && selectedBranch) {
      setBranches((prev) =>
        prev.map((b) =>
          b.id === selectedBranch.id
            ? {
                ...b,
                name: form.name.trim(),
                address: form.address || null,
                colonia: form.colonia || null,
                region: form.region || b.region,
                latitude: form.latitude,
                longitude: form.longitude,
                status: form.status as BranchStatus,
                type: isP ? "PRINCIPAL" : "SECUNDARIA",
                isPrincipal: isP,
              }
            : b
        )
      );
    }

    setMode("idle");
    setPendingPin(null);
    setSelectedBranch(null);
    setSaving(false);
  }, [form, mode, selectedBranch, organizationId]);

  const handleDelete = useCallback(() => {
    if (!selectedBranch) return;
    if (!confirm(`¿Eliminar la sucursal "${selectedBranch.name}"? Esta acción no se puede deshacer.`)) return;
    setBranches((prev) => prev.filter((b) => b.id !== selectedBranch.id));
    setMode("idle");
    setPendingPin(null);
    setSelectedBranch(null);
  }, [selectedBranch]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />

      <div className="zelify-workspace-page__scroll">
        <div className="branches-screen">
          {/* Compact page header */}
          <header className="branches-screen__header">
            <div>
              <h1 className="branches-screen__title">Sucursales</h1>
              <p className="branches-screen__breadcrumb">
                {organizationName} &rsaquo; Sucursales
              </p>
            </div>
            {errorMessage && (
              <div className="branches-screen__error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {errorMessage}
              </div>
            )}
          </header>

          {/* Main layout: map + sidebar */}
          <div className="branches-screen__body">
            {/* Map area */}
            <div className="branches-screen__map-area">
              {loading ? (
                <div className="branches-screen__map-loading">
                  <div className="branches-screen__map-spinner" />
                  <span>Cargando sucursales…</span>
                </div>
              ) : (
                <BranchesMap
                  branches={branches}
                  selectedId={selectedBranch?.id ?? null}
                  onMapClick={handleMapClick}
                  onBranchClick={handleBranchClick}
                  pendingPin={pendingPin}
                />
              )}
            </div>

            {/* Sidebar */}
            <BranchSidebar
              mode={mode as "idle" | "create" | "edit"}
              form={form}
              branches={branches}
              selectedBranch={selectedBranch}
              saving={saving}
              onFormChange={handleFormChange}
              onNew={handleNew}
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={handleDelete}
              onSelectBranch={handleSelectBranch}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
