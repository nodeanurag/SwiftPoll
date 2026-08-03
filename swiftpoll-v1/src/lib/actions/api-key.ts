"use server";

import crypto from "crypto";
import { getServerClient } from "@/lib/supabase/server";

export interface ApiKeyRecord {
  id: string;
  user_id: string;
  name: string;
  masked_key: string;
  created_at: string;
}

export interface ApiKeyResult<T> {
  ok: boolean;
  error?: string;
  data?: T;
}

/** Generates a new API key for the authenticated user */
export async function generateApiKey(
  name: string,
  token: string,
): Promise<ApiKeyResult<{ plainTextKey: string; keyRecord: ApiKeyRecord }>> {
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > 50) {
    return { ok: false, error: "Key name must be between 1 and 50 characters." };
  }
  if (!token) return { ok: false, error: "Not authenticated." };

  const supabase = getServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return { ok: false, error: "Not authenticated." };

  // Generate plain text key
  // sp_live_ + 48 hex chars (24 bytes)
  const rawHex = crypto.randomBytes(24).toString("hex");
  const plainTextKey = `sp_live_${rawHex}`;

  // Hash using SHA-256
  const keyHash = crypto.createHash("sha256").update(plainTextKey).digest("hex");

  // Masked key: sp_live_xxxx...xxxx
  const maskedKey = `sp_live_xxxx...${plainTextKey.slice(-4)}`;

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: user.id,
      name: trimmedName,
      key_hash: keyHash,
      masked_key: maskedKey,
    })
    .select()
    .single();

  if (error || !data) {
    return { ok: false, error: "Could not generate API key. Try again." };
  }

  return {
    ok: true,
    data: {
      plainTextKey,
      keyRecord: data as ApiKeyRecord,
    },
  };
}

/** Gets all API keys for the authenticated user */
export async function getApiKeys(token: string): Promise<ApiKeyResult<ApiKeyRecord[]>> {
  if (!token) return { ok: false, error: "Not authenticated." };

  const supabase = getServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return { ok: false, error: "Not authenticated." };

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, user_id, name, masked_key, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false, error: "Could not load API keys." };
  }

  return { ok: true, data: data || [] };
}

/** Revokes/deletes an API key */
export async function revokeApiKey(id: string, token: string): Promise<ApiKeyResult<null>> {
  if (!id || !token) return { ok: false, error: "Invalid request data." };

  const supabase = getServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return { ok: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: "Could not revoke API key." };
  }

  return { ok: true };
}
