const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'course', 'js', 'content', 'module6.js');
const content = fs.readFileSync(filePath, 'utf8');
const mod = new Function(`let window = { COURSE_MODULES: [] }; ${content}; return window.COURSE_MODULES[0];`)();

// 1. Lesson 6-1-3: Mermaid + Table
const l613 = mod.lessons.find(x => x.id === '6-1-3');
if (l613) {
  const mermaid613 = `
### Sơ Đồ Sự Cố: Khóa RLock Bị Quá Hạn Giữa Chừng vs Cơ Chế Redisson Watchdog

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor ClientA as 🧵 Thread A (Node 1)
    actor ClientB as 🧵 Thread B (Node 2)
    participant Redis as ⚡ Redis Cluster (Distributed Lock)
    participant WD as 🐕 Redisson Watchdog (Background Thread)
    participant DB as 🗄️ PostgreSQL (Inventory)

    Note over ClientA,Redis: SỰ CỐ: THIẾT LẬP LEASE TIME CỐ ĐỊNH 5s
    ClientA->>Redis: SET order_lock_102 (LeaseTime = 5s)
    Note over ClientA,DB: Tác vụ gọi cổng thanh toán bị treo mạng 6s!
    Note over Redis: Sau 5s: Redis tự xóa key vì hết hạn!
    ClientB->>Redis: SET order_lock_102 -> Thành công!
    Note over ClientA,ClientB: CẢ 2 THREAD CÙNG TRỪ TỒN KHO -> BÁN ÂM HÀNG!

    Note over ClientA,WD: GIẢI PHÁP: REDISSON WATCHDOG (KHÔNG SET LEASE TIME)
    ClientA->>Redis: lock.lock() (Mặc định LockWatchdogTimeout = 30s)
    WD->>Redis: Mỗi 10s: Tự động gia hạn (Renew TTL) thêm 30s
    ClientA->>DB: Xử lý xong nghiệp vụ
    ClientA->>Redis: lock.unlock() -> Giải phóng khóa an toàn!
\`\`\`

### Bảng Ma Trận Sự Cố Khóa Phân Tán & Kỹ Thuật Khắc Phục:

| Sự cố phân tán | Triệu chứng kỹ thuật | Nguyên nhân cốt lõi | Giải pháp chuẩn Senior |
|---|---|---|---|
| **Lock Expiration Premature** | 2 server cùng xử lý 1 đơn hàng, tồn kho bị âm | Set leaseTime quá ngắn, tác vụ chạy lâu hơn TTL | Để Redisson Watchdog tự gia hạn khóa hoặc dùng RedLock |
| **Serialization Java Native** | Lỗ hổng bảo mật Remote Code Execution (RCE) | Dùng \`JdkSerializationRedisSerializer\` mặc định | Chuyển sang \`Jackson2JsonRedisSerializer\` hoặc Fastjson2 |
| **Deadlock Do Node Crash** | Khóa bị kẹt vĩnh viễn, đơn hàng bị đóng băng | Giữ khóa nhưng server bị kill mà không set TTL | Redisson tự động gán TTL cho mọi khóa ngay cả khi crash |
`;
  if (!l613.content.includes('```mermaid')) {
    l613.content = mermaid613 + '\n\n' + l613.content;
  }
}

// 2. Lesson 6-1-4: Table
const l614 = mod.lessons.find(x => x.id === '6-1-4');
if (l614 && (!l614.content.includes('|') || !l614.content.includes('---'))) {
  const table614 = `
### Ma Trận Quyết Định Công Nghệ: Caching Phân Tán & Đồng Bộ Dữ Liệu:

| Chiến lược Caching | Mô tả cơ chế | Ưu điểm nổi bật | Rủi ro cần phòng tránh |
|---|---|---|---|
| **Cache-Aside (Lazy Load)** | Ứng dụng đọc Cache trước; nếu miss thì đọc DB rồi ghi vào Cache | Giảm tải đọc dữ liệu 95% | Dữ liệu bị cũ (Stale Data) nếu không xóa cache khi Update |
| **Write-Through** | Ghi đồng thời vào Cache và Database trong cùng Transaction | Dữ liệu luôn nhất quán | Tăng độ trễ ghi dữ liệu (Write Latency) |
| **Two-Level Caching** | L1 In-Memory (Caffeine) + L2 Distributed (Redis) | Tốc độ siêu tốc < 0.1ms cho Hot Key | Phải bắn pub/sub để xóa L1 Cache trên các node khác |
| **Distributed Lock (RLock)** | Dùng Redis phân quyền độc quyền xử lý qua thuật toán RedLock | Triệt tiêu 100% Race Condition liên node | Chú ý CPU Redis và cấu hình gia hạn Watchdog |
`;
  l614.content += '\n\n' + table614;
}

