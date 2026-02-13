import { Radio } from 'lucide-react';

export default function HeaderStatic() {
  return (
    <header className="h-14 bg-panel border-b border-white/5 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
          <Radio className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <h1 className="font-chakra text-sm font-bold tracking-wider">
            <span className="text-white">KEY</span>
            <span className="text-cyan-400">DOWN</span>
          </h1>
          <p className="font-mono text-[8px] text-slate-600 tracking-wider">RF VISUALIZER v1.0</p>
        </div>
      </div>
      <div className="font-mono text-[10px] text-slate-600">
        sma-antenna.org
      </div>
    </header>
  );
}
