package com.mastery.course.config;

import ai.z.openapi.ZaiClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cấu hình kết nối Official Z.AI SDK (GLM-5.3)
 * Tham khảo: https://docs.z.ai/guides/llm/glm-5.3#official-java-sdk
 */
@Configuration
public class ZaiAiConfig {

    @Value("${app.zai.api-key:956ae6441b544ca9bd4a8ca5e9365e9b.HuNNqhvpWh5lmkoM}")
    private String apiKey;

    @Bean
    public ZaiClient zaiClient() {
        return ZaiClient.builder()
                .ofZAI() // Cổng kết nối chuẩn Z.AI quốc tế (api.z.ai)
                .apiKey(apiKey.trim())
                .build();
    }
}
