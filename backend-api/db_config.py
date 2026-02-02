from urllib.parse import quote_plus

DB_USER = "root"
DB_PASS = quote_plus("Nipuna1234!")
DB_HOST = "localhost"
DB_NAME = "smartpark_db"

SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"
