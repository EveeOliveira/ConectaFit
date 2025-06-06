import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { exerciseId } = await request.json()

    if (!exerciseId) {
      return NextResponse.json({ error: "ID do exercício não fornecido" }, { status: 400 })
    }

    console.log("API: Iniciando exclusão do exercício:", exerciseId)

    const cookieStore = cookies()

    // Criar cliente Supabase com a chave de serviço para ter permissões administrativas
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

    // Verificar se o exercício existe antes de tentar excluí-lo
    const { data: exercise, error: exerciseError } = await supabase
      .from("workout_exercises")
      .select("id, workout_plan_id")
      .eq("id", exerciseId)
      .single()

    if (exerciseError) {
      console.error("API: Erro ao buscar exercício:", exerciseError)
      return NextResponse.json({ error: "Exercício não encontrado" }, { status: 404 })
    }

    console.log("API: Exercício encontrado:", exercise)

    // Excluir o exercício
    const { error: deleteError } = await supabase.from("workout_exercises").delete().eq("id", exerciseId)

    if (deleteError) {
      console.error("API: Erro ao excluir exercício:", deleteError)
      return NextResponse.json({ error: `Erro ao excluir exercício: ${deleteError.message}` }, { status: 500 })
    }

    console.log("API: Exercício excluído com sucesso")

    return NextResponse.json({
      success: true,
      message: "Exercício excluído com sucesso",
    })
  } catch (error) {
    console.error("API: Erro ao processar solicitação:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 },
    )
  }
}
