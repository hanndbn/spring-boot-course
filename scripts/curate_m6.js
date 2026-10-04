const fs = require('fs');
const path = require('path');

global.window = { COURSE_MODULES: [] };
const m6Path = path.join(__dirname, '..', 'js', 'content', 'module6.js');
new Function('window', fs.readFileSync(m6Path, 'utf8'))(window);
const oldM6 = window.COURSE_MODULES[0];

const topics = [
  { id: 1, title: "Redis Caching & Distributed Locking", desc: "Bộ đệm hai tầng Caffeine + Redis, chống Cache Stampede và khóa phân tán Redisson RLock." },
  { id: 2, title: "Kafka & Transactional Outbox Pattern", desc: "Giải quyết thảm họa Dual-Write, triển khai Transactional Outbox và Idempotent Consumer." },
  { id: 3, title: "Saga Pattern & Distributed Transactions", desc: "Mô hình giao dịch phân tán Saga, so sánh Orchestration vs Choreography và giao dịch bù trừ." },
  { id: 4, title: "Resilience4j & API Gateway", desc: "Khả năng tự phục hồi với Circuit Breaker, Rate Limiter, Retry và định tuyến Spring Cloud Gateway." },
  { id: 5, title: "Spring Batch & Modular Architecture", desc: "Xử lý dữ liệu lớn Chunk-Oriented Processing, kiến trúc Spring Modulith và Multi-tenancy." }
];

const outcomes = [
  "Triển khai kiến trúc Cache hai tầng và khóa phân tán Redisson chống race condition quy mô lớn",
  "Giải quyết triệt để thảm họa Dual-Write bằng Transactional Outbox Pattern kết hợp Apache Kafka",
  "Làm chủ chuỗi giao dịch phân tán Saga Orchestration với cơ chế Compensating Transaction hoàn trả",
  "Cấu hình Circuit Breaker Resilience4j và đóng gói kiến trúc Module hóa bền vững với Spring Modulith"
];

const retrievalWarmup = [
  {
    question: "Trong Module 5, tại sao trong kiến trúc REST API Stateless với JWT, cấu hình sessionManagement(SessionCreationPolicy.STATELESS) lại là bắt buộc?",
    options: [
      "Để ngăn chặn Spring Security tự động tạo HttpSession trên máy chủ, bảo đảm tính chất hoàn toàn Stateless của JWT token trên hệ thống phân tán",
      "Để ép người dùng phải đăng nhập lại sau mỗi 5 giây",
      "Để chuyển dữ liệu người dùng sang lưu trữ trên ổ cứng",
      "Để tăng dung lượng bộ nhớ Heap của JVM"
    ],
    answer: 0,
    explain: "SessionCreationPolicy.STATELESS yêu cầu Spring Security không bao giờ tạo hoặc sử dụng HttpSession để lưu SecurityContext, bảo đảm tính chất hoàn toàn Stateless của JWT token trên phân tán.",
    targetLessonId: "5-1-1"
  },
  {
    question: "Cơ chế bảo mật nào của Refresh Token Rotation (RTR) giúp phát hiện và ngăn chặn hacker khi token bị đánh cắp?",
    options: [
      "Phát hiện Tái sử dụng (Reuse Detection): Khi một Refresh Token đã cũ bị dùng lại lần thứ hai, hệ thống lập tức thu hồi toàn bộ Token Family của tài khoản đó",
      "Tự động xóa tài khoản của người dùng",
      "Chặn IP của toàn bộ quốc gia",
      "Gửi email yêu cầu người dùng nộp tiền phạt"
    ],
    answer: 0,
    explain: "Mỗi Refresh Token chỉ được dùng đúng 1 lần. Nếu máy chủ phát hiện một token đã 'USED' được gửi lên lần 2, hệ thống biết rằng token đã bị rò rỉ và lập tức vô hiệu hóa mọi phiên đăng nhập của tài khoản.",
    targetLessonId: "5-2-4"
  },
  {
    question: "Tại sao trong kiến trúc Microservices, các Resource Server lại sử dụng Public Key từ JWKS Endpoint để tự xác thực token thay vì gọi mạng sang Auth Server ở mỗi request?",
    options: [
      "Để thực hiện Zero-Network Verification (xác thực chữ ký số cục bộ trong bộ nhớ RAM), loại bỏ hoàn toàn độ trễ mạng và ngăn chặn nguy cơ DDoS Auth Server",
      "Vì mạng nội bộ không cho phép truyền dữ liệu qua giao thức HTTP",
      "Vì Auth Server không có cơ sở dữ liệu",
      "Vì các Resource Server không tin tưởng Auth Server"
    ],
    answer: 0,
    explain: "Nhờ thuật toán ký số bất đối xứng (RSA/ECDSA), Resource Server chỉ cần Public Key là có thể tự kiểm tra tính toàn vẹn của token trong vài microsecond mà không cần gọi mạng qua Auth Server.",
    targetLessonId: "5-3-1"
  }
];

