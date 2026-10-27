import { useEffect, useState } from 'react'
import type { EtatChrome, Inspiration, LigneInspiration, Style } from '../../../shared/types'
import { Activite } from '../composants/Activite'
import { BarreHaut } from '../composants/Coquille'
import { Icone } from '../composants/Icone'
import { Pastille } from './Bienvenue'

const ETATS: Record<Inspiration['etat'], { nom: string; ton: 'ok' | 'v' | 'g' }> = {
  nouvelle: { nom: 'À analyser', ton: 'g' },
  analyse: { nom: 'Analyse en cours', ton: 'v' },
  analysee: { nom: 'Analysée', ton: 'ok' },
  erreur: { nom: 'À relancer', ton: 'g' }
}

/** Page Inspirations de l'app. */
export function Inspirations({ onStyle }: { onStyle: () => void }) {
  return (
    <>
      <BarreHaut>
        <b className="text-[13px] font-semibold">Inspirations</b>
      </BarreHaut>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-10 py-8">
        <h1 className="text-[22px] font-bold tracking-[-0.02em]">Les vidéos qui te ressemblent</h1>
        <p className="mt-1.5 max-w-[680px] text-[13.5px] leading-normal text-muet">
          Dépose des vidéos ou des images dont tu aimes le montage, ou colle des liens YouTube. Claude les regarde, note ce qui fait leur style, et en tire <b className="font-semibold text-encre">ton style</b>, appliqué à chaque montage. Tout reste dans ton dossier Cliplex.
        </p>
        <ZoneInspirations onStyle={onStyle} />
      </div>
    </>
  )
}

