function colorFor(count) {
  if (!count) return '#161b22';
  if (count < 2) return '#0e4429';
  if (count < 4) return '#006d32';
  if (count < 7) return '#26a641';
  return '#39d353';
}

export default function CommitHeatmap({ heatmap }) {
  const { days, longestStreak, note } = heatmap;
  const dayMap = new Map(days.map((d) => [d.date, d.count]));

  // Build a 90-day grid ending today
  const cells = [];
  const today = new Date();
  for (let i = 89; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, count: dayMap.get(key) || 0 });
  }

  // Group into weeks (columns of 7)
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="card">
      <h3 className="font-semibold mb-1">🔥 Commit Heatmap (last ~90 days)</h3>
      <p className="text-gray-500 text-xs mb-3">{note}</p>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date}: ${cell.count} commit${cell.count === 1 ? '' : 's'}`}
                className="heatmap-cell"
                style={{ backgroundColor: colorFor(cell.count) }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="text-sm text-gray-400 mt-2">Longest streak: {longestStreak} day{longestStreak === 1 ? '' : 's'}</div>
    </div>
  );
}
