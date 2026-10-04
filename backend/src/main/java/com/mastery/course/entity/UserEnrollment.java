package com.mastery.course.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "user_enrollments",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "module_id"}))
public class UserEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "module_id", nullable = false, length = 30)
    private String moduleId;

    @Column(name = "enrolled_at", nullable = false)
    private Instant enrolledAt = Instant.now();

    public UserEnrollment() {}

    public UserEnrollment(User user, String moduleId) {
        this.user = user;
        this.moduleId = moduleId;
        this.enrolledAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }
    public Instant getEnrolledAt() { return enrolledAt; }
    public void setEnrolledAt(Instant enrolledAt) { this.enrolledAt = enrolledAt; }
}
