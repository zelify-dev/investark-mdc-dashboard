"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import "./register-page.css";

type RegisterPayload = {
  fullName: string;
  email: string;
  country: string;
  company: string;
};

function validate(payload: RegisterPayload): string | null {
  if (!payload.fullName.trim()) return "Ingresa tu nombre completo.";
  if (!payload.email.includes("@")) return "Ingresa un correo valido.";
  if (!payload.country.trim()) return "Selecciona un pais.";
  if (!payload.company.trim()) return "Ingresa el nombre de la empresa.";
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<RegisterPayload>({
    fullName: "",
    email: "",
    country: "Ecuador",
    company: "",
  });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    setSubmitting(false);
    setSuccess("Solicitud enviada. Revisa tu correo para activar tu acceso demo.");

    setTimeout(() => router.push("/login"), 900);
  };

  return (
    <main className="zelify-register">
      <section className="zelify-register__card">
        <div className="zelify-register__header">
          <p className="zelify-register__eyebrow">Zelify Core Demo</p>
          <h1 className="zelify-register__title">Registro demo</h1>
        </div>
        <p className="zelify-register__subtitle">
          Crea acceso de prueba para operaciones core bancarias (LATAM, USD).
        </p>

        <form className="zelify-register__form" onSubmit={onSubmit}>
          <label className="zelify-register__field">
            Nombre completo
            <input
              className="zelify-register__input"
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="Ej: Camila Andrade"
            />
          </label>

          <label className="zelify-register__field">
            Correo
            <input
              className="zelify-register__input"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="nombre@empresa.com"
            />
          </label>

          <label className="zelify-register__field">
            Pais operativo
            <select
              className="zelify-register__input"
              value={form.country}
              onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
            >
              <option>Ecuador</option>
              <option>Colombia</option>
              <option>Peru</option>
              <option>Mexico</option>
              <option>Chile</option>
              <option>Republica Dominicana</option>
            </select>
          </label>

          <label className="zelify-register__field">
            Empresa
            <input
              className="zelify-register__input"
              value={form.company}
              onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
              placeholder="Ej: Finanzas Andinas S.A."
            />
          </label>

          {error ? <p className="zelify-register__feedback zelify-register__feedback--error">{error}</p> : null}
          {success ? <p className="zelify-register__feedback zelify-register__feedback--success">{success}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="zelify-register__submit"
          >
            {submitting ? "Enviando..." : "Crear acceso demo"}
          </button>
        </form>

        <p className="zelify-register__footer">
          Ya tienes acceso?{" "}
          <Link href="/login" className="zelify-register__login-link">
            Volver a iniciar sesion
          </Link>
        </p>
      </section>
    </main>
  );
}
