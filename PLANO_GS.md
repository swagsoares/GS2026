# ALCANCE — "O serviço público que chega em você"
*(nome provisório: o "Cida" já existe em Arapiraca. Outras opções: **Ponte**, **Junto**. Pesquisar se o nome está livre antes do vídeo.)*

**Global Solution 2026.2 · 2TIA · Desafio CitizenTech** · entrega até **19/11/2026, 23h55** · vídeo pitch de até 7 min
Base de dados e fontes: [PESQUISA.md](PESQUISA.md)

---

## 1. A tese em uma frase
O serviço público foi desenhado para quem enxerga, ouve, lê bem e tem internet. **O ALCANCE inverte essa lógica: a IA se adapta à pessoa e vai até ela**, por WhatsApp, por ligação ou pelas mãos de um agente comunitário.

## 2. As 6 perguntas do desafio
| Pergunta | Resposta |
|---|---|
| **Quem é o cidadão beneficiado?** | Os 18,6 mi de pessoas com deficiência (7,9 mi com dificuldade para enxergar), idosos e pessoas com baixa alfabetização: quem o serviço digital deixa de fora |
| **Qual problema será resolvido?** | A comunicação do serviço público é inacessível (SMS, sites e apps). Consequências: consultas perdidas (até 38,6% de faltas nas especializadas no ES) e direitos não usados (7,9 mi de famílias sem a Tarifa Social) |
| **Como a solução vai funcionar?** | Uma IA conversacional com **perfil de acessibilidade** (voz, linguagem simples, Libras), que **chama primeiro** (proativa) por 3 frentes: WhatsApp por áudio · ligação de voz · agente comunitário |
| **Quem participa do ecossistema?** | Cidadão e família · UBS e Secretaria de Saúde · CRAS · agentes comunitários de saúde (285 mil) · prefeitura · ONGs de pessoas com deficiência |
| **Quais tecnologias?** | LLM com voz (Gemini Live), telefonia com IA (Twilio Media Streams), base de conhecimento em linguagem simples, ML para prever faltas, visão para ler cartas, VLibras |
| **Quais resultados pode gerar?** | Menos faltas, fila andando, R$ economizado, benefícios acessados e cumprimento da Lei 15.263/2025 (Linguagem Simples). Medimos tudo em KPIs |

## 3. Personas
- **🎯 Seu Antônio, 68 (protagonista):** baixa visão por diabetes, mora sozinho, estudou até a 3ª série, celular simples que fica sem dados no dia 20. Faltou à consulta do oftalmologista porque não leu o SMS → punido com 30 dias para remarcar no SISREG.
- **Júlia, 24:** surda, tem a Libras como 1ª língua e dificuldade com o português escrito.
- **Rosa, agente comunitária de saúde:** visita 150 famílias e não sabe quem precisa dela primeiro.
- **Carla, gestora da UBS:** vê as vagas se perdendo e não tem ferramenta para evitar.

> Antes de gravar: conversar com 1 ou 2 pessoas reais parecidas com o Seu Antônio e com 1 agente de saúde, e gravar 10 segundos de depoimento (com autorização).

## 4. A solução
### As 3 frentes (a ideia central)
| Frente | Quando entra | Demo no protótipo |
|---|---|---|
| 📱 WhatsApp por áudio | A pessoa tem smartphone | Twilio WhatsApp Sandbox **(real)** |
| ☎️ Ligação de voz com IA | Celular de botão, sem dados, sem saber ler | Twilio + Gemini Live ligando para um celular **(real)** |
| 🧑‍⚕️ Agente humano | A pessoa não tem telefone | Painel da Rosa com a lista de visitas prioritárias **(real)** |

### Perfil de acessibilidade
Cada cidadão tem um perfil: **canal preferido · voz lenta · linguagem simples · Libras · contato da família**. A IA usa o perfil em toda conversa.

### Habilidades (o MVP tem 3, o resto fica no roadmap)
| # | Habilidade | MVP? |
|---|---|---|
| 1 | **Consulta Garantida:** prevê o risco de falta (ML com dados reais) → liga, confirma ou remarca → libera a vaga para o próximo | ✅ Protagonista |
| 2 | **Lê pra Mim:** a pessoa fotografa a carta (INSS, SUS, conta de luz) → a IA explica em linguagem simples, por áudio | ✅ |
| 3 | **Tira-Dúvidas de Direitos:** RAG sobre a LBI, BPC e Tarifa Social, sempre citando a fonte, em linguagem simples | ✅ |
| 4 | Remédio em Dia (ligação diária para idosos sozinhos) | Roadmap |
| 5 | Alerta Para Todos (Defesa Civil para acamados) | Roadmap |
| 6 | Entrada em Libras pela câmera | Roadmap / bônus |

