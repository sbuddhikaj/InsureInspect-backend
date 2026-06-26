package com.insureinspect.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "site_visits")
public class SiteVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    @JsonIgnore
    private Job job;

    private String visitDate; // Format: "yyyy-MM-dd HH:mm"

    // First visit fields
    private String siteRoomType;
    
    @Column(length = 2000)
    private String otherLocationsData;
    
    @Column(length = 2000)
    private String sitePhotoUrl;
    private String sitePhotoS3Key;

    // Investigation findings
    private String damageSeverity; // Low, Medium, High, Critical
    private boolean structuralDamage;
    private boolean roofDamage;
    private boolean waterDamage;

    @Column(length = 4000)
    private String notes;

    private Double latitude;
    private Double longitude;

    private Double moisture;
    private Double temperature;
    private Double humidity;

    @OneToMany(mappedBy = "siteVisit", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PhotoNote> photoNotes = new ArrayList<>();

    @OneToMany(mappedBy = "siteVisit", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoomLocation> roomLocations = new ArrayList<>();

    @OneToMany(mappedBy = "siteVisit", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ComplianceForm> complianceForms = new ArrayList<>();

    public SiteVisit() {}

    public SiteVisit(Job job, String visitDate) {
        this.job = job;
        this.visitDate = visitDate;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Job getJob() {
        return job;
    }

    public void setJob(Job job) {
        this.job = job;
    }

    public String getVisitDate() {
        return visitDate;
    }

    public void setVisitDate(String visitDate) {
        this.visitDate = visitDate;
    }

    public String getSiteRoomType() {
        return siteRoomType;
    }

    public void setSiteRoomType(String siteRoomType) {
        this.siteRoomType = siteRoomType;
    }

    public String getOtherLocationsData() {
        return otherLocationsData;
    }

    public void setOtherLocationsData(String otherLocationsData) {
        this.otherLocationsData = otherLocationsData;
    }

    public String getSitePhotoUrl() {
        return sitePhotoUrl;
    }

    public void setSitePhotoUrl(String sitePhotoUrl) {
        this.sitePhotoUrl = sitePhotoUrl;
    }

    public String getSitePhotoS3Key() {
        return sitePhotoS3Key;
    }

    public void setSitePhotoS3Key(String sitePhotoS3Key) {
        this.sitePhotoS3Key = sitePhotoS3Key;
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

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public List<PhotoNote> getPhotoNotes() {
        return photoNotes;
    }

    public void setPhotoNotes(List<PhotoNote> photoNotes) {
        this.photoNotes = photoNotes;
    }

    public void addPhotoNote(PhotoNote photoNote) {
        photoNotes.add(photoNote);
        photoNote.setSiteVisit(this);
    }

    public Double getMoisture() {
        return moisture;
    }

    public void setMoisture(Double moisture) {
        this.moisture = moisture;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Double getHumidity() {
        return humidity;
    }

    public void setHumidity(Double humidity) {
        this.humidity = humidity;
    }

    public List<RoomLocation> getRoomLocations() {
        return roomLocations;
    }

    public void setRoomLocations(List<RoomLocation> roomLocations) {
        this.roomLocations = roomLocations;
    }

    public void addRoomLocation(RoomLocation roomLocation) {
        roomLocations.add(roomLocation);
        roomLocation.setSiteVisit(this);
    }

    public List<ComplianceForm> getComplianceForms() {
        return complianceForms;
    }

    public void setComplianceForms(List<ComplianceForm> complianceForms) {
        this.complianceForms = complianceForms;
    }

    public void addComplianceForm(ComplianceForm complianceForm) {
        complianceForms.add(complianceForm);
        complianceForm.setSiteVisit(this);
    }
}
