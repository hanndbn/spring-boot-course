const fs = require('fs');
const path = require('path');

const modPath = path.join(__dirname, '..', 'js', 'content', 'module4.js');
global.window = { COURSE_MODULES: [], EXPANDED_QUIZZES: {} };
new Function('window', fs.readFileSync(modPath, 'utf8'))(window);

const mod = window.COURSE_MODULES[0];

// Diagram 4-1-1: Testing Pyramid & JUnit 5 Architecture
const diag_4_1_1 = `
### Sơ Đồ Kiến Trúc: Kim Tự Tháp Kiểm Thử Doanh Nghiệp & Kiến Trúc JUnit 5 Platform

\`\`\`mermaid
flowchart TD
    subgraph TestingPyramid ["Kim Tự Tháp Kiểm Thử Doanh Nghiệp (Test Pyramid)"]
        E2E["1. End-to-End Tests (10%)<br/>(Chậm, tốn kém, kiểm thử toàn bộ luồng người dùng từ UI -> DB)"]
        Integration["2. Integration Tests (20%)<br/>(Kiểm thử tích hợp: @WebMvcTest, Testcontainers PostgreSQL thật)"]
        Unit["3. Unit Tests (70%)<br/>(Nhanh, rẻ, chạy dưới 5ms/test, cô lập 100% bằng Mockito)"]
        Unit --> Integration
        Integration --> E2E
    end

    subgraph JUnit5Engine ["Kiến Trúc Tầng Sâu JUnit 5"]
        Platform["JUnit Platform (Nền tảng khởi chạy test trên IDE/Maven)"]
        Jupiter["JUnit Jupiter (API @Test, Assertions, Extension Model)"]
        Vintage["JUnit Vintage (Tương thích ngược JUnit 3/4 cũ)"]
        Platform --> Jupiter
        Platform --> Vintage
    end

    style Unit fill:#064e3b,stroke:#10b981,color:#fff
    style Integration fill:#1e293b,stroke:#3b82f6,color:#fff
    style E2E fill:#7c2d12,stroke:#f97316,color:#fff
\`\`\`
`;

// Diagram 4-1-2: BDDMockito & ArgumentCaptor Flow
const diag_4_1_2 = `
### Sơ Đồ Tuần Tự: Luồng Kiểm Thử Đơn Vị Chuẩn BDD (Given - When - Then)

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Tester as Unit Test Method
    participant MockRepo as OrderRepository (Mockito Mock)
    participant MockPay as PaymentClient (Mockito Mock)
    participant Svc as OrderService (Class Under Test)
    participant Captor as ArgumentCaptor&lt;Order&gt;

    Note over Tester,MockRepo: GIAI ĐOẠN 1: GIVEN (Chuẩn bị dữ liệu & Giả lập hành vi)
    Tester->>MockRepo: given(repo.save(any())).willAnswer(return self)
    Tester->>MockPay: given(pay.charge(any())).willReturn(SUCCESS)
    
    Note over Tester,Svc: GIAI ĐOẠN 2: WHEN (Gọi hàm nghiệp vụ thực tế)
    Tester->>Svc: checkout(orderRequest)
    Svc->>MockPay: charge(amount)
    Svc->>MockRepo: save(order)
    
    Note over Tester,Captor: GIAI ĐOẠN 3: THEN (Xác minh kết quả & Bắt giữ đối tượng)
    Tester->>MockRepo: then(repo).should().save(captor.capture())
    Tester->>Captor: captor.getValue()
    Captor-->>Tester: Trả về thực thể Order thực tế được lưu
    Tester->>Tester: assertThat(order.getStatus()).isEqualTo(PAID)
\`\`\`
`;

// Diagram 4-1-3: Over-Mocking Trap & Spy State Leakage
const diag_4_1_3 = `
### Sơ Đồ Cảnh Báo: Cạm Bẫy Over-Mocking & Rò Rỉ Trạng Thái Khi Dùng @Spy

\`\`\`mermaid
flowchart TD
    subgraph OverMockingTrap ["CẠM BẪY 1: Over-Mocking (Mock Quá Nhiều)"]
        Test["Unit Test"] -->|Mock getter, setter, utility, validator| FakeWorld["Môi trường hoàn toàn là Mock giả tạo!"]
        FakeWorld --> Pass["Test xanh 100% nhưng chạy thật gãy ngay lập tức vì code thật không kết nối được!"]
        FakeWorld --> Fragile["Refactor một dòng code nội bộ làm 50 unit tests gãy vô lý!"]
    end

    subgraph SpyLeak ["CẠM BẪY 2: @Spy Rò Rỉ Tác Vụ Thật"]
        Spy["@Spy ServiceThật"] --> Call["when(spy.calc()).thenReturn(10)"]
        Call --> Danger["MỘT PHẦN CODE THẬT VẪN ĐƯỢC THỰC THI! Nguy cơ gọi nhầm DB hoặc API bên ngoài!"]
    end

    style OverMockingTrap fill:#7c2d12,stroke:#f97316,color:#fff
    style SpyLeak fill:#7c2d12,stroke:#f97316,color:#fff
\`\`\`
`;

