import { useEffect, useRef, useState } from 'react'
import { Check, FileText, Mic, PhoneCall, PhoneOff, Play, RotateCcw, Volume2 } from 'lucide-react'
import { nomeAcao, post, useApi } from '../lib/api'

type Fala = { quem: 'ia' | 'pessoa' | 'acao'; texto: string; tipo?: 'audio' | 'foto' }
type Cena = {
  id: string
  cid: number // cidadão fictício correspondente no banco
  pessoa: string
  resumo: string
  canal: 'ligacao' | 'whatsapp'
  contato: string
  falas: Fala[]
  resultado: string[]
}

// Roteiros de exemplo (modo "Ver exemplo"). O modo "Fazer de verdade" usa a IA real pela API.
const CENAS: Cena[] = [
  {
    id: 'antonio',
    cid: 1,
    pessoa: 'Seu Antônio, 68 anos',
    resumo: 'Baixa visão, celular simples, não lê SMS. O ALCANCE liga para ele.',
    canal: 'ligacao',
    contato: 'UBS Jardim Esperança',
    falas: [
      { quem: 'ia', texto: 'Bom dia, seu Antônio. Aqui é o ALCANCE, da UBS Jardim Esperança. Tudo bem com o senhor?' },
      { quem: 'pessoa', texto: 'Tudo bem. Quem fala?' },
      { quem: 'ia', texto: 'Sou a assistente do seu posto de saúde. O senhor tem consulta de vista nesta quinta, às nove da manhã. O senhor consegue ir?' },
      { quem: 'pessoa', texto: 'Ih, não tenho quem me leve, não.' },
      { quem: 'ia', texto: 'Entendi. Posso pedir o carro da prefeitura para buscar o senhor em casa. Quer que eu peça?' },
      { quem: 'pessoa', texto: 'Quero, sim. Deus lhe pague.' },
      { quem: 'ia', texto: 'Pronto. O carro passa às oito. Vou avisar sua vizinha também, e na quarta eu ligo de novo para lembrar.' },
    ],
    resultado: ['Consulta confirmada', 'Transporte pedido', 'Vizinha avisada', 'Lembrete marcado para quarta'],
  },
  {
    id: 'benedita',
    cid: 3,
    pessoa: 'Dona Benedita, 72 anos',
    resumo: 'Lê pouco. Fotografa uma carta que não entendeu e recebe a explicação em áudio.',
    canal: 'whatsapp',
    contato: 'ALCANCE',
    falas: [
      { quem: 'pessoa', texto: 'Carta do Cadastro Único', tipo: 'foto' },
      { quem: 'pessoa', texto: 'Chegou essa carta aqui, o que é isso?', tipo: 'audio' },
      { quem: 'ia', texto: 'Dona Benedita, essa carta pede para a senhora atualizar o seu cadastro no CRAS até 30 de novembro. Se não atualizar, o benefício pode ser bloqueado.', tipo: 'audio' },
      { quem: 'ia', texto: 'É só levar o RG, o CPF e uma conta de luz. O CRAS mais perto fica na Rua das Flores, 120. Quer que eu marque um horário para a senhora?', tipo: 'audio' },
      { quem: 'pessoa', texto: 'Quero, de manhã.', tipo: 'audio' },
      { quem: 'ia', texto: 'Marquei para terça, às nove. Eu mando um áudio na segunda para lembrar.', tipo: 'audio' },
    ],
    resultado: ['Carta explicada em linguagem simples', 'Horário marcado no CRAS', 'Lembrete por áudio'],
  },
  {
    id: 'julia',
    cid: 2,
    pessoa: 'Júlia, 24 anos',
    resumo: 'Surda, a Libras é a primeira língua dela. Recebe texto curto e tradução em Libras.',
    canal: 'whatsapp',
    contato: 'ALCANCE',
    falas: [
      { quem: 'ia', texto: 'Oi, Júlia. Sua consulta é dia 20, às 14h, na UBS Centro. Você vai?' },
      { quem: 'pessoa', texto: 'nao posso dia 20 trabalho. pode trocar?' },
      { quem: 'ia', texto: 'Pode. Tenho dia 22 às 17h ou dia 23 às 8h. Qual é melhor?' },
      { quem: 'pessoa', texto: '22' },
      { quem: 'ia', texto: 'Pronto: dia 22, às 17h. A vaga do dia 20 foi para outra pessoa da fila.' },
    ],
    resultado: ['Consulta remarcada', 'Vaga liberada para a fila', 'Resposta disponível em Libras'],
  },
]

// rola só a conversa dentro do celular, sem mexer na página
function useRolarParaFim(gatilho: number) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [gatilho])
  return ref
}

const reduzMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function Onda({ ativa }: { ativa: boolean }) {
  return (
    <span className={`onda flex h-10 items-center gap-1 ${ativa ? '' : 'opacity-30'}`} aria-hidden="true">
      {[0.2, 0.5, 0.1, 0.7, 0.3, 0.6, 0.15, 0.45].map((d, i) => (
        <span key={i} className="h-full w-1.5 rounded-full bg-piso" style={{ animationDelay: `${d}s`, animationPlayState: ativa ? 'running' : 'paused' }} />
      ))}
    </span>
  )
}

