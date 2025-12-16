"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/providers/auth-provider";
import { useRFID } from "@/providers/rfid-provider";
import { apiService } from "@/services/api-service";
import {
  Activity,
  CreditCard,
  FileText,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  Wifi,
  WifiOff,
  ArrowRight,
  Pill,
  Calendar,
  User,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalPatients: number;
  activePrescriptions: number;
  registeredCards: number;
  recentScans: number;
}

interface RecentActivity {
  id: string;
  type: "scan" | "prescription" | "patient";
  description: string;
  timestamp: string;
  status?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    isConnected,
    isSerialConnected,
    lastScannedData,
    cards,
  } = useRFID();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activePrescriptions: 0,
    registeredCards: 0,
    recentScans: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;
      
      setIsLoading(true);
      
      try {
        // Fetch patients
        const patientsRes = await apiService.getPatients();
        const patients = patientsRes.data?.patients || [];
        
        // Fetch prescriptions based on role
        const prescriptionsRes = await apiService.getPrescriptions(
          user?.role === "doctor" ? { doctorId: user.id } :
          user?.role === "patient" ? { patientId: user.id } :
          undefined
        );
        const prescriptionsData = prescriptionsRes.data?.prescriptions || [];
        setPrescriptions(prescriptionsData);
        
        // Fetch scan logs
        const scanLogsRes = await apiService.getScanLogs(10);
        const scanLogs = scanLogsRes.data?.logs || [];
        
        // Update stats
        setStats({
          totalPatients: patients.length,
          activePrescriptions: prescriptionsData.filter((p: any) => p.status === "active").length,
          registeredCards: cards.length,
          recentScans: scanLogs.length,
        });
        
        // Build recent activity
        const activities: RecentActivity[] = [];
        
        // Add recent scans
        scanLogs.slice(0, 5).forEach((log: any) => {
          activities.push({
            id: `scan-${log.id}`,
            type: "scan",
            description: `Card ${log.label || log.rfid_uid} scanned`,
            timestamp: log.scanned_at,
            status: log.patient_name ? "linked" : "unlinked",
          });
        });
        
        // Add recent prescriptions
        prescriptionsData.slice(0, 3).forEach((rx: any) => {
          activities.push({
            id: `rx-${rx.id}`,
            type: "prescription",
            description: `${rx.medication} - ${rx.dosage}`,
            timestamp: rx.date_issued,
            status: rx.status,
          });
        });
        
        // Sort by timestamp
        activities.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setRecentActivity(activities.slice(0, 5));
        
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        // Use local data as fallback
        setStats({
          totalPatients: 0,
          activePrescriptions: 0,
          registeredCards: cards.length,
          recentScans: 0,
        });
      }
      
      setIsLoading(false);
    };
    
    fetchData();
  }, [isAuthenticated, user, cards]);

  // Loading state
  if (authLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 bg-gray-200 rounded"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.name}</h1>
          <p className="text-muted-foreground">
            {user.role === "doctor" && "Here's an overview of your patients and prescriptions"}
            {user.role === "patient" && "Here's your health dashboard"}
            {user.role === "pharmacy" && "Here's your pharmacy overview"}
            {user.role === "admin" && "System overview and management"}
          </p>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="default" className="gap-1">
                <Wifi className="h-3 w-3" />
                Server Connected
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <WifiOff className="h-3 w-3" />
                Server Offline
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isSerialConnected ? "default" : "secondary"} className="gap-1">
              <CreditCard className="h-3 w-3" />
              {isSerialConnected ? "RFID Ready" : "RFID Not Connected"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Patients / Cards */}
        {(user.role === "doctor" || user.role === "admin") && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPatients}</div>
              <p className="text-xs text-muted-foreground">
                Registered in the system
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Active Prescriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePrescriptions}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
        
        {/* Registered Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">RFID Cards</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.registeredCards}</div>
            <p className="text-xs text-muted-foreground">
              Registered cards
            </p>
          </CardContent>
        </Card>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Scans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentScans}</div>
            <p className="text-xs text-muted-foreground">
              In the last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Last Scanned Card Alert */}
      {lastScannedData && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Card Just Scanned</h3>
                <p className="text-sm text-muted-foreground">
                  {lastScannedData.label || "Unknown Card"} • {lastScannedData.rfidUid}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{lastScannedData.time}</p>
                <p className="text-xs text-muted-foreground">{lastScannedData.date}</p>
              </div>
              <Link href="/rfid">
                <Button variant="outline" size="sm">
                  View Details
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Prescriptions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Prescriptions</CardTitle>
                <CardDescription>
                  {user.role === "doctor" ? "Prescriptions you've issued" : "Your prescriptions"}
                </CardDescription>
              </div>
              <Link href="/prescriptions">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {prescriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No prescriptions found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptions.slice(0, 5).map((rx) => (
                    <TableRow key={rx.id}>
                      <TableCell className="font-medium">{rx.medication}</TableCell>
                      <TableCell>{rx.dosage}</TableCell>
                      <TableCell>
                        <Badge variant={rx.status === "active" ? "default" : "secondary"}>
                          {rx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${
                      activity.type === "scan" ? "bg-blue-100 dark:bg-blue-900" :
                      activity.type === "prescription" ? "bg-green-100 dark:bg-green-900" :
                      "bg-gray-100 dark:bg-gray-800"
                    }`}>
                      {activity.type === "scan" && <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      {activity.type === "prescription" && <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />}
                      {activity.type === "patient" && <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {activity.status && (
                      <Badge variant={
                        activity.status === "active" || activity.status === "linked" ? "default" : "secondary"
                      }>
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for your role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {(user.role === "doctor" || user.role === "admin") && (
              <>
                <Link href="/prescriptions">
                  <Button variant="outline" className="gap-2">
                    <FileText className="h-4 w-4" />
                    New Prescription
                  </Button>
                </Link>
                <Link href="/patients">
                  <Button variant="outline" className="gap-2">
                    <Users className="h-4 w-4" />
                    Manage Patients
                  </Button>
                </Link>
              </>
            )}
            
            {(user.role === "pharmacy" || user.role === "admin") && (
              <Link href="/prescriptions">
                <Button variant="outline" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Verify Prescription
                </Button>
              </Link>
            )}
            
            <Link href="/rfid">
              <Button variant="outline" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Manage RFID Cards
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
