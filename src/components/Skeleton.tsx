export function Skeleton() {
  const widths = ['w-3/4', 'w-1/2', 'w-5/6', 'w-2/3', 'w-1/3', 'w-4/5'];
  return (
    <div className="flex-1 p-4 space-y-2.5 animate-pulse">
      {widths.map((w, i) => (
        <div key={i} className={`h-3 rounded bg-[#161b22] ${w}`} />
      ))}
    </div>
  );
}