function TelaLigacao({ cena, vistas, falando, segundos }: { cena: Cena; vistas: Fala[]; falando: Fala | null; segundos: number }) {
  const caixa = useRolarParaFim(vistas.length)
  return (
    <div className="flex h-full flex-col bg-tinta text-papel">
      <div className="px-5 pt-8 text-center">
        <p className="text-sm opacity-70">Chamada de voz</p>
        <p className="mt-1 text-xl font-bold">{cena.contato}</p>
        <p className="mt-1 tabular-nums opacity-70">{String(Math.floor(segundos / 60)).padStart(2, '0')}:{String(segundos % 60).padStart(2, '0')}</p>
        <div className="mt-4 flex justify-center"><Onda ativa={falando?.quem === 'ia'} /></div>
      </div>
      <p className="mt-4 px-5 text-xs font-bold opacity-70">Legenda ao vivo</p>
      <div ref={caixa} className="mt-2 flex-1 space-y-3 overflow-y-auto px-5 pb-4" aria-live="polite">
        {vistas.map((f, i) =>
          f.quem === 'acao' ? (
            <p key={i} className="entra flex items-center gap-1.5 text-sm font-bold text-[#7fe0a8]">
              <Check size={16} aria-hidden="true" /> {nomeAcao(f.texto)}
            </p>
          ) : (
            <p key={i} className={`entra text-[15px] leading-snug ${f.quem === 'ia' ? '' : 'text-piso'}`}>
              <span className="font-bold">{f.quem === 'ia' ? 'ALCANCE: ' : `${cena.pessoa.split(',')[0]}: `}</span>{f.texto}
            </p>
          ),
        )}
      </div>
      <div className="flex justify-center gap-6 pb-8 pt-2">
        <span className="grid size-14 place-items-center rounded-full bg-white/15" aria-hidden="true"><Mic size={22} /></span>
        <span className="grid size-14 place-items-center rounded-full bg-risco-alto" aria-hidden="true"><PhoneOff size={22} /></span>
      </div>
    </div>
  )
}

function Mensagem({ f }: { f: Fala }) {
  if (f.quem === 'acao')
    return (
      <p className="entra mx-auto flex w-fit items-center gap-1.5 rounded-full bg-risco-baixo px-3 py-1 text-[13px] font-bold text-papel">
        <Check size={14} aria-hidden="true" /> {nomeAcao(f.texto)}
      </p>
    )
  const minha = f.quem === 'pessoa'
  return (
    <div className={`entra flex ${minha ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[15px] leading-snug ${minha ? 'rounded-br-sm bg-cobalto text-papel' : 'rounded-bl-sm bg-papel text-tinta shadow-sm'}`}>
        {f.tipo === 'foto' && (
          <div className="mb-1 w-44 rounded-md bg-papel p-2 text-tinta" aria-label="Foto de uma carta">
            <FileText size={16} aria-hidden="true" />
            <p className="mt-1 text-[10px] font-bold">COMUNICADO DE ATUALIZAÇÃO CADASTRAL</p>
            <p className="mt-1 text-[8px] leading-tight opacity-70">Prezado(a) responsável familiar, em cumprimento às normas vigentes, informamos a necessidade de revisão cadastral no prazo estabelecido, sob pena de bloqueio…</p>
          </div>
        )}
        {f.tipo === 'audio' && (
          <span className="mb-1 flex items-center gap-2 font-medium">
            <Volume2 size={16} aria-hidden="true" /> Mensagem de voz
          </span>
        )}
        <span className={f.tipo === 'audio' ? 'block text-[13px] opacity-80' : ''}>{f.texto}</span>
      </div>
    </div>
  )
}

function TelaConversa({ cena, vistas }: { cena: Cena; vistas: Fala[] }) {
  const caixa = useRolarParaFim(vistas.length)
  return (
    <div className="flex h-full flex-col bg-nevoa">
      <div className="flex items-center gap-3 bg-papel px-4 pb-3 pt-8 shadow-sm">
        <span className="piso grid size-9 place-items-center rounded-full text-sm font-extrabold">A</span>
        <div>
          <p className="font-bold">{cena.contato}</p>
          <p className="text-xs text-tinta-suave">Assistente da sua cidade</p>
        </div>
      </div>
      <div ref={caixa} className="flex-1 space-y-2 overflow-y-auto p-3" aria-live="polite">
        {vistas.map((f, i) => <Mensagem key={i} f={f} />)}
      </div>
    </div>
  )
}

