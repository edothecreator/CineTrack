/**
 * TMDB genre IDs — https://developer.themoviedb.org/reference/genre-movie-list
 * Labels are vibes; genreId maps to TMDB's genre system.
 */
export const VIBE_FILTERS = [
  { id: "adrenaline", label: "Adrenaline", genreId: 28 },    // Action
  { id: "brain-melt", label: "Brain-Melt", genreId: 878 },   // Science Fiction
  { id: "cozy", label: "Cozy", genreId: 35 },                // Comedy
  { id: "noir", label: "Noir nights", genreId: 80 },         // Crime
  { id: "animation", label: "Animation", genreId: 16 },      // Animation
] as const;

export type VibeFilterId = (typeof VIBE_FILTERS)[number]["id"];
