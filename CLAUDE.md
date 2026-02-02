# CLAUDE.md - Guide du Projet BTP Management

> 📌 **Fichier de contexte pour Claude Code - À lire au démarrage de chaque session**

## 🎯 Vue d'ensemble du projet

Application de gestion BTP avec backend FastAPI et frontend React pour la gestion de devis, clients, projets et facturation.

- **Stack Backend** : FastAPI + SQLAlchemy + PostgreSQL
- **Stack Frontend** : React + Vite + Tailwind CSS
- **Containerisation** : Docker Compose (PostgreSQL + FastAPI)
- **Authentication** : JWT avec refresh tokens

---

## 📁 Structure des répertoires

```
mon_app_btp_v1/
├── app/                          # Backend FastAPI
│   ├── core/                     # Configuration et base de données
│   │   ├── config.py            # Variables d'environnement
│   │   └── database.py          # Connexion SQLAlchemy
│   ├── models/                   # Modèles SQLAlchemy + Pydantic schemas
│   │   ├── user.py              # User, RefreshToken, Token schemas
│   │   ├── devis.py             # Devis, LotDevis, LignePoste, Facture
│   │   ├── client.py            # Client model
│   │   ├── chantier.py          # Chantier model
│   │   └── crm.py               # CRM models (Projet, etc.)
│   ├── routers/                  # Endpoints FastAPI
│   │   ├── auth.py              # Authentification (login, register, refresh)
│   │   ├── devis.py             # CRUD devis + génération IA
│   │   ├── crm.py               # Gestion clients/projets
│   │   ├── favori.py            # Favoris/library items
│   │   └── ai_gemini.py         # Endpoints IA Gemini
│   ├── services/                 # Logique métier
│   │   ├── devis_service.py     # Calculs devis, factures
│   │   ├── ai_service.py        # Génération devis par IA
│   │   ├── pdf_service.py       # Génération PDF
│   │   ├── finance_service.py   # Calculs financiers
│   │   └── library_service.py   # Gestion bibliothèque prestations
│   ├── dependencies.py           # Dépendances FastAPI (auth, etc.)
│   └── main.py                   # Point d'entrée FastAPI
│
├── dashboard-ia/                 # Frontend React
│   ├── src/
│   │   ├── App.jsx              # Composant principal + routing
│   │   ├── api/
│   │   │   ├── devisAPI.js      # API client pour devis
│   │   │   └── authAPI.js       # API client pour auth
│   │   ├── DevisEditableView.jsx    # Édition devis
│   │   ├── KanbanDevisView.jsx      # Vue Kanban
│   │   ├── PendingDevisView.jsx     # Devis en attente
│   │   ├── ClientsView.jsx          # Gestion clients
│   │   ├── FacturePage.jsx          # Gestion factures
│   │   ├── FavorisLibrary.jsx       # Bibliothèque prestations
│   │   ├── SignaturePad.jsx         # Signature électronique
│   │   └── Toast.jsx                # Notifications
│   ├── package.json
│   └── vite.config.js
│
├── alembic/                      # Migrations de base de données
│   └── versions/
│
├── docker-compose.yml            # Configuration Docker
├── Dockerfile                    # Image Docker backend
├── requirements.txt              # Dépendances Python
├── .pre-commit-config.yaml       # Hooks pre-commit (black, pylint)
├── .pylintrc                     # Configuration pylint
└── .env                          # Variables d'environnement (ne pas committer)
```

---

## 🚀 Commandes clés

### Backend (Docker)

```bash
# Démarrer les services
docker-compose up -d

# Arrêter les services
docker-compose down

# Voir les logs
docker-compose logs -f web
docker-compose logs -f db

# Accéder au shell du container
docker-compose exec web bash

# Installer une dépendance Python
docker-compose exec web pip install <package>
requirements.txt # Puis ajouter au fichier

# Migrations Alembic
docker-compose exec web alembic revision --autogenerate -m "description"
docker-compose exec web alembic upgrade head

# Tests
docker-compose exec web pytest
```

### Frontend (React/Vite)

```bash
cd dashboard-ia

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev              # Port 5173

# Build pour production
npm run build

# Preview du build
npm run preview

# Linter
npm run lint
```

### Git & Pre-commit

