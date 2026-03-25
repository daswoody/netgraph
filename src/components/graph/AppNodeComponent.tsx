import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { type RFNodeData } from '../../lib/graphUtils'
import { useAppStore } from '../../store/useAppStore'

// Centered handle style — lines connect to the visual center of the node card
const centeredHandle: React.CSSProperties = {
  opacity: 0,
  width: 8,
  height: 8,
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  border: 'none',
  background: 'transparent',
}

function AppNodeComponentInner({ data }: NodeProps) {
  const { appNode, group, isSelected, isDimmed } = data as RFNodeData
  const color = appNode.color || group?.color || '#94a3b8'

  const [isHovered, setIsHovered] = useState(false)

  const deleteNode = useAppStore((s) => s.deleteNode)
  const duplicateNode = useAppStore((s) => s.duplicateNode)
  const selectNode = useAppStore((s) => s.selectNode)
  const openDetailPanel = useAppStore((s) => s.openDetailPanel)

  const sourceHandleStyle: React.CSSProperties = {
    position: 'absolute',
    right: -7,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 14,
    height: 14,
    borderRadius: '50%',
    backgroundColor: color,
    border: '2px solid white',
    opacity: isHovered ? 1 : 0,
    cursor: 'crosshair',
    transition: 'opacity 0.15s',
    zIndex: 10,
  }

  return (
    <div
      className={`
        relative rounded-lg border-2 bg-white dark:bg-gray-800 px-3 py-2 min-w-[150px] max-w-[190px]
        transition-opacity duration-150 shadow-sm
        ${isSelected ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-blue-400' : ''}
        ${isDimmed ? 'opacity-20' : 'opacity-100'}
      `}
      style={{ borderColor: color }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating action bar */}
      {isHovered && (
        <div
          className="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-md flex gap-1 px-1 py-0.5"
          style={{ top: -32, right: 0, zIndex: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Link hint */}
          <button
            title="Drag the ⊕ right edge to connect"
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>

          {/* Duplicate */}
          <button
            title="Duplicate"
            onClick={(e) => {
              e.stopPropagation()
              duplicateNode(appNode.id)
            }}
            className="p-1 text-gray-400 hover:text-indigo-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Delete */}
          <button
            title="Delete"
            onClick={(e) => {
              e.stopPropagation()
              if (window.confirm(`Delete "${appNode.name}"?`)) {
                deleteNode(appNode.id)
              }
            }}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Centered target handle */}
      <Handle type="target" position={Position.Left} style={centeredHandle} />

      {/* Visible source handle on right edge */}
      <Handle
        type="source"
        position={Position.Right}
        style={sourceHandleStyle}
      />

      <div
        className="flex items-center gap-2"
        onClick={() => { selectNode(appNode.id); openDetailPanel(appNode.id) }}
      >
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate leading-tight">
            {appNode.name}
          </p>
        </div>
      </div>

      {/* All tags below name */}
      {appNode.tags.length > 0 && (
        <div
          className="flex gap-1 mt-1"
          style={{
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          } as React.CSSProperties}
        >
          {appNode.tags.map((tag) => (
            <span
              key={tag}
              className="whitespace-nowrap flex-shrink-0 rounded-full"
              style={{
                backgroundColor: color + '33',
                color,
                fontSize: 9,
                paddingLeft: 4,
                paddingRight: 4,
                paddingTop: 1,
                paddingBottom: 1,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export const AppNodeComponent = memo(AppNodeComponentInner)
export default AppNodeComponent
