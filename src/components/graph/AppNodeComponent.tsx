import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { type RFNodeData } from '../../lib/graphUtils'

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
  const firstTag = appNode.tags[0]

  return (
    <div
      className={`
        relative rounded-lg border-2 bg-white dark:bg-gray-800 px-3 py-2 min-w-[150px] max-w-[190px]
        transition-opacity duration-150 shadow-sm
        ${isSelected ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-blue-400' : ''}
        ${isDimmed ? 'opacity-20' : 'opacity-100'}
      `}
      style={{ borderColor: color }}
    >
      {/* Centered handles — invisible, lines connect to center */}
      <Handle type="target" position={Position.Left} style={centeredHandle} />
      <Handle type="source" position={Position.Right} style={centeredHandle} />

      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate leading-tight">
            {appNode.name}
          </p>
          {firstTag && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight mt-0.5">
              {firstTag}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export const AppNodeComponent = memo(AppNodeComponentInner)
