"use client";

import { useEffect, useState, type DragEvent } from "react";

type LogoUploadZoneProps = {
  label: string;
  description: string;
  url?: string | null;
  pendingFile?: File | null;
  disabled?: boolean;
  onFileSelect: (file: File) => void;
};

export function LogoUploadZone({
  label,
  description,
  url,
  pendingFile,
  disabled,
  onFileSelect,
}: LogoUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingFile) {
      setLocalPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(pendingFile);
    setLocalPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [pendingFile]);

  const displayUrl = localPreview || url || null;

  const handleDrag = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    setIsDragActive(event.type === "dragenter" || event.type === "dragover");
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`mdc-logo-zone${isDragActive ? " mdc-logo-zone--active" : ""}${disabled ? " mdc-logo-zone--disabled" : ""}`}
    >
      <div className="mdc-logo-zone__copy">
        <p className="mdc-logo-zone__label">{label}</p>
        <p className="mdc-logo-zone__desc">{description}</p>
      </div>

      <div className="mdc-logo-zone__checker">
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt={label} />
        ) : (
          <span>Sin archivo cargado</span>
        )}
      </div>

      <label className="mdc-logo-zone__pick">
        <span>Seleccionar archivo</span>
        <input
          type="file"
          accept="image/png,.png"
          disabled={disabled}
          className="mdc-logo-zone__input"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFileSelect(file);
            event.currentTarget.value = "";
          }}
        />
      </label>

      {pendingFile ? <small className="mdc-logo-zone__pending">Pendiente: {pendingFile.name}</small> : null}
    </div>
  );
}
