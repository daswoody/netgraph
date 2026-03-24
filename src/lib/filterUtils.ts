import { type AppNode, type GraphFilters, type SidebarFilters } from '../types'

export function applyGraphFilters(nodes: AppNode[], filters: GraphFilters): AppNode[] {
  return nodes.filter((node) => {
    const groupMatch =
      filters.groupIds.length === 0 ||
      (node.groupId !== null && filters.groupIds.includes(node.groupId))
    const tagMatch =
      filters.tags.length === 0 ||
      filters.tags.some((t) => node.tags.includes(t))
    return groupMatch && tagMatch
  })
}

export function applySidebarFilters(nodes: AppNode[], filters: SidebarFilters): AppNode[] {
  return nodes.filter((node) => {
    const search = filters.search.toLowerCase().trim()
    const textMatch =
      !search ||
      node.name.toLowerCase().includes(search) ||
      node.description.toLowerCase().includes(search) ||
      node.tags.some((t) => t.toLowerCase().includes(search))
    const groupMatch =
      filters.groupIds.length === 0 ||
      (node.groupId !== null && filters.groupIds.includes(node.groupId))
    const tagMatch =
      filters.tags.length === 0 ||
      filters.tags.some((t) => node.tags.includes(t))
    return textMatch && groupMatch && tagMatch
  })
}

export function computeVisibleIds(
  nodes: AppNode[],
  graphFilters: GraphFilters,
  focusMode: boolean,
  selectedNodeId: string | null,
): Set<string> {
  const filtered = applyGraphFilters(nodes, graphFilters)

  if (focusMode && selectedNodeId) {
    const selected = filtered.find((n) => n.id === selectedNodeId)
    const directIds = new Set([selectedNodeId, ...(selected?.connectedNodeIds ?? [])])
    return new Set(filtered.filter((n) => directIds.has(n.id)).map((n) => n.id))
  }

  return new Set(filtered.map((n) => n.id))
}
