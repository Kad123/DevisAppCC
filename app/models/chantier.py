from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, func, Date, Float
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

from app.core.database import Base 

# --- MODÈLES DE BASE DE DONNÉES (SQLAlchemy) ---

class JalonChantier(Base):
    """Modèle pour le planning et les étapes clés (Jalons)."""
    __tablename__ = "jalons_chantier"
    
    id = Column(Integer, primary_key=True, index=True)
    projet_id = Column(Integer, ForeignKey("projets.id"))
    
    nom = Column(String) # Nom de l'étape (ex: Fondations, Pose menuiseries)
    date_prevue = Column(Date) # Date cible
    date_realisation = Column(Date, nullable=True) # Date réelle de fin
    termine = Column(Boolean, default=False)

class JournalEntry(Base):
    """Modèle pour le journal de bord quotidien (Notes, Incidents, Photos)."""
    __tablename__ = "journal_chantier"
    
    id = Column(Integer, primary_key=True, index=True)
    projet_id = Column(Integer, ForeignKey("projets.id"))
    user_id = Column(Integer, ForeignKey("users.id")) # Auteur de la note
    
    date_entry = Column(DateTime, default=func.now())
    type_entry = Column(String, default="Note") # Note, Incident, Photo, Météo
    description = Column(String)
    file_url = Column(String, nullable=True) # Lien vers une photo stockée

class PointageHeures(Base):
    """Modèle pour le suivi du temps de travail (Pointage)."""
    __tablename__ = "pointage_heures"
    
    id = Column(Integer, primary_key=True, index=True)
    projet_id = Column(Integer, ForeignKey("projets.id"))
    user_id = Column(Integer, ForeignKey("users.id")) # L'ouvrier ou l'artisan
    
    date_travail = Column(Date)
    heures_debut = Column(DateTime)
    heures_fin = Column(DateTime)
    duree_heures = Column(Float) # Calculé automatiquement (fin - début)
    lot_rattachement = Column(String, nullable=True)


# --- SCHÉMAS DE DONNÉES (Pydantic pour l'API) ---

# Jalons (Planning)
class JalonBase(BaseModel):
    nom: str
    date_prevue: date

class JalonCreate(JalonBase):
    projet_id: int

class JalonResponse(JalonBase):
    id: int
    projet_id: int
    date_realisation: Optional[date] = None
    termine: bool
    
    class Config:
        from_attributes = True

# Journal de Bord
class JournalEntryBase(BaseModel):
    description: str
    type_entry: str = "Note"
    file_url: Optional[str] = None

class JournalEntryCreate(JournalEntryBase):
    projet_id: int

class JournalEntryResponse(JournalEntryBase):
    id: int
    projet_id: int
    user_id: int
    date_entry: datetime
    
    class Config:
        from_attributes = True

# Pointage des Heures
class PointageBase(BaseModel):
    date_travail: date
    heures_debut: datetime
    heures_fin: datetime
    lot_rattachement: Optional[str] = None

class PointageCreate(PointageBase):
    projet_id: int

class PointageResponse(PointageBase):
    id: int
    projet_id: int
    user_id: int
    duree_heures: float
    
    class Config:
        from_attributes = True