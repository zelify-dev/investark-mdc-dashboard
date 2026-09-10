"use client";

import { useState, useEffect } from "react";
import { Eye, Settings2, X } from "lucide-react";
import { MDC_REQUESTS, type MdcRequest } from "@/modules/mdc/data/mdc-requests-mock";
import { resolveApplicantDisplayName } from "@/modules/mdc/data/mdc-credit-mock";
import { getStoredOrganization } from "@/lib/auth-api";
import { FinancialDocumentUploader } from "@/components/upload/FinancialDocumentUploader";
import { getMdcApiBaseUrl } from "@/modules/mdc/services/mdc-api-client";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value);
}

function StatusBadge({ status }: { status: MdcRequest["status"] }) {
  const colors: Record<string, string> = {
    "Revision manual": "bg-amber-100 text-amber-800",
    "Revision": "bg-amber-100 text-amber-800",
    "Aprobada": "bg-green-100 text-green-800",
    "Rechazada": "bg-red-100 text-red-800",
    "Override": "bg-purple-100 text-purple-800",
    "Pendiente": "bg-orange-100 text-orange-800",
  };
  return <span className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide ${colors[status] || ""}`}>{status}</span>;
}

function RiskBadge({ risk }: { risk: MdcRequest["risk"] }) {
  const colors: Record<string, string> = {
    "Bajo": "text-green-700 bg-green-50",
    "Medio": "text-orange-700 bg-orange-50",
    "Alto": "text-red-700 bg-red-50",
  };
  return <span className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide ${colors[risk.level] || ""}`}>{risk.level} - {risk.score}</span>;
}

