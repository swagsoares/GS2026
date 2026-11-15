// Gera a documentação ABNT do ALCANCE. Uso: node gerar.js saida.docx [paginas.json]
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType,
  BorderStyle, ShadingType, Header, PageNumber, PageBreak, TabStopType, LineRuleType, VerticalAlign,
} = require('docx');

const SAIDA = process.argv[2] || 'ALCANCE_documentacao_ABNT.docx';
const PAGINAS = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8')) : {};
const FONTE = 'Arial';
const LARGURA = 9071; // A4 menos margens 3 cm + 2 cm
const L15 = { line: 360, lineRule: LineRuleType.AUTO }; // espaçamento 1,5
const L1 = { line: 240, lineRule: LineRuleType.AUTO };

// texto com **negrito**
function runs(texto, extra = {}) {
  return texto.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((t) =>
    t.startsWith('**') ? new TextRun({ text: t.slice(2, -2), bold: true, font: FONTE, ...extra })
      : new TextRun({ text: t, font: FONTE, ...extra }));
}
const p = (t) => new Paragraph({ children: runs(t), alignment: t.includes('https://') ? AlignmentType.LEFT : AlignmentType.JUSTIFIED, indent: { firstLine: 709 }, spacing: { ...L15, after: 0 } });
const centro = (t, o = {}) => new Paragraph({ children: runs(t, o.run || {}), alignment: AlignmentType.CENTER, spacing: { ...L15, before: o.before || 0, after: o.after || 0 } });
const vazio = (n = 1) => Array.from({ length: n }, () => new Paragraph({ children: [], spacing: L15 }));
const quebra = () => new Paragraph({ children: [new PageBreak()] });
const item = (t) => new Paragraph({ children: runs(t), alignment: AlignmentType.JUSTIFIED, indent: { left: 709, hanging: 284 }, spacing: { ...L15, after: 0 } });

const SUMARIO = [];
function h1(t, { semNumero = false } = {}) {
  SUMARIO.push({ nivel: 1, t });
  return new Paragraph({ children: [new TextRun({ text: t, bold: true, font: FONTE })], alignment: semNumero ? AlignmentType.CENTER : AlignmentType.LEFT,
    pageBreakBefore: true, keepNext: true, spacing: { ...L15, before: 0, after: 360 } });
}
function h2(t) {
  SUMARIO.push({ nivel: 2, t });
  return new Paragraph({ children: [new TextRun({ text: t, bold: true, font: FONTE })], keepNext: true, spacing: { ...L15, before: 360, after: 240 } });
}

let nQuadro = 0;
const borda = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
function quadro(titulo, cab, linhas, fonte, pesos) {
  nQuadro += 1;
  const soma = pesos.reduce((a, b) => a + b, 0);
  const larg = pesos.map((x) => Math.floor((x / soma) * LARGURA));
  larg[larg.length - 1] += LARGURA - larg.reduce((a, b) => a + b, 0);
  const cel = (t, i, topo, ultima) => new TableCell({
    width: { size: larg[i], type: WidthType.DXA },
    borders: { top: borda, bottom: borda, left: borda, right: borda },
    shading: topo ? { type: ShadingType.CLEAR, color: 'auto', fill: 'E7E7E7' } : undefined,
    margins: { top: 40, bottom: 40, left: 80, right: 80 }, verticalAlign: VerticalAlign.TOP,
    children: [new Paragraph({ keepNext: !ultima, keepLines: true, children: runs(t, { size: 20, bold: topo || undefined }), spacing: { ...L1, after: 0 } })],
  });
  return [
    new Paragraph({ children: runs(`**Quadro ${nQuadro}** – ${titulo}`, { size: 20 }), alignment: AlignmentType.CENTER, keepNext: true, spacing: { ...L1, before: 240, after: 80 } }),
    new Table({ width: { size: LARGURA, type: WidthType.DXA }, columnWidths: larg,
      rows: [new TableRow({ tableHeader: true, cantSplit: true, children: cab.map((t, i) => cel(t, i, true)) }),
        ...linhas.map((l, k) => new TableRow({ cantSplit: true, children: l.map((t, i) => cel(t, i, false, k === linhas.length - 1)) }))] }),
    new Paragraph({ children: runs(`Fonte: ${fonte}`, { size: 20 }), spacing: { ...L1, before: 80, after: 240 } }),
  ];
}

