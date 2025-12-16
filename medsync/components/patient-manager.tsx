'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useRFID } from '@/providers/rfid-provider'
import { useAuth } from '@/providers/auth-provider'
import { apiService } from '@/services/api-service'
import {
  Users,
  UserPlus,
  CreditCard,
  Search,
  Edit,
  Trash2,
  Link2,
  Unlink,
  FileText,
  Activity,
  Loader2,
  RefreshCw,
  Radio,
} from 'lucide-react'

interface Patient {
  id: string
  name: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  bloodType?: string
  contactNumber: string
  email: string
  address: string
  emergencyContact?: string
  allergies?: string
  medicalHistory?: string
  rfidUid?: string
  createdAt: string
  updatedAt?: string
}

interface RFIDCard {
  id: string
  cardUid: string
  label: string
  linkedPatientId?: string
  isActive: boolean
}

export function PatientManager() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [rfidCards, setRfidCards] = useState<RFIDCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [selectedCard, setSelectedCard] = useState<string>('')
  
  const [formData, setFormData] = useState<Partial<Patient>>({
    name: '',
    dateOfBirth: '',
    gender: 'other',
    bloodType: '',
    contactNumber: '',
    email: '',
    address: '',
    emergencyContact: '',
    allergies: '',
    medicalHistory: '',
  })

  const { toast } = useToast()
  const { user, token } = useAuth()
  const { cards, lastScannedCard, isConnected } = useRFID()

  // Load patients and cards
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Try API first, fallback to localStorage
      if (token) {
        try {
          const apiPatients = await apiService.getPatients(token)
          if (apiPatients && apiPatients.length > 0) {
            setPatients(apiPatients)
          } else {
            loadFromLocalStorage()
          }
        } catch {
          loadFromLocalStorage()
        }
      } else {
        loadFromLocalStorage()
      }
      
      // Load RFID cards from provider
      setRfidCards(cards.map(c => ({
        id: c.id || c.cardUid,
        cardUid: c.cardUid || c.rfidUid,
        label: c.label,
        linkedPatientId: c.linkedPatientId,
        isActive: true,
      })))
    } catch (error) {
      console.error('Error loading data:', error)
      loadFromLocalStorage()
    } finally {
      setIsLoading(false)
    }
  }, [token, cards])

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem('patients')
      if (stored) {
        setPatients(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
  }

  const saveToLocalStorage = (data: Patient[]) => {
    localStorage.setItem('patients', JSON.stringify(data))
  }

  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-fill when RFID is scanned
  useEffect(() => {
    if (lastScannedCard && isLinkDialogOpen) {
      const cardUid = lastScannedCard.cardUid || lastScannedCard.rfidUid
      setSelectedCard(cardUid)
      toast({
        title: 'Card Scanned',
        description: `Card ${cardUid} detected and selected`,
      })
    }
  }, [lastScannedCard, isLinkDialogOpen, toast])

  const handleAddPatient = async () => {
    try {
      const newPatient: Patient = {
        id: `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...formData as Patient,
        createdAt: new Date().toISOString(),
      }
      
      // Try API first
      if (token) {
        try {
          const created = await apiService.createPatient(token, newPatient)
          if (created) {
            newPatient.id = created.id
          }
        } catch (error) {
          console.warn('API save failed, using localStorage:', error)
        }
      }
      
      const updated = [...patients, newPatient]
      setPatients(updated)
      saveToLocalStorage(updated)
      
      toast({
        title: 'Success',
        description: 'Patient added successfully',
      })
      
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add patient',
        variant: 'destructive',
      })
    }
  }

  const handleUpdatePatient = async () => {
    if (!selectedPatient) return
    
    try {
      const updatedPatient: Patient = {
        ...selectedPatient,
        ...formData as Patient,
        updatedAt: new Date().toISOString(),
      }
      
      // Try API first
      if (token) {
        try {
          await apiService.updatePatient(token, selectedPatient.id, updatedPatient)
        } catch (error) {
          console.warn('API update failed, using localStorage:', error)
        }
      }
      
      const updated = patients.map(p => 
        p.id === selectedPatient.id ? updatedPatient : p
      )
      setPatients(updated)
      saveToLocalStorage(updated)
      
      toast({
        title: 'Success',
        description: 'Patient updated successfully',
      })
      
      setIsEditDialogOpen(false)
      setSelectedPatient(null)
      resetForm()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update patient',
        variant: 'destructive',
      })
    }
  }

  const handleDeletePatient = async (patient: Patient) => {
    try {
      // Try API first
      if (token) {
        try {
          await apiService.deletePatient(token, patient.id)
        } catch (error) {
          console.warn('API delete failed, using localStorage:', error)
        }
      }
      
      const updated = patients.filter(p => p.id !== patient.id)
      setPatients(updated)
      saveToLocalStorage(updated)
      
      toast({
        title: 'Success',
        description: 'Patient deleted successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete patient',
        variant: 'destructive',
      })
    }
  }

  const handleLinkRFID = async () => {
    if (!selectedPatient || !selectedCard) return
    
    try {
      // Update patient with RFID
      const updatedPatient: Patient = {
        ...selectedPatient,
        rfidUid: selectedCard,
        updatedAt: new Date().toISOString(),
      }
      
      // Try API
      if (token) {
        try {
          await apiService.linkCard(token, selectedCard, selectedPatient.id)
        } catch (error) {
          console.warn('API link failed:', error)
        }
      }
      
      const updated = patients.map(p => 
        p.id === selectedPatient.id ? updatedPatient : p
      )
      setPatients(updated)
      saveToLocalStorage(updated)
      
      toast({
        title: 'Success',
        description: `RFID card linked to ${selectedPatient.name}`,
      })
      
      setIsLinkDialogOpen(false)
      setSelectedPatient(null)
      setSelectedCard('')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to link RFID card',
        variant: 'destructive',
      })
    }
  }

  const handleUnlinkRFID = async (patient: Patient) => {
    try {
      const updatedPatient: Patient = {
        ...patient,
        rfidUid: undefined,
        updatedAt: new Date().toISOString(),
      }
      
      // Try API
      if (token && patient.rfidUid) {
        try {
          await apiService.unlinkCard(token, patient.rfidUid)
        } catch (error) {
          console.warn('API unlink failed:', error)
        }
      }
      
      const updated = patients.map(p => 
        p.id === patient.id ? updatedPatient : p
      )
      setPatients(updated)
      saveToLocalStorage(updated)
      
      toast({
        title: 'Success',
        description: `RFID card unlinked from ${patient.name}`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unlink RFID card',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      dateOfBirth: '',
      gender: 'other',
      bloodType: '',
      contactNumber: '',
      email: '',
      address: '',
      emergencyContact: '',
      allergies: '',
      medicalHistory: '',
    })
  }

  const openEditDialog = (patient: Patient) => {
    setSelectedPatient(patient)
    setFormData({
      name: patient.name,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      bloodType: patient.bloodType || '',
      contactNumber: patient.contactNumber,
      email: patient.email,
      address: patient.address,
      emergencyContact: patient.emergencyContact || '',
      allergies: patient.allergies || '',
      medicalHistory: patient.medicalHistory || '',
    })
    setIsEditDialogOpen(true)
  }

  const openLinkDialog = (patient: Patient) => {
    setSelectedPatient(patient)
    setSelectedCard(patient.rfidUid || '')
    setIsLinkDialogOpen(true)
  }

  const openViewDialog = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsViewDialogOpen(true)
  }

  // Filter patients by search
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.contactNumber.includes(searchTerm) ||
    (patient.rfidUid && patient.rfidUid.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Get unlinked cards
  const unlinkedCards = cards.filter(card => 
    !patients.some(p => p.rfidUid === (card.cardUid || card.rfidUid))
  )

  // Stats
  const stats = {
    total: patients.length,
    withRFID: patients.filter(p => p.rfidUid).length,
    withoutRFID: patients.filter(p => !p.rfidUid).length,
    recentlyAdded: patients.filter(p => {
      const created = new Date(p.createdAt)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return created > weekAgo
    }).length,
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.recentlyAdded} added this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RFID Linked</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.withRFID}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.withRFID / stats.total) * 100) : 0}% of patients
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Link</CardTitle>
            <Unlink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.withoutRFID}</div>
            <p className="text-xs text-muted-foreground">
              Patients without RFID card
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Cards</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{unlinkedCards.length}</div>
            <p className="text-xs text-muted-foreground">
              Unassigned RFID cards
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients by name, email, phone, or RFID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
                <DialogDescription>
                  Enter the patient's information below
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value as 'male' | 'female' | 'other' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bloodType">Blood Type</Label>
                    <Select
                      value={formData.bloodType || ''}
                      onValueChange={(value) => setFormData({ ...formData, bloodType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="+1 (555) 000-0000"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="patient@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main St, City, State, ZIP"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emergency">Emergency Contact</Label>
                  <Input
                    id="emergency"
                    placeholder="Jane Doe - +1 (555) 111-1111"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    placeholder="List any known allergies..."
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="history">Medical History</Label>
                  <Textarea
                    id="history"
                    placeholder="Brief medical history..."
                    value={formData.medicalHistory}
                    onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddPatient}
                  disabled={!formData.name || !formData.dateOfBirth || !formData.contactNumber || !formData.email}
                >
                  Add Patient
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* RFID Status Banner */}
      {isConnected && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200">
          <CardContent className="flex items-center gap-3 py-3">
            <Radio className="h-5 w-5 text-green-600 animate-pulse" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-300">RFID Reader Connected</p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Scan a card to quickly link it to a patient
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Patients</CardTitle>
          <CardDescription>
            {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No patients found</p>
              <p className="text-sm">
                {searchTerm ? 'Try a different search term' : 'Add your first patient to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Age/Gender</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>RFID Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">{patient.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{calculateAge(patient.dateOfBirth)} yrs</span>
                          <Badge variant="outline" className="capitalize">
                            {patient.gender}
                          </Badge>
                          {patient.bloodType && (
                            <Badge variant="secondary">{patient.bloodType}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{patient.contactNumber}</p>
                      </TableCell>
                      <TableCell>
                        {patient.rfidUid ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                              <CreditCard className="h-3 w-3 mr-1" />
                              Linked
                            </Badge>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {patient.rfidUid.substring(0, 8)}...
                            </code>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                            Not Linked
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openViewDialog(patient)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(patient)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openLinkDialog(patient)}
                          >
                            {patient.rfidUid ? (
                              <Unlink className="h-4 w-4" />
                            ) : (
                              <Link2 className="h-4 w-4" />
                            )}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Patient?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {patient.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDeletePatient(patient)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Patient Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
            <DialogDescription>
              Update patient information
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-dob">Date of Birth *</Label>
                <Input
                  id="edit-dob"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value as 'male' | 'female' | 'other' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Blood Type</Label>
                <Select
                  value={formData.bloodType || ''}
                  onValueChange={(value) => setFormData({ ...formData, bloodType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number *</Label>
                <Input
                  id="edit-phone"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-emergency">Emergency Contact</Label>
              <Input
                id="edit-emergency"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-allergies">Allergies</Label>
              <Textarea
                id="edit-allergies"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-history">Medical History</Label>
              <Textarea
                id="edit-history"
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdatePatient}
              disabled={!formData.name || !formData.dateOfBirth || !formData.contactNumber || !formData.email}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link RFID Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPatient?.rfidUid ? 'Manage RFID Card' : 'Link RFID Card'}
            </DialogTitle>
            <DialogDescription>
              {selectedPatient?.rfidUid 
                ? `Current card: ${selectedPatient.rfidUid}` 
                : `Assign an RFID card to ${selectedPatient?.name}`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {isConnected && (
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
                <CardContent className="flex items-center gap-3 py-3">
                  <Radio className="h-5 w-5 text-blue-600 animate-pulse" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Scan an RFID card to auto-select it
                  </p>
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-2">
              <Label>Select RFID Card</Label>
              <Select value={selectedCard} onValueChange={setSelectedCard}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a card or scan one" />
                </SelectTrigger>
                <SelectContent>
                  {cards.map((card) => {
                    const cardUid = card.cardUid || card.rfidUid
                    const linkedPatient = patients.find(p => p.rfidUid === cardUid)
                    const isLinkedToOther = linkedPatient && linkedPatient.id !== selectedPatient?.id
                    
                    return (
                      <SelectItem 
                        key={card.id || cardUid} 
                        value={cardUid}
                        disabled={isLinkedToOther}
                      >
                        <div className="flex items-center gap-2">
                          <span>{card.label || cardUid}</span>
                          {isLinkedToOther && (
                            <Badge variant="secondary" className="text-xs">
                              Linked to {linkedPatient.name}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Or enter manually</Label>
              <Input
                placeholder="Enter RFID UID..."
                value={selectedCard}
                onChange={(e) => setSelectedCard(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            {selectedPatient?.rfidUid && (
              <Button
                variant="outline"
                className="text-red-600"
                onClick={() => {
                  handleUnlinkRFID(selectedPatient)
                  setIsLinkDialogOpen(false)
                }}
              >
                Unlink Card
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLinkRFID} disabled={!selectedCard}>
              Link Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Patient Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedPatient.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="capitalize">
                      {selectedPatient.gender}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {calculateAge(selectedPatient.dateOfBirth)} years old
                    </span>
                    {selectedPatient.bloodType && (
                      <Badge variant="secondary">{selectedPatient.bloodType}</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                  <p>{new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p>{selectedPatient.contactNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{selectedPatient.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">RFID Status</p>
                  {selectedPatient.rfidUid ? (
                    <Badge className="bg-green-100 text-green-700">
                      Linked: {selectedPatient.rfidUid.substring(0, 12)}...
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not Linked</Badge>
                  )}
                </div>
              </div>
              
              {selectedPatient.address && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p>{selectedPatient.address}</p>
                </div>
              )}
              
              {selectedPatient.emergencyContact && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                  <p>{selectedPatient.emergencyContact}</p>
                </div>
              )}
              
              {selectedPatient.allergies && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Allergies</p>
                  <p className="bg-red-50 dark:bg-red-950 p-2 rounded text-red-700 dark:text-red-300">
                    {selectedPatient.allergies}
                  </p>
                </div>
              )}
              
              {selectedPatient.medicalHistory && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Medical History</p>
                  <p className="bg-muted p-2 rounded text-sm">{selectedPatient.medicalHistory}</p>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                Created: {new Date(selectedPatient.createdAt).toLocaleString()}
                {selectedPatient.updatedAt && (
                  <> • Updated: {new Date(selectedPatient.updatedAt).toLocaleString()}</>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false)
              if (selectedPatient) openEditDialog(selectedPatient)
            }}>
              Edit Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
