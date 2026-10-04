package com.mastery.course.dto;

import java.util.Map;
import java.util.Set;

public class UserProgressResponse {

    private Set<String> completedLessons;
    private Map<String, QuizScoreDto> quizScores;
    private int totalCompletedLessons;
    private int totalLessons = 56;
    private double completionPercentage;

    public static class QuizScoreDto {
        private int score;
        private int total;
        private boolean passed;

        public QuizScoreDto() {}

        public QuizScoreDto(int score, int total, boolean passed) {
            this.score = score;
            this.total = total;
            this.passed = passed;
        }

        public int getScore() { return score; }
        public void setScore(int score) { this.score = score; }
        public int getTotal() { return total; }
        public void setTotal(int total) { this.total = total; }
        public boolean isPassed() { return passed; }
        public void setPassed(boolean passed) { this.passed = passed; }
    }

    public UserProgressResponse() {}

    public UserProgressResponse(Set<String> completedLessons,
                                Map<String, QuizScoreDto> quizScores,
                                int totalCompletedLessons,
                                int totalLessons,
                                double completionPercentage) {
        this.completedLessons = completedLessons;
        this.quizScores = quizScores;
        this.totalCompletedLessons = totalCompletedLessons;
        this.totalLessons = totalLessons;
        this.completionPercentage = completionPercentage;
    }

    public Set<String> getCompletedLessons() { return completedLessons; }
    public void setCompletedLessons(Set<String> completedLessons) { this.completedLessons = completedLessons; }
    public Map<String, QuizScoreDto> getQuizScores() { return quizScores; }
    public void setQuizScores(Map<String, QuizScoreDto> quizScores) { this.quizScores = quizScores; }
    public int getTotalCompletedLessons() { return totalCompletedLessons; }
    public void setTotalCompletedLessons(int totalCompletedLessons) { this.totalCompletedLessons = totalCompletedLessons; }
    public int getTotalLessons() { return totalLessons; }
    public void setTotalLessons(int totalLessons) { this.totalLessons = totalLessons; }
    public double getCompletionPercentage() { return completionPercentage; }
    public void setCompletionPercentage(double completionPercentage) { this.completionPercentage = completionPercentage; }
}
