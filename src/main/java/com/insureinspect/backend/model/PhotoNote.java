package com.insureinspect.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "photo_notes")
public class PhotoNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = true)
    @JsonIgnore
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_visit_id", nullable = true)
    @JsonIgnore
    private SiteVisit siteVisit;

    private String caption;
    
    @Column(length = 4000)
    private String note;

    private String location;
    private String subLocation;

    @OneToMany(mappedBy = "photoNote", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Photo> photos = new ArrayList<>();

    public PhotoNote() {}

    public PhotoNote(Job job, String caption, String note) {
        this.job = job;
        this.caption = caption;
        this.note = note;
    }

    public PhotoNote(SiteVisit siteVisit, String caption, String note) {
        this.siteVisit = siteVisit;
        this.job = siteVisit.getJob();
        this.caption = caption;
        this.note = note;
    }

    public PhotoNote(Job job, String caption, String note, String location, String subLocation) {
        this.job = job;
        this.caption = caption;
        this.note = note;
        this.location = location;
        this.subLocation = subLocation;
    }

    public PhotoNote(SiteVisit siteVisit, String caption, String note, String location, String subLocation) {
        this.siteVisit = siteVisit;
        this.job = siteVisit.getJob();
        this.caption = caption;
        this.note = note;
        this.location = location;
        this.subLocation = subLocation;
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

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getSubLocation() {
        return subLocation;
    }

    public void setSubLocation(String subLocation) {
        this.subLocation = subLocation;
    }

    public List<Photo> getPhotos() {
        return photos;
    }

    public void setPhotos(List<Photo> photos) {
        this.photos = photos;
    }

    public SiteVisit getSiteVisit() {
        return siteVisit;
    }

    public void setSiteVisit(SiteVisit siteVisit) {
        this.siteVisit = siteVisit;
    }

    public void addPhoto(Photo photo) {
        photos.add(photo);
        photo.setPhotoNote(this);
    }
}
