"use client";

// Lightweight, privacy-friendly "who voted" tracking — purely client-side.
// We persist a random id per browser and a per-poll flag. This is a UX guard
// (so a returning voter sees results, not the ballot); real abuse prevention is
// the server-side IP rate limit.

const VOTER_ID_KEY = "swiftpoll_voter_id";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Get (or lazily create) a stable anonymous id for this browser. */
export function getVoterId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(VOTER_ID_KEY);
    if (!id) {
      id = randomId();
      window.localStorage.setItem(VOTER_ID_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

const votedKey = (slug: string) => `swiftpoll_voted_${slug}`;

/** Returns the option id(s) this browser already voted for, or null. */
export function getVotedOptions(slug: string): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(votedKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Mark this browser as having voted for the given option id(s). */
export function markVoted(slug: string, optionIds: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(votedKey(slug), JSON.stringify(optionIds));
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}

const ADMIN_TOKEN_PREFIX = "swiftpoll_admin_";

/** Persist the secret admin token for a poll this browser created. */
export function saveAdminToken(slug: string, token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${ADMIN_TOKEN_PREFIX}${slug}`, token);
  } catch {
    // ignore
  }
}

/** Read back the admin token for a poll, if this browser created it. */
export function getAdminToken(slug: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(`${ADMIN_TOKEN_PREFIX}${slug}`);
  } catch {
    return null;
  }
}

/** Forget the admin token (e.g. after the poll is deleted). */
export function clearAdminToken(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${ADMIN_TOKEN_PREFIX}${slug}`);
  } catch {
    // ignore
  }
}
