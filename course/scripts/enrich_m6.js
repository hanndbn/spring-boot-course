const fs = require('fs');
const path = require('path');

const modPath = path.join(__dirname, '..', 'js', 'content', 'module6.js');
global.window = { COURSE_MODULES: [], EXPANDED_QUIZZES: {} };
new Function('window', fs.readFileSync(modPath, 'utf8'))(window);

const mod = window.COURSE_MODULES[0];

// Diagram 6-1-1: Two-Tier Cache Architecture
const diag_6_1_1 = `
### Sơ Đồ Kiến Trúc: Bộ Đệm Hai Tầng (L1 In-Memory Caffeine + L2 Distributed Redis)

\`\`\`mermaid
flowchart TD
    Client["Client Request (Truy Vấn Giá Sản Phẩm / Tồn Kho)"] --> Gateway["Spring Boot Application Node"]
    
    subgraph L1Tier ["TẦNG 1: Local In-Memory Cache (Caffeine)"]
        L1Cache["Caffeine Cache (RAM Cục Bộ Của JVM)"]
        L1Hit["Cache Hit: Trả về < 0.1ms (Siêu Tốc, 0% Network Overhead)"]
        L1Miss["Cache Miss: Tiếp tục tìm tầng L2"]
        L1Cache -->|Có sẵn trong RAM| L1Hit
        L1Cache -->|Không có| L1Miss
    end

    subgraph L2Tier ["TẦNG 2: Distributed Shared Cache (Redis Cluster)"]
        L2Cache["Redis Cluster (Dùng chung cho toàn bộ Pods/Instances)"]
        L2Hit["Cache Hit: Trả về < 2ms & Ghi ngược lại vào L1"]
        L2Miss["Cache Miss: Bắt buộc đọc Database"]
        L2Cache -->|Có sẵn trong Redis| L2Hit
        L2Cache -->|Không có| L2Miss
    end

    subgraph DBTier ["TẦNG 3: Primary Database (PostgreSQL)"]
        DB["PostgreSQL Database (Nguồn Dữ Liệu Gốc)"]
    end

    Gateway --> L1Cache
    L1Miss --> L2Cache
    L2Miss --> DB
    DB -.->|Ghi đệm nạp ngược| L2Cache
    L2Hit -.->|Đồng bộ cục bộ| L1Cache

    style L1Tier fill:#064e3b,stroke:#10b981,color:#fff
    style L2Tier fill:#1e293b,stroke:#3b82f6,color:#fff
    style DBTier fill:#1f2937,stroke:#4b5563,color:#fff
\`\`\`
`;

// Diagram 6-1-2: Redisson Distributed Lock Watchdog
const diag_6_1_2 = `
### Sơ Đồ Tuần Tự: Cơ Chế Khóa Phân Tán Redisson & Tự Động Gia Hạn (Watchdog)

\`\`\`mermaid
sequenceDiagram
    autonumber
    participant Node1 as App Instance 1 (Xử Lý Flash Sale)
    participant Redis as Redis Master Server
    participant Node2 as App Instance 2 (Trừ Kho Cùng Lúc)

    Node1->>Redis: 1. rLock.lock() (Xin cấp khóa: lock:product:1001)
    Redis-->>Node1: Cấp khóa thành công (LeaseTime = 30s)
    
    Note over Node1,Redis: Redisson Watchdog ngầm tự động gia hạn mỗi 10s:
    Node1->>Redis: Watchdog: Gia hạn thêm 30s (Tránh hết hạn khi xử lý tác vụ nặng)
    
    Node2->>Redis: 2. rLock.lock() (Xin cùng khóa đó)
    Redis-->>Node2: TỪ CHỐI! Khóa đang bị Node 1 chiếm giữ!
    Note over Node2: Node 2 tự động subscribe Redis Pub/Sub và chờ tín hiệu mở khóa
    
    Node1->>Node1: Cập nhật DB trừ kho thành công
    Node1->>Redis: 3. rLock.unlock() (Giải phóng khóa)
    Redis->>Redis: Xóa key lock & Bắn thông báo Pub/Sub
    Redis-->>Node2: Nhận tín hiệu mở khóa -> Node 2 được cấp quyền an toàn!
\`\`\`
`;

