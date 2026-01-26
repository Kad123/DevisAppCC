from sqlalchemy.orm import Session
from app.models.chantier import (
    JalonChantier, JalonCreate, 
    JournalEntry, JournalEntryCreate, 
    PointageHeures, PointageCreate
)
from app.models.crm import Projet
from fastapi import HTTPException, status
from datetime import date, datetime

# --- 1. GESTION DES JALONS (PLANNING) ---

def create_jalon(db: Session, jalon: JalonCreate) -> JalonChantier:
    """Crée un nouveau jalon pour un projet/chantier."""
    # Vérification que le projet existe
    if not db.query(Projet).get(jalon.projet_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Projet non trouvé."
        )
        
    db_jalon = JalonChantier(**jalon.model_dump())
    db.add(db_jalon)
    db.commit()
    db.refresh(db_jalon)
    return db_jalon

def mark_jalon_completed(db: Session, jalon_id: int) -> JalonChantier:
    """Marque un jalon comme terminé avec la date du jour."""
    db_jalon = db.query(JalonChantier).get(jalon_id)
    if not db_jalon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Jalon non trouvé."
        )
        
    db_jalon.termine = True
    db_jalon.date_realisation = date.today()
    db.commit()
    db.refresh(db_jalon)
    return db_jalon


# --- 2. GESTION DU JOURNAL DE CHANTIER ---

def create_journal_entry(db: Session, entry: JournalEntryCreate, user_id: int) -> JournalEntry:
    """Crée une nouvelle entrée de journal (Note, Incident, Photo)."""
    # Vérification que le projet existe
    if not db.query(Projet).get(entry.projet_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Projet non trouvé."
        )
        
    db_entry = JournalEntry(**entry.model_dump(), user_id=user_id)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


# --- 3. GESTION DU POINTAGE DES HEURES ---

def calculate_time_duration(start: datetime, end: datetime) -> float:
    """Calcule la durée de travail en heures décimales."""
    duration = end - start
    # Retourne la durée en heures (ex: 1h30 -> 1.5)
    return round(duration.total_seconds() / 3600, 2)

def create_pointage(db: Session, pointage: PointageCreate, user_id: int) -> PointageHeures:
    """
    Crée un enregistrement de pointage d'heures.
    Calcule automatiquement la durée à partir des heures de début et de fin.
    """
    # Vérification logique : l'heure de fin doit être après l'heure de début
    if pointage.heures_fin <= pointage.heures_debut:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'heure de fin doit être postérieure à l'heure de début."
        )

    # Calcul de la durée
    duration = calculate_time_duration(pointage.heures_debut, pointage.heures_fin)
    
    db_pointage = PointageHeures(
        **pointage.model_dump(),
        user_id=user_id,
        duree_heures=duration
    )
    db.add(db_pointage)
    db.commit()
    db.refresh(db_pointage)
    return db_pointage

def get_pointages_by_user(db: Session, user_id: int, start_date: date, end_date: date):
    """Récupère les pointages d'un utilisateur sur une période donnée (ex: pour la paie)."""
    return db.query(PointageHeures).filter(
        PointageHeures.user_id == user_id,
        PointageHeures.date_travail >= start_date,
        PointageHeures.date_travail <= end_date
    ).all()


# --- 4. FONCTIONS DE LECTURE ADDITIONNELLES ---

def get_jalons_by_projet(db: Session, projet_id: int):
    """Récupère tous les jalons d'un projet."""
    if not db.query(Projet).get(projet_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé."
        )
    return db.query(JalonChantier).filter(JalonChantier.projet_id == projet_id).all()

def get_journal_by_projet(db: Session, projet_id: int, limit: int = 50):
    """Récupère le journal d'un projet (entrées les plus récentes d'abord)."""
    if not db.query(Projet).get(projet_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projet non trouvé."
        )
    return db.query(JournalEntry).filter(
        JournalEntry.projet_id == projet_id
    ).order_by(JournalEntry.date_entry.desc()).limit(limit).all()

def delete_jalon(db: Session, jalon_id: int) -> bool:
    """Supprime un jalon par son ID."""
    db_jalon = db.query(JalonChantier).get(jalon_id)
    if not db_jalon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jalon non trouvé."
        )

    db.delete(db_jalon)
    db.commit()
    return True