package com.insureinspect.backend.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.util.UUID;

@Service
public class StorageService {

    @Autowired
    private S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.s3.endpoint}")
    private String endpoint;

    @PostConstruct
    public void init() {
        try {
            // Check if bucket exists
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
        } catch (NoSuchBucketException e) {
            // Create the bucket
            s3Client.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
            
            // Set bucket policy to allow anonymous public reads (so Android app can retrieve images via direct URL)
            String publicPolicy = "{\n" +
                    "  \"Version\": \"2012-10-17\",\n" +
                    "  \"Statement\": [\n" +
                    "    {\n" +
                    "      \"Sid\": \"PublicRead\",\n" +
                    "      \"Effect\": \"Allow\",\n" +
                    "      \"Principal\": \"*\",\n" +
                    "      \"Action\": [\"s3:GetObject\"],\n" +
                    "      \"Resource\": [\"arn:aws:s3:::" + bucket + "/*\"]\n" +
                    "    }\n" +
                    "  ]\n" +
                    "}";
            
            s3Client.putBucketPolicy(PutBucketPolicyRequest.builder()
                    .bucket(bucket)
                    .policy(publicPolicy)
                    .build());
            System.out.println("Created S3 bucket '" + bucket + "' with public read access policy.");
        } catch (Exception e) {
            System.err.println("Could not initialize S3 bucket: " + e.getMessage() + ". (Ignore if using mock or offline S3 client)");
        }
    }

    public String uploadFile(Long jobId, MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        // Generate a unique S3 key
        String s3Key = "jobs/" + jobId + "/" + UUID.randomUUID().toString() + extension;

        // Determine concrete Content-Type
        String contentType = file.getContentType();
        if (contentType == null || contentType.trim().isEmpty() || contentType.equals("image/*") || contentType.equals("application/octet-stream")) {
            contentType = "image/jpeg"; // default fallback
            String lowerName = originalFilename != null ? originalFilename.toLowerCase() : "";
            if (lowerName.endsWith(".png")) {
                contentType = "image/png";
            } else if (lowerName.endsWith(".gif")) {
                contentType = "image/gif";
            } else if (lowerName.endsWith(".webp")) {
                contentType = "image/webp";
            } else if (lowerName.endsWith(".bmp")) {
                contentType = "image/bmp";
            }
        }

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .contentType(contentType)
                .acl(ObjectCannedACL.PUBLIC_READ) // Set public-read access for the individual object
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        // Return the relative proxy path
        return "/api/jobs/photos/" + s3Key;
    }

    public S3ObjectInfo downloadFile(String s3Key) throws IOException {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(s3Key)
                .build();
        
        try (var response = s3Client.getObject(getObjectRequest)) {
            byte[] bytes = response.readAllBytes();
            String contentType = response.response().contentType();
            return new S3ObjectInfo(bytes, contentType);
        }
    }

    public static class S3ObjectInfo {
        private final byte[] bytes;
        private final String contentType;

        public S3ObjectInfo(byte[] bytes, String contentType) {
            this.bytes = bytes;
            this.contentType = contentType;
        }

        public byte[] getBytes() {
            return bytes;
        }

        public String getContentType() {
            return contentType;
        }
    }
}
