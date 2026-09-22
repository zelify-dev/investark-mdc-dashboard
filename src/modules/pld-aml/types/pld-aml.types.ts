export type JsonObject = Record<string, unknown>;

export type PagedQuery = {
  page?: number;
  limit?: number;
};

export type AmlEntityType = "individual" | "entity" | "vessel" | "aircraft";
export type AmlScreeningStrategy = "ALL" | "SANCTIONS" | "INTERNAL_LIST" | "EXTERNAL";

export type AmlDataSourceItem = {
  short_name: string;
  name: string;
  country?: string;
  number_of_entries?: number;
  first_import?: string;
  last_update_info?: JsonObject;
};

export type AmlDataSourcesResponse = {
  count: number;
  page: number;
  has_more: boolean;
  next_page: number | null;
  previous_page: number | null;
  results: AmlDataSourceItem[];
};

export type AmlScreeningResultStatus = "CLEAN" | "MATCH" | "PROVIDER_ERROR" | string;

export type AmlScreeningListItem = {
  screening_id: string;
  organization_id: string;
  user_id?: string | null;
  name?: string;
  data_source?: string;
  created_at: string;
  match_count: number;
  has_matches: boolean;
  result_status?: AmlScreeningResultStatus | null;
  passed?: boolean | null;
  message?: string | null;
  provider_search_id?: string | null;
  risk_score?: number | null;
  confidence_score?: number | null;
};

export type AmlScreeningsListResponse = {
  items: AmlScreeningListItem[];
  total: number;
  page: number;
  limit: number;
};

export type AmlScreeningRequest = {
  name?: string;
  data_source?: string;
  entity_type?: string;
  country?: string;
  date_of_birth?: string;
  curp?: string;
  rfc?: string;
  strategy?: string;
  validation_group_id?: string;
  user_id?: string | null;
  [key: string]: unknown;
};

export type AmlSanctionHit = {
  name?: string;
  data_source?: string;
  score?: number | null;
  entity_type?: string;
  country?: string;
  [key: string]: unknown;
};

export type AmlInternalListHit = {
  id?: string;
  folio?: string;
  legal_name?: string;
  curp?: string | null;
  rfc?: string | null;
  alias?: string | null;
  risk_type?: string;
  organization_reported?: string;
  notes?: string | null;
  date_reported?: string | null;
  validity_date?: string | null;
  debt_amount?: number | null;
  [key: string]: unknown;
};

export type AmlScreeningResponseBody = {
  count?: number;
  results?: AmlSanctionHit[];
  internal_list_matches?: AmlInternalListHit[];
  has_internal_list_matches?: boolean;
  internal_list_matches_count?: number;
  message?: string;
  [key: string]: unknown;
};

export type AmlScreeningDetail = {
  screening_id: string;
  organization_id: string;
  user_id?: string | null;
  provider_search_id?: string | null;
  risk_score?: number | null;
  confidence_score?: number | null;
  result_status?: AmlScreeningResultStatus | null;
  passed?: boolean | null;
  message?: string | null;
  created_at: string;
  updated_at?: string;
  request: AmlScreeningRequest;
  response: AmlScreeningResponseBody;
};

export type AmlScreeningStatusCode = "NOT_SCREENED" | "CLEAN" | "MATCH" | "PROVIDER_ERROR" | string;

export type AmlScreeningStatus = {
  user_id: string;
  status: AmlScreeningStatusCode;
  screened?: boolean;
  passed: boolean | null;
  screening_id?: string | null;
  message?: string;
};

export type AmlScreeningPayload = {
  name: string;
  data_source?: string;
  min_score?: number;
  entity_type?: AmlEntityType;
  country?: string;
  date_of_birth?: string;
  identifier?: string;
  external_identifier?: string;
  name_match_boosting_threshold?: number;
  strategy?: AmlScreeningStrategy;
  validation_group_id?: string;
  curp?: string;
  rfc?: string;
  user_id?: string;
  page?: number;
  identifier_match_boosting_threshold?: number;
  year_of_birth?: number;
  nationality?: string;
};

export type AmlMonitoringListItem = {
  monitoring_id: string;
  organization_id: string;
  provider_entry_id: string;
  name?: string;
  status?: string;
  created_at: string;
};

export type AmlMonitoringListResponse = {
  items: AmlMonitoringListItem[];
  total: number;
  page: number;
  limit: number;
};

export type AmlMonitoringCreatePayload = {
  name: string;
  data_source: string;
  min_score?: number;
  external_identifier?: string;
  country?: string;
  entity_type?: "individual" | "entity";
  date_of_birth?: string;
  identifier?: string;
};

export type AmlScreeningBatchItem = {
  external_identifier?: string;
  name: string;
  data_source?: string;
  entity_type?: AmlEntityType;
  min_score?: number;
  date_of_birth?: string;
  country?: string;
  identifier?: string;
};

export type AmlScreeningBatchCreatePayload = {
  data_source: string;
  min_score?: number;
  items: AmlScreeningBatchItem[];
};

export type AmlInternalListCreatePayload = {
  folio: string;
  legal_name: string;
  organization_reported: string;
  risk_type: string;
  rfc?: string;
  curp?: string;
  alias?: string;
  birth_date?: string;
  date_reported?: string;
  validity_date?: string;
  debt_amount?: number;
  notes?: string;
};