## 5. Arquitetura
```
 Cidadão ──WhatsApp──┐      ┌── Ligação (Twilio + Gemini Live)
                     ▼      ▼
              ┌──────────────────────┐
              │  Orquestrador (FastAPI)│  ← perfil de acessibilidade
              │  LLM Gemini + guardrails│
              └──┬────────┬────────┬─┘
     Modelo de faltas  RAG direitos  Visão (ler carta)
     (scikit-learn,    (linguagem    (Gemini vision)
      dados Kaggle)     simples)
                 │
             SQLite (cidadãos fictícios, agenda, chamados)
                 │
   Painel Streamlit: Rosa (visitas) · Carla (vagas/KPIs) · Governança · VLibras
```

## 6. Stack (o mínimo que entrega o "uau")
| Parte | Ferramenta | Por quê |
|---|---|---|
| Linguagem | Python 3.11 | Tudo num lugar só |
| WhatsApp e ligação | **Twilio** (conta trial) | Um único provedor para as 2 frentes |
| Voz em tempo real | **Twilio Media Streams + Gemini Live** direto (trocamos o Pipecat por uma ponte própria de ~170 linhas, mais simples de explicar) | ⚠️ Usar o modelo **estável** do Gemini (as versões preview da Live saem do ar em 17/11) |
| LLM | Gemini (camada gratuita) | Voz, visão e texto num lugar só |
| Previsão de faltas | scikit-learn / LightGBM no dataset do Kaggle (Vitória/ES) | Dado real |
| RAG | LlamaIndex + textos oficiais (LBI, regras do BPC e da Tarifa Social) | Cita a fonte |
| Painéis | Streamlit + Plotly | Rápido e bonito |
| Libras | Widget VLibras | Oficial e gratuito |
| Privacidade | Dados 100% fictícios + mascaramento de dados pessoais (Presidio) | LGPD |

## 7. Modelo de negócio
- **B2G (SaaS para prefeituras e secretarias de saúde)**, cobrado por habitante atendido ou por módulo.
- **Por que a prefeitura compra:** (1) a Lei 15.263/2025 obriga a usar linguagem simples, (2) a LBI obriga a oferecer atendimento acessível, (3) **cada falta evitada é dinheiro economizado**: o ES perdeu R$ 18,5 mi em 3 anos.
- Canais de venda: consórcios de saúde, Frente Nacional de Prefeitos, editais de inovação (GovTech).

## 8. Matriz do Oceano Azul (vai para o pitch)
| Eliminar | Reduzir | Elevar | Criar |
|---|---|---|---|
| Obrigar a baixar app ou entrar em site | Dependência de texto e de leitura | Proatividade (a IA chama primeiro) | Atendimento **sem internet** (ligação) |
| Formulários | Burocratês | Inclusão de pessoas com deficiência | **Perfil de acessibilidade** |
| | Faltas e vagas perdidas | Confiança (cita a fonte, humano no controle) | **Agente humano** como canal |

## 9. Ética, LGPD e responsabilidade
Dados fictícios no protótipo · consentimento antes de ligar · a IA não dá diagnóstico médico · sempre existe a opção de falar com um humano · a fonte é citada em toda resposta de direitos · log de auditoria · métricas de viés do modelo de faltas (por idade, sexo e bairro).

## 10. ODS
**10** Redução das desigualdades · **3** Saúde e bem-estar · **11** Cidades sustentáveis · **16** Instituições eficazes · **9** Inovação.

## 11. Roteiro do vídeo (7 min)
| Tempo | Cena |
|---|---|
| 0:00–0:40 | **Gancho:** "O Seu Antônio não perdeu a consulta por descuido. O SUS mandou um SMS para quem não consegue ler." + depoimento real |
| 0:40–1:30 | Problema em números (7,9 mi com dificuldade para enxergar, 69% das classes D e E sem dados, faltas, só 2,9% dos sites acessíveis) |
| 1:30–2:00 | A tese e as 3 frentes |
| 2:00–4:30 | **Demo ao vivo:** 📞 celular simples toca → a IA confirma a consulta por voz · 📄 foto da carta do INSS explicada em áudio · 💬 Júlia pergunta pelo WhatsApp com resposta + VLibras · 🧑‍⚕️ painel da Rosa · 📊 painel da Carla |
| 4:30–5:30 | Por baixo do capô: modelo de faltas (dados reais), RAG com citação, ética e LGPD |
| 5:30–6:30 | Oceano azul + modelo de negócio + Lei 15.263 ("por que agora") + ODS |
| 6:30–7:00 | Fechamento: "A tecnologia certa não exige que a pessoa mude. Ela vai até a pessoa." |

