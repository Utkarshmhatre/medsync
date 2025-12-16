'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RFIDService } from '../services/rfid-service'

type Prescription = {
  id: string
  patientId: string
  medication: string
  dosage: string
  frequency: string
  dateIssued: string
  status: 'active' | 'completed' | 'pending'
}

export function PrescriptionManager() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [newPrescription, setNewPrescription] = useState({
    medication: '',
    dosage: '',
    frequency: ''
  })

  useEffect(() => {
    // Load prescriptions from localStorage
    const stored = localStorage.getItem('prescriptions')
    if (stored) {
      setPrescriptions(JSON.parse(stored))
    }

    // Listen for RFID events
    const handleRFIDData = (event: CustomEvent) => {
      const { rfidUid } = event.detail
      const patientName = RFIDService.getUserName(rfidUid)
      console.log(`Patient ${patientName} scanned card`)
    }

    window.addEventListener('rfidData', handleRFIDData as EventListener)
    return () => {
      window.removeEventListener('rfidData', handleRFIDData as EventListener)
    }
  }, [])

  const addPrescription = () => {
    const prescription: Prescription = {
      id: Math.random().toString(36).substr(2, 9),
      patientId: 'current-patient-id', // In a real app, this would come from context/state
      ...newPrescription,
      dateIssued: new Date().toISOString(),
      status: 'active'
    }

    const updated = [...prescriptions, prescription]
    setPrescriptions(updated)
    localStorage.setItem('prescriptions', JSON.stringify(updated))

    setNewPrescription({
      medication: '',
      dosage: '',
      frequency: ''
    })
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Prescription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Medication"
              value={newPrescription.medication}
              onChange={(e) => setNewPrescription({
                ...newPrescription,
                medication: e.target.value
              })}
            />
            <Input
              placeholder="Dosage"
              value={newPrescription.dosage}
              onChange={(e) => setNewPrescription({
                ...newPrescription,
                dosage: e.target.value
              })}
            />
            <Input
              placeholder="Frequency"
              value={newPrescription.frequency}
              onChange={(e) => setNewPrescription({
                ...newPrescription,
                frequency: e.target.value
              })}
            />
          </div>
          <Button 
            className="mt-4"
            onClick={addPrescription}
            disabled={!newPrescription.medication || !newPrescription.dosage || !newPrescription.frequency}
          >
            Add Prescription
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Date Issued</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptions.map((prescription) => (
                <TableRow key={prescription.id}>
                  <TableCell>{prescription.medication}</TableCell>
                  <TableCell>{prescription.dosage}</TableCell>
                  <TableCell>{prescription.frequency}</TableCell>
                  <TableCell>{new Date(prescription.dateIssued).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      prescription.status === 'active' ? 'bg-green-100 text-green-800' :
                      prescription.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {prescription.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

