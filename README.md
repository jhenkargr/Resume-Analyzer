# AI Resume Analyzer

Local development setup for the AI Resume Analyzer application (Spring Boot backend + React/Vite frontend).

Quick start (dev, zero external DB)

1) Backend

```bash
cd backend
mvn clean package
mvn spring-boot:run
```

Defaults: server on `http://localhost:8080`, embedded H2 database (dev profile).

2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

Notes
- The frontend proxies `/api` to `http://localhost:8080` during development (see `frontend/vite.config.js`).
- JWT secret is read from `app.jwt.secret` in `application.yml` or `JWT_SECRET` env var.
- PDF parsing uses Apache PDFBox and DOCX parsing uses Apache POI.

Switch to MySQL (optional)
- Set `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD` env vars or edit `backend/src/main/resources/application.yml` to point to your MySQL.

Docker (optional)
- A `docker-compose.dev.yml` is available to run backend + MySQL; run `docker-compose -f docker-compose.dev.yml up --build` from the repo root.

If you want I can: set up separate Dockerfiles for backend/frontend, or change the default ports. Tell me which next.

Smoke test
----------
Run a quick end-to-end smoke test (requires Node 18+):

```bash
# start backend and frontend first (or run via docker-compose)
node scripts/smoke-test.js
```

You can override the backend URL with `BACKEND_URL`, e.g.: `BACKEND_URL=http://localhost:8081 node scripts/smoke-test.js`.
