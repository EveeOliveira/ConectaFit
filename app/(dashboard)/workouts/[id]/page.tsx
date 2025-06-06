import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { WorkoutDetails } from "@/components/workouts/workout-details"
import { redirect } from "next/navigation"

export default async function WorkoutDetailsPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Buscar a ficha de treino
  const { data: workoutData, error: workoutError } = await supabase
    .from("workout_plans")
    .select("id, title, description, client_id, trainer_id, created_at")
    .eq("id", params.id)
    .single()

  if (workoutError || !workoutData) {
    redirect("/workouts")
  }

  // Verificar permissão (deve ser o trainer que criou ou o cliente para quem foi criado)
  const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", session.user.id).single()

  if (
    (profile?.user_type === "trainer" && workoutData.trainer_id !== session.user.id) ||
    (profile?.user_type === "client" && workoutData.client_id !== session.user.id)
  ) {
    redirect("/workouts")
  }

  // Buscar exercícios da ficha
  const { data: workoutExercisesData } = await supabase
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
        image_url
      )
    `)
    .eq("workout_plan_id", params.id)
    .order("order_index", { ascending: true })

  // Buscar informações do cliente
  const { data: clientData } = await supabase
    .from("profiles")
    .select("name, avatar_url")
    .eq("id", workoutData.client_id)
    .single()

  // Buscar informações do trainer
  const { data: trainerData } = await supabase
    .from("profiles")
    .select("name, avatar_url")
    .eq("id", workoutData.trainer_id)
    .single()

  const workout = {
    id: workoutData.id,
    title: workoutData.title,
    description: workoutData.description,
    created_at: workoutData.created_at,
    client: {
      id: workoutData.client_id,
      name: clientData?.name || "Cliente",
      avatar_url: clientData?.avatar_url,
    },
    trainer: {
      id: workoutData.trainer_id,
      name: trainerData?.name || "Personal Trainer",
      avatar_url: trainerData?.avatar_url,
    },
    exercises:
      workoutExercisesData?.map((ex) => ({
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
        },
      })) || [],
  }

  return (
    <DashboardLayout>
      <WorkoutDetails workout={workout} userType={profile?.user_type} userId={session.user.id} />
    </DashboardLayout>
  )
}
