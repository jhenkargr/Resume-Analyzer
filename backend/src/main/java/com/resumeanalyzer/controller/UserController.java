package com.resumeanalyzer.controller;

import com.resumeanalyzer.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of("user", Map.of(
            "id", user.getId(),
            "fullName", user.getFullName(),
            "email", user.getEmail()
        )));
    }
}
