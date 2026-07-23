import { useState } from 'react';

// Fetches the avatar and converts it to a data URL so jsPDF can embed it.
// Degrades gracefully (skips the image) if the fetch fails for any reason —
// a missing avatar shouldn't block the whole export.
async function toDataUrl(url) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function ExportPDFButton({ data, summary }) {
  const [status, setStatus] = useState('idle'); // idle | working | done | error

  async function handleExport() {
    if (!data) return;
    setStatus('working');
    try {
      const { jsPDF } = await import('jspdf');
      const { profile, stats, badges, languages, topRepos } = data;

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 48;
      let y = 56;

      const accent = [88, 166, 255];
      const gray = [110, 118, 129];
      const ink = [20, 24, 30];

      // Header band
      doc.setFillColor(13, 17, 23);
      doc.rect(0, 0, pageWidth, 110, 'F');

      const avatarData = await toDataUrl(profile.avatarUrl);
      if (avatarData) {
        try {
          doc.addImage(avatarData, 'JPEG', margin, 25, 60, 60);
        } catch {
          /* unsupported image format — skip silently */
        }
      }

      const textX = avatarData ? margin + 75 : margin;
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(profile.name || profile.login, textX, 55);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...accent.map((c) => Math.min(255, c + 40)));
      doc.text(`@${profile.login}`, textX, 72);
      doc.setTextColor(180, 190, 200);
      doc.setFontSize(9);
      doc.text(`${profile.followers} followers · ${stats.totalRepos} repos · ${stats.totalStars} stars`, textX, 88);

      y = 140;
      doc.setTextColor(...ink);

      if (profile.bio) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(profile.bio, pageWidth - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * 13 + 10;
      }

      function sectionTitle(label) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...accent);
        doc.text(label, margin, y);
        doc.setDrawColor(...accent);
        doc.setLineWidth(1);
        doc.line(margin, y + 4, pageWidth - margin, y + 4);
        y += 20;
        doc.setTextColor(...ink);
      }

      // Snapshot stats
      sectionTitle('Snapshot');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const snapshot = [
        `Open Source Score: ${stats.openSourceScore}/100`,
        `Documentation Grade: ${stats.documentationGrade}`,
        `Bug Fix Ratio: ${stats.bugFixRatio != null ? stats.bugFixRatio + '%' : 'n/a'}`,
        `Total Forks: ${stats.totalForks}`
      ];
      snapshot.forEach((line) => {
        doc.text(`- ${line}`, margin, y);  // Changed bullet from • to -
        y += 15;
      });
      y += 8;

      // Badges
      if (badges?.length) {
        sectionTitle('Coding Personality');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        // Changed to remove emoji/icons - using bullet point instead
        const badgeText = badges.map((b) => `• ${b.name}`).join('   ');
        const lines = doc.splitTextToSize(badgeText, pageWidth - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * 16 + 8;
      }

      // Languages
      if (languages?.length) {
        sectionTitle('Top Languages');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        languages.slice(0, 6).forEach((l) => {
          doc.text(`${l.language}`, margin, y);
          doc.setTextColor(...gray);
          doc.text(`${l.percentage}%`, pageWidth - margin - 40, y);
          doc.setTextColor(...ink);
          y += 15;
        });
        y += 8;
      }

      // AI summary
      if (summary) {
        if (y > 650) {
          doc.addPage();
          y = 56;
        }
        sectionTitle('AI Summary');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(summary, pageWidth - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * 13 + 8;
      }

      // Top repos
      if (topRepos?.length) {
        if (y > 620) {
          doc.addPage();
          y = 56;
        }
        sectionTitle('Top Repositories');
        doc.setFontSize(10);
        topRepos.slice(0, 6).forEach((r) => {
          if (y > 760) {
            doc.addPage();
            y = 56;
          }
          doc.setFont('helvetica', 'bold');
          doc.text(r.name, margin, y);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...gray);
          // Changed to remove emoji/icons and use plain text
          doc.text(`Stars: ${r.stars} | Forks: ${r.forks} | ${r.language || '-'}`, pageWidth - margin - 180, y);
          doc.setTextColor(...ink);
          y += 14;
          if (r.description) {
            const lines = doc.splitTextToSize(r.description, pageWidth - margin * 2);
            doc.setFontSize(9);
            doc.setTextColor(...gray);
            doc.text(lines, margin, y);
            doc.setTextColor(...ink);
            doc.setFontSize(10);
            y += lines.length * 12 + 8;
          } else {
            y += 8;
          }
        });
      }

      doc.setFontSize(8);
      doc.setTextColor(...gray);
      doc.text('Generated with GitHub Personality Analyzer', margin, doc.internal.pageSize.getHeight() - 24);

      doc.save(`${profile.login}-github-resume.pdf`);
      setStatus('done');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={status === 'working'}
      className="text-xs bg-panel border border-border rounded-lg px-3 py-1.5 hover:border-accent transition text-gray-300 shrink-0 disabled:opacity-50"
    >
      {status === 'working' && '⏳ Building PDF…'}
      {status === 'done' && '✅ Saved!'}
      {status === 'error' && '⚠️ Export failed'}
      {status === 'idle' && '📄 Export as PDF (resume)'}
    </button>
  );
}
