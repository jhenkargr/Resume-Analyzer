package com.resumeanalyzer.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "analyses")
public class Analysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String summary;

    @Lob
    @Column(name = "technical_skills", columnDefinition = "TEXT")
    private String technicalSkills;

    @Lob
    @Column(name = "soft_skills", columnDefinition = "TEXT")
    private String softSkills;

    @Lob
    @Column(name = "missing_keywords", columnDefinition = "TEXT")
    private String missingKeywords;

    @Column(name = "grammar_score")
    private Integer grammarScore;

    @Column(name = "clarity_score")
    private Integer clarityScore;

    @Column(name = "ats_score")
    private Integer atsScore;

    @Column(name = "overall_score")
    private Integer overallScore;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String suggestions;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Analysis() {
    }

    public Analysis(Long id, Resume resume, String summary, String technicalSkills, String softSkills,
                    String missingKeywords, Integer grammarScore, Integer clarityScore, Integer atsScore,
                    Integer overallScore, String suggestions, LocalDateTime createdAt) {
        this.id = id;
        this.resume = resume;
        this.summary = summary;
        this.technicalSkills = technicalSkills;
        this.softSkills = softSkills;
        this.missingKeywords = missingKeywords;
        this.grammarScore = grammarScore;
        this.clarityScore = clarityScore;
        this.atsScore = atsScore;
        this.overallScore = overallScore;
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
        private String summary;
        private String technicalSkills;
        private String softSkills;
        private String missingKeywords;
        private Integer grammarScore;
        private Integer clarityScore;
        private Integer atsScore;
        private Integer overallScore;
        private String suggestions;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder resume(Resume resume) { this.resume = resume; return this; }
        public Builder summary(String summary) { this.summary = summary; return this; }
        public Builder technicalSkills(String technicalSkills) { this.technicalSkills = technicalSkills; return this; }
        public Builder softSkills(String softSkills) { this.softSkills = softSkills; return this; }
        public Builder missingKeywords(String missingKeywords) { this.missingKeywords = missingKeywords; return this; }
        public Builder grammarScore(Integer grammarScore) { this.grammarScore = grammarScore; return this; }
        public Builder clarityScore(Integer clarityScore) { this.clarityScore = clarityScore; return this; }
        public Builder atsScore(Integer atsScore) { this.atsScore = atsScore; return this; }
        public Builder overallScore(Integer overallScore) { this.overallScore = overallScore; return this; }
        public Builder suggestions(String suggestions) { this.suggestions = suggestions; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Analysis build() {
            return new Analysis(id, resume, summary, technicalSkills, softSkills, missingKeywords,
                    grammarScore, clarityScore, atsScore, overallScore, suggestions, createdAt);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Resume getResume() { return resume; }
    public void setResume(Resume resume) { this.resume = resume; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getTechnicalSkills() { return technicalSkills; }
    public void setTechnicalSkills(String technicalSkills) { this.technicalSkills = technicalSkills; }

    public String getSoftSkills() { return softSkills; }
    public void setSoftSkills(String softSkills) { this.softSkills = softSkills; }

    public String getMissingKeywords() { return missingKeywords; }
    public void setMissingKeywords(String missingKeywords) { this.missingKeywords = missingKeywords; }

    public Integer getGrammarScore() { return grammarScore; }
    public void setGrammarScore(Integer grammarScore) { this.grammarScore = grammarScore; }

    public Integer getClarityScore() { return clarityScore; }
    public void setClarityScore(Integer clarityScore) { this.clarityScore = clarityScore; }

    public Integer getAtsScore() { return atsScore; }
    public void setAtsScore(Integer atsScore) { this.atsScore = atsScore; }

    public Integer getOverallScore() { return overallScore; }
    public void setOverallScore(Integer overallScore) { this.overallScore = overallScore; }

    public String getSuggestions() { return suggestions; }
    public void setSuggestions(String suggestions) { this.suggestions = suggestions; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
