"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Trainer {
  id: string
  name: string
  avatar_url: string | null
  specialization: string
  experience_years: number
  hourly_rate: number
  bio: string
  rating: number
  specializations: string[]
}

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  client_name: string
  client_avatar: string | null
}

interface TrainerProfileProps {
  trainer: Trainer
  reviews: Review[]
  userId: string
}

export function TrainerProfile({ trainer, reviews, userId }: TrainerProfileProps) {
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const handleRequestSession = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma data e horário para a sessão.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Combinar data e hora
      const sessionDateTime = new Date(`${selectedDate}T${selectedTime}:00`)

      const { error } = await supabase.from("training_sessions").insert({
        client_id: userId,
        trainer_id: trainer.id,
        session_date: sessionDateTime.toISOString(),
        duration: 60, // 1 hora
        notes,
        status: "pending",
      })

      if (error) {
        throw error
      }

      toast({
        title: "Solicitação enviada",
        description: "O personal trainer foi notificado da sua solicitação.",
      })

      // Limpar formulário
      setSelectedDate("")
      setSelectedTime("")
      setNotes("")
    } catch (error) {
      console.error("Erro ao solicitar sessão:", error)
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Gerar horários disponíveis (exemplo)
  const availableTimes = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"]

  // Gerar datas disponíveis (próximos 14 dias)
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i + 1)
    return date.toISOString().split("T")[0]
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-4">
                  {trainer.avatar_url ? (
                    <img
                      src={trainer.avatar_url || "/placeholder.svg"}
                      alt={trainer.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-4xl font-bold text-muted-foreground">{trainer.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-bold">{trainer.name}</h2>
                <div className="flex items-center mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(trainer.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : i < trainer.rating
                            ? "fill-yellow-400 text-yellow-400 opacity-50"
                            : "text-muted-foreground"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium">{trainer.rating.toFixed(1)}</span>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {trainer.experience_years} {trainer.experience_years === 1 ? "ano" : "anos"} de experiência
                  </p>
                  <p className="text-lg font-medium">R$ {trainer.hourly_rate.toFixed(2)}/hora</p>
                </div>
                <div className="flex flex-wrap gap-1 mt-4 justify-center">
                  {trainer.specializations.map((spec, index) => (
                    <span key={index} className="px-2 py-1 bg-muted text-xs rounded-full">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:w-2/3">
          <Tabs defaultValue="about">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about">Sobre</TabsTrigger>
              <TabsTrigger value="schedule">Agendar</TabsTrigger>
              <TabsTrigger value="reviews">Avaliações ({reviews.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="about" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sobre {trainer.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{trainer.bio || "Nenhuma informação disponível."}</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="schedule" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Agendar Sessão</CardTitle>
                  <CardDescription>Escolha uma data e horário para sua sessão com {trainer.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Selecione uma data</label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {availableDates.map((date) => (
                          <Button
                            key={date}
                            type="button"
                            variant={selectedDate === date ? "default" : "outline"}
                            className={`h-auto py-2 ${
                              selectedDate === date
                                ? "bg-[#d30014] hover:bg-[#d30014]/90 text-white"
                                : "border-[#3f3f46] text-white hover:bg-[#27272a]"
                            }`}
                            onClick={() => setSelectedDate(date)}
                          >
                            <div className="text-xs">{format(new Date(date), "EEE", { locale: ptBR })}</div>
                            <div>{format(new Date(date), "dd/MM")}</div>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {selectedDate && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Selecione um horário</label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                          {availableTimes.map((time) => (
                            <Button
                              key={time}
                              type="button"
                              variant={selectedTime === time ? "default" : "outline"}
                              className={`h-auto py-2 ${
                                selectedTime === time
                                  ? "bg-[#d30014] hover:bg-[#d30014]/90 text-white"
                                  : "border-[#3f3f46] text-white hover:bg-[#27272a]"
                              }`}
                              onClick={() => setSelectedTime(time)}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedDate && selectedTime && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Observações (opcional)</label>
                        <Textarea
                          placeholder="Adicione informações relevantes para o personal trainer"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="resize-none"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleRequestSession}
                    disabled={!selectedDate || !selectedTime || isSubmitting}
                    className="w-full bg-[#d30014] hover:bg-[#d30014]/90 text-white"
                  >
                    {isSubmitting ? "Enviando..." : "Solicitar Sessão"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="reviews" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Avaliações</CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-0">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                              {review.client_avatar ? (
                                <img
                                  src={review.client_avatar || "/placeholder.svg"}
                                  alt={review.client_name}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <span className="text-sm font-bold text-muted-foreground">
                                    {review.client_name.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{review.client_name}</h4>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(review.created_at), "dd/MM/yyyy")}
                                </span>
                              </div>
                              <div className="flex mt-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                              </div>
                              {review.comment && <p className="mt-2 text-sm">{review.comment}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhuma avaliação disponível</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
