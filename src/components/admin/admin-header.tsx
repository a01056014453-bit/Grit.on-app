'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';

const pageNames: Record<string, string> = {
  '/admin': '대시보드',
  '/admin/experts': '전문가 검증',
  '/admin/users': '사용자 관리',
  '/admin/music-db': '곡 DB / AI',
  '/admin/ranking-economy': '랭킹 / 경제',
  '/admin/copyright': '저작권',
  '/admin/support': 'CS 지원',
  '/admin/security': '보안',
  '/admin/marketing': '마케팅',
};

export function AdminHeader() {
  const pathname = usePathname();
  const basePath = Object.keys(pageNames).find((p) => pathname === p || (p !== '/admin' && pathname.startsWith(p)));
  const pageName = basePath ? pageNames[basePath] : '관리자';

  const breadcrumbs = ['관리자'];
  if (basePath && basePath !== '/admin') {
    breadcrumbs.push(pageNames[basePath]);
  }
  if (pathname.includes('/users/') && pathname !== '/admin/users') {
    breadcrumbs.push('사용자 상세');
  }

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2">
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-300">/</span>}
              <span className={i === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="검색..."
            className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent w-56"
          />
        </div>
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-4.5 h-4.5 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
          A
        </div>
      </div>
    </header>
  );
}
