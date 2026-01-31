from fastapi import APIRouter, Depends, HTTPException, status, Body, Response, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.user import User, UserCreate, UserUpdate, UserResponse, Token
from app.services import user_service
from app.dependencies import get_current_user

# Cette variable 'router' est celle que main.py importe
router = APIRouter(prefix="/auth", tags=["Authentification"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Enregistre un nouvel utilisateur après avoir vérifié que l'email est unique.
    """
    db_user = user_service.get_user_by_email(db, email=user_data.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est déjà utilisé."
        )
    return user_service.create_user(db, user=user_data)

@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
    response: Response = None
):
    """
    Vérifie les identifiants et génère un jeton d'accès JWT.
    """
    user = user_service.authenticate_user(
        db,
        email=form_data.username,
        password=form_data.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    tokens = user_service.create_user_tokens(user)
    # Enregistrer le refresh token en base
    from app.core.security import decode_access_token
    payload = decode_access_token(tokens["refresh_token"])
    expires_at = None
    if payload and payload.get('exp'):
        from datetime import datetime
        expires_at = datetime.utcfromtimestamp(payload.get('exp'))
    try:
        user_service.save_refresh_token(db, user_id=user.id, refresh_token=tokens["refresh_token"], expires_at=expires_at)
    except Exception:
        # ne pas échouer la connexion si l'enregistrement échoue
        pass
    # Mettre le refresh token dans un cookie HttpOnly (sécurisé) et retourner l'access token
    # max_age en secondes
    max_age = None
    if expires_at:
        from datetime import datetime
        max_age = int((expires_at - datetime.utcnow()).total_seconds())
    # En production, secure=True est obligatoire (HTTPS requis)
    import os
    is_secure = os.getenv('COOKIE_SECURE', 'true').lower() == 'true'
    if response is not None:
        response.set_cookie(key="refresh_token", value=tokens["refresh_token"], httponly=True, secure=is_secure, samesite="lax", max_age=max_age, path="/")
    return {"access_token": tokens["access_token"], "token_type": "bearer"}


@router.post('/logout')
def logout(db: Session = Depends(get_db), refresh_token: str | None = Cookie(None), response: Response = None):
    """Révoque le refresh token présent dans le cookie et efface le cookie."""
    if not refresh_token:
        # nothing to revoke, still clear cookie
        if response:
            response.delete_cookie("refresh_token", path="/")
        return {"status": "ok"}
    user_service.revoke_refresh_token(db, refresh_token)
    if response:
        response.delete_cookie("refresh_token", path="/")
    return {"status": "ok"}


@router.post('/refresh', response_model=Token)
def refresh_access_token(db: Session = Depends(get_db), refresh_token: str | None = Cookie(None), response: Response = None):
    """Échange le refresh token (lu depuis le cookie HttpOnly) contre un nouvel access token.
    Retourne aussi un nouveau refresh token dans le cookie (rotation).
    """
    if not refresh_token:
        raise HTTPException(status_code=401, detail='Refresh token manquant')

    from app.core.security import decode_access_token
    token_payload = decode_access_token(refresh_token)
    if not token_payload or token_payload.get('type') != 'refresh':
        raise HTTPException(status_code=401, detail='Refresh token invalide')

    email = token_payload.get('sub')
    if not email:
        raise HTTPException(status_code=401, detail='Refresh token invalide')

    # Vérifier en base que le refresh token est connu et non révoqué
    db_rec = user_service.get_refresh_record(db, refresh_token)
    if not db_rec or db_rec.revoked:
        raise HTTPException(status_code=401, detail='Refresh token invalide ou révoqué')

    # Rotation : générer un nouveau refresh token et révoquer l'ancien
    from app.core.security import create_refresh_token
    new_refresh = create_refresh_token({"sub": email})
    from datetime import datetime
    new_payload = decode_access_token(new_refresh)
    expires_at = datetime.utcfromtimestamp(new_payload.get('exp')) if new_payload and new_payload.get('exp') else None
    # enregistrer le nouveau et révoquer l'ancien
    user_id = db_rec.user_id
    try:
        user_service.rotate_refresh_token(db, old_token=refresh_token, new_token=new_refresh, new_expires_at=expires_at, user_id=user_id)
    except Exception:
        pass

    # Générer un nouvel access token
    new_access = user_service.create_user_access_token_from_email(email)
    # Set the new refresh token in cookie (rotation)
    if response:
        max_age = None
        if expires_at:
            max_age = int((expires_at - datetime.utcnow()).total_seconds())
        import os
        is_secure = os.getenv('COOKIE_SECURE', 'true').lower() == 'true'
        response.set_cookie(key="refresh_token", value=new_refresh, httponly=True, secure=is_secure, samesite="lax", max_age=max_age, path="/")
    return {"access_token": new_access, "token_type": "bearer"}


# --- GESTION DES UTILISATEURS (Admin) ---

@router.get("/users/", response_model=List[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Liste tous les utilisateurs (pagination + filtre par rôle)."""
    return user_service.get_all_users(db, skip=skip, limit=limit, role=role)

@router.get("/users/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Récupère les informations de l'utilisateur connecté."""
    return current_user

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère un utilisateur par son ID."""
    user = user_service.get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Met à jour un utilisateur."""
    return user_service.update_user(db, user_id=user_id, user_data=user_data)

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime un utilisateur."""
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas supprimer votre propre compte."
        )
    user_service.delete_user(db, user_id=user_id)
    return None

@router.patch("/users/{user_id}/toggle-active", response_model=UserResponse)
def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Active ou désactive un utilisateur."""
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous ne pouvez pas désactiver votre propre compte."
        )
    return user_service.toggle_user_active(db, user_id=user_id)