const getL = (id) => oldM6.lessons.find(l => l.id === id);

// Topic 1: 6-1-1 to 6-1-4 (Consolidates 6-1 and 6-8)
const t1_l1 = {
  id: "6-1-1",
  type: "theory",
  title: "Bài 6.1.1: Kiến trúc Bộ Đệm Hai Tầng (Caffeine + Redis) & Cơ Chế Khóa Phân Tán Redisson",
  minutes: 8,
  content: getL("6-1-1").content + "\n\n" + getL("6-1-2").content + "\n\n" + getL("6-1-3").content + "\n\n" + getL("6-8-2").content
};

const t1_l2 = {
  id: "6-1-2",
  type: "practice",
  title: "Bài 6.1.2: Triển khai Redisson Distributed Lock & Chống Cache Stampede với Probabilistic Early Expiration",
  minutes: 8,
  content: getL("6-1-4").content + "\n\n" + getL("6-8-4").content
};

const t1_l3 = {
  id: "6-1-3",
  type: "pitfall",
  title: "Bài 6.1.3: Cạm bẫy RLock Quá Hạn Làm Mất Tính Độc Quyền & Lỗ Hổng Serialization Redis",
  minutes: 7,
  content: getL("6-1-6").content + "\n\n" + getL("6-8-5").content
};

