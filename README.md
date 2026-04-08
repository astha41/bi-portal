# Business Intelligence Portal

A full-stack Business Intelligence (BI) portal with role-based access, user provisioning, and optional embedded Superset dashboards. This single README describes the whole project (backend and frontend) and explains how to run, develop, test, and maintain the application. No source code or commands are included in this document; instead you will find descriptive, actionable instructions and checklists.

---

## Table of contents

- Project overview
- Key features
- Tech stack
- Repository layout (overview)
- Prerequisites
- Setup overview
  - Backend overview
  - Database overview
  - Frontend overview
- Configuration and environment
- API summary (endpoints and behavior)
- Admin UI: usage and behavior
- Common tasks and how to perform them (conceptual)
- Troubleshooting checklist (network / CORS / connectivity)
- Testing checklist
- Deployment notes (high level)
- Security considerations (concise)
- Contributing guidelines
- Optional next steps you can request

---

## Project overview

This project provides a web-based BI portal that lets administrators create and manage users, assign roles, activate or deactivate accounts, and embed dashboards. The backend is an asynchronous Python API; the frontend is a React application with a polished Admin UI. The Admin UI uses optimistic updates so role changes and activate/deactivate actions appear immediately to the admin without a page reload.

---

## Key features

- Role-based access control with roles stored in the database
- Admin-only user provisioning (create users, assign roles, activate/deactivate)
- Password generation and strength indicator in the UI
- Optimistic frontend updates for instant responses to admin actions
- Backend protection to prevent deactivated users from authenticating
- Optional Superset token proxy for dashboard embedding
- Development helpers and debug endpoints to ease local testing

---

## Tech stack

- Backend: Python, FastAPI, asynchronous SQLAlchemy, PostgreSQL
- Authentication: JWT-based tokens
- Password hashing: industry-standard hashing library (bcrypt via passlib)
- Frontend: React (Create React App), modern CSS
- Optional: Apache Superset for dashboards

---

## Repository layout (overview)

The repository is organized into two main areas:

- Backend: an app package containing the API, models, schemas, auth helpers, dependencies, and route modules for users, admin, roles, and optional superset integration.
- Frontend: a React app containing pages for login, the Admin "User Provisioning" UI, dashboards, and supporting shared components and API helpers.
- Additional utilities: scripts or helper files for seeding data, creating an initial admin, and dev convenience.

---

## Prerequisites

Before running the project you should have:

- Node.js (for running the frontend)
- Python 3.10 or newer (for running the backend)
- PostgreSQL database available for the backend
- Basic familiarity with running development servers and setting environment variables

---

## Setup overview

This section explains the high-level steps and responsibilities for each part of the stack. Specific commands are intentionally omitted: perform them using your usual tooling, guided by the descriptions below.

Backend overview
- The backend implements the REST API and is responsible for connecting to the PostgreSQL database, managing migrations or schema creation in development, hashing passwords, issuing JWT tokens, and enforcing role-based authorization.
- Key components include the database session management, models (User and Role), authentication helpers, and route modules for admin, users, and roles.
- The backend provides endpoints that return JSON user objects so the frontend can update state without reloading the entire users list.

Database overview
- PostgreSQL stores roles and users. Typical tables include a roles table with id and name columns and a users table that references a role id, includes username/email/hashed password/is_active fields, and any other application-specific fields.
- In development the backend may create tables automatically; for production you should use a migration tool.

Frontend overview
- The React frontend has a login page and an Admin "User Provisioning" page.
- AdminCreateUser UI shows a form to create users and a table listing users with role selects and Activate/Deactivate buttons.
- The frontend performs optimistic updates: when an admin clicks Activate/Deactivate or Update role, the table updates locally immediately while the backend request runs; on success the frontend applies the server-provided user object, and on failure it rolls back and shows an error notice.

---

## Configuration and environment

Important settings for the application include database connection parameters, JWT secret and algorithm, and the frontend API base URL. These are typically provided as environment variables. Configure them in your environment or in a local environment file for development. Ensure to keep production secrets secure.

---

## API summary (endpoints and behavior)

Auth endpoints
- Login endpoint: accepts username and password and returns a bearer token for authenticated requests. The backend rejects login attempts for deactivated accounts.

User endpoints
- Current-user endpoint: returns the authenticated user and included role information.

Admin endpoints (require admin privileges)
- List users: returns a list of users with role relationships.
- Activate a user: sets the user's active flag to true and returns the updated user.
- Deactivate a user: sets the user's active flag to false and returns the updated user.
- Assign role to user: accepts a role name, finds or creates the role, assigns it to the user, and returns the updated user.
- Create user: admin-only create endpoint (the frontend may use a dedicated registration route).

Roles endpoint
- List roles: returns a list of available roles in a simple shape used by UI dropdowns.

Superset endpoint (optional)
- Returns a guest token for embedding dashboards when Superset is available.

Behavioral notes
- Admin endpoints return the updated user object so the frontend can update a single row without refetching the entire list.
- The backend treats deactivated accounts as unauthorized for protected endpoints, invalidating existing tokens effectively.

---

## Admin UI: usage and behavior

