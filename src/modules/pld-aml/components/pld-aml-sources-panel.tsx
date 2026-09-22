"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AmlBanner, AmlField, AmlTable } from "@/modules/pld-aml/components/pld-aml-ui";
import { PldAmlApiError, buildAmlCurl } from "@/modules/pld-aml/services/pld-aml-api-client";
import {
  asValidationGroups,
  fetchAllScreeningLists,
  fetchOrganizationValidationConfig,
  fetchRecommendedLists,
  updateValidationGroup,
} from "@/modules/pld-aml/services/pld-aml.service";
import type { AmlDataSourceItem, AmlRecommendedListItem, AmlValidationGroup } from "@/modules/pld-aml/types/pld-aml.types";

function errorMessage(error: unknown) {
  if (error instanceof PldAmlApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "No fue posible completar la operación.";
}

function toggleValue(values: string[], next: string) {
  return values.includes(next) ? values.filter((item) => item !== next) : [...values, next];
}

function listSlug(item: AmlDataSourceItem) {
  return item.short_name;
}

function useOrgListSelection() {
  const queryClient = useQueryClient();
  const catalogQuery = useQuery({ queryKey: ["pld-aml", "zelify-lists"], queryFn: fetchAllScreeningLists });
  const recommendedQuery = useQuery({
    queryKey: ["pld-aml", "recommended-lists", "MX"],
    queryFn: () => fetchRecommendedLists("MX"),
  });
  const configQuery = useQuery({
    queryKey: ["pld-aml", "org-config"],
    queryFn: () => fetchOrganizationValidationConfig({ page: 1, limit: 25 }),
  });

  const groups = useMemo(() => asValidationGroups(configQuery.data), [configQuery.data]);
  const activeGroup: AmlValidationGroup | null = groups.find((group) => group.is_default) ?? groups[0] ?? null;
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  useEffect(() => {
    setSelectedSources(activeGroup?.sources ?? []);
  }, [activeGroup]);

  const saveMutation = useMutation({
    mutationFn: async (sources: string[]) => {
      if (!activeGroup?.id) {
        throw new PldAmlApiError(
          "Esta organización no tiene grupo de validación. El API no expone POST /aml/groups ni POST /aml/groups/organization-config.",
          404,
        );
      }
      const payload = {
        sources,
        min_score: activeGroup.min_score ?? 0.88,
      };
      if (typeof window !== "undefined") {
        console.log(
          "[PLD/AML] PATCH grupo\n" +
            buildAmlCurl(
              "PATCH",
              `/aml/groups/${activeGroup.id}`,
              payload,
              activeGroup.organization_id || "fa90c82c-12d8-4039-980a-9d1a258fcb66",
            ),
        );
      }
      return updateValidationGroup(activeGroup.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pld-aml", "org-config"] });
      queryClient.invalidateQueries({ queryKey: ["pld-aml", "groups"] });
    },
  });

  const setSources = (next: string[]) => {
    if (activeGroup?.id) setSelectedSources(next);
    saveMutation.mutate(next);
  };

  const toggleSource = (code: string) => setSources(toggleValue(selectedSources, code));

  return {
    catalog: catalogQuery.data ?? [],
    catalogLoading: catalogQuery.isLoading,
    catalogError: catalogQuery.error,
    recommended: recommendedQuery.data?.recommended_lists ?? [],
    recommendedError: recommendedQuery.error,
    recommendedLoading: recommendedQuery.isLoading,
    configLoading: configQuery.isLoading,
    configError: configQuery.error,
    activeGroup,
    selectedSources,
    toggleSource,
    saving: saveMutation.isPending,
    saveError: saveMutation.error,
  };
}

function GroupStatus({ group, loading }: { group: AmlValidationGroup | null; loading: boolean }) {
  if (loading) return <p className="pld-muted">Leyendo configuración de la organización…</p>;
  if (!group?.id) {
    return (
      <AmlBanner tone="info">
        Esta organización no tiene grupo de validación. Crear grupo no está expuesto en el API, así que no se puede
        guardar la selección. Cuando exista un UUID, al marcar una lista se hace PATCH del grupo con los slugs (SDN,
        PEP, CFSP…).
      </AmlBanner>
    );
  }
  return (
    <p className="pld-muted">
      Grupo {group.name || group.id}. Al seleccionar se actualizan las fuentes con PATCH.
    </p>
  );
}

function ListCard({
  code,
  name,
  detail,
  selected,
  disabled,
  onToggle,
}: {
  code: string;
  name: string;
  detail?: string;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`pld-source-option${selected ? " pld-source-option--on" : ""}`}
      onClick={onToggle}
      disabled={disabled}
    >
      <span className={`pld-check${selected ? " pld-check--on" : ""}`} aria-hidden="true" />
      <span>
        <strong>{code}</strong>
        <em>{name}</em>
        {detail ? <em>{detail}</em> : null}
      </span>
    </button>
  );
}

export function PldAmlCatalogPanel() {
  const {
    catalog,
    catalogLoading,
    catalogError,
    recommended,
    recommendedError,
    recommendedLoading,
    configLoading,
    selectedSources,
    toggleSource,
    saving,
    saveError,
    activeGroup,
  } = useOrgListSelection();
  const [pane, setPane] = useState<"all" | "mx">("all");
  const [search, setSearch] = useState("");
  const canPatch = Boolean(activeGroup?.id);

  const filteredCatalog = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return catalog;
    return catalog.filter((item) => `${listSlug(item)} ${item.name}`.toLowerCase().includes(needle));
  }, [catalog, search]);

  return (
    <section className="mdc-section pld-stack">
      <header className="pld-head">
        <h2>Listas</h2>
        <p>Catálogo Zelify y recomendadas para México. El slug (SDN, PEP, CFSP…) es el valor que se guarda en el grupo.</p>
      </header>

      <div className="pld-toolbar">
        <div className="pld-subtabs" role="tablist" aria-label="Tipo de listas">
          <button type="button" className={`pld-subtab${pane === "all" ? " pld-subtab--on" : ""}`} onClick={() => setPane("all")}>
            Todas
          </button>
          <button type="button" className={`pld-subtab${pane === "mx" ? " pld-subtab--on" : ""}`} onClick={() => setPane("mx")}>
            Recomendadas México
          </button>
        </div>
        <div className="pld-toolbar__meta">
          <GroupStatus group={activeGroup} loading={configLoading} />
          {saving ? <p className="pld-muted">Guardando selección…</p> : null}
        </div>
      </div>

      {saveError ? <AmlBanner tone="error">{errorMessage(saveError)}</AmlBanner> : null}

      {pane === "all" ? (
        <section className="pld-card">
          {catalogError ? <AmlBanner tone="error">{errorMessage(catalogError)}</AmlBanner> : null}
          <div className="pld-field--search">
            <AmlField label="Buscar">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="SDN, OFAC, PEP…" />
            </AmlField>
          </div>
          <div className="pld-source-grid">
            {filteredCatalog.map((item: AmlDataSourceItem) => {
              const slug = listSlug(item);
              return (
                <ListCard
                  key={slug}
                  code={slug}
                  name={item.name}
                  selected={selectedSources.includes(slug)}
                  disabled={!canPatch || saving}
                  onToggle={() => toggleSource(slug)}
                />
              );
            })}
          </div>
          {!catalogLoading && !filteredCatalog.length ? <p className="pld-muted">No hay listas en el catálogo.</p> : null}
        </section>
      ) : (
        <section className="pld-card">
          {recommendedError ? <AmlBanner tone="error">{errorMessage(recommendedError)}</AmlBanner> : null}
          <div className="pld-source-grid">
            {recommended.map((item: AmlRecommendedListItem) => (
              <ListCard
                key={item.source_slug}
                code={item.source_slug}
                name={item.source_name}
                detail={item.rationale}
                selected={selectedSources.includes(item.source_slug)}
                disabled={!canPatch || saving}
                onToggle={() => toggleSource(item.source_slug)}
              />
            ))}
          </div>
          {!recommendedLoading && !recommended.length ? <p className="pld-muted">No hay recomendadas para México.</p> : null}
        </section>
      )}
    </section>
  );
}

