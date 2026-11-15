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
