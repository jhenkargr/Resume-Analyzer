# Skill: Testing

Guidance for tests across backend and frontend.

## Backend (JUnit 5 + Mockito)

```
src/test/java/com/resumeanalyzer/
├── service/       # unit tests — mock repositories/AI client, test logic
├── controller/    # @WebMvcTest — mock the service layer, test request/response
│                  #   mapping, validation, status codes
├── security/      # auth filter/config tests — protected vs public endpoints
└── integration/   # @SpringBootTest (+ Testcontainers MySQL) for real end-to-end flows
```

- **Unit tests** (service layer): mock `ResumeAnalysisClient` and repositories
  with Mockito — never call a real AI provider or real DB in a unit test.
  Cover: happy path, AI-provider-failure path, AI-timeout path, and
  ownership-check failures (user A can't access user B's resume).
- **Controller tests** (`@WebMvcTest`): verify request validation (400 on bad
  input), auth requirements (401/403 as appropriate), and response DTO shape
  — mock the service layer, don't wire real business logic here.
- **Integration tests**: use Testcontainers for a real MySQL instance rather
  than H2 — H2's SQL dialect differences can hide real bugs. Mock the AI
  provider at the HTTP boundary (e.g. WireMock) so integration tests stay
  fast and deterministic — never call the real AI API in CI.
- Name tests by behavior, not implementation:
  `shouldReturn403WhenUserRequestsAnotherUsersResume()`, not `test3()`.
- Every new `@RestController` endpoint gets at least: one success case, one
  validation-failure case, one auth-failure case.

## Frontend (Jest + React Testing Library)

```
src/
├── components/__tests__/
├── features/{feature}/__tests__/
└── api/__tests__/            # mock the HTTP layer (msw preferred over jest.mock per-call)
```

- Test behavior from the user's perspective (render, interact via
  `userEvent`, assert on visible output) — avoid asserting on internal
  component state or implementation details.
- Mock network calls at the boundary (MSW handlers if available, otherwise
  mock the `api/*` module) rather than mocking `axios`/`fetch` deep inside
  a component.
- Cover the resume-upload flow's distinct states explicitly: uploading,
  analyzing, success (renders results), and error (AI failure / network
  failure) — this flow has more failure modes than a typical CRUD form,
  so don't just test the happy path.
- Don't snapshot-test everything by default — snapshots are cheap to write
  but expensive to review meaningfully; prefer targeted assertions on the
  output that actually matters.

## General

- A PR that adds a new endpoint, a new auth rule, or a new AI-response
  field is expected to include a corresponding test — treat "no test" as
  a flag to ask why, not the default.
- Don't test framework/library behavior itself (e.g. that Spring Data
  saves an entity, or that `useState` updates) — test the project's own
  logic and edge cases.
- Keep tests independent and order-agnostic — no test should depend on
  another test having run first (especially with a shared Testcontainers DB;
  clean/reset state between tests).