// Diagram 6-1-3: Lock Expiration Trap
const diag_6_1_3 = `
### Sơ Đồ Cảnh Báo: Cạm Bẫy Khóa Hết Hạn Làm Mất Tính Độc Quyền (Mutual Exclusion)

\`\`\`mermaid
flowchart TD
    subgraph LockTrap ["CẠM BẪY: Ép LeaseTime Thủ Công Quá Ngắn (rLock.lock(5, TimeUnit.SECONDS))"]
        N1["Node 1 lấy khóa (Hạn 5s)"] --> HeavyTask["Node 1 xử lý nghiệp vụ kéo dài 10s (chậm DB / mạng)"]
        HeavyTask --> Expire["Sau 5s: Redis TỰ ĐỘNG HỦY KHÓA dù Node 1 chưa xong!"]
        Expire --> N2["Node 2 thấy khóa trống -> LẤY KHÓA VÀ BẮT ĐẦU TRỪ KHO!"]
        N2 --> Conflict["2 NODES CÙNG TRỪ KHO ĐỒNG THỜI -> BÁN ÂM KHO HÀNG NGHÌN SẢN PHẨM!"]
    end

    subgraph SolutionWatchdog ["GIẢI PHÁP: Sử Dụng Default Watchdog Của Redisson"]
        WatchdogCall["Không truyền leaseTime thủ công -> Redisson kích hoạt Watchdog tự gia hạn tới khi hoàn tất!"]
    end

    style LockTrap fill:#7c2d12,stroke:#f97316,color:#fff
    style SolutionWatchdog fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 6-2-1: Dual-Write Disaster vs Transactional Outbox
const diag_6_2_1 = `
### Sơ Đồ Đối Chiếu: Thảm Họa Dual-Write vs Kiến Trúc Transactional Outbox

\`\`\`mermaid
flowchart TD
    subgraph DualWriteCrash ["❌ THẢM HỌA DUAL-WRITE: Không Thể Bảo Đảm Atomicity Giữa DB Và Kafka"]
        SaveDB["1. orderService.save(order) -> PostgreSQL (THÀNH CÔNG)"]
        SaveDB --> SendKafka["2. kafkaTemplate.send('orders', order) -> MẠNG CHẬP CHỜN TIMEOUT!"]
        SendKafka --> Crash["HẬU QUẢ: Database có đơn nhưng Kafka KHÔNG CÓ TIN NHẮN!<br/>Dịch vụ Ship hàng không nhận được -> ĐƠN HÀNG BỊ BỎ QUÊN VĨNH VIỄN!"]
    end

    subgraph OutboxSolution ["✅ CHUẨN KIẾN TRÚC: Transactional Outbox Pattern"]
        Tx["BẮT ĐẦU 1 DATABASE TRANSACTION DUY NHẤT"] --> Tx1["Lưu đơn hàng vào bảng 'orders'"]
        Tx --> Tx2["Lưu tin nhắn vào bảng 'outbox_events'"]
        Tx2 --> Commit["COMMIT 100% CÙNG NHAU (ACID Atomicity Tuyệt Đối)"]
        Commit --> Poller["Debezium CDC / Poller Service đọc bảng outbox đẩy sang Kafka an toàn!"]
    end

    style DualWriteCrash fill:#7c2d12,stroke:#f97316,color:#fff
    style OutboxSolution fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 6-2-2: Idempotent Consumer Flow
const diag_6_2_2 = `
### Sơ Đồ Luồng: Xử Lý Trùng Lặp Tin Nhắn Bằng Idempotent Consumer Pattern

