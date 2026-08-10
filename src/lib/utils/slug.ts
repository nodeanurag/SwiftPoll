import { customAlphabet } from "nanoid";

// URL-safe, unambiguous alphabet: no 0/O, 1/l/I to avoid mistakes when typing.
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyz";

const SLUG_LENGTH = 7;
const ADMIN_TOKEN_LENGTH = 24;

const slugId = customAlphabet(ALPHABET, SLUG_LENGTH);
const adminId = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  ADMIN_TOKEN_LENGTH,
);

/** Generate a short, URL-safe poll slug (e.g. "x7y9z2a"). */
export function generateSlug(): string {
  return slugId();
}

/** Generate a long, hard-to-guess token used to manage a poll. */
export function generateAdminToken(): string {
  return adminId();
}

export const SLUG_ALPHABET = ALPHABET;
export { SLUG_LENGTH };
