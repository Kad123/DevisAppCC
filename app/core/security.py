import os
import bcrypt  # On utilise directement bcrypt pour éviter le bug
from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt

# Configuration JWT
SECRET_KEY = os.getenv("SECRET_KEY", "CLE_SUPER_SECRETE_POUR_LE_DEVELOPPEMENT_12345")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie le mot de passe sans passer par passlib."""
    try:
        password_byte_enc = plain_password.encode('utf-8')
        hashed_password_enc = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_byte_enc, hashed_password_enc)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Génère un hash propre sans passer par passlib."""
    pwd_bytes = password.encode('utf-8')
    # On génère le sel et le hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None) -> str:
    """Génère un jeton JWT (inchangé)."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Union[dict, None]:
    """Décode un jeton JWT (inchangé)."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        return None