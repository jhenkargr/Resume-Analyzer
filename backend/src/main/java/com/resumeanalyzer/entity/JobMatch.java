package com.resumeanalyzer.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_matches")
public class JobMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @Lob
    @Column(name = "job_description", columnDefinition = "LONGTEXT", nullable = false)
    private String jobDescription;

    @Column(name = "match_score")
    private Integer matchScore;

    @Lob
    @Column(name = "matched_skills", columnDefinition = "TEXT")
    private String matchedSkills;

    @Lob
    @Column(name = "missing_skills", columnDefinition = "TEXT")
    private String missingSkills;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String suggestions;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public JobMatch() {
    }

    public JobMatch(Long id, Resume resume, String jobDescription, Integer matchScore, String matchedSkills,
                    String missingSkills, String suggestions, LocalDateTime createdAt) {
        this.id = id;
        this.resume = resume;
        this.jobDescription = jobDescription;
        this.matchScore = matchScore;
        this.matchedSkills = matchedSkills;
        this.missingSkills = missingSkills;
        this.suggestions = suggestions;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private Resume resume;
        private String jobDescription;
        private Integer matchScore;
        private String matchedSkills;
        private String missingSkills;
        private String suggestions;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder resume(Resume resume) { this.resume = resume; return this; }
        public Builder jobDescription(String jobDescription) { this.jobDescription = jobDescription; return this; }
        public Builder matchScore(Integer matchScore) { this.matchScore = matchScore; return this; }
        public Builder matchedSkills(String matchedSkills) { this.matchedSkills = matchedSkills; return this; }
        public Builder missingSkills(String missingSkills) { this.missingSkills = missingSkills; return this; }
        public Builder suggestions(String suggestions) { this.suggestions = suggestions; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public JobMatch build() {
            return new JobMatch(id, resume, jobDescription, matchScore, matchedSkills, missingSkills, suggestions, createdAt);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Resume getResume() { return resume; }
    public void setResume(Resume resume) { this.resume = resume; }

    public String getJobDescription() { return jobDescription; }
    public void setJobDescription(String jobDescription) { this.jobDescription = jobDescription; }

    public Integer getMatchScore() { return matchScore; }
    public void setMatchScore(Integer matchScore) { this.matchScore = matchScore; }

    public String getMatchedSkills() { return matchedSkills; }
    public void setMatchedSkills(String matchedSkills) { this.matchedSkills = matchedSkills; }

    public String getMissingSkills() { return missingSkills; }
    public void setMissingSkills(String missingSkills) { this.missingSkills = missingSkills; }

    public String getSuggestions() { return suggestions; }
    public void setSuggestions(String suggestions) { this.suggestions = suggestions; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
