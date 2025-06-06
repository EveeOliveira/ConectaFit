import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  return createServerComponentClient<Database>({
    cookies,
    options: {
      supabaseUrl,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      fetch: (url: string, options: RequestInit) => {
        // Em desenvolvimento, permitir certificados auto-assinados
        if (process.env.NODE_ENV === 'development') {
          return fetch(url, {
            ...options,
            headers: {
              ...options?.headers,
              'X-Client-Info': 'conectafit-app',
            },
            // @ts-ignore - Ignorar erro de tipo para development
            rejectUnauthorized: false,
          })
        }
        
        // Em produção, usar HTTPS normalmente
        const httpsUrl = url.replace('http://', 'https://')
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

