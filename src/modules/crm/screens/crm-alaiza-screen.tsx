"use client";

import { useMemo, useState } from "react";

import { AppButton } from "@/components/ui/atoms/button/app-button";
import { CrmPageHeader } from "@/modules/crm/components/crm-page-header";
import { useCrmSession } from "@/modules/crm/lib/crm-session";

import "./crm-ops.css";

function matchFaq(question: string, faqs: { question: string; answer: string; active: boolean; category: string }[]) {
  const q = question.toLowerCase();
  const hit = faqs.find((item) => item.active && item.question.toLowerCase().split(" ").some((word) => word.length > 4 && q.includes(word)));
  if (hit) return hit.answer;
  if (/documento|nómina|nomina|estado|comprobante/.test(q)) {
    return faqs.find((item) => item.active && item.category === "documentos")?.answer ?? "Nómina, estado de cuenta y comprobante de domicilio.";
  }
  if (/humano|operador|asesor/.test(q)) {
    return "Esta conversación requiere intervención humana. El operador debe retomar el chat.";
  }
  return "Puedo explicar documentos, estado del expediente y el flujo WhatsApp → validación → precalificación. Prueba con una FAQ activa.";
}

export function CrmAlaizaScreen() {
  const { faqs, templates, setFaqs, setTemplates, leads } = useCrmSession();
  const [ask, setAsk] = useState("¿Qué documentos necesito?");
  const [answer, setAnswer] = useState<string | null>(null);
  const [faqDraft, setFaqDraft] = useState({ question: "", answer: "", category: "documentos" });
  const [tplDraft, setTplDraft] = useState({ name: "", category: "documentos", body: "" });

  const humanQueue = useMemo(() => leads.filter((lead) => lead.needsHuman && lead.chatStatus !== "cerrada"), [leads]);

  return (
    <div className="crm-ops">
      <CrmPageHeader
        title="Alaiza"
        subtitle="Agente IA del CRM: responde FAQ, usa plantillas y detecta cuándo entrar un operador."
      />

      <div className="crm-ops__grid">
        <section className="crm-ops__card">
          <h2>Probar a Alaiza</h2>
          <p>Consulta el proceso o una pregunta frecuente. Si pide un humano, se marca el lead.</p>
          <label>
            Pregunta del cliente
            <textarea value={ask} onChange={(event) => setAsk(event.target.value)} />
          </label>
          <AppButton tone="primary" onClick={() => setAnswer(matchFaq(ask, faqs))}>
            Responder
          </AppButton>
          {answer ? <p className="crm-ops__note">{answer}</p> : null}
          <h3 style={{ marginTop: 18 }}>Conversaciones que requieren humano</h3>
          {humanQueue.length === 0 ? (
            <p>Ninguna conversación marcada.</p>
          ) : (
            <ul>
              {humanQueue.map((lead) => (
                <li key={lead.id}>
                  {lead.name} · {lead.phone} · {lead.lastMessage}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="crm-ops__card">
          <h2>Preguntas frecuentes</h2>
          <p>Fuente que Alaiza usa para responder.</p>
          <label>
            Pregunta
            <input value={faqDraft.question} onChange={(event) => setFaqDraft({ ...faqDraft, question: event.target.value })} />
          </label>
          <label>
            Respuesta
            <textarea value={faqDraft.answer} onChange={(event) => setFaqDraft({ ...faqDraft, answer: event.target.value })} />
          </label>
          <label>
            Categoría
            <input value={faqDraft.category} onChange={(event) => setFaqDraft({ ...faqDraft, category: event.target.value })} />
          </label>
          <AppButton
            onClick={() => {
              if (!faqDraft.question.trim() || !faqDraft.answer.trim()) return;
              setFaqs([
                { id: `faq-${faqs.length + 1}`, question: faqDraft.question, answer: faqDraft.answer, category: faqDraft.category, active: true },
                ...faqs,
              ]);
              setFaqDraft({ question: "", answer: "", category: "documentos" });
            }}
          >
            Agregar FAQ
          </AppButton>
          <table style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Pregunta</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {faqs.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.question}</strong>
                    <div style={{ color: "#64748b" }}>{item.answer}</div>
                  </td>
                  <td>{item.category}</td>
                  <td>{item.active ? "Activa" : "Inactiva"}</td>
                  <td>
                    <button
                      type="button"
                      className="crm-badge"
                      onClick={() => setFaqs(faqs.map((faq) => (faq.id === item.id ? { ...faq, active: !faq.active } : faq)))}
                    >
                      {item.active ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="crm-ops__card">
        <h2>Plantillas de mensajes</h2>
        <p>Bienvenida, solicitud de documentos, rechazo, expediente completo y cierre.</p>
        <div className="crm-ops__grid">
          <div>
            <label>
              Nombre
              <input value={tplDraft.name} onChange={(event) => setTplDraft({ ...tplDraft, name: event.target.value })} />
            </label>
            <label>
              Categoría
              <input value={tplDraft.category} onChange={(event) => setTplDraft({ ...tplDraft, category: event.target.value })} />
            </label>
            <label>
              Cuerpo
              <textarea value={tplDraft.body} onChange={(event) => setTplDraft({ ...tplDraft, body: event.target.value })} />
            </label>
            <AppButton
              tone="primary"
              onClick={() => {
                if (!tplDraft.name.trim() || !tplDraft.body.trim()) return;
                setTemplates([{ id: `tpl-${templates.length + 1}`, ...tplDraft, active: true }, ...templates]);
                setTplDraft({ name: "", category: "documentos", body: "" });
              }}
            >
              Crear plantilla
            </AppButton>
          </div>
          <table>
            <thead>
              <tr>
                <th>Plantilla</th>
                <th>Categoría</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <div style={{ color: "#64748b" }}>{item.body}</div>
                  </td>
                  <td>{item.category}</td>
                  <td>
                    <button
                      type="button"
                      className={item.active ? "crm-badge crm-badge--ok" : "crm-badge"}
                      onClick={() => setTemplates(templates.map((tpl) => (tpl.id === item.id ? { ...tpl, active: !tpl.active } : tpl)))}
                    >
                      {item.active ? "Activa" : "Inactiva"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