// 3. Lesson 6-2-3: Mermaid + Table
const l623 = mod.lessons.find(x => x.id === '6-2-3');
if (l623) {
  const mermaid623 = `
### Sơ Đồ Cảnh Báo: Bão Rebalance Consumer & Cơ Chế Dead Letter Queue (DLQ)

\`\`\`mermaid
flowchart TD
    Kafka["📨 Kafka Topic: order-created (Partition 0,1,2)"]
    
    subgraph CONSUMER_GROUP ["Consumer Group: inventory-workers"]
        C1["🤖 Consumer 1 (Xử lý 100 msg/s)"]
        C2["💥 Consumer 2 (Gặp Poison Pill Message)"]
        C3["🤖 Consumer 3 (Bình thường)"]
    end
    
    DLQ["💀 Dead Letter Queue Topic: order-created.DLT"]
    Alert["🚨 PagerDuty Alert (Kỹ sư trực chiến)"]

    Kafka --> C1
    Kafka --> C2
    Kafka --> C3

    C2 -->|Ném DeserializationException liên tục| C2
    C2 -->|Quá max.poll.interval.ms: Coi như đã chết!| Rebalance["🌪️ REBALANCE STORM: Toàn bộ group dừng đọc!"]
    
    subgraph FIXED_FLOW ["GIẢI PHÁP: ERROR HANDLING DESERIALIZER & DLT"]
        C2 -->|Bắt lỗi Poison Pill| DLTHandler["⚙️ CommonErrorHandler + DeadLetterPublishingRecoverer"]
        DLTHandler -->|Bắn message lỗi sang| DLQ
        DLTHandler -->|Commit offset tiếp tục đọc message sau| Kafka
        DLQ --> Alert
    end

    style Rebalance fill:#7f1d1d,stroke:#ef4444,color:#fff
    style FIXED_FLOW fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

### Bảng Ma Trận Sự Cố Kafka Consumer & Chiến Lược Cứu Hộ:

| Sự cố Kafka | Triệu chứng kỹ thuật | Nguyên nhân gốc rễ | Giải pháp chuẩn Senior |
|---|---|---|---|
| **Poison Pill Message** | Consumer bị crash lặp vô tận tại đúng 1 offset, nghẽn luồng | Message sai cấu trúc JSON, không thể deserialize | Dùng \`ErrorHandlingDeserializer\` và chuyển sang DLT |
| **Rebalance Storm** | Hệ thống ngừng xử lý hàng phút, lag message vọt lên cao | Xử lý 1 batch quá thời gian \`max.poll.interval.ms\` | Giảm \`max.poll.records\` (500 -> 50) hoặc xử lý async |
| **Mất Dữ Liệu Offset** | Message chưa xử lý xong đã bị đánh dấu đã đọc | Cấu hình \`enable.auto.commit = true\` mặc định | Tắt auto-commit, commit offset thủ công sau khi lưu DB thành công |
`;
  if (!l623.content.includes('```mermaid')) {
    l623.content = mermaid623 + '\n\n' + l623.content;
  }
}

