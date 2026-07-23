import { useRef, useState } from 'react';
import { analyzeUser, getAISummary, extractErrorMessage } from './api';
import ProfileCard from './components/ProfileCard';
import BadgeList from './components/BadgeList';
import LanguageChart from './components/LanguageChart';
import CommitHeatmap from './components/CommitHeatmap';
import CommitActivityChart from './components/CommitActivityChart';
import PersonalityRadar from './components/PersonalityRadar';
import RepoInsights from './components/RepoInsights';
import AISummary from './components/AISummary';
import CompareView from './components/CompareView';
import ShareSummary from './components/ShareSummary';
import ExportImageButton from './components/ExportImageButton';
import ThemeToggle from './components/ThemeToggle';
import ProgressLoader from './components/ProgressLoader';
import RecentSearches, { addRecentSearch } from './components/RecentSearches';
import ThreeBackground from './components/ThreeBackground';

export default function App() {
  const [username, setUsername] = useState('');
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState(null);
  const [showCompare, setShowCompare] = useState(false);
  const [recentRefreshKey, setRecentRefreshKey] = useState(0);
  const reportRef = useRef(null);

  async function runSearch(name) {
    if (!name) return;

    setLoading(true);
    setError(null);
    setData(null);
    setSummary(null);

    try {
      const analysis = await analyzeUser(name);
      setData(analysis);
      addRecentSearch(name);
      setRecentRefreshKey((k) => k + 1);
      setLoadingSummary(true);
      getAISummary(name)
        .then(setSummary)
        .catch(() => setSummary(null))
        .finally(() => setLoadingSummary(false));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    runSearch(username.trim());
  }

  function handleRecentSelect(name) {
    setUsername(name);
    runSearch(name);
  }

  return (
    <div className="min-h-screen relative">
      <ThreeBackground />

      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">GitHub Personality Analyzer</h1>
            <p className="text-gray-500 text-sm mt-1">Enter a username to generate a developer personality report.</p>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <button
              onClick={() => setShowCompare((v) => !v)}
              className="text-sm bg-panel border border-border rounded-lg px-3 py-2 hover:border-accent transition"
            >
              {showCompare ? 'Back to analysis' : '⚔️ Compare mode'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        {showCompare ? (
          <CompareView />
        ) : (
          <>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. torvalds"
                className="bg-panel border border-border rounded-lg px-4 py-2.5 flex-1 focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-accent text-black font-medium rounded-lg px-5 py-2.5 disabled:opacity-50"
              >
                {loading ? 'Analyzing…' : 'Analyze'}
              </button>
            </form>

            <RecentSearches onSelect={handleRecentSelect} refreshKey={recentRefreshKey} />

            <ProgressLoader active={loading} label="Analyzing profile" />

            {error && (
              <div className="card border-red-900 bg-red-950/30 text-red-300 text-sm">{error}</div>
            )}

            {data && (
              <div className="space-y-5" ref={reportRef}>
                <div className="fade-in-up">
                  <ProfileCard profile={data.profile} stats={data.stats} />
                </div>
                <div className="flex justify-end gap-2 -mt-2">
                  <ShareSummary data={data} />
                  <ExportImageButton targetRef={reportRef} filename={`${data.profile.login}-github-personality`} />
                </div>
                <div className="fade-in-up"><BadgeList badges={data.badges} stats={data.stats} /></div>
                <div className="fade-in-up"><AISummary username={data.profile.login} summary={summary} loadingSummary={loadingSummary} /></div>
                <div className="grid sm:grid-cols-2 gap-5 fade-in-up">
                  <LanguageChart languages={data.languages} />
                  <PersonalityRadar stats={data.stats} commitTimes={data.commitTimes} />
                </div>
                <div className="grid sm:grid-cols-2 gap-5 fade-in-up">
                  <CommitHeatmap heatmap={data.heatmap} />
                  <CommitActivityChart commitTimes={data.commitTimes} />
                </div>
                <div className="fade-in-up"><RepoInsights repos={data.topRepos} timeline={data.timeline} /></div>
              </div>
            )}

            {!data && !loading && !error && (
              <div className="card text-center text-gray-500 py-12">
                Search a GitHub username above to get started.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
