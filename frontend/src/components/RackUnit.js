export default function RackUnit({ label, slot, highlight, children }) {
  return (
    <div
      className={`
        relative bg-gradient-to-b from-[#1A1B20] to-[#0A0B10]
        border-t border-b border-white/10 p-3
        ${highlight ? 'border-l-4 border-l-hot' : 'border-l-2 border-l-transparent'}
        cooling-vents
      `}
      data-testid={`rack-unit-${slot}`}
    >
      {/* Screws */}
      <div className="rack-screw top-2 left-1.5" />
      <div className="rack-screw top-2 right-1.5" />
      <div className="rack-screw bottom-2 left-1.5" />
      <div className="rack-screw bottom-2 right-1.5" />

      {/* Label */}
      <div className="flex items-center justify-between mb-2 pl-4">
        <span className="font-chakra text-[9px] uppercase tracking-[0.2em] text-slate-500">{label}</span>
        <span className="font-mono text-[8px] text-slate-700">{slot}</span>
      </div>

      {/* Content */}
      <div className="pl-4 pr-4">
        {children}
      </div>
    </div>
  );
}
