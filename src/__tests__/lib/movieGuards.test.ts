import { describe, it, expect } from "vitest";
import { isMovieSummaryShape, isHistoryEntryShape } from "@/lib/movieGuards";

describe("isMovieSummaryShape", () => {
  it("returns true for a valid MovieSummary", () => {
    expect(isMovieSummaryShape({
      id: "movie-550",
      title: "Fight Club",
      posterUrl: "https://image.tmdb.org/t/p/w342/poster.jpg",
      releaseDate: "1999-10-15",
    })).toBe(true);
  });

  it("returns true with optional rating", () => {
    expect(isMovieSummaryShape({
      id: "tv-1396",
      title: "Breaking Bad",
      posterUrl: "https://image.tmdb.org/t/p/w342/poster.jpg",
      releaseDate: "2008-01-20",
      rating: 9.5,
    })).toBe(true);
  });

  it("returns false when id is missing", () => {
    expect(isMovieSummaryShape({
      title: "Fight Club",
      posterUrl: "https://example.com/poster.jpg",
      releaseDate: "1999-10-15",
    })).toBe(false);
  });

  it("returns false when title is not a string", () => {
    expect(isMovieSummaryShape({
      id: "movie-550",
      title: 123,
      posterUrl: "https://example.com/poster.jpg",
      releaseDate: "1999-10-15",
    })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isMovieSummaryShape(null)).toBe(false);
  });

  it("returns false for a string", () => {
    expect(isMovieSummaryShape("not an object")).toBe(false);
  });

  it("returns false when rating is not a number", () => {
    expect(isMovieSummaryShape({
      id: "movie-550",
      title: "Fight Club",
      posterUrl: "https://example.com/poster.jpg",
      releaseDate: "1999-10-15",
      rating: "8.5", // string instead of number
    })).toBe(false);
  });
});

describe("isHistoryEntryShape", () => {
  it("returns true for a valid HistoryEntry", () => {
    expect(isHistoryEntryShape({
      id: "movie-550",
      title: "Fight Club",
      posterUrl: "https://image.tmdb.org/t/p/w342/poster.jpg",
      releaseDate: "1999-10-15",
      completedAt: Date.now(),
    })).toBe(true);
  });

  it("returns false when completedAt is missing", () => {
    expect(isHistoryEntryShape({
      id: "movie-550",
      title: "Fight Club",
      posterUrl: "https://example.com/poster.jpg",
      releaseDate: "1999-10-15",
    })).toBe(false);
  });

  it("returns false when completedAt is not finite", () => {
    expect(isHistoryEntryShape({
      id: "movie-550",
      title: "Fight Club",
      posterUrl: "https://example.com/poster.jpg",
      releaseDate: "1999-10-15",
      completedAt: NaN,
    })).toBe(false);
  });
});