\`\`\`mermaid
flowchart TD
    Kafka["Apache Kafka: Consumer nhận Message (OrderCreatedEvent, id='MSG-99')"] --> CheckDB{"Kiểm tra bảng 'processed_events'<br/>WHERE message_id = 'MSG-99'"}
    
    CheckDB -->|ĐÃ TỒN TẠI (Đã xử lý trước đó)| Skip["BỎ QUA NGAY LẬP TỨC (Idempotent Skip):<br/>Không trừ tiền lần 2, commit offset Kafka an toàn!"]
    
    CheckDB -->|CHƯA TỒN TẠI| Process["Thực thi nghiệp vụ trong 1 DB Transaction:"]
    Process --> Step1["1. Trừ tiền số dư ví khách hàng"]
    Process --> Step2["2. INSERT INTO processed_events(message_id) VALUES ('MSG-99')"]
    Step2 --> Commit["Commit Transaction DB -> Acknowledge Kafka Offset"]

    style Skip fill:#1e293b,stroke:#3b82f6,color:#fff
    style Commit fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 6-2-3: Poison Pill & Dead Letter Queue (DLQ)
const diag_6_2_3 = `
### Sơ Đồ Xử Lý: Tin Nhắn Thuốc Độc (Poison Pill) & Tuyến Hàng Đợi Chết (DLQ)

\`\`\`mermaid
sequenceDiagram
    autonumber
    participant Kafka as Kafka Topic: orders.v1
    participant Consumer as Spring Kafka Consumer
    participant DLQ as Kafka DLQ Topic: orders.v1.DLQ
    participant SRE as On-Call SRE / Slack Alert

    Kafka->>Consumer: Giao tin nhắn lỗi JSON format (Poison Pill)
    Consumer->>Consumer: Deserialize lỗi ném SerializationException!
    Note over Consumer: Retry lần 1 (Backoff 1s)... Lỗi tiếp!
    Note over Consumer: Retry lần 2 (Backoff 2s)... Lỗi tiếp!
    Note over Consumer: Retry lần 3 (Vượt quá max-attempts = 3)
    Consumer->>DLQ: CommonErrorHandler tự động chuyển hướng tin nhắn sang orders.v1.DLQ
    Consumer->>Kafka: Commit offset để Consumer tiếp tục xử lý các đơn hàng khác (Không bị nghẽn phân vùng!)
    DLQ->>SRE: Webhook cảnh báo tin nhắn lỗi để kỹ sư kiểm tra thủ công
\`\`\`
`;

// Diagram 6-3-1: Saga Choreography vs Orchestration
const diag_6_3_1 = `
### Sơ Đồ So Sánh: Mô Hình Phối Hợp Saga (Choreography vs Orchestration)

\`\`\`mermaid
flowchart TD
    subgraph Choreography ["1. Saga Choreography (Tự Phát - Event Driven)"]
        O1["Order Svc: Bắn Event"] --> P1["Payment Svc: Nghe & Bắn Event"]
        P1 --> I1["Inventory Svc: Nghe & Xử lý"]
        I1 -.->|Lỗi kho| Compensate["Bắn Event bù trừ ngược lại: Rất khó debug luồng, dễ lặp vòng tròn!"]
    end

    subgraph Orchestration ["2. Saga Orchestration (Khuyên dùng - Điều Phối Tập Trung)"]
        Orchestrator["OrderSagaOrchestrator (Nhạc Trưởng Điều Phối)"]
        Orchestrator -->|1. Lệnh tạo| SvcA["Order Service"]
        Orchestrator -->|2. Lệnh trừ tiền| SvcB["Payment Service"]
        Orchestrator -->|3. Lệnh giữ hàng| SvcC["Inventory Service"]
        SvcC -.->|Báo hết hàng| Orchestrator
        Orchestrator -->|Kích hoạt lệnh hoàn tiền| SvcB
    end

    style Choreography fill:#7c2d12,stroke:#f97316,color:#fff
    style Orchestration fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 6-3-2: Saga Orchestrator Sequence Execution
const diag_6_3_2 = `
### Sơ Đồ Tuần Tự: Luồng Thực Thi Chuỗi Giao Dịch Bù Trừ (Compensating Transactions)

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor User as Khách Hàng
    participant Orch as OrderSagaOrchestrator
    participant Order as OrderService
    participant Pay as PaymentService
    participant Inv as InventoryService

    User->>Orch: Đặt hàng (Checkout)
    Orch->>Order: 1. Tạo đơn hàng (Trạng thái: PENDING)
    Order-->>Orch: Đơn hàng tạo thành công (ORD-1)
    
    Orch->>Pay: 2. Trừ tiền ví điện tử (1,000,000 VND)
    Pay-->>Orch: Trừ tiền thành công
    
    Orch->>Inv: 3. Khóa tồn kho (Trừ 1 sản phẩm)
    Inv-->>Orch: THẤT BẠI! Kho hết hàng (Out of Stock)!
    
    Note over Orch,Pay: KÍCH HOẠT GIAO DỊCH BÙ TRỪ (COMPENSATION):
    Orch->>Pay: 4. Lệnh hoàn tiền (Refund 1,000,000 VND)
    Pay-->>Orch: Đã cộng lại tiền vào ví khách
    
    Orch->>Order: 5. Cập nhật trạng thái đơn (CANCELLED_OUT_OF_STOCK)
    Orch-->>User: Thông báo: Đặt hàng thất bại do hết kho, đã hoàn tiền 100%!
