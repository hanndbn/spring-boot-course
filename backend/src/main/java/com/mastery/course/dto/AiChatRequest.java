package com.mastery.course.dto;

public class AiChatRequest {
    private String lessonId;
    private String lessonTitle;
    private String lessonContent;
    private String question;

    public AiChatRequest() {}

    public AiChatRequest(String lessonId, String lessonTitle, String lessonContent, String question) {
        this.lessonId = lessonId;
        this.lessonTitle = lessonTitle;
        this.lessonContent = lessonContent;
        this.question = question;
    }

    public String getLessonId() { return lessonId; }
    public void setLessonId(String lessonId) { this.lessonId = lessonId; }

    public String getLessonTitle() { return lessonTitle; }
    public void setLessonTitle(String lessonTitle) { this.lessonTitle = lessonTitle; }

    public String getLessonContent() { return lessonContent; }
    public void setLessonContent(String lessonContent) { this.lessonContent = lessonContent; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
}
