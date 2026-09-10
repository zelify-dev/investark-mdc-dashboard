"use client";

import { type Customer } from "@/mocks/customers";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";

type CustomerOverviewProps = {
  customer: Customer;
};

export function CustomerOverview({ customer }: CustomerOverviewProps) {
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const accountTypeLabel: Record<string, string> = {
    Loan: "Préstamo",
    Deposit: "Depósito",
    "Current Account": "Cuenta corriente",
    Savings: "Ahorros",
  };
  const accountStateLabel: Record<string, string> = {
    Active: "Activa",
    "In Arrears": "En mora",
    Closed: "Cerrada",
    Matured: "Vencida",
  };
  const clientTypeLabel: Record<string, string> = {
    Individual: "Individual",
    Corporate: "Empresa",
  };
  const customerStateLabel: Record<string, string> = {
    Active: "Activo",
    Inactive: "Inactivo",
    "In Arrears": "En mora",
    Blacklisted: "Lista negra",
    "Pending Approval": "Pendiente de aprobación",
  };
  const genderLabel: Record<string, string> = {
    Male: "Masculino",
    Female: "Femenino",
  };

  return (
    <div className="zelify-customer-overview">
      <section className="zelify-panel zelify-customer-overview__accounts">
        <div className="zelify-panel__header">
          <h2 className="zelify-panel__title">Resumen de cuentas</h2>
        </div>
        <SettingsDataTable variant="accounts">
          <thead>
            <tr>
              <th>Nombre de cuenta</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th className="is-numeric-header">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {customer.accounts.map((acc) => (
              <tr key={acc.id}>
                <td>
                  <div className="zelify-customer-overview__account-name">
                    <strong>{acc.name}</strong>
                    <span className="zelify-mono">{acc.id}</span>
                  </div>
                </td>
                <td>{accountTypeLabel[acc.type] ?? acc.type}</td>
                <td>
                  <AppBadge tone={acc.state === "In Arrears" ? "error" : "success"} size="sm">
                    {(accountStateLabel[acc.state] ?? acc.state).toUpperCase()}
                  </AppBadge>
                </td>
                <td className="is-numeric">{currency.format(acc.balance)}</td>
              </tr>
            ))}
            <tr className="is-total">
              <td colSpan={3}>
                <strong>Total</strong>
              </td>
              <td className="is-numeric">
                <strong>{currency.format(customer.totalBalance)}</strong>
              </td>
            </tr>
          </tbody>
        </SettingsDataTable>
      </section>

      <div className="zelify-customer-overview__info-grid">
        <section className="zelify-panel">
          <div className="zelify-panel__header">
            <h2 className="zelify-panel__title">General</h2>
          </div>
          <dl className="zelify-info-list">
            <div className="zelify-info-list__item">
              <dt>ID</dt>
              <dd className="zelify-mono">{customer.id}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Tipo de cliente</dt>
              <dd>{clientTypeLabel[customer.clientType] ?? customer.clientType}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Sucursal</dt>
              <dd>{customer.branch}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Centro</dt>
              <dd>{customer.assignedCentre}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Oficial de crédito</dt>
              <dd>{customer.creditOfficer}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Creado</dt>
              <dd>{customer.createdDate}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Estado</dt>
              <dd>{customerStateLabel[customer.state] ?? customer.state}</dd>
            </div>
          </dl>
        </section>

        <section className="zelify-panel">
          <div className="zelify-panel__header">
            <h2 className="zelify-panel__title">Personal y contacto</h2>
          </div>
          <dl className="zelify-info-list">
            <div className="zelify-info-list__group">Personal</div>
            <div className="zelify-info-list__item">
              <dt>Género</dt>
              <dd>{genderLabel[customer.personalInfo.gender] ?? customer.personalInfo.gender}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Fecha de nacimiento</dt>
              <dd>{customer.personalInfo.birthDate}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Idioma</dt>
              <dd>{customer.personalInfo.preferredLanguage}</dd>
            </div>
            <div className="zelify-info-list__group">Contacto</div>
            <div className="zelify-info-list__item">
              <dt>Teléfono</dt>
              <dd>{customer.phone}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Correo</dt>
              <dd>{customer.email}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Dirección</dt>
              <dd>{customer.personalInfo.address}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
