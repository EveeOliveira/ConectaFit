"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CustomSlider } from "@/components/ui/custom-slider"
import { Label } from "@/components/ui/label"
import { Star } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Specialization {
  id: number
  name: string
}

interface Trainer {
  id: string
  name: string
  specialization: string
  experience_years: number
  hourly_rate: number
  rating: number
  avatar_url: string | null
  specializations: string[]
}

interface TrainerSearchProps {
  specializations: Specialization[]
  userId: string
}

export function TrainerSearch({ specializations, userId }: TrainerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [minRating, setMinRating] = useState<number>(0)
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchTrainers()
  }, [])

  // Adicionar novo useEffect para busca em tempo real
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm || selectedSpecialization || priceRange[0] > 0 || priceRange[1] < 500 || minRating > 0) {
        handleSearch()
      } else {
        fetchTrainers()
      }
    }, 500) // Debounce de 500ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedSpecialization, priceRange, minRating])

  const fetchTrainers = async () => {
    setIsLoading(true)
    try {
      // Primeiro, buscar os IDs dos trainers
      const { data: trainersData, error: trainersError } = await supabase.from("trainers").select(`
        id,
        specialization,
        experience_years,
        hourly_rate,
        rating,
        bio
      `)

      if (trainersError) {
        throw trainersError
      }

      if (trainersData && trainersData.length > 0) {
        // Para cada trainer, buscar os dados do perfil
        const trainersWithProfiles = await Promise.all(
          trainersData.map(async (trainer) => {
            // Buscar o perfil do trainer
            const { data: profileData } = await supabase
              .from("profiles")
              .select("name, avatar_url")
              .eq("id", trainer.id)
              .single()

            // Buscar as especializações do trainer
            const { data: specializationsData } = await supabase
              .from("trainer_specializations")
              .select(`
              specializations:specialization_id (
                name
              )
            `)
              .eq("trainer_id", trainer.id)

            const specializations = specializationsData
              ? specializationsData.map((spec) => spec.specializations.name)
              : []

            return {
              id: trainer.id,
              name: profileData?.name || "Nome não disponível",
              specialization: trainer.specialization,
              experience_years: trainer.experience_years,
              hourly_rate: trainer.hourly_rate,
              rating: trainer.rating,
              avatar_url: profileData?.avatar_url,
              specializations: specializations,
            }
          }),
        )

        setTrainers(trainersWithProfiles)
      }
    } catch (error) {
      console.error("Erro ao buscar personal trainers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    setIsLoading(true)
    try {
      // Buscar trainers com filtros aplicados diretamente na query
      let query = supabase.from("trainers").select(`
        id,
        specialization,
        experience_years,
        hourly_rate,
        rating,
        bio
      `)

      // Aplicar filtros de preço e rating na query
      if (priceRange[0] > 0 || priceRange[1] < 500) {
        query = query.gte("hourly_rate", priceRange[0]).lte("hourly_rate", priceRange[1])
      }

      if (minRating > 0) {
        query = query.gte("rating", minRating)
      }

      const { data: trainersData, error: trainersError } = await query

      if (trainersError) {
        throw trainersError
      }

      if (trainersData && trainersData.length > 0) {
        // Para cada trainer, buscar os dados do perfil
        const trainersWithProfiles = await Promise.all(
          trainersData.map(async (trainer) => {
            // Buscar o perfil do trainer
            const { data: profileData } = await supabase
              .from("profiles")
              .select("name, avatar_url")
              .eq("id", trainer.id)
              .single()

            // Buscar as especializações do trainer
            const { data: specializationsData } = await supabase
              .from("trainer_specializations")
              .select(`
            specializations:specialization_id (
              name
            )
          `)
              .eq("trainer_id", trainer.id)

            const specializations = specializationsData
              ? specializationsData.map((spec) => spec.specializations.name)
              : []

            return {
              id: trainer.id,
              name: profileData?.name || "Nome não disponível",
              specialization: trainer.specialization,
              experience_years: trainer.experience_years,
              hourly_rate: trainer.hourly_rate,
              rating: trainer.rating,
              avatar_url: profileData?.avatar_url,
              specializations: specializations,
            }
          }),
        )

        // Aplicar filtros de nome e especialização no frontend
        const filtered = trainersWithProfiles.filter((trainer) => {
          // Filtrar por termo de busca (nome)
          const nameMatch = searchTerm === "" || trainer.name.toLowerCase().includes(searchTerm.toLowerCase())

          // Filtrar por especialização
          const specializationMatch =
            selectedSpecialization === "" ||
            selectedSpecialization === "all" ||
            trainer.specializations.some((spec) => spec.toLowerCase().includes(selectedSpecialization.toLowerCase()))

          return nameMatch && specializationMatch
        })

        setTrainers(filtered)
      } else {
        setTrainers([])
      }
    } catch (error) {
      console.error("Erro ao buscar personal trainers:", error)
      setTrainers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestSession = async (trainerId: string) => {
    try {
      // Criar uma data para a sessão (exemplo: 7 dias a partir de hoje)
      const sessionDate = new Date()
      sessionDate.setDate(sessionDate.getDate() + 7)

      const { error } = await supabase.from("training_sessions").insert({
        client_id: userId,
        trainer_id: trainerId,
        session_date: sessionDate.toISOString(),
        duration: 60, // 1 hora
        status: "pending",
      })

      if (error) {
        throw error
      }

      toast({
        title: "Solicitação enviada",
        description: "O personal trainer foi notificado da sua solicitação.",
      })
    } catch (error) {
      console.error("Erro ao solicitar sessão:", error)
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const resetFilters = () => {
    setSearchTerm("")
    setSelectedSpecialization("")
    setPriceRange([0, 500])
    setMinRating(0)
    fetchTrainers()
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#18181b] border-[#27272a] rounded-xl">
        <CardHeader className="pb-4">
          <h2 className="text-xl font-bold text-white">Filtros</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-white font-medium">
                Nome
              </Label>
              <Input
                id="search"
                placeholder="Buscar por nome"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#27272a] border-[#3f3f46] text-white placeholder:text-[#71717a] focus:border-red-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization" className="text-white font-medium">
                Especialização
              </Label>
              <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                <SelectTrigger className="bg-[#27272a] border-[#3f3f46] text-white">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-[#27272a]">
                  <SelectItem value="all" className="text-white hover:bg-[#27272a]">
                    Todas
                  </SelectItem>
                  {specializations.map((spec) => (
                    <SelectItem key={spec.id} value={spec.name} className="text-white hover:bg-[#27272a]">
                      {spec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white font-medium">Preço por hora (R$)</Label>
              <div className="pt-4">
                <CustomSlider
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  max={500}
                  step={10}
                />
                <div className="flex justify-between mt-2 text-sm text-[#a1a1aa]">
                  <span>R$ {priceRange[0]}</span>
                  <span>R$ {priceRange[1]}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white font-medium">Avaliação mínima</Label>
              <div className="pt-4">
                <CustomSlider
                  value={[minRating]}
                  onValueChange={(value) => setMinRating(value[0])}
                  max={5}
                  step={0.5}
                />
                <div className="flex items-center mt-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 text-sm text-[#a1a1aa]">{minRating} ou mais</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-4 border-t border-[#27272a]">
          <Button variant="outline" onClick={resetFilters} className="border-[#3f3f46] text-white hover:bg-[#27272a]">
            Limpar filtros
          </Button>
        </CardFooter>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : trainers.length > 0 ? (
          trainers.map((trainer) => (
            <Card key={trainer.id} className="bg-[#18181b] border-[#27272a] rounded-xl overflow-hidden">
              <div className="aspect-[4/3] relative bg-[#27272a]">
                {trainer.avatar_url ? (
                  <img
                    src={trainer.avatar_url || "/placeholder.svg"}
                    alt={trainer.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-[#27272a] flex items-center justify-center">
                    <span className="text-4xl font-bold text-[#71717a]">{trainer.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-white">{trainer.name}</h3>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 text-sm text-white">{trainer.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-[#a1a1aa]">
                    {trainer.experience_years} {trainer.experience_years === 1 ? "ano" : "anos"} de experiência
                  </p>
                  <p className="text-sm font-medium text-white">R$ {trainer.hourly_rate.toFixed(2)}/hora</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {trainer.specializations.map((spec, index) => (
                      <span key={index} className="px-2 py-1 bg-[#27272a] text-[#a1a1aa] text-xs rounded-full">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0 flex gap-2">
                <Button variant="outline" className="w-full border-[#3f3f46] text-white hover:bg-[#27272a]" asChild>
                  <Link href={`/trainers/${trainer.id}`}>Ver perfil</Link>
                </Button>
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handleRequestSession(trainer.id)}
                >
                  Solicitar
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">Nenhum personal trainer encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
