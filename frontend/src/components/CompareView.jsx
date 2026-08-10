import { useEffect, useState } from 'react';
import { compareUsers, getCompareVerdict, extractErrorMessage } from '../api';
import ProgressLoader from './ProgressLoader';

const COMPARE_STEPS = [
  'Connecting to GitHub…',
  'Extracting data for both profiles…',
  'Crunching commit history…',
  'Scoring both scorecards…',
  'Deciding a winner…',
  'Wrapping things up…'
];

// Rows shown in the comparison table, in display order.
// `get` pulls the display value; `winner` (optional) pulls a comparable
// numeric value used to highlight whichever side is ahead on that row.
const ROWS = [
  { label: 'Overall Score', get: (d) => `${d.scorecard?.overall ?? 'n/a'}/100`, winner: (d) => d.scorecard?.overall ?? 0 },
  { label: 'Archetype', get: (d) => `${d.scorecard?.archetype?.icon || ''} ${d.scorecard?.archetype?.name || 'n/a'}` },
  { label: 'Contributions', hint: 'Sampled recent pushes (last ~90 days of public activity)', get: (d) => d.commitTimes.totalSampledPushes, winner: (d) => d.commitTimes.totalSampledPushes },
  { label: 'Repositories', get: (d) => d.stats.totalRepos, winner: (d) => d.stats.totalRepos },
  { label: 'Languages', get: (d) => d.languages.length, winner: (d) => d.languages.length },
  { label: 'Stars', get: (d) => d.stats.totalStars, winner: (d) => d.stats.totalStars },
  { label: 'Followers', get: (d) => d.profile.followers, winner: (d) => d.profile.followers },
  { label: '🧠 Code Quality', get: (d) => scoreOf(d, 'codeQuality'), winner: (d) => scoreOf(d, 'codeQuality') },
  { label: '🔥 Consistency', get: (d) => scoreOf(d, 'consistency'), winner: (d) => scoreOf(d, 'consistency') },
  { label: '📚 Learning', get: (d) => scoreOf(d, 'learning'), winner: (d) => scoreOf(d, 'learning') },
  { label: '🤝 Collaboration', get: (d) => scoreOf(d, 'collaboration'), winner: (d) => scoreOf(d, 'collaboration') },
  { label: '🚀 Activity', get: (d) => scoreOf(d, 'activity'), winner: (d) => scoreOf(d, 'activity') },
  { label: '🛠️ Complexity', get: (d) => scoreOf(d, 'complexity'), winner: (d) => scoreOf(d, 'complexity') }
];

// Timing for the staggered reveal animation (ms).
const ROW_STAGGER_MS = 130;
const AVATAR_DELAY_MS = 250;
const STAMP_DELAY_MS = 550;

function scoreOf(data, key) {
  return data.scorecard?.categories?.find((c) => c.key === key)?.score ?? 0;
}