// 4. Lesson 6-3-2: Mermaid
const l632 = mod.lessons.find(x => x.id === '6-3-2');
if (l632 && !l632.content.includes('```mermaid')) {
  const mermaid632 = `
### Sơ Đồ Máy Trạng Thái: Saga Orchestrator Điều Phối Chuỗi Đặt Hàng E-Commerce

\`\`\`mermaid
stateDiagram-v2
    [*] --> OrderInitiated: 1. Khởi tạo đơn hàng (PENDING)
    OrderInitiated --> PaymentPending: 2. Gửi lệnh trừ tiền ví
    
    state PaymentDecision <<choice>>
    PaymentPending --> PaymentDecision: Nhận kết quả thanh toán
    
    PaymentDecision --> InventoryPending: Thành công -> Gửi lệnh trừ kho
    PaymentDecision --> OrderFailed: Thất bại -> HỦY ĐƠN HÀNG
    
    state InventoryDecision <<choice>>
    InventoryPending --> InventoryDecision: Nhận kết quả giữ kho
    
    InventoryDecision --> OrderCompleted: Thành công -> ĐƠN HÀNG HOÀN TẤT
    InventoryDecision --> CompensatingPayment: Hết kho! KÍCH HOẠT BÙ TRỪ!
    
    CompensatingPayment --> OrderCancelled: 3. Hoàn tiền lại cho khách & Đóng đơn
    OrderCancelled --> [*]
    OrderCompleted --> [*]
    OrderFailed --> [*]
\`\`\`
`;
  l632.content = mermaid632 + '\n\n' + l632.content;
}

// 5. Lesson 6-3-3: Mermaid + Table
const l633 = mod.lessons.find(x => x.id === '6-3-3');
if (l633) {
  const mermaid633 = `
### Sơ Đồ Cảnh Báo: Sự Cố Thiếu Tính Cô Lập (Dirty Read) Trong Saga Phân Tán

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Saga as ⚙️ Saga Đặt Hàng (Đơn 101)
    actor UserB as 👤 Khách Hàng B
    participant DB as 🗄️ PostgreSQL Kho Hàng
    participant Pay as 💳 Cổng Thanh Toán

    Saga->>DB: 1. Trừ tồn kho: iPhone 15 Pro (Còn 0 chiếc)
    UserB->>DB: 2. Xem sản phẩm -> "HẾT HÀNG", bỏ đi không mua!
    Saga->>Pay: 3. Trừ tiền thẻ tín dụng khách A
    Pay-->>Saga: 4. Thẻ hết hạn! Thanh toán THẤT BẠI!
    Saga->>DB: 5. Giao dịch bù trừ: Cộng lại tồn kho (+1 chiếc)
    Note over DB,UserB: BÁN HỤT: Khách B muốn mua nhưng bị từ chối oan do Dirty Read!
\`\`\`

### Bảng Ma Trận Các Hiểm Họa Mất Tính Cô Lập (ACID vs BASE) & Giải Pháp:

| Hiện tượng bất thường | Mô tả tình huống | Giải pháp kỹ thuật chuẩn Senior |
|---|---|---|
| **Dirty Read (Đọc bẩn)** | Giao dịch 2 đọc dữ liệu tạm thời của giao dịch 1 trước khi bị Rollback | Sử dụng Trạng thái Ngữ nghĩa (\`PENDING_PAYMENT\`, \`RESERVED\`) |
| **Lost Update (Mất cập nhật)** | Saga 1 ghi đè lên dữ liệu mà Saga 2 đang sửa mà không chờ | Áp dụng Pessimistic Lock hoặc Optimistic Locking \`@Version\` |
| **Non-repeatable Read** | Đọc dữ liệu 2 lần trong cùng Saga ra 2 kết quả khác nhau do Saga khác chen ngang | Kỹ thuật Re-reading & Version Checking trước khi commit |
`;
  if (!l633.content.includes('```mermaid')) {
    l633.content = mermaid633 + '\n\n' + l633.content;
  }
}

