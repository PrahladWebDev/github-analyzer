import { useState } from 'react';

export default function ExportImageButton({ targetRef, filename }) {
  const [status, setStatus] = useState('idle'); // idle | working | done | error

  async function handleExport() {
    if (!targetRef?.current) return;
    setStatus('working');
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: getComputedStyle(document.body).backgroundColor,
        scale: Math.min(2, window.devicePixelRatio || 1),
        useCORS: true
      });
      canvas.toBlob((blob) => {
        if (!blob) {
          setStatus('error');
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename || 'github-personality-report'}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setStatus('done');
        setTimeout(() => setStatus('idle'), 2000);
      }, 'image/png');
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
      {status === 'working' && '⏳ Exporting…'}
      {status === 'done' && '✅ Saved!'}
      {status === 'error' && '⚠️ Export failed'}
      {status === 'idle' && '🖼️ Export as image'}
    </button>
  );
}