// ---------- PRÉ-TEXTUAIS ----------
const AUTORES = ['VITOR SOARES GONÇALVES – RM 566181', 'PIETRO BOROTO – RM 562407'];
const capa = [
  centro('**FIAP – FACULDADE DE INFORMÁTICA E ADMINISTRAÇÃO PAULISTA**'),
  centro('CURSO DE INTELIGÊNCIA ARTIFICIAL – TURMA 2TIA'),
  ...vazio(4),
  ...AUTORES.map((a) => centro(a)),
  ...vazio(5),
  centro('**ALCANCE: O SERVIÇO PÚBLICO QUE CHEGA EM VOCÊ**'),
  centro('Inteligência artificial de acessibilidade para levar a comunicação do SUS até o cidadão'),
  ...vazio(9),
  centro('SÃO PAULO'),
  centro('2026'),
];
const rosto = [
  quebra(),
  ...AUTORES.map((a) => centro(a)),
  ...vazio(6),
  centro('**ALCANCE: O SERVIÇO PÚBLICO QUE CHEGA EM VOCÊ**'),
  centro('Inteligência artificial de acessibilidade para levar a comunicação do SUS até o cidadão'),
  ...vazio(3),
  new Paragraph({ children: runs('Documentação da Global Solution 2026.2 (Desafio CitizenTech), apresentada à disciplina de Governança em IA & Business Analytics da FIAP – Faculdade de Informática e Administração Paulista, como entrega integradora dos módulos da solução.'),
    alignment: AlignmentType.JUSTIFIED, indent: { left: 4535 }, spacing: { ...L1 } }),
  ...vazio(8),
  centro('SÃO PAULO'),
  centro('2026'),
];
const resumo = [
  quebra(),
  centro('**RESUMO**', { after: 360 }),
  new Paragraph({ children: runs('O serviço público brasileiro se comunica por SMS, sites e aplicativos, canais que excluem quem não enxerga, lê pouco ou não tem internet. No SUS, uma consequência direta são as consultas especializadas perdidas: no Espírito Santo, o absenteísmo chegou a 38,6%. Este trabalho apresenta o ALCANCE, uma solução CitizenTech de inteligência artificial que inverte essa lógica e vai até o cidadão por três frentes: conversa por WhatsApp em áudio ou texto, ligação de voz com IA para celulares simples e visita priorizada do agente comunitário de saúde para quem não tem telefone. Cada pessoa tem um perfil de acessibilidade (voz mais lenta, linguagem simples, Libras, contato da família) e a IA confirma, remarca, solicita transporte e explica cartas em linguagem simples, atualizando em tempo real o painel da unidade de saúde. O protótipo integra ligação telefônica real com Gemini Live e Twilio, assistente conversacional com base de conhecimento citada, modelo de risco de falta treinado com 110.521 consultas reais do SUS (ROC-AUC 0,726) e um painel web acessível. A governança segue a LGPD, o PL 2338/2023 e o NIST AI RMF, com avaliação automática de 16 casos (16 aprovados), trava em código para ações irreversíveis, mascaramento de dados pessoais e medição de viés, que revelou e corrigiu a sub-representação de idosos na fila de contato. Num município de 100 mil habitantes, estima-se a recuperação de cerca de 4.500 consultas por ano, com retorno de aproximadamente R$ 3,10 para cada real investido.'),
    alignment: AlignmentType.JUSTIFIED, spacing: L1 }),
  new Paragraph({ children: runs('**Palavras-chave:** acessibilidade; inteligência artificial; governança de IA; absenteísmo; SUS.'), spacing: { ...L1, before: 240 } }),
];
const abstract = [
  quebra(),
  centro('**ABSTRACT**', { after: 360 }),
  new Paragraph({ children: runs('Brazilian public services communicate through text messages, websites and apps, channels that exclude people who cannot see, read well or access the internet. In the public health system (SUS), one direct consequence is missed specialist appointments, reaching 38.6% in the state of Espírito Santo. This work presents ALCANCE, a CitizenTech artificial intelligence solution that reaches citizens through three channels: WhatsApp conversations by voice or text, AI voice calls for basic phones, and prioritized visits by community health agents for people without a phone. Each person has an accessibility profile, and the AI confirms, reschedules, requests transport and explains letters in plain language, updating the health unit dashboard in real time. The prototype integrates real phone calls (Gemini Live and Twilio), a grounded conversational assistant, a no-show risk model trained on 110,521 real appointments (ROC-AUC 0.726) and an accessible web dashboard. Governance follows the Brazilian data protection law (LGPD), bill PL 2338/2023 and the NIST AI RMF, with automated evaluation (16 of 16 cases passed), code-level locks for irreversible actions, personal data masking and bias measurement, which revealed and corrected the under-representation of older adults in the contact queue.'),
    alignment: AlignmentType.JUSTIFIED, spacing: L1 }),
  new Paragraph({ children: runs('**Keywords:** accessibility; artificial intelligence; AI governance; no-show; public health.'), spacing: { ...L1, before: 240 } }),
];

// ---------- TEXTUAIS ----------
const T = [];
T.push(h1('1 INTRODUÇÃO'));
T.push(p('O desafio CitizenTech da Global Solution 2026.2 propõe o uso de inteligência artificial para melhorar a vida do cidadão, partindo da vida real e não da tecnologia. Seguindo essa orientação, o grupo partiu de uma pergunta simples: para quem o serviço público digital não funciona?'));
T.push(p('A resposta aponta para um contingente expressivo. O Brasil tem 18,6 milhões de pessoas com deficiência, das quais 7,9 milhões com dificuldade para enxergar (IBGE, 2023); 29% da população é analfabeta funcional (INAF, 2024); 28 milhões de pessoas não usam internet (CETIC.BR, 2025); e 69% das pessoas das classes D e E ficam sem pacote de dados antes do fim do mês (IDEC; LOCOMOTIVA, 2021). Ainda assim, o serviço público se comunica predominantemente por SMS, sites e aplicativos, e apenas 2,9% dos sites brasileiros passam em todos os testes de acessibilidade (MOVIMENTO WEB PARA TODOS, 2024).'));
T.push(p('Na saúde, essa barreira de comunicação tem custo mensurável. Em consultas especializadas reguladas no Espírito Santo, o absenteísmo médio foi de 38,6% (BELTRAME et al., 2019), e no SISREG uma falta sem justificativa pode levar o paciente a esperar 30 dias para remarcar. A vaga fica vazia, a fila não anda e o cidadão é punido por não ter conseguido ler um aviso.'));
T.push(p('O **objetivo geral** deste trabalho é apresentar o ALCANCE, uma solução de IA de acessibilidade que leva a comunicação do serviço público até o cidadão pelo canal que ele consegue usar. Os **objetivos específicos** são: (a) escolher automaticamente o canal adequado a cada pessoa entre WhatsApp, ligação de voz e visita do agente comunitário; (b) adaptar a conversa ao perfil de acessibilidade; (c) executar ações concretas, como confirmar, remarcar e solicitar transporte, refletidas em tempo real no painel da unidade de saúde; (d) priorizar contatos com um modelo de risco de falta treinado com dados reais; e (e) operar com governança verificável, em conformidade com a LGPD e com boas práticas de IA responsável.'));
T.push(p('O documento está organizado em nove seções. A seção 2 descreve o cidadão beneficiado e o problema; a seção 3 apresenta a solução e o ecossistema; a seção 4 detalha a arquitetura e a integração dos módulos; a seção 5 trata da governança de IA; a seção 6 apresenta as análises de Business Analytics; a seção 7 traz o caso de negócio; a seção 8 consolida os resultados do protótipo; e a seção 9 apresenta as conclusões.'));

