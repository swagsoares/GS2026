import { Check, X } from 'lucide-react'
import { nomeAcao, useApi } from '../lib/api'
import { Aviso } from '../components/Pecas'

type Caso = { categoria: string; pergunta: string; resposta: string; acoes: string[]; passou: boolean; falhas: string[] }
type Grupo = { grupo: string; n: number; taxa_falta: number; roc_auc: number; alertados: number }
type Gov = {
  avaliacao: { quando: string; total: number; passou: number; tempo_medio_s: number; por_categoria: Record<string, { total: number; passou: number }>; casos: Caso[] } | null
  modelo: { metodo: string; metricas: { registros: number; roc_auc: number; taxa_falta_real: number; vies: Grupo[]; efeito_sms: { com_sms: number; sem_sms: number } } | null }
  auditoria: { quando: string; canal: string; resultado: string; nome: string }[]
  acoes_total: number
  passados_para_humano: number
}

const pct = (x: number) => `${Math.round(x * 100)}%`

const COMPROMISSOS = [
  ['Humano no controle', 'A IA oferece falar com a equipe em toda conversa. Ações irreversíveis, como liberar uma vaga, são travadas no código até a pessoa confirmar.'],
  ['Sem conselho médico', 'A IA não diagnostica nem indica remédio. Em emergência, orienta procurar o SAMU 192 ou a UPA.'],
  ['Respostas com fonte', 'Dúvidas sobre direitos são respondidas só com a base de conhecimento, citando a lei. Fora dela, a IA diz que não tem certeza.'],
  ['LGPD', 'Base legal de execução de política pública (art. 7º, III e art. 11, II, b). Coleta mínima, nunca pede CPF, senha ou dados bancários. O protótipo usa apenas pessoas fictícias.'],
  ['Linguagem simples e acessível', 'Segue a Lei 15.263/2025 e a Lei Brasileira de Inclusão: voz, texto curto, Libras (VLibras) e ritmo mais lento quando a pessoa precisa.'],
  ['Risco do sistema', 'Pelo PL 2338/2023, o ALCANCE prioriza contatos, mas não decide quem é atendido. O modelo só ordena a fila de ligações. Gestão de riscos segue as funções do NIST AI RMF: governar, mapear, medir e gerenciar.'],
]

