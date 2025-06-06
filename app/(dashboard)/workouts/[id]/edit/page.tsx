import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { WorkoutForm } from "@/components/workouts/workout-form"
import { redirect } from "next/navigation"

export default async function EditWorkoutPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", session.user.id).single()

  if (profile?.user_type !== "trainer") {
    redirect("/dashboard")
  }

  // Buscar a ficha de treino
  const { data: workoutData, error: workoutError } = await supabase
    .from("workout_plans")
    .select("id, title, description, client_id")
    .eq("id", params.id)
    .eq("trainer_id", session.user.id)
    .single()

  if (workoutError || !workoutData) {
    redirect("/workouts")
  }

  // Buscar exercícios da ficha com todos os detalhes necessários
  const { data: workoutExercises, error: exercisesError } = await supabase
    .from("workout_exercises")
    .select("id, exercise_id, sets, reps, rest_time, notes, order_index")
    .eq("workout_plan_id", params.id)
    .order("order_index", { ascending: true })

  if (exercisesError) {
    console.error("Erro ao buscar exercícios:", exercisesError)
  }

  console.log(`Carregados ${workoutExercises?.length || 0} exercícios para a ficha ${params.id}`)

  // Buscar lista de clientes do trainer para o dropdown
  const { data: sessionsData } = await supabase
    .from("training_sessions")
    .select("client_id")
    .eq("trainer_id", session.user.id)

  const { data: workoutsData } = await supabase
    .from("workout_plans")
    .select("client_id")
    .eq("trainer_id", session.user.id)

  // Extrair IDs de clientes únicos
  const clientIds = new Set([
    ...(sessionsData?.map((session) => session.client_id) || []),
    ...(workoutsData?.map((workout) => workout.client_id) || []),
  ])

  // Buscar informações de perfil para cada cliente
  const clients = await Promise.all(
    Array.from(clientIds).map(async (clientId) => {
      const { data: profileData } = await supabase.from("profiles").select("name").eq("id", clientId).single()

      return {
        id: clientId,
        name: profileData?.name || "Cliente",
      }
    }),
  )

  // Buscar exercícios disponíveis
  const { data: exercises } = await supabase.from("exercises").select("id, name").order("name")

  const workout = {
    id: workoutData.id,
    title: workoutData.title,
    description: workoutData.description,
    client_id: workoutData.client_id,
    exercises: workoutExercises || [],
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Ficha de Treino</h1>
          <p className="text-muted-foreground">Atualize a ficha de treino do seu aluno</p>
        </div>

        <WorkoutForm trainerId={session.user.id} clients={clients} exercises={exercises || []} workout={workout} />
      </div>
    </DashboardLayout>
  )
}
