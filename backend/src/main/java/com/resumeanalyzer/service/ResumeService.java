package com.resumeanalyzer.service;

import com.resumeanalyzer.entity.Resume;
import com.resumeanalyzer.entity.User;
import com.resumeanalyzer.repository.ResumeRepository;
import com.resumeanalyzer.repository.UserRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;

@Service
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final Path uploadDir;

    public ResumeService(ResumeRepository resumeRepository,
                         UserRepository userRepository,
                         @Value("${app.file-storage.upload-dir:./uploads}") String uploadDir) {
        this.resumeRepository = resumeRepository;
        this.userRepository = userRepository;
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDir);
        } catch (IOException e) {
            throw new IllegalStateException("Unable to create upload directory", e);
        }
    }

    public Resume uploadResume(Long userId, MultipartFile file) throws IOException {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }

        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.isBlank()) {
            originalFileName = "resume.txt";
        }
        String extension = getExtension(originalFileName);
        if (!"pdf".equalsIgnoreCase(extension) && !"docx".equalsIgnoreCase(extension) && !"txt".equalsIgnoreCase(extension)) {
            throw new IllegalArgumentException("Only PDF, DOCX, and TXT files are supported");
        }

        String storedFileName = UUID.randomUUID() + "." + extension;
        Path destination = uploadDir.resolve(storedFileName);
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

        String text = cleanExtractedText(extractTextFromPath(destination));

        Resume resume = Resume.builder()
            .user(user)
            .fileName(originalFileName)
            .fileType(extension.toUpperCase(Locale.ROOT))
            .filePath(destination.toString())
            .extractedText(text)
            .build();

        return resumeRepository.save(resume);
    }

    public String extractTextFromPath(Path path) throws IOException {
        String lower = path.getFileName().toString().toLowerCase(Locale.ROOT);
        if (lower.endsWith(".txt")) {
            return Files.readString(path, StandardCharsets.UTF_8);
        }

        if (lower.endsWith(".pdf")) {
            File pdfFile = path.toFile();
            try (PDDocument document = Loader.loadPDF(pdfFile)) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(document);
            }
        }

        if (lower.endsWith(".docx")) {
            try (InputStream is = Files.newInputStream(path);
                 XWPFDocument document = new XWPFDocument(is);
                 XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
                return extractor.getText();
            }
        }

        return Files.readString(path, StandardCharsets.UTF_8);
    }

    public void deleteResume(Long resumeId, Long userId) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new IllegalArgumentException("Resume not found"));

        if (!resume.getUser().getId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("Forbidden");
        }

        if (resume.getFilePath() != null) {
            try {
                Path file = Paths.get(resume.getFilePath());
                Files.deleteIfExists(file);
            } catch (Exception ignored) {
            }
        }

        resumeRepository.delete(resume);
    }

    public static String cleanExtractedText(String text) {
        if (text == null) return "";
        // Remove control characters (except newline/tab/carriage return) and normalize spaces
        String cleaned = text.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", " ")
                             .replaceAll("\r\n", "\n")
                             .replaceAll("\r", "\n")
                             .replaceAll("[ \t]+", " ")
                             .replaceAll("\n{3,}", "\n\n")
                             .trim();
        return cleaned;
    }

    private String getExtension(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "txt";
        }
        int lastDot = fileName.lastIndexOf('.');
        return lastDot >= 0 ? fileName.substring(lastDot + 1).toLowerCase(Locale.ROOT) : "txt";
    }
}
