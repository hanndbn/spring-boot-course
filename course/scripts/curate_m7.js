const fs = require('fs');
const path = require('path');

global.window = { COURSE_MODULES: [] };
const m7Path = path.join(__dirname, '..', 'js', 'content', 'module7.js');
new Function('window', fs.readFileSync(m7Path, 'utf8'))(window);
const oldM7 = window.COURSE_MODULES[0];

const topics = [
  { id: 1, title: "Docker & Container Optimization", desc: "Đóng gói Dockerfile Multi-stage, Spring Boot Layered JAR, cgroups v2 và tối ưu hóa bộ nhớ JVM." },
  { id: 2, title: "Kubernetes Zero-Downtime & Actuator", desc: "Cấu hình Liveness/Readiness Probes, Graceful Shutdown và triển khai Rolling Update không gián đoạn." },
  { id: 3, title: "Distributed Observability & Load Testing", desc: "Bộ ba Metrics, Traces, Logs: Micrometer, Prometheus, OpenTelemetry, Grafana và kiểm thử tải với k6." },
  { id: 4, title: "Capstone Architecture & Production Go-Live", desc: "Đồ án kiến trúc phân tán Capstone hoàn chỉnh, ArchUnit rules, kiểm thử ẩn và tiêu chuẩn tốt nghiệp." }
];

const outcomes = [
  "Đóng gói container Docker đạt chuẩn Layered JAR tối ưu băng thông kéo image và an toàn non-root",
  "Thiết lập Kubernetes Liveness/Readiness Probes và cơ chế Graceful Shutdown đảm bảo Zero-Downtime",
  "Xây dựng hạ tầng quan sát toàn diện với Prometheus, Grafana, OpenTelemetry và kiểm thử tải k6",
  "Hoàn thành xuất sắc Capstone Project hệ thống thương mại điện tử phân tán đạt chuẩn DevMastery Architect"
];

const retrievalWarmup = [
  {
    question: "Trong Module 6, để giải quyết thảm họa Dual-Write (ghi database cục bộ và gửi event Kafka đồng thời) tránh mất dữ liệu, pattern kiến trúc chuẩn mực nào bắt buộc phải áp dụng?",
    options: [
      "Transactional Outbox Pattern (lưu event vào bảng outbox cùng local transaction của nghiệp vụ, rồi dùng CDC Debezium hoặc Poller xuất bản sang Kafka)",
      "Two-Phase Commit (2PC) phân tán giữa JDBC và Kafka producer",
      "Gửi Kafka trước bằng asynchronous fire-and-forget, sau đó mới commit database",
      "Bọc cả lệnh ghi DB và kafkaTemplate.send() trong một khối try-catch"
    ],
    answer: 0,
    explain: "Transactional Outbox Pattern bảo đảm tính nguyên tố cục bộ (Atomicity): Record nghiệp vụ và Event Outbox được commit trong cùng 1 local DB transaction. Sau đó Debezium CDC sẽ đẩy message lên Kafka đảm bảo At-least-once delivery.",
    targetLessonId: "6-2-1"
  },
  {
    question: "Khi triển khai Saga Pattern phân tán, cơ chế nào được kích hoạt để đưa toàn hệ thống trở về trạng thái nhất quán cuối cùng nếu một bước thanh toán bị thất bại?",
    options: [
      "Thực thi Compensating Transaction (Giao dịch bù trừ) theo chiều ngược lại để hoàn trả trạng thái (ví dụ: hoàn tiền, mở khóa tồn kho)",
      "Yêu cầu database của tất cả các microservices tự động rollback",
      "Khởi động lại toàn bộ pod Kubernetes của các microservice liên quan",
      "Tự động xóa tài khoản của khách hàng"
    ],
    answer: 0,
    explain: "Trong kiến trúc phân tán không có 2PC, Saga giải quyết rollback bằng cách kích hoạt chuỗi Compensating Transaction (giao dịch bù trừ) theo chiều ngược lại để đưa hệ thống về trạng thái nhất quán cuối cùng.",
    targetLessonId: "6-3-1"
  },
  {
    question: "Tại sao khi sử dụng Redisson để tạo khóa phân tán (Distributed Lock) trên Redis, tính năng Lock Watchdog lại là cứu cánh sống còn cho hệ thống?",
    options: [
      "Watchdog tự động gia hạn thời gian sống của lock (mỗi 10s) chừng nào thread nghiệp vụ vẫn đang chạy, ngăn ngừa việc lock bị quá hạn khi tác vụ xử lý lâu hơn dự kiến",
      "Watchdog tự động gửi email cảnh báo cho quản trị viên",
      "Watchdog xóa toàn bộ cache Redis khi có lỗi",
      "Watchdog chuyển đổi khóa phân tán thành biến Java thông thường"
    ],
    answer: 0,
    explain: "Nếu set thời gian lease cứng, một tác vụ chạy chậm (do GC pause hoặc DB lag) có thể làm lock hết hạn khi chưa xong việc, dẫn đến thread khác lao vào gây race condition. Watchdog tự động gia hạn lock an toàn.",
    targetLessonId: "6-1-1"
  }
];

