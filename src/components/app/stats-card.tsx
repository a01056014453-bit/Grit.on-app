import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: LucideIcon;
  value: number | string;
  unit: string;
  label: string;
  className?: string;
}

export function StatsCard({
  icon: Icon,
  value,
  unit,
  label,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden bg-white rounded-2xl p-4 shadow-sm border border-slate-100 transition-all duration-300 hover:shadow-soft hover:-translate-y-0.5",
        className
      )}
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-12 h-12 text-primary rotate-12" />
      </div>
      
      <div className="relative z-10">
        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
          <span className="text-xs font-medium text-slate-500">{unit}</span>
        </div>
        <div className="text-xs text-slate-400 mt-1 font-medium">{label}</div>
      </div>
    </div>
  );
}
