import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lplgnivmzbrhnwngrmbs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_BsOlxFouO62eeYQCX66CFA_D7ZG9-Xg';

if (!import.meta.env.VITE_SUPABASE_URL || (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY && !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
  console.warn('Supabase environment variables are missing. Using provided default values.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
