import { describe, expect, it } from "vitest";
import {
  generateAdminToken,
  generateSlug,
  SLUG_ALPHABET,
  SLUG_LENGTH,
} from "./slug";

describe("generateSlug", () => {
  it("produces a slug of the configured length", () => {
    expect(generateSlug()).toHaveLength(SLUG_LENGTH);
  });

  it("uses only the unambiguous alphabet", () => {
    const allowed = new Set(SLUG_ALPHABET.split(""));
    for (let i = 0; i < 200; i++) {
      for (const ch of generateSlug()) {
        expect(allowed.has(ch)).toBe(true);
      }
    }
  });

  it("is overwhelmingly unique across many calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(generateSlug());
    expect(seen.size).toBe(1000);
  });
});

describe("generateAdminToken", () => {
  it("produces a long token", () => {
    expect(generateAdminToken().length).toBe(24);
  });

  it("is unique across calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(generateAdminToken());
    expect(seen.size).toBe(1000);
  });
});
