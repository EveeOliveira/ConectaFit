import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ClientDetails } from "@/components/clients/client-details"
import { redirect } from "next/navigation"

export default async function ClientDetailsPage({ params }: { params: { id: string } }) {
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

  // Verificar se o cliente existe e tem relação com o trainer
  const { count } = await supabase
    .from("training_sessions")
    .select("id", { count: "exact", head: true })
    .eq("trainer_id", session.user.id)
    .eq("client_id", params.id)

  if (count === 0) {
    // Verificar também nos planos de treino
    const { count: workoutCount } = await supabase
      .from("workout_plans")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", session.user.id)
      .eq("client_id", params.id)

    if (workoutCount === 0) {
      redirect("/clients")
    }
  }

  return (
    <DashboardLayout>
      <ClientDetails clientId={params.id} trainerId={session.user.id} />
    </DashboardLayout>
  )
}
