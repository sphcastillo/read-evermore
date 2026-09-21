import type {Metadata} from 'next'
import {ClerkProvider} from '@clerk/nextjs'
import {Figtree, Fraunces} from 'next/font/google'
import {AppShell} from '@/components/AppShell'
import {AuthControl} from '@/components/AuthControl'
import {getOptionalReader} from '@/lib/reader'
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

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const reader = await getOptionalReader()

  return (
    <html lang="en">
      <body
        className={`${display.variable} ${sans.variable} antialiased`}
        style={{fontFamily: 'var(--font-figtree), ui-sans-serif, system-ui'}}
      >
        <ClerkProvider>
          <AppShell auth={<AuthControl />} signedIn={Boolean(reader)} spaceColor={reader?.spaceColor}>
            {children}
          </AppShell>
        </ClerkProvider>
      </body>
    </html>
  )
}
