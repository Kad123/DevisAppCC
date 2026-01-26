from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.chantier import (
    JalonResponse, JalonCreate, 
    JournalEntryResponse, JournalEntryCreate,
    PointageResponse, PointageCreate
)
from app.services import chantier_service

# Définit le routeur pour le module de suivi de chantier
router = APIRouter(prefix="/chantier", tags=["Suivi de Chantier"])

# --- 1. ENDPOINTS POUR LES JALONS (PLANNING) ---

@router.post("/jalons/", response_model=JalonResponse, status_code=status.HTTP_201_CREATED)
def create_new_jalon(
    jalon: JalonCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crée une étape clé (jalon) pour un chantier."""
    return chantier_service.create_jalon(db, jalon=jalon)

@router.patch("/jalons/{jalon_id}/complete", response_model=JalonResponse)
def complete_jalon(
    jalon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marque un jalon comme terminé."""
    return chantier_service.mark_jalon_completed(db, jalon_id=jalon_id)

@router.get("/jalons/{projet_id}", response_model=List[JalonResponse])
def get_jalons_projet(
    projet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère tous les jalons d'un projet."""
    return chantier_service.get_jalons_by_projet(db, projet_id=projet_id)

@router.delete("/jalons/{jalon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_jalon(
    jalon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime un jalon."""
    chantier_service.delete_jalon(db, jalon_id=jalon_id)
    return None


# --- 2. ENDPOINTS POUR LE JOURNAL DE BORD ---

@router.post("/journal/", response_model=JournalEntryResponse, status_code=status.HTTP_201_CREATED)
def add_journal_entry(
    entry: JournalEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ajoute une note ou un incident au journal de chantier."""
    return chantier_service.create_journal_entry(db, entry=entry, user_id=current_user.id)

@router.get("/journal/{projet_id}", response_model=List[JournalEntryResponse])
def get_journal_projet(
    projet_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère le journal d'un projet."""
    return chantier_service.get_journal_by_projet(db, projet_id=projet_id, limit=limit)


# --- 3. ENDPOINTS POUR LE POINTAGE DES HEURES ---

@router.post("/pointage/", response_model=PointageResponse, status_code=status.HTTP_201_CREATED)
def clock_in_out(
    pointage: PointageCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enregistre une période de travail (pointage)."""
    return chantier_service.create_pointage(db, pointage=pointage, user_id=current_user.id)

@router.get("/pointage/me", response_model=List[PointageResponse])
def get_my_pointages(
    start_date: date, 
    end_date: date, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère mes heures pointées sur une période donnée."""
    return chantier_service.get_pointages_by_user(
        db, 
        user_id=current_user.id, 
        start_date=start_date, 
        end_date=end_date
    )