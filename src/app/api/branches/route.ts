import { NextResponse } from "next/server";
import { BranchesPayload } from "@/modules/branches/types/branch.types";

function getBranchesFallback() {
  const payload: BranchesPayload = {
    organization: { id: "org-main", name: "Zelify Demo" },
    branches: [
      {
        id: "main",
        organizationId: "org-main",
        name: "Sucursal Principal",
        status: "ACTIVE",
        type: "PRINCIPAL",
        isPrincipal: true,
        region: "CDMX",
        address: "Paseo de la Reforma 222",
        colonia: "Juárez",
        latitude: 19.4284,
        longitude: -99.1614,
        centres: [
          {
            id: "centre-main-1",
            branchId: "main",
            name: "Centro Reforma",
            meetingDay: "Miércoles",
            meetingPlace: "Reforma 250",
            status: "ACTIVE",
          },
        ],
        portfolio: {
          branchId: "main",
          activeLoans: 12,
          totalDeposits: 24580900,
          assignedCustomers: 148,
          delinquencyRate: 2.4,
          glReportLabel: "GL-CDMX-01",
        },
        users: [
          {
            id: "usr-main-1",
            branchId: "main",
            fullName: "Camila Rojas",
            roleName: "BRANCH_MANAGER",
            email: "camila.rojas@zelify.mx",
            transactionsBranch: "CDMX",
          },
        ],
      },
      {
        id: "north",
        organizationId: "org-main",
        name: "Sucursal Norte",
        status: "ACTIVE",
        type: "SECUNDARIA",
        isPrincipal: false,
        region: "Monterrey",
        address: "Av. Constitución 2000",
        colonia: "Centro",
        latitude: 25.6866,
        longitude: -100.3161,
        centres: [],
        portfolio: {
          branchId: "north",
          activeLoans: 7,
          totalDeposits: 11840250,
          assignedCustomers: 92,
          delinquencyRate: 1.8,
          glReportLabel: "GL-MTY-02",
        },
        users: [],
      },
    ],
  };

  return NextResponse.json(payload);
}

export async function GET() {
  return getBranchesFallback();
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    id: string;
    organizationId: string;
    name: string;
    status: "ACTIVE" | "INACTIVE";
    type?: "PRINCIPAL" | "SECUNDARIA";
    isPrincipal?: boolean;
    region: string;
    address?: string;
    colonia?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  if (!body?.id || !body?.organizationId || !body?.name) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }
  // Mock-only: no hay persistencia remota.
  return NextResponse.json({ ok: true }, { status: 201 });
}
