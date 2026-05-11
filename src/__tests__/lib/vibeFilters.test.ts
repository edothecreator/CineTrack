import { describe, it, expect } from "vitest";
import { VIBE_FILTERS } from "@/lib/vibeFilters";

describe("VIBE_FILTERS", () => {
  it("has 5 filters", () => {
    expect(VIBE_FILTERS).toHaveLength(5);
  });

  it("every filter has a unique id", () => {
    const ids = VIBE_FILTERS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every filter has a valid TMDB genreId (positive integer)", () => {
    for (const f of VIBE_FILTERS) {
      expect(f.genreId).toBeGreaterThan(0);
      expect(Number.isInteger(f.genreId)).toBe(true);
    }
  });

  it("every filter has a non-empty label", () => {
    for (const f of VIBE_FILTERS) {
      expect(f.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("contains Action genre (id 28)", () => {
    expect(VIBE_FILTERS.some((f) => f.genreId === 28)).toBe(true);
  });
});
