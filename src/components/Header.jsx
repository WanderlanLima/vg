import { Sword, Layers } from 'lucide-react'

export default function Header({ totalCards, deckSize }) {
  return (
    <header className="relative z-10 border-b border-surface-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-vg-500 to-vg-700 flex items-center justify-center shadow-lg shadow-vg-500/20">
              <Sword className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-vg-300 to-vg-500 bg-clip-text text-transparent">
                  VG Proxy
                </span>
                <span className="text-surface-400 font-medium ml-1.5 text-sm hidden sm:inline">
                  Printer
                </span>
              </h1>
              <p className="text-[10px] text-surface-500 font-medium tracking-wider uppercase hidden sm:block">
                Cardfight!! Vanguard
              </p>
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