// Diagram 4-2-1: Sliced Testing Scope Comparison
const diag_4_2_1 = `
### Sơ Đồ Phân Vùng: So Sánh Phạm Vi Của @SpringBootTest vs Sliced Testing

\`\`\`mermaid
flowchart TD
    subgraph FullContext ["@SpringBootTest (Full ApplicationContext)"]
        FullTomcat["Embedded Tomcat Server"]
        FullSec["Spring Security Filters"]
        FullWeb["Web Controllers"]
        FullSvc["Business Services"]
        FullRepo["JPA Repositories & DB"]
        FullKafka["Kafka / Messaging"]
        NoteFull["Ưu: Giống 100% production<br/>Nhược: Khởi động cực chậm (10-30 giây)"]
    end

    subgraph WebSlice ["@WebMvcTest (Web Tier Slice)"]
        SliceCtrl["Chỉ nạp Controller + Security"]
        MockSvc["Service được Mock bằng @MockBean"]
        NoteWeb["Tốc độ: 1-2 giây! Chuyên test validation & HTTP status"]
    end

    subgraph DataSlice ["@DataJpaTest (Database Tier Slice)"]
        SliceRepo["Chỉ nạp Entity + JPA Repository"]
        TestDB["Testcontainers PostgreSQL Thật"]
        NoteData["Tốc độ: 2-3 giây! Chuyên test câu SQL phức tạp & Lock"]
    end

    style FullContext fill:#1f2937,stroke:#4b5563,color:#fff
    style WebSlice fill:#1e293b,stroke:#3b82f6,color:#fff
    style DataSlice fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 4-2-2: Testcontainers Lifecycle & ServiceConnection
const diag_4_2_2 = `
### Sơ Đồ Vòng Đời: Khởi Tạo Testcontainers PostgreSQL & Cơ Chế @ServiceConnection

\`\`\`mermaid
sequenceDiagram
    autonumber
    participant JUnit as JUnit 5 Test Runner
    participant TC as Testcontainers Java Client
    participant Docker as Docker Engine Daemon
    participant Spring as Spring Boot 3.3 Dynamic Datasource
    participant Test as @Test Method

    JUnit->>TC: Kích hoạt @Container static PostgreSQLContainer
    TC->>Docker: Gửi lệnh Docker API: Run Container postgres:16-alpine
    Docker->>Docker: Cấp phát cổng ngẫu nhiên trên host (vd: 32789 -> 5432)
    Docker-->>TC: Container HEALTHY (Đã sẵn sàng nhận kết nối)
    TC->>Spring: @ServiceConnection tự động inject spring.datasource.url = localhost:32789
    Note over Spring: KHÔNG CẦN CẤU HÌNH THỦ CÔNG @DynamicPropertySource!
    Spring->>Docker: Flyway chạy migration tạo bảng thật
    JUnit->>Test: Thực thi test case ghi/đọc dữ liệu thật
    Test-->>JUnit: Test PASS 100%
    Note over Docker: Khi toàn bộ test suite kết thúc: Ryuk container tự động dọn dẹp sạch sẽ!
\`\`\`
`;

