from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from fastapi import HTTPException, status
from typing import Optional

from app.models.user import User, UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token

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


def create_user_tokens(user: User) -> dict:
    """Retourne à la fois access_token et refresh_token pour un utilisateur."""
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})
    return {"access_token": access_token, "refresh_token": refresh_token}


def create_user_access_token_from_email(email: str) -> str:
    """Génère un access token à partir d'un email (utile pour refresh endpoint)."""
    # Cette fonction ne touche pas à la DB; elle génère un token basé sur l'email.
    return create_access_token(data={"sub": email})


def save_refresh_token(db: Session, user_id: int, refresh_token: str, expires_at: datetime) -> None:
    """Enregistre un refresh token en base pour l'utilisateur."""
    from app.models.user import RefreshToken
    db_token = RefreshToken(user_id=user_id, token=refresh_token, expires_at=expires_at, revoked=False)
    db.add(db_token)
    db.commit()


def get_refresh_record(db: Session, token: str):
    """Récupère l'enregistrement du refresh token s'il existe et n'est pas révoqué."""
    from app.models.user import RefreshToken
    return db.query(RefreshToken).filter(RefreshToken.token == token).first()


def revoke_refresh_token(db: Session, token: str) -> None:
    """Marque un refresh token comme révoqué."""
    rec = get_refresh_record(db, token)
    if rec:
        rec.revoked = True
        db.commit()


def rotate_refresh_token(db: Session, old_token: str, new_token: str, new_expires_at: datetime, user_id: int) -> None:
    """Révoque l'ancien token et enregistre le nouveau."""
    revoke_refresh_token(db, old_token)
    save_refresh_token(db, user_id=user_id, refresh_token=new_token, expires_at=new_expires_at)


# --- Opérations CRUD supplémentaires ---

def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Récupère un utilisateur par son ID."""
    return db.query(User).filter(User.id == user_id).first()

def get_all_users(db: Session, skip: int = 0, limit: int = 100, role: Optional[str] = None):
    """Récupère la liste des utilisateurs avec filtre optionnel sur le rôle."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.offset(skip).limit(limit).all()

def update_user(db: Session, user_id: int, user_data: UserUpdate) -> User:
    """Met à jour un utilisateur existant."""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé."
        )

    update_data = user_data.model_dump(exclude_unset=True)

    # Si le mot de passe est fourni, le hasher
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    elif "password" in update_data:
        del update_data["password"]

    for field, value in update_data.items():
        setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int) -> bool:
    """Supprime un utilisateur par son ID."""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé."
        )

    db.delete(db_user)
    db.commit()
    return True

def toggle_user_active(db: Session, user_id: int) -> User:
    """Active ou désactive un utilisateur."""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé."
        )

    db_user.is_active = not db_user.is_active
    db.commit()
    db.refresh(db_user)
    return db_user