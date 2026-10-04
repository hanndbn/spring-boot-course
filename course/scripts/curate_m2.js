const fs = require('fs');
const path = require('path');

global.window = { COURSE_MODULES: [] };
const m2Path = path.join(__dirname, '..', 'js', 'content', 'module2.js');
new Function('window', fs.readFileSync(m2Path, 'utf8'))(window);
const oldM2 = window.COURSE_MODULES[0];

const topics = [
  { id: 1, title: "DispatcherServlet & Clean REST Architecture", desc: "Vòng đời HTTP Request, DispatcherServlet, phân tầng Controller-Service-Repository và chuẩn REST." },
  { id: 2, title: "Validation & RFC 7807 Exception Handling", desc: "Bean Validation, Custom Validator, chuẩn quốc tế RFC 7807 ProblemDetails và xử lý lỗi tập trung." },
  { id: 3, title: "DTO Mapping & API Contract-First", desc: "Tối ưu hóa MapStruct tại thời điểm biên dịch, tài liệu hóa OpenAPI 3.0 và quy trình Contract-First." },
  { id: 4, title: "High-Scale Pagination & Streaming Upload", desc: "Phân trang Keyset/Cursor triệu dòng, lọc động Specification và tối ưu upload file qua S3 Presigned URL." }
];

const outcomes = [
  "Thiết kế và triển khai RESTful API chuẩn RFC 7807 ProblemDetails cho toàn bộ hệ thống",
  "Làm chủ vòng đời DispatcherServlet, HandlerMapping và phân tách rạch ròi DTO với Domain Entity",
  "Sử dụng MapStruct biên dịch AOT không phụ thuộc reflection và tài liệu hóa chuẩn OpenAPI 3.0",
  "Triển khai phân trang Keyset chống nghẽn DB và tối ưu tải file trực tiếp qua S3 Presigned URL"
];

const retrievalWarmup = [
  {
    question: "Trong Module 1, tại sao khi gọi một phương thức nội bộ this.methodB() mang annotation @Transactional từ methodA() trong cùng một Service, transaction mới KHÔNG được kích hoạt?",
    options: [
      "Do cơ chế Self-Invocation: lời gọi trực tiếp trong JVM không đi qua Spring AOP Proxy nên advice Transactional hoàn toàn bị bỏ qua",
      "Do cơ sở dữ liệu khóa bảng sau phương thức đầu tiên",
      "Do Spring Boot 3 đã hủy bỏ tính năng lồng transaction",
      "Do thiếu cấu hình dialect của PostgreSQL trong application.yml"
    ],
    answer: 0,
    explain: "Spring AOP bọc logic xung quanh bean bằng Dynamic Proxy. Lời gọi qua từ khóa 'this' là direct method invocation trong JVM, không đi qua Proxy nên không kích hoạt được bất kỳ interceptor nào.",
    targetLessonId: "1-3-3"
  },
  {
    question: "Trong việc thiết kế Custom Spring Boot Starter, tại sao các bean mặc định luôn phải được đánh dấu bằng @ConditionalOnMissingBean?",
    options: [
      "Để thực hiện cơ chế Back-off an toàn: cho phép ứng dụng của developer tự khai báo bean tùy biến để ghi đè mà không gây xung đột trùng bean",
      "Để tăng tốc độ biên dịch mã nguồn của Maven",
      "Để yêu cầu developer bắt buộc phải tạo bean trong file xml",
      "Để ngăn chặn rò rỉ bộ nhớ Heap của JVM"
    ],
    answer: 0,
    explain: "@ConditionalOnMissingBean chỉ đăng ký bean của Starter nếu trong ApplicationContext chưa tồn tại bean cùng loại, tạo điều kiện cho người dùng dễ dàng override cấu hình mặc định.",
    targetLessonId: "1-2-3"
  },
  {
    question: "Khi nạp cấu hình trong Spring Boot, nếu cùng một tham số 'server.port' xuất hiện ở nhiều nơi, nguồn nào có độ ưu tiên cao nhất theo thứ tự 17 tầng?",
    options: [
      "Tham số dòng lệnh (Command Line Arguments, ví dụ: --server.port=9090)",
      "File application.yml nằm trong src/main/resources",
      "Biến môi trường hệ thống OS",
      "Cấu hình mặc định trong source code Java"
    ],
    answer: 0,
    explain: "Command Line Arguments luôn đứng ở đỉnh của 17 tầng ưu tiên cấu hình, cho phép DevOps override bất kỳ tham số nào khi deploy container mà không cần build lại code.",
    targetLessonId: "1-4-1"
  }
];

