const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module1.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m1 = window.COURSE_MODULES[0];

// Refactor Lesson 1-4-1
const l141 = m1.lessons.find(l => l.id === "1-4-1");
if (l141) {
  l141.title = "Bài 1.4.1: Kiến trúc Externalized Configuration 17 Tầng, Thứ Tự Ưu Tiên & Type-Safe Properties";
  l141.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nắm vững quy tắc thứ tự 17 tầng nạp cấu hình của Spring Boot 3 (Command-Line args > OS env > Profile yml > Default yml).
- Hiểu nguyên lý Relaxed Binding: Vì sao biến môi trường Docker \`APP_PAYMENT_MERCHANT_ID\` tự map vào trường \`merchantId\`.
- Phân biệt vì sao \`@ConfigurationProperties\` vượt trội hoàn toàn so với \`@Value\` trong dự án lớn.
- Đọc hiểu từng dòng code của một lớp cấu hình Type-Safe có Bean Validation qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: 17 TẦNG THÁP LUẬT PHÁP
Hãy tưởng tượng hệ thống cấu hình Spring Boot giống như **Hệ thống phân cấp luật pháp**:
- Tầng thấp nhất (Quy ước dân gian - Default Properties trong JAR): Mặc định chạy ở cổng 8080.
- Tầng trung (Nội quy công ty - file \`application.yml\`): Khai báo cổng 8081.
- Tầng tối cao (Mệnh lệnh khẩn cấp từ Tổng thống - Command-line \`--server.port=9090\` hoặc Biến môi trường Docker): Ghi đè toàn bộ các tầng bên dưới!
=> Dù bạn có viết gì trong \`application.yml\`, khi deploy lên Cloud Kubernetes, biến môi trường OS (\`ENV\`) luôn luôn có quyền lực tối thượng!
:::

---

## 1. Cái này là gì? (17 Tầng Ưu Tiên Cấu Hình Spring Boot)

Spring Boot xây dựng một pipeline 17 tầng để lập trình viên có thể externalize cấu hình (đưa cấu hình ra ngoài JAR), giúp cùng 1 file JAR có thể chạy được ở Dev, Staging, và Production mà không cần recompile!

### Sơ Đồ Kiến Trúc: 5 Tầng Cấu Hình Thường Gặp Nhất Theo Thứ Tự Ưu Tiên Giảm Dần

\`\`\`mermaid
flowchart TD
    L1["1. Command-line Arguments (java -jar app.jar --server.port=9090)<br/>⭐ ƯU TIÊN CAO NHẤT"] --> L2["2. Java System Properties (-Dserver.port=9090)"]
    L2 --> L3["3. OS Environment Variables (export SERVER_PORT=9090)"]
    L3 --> L4["4. Profile-specific Application Properties (application-prod.yml)"]
    L4 --> L5["5. Default Application Properties (application.yml trong JAR)<br/>ƯU TIÊN THẤP NHẤT"]
    
    style L1 fill:#7c2d12,stroke:#f97316,color:#fff
    style L3 fill:#1e3a8a,stroke:#3b82f6,color:#fff
    style L5 fill:#1e293b,stroke:#64748b,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### Ma trận So sánh: @Value vs @ConfigurationProperties

| Tiêu chí | Cú pháp \`@Value("\${app.payment.key}")\` | Cú pháp \`@ConfigurationProperties\` |
|---|---|---|
| **Cơ chế Relaxed Binding** | ❌ Không hỗ trợ: Viết sai 1 dấu gạch ngang là \`null\` | ⭐ **Hỗ trợ 100%**: Tự map \`kebab-case\`, \`camelCase\`, \`UPPER_CASE\` |
| **Kiểm tra hợp lệ (Validation)** | ❌ Không hỗ trợ Hibernate Validator | ⭐ Hỗ trợ đầy đủ: \`@NotBlank\`, \`@Min\`, \`@Max\`, \`@NotNull\` |
| **Gợi ý tự động trong IDE** | ❌ Không có gợi ý tự động (dễ gõ sai chính tả) | ⭐ Tự sinh \`spring-configuration-metadata.json\` gợi ý phím Tab trong IDE |
| **Nhóm thuộc tính lồng nhau** | Rất rối: Phải viết hàng chục dòng \`@Value\` rời rạc | ⭐ Đóng gói thành class/record lồng nhau cực kỳ ngăn nắp |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là mã nguồn chuẩn hóa cấu hình thanh toán E-Commerce bằng \`@ConfigurationProperties\`:

\`\`\`java
package vn.mastery.ecommerce.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "ecommerce.payment")
public class PaymentGatewayProperties {

    @NotBlank(message = "Merchant ID cổng thanh toán không được để trống")
    private String merchantId;

    @NotBlank(message = "Secret Key bảo mật không được để trống")
    private String secretKey;

    @Min(value = 1000, message = "Timeout tối thiểu là 1000ms")
    @Max(value = 30000, message = "Timeout tối đa là 30000ms")
    private int timeoutMs = 5000; // Giá trị mặc định an toàn

    // Getters and Setters
    public String getMerchantId() { return merchantId; }
    public void setMerchantId(String merchantId) { this.merchantId = merchantId; }
    public String getSecretKey() { return secretKey; }
    public void setSecretKey(String secretKey) { this.secretKey = secretKey; }
    public int getTimeoutMs() { return timeoutMs; }
    public void setTimeoutMs(int timeoutMs) { this.timeoutMs = timeoutMs; }
}
\`\`\`

### File cấu hình \`application.yml\` tương ứng:
\`\`\`yaml
ecommerce:
  payment:
    merchant-id: VNPAY_STORE_001
    secret-key: SECRET_KEY_DEV_XYZ
    timeout-ms: 10000
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Container |
|---|---|---|---|
| Dòng 10 | \`@Validated\` | Bật cơ chế Bean Validation lúc khởi động ứng dụng | Nếu thiếu cấu hình bắt buộc, ứng dụng sẽ Fail-Fast ngay khi boot |
| Dòng 11 | \`@ConfigurationProperties(prefix = "ecommerce.payment")\` | Gom nhóm toàn bộ key có tiền tố \`ecommerce.payment\` | Tự động đọc và map các thuộc tính tương ứng vào class Java |
| Dòng 14 | \`@NotBlank(...)\` | Ràng buộc chuỗi không được null hoặc rỗng | Bắt buộc phải khai báo Merchant ID, tránh lỗi thanh toán lúc runtime |
| Dòng 20 | \`@Min(1000) @Max(30000)\` | Ràng buộc giá trị số nằm trong khoảng an toàn | Ngăn chặn cấu hình timeout = 0 khiến request bị treo vĩnh viễn |
| Dòng 22 | \`private int timeoutMs = 5000;\` | Gán giá trị mặc định | Nếu file yml không khai báo, timeout tự nhận 5000ms an toàn |

---

## 4. Cạm bẫy thực tế & Best Practices (Senior Trap Guide)

:::danger CẠM BẪY RELAXED BINDING TRONG DOCKER CONTAINER
- Khi deploy ứng dụng Spring Boot lên Docker / Kubernetes, các dấu chấm (\`.\`) và dấu gạch ngang (\`-\`) trong tên key yml không phải là biến môi trường OS hợp lệ trên Linux.
- **Quy tắc chuyển đổi bắt buộc của Spring Boot**:
  - \`ecommerce.payment.merchant-id\` đổi thành \`ECOMMERCE_PAYMENT_MERCHANTID\` hoặc \`ECOMMERCE_PAYMENT_MERCHANT_ID\`.
  - Thay toàn bộ dấu chấm và gạch ngang thành **Dấu gạch dưới (\`_\`)** và viết **IN HOA TOÀN BỘ**.
:::
`;
}

