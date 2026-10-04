const fs = require('fs');
const path = require('path');

global.window = { COURSE_MODULES: [] };
const m1Path = path.join(__dirname, '..', 'js', 'content', 'module1.js');
new Function('window', fs.readFileSync(m1Path, 'utf8'))(window);
const oldM1 = window.COURSE_MODULES[0];

const topics = [
  { id: 1, title: "IoC Container & Bean Lifecycle", desc: "Nguyên lý IoC/DI, ApplicationContext, vòng đời khởi tạo Bean và cạm bẫy Circular Dependency." },
  { id: 2, title: "Auto-Configuration & Custom Starters", desc: "Giải mã cơ chế @EnableAutoConfiguration, bộ lọc điều kiện @Conditional và tự viết Spring Boot Starter." },
  { id: 3, title: "AOP & Dynamic Proxies", desc: "Bản chất Spring AOP, so sánh JDK Proxy vs CGLIB, cạm bẫy self-invocation và thiết kế Aspect sản xuất." },
  { id: 4, title: "Externalized Configuration & In-JVM Events", desc: "Thứ tự 17 tầng cấu hình, Type-Safe @ConfigurationProperties và kiến trúc sự kiện ApplicationEvent." }
];

const outcomes = [
  "Làm chủ vòng đời Bean, ApplicationContext và khắc phục dứt điểm cạm bẫy Circular Dependency",
  "Tự thiết kế và đóng gói Custom Spring Boot Starter với cơ chế @ConditionalOnMissingBean chuẩn hóa",
  "Hiểu sâu bản chất Spring AOP Proxy và triệt tiêu lỗi mất Transaction/Security do self-invocation",
  "Quản trị hệ thống cấu hình 17 tầng phân tách theo môi trường và xử lý sự kiện bất đồng bộ In-JVM"
];

const retrievalWarmup = [
  {
    question: "Trong Module 0, khi khai báo một Java 21 Record chứa danh sách List<String>, tại sao Compact Constructor bắt buộc phải dùng List.copyOf()?",
    options: [
      "Để thực hiện Defensive Copying bảo đảm tính bất biến sâu (Deep Immutability), ngăn bên ngoài sửa đổi phần tử trong List",
      "Để tăng tốc độ tuần tự hóa JSON của Jackson",
      "Để tự động chuyển đổi danh sách thành LinkedList",
      "Để Hibernate có thể ánh xạ vào bảng trung gian của cơ sở dữ liệu"
    ],
    answer: 0,
    explain: "Record chỉ có tính bất biến nông (final reference). Nếu chứa mutable collection như ArrayList, bên ngoài vẫn có thể gọi .add() hoặc .clear() làm sai lệch dữ liệu. List.copyOf() tạo ra một unmodifiable list bất biến sâu.",
    targetLessonId: "0-3-3"
  },
  {
    question: "Tại sao trong ứng dụng Web Spring Boot, việc lạm dụng collection.parallelStream() để gọi HTTP REST API lại dẫn đến nguy cơ sập toàn bộ máy chủ JVM?",
    options: [
      "Vì parallelStream mặc định dùng chung ForkJoinPool.commonPool() của cả JVM; các tác vụ I/O blocking sẽ chiếm trọn worker threads làm đóng băng mọi request khác",
      "Vì parallelStream tự động ngắt kết nối mạng sau 30 giây",
      "Vì parallelStream chỉ chạy được trên CPU 1 nhân",
      "Vì Spring Security chặn mọi luồng con do parallelStream sinh ra"
    ],
    answer: 0,
    explain: "ForkJoinPool.commonPool() có số worker threads giới hạn bằng (CPU Cores - 1). Nếu ném các tác vụ chờ mạng I/O vào đây, toàn bộ thread pool sẽ bị block, khiến cả JVM tê liệt.",
    targetLessonId: "0-2-3"
  },
  {
    question: "Theo giải thuật Dependency Mediation của Apache Maven, khi có 2 phiên bản của cùng một thư viện xuất hiện trong cây phụ thuộc, phiên bản nào sẽ được chọn?",
    options: [
      "Phiên bản ở độ sâu gần gốc dự án hơn (Nearest-Wins)",
      "Phiên bản có số version cao nhất",
      "Phiên bản có dung lượng file JAR nhỏ nhất",
      "Phiên bản được release gần đây nhất"
    ],
    answer: 0,
    explain: "Maven áp dụng nguyên tắc Nearest-Wins: dependency nào ở tầng nông hơn trong cây phân giải sẽ được chọn, bất kể version đó mới hay cũ hơn.",
    targetLessonId: "0-4-1"
  }
];

