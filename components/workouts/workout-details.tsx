"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Edit, Trash2, ArrowLeft, Plus, RefreshCw, Play } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"
import { AddExerciseModal } from "./add-exercise-modal"

interface WorkoutDetailsProps {
  workout: {
    id: string
    title: string
    description: string | null
    created_at: string
    client: {
      id: string
      name: string
      avatar_url: string | null
    }
    trainer: {
      id: string
      name: string
      avatar_url: string | null
    }
    exercises: {
      id: string
      sets: number
      reps: number
      rest_time: number | null
      notes: string | null
      order_index: number
      exercise: {
        id: string
        name: string
        description: string | null
        image_url: string | null
        video_url?: string | null
      }
    }[]
  }
  userType: "client" | "trainer"
  userId: string
}

export function WorkoutDetails({ workout, userType, userId }: WorkoutDetailsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false)
  const [exercises, setExercises] = useState(workout.exercises)
  const [isLoadingExercises, setIsLoadingExercises] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const isTrainer = userType === "trainer" && userId === workout.trainer.id

  const handleDelete = async () => {
    if (!isTrainer) return

    setIsDeleting(true)
    console.log("Cliente (Detalhes): Iniciando exclusão da ficha:", workout.id)

    try {
      // Usar exclusivamente a API para excluir a ficha
      const response = await fetch("/api/workouts/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workoutId: workout.id,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Cliente (Detalhes): Erro na resposta da API:", errorData)
        throw new Error(errorData.error || "Não foi possível excluir a ficha de treino")
      }

      const data = await response.json()
      console.log("Cliente (Detalhes): Resposta da API de exclusão:", data)

      toast({
        title: "Ficha excluída",
        description: "A ficha de treino foi excluída com sucesso.",
      })

      // Redirecionar para a página de treinos após a exclusão bem-sucedida
      router.push("/dashboard/workouts")
      router.refresh()
    } catch (error) {
      console.error("Cliente (Detalhes): Erro ao excluir ficha:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Não foi possível excluir a ficha de treino. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleExerciseAdded = async () => {
    // Recarregar os exercícios da ficha
    setIsLoadingExercises(true)
    setLoadError(null)

    try {
      if (!supabase) {
        throw new Error("Cliente Supabase não inicializado")
      }

      const { data, error } = await supabase
        .from("workout_exercises")
        .select(`
          id, 
          sets, 
          reps, 
          rest_time, 
          notes, 
          order_index,
          exercises:exercise_id (
            id,
            name,
            description,
            image_url,
            video_url
          )
        `)
        .eq("workout_plan_id", workout.id)
        .order("order_index", { ascending: true })

      if (error) throw error

      const formattedExercises = data.map((ex) => ({
        id: ex.id,
        sets: ex.sets,
        reps: ex.reps,
        rest_time: ex.rest_time,
        notes: ex.notes,
        order_index: ex.order_index,
        exercise: {
          id: ex.exercises.id,
          name: ex.exercises.name,
          description: ex.exercises.description,
          image_url: ex.exercises.image_url,
          video_url: ex.exercises.video_url,
        },
      }))

      setExercises(formattedExercises)
    } catch (error) {
      console.error("Erro ao recarregar exercícios:", error)
      setLoadError(error instanceof Error ? error.message : "Erro ao carregar exercícios")
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a lista de exercícios. Tente recarregar a página.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingExercises(false)
    }
  }

  const retryLoadExercises = () => {
    handleExerciseAdded()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{workout.title}</h1>
          <p className="text-muted-foreground">
            Criada em {format(new Date(workout.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        {isTrainer && (
          <div className="flex gap-2">
            <Link href={`/workouts/${workout.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Excluindo..." : "Excluir"}
            </Button>

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
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    {isDeleting ? "Excluindo..." : "Excluir"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-start">
        {/* Card de Informações */}
        <Card className="bg-[#101010] border-0">
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workout.description && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Descrição</h3>
                  <p className="text-sm text-muted-foreground">{workout.description}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium mb-2">Aluno</h3>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center mr-3">
                    {workout.client.avatar_url ? (
                      <img
                        src={workout.client.avatar_url || "/placeholder.svg"}
                        alt={workout.client.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold">{workout.client.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-sm">{workout.client.name}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Personal Trainer</h3>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center mr-3">
                    {workout.trainer.avatar_url ? (
                      <img
                        src={workout.trainer.avatar_url || "/placeholder.svg"}
                        alt={workout.trainer.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold">{workout.trainer.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-sm">{workout.trainer.name}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Exercícios</h3>
                <p className="text-sm text-muted-foreground">
                  {exercises.length} {exercises.length === 1 ? "exercício" : "exercícios"}
                </p>
              </div>

              {isTrainer && (
                <Button variant="outline" size="sm" onClick={() => setShowAddExerciseModal(true)} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Exercício
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Exercícios */}
        <Card className="bg-[#101010] border-0">
          <CardHeader>
            <CardTitle>Exercícios</CardTitle>
            <CardDescription>Lista de exercícios desta ficha de treino</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {isLoadingExercises ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : loadError ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">Erro ao carregar exercícios: {loadError}</p>
                <Button variant="outline" onClick={retryLoadExercises}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar novamente
                </Button>
              </div>
            ) : exercises.length > 0 ? (
              <div className="space-y-4">
                {exercises.map((item, index) => (
                  <Card key={item.id} className="bg-[#101010] border-0">
                    <CardHeader className="bg-[#2a2a2a] rounded-t-lg">
                      <CardTitle className="text-base font-semibold">
                        {index + 1}. {item.exercise.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* Grid de informações */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Séries</span>
                          <p className="text-xl font-semibold">{item.sets}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Repetições</span>
                          <p className="text-xl font-semibold">{item.reps}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Descanso</span>
                          <p className="text-xl font-semibold">{item.rest_time || 0}s</p>
                        </div>
                      </div>

                      {/* Descrição */}
                      {item.exercise.description && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2">Descrição</h4>
                          <p className="text-sm text-muted-foreground">{item.exercise.description}</p>
                        </div>
                      )}

                      {/* Observações */}
                      {item.notes && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2">Observações</h4>
                          <p className="text-sm text-muted-foreground">{item.notes}</p>
                        </div>
                      )}

                      {/* Área de vídeo */}
                      <div className="bg-[#0c0c0c] rounded-lg aspect-video flex items-center justify-center">
                        {item.exercise.video_url ? (
                          <video
                            controls
                            className="w-full h-full rounded-lg"
                            poster={item.exercise.image_url || "/placeholder.svg"}
                          >
                            <source src={item.exercise.video_url} type="video/mp4" />
                            Seu navegador não suporta vídeos.
                          </video>
                        ) : (
                          <div className="flex items-center justify-center">
                            <div className="bg-white/10 rounded-full p-4">
                              <Play className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">Nenhum exercício encontrado</p>
            )}
          </CardContent>
          <CardFooter>
            {isTrainer && (
              <Link href={`/workouts/${workout.id}/edit`} className="w-full">
                <Button className="w-full">Editar Ficha</Button>
              </Link>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Modal para adicionar exercício */}
      <AddExerciseModal
        workoutId={workout.id}
        open={showAddExerciseModal}
        onOpenChange={setShowAddExerciseModal}
        onExerciseAdded={handleExerciseAdded}
      />
    </div>
  )
}
