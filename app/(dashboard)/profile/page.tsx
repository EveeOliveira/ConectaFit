import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProfileForm } from "@/components/profile/profile-form"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Buscar dados do perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, avatar_url, user_type")
    .eq("id", session.user.id)
    .single()

  if (!profile) {
    redirect("/dashboard")
  }

  // Buscar dados específicos baseados no tipo de usuário
  let userData = null

  if (profile.user_type === "client") {
    const { data } = await supabase
      .from("clients")
      .select("fitness_goals, health_info")
      .eq("id", session.user.id)
      .single()
    userData = data
  } else {
    const { data } = await supabase
      .from("trainers")
      .select("specialization, experience_years, hourly_rate, bio")
      .eq("id", session.user.id)
      .single()
    userData = data
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
        </div>

        <ProfileForm userId={session.user.id} profile={profile} userData={userData || {}} />
      </div>
    </DashboardLayout>
  )
}
