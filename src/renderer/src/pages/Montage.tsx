import { useEffect, useRef, useState } from 'react'
import type { EtapeMontage, Genre, LigneMontage, Projet, Style } from '../../../shared/types'
import { BarreHaut } from '../composants/Coquille'
import { Icone } from '../composants/Icone'
import { Pastille } from './Bienvenue'

const FORMATS: { id: Projet['format']; nom: string; usage: string }[] = [
  { id: '9x16', nom: '9:16', usage: 'Shorts, Reels, TikTok' },
  { id: '16x9', nom: '16:9', usage: 'YouTube, formation' },
  { id: '1x1', nom: '1:1', usage: 'Carré' },
  { id: '4x5', nom: '4:5', usage: 'Fil Instagram' }
]

const GENRES: { id: Genre; nom: string; texte: string; format: Projet['format'] }[] = [
  { id: 'formation', nom: 'Formation', texte: 'Chapitres, encarts, captures, schémas', format: '16x9' },
  { id: 'youtube', nom: 'YouTube', texte: 'Face caméra, plus de rythme', format: '16x9' },
  { id: 'court', nom: 'Court', texte: 'Shorts, Reels, TikTok', format: '9x16' },
  { id: 'pub', nom: 'Pub', texte: 'Courte, centrée sur le produit', format: '9x16' }
]

const STATUTS: Record<Projet['statut'], { nom: string; ton: 'ok' | 'v' | 'g' }> = {
  brouillon: { nom: 'Sans rush', ton: 'g' },
  pret: { nom: 'Prêt à monter', ton: 'v' },
  montage: { nom: 'Montage en cours', ton: 'v' },
  monte: { nom: 'Monté', ton: 'ok' }
}

const SUGGESTIONS = ['Chapitres pour chaque partie', "Captures d'écran quand je parle d'un outil", 'Sous-titres', 'Pas de musique', 'Je m’appelle …']

const taille = (o: number) => (o > 1e9 ? `${(o / 1e9).toFixed(1)} Go` : o > 1e6 ? `${Math.round(o / 1e6)} Mo` : `${Math.max(1, Math.round(o / 1e3))} Ko`)

