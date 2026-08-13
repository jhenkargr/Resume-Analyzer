package com.resumeanalyzer.service;

import com.resumeanalyzer.entity.Analysis;
import com.resumeanalyzer.entity.JobMatch;
import com.resumeanalyzer.entity.Resume;
import com.resumeanalyzer.repository.AnalysisRepository;
import com.resumeanalyzer.repository.JobMatchRepository;
import com.resumeanalyzer.repository.ResumeRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DashboardService {

    private final ResumeRepository resumeRepository;
    private final AnalysisRepository analysisRepository;
    private final JobMatchRepository jobMatchRepository;

    public DashboardService(ResumeRepository resumeRepository,
                            AnalysisRepository analysisRepository,
                            JobMatchRepository jobMatchRepository) {
        this.resumeRepository = resumeRepository;
        this.analysisRepository = analysisRepository;
        this.jobMatchRepository = jobMatchRepository;
    }

    public Map<String, Object> getDashboardSummary(Long userId) {
        List<Resume> resumes = resumeRepository.findByUserIdOrderByUploadedAtDesc(userId);
        int totalResumes = resumes.size();

        List<Analysis> allAnalyses = new ArrayList<>();
        List<JobMatch> allJobMatches = new ArrayList<>();
        List<Map<String, Object>> resumeCards = new ArrayList<>();

        int scoreSum = 0;
        int scoreCount = 0;
        Integer latestOverallScore = null;

        for (Resume resume : resumes) {
            List<Analysis> analyses = analysisRepository.findByResumeIdOrderByCreatedAtDesc(resume.getId());
            List<JobMatch> matches = jobMatchRepository.findByResumeIdOrderByCreatedAtDesc(resume.getId());

            allAnalyses.addAll(analyses);
            allJobMatches.addAll(matches);

            Analysis latest = analyses.isEmpty() ? null : analyses.get(0);
            if (latest != null && latestOverallScore == null) {
                latestOverallScore = latest.getOverallScore();
            }

            if (latest != null && latest.getOverallScore() != null) {
                scoreSum += latest.getOverallScore();
                scoreCount++;
            }

            Map<String, Object> card = new HashMap<>();
            card.put("id", resume.getId());
            card.put("fileName", resume.getFileName());
            card.put("fileType", resume.getFileType());
            card.put("uploadedAt", resume.getUploadedAt());
            card.put("latestScore", latest != null ? latest.getOverallScore() : null);
            card.put("latestAtsScore", latest != null ? latest.getAtsScore() : null);
            card.put("analysisCount", analyses.size());
            card.put("jobMatchCount", matches.size());
            resumeCards.add(card);
        }

        double averageScore = scoreCount > 0 ? Math.round((double) scoreSum / scoreCount * 10.0) / 10.0 : 0.0;

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalResumes", totalResumes);
        summary.put("totalAnalyses", allAnalyses.size());
        summary.put("totalJobMatches", allJobMatches.size());
        summary.put("averageScore", averageScore);
        summary.put("latestScore", latestOverallScore != null ? latestOverallScore : 0);
        summary.put("resumes", resumeCards);

        return summary;
    }

    public List<Map<String, Object>> getScoreHistory(Long userId, Long resumeId) {
        List<Resume> resumes;
        if (resumeId != null) {
            Resume resume = resumeRepository.findById(resumeId)
                    .filter(r -> r.getUser().getId().equals(userId))
                    .orElse(null);
            resumes = resume != null ? List.of(resume) : List.of();
        } else {
            resumes = resumeRepository.findByUserIdOrderByUploadedAtDesc(userId);
        }

        List<Map<String, Object>> history = new ArrayList<>();
        for (Resume resume : resumes) {
            List<Analysis> analyses = analysisRepository.findByResumeIdOrderByCreatedAtDesc(resume.getId());
            // Sort ascending for timeline display
            List<Analysis> sorted = new ArrayList<>(analyses);
            Collections.reverse(sorted);

            for (Analysis a : sorted) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", a.getId());
                item.put("resumeId", resume.getId());
                item.put("resumeName", resume.getFileName());
                item.put("overallScore", a.getOverallScore());
                item.put("atsScore", a.getAtsScore());
                item.put("grammarScore", a.getGrammarScore());
                item.put("clarityScore", a.getClarityScore());
                item.put("createdAt", a.getCreatedAt());
                history.add(item);
            }
        }

        return history;
    }
}
