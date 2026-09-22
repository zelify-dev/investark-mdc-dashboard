"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AML_BLACKLIST_SOURCES } from "@/modules/kyb/lib/aml-screening";

import "./aml-analisis-view.css";

function Icon({ children }: { children: ReactNode }) {
  return (
    <span className="aml-analisis-ico" aria-hidden>
      {children}
    </span>
  );
}

function IcoId() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="10" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.5 16.2c.5-1.4 1.6-2.2 2.5-2.2s2 .8 2.5 2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 10.5h3M15 13.5h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IcoCredit() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="6" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 10h17" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 14.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IcoShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M12 3.8 19 6.4v6.2c0 4.4-3 6.8-7 8.2-4-1.4-7-3.8-7-8.2V6.4L12 3.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m9.2 12.2 1.9 1.9 3.8-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoForm() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="5" y="3.5" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IcoScan() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M8 4.5H6A1.5 1.5 0 0 0 4.5 6v2M16 4.5h2A1.5 1.5 0 0 1 19.5 6v2M8 19.5H6A1.5 1.5 0 0 1 4.5 18v-2M16 19.5h2a1.5 1.5 0 0 0 1.5-1.5v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IcoDocs() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M8 4.5h6l4 4V19A1.5 1.5 0 0 1 16.5 20.5h-7A1.5 1.5 0 0 1 8 19V6A1.5 1.5 0 0 1 9.5 4.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14 4.5V9h4.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IcoRules() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M5 7h14M5 12h10M5 17h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="18" cy="17" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IcoPay() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v8M9.5 10.2c.6-1 1.5-1.5 2.5-1.5 1.5 0 2.5.9 2.5 2.1 0 2.7-5 1.6-5 4 0 1.1 1 2.2 2.6 2.2 1.1 0 2-.5 2.5-1.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IcoPerson() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6.5 18.5c.8-2.8 2.7-4.2 5.5-4.2s4.7 1.4 5.5 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IcoEngine() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 5v2.2M12 16.8V19M5 12h2.2M16.8 12H19M7.1 7.1l1.6 1.6M15.3 15.3l1.6 1.6M16.9 7.1l-1.6 1.6M8.7 15.3l-1.6 1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IcoList() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M8 7h11M8 12h11M8 17h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="5" cy="7" r="1.1" fill="currentColor" />
      <circle cx="5" cy="12" r="1.1" fill="currentColor" />
      <circle cx="5" cy="17" r="1.1" fill="currentColor" />
    </svg>
  );
}

function IcoBank() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 9.5 12 5l8 4.5M6 10v7M10 10v7M14 10v7M18 10v7M4 17.5h16M3.5 20h17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoAlert() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M12 4.5 20.5 19h-17L12 4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 10v4.2M12 16.6v.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IcoCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8.8 12.2 2.2 2.2 4.3-4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoHalf() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 4a8 8 0 0 1 0 16" fill="currentColor" />
    </svg>
  );
}

function IcoOut() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const COVERED = [
  {
    ref: "9.14 · 9.2",
    title: "Identificación no presencial",
    text: "El KYC registra correo, teléfono, CURP e INE, y verifica identidad con liveness antes de continuar la solicitud.",
  },
  {
    ref: "15.2 · listas",
    title: "Cruce AML en el KYC, incluido PEP",
    text: "Al verificar a la persona, el KYC consulta OFAC SDN, ONU, SAT 69-B, PEP nacional, UIF e Interpol. Si hay coincidencia PEP, la validación lo marca.",
  },
  {
    ref: "9.18 · 9.20",
    title: "Expediente de originación",
    text: "MDC guarda nómina, extracto, comprobante de domicilio y el cruce de nombre/CURP contra el KYC.",
  },
  {
    ref: "9.22",
    title: "Sin identificar, no opera",
    text: "La solicitud no cierra el expediente si el KYC no terminó. Las reglas pueden bloquear el alta.",
  },
  {
    ref: "15.2",
    title: "Consulta del cliente y sus operaciones",
    text: "Hay detalle de identidad, documentos, calendario de cuotas, matching de pagos y notas de cobranza.",
  },
  {
    ref: "13 · sucursales",
    title: "Roles y sucursales",
    text: "Administración, riesgo, operaciones y consulta, más sucursales con mapa.",
  },
];

const PARTIAL = [
  {
    title: "Propietario real / UBO",
    text: "KYB captura accionistas con 25% o más. No sustituye el expediente de beneficiario controlador de la entidad.",
  },
  {
    title: "Geolocalización",
    text: "Hay mapa de sucursales. No se guarda la geolocalización del dispositivo al firmar el contrato (Anexo 2).",
  },
  {
    title: "Conservación legal",
    text: "Los archivos viven en MDC. No hay política de 5 o 10 años, ni destrucción controlada.",
  },
];

