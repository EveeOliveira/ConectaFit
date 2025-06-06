"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, UserPlus, Calendar, Dumbbell } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface ClientsListProps {
  trainerId: string
}

interface Client {
  id: string
  name: string
  email: string
  avatar_url: string | null
  fitness_goals: string | null
  health_info: string | null
  session_count: number
  workout_count: number
}

export function ClientsList({ trainerId }: ClientsListProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    filterClients()
  }, [searchTerm, clients, activeTab])

  const loadClients = async () => {
    setIsLoading(true)
    try {
      // Primeiro, buscar todas as sessões e planos de treino para identificar clientes
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("training_sessions")
        .select("client_id, status")
        .eq("trainer_id", trainerId)

      if (sessionsError) throw sessionsError

      const { data: workoutsData, error: workoutsError } = await supabase
        .from("workout_plans")
        .select("client_id")
        .eq("trainer_id", trainerId)

      if (workoutsError) throw workoutsError

      // Extrair IDs de clientes únicos
      const clientIds = new Set([
        ...(sessionsData?.map((session) => session.client_id) || []),
        ...(workoutsData?.map((workout) => workout.client_id) || []),
      ])

      if (clientIds.size === 0) {
        setClients([])
        setFilteredClients([])
        setIsLoading(false)
        return
      }

      // Buscar informações de perfil para cada cliente
      const clientsData = await Promise.all(
        Array.from(clientIds).map(async (clientId) => {
          // Buscar perfil
          const { data: profileData } = await supabase
            .from("profiles")
            .select("name, email, avatar_url")
            .eq("id", clientId)
            .single()

          // Buscar dados específicos do cliente
          const { data: clientData } = await supabase
            .from("clients")
            .select("fitness_goals, health_info")
            .eq("id", clientId)
            .single()

          // Contar sessões
          const sessionCount =
            sessionsData?.filter((session) => session.client_id === clientId && session.status !== "rejected").length ||
            0

          // Contar planos de treino
          const workoutCount = workoutsData?.filter((workout) => workout.client_id === clientId).length || 0

          return {
            id: clientId,
            name: profileData?.name || "Cliente",
            email: profileData?.email || "",
            avatar_url: profileData?.avatar_url,
            fitness_goals: clientData?.fitness_goals,
            health_info: clientData?.health_info,
            session_count: sessionCount,
            workout_count: workoutCount,
          }
        }),
      )

      setClients(clientsData)
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterClients = () => {
    let filtered = [...clients]

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtrar por aba ativa
    if (activeTab === "with-sessions") {
      filtered = filtered.filter((client) => client.session_count > 0)
    } else if (activeTab === "with-workouts") {
      filtered = filtered.filter((client) => client.workout_count > 0)
    } else if (activeTab === "without-workouts") {
      filtered = filtered.filter((client) => client.workout_count === 0 && client.session_count > 0)
    }

    setFilteredClients(filtered)
  }

  // Função para truncar nome nas duas primeiras palavras
  const truncateName = (name: string) => {
    const words = name.split(" ")
    if (words.length <= 2) return name
    return words.slice(0, 2).join(" ")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar alunos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Aluno
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 bg-[#27272a] rounded-lg p-1 h-auto gap-1">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-[#0c0c0c] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#7b7b7b] rounded-md px-4 py-2 transition-all duration-200 hover:text-white"
          >
            Todos
          </TabsTrigger>
          <TabsTrigger
            value="with-sessions"
            className="data-[state=active]:bg-[#0c0c0c] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#7b7b7b] rounded-md px-4 py-2 transition-all duration-200 hover:text-white"
          >
            Com Sessões
          </TabsTrigger>
          <TabsTrigger
            value="with-workouts"
            className="data-[state=active]:bg-[#0c0c0c] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#7b7b7b] rounded-md px-4 py-2 transition-all duration-200 hover:text-white"
          >
            Com Fichas
          </TabsTrigger>
          <TabsTrigger
            value="without-workouts"
            className="data-[state=active]:bg-[#0c0c0c] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#7b7b7b] rounded-md px-4 py-2 transition-all duration-200 hover:text-white"
          >
            Sem Fichas
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="bg-[#101010] rounded-lg p-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredClients.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredClients.map((client) => (
                  <div key={client.id} className="bg-[#1a1a1a] rounded-lg overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                          {client.avatar_url ? (
                            <img
                              src={client.avatar_url || "/placeholder.svg"}
                              alt={client.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-semibold">{client.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm leading-tight">{truncateName(client.name)}</h3>
                          <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center">
                          <Calendar className="mr-1.5 h-3 w-3 text-muted-foreground" />
                          <span>{client.session_count} sessões</span>
                        </div>
                        <div className="flex items-center">
                          <Dumbbell className="mr-1.5 h-3 w-3 text-muted-foreground" />
                          <span>{client.workout_count} fichas</span>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Link href={`/clients/${client.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-xs">
                            Ver Perfil
                          </Button>
                        </Link>
                        <Link href={`/workouts/create?client=${client.id}`} className="flex-1">
                          <Button size="sm" className="w-full text-xs">
                            Nova Ficha
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum aluno encontrado</p>
                {activeTab === "all" && searchTerm === "" && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Você ainda não tem alunos. Convide alunos ou aguarde que solicitem sessões com você.
                  </p>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