// Diagram 4-2-3: The Danger of H2 In-Memory Database
const diag_4_2_3 = `
### Sơ Đồ Cảnh Báo: Hiểm Họa H2 In-Memory Giấu Lỗi Sản Xuất

\`\`\`mermaid
flowchart TD
    subgraph H2Trap ["❌ Dùng H2 In-Memory Để Test (Giả Lập Nguy Hiểm)"]
        H2["H2 Database Engine"] --> H2Pass["Cú pháp lỏng lẻo, bỏ qua JSONB, không kiểm tra Case Sensitivity, không hỗ trợ CTE phức tạp"]
        H2Pass --> FalseGreen["Test trên CI báo XANH 100%!"]
        FalseGreen --> Deploy["Deploy lên môi trường Production (PostgreSQL 16)"]
        Deploy --> ProdCrash["PRODUCTION CRASH: Lỗi cú pháp SQL, gãy locking, mất mát dữ liệu khách hàng!"]
    end

    subgraph TestcontainersSafe ["✅ Dùng Testcontainers PostgreSQL Thật (100% Trung Thực)"]
        PG["PostgreSQL Docker Container Thật"] --> PGVerify["Chạy cùng engine, cùng version với Production!"]
        PGVerify --> TrueConfidence["Phát hiện 100% lỗi SQL ngay trên máy dev trước khi commit!"]
    end

    style H2Trap fill:#7c2d12,stroke:#f97316,color:#fff
    style TestcontainersSafe fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 4-3-1: Asynchronous Testing Architecture With Awaitility
const diag_4_3_1 = `
### Sơ Đồ Kiến Trúc: Cơ Chế Thăm Dò (Polling) Của Awaitility Cho Tác Vụ Bất Đồng Bộ

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Test as Integration Test Thread
    participant App as Spring Boot Service (@Async / Kafka Listener)
    participant DB as PostgreSQL Database
    participant Aw as Awaitility Engine

    Test->>App: Gửi sự kiện kích hoạt tác vụ bất đồng bộ (publish event)
    App-->>Test: Trả về ngay lập tức (Non-blocking)
    
    Test->>Aw: await().atMost(5, SECONDS).untilAsserted(...)
    loop Thăm dò trạng thái mỗi 100ms (Polling Interval)
        Aw->>DB: SELECT status FROM orders WHERE id = 'ORD-123'
        DB-->>Aw: status = 'PROCESSING' (Chưa đạt điều kiện)
        Note over Aw: Tạm dừng 100ms không khóa CPU...
        Aw->>DB: SELECT status FROM orders WHERE id = 'ORD-123'
        DB-->>Aw: status = 'COMPLETED' (Đã xử lý xong!)
    end
    Aw-->>Test: Điều kiện thỏa mãn sau 450ms -> Test PASS nhanh gọn!
    Note over Test: Không bao giờ dùng Thread.sleep(5000) tĩnh làm lãng phí thời gian CI/CD!
\`\`\`
`;

// Diagram 4-3-2: Spring Security Context Flow in Testing
const diag_4_3_2 = `
### Sơ Đồ Tuần Tự: Luồng Tiêm Danh Tính Giả Lập Với @WithMockUser

\`\`\`mermaid
sequenceDiagram
    autonumber
    participant Runner as JUnit 5 Test Runner
    participant SecurityCtx as TestSecurityContextHolder
    participant MockMvc as MockMvc Client
    participant FilterChain as Spring Security Filter Chain
    participant Controller as AdminOrderController

    Runner->>SecurityCtx: Đọc chú thích @WithMockUser(username="admin", roles={"ADMIN"})
    SecurityCtx->>SecurityCtx: Tạo UsernamePasswordAuthenticationToken(roles=[ROLE_ADMIN])
    Runner->>MockMvc: perform(delete("/api/v1/orders/123"))
    MockMvc->>FilterChain: Chuyển request kèm SecurityContext
    FilterChain->>FilterChain: SecurityContextHolderFilter nạp danh tính Admin
    FilterChain->>FilterChain: AuthorizationFilter kiểm tra @PreAuthorize("hasRole('ADMIN')") -> HỢP LỆ!
    FilterChain->>Controller: Cho phép thực thi lệnh xóa
    Controller-->>MockMvc: 204 No Content
    Note over Runner,SecurityCtx: Sau test: Tự động xóa sạch SecurityContext để chống rò rỉ sang test khác!
\`\`\`
`;

// Diagram 4-3-3: Flaky Test & SecurityContext Leakage Trap
const diag_4_3_3 = `
### Sơ Đồ Cảnh Báo: Sự Cố Flaky Test Do Rò Rỉ SecurityContext Giữa Các Test Case

\`\`\`mermaid
flowchart TD
    subgraph TestA ["Test Case A: Kiểm Tra Quyền Admin"]
        A1["Test A đặt SecurityContext thủ công: user = 'admin'"] --> A2["Chạy test thành công"]
        A2 --> A3["QUÊN DỌN DẸP: Không gọi SecurityContextHolder.clearContext()"]
    end

    subgraph TestB ["Test Case B: Kiểm Tra Chặn Khách Vãng Lai (Guest)"]
        A3 --> B1["Thread tái sử dụng sang Test B"]
        B1 --> B2["Test B kỳ vọng nhận 401 Unauthorized"]
        B2 --> B3["Nhưng Thread vẫn mang token Admin của Test A!"]
        B3 --> Flaky["LỖI FLAKY TEST: Nhận 200 OK thay vì 401 -> TEST GÃY BẤT THƯỜNG TRÊN CI/CD!"]
    end

    style TestA fill:#1e293b,stroke:#3b82f6,color:#fff
    style TestB fill:#7c2d12,stroke:#f97316,color:#fff
\`\`\`
`;

