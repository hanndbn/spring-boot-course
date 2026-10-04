const fs = require('fs');
const path = require('path');

const modPath = path.join(__dirname, '..', 'js', 'content', 'module2.js');
global.window = { COURSE_MODULES: [], EXPANDED_QUIZZES: {} };
new Function('window', fs.readFileSync(modPath, 'utf8'))(window);

const mod = window.COURSE_MODULES[0];

// Diagram 2-1-2: DTO Request/Response Layering
const diag_2_1_2 = `
### Sơ Đồ Tuần Tự: Phân Tách DTO Request & Response Qua Các Tầng Kiến Trúc

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as Mobile / SPA Client
    participant Controller as OrderController (API Layer)
    participant Validator as Jakarta Bean Validation
    participant Service as OrderService (Business Layer)
    participant Repo as OrderRepository (Data Layer)
    participant DB as PostgreSQL Database

    Client->>Controller: POST /api/v1/orders (CreateOrderRequest DTO)
    Controller->>Validator: @Valid kiểm tra ràng buộc (@NotNull, @Positive)
    Validator-->>Controller: Hợp lệ
    Controller->>Service: createOrder(CreateOrderRequest)
    Service->>Service: Ánh xạ Request DTO -> Order Entity
    Service->>Repo: save(Order)
    Repo->>DB: INSERT INTO orders ...
    DB-->>Repo: Saved Record (ID, CreatedAt)
    Repo-->>Service: Order Entity (Managed)
    Service->>Service: Ánh xạ Order Entity -> OrderResponse DTO (Bảo mật, ẩn PII)
    Service-->>Controller: OrderResponse DTO
    Controller-->>Client: 201 Created (HTTP Header Location: /orders/ORD-123)
\`\`\`
`;

// Diagram 2-1-3: Entity Leakage & Status Code Pitfalls
const diag_2_1_3 = `
### Sơ Đồ Phân Tích: Cạm Bẫy Lộ Entity Ra Controller & Lỗi LazyInitializationException

\`\`\`mermaid
flowchart TD
    subgraph BadPractice ["❌ SAI LẦM: Trả Entity Trực Tiếp Ra Controller"]
        CtrlBad["OrderController"] -->|Trả về List&lt;OrderEntity&gt;| Jackson["Jackson JSON Serializer"]
        Jackson -->|Quét thuộc tính user.password| SecurityLeak["LỘ MẬT KHẨU BĂNG BĂNG RA CLIENT!"]
        Jackson -->|Đọc orderItems (Lazy Fetching)| LazyBug["LazyInitializationException: Session đã đóng!"]
        Jackson -->|Đọc quan hệ 2 chiều Order <-> Items| InfiniteLoop["Jackson Infinite Recursion (Văng 500 lỗi)!"]
    end

    subgraph CleanArch ["✅ CHUẨN DOANH NGHIỆP: Tách DTO Độc Lập"]
        CtrlGood["OrderController"] -->|Gọi MapStruct| DTO["OrderResponse DTO (Phẳng hóa)"]
        DTO -->|Chỉ serialize trường cần thiết| JSONSafe["JSON Sạch, An Toàn Tuyệt Đối, Phản Hồi &lt; 20ms"]
    end

    style BadPractice fill:#7c2d12,stroke:#f97316,color:#fff
    style CleanArch fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 2-2-2: Global Exception Handler RFC 7807 Flow
const diag_2_2_2 = `
### Sơ Đồ Luồng: Bắt & Chuẩn Hóa Lỗi Với @RestControllerAdvice & RFC 7807 ProblemDetail

