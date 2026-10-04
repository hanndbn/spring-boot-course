-- ========================================================
-- Schema Migration V2: User Course & Module Enrollments
-- ========================================================

CREATE TABLE IF NOT EXISTS user_enrollments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    module_id VARCHAR(30) NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_enrollment FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_module_enroll UNIQUE (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_user_enrollment_user_id ON user_enrollments(user_id);
