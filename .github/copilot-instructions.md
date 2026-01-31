# Copilot Instructions - BTP Management Application

## Project Overview
Full-stack BTP (construction) management system with:
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL (Python)
- **Frontend**: React + Vite (JavaScript)
- **Architecture**: Modular monolith with service layer, clear domain separation

## Core Architecture

### Backend Structure (`/app`)
- **models/**: SQLAlchemy ORM classes (User, Client, Devis, Chantier, etc.) + Pydantic schemas
- **routers/**: FastAPI route handlers organized by domain (auth, crm, devis, chantier)
- **services/**: Business logic layer - one service per domain (user_service, crm_service, etc.)
- **core/**: Infrastructure (database.py, security.py, config.py)
- **dependencies.py**: FastAPI dependency injection (authentication via get_current_user)

**Key Pattern**: Routes → Services → Models. All database operations flow through services.

### Frontend Structure (`/dashboard-ia`)
React + Vite SPA. All static content served from `app/static/index.html`.

## Critical Developer Workflows

### Starting Development
```bash
# Terminal 1: Start PostgreSQL + FastAPI via Docker
docker-compose up

# Terminal 2: Start React dev server
cd dashboard-ia
npm run dev
```
API runs on `localhost:8000`, frontend on `localhost:5173`.

### Database Management
- PostgreSQL runs in Docker via `docker-compose.yml`
- Tables auto-created on FastAPI startup (see `main.py:create_db_tables()`)
- SQLAlchemy models must be imported in `main.py` for table detection
- Reset DB: Stop containers, delete postgres_data volume, restart

## Authentication & Security

### JWT Implementation
- Custom bcrypt + PyJWT approach (bypasses passlib bugs)
- Token issued at `/auth/token` (OAuth2PasswordRequestForm)
- Token validated in `dependencies.py:get_current_user()` - **use as FastAPI dependency**
- Example: `def endpoint(current_user: User = Depends(get_current_user))`

### Password Handling
- Hash with `security.get_password_hash()`
- Verify with `security.verify_password()` 
- Both use direct bcrypt, not passlib

## Project-Specific Patterns

### Model Organization
SQLAlchemy models pair with Pydantic schemas in same file:
- `User` (ORM) + `UserCreate`, `UserResponse` (Pydantic)
- ORM classes use `__table_args__ = {'extend_existing': True}` to prevent reload errors

### Service Layer
Each service (e.g., `user_service.py`):
1. Takes `db: Session` as first param
2. Handles all database operations
3. Returns domain objects or raises HTTPException

### Router Conventions
- Use `router = APIRouter(prefix="/endpoint", tags=["Domain"])` 
- Import services, not direct database access
- Inject `db: Session = Depends(get_db)` for database access

### Environment Configuration
- Uses `.env` file + `docker-compose.yml` environment variables
- Critical vars: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- Docker containers share env via compose configuration

## Integration Points

### Frontend-to-Backend
- React calls FastAPI at `http://localhost:8000` 
- Auth flow: register at `/auth/register` → token at `/auth/token` → attach to requests
- Include token in Authorization header: `Bearer <token>`

### Service Cross-Communication
- Services can call other services (e.g., user_service from crm_service)
- Always pass `db: Session` through the call chain
- No circular dependencies; maintain clear domain boundaries

## Key Files to Know
- [app/main.py](app/main.py) - FastAPI app initialization + table creation
- [app/core/database.py](app/core/database.py) - DB engine, SessionLocal, Base
- [app/core/security.py](app/core/security.py) - JWT + bcrypt utilities
- [app/dependencies.py](app/dependencies.py) - FastAPI dependency injection
- [app/models/user.py](app/models/user.py) - exemplifies model + schema pattern
- [docker-compose.yml](docker-compose.yml) - PostgreSQL + FastAPI service definitions

## Common Pitfalls
1. **Missing model imports in main.py** → Tables won't auto-create
2. **Using passlib instead of bcrypt** → Known bugs; stick to bcrypt
3. **Direct database access in routers** → Route through services
4. **Not including .env in Docker** → Env vars won't load; use docker-compose environment