const t1_l4 = {
  id: "6-1-4",
  type: "synthesis",
  title: "Bài 6.1.4: Milestone Synthesis: Bản đồ Kiến trúc Caching Phân Tán & Ma trận Lựa Chọn Khóa Redis",
  minutes: 8,
  content: `## Milestone Synthesis: Bộ Đệm Hai Tầng & Khóa Phân Tán Redisson

### 1. Sơ Đồ Kiến Trúc: Bộ Đệm Hai Tầng (Two-Level Cache) + Redis Distributed Lock

\`\`\`mermaid
flowchart TD
    ClientReq["Client Query (GET /api/v1/products/hot)"] --> L1Cache{"Tầng 1: L1 Local Cache<br/>(Caffeine In-Memory)<br/>Độ trễ: < 100ns"}
    L1Cache -- "HIT (90% requests)" --> ReturnL1["Trả về dữ liệu ngay lập tức (Không tốn I/O mạng!)"]
    L1Cache -- "MISS" --> L2Cache{"Tầng 2: L2 Distributed Cache<br/>(Redis Cluster)<br/>Độ trễ: 1 - 2ms"}
    L2Cache -- "HIT" --> SyncL1["Nạp dữ liệu vào L1 Cache & Trả về kết quả"]
    L2Cache -- "MISS (Nguy cơ Cache Stampede!)" --> RedissonLock["Giành Khóa Phân Tán: redissonClient.getLock('prod:lock')"]
    
    RedissonLock -- "Thành công (1 Thread duy nhất)" --> QueryDB["Truy vấn PostgreSQL Database"]
    QueryDB --> PopulateCaches["Nạp dữ liệu vào cả Redis L2 và Caffeine L1"]
    PopulateCaches --> ReleaseLock["Giải phóng Redisson Lock"]
    RedissonLock -- "Thất bại (Các thread khác)" --> WaitAndRetry["Chờ 50ms & Đọc lại từ L2 Cache"]

    style L1Cache fill:#064e3b,stroke:#10b981,color:#fff
    style L2Cache fill:#1e3a8a,stroke:#3b82f6,color:#fff
    style RedissonLock fill:#4c1d95,stroke:#8b5cf6,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: So Sánh Các Giải Pháp Khóa Phân Tán (Distributed Lock)

| Tiêu chuẩn | Redisson RLock (Redis) | Database Pessimistic Lock | Zookeeper Lock |
|---|---|---|---|
| **Cơ chế Watchdog** | **Tự động gia hạn lock (Lock Watchdog)** nếu thread còn chạy | Transaction timeout của DB connection | Ephemeral node tự xóa khi mất heartbeat |
| **Độ trễ (Latency)** | **Cực thấp (1 - 3ms)** trên RAM | Cao (10 - 50ms) do I/O đĩa DB | Trung bình (5 - 10ms) qua giao thức Paxos/Zab |
| **Tác động hạ tầng** | Không làm nghẽn DB chính của hệ thống | Chiếm dụng connection pool HikariCP | Cần vận hành cụm Zookeeper riêng |
| **Khuyến nghị sử dụng** | **Tiêu chuẩn số 1 cho Microservices chịu tải cao** | Đơn giản, dùng khi chưa có Redis | Dùng trong hạ tầng Hadoop / Kafka cluster |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Hiện tượng Cache Stampede**: Khi key hot hết hạn, hàng nghìn thread đồng thời query DB gây sập hệ thống. Khắc phục: Dùng Redisson Lock để chỉ 1 thread tải dữ liệu hoặc thuật toán Probabilistic Early Expiration (XFetch).
2. **Cơ chế Watchdog của Redisson**: Không bao giờ set \`leaseTime\` cứng ngắc; hãy để Watchdog tự động gia hạn lock mỗi 10 giây cho đến khi task hoàn thành.
3. **Hai tầng Cache đồng bộ**: Khi có sự kiện cập nhật dữ liệu, dùng Redis Pub/Sub để phát tán lệnh xóa L1 Cache trên toàn bộ các pod khác.`
};

// Topic 2: 6-2-1 to 6-2-4 (Consolidates 6-2 and 6-10)
const t2_l1 = {
  id: "6-2-1",
  type: "theory",
  title: "Bài 6.2.1: Bản chất Thảm họa Dual-Write & Kiến trúc Transactional Outbox với Apache Kafka",
  minutes: 8,
  content: getL("6-2-1").content + "\n\n" + getL("6-2-2").content + "\n\n" + getL("6-2-3").content + "\n\n" + getL("6-2-4").content
};

const t2_l2 = {
  id: "6-2-2",
  type: "practice",
  title: "Bài 6.2.2: Triển khai Outbox Poller & Idempotent Consumer với Database Unique Constraint",
  minutes: 8,
  content: getL("6-2-5").content
};

const t2_l3 = {
  id: "6-2-3",
  type: "pitfall",
  title: "Bài 6.2.3: Cạm bẫy Kafka Consumer Rebalance Bão Táp, Poison Pill Message & Dead Letter Queue (DLQ)",
  minutes: 7,
  content: getL("6-2-6").content + "\n\n" + getL("6-2-7").content
};

