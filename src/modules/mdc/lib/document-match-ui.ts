import type {
  DocumentMatch,
  DocumentMatchField,
} from "@/modules/mdc/services/mdc-finance-requests.service";

export type DocumentMatchBadge = {
  label: string;
  tone: "ok" | "bad" | "info" | "warn";
  className: string;
  chipClassName: string;
};

export function documentMatchBadge(match?: DocumentMatch | null): DocumentMatchBadge | null {
  if (!match) return null;
  switch (match.status) {
    case "match":
      return {
        label: "Coincide con KYC",
        tone: "ok",
        className: "mdc-badge mdc-badge--ok",
        chipClassName: "bg-emerald-50 text-emerald-700",
      };
    case "mismatch":
      return {
        label: "No coincide con KYC",
        tone: "bad",
        className: "mdc-badge mdc-badge--bad",
        chipClassName: "bg-red-50/70 text-red-600",
      };
    case "neutral":
      return {
        label: "No es el titular",
        tone: "info",
        className: "mdc-badge mdc-badge--info",
        chipClassName: "bg-slate-200/80 text-slate-600",
      };
    case "pending_kyc":
      return {
        label: "Esperando KYC",
        tone: "warn",
        className: "mdc-badge mdc-badge--warn",
        chipClassName: "bg-amber-50 text-amber-700",
      };
    default:
      return null;
  }
}

export function documentMatchField(
  match: DocumentMatch | null | undefined,
  name: DocumentMatchField["name"],
) {
  return match?.fields?.find((field) => field.name === name);
}

export function documentMatchFieldClass(
  field?: DocumentMatchField,
  treatMismatchAsNeutral = false,
) {
  if (!field) return "";
  if (field.status === "match") return "mdc-kyc-field mdc-kyc-field--ok";
  if (field.status === "mismatch") {
    return treatMismatchAsNeutral
      ? "mdc-kyc-field mdc-kyc-field--neutral"
      : "mdc-kyc-field mdc-kyc-field--bad";
  }
  return "mdc-kyc-field mdc-kyc-field--missing";
}

export function isWaitingKycMatch(progress?: {
  documents?: Array<{ documentMatch?: { status?: string } | null }>;
} | null) {
  return (progress?.documents ?? []).some((doc) => doc.documentMatch?.status === "pending_kyc");
}
