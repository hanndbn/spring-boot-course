const fs = require('fs');
const path = require('path');

const modPath = path.join(__dirname, '..', 'js', 'content', 'module1.js');
global.window = { COURSE_MODULES: [], EXPANDED_QUIZZES: {} };
new Function('window', fs.readFileSync(modPath, 'utf8'))(window);

const mod = window.COURSE_MODULES[0];

// Diagram 1-1-2: Dynamic Bean Injection & ObjectProvider
const diag_1_1_2 = `
### Sơ Đồ Kiến Trúc: Cơ Chế Phân Giải Dynamic Bean & Khắc Phục Prototype Trong Singleton

\`\`\`mermaid
flowchart TD
    Client["CheckoutService (Singleton Scope)"]
    
    subgraph SpringContainer ["Spring ApplicationContext Container"]
        PrimaryBean["@Primary: MomoPaymentProcessor"]
        QualifierBean["@Qualifier('vnpay'): VNPayPaymentProcessor"]
        ProtoProvider["ObjectProvider&lt;InvoiceBuilder&gt; (Lazy Resolver)"]
        PrototypeFactory["Prototype Bean Factory: Sinh instance mới mỗi khi gọi getObject()"]
    end

    Client -->|Mặc định không qualifier| PrimaryBean
    Client -->|Chỉ định rõ @Qualifier| QualifierBean
    Client -->|Yêu cầu instance mới| ProtoProvider
    ProtoProvider -->|Kéo từ Container| PrototypeFactory
    PrototypeFactory -->|new InvoiceBuilder()| FreshInstance["Fresh Instance 1, 2, 3... (Không bị đóng băng)"]

    style PrimaryBean fill:#064e3b,stroke:#10b981,color:#fff
    style QualifierBean fill:#1e293b,stroke:#3b82f6,color:#fff
    style FreshInstance fill:#1e1b4b,stroke:#6366f1,color:#fff
\`\`\`
`;

// Diagram 1-1-3: Circular Dependency Deadlock & Event Solution
const diag_1_1_3 = `
### Sơ Đồ Khắc Phục: Circular Dependency Bằng Mô Hình Bất Đồng Bộ In-JVM Event

\`\`\`mermaid
flowchart TD
    subgraph Bug ["Cạm Bẫy: Vòng Tròn Phụ Thuộc (Startup Crash)"]
        OrderSvc["OrderService"] -->|Constructor injects| PaySvc["PaymentService"]
        PaySvc -->|Constructor injects| OrderSvc
        Crash["BeanCurrentlyInCreationException: Startup gãy hoàn toàn!"]
        OrderSvc -.-> Crash
        PaySvc -.-> Crash
    end

    subgraph Fixed ["Giải Pháp Kiến Trúc: Đảo Ngược Bằng ApplicationEvent"]
        OrderSvcFixed["OrderService (Tạo đơn hàng)"] -->|1. Publish| Event["OrderCreatedEvent (DTO bất biến)"]
        Event -->|2. Lắng nghe| PayListener["PaymentEventListener (@TransactionalEventListener)"]
        PayListener -->|3. Gọi xử lý| PaySvcFixed["PaymentService (Thực hiện trừ tiền ví)"]
    end

    style Bug fill:#7c2d12,stroke:#f97316,color:#fff
    style Fixed fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 1-2-1: Auto-Configuration Bootstrap Lifecycle
const diag_1_2_1 = `
### Sơ Đồ Vòng Đời: Cỗ Máy Khởi Động & Đánh Giá Điều Kiện Auto-Configuration

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor App as main() -> SpringApplication.run()
    participant Boot as Bootstrap / EnvironmentPrepared
    participant Selector as AutoConfigurationImportSelector
    participant Imports as AutoConfiguration.imports (~150 class)
    participant Evaluator as OnClass / OnMissingBean / OnProperty
    participant Context as ApplicationContext Bean Registry

    App->>Boot: Nạp cấu hình application.yml & OS Env
    Boot->>Selector: Kích hoạt quét Starter
    Selector->>Imports: Đọc danh sách FQN các class AutoConfiguration
    loop Đánh giá từng Class cấu hình
        Imports->>Evaluator: Kiểm tra @ConditionalOnClass (Thư viện có trong classpath?)
        Evaluator-->>Imports: Classpath thỏa mãn
        Imports->>Evaluator: Kiểm tra @ConditionalOnMissingBean (User đã tự viết bean chưa?)
        alt User chưa khai báo
            Evaluator-->>Imports: Điều kiện thỏa mãn
            Imports->>Context: Đăng ký BeanDefinition của Starter vào Context
        else User đã tự viết Custom Bean
            Evaluator-->>Imports: Lùi bước (Back off) - Không ghi đè bean của user
        end
    end
    Context-->>App: Khởi động Tomcat & Sẵn sàng phục vụ request
