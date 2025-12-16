import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { Header } from '@/components/header'
import { SidebarNav } from '@/components/sidebar'
import { AuthProvider } from '@/providers/auth-provider'
import { RFIDProvider } from '@/providers/rfid-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'MedSync - Healthcare Management System',
  description: 'Comprehensive healthcare management system with RFID integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <RFIDProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <div className="flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
                <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
                  <SidebarNav />
                </aside>
                <main className="flex w-full flex-col overflow-hidden">
                  {children}
                </main>
              </div>
            </div>
            <Toaster />
          </RFIDProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