T.push(h1('2 O CIDADÃO E O PROBLEMA'));
T.push(h2('2.1 Começando pela vida real'));
T.push(p('A persona principal do projeto é o Seu Antônio, 68 anos. Ele tem baixa visão em decorrência do diabetes, mora sozinho, estudou até a 3ª série e usa um celular simples, de teclas, que costuma ficar sem crédito por volta do dia 20. Depois de três meses de espera, a unidade de saúde marcou sua consulta com o oftalmologista e enviou a confirmação por SMS. Ele não conseguiu ler a mensagem, faltou e voltou para o fim da fila.'));
T.push(p('O caso, embora fictício, reúne características documentadas por dados oficiais: 47,2% das pessoas com deficiência têm 60 anos ou mais e o analfabetismo entre elas é de 19,5% (IBGE, 2023). O problema, portanto, não é a falta de tecnologia, mas uma tecnologia que exige que a pessoa se adapte a ela.'));
T.push(h2('2.2 O problema em números'));
T.push(...quadro('Indicadores do problema',
  ['Indicador', 'Valor', 'Fonte'],
  [['Pessoas com deficiência no Brasil', '18,6 milhões (7,9 milhões com dificuldade para enxergar)', 'IBGE (2023)'],
    ['Analfabetismo funcional', '29% da população', 'INAF (2024)'],
    ['Pessoas que não usam internet', '28 milhões (16 milhões com 60 anos ou mais)', 'CETIC.BR (2025)'],
    ['Ficam sem dados antes do fim do mês', '45% das classes C, D e E; 69% das classes D e E', 'IDEC; LOCOMOTIVA (2021)'],
    ['Sites brasileiros totalmente acessíveis', '2,9%', 'MOVIMENTO WEB PARA TODOS (2024)'],
    ['Absenteísmo em consultas especializadas (ES)', '38,6%', 'BELTRAME et al. (2019)']],
  'elaborado pelos autores com base nas fontes citadas (2026).', [3, 3.2, 2.2]));
T.push(h2('2.3 Personas'));
T.push(...quadro('Personas do protótipo (fictícias)',
  ['Persona', 'Situação', 'Como o ALCANCE chega'],
  [['Seu Antônio, 68', 'Baixa visão, celular de teclas, sem dados no fim do mês', 'Ligação de voz com IA'],
    ['Dona Benedita, 72', 'Smartphone, lê pouco', 'WhatsApp em áudio, com voz mais lenta'],
    ['Júlia, 24', 'Surda; a Libras é sua primeira língua', 'Texto curto e tradução em Libras (VLibras)'],
    ['Rosa, agente comunitária', 'Visita 150 famílias sem saber quem priorizar', 'Lista de visitas ordenada por prioridade'],
    ['Carla, gestora da UBS', 'Vê vagas se perdendo sem ferramenta para agir', 'Painel com a fila atualizada ao vivo']],
  'elaborado pelos autores (2026).', [2.2, 3.4, 3.2]));

T.push(h1('3 A SOLUÇÃO ALCANCE'));
T.push(p('O ALCANCE é uma inteligência artificial conversacional que **chama primeiro**: em vez de esperar que o cidadão acesse um aplicativo, ela entra em contato antes da consulta, pelo canal que a pessoa consegue usar, e resolve o que for preciso na própria conversa.'));
T.push(h2('3.1 As três frentes'));
T.push(...quadro('As três frentes de contato',
  ['Frente', 'Quando é usada', 'Situação no protótipo'],
  [['WhatsApp em áudio ou texto', 'A pessoa tem smartphone e dados', 'Implementado (Twilio). Entende áudio, texto e foto de carta; responde em áudio para quem lê pouco'],
    ['Ligação de voz com IA', 'Celular simples, telefone fixo ou smartphone sem dados naquele dia do mês', 'Implementado e testado em ligação real: conversa em tempo real, sem menus do tipo "aperte 1"'],
    ['Visita do agente comunitário', 'A pessoa não tem telefone', 'Implementado: lista de visitas da agente ordenada por prioridade']],
  'elaborado pelos autores (2026).', [2.4, 3, 3.6]));
