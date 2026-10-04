const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'course', 'js', 'content', 'module7.js');
const content = fs.readFileSync(filePath, 'utf8');
const mod = new Function(`let window = { COURSE_MODULES: [] }; ${content}; return window.COURSE_MODULES[0];`)();

// 1. Lesson 7-1-4: Mermaid
const l714 = mod.lessons.find(x => x.id === '7-1-4');
if (l714 && !l714.content.includes('```mermaid')) {
  const mermaid714 = `
### Sơ Đồ Kiến Trúc: Đóng Gói Multi-Stage Docker Layered JAR Chuẩn Sản Xuất

\`\`\`mermaid
flowchart TD
    subgraph STAGE1 ["Stage 1: Build & Layer Extraction (Eclipse Temurin JDK 21)"]
        Src["📁 Source Code + pom.xml"] --> MavenBuild["⚙️ ./mvnw clean package"]
        MavenBuild --> FatJar["📦 order-service.jar (Executable Fat JAR)"]
        FatJar --> Extractor["🔪 java -Djarmode=layertools -jar extract"]
        Extractor --> L1["📂 dependencies/ (Thư viện ít thay đổi)"]
        Extractor --> L2["📂 spring-boot-loader/ (Trình khởi chạy Boot)"]
        Extractor --> L3["📂 snapshot-dependencies/"]
        Extractor --> L4["📂 application/ (Mã nguồn nghiệp vụ công ty)"]
    end

    subgraph STAGE2 ["Stage 2: Minimal Runtime Container (Distroless / Alpine JRE 21)"]
        L1 --> Img["🐳 Docker Image Layers"]
        L2 --> Img
        L3 --> Img
        L4 --> Img
        Img --> Security["🔒 Chạy dưới quyền non-root: 'appuser:appgroup'"]
        Security --> Container["🚀 Production Container (< 180MB, Build trong 3s)"]
    end

    style STAGE1 fill:#0f172a,stroke:#38bdf8,color:#fff
    style STAGE2 fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;
  l714.content = mermaid714 + '\n\n' + l714.content;
}

// 2. Lesson 7-2-1: Table
const l721 = mod.lessons.find(x => x.id === '7-2-1');
if (l721 && (!l721.content.includes('|') || !l721.content.includes('---'))) {
  const table721 = `
### Ma Trận So Sánh Các Loại Kubernetes Probes:

| Loại Probe | Đường dẫn Actuator | Mục đích kiểm tra | Hành vi của Kubernetes khi thất bại |
|---|---|---|---|
| **Startup Probe** | \`/actuator/health/liveness\` | Ứng dụng đã hoàn tất nạp Bean và khởi động xong chưa? | Tạm dừng kiểm tra Liveness/Readiness; Giết và tạo Pod mới nếu quá timeout |
| **Liveness Probe** | \`/actuator/health/liveness\` | Tiến trình JVM còn sống hay đã bị Deadlock hoàn toàn? | Khởi động lại (RESTART) Pod ngay lập tức |
| **Readiness Probe** | \`/actuator/health/readiness\` | Ứng dụng đã sẵn sàng nhận traffic phục vụ khách chưa? | Gỡ Pod khỏi danh sách Service Endpoints (Không route traffic vào) |
`;
  l721.content += '\n\n' + table721;
}

// 3. Lesson 7-2-2: Mermaid
const l722 = mod.lessons.find(x => x.id === '7-2-2');
if (l722 && !l722.content.includes('```mermaid')) {
  const mermaid722 = `
### Sơ Đồ Tuần Tự: Luồng Graceful Shutdown & Zero-Downtime Rolling Update

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor K8s as ☸️ Kubernetes Kubelet
    participant Endpoints as 🌐 K8s Service Endpoints
    participant App as 🚀 Spring Boot Pod
    participant Tomcat as 🧵 Tomcat Thread Pool

    Note over K8s,Tomcat: BẮT ĐẦU CẬP NHẬN PHIÊN BẢN MỚI
    K8s->>App: 1. Gửi tín hiệu SIGTERM
    K8s->>Endpoints: 2. Gỡ IP của Pod khỏi danh sách tiếp nhận request
    App->>App: 3. Đổi Readiness State = REFUSING_TRAFFIC
    App->>Tomcat: 4. Ngừng nhận request mới, kích hoạt Graceful Shutdown
    Note over Tomcat: Tiếp tục xử lý nốt các đơn hàng đang thanh toán dở (tối đa 30s)
    Tomcat-->>App: Đã xử lý xong 100% request còn đọng!
    App->>App: 5. Đóng DataSource HikariCP, ngắt Kafka Consumer
    App-->>K8s: Tiến trình kết thúc an toàn (Exit Code 0)
    Note over K8s: Zero-Downtime hoàn tất! Không một khách hàng nào bị lỗi 502!
\`\`\`
`;
  l722.content = mermaid722 + '\n\n' + l722.content;
}