const t2_l4 = {
  id: "6-2-4",
  type: "synthesis",
  title: "Bài 6.2.4: Milestone Synthesis: Bản đồ Transactional Outbox & Ma trận Đảm Bảo Ngữ Nghĩa Messaging",
  minutes: 8,
  content: `## Milestone Synthesis: Transactional Outbox & Triệt Tiêu Thảm Họa Dual-Write

### 1. Sơ Đồ Kiến Trúc: Transactional Outbox Pattern Với Debezium CDC / Poller

\`\`\`mermaid
flowchart LR
    subgraph ServiceTx ["Nguyên Tử Cục Bộ (Atomic Local Transaction)"]
        BizLogic["Tạo Đơn Hàng<br/>(Order Logic)"] --> DB_Order["Bảng 'orders'<br/>(status: PENDING)"]
        BizLogic --> DB_Outbox["Bảng 'outbox_events'<br/>(OrderCreatedEvent JSON)"]
    end

    DB_Outbox --> OutboxRelay["Outbox Relay Engine<br/>(Debezium CDC đọc WAL / Scheduled Poller)"]
    OutboxRelay --> KafkaCluster["Apache Kafka Cluster<br/>(Topic: order.events)"]
    KafkaCluster --> Consumer["Idempotent Consumer<br/>(Kiểm tra bảng 'processed_events' trước khi xử lý)"]

    style ServiceTx fill:#1e293b,stroke:#3b82f6,color:#fff
    style KafkaCluster fill:#4c1d95,stroke:#8b5cf6,color:#fff
    style Consumer fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Đảm Bảo Ngữ Nghĩa Phân Phát Tin Nhắn (Delivery Semantics)

| Ngữ nghĩa | At-Most-Once (Tối đa 1 lần) | At-Least-Once (Ít nhất 1 lần) | Exactly-Once Processing (Đúng 1 lần) |
|---|---|---|---|
| **Cơ chế hoạt động** | Commit offset trước khi xử lý | Xử lý xong mới commit offset | At-Least-Once + Idempotent Consumer |
| **Nguy cơ mất dữ liệu** | **Rất cao** (Mất message nếu app sập giữa chừng) | Không bao giờ mất dữ liệu | **Không mất, không trùng** |
| **Nguy cơ trùng lặp** | Không bị trùng | Có thể bị xử lý trùng lặp khi rebalance | Miễn nhiễm trùng lặp nhờ Idempotent Key |
| **Khuyến nghị sử dụng** | Log metrics, tracking click chuột không quan trọng | Thông báo notification | **BẮT BUỘC cho thanh toán, trừ tiền, tài chính** |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Thảm họa Dual-Write**: Không bao giờ gọi \`kafkaTemplate.send()\` bên trong \`@Transactional\` cùng DB. Nếu DB commit fail hoặc Kafka disconnect, hệ thống rơi vào trạng thái bất nhất vĩnh viễn.
2. **Transactional Outbox là giải pháp duy nhất**: Lưu event vào bảng outbox trong cùng local DB transaction với dữ liệu nghiệp vụ, bảo đảm tính nguyên tố 100%.
3. **Idempotent Consumer bắt buộc**: Vì Kafka đảm bảo At-Least-Once, Consumer luôn có thể nhận lại message cũ. Luôn dùng bảng \`processed_messages\` (với khóa chính là \`event_id\`) để chặn duplicate.`
};

// Topic 3: 6-3-1 to 6-3-4 (Consolidates 6-5 and 6-12)
const t3_l1 = {
  id: "6-3-1",
  type: "theory",
  title: "Bài 6.3.1: Bản chất Saga Pattern: Chuỗi Giao Dịch Bù Trừ & So Sánh Choreography vs Orchestration",
  minutes: 8,
  content: getL("6-5-1").content + "\n\n" + getL("6-5-2").content + "\n\n" + getL("6-5-3").content
};

const t3_l2 = {
  id: "6-3-2",
  type: "practice",
  title: "Bài 6.3.2: Triển khai Saga Orchestrator cho Chuỗi Đặt Hàng Order -> Payment -> Inventory",
  minutes: 8,
  content: getL("6-5-4").content
};

const t3_l3 = {
  id: "6-3-3",
  type: "pitfall",
  title: "Bài 6.3.3: Cạm bẫy Thiếu Tính Cô Lập (Lack of Isolation) Trong Saga & Bù Trừ Thất Bại Giữa Chừng",
  minutes: 7,
  content: getL("6-5-5").content + "\n\n" + getL("6-5-6").content
};

