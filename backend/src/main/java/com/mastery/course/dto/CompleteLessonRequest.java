package com.mastery.course.dto;

import jakarta.validation.constraints.NotBlank;

public class CompleteLessonRequest {

    @NotBlank(message = "lessonId không được để trống")
    private String lessonId;

    public CompleteLessonRequest() {}

    public CompleteLessonRequest(String lessonId) {
        this.lessonId = lessonId;
    }

    public String getLessonId() { return lessonId; }
    public void setLessonId(String lessonId) { this.lessonId = lessonId; }
}
