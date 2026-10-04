const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module1.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m1 = window.COURSE_MODULES[0];

// Refactor Lesson 1-2-1
const l121 = m1.lessons.find(l => l.id === "1-2-1");
if (l121) {
  l121.title = "Bài 1.2.1: Giải mã Cỗ máy Auto-Configuration & Điều kiện @Conditional On Class/MissingBean";
  l121.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã "ma thuật" Convention-over-Configuration: Vì sao chỉ cần import 1 starter là Tomcat, Jackson và DataSources tự động chạy.
- Nắm chắc vòng đời khởi động của Spring Boot 3 và cơ chế đọc file SPI \`AutoConfiguration.imports\`.
- Làm chủ bộ tứ annotation \`@Conditional\`: \`@ConditionalOnClass\`, \`@ConditionalOnMissingBean\`, \`@ConditionalOnProperty\`, \`@ConditionalOnWebApplication\`.
- Đọc hiểu từng dòng code của một class Auto-Configuration qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CĂN HỘ SMART-HOME FULL NỘI THẤT
**1. Thời đại Spring Framework cũ (Căn nhà thô không có gì):**
Bạn nhận một căn nhà thô trống hoác. Bạn phải tự mua dây điện về đi, tự lắp từng bóng đèn, tự gắn công tơ nước, tự viết hàng trăm dòng cấu hình XML mệt mỏi.

**2. Thời đại Spring Boot (Căn hộ Smart-Home Full Nội Thất):**
Khi bạn bước vào nhà:
- Thấy trời tối -> Cảm biến tự bật đèn (\`@ConditionalOnClass\`).
- Thấy bạn chưa mang máy lạnh riêng -> Căn nhà tự bật máy lạnh sẵn có (\`@ConditionalOnMissingBean\`).
- Nếu bạn tự mang máy lạnh xịn của bạn vào cắm điện -> Căn nhà tự động tắt máy lạnh mặc định và nhường chỗ cho máy của bạn!
=> Đó chính là **Auto-Configuration**: Mọi thứ tự động sẵn sàng theo các quy ước thông minh, giúp bạn code ngay sản phẩm trong 5 phút!
:::

---

## 1. Cái này là gì? (Bản chất cỗ máy Auto-Configuration Spring Boot 3)

Khi ứng dụng chạy \`SpringApplication.run()\`, cỗ máy \`AutoConfigurationImportSelector\` sẽ mở file \`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports\`, quét qua hơn 140 class cấu hình tự động và đánh giá từng điều kiện \`@Conditional\`.

### Sơ Đồ Kiến Trúc: Chuỗi Thẩm Định Điều Kiện Auto-Configuration

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor App as main() -> SpringApplication.run()
    participant Boot as Bootstrap Environment
    participant Selector as AutoConfigurationImportSelector
    participant Imports as AutoConfiguration.imports (~140 class)
    participant Evaluator as OnClass / OnMissingBean / OnProperty
    participant Context as ApplicationContext Bean Registry

    App->>Boot: Nạp cấu hình application.yml & OS Env
    Boot->>Selector: Kích hoạt bộ quét Starter
    Selector->>Imports: Đọc danh sách FQN các class AutoConfiguration
    loop Đánh giá từng Class cấu hình
        Imports->>Evaluator: Kiểm tra @ConditionalOnClass (Thư viện có trong classpath?)
        Evaluator-->>Imports: Classpath thỏa mãn
        Imports->>Evaluator: Kiểm tra @ConditionalOnMissingBean (Dev đã tự viết bean chưa?)
        alt Dev chưa khai báo bean
            Evaluator-->>Imports: Điều kiện thỏa mãn
            Imports->>Context: Đăng ký BeanDefinition mặc định vào Context
        else Dev đã tự viết Custom Bean
            Evaluator-->>Imports: Lùi bước (Back-off) - Nhường chỗ cho Bean của Dev
        end
    end
    Context-->>App: Embedded Tomcat khởi động & Sẵn sàng nhận request
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### Ma trận Tra Cứu Bộ Tứ Annotation @Conditional Cốt Lõi

| Annotation | Cơ chế kiểm tra | Kịch bản thực tế trong E-Commerce |
|---|---|---|
| \`@ConditionalOnClass(X.class)\` | Dùng ClassLoader kiểm tra class X có trong classpath không | Chỉ kích hoạt Kafka Producer nếu project có kéo thư viện \`spring-kafka\` |
| \`@ConditionalOnMissingBean(X.class)\` | Kiểm tra Container xem đã có bean loại X chưa | Tạo \`DefaultPaymentProcessor\`, nhưng nếu dev tự tạo \`CustomPaymentProcessor\` thì bean mặc định tự động nhường bước |
| \`@ConditionalOnProperty(...)\` | Đọc giá trị cấu hình trong \`application.yml\` | Cho phép bật/tắt tính năng thanh toán quốc tế qua cờ \`app.payment.international.enabled=true\` |
| \`@ConditionalOnWebApplication\` | Kiểm tra ứng dụng có chạy Web Servlet (Tomcat) không | Chỉ đăng ký các Web Filter khi chạy API Web, không nạp khi chạy job Batch CLI |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là một lớp Auto-Configuration chuẩn sản xuất cho module Cổng Thanh Toán E-Commerce:

\`\`\`java
package vn.mastery.ecommerce.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import vn.mastery.ecommerce.payment.PaymentGateway;
import vn.mastery.ecommerce.payment.VNPayPaymentGateway;

@AutoConfiguration
@ConditionalOnClass(name = "com.vnpay.merchant.VNPayClient")
@ConditionalOnProperty(prefix = "ecommerce.payment", name = "provider", havingValue = "vnpay", matchIfMissing = true)
@EnableConfigurationProperties(PaymentProperties.class)
public class PaymentAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(PaymentGateway.class)
    public PaymentGateway vnpayPaymentGateway(PaymentProperties properties) {
        return new VNPayPaymentGateway(properties.getMerchantId(), properties.getSecretKey());
    }
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Spring |
|---|---|---|---|
| Dòng 11 | \`@AutoConfiguration\` | Annotation chuẩn của Spring Boot 3 thay cho \`@Configuration\` | Đánh dấu class là AutoConfiguration nạp sau cùng, hỗ trợ GraalVM AOT native |
| Dòng 12 | \`@ConditionalOnClass(...)\` | Kiểm tra class SDK VNPay có tồn tại trong classpath | Nếu dev không add SDK VNPay vào pom.xml, Spring lập tức bỏ qua toàn bộ class này |
| Dòng 13 | \`@ConditionalOnProperty(...)\` | Đọc cờ cấu hình trong \`application.yml\` | Chỉ chạy khi \`ecommerce.payment.provider=vnpay\` hoặc khi dev chưa cấu hình gì (\`matchIfMissing = true\`) |
| Dòng 14 | \`@EnableConfigurationProperties(...)\` | Kích hoạt nạp bean cấu hình Type-Safe | Đọc các thuộc tính \`merchantId\`, \`secretKey\` vào đối tượng Java an toàn |
| Dòng 18 | \`@ConditionalOnMissingBean(...)\` | Quy tắc vàng Back-off | Nếu dev đã tự viết \`@Bean public PaymentGateway customGateway()\` thì bean mặc định này sẽ **KHÔNG ĐƯỢC TẠO** |
| Dòng 19-21 | \`public PaymentGateway vnpayPaymentGateway(...)\` | Khởi tạo bean mặc định | Trả về instance của \`VNPayPaymentGateway\` đăng ký vào Spring Context |

---

## 4. Cạm bẫy thực tế & Best Practices (Senior Trap Guide)

:::danger CẠM BẪY CHẾT NGƯỜI: ĐẶT @ConditionalOnMissingBean SAI VỊ TRÍ
- **Lỗi phổ biến**: Đặt \`@ConditionalOnMissingBean\` trên một class \`@Configuration\` thông thường do bạn tự viết trong ứng dụng.
- **Hậu quả**: Các class \`@Configuration\` của người dùng được Spring quét và xử lý **TRƯỚC TIÊN**. Tại thời điểm đó, chưa có bean nào được tạo nên điều kiện \`@ConditionalOnMissingBean\` luôn luôn đúng! Sau đó khi Starter chạy tới, nó lại thấy bean đã tồn tại -> Trật tự nạp bean bị đảo lộn ngẫu nhiên gây lỗi khó debug nhất hệ mặt trời.
- **Quy tắc sống còn**: \`@ConditionalOnMissingBean\` **CHỈ DÀNH RIÊNG** cho các class AutoConfiguration trong Custom Starter (chạy sau cùng).
:::
`;
}

