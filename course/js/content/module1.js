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
      title: "IoC & Dependency Injection — trái tim Spring",
      minutes: 45,
      content: `
## Vấn đề mà Spring giải quyết

~~~java
// ❌ Code không có DI — mọi thứ tự new, chằng chịt
public class OrderService {
    private final EmailService emailService = new EmailService();      // cứng
    private final PdfGenerator pdf = new PdfGenerator(new TemplateEngine()); // đan xen
    private final OrderRepository repo = new JdbcOrderRepository(dataSource); // khó thay
}
~~~

Vấn đề: class **tự tạo dependency** → muốn test phải sửa code, muốn đổi implementation phải sửa code, class lớn dần như quả cầu tuyết.

**Inversion of Control (IoC)**: đảo ngược quyền tạo object — container (Spring context) tạo và "tiêm" dependency vào class của bạn.

~~~java
// ✅ Có DI — class chỉ KHAI BÁO cái mình cần
@Service
public class OrderService {
    private final EmailService emailService;
    private final OrderRepository repo;

    // Constructor injection — Spring tự inject khi tạo bean OrderService
    public OrderService(EmailService emailService, OrderRepository repo) {
        this.emailService = emailService;
        this.repo = repo;
    }
}
~~~

---

## 1. Ba kiểu inject — và why constructor thắng

| Kiểu | Cách viết | Đánh giá |
|---|---|---|
| **Constructor** | 1 constructor duy nhất, Spring tự inject | ⭐ Khuyến nghị — final field, test dễ |
| Setter | <code>@Autowired</code> lên setter | Chỉ khi dependency tùy chọn |
| Field | <code>@Autowired</code> lên field | ❌ Tránh — khó test, che giấu dependency |

:::tip VÌ SAO CONSTRUCTOR INJECTION LÀ VUA?
1. Field có thể <code>final</code> → immutable, thread-safe
2. Không thể tạo object "thiếu_dependency" — compiler ép bạn truyền đủ
3. Test thường không cần Spring: <code>new OrderService(mockRepo, mockEmail)</code>
4. IDE hint ngay khi class có quá nhiều dependency (code smell)
:::

Từ Spring 4.3: nếu class chỉ có **1 constructor** thì không cần <code>@Autowired</code> — tự inject.

## 2. Các stereotype annotation

~~~java
@Component   // generic: "đây là bean, Spring quản giúp"
@Service     // tầng business logic (semantic + rõ nghĩa)
@Repository  // tầng persistence + translate SQLException → DataAccessException
@Controller  // tầng web (MVC)
@RestController  // = @Controller + @ResponseBody (trả JSON)
~~~

Component scan: <code>@SpringBootApplication</code> quét package của nó + mọi package con. Đặt class ngoài phạm vi quét → bean không được tạo!

## 3. @Bean — đăng ký class ngoài tầm với

Khi cần bean từ **thư viện bên thứ 3** (không thể sửa để thêm @Component):

~~~java
@Configuration
public class DataSourceConfig {

    @Bean                      // "tạo object này, Spring quản"
    public WebClient webClient(WebClient.Builder builder) {
        return builder
            .baseUrl("https://api.example.com")
            .build();
    }
}
~~~

Method <code>@Bean</code> được Spring gọi **đúng 1 lần** — các lần "gọi lại" thực ra trả về instance cũ từ container (CGLIB proxy).

## 4. Xung đột bean & @Primary / @Qualifier

~~~java
public interface NotificationSender { void send(String to, String msg); }

@Component("emailSender") SmsService... 
@Component
@Primary                        // thắng mặc định khi có tranh chấp
public class EmailSender implements NotificationSender { ... }

@Component("smsSender")
public class SmsSender implements NotificationSender { ... }

// Inject bằng qualifier khi cần cụ thể
@Service
public class NotifyService {
    public NotifyService(
        @Qualifier("smsSender") NotificationSender sms,   // chỉ đích danh
        NotificationSender defaultSender                   // EmailSender (@Primary)
    ) { ... }
}
~~~

## 5. Bean lifecycle — từ sinh đến diệt

~~~text
Constructor → Dependency Injection → @PostConstruct → (sử dụng) → @PreDestroy
~~~

~~~java
@Component
public class CacheWarmer {
    @PostConstruct              // chạy SAU khi inject xong — khởi tạo an toàn
    void warmUp() {
        System.out.println("Nạp cache ban đầu...");
    }

    @PreDestroy                 // trước khi shutdown — dọn dẹp tài nguyên
    void cleanup() {
        System.out.println("Đóng kết nối...");
    }
}
~~~

:::danger BẪY LỚN: LOGIC TRONG CONSTRUCTOR
Đừng gọi method của dependency trong **constructor** — dependency chưa chắc đã được inject/triển khai. Dùng <code>@PostConstruct</code>.
:::

## 6. Scopes

| Scope | Mô tả |
|---|---|
| <code>singleton</code> (mặc định) | 1 instance duy nhất cho toàn app |
| <code>prototype</code> | Mỗi lần inject/request = instance mới |
| <code>request</code> | 1 instance per HTTP request (web) |
| <code>session</code> | 1 instance per HTTP session (web) |

~~~java
@Component @Scope("prototype")
public class ReportBuilder { ... }
~~~

## 7. SPA — quan trọng để đọc hiểu code Spring

Giả sử tương lai bạn cần: ServiceA → (prototype) ServiceB → (singleton) ServiceC. Spring inject ServiceC vào ServiceB như bình thường. Nhưng nếu singleton ServiceA cần prototype ServiceB?

~~~java
@Service
public class ServiceA {
    private final ObjectProvider<ServiceB> serviceBProvider;

    public ServiceA(ObjectProvider<ServiceB> serviceBProvider) {
        this.serviceBProvider = serviceBProvider;
    }

    public void doWork() {
        // Mỗi lần getObject() = instance prototype mới
        ServiceB b = serviceBProvider.getObject();
        b.process();
    }
}
~~~

:::laas ĐỐI CHIẾU LAAS
Mở LAAS và grep <code>@ConfigurationProperties</code> — bạn sẽ thấy hàng loạt class bind config từ YAML. Đó chính là DI + externalized configuration mà ta học ở bài sau.
:::

:::takeaways
- IoC = container tạo & tiêm dependency; bạn chỉ khai báo
- Constructor injection là mặc định lựa chọn — final + testable
- @Component/@Service/@Repository/@Controller — stereotype đánh dấu bean
- @Bean trong @Configuration cho class thư viện
- @PostConstruct/@PreDestroy — hook khởi tạo/dọn dẹp an toàn
:::
`
    },
    {
      id: "1-2",
      type: "lesson",
      title: "Auto-configuration & Starters — ma thuật được giải thích",
      minutes: 40,
      content: `
## "Ma thuật" của Spring Boot thực chất là...

Spring Boot = Spring Framework + **Quy ước cấu hình tự động (convention over configuration)**. Câu thần chú nổi tiếng:

> "Bạn thêm spring-boot-starter-web vào classpath, đột nhiên app của bạn chạy web server."

Bài này gỡ rối: **cái gì xảy ra khi bạn bấm Run**.

---

## 1. @SpringBootApplication = 3 trong 1

~~~java
@SpringBootApplication
// Thực chất là:
// @SpringBootConfiguration  → đây là 1 @Configuration (có @Bean bên trong)
// @EnableAutoConfiguration  → bật auto-config (đọc META-INF)
// @ComponentScan            → quét package hiện tại + con
public class App { ... }
~~~

## 2. Auto-configuration pipeline

~~~text
1. App start
2. @EnableAutoConfiguration đọc file:
   META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
   (chứa ~150 auto-configuration class của Spring Boot)
3. TỪNG class được đánh giá qua @Conditional*
4. Class nào thỏa mãn điều kiện → các @Bean trong đó được tạo
5. Bean của bạn (user config) ghi đè auto-config bean (backing off)
~~~

### Các điều kiện @Conditional phổ biến

| Annotation | Ý nghĩa |
|---|---|
| <code>@ConditionalOnClass</code> | Class X có trên classpath? |
| <code>@ConditionalOnMissingBean</code> | Chưa có bean loại này? (để không ghi đè của user) |
| <code>@ConditionalOnProperty</code> | Property bật? |
| <code>@ConditionalOnWebApplication</code> | Là web app? |

Ví dụ auto-config thật (đơn giản hóa):

~~~java
@AutoConfiguration
@ConditionalOnClass(DispatcherServlet.class)
public class WebMvcAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean        // chỉ tạo NẾU user chưa tự định nghĩa
    public DispatcherServlet dispatcherServlet() {
        return new DispatcherServlet();
    }
}
~~~

:::tip HIỂU QUA VÍ DỤ CỤ THỂ
Vì sao thêm spring-boot-starter-data-jpa là có EntityManagerFactory? Vì: (1) class JPA có trên classpath → @ConditionalOnClass thỏa → (2) datasource được cấu hình → (3) auto-config tạo LocalContainerEntityManagerFactoryBean. **Classpath quyết định hành vi!**
:::

## 3. Starters — dependency combo nhỏ gọn

Starter = gói dependency được tuyển chọn + auto-config tương ứng.

| Starter | Mang lại |
|---|---|
| <code>spring-boot-starter-web</code> | Spring MVC + embedded Tomcat + Jackson |
| <code>spring-boot-starter-data-jpa</code> | JPA/Hibernate + HikariCP |
| <code>spring-boot-starter-security</code> | Security filter chain |
| <code>spring-boot-starter-test</code> | JUnit 5 + Mockito + AssertJ + Spring Test |
| <code>spring-boot-starter-validation</code> | Bean Validation (Hibernate Validator) |
| <code>spring-boot-starter-actuator</code> | health, metrics, info endpoints |
| <code>spring-boot-starter-oauth2-resource-server</code> | JWT validation |

## 4. Externalized configuration — application.yml

Thứ tự ưu tiên (thấp → cao):
1. <code>application.yml</code> trong jar
2. <code>application-{profile}.yml</code>
3. **Biến môi trường** (env vars)
4. **Command-line args** (java -jar app.jar --server.port=9090)

~~~yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/taskdb
    username: dev
    password: dev123
  jpa:
    hibernate:
      ddl-auto: none          # production: luôn none — để Flyway lo!
app:
  notification:
    api-url: https://api.example.com
    max-retries: 3
~~~

## 5. @ConfigurationProperties — bind config type-safe

~~~java
// Cách 1: record + @ConfigurationProperties (hiện đại, ngắn nhất)
@ConfigurationProperties(prefix = "app.notification")
public record NotificationProperties(
    String apiUrl,
    int maxRetries
) {}

// Kích hoạt record binding — thêm vào configuration class
@EnableConfigurationProperties(NotificationProperties.class)
// hoặc dùng @ConfigurationPropertiesScan ở app class
~~~

Inject và dùng:

~~~java
@Service
public class NotificationService {
    private final NotificationProperties props;
    public NotificationService(NotificationProperties props) { this.props = props; }

    public void send() {
        String url = props.apiUrl();          // có type check + IDE auto-complete
        int retries = props.maxRetries();     // thay vì @Value string rời rạc
    }
}
~~~

:::info @Value vs @ConfigurationProperties
<code>@Value("\${app.api-url}")</code> — nhanh, lẻ tẻ, stringly-typed.<br>
<code>@ConfigurationProperties</code> — gom nhóm, type-safe, validate được, IDE hỗ trợ. **Dùng record binding cho mọi config nhóm ≥ 2 khóa.**
:::

## 6. Profiles — mỗi môi trường một bộ mặt

~~~yaml
# application.yml — cấu hình chung
spring:
  profiles:
    active: dev
---
# application-dev.yml (hoặc cùng file, ngăn bằng ---)
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/dev_db
logging:
  level:
    vn.mastery: DEBUG
---
# application-prod.yml
spring:
  datasource:
    url: jdbc:postgresql://\${DB_HOST}:5432/prod_db
    password: \${DB_PASSWORD}    # từ env var — KHÔNG hardcode!
logging:
  level:
    vn.mastery: WARN
~~~

~~~java
@Bean
@Profile("dev")                   // chỉ tồn tại khi profile dev active
public DataSource devDataSource() { ... }
~~~

:::laas ĐỐI CHIẾU LAAS
LAAS chạy nhiều môi trường sit/uat/production với cấu hình khác nhau qua env vars trên OKD/Kubernetes. Hãy mở file <code>application.yml</code> + <code>application-sit.yml</code> của platform-service và đối chiếu pattern này.
:::

## 7. DevTools & Actuator — bộ đôi tăng tốc

**DevTools** (đã cài từ Module 0) auto-restart khi class thay đổi. Bật thêm "Build project automatically" trong IntelliJ settings.

**Actuator** — cửa sổ nhìn vào app đang chạy:

~~~yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,env,beans
  endpoint:
    health:
      show-details: when_authorized
~~~

| Endpoint | Dùng khi |
|---|---|
| <code>/actuator/health</code> | Kiểm tra app sống + DB up |
| <code>/actuator/beans</code> | Xem toàn bộ bean trong context |
| <code>/actuator/env</code> | Trace property đến từ đâu |
| <code>/actuator/metrics</code> | JVM, HTTP metrics |
| <code>/actuator/configprops</code> | @ConfigurationProperties đã bind gì |

:::takeaways
- Auto-config = @Conditional đánh giá classpath + beans hiện có
- Starter = dependency combo + auto-config "cắm là chạy"
- @ConfigurationProperties (record) > @Value rời rạc
- Profiles tách cấu hình theo môi trường; env vars cho secret
- Actuator = observability ngay trong app
:::
`
    },
    {
      id: "1-3",
      type: "lesson",
      title: "AOP & Bean lifecycle nâng cao",
      minutes: 35,
      content: `
## AOP — code cắt ngang không còn lặp

Logging, transaction, caching, security check... xuất hiện ở **mọi** service. Copy-paste 20 lần? AOP giải quyết: viết **một lần**, áp dụng **mọi nơi**.

---

## 1. Thuật ngữ 30 giây

| Thuật ngữ | Ý nghĩa |
|---|---|
| **Aspect** | Module chứa logic cắt ngang |
| **Join point** | Điểm chèn (trong Spring = method execution) |
| **Pointcut** | Biểu thức chọn join point nào bị ảnh hưởng |
| **Advice** | Hành động chạy tại điểm chèn (before/after/around) |
| **Weaving** | Quá trình áp aspect vào target |

## 2. Aspect đầu tiên — đo thời gian thực thi

Thêm dependency:

~~~xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
~~~

~~~java
@Aspect
@Component
public class TimingAspect {

    private static final Logger log =
        LoggerFactory.getLogger(TimingAspect.class);

    // Pointcut: mọi method trong package service
    @Around("execution(* vn.mastery..service..*(..))")
    public Object measure(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.nanoTime();
        try {
            return pjp.proceed();              // chạy method gốc
        } finally {
            long ms = (System.nanoTime() - start) / 1_000_000;
            log.info("{}.{} mất {}ms",
                pjp.getSignature().getDeclaringType().getSimpleName(),
                pjp.getSignature().getName(), ms);
        }
    }
}
~~~

Chạy lại app, gọi API — log hiện thời gian từng method service. **Không sửa bất kỳ class service nào!**

## 3. Pointcut expression — ngữ pháp chọn điểm

~~~text
execution( [modifiers] ReturnType package..ClassName.methodName(args) )
~~~

| Biểu thức | Bắt |
|---|---|
| <code>execution(* vn.mastery..*(..))</code> | Mọi method trong package + con |
| <code>execution(* vn.mastery..service.*.*(..))</code> | Mọi method của class trong package service |
| <code>@annotation(org.springframework...@Transactional)</code> | Method có @Transactional |
| <code>within(@org.springframework.stereotype.Service *)</code> | Class @Service |
| <code>bean(orderService)</code> | Theo tên bean |

## 4. Các loại Advice

~~~java
@Before("pointcut()")           // trước method
public void before(JoinPoint jp) { ... }

@AfterReturning("pointcut()")   // sau khi return bình thường
public void afterOk(JoinPoint jp, Object result) { ... }

@AfterThrowing("pointcut()")    // sau khi ném exception
public void afterFail(JoinPoint jp, Exception ex) { ... }

@Around("pointcut()")           // bọc trọn — mạnh nhất
public Object around(ProceedingJoinPoint pjp) throws Throwable { ... }
~~~

:::tip AOP Ở QUANH TA
Bạn đang dùng AOP mỗi ngày mà không biết: <code>@Transactional</code> (mở/commit transaction quanh method), <code>@Cacheable</code> (kiểm tra cache trước khi chạy), <code>@PreAuthorize</code> (check quyền trước method). Mẹo đằng sau mọi "annotation ma thuật" là AOP/proxy.
:::

## 5. Proxy — cách Spring thực thi AOP

Spring tạo **proxy** bọc bean gốc. Cuộc gọi từ ngoài → proxy → (aspect chain) → bean thật.

~~~text
Caller → [Proxy: @Transactional advice] → TargetBean.method()
~~~

Hậu quả cực quan trọng — **self-invocation**:

~~~java
@Service
public class OrderService {
    public void processOrder() {
        this.validate();     // ❌ gọi nội bộ — BYPASS PROXY!
    }

    @Transactional
    public void validate() { ... }   // transaction KHÔNG được mở!
}
~~~

:::danger SELF-INVOCATION — BUG ẨN KINH ĐIỂN
Gọi method trong cùng class qua <code>this</code> đi thẳng vào bean, **không qua proxy** → mọi annotation (@Transactional, @Cacheable, @Async, @PreAuthorize) **không có tác dụng**. Giải pháp: tách method sang class khác, hoặc tự inject proxy (<code>ObjectProvider</code>).
:::

## 6. Bean lifecycle nâng cao — BeanPostProcessor & Aware interfaces

~~~java
@Component
public class MyBean implements ApplicationContextAware {
    private ApplicationContext ctx;

    @Override
    public void setApplicationContext(ApplicationContext ctx) {
        this.ctx = ctx;      // nắm được context — hiếm khi cần, nhưng biết có lợi
    }
}
~~~

BeanPostProcessor: hook can thiệp mọi bean sau khi tạo — đây chính là cơ chế giúp <code>ConfigurationPropertiesBindingPostProcessor</code> bind config, hay <code>AbstractAdvisingBeanPostProcessor</code> gắn aspect.

## 7. Debug context khi start chậm/lỗi

~~~bash
# In ra condition evaluation report — auto-config nào bật, nào không và VÌ SAO
java -jar app.jar --debug
~~~

~~~yaml
logging:
  level:
    org.springframework.context: DEBUG   # trace bean creation
~~~

:::takeaways
- AOP: viết logging/monitoring 1 lần — áp mọi service
- <code>@Around</code> + <code>execution(* vn.mastery..service..*(..))</code> = công thức đo hiệu năng
- @Transactional/@Cacheable là AOP proxy → **self-invocation vô hiệu hóa chúng**
- <code>--debug</code> in ConditionEvaluationReport — soi auto-config nào bật/tắt và vì sao
:::
`
    },
    {
      id: "1-4",
      type: "lesson",
      title: "Configuration & Profiles — externalize đúng chuẩn",
      minutes: 45,
      content: `
## Config không phải code — nhưng config sai thì chết cả code

Mọi thứ khác nhau giữa môi trường (URL DB, secret, Kafka broker, issuer Keycloak) phải rời khỏi code. Spring cho 3 cơ chế: <code>@Value</code>, <code>@ConfigurationProperties</code>, Profiles. Biết đúng lúc nào dùng cái nào.

---

## 1. @Value — quick and dirty

~~~java
@Service
public class NotificationService {

    @Value("\${app.notification.from-email:no-reply@laas.vn}")
    private String fromEmail;          // có default sau dấu :

    @Value("\${app.notification.max-retry:3}")
    private int maxRetry;
}
~~~

Hạn chế: rải rác từng class, không validate, không có IDE auto-complete, đổi tên property không ai báo lỗi.

## 2. @ConfigurationProperties — typesafe, nhóm, validate

~~~java
// Record immutable — Spring Boot 3 style
@ConfigurationProperties(prefix = "app.notification")
public record NotificationProperties(
    @NotBlank String fromEmail,
    @Min(1) @Max(10) int maxRetry,
    @NotNull Duration retryBackoff,     // "500ms", "2s" tự parse!
    List<@Email String> bccAdmins
) {}
~~~

~~~yaml
app:
  notification:
    from-email: no-reply@addpay.africa
    max-retry: 5
    retry-backoff: 750ms
    bcc-admins:
      - ops@addpay.africa
      - sre@addpay.africa
~~~

~~~java
@Configuration
@EnableConfigurationProperties(NotificationProperties.class)
public class NotificationConfig { }

// Hoặc Spring Boot 3: @ConfigurationPropertiesScan trên Application class
~~~

Kích hoạt validation:

~~~xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
~~~

~~~java
@ConfigurationProperties(prefix = "app.notification")
@Validated                      // bật Bean Validation cho properties
public record NotificationProperties(...) { }
~~~

App **không start** nếu config sai — fail fast đúng nghĩa: thà chết lúc boot còn hơn lỗi runtime lúc 2h sáng.

## 3. Profiles — 1 artifact, nhiều môi trường

~~~text
src/main/resources/
├── application.yml                 ← config chung (base)
├── application-dev.yml             ← chỉ đè phần khác biệt
├── application-sit.yml
├── application-prod.yml
└── application-test.yml
~~~

~~~yaml
# application.yml — base
spring:
  application:
    name: loyalty-service
  datasource:
    url: jdbc:postgresql://localhost:5432/loyalty     # default dev

logging:
  level:
    vn.addpay.loyalty: INFO
~~~

~~~yaml
# application-prod.yml — chỉ phần KHÁC
spring:
  datasource:
    url: \${DB_URL}              # prod nhận từ env var, không default

logging:
  level:
    vn.addpay.loyalty: WARN      # giảm ồn prod
~~~

~~~bash
java -jar app.jar --spring.profiles.active=sit
# Hoặc env var: SPRING_PROFILES_ACTIVE=sit
~~~

### @Profile trên bean — wiring theo môi trường

~~~java
@Configuration
public class SchedulerConfig {

    @Bean
    @Profile("dev")                        // chỉ dev mới có
    @ConditionalOnProperty(name = "app.mock-kafka", havingValue = "true")
    KafkaTemplate<String, Object> mockKafka() {
        return new MockKafkaTemplate();    // không cần broker thật
    }

    @Bean
    @Profile({"sit", "prod"})              // môi trường thật
    KafkaTemplate<String, Object> realKafka(KafkaProperties props) {
        return new DefaultKafkaProducerFactory<>(props.buildProducerProperties())
            .createKafkaTemplate();
    }
}
~~~

## 4. Độ ưu tiên nguồn config — ai thắng ai?

~~~text
1. @TestPropertySource (test)
2. Command line args (--server.port=9090)
3. SPRING_APPLICATION_JSON
4. OS environment variables (DB_PASSWORD=...)
5. application-{profile}.yml ngoài jar (./config/)
6. application-{profile}.yml trong jar
7. application.yml trong jar
~~~

Nguyên tắc production: **image build 1 lần, cấu hình bơm ngoài** (env vars từ OKD Secret / AWS Parameter Store). Không bao giờ rebuild image vì đổi URL DB.

## 5. Secret — không bao giờ trong Git

~~~yaml
# ❌ application-prod.yml commit lên repo
password: SuperSecret123

# ✓ Prod nhận từ env / secret manager
password: \${DB_PASSWORD}
~~~

Giải pháp chuẩn: OKD Secrets mount thành env, AWS Secrets Manager + Spring Cloud AWS, Vault. Repo Git là nơi công khai — kể cả private repo, ai rời công ty cũng mang theo lịch sử.

:::warn CẢNH BÁO BEAN TRÙNG
Nếu IDE warning "multiple beans of type X" sau khi thêm @ConfigurationProperties — kiểm tra xem class có bị component-scan pickup 2 lần (annotation @Component + @EnableConfigurationProperties cùng lúc) không. Chọn 1 cách đăng ký duy nhất.
:::

:::laas ĐỐI CHIẾU LAAS
LAAS deploy qua Jenkins + OKD: mỗi môi trường (sit/uat/prod) là 1 bộ ConfigMap + Secret bơm env vars. Lỗi "SendAsDenied" SMTP bạn từng xử lý chính là config mismatch giữa môi trường — sender identity không khớp SMTP user. Nếu dùng @ConfigurationProperties + @Validated group "mail", cấu hình sai sẽ bị chặn ngay lúc boot thay vì lỗi runtime khi gửi thư.
:::

:::takeaways
- @Value cho throwaway; @ConfigurationProperties (record) cho mọi thứ nghiêm túc
- @Validated + Bean Validation = fail fast lúc start, không lỗi runtime
- Profiles: base.yml chứa chung, profile yml chỉ đè khác biệt
- Độ ưu tiên: env vars và args ĐÈ file trong jar
- Secret không bao giờ commit — env var từ Secret manager
- 1 artifact chạy mọi môi trường: build once, configure anywhere
:::
`
    },
    {
      id: "1-5",
      type: "lesson",
      title: "Spring Events — decoupling không cần Kafka",
      minutes: 40,
      content: `
## Không phải mọi sự kiện đều cần Kafka

Trong 1 process: user đăng ký → gửi email, ghi audit log, cập nhật thống kê. Viết hết trong service method = class đó biết quá nhiều, thêm bước phải sửa class. **ApplicationEvent**: publisher phát sự kiện, ai quan tâm tự lắng nghe — tách rời bằng cơ chế trong JVM.

---

## 1. Định nghĩa event — record bất biến

~~~java
public record MemberRegisteredEvent(
    Long memberId,
    String cif,
    String email,
    Instant occurredAt
) {}
~~~

Event = dữ liệu đã XẢY RA (past tense), không phải lệnh. MemberRegisteredEvent (sự kiện) ≠ RegisterMemberCommand (lệnh).

## 2. Publish

~~~java
@Service
public class MemberService {

    private final ApplicationEventPublisher events;

    public MemberService(ApplicationEventPublisher events) {
        this.events = events;
    }

    @Transactional(rollbackFor = Exception.class)
    public MemberDto register(RegisterRequest req) {
        Member member = memberRepo.save(new Member(req.cif(), req.fullName()));

        events.publishEvent(new MemberRegisteredEvent(
            member.getId(), member.getCif(), member.getEmail(), Instant.now()));

        return toDto(member);
    }
}
~~~

## 3. Listener — nhiều consumer độc lập

~~~java
@Component
public class WelcomeEmailListener {

    @EventListener
    public void onRegistered(MemberRegisteredEvent event) {
        mailService.sendWelcome(event.email());   // Đồng bộ trong cùng thread!
    }
}

@Component
public class AuditListener {

    @EventListener
    @Async("auditExecutor")                    // đẩy sang pool riêng
    public void onRegistered(MemberRegisteredEvent event) {
        auditRepo.save(AuditLog.of("MEMBER_REGISTERED", event.memberId()));
    }
}
~~~

## 4. @TransactionalEventListener — commit xong mới chạy

~~~java
@Component
public class StatsListener {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onRegistered(MemberRegisteredEvent event) {
        statsService.incrementRegistrations(event.occurredAt());
    }
}
~~~

Bảng chuyển đổi hành vi:

| Annotation | Chạy khi nào | Rủi ro |
|---|---|---|
| @EventListener | Ngay khi publish (trong transaction) | Rollback → side-effect đã chạy (email gửi cho member không tồn tại!) |
| @TransactionalEventListener (AFTER_COMMIT) | Sau khi commit thành công | Listener fail KHÔNG rollback transaction chính |
| @TransactionalEventListener (AFTER_ROLLBACK) | Sau rollback | Dọn dẹp |
| @TransactionalEventListener (IN_PROGRESS) | Giống @EventListener | — |

:::warn AFTER_COMMIT KHÔNG BẤT CHẤP
Listener fail sau commit không rollback được transaction đã commit. Nếu bước này bắt buộc phải thành công (gửi SMS OTP) → dùng outbox + Kafka (Module 6) thay vì in-memory event. Spring event là "best effort", KHÔNG phải guaranteed delivery.
:::

## 5. @Async + executor riêng cho listener nặng

~~~java
@Configuration
@EnableAsync
public class EventConfig {

    @Bean("eventExecutor")
    public Executor eventExecutor() {
        ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(2);
        ex.setMaxPoolSize(4);
        ex.setQueueCapacity(200);
        ex.setThreadNamePrefix("evt-");
        return ex;
    }
}

@Component
public class SlowListener {

    @Async("eventExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onRegistered(MemberRegisteredEvent event) {
        generateWelcomePdf(event.memberId());   // nặng — không block request thread
    }
}
~~~

## 6. Khi nào dùng Spring Event vs Kafka?

| Tiêu chí | Spring Event (in-JVM) | Kafka (cross-service) |
|---|---|---|
| Phạm vi | Cùng process | Nhiều service / replay được |
| Đảm bảo | Best-effort | At-least-once (outbox + idempotent) |
| Consumer chết | Mất event | Chờ — đọc lại khi sống lại |
| Latency | Microseconds | Milliseconds |
| Use case | Email, audit, stats nội bộ | Egress domain, integration |

Quy tắc: **side-effect nội bộ 1 app** → Spring event. **Sự kiện business mà service khác tiêu thụ** → outbox + Kafka. Đừng kéo Kafka vào cho việc email welcome trong cùng service — operational cost không đáng.

:::laas ĐỐI CHIẾU LAAS
Outbox worker LAAS dùng chính tư duy này: business commit → event. Nhưng vì event phải survive crash + cross-service, LAAS ghi ra bảng outbox (durable) thay vì chỉ publish in-memory. Spring event là phiên bản lightweight cùng pattern — đủ cho side-effect trong cùng JVM, không đủ cho guaranteed delivery.
:::

:::takeaways
- Event = record bất biến, tên past tense, chứa đủ dữ liệu consumer cần
- @EventListener chạy đồng bộ trong transaction; AFTER_COMMIT chạy sau commit
- Side-effect bắt buộc thành công → outbox/Kafka, KHÔNG dùng in-memory event
- @Async listener cần executor riêng — không mượn default pool
- Câu hỏi chọn: cùng process & best-effort → event; cross-service & guaranteed → Kafka
:::
`
    },
    {
      id: "1-6",
      type: "lesson",
      title: "Feature Flags & Config Refresh — deploy ≠ release",
      minutes: 40,
      content: `
## Deploy 2h sáng chỉ để tắt 1 feature?

Hotfix tắt job tính điểm phải build + deploy + restart 15 phút downtime. Trong khi đó feature flag tắt = 1 click, 30 giây. Bài này: config động (@RefreshScope), 4 tier feature flag, dark launch — tách "ship code" khỏi "bật tính năng".
---

## 1. Config tĩnh vs động

| Loại | Ví dụ | Đổi khi nào |
|---|---|---|
| Tĩnh (cần restart) | DB URL, Kafka broker, pool size | Theo release |
| Động (runtime) | maintenance mode, timeout threshold, flag bật feature | Theo sự kiện |

application.yml là tĩnh. Config động cần: nơi lưu (Config Server / Consul / DB) + cơ chế refresh bean.

## 2. @RefreshScope — bean tạo lại khi refresh

~~~xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter</artifactId>
</dependency>
~~~

~~~yaml
maintenance:
  mode: false
  message: "He thong bao tri 02:00-04:00"
~~~

~~~java
@RestController
@RefreshScope                       // bean nay TAO LAI khi refresh
public class MaintenanceController {

    @Value("\${maintenance.mode}")
    private boolean maintenanceMode;

    @GetMapping("/maintenance/status")
    public Map<String, Object> status() {
        return Map.of("mode", maintenanceMode);
    }
}
~~~

~~~bash
# Bat maintenance mode KHONG restart
curl -X POST http://localhost:8080/actuator/refresh
~~~

POST /actuator/refresh hủy mọi bean @RefreshScope → lần gọi sau tạo bean mới đọc config mới. Lưu ý: refresh chỉ áp cho bean có annotation — không phải toàn app.

:::warn @REFRESHSCOPE KHÔNG PHẢI MAGIC TOÀN CỤC
@Value trong bean KHÔNG có @RefreshScope giữ giá trị cũ mãi mãi. Team thường quên annotation rồi thắc mắc "refresh rồi mà sao không đổi". Chiến lược sạch: gom toàn bộ config động vào 1 @ConfigurationProperties bean có @RefreshScope, mọi nơi inject bean đó.
:::

## 3. @ConfigurationProperties + RefreshScope — chuẩn typed

~~~java
@RefreshScope
@ConfigurationProperties(prefix = "runtime")
public class RuntimeFlags {
    private boolean maintenanceMode;
    private int pointCalculationTimeoutMs;
    private int maxRedeemPerDay;
    private boolean redeemV2Enabled;
    private int redeemV2Percent;
    // getters/setters — Lombok @Data cũng được
}
~~~

Typed config: 1 chỗ sửa, IDE navigate được, test được — hơn @Value rải rác 20 file.

## 4. Feature flag — 4 tier theo mục đích

| Tier | Mục đích | Vòng đời |
|---|---|---|
| Release toggle | Ẩn code mới chưa hoàn thiện khi deploy | Ngày — tuần |
| Ops toggle (kill switch) | Tắt tính năng đang lỗi, không rollback | Giờ — ngày |
| Experiment (A/B) | Đo tác động của thay đổi | Tuần — tháng |
| Permission | Bật tính năng theo tenant/plan | Vĩnh viễn (thành pricing rule) |

~~~java
@Service
public class RedeemService {

    private final RuntimeFlags flags;   // @RefreshScope bean

    public RedeemResult redeem(RedeemCommand cmd) {
        if (!flags.isRedeemV2Enabled()) {
            return redeemLegacy(cmd);       // path cũ vẫn chạy — an toàn
        }
        if (!shouldUseV2(cmd.memberId())) {
            return redeemLegacy(cmd);       // rollout % chưa tới user này
        }
        return redeemV2(cmd);
    }
}
~~~

Rollout dần theo phần trăm (canary):

~~~java
private boolean shouldUseV2(String memberId) {
    int bucket = Math.floorMod(memberId.hashCode(), 100);   // stable hash
    return bucket < flags.getRedeemV2Percent();             // 5% → 50% → 100%
}
~~~

floorMod(hash) cho cùng user luôn rơi cùng bucket — không xảy ra "hôm nay V2 mai V1" khiến trải nghiệm nhảy loạn.

## 5. Togglz — feature flag engine trưởng thành

~~~xml
<dependency>
    <groupId>org.togglz</groupId>
    <artifactId>togglz-spring-boot-starter</artifactId>
</dependency>
~~~

~~~java
public enum AppFeature implements Feature {

    @Label("Redeem engine v2")
    REDEEM_V2,

    @EnabledByDefault
    @Label("Points expiry job")
    EXPIRY_JOB;
}
~~~

~~~java
if (AppFeature.REDEEM_V2.isActive()) {
    return redeemV2(cmd);
}
return redeemLegacy(cmd);
~~~

Togglz console (/togglz) bật/tắt runtime + strategy sẵn có: theo username, gradual rollout %, server IP. State lưu DB hoặc Consul — mọi instance đồng bộ đọc chung.

## 6. Flag debt — cái giá của tiện lợi

Flag là NỢ: mỗi flag = 2 nhánh code phải test, hiểu, duy trì. Quy tắc kỷ luật:

- Flag release/ops: ngày sinh phải có issue ngày chết (tạo flag kèm ticket dọn flag)
- Tối đa 1-2 flag active cùng lúc — hơn nữa là dấu hiệu branch sống quá lâu
- Flag permission dài hạn → chuyển thành config theo tenant (pricing table), không phải if-else vĩnh viễn trong code

:::laas Keycloak LAAS bạn từng build có biometric authentication provider làm SPI tùy chọn — bản chất là feature flag cấp infrastructure: SPI đăng ký nhưng chỉ tenant bật mới đi qua flow đó. Đối chiếu thực chiến: maintenance mode + kill switch job là 2 flag ops phổ biến nhất mọi hệ thống thanh toán — quyết định "tắt hay không" trong 30 giây khi incident, không chờ pipeline 15 phút.
:::

:::takeaways
- Tách deploy (ship code im lặng) khỏi release (bật flag) — giảm rủi ro release
- @RefreshScope + @ConfigurationProperties: config động typed, refresh không restart
- refresh chỉ áp bean @RefreshScope — gom config động 1 chỗ tránh quên annotation
- 4 tier flag: release/ops/experiment/permission — mỗi tier vòng đời khác nhau
- Rollout %: floorMod(hash) stable bucket — canary an toàn, trải nghiệm nhất quán
- Flag debt là thật: mỗi flag có ngày sinh phải có issue ngày chết
:::
`
    },
    {
      id: "1-7",
      type: "lesson",
      title: "AOP & Bean Lifecycle — cross-cutting không lặp code, lifecycle không bất ngờ",
      minutes: 50,
      content: `
## Cùng 1 đoạn log timing copy-paste 47 method — và bean prototype inject vào singleton biến mất

Hai vấn đề kinh điển: (1) logging/audit/metrics/timing là nghiệp vụ cắt ngang MỌI layer — viết tay trong từng method là 47 chỗ copy-paste lỗi nhất quán; (2) bean @Prototype inject vào @Singleton "biến mất" — luôn CÙNG instance dù đúng annotation. AOP giải bài toán (1), hiểu sâu lifecycle giải bài toán (2).
---

## 1. Vấn đề cross-cutting — code lặp không phải nghiệp vụ

~~~text
@Service class RedeemService {
    public RedeemResult redeem(cmd) {
        long t0 = System.currentTimeMillis();     // ← copy-paste
        log.info("redeem start cif={}", cmd.cif()); // ← copy-paste
        try {
            RedeemResult r = doRedeem(cmd);
            log.info("redeem done in {}ms", ...);  // ← copy-paste
            metrics.increment("redeem.ok");        // ← copy-paste
            return r;
        } catch (Exception e) {
            metrics.increment("redeem.fail");      // ← copy-paste
            throw e;
        }
    }
}
// 46 method khác y chang — quên 1 chỗ là méo metrics
~~~

AOP tách phần cắt ngang thành ASPECT — 1 chỗ viết, áp dụng theo quy tắc (pointcut), không đụng code nghiệp vụ.

## 2. Khái niệm lõi — Aspect, Pointcut, Advice, JoinPoint

| Thuật ngữ | Ý nghĩa | Ví dụ |
|---|---|---|
| Aspect | Module hóa mối quan tâm cắt ngang | PerformanceAspect, AuditAspect |
| JoinPoint | Điểm có thể chèn code (method call trong Spring) | redeemService.redeem() |
| Pointcut | Biểu thức CHỌN joinpoint nào | execution(* vn.addpay..service.*.*(..)) |
| Advice | Code chạy tại điểm chèn | @Around, @Before, @AfterThrowing |

## 3. @Aspect thực chiến — timing + audit log

~~~xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
~~~

~~~java
@Aspect
@Component
public class PerformanceAspect {

    private static final Logger log =
        LoggerFactory.getLogger("perf");

    // Pointcut: mọi method public của mọi @Service
    @Pointcut("execution(public * vn.addpay.loyalty..service..*(..))")
    public void serviceLayer() {}

    @Around("serviceLayer()")
    public Object timing(ProceedingJoinPoint jp) throws Throwable {
        long t0 = System.nanoTime();
        try {
            return jp.proceed();                 // CHẠY method gốc
        } finally {
            long ms = (System.nanoTime() - t0) / 1_000_000;
            log.info("{}.{} took {}ms",
                jp.getTarget().getClass().getSimpleName(),
                jp.getSignature().getName(), ms);
        }
    }
}
~~~

~~~java
@Aspect
@Component
public class AuditAspect {

    // Chỉ method có annotation đánh dấu — pointcut chính xác hơn execution
    @Around("@annotation(audited)")
    public Object audit(ProceedingJoinPoint jp, Audited audited)
            throws Throwable {
        String action = audited.value();
        String actor = SecurityContextHelper.currentUser();
        auditRepo.insert(action, actor, jp.getArgs(),
            Instant.now(), "RUNNING");
        try {
            Object result = jp.proceed();
            auditRepo.markDone(action, actor);
            return result;
        } catch (Exception e) {
            auditRepo.markFailed(action, actor, e.getMessage());
            throw e;
        }
    }
}
~~~

@annotation pointcut là cách idiomat nhất: tự đánh dấu method nào cần audit — không pointcut string mong manh theo package.

## 4. Proxy — cách Spring thực thi AOP (và giới hạn của nó)

Spring AOP là PROXY: container bọc bean trong lớp proxy — caller gọi proxy, proxy chạy advice rồi mới delegate xuống target.

~~~text
Caller → [PerformanceProxy.redeem()]  ← advice chạy ở đây
              ↓ delegate
         RedeemService.redeem()       ← method gốc (KHÔNG qua proxy!)
~~~

Hệ quả — 3 cái bẫy kinh điển:

1. **Self-invocation**: redeem() gọi this.validate() nội bộ — validate() KHÔNG qua proxy → aspect không chạy
2. **final method**: proxy không override được → aspect lặng lẽ bỏ qua
3. **@Prototype trong @Singleton**: inject 1 lần lúc startup — bean prototype "đóng băng" thành 1 instance duy nhất. Muốn mỗi lần dùng instance mới: ObjectProvider<T> hoặc @Lookup

## 5. Bean lifecycle đầy đủ — instantiation → populate → aware → init → ready → destroy

~~~text
Constructor → Dependency Injection (populate) → Aware callbacks
→ @PostConstruct → afterPropertiesSet() → custom init-method
→ [bean READY — sống trong container]
→ @PreDestroy → destroy() → custom destroy-method
~~~

~~~java
@Component
public class CacheWarmUp {

    @PostConstruct                          // dependency đã inject xong
    void warmUp() {
        rules.loadFromDb();                 // an toàn dùng dependency
    }
}

@Component
public class GracefulShutdown {

    @PreDestroy                             // trước khi container tắt
    void drain() {
        kafkaConsumer.pause();              // ngừng lấy message mới
        inFlight.awaitCompletion(30s);      // chờ việc đang chạy
    }
}
~~~

Constructor chạy TRƯỚC injection: dùng dependency trong constructor (trừ constructor injection tự nó) là NPE — @PostConstruct là chỗ đúng cho init logic.

## 6. Scope thực chiến — khi nào loại nào

| Scope | Số instance | Use case |
|---|---|--- trong container |
| singleton | 1 / container | Default — 99% service/repository |
| prototype | 1 / mỗi request getBean | Object tạo mới liên tục (builder có state) |
| request | 1 / HTTP request | Thông tin per-request (cart tạm) |
| session | 1 / HTTP session | Không dùng cho REST API — stateless |
| application | 1 / ServletContext | Chia sẻ toàn app (hiếm) |

:::warn AOP TRên @Transactional KHÔNG HOẠT ĐỘNG TRÊN self-call
Đây là nguồn bug khó hiểu nhất Spring: method @Transactional gọi method @Transactional KHÁC trong CÙNG class → inner KHÔNG có transaction mới (proxy không nằm giữa). Fix: tách class, hoặc tự inject proxy (self-injection). Cùng cơ chế proxy với aspect — hiểu proxy là hiểu cùng lúc cả AOP lẫn transaction.
:::

:::laas LAAS dùng pattern tenant context (bài 6-7) chính là aspect: TenantContextAspect @Around chặn mọi method @TenantRequired, set/clear ThreadLocal quanh lời gọi — không method nghiệp vụ nào biết sự tồn tại của nó. Đối chiếu: nếu thấy metrics thiếu cho method nội bộ this.xxx() — đó không phải bug metrics, là self-invocation bỏ qua proxy. Cùng 1 kiến thức: proxy nằm ở RANH GIỚI bean, không nằm bên trong bean.
:::

:::takeaways
- Cross-cutting (log/audit/metrics/timing) → aspect 1 chỗ viết, pointcut chọn nơi áp dụng
- @annotation pointcut chính xác hơn execution(* package..*) — tự đánh dấu, không mong manh
- Spring AOP = proxy: self-invocation KHÔNG qua proxy — aspect/transaction đều bị bỏ qua
- @Prototype inject vào @Singleton đóng băng thành 1 instance — dùng ObjectProvider/@Lookup
- Lifecycle: constructor → DI → @PostConstruct → ready → @PreDestroy — init ở đúng chỗ, không NPE
- @Transactional self-call mất transaction mới — cùng bẫy proxy với aspect
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
