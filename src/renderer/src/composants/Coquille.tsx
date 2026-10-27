import type { ReactNode } from 'react'
import { Icone, type NomIcone } from './Icone'
import { Logo } from './Logo'

export type Page = 'accueil' | 'idees' | 'planning' | 'tournage' | 'montage' | 'inspirations' | 'style' | 'sons'

const GROUPES: { titre?: string; liens: { id: Page; nom: string; icone: NomIcone }[] }[] = [
  { liens: [{ id: 'accueil', nom: 'Accueil', icone: 'maison' }] },
  {
    titre: 'Créer',
    liens: [
      { id: 'idees', nom: 'Idées et scripts', icone: 'ampoule' },
      { id: 'planning', nom: 'Planning', icone: 'calendrier' },
      { id: 'tournage', nom: 'Tournage', icone: 'telephone' },
      { id: 'montage', nom: 'Montage', icone: 'lecture' }
    ]
  },
  {
    titre: 'Bibliothèque',
    liens: [
      { id: 'inspirations', nom: 'Inspirations', icone: 'image' },
      { id: 'style', nom: 'Mon style', icone: 'reglages' },
      { id: 'sons', nom: 'Sons et musiques', icone: 'musique' }
    ]
  }
]

export function Coquille({ page, onPage, compteur, claude, children }: { page: Page; onPage: (p: Page) => void; compteur: Partial<Record<Page, number>>; claude: string; children: ReactNode }) {
  return (
    <div className="flex h-full">
      <aside className="flex w-[232px] flex-none flex-col bg-nuit pb-3.5 text-white">
        <div className="glisser h-12 flex-none" />
        <div className="px-5 pb-3.5">
          <Logo sombre taille={22} />
        </div>
        <nav className="flex flex-col">
          {GROUPES.map((g, i) => (
            <div key={i}>
              {g.titre && <div className="px-[22px] pb-1.5 pt-3.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#6E6880]">{g.titre}</div>}
              {g.liens.map((l) => {
                const on = l.id === page
                return (
                  <button
                    key={l.id}
                    onClick={() => onPage(l.id)}
                    className={`mx-2.5 my-px flex w-[calc(100%-20px)] items-center gap-2.5 rounded-[7px] px-3 py-2 text-left text-[13px] font-medium ${on ? 'bg-white/10 text-white' : 'text-[#B4AFC1] hover:bg-white/5 hover:text-white'}`}
                  >
                    <Icone nom={l.icone} className={on ? 'text-violet-clair' : ''} />
                    {l.nom}
                    {!!compteur[l.id] && <span className="ml-auto text-[11px] text-[#8C879A]">{compteur[l.id]}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="mx-3 mt-auto flex items-center gap-2.5 rounded-[9px] border border-white/10 bg-nuit-2 p-2.5">
          <span className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-violet text-[12px] font-bold">C</span>
          <div className="min-w-0">
            <b className="block text-[12.5px] font-semibold">Claude Code</b>
            <small className={`block truncate text-[11px] ${claude === 'Connecté' ? 'text-[#5FD39A]' : 'text-[#F2A7A0]'}`}>{claude}</small>
          </div>
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  )
}

export function BarreHaut({ children }: { children: ReactNode }) {
  return <div className="glisser flex h-14 flex-none items-center gap-3 border-b border-bord bg-white px-5">{children}</div>
}
