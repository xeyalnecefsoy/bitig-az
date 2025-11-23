export function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  const stars = Array.from({ length: 5 }).map((_, i) => {
    if (i < full) return 'full'
    if (i === full && half) return 'half'
    return 'empty'
  })
  return (
    <div className="flex items-center gap-0.5 text-brand">
      {stars.map((s, i) => (
        <Star key={i} type={s} />
      ))}
    </div>
  )
}

function Star({ type }: { type: 'full' | 'half' | 'empty' }) {
  if (type === 'full') return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.85 1.416 8.26L12 19.771 4.584 23.858 6 15.598 0 9.748l8.332-1.73z"/></svg>
  if (type === 'half') return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><defs><linearGradient id="half"><stop offset="50%" stopColor="currentColor"/><stop offset="50%" stopColor="transparent"/></linearGradient></defs><path d="M12 .587l3.668 7.431L24 9.748l-6 5.85 1.416 8.26L12 19.771 4.584 23.858 6 15.598 0 9.748l8.332-1.73z" fill="url(#half)"/></svg>
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.85 1.416 8.26L12 19.771 4.584 23.858 6 15.598 0 9.748l8.332-1.73z"/></svg>
}
