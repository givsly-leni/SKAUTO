import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  loading?: boolean
  disabled?: boolean
  /** Shown under the field when there are no options to offer. */
  hint?: string
  maxVisible?: number
}

/**
 * Type-ahead picker that still accepts anything typed. Suggestions are a
 * convenience, never a constraint — the vehicle database doesn't cover every
 * market, so an unknown model must always be enterable by hand.
 */
export default function Combobox({
  value,
  onChange,
  options,
  placeholder,
  loading = false,
  disabled = false,
  hint,
  maxVisible = 60,
}: Props) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase()
    const pool = q
      ? options.filter((o) => o.toLowerCase().includes(q))
      : options
    // Exact prefix matches are more useful than mid-string ones.
    if (q) {
      pool.sort((a, b) => {
        const ap = a.toLowerCase().startsWith(q) ? 0 : 1
        const bp = b.toLowerCase().startsWith(q) ? 0 : 1
        return ap - bp
      })
    }
    return pool.slice(0, maxVisible)
  }, [options, value, maxVisible])

  useEffect(() => {
    if (!open) return
    function onDocClick(e: globalThis.MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  useEffect(() => setHighlight(0), [value])

  function choose(option: string) {
    onChange(option)
    setOpen(false)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true)
      return
    }
    if (!open || matches.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (h + 1) % matches.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (h - 1 + matches.length) % matches.length)
    } else if (e.key === 'Enter') {
      // Only hijack Enter when a suggestion is actively highlighted.
      e.preventDefault()
      choose(matches[highlight])
    }
  }

  return (
    <div className="combo" ref={wrapRef}>
      <div className="combo-field">
        <input
          type="text"
          value={value}
          disabled={disabled}
          placeholder={loading ? 'Loading…' : placeholder}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {value && !disabled && (
          <button
            type="button"
            className="combo-clear"
            aria-label="Clear"
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
          >
            ×
          </button>
        )}
      </div>

      {open && matches.length > 0 && (
        <ul className="combo-list" role="listbox">
          {matches.map((option, i) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={i === highlight}
                className={i === highlight ? 'combo-option active' : 'combo-option'}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => choose(option)}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}

      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}
