import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ClientWorkouts } from "@/components/workouts/client-workouts"
import { TrainerWorkouts } from "@/components/workouts/trainer-workouts"
import { redirect } from "next/navigation"

export default async function WorkoutsPage() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", session.user.id).single()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fichas de Treino</h1>
          <p className="text-muted-foreground">
            {profile?.user_type === "client"
              ? "Visualize suas fichas de treino personalizadas"
              : "Gerencie as fichas de treino dos seus alunos"}
          </p>
        </div>

        {profile?.user_type === "client" ? (
          <ClientWorkouts userId={session.user.id} />
        ) : (
          <TrainerWorkouts userId={session.user.id} />
        )}
      </div>
    </DashboardLayout>
  )
}
