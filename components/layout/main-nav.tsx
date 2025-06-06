"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Search, Calendar, Dumbbell, User, LogOut } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

type UserType = "client" | "trainer" | null

export function MainNav() {
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
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

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
    <nav className="flex flex-col h-full">
      <div className="flex flex-col space-y-2 flex-1">
        {routes.map((route) => {
          const Icon = route.icon
          const isActive = pathname === route.href
          return (
            <Link key={route.href} href={route.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-12 text-left font-normal",
                  isActive
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "text-[#a1a1aa] hover:text-white hover:bg-[#27272a]",
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {route.label}
              </Button>
            </Link>
          )
        })}
      </div>

      <div className="mt-auto pt-4">
        <Button
          variant="ghost"
          className="w-full justify-start h-12 text-[#a1a1aa] hover:text-white hover:bg-[#27272a]"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </Button>
      </div>
    </nav>
  )
}
