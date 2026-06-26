package com.insureinspect.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "photos")
public class Photo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "photo_note_id", nullable = false)
    @JsonIgnore
    private PhotoNote photoNote;

    private String filename;
    private String s3Key;
    
    @Column(length = 2000)
    private String downloadUrl;
    
    private LocalDateTime capturedAt;

    public Photo() {
        this.capturedAt = LocalDateTime.now();
    }

    public Photo(PhotoNote photoNote, String filename, String s3Key, String downloadUrl) {
        this.photoNote = photoNote;
        this.filename = filename;
        this.s3Key = s3Key;
        this.downloadUrl = downloadUrl;
        this.capturedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PhotoNote getPhotoNote() {
        return photoNote;
    }

    public void setPhotoNote(PhotoNote photoNote) {
        this.photoNote = photoNote;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public String getS3Key() {
        return s3Key;
    }

    public void setS3Key(String s3Key) {
        this.s3Key = s3Key;
    }

    public String getDownloadUrl() {
        return downloadUrl;
    }

    public void setDownloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
    }

    public LocalDateTime getCapturedAt() {
        return capturedAt;
    }

    public void setCapturedAt(LocalDateTime capturedAt) {
        this.capturedAt = capturedAt;
    }
}