const getL = (id) => oldM1.lessons.find(l => l.id === id);

// Topic 1: 1-1-1 to 1-1-4
const t1_l1 = {
  id: "1-1-1",
  type: "theory",
  title: "Bài 1.1.1: Kiến trúc IoC Container, Bean Lifecycle & Ba kiểu Dependency Injection",
  minutes: 8,
  content: getL("1-1-1").content + "\n\n" + getL("1-1-2").content + "\n\n" + getL("1-1-3").content
};

const t1_l2 = {
  id: "1-1-2",
  type: "practice",
  title: "Bài 1.1.2: Triển khai Dynamic Bean Injection & Khắc phục Prototype-in-Singleton",
  minutes: 7,
  content: getL("1-1-4").content
};

const t1_l3 = {
  id: "1-1-3",
  type: "pitfall",
  title: "Bài 1.1.3: Cạm bẫy Circular Dependency, Rò rỉ Memory Bean Scope & Deadlock Startup",
  minutes: 7,
  content: getL("1-1-5").content + "\n\n" + getL("1-1-6").content
};

const t1_l4 = {
  id: "1-1-4",
  type: "synthesis",
  title: "Bài 1.1.4: Milestone Synthesis: Bản đồ Bean Lifecycle & Ma trận Lựa chọn Bean Scope",
  minutes: 8,
  content: `## Milestone Synthesis: Tổng Hợp Vòng Đời Bean & Quản Trị IoC Container

### 1. Sơ Đồ Kiến Trúc: Vòng Đời Khởi Tạo & Tiêu Hủy Bean Trong ApplicationContext

\`\`\`mermaid
flowchart TD
    Start["Khởi Động Spring ApplicationContext"] --> Instantiation["1. Khởi Tạo Đối Tượng (Instantiation via Constructor)"]
    Instantiation --> PopulateProps["2. Bơm Phụ Thuộc (Populate Properties / Dependencies)"]
    PopulateProps --> AwareInterfaces["3. Bơm Ngữ Cảnh (BeanNameAware, ApplicationContextAware)"]
    AwareInterfaces --> BPP_Before["4. BeanPostProcessor: postProcessBeforeInitialization()"]
    BPP_Before --> InitMethods["5. Khởi Tạo: @PostConstruct -> InitializingBean::afterPropertiesSet()"]
    InitMethods --> BPP_After["6. BeanPostProcessor: postProcessAfterInitialization()<br/>(Tạo AOP Dynamic Proxy tại đây!)"]
    BPP_After --> Ready["Bean Sẵn Sàng Phục Vụ Request (Ready for Use)"]
    Ready --> Destruction["Khi Shutdown: @PreDestroy -> DisposableBean::destroy()"]
    
    style BPP_After fill:#064e3b,stroke:#10b981,color:#fff
    style Instantiation fill:#1e293b,stroke:#3b82f6,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: So Sánh Các Kiểu Bean Scope

| Tiêu chí | Singleton (Mặc định) | Prototype | Request / Session Scope | RefreshScope (Spring Cloud) |
|---|---|---|---|---|
| **Số lượng instance** | Đúng 1 instance duy nhất trên toàn ApplicationContext | Mỗi lần injection hoặc gọi \`getBean()\` sinh 1 instance mới | 1 instance trên mỗi HTTP request/session web | 1 proxy quản lý instance mới khi cấu hình reload |
| **Vấn đề Concurrency** | **Bắt buộc Stateless** (không lưu mutable state) | Thread-safe tự nhiên nếu không chia sẻ | Thread-safe cho từng HTTP worker thread | Thread-safe qua cơ chế lock cập nhật |
| **Quản lý Hủy (Destroy)** | Spring tự động gọi \`@PreDestroy\` khi tắt app | **Spring KHÔNG quản lý vòng đời tiêu hủy** (dễ rò rỉ RAM) | Spring tự động dọn khi kết thúc request | Spring dọn instance cũ khi nạp cấu hình mới |
| **Khi nào nên dùng** | **99% Services, Repositories, Controllers** | Đối tượng giữ trạng thái tạm thời, stateful worker | Thông tin người dùng đăng nhập hiện tại trong request | Khi cần dynamic reload cấu hình không cần restart |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Ưu tiên Constructor Injection**: Giúp các dependency là \`final\`, ngăn chặn vòng tròn phụ thuộc sớm tại compile/startup time và dễ dàng viết Unit Test độc lập.
2. **Cạm bẫy Prototype trong Singleton**: Nếu inject một Prototype Bean vào một Singleton Bean thông thường, Prototype sẽ chỉ được tạo **đúng 1 lần duy nhất** lúc Singleton khởi tạo. Để nhận instance mới mỗi lần gọi, bắt buộc phải dùng \`ObjectProvider<T>\` hoặc \`@Lookup\`.
3. **Tuyệt đối cấm Circular Dependency**: Kể từ Spring Boot 2.6+, cờ \`spring.main.allow-circular-references\` mặc định là \`false\`. Không bao giờ bật cờ này để chữa cháy; hãy refactor tách tầng trung gian hoặc dùng sự kiện.
4. **Proxy sinh ra ở BPP After**: Các tính năng ma thuật như \`@Transactional\`, \`@Async\`, \`@Secured\` chỉ được bọc vào Bean ở bước \`postProcessAfterInitialization\` thông qua Dynamic Proxy.`
};

