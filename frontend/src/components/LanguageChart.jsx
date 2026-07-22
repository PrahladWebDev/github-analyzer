import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = ['#58a6ff', '#3fb950', '#f778ba', '#e3b341', '#a371f7', '#ff7b72', '#79c0ff', '#56d364'];

export default function LanguageChart({ languages }) {
  if (!languages.length) {
    return (
      <div className="card">
        <h3 className="font-semibold mb-2">📚 Language Breakdown</h3>
        <p className="text-gray-500 text-sm">No language data found for this user's repos.</p>
      </div>
    );
  }

  const top = languages.slice(0, 8);
  const data = {
    labels: top.map((l) => l.language),
    datasets: [
      {
        data: top.map((l) => l.percentage),
        backgroundColor: PALETTE,
        borderColor: '#161b22',
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="card">
      <h3 className="font-semibold mb-3">📚 Language Breakdown</h3>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-48 h-48 shrink-0">
          <Doughnut
            data={data}
            options={{
              plugins: { legend: { display: false } },
              cutout: '60%'
            }}
          />
        </div>
        <ul className="text-sm space-y-1 w-full">
          {top.map((l, i) => (
            <li key={l.language} className="flex justify-between">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                />
                {l.language}
              </span>
              <span className="text-gray-400">{l.percentage}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
