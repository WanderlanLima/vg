import { useState, useCallback } from 'react'
import Header from './components/Header'
import DeckImporter from './components/DeckImporter'
import CardList from './components/CardList'
import PdfGenerator from './components/PdfGenerator'
import PrintTip from './components/PrintTip'
import Footer from './components/Footer'

function App() {
  const [deck, setDeck] = useState([])
  const [pdfProgress, setPdfProgress] = useState({ active: false, percent: 0, message: '' })

  const addCard = useCallback((card) => {
    setDeck(prev => [...prev, {
      id: crypto.randomUUID(),
      name: card.name || 'Carta sem nome',
      quantity: card.quantity || 1,
      imageUrl: card.imageUrl || null,
      imageBlob: card.imageBlob || null,
    }])
  }, [])

  const addMultipleCards = useCallback((cards) => {
    setDeck(prev => [
      ...prev,
      ...cards.map(c => ({
        id: crypto.randomUUID(),
        name: c.name || 'Carta sem nome',
        quantity: c.quantity || 1,
        imageUrl: c.imageUrl || null,
        imageBlob: c.imageBlob || null,
      }))
    ])
  }, [])

  const updateCard = useCallback((id, updates) => {
    setDeck(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [])

  const removeCard = useCallback((id) => {
    setDeck(prev => {
      const card = prev.find(c => c.id === id)
      if (card?.imageUrl) URL.revokeObjectURL(card.imageUrl)
      return prev.filter(c => c.id !== id)
    })
  }, [])

  const clearDeck = useCallback(() => {
    deck.forEach(c => { if (c.imageUrl) URL.revokeObjectURL(c.imageUrl) })
    setDeck([])
  }, [deck])

  const totalCards = deck.reduce((sum, c) => sum + c.quantity, 0)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-vg-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-vg-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-vg-700/6 rounded-full blur-3xl" />
      </div>

      <Header totalCards={totalCards} deckSize={deck.length} />

      <main className="flex-1 relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <DeckImporter
          onImport={addMultipleCards}
          onAddManual={addCard}
        />

        {deck.length > 0 && (
          <>
            <CardList
              deck={deck}
              onUpdate={updateCard}
              onRemove={removeCard}
              onClear={clearDeck}
            />

            <PdfGenerator
              deck={deck}
              progress={pdfProgress}
              setProgress={setPdfProgress}
            />
          </>
        )}

        <PrintTip />
      </main>

      <Footer />

      {/* PDF Progress Overlay */}
      {pdfProgress.active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-8 max-w-md w-full mx-4 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-vg-500 to-vg-700 flex items-center justify-center animate-pulse-glow">
              <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Gerando PDF...</h3>
              <p className="text-sm text-surface-400 mt-1">{pdfProgress.message}</p>
            </div>
            <div className="w-full bg-surface-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-vg-600 to-vg-400 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${pdfProgress.percent}%` }}
              />
            </div>
            <p className="text-sm font-semibold text-vg-300">{Math.round(pdfProgress.percent)}%</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
