const github = require('./githubService');

/**
 * Aggregates language bytes across a user's non-fork repos.
 * Falls back to the repo's primary `language` field when the
 * per-repo /languages call is skipped (keeps API usage bounded).
 */
async function getLanguageBreakdown(repos, { deep = false } = {}) {
  const totals = {};

  if (deep) {
    // Only fetch per-repo language byte counts for the top N repos by stars,
    // to avoid one API call per repo on large accounts.
    const topRepos = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 15);
    const results = await Promise.allSettled(
      topRepos.map((r) => github.getLanguagesForRepo(r.full_name))
    );
    results.forEach((res) => {
      if (res.status === 'fulfilled') {
        Object.entries(res.value).forEach(([lang, bytes]) => {
          totals[lang] = (totals[lang] || 0) + bytes;
        });
      }
    });
  } else {
    repos.forEach((r) => {
      if (r.language) totals[r.language] = (totals[r.language] || 0) + 1;
    });
  }

  const total = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  const breakdown = Object.entries(totals)
    .map(([language, value]) => ({
      language,
      value,
      percentage: Math.round((value / total) * 1000) / 10
    }))
    .sort((a, b) => b.value - a.value);

  return breakdown;
}

function getCommitTimeDistribution(events) {
  const pushEvents = events.filter((e) => e.type === 'PushEvent');
  const hourBuckets = new Array(24).fill(0);
  const dayBuckets = new Array(7).fill(0); // 0 = Sunday

  pushEvents.forEach((e) => {
    const d = new Date(e.created_at);
    hourBuckets[d.getUTCHours()] += 1;
    dayBuckets[d.getUTCDay()] += 1;
  });

  const nightCommits = hourBuckets.slice(0, 5).reduce((a, b) => a + b, 0) + hourBuckets.slice(22).reduce((a, b) => a + b, 0);
  const morningCommits = hourBuckets.slice(5, 12).reduce((a, b) => a + b, 0);
  const totalCommits = hourBuckets.reduce((a, b) => a + b, 0) || 1;
  const weekendCommits = dayBuckets[0] + dayBuckets[6];

  return {
    hourBuckets,
    dayBuckets,
    totalSampledPushes: totalCommits,
    nightOwlRatio: Math.round((nightCommits / totalCommits) * 100),
    earlyBirdRatio: Math.round((morningCommits / totalCommits) * 100),
    weekendRatio: Math.round((weekendCommits / totalCommits) * 100)
  };
}

function getCommitHeatmap(events) {
  // Buckets sampled push events by day for the last ~90 days available via the events API.
  const dayMap = {};
  events
    .filter((e) => e.type === 'PushEvent')
    .forEach((e) => {
      const day = e.created_at.slice(0, 10);
      const commitCount = (e.payload && e.payload.commits && e.payload.commits.length) || 1;
      dayMap[day] = (dayMap[day] || 0) + commitCount;
    });

  const days = Object.entries(dayMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  // Longest streak of consecutive days with >=1 commit
  let longestStreak = 0;
  let currentStreak = 0;
  let prevDate = null;
  days.forEach(({ date }) => {
    const d = new Date(date);
    if (prevDate) {
      const diff = (d - prevDate) / (1000 * 60 * 60 * 24);
      currentStreak = diff === 1 ? currentStreak + 1 : 1;
    } else {
      currentStreak = 1;
    }
    longestStreak = Math.max(longestStreak, currentStreak);
    prevDate = d;
  });

  return { days, longestStreak, note: 'Sampled from the last ~90 days of public events (GitHub API limit).' };
}

function docScore(repos) {
  const withDescription = repos.filter((r) => r.description && r.description.trim().length > 10).length;
  const ratio = repos.length ? withDescription / repos.length : 0;
  let grade = 'F';
  if (ratio >= 0.85) grade = 'A';
  else if (ratio >= 0.65) grade = 'B';
  else if (ratio >= 0.45) grade = 'C';
  else if (ratio >= 0.25) grade = 'D';
  return { grade, ratio: Math.round(ratio * 100) };
}

function openSourceScore({ profile, repos }) {
  const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);
  const starsScore = Math.min(40, Math.log2(totalStars + 1) * 8);
  const followersScore = Math.min(25, Math.log2(profile.followers + 1) * 5);
  const reposScore = Math.min(20, Math.log2(profile.publicRepos + 1) * 4);
  const forksScore = Math.min(15, Math.log2(totalForks + 1) * 4);
  return Math.round(starsScore + followersScore + reposScore + forksScore);
}

