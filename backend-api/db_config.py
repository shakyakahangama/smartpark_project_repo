import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "smartpark.db")

# ✅ Render / cloud will use DATABASE_URL if it exists
# ✅ Otherwise local will use SQLite file
SQLALCHEMY_DATABASE_URI = os.environ.get(
    "DATABASE_URL",
    f"sqlite:///{DB_PATH}"
)