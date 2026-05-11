import { describe, it, expect } from "vitest";
import { formatReleaseDate } from "@/lib/formatMovie";

describe("formatReleaseDate", () => {
  it("formats a full ISO date correctly", () => {
    const result = formatReleaseDate("1994-09-23");
    expect(result).toContain("1994");
  });

  it("returns — for empty string", () => {
    expect(formatReleaseDate("")).toBe("—");
  });

  it("returns — for undefined/null-like input", () => {
    expect(formatReleaseDate(undefined as unknown as string)).toBe("—");
  });

  it("handles year-only dates", () => {
    const result = formatReleaseDate("2024-01-01");
    expect(result).toContain("2024");
  });
});
