'use client'
import Link from 'next/link'
import {useEffect, useState} from 'react'
import {usePathname} from 'next/navigation'
import {SpaceColorPicker} from './SpaceColorPicker'
import {GlobalBookSearch} from './GlobalBookSearch'
import {SPACE_COLORS, spaceById, type SpaceColorId} from '@/lib/theme'

const NAV = [
  {href: '/', label: 'Discover'},
  {href: '/my-books', label: 'My Books'},
  {href: '/clubs', label: 'Book Clubs'},
]

export function AppShell({
  children,
  auth,
  signedIn = false,
  spaceColor,
}: {
  children: React.ReactNode
  auth: React.ReactNode
  signedIn?: boolean
  spaceColor?: string | null
}) {
  const pathname = usePathname()
  const [showcaseIndex, setShowcaseIndex] = useState(0)
  const [previewColor, setPreviewColor] = useState<string | null>(null)

  useEffect(() => {
    setPreviewColor(null)
  }, [spaceColor])

  useEffect(() => {
    if (signedIn) return
    setShowcaseIndex(Math.floor(Math.random() * SPACE_COLORS.length))
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches) return
    const timer = window.setInterval(() => {
      setShowcaseIndex((index) => (index + 1) % SPACE_COLORS.length)
    }, 8000)
    return () => window.clearInterval(timer)
  }, [signedIn])

  const color = signedIn ? spaceById(previewColor ?? spaceColor) : SPACE_COLORS[showcaseIndex]

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--space', color.hex)
    root.style.setProperty('--space-from', color.from)
    root.style.setProperty('--space-to', color.to)
    return () => {
      root.style.removeProperty('--space')
      root.style.removeProperty('--space-from')
      root.style.removeProperty('--space-to')
    }
  }, [color])

  return (
    <div
      className="app-frame"
      style={
        {
          '--space': color.hex,
          '--space-from': color.from,
          '--space-to': color.to,
        } as React.CSSProperties
      }
    >
      <div className="color-wash" aria-hidden="true" />
      <header className="top-nav sticky top-3 z-30 mb-5 px-3 py-2 sm:px-4 lg:top-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 pl-1">
            <span className="truncate font-display text-lg leading-none tracking-tight sm:text-xl">
              Everlogue
            </span>
          </Link>
          <nav className="top-nav-links order-3 w-full sm:order-0 sm:w-auto sm:flex-1 sm:justify-center">
            {NAV.map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item shrink-0 ${active ? 'is-active' : ''}`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3 overflow-visible">
            {signedIn ? (
              <SpaceColorPicker
                value={spaceColor}
                onPreview={(id: SpaceColorId) => setPreviewColor(id)}
              />
            ) : null}
            {auth}
          </div>
        </div>
        {/* {signedIn ? (
          <div className="mt-3">
            <GlobalBookSearch />
          </div>
        ) : null} */}
      </header>
      <div className="main-panel">
        <main className="mx-auto w-full max-w-7xl py-6 lg:py-10">{children}</main>
      </div>
    </div>
  )
}
