import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Modal } from '../ui/Modal'
import { ColorPicker } from '../ui/ColorPicker'
import { TagInput } from '../ui/TagInput'
import { MultiSelect } from '../ui/MultiSelect'

function resizeImageToBase64(file: File, maxSize = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}

// Inline searchable connection picker — avoids dropdown clipping inside modal
function ConnectionPicker({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; color?: string }[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  const [search, setSearch] = useState('')
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  )

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
      {/* Search bar */}
      <div className="border-b border-gray-200 dark:border-gray-600 px-3 py-2 flex items-center gap-2 bg-gray-50 dark:bg-gray-800">
        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search nodes…"
          className="flex-1 text-xs bg-transparent border-none outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {value.length > 0 && (
          <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded-full flex-shrink-0">
            {value.length} selected
          </span>
        )}
      </div>

      {/* Scrollable list */}
      <div
        className="max-h-40 overflow-y-auto bg-white dark:bg-gray-800/50"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}
      >
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No nodes found</p>
        ) : (
          filtered.map((opt) => {
            const sel = value.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-b-0 ${
                  sel
                    ? 'bg-indigo-50 dark:bg-indigo-900/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    sel ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 dark:border-gray-500'
                  }`}
                >
                  {sel && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                {opt.color && (
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: opt.color }}
                  />
                )}
                <span
                  className={`flex-1 truncate text-sm ${
                    sel
                      ? 'text-indigo-700 dark:text-indigo-300 font-medium'
                      : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {opt.label}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

export function NodeForm() {
  const nodes = useAppStore((s) => s.nodes)
  const groups = useAppStore((s) => s.groups)
  const editingNodeId = useAppStore((s) => s.editingNodeId)
  const closeNodeForm = useAppStore((s) => s.closeNodeForm)
  const addNode = useAppStore((s) => s.addNode)
  const updateNode = useAppStore((s) => s.updateNode)

  const editingNode = editingNodeId ? nodes.find((n) => n.id === editingNodeId) : null
  const isEdit = !!editingNode

  const defaultGroup = groups[0] ?? null

  const [name, setName] = useState(editingNode?.name ?? '')
  const [groupId, setGroupId] = useState<string | null>(editingNode?.groupId ?? defaultGroup?.id ?? null)
  const [color, setColor] = useState(editingNode?.color ?? defaultGroup?.color ?? '#94a3b8')
  const [tags, setTags] = useState<string[]>(editingNode?.tags ?? [])
  const [description, setDescription] = useState(editingNode?.description ?? '')
  const [connectedNodeIds, setConnectedNodeIds] = useState<string[]>(editingNode?.connectedNodeIds ?? [])
  const [image, setImage] = useState<string | undefined>(editingNode?.image)
  const [colorOverridden, setColorOverridden] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!colorOverridden) {
      const group = groupId ? groups.find((g) => g.id === groupId) : null
      if (group) setColor(group.color)
    }
  }, [groupId, groups, colorOverridden])

  const selectedGroup = groupId ? groups.find((g) => g.id === groupId) : null
  const allTags = Array.from(new Set([
    ...(selectedGroup?.defaultTags ?? []),
    ...nodes.flatMap((n) => n.tags),
  ])).sort()

  const otherNodes = nodes.filter((n) => n.id !== editingNodeId)
  const connectionOptions = otherNodes.map((n) => ({
    value: n.id,
    label: n.name,
    color: n.color || groups.find((g) => g.id === n.groupId)?.color,
  }))

  const groupOptions = groups.map((g) => ({ value: g.id, label: g.name, color: g.color }))

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageLoading(true)
    try {
      const b64 = await resizeImageToBase64(file)
      setImage(b64)
    } catch {
      setError('Failed to process image')
    } finally {
      setImageLoading(false)
    }
  }

  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmed = name.trim()
    if (!trimmed) { setError('Name is required'); return }

    const duplicate = nodes.find(
      (n) => n.name.toLowerCase() === trimmed.toLowerCase() && n.id !== editingNodeId,
    )
    if (duplicate) { setError('A node with this name already exists'); return }

    const payload = {
      name: trimmed,
      groupId,
      color,
      tags,
      description: description.trim(),
      connectedNodeIds,
      image,
      position: editingNode?.position ?? { x: Math.random() * 400, y: Math.random() * 300 },
    }

    setSubmitting(true)
    try {
      if (isEdit && editingNodeId) {
        updateNode(editingNodeId, payload)
      } else {
        await addNode(payload)
      }
      closeNodeForm()
    } catch {
      setError('Failed to save node. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal onClose={closeNodeForm} title={isEdit ? 'Edit Node' : 'Add Node'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-3 py-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder="Node name"
            autoFocus
          />
        </div>

        {/* Group */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Group</label>
          <MultiSelect
            options={groupOptions}
            value={groupId ? [groupId] : []}
            onChange={(vals) => setGroupId(vals[0] ?? null)}
            placeholder="No group"
            maxSelect={1}
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
          <ColorPicker
            value={color}
            onChange={(c) => { setColor(c); setColorOverridden(true) }}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
          <TagInput value={tags} onChange={setTags} suggestions={allTags} />
          {allTags.filter((t) => !tags.includes(t)).length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {allTags.filter((t) => !tags.includes(t)).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTags([...tags, tag])}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200 transition-colors border border-gray-200 dark:border-gray-600"
                >
                  + {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
            placeholder="Optional description…"
          />
        </div>

        {/* Connections — inline searchable list, never clips */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Connections
            {connectedNodeIds.length > 0 && (
              <span className="ml-1 text-indigo-600 dark:text-indigo-400">({connectedNodeIds.length})</span>
            )}
          </label>
          {otherNodes.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic py-1">No other nodes yet</p>
          ) : (
            <ConnectionPicker
              options={connectionOptions}
              value={connectedNodeIds}
              onChange={setConnectedNodeIds}
            />
          )}
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Image</label>
          <div className="flex items-center gap-3">
            {image && (
              <div className="relative">
                <img
                  src={image}
                  alt="Preview"
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setImage(undefined)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none"
                >
                  ×
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageLoading}
              className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {imageLoading ? 'Processing…' : image ? 'Change image' : 'Upload image'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors disabled:opacity-60"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add node'}
          </button>
          <button
            type="button"
            onClick={closeNodeForm}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default NodeForm
