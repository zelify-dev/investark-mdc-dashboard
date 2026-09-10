"use client";

import { useMemo, useState } from "react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { groupsService } from "../services/groups.service";
import { Group } from "../types/group.types";
import { GroupTable } from "../components/group-table";
import { useEffect } from "react";

import "@/components/ui/templates/workspace-page.css";
import "./groups-list-screen.css";

export function GroupsListScreen() {
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("all");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [viewGroup, setViewGroup] = useState<Group | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await groupsService.getGroups();
      setGroups(data);
      setLoading(false);
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    return groups.filter((g) => {
      if (query.trim() && !g.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (branch !== "all" && g.assignedBranch !== branch) return false;
      return true;
    });
  }, [groups, query, branch]);

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner">
          <h1 className="zelify-workspace-page__title">Empresas</h1>

          <div className="zelify-groups-toolbar">
            <div className="zelify-groups-toolbar__search-wrap">
              <label className="zelify-groups-toolbar__search-label" htmlFor="groups-search">
                Buscar empresa
              </label>
              <AppInput
                id="groups-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej: Comercializadora Maya"
              />
            </div>
            <select
              className="zelify-groups-toolbar__select"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            >
              <option value="all">Todas las sucursales</option>
              <option value="CDMX Reforma">CDMX Reforma</option>
              <option value="Guadalajara Centro">Guadalajara Centro</option>
              <option value="Monterrey Norte">Monterrey Norte</option>
            </select>
            <AppButton
              type="button"
              tone="primary"
              onClick={() => {
                setEditingGroup(null);
                setIsModalOpen(true);
              }}
            >
              Crear empresa
            </AppButton>
          </div>

          {loading ? (
            <div className="zelify-workspace-page__loading">
              <div className="zelify-workspace-page__spinner" aria-hidden />
              <span>Cargando empresas...</span>
            </div>
          ) : (
            <GroupTable
              groups={filtered}
              onViewGroup={(group) => setViewGroup(group)}
              onEditGroup={(group) => {
                setEditingGroup(group);
                setIsModalOpen(true);
              }}
              onDeleteGroup={(group) =>
                void (async () => {
                  await groupsService.deleteGroup(group.id);
                  setGroups((prev) => prev.filter((item) => item.id !== group.id));
                })()
              }
            />
          )}
        </div>
      </div>
      <CreateOrEditGroupModal
        open={isModalOpen}
        group={editingGroup}
        existingGroups={groups}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGroup(null);
        }}
        onSave={(group) => {
          void (async () => {
            const saved = await groupsService.saveGroup(group);
            setGroups((prev) => {
              const exists = prev.some((item) => item.id === saved.id);
              if (exists) {
                return prev.map((item) => (item.id === saved.id ? saved : item));
              }
              return [saved, ...prev];
            });
            setIsModalOpen(false);
            setEditingGroup(null);
          })();
        }}
      />
      <GroupDetailDrawer group={viewGroup} onClose={() => setViewGroup(null)} />
    </div>
  );
}

const GROUP_ROLE_NAMES = ["CEO", "Garante", "Representante legal", "Contador"];
const CLIENT_CATALOG = [
  { id: "CL-EC-1001", name: "María Fernanda Paredes" },
  { id: "746222560", name: "Andrea Molina" },
  { id: "CL-CO-1002", name: "Transportes del Pacífico S.A.S." },
  { id: "CL-PE-1003", name: "Luis Alberto Cárdenas" },
  { id: "CL-CL-1006", name: "Inversiones Cordillera Ltda." },
];

type GroupFormState = {
  id: string;
  name: string;
  groupType: Group["groupType"];
  state: Group["state"];
  kybStatus: NonNullable<Group["kybStatus"]>;
  members: Array<{
    id: string;
    name: string;
    roleName: string;
    kycStatus: "NOT_STARTED" | "PENDING" | "VERIFIED" | "REJECTED";
    amlStatus: "NOT_STARTED" | "CLEAR" | "REVIEW" | "BLOCKED";
  }>;
  assignedBranch: string;
  mobilePhone: string;
  email: string;
};

const EMPTY_FORM: GroupFormState = {
  id: "",
  name: "",
  groupType: "EMPRESA",
  state: "PENDING_APPROVAL",
  kybStatus: "NOT_STARTED",
  members: [],
  assignedBranch: "CDMX Reforma",
  mobilePhone: "",
  email: "",
};

type CreateOrEditGroupModalProps = {
  open: boolean;
  group: Group | null;
  existingGroups: Group[];
  onClose: () => void;
  onSave: (group: Group) => void;
};