const t3_l4 = {
  id: "6-3-4",
  type: "synthesis",
  title: "Bài 6.3.4: Milestone Synthesis: Bản đồ Điều Phối Saga & Ma trận Lựa Chọn Mô Hình Giao Dịch Phân Tán",
  minutes: 8,
  content: `## Milestone Synthesis: Saga Pattern & Giao Dịch Phân Tán Doanh Nghiệp

### 1. Sơ Đồ Kiến Trúc: Saga Orchestrator & Chuỗi Giao Dịch Bù Trừ (Compensating Transactions)

\`\`\`mermaid
sequenceDiagram
    autonumber
    participant Orch as Order Saga Orchestrator
    participant OrderSvc as Order Service
    participant PaySvc as Payment Service
    participant StockSvc as Inventory Service

    Orch->>OrderSvc: 1. Tạo đơn hàng (T1: CreateOrder - PENDING)
    OrderSvc-->>Orch: OrderCreated OK
    
    Orch->>PaySvc: 2. Trừ tiền tài khoản (T2: DeductPayment)
    PaySvc-->>Orch: PaymentDeducted OK
    
    Orch->>StockSvc: 3. Khóa tồn kho hàng hóa (T3: ReserveStock)
    Note over StockSvc: Hết hàng trong kho! Ném OutOfStockException!
    StockSvc-->>Orch: ReserveStock FAILED!
    
    Note over Orch: KÍCH HOẠT CHUỖI GIAO DỊCH BÙ TRỪ THEO CHIỀU NGƯỢC LẠI!
    Orch->>PaySvc: 4. Bù trừ: Hoàn lại tiền (C2: RefundPayment)
    PaySvc-->>Orch: Refund OK
    
    Orch->>OrderSvc: 5. Bù trừ: Hủy đơn hàng (C1: CancelOrder - CANCELLED)
    OrderSvc-->>Orch: Order Cancelled OK
    Note over Orch: Toàn hệ thống trở về trạng thái Nhất Quán Cuối Cùng (Eventual Consistency)!
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: So Sánh Saga Orchestration vs Choreography

| Tiêu chuẩn | Saga Orchestration (Có nhạc trưởng điều phối) | Saga Choreography (Tự phản hồi sự kiện) |
|---|---|---|
| **Cơ chế giao tiếp** | 1 Orchestrator điều khiển trung tâm gửi Command | Các service tự publish & listen Events qua Kafka |
| **Khả năng quan sát (Observability)** | **Rất cao**: Nhìn vào Orchestrator là biết luồng đang ở đâu | Thấp: Luồng phân tán, khó theo dõi khi có 10+ services |
| **Phụ thuộc lỏng (Loose Coupling)** | Trung bình (Orchestrator cần biết các service con) | **Cực cao**: Các service không biết ai nghe event của mình |
| **Xử lý giao dịch phức tạp** | **Tối ưu tuyệt đối**: Dễ viết logic retry, timeout, fallback | Rất khó debug khi có vòng lặp sự kiện (Cyclic events) |
| **Khuyến nghị sử dụng** | **Khuyến nghị số 1 cho quy trình thanh toán, checkout** | Dùng cho các luồng đơn giản 2 - 3 bước |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Thiếu tính cô lập (Lack of Isolation)**: Trong lúc Saga đang chạy, dữ liệu trung gian có thể bị nhìn thấy (Dirty Read). Phải dùng Semantic Lock (đặt trạng thái \`PENDING_PAYMENT\`) để ngăn can thiệp trái phép.
2. **Giao dịch bù trừ phải Idempotent**: Lệnh bù trừ (\`RefundPayment\`) có thể bị retry nhiều lần nếu mạng chập chờn; do đó nó bắt buộc phải an toàn khi gọi lặp lại.`
};

// Topic 4: 6-4-1 to 6-4-4 (Consolidates 6-3 and 6-4)
const t4_l1 = {
  id: "6-4-1",
  type: "theory",
  title: "Bài 6.4.1: Kiến trúc Tự Phục Hồi: Circuit Breaker State Machine & Cỗ Máy Spring Cloud Gateway",
  minutes: 8,
  content: getL("6-3-1").content + "\n\n" + getL("6-3-2").content + "\n\n" + getL("6-4-1").content + "\n\n" + getL("6-4-2").content
};

const t4_l2 = {
  id: "6-4-2",
  type: "practice",
  title: "Bài 6.4.2: Cấu hình Resilience4j Circuit Breaker Kết Hợp Gateway Rate Limiting Redis",
  minutes: 8,
  content: getL("6-3-4").content + "\n\n" + getL("6-4-4").content
};

