interface ProgressRingProps {
  value: number
  target: number
  color: string
  size?: number
  strokeWidth?: number
  label: string
}

export function ProgressRing({
  value,
  target,
  color,
  size = 132,
  strokeWidth = 10,
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = Math.min(1, value / target)
  const percent = Math.round((value / target) * 100)

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${value} of ${target} sessions, ${percent}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span
          key={value}
          className="font-mono text-3xl font-bold tabular-nums leading-none motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-300"
        >
          {value}
        </span>
        <span className="mt-1 font-mono text-xs text-muted-foreground">/ {target}</span>
        <span className="mt-0.5 text-xs font-medium" style={{ color }}>
          {percent}%
        </span>
      </div>
    </div>
  )
}
