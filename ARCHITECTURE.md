# Architecture

Guia oficial para la estructura de carpetas, reglas de organizacion y limites de importacion en `zelify-core`.

Este documento existe para que un equipo de 4 a 5 personas pueda trabajar en paralelo con una estructura clara, predecible y facil de leer.

## Regla de tipografia


La tipografia oficial del producto es `Nata Sans`.

Reglas:

- toda la aplicacion debe usar `Nata Sans` como fuente principal
- no introducir nuevas familias tipograficas sin una decision explicita de producto o branding
- componentes nuevos deben heredar la fuente global, no redefinir otra familia localmente

## Objetivo

La arquitectura del repo sigue estas ideas:

- `app/` contiene rutas, layouts y entrypoints de Next.js.
- `modules/` contiene el dominio funcional del core bancario.
- `components/ui/` contiene el sistema visual reusable con enfoque de atomic design.
- `components/common/` contiene piezas compartidas de aplicacion que no pertenecen a un modulo puntual.
- cada modulo debe ser entendible por si solo.
- la estructura debe permitir trabajo paralelo sin conflictos innecesarios.

## Estructura objetivo

```text
src/
  app/
    (public)/
    (auth)/
    (workspace)/
    api/
    globals.css
    layout.tsx

  modules/
    auth/
    customers/
    accounts/
    products/
    ledger/
    transactions/
    payments/
    treasury/
    compliance/
    reports/
    settings/

  components/
    ui/
      atoms/
      molecules/
      organisms/
      templates/
    common/
      guards/
      navigation/
      feedback/
      forms/
      tables/
      charts/

  providers/
  lib/
  config/
  styles/
  types/
  utils/
  assets/
```

## Estructura de rutas

La carpeta `src/app` existe solo para routing y composicion de layouts.

Ejemplo recomendado:

```text
src/app/
  (public)/
    page.tsx

  (auth)/
    layout.tsx
    login/
      page.tsx
    recovery/
      page.tsx

  (workspace)/
    layout.tsx
    dashboard/
      page.tsx
    customers/
      page.tsx
      [customerId]/
        page.tsx
    accounts/
      page.tsx
      [accountId]/
        page.tsx
    ledger/
      page.tsx
      entries/
        page.tsx
      chart-of-accounts/
        page.tsx
    transactions/
      page.tsx
      transfers/
        page.tsx
      deposits/
        page.tsx
      withdrawals/
        page.tsx
    payments/
      page.tsx
      batches/
        page.tsx
    compliance/
      page.tsx
      kyc/
        page.tsx
      aml/
        page.tsx
    reports/
      page.tsx
    settings/
      page.tsx
      users/
        page.tsx
      roles/
        page.tsx

  api/
    health/
      route.ts
```

## Estructura de modulos

Cada modulo representa una capacidad del negocio. La forma interna debe ser consistente entre modulos.

Ejemplo:

```text
src/modules/customers/
  components/
    customer-table.tsx
    customer-summary-card.tsx
  screens/
    customers-list-screen.tsx
    customer-detail-screen.tsx
  services/
    customers.service.ts
  hooks/
    use-customers-filters.ts
  schemas/
    customer.schema.ts
  types/
    customer.types.ts
  constants/
    customer.constants.ts
```

Estructura base recomendada para cualquier modulo:

```text
src/modules/<module-name>/
  components/
  screens/
  services/
  hooks/
  schemas/
  types/
  constants/
```

## Estructura de UI

La carpeta `src/components/ui` aplica atomic design, pero solo para piezas de sistema visual reusable.

```text
src/components/ui/
  atoms/
    button/
      app-button.tsx
    input/
      app-input.tsx
    text/
      app-text.tsx
    badge/
      status-badge.tsx

  molecules/
    form-field/
      form-field.tsx
    search-box/
      search-box.tsx
    stat-card/
      stat-card.tsx
    empty-state/
      empty-state.tsx

  organisms/
    sidebar/
      sidebar.tsx
    topbar/
      topbar.tsx
    data-table/
      data-table.tsx
    filters-bar/
      filters-bar.tsx

  templates/
    auth-shell/
      auth-shell.tsx
    dashboard-shell/
      dashboard-shell.tsx
    detail-shell/
      detail-shell.tsx
```

## Estructura de componentes compartidos

La carpeta `src/components/common` es para componentes compartidos de aplicacion.

Aqui viven piezas como:

- guards de autenticacion o permisos
- navegacion compartida
- wrappers de tablas
- estados de loading y error
- formularios comunes
- piezas de soporte que no pertenecen a un modulo unico

Ejemplo:

```text
src/components/common/
  guards/
    auth-guard.tsx
    permission-guard.tsx
  navigation/
    app-sidebar.tsx
    app-breadcrumbs.tsx
  feedback/
    loading-screen.tsx
    error-state.tsx
  forms/
    section-form.tsx
  tables/
    table-toolbar.tsx
```

## Otras carpetas globales

### `src/providers`

Providers globales de React y Tamagui.

Ejemplo:

```text
src/providers/
  app-provider.tsx
  tamagui-provider.tsx
```

### `src/lib`

Infraestructura transversal.

Ejemplo:

```text
src/lib/
  api/
    client.ts
    server.ts
  auth/
    session.ts
    permissions.ts
  formatting/
    currency.ts
    date.ts
    account-number.ts
  routing/
    paths.ts
```

### `src/config`

Configuraciones declarativas.

Ejemplo:

```text
src/config/
  app.ts
  navigation.ts
  permissions.ts
```

### `src/styles`

Tema, tokens y configuracion de estilos.

Ejemplo:

```text
src/styles/
  tamagui/
    index.ts
    tokens.ts
    themes.ts
```

### `src/types`