function computeBadges({ commitTimes, languages, repos, docGrade, issues, longestStreak = 0 }) {
  const badges = [];

  if (longestStreak >= 30) {
    badges.push({ icon: '🔥', name: 'Unstoppable', detail: `${longestStreak}-day commit streak (sampled from recent public activity)` });
  } else if (longestStreak >= 14) {
    badges.push({ icon: '🔥', name: 'On a Streak', detail: `${longestStreak}-day commit streak (sampled from recent public activity)` });
  } else if (longestStreak >= 7) {
    badges.push({ icon: '🔥', name: 'Consistent Committer', detail: `${longestStreak}-day commit streak (sampled from recent public activity)` });
  }

  if (commitTimes.nightOwlRatio >= 40) badges.push({ icon: '🌙', name: 'Night Owl', detail: `${commitTimes.nightOwlRatio}% of sampled commits between 10PM–5AM` });
  if (commitTimes.earlyBirdRatio >= 40) badges.push({ icon: '☀️', name: 'Early Bird', detail: `${commitTimes.earlyBirdRatio}% of sampled commits between 5AM–12PM` });

  const topLang = languages[0];
  if (topLang && ['JavaScript', 'TypeScript'].includes(topLang.language)) badges.push({ icon: '🧠', name: 'Loves JavaScript', detail: `${topLang.percentage}% ${topLang.language}` });
  if (languages.length >= 5) badges.push({ icon: '🧪', name: 'Experimenter', detail: `Active in ${languages.length} languages` });

  const uniqueLangs = new Set(repos.map((r) => r.language).filter(Boolean));
  const hasFrontend = [...uniqueLangs].some((l) => ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'Vue'].includes(l));
  const hasBackend = [...uniqueLangs].some((l) => ['Python', 'Go', 'Java', 'C#', 'Ruby', 'PHP'].includes(l));
  if (hasFrontend && hasBackend) badges.push({ icon: '🛠', name: 'Full Stack Engineer', detail: 'Repos span both frontend and backend languages' });

  if (docGrade.grade === 'A' || docGrade.grade === 'B') badges.push({ icon: '📖', name: 'Documentation Lover', detail: `Doc score ${docGrade.grade}` });

  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  if (totalStars >= 100) badges.push({ icon: '🚀', name: 'Open Source Hero', detail: `${totalStars} total stars` });

  if (issues && issues.bugLabeledPRs > 5) badges.push({ icon: '🐛', name: 'Bug Hunter', detail: `${issues.bugLabeledPRs} bug-labeled PRs found` });

  if (commitTimes.totalSampledPushes > 60) badges.push({ icon: '⚡', name: 'Speed Coder', detail: 'High recent commit frequency' });

  if (badges.length === 0) badges.push({ icon: '🌱', name: 'Just Getting Started', detail: 'Not enough public activity yet to fully profile' });

  return badges;
}

async function analyzeUser(username, { deepLanguages = false } = {}) {
  const [profile, repos, orgs, events] = await Promise.all([
    github.getProfile(username),
    github.getAllRepos(username),
    github.getOrganizations(username),
    github.getPublicEvents(username)
  ]);

  let issues = null;
  try {
    issues = await github.getIssueCounts(username);
  } catch (e) {
    issues = null; // search API is more rate-limited; degrade gracefully
  }

  const languages = await getLanguageBreakdown(repos, { deep: deepLanguages });
  const commitTimes = getCommitTimeDistribution(events);
  const heatmap = getCommitHeatmap(events);
  const doc = docScore(repos);
  const ossScore = openSourceScore({ profile, repos });
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks = repos.reduce((s, r) => s + r.forks_count, 0);
  const bugFixRatio = issues && issues.mergedPRs ? Math.round((issues.bugLabeledPRs / issues.mergedPRs) * 100) : null;

  const topRepos = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6)
    .map((r) => ({
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      updatedAt: r.updated_at,
      url: r.html_url,
      size: r.size
    }));

  const firstRepo = [...repos].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];

  const badges = computeBadges({ commitTimes, languages, repos, docGrade: doc, issues, longestStreak: heatmap.longestStreak });

  return {
    profile,
    organizations: orgs,
    stats: {
      totalRepos: repos.length,
      totalStars,
      totalForks,
      openSourceScore: ossScore,
      documentationGrade: doc.grade,
      bugFixRatio
    },
    languages,
    commitTimes,
    heatmap,
    topRepos,
    timeline: {
      firstRepo: firstRepo ? { name: firstRepo.name, createdAt: firstRepo.created_at, url: firstRepo.html_url } : null
    },
    badges
  };
}

module.exports = { analyzeUser, getLanguageBreakdown, getCommitTimeDistribution };
