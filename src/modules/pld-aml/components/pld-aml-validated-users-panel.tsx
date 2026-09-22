"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getStoredOrganization } from "@/lib/auth-api";
import { listDashboardMembers } from "@/lib/auth-dashboard";
import { fetchFinanceRequests } from "@/modules/mdc/services/mdc-finance-requests.service";
import { AmlBanner, AmlField, AmlTable } from "@/modules/pld-aml/components/pld-aml-ui";
import { PldAmlApiError } from "@/modules/pld-aml/services/pld-aml-api-client";
import { fetchScreeningStatus } from "@/modules/pld-aml/services/pld-aml.service";
import type { AmlScreeningStatus } from "@/modules/pld-aml/types/pld-aml.types";

type KycUserRow = {
  userId: string;
  name: string;
  email: string;
  source: string;
};

const STATUS_COPY: Record<string, { label: string; tone: "clean" | "match" | "pending" | "error" }> = {
  CLEAN: { label: "Limpio", tone: "clean" },
  MATCH: { label: "Coincidencia", tone: "match" },
  NOT_SCREENED: { label: "Sin screening", tone: "pending" },
  PROVIDER_ERROR: { label: "Error del proveedor", tone: "error" },
  PLD_USER_HEADER_REQUIRED: { label: "Falta x-user-id", tone: "error" },
};