T.push(p('A escolha da frente é determinística e auditável: sem telefone, a visita do agente; com celular simples, a ligação; com smartphone, mas com a franquia de dados já encerrada no dia do mês, a ligação; nos demais casos, o WhatsApp. A frente humana é parte da solução, e não uma exceção: o país conta com cerca de 285 mil agentes comunitários de saúde que já visitam as casas, e o ALCANCE apenas indica a eles quem visitar primeiro.'));
T.push(h2('3.2 Perfil de acessibilidade'));
T.push(p('Cada cidadão possui um perfil que orienta toda a conversa: linguagem simples sempre, voz mais lenta para quem precisa, texto curto com tradução em Libras para pessoas surdas, resposta em áudio para quem lê pouco e um contato da família que pode ser avisado. A Lei nº 15.263/2025 obriga os órgãos públicos a se comunicarem em linguagem simples (BRASIL, 2025), e a Lei Brasileira de Inclusão exige atendimento acessível (BRASIL, 2015).'));
T.push(h2('3.3 O que a IA faz na conversa'));
T.push(p('A IA dispõe de sete ferramentas estruturadas: confirmar a consulta, remarcar, pedir o transporte da prefeitura, liberar a vaga, avisar o contato de apoio, agendar lembrete e encaminhar para um humano. Ela também explica cartas fotografadas e responde a dúvidas sobre direitos (BPC, Cadastro Único, Tarifa Social, Passe Livre) com base em uma base de conhecimento curada, sempre citando a fonte. Cada ação é registrada no banco de dados e aparece imediatamente no painel da unidade.'));
T.push(p('Duas regras de comportamento merecem destaque. Primeiro, a IA só age depois de um "sim" explícito da pessoa. Segundo, "não consigo ir" é diferente de "não quero ir": quando a pessoa diz que não tem como chegar, a IA oferece transporte antes de qualquer outra coisa, e a vaga só é liberada com confirmação clara.'));
T.push(h2('3.4 Ecossistema'));
T.push(p('Participam do ecossistema: o cidadão e sua família; a unidade básica de saúde e a Secretaria de Saúde, que acompanham a fila e as vagas recuperadas; os agentes comunitários de saúde; o CRAS e a assistência social; o transporte sanitário da prefeitura; as organizações e conselhos de pessoas com deficiência, que validam a solução; e a prefeitura, que a contrata por meio do Contrato Público para Solução Inovadora (BRASIL, 2021).'));

T.push(h1('4 ARQUITETURA E TECNOLOGIAS'));
T.push(h2('4.1 Visão geral e integração dos módulos'));
T.push(p('O protótipo é composto por um back-end em Python (FastAPI e SQLite) e um site em React. Os módulos se integram em um ciclo fechado:'));
T.push(item('a) o **modelo de risco de falta** pontua cada consulta, e a prioridade combina esse risco com o perfil de acessibilidade;'));
T.push(item('b) o **módulo de canais** escolhe a frente de contato para cada pessoa;'));
T.push(item('c) a **ligação com IA** (Twilio Media Streams e Gemini Live) ou o **assistente de WhatsApp** conduz a conversa com as regras e a base de conhecimento;'));
T.push(item('d) as ações passam por uma camada de execução que **valida** o pedido (por exemplo, recusa liberar a vaga sem confirmação) e grava o resultado e a trilha de auditoria;'));
T.push(item('e) o **painel da UBS**, a **lista de visitas** e a **página de governança** leem os mesmos dados e se atualizam ao vivo.'));
T.push(p('Na ligação, o áudio telefônico (μ-law, 8 kHz) é convertido em tempo real para o formato do modelo de voz e vice-versa. A detecção de fala permite que a pessoa interrompa a IA naturalmente, e cada turno é transcrito para compor a legenda e o histórico.'));
T.push(h2('4.2 Tecnologias'));
T.push(...quadro('Tecnologias utilizadas',
  ['Componente', 'Tecnologia', 'Função'],
  [['Conversa por voz em tempo real', 'Gemini Live + Twilio Media Streams', 'Ligação com IA, com interrupção natural'],
    ['WhatsApp', 'Twilio WhatsApp + Gemini (texto, áudio e imagem)', 'Entender áudio e foto de carta'],
    ['Voz da IA', 'Gemini TTS', 'Respostas em áudio, mais lentas quando o perfil pede'],
    ['Ações', 'Chamada de funções (function calling)', 'Confirmar, remarcar, transporte, liberar vaga'],
    ['Base de conhecimento', 'Documento curado com fontes, no contexto do modelo', 'Respostas sobre LBI, BPC, Cadastro Único e emergências'],
    ['Risco de falta', 'scikit-learn (HistGradientBoosting)', 'Ordenar a fila de contato'],
    ['Back-end', 'Python, FastAPI, SQLite', 'API, regras de negócio, auditoria'],
    ['Interface', 'React, Vite, Tailwind CSS, VLibras', 'Painel, visitas, demonstração e governança']],
  'elaborado pelos autores (2026).', [2.6, 3.2, 3.2]));
T.push(h2('4.3 Acessibilidade da própria interface'));
T.push(p('O painel também segue os princípios que defende: fonte Atkinson Hyperlegible, projetada para pessoas com baixa visão; três tamanhos de texto; modo de alto contraste; navegação por teclado; respeito à preferência por menos movimento; e o widget oficial VLibras para tradução em Libras.'));

T.push(h1('5 GOVERNANÇA DE IA'));
T.push(h2('5.1 Escopo de uso'));
T.push(...quadro('O que a IA faz e o que ela não faz',
  ['Faz', 'Não faz'],
  [['Conversa por voz e WhatsApp para confirmar, remarcar e pedir transporte', 'Não decide quem é atendido nem a ordem de atendimento médico'],
    ['Explica cartas e direitos em linguagem simples, citando a fonte', 'Não dá diagnóstico nem indica remédio'],
    ['Prioriza para quem ligar primeiro', 'Não nega serviço a ninguém'],
    ['Registra cada ação para auditoria', 'Não pede CPF, senha, cartão ou dados bancários']],
  'elaborado pelos autores (2026).', [1, 1]));
T.push(h2('5.2 Classificação de risco e gestão'));
T.push(p('Pelo PL 2338/2023 (BRASIL, 2023), sistemas aplicados à saúde exigem cuidado redobrado. O ALCANCE apoia a comunicação e não toma decisões clínicas ou de acesso; ainda assim, o projeto adota práticas de alto risco: avaliação de impacto, supervisão humana, registro e transparência. A gestão foi organizada segundo as quatro funções do NIST AI RMF (NATIONAL INSTITUTE OF STANDARDS AND TECHNOLOGY, 2023).'));
T.push(...quadro('Aplicação do NIST AI RMF',
  ['Função', 'Práticas adotadas'],
  [['Governar', 'Regras da IA escritas em código, compromissos públicos na página de governança, responsáveis definidos'],
    ['Mapear', 'Matriz de riscos e identificação do público vulnerável (idosos, pessoas com deficiência, baixo letramento)'],
    ['Medir', 'Avaliação automática com 16 casos, revisão humana das respostas e viés do modelo por grupo'],
    ['Gerenciar', 'Trava em código para ação irreversível, troca automática de modelo, passagem para humano e registro de incidentes']],
  'elaborado pelos autores com base em NIST (2023).', [1.2, 4]));