const t4_l3 = {
  id: "6-4-3",
  type: "pitfall",
  title: "Bài 6.4.3: Cạm bẫy Thứ Tự Bọc AOP Sai (Retry bọc ngoài CircuitBreaker) & Gateway Chậm I/O",
  minutes: 7,
  content: getL("6-3-6").content + "\n\n" + getL("6-4-6").content
};

const t4_l4 = {
  id: "6-4-4",
  type: "synthesis",
  title: "Bài 6.4.4: Milestone Synthesis: Bản đồ Tự Phục Hồi Hệ Thống & Ma trận Xử Lý Sự Cố Phân Tán",
  minutes: 8,
  content: `## Milestone Synthesis: Tự Phục Hồi Resilience4j & Cổng API Gateway

### 1. Sơ Đồ Kiến Trúc: Máy Trạng Thái Của Resilience4j Circuit Breaker

\`\`\`mermaid
stateDiagram-v2
    [*] --> Closed: Bình thường (Mọi request đi qua bình thường)
    Closed --> Open: Tỷ lệ lỗi $\ge$ 50% trong Sliding Window (Ví dụ: 5/10 requests fail)
    
    note right of Open
        TRẠNG THÁI MỞ (CIRCUIT OPEN):
        • Ngắt kết nối ngay lập tức!
        • Ném CallNotPermittedException hoặc gọi Fallback trong 0ms!
        • Bảo vệ service đích không bị đè bẹp khi đang ngấp ngoải!
    end note
    
    Open --> HalfOpen: Hết thời gian chờ waitDurationInOpenState (Ví dụ: 10 giây)
    HalfOpen --> Closed: Cho phép một lượng thử nghiệm (ví dụ 5 requests) thành công 100%
    HalfOpen --> Open: Chỉ cần có lỗi xảy ra trong các request thử nghiệm
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Thứ Tự Bọc AOP Cốt Tử Của Resilience4j

| Thứ tự bọc AOP | Cấu hình khuyên dùng | Hậu quả nếu bọc ngược |
|---|---|---|
| **1. Retry** | Bọc ngoài cùng | Nếu Retry bọc bên trong Circuit Breaker, mỗi lần fail nó sẽ âm thầm retry làm tăng tỷ lệ lỗi ảo khiến Circuit Breaker nhảy sang OPEN oan uổng |
| **2. CircuitBreaker** | Đứng ở giữa | Đếm chính xác số lần gọi thực sự đi ra mạng |
| **3. RateLimiter** | Đứng tiếp theo | Ngăn chặn quá tải trước khi mở kết nối mạng |
| **4. Bulkhead** | Bọc trong cùng | Giới hạn số concurrent calls cô lập luồng |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Fail Fast**: Thay vì để người dùng chờ 30 giây timeout khi một microservice bị sập, Circuit Breaker trả về Fallback ngay sau 1 mili-giây.
2. **Spring Cloud Gateway Non-Blocking**: Viết trên nền Netty Reactive. Tuyệt đối không gọi blocking I/O (JDBC truyền thống) bên trong Gateway filter vì sẽ khóa chặt event loop threads.`
};

// Topic 5: 6-5-1 to 6-5-4 (Consolidates 6-6, 6-7, 6-9, 6-11)
const t5_l1 = {
  id: "6-5-1",
  type: "theory",
  title: "Bài 6.5.1: Kiến trúc Chunk-Oriented Processing (Spring Batch) & Triết lý Spring Modulith",
  minutes: 8,
  content: getL("6-9-1").content + "\n\n" + getL("6-9-2").content + "\n\n" + getL("6-11-1").content
};

const t5_l2 = {
  id: "6-5-2",
  type: "practice",
  title: "Bài 6.5.2: Triển khai Spring Batch Job Xử Lý 1 Triệu Giao Dịch & Kiểm Soát Ranh Giới Modulith",
  minutes: 8,
  content: getL("6-9-3").content + "\n\n" + getL("6-11-2").content
};

const t5_l3 = {
  id: "6-5-3",
  type: "pitfall",
  title: "Bài 6.5.3: Cạm bẫy Tràn Heap Memory Trong ItemReader & Rò Rỉ Tenant Context Đa Khách Hàng",
  minutes: 7,
  content: getL("6-9-5").content + "\n\n" + getL("6-7-6").content
};

