package com.resumeanalyzer.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import jakarta.annotation.PostConstruct;
import java.util.Map;

@Service
public class SupabaseStorageService {

    private static final Logger log = LoggerFactory.getLogger(SupabaseStorageService.class);

    @Value("${app.supabase.url:}")
    private String supabaseUrl;

    @Value("${app.supabase.key:}")
    private String supabaseKey;

    @Value("${app.supabase.bucket:resumes}")
    private String bucketName;

    private WebClient webClient;
    private boolean isEnabled = false;

    @PostConstruct
    public void init() {
        if (supabaseUrl == null || supabaseUrl.isBlank() || supabaseKey == null || supabaseKey.isBlank()) {
            log.warn("Supabase Storage credentials are not fully configured. Supabase file storage will be bypassed.");
            return;
        }

        // Normalize URL
        String url = supabaseUrl.trim();
        if (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }

        this.webClient = WebClient.builder()
                .baseUrl(url)
                .defaultHeader("Authorization", "Bearer " + supabaseKey.trim())
                .defaultHeader("apikey", supabaseKey.trim())
                .defaultHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .build();

        this.isEnabled = true;
        
        try {
            ensureBucketExists();
        } catch (Exception e) {
            log.error("Failed to ensure Supabase Storage bucket exists. Service will be disabled.", e);
            this.isEnabled = false;
        }
    }

    public boolean isEnabled() {
        return isEnabled;
    }

    private void ensureBucketExists() {
        if (!isEnabled) return;

        log.info("Checking if Supabase Storage bucket '{}' exists...", bucketName);
        try {
            webClient.get()
                    .uri("/storage/v1/bucket/{bucket}", bucketName)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            log.info("Supabase Storage bucket '{}' already exists.", bucketName);
        } catch (WebClientResponseException e) {
            String responseBody = e.getResponseBodyAsString();
            boolean isNotFound = e.getStatusCode() == HttpStatus.NOT_FOUND
                    || (e.getStatusCode() == HttpStatus.BAD_REQUEST && (responseBody.contains("Bucket not found") || responseBody.contains("NoSuchBucket")));

            if (isNotFound) {
                log.info("Bucket '{}' not found. Creating it...", bucketName);
                createBucket();
            } else {
                log.error("Error checking bucket status: {} - {}", e.getStatusCode(), responseBody);
                throw e;
            }
        } catch (Exception e) {
            log.error("Unexpected error checking bucket existence: ", e);
            throw e;
        }
    }

    private void createBucket() {
        try {
            webClient.post()
                    .uri("/storage/v1/bucket")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of(
                            "id", bucketName,
                            "name", bucketName,
                            "public", false
                    ))
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            log.info("Supabase Storage bucket '{}' created successfully.", bucketName);
        } catch (Exception e) {
            log.error("Failed to create Supabase Storage bucket '{}'", bucketName, e);
            throw e;
        }
    }

    public void saveFile(String fileName, String fileType, byte[] content) {
        if (!isEnabled) {
            log.warn("Supabase Storage is disabled. Skipping upload for file: {}", fileName);
            return;
        }

        String contentType = getMimeType(fileType);
        log.info("Uploading file '{}' to Supabase bucket '{}'...", fileName, bucketName);

        try {
            // Uploading via POST (or PUT if overwriting)
            webClient.post()
                    .uri("/storage/v1/object/{bucket}/{name}", bucketName, fileName)
                    .contentType(MediaType.parseMediaType(contentType))
                    .bodyValue(content)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            log.info("Successfully uploaded file '{}' to Supabase Storage.", fileName);
        } catch (WebClientResponseException e) {
            // If file already exists, try PUT to overwrite
            if (e.getStatusCode() == HttpStatus.BAD_REQUEST && e.getResponseBodyAsString().contains("Already exists")) {
                log.info("File '{}' already exists. Overwriting with PUT...", fileName);
                try {
                    webClient.put()
                            .uri("/storage/v1/object/{bucket}/{name}", bucketName, fileName)
                            .contentType(MediaType.parseMediaType(contentType))
                            .bodyValue(content)
                            .retrieve()
                            .toBodilessEntity()
                            .block();
                    log.info("Successfully overwrote file '{}' in Supabase Storage.", fileName);
                } catch (Exception ex) {
                    log.error("Failed to overwrite existing file '{}' in Supabase Storage", fileName, ex);
                    throw new RuntimeException("Failed to overwrite file in Supabase Storage", ex);
                }
            } else {
                log.error("Failed to upload file '{}' to Supabase Storage: {} - {}", fileName, e.getStatusCode(), e.getResponseBodyAsString());
                throw new RuntimeException("Failed to upload file to Supabase Storage", e);
            }
        } catch (Exception e) {
            log.error("Unexpected error uploading file '{}' to Supabase Storage", fileName, e);
            throw new RuntimeException("Failed to upload file to Supabase Storage", e);
        }
    }

    public byte[] getFile(String fileName) {
        if (!isEnabled) {
            log.warn("Supabase Storage is disabled. Cannot retrieve file: {}", fileName);
            return null;
        }

        log.info("Retrieving file '{}' from Supabase bucket '{}'...", fileName, bucketName);
        try {
            return webClient.get()
                    .uri("/storage/v1/object/authenticated/{bucket}/{name}", bucketName, fileName)
                    .retrieve()
                    .bodyToMono(byte[].class)
                    .block();
        } catch (Exception e) {
            log.error("Failed to retrieve file '{}' from Supabase Storage", fileName, e);
            return null;
        }
    }

    public String getFileUrl(String fileName) {
        String url = supabaseUrl != null ? supabaseUrl.trim() : "";
        if (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        return url + "/storage/v1/object/authenticated/" + bucketName + "/" + fileName;
    }

    public void deleteFile(String fileName) {
        if (!isEnabled) {
            log.warn("Supabase Storage is disabled. Skipping delete for file: {}", fileName);
            return;
        }

        log.info("Deleting file '{}' from Supabase bucket '{}'...", fileName, bucketName);
        try {
            webClient.delete()
                    .uri("/storage/v1/object/{bucket}/{name}", bucketName, fileName)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            log.info("Deleted file '{}' from Supabase Storage.", fileName);
        } catch (Exception e) {
            log.error("Failed to delete file '{}' from Supabase Storage", fileName, e);
        }
    }

    private String getMimeType(String fileType) {
        if (fileType == null) return "application/octet-stream";
        String upper = fileType.toUpperCase();
        if (upper.contains("PDF")) return "application/pdf";
        if (upper.contains("DOCX") || upper.contains("WORD")) {
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        if (upper.contains("TXT") || upper.contains("TEXT")) return "text/plain";
        return "application/octet-stream";
    }
}
