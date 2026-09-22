"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStoredOrganization } from "@/lib/auth-api";
import { AmlBanner, AmlField, AmlTable, formatWhen } from "@/modules/pld-aml/components/pld-aml-ui";
import { PldAmlApiError } from "@/modules/pld-aml/services/pld-aml-api-client";
import {
  asInternalListEntries,
  createInternalList,
  deleteInternalList,
  fetchInternalList,
  fetchInternalLists,
  normalizeInternalListEntry,
  updateInternalList,
  uploadInternalLists,
} from "@/modules/pld-aml/services/pld-aml.service";
import type { AmlInternalListCreatePayload, AmlInternalListEntry } from "@/modules/pld-aml/types/pld-aml.types";

const PAGE_SIZE = 25;
const EMPTY_FORM: AmlInternalListCreatePayload = {
  folio: "",
  legal_name: "",
  organization_reported: "",
  risk_type: "LISTA_NEGRA",
  rfc: "",
  curp: "",
  alias: "",
  birth_date: "",
  date_reported: "",
  validity_date: "",
  debt_amount: undefined,
  notes: "",
};

function errorMessage(error: unknown) {
  if (error instanceof PldAmlApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "No fue posible completar la operación.";
}

function toPayload(form: AmlInternalListCreatePayload): AmlInternalListCreatePayload {
  const debt = form.debt_amount;
  return {
    folio: form.folio.trim(),
    legal_name: form.legal_name.trim(),
    organization_reported: form.organization_reported.trim(),
    risk_type: form.risk_type.trim(),
    rfc: form.rfc?.trim() || undefined,
    curp: form.curp?.trim() || undefined,
    alias: form.alias?.trim() || undefined,
    birth_date: form.birth_date || undefined,
    date_reported: form.date_reported || undefined,
    validity_date: form.validity_date || undefined,
    debt_amount: debt == null || Number.isNaN(Number(debt)) ? undefined : Number(debt),
    notes: form.notes?.trim() || undefined,
  };
}

function fromEntry(entry: AmlInternalListEntry): AmlInternalListCreatePayload {
  return {
    folio: entry.folio,
    legal_name: entry.legal_name,
    organization_reported: entry.organization_reported,
    risk_type: entry.risk_type,
    rfc: entry.rfc,
    curp: entry.curp,
    alias: entry.alias,
    birth_date: entry.birth_date,
    date_reported: entry.date_reported,
    validity_date: entry.validity_date,
    debt_amount: entry.debt_amount ?? undefined,
    notes: entry.notes,
  };
}

const ACCEPT =
  ".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function PldAmlInternalListsPanel() {
  const queryClient = useQueryClient();
  const org = getStoredOrganization();
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<AmlInternalListCreatePayload>(EMPTY_FORM);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);

  const listQuery = useQuery({
    queryKey: ["pld-aml", "internal-lists", page],
    queryFn: () => fetchInternalLists({ page, limit: PAGE_SIZE }),
    enabled: Boolean(org?.id),
  });
  const detailQuery = useQuery({
    queryKey: ["pld-aml", "internal-list", selectedId],
    queryFn: () => fetchInternalList(selectedId!),
    enabled: Boolean(org?.id && selectedId),
  });

  const entries = useMemo(() => asInternalListEntries(listQuery.data), [listQuery.data]);
  const selected = useMemo(
    () => (detailQuery.data ? normalizeInternalListEntry(detailQuery.data) : entries.find((item) => item.id === selectedId) ?? null),
    [detailQuery.data, entries, selectedId],
  );
  const total = listQuery.data?.total ?? entries.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((item) =>
      `${item.folio} ${item.legal_name} ${item.rfc} ${item.curp} ${item.organization_reported} ${item.risk_type}`.toLowerCase().includes(needle),
    );
  }, [entries, search]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["pld-aml", "internal-lists"] });
    if (selectedId) queryClient.invalidateQueries({ queryKey: ["pld-aml", "internal-list", selectedId] });
  };

  const createMutation = useMutation({
    mutationFn: () => createInternalList(toPayload(form)),
    onSuccess: () => {
      invalidate();
      setForm(EMPTY_FORM);
    },
  });
  const updateMutation = useMutation({
    mutationFn: () => updateInternalList(selectedId!, toPayload(form)),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInternalList(id),
    onSuccess: (_, id) => {
      if (selectedId === id) {
        setSelectedId(null);
        setForm(EMPTY_FORM);
      }
      invalidate();
    },
  });
  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadInternalLists(file),
    onSuccess: invalidate,
  });

  const setField = <K extends keyof AmlInternalListCreatePayload>(key: K, value: AmlInternalListCreatePayload[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openEntry = (entry: AmlInternalListEntry) => {
    setSelectedId(entry.id);
    setForm(fromEntry(entry));
  };

  const startCreate = () => {
    setSelectedId(null);
    setForm(EMPTY_FORM);
  };

  const takeFile = (file?: File | null) => {
    if (!file) return;
    uploadMutation.mutate(file);
  };

  if (!org?.id) {
    return (
      <section className="mdc-section pld-stack">
        <header className="pld-head">
          <h2>Listas internas</h2>
          <p>Registros propios de la organización: personas o empresas, folio y tipo de riesgo.</p>
        </header>
        <AmlBanner tone="error">Se necesita una organización activa para operar listas internas.</AmlBanner>
      </section>
    );
  }

  return (
    <section className="mdc-section pld-stack">
      <header className="pld-head">
        <h2>Listas internas</h2>
        <p>Sube un Excel o CSV, o añade registros fila por fila para la organización.</p>
      </header>

      <label
        className={`pld-dropzone${uploadMutation.isPending ? " pld-dropzone--busy" : ""}${dragging ? " pld-dropzone--hover" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          takeFile(event.dataTransfer.files[0]);
        }}
      >
        <input
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(event) => {
            takeFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <strong>{uploadMutation.isPending ? "Subiendo archivo…" : dragging ? "Suelta el Excel aquí" : "Arrastra o elige un Excel / CSV"}</strong>
        <span>El archivo se carga a las listas internas de {org.name || "la organización"}.</span>
      </label>
      {uploadMutation.isError ? <AmlBanner tone="error">{errorMessage(uploadMutation.error)}</AmlBanner> : null}
      {uploadMutation.isSuccess ? <AmlBanner tone="ok">Archivo cargado.</AmlBanner> : null}

      <section className="pld-card">
        <h3>{selectedId ? "Editar fila" : "Añadir fila"}</h3>
        <p className="pld-muted">Escribe una fila y guárdala, o edita un registro existente desde la tabla.</p>
        <form
          className="pld-table-wrap"
          onSubmit={(event) => {
            event.preventDefault();
            if (selectedId) updateMutation.mutate();
            else createMutation.mutate();
          }}
        >
          <table className="pld-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Nombre / razón social</th>
                <th>Reporta</th>
                <th>Riesgo</th>
                <th>RFC</th>
                <th>CURP</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input className="pld-sheet-input" value={form.folio} onChange={(event) => setField("folio", event.target.value)} required placeholder="INT-2026-001" />
                </td>
                <td>
                  <input className="pld-sheet-input" value={form.legal_name} onChange={(event) => setField("legal_name", event.target.value)} required placeholder="Nombre o razón social" />
                </td>
                <td>
                  <input className="pld-sheet-input" value={form.organization_reported} onChange={(event) => setField("organization_reported", event.target.value)} required placeholder="Quién reporta" />
                </td>
                <td>
                  <select className="pld-sheet-input" value={form.risk_type} onChange={(event) => setField("risk_type", event.target.value)}>
                    {form.risk_type && !["LISTA_NEGRA", "BLOQUEADO", "CNBV", "PEP"].includes(form.risk_type) ? (
                      <option value={form.risk_type}>{form.risk_type}</option>
                    ) : null}
                    <option value="LISTA_NEGRA">LISTA_NEGRA</option>
                    <option value="BLOQUEADO">BLOQUEADO</option>
                    <option value="CNBV">CNBV</option>
                    <option value="PEP">PEP</option>
                  </select>
                </td>
                <td>
                  <input className="pld-sheet-input" value={form.rfc || ""} onChange={(event) => setField("rfc", event.target.value.toUpperCase())} placeholder="RFC" />
                </td>
                <td>
                  <input className="pld-sheet-input" value={form.curp || ""} onChange={(event) => setField("curp", event.target.value.toUpperCase())} placeholder="CURP" />
                </td>
                <td>
                  <span className="pld-row-actions">
                    <button type="submit" className="mdc-btn mdc-btn--primary mdc-btn--sm" disabled={createMutation.isPending || updateMutation.isPending}>
                      {selectedId ? (updateMutation.isPending ? "Guardando…" : "Guardar") : createMutation.isPending ? "Añadiendo…" : "Añadir"}
                    </button>
                    {selectedId ? (
                      <button type="button" className="mdc-btn mdc-btn--ghost mdc-btn--sm" onClick={startCreate}>
                        Nueva
                      </button>
                    ) : null}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
        <div className="pld-form pld-form--wide">
          <AmlField label="Alias">
            <input value={form.alias || ""} onChange={(event) => setField("alias", event.target.value)} />
          </AmlField>
          <div className="pld-form">
            <AmlField label="Fecha de nacimiento">
              <input type="date" value={form.birth_date || ""} onChange={(event) => setField("birth_date", event.target.value)} />
            </AmlField>
            <AmlField label="Fecha de reporte">
              <input type="date" value={form.date_reported || ""} onChange={(event) => setField("date_reported", event.target.value)} />
            </AmlField>
            <AmlField label="Fecha de vigencia">
              <input type="date" value={form.validity_date || ""} onChange={(event) => setField("validity_date", event.target.value)} />
            </AmlField>
            <AmlField label="Adeudo">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.debt_amount ?? ""}
                onChange={(event) => setField("debt_amount", event.target.value === "" ? undefined : Number(event.target.value))}
              />
            </AmlField>
          </div>
          <AmlField label="Notas">
            <input value={form.notes || ""} onChange={(event) => setField("notes", event.target.value)} />
          </AmlField>
        </div>
        {createMutation.isError ? <AmlBanner tone="error">{errorMessage(createMutation.error)}</AmlBanner> : null}
        {updateMutation.isError ? <AmlBanner tone="error">{errorMessage(updateMutation.error)}</AmlBanner> : null}
        {createMutation.isSuccess ? <AmlBanner tone="ok">Fila añadida.</AmlBanner> : null}
        {updateMutation.isSuccess ? <AmlBanner tone="ok">Fila actualizada.</AmlBanner> : null}
        {detailQuery.isError ? <AmlBanner tone="error">{errorMessage(detailQuery.error)}</AmlBanner> : null}
        {selected ? (
          <p className="pld-muted">
            Editando {selected.legal_name} · folio {selected.folio || "—"}
          </p>
        ) : null}
      </section>

      <section className="pld-card">
        <h3>Registros de la organización</h3>
        <AmlField label="Filtrar en esta página">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Folio, nombre, RFC…" />
        </AmlField>
        {listQuery.isError ? <AmlBanner tone="error">{errorMessage(listQuery.error)}</AmlBanner> : null}
        {deleteMutation.isError ? <AmlBanner tone="error">{errorMessage(deleteMutation.error)}</AmlBanner> : null}
        <AmlTable
          columns={["Folio", "Nombre / razón social", "Riesgo", "Reporta", "RFC", "Vigencia", ""]}
          rows={visible.map((item) => [
            item.folio || "—",
            item.legal_name || "—",
            item.risk_type || "—",
            item.organization_reported || "—",
            item.rfc || "—",
            formatWhen(item.validity_date) === "—" ? item.validity_date || "—" : item.validity_date,
            <span key={item.id} className="pld-row-actions">
              <button type="button" className="mdc-btn mdc-btn--ghost mdc-btn--sm" onClick={() => openEntry(item)}>
                Editar
              </button>
              <button
                type="button"
                className="mdc-btn mdc-btn--ghost mdc-btn--sm"
                onClick={() => deleteMutation.mutate(item.id)}
                disabled={deleteMutation.isPending}
              >
                Eliminar
              </button>
            </span>,
          ])}
          empty={listQuery.isLoading ? "Cargando registros…" : "No hay registros internos."}
        />
        <div className="pld-form__actions">
          <button type="button" className="mdc-btn mdc-btn--ghost" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            Anterior
          </button>
          <span className="pld-muted">
            Página {page} de {pageCount} · {total} registros
          </span>
          <button type="button" className="mdc-btn mdc-btn--ghost" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>
            Siguiente
          </button>
        </div>
      </section>
    </section>
  );
}
