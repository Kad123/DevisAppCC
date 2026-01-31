# Documentation de déploiement - Authentification & Sécurité

## 🔐 Architecture d'authentification

### Tokens & Cookies

- **Access Token** (JWT, 30 min par défaut)
  - Stocké en mémoire côté client (localStorage).
  - Envoyé dans l'header `Authorization: Bearer <token>` à chaque requête.
  - Expire régulièrement → client doit appeler `/auth/refresh` pour obtenir un nouveau.

- **Refresh Token** (JWT, 7 jours par défaut)
  - Stocké en **cookie HttpOnly+Secure** (inaccessible à JavaScript).
  - Envoyé automatiquement par le navigateur avec `credentials: 'include'`.
  - Utilisé uniquement pour `/auth/refresh` → obtenir un nouvel access token.
  - Sujet à **rotation** : chaque utilisation génère un nouveau token et révoque l'ancien.
  - Stocké en base de données pour revocation et monitoring.

### Flux d'authentification

1. **Login** (`POST /auth/token`)
   - Frontend envoie email/password.
   - Backend génère access_token + refresh_token.
   - Refresh token est enregistré en DB et renvoyé dans un cookie HttpOnly.
   - Frontend reçoit access_token (dans le JSON) et le stocke en localStorage.

2. **Requête protégée**
   - Frontend inclut `Authorization: Bearer <access_token>` à chaque appel.
   - Backend valide le token via `get_current_user()`.

3. **Renouvellement** (`POST /auth/refresh`)
   - Si access_token expiré (401), frontend appelle `/auth/refresh` avec `credentials: 'include'`.
   - Cookie HttpOnly du refresh_token est envoyé automatiquement.
   - Backend valide le refresh_token, génère un nouvel access_token + nouveau refresh_token (rotation).
   - Frontend met à jour son access_token en localStorage et réessaye la requête initiale.

4. **Logout** (`POST /auth/logout`)
   - Frontend appelle `/auth/logout` avec `credentials: 'include'`.
   - Backend révoque le refresh_token (marque en DB).
   - Cookie est effacé côté client.

---

## 🚀 Déploiement en production

### Configuration HTTPS (obligatoire)

Le flag `secure=True` sur les cookies est **activé par défaut** et nécessite **HTTPS**.

#### 1. **Certificat SSL/TLS**

- Utilisez un certificat valide (Let's Encrypt, DigiCert, etc.).
- Chemin : `/etc/letsencrypt/live/yourdomain.com/` (Let's Encrypt)

#### 2. **Nginx (proxy inverse)**

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Sécurité SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS & Credentials
        proxy_set_header Cookie $http_cookie;
        proxy_pass_header Set-Cookie;
    }
}

# Redirection HTTP → HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

#### 3. **Docker Compose (production)**

```yaml
version: '3.8'
services:
  app:
    image: btp-app:latest
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/btp_db
      SECRET_KEY: ${SECRET_KEY}
      ACCESS_TOKEN_EXPIRE_MINUTES: 30
      REFRESH_TOKEN_EXPIRE_DAYS: 7
      COOKIE_SECURE: "true"  # Actif en production
    ports:
      - "8000:8000"
    depends_on:
      - db
    restart: always

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: btp_db
      POSTGRES_USER: user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

volumes:
  postgres_data:
```

#### 4. **Variables d'environnement**

```bash
# Production
export COOKIE_SECURE="true"
export DATABASE_URL="postgresql://user:pass@localhost:5432/btp_prod"
export SECRET_KEY="<votre-clé-très-longue-et-aléatoire>"
export ACCESS_TOKEN_EXPIRE_MINUTES=30
export REFRESH_TOKEN_EXPIRE_DAYS=7
```

#### 5. **Migration base de données**

Avant le premier déploiement, créer la table `refresh_tokens` :

```bash
# Installation Alembic (si pas déjà fait)
pip install alembic

# Exécuter la migration
alembic upgrade head

# Ou si utilisation de SQLAlchemy (auto-création)
python -c "from app.core.database import engine, Base; Base.metadata.create_all(bind=engine)"
```

---

## 🧪 Développement local (HTTPS optionnel)

Pour tester en HTTPS localement :

```bash
# Générer certificat auto-signé
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

# Lancer avec uvicorn et SSL
uvicorn app.main:app --ssl-keyfile=key.pem --ssl-certfile=cert.pem --reload
```

Pour développement sans HTTPS :

```bash
# Désactiver secure=True (DEV ONLY)
export COOKIE_SECURE="false"
uvicorn app.main:app --reload
```

---

## 📋 Checklist déploiement

- [ ] Certificat SSL/TLS valide en place
- [ ] Proxy inverse (Nginx) configuré avec HTTPS
- [ ] Variables d'env définies (`SECRET_KEY`, `DATABASE_URL`, etc.)
- [ ] `COOKIE_SECURE=true` en production
- [ ] Migration Alembic exécutée (`alembic upgrade head`)
- [ ] Frontend au même domaine ou CORS correctement configuré
- [ ] Logs activés pour monitoring des tokens
- [ ] Endpoint `/auth/logout` appelé à chaque logout
- [ ] Refresh token rotation testée

---

## 🔄 Rotation & Révocation des Refresh Tokens

### Rotation automatique
À chaque appel à `/auth/refresh`, un nouveau refresh_token est généré et l'ancien est révoqué.

### Révocation manuelle (admin)
Endpoint optionnel (à ajouter) :

```python
@router.delete("/admin/refresh-tokens/{token_id}")
def revoke_token(token_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    """Admin peut révoquer manuellement un refresh token."""
    user_service.revoke_refresh_token_by_id(db, token_id)
    return {"status": "ok"}
```

---

## 🚨 Sécurité en production

1. **HTTPS obligatoire** → `secure=True` sur les cookies
2. **SameSite=Lax** → Protège contre CSRF (défaut Lax ; considérer Strict si possible)
3. **HttpOnly** → Empêche l'accès via JavaScript
4. **Rotation** → Nouveau refresh token à chaque utilisation
5. **Expiration** → Access token court (30 min), refresh token long (7j)
6. **Monitoring** → Logger les révocations et usage de tokens
7. **CORS** → Allowlist des origins autorisées

---

## 📞 Support

Pour questions ou bugs liés à l'authentification : voir les endpoints en `/auth/*` dans `app/routers/auth.py`.
