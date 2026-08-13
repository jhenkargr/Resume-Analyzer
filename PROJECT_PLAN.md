# AI Resume Analyzer — Complete Project Plan

## 1. Overview

**AI Resume Analyzer** is a full-stack web application that lets users upload a resume (PDF/DOCX), get it analyzed by an AI model (Gemini), compare it against a specific job description, and receive concrete, actionable rewrites — all tracked over time on a personal dashboard.

**Core value proposition:** most resume-checker tools give a static score. This one keeps a *history* of every analysis, so a user can see their score improve as they apply suggestions — turning resume writing into an iterative, measurable process instead of a one-shot guess.

| | |
|---|---|
| **Type** | Full-stack web app |
| **Primary users** | Job seekers preparing/tailoring resumes |
| **Core loop** | Upload → Analyze → Match against JD → Get rewrites → Re-upload → Track improvement |
| **AI provider** | Google Gemini API (`gemini-1.5-flash`) |

---

## 2. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend | Java 17, Spring Boot 3.3 | Mature, strong typing, easy security integration |
| Frontend | React (Vite), Recharts | Fast dev loop, component reuse, good charting support |
| Database | MySQL 8 | Relational data (users → resumes → analyses) fits well |
| ORM | Hibernate / Spring Data JPA | Less boilerplate, auto schema generation |
| Auth | Spring Security + JWT (jjwt) | Stateless auth, scales horizontally |
| AI | Gemini API via `WebClient` | Free tier available, strong JSON-mode support |
| Parsing | Apache PDFBox (PDF), Apache POI (DOCX) | Industry standard, no external service needed |
| Build | Maven | Standard for Spring Boot |
| VCS | Git + GitHub | — |

---

## 3. System Architecture

```
┌─────────────┐      HTTPS/JSON       ┌──────────────────────┐
│   React     │ ────────────────────► │   Spring Boot API    │
│  Frontend   │ ◄──────────────────── │   (REST, stateless)  │
└─────────────┘      JWT in header    └──────────┬───────────┘
                                                  │
                       ┌──────────────────────────┼───────────────────────┐
                       │                          │                       │
                       ▼                          ▼                       ▼
              ┌────────────────┐       ┌──────────────────┐     ┌─────────────────┐
              │  MySQL (JPA)   │       │  File Storage     │     │   Gemini API     │
              │  users,        │       │  (local disk /    │     │  (analysis,      │
              │  resumes,      │       │   S3 later)       │     │   matching,      │
              │  analyses,     │       └──────────────────┘     │   rewriting)     │
              │  job_matches   │                                └─────────────────┘
              └────────────────┘
```

**Request flow example (resume analysis):**
1. React sends the JWT + resume file to `POST /api/resumes/upload`.
2. Backend validates the JWT (Spring Security filter), stores the file, extracts text (PDFBox/POI).
3. React calls `POST /api/analysis/{resumeId}` to trigger analysis.
4. Backend builds a structured prompt, calls Gemini, parses the JSON response, persists an `Analysis` row.
5. React renders the score breakdown and stores nothing locally — everything is re-fetchable from the dashboard.

---

## 4. Database Design

Five tables, all owned (directly or transitively) by `users`:

```
users (1) ──< resumes (many)
resumes (1) ──< analyses (many)              -- every re-analysis = new row → score history
resumes (1) ──< job_matches (many)
resumes (1) ──< resume_improvements (many)
```

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Auth + profile | `email` (unique), `password_hash`, `role` |
| `resumes` | Uploaded files + extracted text | `file_path`, `extracted_text`, `file_type` |
| `analyses` | AI evaluation results, one row per run | `overall_score`, `ats_score`, `grammar_score`, `technical_skills` (JSON) |
| `job_matches` | Resume vs. pasted JD comparison | `match_score`, `matched_skills`, `missing_skills` |
| `resume_improvements` | AI-rewritten content | `improved_summary`, `improved_experience` (JSON) |

Keeping `analyses` as a append-only history (rather than one row updated in place) is the design decision that makes the dashboard's score-trend chart possible without any extra bookkeeping.

*(Full entity code and SQL already built in the backend skeleton — see `schema-reference.sql`.)*

---

## 5. Feature Modules

### 5.1 User Authentication
- Register (`full_name`, `email`, `password`) → password hashed with BCrypt.
- Login → returns a signed JWT (24h expiry) containing `userId` and `role`.
- `JwtAuthFilter` validates the token on every request except `/api/auth/**`.
- `GET /api/users/me` returns the logged-in user's profile.
- Passwords never returned in any response DTO.
- **Frontend routes:** `/login`, `/register`. Both are public routes rendered outside the `<ProtectedRoute>` wrapper; a successful login stores the JWT in an in-memory `AuthContext` and redirects to `/dashboard`.

