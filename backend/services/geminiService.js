const axios = require('axios');

const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

function buildEndpoint(model) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set in the backend .env file');
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestOnce(model, prompt, maxOutputTokens) {
  const endpoint = buildEndpoint(model);
  const { data } = await axios.post(
    endpoint,
    {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens }
    },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.map((p) => p.text).join('\n');
  if (!text) throw new Error('Gemini returned no content');

  // If Gemini stopped because it hit the token cap mid-sentence, retry once with
  // a larger budget so the response isn't cut off. Only worth doing once — if it
  // still gets cut off at the higher cap something else is going on.
  if (candidate?.finishReason === 'MAX_TOKENS' && maxOutputTokens < 2048) {
    return requestOnce(model, prompt, maxOutputTokens * 2);
  }

  return text.trim();
}

// Gemini's free tier frequently returns 503 "model overloaded" under high demand.
// This is transient and almost always clears up within a few seconds, so retry
// with exponential backoff + jitter before giving up.
async function callGemini(prompt, { maxRetries = 3, maxOutputTokens = 800 } = {}) {
  let delay = 800;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await requestOnce(MODEL, prompt, maxOutputTokens);
    } catch (err) {
      const status = err.response?.status;
      const retriable = status === 503 || status === 429;
      if (!retriable || attempt === maxRetries) throw err;
      const jitter = Math.random() * 300;
      await sleep(delay + jitter);
      delay *= 2;
    }
  }
}

function summaryPrompt(analysis) {
  const { profile, languages, commitTimes, stats, badges, topRepos } = analysis;
  const langLines = languages.slice(0, 5).map((l) => `- ${l.language}: ${l.percentage}%`).join('\n');
  const badgeLines = badges.map((b) => `- ${b.name}`).join('\n');

  return `You are analyzing a GitHub developer's public profile data to write a short, friendly personality summary.

Username: ${profile.login}
Bio: ${profile.bio || 'none'}
Public repos: ${profile.publicRepos}
Followers: ${profile.followers}
Total stars: ${stats.totalStars}
Documentation grade: ${stats.documentationGrade}
Open source score: ${stats.openSourceScore}/100

Languages used:
${langLines || 'no language data'}

Commit time pattern: ${commitTimes.nightOwlRatio}% night, ${commitTimes.earlyBirdRatio}% early morning, ${commitTimes.weekendRatio}% weekend (sampled from recent public activity)

Badges detected:
${badgeLines}

Top repos:
${topRepos.slice(0, 3).map((r) => `- ${r.name} (${r.stars} stars): ${r.description || 'no description'}`).join('\n')}

Write:
1. A 3-4 sentence "Personality" summary in second person ("You...").
2. Two "Strengths" as short bullet points.
3. Two "Growth areas" as short bullet points (constructive, not harsh).
4. One "Best-fit role" suggestion (one line).

Keep the tone warm and encouraging, grounded only in the data given. Do not invent facts not implied by the data. Return plain text with clear section labels, no markdown headers.`;
}

function roastPrompt(analysis) {
  const { profile, stats, topRepos } = analysis;
  const repoNames = topRepos.map((r) => r.name).join(', ');
  return `Write a short, PLAYFUL, light-hearted "roast" (max 4 sentences) of a GitHub developer, based only on this public data. Keep it good-natured, funny, never mean-spirited, no insults about the person as an individual — only gentle jokes about coding habits like repo naming, unfinished side projects, or commit timing. Never insult identity, appearance, or anything not in the data.

Username: ${profile.login}
Public repos: ${profile.publicRepos}
Documentation grade: ${stats.documentationGrade}
Repo names sample: ${repoNames || 'none available'}

Return only the roast text, no preamble.`;
}

function comparePrompt(a, b) {
  return `Compare two GitHub developers based on this data and give a short, fun, even-handed 3-sentence verdict on their differing strengths. Do not declare one strictly "better" as a person — compare working styles only.

Developer A (${a.profile.login}): ${a.stats.totalStars} stars, ${a.profile.followers} followers, ${a.stats.totalRepos} repos, doc grade ${a.stats.documentationGrade}, top language ${a.languages[0]?.language || 'n/a'}.
Developer B (${b.profile.login}): ${b.stats.totalStars} stars, ${b.profile.followers} followers, ${b.stats.totalRepos} repos, doc grade ${b.stats.documentationGrade}, top language ${b.languages[0]?.language || 'n/a'}.

Return only the verdict text.`;
}

async function generateSummary(analysis) {
  // Personality + strengths + growth areas + role suggestion needs more headroom.
  return callGemini(summaryPrompt(analysis), { maxOutputTokens: 1024 });
}

async function generateRoast(analysis) {
  return callGemini(roastPrompt(analysis), { maxOutputTokens: 400 });
}

async function generateCompareVerdict(a, b) {
  return callGemini(comparePrompt(a, b), { maxOutputTokens: 400 });
}

module.exports = { generateSummary, generateRoast, generateCompareVerdict };
