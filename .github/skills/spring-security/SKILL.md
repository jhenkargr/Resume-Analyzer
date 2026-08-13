# Skill: Spring Security

Guidance for authentication/authorization in the AI Resume Analyzer backend.

## Model

- Stateless JWT auth: user logs in via `/api/v1/auth/login` → gets an access
  token (short-lived) and, if implemented, a refresh token (longer-lived,
  stored server-side or as an httpOnly cookie — never in `localStorage`
  from the frontend's perspective, see react-frontend skill).
- No server-side session (`SessionCreationPolicy.STATELESS`).
- Roles kept simple unless the product needs more: `ROLE_USER`,
  `ROLE_ADMIN`. Add roles deliberately, not speculatively.

## Structure

```
security/
├── SecurityConfig.java       # SecurityFilterChain bean, endpoint matchers
├── JwtAuthFilter.java         # OncePerRequestFilter — validates token, sets auth context
├── JwtService.java            # token generation/parsing/validation
├── UserDetailsServiceImpl.java
└── AuthenticationEntryPointImpl.java  # 401 JSON response, not the default HTML error page
```

## Rules

- Password hashing: `BCryptPasswordEncoder` only — never store or compare
  plaintext passwords, never roll a custom hashing scheme.
- Every non-auth, non-public endpoint requires authentication by default —
  whitelist public paths explicitly (`/api/v1/auth/**`, actuator health)
  rather than trying to blacklist protected ones.
- Ownership checks matter as much as authentication: a logged-in user must
  only be able to read/update/delete **their own** resumes and analyses.
  Enforce this in the service layer (e.g. filter by
  `resume.getUser().getId().equals(currentUserId)`), not just by requiring
  "any authenticated user" at the security-filter level.
- CORS: configure allowed origins explicitly for the frontend's dev and prod
  URLs — never `allowedOrigins("*")` combined with `allowCredentials(true)`.
- CSRF: disabled is fine for a pure stateless JWT API (no cookie-based
  session), but document that decision in `SecurityConfig` with a comment
  so it isn't "just defaulted off" without anyone noticing.
- JWT secret comes from an environment variable, minimum recommended length
  for the signing algorithm in use (e.g. 256-bit for HS256) — never a short
  hardcoded string.
- Set a sensible token expiry (e.g. 15–60 min access token) — don't issue
  long-lived access tokens as a shortcut to avoid building refresh logic.
- Return `401` for "not authenticated" and `403` for "authenticated but
  not allowed" — don't collapse both into one status, the frontend
  branches on this distinction (e.g. redirect to login vs. show "not
  allowed" message).
- Custom `AuthenticationEntryPoint`/`AccessDeniedHandler` so failures return
  the project's standard JSON error shape, not Spring's default HTML page.

## Do / Don't

- ✅ `.requestMatchers("/api/v1/auth/**").permitAll().anyRequest().authenticated()`
- ❌ `.anyRequest().permitAll()` left in "temporarily" during development
- ✅ Service method checks `resume.getUser().getId().equals(principal.getId())`
- ❌ Any authenticated user can fetch `/api/v1/resumes/{id}` for any id
- ✅ JWT secret from `${JWT_SECRET}` env var
- ❌ `private static final String SECRET = "mysecretkey";`
