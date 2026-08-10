function scoreColor(score) {
  if (score >= 80) return 'text-accent2';
  if (score >= 60) return 'text-accent';
  if (score >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

function barColor(score) {
  if (score >= 80) return 'bg-accent2';
  if (score >= 60) return 'bg-accent';
  if (score >= 40) return 'bg-yellow-400';
  return 'bg-red-400';
}

export default function ScoreCard({ scorecard }) {
  if (!scorecard) return null;
  const { overall, categories, explanation, archetype } = scorecard;

  const circumference = 2 * Math.PI * 46;
  const dashOffset = circumference - (overall / 100) * circumference;

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex flex-col items-center justify-center shrink-0">
          <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90">
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgb(var(--color-border))" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="rgb(var(--color-accent))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
          </svg>
          <div className="-mt-[76px] mb-[44px] text-center">
            <div className="text-2xl font-bold">{overall}</div>
            <div className="text-[10px] text-gray-500">/ 100</div>
          </div>
          <div className="text-center mt-1">
            <div className="text-xs text-gray-500">Developer Profile Score</div>
            {archetype && (
              <div className="text-sm font-medium mt-1">
                {archetype.icon} {archetype.name}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          {categories.map((c) => (
            <div key={c.key} title={`${c.label}: ${c.score}/100`}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-300">
                  {c.icon} {c.label}
                </span>
                <span className={`font-semibold ${scoreColor(c.score)}`}>{c.score}</span>
              </div>
              <div className="h-1.5 rounded-full bg-base overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor(c.score)}`}
                  style={{ width: `${c.score}%`, transition: 'width 0.8s ease-out' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {explanation && <p className="text-gray-400 text-sm mt-5 border-t border-border pt-4">{explanation}</p>}
    </div>
  );
}
