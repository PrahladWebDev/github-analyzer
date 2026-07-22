import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

const gradeToScore = { A: 100, B: 80, C: 60, D: 40, F: 20 };

export default function PersonalityRadar({ stats, commitTimes }) {
  const metrics = [
    { label: 'Open Source', value: Math.min(100, stats.openSourceScore) },
    { label: 'Documentation', value: gradeToScore[stats.documentationGrade] ?? 20 },
    { label: 'Night Owl', value: commitTimes?.nightOwlRatio ?? 0 },
    { label: 'Early Bird', value: commitTimes?.earlyBirdRatio ?? 0 },
    { label: 'Weekend Warrior', value: commitTimes?.weekendRatio ?? 0 },
    { label: 'Bug Hunting', value: Math.min(100, stats.bugFixRatio ?? 0) }
  ];

  const data = {
    labels: metrics.map((m) => m.label),
    datasets: [
      {
        data: metrics.map((m) => m.value),
        backgroundColor: 'rgba(88, 166, 255, 0.18)',
        borderColor: '#58a6ff',
        pointBackgroundColor: '#3fb950',
        pointBorderColor: '#0d1117',
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        min: 0,
        max: 100,
        angleLines: { color: '#30363d' },
        grid: { color: '#30363d' },
        pointLabels: { color: '#c9d1d9', font: { size: 11 } },
        ticks: { display: false, stepSize: 25 }
      }
    }
  };

  return (
    <div className="card">
      <h3 className="font-semibold mb-3">🧭 Personality Radar</h3>
      <div style={{ height: 260 }}>
        <Radar data={data} options={options} />
      </div>
    </div>
  );
}
