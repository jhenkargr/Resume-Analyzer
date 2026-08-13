package com.resumeanalyzer.controller;

import com.resumeanalyzer.entity.Resume;
import com.resumeanalyzer.entity.ResumeImprovement;
import com.resumeanalyzer.entity.User;
import com.resumeanalyzer.repository.ResumeRepository;
import com.resumeanalyzer.service.ResumeImprovementService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/improvements", "/api/resume-improvements"})
public class ResumeImprovementController {

    private final ResumeImprovementService improvementService;
    private final ResumeRepository resumeRepository;

    public ResumeImprovementController(ResumeImprovementService improvementService, ResumeRepository resumeRepository) {
        this.improvementService = improvementService;
        this.resumeRepository = resumeRepository;
    }

    @PostMapping(value = {"", "/{resumeId}"})
    public ResponseEntity<?> improve(Authentication authentication,
                                     @PathVariable(value = "resumeId", required = false) Long pathResumeId,
                                     @RequestParam(value = "resumeId", required = false) Long queryResumeId) {
        Long resumeId = pathResumeId != null ? pathResumeId : queryResumeId;
        if (resumeId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "resumeId is required"));
        }

        User user = getUser(authentication);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

        Resume resume = resumeRepository.findById(resumeId).orElse(null);
        if (resume == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Resume not found"));
        }
        if (!resume.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        }

        ResumeImprovement ri = improvementService.improve(resumeId);
        return ResponseEntity.ok(Map.of(
                "message", "Resume improvement created",
                "improvement", ri
        ));
    }

    @GetMapping(value = {"", "/{resumeId}"})
    public ResponseEntity<?> getImprovements(Authentication authentication,
                                             @PathVariable(value = "resumeId", required = false) Long pathResumeId,
                                             @RequestParam(value = "resumeId", required = false) Long queryResumeId) {
        Long resumeId = pathResumeId != null ? pathResumeId : queryResumeId;
        if (resumeId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "resumeId is required"));
        }

        User user = getUser(authentication);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

        Resume resume = resumeRepository.findById(resumeId).orElse(null);
        if (resume == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Resume not found"));
        }
        if (!resume.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        }

        List<ResumeImprovement> list = improvementService.getImprovementsForResume(resumeId);
        return ResponseEntity.ok(Map.of("improvements", list, "latest", list.isEmpty() ? null : list.get(0)));
    }

    private User getUser(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        return null;
    }
}
