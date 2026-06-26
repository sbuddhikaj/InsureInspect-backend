package com.insureinspect.backend.repository;

import com.insureinspect.backend.model.ComplianceForm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ComplianceFormRepository extends JpaRepository<ComplianceForm, Long> {
    Optional<ComplianceForm> findByUuid(String uuid);
}
