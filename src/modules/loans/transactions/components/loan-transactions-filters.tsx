"use client";

import React from "react";
import { Search } from "lucide-react";

import "./loan-transactions-filters.css";

type LoanTransactionsFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  productId: string;
  onProductIdChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  productOptions: Array<{ id: string; name: string }>;
};

export const LoanTransactionsFilters: React.FC<LoanTransactionsFiltersProps> = ({
  query,
  onQueryChange,
  productId,
  onProductIdChange,
  status,
  onStatusChange,
  productOptions,
}) => {
  return (
    <div className="zelify-loan-tx-filters">
      <select className="zelify-loan-tx-filters__select" value={productId} onChange={(e) => onProductIdChange(e.target.value)}>
        <option value="all">Todos los productos</option>
        {productOptions.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>

      <select className="zelify-loan-tx-filters__select" value={status} onChange={(e) => onStatusChange(e.target.value)}>
        <option value="all">Todos los estados</option>
        <option value="ENTERED">Registrado</option>
        <option value="PENDING">Pendiente</option>
        <option value="REVERSED">Revertido</option>
      </select>

      <div className="zelify-loan-tx-filters__search">
        <Search size={18} className="zelify-loan-tx-filters__search-icon" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Buscar por transacción, cuenta o cliente..."
          className="zelify-loan-tx-filters__input"
        />
      </div>
    </div>
  );
};
