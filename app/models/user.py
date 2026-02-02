from typing import Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship
from pydantic import BaseModel, EmailStr
from app.core.database import Base


# --- MODÈLE SQLALCHEMY (Base de données) ---
class User(Base):
    __tablename__ = "users"
    # extend_existing=True permet d'éviter les erreurs lors du rechargement de FastAPI
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    full_name = Column(String, nullable=True)
    role = Column(String, default="artisan")  # 'admin', 'artisan', 'gestionnaire'
    date_creation = Column(DateTime, default=func.now())

    # Relation favoris (prestations type)
    favoris = relationship("Favori", back_populates="user")


# --- SCHÉMAS PYDANTIC (Validation API) ---


class UserCreate(BaseModel):
    """Schéma pour l'inscription d'un nouvel utilisateur."""

    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "artisan"


class UserResponse(BaseModel):
    """Schéma pour la réponse de l'API (exclut le mot de passe)."""

    id: int
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    is_active: bool
    date_creation: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schéma pour la mise à jour d'un utilisateur."""

    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class Token(BaseModel):
    """Schéma pour le jeton JWT."""

    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"


class RefreshTokenResponse(BaseModel):
    token: str
    expires_at: datetime

    class Config:
        from_attributes = True


# --- Modèle de stockage des refresh tokens ---
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime)
    revoked = Column(Boolean, default=False)


class TokenData(BaseModel):
    """Schéma pour le contenu décodé du jeton."""

    email: Optional[str] = None
