# ALCANCE: caso de negócio
*Versão de 14/11/2026. Os números marcados com **(premissa)** são estimativas nossas e precisam de validação num piloto. Os demais vêm das fontes indicadas. Câmbio usado: US$ 1 = R$ 5,56 (BCB, 11/11/2026).*

---

## 1. Resumo executivo
O serviço público se comunica por SMS, sites e aplicativos, e isso exclui quem não enxerga, não lê bem ou não tem internet. O resultado são **consultas perdidas e direitos não usados**. O **ALCANCE** é uma IA que vai até o cidadão pelo canal que ele consegue usar (**WhatsApp por áudio, ligação de voz ou visita do agente comunitário**) e se adapta à deficiência de cada pessoa.

**Num município de 100 mil habitantes (premissa):**

| Indicador | Valor |
|---|---|
| Vagas de especialista recuperadas por ano | **~4.500** |
| Valor econômico dessas vagas | **~R$ 450 mil/ano** |
| Custo para a prefeitura (assinatura) | **R$ 144 mil/ano** |
| Retorno para cada R$ 1 investido | **~R$ 3,10** |
| Custo por vaga recuperada | **~R$ 32**, contra ~R$ 100 de valor da vaga |
| Prazo para começar | Piloto em 90 dias, contratado por CPSI (Marco Legal das Startups) |

---

## 2. O problema em números
| Fato | Fonte |
|---|---|
| 18,6 mi de pessoas com deficiência; **7,9 mi com dificuldade para enxergar** | IBGE, PNAD 2022 |
| 47% das pessoas com deficiência têm 60+ anos; 19,5% são analfabetas | IBGE, PNAD 2022 |
| 29% dos brasileiros são analfabetos funcionais | Inaf 2024 |
| 28 mi não usam internet; 16 mi deles têm 60+ anos | TIC Domicílios 2025 |
| 45% das classes C, D e E ficam sem dados no celular antes do fim do mês (69% nas classes D e E) | Idec + Locomotiva |
| Faltas de **até 38,6%** em consultas especializadas; R$ 18,5 mi desperdiçados em 3 anos (ES) | Saúde em Debate (2020) |
| Falta sem justificativa no SISREG = **30 dias** para conseguir remarcar | Regras do SISREG |
| Só 2,9% dos sites brasileiros são acessíveis | Movimento Web para Todos 2024 |

## 3. A solução e por que funciona
- **3 frentes:** WhatsApp (áudio ou texto) · ligação de voz com IA (funciona em celular simples, sem internet) · agente comunitário, para quem não tem telefone. Existem 285 mil agentes no país.
- **Perfil de acessibilidade:** voz lenta, linguagem simples, Libras (VLibras), contato da família.
- **Ação, não só lembrete:** a IA confirma, remarca, **pede o transporte da prefeitura**, avisa a família e **libera a vaga para o próximo da fila**.
- **Evidência de que conversar funciona melhor que mandar SMS:** num ensaio randomizado com 306 pacientes no ambulatório do Hospital das Clínicas de Ribeirão Preto, as faltas foram de **9,5% com ligação**, contra **21% com SMS** e **22,8% sem lembrete**. Revisões apontam redução de faltas de **até 40 a 50%** com lembretes, e a ligação com confirmação foi o mais eficaz.

## 4. Benefícios
### Para o cidadão
- Não perde a consulta por não conseguir ler um SMS, e escapa da punição de 30 dias.
- Entende cartas e direitos em linguagem simples.
- Recebe ajuda concreta (transporte, remarcação), não só um aviso.
- Ninguém fica de fora por não ter smartphone.

### Para a prefeitura e a UBS
- **Menos vagas desperdiçadas** e fila andando mais rápido.
- **Cumprimento da lei:** Lei 15.263/2025 (Linguagem Simples), Lei Brasileira de Inclusão (atendimento acessível), ABNT NBR 17225.
- **Dados para gestão:** motivo das faltas (transporte, trabalho, esquecimento), por bairro.
- **Agentes comunitários mais produtivos:** visitam primeiro quem mais precisa.

### Para a sociedade
- Redução de desigualdade no acesso à saúde (ODS 10 e 3).
- Instituições mais eficazes e transparentes (ODS 16).

