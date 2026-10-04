package com.mastery.course.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class SubmitQuizRequest {

    @NotBlank(message = "moduleId không được để trống")
    private String moduleId;

    @Min(value = 0, message = "score không được âm")
    private int score;

    @Min(value = 1, message = "totalQuestions phải lớn hơn 0")
    private int totalQuestions;

    public SubmitQuizRequest() {}

    public SubmitQuizRequest(String moduleId, int score, int totalQuestions) {
        this.moduleId = moduleId;
        this.score = score;
        this.totalQuestions = totalQuestions;
    }

    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
}
