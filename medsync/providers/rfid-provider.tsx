"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { rfidWebSocket, RFIDScanData, RFIDMessage } from "@/services/rfid-websocket";
import { apiService } from "@/services/api-service";
import { useToast } from "@/hooks/use-toast";

export interface RFIDCard {
  uid: string;
  label: string;
  patientId?: string;
  patientName?: string;
  registeredAt: string;
  lastScanned?: string;
  isActive: boolean;
}

interface RFIDContextType {
  // Connection state
  isConnected: boolean;
  isSerialConnected: boolean;
  isReading: boolean;
  
  // Data
  lastScannedData: RFIDScanData | null;
  cards: RFIDCard[];
  
  // Legacy compatibility
  userData: { [rfidUid: string]: string };
  
  // Actions
  startReading: () => void;
  stopReading: () => void;
  addCard: (uid: string, label: string, patientId?: string) => Promise<boolean>;
  removeCard: (uid: string) => Promise<boolean>;
  updateCard: (uid: string, label?: string, patientId?: string | null) => Promise<boolean>;
  refreshCards: () => Promise<void>;
  
  // Legacy compatibility
  addUser: (uid: string, name: string) => void;
  removeUser: (uid: string) => void;
  renameUser: (uid: string, newName: string) => void;
  
  // Patient lookup
  getPatientByRFID: (rfidUid: string) => Promise<any | null>;
}

const RFIDContext = createContext<RFIDContextType | null>(null);

