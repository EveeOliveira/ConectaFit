import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { workoutId } = await request.json()

    if (!workoutId) {
      console.error("API: ID da ficha não fornecido")
      return NextResponse.json({ error: "ID da ficha não fornecido" }, { status: 400 })
    }

    console.log("API: Iniciando exclusão da ficha:", workoutId)

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Verificar a sessão do usuário
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("API: Erro ao verificar sessão:", sessionError)
      return NextResponse.json({ error: "Erro ao verificar sessão" }, { status: 401 })
    }

    if (!session) {
      console.error("API: Nenhuma sessão encontrada")
      return NextResponse.json({ error: "Não autorizado - Sessão não encontrada" }, { status: 401 })
    }

    console.log("API: Sessão válida para o usuário:", session.user.id)

    // Verificar se a ficha existe e se o usuário é o trainer responsável
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

    // Verificar se o usuário é o trainer responsável pela ficha
    if (workout.trainer_id !== session.user.id) {
      console.error("API: Tentativa de exclusão não autorizada. Trainer ID:", workout.trainer_id, "User ID:", session.user.id)
      return NextResponse.json({ error: "Não autorizado - Você não é o trainer responsável por esta ficha" }, { status: 403 })
    }

    console.log("API: Autorização confirmada para o trainer:", session.user.id)

    // 1. Primeiro, excluir os exercícios relacionados
    console.log("API: Excluindo exercícios da ficha:", workoutId)
    const { error: exercisesError } = await supabase.from("workout_exercises").delete().eq("workout_plan_id", workoutId)

    if (exercisesError) {
      console.error("API: Erro ao excluir exercícios:", exercisesError)
      return NextResponse.json({ error: "Erro ao excluir exercícios da ficha" }, { status: 500 })
    }

    console.log("API: Exercícios excluídos com sucesso")

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
