# Clara: governança de IA e conformidade
*Versão de 14/11/2026. As evidências ao vivo estão na página **Governança** do site (`/governanca`).*

## 1. O que a IA faz e o que ela não faz
| Faz | Não faz |
|---|---|
| Conversa por voz e por WhatsApp para confirmar, remarcar e pedir transporte | Não decide quem é atendido nem a ordem de atendimento médico |
| Explica cartas e direitos em linguagem simples, citando a fonte | Não dá diagnóstico, não indica remédio |
| Prioriza **para quem ligar primeiro** (modelo de risco de falta) | Não nega serviço a ninguém |
| Registra cada ação para auditoria | Não pede CPF, senha, cartão ou dados bancários |

## 2. Classificação de risco
- **PL 2338/2023 (marco da IA no Brasil):** sistemas usados em saúde pedem cuidado redobrado. A Clara **apoia a comunicação** e prioriza contatos, sem decisão clínica ou de acesso. Mesmo assim, adotamos as práticas de alto risco: avaliação de impacto, supervisão humana, registro e transparência.
- **NIST AI RMF:** organizamos a gestão nas 4 funções:

| Função | O que fazemos |
|---|---|
| **Governar** | Regras escritas da IA ([ia.py](../alcance/ia.py)), compromissos públicos na página Governança, responsáveis definidos |
| **Mapear** | Matriz de riscos ([CASO_DE_NEGOCIO.md](CASO_DE_NEGOCIO.md), seção 9), público vulnerável identificado (idosos, pessoas com deficiência, baixo letramento) |
| **Medir** | Avaliação automática com 17 casos difíceis ([avaliacao.py](../alcance/avaliacao.py)), revisão humana das respostas, viés do modelo por grupo |
| **Gerenciar** | Travas no código para ações irreversíveis, troca automática de modelo, passagem para humano, registro de incidentes (seção 6) |

## 3. LGPD
| Item | Como tratamos |
|---|---|
| Base legal | Execução de políticas públicas (art. 7º, III) e tutela da saúde (art. 11, II, b e f) |
| Minimização | Só nome, telefone, consulta e perfil de acessibilidade. Se a pessoa digitar ou falar CPF, cartão ou telefone, o texto é mascarado (`[CPF]`) antes de ir para a IA e para o histórico (`assistente.mascarar`, com teste) |
| Dados sensíveis (saúde e deficiência) | Usados só para adaptar a comunicação. Acesso restrito à equipe da UBS |
| Transparência | A IA se apresenta como assistente virtual e diz quem pediu a ligação (a agente comunitária) |
| Direitos do titular | A pessoa pode pedir para não ser mais contatada pela IA e ser atendida só por humanos |
| Rede de apoio (família) | O idoso é adulto e decide. A família só é avisada com autorização registrada no cadastro ou dada na hora; sem isso, o código bloqueia o aviso (`test_rede_de_apoio_exige_consentimento`). Cada tentativa de contato fica na trilha de auditoria |
| Protótipo | **100% fictício**: nenhum dado pessoal real. O modelo usa uma base pública e anônima do SUS (Kaggle) |
| Segurança | Chaves fora do código (`.env`), webhook com assinatura da Twilio validada, só o número verificado recebe ligações na demo |
| Próximo passo (piloto) | Relatório de Impacto à Proteção de Dados, encarregado de dados nomeado, contrato de operador com os fornecedores |

## 4. Ficha do modelo de risco de falta
| Campo | Valor |
|---|---|
| Objetivo | Ordenar quem recebe contato primeiro |
| Dados | "Medical Appointment No Shows", ~110 mil consultas do SUS em Vitória (ES), públicas e anônimas |
| Variáveis | Idade, sexo, Bolsa Família, hipertensão, diabetes, deficiência, SMS recebido, dias de espera, dia da semana |
| Algoritmo | HistGradientBoosting (scikit-learn), sem balancear classes, para a probabilidade ser real (o painel soma vagas com ela) |
| Métricas | ROC-AUC **0,726** (teste com 22 mil consultas). Por grupo: 0,69 a 0,76. Gravadas em `data/modelo_metricas.json` |
| Viés encontrado | Com corte de 30%, só **2,4%** das pessoas com 60+ entrariam na fila, contra **48,9%** das de 18 a 39 anos (idosos faltam menos na média: 15,8% contra 22,8%) |
| Mitigação | Quem tem barreira real de acesso (baixa visão, surdez, pouca leitura ou sem smartphone), em qualquer idade, **sempre entra na fila**. O risco só ordena. Idade sozinha não conta como barreira |
| Uso proibido | Negar, adiar ou rebaixar atendimento por causa do risco |
| Status | Treinado em 14/11 com a base completa (110.521 registros válidos) |
| Achado sobre SMS | Comparando consultas com a mesma espera (15 a 30 dias), faltam 29,8% com SMS e 36,9% sem. O SMS ajuda pouco. A comparação bruta (27,6% × 16,7%) engana, porque o SMS só vai para consultas marcadas com antecedência |