\`\`\`
`;

// Diagram 6-3-3: Lack of Isolation & Semantic Lock Trap
const diag_6_3_3 = `
### Sơ Đồ Cảnh Báo: Thiếu Tính Cô Lập (Lack of Isolation) Trong Saga & Khóa Ngữ Nghĩa

\`\`\`mermaid
flowchart TD
    subgraph DirtyReadTrap ["CẠM BẪY: Đọc Dữ Liệu Bẩn Khi Saga Chưa Hoàn Tất"]
        Step1["Saga Bước 1: Đã trừ tiền 5,000,000 VND trong ví User"] --> Read["User mở ứng dụng thấy số dư = 0 VND"]
        Read --> Step2["Saga Bước 2: Khóa kho thất bại -> Đang hoàn tiền"]
        Step2 --> Confusion["Khách hàng hoảng loạn gọi Hotline khiếu nại mất tiền oan!"]
    end

    subgraph SemanticLockSolution ["GIẢI PHÁP: Sử Dụng Semantic Lock (Khóa Ngữ Nghĩa)"]
        Hold["Không trừ số dư trực tiếp! Chuyển 5,000,000 VND sang trạng thái 'HOLD_FOR_ORDER_123'"]
        Hold --> Resolved["Chỉ khi toàn bộ Saga thành công mới trừ hẳn (Capture); nếu thất bại thì mở khóa (Release)!"]
    end

    style DirtyReadTrap fill:#7c2d12,stroke:#f97316,color:#fff
    style SemanticLockSolution fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 6-4-1: Circuit Breaker State Machine
const diag_6_4_1 = `
### Sơ Đồ Trạng Thái: Máy Trạng Thái Của Resilience4j Circuit Breaker

\`\`\`mermaid
stateDiagram-v2
    [*] --> CLOSED: Khởi động hệ thống
    
    state CLOSED {
        [*] --> ServingNormally: 100% Requests được cho qua
        ServingNormally --> ServingNormally: Tỷ lệ lỗi < 50%
    }
    
    CLOSED --> OPEN: Tỷ lệ lỗi >= 50% (VD: 5/10 requests timeout)
    
    state OPEN {
        [*] --> FastFail: CHẶN ĐỨNG 100% REQUESTS! Ném CallNotPermittedException ngay lập tức (Không chờ mạng)
    }
    
    OPEN --> HALF_OPEN: Sau waitDurationInOpenState (10 giây)
    
    state HALF_OPEN {
        [*] --> TrialRequests: Cho phép 5 requests thử nghiệm đi qua
    }
    
    HALF_OPEN --> CLOSED: Cả 5 requests đều thành công (Hạ tầng phục hồi)
    HALF_OPEN --> OPEN: Vẫn còn lỗi (Tiếp tục cách ly thêm 10 giây)
\`\`\`
`;

