"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fitnessGoals, setFitnessGoals] = useState("")
  const [specialization, setSpecialization] = useState("")
  const [experience, setExperience] = useState("")
  const [hourlyRate, setHourlyRate] = useState("")
  const [bio, setBio] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userType, setUserType] = useState<"client" | "trainer">("client")
  const router = useRouter()
  const { toast } = useToast()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          userType,
          fitnessGoals,
          specialization,
          experience,
          hourlyRate,
          bio,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Ocorreu um erro ao criar a conta")
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Você já pode fazer login com suas credenciais.",
      })
      router.push("/login")
    } catch (error: any) {
      console.error("Erro completo:", error)
      setError(error.message || "Ocorreu um erro ao criar a conta")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:20px_20px]" />

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Register Card */}
          <div className="bg-[#18181b] backdrop-blur-sm border border-[#27272a] rounded-2xl p-8 shadow-2xl">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-3">
                <img src="/logo-conectafit.png" alt="ConectaFit" className="h-8 w-auto" />
              </div>
              <p className="text-[#a1a1aa] text-sm">Crie sua conta para começar</p>
            </div>

            {/* User Type Toggle */}
            <div className="mb-6">
              <div className="flex bg-[#27272a] rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setUserType("client")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    userType === "client" ? "bg-black text-white shadow-sm" : "text-[#a1a1aa] hover:text-white"
                  }`}
                >
                  Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("trainer")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    userType === "trainer" ? "bg-black text-white shadow-sm" : "text-[#a1a1aa] hover:text-white"
                  }`}
                >
                  Personal
                </button>
              </div>
            </div>

            {/* Register Form */}
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Common Fields */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white text-sm font-medium">
                  Nome completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-[#27272a] border-[#3f3f46] text-white placeholder:text-[#71717a] focus:border-red-500 focus:ring-red-500/20 rounded-lg h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[#27272a] border-[#3f3f46] text-white placeholder:text-[#71717a] focus:border-red-500 focus:ring-red-500/20 rounded-lg h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white text-sm font-medium">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[#27272a] border-[#3f3f46] text-white placeholder:text-[#71717a] focus:border-red-500 focus:ring-red-500/20 rounded-lg h-12"
                />
              </div>

              {/* Client-specific fields */}
              {userType === "client" && (
                <div className="space-y-2">
                  <Label htmlFor="goals" className="text-white text-sm font-medium">
                    Objetivos fitness
                  </Label>
                  <Textarea
                    id="goals"
                    placeholder="Descreva seus objetivos fitness"
                    value={fitnessGoals}
                    onChange={(e) => setFitnessGoals(e.target.value)}
                    className="bg-[#27272a] border-[#3f3f46] text-white placeholder:text-[#71717a] focus:border-red-500 focus:ring-red-500/20 rounded-lg min-h-[80px]"
                  />
                </div>
              )}

              {/* Trainer-specific fields */}
              {userType === "trainer" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="specialization" className="text-white text-sm font-medium">
                      Especialização
                    </Label>
                    <Input
                      id="specialization"
                      type="text"
                      placeholder="Ex: Musculação, Crossfit, etc."
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      required
                      className="bg-[#27272a] border-[#3f3f46] text-white placeholder:text-[#71717a] focus:border-red-500 focus:ring-red-500/20 rounded-lg h-12"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience" className="text-white text-sm font-medium">
                        Anos de experiência
                      </Label>
                      <Input
                        id="experience"
                        type="number"
                        placeholder="Ex: 5"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        required
                        className="bg-[#27272a] border-[#3f3f46] text-white placeholder:text-[#71717a] focus:border-red-500 focus:ring-red-500/20 rounded-lg h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rate" className="text-white text-sm font-medium">
                        Valor/hora (R$)
                      </Label>
                      <Input
                        id="rate"
                        type="number"
                        step="0.01"
                        placeholder="100.00"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        required
                        className="bg-[#27272a] border-[#3f3f46] text-white placeholder:text-[#71717a] focus:border-red-500 focus:ring-red-500/20 rounded-lg h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-white text-sm font-medium">
                      Biografia
                    </Label>
                    <Textarea
                      id="bio"
                      placeholder="Conte um pouco sobre sua experiência e metodologia"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      required
                      className="bg-[#27272a] border-[#3f3f46] text-white placeholder:text-[#71717a] focus:border-red-500 focus:ring-red-500/20 rounded-lg min-h-[80px]"
                    />
                  </div>
                </>
              )}

              {/* Register Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-100 text-black font-medium h-12 rounded-lg transition-colors mt-6"
              >
                {isLoading ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center mt-6">
              <span className="text-[#a1a1aa] text-sm">
                Já tem uma conta?{" "}
                <Link href="/login" className="text-white hover:text-red-400 transition-colors">
                  Faça login
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
