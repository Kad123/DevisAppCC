from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.core.database import Base 

# --- Modèles de Base de Données (SQLAlchemy ORM) ---

class Client(Base):
    __tablename__ = "clients"
    
    id = Column(Integer, primary_key=True, index=True)
    nom_societe = Column(String, index=True, nullable=True)
    nom_contact = Column(String)
    prenom_contact = Column(String)
    telephone = Column(String, nullable=True)
    email = Column(String, unique=True, index=True)
    adresse = Column(String, nullable=True)
    date_creation = Column(DateTime, default=func.now())
    
    projets = relationship("Projet", back_populates="client") 

class Projet(Base):
    __tablename__ = "projets"
    
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, index=True)
    description = Column(String, nullable=True)
    statut = Column(String, default="Brouillon Devis") 
    date_creation = Column(DateTime, default=func.now())
    
    client_id = Column(Integer, ForeignKey("clients.id"))
    client = relationship("Client", back_populates="projets")


# --- Schémas de Données (Pydantic pour Input/Output) ---

class ClientCreate(BaseModel):
    # Ce schéma est recherché par app/routers/crm.py
    nom_societe: Optional[str] = None
    nom_contact: str
    prenom_contact: str
    email: str
    telephone: Optional[str] = None
    adresse: Optional[str] = None

class ClientUpdate(BaseModel):
    """Schéma pour la mise à jour partielle d'un client (tous les champs optionnels)."""
    nom_societe: Optional[str] = None
    nom_contact: Optional[str] = None
    prenom_contact: Optional[str] = None
    email: Optional[str] = None
    telephone: Optional[str] = None
    adresse: Optional[str] = None

class ClientResponse(BaseModel):
    id: int
    nom_societe: Optional[str] = None
    nom_contact: str
    prenom_contact: str
    email: str
    telephone: Optional[str] = None
    adresse: Optional[str] = None
    date_creation: datetime

    class Config:
        from_attributes = True

class ProjetCreate(BaseModel):
    nom: str
    description: Optional[str] = None
    client_id: int

class ProjetUpdate(BaseModel):
    """Schéma pour la mise à jour partielle d'un projet."""
    nom: Optional[str] = None
    description: Optional[str] = None
    statut: Optional[str] = None

class ProjetResponse(BaseModel):
    id: int
    nom: str
    description: Optional[str] = None
    statut: str
    client_id: int
    date_creation: datetime

    class Config:
        from_attributes = True