# Guion de exposición · Scotiabank México

Documento interno Zelify para la sesión con Scotiabank. Alineado con la guía interactiva en pantalla (12 pasos).

**Acceso:** `/lcc` → botón **Guía de exposición**  
**Duración estimada:** 35–45 minutos  
**Orden:** Módulo A (Crédito) → Módulo B (Depósitos)

---

## Introducción (2 min)

> Scotiabank conserva el gobierno sobre guardrails, modelos y decisiones finales. Zelify habilita la capa de decisión **fuera del Core**: parametrización en vivo, cotización en tiempo real y trazabilidad completa.

Principios a enfatizar:
- **Desacople del Core** — pricing y reglas fuera del sistema de registro
- **Flexibilidad paramétrica** — cambios sin despliegue a TI
- **Gobierno del banco** — audit log, overrides y aprobaciones

---

## Módulo A · Motor de Decisión de Crédito (CORTEX)

### Fórmula base

```
tasa_final = tasa_base − Σ(descuentos en pbs)
tasa_final ≥ banda_mínima (piso)
tasa_final ≤ banda_máxima (techo)
```

Cada descuento cruzado = **50 puntos base (pbs)** = **0.50%** sobre la tasa anual.

---

### Paso 1 · Administración de producto
**Pantalla:** Crédito · Admin  
**Tiempo:** 3 min

**Qué decir:**
> Un usuario de producto configura la plantilla AUTO-EV-01 desde consola. Tasa base 15%, banda 13%–15%, plazos de 12 a 60 meses y montos hasta $2.5 millones. El cambio queda disponible de inmediato para cotización.

**Mostrar en pantalla:**
- Producto AUTO-EV-01
- Tasa base 15.00%
- Banda 13% – 15%
- Comisión apertura 1.50%

**Acción:** Guardar plantilla.

---

### Paso 2 · Cotización frontline
**Pantalla:** Crédito · Cotización  
**Tiempo:** 3 min

**Qué decir:**
> El ejecutivo ingresa al cliente Roberto Méndez (CL-001). El motor recibe el contexto de productos desde el Core: nómina activa, tarjeta de crédito activa, sin seguro auto ni inversión patrimonial.

**Datos del caso:**
| Campo | Valor |
|-------|-------|
| Cliente | CL-001 · Roberto Méndez García |
| Monto | $850,000 MXN |
| Plazo | 60 meses |
| Nómina | ✓ Activa |
| TDC | ✓ Activa |
| Seguro / Inversión | ✗ No |

---

### Paso 3 · Evaluación del motor
**Pantalla:** Crédito · Cotización → Descuentos aplicados  
**Tiempo:** 4 min

**Qué decir:**
> El motor parte de la tasa base y aplica la cascada de descuentos cruzados.

**Cálculo en voz alta:**
```
Tasa base:                    15.00%
− Nómina Scotiabank (50 pbs):  14.50%
− TDC activa (50 pbs):         14.00%  ← tasa cotizada
```

**Potencial adicional (mostrar en pantalla):**
- Seguro auto aliado: −50 pbs → llegaría a 13.50%
- Inversión patrimonial: −50 pbs → llegaría a 13.00%

---

### Paso 4 · Cross-sell
**Pantalla:** Crédito · Cotización → Productos adicionales  
**Tiempo:** 3 min

**Qué decir:**
> El cliente acepta contratar seguro auto e inversión. El motor recalcula en tiempo real.

**Cálculo:**
```
15.00% − 200 pbs (4 descuentos) = 13.00%
Piso de banda: 13.00% → se respeta el mínimo configurado
```

**Acción:** Activar ambos checkboxes de productos adicionales.

---

### Paso 5 · Cotización fijada
**Pantalla:** Crédito · Cotización → Confirmar  
**Tiempo:** 2 min

**Qué decir:**
> Una vez aceptada, la tasa queda **fija por los 60 meses** del crédito. La cotización se envía al Core para alta del contrato vía API REST.

**Acción:** Clic en **Fijar y enviar al Core**.

**Resultado:** Tasa 13.00% inmutable · contrato listo para registro.

---

### Paso 6 · Auditoría de crédito
**Pantalla:** Crédito · Auditoría  
**Tiempo:** 2 min

**Qué decir:**
> Cada decisión queda registrada: reglas evaluadas, descuentos en pbs, canal, usuario y timestamp. Gobierno conservado por Scotiabank.

**Mostrar:** Últimas entradas del audit log (QUOTE, CROSS_SELL, FIX_QUOTE).

---

## Módulo B · LIM · Pricing de Depósitos

### Fórmula base

```
tasa_cliente = factor_TIIE × TIIE_vigente
```

Donde:
- **TIIE_vigente** = TIIE 28 días (referencia Banxico)
- **factor_TIIE** = porcentaje definido en la tabla tier según saldo promedio y tipo de persona (PM/PF)

**Overrides:**
```
Si tasa_calculada < cap_min  →  tasa_cliente = cap_min
Si tasa_calculada > cap_max  →  tasa_cliente = cap_max
```

