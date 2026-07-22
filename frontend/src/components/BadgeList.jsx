export default function BadgeList({ badges, stats }) {
  return (
    <div className="card">
      <h3 className="font-semibold mb-3">🔥 Coding Personality</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {badges.map((b) => (
          <span
            key={b.name}
            title={b.detail}
            className="bg-base border border-border rounded-full px-3 py-1 text-sm flex items-center gap-1"
          >
            <span>{b.icon}</span>
            <span>{b.name}</span>
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <MiniStat label="Documentation Score" value={stats.documentationGrade} />
        <MiniStat label="Open Source Score" value={`${stats.openSourceScore}/100`} />
        <MiniStat
          label="Bug Fix Ratio"
          value={stats.bugFixRatio != null ? `${stats.bugFixRatio}%` : 'n/a'}
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-base border border-border rounded-lg px-3 py-2 text-center">
      <div className="font-semibold">{value}</div>
      <div className="text-gray-500 text-xs">{label}</div>
    </div>
  );
}
