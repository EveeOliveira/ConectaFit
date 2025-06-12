import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

export const createClient = () => {
  // Garantir que a URL base do Supabase seja sempre HTTPS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^http:\/\//, 'https://')
  
  return createServerComponentClient<Database>({
    cookies,
    options: {
      supabaseUrl,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      fetch: (url: string, options: RequestInit) => {
        // Garantir que todas as URLs sejam HTTPS
        const httpsUrl = url.replace(/^http:\/\//, 'https://')
        
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

