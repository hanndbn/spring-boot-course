const fs = require('fs');
const path = require('path');

const modPath = path.join(__dirname, '..', 'js', 'content', 'module7.js');
global.window = { COURSE_MODULES: [], EXPANDED_QUIZZES: {} };
new Function('window', fs.readFileSync(modPath, 'utf8'))(window);

const mod = window.COURSE_MODULES[0];

// Diagram 7-1-2: Multi-Stage Dockerfile Architecture
const diag_7_1_2 = `
### Sơ Đồ Kiến Trúc: Đóng Gói Dockerfile Multi-Stage & Tách Lớp Spring Boot Layertools

\`\`\`mermaid
flowchart TD
    subgraph Stage1 ["Stage 1: Build & Extract (eclipse-temurin:21-jdk: 800MB)"]
        SourceCode["Mã Nguồn + POM"] --> MvnPackage["mvn clean package -DskipTests"]
        MvnPackage --> FatJar["app.jar (Fat JAR chứa toàn bộ dependencies)"]
        FatJar --> LayerTools["java -Djarmode=layertools -jar app.jar extract"]
        LayerTools --> L1["1. dependencies (Ít thay đổi nhất - 90% dung lượng)"]
        LayerTools --> L2["2. spring-boot-loader (Cỗ máy nạp)"]
        LayerTools --> L3["3. snapshot-dependencies (Nội bộ)"]
        LayerTools --> L4["4. application (Code nghiệp vụ - Thường xuyên thay đổi)"]
    end

    subgraph Stage2 ["Stage 2: Production Runtime (eclipse-temurin:21-jre-alpine: 140MB)"]
        NonRoot["Tạo User Không Đặc Quyền: appuser:appgroup (Chống Hacker Root)"]
        NonRoot --> CopyL1["COPY --from=builder dependencies/"]
        CopyL1 --> CopyL2["COPY --from=builder spring-boot-loader/"]
        CopyL2 --> CopyL3["COPY --from=builder snapshot-dependencies/"]
        CopyL3 --> CopyL4["COPY --from=builder application/"]
        CopyL4 --> JVMFlags["ENTRYPOINT: java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 ..."]
    end

    Stage1 --> Stage2
    style Stage1 fill:#1f2937,stroke:#4b5563,color:#fff
    style Stage2 fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 7-1-3: Linux OOM-Killer & Cgroups
const diag_7_1_3 = `
### Sơ Đồ Cảnh Báo: Cơ Chế Linux Kernel OOM-Killer Tiêu Diệt JVM Khi Vượt RAM

\`\`\`mermaid
flowchart TD
    subgraph OOMCrash ["CẠM BẪY: JVM Không Nhận Diện Cgroups (Treo Cờ MaxRAM Sai)"]
        PodLimit["Kubernetes Cấu Hình: resources.limits.memory: 1Gi"] --> JVMStart["JVM khởi động không có cờ -XX:+UseContainerSupport"]
        JVMStart --> DetectHost["JVM đọc nhầm RAM của máy chủ Node vật lý (64GB RAM)!"]
        DetectHost --> AllocateHeap["JVM tự cấp phát Max Heap = 16GB!"]
        AllocateHeap --> TrafficSpike["Lưu lượng tăng cao, JVM sử dụng chạm mức 1.1GB"]
        TrafficSpike --> LinuxKernel["Linux Kernel Cgroup Memory Subsystem phát hiện vượt quá 1Gi!"]
        LinuxKernel --> OOMKill["KERNEL GỬI TÍN HIỆU SIGKILL (Exit Code 137) TIÊU DIỆT JVM NGAY LẬP TỨC!"]
    end

    subgraph SolutionFlags ["GIẢI PHÁP: Cấu Hình Tỷ Lệ Phần Trăm RAM Container Chuẩn"]
        SafeFlags["java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0"]
        SafeFlags --> SafeHeap["Heap tự động điều chỉnh chính xác 75% của 1Gi (768MB), để lại 256MB cho Metaspace & OS!"]
    end

    style OOMCrash fill:#7c2d12,stroke:#f97316,color:#fff
    style SolutionFlags fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 7-2-1: K8s Liveness & Readiness Probes Flow
const diag_7_2_1 = `
### Sơ Đồ Tuần Tự: Cơ Chế Điều Phối Lưu Lượng Của Kubernetes Liveness & Readiness Probes