// Diagram 6-4-2: Spring Cloud Gateway & Redis Rate Limiter Architecture
const diag_6_4_2 = `
### Sơ Đồ Kiến Trúc: Cổng Điều Phối Spring Cloud Gateway & Giới Hạn Tần Suất Redis

\`\`\`mermaid
flowchart TD
    Client["Client Traffic (Web / Mobile)"] --> Gateway["Spring Cloud Gateway (Netty Non-Blocking Reactor)"]
    
    subgraph GatewayFilters ["Bộ Lọc Gateway Filter Chain"]
        RouteFilter["1. Route Predicate: Khớp đường dẫn /api/v1/orders/**"]
        RateLimiter["2. RequestRateLimiter (Redis Token Bucket: 100 req/s mỗi IP)"]
        CircuitBreaker["3. CircuitBreaker Filter (Bảo vệ downstream)"]
    end

    subgraph BackendServices ["Hệ Thống Dịch Vụ Phân Tán (Microservices)"]
        OrderService["Order Microservice (Port 8081)"]
        PaymentService["Payment Microservice (Port 8082)"]
    end

    Gateway --> RouteFilter
    RouteFilter --> RateLimiter
    RateLimiter -->|Vượt quá hạn mức| Reject429["429 Too Many Requests"]
    RateLimiter -->|Hợp lệ| CircuitBreaker
    CircuitBreaker --> OrderService
    CircuitBreaker --> PaymentService

    style Gateway fill:#1e293b,stroke:#3b82f6,color:#fff
    style GatewayFilters fill:#064e3b,stroke:#10b981,color:#fff
    style Reject429 fill:#7c2d12,stroke:#f97316,color:#fff
\`\`\`
`;

// Diagram 6-4-3: AOP Aspect Ordering Pitfall
const diag_6_4_3 = `
### Sơ Đồ Cảnh Báo: Thứ Tự Bọc Sai Làm Sập Hạ Tầng (Retry Bọc Ngoài CircuitBreaker)

\`\`\`mermaid
flowchart TD
    subgraph WrongOrder ["❌ THỨ TỰ SAI: Retry Bọc Ngoài CircuitBreaker (Thảm Họa DoS)"]
        ClientBad["Request"] --> RetryOuter["@Retry (3 Lần)"]
        RetryOuter --> CBInner["CircuitBreaker (Đang OPEN vì Payment Service đang chết)"]
        CBInner --> FastFailBad["CB trả về lỗi ngay"]
        FastFailBad --> RetryTrigger["Retry bắn tiếp lần 2, lần 3... NHÂN SỐ LƯỢNG REQUESTS LÊN GẤP 3 LẦN!"]
        RetryTrigger --> DoS["Đổ thêm dầu vào lửa, Payment Service không bao giờ ngóc đầu dậy nổi!"]
    end

    subgraph CorrectOrder ["✅ THỨ TỰ ĐÚNG: CircuitBreaker Bọc Ngoài Cùng"]
        ClientGood["Request"] --> CBOuter["CircuitBreaker (Bảo Vệ Ngoài Cùng)"]
        CBOuter -->|Nếu OPEN| FastDrop["Ngắt ngay lập tức, không cho phép Retry chạy!"]
        CBOuter -->|Nếu CLOSED| RetryInner["@Retry chỉ thử lại nội bộ khi có lỗi mạng chập chờn"]
    end

    style WrongOrder fill:#7c2d12,stroke:#f97316,color:#fff
    style CorrectOrder fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 6-5-1: Spring Batch Chunk-Oriented Processing
const diag_6_5_1 = `
### Sơ Đồ Kiến Trúc: Vòng Lặp Xử Lý Dữ Liệu Lớn Trong Spring Batch (Chunk-Oriented)

\`\`\`mermaid
sequenceDiagram
    autonumber
    participant JobLauncher as JobLauncher
    participant Step as Step (Chunk Size = 100)
    participant Reader as ItemReader (Đọc từng bản ghi)
    participant Processor as ItemProcessor (Xử lý nghiệp vụ)
    participant Writer as ItemWriter (Ghi theo lô)
    participant DB as PostgreSQL Database

    JobLauncher->>Step: Khởi động Step đối soát giao dịch
    loop Lặp lại từng Chunk (100 Items)
        loop Đọc từng phần tử (100 lần)
            Step->>Reader: read()
            Reader-->>Step: Trả về TransactionRecord
            Step->>Processor: process(TransactionRecord)
            Processor-->>Step: Trả về ReconciledReportRecord
        end
        Note over Step,Writer: Gom đủ 100 records đã xử lý:
        Step->>Writer: write(List&lt;ReconciledReportRecord&gt;)
        Writer->>DB: JDBC Batch Insert 100 bản ghi trong 1 Database Transaction duy nhất!
        DB-->>Writer: Commit thành công
        Step->>Step: Cập nhật StepExecution Context (Ghi nhớ checkpoint)
    end
\`\`\`
`;

