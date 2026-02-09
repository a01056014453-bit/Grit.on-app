import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  showLabel?: boolean;
}

export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 6,
  className,
  showValue = true,
  showLabel = false,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const gradientId = `progress-gradient-${size}`;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e5e5"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showLabel && (
            <span className="text-xs text-gray-500 mb-0.5">달성률</span>
          )}
          <span className="text-lg font-bold bg-gradient-to-r from-black to-violet-500 bg-clip-text text-transparent">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
}
