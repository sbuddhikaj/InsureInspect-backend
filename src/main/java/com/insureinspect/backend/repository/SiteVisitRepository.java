package com.insureinspect.backend.repository;

import com.insureinspect.backend.model.SiteVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteVisitRepository extends JpaRepository<SiteVisit, Long> {
    List<SiteVisit> findByJobId(Long jobId);
}
