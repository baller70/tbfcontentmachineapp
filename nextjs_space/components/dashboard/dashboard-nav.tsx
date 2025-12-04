
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import {
  Calendar,
  Image as ImageIcon,
  Settings,
  Wand2,
  BarChart3,
  FolderOpen,
  Grid3x3,
  LogOut,
  Sparkles,
  Home,
  MessageSquare,
  Menu,
  X,
  Send,
  FileText
} from 'lucide-react'
import { CompanySwitcher } from '@/components/company-switcher'

const navItems = [
  {
    title: 'Content Journey',
    href: '/dashboard',
    icon: Sparkles,
  },
  {
    title: 'Schedule',
    href: '/dashboard/schedule',
    icon: Calendar,
  },
  {
    title: 'Post',
    href: '/dashboard/post',
    icon: Send,
  },
  {
    title: 'Bulk Schedule CSV',
    href: '/dashboard/bulk-csv',
    icon: FileText,
  },
  {
    title: 'Prompts',
    href: '/dashboard/prompts',
    icon: MessageSquare,
  },
  {
    title: 'Templates',
    href: '/dashboard/templates',
    icon: Grid3x3,
  },
  {
    title: 'Workspace',
    href: '/dashboard/workspace',
    icon: ImageIcon,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-50 flex items-center px-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-700" />
          ) : (
            <Menu className="h-6 w-6 text-gray-700" />
          )}
        </button>
        <Link href="/dashboard" className="ml-3 text-base font-bold text-brand-primary truncate">
          Late Content Poster
        </Link>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 top-14"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop and Mobile */}
      <aside 
        className={cn(
          'bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300',
          'w-64 lg:translate-x-0',
          // Mobile: starts off-screen, slides in when menu opens
          'lg:top-0',
          isMobileMenuOpen ? 'translate-x-0 top-14' : '-translate-x-full top-14'
        )}
      >
        {/* Logo - Desktop Only */}
        <div className="hidden lg:flex h-16 items-center px-6 border-b border-gray-200">
          <Link href="/dashboard" className="text-lg font-bold text-brand-primary">
            Late Content Poster
          </Link>
        </div>

        {/* Company Switcher */}
        <div className="px-4 pt-4 pb-2 border-b border-gray-200">
          <CompanySwitcher />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(`${item.href}/`))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'text-brand-primary font-semibold'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
                style={isActive ? { 
                  backgroundColor: `rgba(var(--color-primary-rgb), 0.1)` 
                } : undefined}
              >
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>
        
        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
