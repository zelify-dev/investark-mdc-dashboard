"use client";

import { Plus, MoreHorizontal, X, Search, ChevronDown, Pencil, Trash2, Eye, Settings } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { naturalCreditRulesMock, type CreditRuleRow, type RuleOperator, type RuleDataType, type RuleSeverity } from "@/modules/mdc/data/mdc-rules-mock";
import { fetchRules, createRule, updateRule, deleteRule, fetchFinanceProducts } from "@/modules/mdc/services/mdc-rules.service";
import { getStoredOrganization } from "@/lib/auth-api";

// Helper functions for formatting
function formatOperator(op: RuleOperator) {
  switch (op) {
    case "gte": return "Mayor o igual (>=)";
    case "lte": return "Menor o igual (<=)";
    case "gt": return "Mayor que (>)";
    case "lt": return "Menor que (<)";
    case "equals": return "Igual (=)";
    case "between": return "Por bandas";
    case "contains": return "Contiene";
    default: return op;
  }
}

function formatDataType(type: RuleDataType) {
  switch (type) {
    case "number": return "Numero";
    case "percentage": return "Porcentaje";
    case "string": return "Texto";
    case "boolean": return "Booleano";
    case "date": return "Fecha";
    default: return type;
  }
}

export function MdcRulesTab({ mode }: { mode: "natural" | "moral" }) {
  const [rules, setRules] = useState<CreditRuleRow[]>([]);
  
  useEffect(() => {
    async function load() {
      const orgId = getStoredOrganization()?.id || "demo-bypass-org";
      if (orgId === "demo-bypass-org") {
        setRules(mode === "natural" ? naturalCreditRulesMock : moralCreditRulesMock);
        return;
      }
      const data = await fetchRules(mode, orgId);
      setRules(data);
    }
    load();
  }, [mode]);

  const orgId = getStoredOrganization()?.id || "demo-bypass-org";

  const [newRule, setNewRule] = useState<Partial<CreditRuleRow>>({
    name: "",
    products: [],
    field: "Edad del solicitante",
    evaluationMode: "single",
    operator: "gte",
    value: "",
    dataType: "number",
    severity: "warn",
    description: "",
    status: "active",
  });

  const [availableProducts, setAvailableProducts] = useState<{id: string, financialProduct: string}[]>([]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const products = await fetchFinanceProducts(orgId);
        if (Array.isArray(products)) {
          setAvailableProducts(products);
          if (products.length > 0) {
            setActiveProduct(products[0].financialProduct);
            setNewRule(prev => ({ ...prev, products: [products[0].financialProduct] }));
          }
        }
      } catch (err) {
        console.error("Failed to load products", err);
      }
    }
    loadProducts();
  }, [mode]);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeProduct, setActiveProduct] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [viewingRule, setViewingRule] = useState<CreditRuleRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const orgId = getStoredOrganization()?.id || "demo-bypass-org";
      await deleteRule(deleteTarget.id, orgId);
      setRules((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    } catch (err) {
      console.error("Error al eliminar regla:", err);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
      if (editingRuleId === deleteTarget?.id) {
        setIsModalOpen(false);
        setEditingRuleId(null);
      }
    }
  };

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.field.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProduct = r.products.includes(activeProduct as any);
      return matchesSearch && matchesProduct;
    });
  }, [rules, searchTerm, activeProduct]);

  return (
    <section className="mdc-section">
      <article className="mdc-card">
        <div className="mdc-card__head mdc-card__head--row">
          <div>
            <h3>Reglas y thresholds</h3>
            <p className="text-slate-500">Configuracion operativa del motor MDC</p>
          </div>
          <button type="button" className="mdc-btn mdc-btn--primary" onClick={() => {
            setEditingRuleId(null);
            setNewRule({
              name: activeProduct ? `Regla - ${activeProduct}` : "",
              products: activeProduct ? [activeProduct] : (orgId === "demo-bypass-org" ? ["Credito automotriz"] : (availableProducts.length > 0 ? [availableProducts[0].financialProduct] : [])),
              field: "Edad del solicitante",
              evaluationMode: "single",
              operator: "gte",
              value: "",
              dataType: "number",
              severity: "warn",
              description: "",
              status: "active",
            });
            setIsModalOpen(true);
          }}>
            Agregar regla
          </button>
        </div>

        <div className="p-4 space-y-4 border-b border-slate-200">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Producto activo</label>
            <div className="relative">
              <select 
                className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={activeProduct}
                onChange={(e) => setActiveProduct(e.target.value)}
              >
                {orgId === "demo-bypass-org" ? (
                  <option value="Credito automotriz">Credito automotriz</option>
                ) : availableProducts.length > 0 ? (
                  availableProducts.map(p => (
                    <option key={p.id} value={p.financialProduct}>{p.financialProduct}</option>
                  ))
                ) : (
                  <option value="" disabled>No hay productos disponibles</option>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Buscar regla</label>
            <input 
              type="text" 
              placeholder="nombre, campo o descripcion" 
              className="w-full h-10 px-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">NOMBRE</th>
                <th className="px-6 py-4 font-semibold">DESCRIPCIÓN</th>
                <th className="px-6 py-4 font-semibold text-center">OPERADOR</th>
                <th className="px-6 py-4 font-semibold text-center">VALOR</th>
                <th className="px-6 py-4 font-semibold text-center">TIPO</th>
                <th className="px-6 py-4 font-semibold text-center">SEVERIDAD</th>
                <th className="px-6 py-4 font-semibold text-center">ESTADO</th>
                <th className="px-6 py-4 font-semibold text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No hay reglas configuradas. Haz clic en "Agregar regla" para comenzar.
                  </td>
                </tr>
              ) : filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{rule.name}</td>
                  <td className="px-6 py-4 text-slate-600 max-w-xs leading-relaxed">{rule.description}</td>
                  <td className="px-6 py-4 text-center">
                    {rule.operator === "between" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Por bandas</span>
                    ) : (
                      <span className="text-slate-600">{formatOperator(rule.operator)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600">
                    {rule.operator === "between" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Por bandas</span>
                    ) : (
                      rule.value
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600">{formatDataType(rule.dataType)}</td>
                  <td className="px-6 py-4 text-center">
                    {rule.operator === "between" && rule.decisionBands ? (
                      <div className="flex gap-2 justify-center text-[10px] font-medium whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Aprob. ≤ {rule.decisionBands.approveMax}</span>
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700">Rev. {rule.decisionBands.reviewMin} - {rule.decisionBands.reviewMax}</span>
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700">Rech. ≥ {rule.decisionBands.rejectMin}</span>
                      </div>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rule.severity === "fail" ? "bg-rose-50 text-rose-700" :
                        rule.severity === "warn" ? "bg-amber-50 text-amber-700" :
                        "bg-emerald-50 text-emerald-700"
                      }`}>
                        {rule.severity === "fail" ? "Rechazo" : rule.severity === "warn" ? "Revision" : "Aprobacion"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                      Activa
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="mdc-actions">
                      <button 
                        type="button"
                        className="mdc-btn mdc-btn--xs mdc-btn--icon"
                        onClick={() => setViewingRule(rule)}
                        aria-label={`Visualizar regla ${rule.name}`}
                        title="Visualizar regla"
                      >
                        <Eye size={14} aria-hidden />
                      </button>
                      <details className="mdc-row-menu">
                        <summary
                          className="mdc-row-menu__summary-icon"
                          aria-label={`Opciones de ${rule.name}`}
                          title="Opciones"
                        >
                          <Settings size={14} aria-hidden />
                        </summary>
                        <div className="mdc-row-menu__items">
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingRuleId(rule.id);
                              setNewRule({
                                name: rule.name,
                                products: rule.products,
                                field: rule.field,
                                evaluationMode: (rule as any).evaluationMode,
                                operator: rule.operator,
                                value: rule.value,
                                dataType: rule.dataType,
                                severity: rule.severity,
                                description: rule.description,
                                status: rule.status,
                              });
                              setIsModalOpen(true);
                            }}
                          >
                            Configurar
                          </button>
                          <button 
                            type="button"
                            className="mdc-row-menu__danger"
                            onClick={() => {
                              setDeleteTarget({ id: rule.id, name: rule.name });
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </details>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRules.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    No se encontraron reglas para esta busqueda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      {/* Modal Nueva Regla */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 tracking-wider mb-1 uppercase">Regla de credito</p>
                <h2 className="text-xl font-bold text-slate-900">{editingRuleId ? "Editar regla" : "Nueva regla"}</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-5 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Nombre</label>
                  <input type="text" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} className="w-full h-10 px-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Producto activo</label>
                  <input 
                    type="text" 
                    value={activeProduct || newRule.products?.[0] || ""} 
                    disabled 
                    className="w-full h-10 px-3 border border-slate-200 bg-slate-100 text-slate-700 font-semibold rounded-md cursor-not-allowed" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Campo</label>
                  <div className="relative">
                    <select value={newRule.field} onChange={e => setNewRule({...newRule, field: e.target.value})} className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="Edad del solicitante">Edad del solicitante</option>
                      <option value="Edad al término del contrato">Edad al término del contrato</option>
                      <option value="Plazo solicitado">Plazo solicitado</option>
                      <option value="Monto solicitado">Monto solicitado</option>
                      <option value="Ingreso líquido promedio">Ingreso líquido promedio</option>
                      <option value="Líquido restante (Resguardo)">Líquido restante (Resguardo)</option>
                      <option value="Tipo de empleo">Tipo de empleo</option>
                      <option value="Score crediticio">Score crediticio</option>
                      <option value="Relacion deuda / ingreso (DTI)">Relacion deuda / ingreso (DTI)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Modo de evaluacion</label>
                  <div className="relative">
                    <select value={newRule.evaluationMode} onChange={e => setNewRule({...newRule, evaluationMode: e.target.value as any})} className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="single">Umbral unico</option>
                      <option value="bands">Por bandas</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Operador</label>
                  <div className="relative">
                    <select value={newRule.operator} onChange={e => setNewRule({...newRule, operator: e.target.value as any})} className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="gte">Mayor o igual (&gt;=)</option>
                      <option value="lte">Menor o igual (&lt;=)</option>
                      <option value="equals">Igual (=)</option>
                      <option value="between">Por bandas</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Valor</label>
                  <input type="text" value={newRule.value} onChange={e => setNewRule({...newRule, value: e.target.value})} className="w-full h-10 px-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Tipo</label>
                  <div className="relative">
                    <select value={newRule.dataType} onChange={e => setNewRule({...newRule, dataType: e.target.value as any})} className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="number">Numero</option>
                      <option value="percentage">Porcentaje</option>
                      <option value="string">Texto</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Severidad</label>
                  <div className="relative">
                    <select value={newRule.severity} onChange={e => setNewRule({...newRule, severity: e.target.value as any})} className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="warn">Revision</option>
                      <option value="fail">Rechazo</option>
                      <option value="pass">Aprobacion</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Descripcion</label>
                <textarea 
                  value={newRule.description} onChange={e => setNewRule({...newRule, description: e.target.value})}
                  className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Estado</label>
                <div className="relative">
                  <select value={newRule.status} onChange={e => setNewRule({...newRule, status: e.target.value as any})} className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 rounded-b-xl">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
                <button 
                  className="mdc-btn mdc-btn--primary"
                  onClick={async () => {
                    const currentOrgId = getStoredOrganization()?.id || "demo-bypass-org";
                    const payload = {
                      ...newRule, 
                      products: newRule.products?.length ? newRule.products : currentOrgId === "demo-bypass-org" ? ["Credito automotriz"] : availableProducts.length > 0 ? [availableProducts[0].financialProduct] : [], 
                      individualPerson: mode === "natural",
                      legalEntity: mode === "moral"
                    } as any;
                    
                    if (editingRuleId) {
                      const updated = await updateRule(editingRuleId, payload, currentOrgId);
                      if (updated) {
                        setRules(rules.map(r => r.id === editingRuleId ? updated : r));
                      }
                    } else {
                      const created = await createRule(payload, currentOrgId);
                      if (created) {
                         setRules([created, ...rules]);
                      }
                    }
                    setIsModalOpen(false);
                  }}
                >
                  {editingRuleId ? "Actualizar" : "Guardar"}
                </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mb-4 text-rose-600">
              <Trash2 className="w-7 h-7 stroke-[1.75]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Eliminar regla</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              ¿Estás seguro de que deseas eliminar la regla <strong className="text-slate-800 font-semibold">"{deleteTarget.name}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center gap-3 w-full justify-end">
              <button
                type="button"
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 text-white font-medium text-sm hover:bg-rose-700 shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setViewingRule(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Visualización de regla de crédito
                </p>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{viewingRule.name}</h3>
              </div>
              <button 
                onClick={() => setViewingRule(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs font-semibold text-slate-500 uppercase block">Producto</span>
                  <strong className="text-sm text-slate-800 font-semibold mt-1 block">{viewingRule.products?.[0] || "Todos"}</strong>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs font-semibold text-slate-500 uppercase block">Estado</span>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                    {viewingRule.status === "inactive" ? "Inactiva" : "Activa"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs font-semibold text-slate-500 uppercase block">Campo evaluado</span>
                  <strong className="text-sm text-slate-800 font-semibold mt-1 block">{viewingRule.field}</strong>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs font-semibold text-slate-500 uppercase block">Operador y Valor</span>
                  <strong className="text-sm text-slate-800 font-semibold mt-1 block">{formatOperator(viewingRule.operator)} {viewingRule.value}</strong>
                </div>
              </div>
              {viewingRule.description && (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <span className="text-xs font-semibold text-slate-500 uppercase block">Descripción</span>
                  <p className="text-sm text-slate-700 mt-1">{viewingRule.description}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                onClick={() => setViewingRule(null)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="mdc-btn mdc-btn--primary"
                onClick={() => {
                  const rule = viewingRule;
                  setViewingRule(null);
                  setEditingRuleId(rule.id);
                  setNewRule({
                    name: rule.name,
                    products: rule.products,
                    field: rule.field,
                    evaluationMode: (rule as any).evaluationMode,
                    operator: rule.operator,
                    value: rule.value,
                    dataType: rule.dataType,
                    severity: rule.severity,
                    description: rule.description,
                    status: rule.status,
                  });
                  setIsModalOpen(true);
                }}
              >
                Configurar regla
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
