package com.insureinspect.backend.repository;

import com.insureinspect.backend.model.PhotoNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PhotoNoteRepository extends JpaRepository<PhotoNote, Long> {
}
