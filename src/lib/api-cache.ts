/**
 * Sistema de deduplicación y caché en memoria para peticiones fetch.
 * Útil para evitar que múltiples componentes disparen la misma petición al mismo tiempo (ej. durante el montaje inicial).
 */

type CacheEntry = {
  promise: Promise<Response>;
  timestamp: number;
};

// Mapa global de peticiones en curso o cacheables
const cache = new Map<string, CacheEntry>();

// Tiempo de vida por defecto para el caché (milisegundos)
const DEFAULT_TTL = 2000; // 2 segundos para evitar "spam" de re-renders

/**
 * Obtiene o crea una petición fetch compartida.
 * @param key Identificador único (ej. "GET:/api/users")
 * @param fetcher Función que realiza el fetch real
 * @param ttl Tiempo que el resultado permanece en caché tras completarse (ms)
 */
export async function deduplicateFetch(
  key: string,
  fetcher: () => Promise<Response>,
  ttl: number = DEFAULT_TTL
): Promise<Response> {
  const now = Date.now();
  const entry = cache.get(key);

  // Si hay una entrada válida (no expirada), devolver el clon de la respuesta
  if (entry && (now - entry.timestamp) < ttl) {
    // Importante: No podemos reutilizar el objeto Response directamente porque se consume;
    // debemos esperar a la promesa y clonar el resultado.
    const res = await entry.promise;
    return res.clone();
  }

  // Si no hay entrada o expiró, crear una nueva petición
  const promise = fetcher().then(async (res) => {
    // Solo cacheamos respuestas OK; errores deben reintentarse
    if (!res.ok) {
      cache.delete(key);
      return res;
    }
    return res;
  });

  cache.set(key, { promise, timestamp: now });

  // Al fallar la petición, limpiar el caché para permitir reintento inmediato
  promise.catch(() => cache.delete(key));

  const finalRes = await promise;
  return finalRes.clone();
}

/** Limpia todo el caché manual (ej. al hacer logout) */
export function clearApiCache() {
  cache.clear();
}
