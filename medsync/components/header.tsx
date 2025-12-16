'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  Menu,
  Activity,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAuth } from '@/providers/auth-provider'
import { useRFID } from '@/providers/rfid-provider'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { EnhancedSidebar } from './sidebar'

export function Header() {
  const { user, logout } = useAuth()
  const { isConnected, lastScannedData: lastScannedCard } = useRFID()
  const pathname = usePathname()
  const [isDark, setIsDark] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500'
      case 'doctor': return 'bg-blue-500'
      case 'pharmacy': return 'bg-green-500'
      case 'patient': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard': return 'Dashboard'
      case '/patients': return 'Patient Management'
      case '/prescriptions': return 'Prescriptions'
      case '/rfid': return 'RFID Management'
      case '/profile': return 'My Profile'
      case '/settings': return 'Settings'
      default: return 'MedSync'
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <EnhancedSidebar />
          </SheetContent>
        </Sheet>

        {/* Logo for mobile */}
        <Link href="/dashboard" className="md:hidden flex items-center gap-2 mr-4">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold">MedSync</span>
        </Link>

        {/* Page Title */}
        <div className="hidden md:flex items-center gap-2">
          <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
          {isConnected && (
            <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse mr-1.5" />
              Live
            </Badge>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search Bar */}
        <div className="hidden lg:flex items-center mr-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search patients, cards..."
              className="w-64 pl-9 h-9 bg-muted/50 border-none focus-visible:ring-1"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Search */}
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Search className="h-5 w-5" />
          </Button>

          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsDark(!isDark)}
            className="hidden sm:flex"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {lastScannedCard && (
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 border-2 border-background" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <Badge variant="secondary" className="text-xs">
                  {lastScannedCard ? '1 new' : '0 new'}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {lastScannedCard ? (
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">RFID Card Scanned</p>
                      <p className="text-xs text-muted-foreground">
                        Card {lastScannedCard.label || lastScannedCard.cardUid?.substring(0, 8)} was detected
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {lastScannedCard.time || 'Just now'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No new notifications</p>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}&backgroundColor=6366f1`} />
                    <AvatarFallback className={cn("text-white text-xs", getRoleColor(user.role))}>
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={logout}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/login" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Get Started
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
