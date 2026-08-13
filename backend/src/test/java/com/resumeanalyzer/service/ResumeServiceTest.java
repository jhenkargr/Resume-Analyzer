package com.resumeanalyzer.service;

import com.resumeanalyzer.repository.ResumeRepository;
import com.resumeanalyzer.repository.UserRepository;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class ResumeServiceTest {

    @Test
    void extractsTextFromPlainBytes() throws Exception {
        ResumeRepository resumeRepository = mock(ResumeRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        SupabaseStorageService supabaseStorageService = mock(SupabaseStorageService.class);
        ResumeService resumeService = new ResumeService(resumeRepository, userRepository, supabaseStorageService);

        byte[] bytes = "Senior Java developer with Spring Boot experience.".getBytes(java.nio.charset.StandardCharsets.UTF_8);

        String extracted = resumeService.extractTextFromBytes(bytes, "resume.txt");

        assertThat(extracted).contains("Senior Java developer");
    }

    @Test
    void cleansExtractedTextProperly() {
        String messy = "Senior   Software   Engineer\n\n\n\nExperienced in Java   and React.  \r\n\r\n";
        String cleaned = ResumeService.cleanExtractedText(messy);
        assertThat(cleaned).isEqualTo("Senior Software Engineer\n\nExperienced in Java and React.");
    }
}
