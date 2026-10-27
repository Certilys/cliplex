import { useEffect, useState } from 'react'
import type { LigneInspiration, Question, Style } from '../../../shared/types'
import { BarreHaut } from '../composants/Coquille'
import { Icone } from '../composants/Icone'
import { Pastille } from './Bienvenue'

export function MonStyle({ onInspirations }: { onInspirations: () => void }) {
  const [style, setStyle] = useState<Style | null>(null)
  const [occupe, setOccupe] = useState(false)
  const [ligne, setLigne] = useState('')
  const [texte, setTexte] = useState('')
  const [edition, setEdition] = useState(false)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    window.cliplex.style.lire().then((s) => {
      setStyle(s)
      setTexte(s.texte ?? '')
    })
    return window.cliplex.inspirations.journal((l: LigneInspiration) => l.id === 'style' && setLigne(l.texte))
  }, [])

  const mettreAJour = async () => {
    setOccupe(true)
    setErreur('')
    try {
      const s = await window.cliplex.style.synthetiser()
      setStyle(s)
      setTexte(s.texte ?? '')
    } catch (e) {
      setErreur(e instanceof Error ? e.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '') : String(e))
    }
    setOccupe(false)
  }

  if (!style) return null
  const enAttente = style.questions.filter((q) => !q.reponse).length

  return (
    <>
      <BarreHaut>
        <b className="text-[13px] font-semibold">Mon style</b>
        {style.existe && (
          <div className="ml-auto flex gap-2">
            <button className="btn-blanc" onClick={onInspirations}>
              <Icone nom="image" />
              Mes inspirations
            </button>
            <button className="btn-noir" disabled={occupe} onClick={mettreAJour}>
              <Icone nom="actualiser" />
              {occupe ? 'Claude réécrit ton style…' : 'Mettre à jour avec mes réponses'}
            </button>
          </div>
        )}
      </BarreHaut>
      {!style.existe ? (
        <div className="grid flex-1 place-items-center">
          <div className="max-w-sm text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-violet-fond text-violet">
              <Icone nom="reglages" taille={22} />
            </span>
            <h2 className="mt-4 text-[18px] font-bold">Pas encore de style</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muet">Ajoute quelques vidéos que tu aimes dans Inspirations. Claude les analyse et écrit ton style : rythme, textes, couleurs, polices.</p>
            <button className="btn-noir mt-5" onClick={onInspirations}>
              Ajouter des inspirations
            </button>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-10 py-8">
          <div className="max-w-[880px]">
            <div className="surtitre">Ton style</div>
            <h1 className="mt-1.5 text-[24px] font-bold tracking-[-0.02em]">{style.nom}</h1>
            <p className="mt-1.5 text-[14px] leading-normal text-muet">{style.resume}</p>
            <p className="mt-2 text-[12px] text-doux">
              Tiré de {style.sources.length} inspiration{style.sources.length > 1 ? 's' : ''}
              {style.majLe ? `, mis à jour le ${new Date(style.majLe).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` : ''}. Appliqué à chaque montage, sauf si tu le désactives pour une vidéo.
            </p>
            {occupe && ligne && <p className="mt-3 rounded-lg bg-violet-fond px-3 py-2 text-[12.5px] text-violet-fonce">{ligne}</p>}
            {erreur && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{erreur}</p>}

            {style.theme && <Theme theme={style.theme} />}

            {style.questions.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-3">
                  <h2 className="text-[15px] font-bold">Les questions de Claude</h2>
                  {enAttente > 0 ? <Pastille ton="v">{enAttente} sans réponse</Pastille> : <Pastille ton="ok">Toutes répondues</Pastille>}
                </div>
                <p className="mt-1 text-[12.5px] text-muet">Ce qu'il ne peut pas deviner en regardant. Tes réponses passent avant tout le reste.</p>
                <div className="mt-3 flex flex-col gap-2.5">
                  {style.questions.map((q) => (
                    <CarteQuestion key={q.id} question={q} onRepondre={async (r) => setStyle(await window.cliplex.style.repondre(q.id, r))} />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8">
              <div className="flex items-center gap-3">
                <h2 className="text-[15px] font-bold">Les règles, telles que Claude les lit</h2>
                <button className="ml-auto text-[12.5px] font-semibold text-violet hover:underline" onClick={async () => {
                  if (edition) setStyle(await window.cliplex.style.modifierTexte(texte))
                  setEdition(!edition)
                }}>
                  {edition ? 'Enregistrer' : 'Modifier à la main'}
                </button>
              </div>
              {edition ? (
                <textarea className="champ mt-3 h-[520px] resize-none font-mono text-[12px] leading-relaxed" value={texte} onChange={(e) => setTexte(e.target.value)} />
              ) : (
                <div className="carte mt-3 whitespace-pre-wrap p-5 text-[13px] leading-relaxed text-encre-2 select-text">{style.texte}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Theme({ theme }: { theme: NonNullable<Style['theme']> }) {
  const couleurs = [
    { nom: 'Accent', valeur: theme.accent },
    { nom: 'Texte', valeur: theme.texte },
    { nom: 'Fond', valeur: theme.fond }
  ].filter((c) => c.valeur)
  return (
    <div className="mt-6 grid grid-cols-[1fr_1fr] gap-3">
      <div className="carte p-4">
        <span className="libelle">Couleurs</span>
        <div className="flex gap-4">
          {couleurs.map((c) => (
            <div key={c.nom} className="flex items-center gap-2.5">
              <span className="h-8 w-8 rounded-lg border border-bord" style={{ background: c.valeur }} />
              <div>
                <b className="block text-[12.5px] font-semibold">{c.nom}</b>
                <code className="font-mono text-[11px] text-muet">{c.valeur}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="carte p-4">
        <span className="libelle">Polices</span>
        <div className="text-[13px]">
          <div>
            <span className="text-muet">Titres : </span>
            <b className="font-semibold">{theme.policeTitre ?? theme.police}</b>
          </div>
          <div className="mt-1">
            <span className="text-muet">Texte : </span>
            <b className="font-semibold">{theme.police}</b>
          </div>
        </div>
      </div>
    </div>
  )
}

function CarteQuestion({ question: q, onRepondre }: { question: Question; onRepondre: (r: string) => void }) {
  const [libre, setLibre] = useState(q.reponse && !q.choix?.includes(q.reponse) ? q.reponse : '')
  return (
    <div className={`carte p-4 ${q.reponse ? '' : 'border-violet-clair'}`}>
      <b className="block text-[13.5px] font-semibold">{q.question}</b>
      {q.pourquoi && <p className="mt-0.5 text-[12px] text-muet">{q.pourquoi}</p>}
      {!!q.choix?.length && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {q.choix.map((c) => (
            <button key={c} onClick={() => onRepondre(c)} className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium ${q.reponse === c ? 'border-violet bg-violet-fond text-violet-fonce' : 'border-bord hover:border-[#D4D4D8]'}`}>
              {c}
            </button>
          ))}
        </div>
      )}
      <form
        className="mt-2.5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          onRepondre(libre)
        }}
      >
        <input className="champ h-9" value={libre} onChange={(e) => setLibre(e.target.value)} placeholder={q.choix?.length ? 'Ou réponds avec tes mots' : 'Ta réponse'} />
        <button className="btn-blanc flex-none" disabled={!libre.trim() || libre === q.reponse}>
          Enregistrer
        </button>
      </form>
    </div>
  )
}
