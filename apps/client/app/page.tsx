import { Carousel } from "@/components/landing/carousel"
import { Features } from "@/components/landing/features"
import { Footer } from "@/components/landing/footer"
import { Hero } from "@/components/landing/hero"
import { Navbar } from "@/components/landing/navbar"
import { Platform } from "@/components/landing/platform"
import { Reviews } from "@/components/landing/reviews"
import { Showcase } from "@/components/landing/showcase"

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Carousel />
        <Features />
        <Platform />
        <Showcase />
        <Reviews />
      </main>
      <Footer />
    </div>
  )
}