\`\`\`mermaid
sequenceDiagram
    autonumber
    participant K8s as Kubelet Controller (Kubernetes)
    participant Pod as Spring Boot Pod (Order Service)
    participant Ingress as K8s Service / Ingress
    actor Client as Khách Hàng

    Note over K8s,Pod: GIAI ĐOẠN KHỞI ĐỘNG (STARTUP)
    K8s->>Pod: GET /actuator/health/readiness
    Pod-->>K8s: 503 Service Unavailable (Đang nạp cache, Flyway đang chạy)
    Note over Ingress: K8s KHÔNG đưa Pod vào Service Endpoint (Khách không bị lỗi 502!)
    
    Pod-->>K8s: 200 OK (Cache đã nạp xong, ApplicationReady)
    K8s->>Ingress: Đăng ký Pod IP vào danh sách nhận tải
    Client->>Ingress: Mua hàng
    Ingress->>Pod: Chuyển request tới Pod (Phục vụ bình thường)
    
    Note over K8s,Pod: GIÁM SÁT ĐỊNH KỲ (LIVENESS PROBE)
    K8s->>Pod: GET /actuator/health/liveness (Mỗi 10s)
    alt Pod hoạt động bình thường
        Pod-->>K8s: 200 OK (Thread JVM sống khỏe)
    else Pod bị Deadlock hoặc sập JVM
        Pod-->>K8s: Timeout hoặc 500
        K8s->>K8s: KHỞI ĐỘNG LẠI POD TỰ ĐỘNG (Self-Healing Recovery)!
    end
\`\`\`
`;

// Diagram 7-2-2: K8s Zero-Downtime Rolling Update Architecture
const diag_7_2_2 = `
### Sơ Đồ Luồng: Cập Nhật Ứng Dụng Không Gián Đoạn (K8s Zero-Downtime Rolling Update)

\`\`\`mermaid
flowchart TD
    subgraph Step1 ["Bước 1: Cụm Đang Chạy Phiên Bản Cũ (v1.0.0)"]
        Service["K8s Service Load Balancer"] --> PodOld1["Pod 1 (v1.0.0) - Nhận Traffic"]
        Service --> PodOld2["Pod 2 (v1.0.0) - Nhận Traffic"]
    end

    subgraph Step2 ["Bước 2: Triển Khai Phiên Bản Mới (v1.1.0)"]
        Deploy["Khởi tạo Pod 3 (v1.1.0) MỚI"] --> HealthCheck["Kubelet kiểm tra /readiness"]
        HealthCheck -->|Đạt 200 OK| AddTraffic["Thêm Pod 3 vào Service Endpoint"]
    end

    subgraph Step3 ["Bước 3: Graceful Shutdown Pod Cũ"]
        Sigterm["Gửi tín hiệu SIGTERM tới Pod 1"] --> Drain["Spring Boot server.shutdown=graceful: Hoàn tất các request đang dở"]
        Drain --> Terminate["Hủy Pod 1 an toàn không rơi rớt đơn hàng nào của khách!"]
    end

    Step1 --> Step2
    Step2 --> Step3
    style Step2 fill:#1e293b,stroke:#3b82f6,color:#fff
    style Step3 fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 7-2-3: Database Lag CrashLoopBackOff Trap
const diag_7_2_3 = `
### Sơ Đồ Cảnh Báo: Cạm Bẫy Database Chậm Làm Sập Liveness Gây CrashLoopBackOff

