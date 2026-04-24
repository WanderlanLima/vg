import { useState } from 'react'
import { FileDown, Printer, Settings2 } from 'lucide-react'
import { jsPDF } from 'jspdf'

// PDF constants (all in mm)
const A4_W = 210
const A4_H = 297
const CARD_W = 62
const CARD_H = 88
const MARGIN = 10
const COLS = 3
const ROWS = 3
const CARDS_PER_PAGE = COLS * ROWS
const BORDER = 0.1

// Margins will be calculated dynamically based on spacing

function loadImageAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 1, height: 1 })
    img.src = dataUrl
  })
}

async function prepareImageForPdf(dataUrl, srcW, srcH, isRotated = false, brighten = false) {
  let finalDataUrl = dataUrl
  let finalW = srcW
  let finalH = srcH

  // Se a carta foi marcada para rotacionar, giramos a imagem original em 90 graus
  if (isRotated) {
    const img = new Image()
    await new Promise(r => {
      img.onload = () => {
        const rotCanvas = document.createElement('canvas')
        rotCanvas.width = srcH
        rotCanvas.height = srcW
        const rotCtx = rotCanvas.getContext('2d')
        rotCtx.translate(srcH / 2, srcW / 2)
        rotCtx.rotate(90 * Math.PI / 180)
        rotCtx.drawImage(img, -srcW / 2, -srcH / 2)
        finalDataUrl = rotCanvas.toDataURL('image/jpeg', 1.0)
        finalW = srcH
        finalH = srcW
        r()
      }
      img.onerror = r
      img.src = dataUrl
    })
  }

  // Maximum output resolution to prevent memory crashes (e.g. 600 DPI max)
  const MAX_W = Math.round((CARD_W / 25.4) * 600) // ~1464px
  const MAX_H = Math.round((CARD_H / 25.4) * 600) // ~2078px

  // Don't upscale. Only downscale se a imagem original for maior que o equivalente a 600 DPI.
  let outW = finalW
  let outH = finalH

  if (outW > MAX_W || outH > MAX_H) {
    const scale = Math.min(MAX_W / outW, MAX_H / outH)
    outW = Math.round(outW * scale)
    outH = Math.round(outH * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH

  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  const img = new Image()

  return new Promise((resolve) => {
    img.onload = () => {
      // Clear canvas with white background in case of transparency
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, outW, outH)
      
      if (brighten) {
        // Increase brightness for dark prints (common issue with proxies)
        ctx.filter = 'brightness(1.20) contrast(1.05) saturate(1.05)'
      }
      
      // Desenha a imagem INTEIRA no canvas (sem crop).
      // O jsPDF irá redimensionar/esticar (stretch) a imagem para caber exatamente em 62x88mm.
      // Isso evita o efeito de "zoom" ou "recorte" nas bordas da carta.
      ctx.drawImage(img, 0, 0, finalW, finalH, 0, 0, outW, outH)
      ctx.filter = 'none'
      
      // Use MAXIMUM quality JPEG (1.0) to preserve absolute maximum detail for high-def printing
      resolve(canvas.toDataURL('image/jpeg', 1.0))
    }
    img.onerror = () => resolve(finalDataUrl)
    img.src = finalDataUrl
  })
}

export default function PdfGenerator({ deck, progress, setProgress }) {
  const [options, setOptions] = useState({
    spacing: false,
    cropMarks: true,
    borders: true,
    instructions: false,
    silhouetteMarks: false,
    brighten: false
  })

  const totalCards = deck.reduce((s, c) => s + c.quantity, 0)
  const totalPages = Math.ceil(totalCards / CARDS_PER_PAGE)

  const generatePdf = async () => {
    setProgress({ active: true, percent: 0, message: 'Preparando imagens...' })

    try {
      // Expand deck into individual card entries
      const allCards = []
      for (const card of deck) {
        for (let i = 0; i < card.quantity; i++) {
          allCards.push(card)
        }
      }

      // Pre-load and crop all unique images
      const imageCache = new Map()
      const cardsWithImages = deck.filter(c => c.imageUrl || c.imageBlob)

      for (let i = 0; i < cardsWithImages.length; i++) {
        const card = cardsWithImages[i]
        if (!imageCache.has(card.id)) {
          setProgress({
            active: true,
            percent: (i / cardsWithImages.length) * 40,
            message: `Processando imagem ${i + 1}/${cardsWithImages.length}...`,
          })

          try {
            let dataUrl;
            if (card.imageBlob) {
              dataUrl = await loadImageAsDataUrl(card.imageBlob)
            } else if (card.imageUrl) {
              // Se a imagem é remota (auto-fetch), precisamos baixar como blob e converter
              // para base64 para evitar erros de Canvas Tainted (SecurityError) no PDF
              try {
                const res = await fetch(card.imageUrl)
                if (!res.ok) throw new Error('Network response was not ok')
                const blob = await res.blob()
                dataUrl = await loadImageAsDataUrl(blob)
              } catch (e) {
                // Fallback principal para proxy otimizado para imagens (wsrv.nl)
                try {
                  const proxyUrl = 'https://wsrv.nl/?url=' + encodeURIComponent(card.imageUrl)
                  const res = await fetch(proxyUrl)
                  if (!res.ok) throw new Error('Proxy fallback failed')
                  const blob = await res.blob()
                  dataUrl = await loadImageAsDataUrl(blob)
                } catch (e2) {
                  // Segundo fallback genérico
                  const proxyUrl2 = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(card.imageUrl)
                  const res = await fetch(proxyUrl2)
                  const blob = await res.blob()
                  dataUrl = await loadImageAsDataUrl(blob)
                }
              }
            }

            if (dataUrl) {
              const dims = await getImageDimensions(dataUrl)
              const processedUrl = await prepareImageForPdf(dataUrl, dims.width, dims.height, card.rotated, options.brighten)
              imageCache.set(card.id, processedUrl)
            }
          } catch (e) {
            console.error('Falha ao processar imagem para carta:', card.name, e)
          }
        }
      }

      setProgress({ active: true, percent: 45, message: 'Criando documento PDF...' })

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      if (options.instructions) {
        doc.setFontSize(22)
        doc.setTextColor(30, 41, 59)
        doc.text("INSTRUÇÕES DE IMPRESSÃO (GRÁFICA)", 105, 40, { align: 'center' })
        
        doc.setFontSize(14)
        doc.setTextColor(220, 38, 38) // Vermelho de alerta
        doc.text("IMPORTANTE: NÃO USE 'AJUSTAR À PÁGINA'", 105, 60, { align: 'center' })

        doc.setFontSize(12)
        doc.setTextColor(71, 85, 105)
        
        const instructionsText = [
          "Este arquivo foi gerado milimetricamente para ter as cartas no tamanho exato.",
          "Para garantir que o tamanho final fique correto (62x88mm), siga as regras:",
          "",
          "1. ESCALA: Imprima sempre em 'Tamanho Real' (Actual Size) ou 'Escala: 100%'.",
          "   Nunca reduza ou ajuste à página, senão as cartas ficarão menores que os sleeves.",
          "",
          "2. FORMATO DO PAPEL: A4 (210 x 297 mm).",
          "",
          "3. PAPEL RECOMENDADO: Couchê Fosco ou Brilho (250g a 300g).",
          "",
          "4. CORTE: " + (options.cropMarks ? "O arquivo possui guias (cruzes) nos cantos para alinhamento do corte." : "Corte nas linhas pretas sólidas ao redor das cartas.")
        ]
        
        doc.text(instructionsText, 20, 85)
        
        doc.setTextColor(0, 0, 0) // Reset color
        doc.addPage() // Pula para a próxima página para começar as cartas
      }

      let cardsOnPage = 0
      
      const GAP = options.spacing ? 2.5 : 0 // 2.5mm de espaçamento
      const GRID_W = COLS * CARD_W + (COLS - 1) * GAP
      const GRID_H = ROWS * CARD_H + (ROWS - 1) * GAP
      const START_X = (A4_W - GRID_W) / 2
      const START_Y = (A4_H - GRID_H) / 2

      for (let i = 0; i < allCards.length; i++) {
        // Progress update
        const pdfPercent = 45 + ((i / allCards.length) * 50)
        setProgress({
          active: true,
          percent: pdfPercent,
          message: `Renderizando carta ${i + 1}/${allCards.length}...`,
        })

        // Add new page if current is full
        if (cardsOnPage === CARDS_PER_PAGE) {
          doc.addPage()
          cardsOnPage = 0
        }

        // Desenhar marcas de registro para plotter na folha atual (se for o primeiro card da folha)
        if (cardsOnPage === 0 && options.silhouetteMarks) {
          doc.setFillColor(0, 0, 0)
          const sm = 10 // margem da silhouette
          const slen = 20 // comprimento do L
          const sthick = 0.5 // espessura da linha
          
          // Top-Left (Quadrado 5x5)
          doc.rect(sm, sm, 5, 5, 'F')
          
          // Top-Right (L invertido)
          doc.rect(A4_W - sm - slen, sm, slen, sthick, 'F') // horizontal
          doc.rect(A4_W - sm - sthick, sm, sthick, slen, 'F') // vertical
          
          // Bottom-Left (L normal)
          doc.rect(sm, A4_H - sm - sthick, slen, sthick, 'F') // horizontal
          doc.rect(sm, A4_H - sm - slen, sthick, slen, 'F') // vertical
        }

        const col = cardsOnPage % COLS
        const row = Math.floor(cardsOnPage / COLS)
        const x = START_X + col * (CARD_W + GAP)
        const y = START_Y + row * (CARD_H + GAP)

        const card = allCards[i]
        const imgData = imageCache.get(card.id)

        if (imgData) {
          doc.addImage(imgData, 'JPEG', x, y, CARD_W, CARD_H)
        } else {
          // Empty card placeholder
          doc.setFillColor(240, 240, 240)
          doc.rect(x, y, CARD_W, CARD_H, 'F')
          doc.setFontSize(8)
          doc.setTextColor(120, 120, 120)
          const nameLines = doc.splitTextToSize(card.name, CARD_W - 8)
          doc.text(nameLines, x + CARD_W / 2, y + CARD_H / 2, { align: 'center' })
        }

        // Black border for cutting guides
        if (options.borders) {
          doc.setDrawColor(0, 0, 0)
          doc.setLineWidth(BORDER)
          doc.rect(x, y, CARD_W, CARD_H)
        }

        // Crop Marks (Guias de corte externas)
        if (options.cropMarks) {
          doc.setDrawColor(0, 0, 0)
          doc.setLineWidth(0.2)
          const m = 3 // comprimento da linha
          const d = 1 // distância da carta
          // Top Left
          doc.line(x - d, y, x - d - m, y)
          doc.line(x, y - d, x, y - d - m)
          // Top Right
          doc.line(x + CARD_W + d, y, x + CARD_W + d + m, y)
          doc.line(x + CARD_W, y - d, x + CARD_W, y - d - m)
          // Bottom Left
          doc.line(x - d, y + CARD_H, x - d - m, y + CARD_H)
          doc.line(x, y + CARD_H + d, x, y + CARD_H + d + m)
          // Bottom Right
          doc.line(x + CARD_W + d, y + CARD_H, x + CARD_W + d + m, y + CARD_H)
          doc.line(x + CARD_W, y + CARD_H + d, x + CARD_W, y + CARD_H + d + m)
        }

        cardsOnPage++
      }

      setProgress({ active: true, percent: 98, message: 'Salvando PDF...' })

      // Small delay for UX
      await new Promise(r => setTimeout(r, 300))

      doc.save(`vg-proxy-${Date.now()}.pdf`)

      setProgress({ active: true, percent: 100, message: 'PDF gerado com sucesso!' })
      await new Promise(r => setTimeout(r, 1200))
      setProgress({ active: false, percent: 0, message: '' })

    } catch (err) {
      console.error('PDF generation failed:', err)
      setProgress({ active: false, percent: 0, message: '' })
      alert('Erro ao gerar o PDF. Verifique as imagens e tente novamente.')
    }
  }

  return (
    <section className="glass-card p-6 animate-fade-in" id="pdf-generator">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Printer className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Gerar PDF para Impressão</h2>
            <p className="text-xs text-surface-400">
              {totalCards} carta(s) → {totalPages} página(s) A4 • Grade 3×3 • {CARD_W}×{CARD_H}mm
            </p>
          </div>
        </div>

        <button
          id="generate-pdf-btn"
          onClick={generatePdf}
          disabled={progress.active || deck.length === 0}
          className="btn-primary text-sm"
        >
          <FileDown className="w-4 h-4" />
          Gerar PDF
        </button>
      </div>

      {/* Options Panel */}
      <div className="mt-6 p-5 rounded-2xl bg-surface-900/40 border border-surface-700/50 flex flex-col xl:flex-row gap-5 xl:gap-8 items-start xl:items-center">
        <div className="flex items-center gap-2 text-sm text-white font-bold w-full xl:w-auto">
          <Settings2 className="w-5 h-5 text-vg-400" />
          <span>Configurações</span>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {[
            { id: 'borders', label: 'Bordas Pretas' },
            { id: 'cropMarks', label: 'Guias de Corte' },
            { id: 'spacing', label: 'Espaçamento (2.5mm)' },
            { id: 'instructions', label: 'Folha de Instruções' },
            { id: 'silhouetteMarks', label: 'Marcas Silhouette' },
            { id: 'brighten', label: 'Clarear (+Brilho)' }
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setOptions(p => ({ ...p, [opt.id]: !p[opt.id] }))}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                options[opt.id]
                  ? 'bg-vg-500/10 border-vg-500/50 text-vg-300 shadow-[0_0_10px_rgba(92,124,250,0.1)]'
                  : 'bg-surface-800/50 border-surface-700 hover:border-surface-600 text-surface-400 hover:text-surface-300'
              }`}
            >
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${options[opt.id] ? 'bg-vg-400 shadow-[0_0_5px_rgba(92,124,250,0.8)]' : 'bg-surface-600'}`} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Warning/Tip for horizontal cards */}
      <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-blue-400/5 border border-blue-500/20 rounded-2xl flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-blue-200 leading-relaxed">
          <strong className="text-blue-300 font-bold">Dica:</strong> Se houver alguma carta na horizontal, use o botão <strong className="text-white bg-surface-800 px-1.5 py-0.5 rounded text-xs">Girar</strong> nela antes de gerar o PDF.
        </p>
      </div>

      {/* Specs preview */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Formato', value: 'A4' },
          { label: 'Carta', value: `${CARD_W}×${CARD_H}mm` },
          { label: 'Grade', value: '3 × 3' },
          { label: 'Espaçamento', value: options.spacing ? '2.5mm' : 'Nenhum' },
        ].map(spec => (
          <div key={spec.label} className="bg-surface-900/50 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] text-surface-500 font-medium uppercase tracking-wider">{spec.label}</p>
            <p className="text-sm font-bold text-white mt-0.5">{spec.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