const OUT = [
  {
    title: "Reportes a la UIF",
    text: "Operaciones relevantes, inusuales, internas preocupantes y el aviso de 24 horas se envían por SITI. Eso lo hace el Oficial de Cumplimiento de TESTAFIN.",
  },
  {
    title: "Perfil transaccional PLD",
    text: "El manual pide alertar si el cliente se sale de lo que declaró. MDC ve pagos de crédito, no un perfil de lavado.",
  },
  {
    title: "Efectivo, factoraje y fideicomisos",
    text: "Umbrales en UDIS, dólares o un millón de pesos no aplican al producto actual de nómina/crédito.",
  },
  {
    title: "Gobierno PLD",
    text: "Comité, capacitación anual, auditoría CNBV y lista de personas bloqueadas son de la entidad, no del motor.",
  },
];

const SYS_GROUPS = [
  {
    title: "Lo que ya hace el KYC y MDC",
    tone: "ok" as const,
    items: [
      "Conservar y consultar el expediente de identificación del acreditado",
      "Verificar datos y documentos capturados de forma no presencial",
      "Cruzar a la persona contra OFAC, ONU, SAT 69-B, PEP, UIF e Interpol",
      "Ver las operaciones de crédito de un mismo cliente (cuotas y cobranza)",
    ],
  },
  {
    title: "Lo que el motor apoya a medias",
    tone: "mid" as const,
    items: [
      "Agrupar contratos del mismo cliente en una vista consolidada PLD",
      "Seguridad y bitácora operativa (no es el canal confidencial del Oficial de Cumplimiento)",
      "Insumos de originación para una metodología de riesgo de la entidad",
    ],
  },
  {
    title: "Lo que TESTAFIN resuelve fuera del motor",
    tone: "out" as const,
    items: [
      "Transmitir reportes relevantes, inusuales e internas a SHCP/CNBV",
      "Alertas por cambio de perfil transaccional, terrorismo o personas bloqueadas de la SHCP",
      "Histórico y dictamen de operaciones inusuales",
      "Canal interno para reportar al Oficial de Cumplimiento",
    ],
  },
];

