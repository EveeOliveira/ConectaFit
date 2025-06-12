"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TrainerSessionsProps {
  userId: string
}

interface Session {
  id: string
  client_id: string
  session_date: string
  duration: number
  location: string | null
  notes: string | null
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled"
  client: {
    name: string
    avatar_url: string | null
  }
}

export function TrainerSessions({ userId }: TrainerSessionsProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadSessions()
  }, [activeTab])

  const loadSessions = async () => {
    setIsLoading(true)
    try {
      const now = new Date().toISOString()
      let query = supabase
        .from("training_sessions")
        .select(`
        id,
        client_id,
        session_date,
        duration,
        location,
        notes,
        status
      `)
        .eq("trainer_id", userId)

      if (activeTab === "pending") {
        query = query.eq("status", "pending").order("session_date", { ascending: true })
      } else if (activeTab === "upcoming") {
        query = query.gte("session_date", now).eq("status", "accepted").order("session_date", { ascending: true })
      } else if (activeTab === "past") {
        query = query
          .lt("session_date", now)
          .or("status.eq.completed")
          .order("session_date", { ascending: false })
      } else if (activeTab === "cancelled") {
        query = query.eq("status", "cancelled").order("session_date", { ascending: false })
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      if (data) {
        const formattedSessions = await Promise.all(
          data.map(async (session) => {
            const { data: clientProfile } = await supabase
              .from("profiles")
              .select("name, avatar_url")
              .eq("id", session.client_id)
              .single()

            return {
              id: session.id,
              client_id: session.client_id,
              session_date: session.session_date,
              duration: session.duration,
              location: session.location,
              notes: session.notes,
              status: session.status,
              client: {
                name: clientProfile?.name || "Cliente",
                avatar_url: clientProfile?.avatar_url,
              },
            }
          }),
        )
        setSessions(formattedSessions)
      }
    } catch (error) {
      console.error("Erro ao carregar sessões:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateSessionStatus = async (sessionId: string, status: string) => {
    try {
      const { error } = await supabase.from("training_sessions").update({ status }).eq("id", sessionId)

      if (error) {
        throw error
      }

      toast({
        title: "Status atualizado",
        description: `A sessão foi ${status === "accepted" ? "aceita" : status === "rejected" ? "rejeitada" : "marcada como concluída"} com sucesso.`,
      })

      loadSessions()
    } catch (error) {
      console.error("Erro ao atualizar status da sessão:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da sessão.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 bg-[#27272a] rounded-lg p-1 h-auto gap-1">
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-[#0c0c0c] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#7b7b7b] rounded-md px-4 py-2 transition-all duration-200 hover:text-white"
          >
            Pendentes
          </TabsTrigger>
          <TabsTrigger
            value="upcoming"
            className="data-[state=active]:bg-[#0c0c0c] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#7b7b7b] rounded-md px-4 py-2 transition-all duration-200 hover:text-white"
          >
            Agendadas
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="data-[state=active]:bg-[#0c0c0c] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#7b7b7b] rounded-md px-4 py-2 transition-all duration-200 hover:text-white"
          >
            Concluídas
          </TabsTrigger>
          <TabsTrigger
            value="cancelled"
            className="data-[state=active]:bg-[#0c0c0c] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#7b7b7b] rounded-md px-4 py-2 transition-all duration-200 hover:text-white"
          >
            Canceladas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Solicitações Pendentes</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg p-6 hover:border-[#b4001a] transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-white">{session.client.name}</h3>
                        <p className="text-sm text-[#7b7b7b]">
                          {format(new Date(session.session_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                        <p className="text-sm text-[#7b7b7b]">Duração: {session.duration} minutos</p>
                        {session.notes && (
                          <p className="text-sm mt-2 text-[#7b7b7b]">
                            <span className="font-medium text-white">Observações:</span> {session.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="default" onClick={() => handleUpdateSessionStatus(session.id, "accepted")}>
                          Aceitar
                        </Button>
                        <Button variant="outline" onClick={() => handleUpdateSessionStatus(session.id, "rejected")}>
                          Recusar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg p-8 text-center">
                <p className="text-[#7b7b7b]">Nenhuma solicitação pendente</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Sessões Agendadas</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg p-6 hover:border-[#b4001a] transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-white">{session.client.name}</h3>
                        <p className="text-sm text-[#7b7b7b]">
                          {format(new Date(session.session_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                        <p className="text-sm text-[#7b7b7b]">Duração: {session.duration} minutos</p>
                        {session.notes && (
                          <p className="text-sm mt-2 text-[#7b7b7b]">
                            <span className="font-medium text-white">Observações:</span> {session.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="default" onClick={() => handleUpdateSessionStatus(session.id, "completed")}>
                          Marcar como concluída
                        </Button>
                        <Button variant="outline" onClick={() => handleUpdateSessionStatus(session.id, "cancelled")}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg p-8 text-center">
                <p className="text-[#7b7b7b]">Nenhuma sessão agendada</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Sessões Concluídas</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg p-6 hover:border-[#b4001a] transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-white">{session.client.name}</h3>
                        <p className="text-sm text-[#7b7b7b]">
                          {format(new Date(session.session_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                        <p className="text-sm text-[#7b7b7b]">Duração: {session.duration} minutos</p>
                        {session.notes && (
                          <p className="text-sm mt-2 text-[#7b7b7b]">
                            <span className="font-medium text-white">Observações:</span> {session.notes}
                          </p>
                        )}
                        {(session.status === "completed" || session.status === "rejected") && (
                          <p className="text-sm mt-2">
                            <span className="text-[#7b7b7b]">Status: </span>
                            <span className={session.status === "completed" ? "text-green-400" : "text-red-400"}>
                              {session.status === "completed" ? "Concluída" : "Rejeitada"}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg p-8 text-center">
                <p className="text-[#7b7b7b]">Nenhuma sessão concluída</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Sessões Canceladas</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg p-6 hover:border-[#b4001a] transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-white">{session.client.name}</h3>
                        <p className="text-sm text-[#7b7b7b]">
                          {format(new Date(session.session_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                        <p className="text-sm text-[#7b7b7b]">Duração: {session.duration} minutos</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg p-8 text-center">
                <p className="text-[#7b7b7b]">Nenhuma sessão cancelada</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