const getL = (id) => oldM2.lessons.find(l => l.id === id);

// Topic 1: 2-1-1 to 2-1-4 (Consolidates 2-1 and 2-9)
const t1_l1 = {
  id: "2-1-1",
  type: "theory",
  title: "Bài 2.1.1: Kiến trúc DispatcherServlet, HandlerMapping & Vòng đời HTTP Request",
  minutes: 8,
  content: getL("2-1-1").content + "\n\n" + getL("2-1-2").content
};

const t1_l2 = {
  id: "2-1-2",
  type: "practice",
  title: "Bài 2.1.2: Xây dựng Clean RESTful API với DTO Request/Response Tách Tầng",
  minutes: 7,
  content: getL("2-1-3").content + "\n\n" + getL("2-1-4").content
};

const t1_l3 = {
  id: "2-1-3",
  type: "pitfall",
  title: "Bài 2.1.3: Cạm bẫy Bỏ qua Status Code, Over-fetching & Rò rỉ Entity ra Controller",
  minutes: 7,
  content: getL("2-1-5").content + "\n\n" + getL("2-9-5").content
};

const t1_l4 = {
  id: "2-1-4",
  type: "synthesis",
  title: "Bài 2.1.4: Milestone Synthesis: Bản đồ DispatcherServlet & Ma trận Chuẩn Hóa RESTful API",
  minutes: 8,
  content: `## Milestone Synthesis: Tổng Hợp Kiến Trúc REST API & DispatcherServlet

### 1. Sơ Đồ Kiến Trúc: Vòng Đời HTTP Request Qua Spring MVC DispatcherServlet

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as Client (Web / Mobile)
    participant Tomcat as Embedded Tomcat Server
    participant Dispatcher as DispatcherServlet (Front Controller)
    participant HandlerMap as HandlerMapping
    participant Interceptor as HandlerInterceptor (Auth/Logging)
    participant Adapter as HandlerAdapter
    participant Controller as REST Controller
    participant Converter as HttpMessageConverter (Jackson)

    Client->>Tomcat: HTTP Request (GET /api/v1/orders/123)
    Tomcat->>Dispatcher: Chuyển giao request cho Front Controller
    Dispatcher->>HandlerMap: Tìm Controller xử lý endpoint tương ứng
    HandlerMap-->>Dispatcher: Trả về HandlerExecutionChain (Interceptors + Controller)
    Dispatcher->>Interceptor: preHandle() (Kiểm tra token, IP, tracing)
    Interceptor-->>Dispatcher: True (Cho phép đi tiếp)
    Dispatcher->>Adapter: handle(request, response, handler)
    Adapter->>Converter: Chuyển đổi JSON payload -> Java Request DTO
    Converter-->>Adapter: DTO Object
    Adapter->>Controller: invoke handler method
    Controller-->>Adapter: Trả về Response DTO / ResponseEntity
    Adapter->>Converter: Serialize Java Response DTO -> JSON UTF-8
    Converter-->>Dispatcher: JSON Payload
    Dispatcher->>Interceptor: afterCompletion()
    Dispatcher-->>Client: HTTP 200 OK + JSON Response Body
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Thiết Kế Định Dạng Trao Đổi API

| Tiêu chí | RESTful API (JSON RFC 7807) | GraphQL | gRPC (HTTP/2 Protobuf) |
|---|---|---|---|
| **Giao thức truyền tải** | HTTP/1.1 hoặc HTTP/2 (Văn bản JSON) | HTTP POST JSON | HTTP/2 Nhị phân (Binary Protocol Buffers) |
| **Băng thông & Tốc độ** | Chuẩn hóa, dễ đọc, caching HTTP tốt | Linh hoạt chọn trường, tránh over-fetching | **Cực nhanh, payload nhẹ hơn 70%** |
| **Khả năng debug** | Rất dễ debug bằng cURL, Postman, Browser | Cần công cụ GraphQL Playground | Cần file .proto và công cụ gRPC client |
| **Trường hợp sử dụng** | **Public API, Web/Mobile App thông thường** | Màn hình Dashboard phức tạp, tổng hợp dữ liệu | **Giao tiếp nội bộ giữa các Microservices (Inter-service)** |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Tuyệt đối không rò rỉ JPA Entity**: Không bao giờ trả Entity trực tiếp ra Controller; luôn map sang Response DTO để tránh lộ cấu trúc DB và tránh lỗi LazyInitializationException.
2. **Tuân thủ đúng HTTP Verbs**: \`GET\` (Idempotent, Safe - không sửa đổi data), \`POST\` (Tạo mới, không idempotent), \`PUT\` (Thay thế toàn bộ), \`PATCH\` (Cập nhật một phần), \`DELETE\` (Xóa resource).
3. **HTTP Status Code chuẩn**: \`201 Created\` kèm \`Location\` header khi tạo mới; \`204 No Content\` khi xóa thành công; \`400\` lỗi client input; \`404\` không tìm thấy; \`409\` xung đột dữ liệu.`
};

