const axios = require('axios');
const NodeCache = require('node-cache');

// Cache responses for 15 minutes to stay well within GitHub's rate limits
const cache = new NodeCache({ stdTTL: 900 });

const gh = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github+json',
    Authorization: process.env.GITHUB_TOKEN ? `Bearer ${process.env.GITHUB_TOKEN}` : undefined
  }
});

async function cached(key, fn) {
  const hit = cache.get(key);
  if (hit) return hit;
  const value = await fn();
  cache.set(key, value);
  return value;
}

async function getProfile(username) {
  return cached(`profile:${username}`, async () => {
    const { data } = await gh.get(`/users/${username}`);
    return {
      login: data.login,
      name: data.name,
      avatarUrl: data.avatar_url,
      bio: data.bio,
      company: data.company,
      location: data.location,
      followers: data.followers,
      following: data.following,
      publicRepos: data.public_repos,
      publicGists: data.public_gists,
      createdAt: data.created_at,
      blog: data.blog,
      twitterUsername: data.twitter_username
    };
  });
}

async function getAllRepos(username) {
  return cached(`repos:${username}`, async () => {
    let page = 1;
    let repos = [];
    // GitHub caps at 100 per page; walk pages until exhausted (max ~5 pages to bound API usage)
    while (page <= 5) {
      const { data } = await gh.get(`/users/${username}/repos`, {
        params: { per_page: 100, page, sort: 'updated' }
      });
      repos = repos.concat(data);
      if (data.length < 100) break;
      page += 1;
    }
    return repos.filter((r) => !r.fork);
  });
}

async function getOrganizations(username) {
  return cached(`orgs:${username}`, async () => {
    const { data } = await gh.get(`/users/${username}/orgs`);
    return data.map((o) => ({ login: o.login, avatarUrl: o.avatar_url }));
  });
}

async function getPublicEvents(username) {
  // Only the last ~90 days / 300 events are available via this endpoint;
  // used as a sample for commit-time and recent-activity heuristics.
  return cached(`events:${username}`, async () => {
    let events = [];
    for (let page = 1; page <= 3; page += 1) {
      const { data } = await gh.get(`/users/${username}/events/public`, {
        params: { per_page: 100, page }
      });
      events = events.concat(data);
      if (data.length < 100) break;
    }
    return events;
  });
}

async function getLanguagesForRepo(fullName) {
  return cached(`langs:${fullName}`, async () => {
    const { data } = await gh.get(`/repos/${fullName}/languages`);
    return data; // { JavaScript: bytesCount, ... }
  });
}

async function getIssueCounts(username) {
  // Uses the Search API to approximate bug-fix ratio and PR activity.
  return cached(`issues:${username}`, async () => {
    const [prsClosed, issuesCreated, bugLabeled] = await Promise.all([
      gh.get('/search/issues', { params: { q: `author:${username} type:pr is:merged` } }),
      gh.get('/search/issues', { params: { q: `author:${username} type:issue` } }),
      gh.get('/search/issues', { params: { q: `author:${username} type:pr label:bug` } })
    ]);
    return {
      mergedPRs: prsClosed.data.total_count,
      issuesCreated: issuesCreated.data.total_count,
      bugLabeledPRs: bugLabeled.data.total_count
    };
  });
}

module.exports = {
  getProfile,
  getAllRepos,
  getOrganizations,
  getPublicEvents,
  getLanguagesForRepo,
  getIssueCounts
};
