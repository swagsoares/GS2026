import { useMemo, useState } from 'react'
import { CalendarX2, CheckCircle2, Users, HeartHandshake } from 'lucide-react'
import { nomeAcao, quando, useApi, type Canal, type Consulta } from '../lib/api'
import { Aviso, BarraRisco, Cartao, Indicador, Modos, SeloCanal } from '../components/Pecas'
import Clara, { NOME } from '../components/Clara'

const FILTROS = [
  { rotulo: 'Todas', min: 0 },
  { rotulo: '20%+', min: 0.2 },
  { rotulo: '30%+', min: 0.3 },
  { rotulo: '45%+', min: 0.45 },
]
const ORDEM_CANAIS: Canal[] = ['whatsapp', 'ligacao', 'agente']
const POR_CANAL: Record<Canal, string> = { whatsapp: 'WhatsApp, em áudio ou texto', ligacao: 'Ligação de voz', agente: 'Visita do agente' }
const COR_CANAL: Record<Canal, string> = { whatsapp: 'bg-cobalto', ligacao: 'bg-marinho', agente: 'piso' }

type Governanca = { auditoria: { quando: string; canal: string; resultado: string; nome: string }[]; acoes_total: number }

function TresFrentes({ lista }: { lista: Consulta[] }) {
  const total = lista.length || 1
  return (
    <Cartao titulo={`Por onde a ${NOME} vai falar com cada um`} subtitulo="Ela escolhe o canal que a pessoa consegue usar" id="frentes">
      <div className="flex h-4 overflow-hidden rounded-full bg-nevoa" aria-hidden="true">
        {ORDEM_CANAIS.map((c) => {
          const n = lista.filter((x) => x.canal === c).length
          return n ? <div key={c} className={COR_CANAL[c]} style={{ width: `${(n / total) * 100}%` }} /> : null
        })}
      </div>
      <ul className="mt-4 space-y-3">
        {ORDEM_CANAIS.map((c) => {
          const n = lista.filter((x) => x.canal === c).length
          return (
            <li key={c} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5">
                <span className={`inline-block size-3 shrink-0 rounded-full ${COR_CANAL[c]}`} aria-hidden="true" />
                {POR_CANAL[c]}
              </span>
              <strong className="tabular-nums">{n}</strong>
            </li>
          )
        })}
      </ul>
    </Cartao>
  )
}

