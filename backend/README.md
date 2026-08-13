# AI Resume Analyzer — Backend

Spring Boot backend skeleton: entity model + database schema, ready for auth,
resume upload, and AI analysis to be layered on top.

## What's in this step

```
src/main/java/com/resumeanalyzer/
├── ResumeAnalyzerApplication.java   # main class
├── entity/
│   ├── User.java
│   ├── Resume.java
│   ├── Analysis.java                # AI analysis results (per resume, per run)
│   ├── JobMatch.java                # job-description match results
│   └── ResumeImprovement.java       # AI-rewritten summary/bullets
├── repository/                      # Spring Data JPA repositories for each entity
├── config/                          # (empty — SecurityConfig goes here next)
├── controller/                      # (empty — REST controllers go here next)
├── service/                         # (empty — business logic goes here next)
├── dto/                             # (empty — request/response DTOs go here next)
├── security/                        # (empty — JWT filter/util go here next)
└── exception/                       # (empty — global exception handler goes here next)

src/main/resources/
├── application.yml                  # DB, JWT, upload, Gemini config
└── schema-reference.sql             # documents the schema (Hibernate auto-creates it)
```

## Entity relationships

```
User (1) ──< Resume (many)
Resume (1) ──< Analysis (many)          -- multiple analysis runs = score history for charts
Resume (1) ──< JobMatch (many)
Resume (1) ──< ResumeImprovement (many)
```

One user can upload many resumes. Each resume can be analyzed multiple times
(so the dashboard can chart score trends over time), matched against multiple
job descriptions, and improved multiple times.

## Before you run it

1. **Install prerequisites**: JDK 17+, Maven 3.9+, MySQL 8+.
2. **Create a `.env` or export these environment variables** (or just edit
   `application.yml` directly for local dev). The app now loads `.env` automatically
   from the backend folder when present:
   ```
   DB_USERNAME=root
   DB_PASSWORD=your_mysql_password
   JWT_SECRET=some-long-random-string-at-least-32-chars
   GEMINI_API_KEY=your_gemini_api_key
   ```
3. MySQL just needs to be running — `createDatabaseIfNotExist=true` in the
   JDBC URL means the `resume_analyzer` database is created automatically,
   and `ddl-auto: update` means Hibernate creates the tables from the
   entities on first run. `schema-reference.sql` is there if you'd rather
   run it manually or hand it to Flyway/Liquibase later.

## Run it

```bash
mvn spring-boot:run
```

It'll start on `http://localhost:8080`. There are no endpoints yet — that's
next.

## Next steps (in order)

1. **Auth** — `SecurityConfig`, JWT filter/util, `AuthController`
   (register/login), password hashing with BCrypt.
2. **Resume upload** — `ResumeController`, file storage service, PDFBox/POI
   text extraction.
3. **AI analysis** — `GeminiService` wrapping the Gemini API, prompt
   templates, `AnalysisController`.
4. **Job matching** — compare resume text against a pasted job description.
5. **Dashboard endpoints** — score history, aggregated stats for charts.
6. **React frontend**.

Say the word and we'll build auth next.
