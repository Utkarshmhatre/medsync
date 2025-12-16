'use client'

import { useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  User,
  Mail,
  Phone,
  Shield,
  Bell,
  Lock,
  Palette,
  Activity,
  Calendar,
  MapPin,
  Edit3,
  Camera,
  Save,
  Key,
  Fingerprint,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Check,
} from 'lucide-react'

interface ProfileData {
  name: string
  email: string
  phone: string
  address: string
  department?: string
  specialization?: string
  licenseNumber?: string
}

export function ProfileSection() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+1 (555) 000-0000',
    address: '123 Medical Center Dr, Healthcare City',
    department: 'General Medicine',
    specialization: user?.role === 'doctor' ? 'Internal Medicine' : undefined,
    licenseNumber: user?.role === 'doctor' ? 'MD-2024-001234' : undefined,
  })
  
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    darkMode: false,
    twoFactorAuth: false,
    biometricLogin: false,
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      case 'doctor': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'pharmacy': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'patient': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />
      case 'doctor': return <Activity className="h-4 w-4" />
      case 'pharmacy': return <Globe className="h-4 w-4" />
      case 'patient': return <User className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  const handleSaveProfile = () => {
    toast({
      title: 'Profile Updated',
      description: 'Your profile has been saved successfully.',
    })
    setIsEditing(false)
  }

  const handleChangePassword = () => {
    if (passwordData.new !== passwordData.confirm) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      })
      return
    }
    
    toast({
      title: 'Password Changed',
      description: 'Your password has been updated successfully.',
    })
    setIsPasswordDialogOpen(false)
    setPasswordData({ current: '', new: '', confirm: '' })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
        </div>
        <CardContent className="relative pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}&backgroundColor=6366f1`} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <Badge className={`${getRoleColor(user.role)} flex items-center gap-1`}>
                  {getRoleIcon(user.role)}
                  <span className="capitalize">{user.role}</span>
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Member since Dec 2024
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  Last active: Just now
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                <Edit3 className="h-4 w-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Information</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
        </TabsList>

        {/* Information Tab */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your basic profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-500" />
                  Professional Information
                </CardTitle>
                <CardDescription>Your professional details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted">
                    <Badge className={getRoleColor(user.role)}>
                      <span className="capitalize">{user.role}</span>
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={profileData.department}
                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                {user.role === 'doctor' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        value={profileData.specialization}
                        onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="license">License Number</Label>
                      <Input
                        id="license"
                        value={profileData.licenseNumber}
                        onChange={(e) => setProfileData({ ...profileData, licenseNumber: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          {isEditing && (
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5 text-amber-500" />
                  Password
                </CardTitle>
                <CardDescription>Manage your password settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Last changed: 30 days ago
                </p>
                <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and choose a new one
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={passwordData.current}
                          onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={passwordData.new}
                          onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={passwordData.confirm}
                          onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleChangePassword}>
                        Update Password
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-green-500" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>Add an extra layer of security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Authenticator App</p>
                    <p className="text-sm text-muted-foreground">
                      Use an app to generate codes
                    </p>
                  </div>
                  <Switch
                    checked={preferences.twoFactorAuth}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, twoFactorAuth: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Biometric Login</p>
                    <p className="text-sm text-muted-foreground">
                      Use fingerprint or face recognition
                    </p>
                  </div>
                  <Switch
                    checked={preferences.biometricLogin}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, biometricLogin: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-blue-500" />
                Active Sessions
              </CardTitle>
              <CardDescription>Manage your active login sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">Chrome on Linux • Active now</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    <Check className="h-3 w-3 mr-1" />
                    Current
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-rose-500" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email Notifications
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, emailNotifications: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    Push Notifications
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Get notified in your browser
                  </p>
                </div>
                <Switch
                  checked={preferences.pushNotifications}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, pushNotifications: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    SMS Notifications
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Receive text messages for urgent alerts
                  </p>
                </div>
                <Switch
                  checked={preferences.smsNotifications}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, smsNotifications: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-5 w-5 text-indigo-500" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how MedSync looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium flex items-center gap-2">
                    {preferences.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    Dark Mode
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <Switch
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, darkMode: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full text-red-600 border-red-300 hover:bg-red-50" onClick={logout}>
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