const getL = (id) => oldM7.lessons.find(l => l.id === id);

// Topic 1: 7-1-1 to 7-1-4 (Consolidates 7-1 and 7-4)
const t1_l1 = {
  id: "7-1-1",
  type: "theory",
  title: "Bài 7.1.1: Kiến trúc Docker Layered JAR, Multi-Stage Build & Giới Hạn Bộ Nhớ Cgroups v2",
  minutes: 8,
  content: getL("7-1-1").content + "\n\n" + getL("7-4-1").content
};

const t1_l2 = {
  id: "7-1-2",
  type: "practice",
  title: "Bài 7.1.2: Đóng Gói Dockerfile Multi-Stage Tối Ưu Layer Caching & Cấu Hình JVM Flag Container",
  minutes: 8,
  content: getL("7-1-2").content + "\n\n" + getL("7-1-3").content + "\n\n" + getL("7-4-2").content
};

const t1_l3 = {
  id: "7-1-3",
  type: "pitfall",
  title: "Bài 7.1.3: Cạm bẫy Linux OOM-Killer Tiêu Diệt JVM, Chạy Container Bằng Root User & Layer Jar Phình To",
  minutes: 7,
  content: getL("7-1-4").content + "\n\n" + getL("7-4-4").content
};

const t1_l4 = {
  id: "7-1-4",
  type: "synthesis",
  title: "Bài 7.1.4: Milestone Synthesis: Bản đồ Đóng Gói Container & Ma trận Lựa Chọn Base Image JVM",
  minutes: 8,
  content: `## Milestone Synthesis: Đóng Gói Container Docker & Tối Ưu JVM Trên Kubernetes

### 1. Sơ Đồ Kiến Trúc: Cơ Chế Docker Layer Caching Của Spring Boot Layered JAR

\`\`\`mermaid
flowchart TD
    subgraph Layers ["Cấu Trúc Layered JAR (spring-boot:layers)"]
        L1["Layer 1: dependencies (Spring, Jackson, Netty - ~80MB, Ít thay đổi nhất)"]
        L2["Layer 2: spring-boot-loader (Trình nạp JAR - ~300KB)"]
        L3["Layer 3: snapshot-dependencies (Thư viện nội bộ - ~5MB)"]
        L4["Layer 4: application (Mã nguồn của team bạn - ~200KB, Thay đổi liên tục!)"]
    end

    subgraph DockerBuild ["Quy Trình Build & Deploy Trên CI/CD"]
        L1 --> Cache1["Docker Layer Cache (CACHED - 0s)"]
        L2 --> Cache2["Docker Layer Cache (CACHED - 0s)"]
        L3 --> Cache3["Docker Layer Cache (CACHED - 0s)"]
        L4 --> Rebuild["Chỉ build và push lại Layer Application (200KB) trong 2 giây!"]
    end

    style L4 fill:#064e3b,stroke:#10b981,color:#fff
    style Rebuild fill:#1e3a8a,stroke:#3b82f6,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Lựa Chọn Base Image Cho Container Production

| Tiêu chuẩn | Eclipse Temurin JRE (Alpine) | Distroless Java (Google) | Full JDK Image (Ubuntu) |
|---|---|---|---|
| **Dung lượng image** | **Rất nhẹ (~150MB)** | Siêu nhẹ (~120MB) | Rất nặng (~450MB) |
| **Bảo mật (Attack Surface)** | Tốt (Chỉ có JRE và thư viện cơ bản) | **Tối thượng (Không có shell, không package manager)** | Kém (Chứa sẵn curl, javac, compiler dễ bị hack) |
| **Khả năng Debug trên Pod** | Có shell (\`/bin/sh\`) để exec vào kiểm tra | **Không có shell** (Cần dùng debug container) | Dễ debug nhất |
| **Khuyến nghị sử dụng** | **Tiêu chuẩn số 1 cho đội ngũ phát triển** | Phù hợp cho hạ tầng ngân hàng yêu cầu bảo mật cao | Chỉ dùng cho môi trường dev/staging |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Tránh bẫy OOM-Killer**: JVM không chỉ dùng Heap memory mà còn dùng Metaspace, Thread stack, Direct memory. Luôn đặt \`-XX:MaxRAMPercentage=75.0\` để dành lại 25% RAM cho hệ điều hành và native memory của container.
2. **Chạy non-root user**: Tuyệt đối không để container chạy dưới quyền \`root\`. Tạo user \`spring:spring\` trong Dockerfile để tuân thủ nguyên tắc Least Privilege.`
};