## 12. Status em 11/11 (fim do dia)
| Parte | Status |
|---|---|
| Ideia, pesquisa e dados ([PESQUISA.md](PESQUISA.md)) | ✅ |
| Python, ambiente e testes automáticos (5 passando) | ✅ |
| Banco fictício + lógica das 3 frentes (`canais.py`) | ✅ |
| API FastAPI | ✅ |
| Site React (UBS, visitas, demonstração, acessibilidade, VLibras) | ✅ Com roteiros fixos na demo |
| Chave do Gemini | ✅ Testada (usar 3.6/3.5-flash, com troca automática se der 503) |
| Twilio: ligação para o celular | ✅ Testada (o celular tocou) |
| Modelo de faltas com dados reais | ⏳ Falta o CSV do Kaggle |
| WhatsApp sandbox | ⏳ Falta confirmar o `join` |
| Conversa real da IA (voz, WhatsApp, carta, direitos) | ❌ Começa amanhã |
| **Atualização 14/11:** ligação com IA em tempo real (Twilio + túnel + Gemini Live + ações no banco + proteção contra golpe) | ✅ Funcionou no celular. Falta: a legenda às vezes sai em espanhol |
| **Atualização 14/11:** caso de negócio completo ([docs/CASO_DE_NEGOCIO.md](docs/CASO_DE_NEGOCIO.md)) | ✅ |
| **Atualização 14/11 (noite):** WhatsApp (áudio, foto de carta, resposta em voz), base de direitos, painel ao vivo, botão "ligar de verdade", governança (16/16 na avaliação, trava de ação irreversível, máscara de CPF), slides, roteiro e [documento do projeto](docs/DOCUMENTO_DO_PROJETO.md) | ✅ Código pronto. Falta testar o WhatsApp de ponta a ponta no celular |

## 13. O que falta
### Eu (código)
1. **Modelo de faltas real:** treinar com o Kaggle, medir ROC-AUC e viés por idade e sexo, e checar o insight "o SMS não resolve" para o pitch.
2. **Cérebro da IA (`alcance/ia.py`):** Gemini com troca automática de modelo, persona do ALCANCE, linguagem simples, regras de segurança (sem diagnóstico, oferece um humano, não sugere "Uber" para quem não pode pagar) e mascaramento de dados pessoais.
3. **Túnel público** (cloudflared, grátis): a Twilio precisa alcançar o servidor que roda no seu computador.
4. **Ligação com IA em tempo real:** Twilio Media Streams + Gemini Live. A IA conversa de verdade e grava o resultado (confirmou, remarcou, pediu transporte).
5. **Bot de WhatsApp:** recebe áudio, texto e foto e responde em áudio e texto, conforme o perfil de acessibilidade.
6. **Lê pra Mim:** foto da carta → explicação simples em áudio.
7. **Tira-Dúvidas de Direitos:** base com LBI, BPC, Tarifa Social e CadÚnico, respondendo com a fonte citada.
8. **Fechar o ciclo no painel:** cada conversa atualiza a consulta (confirmada, remarcada, vaga liberada) e o painel da Carla mostra isso ao vivo.
9. **Botão "Ligar para mim de verdade"** na demo do site.
10. **Governança:** tela com métricas do modelo, viés, avaliação das respostas da IA (~20 perguntas de teste), LGPD e ética.
11. **Entrega:** README final, documento do projeto, slides e roteiro do vídeo.

### Você
1. Colocar o **CSV do Kaggle** em `data/raw/`.
2. Mandar o **`join ...`** no WhatsApp para o +1 415 523 8886.
3. Mandar o **link do repositório no GitHub** e autorizar o primeiro commit.
4. Fazer **1 ou 2 conversas reais** (pessoa com baixa visão ou idosa + 1 agente de saúde), gravando 10 segundos com autorização.
5. **Confirmar com o professor o formato da entrega** (só o vídeo, ou vídeo + documento + GitHub).
6. Decidir o **upgrade da Twilio** (~US$ 20) perto da gravação, para tirar o aviso de "conta de teste".

## 14. Cronograma até a entrega
| Dia | Eu | Você |
|---|---|---|
| **Qui 12** | Modelo real + cérebro da IA + túnel + **ligação com IA em tempo real** | CSV, join do WhatsApp, GitHub |
| **Sex 13** | Bot de WhatsApp + Lê pra Mim | Testar no seu celular |
| **Sáb 14** | Tira-Dúvidas (RAG) + ciclo fechado no painel + botão "Ligar para mim" | Entrevistas reais |
| **Dom 15** | Governança + avaliação da IA + polimento visual | Testar tudo e dar feedback |
| **Seg 16** | Testes finais, README, documento | Ensaiar a demo |
| **Ter 17** | Slides + roteiro final | Gravar as cenas |
| **Qua 18** | Ajustes | Editar o vídeo |
| **Qui 19** | Folga para imprevistos | **Enviar até 23h55** |
