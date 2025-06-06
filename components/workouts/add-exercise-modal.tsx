"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface Exercise {
  id: string
  name: string
}

interface AddExerciseModalProps {
  workoutId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onExerciseAdded: () => void
}

export function AddExerciseModal({ workoutId, open, onOpenChange, onExerciseAdded }: AddExerciseModalProps) {
  const [exerciseId, setExerciseId] = useState("")
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState(12)
  const [restTime, setRestTime] = useState(60)
  const [notes, setNotes] = useState("")
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  // Carregar exercícios disponíveis quando o modal abrir
  useEffect(() => {
    let isMounted = true

    const loadExercises = async () => {
      if (!open) return

      setIsLoading(true)
      setFetchError(null)

      try {
        // Verificar se o cliente Supabase está disponível
        if (!supabase) {
          throw new Error("Cliente Supabase não inicializado")
        }

        const { data, error } = await supabase.from("exercises").select("id, name").order("name")

        if (error) {
          throw error
        }

        if (isMounted) {
          setExercises(data || [])
        }
      } catch (error) {
        console.error("Erro ao carregar exercícios:", error)

        if (isMounted) {
          setFetchError(error instanceof Error ? error.message : "Erro ao carregar exercícios")

          toast({
            title: "Erro ao carregar exercícios",
            description: error instanceof Error ? error.message : "Tente novamente mais tarde",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadExercises()

    return () => {
      isMounted = false
    }
  }, [open, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!exerciseId) {
      toast({
        title: "Exercício obrigatório",
        description: "Selecione um exercício para adicionar à ficha.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Verificar se o exercício já existe na ficha
      const { data: existingExercise, error: checkDuplicateError } = await supabase
        .from("workout_exercises")
        .select("id")
        .eq("workout_plan_id", workoutId)
        .eq("exercise_id", exerciseId)
        .maybeSingle()

      if (checkDuplicateError) {
        console.error("Erro ao verificar duplicação:", checkDuplicateError)
        throw checkDuplicateError
      }

      if (existingExercise) {
        toast({
          title: "Exercício duplicado",
          description: "Este exercício já existe nesta ficha de treino.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // 1. Obter o maior order_index atual
      const { data: currentExercises, error: fetchError } = await supabase
        .from("workout_exercises")
        .select("order_index")
        .eq("workout_plan_id", workoutId)
        .order("order_index", { ascending: false })
        .limit(1)

      if (fetchError) throw fetchError

      const nextOrderIndex = currentExercises && currentExercises.length > 0 ? currentExercises[0].order_index + 1 : 0

      // 2. Inserir o novo exercício
      const { error: insertError } = await supabase.from("workout_exercises").insert({
        workout_plan_id: workoutId,
        exercise_id: exerciseId,
        sets: sets,
        reps: reps,
        rest_time: restTime || null,
        notes: notes || null,
        order_index: nextOrderIndex,
      })

      if (insertError) throw insertError

      toast({
        title: "Exercício adicionado",
        description: "O exercício foi adicionado à ficha com sucesso.",
      })

      // Resetar o formulário
      setExerciseId("")
      setSets(3)
      setReps(12)
      setRestTime(60)
      setNotes("")

      // Fechar o modal e atualizar a lista
      onOpenChange(false)
      onExerciseAdded()
    } catch (error) {
      console.error("Erro ao adicionar exercício:", error)
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Não foi possível adicionar o exercício. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar Exercício</DialogTitle>
            <DialogDescription>Adicione um novo exercício à ficha de treino.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exercise">Exercício *</Label>
              {isLoading ? (
                <div className="h-10 bg-muted animate-pulse rounded-md"></div>
              ) : fetchError ? (
                <div className="text-sm text-red-500 p-2 border border-red-200 rounded-md">
                  Erro ao carregar exercícios: {fetchError}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => {
                      setIsLoading(true)
                      setFetchError(null)
                      // Forçar recarregamento da página
                      window.location.reload()
                    }}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : (
                <Select value={exerciseId} onValueChange={setExerciseId}>
                  <SelectTrigger id="exercise">
                    <SelectValue placeholder="Selecione um exercício" />
                  </SelectTrigger>
                  <SelectContent>
                    {exercises.map((exercise) => (
                      <SelectItem key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sets">Séries *</Label>
                <Input
                  id="sets"
                  type="number"
                  min="1"
                  value={sets}
                  onChange={(e) => setSets(Number.parseInt(e.target.value) || 1)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reps">Repetições *</Label>
                <Input
                  id="reps"
                  type="number"
                  min="1"
                  value={reps}
                  onChange={(e) => setReps(Number.parseInt(e.target.value) || 1)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rest">Descanso (segundos)</Label>
              <Input
                id="rest"
                type="number"
                min="0"
                value={restTime}
                onChange={(e) => setRestTime(Number.parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Controle a descida"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !exerciseId || !!fetchError}>
              {isSubmitting ? "Adicionando..." : "Adicionar Exercício"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
