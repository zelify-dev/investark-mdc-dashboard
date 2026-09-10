# Módulo LIM + CORTEX · Guía de exposición

Documento para presentar el módulo completo en sesión comercial o técnica.

---

## Acceso rápido

| Item | Valor |
|------|-------|
| URL | `/lcc` |
| Login | `demo@zwippe.com` / `image.png` |
| Guía en pantalla | Botón **Guía de exposición** (16 pasos, arrastrable) |
| Reinicio | Botón **Reiniciar** |

---

## Qué demuestra este módulo

Zelify habilita **pricing y decisión de crédito fuera del Core**:

1. **Módulo A (CORTEX)** — cotización de crédito con descuentos cruzados y fijación de tasa.
2. **Módulo B (LIM)** — pricing de depósitos con TIIE, tres casos corporativos en paralelo y vista de tesorería.

El banco conserva gobierno: bandas, overrides, aprobaciones y auditoría completa.

---

## Estructura de pantallas

| Tab | Contenido |
|-----|-----------|
| Crédito · Admin | Plantilla AUTO-EV-01 |
| Crédito · Cotización | Origen de datos, cliente Core, IA, reglas, cross-sell paso a paso |
| Crédito · Auditoría | Trazabilidad de la cotización |
| Depósitos · Pricing | Tablas tier + 3 casos + recálculo TIIE |
| Depósitos · Tesorería | KPIs de cartera |
| Depósitos · Auditoría | Log de eventos LIM |

---

## Módulo A · Crédito (CORTEX)

### Fórmula

```
tasa_final = tasa_base − Σ(descuentos en pbs)
tasa_final ≥ banda_mínima
```

Cada descuento cruzado = **50 pbs** = **0.50%**.

### Caso único · AUTO-EV-01

| Campo | Valor |
|-------|-------|
| Cliente | CL-001 · Roberto Méndez García |
| Monto | $850,000 MXN |
| Plazo | 60 meses |
| Tasa base | 15.00% |
| Banda | 13% – 15% |

### Cálculo paso a paso

```
15.00%  tasa base
− 0.50% nómina activa     → 14.50%
− 0.50% TDC activa        → 14.00%
− 0.50% seguro auto       → 13.50%
− 0.50% inversión         → 13.00%  (piso de banda)
```

**Mensaje clave:** el ejecutivo cotiza en segundos; producto cambia reglas sin deploy al Core.

### De dónde vienen los datos

```
Core Banking  →  Data Layer  →  CORTEX
     │                │              │
 productos        contexto       motor + IA
 del cliente      unificado      de decisión
```

| Sistema | Qué aporta |
|---------|------------|
| Core Banking | Nómina, TDC, productos activos (real-time) |
| CRM | Segmento, relación comercial |
| Data Layer | Vista unificada del cliente CL-001 |
| CORTEX-Recommend v2 | Propensión cross-sell (82%) · sugiere seguro + inversión |

### Cómo entra la IA

El modelo **CORTEX-Recommend v2** analiza el perfil del cliente (nómina activa, sin productos de retención) y recomienda qué productos ofrecer en la conversación. No fija la tasa: la IA **prioriza la oferta**; el motor de reglas **calcula el descuento** (−50 pbs por producto).

### Cross-sell explicado (2 pasos en pantalla)

| Paso | Acción | Cálculo |
|------|--------|---------|
| 1 | Activa **Seguro auto** | 14.00% − 50 pbs = **13.50%** |
| 2 | Activa **Inversión patrimonial** | 13.50% − 50 pbs = **13.00%** (piso) |

En pantalla cada checkbox muestra la tasa resultante al instante.

### Pasos del tour (A1–A10)

