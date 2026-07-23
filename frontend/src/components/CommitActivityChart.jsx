import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i}`);
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function barOptions(xLabel) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        title: { display: true, text: xLabel, color: '#8b949e', font: { size: 10 } },
        ticks: { color: '#8b949e', font: { size: 9 }, maxRotation: 0 },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#8b949e', precision: 0, font: { size: 9 } },
        grid: { color: '#30363d' }
      }
    }
  };
}

export default function CommitActivityChart({ commitTimes }) {
  if (!commitTimes || commitTimes.totalSampledPushes === 0) {
    return (
      <div className="card">
        <h3 className="font-semibold mb-2">⏱️ Commit Rhythm</h3>
        <p className="text-gray-500 text-sm">Not enough sampled push activity to chart a rhythm yet.</p>
      </div>
    );
  }

  const { hourBuckets, dayBuckets, nightOwlRatio, earlyBirdRatio, weekendRatio } = commitTimes;

  const hourData = {
    labels: HOUR_LABELS,
    datasets: [{ data: hourBuckets, backgroundColor: '#58a6ff', borderRadius: 2, barThickness: 6 }]
  };
  const dayData = {
    labels: DAY_LABELS,
    datasets: [{ data: dayBuckets, backgroundColor: '#3fb950', borderRadius: 4 }]
  };

  return (
    <div className="card">
      <h3 className="font-semibold mb-1">⏱️ Commit Rhythm</h3>
      <p className="text-gray-500 text-xs mb-4">
        Based on sampled recent push events · {nightOwlRatio}% night owl · {earlyBirdRatio}% early bird ·{' '}
        {weekendRatio}% weekend
      </p>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="text-xs text-gray-400 mb-2">By hour of day (UTC)</div>
          <div style={{ height: 140 }}>
            <Bar data={hourData} options={barOptions('hour')} />
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-2">By day of week</div>
          <div style={{ height: 140 }}>
            <Bar data={dayData} options={barOptions('day')} />
          </div>
        </div>
      </div>
    </div>
  );
}
