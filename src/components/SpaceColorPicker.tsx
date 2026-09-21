'use client'

import {useEffect, useOptimistic, useRef, useState, useTransition} from 'react'
import {saveSpaceColorAction} from '@/lib/server-actions'
import {DEFAULT_SPACE_COLOR, SPACE_COLORS, type SpaceColorId} from '@/lib/theme'

export function SpaceColorPicker({value}: {value?: string | null}) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const root = useRef<HTMLDivElement>(null)
  const [optimistic, addOptimistic] = useOptimistic(
    (value as SpaceColorId | undefined) || DEFAULT_SPACE_COLOR,
    (_current: SpaceColorId, next: SpaceColorId) => next,
  )
  const current = SPACE_COLORS.find((item) => item.id === optimistic) || SPACE_COLORS[0]

  useEffect(() => {
    if (!open) return
    function close(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  function choose(id: SpaceColorId) {
    setOpen(false)
    start(async () => {
      addOptimistic(id)
      await saveSpaceColorAction(id)
    })
  }

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        className="space-swatch"
        style={{background: current.hex}}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Space color: ${current.label}. Change your space.`}
        disabled={pending}
        onClick={() => setOpen((next) => !next)}
      />
      {open ? (
        <div className="space-menu" role="listbox" aria-label="Space colors">
          <p>Your space</p>
          <ul>
            {SPACE_COLORS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={item.id === current.id}
                  aria-label={item.label}
                  title={item.label}
                  className={`space-choice ${item.id === current.id ? 'is-active' : ''}`}
                  style={{background: item.hex}}
                  onClick={() => choose(item.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
