import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { workoutId } = await request.json()

    if (!workoutId) {
      return NextResponse.json({ error: "ID da ficha não fornecido" }, { status: 400 })
    }

    console.log("API: Iniciando exclusão da ficha:", workoutId)

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

    // Verificar se a ficha existe antes de tentar excluí-la
    const { data: workout, error: workoutError } = await supabase
      .from("workout_plans")
      .select("id, trainer_id")
      .eq("id", workoutId)
      .single()

    if (workoutError) {
      console.error("API: Erro ao buscar ficha:", workoutError)
      return NextResponse.json({ error: "Ficha não encontrada" }, { status: 404 })
    }

    console.log("API: Ficha encontrada:", workout)

    // 1. Primeiro, excluir os exercícios relacionados
    console.log("API: Excluindo exercícios da ficha:", workoutId)
    const { error: exercisesError } = await supabase.from("workout_exercises").delete().eq("workout_plan_id", workoutId)

    if (exercisesError) {
      console.error("API: Erro ao excluir exercícios:", exercisesError)
      return NextResponse.json({ error: "Erro ao excluir exercícios da ficha" }, { status: 500 })
    }

    // 2. Depois, excluir a ficha
    console.log("API: Excluindo a ficha:", workoutId)
    const { error: deleteError } = await supabase.from("workout_plans").delete().eq("id", workoutId)

    if (deleteError) {
      console.error("API: Erro ao excluir ficha:", deleteError)
      return NextResponse.json({ error: `Erro ao excluir ficha: ${deleteError.message}` }, { status: 500 })
    }

    console.log("API: Ficha excluída com sucesso")

    return NextResponse.json({
      success: true,
      message: "Ficha excluída com sucesso",
    })
  } catch (error) {
    console.error("API: Erro ao processar solicitação:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 },
    )
  }
}