```bash
# Installer les hooks pre-commit
pre-commit install

# Commit standard (avec hooks)
git add <fichiers>
git commit -m "message"

# Contourner les hooks (si nécessaire)
git commit --no-verify -m "message"

# Format du message de commit
# <type>: <description courte>
#
# <description détaillée>
#
# Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>

# Types : feat, fix, refactor, docs, test, chore
```

---

## 🎨 Guide de style et conventions

### Python (Backend)

#### Imports
```python
# Ordre des imports (pylint compliant)
# 1. Standard library
from typing import List, Optional
from datetime import datetime

# 2. Third-party
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException

# 3. Local application
from app.core.database import get_db
from app.models.devis import Devis
from app.services import devis_service
```

#### Modèles SQLAlchemy
```python
class MonModele(Base):
    __tablename__ = "mon_modele"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    # ... autres colonnes

    # Relations
    items = relationship("Item", back_populates="modele")
```

#### Schémas Pydantic
```python
class MonModeleBase(BaseModel):
    nom: str
    description: Optional[str] = None

class MonModeleCreate(MonModeleBase):
    pass

class MonModeleResponse(MonModeleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
```

#### Routers FastAPI
```python
router = APIRouter(prefix="/api/ressource", tags=["Ressource"])

@router.post("/", response_model=RessourceResponse)
def create_ressource(
    data: RessourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crée une nouvelle ressource."""
    try:
        return service.create(db, data, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Message d'erreur"
        ) from e  # IMPORTANT: toujours ajouter "from e"
```

#### Services
```python
def ma_fonction(db: Session, param: str) -> MonType:
    """Description de la fonction.

    Args:
        db: Session de base de données
        param: Description du paramètre

    Returns:
        Description du retour

    Raises:
        HTTPException: Si erreur
    """
    # Logique métier
    pass
```

### JavaScript/React (Frontend)

#### Imports
```javascript
// 1. React et hooks
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';

// 2. Bibliothèques externes
import { ArrowLeft, Edit, Trash } from 'lucide-react';

// 3. Composants locaux
import Toast from './Toast';
import { devisAPI } from './api/devisAPI';
```

#### Composants fonctionnels (OBLIGATOIRE)
```javascript
// ✅ CORRECT - Hooks à l'intérieur du composant
const MonComposant = memo(({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  const handleAction = useCallback(async () => {
    setLoading(true);
    try {
      // logique
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [dependencies]);

  useEffect(() => {
    // effet
  }, [dependencies]);

  return (
    <div>
      {/* JSX */}
    </div>
  );
});

// ❌ INCORRECT - Hooks en dehors du composant
const [state, setState] = useState(0); // ERREUR!
const MonComposant = () => { /* ... */ };
```

