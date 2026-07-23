
// Builds a chronological "career" story purely from dates the GitHub API
// actually gives us (account creation, repo creation dates). We never invent
// a date for things like "crossed 100 stars" since GitHub doesn't expose when
// that happened — instead we surface the real repo that carries those stars.
function buildMilestones({ profile, timeline, topRepos, stats }) {
  const milestones = [];

  if (profile?.createdAt) {
    milestones.push({
      date: profile.createdAt,
      icon: '🎉',
      title: 'Joined GitHub',
      detail: `@${profile.login}`
    });
  }

  if (timeline?.firstRepo) {
    milestones.push({
      date: timeline.firstRepo.createdAt,
      icon: '📦',
      title: 'First public repo',
      detail: timeline.firstRepo.name,
      url: timeline.firstRepo.url
    });
  }

  const firstRepoName = timeline?.firstRepo?.name;
  const dated = (topRepos || [])
    .filter((r) => r.createdAt && r.name !== firstRepoName)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Earliest repo that actually gained real traction (20+ stars) — the closest
  // honest stand-in for a "took off" moment, since GitHub only gives us the
  // repo's creation date, not the date it crossed any star threshold.
  const tookOff = dated.find((r) => r.stars >= 20);
  if (tookOff) {
    milestones.push({
      date: tookOff.createdAt,
      icon: '🚀',
      title: 'Created a repo that took off',
      detail: `${tookOff.name} · ⭐ ${tookOff.stars}`,
      url: tookOff.url
    });
  }

  const mostStarred = [...(topRepos || [])].sort((a, b) => b.stars - a.stars)[0];
  if (mostStarred && mostStarred.createdAt && mostStarred.name !== tookOff?.name && mostStarred.name !== firstRepoName) {
    milestones.push({
      date: mostStarred.createdAt,
      icon: '⭐',
      title: 'Created their most-starred repo',
      detail: `${mostStarred.name} · ⭐ ${mostStarred.stars}`,
      url: mostStarred.url
    });
  }

  milestones.push({
    date: new Date().toISOString(),
    icon: '📈',
    title: 'Today',
    detail: `${stats?.totalRepos ?? 0} repos · ⭐ ${stats?.totalStars ?? 0} stars total`
  });

  return milestones
    .filter((m) => m.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

export default function CareerTimeline({ profile, timeline, topRepos, stats }) {
  const milestones = buildMilestones({ profile, timeline, topRepos, stats });

  if (milestones.length < 2) return null;

  return (
    <div className="card">
      <h3 className="font-semibold mb-4">🛤️ Career Timeline</h3>
      <div className="relative pl-6">
        <div className="timeline-rail" />
        <div className="space-y-5">
          {milestones.map((m, i) => (
            <div key={`${m.title}-${i}`} className="relative">
              <div className="timeline-dot" />
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-xs text-gray-500 font-mono">
                  {new Date(m.date).getFullYear()}
                </span>
                <span className="font-medium text-sm">
                  {m.icon} {m.title}
                </span>
              </div>
              {m.detail && (
                <div className="text-xs text-gray-400 mt-0.5">
                  {m.url ? (
                    <a href={m.url} target="_blank" rel="noreferrer" className="hover:text-accent transition">
                      {m.detail}
                    </a>
                  ) : (
                    m.detail
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