// Topic 2: 1-2-1 to 1-2-4 (Consolidates old 1-2 and 1-7)
const t2_l1 = {
  id: "1-2-1",
  type: "theory",
  title: "Bài 1.2.1: Giải mã Cỗ máy Auto-Configuration & Điều kiện @Conditional On Class/MissingBean",
  minutes: 8,
  content: getL("1-2-1").content + "\n\n" + getL("1-2-2").content + "\n\n" + getL("1-2-3").content
};

const t2_l2 = {
  id: "1-2-2",
  type: "practice",
  title: "Bài 1.2.2: Xây dựng Custom Spring Boot Starter Sản Xuất với AutoConfiguration",
  minutes: 8,
  content: getL("1-2-4").content + "\n\n" + getL("1-7-3").content
};

const t2_l3 = {
  id: "1-2-3",
  type: "pitfall",
  title: "Bài 1.2.3: Cạm bẫy Thứ tự Nạp Auto-Configuration & Xung đột @ConditionalOnMissingBean",
  minutes: 7,
  content: getL("1-2-6").content + "\n\n" + getL("1-7-5").content
};

const t2_l4 = {
  id: "1-2-4",
  type: "synthesis",
  title: "Bài 1.2.4: Milestone Synthesis: Bản đồ Auto-Configuration & Ma trận Quyết định Tự Viết Starter",
  minutes: 8,
  content: `## Milestone Synthesis: Cỗ Máy Auto-Configuration & Custom Starters

### 1. Sơ Đồ Kiến Trúc: Chuỗi Nạp Điều Kiện Auto-Configuration (Spring Boot 3)

\`\`\`mermaid
flowchart TD
    BootRun["SpringApplication.run()"] --> ReadMeta["Đọc file: META-INF/spring/<br/>org.springframework.boot.autoconfigure.AutoConfiguration.imports"]
    ReadMeta --> FilterCandidates["Nạp Danh Sách Candidate AutoConfigurations"]
    
    subgraph ConditionChecks ["Bộ Thẩm Định Điều Kiện (Condition Evaluation)"]
        FilterCandidates --> CondClass["@ConditionalOnClass: Thư viện có trong Classpath không?"]
        CondClass -- YES --> CondProp["@ConditionalOnProperty: Cờ cấu hình có bật không?"]
        CondProp -- YES --> CondMissing["@ConditionalOnMissingBean: Người dùng đã tự khai bean chưa?"]
    end

    CondMissing -- "CHƯA CÓ BEAN" --> RegisterBean["Đăng Ký Default Bean Của Starter Vào Context"]
    CondMissing -- "ĐÃ CÓ BEAN" --> BackOff["Back-off: Nhường quyền ưu tiên cho Bean của Dev"]
    CondClass -- NO --> Skip["Bỏ Qua Toàn Bộ Cấu Hình"]
    CondProp -- NO --> Skip

    style ConditionChecks fill:#1e293b,stroke:#3b82f6,color:#fff
    style RegisterBean fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Khi Nào Nên Tự Viết Custom Starter?

| Bối cảnh | Dùng Custom Starter Riêng | Dùng Thư Viện @Configuration Chung | Khai Báo Thủ Công Từng App |
|---|---|---|---|
| **Số lượng microservices** | $\ge 5$ dịch vụ dùng chung hạ tầng | 2 - 4 dịch vụ trong cùng 1 team | 1 ứng dụng đơn lẻ duy nhất |
| **Thay đổi cấu hình** | Tự động hóa qua cờ \`application.yml\` | Cần import bằng tay class cấu hình | Phải copy paste mã nguồn |
| **Bảo trì & Nâng cấp** | Nâng cấp 1 nơi, tất cả service kế thừa | Cập nhật file library, recompile | Tốn hàng tuần sửa từng project |
| **Use Case điển hình** | Common Security SDK, Distributed Tracing, Custom Payment Client | Utility helpers dùng chung | Cấu hình database riêng của 1 app |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Chuẩn Spring Boot 3**: Không còn dùng file \`META-INF/spring.factories\`; bắt buộc phải khai báo trong file \`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports\`.
2. **Quy tắc Back-off an toàn**: Mọi bean mặc định trong Starter phải gắn \`@ConditionalOnMissingBean\` để developer có thể override bất kỳ lúc nào mà không sợ conflict.
3. **Tách biệt Starter và Autoconfigure**: Chuẩn Maven enterprise chia làm 2 module: \`my-starter\` (chỉ chứa dependency pom) và \`my-spring-boot-autoconfigure\` (chứa code cấu hình).`
};

