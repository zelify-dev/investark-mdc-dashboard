"use client";

import { useCallback, useRef, type MouseEvent } from "react";

type TextField = HTMLInputElement | HTMLTextAreaElement;

type SelectionSnapshot = {
  el: TextField;
  start: number;
  end: number;
};

function isTextField(el: EventTarget | null): el is TextField {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

function snapshotActiveSelection(): SelectionSnapshot | null {
  const active = document.activeElement;
  if (!isTextField(active)) return null;
  return {
    el: active,
    start: active.selectionStart ?? 0,
    end: active.selectionEnd ?? 0,
  };
}

function restoreSelection(snapshot: SelectionSnapshot | null) {
  if (!snapshot) return;
  const { el, start, end } = snapshot;
  requestAnimationFrame(() => {
    if (!el.isConnected) return;
    el.focus({ preventScroll: true });
    try {
      el.setSelectionRange(start, end);
    } catch {
      /* ignore unsupported input types */
    }
  });
}

/**
 * Cierra el modal solo si mousedown y click ocurrieron en el backdrop.
 * Si el gesto empezó dentro (p. ej. seleccionar texto) y se suelta fuera:
 * no cierra y procura conservar la selección del input.
 */
export function useBackdropDismiss(onDismiss: () => void) {
  const pressedOnBackdrop = useRef(false);
  const selectionRef = useRef<SelectionSnapshot | null>(null);

  const onMouseDown = useCallback((event: MouseEvent<HTMLElement>) => {
    const onBackdrop = event.target === event.currentTarget;
    pressedOnBackdrop.current = onBackdrop;
    selectionRef.current = null;

    if (onBackdrop) {
      // Evita que el backdrop robe el foco del input al hacer clic afuera a propósito.
      event.preventDefault();
    }
  }, []);

  const onMouseUp = useCallback((event: MouseEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    if (pressedOnBackdrop.current) return;

    // Gesto empezó dentro: capturar selección antes de que el click la limpie.
    selectionRef.current = snapshotActiveSelection();
    event.preventDefault();
  }, []);

  const onClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (event.target !== event.currentTarget) {
        pressedOnBackdrop.current = false;
        return;
      }

      const shouldDismiss = pressedOnBackdrop.current;
      pressedOnBackdrop.current = false;

      if (shouldDismiss) {
        onDismiss();
        return;
      }

      // Soltó fuera tras seleccionar dentro: no cerrar y restaurar selección.
      event.preventDefault();
      event.stopPropagation();
      restoreSelection(selectionRef.current);
      selectionRef.current = null;
    },
    [onDismiss],
  );

  return { onMouseDown, onMouseUp, onClick };
}
