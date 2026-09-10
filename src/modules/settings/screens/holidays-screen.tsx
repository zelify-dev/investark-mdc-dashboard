"use client";

import { useState } from "react";

import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppCheckbox } from "@/components/ui/atoms/checkbox/app-checkbox";
import { SectionTitle } from "@/components/ui/atoms/section-title/section-title";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";

import "./holidays-screen.css";

const DAYS = [
  { id: "mon", label: "Monday" },
  { id: "tue", label: "Tuesday" },
  { id: "wed", label: "Wednesday" },
  { id: "thu", label: "Thursday" },
  { id: "fri", label: "Friday" },
  { id: "sat", label: "Saturday" },
  { id: "sun", label: "Sunday" },
] as const;

type HolidayRow = {
  id: string;
  description: string;
  date: string;
  recurring: string;
  numericId: string;
};

const INITIAL_HOLIDAYS: HolidayRow[] = [
  {
    id: "1",
    description: "Christmas",
    date: "25-12-2025",
    recurring: "Yes",
    numericId: "1138618716",
  },
];

export function HolidaysScreen() {
  const [nonWorking, setNonWorking] = useState<Record<string, boolean>>({
    mon: false,
    tue: false,
    wed: false,
    thu: false,
    fri: false,
    sat: true,
    sun: true,
  });

  const toggleDay = (id: string) => {
    setNonWorking((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="zelify-holidays">
      <div className="zelify-holidays__main">
        <section className="zelify-holidays__section" aria-labelledby="holidays-nwd-heading">
          <SectionTitle id="holidays-nwd-heading">Non Working Days</SectionTitle>
          <ul className="zelify-holidays__day-list">
            {DAYS.map((day) => (
              <li key={day.id} className="zelify-holidays__day-item">
                <AppCheckbox
                  id={`nwd-${day.id}`}
                  label={day.label}
                  checked={nonWorking[day.id]}
                  onChange={() => toggleDay(day.id)}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="zelify-holidays__section" aria-labelledby="holidays-gh-heading">
          <SectionTitle id="holidays-gh-heading">General Holidays</SectionTitle>
          <SettingsDataTable>
            <thead>
              <tr>
                <th>Description</th>
                <th className="is-lower">Date</th>
                <th className="is-lower">Recurring</th>
                <th className="is-lower">Id</th>
              </tr>
            </thead>
            <tbody>
              {INITIAL_HOLIDAYS.map((row) => (
                <tr key={row.id}>
                  <td>{row.description}</td>
                  <td>{row.date}</td>
                  <td>{row.recurring}</td>
                  <td className="is-numeric">{row.numericId}</td>
                </tr>
              ))}
            </tbody>
          </SettingsDataTable>
          <div className="zelify-holidays__add-row">
            <AppButton type="button" tone="secondary" className="zelify-holidays__add-btn">
              Add holiday
            </AppButton>
          </div>
        </section>

        <div className="zelify-holidays__warning" role="status">
          <span className="zelify-holidays__warning-icon" aria-hidden>
            !
          </span>
          <p>
            There are accounts in non-closed state that could be affected by your changes
          </p>
        </div>

        <div className="zelify-holidays__actions">
          <AppButton type="button" tone="primary" className="zelify-holidays__save">
            Save Changes
          </AppButton>
          <AppButton type="button" tone="secondary">
            Cancel
          </AppButton>
        </div>
      </div>
    </div>
  );
}
