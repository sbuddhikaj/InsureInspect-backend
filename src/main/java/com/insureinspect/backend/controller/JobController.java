package com.insureinspect.backend.controller;

import com.insureinspect.backend.model.Job;
import com.insureinspect.backend.model.Photo;
import com.insureinspect.backend.model.PhotoNote;
import com.insureinspect.backend.repository.JobRepository;
import com.insureinspect.backend.repository.PhotoRepository;
import com.insureinspect.backend.repository.PhotoNoteRepository;
import com.insureinspect.backend.service.StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "*")
public class JobController {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private PhotoRepository photoRepository;

    @Autowired
    private PhotoNoteRepository photoNoteRepository;

    @Autowired
    private StorageService storageService;

    // 1. Get all jobs (with optional filter by investigatorId)
    @GetMapping
    public List<Job> getAllJobs(@RequestParam(required = false) String investigatorId) {
        if (investigatorId != null && !investigatorId.trim().isEmpty()) {
            return jobRepository.findByInvestigatorId(investigatorId);
        }
        return jobRepository.findAll();
    }

    // 2. Get details of a single job
    @GetMapping("/{id}")
    public ResponseEntity<Job> getJobById(@PathVariable Long id) {
        return jobRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. Dispatch/Create a new job
    @PostMapping
    public ResponseEntity<Job> createJob(@RequestBody Job job) {
        job.setStatus("Pending");
        job.setUpdatedAt(LocalDateTime.now());
        Job savedJob = jobRepository.save(job);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedJob);
    }

