"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"

// Padrão Singleton para evitar múltiplas instâncias do cliente
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

export const createClient = () => {
  if (!supabaseClient) {
    // Garantir que a URL base do Supabase seja sempre HTTPS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^http:\/\//, 'https://')
    
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
          // Garantir que todas as URLs sejam HTTPS
          const httpsUrl = url.toString().replace(/^http:\/\//, 'https://')
          
          // Em desenvolvimento, permitir certificados auto-assinados
          if (process.env.NODE_ENV === 'development') {
            return fetch(httpsUrl, {
              ...options,
              headers: {
                ...options?.headers,
                'X-Client-Info': 'conectafit-app',
              },
              // @ts-ignore - Ignorar erro de tipo para desenvolvimento
              rejectUnauthorized: false,
            })
          }
          
          // Em produção, usar HTTPS normalmente
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
