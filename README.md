# Business Intelligence Portal

![Build Status](https://img.shields.io/badge/build-passing-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Version](https://img.shields.io/badge/version-1.0.0-orange) ![Issues](https://img.shields.io/badge/issues-welcome-yellow)

A full‑stack Business Intelligence (BI) portal with role‑based access, user provisioning, and optional embedded Superset dashboards. This repository contains a FastAPI backend and a React frontend. The Admin UI supports optimistic updates so user role changes and activate/deactivate actions appear instantly.

Status: Beta — actively developed; core features implemented and working. Known issues and roadmap items are tracked in the repository issues.

---

## Table of contents

- Overview
- Quick summary
- Screenshots
- Key features
- Tech stack
- Quick start (high level)
- Configuration & environment
- First-time setup (bootstrap admin)
- Admin UI: usage & behavior
- Troubleshooting (common problems)
- Contributing
- Contact

---

## Overview

This project provides:
- A JSON REST API (FastAPI) for authentication and user/role management.
- A React frontend with an admin "User Provisioning" page that supports create, role assignment, activate/deactivate and optimistic UI updates.
- Optional integration with Apache Superset for embedding dashboards using guest tokens.

The repo is organized into backend (API) and frontend (UI) areas. This single README explains how to get started, where to find important pieces, and how to onboard a new developer or admin.

---

## Quick summary

- Purpose: Administer users and embed BI dashboards for internal stakeholders.
- Primary users: Admins who provision accounts and managers/analysts who consume dashboards.
- Security model: Role-based access; admin endpoints require an admin role. The initial bootstrap supports creating the first admin so the system can be recovered after an empty DB.

---

## Screenshots

- Login page  
  ![Login](docs/screenshots/login.png)

- Home / Dashboard tiles  
  ![Home Tiles](docs/screenshots/home_tiles.png)

- Admin — User Provisioning page  
  ![User Provisioning](docs/screenshots/user_provisioning.png)

- Project dashboard (embedded Superset)  
  ![Project Dashboard](docs/screenshots/project_dashboard.png)

---

## Key features

- Role-based access control (roles table + per-user role association)
- Admin user provisioning:
  - Create users with generated passwords and strength meter
  - Assign roles via dropdown (create role automatically when needed)
  - Activate / Deactivate accounts
  - Optimistic UI updates for fast admin interactions
- Login and JWT-based authentication
- Optional Superset embed support (guest token proxy)
- Dev helpers: permissive CORS and debug endpoints for local troubleshooting

---

## Tech stack

- Backend: Python, FastAPI, async SQLAlchemy, asyncpg
- Auth: JWT (python-jose) and bcrypt hashing (passlib)
- Frontend: React (Create React App)
- Database: PostgreSQL
- Optional: Apache Superset for BI dashboards

---

## Quick start (high level)

These are high‑level steps to get the project running locally. Use your preferred tooling to run commands (terminal, PowerShell, or IDE):

1. Prepare prerequisites: Node.js, Python 3.10+, PostgreSQL.
2. Create and configure a development database accessible to the backend.
3. Install backend Python dependencies and the frontend Node dependencies.
4. Configure environment variables for the backend and frontend (DB credentials, JWT secret, API URL).
5. Start the backend API service.
6. Start the frontend dev server and open the app in a browser.
7. Use the registration or bootstrap procedure to create the initial admin, then sign in and use the Admin UI.

Detailed command examples are intentionally omitted from this README—use your usual workflow or see the project’s developer notes for exact commands.

---

## Configuration & environment

Important settings to provide (via environment variables or a .env file):

- POSTGRES_USER — database user
- POSTGRES_PASSWORD — database password
- POSTGRES_HOST — database host (often `localhost` for dev)
- POSTGRES_PORT — database port (default `5432`)
- POSTGRES_DB — database name used by the app
- SECRET_KEY — JWT signing secret (use a secure random value in production)
- ACCESS_TOKEN_EXPIRE_MINUTES — token expiry in minutes
- REACT_APP_API_URL — frontend base URL to call the backend API

Store production secrets securely (secrets manager, environment configuration, or Docker secrets) and never commit them to source control.

---

## First-time setup (bootstrap admin)

If your database has no users, the app supports creating the initial admin via the public registration endpoint. Recommended bootstrap flow:

1. Open the API docs UI (Swagger) at `/docs` or use the frontend registration page.
2. Register the first user (username, email, password). When the users table is empty, the first registered account will be assigned the `admin` role automatically.
3. Log in with the new credentials to obtain an admin token.
4. Use the Admin UI or admin endpoints to create additional users with roles.

Security note: After bootstrap, further public registrations create ordinary accounts without roles; only admin endpoints can assign roles or create admins.

---

## Admin UI — usage & behavior

Overview of the Admin "User Provisioning" page:
- Create user form with fields for username, email, optional role, and a password generator.
- Provisioned users table with inline role dropdown, Update button, Activate/Deactivate toggle, and actions (Copy email, etc.).
- Optimistic updates: UI applies changes immediately; backend operations run in background and either confirm or roll back the UI change.
- Buttons are disabled while a row action is in progress to avoid duplicate requests.
- Generated passwords are shown only at creation time — prompt users to copy them immediately.

---

## Troubleshooting (common problems)

- Cannot connect to Postgres:
  - Verify Postgres is running and reachable on the configured host/port.
  - Confirm username/password and database name match the app configuration.
- Login fails after creating an admin:
  - Confirm the account is active (is_active flag).
  - Confirm you’re posting login data to the correct endpoint and using the correct credentials.
- “No admin exists” error when registering:
  - If registration is restricted to admins, use the bootstrap pattern described above or temporarily enable the public registration route to create the first admin.
- CORS / browser network errors:
  - Ensure the backend is configured to allow your frontend origin during development, or use a development proxy for the frontend to avoid CORS entirely.
- Superset embedding fails:
  - Verify Superset is reachable, API credentials configured, and guest token generation is permitted by your Superset configuration.

If you see a specific error, capture the backend logs and the failing request details from the browser DevTools Network tab and file an issue or ask for help with that output.

---

## Contributing

We welcome contributions. Typical workflows:
- Open an issue describing the bug or feature request.
- Fork the repository and create a feature branch for your change.
- Write tests for backend and frontend changes where applicable.
- Submit a pull request with a clear title and description; include screenshots for UI changes.
- Follow project styling guidelines and do not commit secrets.

Suggested repo additions to make collaboration easier (if not already present):
- .env.example listing required environment variables
- CONTRIBUTING.md describing the development workflow and coding standards
- A simple GitHub Actions workflow to run tests on PRs
- A docker-compose file for local development (Postgres + backend + frontend)

---

## Contact

If you want me to:
- Generate the README with actual badge URLs customized for your repo,
- Produce ready-to-commit screenshot files (optimized PNGs) and the image folder layout,
- Create .env.example and CONTRIBUTING.md,
- Produce a short Quick Start with the exact commands for your environment (Windows/macOS/Linux),

tell me which files you want next and I will generate them ready to copy into your repo.