// 6. Lesson 6-4-2: Mermaid + Table
const l642 = mod.lessons.find(x => x.id === '6-4-2');
if (l642) {
  const mermaid642 = `
### Sơ Đồ Máy Trạng Thái: Vòng Đời Circuit Breaker (Resilience4j) & Gateway Rate Limiting

\`\`\`mermaid
stateDiagram-v2
    [*] --> CLOSED: Trạng thái bình thường (100% Request được thông qua)
    
    CLOSED --> OPEN: Tỷ lệ lỗi > 50% trong 10s (Trip Circuit Breaker)
    note right of OPEN
        Ngắt cầu dao hoàn toàn!
        100% Request bị từ chối ngay lập tức
        Gọi Fallback Method, bảo vệ Microservice con!
    end note
    
    OPEN --> HALF_OPEN: Sau khoảng thời gian chờ (waitDurationInOpenState = 5s)
    note right of HALF_OPEN
        Thử nghiệm: Cho phép 10 Request đi qua
    end note
    
    HALF_OPEN --> CLOSED: Nếu tỷ lệ thành công >= 80% (Khôi phục bình thường)
    HALF_OPEN --> OPEN: Nếu vẫn lỗi > 50% (Tiếp tục mở cầu dao)
\`\`\`

### Bảng Phân Tích Cấu Hình Resilience4j & Redis Rate Limiter:

| Tham số cấu hình | Giá trị chuẩn Production | Ý nghĩa kỹ thuật | Tác động bảo vệ hệ thống |
|---|---|---|---|
| \`slidingWindowSize\` | \`100\` | Số lượng cuộc gọi tối thiểu để tính tỷ lệ lỗi | Tránh mở cầu dao nhầm khi chỉ có 1-2 request đầu bị lỗi |
| \`failureRateThreshold\` | \`50.0\` | Ngưỡng phần trăm lỗi khiến cầu dao ngắt | Khi 50% request bị lỗi/timeout -> ngắt cầu dao ngay |
| \`waitDurationInOpenState\` | \`10000ms\` | Thời gian giữ cầu dao mở trước khi chuyển Half-Open | Cho server đích 10 giây để khởi động lại hoặc phục hồi |
| \`redis-rate-limiter.replenishRate\` | \`20\` | Số lượng token nạp vào thùng mỗi giây | Giới hạn tốc độ trung bình cho mỗi người dùng (20 req/s) |
| \`redis-rate-limiter.burstCapacity\` | \`40\` | Dung lượng tối đa của thùng token (Bucket Capacity) | Cho phép bùng nổ truy cập ngắn hạn tối đa 40 req trong 1 giây |
`;
  if (!l642.content.includes('```mermaid')) {
    l642.content = mermaid642 + '\n\n' + l642.content;
  }
}

// 7. Lesson 6-4-3: Table
const l643 = mod.lessons.find(x => x.id === '6-4-3');
if (l643 && (!l643.content.includes('|') || !l643.content.includes('---'))) {
  const table643 = `
### Ma Trận Thứ Tự Bọc AOP: Retry vs CircuitBreaker:

| Cách sắp xếp AOP | Cơ chế hoạt động ngầm | Hậu quả thực tế | Đánh giá kiến trúc |
|---|---|---|---|
| **Retry bọc ngoài CircuitBreaker** | Mỗi lần Retry thất bại được tính là 1 lần lỗi riêng biệt | 1 Request thất bại bị retry 3 lần làm cầu dao ngắt sớm gấp 3 lần! | ❌ Sai lầm phổ biến nhất |
| **CircuitBreaker bọc ngoài Retry** | Toàn bộ 3 lần Retry tính là 1 đơn vị giao dịch logic | Chỉ ngắt cầu dao khi toàn bộ nỗ lực thử lại đều thất bại | ⭐⭐⭐ Chuẩn kiến trúc Resilience4j |
`;
  l643.content += '\n\n' + table643;
}

// 8. Lesson 6-4-4: Table
const l644 = mod.lessons.find(x => x.id === '6-4-4');
if (l644 && (!l644.content.includes('|') || !l644.content.includes('---'))) {
  const table644 = `
### Ma Trận Quyết Định Kiến Trúc Tự Phục Hồi (Self-Healing ADR):

| Kịch bản sự cố | Công nghệ phòng vệ | Hành vi hệ thống khi quá tải |
|---|---|---|
| **Microservice con bị treo mạng/chậm** | Resilience4j Circuit Breaker + TimeLimiter | Ngắt kết nối sau 2s, trả về dữ liệu Cache tạm thời |
| **Bão traffic tấn công từ chối dịch vụ (DDoS)** | Spring Cloud Gateway + Redis Rate Limiter | Trả về HTTP 429 Too Many Requests, bảo vệ Backend |
| **Lỗi mạng chập chờn (Network Glitch)** | Resilience4j Retry + Exponential Backoff | Thử lại 3 lần với khoảng cách thời gian tăng dần |
| **Sập toàn bộ máy chủ thanh toán bên thứ 3** | Fallback Method (\`@CircuitBreaker(fallbackMethod = ...)\`) | Lưu đơn hàng trạng thái "Chờ thanh toán sau", không báo lỗi |
`;
  l644.content += '\n\n' + table644;
}

