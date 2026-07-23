import { useState } from 'react';

// html2canvas ships its own lightweight CSS color parser, which doesn't
// reliably understand the `rgb(var(--x) / <alpha>)` syntax Tailwind uses for
// our theme colors — it can silently fall back to a duller default fill,
// which is why exports were coming out dim. We sidestep that by copying each
// element's browser-resolved (already plain rgb/rgba) computed color values
// onto the clone before html2canvas ever has to parse anything itself.
function flattenComputedColors(sourceRoot, cloneRoot) {
  const props = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'];
  const sourceEls = [sourceRoot, ...sourceRoot.querySelectorAll('*')];
  const cloneEls = [cloneRoot, ...cloneRoot.querySelectorAll('*')];

  sourceEls.forEach((sourceEl, i) => {
    const cloneEl = cloneEls[i];
    if (!cloneEl || !cloneEl.style) return;
    const computed = window.getComputedStyle(sourceEl);
    props.forEach((prop) => {
      const value = computed.getPropertyValue(prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`));
      if (value) cloneEl.style[prop] = value;
    });
  });
}

export default function ExportImageButton({ targetRef, filename }) {
  const [status, setStatus] = useState('idle'); // idle | working | done | error

  async function handleExport() {
    if (!targetRef?.current) return;
    setStatus('working');
    try {
      const { default: html2canvas } = await import('html2canvas');
      const resolvedBackground = window.getComputedStyle(document.body).backgroundColor;
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: resolvedBackground,
        // Never drop below 2x — capping this at the screen's own (often 1x)
        // devicePixelRatio was the main cause of blurry exports on standard
        // (non-retina) displays. Cap the top end so file size stays sane on
        // very high-DPI phones.
        scale: Math.min(3, Math.max(2, window.devicePixelRatio || 1)),
        useCORS: true,
        logging: false,
        onclone: (clonedDoc, clonedEl) => {
          flattenComputedColors(targetRef.current, clonedEl);
        }
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