// 4. Lesson 7-2-3: Mermaid + Table
const l723 = mod.lessons.find(x => x.id === '7-2-3');
if (l723) {
  const mermaid723 = `
### Sơ Đồ Cảnh Báo: DB Chậm Gây Sập Liveness Probe & Vòng Lặp CrashLoopBackOff

\`\`\`mermaid
sequenceDiagram
    autonumber
    participant Kubelet as ☸️ K8s Kubelet
    participant Boot as 🚀 Spring Boot Pod
    participant DB as 🗄️ PostgreSQL Database

    Note over Kubelet,DB: SỰ CỐ TAI HẠI: ĐƯA CHECK DB VÀO LIVENESS PROBE
    Kubelet->>Boot: GET /actuator/health/liveness (timeout 1s)
    Boot->>DB: SELECT 1 (Database đang bị nghẽn mạng, phản hồi mất 3s!)
    Note over Boot: Kubelet không nhận được phản hồi sau 1s -> Liveness Probe FAILED!
    Kubelet->>Boot: Kubelet giết Pod và tạo Pod mới!
    Note over Boot: Pod mới khởi động lại tiếp tục probe DB -> Lại FAIL!
    Note over Kubelet,Boot: CRASHLOOPBACKOFF: Toàn bộ Pod bị khởi động lại liên tục!
\`\`\`

### Bảng Ma Trận Phân Tách Health Indicator Cho Từng Nhóm Probe:

| Thành phần kiểm tra | Thuộc nhóm Liveness Probe? | Thuộc nhóm Readiness Probe? | Giải thích kiến trúc |
|---|---|---|---|
| **JVM Thread Deadlock** | Có (\`ping\`, \`livenessState\`) | Có | Nếu JVM bị deadlock thì bắt buộc phải restart Pod |
| **Disk Space Ổ cứng** | Có (\`diskSpace\`) | Có | Nếu hết ổ cứng ghi log thì Pod không thể hoạt động |
| **PostgreSQL Database** | ❌ **TUYỆT ĐỐI KHÔNG** | ⭐⭐⭐ **BẮT BUỘC** | DB chậm chỉ nên ngừng nhận traffic, restart Pod chỉ làm DB nghẽn hơn |
| **Kafka Broker / Redis** | ❌ **TUYỆT ĐỐI KHÔNG** | ⭐⭐⭐ **BẮT BUỘC** | Tránh hiệu ứng Domino kéo sập toàn bộ cụm server khi Broker chập chờn |
`;
  if (!l723.content.includes('```mermaid')) {
    l723.content = mermaid723 + '\n\n' + l723.content;
  }
  if (!l723.content.includes('|') || !l723.content.includes('---')) {
    l723.content += '\n\n' + table723;
  }
}

// 5. Lesson 7-3-1: Table
const l731 = mod.lessons.find(x => x.id === '7-3-1');
if (l731 && (!l731.content.includes('|') || !l731.content.includes('---'))) {
  const table731 = `
### Ma Trận Tam Giác Vàng Quan Sát Hệ Thống (Observability Triad):

| Trụ cột quan sát | Công nghệ tiêu chuẩn | Bản chất dữ liệu | Câu hỏi trả lời trong sự cố |
|---|---|---|---|
| **Metrics (Đo lường)** | Micrometer + Prometheus | Dữ liệu chuỗi thời gian số học (CPU, RAM, RPS, P99 Latency) | *"Hệ thống có đang hoạt động bất thường không? Đang nghẽn ở đâu?"* |
| **Distributed Tracing** | OpenTelemetry + Zipkin/Tempo | Chuỗi liên kết Span với \`trace_id\` và \`span_id\` theo chuẩn W3C | *"Request đặt hàng số 102 bị chậm ở service nào? Gọi DB mất bao nhiêu ms?"* |
| **Structured Logging** | Logback JSON + Grafana Loki / ELK | Nhật ký sự kiện chi tiết kèm ngữ cảnh lỗi (\`orderId\`, \`userId\`) | *"Tại sao đơn hàng bị từ chối? Ngoại lệ cụ thể là gì?"* |
`;
  l731.content += '\n\n' + table731;
}

