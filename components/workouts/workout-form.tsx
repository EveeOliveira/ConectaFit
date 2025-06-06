"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Plus, GripVertical, RefreshCw } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
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

interface Client {
  id: string
  name: string
}

interface Exercise {
  id: string
  name: string
}

interface WorkoutExercise {
  id: string
  exercise_id: string
  sets: number
  reps: number
  rest_time?: number
  notes?: string
  order_index: number
  name?: string // Nome do exercício para exibição
}

interface WorkoutFormProps {
  trainerId: string
  clients: Client[]
  exercises: Exercise[]
  preSelectedClientId?: string
  workout?: {
    id: string
    title: string
    description: string | null
    client_id: string
    exercises: WorkoutExercise[]
  }
}

export function WorkoutForm({ trainerId, clients, exercises, preSelectedClientId, workout }: WorkoutFormProps) {
  const [title, setTitle] = useState(workout?.title || "")
  const [description, setDescription] = useState(workout?.description || "")
  const [clientId, setClientId] = useState(preSelectedClientId || workout?.client_id || "")
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [exerciseNameToDelete, setExerciseNameToDelete] = useState<string>("")
  const [isDeletingExercise, setIsDeletingExercise] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  // Inicializar os exercícios quando o componente é montado ou quando workout muda
  useEffect(() => {
    let isMounted = true

    const initializeExercises = async () => {
      setIsInitializing(true)
      setInitError(null)

      try {
        // Verificar se o cliente Supabase está disponível
        if (!supabase) {
          throw new Error("Cliente Supabase não inicializado")
        }

        if (workout?.exercises && workout.exercises.length > 0) {
          console.log("Inicializando exercícios existentes:", workout.exercises.length)

          // Adicionar o nome do exercício para cada exercício da ficha
          const exercisesWithNames = workout.exercises.map((ex) => {
            const exerciseDetails = exercises.find((e) => e.id === ex.exercise_id)
            return {
              ...ex,
              name: exerciseDetails?.name || "Exercício desconhecido",
            }
          })

          if (isMounted) {
            setWorkoutExercises(exercisesWithNames)
          }
        } else {
          console.log("Inicializando com array vazio de exercícios")
          if (isMounted) {
            setWorkoutExercises([])
          }
        }
      } catch (error) {
        console.error("Erro ao inicializar exercícios:", error)
        if (isMounted) {
          setInitError(error instanceof Error ? error.message : "Erro ao inicializar exercícios")
          toast({
            title: "Erro ao carregar exercícios",
            description: "Não foi possível carregar os exercícios da ficha. Tente novamente.",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false)
        }
      }
    }

    initializeExercises()

    return () => {
      isMounted = false
    }
  }, [workout, toast, exercises])

  const handleAddExercise = () => {
    // Usar um prefixo para identificar IDs temporários
    const newExercise: WorkoutExercise = {
      id: `temp-${uuidv4()}`, // Gerar um ID temporário com prefixo para o novo exercício
      exercise_id: "",
      sets: 3,
      reps: 12,
      rest_time: 60,
      notes: "",
      order_index: workoutExercises.length,
    }
    setWorkoutExercises((prev) => [...prev, newExercise])
  }

  const confirmDeleteExercise = (id: string) => {
    const exercise = workoutExercises.find((ex) => ex.id === id)
    const exerciseName =
      exercise?.name || exercises.find((e) => e.id === exercise?.exercise_id)?.name || "este exercício"

    setExerciseToDelete(id)
    setExerciseNameToDelete(exerciseName)
    setShowDeleteDialog(true)
  }

  const handleRemoveExercise = async () => {
    if (!exerciseToDelete) return

    setIsDeletingExercise(true)

    try {
      // Se o ID não começa com "temp-", é um exercício existente no banco
      // Vamos excluí-lo imediatamente do banco de dados
      if (!exerciseToDelete.startsWith("temp-")) {
        console.log("Excluindo exercício do banco de dados:", exerciseToDelete)

        // Chamar a API para excluir o exercício
        const response = await fetch("/api/workouts/exercises/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ exerciseId: exerciseToDelete }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erro ao excluir exercício")
        }

        console.log("Exercício excluído com sucesso do banco de dados")
      }

      // Remover do estado local
      setWorkoutExercises((prev) => prev.filter((ex) => ex.id !== exerciseToDelete))

      // Mostrar toast de confirmação
      toast({
        title: "Exercício removido",
        description: "O exercício foi removido da ficha.",
      })
    } catch (error) {
      console.error("Erro ao excluir exercício:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível excluir o exercício. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      // Limpar o estado
      setExerciseToDelete(null)
      setShowDeleteDialog(false)
      setIsDeletingExercise(false)
    }
  }

  const handleExerciseChange = (id: string, field: keyof WorkoutExercise, value: any) => {
    setWorkoutExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !clientId || workoutExercises.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios e adicione pelo menos um exercício.",
        variant: "destructive",
      })
      return
    }

    // Verificar se todos os exercícios têm um exercise_id selecionado
    const hasInvalidExercises = workoutExercises.some((ex) => !ex.exercise_id)
    if (hasInvalidExercises) {
      toast({
        title: "Exercícios inválidos",
        description: "Selecione um exercício para cada item da ficha.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (!supabase) {
        throw new Error("Cliente Supabase não inicializado")
      }

      if (workout) {
        console.log("Atualizando ficha existente:", workout.id)
        console.log("Total de exercícios a serem salvos:", workoutExercises.length)

        try {
          // 1. Atualizar a ficha
          const { error: updateError } = await supabase
            .from("workout_plans")
            .update({
              title,
              description: description || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", workout.id)

          if (updateError) {
            console.error("Erro ao atualizar ficha:", updateError)
            throw updateError
          }

          // 2. Separar exercícios para inserção e atualização
          const exercisesToInsert = workoutExercises
            .filter((ex) => ex.id.startsWith("temp-"))
            .map((ex, index) => ({
              workout_plan_id: workout.id,
              exercise_id: ex.exercise_id,
              sets: ex.sets,
              reps: ex.reps,
              rest_time: ex.rest_time || null,
              notes: ex.notes || null,
              order_index: index,
            }))

          const exercisesToUpdate = workoutExercises
            .filter((ex) => !ex.id.startsWith("temp-"))
            .map((ex, index) => ({
              id: ex.id,
              exercise_id: ex.exercise_id,
              sets: ex.sets,
              reps: ex.reps,
              rest_time: ex.rest_time || null,
              notes: ex.notes || null,
              order_index: index,
            }))

          console.log(`Exercícios para inserir: ${exercisesToInsert.length}`)
          console.log(`Exercícios para atualizar: ${exercisesToUpdate.length}`)

          // 3. Inserir novos exercícios
          if (exercisesToInsert.length > 0) {
            const { error: insertError } = await supabase.from("workout_exercises").insert(exercisesToInsert)

            if (insertError) {
              console.error("Erro ao inserir novos exercícios:", insertError)
              throw insertError
            }
          }

          // 4. Atualizar exercícios existentes
          for (const ex of exercisesToUpdate) {
            const { error: updateExError } = await supabase
              .from("workout_exercises")
              .update({
                exercise_id: ex.exercise_id,
                sets: ex.sets,
                reps: ex.reps,
                rest_time: ex.rest_time,
                notes: ex.notes,
                order_index: ex.order_index,
                updated_at: new Date().toISOString(),
              })
              .eq("id", ex.id)

            if (updateExError) {
              console.error(`Erro ao atualizar exercício ${ex.id}:`, updateExError)
              throw updateExError
            }
          }
        } catch (error) {
          console.error("Erro durante a atualização da ficha:", error)
          throw error
        }

        toast({
          title: "Ficha atualizada",
          description: "A ficha de treino foi atualizada com sucesso.",
        })

        // Redirecionar para a página de detalhes da ficha e forçar atualização
        router.push(`/dashboard/workouts/${workout.id}`)
        router.refresh()
      } else {
        // Criar nova ficha
        const { data: workoutData, error: workoutError } = await supabase
          .from("workout_plans")
          .insert({
            trainer_id: trainerId,
            client_id: clientId,
            title,
            description: description || null,
          })
          .select()

        if (workoutError) throw workoutError

        const workoutId = workoutData[0].id

        // Inserir exercícios
        const exercisesToInsert = workoutExercises.map((ex, index) => ({
          workout_plan_id: workoutId,
          exercise_id: ex.exercise_id,
          sets: ex.sets,
          reps: ex.reps,
          rest_time: ex.rest_time || null,
          notes: ex.notes || null,
          order_index: index,
        }))

        const { error: exercisesError } = await supabase.from("workout_exercises").insert(exercisesToInsert)

        if (exercisesError) throw exercisesError

        toast({
          title: "Ficha criada",
          description: "A ficha de treino foi criada com sucesso.",
        })

        router.push(`/workouts/${workoutId}`)
      }
    } catch (error) {
      console.error("Erro ao salvar ficha:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Não foi possível salvar a ficha de treino. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const retryInitialization = () => {
    setIsInitializing(true)
    setInitError(null)
    // Forçar recarregamento da página
    window.location.reload()
  }

  // Renderizar o formulário
  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Ficha *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Treino de Hipertrofia - Fase 1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o objetivo e instruções gerais desta ficha de treino"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Aluno *</Label>
                {clients.length > 0 ? (
                  <Select value={clientId} onValueChange={setClientId} disabled={!!workout || !!preSelectedClientId}>
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Selecione um aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-muted-foreground p-2 border rounded-md">
                    Você ainda não tem alunos. Vá para a página de alunos para adicionar alunos ou aguarde que solicitem
                    sessões com você.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {clientId && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Exercícios</CardTitle>
                <Button type="button" onClick={handleAddExercise} variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Exercício
                </Button>
              </CardHeader>
              <CardContent>
                {isInitializing ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : initError ? (
                  <div className="text-center py-8 border rounded-md">
                    <p className="text-red-500 mb-4">Erro ao carregar exercícios: {initError}</p>
                    <Button type="button" variant="outline" onClick={retryInitialization}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Tentar novamente
                    </Button>
                  </div>
                ) : workoutExercises.length === 0 ? (
                  <div className="text-center py-8 border rounded-md">
                    <p className="text-muted-foreground">Nenhum exercício adicionado</p>
                    <Button type="button" onClick={handleAddExercise} variant="link" className="mt-2">
                      Adicionar Exercício
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workoutExercises.map((ex, index) => (
                      <div key={ex.id} className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <GripVertical className="h-5 w-5 text-muted-foreground mr-2" />
                            <span className="font-medium">Exercício {index + 1}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDeleteExercise(ex.id)}
                            aria-label="Remover exercício"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`exercise-${ex.id}`}>Exercício *</Label>
                            <Select
                              value={ex.exercise_id}
                              onValueChange={(value) => {
                                const selectedExercise = exercises.find((e) => e.id === value)
                                handleExerciseChange(ex.id, "exercise_id", value)
                                if (selectedExercise) {
                                  handleExerciseChange(ex.id, "name", selectedExercise.name)
                                }
                              }}
                            >
                              <SelectTrigger id={`exercise-${ex.id}`}>
                                <SelectValue placeholder="Selecione um exercício" />
                              </SelectTrigger>
                              <SelectContent>
                                {exercises.map((exercise) => (
                                  <SelectItem key={exercise.id} value={exercise.id}>
                                    {exercise.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`sets-${ex.id}`}>Séries *</Label>
                              <Input
                                id={`sets-${ex.id}`}
                                type="number"
                                min="1"
                                value={ex.sets}
                                onChange={(e) =>
                                  handleExerciseChange(ex.id, "sets", Number.parseInt(e.target.value) || 1)
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`reps-${ex.id}`}>Repetições *</Label>
                              <Input
                                id={`reps-${ex.id}`}
                                type="number"
                                min="1"
                                value={ex.reps}
                                onChange={(e) =>
                                  handleExerciseChange(ex.id, "reps", Number.parseInt(e.target.value) || 1)
                                }
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`rest-${ex.id}`}>Descanso (segundos)</Label>
                            <Input
                              id={`rest-${ex.id}`}
                              type="number"
                              min="0"
                              value={ex.rest_time || ""}
                              onChange={(e) =>
                                handleExerciseChange(ex.id, "rest_time", Number.parseInt(e.target.value) || null)
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`notes-${ex.id}`}>Observações</Label>
                            <Input
                              id={`notes-${ex.id}`}
                              value={ex.notes || ""}
                              onChange={(e) => handleExerciseChange(ex.id, "notes", e.target.value)}
                              placeholder="Ex: Controle a descida"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || workoutExercises.length === 0 || isInitializing || !!initError}
                >
                  {isSubmitting ? "Salvando..." : workout ? "Atualizar Ficha" : "Criar Ficha"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </form>

      {/* Diálogo de confirmação para exclusão de exercício */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {exerciseNameToDelete} da ficha? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingExercise}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveExercise}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingExercise}
            >
              {isDeletingExercise ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
