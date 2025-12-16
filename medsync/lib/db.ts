import { Prescription, Reminder, User, Patient } from './types'

class LocalDatabase {
  private getItem<T>(key: string): T[] {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  }

  private setItem<T>(key: string, value: T[]): void {
    localStorage.setItem(key, JSON.stringify(value))
  }

  // Prescriptions
  getPrescriptions(): Prescription[] {
    return this.getItem<Prescription>('prescriptions')
  }

  addPrescription(prescription: Prescription): void {
    const prescriptions = this.getPrescriptions()
    prescriptions.push(prescription)
    this.setItem('prescriptions', prescriptions)
  }

  updatePrescription(id: string, updates: Partial<Prescription>): void {
    const prescriptions = this.getPrescriptions()
    const index = prescriptions.findIndex(p => p.id === id)
    if (index !== -1) {
      prescriptions[index] = { ...prescriptions[index], ...updates }
      this.setItem('prescriptions', prescriptions)
    }
  }

  // Reminders
  getReminders(): Reminder[] {
    return this.getItem<Reminder>('reminders')
  }

  addReminder(reminder: Reminder): void {
    const reminders = this.getReminders()
    reminders.push(reminder)
    this.setItem('reminders', reminders)
  }

  updateReminder(id: string, updates: Partial<Reminder>): void {
    const reminders = this.getReminders()
    const index = reminders.findIndex(r => r.id === id)
    if (index !== -1) {
      reminders[index] = { ...reminders[index], ...updates }
      this.setItem('reminders', reminders)
    }
  }

  // Users
  getUsers(): User[] {
    return this.getItem<User>('users')
  }

  addUser(user: User): void {
    const users = this.getUsers()
    users.push(user)
    this.setItem('users', users)
  }

  updateUser(id: string, updates: Partial<User>): void {
    const users = this.getUsers()
    const index = users.findIndex(u => u.id === id)
    if (index !== -1) {
      users[index] = { ...users[index], ...updates }
      this.setItem('users', users)
    }
  }

  // Patients
  getPatients(): Patient[] {
    return this.getItem<Patient>('patients')
  }

  addPatient(patient: Patient): void {
    const patients = this.getPatients()
    patients.push(patient)
    this.setItem('patients', patients)
  }

  updatePatient(id: string, updates: Partial<Patient>): void {
    const patients = this.getPatients()
    const index = patients.findIndex(p => p.id === id)
    if (index !== -1) {
      patients[index] = { ...patients[index], ...updates }
      this.setItem('patients', patients)
    }
  }

  deletePatient(id: string): void {
    const patients = this.getPatients()
    const updatedPatients = patients.filter(p => p.id !== id)
    this.setItem('patients', updatedPatients)
  }

  // RFID
  getRFIDMappings(): Record<string, string> {
    return this.getItem<Record<string, string>>('rfidMappings')
  }

  setRFIDMapping(rfidUid: string, patientId: string): void {
    const mappings = this.getRFIDMappings()
    mappings[rfidUid] = patientId
    this.setItem('rfidMappings', [mappings])
  }

  removeRFIDMapping(rfidUid: string): void {
    const mappings = this.getRFIDMappings()
    delete mappings[rfidUid]
    this.setItem('rfidMappings', [mappings])
  }
}

export const db = new LocalDatabase()

