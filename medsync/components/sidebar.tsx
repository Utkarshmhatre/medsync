'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/providers/auth-provider'
import { useRFID } from '@/providers/rfid-provider'
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  User,
  Settings,
  LogOut,
  Activity,
  Radio,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  badge?: string
  roles?: string[]
}

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    title: 'Patients',
    href: '/patients',
    icon: <Users className="h-4 w-4" />,
    roles: ['admin', 'doctor', 'pharmacy'],
  },
  {
    title: 'Prescriptions',
    href: '/prescriptions',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    title: 'RFID Cards',
    href: '/rfid',
    icon: <CreditCard className="h-4 w-4" />,
  },
]

const accountNavItems: NavItem[] = [
  {
    title: 'Profile',
    href: '/profile',
    icon: <User className="h-4 w-4" />,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: <Settings className="h-4 w-4" />,
  },
]

export function EnhancedSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { isConnected, isSerialConnected, cards } = useRFID()

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

  const filteredNavItems = mainNavItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(user?.role || '')
  })

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
      {/* Logo Section */}
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MedSync
            </h1>
            <p className="text-xs text-muted-foreground">Smart Health Cards</p>
          </div>
        </Link>
      </div>

      {/* Connection Status */}
      <div className="px-4 mb-4">
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">System Status</span>
            <div className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
            )} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Radio className="h-3 w-3" />
                Server
              </span>
              <Badge variant={isConnected ? "default" : "secondary"} className="h-5 text-[10px]">
                {isConnected ? 'Connected' : 'Offline'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <CreditCard className="h-3 w-3" />
                RFID Reader
              </span>
              <Badge variant={isSerialConnected ? "default" : "secondary"} className="h-5 text-[10px]">
                {isSerialConnected ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Separator className="mx-4" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-6">
          {/* Main Navigation */}
          <div>
            <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Main Menu
            </h3>
            <nav className="space-y-1">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={cn(
                      "group flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-1.5 rounded-md transition-colors",
                          isActive ? "bg-primary-foreground/20" : "bg-muted group-hover:bg-background"
                        )}>
                          {item.icon}
                        </div>
                        <span className="font-medium text-sm">{item.title}</span>
                      </div>
                      {item.badge && (
                        <Badge variant="secondary" className="h-5 text-[10px]">
                          {item.badge}
                        </Badge>
                      )}
                      <ChevronRight className={cn(
                        "h-4 w-4 opacity-0 -translate-x-2 transition-all",
                        isActive && "opacity-100 translate-x-0",
                        "group-hover:opacity-100 group-hover:translate-x-0"
                      )} />
                    </div>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Account Navigation */}
          <div>
            <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Account
            </h3>
            <nav className="space-y-1">
              {accountNavItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={cn(
                      "group flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-1.5 rounded-md transition-colors",
                          isActive ? "bg-primary-foreground/20" : "bg-muted group-hover:bg-background"
                        )}>
                          {item.icon}
                        </div>
                        <span className="font-medium text-sm">{item.title}</span>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 opacity-0 -translate-x-2 transition-all",
                        isActive && "opacity-100 translate-x-0",
                        "group-hover:opacity-100 group-hover:translate-x-0"
                      )} />
                    </div>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Quick Stats */}
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 rounded-md bg-background/50">
                <p className="text-lg font-bold text-blue-600">{cards.length}</p>
                <p className="text-[10px] text-muted-foreground">RFID Cards</p>
              </div>
              <div className="text-center p-2 rounded-md bg-background/50">
                <p className="text-lg font-bold text-green-600">{isConnected ? '1' : '0'}</p>
                <p className="text-[10px] text-muted-foreground">Active</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      <Separator className="mx-4" />

      {/* User Section */}
      {user && (
        <div className="p-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}&backgroundColor=6366f1`} />
              <AvatarFallback className={cn("text-white text-xs", getRoleColor(user.role))}>
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-red-500"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Keep the old exports for backwards compatibility
export function Sidebar({ className, items, ...props }: { className?: string; items: { href: string; title: string }[] }) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1", className)} {...props}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "justify-start",
            pathname === item.href ? "bg-muted hover:bg-muted" : "hover:bg-transparent hover:underline",
            "block w-full"
          )}
        >
          <Button variant="ghost" className="w-full justify-start">
            {item.title}
          </Button>
        </Link>
      ))}
    </nav>
  )
}

export function SidebarNav() {
  return <EnhancedSidebar />
}
