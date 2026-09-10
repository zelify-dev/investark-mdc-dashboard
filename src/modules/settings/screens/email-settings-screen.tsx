"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { FieldLabel } from "@/components/ui/atoms/field-label/field-label";
import { AppSelect } from "@/components/ui/atoms/select/app-select";

import "./integration-gateway-settings-screen.css";

export function EmailSettingsScreen() {
  const [server, setServer] = useState("none");

  return (
    <div className="zelify-integration-gateway-settings">
      <div className="zelify-integration-gateway-settings__field">
        <div className="zelify-integration-gateway-settings__label-row">
          <FieldLabel htmlFor="email-server">Email Server</FieldLabel>
          <button
            type="button"
            className="zelify-integration-gateway-settings__help"
            aria-label="Ayuda: Email Server"
            title="Email Server"
          >
            <CircleHelp size={14} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <AppSelect
          id="email-server"
          size="md"
          value={server}
          onChange={(e) => setServer(e.target.value)}
          className="zelify-integration-gateway-settings__select"
        >
          <option value="none">None</option>
        </AppSelect>
      </div>

      <div className="zelify-integration-gateway-settings__divider" role="presentation" />

      <div className="zelify-integration-gateway-settings__actions">
        <AppButton type="button" tone="primary">
          Save Changes
        </AppButton>
        <AppButton type="button" tone="secondary">
          Cancel
        </AppButton>
      </div>
    </div>
  );
}