// 9. Lesson 6-5-1: Table
const l651 = mod.lessons.find(x => x.id === '6-5-1');
if (l651 && (!l651.content.includes('|') || !l651.content.includes('---'))) {
  const table651 = `
### Ma Trận So Sánh: Spring Batch Chunk Processing vs Spring Modulith:

| Tiêu chuẩn | Spring Batch (Chunk-Oriented) | Spring Modulith |
|---|---|---|
| **Mục đích thiết kế** | Xử lý khối lượng dữ liệu khổng lồ (triệu dòng) theo lô | Quản lý ranh giới nghiệp vụ trong ứng dụng Monolith |
| **Cơ chế phân đoạn** | Đọc N bản ghi (Reader) -> Xử lý (Processor) -> Ghi 1 lần (Writer) | Đóng gói theo Domain Module, giao tiếp qua Domain Events |
| **Quản lý Transaction** | Commit Transaction theo từng Chunk (VD: 1.000 dòng/lần) | Commit Event theo Transaction của nghiệp vụ chính |
| **Khả năng phục hồi** | Khởi động lại chính xác từ điểm bị lỗi (Restartability) | Lưu Event chưa gửi vào bảng \`event_publication\` để retry |
`;
  l651.content += '\n\n' + table651;
}

// 10. Lesson 6-5-2: Mermaid + Table
const l652 = mod.lessons.find(x => x.id === '6-5-2');
if (l652) {
  const mermaid652 = `
### Sơ Đồ Kiến Trúc: Chuỗi Xử Lý Chunk-Oriented Processing 1 Triệu Giao Dịch

\`\`\`mermaid
flowchart LR
    subgraph CHUNK_PIPELINE ["Spring Batch Step: processOrdersStep (Chunk Size = 1000)"]
        Reader["📖 ItemReader<br/>(RepositoryItemReader Paging)"] -->|1. Đọc 1.000 đơn hàng| Chunk["📦 Memory Chunk (1.000 items)"]
        Chunk --> Processor["⚙️ ItemProcessor<br/>(Tính chiết khấu & Validate)"]
        Processor -->|2. Danh sách đã xử lý| Writer["💾 ItemWriter<br/>(JdbcBatchItemWriter: 1 SQL Insert)"]
    end
    
    DBIn[("🗄️ PostgreSQL Database (Source)")] --> Reader
    Writer --> DBOut[("🗄️ PostgreSQL Database (Destination)")]
    Writer -->|3. Commit Transaction & Lưu Checkpoint| Meta[("📑 Spring Batch Metadata")]

    style CHUNK_PIPELINE fill:#0f172a,stroke:#38bdf8,color:#fff
\`\`\`

### Bảng Phân Tích Cấu Hình Batch Chunk Xử Lý Dữ Liệu Lớn:

| Thành phần | Công nghệ sử dụng | Ý nghĩa kỹ thuật | Hiệu năng đạt được |
|---|---|---|---|
| **ItemReader** | \`RepositoryItemReader\` | Phân trang đọc 1,000 dòng/lần từ Database | RAM chỉ duy trì kích thước bằng 1 Chunk, không bao giờ OOM |
| **ItemProcessor** | Java 21 Lambda Stream | Chuyển đổi dữ liệu và tính toán logic | Thực thi song song hoặc tối ưu hóa CPU pipeline |
| **ItemWriter** | \`JdbcBatchItemWriter\` | Gom 1,000 câu lệnh thành 1 batch JDBC executeBatch | Tốc độ ghi dữ liệu tăng từ 100 dòng/s lên **15,000 dòng/s** |
`;
  if (!l652.content.includes('```mermaid')) {
    l652.content = mermaid652 + '\n\n' + l652.content;
  }
}