// Topic 2: 7-2-1 to 7-2-4
const t2_l1 = {
  id: "7-2-1",
  type: "theory",
  title: "Bài 7.2.1: Kiến trúc Kubernetes Probes (Liveness / Readiness) & Cơ Chế Graceful Shutdown",
  minutes: 8,
  content: getL("7-3-1").content
};

const t2_l2 = {
  id: "7-2-2",
  type: "practice",
  title: "Bài 7.2.2: Cấu hình Spring Boot Actuator Health Groups & K8s Deployment Rolling Update",
  minutes: 8,
  content: getL("7-3-2").content + "\n\n" + getL("7-3-3").content
};

const t2_l3 = {
  id: "7-2-3",
  type: "pitfall",
  title: "Bài 7.2.3: Cạm bẫy DB Chậm Làm Sập Liveness Probe Gây Restart Vòng Lặp (CrashLoopBackOff)",
  minutes: 7,
  content: getL("7-3-4").content + "\n\n" + getL("7-3-5").content
};

const t2_l4 = {
  id: "7-2-4",
  type: "synthesis",
  title: "Bài 7.2.4: Milestone Synthesis: Bản đồ Kubernetes Zero-Downtime & Ma trận Cấu Hình Probes",
  minutes: 8,
  content: `## Milestone Synthesis: Kubernetes Zero-Downtime Deployment & Health Probes

### 1. Sơ Đồ Kiến Trúc: Vòng Đời Triển Khai Không Gián Đoạn (Graceful Shutdown & Readiness)

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor K8s as Kubernetes Kubelet
    participant Ingress as K8s Service / Ingress
    participant Pod as Spring Boot Pod (Cũ)
    participant NewPod as Spring Boot Pod (Mới)

    Note over NewPod: Khởi động NewPod... Liveness OK, Readiness CHƯA OK!
    NewPod-->>K8s: Readiness Probe trả về UP!
    K8s->>Ingress: Thêm NewPod vào Endpoints (Bắt đầu nhận traffic mới)
    
    K8s->>Pod: Gửi tín hiệu SIGTERM (Chuẩn bị tắt Pod cũ)
    activate Pod
    Pod->>Ingress: Ngắt Pod cũ khỏi Endpoints (Không nhận request mới nữa)
    Note over Pod: server.shutdown=graceful kích hoạt!<br/>Chờ tối đa 30 giây để hoàn thành nốt các request đang dang dở!
    Pod-->>K8s: Tất cả request dang dở đã xử lý xong!
    deactivate Pod
    K8s->>Pod: SIGKILL & Tiêu hủy Pod cũ an toàn!
    Note over Ingress: KHÔNG CÓ BẤT KỲ REQUEST NÀO BỊ LỖI 502/504! 100% ZERO-DOWNTIME!
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Phân Biệt Liveness vs Readiness Probe

| Tiêu chuẩn | Liveness Probe | Readiness Probe |
|---|---|---|
| **Mục đích cốt lõi** | Kiểm tra ứng dụng có bị Deadlock / Treo máy không | Kiểm tra ứng dụng đã sẵn sàng nhận traffic chưa |
| **Endpoint Actuator** | \`/actuator/health/liveness\` | \`/actuator/health/readiness\` |
| **Thành phần kiểm tra** | **CHỈ kiểm tra nội bộ JVM** (Không kiểm tra DB, Kafka) | Kiểm tra kết nối DB, Redis, Kafka, warm-up cache |
| **Hành động khi FAIL** | **Kubelet KILL và RESTART Pod ngay lập tức** | Kubelet gỡ Pod khỏi Service, **KHÔNG restart Pod** |
| **Cạm bẫy chết người** | Cho DB vào Liveness $\rightarrow$ DB chậm làm K8s restart hàng loạt pod! | Quên cấu hình $\rightarrow$ Request gửi vào pod khi app chưa khởi động xong |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Tuyệt đối không kiểm tra DB trong Liveness**: Liveness Probe chỉ kiểm tra xem JVM có còn sống không. Nếu DB bị lag mà Liveness probe fail, K8s sẽ restart pod liên tục tạo thành cơn bão \`CrashLoopBackOff\`.
2. **Bật Graceful Shutdown**: Cấu hình \`server.shutdown=graceful\` và \`spring.lifecycle.timeout-per-shutdown-phase=30s\` để pod chờ các request đang xử lý hoàn tất trước khi dừng.`
};

