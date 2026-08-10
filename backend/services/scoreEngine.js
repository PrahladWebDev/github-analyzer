function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function log2Score(value, multiplier, cap = 100) {
  return clamp(Math.log2(value + 1) * multiplier, 0, cap);
}

const FRONTEND_LANGS = ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'Vue'];
const BACKEND_LANGS = ['Python', 'Go', 'Java', 'C#', 'Ruby', 'PHP', 'Rust', 'C', 'C++'];

/**
 * 🧠 Code Quality — documentation ratio blended with average repo health
 * (README quality, issue hygiene, shipping discipline) when available.
 */
function scoreCodeQuality({ doc, avgRepoHealth }) {
  const docPart = doc.ratio; // already 0-100
  const healthPart = avgRepoHealth != null ? avgRepoHealth : docPart;
  return clamp(docPart * 0.5 + healthPart * 0.5);
}

/** 🔥 Consistency — commit streak length + sustained recent push volume. */
function scoreConsistency({ longestStreak, totalSampledPushes }) {
  const streakScore = clamp(longestStreak * 3.2);
  const volumeScore = clamp(totalSampledPushes * 1.1);
  return clamp(streakScore * 0.65 + volumeScore * 0.35);
}

/** 📚 Learning / Exploration — breadth of languages touched + org involvement. */
function scoreLearning({ languageCount, orgCount }) {
  const breadth = log2Score(languageCount, 32);
  const orgBonus = clamp(orgCount * 8, 0, 20);
  return clamp(breadth * 0.8 + orgBonus);
}

/** 🤝 Collaboration — followers, forks received, orgs, merged PR activity. */
function scoreCollaboration({ followers, totalForks, orgCount, mergedPRs }) {
  const followerScore = log2Score(followers, 14);
  const forkScore = log2Score(totalForks, 12);
  const orgScore = clamp(orgCount * 10, 0, 20);
  const prScore = mergedPRs != null ? log2Score(mergedPRs, 10) : 0;
  return clamp(followerScore * 0.35 + forkScore * 0.3 + orgScore * 0.15 + prScore * 0.2);
}

/** 🚀 Activity — recent sampled push volume + how many top repos are freshly touched. */
function scoreActivity({ totalSampledPushes, freshRepoRatio, publicRepos }) {
  const pushScore = clamp(totalSampledPushes * 1.4);
  const freshScore = clamp(freshRepoRatio * 100);
  const repoCountScore = log2Score(publicRepos, 12);
  return clamp(pushScore * 0.5 + freshScore * 0.3 + repoCountScore * 0.2);
}

/** 🛠️ Project Complexity — avg repo size, language breadth per repo, community validation. */
function scoreComplexity({ avgSizeKb, languageCount, repoCount, totalStars, totalForks }) {
  const sizeScore = log2Score(avgSizeKb, 8);
  const breadthScore = log2Score(languageCount, 20);
  const scaleScore = log2Score(repoCount, 14);
  const validationScore = log2Score(totalStars + totalForks, 8);
  return clamp(sizeScore * 0.3 + breadthScore * 0.2 + scaleScore * 0.2 + validationScore * 0.3);
}

function buildExplanation(categories, overall) {
  const sorted = [...categories].sort((a, b) => b.score - a.score);
  const top = sorted.slice(0, 2);
  const weakest = sorted[sorted.length - 1];

  const topText = top.map((c) => `${c.label} (${c.score})`).join(' and ');
  const weakText = `${weakest.label} (${weakest.score})`;

  return (
    `This ${overall}/100 score is driven mainly by strong ${topText}. ` +
    `The biggest opportunity for improvement is ${weakText} — ` +
    `${weakest.improvementHint}`
  );
}

const IMPROVEMENT_HINTS = {
  codeQuality: 'writing clearer READMEs and repo descriptions would lift this fastest.',
  consistency: 'more frequent, evenly-spaced commits (rather than bursts) would help.',
  learning: 'exploring a new language or framework in a side project would widen this.',
  collaboration: 'contributing to other people\'s repos or growing followers would move this up.',
  activity: 'more regular recent activity across repos would raise this.',
  complexity: 'shipping a larger, multi-module project would push this higher.'
};

const ARCHETYPES = [
  {
    name: 'Open Source Contributor',
    icon: '🌍',
    test: (c, ctx) => c.collaboration.score >= 70 && ctx.totalForks >= 10,
    description: 'Builds things other developers actively fork, follow, and contribute back to.'
  },
  {
    name: 'Consistency Machine',
    icon: '🔥',
    test: (c) => c.consistency.score >= 80,
    description: 'Ships on a steady rhythm — long commit streaks and sustained activity, not bursts.'
  },
  {
    name: 'Polyglot Developer',
    icon: '🧩',
    test: (c, ctx) => ctx.languageCount >= 7,
    description: 'Comfortable moving across many languages and ecosystems rather than specializing in one.'
  },
  {
    name: 'Backend Architect',
    icon: '🏗️',
    test: (c, ctx) => ctx.hasBackend && !ctx.hasFrontend && c.complexity.score >= 55,
    description: 'Repos skew toward services, data, and infrastructure over UI work.'
  },
  {
    name: 'Frontend Specialist',
    icon: '🎨',
    test: (c, ctx) => ctx.hasFrontend && !ctx.hasBackend,
    description: 'Repos are concentrated in UI-facing languages and frameworks.'
  },
  {
    name: 'Product Builder',
    icon: '🚢',
    test: (c, ctx) => c.complexity.score >= 65 && ctx.hasReleases,
    description: 'Ships complete, tagged, deployable projects rather than one-off scripts.'
  },
  {
    name: 'Weekend Hacker',
    icon: '🌙',
    test: (c, ctx) => ctx.weekendRatio >= 45,
    description: 'Most public activity happens outside a typical Monday–Friday work rhythm.'
  },
  {
    name: 'Full-Stack Builder',
    icon: '🛠️',
    test: (c, ctx) => ctx.hasFrontend && ctx.hasBackend,
    description: 'Moves comfortably between frontend and backend on the same projects.'
  }
];

