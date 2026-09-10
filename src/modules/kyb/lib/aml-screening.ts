export type AmlMemberRole =
  | "CEO"
  | "CFO"
  | "Socio / Accionista"
  | "Presidente / Director"
  | "Representante Legal"
  | "Otro";

export type AmlScreeningStatus = "pending" | "validating" | "approved" | "rejected";

export type AmlMember = {
  id: string;
  name: string;
  email: string;
  role: AmlMemberRole;
  ownershipPercent: number;
  rfc: string;
  curp: string;
  ineDocument?: string | null;
  screeningStatus: AmlScreeningStatus;
  screeningDetails: string | null;
  screeningStartedAt?: number;
};

export function isOwnerKybComplete(owner: Pick<AmlMember, "name" | "rfc" | "curp" | "ineDocument">): boolean {
  return (
    owner.name.trim().length > 0 &&
    owner.rfc.trim().length >= 13 &&
    owner.curp.trim().length >= 18 &&
    Boolean(owner.ineDocument && owner.ineDocument.trim().length > 0)
  );
}

export const AML_BLACKLIST_SOURCES = [
  "OFAC - Lista SDN",
  "Consejo de Seguridad ONU",
  "SAT 69-B",
  "PEP Nacional",
  "UIF - Personas bloqueadas",
  "Interpol - Notificación roja",
] as const;

const BLACKLIST_TRIGGERS = [
  "lavado",
  "narc",
  "ofac",
  "terror",
  "sancion",
  "fraude",
  "criminal",
  "bloqueado",
  "lista negra",
  "pep restringido",
];

export function matchesAmlBlacklist(member: Pick<AmlMember, "name" | "email" | "rfc" | "curp">): boolean {
  const haystack = `${member.name} ${member.email} ${member.rfc} ${member.curp}`.toLowerCase();

  return (
    BLACKLIST_TRIGGERS.some((term) => haystack.includes(term)) ||
    haystack.includes("rechazo") ||
    haystack.includes("blacklist")
  );
}

export function resolveAmlScreeningResult(
  member: Pick<AmlMember, "name" | "email" | "rfc" | "curp">,
): { status: "approved" | "rejected"; details: string | null } {
  if (matchesAmlBlacklist(member)) {
    return {
      status: "rejected",
      details: "Coincidencia en listas restrictivas PLD/AML (simulación).",
    };
  }

  return {
    status: "approved",
    details: null,
  };
}

export function buildOwnersAnswersFromAmlMembers(members: AmlMember[]): Record<string, string> {
  const shareholders = members
    .filter((member) => member.ownershipPercent >= 25)
    .map((member) => `${member.name} (${member.ownershipPercent}%)`);

  const findByRole = (roles: string[]) => {
    const match = members.find((member) =>
      roles.some((role) => member.role.toLowerCase().includes(role.toLowerCase())),
    );
    return match?.name ?? "";
  };

  return {
    "1.5.1": shareholders.join(", "),
    "1.5.2": findByRole(["ceo", "director general"]),
    "1.5.3": findByRole(["cfo", "finanzas"]),
    "1.5.4": findByRole(["presidente", "director"]),
  };
}
