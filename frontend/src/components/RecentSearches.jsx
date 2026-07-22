import { useEffect, useState } from 'react';

const STORAGE_KEY = 'gpa:recent-searches';
const MAX_ITEMS = 8;

export function addRecentSearch(username) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const next = [username, ...existing.filter((u) => u.toLowerCase() !== username.toLowerCase())].slice(
      0,
      MAX_ITEMS
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export default function RecentSearches({ onSelect, refreshKey }) {
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
    } catch {
      setRecent([]);
    }
  }, [refreshKey]);

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    setRecent([]);
  }

  if (recent.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 -mt-2">
      <span className="text-xs text-gray-500">Recent:</span>
      {recent.map((u) => (
        <button
          key={u}
          onClick={() => onSelect(u)}
          className="text-xs bg-panel border border-border rounded-full px-2.5 py-1 hover:border-accent transition text-gray-300"
        >
          @{u}
        </button>
      ))}
      <button onClick={clearAll} className="text-xs text-gray-600 hover:text-gray-400 transition ml-1">
        clear
      </button>
    </div>
  );
}
