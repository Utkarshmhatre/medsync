"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Shield, Stethoscope, User, Building2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  
  // Login form
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  
  // Register form
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient" as "doctor" | "patient" | "pharmacy",
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      toast({
        title: "Error",
        description: "Please enter email and password",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    const success = await login(loginData.email, loginData.password);
    setIsLoading(false);
    
    if (success) {
      router.push("/dashboard");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!registerData.name || !registerData.email || !registerData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    if (registerData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    const success = await register(
      registerData.email,
      registerData.password,
      registerData.name,
      registerData.role
    );
    setIsLoading(false);
    
    if (success) {
      router.push("/dashboard");
    }
  };

  // Demo login helper
  const handleDemoLogin = async (role: string) => {
    const demoCredentials: Record<string, { email: string; password: string }> = {
      doctor: { email: "doctor@medsync.local", password: "doctor123" },
      patient: { email: "patient@medsync.local", password: "patient123" },
      pharmacy: { email: "pharmacy@medsync.local", password: "pharmacy123" },
      admin: { email: "admin@medsync.local", password: "admin123" },
    };
    
    const creds = demoCredentials[role];
    if (creds) {
      setIsLoading(true);
      const success = await login(creds.email, creds.password);
      setIsLoading(false);
      
      if (success) {
        router.push("/dashboard");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-white/10 rounded-full">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">MedSync</h1>
          <p className="text-purple-200 mt-2">
            RFID-Integrated Smart Health Card System
          </p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-2xl">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-4">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                  
                  {/* Demo Logins */}
                  <div className="w-full">
                    <p className="text-xs text-center text-muted-foreground mb-2">
                      Demo Accounts (click to login)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDemoLogin("doctor")}
                        disabled={isLoading}
                        className="text-xs"
                      >
                        <Stethoscope className="h-3 w-3 mr-1" />
                        Doctor
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDemoLogin("patient")}
                        disabled={isLoading}
                        className="text-xs"
                      >
                        <User className="h-3 w-3 mr-1" />
                        Patient
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDemoLogin("pharmacy")}
                        disabled={isLoading}
                        className="text-xs"
                      >
                        <Building2 className="h-3 w-3 mr-1" />
                        Pharmacy
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDemoLogin("admin")}
                        disabled={isLoading}
                        className="text-xs"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="John Doe"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="you@example.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-role">Account Type</Label>
                    <Select
                      value={registerData.role}
                      onValueChange={(value: "doctor" | "patient" | "pharmacy") => 
                        setRegisterData({ ...registerData, role: value })
                      }
                    >
                      <SelectTrigger id="register-role">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            Patient
                          </div>
                        </SelectItem>
                        <SelectItem value="doctor">
                          <div className="flex items-center">
                            <Stethoscope className="h-4 w-4 mr-2" />
                            Healthcare Provider
                          </div>
                        </SelectItem>
                        <SelectItem value="pharmacy">
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-2" />
                            Pharmacy
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm">Confirm Password</Label>
                    <Input
                      id="register-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <p className="text-center text-purple-200/60 text-sm mt-6">
          Secure health data management with RFID technology
        </p>
      </div>
    </div>
  );
}
