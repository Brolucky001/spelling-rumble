interface ScoreCircleProps {
  value: number;
}

export function ScoreCircle({ value }: ScoreCircleProps) {
  const radius = 82;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="grid place-items-center">
      <svg width="220" height="220" viewBox="0 0 220 220" role="img" aria-label={`Score ${value}%`}>
        <circle cx="110" cy="110" r={radius} fill="none" stroke="#dbeafe" strokeWidth="18" />
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="#fbbf24"
          strokeLinecap="round"
          strokeWidth="18"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 110 110)"
        />
        <text x="110" y="104" textAnchor="middle" className="fill-slate-950 text-5xl font-black dark:fill-white">
          {value}%
        </text>
        <text x="110" y="136" textAnchor="middle" className="fill-slate-500 text-sm font-bold uppercase dark:fill-slate-300">
          Accuracy
        </text>
      </svg>
    </div>
  );
}