// Refactor Lesson 1-4-2
const l142 = m1.lessons.find(l => l.id === "1-4-2");
if (l142) {
  l142.title = "Bài 1.4.2: Xây dựng Hệ Thống Cấu Hình Đa Môi Trường (Dev/Staging/Prod) & Reload Động";
  l142.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Làm chủ cấu trúc đa môi trường: \`application.yml\` (chung), \`application-dev.yml\` (local), \`application-prod.yml\` (production).
- Kích hoạt Spring Profiles linh hoạt qua biến môi trường \`SPRING_PROFILES_ACTIVE=prod\`.
- Đọc hiểu mã nguồn cấu hình đa môi trường qua Bảng phân tích từng dòng code chi tiết.
- Nắm vững cơ chế reload động cấu hình lúc runtime mà không cần restart pod.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BỘ ĐỒ NGHỀ CỦA BÁC SĨ CẤP CỨU
- Khi ở **Phòng khám tư (Môi trường Dev)**: Bác sĩ dùng ống nghe bình thường, máy tính bàn đơn giản, ghi sổ tay (Database H2, ghi log Console, cổng test giả lập).
- Khi vào **Phòng phẫu thuật bệnh viện lớn (Môi trường Production)**: Bác sĩ bật máy trợ tim tự động, kết nối phòng vô trùng, hệ thống điện dự phòng khẩn cấp (PostgreSQL Cluster, Kafka Broker, cổng VNPay thật).
- Bác sĩ vẫn là một người (vẫn là file \`app.jar\` đó), chỉ cần khoác chiếc áo khác (\`SPRING_PROFILES_ACTIVE=prod\`) là toàn bộ trang thiết bị tự động chuyển đổi phù hợp!
:::

---

## 1. Cái này là gì? (Kiến trúc Spring Profiles Đa Môi Trường)

### Sơ Đồ Kiến Trúc: Cơ Chế Kích Hoạt Profile & Hợp Nhất Cấu Hình

\`\`\`mermaid
flowchart TD
    BaseConfig["application.yml<br/>(Cấu hình nền tảng dùng chung cho mọi môi trường)"]
    
    subgraph EnvSwitcher ["SPRING_PROFILES_ACTIVE"]
        DevProfile["application-dev.yml<br/>(Local DB, Show SQL, Mock Gateway)"]
        StagingProfile["application-staging.yml<br/>(Staging DB, Test Gateway)"]
        ProdProfile["application-prod.yml<br/>(RDS Postgres Cluster, VNPay Prod, Hide SQL)"]
    end

    BaseConfig --> EnvSwitcher
    EnvSwitcher -->|Ghi đè giá trị| MergedContext["Merged Spring ApplicationContext<br/>(Cấu hình cuối cùng được nạp)"]

    style BaseConfig fill:#1e293b,stroke:#64748b,color:#fff
    style ProdProfile fill:#064e3b,stroke:#10b981,color:#fff
    style MergedContext fill:#1e3a8a,stroke:#3b82f6,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### Cấu Trúc Các File Cấu Hình Tiêu Chuẩn Trong Dự Án Enterprise

\`\`\`text
src/main/resources/
├── application.yml          # Cấu hình chung: application name, actuator endpoints
├── application-dev.yml      # Local dev: postgres localhost:5432, log level DEBUG
├── application-staging.yml  # UAT/SIT: database replica, log level INFO
└── application-prod.yml     # Production: vault secret, disable ddl-auto, log JSON
\`\`\`

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

### File \`application.yml\` (Cấu hình chung):
\`\`\`yaml
spring:
  application:
    name: ecommerce-order-service
  profiles:
    active: dev # Mặc định là dev nếu lập trình viên không chỉ định
\`\`\`

### File \`application-prod.yml\` (Cấu hình Production):
\`\`\`yaml
spring:
  datasource:
    url: jdbc:postgresql://prod-db-cluster.internal:5432/ecommerce_db
    username: \${DB_USERNAME}
    password: \${DB_PASSWORD}
    hikari:
      maximum-pool-size: 50
      minimum-idle: 10
  jpa:
    show-sql: false # Tối kỵ bật show-sql trên production vì làm chậm I/O
    hibernate:
      ddl-auto: validate # Không bao giờ dùng update trên production

ecommerce:
  payment:
    provider: vnpay
    merchant-id: \${VNPAY_PROD_MERCHANT_ID}
    secret-key: \${VNPAY_PROD_SECRET_KEY}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Thiết lập | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Spring |
|---|---|---|---|
| Dòng 6 | \`profiles.active: dev\` | Khai báo Profile mặc định an toàn | Đảm bảo khi dev clone code về bấm Run trong IntelliJ sẽ tự động chạy môi trường dev |
| Dòng 14-16 | \`maximum-pool-size: 50\` | Tối ưu hóa Hikari Connection Pool | Cung cấp đủ connection cho hàng nghìn request đồng thời trên production |
| Dòng 18 | \`show-sql: false\` | Tắt in câu lệnh SQL ra stdout | Tránh nghẽn CPU và nghẽn luồng ghi log trên máy chủ Production |
| Dòng 20 | \`ddl-auto: validate\` | Khóa quyền tự động sửa schema DB | Ép buộc mọi thay đổi bảng phải thông qua migration script Flyway |
| Dòng 25-26 | \`\${VNPAY_PROD_SECRET_KEY}\` | Placeholder trỏ vào biến môi trường | Không bao giờ lưu mật khẩu cứng trong file mã nguồn |

---

## 4. Cạm bẫy thực tế & Best Practices (Senior Trap Guide)

:::danger LỖI BẬT DDL-AUTO = UPDATE TRÊN PRODUCTION
- Một lỗi ngớ ngẩn đã từng làm bay màu hàng triệu đô la của nhiều công ty: Quên đổi \`spring.jpa.hibernate.ddl-auto=update\` khi đưa lên Production.
- Khi một developer sửa kiểu dữ liệu hoặc xóa một quan hệ Entity, Hibernate tự động chạy lệnh \`ALTER TABLE\` hoặc xóa constraint trên database Production thật, gây khóa bảng (Table Lock) hoặc hỏng dữ liệu khách hàng!
- **Quy tắc Senior**: Trên Production, giá trị \`ddl-auto\` **BẮT BUỘC PHẢI LÀ \`validate\` hoặc \`none\`**!
:::
`;
}