// Refactor Lesson 1-2-2
const l122 = m1.lessons.find(l => l.id === "1-2-2");
if (l122) {
  l122.title = "Bài 1.2.2: Xây dựng Custom Spring Boot Starter Sản Xuất với AutoConfiguration";
  l122.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu kiến trúc phân tách 2 module chuẩn Maven cấp doanh nghiệp: \`my-spring-boot-starter\` và \`my-spring-boot-autoconfigure\`.
- Tự tay viết một Custom Starter: \`enterprise-audit-spring-boot-starter\` tự động ghi log giao dịch E-Commerce.
- Đăng ký SPI chuẩn Spring Boot 3 bằng file \`META-INF/spring/...AutoConfiguration.imports\`.
- Đọc hiểu toàn bộ mã nguồn đóng gói starter qua Bảng phân tích từng dòng code chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: Ổ CẮM ĐIỆN ĐA NĂNG
Bạn đi du lịch quốc tế:
- **Nếu không có Starter**: Đến mỗi quốc gia, bạn phải tự đi mua từng chiếc phích cắm, tự cắt dây điện thoại, tự đấu nối nguy hiểm.
- **Khi có Custom Starter**: Bạn mang theo một **Ổ cắm điện đa năng thông minh**: Cắm vào ổ nào cũng tự nhận điện áp (220V hay 110V), tự bảo vệ quá tải.
- Trong dự án doanh nghiệp, Custom Starter là gói thư viện dùng chung cho 20 microservices: Chỉ cần thêm 1 dòng dependency vào \`pom.xml\`, toàn bộ cấu hình Audit, Bảo mật, Logging tự động hoạt động hoàn hảo!
:::

---

## 1. Cái này là gì? (Kiến trúc 2 Module Chuẩn Doanh Nghiệp)

Một Custom Starter chuẩn Enterprise luôn phân tách làm 2 module:
1. \`enterprise-audit-spring-boot-autoconfigure\`: Chứa toàn bộ code logic, ConfigurationProperties, Filter, Service và AutoConfiguration class.
2. \`enterprise-audit-spring-boot-starter\`: Module rỗng (chỉ chứa file \`pom.xml\`) gom nhóm các dependency để người dùng chỉ cần import 1 dòng duy nhất.

### Sơ Đồ Kiến Trúc: Đóng Gói Custom Starter E-Commerce Audit

\`\`\`mermaid
flowchart TD
    ClientApp["ecommerce-order-service (Ứng dụng Đặt Hàng)"]
    
    subgraph StarterModule ["enterprise-audit-spring-boot-starter"]
        StarterPOM["pom.xml (Chỉ kéo dependency, không chứa code)"]
    end

    subgraph AutoConfModule ["enterprise-audit-spring-boot-autoconfigure"]
        AutoConfClass["AuditAutoConfiguration.java (@AutoConfiguration)"]
        Properties["AuditProperties.java (@ConfigurationProperties)"]
        ServiceLogic["AuditLoggingService.java (Ghi log JSON / Kafka)"]
        ImportsFile["META-INF/spring/<br/>org.springframework.boot.autoconfigure.AutoConfiguration.imports"]
    end

    ClientApp -->|1 dòng dependency pom.xml| StarterPOM
    StarterPOM --> AutoConfModule
    AutoConfClass --> Properties
    AutoConfClass --> ServiceLogic
    AutoConfClass -.-> ImportsFile

    style ClientApp fill:#1e3a8a,stroke:#3b82f6,color:#fff
    style AutoConfModule fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### Lợi ích sống còn của Custom Starter trong Hệ thống Microservices

| Vấn đề khi KHÔNG có Starter | Giải pháp với Custom Spring Boot Starter |
|---|---|
| 20 microservices copy-paste hàng trăm dòng cấu hình Audit Logging giống hệt nhau | Chỉ cần 1 dòng dependency trong \`pom.xml\`, tất cả service đều có Audit chuẩn ngân hàng |
| Khi cần sửa format log hoặc đổi từ Console sang Kafka, phải sửa 20 repositories khác nhau | Chỉ cần cập nhật version Starter trong 1 repo duy nhất, toàn bộ hệ thống được nâng cấp |
| Lập trình viên mới vào dự án dễ quên cấu hình MDC TraceId làm mất dấu request | Starter tự động kích hoạt Filter ghi nhận Trace ID trên mọi HTTP request |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là mã nguồn cốt lõi của Custom Starter ghi nhận lịch sử giao dịch:

\`\`\`java
package com.enterprise.audit.autoconfigure;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

public interface AuditService {
    void logAction(String userId, String action, String resourceId);
}

class ConsoleAuditService implements AuditService {
    public void logAction(String userId, String action, String resourceId) {
        System.out.println("[AUDIT LOG] User: " + userId + " | Action: " + action + " | Resource: " + resourceId);
    }
}

@AutoConfiguration
@ConditionalOnProperty(prefix = "enterprise.audit", name = "enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(AuditProperties.class)
public class AuditAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(AuditService.class)
    public AuditService auditService() {
        return new ConsoleAuditService();
    }
}
\`\`\`

### Tệp đăng ký SPI chuẩn Spring Boot 3:
Đường dẫn: \`src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports\`
Nội dung:
\`\`\`text
com.enterprise.audit.autoconfigure.AuditAutoConfiguration
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Spring |
|---|---|---|---|
| Dòng 10-12 | \`public interface AuditService\` | Interface hợp đồng (Contract) dùng chung | Định nghĩa hành vi ghi log kiểm toán độc lập với nơi lưu trữ |
| Dòng 14-18 | \`class ConsoleAuditService\` | Implementation mặc định ghi ra Console | Cung cấp sẵn giải pháp fallback nếu dự án không cài đặt Kafka hay Elasticsearch |
| Dòng 20 | \`@AutoConfiguration\` | Annotation nhận diện AutoConfiguration của Spring Boot 3 | Cho phép nạp tự động qua file \`AutoConfiguration.imports\` |
| Dòng 21 | \`@ConditionalOnProperty(...)\` | Kiểm tra cờ \`enterprise.audit.enabled\` | Cho phép người dùng tắt toàn bộ tính năng này bằng cách đặt \`enabled: false\` |
| Dòng 25 | \`@ConditionalOnMissingBean(AuditService.class)\` | Cho phép override tùy biến | Nếu microservice viết một \`KafkaAuditService\`, bean mặc định tự động rút lui |

---

## 4. Cạm bẫy thực tế & Best Practices (Senior Trap Guide)

:::danger LỖI NÂNG CẤP TỪ SPRING BOOT 2 SANG SPRING BOOT 3
- Trong Spring Boot 2.x, danh sách Starter nằm trong file \`META-INF/spring.factories\`.
- Trong Spring Boot 3.x, Spring **BỎ QUA HOÀN TOÀN** file \`spring.factories\` cho Auto-Configuration!
- Bắt buộc phải chuyển sang file:
  \`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports\`.
- Nếu để sai đường dẫn này, Starter của bạn sẽ hoàn toàn "tàng hình" và không có bất kỳ bean nào được nạp!
:::
`;
}

