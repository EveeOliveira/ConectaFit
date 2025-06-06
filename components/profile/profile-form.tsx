"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface ProfileFormProps {
  userId: string
  profile: {
    name: string
    email: string
    avatar_url: string | null
    user_type: "client" | "trainer"
  }
  userData: any
}

export function ProfileForm({ userId, profile, userData }: ProfileFormProps) {
  const [name, setName] = useState(profile.name)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "")
  const [isLoading, setIsLoading] = useState(false)

  // Campos específicos para cliente
  const [fitnessGoals, setFitnessGoals] = useState(userData.fitness_goals || "")
  const [healthInfo, setHealthInfo] = useState(userData.health_info || "")

  // Campos específicos para trainer
  const [specialization, setSpecialization] = useState(userData.specialization || "")
  const [experienceYears, setExperienceYears] = useState(userData.experience_years || "")
  const [hourlyRate, setHourlyRate] = useState(userData.hourly_rate || "")
  const [bio, setBio] = useState(userData.bio || "")

  const supabase = createClient()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Atualizar perfil básico
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (profileError) throw profileError

      // Atualizar dados específicos baseados no tipo de usuário
      if (profile.user_type === "client") {
        const { error: clientError } = await supabase
          .from("clients")
          .update({
            fitness_goals: fitnessGoals || null,
            health_info: healthInfo || null,
          })
          .eq("id", userId)

        if (clientError) throw clientError
      } else {
        const { error: trainerError } = await supabase
          .from("trainers")
          .update({
            specialization: specialization || null,
            experience_years: experienceYears ? Number(experienceYears) : null,
            hourly_rate: hourlyRate ? Number(hourlyRate) : null,
            bio: bio || null,
          })
          .eq("id", userId)

        if (trainerError) throw trainerError
      }

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar seu perfil. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="bg-[#101010] border-0">
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Atualize suas informações pessoais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} disabled />
            <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">URL da Foto de Perfil</Label>
            <Input
              id="avatar"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://exemplo.com/sua-foto.jpg"
            />
          </div>

          {profile.user_type === "client" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="fitness-goals">Objetivos Fitness</Label>
                <Textarea
                  id="fitness-goals"
                  value={fitnessGoals}
                  onChange={(e) => setFitnessGoals(e.target.value)}
                  placeholder="Descreva seus objetivos fitness"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="health-info">Informações de Saúde</Label>
                <Textarea
                  id="health-info"
                  value={healthInfo}
                  onChange={(e) => setHealthInfo(e.target.value)}
                  placeholder="Compartilhe informações relevantes sobre sua saúde"
                  rows={3}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="specialization">Especialização</Label>
                <Input
                  id="specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="Ex: Musculação, Crossfit, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Anos de Experiência</Label>
                <Input
                  id="experience"
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="Ex: 5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Valor por Hora (R$)</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="Ex: 100.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte um pouco sobre sua experiência e metodologia"
                  rows={4}
                />
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
