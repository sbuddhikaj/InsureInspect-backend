package com.insureinspect.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "equipment")
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_location_id", nullable = false)
    @JsonIgnore
    private RoomLocation roomLocation;

    private String name;
    private String serialNumber;
    private String status;

    @Column(length = 2000)
    private String notes;

    public Equipment() {}

    public Equipment(RoomLocation roomLocation, String uuid, String name, String serialNumber, String status) {
        this.roomLocation = roomLocation;
        this.uuid = uuid;
        this.name = name;
        this.serialNumber = serialNumber;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public RoomLocation getRoomLocation() {
        return roomLocation;
    }

    public void setRoomLocation(RoomLocation roomLocation) {
        this.roomLocation = roomLocation;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