// Refactor Lesson 1-2-3
const l123 = m1.lessons.find(l => l.id === "1-2-3");
if (l123) {
  l123.title = "Bài 1.2.3: Cạm bẫy Thứ tự Nạp AutoConfiguration, Sai Lệch Điều Kiện @Conditional & Đè Bean";
  l123.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nhận diện 3 sự cố sản xuất kinh điển: Classpath Pollution, MatchIfMissing sai, và Xung đột thứ tự nạp bean.
- Hiểu cơ chế \`@AutoConfigureBefore\`, \`@AutoConfigureAfter\`, và phân biệt vì sao \`@AutoConfigureOrder\` không có tác dụng với User Configuration.
- Phân tích mã nguồn cấu hình phòng chống lỗi và Bảng giải mã từng dòng code.
- Nắm vững quy trình debug bằng cờ \`--debug\` (Positive and Negative Condition Evaluation Report).
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: XẾP HÀNG MUA VÉ XEM PHIM
**Thứ tự ưu tiên nạp cấu hình trong Spring Boot:**
1. **Khách VIP có vé mời (User Configuration do bạn tự viết)**: Luôn luôn được vào cửa đầu tiên, không cần xếp hàng! Spring ưu tiên tuyệt đối mọi bean do lập trình viên khai báo.
2. **Khách mua vé phổ thông (AutoConfiguration của Spring Boot & Starters)**: Chỉ được phục vụ SAU KHI khách VIP đã vào hết chỗ.
=> **Quy tắc sống còn**: Bạn không thể dùng \`@Order\` hay \`@AutoConfigureOrder\` để ép khách phổ thông chen lấn lên trước khách VIP được!
:::

---

## 1. Cái này là gì? (Bản chất xung đột Thứ tự Cấu hình)

Khi nhiều thư viện AutoConfiguration cùng chạy, nếu Cấu hình A cần sử dụng Bean do Cấu hình B sinh ra (ví dụ: \`TransactionManager\` cần \`DataSource\`), nhưng A lại chạy trước B, điều kiện \`@ConditionalOnBean(DataSource.class)\` tại A sẽ kiểm tra thất bại và bỏ qua toàn bộ cấu hình.

### Sơ Đồ Luồng: Thứ Tự Ưu Tiên Nạp Bean & Tránh Xung Đột

\`\`\`mermaid
flowchart TD
    Start["Khởi Động Nạp Cấu Hình Spring Boot"] --> Step1["1. Quét Toàn Bộ User Beans (@ComponentScan / @Configuration)<br/>⭐ ƯU TIÊN TUYỆT ĐỐI CAO NHẤT"]
    Step1 --> Step2["2. Đánh Giá Các Custom AutoConfiguration (@AutoConfigureBefore)"]
    Step2 --> Step3["3. Đánh Giá Framework AutoConfiguration Mặc Định (DataSource, WebMvc)"]
    Step3 --> Step4["4. Kích Hoạt @ConditionalOnMissingBean (Lấp đầy chỗ trống)"]
    Step4 --> End["Toàn Bộ Bean Khởi Tạo Xong Ổn Định"]

    subgraph Bug ["CẠM BẪY SẢN XUẤT: Thứ Tự Nạp Sai"]
        A_Bad["AutoConfig A cần Bean B"] -->|Chạy trước| B_Bad["AutoConfig B chưa kịp chạy"]
        A_Bad -.-> Crash["ConditionalOnBean thất bại -> Mất Bean lúc runtime!"]
    end

    style Step1 fill:#064e3b,stroke:#10b981,color:#fff
    style Bug fill:#7c2d12,stroke:#f97316,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### 3 Cạm bẫy thực chiến & Cách khắc phục chuẩn Senior

| Tên cạm bẫy | Hiện tượng lỗi | Nguyên nhân gốc rễ | Giải pháp chuẩn Senior |
|---|---|---|---|
| **Classpath Pollution** | Ứng dụng tự nhiên hỏi mật khẩu HTTP 401 | Kéo nhầm 1 thư viện phụ kéo theo \`spring-boot-starter-security\` | Dùng \`mvn dependency:tree\` tìm và đặt thẻ \`<exclusions>\` |
| **Sai cờ \`matchIfMissing\`** | Crash khi deploy lên môi trường Staging | Đặt \`matchIfMissing = false\` cho cấu hình bắt buộc | Đặt giá trị mặc định an toàn hoặc ném thông báo lỗi rõ ràng |
| **Lỗi NoClassDefFoundError** | JVM sập trước khi Spring kịp kiểm tra điều kiện | Khai báo trực tiếp class literal trong \`@ConditionalOnClass(X.class)\` | Dùng String literal \`@ConditionalOnClass(name = "...")\` |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Mã nguồn dưới đây minh họa cách điều phối thứ tự nạp AutoConfiguration chuẩn xác và an toàn:

\`\`\`java
package vn.mastery.ecommerce.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.AutoConfigureAfter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.context.annotation.Bean;
import javax.sql.DataSource;

@AutoConfiguration
@AutoConfigureAfter(DataSourceAutoConfiguration.class)
@ConditionalOnClass(name = "org.postgresql.Driver")
@ConditionalOnBean(DataSource.class)
public class DatabaseAuditAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(name = "databaseAuditRecorder")
    public DatabaseAuditRecorder databaseAuditRecorder(DataSource dataSource) {
        return new DatabaseAuditRecorder(dataSource);
    }
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Spring |
|---|---|---|---|
| Dòng 12 | \`@AutoConfigureAfter(DataSourceAutoConfiguration.class)\` | Ép buộc thứ tự chạy sau cấu hình DataSource | Đảm bảo \`DataSourceAutoConfiguration\` đã tạo xong \`DataSource\` rồi mới chạy class này |
| Dòng 13 | \`@ConditionalOnClass(name = "...Driver")\` | Sử dụng String FQN thay vì class literal | Ngăn chặn lỗi \`NoClassDefFoundError\` khi chạy ở môi trường không có driver PostgreSQL |
| Dòng 14 | \`@ConditionalOnBean(DataSource.class)\` | Chỉ chạy nếu bean DataSource đã tồn tại trong Context | Bảo đảm an toàn 100%, không bị crash do thiếu dependency |
| Dòng 18-21 | \`public DatabaseAuditRecorder ...\` | Khởi tạo bean với DataSource được inject | Nhận DataSource sẵn sàng và tạo recorder ghi log giao dịch vào bảng DB |

---

## 4. Công cụ cứu sinh: Debug Auto-Configuration Report

Khi một bean bí ẩn bị mất hoặc bị ghi đè, đừng đoán mò! Hãy chạy ứng dụng với cờ:
\`\`\`bash
java -jar app.jar --debug
\`\`\`
Spring Boot sẽ in ra **CONDITIONS EVALUATION REPORT**:
- **Positive matches**: Danh sách các cấu hình thỏa mãn điều kiện và đã được nạp thành công.
- **Negative matches**: Danh sách các cấu hình bị từ chối kèm lý do chính xác (ví dụ: \`@ConditionalOnClass did not find com.vnpay.Client\`).
- **Exclusions**: Các cấu hình bị loại trừ thủ công.
`;
}

