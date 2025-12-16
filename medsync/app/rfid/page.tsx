'use client'

import { RFIDManager } from '@/components/rfid-manager'
import { useAuth } from '@/providers/auth-provider'

export default function RFIDPage() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <RFIDManager />
    </div>
  )
}

