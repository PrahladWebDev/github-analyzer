const github = require('./githubService');

const DAY_MS = 1000 * 60 * 60 * 24;

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Repository Health scoring. Every sub-score is derived only from real,
 * fetchable GitHub data — no invented metrics. Weighted average produces a
 * single 0-100 "Repository Health" number, mirroring the spirit of the
 * developer scorecard but scoped to one repo.
 */
function computeRepoHealth(repo, intel) {
  const ageDays = (Date.now() - new Date(repo.createdAt).getTime()) / DAY_MS;
  const daysSincePush = (Date.now() - new Date(repo.pushedAt || repo.updatedAt).getTime()) / DAY_MS;

  // Popularity: stars + forks, log-scaled so early traction still registers.
  const popularity = clamp(Math.log2(repo.stars + repo.forks + 1) * 12);

  // Freshness: recently-pushed repos score higher, decaying over ~2 years.
  const freshness = clamp(100 - (daysSincePush / 730) * 100);

  // Community: contributors beyond the owner signal real collaboration.
  const contributors = intel.contributors ?? 1;
  const community = clamp(Math.log2(contributors + 1) * 25);

  // Issue hygiene: some open issues is healthy (active project); a backlog
  // that dwarfs the star count suggests neglect.
  const issueRatio =
    repo.stars > 0 ? repo.openIssues / (repo.stars + 5) : repo.openIssues > 20 ? 1 : 0.3;
  const issueHygiene = clamp(100 - issueRatio * 60);

  // Documentation: README presence + length.
  const readmeScore = intel.readme?.exists ? clamp(40 + Math.log2(intel.readme.size + 1) * 8) : 15;

  // Maturity: repos maintained over a longer span without going stale.
  const maturity = clamp(Math.log2(ageDays + 1) * 10);

  // Shipping discipline: tagged releases signal real deployment practice.
  const shipping = clamp((intel.releases ?? 0) > 0 ? 60 + Math.min(40, intel.releases * 8) : 20);

  const weighted =
    popularity * 0.2 +
    freshness * 0.15 +
    community * 0.15 +
    issueHygiene * 0.15 +
    readmeScore * 0.15 +
    maturity * 0.1 +
    shipping * 0.1;

  return {
    score: Math.round(clamp(weighted)),
    breakdown: {
      popularity: Math.round(popularity),
      freshness: Math.round(freshness),
      community: Math.round(community),
      issueHygiene: Math.round(issueHygiene),
      documentation: Math.round(readmeScore),
      maturity: Math.round(maturity),
      shipping: Math.round(shipping)
    },
    contributors,
    releases: intel.releases ?? 0,
    hasReadme: !!intel.readme?.exists,
    ageDays: Math.round(ageDays),
    daysSinceLastPush: Math.round(daysSincePush)
  };
}

// Bounded to the top repos only (already capped at 6) to keep API usage
// predictable — three extra calls per repo, all cached for 15 minutes.
async function enrichTopRepos(topRepos) {
  const results = await Promise.allSettled(
    topRepos.map(async (r) => {
      const [contributors, readme, releases] = await Promise.allSettled([
        github.getRepoContributorsCount(r.fullName),
        github.getRepoReadmeInfo(r.fullName),
        github.getReleasesCount(r.fullName)
      ]);
      const intel = {
        contributors: contributors.status === 'fulfilled' ? contributors.value : null,
        readme: readme.status === 'fulfilled' ? readme.value : { exists: false, size: 0 },
        releases: releases.status === 'fulfilled' ? releases.value : 0
      };
      return { ...r, health: computeRepoHealth(r, intel) };
    })
  );

  return results.map((res, i) => (res.status === 'fulfilled' ? res.value : { ...topRepos[i], health: null }));
}

module.exports = { enrichTopRepos, computeRepoHealth };