## 5. Custos de operação (unitários)
| Item | Custo | Fonte |
|---|---|---|
| Ligação para celular no Brasil (Twilio) | US$ 0,0663/min ≈ R$ 0,37/min | Tabela da Twilio |
| IA de voz (Gemini Live): entrada + saída | ~US$ 0,023/min. Usamos **US$ 0,046/min ≈ R$ 0,26/min**, o dobro, porque o histórico da conversa é cobrado de novo a cada fala | Tabelas de terceiros, a confirmar na Google |
| Número de telefone brasileiro | US$ 4,25/mês ≈ R$ 24 | Tabela da Twilio |
| Mensagem de WhatsApp de utilidade (lembrete) | ~US$ 0,008 ≈ R$ 0,045 | Tabelas da Meta via parceiros |
| **Ligação típica de 2 min** | **≈ R$ 1,30** | Cálculo |
| **Conversa típica no WhatsApp** | **≈ R$ 0,10** | Cálculo |
| Visita do agente | R$ 0 a mais (o agente já faz visitas; o ALCANCE só ordena a lista) | — |

## 6. Cenário: município de 100 mil habitantes
**Premissas:**
- 0,5 consulta especializada por habitante por ano (parâmetro da Portaria GM/MS 1.101/2002) = **~4.170 consultas/mês**.
- 30% de faltas = **~1.250 faltas/mês** (entre a média nacional de 25% e os 38,6% do ES).
- O ALCANCE contata 50% das consultas (as de maior risco) = 2.085 contatos/mês.
  - Distribuição: 70% WhatsApp, 25% ligação, 5% agente (inspirada na TIC Domicílios).
- **Redução conservadora de 30% nas faltas** (o estudo de Ribeirão Preto mostrou ~58%).
- Valor de referência por vaga: **R$ 100** (faixa de R$ 80 a 120 de uma consulta especializada popular; o SUS paga ~R$ 10 pela tabela, o que subestima o custo real).

| Conta | Por mês | Por ano |
|---|---|---|
| Ligações (520 × 1,3 tentativa × R$ 1,30) | R$ 880 | R$ 10,6 mil |
| WhatsApp (1.460 conversas × R$ 0,10 + lembretes) | R$ 250 | R$ 3,0 mil |
| Infraestrutura (servidor, banco, monitoramento, número) | R$ 850 | R$ 10,2 mil |
| Suporte e sucesso do cliente (alocado) | R$ 2.500 | R$ 30 mil |
| **Custo total para nós** | **~R$ 4.480** | **~R$ 54 mil** |
| **Preço para a prefeitura** (R$ 0,12 por habitante/mês) | **R$ 12.000** | **R$ 144 mil** |
| Margem bruta | | **~62%** |
| **Vagas recuperadas** (1.250 × 30%) | **375** | **4.500** |
| **Valor das vagas recuperadas** | **R$ 37,5 mil** | **R$ 450 mil** |
| **Retorno para a prefeitura** | | **~3,1×** |

### Sensibilidade (valor gerado por ano)
| Redução de faltas → / valor da vaga ↓ | 15% | 30% | 50% |
|---|---|---|---|
| R$ 50 | R$ 112 mil | R$ 225 mil | R$ 375 mil |
| R$ 100 | R$ 225 mil | **R$ 450 mil** | R$ 750 mil |
| R$ 150 | R$ 337 mil | R$ 675 mil | R$ 1,1 mi |

> Mesmo no pior canto da tabela (R$ 50 e 15%), o benefício fica perto do custo. Isso **sem contar** os ganhos que não medimos em R$: inclusão, cumprimento da lei, fila menor e benefícios sociais acessados.

## 7. Investimento para o piloto (6 meses)
| Item | Valor |
|---|---|
| Equipe: 2 devs, 1 UX/acessibilidade, 1 produto/saúde (4 × R$ 12,5 mil × 6 meses) | R$ 300 mil |
| Telefonia, IA e nuvem | R$ 20 mil |
| Pesquisa com usuários com deficiência + intérprete de Libras | R$ 20 mil |
| Jurídico e LGPD (encarregado de dados, relatório de impacto) | R$ 10 mil |
| **Total** | **R$ 350 mil** |

**Como contratar:** pelo **CPSI** (Contrato Público para Solução Inovadora, LC 182/2021), que vai até **R$ 1,6 mi** por 12 meses (prorrogáveis) e permite depois um contrato de fornecimento de até R$ 8 mi, sem a licitação tradicional.

