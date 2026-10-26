/** Marque Cliplex : un C tranché net, la lecture qui part vers l'avant. */
export function Marque({ taille = 24, sombre = false }: { taille?: number; sombre?: boolean }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 100 100" fill="none" aria-hidden>
      <path d="M72.6 27.4A32 32 0 1 0 72.6 72.6" stroke={sombre ? '#B67FE8' : '#8E44E0'} strokeWidth="15" />
      <path d="M60 37v26l22-13z" fill={sombre ? '#fff' : '#111014'} />
    </svg>
  )
}

export function Logo({ sombre = false, taille = 24 }: { sombre?: boolean; taille?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <Marque taille={taille} sombre={sombre} />
      <span className={`font-marque font-bold tracking-[-0.02em] ${sombre ? 'text-white' : 'text-encre'}`} style={{ fontSize: taille * 0.78 }}>
        cliplex
      </span>
    </span>
  )
}
