import { describe, it, expect } from "vitest";
import { REACTION_META } from "@/types/post";
import type { ReactionType } from "@/types/post";

describe("REACTION_META", () => {
  const EXPECTED_TYPES: ReactionType[] = ["love", "haha", "wow", "sad", "fire"];

  it("has exactly 5 reaction types", () => {
    expect(Object.keys(REACTION_META)).toHaveLength(5);
  });

  it("contains all expected reaction types", () => {
    for (const type of EXPECTED_TYPES) {
      expect(REACTION_META).toHaveProperty(type);
    }
  });

  it("every reaction has a non-empty emoji", () => {
    for (const [, meta] of Object.entries(REACTION_META)) {
      expect(meta.emoji.trim().length).toBeGreaterThan(0);
    }
  });

  it("every reaction has a non-empty label", () => {
    for (const [, meta] of Object.entries(REACTION_META)) {
      expect(meta.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("love reaction has heart emoji", () => {
    expect(REACTION_META.love.emoji).toBe("❤️");
  });

  it("fire reaction has fire emoji", () => {
    expect(REACTION_META.fire.emoji).toBe("🔥");
  });
});
