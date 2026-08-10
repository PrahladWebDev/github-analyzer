export default function TechEvolutionTimeline({ techEvolution }) {
  if (!techEvolution || techEvolution.length < 2) return null;

  return (
    <div className="card overflow-x-auto">
      <h3 className="font-semibold mb-1">📈 Tech Evolution</h3>
      <p className="text-gray-500 text-xs mb-5">
        Dominant language per year, based on when repos were created
      </p>

      <div className="flex items-start min-w-max px-1">
        {techEvolution.map((step, i) => (
          <div key={step.year} className="flex items-start">
            <div className="flex flex-col items-center w-32 text-center">
              <span className="text-xs font-mono text-gray-500">{step.year}</span>
              <div className="w-3 h-3 rounded-full bg-accent my-2 shrink-0" />
              <span className="font-medium text-sm">{step.language}</span>
              <span className="text-[11px] text-gray-400 mt-0.5">{step.category}</span>
              <span className="text-[10px] text-gray-600 mt-1">
                {step.repoCount} repo{step.repoCount === 1 ? '' : 's'}
              </span>
            </div>
            {i < techEvolution.length - 1 && (
              <div className="w-10 h-px bg-border mt-[38px] shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
