import { type AppNode, type Group } from '../../types'

interface Props {
  node: AppNode
  group: Group | null
  isSelected: boolean
  onClick: () => void
}

export default function NodeListItem({ node, group, isSelected, onClick }: Props) {
  const color = node.color || group?.color || '#888888'
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-2 px-3 py-2 text-left rounded-lg transition-colors text-sm ${
        isSelected
          ? 'bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
      }`}
    >
      <span className="w-3 h-3 rounded-full flex-shrink-0 border border-white dark:border-gray-700 shadow-sm mt-0.5" style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0">
        <span className="font-medium text-gray-800 dark:text-gray-100 truncate block">{node.name}</span>
        {node.tags.length > 0 && (
          <div
            className="flex gap-1 mt-0.5"
            style={{
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            } as React.CSSProperties}
          >
            {node.tags.map((tag) => (
              <span
                key={tag}
                className="whitespace-nowrap flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px]"
                style={{
                  backgroundColor: color + '26',
                  color,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}
