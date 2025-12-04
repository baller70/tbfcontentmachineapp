
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Calendar,
  PlusCircle,
  Settings,
  Palette,
  Home
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Templates', href: '/dashboard/templates', icon: FileText },
  { name: 'Posts', href: '/dashboard/posts', icon: Calendar },
  { name: 'Create Post', href: '/dashboard/posts/create', icon: PlusCircle },
  { name: 'Workspace', href: '/dashboard/workspace', icon: Palette },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings }
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = item.icon

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
              ${isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }
            `}
          >
            <Icon className="w-5 h-5 mr-3" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