function Atividade({ itens }: { itens: Governanca['auditoria'] }) {
  return (
    <Cartao titulo={`O que a ${NOME} fez agora`} subtitulo="Atualiza sozinho a cada conversa" id="atividade"
      acao={<span className="flex items-center gap-1.5 rounded-full bg-risco-baixo/10 px-2.5 py-1 text-xs font-bold text-risco-baixo"><span className="size-2 animate-pulse rounded-full bg-risco-baixo" />ao vivo</span>}>
      {itens.length === 0 ? (
        <p className="text-tinta-suave">Nenhuma conversa ainda. Abra “A {NOME} em ação” e faça uma ligação de verdade.</p>
      ) : (
        <ul className="space-y-3" aria-live="polite">
          {itens.slice(0, 5).map((a, i) => (
            <li key={`${a.quando}-${i}`} className="entra flex items-start gap-3">
              <Clara tamanho={34} titulo="" />
              <p className="text-[15px] leading-snug">
                <strong>{nomeAcao(a.resultado)}</strong>
                <span className="block text-sm text-tinta-suave">{a.nome} · {a.canal === 'ligacao' ? 'por ligação' : a.canal === 'whatsapp' ? 'pelo WhatsApp' : a.canal}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </Cartao>
  )
}

export default function Painel() {
  const { dados, erro } = useApi<Consulta[]>('/api/consultas', 4000)
  const gov = useApi<Governanca>('/api/governanca', 4000).dados
  const [filtro, setFiltro] = useState(2)

  const fila = useMemo(
    () => (dados ?? []).filter((c) => c.ultima_acao || c.prioridade >= FILTROS[filtro].min)
      // quem a Clara já atendeu sobe para o topo, para a gestora ver o resultado na hora
      .sort((a, b) => Number(!!b.ultima_acao) - Number(!!a.ultima_acao) || b.prioridade - a.prioridade),
    [dados, filtro],
  )

  if (erro) return <Aviso>{erro}</Aviso>
  if (!dados) return <p className="text-tinta-suave">Carregando as consultas…</p>

  const emRisco = dados.filter((c) => c.prioridade >= 0.3)
  // faltas esperadas = soma das probabilidades; recuperação conservadora de 30% (caso de negócio)
  const faltasEsperadas = Math.round(dados.reduce((s, c) => s + c.risco_falta, 0))
  const vagasSalvas = Math.round(emRisco.reduce((s, c) => s + c.risco_falta, 0) * 0.3)
  const resolvidas = dados.filter((c) => c.ultima_acao).length
  const tentativas = dados.reduce((s, c) => s + (c.tentativas || 0), 0)
  const familias = dados.filter((c) => c.apoio_avisado).length

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-medium text-tinta-suave">UBS Jardim Esperança · próximos 14 dias</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Bom dia, Carla.</h1>
        </div>
        <p className="flex items-center gap-3 rounded-2xl border border-linha/70 bg-papel py-2 pl-2 pr-4 shadow-[0_1px_3px_rgb(16_24_40/0.05)]">
          <Clara tamanho={40} falando titulo="" />
          <span className="text-sm leading-tight"><strong className="block">A {NOME} está trabalhando</strong>
            <span className="text-tinta-suave">{emRisco.length} pessoas na fila de contato</span></span>
        </p>
      </header>

      <section aria-label="Resumo" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador destaque rotulo="Vagas que a Clara deve recuperar" valor={vagasSalvas} detalhe="estimativa conservadora, 14 dias" Icone={HeartHandshake} />
        <Indicador rotulo="Faltas esperadas" valor={<>{faltasEsperadas}<span className="text-xl text-tinta-suave"> / {dados.length}</span></>} detalhe="se ninguém fizer nada" Icone={CalendarX2} />
        <Indicador rotulo="Pessoas na fila da Clara" valor={emRisco.length} detalhe="risco alto ou barreira de acesso" Icone={Users} />
        <Indicador rotulo="Resolvidas pela Clara" valor={resolvidas} detalhe={`${tentativas} tentativas registradas · ${familias} famílias avisadas`} Icone={CheckCircle2} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Atividade itens={gov?.auditoria ?? []} />
        <TresFrentes lista={emRisco} />
      </div>

      <div className="mt-6">
        <Cartao titulo="Quem a Clara vai procurar primeiro" subtitulo="Ordenado por risco de falta, com prioridade para quem tem barreira de acesso" id="fila"
          acao={
            <div role="radiogroup" aria-label="Filtrar por prioridade" className="flex gap-1 rounded-xl bg-nevoa p-1">
              {FILTROS.map((f, i) => (
                <button key={f.rotulo} role="radio" aria-checked={filtro === i} onClick={() => setFiltro(i)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filtro === i ? 'bg-papel shadow-sm' : 'text-tinta-suave hover:text-tinta'}`}>
                  {f.rotulo}
                </button>
              ))}
            </div>
          }>
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="w-full min-w-[820px] text-left">
              <caption className="sr-only">Consultas ordenadas por prioridade</caption>
              <thead className="border-y border-linha/70 bg-fundo text-xs font-bold uppercase tracking-wide text-tinta-suave">
                <tr>
                  <th className="py-2.5 pl-6 pr-4">Pessoa</th>
                  <th className="py-2.5 pr-4">Consulta</th>
                  <th className="py-2.5 pr-4">Risco de falta</th>
                  <th className="py-2.5 pr-4">Canal</th>
                  <th className="py-2.5 pr-4">Como falar</th>
                  <th className="py-2.5 pr-6">Situação</th>
                </tr>
              </thead>
              <tbody>
                {fila.slice(0, 40).map((c) => (
                  <tr key={c.consulta_id} className={`border-b border-linha/60 align-top ${c.ultima_acao ? 'bg-risco-baixo/5' : ''}`}>
                    <td className="py-3.5 pl-6 pr-4">
                      <span className="font-bold">{c.nome}</span>
                      <span className="block text-sm text-tinta-suave">{c.idade} anos, {c.bairro}</span>
                    </td>
                    <td className="py-3.5 pr-4">
                      {c.especialidade}
                      <span className="block text-sm text-tinta-suave">{quando(c.dias_ate)}</span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <BarraRisco valor={c.risco_falta} />
                      {c.barreira && c.risco_falta < 0.3 && <span className="mt-1 block text-sm font-medium text-cobalto">Prioridade por acessibilidade</span>}
                      {c.faltas_anteriores > 1 && <span className="mt-1 block text-xs font-medium text-risco-medio">Já faltou {c.faltas_anteriores}× tendo confirmado</span>}
                    </td>
                    <td className="py-3.5 pr-4"><SeloCanal canal={c.canal} curto /></td>
                    <td className="py-3.5 pr-4"><Modos modos={c.modos} /></td>
                    <td className="py-3.5 pr-6">
                      {c.ultima_acao ? (
                        <>
                          <span className="entra inline-flex items-center gap-1.5 rounded-full bg-risco-baixo px-3 py-1 text-sm font-bold text-papel">
                            <CheckCircle2 size={15} aria-hidden="true" /> {nomeAcao(c.ultima_acao)}
                          </span>
                          {!!c.apoio_avisado && !c.ultima_acao.startsWith('avisar_contato_apoio') && (
                            <span className="entra mt-1.5 inline-flex rounded-full bg-cobalto px-3 py-1 text-sm font-bold text-papel">Família avisada</span>
                          )}
                          <span className="mt-1 block text-xs text-tinta-suave">{c.tentativas} {c.tentativas === 1 ? 'tentativa registrada' : 'tentativas registradas'}</span>
                        </>
                      ) : (
                        <span className="text-sm text-tinta-suave">Aguardando contato</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {fila.length > 40 && <p className="mt-3 text-sm text-tinta-suave">Mostrando as 40 de maior prioridade, de {fila.length}.</p>}
        </Cartao>
      </div>
    </>
  )
}
