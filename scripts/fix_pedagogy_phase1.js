const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, '..', 'course', 'js', 'content');

// 1. Fix 0-1-2 in module0.js
let m0Content = fs.readFileSync(path.join(contentDir, 'module0.js'), 'utf8');

const m0_1_2_mermaid = `## 1. Cái này là gì? (Cấu trúc thư mục Spring Boot Chuẩn)

### Sơ Đồ Cây Thư Mục & Luồng Khởi Động Maven:

\`\`\`mermaid
graph TD
    Root["📁 order-service (Project Root)"] --> MvnW["📜 mvnw / mvnw.cmd (Maven Wrapper)"]
    Root --> Pom["📄 pom.xml (Dependencies & Build Plugins)"]
    Root --> SrcMain["📁 src/main/java (Mã nguồn nghiệp vụ)"]
    Root --> SrcRes["📁 src/main/resources (Cấu hình ứng dụng)"]
    Root --> SrcTest["📁 src/test/java (Kiểm thử tự động)"]
    
    SrcMain --> App["🚀 OrderApplication.java (@SpringBootApplication)"]
    SrcMain --> Ctrl["🌐 controller/ (REST Endpoints)"]
    SrcMain --> Svc["⚙️ service/ (Nghiệp vụ Service Layer)"]
    SrcMain --> Repo["💾 repository/ (Spring Data JPA)"]
    
    SrcRes --> AppYml["⚙️ application.yml (Port, Database, Profiles)"]
\`\`\`

### Cấu Trúc Chi Tiết Các Tầng Thư Mục:`;

m0Content = m0Content.replace(
  `## 1. Cái này là gì? (Cấu trúc thư mục Spring Boot Chuẩn)\n\n### Sơ Đồ Cây Thư Mục & Vai Trò Các Thành Phần:`,
  m0_1_2_mermaid
);
fs.writeFileSync(path.join(contentDir, 'module0.js'), m0Content, 'utf8');
console.log('Fixed 0-1-2 in module0.js');

// 2. Fix 2-3-4, 2-4-3, 2-4-4 in module2.js
let m2Content = fs.readFileSync(path.join(contentDir, 'module2.js'), 'utf8');

const m2_3_4_mermaid = `## 1. Cái này là gì? (Ma trận So sánh Chiến Lược Chuyển Đổi Dữ Liệu)

### Sơ Đồ Luồng Ánh Xạ Phân Tầng Dữ Liệu (Layered Data Mapping):

\`\`\`mermaid
flowchart LR
    Client["📱 Client Request (JSON)"] -->|Deserialize| ReqDTO["📦 OrderRequestDTO (Validation)"]
    ReqDTO -->|MapStruct Mapper| Domain["🏛️ OrderEntity (JPA Domain Model)"]
    Domain -->|Save| DB[("🗄️ PostgreSQL Database")]
    DB -->|Query Projection| ResDTO["📄 OrderSummaryDTO (Read-Only)"]
    ResDTO -->|Serialize| Response["🌐 Client Response (JSON)"]

    style ReqDTO fill:#0284c7,stroke:#0369a1,color:#fff
    style Domain fill:#16a34a,stroke:#15803d,color:#fff
    style ResDTO fill:#d97706,stroke:#b45309,color:#fff
\`\`\`

### Ma trận So sánh Toàn diện Các Phương Pháp Mapping:`;

m2Content = m2Content.replace(
  `## 1. Cái này là gì? (Ma trận So sánh Chiến Lược Chuyển Đổi Dữ Liệu)`,
  m2_3_4_mermaid
);

const m2_4_3_new = `## 1. Ba Sự Cố Sản Xuất Phổ Biến Nhất Trong Tầng REST Web

### Sơ Đồ Sự Cố: N+1 OFFSET Scan Gây Nghẽn CPU vs Tràn RAM Multipart

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Attacker as 🤖 Crawler Bot / Client
    participant API as 🌐 Spring Boot Gateway
    participant DB as 🗄️ PostgreSQL Database
    
    Note over Attacker,DB: KỊCH BẢN 1: CÀN QUÉT OFFSET LỚN
    Attacker->>API: GET /orders?page=50000&size=100
    API->>DB: SELECT * FROM orders OFFSET 5000000 LIMIT 100
    Note over DB: Quét 5.000.100 bản ghi trên đĩa -> CPU vọt 100%!
    DB-->>API: Connection Timeout (504 Gateway Timeout)
    
    Note over Attacker,API: KỊCH BẢN 2: UPLOAD FILE 500MB KHÔNG ĐỆM
    Attacker->>API: POST /orders/bulk-import (500MB multipart file)
    Note over API: Nạp trọn vẹn 500MB vào Heap RAM -> OOM Killer!
    API-->>Attacker: 502 Bad Gateway (Server Crash)
\`\`\`

### Ma Trận So Sánh Các Sự Cố & Giải Pháp Phòng Chống:

| Sự cố sản xuất | Triệu chứng kỹ thuật | Nguyên nhân gốc rễ | Giải pháp chuẩn Senior |
|---|---|---|---|
| **OFFSET Scan Bão Táp** | CPU Database vọt 100%, treo kết nối pool HikariCP | Database phải đọc và hủy bỏ hàng triệu bản ghi trước đó | Khóa trần \`page <= 100\`, chuyển sang Keyset Seek (\`WHERE id > :lastId\`) |
| **Tràn Heap MultipartFile** | JVM sập đột ngột với \`java.lang.OutOfMemoryError\` | Mặc định Spring Boot đệm toàn bộ file vào bộ nhớ RAM | Giới hạn dung lượng và cấu hình \`file-size-threshold\` đệm ra đĩa cứng |
| **Treo Connection Timeout** | Xuất báo cáo 100.000 dòng làm nghẽn kết nối HTTP | Thu thập toàn bộ dữ liệu vào List trước khi gửi về | Sử dụng \`StreamingResponseBody\` để stream từng dòng trực tiếp ra Socket |

### Cấu hình bảo hộ an toàn trong application.yml:

\`\`\`yaml
spring:
  servlet:
    multipart:
      max-file-size: 10MB        # Giới hạn dung lượng 1 file
      max-request-size: 20MB     # Giới hạn tổng dung lượng request
      file-size-threshold: 2MB   # File > 2MB tự động ghi tạm vào đĩa cứng, không ngậm trong RAM
\`\`\`

### Bảng Phân Tích Cấu Hình Bảo Vệ Máy Chủ:

| Tham số cấu hình | Giá trị đề xuất | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động bảo vệ |
|---|---|---|---|
| \`max-file-size\` | \`10MB\` | Dung lượng tối đa của một tệp tin đơn lẻ | File > 10MB lập tức bị ngắt và trả về lỗi 413 Payload Too Large |
| \`max-request-size\` | \`20MB\` | Tổng dung lượng multipart trong 1 request | Ngăn chặn tấn công đính kèm hàng chục file nhỏ cùng lúc |
| \`file-size-threshold\` | \`2MB\` | Ngưỡng đệm từ bộ nhớ RAM sang ổ cứng tạm thời | File < 2MB nằm trong RAM; File 2MB-10MB đệm trên đĩa, giữ Heap RAM ổn định |`;

