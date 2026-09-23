import Link from 'next/link'
import {PageHeader} from '@/components/PageHeader'

export default function SettingsPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Your account" title="Settings" lede="Make yourself at home. Manage your library and reading preferences." />
      <section className="mt-10">
        <h2 className="font-display text-2xl">Library</h2>
        <Link href="/settings/library/import-export" className="surface mt-4 flex items-center justify-between gap-4 p-6 hover:bg-white">
          <div><h3 className="font-semibold">Import &amp; Export</h3><p className="mt-1 text-sm text-muted">Bring your Goodreads history to Everlogue, or take a copy of your library with you.</p></div>
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  )
}