const t5_l4 = {
  id: "6-5-4",
  type: "synthesis",
  title: "Bài 6.5.4: Milestone Synthesis: Bản đồ Xử Lý Dữ Liệu Lớn & Ma trận Kiến trúc Monolith vs Modulith vs Microservices",
  minutes: 8,
  content: `## Milestone Synthesis: Spring Batch Xử Lý Khối Lượng Lớn & Kiến Trúc Spring Modulith

### 1. Sơ Đồ Kiến Trúc: Chunk-Oriented Processing Trong Spring Batch

\`\`\`mermaid
flowchart LR
    subgraph ChunkLoop ["Vòng Lặp Chunk (Chunk Size = 1000)"]
        Reader["ItemReader<br/>Đọc từng bản ghi qua Cursor / Paging"] --> Processor["ItemProcessor<br/>Biến đổi dữ liệu, kiểm tra hợp lệ"]
        Processor --> ListBuffer["Gom đủ 1000 items vào Buffer"]
        ListBuffer --> Writer["ItemWriter<br/>Thực thi Batch Insert / Update trong đúng 1 Transaction duy nhất!"]
    end
    
    JobRepository["JobRepository (Lưu State, StepExecution vào DB)"] <--> ChunkLoop

    style ChunkLoop fill:#1e293b,stroke:#3b82f6,color:#fff
    style Writer fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: So Sánh Các Kiểu Kiến Trúc Hệ Thống

| Tiêu chuẩn | Monolith Truyền Thống | Spring Modulith (Modular Monolith) | Microservices Phân Tán |
|---|---|---|---|
| **Độ phức tạp vận hành** | Rất thấp (1 file JAR deploy duy nhất) | **Thấp (1 file JAR duy nhất)** | Rất cao (K8s, Kafka, Service Mesh) |
| **Tính cô lập ranh giới** | Kém, code dễ bị spaghetti | **Rất cao (Cưỡng chế qua ArchUnit & Modulith rules)** | Rất cao (Mỗi service là 1 repo riêng) |
| **Giao tiếp liên module** | In-process direct call | In-process Event / Async decoupled | Mạng HTTP / gRPC / Kafka |
| **Khuyến nghị theo CES-2026** | Phù hợp giai đoạn MVP đầu tiên | **TIÊU CHUẨN VÀNG cho 80% doanh nghiệp vừa & lớn** | Chỉ áp dụng khi hệ thống có hàng trăm kỹ sư |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Kiến trúc Chunk Processing**: Không bao giờ đọc 1 triệu bản ghi vào một \`List\` trong RAM; Spring Batch đọc streaming từng dòng và ghi theo từng chunk 1000 items để giữ RAM ổn định dưới 200MB.
2. **Spring Modulith là bước đệm hoàn hảo**: Giúp doanh nghiệp duy trì tốc độ phát triển nhanh của Monolith nhưng sở hữu ranh giới module sạch sẽ, sẵn sàng tách ra Microservices khi cần.`
};

