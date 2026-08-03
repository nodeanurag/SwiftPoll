/* eslint-disable @typescript-eslint/no-unused-vars */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetRateLimits,
  checkRateLimit,
  hashIp,
  MAX_VOTES_PER_IP_PER_POLL,
} from "./rate-limit";

// In-memory mock database store for rate limits
let mockRateLimits: { ip_hash: string; action: string }[] = [];

// Mock the Supabase client
vi.mock("@/lib/supabase/server", () => {
  return {
    getServerClient: () => ({
      from: (table: string) => {
        if (table === "rate_limits") {
          return {
            select: (_cols: string, _opts?: unknown) => {
              return {
                eq: (field1: string, val1: unknown) => {
                  return {
                    eq: (field2: string, val2: unknown) => {
                      const matches = mockRateLimits.filter(
                        (row) => row.ip_hash === val1 && row.action === val2,
                      );
                      return Promise.resolve({
                        count: matches.length,
                        error: null,
                      });
                    },
                  };
                },
              };
            },
          };
        }
        return {};
      },
    }),
  };
});

beforeEach(() => {
  mockRateLimits = [];
  __resetRateLimits();
});

describe("checkRateLimit", () => {
  it("allows up to the cap then blocks", async () => {
    const ip = hashIp("1.2.3.4");
    for (let i = 0; i < MAX_VOTES_PER_IP_PER_POLL; i++) {
      const res = await checkRateLimit("poll-a", ip);
      expect(res.allowed).toBe(true);
      // Simulate successful vote insertion
      mockRateLimits.push({ ip_hash: ip!, action: "vote:poll-a" });
    }
    const res = await checkRateLimit("poll-a", ip);
    expect(res.allowed).toBe(false);
  });

  it("counts polls independently", async () => {
    const ip = hashIp("1.2.3.4");
    for (let i = 0; i < MAX_VOTES_PER_IP_PER_POLL; i++) {
      mockRateLimits.push({ ip_hash: ip!, action: "vote:poll-a" });
    }
    const res = await checkRateLimit("poll-b", ip);
    expect(res.allowed).toBe(true);
  });

  it("counts IPs independently", async () => {
    const a = hashIp("1.1.1.1");
    const b = hashIp("2.2.2.2");
    for (let i = 0; i < MAX_VOTES_PER_IP_PER_POLL; i++) {
      mockRateLimits.push({ ip_hash: a!, action: "vote:p" });
    }
    const resA = await checkRateLimit("p", a);
    expect(resA.allowed).toBe(false);
    const resB = await checkRateLimit("p", b);
    expect(resB.allowed).toBe(true);
  });

  it("allows and does not count when the IP is unknown", async () => {
    for (let i = 0; i < 50; i++) {
      const res = await checkRateLimit("p", null);
      expect(res.allowed).toBe(true);
    }
  });

  it("reports remaining attempts", async () => {
    const ip = hashIp("9.9.9.9");
    const res = await checkRateLimit("p", ip);
    expect(res.remaining).toBe(MAX_VOTES_PER_IP_PER_POLL);
  });
});

describe("hashIp", () => {
  it("returns null for empty input", () => {
    expect(hashIp(null)).toBeNull();
    expect(hashIp(undefined)).toBeNull();
    expect(hashIp("")).toBeNull();
  });

  it("is deterministic and not the raw IP", () => {
    const a = hashIp("8.8.8.8");
    const b = hashIp("8.8.8.8");
    expect(a).toBe(b);
    expect(a).not.toBe("8.8.8.8");
    expect(a).toHaveLength(64); // sha-256 hex
  });
});
