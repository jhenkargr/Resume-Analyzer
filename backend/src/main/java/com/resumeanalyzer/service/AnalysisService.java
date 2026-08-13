package com.resumeanalyzer.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeanalyzer.entity.Analysis;
import com.resumeanalyzer.entity.Resume;
import com.resumeanalyzer.repository.AnalysisRepository;
import com.resumeanalyzer.repository.ResumeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class AnalysisService {

    private final ResumeRepository resumeRepository;
    private final AnalysisRepository analysisRepository;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public AnalysisService(ResumeRepository resumeRepository,
                           AnalysisRepository analysisRepository,
                           AiService aiService) {
        this.resumeRepository = resumeRepository;
        this.analysisRepository = analysisRepository;
        this.aiService = aiService;
        this.objectMapper = new ObjectMapper();
    }

    public Analysis analyzeResume(Long resumeId) {
        Resume resume = resumeRepository.findById(resumeId)
            .orElseThrow(() -> new IllegalArgumentException("Resume not found"));

        String text = resume.getExtractedText() == null ? "" : resume.getExtractedText();

        AiService.AnalysisResult result = aiService.analyzeResume(text);

        String techJson;
        String softJson;
        String missingJson;
        try {
            techJson = objectMapper.writeValueAsString(result.technicalSkills);
            softJson = objectMapper.writeValueAsString(result.softSkills);
            missingJson = objectMapper.writeValueAsString(result.missingKeywords);
        } catch (Exception e) {
            techJson = String.join(",", result.technicalSkills);
            softJson = String.join(",", result.softSkills);
            missingJson = "[]";
        }

        Analysis analysis = Analysis.builder()
            .resume(resume)
            .summary(result.summary)
            .technicalSkills(techJson)
            .softSkills(softJson)
            .missingKeywords(missingJson)
            .grammarScore(result.grammarScore)
            .clarityScore(result.clarityScore)
            .atsScore(result.atsScore)
            .overallScore(result.overallScore)
            .suggestions(result.suggestions)
            .build();

        return analysisRepository.save(analysis);
    }

    public List<Analysis> getAnalysesForResume(Long resumeId) {
        return analysisRepository.findByResumeIdOrderByCreatedAtDesc(resumeId);
    }
}