function pickArchetype(categoriesByKey, ctx) {
  for (const a of ARCHETYPES) {
    if (a.test(categoriesByKey, ctx)) {
      return { name: a.name, icon: a.icon, description: a.description };
    }
  }
  return {
    name: 'Rising Developer',
    icon: '🌱',
    description: 'Still building a public track record — the fundamentals are there to grow any direction.'
  };
}

/**
 * Computes the full Developer Scorecard: 6 category scores, an overall
 * 0-100 score, a plain-English explanation, and a rule-based archetype.
 * Every input is data already fetched elsewhere in the pipeline — nothing
 * here makes extra GitHub calls.
 */
function computeScorecard({ profile, repos, languages, commitTimes, heatmap, issues, orgs, topRepos, doc }) {
  const uniqueLangs = new Set(repos.map((r) => r.language).filter(Boolean));
  const hasFrontend = [...uniqueLangs].some((l) => FRONTEND_LANGS.includes(l));
  const hasBackend = [...uniqueLangs].some((l) => BACKEND_LANGS.includes(l));

  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks = repos.reduce((s, r) => s + r.forks_count, 0);
  const avgSizeKb = repos.length ? repos.reduce((s, r) => s + (r.size || 0), 0) / repos.length : 0;

  const healthyRepos = (topRepos || []).filter((r) => r.health);
  const avgRepoHealth = healthyRepos.length
    ? healthyRepos.reduce((s, r) => s + r.health.score, 0) / healthyRepos.length
    : null;
  const freshRepoRatio = healthyRepos.length
    ? healthyRepos.filter((r) => r.health.daysSinceLastPush <= 60).length / healthyRepos.length
    : 0;
  const hasReleases = healthyRepos.some((r) => r.health.releases > 0);

  const codeQuality = scoreCodeQuality({ doc, avgRepoHealth });
  const consistency = scoreConsistency({
    longestStreak: heatmap.longestStreak,
    totalSampledPushes: commitTimes.totalSampledPushes
  });
  const learning = scoreLearning({ languageCount: languages.length, orgCount: orgs.length });
  const collaboration = scoreCollaboration({
    followers: profile.followers,
    totalForks,
    orgCount: orgs.length,
    mergedPRs: issues?.mergedPRs
  });
  const activity = scoreActivity({
    totalSampledPushes: commitTimes.totalSampledPushes,
    freshRepoRatio,
    publicRepos: profile.publicRepos
  });
  const complexity = scoreComplexity({
    avgSizeKb,
    languageCount: languages.length,
    repoCount: repos.length,
    totalStars,
    totalForks
  });

  const categoriesByKey = {
    codeQuality: { score: codeQuality },
    consistency: { score: consistency },
    learning: { score: learning },
    collaboration: { score: collaboration },
    activity: { score: activity },
    complexity: { score: complexity }
  };

  const categories = [
    { key: 'codeQuality', icon: '🧠', label: 'Code Quality', score: codeQuality, improvementHint: IMPROVEMENT_HINTS.codeQuality },
    { key: 'consistency', icon: '🔥', label: 'Consistency', score: consistency, improvementHint: IMPROVEMENT_HINTS.consistency },
    { key: 'learning', icon: '📚', label: 'Learning / Exploration', score: learning, improvementHint: IMPROVEMENT_HINTS.learning },
    { key: 'collaboration', icon: '🤝', label: 'Collaboration', score: collaboration, improvementHint: IMPROVEMENT_HINTS.collaboration },
    { key: 'activity', icon: '🚀', label: 'Activity', score: activity, improvementHint: IMPROVEMENT_HINTS.activity },
    { key: 'complexity', icon: '🛠️', label: 'Project Complexity', score: complexity, improvementHint: IMPROVEMENT_HINTS.complexity }
  ];

  const overall = clamp(categories.reduce((s, c) => s + c.score, 0) / categories.length);
  const explanation = buildExplanation(categories, overall);

  const archetype = pickArchetype(categoriesByKey, {
    hasFrontend,
    hasBackend,
    languageCount: languages.length,
    totalForks,
    weekendRatio: commitTimes.weekendRatio,
    hasReleases
  });

  return {
    overall,
    categories: categories.map(({ improvementHint, ...rest }) => rest),
    explanation,
    archetype
  };
}

module.exports = { computeScorecard };
