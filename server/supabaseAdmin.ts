import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseAdmin: SupabaseClient | null = null;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl && supabaseServiceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  console.log('[supabase-auth] Client admin Supabase initialisé');
} else {
  console.warn('[supabase-auth] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant — synchronisation Auth désactivée');
}

export { supabaseAdmin };
