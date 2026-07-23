import { useState } from 'react';

function buildSummaryText(data) {
  const { profile, stats, badges, languages } = data;
  const topLangs = languages.slice(0, 3).map((l) => `${l.language} (${l.percentage}%)`).join(', ');
  const badgeLine = badges.map((b) => `${b.icon} ${b.name}`).join(' · ');

  return [
    `GitHub Personality Report — @${profile.login}`,
    `${profile.followers} followers · ${stats.totalRepos} repos · ${stats.totalStars} stars`,
    topLangs ? `Top languages: ${topLangs}` : null,
    badgeLine ? `Badges: ${badgeLine}` : null,
    `Open Source Score: ${stats.openSourceScore}/100 · Docs: ${stats.documentationGrade}`,
    `Generated with GitHub Personality Analyzer`
  ]
    .filter(Boolean)
    .join('\n');
}

function buildSummaryMarkdown(data) {
  const { profile, stats, badges, languages } = data;
  const topLangs = languages.slice(0, 5).map((l) => `\`${l.language}\` ${l.percentage}%`).join(' · ');
  const badgeLines = badges.map((b) => `- ${b.icon} **${b.name}**${b.detail ? ` — ${b.detail}` : ''}`).join('\n');

  return [
    `### 🧬 GitHub Personality — [@${profile.login}](https://github.com/${profile.login})`,
    '',
    `${profile.followers} followers · ${stats.totalRepos} repos · ⭐ ${stats.totalStars} stars · 📖 Docs: ${stats.documentationGrade} · 🧠 OSS Score: ${stats.openSourceScore}/100`,
    '',
    topLangs ? `**Top languages:** ${topLangs}` : null,
    '',
    badgeLines ? '**Badges:**' : null,
    badgeLines || null,
    '',
    '_Generated with [GitHub Personality Analyzer](https://github.com/)_'
  ]
    .filter((line) => line !== null)
    .join('\n');
}

export default function ShareSummary({ data }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mdCopied, setMdCopied] = useState(false);
  const [mdFailed, setMdFailed] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkFailed, setLinkFailed] = useState(false);

  async function handleCopyLink() {
    const url = `${window.location.origin}/profile/${data.profile.login}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setLinkFailed(false);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setLinkFailed(true);
      setTimeout(() => setLinkFailed(false), 2000);
    }
  }

  async function handleCopy() {
    const text = buildSummaryText(data);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
      setTimeout(() => setFailed(false), 2000);
    }
  }

  async function handleCopyMarkdown() {
    const md = buildSummaryMarkdown(data);
    try {
      await navigator.clipboard.writeText(md);
      setMdCopied(true);
      setMdFailed(false);
      setTimeout(() => setMdCopied(false), 2000);
    } catch {
      setMdFailed(true);
      setTimeout(() => setMdFailed(false), 2000);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={handleCopyLink}
        title="Copy a shareable link to this profile"
        className="text-xs bg-panel border border-border rounded-lg px-3 py-1.5 hover:border-accent transition text-gray-300 shrink-0"
      >
        {linkCopied ? '✅ Link copied!' : linkFailed ? '⚠️ Copy failed' : '🔗 Copy share link'}
      </button>
      <button
        onClick={handleCopy}
        className="text-xs bg-panel border border-border rounded-lg px-3 py-1.5 hover:border-accent transition text-gray-300 shrink-0"
      >
        {copied ? '✅ Copied!' : failed ? '⚠️ Copy failed' : '📋 Copy shareable summary'}
      </button>
      <button
        onClick={handleCopyMarkdown}
        title="Copy as Markdown for your GitHub README"
        className="text-xs bg-panel border border-border rounded-lg px-3 py-1.5 hover:border-accent transition text-gray-300 shrink-0"
      >
        {mdCopied ? '✅ Copied!' : mdFailed ? '⚠️ Copy failed' : '📄 Copy as Markdown'}
      </button>
    </div>
  );
}
