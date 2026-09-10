import { NextResponse } from "next/server";
import { getSystemActivitiesSlice, SYSTEM_ACTIVITIES_TOTAL } from "@/modules/activities/data/system-activities.mock";

function getActivitiesFallback(page: number, pageSize: number, moduleFilter: string | null, branch: string | null) {
  const rows = getSystemActivitiesSlice(page, pageSize).filter((row) => {
    if (moduleFilter && moduleFilter !== "all" && row.module !== moduleFilter) return false;
    if (branch && branch !== "all" && row.branch_id !== branch) return false;
    return true;
  });
  return NextResponse.json({ data: rows, total: SYSTEM_ACTIVITIES_TOTAL });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "50");
  const moduleFilter = searchParams.get("module");
  const branch = searchParams.get("branch");
  return getActivitiesFallback(page, pageSize, moduleFilter, branch);
}
