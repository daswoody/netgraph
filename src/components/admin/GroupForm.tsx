import { useState } from 'react'
import { type Group } from '../../types'
import { ColorPicker } from '../ui/ColorPicker'
import { TagInput } from '../ui/TagInput'

interface GroupFormProps {
  initialValues?: Partial<Group>
  onSubmit: (values: { name: string; color: string; defaultTags: string[] }) => void
  onCancel: () => void
}

export function GroupForm({ initialValues, onSubmit, onCancel }: GroupFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [color, setColor] = useState(initialValues?.color ?? '#94a3b8')
  const [defaultTags, setDefaultTags] = useState<string[]>(initialValues?.defaultTags ?? [])
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setError('Name is required'); return }
    onSubmit({ name: trimmed, color, defaultTags })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Group name"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Default tags</label>
        <TagInput value={defaultTags} onChange={setDefaultTags} suggestions={[]} />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors"
        >
          {initialValues?.name ? 'Save' : 'Add group'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
