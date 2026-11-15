import { Link } from 'react-router-dom'
import { ArrowRight, Check, DoorOpen, MessageCircle, Phone } from 'lucide-react'
import Clara, { NOME } from '../components/Clara'
import { ControlesAcessibilidade, Marca } from '../components/Layout'
import { useApi } from '../lib/api'

const FRENTES = [
  { Icone: Phone, titulo: 'Eu ligo', texto: 'Para quem tem celular simples, telefone fixo ou ficou sem internet. Converso como gente, sem “aperte 1”.' },
  { Icone: MessageCircle, titulo: 'Eu mando áudio', texto: 'Para quem tem smartphone. Entendo áudio e foto de carta, e respondo falando, devagar se precisar.' },
  { Icone: DoorOpen, titulo: 'Eu aviso a agente', texto: 'Para quem não tem telefone. Digo à agente comunitária quem ela precisa visitar primeiro.' },
]
const NUMEROS = [
  ['18,6 mi', 'brasileiros com deficiência, 7,9 mi com dificuldade para enxergar'],
  ['29%', 'da população é analfabeta funcional'],
  ['28 mi', 'de pessoas não usam internet'],
  ['38,6%', 'das consultas especializadas viram falta (ES)'],
]

export default function Inicio() {
  const gov = useApi<{ avaliacao: { total: number; passou: number } | null }>('/api/governanca').dados
  const testes = gov?.avaliacao ? `${gov.avaliacao.passou} de ${gov.avaliacao.total}` : '17 de 17'
  const COMPROMISSOS = [
    'Digo que sou uma assistente virtual. Nunca finjo ser gente.',
    'Nunca peço CPF, senha ou dinheiro.',
    'Só faço algo depois do seu “sim”.',
    'Se você pedir, passo para uma pessoa da equipe na hora.',
    `Passo em ${testes} testes de segurança, revisados por humanos.`,
    'Meu modelo é medido por idade, sexo e deficiência para não deixar ninguém de fora.',
  ]
  return (
    <div className="min-h-screen bg-papel">
      <div className="piso h-1.5" aria-hidden="true" />
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-8">
        <Marca escuro={false} />
        <div className="flex flex-wrap items-center gap-3">
          <ControlesAcessibilidade />
          <Link to="/painel" className="rounded-xl px-4 py-2.5 font-bold hover:bg-nevoa">Painel da UBS</Link>
        </div>
      </header>

      <main id="conteudo">
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-8 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-14">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-nevoa px-3 py-1 text-sm font-bold text-cobalto">Para prefeituras e secretarias de saúde</p>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">Oi, eu sou a {NOME}.</h1>
            <p className="mt-5 max-w-xl text-xl leading-relaxed text-tinta-suave">
              A assistente do posto de saúde que <strong className="text-tinta">liga para quem não consegue ler o SMS</strong>. Confirmo a consulta,
              peço o transporte da prefeitura e explico cartas em linguagem simples.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/demonstracao" className="inline-flex h-13 items-center gap-2 rounded-xl bg-marinho px-6 text-lg font-bold text-white hover:bg-cobalto">
                Ver a {NOME} em ação <ArrowRight size={20} aria-hidden="true" />
              </Link>
              <Link to="/painel" className="inline-flex h-13 items-center rounded-xl border-2 border-tinta px-6 text-lg font-bold hover:bg-nevoa">Painel da UBS</Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="piso absolute -right-4 -top-4 h-full w-full rounded-[2rem]" aria-hidden="true" />
            <div className="relative rounded-[2rem] bg-marinho p-7 text-white shadow-xl">
              <div className="flex items-center gap-4">
                <Clara tamanho={88} falando fundo="#2340D9" />
                <div>
                  <p className="text-sm text-white/60">Ligando para</p>
                  <p className="text-xl font-bold">Seu Antônio, 68 anos</p>
                  <p className="text-sm text-white/60">baixa visão · celular simples</p>
                </div>
              </div>
              <div className="mt-6 space-y-3 text-[15px] leading-snug">
                <p className="w-fit max-w-[90%] rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3">Oi, seu Antônio! Aqui é a {NOME}, do seu posto de saúde. A Rosa pediu pra eu ligar.</p>
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-piso px-4 py-3 font-medium text-tinta">Ih, minha filha, não tenho quem me leve…</p>
                <p className="w-fit max-w-[90%] rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3">Posso pedir o carro da prefeitura pro senhor. Ele passa às oito.</p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="problema" className="bg-marinho py-16 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <h2 id="problema" className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">O serviço público fala por SMS, app e site. Milhões de pessoas não conseguem ouvir.</h2>
            <dl className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {NUMEROS.map(([n, t]) => (
                <div key={n} className="border-t-4 border-piso pt-4">
                  <dt className="text-4xl font-extrabold tabular-nums">{n}</dt>
                  <dd className="mt-2 text-white/75">{t}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 text-sm text-white/50">Fontes: IBGE (PNAD 2022), Inaf 2024, TIC Domicílios 2025, Saúde em Debate (2019).</p>
          </div>
        </section>

        <section aria-labelledby="frentes" className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
          <h2 id="frentes" className="text-3xl font-extrabold tracking-tight sm:text-4xl">Eu chego em cada pessoa do jeito que ela consegue.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {FRENTES.map(({ Icone, titulo, texto }) => (
              <div key={titulo} className="rounded-2xl border border-linha/70 bg-fundo p-7">
                <span className="grid size-12 place-items-center rounded-xl bg-cobalto text-white"><Icone size={24} aria-hidden="true" /></span>
                <h3 className="mt-5 text-xl font-bold">{titulo}</h3>
                <p className="mt-2 text-tinta-suave">{texto}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-tinta-suave">E me adapto a cada um: voz mais lenta, linguagem simples, tradução em Libras e aviso para a família.</p>
        </section>

        <section aria-labelledby="negocio" className="bg-fundo py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <h2 id="negocio" className="text-3xl font-extrabold tracking-tight sm:text-4xl">Por que a prefeitura contrata a {NOME}</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-marinho p-7 text-white">
                <p className="text-5xl font-extrabold">R$ 0,12</p>
                <p className="mt-2 text-white/75">por habitante, por mês. Num município de 100 mil habitantes, recupero cerca de <strong className="text-white">4.500 consultas por ano</strong>.</p>
              </div>
              <div className="rounded-2xl border border-linha/70 bg-papel p-7">
                <p className="text-5xl font-extrabold text-cobalto">3,1×</p>
                <p className="mt-2 text-tinta-suave">de retorno estimado para cada real investido. Cada vaga recuperada custa cerca de R$ 32.</p>
              </div>
              <div className="rounded-2xl border border-linha/70 bg-papel p-7">
                <p className="text-5xl font-extrabold">Lei 15.263</p>
                <p className="mt-2 text-tinta-suave">de 2025 obriga todo órgão público a usar linguagem simples. Contratação de piloto pelo Marco Legal das Startups.</p>
              </div>
            </div>
            <p className="mt-6 text-sm text-tinta-suave">Estimativas do caso de negócio, com redução conservadora de 30% nas faltas. Evidência: ligação reduziu faltas para 9,5%, contra 21% com SMS (HC de Ribeirão Preto).</p>
          </div>
        </section>

        <section aria-labelledby="confianca" className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[auto_1fr]">
          <Clara tamanho={200} fundo="#EEF1F8" className="mx-auto" />
          <div>
            <h2 id="confianca" className="text-3xl font-extrabold tracking-tight sm:text-4xl">Responsável desde o primeiro dia.</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {COMPROMISSOS.map((c) => (
                <li key={c} className="flex gap-3"><Check size={22} className="mt-0.5 shrink-0 text-risco-baixo" aria-hidden="true" /> {c}</li>
              ))}
            </ul>
            <Link to="/governanca" className="mt-6 inline-flex items-center gap-2 font-bold text-cobalto hover:underline">Ver as evidências de governança <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-linha">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 px-4 py-8 text-sm text-tinta-suave sm:px-8">
          <p><strong className="text-tinta">{NOME}</strong> · Global Solution 2026.2 · FIAP · Vitor Soares Gonçalves e Pietro Boroto</p>
          <p>Protótipo: pessoas e dados de cidadãos são fictícios.</p>
        </div>
      </footer>
    </div>
  )
}