export type AmlInternalListUpdatePayload = {
  folio?: string;
  legal_name?: string;
  organization_reported?: string;
  risk_type?: string;
  rfc?: string;
  curp?: string;
  alias?: string;
  birth_date?: string;
  validity_date?: string;
  date_reported?: string;
  debt_amount?: number;
  notes?: string;
};

export type AmlInternalListEntry = {
  id: string;
  folio: string;
  legal_name: string;
  organization_reported: string;
  risk_type: string;
  rfc: string;
  curp: string;
  alias: string;
  birth_date: string;
  date_reported: string;
  validity_date: string;
  debt_amount: number | null;
  notes: string;
};

export type AmlInternalListsResponse = {
  total?: number;
  page?: number;
  limit?: number;
  data?: unknown[];
  message?: string;
};

export type AmlInternalListRecordCreatePayload = {
  name: string;
  identifier?: string;
  document_type?: string;
  country?: string;
  date_of_birth?: string;
  metadata?: JsonObject;
  values?: JsonObject;
};

export type AmlInternalListMatchPayload = {
  name?: string;
  identifier?: string;
  document_type?: string;
  date_of_birth?: string;
};

export type AmlRecommendedListItem = {
  source_slug: string;
  source_name: string;
  category?: string;
  priority?: number;
  rationale?: string;
};

export type AmlRecommendedListsResponse = {
  organization_id?: string;
  country_code?: string;
  selection_origin?: string;
  recommended_lists: AmlRecommendedListItem[];
};

export type AmlValidationGroup = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  sources: string[];
  min_score: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type OrganizationValidationConfig = {
  organization_id?: string;
  validation_groups?: AmlValidationGroup[];
  groups?: AmlValidationGroup[];
  internal_list_matches?: unknown[];
  pagination?: JsonObject;
};

export type OrganizationValidationConfigPayload = {
  name?: string;
  description?: string;
  sources?: string[];
  min_score?: number;
  is_default?: boolean;
};

export type CreateAmlValidationGroupPayload = {
  name: string;
  description?: string;
  sources: string[];
  min_score?: number;
  is_default?: boolean;
};

export type CreateBlockPayload = {
  user_id?: string;
  reason: string;
  screening_id?: string;
  notes?: string;
};

export type BlockingRulesPayload = {
  organization_id?: string;
  validation_group_id?: string;
  auto_block_enabled?: boolean;
  partner?: string;
  trigger_lists?: string[];
  min_score?: number;
};

export type SimulateBlockPayload = {
  name?: string;
  user_id?: string;
  screening_id?: string;
  score?: number;
  lists?: string[];
};

export type UnblockPayload = {
  reason: string;
  authorized_by?: string;
};

export type RescreeningConfigPayload = {
  frequency: string;
  scheduled_time?: string;
  target_lists?: string[];
  enabled: boolean;
  organization_id?: string;
  auto_generate_alerts?: boolean;
};

export type CreateAmlAlertPayload = {
  subject_name: string;
  screening_id?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  source?: "SANCTIONS" | "EXTERNAL" | "BOTH";
  status?: string;
  block_status?: "BLOCKED" | "UNBLOCKED";
  analyst_notes?: string;
  handled_by?: string;
};

export type UpdateAmlAlertStatusPayload = {
  status: string;
  block_status?: "BLOCKED" | "UNBLOCKED";
  analyst_notes?: string;
};

export type CreateExternalPayload = {
  folio: string;
  organization_reported: string;
  legal_name: string;
  birth_date?: string;
  date_reported?: string;
  validity_date?: string;
  debt_amount?: number | null;
  notes?: string | null;
};

export type ExecuteEbrEvaluationPayload = {
  client_id: string;
  methodology_id?: string;
  evaluated_by?: string;
  reason?: string;
  applied_mitigants?: string[];
};

export type CreateRelevantOperationPayload = {
  operation_number?: string;
  operation_date?: string;
  amount: number;
  currency?: string;
  exchange_rate?: number;
  instrument_type?: "CASH" | "TRAVELERS_CHECK" | "PRECIOUS_METAL" | "WIRE_TRANSFER";
  operation_type?: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";
  client_id?: string;
  client_name?: string;
};

export type CreateUnusualOperationPayload = {
  client_name?: string;
  amount?: number;
  currency?: string;
  operation_date?: string;
  screening_id?: string;
  alert_id?: string;
  client_rfc?: string;
};

export type CreateInternalConcerningPayload = {
  employee_name: string;
  employee_position: string;
  incident_date: string;
  description_of_facts: string;
  employee_number?: string;
  employee_rfc?: string;
  policy_violated?: string;
  measures_taken?: string;
};

export type GenerateRegulatoryBatchPayload = {
  report_type: "RELEVANTE" | "INUSUAL" | "24_HORAS" | "PREOCUPANTE";
  period: string;
  reporting_entity_key: string;
  file_format?: "XML" | "CSV" | "JSON";
  generated_by?: string;
};

export type HealthResponse = {
  status?: string;
  timestamp?: string;
  uptime?: number;
};
