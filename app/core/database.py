from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import DATABASE_URL # Importe l'URL de connexion

# Crée le moteur de base de données (engine)
# Si DATABASE_URL est None, l'erreur ArgumentError apparaît ici. La correction de docker-compose.yml résout cela.
engine = create_engine(DATABASE_URL) 

# Crée une fabrique de sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base déclarative pour les modèles SQLAlchemy (Base)
Base = declarative_base()

# Fonction utilitaire pour obtenir la session de la DB (dépendance FastAPI)
def get_db():
    db = SessionLocal()
    try:
        # Fournit la session
        yield db 
    finally:
        # Assure que la connexion est fermée
        db.close()