\`\`\`mermaid
flowchart TD
    Request["Client Gửi Request"] --> Controller["OrderController"]
    Controller --> Service["OrderService::processPayment()"]
    Service -->|Số dư không đủ| Throw["throw new InsufficientBalanceException(orderId, missingAmt)"]
    
    subgraph AdviceLayer ["Tầng Đón Bắt Toàn Cục (@RestControllerAdvice)"]
        Throw --> Handler["@ExceptionHandler(InsufficientBalanceException.class)"]
        Handler --> ProblemBuilder["Xây dựng RFC 7807 ProblemDetail:<br/>- type: urn:problem:insufficient-balance<br/>- title: Lỗi Thanh Toán<br/>- status: 422 Unprocessable Entity<br/>- detail: Tài khoản không đủ 500.000 VND<br/>- traceId: W3C Trace ID"]
    end

    ProblemBuilder --> Response["HTTP 422: JSON Chuẩn RFC 7807 (Dễ dàng cho Mobile/Frontend hiển thị)"]
    style AdviceLayer fill:#1e293b,stroke:#3b82f6,color:#fff
    style Response fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 2-2-3: StackTrace Leak Security Risk
const diag_2_2_3 = `
### Sơ Đồ Cảnh Báo: Hiểm Họa Lộ StackTrace & Nuốt Exception Cẩu Thả

\`\`\`mermaid
flowchart TD
    subgraph Danger1 ["HIỂM HỌA 1: Lộ Thông Tin Hạ Tầng Ra Response (Security Vulnerability)"]
        DBError["PSQLException: Table 'tbl_users_v2' constraint failed..."] --> Leak["Lộ nguyên StackTrace ra màn hình Client"]
        Leak --> Hacker["Hacker biết được cấu trúc DB, version PostgreSQL, tên class nội bộ!"]
    end

    subgraph Danger2 ["HIỂM HỌA 2: Nuốt Chửng Exception (Silent Failures)"]
        CodeTry["try { paymentGateway.charge(); } catch (Exception e) {}"] --> Silent["Không log, không re-throw!"]
        Silent --> DataLoss["Tiền không trừ nhưng đơn vẫn báo thành công -> THẤT THOÁT HÀNG TỶ ĐỒNG!"]
    end

    style Danger1 fill:#7c2d12,stroke:#f97316,color:#fff
    style Danger2 fill:#7c2d12,stroke:#f97316,color:#fff
\`\`\`
`;

// Diagram 2-3-1: MapStruct Compile-Time Code Generation
const diag_2_3_1 = `
### Sơ Đồ So Sánh: MapStruct (Compile-Time) vs ModelMapper (Runtime Reflection)

\`\`\`mermaid
flowchart TD
    subgraph MapStructEngine ["1. MapStruct (Khuyên dùng 100%): Compile-Time Generation"]
        InterfaceDef["OrderMapper Interface"] --> Javac["javac Compiler + MapStruct Annotation Processor"]
        Javac --> GeneratedCode["OrderMapperImpl.class (Mã Java thuần: dto.setId(e.getId()))"]
        GeneratedCode --> FastRuntime["Tốc độ siêu tốc: Ngang ngửa gõ setter tay, 0% CPU overhead!"]
    end

    subgraph ReflectionEngine ["2. ModelMapper / BeanUtils: Runtime Reflection"]
        SourceObj["Order Entity"] --> Reflection["Java Reflection quét metadata lúc chạy"]
        Reflection --> SlowRuntime["Chậm gấp 10-20 lần, tốn RAM, lỗi chỉ phát hiện khi người dùng bấm!"]
    end

    style MapStructEngine fill:#064e3b,stroke:#10b981,color:#fff
    style ReflectionEngine fill:#7c2d12,stroke:#f97316,color:#fff
\`\`\`
`;

