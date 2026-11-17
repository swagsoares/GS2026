"""Banco SQLite com cidadãos 100% FICTÍCIOS (nenhum dado pessoal real)."""
import random
import sqlite3
from datetime import date, timedelta

from alcance.config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS cidadaos (
  id INTEGER PRIMARY KEY, nome TEXT, idade INT, sexo TEXT, bairro TEXT,
  telefone TEXT CHECK (telefone IN ('smartphone','basico','nenhum')),
  dados_ate_dia INT,            -- dia do mês em que a franquia acaba (NULL = não tem)
  baixa_visao INT, surdez INT, baixo_letramento INT, voz_lenta INT,
  hipertensao INT, diabetes INT, bolsa_familia INT,
  contato_familia TEXT, agente TEXT
);
CREATE TABLE IF NOT EXISTS consultas (
  id INTEGER PRIMARY KEY, cidadao_id INT REFERENCES cidadaos(id),
  especialidade TEXT, data_marcacao TEXT, data_consulta TEXT,
  sms_enviado INT, risco_falta REAL,
  status TEXT DEFAULT 'agendada'  -- agendada|confirmada|remarcada|liberada|realizada|faltou
);
CREATE TABLE IF NOT EXISTS contatos (
  id INTEGER PRIMARY KEY, cidadao_id INT, consulta_id INT,
  canal TEXT, resultado TEXT, quando TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS falas (
  id INTEGER PRIMARY KEY, consulta_id INT, quem TEXT, texto TEXT,
  quando TEXT DEFAULT CURRENT_TIMESTAMP
);
"""


# rede de apoio: o idoso autoriza (ou não) avisar o familiar; faltas anteriores mostram quem diz "vou" e não vai
COLUNAS_NOVAS = {"autoriza_apoio": "INT DEFAULT 0", "faltas_anteriores": "INT DEFAULT 0"}


def garantir_schema(path=None) -> None:
    con = conectar(path) if path else conectar()
    con.executescript(SCHEMA)
    existentes = {r[1] for r in con.execute("PRAGMA table_info(cidadaos)")}
    novas = [c for c in COLUNAS_NOVAS if c not in existentes]
    for col in novas:
        con.execute(f"ALTER TABLE cidadaos ADD COLUMN {col} {COLUNAS_NOVAS[col]}")
    if not novas:  # já migrado: não mexe em consentimento que a pessoa deu ou retirou
        con.close()
        return
    # dados fictícios: quem tem contato de apoio autorizou em ~70% dos casos; idosos faltam um pouco mais no histórico
    con.execute("""UPDATE cidadaos SET
        autoriza_apoio = CASE WHEN contato_familia IS NOT NULL AND (id * 7) % 10 < 7 THEN 1 ELSE 0 END,
        faltas_anteriores = (id * 13) % 4 * (idade >= 60) + (id * 5) % 2
""")
    con.execute("UPDATE cidadaos SET autoriza_apoio = 1, faltas_anteriores = 2 WHERE id = 1")  # Seu Antônio
    con.commit()
    con.close()

NOMES_M = ["Antônio", "José", "Francisco", "João", "Raimundo", "Sebastião", "Pedro", "Luiz", "Carlos", "Manoel"]
NOMES_F = ["Maria", "Ana", "Francisca", "Antônia", "Helena", "Benedita", "Socorro", "Raimunda", "Luzia", "Aparecida"]
SOBRENOMES = ["da Silva", "Santos", "Oliveira", "Souza", "Pereira", "Lima", "Ferreira", "Costa", "Rodrigues", "Almeida"]
BAIRROS = ["Jardim Esperança", "Vila Nova", "Centro", "São Pedro", "Morro Alto", "Parque das Flores"]
ESPECIALIDADES = ["Oftalmologia", "Cardiologia", "Endocrinologia", "Clínico geral", "Ortopedia", "Pré-natal"]
AGENTES = ["Rosa", "Márcio", "Cláudia"]


def conectar(path=DB_PATH) -> sqlite3.Connection:
    con = sqlite3.connect(path)
    con.row_factory = sqlite3.Row
    return con


def _cidadao_ficticio(rng: random.Random, i: int) -> tuple:
    sexo = rng.choice("MF")
    nome = f"{rng.choice(NOMES_M if sexo == 'M' else NOMES_F)} {rng.choice(SOBRENOMES)}"
    idade = rng.choices([rng.randint(18, 39), rng.randint(40, 59), rng.randint(60, 92)], [3, 3, 4])[0]
    # proporções inspiradas em TIC Domicílios 2025 / PNAD 2022 (exageradas p/ demo)
    telefone = rng.choices(["smartphone", "basico", "nenhum"], [6, 3, 1] if idade >= 60 else [9, 1, 0.3])[0]
    dados_ate = rng.choice([None, 15, 19, 23, 28]) if telefone == "smartphone" else None
    return (
        i, nome, idade, sexo, rng.choice(BAIRROS), telefone, dados_ate,
        int(rng.random() < (0.25 if idade >= 60 else 0.06)),  # baixa visão
        int(rng.random() < 0.05),                             # surdez
        int(rng.random() < (0.45 if idade >= 50 else 0.16)),  # baixo letramento (Inaf)
        int(idade >= 70 and rng.random() < 0.5),              # voz lenta
        int(rng.random() < (0.5 if idade >= 60 else 0.15)),
        int(rng.random() < (0.25 if idade >= 60 else 0.07)),
        int(rng.random() < 0.3),
        rng.choice([None, "filha", "filho", "vizinha", "neto"]),
        rng.choice(AGENTES),
    )


def criar_banco(path=DB_PATH, n=200, seed=42) -> None:
    rng = random.Random(seed)
    path.unlink(missing_ok=True)
    con = conectar(path)
    con.executescript(SCHEMA)
    cidadaos = [_cidadao_ficticio(rng, i) for i in range(1, n + 1)]
    # protagonistas do pitch, sempre presentes
    cidadaos[0] = (1, "Antônio Pereira", 68, "M", "Jardim Esperança", "basico", None,
                   1, 0, 1, 0, 1, 1, 1, "vizinha", "Rosa")
    cidadaos[1] = (2, "Júlia Costa", 24, "F", "Centro", "smartphone", 28,
                   0, 1, 0, 0, 0, 0, 0, None, "Cláudia")
    cidadaos[2] = (3, "Benedita Souza", 72, "F", "Jardim Esperança", "smartphone", 23,
                   0, 0, 1, 1, 1, 0, 1, "neto", "Rosa")
    con.executemany(f"INSERT INTO cidadaos VALUES ({','.join('?' * 16)})", cidadaos)

    hoje = date.today()
    consultas = []
    for cid, _, idade, sexo, *_ in cidadaos:
        marcada = hoje - timedelta(days=rng.randint(1, 120))
        consulta = hoje + timedelta(days=rng.randint(1, 14))
        consulta += timedelta(days=max(0, 7 - consulta.weekday()) if consulta.weekday() >= 5 else 0)  # UBS não abre no fim de semana
        opcoes = ESPECIALIDADES if sexo == "F" and idade <= 45 else ESPECIALIDADES[:-1]  # pré-natal só p/ mulheres em idade fértil
        consultas.append((cid, rng.choice(opcoes), marcada.isoformat(),
                          consulta.isoformat(), int(rng.random() < 0.6)))
    dia_antonio = hoje + timedelta(days=2)
    dia_antonio += timedelta(days=7 - dia_antonio.weekday()) if dia_antonio.weekday() >= 5 else timedelta()
    consultas[0] = (1, "Oftalmologia", (hoje - timedelta(days=95)).isoformat(), dia_antonio.isoformat(), 1)
    con.executemany("INSERT INTO consultas (cidadao_id, especialidade, data_marcacao, "
                    "data_consulta, sms_enviado) VALUES (?,?,?,?,?)", consultas)
    con.commit()
    con.close()


if __name__ == "__main__":
    criar_banco()
    print(f"Banco criado em {DB_PATH}")
