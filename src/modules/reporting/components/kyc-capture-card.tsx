"use client";

import type { KycCapture } from "../types/credit-report.types";

function IneFrontMock({ name, curp }: { name: string; curp: string }) {
  return (
    <div className="rpt-kyc-mock rpt-kyc-mock--ine-front">
      <div className="rpt-kyc-mock__photo" />
      <div className="rpt-kyc-mock__fields">
        <span className="rpt-kyc-mock__gov">ESTADOS UNIDOS MEXICANOS</span>
        <span className="rpt-kyc-mock__gov-sub">INSTITUTO NACIONAL ELECTORAL</span>
        <strong>{name}</strong>
        <span>CURP {curp}</span>
        <span>DOMICILIO CDMX</span>
        <span>VIGENCIA 2034</span>
      </div>
    </div>
  );
}

function IneBackMock() {
  return (
    <div className="rpt-kyc-mock rpt-kyc-mock--ine-back">
      <div className="rpt-kyc-mock__barcode" />
      <span>MRZ &lt;MEX&lt;&lt;MENDEZ&lt;ORTIZ&lt;&lt;JUAN&lt;FERNANDO</span>
    </div>
  );
}

function SelfieMock({ score }: { score?: number }) {
  return (
    <div className="rpt-kyc-mock rpt-kyc-mock--selfie">
      <div className="rpt-kyc-mock__face" />
      {score != null && <span className="rpt-kyc-mock__badge">Match {score}%</span>}
    </div>
  );
}

function AddressMock() {
  return (
    <div className="rpt-kyc-mock rpt-kyc-mock--doc">
      <span className="rpt-kyc-mock__doc-title">CFE · Comprobante</span>
      <div className="rpt-kyc-mock__doc-lines">
        <div /><div /><div />
      </div>
    </div>
  );
}

export function KycCaptureCard({
  capture,
  subjectName,
  curp,
}: {
  capture: KycCapture;
  subjectName: string;
  curp: string;
}) {
  return (
    <article className="rpt-kyc-card">
      <div className="rpt-kyc-card__preview">
        {capture.type === "ine_front" && <IneFrontMock name={subjectName} curp={curp} />}
        {capture.type === "ine_back" && <IneBackMock />}
        {capture.type === "selfie" && <SelfieMock score={capture.matchScore} />}
        {capture.type === "proof_address" && <AddressMock />}
      </div>
      <div className="rpt-kyc-card__meta">
        <strong>{capture.label}</strong>
        <span>{new Date(capture.capturedAt).toLocaleString("es-MX")}</span>
        <span className="rpt-kyc-card__device">{capture.device}</span>
        {capture.livenessScore != null && (
          <span className="rpt-kyc-card__score">Prueba de vida {capture.livenessScore}%</span>
        )}
      </div>
    </article>
  );
}