// Topic 3: 1-3-1 to 1-3-4
const t3_l1 = {
  id: "1-3-1",
  type: "theory",
  title: "Bài 1.3.1: Kiến trúc AOP, JDK Dynamic Proxy vs CGLIB & Bản chất Self-Invocation",
  minutes: 8,
  content: getL("1-3-1").content + "\n\n" + getL("1-3-2").content
};

const t3_l2 = {
  id: "1-3-2",
  type: "practice",
  title: "Bài 1.3.2: Xây dựng Distributed Audit Logging & Performance Metric Aspect",
  minutes: 7,
  content: getL("1-3-3").content + "\n\n" + getL("1-3-4").content
};

const t3_l3 = {
  id: "1-3-3",
  type: "pitfall",
  title: "Bài 1.3.3: Cạm bẫy Self-Invocation làm Vô hiệu hóa Proxy & Rò rỉ Transaction Advice",
  minutes: 7,
  content: getL("1-3-5").content
};

const t3_l4 = {
  id: "1-3-4",
  type: "synthesis",
  title: "Bài 1.3.4: Milestone Synthesis: Bản đồ Vòng đời Proxy AOP & Ma trận Thiết kế Interceptor vs Aspect",
  minutes: 8,
  content: `## Milestone Synthesis: Tổng Hợp Kiến Trúc Aspect-Oriented Programming (AOP)

### 1. Sơ Đồ Kiến Trúc: Cơ Chế Đánh Chặn (Interception) Của Dynamic Proxy

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as Caller (Controller)
    participant Proxy as Spring CGLIB / JDK Proxy
    participant Aspect as Logging / Transaction Aspect
    participant Target as Real Target Bean (OrderService)

    Client->>Proxy: placeOrder(request)
    activate Proxy
    Proxy->>Aspect: Before Advice (Kích hoạt Transaction / Ghi Log)
    activate Aspect
    Aspect-->>Proxy: Advice OK
    deactivate Aspect
    
    Proxy->>Target: delegate.placeOrder(request)
    activate Target
    Target-->>Proxy: Trả về OrderResponse
    deactivate Target

    Proxy->>Aspect: AfterReturning Advice (Commit Transaction)
    activate Aspect
    Aspect-->>Proxy: Hoàn tất
    deactivate Aspect

    Proxy-->>Client: Trả về kết quả cho Caller
    deactivate Proxy
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Lựa Chọn Cơ Chế Interception

| Tiêu chuẩn | Spring AOP (@Aspect) | HandlerInterceptor (Spring MVC) | Servlet Filter |
|---|---|---|---|
| **Tầng hoạt động** | Tầng Service, Repository, Component bất kỳ | Tầng Web MVC (trước khi vào Controller) | Tầng Servlet Network (đầu cổng vào app) |
| **Phạm vi tác động** | Mọi phương thức mang annotation nghiệp vụ | Chỉ các HTTP request đi qua DispatcherServlet | Mọi request HTTP thô (kể cả static resources) |
| **Biết được Bean/Method** | Có (\`JoinPoint\`, method signatures, args) | Có (\`HandlerMethod\`) | Không (chỉ biết \`HttpServletRequest\`) |
| **Khuyến nghị sử dụng** | Audit Log, Performance Metric, Transaction, Security Method | Kiểm tra Token Header, Rate Limiting cơ bản | Ghi log Request IP, CORS Header, Chống DDoS |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Nguyên lý Self-Invocation**: Khi gọi nội bộ \`this.methodB()\` từ \`methodA()\`, lời gọi không đi qua Spring Proxy. Mọi annotation như \`@Transactional\`, \`@Async\`, \`@Cacheable\` trên \`methodB\` hoàn toàn **bị vô hiệu hóa**.
2. **Khắc phục Self-Invocation**: Tách \`methodB\` sang một Bean độc lập khác (khuyến nghị số 1) hoặc tự inject chính interface của mình thông qua \`@Lazy\`.
3. **CGLIB Proxy mặc định**: Spring Boot mặc định dùng CGLIB subclass proxy thay vì JDK Interface proxy. Do đó, phương thức không được mang từ khóa \`final\` hoặc \`private\`.`
};

