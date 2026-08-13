# Skill: React Frontend

Guidance for working in `frontend/` — resume upload, analysis dashboard, auth UI.

## Structure

```
src/
├── api/            # one module per backend resource (authApi.ts, resumeApi.ts) —
│                   #   all fetch/axios calls live here, nowhere else
├── components/     # reusable, presentational — no direct API calls
├── features/       # feature folders (upload, analysis-results, auth), each with
│                   #   its own components/hooks/types local to that feature
├── hooks/          # shared custom hooks (useAuth, useDebounce, ...)
├── context/         # AuthContext / global providers
├── types/           # shared TypeScript types — keep DTO shapes in sync with backend
└── utils/
```

## API layer

- All HTTP calls go through `src/api/` using a single configured client
  (axios instance or fetch wrapper) with the base URL from an env var
  (`VITE_API_BASE_URL` / `REACT_APP_API_BASE_URL`), never hardcoded.
- One interceptor handles: attaching the auth token to requests, and
  mapping the backend's `{ error, status }` error shape to something
  components can render — don't duplicate error-parsing in every component.
- Components/hooks call `api/*` functions, never `fetch`/`axios` directly.

## Auth token storage

- Prefer an httpOnly cookie set by the backend over `localStorage` for the
  token where the backend supports it — it isn't readable by JS and is
  safer against XSS. If `localStorage` is used instead (common for a
  simpler stateless-JWT setup), be deliberate about it and keep XSS
  hygiene tight (see below) since it's the trade-off being made.
- Never log tokens to the console or send them anywhere other than the
  `Authorization` header for API calls.

## Resume upload

- Validate file type/size client-side for fast feedback (e.g. PDF/DOCX,
  under N MB) but treat this as UX only — the backend re-validates
  regardless (see backend skill), so don't skip server errors handling
  just because client validation passed.
- Show upload progress and a distinct "analyzing..." state after upload
  completes — the AI analysis call can take several seconds; the UI must
  not look frozen or ambiguous between "uploading" and "waiting on AI".
- Handle the AI-failure path explicitly (timeout / provider error) with a
  retry option — don't let a failed analysis silently show a blank or
  stale results panel.

## State & data fetching

- Server state (resumes, analysis results, user profile) goes through a
  data-fetching layer with caching/loading/error states (React Query /
  TanStack Query if available in the project, otherwise a consistent
  `{ data, isLoading, error }` hook pattern) — avoid ad hoc `useEffect` +
  `useState` fetch logic duplicated per component.
- Local UI state (form inputs, modal open/closed) stays in component
  state — don't push it into global context unnecessarily.

## Rendering AI output

- Treat analysis results as data to render via defined fields (score,
  matched skills, missing skills, suggestions) — don't `dangerouslySetInnerHTML`
  raw AI text. If the AI returns freeform prose, render it as plain text.
- Handle partial/malformed results gracefully (e.g. missing field) —
  the AI response shape is not as guaranteed as a normal DB-backed API,
  so components consuming it should not assume every field is present.

## Do / Don't

- ✅ `resumeApi.uploadResume(file)` called from a hook/component
- ❌ `axios.post('http://localhost:8080/api/v1/resumes', ...)` inline in a component
- ✅ Distinct `uploading` / `analyzing` / `done` / `error` UI states
- ❌ A single `loading` boolean covering upload + AI analysis, hiding what's slow
- ✅ `<p>{analysis.suggestions}</p>`
- ❌ `<div dangerouslySetInnerHTML={{ __html: analysis.suggestions }} />`
