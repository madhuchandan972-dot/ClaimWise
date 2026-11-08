// Reusable loading and skeleton components for ClaimWise

import Image from 'next/image';

/** Animated rotating circle spinner in blue */
export function Spinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
      aria-label="Loading"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="#e5e7eb"
        strokeWidth="3"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="#2563eb"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Full-screen centered spinner with branding text */
export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white gap-5">
      <div className="flex items-center gap-2.5 mb-2">
        <Image
          src="/claimwise-logo.png"
          alt="ClaimWise logo"
          width={788}
          height={695}
          className="h-10 w-auto"
        />
        <span className="text-xl font-bold text-blue-900">ClaimWise</span>
      </div>
      <Spinner size={40} />
      <p className="text-sm text-gray-500 font-medium animate-pulse">Loading ClaimWise...</p>
    </div>
  );
}

/** Gray animated skeleton block for card loading states */
export function SkeletonCard({
  lines = 3,
  hasHeader = true,
  className = '',
}: {
  lines?: number;
  hasHeader?: boolean;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-white border border-gray-100 shadow-sm p-6 ${className}`}>
      {hasHeader && (
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-gray-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/5 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-3 w-1/3 rounded-lg bg-gray-100 animate-pulse" />
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded-lg bg-gray-100 animate-pulse"
            style={{ width: `${100 - i * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Tiny inline spinner for button loading states */
export function ButtonSpinner({ className = '' }: { className?: string }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Skeleton row for list/table loading */
export function SkeletonRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 py-3 ${className}`}>
      <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-3/5 rounded-lg bg-gray-200 animate-pulse" />
        <div className="h-2.5 w-2/5 rounded-lg bg-gray-100 animate-pulse" />
      </div>
      <div className="h-6 w-16 rounded-lg bg-gray-100 animate-pulse" />
    </div>
  );
}
