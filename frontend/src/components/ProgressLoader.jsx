import { useEffect, useRef, useState } from 'react';

const DEFAULT_STEPS = [
  'Connecting to GitHub…',
  'Extracting data from repositories…',
  'Crunching commit history…',
  'Scoring open source activity…',
  'Generating personality traits…',
  'Wrapping things up…'
];

// Fake-but-honest progress bar: we don't get real progress events from the
// backend, so it climbs quickly then holds near 92% until the request
// actually resolves, then snaps to 100% and fades out.
export default function ProgressLoader({ active, steps = DEFAULT_STEPS, label = 'Working on it…' }) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const progressTimer = useRef(null);
  const stepTimer = useRef(null);
  const hideTimer = useRef(null);

  useEffect(() => {
    if (active) {
      clearTimeout(hideTimer.current);
      setVisible(true);
      setProgress(0);
      setStepIndex(0);

      progressTimer.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 92) return p;
          const jump = p < 60 ? 6 : p < 80 ? 3 : 1;
          return Math.min(p + jump, 92);
        });
      }, 220);

      stepTimer.current = setInterval(() => {
        setStepIndex((i) => Math.min(i + 1, steps.length - 1));
      }, 900);
    } else {
      clearInterval(progressTimer.current);
      clearInterval(stepTimer.current);
      setVisible((wasVisible) => {
        if (wasVisible) {
          setProgress(100);
          setStepIndex(steps.length - 1);
          hideTimer.current = setTimeout(() => setVisible(false), 500);
        }
        return wasVisible;
      });
    }

    return () => {
      clearInterval(progressTimer.current);
      clearInterval(stepTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  if (!visible) return null;

  return (
    <div className="card fade-in-up">
      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
        <span>{label}</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full h-2 bg-border/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-200 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">{steps[stepIndex]}</p>
    </div>
  );
}
