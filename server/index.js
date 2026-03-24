'use strict'

const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/network_graph',
})

// ── Schema ───────────────────────────────────────────────────────────────────

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS graphs (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name        TEXT NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS groups (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      graph_id     UUID NOT NULL REFERENCES graphs(id) ON DELETE CASCADE,
      name         TEXT NOT NULL,
      color        TEXT NOT NULL DEFAULT '#94a3b8',
      default_tags TEXT[] DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS nodes (
      id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      graph_id           UUID NOT NULL REFERENCES graphs(id) ON DELETE CASCADE,
      name               TEXT NOT NULL,
      group_id           UUID REFERENCES groups(id) ON DELETE SET NULL,
      color              TEXT NOT NULL DEFAULT '#94a3b8',
      tags               TEXT[] DEFAULT '{}',
      description        TEXT DEFAULT '',
      connected_node_ids UUID[] DEFAULT '{}',
      position_x         FLOAT DEFAULT 0,
      position_y         FLOAT DEFAULT 0,
      image              TEXT
    );
  `)
}

// ── Row mappers ───────────────────────────────────────────────────────────────

function rowToNode(row) {
  return {
    id: row.id,
    name: row.name,
    groupId: row.group_id,
    color: row.color,
    tags: row.tags || [],
    description: row.description || '',
    connectedNodeIds: row.connected_node_ids || [],
    position: { x: row.position_x || 0, y: row.position_y || 0 },
    image: row.image || undefined,
  }
}

function rowToGroup(row) {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    defaultTags: row.default_tags || [],
  }
}

// ── App ───────────────────────────────────────────────────────────────────────

const app = express()
app.use(cors({ origin: '*' }))
app.use(express.json({ limit: '25mb' })) // large limit for base64 images

// ── Graphs ────────────────────────────────────────────────────────────────────

app.get('/api/graphs', async (_req, res) => {
  try {
    const r = await pool.query('SELECT * FROM graphs ORDER BY created_at DESC')
    res.json(r.rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/graphs', async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
  try {
    const r = await pool.query(
      'INSERT INTO graphs (name) VALUES ($1) RETURNING *',
      [name.trim()],
    )
    res.status(201).json(r.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/graphs/:id', async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required' })
  try {
    const r = await pool.query(
      'UPDATE graphs SET name = $1 WHERE id = $2 RETURNING *',
      [name.trim(), req.params.id],
    )
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(r.rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/graphs/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM graphs WHERE id = $1', [req.params.id])
    res.status(204).end()
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Groups ────────────────────────────────────────────────────────────────────

app.get('/api/graphs/:graphId/groups', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM groups WHERE graph_id = $1 ORDER BY name',
      [req.params.graphId],
    )
    res.json(r.rows.map(rowToGroup))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/graphs/:graphId/groups', async (req, res) => {
  const { name, color, defaultTags } = req.body
  try {
    const r = await pool.query(
      'INSERT INTO groups (graph_id, name, color, default_tags) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.graphId, name, color || '#94a3b8', defaultTags || []],
    )
    res.status(201).json(rowToGroup(r.rows[0]))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/graphs/:graphId/groups/:groupId', async (req, res) => {
  const { name, color, defaultTags } = req.body
  try {
    const r = await pool.query(
      `UPDATE groups
          SET name = $1, color = $2, default_tags = $3
        WHERE id = $4 AND graph_id = $5
        RETURNING *`,
      [name, color, defaultTags || [], req.params.groupId, req.params.graphId],
    )
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(rowToGroup(r.rows[0]))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/graphs/:graphId/groups/:groupId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM groups WHERE id = $1 AND graph_id = $2',
      [req.params.groupId, req.params.graphId],
    )
    res.status(204).end()
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Nodes ─────────────────────────────────────────────────────────────────────

app.get('/api/graphs/:graphId/nodes', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM nodes WHERE graph_id = $1 ORDER BY name',
      [req.params.graphId],
    )
    res.json(r.rows.map(rowToNode))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/graphs/:graphId/nodes', async (req, res) => {
  const { name, groupId, color, tags, description, connectedNodeIds, position, image } =
    req.body
  try {
    const r = await pool.query(
      `INSERT INTO nodes
         (graph_id, name, group_id, color, tags, description, connected_node_ids,
          position_x, position_y, image)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        req.params.graphId,
        name,
        groupId || null,
        color || '#94a3b8',
        tags || [],
        description || '',
        connectedNodeIds || [],
        position?.x ?? 0,
        position?.y ?? 0,
        image || null,
      ],
    )
    res.status(201).json(rowToNode(r.rows[0]))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/graphs/:graphId/nodes/:nodeId', async (req, res) => {
  const { name, groupId, color, tags, description, connectedNodeIds, position, image } =
    req.body
  try {
    const r = await pool.query(
      `UPDATE nodes
          SET name               = $1,
              group_id           = $2,
              color              = $3,
              tags               = $4,
              description        = $5,
              connected_node_ids = $6,
              position_x         = $7,
              position_y         = $8,
              image              = $9
        WHERE id = $10 AND graph_id = $11
        RETURNING *`,
      [
        name,
        groupId ?? null,
        color,
        tags || [],
        description || '',
        connectedNodeIds || [],
        position?.x ?? 0,
        position?.y ?? 0,
        image ?? null,
        req.params.nodeId,
        req.params.graphId,
      ],
    )
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(rowToNode(r.rows[0]))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/graphs/:graphId/nodes/:nodeId', async (req, res) => {
  const { nodeId, graphId } = req.params
  try {
    // Remove this node from all other nodes' connection lists
    await pool.query(
      `UPDATE nodes
          SET connected_node_ids = array_remove(connected_node_ids, $1::uuid)
        WHERE graph_id = $2`,
      [nodeId, graphId],
    )
    await pool.query('DELETE FROM nodes WHERE id = $1 AND graph_id = $2', [nodeId, graphId])
    res.status(204).end()
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Bulk import (JSON restore) ────────────────────────────────────────────────

app.post('/api/graphs/:graphId/import', async (req, res) => {
  const { nodes = [], groups = [] } = req.body
  const { graphId } = req.params
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM nodes WHERE graph_id = $1', [graphId])
    await client.query('DELETE FROM groups WHERE graph_id = $1', [graphId])

    // Insert groups → build old-id → new-uuid map
    const groupIdMap = {}
    for (const g of groups) {
      const r = await client.query(
        'INSERT INTO groups (graph_id, name, color, default_tags) VALUES ($1,$2,$3,$4) RETURNING id',
        [graphId, g.name, g.color, g.defaultTags || []],
      )
      groupIdMap[g.id] = r.rows[0].id
    }

    // Insert nodes (empty connections first) → build old-id → new-uuid map
    const nodeIdMap = {}
    const nodeRows = []
    for (const n of nodes) {
      const r = await client.query(
        `INSERT INTO nodes (graph_id, name, group_id, color, tags, description,
          position_x, position_y, image, connected_node_ids)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'{}') RETURNING id`,
        [
          graphId,
          n.name,
          n.groupId ? (groupIdMap[n.groupId] || null) : null,
          n.color,
          n.tags || [],
          n.description || '',
          n.position?.x ?? 0,
          n.position?.y ?? 0,
          n.image || null,
        ],
      )
      nodeIdMap[n.id] = r.rows[0].id
      nodeRows.push({ newId: r.rows[0].id, oldConnections: n.connectedNodeIds || [] })
    }

    // Fix connections with remapped IDs
    for (const nr of nodeRows) {
      const remapped = nr.oldConnections.map((id) => nodeIdMap[id]).filter(Boolean)
      await client.query('UPDATE nodes SET connected_node_ids = $1 WHERE id = $2', [
        remapped,
        nr.newId,
      ])
    }

    await client.query('COMMIT')

    const [n, g] = await Promise.all([
      pool.query('SELECT * FROM nodes WHERE graph_id = $1', [graphId]),
      pool.query('SELECT * FROM groups WHERE graph_id = $1', [graphId]),
    ])
    res.json({ nodes: n.rows.map(rowToNode), groups: g.rows.map(rowToGroup) })
  } catch (e) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: e.message })
  } finally {
    client.release()
  }
})

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 4000

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`API server listening on port ${PORT}`))
  })
  .catch((e) => {
    console.error('DB init failed:', e)
    process.exit(1)
  })
