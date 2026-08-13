package com.resumeanalyzer.controller;

import com.resumeanalyzer.entity.User;
import com.resumeanalyzer.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(Authentication authentication) {
        User user = getUser(authentication);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

        Map<String, Object> summary = dashboardService.getDashboardSummary(user.getId());
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(Authentication authentication,
                                        @RequestParam(value = "resumeId", required = false) Long resumeId) {
        User user = getUser(authentication);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

        var history = dashboardService.getScoreHistory(user.getId(), resumeId);
        return ResponseEntity.ok(Map.of("history", history));
    }

    private User getUser(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        return null;
    }
}
