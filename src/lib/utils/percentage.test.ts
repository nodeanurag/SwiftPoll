import { describe, expect, it } from "vitest";
import { computePercentage } from "./percentage";

describe("computePercentage", () => {
  it("returns 0 when there are no votes", () => {
    expect(computePercentage(0, 0)).toBe(0);
    expect(computePercentage(5, 0)).toBe(0);
  });

  it("returns 0 for a zero count", () => {
    expect(computePercentage(0, 10)).toBe(0);
  });

  it("computes whole percentages", () => {
    expect(computePercentage(1, 4)).toBe(25);
    expect(computePercentage(3, 4)).toBe(75);
    expect(computePercentage(10, 10)).toBe(100);
  });

  it("rounds to one decimal place", () => {
    expect(computePercentage(1, 3)).toBe(33.3);
    expect(computePercentage(2, 3)).toBe(66.7);
  });

  it("never divides by zero or returns negatives", () => {
    expect(computePercentage(-1, 0)).toBe(0);
  });
});
