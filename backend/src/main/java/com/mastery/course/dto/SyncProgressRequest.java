package com.mastery.course.dto;

import java.util.Map;

public class SyncProgressRequest {

    private Map<String, Boolean> completed;
    private Map<String, LocalQuizScore> quizScores;

    public static class LocalQuizScore {
        private int score;
        private int total;

        public LocalQuizScore() {}

        public LocalQuizScore(int score, int total) {
            this.score = score;
            this.total = total;
        }

        public int getScore() { return score; }
        public void setScore(int score) { this.score = score; }
        public int getTotal() { return total; }
        public void setTotal(int total) { this.total = total; }
    }

    public SyncProgressRequest() {}

    public SyncProgressRequest(Map<String, Boolean> completed, Map<String, LocalQuizScore> quizScores) {
        this.completed = completed;
        this.quizScores = quizScores;
    }

    public Map<String, Boolean> getCompleted() { return completed; }
    public void setCompleted(Map<String, Boolean> completed) { this.completed = completed; }
    public Map<String, LocalQuizScore> getQuizScores() { return quizScores; }
    public void setQuizScores(Map<String, LocalQuizScore> quizScores) { this.quizScores = quizScores; }
}
