export type MovieSummary = {
  id: string;
  title: string;
  posterUrl: string;
  rating?: number;
  releaseDate: string;
  runtimeMinutes?: number;
  heroBackdropUrl?: string;
  genres?: string[];
};

export type CastMember = {
  actorName: string;
  characterName: string;
  roleType?: string;
  imageUrl?: string;
  peopleId?: number;
};

export type CrewMember = {
  name: string;
  job: string;
  department: string;
  imageUrl?: string;
  peopleId?: number;
};

export type SeasonInfo = {
  id: number;
  seasonNumber: number;
  name: string;
  episodeCount: number;
  posterUrl?: string;
  airDate?: string;
  overview?: string;
};

export type WatchProvider = {
  providerId: number;
  providerName: string;
  logoUrl: string;
};

export type MovieDetail = MovieSummary & {
  description: string;
  tagline?: string;
  kind?: "movie" | "series";
  genres?: string[];
  cast?: CastMember[];
  crew?: CrewMember[];
  runtimeMinutes?: number;
  statusLabel?: string;
  studios?: string[];
  networks?: string[];
  trailers?: { name: string; url: string }[];
  backdropUrl?: string;
  contentRatings?: string[];
  originalCountry?: string;
  originalLanguage?: string;
  originalTitle?: string;
  budget?: number;
  revenue?: number;
  homepage?: string;
  voteCount?: number;
  popularity?: number;
  spokenLanguages?: string[];
  productionCountries?: string[];
  keywords?: string[];
  // TV-specific
  seasons?: SeasonInfo[];
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  lastAirDate?: string;
  createdBy?: { id: number; name: string; imageUrl?: string }[];
  // Watch providers (US)
  watchProviders?: {
    flatrate?: WatchProvider[];
    rent?: WatchProvider[];
    buy?: WatchProvider[];
  };
};