export default function CompareView() {
  const [userA, setUserA] = useState('');
  const [userB, setUserB] = useState('');
  const [result, setResult] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reveal-animation state: how many rows are mounted, and whether the
  // avatar row / winner-loser stamps have appeared yet.
  const [visibleRows, setVisibleRows] = useState(0);
  const [showAvatars, setShowAvatars] = useState(false);
  const [showStamps, setShowStamps] = useState(false);

  useEffect(() => {
    if (!result) {
      setVisibleRows(0);
      setShowAvatars(false);
      setShowStamps(false);
      return;
    }
    setVisibleRows(0);
    setShowAvatars(false);
    setShowStamps(false);

    const timers = [];
    ROWS.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleRows((c) => Math.max(c, i + 1)), i * ROW_STAGGER_MS));
    });
    const rowsDone = ROWS.length * ROW_STAGGER_MS;
    timers.push(setTimeout(() => setShowAvatars(true), rowsDone + AVATAR_DELAY_MS));
    timers.push(setTimeout(() => setShowStamps(true), rowsDone + AVATAR_DELAY_MS + STAMP_DELAY_MS));

    return () => timers.forEach(clearTimeout);
  }, [result]);

  async function handleCompare(e) {
    e.preventDefault();
    if (!userA || !userB) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setVerdict(null);
    try {
      const data = await compareUsers(userA.trim(), userB.trim());
      setResult(data);
      getCompareVerdict(userA.trim(), userB.trim())
        .then(setVerdict)
        .catch(() => setVerdict(null));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const overallA = result?.a?.scorecard?.overall ?? 0;
  const overallB = result?.b?.scorecard?.overall ?? 0;
  const isTie = result ? overallA === overallB : false;
  const aIsWinner = result ? overallA > overallB : false;
  const bIsWinner = result ? overallB > overallA : false;

  return (
    <div className="card">
      <h3 className="font-semibold mb-3">⚔️ Compare Developers</h3>
      <form onSubmit={handleCompare} className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={userA}
          onChange={(e) => setUserA(e.target.value)}
          placeholder="username-a"
          className="bg-base border border-border rounded-lg px-3 py-2 text-sm flex-1"
        />
        <span className="self-center text-gray-500 text-sm">vs</span>
        <input
          value={userB}
          onChange={(e) => setUserB(e.target.value)}
          placeholder="username-b"
          className="bg-base border border-border rounded-lg px-3 py-2 text-sm flex-1"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-accent text-black font-medium rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? 'Comparing…' : 'Compare'}
        </button>
      </form>

      <ProgressLoader active={loading} label="Comparing profiles" steps={COMPARE_STEPS} />

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {result && (
        <div>
          {/* Avatar row: appears once the table has finished filling in.
              Positioned above the table so the winner/loser stamps can pop
              out over the top edge without ever covering the table rows. */}
          <div className="relative" style={{ overflow: 'visible' }}>
            {showAvatars && (
              <div className="flex items-start justify-around px-2 pb-2 relative" style={{ overflow: 'visible' }}>
                <div className="relative flex flex-col items-center gap-1 avatar-pop">
                  <img
                    src={result.a.profile.avatarUrl}
                    alt={result.a.profile.login}
                    className="w-14 h-14 rounded-full border-2 border-border object-cover"
                  />
                  <span className="text-xs text-gray-400">@{result.a.profile.login}</span>
                  {showStamps && !isTie && (
                    <span className={`stamp stamp-left ${aIsWinner ? 'stamp-winner' : 'stamp-loser'}`}>
                      {aIsWinner ? 'WINNER' : 'LOSER'}
                    </span>
                  )}
                </div>
                <div className="relative flex flex-col items-center gap-1 avatar-pop" style={{ animationDelay: '120ms' }}>
                  <img
                    src={result.b.profile.avatarUrl}
                    alt={result.b.profile.login}
                    className="w-14 h-14 rounded-full border-2 border-border object-cover"
                  />
                  <span className="text-xs text-gray-400">@{result.b.profile.login}</span>
                  {showStamps && !isTie && (
                    <span className={`stamp stamp-right ${bIsWinner ? 'stamp-winner' : 'stamp-loser'}`}>
                      {bIsWinner ? 'WINNER' : 'LOSER'}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="overflow-x-auto" style={{ overflowY: 'visible' }}>
              <table className="w-full text-sm border-collapse min-w-[420px]">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-border">
                    <th className="py-2 pr-3 font-medium">Category</th>
                    <th className="py-2 px-3 font-medium">@{result.a.profile.login}</th>
                    <th className="py-2 pl-3 font-medium">@{result.b.profile.login}</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.slice(0, visibleRows).map((row) => {
                    const valA = row.get(result.a);
                    const valB = row.get(result.b);
                    const numA = row.winner ? row.winner(result.a) : null;
                    const numB = row.winner ? row.winner(result.b) : null;
                    const aWins = row.winner && numA > numB;
                    const bWins = row.winner && numB > numA;
                    return (
                      <tr key={row.label} className="border-b border-border/60" title={row.hint}>
                        <td className="py-2 pr-3 text-gray-400 label-in">{row.label}</td>
                        <td className={`py-2 px-3 cell-in-left ${aWins ? 'text-accent2 font-semibold' : 'text-gray-200'}`}>{valA}</td>
                        <td className={`py-2 pl-3 cell-in-right ${bWins ? 'text-accent2 font-semibold' : 'text-gray-200'}`}>{valB}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {verdict && (
            <p className="text-gray-300 text-sm mt-4 italic border-t border-border pt-4">
              🤖 {verdict}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