// Topic 2: 2-2-1 to 2-2-4
const t2_l1 = {
  id: "2-2-1",
  type: "theory",
  title: "Bài 2.2.1: Kiến trúc Bean Validation & Tiêu chuẩn Quốc tế RFC 7807 ProblemDetails",
  minutes: 8,
  content: getL("2-2-1").content + "\n\n" + getL("2-2-2").content
};

const t2_l2 = {
  id: "2-2-2",
  type: "practice",
  title: "Bài 2.2.2: Triển khai Global Exception Handler & Custom Business Validator",
  minutes: 7,
  content: getL("2-2-3").content + "\n\n" + getL("2-2-4").content
};

const t2_l3 = {
  id: "2-2-3",
  type: "pitfall",
  title: "Bài 2.2.3: Cạm bẫy Nuốt Exception, Lộ StackTrace ra Client & Không validate Nested DTO",
  minutes: 7,
  content: getL("2-2-6").content + "\n\n" + getL("2-2-7").content
};

const t2_l4 = {
  id: "2-2-4",
  type: "synthesis",
  title: "Bài 2.2.4: Milestone Synthesis: Bản đồ Xử lý Lỗi Toàn Cục & Ma trận HTTP Error Codes",
  minutes: 8,
  content: `## Milestone Synthesis: Validation & Chuẩn Hóa Xử Lý Ngoại Lệ Toàn Cục

### 1. Sơ Đồ Kiến Trúc: Luồng Bắt Lỗi Tập Trung Tại @RestControllerAdvice

\`\`\`mermaid
flowchart TD
    ClientReq["Client Gửi Request"] --> Controller["REST Controller (@Valid OrderRequestDTO)"]
    Controller -- "Vi phạm Validation (@NotNull, @Min)" --> ExMethodArg["MethodArgumentNotValidException"]
    Controller -- "Không tìm thấy dữ liệu" --> ExNotFound["ResourceNotFoundException"]
    Controller -- "Lỗi xung đột dữ liệu" --> ExConflict["BusinessConflictException"]
    Controller -- "Lỗi không lường trước" --> ExUncaught["Exception (Unhandled)"]

    subgraph Advice ["@RestControllerAdvice: GlobalExceptionHandler"]
        ExMethodArg --> HandleValid["Trả về RFC 7807: 400 Bad Request + Danh sách lỗi chi tiết từng trường"]
        ExNotFound --> HandleNotFound["Trả về RFC 7807: 404 Not Found"]
        ExConflict --> HandleConflict["Trả về RFC 7807: 409 Conflict"]
        ExUncaught --> HandleInternal["Ghi Log StackTrace nội bộ + Trả về RFC 7807: 500 Internal Error (Mã ẩn)"]
    end

    Advice --> ClientResponse["HTTP Error Response (RFC 7807 ProblemDetails Payload)"]
    style Advice fill:#1e293b,stroke:#ef4444,color:#fff
    style ClientResponse fill:#7f1d1d,stroke:#f87171,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Ánh Xạ Mã Lỗi HTTP Với Nghiệp Vụ

| HTTP Status | Trường hợp nghiệp vụ cụ thể | Ví dụ thực tế trong hệ thống |
|---|---|---|
| **400 Bad Request** | Lỗi cú pháp JSON, sai định dạng dữ liệu, vi phạm Bean Validation | Email không đúng format, số lượng đặt hàng âm |
| **401 Unauthorized** | Thiếu token, JWT hết hạn, chữ ký số không hợp lệ | Header Authorization bị rỗng hoặc token hết hạn |
| **403 Forbidden** | Đã đăng nhập nhưng không đủ quyền hạn (Role/Permission) | User thường cố gọi endpoint \`/api/v1/admin/users\` |
| **404 Not Found** | Tài nguyên theo ID không tồn tại trong hệ thống | Truy vấn order \`id=99999\` không có trong DB |
| **409 Conflict** | Xung đột trạng thái tài nguyên hiện tại | Đăng ký tài khoản với email đã được sử dụng |
| **422 Unprocessable** | Dữ liệu hợp lệ cú pháp nhưng sai quy tắc nghiệp vụ sâu | Số dư tài khoản không đủ để thực hiện thanh toán |
| **500 Internal Error** | Lỗi sập hệ thống không lường trước (Bug, NPE, DB timeout) | NullPointerException khi gọi dịch vụ bên thứ ba |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Tuân thủ chuẩn RFC 7807**: Cấu trúc payload lỗi phải có: \`type\`, \`title\`, \`status\`, \`detail\`, \`instance\`.
2. **Bảo mật StackTrace**: Tuyệt đối không bao giờ trả nội dung StackTrace ra ngoài production cho client đọc (lỗ hổng bảo mật tiết lộ hạ tầng).
3. **Khai báo @Valid cho Nested Object**: Nếu DTO chứa đối tượng con (như \`OrderDTO\` có \`List<OrderItemDTO>\`), bắt buộc phải gắn \`@Valid\` trên list con, nếu không Spring sẽ bỏ qua validation của các item bên trong.`
};

