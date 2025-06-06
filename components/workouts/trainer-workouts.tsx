"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface TrainerWorkoutsProps {
  userId: string
}

interface WorkoutPlan {
  id: string
  title: string
  description: string | null
  created_at: string
  client: {
    id: string
    name: string
  }
  exerciseCount: number
}

export function TrainerWorkouts({ userId }: TrainerWorkoutsProps) {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadWorkouts()
  }, [userId])

  async function loadWorkouts() {
    setIsLoading(true)
    try {
      const { data: workoutData, error } = await supabase
        .from("workout_plans")
        .select(`
          id,
          title,
          description,
          created_at,
          client_id
        `)
        .eq("trainer_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      if (workoutData) {
        const workoutsWithDetails = await Promise.all(
          workoutData.map(async (workout) => {
            // Buscar informações do cliente
            let clientName = "Cliente"
            try {
              const { data: clientData, error: clientError } = await supabase
                .from("profiles")
                .select("name")
                .eq("id", workout.client_id)
                .single()

              if (clientError) {
                console.error("Erro ao buscar nome do cliente:", clientError)
              } else if (clientData) {
                clientName = clientData.name
              }
            } catch (error) {
              console.error("Erro ao buscar nome do cliente:", error)
            }

            // Contar exercícios do plano
            const { count } = await supabase
              .from("workout_exercises")
              .select("id", { count: "exact", head: true })
              .eq("workout_plan_id", workout.id)

            return {
              id: workout.id,
              title: workout.title,
              description: workout.description,
              created_at: workout.created_at,
              client: {
                id: workout.client_id,
                name: clientName,
              },
              exerciseCount: count || 0,
            }
          }),
        )

        setWorkoutPlans(workoutsWithDetails)
      }
    } catch (error) {
      console.error("Erro ao carregar treinos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as fichas de treino.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteWorkout = async () => {
    if (!workoutToDelete) return

    setIsDeleting(true)
    console.log("Cliente: Iniciando exclusão da ficha:", workoutToDelete)

    try {
      // Usar exclusivamente a API para excluir a ficha
      const response = await fetch("/api/workouts/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workoutId: workoutToDelete,
        }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível excluir a ficha de treino")
      }

      console.log("Cliente: Resposta da API de exclusão:", data)

      // Verificar se a ficha ainda existe no banco de dados
      const { data: checkWorkout } = await supabase
        .from("workout_plans")
        .select("id")
        .eq("id", workoutToDelete)
        .single()

      if (checkWorkout) {
        console.error("Cliente: A ficha ainda existe após a tentativa de exclusão")
        throw new Error("A ficha não foi excluída do banco de dados")
      }

      toast({
        title: "Ficha excluída",
        description: "A ficha de treino foi excluída com sucesso.",
      })

      // Atualizar a lista de fichas localmente
      setWorkoutPlans(workoutPlans.filter((workout) => workout.id !== workoutToDelete))

      // Forçar uma atualização da página para garantir que os dados estejam sincronizados
      router.refresh()
    } catch (error) {
      console.error("Cliente: Erro ao excluir ficha:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Não foi possível excluir a ficha de treino. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setWorkoutToDelete(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link href="/workouts/create">
          <Button>Criar Nova Ficha</Button>
        </Link>
      </div>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ficha de treino</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ficha de treino? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWorkout} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {workoutPlans.length > 0 ? (
        workoutPlans.map((workout) => (
          <Card key={workout.id} className="bg-[#101010] border-0">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <CardTitle>{workout.title}</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Criado em {format(new Date(workout.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>
              <div className="text-sm">Para {workout.client.name}</div>
            </CardHeader>
            <CardContent>
              {workout.description && <p className="mb-4">{workout.description}</p>}
              <p className="text-sm text-muted-foreground">
                {workout.exerciseCount} {workout.exerciseCount === 1 ? "exercício" : "exercícios"}
              </p>
              <div className="mt-4 flex gap-2">
                <Link href={`/workouts/${workout.id}`}>
                  <Button variant="outline">Ver detalhes</Button>
                </Link>
                <Link href={`/workouts/${workout.id}/edit`}>
                  <Button>Editar</Button>
                </Link>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setWorkoutToDelete(workout.id)
                    setShowDeleteDialog(true)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card className="bg-[#101010] border-0">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Você ainda não criou fichas de treino</p>
            <div className="mt-4">
              <Link href="/workouts/create">
                <Button>Criar Primeira Ficha</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
