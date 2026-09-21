import type {Metadata} from 'next'
import {ClerkProvider} from '@clerk/nextjs'
import {Figtree, Fraunces} from 'next/font/google'
import {AppShell} from '@/components/AppShell'
import './globals.css'

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
})

const sans = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
})

export const metadata: Metadata = {
  title: {
    default: 'Read Evermore',
    template: '%s · Read Evermore',
  },
  description: 'A home for everything you read.',
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  const content = (
    <html lang="en">
      <body
        className={`${display.variable} ${sans.variable} antialiased`}
        style={{fontFamily: 'var(--font-figtree), ui-sans-serif, system-ui'}}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return content
  }

  return <ClerkProvider>{content}</ClerkProvider>
}
