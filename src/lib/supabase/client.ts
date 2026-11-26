import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local",
  );
}

/**
 * Client for use in Client Components. Safe key in hand: every table is guarded by RLS,
 * so the anon key alone cannot write to someone else's rows.
 */
export function createClient() {
  return createBrowserClient(url, anonKey);
}
