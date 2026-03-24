import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { GroupForm } from './GroupForm'

export function GroupEditor() {
  const groups = useAppStore((s) => s.groups)
  const addGroup = useAppStore((s) => s.addGroup)
  const updateGroup = useAppStore((s) => s.updateGroup)
  const deleteGroup = useAppStore((s) => s.deleteGroup)
  const nodes = useAppStore((s) => s.nodes)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  function handleDelete(id: string, name: string) {
    const count = nodes.filter((n) => n.groupId === id).length
    const msg = count > 0
      ? `Delete group "${name}"? ${count} node(s) will be unassigned.`
      : `Delete group "${name}"?`
    if (window.confirm(msg)) deleteGroup(id)
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.id}>
          {editingId === group.id ? (
            <GroupForm
              initialValues={group}
              onSubmit={(vals) => { updateGroup(group.id, vals); setEditingId(null) }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{group.name}</p>
                {group.defaultTags.length > 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    Tags: {group.defaultTags.join(', ')}
                  </p>
                )}
              </div>
              <button
                onClick={() => setEditingId(group.id)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(group.id, group.name)}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}

      {showAddForm ? (
        <GroupForm
          onSubmit={async (vals) => { await addGroup(vals); setShowAddForm(false) }}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 border border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          + Add group
        </button>
      )}

      {groups.length === 0 && !showAddForm && (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-4">
          No groups yet
        </p>
      )}
    </div>
  )
}
