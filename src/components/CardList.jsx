import { useState, useRef, useCallback } from 'react'
import { Trash2, Upload, GripVertical, ImagePlus, Minus, Plus, Edit3, Check, RefreshCw, RotateCw } from 'lucide-react'

function CardItem({ card, onUpdate, onRemove }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(card.name)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (card.imageUrl) URL.revokeObjectURL(card.imageUrl)
    const url = URL.createObjectURL(file)
    onUpdate(card.id, { imageUrl: url, imageBlob: file })
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    if (card.imageUrl) URL.revokeObjectURL(card.imageUrl)
    const url = URL.createObjectURL(file)
    onUpdate(card.id, { imageUrl: url, imageBlob: file })
  }, [card.id, card.imageUrl, onUpdate])

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleQuantityChange = (delta) => {
    const newQty = Math.max(1, Math.min(50, card.quantity + delta))
    onUpdate(card.id, { quantity: newQty })
  }

  const saveName = () => {
    onUpdate(card.id, { name: editName.trim() || 'Carta sem nome' })
    setIsEditingName(false)
  }

  return (
    <div className="glass-card-hover p-4 animate-slide-up group" id={`card-${card.id}`}>
      <div className="flex gap-4">
        {/* Drag handle */}
        <div className="flex items-center">
          <GripVertical className="w-4 h-4 text-surface-600 group-hover:text-surface-400 transition-colors cursor-grab" />
        </div>

        {/* Image dropzone */}
        <div
          className={`relative w-[72px] h-[100px] flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
            isDragging
              ? 'border-vg-400 bg-vg-500/15 shadow-lg shadow-vg-500/10'
              : card.imageUrl
              ? 'border-surface-600/30 hover:border-vg-500/30'
              : 'border-dashed border-surface-600/50 hover:border-vg-500/30 bg-surface-800/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          title="Clique ou arraste uma imagem"
        >
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.name}
              style={
                card.rotated 
                  ? { width: '100px', height: '72px', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(90deg)' } 
                  : {}
              }
              className={`object-cover transition-transform duration-300 ${!card.rotated ? 'w-full h-full' : ''}`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-surface-500 gap-1">
              <ImagePlus className="w-5 h-5" />
              <span className="text-[9px] font-medium">Imagem</span>
            </div>
          )}

          {/* Upload overlay on hover */}
          {card.imageUrl && (
            <div className="absolute inset-0 bg-surface-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="w-4 h-4 text-white" />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Card info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Name */}
          <div className="flex items-start gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveName()}
                  onBlur={saveName}
                  autoFocus
                  className="flex-1 bg-surface-900 border border-vg-500/30 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-vg-500/50"
                />
                <button onClick={saveName} className="text-vg-400 hover:text-vg-300 p-1">
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-white truncate">{card.name}</h3>
                <button
                  onClick={() => { setEditName(card.name); setIsEditingName(true) }}
                  className="text-surface-500 hover:text-vg-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                  title="Editar nome"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-2">
            {/* Quantity */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-surface-400 mr-1.5">Qtd:</span>
              <button
                onClick={() => handleQuantityChange(-1)}
                className="w-7 h-7 rounded-lg bg-surface-700/80 border border-surface-600/50 flex items-center justify-center text-surface-300 hover:text-white hover:bg-surface-600 transition-all"
                disabled={card.quantity <= 1}
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-white tabular-nums">
                {card.quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(1)}
                className="w-7 h-7 rounded-lg bg-surface-700/80 border border-surface-600/50 flex items-center justify-center text-surface-300 hover:text-white hover:bg-surface-600 transition-all"
                disabled={card.quantity >= 50}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onUpdate(card.id, { rotated: !card.rotated })}
                className="btn-secondary px-2 py-1.5"
                title="Girar carta 90 graus"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              
              <button
                onClick={() => onRemove(card.id)}
                className="btn-danger px-2 py-1.5"
                title="Remover carta"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CardList({ deck, onUpdate, onRemove, onClear }) {
  const [isFetchingImages, setIsFetchingImages] = useState(false)
  const totalCopies = deck.reduce((s, c) => s + c.quantity, 0)
  const withImages = deck.filter(c => c.imageUrl).length

  const handleAutoFetchImages = async () => {
    const cardsWithoutImages = deck.filter(c => !c.imageUrl);
    if (cardsWithoutImages.length === 0) return;

    setIsFetchingImages(true);

    for (const card of cardsWithoutImages) {
      try {
        const queryName = encodeURIComponent(card.name)
        let foundUrl = null

        // Pass 1: try to get list of images to find EN/Sample
        const listRes = await fetch(`https://cardfight.fandom.com/api.php?action=query&prop=images&titles=${queryName}&format=json&origin=*`)
        const listData = await listRes.json()
        const pages = listData.query?.pages
        
        if (pages) {
          const pageId = Object.keys(pages)[0]
          if (pageId !== '-1' && pages[pageId].images) {
            const images = pages[pageId].images
            // Tenta priorizar imagens com "EN" ou "(Sample)" para evitar imagens JP
            let selectedImage = images.find(img => img.title.includes('EN') || img.title.includes('Sample'))
            if (!selectedImage) {
              // Fallback para qualquer imagem que pareça ser uma carta (PNG/JPG) e não um icone
              selectedImage = images.find(img => (img.title.toLowerCase().endsWith('.png') || img.title.toLowerCase().endsWith('.jpg')) && !img.title.toLowerCase().includes('icon'))
            }

            if (selectedImage) {
              // Fetch the actual URL
              const imgRes = await fetch(`https://cardfight.fandom.com/api.php?action=query&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(selectedImage.title)}&format=json&origin=*`)
              const imgData = await imgRes.json()
              const imgPages = imgData.query?.pages
              if (imgPages) {
                const imgPageId = Object.keys(imgPages)[0]
                if (imgPageId !== '-1' && imgPages[imgPageId].imageinfo) {
                  foundUrl = imgPages[imgPageId].imageinfo[0].url
                }
              }
            }
          }
        }

        // Pass 2: Fallback para (D Series) se a primeira busca falhar (comum para cartas com nomes genéricos)
        if (!foundUrl) {
           const dSeriesName = encodeURIComponent(card.name + ' (D Series)')
           const fallbackRes = await fetch(`https://cardfight.fandom.com/api.php?action=query&prop=pageimages&titles=${dSeriesName}&format=json&pithumbsize=600&origin=*`)
           const fallbackData = await fallbackRes.json()
           const fPages = fallbackData.query?.pages
           if (fPages) {
             const fPageId = Object.keys(fPages)[0]
             if (fPageId !== '-1' && fPages[fPageId].thumbnail) {
               foundUrl = fPages[fPageId].thumbnail.source
             }
           }
        }

        if (foundUrl) {
          onUpdate(card.id, { imageUrl: foundUrl, imageBlob: null });
        }
      } catch (e) {
        console.error("Erro ao buscar imagem para", card.name, e);
      }
      
      // Delay pequeno para evitar rate limit da wiki
      await new Promise(r => setTimeout(r, 200));
    }

    setIsFetchingImages(false);
  }

  return (
    <section className="space-y-4 animate-fade-in" id="card-list">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-white">Cartas do Deck</h2>
          <div className="flex gap-2">
            <span className="badge">{deck.length} únicas</span>
            <span className="badge">{totalCopies} total</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-surface-400">
            {withImages}/{deck.length} com imagem
          </span>
          {withImages < deck.length && (
            <button 
              onClick={handleAutoFetchImages} 
              disabled={isFetchingImages}
              className="btn-secondary whitespace-nowrap px-3 py-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingImages ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isFetchingImages ? 'Buscando...' : 'Buscar Imagens'}
              </span>
            </button>
          )}
          <button onClick={onClear} className="btn-danger whitespace-nowrap px-3 py-1.5">
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpar tudo</span>
          </button>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {deck.map(card => (
          <CardItem
            key={card.id}
            card={card}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))}
      </div>

      {/* Image coverage warning */}
      {deck.length > 0 && withImages < deck.length && (
        <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>
            {deck.length - withImages} carta(s) sem imagem. Cartas sem imagem aparecerão como retângulos vazios no PDF.
          </span>
        </div>
      )}
    </section>
  )
}
