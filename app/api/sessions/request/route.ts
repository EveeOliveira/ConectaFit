import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { Database } from "@/lib/database.types"

type TrainingSession = Database["public"]["Tables"]["training_sessions"]["Insert"]

export async function POST(request: Request) {
  try {
    const { trainerId, date, time } = await request.json()

    if (!trainerId || !date || !time) {
      return NextResponse.json(
        { error: "Dados incompletos. É necessário fornecer trainerId, date e time." },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Combinar data e hora em um único objeto Date
    const [year, month, day] = date.split("-").map(Number)
    const [hours, minutes] = time.split(":").map(Number)
    const sessionDate = new Date(year, month - 1, day, hours, minutes)

    // Inserir a sessão no banco de dados
    const newSession: TrainingSession = {
      client_id: session.user.id,
      trainer_id: trainerId,
      session_date: sessionDate.toISOString(),
      duration: 60, // 1 hora
      status: "pending",
    }

    const { error } = await supabase.from("training_sessions").insert(newSession)

    if (error) {
      console.error("Erro ao criar sessão:", error)
      return NextResponse.json(
        { error: "Erro ao criar sessão. Por favor, tente novamente." },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: "Sessão solicitada com sucesso" })
  } catch (error) {
    console.error("Erro ao processar solicitação:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
} 