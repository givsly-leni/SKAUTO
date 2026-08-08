import { useState } from 'react'
import type { KeyboardEvent } from 'react'

interface Props {
  value: string[]
  onChange: (next: string[]) => void
}

/** Tag-style entry for the list of parts restored on a vehicle. */
export default function PartsInput({ value, onChange }: Props) {
  const [draft, setDraft] = useState('')

  function add() {
    const part = draft.trim()
    if (!part) return
    if (value.some((p) => p.toLowerCase() === part.toLowerCase())) {
      setDraft('')
      return
    }
    onChange([...value, part])
    setDraft('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="parts-input">
      {value.length > 0 && (
        <div className="chips">
          {value.map((part) => (
            <span key={part} className="chip">
              {part}
              <button
                type="button"
                aria-label={`Remove ${part}`}
                onClick={() => onChange(value.filter((p) => p !== part))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="parts-row">
        <input
          type="text"
          value={draft}
          placeholder="e.g. Brake discs"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className="btn btn-ghost" onClick={add}>
          Add
        </button>
      </div>
      <p className="hint">Press Enter to add each part.</p>
    </div>
  )
}
