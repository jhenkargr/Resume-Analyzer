package com.resumeanalyzer.service;

import com.resumeanalyzer.entity.Analysis;
import com.resumeanalyzer.entity.Resume;
import com.resumeanalyzer.repository.AnalysisRepository;
import com.resumeanalyzer.repository.ResumeRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AnalysisServiceTest {

    @Test
    void generatesBasicAnalysisForResumeText() {
        ResumeRepository resumeRepository = mock(ResumeRepository.class);
        AnalysisRepository analysisRepository = mock(AnalysisRepository.class);
        AiService aiService = new AiService("", "", "gemini-1.5-flash");
        AnalysisService analysisService = new AnalysisService(resumeRepository, analysisRepository, aiService);

        Resume resume = Resume.builder()
            .id(1L)
            .fileName("resume.txt")
            .extractedText("Senior Java developer with Spring Boot and MySQL experience.")
            .build();

        when(resumeRepository.findById(1L)).thenReturn(Optional.of(resume));
        when(analysisRepository.save(any(Analysis.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Analysis analysis = analysisService.analyzeResume(1L);

        assertThat(analysis.getOverallScore()).isGreaterThan(0);
        assertThat(analysis.getSummary()).isNotEmpty();
        assertThat(analysis.getTechnicalSkills()).contains("Java");
    }
}