function errorMessage(error: unknown) {
  if (error instanceof PldAmlApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "No fue posible completar la operación.";
}

function passedLabel(passed: boolean | null | undefined) {
  if (passed === true) return "Sí";
  if (passed === false) return "No";
  return "—";
}

function statusMeta(status?: string) {
  const key = String(status || "").toUpperCase();
  return STATUS_COPY[key] || { label: status || "—", tone: "pending" as const };
}

async function loadOrganizationKycUsers(): Promise<KycUserRow[]> {
  const org = getStoredOrganization();
  if (!org?.id) return [];
  const rows = new Map<string, KycUserRow>();

  const [apps, members] = await Promise.allSettled([
    fetchFinanceRequests(org.id),
    listDashboardMembers({ orgId: org.id, page: 1, limit: 20 }),
  ]);

  if (apps.status === "fulfilled") {
    apps.value.forEach((item) => {
      const userId = item.zelifyUserId || item.user?.id || "";
      if (!userId) return;
      const name = [item.firstName, item.lastName].filter(Boolean).join(" ").trim() || item.email || userId;
      rows.set(userId, {
        userId,
        name,
        email: item.email || "",
        source: "KYC / solicitud",
      });
    });
  }

  if (members.status === "fulfilled") {
    members.value.members.forEach((member) => {
      if (!member.id || rows.has(member.id)) return;
      rows.set(member.id, {
        userId: member.id,
        name: member.full_name || member.email,
        email: member.email,
        source: member.identity_verified ? "Usuario verificado" : "Usuario de la org",
      });
    });
  }

  return Array.from(rows.values());
}

export function PldAmlValidatedUsersPanel() {
  const org = getStoredOrganization();
  const [manualId, setManualId] = useState("");
  const [statuses, setStatuses] = useState<Record<string, AmlScreeningStatus>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["pld-aml", "kyc-users", org?.id],
    queryFn: loadOrganizationKycUsers,
    enabled: Boolean(org?.id),
  });

  const users = usersQuery.data ?? [];
  const visibleIds = useMemo(() => users.map((item) => item.userId), [users]);

  const consultMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await fetchScreeningStatus(userId);
      setStatuses((current) => ({ ...current, [userId]: result }));
      setActiveId(userId);
      return result;
    },
  });

  const consultAllMutation = useMutation({
    mutationFn: async () => {
      const next: Record<string, AmlScreeningStatus> = { ...statuses };
      for (const userId of visibleIds) {
        try {
          next[userId] = await fetchScreeningStatus(userId);
        } catch (error) {
          next[userId] = {
            user_id: userId,
            status: error instanceof PldAmlApiError && error.status === 400 ? "PLD_USER_HEADER_REQUIRED" : "PROVIDER_ERROR",
            passed: null,
            message: errorMessage(error),
          };
        }
      }
      setStatuses(next);
      return next;
    },
  });

  if (!org?.id) {
    return (
      <section className="mdc-section pld-stack">
        <header className="pld-head">
          <h2>Usuarios validados</h2>
          <p>Consulta si un usuario KYC de la organización pasó o no el screening PLD.</p>
        </header>
        <AmlBanner tone="error">Se necesita una organización activa para consultar estados PLD.</AmlBanner>
      </section>
    );
  }

  const activeStatus = activeId ? statuses[activeId] : null;

  return (
    <section className="mdc-section pld-stack">
      <header className="pld-head">
        <h2>Usuarios validados</h2>
        <p>
          Estado de screening PLD por usuario KYC de {org.name || "la organización"}: limpio, coincidencia, sin screening o error del proveedor.
        </p>
      </header>

      <form
        className="pld-card pld-form"
        onSubmit={(event) => {
          event.preventDefault();
          const userId = manualId.trim();
          if (userId) consultMutation.mutate(userId);
        }}
      >
        <AmlField label="UUID del usuario KYC">
          <input
            value={manualId}
            onChange={(event) => setManualId(event.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            required
          />
        </AmlField>
        <div className="pld-form__actions">
          <button type="submit" className="mdc-btn mdc-btn--primary" disabled={consultMutation.isPending || !manualId.trim()}>
            {consultMutation.isPending ? "Consultando…" : "Consultar estado"}
          </button>
          <button
            type="button"
            className="mdc-btn mdc-btn--ghost"
            onClick={() => consultAllMutation.mutate()}
            disabled={consultAllMutation.isPending || !users.length}
          >
            {consultAllMutation.isPending ? "Consultando lista…" : "Consultar usuarios de la org"}
          </button>
        </div>
        {consultMutation.isError ? <AmlBanner tone="error">{errorMessage(consultMutation.error)}</AmlBanner> : null}
        {consultAllMutation.isError ? <AmlBanner tone="error">{errorMessage(consultAllMutation.error)}</AmlBanner> : null}
      </form>

      {activeStatus ? (
        <section className="pld-card">
          <h3>Resultado</h3>
          <div className="pld-kpis">
            <article className="pld-stat">
              <span>Estado</span>
              <strong>{statusMeta(activeStatus.status).label}</strong>
            </article>
            <article className="pld-stat">
              <span>Pasó</span>
              <strong>{passedLabel(activeStatus.passed)}</strong>
            </article>
            <article className="pld-stat">
              <span>Usuario</span>
              <strong className="pld-stat__id">{activeStatus.user_id}</strong>
            </article>
          </div>
          {activeStatus.message ? <p className="pld-muted">{activeStatus.message}</p> : null}
        </section>
      ) : null}

      <section className="pld-card">
        <h3>Usuarios de la organización</h3>
        {usersQuery.isError ? <AmlBanner tone="error">{errorMessage(usersQuery.error)}</AmlBanner> : null}
        <AmlTable
          columns={["Nombre", "Correo", "Origen", "Estado", "Pasó", ""]}
          rows={users.map((item) => {
            const status = statuses[item.userId];
            const meta = statusMeta(status?.status);
            return [
              item.name,
              item.email || "—",
              item.source,
              status ? <span className={`pld-status pld-status--${meta.tone}`}>{meta.label}</span> : "—",
              status ? passedLabel(status.passed) : "—",
              <button
                key={item.userId}
                type="button"
                className="mdc-btn mdc-btn--ghost mdc-btn--sm"
                onClick={() => consultMutation.mutate(item.userId)}
                disabled={consultMutation.isPending}
              >
                Consultar
              </button>,
            ];
          })}
          empty={usersQuery.isLoading ? "Cargando usuarios…" : "No hay usuarios KYC ni miembros de la organización para consultar."}
        />
      </section>
    </section>
  );
}
