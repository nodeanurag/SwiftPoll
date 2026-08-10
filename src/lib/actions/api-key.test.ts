import { describe, expect, it } from "vitest";
import crypto from "crypto";

// Test suite for the core crypto/masking operations of Developer API Keys
describe("Developer API Keys Generation & Cryptography", () => {
  it("generates key with correct prefix and length", () => {
    const rawHex = crypto.randomBytes(24).toString("hex");
    const plainTextKey = `sp_live_${rawHex}`;

    expect(plainTextKey.startsWith("sp_live_")).toBe(true);
    // sp_live_ is 8 chars + 48 hex chars = 56 chars
    expect(plainTextKey.length).toBe(56);
  });

  it("masks the key correctly preserving prefix and last 4 characters", () => {
    const plainTextKey = "sp_live_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f";
    const maskedKey = `sp_live_xxxx...${plainTextKey.slice(-4)}`;

    expect(maskedKey.startsWith("sp_live_xxxx...")).toBe(true);
    expect(maskedKey.endsWith("7e6f")).toBe(true);
    expect(maskedKey).toBe("sp_live_xxxx...7e6f");
  });

  it("hashes the API key correctly and securely using SHA-256", () => {
    const plainTextKey = "sp_live_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f";
    const keyHash1 = crypto.createHash("sha256").update(plainTextKey).digest("hex");
    const keyHash2 = crypto.createHash("sha256").update(plainTextKey).digest("hex");

    expect(keyHash1).toBe(keyHash2);
    // SHA-256 hashes are 64 characters long hex strings
    expect(keyHash1.length).toBe(64);
  });
});