| Paso | Pantalla | Qué decir |
|------|----------|-----------|
| A1 | Crédito · Admin | Plantilla AUTO-EV-01: 15%, banda 13–15%, sin deploy al Core. |
| A2 | Crédito · Cotización · Origen | Core → Data Layer → CORTEX: datos en tiempo real. |
| A3 | Crédito · Cotización · Cliente | CL-001 desde Core: nómina ✓, TDC ✓, $850K / 60 meses. |
| A4 | Crédito · Cotización · IA | CORTEX-Recommend v2: propensión 82%, sugiere seguro + inversión. |
| A5 | Crédito · Cotización · Reglas | Cascada automática: 15% − 100 pbs = 14.00%. |
| A6 | Crédito · Cotización · Oportunidades | 100 pbs pendientes; piso posible 13.00%. |
| A7 | Cross-sell paso 1 | Marca seguro auto → tasa baja a 13.50%. |
| A8 | Cross-sell paso 2 | Marca inversión → tasa baja a 13.00%. |
| A9 | Crédito · Cotización · Fijar | Tasa fija enviada al Core vía REST. |
| A10 | Crédito · Auditoría | Trazabilidad: datos, IA, reglas y cross-sell. |

---

## Módulo B · Depósitos (LIM)

### Fórmula

```
tasa_cliente = factor_TIIE × TIIE_vigente
```

Con override: `tasa_efectiva = max(tasa_tabla, tasa_mínima_acordada)`  
Con bonificación: `factor_ajustado = factor × (1 + bono)`

### TIIE inicial

**6.50%** (28 días)

---

### Los tres casos en pantalla (paralelos)

#### Caso 1 · Pricing estándar

| Campo | Valor |
|-------|-------|
| Cliente | PM-002 · Grupo Industrial del Norte |
| Saldo SPM | $50,000,000 |
| Tier | T2 PM (factor 30%) |
| **Tasa** | **6.50% × 30% = 3.15%** |

Tras recálculo TIIE a 9.50%: **2.85%**

#### Caso 2 · Tasa mínima VIP

| Campo | Valor |
|-------|-------|
| Cliente | PM-003 · Constructora VIP Estratégica |
| Saldo SPM | $120,000,000 |
| Tabla estándar | ~3.00% |
| Mínimo acordado | **3.50%** |
| **Tasa efectiva** | **3.50%** (override prevalece) |

#### Caso 3 · Bonificación incremental

| Campo | Valor |
|-------|-------|
| Cliente | PM-004 · Logística Express del Bajío |
| Incremental 30d | +$22.5M (> $20M umbral) |
| Bono | +5% sobre factor TIIE |
| Acción | Toggle activar/desactivar + notificación CRM |

**Mensaje clave:** los tres escenarios se ven juntos; no hay que cambiar de cliente en un dropdown.

### Pasos del tour (B1–B6)

| Paso | Pantalla | Qué decir |
|------|----------|-----------|
| B1 | Depósitos · Pricing | Tablas tier PM/PF, TIIE 6.50%. |
| B2 | Caso 1 (tarjeta) | Estándar: tier 2, 3.15%. |
| B3 | Recálculo TIIE | Bajar a 9.50% → Caso 1 pasa a 2.85%. |
| B4 | Caso 2 (tarjeta) | VIP: override 3.50%. |
| B5 | Caso 3 (tarjeta) | Bonificación por saldo incremental. |
| B6 | Depósitos · Tesorería | Cartera consolidada, NII, cobertura. |

---

## Flujo recomendado de exposición (~40 min)

1. **Intro** (3 min) — desacople del Core, gobierno del banco, trazabilidad.
2. **Módulo A** (22 min) — seguir guía A1→A10; enfatizar origen de datos, IA y cross-sell en 2 pasos.
3. **Módulo B** (15 min) — mostrar los **3 casos juntos**; ejecutar recálculo TIIE en Caso 1.
4. **Tesorería + cierre** (4 min) — vista consolidada y audit log.

---

## Tips para el presentador

- La tarjeta del tour es **arrastrable** (barra superior). Si tapa el área resaltada, muévela a un costado.
- Cada paso tiene **una sola línea** de instrucción; el detalle está en este documento.
- Usa **Reiniciar** antes de una segunda demo para volver al estado inicial.
- Los IDs internos llevan sufijo `-DEMO`; en pantalla se muestran como PM-002, CL-001, etc.

---

## Mensajes de cierre

1. **Velocidad** — reglas y pricing en vivo, sin ciclo de deploy.
2. **Control** — bandas, overrides VIP y aprobación de tesorería.
3. **Trazabilidad** — cada decisión queda en auditoría con usuario y timestamp.

---

*Zelify Core · Módulo LIM + CORTEX · 2026*
