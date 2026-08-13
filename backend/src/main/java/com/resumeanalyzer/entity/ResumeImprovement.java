package com.resumeanalyzer.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "resume_improvements")
public class ResumeImprovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @Lob
    @Column(name = "improved_summary", columnDefinition = "TEXT")
    private String improvedSummary;

    // JSON array of {original, improved} pairs
    @Lob
    @Column(name = "improved_experience", columnDefinition = "LONGTEXT")
    private String improvedExperience;

    @Lob
    @Column(name = "suggested_keywords", columnDefinition = "TEXT")
    private String suggestedKeywords;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public ResumeImprovement() {
    }

    public ResumeImprovement(Long id, Resume resume, String improvedSummary, String improvedExperience,
                             String suggestedKeywords, LocalDateTime createdAt) {
        this.id = id;
        this.resume = resume;
        this.improvedSummary = improvedSummary;
        this.improvedExperience = improvedExperience;
        this.suggestedKeywords = suggestedKeywords;
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
        private String improvedSummary;
        private String improvedExperience;
        private String suggestedKeywords;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder resume(Resume resume) { this.resume = resume; return this; }
        public Builder improvedSummary(String improvedSummary) { this.improvedSummary = improvedSummary; return this; }
        public Builder improvedExperience(String improvedExperience) { this.improvedExperience = improvedExperience; return this; }
        public Builder suggestedKeywords(String suggestedKeywords) { this.suggestedKeywords = suggestedKeywords; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public ResumeImprovement build() {
            return new ResumeImprovement(id, resume, improvedSummary, improvedExperience, suggestedKeywords, createdAt);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Resume getResume() { return resume; }
    public void setResume(Resume resume) { this.resume = resume; }

    public String getImprovedSummary() { return improvedSummary; }
    public void setImprovedSummary(String improvedSummary) { this.improvedSummary = improvedSummary; }

    public String getImprovedExperience() { return improvedExperience; }
    public void setImprovedExperience(String improvedExperience) { this.improvedExperience = improvedExperience; }

    public String getSuggestedKeywords() { return suggestedKeywords; }
    public void setSuggestedKeywords(String suggestedKeywords) { this.suggestedKeywords = suggestedKeywords; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
