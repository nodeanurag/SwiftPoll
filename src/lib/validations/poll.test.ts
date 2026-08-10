import { describe, expect, it } from "vitest";
import { createPollSchema, voteSchema, managePollSchema } from "./poll";

const base = {
  question: "Best framework?",
  options: ["Next", "Remix"],
  type: "single" as const,
  hideResults: false,
};

describe("createPollSchema", () => {
  it("accepts a valid poll", () => {
    expect(createPollSchema.safeParse(base).success).toBe(true);
  });

  it("applies defaults for type and hideResults", () => {
    const res = createPollSchema.safeParse({
      question: "Q",
      options: ["a", "b"],
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.type).toBe("single");
      expect(res.data.hideResults).toBe(false);
    }
  });

  it("rejects an empty question", () => {
    expect(createPollSchema.safeParse({ ...base, question: "  " }).success).toBe(
      false,
    );
  });

  it("rejects fewer than two options", () => {
    expect(createPollSchema.safeParse({ ...base, options: ["only"] }).success).toBe(
      false,
    );
  });

  it("rejects more than ten options", () => {
    const options = Array.from({ length: 11 }, (_, i) => `opt ${i}`);
    expect(createPollSchema.safeParse({ ...base, options }).success).toBe(false);
  });

  it("rejects duplicate options (case-insensitive, trimmed)", () => {
    const res = createPollSchema.safeParse({
      ...base,
      options: ["Apple", " apple "],
    });
    expect(res.success).toBe(false);
  });

  it("rejects an over-long question", () => {
    expect(
      createPollSchema.safeParse({ ...base, question: "x".repeat(201) }).success,
    ).toBe(false);
  });

  it("accepts an optional ISO close time", () => {
    const res = createPollSchema.safeParse({
      ...base,
      closesAt: new Date("2999-01-01T00:00:00.000Z").toISOString(),
    });
    expect(res.success).toBe(true);
  });

  it("rejects a non-ISO close time", () => {
    expect(
      createPollSchema.safeParse({ ...base, closesAt: "next tuesday" }).success,
    ).toBe(false);
  });
});

describe("voteSchema", () => {
  const uuid = "11111111-1111-4111-8111-111111111111";

  it("accepts a valid vote", () => {
    expect(
      voteSchema.safeParse({ slug: "abc123", optionIds: [uuid] }).success,
    ).toBe(true);
  });

  it("rejects an empty option list", () => {
    expect(
      voteSchema.safeParse({ slug: "abc123", optionIds: [] }).success,
    ).toBe(false);
  });

  it("rejects non-uuid option ids", () => {
    expect(
      voteSchema.safeParse({ slug: "abc123", optionIds: ["nope"] }).success,
    ).toBe(false);
  });
});

describe("managePollSchema", () => {
  it("accepts known actions", () => {
    for (const action of ["close", "reopen", "delete"] as const) {
      expect(
        managePollSchema.safeParse({ slug: "s", adminToken: "t", action })
          .success,
      ).toBe(true);
    }
  });

  it("rejects unknown actions", () => {
    expect(
      managePollSchema.safeParse({ slug: "s", adminToken: "t", action: "nuke" })
        .success,
    ).toBe(false);
  });
});
