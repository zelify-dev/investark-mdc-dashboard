"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

import "./app-checkbox.css";

type AppCheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  className?: string;
};

export function AppCheckbox({ id, label, className, checked, onChange, ...props }: AppCheckboxProps) {
  return (
    <label className={["zelify-checkbox", className ?? ""].filter(Boolean).join(" ")} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className="zelify-checkbox__native"
        checked={checked}
        onChange={onChange}
        {...props}
      />
      <span className="zelify-checkbox__ui" aria-hidden />
      <span className="zelify-checkbox__text">{label}</span>
    </label>
  );
}
