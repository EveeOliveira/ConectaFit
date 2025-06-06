import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { TrainerProfile } from "@/components/trainers/trainer-profile"
import { redirect } from "next/navigation"

export default async function TrainerProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const { data: userProfile } = await supabase.from("profiles").select("user_type").eq("id", session.user.id).single()

  if (userProfile?.user_type !== "client") {
    redirect("/dashboard")
  }

  // Buscar dados do trainer
  const { data: trainerData } = await supabase
    .from("trainers")
    .select(`
      id,
      specialization,
      experience_years,
      hourly_rate,
      bio,
      rating
    `)
    .eq("id", params.id)
    .single()

  if (!trainerData) {
    redirect("/search")
  }

  // Buscar dados do perfil
  const { data: profileData } = await supabase.from("profiles").select("name, avatar_url").eq("id", params.id).single()

  // Buscar especializações
  const { data: specializationsData } = await supabase
    .from("trainer_specializations")
    .select(`
      specializations:specialization_id (
        name
      )
    `)
    .eq("trainer_id", params.id)

  const trainer = {
    id: trainerData.id,
    name: profileData?.name || "Nome não disponível",
    avatar_url: profileData?.avatar_url,
    specialization: trainerData.specialization,
    experience_years: trainerData.experience_years,
    hourly_rate: trainerData.hourly_rate,
    bio: trainerData.bio,
    rating: trainerData.rating,
    specializations: specializationsData ? specializationsData.map((spec: any) => spec.specializations.name) : [],
  }

  // Buscar avaliações do trainer
  const { data: reviews } = await supabase
    .from("trainer_reviews")
    .select(`
      id,
      rating,
      comment,
      created_at,
      client_id
    `)
    .eq("trainer_id", params.id)
    .order("created_at", { ascending: false })

  // Buscar informações dos clientes que fizeram avaliações
  const reviewsWithClientInfo = await Promise.all(
    (reviews || []).map(async (review) => {
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", review.client_id)
        .single()

      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        client_name: clientProfile?.name || "Cliente",
        client_avatar: clientProfile?.avatar_url,
      }
    }),
  )

  return (
    <DashboardLayout>
      <TrainerProfile trainer={trainer} reviews={reviewsWithClientInfo || []} userId={session.user.id} />
    </DashboardLayout>
  )
}
