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

    // Iniciar uma transação para garantir a atomicidade das operações
    const { error: transactionError } = await supabase.rpc('delete_workout_plan', {
      p_workout_id: workoutId
    })

    if (transactionError) {
      console.error("API: Erro na transação de exclusão:", transactionError)
      return NextResponse.json({ error: "Erro ao excluir ficha e seus exercícios" }, { status: 500 })
    }

    // Verificar se a ficha foi realmente excluída
    const { data: checkWorkout, error: checkError } = await supabase
      .from("workout_plans")
      .select("id")
      .eq("id", workoutId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("API: Erro ao verificar exclusão:", checkError)
      return NextResponse.json({ error: "Erro ao verificar exclusão da ficha" }, { status: 500 })
    }

    if (checkWorkout) {
      console.error("API: Ficha ainda existe após tentativa de exclusão")
      return NextResponse.json({ error: "Ficha não foi excluída corretamente" }, { status: 500 })
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
