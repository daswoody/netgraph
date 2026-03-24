import { useState, useRef, useEffect } from 'react'

interface Props {
  /** Tag values. Alias: `tags` */
  value?: string[]
  /** @deprecated Use `value` */
  tags?: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
}

export default function TagInput({ value, tags: tagsProp, onChange, suggestions = [], placeholder = 'Tag hinzufügen...' }: Props) {
  const tags = value ?? tagsProp ?? []
  const [input, setInput] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredSuggestions = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s),
  )

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed])
    setInput('')
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag))

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) { e.preventDefault(); addTag(input) }
    else if (e.key === 'Backspace' && !input && tags.length > 0) removeTag(tags[tags.length - 1])
    else if (e.key === 'Escape') setShowDropdown(false)
  }

  useEffect(() => {
    setShowDropdown(input.length > 0 && filteredSuggestions.length > 0)
  }, [input, filteredSuggestions.length])

  return (
    <div className="relative">
      <div
        className="flex flex-wrap gap-1.5 min-h-[38px] px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-indigo-400 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs rounded-full font-medium">
            {tag}
            <button type="button" onClick={(e) => { e.stopPropagation(); removeTag(tag) }} className="hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => input && setShowDropdown(filteredSuggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] outline-none text-sm bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400"
        />
      </div>
      {showDropdown && (
        <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
          {filteredSuggestions.slice(0, 8).map((s) => (
            <button key={s} type="button" onMouseDown={(e) => { e.preventDefault(); addTag(s) }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-700 dark:text-gray-200 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Enter oder Komma drücken, um Tag hinzuzufügen</p>
    </div>
  )
}

export { TagInput }
