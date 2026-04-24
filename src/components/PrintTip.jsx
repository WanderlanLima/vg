import { AlertCircle } from 'lucide-react'

export default function PrintTip() {
  return (
    <section className="glass-card p-5 border-l-4 border-l-amber-500/60 animate-fade-in" id="print-tip">
      <div className="flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-amber-200">Dica Importante para Impressão</h3>
          <p className="text-sm text-surface-300 mt-1 leading-relaxed">
            Ao imprimir o PDF gerado, certifique-se de configurar a escala da impressora como{' '}
            <strong className="text-white">"Tamanho Real" (100%)</strong> e{' '}
            <strong className="text-red-300">não</strong> "Ajustar à página".
            Essa é a principal causa de proxies que saem menores ou maiores do que deveriam.
          </p>
        </div>
      </div>
    </section>
  )
}
