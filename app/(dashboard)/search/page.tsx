import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { TrainerSearch } from "@/components/search/trainer-search"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function SearchPage() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", session.user.id).single()

  if (profile?.user_type !== "client") {
    redirect("/dashboard")
  }

  // Buscar todas as especializações para o filtro
  const { data: specializations } = await supabase.from("specializations").select("id, name").order("name")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buscar Personal Trainers</h1>
          <p className="text-muted-foreground">Encontre o personal trainer ideal para seus objetivos</p>
        </div>

        <TrainerSearch specializations={specializations || []} userId={session.user.id} />
      </div>
    </DashboardLayout>
  )
}
