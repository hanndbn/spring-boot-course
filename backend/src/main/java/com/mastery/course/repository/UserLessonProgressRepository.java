package com.mastery.course.repository;

import com.mastery.course.entity.User;
import com.mastery.course.entity.UserLessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserLessonProgressRepository extends JpaRepository<UserLessonProgress, Long> {
    List<UserLessonProgress> findAllByUser(User user);
    Optional<UserLessonProgress> findByUserAndLessonId(User user, String lessonId);
    void deleteByUserAndLessonId(User user, String lessonId);
    long countByUserAndCompletedTrue(User user);
}
