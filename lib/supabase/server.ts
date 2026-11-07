// ============================================================
// ClaimWise — Supabase server client
//
// For Route Handlers, Server Components and Server Actions.
// Reads/writes the session cookies through next/headers so the
// browser and server always agree on the signed-in user.
//
// In Route Handlers, cookie mutations made via cookies() are
// attached to the outgoing response automatically — that is how
// signInWithPassword / signOut refresh the session cookie without
// any manual setCookie code in the auth routes.
// ============================================================

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a context that cannot mutate cookies (e.g. a
            // Server Component render). Safe to ignore here — read-only
            // code paths never need to refresh the session cookie.
          }
        },
      },
    }
  );
}

export type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;
