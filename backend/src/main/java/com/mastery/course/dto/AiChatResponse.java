package com.mastery.course.dto;

public class AiChatResponse {
    private String content;
    private String reasoningContent;
    private String model;
    private boolean success;
    private String error;

    public AiChatResponse() {}

    public static AiChatResponse success(String content, String reasoningContent, String model) {
        AiChatResponse res = new AiChatResponse();
        res.content = content;
        res.reasoningContent = reasoningContent;
        res.model = model;
        res.success = true;
        return res;
    }

    public static AiChatResponse failure(String error) {
        AiChatResponse res = new AiChatResponse();
        res.error = error;
        res.success = false;
        return res;
    }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getReasoningContent() { return reasoningContent; }
    public void setReasoningContent(String reasoningContent) { this.reasoningContent = reasoningContent; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}
