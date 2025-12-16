'use client'

import { useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  Settings,
  Shield,
  Wifi,
  Database,
  Bell,
  Globe,
  Palette,
  Zap,
  Server,
  RefreshCw,
  Save,
  HardDrive,
  Radio,
  Clock,
} from 'lucide-react'

export default function SettingsPage() {
  const { user, isLoading } = useAuth()
  const { toast } = useToast()
  
  const [settings, setSettings] = useState({
    // Connection Settings
    wsUrl: 'ws://localhost:8000',
    apiUrl: 'http://localhost:8001',
    autoReconnect: true,
    reconnectInterval: 5000,
    
    // RFID Settings
    autoStartReading: false,
    scanDebounceMs: 500,
    playSound: true,
    
    // UI Settings
    theme: 'system',
    language: 'en',
    compactMode: false,
    animations: true,
    
    // Data Settings
    cacheEnabled: true,
    offlineMode: true,
    syncInterval: 30,
    
    // Notification Settings
    desktopNotifications: true,
    soundEnabled: true,
    vibration: false,
  })

  const handleSave = () => {
    localStorage.setItem('medsync_settings', JSON.stringify(settings))
    toast({
      title: 'Settings Saved',
      description: 'Your settings have been saved successfully.',
    })
  }

  const handleReset = () => {
    const defaultSettings = {
      wsUrl: 'ws://localhost:8000',
      apiUrl: 'http://localhost:8001',
      autoReconnect: true,
      reconnectInterval: 5000,
      autoStartReading: false,
      scanDebounceMs: 500,
      playSound: true,
      theme: 'system',
      language: 'en',
      compactMode: false,
      animations: true,
      cacheEnabled: true,
      offlineMode: true,
      syncInterval: 30,
      desktopNotifications: true,
      soundEnabled: true,
      vibration: false,
    }
    setSettings(defaultSettings)
    localStorage.setItem('medsync_settings', JSON.stringify(defaultSettings))
    toast({
      title: 'Settings Reset',
      description: 'All settings have been reset to defaults.',
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to access settings.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Configure your MedSync experience
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Connection Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-500" />
              Connection Settings
            </CardTitle>
            <CardDescription>Configure server connections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wsUrl">WebSocket URL</Label>
              <Input
                id="wsUrl"
                value={settings.wsUrl}
                onChange={(e) => setSettings({ ...settings, wsUrl: e.target.value })}
                placeholder="ws://localhost:8000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiUrl">API URL</Label>
              <Input
                id="apiUrl"
                value={settings.apiUrl}
                onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })}
                placeholder="http://localhost:8001"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Reconnect</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically reconnect on disconnect
                </p>
              </div>
              <Switch
                checked={settings.autoReconnect}
                onCheckedChange={(checked) => setSettings({ ...settings, autoReconnect: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reconnectInterval">Reconnect Interval (ms)</Label>
              <Input
                id="reconnectInterval"
                type="number"
                value={settings.reconnectInterval}
                onChange={(e) => setSettings({ ...settings, reconnectInterval: parseInt(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        {/* RFID Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-green-500" />
              RFID Settings
            </CardTitle>
            <CardDescription>Configure RFID reader behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Start Reading</Label>
                <p className="text-sm text-muted-foreground">
                  Start reading when connected
                </p>
              </div>
              <Switch
                checked={settings.autoStartReading}
                onCheckedChange={(checked) => setSettings({ ...settings, autoStartReading: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scanDebounce">Scan Debounce (ms)</Label>
              <Input
                id="scanDebounce"
                type="number"
                value={settings.scanDebounceMs}
                onChange={(e) => setSettings({ ...settings, scanDebounceMs: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                Minimum time between consecutive scans
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Play Sound on Scan</Label>
                <p className="text-sm text-muted-foreground">
                  Audio feedback for scans
                </p>
              </div>
              <Switch
                checked={settings.playSound}
                onCheckedChange={(checked) => setSettings({ ...settings, playSound: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* UI Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-500" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the interface</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={settings.theme}
                onValueChange={(value) => setSettings({ ...settings, theme: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={settings.language}
                onValueChange={(value) => setSettings({ ...settings, language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Reduce spacing and padding
                </p>
              </div>
              <Switch
                checked={settings.compactMode}
                onCheckedChange={(checked) => setSettings({ ...settings, compactMode: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Animations</Label>
                <p className="text-sm text-muted-foreground">
                  Enable UI animations
                </p>
              </div>
              <Switch
                checked={settings.animations}
                onCheckedChange={(checked) => setSettings({ ...settings, animations: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-amber-500" />
              Data & Storage
            </CardTitle>
            <CardDescription>Manage data and caching</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Cache</Label>
                <p className="text-sm text-muted-foreground">
                  Cache data for faster loading
                </p>
              </div>
              <Switch
                checked={settings.cacheEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, cacheEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Offline Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Work offline with local data
                </p>
              </div>
              <Switch
                checked={settings.offlineMode}
                onCheckedChange={(checked) => setSettings({ ...settings, offlineMode: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="syncInterval">Sync Interval (seconds)</Label>
              <Input
                id="syncInterval"
                type="number"
                value={settings.syncInterval}
                onChange={(e) => setSettings({ ...settings, syncInterval: parseInt(e.target.value) })}
              />
            </div>
            <Separator />
            <Button variant="outline" className="w-full">
              <HardDrive className="h-4 w-4 mr-2" />
              Clear Local Data
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-rose-500" />
              Notifications
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label>Desktop Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Browser notifications
                  </p>
                </div>
                <Switch
                  checked={settings.desktopNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, desktopNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label>Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">
                    Audio notifications
                  </p>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, soundEnabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label>Vibration</Label>
                  <p className="text-sm text-muted-foreground">
                    Haptic feedback (mobile)
                  </p>
                </div>
                <Switch
                  checked={settings.vibration}
                  onCheckedChange={(checked) => setSettings({ ...settings, vibration: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
