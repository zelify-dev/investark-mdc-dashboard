# Arquitectura — zelify-core

Vista de componente dentro de **Platform Core**.

## C4 (componente)

```mermaid
flowchart TB
  subgraph Sistema["Platform Core"]
    UP["auth-gateway"]
    ME["zelify-core"]
    DOWN["PostgreSQL"]
  end
  EXT[["Sistemas externos / stores"]]
  UP --> ME
  ME --> DOWN
  ME --> EXT
```

## Secuencia

```mermaid
sequenceDiagram
  participant Caller as Upstream
  participant S as zelify-core
  participant Store as PostgreSQL / Kafka
  Caller->>S: comando / query
  S->>Store: write / publish platform.core.events
  Store-->>S: ack
  S-->>Caller: 2xx o error de dominio
```

El contexto de plataforma (personas, Pomelo, rieles, Kafka) está en `zelify-backstage` → Arquitectura.