// Diagram 6-5-2: Spring Modulith Architecture & Boundaries
const diag_6_5_2 = `
### Sơ Đồ Ranh Giới: Kiến Trúc Spring Modulith Kiểm Soát Ranh Giới Giữa Các Module

\`\`\`mermaid
graph TD
    subgraph OrderModule ["Module: order (Đơn Hàng)"]
        OrderAPI["OrderService (Public API)"]
        OrderInternal["OrderRepository / Entity (Package-private: order.internal)"]
    end

    subgraph PaymentModule ["Module: payment (Thanh Toán)"]
        PayAPI["PaymentService (Public API)"]
        PayInternal["VNPayClient (Package-private: payment.internal)"]
    end

    subgraph EventBus ["Asynchronous Event Bus"]
        Event["OrderPlacedEvent (Published qua ApplicationEvents)"]
    end

    OrderAPI --> Event
    Event --> PayAPI
    OrderAPI -.->|TUYỆT ĐỐI CẤM (Spring Modulith Chặn Lúc Test!)| PayInternal

    style OrderModule fill:#1e293b,stroke:#3b82f6,color:#fff
    style PaymentModule fill:#064e3b,stroke:#10b981,color:#fff
    style EventBus fill:#1e1b4b,stroke:#6366f1,color:#fff
\`\`\`
`;

// Diagram 6-5-3: ItemReader Heap OOM Trap
const diag_6_5_3 = `
### Sơ Đồ Cảnh Báo: Tràn Heap Memory Trong Spring Batch Do Đọc Toàn Bộ Vào RAM

\`\`\`mermaid
flowchart TD
    subgraph OOMTrap ["CẠM BẪY: Dùng ListItemReader Nạp 10 Triệu Bản Ghi"]
        QueryAll["SELECT * FROM transactions (10,000,000 records)"] --> ListRAM["Nạp toàn bộ 10 triệu entities vào ArrayList trong RAM"]
        ListRAM --> Crash["Tốn 16GB RAM -> java.lang.OutOfMemoryError: Java heap space!"]
    end

    subgraph CursorSolution ["GIẢI PHÁP: Sử Dụng JdbcCursorItemReader Hoặc Keyset Paging"]
        Cursor["JdbcCursorItemReader (Streaming Cursor)"] --> StreamBatch["Duyệt dữ liệu qua Database Cursor: Chỉ giữ đúng 100 bản ghi trên RAM tại một thời điểm!"]
        StreamBatch --> SafeStable["RAM luôn phẳng ở mức 128MB dù xử lý 100 triệu bản ghi!"]
    end

    style OOMTrap fill:#7c2d12,stroke:#f97316,color:#fff
    style CursorSolution fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

const injections = {
  '6-1-1': diag_6_1_1,
  '6-1-2': diag_6_1_2,
  '6-1-3': diag_6_1_3,
  '6-2-1': diag_6_2_1,
  '6-2-2': diag_6_2_2,
  '6-2-3': diag_6_2_3,
  '6-3-1': diag_6_3_1,
  '6-3-2': diag_6_3_2,
  '6-3-3': diag_6_3_3,
  '6-4-1': diag_6_4_1,
  '6-4-2': diag_6_4_2,
  '6-4-3': diag_6_4_3,
  '6-5-1': diag_6_5_1,
  '6-5-2': diag_6_5_2,
  '6-5-3': diag_6_5_3,
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
const outputCode = `/* MODULE 6 — Microservices & Messaging (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(${JSON.stringify(mod, null, 2)});\n`;

fs.writeFileSync(modPath, outputCode, 'utf8');
console.log(`\nHoàn thành bổ sung sơ đồ Mermaid cho Module 6! Số bài cập nhật: ${updatedCount}/15`);