// Topic 3: 7-3-1 to 7-3-4 (Consolidates 7-2 and 7-5)
const t3_l1 = {
  id: "7-3-1",
  type: "theory",
  title: "Bài 7.3.1: Kiến trúc Quan Sát Tam Giác Vàng (Metrics, Traces, Logs) & W3C Distributed Tracing",
  minutes: 8,
  content: getL("7-2-1").content + "\n\n" + getL("7-5-1").content
};

const t3_l2 = {
  id: "7-3-2",
  type: "practice",
  title: "Bài 7.3.2: Tích hợp Micrometer Prometheus, OpenTelemetry Zipkin & Kịch Bản Load Test k6",
  minutes: 8,
  content: getL("7-2-2").content + "\n\n" + getL("7-2-3").content + "\n\n" + getL("7-5-2").content + "\n\n" + getL("7-5-3").content
};

const t3_l3 = {
  id: "7-3-3",
  type: "pitfall",
  title: "Bài 7.3.3: Cạm bẫy Cardinality Explosion Làm Nổ RAM Prometheus & Mất Trace ID Qua Thread Mới",
  minutes: 7,
  content: getL("7-2-4").content + "\n\n" + getL("7-5-4").content
};

const t3_l4 = {
  id: "7-3-4",
  type: "synthesis",
  title: "Bài 7.3.4: Milestone Synthesis: Bản đồ Giám Sát Phân Tán & Ma trận SLI/SLO/SLA Sản Xuất",
  minutes: 8,
  content: `## Milestone Synthesis: Tam Giác Vàng Observability & Kiểm Thử Tải k6

### 1. Sơ Đồ Kiến Trúc: Lan Truyền Ngữ Cảnh W3C Trace Context Qua Các Microservices

\`\`\`mermaid
flowchart LR
    Client["Client Request"] --> Gateway["API Gateway<br/>(Sinh TraceId: 4bf92f3577b34da6)"]
    Gateway -- "Header: traceparent: 00-4bf9...-01" --> OrderService["Order Service (SpanId: 00f067aa0ba902b7)"]
    OrderService -- "Truyền tiếp traceparent" --> KafkaMsg["Kafka Message (Event Header)"]
    KafkaMsg --> PayService["Payment Service (Cùng TraceId, SpanId mới)"]
    
    Gateway --> Collector["OpenTelemetry Collector"]
    OrderService --> Collector
    PayService --> Collector
    Collector --> Jaeger["Jaeger / Zipkin Tracing UI<br/>(Xem toàn bộ hành trình request qua 3 services!)"]

    style Gateway fill:#1e293b,stroke:#3b82f6,color:#fff
    style Jaeger fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Ba Trụ Cột Của Hệ Thống Giám Sát (Observability)

| Trụ cột | Công cụ chuẩn hóa | Câu hỏi giải quyết | Chi phí lưu trữ |
|---|---|---|---|
| **Metrics** | Micrometer + Prometheus + Grafana | "Hệ thống đang gặp sự cố ở đâu và mức độ thế nào?" | Rất thấp (Dữ liệu số Time-series) |
| **Traces** | OpenTelemetry + Zipkin / Tempo | "Request bị chậm ở service nào, query DB nào?" | Trung bình (Cần áp dụng Sampling 5-10%) |
| **Logs** | Logback JSON + Loki / ELK Stack | "Tại sao lỗi lại xảy ra? Nội dung ngoại lệ là gì?" | Rất cao (Cần cấu hình log retention) |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Cạm bẫy Cardinality Explosion**: Tuyệt đối không đưa các giá trị động không giới hạn (như UserId, OrderId, Email) vào Tag của Prometheus Metric; nó sẽ sinh ra hàng triệu time-series làm tràn RAM của Prometheus server.
2. **K6 Load Testing là thước đo thực tế**: Không dựa vào cảm tính; luôn chạy k6 load test để xác định điểm gãy (breaking point) và đo lường độ trễ P95/P99 trước khi go-live.`
};

