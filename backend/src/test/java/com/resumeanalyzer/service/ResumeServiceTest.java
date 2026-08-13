package com.resumeanalyzer.service;

import com.resumeanalyzer.repository.ResumeRepository;
import com.resumeanalyzer.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class ResumeServiceTest {

    @Test
    void extractsTextFromPlainTextPath() throws Exception {
        ResumeRepository resumeRepository = mock(ResumeRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        ResumeService resumeService = new ResumeService(resumeRepository, userRepository, "./uploads");

        Path tempFile = Files.createTempFile("test_resume", ".txt");
        Files.writeString(tempFile, "Senior Java developer with Spring Boot experience.");

        String extracted = resumeService.extractTextFromPath(tempFile);
        Files.deleteIfExists(tempFile);

        assertThat(extracted).contains("Senior Java developer");
    }

    @Test
    void cleansExtractedTextProperly() {
        String messy = "Senior   Software   Engineer\n\n\n\nExperienced in Java   and React.  \r\n\r\n";
        String cleaned = ResumeService.cleanExtractedText(messy);
        assertThat(cleaned).isEqualTo("Senior Software Engineer\n\nExperienced in Java and React.");
    }
}
