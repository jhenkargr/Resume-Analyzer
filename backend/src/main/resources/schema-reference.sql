-- Reference schema for AI Resume Analyzer
-- NOTE: Hibernate (ddl-auto: update) will actually create these tables from the
-- JPA entities on first run. This file is kept as documentation / for manual
-- setup or migration tools (Flyway/Liquibase) later.

CREATE DATABASE IF NOT EXISTS resume_analyzer;
USE resume_analyzer;

-- ========================================
-- USERS
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(150)        NOT NULL,
    email           VARCHAR(150)        NOT NULL UNIQUE,
    password_hash   VARCHAR(255)        NOT NULL,
    role            VARCHAR(20)         NOT NULL DEFAULT 'USER',
    created_at      TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========================================
-- RESUMES  (one user -> many uploaded resumes)
-- ========================================
CREATE TABLE IF NOT EXISTS resumes (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT              NOT NULL,
    file_name       VARCHAR(255)        NOT NULL,
    file_type       VARCHAR(10)         NOT NULL,          -- PDF / DOCX
    file_path       VARCHAR(500)        NOT NULL,          -- storage location on disk/S3
    extracted_text  LONGTEXT,                              -- parsed raw text
    uploaded_at     TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resumes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- ANALYSES  (one resume -> many AI analysis runs, so score history/trends work)
-- ========================================
CREATE TABLE IF NOT EXISTS analyses (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    resume_id           BIGINT          NOT NULL,
    summary             TEXT,
    technical_skills    TEXT,           -- JSON array stored as text
    soft_skills         TEXT,           -- JSON array stored as text
    missing_keywords    TEXT,           -- JSON array stored as text
    grammar_score       INT,
    clarity_score       INT,
    ats_score           INT,
    overall_score       INT,
    suggestions         TEXT,           -- JSON array stored as text
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_analyses_resume FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

-- ========================================
-- JOB_MATCHES  (resume compared against a pasted job description)
-- ========================================
CREATE TABLE IF NOT EXISTS job_matches (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    resume_id           BIGINT          NOT NULL,
    job_description     LONGTEXT        NOT NULL,
    match_score         INT,
    matched_skills       TEXT,          -- JSON array stored as text
    missing_skills       TEXT,          -- JSON array stored as text
    suggestions          TEXT,          -- JSON array stored as text
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_jobmatches_resume FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

-- ========================================
-- RESUME_IMPROVEMENTS (AI-generated rewritten content, feature 6)
-- ========================================
CREATE TABLE IF NOT EXISTS resume_improvements (
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    resume_id               BIGINT      NOT NULL,
    improved_summary        TEXT,
    improved_experience     LONGTEXT,   -- JSON array of {original, improved}
    suggested_keywords      TEXT,       -- JSON array stored as text
    created_at              TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_improvements_resume FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
);

-- Indexes for common dashboard queries
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_analyses_resume_id ON analyses(resume_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);
CREATE INDEX idx_jobmatches_resume_id ON job_matches(resume_id);
