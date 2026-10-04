const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module7.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m7 = window.COURSE_MODULES.find(m => m.id === 7);

// Refactor Lesson 7-1-1
const l711 = m7.lessons.find(l => l.id === "7-1-1");
if (l711) {
  l711.title = "Bài 7.1.1: Kiến trúc Docker Layered JAR, Multi-Stage Build & Giới Hạn Bộ Nhớ Cgroups v2";
  l711.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã kỹ thuật **Docker Layered JAR** của Spring Boot: Tách file JAR thành 4 tầng riêng biệt để tận dụng tối đa Docker Layer Caching.
- Nắm vững kiến trúc **Multi-Stage Build**: Biên dịch trong môi trường JDK đầy đủ, nhưng chạy trên image JRE siêu nhẹ (Eclipse Temurin / Alpine).
- Hiểu cơ chế Linux Cgroups v2 và cách JVM tự động nhận diện giới hạn RAM của container (\`-XX:MaxRAMPercentage\`).
- Đọc hiểu 100% từng dòng trong Dockerfile chuẩn Enterprise qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: DOCKER LAYERED JAR
**Hình tượng "Chở cả tảng băng vs Chỉ thay chiếc vỏ ốc":**
- File JAR của bạn nặng **100MB**:
  - Trong đó có **98MB** là các thư viện Spring, Hibernate, Jackson... (Vài tháng mới đổi 1 lần).
  - Chỉ có đúng **2MB** là mã nguồn nghiệp vụ của bạn (Sửa và deploy liên tục 20 lần mỗi ngày!).
- **Cách đóng gói thông thường (Cũ)**: Mỗi lần sửa 1 dòng code -> Docker phải tải và đẩy lại **cả 100MB** lên Docker Registry! Rất tốn băng thông và mất 5 phút!
- **Spring Boot Layered JAR — "Chia bánh thành 4 tầng"**:
  - Tầng 1: Dependencies (98MB) -> Docker nạp 1 lần duy nhất và **Cache vĩnh viễn**!
  - Tầng 2: Spring Boot Loader (0.5MB).
  - Tầng 3: Snapshot Dependencies (0.5MB).
  - Tầng 4: Application Code của bạn (Chỉ 2MB!).
  - Mỗi lần deploy mới: Docker chỉ cần đẩy đúng **2MB** lên mạng trong **3 giây**!
:::

---

## 1. Cái này là gì? (Kiến trúc Layered JAR Trong Spring Boot)

Từ Spring Boot 2.3+, công cụ \`layertools\` cho phép tách file fat-jar thành 4 thư mục riêng biệt trước khi nạp vào Docker:

\`\`\`mermaid
flowchart TD
    JAR["order-service.jar (100MB)"] -->|"java -Djarmode=layertools -jar app.jar extract"| LAYERS
    
    subgraph LAYERS["4 Lớp Layer Độc Lập"]
        L1["dependencies/ (95MB - Ít thay đổi nhất -> Cached)"]
        L2["spring-boot-loader/ (500KB - Cached)"]
        L3["snapshot-dependencies/ (Tùy biến)"]
        L4["application/ (2MB - Thay đổi thường xuyên -> Rebuild)"]
    end
    
    LAYERS --> DOCKER["Docker Image Tối Ưu Tốc Độ Build 10X"]
    style L1 fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style L4 fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dockerfile Multi-Stage chuẩn mực đạt điểm 10 tối ưu:

\`\`\`dockerfile
# GIAI ĐOẠN 1: Tách các layer từ JAR (Extractor Stage)
FROM eclipse-temurin:21-jre-alpine as builder
WORKDIR /builder
COPY target/order-service.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract

# GIAI ĐOẠN 2: Chạy ứng dụng sản xuất (Production Runtime)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Tạo user không có đặc quyền root để bảo mật an ninh
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy các layer theo thứ tự từ ít đổi đến đổi nhiều nhất để tận dụng Docker Cache
COPY --from=builder /builder/dependencies/ ./
COPY --from=builder /builder/spring-boot-loader/ ./
COPY --from=builder /builder/snapshot-dependencies/ ./
COPY --from=builder /builder/application/ ./

# Cấu hình JVM Flags tự động co giãn theo RAM của Kubernetes Pod
ENTRYPOINT ["java", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:+ExitOnOutOfMemoryError", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "org.springframework.boot.loader.launch.JarLauncher"]
\`\`\`

### Bảng Giải Mã Cấu Hình JVM Flags Trong Container:

| Tham số JVM Flag | Ý nghĩa kỹ thuật | Lợi ích an toàn |
|---|---|---|
| \`-XX:MaxRAMPercentage=75.0\` | Cho phép JVM dùng tối đa 75% RAM được cấp của Container | Dành 25% RAM còn lại cho OS, JVM Metaspace và luồng Native, **ngăn chặn Linux OOM-Killer tiêu diệt Pod** |
| \`-XX:+ExitOnOutOfMemoryError\` | Tự động thoát tiến trình khi nổ OOM | Báo cho Kubernetes biết pod đã hỏng để tự động khởi động lại Pod mới |
| \`USER spring:spring\` | Chạy với tài khoản thường không có root | Hacker dù có khai thác được lỗ hổng RCE cũng không thể kiểm soát máy chủ host |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa chạy container bằng quyền \`root\` mặc định**:
   - Nếu bạn không thêm dòng \`USER spring:spring\`, ứng dụng sẽ chạy với UID 0 (root).
   - Nếu có lỗ hổng đọc file bừa bãi, kẻ tấn công có thể đọc trộm file \`/etc/shadow\` hoặc can thiệp vào kernel!
`;
}

// Refactor Lesson 7-2-1
const l721 = m7.lessons.find(l => l.id === "7-2-1");
if (l721) {
  l721.title = "Bài 7.2.1: Kiến trúc Kubernetes Probes (Liveness / Readiness) & Cơ Chế Graceful Shutdown";
  l721.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu chính xác sự khác biệt sống còn giữa **Liveness Probe** (Kiểm tra sống chết) và **Readiness Probe** (Kiểm tra sẵn sàng nhận khách).
- Cấu hình cơ chế **Graceful Shutdown** trong Spring Boot 3: Chờ hoàn tất các đơn hàng đang thanh toán dở dang trước khi tắt pod.
- Tích hợp Spring Boot Actuator Health Groups (\`/actuator/health/liveness\` và \`/actuator/health/readiness\`).
- Đọc hiểu 100% sơ đồ vòng đời Kubernetes Pod qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: LIVENESS VS READINESS PROBE
**Hình tượng "Người bán quán phở đang chuẩn bị đồ ăn":**
- **Liveness Probe (Tôi còn thở không?)**:
  - Bác sĩ (Kubernetes Kubelet) đến kiểm tra tim mạch người bán phở.
  - Nếu người bán phở bị ngất hoặc tim ngừng đập (Deadlock, OOM): Bác sĩ lập tức **thay người khác ngay (Khởi động lại Pod - Restart Pod)**!
- **Readiness Probe (Tôi đã sẵn sàng bán hàng chưa?)**:
  - Quán phở mới mở cửa lúc 6:00 sáng. Người bán phở còn sống rất khỏe, nhưng **nồi nước dùng chưa sôi** (Spring Boot đang nạp Hibernate, kết nối DB).
  - Người bán phở treo biển: *"Chưa sẵn sàng, xin khách chờ 2 phút!"* (**Readiness = DOWN**).
  - Kubernetes sẽ **KHÔNG BAO GIỜ điều hướng khách hàng vào quán** lúc này!
  - Đến 6:05 nước sôi: Treo biển *"Đã sẵn sàng!"* (**Readiness = UP**) -> Khách ùa vào ăn mà không ai nhận lỗi 503!
:::

---

## 1. Cái này là gì? (Kiến trúc Actuator Probes Trong Kubernetes)

Spring Boot tự động cung cấp 2 endpoint chuyên dụng cho Kubernetes từ phiên bản 2.3+:
- \`/actuator/health/liveness\`: Phản ánh trạng thái \`LivenessState.CORRECT\`.
- \`/actuator/health/readiness\`: Phản ánh trạng thái \`ReadinessState.ACCEPTING_TRAFFIC\`.

### Sơ Đồ Cơ Chế Rolling Update Không Gián Đoạn (Zero-Downtime Deployment):

\`\`\`mermaid
sequenceDiagram
    participant K8s as Kubernetes Ingress / Service
    participant OldPod as Pod v1 Cũ (Đang phục vụ)
    participant NewPod as Pod v2 Mới (Đang khởi động)
    
    K8s->>NewPod: 1. Bật Pod v2 mới
    loop Readiness Probe (Mỗi 2s)
        NewPod-->>K8s: Readiness = DOWN (Đang nạp Cache/DB...)
    end
    Note over K8s: 100% Request của khách vẫn gửi vào Pod v1 an toàn!
    
    NewPod-->>K8s: Readiness = UP (Sẵn sàng 100%!)
    Note over K8s: Chuyển toàn bộ traffic sang Pod v2 mới!
    
    K8s->>OldPod: Gửi tín hiệu SIGTERM (Tắt dần)
    OldPod->>OldPod: Graceful Shutdown (Đợi xử lý nốt các đơn dở dang tối đa 30s)
    OldPod-->>K8s: Hoàn tất -> Tiêu hủy Pod v1!
    Note right of K8s: KHÔNG MỘT KHÁCH HÀNG NÀO BỊ RỚT KẾT NỐI! ZERO-DOWNTIME!
\`\`\`

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

### 1. Cấu hình trong \`src/main/resources/application.yml\`:

\`\`\`yaml
server:
  # Bật chế độ Graceful Shutdown: Chờ request dở dang hoàn tất
  shutdown: graceful

spring:
  lifecycle:
    # Cho phép tối đa 30 giây để hoàn tất các giao dịch đang chạy
    timeout-per-shutdown-phase: 30s

management:
  endpoint:
    health:
      probes:
        # Bật các endpoint chuyên dụng cho Kubernetes
        enabled: true
  endpoints:
    web:
      exposure:
        include: health, info, prometheus
\`\`\`

### 2. File cấu hình \`deployment.yaml\` trên Kubernetes:

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: order-service
          image: ecommerce/order-service:1.0.0
          ports:
            - containerPort: 8080
          # Liveness Probe: Kiểm tra xem app có bị treo chết không
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 20
            periodSeconds: 10
            failureThreshold: 3
          # Readiness Probe: Kiểm tra xem app đã sẵn sàng nhận request chưa
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 5
            failureThreshold: 2
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa đưa kiểm tra Database vào Liveness Probe**:
   - Nếu bạn cấu hình Liveness Probe kiểm tra cả Database: Khi Database bị quá tải chậm phản hồi, **Kubernetes sẽ tưởng rằng toàn bộ Pod Spring Boot bị chết và ra lệnh RESTART TOÀN BỘ CỤM POD**!
   - Hậu quả: Cả cụm pod vừa bật lên lại chết, sinh ra vòng lặp địa ngục **\`CrashLoopBackOff\`**!
   - Khắc phục: Liveness chỉ kiểm tra trạng thái nội tại của JVM (Deadlock, Thread pool). Kiểm tra Database chỉ được nằm trong Readiness Probe!
`;
}

// Refactor Lesson 7-3-1
const l731 = m7.lessons.find(l => l.id === "7-3-1");
if (l731) {
  l731.title = "Bài 7.3.1: Kiến trúc Quan Sát Tam Giác Vàng (Metrics, Traces, Logs) & W3C Distributed Tracing";
  l731.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã **Tam giác vàng của Hệ thống Quan sát (Observability Triad)**: Metrics, Traces và Logs.
- Hiểu chuẩn quốc tế **W3C Trace Context**: Tiêu chuẩn truyền tải \`traceparent\` (\`traceId\`, \`spanId\`) xuyên suốt hàng chục microservices.
- Tích hợp **Micrometer Tracing** (thay thế cho Spring Cloud Sleuth trên Spring Boot 3).
- Đọc hiểu 100% sơ đồ vết vết dòng chảy dữ liệu qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TAM GIÁC VÀNG VÀ TRACE ID
**Hình tượng "Điều tra một vụ tắc đường trong thành phố":**
1. **Metrics (Bảng điện tử báo số liệu)**: Cho bạn biết: *"Tốc độ trung bình trên đường đang giảm từ 60km/h xuống còn 5km/h!"* (CPU tăng cao, độ trễ tăng từ 50ms lên 2,000ms). Bạn biết **CÓ VẤN ĐỀ ĐANG XẢY RA**.
2. **Logs (Cuốn sổ ghi chép từng vụ va chạm)**: Ghi lại chi tiết: *"Lúc 14:02, xe tải A va quẹt xe con B tại ngã tư X"*.
3. **Traces & Trace ID (Chiếc camera định vị hành trình xuyên suốt)**:
   - Một chiếc xe (HTTP Request) đi từ cổng thành phố (Gateway) -> Sang phố Hàng Bông (Order Service) -> Sang phố Tràng Tiền (Payment Service).
   - Mỗi chiếc xe được dán một con tem duy nhất mang tên **\`TraceId = a1b2c3d4\`**.
   - Dù xe đi qua bao nhiêu phố, camera chỉ cần gõ đúng mã TraceId là soi ra chính xác: **Nó bị dừng đèn đỏ kẹt xe ở đoạn nào mất bao nhiêu giây**!
:::

---

## 1. Cái này là gì? (Kiến trúc W3C Trace Context)

Mỗi request khi đi vào hệ thống được gắn một header chuẩn W3C \`traceparent\`:
\`\`\`
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
              │  └───────────────┬───────────────┘  └───────┬──────┘  └─ Flags
           Version             Trace ID                  Span ID
\`\`\`

### Sơ Đồ Lan Truyền Trace ID Qua Các Microservices:

\`\`\`mermaid
sequenceDiagram
    participant Client
    participant GW as API Gateway (Trace: 4bf92...)
    participant Ord as Order Service (Trace: 4bf92...)
    participant Pay as Payment Service (Trace: 4bf92...)
    
    Client->>GW: 1. POST /orders
    GW->>Ord: 2. Chuyển tiếp kèm Header traceparent: 4bf92... (Span: s1)
    Ord->>Pay: 3. Gọi trừ tiền kèm traceparent: 4bf92... (Span: s2)
    Note over GW,Pay: TOÀN BỘ 3 DỊCH VỤ CÙNG CHIA SẺ CHUNG 1 TRACE ID DUY NHẤT!
\`\`\`
`;
}

// Refactor Lesson 7-3-2
const l732 = m7.lessons.find(l => l.id === "7-3-2");
if (l732) {
  l732.title = "Bài 7.3.2: Tích hợp Micrometer Prometheus, OpenTelemetry Zipkin & Kịch Bản Load Test k6";
  l732.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Cấu hình xuất khẩu Metrics chuẩn Prometheus (\`/actuator/prometheus\`) cho Grafana Dashboard.
- Tích hợp Micrometer Tracing xuất Trace dữ liệu về Zipkin / OpenTelemetry Collector.
- Viết kịch bản kiểm thử tải áp lực cao (Load Testing) bằng công cụ hiện đại **k6**.
- Đọc hiểu 100% từng dòng cấu hình và biểu đồ tải qua Bảng giải mã chi tiết.
:::

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Kịch bản Load Test với công cụ k6 (\`load-test.js\`):

\`\`\`javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Tăng dần lên 50 người dùng đồng thời
    { duration: '1m', target: 100 },  // Duy trì tải 100 người
    { duration: '30s', target: 0 },    // Hạ nhiệt
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% request phải phản hồi dưới 500ms
    http_req_failed: ['rate<0.01'],    // Tỷ lệ lỗi phải dưới 1%
  },
};

export default function () {
  const payload = JSON.stringify({
    customerId: 'CUST-PERF',
    totalAmount: 250000,
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post('http://localhost:8080/api/v1/orders', payload, params);
  check(res, {
    'status is 201': (r) => r.status === 201,
  });
  sleep(0.1);
}
\`\`\`
`;
}

// Refactor Lesson 7-4-1
const l741 = m7.lessons.find(l => l.id === "7-4-1");
if (l741) {
  l741.title = "Bài 7.4.1: Kiến trúc Tổng Thể Capstone: E-Commerce Order & Payment Distributed System";
  l741.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ 8 Module thành một Bản Thiết Kế Kiến Trúc Thống Nhất (Unified Architecture Blueprint).
- Định hình sơ đồ tương tác giữa 4 dịch vụ cốt lõi: **API Gateway**, **Order Service**, **Payment Service** và **Inventory Service**.
- Nắm chắc các chỉ số cam kết chất lượng dịch vụ: SLA 99.99%, P99 Latency < 200ms.
- Sẵn sàng bước vào đợt bảo vệ đồ án tốt nghiệp cấp độ Architect.
:::

---

## 1. Cái này là gì? (Bản Vẽ Kiến Trúc Tổng Thể Toàn Khóa Học)

\`\`\`mermaid
flowchart TD
    CLIENT["Client (Web Next.js / Mobile Flutter)"] -->|"HTTPS / Cookie BFF"| GW["Spring Cloud Gateway (BFF)<br/>[Resilience4j + Redis RateLimiter]"]
    
    subgraph SECURITY["Bảo Mật & Quản Trị Danh Tính"]
        KC["Keycloak SSO (OAuth2 / OIDC)"]
    end
    
    GW <-->|"Xác thực Token"| KC
    
    subgraph SERVICES["Cụm Microservices Nghiệp Vụ"]
        ORD["Order Service (:8081)<br/>(Clean Arch, JPA, Flyway, Outbox)"]
        PAY["Payment Service (:8082)<br/>(Saga Participant, Redisson Lock)"]
        INV["Inventory Service (:8083)<br/>(Atomic Update, Idempotent Consumer)"]
    end
    
    GW --> ORD & PAY & INV
    
    subgraph ASYNC["Truyền Tin Bất Đồng Bộ"]
        KAFKA["Apache Kafka Broker<br/>(Topics: order.events, payment.events)"]
    end
    
    ORD -->|"Transactional Outbox"| KAFKA
    KAFKA -->|"Idempotent Consumer"| INV
    KAFKA -->|"Idempotent Consumer"| PAY
    
    subgraph OBSERVABILITY["Hạ Tầng Giám Sát Production"]
        PROM["Prometheus Metrics (:9090)"]
        ZIP["Zipkin / Jaeger Tracing (:9411)"]
        GRAF["Grafana Dashboard"]
    end
    
    ORD & PAY & INV & GW -.->|"Export Metrics & Traces"| PROM & ZIP
    PROM & ZIP --> GRAF
    style GW fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style KAFKA fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style KC fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
    style GRAF fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#fff
\`\`\`
`;
}

// Refactor Lesson 7-4-4
const l744 = m7.lessons.find(l => l.id === "7-4-4");
if (l744) {
  l744.title = "Bài 7.4.4: Tổng Kết Thực Chiến: Đồ Án Tốt Nghiệp Capstone & Tiêu Chuẩn Bảo Vệ Kiến Trúc Sư Phần Mềm";
  l744.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hoàn thành toàn diện chương trình đào tạo Kỹ Sư Spring Boot & Kiến Trúc Phân Tán (132 bài vi mô chuẩn CES-2026 v2.5).
- Tự tin bảo vệ đồ án trước Hội đồng Kiến trúc sư (Architecture Review Board).
- Nắm chắc điều kiện nhận chứng chỉ tốt nghiệp **DevMastery Verified — Spring Boot Architect**.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: LỜI CHÚC MỪNG TỐT NGHIỆP
Chúc mừng bạn đã chinh phục trọn vẹn toàn bộ 8 Module của khóa học!
Từ những dòng code IoC/DI đầu tiên, bạn đã từng bước làm chủ:
- Thiết kế REST API chuẩn RFC 7807.
- Xóa bỏ triệt để lỗi N+1 Query và chống bán âm kho với Locking.
- Viết kiểm thử tự động với Testcontainers PostgreSQL thật.
- Xây dựng pháo đài bảo mật Stateless JWT kết hợp Keycloak SSO và BFF.
- Vận hành kiến trúc phân tán với Redis Lock, Kafka Outbox, Saga Pattern.
- Đóng gói Docker Layered JAR và triển khai Zero-Downtime trên Kubernetes!
Bạn không còn là một lập trình viên gõ code đơn thuần, bạn đã trở thành một **Kỹ sư Phần mềm Chuyên nghiệp mang tư duy Kiến trúc sư**!
:::

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Checklist tốt nghiệp Toàn Khóa Học**:
   - [ ] Hoàn thành 100% 132 bài học vi mô.
   - [ ] Vượt qua các bài thi Quiz với điểm số $\ge 80\%$.
   - [ ] Triển khai đồ án Capstone chạy mượt mà trên môi trường Docker Compose / Kubernetes.
   - [ ] Nhận chứng chỉ **DevMastery Verified** vinh danh trên hồ sơ kỹ sư!
`;
}

fs.writeFileSync(modulePath, "window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n" + JSON.stringify(m7, null, 2) + "\n);\n", "utf8");
console.log("Successfully refactored Module 7 (Lessons 7-1-1 to 7-4-4)!");
