// Progress bar and circular progress components for ClaimWise

type ProgressColor = 'blue' | 'green' | 'yellow' | 'red';
type ProgressSize = 'sm' | 'md' | 'lg';

interface ProgressBarProps {
  value: number; // 0-100
  color?: ProgressColor;
  size?: ProgressSize;
  showLabel?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
}

interface CircularProgressProps {
  value: number; // 0-100
  color?: ProgressColor;
  size?: ProgressSize;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const colorFill: Record<ProgressColor, string> = {
  blue: 'bg-blue-600',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
};

const colorStroke: Record<ProgressColor, string> = {
  blue: '#2563eb',
  green: '#22c55e',
  yellow: '#facc15',
  red: '#ef4444',
};

const trackHeight: Record<ProgressSize, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const circularDims: Record<ProgressSize, { size: number; stroke: number; fontSize: string }> = {
  sm: { size: 60, stroke: 5, fontSize: 'text-xs' },
  md: { size: 80, stroke: 7, fontSize: 'text-sm' },
  lg: { size: 112, stroke: 9, fontSize: 'text-base' },
};

/** Clamp value to 0-100 */
const clamp = (v: number) => Math.min(100, Math.max(0, v));

/** Linear progress bar */
export function ProgressBar({
  value,
  color = 'blue',
  size = 'md',
  showLabel = false,
  label,
  className = '',
  animated = true,
}: ProgressBarProps) {
  const pct = clamp(value);

  return (
    <div className={`w-full ${className}`}>
      {/* Label row */}
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs font-medium text-gray-600">{label}</span>}
          {showLabel && (
            <span className="text-xs font-semibold text-gray-700 ml-auto">{pct}%</span>
          )}
        </div>
      )}

      {/* Track */}
      <div className={`w-full rounded-full bg-gray-100 overflow-hidden ${trackHeight[size]}`}>
        {/* Fill */}
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          className={`h-full rounded-full ${colorFill[color]} ${animated ? 'transition-all duration-700 ease-out' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Circular / donut progress indicator */
export function CircularProgress({
  value,
  color = 'blue',
  size = 'md',
  showLabel = true,
  label,
  className = '',
}: CircularProgressProps) {
  const pct = clamp(value);
  const { size: dim, stroke, fontSize } = circularDims[size];
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={stroke}
          />
          {/* Progress arc */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke={colorStroke[color]}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center label */}
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-bold text-gray-800 ${fontSize}`}>{pct}%</span>
          </div>
        )}
      </div>

      {label && (
        <span className="text-xs font-medium text-gray-500 text-center">{label}</span>
      )}
    </div>
  );
}

/** Default export is the linear bar */
export default ProgressBar;
