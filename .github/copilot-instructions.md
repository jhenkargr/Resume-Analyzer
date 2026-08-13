# Copilot Instructions — AI Resume Analyzer

This repo is a full-stack application that lets users upload a resume, optionally paste a
target job description, and get back an AI-generated analysis (match score, missing
keywords/skills, and improvement suggestions).

## Stack

- **Backend:** Java + Spring Boot (REST API, service layer, AI-analysis integration)
- **Auth:** Spring Security (JWT-based, stateless)
- **Frontend:** React (file upload UI, results dashboard)
- **Database:** MySQL (users, resumes, analysis results, history)
- **Testing:** JUnit 5 + Mockito (backend), React Testing Library + Jest (frontend)

## Repo layout

```
backend/    Spring Boot application (Maven/Gradle)
frontend/   React application
.github/skills/   Detailed, topic-specific guidance — read the relevant SKILL.md
                  before making non-trivial changes in that area
```

## Skill files — read before you touch that layer

| Working in...                         | Read first                                  |
|----------------------------------------|----------------------------------------------|
| `backend/` controllers/services/AI call | `.github/skills/spring-boot-backend/SKILL.md` |
| Auth, JWT, filters, roles              | `.github/skills/spring-security/SKILL.md`     |
| `frontend/`                            | `.github/skills/react-frontend/SKILL.md`      |
| Entities, migrations, queries          | `.github/skills/mysql/SKILL.md`               |
| Any new test file                      | `.github/skills/testing/SKILL.md`             |

Each SKILL.md is self-contained: conventions, folder structure, and concrete
do/don't examples for that part of the stack. Skim the relevant one(s) before
generating code — several often apply to a single feature (e.g. a new
"analyze resume" endpoint touches backend + security + mysql + testing).

## Cross-cutting conventions

- **Never commit secrets.** API keys (AI provider, DB credentials, JWT secret) come from
  environment variables / `application-*.yml` profiles that are gitignored, never hardcoded.
- **API contract:** REST, JSON, versioned under `/api/v1/...`. Keep backend DTOs and
  frontend TypeScript types in sync when either changes.
- **Errors:** backend returns a consistent `{ "error": string, "status": number }` shape;
  frontend has a single place (API client / interceptor) that handles this shape.
- **File uploads:** resumes are user-supplied files (PDF/DOCX) — validate type and size
  server-side regardless of frontend validation; never trust client-side checks alone.
- **AI calls:** treat the AI provider as an external, potentially slow/unreliable
  dependency — always behind a timeout, with a defined fallback/error path surfaced
  to the user, and never called directly from a controller (see backend skill).
- **Commits/PRs:** small, single-purpose; include what changed and why, not just what.

## Before opening a PR

- Backend: `mvn test` (or `./gradlew test`) passes.
- Frontend: `npm test` and `npm run lint` pass.
- New endpoints: manually verify the happy path + one auth-failure and one
  validation-failure case.