T.push(h2('5.3 Proteção de dados (LGPD)'));
T.push(p('O tratamento se apoia na execução de políticas públicas e na tutela da saúde (BRASIL, 2018, art. 7º, III, e art. 11, II, b e f). A coleta é mínima: nome, telefone, consulta e perfil de acessibilidade. Se o cidadão digitar ou falar um CPF, número de cartão ou telefone, o texto é mascarado antes de ser enviado ao modelo de IA e ao histórico, por uma função com teste automatizado. As chaves de acesso ficam fora do código, as mensagens recebidas do WhatsApp têm a assinatura criptográfica da Twilio validada e, no protótipo, só um número verificado recebe ligações. Todos os cidadãos do protótipo são fictícios, e o modelo usa uma base pública e anonimizada.'));
T.push(p('Para reduzir o risco de golpe, a IA se identifica pelo nome da agente comunitária que a pessoa já conhece, nunca pede dados ou pagamento e oferece a confirmação presencial no posto.'));
T.push(h2('5.4 Avaliação do assistente'));
T.push(p('O assistente é avaliado por 16 casos de teste em quatro categorias: segurança (emergência, pedido de CPF, tentativa de manipulação, sugestão de serviço pago, pedido de humano), fundamentação (respostas apoiadas na base e recusa quando a resposta não está nela), ações (agir apenas após o "sim") e acessibilidade (respostas curtas para pessoa surda, sem listas para quem recebe áudio). O resultado atual é de **16 casos aprovados em 16**, com tempo médio de resposta de 3,6 segundos. A conferência automática por regras é complementada pela leitura humana de todas as respostas.'));
T.push(h2('5.5 Registro de incidentes'));
T.push(p('Os erros encontrados durante o desenvolvimento foram registrados e corrigidos, conforme o Quadro 7. Destaca-se que um deles, o número errado do SAMU, passou pelo teste automático e só foi encontrado pela revisão humana, o que reforça que avaliação automática não substitui a leitura humana.'));
T.push(...quadro('Incidentes encontrados e correções',
  ['Incidente', 'Como foi encontrado', 'Correção'],
  [['A IA liberava a vaga quando a pessoa dizia "não consigo ir"', 'Avaliação automática', 'Regra "não conseguir ≠ não querer" e trava em código exigindo a confirmação da pessoa'],
    ['A IA citou o SAMU como "cento e doze" (o correto é 192)', 'Revisão humana', 'Números oficiais na base; o teste passou a exigir "192" e reprovar "112"'],
    ['A IA agia sem perguntar', 'Teste manual', 'Regra "primeiro oferece, depois faz"'],
    ['Fonte atribuída à lei errada (BPC como lei do Cadastro Único)', 'Revisão humana', 'Regra de citar o bloco da base (LOAS)'],
    ['Modelo de faltas quase não alertava idosos', 'Medição de viés por grupo', 'Prioridade mínima para quem tem barreira de acesso (seção 6.2)'],
    ['Probabilidades infladas pelo balanceamento de classes', 'Conferência do painel', 'Retreino sem balanceamento'],
    ['Análise sugeria que o SMS aumenta faltas', 'Revisão da análise', 'Controle do fator de confusão (tempo de espera)']],
  'elaborado pelos autores (2026).', [3.2, 1.8, 3.4]));
T.push(h2('5.6 Limitações'));
T.push(p('A transcrição de voz pode errar com sotaques fortes ou ruído na linha, situação em que a IA pede para a pessoa repetir. Os serviços municipais da base de conhecimento são fictícios. Os custos de IA de voz vêm de tabelas de terceiros e precisam ser confirmados. A avaliação cobre 16 casos e deve ser ampliada, no piloto, com conversas reais revisadas por amostragem. O modelo de risco foi treinado com dados de 2016 de um único município e deve ser retreinado com dados locais.'));

T.push(h1('6 BUSINESS ANALYTICS'));
T.push(h2('6.1 Modelo de risco de falta'));
T.push(p('O modelo foi treinado com o conjunto público Medical Appointment No Shows (HOPPEN, 2016), com 110.521 consultas válidas do SUS em Vitória (ES) e taxa real de falta de 20,2%. As variáveis são idade, sexo, Bolsa Família, hipertensão, diabetes, deficiência, recebimento de SMS, dias de espera e dia da semana. O algoritmo é o HistGradientBoosting, do scikit-learn, avaliado em 22.105 consultas separadas para teste, com ROC-AUC de **0,726**.'));
T.push(p('Uma decisão de projeto relevante foi **não balancear as classes**. Com balanceamento, o modelo classificava de forma semelhante, mas as probabilidades ficavam infladas (média de 59% para uma falta real de cerca de 20%). Como o painel soma essas probabilidades para estimar vagas perdidas, era necessário que elas fossem calibradas. Sem balanceamento, a média nas consultas do protótipo caiu para 31%, coerente com consultas especializadas de longa espera. O uso do modelo é restrito: ele ordena a fila de contato e nunca é usado para negar, adiar ou rebaixar atendimento.'));
T.push(h2('6.2 Análise de viés'));
T.push(p('O desempenho e a taxa de alerta foram medidos por grupo, com corte de 30% de probabilidade para entrar na fila de contato (Quadro 8).'));
T.push(...quadro('Desempenho do modelo por grupo (conjunto de teste)',
  ['Grupo', 'Consultas', 'Falta real', 'ROC-AUC', 'Entram na fila'],
  [['Idade 0–17', '5.520', '21,4%', '0,723', '36,8%'],
    ['Idade 18–39', '6.328', '22,8%', '0,729', '48,9%'],
    ['Idade 40–59', '5.985', '19,5%', '0,710', '15,7%'],
    ['Idade 60+', '4.272', '15,8%', '0,695', '2,4%'],
    ['Mulheres', '14.273', '20,1%', '0,724', '28,8%'],
    ['Homens', '7.832', '20,3%', '0,728', '26,2%'],
    ['Com deficiência', '488', '18,6%', '0,760', '13,7%'],
    ['Bolsa Família', '2.155', '23,2%', '0,744', '47,7%']],
  'elaborado pelos autores com dados de Hoppen (2016).', [2.4, 1.4, 1.4, 1.4, 1.6]));
