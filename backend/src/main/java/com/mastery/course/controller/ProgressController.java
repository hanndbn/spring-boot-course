package com.mastery.course.controller;

import com.mastery.course.dto.CompleteLessonRequest;
import com.mastery.course.dto.SubmitQuizRequest;
import com.mastery.course.dto.SyncProgressRequest;
import com.mastery.course.dto.UserProgressResponse;
import com.mastery.course.service.ProgressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/progress")
@Tag(name = "Progress", description = "Các API lưu trữ và đồng bộ tiến độ học tập, bài thi trắc nghiệm")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping
    @Operation(summary = "Lấy toàn bộ tiến độ học tập và điểm số của học viên hiện tại")
    public ResponseEntity<UserProgressResponse> getProgress(@AuthenticationPrincipal UserDetails userDetails) {
        UserProgressResponse progress = progressService.getUserProgress(userDetails.getUsername());
        return ResponseEntity.ok(progress);
    }

    @PostMapping("/complete-lesson")
    @Operation(summary = "Đánh dấu một bài học là đã hoàn thành")
    public ResponseEntity<Map<String, Object>> completeLesson(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CompleteLessonRequest request) {
        progressService.completeLesson(userDetails.getUsername(), request);
        return ResponseEntity.ok(Map.of("success", true, "lessonId", request.getLessonId(), "completed", true));
    }

    @DeleteMapping("/lessons/{lessonId}")
    @Operation(summary = "Hủy đánh dấu hoàn thành bài học")
    public ResponseEntity<Map<String, Object>> uncompleteLesson(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String lessonId) {
        progressService.uncompleteLesson(userDetails.getUsername(), lessonId);
        return ResponseEntity.ok(Map.of("success", true, "lessonId", lessonId, "completed", false));
    }

    @PostMapping("/quiz-result")
    @Operation(summary = "Lưu kết quả bài thi trắc nghiệm của một module")
    public ResponseEntity<Map<String, Object>> submitQuizResult(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SubmitQuizRequest request) {
        progressService.submitQuizResult(userDetails.getUsername(), request);
        return ResponseEntity.ok(Map.of("success", true, "moduleId", request.getModuleId(), "score", request.getScore()));
    }

    @PostMapping("/sync")
    @Operation(summary = "Đồng bộ gộp toàn bộ tiến độ từ LocalStorage lên Cloud Database")
    public ResponseEntity<UserProgressResponse> syncProgress(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody SyncProgressRequest request) {
        UserProgressResponse synced = progressService.syncProgress(userDetails.getUsername(), request);
        return ResponseEntity.ok(synced);
    }
}
