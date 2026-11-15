# 🤝 ALCANCE: o serviço público que chega em você
**Global Solution 2026.2 · FIAP · Desafio CitizenTech**  
Equipe: Vitor Soares Gonçalves (RM 566181) e Pietro Boroto (RM 562407)

O serviço público foi desenhado para quem enxerga, ouve, lê bem e tem internet. O ALCANCE inverte isso: **a IA se adapta à pessoa e vai até ela** por 3 frentes:

| Frente | Para quem |
|---|---|
| 📱 WhatsApp por áudio | Tem smartphone e dados |
| ☎️ Ligação de voz com IA | Celular simples, sem dados no fim do mês, não lê |
| 🧑‍⚕️ Agente comunitário | Não tem telefone |

**Comece por aqui:** [Documento do projeto](docs/DOCUMENTO_DO_PROJETO.md) (as 6 perguntas do desafio) · **Documentação ABNT:** [PDF](docs/entrega/ALCANCE_Documentacao_ABNT.pdf) · [Word](docs/entrega/ALCANCE_Documentacao_ABNT.docx)
Mais: [Caso de negócio](docs/CASO_DE_NEGOCIO.md) · [Governança da IA](docs/GOVERNANCA.md) · [Roteiro do pitch](docs/ROTEIRO_PITCH.md) · [Dados e fontes](PESQUISA.md) · [Plano de trabalho](PLANO_GS.md)

## Como rodar
1. Copie `.env.example` para `.env` e preencha as chaves (Gemini e Twilio). O `.env` nunca vai para o git.
2. API (terminal 1):
```bash
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m uvicorn alcance.api:app --port 8000
```
3. Site (terminal 2):
```bash
cd web && npm install && npm run dev
```
Abra http://localhost:5173.

**Telas:** Visão da UBS (gestora) · Visitas do agente · Como o cidadão vê (ligação e WhatsApp de verdade) · Governança.
**Acessibilidade do próprio site:** fonte Atkinson Hyperlegible (feita para baixa visão), 3 tamanhos de texto, alto contraste, navegação por teclado e o widget oficial VLibras.

### Ligação e WhatsApp de verdade
A Twilio precisa alcançar a API no seu computador, então abra um túnel público (terminal 3, precisa do [cloudflared](https://github.com/cloudflare/cloudflared)):
```bash
.venv\Scripts\python -m alcance.tunel
```
- **Ligação:** na tela "Como o cidadão vê", clique em "Receber a ligação de verdade". A IA liga para o `MEU_CELULAR` do `.env` (só para ele, por segurança).
- **WhatsApp:** no Sandbox da Twilio, em "When a message comes in", cole `https://<endereço do túnel>/whatsapp` (POST). O endereço muda a cada vez que o túnel abre e fica salvo em `data/url_publica.txt`.

### Testes e avaliação da IA
```bash
.venv\Scripts\python -m pytest -q
```
```bash
.venv\Scripts\python -m alcance.avaliacao
```
A avaliação roda 16 casos (segurança, fundamentação, ações, acessibilidade) contra o Gemini e grava o resultado, que aparece na tela de Governança.

### Modelo de risco de falta (dados reais do SUS)
1. Baixe o dataset [Medical Appointment No Shows](https://www.kaggle.com/datasets/joniarroba/noshowappointments) (~110 mil consultas, Vitória/ES).
2. Salve `KaggleV2-May-2016.csv` em `data/raw/`.
3. Rode `.venv\Scripts\python -m alcance.faltas`: treina o modelo, mede ROC-AUC e viés por grupo e pontua as consultas.

Sem o CSV, o painel usa uma regra provisória.

## Estrutura
```
alcance/   API FastAPI, 3 frentes (canais.py), IA (ia.py, assistente.py), ligação, WhatsApp, avaliação, modelo de faltas
web/       site React + Tailwind (painel, visitas, demonstração, governança)
docs/      documento do projeto, negócio, governança, roteiro e slides
tests/     testes automatizados
data/      banco SQLite e dataset (fora do git)
```

## Privacidade
Os cidadãos do protótipo são **100% fictícios**. As chaves de API ficam no `.env` (fora do git). Veja o `.env.example`.
