from pathlib import Path

from dotenv import load_dotenv

APP_NOME = "ALCANCE"  # trocar o nome do produto aqui
APP_SLOGAN = "O serviço público que chega em você"

RAIZ = Path(__file__).resolve().parent.parent
DADOS = RAIZ / "data"
DB_PATH = DADOS / "alcance.db"
KAGGLE_CSV = DADOS / "raw" / "KaggleV2-May-2016.csv"
MODELO_PATH = DADOS / "modelo_faltas.joblib"

load_dotenv(RAIZ / ".env")