T.push(p('A qualidade do modelo é semelhante entre os grupos (ROC-AUC entre 0,69 e 0,76), mas a taxa de alerta revela um viés com impacto direto na missão do projeto: apenas **2,4% das pessoas com 60 anos ou mais** entrariam na fila, contra 48,9% dos adultos de 18 a 39 anos, porque idosos faltam menos na média. São justamente as pessoas com mais dificuldade de ler um SMS.'));
T.push(p('A mitigação adotada foi uma prioridade mínima por acessibilidade: quem tem barreira real de acesso (baixa visão, surdez, pouca leitura ou ausência de smartphone), em qualquer idade, sempre entra na fila de contato, e o risco apenas define a ordem. Optou-se por não usar a idade isoladamente como critério, pois idade não é, por si, uma barreira. A regra é coberta por teste automatizado e explicada na página de governança.'));
T.push(h2('6.3 O efeito real do SMS'));
T.push(p('Uma comparação direta nos dados sugere que o SMS **aumenta** as faltas: 27,6% de falta entre quem recebeu SMS, contra 16,7% entre quem não recebeu. A análise, porém, tem um fator de confusão: o SMS só é enviado para consultas marcadas com antecedência, que já têm mais faltas. Comparando apenas consultas com a mesma espera (15 a 30 dias), a falta é de 29,8% com SMS e de 36,9% sem SMS. O SMS ajuda, mas pouco: quase três em cada dez pessoas ainda faltam.'));
T.push(p('Esse resultado é coerente com o ensaio randomizado realizado no ambulatório do Hospital das Clínicas de Ribeirão Preto, com 306 pacientes, em que o absenteísmo foi de 9,5% no grupo que recebeu ligação telefônica, 21% no grupo que recebeu SMS e 22,8% no grupo controle (LANCE; PAZIN FILHO; NEVES, [20‑‑]). Conversar funciona melhor do que apenas avisar.'));
T.push(h2('6.4 Painel e indicadores'));
T.push(p('O painel da UBS mostra as faltas esperadas (soma das probabilidades), as pessoas que receberão contato, a distribuição entre as três frentes e, para cada pessoa, risco, canal, modo de comunicação e situação atualizada pela IA. No protótipo, com 200 consultas fictícias, estimam-se cerca de 62 faltas e 17 vagas recuperadas numa estimativa conservadora. Para o piloto, os indicadores são: taxa de faltas contra uma UBS de comparação, vagas reaproveitadas por mês, tempo médio de espera, percentual de contatos concluídos por canal, percentual de conversas passadas para humano, satisfação medida por voz e custo por vaga recuperada.'));

T.push(h1('7 CASO DE NEGÓCIO'));
T.push(h2('7.1 Custos unitários'));
T.push(p('Uma ligação típica de dois minutos custa cerca de R$ 1,30 (telefonia a aproximadamente R$ 0,37 por minuto e IA de voz estimada em R$ 0,26 por minuto). Uma conversa típica por WhatsApp custa cerca de R$ 0,10. A visita do agente não gera custo adicional, pois o agente já realiza visitas; o ALCANCE apenas ordena a lista.'));
T.push(h2('7.2 Cenário de um município de 100 mil habitantes'));
T.push(p('As premissas são: 0,5 consulta especializada por habitante por ano (BRASIL, 2002), resultando em cerca de 4.170 consultas por mês; 30% de faltas; contato com metade das consultas; e redução conservadora de 30% nas faltas, quase metade do efeito observado no estudo de Ribeirão Preto. O valor de referência por vaga é de R$ 100.'));
T.push(...quadro('Resultado anual estimado (município de 100 mil habitantes)',
  ['Item', 'Valor anual'],
  [['Custo operacional (telefonia, WhatsApp, infraestrutura e suporte)', '≈ R$ 54 mil'],
    ['Preço para a prefeitura (R$ 0,12 por habitante/mês)', 'R$ 144 mil'],
    ['Margem bruta', '≈ 62%'],
    ['Vagas especializadas recuperadas', '≈ 4.500'],
    ['Valor das vagas recuperadas', '≈ R$ 450 mil'],
    ['Retorno para a prefeitura', '≈ 3,1 vezes o investimento'],
    ['Custo por vaga recuperada', '≈ R$ 32']],
  'elaborado pelos autores (2026). Valores estimados, a validar em piloto.', [3, 1.4]));
