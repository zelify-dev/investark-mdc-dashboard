#!/usr/bin/env python3
"""Extrae párrafos e imágenes del Manual de usuario MDC (PDF)."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

try:
    import pymupdf as fitz
except ImportError:
    sys.stderr.write("Falta PyMuPDF. Instala con: python3 -m pip install pymupdf\n")
    raise

ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "docs/manuales/mdc-usuario/Manual_Usuario_MDC_Testafin.pdf"
IMAGES_DIR = ROOT / "public/manuales/mdc-usuario/imagenes"
JSON_PATH = ROOT / "src/modules/mdc/data/mdc-user-manual.json"

SKIP_LINES = {
    "mdc | manual de usuario",
    "aethereun | tulana finanzas",
    "manual de usuario",
}

TOP_LEVEL_RE = re.compile(
    r"^(1\.\s+Plataforma de acceso|2\.\s+Credenciales de acceso|3\.\s+Solicitud de crédito|"
    r"4\.\s+KYC\s+-\s+Validación.*|5\.\s+Carga documental|6\.\s+Reglas parametrizables|"
    r"7\.\s+Pagos y cobran\w*|8\.\s+Flujo general del proceso|9\.\s+Configuración)$",
    re.IGNORECASE,
)
SUBSECTION_RE = re.compile(r"^(\d+\.\d+)\s+(.+)$")
FIGURE_RE = re.compile(r"figura\s+(\d+)\.\s*(.*)$", re.IGNORECASE)
STEP_RE = re.compile(r"^paso\s+\d+\.", re.IGNORECASE)
HEADING_HINTS = (
    "url de produccion",
    "enlace de verificacion",
    "resultado del kyc",
    "estados de referencia",
    "flujo de reglas",
    "edicion de reglas",
    "desglose de reglas",
    "ejecucion de reglas",
    "pantalla de pagos",
    "pantalla de cobranza",
    "calendario de cuotas",
    "carga del archivo",
    "estructura del archivo",
    "lectura del resultado",
    "rutina recomendada",
    "situaciones financieras",
    "acceso a las pantallas",
    "proposito del modulo",
    "pagos",
    "configuracion de sucursales",
    "ubicacion en el sistema",
    "crear una nueva sucursal",
    "guardar una sucursal",
    "consideraciones",
    "ingreso manual",
    "seleccion mediante el mapa",
    "registro de ubicacion",
)


def is_noise(text: str) -> bool:
    compact = " ".join(text.split()).strip()
    if not compact:
        return True
    if compact.lower() in SKIP_LINES:
        return True
    if re.fullmatch(r"\d+", compact):
        return True
    if re.fullmatch(r"--\s*\d+\s+of\s+\d+\s*--", compact, re.IGNORECASE):
        return True
    if compact in {"\u200b", "​"}:
        return True
    return False


def slugify(value: str) -> str:
    ascii_map = str.maketrans("áéíóúñÁÉÍÓÚÑ", "aeiounAEIOUN")
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value.translate(ascii_map).lower()).strip("-")
    return cleaned or "seccion"


def extract_images(doc: fitz.Document) -> dict[int, list[dict]]:
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    by_page: dict[int, list[dict]] = {}
    seen_xrefs: set[int] = set()
    saved = 0

    for page_index, page in enumerate(doc, start=1):
        for img in page.get_images(full=True):
            xref = img[0]
            if xref in seen_xrefs:
                continue
            seen_xrefs.add(xref)
            info = doc.extract_image(xref)
            width = int(info.get("width") or 0)
            height = int(info.get("height") or 0)
            if width < 80 or height < 80:
                continue
            ext = info.get("ext") or "png"
            saved += 1
            filename = f"pagina-{page_index:02d}-img-{saved:02d}.{ext}"
            dest = IMAGES_DIR / filename
            dest.write_bytes(info["image"])
            entry = {
                "src": f"/manuales/mdc-usuario/imagenes/{filename}",
                "page": page_index,
                "width": width,
                "height": height,
            }
            by_page.setdefault(page_index, []).append(entry)

    return by_page


def extract_lines(doc: fitz.Document) -> list[tuple[int, str]]:
    lines: list[tuple[int, str]] = []
    for page_index, page in enumerate(doc, start=1):
        text = page.get_text("text") or ""
        for raw in text.splitlines():
            compact = " ".join(raw.split()).strip()
            if is_noise(compact):
                continue
            lines.append((page_index, compact))
    return lines


def is_heading(text: str) -> bool:
    if SUBSECTION_RE.match(text) or STEP_RE.match(text):
        return True
    folded = text.lower().rstrip(":")
    return folded in HEADING_HINTS


def flush_paragraph(current: dict | None, buffer: list[str]) -> None:
    if not current or not buffer:
        return
    text = " ".join(buffer).strip()
    buffer.clear()
    if text:
        current["blocks"].append({"type": "paragraph", "text": text})


def build_sections(lines: list[tuple[int, str]], images_by_page: dict[int, list[dict]]) -> list[dict]:
    sections: list[dict] = []
    current: dict | None = None
    used_images: set[str] = set()
    paragraph: list[str] = []
    seen_intro = False

    def start_section(title: str, page: int) -> dict:
        flush_paragraph(current, paragraph)
        section = {
            "id": slugify(title),
            "title": title,
            "page": page,
            "blocks": [],
        }
        sections.append(section)
        return section

    for page, text in lines:
        if TOP_LEVEL_RE.match(text):
            current = start_section(text, page)
            continue

        if current is None:
            if text.lower() == "manual de usuario":
                if seen_intro:
                    continue
                seen_intro = True
                current = start_section("Manual de usuario", page)
                continue
            current = start_section("Manual de usuario", page)

        figure_match = FIGURE_RE.match(text)
        if figure_match:
            flush_paragraph(current, paragraph)
            caption = f"Figura {figure_match.group(1)}. {figure_match.group(2).strip()}".strip()
            page_images = [img for img in images_by_page.get(page, []) if img["src"] not in used_images]
            image = page_images[0] if page_images else None
            if image:
                used_images.add(image["src"])
            current["blocks"].append({"type": "figure", "caption": caption, "src": image["src"] if image else None})
            continue

        if STEP_RE.match(text) or SUBSECTION_RE.match(text) or is_heading(text):
            flush_paragraph(current, paragraph)
            current["blocks"].append({"type": "heading" if not STEP_RE.match(text) else "step", "text": text})
            continue

        paragraph.append(text)

    flush_paragraph(current, paragraph)

    leftover = [
        img
        for page_images in images_by_page.values()
        for img in page_images
        if img["src"] not in used_images
    ]
    if leftover and sections:
        for img in leftover:
            sections[-1]["blocks"].append(
                {"type": "figure", "caption": f"Imagen de la página {img['page']}", "src": img["src"]}
            )

    return [section for section in sections if section["blocks"]]


def main() -> int:
    if not PDF_PATH.exists():
        sys.stderr.write(f"No se encontró el PDF: {PDF_PATH}\n")
        return 1

    doc = fitz.open(PDF_PATH)
    images_by_page = extract_images(doc)
    lines = extract_lines(doc)
    sections = build_sections(lines, images_by_page)
    payload = {
        "title": "Manual de usuario",
        "subtitle": "Motor MDC · Tulana Finanzas",
        "source": "docs/manuales/mdc-usuario/Manual_Usuario_MDC_Testafin.pdf",
        "sections": sections,
    }
    JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    JSON_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    image_count = sum(len(items) for items in images_by_page.values())
    print(f"Secciones: {len(sections)}")
    print(f"Imágenes: {image_count}")
    print(f"JSON: {JSON_PATH.relative_to(ROOT)}")
    print(f"Imágenes: {IMAGES_DIR.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
