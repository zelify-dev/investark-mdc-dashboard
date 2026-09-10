"use client";

import { ChevronRight, NotebookPen, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import type { MdcApplicantMode } from "@/modules/mdc/data/mdc-credit-mock";
import { getStoredOrganization } from "@/lib/auth-api";
import { fetchCollections, createCollectionCase, deleteCollectionCase, addCollectionNote, type CollectionCase, type CollectionNote } from "@/modules/mdc/services/mdc-collections.service";
import { NATURAL_COLLECTION_CASES, MORAL_COLLECTION_CASES } from "@/modules/mdc/data/mdc-collections-mock";
import { fetchPaymentByApplicant, type PaymentSession } from "@/modules/mdc/services/mdc-payments.service";

export type { CollectionCase, CollectionNote };

const PAGE_SIZE = 10;

export function MdcCollectionsTab({
  mode = "natural",
}: {
  mode?: MdcApplicantMode;
}) {
  const [cases, setCases] = useState<CollectionCase[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCase, setSelectedCase] = useState<CollectionCase | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [collectionSchedule, setCollectionSchedule] = useState<PaymentSession | null>(null);

  useEffect(() => {
    async function load() {
      const currentOrg = getStoredOrganization();
      const orgId = currentOrg?.id || "ORG-001";
      const data = await fetchCollections(mode, orgId);
      if (data.length > 0 || orgId !== "demo-bypass-org") {
        setCases(data);
        return;
      }
      setCases(mode === "natural" ? NATURAL_COLLECTION_CASES : MORAL_COLLECTION_CASES);
    }
    void load();

    const onUploaded = () => {
      void load();
    };
    window.addEventListener("mdc:payments-uploaded", onUploaded);
    return () => window.removeEventListener("mdc:payments-uploaded", onUploaded);
  }, [mode]);

  useEffect(() => {
    if (!selectedCase?.applicationNo || !isDetailModalOpen) {
      setCollectionSchedule(null);
      return;
    }
    let cancelled = false;
    void fetchPaymentByApplicant(selectedCase.applicationNo).then((session) => {
      if (!cancelled) setCollectionSchedule(session);
    });
    return () => {
      cancelled = true;
    };
  }, [isDetailModalOpen, selectedCase?.applicationNo]);

  const handleCreateTest = async () => {
    const isMoral = mode === "moral";
    const orgId = getStoredOrganization()?.id || "demo-bypass-org";
    const newCase = await createCollectionCase({
      applicationNo: `APP-${Date.now().toString().slice(-4)}`,
      customerName: isMoral ? "Empresa Deudora SA" : "Carlos Deudor",
      email: "test@deuda.com",
      phone: "555-1234",
      identification: "ID-12345",
      birthDate: "1990-01-01",
      address: "Calle Falsa 123",
      city: "CDMX",
      state: "CDMX",
      zipCode: "10000",
      amountDue: Math.floor(Math.random() * 10000) + 1000,
      dpd: Math.floor(Math.random() * 90) + 1,
      status: "active",
      assignedAgent: "AGT-001",
      lastActivity: new Date().toISOString().split('T')[0],
      individualPerson: !isMoral,
      legalEntity: isMoral,
    } as any, orgId);
    if (newCase) {
      setCases(prev => [...prev, newCase]);
    }
  };

  const handleDeleteAll = async () => {
    for (const c of cases) {
      if (c.id) await deleteCollectionCase(c.id);
    }
    setCases([]);
  };

  const handleSaveNote = async () => {
    if (!selectedCase?.id || !noteDraft.trim()) return;
    const text = noteDraft.trim();
    const note = await addCollectionNote(selectedCase.id, text);
    if (note) {
      setCases(prev => prev.map(c => {
        if (c.id === selectedCase.id) {
          return { ...c, notes: [...(c.notes || []), note] };
        }
        return c;
      }));
      setSelectedCase({ ...selectedCase, notes: [...(selectedCase.notes || []), note] });
    }
    setNoteDraft("");
    setIsNoteModalOpen(false);
    setIsDetailModalOpen(true);
  };

  const filteredCases = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter((item) =>
      [item.id, item.applicationNo, item.customerName, item.assignedAgent, item.status]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [cases, query]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / PAGE_SIZE));
  const pagedCases = filteredCases.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalMontoVencido = filteredCases.reduce((acc, item) => acc + item.amountDue, 0);
  const casosEscalados = filteredCases.filter((item) => item.status === "escalated" || item.status === "escalado").length;
  const dpdPromedio = filteredCases.length
    ? Math.round(filteredCases.reduce((acc, item) => acc + item.dpd, 0) / filteredCases.length)
    : 0;

  return (
    <section className="mdc-section mdc-col-section">
      <div className="mdc-overview-hero mdc-prod-hero">
        <div className="mdc-prod-hero__row">
          <div>
            <h2 className="mdc-overview-hero__title">Cobranza</h2>
          </div>
        </div>
      </div>

      <article className="mdc-card mdc-col-summary">
        <div className="mdc-card__head">
          <h3>Resumen de cobranza</h3>
          <p>
            {mode === "moral"
              ? "Indicadores clave para priorizar recuperación corporativa y seguimiento empresarial."
              : "Indicadores clave para priorizar la gestión diaria."}
          </p>
        </div>
        <div className="mdc-col-kpis">
          <KpiCard title="Casos activos" value={String(filteredCases.length)} />
          <KpiCard title="Monto vencido total" value={`$${formatMoney(totalMontoVencido)} MXN`} />
          <KpiCard title="DPD promedio" value={`${dpdPromedio} días`} />
          <KpiCard title="Casos escalados" value={String(casosEscalados)} />
        </div>
      </article>

      <article className="mdc-card mdc-col-panel">
        <div className="mdc-card__head">
          <h3>Casos de cobranza</h3>
          <p>{mode === "moral" ? "Casos activos de seguimiento a empresas y razones sociales." : "Casos de cobranza activos."}</p>
        </div>

        <div className="mdc-col-search-wrap">
          <label>
            <span>Buscar</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Caso, solicitud, cliente o estado."
              className="mdc-col-search"
            />
          </label>
        </div>

        <div className="mdc-table-wrap">
          <table className="mdc-table mdc-col-table">
            <thead>
              <tr>
                <th>ID Caso</th>
                <th>No. Aplicación</th>
                <th>Cliente</th>
                <th>Monto vencido</th>
                <th>DPD</th>
                <th>Estado</th>
                <th>Agente asignado</th>
                <th>Última actividad</th>
                <th>Creado el</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagedCases.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                    No hay casos de cobranza activos.
                  </td>
                </tr>
              ) : pagedCases.map((item) => (
                <tr
                  key={item.id}
                  className="mdc-col-row"
                  onClick={() => {
                    setSelectedCase(item);
                    setIsDetailModalOpen(true);
                  }}
                >
                  <td>{item.id}</td>
                  <td>{item.applicationNo}</td>
                  <td>{item.customerName}</td>
                  <td>${formatMoney(item.amountDue)}</td>
                  <td><DpdBadge dpd={item.dpd} /></td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>{item.assignedAgent}</td>
                  <td>{item.lastActivity}</td>
                  <td>{item.createdAt || "-"}</td>
                  <td>
                    <button
                      type="button"
                      className="mdc-col-note-btn"
                      aria-label={`Agregar nota a ${item.id}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setIsDetailModalOpen(false);
                        setSelectedCase(item);
                        setIsNoteModalOpen(true);
                        setNoteDraft("");
                      }}
                    >
                      <NotebookPen className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mdc-col-pager">
          <span>Mostrando {pagedCases.length} de {filteredCases.length} resultados</span>
          <div>
            <span>Tamano pagina: {PAGE_SIZE}</span>
            <button type="button" className="mdc-btn mdc-btn--ghost" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</button>
            <span>Pagina {page} de {totalPages}</span>
            <button type="button" className="mdc-btn mdc-btn--ghost" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Siguiente</button>
          </div>
        </div>
      </article>

      {selectedCase && isDetailModalOpen ? (
        <div className="mdc-modal-backdrop">
          <div className="mdc-modal mdc-col-modal">
            <div className="mdc-modal-head">
              <div>
                <p>Detalle del caso</p>
                <h3>{selectedCase.id} · {selectedCase.customerName}</h3>
              </div>
              <button
                type="button"
                className="mdc-btn mdc-btn--ghost"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedCase(null);
                }}
              >
                Cerrar
              </button>
            </div>

            <div className="mdc-col-grid">
              <DetailItem label="No. aplicacion" value={selectedCase.applicationNo} />
              <DetailItem label="Cliente" value={selectedCase.customerName} />
              <DetailItem label="Monto vencido" value={`$${formatMoney(selectedCase.amountDue)} MXN`} />
              <DetailItem label="DPD" value={`${selectedCase.dpd} dias`} />
              <DetailItem label="Estado" value={selectedCase.status === "active" ? "activo" : "escalado"} />
              <DetailItem label="Agente asignado" value={selectedCase.assignedAgent} />
              <DetailItem label="Ultima actividad" value={selectedCase.lastActivity} />
              <DetailItem label="Creado el" value={selectedCase.createdAt || "-"} />
            </div>

            <div className="mdc-col-box">
              <p>{mode === "moral" ? "Informacion corporativa" : "Informacion personal"}</p>
              <div className="mdc-col-grid">
                <DetailItem label="Nombre completo" value={selectedCase.customerName} />
                <DetailItem label="Correo" value={selectedCase.email} />
                <DetailItem label="Telefono" value={selectedCase.phone} />
                <DetailItem label="Identificacion" value={selectedCase.identification} />
                <DetailItem label="Nacimiento" value={selectedCase.birthDate} />
                <DetailItem label="Direccion" value={selectedCase.address} />
                <DetailItem label="Ciudad" value={selectedCase.city} />
                <DetailItem label="Estado" value={selectedCase.state} />
                <DetailItem label="Codigo postal" value={selectedCase.zipCode} />
              </div>
            </div>

            <div className="mdc-col-box">
              <p>Calendario de pagos</p>
              {collectionSchedule?.installments?.length ? (
                <div className="mdc-pay-installments">
                  {collectionSchedule.installments.map((item) => (
                    <div key={item.installmentNumber} className="mdc-pay-installment-card">
                      <div className="mdc-pay-installment-card__head">
                        <p>Cuota {item.installmentNumber}</p>
                        <span>{item.status}</span>
                      </div>
                      <strong>${formatMoney(Number(item.amount))}</strong>
                      <span>Capital ${formatMoney(Number(item.principal || 0))} · Interés ${formatMoney(Number(item.interest || 0))}</span>
                      <span>Vence {item.dueDate}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Sin calendario asociado a esta solicitud.</p>
              )}
            </div>

            <div className="mdc-col-box">
              <div className="mdc-col-box__head">
                <p>Notas guardadas</p>
                <button
                  type="button"
                  className="mdc-btn mdc-btn--ghost"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setIsNoteModalOpen(true);
                    setNoteDraft("");
                  }}
                >
                  Agregar nota
                </button>
              </div>
              {selectedCase.notes?.length ? (
                <ul>
                  {selectedCase.notes.map((note, idx) => (
                    <li key={`${selectedCase.id}-detail-note-${idx}`}>• {note.text}</li>
                  ))}
                </ul>
              ) : (
                <p>Sin notas registradas.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {selectedCase && isNoteModalOpen ? (
        <div className="mdc-modal-backdrop">
          <div className="mdc-modal mdc-col-note-modal">
            <div className="mdc-modal-head">
              <div>
                <p>Agregar nota</p>
                <h3>{selectedCase.id} · {selectedCase.customerName}</h3>
              </div>
              <button type="button" className="mdc-btn mdc-btn--ghost" onClick={() => { setIsNoteModalOpen(false); setIsDetailModalOpen(true); }}>
                Cerrar
              </button>
            </div>

            <div className="mdc-col-note-form">
              <textarea
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Escribe una nota de seguimiento..."
              />
              <div>
                <button
                  type="button"
                  className="mdc-btn mdc-btn--primary"
                  disabled={!noteDraft.trim()}
                  onClick={handleSaveNote}
                >
                  Guardar nota
                </button>
              </div>
            </div>

            {selectedCase.notes?.length ? (
              <div className="mdc-col-box">
                <p>Notas guardadas</p>
                <ul>
                  {selectedCase.notes.map((note, idx) => (
                    <li key={`${selectedCase.id}-note-${idx}`}>• {note.text}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="mdc-col-detail-item">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function DpdBadge({ dpd }: { dpd: number }) {
  let styles = "mdc-col-pill mdc-col-pill--ok";
  if (dpd >= 14) styles = "mdc-col-pill mdc-col-pill--warn";
  if (dpd >= 31) styles = "mdc-col-pill mdc-col-pill--bad";
  return <span className={styles}>{dpd} días</span>;
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status === "escalated" || status === "escalado" ? "escalated" : "active";
  const styles = {
    active: "mdc-col-pill mdc-col-pill--info",
    escalated: "mdc-col-pill mdc-col-pill--bad",
  };
  const labels = {
    active: "activo",
    escalated: "escalado",
  };
  return <span className={styles[normalized]}>{labels[normalized]}</span>;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="mdc-col-kpi-card">
      <strong>{value}</strong>
      <p>{title}</p>
    </div>
  );
}
