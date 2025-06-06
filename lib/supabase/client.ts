"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"

// Singleton pattern para evitar múltiplas instâncias do cliente
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

export const createClient = () => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('http://', 'https://')
    
    supabaseClient = createClientComponentClient<Database>({
      supabaseUrl,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      options: {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        global: {
          headers: {
            'X-Client-Info': 'conectafit-app',
          },
        },
        fetch: (url, options) => {
          const httpsUrl = url.toString().replace('http://', 'https://')
          return fetch(httpsUrl, {
            ...options,
            headers: {
              ...options?.headers,
              'X-Client-Info': 'conectafit-app',
            },
          })
        },
      },
    })
  }
  return supabaseClient
}
