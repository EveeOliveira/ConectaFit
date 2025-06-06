"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Calendar, Dumbbell, Search, User } from "lucide-react"
import Link from "next/link"

interface ClientDashboardProps {
  userId: string
}

interface Profile {
  name: string
  avatar_url: string | null
}

interface Session {
  id: string
  trainer_id: string
  session_date: string
  status: string
  trainer: {
    name: string
  }
}

interface WorkoutPlan {
  id: string
  title: string
  trainer: {
    name: string
  }
}

export function ClientDashboard({ userId }: ClientDashboardProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([])
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      try {
        // Carregar perfil
        const { data: profileData } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", userId)
          .single()

        setProfile(profileData)

        // Carregar próximas sessões
        const now = new Date().toISOString()
        const { data: sessionsData } = await supabase
          .from("training_sessions")
          .select(`
        id,
        trainer_id,
        session_date,
        status
      `)
          .eq("client_id", userId)
          .gte("session_date", now)
          .in("status", ["pending", "accepted"])
          .order("session_date", { ascending: true })
          .limit(3)

        if (sessionsData) {
          const formattedSessions = await Promise.all(
            sessionsData.map(async (session) => {
              const { data: trainerProfile } = await supabase
                .from("profiles")
                .select("name")
                .eq("id", session.trainer_id)
                .single()

              return {
                id: session.id,
                trainer_id: session.trainer_id,
                session_date: session.session_date,
                status: session.status,
                trainer: {
                  name: trainerProfile?.name || "Personal Trainer",
                },
              }
            }),
          )
          setUpcomingSessions(formattedSessions)
        }

        // Carregar planos de treino
        const { data: workoutData } = await supabase
          .from("workout_plans")
          .select(`
        id,
        title,
        trainer_id
      `)
          .eq("client_id", userId)
          .order("created_at", { ascending: false })
          .limit(3)

        if (workoutData) {
          const formattedWorkouts = await Promise.all(
            workoutData.map(async (workout) => {
              const { data: trainerProfile } = await supabase
                .from("profiles")
                .select("name")
                .eq("id", workout.trainer_id)
                .single()

              return {
                id: workout.id,
                title: workout.title,
                trainer: {
                  name: trainerProfile?.name || "Personal Trainer",
                },
              }
            }),
          )
          setWorkoutPlans(formattedWorkouts)
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [userId, supabase])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Olá, {profile?.name}</h1>
      </div>

      {/* Action Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Buscar Personal Card */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Buscar Personal</h3>
            <Search className="h-5 w-5 text-[#71717a]" />
          </div>
          <Link href="/search">
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg">Encontrar Personal</Button>
          </Link>
        </div>

        {/* Sessões Card */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Sessões</h3>
            <Calendar className="h-5 w-5 text-[#71717a]" />
          </div>
          <Link href="/sessions">
            <Button
              variant="outline"
              className="w-full border-[#27272a] bg-transparent text-white hover:bg-[#27272a] rounded-lg"
            >
              Ver Sessões
            </Button>
          </Link>
        </div>

        {/* Treinos Card */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Treinos</h3>
            <Dumbbell className="h-5 w-5 text-[#71717a]" />
          </div>
          <Link href="/workouts">
            <Button
              variant="outline"
              className="w-full border-[#27272a] bg-transparent text-white hover:bg-[#27272a] rounded-lg"
            >
              Ver Treinos
            </Button>
          </Link>
        </div>

        {/* Perfil Card */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Perfil</h3>
            <User className="h-5 w-5 text-[#71717a]" />
          </div>
          <Link href="/profile">
            <Button
              variant="outline"
              className="w-full border-[#27272a] bg-transparent text-white hover:bg-[#27272a] rounded-lg"
            >
              Ver Perfil
            </Button>
          </Link>
        </div>
      </div>

      {/* Content Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Próximas Sessões Card */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-xl font-medium text-white mb-2">Próximas Sessões</h3>
            <p className="text-[#a1a1aa] text-sm">Suas próximas sessões de treino agendadas</p>
          </div>

          <div className="space-y-4">
            {upcomingSessions.length > 0 ? (
              upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-3 border-b border-[#27272a] last:border-0"
                >
                  <div>
                    <p className="font-medium text-white">
                      {new Date(session.session_date).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-sm text-[#a1a1aa]">Com {session.trainer.name}</p>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        session.status === "accepted" ? "bg-green-900 text-green-300" : "bg-yellow-900 text-yellow-300"
                      }`}
                    >
                      {session.status === "accepted" ? "Confirmado" : "Pendente"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-[#a1a1aa]">Nenhuma sessão agendada</p>
              </div>
            )}
          </div>
        </div>

        {/* Fichas de Treino Card */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-xl font-medium text-white mb-2">Fichas de Treino</h3>
            <p className="text-[#a1a1aa] text-sm">Suas fichas de treino mais recentes</p>
          </div>

          <div className="space-y-4">
            {workoutPlans.length > 0 ? (
              workoutPlans.map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between py-3 border-b border-[#27272a] last:border-0"
                >
                  <div>
                    <p className="font-medium text-white">{workout.title}</p>
                    <p className="text-sm text-[#a1a1aa]">Por {workout.trainer.name}</p>
                  </div>
                  <Link href={`/workouts/${workout.id}`}>
                    <Button variant="ghost" size="sm" className="text-[#a1a1aa] hover:text-white hover:bg-[#27272a]">
                      Ver
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-[#a1a1aa]">Nenhuma ficha de treino disponível</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
