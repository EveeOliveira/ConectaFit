import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"
import type { Database } from "@/lib/database.types"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    try {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

      // Trocar o código por uma sessão
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Erro ao trocar código por sessão:", error)
        return NextResponse.redirect(new URL("/login?error=auth", requestUrl.origin))
      }
    } catch (error) {
      console.error("Erro no callback de autenticação:", error)
      return NextResponse.redirect(new URL("/login?error=callback", requestUrl.origin))
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin))
}
