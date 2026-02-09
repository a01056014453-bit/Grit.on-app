import { cn } from "@/lib/utils";

interface StatsCardProps {
  value: number | string;
  unit: string;
  label: string;
  className?: string;
}

export function StatsCard({
  value,
  unit,
  label,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "text-center py-4",
        className
      )}
    >
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-2xl font-bold bg-gradient-to-r from-black to-violet-500 bg-clip-text text-transparent">
          {value}
        </span>
        <span className="text-sm text-gray-400">{unit}</span>
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
