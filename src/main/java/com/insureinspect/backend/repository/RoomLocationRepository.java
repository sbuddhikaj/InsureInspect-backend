package com.insureinspect.backend.repository;

import com.insureinspect.backend.model.RoomLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoomLocationRepository extends JpaRepository<RoomLocation, Long> {
    Optional<RoomLocation> findByUuid(String uuid);
}
