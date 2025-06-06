import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

export const createClient = () => {
  return createServerComponentClient<Database>({
    cookies,
    options: {
      // Forçar HTTPS
      fetch: (url, options) => {
        const httpsUrl = url.toString().replace('http://', 'https://')
        return fetch(httpsUrl, options)
      },
    },
  })
}