    // 4. Update job status
    @PutMapping("/{id}/status")
    public ResponseEntity<Job> updateJobStatus(@PathVariable Long id, @RequestParam String status) {
        Optional<Job> jobOpt = jobRepository.findById(id);
        if (jobOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Job job = jobOpt.get();
        job.setStatus(status);
        job.setUpdatedAt(LocalDateTime.now());
        Job updatedJob = jobRepository.save(job);
        return ResponseEntity.ok(updatedJob);
    }

    // 5. Submit investigation report (Transitions status to Completed)
    @PostMapping("/{id}/report")
    public ResponseEntity<Job> submitReport(
            @PathVariable Long id,
            @RequestBody Job reportData) {
        
        Optional<Job> jobOpt = jobRepository.findById(id);
        if (jobOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Job job = jobOpt.get();
        job.setDamageSeverity(reportData.getDamageSeverity());
        job.setStructuralDamage(reportData.isStructuralDamage());
        job.setRoofDamage(reportData.isRoofDamage());
        job.setWaterDamage(reportData.isWaterDamage());
        job.setNotes(reportData.getNotes());
        job.setStatus("Completed");
        job.setUpdatedAt(LocalDateTime.now());
        
        Job updatedJob = jobRepository.save(job);
        return ResponseEntity.ok(updatedJob);
    }

    // 6. Create a Photo Note for a Job
    @PostMapping("/{id}/photo-notes")
    public ResponseEntity<?> createPhotoNote(
            @PathVariable Long id,
            @RequestBody PhotoNote photoNote) {
        Optional<Job> jobOpt = jobRepository.findById(id);
        if (jobOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Job job = jobOpt.get();

        // Check for duplicate caption (case-insensitive trim)
        boolean isDuplicate = job.getPhotoNotes().stream()
                .anyMatch(n -> n.getCaption() != null && n.getCaption().trim().equalsIgnoreCase(photoNote.getCaption().trim()));
        if (isDuplicate) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("A photo note with this caption already exists for this job.");
        }

        photoNote.setJob(job);
        PhotoNote savedNote = photoNoteRepository.save(photoNote);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedNote);
    }

    // 7. Upload and attach a photo to a specific Photo Note
    @PostMapping("/photo-notes/{noteId}/photos")
    public ResponseEntity<?> uploadPhotoNoteImage(
            @PathVariable Long noteId,
            @RequestParam("file") MultipartFile file) {
        
        Optional<PhotoNote> noteOpt = photoNoteRepository.findById(noteId);
        if (noteOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("PhotoNote not found with ID " + noteId);
        }

        PhotoNote photoNote = noteOpt.get();
        try {
            // Upload to S3/MinIO
            String downloadUrl = storageService.uploadFile(photoNote.getJob().getId(), file);
            String s3Key = "jobs/" + photoNote.getJob().getId() + "/notes/" + noteId + "/" + file.getOriginalFilename();

            // Create and save Photo Entity
            Photo photo = new Photo(photoNote, file.getOriginalFilename(), s3Key, downloadUrl);
            Photo savedPhoto = photoRepository.save(photo);
            
            // Add reference to photo note
            photoNote.addPhoto(savedPhoto);
            photoNoteRepository.save(photoNote);

            return ResponseEntity.status(HttpStatus.CREATED).body(savedPhoto);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload photo: " + e.getMessage());
        }
    }

    // 8. Assign/reassign a job to an investigator and date
    @PutMapping("/{id}/assign")
    public ResponseEntity<Job> assignJob(
            @PathVariable Long id,
            @RequestParam String investigatorId,
            @RequestParam String scheduledDate) {
        
        Optional<Job> jobOpt = jobRepository.findById(id);
        if (jobOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Job job = jobOpt.get();
        job.setInvestigatorId(investigatorId);
        job.setScheduledDate(scheduledDate);
        job.setUpdatedAt(LocalDateTime.now());
        Job updatedJob = jobRepository.save(job);
        return ResponseEntity.ok(updatedJob);
    }

    // 9. Delete a job
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJob(@PathVariable Long id) {
        Optional<Job> jobOpt = jobRepository.findById(id);
        if (jobOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        jobRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // 10. Proxy/Download a photo from S3/MinIO
    @GetMapping("/photos/**")
    public ResponseEntity<byte[]> getPhoto(jakarta.servlet.http.HttpServletRequest request) {
        String path = request.getRequestURI();
        // Extract everything after "/api/jobs/photos/" and normalize any multiple slashes
        String s3Key = path.substring(path.indexOf("/photos/") + 8).replaceAll("/+", "/");
        if (s3Key.startsWith("/")) {
            s3Key = s3Key.substring(1);
        }

        try {
            com.insureinspect.backend.service.StorageService.S3ObjectInfo objectInfo = storageService.downloadFile(s3Key);
            
            // Resolve content-type (S3 stored type or extension-based lookup)
            String contentType = objectInfo.getContentType();
            if (contentType == null || contentType.trim().isEmpty() || contentType.equals("image/*") || contentType.equals("application/octet-stream")) {
                contentType = "image/jpeg"; // default fallback
                String lowerKey = s3Key.toLowerCase();
                if (lowerKey.endsWith(".png")) {
                    contentType = "image/png";
                } else if (lowerKey.endsWith(".gif")) {
                    contentType = "image/gif";
                } else if (lowerKey.endsWith(".webp")) {
                    contentType = "image/webp";
                } else if (lowerKey.endsWith(".bmp")) {
                    contentType = "image/bmp";
                }
            }

            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                    .body(objectInfo.getBytes());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    // 11. Delete a Photo Note
    @DeleteMapping("/photo-notes/{noteId}")
    public ResponseEntity<Void> deletePhotoNote(@PathVariable Long noteId) {
        Optional<PhotoNote> noteOpt = photoNoteRepository.findById(noteId);
        if (noteOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        photoNoteRepository.deleteById(noteId);
        return ResponseEntity.noContent().build();
    }

    // 12. Update an existing Photo Note
    @PutMapping("/photo-notes/{noteId}")
    public ResponseEntity<?> updatePhotoNote(
            @PathVariable Long noteId,
            @RequestBody PhotoNote updateData) {
        
        Optional<PhotoNote> noteOpt = photoNoteRepository.findById(noteId);
        if (noteOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PhotoNote photoNote = noteOpt.get();

        // Check for duplicate caption (excluding current note ID)
        boolean isDuplicate = photoNote.getJob().getPhotoNotes().stream()
                .anyMatch(n -> !n.getId().equals(noteId) && n.getCaption() != null && n.getCaption().trim().equalsIgnoreCase(updateData.getCaption().trim()));
        if (isDuplicate) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("A photo note with this caption already exists for this job.");
        }

        photoNote.setCaption(updateData.getCaption());
        photoNote.setNote(updateData.getNote());
        
        PhotoNote savedNote = photoNoteRepository.save(photoNote);
        return ResponseEntity.ok(savedNote);
    }
}
