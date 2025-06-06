import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('http://', 'https://')
  
  return createServerComponentClient<Database>({
    cookies,
    options: {
      supabaseUrl,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      fetch: (url: string, options: RequestInit) => {
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

