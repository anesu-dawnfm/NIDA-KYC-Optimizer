import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/core/config/env";

import { supabaseStorage } from "./secure-storage";
import type { Database } from "./database.types";
import { SupabaseError } from "./supabase-error";

let client: SupabaseClient<Database> | null = null;

export function isSupabaseConfigured(): boolean {
  return env.hasSupabaseConfig && Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) {
    return client;
  }

  if (!isSupabaseConfigured()) {
    throw new SupabaseError(
      "client_not_configured",
      "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  client = createClient<Database>(env.supabaseUrl as string, env.supabaseAnonKey as string, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
      flowType: "pkce",
      storage: supabaseStorage,
    },
  });

  return client;
}

export function getSupabaseClientOrNull(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return getSupabaseClient();
}