\`\`\`mermaid
flowchart TD
    subgraph BadLivenessTrap ["CẠM BẪY: Nhét Database Health Check Vào Liveness Probe"]
        DBSlow["Database PostgreSQL bị nghẽn CPU (Khóa hàng chạy chậm 5s)"] --> LivenessCheck["Kubelet gọi /actuator/health/liveness (timeout = 3s)"]
        LivenessCheck --> Timeout["Liveness Probe bị Timeout!"]
        Timeout --> K8sKill["Kubelet nghĩ Spring Boot chết -> KILL POD VÀ RESTART!"]
        K8sKill --> RestartLoop["Pod mới khởi động lại phải nạp lại cache, DB lại càng nghẽn!"]
        RestartLoop --> CrashLoop["TOÀN BỘ CỤM SẬP HOÀN TOÀN: CrashLoopBackOff!"]
    end

    subgraph SolutionFix ["GIẢI PHÁP CHUẨN SPRING BOOT 3.3"]
        Sep1["Liveness Probe: CHỈ KIỂM TRA JVM LivenessState (Không kiểm tra DB bên ngoài)"]
        Sep2["Readiness Probe: Mới kiểm tra kết nối Database & Kafka!"]
    end

    style BadLivenessTrap fill:#7c2d12,stroke:#f97316,color:#fff
    style SolutionFix fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 7-3-2: Distributed Tracing & W3C TraceContext
const diag_7_3_2 = `
### Sơ Đồ Tuần Tự: Lan Truyền Ngữ Cảnh Truy Vết (W3C TraceContext) Qua Đa Dịch Vụ

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as Client App (k6 Load Test)
    participant Gateway as Spring Cloud Gateway
    participant OrderSvc as Order Microservice
    participant Kafka as Apache Kafka Broker
    participant PaymentSvc as Payment Microservice
    participant Zipkin as OpenTelemetry / Zipkin Dashboard

    Client->>Gateway: POST /api/v1/orders
    Note over Gateway: Sinh TraceID: 4bf92f3577b34da6a3ce929d0e0e4736<br/>Sinh SpanID: 00f067aa0ba902b7
    Gateway->>OrderSvc: HTTP Header: traceparent: 00-4bf92f35...-00f067aa...-01
    
    OrderSvc->>OrderSvc: Tiếp nhận TraceID, sinh Span con: order-creation-span
    OrderSvc->>Kafka: Gửi message (Đính kèm TraceID trong Kafka Record Headers)
    
    Kafka->>PaymentSvc: Consume message
    PaymentSvc->>PaymentSvc: Kế thừa cùng TraceID, sinh Span: payment-charge-span
    
    par Đẩy Spans về Zipkin
        Gateway->>Zipkin: Gửi Gateway Span (Latency: 5ms)
        OrderSvc->>Zipkin: Gửi Order Span (Latency: 25ms)
        PaymentSvc->>Zipkin: Gửi Payment Span (Latency: 120ms)
    end
    Note over Zipkin: Hiển thị toàn bộ sơ đồ phân tán của 1 request duy nhất trên Dashboard!
\`\`\`
`;

// Diagram 7-3-3: Prometheus Cardinality Explosion
const diag_7_3_3 = `
### Sơ Đồ Cảnh Báo: Thảm Họa Nổ Số Chiều Thước Đo (Cardinality Explosion) Trong Prometheus

\`\`\`mermaid
flowchart TD
    subgraph ExplosionTrap ["CẠM BẪY: Nhét User ID / Order ID Vào Prometheus Metrics Tag"]
        CodeBad["Counter.builder('order.created').tag('user_id', user.getId()).register(...)"]
        CodeBad --> HighCard["Hệ thống có 5,000,000 khách hàng -> Sinh ra 5 TRIỆU TIME-SERIES RIÊNG LẺ!"]
        HighCard --> PrometheusOOM["Prometheus Server bị nổ RAM (RAM tiêu thụ > 32GB) -> SẬP HẠ TẦNG GIÁM SÁT!"]
    end

    subgraph MetricBestPractice ["GIẢI PHÁP CHUẨN SRE: Chỉ Dùng Tag Có Giá Trị Hữu Hạn (Low Cardinality)"]
        GoodTags["Chỉ dùng tag: status ('SUCCESS', 'FAILED'), payment_method ('VNPAY', 'MOMO'), tier ('GOLD', 'SILVER')"]
        GoodTags --> StableMetrics["Tổng số time-series luôn dưới 50 chuỗi -> Prometheus chạy mượt mà vĩnh viễn!"]
    end

    style ExplosionTrap fill:#7c2d12,stroke:#f97316,color:#fff
    style MetricBestPractice fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 7-4-2: Capstone Enterprise CI/CD Pipeline
const diag_7_4_2 = `
### Sơ Đồ Kiến Trúc: Đường Ống CI/CD Kiểm Định Chất Lượng Toàn Diện (Capstone Pipeline)

