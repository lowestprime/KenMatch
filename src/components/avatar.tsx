export function Avatar({ name, hue, size = 40, className }: { name: string; hue: number; size?: number; className?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      role="img"
      aria-label={name}
    >
      <defs>
        <linearGradient id={`avatar-grad-${hue}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`hsl(${hue}, 72%, 58%)`} />
          <stop offset="100%" stopColor={`hsl(${(hue + 40) % 360}, 68%, 44%)`} />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill={`url(#avatar-grad-${hue})`} />
      <text
        x="50%"
        y="50%"
        dy=".1em"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="15"
        fontWeight="700"
        fontFamily="var(--font-display), system-ui, sans-serif"
      >
        {initials}
      </text>
    </svg>
  );
}
