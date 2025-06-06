import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ClientsList } from "@/components/clients/clients-list"
import { redirect } from "next/navigation"

export default async function ClientsPage() {
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Alunos</h1>
          <p className="text-muted-foreground">Visualize e gerencie seus alunos</p>
        </div>

        <ClientsList trainerId={session.user.id} />
      </div>
    </DashboardLayout>
  )
}
