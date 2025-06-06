"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { MainNav } from "./main-nav"
import { MobileNav } from "./mobile-nav"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Erro ao verificar sessão:", error)
          throw error
        }

        if (!session) {
          await supabase.auth.signOut()
          router.push("/login")
          return
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        toast({
          title: "Erro de autenticação",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        })
        router.push("/login")
      }
    }

    checkSession()
  }, [router, supabase.auth, toast])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar Desktop - Fixo */}
      <div className="hidden md:flex w-80 flex-col bg-black border-r border-[#27272a] fixed h-screen">
        <div className="pt-6 pb-8">
          <div className="px-6">
            <Image src="/logo-conectafit.png" alt="ConectaFit" width={400} height={80} className="h-12 w-auto" />
          </div>
        </div>
        <div className="flex-1 px-6 overflow-y-auto">
          <MainNav />
        </div>
      </div>

      {/* Main Content - Com margem para compensar sidebar fixo */}
      <main className="flex-1 pb-16 md:pb-0 md:ml-80">
        <div className="p-8">{children}</div>
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  )
}
