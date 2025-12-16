export interface User {
  id: string
  name: string
  role: 'doctor' | 'patient' | 'pharmacy'
  email: string
}

export interface Patient {
  id: string
  name: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  contactNumber: string
  email: string
  address: string
  rfidUid?: string
}

export interface Prescription {
  id: string
  patientId: string
  doctorId: string
  medication: string
  dosage: string
  frequency: string
  dateIssued: string
  status: 'active' | 'completed' | 'pending'
  notes?: string
}

export interface Reminder {
  id: string
  userId: string
  title: string
  description?: string
  datetime: string
  status: 'pending' | 'completed' | 'missed'
}

export interface RFIDCard {
  uid: string
  userId: string
  lastScanned: string
}

