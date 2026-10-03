/* MODULE 1 — Spring Core & Spring Boot căn bản */
window.COURSE_MODULES = window.COURSE_MODULES || [];
window.COURSE_MODULES.push({
  id: 1,
  title: "Spring Core & Boot căn bản",
  subtitle: "IoC, DI, Beans, Auto-config",
  icon: "🌱",
  desc: "Hiểu bản chất IoC/DI, bean lifecycle, auto-configuration — trái tim của Spring.",
  lessons: [
    {
      id: "1-1",
      type: "lesson",
      title: "IoC & Dependency Injection — trái tim Spring Container",
      minutes: 50,
      content: `
## Vấn đề sống còn: Tight Coupling giết chết khả năng mở rộng

Hãy tưởng tượng bạn đang viết code xử lý thanh toán cho hệ thống thương mại điện tử:

~~~java
// ❌ Cực kỳ nguy hiểm: Mọi thứ tự "new", gắn chặt vào implementation cứng
public class OrderCheckoutService {
    private final EmailService emailService = new EmailService();
    private final VNPayGateway paymentGateway = new VNPayGateway("KEY_PROD_123");
    private final JdbcOrderRepository orderRepo = new JdbcOrderRepository(
        DriverManager.getConnection("jdbc:postgresql://localhost:5432/db")
    );

    public void checkout(Order order) {
        orderRepo.save(order);
        paymentGateway.charge(order.getTotal());
        emailService.sendReceipt(order);
    }
}
~~~

Hậu quả tai hại của đoạn code trên trong môi trường doanh nghiệp:
1. **Không thể Unit Test độc lập**: Mỗi lần test <code>checkout()</code>, hệ thống sẽ kết nối thẳng vào database PostgreSQL thật và trừ tiền thật qua cổng VNPay.
2. **Vi phạm nguyên lý OCP (Open-Closed Principle)**: Khi công ty muốn tích hợp thêm ví MoMo hoặc ZaloPay, bạn buộc phải sửa nát mã nguồn của <code>OrderCheckoutService</code>.
3. **Quản lý tài nguyên hỗn loạn**: Mỗi service tự <code>new</code> kết nối database riêng dẫn tới cạn kiệt Connection Pool của hệ thống.

---

## 1. Cơ chế ngầm: Inversion of Control & ApplicationContext Pipeline

**Inversion of Control (IoC - Đảo ngược điều khiển)**: Bạn không tự <code>new</code> đối tượng nữa. Quyền khởi tạo, định cấu hình và quản lý vòng đời của đối tượng được trao toàn quyền cho **Spring IoC Container**.

~~~text
+---------------------------------------------------------------------------------+
|                       VÒNG ĐỜI NẠP BEAN TRONG SPRING BOOT                       |
+---------------------------------------------------------------------------------+
[1. Quét Class]      Quét @Component, @Service, @Configuration trong base package
        │
[2. BeanDefinition]  Spring phân tích metadata (Class name, Scope, Lazy, Autowire)
        │            Lưu vào BeanDefinitionRegistry (chưa tạo object thật)
        │
[3. BFPP]            BeanFactoryPostProcessor: Đọc properties, giải mã placeholder
        │
[4. Instantiation]   Spring dùng Reflection gọi Constructor phù hợp để tạo Object
        │
[5. Populate Bean]   Dependency Injection: Tiêm các dependency vào instance
        │
[6. Aware Callbacks] Inject BeanNameAware, ApplicationContextAware (nếu có)
        │
[7. BPP (Before)]    BeanPostProcessor: postProcessBeforeInitialization()
        │
[8. Init Hooks]      Gọi @PostConstruct -> InitializingBean.afterPropertiesSet()
        │
[9. BPP (After)]     BeanPostProcessor: Bọc Dynamic Proxy (CGLIB/JDK Proxy) cho AOP
        │
[10. READY]          Đưa vào DefaultSingletonBeanRegistry -> Phục vụ ứng dụng
+---------------------------------------------------------------------------------+
~~~

:::tip BEANFACTORY VS APPLICATIONCONTEXT
<code>BeanFactory</code> là container cấp thấp nhất, chỉ hỗ trợ DI cơ bản và lazy-loading bean.
<code>ApplicationContext</code> là container cấp cao (kế thừa BeanFactory) mà Spring Boot sử dụng, tích hợp thêm: Internationalization (i18n), Event Publishing, Environment Profiles, và tự động eager-load toàn bộ Singleton beans ngay khi khởi động để phát hiện lỗi sớm (fail-fast).
:::

## 2. Ba kiểu Dependency Injection — Tại sao Constructor là vị vua tuyệt đối?

| Kiểu Injection | Cú pháp | Đánh giá kiến trúc |
|---|---|---|
| **Constructor Injection** | Khai báo <code>final</code> field + constructor | ⭐ **Khuyên dùng 100%**: Bất biến (Immutable), an toàn đa luồng, compiler ép truyền đủ dependency khi unit test |
| **Setter Injection** | <code>@Autowired</code> trên setter method | Chỉ dùng khi dependency là tùy chọn (optional) hoặc có thể thay đổi lúc runtime |
| **Field Injection** | <code>@Autowired private Service x;</code> | ❌ **Cấm dùng trong dự án lớn**: Ẩn giấu dependency, NPE khi new thủ công trong test, vi phạm Single Responsibility |

~~~java
// ✅ CHUẨN PRODUCTION: Constructor Injection kết hợp final fields
@Service
public class OrderCheckoutService {

    private final PaymentProcessor paymentProcessor;
    private final NotificationService notificationService;
    private final OrderRepository orderRepository;

    // Từ Spring 4.3+, class có 1 constructor DUY NHẤT không cần viết @Autowired
    public OrderCheckoutService(PaymentProcessor paymentProcessor,
                                NotificationService notificationService,
                                OrderRepository orderRepository) {
        this.paymentProcessor = paymentProcessor;
        this.notificationService = notificationService;
        this.orderRepository = orderRepository;
    }
}
~~~

## 3. Code thực chiến hoàn chỉnh: Xử lý đa cổng thanh toán

Trong thực tế, một interface thường có nhiều class triển khai (Implementation). Spring giải quyết xung đột bằng <code>@Primary</code> và <code>@Qualifier</code>:

### Interface và các Implementation:

~~~java
package vn.mastery.payment;

import java.math.BigDecimal;

public interface PaymentProcessor {
    PaymentResult charge(String orderId, BigDecimal amount);
    String getProviderName();
}

public record PaymentResult(boolean success, String transactionId, String message) {}
~~~

~~~java
package vn.mastery.payment.impl;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import vn.mastery.payment.*;
import java.math.BigDecimal;
import java.util.UUID;

@Component("vnpayProcessor")
public class VNPayPaymentProcessor implements PaymentProcessor {
    @Override
    public PaymentResult charge(String orderId, BigDecimal amount) {
        // Giả lập gọi cổng VNPay
        return new PaymentResult(true, "VNP-" + UUID.randomUUID(), "Thanh toán VNPay thành công");
    }

    @Override
    public String getProviderName() { return "VNPAY"; }
}

@Component("momoProcessor")
@Primary // Mặc định ưu tiên nếu không chỉ định rõ
public class MomoPaymentProcessor implements PaymentProcessor {
    @Override
    public PaymentResult charge(String orderId, BigDecimal amount) {
        // Giả lập gọi cổng MoMo
        return new PaymentResult(true, "MOMO-" + UUID.randomUUID(), "Thanh toán MoMo thành công");
    }

    @Override
    public String getProviderName() { return "MOMO"; }
}
~~~

### Service sử dụng linh hoạt:

~~~java
package vn.mastery.service;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import vn.mastery.payment.*;
import java.math.BigDecimal;

@Service
public class CheckoutService {

    private final PaymentProcessor defaultProcessor;  // Sẽ inject MomoPaymentProcessor (@Primary)
    private final PaymentProcessor specificProcessor; // Sẽ inject VNPayPaymentProcessor (@Qualifier)

    public CheckoutService(PaymentProcessor defaultProcessor,
                           @Qualifier("vnpayProcessor") PaymentProcessor specificProcessor) {
        this.defaultProcessor = defaultProcessor;
        this.specificProcessor = specificProcessor;
    }

    public PaymentResult processOrder(String orderId, BigDecimal amount, boolean useVnPay) {
        if (useVnPay) {
            return specificProcessor.charge(orderId, amount);
        }
        return defaultProcessor.charge(orderId, amount);
    }
}
~~~

## 4. Đào sâu Bean Scopes & Cạm bẫy "Prototype trong Singleton"

Spring hỗ trợ 6 loại scope:
1. <code>singleton</code> (Mặc định): Duy nhất 1 instance trên toàn bộ Spring Container (ApplicationContext).
2. <code>prototype</code>: Mỗi lần được inject hoặc gọi <code>getBean()</code> là một instance hoàn toàn mới.
3. <code>request</code>, <code>session</code>, <code>application</code>, <code>websocket</code>: Dành riêng cho ứng dụng Web.

:::danger CẠM BẪY CHẾT NGƯỜI: INJECT PROTOTYPE VÀO SINGLETON
Một bean Singleton (như <code>OrderService</code>) chỉ được Spring khởi tạo **ĐÚNG 1 LẦN** lúc startup.
Nếu bạn inject một bean Prototype (như <code>ReportBuilder</code>) vào Singleton qua Constructor, bean Prototype đó cũng chỉ được inject **1 LẦN DUY NHẤT**!
Kết quả: Prototype bị "đóng băng" thành Singleton, dữ liệu request trước tích tụ sang request sau gây sai lệch nghiêm trọng!
:::

### 3 cách giải quyết chuẩn kỹ thuật:

~~~java
// CÁCH 1 (Khuyên dùng): Dùng ObjectProvider<T> — Lazy retrieval
@Service
public class ReportScheduler {
    private final ObjectProvider<ReportBuilder> reportBuilderProvider;

    public ReportScheduler(ObjectProvider<ReportBuilder> reportBuilderProvider) {
        this.reportBuilderProvider = reportBuilderProvider;
    }

    public void runDailyReport() {
        // Mỗi lần gọi getObject() sẽ yêu cầu Container sinh ra instance Prototype mới tinh!
        ReportBuilder builder = reportBuilderProvider.getObject();
        builder.buildAndExport();
    }
}

// CÁCH 2: Dùng @Lookup Method Injection
@Service
public abstract class InvoiceManager {
    public void generateInvoice() {
        InvoiceBuilder builder = getInvoiceBuilder(); // Spring CGLIB override method này
        builder.render();
    }

    @Lookup
    protected abstract InvoiceBuilder getInvoiceBuilder();
}

// CÁCH 3: Scoped Proxy trên bean Prototype
@Component
@Scope(value = ConfigurableBeanFactory.SCOPE_PROTOTYPE, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class RequestSessionContext {
    // Spring tạo proxy CGLIB bọc ngoài, mỗi method call sẽ resolve instance theo thread/context
}
~~~

## 5. Cạm bẫy Circular Dependencies (Vòng tròn phụ thuộc)

Điều gì xảy ra khi Service A cần Service B, và Service B lại cần Service A qua Constructor?

~~~text
┌─────────────────┐       injects       ┌─────────────────┐
│   OrderService  │ ──────────────────> │  PaymentService │
└─────────────────┘                     └─────────────────┘
         ^                                       │
         └───────────────────────────────────────┘
                        injects
~~~

Lúc này, Spring Container không thể quyết định tạo class nào trước. Kết quả: ứng dụng **CRASH NGAY LẬP TỨC** khi khởi động:
<code>BeanCurrentlyInCreationException: Error creating bean with name 'orderService'... requested bean is currently in creation</code>

:::warn CƠ CHẾ BẢO VỆ TỪ SPRING BOOT 2.6+
Từ Spring Boot 2.6 trở lên, tính năng cho phép Circular Dependency **mặc định bị TẮT HOÀN TOÀN**.
Đừng bao giờ bật <code>spring.main.allow-circular-references=true</code> để che giấu lỗi! Đó là "mùi hôi của code" (Code Smell).
Hãy tái cấu trúc bằng 1 trong 2 cách:
1. **Tách class**: Đưa logic phụ thuộc chung sang một Service thứ 3 (ví dụ: <code>OrderPaymentOrchestrator</code>).
2. **Dùng Spring ApplicationEvent**: Khi Order hoàn thành, bắn ra <code>OrderCreatedEvent</code>; <code>PaymentService</code> lắng nghe event này mà không cần inject trực tiếp <code>OrderService</code>.
:::

## 6. Bài tập thực hành thử thách (Hands-on Challenge)

### Đề bài:
Hệ thống cần ghi nhận vết kiểm toán tác vụ (Audit Trail). Hãy thiết kế:
1. Interface <code>AuditContext</code> với scope <code>prototype</code> chứa danh sách các bước thao tác (<code>List<String> actions</code>).
2. Bean Singleton <code>AuditManager</code> có method <code>recordUserAction(String userId, String action)</code>. Đảm bảo mỗi user session độc lập không bị dính vết của user khác.
3. Sử dụng <code>@PostConstruct</code> và <code>@PreDestroy</code> để log thông báo khi một audit context được cấp phát và giải phóng.

### Lời giải tham khảo:

~~~java
@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
public class UserAuditSession {
    private final List<String> steps = new ArrayList<>();
    private final String sessionId = UUID.randomUUID().toString();

    @PostConstruct
    public void init() {
        System.out.println("[AUDIT START] Session khởi tạo: " + sessionId);
    }

    public void addStep(String action) {
        steps.add(Instant.now() + " - " + action);
    }

    public List<String> getSteps() { return Collections.unmodifiableList(steps); }

    @PreDestroy
    public void cleanup() {
        System.out.println("[AUDIT END] Đóng session và dọn dẹp: " + sessionId);
        steps.clear();
    }
}

@Service
public class AuditManager {
    private final ObjectProvider<UserAuditSession> sessionProvider;

    public AuditManager(ObjectProvider<UserAuditSession> sessionProvider) {
        this.sessionProvider = sessionProvider;
    }

    public void executeAuditedWorkflow(Consumer<UserAuditSession> workflow) {
        UserAuditSession session = sessionProvider.getObject();
        try {
            workflow.accept(session);
        } finally {
            System.out.println("Tổng số action đã thực hiện: " + session.getSteps().size());
        }
    }
}
~~~

:::takeaways
- IoC Container đảo ngược quyền tạo object, biến class thành các module độc lập, dễ test.
- Constructor Injection là tiêu chuẩn bắt buộc: đảm bảo immutability và fail-fast lúc biên dịch.
- Xung đột bean được giải quyết tường minh qua @Primary (mặc định) và @Qualifier (chỉ định).
- Prototype inject vào Singleton bị đóng băng -> Giải pháp chuẩn là ObjectProvider<T>.
- Circular Dependency bị chặn từ Spring Boot 2.6+ -> Tách service hoặc dùng Event Decoupling.
:::
`
    },
    {
      id: "1-2",
      type: "lesson",
      title: "Auto-configuration & Starters — ma thuật được giải thích",
      minutes: 45,
      content: `
## "Ma thuật" của Spring Boot thực chất là gì?

Mọi lập trình viên Spring Boot đều từng trải nghiệm khoảnh khắc này: bạn thêm duy nhất một dòng dependency <code>spring-boot-starter-web</code> vào <code>pom.xml</code>, và ngay khi chạy hàm <code>main()</code>, một web server Tomcat nhúng đã khởi động ở cổng 8080, Jackson JSON serializer đã sẵn sàng, và các endpoint REST lập tức xử lý request.

Không có file XML nào. Không cần cấu hình web.xml phức tạp như thời Spring Framework 3/4. Nhiều người gọi đó là **"ma thuật" (magic)**. Nhưng trong kỹ thuật phần mềm cấp cao, không có ma thuật — chỉ có **quy ước cấu hình tự động (Convention over Configuration)** được điều khiển bởi một cỗ máy Reflection và Conditional Evaluation cực kỳ tinh xảo.

Hiểu sâu cơ chế này là lằn ranh phân biệt giữa một Junior "chỉ biết copy starter từ trang start.spring.io" và một Senior/Tech Lead có khả năng debug các lỗi xung đột bean lúc khởi động, tối ưu thời gian startup container, và tự thiết kế các framework/starter dùng chung cho toàn bộ tập đoàn.

---

## 1. Vòng đời khởi động của SpringApplication & Cỗ máy Auto-configuration

Khi bạn bấm Run hoặc chạy lệnh <code>java -jar app.jar</code>, phương thức <code>SpringApplication.run(App.class, args)</code> kích hoạt một chuỗi 7 giai đoạn cốt lõi:

~~~text
                     SPRINGAPPLICATION BOOTSTRAP LIFECYCLE
                     
  [1] main() → SpringApplication.run()
        │
        ▼
  [2] Phát hiện WebApplicationType (SERVLET, REACTIVE, hoặc NONE)
        │
        ▼
  [3] Kích hoạt SpringApplicationRunListeners
        │  • Phát sự kiện ApplicationStartingEvent
        ▼
  [4] Chuẩn bị Environment (ConfigDataEnvironmentPostProcessor)
        │  • Đọc application.yml, system properties, biến môi trường (OS env)
        │  • Phát sự kiện ApplicationEnvironmentPreparedEvent
        ▼
  [5] Khởi tạo ApplicationContext (AnnotationConfigServletWebServerApplicationContext)
        │
        ▼
  [6] ConfigurationClassPostProcessor thực thi:
        │  ├── (A) Quét các bean do lập trình viên định nghĩa (@ComponentScan)
        │  └── (B) AutoConfigurationImportSelector quét META-INF/spring/...
        │        │
        │        ├── Đánh giá các điều kiện @ConditionalOn*
        │        ├── Sắp xếp thứ tự bằng AutoConfigurationSorter (@AutoConfigureOrder)
        │        └── Đăng ký BeanDefinition của các starter thỏa mãn điều kiện
        ▼
  [7] Context Refresh: Khởi tạo Bean, Embedded Tomcat start()
        │  • Phát sự kiện ApplicationReadyEvent
        ▼
  [ỨNG DỤNG SẴN SÀNG NHẬN REQUEST]
~~~

### Điểm mấu chốt: Sự chuyển dịch từ Spring Boot 2.x sang Spring Boot 3.x
- **Spring Boot 2.x**: Danh sách các class auto-configuration được lưu trong file:
  <code>META-INF/spring.factories</code> dưới key <code>org.springframework.boot.autoconfigure.EnableAutoConfiguration</code>.
- **Spring Boot 3.x**: Để hỗ trợ Spring AOT (Ahead-of-Time) và GraalVM Native Image, cấu trúc này được tách riêng sang file:
  <code>META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports</code>.
  Mỗi dòng trong file này là một tên class đủ điều kiện (FQN) của một class cấu hình tự động.

---

## 2. Giải mã bên trong AutoConfiguration — Bộ tứ @Conditional

Một class auto-configuration chuẩn mực trông như thế nào? Hãy mổ xẻ cấu trúc của một class nội bộ trong Spring Boot:

~~~java
package org.springframework.boot.autoconfigure.web.servlet;

@AutoConfiguration(after = { DispatcherServletAutoConfiguration.class })
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnClass({ Servlet.class, DispatcherServlet.class, WebMvcConfigurer.class })
@ConditionalOnMissingBean(WebMvcConfigurationSupport.class)
@AutoConfigureOrder(Ordered.HIGHEST_PRECEDENCE + 10)
public class WebMvcAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(InternalResourceViewResolver.class)
    public InternalResourceViewResolver defaultViewResolver() {
        InternalResourceViewResolver resolver = new InternalResourceViewResolver();
        resolver.setPrefix("/WEB-INF/");
        resolver.setSuffix(".jsp");
        return resolver;
    }
}
~~~

### Bảng tra cứu các annotation @Conditional cốt lõi

| Annotation | Cơ chế kiểm tra | Kịch bản áp dụng |
|---|---|---|
| <code>@ConditionalOnClass(X.class)</code> | Dùng ClassLoader thử tải class X. Nếu ném <code>ClassNotFoundException</code> → Bỏ qua toàn bộ config. | Kiểm tra xem developer có kéo thư viện MySQL Driver hay Redis Client vào classpath hay không. |
| <code>@ConditionalOnMissingBean(X.class)</code> | Kiểm tra trong BeanFactory xem đã có bean loại X chưa. | **Nền tảng của tính linh hoạt**: Cung cấp bean mặc định, nhưng nếu user tự viết một bean X thì bean mặc định lập tức lùi bước (backing off). |
| <code>@ConditionalOnProperty(...)</code> | Đọc giá trị cấu hình trong <code>application.yml</code> hoặc biến môi trường. | Bật/tắt tính năng theo cờ cấu hình (feature toggling). |
| <code>@ConditionalOnWebApplication</code> | Kiểm tra xem ứng dụng có đang chạy Servlet container (Tomcat) hay WebFlux Reactive hay không. | Tránh khởi tạo các Web Filter trong các ứng dụng CLI/Worker không có HTTP server. |
| <code>@ConditionalOnBean(X.class)</code> | Chỉ khởi tạo nếu bean X ĐÃ TỒN TẠI trong Context. | Thường dùng cho các bean phụ thuộc, ví dụ <code>TransactionManager</code> chỉ tạo khi đã có <code>DataSource</code>. |

:::danger QUY TẮC SỐNG CÒN CỦA @ConditionalOnMissingBean
Luôn đặt <code>@ConditionalOnMissingBean</code> trên các phương thức <code>@Bean</code> của class AutoConfiguration, **KHÔNG ĐƯỢC** đặt trên class cấu hình của ứng dụng thông thường do bạn viết.
Lý do: Class AutoConfiguration được thiết kế để chạy **sau cùng** (sau khi toàn bộ user beans đã được nạp). Nếu đặt trên class thông thường, thứ tự scan không đoán trước được sẽ khiến bean bị mất ngẫu nhiên!
:::

---

## 3. Kiến trúc Sản xuất: Xây dựng Dynamic Storage Provider

Để hiểu thấu đáo cách Starter hoạt động, hãy xem một hệ thống quản lý tệp tin đa môi trường trong dự án thực tế: Khi chạy ở Local/Dev, hệ thống lưu file vào ổ cứng cục bộ (Local Storage). Khi deploy lên Cloud (SIT, UAT, Production), hệ thống tự động kích hoạt AWS S3 Storage mà **không cần sửa một dòng code business nào**.

### Bước 1: Interface dùng chung & Data Contract

~~~java
package vn.mastery.storage;

import java.io.InputStream;

public interface StorageService {
    String uploadFile(String filename, InputStream data, long contentLength, String contentType);
    InputStream downloadFile(String fileId);
    void deleteFile(String fileId);
    String getStorageType();
}
~~~

### Bước 2: Cấu hình Type-safe với @ConfigurationProperties & Bean Validation

~~~java
package vn.mastery.storage.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.storage")
public record StorageProperties(
    @NotBlank
    String provider, // "local" hoặc "s3"
    
    LocalStorageProperties local,
    S3Properties s3
) {
    public record LocalStorageProperties(
        String baseDir
    ) {}

    public record S3Properties(
        String bucketName,
        String region,
        String accessKey,
        String secretKey
    ) {}
}
~~~

### Bước 3: Hai implementation độc lập

~~~java
package vn.mastery.storage.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import vn.mastery.storage.StorageService;
import vn.mastery.storage.config.StorageProperties;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

public class LocalStorageService implements StorageService {
    private static final Logger log = LoggerFactory.getLogger(LocalStorageService.class);
    private final Path rootLocation;

    public LocalStorageService(StorageProperties properties) {
        String dir = (properties.local() != null && properties.local().baseDir() != null)
            ? properties.local().baseDir()
            : "./uploads";
        this.rootLocation = Path.of(dir);
        try {
            Files.createDirectories(this.rootLocation);
            log.info("Khởi tạo LocalStorageService thành công tại thư mục: {}", this.rootLocation.toAbsolutePath());
        } catch (Exception e) {
            throw new IllegalStateException("Không thể khởi tạo thư mục lưu trữ cục bộ", e);
        }
    }

    @Override
    public String uploadFile(String filename, InputStream data, long contentLength, String contentType) {
        try {
            Path target = this.rootLocation.resolve(filename);
            Files.copy(data, target, StandardCopyOption.REPLACE_EXISTING);
            return target.toAbsolutePath().toString();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi lưu file local", e);
        }
    }

    @Override
    public InputStream downloadFile(String fileId) {
        try {
            return Files.newInputStream(Path.of(fileId));
        } catch (Exception e) {
            throw new RuntimeException("Không tìm thấy file: " + fileId, e);
        }
    }

    @Override
    public void deleteFile(String fileId) {
        try {
            Files.deleteIfExists(Path.of(fileId));
        } catch (Exception e) {
            log.error("Lỗi khi xóa file: {}", fileId, e);
        }
    }

    @Override
    public String getStorageType() {
        return "LOCAL_DISK";
    }
}
~~~

~~~java
package vn.mastery.storage.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import vn.mastery.storage.StorageService;
import vn.mastery.storage.config.StorageProperties;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

public class S3StorageService implements StorageService {
    private static final Logger log = LoggerFactory.getLogger(S3StorageService.class);
    private final StorageProperties.S3Properties s3Config;

    public S3StorageService(StorageProperties properties) {
        this.s3Config = properties.s3();
        log.info("Khởi tạo S3StorageService kết nối Bucket S3: {} tại Region: {}", 
                 s3Config.bucketName(), s3Config.region());
    }

    @Override
    public String uploadFile(String filename, InputStream data, long contentLength, String contentType) {
        log.info("Giả lập truyền stream lên AWS S3: s3://{}/{}", s3Config.bucketName(), filename);
        return "https://" + s3Config.bucketName() + ".s3." + s3Config.region() + ".amazonaws.com/" + filename;
    }

    @Override
    public InputStream downloadFile(String fileId) {
        return new ByteArrayInputStream("S3 file dummy content".getBytes());
    }

    @Override
    public void deleteFile(String fileId) {
        log.info("Xóa object khỏi S3: {}", fileId);
    }

    @Override
    public String getStorageType() {
        return "AWS_S3";
    }
}
~~~

### Bước 4: Lớp Auto-configuration thông minh

~~~java
package vn.mastery.storage.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import vn.mastery.storage.StorageService;
import vn.mastery.storage.impl.LocalStorageService;
import vn.mastery.storage.impl.S3StorageService;

@AutoConfiguration
@EnableConfigurationProperties(StorageProperties.class)
public class StorageAutoConfiguration {

    // Nếu cấu hình app.storage.provider=local HOẶC không cấu hình gì (matchIfMissing = true)
    @Bean
    @ConditionalOnProperty(name = "app.storage.provider", havingValue = "local", matchIfMissing = true)
    @ConditionalOnMissingBean(StorageService.class)
    public StorageService localStorageService(StorageProperties properties) {
        return new LocalStorageService(properties);
    }

    // Nếu cấu hình app.storage.provider=s3
    @Bean
    @ConditionalOnProperty(name = "app.storage.provider", havingValue = "s3")
    @ConditionalOnMissingBean(StorageService.class)
    public StorageService s3StorageService(StorageProperties properties) {
        return new S3StorageService(properties);
    }
}
~~~

---

## 4. Bóc trần "Ma thuật" qua Condition Evaluation Report & Actuator

Khi bạn gặp tình huống: "Tại sao bean của tôi không chạy?" hoặc "Tại sao Spring lại tự tạo một bean kỳ lạ nào đó?", hãy kích hoạt báo cáo điều kiện ngay lập tức.

### Cách 1: Bật cờ --debug lúc khởi động

~~~bash
java -jar target/mastery-app.jar --debug
~~~

Terminal sẽ in ra toàn bộ bảng **CONDITIONS EVALUATION REPORT**:

~~~text
============================
CONDITIONS EVALUATION REPORT
============================

Positive matches:
-----------------
   StorageAutoConfiguration#localStorageService matched:
      - @ConditionalOnProperty (app.storage.provider=local) matched (OnPropertyCondition)
      - @ConditionalOnMissingBean (types: vn.mastery.storage.StorageService; SearchStrategy: all) did not find any beans (OnBeanCondition)

   DataSourceAutoConfiguration matched:
      - @ConditionalOnClass finds 'javax.sql.DataSource' and 'org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType' (OnClassCondition)

Negative matches:
-----------------
   StorageAutoConfiguration#s3StorageService:
      Did not match:
         - @ConditionalOnProperty (app.storage.provider=s3) did not find property 'app.storage.provider' with value 's3' (OnPropertyCondition)

   MongoDataAutoConfiguration:
      Did not match:
         - @ConditionalOnClass did not find required class 'com.mongodb.client.MongoClient' (OnClassCondition)

Exclusions:
-----------
    None

Unconditional classes:
----------------------
    org.springframework.boot.autoconfigure.context.PropertyPlaceholderAutoConfiguration
~~~

### Cách 2: Truy vấn trực tiếp qua HTTP bằng Spring Boot Actuator

Bật endpoint conditions trong <code>application.yml</code>:

~~~yaml
management:
  endpoints:
    web:
      exposure:
        include: "conditions,configprops,beans"
~~~

Gọi qua cURL để xem cây quyết định runtime:

~~~bash
curl -X GET http://localhost:8080/actuator/conditions
~~~

JSON phản hồi trả về chi tiết chính xác lý do từng method bean được kích hoạt hay bị từ chối:

~~~json
{
  "contexts": {
    "application": {
      "positiveMatches": {
        "StorageAutoConfiguration#localStorageService": [
          {
            "condition": "OnPropertyCondition",
            "message": "@ConditionalOnProperty (app.storage.provider=local) matched"
          },
          {
            "condition": "OnBeanCondition",
            "message": "@ConditionalOnMissingBean (types: vn.mastery.storage.StorageService) did not find any beans"
          }
        ]
      },
      "negativeMatches": {
        "StorageAutoConfiguration#s3StorageService": [
          {
            "condition": "OnPropertyCondition",
            "message": "@ConditionalOnProperty (app.storage.provider=s3) did not find property 'app.storage.provider'"
          }
        ]
      }
    }
  }
}
~~~

---

## 5. Ba cạm bẫy thực chiến & Sự cố hạ tầng (Production Pitfalls)

### Cạm bẫy 1: Classpath Pollution do Transitive Dependency
**Hiện tượng**: Bạn thêm một dependency kiểm thử hoặc một SDK của bên thứ ba, nhưng dependency đó ngầm kéo theo <code>h2database</code> hoặc <code>spring-boot-starter-security</code>.
**Hậu quả**:
- Spring Boot thấy class Security trên classpath → Tự động tạo SecurityFilterChain mặc định → Khóa toàn bộ các API với mã HTTP 401 Unauthorized và sinh ra một mật khẩu random ngẫu nhiên trong log!
- Spring Boot thấy H2 trên classpath → Đổi datasource sang in-memory thay vì kết nối tới PostgreSQL thật.
**Khắc phục**: Dùng lệnh <code>mvn dependency:tree</code> hoặc Gradle <code>./gradlew dependencies</code> để phát hiện và dùng thẻ <code>&lt;exclusions&gt;</code> loại bỏ dependency ký sinh.

### Cạm bẫy 2: matchIfMissing = false gây sập ứng dụng ở môi trường mới
Xem lại cấu hình:
~~~java
@ConditionalOnProperty(name = "feature.loyalty.v2", havingValue = "true")
~~~
Nếu bạn không đặt <code>matchIfMissing = true</code> (hoặc ngược lại tùy nghiệp vụ), khi đưa ứng dụng sang môi trường kiểm thử mới chưa kịp khai báo property này, bean sẽ bị <code>null</code>. Nếu một Service khác inject trực tiếp interface này qua Constructor, ứng dụng sẽ sập ngay lúc khởi động với lỗi:
<code>NoSuchBeanDefinitionException: No qualifying bean of type '...' available</code>.

### Cạm bẫy 3: Cấu hình sai thứ tự @AutoConfigureAfter
Nếu AutoConfiguration A phụ thuộc vào Bean do AutoConfiguration B sinh ra, nhưng bạn không khai báo <code>@AutoConfigureAfter(B.class)</code>, cỗ máy đánh giá điều kiện có thể chạy A trước B. Khi đó, điều kiện <code>@ConditionalOnBean</code> tại A sẽ kiểm tra thất bại vì B chưa hề chạy!

---

## 6. Thử thách thực chiến (Hands-on Challenge)

### Đề bài:
Một tập đoàn tài chính yêu cầu bạn xây dựng hệ thống gửi tin nhắn thông báo (Notification Subsystem).
Hệ thống cần đáp ứng:
1. Interface <code>NotificationSender</code> có phương thức <code>void send(String recipient, String message)</code>.
2. Có 2 implementation:
   - <code>EmailNotificationSender</code>: Gửi email giả lập (in log).
   - <code>SlackNotificationSender</code>: Gửi tin nhắn qua Webhook Slack.
3. Điều kiện kích hoạt:
   - Nếu trong <code>application.yml</code> có cấu hình <code>notification.slack.webhook-url</code> khác rỗng, tự động chọn <code>SlackNotificationSender</code>.
   - Nếu không có cấu hình trên, fallback an toàn về <code>EmailNotificationSender</code>.
   - Nếu lập trình viên tự khai báo một bean <code>NotificationSender</code> bất kỳ trong class <code>@Configuration</code> của dự án, hệ sinh thái auto-configuration phải nhường quyền hoàn toàn (Back off).

### Lời giải mẫu chuẩn công nghiệp:

~~~java
package vn.mastery.notification;

public interface NotificationSender {
    void send(String recipient, String message);
    String getChannelName();
}
~~~

~~~java
package vn.mastery.notification.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import vn.mastery.notification.NotificationSender;

public class EmailNotificationSender implements NotificationSender {
    private static final Logger log = LoggerFactory.getLogger(EmailNotificationSender.class);

    @Override
    public void send(String recipient, String message) {
        log.info("[EMAIL CHANNEL] Gửi email tới {}: {}", recipient, message);
    }

    @Override
    public String getChannelName() {
        return "EMAIL";
    }
}
~~~

~~~java
package vn.mastery.notification.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import vn.mastery.notification.NotificationSender;

public class SlackNotificationSender implements NotificationSender {
    private static final Logger log = LoggerFactory.getLogger(SlackNotificationSender.class);
    private final String webhookUrl;

    public SlackNotificationSender(String webhookUrl) {
        this.webhookUrl = webhookUrl;
    }

    @Override
    public void send(String recipient, String message) {
        log.info("[SLACK WEBHOOK] Post tới {}: @{} -> {}", webhookUrl, recipient, message);
    }

    @Override
    public String getChannelName() {
        return "SLACK";
    }
}
~~~

~~~java
package vn.mastery.notification.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import vn.mastery.notification.NotificationSender;
import vn.mastery.notification.impl.EmailNotificationSender;
import vn.mastery.notification.impl.SlackNotificationSender;

@AutoConfiguration
public class NotificationAutoConfiguration {

    @Bean
    @ConditionalOnProperty(prefix = "notification.slack", name = "webhook-url")
    @ConditionalOnMissingBean(NotificationSender.class)
    public NotificationSender slackNotificationSender(Environment env) {
        String webhookUrl = env.getProperty("notification.slack.webhook-url");
        return new SlackNotificationSender(webhookUrl);
    }

    @Bean
    @ConditionalOnMissingBean(NotificationSender.class)
    public NotificationSender emailNotificationSender() {
        return new EmailNotificationSender();
    }
}
~~~

:::takeaways
- **Không có phép màu**: Spring Boot là sự kết hợp giữa <code>AutoConfiguration.imports</code>, reflection classpath scan và các quy tắc <code>@Conditional</code>.
- **Thứ tự nạp bean**: User Beans (được định nghĩa trực tiếp trong app) luôn được nạp trước, sau đó Auto-Configuration mới nạp và kiểm tra <code>@ConditionalOnMissingBean</code>.
- **Vũ khí chẩn đoán**: Gặp sự cố khởi động, luôn chạy <code>--debug</code> để xem **Conditions Evaluation Report** hoặc tra cứu <code>/actuator/conditions</code>.
- **Phòng chống ô nhiễm classpath**: Thường xuyên kiểm tra <code>mvn dependency:tree</code> để tránh kéo nhầm các starter/driver không mong muốn kích hoạt tính năng tự động ngoài tầm kiểm soát.
:::
`
    },
    {
      id: "1-3",
      type: "lesson",
      title: "AOP & Dynamic Proxies — CGLIB, JDK Proxy & Cạm bẫy Self-Invocation",
      minutes: 50,
      content: `
## Đằng sau các "Annotation ma thuật" của Spring

Khi bạn gắn <code>@Transactional</code> lên một method, database transaction được mở và commit tự động. Khi gắn <code>@Cacheable</code>, dữ liệu được lấy từ Redis mà hàm thậm chí không chạy. Khi gắn <code>@PreAuthorize("hasRole('ADMIN')")</code>, những kẻ xâm nhập trái phép bị chặn đứng ở ngưỡng cửa.

Tất cả những tính năng quyền lực này đều được xây dựng trên một nền tảng kỹ thuật duy nhất: **AOP (Aspect-Oriented Programming)** kết hợp với **Dynamic Proxy**.

Nếu không nắm vững cơ chế Proxy và AOP:
1. Bạn sẽ đối mặt với các lỗi "chết người" như **Self-invocation** khiến <code>@Transactional</code> bị vô hiệu hóa trong im lặng, dẫn đến rách nát dữ liệu tài khoản ngân hàng.
2. Aspect tự viết nuốt chửng Exception khiến transaction không thể rollback.
3. Không hiểu sự khác biệt giữa JDK Dynamic Proxy và CGLIB dẫn đến lỗi <code>ClassCastException</code> khó hiểu khi inject bean.

---

## 1. Kiến trúc AOP & Cơ chế hoạt động của Dynamic Proxy

AOP không thay thế OOP (Lập trình hướng đối tượng), mà bổ trợ cho OOP bằng cách tách rời các mối quan tâm cắt ngang (cross-cutting concerns) như Logging, Security, Transaction, Metrics ra khỏi logic nghiệp vụ cốt lõi.

### Sơ đồ luồng chặn cuộc gọi (Invocation Chain Flowchart)

Khi Client gọi một method trên một Spring Bean đã được áp dụng Aspect:

~~~text
                          CHUỖI CHẶN PROXY CỦA SPRING
                          
  [Caller / Client]
        │
        │ Gọi: orderService.processPayment(orderId)
        ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                 SPRING AOP PROXY (CGLIB)                    │
  │                                                             │
  │   [CglibAopProxy.DynamicAdvisedInterceptor.intercept()]     │
  │                          │                                  │
  │                          ▼                                  │
  │        Chạy chuỗi MethodInterceptor / Advice Chain:          │
  │        ├── 1. SecurityAspect (@PreAuthorize)                │
  │        │        │ (Kiểm tra token, role)                    │
  │        ├── 2. RateLimitAspect (@RateLimited)                │
  │        │        │ (Kiểm tra quota)                          │
  │        ├── 3. TransactionInterceptor (@Transactional)       │
  │        │        │ (Mở Transaction trên DB Connection)       │
  │        │        ▼                                           │
  │        │   proceed()                                        │
  │        │        │                                           │
  │        │        ▼                                           │
  │        │   ┌──────────────────────────────────────────┐     │
  │        │   │        TARGET BEAN (OrderServiceImpl)    │     │
  │        │   │                                          │     │
  │        │   │  public void processPayment(...) {       │     │
  │        │   │      // Code nghiệp vụ thuần túy         │     │
  │        │   │  }                                       │     │
  │        │   └──────────────────────────────────────────┘     │
  │        │        │                                           │
  │        │   Return kết quả                                   │
  │        │        │                                           │
  │        ├── 3. Commit Transaction / Rollback nếu Exception  │
  │        ├── 2. Cập nhật Rate Limit metrics                   │
  │        └── 1. Ghi log hoàn tất                              │
  └──────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
                     [Trả kết quả cho Caller]
~~~

### JDK Dynamic Proxy vs CGLIB: Sự khác biệt bản chất

| Tiêu chí so sánh | JDK Dynamic Proxy | CGLIB Proxy (Code Generation Library) |
|---|---|---|
| **Cơ chế kỹ thuật** | Dùng <code>java.lang.reflect.Proxy</code> tích hợp sẵn trong JDK. | Dùng thư viện ASM sinh mã bytecode trực tiếp để tạo subclass kế thừa class mục tiêu. |
| **Yêu cầu đối với Bean** | Target class **bắt buộc phải implement một Interface**. | Target class không cần Interface, kế thừa trực tiếp từ class gốc. |
| **Hạn chế** | Chỉ can thiệp được các method có trong Interface. Không cast về implementation class được. | Không thể proxy các class hoặc method có từ khóa <code>final</code>. Class phải có default constructor. |
| **Mặc định Spring Boot** | Mặc định ở Spring 1.x / Spring Boot 1.3 trở về trước. | **Mặc định từ Spring Boot 2.0+** (<code>spring.aop.proxy-target-class=true</code>). |

:::tip VÌ SAO SPRING BOOT 2+ CHUYỂN SANG CGLIB TOÀN BỘ?
Thời kỳ đầu, khi dùng JDK Dynamic Proxy, nếu bạn viết <code>@Autowired OrderServiceImpl orderService</code> (inject bằng implementation thay vì interface <code>OrderService</code>), ứng dụng sẽ sập ngay lập tức với lỗi <code>BeanNotOfRequiredTypeException</code> vì Proxy sinh ra là anh em cùng cha (cùng implement interface), chứ không phải con của <code>OrderServiceImpl</code>. CGLIB tạo subclass nên bạn inject theo Interface hay Implementation class đều chạy hoàn hảo.
:::

---

## 2. Xây dựng Production Aspect: Distributed Rate Limiting với SpEL

Hãy xây dựng một Aspect cấp độ sản xuất: Cho phép giới hạn tần suất gọi API theo từng User hoặc IP, sử dụng Annotation tùy biến và Spring Expression Language (SpEL) để bóc tách tham số động từ method.

### Bước 1: Khai báo Annotation @RateLimited

~~~java
package vn.mastery.aop.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.concurrent.TimeUnit;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimited {
    /**
     * Biểu thức SpEL xác định khóa định danh (ví dụ: "#userId", "#request.cif").
     */
    String key();

    /**
     * Số lượt gọi tối đa được phép trong khung thời gian.
     */
    int limit() default 5;

    /**
     * Độ dài khung thời gian.
     */
    long period() default 60;

    /**
     * Đơn vị thời gian.
     */
    TimeUnit timeUnit() default TimeUnit.SECONDS;
}
~~~

### Bước 2: Ngoại lệ chuẩn RateLimitExceededException

~~~java
package vn.mastery.aop.exception;

public class RateLimitExceededException extends RuntimeException {
    private final String rateLimitKey;
    private final long retryAfterSeconds;

    public RateLimitExceededException(String key, long retryAfterSeconds) {
        super(String.format("Vượt quá ngưỡng tần suất gọi cho khóa [%s]. Thử lại sau %d giây.", key, retryAfterSeconds));
        this.rateLimitKey = key;
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public String getRateLimitKey() { return rateLimitKey; }
    public long getRetryAfterSeconds() { return retryAfterSeconds; }
}
~~~

### Bước 3: Lớp Aspect hoàn chỉnh với SpEL Parser

~~~java
package vn.mastery.aop.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.expression.MethodBasedEvaluationContext;
import org.springframework.core.DefaultParameterNameDiscoverer;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.stereotype.Component;
import vn.mastery.aop.annotation.RateLimited;
import vn.mastery.aop.exception.RateLimitExceededException;

import java.lang.reflect.Method;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Aspect
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 50) // Chạy TRƯỚC @Transactional để tiết kiệm DB connection
public class RateLimitingAspect {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingAspect.class);
    private final ExpressionParser parser = new SpelExpressionParser();
    private final DefaultParameterNameDiscoverer paramDiscoverer = new DefaultParameterNameDiscoverer();

    // Giả lập In-Memory Cache (Production thực tế sẽ thay bằng Redis Token Bucket)
    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    @Around("@annotation(rateLimited)")
    public Object enforceRateLimit(ProceedingJoinPoint joinPoint, RateLimited rateLimited) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();

        // 1. Phân giải dynamic key từ tham số method bằng SpEL
        String resolvedKey = resolveSpelKey(rateLimited.key(), method, joinPoint.getArgs(), joinPoint.getTarget());
        String fullBucketKey = method.getDeclaringClass().getSimpleName() + ":" + method.getName() + ":" + resolvedKey;

        // 2. Kiểm tra Token Bucket
        TokenBucket bucket = buckets.computeIfAbsent(
            fullBucketKey, 
            k -> new TokenBucket(rateLimited.limit(), rateLimited.period(), rateLimited.timeUnit())
        );

        if (!bucket.tryConsume()) {
            log.warn("Rate limit breached for key: {}", fullBucketKey);
            throw new RateLimitExceededException(fullBucketKey, bucket.getResetSeconds());
        }

        log.debug("Rate limit passed for key: {}. Executing target method.", fullBucketKey);

        // 3. Thực thi method mục tiêu
        return joinPoint.proceed();
    }

    private String resolveSpelKey(String spelExpression, Method method, Object[] args, Object target) {
        if (!spelExpression.startsWith("#")) {
            return spelExpression; // Chuỗi tĩnh
        }
        EvaluationContext context = new MethodBasedEvaluationContext(target, method, args, paramDiscoverer);
        Object value = parser.parseExpression(spelExpression).getValue(context);
        return value != null ? value.toString() : "anonymous";
    }

    // Đơn giản hóa cấu trúc Token Bucket in-memory thread-safe
    private static class TokenBucket {
        private final int maxTokens;
        private final long windowMillis;
        private final AtomicInteger tokens;
        private volatile long lastResetTime;

        public TokenBucket(int maxTokens, long period, java.util.concurrent.TimeUnit unit) {
            this.maxTokens = maxTokens;
            this.windowMillis = unit.toMillis(period);
            this.tokens = new AtomicInteger(maxTokens);
            this.lastResetTime = System.currentTimeMillis();
        }

        public synchronized boolean tryConsume() {
            refill();
            if (tokens.get() > 0) {
                tokens.decrementAndGet();
                return true;
            }
            return false;
        }

        private void refill() {
            long now = System.currentTimeMillis();
            if (now - lastResetTime > windowMillis) {
                tokens.set(maxTokens);
                lastResetTime = now;
            }
        }

        public long getResetSeconds() {
            long elapsed = System.currentTimeMillis() - lastResetTime;
            long remaining = windowMillis - elapsed;
            return Math.max(1, remaining / 1000);
        }
    }
}
~~~

---

## 3. Thử nghiệm & Xác thực Thực tế (Real-world Verification)

### Service & Controller mẫu sử dụng Aspect

~~~java
package vn.mastery.aop.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.mastery.aop.annotation.RateLimited;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    @PostMapping("/transfer")
    @RateLimited(key = "#senderCif", limit = 3, period = 60)
    public ResponseEntity<String> executeTransfer(
            @RequestParam String senderCif,
            @RequestParam String targetAccount,
            @RequestParam double amount) {
        return ResponseEntity.ok("Giao dịch thành công cho khách hàng: " + senderCif);
    }
}
~~~

### Global Exception Handler chuẩn RFC 7807 ProblemDetails

~~~java
package vn.mastery.aop.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.Instant;

@RestControllerAdvice
public class GlobalAopExceptionHandler {

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ProblemDetail> handleRateLimit(RateLimitExceededException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.TOO_MANY_REQUESTS,
            ex.getMessage()
        );
        problem.setTitle("Rate Limit Exceeded");
        problem.setType(URI.create("https://api.mastery.vn/errors/rate-limit-exceeded"));
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("rateLimitKey", ex.getRateLimitKey());
        problem.setProperty("retryAfterSeconds", ex.getRetryAfterSeconds());

        return ResponseEntity
            .status(HttpStatus.TOO_MANY_REQUESTS)
            .header("Retry-After", String.valueOf(ex.getRetryAfterSeconds()))
            .body(problem);
    }
}
~~~

### Kịch bản cURL kiểm thử thực tế

Gửi liên tiếp 4 request bằng lệnh cURL:

~~~bash
# Request 1, 2, 3 -> HTTP 200 OK
curl -X POST "http://localhost:8080/api/v1/payments/transfer?senderCif=CIF888999&targetAccount=102030&amount=500000"

# Request 4 -> HTTP 429 Too Many Requests
curl -i -X POST "http://localhost:8080/api/v1/payments/transfer?senderCif=CIF888999&targetAccount=102030&amount=500000"
~~~

JSON phản hồi trả về từ máy chủ:

~~~text
HTTP/1.1 429 Too Many Requests
Content-Type: application/problem+json
Retry-After: 54

{
  "type": "https://api.mastery.vn/errors/rate-limit-exceeded",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "Vượt quá ngưỡng tần suất gọi cho khóa [PaymentController:executeTransfer:CIF888999]. Thử lại sau 54 giây.",
  "timestamp": "2026-10-03T10:15:30.125Z",
  "rateLimitKey": "PaymentController:executeTransfer:CIF888999",
  "retryAfterSeconds": 54
}
~~~

---

## 4. Ba Cạm bẫy Chết người & Bài học Sự cố Thực tế

### Cạm bẫy 1: Self-Invocation Bypass — Bug ẩn kinh điển nhất trong Spring

Hãy quan sát đoạn code quen thuộc sau:

~~~java
@Service
public class OrderProcessingService {

    public void checkout(String orderId) {
        log.info("Bắt đầu xử lý đơn hàng: {}", orderId);
        // GỌI NỘI BỘ TRONG CÙNG CLASS
        this.saveAuditAndDeductStock(orderId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveAuditAndDeductStock(String orderId) {
        // Trừ kho và tạo log
        inventoryRepository.deductStock(orderId);
        if (checkFraud(orderId)) {
            throw new FraudDetectedException("Gian lận phát hiện!");
        }
    }
}
~~~

**Hiện tượng**: Khi <code>FraudDetectedException</code> bị ném ra, dữ liệu trong kho **KHÔNG HỀ BỊ ROLLBACK**!
**Bản chất kỹ thuật**: 
Khi bên ngoài gọi <code>orderService.checkout()</code>, cuộc gọi đi qua Proxy. Nhưng bên trong <code>checkout()</code>, từ khóa <code>this.saveAuditAndDeductStock()</code> tham chiếu trực tiếp đến địa chỉ vùng nhớ của object thật trong Heap.
Cuộc gọi đi thẳng vào hàm mà **hoàn toàn vòng qua Proxy**. Spring Transaction Interceptor không hề hay biết method này được gọi, nên không có Transaction nào được mở ra!

#### 3 Giải pháp sửa lỗi chuẩn kỹ thuật:

~~~java
// GIẢI PHÁP 1 (Chuẩn nhất - SOLID): Tách sang Service riêng
@Service
public class OrderProcessingService {
    private final InventoryAuditService inventoryAuditService;

    public OrderProcessingService(InventoryAuditService inventoryAuditService) {
        this.inventoryAuditService = inventoryAuditService;
    }

    public void checkout(String orderId) {
        // Cuộc gọi này đi qua Proxy của InventoryAuditService!
        inventoryAuditService.saveAuditAndDeductStock(orderId);
    }
}

// GIẢI PHÁP 2: Self-Injection với ObjectProvider (Tránh Circular Dependency)
@Service
public class OrderProcessingService {
    private final ObjectProvider<OrderProcessingService> selfProvider;

    public OrderProcessingService(ObjectProvider<OrderProcessingService> selfProvider) {
        this.selfProvider = selfProvider;
    }

    public void checkout(String orderId) {
        // Lấy chính proxy của mình từ Container để gọi
        selfProvider.getObject().saveAuditAndDeductStock(orderId);
    }
}
~~~

### Cạm bẫy 2: Nuốt Exception trong @Around Advice phá vỡ Transaction Rollback

~~~java
// ❌ CỰC KỲ NGUY HIỂM:
@Around("@annotation(Audited)")
public Object badAuditAspect(ProceedingJoinPoint pjp) {
    try {
        return pjp.proceed();
    } catch (Throwable t) {
        log.error("Có lỗi xảy ra: {}", t.getMessage());
        return null; // ❌ Nuốt Exception!
    }
}
~~~

Nếu method được bọc bởi Aspect này có <code>@Transactional</code>, khi có ngoại lệ nghiệp vụ xảy ra, Spring AOP Proxy nằm ngoài không hề thấy Exception bị ném lên. Container kết luận method thành công mỹ mãn và gửi lệnh **COMMIT** xuống Database, lưu lại dữ liệu rác!
**Quy tắc**: Trong mọi <code>@Around</code> Advice, nếu có <code>catch (Throwable t)</code>, bạn **phải re-throw** lại <code>throw t;</code> trừ khi có mục đích đặc biệt được kiểm soát.

### Cạm bẫy 3: Đặt Annotation AOP trên method không phải <code>public</code>

Spring AOP dựa trên cơ chế Proxy thông thường chỉ chặn được các method có phạm vi truy cập <code>public</code>. Nếu bạn đặt <code>@Transactional</code>, <code>@Async</code> hay <code>@RateLimited</code> lên một method <code>protected</code> hoặc <code>private</code>, Spring sẽ lờ đi mà không báo bất kỳ lỗi nào!

---

## 5. Thử thách Thực chiến (Hands-on Challenge)

### Đề bài:
Xây dựng một hệ thống Audit Trail tự động cho các hoạt động tài chính:
1. Tạo Custom Annotation <code>@AuditLog(action = "...", maskFields = {"password", "pin", "cvv"})</code>.
2. Xây dựng <code>AuditTrailAspect</code> dùng <code>@Around</code>:
   - Đo chính xác thời gian thực thi (milliseconds).
   - Bắt giữ các tham số truyền vào method, tự động chuyển đổi sang chuỗi JSON và **mã hóa (Mask) các trường nhạy cảm thành <code>***</code>**.
   - Ghi nhận trạng thái: <code>SUCCESS</code> hoặc <code>FAILED (kèm nguyên nhân exception)</code>.
   - Bắt buộc phải re-throw Exception để bảo vệ tính toàn vẹn của Transaction cha.

### Lời giải chuẩn kỹ sư cao cấp:

~~~java
package vn.mastery.aop.audit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuditLog {
    String action();
    String[] maskFields() default {"password", "pin", "cvv", "accessToken"};
}
~~~

~~~java
package vn.mastery.aop.audit;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@Aspect
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 10) // Chạy bao ngoài logic nghiệp vụ
public class AuditTrailAspect {

    private static final Logger log = LoggerFactory.getLogger(AuditTrailAspect.class);

    @Around("@annotation(auditLog)")
    public Object auditExecution(ProceedingJoinPoint pjp, AuditLog auditLog) throws Throwable {
        long startTime = System.currentTimeMillis();
        String actionName = auditLog.action();
        MethodSignature signature = (MethodSignature) pjp.getSignature();
        Method method = signature.getMethod();
        String methodName = method.getDeclaringClass().getSimpleName() + "." + method.getName();

        Map<String, Object> sanitizedParams = extractAndSanitizeParams(
            signature.getParameterNames(), 
            pjp.getArgs(), 
            auditLog.maskFields()
        );

        log.info("[AUDIT-START] Action: {} | Method: {} | Params: {}", actionName, methodName, sanitizedParams);

        Object result;
        try {
            result = pjp.proceed();
            long duration = System.currentTimeMillis() - startTime;
            log.info("[AUDIT-SUCCESS] Action: {} | Time: {}ms", actionName, duration);
            return result;
        } catch (Throwable ex) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("[AUDIT-FAILED] Action: {} | Time: {}ms | Error: {}", actionName, duration, ex.getMessage());
            // CỰC KỲ QUAN TRỌNG: Phải ném lại exception để không làm hỏng rollback của @Transactional
            throw ex;
        }
    }

    private Map<String, Object> extractAndSanitizeParams(String[] paramNames, Object[] args, String[] maskFields) {
        Map<String, Object> map = new HashMap<>();
        if (paramNames == null || args == null) return map;

        for (int i = 0; i < paramNames.length; i++) {
            String name = paramNames[i];
            Object value = (i < args.length) ? args[i] : null;

            if (isMasked(name, maskFields)) {
                map.put(name, "******");
            } else {
                map.put(name, value != null ? value.toString() : "null");
            }
        }
        return map;
    }

    private boolean isMasked(String paramName, String[] maskFields) {
        return Arrays.stream(maskFields).anyMatch(field -> field.equalsIgnoreCase(paramName));
    }
}
~~~

:::takeaways
- **Cơ chế cốt lõi**: Mọi annotation ma thuật (<code>@Transactional</code>, <code>@Cacheable</code>, <code>@Async</code>) đều là các Interceptor được dệt (weave) qua Spring Dynamic Proxy.
- **CGLIB mặc định**: Spring Boot 2+ dùng CGLIB tạo subclass, cho phép inject bean theo cả Class lẫn Interface.
- **Tử huyệt Self-invocation**: Gọi <code>this.method()</code> trong cùng class không bao giờ kích hoạt được Aspect/Transaction. Giải pháp chuẩn là tách service hoặc dùng <code>ObjectProvider</code>.
- **Bảo toàn Exception**: Tuyệt đối không nuốt Exception trong <code>@Around</code> advice nếu không muốn làm sai lệch kết quả commit/rollback của transaction.
:::
`
    },
    {
      id: "1-4",
      type: "lesson",
      title: "Configuration & Profiles — 17 tầng ưu tiên, Relaxed Binding & Validation",
      minutes: 50,
      content: `
## Cấu hình sai — thảm họa sản xuất lớn hơn cả bug code

Trong một hệ thống phân tán hoặc Microservices, code logic có thể hoàn hảo tuyệt đối, nhưng chỉ cần một sai sót nhỏ trong cấu hình:
- Điền nhầm URL của Database Production vào môi trường Staging.
- Sai định dạng chuỗi Timeout khiến thread bị treo vĩnh viễn (Hang thread) dẫn đến cạn kiệt Connection Pool.
- Quên đặt cơ chế Fail-fast khiến ứng dụng boot thành công nhưng lăn đùng ra chết khi nhận transaction đầu tiên lúc 2 giờ sáng.

Spring Boot cung cấp một trong những hệ thống quản lý cấu hình ngoại hóa (Externalized Configuration) mạnh mẽ nhất thế giới phần mềm. Để làm chủ nó, bạn không thể dừng lại ở việc biết điền vài dòng vào <code>application.yml</code>. Bạn phải thấu hiểu cặn kẽ: **17 tầng thứ tự ưu tiên**, quy tắc **Relaxed Binding 2.0**, kỹ thuật **Fail-Fast Validation**, và kiến trúc bảo mật Secret trên Cloud/Kubernetes.

---

## 1. Kiến trúc Nạp Cấu hình & 17 Tầng Thứ tự Ưu tiên (Order of Precedence)

Khi Spring Boot khởi động, cỗ máy <code>ConfigDataEnvironmentPostProcessor</code> sẽ nạp cấu hình từ nhiều nguồn khác nhau vào đối tượng <code>Environment</code> (gồm các <code>PropertySource</code>). Khi hai nguồn cùng định nghĩa một khóa (key), giá trị ở tầng có **độ ưu tiên cao hơn sẽ đè bẹp (override) giá trị ở tầng thấp hơn**.

Dưới đây là bảng 17 tầng ưu tiên theo chuẩn chính thức của Spring Boot 3 (xếp từ THẤP NHẤT đến CAO NHẤT):

~~~text
          THỨ TỰ ƯU TIÊN NGUỒN CẤU HÌNH (THẤP ĐẾN CAO)
          
  [TẦNG 1]  Default properties (SpringApplication.setDefaultProperties)
     ▲
  [TẦNG 2]  @PropertySource trên các @Configuration class
     ▲
  [TẦNG 3]  Config data (application.yml / application.properties) nằm TRONG JAR
     ▲
  [TẦNG 4]  Profile-specific config (application-{profile}.yml) nằm TRONG JAR
     ▲
  [TẦNG 5]  Config data (application.yml) nằm NGOÀI JAR (thư mục ./config)
     ▲
  [TẦNG 6]  Profile-specific config (application-{profile}.yml) nằm NGOÀI JAR
     ▲
  [TẦNG 7]  OS Environment Variables (SPRING_APPLICATION_JSON)
     ▲
  [TẦNG 8]  Standard OS Environment Variables (export DB_PASSWORD=...)
     ▲
  [TẦNG 9]  Java System Properties (-Dspring.datasource.password=...)
     ▲
  [TẦNG 10] JNDI attributes (java:comp/env)
     ▲
  [TẦNG 11] ServletConfig init parameters
     ▲
  [TẦNG 12] ServletContext init parameters
     ▲
  [TẦNG 13] Command Line Arguments (--server.port=9090 --spring.profiles.active=prod)
     ▲
  [TẦNG 14] TestPropertySource / @SpringBootTest(properties = "...") trong JUnit Test
     ▲
  [TẦNG 15] @DynamicPropertySource trong Testcontainers
     ▲
  [TẦNG 16] DevTools global settings (~/.config/spring-boot-devtools.properties)
     ▲
  [TẦNG 17] SpringApplication.from(...) trong Dev Mode
~~~

:::tip QUY TẮC VÀNG TRONG PRODUCTION (12-FACTOR APP)
**"Build once, deploy anywhere"**: File <code>.jar</code> hoặc Docker Image chỉ được đóng gói đúng **1 LẦN DUY NHẤT** tại CI/CD pipeline. 
Mọi thông số biến đổi theo môi trường (URL, Port, Secret, Quota) bắt buộc phải được bơm từ bên ngoài qua **Tầng 8 (OS Environment Variables)** hoặc **Tầng 6 (ConfigMap/Secret mount trong Kubernetes)**. Không bao giờ rebuild image chỉ vì thay đổi mật khẩu database!
:::

---

## 2. Kỹ thuật Relaxed Binding 2.0 & Chuyển đổi Kiểu dữ liệu

Spring Boot có cơ chế ánh xạ tên thuộc tính cực kỳ thông minh gọi là **Relaxed Binding**. Một thuộc tính trong Java Class có thể khớp với nhiều kiểu viết khác nhau trong YAML hoặc Biến môi trường:

| Định dạng | Ví dụ trong YAML / Env | Mục đích sử dụng |
|---|---|---|
| **kebab-case** | <code>app.payment-gateway.connect-timeout</code> | **Chuẩn khuyên dùng trong file .yml / .properties** |
| **camelCase** | <code>app.paymentGateway.connectTimeout</code> | Chuẩn trong code Java thông thường |
| **snake_case** | <code>app.payment_gateway.connect_timeout</code> | Phổ biến ở các hệ thống Python/C/Legacy |
| **UPPER_SNAKE_CASE** | <code>APP_PAYMENTGATEWAY_CONNECTTIMEOUT</code> | **Bắt buộc khi dùng Biến môi trường OS (Docker / Kubernetes)** |

### Hỗ trợ chuyển đổi tự động các kiểu dữ liệu thời gian & dung lượng:
Không cần phải tự viết code nhân chia milliseconds hay bytes! Spring Boot tự động parse các đơn vị:
- **Thời gian (<code>java.time.Duration</code>)**: <code>10ms</code>, <code>500ms</code>, <code>2s</code>, <code>5m</code>, <code>1h</code>, <code>2d</code>.
- **Dung lượng bộ nhớ (<code>org.springframework.util.unit.DataSize</code>)**: <code>100B</code>, <code>10KB</code>, <code>50MB</code>, <code>2GB</code>, <code>1TB</code>.

---

## 3. Toàn bộ Code Sản Xuất: Banking Gateway Configuration

Hãy xem một hệ thống thanh toán ngân hàng yêu cầu cấu hình cực kỳ nghiêm ngặt: Kết nối an toàn, cơ chế Timeout, Retry Policy, và kiểm định tính hợp lệ ngay lúc boot (Fail-Fast).

### Bước 1: Khai báo cấu trúc bất biến với Java Record

~~~java
package vn.mastery.banking.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.util.unit.DataSize;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;
import java.util.List;

@Validated
@ConfigurationProperties(prefix = "app.bank-gateway")
public record BankGatewayProperties(
    @NotBlank(message = "Mã định danh ngân hàng (bankCode) không được để trống")
    String bankCode,

    @NotBlank(message = "Endpoint URL không được để trống")
    @Pattern(regexp = "^https://.*", message = "Endpoint ngân hàng bắt buộc phải dùng giao thức an toàn HTTPS")
    String endpointUrl,

    @Valid
    @NotNull(message = "Cấu hình Connection Pool không được null")
    ConnectionPool connectionPool,

    @Valid
    @NotNull(message = "Cấu hình Retry không được null")
    RetryPolicy retry,

    @NotNull(message = "Giới hạn dung lượng payload không được null")
    DataSize maxPayloadSize,

    List<@NotBlank String> supportedCurrencies
) {
    public record ConnectionPool(
        @Min(value = 5, message = "Pool size tối thiểu là 5")
        @Max(value = 100, message = "Pool size tối đa là 100 để bảo vệ tài nguyên")
        int maxTotalConnections,

        @NotNull(message = "Connect timeout không được null")
        Duration connectTimeout,

        @NotNull(message = "Read timeout không được null")
        Duration readTimeout,

        @DefaultValue("true")
        boolean keepAlive
    ) {}

    public record RetryPolicy(
        @Min(value = 1, message = "Số lần retry tối thiểu là 1")
        @Max(value = 5, message = "Số lần retry tối đa là 5 để tránh cascade failure")
        int maxAttempts,

        @NotNull(message = "Backoff duration không được null")
        Duration initialBackoff,

        @DecimalMin(value = "1.0", message = "Multiplier tối thiểu là 1.0")
        @DecimalMax(value = "3.0", message = "Multiplier tối đa là 3.0")
        double backoffMultiplier
    ) {}
}
~~~

### Bước 2: Kích hoạt quét cấu hình trên Application Class

~~~java
package vn.mastery.banking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan(basePackages = "vn.mastery.banking.config")
public class BankingApplication {
    public static void main(String[] args) {
        SpringApplication.run(BankingApplication.class, args);
    }
}
~~~

### Bước 3: Cấu hình chuẩn trong application.yml

~~~yaml
app:
  bank-gateway:
    bank-code: "VCB_DIRECT"
    endpoint-url: "https://api.vietcombank.com.vn/v1/transfer"
    connection-pool:
      max-total-connections: 20
      connect-timeout: 3s
      read-timeout: 10s
      keep-alive: true
    retry:
      max-attempts: 3
      initial-backoff: 500ms
      backoff-multiplier: 2.0
    max-payload-size: 5MB
    supported-currencies:
      - "VND"
      - "USD"
      - "EUR"
~~~

### Bước 4: Service sử dụng trực tiếp Type-safe Configuration

~~~java
package vn.mastery.banking.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import vn.mastery.banking.config.BankGatewayProperties;

@Service
public class BankGatewayClient {
    private static final Logger log = LoggerFactory.getLogger(BankGatewayClient.class);
    private final BankGatewayProperties props;

    public BankGatewayClient(BankGatewayProperties props) {
        this.props = props;
        log.info("Khởi tạo BankGatewayClient: BankCode={}, Timeout={}ms, MaxPayload={} bytes",
            props.bankCode(),
            props.connectionPool().connectTimeout().toMillis(),
            props.maxPayloadSize().toBytes()
        );
    }

    public void processTransfer(String accountNo, double amount, String currency) {
        if (!props.supportedCurrencies().contains(currency)) {
            throw new IllegalArgumentException("Đồng tiền không được hỗ trợ: " + currency);
        }
        log.info("Chuyển tiền tới {} qua cổng {}, Timeout={}s",
            accountNo, props.endpointUrl(), props.connectionPool().readTimeout().toSeconds());
    }
}
~~~

---

## 4. Thử nghiệm & Xác thực Thực tế (Real-world Verification)

### Kịch bản 1: Kiểm thử Fail-Fast khi Cấu hình Sai
Điều gì xảy ra nếu một kỹ sư vô tình đặt <code>endpoint-url</code> là <code>http://...</code> (không bảo mật) hoặc <code>max-total-connections: 0</code>?

Khởi động ứng dụng, Spring Boot lập tức chặn đứng quá trình startup và ném ra **BindValidationException**:

~~~text
***************************
APPLICATION FAILED TO START
***************************

Description:

Binding to target org.springframework.boot.context.properties.bind.BindResult@7f35b2 failed:

    Property: app.bank-gateway.endpoint-url
    Value: "http://insecure.bank.com"
    Reason: Endpoint ngân hàng bắt buộc phải dùng giao thức an toàn HTTPS

    Property: app.bank-gateway.connection-pool.max-total-connections
    Value: 0
    Reason: Pool size tối thiểu là 5

Action:

Update your application's configuration
~~~

Ứng dụng dừng ngay lập tức trong 0.8 giây, ngăn ngừa hoàn toàn nguy cơ chạy trên môi trường thật với thông số hỏng hóc!

### Kịch bản 2: Tra cứu Nguồn gốc Cấu hình với Actuator /env

~~~bash
curl -X GET "http://localhost:8080/actuator/env/app.bank-gateway.bank-code"
~~~

JSON phản hồi bóc tách chính xác giá trị đang active và các nguồn cấu hình đã bị override:

~~~json
{
  "property": {
    "source": "systemEnvironment",
    "value": "VCB_PRODUCTION"
  },
  "activeProfiles": ["prod"],
  "propertySources": [
    {
      "name": "systemEnvironment",
      "property": {
        "value": "VCB_PRODUCTION"
      }
    },
    {
      "name": "Config resource 'class path resource [application-prod.yml]' via location 'optional:classpath:/'",
      "property": {
        "value": "VCB_STAGING"
      }
    },
    {
      "name": "Config resource 'class path resource [application.yml]' via location 'optional:classpath:/'",
      "property": {
        "value": "VCB_DIRECT"
      }
    }
  ]
}
~~~

Nhìn vào JSON trên, bạn biết ngay: Giá trị trong file <code>application.yml</code> gốc là <code>VCB_DIRECT</code>, bị <code>application-prod.yml</code> ghi đè thành <code>VCB_STAGING</code>, và cuối cùng bị biến môi trường của hệ điều hành <code>systemEnvironment</code> ghi đè thành <code>VCB_PRODUCTION</code>!

### Kịch bản 3: Bảo mật Tuyệt đối — Sanitize Secret trên Actuator
Mặc định, các thông tin nhạy cảm như Password, Token, Private Key phải được che giấu trên Actuator. Cấu hình bảo mật trong <code>application.yml</code>:

~~~yaml
management:
  endpoint:
    env:
      show-values: when_authorized
      roles: "SYSTEM_ADMIN"
  endpoints:
    web:
      exposure:
        include: "env,health,configprops"
~~~

Khi người dùng không đủ quyền truy vấn, Actuator sẽ tự động thay thế giá trị thành <code>******</code>!

---

## 5. Ba Cạm bẫy Chết người & Sự cố Hạ tầng (Production Pitfalls)

### Cạm bẫy 1: Biến Môi trường trong Docker Container không đè được do Sai Quy tắc Đặt tên
Khi đóng gói ứng dụng vào Docker, bạn muốn ghi đè thuộc tính <code>app.bank-gateway.connection-pool.max-total-connections</code>.
Nhiều kỹ sư DevOps viết trong file <code>docker-compose.yml</code>:
~~~yaml
environment:
  - APP_BANK_GATEWAY_CONNECTION_POOL_MAX_TOTAL_CONNECTIONS=50 # ❌ SAI QUY TẮC!
~~~
Hệ quả: Spring Boot không nhận được biến này vì relaxed binding đối với dấu gạch ngang (kebab-case) và dấu chấm (dot) trong env var được quy ước:
**Quy tắc chuẩn**:
1. Thay dấu chấm <code>.</code> bằng dấu gạch dưới <code>_</code>.
2. Xóa bỏ dấu gạch ngang <code>-</code> trong kebab-case (hoặc gộp lại không gạch).
3. Viết hoa toàn bộ: <code>APP_BANKGATEWAY_CONNECTIONPOOL_MAXTOTALCONNECTIONS=50</code>.

### Cạm bẫy 2: Lỗi Duplicate Bean Definition khi kết hợp @Component và @EnableConfigurationProperties
Nếu bạn vừa khai báo:
~~~java
@Component // ❌ KHÔNG DÙNG CÙNG LÚC
@ConfigurationProperties(prefix = "app.bank-gateway")
public record BankGatewayProperties(...) {}
~~~
Và trong một class Config khác bạn lại khai báo:
~~~java
@Configuration
@EnableConfigurationProperties(BankGatewayProperties.class) // ❌ TRÙNG LẶP
public class AppConfig {}
~~~
Spring Boot sẽ cố gắng đăng ký bean này **2 LẦN**, dẫn đến xung đột hoặc cảnh báo <code>Overriding bean definition for bean 'bankGatewayProperties'</code>.
**Chuẩn công nghiệp**: Chỉ dùng duy nhất một annotation <code>@ConfigurationPropertiesScan</code> trên Application Class, không gắn <code>@Component</code> lên record cấu hình.

### Cạm bẫy 3: Hardcode Secret trong Git Repository
Một thói quen nguy hiểm là tạo file <code>application-prod.yml</code> chứa password database thật rồi commit lên Git:
~~~yaml
# ❌ CỰC KỲ NGUY HIỂM:
spring:
  datasource:
    password: "ProductionSuperSecret2026@"
~~~
Kể cả repository nội bộ công ty (Private Repo), bất kỳ ai từng clone repo hoặc các bot quét mã độc trên mạng đều có thể lục lọi Git History và chiếm đoạt quyền kiểm soát cơ sở dữ liệu.
**Quy tắc bắt buộc**: 
~~~yaml
spring:
  datasource:
    password: \${DB_PASSWORD} # ✓ Bắt buộc lấy từ biến môi trường hoặc Kubernetes Secret!
~~~

---

## 6. Thử thách Thực chiến (Hands-on Challenge)

### Đề bài:
Xây dựng Module Cấu hình cho **Hệ thống Đối soát Giao dịch Ban đêm (Nightly Reconciliation Batch)** của ngân hàng:
1. Tạo record <code>BatchReconProperties</code> có prefix là <code>app.batch.recon</code>.
2. Yêu cầu kiểm tra tính hợp lệ lúc khởi động (Fail-fast Validation):
   - <code>chunkSize</code>: Số lượng giao dịch mỗi batch, bắt buộc từ 100 đến 10,000.
   - <code>maxThreads</code>: Số luồng xử lý đồng thời, từ 1 đến 32.
   - <code>jobTimeout</code>: Kiểu <code>Duration</code>, tối thiểu 5 phút và tối đa 4 giờ.
   - <code>storageQuota</code>: Kiểu <code>DataSize</code>, tối đa 50GB.
   - <code>notificationEmails</code>: Danh sách email nhận báo cáo, mỗi phần tử phải đúng định dạng <code>@Email</code>.
3. Viết một cấu hình YAML mẫu cho môi trường Local (Dev) và một chuỗi lệnh Bash xuất các biến môi trường Docker tương ứng cho Production.

### Lời giải Chuẩn Kỹ sư Cấp cao:

~~~java
package vn.mastery.batch.config;

import jakarta.validation.constraints.*;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.util.unit.DataSize;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;
import java.util.List;

@Validated
@ConfigurationProperties(prefix = "app.batch.recon")
public record BatchReconProperties(
    @Min(value = 100, message = "Chunk size tối thiểu là 100 giao dịch")
    @Max(value = 10000, message = "Chunk size tối đa là 10,000 để tránh tràn bộ nhớ JVM Heap")
    int chunkSize,

    @Min(value = 1, message = "Số worker thread tối thiểu là 1")
    @Max(value = 32, message = "Số worker thread tối đa là 32 để tránh context switching")
    int maxThreads,

    @NotNull(message = "Job timeout không được null")
    Duration jobTimeout,

    @NotNull(message = "Storage quota không được null")
    DataSize storageQuota,

    @NotEmpty(message = "Danh sách email nhận thông báo đối soát không được rỗng")
    List<@NotBlank @Email(message = "Email không đúng định dạng RFC 5322") String> notificationEmails,

    @DefaultValue("true")
    boolean dryRunMode
) {}
~~~

### File cấu hình application-dev.yml:

~~~yaml
app:
  batch:
    recon:
      chunk-size: 500
      max-threads: 4
      job-timeout: 15m
      storage-quota: 2GB
      dry-run-mode: true
      notification-emails:
        - "developer@mastery.vn"
        - "lead-dev@mastery.vn"
~~~

### Lệnh truyền biến môi trường Production trong Docker/Kubernetes:

~~~bash
# Xuất biến môi trường chuẩn xác tuân theo Relaxed Binding 2.0
export APP_BATCH_RECON_CHUNKSIZE=5000
export APP_BATCH_RECON_MAXTHREADS=16
export APP_BATCH_RECON_JOBTIMEOUT="2h"
export APP_BATCH_RECON_STORAGEQUOTA="20GB"
export APP_BATCH_RECON_DRYRUNMODE="false"
export APP_BATCH_RECON_NOTIFICATIONEMAILS_0_="ops@mastery.vn"
export APP_BATCH_RECON_NOTIFICATIONEMAILS_1_="reconciliation-lead@mastery.vn"

# Chạy ứng dụng với Profile prod
java -jar target/batch-recon-service.jar --spring.profiles.active=prod
~~~

:::takeaways
- **17 Tầng Thứ tự Ưu tiên**: Cấu hình từ xa (OS env, Command Line, Kubernetes ConfigMap) luôn ghi đè cấu hình đóng gói bên trong file JAR.
- **Fail-Fast lúc Startup**: Luôn sử dụng <code>@ConfigurationProperties</code> kết hợp <code>@Validated</code> để bắt mọi lỗi sai cấu hình trước khi ứng dụng kịp phục vụ traffic.
- **Đơn vị Tự nhiên**: Tận dụng <code>Duration</code> và <code>DataSize</code> để cấu hình thời gian và dung lượng một cách minh bạch, tránh nhầm lẫn giữa giây và mili-giây.
- **Bảo mật Bí mật**: Không bao giờ commit credentials vào Git. Sử dụng Actuator Sanitize để bảo vệ dữ liệu nhạy cảm khỏi bị rò rỉ.
:::
`
    },
    {
      id: "1-5",
      type: "lesson",
      title: "Spring Events — Decoupling trong JVM & @TransactionalEventListener",
      minutes: 45,
      content: `
## Không phải mọi sự kiện đều cần đến Kafka

Khi một người dùng đăng ký tài khoản hoặc đặt hàng thành công, hệ thống thường phải thực hiện hàng loạt tác vụ phụ (side-effects):
1. Gửi email chào mừng và SMS OTP.
2. Ghi nhật ký kiểm toán (Audit Trail) để đối soát pháp lý.
3. Kích hoạt tính điểm thưởng loyalty.
4. Đẩy thông báo đẩy (Push Notification) về ứng dụng di động.

Nếu bạn viết toàn bộ những thao tác này trong một phương thức <code>OrderService.createOrder()</code>:
- Code vi phạm nghiêm trọng nguyên lý Single Responsibility (Đơn trách nhiệm). Service biết quá nhiều thứ không thuộc về nghiệp vụ bán hàng.
- Lỗi ở bước gửi email sẽ làm **văng ngoại lệ và rollback toàn bộ đơn hàng của khách**!
- Thời gian phản hồi API (Latency) tăng vọt từ 20ms lên 2000ms vì phải chờ các bên thứ ba trả lời.

Nhiều team vội vã kéo cụm Apache Kafka hoặc RabbitMQ vào chỉ để giải quyết bài toán này trong một ứng dụng Monolith hoặc một Microservice đơn lẻ. Đó là sự lãng phí tài nguyên và gia tăng chi phí vận hành (Operational Overhead). **Spring ApplicationEvent** chính là vũ khí tối thượng giúp bạn tách rời (decouple) các module bên trong một tiến trình JVM với hiệu năng tính bằng micro-giây.

---

## 1. Kiến trúc Sự kiện In-JVM & Cỗ máy Event Multicaster

Cơ chế sự kiện của Spring được điều khiển bởi <code>ApplicationEventPublisher</code> và <code>ApplicationEventMulticaster</code>:

~~~text
                   LUỒNG XỬ LÝ APPLICATION EVENT CỦA SPRING
                   
  [OrderService]
        │
        │ 1. events.publishEvent(new OrderCreatedEvent(orderId, amount))
        ▼
  [ApplicationEventPublisher]
        │
        ▼
  [SimpleApplicationEventMulticaster]
        │
        ├── (Mặc định: Đồng bộ / Cùng Thread)
        │     │
        │     ├── 2. Gọi InventoryListener.onOrderCreated()
        │     │      (Chạy TRONG Transaction của OrderService)
        │     │
        │     └── 3. Bắt gặp @TransactionalEventListener(phase = AFTER_COMMIT)
        │            │
        │            └── Đăng ký callback vào TransactionSynchronizationManager
        │
  [TransactionManager]
        │
        ├── Commit DB thành công!
        │     │
        │     ▼
        └── Kích hoạt các TransactionSynchronization callbacks:
              │
              ├── 4. Async Worker Thread Pool (evt-exec-1)
              │      └── EmailNotificationListener.sendEmail()
              │
              └── 5. Transaction Mới (Propagation.REQUIRES_NEW)
                     └── AuditLogListener.recordAudit()
~~~

### Bốn Pha Vòng đời của @TransactionalEventListener

Khác với <code>@EventListener</code> thông thường (chạy ngay lập tức khi publish), <code>@TransactionalEventListener</code> liên kết chặt chẽ với trạng thái của Transaction Database:

| Pha (TransactionPhase) | Thời điểm kích hoạt | Hành vi khi ném Ngoại lệ | Trường hợp sử dụng chuẩn |
|---|---|---|---|
| **BEFORE_COMMIT** | Ngay trước khi gửi lệnh COMMIT xuống DB. | **Làm rollback toàn bộ Transaction cha.** | Kiểm tra ràng buộc tồn kho cuối cùng, chuẩn bị dữ liệu audit cùng phiên. |
| **AFTER_COMMIT** (Mặc định) | Sau khi lệnh COMMIT xuống DB đã **thành công hoàn toàn**. | Không ảnh hưởng đến dữ liệu đã commit. | Gửi Email, bắn SMS, push notification, xóa cache Redis. |
| **AFTER_ROLLBACK** | Khi Transaction cha bị ngoại lệ và phải ROLLBACK. | Không ảnh hưởng đến kết quả rollback. | Dọn dẹp file tạm trên ổ đĩa, giải phóng lock phân tán, bắn cảnh báo SRE. |
| **AFTER_COMPLETION** | Luôn chạy khi transaction kết thúc (bất kể Commit hay Rollback). | Thực thi dọn dẹp chung. | Thu hồi tài nguyên, clear ThreadLocal context. |

---

## 2. Toàn bộ Code Sản Xuất: Order Placement & Post-Commit Workflow

Hãy triển khai một quy trình đặt hàng thương mại điện tử chuyên nghiệp: Đơn hàng lưu DB, kiểm tra kho trước khi commit, gửi email bất đồng bộ sau commit, và ghi log kiểm toán vào một transaction hoàn toàn độc lập.

### Bước 1: Khai báo Domain Event bất biến với Java Record

~~~java
package vn.mastery.order.event;

import java.math.BigDecimal;
import java.time.Instant;

public record OrderCreatedEvent(
    String orderId,
    String customerId,
    BigDecimal totalAmount,
    String customerEmail,
    Instant createdAt
) {
    public OrderCreatedEvent {
        if (orderId == null || orderId.isBlank()) {
            throw new IllegalArgumentException("orderId không được để trống");
        }
        if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("totalAmount phải lớn hơn 0");
        }
    }
}
~~~

### Bước 2: Publisher trong Transaction chính

~~~java
package vn.mastery.order.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.order.event.OrderCreatedEvent;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
public class OrderService {
    private static final Logger log = LoggerFactory.getLogger(OrderService.class);
    private final ApplicationEventPublisher eventPublisher;

    public OrderService(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @Transactional(rollbackFor = Exception.class)
    public String createOrder(String customerId, String email, BigDecimal amount) {
        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        log.info("[1. TRANSACTION GỐC] Đang ghi đơn hàng {} vào database...", orderId);
        // Giả lập lưu đơn hàng vào PostgreSQL
        
        log.info("[2. EVENT PUBLISH] Bắn sự kiện OrderCreatedEvent trong JVM...");
        eventPublisher.publishEvent(new OrderCreatedEvent(orderId, customerId, amount, email, Instant.now()));
        
        log.info("[3. TRANSACTION CHUẨN BỊ COMMIT] Kết thúc hàm createOrder.");
        return orderId;
    }
}
~~~

### Bước 3: Cấu hình Thread Pool riêng cho Event Listeners

~~~java
package vn.mastery.order.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncEventConfig {

    @Bean("orderEventExecutor")
    public Executor orderEventExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("evt-order-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}
~~~

### Bước 4: Ba Listener thực hiện 3 vai trò khác nhau

~~~java
package vn.mastery.order.listener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import vn.mastery.order.event.OrderCreatedEvent;

@Component
public class OrderProcessingListeners {
    private static final Logger log = LoggerFactory.getLogger(OrderProcessingListeners.class);

    // 1. CHẠY TRƯỚC KHI COMMIT: Nếu ném lỗi -> Rollback đơn hàng
    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onBeforeCommitReserveInventory(OrderCreatedEvent event) {
        log.info("[BEFORE_COMMIT] Kiểm tra khóa tồn kho cho đơn hàng: {}", event.orderId());
        // Nếu hết hàng: ném new OutOfStockException(...) -> Hủy Transaction đơn hàng
    }

    // 2. CHẠY SAU KHI COMMIT THÀNH CÔNG (BẤT ĐỒNG BỘ TRÊN POOL RIÊNG)
    @Async("orderEventExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAfterCommitSendEmail(OrderCreatedEvent event) {
        log.info("[AFTER_COMMIT - ASYNC] Đang gửi email xác nhận tới {}. Thread: {}", 
            event.customerEmail(), Thread.currentThread().getName());
        try {
            Thread.sleep(1500); // Giả lập độ trễ SMTP Network
        } catch (InterruptedException ignored) {}
        log.info("[AFTER_COMMIT - ASYNC] Gửi email thành công cho đơn: {}", event.orderId());
    }

    // 3. CHẠY SAU KHI COMMIT NHƯNG CẦN GHI DB AUDIT:
    // CỰC KỲ QUAN TRỌNG: Bắt buộc phải có @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onAfterCommitWriteAuditLog(OrderCreatedEvent event) {
        log.info("[AFTER_COMMIT - REQUIRES_NEW] Mở Transaction mới để ghi Audit Trail cho đơn: {}", event.orderId());
        // Ghi vào bảng audit_logs ở database
    }

    // 4. CHẠY KHI TRANSACTION BỊ ROLLBACK: Dọn dẹp tài nguyên
    @TransactionalEventListener(phase = TransactionPhase.AFTER_ROLLBACK)
    public void onRollbackCleanup(OrderCreatedEvent event) {
        log.warn("[AFTER_ROLLBACK] Đơn hàng {} bị lỗi rollback! Tiến hành giải phóng lock phân tán.", event.orderId());
    }
}
~~~

---

## 3. Thử nghiệm & Xác thực Thực tế (Real-world Verification)

### Kiểm thử Tự động với @RecordApplicationEvents (Spring Boot Test)

Spring Boot 2.7+ cung cấp annotation <code>@RecordApplicationEvents</code> giúp bạn kiểm tra chính xác các event đã được bắn ra mà không cần phải can thiệp vào tầng Listener:

~~~java
package vn.mastery.order;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import vn.mastery.order.event.OrderCreatedEvent;
import vn.mastery.order.service.OrderService;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@RecordApplicationEvents
class OrderServiceEventTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private ApplicationEvents applicationEvents;

    @Test
    void shouldPublishOrderCreatedEventWhenOrderIsSuccessful() {
        String orderId = orderService.createOrder("CUST-001", "alice@mastery.vn", new BigDecimal("450000"));

        assertThat(orderId).isNotBlank();

        // Kiểm tra chính xác 1 event loại OrderCreatedEvent đã được phát
        long count = applicationEvents.stream(OrderCreatedEvent.class).count();
        assertThat(count).isEqualTo(1);

        OrderCreatedEvent event = applicationEvents.stream(OrderCreatedEvent.class)
            .findFirst()
            .orElseThrow();
        assertThat(event.customerId()).isEqualTo("CUST-001");
        assertThat(event.customerEmail()).isEqualTo("alice@mastery.vn");
    }
}
~~~

### Nhật ký Thực tế trên Môi trường Console Production

Khi chạy API tạo đơn hàng, hãy quan sát trình tự chính xác của các Thread:

~~~text
[http-nio-8080-exec-1] INFO OrderService - [1. TRANSACTION GỐC] Đang ghi đơn hàng ORD-7C12F4A1 vào database...
[http-nio-8080-exec-1] INFO OrderService - [2. EVENT PUBLISH] Bắn sự kiện OrderCreatedEvent trong JVM...
[http-nio-8080-exec-1] INFO OrderProcessingListeners - [BEFORE_COMMIT] Kiểm tra khóa tồn kho cho đơn hàng: ORD-7C12F4A1
[http-nio-8080-exec-1] INFO OrderService - [3. TRANSACTION CHUẨN BỊ COMMIT] Kết thúc hàm createOrder.
[http-nio-8080-exec-1] DEBUG JpaTransactionManager - Initiating transaction commit
[http-nio-8080-exec-1] INFO OrderProcessingListeners - [AFTER_COMMIT - REQUIRES_NEW] Mở Transaction mới để ghi Audit Trail...
[evt-order-1]          INFO OrderProcessingListeners - [AFTER_COMMIT - ASYNC] Đang gửi email xác nhận tới alice@mastery.vn...
[evt-order-1]          INFO OrderProcessingListeners - [AFTER_COMMIT - ASYNC] Gửi email thành công cho đơn: ORD-7C12F4A1
~~~

Nhìn vào log trên, ta thấy: Request HTTP hoàn tất và trả về Client ngay sau khi commit DB xong. Việc gửi email chạy trên luồng <code>evt-order-1</code> độc lập, không giữ chân client dù mạng SMTP có chậm 1.5 giây!

---

## 4. Ba Cạm bẫy Chết người & Bài học Sự cố Thực tế

### Cạm bẫy 1: Sự cố "Phantom Notification" do dùng @EventListener thông thường
**Sự cố thực tế**: Khách hàng thanh toán qua ngân hàng thất bại (tài khoản không đủ số dư), đơn hàng trong Database bị rollback hoàn toàn. Tuy nhiên, khách hàng vẫn nhận được email "Chúc mừng bạn đã thanh toán thành công!".
**Nguyên nhân**: Lập trình viên sử dụng <code>@EventListener</code> thay vì <code>@TransactionalEventListener(phase = AFTER_COMMIT)</code>. 
<code>@EventListener</code> chạy **ngay thời điểm gọi <code>publishEvent()</code>**, khi đó Transaction chưa hề commit! Khi transaction văng lỗi ở các bước sau, email đã bay đi mất và không thể thu hồi.

### Cạm bẫy 2: Thao tác Database trong AFTER_COMMIT mà không có REQUIRES_NEW
**Hiện tượng**: Trong listener <code>AFTER_COMMIT</code>, bạn gọi <code>auditRepository.save(new AuditLog(...))</code> nhưng dữ liệu không hề xuất hiện trong Database, cũng không có bất kỳ dòng log lỗi nào!
**Nguyên nhân gốc rễ**: Tại thời điểm <code>AFTER_COMMIT</code>, Transaction cha đã commit và đã đóng kết nối (Connection Closed/Read-Only). Nếu method trong listener không gắn <code>@Transactional(propagation = Propagation.REQUIRES_NEW)</code>, Hibernate sẽ không thể mở kết nối mới để flush dữ liệu xuống đĩa!

### Cạm bẫy 3: Ngộ nhận In-Memory Event thay thế được Kafka/RabbitMQ
**Nguyên tắc kiến trúc**:
- Spring Events là **In-Memory & Best-Effort**. Nếu server bị sập nguồn, pod Kubernetes bị kill, hoặc JVM bị OutOfMemoryError, toàn bộ các event đang chờ trong ThreadPool sẽ **biến mất vĩnh viễn**.
- Dùng Spring Events cho: Email marketing, refresh cache cục bộ, audit trail không ảnh hưởng tiền bạc.
- Bắt buộc dùng Message Broker ngoài (Kafka/RabbitMQ kết hợp Transactional Outbox Pattern) cho: Trừ tiền ví điện tử, đồng bộ trạng thái đơn hàng liên dịch vụ, xuất hóa đơn tài chính.

---

## 5. Thử thách Thực chiến (Hands-on Challenge)

### Đề bài:
Xây dựng quy trình Xóa Tài khoản Khách hàng tuân thủ quy chuẩn bảo mật GDPR (User Account Deletion):
1. Khai báo <code>AccountDeletedEvent(String userId, String email, Instant requestedAt)</code>.
2. <code>UserService.deleteAccount(String userId)</code>:
   - Cập nhật trạng thái người dùng trong DB thành <code>DELETED</code> trong một <code>@Transactional</code>.
   - Bắn sự kiện <code>AccountDeletedEvent</code>.
3. Xây dựng bộ Listeners:
   - **Giai đoạn BEFORE_COMMIT**: Gọi hàm thu hồi toàn bộ token đăng nhập đang hoạt động trong Redis. Nếu Redis lỗi, hủy toàn bộ giao dịch xóa tài khoản.
   - **Giai đoạn AFTER_COMMIT**: 
     - Gửi email thông báo chia tay khách hàng qua ThreadPool bất đồng bộ.
     - Ghi nhận biên bản tuân thủ GDPR vào bảng <code>gdpr_compliance_log</code> trong một transaction mới hoàn toàn (<code>REQUIRES_NEW</code>).
   - **Giai đoạn AFTER_ROLLBACK**: Bắn thông báo log cảnh báo SRE rằng thao tác xóa tài khoản thất bại để rà soát bảo mật.

### Lời giải Chuẩn Kỹ sư Cấp cao:

~~~java
package vn.mastery.account.event;

import java.time.Instant;

public record AccountDeletedEvent(
    String userId,
    String email,
    Instant requestedAt
) {}
~~~

~~~java
package vn.mastery.account.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.account.event.AccountDeletedEvent;

import java.time.Instant;

@Service
public class UserService {
    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private final ApplicationEventPublisher eventPublisher;

    public UserService(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @Transactional(rollbackFor = Exception.class)
    public void deleteAccount(String userId, String email) {
        log.info("[1] Đánh dấu tài khoản {} thành DELETED trong Database", userId);
        
        eventPublisher.publishEvent(new AccountDeletedEvent(userId, email, Instant.now()));
        
        log.info("[2] Chuẩn bị hoàn tất transaction xóa tài khoản {}", userId);
    }
}
~~~

~~~java
package vn.mastery.account.listener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import vn.mastery.account.event.AccountDeletedEvent;

@Component
public class GdprAccountDeletionListener {
    private static final Logger log = LoggerFactory.getLogger(GdprAccountDeletionListener.class);

    // 1. BEFORE_COMMIT: Thu hồi session token. Nếu thất bại -> Hủy việc xóa tài khoản!
    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onBeforeCommitRevokeTokens(AccountDeletedEvent event) {
        log.info("[GDPR-BEFORE-COMMIT] Thu hồi toàn bộ JWT active tokens của user: {}", event.userId());
        // Giả lập logic Redis: nếu lỗi mạng ném IllegalStateException -> Rollback DB
    }

    // 2. AFTER_COMMIT: Gửi email bất đồng bộ
    @Async("orderEventExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAfterCommitSendGoodbyeEmail(AccountDeletedEvent event) {
        log.info("[GDPR-AFTER-COMMIT-ASYNC] Gửi email xác nhận xóa dữ liệu GDPR tới: {}", event.email());
    }

    // 3. AFTER_COMMIT: Ghi log kiểm toán pháp lý trong Transaction riêng biệt
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onAfterCommitRecordComplianceLog(AccountDeletedEvent event) {
        log.info("[GDPR-AFTER-COMMIT-AUDIT] Lưu chứng từ xóa dữ liệu cá nhân vào bảng gdpr_compliance_log cho user: {}", event.userId());
    }

    // 4. AFTER_ROLLBACK: Báo động đội SRE
    @TransactionalEventListener(phase = TransactionPhase.AFTER_ROLLBACK)
    public void onAfterRollbackAlertSecurity(AccountDeletedEvent event) {
        log.error("[GDPR-SECURITY-ALERT] Thao tác xóa tài khoản {} bị thất bại! Cần rà soát thủ công.", event.userId());
    }
}
~~~

:::takeaways
- **Tách rời Đơn trách nhiệm**: Spring Events giúp phân rã các tác vụ phụ (Email, Notification, Audit) ra khỏi nghiệp vụ lõi mà không cần kéo hệ thống hạ tầng phức tạp.
- **Quy tắc Vàng @TransactionalEventListener**: Luôn phân biệt rạch ròi <code>BEFORE_COMMIT</code> (có quyền làm rollback) và <code>AFTER_COMMIT</code> (chỉ chạy khi dữ liệu đã commit an toàn).
- **Thao tác DB sau Commit**: Trong <code>AFTER_COMMIT</code>, nếu cần lưu DB thì bắt buộc phải thêm <code>@Transactional(propagation = Propagation.REQUIRES_NEW)</code>.
- **Ranh giới công nghệ**: Spring Events là In-Memory (Best-Effort). Sự kiện liên quan đến tài chính, tiền tệ, hoặc cần tồn tại qua các sự cố sập server bắt buộc phải dùng Message Queue (Kafka/RabbitMQ) kết hợp Transactional Outbox Pattern.
:::
`
    },
    {
      id: "1-6",
      type: "lesson",
      title: "Feature Flags & Config Refresh — @RefreshScope, Dynamic Config & Zero-Downtime Releases",
      minutes: 45,
      content: `
## Đêm 2 giờ sáng và quyết định tắt một tính năng lỗi

Một kịch bản quen thuộc trong các dự án công nghệ:
Tính năng "Tích điểm thưởng nhân đôi" vừa được deploy lên production vào lúc nửa đêm. Đúng 1 giờ sáng, đội SRE phát hiện lỗi rò rỉ logic khiến khách hàng nhận điểm vô hạn lần.

Nếu hệ thống của bạn không có cấu hình động:
1. Developer phải sửa code để comment dòng tính điểm.
2. Tạo Pull Request, chờ Tech Lead duyệt.
3. Chờ CI/CD pipeline build image Docker (mất 10-15 phút).
4. Restart lại cụm Pod trên Kubernetes, gây gián đoạn dịch vụ và tiềm ẩn lỗi kết nối.

Trong khi đó, với kiến trúc **Feature Flags & Runtime Config Refresh**, một kỹ sư On-call chỉ cần đổi một cờ cấu hình và gửi lệnh HTTP trong đúng **15 giây** — tính năng lỗi lập tức tắt ngấm mà **không cần restart bất kỳ tiến trình nào**, không mất kết nối database, zero downtime!

---

## 1. Kiến trúc Tách biệt Deploy vs Release & Cơ chế @RefreshScope

Trong kỹ nghệ phần mềm hiện đại:
- **Deployment (Triển khai)**: Đưa mã nguồn mới lên server hoặc cụm Pod container một cách âm thầm (Dark Launch).
- **Release (Phát hành)**: Bật tính năng đó cho người dùng cuối nhìn thấy và sử dụng.

Khi hai khái niệm này được tách rời bằng Feature Flag, rủi ro triển khai giảm xuống gần như bằng 0.

### Cơ chế hoạt động của @RefreshScope bên trong Spring Container

Spring Framework thông thường chỉ có 2 scope chính: <code>singleton</code> và <code>prototype</code>. Spring Cloud giới thiệu thêm **<code>@RefreshScope</code>** — một Scope tùy biến cực kỳ tinh xảo:

~~~text
                 CƠ CHẾ HOẠT ĐỘNG CỦA @REFRESHSCOPE
                 
  [HTTP Request]
        │
        ▼
  [Proxy CGLIB của Bean @RefreshScope]
        │
        ├── Kiểm tra Cache của RefreshScope:
        │     • Target instance đã tồn tại trong Map chưa?
        │     • Có: Gọi thẳng target.method()
        │
  [SỰ KIỆN: POST /actuator/refresh]
        │
        ├── 1. ContextRefresher nạp lại Environment từ Config Server / Git / Consul
        ├── 2. Tính toán diff giữa cấu hình cũ và mới
        ├── 3. Bắn sự kiện RefreshScopeRefreshedEvent
        └── 4. RefreshScope xóa sạch (clear) toàn bộ Bean instance trong Cache Map
        
  [HTTP Request TIẾP THEO]
        │
        ▼
  [Proxy CGLIB của Bean @RefreshScope]
        │
        ├── Kiểm tra Cache: Target instance đang NULL!
        ├── Gọi BeanFactory.getBean() để TẠO INSTANCE MỚI TINH
        │     (Instance mới này đọc toàn bộ cấu hình mới vừa refresh)
        └── Lưu instance mới vào Cache & Thực thi request
~~~

:::tip BẢN CHẤT CỦA @REFRESHSCOPE LÀ GÌ?
Bean được đánh dấu <code>@RefreshScope</code> thực chất là một **Client-side Proxy**. Khi bạn gọi <code>/actuator/refresh</code>, Spring không hề kill container hay khởi động lại JVM. Nó chỉ đơn giản là vứt bỏ object cũ trong bộ nhớ và lười biếng (lazy) khởi tạo một object mới với thuộc tính mới ở request kế tiếp!
:::

---

## 2. Toàn bộ Code Sản Xuất: Canary Rollout & Dynamic Circuit Breaker

Hãy xây dựng một hệ thống thanh toán cấp tập đoàn hỗ trợ điều phối traffic dần dần (Canary Rollout 5% -> 50% -> 100%) và tích hợp chế độ bảo trì (Kill Switch) ngay lập tức.

### Bước 1: Dependency trong pom.xml

~~~xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter</artifactId>
    <version>4.1.0</version>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
~~~

### Bước 2: Cấu hình Type-safe với @RefreshScope

~~~java
package vn.mastery.payment.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.stereotype.Component;

@Component
@RefreshScope
@ConfigurationProperties(prefix = "app.payment.feature")
public class PaymentFeatureProperties {

    private boolean maintenanceMode = false;
    private boolean v2EngineEnabled = false;
    private int canaryRolloutPercentage = 0; // 0 đến 100%
    private long executionTimeoutMs = 3000;

    // Getters và Setters bắt buộc để ConfigurationProperties binding lại khi refresh
    public boolean isMaintenanceMode() { return maintenanceMode; }
    public void setMaintenanceMode(boolean maintenanceMode) { this.maintenanceMode = maintenanceMode; }

    public boolean isV2EngineEnabled() { return v2EngineEnabled; }
    public void setV2EngineEnabled(boolean v2EngineEnabled) { this.v2EngineEnabled = v2EngineEnabled; }

    public int getCanaryRolloutPercentage() { return canaryRolloutPercentage; }
    public void setCanaryRolloutPercentage(int canaryRolloutPercentage) { this.canaryRolloutPercentage = canaryRolloutPercentage; }

    public long getExecutionTimeoutMs() { return executionTimeoutMs; }
    public void setExecutionTimeoutMs(long executionTimeoutMs) { this.executionTimeoutMs = executionTimeoutMs; }
}
~~~

### Bước 3: Thuật toán Hash Bucket Ổn định & Service Điều phối

Khi rollout theo %, một yêu cầu sống còn là: **Cùng một user phải luôn rơi vào cùng một phiên bản (V1 hoặc V2)** trong suốt phiên làm việc, không được nhảy qua nhảy lại khiến khách hàng bị lỗi trải nghiệm.

~~~java
package vn.mastery.payment.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import vn.mastery.payment.config.PaymentFeatureProperties;

@Service
public class PaymentRoutingService {
    private static final Logger log = LoggerFactory.getLogger(PaymentRoutingService.class);
    private final PaymentFeatureProperties featureFlags;

    public PaymentRoutingService(PaymentFeatureProperties featureFlags) {
        this.featureFlags = featureFlags;
    }

    public String processPayment(String customerId, double amount) {
        // 1. Kiểm tra Kill Switch khẩn cấp
        if (featureFlags.isMaintenanceMode()) {
            log.warn("Cổng thanh toán đang ở chế độ bảo trì khẩn cấp!");
            throw new IllegalStateException("Hệ thống thanh toán đang bảo trì định kỳ. Vui lòng thử lại sau.");
        }

        // 2. Kiểm tra điều kiện Canary Rollout
        if (featureFlags.isV2EngineEnabled() && isEligibleForCanary(customerId)) {
            return executePaymentV2(customerId, amount);
        }

        return executePaymentV1(customerId, amount);
    }

    /**
     * Thuật toán Stable Hashing: Chia 100 bucket cố định theo ID khách hàng.
     */
    private boolean isEligibleForCanary(String customerId) {
        if (customerId == null) return false;
        
        // Dùng Math.floorMod để tránh lỗi số âm khi hashCode() == Integer.MIN_VALUE
        int bucket = Math.floorMod(customerId.hashCode(), 100);
        boolean eligible = bucket < featureFlags.getCanaryRolloutPercentage();
        
        log.debug("Customer [{}] thuộc Bucket [{}] - Ngưỡng Canary: [{}%] -> Phục vụ V2: {}",
            customerId, bucket, featureFlags.getCanaryRolloutPercentage(), eligible);
        return eligible;
    }

    private String executePaymentV1(String customerId, double amount) {
        log.info("[ENGINE-V1] Xử lý đơn thanh toán {} cho khách hàng {}", amount, customerId);
        return "SUCCESS_VIA_LEGACY_V1";
    }

    private String executePaymentV2(String customerId, double amount) {
        log.info("[ENGINE-V2-CANARY] Xử lý thanh toán hiệu năng cao cho khách hàng {}", customerId);
        return "SUCCESS_VIA_NEXTGEN_V2";
    }
}
~~~

---

## 3. Thử nghiệm & Xác thực Thực tế (Real-world Verification)

### Cấu hình mở Actuator Refresh Endpoint trong application.yml

~~~yaml
management:
  endpoints:
    web:
      exposure:
        include: "health,info,refresh,env"
  endpoint:
    refresh:
      enabled: true

app:
  payment:
    feature:
      maintenance-mode: false
      v2-engine-enabled: true
      canary-rollout-percentage: 10 # Chỉ thử nghiệm 10% người dùng
~~~

### Kịch bản cURL kiểm thử Hot-Reload không restart JVM:

#### 1. Kiểm tra thanh toán của User 1 (rơi vào Bucket 5 -> Được dùng V2):
~~~bash
curl -X POST "http://localhost:8080/api/v1/payments?customerId=CUST-1005&amount=200000"
# Trả về: SUCCESS_VIA_NEXTGEN_V2
~~~

#### 2. Kích hoạt Chế độ Bảo trì Khẩn cấp (Maintenance Mode):
Bạn thay đổi thuộc tính trong file cấu hình ngoài hoặc qua biến môi trường:
<code>app.payment.feature.maintenance-mode=true</code>

Gửi yêu cầu POST tới endpoint <code>/actuator/refresh</code>:

~~~bash
curl -X POST http://localhost:8080/actuator/refresh
~~~

Phản hồi JSON hiển thị danh sách chính xác các key cấu hình vừa được refresh:

~~~json
[
  "app.payment.feature.maintenance-mode"
]
~~~

#### 3. Kiểm tra lại ngay lập tức:
~~~bash
curl -i -X POST "http://localhost:8080/api/v1/payments?customerId=CUST-1005&amount=200000"
~~~

Kết quả phản hồi ngay lập tức sau 4 milliseconds:

~~~text
HTTP/1.1 503 Service Unavailable
Content-Type: application/json

{
  "status": 503,
  "error": "Service Unavailable",
  "message": "Hệ thống thanh toán đang bảo trì định kỳ. Vui lòng thử lại sau."
}
~~~

Toàn bộ ứng dụng không hề restart. Tiến trình JVM giữ nguyên. Cổng thanh toán đã được khóa an toàn!

---

## 4. Ba Cạm bẫy Chết người & Bài học Sự cố Thực tế

### Cạm bẫy 1: Gắn @RefreshScope lên DataSource hoặc Connection Pool (HikariCP)
**Sự cố thảm họa**: Một kỹ sư muốn đổi mật khẩu DB không cần restart nên đã gắn <code>@RefreshScope</code> lên bean <code>DataSource</code>.
Khi chạy <code>/actuator/refresh</code>, Spring hủy bean DataSource cũ. Toàn bộ 50 kết nối database đang mở của các transaction đang chuyển tiền của khách hàng bị ngắt đột ngột (Socket closed). Hàng trăm khách hàng bị trừ tiền ví nhưng không nhận được mã vé!
**Nguyên tắc**: Tuyệt đối **KHÔNG BAO GIỜ** gắn <code>@RefreshScope</code> lên các bean quản lý tài nguyên nặng có kết nối mạng (Stateful Connection): <code>DataSource</code>, <code>EntityManagerFactory</code>, <code>KafkaListenerContainerFactory</code>. Chỉ áp dụng cho các cấu hình nghiệp vụ nhẹ (Business Flags, Thresholds, Timeout).

### Cạm bẫy 2: Lỗi tràn số âm kinh điển với Math.abs()
Nhiều lập trình viên tính bucket người dùng bằng công thức:
~~~java
// ❌ BUG TO TOÁN HỌC TIỀM ẨN:
int bucket = Math.abs(customerId.hashCode()) % 100;
~~~
Trong Java, <code>Math.abs(Integer.MIN_VALUE)</code> (tương ứng -2,147,483,648) **VẪN LÀ MỘT SỐ ÂM** do tràn số nguyên 32-bit!
Khi một customerId tình cờ có hashCode là <code>Integer.MIN_VALUE</code>, bucket tính ra sẽ là một số âm (ví dụ: -48). Phép so sánh <code>bucket &lt; percentage</code> luôn đúng hoặc luôn sai bất thường tùy logic.
**Chuẩn kỹ thuật**: Luôn luôn dùng <code>Math.floorMod(hash, 100)</code> để đảm bảo kết quả luôn là một số nguyên dương từ 0 đến 99.

### Cạm bẫy 3: Nợ kỹ thuật Feature Flag (Flag Debt)
Một lỗi quản trị rất thường gặp: Sau khi tính năng V2 đã release thành công 100% trong 6 tháng, code cũ V1 và các nhánh <code>if-else</code> vẫn nằm lại trong codebase. 
Sau 2 năm, dự án tích tụ hơn 40 feature flags đan xen nhau, không ai dám xóa vì sợ ảnh hưởng.
**Quy tắc kỷ luật**:
- Mọi Release Flag khi sinh ra trong Jira **bắt buộc phải có một Sub-task "Dọn dẹp code cũ & Xóa cờ"** được lên lịch sau 2 sprint kể từ khi rollout 100%.
- Tách biệt rõ ràng 4 loại Flag:
  1. *Release Toggle*: Tạm thời (sống vài tuần).
  2. *Ops Toggle (Kill Switch)*: Dài hạn (dành cho chế độ bảo trì khẩn cấp).
  3. *Experiment Toggle (A/B Test)*: Ngắn hạn (đo lường tỷ lệ chuyển đổi).
  4. *Permission Toggle*: Vĩnh viễn (gói dịch vụ Free vs Premium theo Tenant).

---

## 5. Thử thách Thực chiến (Hands-on Challenge)

### Đề bài:
Xây dựng Động cơ Khuyến mãi Động (Dynamic Promotion Engine) cho hệ thống Thương mại Điện tử:
1. Tạo class <code>PromotionFeatureFlags</code> có <code>@RefreshScope</code> và <code>@ConfigurationProperties(prefix = "app.promo")</code> gồm:
   - <code>flashSaleEnabled</code> (boolean).
   - <code>discountPercentage</code> (int: từ 5% đến 50%).
   - <code>vipExclusiveOnly</code> (boolean).
2. Viết service <code>PromotionCalculator</code>:
   - Nhận vào <code>OrderAmount</code> và <code>isVipUser</code>.
   - Nếu <code>flashSaleEnabled == false</code> -> Không chiết khấu (giảm 0đ).
   - Nếu <code>vipExclusiveOnly == true</code> mà khách hàng không phải VIP -> Không chiết khấu.
   - Nếu thỏa mãn: Áp dụng chiết khấu theo tỉ lệ <code>discountPercentage</code> hiện thời.
3. Đảm bảo toàn bộ cấu hình có thể thay đổi nóng qua <code>/actuator/refresh</code> mà không cần build lại code.

### Lời giải Chuẩn Kỹ sư Cấp cao:

~~~java
package vn.mastery.promo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.stereotype.Component;

@Component
@RefreshScope
@ConfigurationProperties(prefix = "app.promo")
public class PromotionFeatureFlags {

    private boolean flashSaleEnabled = false;
    private int discountPercentage = 10;
    private boolean vipExclusiveOnly = false;

    public boolean isFlashSaleEnabled() { return flashSaleEnabled; }
    public void setFlashSaleEnabled(boolean flashSaleEnabled) { this.flashSaleEnabled = flashSaleEnabled; }

    public int getDiscountPercentage() { return discountPercentage; }
    public void setDiscountPercentage(int discountPercentage) { this.discountPercentage = discountPercentage; }

    public boolean isVipExclusiveOnly() { return vipExclusiveOnly; }
    public void setVipExclusiveOnly(boolean vipExclusiveOnly) { this.vipExclusiveOnly = vipExclusiveOnly; }
}
~~~

~~~java
package vn.mastery.promo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import vn.mastery.promo.config.PromotionFeatureFlags;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class PromotionCalculator {
    private static final Logger log = LoggerFactory.getLogger(PromotionCalculator.class);
    private final PromotionFeatureFlags promoFlags;

    public PromotionCalculator(PromotionFeatureFlags promoFlags) {
        this.promoFlags = promoFlags;
    }

    public BigDecimal calculateDiscount(BigDecimal orderAmount, boolean isVip) {
        if (!promoFlags.isFlashSaleEnabled()) {
            log.debug("Flash sale đang tắt. Giảm giá 0đ.");
            return BigDecimal.ZERO;
        }

        if (promoFlags.isVipExclusiveOnly() && !isVip) {
            log.info("Chương trình Flash Sale chỉ áp dụng riêng cho khách hàng VIP!");
            return BigDecimal.ZERO;
        }

        int percent = Math.min(50, Math.max(5, promoFlags.getDiscountPercentage()));
        BigDecimal discountFactor = BigDecimal.valueOf(percent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal discountAmount = orderAmount.multiply(discountFactor);

        log.info("Áp dụng chiết khấu Flash Sale {}%: Giảm {} cho đơn hàng {}", percent, discountAmount, orderAmount);
        return discountAmount;
    }
}
~~~

:::takeaways
- **Tách Deploy khỏi Release**: Dùng Feature Flag để đưa code lên production an toàn, kiểm soát thời điểm kích hoạt bằng cấu hình mà không phụ thuộc vào chu kỳ build.
- **Bản chất @RefreshScope**: Là một Dynamic Proxy xóa cache bean khi nhận sự kiện refresh, tái tạo bean mới với giá trị cấu hình mới ở request tiếp theo.
- **Phân bổ Canary Nhất quán**: Sử dụng <code>Math.floorMod(userId.hashCode(), 100)</code> để đảm bảo một người dùng luôn có trải nghiệm đồng nhất qua nhiều lần truy cập.
- **Cấm kỵ @RefreshScope trên Connection Pool**: Tuyệt đối không gắn refresh scope lên DataSource hay Rabbit/Kafka connection nếu không muốn làm đứt gãy kết nối mạng của các giao dịch đang diễn ra.
:::
`
    },
    {
      id: "1-7",
      type: "lesson",
      title: "Tự viết Custom Starter & Đào sâu @Conditional — biến thư viện nội bộ thành plug-and-play",
      minutes: 50,
      content: `
## 20 microservice cùng copy-paste cấu hình audit log — và bài toán thư viện dùng chung

Trong một tổ chức có nhiều team hoặc nhiều microservice, các bài toán như: ghi audit log chuẩn, tích hợp hệ thống đo lường (metrics), rate limiting, xử lý common exception hay header tracing thường bị lặp lại. Nếu copy-paste cấu hình thủ công:
1. Version thư viện phân mảnh, khó nâng cấp đồng loạt.
2. Mỗi service cấu hình một kiểu, format log/header không đồng nhất.
3. Rất khó để một service riêng lẻ ghi đè (override) hành vi mặc định khi cần.

**Spring Boot Starter** chính là lời giải tiêu chuẩn: đóng gói dependency và auto-configuration thành một gói "cắm là chạy", có thể cấu hình linh hoạt qua <code>application.yml</code>.

---

## 1. Kiến trúc 2 module chuẩn của một Starter

Theo chuẩn của Spring Boot team, một Starter chuyên nghiệp thường gồm 2 module:

~~~text
mycompany-audit-spring-boot-parent/
├── mycompany-audit-spring-boot-autoconfigure/   ← Chứa code logic, @AutoConfiguration & @Bean
└── mycompany-audit-spring-boot-starter/         ← Module rỗng (empty jar), chỉ gom dependency
~~~

- **Autoconfigure module**: Chứa code kiểm tra điều kiện (@Conditional), tạo bean, bind cấu hình.
- **Starter module**: Chỉ chứa file <code>pom.xml</code> khai báo dependency tới module autoconfigure và các thư viện cần thiết. Người dùng cuối chỉ cần thêm **duy nhất** dependency starter này.
*(Lưu ý: Với các dự án nội bộ vừa và nhỏ, bạn có thể gộp 2 module này thành 1 module duy nhất để đơn giản hóa quá trình build).*

## 2. Vũ khí tối thượng: Hệ sinh thái @Conditional

Tất cả sự "thông minh" của Spring Boot bắt nguồn từ các annotation điều kiện:

| Annotation | Ý nghĩa thực chiến | Trường hợp sử dụng |
|---|---|---|
| <code>@ConditionalOnClass(X.class)</code> | Chỉ tạo bean nếu class X có mặt trong classpath | Tích hợp Redis/Kafka khi thư viện client được import |
| <code>@ConditionalOnMissingBean(X.class)</code> | Chỉ tạo bean nếu người dùng **CHƯA** tự định nghĩa bean này | Cho phép user ghi đè (override) bean mặc định dễ dàng |
| <code>@ConditionalOnProperty(...)</code> | Bật/tắt theo cấu hình trong application.yml | Feature switch: <code>mastery.audit.enabled=true</code> |
| <code>@ConditionalOnWebApplication</code> | Chỉ chạy nếu app là web app (Servlet hoặc Reactive) | Filter, Interceptor, Controller advice |
| <code>@AutoConfigureAfter(X.class)</code> | Đảm bảo starter chạy sau một AutoConfig khác | Đảm bảo DataSourceAutoConfiguration đã chạy trước |

~~~java
@AutoConfiguration
@ConditionalOnClass(AuditManager.class)
@EnableConfigurationProperties(AuditProperties.class)
public class AuditAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(AuditRepository.class)
    public AuditRepository defaultAuditRepository() {
        return new InMemoryAuditRepository(); // Fallback nếu user không cấu hình DB
    }
}
~~~

## 3. Đăng ký AutoConfiguration trong Spring Boot 3+

:::warn BƯỚC ĐỆM QUAN TRỌNG TỪ SPRING BOOT 3
Trước Spring Boot 2.7, cơ chế auto-config được khai báo qua file <code>META-INF/spring.factories</code>.
Kể từ **Spring Boot 3.0+**, file này **đã bị loại bỏ** cho việc auto-configuration.
Bạn BẮT BUỘC phải tạo file:
<code>src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports</code>
:::

Nội dung file chỉ chứa tên đầy đủ (FQCN) của AutoConfiguration class:

~~~text
vn.mastery.starter.audit.AuditAutoConfiguration
~~~

Mỗi dòng một class. Khi ứng dụng khởi động, Spring Boot sẽ tự động quét file này và đưa class vào pipeline đánh giá điều kiện.

## 4. Thực hành: Xây dựng Audit Starter từng bước

### Bước 1: Class cấu hình Type-safe

~~~java
@ConfigurationProperties(prefix = "mastery.audit")
public record AuditProperties(
    boolean enabled,
    String serviceName,
    int maxQueueSize
) {
    public AuditProperties {
        if (serviceName == null || serviceName.isBlank()) {
            serviceName = "default-service";
        }
    }
}
~~~

### Bước 2: Service cốt lõi & Interface cho phép mở rộng

~~~java
public interface AuditSender {
    void send(AuditPayload payload);
}

public class HttpAuditSender implements AuditSender {
    private final AuditProperties properties;
    public HttpAuditSender(AuditProperties properties) { this.properties = properties; }

    @Override
    public void send(AuditPayload payload) {
        // Gửi audit log lên server tập trung
    }
}
~~~

### Bước 3: Class AutoConfiguration kết nối mọi thứ

~~~java
@AutoConfiguration
@ConditionalOnProperty(prefix = "mastery.audit", name = "enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(AuditProperties.class)
public class AuditAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(AuditSender.class)
    public AuditSender auditSender(AuditProperties properties) {
        return new HttpAuditSender(properties);
    }

    @Bean
    @ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
    @ConditionalOnMissingBean(AuditHttpFilter.class)
    public AuditHttpFilter auditHttpFilter(AuditSender sender, AuditProperties props) {
        return new AuditHttpFilter(sender, props);
    }
}
~~~

## 5. Kiểm thử AutoConfiguration với ApplicationContextRunner

Không cần khởi động toàn bộ server Tomcat để test starter! Spring Boot Test cung cấp công cụ ApplicationContextRunner cực kỳ mạnh mẽ và chạy trong vài mili-giây:

~~~java
class AuditAutoConfigurationTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
        .withConfiguration(AutoConfigurations.of(AuditAutoConfiguration.class));

    @Test
    void whenEnabled_thenBeansCreated() {
        runner.withPropertyValues("mastery.audit.enabled=true")
              .run(context -> {
                  assertThat(context).hasSingleBean(AuditSender.class);
                  assertThat(context).hasSingleBean(AuditHttpFilter.class);
              });
    }

    @Test
    void whenDisabled_thenNoBeansCreated() {
        runner.withPropertyValues("mastery.audit.enabled=false")
              .run(context -> {
                  assertThat(context).doesNotHaveBean(AuditSender.class);
              });
    }

    @Test
    void whenCustomBeanProvided_thenAutoConfigBacksOff() {
        runner.withUserConfiguration(CustomSenderConfig.class)
              .run(context -> {
                  assertThat(context).hasSingleBean(AuditSender.class);
                  assertThat(context).getBean(AuditSender.class).isInstanceOf(CustomAuditSender.class);
              });
    }
}
~~~

## 6. Ba cạm bẫy sống còn khi viết Starter

1. **Quên @ConditionalOnMissingBean**: Đây là lỗi phổ biến nhất. Nếu thiếu annotation này, khi một service muốn tự viết Custom Sender, Spring sẽ báo lỗi xung đột bean duplicate (NoUniqueBeanDefinitionException).
2. **Lạm dụng @ComponentScan trong starter**: KHÔNG BAO GIỜ đặt @ComponentScan trong AutoConfiguration class. Nó sẽ quét lan sang package của ứng dụng client, dẫn đến việc inject sai bean hoặc làm hỏng cấu hình của user.
3. **matchIfMissing = true vs false**: Nếu muốn tính năng mặc định được bật và chỉ tắt khi khai báo rõ ràng, luôn nhớ thuộc tính matchIfMissing = true.

:::laas ĐỐI CHIẾU HỆ THỐNG LAAS
Tại các hệ thống như LAAS, module common-security hoặc common-logging được xây dựng dưới dạng custom starter. Mọi service chỉ cần thêm dependency là tự động có filter bắt Header JWT, giải mã TenantContext và ghi log theo format JSON thống nhất, không một service nào phải cấu hình lại từ đầu.
:::

:::takeaways
- Starter = Dependency bundle + AutoConfiguration class + META-INF registration.
- Spring Boot 3+ dùng META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports.
- @ConditionalOnMissingBean là nguyên tắc lịch sự số 1 của Starter: cung cấp mặc định nhưng luôn nhường đường cho người dùng ghi đè.
- Dùng ApplicationContextRunner để kiểm thử các nhánh @Conditional nhanh chóng mà không cần chạy server.
- Không dùng @ComponentScan trong các class AutoConfiguration.
:::
`
    },
    {
      id: "1-quiz",
      type: "quiz",
      title: "Quiz Module 1 — Spring Core",
      minutes: 10,
      questions: [
        {
          level: "medium",
          scenario: "Interview nội bộ thăng cấp Senior: interviewer hỏi 'Vì sao team chuẩn code ép constructor injection thay vì @Autowired field cho tiện?'",
          q: "Lý do THUYẾT PHỤC nhất ủng hộ constructor injection?",
          options: [
            "Code gọn hơn — không cần viết setter",
            "Field final → immutable; không thể tồn tại object thiếu dependency; test không cần Spring context",
            "Spring khuyến nghị trong docs nên theo",
            "Field injection gây memory leak"
          ],
          answer: 1,
          explain: "3 lợi ích kỹ thuật cụ thể: (1) final = thread-safe, (2) compiler ép truyền đủ dependency — không có trạng thái nửa vời, (3) new Service(mock1, mock2) test được ngay không cần container.",
          why: [
            "Ngược lại — constructor injection dài dòng MORE code (phải khai báo field + constructor). Lý do 'gọn' là của field injection.",
            "✓ Đúng — đây là 3 lập luận kỹ thuật mạnh nhất, đặc biệt điểm (3): unit test chạy nhanh hơn hàng trăm lần vì không boot Spring context.",
            "Appeal to authority — đúng là docs khuyến nghị, nhưng interviewer muốn hiểu CƠ CHẾ, không phải 'vì người ta bảo'. Câu trả lời này không thuyết phục ở phỏng vấn senior.",
            "Sai sự thật — field injection không gây memory leak. Nó gây vấn đề testability và ẩn dependency, nhưng không leak memory."
          ]
        },
        {
          level: "easy",
          scenario: "Junior dev hỏi bạn: 'Em thêm spring-boot-starter-data-jpa vào pom, chưa viết dòng config nào, sao EntityManagerFactory tự có?'",
          q: "Cơ chế đằng sau 'ma thuật' này là gì?",
          options: [
            "Maven plugin tự sinh code cấu hình khi build",
            "@EnableAutoConfiguration đọc danh sách auto-config + @Conditional đánh giá classpath → tạo bean phù hợp",
            "IDE nhận diện starter và generate config",
            "Hibernate tự quét pom.xml khi khởi động"
          ],
          answer: 1,
          explain: "starter-data-jpa kéo class JPA vào classpath → @ConditionalOnClass(EntityManagerFactory.class) thỏa → JpaBaseConfiguration được kích hoạt → bean EMF + TransactionManager sinh ra.",
          why: [
            "Không có plugin Maven nào làm việc này. Build chỉ compile + package; hành vi runtime do Spring context quyết định.",
            "✓ Đúng — pipeline: đọc META-INF/spring/...AutoConfiguration.imports (~150 class) → từng class bị đánh giá bởi @ConditionalOnClass/OnProperty/OnMissingBean → bean chỉ tạo khi điều kiện thỏa. Classpath quyết định hành vi.",
            "IDE không tham gia runtime. App chạy trên Jenkins/K8s không có IDE vẫn 'ma thuật' y hệt.",
            "Hibernate không đọc pom.xml. Nó được HibernateJpaAutoConfiguration TẠO — chủ động bị gọi, không tự đứng dậy."
          ]
        },
        {
          level: "hard",
          scenario: "Bug production kinh điển ở LAAS: báo cáo tài chính giảm số dư (deduct balance) nhưng DB KHÔNG có transaction record. Code trông 'hoàn hảo', test pass, log không có lỗi.",
          q: "Đoạn code sau sai ở đâu?",
          code: "@Service\npublic class BalanceService {\n\n    public void deduct(String userId, long amount) {\n        validate(userId);          // (1)\n        doDeduct(userId, amount);  // (2)\n    }\n\n    @Transactional\n    public void doDeduct(String userId, long amount) {\n        balanceRepo.decrease(userId, amount);\n        txnRepo.insert(new Txn(userId, amount));\n    }\n}",
          options: [
            "Thiếu @Transactional ở method deduct() ngoài cùng",
            "Self-invocation: this.doDeduct() bypass proxy → @Transactional vô hiệu → 2 lệnh SQL chạy 2 transaction riêng (hoặc auto-commit), lỗi giữa chừng = mất dữ liệu",
            "Sai thứ tự — phải insert txn trước rồi mới decrease",
            "Phải dùng REQUIRES_NEW cho doDeduct"
          ],
          answer: 1,
          explain: "this.doDeduct() đi thẳng vào bean gốc KHÔNG qua proxy → advice @Transactional không được áp → balanceRepo và txnRepo mỗi cái chạy auto-commit riêng. decrease thành công nhưng insert fail = tiền mất không vết.",
          why: [
            "Chữa đúng chỗ nhưng không giải thích được triệu chứng — thêm @Transactional ở deduct() sẽ hoạt động, nhưng vẫn để lộ doDeduct public @Transactional là bẫy cho caller khác. Fix đúng gốc rễ là tách bean.",
            "✓ Đúng — đây là self-invocation, bug ẩn tệ nhất của Spring AOP. Test pass vì test thường gọi qua proxy (từ bean khác); production gọi this. Fix: chuyển doDeduct sang BalanceTxnService riêng và inject.",
            "Thứ tự không cứu được atomicity — đổi thứ tự chỉ đổi bên nào mất dữ liệu khi crash, vẫn 2 transaction riêng lẻ.",
            "REQUIRES_NEW chỉ có ý nghĩa KHI proxy được đi qua. Ở đây proxy bị bypass hoàn toàn nên propagation setting nào cũng vô nghĩa."
          ]
        },
        {
          level: "medium",
          scenario: "Bạn cần tạo bean RestClient từ thư viện công ty laas-common. Thư viện là jar compile — không thể sửa source để thêm @Component.",
          q: "Cách đăng ký bean đúng?",
          options: [
            "Tạo wrapper class extends RestClient rồi @Component",
            "Khai báo @Bean method trong @Configuration trả về instance đã cấu hình",
            "Dùng @Import(RestClient.class) ở app class",
            "Tạo file META-INF/spring.factories liệt kê RestClient"
            ],
          answer: 1,
          explain: "@Bean là cầu nối 'code ngoài tầm kiểm soát → Spring container'. Method trong @Configuration được container gọi 1 lần; instance được quản lý lifecycle đầy đủ.",
          why: [
            "Lan truyền wrapper — mỗi class mới của thư viện lại phải wrap một lần. Wrapper class chỉ hợp khi cần THÊM hành vi, không phải chỉ để đăng ký.",
            "✓ Đúng — đây chính là mục đích thiết kế của @Bean: 'tôi không sửa được class của thư viện, nhưng tôi kiểm soát được cách tạo instance'.",
            "@Import dành cho @Configuration class khác, không phải class thường. Nó sẽ import nhưng không gọi constructor với các dependency bạn cần.",
            "spring.factories là cơ chế của framework/library author (mức library), không phải cách ứng dụng đăng ký 1 bean đơn lẻ. Overkill và sai tầng."
          ]
        },
        {
          level: "medium",
          scenario: "Config service LAAS có 12 key nhóm app.notification.* (url, timeout, retries, pool-size...). Code cũ dùng @Value rải rác 12 chỗ, đổi 1 key phải tìm 12 nơi sửa.",
          q: "Refactor đúng hướng?",
          options: [
            "Gom 12 key vào interface constants class NotifKeys",
            "Record + @ConfigurationProperties(prefix = \"app.notification\") — bind cả nhóm, type-safe, validate được",
            "Tạo file .env và load bằng @PropertySource",
            "Viết utility đọc YAML bằng Jackson lúc start"
          ],
          answer: 1,
          explain: "@ConfigurationProperties gom nhóm key theo prefix → record field ↔ key mapping tự động. Thêm @Validated + Jakarta validation để fail-fast khi config sai format ngay lúc startup.",
          why: [
            "Vẫn stringly-typed và rải rác như cũ — chỉ đổi @Value thành Constants.X. Không có type check, không validate, không auto-complete.",
            "✓ Đúng — 1 record thay 12 @Value: có type (int/url không nhầm lẫn), validate được (@Min(1) cho pool-size), IDE gợi ý key, và refactor đổi tên field là IDE lo.",
            ".env chỉ dịch vấn đề sang chỗ khác — vẫn phải @Value từng key một, và .env không có cấu trúc nhóm theo prefix.",
            "Tự viết YAML parser = phát minh lại bánh xe, thêm bug surface, và mất toàn bộ integration với Spring env hierarchy (profile override, env var...)."
          ]
        },
        {
          level: "easy",
          scenario: "Review PR, bạn thấy @PostConstruct method gọi this.repo.findByName() để nạp cache. PR author nói 'constructor vẫn chạy trước repo nên chắc ổn'.",
          q: "Ai đúng?",
          options: [
            "Author đúng — constructor chạy trước nên repo sẵn sàng",
            "Reviewer đúng — dependency chưa chắc inject khi constructor chạy; @PostConstruct mới đảm bảo sau DI",
            "Cả hai đúng trong 2 ngữ cảnh khác nhau",
            "Cả hai sai — phải dùng @Bean(initMethod) mới chắc chắn"
          ],
          answer: 1,
          explain: "Thứ tự: Constructor → DI hoàn tất → @PostConstruct. Gọi dependency trong constructor = NullPointerException khi bean đó qua field/setter injection.",
          why: [
            "Sai — constructor của bean chạy TRƯỚC khi container inject dependency vào bean khác. this.repo có thể còn null. 'Chắc ổn' không phải kỹ thuật.",
            "✓ Đúng — @PostConstruct được gọi sau khi toàn bộ dependency injection xong. Đó chính là lý do hook này tồn tại: khởi tạo cần dependency mà an toàn.",
            "Không có ngữ cảnh nào constructor-dùng-dependency an toàn cả — trừ khi dependency được truyền QUA constructor đó (constructor injection). Nhưng @PostConstruct vẫn là chỗ chuẩn.",
            "@Bean(initMethod) tương đương @PostConstruct về thời điểm — không 'chắc chắn hơn'. Cả hai đều chạy sau DI."
          ]
        },
        {
          level: "medium",
          scenario: "Cần đo thời gian mọi method service của LAAS mà không sửa từng class. Tech lead gợi ý AOP.",
          q: "Pointcut chuẩn xác cho mọi method trong package service và package con?",
          options: [
            "execution(* vn.mastery..service..*(..))",
            "execution(* vn.mastery.service.*(..))",
            "within(vn.mastery..service..*)",
            "@annotation(Timed)"
          ],
          answer: 0,
          explain: "'..' giữa package = mọi package con; '..' cuối = mọi class/method/args. execution(* vn.mastery..service..*(..)) bắt mọi method của mọi class trong service + con.",
          why: [
            "✓ Đúng — phân tích từng phần: vn.mastery.. (package con bất kỳsâu) service.. (trong service hoặc con) *(..) (mọi method mọi args). Đây là pattern chuẩn cho cross-cutting metric.",
            "Thiếu 1 tầng — vn.mastery.service.* chỉ match method ở ĐÚNG package đó, không phủ package con như service.impl. Và * cuối thiếu — chỉ match package không match method.",
            "within() chọn theo class, bỏ lỡ thông tin signature — hoạt động nhưng execution() cho phép lọc thêm theo tên method/return type khi cần.",
            "Đòi hỏi sửa code thêm annotation từng method — phản đúng yêu cầu 'không sửa từng class'."
          ]
        },
        {
          "level": "medium",
          scenario: "Hai implementation NotificationSender: EmailSender và SmsSender. Service cần SMS cho path A, email cho path B, và default cho mọi path còn lại.",
          q: "Cấu hình inject nào đúng yêu cầu?",
          code: "@Service\npublic class NotifyService {\n    public NotifyService(\n        ??? NotificationSender sms,      // path A\n        ??? NotificationSender defaultSender  // path B + rest\n    ) { ... }\n}",
          options: [
            "@Primary trên SmsSender — rồi inject theo tên field",
            "@Qualifier(\"smsSender\") cho sms + @Primary trên EmailSender cho default",
            "Dùng @Inject @Named theo chuẩn JSR-330 thay @Autowired",
            "Tạo 2 constructor — mỗi cái inject 1 implementation"
          ],
          answer: 1,
          explain: "@Qualifier chỉ đích danh khi có nhiều candidate; @Primary đặt default khi không chỉ định. Kết hợp cả hai giải quyết mọi tình huống xung đột bean.",
          why: [
            "@Primary trên SMS nghĩa là MỌI inject không qualifier đều nhận SMS — ngược yêu cầu 'default là email'. Còn inject theo tên field chỉ hoạt động khi tên field trùng bean name — fragile.",
            "✓ Đúng — @Qualifier(\"smsSender\") đích danh SMS cho path A; @Primary trên EmailSender làm default cho mọi inject không qualifier. Quy tắc rõ, không phụ thuộc tên field.",
            "JSR-330 @Named về bản chất = @Qualifier của Spring — đổi bộ annotation không giải quyết vấn đề chọn bean. Vấn đề là LOGIC selection, không phải chuẩn annotation.",
            "2 constructor = Spring không biết chọn cái nào để inject → NoSuchBeanDefinitionException hoặc phải @Autowired marker. Thiết kế sai hướng."
          ]
        },
        {
          level: "hard",
          scenario: "Singleton ReportScheduler inject ReportBuilder (prototype). Dev than: 'Mỗi lần chạy job, builder vẫn là instance CŨ — state dồn ứ ngày càng sai số.'",
          q: "Chẩn đoán và fix?",
          code: "@Component\npublic class ReportScheduler {\n    private final ReportBuilder builder;   // inject 1 lần lúc startup\n\n    public ReportScheduler(ReportBuilder builder) {\n        this.builder = builder;         // đây là instance duy nhất mãi mãi\n    }\n}",
          options: [
            "Chuyển ReportBuilder thành singleton + clear state ở @PostConstruct",
            "Inject ObjectProvider<ReportBuilder> — mỗi getObject() gọi là instance prototype mới",
            "Dùng ApplicationContext.getBean() trực tiếp mỗi lần chạy",
            "Khai báo scope request cho ReportBuilder"
          ],
          answer:  1,
          explain: "Container inject prototype VÀO singleton đúng 1 LẦN lúc startup — instance đó bị giữ mãi. ObjectProvider là lazy handle: không giữ instance, chỉ 'xin mới' khi gọi.",
          why: [
            "Đánh mất toàn bộ lý do tồn tại prototype. Clear state thủ công = bug tiếp theo quên clear field mới. Vá bằng cách xóa tính năng.",
            "✓ Đúng — ObjectProvider<ReportBuilder> chỉ là 'voucher' lấy bean: scheduler giữ voucher, mỗi job redemption một instance sạch. Đây là pattern chuẩn Spring cho singleton→prototype.",
            "Chạy được nhưng anti-pattern Service Locator — class phụ thuộc container toàn cục, mất tính minh bạch DI, test phải mock context. ObjectProvider đạt cùng mục đích trong framework DI.",
            "scope request chỉ tồn tại trong ngữ cảnh HTTP request — job scheduler chạy background không có request → throw exception hoặc hành vi không xác định."
          ]
        },
        {
          level: "medium",
          scenario: "2h sang, job tinh diem LAAS dang spam loi va day log nghen CloudWatch. Hotfix can tat job NGAY, pipeline deploy mat 15 phut. Code da co @RefreshScope @ConfigurationProperties RuntimeFlags voi jobEnabled=true.",
          q: "Tat job khong restart, nhanh nhat va an toan nhat?",
          options: [
            "kubectl delete pod de pod moi doc config mac dinh jobEnabled=false",
            "Sua config nguon (DB/Config Server) thanh jobEnabled=false + POST /actuator/refresh — bean RefreshScope tao lai, job dung trong ~30s",
            "scale deployment ve 0 replica — khong pod khong job",
            "comment @Scheduled annotation roi cho hotfix deploy"
          ],
          answer: 1,
          explain: "Deploy khac release: flag ops ton tai dung vi kich ban nay. Sua gia tri tai nguon + refresh huy bean @RefreshScope — lan check dieu kien sau jobEnabled=false, khong build, khong restart, khong downtime. Scale 0 giet luon service khac trong pod; delete pod la restart vong vi vi config nguon van true.",
          why: [
            "Delete pod: config nguon van jobEnabled=true — pod moi doc lai dung gia tri do, job chay tiep",
            "Dung — kill switch 30 giay: sua nguon + refresh, bean tao lai voi gia tri moi",
            "Scale 0 tat CA service — collateral damage lon hon van de can sua",
            "Comment code van phai deploy 15 phut — mat dung loi the flag dang co"
          ]
        },
        {
          level: "hard",
          scenario: "Rollout redeem engine V2 theo %: redeemV2Percent=50. QA bao co user test hom qua thay V2, hom nay thay V1 — trai nghiem nhay loan, khong reproduce duoc bug.",
          q: "Nguyen nhan pho bien nhat cua bucket khong stable?",
          options: [
            "hashCode() cua String thay doi giua cac lan chay JVM",
            "Bucket tinh bang Math.abs(memberId.hashCode()) % 100 — abs(Integer.MIN_VALUE) tra so am, mot so user roi bucket am luon that bai so sanh",
            "Redis cache bucket bi expire giua chung",
            "Percent 50 qua lon gay race condition giua cac pod"
          ],
          answer: 1,
          explain: "Math.abs tran so: abs(MIN_VALUE) = MIN_VALUE (am) — user roi hash do luon bucket am, va khac hanh vi giua moi truong kiem. floorMod(hash, 100) chuan hoa luon ra [0,99] khong bao gio am — cung user luon cung bucket qua moi lan goi, moi pod. String.hashCode on dinh theo spec — khong doi giua lan chay.",
          why: [
            "String.hashCode duoc spec hoa — cung chuoi, cung gia tri, moi JVM",
            "Dung — abs(MIN_VALUE) la bay kinh dien; floorMod thay abs+% de luon duong va stable",
            "Bucket la ham thuan cua memberId.hashCode() — khong co state cache de expire",
            "Percent chi la nguong so sanh — khong tao race, chi doi ty le user duoc chon"
          ]
        },
        {
          level: "hard",
          scenario: "Aspect @Around log timing mọi method @Service. Dev báo cáo: metrics thống kê chỉ thấy redeem() mà KHÔNG thấy validateRisk() — dù cả 2 đều public trong RedeemService. Kiểm tra: validateRisk() được gọi từ redeem() bằng this.validateRisk().",
          q: "Vì sao aspect bỏ sót và hướng xử lý đúng?",
          options: [
            "Bug framework — @Around không hỗ trợ method public",
            "Self-invocation: this.validateRisk() gọi thẳng target KHÔNG qua proxy — advice không chặn được. Fix: tách validateRisk sang bean khác, hoặc self-inject proxy",
            "Pointcut thiếu — thêm validateRisk vào biểu thức execution là hết",
            "Đổi @Around thành @Before là chạy cho mọi method nội bộ"
          ],
          answer: 1,
          explain: "Spring AOP là proxy-based: advice chỉ chạy khi lời gọi ĐI QUA proxy (từ bean khác vào). this.xxx() là gọi nội bộ bên trong target — proxy không nằm giữa, aspect (và cả @Transactional) lặng lẽ không áp dụng. Đây là hành vi thiết kế, không phải bug. Fix chuẩn: tách method sang bean khác để gọi chéo qua proxy; self-injection (@Lazy tự inject) là phương án cục bộ khó đọc hơn.",
          why: [
            "@Around hoạt động tốt với public method — khi gọi QUA proxy",
            "✓ Proxy nằm ở ranh giới bean — this. nội bộ vòng qua nó",
            "Pointcut đúng cũng không cứu được lời gọi không qua proxy — vấn đề là đường gọi",
            "Loại advice không liên quan — không lời gọi nào qua proxy để advice chặn"
          ]
        }
      ]
    }
  ]
});