function CreateRequestModal({ onClose }: { onClose: () => void }) {
  const [personType, setPersonType] = useState<"natural" | "moral">("natural");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [email, setEmail] = useState("");
  const [producto, setProducto] = useState("Credito automotriz");
  const [monto, setMonto] = useState("12000");

  return (
    <div className="mdc-modal-backdrop" onClick={onClose}>
      <div className="mdc-modal" onClick={e => e.stopPropagation()}>
        <header className="mdc-modal-head">
          <div>
            <p>Nueva solicitud</p>
            <h3>Alta manual</h3>
          </div>
          <button type="button" onClick={onClose} className="mdc-icon-btn" aria-label="Cerrar">
            <X size={16} />
          </button>
        </header>

        <div>
          <div className="flex bg-gray-100 p-1 rounded-lg mb-6 w-fit">
            <button
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${personType === "natural" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setPersonType("natural")}
            >
              Persona Física
            </button>
            <button
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${personType === "moral" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setPersonType("moral")}
            >
              Persona Moral
            </button>
          </div>

          <div className="grid grid-cols-2 gap-5 mb-5">
            {personType === "natural" ? (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Nombre</label>
                  <input type="text" className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={nombre} onChange={e => setNombre(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Apellido</label>
                  <input type="text" className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={apellido} onChange={e => setApellido(e.target.value)} />
                </div>
              </>
            ) : (
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Razón social</label>
                <input type="text" className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={razonSocial} onChange={e => setRazonSocial(e.target.value)} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email</label>
              <input type="email" className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Producto</label>
              <select className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white transition-colors" value={producto} onChange={e => setProducto(e.target.value)}>
                <option value="Credito automotriz">Credito automotriz</option>
                <option value="Credito personal">Credito personal</option>
              </select>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Monto</label>
            <input type="number" className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" value={monto} onChange={e => setMonto(e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm" onClick={onClose}>
              Cancelar
            </button>
            <button className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1c4ed8] rounded-lg hover:bg-blue-700 transition-colors shadow-sm" onClick={onClose}>
              Crear solicitud
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MdcRequestsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [productFilter, setProductFilter] = useState("Todos");
  const [riskFilter, setRiskFilter] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requests, setRequests] = useState<MdcRequest[]>(MDC_REQUESTS);
  
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [uploadUserId, setUploadUserId] = useState<string | null>(null);

  useEffect(() => {
    const handleClick = () => setActiveDropdownId(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const baseUrl = getMdcApiBaseUrl("http://localhost:3000");
        const currentOrg = getStoredOrganization();
        const orgId = currentOrg?.id || "ORG-001";
        
        if (orgId === "demo-bypass-org") {
          setRequests(MDC_REQUESTS);
          return;
        }

        const res = await fetch(`${baseUrl}/finance-requests?orgId=${orgId}`);
        if (res.ok) {
          const data = await res.json();
          const mapped: MdcRequest[] = data.map((item: any) => ({
            id: `APP-${item.id.split("-")[0].toUpperCase()}`,
            applicant: resolveApplicantDisplayName(item),
            email: item.email || 'N/A',
            product: item.product || 'N/A',
            amount: item.amount || 0,
            status: item.status || 'Pendiente',
            risk: {
              level: item.riskLevel || 'Medio',
              score: item.riskScore || 50
            },
            date: new Date(item.createdAt).toLocaleString('es-MX', {
              day: '2-digit', month: '2-digit', year: '2-digit',
              hour: 'numeric', minute: '2-digit', hour12: true
            })
          }));
          setRequests(mapped);
        }
      } catch (err) {
        console.error("Failed to load requests from API", err);
      }
    };
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter(req => {
    if (searchTerm && !req.applicant.toLowerCase().includes(searchTerm.toLowerCase()) && !req.email.toLowerCase().includes(searchTerm.toLowerCase()) && !req.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (statusFilter !== "Todos" && req.status !== statusFilter) return false;
    if (productFilter !== "Todos" && req.product !== productFilter) return false;
    if (riskFilter !== "Todos" && req.risk.level !== riskFilter) return false;
    return true;
  });

  return (
    <section className="mdc-section p-6 bg-white min-h-[80vh]">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1 text-[#1c2b4c]">Solicitudes</h2>
          <p className="text-sm text-gray-500 font-medium">Gestion y seguimiento del pipeline</p>
        </div>
        <button 
          className="bg-[#1c4ed8] text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
          onClick={() => setIsModalOpen(true)}
        >
          Agregar solicitud
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Buscar</label>
              <input
                type="text"
                placeholder="APP, cliente, email"
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Estado</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-colors appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="Todos">Todos</option>
                <option value="Aprobada">Aprobada</option>
                <option value="Rechazada">Rechazada</option>
                <option value="Revision manual">Revision manual</option>
                <option value="Override">Override</option>
                <option value="Pendiente">Pendiente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Producto</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-colors appearance-none"
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
              >
                <option value="Todos">Todos</option>
                <option value="Credito automotriz">Credito automotriz</option>
                <option value="Credito personal">Credito personal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Riesgo</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-colors appearance-none"
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
              >
                <option value="Todos">Todos</option>
                <option value="Bajo">Bajo</option>
                <option value="Medio">Medio</option>
                <option value="Alto">Alto</option>
              </select>
            </div>
          </div>
          <div className="bg-[#f8fafc] border border-gray-100 rounded-lg p-3 text-xs text-gray-500 font-medium">
            La fecha se toma del rango global del tablero para filtrar resultados de solicitudes (7 días).
          </div>
        </div>

        <div className="overflow-visible">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-gray-500 uppercase tracking-wider bg-white border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold">NO.</th>
                <th className="px-6 py-4 font-bold">SOLICITANTE</th>
                <th className="px-6 py-4 font-bold">EMAIL</th>
                <th className="px-6 py-4 font-bold">PRODUCTO</th>
                <th className="px-6 py-4 font-bold">MONTO</th>
                <th className="px-6 py-4 font-bold text-center">ESTADO</th>
                <th className="px-6 py-4 font-bold text-center">RIESGO</th>
                <th className="px-6 py-4 font-bold text-right">FECHA</th>
                <th className="px-6 py-4 font-bold text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">{req.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-medium">{req.applicant}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{req.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{req.product}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{formatCurrency(req.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <RiskBadge risk={req.risk} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs text-right font-medium">{req.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex justify-center items-center gap-1.5 relative">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md border border-transparent hover:border-blue-100 transition-all opacity-0 group-hover:opacity-100">
                        <Eye size={16} />
                      </button>
                      <button 
                        className={`p-1.5 rounded-md border transition-all ${activeDropdownId === req.id ? 'text-gray-700 bg-gray-100 border-gray-200' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 border-transparent hover:border-gray-200 opacity-0 group-hover:opacity-100'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId(activeDropdownId === req.id ? null : req.id);
                        }}
                      >
                        <Settings2 size={16} />
                      </button>
                      
                      {activeDropdownId === req.id && (
                        <div 
                          className="absolute right-0 bottom-full mb-1 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors">Ejecutar evaluacion</button>
                          <button className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors">Reenviar onboarding</button>
                          <button 
                            className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                            onClick={() => {
                              setUploadUserId(req.id);
                              setActiveDropdownId(null);
                            }}
                          >
                            Subir documentos
                          </button>
                          <button className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors">Ver flujo</button>
                          <button className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors">Eliminar</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isModalOpen && <CreateRequestModal onClose={() => setIsModalOpen(false)} />}
      
      {uploadUserId && (
        <FinancialDocumentUploader 
          userId={uploadUserId} 
          onClose={() => setUploadUserId(null)} 
        />
      )}
    </section>
  );
}