export default function Governanca() {
  const { dados, erro } = useApi<Gov>('/api/governanca', 5000)
  if (erro) return <Aviso>{erro}</Aviso>
  if (!dados) return <p className="text-tinta-suave">Carregando as evidências…</p>
  const av = dados.avaliacao
  const m = dados.modelo.metricas

  return (
    <div className="max-w-4xl">
      <p className="font-medium text-tinta-suave">Como garantimos que a IA é segura, justa e transparente</p>
      <h1 className="mt-2 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
        {av ? `${av.passou} de ${av.total} testes de segurança e qualidade passaram.` : 'A avaliação da IA ainda não foi rodada.'}
      </h1>
      {av && (
        <p className="mt-4 text-lg text-tinta-suave">
          Perguntas difíceis feitas à IA real, conferidas por regras objetivas. Última execução em{' '}
          {new Date(av.quando).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}, com resposta média em {av.tempo_medio_s} s.
        </p>
      )}

      {av && (
        <section aria-labelledby="cat" className="mt-10">
          <h2 id="cat" className="text-lg font-bold">Resultado por tipo de teste</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-4">
            {Object.entries(av.por_categoria).map(([cat, r]) => (
              <li key={cat} className="rounded-lg border-2 border-linha p-4">
                <span className="block text-sm text-tinta-suave">{cat}</span>
                <strong className={`text-2xl tabular-nums ${r.passou === r.total ? 'text-risco-baixo' : 'text-risco-alto'}`}>{r.passou}/{r.total}</strong>
              </li>
            ))}
          </ul>
          <details className="mt-4 rounded-lg border border-linha p-4">
            <summary className="cursor-pointer font-bold">Ver cada pergunta e a resposta da IA</summary>
            <ul className="mt-4 space-y-4">
              {av.casos.map((c) => (
                <li key={c.pergunta} className="border-t border-linha pt-4">
                  <p className="flex items-start gap-2 font-bold">
                    {c.passou
                      ? <Check size={18} className="mt-0.5 shrink-0 text-risco-baixo" aria-label="Passou" />
                      : <X size={18} className="mt-0.5 shrink-0 text-risco-alto" aria-label="Falhou" />}
                    <span><span className="font-medium text-tinta-suave">{c.categoria}:</span> {c.pergunta}</span>
                  </p>
                  <p className="ml-6 mt-1 text-tinta-suave">{c.resposta || '(sem resposta)'}</p>
                  {c.acoes.length > 0 && <p className="ml-6 mt-1 text-sm font-medium">Ação: {c.acoes.map(nomeAcao).join(', ')}</p>}
                  {c.falhas.length > 0 && <p className="ml-6 mt-1 text-sm font-medium text-risco-alto">{c.falhas.join('; ')}</p>}
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}

      <section aria-labelledby="erro" className="mt-12 border-l-4 border-piso bg-nevoa p-6">
        <h2 id="erro" className="text-lg font-bold">Erros que a avaliação encontrou e corrigimos</h2>
        <p className="mt-2">
          <strong>A vaga liberada sem perguntar.</strong> Quando a pessoa dizia &quot;não vou conseguir ir, não tenho como ir&quot;, a IA liberava a vaga
          e a pessoa perderia a consulta. Agora a regra diferencia &quot;não consigo&quot; de &quot;não quero&quot; e oferece transporte primeiro, e o
          código <strong>recusa</strong> liberar uma vaga sem a frase de confirmação da pessoa, mesmo que a IA tente.
        </p>
        <p className="mt-3">
          <strong>O número errado do SAMU.</strong> Numa emergência, a IA disse &quot;cento e doze&quot;. O SAMU é <strong>192</strong>. O teste automático
          deixou passar, porque só conferia a palavra &quot;SAMU&quot;, e a revisão humana das respostas encontrou o erro. Colocamos os números oficiais na
          base de conhecimento e o teste agora exige o 192. Lição: teste automático não substitui a leitura humana.
        </p>
        <p className="mt-3">
          <strong>O modelo esquecia os idosos.</strong> Medindo o viés por grupo, vimos que só 2 em cada 100 pessoas com 60 anos ou mais entrariam na
          fila de contato, contra quase metade dos adultos de 18 a 39 anos: na média, idosos faltam menos. Mas são justamente quem mais tem
          dificuldade com SMS. Agora, quem tem barreira real de acesso (baixa visão, surdez, pouca leitura ou sem smartphone), em qualquer idade,{' '}
          <strong>sempre entra na fila de contato</strong>. O modelo só ordena a fila, não decide quem fica de fora.
        </p>
      </section>

      <section aria-labelledby="modelo" className="mt-12">
        <h2 id="modelo" className="text-lg font-bold">Modelo que prevê faltas</h2>
        {m ? (
          <>
            <p className="mt-2 max-w-2xl text-tinta-suave">
              Treinado com {m.registros.toLocaleString('pt-BR')} consultas reais do SUS em Vitória (ES). Taxa real de falta: {pct(m.taxa_falta_real)}.
              Qualidade geral (ROC-AUC): <strong className="text-tinta">{m.roc_auc}</strong>. O modelo só decide a ordem das ligações, nunca quem é atendido.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <caption className="sr-only">Desempenho do modelo por grupo</caption>
                <thead className="border-b-2 border-tinta text-sm text-tinta-suave">
                  <tr><th className="py-2 pr-4 font-medium">Grupo</th><th className="py-2 pr-4 font-medium">Consultas</th><th className="py-2 pr-4 font-medium">Falta real</th><th className="py-2 pr-4 font-medium">ROC-AUC</th><th className="py-2 font-medium">Recebem contato</th></tr>
                </thead>
                <tbody>
                  {m.vies.map((g) => (
                    <tr key={g.grupo} className="border-b border-linha">
                      <td className="py-2 pr-4 font-medium">{g.grupo}</td>
                      <td className="py-2 pr-4 tabular-nums">{g.n.toLocaleString('pt-BR')}</td>
                      <td className="py-2 pr-4 tabular-nums">{pct(g.taxa_falta)}</td>
                      <td className="py-2 pr-4 tabular-nums">{g.roc_auc}</td>
                      <td className="py-2 tabular-nums">{pct(g.alertados)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 max-w-2xl">
              <strong>O SMS ajuda pouco.</strong> Comparando consultas com a mesma espera (15 a 30 dias), quem recebeu SMS ainda faltou{' '}
              <strong>{pct(m.efeito_sms.com_sms)}</strong> das vezes, contra {pct(m.efeito_sms.sem_sms)} de quem não recebeu. A comparação sem esse
              cuidado sugeria que o SMS piorava, porque ele só é enviado para consultas marcadas com antecedência, que já têm mais faltas.
            </p>
          </>
        ) : (
          <p className="mt-2 max-w-2xl text-tinta-suave">
            O risco ainda é estimado por uma regra provisória. Quando o modelo for treinado com os dados reais do SUS, aparecem aqui a qualidade
            geral e a comparação por idade, sexo, deficiência e Bolsa Família, para conferir que ele funciona igualmente bem para todos.
          </p>
        )}
      </section>

      <section aria-labelledby="audit" className="mt-12">
        <h2 id="audit" className="text-lg font-bold">Trilha de auditoria</h2>
        <p className="mt-2 text-tinta-suave">
          Toda ação da IA fica registrada. {dados.acoes_total} ações até agora, {dados.passados_para_humano} passadas para a equipe.
        </p>
        {dados.auditoria.length ? (
          <ol className="mt-4 border-t-2 border-tinta">
            {dados.auditoria.map((a, i) => (
              <li key={i} className="flex flex-wrap gap-x-4 border-b border-linha py-2">
                <span className="w-36 tabular-nums text-tinta-suave">{a.quando}</span>
                <span className="font-medium">{nomeAcao(a.resultado)}</span>
                <span className="text-tinta-suave">{a.nome}, por {a.canal === 'ligacao' ? 'ligação' : 'WhatsApp'}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-tinta-suave">Nenhuma ação ainda. Faça uma ligação ou converse pelo WhatsApp na página &quot;Como o cidadão vê&quot;.</p>
        )}
      </section>

      <section aria-labelledby="comp" className="mt-12">
        <h2 id="comp" className="text-lg font-bold">Nossos compromissos</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {COMPROMISSOS.map(([t, d]) => (
            <div key={t}>
              <dt className="font-bold">{t}</dt>
              <dd className="mt-1 text-tinta-suave">{d}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
