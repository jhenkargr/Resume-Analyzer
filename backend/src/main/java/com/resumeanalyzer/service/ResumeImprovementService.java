package com.resumeanalyzer.service;

import com.resumeanalyzer.entity.Resume;
import com.resumeanalyzer.entity.ResumeImprovement;
import com.resumeanalyzer.repository.ResumeImprovementRepository;
import com.resumeanalyzer.repository.ResumeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ResumeImprovementService {

    private final ResumeRepository resumeRepository;
    private final ResumeImprovementRepository improvementRepository;
    private final AiService aiService;

    public ResumeImprovementService(ResumeRepository resumeRepository,
                                    ResumeImprovementRepository improvementRepository,
                                    AiService aiService) {
        this.resumeRepository = resumeRepository;
        this.improvementRepository = improvementRepository;
        this.aiService = aiService;
    }

    public ResumeImprovement improve(Long resumeId) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new IllegalArgumentException("Resume not found"));
        String text = resume.getExtractedText() == null ? "" : resume.getExtractedText();

        AiService.ImproveResult res = aiService.improveResume(text);

        ResumeImprovement ri = ResumeImprovement.builder()
                .resume(resume)
                .improvedSummary(res.improvedSummary)
                .improvedExperience(res.improvedExperienceJson)
                .suggestedKeywords(res.suggestedKeywords)
                .build();

        return improvementRepository.save(ri);
    }

    public List<ResumeImprovement> getImprovementsForResume(Long resumeId) {
        return improvementRepository.findByResumeIdOrderByCreatedAtDesc(resumeId);
    }
}
