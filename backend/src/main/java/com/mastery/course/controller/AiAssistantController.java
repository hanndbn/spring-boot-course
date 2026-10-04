package com.mastery.course.controller;

import com.mastery.course.dto.AiChatRequest;
import com.mastery.course.dto.AiChatResponse;
import com.mastery.course.service.ZaiAiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@Tag(name = "AI Assistant", description = "Trợ lý AI Giảng Viên tích hợp Official Z.AI SDK (GLM-5.3)")
public class AiAssistantController {

    private final ZaiAiService zaiAiService;

    public AiAssistantController(ZaiAiService zaiAiService) {
        this.zaiAiService = zaiAiService;
    }

    @PostMapping("/chat")
    @Operation(summary = "Gửi câu hỏi cho Trợ lý AI theo ngữ cảnh bài học với GLM-5.3")
    public ResponseEntity<AiChatResponse> askAssistant(@RequestBody AiChatRequest request) {
        AiChatResponse response = zaiAiService.askLessonAssistant(request);
        return ResponseEntity.ok(response);
    }
}
