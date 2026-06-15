import { useEffect } from "react";

import { registerAccessTokenProvider } from "@/core/api";

import { getSupabaseClientOrNull } from "./supabase-client";

export function SupabaseAuthBridge(): null {
  useEffect(() => {
    registerAccessTokenProvider(async () => {
      const client = getSupabaseClientOrNull();

      if (!client) {
        return null;
      }

      const { data, error } = await client.auth.getSession();
      if (error) {
        return null;
      }

      return data.session?.access_token ?? null;
    });
  }, []);

  return null;
}
