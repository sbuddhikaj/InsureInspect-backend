package com.insureinspect.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "jobs")
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String clientName;
    private String address;
    private String phone;
    private String policyNumber;
    
    @Column(length = 2000)
    private String claimDetails;
    
    private String scheduledDate;
    private String status; // Pending, In_Progress, Completed
    private String investigatorId;
    
    // Investigation Form Data (filled on inspection)
    private String damageSeverity; // Low, Medium, High, Critical
    private boolean structuralDamage;
    private boolean roofDamage;
    private boolean waterDamage;
    
    @Column(length = 4000)
    private String notes;
    
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PhotoNote> photoNotes = new ArrayList<>();

    public Job() {
        this.status = "Pending";
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPolicyNumber() {
        return policyNumber;
    }

    public void setPolicyNumber(String policyNumber) {
        this.policyNumber = policyNumber;
    }

    public String getClaimDetails() {
        return claimDetails;
    }

    public void setClaimDetails(String claimDetails) {
        this.claimDetails = claimDetails;
    }

    public String getScheduledDate() {
        return scheduledDate;
    }

    public void setScheduledDate(String scheduledDate) {
        this.scheduledDate = scheduledDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getInvestigatorId() {
        return investigatorId;
    }

    public void setInvestigatorId(String investigatorId) {
        this.investigatorId = investigatorId;
    }

    public String getDamageSeverity() {
        return damageSeverity;
    }

    public void setDamageSeverity(String damageSeverity) {
        this.damageSeverity = damageSeverity;
    }

    public boolean isStructuralDamage() {
        return structuralDamage;
    }

    public void setStructuralDamage(boolean structuralDamage) {
        this.structuralDamage = structuralDamage;
    }

    public boolean isRoofDamage() {
        return roofDamage;
    }

    public void setRoofDamage(boolean roofDamage) {
        this.roofDamage = roofDamage;
    }

    public boolean isWaterDamage() {
        return waterDamage;
    }

    public void setWaterDamage(boolean waterDamage) {
        this.waterDamage = waterDamage;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<PhotoNote> getPhotoNotes() {
        return photoNotes;
    }

    public void setPhotoNotes(List<PhotoNote> photoNotes) {
        this.photoNotes = photoNotes;
    }

    public void addPhotoNote(PhotoNote photoNote) {
        photoNotes.add(photoNote);
        photoNote.setJob(this);
    }
}
