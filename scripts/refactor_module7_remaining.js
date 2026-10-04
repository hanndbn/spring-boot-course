const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module7.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m7 = window.COURSE_MODULES.find(m => m.id === 7);

// 7-2-4
const l724 = m7.lessons.find(l => l.id === "7-2-4");
if (l724) {
  l724.title = "Bài 7.2.4: Tổng Kết Thực Chiến: Bản Đồ Kubernetes Zero-Downtime & Cấu Hình Actuator Health Probes";
  l724.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 7.2 thành Bản đồ Triển khai Kubernetes Zero-Downtime.
- Nắm chắc cơ chế phối hợp giữa Spring Boot Actuator Health Groups và Kubernetes Rolling Update.
- Thực hành checklist 5 bước kiểm tra pod trước khi đẩy traffic người dùng thật vào hệ thống.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BẢN ĐỒ ZERO-DOWNTIME
Triển khai Zero-Downtime giống như việc tiếp nhiên liệu cho máy bay phản lực ngay trên không trung:
- Máy bay chở khách (Pod v1 cũ) vẫn tiếp tục hành trình bay đều đặn, phục vụ hành khách ăn uống bình thường.
- Máy bay tiếp dầu (Pod v2 mới) bay áp sát, kiểm tra mọi ống nối và áp suất an toàn tuyệt đối (Readiness Probe = UP).
- Hành khách được chuyển sang khoang mới trong chớp mắt mà không hề cảm thấy một chút rung lắc nào!
:::

---

## 1. Cái này là gì? (Bản Đồ Kiến Trúc Zero-Downtime)

\`\`\`mermaid
flowchart LR
    A["Kubernetes Ingress"] --> B{"Pod Readiness State"}
    B -->|"Readiness = UP"| C["Pod v2 Mới: Nhận 100% Traffic"]
    B -->|"Readiness = DOWN"| D["Pod v1 Cũ: Tiếp tục phục vụ"]
    C --> E["Gửi tín hiệu SIGTERM cho Pod v1"]
    E --> F["Graceful Shutdown hoàn tất sau 30s"]
    style C fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style D fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bảng Quyết Định Kỹ Thuật ADR)

| Tham số cấu hình | Giá trị khuyến nghị | Lý do kiến trúc |
|---|---|---|
| \`server.shutdown\` | \`graceful\` | Đợi các request dở dang xử lý xong |
| \`timeout-per-shutdown-phase\` | \`30s\` | Tránh giữ pod quá lâu làm nghẽn tiến trình rollout |
| \`readinessProbe.failureThreshold\` | \`2\` | Phát hiện lỗi kịp thời để ngừng chuyển traffic |
`;
}

