/**
 * MedSync Configuration
 * 
 * Centralized configuration for the application.
 * Change these values when deploying to a different computer or environment.
 */

// Server Configuration
export const config = {
  // Python backend WebSocket server
  WS_HOST: process.env.NEXT_PUBLIC_WS_HOST || 'localhost',
  WS_PORT: process.env.NEXT_PUBLIC_WS_PORT || '8000',
  
  // Python backend REST API server
  API_HOST: process.env.NEXT_PUBLIC_API_HOST || 'localhost',
  API_PORT: process.env.NEXT_PUBLIC_API_PORT || '8001',
  
  // Protocol (change to 'wss' and 'https' for production with SSL)
  WS_PROTOCOL: process.env.NEXT_PUBLIC_WS_PROTOCOL || 'ws',
  API_PROTOCOL: process.env.NEXT_PUBLIC_API_PROTOCOL || 'http',
} as const;

// Computed URLs
export const getWsUrl = () => 
  `${config.WS_PROTOCOL}://${config.WS_HOST}:${config.WS_PORT}`;

export const getApiUrl = () => 
  `${config.API_PROTOCOL}://${config.API_HOST}:${config.API_PORT}`;

// Export individual values for convenience
export const WS_URL = getWsUrl();
export const API_URL = getApiUrl();

// Demo credentials for offline/demo mode
export const DEMO_CREDENTIALS = {
  admin: {
    email: 'admin@medsync.local',
    password: 'admin123',
    user: {
      id: 'demo-admin',
      name: 'System Admin',
      email: 'admin@medsync.local',
      role: 'admin' as const,
    },
  },
  doctor: {
    email: 'doctor@medsync.local',
    password: 'doctor123',
    user: {
      id: 'demo-doctor',
      name: 'Dr. Smith',
      email: 'doctor@medsync.local',
      role: 'doctor' as const,
    },
  },
  patient: {
    email: 'patient@medsync.local',
    password: 'patient123',
    user: {
      id: 'demo-patient',
      name: 'John Doe',
      email: 'patient@medsync.local',
      role: 'patient' as const,
    },
  },
  pharmacy: {
    email: 'pharmacy@medsync.local',
    password: 'pharmacy123',
    user: {
      id: 'demo-pharmacy',
      name: 'MedPharm Store',
      email: 'pharmacy@medsync.local',
      role: 'pharmacy' as const,
    },
  },
} as const;

// Get demo user by email
export const getDemoUser = (email: string, password: string) => {
  const entries = Object.values(DEMO_CREDENTIALS);
  const found = entries.find(
    (cred) => cred.email === email && cred.password === password
  );
  return found?.user || null;
};

export default config;
