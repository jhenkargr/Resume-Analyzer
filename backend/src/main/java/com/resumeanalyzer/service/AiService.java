package com.resumeanalyzer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    private final WebClient webClient;
    private final String apiKey;
    private final String model;
    private final ObjectMapper objectMapper;

    private static final List<String> POPULAR_TECH_SKILLS = List.of(
            "Java", "Spring Boot", "Spring", "Microservices", "REST API", "GraphQL", "Hibernate", "JPA",
            "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Docker", "Kubernetes",
            "AWS", "Azure", "GCP", "CI/CD", "Git", "GitHub Actions", "Kafka", "RabbitMQ",
            "JavaScript", "TypeScript", "React", "Next.js", "Vue.js", "Angular", "Node.js", "Express",
            "Python", "Django", "FastAPI", "Pandas", "NumPy", "TensorFlow", "PyTorch", "C++", "C#", ".NET",
            "HTML5", "CSS3", "Tailwind CSS", "Linux", "JUnit", "Mockito", "Selenium", "Agile", "Scrum"
    );

    private static final List<String> POPULAR_SOFT_SKILLS = List.of(
            "Problem Solving", "Cross-Functional Collaboration", "Team Leadership", "Effective Communication",
            "Critical Thinking", "Agile Methodology", "Stakeholder Management", "Adaptability",
            "Time Management", "Code Review Mentorship", "Technical Writing", "Conflict Resolution"
    );

    private static final Map<String, String> SKILL_REASONS = Map.ofEntries(
            Map.entry("Docker", "Standard for containerizing backend microservices; ensures identical behavior across development and production environments."),
            Map.entry("Kubernetes", "Essential for container orchestration, automated scaling, and resilient microservice management in cloud platforms."),
            Map.entry("CI/CD", "Automated build, test, and deployment pipelines (e.g. GitHub Actions, Jenkins) are a top filter criteria for technical recruiters."),
            Map.entry("Redis", "Demonstrates experience with high-speed in-memory caching and reducing relational database bottlenecks."),
            Map.entry("JUnit", "Explicitly listing unit testing frameworks signals strong code quality and testing discipline."),
            Map.entry("AWS", "Signals cloud readiness and practical experience deploying scalable cloud-native infrastructure."),
            Map.entry("PostgreSQL", "Demonstrates practical knowledge of robust ACID relational database design and index optimization."),
            Map.entry("MySQL", "Essential for relational data modeling, query optimization, and transaction management."),
            Map.entry("Kafka", "Demonstrates experience building high-throughput asynchronous event-driven architectures."),
            Map.entry("TypeScript", "Adds static type safety to JavaScript codebases, a major requirement in modern frontend and full-stack roles."),
            Map.entry("Microservices", "Shows capability in designing distributed, decoupled services rather than monolithic architectures."),
            Map.entry("REST API", "Fundamental for designing clean, standardized backend endpoints and frontend-backend communication.")
    );

    public AiService(@Value("${app.gemini.api-key:}") String apiKey,
                     @Value("${app.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl,
                     @Value("${app.gemini.model:gemini-2.5-flash}") String model) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.model = (model != null && !model.isBlank()) ? model.trim() : "gemini-2.5-flash";
        this.objectMapper = new ObjectMapper();

        if (!this.apiKey.isBlank() && baseUrl != null && !baseUrl.isBlank()) {
            this.webClient = WebClient.builder()
                    .baseUrl(baseUrl)
                    .build();
            log.info("Gemini AI integration enabled with model: {}", this.model);
        } else {
            this.webClient = null;
            log.info("Gemini API key not configured — using offline intelligent heuristic AI analyzer.");
        }
    }

    public AnalysisResult analyzeResume(String resumeText) {
        if (webClient != null && !apiKey.isBlank()) {
            try {
                String prompt = buildAnalysisPrompt(resumeText);
                String rawResponse = callGemini(prompt);
                AnalysisResult result = parseAnalysisResponse(rawResponse);
                if (result != null) {
                    return result;
                }
            } catch (Exception e) {
                log.warn("Gemini API call failed, falling back to intelligent offline analysis: {}", e.getMessage());
            }
        }
        return fallbackAnalyze(resumeText);
    }

    public MatchResult matchJob(String resumeText, String jobDescription) {
        if (webClient != null && !apiKey.isBlank()) {
            try {
                String prompt = buildJobMatchPrompt(resumeText, jobDescription);
                String rawResponse = callGemini(prompt);
                MatchResult result = parseJobMatchResponse(rawResponse);
                if (result != null) {
                    return result;
                }
            } catch (Exception e) {
                log.warn("Gemini API call failed for job matching, falling back to offline matcher: {}", e.getMessage());
            }
        }
        return fallbackMatch(resumeText, jobDescription);
    }

    public ImproveResult improveResume(String resumeText) {
        if (webClient != null && !apiKey.isBlank()) {
            try {
                String prompt = buildImprovementPrompt(resumeText);
                String rawResponse = callGemini(prompt);
                ImproveResult result = parseImprovementResponse(rawResponse);
                if (result != null && result.improvedExperienceJson != null && !result.improvedExperienceJson.equals("[]")) {
                    return result;
                }
            } catch (Exception e) {
                log.warn("Gemini API call failed for rewrite improvements, falling back: {}", e.getMessage());
            }
        }
        return fallbackImprove(resumeText);
    }

    private String callGemini(String prompt) {
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of(
                                "parts", List.of(
                                        Map.of("text", prompt)
                                 )
                        )
                ),
                "generationConfig", Map.of(
                        "temperature", 0.3,
                        "responseMimeType", "application/json"
                )
        );

        String uri = String.format("/models/%s:generateContent?key=%s", model, apiKey);

        String response = webClient.post()
                .uri(uri)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(25))
                .block();

        return extractTextFromGeminiResponse(response);
    }

    private String extractTextFromGeminiResponse(String geminiJson) {
        try {
            JsonNode root = objectMapper.readTree(geminiJson);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    return parts.get(0).path("text").asText();
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse raw Gemini JSON wrapper", e);
        }
        return geminiJson;
    }

    private String cleanJsonString(String raw) {
        if (raw == null) return "{}";
        String trimmed = raw.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        return trimmed.trim();
    }

    private String buildAnalysisPrompt(String resumeText) {
        return """
                You are an elite ATS Architect and Senior Technical Recruiter.
                Perform a thorough analysis of the provided resume text.

                CRITICAL GUIDELINES:
                1. SUMMARY:
                   - Write a concise, natural, authentic 2-3 sentence executive evaluation of the candidate's actual qualifications and positioning.
                   - Write in clear, human language.
                   - NEVER use robotic buzzwords or clichés (avoid "Results-driven", "Dynamic", "Spearheaded", "Synergized", "Proven track record", "Demonstrated expertise", "Mission-critical").
                2. TECHNICAL SKILLS:
                   - Extract only actual technical tools, programming languages, frameworks, libraries, and databases present in the resume.
                3. SOFT SKILLS:
                   - Identify verifiable interpersonal and professional strengths (e.g. Cross-Functional Collaboration, Problem Solving, Code Reviews).
                4. RECOMMENDED MISSING KEYWORDS WITH DETAILED RATIONALE:
                   - Identify 4-6 high-value industry skills or tools relevant to the candidate's domain that are missing from their resume.
                   - For each missing skill, provide a specific, professional explanation of WHY the candidate should add it and how it improves ATS discovery and recruiter matching.
                5. SUGGESTIONS:
                   - Provide 3-4 specific, actionable improvements focusing on metric quantification, impact clarity, and structure.

                Return ONLY valid JSON matching this exact structure:
                {
                  "summary": "Software developer with practical experience in Java, Spring Boot, and React web applications. Demonstrates a strong foundation in RESTful API development and relational databases, with room to highlight production deployment metrics and containerization tools.",
                  "technicalSkills": ["Java", "Spring Boot", "MySQL", "React", "REST APIs", "Git"],
                  "softSkills": ["Problem Solving", "Cross-Functional Collaboration", "Code Quality"],
                  "missingKeywords": [
                    {
                      "skill": "Docker",
                      "reason": "Standard for containerizing backend services; hiring managers look for familiarity with containerized dev and test workflows."
                    },
                    {
                      "skill": "CI/CD (GitHub Actions / Jenkins)",
                      "reason": "Demonstrates practical experience with automated testing and deployment pipelines, a key requirement for modern engineering teams."
                    },
                    {
                      "skill": "Redis",
                      "reason": "Highlights experience in caching strategies and reducing database query load under high traffic."
                    },
                    {
                      "skill": "Unit Testing (JUnit / Mockito)",
                      "reason": "Explicitly listing testing frameworks signals strong code reliability and test-driven development practices."
                    }
                  ],
                  "grammarScore": 88,
                  "clarityScore": 82,
                  "atsScore": 80,
                  "overallScore": 83,
                  "suggestions": "• Quantify project impacts by adding specific metrics (e.g. latency reduction, request throughput, user count)\\n• Explicitly list testing and deployment tools in your skills section\\n• Ensure bullet points follow the Action Verb + Context + Result structure"
                }

                RESUME TEXT:
                """ + (resumeText.length() > 10000 ? resumeText.substring(0, 10000) : resumeText);
    }

    private AnalysisResult parseAnalysisResponse(String raw) {
        try {
            String json = cleanJsonString(raw);
            JsonNode node = objectMapper.readTree(json);

            String summary = node.path("summary").asText("Candidate possesses solid technical foundation with clear potential for career growth.");
            List<String> techSkills = parseStringList(node.path("technicalSkills"));
            List<String> softSkills = parseStringList(node.path("softSkills"));
            List<MissingSkillDetail> missingKeywords = parseMissingSkillDetails(node.path("missingKeywords"));

            int grammarScore = clampScore(node.path("grammarScore").asInt(80));
            int clarityScore = clampScore(node.path("clarityScore").asInt(75));
            int atsScore = clampScore(node.path("atsScore").asInt(75));
            int overallScore = clampScore(node.path("overallScore").asInt((grammarScore + clarityScore + atsScore) / 3));

            String suggestions = node.path("suggestions").asText("Enhance quantitative metrics across experience bullet points.");

            return new AnalysisResult(summary, techSkills, softSkills, missingKeywords,
                    grammarScore, clarityScore, atsScore, overallScore, suggestions);
        } catch (Exception e) {
            log.warn("Failed to parse Gemini analysis JSON: {}", e.getMessage());
            return null;
        }
    }

    private String buildJobMatchPrompt(String resumeText, String jobDescription) {
        return """
                You are an ATS Match Engine. Compare the candidate's resume text against the target job description.
                Return ONLY valid JSON matching this exact structure:
                {
                  "matchScore": 75,
                  "matchedSkills": ["skill1", "skill2"],
                  "missingSkills": ["missingKeyword1", "missingKeyword2"],
                  "suggestions": "• Add experience with X mentioned in the job description\\n• Highlight your proficiency in Y\\n• Tailor summary to emphasize Z"
                }

                JOB DESCRIPTION:
                """ + jobDescription + """

                RESUME TEXT:
                """ + (resumeText.length() > 8000 ? resumeText.substring(0, 8000) : resumeText);
    }

    private MatchResult parseJobMatchResponse(String raw) {
        try {
            String json = cleanJsonString(raw);
            JsonNode node = objectMapper.readTree(json);

            int matchScore = clampScore(node.path("matchScore").asInt(70));
            List<String> matchedSkills = parseStringList(node.path("matchedSkills"));
            List<String> missingSkills = parseStringList(node.path("missingSkills"));
            String suggestions = node.path("suggestions").asText("Incorporate keywords from the target role into your bullet points.");

            return new MatchResult(matchScore, matchedSkills, missingSkills, suggestions);
        } catch (Exception e) {
            log.warn("Failed to parse Gemini JobMatch JSON: {}", e.getMessage());
            return null;
        }
    }

    private String buildImprovementPrompt(String resumeText) {
        return """
                You are a Senior Career Coach and Expert Resume Writer.
                Rewrite and improve the candidate's resume summary and experience bullet points to be authentic, human-written, and impactful.

                CRITICAL CONSTRAINTS & RULES:
                1. EXECUTIVE SUMMARY:
                   - Write a natural, compelling 2-3 sentence summary tailored specifically to the candidate's actual background and skills.
                   - Sound like a polished human professional, NOT an AI generator.
                   - STRICTLY PROHIBITED: Do not use AI buzzwords and clichés (NEVER use "Results-driven professional", "Dynamic software engineer", "Spearheaded", "Synergized", "Proven track record", "Demonstrated expertise", "Mission-critical", "Fast-paced environment", "Deep passion for", "Pioneered").
                   - Example of good human tone: "Software engineer with experience building web applications with Java, Spring Boot, and React. Experienced in designing RESTful APIs, optimizing relational databases, and delivering clean, maintainable code."

                2. EXPERIENCE BULLET POINTS:
                   - STRICT EXCLUSION: Do NOT select contact info (emails like @gmail.com, phone numbers, addresses, LinkedIn/GitHub links), education lines (college/university names, degrees like B.Tech/B.E, GPA/marks, graduation years), certifications, or section headers.
                   - ONLY extract and rewrite REAL work experiences, internships, or technical project bullet points found in the resume.
                   - For each extracted point:
                     * "original": The exact or cleaned original bullet point from the resume.
                     * "improved": A polished, human-written version using strong, natural action verbs (e.g. "Built", "Developed", "Designed", "Optimized", "Integrated", "Implemented", "Refactored", "Automated").
                     * Add realistic impact/metrics where appropriate.
                     * NEVER start sentences with "Spearheaded".

                3. SUGGESTED KEYWORDS:
                   - 6-8 relevant technical keywords that enhance ATS ranking for this candidate's profile.

                Return ONLY valid JSON matching this exact structure:
                {
                  "improvedSummary": "Software engineer with hands-on experience building full-stack web applications using Java, Spring Boot, and React. Experienced in designing REST APIs, optimizing MySQL databases, and writing clean, testable code.",
                  "suggestedKeywords": "Java, Spring Boot, REST APIs, MySQL, Docker, React, Microservices",
                  "improvedExperience": [
                    {
                      "original": "Worked on backend services and fixed bugs",
                      "improved": "Developed and maintained RESTful backend services using Spring Boot and MySQL, improving endpoint response times by 25%."
                    }
                  ]
                }

                RESUME TEXT:
                """ + (resumeText.length() > 8000 ? resumeText.substring(0, 8000) : resumeText);
    }

    private ImproveResult parseImprovementResponse(String raw) {
        try {
            String json = cleanJsonString(raw);
            JsonNode node = objectMapper.readTree(json);

            String improvedSummary = node.path("improvedSummary").asText();
            String suggestedKeywords = node.path("suggestedKeywords").asText();
            JsonNode expNode = node.path("improvedExperience");

            List<Map<String, String>> cleanedExp = new ArrayList<>();
            if (expNode != null && expNode.isArray()) {
                for (JsonNode item : expNode) {
                    String orig = item.path("original").asText("").trim();
                    String imp = item.path("improved").asText("").trim();
                    if (!orig.isBlank() && !imp.isBlank() && !isIgnoredNonExperienceLine(orig)) {
                        Map<String, String> expMap = new HashMap<>();
                        expMap.put("original", orig);
                        expMap.put("improved", imp);
                        cleanedExp.add(expMap);
                    }
                }
            }

            String expJson = cleanedExp.isEmpty() ? "[]" : objectMapper.writeValueAsString(cleanedExp);
            return new ImproveResult(improvedSummary, expJson, suggestedKeywords);
        } catch (Exception e) {
            log.warn("Failed to parse Gemini improvement JSON: {}", e.getMessage());
            return null;
        }
    }

    private List<String> parseStringList(JsonNode node) {
        List<String> list = new ArrayList<>();
        if (node != null && node.isArray()) {
            for (JsonNode item : node) {
                if (item.isTextual() && !item.asText().isBlank()) {
                    list.add(item.asText().trim());
                }
            }
        }
        return list;
    }

    private List<MissingSkillDetail> parseMissingSkillDetails(JsonNode node) {
        List<MissingSkillDetail> list = new ArrayList<>();
        if (node != null && node.isArray()) {
            for (JsonNode item : node) {
                if (item.isObject()) {
                    String skill = item.path("skill").asText(item.path("name").asText("")).trim();
                    String reason = item.path("reason").asText(item.path("detail").asText("")).trim();
                    if (!skill.isBlank()) {
                        if (reason.isBlank()) {
                            reason = getSkillReasonFallback(skill);
                        }
                        list.add(new MissingSkillDetail(skill, reason));
                    }
                } else if (item.isTextual() && !item.asText().isBlank()) {
                    String skill = item.asText().trim();
                    list.add(new MissingSkillDetail(skill, getSkillReasonFallback(skill)));
                }
            }
        }
        return list;
    }

    private String getSkillReasonFallback(String skill) {
        for (Map.Entry<String, String> entry : SKILL_REASONS.entrySet()) {
            if (skill.toLowerCase(Locale.ROOT).contains(entry.getKey().toLowerCase(Locale.ROOT))) {
                return entry.getValue();
            }
        }
        return "Adding " + skill + " increases ATS keyword relevancy and demonstrates capability in modern tech stacks.";
    }

    private int clampScore(int score) {
        return Math.max(10, Math.min(99, score));
    }

    // ==========================================
    // Intelligent Offline Heuristic AI Analyzers
    // ==========================================

    private AnalysisResult fallbackAnalyze(String text) {
        String safeText = text == null ? "" : text;
        String lower = safeText.toLowerCase(Locale.ROOT);

        List<String> detectedTech = POPULAR_TECH_SKILLS.stream()
                .filter(skill -> containsWord(lower, skill.toLowerCase(Locale.ROOT)))
                .collect(Collectors.toList());

        List<String> detectedSoft = POPULAR_SOFT_SKILLS.stream()
                .filter(skill -> containsWord(lower, skill.toLowerCase(Locale.ROOT)))
                .collect(Collectors.toList());

        if (detectedSoft.isEmpty()) {
            detectedSoft.addAll(List.of("Problem Solving", "Cross-Functional Collaboration", "Code Quality"));
        }

        List<String> rawMissing = POPULAR_TECH_SKILLS.stream()
                .filter(skill -> !containsWord(lower, skill.toLowerCase(Locale.ROOT)))
                .limit(5)
                .toList();

        List<MissingSkillDetail> missingWithReasons = new ArrayList<>();
        for (String skill : rawMissing) {
            missingWithReasons.add(new MissingSkillDetail(skill, getSkillReasonFallback(skill)));
        }

        int metricCount = countMetrics(safeText);
        int wordCount = safeText.split("\\s+").length;

        int grammarScore = Math.min(96, 75 + Math.min(15, wordCount / 50));
        int clarityScore = Math.min(95, 70 + (metricCount * 5));
        int atsScore = Math.min(98, 65 + (detectedTech.size() * 3));
        int overallScore = (grammarScore + clarityScore + atsScore) / 3;

        String summary = String.format("Software developer with core competencies across %s. " +
                        "The resume has strong foundational coverage; incorporating quantified project impact and containerization/testing tools will enhance ATS ranking.",
                detectedTech.isEmpty() ? "modern software engineering" : String.join(", ", detectedTech.stream().limit(4).toList()));

        List<String> suggestionsList = new ArrayList<>();
        if (metricCount < 3) {
            suggestionsList.add("• Quantify achievements: Include concrete metrics such as latency reduction, request throughput, or test coverage.");
        }
        if (detectedTech.size() < 6) {
            suggestionsList.add("• Expand technical stack: Explicitly list modern frameworks, databases, and CI/CD tools used.");
        }
        suggestionsList.add("• Structure experience bullet points using the Action Verb + Context + Result format.");
        suggestionsList.add("• Ensure consistent past-tense action verbs for completed projects.");

        String suggestions = String.join("\n", suggestionsList);

        return new AnalysisResult(summary, detectedTech, detectedSoft, missingWithReasons,
                grammarScore, clarityScore, atsScore, overallScore, suggestions);
    }

    private MatchResult fallbackMatch(String resumeText, String jobDescription) {
        String rText = resumeText == null ? "" : resumeText.toLowerCase(Locale.ROOT);
        String jdText = jobDescription == null ? "" : jobDescription.toLowerCase(Locale.ROOT);

        List<String> jdSkills = POPULAR_TECH_SKILLS.stream()
                .filter(skill -> containsWord(jdText, skill.toLowerCase(Locale.ROOT)))
                .collect(Collectors.toList());

        if (jdSkills.isEmpty()) {
            jdSkills = extractKeywordsFromText(jobDescription);
        }

        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        for (String skill : jdSkills) {
            if (containsWord(rText, skill.toLowerCase(Locale.ROOT))) {
                matched.add(skill);
            } else {
                missing.add(skill);
            }
        }

        int total = matched.size() + missing.size();
        int score = total > 0 ? (int) Math.round(((double) matched.size() / total) * 100) : 60;
        score = Math.max(25, Math.min(95, score));

        List<String> sugList = new ArrayList<>();
        if (!missing.isEmpty()) {
            sugList.add("• Missing keywords identified from JD: " + String.join(", ", missing.stream().limit(5).toList()) + ".");
            sugList.add("• Incorporate these missing competencies into your relevant project descriptions.");
        }
        sugList.add("• Align phrasing with the terminology in the job description to optimize ATS keyword scoring.");
        sugList.add("• Highlight projects with technologies that closely map to the role requirements.");

        String suggestions = String.join("\n", sugList);

        return new MatchResult(score, matched, missing, suggestions);
    }

    private ImproveResult fallbackImprove(String resumeText) {
        String safeText = resumeText == null ? "" : resumeText;
        String lower = safeText.toLowerCase(Locale.ROOT);

        List<String> skills = POPULAR_TECH_SKILLS.stream()
                .filter(skill -> containsWord(lower, skill.toLowerCase(Locale.ROOT)))
                .limit(6)
                .toList();

        String primarySkills = skills.isEmpty()
                ? "Java, Spring Boot, and modern web architectures"
                : String.join(", ", skills.stream().limit(3).toList());

        String improvedSummary = "Software developer with hands-on experience building full-stack web applications using " +
                primarySkills + ". Experienced in developing RESTful APIs, managing database integrations, and collaborating across agile teams to deliver clean, maintainable software.";

        String suggestedKeywords = String.join(", ", skills.isEmpty()
                ? List.of("Java", "Spring Boot", "REST APIs", "MySQL", "Docker", "Microservices", "CI/CD")
                : skills);

        List<Map<String, String>> experiences = new ArrayList<>();

        // Extract genuine experience lines (excluding emails, phones, colleges, headers)
        List<String> genuineBullets = extractRealExperienceBullets(safeText);

        if (genuineBullets.isEmpty()) {
            Map<String, String> b1 = new HashMap<>();
            b1.put("original", "Developed backend services and REST APIs for web application.");
            b1.put("improved", "Engineered and deployed modular RESTful API services using Spring Boot and MySQL, improving data retrieval efficiency by 30%.");
            experiences.add(b1);

            Map<String, String> b2 = new HashMap<>();
            b2.put("original", "Managed database queries and resolved application bugs.");
            b2.put("improved", "Optimized database schemas and indexing structures, reducing query execution times by 40% across high-frequency endpoints.");
            experiences.add(b2);

            Map<String, String> b3 = new HashMap<>();
            b3.put("original", "Built interactive user interface and connected with backend endpoints.");
            b3.put("improved", "Developed responsive React UI components integrated with REST APIs, providing seamless state management and intuitive user experiences.");
            experiences.add(b3);
        } else {
            for (int i = 0; i < genuineBullets.size(); i++) {
                String orig = genuineBullets.get(i);
                String improved;
                if (i == 0) {
                    improved = "Developed and delivered " + cleanBulletStart(orig) + ", enhancing operational performance and reducing response latency by 25%.";
                } else if (i == 1) {
                    improved = "Engineered and implemented " + cleanBulletStart(orig) + ", ensuring modular architecture and robust error handling.";
                } else {
                    improved = "Optimized and maintained " + cleanBulletStart(orig) + ", improving system reliability and maintainability across releases.";
                }
                Map<String, String> expMap = new HashMap<>();
                expMap.put("original", orig != null ? orig : "");
                expMap.put("improved", improved != null ? improved : "");
                experiences.add(expMap);
            }
        }

        String expJson;
        try {
            expJson = objectMapper.writeValueAsString(experiences);
        } catch (Exception e) {
            expJson = "[]";
        }

        return new ImproveResult(improvedSummary, expJson, suggestedKeywords);
    }

    private List<String> extractRealExperienceBullets(String resumeText) {
        if (resumeText == null || resumeText.isBlank()) return List.of();

        String[] lines = resumeText.split("\n");
        List<String> bullets = new ArrayList<>();

        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.length() < 20 || line.length() > 250) continue;

            if (isIgnoredNonExperienceLine(line)) {
                continue;
            }

            // Check if line looks like an action bullet
            boolean isBullet = line.startsWith("•") || line.startsWith("-") || line.startsWith("*") || line.startsWith("▪") || line.startsWith("–") || line.matches("^\\d+\\..*");
            boolean hasActionVerb = startsWithActionVerb(line);

            if (isBullet || hasActionVerb) {
                String cleaned = line.replaceAll("^[•\\-*▪▫–\\d.]+\\s*", "").trim();
                if (cleaned.length() >= 20 && !isIgnoredNonExperienceLine(cleaned)) {
                    bullets.add(cleaned);
                    if (bullets.size() >= 4) break;
                }
            }
        }

        return bullets;
    }

    private boolean isIgnoredNonExperienceLine(String line) {
        if (line == null) return true;
        String lower = line.toLowerCase(Locale.ROOT);

        // Filter emails
        if (lower.contains("@") || lower.contains("gmail") || lower.contains("yahoo") || lower.contains("outlook") || lower.contains("mail")) {
            return true;
        }

        // Filter URLs / Links
        if (lower.contains("http:") || lower.contains("https:") || lower.contains("github.com") || lower.contains("linkedin.com") || lower.contains("www.")) {
            return true;
        }

        // Filter Phone numbers & addresses
        if (lower.matches(".*\\+?\\d{1,3}[- ]?\\d{9,12}.*") || lower.contains("phone:") || lower.contains("mobile:") || lower.contains("contact:")) {
            return true;
        }

        // Filter Education lines & College names
        if (lower.contains("college") || lower.contains("university") || lower.contains("institute") || lower.contains("school") ||
                lower.contains("bachelor") || lower.contains("master") || lower.contains("b.tech") || lower.contains("b.e") ||
                lower.contains("m.tech") || lower.contains("b.sc") || lower.contains("m.sc") || lower.contains("bca") || lower.contains("mca") ||
                lower.contains("cgpa") || lower.contains("gpa") || lower.contains("percentage") || lower.contains("matriculation") ||
                lower.contains("intermediate") || lower.contains("cbse") || lower.contains("icse") || lower.contains("hsc") || lower.contains("sslc")) {
            return true;
        }

        // Filter Section Titles & Headers
        if (lower.matches("^(education|skills|technical skills|key skills|soft skills|contact|declaration|hobbies|interests|summary|objective|certifications|personal details|profile)[:\\s]*$")) {
            return true;
        }

        // Filter Skill Lists (e.g. "Java, Spring Boot, MySQL, React")
        if (line.chars().filter(ch -> ch == ',').count() >= 3 && !lower.contains("developed") && !lower.contains("built") && !lower.contains("designed")) {
            return true;
        }

        return false;
    }

    private boolean startsWithActionVerb(String line) {
        String lower = line.toLowerCase(Locale.ROOT);
        String[] verbs = {"developed", "built", "created", "designed", "engineered", "implemented", "worked", "managed", "configured", "optimized", "integrated", "automated", "refactored", "maintained", "assisted", "collaborated", "wrote", "tested"};
        for (String verb : verbs) {
            if (lower.startsWith(verb) || lower.matches("^[a-z]+\\s+" + verb + ".*")) {
                return true;
            }
        }
        return false;
    }

    private String cleanBulletStart(String orig) {
        String cleaned = orig.replaceAll("^[•\\-*▪▫–\\d.]+\\s*", "").trim();
        // Lowercase the first word if it was an action verb to combine naturally
        String[] parts = cleaned.split("\\s+", 2);
        if (parts.length > 1 && startsWithActionVerb(parts[0])) {
            return parts[0].toLowerCase(Locale.ROOT) + " " + parts[1];
        }
        return cleaned;
    }

    private int countMetrics(String text) {
        if (text == null) return 0;
        Pattern p = Pattern.compile("\\b\\d+[%kKmMbB]?\\b|\\$\\d+");
        Matcher m = p.matcher(text);
        int count = 0;
        while (m.find()) count++;
        return count;
    }

    private boolean containsWord(String source, String word) {
        if (source == null || word == null) return false;
        String regex = "\\b" + Pattern.quote(word) + "\\b";
        return Pattern.compile(regex, Pattern.CASE_INSENSITIVE).matcher(source).find();
    }

    private List<String> extractKeywordsFromText(String text) {
        if (text == null) return List.of();
        Set<String> words = new LinkedHashSet<>();
        Pattern p = Pattern.compile("[A-Za-z+#]{3,}");
        Matcher m = p.matcher(text);
        Set<String> stopWords = Set.of("the", "and", "for", "with", "you", "will", "our", "are", "have", "this", "that", "from", "your", "work", "team", "role", "must", "plus");
        while (m.find() && words.size() < 8) {
            String w = m.group();
            if (!stopWords.contains(w.toLowerCase(Locale.ROOT)) && Character.isUpperCase(w.charAt(0))) {
                words.add(w);
            }
        }
        return new ArrayList<>(words);
    }

    public static class MissingSkillDetail {
        public String skill;
        public String reason;

        public MissingSkillDetail() {}

        public MissingSkillDetail(String skill, String reason) {
            this.skill = skill;
            this.reason = reason;
        }

        public String getSkill() { return skill; }
        public void setSkill(String skill) { this.skill = skill; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class AnalysisResult {
        public final String summary;
        public final List<String> technicalSkills;
        public final List<String> softSkills;
        public final List<MissingSkillDetail> missingKeywords;
        public final int grammarScore;
        public final int clarityScore;
        public final int atsScore;
        public final int overallScore;
        public final String suggestions;

        public AnalysisResult(String summary, List<String> technicalSkills, List<String> softSkills,
                              List<MissingSkillDetail> missingKeywords, int grammarScore, int clarityScore,
                              int atsScore, int overallScore, String suggestions) {
            this.summary = summary;
            this.technicalSkills = technicalSkills;
            this.softSkills = softSkills;
            this.missingKeywords = missingKeywords;
            this.grammarScore = grammarScore;
            this.clarityScore = clarityScore;
            this.atsScore = atsScore;
            this.overallScore = overallScore;
            this.suggestions = suggestions;
        }
    }

    public static class MatchResult {
        public final int score;
        public final List<String> matchedSkills;
        public final List<String> missingSkills;
        public final String suggestions;

        public MatchResult(int score, List<String> matchedSkills, List<String> missingSkills, String suggestions) {
            this.score = score;
            this.matchedSkills = matchedSkills;
            this.missingSkills = missingSkills;
            this.suggestions = suggestions;
        }
    }

    public static class ImproveResult {
        public final String improvedSummary;
        public final String improvedExperienceJson;
        public final String suggestedKeywords;

        public ImproveResult(String improvedSummary, String improvedExperienceJson, String suggestedKeywords) {
            this.improvedSummary = improvedSummary;
            this.improvedExperienceJson = improvedExperienceJson;
            this.suggestedKeywords = suggestedKeywords;
        }
    }
}
