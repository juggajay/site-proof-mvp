import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false, // This prevents many auth errors
        detectSessionInUrl: false,
        flowType: 'implicit'
      },
      global: {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    }
  );
}