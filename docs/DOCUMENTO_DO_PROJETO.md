# ALCANCE: o serviço público que chega em você
**Global Solution 2026.2 · FIAP · Desafio CitizenTech** · Equipe: Vitor Soares Gonçalves (RM 566181) e Pietro Boroto (RM 562407)

> O serviço público foi desenhado para quem enxerga, ouve, lê bem e tem internet. O ALCANCE inverte essa lógica: **a IA se adapta à pessoa e vai até ela.**

Documentos de apoio: [Caso de negócio](CASO_DE_NEGOCIO.md) · [Governança da IA](GOVERNANCA.md) · [Roteiro do pitch](ROTEIRO_PITCH.md) · [Dados e fontes](../PESQUISA.md)

---

## 1. Começamos pela vida real
**Seu Antônio, 68 anos.** Tem baixa visão por causa do diabetes, mora sozinho, estudou até a 3ª série e usa um celular simples, de botão, que fica sem crédito por volta do dia 20.

A UBS marcou o oftalmologista dele por **SMS**. Ele não conseguiu ler, faltou e voltou para o fim da fila: **30 dias para remarcar no SISREG**. A vaga, que custa caro ao SUS, ficou vazia.

O Seu Antônio não é exceção:

| Dado | Fonte |
|---|---|
| **28 milhões** de brasileiros não usam internet | TIC Domicílios 2025 |
| **29%** dos brasileiros são analfabetos funcionais | Inaf |
| **69%** das pessoas das classes D e E ficam sem dados antes do fim do mês | Idec / Locomotiva |
| **18,6 milhões** de pessoas com deficiência, 7,9 milhões com dificuldade para enxergar | IBGE, PNAD 2022 |
| Só **2,9%** dos sites brasileiros passam nos testes de acessibilidade | MWPT |
| Até **38,6%** de faltas em consultas especializadas | SES-ES |

## 2. As 6 perguntas do desafio

### 2.1 Quem é o cidadão beneficiado?
Quem o serviço digital deixa de fora: **pessoas com deficiência** (visual, auditiva), **idosos**, **pessoas com baixa alfabetização** e **quem não tem internet ou smartphone**. Personas do protótipo (todas fictícias):

| Persona | Situação | Como o ALCANCE chega |
|---|---|---|
| **Seu Antônio**, 68 | Baixa visão, celular de botão, sem dados | Ligação de voz com IA |
| **Dona Benedita**, 72 | Smartphone, lê pouco | WhatsApp em áudio, com voz mais lenta |
| **Júlia**, 24 | Surda, Libras é a primeira língua | Texto curto + VLibras |
| **Rosa**, agente comunitária | Visita 150 famílias sem saber quem priorizar | Lista de visitas por risco |
| **Carla**, gestora da UBS | Vê vagas se perdendo | Painel com a fila ao vivo |

### 2.2 Qual problema será resolvido?
A **comunicação do serviço público é inacessível**: SMS, sites e aplicativos pressupõem que a pessoa lê bem, enxerga e tem internet. O resultado é concreto:
- **consultas perdidas** e fila do SISREG travada;
- **direitos não usados** (BPC, Tarifa Social, Passe Livre), porque a pessoa não entende a carta ou não sabe que tem direito;
- **descumprimento da lei**: a Lei 15.263/2025 obriga a linguagem simples e a Lei Brasileira de Inclusão exige atendimento acessível.

### 2.3 Como a solução funciona?
Uma IA conversacional que **chama primeiro** e escolhe sozinha o caminho certo para cada pessoa:

| Frente | Quando entra | No protótipo |
|---|---|---|
| 📱 **WhatsApp em áudio ou texto** | A pessoa tem smartphone e dados | Funciona de verdade (Twilio). Entende áudio, texto e **foto de carta** e responde com voz para quem lê pouco |
| ☎️ **Ligação de voz com IA** | Celular simples, telefone fixo ou sem dados no fim do mês | Funciona de verdade: a IA liga, conversa em tempo real, sem "aperte 1" |
| 🧑‍⚕️ **Visita do agente comunitário** | A pessoa não tem telefone | Lista de visitas da Rosa, ordenada por risco |

A regra que escolhe a frente está em [`alcance/canais.py`](../alcance/canais.py): sem telefone, vai o agente. Com celular simples, vai a ligação. Com smartphone mas sem dados naquele dia do mês, vai a ligação. Fora isso, WhatsApp.

Cada cidadão tem um **perfil de acessibilidade** (voz mais lenta, linguagem simples, Libras, contato da família), e a IA o usa em toda conversa.

**O que a IA faz na conversa:** confirma a consulta, remarca, pede o transporte da prefeitura, avisa um familiar, agenda lembrete, explica uma carta e tira dúvidas de direitos citando a fonte. **Cada ação atualiza o painel da UBS na hora**, e a vaga só é liberada quando a pessoa diz claramente que não quer ir.

### 2.4 Quem participa do ecossistema?
- **Cidadão e família** (contato de apoio)
- **UBS e Secretaria de Saúde**: painel da fila, vagas recuperadas
- **Agentes comunitários de saúde**: 285 mil no Brasil, a "última milha" humana
- **CRAS e assistência social**: CadÚnico, BPC, Tarifa Social
- **Transporte sanitário da prefeitura**
- **ONGs e conselhos de pessoas com deficiência**: validação e piloto
- **Prefeitura**: contratante, via CPSI (Marco Legal das Startups)