#### API Calls
```javascript
// api/devisAPI.js
const API_URL = "http://localhost:8000";

export const devisAPI = {
  getAll: async (token) => {
    const res = await fetch(`${API_URL}/devis/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Erreur réseau');
    return res.json();
  },

  create: async (data, token) => {
    const res = await fetch(`${API_URL}/devis/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erreur création');
    return res.json();
  }
};
```

#### Gestion des états
```javascript
// État local pour UI
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({});

// État partagé via props (lifting state up)
const [devis, setDevis] = useState([]);

// Pas de Redux - on utilise props drilling et callbacks
```

---

## 🔧 Configuration et environnement

### Variables d'environnement (.env)

```bash
# Base de données (Docker)
DATABASE_URL=postgresql://user:password@db:5432/nom_db

# JWT
SECRET_KEY=votre_secret_key_securisee
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# IA (Gemini)
GOOGLE_API_KEY=votre_cle_api_gemini

# CORS
FRONTEND_URL=http://localhost:5173
```

### Ports utilisés

- **5173** : Frontend Vite (développement)
- **8000** : Backend FastAPI
- **5432** : PostgreSQL (Docker)

---

## ⚠️ Pièges courants et solutions

### Backend

#### Erreur : "Unable to import 'sqlalchemy'"
- **Cause** : pylint ne voit pas le virtualenv
- **Solution** : Ignorer (E0401), c'est un faux positif

#### Erreur : "Too few public methods"
- **Cause** : pylint sur modèles Pydantic
- **Solution** : Ignorer (R0903), normal pour des DTOs

#### Erreur : "Unused argument 'current_user'"
- **Cause** : FastAPI dependency injection
- **Solution** : Ignorer, requis par FastAPI même si non utilisé

#### Imports dupliqués
- **Cause** : Imports en milieu de fichier
- **Solution** : TOUJOURS mettre tous les imports en haut

### Frontend

#### Erreur : "Invalid hook call"
- **Cause** : Hooks appelés en dehors du composant
- **Solution** : Déplacer TOUS les hooks à l'intérieur du composant

#### Erreur : "ReferenceError: Can't find variable"
- **Cause** : Variable utilisée mais non déclarée
- **Solution** : Ajouter `const [variable, setVariable] = useState(defaultValue)`

#### Build Vite échoue
- **Cause** : Erreur de syntaxe ou import manquant
- **Solution** : `npm run build` pour tester AVANT de committer

---

## 🔐 Authentification

### Flow JWT

1. **Login** : `POST /auth/login` → `{ access_token, refresh_token }`
2. **API Calls** : Header `Authorization: Bearer <access_token>`
3. **Refresh** : `POST /auth/refresh` avec `refresh_token` → nouveau `access_token`
4. **Logout** : Supprimer tokens côté client

### Protection des routes

```python
# Backend
@router.get("/protected")
def protected_route(current_user: User = Depends(get_current_user)):
    return {"user": current_user.email}
```

```javascript
// Frontend
const apiCall = useCallback(async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };
  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (res.status === 401) {
    // Token expiré, refresh ou logout
  }
  return res.json();
}, [token]);
```

---

## 📝 Workflow de développement

### Ajouter une nouvelle fonctionnalité

1. **Backend** :
   ```bash
   # 1. Créer/modifier le modèle dans models/
   # 2. Créer le service dans services/
   # 3. Créer le router dans routers/
   # 4. Enregistrer le router dans main.py
   # 5. Créer migration si nécessaire
   docker-compose exec web alembic revision --autogenerate -m "description"
   docker-compose exec web alembic upgrade head
   ```

2. **Frontend** :
   ```bash
   # 1. Créer l'API client dans src/api/
   # 2. Créer/modifier le composant dans src/
   # 3. Importer dans App.jsx si nécessaire
   # 4. Tester
   npm run dev
   ```

3. **Commit** :
   ```bash
   git add <fichiers>
   git commit -m "feat: description de la fonctionnalité

   - Détail 1
   - Détail 2

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   ```

### Debugging

```bash
# Backend logs
docker-compose logs -f web

# Frontend console
# Ouvrir DevTools dans le navigateur (F12)

# Tester un endpoint
curl -X GET http://localhost:8000/devis/ \
  -H "Authorization: Bearer <token>"

# Accéder à la BDD
docker-compose exec db psql -U user -d nom_db
```

---

## 🧪 Tests

### Backend
```bash
# Tests unitaires
docker-compose exec web pytest

# Coverage
docker-compose exec web pytest --cov=app
```

### Frontend
```bash
# Linter
npm run lint

# Build test
npm run build
```

---

## 📚 Références utiles

- **FastAPI Docs** : https://fastapi.tiangolo.com
- **SQLAlchemy Docs** : https://docs.sqlalchemy.org
- **React Docs** : https://react.dev
- **Vite Docs** : https://vitejs.dev

---

## 🎯 Priorités de Claude

1. **TOUJOURS lire ce fichier au démarrage d'une session**
2. **Respecter la structure des répertoires**
3. **Ne JAMAIS créer de fichiers .md non demandés**
4. **Utiliser les hooks React correctement** (à l'intérieur des composants)
5. **Importer en haut de fichier** (Python)
6. **Ajouter "from e" aux exceptions** (Python)
7. **Tester avec `npm run build`** avant commit (Frontend)
8. **Utiliser `--no-verify`** si pylint bloque sur faux positifs

---

## 📋 Checklist avant commit

- [ ] Backend : Imports en haut de fichier
- [ ] Backend : Exceptions avec `from e`
- [ ] Frontend : Hooks dans les composants
- [ ] Frontend : `npm run build` passe
- [ ] Tests : Pas d'erreurs console
- [ ] Git : Message de commit descriptif

---

*Document maintenu par Claude Code - Dernière mise à jour : 2026-02-02*