**Bonificación condicional:**
```
factor_efectivo = factor_tier + bono_adicional (ej. +5%)
```

---

### Paso 7 · Configuración LIM
**Pantalla:** Depósitos · Pricing → Tablas tier  
**Tiempo:** 4 min

**Qué decir:**
> La consola LIM muestra las tablas tier para Persona Moral (5 niveles) y Persona Física (4 niveles). La TIIE 28d vigente es 6.50%. Cualquier cambio en un tier se aplica al siguiente ciclo de evaluación de saldo promedio.

**Mostrar:**
- TIIE 28d: **6.50%**
- Tabla PM: Tier 2 = factor 30% para saldos $10M – $100M
- Tabla PF: factores 20%, 30%, 50%, 90%

---

### Paso 8 · Cliente corporativo
**Pantalla:** Depósitos · Pricing → Tasa por cliente  
**Tiempo:** 3 min

**Qué decir:**
> Seleccionamos Grupo Industrial del Norte. Su saldo promedio mensual (SPM, 3 meses) es $50 millones.

**Cálculo:**
```
SPM = $50,000,000  →  Tier 2 PM  →  factor 30%
Tasa = 6.50% × 30% = 3.15%
```

**Acción:** Seleccionar cliente en el dropdown (o avanzar guía).

---

### Paso 9 · Recálculo por TIIE
**Pantalla:** Depósitos · Pricing → Recálculo por TIIE  
**Tiempo:** 4 min

**Qué decir:**
> Simulamos que la TIIE baja de 6.50% a 9.50%. El motor recalcula automáticamente toda la cartera — hoy esto es trabajo manual en muchos bancos.

**Cálculo:**
```
Antes:  6.50% × 30% = 3.15%
Después: 9.50% × 30% = 2.85%
```

**Acción:** Clic en **Aplicar TIIE 9.50%**.  
**Mostrar:** Panel Antes/Después con timestamp.

---

### Paso 10 · Override VIP
**Pantalla:** Depósitos · Pricing → Constructora VIP  
**Tiempo:** 3 min

**Qué decir:**
> Para relaciones estratégicas, el gestor puede fijar una tasa mínima acordada que prevalece sobre la tabla estándar.

**Caso:**
```
Tabla estándar (SPM $120M, Tier 2): ~3.00%
Tasa mínima acordada (cap_min):     3.50%  ← prevalece
```

**Acción:** Seleccionar Constructora VIP Estratégica en el dropdown.

---

### Paso 11 · Bonificación condicional
**Pantalla:** Depósitos · Pricing → Logística Express  
**Tiempo:** 3 min

**Qué decir:**
> Cuando un cliente trae saldo incremental significativo, una regla parametrizable aplica un bono adicional sobre el factor TIIE. El CRM recibe notificación.

**Caso:**
```
Condición: saldo incremental > $20M en 30 días
Incremental detectado: $22,500,000
Bono: +5% sobre factor TIIE
```

**Acción:** Seleccionar Logística Express del Bajío · verificar bonificación activa.

---

### Paso 12 · Tesorería
**Pantalla:** Depósitos · Tesorería  
**Tiempo:** 4 min

**Qué decir:**
> Tesorería tiene visión consolidada: saldo por tier, NII proyectado, cobertura por moneda y alertas operativas — todo actualizado tras el recálculo de TIIE.

**Mostrar:**
- KPIs: Saldo total, NII anual, TIIE vigente
- Tabla por tier
- Lista de clientes con tasas actuales
- Alertas (si hay cambios pendientes de aprobación)

---

## Cierre (2 min)

> Resumimos tres capacidades evidenciadas hoy:
> 1. **Crédito** — pricing dinámico con cross-sell, tasa fija y auditoría (CORTEX)
> 2. **Depósitos** — pricing referenciado a TIIE, recálculo automático, overrides y bonificaciones (LIM)
> 3. **Gobierno** — Scotiabank decide; Zelify habilita con trazabilidad completa

**Preguntas abiertas para el sponsor (referencia §12 del alcance):**
- Confirmar TIIE 28d vs 91d como referencia
- Validar rangos exactos tier PM/PF
- Profundidad deseada en onboarding PM

---

## Referencia rápida · Pantallas

| Paso | Tab en `/lcc` |
|------|----------------|
| 1 | Crédito · Admin |
| 2–5 | Crédito · Cotización |
| 6 | Crédito · Auditoría |
| 7–11 | Depósitos · Pricing |
| 12 | Depósitos · Tesorería |

## Referencia rápida · Fórmulas

| Concepto | Fórmula |
|----------|---------|
| Tasa crédito | `tasa_base − Σ(pbs × 0.01%)` con piso/techo de banda |
| Tasa depósito | `factor_TIIE × TIIE_vigente` |
| Recálculo TIIE | Misma fórmula · nueva TIIE · mismo factor tier |
| Override | `max(tasa_calculada, cap_min)` o `min(tasa_calculada, cap_max)` |
| Bonificación | `factor_efectivo = factor_tier + bono` |