// Topic 4: 7-4-1 to 7-4-4
const t4_l1 = {
  id: "7-4-1",
  type: "theory",
  title: "Bài 7.4.1: Kiến trúc Tổng Thể Capstone: E-Commerce Order & Payment Distributed System",
  minutes: 8,
  content: getL("7-6-1").content
};

const t4_l2 = {
  id: "7-4-2",
  type: "practice",
  title: "Bài 7.4.2: Triển khai Bộ Kiểm Thử Tự Động Toàn Diện: ArchUnit, Testcontainers & k6 Benchmark",
  minutes: 8,
  content: getL("7-6-2").content + "\n\n" + getL("7-6-3").content
};

const t4_l3 = {
  id: "7-4-3",
  type: "pitfall",
  title: "Bài 7.4.3: Cạm bẫy Bỏ Qua Idempotency Khi Retry, Rò Rỉ Bí Mật Vault & Lỗi Đồng Bộ Trạng Thái",
  minutes: 7,
  content: getL("7-6-4").content + "\n\n" + getL("7-6-5").content
};

const t4_l4 = {
  id: "7-4-4",
  type: "synthesis",
  title: "Bài 7.4.4: Milestone Synthesis: Bản đồ Kiến trúc Đồ án Tốt Nghiệp Capstone & Bảng Tiêu Chuẩn Đỗ Cấp Architect",
  minutes: 8,
  content: `## Milestone Synthesis: Bản Đồ Kiến Trúc Capstone & Tiêu Chuẩn Đỗ Cấp Architect

### 1. Sơ Đồ Kiến Trúc Tổng Thể: Toàn Cảnh Hệ Thống Thương Mại Điện Tử Phân Tán (Capstone Architecture)

\`\`\`mermaid
flowchart TD
    Client["Client Apps (Web / Mobile)"] --> Gateway["Spring Cloud Gateway (BFF + RateLimiter + CORS)"]
    Gateway --> Keycloak["Keycloak IAM Server (OAuth2 / OIDC SSO)"]
    
    subgraph Microservices ["Cụm Microservices Nghiệp Vụ (Java 21 LTS + Spring Boot 3.3+)"]
        OrderSvc["Order Service<br/>(Clean Architecture, Postgres, Outbox Table)"]
        PaySvc["Payment Service<br/>(Pessimistic Lock, Postgres, Idempotent)"]
        StockSvc["Inventory Service<br/>(Redis Cache, Postgres, Concurrency Check)"]
    end

    Gateway --> OrderSvc
    Gateway --> PaySvc
    Gateway --> StockSvc

    subgraph MessagingInfra ["Hạ Tầng Nhắn Tin & Lưu Trữ Phân Tán"]
        Debezium["Debezium CDC Engine (Đọc WAL)"] --> Kafka["Apache Kafka Cluster (KRaft Mode)"]
        Kafka --> OrderSvc
        Kafka --> PaySvc
        Kafka --> StockSvc
        RedisCluster["Redis Cluster (Distributed Lock & Two-Level Cache)"]
    end

    OrderSvc --> Debezium
    StockSvc <--> RedisCluster

    subgraph ObservabilityStack ["Hạ Tầng Giám Sát SRE"]
        Prometheus["Prometheus Metrics"]
        Grafana["Grafana Dashboards"]
        Zipkin["Zipkin Distributed Tracing"]
    end

    OrderSvc -.-> Prometheus
    PaySvc -.-> Prometheus
    OrderSvc -.-> Zipkin
    Prometheus --> Grafana

    style Gateway fill:#1e293b,stroke:#3b82f6,color:#fff
    style Kafka fill:#4c1d95,stroke:#8b5cf6,color:#fff
    style OrderSvc fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

### 2. Bảng Tiêu Chuẩn Đỗ Chứng Chỉ Kỹ Sư Cấp Cao (Architect Certification Rubric)

| Hạng mục kiểm tra | Tiêu chuẩn ĐỖ BẮT BUỘC (Passing Gates) | Điểm CỘNG NÂNG CAO (Bonus Honors) |
|---|---|---|
| **Hidden Integration Tests** | **Pass 100% Testcontainers test suite** chạy trên PostgreSQL & Kafka thật | Viết custom Testcontainer tái sử dụng |
| **Kiểm tra ArchUnit** | **Pass 100% ArchUnit rules**: Cấm Controller gọi Repo, cấm circular dependencies | Mở rộng kiểm tra naming conventions tùy biến |
| **Khả năng Concurrency** | **Không xảy ra bán âm kho** khi chạy thử nghiệm 200 concurrent requests | Tối ưu hóa bằng Atomic Conditional Update |
| **Phản biện ADR** | Nêu rõ trade-offs của các quyết định kiến trúc | Trình bày bản phân tích chi phí Cloud FinOps |
| **Tải k6 Benchmark** | Đạt P95 latency < 500ms dưới tải 100 VU | Phân tích sâu bottleneck qua flame graphs |

---

### 3. Key Takeaways & Nguyên Tắc Tốt Nghiệp
1. **Chứng chỉ xác thực theo khóa học**: Tên chứng chỉ là **DevMastery Verified — Spring Boot Architect**, đại diện cho năng lực kỹ thuật thực chiến đã được kiểm định qua code thật và hidden test suite, không phải chức danh nghề nghiệp ảo.
2. **Quy tắc bảo mật production**: Không bao giờ commit credentials vào Git; luôn dùng Kubernetes Secrets hoặc HashiCorp Vault.
3. **Chúc mừng bạn đã hoàn thành trọn vẹn Lộ trình Kỹ sư Spring Boot & Kiến trúc Phân tán!**`
};

