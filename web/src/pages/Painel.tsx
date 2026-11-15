import { useMemo, useState } from 'react'
import { nomeAcao, quando, useApi, type Canal, type Consulta } from '../lib/api'
import { Aviso, BarraRisco, Modos, SeloCanal } from '../components/Pecas'

const FILTROS = [
  { rotulo: 'Todas', min: 0 },
  { rotulo: 'Prioridade a partir de 20%', min: 0.2 },
  { rotulo: 'A partir de 30%', min: 0.3 },
  { rotulo: 'A partir de 45%', min: 0.45 },
]
const ORDEM_CANAIS: Canal[] = ['whatsapp', 'ligacao', 'agente']
const POR_CANAL: Record<Canal, string> = { whatsapp: 'WhatsApp, em áudio ou texto', ligacao: 'ligação de voz', agente: 'visita do agente' }
const COR_CANAL: Record<Canal, string> = { whatsapp: 'bg-cobalto', ligacao: 'bg-tinta', agente: 'piso' }

function TresFrentes({ lista }: { lista: Consulta[] }) {
  const total = lista.length || 1
  return (
    <section aria-labelledby="frentes" className="mt-10">
      <h2 id="frentes" className="text-lg font-bold">Por onde cada pessoa vai ser alcançada</h2>
      <div className="mt-3 flex h-12 overflow-hidden rounded-lg border border-linha" aria-hidden="true">
        {ORDEM_CANAIS.map((c) => {
          const n = lista.filter((x) => x.canal === c).length
          return n ? <div key={c} className={COR_CANAL[c]} style={{ width: `${(n / total) * 100}%` }} /> : null
        })}
      </div>
      <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-3">
        {ORDEM_CANAIS.map((c) => {
          const n = lista.filter((x) => x.canal === c).length
          return (
            <li key={c} className="flex items-baseline gap-2">
              <span className={`mt-1 inline-block size-3 shrink-0 rounded-sm ${COR_CANAL[c]}`} aria-hidden="true" />
              <span>
                <strong className="tabular-nums">{n}</strong> {n === 1 ? 'pessoa' : 'pessoas'} por {POR_CANAL[c]}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default function Painel() {
  const { dados, erro } = useApi<Consulta[]>('/api/consultas', 4000)
  const metodo = useApi<{ metodo: string }>('/api/metodo-risco').dados?.metodo
  const [filtro, setFiltro] = useState(2)

  const fila = useMemo(
    () => (dados ?? []).filter((c) => c.ultima_acao || c.prioridade >= FILTROS[filtro].min)
        // quem o ALCANCE já atendeu sobe para o topo, para a gestora ver o resultado na hora
        .sort((a, b) => Number(!!b.ultima_acao) - Number(!!a.ultima_acao) || b.prioridade - a.prioridade),
    [dados, filtro],
  )

  if (erro) return <Aviso>{erro}</Aviso>
  if (!dados) return <p className="text-tinta-suave">Carregando as consultas…</p>

  const emRisco = dados.filter((c) => c.prioridade >= 0.3)
  // faltas esperadas = soma das probabilidades; recuperação conservadora de 30% (caso de negócio)
  const faltasEsperadas = Math.round(dados.reduce((s, c) => s + c.risco_falta, 0))
  const vagasSalvas = Math.round(emRisco.reduce((s, c) => s + c.risco_falta, 0) * 0.3)

  return (
    <>
      <p className="font-medium text-tinta-suave">UBS Jardim Esperança · próximos 14 dias</p>
      <h1 className="mt-2 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
        Cerca de {faltasEsperadas} das {dados.length} consultas devem ficar vazias.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-tinta-suave">
        O ALCANCE vai falar com as <strong className="text-tinta">{emRisco.length} pessoas</strong> com mais risco de faltar ou com barreira de
        acesso, do jeito que cada uma entende. Estimativa conservadora: cerca de{' '}
        <strong className="text-tinta">{vagasSalvas} vagas</strong> recuperadas.
      </p>

      <TresFrentes lista={emRisco} />

      <section aria-labelledby="fila" className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="fila" className="text-lg font-bold">Quem contatar primeiro</h2>
          <div role="radiogroup" aria-label="Filtrar por prioridade" className="flex flex-wrap gap-1 rounded-lg bg-nevoa p-1">
            {FILTROS.map((f, i) => (
              <button
                key={f.rotulo}
                role="radio"
                aria-checked={filtro === i}
                onClick={() => setFiltro(i)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${filtro === i ? 'bg-papel shadow-sm' : 'text-tinta-suave hover:text-tinta'}`}
              >
                {f.rotulo}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <caption className="sr-only">Consultas ordenadas por prioridade: risco de falta, com piso para quem tem barreira de acesso</caption>
            <thead className="border-b-2 border-tinta text-sm text-tinta-suave">
              <tr>
                <th className="py-2 pr-4 font-medium">Pessoa</th>
                <th className="py-2 pr-4 font-medium">Consulta</th>
                <th className="py-2 pr-4 font-medium">Risco de falta</th>
                <th className="py-2 pr-4 font-medium">Canal</th>
                <th className="py-2 pr-4 font-medium">Como falar</th>
                <th className="py-2 font-medium">Situação</th>
              </tr>
            </thead>
            <tbody>
              {fila.slice(0, 40).map((c) => (
                <tr key={c.consulta_id} className="border-b border-linha align-top">
                  <td className="py-3 pr-4">
                    <span className="font-bold">{c.nome}</span>
                    <span className="block text-sm text-tinta-suave">{c.idade} anos, {c.bairro}</span>
                  </td>
                  <td className="py-3 pr-4">
                    {c.especialidade}
                    <span className="block text-sm text-tinta-suave">{quando(c.dias_ate)}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <BarraRisco valor={c.risco_falta} />
                    {c.barreira && c.risco_falta < 0.3 && (
                      <span className="mt-1 block text-sm font-medium text-cobalto">Prioridade por acessibilidade</span>
                    )}
                  </td>
                  <td className="py-3 pr-4"><SeloCanal canal={c.canal} curto /></td>
                  <td className="py-3 pr-4"><Modos modos={c.modos} /></td>
                  <td className="py-3">
                    {c.ultima_acao ? (
                      <span className="entra inline-block rounded-md bg-risco-baixo px-2 py-1 text-sm font-bold text-papel">{nomeAcao(c.ultima_acao)}</span>
                    ) : (
                      <span className="text-sm text-tinta-suave">Aguardando contato</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {fila.length > 40 && <p className="mt-3 text-sm text-tinta-suave">Mostrando as 40 de maior prioridade, de {fila.length}.</p>}
          {!fila.length && <p className="py-8 text-tinta-suave">Nenhuma consulta nesse nível de risco.</p>}
        </div>
      </section>

      <p className="mt-10 max-w-2xl text-sm text-tinta-suave">
        Pessoas fictícias. {metodo === 'modelo'
          ? 'Risco calculado por modelo treinado com 110 mil consultas reais do SUS em Vitória (ES).'
          : 'Risco estimado por regra provisória até o modelo com dados reais do SUS ser treinado.'}
      </p>
    </>
  )
}