// Diagram 2-3-2: OpenAPI Documentation Generation Pipeline
const diag_2_3_2 = `
### Sơ Đồ Luồng: Tự Động Hóa Tài Liệu API Chuẩn OpenAPI 3.0 & Swagger UI

\`\`\`mermaid
flowchart LR
    subgraph CodeAnnotations ["Mã Nguồn Java 21"]
        Controller["@RestController<br/>@Tag(name='Orders')"]
        Method["@Operation(summary='Tạo đơn')<br/>@ApiResponse(responseCode='201')"]
        DTO["OrderRequest DTO<br/>@Schema(description='Mã giảm giá')"]
    end

    subgraph SpringDoc ["SpringDoc OpenAPI Engine"]
        Inspector["SpringDoc Bean Post Processor: Phân tích Endpoints"]
        JSONSpec["Tạo /v3/api-docs (OpenAPI 3.0 JSON Spec)"]
    end

    subgraph Consumers ["Đối Tác & Đội Ngũ Tiêu Thụ"]
        SwaggerUI["Swagger UI (/swagger-ui.html: Test API trực tiếp)"]
        FrontendTeam["Frontend / Mobile (Generate TypeScript / Kotlin SDK)"]
    end

    CodeAnnotations --> Inspector
    Inspector --> JSONSpec
    JSONSpec --> SwaggerUI
    JSONSpec --> FrontendTeam

    style SpringDoc fill:#1e293b,stroke:#3b82f6,color:#fff
    style Consumers fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 2-3-3: Circular Mapping StackOverflow Trap
const diag_2_3_3 = `
### Sơ Đồ Cảnh Báo: Cạm Bẫy Vòng Lặp Ánh Xạ (Circular Mapping) Trong MapStruct

\`\`\`mermaid
flowchart TD
    subgraph CircularBug ["CẠM BẪY: Quan Hệ Hai Chiều Gây StackOverflowError"]
        OrderEntity["Order Entity"] -->|has many| ItemEntity["OrderItem Entity"]
        ItemEntity -->|references back| OrderEntity
        Mapper["OrderMapper::toDto()"] -->|Ánh xạ items| ItemMapper["ItemMapper::toDto()"]
        ItemMapper -->|Ánh xạ lại order| Mapper
        Loop["LẶP VÔ HẠN -> CRASH: java.lang.StackOverflowError!"]
        ItemMapper -.-> Loop
        Mapper -.-> Loop
    end

    subgraph SolutionFix ["GIẢI PHÁP: Ngắt Vòng Lặp Bằng @Mapping Ignore Hoặc DTO Phẳng"]
        OrderDTO["OrderResponse DTO"] --> ItemsDTO["List&lt;OrderItemResponse&gt; (Không chứa con trỏ ngược về Order!)"]
        ItemsDTO --> Safe["Chuỗi quan hệ 1 chiều an toàn tuyệt đối!"]
    end

    style CircularBug fill:#7c2d12,stroke:#f97316,color:#fff
    style SolutionFix fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 2-4-1: Offset vs Keyset Pagination Performance
const diag_2_4_1 = `
### Sơ Đồ Đo Lường: Offset Paging vs Keyset Pagination Trên 10,000,000 Bản Ghi

