# Skill: MySQL

Guidance for the data model and persistence layer.

## Core tables (adjust as the schema evolves)

- `users` — id, email (unique), password_hash, role, created_at
- `resumes` — id, user_id (FK), original_filename, storage_path/blob_ref,
  uploaded_at
- `job_descriptions` — id, user_id (FK, nullable if resume-only analysis is
  supported), raw_text, created_at
- `analyses` — id, resume_id (FK), job_description_id (FK, nullable), score,
  result_json (or normalized fields), ai_provider, created_at

Keep the AI's structured output (matched skills, missing skills, suggestions)
either as normalized child tables if you'll query/filter on them, or as a
single `result_json` column if it's read-only display data — don't design
tables for fields nothing ever queries by.

## Migrations

- Use a migration tool (Flyway or Liquibase) — never rely on
  `spring.jpa.hibernate.ddl-auto=update` in any environment beyond a local
  throwaway dev DB. Every schema change is a versioned migration file
  checked into the repo (`src/main/resources/db/migration/V{n}__description.sql`
  for Flyway).
- Migrations are additive/forward-only in shared environments — don't edit
  a migration that's already been applied anywhere but local; write a new one.

## Entity conventions

- Every FK relationship (`resumes.user_id`, `analyses.resume_id`, etc.) is
  declared in the DB schema, not just implied by the Java entity mapping —
  the migration must include the `FOREIGN KEY` constraint.
- Use `ON DELETE CASCADE` deliberately and document it (e.g. deleting a
  user's account should cascade to their resumes/analyses) — don't leave
  orphaned rows as the default behavior without deciding on it.
- Index columns used in `WHERE`/`JOIN` beyond the primary key — at minimum:
  `resumes.user_id`, `analyses.resume_id`, `users.email` (usually already
  indexed via the unique constraint).
- Store timestamps in UTC; let the app/DB handle timezone conversion for
  display, don't store local time.

## Queries

- Prefer Spring Data JPA derived queries or `@Query` with named parameters
  over string-concatenated JPQL/SQL — never concatenate user input into a
  query string (SQL injection risk applies even with JPA if you're building
  native queries by hand).
- Any query filtering "the current user's data" must include the user id
  in the `WHERE` clause at the query level — don't fetch all rows and
  filter in Java, both for performance and because it's easy to forget the
  filter on a new endpoint if it's not baked into the repository method
  (e.g. `findByIdAndUserId(id, userId)` rather than `findById(id)` +
  manual check, wherever practical).
- Paginate list endpoints (`Pageable`) once a table can grow unbounded per
  user (analysis history) — don't return the full history in one response.

## Do / Don't

- ✅ `flyway/V3__add_analyses_table.sql` with explicit FK + index
- ❌ `ddl-auto: update` relied on in staging/production
- ✅ `resumeRepository.findByIdAndUserId(resumeId, userId)`
- ❌ `resumeRepository.findById(resumeId)` then trusting the caller passed
  their own id
