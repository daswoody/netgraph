import { useState, useRef, useCallback, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { ColorPicker } from '../ui/ColorPicker'
import { TagInput } from '../ui/TagInput'
import { MultiSelect } from '../ui/MultiSelect'

function resizeImageToBase64(file: File, maxSize = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}

// Inline searchable connection picker
function ConnectionPicker({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; color?: string }[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  const [search, setSearch] = useState('')
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  )

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
      <div className="border-b border-gray-200 dark:border-gray-600 px-3 py-2 flex items-center gap-2 bg-gray-50 dark:bg-gray-800">
        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search nodes…"
          className="flex-1 text-xs bg-transparent border-none outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {value.length > 0 && (
          <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded-full flex-shrink-0">
            {value.length} selected
          </span>
        )}
      </div>
      <div
        className="max-h-40 overflow-y-auto bg-white dark:bg-gray-800/50"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}
      >
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No nodes found</p>
        ) : (
          filtered.map((opt) => {
            const sel = value.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-b-0 ${
                  sel ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  sel ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 dark:border-gray-500'
                }`}>
                  {sel && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                {opt.color && (
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                )}
                <span className={`flex-1 truncate text-sm ${sel ? 'text-indigo-700 dark:text-indigo-300 font-medium' : 'text-gray-700 dark:text-gray-200'}`}>
                  {opt.label}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

export function NodeDetailPanel() {
  const detailPanelNodeId = useAppStore((s) => s.detailPanelNodeId)
  const nodes = useAppStore((s) => s.nodes)
  const groups = useAppStore((s) => s.groups)
  const closeDetailPanel = useAppStore((s) => s.closeDetailPanel)
  const deleteNode = useAppStore((s) => s.deleteNode)
  const updateNode = useAppStore((s) => s.updateNode)

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageLoading, setImageLoading] = useState(false)

  // More options collapsible
  const [moreOpen, setMoreOpen] = useState(false)

  // Local state for inline editing
  const [localName, setLocalName] = useState('')
  const [localDesc, setLocalDesc] = useState('')
  const [localTags, setLocalTags] = useState<string[]>([])
  const [localGroupId, setLocalGroupId] = useState<string | null>(null)
  const [localColor, setLocalColor] = useState('')
  const [localConnIds, setLocalConnIds] = useState<string[]>([])
  const [localImage, setLocalImage] = useState<string | undefined>(undefined)

  const node = nodes.find((n) => n.id === detailPanelNodeId)

  // Reset local state when node changes
  useEffect(() => {
    if (!node) return
    setLocalName(node.name)
    setLocalDesc(node.description)
    setLocalTags(node.tags)
    setLocalGroupId(node.groupId)
    setLocalColor(node.color)
    setLocalConnIds(node.connectedNodeIds)
    setLocalImage(node.image)
    setMoreOpen(false)
  }, [node?.id])

  const openLightbox = () => { setZoom(1); setLightboxOpen(true) }
  const closeLightbox = () => setLightboxOpen(false)

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setZoom((z) => Math.min(5, Math.max(0.5, z - e.deltaY * 0.001)))
  }, [])

  const zoomIn = () => setZoom((z) => Math.min(5, +(z + 0.5).toFixed(1)))
  const zoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.5).toFixed(1)))
  const zoomReset = () => setZoom(1)

  if (!detailPanelNodeId) return null
  if (!node) return null

  const group = node.groupId ? groups.find((g) => g.id === node.groupId) : null
  const color = node.color || group?.color || '#94a3b8'

  const allTags = Array.from(new Set(nodes.flatMap((n) => n.tags))).sort()
  const groupOptions = groups.map((g) => ({ value: g.id, label: g.name, color: g.color }))
  const otherNodes = nodes.filter((n) => n.id !== node.id)
  const connectionOptions = otherNodes.map((n) => ({
    value: n.id,
    label: n.name,
    color: n.color || groups.find((g) => g.id === n.groupId)?.color,
  }))

  function handleDelete() {
    if (window.confirm(`Delete "${node!.name}"?`)) {
      deleteNode(node!.id)
      closeDetailPanel()
    }
  }

  function saveName() {
    const trimmed = localName.trim()
    if (trimmed && trimmed !== node!.name) {
      updateNode(node!.id, { name: trimmed })
    }
  }

  function saveDesc() {
    if (localDesc !== node!.description) {
      updateNode(node!.id, { description: localDesc })
    }
  }

  function handleTagsChange(tags: string[]) {
    setLocalTags(tags)
    updateNode(node!.id, { tags })
  }

  function handleGroupChange(vals: string[]) {
    const newGroupId = vals[0] ?? null
    setLocalGroupId(newGroupId)
    const newGroup = newGroupId ? groups.find((g) => g.id === newGroupId) : null
    const mergedTags = newGroup
      ? Array.from(new Set([...localTags, ...newGroup.defaultTags]))
      : localTags
    setLocalTags(mergedTags)
    updateNode(node!.id, { groupId: newGroupId, tags: mergedTags })
  }

  function handleColorChange(c: string) {
    setLocalColor(c)
    updateNode(node!.id, { color: c })
  }

  function handleConnIdsChange(ids: string[]) {
    setLocalConnIds(ids)
    updateNode(node!.id, { connectedNodeIds: ids })
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageLoading(true)
    try {
      const b64 = await resizeImageToBase64(file)
      setLocalImage(b64)
      updateNode(node!.id, { image: b64 })
    } catch {
      // ignore
    } finally {
      setImageLoading(false)
    }
  }

  function removeImage() {
    setLocalImage(undefined)
    updateNode(node!.id, { image: undefined })
  }

  return (
    <>
      {/* Right sidebar panel */}
      <div className="w-72 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0"
          style={{ borderLeftColor: color, borderLeftWidth: 3 }}
        >
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate flex-1 mr-2 text-sm">
            {node.name}
          </h2>
          <button
            onClick={closeDetailPanel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Image preview */}
          {localImage && (
            <div className="space-y-1">
              <button
                onClick={openLightbox}
                className="w-full block rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <img
                  src={localImage}
                  alt={node.name}
                  className="w-full object-cover"
                  style={{ maxHeight: 200 }}
                />
              </button>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">Click to enlarge · scroll to zoom</p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Name</label>
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur() } }}
              className="w-full text-sm font-semibold text-gray-900 dark:text-gray-100 bg-transparent border border-transparent rounded px-1 py-0.5 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Description</label>
            <textarea
              value={localDesc}
              onChange={(e) => setLocalDesc(e.target.value)}
              onBlur={saveDesc}
              rows={3}
              placeholder="Add description…"
              className="w-full text-sm text-gray-700 dark:text-gray-300 bg-transparent border border-transparent rounded px-1 py-0.5 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors resize-none placeholder-gray-400 dark:placeholder-gray-600"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Tags</label>
            <TagInput
              value={localTags}
              onChange={handleTagsChange}
              suggestions={allTags}
            />
          </div>

          {/* Group */}
          <div>
            <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Group</label>
            <MultiSelect
              options={groupOptions}
              value={localGroupId ? [localGroupId] : []}
              onChange={handleGroupChange}
              placeholder="No group"
              maxSelect={1}
            />
          </div>

          {/* More options collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <polyline points="6 9 12 15 18 9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              More options
            </button>

            {moreOpen && (
              <div className="mt-3 space-y-4">
                {/* Color */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Color</label>
                  <ColorPicker value={localColor} onChange={handleColorChange} />
                </div>

                {/* Connections */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                    Connections
                    {localConnIds.length > 0 && (
                      <span className="ml-1 text-indigo-600 dark:text-indigo-400">({localConnIds.length})</span>
                    )}
                  </label>
                  {otherNodes.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic py-1">No other nodes yet</p>
                  ) : (
                    <ConnectionPicker
                      options={connectionOptions}
                      value={localConnIds}
                      onChange={handleConnIdsChange}
                    />
                  )}
                </div>

                {/* Image */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Image</label>
                  <div className="flex items-center gap-3">
                    {localImage && (
                      <div className="relative">
                        <img
                          src={localImage}
                          alt="Preview"
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imageLoading}
                      className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      {imageLoading ? 'Processing…' : localImage ? 'Change image' : 'Upload image'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex gap-2 flex-shrink-0">
          <button
            onClick={handleDelete}
            className="w-full px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-600 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Lightbox with zoom */}
      {lightboxOpen && localImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
          onWheel={handleWheel}
        >
          {/* Zoom controls */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={zoomOut}
              className="text-white hover:text-gray-300 transition-colors w-6 h-6 flex items-center justify-center"
              title="Zoom out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={zoomReset}
              className="text-white text-xs font-mono w-10 text-center hover:text-gray-300 transition-colors"
              title="Reset zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={zoomIn}
              className="text-white hover:text-gray-300 transition-colors w-6 h-6 flex items-center justify-center"
              title="Zoom in"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image — overflow-auto for panning when zoomed in */}
          <div
            className="overflow-auto w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              ref={imgRef}
              src={localImage}
              alt={node.name}
              className="rounded-lg shadow-2xl transition-transform duration-150 origin-center select-none"
              style={{
                transform: `scale(${zoom})`,
                maxWidth: zoom <= 1 ? '90vw' : 'none',
                maxHeight: zoom <= 1 ? '85vh' : 'none',
                cursor: zoom > 1 ? 'move' : 'default',
              }}
              draggable={false}
            />
          </div>

          {/* Hint */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-400 pointer-events-none">
            Scroll to zoom · click outside to close
          </p>
        </div>
      )}
    </>
  )
}

export default NodeDetailPanel
