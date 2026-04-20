import type { HomeDiscoveryApiResponse } from "@/lib/homeDiscoveryContract";

export async function fetchHomeDiscovery(
  genreId?: number,
  signal?: AbortSignal,
): Promise<HomeDiscoveryApiResponse> {
  const params = new URLSearchParams();
  if (genreId != null && Number.isFinite(genreId)) {
    params.set("genre", String(Math.floor(genreId)));
  }
  const qs = params.toString();
  const res = await fetch(
    qs ? `/api/home-discovery?${qs}` : "/api/home-discovery",
    { signal },
  );
  try {
    return (await res.json()) as HomeDiscoveryApiResponse;
  } catch {
    return {
      trending: [],
      popular: [],
      error: "Invalid discovery response.",
    };
  }
}
