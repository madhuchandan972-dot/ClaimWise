import { ReactNode } from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'gray' | 'blue';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { badge: string; dot: string }> = {
  success: {
    badge: 'bg-green-50 text-green-700 border border-green-200',
    dot: 'bg-green-500',
  },
  warning: {
    badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    dot: 'bg-yellow-500',
  },
  error: {
    badge: 'bg-red-50 text-red-700 border border-red-200',
    dot: 'bg-red-500',
  },
  info: {
    badge: 'bg-blue-50 text-blue-700 border border-blue-200',
    dot: 'bg-blue-500',
  },
  gray: {
    badge: 'bg-gray-100 text-gray-600 border border-gray-200',
    dot: 'bg-gray-400',
  },
  blue: {
    badge: 'bg-blue-600 text-white border border-blue-700',
    dot: 'bg-white',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
};

export default function Badge({
  children,
  variant = 'gray',
  size = 'sm',
  dot = false,
  className = '',
}: BadgeProps) {
  const { badge, dot: dotColor } = variantStyles[variant];
  const sizeClass = sizeStyles[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full whitespace-nowrap ${badge} ${sizeClass} ${className}`}
    >
      {dot && (
        <span
          className={`flex-shrink-0 rounded-full ${dotColor} ${size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
