"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ClientWorkoutsProps {
  userId: string
}

interface WorkoutPlan {
  id: string
  title: string
  description: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
  trainer: {
    name: string
  }
  exercises: {
    id: string
    name: string
    sets: number
    reps: number
  }[]
}

export function ClientWorkouts({ userId }: ClientWorkoutsProps) {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadWorkouts() {
      try {
        const { data: workoutData, error } = await supabase
          .from("workout_plans")
          .select(`
            id,
            title,
            description,
            start_date,
            end_date,
            created_at,
            trainer_id
          `)
          .eq("client_id", userId)
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        if (workoutData) {
          const workoutsWithDetails = await Promise.all(
            workoutData.map(async (workout) => {
              // Buscar informações do trainer
              const { data: trainerData } = await supabase
                .from("profiles")
                .select("name")
                .eq("id", workout.trainer_id)
                .single()

              // Buscar exercícios do plano
              const { data: exercisesData } = await supabase
                .from("workout_exercises")
                .select(`
                  id,
                  sets,
                  reps,
                  exercises:exercise_id (
                    id,
                    name
                  )
                `)
                .eq("workout_plan_id", workout.id)
                .order("order_index", { ascending: true })

              const exercises = exercisesData
                ? exercisesData.map((ex) => ({
                    id: ex.exercises.id,
                    name: ex.exercises.name,
                    sets: ex.sets,
                    reps: ex.reps,
                  }))
                : []

              return {
                id: workout.id,
                title: workout.title,
                description: workout.description,
                start_date: workout.start_date,
                end_date: workout.end_date,
                created_at: workout.created_at,
                trainer: {
                  name: trainerData?.name || "Personal Trainer",
                },
                exercises,
              }
            }),
          )

          setWorkoutPlans(workoutsWithDetails)
        }
      } catch (error) {
        console.error("Erro ao carregar treinos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadWorkouts()
  }, [userId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
              <div className="text-sm">Por {workout.trainer.name}</div>
            </CardHeader>
            <CardContent>
              {workout.description && <p className="mb-4">{workout.description}</p>}

              {workout.exercises.length > 0 ? (
                <div className="border border-[#2a2a2a] rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#2a2a2a]">
                      <tr>
                        <th className="px-4 py-2 text-left text-white border-r border-[#101010]">Exercício</th>
                        <th className="px-4 py-2 text-center text-white border-r border-[#101010]">Séries</th>
                        <th className="px-4 py-2 text-center text-white">Repetições</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workout.exercises.map((exercise) => (
                        <tr key={exercise.id} className="border-t border-[#2a2a2a] bg-[#101010] hover:bg-[#1a1a1a]">
                          <td className="px-4 py-3 text-white border-r border-[#2a2a2a]">{exercise.name}</td>
                          <td className="px-4 py-3 text-center text-white border-r border-[#2a2a2a]">
                            {exercise.sets}
                          </td>
                          <td className="px-4 py-3 text-center text-white">{exercise.reps}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum exercício cadastrado neste plano</p>
              )}

              <div className="mt-4">
                <Link href={`/workouts/${workout.id}`}>
                  <Button variant="outline">Ver detalhes</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card className="bg-[#101010] border-0">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Você ainda não possui fichas de treino</p>
            <p className="text-sm text-muted-foreground">
              Encontre um personal trainer e solicite uma sessão para receber fichas de treino personalizadas
            </p>
            <div className="mt-4">
              <Link href="/search">
                <Button>Encontrar Personal Trainer</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