// Topic 4: 1-4-1 to 1-4-4 (Consolidates old 1-4, 1-5, 1-6)
const t4_l1 = {
  id: "1-4-1",
  type: "theory",
  title: "Bài 1.4.1: Kiến trúc Nạp Cấu hình 17 Tầng, Relaxed Binding & Cỗ máy In-JVM Events",
  minutes: 8,
  content: getL("1-4-2").content + "\n\n" + getL("1-4-3").content + "\n\n" + getL("1-5-2").content
};

const t4_l2 = {
  id: "1-4-2",
  type: "practice",
  title: "Bài 1.4.2: Triển khai Type-Safe ConfigurationProperties & Asynchronous Event Processing",
  minutes: 7,
  content: getL("1-4-4").content + "\n\n" + getL("1-5-3").content
};

const t4_l3 = {
  id: "1-4-3",
  type: "pitfall",
  title: "Bài 1.4.3: Cạm bẫy Lộ Bí mật Thông tin qua Profiles & Event Consumer Treo Thread Chính",
  minutes: 7,
  content: getL("1-4-6").content + "\n\n" + getL("1-5-5").content
};

const t4_l4 = {
  id: "1-4-4",
  type: "synthesis",
  title: "Bài 1.4.4: Milestone Synthesis: Bản đồ Nạp Cấu hình & Ma trận In-JVM Event vs Kafka Message",
  minutes: 8,
  content: `## Milestone Synthesis: Externalized Configuration & In-JVM Events

### 1. Sơ Đồ Kiến Trúc: 17 Tầng Thứ Tự Nạp Cấu Hình Spring Boot

\`\`\`mermaid
flowchart TD
    Highest["1. Tham số dòng lệnh (Command Line Arguments: --server.port=9090)"] --> EnvVars["2. Biến môi trường hệ thống (OS Environment Variables: SPRING_APPLICATION_JSON)"]
    EnvVars --> ProfileYml["3. application-{profile}.yml nằm ngoài thư mục đóng gói (External Config)"]
    ProfileYml --> InternalProfileYml["4. application-{profile}.yml nằm trong classpath (src/main/resources)"]
    InternalProfileYml --> BaseYml["5. application.yml mặc định"]
    BaseYml --> DefaultProps["6. SpringApplication.setDefaultProperties()"]

    style Highest fill:#7f1d1d,stroke:#ef4444,color:#fff
    style EnvVars fill:#1e3a8a,stroke:#3b82f6,color:#fff
    style BaseYml fill:#1e293b,stroke:#64748b,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: In-JVM ApplicationEvent vs Message Broker (Kafka/RabbitMQ)

| Tiêu chuẩn | Spring ApplicationEvent (In-JVM) | Message Broker (Apache Kafka / RabbitMQ) |
|---|---|---|
| **Phạm vi hoạt động** | Cùng một tiến trình JVM duy nhất | Phân tán giữa nhiều microservices khác nhau |
| **Độ trễ (Latency)** | Cực thấp (nanoseconds đến microseconds) | Thấp (vài mili-giây qua mạng) |
| **Độ bền vững (Durability)** | **Mất dữ liệu nếu sập máy chủ** (In-memory) | Bền vững trên disk (Kafka commit log) |
| **Khi nào nên dùng** | Tách rời các module nghiệp vụ nội bộ (Decoupling) | Giao dịch tài chính, thanh toán, notification đa service |
| **Gắn kết Transaction** | Hỗ trợ tuyệt vời với \`@TransactionalEventListener\` | Cần áp dụng Transactional Outbox Pattern |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Type-Safe Configuration**: Thay thế toàn bộ \`@Value("\${...}")\` rải rác bằng \`@ConfigurationProperties\` có validate (\`@Validated\`, \`@NotNull\`).
2. **Kỷ luật Bảo Mật Bí Mật**: Không bao giờ commit password, API secret key vào file \`application.yml\` trên Git; luôn nạp qua Environment Variables hoặc Vault.
3. **Nguy cơ Treo Luồng Sự Kiện**: Mặc định \`ApplicationEventMulticaster\` xử lý đồng bộ trên thread của publisher. Nếu listener xử lý chậm hoặc gọi mạng, bắt buộc phải gắn \`@Async\` hoặc cấu hình task executor.`
};