// Topic 3: 2-3-1 to 2-3-4 (Consolidates 2-3 and 2-7)
const t3_l1 = {
  id: "2-3-1",
  type: "theory",
  title: "Bài 2.3.1: Kiến trúc MapStruct Compile-Time Mapping & Triết lý API Contract-First",
  minutes: 8,
  content: getL("2-3-1").content + "\n\n" + getL("2-3-2").content + "\n\n" + getL("2-7-2").content
};

const t3_l2 = {
  id: "2-3-2",
  type: "practice",
  title: "Bài 2.3.2: Triển khai MapStruct Mapper Tự động & OpenAPI 3.0 Documentation",
  minutes: 8,
  content: getL("2-3-3").content + "\n\n" + getL("2-7-3").content
};

const t3_l3 = {
  id: "2-3-3",
  type: "pitfall",
  title: "Bài 2.3.3: Cạm bẫy Circular Mapping trong MapStruct & Sai lệch API Contract với UI/Mobile",
  minutes: 7,
  content: getL("2-3-5").content + "\n\n" + getL("2-7-5").content
};

const t3_l4 = {
  id: "2-3-4",
  type: "synthesis",
  title: "Bài 2.3.4: Milestone Synthesis: Bản đồ DTO Mapping & Ma trận Lựa chọn Công cụ Converter",
  minutes: 8,
  content: `## Milestone Synthesis: DTO Mapping Hiệu Năng Cao & Thiết Kế API Contract-First

### 1. Sơ Đồ Kiến Trúc: Quy Trình Sinh Code Tự Động Compile-Time Của MapStruct

\`\`\`mermaid
flowchart LR
    DevCode["Khai báo Interface:<br/>@Mapper(componentModel = 'spring')<br/>UserMapper.java"] --> Javac["Trình Biên Dịch Java (javac)<br/>Annotation Processing"]
    Javac --> Generator["MapStruct Processor Engine"]
    Generator --> ImplCode["Sinh Mã Nguồn Java Thuần:<br/>target/generated-sources/<br/>UserMapperImpl.java<br/>(Setter/Getter trực tiếp, 0% Reflection)"]
    ImplCode --> Bytecode["Biên Dịch Ra Bytecode .class"]
    Bytecode --> Runtime["Thực Thi Tốc Độ Native Tương Đương Viết Tay"]
    
    style Generator fill:#1e293b,stroke:#3b82f6,color:#fff
    style Runtime fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: So Sánh Các Giải Pháp Chuyển Đổi DTO

| Tiêu chuẩn | MapStruct | ModelMapper | Tự viết tay Setter/Builder |
|---|---|---|---|
| **Cơ chế hoạt động** | Sinh mã nguồn Java thuần lúc compile | Runtime Reflection & Type Token | Code tay 100% |
| **Hiệu năng thực thi** | **Nhanh nhất (Tương đương code tay)** | Chậm gấp 20 - 50 lần | Nhanh nhất |
| **An toàn kiểu dữ liệu** | **Compile-time safety** (báo lỗi ngay khi build nếu sai trường) | Dễ lỗi runtime nếu cấu trúc entity đổi | Compile-time safety |
| **Khối lượng code cần viết** | Cực ít (chỉ cần khai báo interface) | Ít lúc đầu nhưng khó tùy biến | Boilerplate khổng lồ, dễ nản |
| **Khuyến nghị sử dụng** | **Tiêu chuẩn công nghiệp hàng đầu cho Spring Boot 3** | **CẤM DÙNG trên production** | Chỉ dùng khi mapping quá dị biệt |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Lợi ích của MapStruct**: Loại bỏ hoàn toàn overhead của Reflection, kiểm tra lỗi mapping ngay tại bước biên dịch \`mvn compile\`.
2. **Xử lý quan hệ hai chiều**: Khi map đối tượng có quan hệ cha con lồng nhau, luôn cấu hình \`@Context\` CycleAvoidingMappingContext để tránh lỗi \`StackOverflowError\`.
3. **Contract-First là cứu cánh**: Viết file đặc tả OpenAPI (YAML) trước giúp Frontend và Backend có thể phát triển song song mà không cần chờ đợi API hoàn thành.`
};