export function AmlAnalisisView() {
  const [deckOpen, setDeckOpen] = useState(false);

  return (
    <div className="aml-analisis">
      <header className="aml-analisis__top">
        <div className="aml-analisis__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mdc-navbar-logo.svg" alt="Aethereun" />
        </div>
        <div className="aml-analisis__top-actions">
          <p>Análisis público · sin sesión</p>
          <button type="button" className="aml-analisis__slides-btn" onClick={() => setDeckOpen(true)}>
            Slides
          </button>
        </div>
      </header>

      {deckOpen ? <AmlAnalisisDeck onClose={() => setDeckOpen(false)} /> : null}

      <main className="aml-analisis__main">
        <section className="aml-analisis__hero">
          <p>TESTAFIN · Manual PLD/FT · 220 páginas</p>
          <h1>Qué cubre el sistema frente al manual de prevención de lavado</h1>
          <span>
            El motor identifica al acreditado, cruza listas AML en el KYC y opera el crédito. El
            programa de cumplimiento de TESTAFIN —reportes UIF, Oficial de Cumplimiento y metodología
            de riesgo— sigue siendo de la entidad.
          </span>
        </section>

        <section className="aml-analisis__stats">
          <article>
            <Icon><IcoShield /></Icon>
            <strong>Identidad y listas</strong>
            <p>
              El KYC no solo toma la INE. Cruza a la persona contra las seis listas restrictivas del
              flujo PLD antes de soltar el expediente.
            </p>
          </article>
          <article>
            <Icon><IcoCredit /></Icon>
            <strong>Crédito y cobranza</strong>
            <p>
              MDC arma la solicitud, guarda documentos, aplica reglas y sigue pagos. Eso es
              originación, no un monitor de operaciones inusuales.
            </p>
          </article>
          <article>
            <Icon><IcoBank /></Icon>
            <strong>Programa PLD de TESTAFIN</strong>
            <p>
              Reportes a la Secretaría, comité, capacitación y lista de personas bloqueadas no
              viven en el motor. Los resuelve el Oficial de Cumplimiento.
            </p>
          </article>
        </section>

        <section className="aml-analisis__block">
          <h2>Qué significan UBO, PEP y conservación</h2>
          <p className="aml-analisis__lead">
            Tres palabras del manual. PEP ya lo valida el KYC. UBO y conservación son otra cosa.
          </p>
          <div className="aml-analisis-split aml-analisis-glossary">
            <article>
              <Icon><IcoShield /></Icon>
              <p>Ya lo valida el KYC</p>
              <h3>PEP · Persona políticamente expuesta</h3>
              <span>
                Alguien con un cargo público relevante, o un familiar cercano: gobernador, diputado,
                director de paraestatal, etc. El KYC lo cruza contra la lista PEP nacional. Si hay
                match, la validación lo marca.
              </span>
            </article>
            <article>
              <Icon><IcoPerson /></Icon>
              <p>Parcial · persona moral</p>
              <h3>UBO · propietario real</h3>
              <span>
                Ultimate Beneficial Owner: quién manda de verdad en una empresa, no solo el
                representante. Suele ser quien tiene 25% o más. KYB pide esos accionistas; no arma
                el expediente legal completo de beneficiario controlador.
              </span>
            </article>
            <article>
              <Icon><IcoDocs /></Icon>
              <p>Parcial · archivo</p>
              <h3>Conservación</h3>
              <span>
                Guardar INE, contratos y soportes el tiempo que pide la ley (en México, 5 o 10 años)
                y poder entregarlos a CNBV. MDC almacena el expediente de crédito; no define la
                política de retención ni la destrucción controlada.
              </span>
            </article>
          </div>
        </section>

        <section className="aml-analisis__block">
          <h2>Reparto visual de cobertura</h2>
          <p className="aml-analisis__lead">
            Lectura rápida: el sistema cubre identidad, listas y crédito. TESTAFIN cubre reportes y
            gobierno PLD.
          </p>
          <div className="aml-analisis-chart">
            <div className="aml-analisis-chart__bars">
              <div className="aml-analisis-chart__row">
                <span>Identidad + listas KYC (con PEP)</span>
                <b className="is-ok" style={{ width: "92%" }} />
                <em>Cubierto</em>
              </div>
              <div className="aml-analisis-chart__row">
                <span>Expediente y pagos</span>
                <b className="is-ok" style={{ width: "78%" }} />
                <em>Cubierto</em>
              </div>
              <div className="aml-analisis-chart__row">
                <span>UBO y conservación de expediente</span>
                <b className="is-mid" style={{ width: "42%" }} />
                <em>Parcial</em>
              </div>
              <div className="aml-analisis-chart__row">
                <span>Reportes UIF y SITI</span>
                <b className="is-out" style={{ width: "10%" }} />
                <em>Entidad</em>
              </div>
              <div className="aml-analisis-chart__row">
                <span>Oficial, comité y capacitación</span>
                <b className="is-out" style={{ width: "8%" }} />
                <em>Entidad</em>
              </div>
            </div>
            <ul className="aml-analisis-chart__legend">
              <li><i className="is-ok" /> Sistema</li>
              <li><i className="is-mid" /> Apoyo parcial</li>
              <li><i className="is-out" /> TESTAFIN</li>
            </ul>
          </div>
        </section>

        <section className="aml-analisis__block">
          <h2>Cómo entra el cliente</h2>
          <p className="aml-analisis__lead">
            Del alta en MDC al cobro. El cruce AML ocurre dentro del KYC, no al final del crédito.
          </p>
          <ol className="aml-analisis-flow">
            <li>
              <Icon><IcoForm /></Icon>
              <em>01</em>
              <strong>Alta en MDC</strong>
              <span>CURP, correo, teléfono y producto</span>
            </li>
            <li>
              <Icon><IcoScan /></Icon>
              <em>02</em>
              <strong>KYC</strong>
              <span>Auth, INE, liveness y listas AML</span>
            </li>
            <li>
              <Icon><IcoDocs /></Icon>
              <em>03</em>
              <strong>Documentos</strong>
              <span>Nómina, domicilio y cruce de datos</span>
            </li>
            <li>
              <Icon><IcoRules /></Icon>
              <em>04</em>
              <strong>Reglas</strong>
              <span>Decisión de crédito sobre el expediente</span>
            </li>
            <li>
              <Icon><IcoPay /></Icon>
              <em>05</em>
              <strong>Pagos</strong>
              <span>Calendario, matching y cobranza</span>
            </li>
          </ol>
        </section>

        <section className="aml-analisis__block">
          <h2>Qué revisa el KYC en listas</h2>
          <p className="aml-analisis__lead">
            La persona identificada se compara con las mismas fuentes que el módulo PLD/AML nombra
            en listas restrictivas.
          </p>
          <div className="aml-analisis-kyc">
            <div className="aml-analisis-kyc__person">
              <Icon><IcoPerson /></Icon>
              <p>Solicitante</p>
              <strong>CURP · INE · nombre</strong>
              <span>Identidad verificada</span>
            </div>
            <div className="aml-analisis-kyc__arrow" aria-hidden>
              <b />
            </div>
            <div className="aml-analisis-kyc__engine">
              <Icon><IcoEngine /></Icon>
              <p>Motor KYC</p>
              <strong>Verificación AML</strong>
              <span>Consulta simultánea</span>
            </div>
            <div className="aml-analisis-kyc__arrow" aria-hidden>
              <b />
            </div>
            <ul className="aml-analisis-kyc__lists">
              {AML_BLACKLIST_SOURCES.map((source) => (
                <li key={source}>
                  <IcoList />
                  {source}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="aml-analisis__block">
          <h2>Dónde termina el motor y empieza TESTAFIN</h2>
          <div className="aml-analisis-split">
            <article>
              <Icon><IcoId /></Icon>
              <p>Sistema (MDC + KYC)</p>
              <h3>Identificar y operar</h3>
              <ul>
                <li>Conocer quién es el acreditado</li>
                <li>Cruzar listas AML en el KYC</li>
                <li>Integrar el expediente de crédito</li>
                <li>Cobrar y dar seguimiento a cuotas</li>
              </ul>
            </article>
            <article>
              <Icon><IcoAlert /></Icon>
              <p>TESTAFIN</p>
              <h3>Prevenir, detectar y reportar</h3>
              <ul>
                <li>Dictaminar operaciones inusuales</li>
                <li>Enviar reportes por SITI a CNBV/UIF</li>
                <li>Clasificar riesgo Alto / Medio / Bajo</li>
                <li>Capacitar y designar Oficial de Cumplimiento</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="aml-analisis__block">
          <h2>Capítulo 15 · sistema automatizado</h2>
          <p className="aml-analisis__lead">
            El manual pide un sistema que conserve expedientes, alerte desviaciones y transmita
            reportes. No es un conteo de casillas: son tres capas distintas.
          </p>
          <div className="aml-analisis-groups">
            {SYS_GROUPS.map((group) => (
              <article key={group.title} className={`aml-analisis-groups__card is-${group.tone}`}>
                <Icon>
                  {group.tone === "ok" ? <IcoCheck /> : group.tone === "mid" ? <IcoHalf /> : <IcoOut />}
                </Icon>
                <h3>{group.title}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="aml-analisis__grid3">
          <article>
            <h2><Icon><IcoCheck /></Icon> Sí abarcamos</h2>
            <ul>
              {COVERED.map((item) => (
                <li key={item.title}>
                  <em>{item.ref}</em>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </article>
          <article>
            <h2><Icon><IcoHalf /></Icon> Apoya, no cumple solo</h2>
            <ul>
              {PARTIAL.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </article>
          <article>
            <h2><Icon><IcoOut /></Icon> Fuera del motor</h2>
            <ul>
              {OUT.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}

const FLOW = [
  { n: "01", title: "Alta en MDC", text: "CURP, correo, teléfono y producto" },
  { n: "02", title: "KYC", text: "Auth, INE, liveness y listas AML" },
  { n: "03", title: "Documentos", text: "Nómina, domicilio y cruce de datos" },
  { n: "04", title: "Reglas", text: "Decisión de crédito sobre el expediente" },
  { n: "05", title: "Pagos", text: "Calendario, matching y cobranza" },
];

function AmlAnalisisDeck({ onClose }: { onClose: () => void }) {
  const slides = [
    <section key="title" className="aml-deck__slide">
      <p>TESTAFIN · Manual PLD/FT</p>
      <h2>Qué cubrimos frente al manual de prevención de lavado</h2>
      <span>
        El KYC identifica y cruza listas AML, incluido PEP. MDC opera el crédito. TESTAFIN reporta
        a la UIF.
      </span>
    </section>,
    <section key="layers" className="aml-deck__slide">
      <p>Tres capas</p>
      <h2>Identidad, crédito y programa PLD</h2>
      <ul className="aml-deck__cards">
        <li>
          <strong>Identidad y listas</strong>
          <span>KYC verifica INE y cruza OFAC, ONU, SAT 69-B, PEP, UIF e Interpol.</span>
        </li>
        <li>
          <strong>Crédito y cobranza</strong>
          <span>MDC arma expediente, reglas, cuotas y cobranza.</span>
        </li>
        <li>
          <strong>Programa TESTAFIN</strong>
          <span>Reportes UIF, Oficial de Cumplimiento y capacitación.</span>
        </li>
      </ul>
    </section>,
    <section key="terms" className="aml-deck__slide">
      <p>Palabras del manual</p>
      <h2>PEP sí. UBO y conservación, a medias</h2>
      <ul className="aml-deck__cards">
        <li>
          <em>Cubierto</em>
          <strong>PEP</strong>
          <span>Persona políticamente expuesta. El KYC la marca si hay coincidencia.</span>
        </li>
        <li>
          <em>Parcial</em>
          <strong>UBO</strong>
          <span>Dueño real de la empresa (25%+). KYB lo captura, no cierra el expediente legal.</span>
        </li>
        <li>
          <em>Parcial</em>
          <strong>Conservación</strong>
          <span>Guardar el expediente 5 o 10 años. MDC almacena; TESTAFIN define la política.</span>
        </li>
      </ul>
    </section>,
    <section key="flow" className="aml-deck__slide">
      <p>Originación</p>
      <h2>El cruce AML ocurre en el KYC</h2>
      <ol className="aml-deck__flow">
        {FLOW.map((step) => (
          <li key={step.n}>
            <em>{step.n}</em>
            <strong>{step.title}</strong>
            <span>{step.text}</span>
          </li>
        ))}
      </ol>
    </section>,
    <section key="lists" className="aml-deck__slide">
      <p>Validación KYC</p>
      <h2>Listas que sí consultamos</h2>
      <ul className="aml-deck__lists">
        {AML_BLACKLIST_SOURCES.map((source) => (
          <li key={source}>{source}</li>
        ))}
      </ul>
    </section>,
    <section key="covered" className="aml-deck__slide">
      <p>Cubierto</p>
      <h2>Esto sí lo hace el sistema</h2>
      <ul className="aml-deck__stack">
        {COVERED.map((item) => (
          <li key={item.title}>
            <strong>{item.title}</strong>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </section>,
    <section key="partial" className="aml-deck__slide">
      <p>Parcial</p>
      <h2>Apoyamos, no cerramos solos</h2>
      <ul className="aml-deck__stack">
        {PARTIAL.map((item) => (
          <li key={item.title}>
            <strong>{item.title}</strong>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </section>,
    <section key="out" className="aml-deck__slide">
      <p>Fuera del motor</p>
      <h2>Esto lo resuelve TESTAFIN</h2>
      <ul className="aml-deck__stack">
        {OUT.map((item) => (
          <li key={item.title}>
            <strong>{item.title}</strong>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </section>,
    <section key="split" className="aml-deck__slide">
      <p>Frontera</p>
      <h2>Motor vs entidad</h2>
      <ul className="aml-deck__cards">
        <li>
          <strong>MDC + KYC</strong>
          <span>Identificar, cruzar listas AML, armar expediente y cobrar.</span>
        </li>
        <li>
          <strong>TESTAFIN</strong>
          <span>Dictaminar inusuales, reportar por SITI y gobernar el programa PLD.</span>
        </li>
      </ul>
    </section>,
    <section key="end" className="aml-deck__slide">
      <p>Cierre</p>
      <h2>Cubrimos originación y listas. No sustituimos a la UIF</h2>
      <span>
        El producto identifica al acreditado, valida PEP y las demás listas, y opera el crédito. El
        Oficial de Cumplimiento sigue siendo de TESTAFIN.
      </span>
    </section>,
  ];

  const last = slides.length - 1;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        setIndex((current) => Math.min(last, current + 1));
      }
      if (event.key === "ArrowLeft") {
        setIndex((current) => Math.max(0, current - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last, onClose]);

  return (
    <div className="aml-deck" role="dialog" aria-modal="true" aria-label="Presentación PLD/AML">
      <div className="aml-deck__bar">
        <p>Slides · cobertura PLD</p>
        <span>
          {index + 1} / {slides.length}
        </span>
        <button type="button" onClick={onClose}>
          Salir
        </button>
      </div>
      <div className="aml-deck__stage">{slides[index]}</div>
      <div className="aml-deck__nav">
        <button type="button" onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0}>
          Anterior
        </button>
        <div className="aml-deck__dots">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.key}
              type="button"
              className={slideIndex === index ? "is-active" : undefined}
              aria-label={`Ir a la diapositiva ${slideIndex + 1}`}
              onClick={() => setIndex(slideIndex)}
            />
          ))}
        </div>
        <button type="button" onClick={() => setIndex((current) => Math.min(last, current + 1))} disabled={index === last}>
          Siguiente
        </button>
      </div>
    </div>
  );
}
