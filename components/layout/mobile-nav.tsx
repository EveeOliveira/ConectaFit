"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Search, Calendar, Dumbbell, User } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type UserType = "client" | "trainer" | null

export function MobileNav() {
  const pathname = usePathname()
  const [userType, setUserType] = useState<UserType>(null)
  const supabase = createClient()

  useEffect(() => {
    async function getUserType() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        const { data } = await supabase.from("profiles").select("user_type").eq("id", session.user.id).single()

        if (data) {
          setUserType(data.user_type as UserType)
        }
      }
    }

    getUserType()
  }, [])

  const clientRoutes = [
    { href: "/dashboard", label: "Início", icon: Home },
    { href: "/search", label: "Buscar", icon: Search },
    { href: "/sessions", label: "Sessões", icon: Calendar },
    { href: "/workouts", label: "Treinos", icon: Dumbbell },
    { href: "/profile", label: "Perfil", icon: User },
  ]

  const trainerRoutes = [
    { href: "/dashboard", label: "Início", icon: Home },
    { href: "/clients", label: "Alunos", icon: User },
    { href: "/sessions", label: "Sessões", icon: Calendar },
    { href: "/workouts", label: "Treinos", icon: Dumbbell },
    { href: "/profile", label: "Perfil", icon: User },
  ]

  const routes = userType === "client" ? clientRoutes : trainerRoutes

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="grid grid-cols-5 h-16">
        {routes.map((route) => {
          const Icon = route.icon
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex flex-col items-center justify-center text-xs font-medium transition-colors",
                pathname === route.href ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              {route.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
