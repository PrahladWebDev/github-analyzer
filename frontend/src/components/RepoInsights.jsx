const DAY_MS = 1000 * 60 * 60 * 24;

// Lightweight, client-side heuristics for tagging a repo's "personality" —
// mirrors the spirit of the backend badge engine but scoped to one repo,
// using only fields already present in `topRepos`.
function getRepoTags(repo) {
  const tags = [];
  const daysSinceUpdate = (Date.now() - new Date(repo.updatedAt).getTime()) / DAY_MS;

  if (repo.description && repo.description.trim().length > 40) {
    tags.push({ icon: '📖', label: 'Well documented' });
  }

  if (repo.stars >= 100) {
    tags.push({ icon: '🚀', label: 'Popular' });
  } else if (repo.stars >= 20) {
    tags.push({ icon: '⭐', label: 'Gaining traction' });
  }

  if (daysSinceUpdate <= 30) {
    tags.push({ icon: '⚡', label: 'Actively maintained' });
  } else if (daysSinceUpdate >= 365) {
    tags.push({ icon: '🕸️', label: 'Stale' });
  }

  if (repo.forks > 0 && repo.forks >= repo.stars && repo.stars > 0) {
    tags.push({ icon: '🍴', label: 'Fork magnet' });
  }

  return tags;
}

export default function RepoInsights({ repos, timeline }) {
  return (
    <div className="card">
      <h3 className="font-semibold mb-3">⭐ Top Repositories</h3>
      <div className="space-y-3">
        {repos.map((r) => {
          const tags = getRepoTags(r);
          return (
            <a
              key={r.fullName}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="block bg-base border border-border rounded-lg p-3 hover:border-accent transition"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{r.name}</span>
                <span className="text-xs text-gray-400">{r.language}</span>
              </div>
              {r.description && <p className="text-gray-400 text-sm mt-1">{r.description}</p>}
              <div className="flex gap-4 text-xs text-gray-500 mt-2">
                <span>⭐ {r.stars}</span>
                <span>🍴 {r.forks}</span>
                <span>Updated {new Date(r.updatedAt).toLocaleDateString()}</span>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((t) => (
                    <span
                      key={t.label}
                      className="bg-panel border border-border rounded-full px-2 py-0.5 text-[11px] text-gray-300"
                    >
                      {t.icon} {t.label}
                    </span>
                  ))}
                </div>
              )}
            </a>
          );
        })}
        {repos.length === 0 && <p className="text-gray-500 text-sm">No public repositories found.</p>}
      </div>
      {timeline?.firstRepo && (
        <p className="text-gray-500 text-xs mt-4">
          First repo:{' '}
          <a href={timeline.firstRepo.url} target="_blank" rel="noreferrer" className="text-accent">
            {timeline.firstRepo.name}
          </a>{' '}
          ({new Date(timeline.firstRepo.createdAt).toLocaleDateString()})
        </p>
      )}
    </div>
  );
}
