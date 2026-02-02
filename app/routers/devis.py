from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.devis import (
    DevisCreate,
    DevisUpdate,
    DevisResponse,
    FactureCreate,
    FactureResponse,
)
from app.services import devis_service, ai_service

# Cette variable 'router' est indispensable pour que main.py puisse l'importer
router = APIRouter(prefix="/devis", tags=["Devis & Facturation"])


# --- 1. CRÉATION MANUELLE ---
@router.post("/", response_model=DevisResponse, status_code=status.HTTP_201_CREATED)
def handle_create_devis(
    devis_data: DevisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crée un devis complet avec calculs automatiques."""
    try:
        return devis_service.create_full_devis(
            db, devis_data=devis_data, user_id=current_user.id
        )
    except Exception as e:
        print(f"Erreur création devis : {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la création du devis.",
        ) from e


# --- 2. GÉNÉRATION PAR IA ---
@router.post(
    "/generate", response_model=DevisResponse, status_code=status.HTTP_201_CREATED
)
async def handle_generate_ai_devis(
    prompt: str = Body(..., embed=True),
    projet_id: int = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Analyse une description via l'IA et génère le devis."""
    try:
        # Appel au service IA pour transformer le texte en JSON
        ai_generated_data = await ai_service.generate_devis_from_prompt(prompt)
        ai_generated_data["projet_id"] = projet_id

        # Validation et enregistrement via le service de devis
        devis_data = DevisCreate(**ai_generated_data)
        return devis_service.create_full_devis(
            db, devis_data=devis_data, user_id=current_user.id
        )
    except Exception as e:
        print(f"Erreur génération IA : {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Échec de la génération automatique via l'IA.",
        ) from e


# --- 3. LECTURE ---
@router.get("/", response_model=List[DevisResponse])
def handle_list_devis(
    skip: int = 0,
    limit: int = 100,
    statut: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Liste tous les devis avec pagination et filtre optionnel sur le statut."""
    return devis_service.get_all_devis(db, skip=skip, limit=limit, statut=statut)


@router.get("/{devis_id}", response_model=DevisResponse)
def handle_get_devis(
    devis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Récupère un devis par son ID."""
    devis = devis_service.get_devis_by_id(db, devis_id)
    if not devis:
        raise HTTPException(status_code=404, detail="Devis non trouvé")
    return devis


# --- 4. MISE À JOUR ---
@router.put("/{devis_id}", response_model=DevisResponse)
def handle_update_devis(
    devis_id: int,
    devis_data: DevisUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Met à jour un devis existant."""
    return devis_service.update_devis(db, devis_id=devis_id, devis_data=devis_data)


# --- 5. SUPPRESSION ---
@router.delete("/{devis_id}", status_code=status.HTTP_204_NO_CONTENT)
def handle_delete_devis(
    devis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Supprime un devis et ses lots/lignes associés."""
    devis_service.delete_devis(db, devis_id=devis_id)


# ============================================================
# ENDPOINTS FACTURES
# ============================================================

facture_router = APIRouter(prefix="/factures", tags=["Factures"])


@facture_router.post(
    "/", response_model=FactureResponse, status_code=status.HTTP_201_CREATED
)
def handle_create_facture(
    facture_data: FactureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crée une facture depuis un devis validé."""
    return devis_service.create_facture(db, devis_id=facture_data.devis_id)


@facture_router.get("/", response_model=List[FactureResponse])
def handle_list_factures(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Liste toutes les factures avec pagination."""
    return devis_service.get_all_factures(db, skip=skip, limit=limit)


@facture_router.get("/{facture_id}", response_model=FactureResponse)
def handle_get_facture(
    facture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Récupère une facture par son ID."""
    facture = devis_service.get_facture_by_id(db, facture_id)
    if not facture:
        raise HTTPException(status_code=404, detail="Facture non trouvée")
    return facture


@facture_router.get("/devis/{devis_id}", response_model=List[FactureResponse])
def handle_get_factures_by_devis(
    devis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Récupère toutes les factures liées à un devis."""
    return devis_service.get_factures_by_devis(db, devis_id=devis_id)
