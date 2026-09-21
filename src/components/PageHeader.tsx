export function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string
  title: string
  lede?: string
}) {
  return (
    <header className="max-w-2xl">
      <p className="text-[13px] text-[var(--muted)]">{eyebrow}</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-[2.7rem] leading-[1.05] tracking-[-0.03em] sm:text-5xl">
        {title}
      </h1>
      {lede ? <p className="mt-4 text-[1.05rem] leading-7 text-[var(--muted)]">{lede}</p> : null}
    </header>
  )
}
