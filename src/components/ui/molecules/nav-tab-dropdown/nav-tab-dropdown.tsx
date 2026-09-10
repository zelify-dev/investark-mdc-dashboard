"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import type { TopNavDropdownEntry } from "@/config/top-nav-dropdowns";

import "./nav-tab-dropdown.css";

type NavTabDropdownProps = {
  label: string;
  href: string;
  isActive?: boolean;
  entries: TopNavDropdownEntry[];
  /** Stable id for DOM/ARIA (e.g. top nav item id), independent of translated label. */
  instanceId: string;
};

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3.5 5.25 7 8.75l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NavTabDropdown({
  label,
  href,
  isActive = false,
  entries,
  instanceId,
}: NavTabDropdownProps) {
  const reactId = useId();
  const safeId = `topnav-dd-${instanceId}-${reactId.replace(/:/g, "")}`;
  const triggerId = `${safeId}-trigger`;
  const panelId = `${safeId}-panel`;

  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, minWidth: 260 });

  const updatePosition = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
    const minW = Math.max(220, Math.min(320, r.width, vw - 24));
    const maxLeft = Math.max(12, vw - minW - 12);
    setPos({
      top: r.bottom,
      left: Math.min(Math.max(12, r.left), maxLeft),
      minWidth: minW,
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updatePosition]);

  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => setOpen(false), 140);
  };

  const handleEnter = () => {
    cancelClose();
    updatePosition();
    setOpen(true);
  };

  const panel =
    mounted && open ? (
      <div
        id={panelId}
        className="zelify-nav-tab-dropdown__panel zelify-nav-tab-dropdown__panel--portal"
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          minWidth: pos.minWidth,
          zIndex: 1100,
        }}
        role="menu"
        aria-labelledby={triggerId}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        {entries.map((entry, index) =>
          entry.kind === "separator" ? (
            <div
              key={`sep-${index}`}
              className="zelify-nav-tab-dropdown__separator"
              role="separator"
            />
          ) : (
            <Link
              key={`${entry.label}-${index}`}
              href={entry.href}
              role="menuitem"
              className="zelify-nav-tab-dropdown__item"
              onClick={() => setOpen(false)}
            >
              {entry.label}
            </Link>
          )
        )}
      </div>
    ) : null;

  return (
    <>
      <div
        ref={rootRef}
        className={`zelify-nav-tab-dropdown ${open ? "is-open" : ""}`}
        onMouseEnter={handleEnter}
        onMouseLeave={scheduleClose}
      >
        <Link
          id={triggerId}
          href={href}
          className={`zelify-nav-tab zelify-nav-tab--with-menu ${isActive ? "is-active" : ""}`}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={panelId}
        >
          <span>{label}</span>
          <ChevronDownIcon />
        </Link>
      </div>
      {panel && typeof document !== "undefined" ? createPortal(panel, document.body) : null}
    </>
  );
}
