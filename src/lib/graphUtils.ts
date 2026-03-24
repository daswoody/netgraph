import { type Node, type Edge } from '@xyflow/react'
import { type AppNode, type Group, type GraphFilters } from '../types'
import { computeVisibleIds } from './filterUtils'

export interface RFNodeData extends Record<string, unknown> {
  appNode: AppNode
  group: Group | null
  isSelected: boolean
  isDimmed: boolean
}

export type AppRFNode = Node<RFNodeData, 'appNode'>
export type AppRFEdge = Edge<Record<string, unknown>>

export function toRFNodes(
  appNodes: AppNode[],
  groups: Group[],
  selectedNodeId: string | null,
  focusMode: boolean,
  graphFilters: GraphFilters,
): AppRFNode[] {
  const groupMap = new Map(groups.map((g) => [g.id, g]))
  const visibleIds = computeVisibleIds(appNodes, graphFilters, focusMode, selectedNodeId)

  const selectedNode = selectedNodeId
    ? appNodes.find((n) => n.id === selectedNodeId)
    : null
  const connectedToSelected = new Set(selectedNode?.connectedNodeIds ?? [])

  return appNodes
    .filter((n) => visibleIds.has(n.id))
    .map((n) => ({
      id: n.id,
      type: 'appNode' as const,
      position: n.position,
      data: {
        appNode: n,
        group: n.groupId ? (groupMap.get(n.groupId) ?? null) : null,
        isSelected: n.id === selectedNodeId,
        isDimmed:
          selectedNodeId !== null &&
          n.id !== selectedNodeId &&
          !connectedToSelected.has(n.id),
      },
      draggable: true,
      selectable: true,
    }))
}

export function toRFEdges(
  appNodes: AppNode[],
  visibleIds: Set<string>,
  selectedNodeId: string | null,
): AppRFEdge[] {
  const edges: AppRFEdge[] = []
  const seen = new Set<string>()

  const selectedNode = selectedNodeId
    ? appNodes.find((n) => n.id === selectedNodeId)
    : null
  const activeIds: Set<string> | null = selectedNodeId
    ? new Set([selectedNodeId, ...(selectedNode?.connectedNodeIds ?? [])])
    : null

  for (const node of appNodes) {
    for (const connId of node.connectedNodeIds) {
      const edgeKey = [node.id, connId].sort().join('--')
      if (!seen.has(edgeKey) && visibleIds.has(node.id) && visibleIds.has(connId)) {
        seen.add(edgeKey)
        const isDimmedEdge =
          activeIds !== null &&
          (!activeIds.has(node.id) || !activeIds.has(connId))
        edges.push({
          id: edgeKey,
          source: node.id,
          target: connId,
          type: 'straight',
          animated: false,
          style: isDimmedEdge
            ? { opacity: 0.1, strokeWidth: 1.5 }
            : { opacity: 0.6, strokeWidth: 1.5 },
        })
      }
    }
  }

  return edges
}
