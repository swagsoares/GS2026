import { useEffect, useState } from 'react'

export type Canal = 'whatsapp' | 'ligacao' | 'agente'

export interface Consulta {
  consulta_id: number
  id: number
  nome: string
  idade: number
  bairro: string
  telefone: 'smartphone' | 'basico' | 'nenhum'
  especialidade: string
  data_consulta: string
  risco_falta: number
  prioridade: number
  barreira: boolean
  canal: Canal
  modos: string[]
  dias_ate: number
  contato_familia: string | null
  agente: string
  status: string
  ultima_acao: string | null
  tentativas: number
  apoio_avisado: number
  faltas_anteriores: number
  autoriza_apoio: number
}

export function useApi<T>(url: string | null, atualizarACadaMs?: number) {
  const [dados, setDados] = useState<T | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  useEffect(() => {
    if (!url) return
    const buscar = () =>
      fetch(url)
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((d) => { setDados(d); setErro(null) })
        .catch(() => setErro('Não foi possível carregar os dados. Verifique se a API está rodando na porta 8000.'))
    buscar()
    if (!atualizarACadaMs) return
    const t = setInterval(buscar, atualizarACadaMs)
    return () => clearInterval(t)
  }, [url, atualizarACadaMs])
  return { dados, erro }
}

export const post = (url: string) => fetch(url, { method: 'POST' }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)))

/** Nome legível das ações que a IA executa */
export const ACAO: Record<string, string> = {
  confirmar_consulta: 'Consulta confirmada',
  remarcar_consulta: 'Pediu nova data',
  pedir_transporte: 'Transporte pedido',
  liberar_vaga: 'Vaga liberada para a fila',
  avisar_contato_apoio: 'Família avisada',
  autorizou_apoio: 'Autorizou avisar a família',
  agendar_lembrete: 'Lembrete agendado',
  encaminhar_para_humano: 'Passado para a equipe',
}
export const nomeAcao = (resultado: string) => ACAO[resultado.split(' ')[0]] ?? resultado

export const CANAL: Record<Canal, { rotulo: string; curto: string }> = {
  whatsapp: { rotulo: 'WhatsApp por áudio', curto: 'WhatsApp' },
  ligacao: { rotulo: 'Ligação de voz', curto: 'Ligação' },
  agente: { rotulo: 'Visita do agente', curto: 'Visita' },
}

export const MODO: Record<string, string> = {
  linguagem_simples: 'Linguagem simples',
  audio: 'Áudio',
  texto: 'Texto',
  libras: 'Libras',
  voz_lenta: 'Voz lenta',
}

export function nivelRisco(r: number) {
  if (r >= 0.45) return { rotulo: 'Alto', cor: 'text-risco-alto', fundo: 'bg-risco-alto' }
  if (r >= 0.3) return { rotulo: 'Médio', cor: 'text-risco-medio', fundo: 'bg-risco-medio' }
  return { rotulo: 'Baixo', cor: 'text-risco-baixo', fundo: 'bg-risco-baixo' }
}

export const quando = (d: number) => (d === 0 ? 'hoje' : d === 1 ? 'amanhã' : `em ${d} dias`)
