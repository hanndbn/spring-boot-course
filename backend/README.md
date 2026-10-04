# Spring Boot Mastery — Backend API

Backend cung cấp hệ thống xác thực người dùng (Spring Security + JWT), lưu trữ và đồng bộ tiến độ học tập, kết quả bài thi quiz trên đám mây cho khóa học **Spring Boot Mastery**.

---

## 🛠️ Công Nghệ Sử Dụng

- **Java**: 17+
- **Spring Boot**: 3.2.3
- **Spring Security & JJWT**: 0.12.5 (Stateless Authentication)
- **Spring Data JPA & Hibernate**: Quản lý quan hệ dữ liệu
- **Flyway Migration**: Version control schema cơ sở dữ liệu (`V1__init_schema.sql`)
- **Database**: 
  - Dev: H2 in-memory (PostgreSQL dialect)
  - Prod: PostgreSQL 16
- **OpenAPI 3.0 / Swagger UI**: `springdoc-openapi` 2.3.0
- **Docker & Docker Compose**: Container hóa toàn diện multi-stage build

---

## 🚀 Hướng Dẫn Chạy Nhanh

### Cách 1: Sử dụng Docker Compose (Khuyên Dùng)

Bạn không cần cài đặt Java hay Maven trên máy tính, chỉ cần mở Docker Desktop:

```bash
# Tại thư mục gốc của repository
docker compose up --build
```

Hệ thống sẽ tự động:
1. Khởi động PostgreSQL 16 (Port 5432)
2. Build ứng dụng Spring Boot 3 bằng Docker multi-stage build và chạy tại Port 8080
3. Chạy nginx phục vụ giao diện khóa học tại Port 3000

Truy cập:
- **Khóa học SPA**: `http://localhost:3000`
- **Backend API**: `http://localhost:8080/api/v1`
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **Health Check**: `http://localhost:8080/api/v1/health`

### Cách 2: Chạy Bằng Maven Local (Nếu đã có Java 17 & Maven)

```bash
cd backend
mvn clean spring-boot:run
```

Mặc định profile `dev` sử dụng H2 in-memory database, sẵn sàng kiểm thử ngay mà không cần cấu hình PostgreSQL ngoài.
- **H2 Console**: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:coursedb`, User: `sa`, Password: rỗng)

---

## 📡 Danh Sách API Endpoints

### 1. Authentication (`/api/v1/auth`)
| Phương thức | Endpoint | Chức năng | Phân quyền |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Đăng ký tài khoản học viên mới | Public |
| `POST` | `/api/v1/auth/login` | Đăng nhập nhận JWT Token (24h) | Public |
| `GET` | `/api/v1/auth/me` | Lấy thông tin tài khoản hiện tại | `USER`, `ADMIN` |

### 2. Progress Sync (`/api/v1/progress`)
| Phương thức | Endpoint | Chức năng | Phân quyền |
|---|---|---|---|
| `GET` | `/api/v1/progress` | Lấy toàn bộ tiến độ bài học & điểm quiz | `USER`, `ADMIN` |
| `POST` | `/api/v1/progress/complete-lesson` | Đánh dấu hoàn thành 1 bài học | `USER`, `ADMIN` |
| `DELETE` | `/api/v1/progress/lessons/{lessonId}` | Hủy hoàn thành 1 bài học | `USER`, `ADMIN` |
| `POST` | `/api/v1/progress/quiz-result` | Nộp điểm quiz của 1 module | `USER`, `ADMIN` |
| `POST` | `/api/v1/progress/sync` | Đồng bộ 2 chiều LocalStorage và Cloud | `USER`, `ADMIN` |

### 3. Monitoring (`/api/v1/health`)
| Phương thức | Endpoint | Chức năng | Phân quyền |
|---|---|---|---|
| `GET` | `/api/v1/health` | Kiểm tra tình trạng máy chủ | Public |

---

## 🗄️ Cấu Trúc Database Schema

```sql
users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'ROLE_USER',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

user_lesson_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    lesson_id VARCHAR(50) NOT NULL,
    completed BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

user_quiz_results (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    module_id INT NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    completed_at TIMESTAMP,
    UNIQUE(user_id, module_id)
);
```