/** Dépôt, liens, analyse et création du style : partagé par la page et l'accueil. */
export function ZoneInspirations({ onStyle, compact }: { onStyle?: () => void; compact?: boolean }) {
  const [liste, setListe] = useState<Inspiration[]>([])
  const [journal, setJournal] = useState<LigneInspiration[]>([])
  const [occupe, setOccupe] = useState<'analyse' | 'style' | null>(null)
  const [style, setStyle] = useState<Style | null>(null)
  const [chrome, setChrome] = useState<EtatChrome | null>(null)
  const [erreur, setErreur] = useState('')
  const [survol, setSurvol] = useState(false)

  const charger = async () => {
    setListe(await window.cliplex.inspirations.lister())
    setStyle(await window.cliplex.style.lire())
  }
  useEffect(() => {
    charger()
    window.cliplex.claude.chrome().then(setChrome)
    const t = setInterval(() => window.cliplex.claude.chrome().then(setChrome), 5000)
    const stop = window.cliplex.inspirations.journal((l) => setJournal((j) => [...j.slice(-300), l]))
    return () => {
      clearInterval(t)
      stop()
    }
  }, [])

  const ajouts = async (p: Promise<Inspiration[]>) => {
    setErreur('')
    const nouvelles = await p
    if (nouvelles.length) await charger()
  }

  const analyser = async (id: string) => {
    setListe((l) => l.map((i) => (i.id === id ? { ...i, etat: 'analyse' } : i)))
    await window.cliplex.inspirations.analyser(id)
    await charger()
  }

  // Analyse tout ce qui ne l'est pas encore, une inspiration après l'autre, puis écrit le style.
  const toutAnalyser = async () => {
    setOccupe('analyse')
    setErreur('')
    setJournal([])
    for (const i of await window.cliplex.inspirations.lister()) if (i.etat === 'nouvelle' || i.etat === 'erreur') await analyser(i.id)
    if ((await window.cliplex.inspirations.lister()).some((i) => i.etat === 'analysee')) await creerStyle()
    setOccupe(null)
  }

  const creerStyle = async () => {
    setOccupe('style')
    try {
      setStyle(await window.cliplex.style.synthetiser())
    } catch (e) {
      setErreur(e instanceof Error ? e.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '') : String(e))
    }
    setOccupe(null)
  }

  const aAnalyser = liste.filter((i) => i.etat === 'nouvelle' || i.etat === 'erreur').length
  const analysees = liste.filter((i) => i.etat === 'analysee').length
  const styleAJour = style?.existe && liste.filter((i) => i.etat === 'analysee').every((i) => style.sources.includes(i.id))

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className={`grid gap-3 ${compact ? 'grid-cols-[1fr_1fr]' : 'max-w-[980px] grid-cols-[1fr_1fr]'}`}>
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setSurvol(true)
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={(e) => {
            e.preventDefault()
            setSurvol(false)
            const chemins = [...e.dataTransfer.files].map((f) => window.cliplex.inspirations.cheminDe(f)).filter(Boolean)
            ajouts(window.cliplex.inspirations.deposer(chemins))
          }}
          className={`flex flex-col items-center justify-center rounded-xl border border-dashed p-5 text-center ${survol ? 'border-violet bg-violet-fond' : 'border-[#D4D4D8] bg-white'}`}
        >
          <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-violet-fond text-violet">
            <Icone nom="image" taille={19} />
          </span>
          <b className="mt-2.5 text-[13.5px] font-semibold">Vidéos ou images</b>
          <p className="mt-0.5 text-[12px] text-muet">Glisse-les ici, ou</p>
          <button className="btn-blanc mt-2.5 h-8 text-[12.5px]" onClick={() => ajouts(window.cliplex.inspirations.ajouterFichiers())}>
            Choisir des fichiers
          </button>
        </div>
        <AjoutLien chrome={chrome} onAjout={charger} onErreur={setErreur} />
      </div>

      {erreur && <p className={`rounded-lg bg-red-50 px-3 py-2 text-[12.5px] text-red-700 ${compact ? '' : 'max-w-[980px]'}`}>{erreur}</p>}

      {liste.length > 0 && (
        <div className={compact ? '' : 'max-w-[980px]'}>
          <div className="mb-2.5 flex items-center gap-3">
            <span className="libelle mb-0">
              {liste.length} inspiration{liste.length > 1 ? 's' : ''} · {analysees} analysée{analysees > 1 ? 's' : ''}
            </span>
            <div className="ml-auto flex gap-2">
              {analysees > 0 && !aAnalyser && !styleAJour && !occupe && !liste.some((i) => i.etat === 'analyse') && (
                <button className="btn-blanc h-8 text-[12.5px]" disabled={!!occupe} onClick={creerStyle}>
                  {style?.existe ? 'Mettre à jour mon style' : 'Créer mon style'}
                </button>
              )}
              <button className="btn-violet h-8 text-[12.5px]" disabled={!!occupe || !aAnalyser} onClick={toutAnalyser}>
                {occupe === 'analyse' ? 'Analyse en cours…' : occupe === 'style' ? 'Écriture du style…' : aAnalyser ? `Analyser ${aAnalyser > 1 ? `les ${aAnalyser}` : ''} et créer mon style` : 'Tout est analysé'}
              </button>
            </div>
          </div>
          <div className={`grid gap-2.5 ${compact ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {liste.map((i) => (
              <CarteInspiration key={i.id} inspiration={i} derniere={[...journal].reverse().find((l) => l.id === i.id && l.genre !== 'technique')?.texte} onAnalyser={() => analyser(i.id)} onSupprimer={async () => (await window.cliplex.inspirations.supprimer(i.id), charger())} occupe={!!occupe} />
            ))}
          </div>
        </div>
      )}

      {(occupe || journal.length > 0) && (
        <Activite lignes={journal} enCours={!!occupe || liste.some((i) => i.etat === 'analyse')} source={(id) => (id === 'style' ? 'Ton style' : liste.find((i) => i.id === id)?.titre ?? id)} className={compact ? 'h-[240px]' : 'h-[320px] max-w-[980px]'} />
      )}

      {style?.existe && !occupe && (
        <div className={`carte flex items-center gap-4 p-4 ${compact ? '' : 'max-w-[980px]'}`}>
          <span className="grid h-10 w-10 flex-none place-items-center rounded-[10px] bg-vert-fond text-vert">
            <Icone nom="coche" taille={18} />
          </span>
          <div className="min-w-0 flex-1">
            <b className="block text-[14px] font-semibold">Ton style : {style.nom ?? 'prêt'}</b>
            <p className="truncate text-[12.5px] text-muet">{style.resume}</p>
          </div>
          {style.questions.some((q) => !q.reponse) && <Pastille ton="v">{style.questions.filter((q) => !q.reponse).length} question{style.questions.filter((q) => !q.reponse).length > 1 ? 's' : ''} de Claude</Pastille>}
          {onStyle && (
            <button className="btn-noir h-8 text-[12.5px]" onClick={onStyle}>
              Voir mon style
              <Icone nom="fleche" taille={14} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function AjoutLien({ chrome, onAjout, onErreur }: { chrome: EtatChrome | null; onAjout: () => void; onErreur: (e: string) => void }) {
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const ajouter = async () => {
    try {
      await window.cliplex.inspirations.ajouterLien(url, note)
      setUrl('')
      setNote('')
      onErreur('')
      onAjout()
    } catch (e) {
      onErreur(e instanceof Error ? e.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '') : String(e))
    }
  }
  return (
    <div className="flex flex-col rounded-xl border border-bord bg-white p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-fond text-encre-2">
          <Icone nom="lien" taille={16} />
        </span>
        <b className="text-[13.5px] font-semibold">Un lien YouTube</b>
      </div>
      <form
        className="mt-3 flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (url.trim()) ajouter()
        }}
      >
        <input className="champ" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
        <div className="flex gap-2">
          <input className="champ" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ce que tu aimes dedans (facultatif)" />
          <button className="btn-noir flex-none" disabled={!url.trim()}>
            Ajouter
          </button>
        </div>
      </form>
      {chrome && !chrome.extension && (
        <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-fond px-3 py-2 text-[12px] leading-snug text-muet">
          <Icone nom="globe" taille={15} className="text-encre-2" />
          <span className="flex-1">Pour regarder un lien, Claude utilise Chrome avec l'extension Claude.</span>
          <button className="font-semibold text-violet hover:underline" onClick={() => window.cliplex.claude.installerExtension()}>
            L'installer
          </button>
        </div>
      )}
    </div>
  )
}

function CarteInspiration({ inspiration: i, derniere, onAnalyser, onSupprimer, occupe }: { inspiration: Inspiration; derniere?: string; onAnalyser: () => void; onSupprimer: () => void; occupe: boolean }) {
  const adresse = (f: string) => window.cliplex.inspirations.adresse(i.id, f)
  const cours = i.etat === 'analyse'
  return (
    <div className={`carte flex flex-col overflow-hidden ${cours ? 'border-violet-clair shadow-[0_0_0_3px_#F2EAFC]' : ''}`}>
      <div className="relative aspect-video bg-nuit-3">
        {i.type === 'image' && <img src={adresse(`media/${i.source}`)} className="h-full w-full object-cover" />}
        {i.type === 'video' && <video src={`${adresse(`media/${i.source}`)}#t=2`} muted preload="metadata" className="h-full w-full object-cover" />}
        {i.type === 'lien' &&
          (idYoutube(i.source) ? (
            <img src={`https://i.ytimg.com/vi/${idYoutube(i.source)}/hqdefault.jpg`} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-[#8C879A]">
              <Icone nom="youtube" taille={30} />
            </div>
          ))}
        <span className="absolute left-2 top-2">
          <Pastille ton={ETATS[i.etat].ton}>{ETATS[i.etat].nom}</Pastille>
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <b className="line-clamp-2 text-[12.5px] font-semibold leading-snug">{i.titre}</b>
        {i.note && i.etat !== 'analysee' && <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-muet">« {i.note} »</p>}
        {i.etat === 'analysee' && <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-muet">{i.style}</p>}
        {cours && derniere && <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-violet-fonce">{derniere}</p>}
        {i.etat === 'erreur' && i.erreur && <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-red-700">{i.erreur}</p>}
        <div className="mt-auto flex items-center gap-1 pt-2.5">
          {i.etat === 'analysee' && <span className="text-[11.5px] text-doux">{i.regles?.length ?? 0} règles</span>}
          {cours ? (
            <button className="ml-auto inline-flex items-center gap-1 text-[11.5px] font-semibold text-muet hover:text-encre" onClick={() => window.cliplex.inspirations.arreter(i.id)}>
              <Icone nom="stop" taille={13} />
              Arrêter
            </button>
          ) : (
            <>
              {i.etat !== 'nouvelle' && (
                <button className="ml-auto text-[11.5px] font-semibold text-muet hover:text-encre disabled:opacity-40" disabled={occupe} onClick={onAnalyser}>
                  {i.etat === 'analysee' ? 'Revoir' : 'Relancer'}
                </button>
              )}
              <button className={`${i.etat === 'nouvelle' ? 'ml-auto' : 'ml-2'} text-muet hover:text-red-700 disabled:opacity-40`} disabled={occupe} onClick={onSupprimer} title="Retirer">
                <Icone nom="poubelle" taille={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const idYoutube = (url: string) => url.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/)?.[1]
