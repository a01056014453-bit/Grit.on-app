'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Music,
  Trophy,
  Shield,
  Headphones,
  Lock,
  Megaphone,
} from 'lucide-react';

const navItems = [
  { label: '대시보드', href: '/admin', icon: LayoutDashboard },
  { label: '전문가 검증', href: '/admin/experts', icon: GraduationCap },
  { label: '사용자 관리', href: '/admin/users', icon: Users },
  { label: '곡 DB / AI', href: '/admin/music-db', icon: Music },
  { label: '랭킹 / 경제', href: '/admin/ranking-economy', icon: Trophy },
  { label: '저작권', href: '/admin/copyright', icon: Shield },
  { label: 'CS 지원', href: '/admin/support', icon: Headphones },
  { label: '보안', href: '/admin/security', icon: Lock },
  { label: '마케팅', href: '/admin/marketing', icon: Megaphone },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 h-screen sticky top-0">
      <div className="h-14 flex items-center px-5 border-b border-gray-200">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <span className="font-bold text-gray-900">Sempre</span>
          <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-medium">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <item.icon className={cn('w-4.5 h-4.5', isActive ? 'text-violet-600' : 'text-gray-400')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">관리자</p>
            <p className="text-xs text-gray-500 truncate">admin@sempre.app</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
