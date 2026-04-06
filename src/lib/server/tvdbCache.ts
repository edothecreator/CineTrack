import { LRUCache } from "lru-cache";

const cache = new LRUCache<string, object>({
  max: 900,
  ttlAutopurge: false,
});

const inflight = new Map<string, Promise<object>>();

export const TVDB_CACHE_TTL = {
  search: 5 * 60 * 1000,
  browse: 10 * 60 * 1000,
  home: 12 * 60 * 1000,
  detail: 22 * 60 * 1000,
  person: 35 * 60 * 1000,
  episodes: 18 * 60 * 1000,
} as const;

export async function withTvdbCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const hit = cache.get(key) as T | undefined;
  if (hit !== undefined) return hit as T;

  let p = inflight.get(key) as Promise<T> | undefined;
  if (p) return p;

  p = (async () => {
    try {
      const v = await fetcher();
      cache.set(key, v as object, { ttl: ttlMs });
      return v;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, p as Promise<object>);
  return p;
}
