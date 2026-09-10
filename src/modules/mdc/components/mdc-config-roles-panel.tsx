"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthError } from "@/lib/auth-api";
import {
  filterAssignableRoles,
  listAuthRoles,
  type AuthRole,
} from "@/lib/auth-dashboard";

export function MdcConfigRolesPanel() {
  const [roles, setRoles] = useState<AuthRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await listAuthRoles();
      setRoles(filterAssignableRoles(all));
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "No se pudieron cargar los roles.");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <article className="mdc-card">
      <div className="mdc-cfg-title-row">
        <div>
          <h3>Roles</h3>
          <p>Catálogo asignable por ORG_ADMIN (solo lectura).</p>
        </div>
        <button type="button" className="mdc-btn mdc-btn--xs" onClick={() => void load()} disabled={loading}>
          Actualizar
        </button>
      </div>
      {error && (
        <p style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>{error}</p>
      )}
      <div className="mdc-table-wrap">
        <table className="mdc-table mdc-cfg-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                  Cargando roles…
                </td>
              </tr>
            ) : roles.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                  No hay roles asignables (ORG_ADMIN, BUSINESS, DEVELOPER).
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id || role.code}>
                  <td>
                    <span className="mdc-badge mdc-badge--neutral">{role.code}</span>
                  </td>
                  <td>{role.name || role.code}</td>
                  <td>
                    {role.active === false || role.status === "DISABLED" ? (
                      <span className="mdc-badge mdc-badge--neutral">Inactivo</span>
                    ) : (
                      <span className="mdc-badge mdc-badge--ok">Activo</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
