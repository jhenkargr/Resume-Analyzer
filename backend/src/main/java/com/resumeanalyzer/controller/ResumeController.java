package com.resumeanalyzer.controller;

import com.resumeanalyzer.entity.Analysis;
import com.resumeanalyzer.entity.JobMatch;
import com.resumeanalyzer.entity.Resume;
import com.resumeanalyzer.entity.ResumeImprovement;
import com.resumeanalyzer.entity.User;
import com.resumeanalyzer.repository.AnalysisRepository;
import com.resumeanalyzer.repository.JobMatchRepository;
import com.resumeanalyzer.repository.ResumeImprovementRepository;
import com.resumeanalyzer.repository.ResumeRepository;
import com.resumeanalyzer.service.ResumeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    private final ResumeService resumeService;
    private final ResumeRepository resumeRepository;
    private final AnalysisRepository analysisRepository;
    private final JobMatchRepository jobMatchRepository;
    private final ResumeImprovementRepository improvementRepository;

    public ResumeController(ResumeService resumeService,
                            ResumeRepository resumeRepository,
                            AnalysisRepository analysisRepository,
                            JobMatchRepository jobMatchRepository,
                            ResumeImprovementRepository improvementRepository) {
        this.resumeService = resumeService;
        this.resumeRepository = resumeRepository;
        this.analysisRepository = analysisRepository;
        this.jobMatchRepository = jobMatchRepository;
        this.improvementRepository = improvementRepository;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadResume(Authentication authentication,
                                          @RequestParam("file") MultipartFile file) {
        try {
            User user = getUser(authentication);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
            }

            Resume resume = resumeService.uploadResume(user.getId(), file);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Resume uploaded successfully",
                "resume", Map.of(
                    "id", resume.getId(),
                    "fileName", resume.getFileName(),
                    "fileType", resume.getFileType(),
                    "extractedText", resume.getExtractedText() != null ? resume.getExtractedText() : ""
                )
            ));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Unable to process file: " + e.getMessage()));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", exception.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> listResumes(Authentication authentication) {
        User user = getUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));

        List<Resume> resumes = resumeRepository.findByUserIdOrderByUploadedAtDesc(user.getId());
        List<Map<String, Object>> list = new ArrayList<>();

        for (Resume r : resumes) {
            List<Analysis> analyses = analysisRepository.findByResumeIdOrderByCreatedAtDesc(r.getId());
            List<JobMatch> matches = jobMatchRepository.findByResumeIdOrderByCreatedAtDesc(r.getId());
            List<ResumeImprovement> improvements = improvementRepository.findByResumeIdOrderByCreatedAtDesc(r.getId());

            Analysis latest = analyses.isEmpty() ? null : analyses.get(0);

            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("fileName", r.getFileName());
            map.put("fileType", r.getFileType());
            map.put("uploadedAt", r.getUploadedAt());
            map.put("extractedText", r.getExtractedText());
            map.put("latestScore", latest != null ? latest.getOverallScore() : null);
            map.put("latestAtsScore", latest != null ? latest.getAtsScore() : null);
            map.put("analysesCount", analyses.size());
            map.put("jobMatchesCount", matches.size());
            map.put("improvementsCount", improvements.size());
            list.add(map);
        }

        return ResponseEntity.ok(Map.of("resumes", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getResumeDetail(Authentication authentication, @PathVariable("id") Long id) {
        User user = getUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));

        Resume resume = resumeRepository.findById(id)
                .filter(r -> r.getUser().getId().equals(user.getId()))
                .orElse(null);

        if (resume == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Resume not found"));
        }

        List<Analysis> analyses = analysisRepository.findByResumeIdOrderByCreatedAtDesc(resume.getId());
        List<JobMatch> matches = jobMatchRepository.findByResumeIdOrderByCreatedAtDesc(resume.getId());
        List<ResumeImprovement> improvements = improvementRepository.findByResumeIdOrderByCreatedAtDesc(resume.getId());

        return ResponseEntity.ok(Map.of(
                "resume", Map.of(
                        "id", resume.getId(),
                        "fileName", resume.getFileName(),
                        "fileType", resume.getFileType(),
                        "extractedText", resume.getExtractedText() != null ? resume.getExtractedText() : "",
                        "uploadedAt", resume.getUploadedAt()
                ),
                "latestAnalysis", analyses.isEmpty() ? null : analyses.get(0),
                "analyses", analyses,
                "jobMatches", matches,
                "improvements", improvements
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResume(Authentication authentication, @PathVariable("id") Long id) {
        User user = getUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));

        try {
            resumeService.deleteResume(id, user.getId());
            return ResponseEntity.ok(Map.of("message", "Resume deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access denied"));
        }
    }

    private User getUser(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        return null;
    }
}
