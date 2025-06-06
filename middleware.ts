import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Se o usuário não estiver autenticado e estiver tentando acessar uma rota protegida
    if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Se o usuário estiver autenticado e estiver tentando acessar uma rota de autenticação
    if (
      session &&
      (request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/register"))
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  } catch (error) {
    console.error("Erro no middleware de autenticação:", error)
    // Em caso de erro de autenticação, redirecionar para login
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
}