// Additional 4 scenario questions for module 1 inline quiz
const additionalQuestions = [
  {
    level: "hard",
    scenario: "Ứng dụng Spring Boot của bạn có Service A gọi this.executePaymentInternal() mang annotation @Transactional. Tuy nhiên, khi xảy ra lỗi RuntimeException bên trong executePaymentInternal(), dữ liệu KHÔNG hề rollback.",
    q: "Nguyên nhân cốt lõi dẫn đến hiện tượng transaction không rollback trong tình huống này là gì?",
    options: [
      "Do cơ chế Self-Invocation: lời gọi this.method() là lời gọi trực tiếp trong JVM, hoàn toàn không đi qua Spring AOP Proxy nên advice Transactional bị bỏ qua",
      "Do Spring Boot 3 không hỗ trợ rollback cho RuntimeException",
      "Do cơ sở dữ liệu tự động commit sau mỗi câu lệnh INSERT",
      "Do thiếu annotation @Service trên class Service A"
    ],
    answer: 0,
    explain: "Spring AOP hoạt động dựa trên Dynamic Proxy bọc ngoài bean. Khi một method tự gọi một method khác trong cùng một class bằng từ khóa 'this', lời gọi không đi qua Proxy, dẫn đến interceptor quản lý transaction hoàn toàn không được kích hoạt.",
    why: [
      "✓ Đúng — Đây là cạm bẫy AOP kinh điển nhất trong các kỳ phỏng vấn Senior Spring Engineer.",
      "Spring Boot mặc định rollback với mọi Unchecked Exception (RuntimeException và Error).",
      "Database chỉ auto-commit nếu connection không nằm trong transaction context quản lý bởi Spring.",
      "Nếu thiếu @Service thì ứng dụng đã báo lỗi NoSuchBeanDefinitionException ngay lúc khởi động."
    ]
  },
  {
    level: "medium",
    scenario: "Một lập trình viên muốn xây dựng một Custom Starter cho công ty và định nghĩa file cấu hình tự động. Trong Spring Boot 3.3+, file nào là BẮT BUỘC để đăng ký lớp AutoConfiguration?",
    q: "Đường dẫn và tên file chuẩn hóa theo đặc tả Spring Boot 3 là gì?",
    options: [
      "META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports",
      "META-INF/spring.factories",
      "src/main/resources/application.properties",
      "META-INF/services/javax.annotation.processing.Processor"
    ],
    answer: 0,
    explain: "Kể từ Spring Boot 2.7 và bắt buộc trong 3.x, cơ chế đăng ký Auto-configuration qua file spring.factories đã bị thay thế hoàn toàn bởi tệp tin META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports.",
    why: [
      "✓ Đúng — Đây là chuẩn hóa bắt buộc của Spring Boot 3 giúp tối ưu thời gian khởi động và hỗ trợ AOT native image.",
      "File spring.factories là định dạng cũ của Spring Boot 1.x và 2.x, đã bị deprecate.",
      "application.properties là file cấu hình runtime của ứng dụng, không dùng để nạp AutoConfiguration.",
      "javax.annotation.processing.Processor dùng cho Java Annotation Processing của compiler."
    ]
  },
  {
    level: "medium",
    scenario: "Trong một Singleton Service, lập trình viên inject trực tiếp một Prototype Bean 'OrderProcessingTask' và nhận thấy các request gửi đến đều sử dụng chung một instance duy nhất.",
    q: "Giải pháp kiến trúc chuẩn xác nào giúp Singleton Service nhận được instance Prototype mới mỗi khi thực thi?",
    options: [
      "Sử dụng ObjectProvider<OrderProcessingTask> hoặc annotation @Lookup trên phương thức khởi tạo task",
      "Khai báo Singleton Service thành static class",
      "Bật cờ spring.main.allow-bean-definition-overriding=true",
      "Chuyển đổi kiểu dữ liệu của Prototype Bean thành Java Record"
    ],
    answer: 0,
    explain: "Do Singleton Bean chỉ được khởi tạo và nạp dependency đúng 1 lần trong suốt vòng đời của ApplicationContext, mọi dependency được inject vào nó lúc khởi động sẽ không đổi. Sử dụng ObjectProvider.getObject() hoặc @Lookup cho phép kéo (pull) một instance mới từ Spring Container theo nhu cầu tại runtime.",
    why: [
      "✓ Đúng — ObjectProvider<T> là API hiện đại và type-safe nhất trong Spring Framework.",
      "Static class không liên quan đến cơ chế quản lý vòng đời Bean của Spring.",
      "Allow bean definition overriding chỉ cho phép ghi đè định nghĩa bean trùng tên, không giải quyết vấn đề scope.",
      "Record là lớp dữ liệu bất biến, không thay đổi được cơ chế inject của container."
    ]
  },
  {
    level: "hard",
    scenario: "Hệ thống cần lắng nghe sự kiện OrderCreatedEvent để gửi email xác nhận. Tuy nhiên, nếu nghiệp vụ tạo Order thất bại và transaction bị rollback, email KHÔNG ĐƯỢC PHÉP gửi đi.",
    q: "Annotation nào giải quyết chính xác bài toán ràng buộc giữa In-JVM Event và Transaction này?",
    options: [
      "@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)",
      "@EventListener kết hợp @Async",
      "@Order(Ordered.HIGHEST_PRECEDENCE)",
      "@Transactional(propagation = Propagation.REQUIRES_NEW)"
    ],
    answer: 0,
    explain: "@TransactionalEventListener lắng nghe sự kiện và chỉ thực thi khi transaction hiện tại của publisher đạt đến một pha cụ thể. Thiết lập phase = TransactionPhase.AFTER_COMMIT bảo đảm rằng chỉ khi database transaction được commit thành công 100%, listener gửi email mới được kích hoạt.",
    why: [
      "✓ Đúng — @TransactionalEventListener là giải pháp hoàn hảo để tránh gửi email giả khi giao dịch DB bị rollback.",
      "@EventListener thông thường chạy ngay lập tức khi event được publish, bất kể transaction sau đó thành công hay thất bại.",
      "@Order chỉ định thứ tự ưu tiên giữa các listener, không liên quan đến transaction phase.",
      "Propagation.REQUIRES_NEW tạo transaction độc lập, không ngăn chặn được việc gửi event trước khi parent commit."
    ]
  }
];

