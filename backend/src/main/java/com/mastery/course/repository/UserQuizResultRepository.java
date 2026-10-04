package com.mastery.course.repository;

import com.mastery.course.entity.User;
import com.mastery.course.entity.UserQuizResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserQuizResultRepository extends JpaRepository<UserQuizResult, Long> {
    List<UserQuizResult> findAllByUser(User user);
    Optional<UserQuizResult> findByUserAndModuleId(User user, String moduleId);
}
