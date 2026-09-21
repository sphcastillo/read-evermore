'use client'

import Link from 'next/link'
import {SignedIn, SignedOut, UserButton, SignInButton} from '@clerk/nextjs'
import {usePathname} from 'next/navigation'

const NAV = [
  {href: '/', label: 'Discover', color: '#e8a888'},
  {href: '/browse', label: 'Browse', color: '#8aa58f'},
  {href: '/my-books', label: 'My Books', color: '#b7a6d4'},
  {href: '/clubs', label: 'Book Clubs', color: '#d98b7a'},
]

export function AppShell({children}: {children: React.ReactNode}) {
  const pathname = usePathname()
  const personal = pathname.startsWith('/my-books')

  return (
    <div className="app-frame">
      <div className="color-wash" aria-hidden="true" />
      <header className="top-nav sticky top-3 z-30 mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-4 lg:top-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 pl-1">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] bg-[color-mix(in_srgb,var(--peach)_80%,white)] text-base shadow-[inset_0_1px_0_white]">
            ∞
          </span>
          <span className="truncate font-[family-name:var(--font-display)] text-lg leading-none tracking-tight sm:text-xl">
            Read Evermore
          </span>
        </Link>
        <nav className="top-nav-links order-3 w-full sm:order-none sm:w-auto sm:flex-1 sm:justify-center">
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item shrink-0 ${active ? 'is-active' : ''}`}
              >
                <span className="nav-dot" style={{background: item.color}} />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto">
          <AuthControl />
        </div>
      </header>
      <div className={`main-panel ${personal ? 'personal-room' : ''}`}>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  )
}

function AuthControl() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <p className="max-w-[10rem] text-right text-xs leading-snug text-[var(--muted)]">Your shelves wait behind a sign-in.</p>
  }

  return (
    <>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="pill px-4 py-2 text-sm">Sign in</button>
        </SignInButton>
      </SignedOut>
    </>
  )
}
