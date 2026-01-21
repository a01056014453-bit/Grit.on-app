"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Play, HelpCircle, GraduationCap, User } from "lucide-react";
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
    href: "/help",
    icon: HelpCircle,
    label: "해결요청",
  },
  {
    href: "/rooms",
    icon: GraduationCap,
    label: "입시룸",
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
    <nav className="fixed bottom-6 left-4 right-4 z-50">
      <div className="glass rounded-2xl shadow-soft max-w-lg mx-auto">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-300",
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon
                  className={cn("w-6 h-6 transition-transform duration-300", active && "scale-110")}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className={cn(
                  "text-[10px] font-medium mt-0.5 transition-all duration-300",
                  active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 absolute bottom-2"
                )}>
                  {item.label}
                </span>
                
                {active && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}