const additionalM6Questions = [
  {
    level: "hard",
    scenario: "Trong kiến trúc Transactional Outbox kết hợp Apache Kafka, cơ chế nào giúp Debezium bắt được các sự kiện outbox mới phát sinh mà không cần liên tục thực thi câu lệnh SQL Polling 'SELECT * FROM outbox' làm tăng tải CPU của Database?",
    q: "Cơ chế kỹ thuật tầng thấp của Debezium CDC là gì?",
    options: [
      "Debezium kết nối vào PostgreSQL Logical Decoding để đọc trực tiếp Write-Ahead Log (WAL) của cơ sở dữ liệu với độ trễ dưới 5ms mà không gây tải truy vấn SQL",
      "Debezium dùng trigger lưu dữ liệu vào Redis Cache",
      "Debezium yêu cầu Spring Boot gửi HTTP request sang cho nó",
      "Debezium quét file log ứng dụng của Spring Boot"
    ],
    answer: 0,
    explain: "Change Data Capture (CDC) của Debezium hoạt động dựa trên Transaction Log (WAL trên Postgres, Binlog trên MySQL). Nó đọc luồng ghi nhị phân của database engine, bảo đảm hiệu năng tối đa và không bỏ sót bất kỳ thay đổi nào.",
    why: [
      "✓ Đúng — Debezium CDC qua WAL là giải pháp Outbox Relay chuẩn mực hàng đầu hiện nay.",
      "Trigger DB gây chậm transaction nghiệp vụ và không kết nối trực tiếp đến Kafka.",
      "Outbox pattern sinh ra để tránh việc Spring Boot phải gọi mạng sang tiến trình khác.",
      "Log ứng dụng không đảm bảo tính nhất quán giao dịch của cơ sở dữ liệu."
    ]
  },
  {
    level: "hard",
    scenario: "Khi triển khai Saga Pattern phân tán cho quy trình đặt hàng, trong thời gian bước Payment đang xử lý, người dùng lại gửi request PATCH /orders/{id} để đổi địa chỉ giao hàng.",
    q: "Nguyên lý thiết kế nào bắt buộc phải áp dụng để ngăn chặn việc sửa đổi dữ liệu khi giao dịch phân tán chưa hoàn tất?",
    options: [
      "Áp dụng Semantic Lock: Đặt trạng thái đơn hàng là 'PENDING_PAYMENT' và từ chối mọi yêu cầu chỉnh sửa hoặc hủy cho đến khi toàn bộ chuỗi Saga kết thúc",
      "Khóa toàn bộ cơ sở dữ liệu của công ty",
      "Hủy ngay lập tức yêu cầu thanh toán",
      "Cho phép sửa đổi tự do vì Saga tự động đồng bộ sau"
    ],
    answer: 0,
    explain: "Saga Pattern không có tính cô lập (Lack of Isolation). Để tránh tình trạng Lost Update hoặc Dirty Read, kiến trúc sư phải dùng Semantic Lock (khóa ngữ nghĩa qua cờ trạng thái) để phong tỏa đơn hàng trong suốt thời gian chuỗi Saga đang chạy.",
    why: [
      "✓ Đúng — Semantic Lock là kỹ thuật thiết kế sống còn trong các hệ thống phân tán không dùng 2PC.",
      "Khóa toàn bộ DB sẽ làm tê liệt cả hệ thống.",
      "Hủy thanh toán vô cớ sẽ phá hỏng trải nghiệm mua sắm của khách hàng.",
      "Cho phép sửa đổi tự do sẽ dẫn đến dữ liệu mâu thuẫn không thể rollback."
    ]
  }
];

const inlineQuiz = oldM6.lessons.find(l => l.type === 'quiz');
const updatedQuizQuestions = inlineQuiz.questions.concat(additionalM6Questions);

const newLessons = [
  t1_l1, t1_l2, t1_l3, t1_l4,
  t2_l1, t2_l2, t2_l3, t2_l4,
  t3_l1, t3_l2, t3_l3, t3_l4,
  t4_l1, t4_l2, t4_l3, t4_l4,
  t5_l1, t5_l2, t5_l3, t5_l4,
  {
    id: "6-quiz",
    type: "quiz",
    title: "Quiz Module 6 — Sát Hạch Toàn Diện Kiến Trúc Microservices & Messaging",
    questions: updatedQuizQuestions
  }
];

const newM6 = {
  id: 6,
  title: "Microservices & Messaging",
  subtitle: "Kafka, Transactional Outbox, Saga Pattern, Redis Lock & Spring Batch",
  icon: "⚡",
  desc: "Thiết kế hệ thống phân tán chịu tải cao: Event-driven Kafka, Transactional Outbox, Saga Pattern, Redis Caching và Spring Modulith.",
  topics: topics,
  outcomes: outcomes,
  retrievalWarmup: retrievalWarmup,
  lessons: newLessons
};

const outputContent = `/* MODULE 6 — Microservices & Messaging (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(${JSON.stringify(newM6, null, 2)});\n`;

fs.writeFileSync(m6Path, outputContent, 'utf8');
console.log('Successfully curated module6.js!');
console.log('Total content lessons:', newLessons.filter(l => l.type !== 'quiz').length);
console.log('Total quiz questions:', inlineQuiz.questions.length);
