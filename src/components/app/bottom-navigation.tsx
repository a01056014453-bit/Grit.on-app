"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Play, User, Zap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    icon: Home,
    label: "홈",
    exact: true,
  },
  {
    href: "/practice",
    icon: Play,
    label: "연습",
  },
  {
    href: "/analysis",
    icon: Zap,
    label: "AI분석",
  },
  {
    href: "/ranking",
    icon: Trophy,
    label: "랭킹",
  },
  {
    href: "/profile",
    icon: User,
    label: "프로필",
  },
];

export function BottomNavigation() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-bottom">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full transition-colors",
                  active ? "text-black" : "text-gray-400"
                )}
              >
                <item.icon
                  className="w-6 h-6"
                  strokeWidth={active ? 2 : 1.5}
                />
                <span className="text-[10px] font-medium mt-1">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
