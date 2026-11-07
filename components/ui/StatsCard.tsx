import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

type StatsColor = 'blue' | 'green' | 'purple' | 'orange';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: ReactNode;
  color?: StatsColor;
  /** Optional override for trend direction - inferred from change string if not provided */
  trendUp?: boolean;
  className?: string;
}

const colorStyles: Record<
  StatsColor,
  { iconBg: string; iconText: string; valueTxt: string }
> = {
  blue: {
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    valueTxt: 'text-blue-900',
  },
  green: {
    iconBg: 'bg-green-50',
    iconText: 'text-green-600',
    valueTxt: 'text-green-900',
  },
  purple: {
    iconBg: 'bg-purple-50',
    iconText: 'text-purple-600',
    valueTxt: 'text-purple-900',
  },
  orange: {
    iconBg: 'bg-orange-50',
    iconText: 'text-orange-600',
    valueTxt: 'text-orange-900',
  },
};

export default function StatsCard({
  title,
  value,
  change,
  icon,
  color = 'blue',
  trendUp,
  className = '',
}: StatsCardProps) {
  const { iconBg, iconText, valueTxt } = colorStyles[color];

  // Infer trend direction from change string if trendUp is not provided
  const isPositive =
    trendUp !== undefined
      ? trendUp
      : change
      ? change.trim().startsWith('+') || change.trim().startsWith('↑')
      : undefined;

  return (
    <div
      className={`rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Icon */}
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0 ${iconBg} ${iconText}`}
        >
          {icon}
        </div>

        {/* Trend badge */}
        {change && isPositive !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 ${
              isPositive
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {isPositive ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            <span>{change}</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mt-4">
        <p className={`text-3xl font-bold tracking-tight ${valueTxt}`}>{value}</p>
        <p className="mt-1 text-sm font-medium text-gray-500">{title}</p>
      </div>

      {/* Subtle bottom accent bar */}
      <div
        className={`mt-5 h-1 rounded-full opacity-20 ${
          color === 'blue'
            ? 'bg-blue-600'
            : color === 'green'
            ? 'bg-green-500'
            : color === 'purple'
            ? 'bg-purple-500'
            : 'bg-orange-500'
        }`}
      />
    </div>
  );
}
