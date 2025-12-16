"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/providers/auth-provider";
import { useRFID } from "@/providers/rfid-provider";
import { apiService } from "@/services/api-service";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  QrCode,
  CheckCircle2,
  CreditCard,
  FileText,
  User,
  Pill,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  medication: string;
  dosage: string;
  frequency: string;
  date_issued: string;
  date_expires?: string;
  status: string;
  notes?: string;
  barcode?: string;
  verified_at?: string;
  verified_by?: string;
  patient_name?: string;
  doctor_name?: string;
}

interface Patient {
  id: string;
  name: string;
  email?: string;
  rfid_uid?: string;
}

export default function PrescriptionsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { lastScannedData, cards, getPatientByRFID } = useRFID();
  const { toast } = useToast();
  
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  
  // Form states
  const [newPrescription, setNewPrescription] = useState({
    patientId: "",
    medication: "",
    dosage: "",
    frequency: "",
    dateExpires: "",
    notes: "",
  });
  
  const [verifyInput, setVerifyInput] = useState("");
  const [verifiedPrescription, setVerifiedPrescription] = useState<Prescription | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !user) return;
      
      setIsLoading(true);
      
      try {
        // Fetch prescriptions based on role
        const prescriptionsRes = await apiService.getPrescriptions(
          user.role === "doctor" ? { doctorId: user.id } :
          user.role === "patient" ? { patientId: user.id } :
          undefined
        );
        setPrescriptions(prescriptionsRes.data?.prescriptions || []);
        
        // Fetch patients for doctors
        if (user.role === "doctor" || user.role === "admin") {
          const patientsRes = await apiService.getPatients();
          setPatients(patientsRes.data?.patients || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
      
      setIsLoading(false);
    };
    
    fetchData();
  }, [isAuthenticated, user]);

  // Auto-fill patient when RFID card is scanned
  useEffect(() => {
    if (lastScannedData && isNewDialogOpen) {
      const card = cards.find(c => c.uid === lastScannedData.rfidUid);
      if (card?.patientId) {
        setNewPrescription(prev => ({ ...prev, patientId: card.patientId! }));
        toast({
          title: "Patient Selected",
          description: `Auto-selected patient from scanned card`,
        });
      }
    }
  }, [lastScannedData, isNewDialogOpen, cards, toast]);

  const handleCreatePrescription = async () => {
    if (!newPrescription.patientId || !newPrescription.medication || 
        !newPrescription.dosage || !newPrescription.frequency) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await apiService.createPrescription({
        patientId: newPrescription.patientId,
        medication: newPrescription.medication,
        dosage: newPrescription.dosage,
        frequency: newPrescription.frequency,
        dateExpires: newPrescription.dateExpires || undefined,
        notes: newPrescription.notes || undefined,
      });
      
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Prescription Created",
        description: `Barcode: ${response.data?.barcode}`,
      });
      
      // Refresh prescriptions
      const prescriptionsRes = await apiService.getPrescriptions(
        user?.role === "doctor" ? { doctorId: user.id } : undefined
      );
      setPrescriptions(prescriptionsRes.data?.prescriptions || []);
      
      // Reset form
      setNewPrescription({
        patientId: "",
        medication: "",
        dosage: "",
        frequency: "",
        dateExpires: "",
        notes: "",
      });
      setIsNewDialogOpen(false);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create prescription",
        variant: "destructive",
      });
    }
  };

  const handleVerifyPrescription = async () => {
    if (!verifyInput) {
      toast({
        title: "Error",
        description: "Please enter a prescription ID or barcode",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await apiService.verifyPrescription(verifyInput);
      
      if (response.error) {
        toast({
          title: "Verification Failed",
          description: response.error,
          variant: "destructive",
        });
        setVerifiedPrescription(null);
        return;
      }
      
      setVerifiedPrescription(response.data);
      toast({
        title: "Prescription Verified",
        description: `${response.data.medication} - ${response.data.dosage}`,
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify prescription",
        variant: "destructive",
      });
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.name || "Unknown";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Prescriptions</h1>
          <p className="text-muted-foreground">
            {user.role === "doctor" && "Manage and create prescriptions"}
            {user.role === "patient" && "View your prescriptions"}
            {user.role === "pharmacy" && "Verify and dispense prescriptions"}
            {user.role === "admin" && "Manage all prescriptions"}
          </p>
        </div>
        
        <div className="flex gap-2">
          {/* Verify Prescription (Pharmacy) */}
          {(user.role === "pharmacy" || user.role === "admin") && (
            <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <QrCode className="h-4 w-4" />
                  Verify Prescription
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Verify Prescription</DialogTitle>
                  <DialogDescription>
                    Enter the prescription barcode or ID to verify
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="verify-input">Barcode / Prescription ID</Label>
                    <div className="flex gap-2">
                      <Input
                        id="verify-input"
                        placeholder="RX-XXXXXXXX or prescription ID"
                        value={verifyInput}
                        onChange={(e) => setVerifyInput(e.target.value)}
                      />
                      <Button onClick={handleVerifyPrescription}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Verification Result */}
                  {verifiedPrescription && (
                    <Card className="border-green-500 bg-green-50 dark:bg-green-950">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-semibold">Verified</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Patient</p>
                            <p className="font-medium">{verifiedPrescription.patient_name}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Doctor</p>
                            <p className="font-medium">{verifiedPrescription.doctor_name}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Medication</p>
                            <p className="font-medium">{verifiedPrescription.medication}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Dosage</p>
                            <p className="font-medium">{verifiedPrescription.dosage}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Frequency</p>
                            <p className="font-medium">{verifiedPrescription.frequency}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            {getStatusBadge(verifiedPrescription.status)}
                          </div>
                        </div>
                        {verifiedPrescription.notes && (
                          <div>
                            <p className="text-muted-foreground text-sm">Notes</p>
                            <p className="text-sm">{verifiedPrescription.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsVerifyDialogOpen(false);
                    setVerifyInput("");
                    setVerifiedPrescription(null);
                  }}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          {/* New Prescription (Doctor) */}
          {(user.role === "doctor" || user.role === "admin") && (
            <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Prescription
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Prescription</DialogTitle>
                  <DialogDescription>
                    Scan a patient's RFID card to auto-select, or choose from the list
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* RFID Scan Hint */}
                  {lastScannedData && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-sm">
                      <CreditCard className="h-4 w-4 text-blue-500" />
                      <span>Last scanned: {lastScannedData.rfidUid}</span>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="patient">Patient *</Label>
                    <Select
                      value={newPrescription.patientId}
                      onValueChange={(value) => setNewPrescription({ ...newPrescription, patientId: value })}
                    >
                      <SelectTrigger id="patient">
                        <SelectValue placeholder="Select a patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              {patient.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="medication">Medication *</Label>
                    <Input
                      id="medication"
                      placeholder="e.g., Amoxicillin 500mg"
                      value={newPrescription.medication}
                      onChange={(e) => setNewPrescription({ ...newPrescription, medication: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dosage">Dosage *</Label>
                      <Input
                        id="dosage"
                        placeholder="e.g., 1 tablet"
                        value={newPrescription.dosage}
                        onChange={(e) => setNewPrescription({ ...newPrescription, dosage: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequency *</Label>
                      <Input
                        id="frequency"
                        placeholder="e.g., 3 times daily"
                        value={newPrescription.frequency}
                        onChange={(e) => setNewPrescription({ ...newPrescription, frequency: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expires">Expiry Date (Optional)</Label>
                    <Input
                      id="expires"
                      type="date"
                      value={newPrescription.dateExpires}
                      onChange={(e) => setNewPrescription({ ...newPrescription, dateExpires: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional instructions..."
                      value={newPrescription.notes}
                      onChange={(e) => setNewPrescription({ ...newPrescription, notes: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePrescription}>
                    Create Prescription
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Prescriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {user.role === "patient" ? "Your Prescriptions" : "All Prescriptions"}
          </CardTitle>
          <CardDescription>
            {prescriptions.length} prescription(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No prescriptions found</p>
              {user.role === "doctor" && (
                <Button 
                  variant="link" 
                  onClick={() => setIsNewDialogOpen(true)}
                  className="mt-2"
                >
                  Create your first prescription
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  {user.role !== "patient" && <TableHead>Patient</TableHead>}
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  {(user.role === "pharmacy" || user.role === "admin") && (
                    <TableHead>Barcode</TableHead>
                  )}
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {new Date(prescription.date_issued).toLocaleDateString()}
                      </div>
                    </TableCell>
                    {user.role !== "patient" && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {prescription.patient_name || getPatientName(prescription.patient_id)}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{prescription.medication}</TableCell>
                    <TableCell>{prescription.dosage}</TableCell>
                    <TableCell>{prescription.frequency}</TableCell>
                    <TableCell>{getStatusBadge(prescription.status)}</TableCell>
                    {(user.role === "pharmacy" || user.role === "admin") && (
                      <TableCell>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {prescription.barcode || "N/A"}
                        </code>
                      </TableCell>
                    )}
                    <TableCell className="max-w-[200px] truncate">
                      {prescription.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
