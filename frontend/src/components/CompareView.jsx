import { useState } from 'react';
import { compareUsers, getCompareVerdict, extractErrorMessage } from '../api';

export default function CompareView() {
  const [userA, setUserA] = useState('');
  const [userB, setUserB] = useState('');
  const [result, setResult] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {result && (
        <div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <CompareCol label={result.a.profile.login} data={result.a} />
            <CompareCol label={result.b.profile.login} data={result.b} />
          </div>
          {verdict && <p className="text-gray-300 text-sm mt-4 italic">{verdict}</p>}
        </div>
      )}
    </div>
  );
}

function CompareCol({ label, data }) {
  return (
    <div className="bg-base border border-border rounded-lg p-3">
      <div className="font-medium mb-2">@{label}</div>
      <Row k="Repos" v={data.stats.totalRepos} />
      <Row k="Stars" v={data.stats.totalStars} />
      <Row k="Forks" v={data.stats.totalForks} />
      <Row k="Followers" v={data.profile.followers} />
      <Row k="Top language" v={data.languages[0]?.language || 'n/a'} />
      <Row k="Doc grade" v={data.stats.documentationGrade} />
      <Row k="OSS score" v={`${data.stats.openSourceScore}/100`} />
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between text-gray-400 py-0.5">
      <span>{k}</span>
      <span className="text-gray-200">{v}</span>
    </div>
  );
}