\`\`\`mermaid
flowchart TD
    subgraph OffsetPaging ["1. Offset Paging: SELECT * FROM orders LIMIT 20 OFFSET 5000000"]
        Scan["PostgreSQL buộc phải quét qua 5,000,000 hàng trong index"] --> Discard["Vứt bỏ 5,000,000 hàng đầu tiên"]
        Discard --> Fetch["Lấy 20 hàng cuối cùng"]
        Fetch --> Slow["Thời gian thực thi: 4,800 ms (Gần 5 giây -> Treo DB!)"]
    end

    subgraph KeysetPaging ["2. Keyset (Cursor) Pagination: WHERE id > :lastId ORDER BY id ASC LIMIT 20"]
        IndexSeek["PostgreSQL dùng B-Tree Index nhảy thẳng tới vị trí lastId (B-Tree Seek O(log N))"] --> FastFetch["Đọc đúng 20 hàng kế tiếp"]
        FastFetch --> Lightning["Thời gian thực thi: 1.2 ms (Nhanh gấp 4,000 lần, tốc độ không đổi ở bất kỳ trang nào!)"]
    end

    style OffsetPaging fill:#7c2d12,stroke:#f97316,color:#fff
    style KeysetPaging fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 2-4-2: S3 Direct Upload Via Presigned URL
const diag_2_4_2 = `
### Sơ Đồ Tuần Tự: Luồng Upload File Lớn Bằng AWS S3 Presigned URL

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend / Mobile App
    participant API as Spring Boot Backend (/api/v1/files/presigned-url)
    participant S3 as Amazon Web Services (AWS S3)

    Client->>API: 1. Xin link upload (fileName="avatar.png", contentType="image/png")
    API->>API: Xác thực quyền hạn User & Kiểm tra dung lượng cho phép
    API->>S3: Gọi AWS SDK sinh Presigned Upload URL (Hạn 15 phút)
    S3-->>API: Trả về https://bucket.s3.amazonaws.com/uploads/uuid.png?X-Amz-Signature=...
    API-->>Client: 200 OK (Trả về Presigned URL)
    
    Note over Client,S3: Client upload TRỰC TIẾP sang AWS S3! KHÔNG đi qua Backend!
    Client->>S3: 2. PUT Stream file nhị phân trực tiếp lên AWS S3
    S3-->>Client: 200 OK (Upload thành công 100MB file trong 2s)
    
    Client->>API: 3. Thông báo hoàn tất (fileKey="uuid.png") -> Backend lưu URL vào DB
    API-->>Client: 200 OK (Hồ sơ đã cập nhật)
\`\`\`
`;

// Diagram 2-4-3: Multipart Upload Memory Pressure
const diag_2_4_3 = `
### Sơ Đồ Cảnh Báo: Nguy Cơ Sập Heap Memory Khi Dùng MultipartFile Truyền Thống

\`\`\`mermaid
flowchart TD
    subgraph MultipartTrap ["CẠM BẪY: MultipartFile Nạp File Vào Bộ Nhớ JVM"]
        Concurrent["100 Users đồng thời upload video 200MB"] --> Tomcat["Tomcat nạp toàn bộ mảng bytes vào RAM Heap"]
        Tomcat --> OOM["100 * 200MB = 20GB RAM! VƯỢT QUÁ HEAP JVM!"]
        OOM --> Crash["java.lang.OutOfMemoryError: Java heap space (SERVER CRASH NGAY!)"]
    end

    subgraph SolutionStreaming ["GIẢI PHÁP SẢN XUẤT: Giới Hạn Buffer Ổ Cứng Hoặc Dùng Presigned URL"]
        Config["spring.servlet.multipart.file-size-threshold=2MB"] --> DiskBuffer["File > 2MB tự động ghi tạm ra ổ cứng SSD thay vì giữ trên RAM"]
        DiskBuffer --> SafeUpload["Bộ nhớ Heap của JVM luôn ổn định < 512MB!"]
    end

    style MultipartTrap fill:#7c2d12,stroke:#f97316,color:#fff
    style SolutionStreaming fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

const injections = {
  '2-1-2': diag_2_1_2,
  '2-1-3': diag_2_1_3,
  '2-2-2': diag_2_2_2,
  '2-2-3': diag_2_2_3,
  '2-3-1': diag_2_3_1,
  '2-3-2': diag_2_3_2,
  '2-3-3': diag_2_3_3,
  '2-4-1': diag_2_4_1,
  '2-4-2': diag_2_4_2,
  '2-4-3': diag_2_4_3,
};

let updatedCount = 0;
mod.lessons.forEach(l => {
  if (injections[l.id] && !l.content.includes('mermaid')) {
    l.content = injections[l.id] + '\n\n' + l.content;
    updatedCount++;
    console.log(`[ENRICHED] ${l.id}: ${l.title}`);
  }
});

// Write back
const outputCode = `/* MODULE 2 — REST API chuyên nghiệp (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(${JSON.stringify(mod, null, 2)});\n`;

fs.writeFileSync(modPath, outputCode, 'utf8');
console.log(`\nHoàn thành bổ sung sơ đồ Mermaid cho Module 2! Số bài cập nhật: ${updatedCount}/10`);
