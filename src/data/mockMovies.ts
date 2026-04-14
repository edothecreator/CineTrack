import type { MovieDetail } from "@/types/movie";

/** Full mock catalog; search uses the same list (descriptions omitted from cards). */
export const MOCK_MOVIES: MovieDetail[] = [
  {
    id: "1",
    title: "The Example Heist",
    posterUrl: "https://placehold.co/300x450/1a1a2e/eee?text=Heist",
    rating: 7.8,
    releaseDate: "2024-06-14",
    description:
      "A crew of specialists plans an impossible vault job while old grudges threaten the timeline. Mock copy for development — replace with real overview from your API later.",
  },
  {
    id: "2",
    title: "Midnight in Copenhagen",
    posterUrl: "https://placehold.co/300x450/16213e/eee?text=Copenhagen",
    rating: 8.1,
    releaseDate: "2023-11-03",
    description:
      "Two strangers cross paths on the longest night of the year along the canals. A quiet drama about memory, trains, and second chances.",
  },
  {
    id: "3",
    title: "Rust Valley",
    posterUrl: "https://placehold.co/300x450/0f3460/eee?text=Rust+Valley",
    rating: 6.9,
    releaseDate: "2025-01-17",
    description:
      "In a dying factory town, siblings find a buried secret that reignites a feud with a neighboring county. Gritty, slow-burn mock thriller.",
  },
  {
    id: "4",
    title: "Paper Moons",
    posterUrl: "https://placehold.co/300x450/533483/eee?text=Paper+Moons",
    rating: 7.2,
    releaseDate: "2022-09-09",
    description:
      "A librarian forges rare prints for collectors until one job ties her to a global chase. Literary heist mock with a melancholic tone.",
  },
  {
    id: "5",
    title: "Echo Chamber",
    posterUrl: "https://placehold.co/300x450/e94560/fff?text=Echo",
    rating: 5.4,
    releaseDate: "2024-12-01",
    description:
      "A podcast host receives tips about her own life from an anonymous source. Paranoia escalates as the show’s audience grows overnight.",
  },
];
