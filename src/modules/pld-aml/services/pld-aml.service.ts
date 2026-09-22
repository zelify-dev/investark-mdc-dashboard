import { getStoredOrganization } from "@/lib/auth-api";
import type {
  AmlDataSourcesResponse,
  AmlInternalListCreatePayload,
  AmlInternalListEntry,
  AmlInternalListMatchPayload,
  AmlInternalListRecordCreatePayload,
  AmlInternalListsResponse,
  AmlInternalListUpdatePayload,
  AmlMonitoringCreatePayload,
  AmlMonitoringListResponse,
  AmlRecommendedListsResponse,
  AmlScreeningBatchCreatePayload,
  AmlScreeningDetail,
  AmlScreeningPayload,
  AmlScreeningsListResponse,
  AmlScreeningStatus,
  AmlValidationGroup,
  BlockingRulesPayload,
  CreateAmlAlertPayload,
  CreateAmlValidationGroupPayload,
  CreateBlockPayload,
  CreateExternalPayload,
  CreateInternalConcerningPayload,
  CreateRelevantOperationPayload,
  CreateUnusualOperationPayload,
  ExecuteEbrEvaluationPayload,
  GenerateRegulatoryBatchPayload,
  HealthResponse,
  OrganizationValidationConfig,
  OrganizationValidationConfigPayload,
  PagedQuery,
  RescreeningConfigPayload,
  SimulateBlockPayload,
  UnblockPayload,
  UpdateAmlAlertStatusPayload,
} from "@/modules/pld-aml/types/pld-aml.types";
import { amlBlob, amlRequest, asList, toQuery } from "@/modules/pld-aml/services/pld-aml-api-client";

const json = (body: unknown): RequestInit => ({
  method: "POST",
  body: JSON.stringify(body),
});

const put = (body: unknown): RequestInit => ({
  method: "PUT",
  body: JSON.stringify(body),
});

const patch = (body: unknown): RequestInit => ({
  method: "PATCH",
  body: JSON.stringify(body),
});

export function fetchAmlHealth() {
  return amlRequest<HealthResponse>("/health");
}

export function fetchAmlHello() {
  return amlRequest<string>("/");
}

export function fetchScreeningLists(page?: number | string) {
  return amlRequest<AmlDataSourcesResponse>(`/aml/lists${toQuery({ page })}`);
}

export async function fetchAllScreeningLists() {
  const collected: AmlDataSourcesResponse["results"] = [];
  const seen = new Set<string>();
  let page: number | string | null = 1;
  let previous: number | string | null = null;
  for (let i = 0; i < 30 && page != null && page !== previous; i += 1) {
    const payload = await fetchScreeningLists(page);
    for (const item of payload.results ?? []) {
      const key = item.short_name || item.name;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      collected.push(item);
    }
    previous = page;
    page = payload.has_more ? payload.next_page : null;
  }
  return collected;
}

export function fetchRecommendedLists(country = "MX") {
  return amlRequest<AmlRecommendedListsResponse>(`/aml/lists/recommended${toQuery({ country })}`);
}

export function fetchScreenings(query: PagedQuery = {}) {
  return amlRequest<AmlScreeningsListResponse>(`/aml/screenings${toQuery(query)}`);
}

export function createScreening(payload: AmlScreeningPayload) {
  return amlRequest<unknown>("/aml/screenings", json(payload));
}

export function createLegacyScreening(payload: AmlScreeningPayload) {
  return amlRequest<unknown>("/aml/screening", json(payload));
}

export function fetchScreening(screeningId: string) {
  return amlRequest<AmlScreeningDetail>(`/aml/screenings/${encodeURIComponent(screeningId)}`);
}