### 5.2 Resume Upload
- Accepts PDF or DOCX, max 10MB (already configured in `application.yml`).
- File saved to disk (path stored in DB); swappable for S3 later behind a `StorageService` interface.
- Text extraction:
  - PDF → PDFBox `PDFTextStripper`.
  - DOCX → Apache POI `XWPFDocument` paragraph extraction.
- Extracted text is cleaned (collapse whitespace, strip control characters) before it's persisted or sent to Gemini.
- **Frontend route:** `/resumes/upload` — dropzone + upload progress, redirects to `/resumes/:resumeId` on success.

### 5.3 AI Analysis
Sends the extracted resume text to Gemini with a structured prompt requesting **JSON output only**, covering:
- Professional summary quality
- Technical skills detected
- Soft skills detected
- Missing keywords (generic, not JD-specific — that's job matching)
- Grammar/clarity score
- ATS compatibility score
- Overall score (0–100)

The response is parsed and stored as an `Analysis` row. Because scores are numeric and skills/suggestions are JSON arrays stored as text, the frontend can render both a summary card and a trend chart from the same table.
- **Frontend route:** `/resumes/:resumeId/analysis` — "Run Analysis" button, score breakdown cards, and skill chips rendered from the latest `Analysis` row for that resume.

### 5.4 Job Description Matching
- User pastes a JD into a textarea.
- Backend sends **both** resume text and JD text to Gemini in one prompt, asking it to return matched skills, missing skills, and a match percentage.
- Stored as a `JobMatch` row linked to the resume, so a user can match one resume against multiple job postings and compare results side by side.
- **Frontend route:** `/resumes/:resumeId/job-match` — JD textarea + submit, then a matched/missing skills view (✓/✗ chips) plus match % gauge. Past matches for that resume are listed below, each clickable to re-view its result.

### 5.5 AI Suggestions
- Derived as part of the analysis and job-match responses (not a separate AI call) — Gemini is asked to include a `suggestions` array in both JSON responses.
- Categorized suggestions: summary, quantification, missing skills, weak bullet points, formatting — matching the feature list.
- **Frontend route:** no dedicated route — suggestions render as a checklist section inline on both `/resumes/:resumeId/analysis` and `/resumes/:resumeId/job-match`, next to the results they came from.

### 5.6 Resume Improvement (Rewrite Generation)
- Separate endpoint: `POST /api/improvements/{resumeId}`.
- Prompts Gemini specifically for rewritten content: a tightened professional summary, action-verb bullet points for each experience entry, and a list of ATS-friendly keywords to insert.
- Stored as `ResumeImprovement`, versioned so a user can generate multiple rewrite passes and pick the one they like.
- **Frontend route:** `/resumes/:resumeId/improve` — side-by-side "original vs. improved" view per section, with a version selector across past improvement passes and a copy-to-clipboard button per block.

### 5.7 Dashboard
- `GET /api/dashboard/summary` — latest scores, resume count, average match %.
- `GET /api/dashboard/history?resumeId=` — full analysis history for the trend chart (Recharts line chart: `overall_score` over `created_at`).
- `GET /api/resumes` — list of all uploaded resumes with their latest score, for a table/list view.
- **Frontend routes:** `/dashboard` (summary cards + score-trend chart, "Upload New Resume" CTA) and `/resumes` (table of all resumes with latest score, links into each resume's detail routes above).

---

## 6. API Design (REST)

| Method | Endpoint | Auth | Purpose | Called from frontend route |
|---|---|---|---|---|
| POST | `/api/auth/register` | ✗ | Create account | `/register` |
| POST | `/api/auth/login` | ✗ | Get JWT | `/login` |
| GET | `/api/users/me` | ✓ | Current user profile | App shell (header/profile menu), all protected routes |
| POST | `/api/resumes/upload` | ✓ | Upload + extract text | `/resumes/upload` |
| GET | `/api/resumes` | ✓ | List user's resumes | `/resumes`, `/dashboard` |
| GET | `/api/resumes/{id}` | ✓ | Resume detail | `/resumes/:resumeId` |
| DELETE | `/api/resumes/{id}` | ✓ | Delete resume (cascades) | `/resumes` (row action) |
| POST | `/api/analysis/{resumeId}` | ✓ | Run AI analysis | `/resumes/:resumeId/analysis` |
| GET | `/api/analysis/{resumeId}/history` | ✓ | Score history for charts | `/resumes/:resumeId/analysis`, `/dashboard` |
| POST | `/api/job-match/{resumeId}` | ✓ | Compare against pasted JD | `/resumes/:resumeId/job-match` |
| GET | `/api/job-match/{resumeId}` | ✓ | List past matches | `/resumes/:resumeId/job-match` |
| POST | `/api/improvements/{resumeId}` | ✓ | Generate rewritten content | `/resumes/:resumeId/improve` |
| GET | `/api/dashboard/summary` | ✓ | Aggregate dashboard stats | `/dashboard` |

All authenticated endpoints expect `Authorization: Bearer <jwt>`.

---

## 6.1 Frontend Route Map

Full React Router table — every route, what it renders, whether it's protected, and which API calls it fires on load:

| Route | Page component | Protected? | Fires on load |
|---|---|---|---|
| `/login` | `LoginPage` | ✗ | `POST /api/auth/login` (on submit) |
| `/register` | `RegisterPage` | ✗ | `POST /api/auth/register` (on submit) |
| `/dashboard` | `DashboardPage` | ✓ | `GET /api/dashboard/summary`, `GET /api/resumes` |
| `/resumes` | `ResumeListPage` | ✓ | `GET /api/resumes` |
| `/resumes/upload` | `ResumeUploadPage` | ✓ | `POST /api/resumes/upload` (on submit) |
| `/resumes/:resumeId` | `ResumeDetailPage` | ✓ | `GET /api/resumes/{id}` |
| `/resumes/:resumeId/analysis` | `ResumeAnalysisPage` | ✓ | `GET /api/analysis/{resumeId}/history`, `POST /api/analysis/{resumeId}` (on button click) |
| `/resumes/:resumeId/job-match` | `JobMatchPage` | ✓ | `GET /api/job-match/{resumeId}`, `POST /api/job-match/{resumeId}` (on submit) |
| `/resumes/:resumeId/improve` | `ImprovementPage` | ✓ | `POST /api/improvements/{resumeId}` (on button click) |
| `*` (404) | `NotFoundPage` | ✗ | — |

**Route guarding:** a single `<ProtectedRoute>` wrapper checks `AuthContext` for a valid JWT and redirects to `/login` (preserving the intended destination) if missing/expired. `/resumes/:resumeId/*` routes additionally verify resume ownership server-side — a 403 from the API bounces the user back to `/resumes` with a toast, since route params alone can't be trusted to enforce access control.

**Navigation shell:** `ResumeDetailPage` renders a persistent sub-nav (Overview / Analysis / Job Match / Improve) so the three resume-scoped routes feel like tabs of one page rather than separate destinations — matches how users actually work through one resume at a time.

---

## 7. AI Integration Strategy

- **Single service, `GeminiService`**, wraps all calls — analysis, matching, and improvement each use a different prompt template but share the same request/response handling and retry logic.
- **Prompt discipline:** every prompt explicitly instructs Gemini to return *only* valid JSON matching a given schema, no markdown fences, no prose — this avoids brittle string parsing.
- **Response validation:** parsed JSON is validated against expected fields before persisting; if a field is missing, default/fallback values are used rather than failing the whole request.
- **Rate/cost control:** analysis is only triggered explicitly by the user (not on every upload), and results are cached as DB rows so the same analysis is never silently re-run.
- **Prompt versioning:** prompt templates live in one place (e.g. `PromptTemplates.java`) so they can be tuned without touching business logic.

---

## 8. Security

- Passwords hashed with BCrypt (never stored or logged in plaintext).
- JWT signed with a 256-bit+ secret (`app.jwt.secret`, env-injected — never committed).
- Stateless sessions — no server-side session storage, scales horizontally.
- File upload validation: content-type + extension check, size limit, virus-scan hook left as an extension point.
- CORS configured explicitly for the React dev/prod origins only.
- All resume/analysis endpoints scoped to `userId` from the JWT — no user can access another user's resume by guessing an ID (ownership check in the service layer, not just the repository query).

---

## 9. Project Structure

**Backend**
```
resume-analyzer-backend/
├── entity/          # JPA entities
├── repository/       # Spring Data repositories
├── dto/               # Request/response objects (never expose entities directly)
├── controller/        # REST endpoints
├── service/            # Business logic, GeminiService, StorageService, ParsingService
├── security/            # JWT filter, JWT util, UserDetailsService impl
├── config/                # SecurityConfig, WebClientConfig, CorsConfig
└── exception/              # GlobalExceptionHandler, custom exceptions
```

**Frontend**
```
resume-analyzer-frontend/
├── src/
│   ├── api/                 # Axios instance + endpoint wrappers
│   ├── components/            # Reusable UI (ScoreCard, SkillChip, UploadDropzone...)
│   ├── pages/                   # One file per route (see 6.1 Frontend Route Map)
│   │   ├── LoginPage.jsx           → /login
│   │   ├── RegisterPage.jsx        → /register
│   │   ├── DashboardPage.jsx       → /dashboard
│   │   ├── ResumeListPage.jsx      → /resumes
│   │   ├── ResumeUploadPage.jsx    → /resumes/upload
│   │   ├── ResumeDetailPage.jsx    → /resumes/:resumeId
│   │   ├── ResumeAnalysisPage.jsx  → /resumes/:resumeId/analysis
│   │   ├── JobMatchPage.jsx        → /resumes/:resumeId/job-match
│   │   ├── ImprovementPage.jsx     → /resumes/:resumeId/improve
│   │   └── NotFoundPage.jsx        → *
│   ├── routes/
│   │   ├── AppRouter.jsx      # React Router route table, wraps protected routes
│   │   └── ProtectedRoute.jsx # JWT check + redirect-to-login guard
│   ├── context/              # AuthContext (JWT storage, current user)
│   ├── hooks/                  # useAuth, useResumes, useAnalysis
│   └── charts/                   # Recharts wrappers for score trends
```

---

## 10. Development Roadmap

| Phase | Deliverable | Frontend route(s) touched | Status |
|---|---|---|---|
| 1 | DB schema + backend project skeleton | — (backend only) | ✅ Done |
| 2 | Auth: register/login, JWT filter, `SecurityConfig` | — (backend only, routes built in phase 8) | ⬜ Next |
| 3 | Resume upload + text extraction (PDFBox/POI) | — (backend only, route built in phase 9) | ⬜ |
| 4 | Gemini integration + `GeminiService` + analysis endpoint | — (backend only, route built in phase 9) | ⬜ |
| 5 | Job description matching | — (backend only, route built in phase 9) | ⬜ |
| 6 | Resume improvement / rewrite generation | — (backend only, route built in phase 9) | ⬜ |
| 7 | Dashboard endpoints (history, summary) | — (backend only, route built in phase 10) | ⬜ |
| 8 | React frontend: auth pages + `AppRouter`/`ProtectedRoute` | `/login`, `/register` | ⬜ |
| 9 | React frontend: upload, analysis, job match, improve views | `/resumes/upload`, `/resumes/:resumeId`, `/resumes/:resumeId/analysis`, `/resumes/:resumeId/job-match`, `/resumes/:resumeId/improve` | ⬜ |
| 10 | React frontend: dashboard + resume list + charts | `/dashboard`, `/resumes` | ⬜ |
| 11 | Polish: error handling, loading states, `NotFoundPage` | `*` (404), loading/error states across all routes | ⬜ |
| 12 | Deployment (backend + DB + frontend hosting) | all routes, verified against production API URL | ⬜ |

---

## 11. Non-Functional Considerations

- **Error handling:** a `GlobalExceptionHandler` returns consistent JSON error shapes (`{error, message, status}`) for validation errors, auth failures, and Gemini call failures.
- **Testing:** unit tests for `GeminiService` prompt building (mocked HTTP), repository tests with an in-memory/test MySQL instance, controller tests with `MockMvc` + mocked security context.
- **Resilience:** Gemini calls wrapped with timeout + one retry; a failed AI call returns a clear "analysis failed, try again" response rather than a 500.
- **Scalability path:** stateless JWT auth + externalized file storage (S3) means the backend can run as multiple instances behind a load balancer with no code changes.
- **Observability:** structured logging around AI calls (latency, token usage if available) to catch cost/performance issues early.

---

## 12. Deployment Plan (later phase)

- **Backend:** containerize with a simple `Dockerfile` (Maven build → JRE runtime image), deploy to Render/Railway/EC2.
- **Database:** managed MySQL (PlanetScale, RDS, or Railway MySQL).
- **Frontend:** static build deployed to Vercel/Netlify, pointing at the backend API URL via env var.
- **Secrets:** `JWT_SECRET`, `GEMINI_API_KEY`, `DB_PASSWORD` injected via the hosting platform's env var settings — never committed.

---

## 13. What Makes This Version Unique

- **Historical tracking, not a one-off score** — every analysis is a new row, enabling real progress charts.
- **Separation of generic analysis vs. job-specific matching** — two distinct AI calls with different purposes, so users get both a general resume health check and a targeted "does this fit this specific job" answer.
- **Rewrite generation as its own versioned artifact** — users can generate multiple improvement passes and compare them, rather than getting one AI answer overwritten each time.
- **Prompt-schema discipline** — every AI call is contracted to return strict JSON, making the system reliable enough to build real UI around instead of parsing free-text AI output.
