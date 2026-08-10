// Maps a repo's primary language to a rough "what kind of work" category.
// Intentionally coarse — this is a storytelling aid, not a classifier.
const LANGUAGE_CATEGORY = {
  JavaScript: 'Frontend / Full-stack',
  TypeScript: 'Frontend / Full-stack',
  Vue: 'Frontend',
  HTML: 'Frontend',
  CSS: 'Frontend',
  Python: 'Backend / Data',
  Go: 'Backend',
  Java: 'Backend',
  'C#': 'Backend',
  Ruby: 'Backend',
  PHP: 'Backend',
  Swift: 'Mobile',
  Kotlin: 'Mobile',
  Dart: 'Mobile',
  Rust: 'Systems',
  C: 'Systems',
  'C++': 'Systems',
  'Jupyter Notebook': 'AI / ML',
  R: 'AI / ML',
  Shell: 'DevOps / Tooling'
};

const AI_KEYWORDS = ['gemini', 'gpt', 'llm', 'openai', ' ai ', '-ai', 'ai-', 'ml ', 'machine learning', 'chatbot', 'rag'];

function categoryFor(repo) {
  const haystack = `${repo.name || ''} ${repo.description || ''}`.toLowerCase();
  if (AI_KEYWORDS.some((k) => haystack.includes(k))) return 'AI / ML';
  return LANGUAGE_CATEGORY[repo.language] || 'General';
}

/**
 * Groups non-fork repos by the year they were created, and picks the
 * dominant language + inferred category for that year — giving a
 * "React 2023 → Node.js 2024 → TypeScript 2025 → AI 2026" style story
 * built entirely from real repo creation dates and languages.
 */
function buildTechEvolution(repos) {
  const byYear = {};

  repos
    .filter((r) => r.created_at && r.language)
    .forEach((r) => {
      const year = new Date(r.created_at).getFullYear();
      byYear[year] = byYear[year] || {};
      const repoLike = { name: r.name, description: r.description, language: r.language };
      const key = r.language;
      byYear[year][key] = byYear[year][key] || { count: 0, sample: repoLike };
      byYear[year][key].count += 1;
    });

  return Object.entries(byYear)
    .map(([year, langs]) => {
      const sorted = Object.entries(langs).sort((a, b) => b[1].count - a[1].count);
      const [topLang, info] = sorted[0];
      const totalRepos = sorted.reduce((sum, [, v]) => sum + v.count, 0);
      return {
        year: Number(year),
        language: topLang,
        category: categoryFor(info.sample),
        repoCount: totalRepos,
        languageSpread: sorted.map(([lang, v]) => ({ language: lang, count: v.count }))
      };
    })
    .sort((a, b) => a.year - b.year);
}

module.exports = { buildTechEvolution };
