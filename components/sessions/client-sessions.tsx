"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ClientSessionsProps {
  userId: string
}

interface Session {
  id: string
  trainer_id: string
  session_date: string
  duration: number
  location: string | null
  notes: string | null
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled"
  trainer: {
    name: string
    avatar_url: string | null
  }
}

export function ClientSessions({ userId }: ClientSessionsProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [activeTab, setActiveTab] = useState("upcoming")
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
        trainer_id,
        session_date,
        duration,
        location,
        notes,
        status
      `)
        .eq("client_id", userId)

      if (activeTab === "upcoming") {
        query = query
          .gte("session_date", now)
          .in("status", ["pending", "accepted"])
          .order("session_date", { ascending: true })
      } else if (activeTab === "past") {
        query = query
          .lt("session_date", now)
          .or("status.eq.completed,status.eq.rejected")
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
            const { data: trainerProfile } = await supabase
              .from("profiles")
              .select("name, avatar_url")
              .eq("id", session.trainer_id)
              .single()

            return {
              id: session.id,
              trainer_id: session.trainer_id,
              session_date: session.session_date,
              duration: session.duration,
              location: session.location,
              notes: session.notes,
              status: session.status,
              trainer: {
                name: trainerProfile?.name || "Personal Trainer",
                avatar_url: trainerProfile?.avatar_url,
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

  // Implementação direta usando o cliente Supabase
  const cancelSessionDirectly = async (sessionId: string) => {
    if (isCancelling) return false

    setIsCancelling(true)
    console.log(`Iniciando cancelamento direto da sessão: ${sessionId}`)

    try {
      // Atualizar o status para cancelado
      const { error } = await supabase
        .from("training_sessions")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId)
        .eq("client_id", userId) // Garantir que a sessão pertence ao usuário atual

      if (error) {
        console.error("Erro ao cancelar sessão:", error)
        throw new Error(`Falha ao cancelar: ${error.message}`)
      }

      // Verificar se a atualização foi bem-sucedida
      const { data: verifyData, error: verifyError } = await supabase
        .from("training_sessions")
        .select("status")
        .eq("id", sessionId)
        .single()

      if (verifyError) {
        console.error("Erro ao verificar atualização:", verifyError)
      } else if (verifyData.status !== "cancelled") {
        console.warn("Aviso: O status não foi alterado para 'cancelled':", verifyData)

        // Tentar uma abordagem alternativa - atualizar apenas o status
        const { error: retryError } = await supabase
          .from("training_sessions")
          .update({ status: "cancelled" })
          .eq("id", sessionId)
          .eq("client_id", userId)

        if (retryError) {
          console.error("Erro na segunda tentativa:", retryError)
          throw new Error("Não foi possível cancelar a sessão após múltiplas tentativas")
        }
      }

      // Atualizar a interface localmente
      setSessions((prevSessions) => prevSessions.filter((session) => session.id !== sessionId))

      toast({
        title: "Sessão cancelada",
        description: "A sessão foi cancelada com sucesso.",
      })

      // Mudar para a aba de canceladas e recarregar as sessões
      setActiveTab("cancelled")

      return true
    } catch (error) {
      console.error("Erro detalhado ao cancelar sessão:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao cancelar sessão",
        variant: "destructive",
      })
      return false
    } finally {
      setIsCancelling(false)
    }
  }

  // Manipulador do clique no botão de cancelar
  const handleCancelButtonClick = async (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (isCancelling) return

    console.log(`Botão de cancelamento clicado para sessão: ${sessionId}`)

    // Atualizar a interface imediatamente para feedback instantâneo
    const sessionToCancel = sessions.find((s) => s.id === sessionId)
    if (!sessionToCancel) return

    // Remover a sessão da lista atual
    setSessions((prevSessions) => prevSessions.filter((session) => session.id !== sessionId))

    // Tentar cancelar a sessão
    const success = await cancelSessionDirectly(sessionId)

    if (!success) {
      // Se falhar, recarregar as sessões para restaurar o estado
      loadSessions()
    }
  }

  // Função para renderizar a lista de sessões
  const renderSessionsList = (sessions: Session[]) => {
    if (sessions.length === 0) {
      return (
        <div className="bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg p-8 text-center">
          <p className="text-[#7b7b7b]">Nenhuma sessão encontrada</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-[#0c0c0c] border border-[#2a2a2a] rounded-lg p-6 hover:border-[#b4001a] transition-colors"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-medium text-white">{session.trainer.name}</h3>
                <p className="text-sm text-[#7b7b7b]">
                  {format(new Date(session.session_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
                <p className="text-sm text-[#7b7b7b]">Duração: {session.duration} minutos</p>
                <p className="text-sm mt-1">
                  <span className="text-[#7b7b7b]">Status: </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      session.status === "accepted"
                        ? "bg-green-900/30 text-green-400 border border-green-800"
                        : session.status === "pending"
                          ? "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
                          : "bg-red-900/30 text-red-400 border border-red-800"
                    }`}
                  >
                    {session.status === "accepted"
                      ? "Confirmada"
                      : session.status === "pending"
                        ? "Pendente"
                        : "Cancelada"}
                  </span>
                </p>
                <p className="text-xs mt-1 text-[#7b7b7b]">ID: {session.id}</p>
              </div>
              {activeTab === "upcoming" && (
                <div>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={(e) => handleCancelButtonClick(e, session.id)}
                    disabled={isCancelling}
                    className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                  >
                    {isCancelling ? "Cancelando..." : "Cancelar"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 bg-[#27272a] rounded-lg p-1 h-auto gap-1">
          <TabsTrigger
            value="upcoming"
            className="data-[state=active]:bg-[#0c0c0c] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#7b7b7b] rounded-md px-4 py-2 transition-all duration-200 hover:text-white"
          >
            Próximas
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

        <TabsContent value="upcoming" className="mt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">Próximas Sessões</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              renderSessionsList(sessions)
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
            ) : (
              renderSessionsList(sessions)
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
            ) : (
              renderSessionsList(sessions)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
