/**
 * MedSync RFID WebSocket Service
 * Real-time communication with the Python RFID server
 */

import { WS_URL } from '@/lib/config';

export interface RFIDScanData {
  type: 'rfid_scan';
  label: string;
  date: string;
  time: string;
  cardUid: string;
  rfidUid: string;
  timestamp: string;
}

export interface SerialStatus {
  type: 'serial_status';
  status: 'connected' | 'disconnected';
  port?: string;
}

export interface ConnectionStatus {
  type: 'connection';
  status: 'connected' | 'disconnected';
  serialConnected: boolean;
  lastScan: RFIDScanData | null;
}

export interface CardRegistered {
  type: 'card_registered';
  uid: string;
  label: string;
  patientId?: string;
}

export interface ServerError {
  type: 'error';
  message: string;
}

export type RFIDMessage = RFIDScanData | SerialStatus | ConnectionStatus | CardRegistered | ServerError | { type: 'pong' } | { type: 'status'; serialConnected: boolean; isReading: boolean; lastScan: RFIDScanData | null };

type MessageHandler = (message: RFIDMessage) => void;
type ConnectionHandler = (connected: boolean) => void;

class RFIDWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private isConnecting = false;
  private reconnectDelay = 3000;
  private maxReconnectDelay = 30000;
  private currentReconnectDelay = 3000;
  private wsUrl: string;

  constructor() {
    this.wsUrl = WS_URL;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    this.isConnecting = true;
    console.log(`[RFID WS] Connecting to ${this.wsUrl}...`);

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('[RFID WS] Connected');
        this.isConnecting = false;
        this.currentReconnectDelay = this.reconnectDelay;
        this.notifyConnectionHandlers(true);
        this.startPing();
        
        // Request current status
        this.send({ type: 'get_status' });
      };

      this.ws.onclose = (event) => {
        console.log(`[RFID WS] Disconnected (code: ${event.code})`);
        this.isConnecting = false;
        this.cleanup();
        this.notifyConnectionHandlers(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[RFID WS] Error:', error);
        this.isConnecting = false;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: RFIDMessage = JSON.parse(event.data);
          this.notifyMessageHandlers(message);
        } catch (error) {
          console.error('[RFID WS] Failed to parse message:', error);
        }
      };
    } catch (error) {
      console.error('[RFID WS] Failed to create WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  disconnect() {
    this.cleanup();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyConnectionHandlers(false);
  }

  private cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      return;
    }

    console.log(`[RFID WS] Reconnecting in ${this.currentReconnectDelay / 1000}s...`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, this.currentReconnectDelay);

    // Exponential backoff
    this.currentReconnectDelay = Math.min(
      this.currentReconnectDelay * 1.5,
      this.maxReconnectDelay
    );
  }

  private startPing() {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000);
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  // Start serial port reading on the server
  startSerial() {
    this.send({ type: 'start_serial' });
  }

  // Stop serial port reading on the server
  stopSerial() {
    this.send({ type: 'stop_serial' });
  }

  // Request current status
  getStatus() {
    this.send({ type: 'get_status' });
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  private notifyMessageHandlers(message: RFIDMessage) {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error('[RFID WS] Handler error:', error);
      }
    });
  }

  private notifyConnectionHandlers(connected: boolean) {
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(connected);
      } catch (error) {
        console.error('[RFID WS] Connection handler error:', error);
      }
    });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const rfidWebSocket = new RFIDWebSocketService();
export default rfidWebSocket;
