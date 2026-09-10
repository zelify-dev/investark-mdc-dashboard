"use client";

import { type Customer } from "@/mocks/customers";
import { AppAvatar } from "@/components/ui/atoms/avatar/app-avatar";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";

import "./customer-profile.css";

type CustomerProfileHeaderProps = {
  customer: Customer;
};

export function CustomerProfileHeader({ customer }: CustomerProfileHeaderProps) {
  const getStatusType = (state: string) => {
    switch (state) {
      case "Active": return "success";
      case "In Arrears": return "error";
      case "Blacklisted": return "error";
      case "Pending Approval": return "warning";
      default: return "neutral";
    }
  };

  return (
    <header className="zelify-profile-header">
      <div className="zelify-profile-header__identity">
        <AppAvatar initials={customer.fullName.split(" ").map(n => n[0]).join("")} className="zelify-profile-header__avatar" />
        <div className="zelify-profile-header__meta">
          <h1 className="zelify-profile-header__name">{customer.fullName}</h1>
          <div className="zelify-profile-header__sub">
             <span className="zelify-mono zelify-profile-header__id">{customer.id}</span>
             <AppBadge tone={getStatusType(customer.state)} size="sm">
               {customer.state.toUpperCase()}
             </AppBadge>
          </div>
        </div>
      </div>
      
      <div className="zelify-profile-header__actions">
        <AppButton tone="secondary">Asignar tarea</AppButton>
        <AppButton tone="secondary">Más acciones</AppButton>
      </div>
    </header>
  );
}
