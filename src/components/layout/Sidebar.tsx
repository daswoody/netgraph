import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { applySidebarFilters } from '../../lib/filterUtils'
import NodeListItem from '../sidebar/NodeListItem'
import MultiSelect from '../ui/MultiSelect'
import { type AppNode, type Group } from '../../types'

interface GroupSection {
  group: Group | null
  nodes: AppNode[]
}

export default function Sidebar() {
  const nodes = useAppStore((s) => s.nodes)
  const groups = useAppStore((s) => s.groups)
  const sidebarFilters = useAppStore((s) => s.sidebarFilters)
  const setSidebarFilters = useAppStore((s) => s.setSidebarFilters)
  const selectedNodeId = useAppStore((s) => s.selectedNodeId)
  const focusMode = useAppStore((s) => s.focusMode)
  const selectNode = useAppStore((s) => s.selectNode)
  const openDetailPanel = useAppStore((s) => s.openDetailPanel)
  const setFocusMode = useAppStore((s) => s.setFocusMode)

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const groupMap = new Map(groups.map((g) => [g.id, g]))
  const allTags = Array.from(new Set(nodes.flatMap((n) => n.tags))).sort()
  const groupOptions = groups.map((g) => ({ value: g.id, label: g.name, color: g.color }))
  const tagOptions = allTags.map((t) => ({ value: t, label: t }))

  const filtered = applySidebarFilters(nodes, sidebarFilters)

  const sections: GroupSection[] = []
  for (const group of groups) {
    const groupNodes = filtered.filter((n) => n.groupId === group.id)
    if (groupNodes.length > 0) sections.push({ group, nodes: groupNodes })
  }
  const ungrouped = filtered.filter((n) => n.groupId === null)
  if (ungrouped.length > 0) sections.push({ group: null, nodes: ungrouped })

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const handleNodeClick = (nodeId: string) => {
    selectNode(nodeId)
    openDetailPanel(nodeId)
  }

  return (
    <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Search + Filters */}
      <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-700 space-y-2 flex-shrink-0">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search nodes…"
            value={sidebarFilters.search}
            onChange={(e) => setSidebarFilters({ search: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
        </div>

        {/* Group + Tag filters */}
        <div className="flex gap-1.5">
          {groupOptions.length > 0 && (
            <div className="flex-1 min-w-0">
              <MultiSelect
                options={groupOptions}
                selected={sidebarFilters.groupIds}
                onChange={(v) => setSidebarFilters({ groupIds: v })}
                placeholder="Groups…"
              />
            </div>
          )}
          {tagOptions.length > 0 && (
            <div className="flex-1 min-w-0">
              <MultiSelect
                options={tagOptions}
                selected={sidebarFilters.tags}
                onChange={(v) => setSidebarFilters({ tags: v })}
                placeholder="Tags…"
              />
            </div>
          )}
        </div>
      </div>

      {/* Node count + Focus toggle */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Nodes ({filtered.length})
        </span>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <span className="text-xs text-gray-500 dark:text-gray-400">Focus</span>
          <div
            onClick={() => setFocusMode(!focusMode)}
            className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${focusMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${focusMode ? 'translate-x-4' : 'translate-x-0.5'}`}
            />
          </div>
        </label>
      </div>

      {/* Grouped node list */}
      <div className="flex-1 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">
            No nodes found
          </div>
        ) : (
          sections.map((section) => {
            const sectionKey = section.group?.id ?? '__ungrouped__'
            const isCollapsed = collapsedGroups.has(sectionKey)
            const groupColor = section.group?.color ?? '#94a3b8'

            return (
              <div key={sectionKey} className="mb-0.5">
                <button
                  onClick={() => toggleGroup(sectionKey)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg
                    className={`w-3 h-3 flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: groupColor }} />
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide truncate flex-1">
                    {section.group?.name ?? 'Ungrouped'}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                    {section.nodes.length}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="px-1 pb-1 space-y-0.5">
                    {section.nodes.map((node) => (
                      <NodeListItem
                        key={node.id}
                        node={node}
                        group={node.groupId ? (groupMap.get(node.groupId) ?? null) : null}
                        isSelected={node.id === selectedNodeId}
                        onClick={() => handleNodeClick(node.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