export function Montage({ onChange }: { onChange: () => void }) {
  const [projets, setProjets] = useState<Projet[]>([])
  const [actif, setActif] = useState<string | null>(null)
  const [creation, setCreation] = useState(false)

  const charger = async () => {
    const p = await window.cliplex.projets.lister()
    setProjets(p)
    setActif((a) => a ?? p[0]?.id ?? null)
    onChange()
  }
  useEffect(() => {
    charger()
  }, [])

  const projet = projets.find((p) => p.id === actif)
  const remplacer = (p: Projet) => {
    setProjets((l) => l.map((x) => (x.id === p.id ? p : x)))
    onChange()
  }

  return (
    <>
      <BarreHaut>
        <div className="flex items-center gap-2 text-[13px] text-muet">
          Montage
          {projet && (
            <>
              <Icone nom="chevron" taille={14} />
              <b className="font-semibold text-encre">{projet.titre}</b>
              <Pastille ton={STATUTS[projet.statut].ton}>{STATUTS[projet.statut].nom}</Pastille>
            </>
          )}
        </div>
        <div className="ml-auto flex gap-2">
          {projet && (
            <button className="btn-blanc" onClick={() => window.cliplex.projets.ouvrirDossier(projet.id)}>
              <Icone nom="dossier" />
              Ouvrir le dossier
            </button>
          )}
          <button className="btn-noir" onClick={() => setCreation(true)}>
            <Icone nom="plus" />
            Nouvelle vidéo
          </button>
        </div>
      </BarreHaut>

      <div className="flex min-h-0 flex-1">
        <div className="w-[260px] flex-none overflow-y-auto border-r border-bord bg-white p-2.5">
          {projets.length === 0 && <p className="p-3 text-[12.5px] leading-normal text-muet">Aucune vidéo pour l'instant. Crée la première avec « Nouvelle vidéo ».</p>}
          {projets.map((p) => (
            <button key={p.id} onClick={() => setActif(p.id)} className={`mb-0.5 w-full rounded-lg px-3 py-2.5 text-left ${p.id === actif ? 'bg-violet-fond' : 'hover:bg-fond'}`}>
              <div className={`truncate text-[13px] font-semibold ${p.id === actif ? 'text-violet-fonce' : ''}`}>{p.titre}</div>
              <div className="mt-0.5 text-[11.5px] text-muet">
                {FORMATS.find((f) => f.id === p.format)?.nom} · {p.rushs.length} rush{p.rushs.length > 1 ? 's' : ''}
              </div>
            </button>
          ))}
        </div>
        {projet ? <Fiche key={projet.id} projet={projet} onChange={remplacer} /> : <Vide onCreer={() => setCreation(true)} />}
      </div>

      {creation && (
        <NouvelleVideo
          onFermer={() => setCreation(false)}
          onCreer={async (titre, format, genre) => {
            const p = await window.cliplex.projets.creer(titre, format, genre)
            setCreation(false)
            setActif(p.id)
            await charger()
          }}
        />
      )}
    </>
  )
}

function Vide({ onCreer }: { onCreer: () => void }) {
  return (
    <div className="grid flex-1 place-items-center">
      <div className="max-w-sm text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-violet-fond text-violet">
          <Icone nom="lecture" taille={22} />
        </span>
        <h2 className="mt-4 text-[18px] font-bold">Ta première vidéo</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muet">Donne-lui un titre, dépose ton rush déjà coupé, dis ce que tu veux. Cliplex s'occupe du reste.</p>
        <button className="btn-noir mt-5" onClick={onCreer}>
          <Icone nom="plus" />
          Nouvelle vidéo
        </button>
      </div>
    </div>
  )
}

const ETAPES: { id: EtapeMontage; nom: string }[] = [
  { id: 'preparation', nom: 'Préparation du rush' },
  { id: 'claude', nom: 'Montage par Claude' },
  { id: 'rendu', nom: 'Rendu final' }
]

function Fiche({ projet, onChange }: { projet: Projet; onChange: (p: Projet) => void }) {
  const [consignes, setConsignes] = useState(projet.consignes)
  const [lignes, setLignes] = useState<LigneMontage[]>([])
  const [etape, setEtape] = useState<EtapeMontage | undefined>(projet.etape)
  const [style, setStyle] = useState<Style | null>(null)
  const enCours = projet.statut === 'montage'

  useEffect(() => {
    window.cliplex.style.lire().then(setStyle)
  }, [])

  useEffect(
    () =>
      window.cliplex.montage.journal((l) => {
        if (l.id !== projet.id) return
        setEtape(l.etape)
        setLignes((x) => [...x.slice(-300), l])
      }),
    [projet.id]
  )

  const lancer = async () => {
    await modifier({ consignes })
    setLignes([])
    setEtape('preparation')
    onChange({ ...projet, consignes, statut: 'montage', etape: 'preparation', erreur: undefined })
    onChange(await window.cliplex.montage.lancer(projet.id))
  }
  const modifier = async (partiel: Partial<Projet>) => onChange(await window.cliplex.projets.modifier(projet.id, partiel))
  const ajouter = (s: string) => {
    const c = consignes.trim() ? `${consignes.trim()}\n${s}.` : `${s}.`
    setConsignes(c)
    modifier({ consignes: c })
  }

  return (
    <div className="flex min-w-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col bg-nuit-4">
        <div className="relative grid flex-1 place-items-center">
          <div className="absolute left-4 top-4 flex gap-1 rounded-lg bg-nuit-2 p-[3px]">
            {FORMATS.map((f) => (
              <button key={f.id} onClick={() => modifier({ format: f.id })} className={`rounded-md px-2.5 py-1.5 text-[11.5px] font-semibold ${f.id === projet.format ? 'bg-[#34303F] text-white' : 'text-[#8C879A] hover:text-white'}`}>
                {f.nom}
              </button>
            ))}
          </div>
          {enCours || (projet.erreur && lignes.length) ? (
            <Progression etape={etape} lignes={lignes} />
          ) : projet.video ? (
            <video key={projet.video + projet.majLe} src={window.cliplex.projets.adresse(projet.id, projet.video)} controls className="max-h-[78%] max-w-[86%] rounded-[14px] bg-black" />
          ) : (
            <Cadre format={projet.format} vide={!projet.rushs.length} />
          )}
        </div>
        <div className="flex h-12 flex-none items-center justify-center border-t border-white/5 text-[12px] text-[#8C879A]">
          {projet.rushs.length ? `${projet.rushs.length} rush${projet.rushs.length > 1 ? 's' : ''} · ${FORMATS.find((f) => f.id === projet.format)?.usage}` : 'Ajoute un rush pour voir l’aperçu'}
        </div>
      </div>

      <aside className="flex w-[360px] flex-none flex-col border-l border-bord bg-white">
        <div className="border-b border-bord-2 px-5 pb-3.5 pt-[18px] text-[15px] font-bold">Avant de lancer</div>
        <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto px-5 py-[18px]">
          <div>
            <span className="libelle">Rushs</span>
            <div className="flex flex-col gap-2">
              {projet.rushs.map((r) => (
                <div key={r.nom} className="flex items-center gap-3 rounded-[10px] border border-bord p-2.5">
                  <i className="h-[42px] w-8 flex-none rounded-md bg-[#3A3446]" />
                  <div className="min-w-0">
                    <b className="block truncate text-[13px] font-semibold">{r.nom}</b>
                    <small className="text-[11.5px] text-muet">{taille(r.taille)}</small>
                  </div>
                </div>
              ))}
              <button className="flex items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#D4D4D8] py-3 text-[12.5px] font-semibold text-muet hover:border-violet-clair hover:text-violet" onClick={async () => onChange(await window.cliplex.projets.ajouterRushs(projet.id))}>
                <Icone nom="plus" />
                Ajouter un rush
              </button>
            </div>
          </div>
          <div>
            <span className="libelle">Genre</span>
            <div className="grid grid-cols-2 gap-1.5">
              {GENRES.map((g) => (
                <button key={g.id} onClick={() => modifier({ genre: g.id })} className={`rounded-lg border px-2.5 py-2 text-left ${g.id === (projet.genre ?? 'formation') ? 'border-violet shadow-[0_0_0_3px_#F2EAFC]' : 'border-bord hover:border-[#D4D4D8]'}`}>
                  <b className="block text-[12.5px] font-semibold">{g.nom}</b>
                  <small className="text-[11px] leading-tight text-muet">{g.texte}</small>
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="libelle">Style</span>
            {style?.existe ? (
              <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-bord p-3">
                <input type="checkbox" className="h-4 w-4 accent-[#8E44E0]" checked={projet.avecStyle !== false} onChange={(e) => modifier({ avecStyle: e.target.checked })} />
                <span className="min-w-0">
                  <b className="block truncate text-[13px] font-semibold">Appliquer mon style</b>
                  <small className="block truncate text-[11.5px] text-muet">{style.nom}</small>
                </span>
              </label>
            ) : (
              <p className="rounded-[10px] border border-dashed border-[#D4D4D8] p-3 text-[12px] leading-snug text-muet">Pas encore de style : le montage restera sobre. Ajoute des inspirations pour que Claude apprenne ce que tu aimes.</p>
            )}
          </div>
          <div>
            <span className="libelle">Tes consignes</span>
            <textarea className="champ min-h-[110px] resize-none leading-relaxed" value={consignes} placeholder="Ex. : je m'appelle Léa, formatrice. Montre le site de Supabase quand j'en parle. Trois chapitres." onChange={(e) => setConsignes(e.target.value)} onBlur={() => modifier({ consignes })} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => ajouter(s)} className="rounded-full border border-dashed border-[#D4D4D8] px-2.5 py-1 text-[12px] font-medium text-encre-2 hover:border-violet-clair hover:text-violet">
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-bord-2 px-5 py-3.5">
          {projet.erreur && !enCours && <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">{projet.erreur}</p>}
          {enCours ? (
            <button className="btn-blanc h-10" onClick={() => window.cliplex.montage.arreter(projet.id)}>
              Arrêter le montage
            </button>
          ) : (
            <button className="btn-violet h-10" disabled={!projet.rushs.length} onClick={lancer}>
              {projet.video ? 'Refaire le montage' : 'Lancer le montage'}
            </button>
          )}
          <small className="text-center text-[11.5px] text-doux">
            {!projet.rushs.length ? 'Ajoute d’abord un rush' : enCours ? 'Tu peux continuer à utiliser Cliplex pendant ce temps' : 'Préparation, montage par Claude, puis rendu'}
          </small>
        </div>
      </aside>
    </div>
  )
}

function Progression({ etape, lignes }: { etape?: EtapeMontage; lignes: LigneMontage[] }) {
  const bas = useRef<HTMLDivElement>(null)
  useEffect(() => bas.current?.scrollIntoView({ block: 'end' }), [lignes])
  const rang = ETAPES.findIndex((e) => e.id === etape)
  return (
    <div className="flex h-[78%] w-[min(620px,86%)] flex-col rounded-[14px] border border-white/10 bg-nuit-2 p-5 text-white">
      <div className="flex gap-2">
        {ETAPES.map((e, i) => (
          <div key={e.id} className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-medium ${i === rang ? 'bg-white/10 text-white' : i < rang ? 'text-[#5FD39A]' : 'text-[#6E6880]'}`}>
            {i < rang ? <Icone nom="coche" taille={14} /> : i === rang ? <span className="tourne h-3.5 w-3.5 rounded-full border-2 border-white/20 border-t-violet-clair" /> : <span className="h-3.5 w-3.5 rounded-full border border-white/20" />}
            {e.nom}
          </div>
        ))}
      </div>
      <div className="mt-4 flex-1 overflow-y-auto font-mono text-[11.5px] leading-[1.7] text-[#B4AFC1] select-text">
        {lignes.length === 0 && <div className="text-[#6E6880]">Démarrage…</div>}
        {lignes.map((l, i) => (
          <div key={i} className={l.etape === 'claude' && !l.texte.startsWith('{') ? 'text-white' : ''}>
            {l.texte}
          </div>
        ))}
        <div ref={bas} />
      </div>
    </div>
  )
}

function Cadre({ format, vide }: { format: Projet['format']; vide: boolean }) {
  const dims = { '9x16': [236, 420], '16x9': [560, 315], '1x1': [380, 380], '4x5': [320, 400] }[format]
  return (
    <div className="grid place-items-center rounded-[14px] border border-white/5 bg-gradient-to-b from-[#2B2635] to-[#1B1822] text-[12.5px] text-[#6E6880]" style={{ width: dims[0], height: dims[1] }}>
      {vide ? 'Aucun rush' : ''}
    </div>
  )
}

function NouvelleVideo({ onFermer, onCreer }: { onFermer: () => void; onCreer: (titre: string, format: Projet['format'], genre: Genre) => void }) {
  const [titre, setTitre] = useState('')
  const [genre, setGenre] = useState<Genre>('formation')
  const [format, setFormat] = useState<Projet['format']>('16x9')
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={onFermer}>
      <div className="flex h-full w-[420px] flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-bord-2 px-6 pb-4 pt-6">
          <div className="text-[17px] font-bold">Nouvelle vidéo</div>
          <p className="mt-1 text-[12.5px] text-muet">Un titre, un genre, un format. Tu ajoutes le rush juste après.</p>
        </div>
        <form
          className="flex flex-1 flex-col gap-5 px-6 py-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (titre.trim()) onCreer(titre, format, genre)
          }}
        >
          <label>
            <span className="libelle">Titre</span>
            <input autoFocus className="champ" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. : Pourquoi j'utilise Supabase" />
          </label>
          <div>
            <span className="libelle">Genre</span>
            <div className="grid grid-cols-2 gap-2">
              {GENRES.map((g) => (
                <button
                  type="button"
                  key={g.id}
                  onClick={() => {
                    setGenre(g.id)
                    setFormat(g.format)
                  }}
                  className={`rounded-[10px] border p-3 text-left ${g.id === genre ? 'border-violet shadow-[0_0_0_3px_#F2EAFC]' : 'border-bord hover:border-[#D4D4D8]'}`}
                >
                  <b className="block text-[14px] font-semibold">{g.nom}</b>
                  <small className="text-[12px] text-muet">{g.texte}</small>
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="libelle">Format</span>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map((f) => (
                <button type="button" key={f.id} onClick={() => setFormat(f.id)} className={`rounded-[10px] border p-3 text-left ${f.id === format ? 'border-violet shadow-[0_0_0_3px_#F2EAFC]' : 'border-bord hover:border-[#D4D4D8]'}`}>
                  <b className="block text-[14px] font-semibold">{f.nom}</b>
                  <small className="text-[12px] text-muet">{f.usage}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-auto flex justify-end gap-2">
            <button type="button" className="btn-fantome" onClick={onFermer}>
              Annuler
            </button>
            <button className="btn-noir" disabled={!titre.trim()}>
              Créer la vidéo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
