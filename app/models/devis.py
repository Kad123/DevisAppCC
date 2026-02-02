from typing import List, Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from app.core.database import Base

# --- MODÈLES SQLALCHEMY (Base de données) ---


class Devis(Base):
    __tablename__ = "devis"

    id = Column(Integer, primary_key=True, index=True)
    projet_id = Column(Integer, ForeignKey("projets.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    nom = Column(String, index=True)
    statut = Column(String, default="Brouillon", nullable=False)
    date_emission = Column(DateTime, default=func.now())
    taux_tva = Column(Float, default=20.0)
    total_ht = Column(Float, default=0.0)
    total_ttc = Column(Float, default=0.0)
    validite_jours = Column(Integer, default=30)

    lots = relationship(
        "LotDevis", back_populates="devis", cascade="all, delete-orphan"
    )
    factures = relationship("Facture", back_populates="devis")
    signature_path = Column(String, nullable=True)  # Chemin de la signature PNG


class LotDevis(Base):
    __tablename__ = "lots_devis"

    id = Column(Integer, primary_key=True, index=True)
    devis_id = Column(Integer, ForeignKey("devis.id"))
    nom = Column(String)
    ordre = Column(Integer)
    total_lot_ht = Column(Float, default=0.0)

    devis = relationship("Devis", back_populates="lots")
    lignes_poste = relationship(
        "LignePoste", back_populates="lot", cascade="all, delete-orphan"
    )


class LignePoste(Base):
    __tablename__ = "lignes_poste"

    id = Column(Integer, primary_key=True, index=True)
    lot_id = Column(Integer, ForeignKey("lots_devis.id"))
    designation = Column(String)
    unite = Column(String)
    quantite = Column(Float)
    prix_unitaire_ht = Column(Float)
    total_ligne_ht = Column(Float)

    lot = relationship("LotDevis", back_populates="lignes_poste")


class Facture(Base):
    __tablename__ = "factures"

    id = Column(Integer, primary_key=True, index=True)
    devis_id = Column(Integer, ForeignKey("devis.id"))
    numero_facture = Column(
        String, unique=True, index=True, nullable=False
    )  # Numéro séquentiel, inaltérable
    total_ht = Column(Float)
    total_ttc = Column(Float)
    date_emission = Column(DateTime, default=func.now())
    date_prestation = Column(DateTime, nullable=True)  # Date de la vente/prestation
    mention_franchise_tva = Column(
        String, nullable=True
    )  # Mention légale si franchise TVA

    devis = relationship("Devis", back_populates="factures")


# --- SCHÉMAS PYDANTIC (Validation API) ---


class LignePosteBase(BaseModel):
    designation: str
    unite: str
    quantite: float
    prix_unitaire_ht: float


class LignePosteCreate(LignePosteBase):
    pass


class LignePosteResponse(LignePosteBase):
    id: int
    total_ligne_ht: float

    class Config:
        from_attributes = True


class LotDevisBase(BaseModel):
    nom: str
    ordre: int


class LotDevisCreate(LotDevisBase):
    lignes_poste: List[LignePosteCreate]


class LotDevisResponse(LotDevisBase):
    id: int
    total_lot_ht: float
    lignes_poste: List[LignePosteResponse]

    class Config:
        from_attributes = True


class DevisBase(BaseModel):
    nom: str
    taux_tva: float = 20.0
    validite_jours: int = 30


class DevisCreate(DevisBase):
    projet_id: int
    lots: List[LotDevisCreate]


class DevisResponse(DevisBase):
    id: int
    projet_id: int
    client_id: int
    user_id: int
    statut: str
    date_emission: datetime
    total_ht: float
    total_ttc: float
    lots: List[LotDevisResponse]
    signature_path: Optional[str] = None

    class Config:
        from_attributes = True


class DevisUpdate(BaseModel):
    """Schéma pour la mise à jour d'un devis (sans toucher aux lots)."""

    nom: Optional[str] = None
    statut: Optional[str] = None
    taux_tva: Optional[float] = None
    validite_jours: Optional[int] = None


# --- SCHÉMAS PYDANTIC (Factures) ---


class FactureCreate(BaseModel):
    """Schéma pour créer une facture depuis un devis."""

    devis_id: int


class FactureResponse(BaseModel):
    """Schéma de réponse pour une facture."""

    id: int
    devis_id: int
    numero_facture: str
    total_ht: float
    total_ttc: float
    date_emission: datetime
    date_prestation: datetime | None = None
    mention_franchise_tva: str | None = None

    class Config:
        from_attributes = True
