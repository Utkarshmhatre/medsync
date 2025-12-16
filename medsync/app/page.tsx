import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-purple-950 to-purple-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
                  Transform Healthcare Management
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-300 md:text-xl">
                  Seamlessly integrate patient care, prescriptions, and real-time monitoring with our advanced RFID system.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild size="lg">
                  <Link href="/dashboard">Get Started</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/about">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <h2 className="text-2xl font-bold">Real-time Monitoring</h2>
                <p className="text-muted-foreground">
                  Track patient activities and medication adherence in real-time with our advanced RFID system.
                </p>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <h2 className="text-2xl font-bold">Prescription Management</h2>
                <p className="text-muted-foreground">
                  Efficiently manage prescriptions, dosages, and medication schedules all in one place.
                </p>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <h2 className="text-2xl font-bold">Patient Empowerment</h2>
                <p className="text-muted-foreground">
                  Enable patients to take control of their healthcare journey with easy access to their medical information.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

