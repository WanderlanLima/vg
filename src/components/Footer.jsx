export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-surface-800/80 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-surface-500">
          <p>
            VG Proxy Printer — Ferramenta gratuita e{' '}
            <span className="text-surface-400">100% client-side</span>.
          </p>
          <p>
            Cardfight!! Vanguard é marca registrada da{' '}
            <span className="text-surface-400">Bushiroad Inc.</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
