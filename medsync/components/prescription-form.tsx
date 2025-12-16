'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { db } from '@/lib/db'
import { useAuth } from '@/providers/auth-provider'
import type { Prescription, Patient } from '@/lib/types'

interface PrescriptionFormProps {
  onSuccess?: () => void
}

export function PrescriptionForm({ onSuccess }: PrescriptionFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [formData, setFormData] = useState({
    patientId: '',
    medication: '',
    dosage: '',
    frequency: '',
    notes: ''
  })

  useEffect(() => {
    setPatients(db.getPatients())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    try {
      const prescription: Prescription = {
        id: Math.random().toString(36).substr(2, 9),
        doctorId: user.id,
        dateIssued: new Date().toISOString(),
        status: 'active',
        ...formData
      }

      db.addPrescription(prescription)

      toast({
        title: 'Success',
        description: 'Prescription has been created',
      })

      setFormData({
        patientId: '',
        medication: '',
        dosage: '',
        frequency: '',
        notes: ''
      })

      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create prescription',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        value={formData.patientId}
        onValueChange={(value) => setFormData({ ...formData, patientId: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select patient" />
        </SelectTrigger>
        <SelectContent>
          {patients.map(patient => (
            <SelectItem key={patient.id} value={patient.id}>
              {patient.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Medication"
        value={formData.medication}
        onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
      />

      <Input
        placeholder="Dosage"
        value={formData.dosage}
        onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
      />

      <Input
        placeholder="Frequency"
        value={formData.frequency}
        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
      />

      <Textarea
        placeholder="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      />

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Prescription'}
      </Button>
    </form>
  )
}