// Refactor Lesson 1-4-3
const l143 = m1.lessons.find(l => l.id === "1-4-3");
if (l143) {
  l143.title = "Bài 1.4.3: Cạm bẫy Đọc Sai Thứ Tự Cấu Hình, Rò Rỉ Bí Mật (Secrets) & Lỗi @Value SpEL";
  l143.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nhận diện 3 sự cố an ninh nghiêm trọng: Lộ Secret Key thanh toán lên GitHub, Lỗi NPE khi thiếu giá trị cấu hình, và Rò rỉ mật khẩu qua endpoint Actuator.
- Làm chủ kỹ thuật cấu hình giá trị mặc định trong SpEL: \`@Value("\${app.key:default_value}")\`.
- Bảo vệ bí mật sản xuất bằng cách ẩn giấu (Sanitization) dữ liệu nhạy cảm trên Spring Boot Actuator \`/env\`.
- Đọc hiểu toàn bộ mã nguồn phòng hộ qua Bảng phân tích chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: GIẤU CHÌA KHÓA NHÀ DƯỚI TẤM THẢM
Nhiều lập trình viên có thói quen:
- Viết thẳng mật khẩu Database \`password: admin123\` hoặc Secret Key ví MoMo vào file \`application.yml\` rồi commit lên GitHub.
- Việc này chẳng khác nào bạn **khóa cửa nhà cẩn thận nhưng lại để chùm chìa khóa ngay dưới tấm thảm chùi chân trước cửa**! Hacker chỉ cần quét bot tự động trên GitHub là toàn bộ tiền trong tài khoản ví điện tử bị rút sạch trong 30 giây!
:::

---

## 1. Cái này là gì? (Lỗ Hổng An Ninh Trong Cấu Hình Ứng Dụng)

### Sơ Đồ Rò Rỉ Bí Mật & Cơ Chế Che Mờ (Sanitization)

\`\`\`mermaid
flowchart TD
    Attacker["Hacker / Người dùng bên ngoài"] --> ActuatorEndpoint["Endpoint: GET /actuator/env"]
    
    subgraph SpringBootApp ["Hệ Thống Spring Boot"]
        ConfigProps["Environment Properties (Database, JWT, VNPay)"]
        Sanitizer{"Spring Boot Sanitizer<br/>Keys: *password*, *secret*, *key*"}
        ConfigProps --> Sanitizer
    end

    Sanitizer -- "Chưa cấu hình lọc" --> Leak["❌ LỘ NGUYÊN BẢN: password=root123<br/>-> HACK TOÀN BỘ HỆ THỐNG!"]
    Sanitizer -- "Đã cấu hình lọc chuẩn" --> Safe["⭐ CHE MỜ BẢO MẬT: password=******<br/>-> AN TOÀN TUYỆT ĐỐI!"]
    Safe --> ActuatorEndpoint

    style Leak fill:#7c2d12,stroke:#f97316,color:#fff
    style Safe fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### 3 Cạm bẫy cấu hình thường gặp trong thực tế

| Tên cạm bẫy | Hậu quả thực tế | Cách giải quyết chuẩn Senior |
|---|---|---|
| **Commit Secret lên Git** | Bị lộ API Key OpenAI, AWS S3, VNPay trên GitHub public/private | Sử dụng \`\${ENV_VAR}\` kết hợp công cụ quét git-secrets trong CI/CD |
| **Thiếu Default Value trong \`@Value\`** | Ứng dụng crash ngay lúc boot với lỗi \`IllegalArgumentException: Could not resolve placeholder\` | Luôn cung cấp fallback: \`@Value("\${app.timeout:5000}")\` |
| **Lộ mật khẩu qua Actuator** | Nhân viên nội bộ hoặc hacker xem được mật khẩu DB qua \`/actuator/env\` | Cấu hình \`management.endpoint.env.show-values: when-authorized\` |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là cấu hình bảo vệ bí mật sản xuất trong \`application-prod.yml\`:

\`\`\`yaml
management:
  endpoints:
    web:
      exposure:
        include: "health,metrics,prometheus" # Tuyệt đối KHÔNG mở 'env' ra public
  endpoint:
    env:
      show-values: when-authorized # Chỉ hiển thị khi có quyền Admin
      roles: "ROLE_ACTUATOR_ADMIN"
      additional-keys-to-sanitize: # Danh sách các từ khóa cần che mờ thành ******
        - "merchant-id"
        - "secret-key"
        - "vnpay"
        - "jwt"
        - "private-key"
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp cấu hình | Ý nghĩa kỹ thuật | Tác động bảo mật hệ thống |
|---|---|---|---|
| Dòng 5 | \`include: "health,metrics,prometheus"\` | Chỉ mở các endpoint giám sát an toàn | Chặn đứng các endpoint nguy hiểm như \`/env\`, \`/beans\`, \`/mappings\` khỏi internet |
| Dòng 8 | \`show-values: when-authorized\` | Cơ chế che mờ giá trị | Người dùng bình thường chỉ thấy \`******\`, chỉ Admin xác thực mới thấy giá trị |
| Dòng 10-15 | \`additional-keys-to-sanitize\` | Bổ sung danh sách từ khóa bí mật riêng của dự án | Tự động biến đổi mọi property chứa chữ \`secret-key\`, \`jwt\` thành \`******\` |

---

## 4. Key Takeaways & Cạm bẫy sống còn (Senior Architect Summary)

1. **Tuyệt đối không commit mật khẩu vào Git**: Sử dụng file \`.env\` hoặc Kubernetes ConfigMap / Secret để inject lúc runtime.
2. **Luôn có giá trị mặc định cho @Value**: Cú pháp \`@Value("\${app.retry.limit:3}")\` giúp ứng dụng không bị sập nếu người vận hành quên khai báo property trong file cấu hình.
`;
}

