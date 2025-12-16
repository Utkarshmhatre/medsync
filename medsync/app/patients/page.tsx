'use client'

import { PatientManager } from '@/components/patient-manager'
import { useAuth } from '@/providers/auth-provider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Shield, Users } from 'lucide-react'

export default function PatientsPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to access patient management.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Only doctors and admins can manage patients
  // Pharmacy can view but with limited features
  if (user.role === 'patient') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Patient management is only available to healthcare providers.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Patient Management</h1>
          <p className="text-muted-foreground">
            {user.role === 'doctor' 
              ? 'Manage patient records and link RFID cards'
              : 'View patient information'
            }
          </p>
        </div>
      </div>
      
      <PatientManager />
    </div>
  )
}