// 11. Lesson 6-5-3: Mermaid + Table
const l653 = mod.lessons.find(x => x.id === '6-5-3');
if (l653) {
  const mermaid653 = `
### Sơ Đồ Cảnh Báo: Tràn Heap RAM Do Đọc Toàn Bộ Dữ Liệu & Rò Rỉ Tenant Context

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Scheduler as ⏰ Spring Batch Job
    participant App as 🚀 JVM Heap Memory
    participant DB as 🗄️ PostgreSQL

    Note over Scheduler,DB: SỰ CỐ 1: TRÀN HEAP MEMORY VÌ DÙNG LIST TRUYỀN THỐNG
    Scheduler->>DB: orderRepository.findAll() (1.000.000 bản ghi)
    DB-->>App: Nạp 1 triệu Entity vào ArrayList
    Note over App: Heap Memory vọt lên 4GB -> java.lang.OutOfMemoryError: Java heap space!

    Note over Scheduler,DB: GIẢI PHÁP: CHUNK STREAMING VỚI THƯ VIỆN BATCH
    Scheduler->>DB: Đọc từng trang 500 bản ghi (LIMIT 500 OFFSET ...)
    Note over App: Xử lý xong 500 bản ghi -> Giải phóng RAM ngay lập tức!
\`\`\`

### Bảng Ma Trận Cạm Bẫy Batch Processing & Đa Khách Hàng (Multi-Tenancy):

| Cạm bẫy thực tế | Hậu quả sản xuất | Nguyên nhân gốc rễ | Giải pháp kỹ thuật chuẩn |
|---|---|---|---|
| **Tràn Heap Trong ItemReader** | Ứng dụng sập với lỗi \`OutOfMemoryError\` | Dùng \`findAll()\` nạp toàn bộ triệu bản ghi vào List | Sử dụng \`PagingItemReader\` hoặc \`CursorItemReader\` |
| **Rò Rỉ Tenant Context** | Khách hàng A nhìn thấy dữ liệu nhạy cảm của khách hàng B | Dùng \`ThreadLocal\` nhưng tái sử dụng Thread trong ThreadPool | Luôn \`tenantContext.remove()\` trong khối \`finally\` |
| **Lỗi Transaction Kéo Dài** | Khóa cứng bảng CSDL hàng giờ, timeout các service khác | Bọc toàn bộ 1 triệu bản ghi trong 1 Transaction duy nhất | Chia nhỏ Transaction theo từng Chunk (1,000 dòng/commit) |
`;
  if (!l653.content.includes('```mermaid')) {
    l653.content = mermaid653 + '\n\n' + l653.content;
  }
}

// 12. Lesson 6-5-4: Table
const l654 = mod.lessons.find(x => x.id === '6-5-4');
if (l654 && (!l654.content.includes('|') || !l654.content.includes('---'))) {
  const table654 = `
### Ma Trận Quyết Định Kiến Trúc: Monolith vs Spring Modulith vs Microservices (ADR):

| Tiêu chuẩn so sánh | Monolith Truyền Thống | Spring Modulith | Pure Microservices |
|---|---|---|---|
| **Độ phức tạp hạ tầng** | ⭐ Rất thấp (1 Database, 1 Server) | ⭐ Rất thấp (1 Database, 1 Artifact) | ❌ Cực cao (K8s, Istio, Kafka, Gateway, Zipkin) |
| **Ranh giới phân tầng** | ❌ Dễ thoái hóa thành "Spaghetti Code" | ⭐⭐⭐ Trình biên dịch kiểm soát ranh giới module chặt chẽ | ⭐⭐⭐ Tách biệt tuyệt đối về hạ tầng và cơ sở dữ liệu |
| **Giao tiếp liên module** | Gọi hàm Java trực tiếp | Giao tiếp qua Domain Events nội bộ bất đồng bộ | Giao tiếp qua HTTP REST hoặc Kafka Message Broker |
| **Chi phí triển khai & Vận hành** | Thấp | Thấp | Rất tốn kém (Chi phí Cloud, đội ngũ DevOps riêng) |
| **Khuyến nghị áp dụng** | Đội ngũ < 5 người, dự án thử nghiệm | **Khuyên dùng cho 80% doanh nghiệp hiện đại** | Đội ngũ > 50 kỹ sư, các phòng ban phát triển độc lập |
`;
  l654.content += '\n\n' + table654;
}

const out = `window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n` + JSON.stringify(mod, null, 2) + `\n);\n`;
fs.writeFileSync(filePath, out, 'utf8');
console.log('Module 6 successfully refactored and enriched with full 4 pillars!');
