import { useState, useRef } from 'react'
import { Download, Plus, Search, AlertCircle, CheckCircle2, ImagePlus, ExternalLink } from 'lucide-react'

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
]

export default function DeckImporter({ onImport, onAddManual }) {
  const [deckCode, setDeckCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: null, message: '' })

  const handleImport = async () => {
    let rawCode = deckCode.trim()
    if (!rawCode) {
      setStatus({ type: 'error', message: 'Digite um código ou cole a lista em texto.' })
      return
    }

    // Verifica se o usuário colou uma lista de texto (várias linhas ou padrão "4x Carta")
    if (rawCode.includes('\n') || /^\d+[xX]\s/m.test(rawCode)) {
      setLoading(true)
      const lines = rawCode.split('\n')
      const parsedCards = new Map()
      
      lines.forEach(line => {
        const text = line.trim()
        if (!text) return
        
        // Match "4x Card Name" or "4 Card Name"
        const match = text.match(/^(\d+)[xX]?\s+(.+)$/)
        let name = text
        let quantity = 1
        
        if (match) {
          quantity = parseInt(match[1])
          name = match[2].trim()
        }

        if (parsedCards.has(name)) {
          parsedCards.get(name).quantity += quantity
        } else {
          parsedCards.set(name, { name, quantity, imageUrl: null, imageBlob: null })
        }
      })

      const cards = Array.from(parsedCards.values())
      if (cards.length > 0) {
        onImport(cards)
        setStatus({ type: 'success', message: `${cards.length} carta(s) importada(s) via texto!` })
        setDeckCode('')
      } else {
        setStatus({ type: 'error', message: 'Não foi possível reconhecer o texto.' })
      }
      setLoading(false)
      return
    }

    // Extrai o código caso o usuário cole a URL inteira
    let code = rawCode
    if (rawCode.includes('view/')) {
      code = rawCode.split('view/')[1].split(/[\/?#]/)[0]
    }
    // Remove tudo que não for letra ou número para garantir um código limpo
    code = code.replace(/[^a-zA-Z0-9]/g, '')

    setLoading(true)
    setStatus({ type: null, message: '' })

    let cards = []
    let pageLoaded = false
    let lastError = null

    const apiUrls = [
      `/api/decklog?code=${code}&region=en`,
      `/api/decklog?code=${code}&region=jp`
    ]

    for (const url of apiUrls) {
      if (cards.length > 0) break;
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(15000), // Aumentado para 15s pois a API as vezes é lenta
        })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length === 0) continue; // Array vazio = deck não encontrado nesta região

          const isEnglish = url.includes('region=en');
          const baseUrl = isEnglish 
            ? 'https://en.cf-vanguard.com/wordpress/wp-content/images/cardlist/' 
            : 'https://cf-vanguard.com/wordpress/wp-content/images/cardlist/';

          const getArray = (val) => val ? Object.values(val) : []
          const allCards = [
            ...getArray(data.list),
            ...getArray(data.sub_list), 
            ...getArray(data.p_list),
            ...getArray(data.s_list2),
            ...getArray(data.s_list3)
          ]
          
          const parsedCards = new Map()

          allCards.forEach(item => {
            const cardName = item.name || item.card_name
            const quantity = item.num || item.quantity || item.count || 1
            
            let imgStr = item.img || ''
            if (imgStr.startsWith('/')) imgStr = imgStr.substring(1)
            const imageUrl = imgStr ? (baseUrl + imgStr) : null

            if (cardName) {
              if (parsedCards.has(cardName)) {
                 const existing = parsedCards.get(cardName)
                 existing.quantity += quantity
                 if (!existing.imageUrl && imageUrl) existing.imageUrl = imageUrl
              } else {
                 parsedCards.set(cardName, { name: cardName, quantity, imageUrl, imageBlob: null })
              }
            }
          })

          cards = Array.from(parsedCards.values())
          if (cards.length > 0) pageLoaded = true;
        }
      } catch {
        // Will fail in production if proxy is not configured on the host
      }
    }

    // 2. Second attempt: Fallback to public CORS proxies + HTML parsing
    // (In case the app is deployed statically without a backend proxy)
    if (cards.length === 0) {
      const urlsToTry = [
        `https://decklog-en.bushiroad.com/view/${code}`,
        `https://decklog.bushiroad.com/view/${code}`
      ]

      for (const deckLogUrl of urlsToTry) {
        if (cards.length > 0) break;

        let html = null
        for (const proxy of CORS_PROXIES) {
          try {
            const res = await fetch(proxy + encodeURIComponent(deckLogUrl), {
              signal: AbortSignal.timeout(10000),
            })
            if (res.ok) {
              html = await res.text()
              pageLoaded = true
              break
            }
          } catch {
            continue
          }
        }

        if (!html) continue;

        try {
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, 'text/html')

          // Extract window.DeckLog
          const scripts = doc.querySelectorAll('script')
          for (const script of scripts) {
            const text = script.textContent
            if (text.includes('window.DeckLog')) {
              const match = text.match(/window\.DeckLog\s*=\s*(\{[\s\S]*?\})\s*(?:;|<\/script>|window\.|var\ |const\ |let\ |$)/)
              if (match) {
                try {
                  const data = JSON.parse(match[1])
                  const getArray = (val) => val ? Object.values(val) : []
                  const allCards = [
                    ...getArray(data.list),
                    ...getArray(data.sub_list), 
                    ...getArray(data.p_list),
                    ...getArray(data.s_list2),
                    ...getArray(data.s_list3)
                  ]
                  allCards.forEach(item => {
                    const cardName = item.name || item.card_name
                    if (cardName) {
                      cards.push({
                        name: cardName,
                        quantity: item.num || item.quantity || item.count || 1,
                      })
                    }
                  })
                } catch { /* ignore parse errors */ }
              }
            }
          }

          // Fallbacks for HTML
          if (cards.length === 0) {
            const cardElements = doc.querySelectorAll('.deck-card, .card-list-item, [class*="card"], .deckview-card, .card-item')
            if (cardElements.length > 0) {
              const parsedCards = new Map()

              cardElements.forEach(el => {
                const nameEl = el.querySelector('.card-name, .name, [class*="name"]')
                const imgEl = el.querySelector('img')
                
                // Bushiroad Deck Log often stores names in img title attributes, especially for Ride Deck
                const name = nameEl?.textContent?.trim() || imgEl?.getAttribute('title')?.trim()
                const imageUrl = imgEl?.src || null
                
                const qtyEl = el.querySelector('.card-qty, .qty, .quantity, [class*="qty"], [class*="quantity"]')
                const quantityText = qtyEl?.textContent?.trim()
                // Handle cases where qty is empty (often implies 1, like in Ride Deck)
                const quantity = quantityText ? (parseInt(quantityText.replace(/[^0-9]/g, '')) || 1) : 1
                
                if (name && name.length > 1) {
                  if (parsedCards.has(name)) {
                    const existing = parsedCards.get(name)
                    existing.quantity += quantity
                    if (!existing.imageUrl && imageUrl) existing.imageUrl = imageUrl
                  } else {
                    parsedCards.set(name, { name, quantity, imageUrl, imageBlob: null })
                  }
                }
              })

              for (const [name, cardData] of parsedCards.entries()) {
                cards.push(cardData)
              }
            }
          }
        } catch {
          // ignore
        }
      }
    }

    if (cards.length > 0) {
      onImport(cards)
      setStatus({
        type: 'success',
        message: `${cards.length} carta(s) importada(s) com sucesso!`,
      })
      setDeckCode('')
    } else if (pageLoaded) {
      setStatus({
        type: 'error',
        message: 'A Bushiroad bloqueou a extração automática. Para resolver: Vá ao site Deck Log, clique em "Text View", copie toda a lista em texto e cole direto no campo acima!',
      })
    } else {
      setStatus({
        type: 'error',
        message: 'Não foi possível conectar ao Deck Log.',
      })
    }

    setLoading(false)
  }

  const fileInputRef = useRef(null)

  const handleFileUpload = (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newCards = Array.from(files).map(file => ({
      name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      quantity: 1,
      imageUrl: URL.createObjectURL(file),
      imageBlob: file
    }))

    onImport(newCards)
    setStatus({ type: 'success', message: `${newCards.length} carta(s) adicionada(s) com sucesso!` })
    setTimeout(() => setStatus({ type: null, message: '' }), 3000)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <section className="glass-card relative overflow-hidden animate-fade-in group" id="deck-importer">
      {/* Decorative gradient background inside the card */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-vg-400 via-vg-500 to-vg-600 opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-b from-vg-500/5 to-transparent pointer-events-none" />

      <div className="p-6 sm:p-8 relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-vg-500/10 border border-vg-500/20 flex items-center justify-center mb-4 shadow-lg shadow-vg-500/5">
            <Search className="w-6 h-6 text-vg-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">Importar Deck List</h2>
          <p className="text-sm text-surface-400 max-w-md">
            Cole o código do <span className="text-vg-300 font-semibold">Deck Log da Bushiroad</span> para começar, ou envie as imagens manualmente.
          </p>
        </div>

        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full group/input">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-surface-500 group-focus-within/input:text-vg-400 transition-colors" />
            </div>
            <input
              id="deck-code-input"
              type="text"
              value={deckCode}
              onChange={(e) => setDeckCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleImport()}
              placeholder="Ex: 8AL5 ou cole o deck de texto..."
              className="w-full pl-12 pr-4 py-4 bg-surface-950/50 border-2 border-surface-700/60 rounded-2xl
                         text-white placeholder-surface-500 font-semibold text-lg
                         focus:outline-none focus:border-vg-500/60 focus:ring-4 focus:ring-vg-500/10 focus:bg-surface-900/80
                         transition-all duration-300 shadow-inner"
              disabled={loading}
            />
          </div>
          
          <button
            id="import-btn"
            onClick={handleImport}
            disabled={loading}
            className="w-full sm:w-auto btn-primary py-4 px-8 text-lg rounded-2xl h-[60px]"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Importando...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Importar
              </>
            )}
          </button>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Upload Manual */}
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            id="manual-add-btn"
            onClick={() => fileInputRef.current?.click()}
            className="group flex items-center gap-2 text-sm font-medium text-surface-400 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-surface-800/50 border border-transparent hover:border-surface-700"
            title="Adicionar imagens do seu computador"
          >
            <ImagePlus className="w-4 h-4 text-surface-500 group-hover:text-vg-400 transition-colors" />
            Upload Manual
          </button>

          <div className="hidden sm:block w-px h-4 bg-surface-700/50" />

          {/* Links Externos */}
          <a
            href="https://decklog-en.bushiroad.com/create?c=1"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-sm font-medium text-surface-400 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-surface-800/50 border border-transparent hover:border-surface-700"
            title="Criar um deck no site oficial da Bushiroad"
          >
            <ExternalLink className="w-4 h-4 text-surface-500 group-hover:text-vg-400 transition-colors" />
            Criar no Deck Log
          </a>

          <a
            href="https://vg-paradox.com/subpage/TopDecks"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-sm font-medium text-surface-400 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-surface-800/50 border border-transparent hover:border-surface-700"
            title="Ver os melhores decks do meta atual"
          >
            <ExternalLink className="w-4 h-4 text-surface-500 group-hover:text-vg-400 transition-colors" />
            Ver Top Decks (Paradox)
          </a>
        </div>
      </div>

      {/* Status feedback */}
      {status.type && (
        <div
          className={`mt-4 flex items-center gap-2 text-sm px-4 py-3 rounded-xl animate-fade-in ${
            status.type === 'error'
              ? 'bg-red-500/10 border border-red-500/20 text-red-300'
              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
          }`}
        >
          {status.type === 'error' ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}
    </section>
  )
}
