"use client";

import { useState } from "react";

import { AppInput } from "@/components/ui/atoms/input/app-input";
import { FieldLabel } from "@/components/ui/atoms/field-label/field-label";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import { FormField } from "@/components/ui/molecules/form-field/form-field";

import "./organization-details-screen.css";

export function OrganizationDetailsScreen() {
  const [institutionName, setInstitutionName] = useState("Zelify Core - Demo");
  const [street1, setStreet1] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [timeZone, setTimeZone] = useState("America/New_York");
  const [dateFormat, setDateFormat] = useState("dd-MM-yyyy");
  const [dateTimeFormat, setDateTimeFormat] = useState("dd-MM-yyyy HH:mm:ss");

  return (
    <div className="zelify-org-details">
      <form className="zelify-org-details__form" onSubmit={(e) => e.preventDefault()}>
        <FormField
          className="zelify-org-details__field--full"
          label={<FieldLabel htmlFor="org-institution">Institution Name</FieldLabel>}
          control={
            <AppInput
              id="org-institution"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              autoComplete="organization"
            />
          }
        />

        <FormField
          className="zelify-org-details__field--full"
          label={<FieldLabel htmlFor="org-street1">Street Address - Line 1</FieldLabel>}
          control={
            <AppInput
              id="org-street1"
              value={street1}
              onChange={(e) => setStreet1(e.target.value)}
              autoComplete="street-address"
            />
          }
        />

        <div className="zelify-org-details__grid">
          <FormField
            label={<FieldLabel htmlFor="org-city">City</FieldLabel>}
            control={
              <AppInput
                id="org-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
              />
            }
          />
          <FormField
            label={<FieldLabel htmlFor="org-region">State/Province/Region</FieldLabel>}
            control={
              <AppInput
                id="org-region"
                value={stateRegion}
                onChange={(e) => setStateRegion(e.target.value)}
                autoComplete="address-level1"
              />
            }
          />

          <FormField
            label={<FieldLabel htmlFor="org-zip">Zip Postal Code</FieldLabel>}
            control={
              <AppInput
                id="org-zip"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                autoComplete="postal-code"
              />
            }
          />
          <FormField
            label={<FieldLabel htmlFor="org-country">Country</FieldLabel>}
            control={
              <AppInput
                id="org-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                autoComplete="country-name"
              />
            }
          />

          <FormField
            label={<FieldLabel htmlFor="org-mobile">Mobile Phone</FieldLabel>}
            control={
              <AppInput
                id="org-mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                autoComplete="tel"
              />
            }
          />
          <FormField
            label={<FieldLabel htmlFor="org-email">Email</FieldLabel>}
            control={
              <AppInput
                id="org-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            }
          />

          <FormField
            label={<FieldLabel htmlFor="org-currency">Currency</FieldLabel>}
            control={
              <AppSelect id="org-currency" size="md" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="USD">US Dollar (USD)</option>
                <option value="GBP">British Pound (GBP)</option>
              </AppSelect>
            }
          />
          <FormField
            label={<FieldLabel htmlFor="org-tz">Time Zone</FieldLabel>}
            control={
              <AppSelect id="org-tz" size="md" value={timeZone} onChange={(e) => setTimeZone(e.target.value)}>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Europe/London">Europe/London</option>
              </AppSelect>
            }
          />

          <FormField
            label={
              <span className="zelify-form-field__label-row">
                <FieldLabel htmlFor="org-date-fmt">Local Date Format</FieldLabel>
                <button
                  type="button"
                  className="zelify-org-details__help"
                  aria-label="Ayuda sobre formato de fecha"
                  title="Formato local de fecha"
                >
                  <HelpIcon />
                </button>
              </span>
            }
            control={
              <AppInput
                id="org-date-fmt"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
              />
            }
          />
          <FormField
            label={
              <span className="zelify-form-field__label-row">
                <FieldLabel htmlFor="org-dt-fmt">Local Date/Time Format</FieldLabel>
                <button
                  type="button"
                  className="zelify-org-details__help"
                  aria-label="Ayuda sobre formato de fecha y hora"
                  title="Formato local de fecha y hora"
                >
                  <HelpIcon />
                </button>
              </span>
            }
            control={
              <AppInput
                id="org-dt-fmt"
                value={dateTimeFormat}
                onChange={(e) => setDateTimeFormat(e.target.value)}
              />
            }
          />
        </div>
      </form>
    </div>
  );
}

function HelpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M5.2 5.4c0-.7.6-1.2 1.4-1.2.9 0 1.4.5 1.4 1.1 0 .8-.4 1.1-.9 1.4-.4.3-.6.5-.6 1.1V9"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <circle cx="7" cy="10.2" r="0.55" fill="currentColor" />
    </svg>
  );
}