// Topic 4: 2-4-1 to 2-4-4 (Consolidates 2-4 and 2-5)
const t4_l1 = {
  id: "2-4-1",
  type: "theory",
  title: "Bài 2.4.1: Kiến trúc Phân trang Hàng Triệu Bản Ghi: Offset vs Keyset Pagination & S3 Presigned URL",
  minutes: 8,
  content: getL("2-4-1").content + "\n\n" + getL("2-4-2").content + "\n\n" + getL("2-5-2").content
};

const t4_l2 = {
  id: "2-4-2",
  type: "practice",
  title: "Bài 2.4.2: Triển khai Keyset Pagination Hiệu Năng Cao & Upload File Lớn Qua Presigned URL",
  minutes: 8,
  content: getL("2-4-3").content + "\n\n" + getL("2-5-3").content
};

const t4_l3 = {
  id: "2-4-3",
  type: "pitfall",
  title: "Bài 2.4.3: Cạm bẫy Offset Chết Chóc (Deep Paging Death), Memory Leak Multipart Upload",
  minutes: 7,
  content: getL("2-4-5").content + "\n\n" + getL("2-5-5").content
};

const t4_l4 = {
  id: "2-4-4",
  type: "synthesis",
  title: "Bài 2.4.4: Milestone Synthesis: Bản đồ Phân trang & Ma trận Xử lý File Upload Quy mô Lớn",
  minutes: 8,
  content: `## Milestone Synthesis: Phân Trang Dữ Liệu Lớn & Hạ Tầng Tải Tệp Chịu Tải

### 1. Sơ Đồ Kiến Trúc: Tải File Quy Mô Lớn Bằng S3 Presigned URL (Không Qua Server)

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as Web / Mobile Client
    participant API as Spring Boot Backend Service
    participant S3 as AWS S3 / MinIO Object Storage

    Client->>API: 1. Xin phép tải tệp: POST /api/v1/files/upload-ticket { fileName, size, mimeType }
    activate API
    API->>API: Kiểm tra quyền hạn, quota lưu trữ của User
    API->>S3: Gọi AWS SDK sinh Presigned PUT URL (TTL: 5 phút)
    S3-->>API: Trả về Presigned URL bảo mật kèm token
    API-->>Client: Trả về { presignedUrl, fileKey }
    deactivate API

    Client->>S3: 2. Tải trực tiếp file nhị phân (PUT presignedUrl)
    activate S3
    Note over Client,S3: Băng thông đi thẳng Client -> S3, không tốn 1 byte RAM của Spring Boot!
    S3-->>Client: HTTP 200 OK (Upload thành công)
    deactivate S3

    Client->>API: 3. Xác nhận hoàn tất: POST /api/v1/files/complete { fileKey }
    activate API
    API->>API: Lưu metadata của file vào PostgreSQL
    API-->>Client: Hoàn tất
    deactivate API
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: So Sánh Kỹ Thuật Phân Trang

| Tiêu chuẩn | Offset Pagination (OFFSET / LIMIT) | Keyset Pagination (Seek Method) |
|---|---|---|
| **Câu lệnh SQL** | \`SELECT * FROM orders OFFSET 1000000 LIMIT 20\` | \`SELECT * FROM orders WHERE id > :lastSeenId LIMIT 20\` |
| **Độ phức tạp truy vấn** | $O(N)$ — Database phải quét và bỏ qua 1,000,000 dòng trước khi lấy 20 dòng | $O(\log N)$ — B-Tree Index tìm thẳng đến vị trí \`lastSeenId\` |
| **Thời gian phản hồi** | Càng trang sau càng chậm (có thể mất 5 - 10 giây) | Cực nhanh và ổn định **< 5ms** ở bất kỳ trang nào |
| **Hiện tượng trôi dữ liệu** | Có (nếu có bản ghi mới chèn vào, dữ liệu bị trùng lặp) | **Không bị trùng lặp**, phân trang tuyệt đối chính xác |
| **Nhược điểm** | Sập database khi người dùng crawl trang sâu | Không thể nhảy cóc đến trang bất kỳ (chỉ đi tới / đi lùi) |
| **Khuyến nghị** | Dùng cho bảng nhỏ (< 10,000 dòng) hoặc trang admin | **Bắt buộc cho mạng xã hội, sàn thương mại điện tử, app mobile** |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Tránh bẫy Offset Paging**: Trên tập dữ liệu triệu dòng, \`OFFSET 1000000\` làm database cày nát ổ đĩa (I/O) và tràn bộ nhớ đệm buffer pool.
2. **Kiến trúc S3 Presigned URL**: Không bao giờ upload file video/ảnh dung lượng lớn (> 10MB) đi xuyên qua Spring Boot; hãy dùng S3 Presigned URL để giải phóng 100% băng thông server.
3. **Bảo mật Presigned URL**: Luôn đặt TTL ngắn (3 - 5 phút) và xác thực chặt chẽ quyền hạn trước khi sinh link.`
};