export function PldAmlSelectedListsPanel() {
  const { catalog, recommended, selectedSources, toggleSource, saving, saveError, configError, configLoading, activeGroup } =
    useOrgListSelection();
  const catalogByCode = useMemo(() => new Map(catalog.map((item) => [listSlug(item), item])), [catalog]);
  const recommendedByCode = useMemo(() => new Map(recommended.map((item) => [item.source_slug, item])), [recommended]);
  const canPatch = Boolean(activeGroup?.id);

  return (
    <section className="mdc-section pld-stack">
      <header className="pld-head">
        <h2>Listas seleccionadas</h2>
        <p>Fuentes del grupo de validación de la organización. Un screening sin grupo queda vacío.</p>
      </header>

      <div className="pld-toolbar">
        <div className="pld-toolbar__meta">
          <GroupStatus group={activeGroup} loading={configLoading} />
          {saving ? <p className="pld-muted">Guardando selección…</p> : null}
        </div>
      </div>

      {configError ? <AmlBanner tone="error">{errorMessage(configError)}</AmlBanner> : null}
      {saveError ? <AmlBanner tone="error">{errorMessage(saveError)}</AmlBanner> : null}

      <section className="pld-card">
        <AmlTable
          columns={["Código", "Nombre", "Origen", ""]}
          rows={selectedSources.map((code) => {
            const fromCatalog = catalogByCode.get(code);
            const fromRecommended = recommendedByCode.get(code);
            return [
              code,
              fromCatalog?.name || fromRecommended?.source_name || code,
              fromRecommended ? "México" : fromCatalog ? "Catálogo" : activeGroup?.name || "Organización",
              <button
                key={code}
                type="button"
                className="mdc-btn mdc-btn--ghost mdc-btn--sm"
                onClick={() => toggleSource(code)}
                disabled={!canPatch || saving}
              >
                Quitar
              </button>,
            ];
          })}
          empty={
            canPatch
              ? "Aún no hay listas en el grupo. Elige fuentes en Listas."
              : "Sin grupo no hay listas seleccionadas que persistir."
          }
        />
      </section>
    </section>
  );
}