// Refactor Lesson 1-2-4
const l124 = m1.lessons.find(l => l.id === "1-2-4");
if (l124) {
  l124.title = "Bài 1.2.4: Milestone Synthesis: Cỗ Máy Auto-Configuration & Custom Starters";
  l124.content = `
:::target 🎯 MỤC TIÊU BÀI TỔNG HỢP MILESTONE (10 PHÚT)
- Khái quát toàn bộ dòng chảy đánh giá điều kiện Auto-Configuration của Spring Boot 3.
- Nắm chắc Ma trận Quyết định Công nghệ: Khi nào nên tự viết Custom Starter cho doanh nghiệp.
- Làm chủ toàn bộ mã nguồn \`DynamicStorageAutoConfiguration\` (hỗ trợ chuyển đổi giữa Local Disk và AWS S3 Cloud không cần sửa code).
- Đọc hiểu 100% từng dòng code qua Bảng phân tích chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BĂNG CHUYỀN ĐÓNG GÓI TỰ ĐỘNG
Hãy hình dung hệ thống lưu trữ file hóa đơn E-Commerce:
- Khi chạy ở máy tính lập trình viên (Local/Dev): Không có internet, không có AWS S3 -> Hệ thống tự động kích hoạt **Hộp lưu trữ đĩa cứng cục bộ (Local Disk Storage)**.
- Khi deploy lên Cloud AWS Production: Có cấu hình S3 Bucket -> Hệ thống tự động ngắt Local Disk và chuyển sang **Kho lưu trữ đám mây AWS S3** mà lập trình viên **không cần sửa một dòng code nghiệp vụ nào**!
:::

---

## 1. Cái này là gì? (Bản đồ Dòng chảy Quyết định Auto-Configuration)

### Sơ Đồ Kiến Trúc: Chuỗi Nạp Điều Kiện Auto-Configuration (Spring Boot 3)

\`\`\`mermaid
flowchart TD
    BootRun["SpringApplication.run()"] --> ReadMeta["Đọc file: META-INF/spring/<br/>org.springframework.boot.autoconfigure.AutoConfiguration.imports"]
    ReadMeta --> FilterCandidates["Nạp Danh Sách Candidate AutoConfigurations"]
    
    subgraph ConditionChecks ["Bộ Thẩm Định Điều Kiện (Condition Evaluation)"]
        FilterCandidates --> CondClass["@ConditionalOnClass: Thư viện có trong Classpath không?"]
        CondClass -- YES --> CondProp["@ConditionalOnProperty: Cờ cấu hình có bật không?"]
        CondProp -- YES --> CondMissing["@ConditionalOnMissingBean: Dev đã tự khai bean chưa?"]
    end

    CondMissing -- "CHƯA CÓ BEAN" --> RegisterBean["Đăng Ký Default Bean Của Starter Vào Context"]
    CondMissing -- "ĐÃ CÓ BEAN" --> BackOff["Back-off: Nhường quyền ưu tiên cho Bean của Dev"]
    CondClass -- NO --> Skip["Bỏ Qua Toàn Bộ Cấu Hình"]
    CondProp -- NO --> Skip

    style ConditionChecks fill:#1e3a8a,stroke:#3b82f6,color:#fff
    style RegisterBean fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Ma trận Quyết định Công nghệ)

### Bảng Ma Trận: Khi Nào Nên Tự Viết Custom Starter?

| Bối cảnh dự án | Tự Viết Custom Starter | Dùng Thư Viện @Configuration Chung | Khai Báo Thủ Công Từng App |
|---|---|---|---|
| **Số lượng microservices** | $\\ge 5$ dịch vụ dùng chung hạ tầng | 2 - 4 dịch vụ trong cùng 1 team | 1 ứng dụng đơn lẻ duy nhất |
| **Thay đổi cấu hình** | Tự động hóa 100% qua \`application.yml\` | Cần import bằng tay class cấu hình | Phải copy-paste mã nguồn |
| **Bảo trì & Nâng cấp** | Nâng cấp 1 nơi, tất cả service kế thừa | Cập nhật file library, recompile | Tốn hàng tuần sửa từng project |
| **Ví dụ thực tế** | Common Security SDK, Audit, Payment Client | Utility helpers dùng chung | Cấu hình database riêng của 1 app |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là mã nguồn tổng hợp của một Starter Lưu Trữ Đa Môi Trường (Local Disk vs AWS S3):

\`\`\`java
package vn.mastery.ecommerce.storage;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

public interface StorageService {
    String storeFile(String filename, byte[] content);
}

class LocalDiskStorageService implements StorageService {
    public String storeFile(String filename, byte[] content) {
        return "/var/data/uploads/" + filename;
    }
}

class S3CloudStorageService implements StorageService {
    public String storeFile(String filename, byte[] content) {
        return "https://s3.ap-southeast-1.amazonaws.com/my-bucket/" + filename;
    }
}

@AutoConfiguration
@EnableConfigurationProperties(StorageProperties.class)
public class DynamicStorageAutoConfiguration {

    @Bean
    @ConditionalOnProperty(prefix = "app.storage", name = "provider", havingValue = "local", matchIfMissing = true)
    @ConditionalOnMissingBean(StorageService.class)
    public StorageService localStorageService() {
        return new LocalDiskStorageService();
    }

    @Bean
    @ConditionalOnProperty(prefix = "app.storage", name = "provider", havingValue = "s3")
    @ConditionalOnMissingBean(StorageService.class)
    public StorageService s3StorageService() {
        return new S3CloudStorageService();
    }
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Spring |
|---|---|---|---|
| Dòng 10-12 | \`public interface StorageService\` | Hợp đồng giao tiếp lưu trữ file | Các service nghiệp vụ chỉ gọi interface này, không quan tâm lưu ở local hay S3 |
| Dòng 14-24 | \`LocalDiskStorageService\` & \`S3CloudStorageService\` | 2 implementation riêng biệt | Một bên ghi file vào ổ cứng local, một bên upload stream lên S3 Cloud |
| Dòng 26 | \`@AutoConfiguration\` | Đánh dấu class cấu hình tự động Spring Boot 3 | Đăng ký trong file \`AutoConfiguration.imports\` |
| Dòng 30 | \`@ConditionalOnProperty(..., havingValue = "local", matchIfMissing = true)\` | Nhánh Local Storage | Kích hoạt khi cấu hình là \`local\` HOẶC khi dev không cấu hình gì (môi trường dev cục bộ) |
| Dòng 37 | \`@ConditionalOnProperty(..., havingValue = "s3")\` | Nhánh AWS S3 Storage | Kích hoạt khi môi trường Production khai báo \`app.storage.provider: s3\` |
| Dòng 31, 38 | \`@ConditionalOnMissingBean(StorageService.class)\` | Cho phép tự do override | Nếu dev tự tạo bean \`MinIOStorageService\`, cả 2 bean mặc định trên đều lùi bước |

---

## 4. Key Takeaways & Nguyên Tắc Sống Còn (Senior Architect Summary)

1. **Chuẩn Spring Boot 3**: Tuyệt đối không dùng \`META-INF/spring.factories\` cho AutoConfiguration nữa. Bắt buộc phải đặt tên FQN trong \`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports\`.
2. **Quy tắc Back-off an toàn**: Mọi bean mặc định trong Starter phải gắn \`@ConditionalOnMissingBean\` để developer có thể override bất kỳ lúc nào mà không sợ conflict.
3. **Tách biệt Starter và Autoconfigure**: Chuẩn Maven enterprise chia làm 2 module: \`my-starter\` (chỉ chứa dependency pom) và \`my-spring-boot-autoconfigure\` (chứa code cấu hình).
`;
}

// Serialize back to file
const outContent = `/* MODULE 1 — Spring Core & Boot căn bản (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n` + JSON.stringify(m1, null, 2) + `\n);\n`;

fs.writeFileSync(modulePath, outContent, "utf8");
console.log("Successfully refactored Module 1 Topic 2 (Lessons 1-2-1, 1-2-2, 1-2-3, 1-2-4)!");
