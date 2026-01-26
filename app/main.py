from fastapi import FastAPI
from app.core.database import engine, Base 

# --- IMPORTS DIRECTS DES MODÈLES ---
# Ces imports permettent à SQLAlchemy de détecter vos tables automatiquement.
# On importe chaque classe pour éviter les problèmes de dossiers vides (__init__.py).
from app.models.user import User 
from app.models.crm import Client, Projet
from app.models.devis import Devis, LotDevis, LignePoste, Facture
from app.models.chantier import JalonChantier, JournalEntry, PointageHeures
# -----------------------------------

# Importation des routeurs (les fichiers qui gèrent les URLs de l'API)
from app.routers import crm as crm_router 
from app.routers import auth as auth_router 
from app.routers import devis as devis_router 
from app.routers import chantier as chantier_router 

def create_db_tables():
    """Crée toutes les tables dans PostgreSQL au démarrage si elles n'existent pas."""
    Base.metadata.create_all(bind=engine)

# Initialisation de FastAPI
app = FastAPI(
    title="API BTP - Management",
    description="Solution de gestion complète : CRM, Devis et Suivi de chantier.",
    version="1.0.0",
)

# Lancement de la création des tables
create_db_tables()

# Enregistrement des routes pour chaque module
app.include_router(crm_router.router)
app.include_router(auth_router.router)
app.include_router(devis_router.router)
app.include_router(devis_router.facture_router)
app.include_router(chantier_router.router) 

@app.get("/")
def read_root():
    """Vérification que l'API est bien en ligne."""
    return {"message": "API BTP V1 opérationnelle !"}