// 2 Additional Quiz Questions to make inline quiz 16 questions (16 + 20 in expanded = 36 total)
const additionalQuestions = [
  {
    level: "hard",
    scenario: "Bảng dữ liệu giao dịch 'transactions' có 50 triệu dòng. Khi client gọi API xem lịch sử ở trang thứ 50,000 bằng câu query 'OFFSET 1000000 LIMIT 20', database PostgreSQL bị tăng CPU lên 100% và query timeout.",
    q: "Nguyên nhân gốc rễ của hiện tượng này và giải pháp kỹ thuật tối ưu nhất là gì?",
    options: [
      "Nguyên nhân do Database phải scan tuần tự và loại bỏ 1,000,000 bản ghi trước đó; giải pháp là chuyển sang Keyset Pagination (Seek Method) dựa trên B-Tree Index của cột ID/Timestamp",
      "Do Spring Data JPA tự động cache toàn bộ 1 triệu bản ghi vào JVM Heap",
      "Do PostgreSQL không hỗ trợ tính năng phân trang",
      "Do connection pool của HikariCP quá nhỏ"
    ],
    answer: 0,
    explain: "Offset pagination yêu cầu database engine phải duyệt qua và loại bỏ toàn bộ N bản ghi offset trước khi trả về limit bản ghi, dẫn đến việc đọc ổ đĩa khủng khiếp. Keyset pagination sử dụng điều kiện WHERE id > :lastSeenId kết hợp index để nhảy thẳng đến vị trí cần lấy với độ phức tạp O(log N).",
    why: [
      "✓ Đúng — Keyset Pagination là tiêu chuẩn bắt buộc cho mọi bảng dữ liệu lớn trong các hệ thống Big Data và E-commerce.",
      "Spring Data JPA không cache kết quả query nếu không cấu hình explicitly.",
      "PostgreSQL hỗ trợ OFFSET/LIMIT rất mạnh, nhưng bản chất thuật toán OFFSET là $O(N)$.",
      "HikariCP chỉ quản lý kết nối, không quyết định thời gian thực thi của câu lệnh SQL trên DB server."
    ]
  },
  {
    level: "medium",
    scenario: "Khi triển khai tính năng upload avatar hoặc hóa đơn chứng từ có dung lượng lớn (> 100MB) trong hệ thống có hàng chục nghìn người dùng đồng thời.",
    q: "Kiến trúc tải tệp nào được khuyến nghị áp dụng để bảo vệ máy chủ Spring Boot không bị cạn kiệt tài nguyên mạng và bộ nhớ?",
    options: [
      "Sinh S3 Presigned URL từ backend rồi gửi cho client để client tải file trực tiếp lên Cloud Storage (S3/GCS/MinIO), không đi qua Spring Boot",
      "Tăng kích thước spring.servlet.multipart.max-file-size lên 1GB và lưu file vào ổ cứng của pod",
      "Chuyển đổi file thành chuỗi Base64 rồi gửi qua JSON body thông thường",
      "Tăng số lượng Pod của Spring Boot lên gấp 10 lần"
    ],
    answer: 0,
    explain: "S3 Presigned URL cho phép trao quyền tải lên có thời hạn cho client. Dòng dữ liệu nhị phân dung lượng lớn đi trực tiếp từ trình duyệt/app của client lên Cloud Storage, giải phóng hoàn toàn băng thông, CPU và RAM của máy chủ ứng dụng Spring Boot.",
    why: [
      "✓ Đúng — Đây là kiến trúc chuẩn của các hệ thống quy mô lớn (Netflix, Shopee, Uber).",
      "Lưu file trực tiếp trên ổ cứng container sẽ làm phình pod và mất dữ liệu khi pod restart.",
      "Base64 làm tăng kích thước file thêm 33% và tiêu tốn lượng RAM khổng lồ để parse chuỗi JSON.",
      "Tăng pod gây lãng phí chi phí hạ tầng nghiêm trọng mà không giải quyết được căn nguyên vấn đề."
    ]
  }
];

