# Mambu Core Banking -> Demo Mock Mapping

Este documento deja trazabilidad funcional entre el demo y conceptos del core bancario de Mambu para que el mock sea consistente.

## 1) Entidades Core consideradas

- **Clients**: personas y empresas con estado KYC/operativo.
- **Deposit Accounts**: cuentas de ahorro/corriente/plazo con balance disponible y hold.
- **Loans**: préstamos por segmento (Consumo/PYME/Corporativo) con estados operativos.
- **Transactions**: movimientos de depósitos y desembolsos/pagos de préstamos.
- **GL / Accounting**: impacto contable por producto y transacción.

## 2) Estados modelados (alineación funcional)

- **Clientes**: `Active`, `Inactive`, `Pending Approval`, `Blacklisted`.
- **Depósitos**: `ACTIVE`, `PENDING_APPROVAL`, `LOCKED`, `CLOSED`.
- **Préstamos**: `PENDING_DISBURSEMENT`, `ACTIVE`, `RENEGOTIATED`, `IN_ARREARS`.

Estos estados siguen patrones comunes en core bancario y permiten demos de originación, control de riesgo y operación diaria.

## 3) Convenciones de datos para demo LATAM

- Moneda operativa por defecto: **USD**.
- Nombres, sucursales y casos de uso: **Latinoamérica** (Ecuador, Colombia, Perú, México, Caribe, Cono Sur).
- Mocks orientados a procesos reales: KYC, desembolso, mora, renegociación, hold de fondos.

## 4) Páginas/módulos priorizados por valor demo

- **Mantener**: Clientes, Grupos, Préstamos, Depósitos, Transacciones, Actividades, Productos, Contabilidad, Administración operativa.
- **Reducir ruido**: módulos administrativos no-core (formularios genéricos, apps, tareas internas, plantillas de comunicación) fuera del hub principal.

## 5) Siguiente capa recomendada

1. Consolidar datasets en una única fuente mock de "core banking".
2. Conectar reportes y contabilidad al mismo set (sin duplicar números por pantalla).
3. Añadir "simulador de eventos" (desembolso/pago/reverso) que muta estado en memoria para demos en vivo.
