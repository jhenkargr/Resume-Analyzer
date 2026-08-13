# Skill: Spring Boot Backend

Guidance for working in `backend/` — the REST API, service layer, and AI-analysis
integration for the AI Resume Analyzer.

## Package structure

```
com.resumeanalyzer
├── config/           # Beans, CORS, AI-client config, async/executor config
├── controller/        # @RestController — thin, no business logic
├── dto/                # Request/response DTOs — never expose entities directly
├── entity/             # JPA entities (see mysql skill)
├── repository/         # Spring Data JPA interfaces
├── service/            # Business logic, orchestration
│   └── ai/             # AI provider client + prompt building + response parsing
├── exception/          # Custom exceptions + @ControllerAdvice handler
├── security/           # JWT filter, SecurityConfig (see spring-security skill)
└── util/               # Stateless helpers only
```

## Layering rules

- **Controllers** only: bind request → call one service method → map result to a
  response DTO. No business logic, no direct repository access, no direct AI calls.
- **Services** hold the logic and are the transaction boundary (`@Transactional` at
  the service method level, not on controllers or repositories).
- **Repositories** are Spring Data JPA interfaces only — no query logic in
  controllers/services beyond calling a repository method.
- Never return JPA entities from a controller — always map to a DTO
  (constructor mapping or MapStruct; keep it consistent across the codebase).

## AI analysis integration

The "analyze resume" flow is the core feature — treat it carefully:

- Isolate the AI provider call behind an interface, e.g. `ResumeAnalysisClient`,
  with one implementation per provider. Controllers/services depend on the
  interface, never on a concrete SDK class — this keeps the provider swappable
  and testable (mock the interface in unit tests).
- Set an explicit timeout on the AI HTTP client. A slow AI call must not hang
  the request thread indefinitely — configure a `RestClient`/`WebClient` timeout
  and propagate a clear error if it's exceeded.
- Run long-running analysis calls off the request thread where practical:
  either return `202 Accepted` + a poll/webhook endpoint for the result, or use
  a bounded `@Async` executor with a sane timeout — don't leave the caller's
  HTTP thread blocked on an external API for an unbounded time.
- Never log full resume text or full AI prompts/responses at INFO level —
  they may contain PII. Log at DEBUG with redaction, or log only metadata
  (request id, duration, status).
- Validate and sanitize the AI response before returning it to the frontend —
  don't trust the model to always return well-formed JSON; parse defensively
  and fall back to a clear error DTO on malformed output.
- Never interpolate raw resume/job-description text directly into a prompt
  string without a defined template — keep prompt construction in one place
  (`service/ai/`) so it's easy to review and version.

## API conventions

- Base path: `/api/v1/...`
- Use proper HTTP verbs/status codes: `201` on create, `204` on delete,
  `400` for validation errors, `401`/`403` for auth, `404` for missing
  resources, `422` or `502` for AI-provider failures (distinguish "your
  request was bad" from "the AI service failed").
- Validate request DTOs with `jakarta.validation` annotations
  (`@NotBlank`, `@Size`, `@Valid` on controller params) — don't hand-roll
  null checks in controllers.
- Centralize error handling in one `@RestControllerAdvice` that maps
  exceptions to the `{ "error": ..., "status": ... }` shape used by the frontend.

## Configuration

- All secrets (AI API key, DB credentials, JWT secret) via environment
  variables referenced in `application.yml` (`${AI_API_KEY}` etc.) — never
  hardcoded, never committed.
- Use Spring profiles (`application-dev.yml`, `application-prod.yml`) for
  environment-specific values (DB URL, log level, AI provider base URL).

## Do / Don't

- ✅ `service/ai/OpenAiResumeAnalysisClient implements ResumeAnalysisClient`
- ❌ Calling `OpenAiClient` directly from `ResumeController`
- ✅ Controller returns `ResumeAnalysisResponseDto`
- ❌ Controller returns the `ResumeAnalysis` JPA entity
- ✅ AI call wrapped with an explicit timeout + typed exception on failure
- ❌ Unbounded `restTemplate.postForObject(...)` call with no timeout
