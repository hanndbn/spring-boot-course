package com.mastery.course.service;

import ai.z.openapi.ZaiClient;
import ai.z.openapi.service.model.*;
import com.mastery.course.dto.AiChatRequest;
import com.mastery.course.dto.AiChatResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;

/**
 * Service tích hợp mô hình Z.AI GLM-5.3 với Deep Reasoning
 */
@Service
public class ZaiAiService {

    private static final Logger log = LoggerFactory.getLogger(ZaiAiService.class);

    private final ZaiClient zaiClient;

    @Value("${app.zai.model:glm-5.3}")
    private String defaultModel;

    public ZaiAiService(ZaiClient zaiClient) {
        this.zaiClient = zaiClient;
    }

    public AiChatResponse askLessonAssistant(AiChatRequest request) {
        try {
            String systemPrompt = String.format(
                "Bạn là Trợ lý AI Giảng Viên cao cấp phụ trách môn Spring Boot & Microservices Enterprise.\n" +
                "Ngữ cảnh bài học hiện tại: [%s] %s\n" +
                "Nội dung bài học:\n%s\n\n" +
                "Hãy giải đáp chi tiết, chuyên nghiệp, chuẩn phong cách kỹ thuật Spring Boot 3+ (Spring Framework 6+). " +
                "Kèm theo mã nguồn minh họa, lưu ý cạm bẫy thực tế (Pitfalls) và hướng dẫn tối ưu hiệu năng.",
                request.getLessonId() != null ? request.getLessonId() : "Spring-Boot",
                request.getLessonTitle() != null ? request.getLessonTitle() : "Bài học",
                request.getLessonContent() != null ? request.getLessonContent() : ""
            );

            ChatCompletionCreateParams params = ChatCompletionCreateParams.builder()
                .model(defaultModel)
                .messages(Arrays.asList(
                    ChatMessage.builder()
                        .role(ChatMessageRole.SYSTEM.value())
                        .content(systemPrompt)
                        .build(),
                    ChatMessage.builder()
                        .role(ChatMessageRole.USER.value())
                        .content(request.getQuestion())
                        .build()
                ))
                .thinking(ChatThinking.builder().type("enabled").build())
                .reasoningEffort("max")
                .maxTokens(4096)
                .temperature(1.0f)
                .build();

            ChatCompletionResponse response = zaiClient.chat().createChatCompletion(params);

            if (response != null && response.isSuccess() && response.getData() != null) {
                var choice = response.getData().getChoices().get(0);
                String content = choice.getMessage().getContent() != null ? choice.getMessage().getContent().toString() : "";
                String reasoning = choice.getMessage().getReasoningContent();
                return AiChatResponse.success(content, reasoning, defaultModel);
            } else {
                String errMsg = response != null ? response.getMsg() : "Không nhận được phản hồi từ Z.AI API";
                log.error("Z.AI API error: {}", errMsg);
                return AiChatResponse.failure(errMsg);
            }
        } catch (Exception ex) {
            log.error("Exception when communicating with Z.AI: ", ex);
            return AiChatResponse.failure("Lỗi hệ thống: " + ex.getMessage());
        }
    }
}