const inlineQuiz = oldM2.lessons.find(l => l.type === 'quiz');
const updatedQuizQuestions = inlineQuiz.questions.concat(additionalQuestions);

const newLessons = [
  t1_l1, t1_l2, t1_l3, t1_l4,
  t2_l1, t2_l2, t2_l3, t2_l4,
  t3_l1, t3_l2, t3_l3, t3_l4,
  t4_l1, t4_l2, t4_l3, t4_l4,
  {
    id: "2-quiz",
    type: "quiz",
    title: "Quiz Module 2 — Sát Hạch Toàn Diện REST API Chuyên Nghiệp",
    questions: updatedQuizQuestions
  }
];

const newM2 = {
  id: 2,
  title: "REST API chuyên nghiệp",
  subtitle: "DispatcherServlet, Clean Architecture, Validation & S3 Streaming",
  icon: "🌐",
  desc: "Nắm vững vòng đời HTTP Request, thiết kế RESTful API chuẩn RFC 7807 ProblemDetails và phân trang dữ liệu quy mô lớn.",
  topics: topics,
  outcomes: outcomes,
  retrievalWarmup: retrievalWarmup,
  lessons: newLessons
};

const outputContent = `/* MODULE 2 — REST API chuyên nghiệp (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(${JSON.stringify(newM2, null, 2)});\n`;

fs.writeFileSync(m2Path, outputContent, 'utf8');
console.log('Successfully curated module2.js!');
console.log('Total content lessons:', newLessons.filter(l => l.type !== 'quiz').length);
console.log('Total quiz questions:', updatedQuizQuestions.length);