export function RFIDProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [isReading, setIsReading] = useState(false);
  
  // Data state
  const [lastScannedData, setLastScannedData] = useState<RFIDScanData | null>(null);
  const [cards, setCards] = useState<RFIDCard[]>([]);

  // Legacy userData computed from cards
  const userData = cards.reduce((acc, card) => {
    acc[card.uid] = card.label;
    return acc;
  }, {} as { [key: string]: string });

  // Load cards from localStorage as fallback
  const loadLocalCards = useCallback(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('rfid_cards');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return [];
        }
      }
      // Migrate from old userData format
      const oldUserData = localStorage.getItem('userData');
      if (oldUserData) {
        try {
          const parsed = JSON.parse(oldUserData);
          return Object.entries(parsed).map(([uid, label]) => ({
            uid,
            label: label as string,
            registeredAt: new Date().toISOString(),
            isActive: true,
          }));
        } catch {
          return [];
        }
      }
    }
    return [];
  }, []);

  // Save cards to localStorage as backup
  const saveLocalCards = useCallback((cardsData: RFIDCard[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rfid_cards', JSON.stringify(cardsData));
      // Also save in legacy format for backwards compatibility
      const legacyData = cardsData.reduce((acc, card) => {
        acc[card.uid] = card.label;
        return acc;
      }, {} as { [key: string]: string });
      localStorage.setItem('userData', JSON.stringify(legacyData));
    }
  }, []);

  // Fetch cards from API
  const refreshCards = useCallback(async () => {
    try {
      const response = await apiService.getRFIDCards();
      if (response.data?.cards) {
        const mappedCards: RFIDCard[] = response.data.cards.map((card: any) => ({
          uid: card.uid,
          label: card.label,
          patientId: card.patient_id,
          patientName: card.patient_name,
          registeredAt: card.registered_at,
          lastScanned: card.last_scanned,
          isActive: card.is_active === 1,
        }));
        setCards(mappedCards);
        saveLocalCards(mappedCards);
      }
    } catch (error) {
      console.error('Failed to fetch cards from API, using local storage:', error);
      // Fallback to local storage
      setCards(loadLocalCards());
    }
  }, [loadLocalCards, saveLocalCards]);

  // Handle WebSocket messages
  useEffect(() => {
    const handleMessage = (message: RFIDMessage) => {
      switch (message.type) {
        case 'rfid_scan':
          setLastScannedData(message);
          // Find card label
          const card = cards.find(c => c.uid === message.rfidUid);
          toast({
            title: "Card Scanned",
            description: card 
              ? `${card.label} (${message.rfidUid})` 
              : `Unknown card: ${message.rfidUid}`,
            variant: card ? "default" : "destructive",
          });
          break;
          
        case 'serial_status':
          setIsSerialConnected(message.status === 'connected');
          setIsReading(message.status === 'connected');
          toast({
            title: "Serial Port",
            description: message.status === 'connected' 
              ? `Connected to ${message.port}` 
              : "Disconnected",
          });
          break;
          
        case 'connection':
          setIsSerialConnected(message.serialConnected);
          if (message.lastScan) {
            setLastScannedData(message.lastScan);
          }
          break;
          
        case 'status':
          setIsSerialConnected(message.serialConnected);
          setIsReading(message.isReading);
          if (message.lastScan) {
            setLastScannedData(message.lastScan);
          }
          break;
          
        case 'card_registered':
          refreshCards();
          toast({
            title: "Card Registered",
            description: `${message.label} has been registered`,
          });
          break;
          
        case 'error':
          toast({
            title: "Error",
            description: message.message,
            variant: "destructive",
          });
          break;
      }
    };

    const handleConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
      if (connected) {
        toast({
          title: "Connected",
          description: "Connected to RFID server",
        });
      } else {
        setIsSerialConnected(false);
        setIsReading(false);
      }
    };

    // Set up handlers
    const unsubMessage = rfidWebSocket.onMessage(handleMessage);
    const unsubConnection = rfidWebSocket.onConnectionChange(handleConnectionChange);

    return () => {
      unsubMessage();
      unsubConnection();
    };
  }, [cards, toast, refreshCards]);

  // Initialize WebSocket connection
  useEffect(() => {
    // Load initial data from localStorage
    setCards(loadLocalCards());
    
    // Connect to WebSocket
    rfidWebSocket.connect();
    
    // Try to load cards from API
    refreshCards();
    
    return () => {
      // Don't disconnect on unmount - let other components use the connection
    };
  }, [loadLocalCards, refreshCards]);

  // Actions
  const startReading = useCallback(() => {
    rfidWebSocket.startSerial();
  }, []);

  const stopReading = useCallback(() => {
    rfidWebSocket.stopSerial();
    setIsReading(false);
  }, []);

  const addCard = useCallback(async (uid: string, label: string, patientId?: string): Promise<boolean> => {
    try {
      const response = await apiService.registerRFIDCard(uid, label, patientId);
      if (response.error) {
        // If API fails, still add locally
        const newCard: RFIDCard = {
          uid,
          label,
          patientId,
          registeredAt: new Date().toISOString(),
          isActive: true,
        };
        const newCards = [...cards, newCard];
        setCards(newCards);
        saveLocalCards(newCards);
        toast({
          title: "Card Added (Offline)",
          description: `Added ${label} - will sync when online`,
        });
        return true;
      }
      await refreshCards();
      toast({
        title: "Card Added",
        description: `Successfully registered ${label}`,
      });
      return true;
    } catch (error) {
      // Fallback to local storage
      const newCard: RFIDCard = {
        uid,
        label,
        patientId,
        registeredAt: new Date().toISOString(),
        isActive: true,
      };
      const newCards = [...cards, newCard];
      setCards(newCards);
      saveLocalCards(newCards);
      toast({
        title: "Card Added (Offline)",
        description: `Added ${label} - will sync when online`,
      });
      return true;
    }
  }, [cards, toast, refreshCards, saveLocalCards]);

  const removeCard = useCallback(async (uid: string): Promise<boolean> => {
    try {
      const response = await apiService.deleteRFIDCard(uid);
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return false;
      }
      await refreshCards();
      toast({
        title: "Card Removed",
        description: `Card ${uid} has been deactivated`,
      });
      return true;
    } catch (error) {
      // Fallback to local storage
      const newCards = cards.filter(c => c.uid !== uid);
      setCards(newCards);
      saveLocalCards(newCards);
      toast({
        title: "Card Removed (Offline)",
        description: `Removed card ${uid} - will sync when online`,
      });
      return true;
    }
  }, [cards, toast, refreshCards, saveLocalCards]);

  const updateCard = useCallback(async (uid: string, label?: string, patientId?: string | null): Promise<boolean> => {
    try {
      const response = await apiService.updateRFIDCard(uid, label, patientId ?? undefined);
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return false;
      }
      await refreshCards();
      toast({
        title: "Card Updated",
        description: `Card ${uid} has been updated`,
      });
      return true;
    } catch (error) {
      // Fallback to local storage
      const newCards = cards.map(c => {
        if (c.uid === uid) {
          return {
            ...c,
            label: label ?? c.label,
            patientId: patientId === null ? undefined : (patientId ?? c.patientId),
          };
        }
        return c;
      });
      setCards(newCards);
      saveLocalCards(newCards);
      toast({
        title: "Card Updated (Offline)",
        description: `Updated card ${uid} - will sync when online`,
      });
      return true;
    }
  }, [cards, toast, refreshCards, saveLocalCards]);

  // Legacy compatibility methods
  const addUser = useCallback((uid: string, name: string) => {
    addCard(uid, name);
  }, [addCard]);

  const removeUser = useCallback((uid: string) => {
    removeCard(uid);
  }, [removeCard]);

  const renameUser = useCallback((uid: string, newName: string) => {
    updateCard(uid, newName);
  }, [updateCard]);

  const getPatientByRFID = useCallback(async (rfidUid: string): Promise<any | null> => {
    try {
      const response = await apiService.getPatient(rfidUid);
      return response.data ?? null;
    } catch {
      return null;
    }
  }, []);

  const value: RFIDContextType = {
    isConnected,
    isSerialConnected,
    isReading,
    lastScannedData,
    cards,
    userData,
    startReading,
    stopReading,
    addCard,
    removeCard,
    updateCard,
    refreshCards,
    addUser,
    removeUser,
    renameUser,
    getPatientByRFID,
  };

  return (
    <RFIDContext.Provider value={value}>
      {children}
    </RFIDContext.Provider>
  );
}

export function useRFID() {
  const context = useContext(RFIDContext);
  if (!context) {
    throw new Error("useRFID must be used within an RFIDProvider");
  }
  return context;
}

export default RFIDProvider;
