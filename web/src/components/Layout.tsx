import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Contrast } from 'lucide-react'

export function Logo({ tamanho = 36 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#F5C400" />
      <circle cx="10" cy="22" r="3.2" fill="#1A1F36" />
      <path d="M10 13a9 9 0 0 1 9 9M10 6a16 16 0 0 1 16 16" fill="none" stroke="#1A1F36" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  )
}

const ESCALAS = ['100%', '115%', '130%']

function lerPref(chave: string, padrao: string) {
  try { return localStorage.getItem(chave) ?? padrao } catch { return padrao }
}
function salvarPref(chave: string, valor: string) {
  try { localStorage.setItem(chave, valor) } catch { /* sem armazenamento: só não lembra */ }
}

function ControlesAcessibilidade() {
  const [escala, setEscala] = useState(() => lerPref('escala', '100%'))
  const [contraste, setContraste] = useState(() => lerPref('contraste', 'normal'))

  useEffect(() => {
    document.documentElement.style.setProperty('--escala', escala)
    salvarPref('escala', escala)
  }, [escala])
  useEffect(() => {
    document.documentElement.dataset.contraste = contraste
    salvarPref('contraste', contraste)
  }, [contraste])

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Acessibilidade">
      {ESCALAS.map((e, i) => (
        <button
          key={e}
          onClick={() => setEscala(e)}
          aria-pressed={escala === e}
          aria-label={`Tamanho do texto ${i + 1} de 3`}
          className={`h-9 min-w-9 rounded-md px-2 font-bold ${escala === e ? 'bg-tinta text-papel' : 'hover:bg-nevoa'}`}
          style={{ fontSize: `${14 + i * 3}px` }}
        >
          A
        </button>
      ))}
      <button
        onClick={() => setContraste(contraste === 'alto' ? 'normal' : 'alto')}
        aria-pressed={contraste === 'alto'}
        className={`ml-1 flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium ${contraste === 'alto' ? 'bg-tinta text-papel' : 'hover:bg-nevoa'}`}
      >
        <Contrast size={18} aria-hidden="true" /> Alto contraste
      </button>
    </div>
  )
}

const LINKS = [
  { to: '/', rotulo: 'Visão da UBS' },
  { to: '/visitas', rotulo: 'Visitas do agente' },
  { to: '/demonstracao', rotulo: 'Como o cidadão vê' },
  { to: '/governanca', rotulo: 'Governança' },
]

export default function Layout() {
  return (
    <div className="min-h-screen">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-papel focus:p-2">
        Pular para o conteúdo
      </a>
      <div className="piso h-2" aria-hidden="true" />
      <header className="border-b border-linha">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-xl font-extrabold tracking-tight">ALCANCE</span>
          </NavLink>
          <nav aria-label="Principal" className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-md px-3 py-2 text-[15px] font-medium ${isActive ? 'bg-nevoa text-tinta shadow-[inset_0_-3px_0_var(--color-piso)]' : 'text-tinta-suave hover:text-tinta'}`
                }
              >
                {l.rotulo}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto"><ControlesAcessibilidade /></div>
        </div>
      </header>
      <main id="conteudo" className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