\`\`\`
`;

// Diagram 1-2-2: Custom Starter Multi-Module Architecture
const diag_1_2_2 = `
### Sơ Đồ Kiến Trúc: Thiết Kế Starter Chuẩn Doanh Nghiệp (Multi-Module Maven)

\`\`\`mermaid
graph TD
    ClientApp["ecommerce-web-api (Ứng Dụng Nghiệp Vụ)"]
    
    subgraph CustomStarter ["enterprise-audit-spring-boot-starter (Starter Đóng Gói)"]
        StarterPOM["enterprise-audit-spring-boot-starter<br/>(Module rỗng chỉ chứa pom.xml kết nối)"]
        AutoConf["enterprise-audit-spring-boot-autoconfigure<br/>(Chứa code logic, AuditFilter, Properties, Publisher)"]
        ImportsFile["META-INF/spring/<br/>...AutoConfiguration.imports"]
    end

    subgraph Integrations ["Tích Hợp Hạ Tầng Đa Môi Trường"]
        KafkaPub["KafkaAuditPublisher (@ConditionalOnClass KafkaTemplate)"]
        ConsolePub["ConsoleLogAuditPublisher (@ConditionalOnMissingBean)"]
    end

    ClientApp -->|pom.xml 1 dòng duy nhất| StarterPOM
    StarterPOM --> AutoConf
    AutoConf --> ImportsFile
    AutoConf --> KafkaPub
    AutoConf --> ConsolePub

    style ClientApp fill:#1e293b,stroke:#3b82f6,color:#fff
    style CustomStarter fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 1-2-3: Auto-Configuration Ordering Pipeline
const diag_1_2_3 = `
### Sơ Đồ Luồng: Thứ Tự Ưu Tiên Nạp Bean & Tránh Xung Đột @ConditionalOnMissingBean

\`\`\`mermaid
flowchart TD
    Start["Khởi Động Nạp Cấu Hình Spring Boot"] --> Step1["1. Quét Toàn Bộ User Beans (@ComponentScan / @Configuration)<br/>ƯU TIÊN CAO NHẤT"]
    Step1 --> Step2["2. Đánh Giá Các Custom AutoConfiguration (@AutoConfigureBefore)"]
    Step2 --> Step3["3. Đánh Giá Framework AutoConfiguration Mặc Định (DataSource, WebMvc)"]
    Step3 --> Step4["4. Kích Hoạt @ConditionalOnMissingBean (Lấp đầy khoảng trống)"]
    Step4 --> End["Toàn Bộ Bean Khởi Tạo Xong Hoàn Hảo"]

    subgraph PitfallBug ["CẠM BẪY CHẾT NGƯỜI: Đặt nhầm @ConditionalOnMissingBean trên User Config"]
        Bad1["User đặt @ConditionalOnMissingBean trên class config của mình"] --> Bad2["User Config chạy TRƯỚC khi Starter scan"]
        Bad2 --> Bad3["Bean của user bị bỏ qua ngẫu nhiên hoặc xung đột thứ tự scan!"]
    end

    style Step1 fill:#064e3b,stroke:#10b981,color:#fff
    style PitfallBug fill:#7c2d12,stroke:#f97316,color:#fff
\`\`\`
`;

