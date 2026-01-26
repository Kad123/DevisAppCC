from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.services import user_service
from app.models.user import User

# Définit le schéma OAuth2 pour l'authentification par Bearer Token
# Le tokenUrl pointe vers l'endpoint de connexion que nous venons de créer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# Dépendance utilisée dans les routes pour vérifier le Token
def get_current_user(
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    Dépendance FastAPI pour valider le token JWT et récupérer l'utilisateur.
    Utilisée pour sécuriser les endpoints en exigeant un token valide.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Les identifiants sont invalides",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 1. Décoder et valider le token
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    # 2. Extraire l'identité (email) du payload
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    # 3. Récupérer l'utilisateur dans la base de données
    user = user_service.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
        
    return user

# Dépendance pour s'assurer que l'utilisateur est un Admin
def get_current_admin(current_user: User = Depends(get_current_user)):
    """S'assure que l'utilisateur connecté a le rôle 'admin'."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé. Réservé aux administrateurs."
        )
    return current_user