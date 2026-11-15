import { Phone, MessageCircle, DoorOpen } from 'lucide-react'
import { CANAL, MODO, nivelRisco, type Canal } from '../lib/api'

const ICONE = { whatsapp: MessageCircle, ligacao: Phone, agente: DoorOpen }

export function SeloCanal({ canal, curto = false }: { canal: Canal; curto?: boolean }) {
  const Icone = ICONE[canal]
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium">
      <Icone size={17} aria-hidden="true" className="text-cobalto" />
      {curto ? CANAL[canal].curto : CANAL[canal].rotulo}
    </span>
  )
}

export function BarraRisco({ valor }: { valor: number }) {
  const n = nivelRisco(valor)
  return (
    <span className="flex items-center gap-2" aria-label={`Risco ${n.rotulo.toLowerCase()}, ${Math.round(valor * 100)}%`}>
      <span className="h-2 w-20 overflow-hidden rounded-full bg-nevoa" aria-hidden="true">
        <span className={`block h-full rounded-full ${n.fundo}`} style={{ width: `${valor * 100}%` }} />
      </span>
      <span className={`w-10 text-right font-bold tabular-nums ${n.cor}`}>{Math.round(valor * 100)}%</span>
    </span>
  )
}

export function Modos({ modos }: { modos: string[] }) {
  // linguagem simples vale para todos; mostra só o que diferencia a pessoa
  const extras = modos.filter((m) => m !== 'linguagem_simples')
  if (!extras.length) return <span className="text-tinta-suave">Padrão</span>
  return (
    <span className="flex flex-wrap gap-1">
      {extras.map((m) => (
        <span key={m} className="rounded border border-linha px-1.5 py-0.5 text-[13px] font-medium">{MODO[m] ?? m}</span>
      ))}
    </span>
  )
}

export function Aviso({ children }: { children: React.ReactNode }) {
  return <p role="alert" className="rounded-lg border-2 border-risco-alto p-4 font-medium">{children}</p>
}

/** Cartão branco do painel (padrão app de banco) */
export function Cartao({ titulo, subtitulo, acao, children, className = '', id }: {
  titulo?: string; subtitulo?: string; acao?: React.ReactNode; children: React.ReactNode; className?: string; id?: string
}) {
  return (
    <section aria-labelledby={id} className={`rounded-2xl border border-linha/70 bg-papel p-5 shadow-[0_1px_3px_rgb(16_24_40/0.05)] sm:p-6 ${className}`}>
      {(titulo || acao) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {titulo && <h2 id={id} className="text-lg font-bold">{titulo}</h2>}
            {subtitulo && <p className="mt-0.5 text-sm text-tinta-suave">{subtitulo}</p>}
          </div>
          {acao}
        </div>
      )}
      {children}
    </section>
  )
}

/** Número grande com rótulo (indicador do topo do painel) */
export function Indicador({ rotulo, valor, detalhe, Icone, destaque = false }: {
  rotulo: string; valor: React.ReactNode; detalhe?: string; Icone: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>; destaque?: boolean
}) {
  return (
    <div className={`rounded-2xl p-5 shadow-[0_1px_3px_rgb(16_24_40/0.05)] ${destaque ? 'bg-marinho text-white' : 'border border-linha/70 bg-papel'}`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-medium ${destaque ? 'text-white/75' : 'text-tinta-suave'}`}>{rotulo}</p>
        <span className={`grid size-9 place-items-center rounded-xl ${destaque ? 'piso text-tinta' : 'bg-nevoa text-cobalto'}`}><Icone size={18} aria-hidden /></span>
      </div>
      <p className="mt-3 text-4xl font-extrabold tracking-tight tabular-nums">{valor}</p>
      {detalhe && <p className={`mt-1 text-sm ${destaque ? 'text-white/70' : 'text-tinta-suave'}`}>{detalhe}</p>}
    </div>
  )
}
