import Link from 'next/link'
import {PageHeader} from '@/components/PageHeader'
import {GoodreadsImport} from '@/components/GoodreadsImport'

export default function ImportExportPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap gap-2 text-sm text-muted">
        <Link href="/settings" className="hover:underline">Settings</Link><span aria-hidden="true">/</span>
        <Link href="/settings/library" className="hover:underline">Library</Link><span aria-hidden="true">/</span>
        <span aria-current="page">Import &amp; Export</span>
      </nav>
      <PageHeader eyebrow="Library" title="Import & Export" lede="Your reading story belongs with you. Bring your books and reading history into Everlogue." />
      <GoodreadsImport />
      <section className="surface mt-8 p-6 sm:p-8">
        <h2 className="font-display text-2xl">Export your library</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Download your Read, Want To Read, and Currently Reading shelves, with available reading dates, as a CSV.</p>
        <a href="/api/library/export" className="pill mt-5 inline-flex px-5 py-2.5 text-sm" download>Download library CSV</a>
      </section>
    </div>
  )
}
