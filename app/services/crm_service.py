from sqlalchemy.orm import Session
from app.models.crm import Client, ClientCreate, ClientUpdate, Projet, ProjetCreate, ProjetUpdate
from fastapi import HTTPException, status

# --- Logique pour les Clients ---

def get_client(db: Session, client_id: int) -> Client | None:
    """Récupère un client par son ID."""
    return db.query(Client).filter(Client.id == client_id).first()

def get_client_by_email(db: Session, email: str) -> Client | None:
    """Récupère un client par son email (pour éviter les doublons)."""
    return db.query(Client).filter(Client.email == email).first()

def create_client(db: Session, client: ClientCreate) -> Client:
    """Crée un nouveau client dans la base de données."""
    db_client = Client(**client.model_dump())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

def get_all_clients(db: Session, skip: int = 0, limit: int = 100):
    """Récupère la liste paginée de tous les clients."""
    return db.query(Client).offset(skip).limit(limit).all()

def update_client(db: Session, client_id: int, client_data: ClientUpdate) -> Client:
    """Met à jour un client existant."""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client non trouvé."
        )

    update_data = client_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_client, field, value)

    db.commit()
    db.refresh(db_client)
    return db_client

def delete_client(db: Session, client_id: int) -> bool:
    """Supprime un client par son ID."""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client non trouvé."
        )

    db.delete(db_client)
    db.commit()
    return True

# --- Logique pour les Projets ---

def get_projets(db: Session, skip: int = 0, limit: int = 100):
    """Récupère la liste des projets."""
    return db.query(Projet).offset(skip).limit(limit).all()

def create_projet(db: Session, projet: ProjetCreate) -> Projet:
    """Crée un nouveau projet lié à un client."""
    db_projet = Projet(**projet.model_dump())
    db.add(db_projet)
    db.commit()
    db.refresh(db_projet)
    return db_projet

def get_projets_by_client(db: Session, client_id: int):
    """Récupère tous les projets d'un client spécifique."""
    return db.query(Projet).filter(Projet.client_id == client_id).all()

def get_projet(db: Session, projet_id: int) -> Projet | None:
    """Récupère un projet par son ID."""
    return db.query(Projet).filter(Projet.id == projet_id).first()

def update_projet(db: Session, projet_id: int, projet_data: ProjetUpdate) -> Projet:
    """Met à jour un projet existant."""
    db_projet = db.query(Projet).filter(Projet.id == projet_id).first()
    if not db_projet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé."
        )

    update_data = projet_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_projet, field, value)

    db.commit()
    db.refresh(db_projet)
    return db_projet

def delete_projet(db: Session, projet_id: int) -> bool:
    """Supprime un projet par son ID."""
    db_projet = db.query(Projet).filter(Projet.id == projet_id).first()
    if not db_projet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé."
        )

    db.delete(db_projet)
    db.commit()
    return True