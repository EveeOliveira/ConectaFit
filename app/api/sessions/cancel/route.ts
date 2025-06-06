import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "ID da sessão não fornecido" }, { status: 400 })
    }

    const cookieStore = cookies()

    // Usar a chave de serviço para ter permissões administrativas
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name, options) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    })

    // Obter a sessão do usuário atual
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    // Verificar se a sessão de treinamento existe e pertence ao usuário
    const { data: trainingSession, error: fetchError } = await supabase
      .from("training_sessions")
      .select("id, client_id, status")
      .eq("id", sessionId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })
    }

    if (trainingSession.client_id !== session.user.id) {
      return NextResponse.json({ error: "Você não tem permissão para cancelar esta sessão" }, { status: 403 })
    }

    // Atualizar o status da sessão para cancelado
    // Usando a chave de serviço, isso contorna as políticas de segurança RLS
    const { data: updatedSession, error: updateError } = await supabase
      .from("training_sessions")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select()

    if (updateError) {
      console.error("Erro ao cancelar sessão:", updateError)
      return NextResponse.json({ error: "Erro ao cancelar sessão" }, { status: 500 })
    }

    // Verificar se a atualização foi bem-sucedida
    if (!updatedSession || updatedSession.length === 0) {
      return NextResponse.json({ error: "Falha ao atualizar sessão" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Sessão cancelada com sucesso",
      session: updatedSession[0],
    })
  } catch (error) {
    console.error("Erro ao processar solicitação:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 },
    )
  }
}
