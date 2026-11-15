import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Contrast, LayoutDashboard, MapPinned, ShieldCheck, Smartphone, Sparkles } from 'lucide-react'
import Clara, { NOME } from './Clara'

const ESCALAS = ['100%', '115%', '130%']

function lerPref(chave: string, padrao: string) {
  try { return localStorage.getItem(chave) ?? padrao } catch { return padrao }
}
function salvarPref(chave: string, valor: string) {
  try { localStorage.setItem(chave, valor) } catch { /* sem armazenamento: só não lembra */ }
}

export function ControlesAcessibilidade({ escuro = false }: { escuro?: boolean }) {
  const [escala, setEscala] = useState(() => lerPref('escala', '100%'))
  const [contraste, setContraste] = useState(() => lerPref('contraste', 'normal'))
  useEffect(() => { document.documentElement.style.setProperty('--escala', escala); salvarPref('escala', escala) }, [escala])
  useEffect(() => { document.documentElement.dataset.contraste = contraste; salvarPref('contraste', contraste) }, [contraste])

  const ativo = escuro ? 'bg-white text-marinho' : 'bg-tinta text-papel'
  const solto = escuro ? 'text-white/80 hover:bg-white/10' : 'hover:bg-nevoa'
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Acessibilidade">
      {ESCALAS.map((e, i) => (
        <button key={e} onClick={() => setEscala(e)} aria-pressed={escala === e} aria-label={`Tamanho do texto ${i + 1} de 3`}
          className={`h-9 min-w-9 rounded-lg px-2 font-bold ${escala === e ? ativo : solto}`} style={{ fontSize: `${14 + i * 3}px` }}>
          A
        </button>
      ))}
      <button onClick={() => setContraste(contraste === 'alto' ? 'normal' : 'alto')} aria-pressed={contraste === 'alto'}
        aria-label="Alto contraste" title="Alto contraste"
        className={`ml-1 grid h-9 w-9 place-items-center rounded-lg ${contraste === 'alto' ? ativo : solto}`}>
        <Contrast size={18} aria-hidden="true" />
      </button>
    </div>
  )
}

export function Marca({ escuro = true }: { escuro?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <Clara tamanho={44} fundo="#F5C400" titulo="" />
      <span className="leading-tight">
        <span className={`block text-2xl font-extrabold tracking-tight ${escuro ? 'text-white' : 'text-tinta'}`}>{NOME}</span>
        <span className={`block text-[13px] ${escuro ? 'text-white/65' : 'text-tinta-suave'}`}>a assistente do seu posto</span>
      </span>
    </span>
  )
}

const LINKS = [
  { to: '/painel', rotulo: 'Painel da UBS', Icone: LayoutDashboard },
  { to: '/visitas', rotulo: 'Visitas do agente', Icone: MapPinned },
  { to: '/demonstracao', rotulo: `A ${NOME} em ação`, Icone: Smartphone },
  { to: '/governanca', rotulo: 'Governança da IA', Icone: ShieldCheck },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-fundo">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-papel focus:p-2">
        Pular para o conteúdo
      </a>
      <aside className="bg-marinho text-white lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-72 lg:flex-col">
        <div className="piso h-1.5" aria-hidden="true" />
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 lg:block lg:px-6 lg:py-7">
          <NavLink to="/" aria-label={`${NOME}: página inicial`}><Marca /></NavLink>
          <div className="lg:hidden"><ControlesAcessibilidade escuro /></div>
        </div>
        <nav aria-label="Principal" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:mt-2 lg:flex-col lg:px-4">
          {LINKS.map(({ to, rotulo, Icone }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium ${
                isActive ? 'bg-white text-marinho shadow-sm' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}>
              <Icone size={19} aria-hidden="true" /> {rotulo}
            </NavLink>
          ))}
          <NavLink to="/" end className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium text-white/75 hover:bg-white/10 hover:text-white lg:mt-4 lg:border-t lg:border-white/10 lg:pt-5">
            <Sparkles size={19} aria-hidden="true" /> Conheça a {NOME}
          </NavLink>
        </nav>
        <div className="mt-auto hidden px-6 pb-6 lg:block">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">Acessibilidade</p>
          <ControlesAcessibilidade escuro />
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <span className="grid size-10 place-items-center rounded-full bg-cobalto font-bold">CM</span>
            <span className="text-sm leading-tight">
              <span className="block font-bold">Carla Mendes</span>
              <span className="text-white/60">Gestora · UBS Jardim Esperança</span>
            </span>
          </div>
        </div>
      </aside>
      <main id="conteudo" className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-8 lg:pt-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
