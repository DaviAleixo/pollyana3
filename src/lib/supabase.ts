import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Define a structure that mimics the Supabase query response for unconfigured state
const unconfiguredResponse = {
  data: null,
  error: { message: 'Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' },
};

// Define a dummy query object that returns the unconfigured response promise
const dummyQuery: any = {
  select: () => dummyQuery,
  order: () => dummyQuery,
  eq: () => dummyQuery,
  in: () => dummyQuery,
  maybeSingle: () => Promise.resolve(unconfiguredResponse),
  insert: () => Promise.resolve(unconfiguredResponse),
  update: () => Promise.resolve(unconfiguredResponse),
  delete: () => Promise.resolve(unconfiguredResponse),
  neq: () => dummyQuery,
  is: () => dummyQuery,
  single: () => Promise.resolve(unconfiguredResponse),
};

// Define a dummy client that returns the dummy query object
const dummyClient: SupabaseClient | any = {
  from: () => dummyQuery,
};

export let supabase: SupabaseClient | any;
export let isSupabaseConfigured = false;

if (supabaseUrl && supabaseAnonKey) {
  // Initialize the real Supabase client
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  isSupabaseConfigured = true;
  console.log("Supabase configured successfully.");
} else {
  // Use the dummy client if configuration is missing
  console.error('Supabase não configurado! Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env. Usando cliente dummy.');
  supabase = dummyClient;
  isSupabaseConfigured = false;
}