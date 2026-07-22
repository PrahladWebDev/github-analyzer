import { useState } from 'react';
import { getAIRoast } from '../api';

export default function AISummary({ username, summary, loadingSummary }) {
  const [roast, setRoast] = useState(null);
  const [loadingRoast, setLoadingRoast] = useState(false);
  const [error, setError] = useState(null);

  async function handleRoast() {
    setLoadingRoast(true);
    setError(null);
    try {
      const text = await getAIRoast(username);
      setRoast(text);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not generate a roast right now.');
    } finally {
      setLoadingRoast(false);
    }
  }

  return (
    <div className="card">
      <h3 className="font-semibold mb-3">🤖 AI Personality Summary</h3>
      {loadingSummary && <p className="text-gray-500 text-sm">Generating summary…</p>}
      {!loadingSummary && summary && (
        <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">{summary}</p>
      )}
      {!loadingSummary && !summary && (
        <p className="text-gray-500 text-sm">Summary unavailable — check the Gemini API key in the backend .env.</p>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <button
          onClick={handleRoast}
          disabled={loadingRoast}
          className="text-sm bg-base border border-border rounded-lg px-3 py-1.5 hover:border-accent transition disabled:opacity-50"
        >
          {loadingRoast ? 'Roasting…' : '🔥 Generate a light-hearted AI roast (optional)'}
        </button>
        {roast && <p className="text-gray-300 text-sm mt-3 italic">"{roast}"</p>}
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
}