// Diagram 1-3-2: AOP Distributed Audit Logging
const diag_1_3_2 = `
### Sơ Đồ Tuần Tự: Luồng Can Thiệp Của Distributed Audit Aspect (@Around)

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as HTTP Client (Mobile / Web)
    participant Dispatcher as DispatcherServlet
    participant Proxy as OrderService$$SpringCGLIB$$0 (Dynamic Proxy)
    participant Aspect as AuditAndMetricAspect (@Around)
    participant Target as OrderServiceImpl (Target Bean Thật)
    participant Kafka as Kafka Audit Topic / Metrics

    Client->>Dispatcher: POST /api/v1/orders/checkout
    Dispatcher->>Proxy: checkout(OrderRequest)
    Proxy->>Aspect: Intercept method call
    Note over Aspect: 1. Ghi nhận start_time & sinh correlation_id<br/>2. Che mờ thông tin PII (Mask password/card)
    Aspect->>Target: proceed() gọi code nghiệp vụ thực tế
    Target->>Target: Trừ kho & Tạo hóa đơn trong DB
    Target-->>Aspect: Trả về OrderResponse DTO
    Note over Aspect: 3. Đo lường duration = now - start_time<br/>4. Đóng gói AuditPayload
    Aspect->>Kafka: Async publish AuditEvent
    Aspect-->>Proxy: Return OrderResponse
    Proxy-->>Dispatcher: Return JSON
    Dispatcher-->>Client: 200 OK
\`\`\`
`;

// Diagram 1-3-3: Self-Invocation Proxy Bypass Trap
const diag_1_3_3 = `
### Sơ Đồ Cơ Chế: Thảm Họa Self-Invocation Vô Hiệu Hóa Spring AOP Proxy

\`\`\`mermaid
flowchart TD
    subgraph SelfInvocationBug ["SỰ CỐ RUNTIME: Self-Invocation Bypass Proxy"]
        Caller["Caller Ngoại Vi"] -->|Gọi| MethodA["public void deductBalance()<br/>(Trên Proxy)"]
        MethodA -->|Đi qua| BeanTarget["BalanceServiceImpl Bean Thật"]
        BeanTarget -->|Gọi trực tiếp: this.doDeduct()| MethodB["@Transactional public void doDeduct()<br/>(NỘI BỘ BEAN GỐC)"]
        MethodB --> Fatal["HẬU QUẢ: Hoàn toàn bypass qua Proxy!<br/>@Transactional vô hiệu, auto-commit từng câu SQL,<br/>crash giữa chừng = MẤT DỮ LIỆU KHÔNG THỂ ROLLBACK!"]
    end

    subgraph SolutionFix ["GIẢI PHÁP CHUẨN KỸ THUẬT: Tách Service Riêng Biệt"]
        CallerFix["Caller Ngoại Vi"] --> SvcA["BalanceService"]
        SvcA -->|Inject qua Constructor| ProxyB["TxnExecutionService$$CGLIB Proxy"]
        ProxyB -->|Bọc TransactionInterceptor| RealTxn["TxnExecutionService::doDeduct()"]
        RealTxn --> Safe["Giao dịch DB được bảo đảm Atomicity 100%!"]
    end

    style SelfInvocationBug fill:#7c2d12,stroke:#f97316,color:#fff
    style SolutionFix fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 1-4-1: 17-Layer Configuration Priority Hierarchy
const diag_1_4_1 = `
### Sơ Đồ Kiến Trúc: Tháp 17 Tầng Cấu Hình Của Spring Boot (Configuration Priority)

\`\`\`mermaid
flowchart TD
    L1["1. Command Line Arguments: --server.port=9090 (ƯU TIÊN CAO NHẤT)"] --> L2
    L2["2. SPRING_APPLICATION_JSON trong biến môi trường"] --> L3
    L3["3. Hệ thống ServletConfig / ServletContext init parameters"] --> L4
    L4["4. JNDI attributes (java:comp/env)"] --> L5
    L5["5. System Properties của Java: -Dspring.profiles.active=prod"] --> L6
    L6["6. OS Environment Variables: SPRING_DATASOURCE_PASSWORD=xyz"] --> L7
    L7["7. RandomValuePropertySource (random.*)"] --> L8
    L8["8. application-{profile}.yml BÊN NGOÀI file JAR đóng gói (K8s ConfigMap)"] --> L9
    L9["9. application-{profile}.yml BÊN TRONG file JAR"] --> L10
    L10["10. application.yml mặc định BÊN NGOÀI file JAR"] --> L11
    L11["11. application.yml mặc định BÊN TRONG file JAR"] --> L12
    L12["12. @PropertySource trên các @Configuration class"] --> L13
    L13["13. SpringApplication.setDefaultProperties() (ƯU TIÊN THẤP NHẤT)"]

    style L1 fill:#7c2d12,stroke:#f97316,color:#fff
    style L6 fill:#1e293b,stroke:#3b82f6,color:#fff
    style L8 fill:#064e3b,stroke:#10b981,color:#fff
    style L11 fill:#1f2937,stroke:#4b5563,color:#fff
\`\`\`
`;

