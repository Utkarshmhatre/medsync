/**
 * MedSync API Service
 * Handles all communication with the Python backend REST API
 */

import { API_URL } from '@/lib/config';

const API_BASE_URL = API_URL;

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || 'An error occurred',
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(email: string, password: string, name: string, role: string) {
    const response = await this.request<{ token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async getProfile() {
    return this.request<{ user: any }>('/api/auth/profile');
  }

  async logout() {
    const response = await this.request('/api/auth/logout', { method: 'POST' });
    this.setToken(null);
    return response;
  }

  // Patient endpoints
  async getPatients() {
    return this.request<{ patients: any[] }>('/api/patients');
  }

  async getPatient(id: string) {
    return this.request<any>(`/api/patients/${id}`);
  }

  async createPatient(patient: {
    name: string;
    dateOfBirth?: string;
    gender?: string;
    contact?: string;
    email?: string;
    address?: string;
    rfidUid?: string;
  }) {
    return this.request<{ id: string }>('/api/patients', {
      method: 'POST',
      body: JSON.stringify(patient),
    });
  }

  async updatePatient(id: string, patient: Partial<{
    name: string;
    dateOfBirth: string;
    gender: string;
    contact: string;
    email: string;
    address: string;
    rfidUid: string;
  }>) {
    return this.request(`/api/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patient),
    });
  }

  // RFID Card endpoints
  async getRFIDCards() {
    return this.request<{ cards: any[] }>('/api/rfid/cards');
  }

  async registerRFIDCard(uid: string, label: string, patientId?: string) {
    return this.request('/api/rfid/cards', {
      method: 'POST',
      body: JSON.stringify({ uid, label, patientId }),
    });
  }

  async updateRFIDCard(uid: string, label?: string, patientId?: string | null) {
    return this.request(`/api/rfid/cards/${uid}`, {
      method: 'PUT',
      body: JSON.stringify({ label, patientId }),
    });
  }

  async deleteRFIDCard(uid: string) {
    return this.request(`/api/rfid/cards/${uid}`, {
      method: 'DELETE',
    });
  }

  // Prescription endpoints
  async getPrescriptions(filters?: {
    patientId?: string;
    doctorId?: string;
    status?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.patientId) params.append('patientId', filters.patientId);
    if (filters?.doctorId) params.append('doctorId', filters.doctorId);
    if (filters?.status) params.append('status', filters.status);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ prescriptions: any[] }>(`/api/prescriptions${query}`);
  }

  async createPrescription(prescription: {
    patientId: string;
    medication: string;
    dosage: string;
    frequency: string;
    dateExpires?: string;
    notes?: string;
  }) {
    return this.request<{ id: string; barcode: string }>('/api/prescriptions', {
      method: 'POST',
      body: JSON.stringify(prescription),
    });
  }

  async verifyPrescription(idOrBarcode: string) {
    return this.request(`/api/prescriptions/${idOrBarcode}/verify`, {
      method: 'POST',
    });
  }

  // Scan logs
  async getScanLogs(limit = 100) {
    return this.request<{ logs: any[] }>(`/api/scan-logs?limit=${limit}`);
  }

  // Health check
  async healthCheck() {
    return this.request<{
      status: string;
      timestamp: string;
      websocket_clients: number;
      serial_connected: boolean;
    }>('/health');
  }
}

export const apiService = new ApiService();
export default apiService;
