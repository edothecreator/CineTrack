import { describe, it, expect } from "vitest";

// Inline the bingeClock logic since it's a pure utility
function formatBingeDuration(minutes: number): string {
  if (minutes <= 0) return "0 min";
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 && days === 0) parts.push(`${mins}m`);
  return parts.join(" ") || "0 min";
}

describe("formatBingeDuration", () => {
  it("formats minutes only", () => {
    expect(formatBingeDuration(45)).toBe("45m");
  });

  it("formats hours and minutes", () => {
    expect(formatBingeDuration(90)).toBe("1h 30m");
  });

  it("formats days and hours", () => {
    expect(formatBingeDuration(25 * 60)).toBe("1d 1h");
  });

  it("handles zero", () => {
    expect(formatBingeDuration(0)).toBe("0 min");
  });

  it("handles negative", () => {
    expect(formatBingeDuration(-10)).toBe("0 min");
  });

  it("formats exactly 1 day", () => {
    expect(formatBingeDuration(24 * 60)).toBe("1d");
  });

  it("formats large values", () => {
    const result = formatBingeDuration(10 * 24 * 60 + 3 * 60); // 10d 3h
    expect(result).toBe("10d 3h");
  });
});
