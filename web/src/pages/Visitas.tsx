import { useState } from 'react'
import { Check, Users } from 'lucide-react'
import { quando, useApi, type Consulta } from '../lib/api'
import { Aviso, BarraRisco, Modos } from '../components/Pecas'

export default function Visitas() {
  const { dados, erro } = useApi<Consulta[]>('/api/consultas')
  const [agente, setAgente] = useState('Rosa')
  const [feitas, setFeitas] = useState<Set<number>>(new Set())

  if (erro) return <Aviso>{erro}</Aviso>
  if (!dados) return <p className="text-tinta-suave">Carregando as visitas…</p>

  const agentes = [...new Set(dados.map((c) => c.agente))].sort()
  const visitas = dados
    .filter((c) => c.agente === agente && c.canal === 'agente')
    .sort((a, b) => a.dias_ate - b.dias_ate || b.risco_falta - a.risco_falta)
  const restantes = visitas.length - visitas.filter((v) => feitas.has(v.consulta_id)).length

  const alternar = (id: number) =>
    setFeitas((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  return (
    <div className="max-w-2xl">
      <p className="font-medium text-tinta-suave">Quem não tem telefone recebe uma visita</p>
      <h1 className="mt-2 text-4xl font-extrabold leading-[1.1] tracking-tight">
        {restantes === 0 ? 'Todas as visitas de hoje foram feitas.' : `${agente}, você tem ${restantes} ${restantes === 1 ? 'visita' : 'visitas'} hoje.`}
      </h1>

      <div role="radiogroup" aria-label="Agente comunitário" className="mt-6 flex gap-2">
        {agentes.map((a) => (
          <button
            key={a}
            role="radio"
            aria-checked={agente === a}
            onClick={() => setAgente(a)}
            className={`rounded-full border-2 px-4 py-1.5 font-medium ${agente === a ? 'border-tinta bg-tinta text-papel' : 'border-linha hover:border-tinta'}`}
          >
            {a}
          </button>
        ))}
      </div>

      <ol className="mt-8 border-t-2 border-tinta">
        {visitas.map((v, i) => {
          const feita = feitas.has(v.consulta_id)
          return (
            <li key={v.consulta_id} className={`flex flex-wrap gap-4 border-b border-linha py-5 sm:flex-nowrap ${feita ? 'opacity-55' : ''}`}>
              <span className="mt-0.5 w-6 shrink-0 text-lg font-extrabold tabular-nums text-tinta-suave">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className={`text-lg font-bold ${feita ? 'line-through' : ''}`}>{v.nome}, {v.idade} anos</p>
                <p className="text-tinta-suave">{v.bairro}</p>
                <p className="mt-2">{v.especialidade} {quando(v.dias_ate)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  <BarraRisco valor={v.risco_falta} />
                  <Modos modos={v.modos} />
                  {v.contato_familia && (
                    <span className="inline-flex items-center gap-1 text-tinta-suave">
                      <Users size={15} aria-hidden="true" /> Apoio: {v.contato_familia}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => alternar(v.consulta_id)}
                aria-pressed={feita}
                className={`ml-10 h-11 w-[calc(100%-2.5rem)] shrink-0 self-center rounded-lg px-4 font-bold sm:ml-0 sm:w-auto ${feita ? 'bg-risco-baixo text-papel' : 'border-2 border-tinta hover:bg-nevoa'}`}
              >
                {feita ? <span className="inline-flex items-center gap-1"><Check size={18} aria-hidden="true" /> Visitado</span> : 'Marcar visita'}
              </button>
            </li>
          )
        })}
      </ol>
      {!visitas.length && <p className="py-8 text-tinta-suave">{agente} não tem visitas pendentes.</p>}
    </div>
  )
}