Tipos globales compartidos entre modulos.

### `src/utils`

Utilidades puras y pequenas, sin dependencia de dominio.

### `src/assets`

Iconos, imagenes y recursos estaticos de aplicacion.

## Reglas de que va en cada carpeta

### `app/`

Va aqui:

- `page.tsx`
- `layout.tsx`
- `loading.tsx`
- `error.tsx`
- `route.ts`
- composicion minima de pantalla por ruta

No va aqui:

- logica de negocio
- llamadas grandes a servicios
- componentes complejos de dominio

Regla:

- una ruta de `app/` debe importar una `screen` del modulo correspondiente siempre que la pantalla tenga logica o UI relevante.

### `modules/<name>/screens`

Va aqui:

- pantallas del modulo
- composicion de secciones del modulo
- conexion entre componentes del modulo y servicios del modulo

No va aqui:

- rutas de Next
- componentes genericos del design system

### `modules/<name>/components`

Va aqui:

- componentes especificos del dominio
- tablas, tarjetas, formularios o paneles que solo tienen sentido dentro de ese modulo

### `modules/<name>/services`

Va aqui:

- acceso a APIs
- adapters de datos
- transformaciones ligadas al backend del modulo

### `modules/<name>/hooks`

Va aqui:

- hooks del modulo
- estado local del modulo
- filtros o logica de interaccion del modulo

### `components/ui`

Va aqui:

- componentes visuales reutilizables
- primitives del sistema visual
- piezas transversales que no conocen dominio bancario

No va aqui:

- componentes con nombres de negocio como `customer-table` o `account-balance-card`

### `components/common`

Va aqui:

- componentes compartidos de aplicacion
- piezas que no son atomicas pero tampoco pertenecen a un solo modulo

### `lib`

Va aqui:

- clientes API
- session handling
- permisos
- formateadores
- validaciones base
- paths compartidos

### `utils`

Va aqui:

- funciones chicas y puras
- funciones sin dependencia de framework

No va aqui:

- logica de negocio del core
- integraciones con servicios

## Reglas de imports

Estas reglas son obligatorias para mantener el repo ordenado.

### Flujo permitido

```text
app -> modules
app -> components/common
app -> components/ui
app -> providers
app -> lib

modules -> components/ui
modules -> components/common
modules -> lib
modules -> types
modules -> utils

components/common -> components/ui
components/common -> lib

components/ui -> styles
components/ui -> lib
```

### Flujo no permitido

```text
components/ui -> modules
components/common -> modules
lib -> modules
utils -> modules
module A -> internals de module B
```

## Regla entre modulos

Un modulo no debe importar componentes internos de otro modulo.

Incorrecto:

```text
modules/accounts/components/account-table.tsx
  importa desde
modules/customers/components/customer-table.tsx
```

Correcto:

- mover la pieza reusable a `components/common`
- o mover la pieza a `components/ui` si es visual y generica
- o exponer un contrato via `lib` o `types` si solo se comparte data

## Convenciones de nombres

Para que el repo sea leible a simple vista:

- carpetas: `kebab-case`
- archivos de componentes: `kebab-case.tsx`
- hooks: `use-<feature>.ts`
- services: `<module>.service.ts`
- schemas: `<entity>.schema.ts`
- constants: `<module>.constants.ts`
- types: `<module>.types.ts`

Ejemplos:

- `customers-list-screen.tsx`
- `customer-detail-screen.tsx`
- `customer-table.tsx`
- `use-customers-filters.ts`
- `customers.service.ts`
- `customer.types.ts`

## Convenciones de lectura para el equipo

Cuando alguien nuevo llegue al proyecto, debe poder seguir esta logica:

1. Si busca una ruta, entra a `src/app`.
2. Si busca el negocio de una pantalla, entra a `src/modules/<modulo>`.
3. Si busca un componente visual reusable, entra a `src/components/ui`.
4. Si busca una pieza compartida de aplicacion, entra a `src/components/common`.
5. Si busca infraestructura tecnica, entra a `src/lib`.

## Ejemplo real de relacion entre carpetas

Ruta:

```text
src/app/(workspace)/customers/page.tsx
```

Pantalla del modulo:

```text
src/modules/customers/screens/customers-list-screen.tsx
```

Componentes del modulo:

```text
src/modules/customers/components/customer-table.tsx
src/modules/customers/components/customer-summary-card.tsx
```

UI compartida:

```text
src/components/ui/organisms/data-table/data-table.tsx
src/components/ui/molecules/search-box/search-box.tsx
src/components/ui/atoms/button/app-button.tsx
```

## Regla de crecimiento

No crear carpetas por anticipacion extrema.

Se pueden crear las carpetas base de la arquitectura, pero dentro de cada modulo solo deben aparecer archivos reales cuando exista una necesidad concreta.

La excepcion es la capa de estructura principal:

- `app/`
- `modules/`
- `components/ui/`
- `components/common/`
- `providers/`
- `lib/`
- `config/`
- `styles/`
- `types/`
- `utils/`

## Regla de decision rapida

Si dudas donde poner algo, usa esta tabla mental:

- si define una ruta: `app`
- si pertenece a un dominio bancario: `modules`
- si es visual y reusable: `components/ui`
- si es compartido pero no atomico: `components/common`
- si es infraestructura tecnica: `lib`
- si es configuracion declarativa: `config`
- si es tipo global: `types`
- si es helper puro: `utils`

## Estado esperado del equipo

Si esta guia se respeta, el proyecto deberia permitir:

- trabajo en paralelo por modulo
- bajo acoplamiento entre dominios
- onboarding mas rapido para nuevos integrantes
- ubicacion predecible de archivos
- menor riesgo de carpetas desordenadas con el tiempo