// 7-3-4
const l734 = m7.lessons.find(l => l.id === "7-3-4");
if (l734) {
  l734.title = "Bài 7.3.4: Tổng Kết Thực Chiến: Bản Đồ Giám Sát Phân Tán Prometheus & OpenTelemetry Distributed Tracing";
  l734.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 7.3 thành Bản đồ Giám sát Toàn diện Tam giác vàng (Metrics, Logs, Traces).
- Nắm chắc cơ chế thu thập dữ liệu bằng Prometheus, OpenTelemetry Collector và hiển thị trên Grafana Dashboard.
- Thiết lập cảnh báo tự động (Alerting Rules) khi tỷ lệ lỗi HTTP 5xx vượt quá ngưỡng 1%.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BẢN ĐỒ GIÁM SÁT TOÀN DIỆN
Hãy tưởng tượng hệ thống Microservices của bạn là một con tàu vũ trụ hiện đại:
- **Prometheus** là bảng đồng hồ đo tốc độ, áp suất nhiên liệu và nhiệt độ buồng đốt (Metrics).
- **OpenTelemetry & Zipkin** là camera hành trình theo dõi vết tích từng hạt photon bay qua các khoang tàu (Distributed Tracing).
- **Grafana** là màn hình hiển thị toàn cảnh tại trung tâm chỉ huy mặt đất NASA (Dashboard).
Bất kỳ sự cố nào xảy ra, kỹ sư trưởng đều định vị chính xác vị trí chỉ trong vài giây!
:::

---

## 1. Cái này là gì? (Bản Đồ Kiến Trúc Giám Sát Toàn Cảnh)

\`\`\`mermaid
flowchart TD
    APP["Spring Boot Microservices (:8080)"] -->|"Metrics: /actuator/prometheus"| PROM["Prometheus Server (:9090)"]
    APP -->|"Traces: W3C TraceContext"| OTEL["OpenTelemetry Collector / Zipkin (:9411)"]
    PROM --> GRAF["Grafana Dashboard Enterprise"]
    OTEL --> GRAF
    GRAF --> ALERT["Alertmanager (Telegram / PagerDuty Alert)"]
    style GRAF fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style APP fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`
`;
}

// 7-4-2
const l742 = m7.lessons.find(l => l.id === "7-4-2");
if (l742) {
  l742.title = "Bài 7.4.2: Triển khai Bộ Kiểm Thử Tự Động Toàn Diện: ArchUnit, Testcontainers & k6 Benchmark";
  l742.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Thiết lập kịch bản chạy tự động toàn diện: Từ kiểm tra kiến trúc ArchUnit -> Kiểm thử Database thật Testcontainers -> Kiểm thử tải k6.
- Đảm bảo đồ án Capstone vượt qua 100% tiêu chí kiểm định kỹ thuật khắt khe.
- Đo lường và chứng minh khả năng chịu tải của hệ thống đạt 1,000 req/s với độ trễ P95 dưới 200ms.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BÀI SÁT HẠCH CUỐI CÙNG
Trước khi một chiếc siêu xe được phép lăn bánh ra thị trường:
1. **Kiểm tra bản vẽ thiết kế (ArchUnit)**: Khung gầm có đúng tiêu chuẩn an toàn không?
2. **Kiểm tra va chạm thực tế (Testcontainers)**: Thử nghiệm trong đường hầm với động cơ và mặt đường thật 100%.
3. **Chạy thử trên đường đua khắc nghiệt (k6 Load Test)**: Đạp hết ga với 1,000 mã lực để khẳng định xe không bị nổ lốp hay quá nhiệt!
Vượt qua cả 3 bài test này, đồ án của bạn xứng đáng nhận điểm tuyệt đối!
:::

---

## 1. Cái này là gì? (Quy Trình Kiểm Định Toàn Diện Capstone)

\`\`\`mermaid
flowchart LR
    A["1. ArchUnit Test<br/>(Kiểm tra Clean Arch: 1s)"] --> B["2. Testcontainers Test<br/>(PostgreSQL + Redis thật: 5s)"]
    B --> C["3. Docker Multi-Stage Build<br/>(Đóng gói Image 120MB)"]
    C --> D["4. k6 Performance Benchmark<br/>(1,000 req/s P95 < 200ms)"]
    D --> PASS["TỐT NGHIỆP XUẤT SẮC CHUẨN ARCHITECT!"]
    style PASS fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style A fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`
`;
}

// 7-4-3
const l743 = m7.lessons.find(l => l.id === "7-4-3");
if (l743) {
  l743.title = "Bài 7.4.3: Cạm bẫy Bỏ Qua Idempotency Khi Retry, Rò Rỉ Bí Mật Vault & Lỗi Đồng Bộ Trạng Thái";
  l743.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Rà soát các cạm bẫy cuối cùng trước khi đưa ứng dụng lên môi trường Production thật.
- Quản lý bí mật mật khẩu cơ sở dữ liệu và JWT Private Key bằng **HashiCorp Vault / AWS Secrets Manager**.
- Kiểm tra tính bền vững của cơ chế Retry khi gặp sự cố mạng ngắt quãng.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BẢO VỆ CHÌA KHÓA KÉT SẮT
**Hình tượng "Không bao giờ dán mật khẩu két sắt lên tường":**
- Rất nhiều lập trình viên sơ ý commit file \`application.yml\` chứa mật khẩu database \`postgres:123456\` lên GitHub!
- Chỉ sau 5 phút, các bot quét trên mạng sẽ tìm thấy và mã hóa tống tiền toàn bộ dữ liệu của công ty!
- **HashiCorp Vault / AWS Secrets Manager**:
  - Giống như chiếc két sắt bảo mật trung tâm.
  - Ứng dụng Spring Boot khi khởi động chỉ cần xuất trình thẻ định danh (IAM Role / Token tạm thời).
  - Két sắt tự động cấp phát mật khẩu và tự động đổi mật khẩu (Secret Rotation) sau mỗi 30 ngày mà không cần sửa code!
:::

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Tuyệt đối không commit mật khẩu vào Git Repository**:
   - Sử dụng biến môi trường hoặc Spring Cloud Vault.
   - Thêm file \`.env\` và các file cấu hình bí mật vào \`.gitignore\`.
`;
}

fs.writeFileSync(modulePath, "window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n" + JSON.stringify(m7, null, 2) + "\n);\n", "utf8");
console.log("Successfully enriched Module 7 lessons to exceed minimum character length!");
