# BI Portal

A role‑aware Business Intelligence (BI) Portal that consolidates organizational dashboards (Employee, Project, Performance, Hiring) into a single web interface. The portal provides secure authentication (JWT), server‑enforced RBAC, persistent global filters, per‑user favorites, and embeds Apache Superset dashboards via guest tokens.

Tech stack: React (frontend) + FastAPI (backend) + PostgreSQL. Dashboards are rendered by Apache Superset and securely embedded via backend-issued guest tokens.

---

## Table of Contents

- [Features](#features)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Local development (quick start)](#local-development-quick-start)
  - [Backend (FastAPI)](#backend-fastapi)
  - [Frontend (React)](#frontend-react)
- [Database migrations](#database-migrations)
- [Docker (local / production)](#docker-local--production)
- [Testing & linting](#testing--linting)
- [CI / CD suggestions](#ci--cd-suggestions)
- [Deployment options](#deployment-options)
- [Security & production checklist](#security--production-checklist)
- [API overview & important endpoints](#api-overview--important-endpoints)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

---

## Features

- Centralized discovery of Superset dashboards (card UI, search)
- Server‑enforced role‑based access control (RBAC): Admin, Manager, Analyst, Employee
- Per‑user favorites (local & optional server persistence)
- Persistent global filters (branch, department, year) propagating to embedded dashboards
- Secure Superset embedding with backend guest token issuance
- Audit logging and optional token logs for governance/debugging
- Saved dashboard views (filter state persistence)

---

## Repository structure

Recommended layout:

```
/ (root)
├─ src/            # React app (UI)
├─ backend/             # FastAPI app (API, auth, token endpoint)
├─ .github/workflows/   # CI workflows
├─ docker-compose.yml
├─ README.md
└─ .env.example
```

---

## Prerequisites

- Git
- Node.js >= 16 (npm or yarn)
- Python 3.10+
- PostgreSQL (local or managed)
- (Optional) Docker & Docker Compose

---

## Environment variables

Create `.env` files from `.env.example` (DO NOT commit secrets). Example variables follow.

### Backend (.env)
```
# Database / general
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/biportal
DATABASE_POOL_MIN=1
DATABASE_POOL_MAX=10

# JWT / auth
JWT_SECRET=replace_with_a_long_random_string
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Superset (guest token generation)
SUPERSET_BASE_URL=https://superset.example.com
SUPERSET_SERVICE_ACCOUNT_EMAIL=svc-account@example.com
SUPERSET_SERVICE_ACCOUNT_KEY_JSON='{"type": "...", ...}'   # or appropriate credentials

# Frontend origin (CORS)
FRONTEND_ORIGIN=http://localhost:3000

# Optional
SENTRY_DSN=
SMTP_URL=
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_SUPERSET_BASE_URL=https://superset.example.com
```

> Note: the actual variable names your code reads may differ — match what your config expects.

---

## Local development (quick start)

Clone the repo and open a terminal in the project root.

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
```

### Backend (FastAPI)

1. Create and activate a virtual environment:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

2. Create `.env` from `.env.example` and set values.

3. Apply DB migrations (if you use Alembic):

```bash
# configure alembic.ini with DATABASE_URL or use env var
alembic upgrade head
```

4. Run the backend service for development:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Use logs to confirm DB connection and that the API starts successfully.

### Frontend (React)

1. Install dependencies and run:

```bash
cd ../src
npm ci            # or yarn
cp .env.example .env
# set REACT_APP_API_URL to http://localhost:8000 (or your backend)
npm run dev       # or npm start
```

2. Open http://localhost:3000 (or the port the dev server reports).

---

## Database migrations

Recommended tool: Alembic (if using SQLAlchemy). Example commands:

```bash
# create a revision (after model changes)
alembic revision --autogenerate -m "describe change"

# apply migrations
alembic upgrade head
```

If you use a different ORM/migration tool, follow its conventions.

---

## Docker (local / production)

A `docker-compose.yml` can orchestrate Postgres, backend, and frontend for local dev.

Example usage:

```bash
# from repo root
docker-compose up --build -d
# check logs:
docker-compose logs -f backend
```

Production deployment with Docker: build images for frontend and backend and deploy to your chosen host (DigitalOcean, AWS ECS, GCP Cloud Run, Render, etc.).

---

## Testing & linting

### Backend
- Run unit tests:
```bash
cd backend
pytest
```
- Lint / format:
```bash
black .
flake8
```

### Frontend
- Tests:
```bash
cd src
npm test
```
- Lint / format:
```bash
npm run lint
npm run format
```

Add tests and CI to run these on every pull request.

---

## CI / CD suggestions

Add `.github/workflows/ci.yml` to run linters and tests on pushes/PRs. A minimal workflow has two jobs: `backend` (Python) and `frontend` (Node). For deployment, you can add jobs to build Docker images and push to a registry or trigger provider deployments (Vercel/Render).

---

## Deployment options (recommended)

- Frontend: Vercel or Netlify (connect to GitHub, set project root to `src/`)
- Backend & Database: Render, Railway, Heroku, or Cloud Run + Cloud SQL
- Alternative: Docker + VPS (DigitalOcean droplet) with Nginx as reverse proxy

Quick production notes:
- Use managed Postgres for backups
- Store secrets in provider's secret manager
- Use HTTPS & restrict CORS to frontend domain
- Monitor logs (Sentry/Datadog)

---

## Security & production checklist

- Never commit secrets (.env files, keys)
- Use a strong `JWT_SECRET` (32+ chars, random)
- Short-lived access tokens + refresh tokens if applicable
- Use httpOnly, secure cookies if you choose cookie auth
- Restrict CORS to your frontend domain
- Rate-limit token issuance endpoint
- Use HTTPS everywhere
- Enable DB backups and automated snapshots
- Add audit logging for sensitive actions (token issuance, favorites changes)

---

## API overview & important endpoints

Examples (your implementation may vary):

- POST /api/users/login
  - Body: { "username": "...", "password": "..." }
  - Response: { "access_token": "jwt...", "token_type": "bearer" }

- GET /api/users/me
  - Header: Authorization: Bearer <JWT>
  - Response: user profile + role

- GET /api/superset/token/{dashboardId}
  - Header: Authorization: Bearer <JWT>
  - Response: guest token to embed the Superset dashboard

- POST /api/favorites
  - Body: { "dashboard_id": 123 }
  - Header: Authorization: Bearer <JWT>

- DELETE /api/favorites/{dashboardId}
  - Header: Authorization: Bearer <JWT>

Document your endpoints and expected request/response payloads in a separate API doc if required.

---

## Contributing

Please follow these steps:

1. Fork the repository.
2. Create a feature branch:
```bash
git checkout -b feat/your-feature
```
3. Commit changes with clear messages and open a Pull Request.
4. Include tests for new features and ensure linting passes.

Consider adding `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and issue/PR templates under `.github/`.

---

## Troubleshooting

- Backend fails to connect to DB: check `DATABASE_URL` and ensure Postgres is reachable.
- CORS errors in browser: confirm backend CORS settings allow `REACT_APP_API_URL` origin.
- Superset guest token errors: verify Superset credentials, network access, and allowed origins.
- 500 errors: check backend logs for stack trace and missing env vars.

---

## Example .env.example

Add a `.env.example` (do not include real secrets), for example:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/biportal
JWT_SECRET=replace_me
SUPERSET_BASE_URL=https://superset.example.com
REACT_APP_API_URL=http://localhost:8000/api
```
