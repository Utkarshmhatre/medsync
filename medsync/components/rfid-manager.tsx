"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/alert-dialog";
import { useRFID } from "@/providers/rfid-provider";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api-service";
import {
  Wifi,
  WifiOff,
  Radio,
  RadioTower,
  Plus,
  Trash2,
  Edit,
  User,
  CreditCard,
  Activity,
  Clock,
  Link,
  Unlink,
  RefreshCw,
  Play,
  Square,
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  email?: string;
}

export function RFIDManager() {
  const {
    isConnected,
    isSerialConnected,
    isReading,
    lastScannedData,
    cards,
    startReading,
    stopReading,
    addCard,
    removeCard,
    updateCard,
    refreshCards,
  } = useRFID();
  
  const { toast } = useToast();
  
  // State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [newCardData, setNewCardData] = useState({ uid: "", label: "", patientId: "" });
  const [editCardData, setEditCardData] = useState({ uid: "", label: "", patientId: "" });
  const [isLoading, setIsLoading] = useState(false);
  
  // Use last scanned card UID for quick registration
  useEffect(() => {
    if (lastScannedData && isAddDialogOpen) {
      setNewCardData(prev => ({
        ...prev,
        uid: lastScannedData.rfidUid
      }));
    }
  }, [lastScannedData, isAddDialogOpen]);
  
  // Fetch patients for linking
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await apiService.getPatients();
        if (response.data?.patients) {
          setPatients(response.data.patients);
        }
      } catch (error) {
        console.error("Failed to fetch patients:", error);
      }
    };
    fetchPatients();
  }, []);
  
  const handleAddCard = async () => {
    if (!newCardData.uid || !newCardData.label) {
      toast({
        title: "Error",
        description: "Please provide both Card UID and Label",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    const success = await addCard(
      newCardData.uid,
      newCardData.label,
      newCardData.patientId || undefined
    );
    setIsLoading(false);
    
    if (success) {
      setNewCardData({ uid: "", label: "", patientId: "" });
      setIsAddDialogOpen(false);
    }
  };
  
  const handleEditCard = async () => {
    if (!editCardData.uid || !editCardData.label) {
      toast({
        title: "Error",
        description: "Please provide a label",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    const success = await updateCard(
      editCardData.uid,
      editCardData.label,
      editCardData.patientId || null
    );
    setIsLoading(false);
    
    if (success) {
      setEditCardData({ uid: "", label: "", patientId: "" });
      setIsEditDialogOpen(false);
    }
  };
  
  const handleRemoveCard = async (uid: string) => {
    await removeCard(uid);
  };
  
  const handleLinkPatient = async (cardUid: string, patientId: string | null) => {
    setIsLoading(true);
    await updateCard(cardUid, undefined, patientId);
    setIsLoading(false);
    setIsLinkDialogOpen(false);
    setSelectedCard(null);
  };
  
  const openEditDialog = (card: typeof cards[0]) => {
    setEditCardData({
      uid: card.uid,
      label: card.label,
      patientId: card.patientId || "",
    });
    setIsEditDialogOpen(true);
  };
  
  const openLinkDialog = (cardUid: string) => {
    setSelectedCard(cardUid);
    setIsLinkDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* WebSocket Connection Status */}
        <Card>
          <CardContent className="p-4 flex items-center space-x-4">
            {isConnected ? (
              <Wifi className="h-8 w-8 text-green-500" />
            ) : (
              <WifiOff className="h-8 w-8 text-red-500" />
            )}
            <div>
              <p className="text-sm font-medium">Server</p>
              <p className="text-xs text-muted-foreground">
                {isConnected ? "Connected" : "Disconnected"}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Serial Port Status */}
        <Card>
          <CardContent className="p-4 flex items-center space-x-4">
            {isSerialConnected ? (
              <RadioTower className="h-8 w-8 text-green-500" />
            ) : (
              <Radio className="h-8 w-8 text-yellow-500" />
            )}
            <div>
              <p className="text-sm font-medium">RFID Reader</p>
              <p className="text-xs text-muted-foreground">
                {isSerialConnected ? "Connected" : "Not Connected"}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Registered Cards Count */}
        <Card>
          <CardContent className="p-4 flex items-center space-x-4">
            <CreditCard className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Cards</p>
              <p className="text-xs text-muted-foreground">
                {cards.length} Registered
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Reading Status */}
        <Card>
          <CardContent className="p-4 flex items-center space-x-4">
            <Activity className={`h-8 w-8 ${isReading ? "text-green-500 animate-pulse" : "text-gray-400"}`} />
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-xs text-muted-foreground">
                {isReading ? "Scanning..." : "Idle"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Last Scanned Card */}
      {lastScannedData && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Last Scanned Card</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Card UID</p>
                <p className="font-mono text-sm">{lastScannedData.rfidUid}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="text-sm flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {lastScannedData.time}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm">{lastScannedData.date}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Label</p>
                <p className="text-sm">{lastScannedData.label || "Unknown"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Control Buttons */}
      <div className="flex flex-wrap gap-2">
        {isReading ? (
          <Button variant="destructive" onClick={stopReading}>
            <Square className="h-4 w-4 mr-2" />
            Stop Reading
          </Button>
        ) : (
          <Button onClick={startReading} disabled={!isConnected}>
            <Play className="h-4 w-4 mr-2" />
            Start Reading
          </Button>
        )}
        
        <Button variant="outline" onClick={() => refreshCards()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Cards
        </Button>
        
        {/* Add Card Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New RFID Card</DialogTitle>
              <DialogDescription>
                Scan a card to auto-fill the UID, or enter it manually.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="card-uid">Card UID</Label>
                <Input
                  id="card-uid"
                  placeholder="Scan card or enter UID"
                  value={newCardData.uid}
                  onChange={(e) => setNewCardData({ ...newCardData, uid: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-label">Label / Name</Label>
                <Input
                  id="card-label"
                  placeholder="e.g., John Doe's Card"
                  value={newCardData.label}
                  onChange={(e) => setNewCardData({ ...newCardData, label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-patient">Link to Patient (Optional)</Label>
                <Select
                  value={newCardData.patientId}
                  onValueChange={(value) => setNewCardData({ ...newCardData, patientId: value })}
                >
                  <SelectTrigger id="card-patient">
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCard} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Card"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Cards Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Cards</CardTitle>
          <CardDescription>
            Manage RFID cards and their patient associations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Card UID</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Linked Patient</TableHead>
                <TableHead>Last Scanned</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No cards registered. Click "Add Card" to register a new card.
                  </TableCell>
                </TableRow>
              ) : (
                cards.map((card) => (
                  <TableRow key={card.uid}>
                    <TableCell className="font-mono text-sm">{card.uid}</TableCell>
                    <TableCell>{card.label}</TableCell>
                    <TableCell>
                      {card.patientName ? (
                        <Badge variant="secondary" className="flex items-center w-fit">
                          <User className="h-3 w-3 mr-1" />
                          {card.patientName}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {card.lastScanned ? (
                        <span className="text-sm">
                          {new Date(card.lastScanned).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={card.isActive ? "default" : "destructive"}>
                        {card.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(card)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openLinkDialog(card.uid)}
                          title={card.patientId ? "Change Patient" : "Link Patient"}
                        >
                          {card.patientId ? (
                            <Link className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Unlink className="h-4 w-4" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Remove"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Card?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will deactivate the card "{card.label}" ({card.uid}).
                                This action can be undone by re-registering the card.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveCard(card.uid)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Edit Card Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
            <DialogDescription>
              Update the card label and patient association
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Card UID</Label>
              <Input value={editCardData.uid} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-label">Label / Name</Label>
              <Input
                id="edit-label"
                value={editCardData.label}
                onChange={(e) => setEditCardData({ ...editCardData, label: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-patient">Link to Patient</Label>
              <Select
                value={editCardData.patientId || "__none__"}
                onValueChange={(value) => setEditCardData({ ...editCardData, patientId: value === "__none__" ? "" : value })}
              >
                <SelectTrigger id="edit-patient">
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No patient</SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCard} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Link Patient Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Card to Patient</DialogTitle>
            <DialogDescription>
              Associate this RFID card with a patient record
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Patient</Label>
              <Select
                onValueChange={(value) => {
                  if (selectedCard) {
                    handleLinkPatient(selectedCard, value === "__unlink__" ? null : value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient to link" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unlink__">Unlink (No patient)</SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} {patient.email && `(${patient.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RFIDManager;