T.push(p('A análise de sensibilidade mostra que, mesmo no cenário pessimista (redução de 15% e vaga avaliada em R$ 50), o benefício fica próximo do custo, sem contar ganhos não monetizados, como inclusão, cumprimento legal e acesso a benefícios sociais. No cenário otimista (50% de redução e vaga de R$ 150), o valor gerado supera R$ 1,1 milhão por ano.'));
T.push(h2('7.3 Contratação e piloto'));
T.push(p('O piloto de seis meses em uma UBS custa cerca de R$ 350 mil (equipe, telefonia e nuvem, pesquisa com usuários com deficiência e adequação à LGPD) e pode ser contratado por meio do Contrato Público para Solução Inovadora previsto no Marco Legal das Startups, que admite até R$ 1,6 milhão sem licitação tradicional (BRASIL, 2021). O momento é favorável: a Lei nº 15.263/2025, em vigor desde 17 de novembro de 2025, obriga todos os órgãos públicos a adotar linguagem simples (BRASIL, 2025).'));
T.push(h2('7.4 Riscos'));
T.push(...quadro('Principais riscos e mitigações',
  ['Risco', 'Mitigação'],
  [['A pessoa achar que é golpe', 'A IA cita a agente comunitária conhecida, nunca pede dados nem dinheiro e oferece confirmação no posto'],
    ['A IA errar ou inventar', 'Regras rígidas, ações estruturadas, avaliação contínua, passagem para humano e auditoria'],
    ['Dados de saúde (LGPD)', 'Base legal adequada, minimização, mascaramento, relatório de impacto no piloto'],
    ['Viés do modelo', 'Medição por grupo e prioridade mínima por acessibilidade'],
    ['Dependência de fornecedores', 'Troca automática de modelo e arquitetura que permite trocar de provedor'],
    ['Integração com sistemas legados', 'Início por exportação de planilha; integração com SISREG e e-SUS depois']],
  'elaborado pelos autores (2026).', [1.6, 3.4]));
T.push(h2('7.5 Roadmap'));
T.push(p('O roadmap prevê quatro fases: protótipo (novembro de 2026); piloto em uma UBS por seis meses, medido contra uma unidade de comparação; expansão para todas as unidades do município, com integração ao SISREG; e plataforma para outros serviços (adesão a medicamentos, alertas da Defesa Civil, benefícios do CRAS) e consórcios de municípios, entre 2027 e 2028.'));

T.push(h1('8 RESULTADOS DO PROTÓTIPO'));
T.push(p('O protótipo demonstra o ciclo completo funcionando de ponta a ponta:'));
T.push(item('a) ligação telefônica real com IA para um celular, com a conversa em português, a oferta de transporte quando a pessoa disse não ter como ir e o registro da ação no banco;'));
T.push(item('b) assistente de WhatsApp com entendimento de áudio, texto e foto de carta e resposta em áudio, conforme o perfil;'));
T.push(item('c) painel da UBS atualizado ao vivo a cada ação da IA e lista de visitas da agente comunitária;'));
T.push(item('d) página de governança com o resultado da avaliação (16/16), a ficha e o viés do modelo, os incidentes corrigidos e a trilha de auditoria;'));
T.push(item('e) doze testes automatizados cobrindo escolha de canal, banco de dados, segurança do webhook, trava de ação irreversível, mascaramento de dados, viés e prioridade por acessibilidade.'));
T.push(p('A solução contribui para os Objetivos de Desenvolvimento Sustentável 3 (saúde e bem-estar), 10 (redução das desigualdades), 11 (cidades sustentáveis) e 16 (instituições eficazes). O código-fonte está disponível em https://github.com/swagsoares/GS2026.'));

T.push(h1('9 CONCLUSÃO'));
T.push(p('Este trabalho partiu da vida real de quem o serviço público digital deixa de fora e chegou a uma solução que inverte a lógica de atendimento: em vez de exigir que o cidadão se adapte à tecnologia, a tecnologia se adapta ao cidadão e vai até ele. O ALCANCE combina, de forma inédita no contexto brasileiro, atendimento proativo, funcionamento sem internet, adaptação à deficiência de cada pessoa e um agente humano como terceira frente, integrados ao fluxo do SUS.'));
T.push(p('Do ponto de vista de governança, o projeto mostrou que IA responsável depende de evidência verificável, e não apenas de intenção: a avaliação automática, a revisão humana e a medição de viés encontraram erros reais, que foram corrigidos e documentados. Do ponto de vista analítico, os dados reais do SUS confirmaram a tese central: o SMS sozinho não resolve, e conversar funciona.'));
T.push(p('Como trabalhos futuros, destacam-se o teste com usuários reais com deficiência, o piloto em uma UBS com medição contra unidade de comparação, o retreino do modelo com dados locais e a integração com o SISREG e o e-SUS.'));
T.push(p('Na semana seguinte, o Seu Antônio vai à consulta. O carro da prefeitura passa às oito.'));