\`\`\`mermaid
flowchart LR
    DevPush["git push origin main"] --> Gitleaks["1. Quét Rò Rỉ Secret<br/>(Gitleaks Secret Scan)"]
    Gitleaks --> Compile["2. Biên Dịch & Linter<br/>(Spotless + javac release 21)"]
    Compile --> ArchUnit["3. Kiểm Định Ranh Giới<br/>(ArchUnit Rules Pass 100%)"]
    ArchUnit --> UnitTests["4. Unit Tests Nhanh<br/>(JUnit 5 + Mockito < 30s)"]
    UnitTests --> Testcontainers["5. Integration Tests<br/>(Testcontainers PostgreSQL Thật)"]
    Testcontainers --> K6Benchmark["6. Benchmark Hiệu Năng<br/>(k6 Load Test: P99 < 150ms)"]
    K6Benchmark --> DockerBuild["7. Đóng Gói Multi-Stage<br/>(JRE Alpine 140MB)"]
    DockerBuild --> DeployK8s["8. Triển Khai K8s Staging<br/>(ArgoCD GitOps)"]

    style Gitleaks fill:#1e293b,stroke:#3b82f6,color:#fff
    style ArchUnit fill:#1e1b4b,stroke:#6366f1,color:#fff
    style Testcontainers fill:#064e3b,stroke:#10b981,color:#fff
    style DeployK8s fill:#238636,stroke:#2ea043,color:#fff
\`\`\`
`;

// Diagram 7-4-3: Production Idempotency & State Recovery
const diag_7_4_3 = `
### Sơ Đồ Luồng: Cơ Chế Bù Trừ & Chống Trùng Lặp Giao Dịch Dưới Tải k6 Benchmark

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor K6 as k6 Performance Runner (Gửi 1,000 requests/s)
    participant Gateway as API Gateway
    participant OrderSvc as Order Service
    participant Redis as Redis Idempotency Store
    participant DB as PostgreSQL DB

    K6->>Gateway: POST /orders (Header: Idempotency-Key: IDEMP-999)
    Gateway->>OrderSvc: Chuyển tiếp request
    OrderSvc->>Redis: SETNX lock:idemp:IDEMP-999 (TTL = 60s)
    alt Lần Đầu Tiên (Key chưa tồn tại)
        Redis-->>OrderSvc: 1 (Lấy khóa thành công)
        OrderSvc->>DB: Thực thi tạo đơn và trừ tiền
        OrderSvc->>Redis: Lưu kết quả phản hồi (Cached Response)
        OrderSvc-->>K6: 201 Created (Đơn hàng thành công)
    else Bị Retry Hoặc k6 Bắn Trùng (Key đã tồn tại)
        Redis-->>OrderSvc: 0 (Đã có giao dịch đang chạy hoặc đã xong)
        OrderSvc->>Redis: Lấy Cached Response đã lưu
        OrderSvc-->>K6: 200 OK (Trả về kết quả cũ, KHÔNG TRỪ TIỀN LẦN 2!)
    end
\`\`\`
`;

const injections = {
  '7-1-2': diag_7_1_2,
  '7-1-3': diag_7_1_3,
  '7-2-1': diag_7_2_1,
  '7-2-2': diag_7_2_2,
  '7-2-3': diag_7_2_3,
  '7-3-2': diag_7_3_2,
  '7-3-3': diag_7_3_3,
  '7-4-2': diag_7_4_2,
  '7-4-3': diag_7_4_3,
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
const outputCode = `/* MODULE 7 — DevOps & Observability (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(${JSON.stringify(mod, null, 2)});\n`;

fs.writeFileSync(modPath, outputCode, 'utf8');
console.log(`\nHoàn thành bổ sung sơ đồ Mermaid cho Module 7! Số bài cập nhật: ${updatedCount}/9`);