What the admin sees
- A "User Provisioning" card with a form for username, full name, email, role, and password generation controls.
- A list of provisioned users with columns: Username, Email, Role (select + Update), Active (Yes/No), and Actions (Activate/Deactivate, Copy email).

How actions behave
- Create user: Admin fills the form, optionally generates a password, and creates a new user. The created user appears in the table.
- Role update: Admin selects a role and clicks Update. The table updates immediately (optimistic), and the backend call updates persistence; on backend success the row is confirmed, on failure the change is reverted.
- Activate/Deactivate: Clicking the toggle updates the Active state immediately in the UI; the backend is called in the background. On error the change is rolled back and an informative message is shown.
- Buttons are disabled while an action is in progress for that particular row to prevent duplicate requests.

User experience notes
- Generated passwords must be copied immediately because they are not re-displayed.
- The UI surfaces clear success and error notices, including server-provided messages when available.

---

## Common tasks and how to perform them (conceptual, no SQL included)

Delete a role
1. Identify the role you want to remove and determine which users reference that role.
2. If users reference the role, decide whether to reassign them to another role or leave them without a role.
3. Reassign affected users to the chosen role, or clear their role association depending on your application rules.
4. Delete the role once no users reference it.

Reassign users
- Choose the target role (ensure it exists).
- Update each affected user to reference the target role.
- Confirm the updates in the user listing in the Admin UI or via your database client.

Create an initial admin
- Use the backend’s user creation mechanism (recommended via an existing admin UI) or run a small backend-script/utility that creates a user with the admin role and a secure password.
- Ensure the admin has the correct role assigned and can log in before using the Admin UI to create additional users.

Seed roles and sample users
- Prepare a list of roles you want in production (for example: admin, manager, analyst, hr, finance).
- Insert the roles using your preferred database client or a lightweight seed script.
- Create a few sample users for testing and assign appropriate roles.

Backup and restore
- Regularly back up the database using your DB tooling.
- Before running destructive operations (role deletions, mass updates), create a backup or run operations within a transaction so you can roll back if needed.

---

## Troubleshooting checklist (network / connectivity / request failures)

If activating or updating a user shows a network error or "failed to fetch" in the browser, work through the checklist below:

1. Confirm the backend is running and reachable from the machine hosting the browser.
2. Verify the frontend is configured to call the correct backend URL (protocol, host, and port).
3. If you are using HTTPS for the frontend and HTTP for the backend, the browser may block requests due to mixed content. Serve both sides over the same protocol during development or use a secure backend.
4. If requests are blocked by the browser due to cross-origin restrictions, ensure your backend returns the proper cross-origin headers and that the frontend origin is allowed. For local development you can use a development proxy to avoid CORS issues.
5. Inspect the browser developer tools Network tab for failing requests. Look for the request/response headers, status code, and any console messages describing CORS or mixed content errors.
6. If the backend responds with a server error, check the backend logs for stack traces and fix the underlying exception.
7. Disable browser extensions or service workers that might intercept or block requests while debugging.

---

## Testing checklist

Manually verify the following behaviors:

- Backend API responds to authentication requests and returns a token for valid credentials.
- A deactivated user cannot obtain a token and cannot access protected endpoints.
- AdminCreateUser UI: creating a user shows the new user in the table.
- AdminCreateUser UI: changing a role updates the table instantly and persists on the backend.
- AdminCreateUser UI: activate and deactivate actions apply instantly in the UI and persist on the backend.
- Superset integration (if used): the token endpoint returns a usable guest token and the embed loads.

Consider adding automated tests:
- Backend unit tests for authentication, authorization, and admin operations.
- Frontend component tests for optimistic update behavior and error-rollbacks.

---

## Deployment notes (high level)

- Use environment-specific configurations and a secrets manager for production secrets.
- Serve the backend using a production-grade ASGI server and consider multiple worker processes.
- Use a reverse proxy for TLS termination, static assets, and request routing.
- Migrate the database with a proper migration tool before deploying schema changes.
- Ensure the frontend is built for production and served securely.

---

## Security considerations (brief)

- Passwords must be hashed using a secure algorithm. Ensure the hashing parameters are appropriate for your environment.
- Tokens must be signed with a secure secret and validated on every protected request.
- Deactivated user accounts should not be able to use existing tokens to access protected endpoints.
- Keep secrets out of version control and manage them with your chosen secret management solution.
- Regularly review dependencies for vulnerabilities.

---

## Contributing guidelines

If you want to contribute improvements or fixes:

- Open an issue describing the problem or enhancement you propose.
- Fork the repository and create a topic branch for your changes.
- Keep your changes small and scoped to a single purpose where possible.
- Include tests for backend behavior and frontend components where appropriate.
- Provide a clear PR description explaining what changed and why.
- Do not include sensitive information or secrets in commits.

If you would like help producing optional extras, you can request:
- A `docker-compose.yml` to run database, backend, and frontend together for local development
- A migration scaffold and an initial migration
- A seed script to create default roles and an admin user

---

If you want this README exported as a single ready-to-commit file or adjusted in any way, tell me which edits you want and I will update it accordingly.