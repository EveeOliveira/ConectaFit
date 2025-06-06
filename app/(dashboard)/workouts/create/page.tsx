import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { WorkoutForm } from "@/components/workouts/workout-form"
import { redirect } from "next/navigation"

export default async function CreateWorkoutPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
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

  // Verificar se há um cliente pré-selecionado via query param
  const preSelectedClientId = searchParams.client as string | undefined

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Criar Nova Ficha de Treino</h1>
          <p className="text-muted-foreground">Crie uma ficha de treino personalizada para seu aluno</p>
        </div>

        <WorkoutForm
          trainerId={session.user.id}
          clients={clients || []}
          exercises={exercises || []}
          preSelectedClientId={preSelectedClientId}
        />
      </div>
    </DashboardLayout>
  )
}
