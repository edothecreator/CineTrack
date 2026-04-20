import type { MovieSummary } from "@/types/movie";

export type HomeDiscoveryApiResponse = {
  trending: MovieSummary[];
  popular: MovieSummary[];
  error?: string;
};
