from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.crm import ClientCreate, ClientUpdate, ClientResponse, ProjetCreate, ProjetUpdate, ProjetResponse
from app.services import crm_service
from app.dependencies import get_current_user
from app.models.user import User

# Définit le routeur pour le module CRM
router = APIRouter(prefix="/crm", tags=["CRM Management"])

# --- ENDPOINTS CLIENTS ---

@router.post("/clients/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def handle_create_client(
    client: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crée un nouveau client. Requiert une authentification."""
    db_client = crm_service.get_client_by_email(db, email=client.email)
    if db_client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un client avec cet email existe déjà."
        )
    return crm_service.create_client(db=db, client=client)

@router.get("/clients/", response_model=List[ClientResponse])
def handle_list_clients(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Liste tous les clients avec pagination."""
    return crm_service.get_all_clients(db, skip=skip, limit=limit)

@router.get("/clients/{client_id}", response_model=ClientResponse)
def handle_read_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère un client par son ID."""
    db_client = crm_service.get_client(db, client_id=client_id)
    if db_client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client non trouvé"
        )
    return db_client

@router.put("/clients/{client_id}", response_model=ClientResponse)
def handle_update_client(
    client_id: int,
    client_data: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Met à jour un client existant."""
    return crm_service.update_client(db, client_id=client_id, client_data=client_data)

@router.delete("/clients/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def handle_delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime un client."""
    crm_service.delete_client(db, client_id=client_id)
    return None

# --- ENDPOINTS PROJETS ---

@router.post("/projets/", response_model=ProjetResponse, status_code=status.HTTP_201_CREATED)
def handle_create_projet(
    projet: ProjetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crée un nouveau projet lié à un client."""
    if crm_service.get_client(db, client_id=projet.client_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client introuvable, impossible de créer le projet."
        )
    return crm_service.create_projet(db=db, projet=projet)

@router.get("/projets/", response_model=List[ProjetResponse])
def handle_list_projets(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Liste tous les projets avec pagination."""
    return crm_service.get_projets(db, skip=skip, limit=limit)

@router.get("/projets/{projet_id}", response_model=ProjetResponse)
def handle_read_projet(
    projet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère un projet par son ID."""
    db_projet = crm_service.get_projet(db, projet_id=projet_id)
    if db_projet is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé"
        )
    return db_projet

@router.put("/projets/{projet_id}", response_model=ProjetResponse)
def handle_update_projet(
    projet_id: int,
    projet_data: ProjetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Met à jour un projet existant."""
    return crm_service.update_projet(db, projet_id=projet_id, projet_data=projet_data)

@router.delete("/projets/{projet_id}", status_code=status.HTTP_204_NO_CONTENT)
def handle_delete_projet(
    projet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime un projet."""
    crm_service.delete_projet(db, projet_id=projet_id)
    return None