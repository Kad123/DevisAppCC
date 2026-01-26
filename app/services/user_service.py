from sqlalchemy.orm import Session
from datetime import timedelta
from fastapi import HTTPException, status

from app.models.user import User, UserCreate
from app.core.security import get_password_hash, verify_password, create_access_token

# --- Opérations CRUD pour l'utilisateur ---

def get_user_by_email(db: Session, email: str) -> User | None:
    """Récupère un utilisateur par son email."""
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate) -> User:
    """Crée un nouvel utilisateur (version simplifiée et réparée)."""
    # Cette ligne appellera maintenant notre nouveau code sans bug
    hashed_password = get_password_hash(user.password)
    
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Logique d'Authentification ---

def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Authentifie un utilisateur par email et mot de passe."""
    user = get_user_by_email(db, email=email)
    if not user:
        return None
    
    # Vérifie le mot de passe haché
    if not verify_password(password, user.hashed_password):
        return None
    
    return user

def create_user_access_token(user: User) -> str:
    """Génère un token d'accès pour un utilisateur."""
    # Le temps d'expiration est défini dans app.core.config
    access_token = create_access_token(
        data={"sub": user.email} # 'sub' est la convention pour l'identité dans JWT
    )
    return access_token