// 6. Lesson 7-3-2: Mermaid + Table
const l732 = mod.lessons.find(x => x.id === '7-3-2');
if (l732) {
  const mermaid732 = `
### Sơ Đồ Kiến Trúc: Hạ Tầng Quan Sát Phân Tán Với Prometheus, Zipkin & Load Test k6

\`\`\`mermaid
flowchart LR
    K6["🚦 k6 Load Test (1.000 VUs)"] --> Gateway["🛡️ Spring Cloud Gateway"]
    Gateway --> OrderSvc["📦 Order Microservice"]
    OrderSvc --> PaySvc["💳 Payment Microservice"]

    subgraph METRICS_PIPELINE ["1. Luồng Chỉ Số Định Lượng (Metrics)"]
        OrderSvc -->|Micrometer /actuator/prometheus| Prom[("📊 Prometheus Server")]
        PaySvc -->|Micrometer /actuator/prometheus| Prom
        Prom --> GrafanaM["📈 Grafana Dashboard (RPS, Latency P99)"]
    end

    subgraph TRACING_PIPELINE ["2. Luồng Vết Phân Tán (Tracing W3C)"]
        Gateway -.->|W3C traceparent header| OrderSvc
        OrderSvc -.->|W3C traceparent header| PaySvc
        OrderSvc -->|OTel Traces Export| Zipkin[("🕵️ Zipkin / Tempo Server")]
        PaySvc -->|OTel Traces Export| Zipkin
        Zipkin --> GrafanaT["🔍 Grafana Trace View (End-to-End Latency)"]
    end

    style METRICS_PIPELINE fill:#0f172a,stroke:#38bdf8,color:#fff
    style TRACING_PIPELINE fill:#1e1b4b,stroke:#a855f7,color:#fff
\`\`\`

### Bảng Phân Tích Cấu Hình Observability Trong Spring Boot 3:

| Tham số cấu hình | Giá trị chuẩn | Ý nghĩa kỹ thuật |
|---|---|---|
| \`management.tracing.sampling.probability\` | \`0.1\` (10%) | Lấy mẫu 10% request trên Production để giảm chi phí lưu trữ và CPU |
| \`management.endpoints.web.exposure.include\` | \`health,prometheus,metrics\` | Chỉ mở các endpoint an toàn phục vụ việc cào dữ liệu giám sát |
| \`management.metrics.distribution.percentiles-histogram.http.server.requests\` | \`true\` | Kích hoạt biểu đồ phân bổ độ trễ (Histogram) để tính chính xác SLA P95/P99 |
`;
  if (!l732.content.includes('```mermaid')) {
    l732.content = mermaid732 + '\n\n' + l732.content;
  }
}

// 7. Lesson 7-3-3: Mermaid + Table
const l733 = mod.lessons.find(x => x.id === '7-3-3');
if (l733) {
  const mermaid733 = `
### Sơ Đồ Cảnh Báo: Bùng Nổ Số Chiều (Cardinality Explosion) Gây Sập RAM Prometheus

\`\`\`mermaid
flowchart TD
    subgraph BAD_PRACTICE ["❌ SAI LẦM: GẮN THẺ UNIQUE VÀO METRIC"]
        Req1["Request 1"] --> M1["orders_created_total{order_id='ORD-000001'}"]
        Req2["Request 2"] --> M2["orders_created_total{order_id='ORD-000002'}"]
        ReqN["Request 1.000.000"] --> MN["orders_created_total{order_id='ORD-1000000'}"]
        MN --> PromCrash["💥 Prometheus nổ tung bộ nhớ RAM (OOM Crash)!"]
    end

    subgraph GOOD_PRACTICE ["✅ CHUẨN SENIOR: CHỈ DÙNG THẺ LOW-CARDINALITY"]
        GoodReq["1.000.000 Đơn hàng"] --> GoodM1["orders_created_total{status='SUCCESS'}"]
        GoodReq --> GoodM2["orders_created_total{status='FAILED'}"]
        GoodReq --> GoodM3["orders_created_total{payment_method='MOMO'}"]
        GoodM3 --> PromSafe["⚡ Chỉ có đúng 6 chuỗi thời gian -> RAM Prometheus cực nhẹ!"]
    end

    style BAD_PRACTICE fill:#7f1d1d,stroke:#ef4444,color:#fff
    style GOOD_PRACTICE fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

### Bảng Ma Trận Phân Biệt Thẻ Giám Sát Nên & Không Nên Dùng:

| Loại Thẻ (Tag/Label) | Ví dụ giá trị | Mức độ Cardinality | Khuyến nghị sử dụng |
|---|---|---|---|
| **Mã đơn hàng (\`order_id\`)** | ORD-98124, ORD-98125... | Vô hạn ($O(N)$) | ❌ **TUYỆT ĐỐI CẤM** (Nổ RAM Prometheus) |
| **Email / User ID** | nam@gmail.com, 10293 | Hàng triệu giá trị | ❌ **TUYỆT ĐỐI CẤM** (Đưa vào Trace/Log thay thế) |
| **Trạng thái HTTP / Nghiệp vụ** | \`200\`, \`400\`, \`500\`, \`SUCCESS\` | Rất thấp (3 - 10 giá trị) | ⭐⭐⭐ **Khuyên dùng tuyệt đối** |
| **Phương thức thanh toán** | \`VNPAY\`, \`MOMO\`, \`COD\` | Rất thấp (3 - 5 giá trị) | ⭐⭐⭐ **Khuyên dùng tuyệt đối** |
`;
  if (!l733.content.includes('```mermaid')) {
    l733.content = mermaid733 + '\n\n' + l733.content;
  }
}

