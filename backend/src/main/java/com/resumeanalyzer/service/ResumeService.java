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

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.UUID;

@Service
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final SupabaseStorageService supabaseStorageService;

    public ResumeService(ResumeRepository resumeRepository,
                         UserRepository userRepository,
                         SupabaseStorageService supabaseStorageService) {
        this.resumeRepository = resumeRepository;
        this.userRepository = userRepository;
        this.supabaseStorageService = supabaseStorageService;
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

        byte[] fileBytes = file.getBytes();
        String text = cleanExtractedText(extractTextFromBytes(fileBytes, originalFileName));

        String storedFileName = UUID.randomUUID().toString() + "." + extension;
        String supabaseLink = supabaseStorageService.getFileUrl(storedFileName);

        Resume resume = Resume.builder()
            .user(user)
            .fileName(originalFileName)
            .fileType(extension.toUpperCase(Locale.ROOT))
            .filePath(supabaseLink)
            .extractedText(text)
            .build();

        Resume savedResume = resumeRepository.save(resume);

        try {
            supabaseStorageService.saveFile(storedFileName, extension, fileBytes);
        } catch (Exception e) {
            // Log warning but continue if Supabase is not configured
        }

        return savedResume;
    }

    public byte[] getResumeFile(Long resumeId) {
        Resume resume = resumeRepository.findById(resumeId).orElse(null);
        if (resume == null || resume.getFilePath() == null) return null;
        String filePath = resume.getFilePath();
        String storedFileName = filePath.substring(filePath.lastIndexOf("/") + 1);
        return supabaseStorageService.getFile(storedFileName);
    }

    public String extractTextFromBytes(byte[] bytes, String fileName) throws IOException {
        String lower = fileName.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".txt")) {
            return new String(bytes, StandardCharsets.UTF_8);
        }

        if (lower.endsWith(".pdf")) {
            try (PDDocument document = Loader.loadPDF(bytes)) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(document);
            }
        }

        if (lower.endsWith(".docx")) {
            try (InputStream is = new ByteArrayInputStream(bytes);
                 XWPFDocument document = new XWPFDocument(is);
                 XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
                return extractor.getText();
            }
        }

        return new String(bytes, StandardCharsets.UTF_8);
    }

    public void deleteResume(Long resumeId, Long userId) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new IllegalArgumentException("Resume not found"));

        if (!resume.getUser().getId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("Forbidden");
        }

        if (resume.getFilePath() != null) {
            try {
                String filePath = resume.getFilePath();
                String storedFileName = filePath.substring(filePath.lastIndexOf("/") + 1);
                supabaseStorageService.deleteFile(storedFileName);
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
