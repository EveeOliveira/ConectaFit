import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full h-14 md:h-16 flex items-center">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl flex items-center">
          <Link href="/" className="flex items-center justify-center">
            <Image
              src="/logo-conectafit.png"
              alt="ConectaFit"
              width={150}
              height={30}
              className="h-8 md:h-10 w-auto object-contain"
            />
          </Link>
          <nav className="ml-auto flex gap-2 sm:gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                Entrar
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="text-xs sm:text-sm">
                Cadastrar
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-8 md:py-12 lg:py-24 xl:py-32">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl/none">
                    Encontre o personal trainer ideal para você
                  </h1>
                  <p className="max-w-[600px] text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground">
                    Conectamos você aos melhores personal trainers da sua região. Treine onde e quando quiser, com
                    profissionais qualificados.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/register?type=client" className="w-full min-[400px]:w-auto">
                    <Button size="lg" className="w-full">
                      Quero treinar
                    </Button>
                  </Link>
                  <Link href="/register?type=trainer" className="w-full min-[400px]:w-auto">
                    <Button size="lg" variant="outline" className="w-full">
                      Sou personal trainer
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="aspect-video overflow-hidden rounded-xl w-full max-w-lg lg:max-w-none">
                  <Image
                    src="/images/gym-hero.jpg"
                    alt="Pessoas treinando juntas em academia moderna"
                    width={600}
                    height={400}
                    className="object-cover w-full h-full"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-8 md:py-12 lg:py-24 bg-muted">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">Como funciona</h2>
                <p className="max-w-[900px] text-sm sm:text-base md:text-lg lg:text-xl/relaxed text-muted-foreground">
                  Conectamos você aos melhores personal trainers da sua região em apenas 3 passos
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-8 md:py-12 grid-cols-1 md:grid-cols-3 lg:gap-12">
              <div className="grid gap-1 text-center md:text-left">
                <h3 className="text-lg md:text-xl font-bold">1. Cadastre-se</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Crie sua conta e preencha seu perfil com seus objetivos fitness
                </p>
              </div>
              <div className="grid gap-1 text-center md:text-left">
                <h3 className="text-lg md:text-xl font-bold">2. Encontre seu personal</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Busque por especialização, localização ou avaliações
                </p>
              </div>
              <div className="grid gap-1 text-center md:text-left">
                <h3 className="text-lg md:text-xl font-bold">3. Comece a treinar</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Agende sessões e receba fichas de treino personalizadas
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full py-4 md:py-6">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl flex flex-col gap-2 sm:flex-row">
          <p className="text-xs text-muted-foreground">© 2023 ConectaFit. Todos os direitos reservados.</p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link href="#" className="text-xs hover:underline underline-offset-4">
              Termos de Serviço
            </Link>
            <Link href="#" className="text-xs hover:underline underline-offset-4">
              Política de Privacidade
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
