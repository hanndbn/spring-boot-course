package com.mastery.course.repository;

import com.mastery.course.entity.User;
import com.mastery.course.entity.UserEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserEnrollmentRepository extends JpaRepository<UserEnrollment, Long> {
    List<UserEnrollment> findByUser(User user);
    List<UserEnrollment> findByUserId(Long userId);
    Optional<UserEnrollment> findByUserIdAndModuleId(Long userId, String moduleId);
    boolean existsByUserIdAndModuleId(Long userId, String moduleId);
    void deleteByUserIdAndModuleId(Long userId, String moduleId);
}