// 4 Additional Quiz Questions for Module 7 (12 + 4 = 16 questions)
const additionalQuestions = [
  {
    level: "hard",
    scenario: "Khi triển khai Spring Boot trên Kubernetes, nếu cấu hình Liveness Probe trỏ vào một endpoint kiểm tra kết nối Database PostgreSQL, điều gì sẽ xảy ra khi Database tạm thời bị quá tải chậm phản hồi trong 10 giây?",
    q: "Hậu quả thảm họa nào sẽ xuất hiện trên cụm Kubernetes?",
    options: [
      "Kubelet thấy Liveness fail và tự động kill pod rồi restart hàng loạt, tạo thành một cơn bão restart CrashLoopBackOff trên toàn cụm làm sập hoàn toàn hệ thống",
      "Kubernetes sẽ tự động khởi động một database mới",
      "Pod sẽ tự động ngắt kết nối với client một cách an toàn",
      "Không có ảnh hưởng nào vì Kubernetes bỏ qua lỗi Liveness"
    ],
    answer: 0,
    explain: "Liveness Probe chỉ nên kiểm tra sức khỏe nội bộ của JVM (deadlock, out of memory). Nếu DB chậm mà Liveness fail, K8s sẽ restart pod liên tục, trong khi việc restart pod hoàn toàn không giúp DB nhanh hơn mà chỉ làm tăng gánh nặng khởi động lên hệ thống.",
    why: [
      "✓ Đúng — Đây là cạm bẫy cấu hình K8s kinh điển nhất của các kỹ sư backend.",
      "Kubelet chỉ quản lý container, không tự động sinh database mới.",
      "Restart đột ngột làm ngắt kết nối thô bạo thay vì an toàn.",
      "Kubelet luôn thực thi hành động restart khi Liveness fail quá threshold."
    ]
  },
  {
    level: "hard",
    scenario: "Một ứng dụng Spring Boot chạy trong container bị Linux OOM-Killer tiêu diệt đột ngột giữa đêm dù tổng kích thước Heap Memory (-Xmx) chỉ chiếm 60% giới hạn RAM của container.",
    q: "Nguyên nhân kỹ thuật nào khiến tổng bộ nhớ của tiến trình Java vượt quá giới hạn (limit) của container?",
    options: [
      "Ngoài Heap Memory, JVM còn sử dụng Non-Heap Memory đáng kể (Metaspace, Thread Stacks, Direct Memory cho Netty I/O, Code Cache và bộ nhớ của chính JVM runtime C++)",
      "Do hệ điều hành Linux bị lỗi bộ nhớ ảo",
      "Do người dùng gửi quá nhiều request HTTP GET",
      "Do Docker container bị rò rỉ dung lượng ổ cứng"
    ],
    answer: 0,
    explain: "JVM Memory = Heap + Non-Heap (Metaspace + Thread Stack + Direct Memory + Code Cache + Native Memory). Nếu container có 1GB RAM mà đặt -Xmx800MB, lượng Non-heap và thread stack (1MB/thread x 200 threads = 200MB) sẽ đẩy tổng bộ nhớ vượt 1GB, kích hoạt Linux OOM-Killer tiêu diệt pod ngay lập tức.",
    why: [
      "✓ Đúng — Hiểu rõ cấu trúc bộ nhớ Non-Heap là kiến thức sống còn của kỹ sư vận hành Production.",
      "Linux OOM-Killer hoạt động hoàn toàn chính xác theo cơ chế cgroups.",
      "Request GET bình thường chỉ chiếm heap rác ngắn hạn, không làm tăng native memory nếu không rò rỉ.",
      "OOM-Killer tiêu diệt tiến trình dựa trên RAM, không liên quan đến ổ cứng."
    ]
  },
  {
    level: "medium",
    scenario: "Khi đóng gói ứng dụng Spring Boot 3 vào Docker image, kỹ thuật nào giúp Docker chỉ cần build lại lớp mã nguồn ứng dụng (vài trăm KB) thay vì phải tải lại toàn bộ file Fat JAR (hàng trăm MB) ở mỗi lần sửa code?",
    q: "Tính năng nào của Spring Boot Maven Plugin hỗ trợ tối ưu hóa này?",
    options: [
      "Tính năng Spring Boot Layered JAR (spring-boot:layers) phân tách các tầng dependencies, loader và application",
      "Tính năng nén file ZIP của hệ điều hành",
      "Tính năng mã hóa bảo mật ProGuard",
      "Tính năng Docker Commit"
    ],
    answer: 0,
    explain: "Spring Boot Layered JAR bóc tách file fat JAR thành 4 layer riêng biệt. Trong Dockerfile, các layer thư viện ít đổi (dependencies) được copy trước và được Docker cache lại, chỉ có layer application mới bị build lại, giúp tối ưu hóa thời gian build CI/CD từ vài phút xuống vài giây.",
    why: [
      "✓ Đúng — Layered JAR là tiêu chuẩn đóng gói container hiện đại của Spring Boot.",
      "Nén zip không giúp Docker tận dụng được layer caching.",
      "ProGuard dùng để obfuscate code, không phân tách layer container.",
      "Docker commit là lệnh lưu container thủ công, không dùng trong CI/CD."
    ]
  },
  {
    level: "medium",
    scenario: "Khi một dịch vụ Microservices bị quá tải, lệnh gọi đến một dịch vụ bên thứ ba bị treo quá 30 giây khiến các worker thread của Tomcat bị cạn kiệt.",
    q: "Pattern tự phục hồi nào giúp ngắt kết nối tức thì và trả về Fallback ngay lập tức mà không cần chờ timeout khi phát hiện dịch vụ đích đang bị sự cố?",
    options: [
      "Circuit Breaker Pattern (thực hiện qua thư viện Resilience4j)",
      "Singleton Pattern",
      "Factory Pattern",
      "Decorator Pattern"
    ],
    answer: 0,
    explain: "Circuit Breaker theo dõi tỷ lệ lỗi của các lệnh gọi mạng. Khi tỷ lệ lỗi vượt ngưỡng, Circuit Breaker chuyển sang trạng thái OPEN và ngắt ngay các lệnh gọi tiếp theo (Fail-Fast), trả về phản hồi fallback trong 0ms để giải phóng thread cho hệ thống.",
    why: [
      "✓ Đúng — Circuit Breaker là mẫu thiết kế tự phục hồi quan trọng nhất trong kiến trúc phân tán.",
      "Singleton quản lý instance đơn lẻ, không liên quan đến fault tolerance.",
      "Factory là creational pattern dùng để tạo object.",
      "Decorator dùng để mở rộng hành vi của object."
    ]
  }
];

