"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { apiService } from "@/services/api-service";
import { useToast } from "@/hooks/use-toast";
import { getDemoUser, DEMO_CREDENTIALS } from "@/lib/config";

export interface User {
  id: string;
  name: string;
  role: "doctor" | "patient" | "pharmacy" | "admin";
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    name: string,
    role: "doctor" | "patient" | "pharmacy"
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  // Load session on mount
  useEffect(() => {
    const initAuth = async () => {
      // Check for stored token
      const token = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("user");
      
      if (token) {
        apiService.setToken(token);
        
        // Validate token with server
        try {
          const response = await apiService.getProfile();
          if (response.data?.user) {
            const userData = response.data.user;
            setUser({
              id: userData.id,
              name: userData.name,
              email: userData.email,
              role: userData.role,
            });
            localStorage.setItem("user", JSON.stringify(userData));
          } else if (storedUser) {
            // Fallback to stored user if API unavailable
            setUser(JSON.parse(storedUser));
          } else {
            // Token invalid
            apiService.setToken(null);
            localStorage.removeItem("user");
          }
        } catch (error) {
          // Server unavailable, use stored user
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } else if (storedUser) {
        // Legacy session without token
        setUser(JSON.parse(storedUser));
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // First, check if this is a demo account
    const demoUser = getDemoUser(email, password);
    
    try {
      const response = await apiService.login(email, password);
      
      if (response.data?.user) {
        const userData = response.data.user;
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
        });
        localStorage.setItem("user", JSON.stringify(userData));
        
        if (response.data.token) {
          apiService.setToken(response.data.token);
        }
        
        toast({
          title: "Welcome Back",
          description: `Logged in as ${userData.name}`,
        });
        
        setIsLoading(false);
        return true;
      }
      
      // If API didn't return a user but we have demo credentials, use them
      if (demoUser) {
        setUser(demoUser);
        localStorage.setItem("user", JSON.stringify(demoUser));
        
        toast({
          title: "Demo Mode",
          description: `Logged in as ${demoUser.name}`,
        });
        
        setIsLoading(false);
        return true;
      }
      
      // API error and no demo user
      toast({
        title: "Login Failed",
        description: response.error || "Invalid credentials",
        variant: "destructive",
      });
      
      setIsLoading(false);
      return false;
    } catch (error) {
      // Server unavailable - try demo login
      console.warn("API unavailable, trying demo mode");
      
      if (demoUser) {
        setUser(demoUser);
        localStorage.setItem("user", JSON.stringify(demoUser));
        
        toast({
          title: "Demo Mode",
          description: `Logged in as ${demoUser.name} (Server offline)`,
        });
        
        setIsLoading(false);
        return true;
      }
      
      toast({
        title: "Login Failed",
        description: "Server unavailable and invalid demo credentials",
        variant: "destructive",
      });
      
      setIsLoading(false);
      return false;
    }
  }, [toast]);

  const register = useCallback(async (
    email: string,
    password: string,
    name: string,
    role: "doctor" | "patient" | "pharmacy"
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await apiService.register(email, password, name, role);
      
      if (response.error) {
        toast({
          title: "Registration Failed",
          description: response.error,
          variant: "destructive",
        });
        setIsLoading(false);
        return false;
      }
      
      if (response.data?.user) {
        const userData = response.data.user;
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
        });
        localStorage.setItem("user", JSON.stringify(userData));
        
        toast({
          title: "Registration Successful",
          description: `Welcome to MedSync, ${userData.name}!`,
        });
        
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Server unavailable. Please try again later.",
        variant: "destructive",
      });
      setIsLoading(false);
      return false;
    }
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      await apiService.logout();
    } catch (error) {
      // Continue with local logout even if server call fails
    }
    
    setUser(null);
    apiService.setToken(null);
    localStorage.removeItem("user");
    
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  }, [toast]);

  const refreshProfile = useCallback(async () => {
    if (!apiService.getToken()) return;
    
    try {
      const response = await apiService.getProfile();
      if (response.data?.user) {
        const userData = response.data.user;
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
        });
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthProvider;
