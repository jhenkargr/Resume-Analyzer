package com.resumeanalyzer.repository;

import com.resumeanalyzer.entity.ResumeImprovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResumeImprovementRepository extends JpaRepository<ResumeImprovement, Long> {
    List<ResumeImprovement> findByResumeIdOrderByCreatedAtDesc(Long resumeId);
}