export function normalizeScreeningStatus(userId: string, payload: unknown): AmlScreeningStatus {
  const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const nested = record.error && typeof record.error === "object" ? (record.error as Record<string, unknown>) : null;
  const status = String(
    record.status || record.screening_status || record.result_status || record.code || nested?.code || "UNKNOWN",
  );
  let passed: boolean | null = null;
  if (typeof record.passed === "boolean") passed = record.passed;
  else if (status === "CLEAN") passed = true;
  else if (status === "MATCH") passed = false;
  else if (status === "NOT_SCREENED" || status === "PROVIDER_ERROR") passed = null;
  const screeningId =
    typeof record.screening_id === "string"
      ? record.screening_id
      : typeof record.screeningId === "string"
        ? record.screeningId
        : null;
  const screened =
    typeof record.screened === "boolean" ? record.screened : Boolean(screeningId) && status !== "NOT_SCREENED";
  return {
    user_id: String(record.user_id || record.userId || userId),
    status,
    screened,
    passed,
    screening_id: screeningId,
    message: typeof record.message === "string" ? record.message : typeof nested?.message === "string" ? nested.message : undefined,
  };
}

export async function fetchScreeningStatus(userId: string): Promise<AmlScreeningStatus> {
  const payload = await amlRequest<unknown>("/aml/screenings/status", {
    headers: { "x-user-id": userId },
  });
  return normalizeScreeningStatus(userId, payload);
}

export function fetchMonitoring(query: PagedQuery = {}) {
  return amlRequest<AmlMonitoringListResponse>(`/aml/monitoring${toQuery(query)}`);
}

export function createMonitoring(payload: AmlMonitoringCreatePayload) {
  return amlRequest<unknown>("/aml/monitoring", json(payload));
}

export function fetchMonitoringDetail(monitoringId: string) {
  return amlRequest<unknown>(`/aml/monitoring/${encodeURIComponent(monitoringId)}`);
}

export function deleteMonitoring(monitoringId: string) {
  return amlRequest<unknown>(`/aml/monitoring/${encodeURIComponent(monitoringId)}`, { method: "DELETE" });
}

export function fetchBatchScreenings(query: PagedQuery = {}) {
  return amlRequest<unknown>(`/aml/screening/batches${toQuery(query)}`);
}

export function submitBatchScreening(payload: AmlScreeningBatchCreatePayload) {
  return amlRequest<unknown>("/aml/screening/batch", json(payload));
}

export function fetchBatchScreening(batchId: string, page?: number) {
  return amlRequest<unknown>(`/aml/screening/batch/${encodeURIComponent(batchId)}${toQuery({ page })}`);
}

export function deleteBatchScreening(batchId: string) {
  return amlRequest<unknown>(`/aml/screening/batch/${encodeURIComponent(batchId)}`, { method: "DELETE" });
}

export function fetchBatchScreeningResult(batchId: string, resultId: string) {
  return amlRequest<unknown>(
    `/aml/screening/batch/${encodeURIComponent(batchId)}/result/${encodeURIComponent(resultId)}`,
  );
}

export function fetchInternalLists(query: PagedQuery = {}) {
  return amlRequest<AmlInternalListsResponse>(`/aml/internal-lists${toQuery(query)}`);
}

export function createInternalList(payload: AmlInternalListCreatePayload) {
  return amlRequest<unknown>("/aml/internal-lists", json(payload));
}

export function fetchInternalList(id: string) {
  return amlRequest<unknown>(`/aml/internal-lists/${encodeURIComponent(id)}`);
}

export function updateInternalList(id: string, payload: AmlInternalListUpdatePayload) {
  return amlRequest<unknown>(`/aml/internal-lists/${encodeURIComponent(id)}`, put(payload));
}