// 8. Lesson 7-4-2: Table
const l742 = mod.lessons.find(x => x.id === '7-4-2');
if (l742 && (!l742.content.includes('|') || !l742.content.includes('---'))) {
  const table742 = `
### Ma Trận Cổng Kiểm Định Chất Lượng Tự Động Hóa (CI/CD Quality Gates):

| Cổng kiểm định | Công cụ thực thi | Tiêu chí vượt qua (Pass Criteria) | Hành động khi vi phạm |
|---|---|---|---|
| **Quy chuẩn Kiến trúc** | ArchUnit | 0 vi phạm ranh giới phân tầng Layered Architecture | Hủy build ngay lập tức lúc compile |
| **Độ phủ Kiểm thử** | JaCoCo Unit Tests | Branch Coverage $\ge 80\%$, Instruction $\ge 85\%$ | Chặn tạo Pull Request trên GitHub |
| **Tính Đúng Đắn DB** | Testcontainers PostgreSQL | 100% Migration script Flyway chạy thành công | Chặn merge code vào nhánh \`main\` |
| **Chỉ số Hiệu năng** | k6 Load Benchmark | Độ trễ P99 $\le 100\text{ms}$ tại 1.000 RPS, Error Rate $\le 0.01\%$ | Chặn deploy lên môi trường Production |
`;
  l742.content += '\n\n' + table742;
}

// 9. Lesson 7-4-3: Mermaid + Table
const l743 = mod.lessons.find(x => x.id === '7-4-3');
if (l743) {
  const mermaid743 = `
### Sơ Đồ Cơ Chế: Đảm Bảo Tính Bất Khả Biến (Idempotency) Khi Xử Lý Thử Lại

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as 📱 Mobile App (Khách Hàng)
    participant API as 🌐 Order Service
    participant Redis as ⚡ Redis (Idempotency Store)
    participant DB as 🗄️ Database

    Client->>API: 1. Gửi lệnh thanh toán (Header: Idempotency-Key = "req-uuid-999")
    API->>Redis: SET req-uuid-999 "PROCESSING" NX EX 120
    Redis-->>API: OK (Khóa thành công)
    API->>DB: Trừ tiền ví: 500,000 VND
    Note over API: Sự cố rớt mạng 4G! Client không nhận được phản hồi!
    
    Note over Client,API: CLIENT GỬI LẠI REQUEST Y HỆT DO TIMEOUT
    Client->>API: 2. Thử lại (Header: Idempotency-Key = "req-uuid-999")
    API->>Redis: SET req-uuid-999 "PROCESSING" NX
    Redis-->>API: FAIL (Key đã tồn tại!)
    API->>Redis: GET req-uuid-999
    Redis-->>API: Trả về kết quả giao dịch trước: { status: "PAID", amount: 500000 }
    API-->>Client: 200 OK (Thành công, KHÔNG TRỪ TIỀN LẦN 2!)
\`\`\`

### Bảng Ma Trận Cạm Bẫy Vận Hành Phân Tán & Kỹ Thuật Phòng Vệ:

| Cạm bẫy thực tế | Hậu quả tai hại | Giải pháp kỹ thuật chuẩn Senior |
|---|---|---|
| **Bỏ qua Idempotency khi Retry** | Khách hàng bị trừ tiền 2 lần cho cùng 1 đơn hàng | Cơ chế \`Idempotency-Key\` kết hợp Redis Atomic Lock |
| **Hardcode Secret Trong Git** | Rò rỉ thông tin mật khẩu DB, khóa API lên GitHub | Dùng HashiCorp Vault hoặc AWS Secrets Manager |
| **Xung đột Thứ Tự Sự Kiện** | Sự kiện \`ORDER_CANCELLED\` đến trước \`ORDER_CREATED\` | Kỹ thuật Event Versioning & Out-of-Order Buffer |
`;
  if (!l743.content.includes('```mermaid')) {
    l743.content = mermaid743 + '\n\n' + l743.content;
  }
}

