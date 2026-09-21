export function EmptyState({title, body}: {title: string; body: string}) {
  return (
    <div className="surface px-7 py-11">
      <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.03em]">{title}</h2>
      <p className="mt-2 max-w-xl leading-7 text-[var(--muted)]">{body}</p>
    </div>
  )
}

export function ErrorState({title = 'Something went wrong', body}: {title?: string; body: string}) {
  return (
    <div className="surface px-7 py-11">
      <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-[-0.03em]">{title}</h2>
      <p className="mt-2 leading-7 text-[var(--muted)]">{body}</p>
    </div>
  )
}
