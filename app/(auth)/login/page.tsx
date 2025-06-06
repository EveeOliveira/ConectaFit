"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const clearSession = async () => {
      try {
        await supabase.auth.signOut()
      } catch (error) {
        console.error("Erro ao limpar sessão:", error)
      }
    }

    clearSession()
  }, [supabase.auth])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await supabase.auth.signOut()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", data.user.id)
          .single()

        if (profileError) {
          throw profileError
        }

        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para o dashboard...",
        })

        router.push("/dashboard")
      }
    } catch (error: any) {
      if (error.message.includes("Email not confirmed")) {
        setError("Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.")
      } else if (error.message.includes("refresh_token_not_found")) {
        setError("Sessão expirada. Por favor, tente fazer login novamente.")
      } else {
        setError(error.message || "Ocorreu um erro ao fazer login")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:20px_20px]" />

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#18181b] backdrop-blur-sm border border-[#27272a] rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-3">
                <img src="/logo-conectafit.png" alt="ConectaFit" className="h-8 w-auto" />
              </div>
              <p className="text-[#a1a1aa] text-sm">Entre na sua conta para continuar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemplo@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[#27272a] border-[#3f3f46] text-white placeholder:text-[#71717a] focus:border-red-500 focus:ring-red-500/20 rounded-lg h-12"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white text-sm font-medium">
                    Senha
                  </Label>
                  <Link href="/reset-password" className="text-[#a1a1aa] hover:text-white text-sm transition-colors">
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[#27272a] border-[#3f3f46] text-white placeholder:text-[#71717a] focus:border-red-500 focus:ring-red-500/20 rounded-lg h-12"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-100 text-black font-medium h-12 rounded-lg transition-colors"
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="text-center mt-6">
              <span className="text-[#a1a1aa] text-sm">
                Não tem uma conta?{" "}
                <Link href="/register" className="text-white hover:text-red-400 transition-colors">
                  Cadastre-se
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
