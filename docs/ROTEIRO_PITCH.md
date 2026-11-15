# ALCANCE: roteiro do vídeo pitch (até 7 minutos)
*Ritmo: ~130 palavras por minuto. O texto da narração tem cerca de 860 palavras, então cabe em 6min40s com respiro.*
*Legenda: 🎙️ narração · 🖥️ o que aparece na tela · 🎬 instrução de gravação*

---

## Cena 1: Gancho (0:00–0:35) · Slide 1
🖥️ Tela preta. Toca um celular simples. Aparece um SMS: "SUS: consulta OFTALMO 21/11 08h. Confirme resp. SIM". Corta para o slide de abertura.
🎙️ "O Seu Antônio tem 68 anos e quase não enxerga por causa do diabetes. Ele esperou três meses por uma consulta de vista. O posto mandou um SMS para confirmar. Ele não conseguiu ler. Faltou. E agora a regra diz que ele espera mais trinta dias para tentar de novo.
O Seu Antônio não perdeu a consulta por descuido. Ele perdeu porque o serviço público fala uma língua que ele não consegue ouvir."
🎬 Se tiver um depoimento real (10 s, com autorização), entra aqui.

## Cena 2: O problema (0:35–1:35) · Slides 2 e 3
🎙️ "E ele não está sozinho. São 18,6 milhões de brasileiros com deficiência, e 7,9 milhões têm dificuldade para enxergar. 29% da população é analfabeta funcional. 28 milhões não usam internet, a maioria idosos. E 69% das famílias das classes D e E ficam sem dados no celular antes do fim do mês.
Enquanto isso, o serviço público aposta em SMS, aplicativo e site. Só 2,9% dos sites brasileiros passam em todos os testes de acessibilidade.
O resultado aparece na fila: até 38,6% das consultas especializadas viram falta. Vaga paga, médico esperando, cadeira vazia. E do outro lado, alguém na fila que poderia ter sido atendido."

## Cena 3: A solução (1:35–2:15) · Slides 4 e 5
🎙️ "Nós criamos o ALCANCE. A ideia é simples: em vez de a pessoa se adaptar ao serviço, a inteligência artificial se adapta à pessoa e vai até ela.
Por três caminhos. Quem tem smartphone conversa pelo WhatsApp, em áudio ou texto. Quem tem celular simples, ou ficou sem internet, recebe uma ligação de voz. E quem não tem telefone recebe a visita do agente comunitário, que já existe no SUS: são 285 mil no Brasil. O ALCANCE diz a ele quem visitar primeiro.
E cada pessoa tem um perfil de acessibilidade: voz mais lenta, linguagem simples, Libras."

## Cena 4: Demo ao vivo (2:15–4:45) · Slide 6 e depois tela cheia
🎬 Gravar a tela do site em "Como o cidadão vê" + o celular real ao lado (dá para filmar com outro celular). Clicar em **"Receber a ligação de verdade"**.
🎙️ "Isso não é animação. É uma ligação real, agora."
🖥️ O celular toca. A IA fala. A legenda aparece ao vivo no site.
🎬 Conversa sugerida (fale naturalmente, sem ler):
- IA se apresenta, diz que a agente Rosa pediu para ligar e fala da consulta.
- Você: "Ih, não vou conseguir ir, não tenho quem me leve."
- IA oferece o transporte da prefeitura.
- Você: "Quero, sim."
- IA confirma e repete o combinado.
🎙️ (depois da ligação) "Repare: ela não liberou a vaga do Seu Antônio quando ele disse que não conseguia ir. Ela resolveu o problema dele. E se apresentou falando o nome da agente comunitária que ele conhece, porque desconfiar de ligação é sinal de esperteza, não de atraso."
🖥️ Mostrar o painel da Carla: a linha do Seu Antônio sobe com "Transporte pedido".
🎙️ "Na mesma hora, a gestora da UBS vê o resultado."
🖥️ WhatsApp: mandar a foto de uma carta (pode ser uma carta impressa, sem dados reais) e mostrar a resposta em áudio.
🎙️ "A Dona Benedita lê pouco. Ela fotografa uma carta que não entendeu e recebe a explicação em áudio, em linguagem simples, dizendo o que fazer e onde ir."
🖥️ Rápido: tela de Visitas da agente Rosa.
🎙️ "E a agente Rosa sabe quem precisa de uma visita hoje."

## Cena 5: Por baixo do capô (4:45–5:30) · Slides 7 e 8
🎙️ "Por trás disso: voz em tempo real com o Gemini, telefonia pela Twilio, e um modelo que prevê quem tem mais risco de faltar, treinado com dados reais do SUS.
Mas o que mais nos orgulha é a governança. Criamos uma bateria de testes com perguntas difíceis: pedido de remédio, tentativa de manipular a IA, pedido de senha. Hoje passam 16 de 16. E ela encontrou erros de verdade: numa emergência, a IA disse que o SAMU era 'cento e doze'. O certo é 192. Corrigimos, e aprendemos que teste automático não substitui revisão humana. A IA não dá diagnóstico, nunca pede CPF, e ações que não têm volta são travadas no código até a pessoa confirmar."

## Cena 6: Impacto e negócio (5:30–6:30) · Slides 9 e 10
🎙️ "Funciona? Num estudo em Ribeirão Preto, as faltas caíram para 9,5% com ligação, contra 21% com SMS.
Num município de 100 mil habitantes, estimamos recuperar cerca de 4.500 consultas com especialista por ano. Para a prefeitura, isso custa 12 centavos por habitante por mês. Cada vaga recuperada sai por 32 reais. O retorno estimado é de três reais para cada real investido.
E é o momento certo: a Lei 15.263, de 2025, obriga todo órgão público a usar linguagem simples, e a Lei Brasileira de Inclusão exige atendimento acessível. A prefeitura pode contratar um piloto pelo Marco Legal das Startups, sem licitação tradicional."

## Cena 7: Fechamento (6:30–7:00) · Slide 11
🎙️ "Na semana que vem, o Seu Antônio vai à consulta. O carro da prefeitura passa às oito.
A tecnologia certa não exige que a pessoa mude. Ela vai até a pessoa.
ALCANCE. O serviço público que chega em você."
🖥️ Logo + nomes da equipe + ODS 3, 10, 11 e 16.

---

## Checklist de gravação
- [ ] Rodar API, site e túnel. Colar a URL do túnel no Sandbox da Twilio
- [ ] Clicar em "reiniciar" (ou usar a API `/api/demo/reiniciar/1`) antes de cada tomada
- [ ] Gravar a ligação 2 ou 3 vezes e escolher a melhor
- [ ] Cortar o aviso de "conta de teste" da Twilio, ou fazer o upgrade antes
- [ ] Imprimir uma carta fictícia para a cena do Lê pra Mim (sem dados reais)
- [ ] Gravar a narração em lugar silencioso; celular perto da boca na ligação, sem viva-voz
- [ ] Conferir o tempo total: ≤ 7:00
- [ ] Ativar as legendas no vídeo final (acessibilidade também no pitch!)
