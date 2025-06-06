import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ClientSessions } from "@/components/sessions/client-sessions"
import { TrainerSessions } from "@/components/sessions/trainer-sessions"
import { redirect } from "next/navigation"

export default async function SessionsPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Sessões de Treino</h1>
          <p className="text-muted-foreground">
            {profile?.user_type === "client"
              ? "Gerencie suas sessões de treino com personal trainers"
              : "Gerencie suas sessões de treino com clientes"}
          </p>
        </div>

        {profile?.user_type === "client" ? (
          <ClientSessions userId={session.user.id} />
        ) : (
          <TrainerSessions userId={session.user.id} />
        )}
      </div>
    </DashboardLayout>
  )
}
