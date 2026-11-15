"""Modelo de risco de falta treinado com dados REAIS do SUS (Vitória/ES, Kaggle).

Dataset: "Medical Appointment No Shows" — baixe em
https://www.kaggle.com/datasets/joniarroba/noshowappointments e salve em data/raw/.
"""
import json

import joblib
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split

from alcance.config import DADOS, KAGGLE_CSV, MODELO_PATH
from alcance.db import conectar

METRICAS_PATH = DADOS / "modelo_metricas.json"

FEATURES = ["idade", "mulher", "bolsa", "hipertensao", "diabetes", "deficiencia",
            "sms", "dias_espera", "dia_semana"]


def preparar_kaggle(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    marcado = pd.to_datetime(df["ScheduledDay"]).dt.tz_localize(None).dt.normalize()
    consulta = pd.to_datetime(df["AppointmentDay"]).dt.tz_localize(None).dt.normalize()
    X = pd.DataFrame({
        "idade": df["Age"],
        "mulher": (df["Gender"] == "F").astype(int),
        "bolsa": df["Scholarship"],
        "hipertensao": df["Hipertension"],
        "diabetes": df["Diabetes"],
        "deficiencia": (df["Handcap"] > 0).astype(int),
        "sms": df["SMS_received"],
        "dias_espera": (consulta - marcado).dt.days,
        "dia_semana": consulta.dt.dayofweek,
    })
    ok = (X["idade"] >= 0) & (X["dias_espera"] >= 0)  # remove registros inválidos do dataset
    y = (df["No-show"] == "Yes").astype(int)
    return X[ok], y[ok]


def treinar(csv=KAGGLE_CSV, salvar=MODELO_PATH) -> dict:
    X, y = preparar_kaggle(pd.read_csv(csv))
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    modelo = HistGradientBoostingClassifier(random_state=42)  # sem "balanced": a probabilidade precisa ser real, o painel soma vagas com ela
    modelo.fit(X_tr, y_tr)
    prob = modelo.predict_proba(X_te)[:, 1]
    metricas = {
        "registros": len(X),
        "taxa_falta_real": round(float(y.mean()), 3),
        "roc_auc": round(roc_auc_score(y_te, prob), 3),
        "relatorio": classification_report(y_te, prob >= ALERTA, output_dict=True),
        "vies": vies_por_grupo(X_te, y_te, prob),
        "efeito_sms": efeito_sms(X, y),
    }
    joblib.dump(modelo, salvar)
    METRICAS_PATH.write_text(json.dumps(metricas, ensure_ascii=False, indent=2), encoding="utf-8")
    return metricas


ALERTA = 0.3  # a partir daqui a consulta entra na fila de contato (taxa real de falta: ~20%)


def vies_por_grupo(X: pd.DataFrame, y: pd.Series, prob) -> list[dict]:
    """ROC-AUC e taxa de alerta por grupo: o modelo deve funcionar igualmente bem para todos."""
    grupos = {
        "Idade 0-17": X["idade"] < 18, "Idade 18-39": X["idade"].between(18, 39),
        "Idade 40-59": X["idade"].between(40, 59), "Idade 60+": X["idade"] >= 60,
        "Mulheres": X["mulher"] == 1, "Homens": X["mulher"] == 0,
        "Com deficiência": X["deficiencia"] == 1, "Bolsa Família": X["bolsa"] == 1,
    }
    saida = []
    for nome, m in grupos.items():
        m = m.to_numpy()
        if m.sum() < 50 or y[m].nunique() < 2:
            continue
        saida.append({"grupo": nome, "n": int(m.sum()), "taxa_falta": round(float(y[m].mean()), 3),
                      "roc_auc": round(roc_auc_score(y[m], prob[m]), 3),
                      "alertados": round(float((prob[m] >= ALERTA).mean()), 3)})
    return saida


def efeito_sms(X: pd.DataFrame, y: pd.Series) -> dict:
    """Falta com e sem SMS só entre consultas com 15 a 30 dias de espera.
    A comparação bruta engana: o SMS só vai para consultas marcadas com antecedência, que já faltam mais."""
    m = X["dias_espera"].between(15, 30)
    return {"com_sms": round(float(y[m & (X["sms"] == 1)].mean()), 3),
            "sem_sms": round(float(y[m & (X["sms"] == 0)].mean()), 3)}


def _features_consultas(con) -> pd.DataFrame:
    df = pd.read_sql("""
        SELECT co.id, c.idade, (c.sexo='F') mulher, c.bolsa_familia bolsa, c.hipertensao,
               c.diabetes, (c.baixa_visao OR c.surdez) deficiencia, co.sms_enviado sms,
               co.data_marcacao, co.data_consulta
        FROM consultas co JOIN cidadaos c ON c.id = co.cidadao_id""", con)
    consulta = pd.to_datetime(df["data_consulta"])
    df["dias_espera"] = (consulta - pd.to_datetime(df["data_marcacao"])).dt.days
    df["dia_semana"] = consulta.dt.dayofweek
    return df


def pontuar_consultas(con=None) -> str:
    """Grava risco_falta em cada consulta. Retorna qual método foi usado."""
    con = con or conectar()
    df = _features_consultas(con)
    if MODELO_PATH.exists():
        df["risco"] = joblib.load(MODELO_PATH).predict_proba(df[FEATURES])[:, 1]
        metodo = "modelo"
    else:
        # shortcut: heurística até o CSV do Kaggle ser baixado; trocar rodando `python -m alcance.faltas`
        df["risco"] = (0.15 + 0.004 * df["dias_espera"].clip(0, 90)
                       + 0.1 * (df["idade"] < 30) + 0.05 * df["bolsa"]).clip(0, 0.95)
        metodo = "heuristica"
    con.executemany("UPDATE consultas SET risco_falta=? WHERE id=?",
                    list(zip(df["risco"].round(3), df["id"])))
    con.commit()
    return metodo


if __name__ == "__main__":
    m = treinar()
    print({k: v for k, v in m.items() if k not in ("relatorio", "vies")})
    for g in m["vies"]:
        print(g)
    print("Pontuação das consultas:", pontuar_consultas())