// Refactor Lesson 1-4-4
const l144 = m1.lessons.find(l => l.id === "1-4-4");
if (l144) {
  l144.title = "Bài 1.4.4: Milestone Synthesis: Bản đồ 17 Tầng Cấu Hình & Ma trận Quản Trị Bí Mật Sản Xuất";
  l144.content = `
:::target 🎯 MỤC TIÊU BÀI TỔNG HỢP MILESTONE (10 PHÚT)
- Tổng hợp toàn diện 17 tầng cấu hình và cơ chế nạp Externalized Configuration của Spring Boot 3.
- Nắm chắc Ma trận Quyết định Quản Trị Bí Mật Sản Xuất (Vault vs K8s Secrets vs AWS Secrets Manager).
- Đọc hiểu toàn bộ mã nguồn tổng hợp \`EnterpriseSecurityConfigManager\` qua Bảng phân tích chi tiết.
- Nắm chắc 4 nguyên tắc vàng để ứng dụng chạy ổn định trên mọi môi trường Cloud Native.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: KÉT SẮT VÂN TAY ĐA MÔI TRƯỜNG
Quản trị cấu hình trong hệ thống E-Commerce quy mô lớn giống như **Chiếc két sắt thông minh**:
- Bạn mang két sắt từ văn phòng Hà Nội (Dev) sang chi nhánh Sài Gòn (Production).
- Bạn không cần đập két sắt ra làm lại (không cần rebuild file JAR).
- Chỉ cần cắm chìa khóa điện tử của chi nhánh Sài Gòn (Biến môi trường \`SPRING_PROFILES_ACTIVE=prod\` và Kubernetes Secret) là két sắt tự động mở đúng ngăn chứa tiền của Sài Gòn!
:::

---

## 1. Cái này là gì? (Bản đồ Dòng chảy Nạp Cấu Hình 17 Tầng)

### Sơ Đồ Kiến Trúc: Chuỗi Phân Giải Giá Trị Thuộc Tính Spring Boot

\`\`\`mermaid
flowchart TD
    Arg["1. Command-line: --server.port=9090"] --> Env["2. OS Environment: SERVER_PORT=9090"]
    Env --> Random["3. RandomValuePropertySource (random.uuid)"]
    Random --> ProfileYml["4. application-{profile}.yml ngoài thư mục jar"]
    ProfileYml --> ProfileJar["5. application-{profile}.yml trong thư mục jar"]
    ProfileJar --> BaseYml["6. application.yml ngoài thư mục jar"]
    BaseYml --> BaseJar["7. application.yml trong thư mục jar"]
    BaseJar --> DefaultProps["8. SpringApplication.setDefaultProperties()"]

    style Arg fill:#7c2d12,stroke:#f97316,color:#fff
    style Env fill:#1e3a8a,stroke:#3b82f6,color:#fff
    style BaseJar fill:#1e293b,stroke:#64748b,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Ma trận Quản Trị Bí Mật Sản Xuất)

### Bảng Ma Trận So Sánh Các Giải Pháp Quản Lý Bí Mật Enterprise

| Giải pháp | HashiCorp Vault | Kubernetes Secrets | AWS / GCP Secrets Manager | Biến Môi Trường Cục Bộ |
|---|---|---|---|---|
| **Cơ chế xoay vòng (Rotation)** | ⭐ **Tự động 100%**: Xoay key động không cần restart pod | Cần restart pod để nạp Secret mới | Tự động tích hợp Cloud IAM | ❌ Thủ công hoàn toàn |
| **Kiểm toán (Audit Log)** | ⭐ Ghi nhận chi tiết từng request đọc secret | Log qua K8s API server | Log qua AWS CloudTrail | ❌ Không có log truy cập |
| **Chi phí vận hành** | Cao (Cần cụm Vault Cluster riêng) | Thấp (Có sẵn trong cụm K8s) | Trả tiền theo số lượng secret | Miễn phí |
| **Khi nào nên dùng** | Ngân hàng, Cổng thanh toán quốc tế | 90% Ứng dụng Cloud Native K8s | Hệ thống chạy thuần AWS / GCP | Chỉ dùng cho máy tính Dev cá nhân |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là mã nguồn tổng hợp của Service Quản Trị Cấu Hình An Toàn E-Commerce:

\`\`\`java
package vn.mastery.ecommerce.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
@EnableConfigurationProperties(PaymentGatewayProperties.class)
public class EnterpriseSecurityConfigManager {

    private final PaymentGatewayProperties paymentProps;
    private final Environment environment;

    public EnterpriseSecurityConfigManager(PaymentGatewayProperties paymentProps,
                                           Environment environment) {
        this.paymentProps = paymentProps;
        this.environment = environment;
    }

    public void printStartupBanner() {
        String activeProfile = environment.getActiveProfiles().length > 0 
            ? environment.getActiveProfiles()[0] 
            : "default";

        System.out.println("==================================================");
        System.out.println("   ECOMMERCE SERVICE KHỞI ĐỘNG THÀNH CÔNG");
        System.out.println("   Môi trường hoạt động: " + activeProfile.toUpperCase());
        System.out.println("   Merchant ID: " + paymentProps.getMerchantId());
        System.out.println("   Secret Key: [ĐÃ BẢO VỆ VÀ CHE MỜ]");
        System.out.println("   Timeout: " + paymentProps.getTimeoutMs() + " ms");
        System.out.println("==================================================");
    }
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Spring |
|---|---|---|---|
| Dòng 7 | \`@Configuration\` | Đánh dấu class cấu hình trung tâm | Nạp bean quản trị vào Spring Container |
| Dòng 8 | \`@EnableConfigurationProperties(...)\` | Kích hoạt bean \`PaymentGatewayProperties\` | Ràng buộc các thuộc tính đã được validate chặt chẽ vào bean |
| Dòng 14 | \`Environment environment\` | Inject abstraction môi trường của Spring | Cho phép truy vấn danh sách profile đang chạy và cấu hình hệ thống |
| Dòng 21-23 | \`environment.getActiveProfiles()\` | Lấy danh sách profile đang kích hoạt | Kiểm tra xem ứng dụng đang chạy ở \`dev\`, \`staging\` hay \`prod\` |
| Dòng 29 | \`[ĐÃ BẢO VỆ VÀ CHE MỜ]\` | Quy tắc bảo mật an ninh | Tuyệt đối không bao giờ in Secret Key ra console stdout lúc khởi động |

---

## 4. Key Takeaways & Nguyên Tắc Sống Còn (Senior Architect Summary)

1. **Chuẩn 12-Factor App**: Lưu cấu hình trong biến môi trường để cùng 1 bản build Docker image có thể deploy an toàn từ Local sang Production.
2. **Ưu tiên Type-Safe Properties**: Thay thế toàn bộ \`@Value\` rải rác bằng \`@ConfigurationProperties\` có kiểm tra validation chặt chẽ.
3. **Tuyệt đối cấm in Secret ra Log**: Secret Key, Token, Password phải luôn được che mờ trong mọi file log và endpoint Actuator.
`;
}

// Serialize back to file
const outContent = `/* MODULE 1 — Spring Core & Boot căn bản (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n` + JSON.stringify(m1, null, 2) + `\n);\n`;

fs.writeFileSync(modulePath, outContent, "utf8");
console.log("Successfully refactored Module 1 Topic 4 (Lessons 1-4-1, 1-4-2, 1-4-3, 1-4-4)!");
