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
      className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg transition-colors text-sm ${
        isSelected
          ? 'bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
      }`}
    >
      <span className="w-3 h-3 rounded-full flex-shrink-0 border border-white dark:border-gray-700 shadow-sm" style={{ backgroundColor: color }} />
      <span className="font-medium text-gray-800 dark:text-gray-100 truncate flex-1">{node.name}</span>
      {node.tags.length > 0 && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: color + '25', color }}>
          {node.tags[0]}
        </span>
      )}
    </button>
  )
}
