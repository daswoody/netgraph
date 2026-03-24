import Dagre from '@dagrejs/dagre'
import { type AppNode } from '../types'

// Actual rendered node dimensions
const NODE_WIDTH = 190
const NODE_HEIGHT = 65
const DOT_SIZE = 40   // w-10 h-10 in Tailwind

// Safe-space padding added around each node so they never visually overlap
const NODE_PAD_X = 60
const NODE_PAD_Y = 50
const DOT_PAD = 60

export function computeLayout(
  nodes: AppNode[],
  dotMode: boolean,
): Record<string, { x: number; y: number }> {
  if (nodes.length === 0) return {}

  const g = new Dagre.graphlib.Graph()
  g.setGraph({
    rankdir: 'LR',
    // nodesep / ranksep are additional gaps on top of the padded node sizes
    nodesep: dotMode ? 20 : 30,
    ranksep: dotMode ? 40 : 80,
    marginx: 60,
    marginy: 60,
  })
  g.setDefaultEdgeLabel(() => ({}))

  // Dagre uses padded sizes so the spacing accounts for the safe-zone
  const w = dotMode ? DOT_SIZE + DOT_PAD : NODE_WIDTH + NODE_PAD_X
  const h = dotMode ? DOT_SIZE + DOT_PAD : NODE_HEIGHT + NODE_PAD_Y

  // Actual rendered sizes (used to center positions correctly)
  const rw = dotMode ? DOT_SIZE : NODE_WIDTH
  const rh = dotMode ? DOT_SIZE : NODE_HEIGHT

  nodes.forEach((node) => {
    g.setNode(node.id, { width: w, height: h })
  })

  // Add edges between visible nodes only
  const nodeIdSet = new Set(nodes.map((n) => n.id))
  nodes.forEach((node) => {
    node.connectedNodeIds.forEach((connId) => {
      if (nodeIdSet.has(connId)) {
        // Avoid duplicate edges (dagre handles them but it's cleaner)
        const edgeKey = [node.id, connId].sort().join('--')
        if (!g.hasEdge(node.id, connId) && !g.hasEdge(connId, node.id)) {
          g.setEdge(node.id, connId, { id: edgeKey })
        }
      }
    })
  })

  Dagre.layout(g)

  const positions: Record<string, { x: number; y: number }> = {}
  nodes.forEach((node) => {
    const n = g.node(node.id)
    if (n) {
      // Center the rendered node within the padded dagre cell
      positions[node.id] = { x: n.x - rw / 2, y: n.y - rh / 2 }
    }
  })

  return positions
}
