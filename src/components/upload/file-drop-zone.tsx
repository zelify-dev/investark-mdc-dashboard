"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";

type FileDropZoneProps = {
  accept?: string;
  disabled?: boolean;
  className?: string;
  activeClassName?: string;
  onFile: (file: File) => void;
  onInvalidFile?: (file: File) => void;
  children: ReactNode;
};

function tokensFromAccept(accept?: string) {
  return (accept ?? "")
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

export function fileMatchesAccept(file: File, accept?: string) {
  const tokens = tokensFromAccept(accept);
  if (tokens.length === 0) return true;

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return tokens.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token);
    if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
    if (token.includes("/")) return type === token;
    return name.endsWith(`.${token}`);
  });
}

export function FileDropZone({
  accept,
  disabled,
  className = "",
  activeClassName = "ring-2 ring-[#000016]/15 bg-white",
  onFile,
  onInvalidFile,
  children,
}: FileDropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const dragDepth = useRef(0);

  const resetDrag = () => {
    dragDepth.current = 0;
    setIsDragActive(false);
  };

  const onDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    dragDepth.current += 1;
    setIsDragActive(true);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    event.dataTransfer.dropEffect = "copy";
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragActive(false);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    resetDrag();
    if (disabled) return;

    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    if (!fileMatchesAccept(file, accept)) {
      onInvalidFile?.(file);
      return;
    }
    onFile(file);
  };

  return (
    <div
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      data-drop-active={isDragActive ? "true" : "false"}
      className={`${className} ${isDragActive && !disabled ? activeClassName : ""}`.trim()}
    >
      {children}
    </div>
  );
}
