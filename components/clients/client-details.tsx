"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Calendar, Dumbbell, Mail, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ClientDetailsProps {
  clientId: string
  trainerId: string
}

interface Client {
  id: string
  name: string
  email: string
  avatar_url: string | null
  fitness_goals: string | null
  health_info: string | null
}

interface Session {
  id: string
  session_date: string
  duration: number
  status: string
  notes: string | null
}

interface WorkoutPlan {
  id: string
  title: string
  description: string | null
  created_at: string
  exercise_count: number
}

export function ClientDetails({ clientId, trainerId }: ClientDetailsProps) {
  const [client, setClient] = useState<Client | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadClientData()
  }, [])

  const loadClientData = async () => {
    setIsLoading(true)
    try {
      // Carregar perfil do cliente
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("name, email, avatar_url")
        .eq("id", clientId)
        .single()

      if (profileError) throw profileError

      // Carregar dados específicos do cliente
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("fitness_goals, health_info")
        .eq("id", clientId)
        .single()

      if (clientError) throw clientError

      setClient({
        id: clientId,
        name: profileData.name,
        email: profileData.email,
        avatar_url: profileData.avatar_url,
        fitness_goals: clientData.fitness_goals,
        health_info: clientData.health_info,
      })

      // Carregar sessões
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("training_sessions")
        .select("id, session_date, duration, status, notes")
        .eq("trainer_id", trainerId)
        .eq("client_id", clientId)
        .order("session_date", { ascending: false })

      if (sessionsError) throw sessionsError

      setSessions(sessionsData || [])

      // Carregar planos de treino
      const { data: workoutsData, error: workoutsError } = await supabase
        .from("workout_plans")
        .select("id, title, description, created_at")
        .eq("trainer_id", trainerId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })

      if (workoutsError) throw workoutsError

      // Para cada plano de treino, contar exercícios
      const workoutsWithExerciseCounts = await Promise.all(
        (workoutsData || []).map(async (workout) => {
          const { count } = await supabase
            .from("workout_exercises")
            .select("id", { count: "exact", head: true })
            .eq("workout_plan_id", workout.id)

          return {
            ...workout,
            exercise_count: count || 0,
          }
        }),
      )

      setWorkouts(workoutsWithExerciseCounts)
    } catch (error) {
      console.error("Erro ao carregar dados do cliente:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do cliente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Cliente não encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-muted-foreground">Perfil do aluno</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/workouts/create?client=${clientId}`}>
            <Button>
              <Dumbbell className="mr-2 h-4 w-4" />
              Nova Ficha
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="h-32 w-32 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  {client.avatar_url ? (
                    <img
                      src={client.avatar_url || "/placeholder.svg"}
                      alt={client.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{client.name}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{sessions.length} sessões</span>
                </div>
                <div className="flex items-center">
                  <Dumbbell className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{workouts.length} fichas de treino</span>
                </div>
              </div>

              {(client.fitness_goals || client.health_info) && (
                <div className="pt-4 border-t space-y-4">
                  {client.fitness_goals && (
                    <div>
                      <h4 className="text-sm font-medium">Objetivos Fitness</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{client.fitness_goals}</p>
                    </div>
                  )}
                  {client.health_info && (
                    <div>
                      <h4 className="text-sm font-medium">Informações de Saúde</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{client.health_info}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <Tabs defaultValue="sessions">
            <TabsList>
              <TabsTrigger value="sessions">Sessões</TabsTrigger>
              <TabsTrigger value="workouts">Fichas de Treino</TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Sessões</CardTitle>
                  <CardDescription>Sessões de treino com este aluno</CardDescription>
                </CardHeader>
                <CardContent>
                  {sessions.length > 0 ? (
                    <div className="space-y-4">
                      {sessions.map((session) => (
                        <div key={session.id} className="border rounded-lg p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                              <p className="font-medium">
                                {format(new Date(session.session_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                                  locale: ptBR,
                                })}
                              </p>
                              <p className="text-sm">Duração: {session.duration} minutos</p>
                              <p className="text-sm">
                                Status:{" "}
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    session.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : session.status === "accepted"
                                        ? "bg-blue-100 text-blue-800"
                                        : session.status === "pending"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : session.status === "cancelled"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {session.status === "completed"
                                    ? "Concluída"
                                    : session.status === "accepted"
                                      ? "Confirmada"
                                      : session.status === "pending"
                                        ? "Pendente"
                                        : session.status === "cancelled"
                                          ? "Cancelada"
                                          : session.status}
                                </span>
                              </p>
                              {session.notes && <p className="text-sm mt-2">Notas: {session.notes}</p>}
                            </div>
                            <div>
                              <Link href={`/sessions/${session.id}`}>
                                <Button variant="outline" size="sm">
                                  Detalhes
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">Nenhuma sessão encontrada</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workouts" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fichas de Treino</CardTitle>
                  <CardDescription>Fichas de treino criadas para este aluno</CardDescription>
                </CardHeader>
                <CardContent>
                  {workouts.length > 0 ? (
                    <div className="space-y-4">
                      {workouts.map((workout) => (
                        <div key={workout.id} className="border rounded-lg p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                              <p className="font-medium">{workout.title}</p>
                              <p className="text-sm text-muted-foreground">
                                Criada em{" "}
                                {format(new Date(workout.created_at), "dd 'de' MMMM 'de' yyyy", {
                                  locale: ptBR,
                                })}
                              </p>
                              <p className="text-sm">
                                {workout.exercise_count} {workout.exercise_count === 1 ? "exercício" : "exercícios"}
                              </p>
                              {workout.description && <p className="text-sm mt-2">Descrição: {workout.description}</p>}
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/workouts/${workout.id}`}>
                                <Button variant="outline" size="sm">
                                  Ver
                                </Button>
                              </Link>
                              <Link href={`/workouts/${workout.id}/edit`}>
                                <Button size="sm">Editar</Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-4">Nenhuma ficha de treino encontrada</p>
                      <Link href={`/workouts/create?client=${clientId}`}>
                        <Button>Criar Primeira Ficha</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