// Diagram 1-4-2: Asynchronous Event Processing Flow
const diag_1_4_2 = `
### Sơ Đồ Luồng: Sự Kiện Bất Đồng Bộ In-JVM Với ApplicationEvent & Thread Pool

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor User as Khách Hàng (Web / App)
    participant Controller as OrderController (Tomcat Thread 1)
    participant Svc as OrderService (Tomcat Thread 1)
    participant Multicaster as SimpleApplicationEventMulticaster
    participant Pool as ThreadPoolTaskExecutor (Async Worker 1)
    participant Email as EmailNotificationListener (@Async)
    participant Kafka as KafkaOutboxPublisher (@TransactionalEventListener)

    User->>Controller: POST /checkout
    Controller->>Svc: createOrder()
    Svc->>Svc: Lưu đơn hàng vào PostgreSQL
    Svc->>Multicaster: eventPublisher.publishEvent(new OrderCreatedEvent(orderId))
    
    par Trả về kết quả ngay lập tức
        Svc-->>Controller: OrderCreatedDTO (Mã đơn: ORD-99)
        Controller-->>User: 201 Created (Phản hồi < 50ms)
    and Đẩy tác vụ nặng sang Thread Pool con
        Multicaster->>Pool: Submit Event Task
        Pool->>Email: Gửi email biên nhận hóa đơn (tốn 2s mạng)
        Pool->>Kafka: Đẩy message sang Kafka sau khi DB commit
    end
\`\`\`
`;

// Diagram 1-4-3: Event Consumer Starvation & Secret Leak Prevention
const diag_1_4_3 = `
### Sơ Đồ Cảnh Báo: Sự Cố Treo Thread Đồng Bộ & Rò Rỉ Secret Qua Actuator

\`\`\`mermaid
flowchart TD
    subgraph SyncEventBug ["SỰ CỐ 1: Event Listener Đồng Bộ Làm Nghẽn Tomcat"]
        TomcatThread["Tomcat Request Thread: Xử lý đơn hàng"] --> DB["Lưu DB xong (10ms)"]
        DB --> SyncListener["@EventListener: Gửi email qua SMTP server"]
        SyncListener --> Hang["SMTP mạng chập chờn timeout 30s! Tomcat Thread bị giữ cứng!"]
        Hang --> Exhaustion["Hết connection pool Tomcat -> 503 Server Unavailable!"]
        Exhaustion -.->|Khắc phục| SolutionAsync["Bắt buộc thêm @Async kèm ThreadPoolTaskExecutor riêng"]
    end

    subgraph SecretLeak ["SỰ CỐ 2: Lộ Password/Token Qua Endpoint Actuator Env"]
        Dev["Dev commit file application-prod.yml chứa mật khẩu thật lên Git"] --> Leak1["Lộ credentials trong Git history"]
        App["App chạy production để mở /actuator/env"] --> Leak2["Hacker xem được chuỗi kết nối DB và API Key"]
        Leak2 -.->|Khắc phục| SolutionSecret["Dùng biến môi trường K8s Secret hoặc HashiCorp Vault + sanitize actuator"]
    end

    style SyncEventBug fill:#7c2d12,stroke:#f97316,color:#fff
    style SecretLeak fill:#7c2d12,stroke:#f97316,color:#fff
    style SolutionAsync fill:#064e3b,stroke:#10b981,color:#fff
    style SolutionSecret fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

const injections = {
  '1-1-2': diag_1_1_2,
  '1-1-3': diag_1_1_3,
  '1-2-1': diag_1_2_1,
  '1-2-2': diag_1_2_2,
  '1-2-3': diag_1_2_3,
  '1-3-2': diag_1_3_2,
  '1-3-3': diag_1_3_3,
  '1-4-1': diag_1_4_1,
  '1-4-2': diag_1_4_2,
  '1-4-3': diag_1_4_3,
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
const outputCode = `/* MODULE 1 — Spring Core & Boot căn bản (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(${JSON.stringify(mod, null, 2)});\n`;

fs.writeFileSync(modPath, outputCode, 'utf8');
console.log(`\nHoàn thành bổ sung sơ đồ Mermaid cho Module 1! Số bài cập nhật: ${updatedCount}/10`);