const inlineQuiz = oldM1.lessons.find(l => l.type === 'quiz');
const updatedQuizQuestions = inlineQuiz.questions.concat(additionalQuestions);

const newLessons = [
  t1_l1, t1_l2, t1_l3, t1_l4,
  t2_l1, t2_l2, t2_l3, t2_l4,
  t3_l1, t3_l2, t3_l3, t3_l4,
  t4_l1, t4_l2, t4_l3, t4_l4,
  {
    id: "1-quiz",
    type: "quiz",
    title: "Quiz Module 1 — Sát Hạch Toàn Diện Spring Core & Boot Căn Bản",
    questions: updatedQuizQuestions
  }
];

const newM1 = {
  id: 1,
  title: "Spring Core & Boot căn bản",
  subtitle: "IoC Container, AutoConfiguration, AOP & Externalized Config",
  icon: "🍃",
  desc: "Nắm vững nguyên lý cốt lõi Spring Framework, IoC Container, Bean Lifecycle và cơ chế Auto-Configuration chuyên sâu.",
  topics: topics,
  outcomes: outcomes,
  retrievalWarmup: retrievalWarmup,
  lessons: newLessons
};

const outputContent = `/* MODULE 1 — Spring Core & Boot căn bản (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(${JSON.stringify(newM1, null, 2)});\n`;

fs.writeFileSync(m1Path, outputContent, 'utf8');
console.log('Successfully curated module1.js!');
console.log('Total content lessons:', newLessons.filter(l => l.type !== 'quiz').length);
console.log('Total quiz questions:', updatedQuizQuestions.length);
