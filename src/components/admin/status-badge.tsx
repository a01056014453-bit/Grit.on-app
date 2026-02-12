import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-gray-50 text-gray-600 border-gray-200',
  purple: 'bg-violet-50 text-violet-700 border-violet-200',
};

export function StatusBadge({ label, variant = 'neutral', className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
      variantStyles[variant],
      className,
    )}>
      {label}
    </span>
  );
}

// 상태별 자동 매핑 헬퍼
export function getStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    active: 'success',
    approved: 'success',
    completed: 'success',
    resolved: 'success',
    clean: 'success',
    open: 'info',
    pending: 'warning',
    review: 'warning',
    reviewing: 'warning',
    in_progress: 'info',
    scheduled: 'info',
    flagged: 'error',
    rejected: 'error',
    failed: 'error',
    removed: 'error',
    critical: 'error',
    closed: 'neutral',
    expired: 'neutral',
    paused: 'neutral',
    warning: 'warning',
    info: 'info',
    urgent: 'error',
    high: 'warning',
    medium: 'info',
    low: 'neutral',
  };
  return map[status] ?? 'neutral';
}