m2Content = m2Content.replace(
  /## 1\. Ba Sự Cố Sản Xuất Phổ Biến Nhất Trong Tầng REST Web[\s\S]*?```yaml[\s\S]*?file-size-threshold: 2MB[\s\S]*?```/,
  m2_4_3_new
);

const m2_4_4_mermaid = `## 1. Ma Trận Quyết Định Công Nghệ: Phân Trang & Xử Lý Tệp Tin

### Sơ Đồ Kiến Trúc: Chiến Lược Tải Dữ Liệu Lớn & Direct Upload Cloud

\`\`\`mermaid
flowchart TD
    Client["📱 Web / Mobile Client"]
    API["🌐 Spring Boot Order Service"]
    S3[("☁️ AWS S3 / Cloud Storage")]
    DB[("🗄️ PostgreSQL Database")]

    subgraph READ_FLOW["1. LUỒNG TRUY VẤN DỮ LIỆU LỚN"]
        Client -->|1. Request Keyset: lastId=10500| API
        API -->|2. Index Seek: WHERE id > 10500 LIMIT 50| DB
        DB -->|3. Trả về đúng 50 dòng trong 1ms| API
        API -->|4. Response JSON + nextCursor| Client
    end

    subgraph UPLOAD_FLOW["2. LUỒNG TẢI FILE LỚN (ZERO-MEMORY)"]
        Client -->|A. Yêu cầu Presigned URL| API
        API -->|B. Sinh S3 Presigned URL có hạn 15p| Client
        Client -->|C. Upload file trực tiếp lên Cloud (Bỏ qua Spring)| S3
    end

    style READ_FLOW fill:#0f172a,stroke:#38bdf8,color:#fff
    style UPLOAD_FLOW fill:#1e1b4b,stroke:#a855f7,color:#fff
\`\`\`

### Bảng Ma Trận Quyết Định Giải Pháp Kỹ Thuật:`;

m2Content = m2Content.replace(
  `## 1. Ma Trận Quyết Định Công Nghệ: Phân Trang & Xử Lý Tệp Tin`,
  m2_4_4_mermaid
);

fs.writeFileSync(path.join(contentDir, 'module2.js'), m2Content, 'utf8');
console.log('Fixed 2-3-4, 2-4-3, 2-4-4 in module2.js');

// 3. Fix 4-4-4 in module4.js
let m4Content = fs.readFileSync(path.join(contentDir, 'module4.js'), 'utf8');

const m4_4_4_table = `## 2. Ma Trận Chiến Lược Kiểm Thử Doanh Nghiệp (Enterprise Testing Matrix)

| Cấp độ kiểm thử | Công nghệ chủ đạo | Mục tiêu bảo vệ | Thời gian chạy trung bình |
|---|---|---|---|
| **Unit Test** | JUnit 5 + Mockito 5 + AssertJ | Thuật toán nghiệp vụ độc lập trong Service & Domain | 1 - 5 milliseconds / test |
| **Slice Web Test** | \`@WebMvcTest\` + MockMvc | Validation DTO, Serializer JSON, HTTP Status Code | 100 - 300 milliseconds / test |
| **Integration Test** | \`@SpringBootTest\` + Testcontainers | Giao tiếp SQL PostgreSQL thật, Transaction Rollback | 1 - 3 seconds / test |
| **Async & Event Test** | Awaitility + Kafka Test Binder | Luồng xử lý bất đồng bộ, chống Flaky Test | 500ms - 2 seconds / test |
| **Architecture Test** | ArchUnit Core | Cưỡng chế Clean Architecture, khóa chết rò rỉ tầng | 50 - 200 milliseconds / test |`;

m4Content = m4Content.replace(
  `## 4. Cạm bẫy thực tế & Best Practices`,
  m4_4_4_table + `\n\n## 4. Cạm bẫy thực tế & Best Practices`
);

fs.writeFileSync(path.join(contentDir, 'module4.js'), m4Content, 'utf8');
console.log('Fixed 4-4-4 in module4.js');