### 2.5 Quais tecnologias?
| Peça | Tecnologia | Para quê |
|---|---|---|
| Conversa por voz em tempo real | **Gemini Live** + **Twilio Media Streams** | A ligação com IA, com interrupção natural |
| WhatsApp | **Twilio WhatsApp** + **Gemini** (texto, áudio e imagem) | Entender áudio e foto de carta |
| Voz da IA | **Gemini TTS** | Resposta em áudio, mais lenta quando o perfil pede |
| Ações | **Chamada de funções** do Gemini | Confirmar, remarcar, transporte, liberar vaga |
| Base de conhecimento | Base curada ([`conhecimento.md`](../alcance/conhecimento.md)) no contexto | Respostas sobre LBI, BPC, CadÚnico e SAMU, com a fonte citada |
| Risco de falta | **scikit-learn** (HistGradientBoosting) com dataset público de 110 mil consultas do SUS (Vitória/ES), ROC-AUC 0,726 | Ordenar quem recebe contato primeiro |
| Back-end | **Python, FastAPI, SQLite** | API, banco fictício, trilha de auditoria |
| Site | **React, Vite, Tailwind**, fonte Atkinson Hyperlegible, **VLibras** | Painel da UBS, visitas, demonstração, governança |

### 2.6 Quais resultados pode gerar?
Num município de **100 mil habitantes** (estimativa conservadora, detalhada no [caso de negócio](CASO_DE_NEGOCIO.md)):
- cerca de **4.500 consultas especializadas recuperadas por ano**;
- **R$ 32 por vaga recuperada**, para uma vaga que vale cerca de R$ 100;
- retorno de **~R$ 3,10 para cada R$ 1** investido pela prefeitura;
- custo de **R$ 0,12 por habitante/mês**.

Nos dados reais do SUS, o SMS ajuda pouco: com a mesma espera (15 a 30 dias), ainda faltam **29,8%** de quem recebe SMS. E num estudo numa UBS de Ribeirão Preto, as faltas foram de **9,5% com ligação**, contra **21% com SMS** e **22,8% sem lembrete**. Nossa estimativa usa uma redução de só 30%.

**Indicadores do piloto:** taxa de faltas (contra uma UBS de comparação), vagas recuperadas, tempo até remarcar, % de conversas passadas para humano e satisfação por voz.

## 3. Governança e IA responsável
Detalhes em [GOVERNANCA.md](GOVERNANCA.md). O essencial:
- **A IA não decide sozinha o que é irreversível.** Liberar a vaga exige a confirmação da pessoa, e isso é verificado no código, não só no prompt.
- **Avaliação automática:** 16 casos de teste em 4 categorias (segurança, fundamentação, ações, acessibilidade). Resultado atual: **16/16**. A avaliação já pegou 2 erros reais, que corrigimos: a IA liberava a vaga quando a pessoa dizia "não consigo ir" e, uma vez, citou o número errado do SAMU.
- **Viés medido e corrigido:** o modelo de faltas quase não alertava idosos (2,4% contra 48,9% dos adultos jovens), porque na média eles faltam menos. Quem tem barreira de acesso agora sempre entra na fila de contato.
- **LGPD:** coleta mínima, nunca pede CPF, e CPF, cartão ou telefone digitados são mascarados antes de ir para a IA. Protótipo só com pessoas fictícias.
- **Proteção contra golpe:** na ligação, a IA se identifica pelo nome da agente comunitária que a pessoa já conhece e nunca pede dados ou pagamento.
- **Trilha de auditoria:** toda ação fica registrada e aparece na tela de governança.
- **Sempre há um humano:** a pessoa pode pedir para falar com alguém a qualquer momento.
- Referências: LGPD, PL 2338/2023 (classificação de risco), NIST AI RMF.

## 4. O que já funciona (protótipo)
- [x] Ligação real com IA para um celular, com ações gravadas no banco
- [x] WhatsApp com áudio, texto e foto de carta, e resposta em áudio
- [x] Painel da UBS atualizando ao vivo a cada conversa
- [x] Lista de visitas do agente comunitário
- [x] Tela de governança com avaliação, auditoria e compromissos
- [x] Site acessível (alto contraste, 3 tamanhos de texto, VLibras, fonte para baixa visão)
- [x] Testes automatizados

**Limitações honestas:** dados de cidadãos fictícios; a conta Twilio de teste só liga para números verificados; o modelo de risco foi treinado com dados de 2016 de uma única cidade e precisa ser retreinado com dados do município; ainda não houve teste com usuários reais.

## 5. Próximos passos
| Fase | Prazo | O quê |
|---|---|---|
| 1. Protótipo | nov/2026 | Este projeto |
| 2. Piloto | 6 meses | 1 UBS, contratado por CPSI (~R$ 350 mil), medido contra uma UBS de comparação |
| 3. Município | 2027 | Todas as UBS, CRAS e transporte sanitário |
| 4. Plataforma | 2027–28 | Outros serviços (benefícios, vacinação, assistência social) e outros municípios |
