"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Calendar, Dumbbell, Users, User } from "lucide-react"
import Link from "next/link"

interface TrainerDashboardProps {
  userId: string
}

interface Profile {
  name: string
  avatar_url: string | null
}

interface Session {
  id: string
  client_id: string
  session_date: string
  status: string
  client: {
    name: string
  }
}

interface Client {
  id: string
  name: string
}

export function TrainerDashboard({ userId }: TrainerDashboardProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [pendingRequests, setPendingRequests] = useState(0)
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
        client_id,
        session_date,
        status
      `)
          .eq("trainer_id", userId)
          .gte("session_date", now)
          .eq("status", "accepted")
          .order("session_date", { ascending: true })
          .limit(3)

        if (sessionsData) {
          const formattedSessions = await Promise.all(
            sessionsData.map(async (session) => {
              const { data: clientProfile } = await supabase
                .from("profiles")
                .select("name")
                .eq("id", session.client_id)
                .single()

              return {
                id: session.id,
                client_id: session.client_id,
                session_date: session.session_date,
                status: session.status,
                client: {
                  name: clientProfile?.name || "Cliente",
                },
              }
            }),
          )
          setUpcomingSessions(formattedSessions)
        }

        // Contar solicitações pendentes
        const { count } = await supabase
          .from("training_sessions")
          .select("id", { count: "exact", head: true })
          .eq("trainer_id", userId)
          .eq("status", "pending")

        setPendingRequests(count || 0)

        // Carregar clientes ativos
        const { data: workoutPlansData } = await supabase
          .from("workout_plans")
          .select(`
        client_id
      `)
          .eq("trainer_id", userId)
          .order("created_at", { ascending: false })

        if (workoutPlansData) {
          // Extrair IDs de clientes únicos
          const uniqueClientIds = [...new Set(workoutPlansData.map((item) => item.client_id))]

          // Buscar informações de perfil para cada cliente
          const clientsData = await Promise.all(
            uniqueClientIds.slice(0, 5).map(async (clientId) => {
              const { data: clientProfile } = await supabase.from("profiles").select("name").eq("id", clientId).single()

              return {
                id: clientId,
                name: clientProfile?.name || "Cliente",
              }
            }),
          )

          setClients(clientsData)
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [userId])

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
        {/* Alunos Card */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Alunos</h3>
            <Users className="h-5 w-5 text-[#71717a]" />
          </div>
          <Link href="/clients">
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg">Gerenciar Alunos</Button>
          </Link>
        </div>

        {/* Sessões Card */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-white">Sessões</h3>
            <Calendar className="h-5 w-5 text-[#71717a]" />
          </div>
          <div className="mb-4">
            <div className="text-2xl font-bold text-white">{pendingRequests}</div>
            <p className="text-xs text-[#a1a1aa]">Solicitações pendentes</p>
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
              Gerenciar Treinos
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
              Editar Perfil
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
                    <p className="text-sm text-[#a1a1aa]">Com {session.client.name}</p>
                  </div>
                  <Link href={`/sessions/${session.id}`}>
                    <Button variant="ghost" size="sm" className="text-[#a1a1aa] hover:text-white hover:bg-[#27272a]">
                      Detalhes
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-[#a1a1aa]">Nenhuma sessão agendada</p>
              </div>
            )}
          </div>
        </div>

        {/* Alunos Recentes Card */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-xl font-medium text-white mb-2">Alunos Recentes</h3>
            <p className="text-[#a1a1aa] text-sm">Seus alunos mais recentes</p>
          </div>

          <div className="space-y-4">
            {clients.length > 0 ? (
              clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between py-3 border-b border-[#27272a] last:border-0"
                >
                  <div>
                    <p className="font-medium text-white">{client.name}</p>
                  </div>
                  <Link href={`/clients/${client.id}`}>
                    <Button variant="ghost" size="sm" className="text-[#a1a1aa] hover:text-white hover:bg-[#27272a]">
                      Ver Perfil
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-[#a1a1aa]">Nenhum aluno ainda</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