export default function Demo() {
  const [cenaId, setCenaId] = useState(CENAS[0].id)
  const [passo, setPasso] = useState(0)
  const [tocando, setTocando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const cena = CENAS.find((c) => c.id === cenaId)!
  const acabou = passo >= cena.falas.length
  // modo "de verdade": a conversa vem do banco, atualizada a cada 1,5 s
  const [real, setReal] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const conversa = useApi<{ falas: Fala[] }>(real ? `/api/cidadaos/${cena.cid}/conversa` : null, 1500).dados
  const falasReais = (conversa?.falas ?? []).filter((f) => f.texto)

  useEffect(() => {
    if (!tocando) return
    if (acabou) { setTocando(false); return }
    const t = setTimeout(() => setPasso((p) => p + 1), Math.max(1300, cena.falas[passo].texto.length * 45))
    return () => clearTimeout(t)
  }, [tocando, passo, acabou, cena])

  useEffect(() => {
    if (!(tocando || real) || cena.canal !== 'ligacao') return
    const t = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [tocando, real, cena.canal])

  const fazerDeVerdade = async () => {
    setTocando(false); setPasso(0); setSegundos(0); setAviso(null)
    try {
      await post(`/api/demo/reiniciar/${cena.cid}`)
      if (cena.canal === 'ligacao') {
        await post(`/api/ligar/${cena.cid}`)
        setAviso('Seu celular vai tocar em instantes. Atenda, aperte qualquer tecla depois do aviso e converse.')
      } else {
        await post(`/api/demo/perfil-whatsapp/${cena.cid}`)
        setAviso(`Mande uma mensagem, um áudio ou a foto de uma carta para o WhatsApp do ALCANCE (+1 415 523 8886). Você está no papel de ${cena.pessoa.split(',')[0]}.`)
      }
      setReal(true)
    } catch {
      setAviso('Não deu para começar. Confira se a API e o túnel estão rodando (python -m alcance.tunel).')
    }
  }
  const iniciar = () => {
    setReal(false); setAviso(null)
    setSegundos(0)
    if (reduzMovimento()) { setPasso(cena.falas.length); return }
    setPasso(1)
    setTocando(true)
  }
  const escolher = (id: string) => { setCenaId(id); setPasso(0); setTocando(false); setSegundos(0); setReal(false); setAviso(null) }

  const vistas = real ? falasReais : cena.falas.slice(0, passo)
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
      <div>
        <h1 className="max-w-xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
          Cada pessoa é atendida do jeito que consegue.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-tinta-suave">
          Escolha uma pessoa e veja o ALCANCE em ação: por ligação, para quem não lê, ou pelo WhatsApp, em áudio ou texto simples.
        </p>

        <div role="radiogroup" aria-label="Escolha uma pessoa" className="mt-8 space-y-2">
          {CENAS.map((c) => (
            <button
              key={c.id}
              role="radio"
              aria-checked={c.id === cenaId}
              onClick={() => escolher(c.id)}
              className={`block w-full rounded-lg border-2 p-4 text-left ${c.id === cenaId ? 'border-tinta bg-nevoa' : 'border-linha hover:border-tinta-suave'}`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-lg font-bold">{c.pessoa}</span>
                <span className="text-sm font-medium text-cobalto">{c.canal === 'ligacao' ? 'Ligação de voz' : 'WhatsApp'}</span>
              </span>
              <span className="mt-1 block text-tinta-suave">{c.resumo}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button onClick={iniciar} className="inline-flex h-12 items-center gap-2 rounded-lg border-2 border-tinta px-5 font-bold hover:bg-nevoa">
            {passo === 0 ? <><Play size={18} aria-hidden="true" /> Ver exemplo</> : <><RotateCcw size={18} aria-hidden="true" /> Ver de novo</>}
          </button>
          <button onClick={fazerDeVerdade} className="inline-flex h-12 items-center gap-2 rounded-lg bg-tinta px-5 font-bold text-papel hover:bg-cobalto">
            <PhoneCall size={18} aria-hidden="true" /> {cena.canal === 'ligacao' ? 'Receber a ligação de verdade' : 'Conversar de verdade'}
          </button>
        </div>
        {aviso && <p role="status" className="entra mt-4 max-w-xl rounded-lg bg-nevoa p-4 font-medium">{aviso}</p>}

        {acabou && !real && (
          <div className="entra mt-8" aria-live="polite">
            <h2 className="font-bold">O que mudou para {cena.pessoa.split(',')[0]}</h2>
            <ul className="mt-3 space-y-2">
              {cena.resultado.map((r) => (
                <li key={r} className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full bg-risco-baixo text-papel"><Check size={15} aria-hidden="true" /></span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="piso rounded-3xl p-6 sm:p-10">
        <div className="mx-auto h-[640px] max-w-[340px] overflow-hidden rounded-[2.6rem] border-[10px] border-tinta bg-tinta shadow-[0_24px_48px_-12px_rgb(26_31_54/0.45)]">
          <div className="h-full overflow-hidden rounded-[2rem]">
            {passo === 0 && !real ? (
              <div className="grid h-full place-items-center bg-tinta p-8 text-center text-papel">
                <p className="text-lg">Toque em <strong>Ver exemplo</strong> ou faça <strong>de verdade</strong> com o seu celular.</p>
              </div>
            ) : cena.canal === 'ligacao' ? (
              <TelaLigacao cena={cena} vistas={vistas} falando={tocando ? cena.falas[passo - 1] : real ? vistas[vistas.length - 1] ?? null : null} segundos={segundos} />
            ) : (
              <TelaConversa cena={cena} vistas={vistas} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