const inlineQuiz = oldM7.lessons.find(l => l.type === 'quiz');
const updatedQuizQuestions = inlineQuiz.questions.concat(additionalQuestions);

const newLessons = [
  t1_l1, t1_l2, t1_l3, t1_l4,
  t2_l1, t2_l2, t2_l3, t2_l4,
  t3_l1, t3_l2, t3_l3, t3_l4,
  t4_l1, t4_l2, t4_l3, t4_l4,
  {
    id: "7-quiz",
    type: "quiz",
    title: "Quiz Module 7 — Sát Hạch Toàn Diện DevOps, Observability & Capstone",
    questions: updatedQuizQuestions
  }
];

const newM7 = {
  id: 7,
  title: "DevOps & Observability",
  subtitle: "Docker Layered Jar, K8s Zero-Downtime, OpenTelemetry & Capstone",
  icon: "☸️",
  desc: "Triển khai production: Đóng gói Docker Layered Jar, cấu hình K8s Zero-Downtime, giám sát Prometheus/Grafana và Capstone Project.",
  topics: topics,
  outcomes: outcomes,
  retrievalWarmup: retrievalWarmup,
  lessons: newLessons
};

const outputContent = `/* MODULE 7 — DevOps & Observability (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(${JSON.stringify(newM7, null, 2)});\n`;

fs.writeFileSync(m7Path, outputContent, 'utf8');
console.log('Successfully curated module7.js!');
console.log('Total content lessons:', newLessons.filter(l => l.type !== 'quiz').length);
console.log('Total quiz questions:', updatedQuizQuestions.length);
