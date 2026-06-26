package com.insureinspect.backend.repository;

import com.insureinspect.backend.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    List<Job> findByInvestigatorId(String investigatorId);
}
