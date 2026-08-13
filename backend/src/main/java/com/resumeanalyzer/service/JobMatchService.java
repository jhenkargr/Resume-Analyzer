package com.resumeanalyzer.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeanalyzer.entity.JobMatch;
import com.resumeanalyzer.entity.Resume;
import com.resumeanalyzer.repository.JobMatchRepository;
import com.resumeanalyzer.repository.ResumeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class JobMatchService {

    private final ResumeRepository resumeRepository;
    private final JobMatchRepository jobMatchRepository;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public JobMatchService(ResumeRepository resumeRepository,
                           JobMatchRepository jobMatchRepository,
                           AiService aiService) {
        this.resumeRepository = resumeRepository;
        this.jobMatchRepository = jobMatchRepository;
        this.aiService = aiService;
        this.objectMapper = new ObjectMapper();
    }

    public JobMatch matchJob(Long resumeId, String jobDescription) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new IllegalArgumentException("Resume not found"));
        String resumeText = resume.getExtractedText() == null ? "" : resume.getExtractedText();

        AiService.MatchResult result = aiService.matchJob(resumeText, jobDescription == null ? "" : jobDescription);

        String matchedJson;
        String missingJson;
        try {
            matchedJson = objectMapper.writeValueAsString(result.matchedSkills);
            missingJson = objectMapper.writeValueAsString(result.missingSkills);
        } catch (Exception e) {
            matchedJson = String.join(",", result.matchedSkills);
            missingJson = String.join(",", result.missingSkills);
        }

        JobMatch jm = JobMatch.builder()
                .resume(resume)
                .jobDescription(jobDescription != null ? jobDescription : "")
                .matchScore(result.score)
                .matchedSkills(matchedJson)
                .missingSkills(missingJson)
                .suggestions(result.suggestions)
                .build();

        return jobMatchRepository.save(jm);
    }

    public List<JobMatch> getJobMatchesForResume(Long resumeId) {
        return jobMatchRepository.findByResumeIdOrderByCreatedAtDesc(resumeId);
    }
}
