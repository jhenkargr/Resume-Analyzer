package com.resumeanalyzer.repository;

import com.resumeanalyzer.entity.Analysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AnalysisRepository extends JpaRepository<Analysis, Long> {

    List<Analysis> findByResumeIdOrderByCreatedAtDesc(Long resumeId);

    @Query("SELECT a FROM Analysis a WHERE a.resume.user.id = :userId ORDER BY a.createdAt ASC")
    List<Analysis> findAllByUserIdOrderByCreatedAtAsc(@Param("userId") Long userId);
}
