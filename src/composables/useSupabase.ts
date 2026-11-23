import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { storeConfig } from '@/config/store'
import type { Database } from '@/types/database'

let client: SupabaseClient<Database> | null = null

export function useSupabase(): SupabaseClient<Database> {
  client ??= createClient<Database>(storeConfig.supabase.url, storeConfig.supabase.publishableKey)
  return client
}
