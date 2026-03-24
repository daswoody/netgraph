import { useState, useRef, useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'

export function NodeDetailPanel() {
  const detailPanelNodeId = useAppStore((s) => s.detailPanelNodeId)
  const nodes = useAppStore((s) => s.nodes)
  const groups = useAppStore((s) => s.groups)
  const closeDetailPanel = useAppStore((s) => s.closeDetailPanel)
  const openNodeForm = useAppStore((s) => s.openNodeForm)
  const deleteNode = useAppStore((s) => s.deleteNode)

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const imgRef = useRef<HTMLImageElement>(null)

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

  const node = nodes.find((n) => n.id === detailPanelNodeId)
  if (!node) return null

  const group = node.groupId ? groups.find((g) => g.id === node.groupId) : null
  const color = node.color || group?.color || '#94a3b8'

  const connectedNodes = nodes.filter((n) => node.connectedNodeIds.includes(n.id))

  function handleDelete() {
    if (window.confirm(`Delete "${node!.name}"?`)) {
      deleteNode(node!.id)
      closeDetailPanel()
    }
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
          {/* Full image */}
          {node.image && (
            <div className="space-y-1">
              <button
                onClick={openLightbox}
                className="w-full block rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <img
                  src={node.image}
                  alt={node.name}
                  className="w-full object-cover"
                  style={{ maxHeight: 200 }}
                />
              </button>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">Click to enlarge · scroll to zoom</p>
            </div>
          )}

          {/* Color + Group */}
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            {group ? (
              <span className="text-sm text-gray-700 dark:text-gray-300">{group.name}</span>
            ) : (
              <span className="text-sm text-gray-400 dark:text-gray-500 italic">No group</span>
            )}
          </div>

          {/* Tags */}
          {node.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {node.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {node.description && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Description
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {node.description}
              </p>
            </div>
          )}

          {/* Connections */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Connections ({connectedNodes.length})
            </p>
            {connectedNodes.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">No connections</p>
            ) : (
              <ul className="space-y-1.5">
                {connectedNodes.map((cn) => {
                  const cnGroup = cn.groupId ? groups.find((g) => g.id === cn.groupId) : null
                  const cnColor = cn.color || cnGroup?.color || '#94a3b8'
                  return (
                    <li key={cn.id} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cnColor }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                        {cn.name}
                      </span>
                      {cnGroup && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                          {cnGroup.name}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex gap-2 flex-shrink-0">
          <button
            onClick={() => { closeDetailPanel(); openNodeForm(node.id) }}
            className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-600 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Lightbox with zoom */}
      {lightboxOpen && node.image && (
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
              src={node.image}
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
