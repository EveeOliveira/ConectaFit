import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, userType, fitnessGoals, specialization, experience, hourlyRate, bio } =
      await request.json()

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

    // 1. Criar o usuário na autenticação com confirmação automática
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar o email automaticamente
      user_metadata: {
        name,
        user_type: userType,
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Falha ao criar usuário" }, { status: 400 })
    }

    // 2. Criar o perfil do usuário
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      name,
      email,
      user_type: userType,
    })

    if (profileError) {
      console.error("Erro detalhado ao criar perfil:", profileError)
      return NextResponse.json({ error: `Erro ao criar perfil: ${profileError.message}` }, { status: 400 })
    }

    // 3. Criar dados específicos baseados no tipo de usuário
    if (userType === "client") {
      const { error: clientError } = await supabase.from("clients").insert({
        id: authData.user.id,
        fitness_goals: fitnessGoals || null,
      })

      if (clientError) {
        console.error("Erro ao criar cliente:", clientError)
        return NextResponse.json({ error: `Erro ao criar cliente: ${clientError.message}` }, { status: 400 })
      }
    } else {
      const { error: trainerError } = await supabase.from("trainers").insert({
        id: authData.user.id,
        specialization: specialization || null,
        experience_years: Number(experience) || 0,
        hourly_rate: Number(hourlyRate) || 0,
        bio: bio || null,
        location: null, // Inicialmente null, será atualizado posteriormente
      })

      if (trainerError) {
        console.error("Erro ao criar trainer:", trainerError)
        return NextResponse.json({ error: `Erro ao criar trainer: ${trainerError.message}` }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true, message: "Conta criada com sucesso!" })
  } catch (error: any) {
    console.error("Erro completo:", error)
    return NextResponse.json({ error: error.message || "Ocorreu um erro ao criar a conta" }, { status: 500 })
  }
}