// 10. Lesson 7-4-4: Mermaid + Table
const l744 = mod.lessons.find(x => x.id === '7-4-4');
if (l744) {
  const mermaid744 = `
### Sơ Đồ Kiến Trúc Tổng Thể: Đồ Án Tốt Nghiệp Capstone E-Commerce

\`\`\`mermaid
flowchart TD
    Client["📱 Client App (Web / Mobile)"]
    Gateway["🛡️ Spring Cloud Gateway<br/>(BFF Token Relay + Redis Rate Limiter)"]
    Keycloak["🏛️ Keycloak SSO Server<br/>(OAuth2 OIDC Provider)"]

    subgraph CORE_SERVICES ["Cụm Dịch Vụ Nghiệp Vụ Cốt Lõi"]
        OrderSvc["📦 Order Service<br/>(Spring Boot 3 + Clean Arch)"]
        PaySvc["💳 Payment Service<br/>(Transactional Outbox)"]
        InvSvc["🏢 Inventory Service<br/>(Optimistic Lock @Version)"]
    end

    Kafka["📨 Apache Kafka Message Broker<br/>(order-events, payment-events)"]
    
    subgraph OBSERVABILITY ["Hạ Tầng Giám Sát & Vận Hành Zero-Downtime"]
        Prom[("📊 Prometheus Metrics")]
        Zipkin[("🕵️ OpenTelemetry Tracing")]
        K8s["☸️ Kubernetes Cluster<br/>(Rolling Update + Probes)"]
    end

    Client --> Gateway
    Gateway <--> Keycloak
    Gateway --> OrderSvc
    Gateway --> PaySvc
    Gateway --> InvSvc

    OrderSvc <-->|Saga Events| Kafka
    PaySvc <-->|Saga Events| Kafka
    InvSvc <-->|Saga Events| Kafka

    OrderSvc -.-> Prom
    OrderSvc -.-> Zipkin
    CORE_SERVICES -.-> K8s

    style Gateway fill:#0f172a,stroke:#38bdf8,color:#fff
    style CORE_SERVICES fill:#064e3b,stroke:#10b981,color:#fff
    style OBSERVABILITY fill:#1e1b4b,stroke:#a855f7,color:#fff
\`\`\`

### Bảng Tiêu Chuẩn Đánh Giá Đồ Án Tốt Nghiệp (Capstone Rubric):

| Hạng mục đánh giá | Yêu cầu kỹ thuật bắt buộc | Trọng số điểm |
|---|---|---|
| **Clean Architecture & Code** | 100% Endpoint dùng Record DTO, ArchUnit cưỡng chế ranh giới | 25% |
| **Tính Toàn Vẹn Giao Dịch** | Saga Orchestrator + Transactional Outbox + Xóa sổ Dual-write | 25% |
| **Bảo Mật Chuẩn Doanh Nghiệp** | BFF Gateway che giấu Token, Keycloak RBAC, phòng chống XSS | 20% |
| **Khả Năng Chịu Tải & Giám Sát** | k6 Load Test 1,000 RPS, Prometheus SLA P99 < 100ms, Tracing W3C | 15% |
| **Đóng Gói & Kubernetes** | Docker Layered JAR < 180MB, Liveness/Readiness Probes chuẩn | 15% |
`;
  if (!l744.content.includes('```mermaid')) {
    l744.content = mermaid744 + '\n\n' + l744.content;
  }
}

const out = `window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n` + JSON.stringify(mod, null, 2) + `\n);\n`;
fs.writeFileSync(filePath, out, 'utf8');
console.log('Module 7 successfully refactored and enriched with full 4 pillars!');