export function deleteInternalList(id: string) {
  return amlRequest<unknown>(`/aml/internal-lists/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function uploadInternalLists(file: File) {
  const body = new FormData();
  body.append("file", file);
  return amlRequest<unknown>("/aml/internal-lists/upload", { method: "POST", body });
}

function pickField(record: Record<string, unknown>, exact: string[], hints: string[] = []) {
  for (const key of exact) {
    const value = record[key];
    if (value != null && String(value).trim() !== "") return String(value);
  }
  const keys = Object.keys(record);
  for (const hint of hints) {
    const found = keys.find((key) => key.toLowerCase().includes(hint));
    if (found && record[found] != null && String(record[found]).trim() !== "") return String(record[found]);
  }
  return "";
}

function toDateValue(value: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function normalizeInternalListEntry(raw: unknown): AmlInternalListEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const id = pickField(record, ["id"]);
  if (!id) return null;
  const debtRaw = record.debt_amount ?? record.Adeudo;
  const debt = typeof debtRaw === "number" ? debtRaw : debtRaw != null && debtRaw !== "" ? Number(debtRaw) : null;
  return {
    id,
    folio: pickField(record, ["folio", "Folio"]),
    legal_name: pickField(record, ["legal_name", "Nombre/Razon social"], ["razon", "nombre"]),
    organization_reported: pickField(record, ["organization_reported"], ["organiz"]),
    risk_type: pickField(record, ["risk_type", "Tipo de riesgo"], ["riesgo"]),
    rfc: pickField(record, ["rfc", "RFC"]),
    curp: pickField(record, ["curp", "CURP"]),
    alias: pickField(record, ["alias", "Alias"]),
    birth_date: toDateValue(pickField(record, ["birth_date", "Fecha de nacimiento"], ["nacimiento"])),
    date_reported: toDateValue(pickField(record, ["date_reported", "Fecha de reporte"], ["reporte"])),
    validity_date: toDateValue(pickField(record, ["validity_date", "Fecha de vigencia"], ["vigencia"])),
    debt_amount: Number.isFinite(debt) ? debt : null,
    notes: pickField(record, ["notes", "Notas"], ["nota"]),
  };
}

export function asInternalListEntries(payload: unknown): AmlInternalListEntry[] {
  return asList(payload)
    .map(normalizeInternalListEntry)
    .filter((item): item is AmlInternalListEntry => Boolean(item));
}

export function fetchInternalListRecords(shortName: string, query: PagedQuery = {}) {
  return amlRequest<unknown>(`/aml/internal-lists/${encodeURIComponent(shortName)}/records${toQuery(query)}`);
}

export function addInternalListRecord(shortName: string, payload: AmlInternalListRecordCreatePayload) {
  return amlRequest<unknown>(`/aml/internal-lists/${encodeURIComponent(shortName)}/records`, json(payload));
}

export function fetchInternalListRecord(shortName: string, recordId: string) {
  return amlRequest<unknown>(
    `/aml/internal-lists/${encodeURIComponent(shortName)}/records/${encodeURIComponent(recordId)}`,
  );
}

export function updateInternalListRecord(
  shortName: string,
  recordId: string,
  payload: AmlInternalListRecordCreatePayload,
) {
  return amlRequest<unknown>(
    `/aml/internal-lists/${encodeURIComponent(shortName)}/records/${encodeURIComponent(recordId)}`,
    patch(payload),
  );
}

export function deleteInternalListRecord(shortName: string, recordId: string) {
  return amlRequest<unknown>(
    `/aml/internal-lists/${encodeURIComponent(shortName)}/records/${encodeURIComponent(recordId)}`,
    { method: "DELETE" },
  );
}

export function matchInternalList(shortName: string, payload: AmlInternalListMatchPayload) {
  return amlRequest<unknown>(`/aml/internal-lists/${encodeURIComponent(shortName)}/match`, json(payload));
}

export function downloadInternalListCsvTemplate(shortName: string) {
  return amlBlob(`/aml/internal-lists/${encodeURIComponent(shortName)}/records/csv-template`);
}

export function importInternalListCsv(shortName: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  return amlRequest<unknown>(`/aml/internal-lists/${encodeURIComponent(shortName)}/records/import`, {
    method: "POST",
    body,
  });
}

function asScore(value: unknown, fallback = 0.88) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function asValidationGroups(payload: unknown): AmlValidationGroup[] {
  const raw = (() => {
    if (Array.isArray(payload)) return payload as AmlValidationGroup[];
    if (payload && typeof payload === "object") {
      const record = payload as OrganizationValidationConfig;
      if (Array.isArray(record.validation_groups)) return record.validation_groups;
      if (Array.isArray(record.groups)) return record.groups;
    }
    return [] as AmlValidationGroup[];
  })();
  return raw.map((group) => ({
    ...group,
    sources: Array.isArray(group.sources) ? group.sources : [],
    min_score: asScore(group.min_score),
    is_default: Boolean(group.is_default),
  }));
}

export function fetchValidationGroups() {
  return fetchOrganizationValidationConfig().then(asValidationGroups);
}

export function createValidationGroup(payload: CreateAmlValidationGroupPayload) {
  return amlRequest<AmlValidationGroup>("/aml/groups", json(payload));
}

export function fetchOrganizationValidationConfig(query: PagedQuery = {}) {
  return amlRequest<unknown>(
    `/aml/groups/organization-config${toQuery({ page: query.page ?? 1, limit: query.limit ?? 25 })}`,
  );
}

export function saveOrganizationValidationConfig(payload: OrganizationValidationConfigPayload) {
  return amlRequest<unknown>("/aml/groups/organization-config", json(payload));
}

export function verifyValidationSources(params: {
  validation_group_id?: string;
  sources_to_check?: string;
  min_score_to_check?: number;
}) {
  return amlRequest<unknown>(`/aml/groups/verify${toQuery(params)}`);
}

export function verifyValidationSourcesPost(payload: {
  validation_group_id?: string;
  sources_to_check?: string[];
  min_score_to_check?: number;
}) {
  return amlRequest<unknown>("/aml/groups/verify", json(payload));
}

export function fetchValidationGroup(id: string) {
  return amlRequest<AmlValidationGroup>(`/aml/groups/${encodeURIComponent(id)}`);
}

export function updateValidationGroup(id: string, payload: Partial<CreateAmlValidationGroupPayload>) {
  return amlRequest<AmlValidationGroup>(`/aml/groups/${encodeURIComponent(id)}`, patch(payload));
}

export function deleteValidationGroup(id: string) {
  return amlRequest<unknown>(`/aml/groups/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function fetchCustomerFraudCheck(customerId: string) {
  return amlRequest<unknown>(`/aml/customers/${encodeURIComponent(customerId)}/fraud-check`);
}

export function fetchBlocks(organizationId?: string) {
  return amlRequest<unknown>(`/blocking${toQuery({ organization_id: organizationId })}`);
}

export function createBlock(payload: CreateBlockPayload) {
  return amlRequest<unknown>("/blocking", json(payload));
}

export function fetchBlockingRules(organizationId?: string) {
  return amlRequest<unknown>(`/blocking/rules${toQuery({ organization_id: organizationId })}`);
}

export function updateBlockingRules(payload: BlockingRulesPayload) {
  return amlRequest<unknown>("/blocking/rules", put(payload));
}

export function simulateBlock(payload: SimulateBlockPayload) {
  return amlRequest<unknown>("/blocking/simulate", json(payload));
}

export function fetchBlock(id: string) {
  return amlRequest<unknown>(`/blocking/${encodeURIComponent(id)}`);
}

export function unblock(id: string, payload: UnblockPayload) {
  return amlRequest<unknown>(`/blocking/${encodeURIComponent(id)}/unblock`, json(payload));
}

export function fetchRescreeningStatus() {
  return amlRequest<unknown>("/rescreening/status");
}

export function runRescreening(payload: { organization_id?: string; lists?: string[] } = {}) {
  return amlRequest<unknown>("/rescreening/run", json(payload));
}

export function fetchRescreeningHistory() {
  return amlRequest<unknown>("/rescreening/history");
}

export function fetchRescreeningConfig() {
  return amlRequest<unknown>("/rescreening/config");
}

export function updateRescreeningConfig(payload: RescreeningConfigPayload) {
  return amlRequest<unknown>("/rescreening/config", put(payload));
}

export function fetchAlerts() {
  return amlRequest<unknown>("/alerts");
}

export function sendAlertNotification(payload: { alert_id?: string; channel?: string; to?: string }) {
  return amlRequest<unknown>("/alerts/notifications/send", json(payload));
}

export function fetchTransactionalAlertRules() {
  return amlRequest<unknown>("/alerts/transactional/rules");
}

export function updateTransactionalAlertRules(payload: unknown) {
  return amlRequest<unknown>("/alerts/transactional/rules", put(payload));
}

export function fetchAlert(id: string) {
  return amlRequest<unknown>(`/alerts/${encodeURIComponent(id)}`);
}

export function updateAlertStatus(id: string, payload: UpdateAmlAlertStatusPayload) {
  return amlRequest<unknown>(`/alerts/${encodeURIComponent(id)}/status`, patch(payload));
}

export function fetchAmlEmailConfig() {
  return amlRequest<unknown>("/alerts/aml/email-config");
}

export function upsertAmlEmailConfig(payload: unknown) {
  return amlRequest<unknown>("/alerts/aml/email-config", put(payload));
}

export function testAmlEmailConfig(payload: { to?: string; sender?: string } = {}) {
  return amlRequest<unknown>("/alerts/aml/email-config/test", json(payload));
}

export function fetchAmlAlerts() {
  return amlRequest<unknown>("/alerts/aml");
}

export function createAmlAlert(payload: CreateAmlAlertPayload) {
  return amlRequest<unknown>("/alerts/aml", json(payload));
}

export function fetchAmlAlert(code: string) {
  return amlRequest<unknown>(`/alerts/aml/${encodeURIComponent(code)}`);
}

export function updateAmlAlertStatus(code: string, payload: UpdateAmlAlertStatusPayload) {
  return amlRequest<unknown>(`/alerts/aml/${encodeURIComponent(code)}/status`, patch(payload));
}

export function fetchLogs(params: { type?: "aml_screening" | "operations"; organization_id?: string } = {}) {
  return amlRequest<unknown>(`/logs${toQuery({
    type: params.type,
    organization_id: params.organization_id || getStoredOrganization()?.id,
  })}`);
}

export function createOperationLog(payload: unknown) {
  return amlRequest<unknown>("/logs", json(payload));
}

/**
 * El API de bitácora identifica el tenant exclusivamente mediante `x-org-id`.
 * No añadir filtros a la URL: el despliegue vigente rechaza `type` y
 * `organization_id` como parámetros de consulta.
 */
export function exportLogs() {
  return amlBlob("/logs/export", { headers: { Accept: "text/plain" } });
}

export function fetchLog(id: string) {
  return amlRequest<unknown>(`/logs/${encodeURIComponent(id)}`);
}

export function fetchExternals() {
  return amlRequest<unknown>("/external");
}

export function createExternal(payload: CreateExternalPayload) {
  return amlRequest<unknown>("/external", json(payload));
}

export function uploadExternal(formData: FormData) {
  return amlRequest<unknown>("/external/upload", { method: "POST", body: formData });
}

export function fetchExternal(id: string) {
  return amlRequest<unknown>(`/external/${encodeURIComponent(id)}`);
}

export function updateExternal(id: string, payload: Partial<CreateExternalPayload>) {
  return amlRequest<unknown>(`/external/${encodeURIComponent(id)}`, patch(payload));
}

export function deleteExternal(id: string) {
  return amlRequest<unknown>(`/external/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function fetchEbrStatus() {
  return amlRequest<unknown>("/ebr/status");
}

export function fetchEbrRiskScoring() {
  return amlRequest<unknown>("/ebr/evaluation-risk-scoring");
}

export function fetchEbrMethodologies() {
  return amlRequest<unknown>("/ebr/methodologies");
}

export function fetchEbrMethodology(id: string) {
  return amlRequest<unknown>(`/ebr/methodologies/${encodeURIComponent(id)}`);
}

export function updateEbrMethodology(id: string, payload: unknown) {
  return amlRequest<unknown>(`/ebr/methodologies/${encodeURIComponent(id)}`, patch(payload));
}

export function activateEbrMethodology(id: string, payload: unknown = {}) {
  return amlRequest<unknown>(`/ebr/methodologies/${encodeURIComponent(id)}/activate`, json(payload));
}

export function fetchEbrFactors() {
  return amlRequest<unknown>("/ebr/factors");
}

export function fetchEbrFactor(id: string) {
  return amlRequest<unknown>(`/ebr/factors/${encodeURIComponent(id)}`);
}

export function updateEbrFactor(id: string, payload: unknown) {
  return amlRequest<unknown>(`/ebr/factors/${encodeURIComponent(id)}`, patch(payload));
}

export function fetchEbrIndicators() {
  return amlRequest<unknown>("/ebr/indicators");
}

export function fetchEbrIndicator(id: string) {
  return amlRequest<unknown>(`/ebr/indicators/${encodeURIComponent(id)}`);
}

export function updateEbrIndicator(id: string, payload: unknown) {
  return amlRequest<unknown>(`/ebr/indicators/${encodeURIComponent(id)}`, patch(payload));
}

export function fetchEbrMitigants() {
  return amlRequest<unknown>("/ebr/mitigants");
}

export function fetchEbrMitigant(id: string) {
  return amlRequest<unknown>(`/ebr/mitigants/${encodeURIComponent(id)}`);
}

export function updateEbrMitigant(id: string, payload: unknown) {
  return amlRequest<unknown>(`/ebr/mitigants/${encodeURIComponent(id)}`, patch(payload));
}

export function fetchEbrEvaluations() {
  return amlRequest<unknown>("/ebr/evaluations");
}

export function executeEbrEvaluation(payload: ExecuteEbrEvaluationPayload) {
  return amlRequest<unknown>("/ebr/evaluations", json(payload));
}

export function fetchEbrEvaluation(id: string) {
  return amlRequest<unknown>(`/ebr/evaluations/${encodeURIComponent(id)}`);
}

export function reassessEbrEvaluation(id: string, payload: { reason?: string } = {}) {
  return amlRequest<unknown>(`/ebr/evaluations/${encodeURIComponent(id)}/reassess`, json(payload));
}

export function fetchEbrEvaluationFactors(id: string) {
  return amlRequest<unknown>(`/ebr/evaluations/${encodeURIComponent(id)}/factors`);
}

export function fetchRelevantOperations(params: {
  period?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
} = {}) {
  return amlRequest<unknown>(`/reports/regulatory/relevant${toQuery(params)}`);
}

export function createRelevantOperation(payload: CreateRelevantOperationPayload) {
  return amlRequest<unknown>("/reports/regulatory/relevant", json(payload));
}

export function fetchUnusualOperations() {
  return amlRequest<unknown>("/reports/regulatory/unusual");
}

export function createUnusualOperation(payload: CreateUnusualOperationPayload) {
  return amlRequest<unknown>("/reports/regulatory/unusual", json(payload));
}

export function updateUnusualOperationStatus(id: string, payload: { status: string; comments?: string }) {
  return amlRequest<unknown>(`/reports/regulatory/unusual/${encodeURIComponent(id)}/status`, patch(payload));
}

export function fetchInternalConcerningOperations() {
  return amlRequest<unknown>("/reports/regulatory/internal-concerning");
}

export function createInternalConcerningOperation(payload: CreateInternalConcerningPayload) {
  return amlRequest<unknown>("/reports/regulatory/internal-concerning", json(payload));
}

export function generateRegulatoryBatch(payload: GenerateRegulatoryBatchPayload) {
  return amlRequest<unknown>("/reports/regulatory/generate-batch", json(payload));
}

export function downloadRegulatoryBatch(id: string, format?: "XML" | "CSV" | "JSON") {
  return amlBlob(`/reports/regulatory/batches/${encodeURIComponent(id)}/download${toQuery({ format })}`);
}
