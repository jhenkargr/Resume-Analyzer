package com.resumeanalyzer.controller;

import com.resumeanalyzer.entity.JobMatch;
import com.resumeanalyzer.entity.Resume;
import com.resumeanalyzer.entity.User;
import com.resumeanalyzer.repository.ResumeRepository;
import com.resumeanalyzer.service.JobMatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/job-match", "/api/jobmatch"})
public class JobMatchController {

    private final JobMatchService jobMatchService;
    private final ResumeRepository resumeRepository;

    public JobMatchController(JobMatchService jobMatchService, ResumeRepository resumeRepository) {
        this.jobMatchService = jobMatchService;
        this.resumeRepository = resumeRepository;
    }

    @PostMapping(value = {"", "/{resumeId}"})
    public ResponseEntity<?> match(Authentication authentication,
                                   @PathVariable(value = "resumeId", required = false) Long pathResumeId,
                                   @RequestParam(value = "resumeId", required = false) Long queryResumeId,
                                   @RequestBody Map<String, String> body) {
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

        String jd = body != null ? body.getOrDefault("jobDescription", "") : "";
        if (jd.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Job description cannot be empty"));
        }

        JobMatch jm = jobMatchService.matchJob(resumeId, jd);
        return ResponseEntity.ok(Map.of(
                "message", "Job match created",
                "jobMatch", jm
        ));
    }

    @GetMapping(value = {"", "/{resumeId}"})
    public ResponseEntity<?> getMatches(Authentication authentication,
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

        List<JobMatch> list = jobMatchService.getJobMatchesForResume(resumeId);
        return ResponseEntity.ok(Map.of("jobMatches", list));
    }

    private User getUser(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        return null;
    }
}
