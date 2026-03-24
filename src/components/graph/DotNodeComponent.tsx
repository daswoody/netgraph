import { memo, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { type RFNodeData } from '../../lib/graphUtils'

interface TooltipAnchor {
  cx: number  // center-x of the dot in viewport coords
  top: number // top edge of the dot in viewport coords
}

function DotTooltip({
  name,
  description,
  tags,
  color,
  anchor,
}: {
  name: string
  description: string
  tags: string[]
  color: string
  anchor: TooltipAnchor
}) {
  return createPortal(
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{
        left: anchor.cx,
        top: anchor.top - 10,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="bg-gray-900/95 dark:bg-gray-800/95 text-white rounded-lg shadow-2xl px-3 py-2.5 min-w-[140px] max-w-[220px] border border-gray-700/50">
        {/* Node name */}
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="font-semibold text-sm leading-tight">{name}</span>
        </div>
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {tags.map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-gray-200">
                {t}
              </span>
            ))}
          </div>
        )}
        {/* Description */}
        {description && (
          <p className="text-xs text-gray-300 leading-snug line-clamp-3">{description}</p>
        )}
        {/* Arrow pointing down */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45 bg-gray-900/95 dark:bg-gray-800/95 border-r border-b border-gray-700/50" />
      </div>
    </div>,
    document.body,
  )
}

const centeredHandle: React.CSSProperties = {
  opacity: 0,
  width: 8,
  height: 8,
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
}

function DotNodeComponentInner({ data }: NodeProps) {
  const { appNode, group, isSelected, isDimmed } = data as RFNodeData
  const color = appNode.color || group?.color || '#94a3b8'
  const [anchor, setAnchor] = useState<TooltipAnchor | null>(null)
  const dotRef = useRef<HTMLDivElement>(null)

  const showTooltip = () => {
    if (dotRef.current) {
      const rect = dotRef.current.getBoundingClientRect()
      setAnchor({ cx: rect.left + rect.width / 2, top: rect.top })
    }
  }

  return (
    <>
      <div
        className={`
          relative flex items-center justify-center transition-opacity duration-150
          ${isDimmed ? 'opacity-20' : 'opacity-100'}
        `}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setAnchor(null)}
      >
        <Handle type="target" position={Position.Left} style={centeredHandle} />

        <div
          ref={dotRef}
          className={`
            w-10 h-10 rounded-full cursor-pointer
            transition-all duration-150
            ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-blue-400 scale-110' : 'hover:scale-110'}
          `}
          style={{ backgroundColor: color }}
        />

        <Handle type="source" position={Position.Right} style={centeredHandle} />
      </div>

      {anchor && (
        <DotTooltip
          name={appNode.name}
          description={appNode.description}
          tags={appNode.tags}
          color={color}
          anchor={anchor}
        />
      )}
    </>
  )
}

export const DotNodeComponent = memo(DotNodeComponentInner)