function toFormState(group: Group | null): GroupFormState {
  if (!group) {
    return {
      ...EMPTY_FORM,
      id: `GRP-${Math.floor(100000 + Math.random() * 900000)}`,
    };
  }
  return {
    id: group.id,
    name: group.name,
    groupType: group.groupType || "EMPRESA",
    state: group.state,
    kybStatus: group.kybStatus ?? "NOT_STARTED",
    members: (group.members ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      roleName: m.roleName || "CEO",
      kycStatus: m.kycStatus ?? "NOT_STARTED",
      amlStatus: m.amlStatus ?? "NOT_STARTED",
    })),
    assignedBranch: group.assignedBranch || "CDMX Reforma",
    mobilePhone: group.mobilePhone ?? "",
    email: group.email ?? "",
  };
}

function CreateOrEditGroupModal({ open, group, existingGroups, onClose, onSave }: CreateOrEditGroupModalProps) {
  const [form, setForm] = useState<GroupFormState>(toFormState(group));
  const [memberQuery, setMemberQuery] = useState("");
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(toFormState(group));
      setMemberQuery("");
      setNewMemberId("");
      setNewMemberName("");
      setError(null);
    }
  }, [group, open]);

  if (!open) return null;

  const availableClients = CLIENT_CATALOG.filter(
    (client) =>
      !form.members.some((member) => member.id === client.id) &&
      (!memberQuery.trim() || client.name.toLowerCase().includes(memberQuery.toLowerCase()))
  );

  const addMember = (clientId: string) => {
    const client = CLIENT_CATALOG.find((item) => item.id === clientId);
    if (!client) return;
    setForm((prev) => ({
      ...prev,
      members: [
        ...prev.members,
        { id: client.id, name: client.name, roleName: "CEO", kycStatus: "NOT_STARTED", amlStatus: "NOT_STARTED" },
      ],
    }));
  };

  const addManualMember = () => {
    const id = newMemberId.trim();
    const name = newMemberName.trim();
    if (!id || !name) return;
    if (form.members.some((m) => m.id === id)) {
      setError("El ID del miembro ya existe en la empresa.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      members: [
        ...prev.members,
        { id, name, roleName: "CEO", kycStatus: "NOT_STARTED", amlStatus: "NOT_STARTED" },
      ],
    }));
    setNewMemberId("");
    setNewMemberName("");
  };

  const removeMember = (memberId: string) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.filter((member) => member.id !== memberId),
    }));
  };

  const save = () => {
    setError(null);
    if (!form.name.trim()) {
      setError("El nombre de la empresa es obligatorio.");
      return;
    }
    if (form.name.length > 255) {
      setError("El nombre de la empresa debe tener máximo 255 caracteres.");
      return;
    }
    const duplicatedId = existingGroups.some((item) => item.id === form.id && item.id !== group?.id);
    if (duplicatedId) {
      setError("El ID de la empresa debe ser único.");
      return;
    }

    const parsedGroup: Group = {
      id: form.id,
      name: form.name.trim(),
      groupType: form.groupType,
      kybStatus: form.kybStatus,
      assignedBranch: form.assignedBranch,
      createdAt: group?.createdAt ?? new Date().toISOString().slice(0, 10),
      state: form.state,
      membersCount: form.members.length,
      lastModified: new Date().toISOString().slice(0, 10),
      members: form.members,
      email: form.email,
      mobilePhone: form.mobilePhone,
    };
    onSave(parsedGroup);
  };

  return (
    <div className="zelify-groups-drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="zelify-groups-drawer" role="dialog" aria-modal="true">
        <header className="zelify-groups-drawer__head">
          <p>{group ? "Edición" : "Alta"}</p>
          <h3>{group ? "Editar grupo" : "Crear grupo"}</h3>
          <span>Perfil de empresa, miembros y compliance.</span>
        </header>

        <div className="zelify-workspace-page__stack">
          <div className="zelify-workspace-page__grid-2">
            <div className="zelify-workspace-page__col-main">
              <label className="zelify-groups-toolbar__search-label">Tipo de empresa</label>
              <AppSelect value={form.groupType} onChange={(e) => setForm((prev) => ({ ...prev, groupType: e.target.value }))}>
                <option value="EMPRESA">Empresa</option>
                <option value="SOLIDARIO">Solidario</option>
                <option value="MANCOMUNADO">Mancomunado</option>
              </AppSelect>

              <label className="zelify-groups-toolbar__search-label" style={{ marginTop: 12 }}>Nombre de empresa</label>
              <AppInput value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Ej: Comercializadora Maya S.A. de C.V." />

              <label className="zelify-groups-toolbar__search-label" style={{ marginTop: 8 }}>ID de empresa</label>
              <AppInput value={form.id} onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))} />

              <label className="zelify-groups-toolbar__search-label" style={{ marginTop: 12 }}>Miembros de la empresa</label>
              <AppInput value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)} placeholder="Buscar cliente individual..." />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginTop: 8 }}>
                <AppInput value={newMemberId} onChange={(e) => setNewMemberId(e.target.value)} placeholder="ID miembro (ej. CU-900001)" />
                <AppInput value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Nombre miembro" />
                <AppButton tone="secondary" onClick={addManualMember}>Crear miembro</AppButton>
              </div>
              <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                {availableClients.slice(0, 5).map((client) => (
                  <div key={client.id} style={{ display: "flex", justifyContent: "space-between", border: "1px solid #e2e8f0", borderRadius: 8, padding: 8 }}>
                    <span>{client.name}</span>
                    <AppButton tone="secondary" onClick={() => addMember(client.id)}>Agregar miembro</AppButton>
                  </div>
                ))}
              </div>

              <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 8 }}>
                {form.members.map((member) => (
                  <li key={member.id} style={{ display: "grid", gridTemplateColumns: "1fr 160px 140px 140px auto", gap: 8, alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 8, padding: 8 }}>
                    <span>{member.name}</span>
                    <AppSelect value={member.roleName} onChange={(e) => setForm((prev) => ({ ...prev, members: prev.members.map((m) => m.id === member.id ? { ...m, roleName: e.target.value } : m) }))}>
                      {GROUP_ROLE_NAMES.map((roleName) => <option key={roleName}>{roleName}</option>)}
                    </AppSelect>
                    <AppSelect value={member.kycStatus} onChange={(e) => setForm((prev) => ({ ...prev, members: prev.members.map((m) => m.id === member.id ? { ...m, kycStatus: e.target.value as typeof member.kycStatus } : m) }))}>
                      <option value="NOT_STARTED">KYC No iniciado</option>
                      <option value="PENDING">KYC Pendiente</option>
                      <option value="VERIFIED">KYC Verificado</option>
                      <option value="REJECTED">KYC Rechazado</option>
                    </AppSelect>
                    <AppSelect value={member.amlStatus} onChange={(e) => setForm((prev) => ({ ...prev, members: prev.members.map((m) => m.id === member.id ? { ...m, amlStatus: e.target.value as typeof member.amlStatus } : m) }))}>
                      <option value="NOT_STARTED">AML No iniciado</option>
                      <option value="CLEAR">AML Limpio</option>
                      <option value="REVIEW">AML Revisión</option>
                      <option value="BLOCKED">AML Bloqueado</option>
                    </AppSelect>
                    <AppButton tone="neutral" onClick={() => removeMember(member.id)}>Quitar</AppButton>
                  </li>
                ))}
              </ul>
            </div>

            <div className="zelify-workspace-page__col-side">
              <label className="zelify-groups-toolbar__search-label">Sucursal asignada</label>
              <AppSelect value={form.assignedBranch} onChange={(e) => setForm((prev) => ({ ...prev, assignedBranch: e.target.value }))}>
                <option>CDMX Reforma</option>
                <option>Guadalajara Centro</option>
                <option>Monterrey Norte</option>
              </AppSelect>
              <label className="zelify-groups-toolbar__search-label" style={{ marginTop: 10 }}>Estado KYB (opcional)</label>
              <AppSelect value={form.kybStatus} onChange={(e) => setForm((prev) => ({ ...prev, kybStatus: e.target.value as GroupFormState["kybStatus"] }))}>
                <option value="NOT_STARTED">No iniciado</option>
                <option value="PENDING">Pendiente</option>
                <option value="VERIFIED">Verificado</option>
                <option value="REJECTED">Rechazado</option>
              </AppSelect>

              <label className="zelify-groups-toolbar__search-label" style={{ marginTop: 10 }}>Contacto</label>
              <AppInput value={form.mobilePhone} onChange={(e) => setForm((prev) => ({ ...prev, mobilePhone: e.target.value }))} placeholder="Teléfono móvil" />
              <AppInput value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Correo de empresa" />
            </div>
          </div>
          {error ? <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p> : null}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <AppButton tone="secondary" onClick={onClose}>Cancelar</AppButton>
            <AppButton tone="primary" onClick={save}>{group ? "Guardar cambios" : "Crear empresa"}</AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupDetailDrawer({ group, onClose }: { group: Group | null; onClose: () => void }) {
  if (!group) return null;
  return (
    <>
      <div className="zelify-groups-drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()} />
      <aside className="zelify-groups-drawer" role="dialog" aria-modal="true">
        <h3>{group.name}</h3>
        <p>{group.groupType} · {group.id}</p>
        <ul>
          <li><strong>Sucursal</strong><span>{group.assignedBranch}</span></li>
          <li><strong>KYB</strong><span>{group.kybStatus ?? "Opcional"}</span></li>
          <li><strong>Miembros</strong><span>{group.membersCount}</span></li>
        </ul>
        <h4 style={{ marginTop: 12, marginBottom: 6 }}>Miembros de empresa</h4>
        <ul>
          {(group.members ?? []).map((member) => (
            <li key={member.id}><span>{member.name} ({member.roleName})</span><span>{member.id}</span></li>
          ))}
        </ul>
        <div style={{ marginTop: 12 }}>
          <AppButton tone="secondary" onClick={onClose}>Cerrar</AppButton>
        </div>
      </aside>
    </>
  );
}
