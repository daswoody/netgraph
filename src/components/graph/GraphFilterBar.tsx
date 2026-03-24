import { useReactFlow } from '@xyflow/react'
import { useAppStore } from '../../store/useAppStore'
import { MultiSelect } from '../ui/MultiSelect'
import { computeLayout } from '../../lib/layoutUtils'

export function GraphFilterBar() {
  const groups = useAppStore((s) => s.groups)
  const nodes = useAppStore((s) => s.nodes)
  const graphFilterGroupIds = useAppStore((s) => s.graphFilters.groupIds)
  const graphFilterTags = useAppStore((s) => s.graphFilters.tags)
  const setGraphFilters = useAppStore((s) => s.setGraphFilters)
  const dotMode = useAppStore((s) => s.dotMode)
  const setDotMode = useAppStore((s) => s.setDotMode)
  const setNodePositions = useAppStore((s) => s.setNodePositions)
  const { fitView } = useReactFlow()

  // Collect all unique tags
  const allTags = Array.from(new Set(nodes.flatMap((n) => n.tags))).sort()

  const groupOptions = groups.map((g) => ({
    value: g.id,
    label: g.name,
    color: g.color,
  }))

  const tagOptions = allTags.map((t) => ({ value: t, label: t }))

  const activeFilterCount =
    graphFilterGroupIds.length + graphFilterTags.length

  function handleAutoLayout() {
    const positions = computeLayout(nodes, dotMode)
    setNodePositions(positions)
    setTimeout(() => fitView({ padding: 0.2 }), 50)
  }

  return (
    <div className="h-12 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center gap-2 px-3 flex-shrink-0">
      {/* Dot/Node toggle */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-md p-0.5">
        <button
          onClick={() => setDotMode(false)}
          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
            !dotMode
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Node
        </button>
        <button
          onClick={() => setDotMode(true)}
          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
            dotMode
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Dot
        </button>
      </div>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

      {/* Group filter */}
      <div className="w-44">
        <MultiSelect
          options={groupOptions}
          value={graphFilterGroupIds}
          onChange={(vals) => setGraphFilters({ groupIds: vals })}
          placeholder="All groups"
        />
      </div>

      {/* Tag filter */}
      <div className="w-40">
        <MultiSelect
          options={tagOptions}
          value={graphFilterTags}
          onChange={(vals) => setGraphFilters({ tags: vals })}
          placeholder="All tags"
        />
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={() => setGraphFilters({ groupIds: [], tags: [] })}
          className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          Reset ({activeFilterCount})
        </button>
      )}

      <div className="flex-1" />

      {/* Auto-layout button */}
      <button
        onClick={handleAutoLayout}
        title="Auto-layout nodes"
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h16M4 12h16M4 19h7" />
        </svg>
        Auto-layout
      </button>
    </div>
  )
}

export default GraphFilterBar