// ---------- PÓS-TEXTUAIS ----------
const REFS = [
  'BELTRAME, Sonia Maria; OLIVEIRA, Adauto Emmerich; SANTOS, Maria Angelica Borges dos; SANTOS NETO, Edson Theodoro. Absenteísmo de usuários como fator de desperdício: desafio para sustentabilidade em sistema universal de saúde. **Saúde em Debate**, Rio de Janeiro, v. 43, n. 123, p. 1015-1030, out./dez. 2019. DOI: https://doi.org/10.1590/0103-1104201912303.',
  'BRASIL. Lei nº 13.146, de 6 de julho de 2015. Institui a Lei Brasileira de Inclusão da Pessoa com Deficiência (Estatuto da Pessoa com Deficiência). **Diário Oficial da União**: Brasília, DF, 7 jul. 2015.',
  'BRASIL. Lei nº 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais (LGPD). **Diário Oficial da União**: Brasília, DF, 15 ago. 2018.',
  'BRASIL. Lei Complementar nº 182, de 1º de junho de 2021. Institui o marco legal das startups e do empreendedorismo inovador. **Diário Oficial da União**: Brasília, DF, 2 jun. 2021.',
  'BRASIL. Lei nº 15.263, de 14 de novembro de 2025. Institui a Política Nacional de Linguagem Simples nos órgãos e entidades da administração pública. **Diário Oficial da União**: Brasília, DF, 17 nov. 2025.',
  'BRASIL. Ministério da Saúde. Portaria GM/MS nº 1.101, de 12 de junho de 2002. Estabelece os parâmetros de cobertura assistencial no âmbito do Sistema Único de Saúde. **Diário Oficial da União**: Brasília, DF, 2002.',
  'BRASIL. Senado Federal. **Projeto de Lei nº 2338, de 2023**. Dispõe sobre o uso da inteligência artificial. Brasília, DF: Senado Federal, 2023.',
  'CETIC.BR – CENTRO REGIONAL DE ESTUDOS PARA O DESENVOLVIMENTO DA SOCIEDADE DA INFORMAÇÃO. **TIC Domicílios 2025**: pesquisa sobre o uso das tecnologias de informação e comunicação nos domicílios brasileiros. São Paulo: Comitê Gestor da Internet no Brasil, 2025. Disponível em: https://cetic.br. Acesso em: 11 nov. 2026.',
  'HOPPEN, Joni. **Medical Appointment No Shows**. Kaggle, 2016. Conjunto de dados. Disponível em: https://www.kaggle.com/datasets/joniarroba/noshowappointments. Acesso em: 14 nov. 2026.',
  'IBGE – INSTITUTO BRASILEIRO DE GEOGRAFIA E ESTATÍSTICA. **Pesquisa Nacional por Amostra de Domicílios Contínua 2022**: pessoas com deficiência. Rio de Janeiro: IBGE, 2023. Disponível em: https://agenciadenoticias.ibge.gov.br. Acesso em: 11 nov. 2026.',
  'IDEC – INSTITUTO DE DEFESA DE CONSUMIDORES; INSTITUTO LOCOMOTIVA. **Barreiras e limitações no acesso à internet e hábitos de uso e navegação na rede nas classes C, D e E**. São Paulo: Idec, 2021. Disponível em: https://idec.org.br. Acesso em: 11 nov. 2026.',
  'INAF – INDICADOR DE ALFABETISMO FUNCIONAL. **Inaf Brasil 2024**. São Paulo: Ação Educativa; Conhecimento Social, 2024.',
  'LANCE, Rogério Cortecioni; PAZIN FILHO, Antônio; NEVES, Fábio Fernandes. Comparação entre as estratégias de mensagem curta de texto e ligação telefônica na redução do absenteísmo ambulatorial. **Revista Qualidade HC**, Ribeirão Preto, [20‑‑]. Disponível em: https://www.hcrp.usp.br/revistaqualidade/uploads/Artigos/239/239.pdf. Acesso em: 14 nov. 2026.',
  'MOVIMENTO WEB PARA TODOS; BIGDATACORP. **Pesquisa de acessibilidade dos sites brasileiros 2024**. São Paulo, 2024. Disponível em: https://mwpt.com.br. Acesso em: 11 nov. 2026.',
  'NATIONAL INSTITUTE OF STANDARDS AND TECHNOLOGY. **Artificial Intelligence Risk Management Framework (AI RMF 1.0)**. Gaithersburg: NIST, 2023. (NIST AI 100-1). DOI: https://doi.org/10.6028/NIST.AI.100-1.',
];
const refs = [h1('REFERÊNCIAS', { semNumero: true }),
  ...REFS.map((r) => new Paragraph({ children: runs(r), alignment: AlignmentType.LEFT, spacing: { ...L1, after: 240 } }))];

const apendice = [h1('APÊNDICE A – REPOSITÓRIO E EXECUÇÃO DO PROTÓTIPO', { semNumero: true }),
  p('O código-fonte, os documentos e os testes estão em https://github.com/swagsoares/GS2026. O arquivo README descreve a instalação. Resumidamente: criar o ambiente Python e instalar as dependências do arquivo requirements.txt; iniciar a API com o servidor uvicorn na porta 8000; instalar e iniciar o site React na pasta web; e, para ligação e WhatsApp reais, preencher as chaves no arquivo .env (fora do repositório) e abrir o túnel público com o módulo alcance.tunel.'),
  p('A pasta docs reúne o documento do projeto, o caso de negócio detalhado, a governança de IA, o roteiro do vídeo e os slides. Os testes são executados com o pytest, e a avaliação do assistente, com o módulo alcance.avaliacao.')];

// ---------- SUMÁRIO ----------
const sumario = [quebra(), centro('**SUMÁRIO**', { after: 360 }),
  ...SUMARIO.map((s) => new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: LARGURA, leader: 'dot' }],
    spacing: { ...L15, after: 0 },
    children: [new TextRun({ text: s.t, bold: s.nivel === 1, font: FONTE }), new TextRun({ text: `\t${PAGINAS[s.t] ?? '0'}`, font: FONTE })],
  }))];

const estilo = { default: { document: { run: { font: FONTE, size: 24 } } } };
const pagina = { size: { width: 11906, height: 16838 }, margin: { top: 1701, left: 1701, bottom: 1134, right: 1134, header: 709 } };
const cabecalho = new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONTE, size: 20 })] })] });

const doc = new Document({
  creator: 'Vitor Soares Gonçalves; Pietro Boroto', title: 'ALCANCE: o serviço público que chega em você', styles: estilo,
  sections: [
    { properties: { page: pagina }, children: [...capa, ...rosto, ...resumo, ...abstract, ...sumario] },
    { properties: { page: { ...pagina, pageNumbers: { start: PAGINAS.__inicio || 1 } } }, headers: { default: cabecalho }, children: [...T, ...refs, ...apendice] },
  ],
});
fs.writeFileSync('titulos.json', JSON.stringify(SUMARIO.map((s) => s.t)));
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(SAIDA, b); console.log('ok', SAIDA, 'títulos:', SUMARIO.length); });
