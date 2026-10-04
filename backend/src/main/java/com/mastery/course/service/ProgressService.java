package com.mastery.course.service;

import com.mastery.course.dto.CompleteLessonRequest;
import com.mastery.course.dto.SubmitQuizRequest;
import com.mastery.course.dto.SyncProgressRequest;
import com.mastery.course.dto.UserProgressResponse;
import com.mastery.course.entity.User;
import com.mastery.course.entity.UserLessonProgress;
import com.mastery.course.entity.UserQuizResult;
import com.mastery.course.exception.ResourceNotFoundException;
import com.mastery.course.repository.UserLessonProgressRepository;
import com.mastery.course.repository.UserQuizResultRepository;
import com.mastery.course.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProgressService {

    private static final int TOTAL_COURSE_LESSONS = 56;

    private final UserRepository userRepository;
    private final UserLessonProgressRepository lessonProgressRepository;
    private final UserQuizResultRepository quizResultRepository;

    public ProgressService(UserRepository userRepository,
                           UserLessonProgressRepository lessonProgressRepository,
                           UserQuizResultRepository quizResultRepository) {
        this.userRepository = userRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.quizResultRepository = quizResultRepository;
    }

    @Transactional(readOnly = true)
    public UserProgressResponse getUserProgress(String username) {
        User user = findUser(username);

        List<UserLessonProgress> lessons = lessonProgressRepository.findAllByUser(user);
        Set<String> completedLessons = lessons.stream()
                .filter(UserLessonProgress::isCompleted)
                .map(UserLessonProgress::getLessonId)
                .collect(Collectors.toSet());

        List<UserQuizResult> quizzes = quizResultRepository.findAllByUser(user);
        Map<String, UserProgressResponse.QuizScoreDto> quizMap = new HashMap<>();
        for (UserQuizResult q : quizzes) {
            quizMap.put(q.getModuleId(), new UserProgressResponse.QuizScoreDto(
                    q.getScore(),
                    q.getTotalQuestions(),
                    q.isPassed()
            ));
        }

        int totalCompleted = completedLessons.size();
        double percentage = Math.round(((double) totalCompleted / TOTAL_COURSE_LESSONS) * 1000.0) / 10.0;

        return new UserProgressResponse(
                completedLessons,
                quizMap,
                totalCompleted,
                TOTAL_COURSE_LESSONS,
                Math.min(100.0, percentage)
        );
    }

    @Transactional
    public void completeLesson(String username, CompleteLessonRequest request) {
        User user = findUser(username);
        Optional<UserLessonProgress> existing = lessonProgressRepository.findByUserAndLessonId(user, request.getLessonId());

        if (existing.isPresent()) {
            UserLessonProgress progress = existing.get();
            progress.setCompleted(true);
            lessonProgressRepository.save(progress);
        } else {
            UserLessonProgress newProgress = new UserLessonProgress(user, request.getLessonId(), true);
            lessonProgressRepository.save(newProgress);
        }
    }

    @Transactional
    public void uncompleteLesson(String username, String lessonId) {
        User user = findUser(username);
        Optional<UserLessonProgress> existing = lessonProgressRepository.findByUserAndLessonId(user, lessonId);
        existing.ifPresent(p -> {
            p.setCompleted(false);
            lessonProgressRepository.save(p);
        });
    }

    @Transactional
    public void submitQuizResult(String username, SubmitQuizRequest request) {
        User user = findUser(username);
        boolean passed = request.getScore() >= Math.ceil(request.getTotalQuestions() * 0.7);

        Optional<UserQuizResult> existing = quizResultRepository.findByUserAndModuleId(user, request.getModuleId());
        if (existing.isPresent()) {
            UserQuizResult result = existing.get();
            // Lưu kết quả điểm cao nhất
            if (request.getScore() > result.getScore()) {
                result.setScore(request.getScore());
                result.setTotalQuestions(request.getTotalQuestions());
                result.setPassed(passed);
                quizResultRepository.save(result);
            }
        } else {
            UserQuizResult newResult = new UserQuizResult(
                    user,
                    request.getModuleId(),
                    request.getScore(),
                    request.getTotalQuestions(),
                    passed
            );
            quizResultRepository.save(newResult);
        }
    }

    @Transactional
    public UserProgressResponse syncProgress(String username, SyncProgressRequest request) {
        User user = findUser(username);

        // 1. Sync completed lessons
        if (request.getCompleted() != null) {
            for (Map.Entry<String, Boolean> entry : request.getCompleted().entrySet()) {
                if (Boolean.TRUE.equals(entry.getValue())) {
                    Optional<UserLessonProgress> existing = lessonProgressRepository.findByUserAndLessonId(user, entry.getKey());
                    if (existing.isEmpty()) {
                        lessonProgressRepository.save(new UserLessonProgress(user, entry.getKey(), true));
                    }
                }
            }
        }

        // 2. Sync quiz scores
        if (request.getQuizScores() != null) {
            for (Map.Entry<String, SyncProgressRequest.LocalQuizScore> entry : request.getQuizScores().entrySet()) {
                String moduleId = entry.getKey();
                SyncProgressRequest.LocalQuizScore localScore = entry.getValue();
                if (localScore != null && localScore.getTotal() > 0) {
                    boolean passed = localScore.getScore() >= Math.ceil(localScore.getTotal() * 0.7);
                    Optional<UserQuizResult> existing = quizResultRepository.findByUserAndModuleId(user, moduleId);
                    if (existing.isPresent()) {
                        if (localScore.getScore() > existing.get().getScore()) {
                            existing.get().setScore(localScore.getScore());
                            existing.get().setTotalQuestions(localScore.getTotal());
                            existing.get().setPassed(passed);
                            quizResultRepository.save(existing.get());
                        }
                    } else {
                        quizResultRepository.save(new UserQuizResult(user, moduleId, localScore.getScore(), localScore.getTotal(), passed));
                    }
                }
            }
        }

        return getUserProgress(username);
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + username));
    }
}
