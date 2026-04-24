import { Layers, Sparkles } from 'lucide-react'

export default function Header({ totalCards, deckSize }) {
  return (
    <header className="sticky top-0 z-50 bg-surface-950/60 backdrop-blur-2xl border-b border-surface-800/50 shadow-lg shadow-cyan-900/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo Vanguard Style */}
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 group cursor-default">
              <div className="absolute inset-0 bg-cyan-500 rounded-lg blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500 animate-pulse-glow" />
              <div className="relative w-full h-full bg-gradient-to-br from-cyan-400 via-vg-500 to-indigo-700 rounded-lg transform rotate-45 border border-white/30 shadow-[0_0_15px_rgba(34,211,238,0.4)] flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:rotate-[225deg]">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </div>
              <div className="absolute font-black text-2xl sm:text-3xl italic text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pr-1 tracking-tighter select-none z-10" style={{ fontFamily: 'Impact, sans-serif' }}>
                V
              </div>
            </div>
            
            <div className="flex flex-col justify-center">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight italic flex items-center">
                <span className="bg-gradient-to-r from-cyan-300 via-blue-100 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                  VG Proxy
                </span>
                <span className="text-cyan-500/80 font-bold text-xs sm:text-sm uppercase tracking-widest hidden sm:inline transform -skew-x-12 ml-3">
                  Printer
                </span>
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                <p className="text-[9px] sm:text-[10px] text-cyan-300/80 font-bold tracking-[0.2em] uppercase hidden sm:block">
                  Cardfight!! Vanguard
                </p>
                <div className="hidden sm:block h-[1px] w-12 bg-gradient-to-r from-cyan-400/50 to-transparent ml-2" />
              </div>
            </div>
          </div>

          {/* Stats */}
          {deckSize > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-vg-400" />
                <span className="text-surface-400">
                  <span className="text-white font-bold">{deckSize}</span> carta{deckSize !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="badge">
                {totalCards} cópia{totalCards !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
