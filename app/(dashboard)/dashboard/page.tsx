import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ClientDashboard } from "@/components/dashboard/client-dashboard"
import { TrainerDashboard } from "@/components/dashboard/trainer-dashboard"

export default async function DashboardPage() {
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
      {profile?.user_type === "client" ? (
        <ClientDashboard userId={session.user.id} />
      ) : (
        <TrainerDashboard userId={session.user.id} />
      )}
    </DashboardLayout>
  )
}