## 8. Modelo de negócio
- **Cliente:** prefeituras, secretarias de saúde e consórcios intermunicipais (5.570 municípios).
- **Receita:** assinatura por habitante/mês + taxa de implantação (~R$ 30 mil: integração, treinamento dos agentes).
- **Expansão:** novas habilidades sobre a mesma base: Remédio em Dia, Alerta da Defesa Civil, benefícios sociais (CRAS).
- **Concorrência:** assistentes de WhatsApp municipais (Estela, em Natal), tradutores de Libras (Hand Talk, VLibras), IAs que ligam para idosos no exterior (NANA, em Singapura). **Ninguém junta** atendimento proativo + sem internet + adaptado à deficiência + agente humano + SUS.

## 9. Riscos e como tratamos
| Risco | Mitigação |
|---|---|
| **A pessoa achar que é golpe** | A IA cita o nome da agente comunitária que a pessoa conhece, nunca pede dados nem dinheiro, e oferece confirmar no posto. No futuro: número oficial verificado |
| IA errar ou "inventar" | Regras rígidas, ações estruturadas (não texto livre), sempre oferece um humano, auditoria das conversas |
| LGPD e dados de saúde | Base legal de execução de política pública (LGPD art. 7º, III e art. 11, II, b), minimização de dados, encarregado de dados, relatório de impacto, protótipo 100% fictício |
| Viés do modelo de faltas | Medir a precisão por idade, sexo e bairro; o modelo só **prioriza** contato, nunca nega atendimento |
| Exclusão de quem não tem telefone | A terceira frente: agente comunitário |
| Dependência de fornecedores (Google, Twilio) | Arquitetura com troca de modelo e de provedor; o modelo de voz já tem reserva automática |
| Integração com sistemas legados (SISREG, e-SUS) | Começar por exportação de planilha; depois, integração |
| Resistência das equipes | Desenho junto com agentes e gestores; o ALCANCE **apoia** o agente, não substitui |

## 10. Indicadores (como provamos que funciona)
- Taxa de faltas (antes × depois, UBS piloto × UBS de comparação)
- Vagas reaproveitadas por mês
- Tempo médio de espera na fila
- % de contatos concluídos por canal
- % de conversas passadas para um humano
- Satisfação, medida por voz ("de 1 a 5, o senhor gostou?")
- Custo por vaga recuperada

## 11. Roadmap
| Fase | Quando | O quê |
|---|---|---|
| 0. Protótipo | Nov/2026 (GS) | 3 frentes funcionando, ligação real com IA, painel |
| 1. Piloto | 6 meses | 1 UBS, CPSI, medição contra UBS de comparação |
| 2. Município | +6 meses | Todas as UBS, integração com o SISREG |
| 3. Plataforma | 2027–2028 | Novas habilidades (remédio, Defesa Civil, CRAS), consórcios de municípios |

---
### Fontes
- IBGE, PNAD 2022 (pessoas com deficiência): agenciadenoticias.ibge.gov.br
- Inaf 2024: unicef.org/brazil
- TIC Domicílios 2025: cetic.br
- Idec + Locomotiva, "Barreiras e limitações no acesso à internet": idec.org.br
- Absenteísmo no ES, Saúde em Debate (2020): doaj.org/article/1df88051fdb3453696d732a5aaa75677
- Ligação × SMS no ambulatório do HC de Ribeirão Preto (Lance, Pazin Filho e Neves): hcrp.usp.br/revistaqualidade/uploads/Artigos/239/239.pdf
- Revisão de escopo sobre lembretes: journals.ipl.pt/stecnologia/article/view/901
- Preços da Twilio Voice (Brasil): twilio.com/voice/pricing/br
- Preços do WhatsApp no Brasil: talkall.com.br/en/novidades/tarifas-whatsapp-2026 · messagecentral.com/blog/whatsapp-business-api-pricing-brazil
- Preços do Gemini Live (terceiros): cekura.ai/blogs/gemini-live-api-pricing
- Portaria GM/MS 1.101/2002 (parâmetros assistenciais)
- CPSI, LC 182/2021: portal.tcu.gov.br (página "Contrato Público para Solução Inovadora")
- Câmbio: BCB via brasil61.com (11/11/2026)