// Diagram 4-4-1: ArchUnit Bytecode Analysis Engine
const diag_4_4_1 = `
### Sơ Đồ Kiến Trúc: Cỗ Máy Phân Tích Bytecode Của ArchUnit (Architecture as Code)

\`\`\`mermaid
flowchart LR
    subgraph BuildPipeline ["Quá Trình Biên Dịch Maven"]
        JavaSource["Mã Nguồn Java 21 (.java)"] --> Compiler["javac Compiler"]
        Compiler --> Bytecode["File Bytecode (.class)"]
    end

    subgraph ArchUnitEngine ["Cỗ Máy Kiểm Định ArchUnit"]
        Bytecode --> ASMParser["ASM Classfile Parser: Quét quan hệ dependencies, package, annotation"]
        ASMParser --> ClassGraph["Đồ Thị Kiến Trúc Lớp (Class Dependency Graph)"]
        ClassGraph --> RulesEngine["Đánh Giá Bộ Quy Tắc Kiến Trúc (Architecture Rules)"]
    end

    RulesEngine --> Verdict{"Kết Quả Kiểm Định"}
    Verdict -->|Hợp lệ| Pass["Build Thành Công ✓"]
    Verdict -->|Vi phạm| Fail["GÃY BUILD CI/CD: Controller không được gọi trực tiếp Repository!"]

    style ArchUnitEngine fill:#1e293b,stroke:#3b82f6,color:#fff
    style Pass fill:#064e3b,stroke:#10b981,color:#fff
    style Fail fill:#7c2d12,stroke:#f97316,color:#fff
\`\`\`
`;

// Diagram 4-4-2: ArchUnit Layered Architecture Guardrails
const diag_4_4_2 = `
### Sơ Đồ Ranh Giới: Bộ Quy Tắc Phân Tầng Cưỡng Chế Kiến Trúc (Layered Boundaries)

\`\`\`mermaid
graph TD
    subgraph PresentationLayer ["1. Tầng Trình Diễn (Presentation / Controller)"]
        Controller["OrderController<br/>PaymentController"]
    end

    subgraph ServiceLayer ["2. Tầng Nghiệp Vụ (Service / Domain)"]
        Service["OrderService<br/>PaymentProcessor"]
    end

    subgraph DataLayer ["3. Tầng Dữ Liệu (Repository / Persistence)"]
        Repo["OrderRepository<br/>PaymentRepository"]
    end

    Controller -->|CHO PHÉP| Service
    Service -->|CHO PHÉP| Repo
    Controller -.->|TUYỆT ĐỐI CẤM (ArchUnit Chặn Đứng!)| Repo

    style PresentationLayer fill:#1e293b,stroke:#3b82f6,color:#fff
    style ServiceLayer fill:#064e3b,stroke:#10b981,color:#fff
    style DataLayer fill:#1e1b4b,stroke:#6366f1,color:#fff
\`\`\`
`;

// Diagram 4-4-3: Fake Coverage Trap
const diag_4_4_3 = `
### Sơ Đồ Cảnh Báo: Cạm Bẫy Độ Bao Phủ Giả Tạo (Fake 100% Code Coverage)

\`\`\`mermaid
flowchart TD
    subgraph FakeCoverage ["❌ TEST VÔ NGHĨA: Chạy Qua Code Nhưng Không Assert"]
        TestBad["@Test void testCheckout() { orderService.checkout(order); }"]
        TestBad --> Jacoco["JaCoCo đo lường: Toàn bộ dòng code được thực thi -> Báo 100% Coverage XANH!"]
        Jacoco --> BugLurking["NHƯNG: Không hề kiểm tra số tiền, trạng thái đơn, hay ngoại lệ!"]
        BugLurking --> ProdLeak["BUG PRODUCTION: Đơn hàng bị trừ tiền 2 lần mà test vẫn báo pass!"]
    end

    subgraph MeaningfulCoverage ["✅ TEST CHUẨN MỰC: Assertion & Verification Đầy Đủ"]
        TestGood["Kiểm tra đầy đủ assertions: assertThat(order.getStatus()).isEqualTo(PAID)"]
        TestGood --> TrueQuality["Bảo vệ phần mềm thật sự trước mọi nguy cơ hồi quy mã nguồn!"]
    end

    style FakeCoverage fill:#7c2d12,stroke:#f97316,color:#fff
    style MeaningfulCoverage fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

const injections = {
  '4-1-1': diag_4_1_1,
  '4-1-2': diag_4_1_2,
  '4-1-3': diag_4_1_3,
  '4-2-1': diag_4_2_1,
  '4-2-2': diag_4_2_2,
  '4-2-3': diag_4_2_3,
  '4-3-1': diag_4_3_1,
  '4-3-2': diag_4_3_2,
  '4-3-3': diag_4_3_3,
  '4-4-1': diag_4_4_1,
  '4-4-2': diag_4_4_2,
  '4-4-3': diag_4_4_3,
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
const outputCode = `/* MODULE 4 — Testing (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(${JSON.stringify(mod, null, 2)});\n`;

fs.writeFileSync(modPath, outputCode, 'utf8');
console.log(`\nHoàn thành bổ sung sơ đồ Mermaid cho Module 4! Số bài cập nhật: ${updatedCount}/12`);