## 5. Avaliação do assistente
- **17 casos** em 4 categorias: Segurança (emergência, CPF, tentativa de manipulação, sugestão paga, pedido de humano, **transparência: dizer que é assistente virtual**), Fundamentação (respostas da base e recusa quando a resposta não está nela), Ações (age só depois do "sim") e Acessibilidade (respostas curtas para pessoa surda, sem listas para quem recebe em áudio).
- **Resultado atual:** 17/17, resposta média em ~2,9 s (15/11/2026).
- **Processo:** conferência automática por regras **+ leitura humana de todas as respostas** a cada mudança nas regras ou nos modelos.

## 6. Registro de incidentes (encontrados nos testes)
| Data | Incidente | Como foi achado | Correção |
|---|---|---|---|
| 14/11 | A IA agia (pedia transporte) sem perguntar | Teste manual | Regra "primeiro oferece, depois faz" |
| 14/11 | A IA **liberava a vaga** quando a pessoa dizia "não consigo ir" | Avaliação automática | Regra "não conseguir ≠ não querer" + **trava no código** exigindo a confirmação da pessoa |
| 14/11 | IA disse que o SAMU é **"cento e doze"** (o certo é 192) | **Revisão humana** (o teste automático deixou passar) | Números oficiais na base, regra explícita, teste exige "192" e reprova "112" |
| 14/11 | Consultas fictícias marcadas no fim de semana | Revisão humana | Dados fictícios só em dias úteis |
| 14/11 | Fonte atribuída à lei errada (BPC como "lei do Cadastro Único") | Revisão humana | Regra: citar o nome do bloco da base (LOAS) |
| 14/11 | Limite do plano gratuito do Gemini (15 pedidos/min) | Avaliação automática | Espera automática e nova tentativa; em produção, plano pago |
| 14/11 | Modelo de faltas **quase não alertava idosos** (2,4% × 48,9%) | Medição de viés por grupo | Piso de acessibilidade: quem tem barreira sempre entra na fila |
| 14/11 | Probabilidades infladas (média de 59% para uma falta real de 20%) por causa do balanceamento de classes | Conferência do painel | Retreino sem balancear. Média caiu para 31%, coerente com consultas de especialista |
| 14/11 | Análise sugeria que "o SMS aumenta faltas" | Revisão da análise | Fator de confusão (tempo de espera). Comparação refeita só entre esperas iguais |
| 15/11 | Teste de transparência reprovava a resposta certa ("**não** sou uma pessoa de verdade") | Revisão humana do resultado | A regra do teste não via a negação. Regra corrigida: só reprova afirmações ("sou gente, sim") |
| 15/11 | Resposta de 83 palavras para quem recebe em áudio | Avaliação automática | Limite explícito de 50 palavras |
| 15/11 | Para ficar curta, a IA explicou o BPC mas não disse como pedir | Avaliação automática | Regra "corte os detalhes, nunca a resposta": responde primeiro o que foi perguntado |
| 15/11 | A IA perguntou "quer que eu chame o transporte?" e **pediu na mesma resposta** | Avaliação automática | **Trava no código**: no WhatsApp, nenhuma ação passa sem um "sim" na fala da pessoa (teste `test_nao_age_sem_o_sim`) |

## 7. Limitações conhecidas
- A transcrição de voz pode errar com sotaques fortes ou com chiado na linha. A IA pede para repetir.
- Os serviços do município na base são fictícios.
- Os custos da IA de voz vêm de tabelas de terceiros e precisam ser confirmados.
- A avaliação cobre 17 casos. No piloto, ampliar para conversas reais revisadas por amostragem.
