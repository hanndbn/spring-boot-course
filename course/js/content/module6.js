/* MODULE 6 — Caching, Messaging & Microservices */
window.COURSE_MODULES = window.COURSE_MODULES || [];
window.COURSE_MODULES.push({
  id: 6,
  title: "Microservices & Messaging",
  subtitle: "Kafka, caching, resilience, outbox",
  icon: "⚡",
  desc: "Hệ thống phân tán: Kafka, Redis cache, circuit breaker, outbox pattern — đúng stack LAAS.",
  lessons: [
    {
      id: "6-1",
      type: "lesson",
      title: "Caching với Spring Cache & Redis",
      minutes: 40,
      content: `
## Cache — tăng tốc bằng cách không làm lại việc cũ

Cùng một query danh sách task được gọi 1000 lần/giây — kết quả y hệt. Cache giữ kết quả ở RAM (Redis) — request sau trả ngay không chạm DB.

---

## 1. Bật Spring Cache abstraction

~~~xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
~~~

~~~java
@SpringBootApplication
@EnableCaching                 // bật cache abstraction
public class App { ... }
~~~

## 2. Ba annotation cốt lõi

~~~java
@Service
public class TaskService {

    @Cacheable(cacheNames = "tasks", key = "#id")
    public TaskDto findById(Long id) {
        // Lần 1: chạy method, lưu kết quả vào cache
        // Lần 2+: trả từ cache — method KHÔNG chạy!
        return repo.findById(id).map(mapper::toDto)
            .orElseThrow(() -> new TaskNotFoundException(id));
    }

    @CachePut(cacheNames = "tasks", key = "#result.id()")
    public TaskDto update(Long id, UpdateTaskRequest req) {
        TaskDto updated = doUpdate(id, req);
        return updated;      // chạy method VÀ cập nhật cache với kết quả
    }

    @CacheEvict(cacheNames = "tasks", key = "#id")
    public void delete(Long id) {
        repo.deleteById(id);     // xóa DB + đuổi cache
    }

    @CacheEvict(cacheNames = "tasks", allEntries = true)
    public Page<TaskDto> list(...) { ... }   // list đổi → xóa sạch cache tasks
}
~~~

| Annotation | Chạy method? | Cache effect |
|---|---|---|
| <code>@Cacheable</code> | Cache MISS mới chạy | Lưu kết quả |
| <code>@CachePut</code> | Luôn chạy | Ghi đè cache bằng result |
| <code>@CacheEvict</code> | Luôn chạy | Xóa entry |

:::warn @CACHEABLE LÀ AOP PROXY!
Gọi <code>this.findById()</code> nội bộ → bypass proxy → cache không hoạt động (bài self-invocation Module 1). Cache method phải được gọi từ bean khác.
:::

## 3. Cache key

~~~java
@Cacheable(cacheNames = "taskSearch",
    key = "T(java.util.Objects).hash(#status, #keyword, #page)")
public Page<TaskDto> search(String status, String keyword, int page) { ... }

// SpEL đầy đủ sức mạnh
@Cacheable(cacheNames = "userTasks", key = "#userId + ':' + #authentication.name")
~~~

## 4. Redis — TTL & serialization

~~~yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379

cache:
  ttl:
    default: 30m
    tasks: 10m
~~~

~~~java
@Configuration
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration
            .defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))
            .serializeValuesWith(SerializationPair.fromSerializer(
                new GenericJackson2JsonRedisSerializer()));  // JSON thay vì JDK

        Map<String, RedisCacheConfiguration> perCache = Map.of(
            "tasks", defaultConfig.entryTtl(Duration.ofMinutes(10)),
            "taskSearch", defaultConfig.entryTtl(Duration.ofMinutes(2))
        );

        return RedisCacheManager.builder(factory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(perCache)
            .build();
    }
}
~~~

:::tip TTL LÀ BẢO HIỂM
Cache expire tự động = tự healing khi logic evict bị sót. Không bao giờ cache không TTL cho dữ liệu hay đổi.
:::

## 5. Cache penetration & stampede — 2 kịch bản thực tế

**Penetration**: query dữ liệu không tồn tại (id=-1) → cache miss → đập DB mỗi lần. Fix: cache negative result ngắn (60s) hoặc Bloom filter.

**Stampede (thundering herd)**: cache đúng lúc expire, 500 request đồng loạt miss → 500 query DB song song → DB gục. Fix: sync load (1 thread đi lấy,các request khác chờ), jitter TTL, hoặc Caffeine local cache ở trước Redis.

## 6. Cache-aside pattern — tư duy chuẩn

~~~text
Read:  cache hit? → trả ngay
       cache miss? → query DB → ghi cache → trả

Write: ghi DB trước → evict cache (KHÔNG ghi cache trực tiếp!)
~~~

Vì sao write evict (không write update cache)? Ghi cache đồng thời với DB tạo race condition — dữ liệu cache cũ hơn DB nếu 2 write giao nhau. Evict an toàn hơn: lần đọc sau sẽ nạp lại.

:::laas ĐỐI CHIẾU LAAS
LAAS có chiến lược caching riêng (bạn từng audit). Tìm <code>@Cacheable</code> / RedisConfig trong repo và xem TTL từng cache name — thường cache reference data (danh sách bank, branch) TTL dài, cache transactional TTL ngắn.
:::

:::takeaways
- @Cacheable/Put/Evict — Spring Cache abstraction, provider đổi được (Redis, Caffeine...)
- Key bằng SpEL; TTL per-cache-name qua RedisCacheManager
- Cache-aside: write → evict, đừng write-update cache
- Penetration → negative caching; stampede → sync/jitter
- @Cacheable cũng là AOP — self-invocation giết cache
:::
`
    },
    {
      id: "6-2",
      type: "lesson",
      title: "Kafka & Transactional Outbox",
      minutes: 55,
      content: `
## Messaging — vì sao không chỉ HTTP?

HTTP đồng bộ: service B sập → service A cũng kẹt. Messaging bất đồng bộ: A publish event vào Kafka, B consume khi sống lại — tách rời thời gian (temporal coupling).

---

## 1. Khái niệm Kafka 60 giây

~~~text
Producer → [Topic: task-events] → Consumer Group
              ├── Partition 0: [event1 | event2 | event3]
              ├── Partition 1: [event4 | event5]
              └── Partition 2: [event6]

- Topic: dòng stream sự kiện (task-events)
- Partition: chia nhỏ topic để scale song song
- Offset: con trỏ vị trí consumer đang đọc
- Consumer Group: nhóm cùng xử lý — mỗi partition chỉ 1 consumer trong group
~~~

**Ordering**: đảm bảo trong 1 partition — partition theo key (userId) để giữ thứ tự per-user.

## 2. spring-kafka producer

~~~xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
~~~

~~~yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
~~~

~~~java
@Service
public class TaskEventPublisher {

    private final KafkaTemplate<String, TaskEvent> kafka;

    public TaskEventPublisher(KafkaTemplate<String, TaskEvent> kafka) {
        this.kafka = kafka;
    }

    public void publishTaskCreated(Task task) {
        TaskEvent event = new TaskEvent(
            task.getId(), "TASK_CREATED", task.getTitle(),
            task.getAssignee().getId(), Instant.now());

        kafka.send("task-events",                 // topic
                   task.getAssignee().getId().toString(),  // key → partition
                   event);                        // value
    }
}
~~~

## 3. Consumer

~~~java
@Component
public class NotificationConsumer {

    private static final Logger log = LoggerFactory.getLogger(NotificationConsumer.class);

    @KafkaListener(topics = "task-events", groupId = "notification-service")
    public void onTaskEvent(TaskEvent event) {
        log.info("Nhận event: {}", event);
        // gửi email / push notification...
    }
}
~~~

~~~yaml
spring:
  kafka:
    consumer:
      group-id: notification-service
      auto-offset-reset: earliest      // chưa có offset → đọc từ đầu
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: "vn.mastery.event"
    listener:
      ack-mode: MANUAL_IMMEDIATE       // kiểm soát ack tinh chỉnh
~~~

## 4. Delivery semantics

| Mode | Ý nghĩa | Rủi ro |
|---|---|---|
| At-most-once | Ack trước khi xử lý | Mất message nếu crash |
| **At-least-once** (chuẩn) | Xử lý rồi mới ack | Có thể trùng → **consumer phải idempotent** |
| Exactly-once | Transaction Kafka | Phức tạp, chi phí cao |

:::tip CONSUMER IDEMPOTENT
At-least-once nghĩa là cùng event có thể đến 2 lần (rebalance, retry). Consumer phải xử lý an toàn: check event id đã xử lý chưa (dedup table), hoặc operation tự nhiên idempotent (upsert).
:::

## 5. Error handling — retry + DLQ

~~~java
@RetryableTopic(                      // spring-kafka @RetryableTopic
    attempts = "4",
    backoff = @Backoff(delay = 1000, multiplier = 2),
    dltTopic = "task-events.DLT",     // Dead Letter Queue
    dltStrategy = DltStrategy.FAIL_ON_ERROR
)
@KafkaListener(topics = "task-events", groupId = "notification-service")
public void onTaskEvent(TaskEvent event) {
    process(event);       // fail → retry 1s, 2s, 4s → rơi DLT
}

@DltHandler
public void handleDlt(TaskEvent event) {
    log.error("Event poison sau mọi retry: {}", event);
    // lưu DB để admin xem lại / alert Slack
}
~~~

## 6. Transactional Outbox — pattern sống còn

**Vấn đề**: trong 1 transaction DB, phải cả (a) save Task lẫn (b) publish Kafka. Hai hệ thống khác nhau — không atomic!

~~~java
// ❌ Dual-write problem
@Transactional
public void createTask(...) {
    repo.save(task);                       // thành công
    kafka.send("task-events", event);      // Kafka sập → event MẤT mãi mãi!
}
~~~

**Outbox pattern**: ghi event vào bảng outbox **trong cùng transaction**; worker riêng đọc outbox publish sang Kafka.

~~~sql
CREATE TABLE outbox_events (
    id           UUID PRIMARY KEY,
    aggregate_type VARCHAR(50) NOT NULL,     -- "Task"
    aggregate_id   VARCHAR(50) NOT NULL,
    event_type     VARCHAR(50) NOT NULL,     -- "TASK_CREATED"
    payload        JSONB NOT NULL,
    created_at     TIMESTAMP DEFAULT now(),
    published      BOOLEAN DEFAULT false
);
~~~

~~~java
@Transactional
public void createTask(CreateTaskRequest req) {
    Task task = ...;
    taskRepo.save(task);                       // cùng transaction!

    outboxRepo.save(new OutboxEvent(
        UUID.randomUUID(), "Task", task.getId().toString(),
        "TASK_CREATED",
        toJson(new TaskEvent(task.getId(), ...))));   // atomic với task!
}
// Nếu DB commit → cả task + outbox cùng tồn tại
// Nếu rollback → cả hai cùng biến mất
~~~

Worker (chạy định kỳ hoặc Debezium CDC):

~~~java
@Scheduled(fixedDelay = 1000)
public void publishPending() {
    List<OutboxEvent> pending =
        outboxRepo.findTop100ByPublishedFalseOrderByCreatedAtAsc();

    for (OutboxEvent e : pending) {
        kafka.send(e.getAggregateType() + "-events",
                   e.getAggregateId(), e.getPayload());
        e.setPublished(true);
        outboxRepo.save(e);
    }
    // Crash giữa chừng? Event có thể publish 2 lần → consumer idempotent (đã học)
}
~~~

:::laas ĐỐI CHIẾU LAAS
LAAS có outbox worker (bạn từng audit kiến trúc). Giờ bạn hiểu vì sao: giao dịch tài chính không được mất event. Tìm bảng/code outbox trong repo LAAS và đối chiếu flow: transaction commit → outbox row → worker → Kafka → consumer idempotent.
:::

## 7. Kiến trúc microservices tổng quan

~~~text
┌────────┐   ┌─────────────┐   ┌──────────────────┐
│ Client │ → │ API Gateway │ → │ Task Service     │──┐
└────────┘   │(Spring Cloud│   │ (mặc định CRUD)  │  │ outbox
             │  Gateway)   │   └──────────────────┘  ▼
             └─────────────┘   ┌──────────────────┐ Kafka
                               │ Notification Svc │◄─┘
                               └──────────────────┘
   Keycloak ←────────── mọi service validate JWT
   Redis ←─────────── cache cho hot path
~~~

:::takeaways
- Kafka: topic → partition (ordering per-key) → consumer group scale
- At-least-once → consumer PHẢI idempotent
- @RetryableTopic + DLT: retry backoff, poison message cách ly
- Dual-write problem → Outbox pattern: event atomic với business data
- Worker outbox + idempotent consumer = reliable eventing
:::
`
    },
    {
      id: "6-3",
      type: "lesson",
      title: "Resilience: Circuit Breaker & @Async",
      minutes: 40,
      content: `
## Khi service hàng xóm sập — bạn sống sót thế nào?

Hệ thống phân tán: dependency chậm/sập là **chuyện bình thường**, không phải exception. Resilience = thiết kế cho failure.

---

## 1. Circuit Breaker — mô phỏng cầu chì

3 trạng thái:

~~~text
CLOSED (bình thường) ──fail rate > 50%──→ OPEN (chặn ngay, không gọi)
       ↑                                      │
       └─────half-open thử lại thành công──── ┤ sau wait-duration
                                              ▼
                                         HALF-OPEN (thử 1 lượng nhỏ)
~~~

~~~xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-circuitbreaker-resilience4j</artifactId>
</dependency>
~~~

~~~java
@Service
public class UserService {

    private final UserClient userClient;

    @CircuitBreaker(name = "userService", fallbackMethod = "getUsersFallback")
    @TimeLimiter(name = "userService")               // timeout reactive
    public UserDto getUser(Long id) {
        return userClient.fetchUser(id);            // HTTP call
    }

    // Fallback — cùng chữ ký + Throwable
    private UserDto getUsersFallback(Long id, Throwable t) {
        log.warn("userService down, trả cached default", t);
        return UserDto.cachedDefault(id);            // graceful degradation
    }
}
~~~

~~~yaml
resilience4j:
  circuitbreaker:
    instances:
      userService:
        sliding-window-size: 10          # đánh giá trên 10 call cuối
        failure-rate-threshold: 50       # >50% fail → OPEN
        wait-duration-in-open-state: 30s  # chờ 30s trước half-open
        permitted-number-of-calls-in-half-open-state: 3
  timelimiter:
    instances:
      userService:
        timeout-duration: 3s
  retry:
    instances:
      userService:
        max-attempts: 3
        wait-duration: 500ms
~~~

## 2. Retry — cho transient failure

~~~java
@Retry(name = "userService", fallbackMethod = "fallback")
public UserDto getUser(Long id) { ... }
// Retry cho lỗi tạm thời (timeout, 503). KHÔNG retry cho 404/400!
~~~

:::warn RETRY CÓ THỂ TỰ GIẾT HỆ THỐNG
Service chậm → mọi caller retry → tải x3 → service chết hẳn. Luôn: retry kèm backoff + jitter, giới hạn attempt, và đặt timeout NGẮN hơn timeout của dependency.
:::

## 3. OpenFeign — HTTP client khai báo

~~~xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
~~~

~~~java
@SpringBootApplication
@EnableFeignClients
public class App { ... }

@FeignClient(name = "user-service", url = "\${app.user-service.url}")
public interface UserClient {

    @GetMapping("/api/users/{id}")
    UserDto fetchUser(@PathVariable Long id);
}
// Không viết implementation — Spring generate HTTP call!
~~~

Kết hợp circuit breaker:

~~~java
@FeignClient(name = "user-service",
             url = "\${app.user-service.url}",
             fallbackFactory = UserClientFallbackFactory.class)
public interface UserClient { ... }

@Component
public class UserClientFallbackFactory implements FallbackFactory<UserClient> {
    @Override
    public UserClient create(Throwable cause) {
        return id -> {
            log.warn("user-service unavailable", cause);
            return UserDto.cachedDefault(id);
        };
    }
}
~~~

## 4. @Async — offload việc nặng

~~~java
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean("notificationExecutor")
    public Executor notificationExecutor() {
        ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(4);
        ex.setMaxPoolSize(8);
        ex.setQueueCapacity(100);
        ex.setThreadNamePrefix("notify-");
        ex.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        return ex;
    }
}

@Service
public class NotificationService {

    @Async("notificationExecutor")       // chỉ định pool riêng!
    public CompletableFuture<Void> sendWelcomeEmail(Long userId) {
        // Chạy nền — request thread không chờ
        mailClient.send(...);
        return CompletableFuture.completedFuture(null);
    }
}
~~~

:::tip @ASYNC CŨNG LÀ PROXY!
Tự gọi <code>this.sendWelcomeEmail()</code> → chạy đồng bộ! Ngoài ra: exception trong @Async không lan ra caller — phải log/handle bên trong hoặc trả CompletableFuture exceptionally.
:::

## 5. Virtual threads (Java 21) — thay thế phần lớn @Async

~~~yaml
spring:
  threads:
    virtual:
      enabled: true
~~~

~~~java
// Với virtual threads: blocking call "rẻ" — platform thread nhả cho virtual
// I/O-heavy service không cần phức tạp reactive nữa
@GetMapping("/slow")
public String slow() throws Exception {
    Thread.sleep(5000);          // virtual thread park — không tốn platform thread
    return "done";
}
~~~

## 6. Scheduling — @Scheduled & Quartz

~~~java
@Component
public class OutboxWorker {

    @Scheduled(fixedDelay = 1000)             // sau lần chạy trước kết thúc 1s
    public void publishPending() { ... }

    @Scheduled(cron = "0 0 2 * * *")           // 2h sáng mỗi ngày
    public void nightlyReport() { ... }
}
~~~

Với nhiều instance (K8s nhiều pod) → cần distributed lock (ShedLock) để không chạy trùng:

~~~java
@Scheduled(fixedDelay = 5000)
@SchedulerLock(name = "outboxPublish", lockAtMostFor = "50s")
public void publishPending() { ... }
~~~

:::laas ĐỐI CHIẾU LAAS
LAAS dùng Quartz cho batch scheduling (job phức tạp: cron cluster, persist job state, misfire handling) và có outbox worker chạy định kỳ. @Scheduled + ShedLock đủ cho hầu hết nhu cầu; Quartz khi cần job store bền bỉ + clustering.
:::

:::takeaways
- Circuit breaker: CLOSED → OPEN (fail rate cao) → HALF-OPEN thử lại
- Resilience4j: @CircuitBreaker + @Retry + @TimeLimiter, config YAML
- Fallback = graceful degradation — trả cached/default thay vì lỗi
- @Async pool riêng, nhớ self-invocation trap
- Virtual threads (Java 21) biến blocking code thành "scale không tốn phí"
:::
`
    },
    {
      id: "6-4",
      type: "lesson",
      title: "API Gateway & Service Discovery — cánh cửa duy nhất",
      minutes: 45,
      content: `
## 20 service → client phải biết 20 URL?

SPA gọi loyalty, notification, reporting... mỗi service 1 domain, 1 bộ auth? Gateway là câu trả lời: 1 entry, routing, auth trung tâm, rate limit, correlation ID. K8s service + Gateway API (Spring Cloud Gateway MVC) là stack hiện đại.
---

## 1. Tại sao cần Gateway

| Vấn đề không Gateway | Gateway giải quyết |
|---|---|
| Client giữ N URL, đổi deployment là sửa SPA | 1 base URL, route nội bộ ẩn |
| Mỗi service tự verify JWT, tự rate limit | Auth + rate limit TẬP TRUNG |
| CORS cấu hình rải rác N service | CORS ở 1 nơi duy nhất |
| Không có correlation ID thống nhất | Filter chèn X-Correlation-Id mọi request |

## 2. Spring Cloud Gateway (MVC) — routing

~~~xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway-mvc</artifactId></dependency>
~~~

~~~yaml
spring:
  cloud:
    gateway:
      mvc:
        routes:
          - id: loyalty-service
            uri: http://loyalty-service:8080
            predicates:
              - Path=/api/v1/loyalty/**
            filters:
              - name: RequestRateLimiter
                args:
                  redis-rate-limiter.replenishRate: 100
                  redis-rate-limiter.burstCapacity: 200
          - id: notification-service
            uri: http://notification:8080
            predicates:
              - Path=/api/v1/notifications/**
~~~

Route = predicate (khi nào khớp) + filter (biến đổi). Path predicate phổ biến nhất; RequestRateLimiter dùng Redis token bucket — 100 req/s duy trì, burst 200.

## 3. Auth filter — verify JWT một lần cho toàn hệ

~~~java
@Component
public class JwtRelayFilter implements WebFilter {  

    @Override
    public Mono<Void> filter(ServerWebExchange ex, WebFilterChain chain) {
        String token = ex.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (token == null || !token.startsWith("Bearer ")) {
            return unauthorized(ex, "missing bearer token");
        }

        try {
            Jwt jwt = decoder.decode(token.substring(7));   // verify sig + exp + iss

            // Gắn user context xuống service sau
            ServerHttpRequest mutated = ex.getRequest().mutate()
                .header("X-User-Id", jwt.getSubject())
                .header("X-User-Roles", String.join(",", jwt.getClaim("realm_access.roles")))
                .build();

            return chain.filter(ex.mutate().request(mutated).build());
        } catch (JwtValidationException e) {
            return unauthorized(ex, "invalid token: " + e.getMessage());
        }
    }
}
~~~

Gateway verify 1 lần → service sau chỉ tin header X-User-* (đã qua network trusted). KHÔNG bao giờ cho service nhận X-User-Id từ ngoài gateway — network policy / mTLS đảm bảo chỉ gateway gọi được service.

## 4. Rate limiting — token bucket Redis

~~~java
@Bean
public KeyResolver userKeyResolver() {
    return exchange -> Mono.just(
        Optional.ofNullable(exchange.getRequest().getHeaders().getFirst("X-User-Id"))
            .orElse(exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()));
}
~~~

Khóa theo user (đã auth) hoặc IP — 429 Too Many Requests khi bucket rỗng. Một tenant spam không giết tenant khác.

## 5. Correlation ID — filter chèn trace

~~~java
@Component
public class CorrelationFilter implements WebFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange ex, WebFilterChain chain) {
        String correlationId = Optional.ofNullable(
                ex.getRequest().getHeaders().getFirst("X-Correlation-Id"))
            .orElse(UUID.randomUUID().toString());

        ex.mutate().request(r -> r.headers(h -> h.set("X-Correlation-Id", correlationId)));
        // MDC cho log gateway
        MDC.put("correlationId", correlationId);

        return chain.filter(ex)
            .doFinally(s -> MDC.remove("correlationId"))
            .then(Mono.fromRunnable(() ->
                ex.getResponse().getHeaders().set("X-Correlation-Id", correlationId)));
    }
}
~~~

Mọi log line mọi service mang cùng correlation ID — grep 1 ID thấy toàn bộ hành trình request (Module 7 observability).

## 6. Service Discovery — K8s native

~~~yaml
# K8s Service — DNS nội bộ
apiVersion: v1
kind: Service
metadata:
  name: loyalty-service
spec:
  selector:
    app: loyalty
  ports:
    - port: 8080
~~~

~~~text
http://loyalty-service:8080   → DNS cluster giải đúng pod IP
~~~

Eureka/Consul là lựa chọn VM-era; K8s DNS + Service native gọn hơn (không thêm hạ tầng discovery). Spring Cloud Kubernetes hoặc chỉ plain DNS + RestTemplate/WebClient URL.

:::laas LAAS gateway: Spring Cloud Gateway tập trung auth JWT Keycloak, rate limit theo tenant, correlation ID filter chèn mọi request. Service sau đọc X-User-Id header — network policy chặn gọi trực tiếp bỏ gateway. Đối chiếu vấn đề bạn từng gặp: đổi IP service phải sửa SPA → DNS nội bộ K8s + gateway route giải quyết trọn vẹn.
:::

:::takeaways
- Gateway = 1 entry: routing + auth + rate limit + CORS + correlation ID
- Route = predicate + filter; Path + RequestRateLimiter là 95% use case
- Gateway verify JWT 1 lần → service tin X-User-* header (network trusted)
- Rate limit Redis token bucket: replenishRate + burstCapacity
- K8s DNS service discovery native — Eureka chỉ còn giá trị VM-era
- Correlation ID filter: sinh UUID, đính mọi log + response header
:::
`
    },
    {
      id: "6-5",
      type: "lesson",
      title: "Saga Pattern — distributed transaction đúng cách",
      minutes: 50,
      content: `
## Transaction qua 2 service không thể ACID — làm sao giữ consistency?

Order service commit, payment service fail → order "đã tạo" mà không có payment. 2PC (two-phase commit) cứng nhắc + blocking — saga: chuỗi local transaction + compensating action khi fail. 2 cách triển khai: choreography (event) vs orchestration (coordinator).
---

## 1. Vấn đề phân tán

~~~text
Journey: POST /orders
  ├─ loyalty-service: earn points        (local tx)
  ├─ notification-service: gửi email     (local tx)
  └─ reporting-service: cập nhật stats   (local tx)

loyalty commit + notification fail → trạng thái lệch vĩnh viễn?
~~~

2PC yêu cầu coordinator lock participant chờ vote — toàn hệ đợi, một participant chậm cả chuỗi kẹt. Web-scale từ bỏ 2PC chọn **eventual consistency + saga**.

## 2. Choreography — event-driven, không coordinator

~~~text
OrderService --OrderCreated--> Kafka
LoyaltyConsumer: earn points → PointsEarned → Kafka
NotificationConsumer: gửi mail → MailSent → Kafka
ReportConsumer: cập nhật stats

FAIL CASE:
NotificationConsumer fail → NotificationFailed → Kafka
CompensationConsumer: hủy points đã earn → PointsCancelled → Kafka
~~~

~~~java
@Component
public class LoyaltySagaParticipant {

    @KafkaListener(topics = "order-events")
    @Transactional
    public void onOrderCreated(OrderCreatedEvent event) {
        if (!event.type().equals("ORDER_CREATED")) return;

        pointService.earn(event.memberId(), event.amount());   // local tx
        outbox.publish("loyalty-events", "POINTS_EARNED",      // outbox pattern
            new PointsEarnedEvent(event.orderId(), event.memberId()));
    }
}
~~~

Mỗi participant: local tx + publish event (outbox). Không ai orchestrate — chuỗi tự chảy theo event. Fail → compensation event ngược dòng.

## 3. Orchestration — coordinator điều phối

~~~java
@Service
public class RedeemSagaOrchestrator {

    public SagaResult execute(RedeemCommand cmd) {
        String sagaId = UUID.randomUUID().toString();

        // Bước 1: đặt hold points
        HoldPointsResponse hold = loyaltyClient.hold(sagaId, cmd.memberId(), cmd.points());
        if (!hold.success()) return SagaResult.rejected(hold.reason());

        try {
            // Bước 2: xuất voucher
            Voucher voucher = voucherClient.issue(sagaId, cmd.campaignId(), cmd.memberId());

            // Bước 3: ghi transaction
            transactionService.record(sagaId, cmd, voucher);

            loyaltyClient.commit(sagaId);                     // chốt hold → trừ thật
            return SagaResult.completed(voucher);

        } catch (Exception e) {
            loyaltyClient.release(sagaId);                    // compensate: thả hold
            throw new SagaCompensatedException(sagaId, e);
        }
    }
}
~~~

Orchestrator biết toàn bộ flow: gọi từng bước, biết compensating action cho mỗi bước đã thực hiện. Retry, timeout, saga state persist được (bảng saga_instance).

| | Choreography | Orchestration |
|---|---|---|
| Coupling | Thấp — participant chỉ biết event | Cao — orchestrator biết tất cả |
| Flow visibility | Rải theo topic — khó trace | Tập trung — 1 chỗ đọc hiểu |
| Thêm bước mới | Thêm consumer mới, không đụng ai | Sửa orchestrator |
| Phù hợp | Flow đơn giản, ít bước (<4) | Flow phức tạp, có conditional |

## 4. Compensating action — rollback phân tán

~~~java
// Không phải undo vật lý — là hành động NGHỊA VỤ NGƯỢC
public void compensateRedeem(String sagaId, RedeemState state) {
    // Đã trừ points → cộng lại + ghi transaction type ADJUSTMENT
    pointService.adjust(state.memberId(), +state.points(), "SAGA_COMPENSATE", sagaId);

    // Đã gửi mail → gửi mail thông báo hủy
    notificationClient.sendCancellation(state.memberId(), state.orderId());

    // Đã reserve voucher → đánh dấu voucher EXPIRED
    voucherClient.expire(state.voucherId(), sagaId);
}
~~~

Compensation KHÔNG xóa dữ liệu — ghi bù đắp (ADJUSTMENT transaction). Audit trail giữ nguyên toàn bộ hành trình. Compensation cũng có thể fail → retry + alert + manual intervention queue.

## 5. Idempotency — saga + at-least-once

Mỗi participant xử lý event phải idempotent (Module 6 bài 2). Saga retry gửi lại event → participant nhận trùng → bỏ qua nếu sagaId đã xử lý (unique constraint bảng processed_events).

~~~java
@KafkaListener(topics = "saga-events")
@Transactional
public void onSagaEvent(SagaEvent event) {
    if (processedRepo.existsBySagaIdAndStep(event.sagaId(), event.step())) {
        return;   // đã xử lý — at-least-once an toàn
    }
    // process + record processed
    processedRepo.save(new ProcessedStep(event.sagaId(), event.step()));
    // ... business logic
}
~~~

:::laas LAAS redeem flow là saga orchestration: hold points → issue voucher → commit hold, fail ở giữa release hold + expire voucher. Bạn từng audit thấy bảng saga_instance + processed_events — chính là 2 bảng pattern này. Earn flow đơn giản hơn dùng choreography (event-driven, không orchestrator).
:::

:::takeaways
- Distributed tx: từ bỏ ACID toàn cục — eventual consistency + saga
- Choreography: event-driven, coupling thấp — flow đơn giản
- Orchestration: coordinator điều phối, visibility cao — flow phức tạp
- Compensating action = hành động nghiệp vụ ngược, không phải undo vật lý
- Idempotency saga: sagaId + step unique constraint — retry an toàn
- Outbox + saga: local tx gắn event publish — atomic không 2PC
:::
`
    },
    {
      id: "6-6",
      type: "lesson",
      title: "Quartz & Scheduling nâng cao — job đáng tin trong production",
      minutes: 45,
      content: `
## @Scheduled chạy được — nhưng 3 pod cùng chạy job 2h sáng thì sao?

EOD settlement, expiry scan, outbox worker: cron production phải đáng tin: đúng 1 lần, retry khi fail, observable. @Scheduled đơn thuần không đủ — Quartz + JDBC JobStore + ShedLock là stack chuẩn.
---

## 1. Giới hạn của @Scheduled

~~~java
@Scheduled(cron = "0 0 2 * * *")    // 2h sáng mỗi ngày
public void runEodSettlement() { ... }
~~~

| Vấn đề | Hậu quả |
|---|---|
| N pod = N lần chạy | Double settlement — tiền nhân đôi |
| Không persist | Restart giữa job → việc dở dang mất |
| Không retry | Job fail im lặng đến hôm sau |
| Không history | "Job có chạy không?" — không ai biết |

## 2. ShedLock — đơn giản nhất, đúng 1 instance

~~~xml
<dependency>
    <groupId>net.javacrumbs.shedlock</groupId>
       <artifactId>shedlock-spring</artifactId>
</dependency>
~~~

~~~java
@EnableSchedulerLocking(defaultLockAtMostFor = "10m")
@Configuration
public class SchedulerConfig {

    @Bean
    public LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(dataSource);   // bảng shedlock
    }
}

@Scheduled(cron = "0 0 2 * * *")
@SchedulerLock(name = "eodSettlement", lockAtMostFor = "30m", lockAtLeastFor = "5m")
public void runEodSettlement() { ... }
~~~

Bảng shedlock: 1 row tên job + lock_until timestamp. Pod A khóa → pod B skip. lockAtMostFor: pod crash giữa job, lock tự hết sau 30m (không kẹt vĩnh viễn). lockAtLeastFor: chặn re-run do clock skew nhỏ.

## 3. Quartz JDBC JobStore — history, retry, misfire

~~~yaml
spring:
  quartz:
    job-store-type: jdbc
    properties:
      org.quartz.jobStore.driverDelegateClass: org.quartz.impl.jdbcjobstore.PostgreSQLDelegate
      org.quartz.scheduler.instanceId: AUTO
      org.quartz.threadPool.threadCount: 5
~~~

~~~java
@DisallowConcurrentExecution
public class EodSettlementJob implements Job {

    @Override
    public void execute(JobExecutionContext ctx) throws JobExecutionException {
        try {
            settlementService.processEod(LocalDate.parse(ctx.getTrigger().getKey().getName()));
        } catch (DataAccessException e) {
            // Retry 1 lần sau 5 phút — chờ DB phục hồi
            ctx.getTrigger()...
            throw new JobExecutionException(e, true);   // refire ngay
        }
    }
}
~~~

JDBC store persist trigger + job data trong DB — restart không mất lịch, bảng qrtz_fired_triggers cho thấy job đang chạy, misfire instruction quyết định chạy bù khi job lỡ lịch (pod down lúc 2h, up lúc 2:05 → fire bù).

## 4. Job observability — metric + log + alert

~~~java
@Around("execution(* vn.addpay.loyalty.job..*(..))")
public Object traceJob(ProceedingJoinPoint pjp) throws Throwable {
    long start = System.currentTimeMillis();
    String jobName = pjp.getSignature().toShortString();
    try {
        Object result = pjp.proceed();
        metrics.counter("job.success", "job", jobName).increment();
        return result;
    } catch (Exception e) {
        metrics.counter("job.failure", "job", jobName).increment();
        log.error("Job {} failed", jobName, e);
        throw e;
    } finally {
        metrics.timer("job.duration", "job", jobName)
            .record(System.currentTimeMillis() - start, TimeUnit.MILLISECONDS);
    }
}
~~~

RED cho job: job_success_total, job_failure_total (alert khi tăng), job_duration (p95). Grafana dashboard "Jobs" — SRE nhìn 1 chỗ biết mọi cron khỏe hay ốm.

## 5. Partitioned job — job to chia phần

~~~java
@Scheduled(cron = "0 0 3 * * *")
@SchedulerLock(name = "expiryScan")
public void expiryScan() {
    LocalDate today = LocalDate.now(clock);

    while (true) {
        List<Long> batch = pointRepo.findTop500ByExpiryDateBeforeAndStatus(today, ACTIVE);
        if (batch.isEmpty()) break;

        pointService.expireBatch(batch);   // mỗi batch 1 tx nhỏ
        // flush + clear như Module 3 bài batch
    }
}
~~~

Job xử lý 1M row: KHÔNG 1 tx lớn — chia batch 500, mỗi batch commit riêng. Crash giữa job → batch đã commit còn lại, chạy lại tiếp tục từ vị trí dừng (idempotent theo status).

:::laas LAAS dùng Quartz JDBC store cho EOD settlement + expiry scan — đúng pattern bài này. Bạn từng audit thấy Quartz trong dependency + bảng QRTZ_ trong schema. Bổ sung: AOP metric wrapper cho mọi job class — job failure alert lên Slack kênh #laas-ops, đúng 3 pillars observability của Module 7.
:::

:::takeaways
- @Scheduled nhiều pod = double execution — ShedLock hoặc Quartz clustered
- ShedLock: bảng lock đơn giản, lockAtMostFor chống kẹt vĩnh viễn
- Quartz JDBC store: persist lịch, misfire bù, history bảng qrtz_*
- Job RED metrics: success/failure counter + duration timer — alert khi failure tăng
- Job to: chia batch + commit từng phần — crash resume được, không 1 tx khổng lồ
:::
`
    },
    {
      id: "6-7",
      type: "lesson",
      title: "Multi-tenancy — 1 codebase, N tenant, 0 data leak",
      minutes: 50,
      content: `
## Data tenant A lộ cho tenant B là incident pháp lý, không phải bug thường

Multi-tenant: hạ tầng dùng chung, dữ liệu cách ly tuyệt đối. 3 mô hình isolation với bài toán chi phí ↔ an toàn. Và routing: request đến đúng tenant datasource TỰ ĐỘNG từ JWT — không tồn tại "tham số tenant" trông dev tự nhớ truyền.
---

## 1. 3 mô hình isolation

| | Discriminator column | Schema-per-tenant | DB-per-tenant |
|---|---|---|---|
| Cách làm | Cột tenant_id mọi bảng | Mỗi tenant 1 schema, chung instance | Mỗi tenant 1 database |
| Mức cách ly | Logical (app enforce) | Schema-level | Physical |
| Chi phí hạ tầng | Thấp nhất | Trung bình | Cao nhất |
| Migration | 1 lần cho tất cả | Mọi schema phải chạy | Mọi DB phải chạy |
| Noisy neighbor | Có (chung index, chung bảng) | Ít (index riêng) | Không |
| Tách tenant lớn riêng | Khó | Khó | Dễ (chỉ chuyển DB) |
| Phù hợp | SaaS đông tenant nhỏ (100+) | Vừa (<100), compliance trung bình | Bank/enterprise — tenant ít, yêu cầu cao |

80% SaaS: discriminator + row-level isolation làm chuẩn. Fintech/compliance cao: DB-per-tenant để dữ liệu không trộn physical — yêu cầu audit độc lập.

## 2. TenantContext — ThreadLocal request-scoped

~~~java
public final class TenantContext {

    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

    public static String require() {
        String tenant = CURRENT.get();
        if (tenant == null) throw new MissingTenantException();
        return tenant;
    }

    public static void set(String tenant) { CURRENT.set(tenant); }
    public static void clear() { CURRENT.remove(); }  // thread pool TÁI SỬ DỤNG
}
~~~

~~~java
@Component
public class TenantFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain)
            throws ServletException, IOException {
        try {
            Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

            if (auth instanceof JwtAuthenticationToken jwtAuth) {
                String tenant = jwtAuth.getToken().getClaimAsString("tenant_id");
                if (tenant == null) {
                    res.sendError(400, "missing tenant claim");
                    return;
                }
                TenantContext.set(tenant);
            }
            chain.doFilter(req, res);
        } finally {
            TenantContext.clear();   // KHÔNG clear = leak tenant sang request sau
        }
    }
}
~~~

Tenant đến từ JWT claim — KHÔNG BAO GIỜ từ query param/header client tự khai (user tự xưng tenant là lỗ hổng vỡ_tophouse).

## 3. Mô hình 1 — discriminator + Hibernate filter

~~~java
@Entity
@FilterDef(name = "tenantFilter",
           parameters = @ParamDef(name = "tenantId", type = String.class))
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@Table(name = "member")
public class Member {
    @Id @GeneratedValue Long id;
    String tenantId;
    String cif;
    // ...
}
~~~

~~~java
@Aspect
@Component
public class TenantFilterAspect {

    @PersistenceContext EntityManager em;

    @Before("execution(* vn.addpay..repository..*(..))")
    public void enableTenantFilter() {
        em.enableFilter("tenantFilter")
          .setParameter("tenantId", TenantContext.require());
    }
}
~~~

Mọi SELECT entity tự động WHERE tenant_id = ?. Quên enable filter = lộ data — nên enable bằng AOP toàn cục (không phải dev nhớ gọi) + integration test quét "không query nào thiếu điều kiện tenant".

:::warn NATIVE QUERY VƯỢT QUA FILTER
Hibernate @Filter chỉ áp cho entity query qua session. createNativeQuery và một số JPQL tùy biến KHÔNG được filter tự động — mọi native query phải tự gắn tenant_id từ TenantContext. Đây là lỗ hổng số 1 của mô hình discriminator, phải có test tự động canh.
:::

## 4. Mô hình 2 — AbstractRoutingDataSource

~~~java
public class TenantRoutingDataSource extends AbstractRoutingDataSource {

    public TenantRoutingDataSource(DataSource defaultDs,
                                   Map<Object, DataSource> tenants) {
        setDefaultTargetDataSource(defaultDs);
        setTargetDataSources(new HashMap<>(tenants));
    }

    @Override
    protected Object determineCurrentLookupKey() {
        return TenantContext.require();   // key → datasource tenant tương ứng
    }
}
~~~

~~~java
@Configuration
public class DataSourceConfig {

    @Bean
    public DataSource dataSource() {
        Map<Object, DataSource> tenants = Map.of(
            "addpay",   buildDs("jdbc:postgresql://db-1:5432/loyalty_addpay"),
            "demo-ols", buildDs("jdbc:postgresql://db-2:5432/loyalty_demools")
        );
        return new TenantRoutingDataSource(defaultDataSource(), tenants);
    }

    private DataSource buildDs(String url) {
        HikariConfig cfg = new HikariConfig();
        cfg.setJdbcUrl(url);
        cfg.setMaximumPoolSize(10);      // pool RIÊNG từng tenant
        return new HikariDataSource(cfg);
    }
}
~~~

Pool riêng từng tenant: tenant to bận rộn không làm tenant nhỏ đói connection.

:::warn ROUTING + TRANSACTION BẪY THỨ TỰ
Connection được lấy LAZY lúc query đầu tiên chạy. @Transactional mở trước, TenantContext.set() sau đó = routing không đổi nữa (connection đã bound vào transaction). Chuẩn: filter set tenant TRƯỚC khi vào service transactional. @Async + @Scheduled: ThreadLocal KHÔNG truyền qua thread — event/job phải mang tenantId trong payload rồi set lại đầu method.
:::

## 5. Migration + Flyway multi-schema

~~~yaml
spring:
  flyway:
    schemas: addpay,demo-ols     # chạy tuần tự mọi schema
    default-schema: addpay
~~~

Tenant mới onboard: tạo schema + chạy cùng bộ V* — tự động hóa provisioning bằng script/ops endpoint, không tạo tay từng env.

## 6. Cache + Kafka cũng phải tenant-aware

~~~java
@Cacheable(cacheNames = "memberBalance",
           key = "T(vn.addpay.common.TenantContext).require() + ':' + #cif")
public PointsBalance balance(String cif) { ... }
~~~

Cache key thiếu prefix tenant = HIT nhầm data tenant khác — bug ngầm khó debug nhất multi-tenant (không exception, chỉ số sai). Kafka: mọi event mang tenantId trong header, consumer set TenantContext từ header trước khi xử lý — mất nó là consumer ghi nhầm schema.

:::laas Audit kiến trúc LAAS của bạn đã ghi nhận multi-tenant datasource routing — AbstractRoutingDataSource đúng pattern mục 4: request → JWT claim tenant → ThreadLocal → routing datasource + pool riêng. Đối chiếu vì sao mọi bảng LAAS đều có tenant_id và Kafka event bắt buộc tenantId header: quên đúng MỘT chỗ, cross-tenant leak — loại incident phải báo cáo khách hàng đầu tiên, không phải bug nội bộ.
:::

:::takeaways
- 3 mô hình: discriminator (SaaS đông), schema-per-tenant (vừa), DB-per-tenant (compliance cao)
- Tenant lấy từ JWT claim — không bao giờ tin header/query client tự khai
- TenantContext ThreadLocal: filter set, finally clear — thread pool tái sử dụng
- Hibernate @Filter tự gắn WHERE tenant_id; native query VƯỢT QUA — AOP enable + test quét leak
- AbstractRoutingDataSource + pool riêng từng tenant; set tenant trước transaction
- Cache key và Kafka header phải tenant-aware — quên là leak không exception
:::
`
    },
    {
      id: "6-8",
      type: "lesson",
      title: "Redis nâng cao — stampede, distributed lock, pub/sub evict",
      minutes: 45,
      content: `
## Cache stampede: 500 request cùng miss, 500 query DB cùng lúc, DB gục

Key điểm balance hết hạn đúng giờ cao điểm: mọi request thấy miss, tất cả xuyên qua xuống DB trong cùng 1 giây → timeout → cascade. Stampede, distributed lock, pub/sub evict — lớp Redis production mà tutorial chẳng dạy.
---

## 1. Cache stampede — 3 lớp phòng thủ

~~~java
// Lớp 1: sync=true — các request cùng key CHỜ 1 thread load
@Cacheable(cacheNames = "memberBalance", key = "#cif", sync = true)
public PointsBalance balance(String cif) { ... }
~~~

~~~java
// Lớp 2: TTL jitter — key không cùng lúc hết hạn
int ttl = 300 + ThreadLocalRandom.current().nextInt(30);   // 300s ± 30s
~~~

~~~java
// Lớp 3: logical expiry — key không bao giờ miss cứng
public PointsBalance balanceWithLogicalExpiry(String cif) {
    String raw = redis.get("balance:" + cif);
    if (raw == null) return loadAndSet(cif);        // cold miss

    CachedBalance cached = parse(raw);
    if (cached.expiresAt().isAfter(Instant.now())) {
        return cached.value();                       // còn hạn — trả ngay
    }
    refreshExecutor.submit(() -> loadAndSet(cif));   // hết hạn logical
    return cached.value();   // trả STALE + refresh ngầm — user không chờ
}
~~~

| Lớp | Chống gì | Đánh đổi |
|---|---|---|
| sync = true | Cùng key miss song song | Request sau chờ thread đầu |
| TTL jitter | Hàng loạt key trùng giờ hết hạn | 1 dòng code |
| Logical expiry + async refresh | DB không thấy spike miss | Serve stale ngắn — chấp nhận cho balance hiển thị |

## 2. Distributed lock — SETNX đúng cách

~~~java
// SAI: setnx không TTL — process crash giữa chừng, lock kẹt MÃI MÃI
redis.opsForValue().setIfAbsent("lock:report:" + tenant, "1");

// ĐÚNG: value + TTL ATOMIC, value là token random duy nhất
String lockToken = UUID.randomUUID().toString();
Boolean acquired = redis.opsForValue().setIfAbsent(
    "lock:report:" + tenant,
    lockToken,
    Duration.ofMinutes(5));
~~~

~~~java
if (Boolean.TRUE.equals(acquired)) {
    try {
        return generateReport(tenant);        // chỉ 1 instance chạy
    } finally {
        // Chỉ GIẢI PHÓNG lock token của MÌNH — so rồi xóa, ATOMIC bằng Lua
        String script = """
            if redis.call('get', KEYS[1]) == ARGV[1] then
                return redis.call('del', KEYS[1])
            else
                return 0
            end
            """;
        redis.execute(new DefaultRedisScript<>(script, Long.class),
            List.of("lock:report:" + tenant), lockToken);
    }
}
throw new ReportInProgressException();
~~~

2 quy tắc sắt: (1) lock PHẢI có TTL — crash không kẹt vĩnh viễn; (2) chỉ xóa lock token mình sở hữu — so token rồi xóa, tách 2 bước là bug kinh điển (A xóa nhầm lock B vừa lấy).

## 3. Redisson — lock production-grade

~~~java
RLock lock = redisson.getLock("lock:redeem:" + cif);

if (lock.tryLock(2, 30, TimeUnit.SECONDS)) {   // chờ tối đa 2s, giữ tối đa 30s
    try {
        return redeemService.execute(cmd);
    } finally {
        lock.unlock();
    }
}
throw new ConcurrentRedeemException();
~~~

Redisson tự lo phần khó: watchdog gia hạn lock khi process còn sống (tránh TTL hết giữa lúc đang chạy), mọi thao tác Lua atomic, reentrant. Cần lock phân tán nghiêm túc — Redisson thay tự viết bằng tay.

## 4. Pub/Sub — evict cache trên mọi instance

~~~java
// Instance A vừa update data → publish
redis.convertAndSend("cache-evict", "memberBalance:" + cif);
~~~

~~~java
// MỌI instance subscribe — local cache từng pod tự dọn
@Component
public class CacheEvictSubscriber implements MessageListener {

    private final Cache<String, Object> localCache;   // Caffeine L1

    @Override
    public void onMessage(Message message, byte[] pattern) {
        localCache.invalidate(new String(message.getBody()));
    }
}
~~~

L1 (Caffeine in-memory) + L2 (Redis): hit rate cao nhưng evict phải lan tỏa — pub/sub là kênh. Cần guaranteed (subscriber restart không mất message) → Redis Streams thay pub/sub (fire-and-forget).

## 5. Redis ngoài cache — cấu trúc dữ liệu đáng dùng

~~~bash
ZADD leaderboard:tenant-a 1500 "CIF-001"     # sorted set — bảng xếp hạng
ZREVRANK leaderboard:tenant-a "CIF-001"       # hạng của 1 member

HINCRBY ratelimit:api:cif-001 20261002 1     # hash counter — rate limit theo ngày
EXPIRE ratelimit:api:cif-001 90000

SET dedup:event-47281 "" EX 86400 NX         # idempotency — event đã xử lý chưa?
~~~

Leaderboard ZSET nhớ pagination Module 2 bài keyset? ZREVRANGE theo index ổn định — keyset hoàn hảo, không có duplicate row như OFFSET.

## 6. Bẫy vận hành Redis

- **Big key**: hash 2 triệu field — xóa block event loop (dùng UNLINK thay DEL), thiết kế split từ đầu
- **Eviction policy**: allkeys-lru cho pure cache; volatile-lru khi Redis vừa cache vừa giữ data
- **Serialization**: JDK serializer chỉ Java đọc được — GenericJackson2JsonRedisSerializer để redis-cli debug được
- **Hot key**: 1 key ăn 80% QPS — thêm L1 Caffeine chặn trước khi chạm Redis
- **KEYS command trong code**: quét O(N) block cả Redis — luôn dùng SCAN cursor

:::laas LAAS điểm balance cache là stampede candidate kinh điển: key per CIF hết hạn rải rác, nhưng giờ cao điểm TTL trùng cụm. Chuẩn production: @Cacheable sync + TTL jitter là baseline; report lớn (CPU-bound) dùng Redisson lock chặn 2 pod cùng generate — bạn từng audit thấy job generate đối chiếu đúng pattern này. Đối chiếu Module 6 bài caching: stampede là lý do THẬT khiến "cache hết hạn" thành incident, không phải lý thuyết.
:::

:::takeaways
- Stampede 3 lớp: sync=true, TTL jitter, logical expiry + async refresh (stale-while-revalidate)
- Lock phân tán: setIfAbsent value + TTL atomic; giải phóng bằng Lua so token — chỉ xóa lock mình giữ
- Redisson: watchdog gia hạn + reentrant — thay tự viết khi lock nghiêm túc
- Pub/sub evict cho L1 Caffeine nhiều pod; Redis Streams khi cần guaranteed
- Leaderboard ZSET, rate limit hash, idempotency SET NX — Redis hơn hẳn một cache
- Big key, KEYS command, JDK serializer: 3 bẫy vận hành tránh từ ngày đầu
:::
`
    },
    {
      id: "6-9",
      type: "lesson",
      title: "Spring Batch — đối soát 2 triệu dòng qua đêm, có thể restart",
      minutes: 50,
      content: `
## Job 2h sáng chạy @Scheduled + vòng for — chết giữa chừng là CHẠY LẠI TỪ ĐẦU

Xử lý đối soát 2 triệu bản ghi trong 1 method @Scheduled: crash ở bản ghi 1.9 triệu → restart chạy lại từ 0, duplicate dữ liệu, không biết đã xử lý đến đâu. Spring Batch sinh ra cho bài toán này: chunk-based processing, checkpoint tự động, restart từ đúng chỗ chết, skip/retry có kiểm soát.
---

## 1. @Scheduled + for-loop vs Spring Batch

| Nhu cầu | @Scheduled tự viết | Spring Batch |
|---|---|---|
| Lịch chạy | Có | Có (kết hợp Quartz/scheduler ngoài) |
| Phân mảnh commit | Tự viết | Chunk tự commit mỗi N bản ghi |
| Crash giữa chừng | Chạy lại từ đầu | Restart TỪ CHUNK cuối |
| Skip bản ghi lỗi | Tự viết flag | skip policy config |
| Retry tạm thời | Tự viết | retry có backoff |
| Audit đã chạy đến đâu | Không | JobRepository — bảng metadata |
| Scale đa pod | Không | Partitioning / remote chunking |

Quartz ≠ Batch: Quartz là SCHEDULER (khi nào chạy), Batch là EXECUTION framework (chạy thế nào cho an toàn). LAAS dùng Quartz đánh thức job — bên trong job nặng nên là Spring Batch. Hai thứ bổ sung nhau, không thay nhau.

## 2. Job / Step / Reader / Processor / Writer

~~~xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-batch</artifactId>
</dependency>
~~~

~~~java
@Configuration
public class ReconciliationJobConfig {

    @Bean
    public Job reconciliationJob(JobRepository repo, Step reconcileStep) {
        return new JobBuilder("reconciliationJob", repo)
            .incrementer(new RunIdIncrementer())   // mỗi chạy = instance mới
            .start(reconcileStep)
            .build();
    }

    @Bean
    public Step reconcileStep(JobRepository repo,
                              PlatformTransactionManager tx,
                              JpaPagingItemReader<TxnRow> reader,
                              ItemProcessor<TxnRow, ReconResult> processor,
                              JpaItemWriter<ReconResult> writer) {
        return new StepBuilder("reconcileStep", repo)
            .<TxnRow, ReconResult>chunk(500, tx)   // commit mỗi 500 bản ghi
            .reader(reader)
            .processor(processor)
            .writer(writer)
            .faultTolerant()
                .skip(ReconDataException.class)    // dữ liệu bẩn → bỏ qua
                .skipLimit(100)                    // quá 100 lỗi = dừng hẳn
                .retry(DeadlockLoserDataAccessException.class)
                .retryLimit(3)                     // deadlock → thử lại 3 lần
            .build();
    }
}
~~~

Luồng chunk: đọc 500 → process 500 (transform/filter) → write 500 → COMMIT → chunk kế tiếp. Crash ở chunk 38? Metadata đã ghi chunk 37 xong — restart NHẢY VÀO chunk 38, không đụng 37 chunk đã commit.

## 3. JobRepository — metadata là trái tim restart

~~~yaml
spring:
  batch:
    jdbc:
      initialize-schema: always   # hoặc Flyway quản (bài 3-7)
    job:
      enabled: true               # chạy job từ main args/REST, không auto lúc start
~~~

Bảng BATCH_JOB_EXECUTION, BATCH_STEP_EXECUTION ghi lại từng lần chạy: status, đọc đến đâu, skip bao nhiêu. Nguyên tắc vận hành:

~~~java
// REST endpoint trigger job — operator gọi khi cần, kèm parameter duy nhất
@PostMapping("/ops/jobs/reconciliation")
public ResponseEntity<?> trigger(@RequestParam LocalDate businessDate) {
    JobParameters params = new JobParametersBuilder()
        .addLocalDate("businessDate", businessDate)
        .toJobParameters();
    JobExecution exec = launcher.run(reconciliationJob, params);
    return ResponseEntity.accepted().body(Map.of(
        "runId", exec.getId(), "status", exec.getStatus().toString()));
}
~~~

Cùng job + cùng parameters đang RUNNING → chạy lại bị từ chối (mặc định) — chống 2 pod cùng trigger. JobInstance = định danh (job + params); JobExecution = từng lần thử. Restart = tạo JobExecution mới trong CÙNG JobInstance — kế thừa tiến độ.

## 4. Scale — từ 1 thread đến nhiều pod

~~~text
Multi-threaded step: 1 pod, nhiều thread đọc chung — đơn giản, chỉ khi reader thread-safe (paging)
Partitioning:          master chia range (vd id 1-500k, 500k-1M) → workers xử lý song song
Remote chunking:      reader ở master, gửi chunk qua queue cho worker — hiếm khi cần
~~~

~~~java
@Bean
public Step partitionedMaster(JobRepository repo, Step workerStep) {
    return new StepBuilder("master", repo)
        .partitioner("workerStep", rangePartitioner())   // chia theo id range
        .step(workerStep)
        .gridSize(4)                                     // 4 partition song song
        .taskExecutor(taskExecutor())
        .build();
}
~~~

## 5. Đối chiếu thực chiến LAAS

Job hết hạn điểm (points expiry) đêm 30/30: đọc mọi balance có expiry_date ≤ hôm nay → trừ điểm → ghi expire transaction → gửi event. Yêu cầu: không bỏ sót balance nào, không trừ 2 lần, restart an toàn. Đó chính là bài toán Spring Batch ra đời để giải quyết: chunk + idempotent writer (upsert theo balance_id + kỳ expiry) + skip policy cho balance lock.

:::warn ĐỪNG DÙNG BATCH CHO MỌI THỨ
Batch là trọng tải: start job ~ vài giây, metadata insert, transaction từng chunk. Task nhẹ (< vài nghìn bản ghi, < vài giây) → @Async + @EventListener đủ, nhét vào Batch là over-engineering. Ngược lại task triệu bản ghi tự viết bằng for-loop trong @Scheduled là nợ kỹ thuật chờ ngày chết service.
:::

## 6. Bảng cân đối quyết định

| Tình huống | Chọn |
|---|---|
| Đôi nghìn bản ghi, chạy nhanh | @Async + @Transactional |
| Định kỳ triệu bản ghi, cần restart/skip | Spring Batch chunk |
| Cần chạy lúc chính xác + cluster lock | Quartz + ShedLock (đánh thức Batch) |
| Stream liên tục real-time | Kafka consumer (bài 6-2) — không phải batch |

:::laas LAAS và OLS chạy batch đối soát/generate báo cáo mỗi đêm qua Quartz scheduler — nhưng phần THÂN job hiện là vòng for lớn trong service method: crash nửa chừng phải dọn tay bảng tạm. Đường chuẩn của bạn sau khóa này: giữ Quartz làm chuông đánh thức, chuyển thân job sang Spring Batch chunk 500 + skip policy + JobRepository audit — đêm nào ops cũng trả lời được "job chạy đến đâu, skip mấy dòng, vì sao" bằng 1 câu SQL vào bảng metadata thay vì mò log CloudWatch.
:::

:::takeaways
- Chunk 500: commit theo đợt — crash giữa chừng restart TỪ CHUNK cuối, không từ số 0
- JobRepository metadata: audit chạy đến đâu, skip mấy dòng — 1 câu SQL thay mò log
- skipLimit + retryLimit: dung thuốc đúng liều — lỗi dữ liệu skip, lỗi tạm thời retry, quá hạn DỪNG
- Cùng JobInstance restart kế thừa tiến độ; params khác = instance mới
- Quartz là scheduler, Batch là execution — kết hợp, không thay thế
- Task nhẹ @Async đủ; triệu bản ghi mới là sân của Batch
:::
`
    },
    {
      id: "6-10",
      type: "lesson",
      title: "RabbitMQ & Spring Cloud Stream — đúng broker cho đúng việc",
      minutes: 45,
      content: `
## Mọi event nhét vào Kafka — kể cả task "gửi email xác nhận" chờ 5 giây

Kafka là nhật ký append-only phân partition: xuất sắc cho event stream replay được, kém cho hàng đợi công việc phân phối từng consumer (mỗi message đúng 1 handler, xong là bỏ). RabbitMQ ngược lại: routing linh hoạt, per-message ack, hàng đợi thật. Và Spring Cloud Stream đứng trên cả hai: code không đổi, đổi broker đổi config.
---

## 1. Kafka vs RabbitMQ — bản chất khác nhau

| | Kafka | RabbitMQ |
|---|---|---|
| Mô hình | Append-only log, consumer tự track offset | Queue phân phối, message xóa sau ack |
| Replay | Có — đọc lại từ đầu topic | Không — ack là hết |
| Ordering | Theo partition — đảm bảo | Theo queue, gần đúng |
| Routing | Topic thẳng (không routing phức tạp) | Exchange: direct/topic/fanout/header |
| Throughput | Rất cao (hàng trăm k/s) | Cao (chục k/s) — đủ phần lớn use case |
| Độ trễ | ms | µs-ms |
| Use case chuẩn | Event sourcing, analytics, outbox stream | Task queue, RPC async, routing đa dạng |

Nguyên tắc chọn: dữ liệu là SỰ KIỆN quan trọng cần replay → Kafka. Dữ liệu là VIỆC CẦN LÀM xong bỏ → RabbitMQ. Dùng nhầm: email queue trên Kafka = group consumer phải offset thủ công + KHÔNG có per-message ack tự nhiên.

## 2. AMQP model — exchange → queue qua binding

~~~text
Producer → Exchange (direct/topic/fanout) → Binding(rule) → Queue → Consumer

direct:  routing key khớp chính xác
topic:   pattern — "tenant.*.redeem", "*.high-priority"
fanout:  broadcast mọi queue bind vào
headers: route theo header attribute
~~~

~~~java
@Configuration
public class AmqpConfig {

    @Bean
    public TopicExchange loyaltyExchange() {
        return ExchangeBuilder.topicExchange("loyalty.events")
            .durable(true).build();
    }

    @Bean
    public Queue notificationQueue() {
        return QueueBuilder.durable("loyalty.notification")
            .withArgument("x-dead-letter-exchange", "loyalty.dlx")   // DLQ
            .build();
    }

    @Bean
    public Binding notificationBinding(TopicExchange ex, Queue q) {
        return BindingBuilder.bind(q).to(ex).with("tenant.*.redeemed");
    }
}
~~~

Tenant A có queue riêng bind "tenant-a.#", service notification bind "tenant.*.redeemed" — cùng 1 exchange, routing theo nhu cầu từng consumer, producer không cần biết ai listening.

## 3. Spring AMQP — producer/consumer

~~~java
@Service
public class EventPublisher {

    private final RabbitTemplate amqp;

    public void publish(RedeemEvent event) {
        amqp.convertAndSend("loyalty.events",
            event.tenantId() + ".redeemed", event,
            m -> { m.getMessageProperties()
                     .setHeader("tenantId", event.tenantId());
                   return m; });
    }
}
~~~

~~~java
@Component
public class NotificationConsumer {

    @RabbitListener(queues = "loyalty.notification",
                    ackMode = "MANUAL")
    public void handle(RedeemEvent event, Channel ch,
                       @Header(name = "amqp_deliveryTag") long tag) throws IOException {
        try {
            notificationService.sendRedeemed(event);
            ch.basicAck(tag, false);
        } catch ( BusinessException e) {
            // nghiệp vụ sai — KHÔNG requeue vòng vo, sang DLQ
            ch.basicNack(tag, false, false);
        } catch (TransientException e) {
            ch.basicNack(tag, false, true);   // tạm thời — requeue thử lại
        }
    }
}
~~~

Ack thủ công: xử lý xong mới ack — consumer chết giữa chừng, message quay lại queue cho consumer khác. Phân biệt lỗi nghiệp vụ (DLQ, có người xem) và lỗi tạm thời (requeue/retry).

## 4. Spring Cloud Stream — abstraction đổi broker không đổi code

~~~xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-stream-binder-rabbit</artifactId>
</dependency>
<!-- đổi sang Kafka: spring-cloud-stream-binder-kafka — application code GIỮ NGUYÊN -->
~~~

~~~yaml
spring:
  cloud:
    function:
      definition: redeemProcessor;notificationSink
    stream:
      bindings:
        redeemProcessor-in-0:
          destination: loyalty.events
          group: loyalty-core
        notificationSink-in-0:
          destination: loyalty.events
          group: notification
~~~

~~~java
@Configuration
public class StreamFunctions {

    @Bean
    public Function<RedeemEvent, RedeemedEvent> redeemProcessor() {
        return event -> loyaltyCore.process(event);
    }

    @Bean
    public Consumer<RedeemedEvent> notificationSink() {
        return event -> notificationService.send(event);
    }

    @Bean
    public StreamBridge streamBridge() { ... }   // send động không khai báo trước
}
~~~

Functional model: Spring tự nối bean Function/Consumer vào destination theo config — không annotation @RabbitListener/@KafkaListener trong code nghiệp vụ. Group = consumer group (scale-out phân tải + failover).

## 5. Error handling chuẩn SCS

~~~yaml
spring:
  cloud:
    stream:
      bindings:
        redeemProcessor-in-0:
          consumer:
            max-attempts: 3            # retry trong memory trước DLQ
      rabbit:
        bindings:
          redeemProcessor-in-0:
            consumer:
              auto-bind-dlq: true      # tự tạo DLQ + routing sang
              dlq-ttl: 604800000       # DLQ sống 7 ngày rồi bỏ
~~~

3 lần retry exponential → DLQ → ops dashboard xem messageId. Chuẩn giống hệt DLQ Kafka bài 6-2 nhưng khai báo bằng config — đổi binder vẫn giữ ngữ nghĩa.

:::warn SCS KHÔNG CHE ĐẦY ĐỦ 100%
Semantic khác nhau vẫn lộ: Kafka ordering theo partition vs Rabbit per-queue; Kafka replay từ offset vs Rabbit ack-xóa-là-hết. Abstraction tiện khi đổi VẬN HÀNH (cluster, cloud managed), không đảm bảo mô hình sự kiện chuyển đổi liền mạch — thiết kế dùng replay (outbox → event sourcing) thì Kafka vẫn là quyết định kiến trúc, không phải config.
:::

## 6. Bảng quyết định tổng

| Tình huống | Chọn |
|---|---|
| Outbox event stream, analytics, replay | Kafka |
| Task queue (email, SMS, generate report) | RabbitMQ |
| Routing phức tạp đa consumer theo pattern | RabbitMQ topic exchange |
| Muốn code broker-agnostic, đổi config là đổi | Spring Cloud Stream |
| RPC async có response | RabbitMQ (reply-to) hoặc gRPC đồng bộ |

:::laas LAAS notification pipeline là RabbitMQ use case textbook: redeem event → task "gửi SMS/notify từng user" — làm xong bỏ, KHÔNG cần replay. Giữ Kafka cho outbox đối soát (replay được là yêu cầu audit), thêm Rabbit cho notification queue per-message ack + DLQ chứa SMS lỗi gửi. Nếu ngày mai muốn gom cả hai về một abstraction: Spring Cloud Stream functional binding — service code không biết underneath là AMQP hay Kafka, chỉ đổi binder trong pom.
:::

:::takeaways
- Kafka = append-only log replay được (event stream); RabbitMQ = queue ack-xóa (task phân phối)
- Email/report queue trên Kafka là dùng nhầm — per-message ack + DLQ là sân của Rabbit
- Topic exchange "tenant.*.redeemed": routing đa consumer, producer không biết ai nghe
- Ack thủ công: xong mới ack, chết giữa chừng message về queue — ok chính xác 1 lần xử lý
- Cloud Stream functional model: đổi binder rabbit↔kafka bằng pom, code nghiệp vụ nguyên
- SCS che vận hành, không che semantic — replay/ordering vẫn là quyết định kiến trúc
:::
`
    },
    {
      id: "6-11",
      type: "lesson",
      title: "Spring Modulith & ArchUnit — modular monolith có pháp luật",
      minutes: 45,
      content: `
## Monolith 1 triệu dòng — mọi package import mọi package, không ai dám đụng

Microservice tách boundary bằng network call — rõ nhưng đắt: distributed transaction, ops 10 service. Modular monolith tách boundary bằng PACKAGE + luật kiểm tra tự động: deploy 1 artifact, nhưng code phạm vi module nghiêm ngặt như service riêng. Spring Modulith của chính Spring team hiện thực hóa ý tưởng này — và LAAS của bạn chính là kiến trúc đó.
---

## 1. Spectrum — không phải chỉ monolith hay microservices

| | Modulith là gì | So microservices | So monolith bẩn |
|---|---|---|---|
| Boundary | Package + test enforcement | Network + team riêng | Không có |
| Gọi chéo module | Direct call trong JVM (nhanh) | HTTP/gRPC (network) | Ai cũng gọi ai |
| Transaction | Cục bộ 1 DB — đơn giản | Phân tán — saga | Vụng trộn |
| Deploy | 1 artifact | Từng service | 1 artifact |
| Trượt về chaos | Có ArchUnit canh | Ít (network cản) | Đã ở đó |

80% hệ vừa: modular monolith + 1-2 service tách thật sự khi CẦN (AI module ngoài, PDF renderer nặng). Đừng tách 12 service vì phong trào.

## 2. Cấu trúc module chuẩn Modulith

~~~text
vn.addpay.loyalty/
  loyalty-core/                 ← MODULE gốc
    member/                     ← module con
    transaction/
    redeem/
  notification/                 ← module khác — KHÔNG đụng internals của core
  integration/
    keycloak/
~~~

~~~java
// Mọi bean public của module = package-info.java của module gốc
@Modulithic(sharedModules = "shared", useExternBundles = true)
package vn.addpay.loyalty;

import org.springframework.modulith.Modulithic;
~~~

~~~java
// loyalty-core/member/package-info.java
@ApplicationModule(displayName = "Member Module")
package vn.addpay.loyalty.loyaltycore.member;

import org.springframework.modulith.ApplicationModule;
~~~

Mặc định: chỉ interface/bean được expose tại package GỐC của module (member/) là public API — class trong member.internal chỉ module đó dùng. Code notification gọi loyaltycore.member.internal.ProfileValidator là LỖI KIẾN TRÚC.

## 3. Modulith verification — test chạy là phát hiện vi phạm

~~~xml
<dependency>
    <groupId>org.springframework.modulith</groupId>
    <artifactId>spring-modulith-starter-test</artifactId>
    <scope>test</scope>
</dependency>
~~~

~~~java
class ModularityTest {

    ApplicationModules modules = ApplicationModules.of(LoyaltyApp.class);

    @Test
    void verifiesModularStructure() {
        modules.verify();   // FAIL nếu module nào ăn vào internals module khác
    }

    @Test
    void printDocumentation() {
        new Documenter(modules).writeModulesCanviz();   // sinh sơ đồ PlantUML
    }
}
~~~

~~~text
Violation: Module 'notification' depends on non-exposed type
'vn.addpay.loyalty.loyaltycore.member.internal.ProfileValidator'!
~~~

CI đỏ khi ai đó import lén internals — boundary là LUẬT có cảnh sát, không phải quy ước miệng "các bạn đừng gọi nhé".

## 4. Giao tiếp chéo module — event chuẩn Modulith

~~~java
// core publish — KHÔNG gọi notification trực tiếp
@Service
public class RedeemService {

    private final ApplicationEventPublisher events;

    public RedeemResult redeem(RedeemCommand cmd) {
        RedeemResult result = execute(cmd);
        events.publishEvent(new RedeemedEvent(result.cif(), result.amount()));
        return result;
    }
}
~~~

~~~java
// notification listen — gắn kết bằng event, không bằng dependency
@ApplicationModuleListener
public class RedeemNotificationListener {

    @EventListener
    public void on(RedeemedEvent event) {
        notificationService.sendRedeemed(event);
    }
}
~~~

@ApplicationModuleListener = @TransactionalEventListener(phase = AFTER_COMMIT) + async: event chỉ đến SAU khi transaction redeem commit — không notify "đổi thành công" rồi rollback quật lại. Event publication registry (bảng event_publication) ghi mọi event chưa consumed — listener chết giữa chừng, khởi động lại tự tiếp tục (đó chính là outbox nội bộ lightweight, bài 6-2 là bản full Kafka).

## 5. ArchUnit — luật kiến trúc tổng quát

Modulith canh module của chính nó; ArchUnit viết luật cho MỌI thứ:

~~~java
@AnalyzeClasses(packages = "vn.addpay.loyalty")
class ArchitectureRulesTest {

    @ArchTest
    static final ArchRule controllers_khong_dung_repository_truc_tiep =
        noClasses().that().resideInAPackage("..controller..")
            .should().dependOnClassesThat()
            .resideInAPackage("..repository..");

    @ArchTest
    static final ArchRule module_internal_khong_bi_nhap_len =
        slices().matching("vn.addpay.loyalty.(*)..")
            .should().notDependOnEachOther();

    @ArchTest
    static final ArchRule khong_dung_field_injection =
        noClasses().should().beAnnotatedWith("@Autowired");
}
~~~

Luật thường có giá trị nhất: controller không đụng repository (bắt buộc qua service), không field injection (constructor injection test được), service module không vòng tròn tham chiếu. Viết 1 lần — CI canh mãi mãi.

## 6. Kế hoạch refactor monolith bẩn → modulith

~~~text
Bước 1: vẽ boundary trên giấy — domain nào genuinely tách được (member/txn/redeem)
Bước 2: dọn dependency theo hướng 1 chiều (ui → service → repository)
Bước 3: thêm ApplicationModules + verify() — NGUYÊN trạng, để THẤY hết vi phạm (danh sách việc)
Bước 4: triệt tiêu từng vi phạm — expose API sạch tại package gốc, internals dời vào .internal
Bước 5: chuyển call chéo sang event khi nghiệp vụ cho phép async
Bước 6: sau này cần tách service thật — module đã kín, bốc nguyên package lên service mới
~~~

Điểm kết: modulith là ĐƯỜNG đến microservices có kiểm soát — không phải điểm dừng tiến bộ. Module kín thì tách ra là chuyện bốc hàng.

:::laas Audit LAAS của bạn kết luận: modular monolith với core/identity/platform/notification module + outbox giao tiếp nội bộ — chính là mô hình Modulith mô tả (chỉ khác: tự viết thay dùng Spring Modulith). Bước nâng cấp tự nhiên: thay outbox tự quản bằng event publication registry của Modulith cho event NỘI bộ, giữ outbox full Kafka cho event ngoại lai (audit yêu cầu replay); thêm modules.verify() vào CI — mỗi PR vi phạm boundary là build đỏ thay vì qua review chót lỏi.
:::

:::takeaways
- Modular monolith: boundary package + test enforcement — deploy 1 artifact, kỷ luật nhiều service
- Modulith mặc định: chỉ package gốc module là public API — internals tự động đóng
- modules.verify() trong CI: vi phạm boundary = build đỏ — kiến trúc có cảnh sát
- @ApplicationModuleListener: event AFTER_COMMIT + registry tự resume — outbox nhẹ nội bộ
- ArchUnit bổ sung luật tổng quát: controller≠repository, không field injection, không vòng tròn
- Refactor 6 bước: vẽ boundary → dọn chiều dependency → verify nguyên trạng → triệt tiêu dần
:::
`
    },
    {
      id: "6-quiz",
      type: "quiz",
      title: "Quiz Module 6 — Microservices",
      minutes: 12,
      questions: [
        {
          level: "easy",
          scenario: "Dev LAAS post lên group: 'Cache Redis của tao không chạy! @Cacheable findById vẫn query DB mỗi lần'. Code: methodA() trong cùng service gọi this.findById().",
          q: "Vì sao cache không hiệu lực?",
          options: [
            "Redis chưa connect — kiểm tra host/port",
            "@Cacheable là AOP proxy: this.findById() bypass proxy → advice cache không chạy. Phải gọi từ bean khác hoặc tách method",
            "Key SpEL sai cú pháp",
            "Cần thêm @EnableCaching trên config riêng"
          ],
          answer: 1,
          explain: "Spring bọc bean trong proxy; cache check nằm TRONG proxy. this.xxx() đi thẳng vào bean gốc bỏ qua wrapper — giống hệt trap @Transactional/@Async. Fix: tách ra bean khác, hoặc inject self-proxy (ObjectProvider).",
          why: [
            "Nếu Redis mất kết nối sẽ ném exception khi access cache, không phải 'im lặng query DB'. Triệu chứng mô tả là cache HOẠT ĐỘNG NHƯ KHÔNG CÓ = proxy bypass.",
            "✓ Đúng — 3 annotation (@Transactional/@Cacheable/@Async) cùng cơ chế proxybean: cross-class call qua proxy (có magic), self-call trực tiếp (không magic). Đây là lỗi số 1 của người mới Spring.",
            "Key sai thì method vẫn chạy nhưng cache sai key — log Redis MONITOR sẽ thấy SET không đọc GET. Không phải 'không chạm cache'.",
            "@EnableCaching thiếu thì KHÔNG method nào có cache — ở đây chỉ method tự gọi là không. Triệu chứng hẹp hơn."
          ]
        },
        {
          level: "hard",
          scenario: "Incident LAAS 3h sáng: cache expire đúng lúc traffic cao — 500 request đồng loạt cache-miss đập DB → DB CPU 100% → toàn service timeout. Gọi là cache stampede.",
          q: "Các lớp phòng chống stampede đúng?",
          options: [
            "Tăng TTL lên vô hạn — cache không bao giờ hết hạn",
            "TTL jitter (ngẫu nhiên ±10%) tránh expire đồng loạt + sync load (chỉ 1 thread đi lấy, kẻ khác chờ) + Caffeine local cache tầng trước Redis",
            "Tăng connection pool DB để chịu được 500 query song song",
            "Tắt cache cho giờ cao điểm"
          ],
          answer: 1,
          explain: "Stampede = nhiều request cùng miss một key. 3 lớp phòng: (1) jitter TTL — key không expire cùng lúc; (2) per-key lock — 1 thread load, kẻ khác block chờ kết quả; (3) local cache (Caffeine) hấp thụ phần lớn hit không chạm Redis/DB.",
          why: [
            "TTL vô hạn = cache stale vĩnh viễn — data đổi không bao giờ tới user. Giải quyết nghẽn bằng cách tạo bug correctness. TTL luôn là bắt buộc.",
            "✓ Đúng — defense in depth: jitter phá tính đồng bộ, sync load giới hạn concurrent load = 1, Caffeine giảm round-trip. Cả 3 cộng nhau gần như triệt tiêu stampede.",
            "Tăng pool cho DB chịu 500 concurrent query là trả tiền hạ tầng cho vấn đề có giải pháp thuật toán. Và pool lớn cũng có giới hạn — scale tiếp lại gặp lại.",
            "Tắt cache giờ cao điểm = mọi request đánh DB — chính là stampede vĩnh viễn. Tệ hơn hiện trạng nhiều."
          ]
        },
        {
          level: "hard",
          scenario: "Code review LAAS: trong @Transactional method, dev save Task xong kafka.send(event). Code chạy tốt tháng trời. Reviewer vẫn đánh dấu 'dual-write — phải outbox'.",
          q: "Dual-write problem thực chất là gì?",
          options: [
            "Lỗi cú pháp — Kafka không chấp nhận gửi trong transaction",
            "DB commit và Kafka publish là 2 hệ thống không atomic: Kafka fail sau khi DB commit → event MẤT vĩnh viễn (hoặc ngược lại). Outbox: event ghi cùng transaction DB, worker publish sau",
            "Hiệu năng — gửi Kafka trong transaction làm chậm commit",
            "Kafka đảm bảo deliver rồi mới cho DB commit"
          ],
          answer: 1,
  explain: "Không có transaction 2-phase spanning DB + Kafka. 4 kịch bản race: send OK + commit OK (được), send OK + rollback (event ma — consumer thấy task không tồn tại), send fail + commit (event mất — notification/audit không bao giờ đến), send fail + rollback (được). Outbox thu hẹp về: commit → event chắc chắn có (delay), rollback → không event.",
          why: [
            "Cú pháp hợp lệ — code compile và 'chạy tốt' 99% thời gian. Đó chính là điểm nguy hiểm: bug chỉ xuất hiện khi Kafka có vấn đề, đúng lúc hệ thống đang stress.",
            "✓ Đúng — outbox biến '2 phép ghi độc lập' thành '1 phép ghi atomic (business + outbox row)' + '1 worker best-effort publish + idempotent consumer'. Guarantee: ít nhất 1 lần, không bao giờ mất.",
            "Latency kafka.send async không đáng kể trong transaction. Vấn đề là CORRECTNESS không phải performance.",
            "Kafka không biết gì về DB transaction — không có cơ chế coordinate. Ngược lại hoàn toàn với thực tế."
          ]
        },
        {
          level: "medium",
          scenario: "Consumer Kafka notification-service LAAS xử lý event rồi crash TRƯỚC khi commit offset. Pod restart, đọc lại offset cũ — event đến lần 2. Email welcome gửi 2 lần.",
          q: "Đây là property của delivery semantic nào và cách sống chung?",
          options: [
            "At-most-once — chấp nhận mất, đổi sang earliest offset",
            "At-least-once: redelivery là BÌNH THƯỜNG, consumer phải idempotent (dedup table event_id, hoặc upsert tự nhiên idempotent)",
            "Exactly-once — cấu hình transactions Kafka là xong",
            "Lỗi consumer group rebalance — tăng heartbeat interval"
          ],
          answer: 1,
          explain: "Xử lý-xong-ack (at-least-once) đánh đổi: không mất message nhưng có thể trùng. Idempotent consumer: INSERT IF NOT EXISTS processed_events(event_id) — lần 2 thấy đã xử lý, skip. Hoặc nghiệp vụ tự idempotent (upsert user, set status).",
          why: [
            "At-most-once = ack trước xử lý — đổi chiều vấn đề sang MẤT event (tệ hơn với notification/audit tài chính). Không phải hướng sửa.",
            "✓ Đúng — idempotency là con bài chủ chốt của hệ thống phân tán: mọi nơi có retry/redelivery đều cần. Dedup table là hiện thực hóa đơn giản nhất.",
            "Exactly-once Kafka transactions phạm vi hẹp (consume-transform-produce trong Kafka) — không phủ 'gửi email ra ngoài'. Với side-effect ngoài Kafka vẫn phải idempotent.",
            "Rebalance có thể trigger redelivery nhưng đây là kịch bản crash-restart đơn giản — không cần đi sâu heartbeat. Root cause là semantic, không phải tuning."
          ]
        },
        {
          level: "hard",
          scenario: "Downstream service LAAS bắt đầu chậm: p99 từ 200ms nhảy 8s. Mọi caller retry theo config mặc định (3 lần, không backoff) — service chết hẳn. Hiện tượng gọi là retry storm.",
          q: "Cách retry đúng không tự giết hệ thống?",
          options: [
            "Tăng max-attempts lên 10 — kiên trì hơn",
            "Backoff exponential + jitter, limit attempts, timeout NGẮN hơn thời gian tolerate của caller, và circuit breaker cắt sớm khi failure rate cao",
            "Tắt hết retry — một lần là đủ",
            "Chuyển caller sang reactive stack WebFlux — async không giết service"
          ],
          answer: 1,
          explain: "Service chậm → caller timeout → retry ngay lập tức thêm tải → chậm hơn → nhiều retry hơn — vòng xoáy. Backoff (1s, 2s, 4s) + jitter (ngẫu nhiên tránh đồng bộ) cho service thời gian hồi. Circuit breaker là van cắt: fail rate >50% → OPEN, không gửi thêm tải, thử lại sau wait-duration.",
          why: [
            "10 attempts không backoff = tải x10 đập service đang hấp hối — đổ thêm xăng vào lửa. Kiên trì không phải đức tính của retry.",
            "✓ Đúng — bộ 4: backoff+jitter (nhịp thở), limit (giới hạn), timeout ngắn (fail fast), circuit breaker (phòng chống tổn thương). Thiếu 1 trong 4 vẫn có khe retry storm.",
            "Không retry = mất khả năng phục hồi transient failure (network blip 500ms) — lại lăn sang đầu kia — từ quá mức sang không đủ.",
            "Reactive thay đổi mô hình thread không thay đổi tải: 3 retry vẫn 3 lần request dù non-blocking. Vấn đề retry storm là VOLUME không phải blocking."
          ]
        },
        {
          level: "medium",
          scenario: "PO hỏi: 'Tại sao hệ thống vẫn trả 200 khi user-service đang down? Không nên lỗi à?' Tech lead: đó là fallback — đúng thiết kế.",
          q: "Fallback của circuit breaker mua lại điều gì?",
          options: [
            "Che giấu lỗi — không hay, phải lộ exception cho client thấy sự thật",
            "Graceful degradation: trả cached/default data, đánh dấu 'degraded' — tính năng phụ sacrifice để core flow sống. Nhưng phải monitor + alert fallback rate",
            "Tăng độ tin cậy lên 100% — không bao giờ lỗi",
            "Giảm số lượng microservice cần vận hành"
          ],
          answer: 1,
          explain: "Trade-off nghiệp vụ có chủ đích: hiển thị tên user thiếu (cached 'Khách hàng') vẫn tốt hơn cả trang chết. NHƯNG fallback im lặng là nợ vận hành — metric count fallback + alert threshold để biết degraded kéo dài, không phải 'bình thường mới'.",
          why: [
            "Lộ exception = dịch vụ phụ kéo chết toàn trang — chính là anti-pattern resilience ra đời để chống. 'Sự thật' của 500 error làm user mất lòng tin hơn dữ liệu degraded có đánh dấu.",
            "✓ Đúng — degradation có kiểm soát: user vẫn xem task (chỉ thiếu avatar), core transaction vẫn chạy. Kèm observability: fallback là tín hiệu operability, không phải chốn nấp.",
            "100% availability là thần thoại phân tán — fallback giảm user-visible failure chứ không tăng reliability vật lý của dependency.",
            "Số service không đổi — fallback là hành vi runtime, không liên quan topology kiến trúc."
          ]
        },
        {
          level: "easy",
          scenario: "Deploy LAAS lên OKD với 5 replica. Job @Scheduled(fixedDelay=1s) dọn outbox — DBA thấy batch job chạy 5 lần song song, row bị xử lý trùng (may idempotent consumer cứu).",
          q: "Cơ chế chuẩn cho scheduled job multi-instance?",
          options: [
            "Config flag tắt job ở 4 pod, chỉ 1 pod chạy",
            "ShedLock @SchedulerLock: shared DB lock — pod nào giành lock mới chạy, pod khác skip trong lockAtMostFor window",
            "Chuyển job sang Kubernetes CronJob pod riêng",
            "Cứ để — idempotent consumer xử lý trùng rồi"
          ],
          answer: 1,
          explain: "ShedLock lock row trong DB: SELECT ... FOR UPDATE rồi UPDATE lock_time — 1 pod thắng, 4 pod thấy locked bỏ qua. lockAtMostFor là insurance: pod giữ lock chết → lock tự hết hạn sau N giây. Simple, đúng cho job định kỳ.",
          why: [
            "Flag thủ công = operational burden: scale lên 10 pod phải config lại, pod chạy job chết → không ai chạy. Violates self-healing của K8s.",
            "✓ Đúng — leader-election lightweight cho scheduled task. Không cần full Quartz cluster nếu nhu cầu chỉ là '1 instance chạy'.",
            "K8s CronJob là lựa chọn hợp lệ cho job nặng/cô lập — nhưng thêm moving part (RBAC, image, scheduling K8s riêng), over-kill cho 1 method @Scheduled có sẵn.",
            "Để trùng rồi dựa idempotent = tiêu tốn tài nguyên x5 vô ích + duplicate publish Kafka x5 (mỗi consumer downstream xử lý) — đúng kỹ thuật sai kinh tế."
          ]
        },
        {
          level: "hard",
          scenario: "Java 21 LAAS: endpoint /report blocking IO 5s. Platform thread pool 200. 200 user đồng thời → pool đầy → MỌI endpoint (kể cả /health) đứng im — chết cả service vì 1 endpoint chậm.",
          q: "Virtual threads giải quyết thế nào?",
          options: [
            "Virtual thread chạy nhanh hơn platform thread — 5s thành 500ms",
            "spring.threads.virtual.enabled=true: mỗi request 1 virtual thread — blocking call park virtual (rẻ như objects), platform thread nhả đi phục vụ request khác. 200 chờ + /health vẫn chạy",
            "Virtual thread ưu tiên cao hơn — scheduler cho chạy trước",
            "Tự động scale pod khi phát hiện endpoint chậm"
          ],
          answer: 1,
          explain: "Điểm nhảy: virtual thread blocking = park (lưu stack, nhả carrier). 10k virtual threads chờ IO không tốn 10k platform thread. Carriers nhỏ (≈ core count) phục vụ mọi virtual — /health và /report không tranh nhau pool 200 nữa.",
          why: [
            "Virtual KHÔNG nhanh hơn — CPU work vẫn tốc độ đó. Lợi ích duy nhất: scalability của BLOCKING IO (số concurrent chờ), không phải throughput của CPU-bound.",
            "✓ Đúng — 1 dòng config đổi mô hình: thread-per-request trở lại khả thi (nhưng thread giờ rẻ). Khỏi cần reactive phức tạp cho I/O-heavy đơn thuần.",
            "Không có khái niệm priority giữa virtual/platform theo cách đó — scheduler không cho virtual 'chạy trước' /health của platform.",
            "HPA scale pod là tầng hạ tầng — phản ứng chậm (phút) và không giải quyết deadlock pool cục bộ trong 1 pod. Không phải câu trả lời cho câu hỏi thread model."
          ]
        },
        {
          level: "medium",
          scenario: "BA LAAS phàn nàn: 'Sửa số dư trong admin nhưng app vẫn hiển thị số cũ 10 phút'. Dev check: update dùng @CachePut — cache được ghi mới. Vẫn stale!",
          q: "Điều tra hướng nào đúng?",
          options: [
            "Key @CachePut không khớp key @Cacheable (khác expression) — update ghi key A, read đọc key B",
            "Redis version cũ — nâng cấp lên 7.x",
            "Client mobile cache HTTP response — thêm Cache-Control no-store",
            "Transaction chưa commit — cache ghi trước khi DB có dữ liệu"
          ],
          answer: 0,
          explain: "Cùng cacheNames nhưng key khác nhau = 2 không gian key riêng: findById key='#id' (Long), update key='#result.id()' hoặc '#req.id' — expression sai lệch nhẹ (String '42' vs Long 42) ghi chỗ khác. Cache MONITOR + so key thực tế là cách chẩn đoán 5 phút.",
          why: [
            "✓ Đúng — 90% cache stale bug là key mismatch: type khác (String vs Long), expression khác (param vs result), cacheName khác (typo). Redis MONITOR cho thấy SET key khác GET key ngay.",
            "Redis version không liên quan semantic key — 5.x hay 7.x đều hash key như nhau.",
            "HTTP cache client là lớp khác — nhưng triệu chứng mô tả (10 phút) khớp TTL Redis hơn. Và nếu HTTP cache thì sửa server header, vẫn phải check trước.",
            "Transaction + @CachePut: cache ghi TRONG transaction — nếu rollback cache có dữ liệu rác (vấn đề thật khác!) — nhưng stale cũ vẫn được ghi ĐÈ bởi giá trị mới rồi. Không khớp triệu chứng."
          ]
        },
        {
          level: "medium",
          scenario: "He thong multi-tenant discriminator. @Cacheable(cacheNames=\"memberBalance\", key=\"#cif\") — khong co tenant trong key. UAT: tenant A bao diem hien thi SAI, log nghiep vu DUNG, khong co exception nao.",
          q: "Dieu gi xay ra?",
          options: [
            "Bug race condition trong cache manager — can sync=true",
            "Cross-tenant cache HIT: tenant B load key cif-001, tenant A doc lai CUNG key → nhan data cua B — cache key thieu prefix tenant",
            "Redis serialization loi — doi GenericJackson2JsonRedisSerializer",
            "DB tra sai data — kiem tra Hibernate filter"
          ],
          answer: 1,
          explain: "Day la bug ngam nguy hiem nhat cua multi-tenant: KHONG exception, chi SAI SO. Key chi co cif — 2 tenant cung co CIF-001 (cif chi unique trong pham vi tenant) → HIT nham data tenant khac. Fix: key = TenantContext.require() + ':' + #cif. Log nghiep vu dung vi query DB co tenant filter — chi cache layer leak.",
          why: [
            "sync chi chong stampede — khong lien quan pham vi key",
            "Dung — tenant PHAI nam trong cache key moi tang: Redis, Caffeine L1, HTTP cache",
            "Serializer quyet dinh ENCODE khong quyet dinh SCOPE key — sai huong",
            "Log dung = nghiep vu dung; chi hien thi sai — ngon tay tro ve cache"
          ]
        },
        {
          level: "medium",
          scenario: "Report job 5 pod, can chan 2 pod cung generate. Dev viet redis.setIfAbsent(\"lock:report:tenant-a\", \"1\") — KHONG TTL. Pod crash giua luc generate.",
          q: "Hau qua va pattern dung?",
          options: [
            "Lock tu expire khi connection Redis dong — khong van de gi",
            "Lock ket MAI MAI (Redis khong biet pod chet) — moi lan chay sau throw in-progress. Dung: setIfAbsent(token UUID, TTL) + giai phong bang Lua so token",
            "Pod moi tu gianh lock vi connection khac — can khoa pessimistic DB thay the",
            "Dung DEL lock truoc khi chay moi lan — tu don la du"
          ],
          answer: 1,
          explain: "SETNX khong TTL la lock mot chieu: process chet giua chung khong ai giai phong — Redis giu key vin vien, job chet 'am tham' mai mai. Dung: (1) TTL bat buoc — crash thi lock tu het; (2) value la token unique + giai phong bang script Lua so-roi-xoa atomic — chi xoa neu COA la token minh dat, tranh xoa nham lock nguoi vua gia han. DEL dau moi lan chay pha het muc dich lock.",
          why: [
            "Redis khong gan key voi connection cua client — key song qua moi disconnect",
            "Dung — TTL chong ket vin vien, token + Lua chong xoa nham lock nguoi khac",
            "DB lock cung giai duoc nhung nang hon — Redis pattern dung la du, khong can doi cong nghe",
            "DEL dau moi run = moi pod lan luot gianh lai lock — khong chan dong thoi nua"
          ]
        },
        {
          level: "hard",
          scenario: "AbstractRoutingDataSource theo TenantContext. Method: @Transactional truoc, ben trong co dong TenantContext.set(tenant) SAU khi transaction da mo. Kiem tra: query van ghi vao DB DEFAULT thay vi DB tenant.",
          q: "Vi sao routing khong hoat dong?",
          options: [
            "AbstractRoutingDataSource can rebuild sau khi them tenant moi",
            "Connection duoc resolve LAZY khi query dau chay — nhung transaction bind connection NGAY khi mo, truoc dong set(): determineCurrentLookupKey chay khi do, tenant con null → default DS",
            "ThreadLocal khong visible ben trong @Transactional proxy",
            "Can @Transactional(readOnly=true) de routing hoat dong"
          ],
          answer: 1,
          explain: "Thu tu la tat ca: Spring lay connection tu datasource NGAY khi transaction bat dau (de set autocommit=false, isolation) — determineCurrentLookupKey chay LUC DO. set() sau do chi doi ThreadLocal, connection da bound vao transaction theo default. Chuan: filter set tenant TRUOC khi vao bat ky bean transactional nao. Do la ly do TenantFilter chay dau chuoi — khong phai trach nhiem cua service code.",
          why: [
            "Them tenant la map config — khong lien quan hanh vi luc runtime nay",
            "Dung — lazy resolve nhung bind khi mo transaction: set muon = routing truot ve default",
            "ThreadLocal hoat dong binh thuong trong proxy — van de la THOI DIEM bind connection",
            "readOnly khong dung den routing — thuoc tinh semantic cua transaction"
          ]
        },
        {
          level: "medium",
          scenario: "Job đối soát Spring Batch chunk 500 chạy 2h sáng. Sáng ra check: status FAILED ở chunk 3902/4000, nguyên nhân connection DB reset. Dev đề xuất chạy lại từ đầu với parameter mới.",
          q: "Đánh giá và hành động đúng?",
          options: [
            "Đúng — chạy lại từ đầu sạch sẽ, tránh trạng thái nửa vời",
            "RESTART cùng JobInstance: JobRepository biết chunk 3901 đã commit — chạy lại NHẢY VÀO chunk 3902, chỉ 98 chunk còn lại. Parameter mới = instance mới = quét lại 4000 chunk",
            "Cần xóa metadata bảng BATCH_* rồi chạy lại như lần đầu",
            "Chuyển job sang @Scheduled chạy lại toàn bộ đêm sau — self-healing"
          ],
          answer: 1,
          explain: "Toàn bộ giá trị của Spring Batch nằm ở checkpoint: restart cùng JobInstance (cùng parameters) kế thừa tiến độ đã commit — 98 chunk × 500 = việc còn lại đúng 2%. Parameter mới tạo JobInstance mới chạy lại 100% và có nguy cơ duplicate dòng đã xử lý (writer phải idempotent). Đó là lý do cấu hình job nặng metadata: trả lời chính xác 'chết ở đâu, chạy tiếp từ đâu'.",
          why: [
            "Quét lại 3901 chunk đã commit — lãng phí và rủi ro duplicate",
            "✓ Restart kế thừa tiến độ — đúng thiết kế checkpoint của Batch",
            "Xóa metadata là xóa bằng chứng restart — quay về thời @Scheduled for-loop",
            "Chờ đêm sau không giải quyết job hôm nay — và đêm sau vẫn gặp lỗi tương tự"
          ]
        },
        {
          level: "hard",
          scenario: "Team tranh luận kiến trúc messaging: (A) mọi thứ Kafka vì 'outbox đang Kafka', kể cả queue gửi SMS; (B) Kafka cho event stream đối soát + RabbitMQ cho SMS/notification task queue.",
          q: "Phân tích đúng bản chất?",
          options: [
            "A đúng — 1 hệ messaging duy nhất giảm operational burden, Kafka làm được mọi việc",
            "B đúng — event cần replay (audit) là Kafka append-only; task làm-xong-bỏ (SMS) cần per-message ack + DLQ phân phối — Rabbit đúng bản chất công việc",
            "A đúng vì Kafka throughput cao hơn — hiệu năng quyết định",
            "B đúng vì RabbitMQ mốt mới hơn — luôn chọn công nghệ mới"
          ],
          answer: 1,
          explain: "Chọn theo BẢN CHẤT DỮ LIỆU không theo mốt hay throughput: event đối soát là dòng lịch sử phải replay được cho audit — append-only log sinh ra cho việc đó. SMS task là đơn vị việc: ai nhận, xử lý, xác nhận xong, bỏ — đúng mô hình queue có ack. SMS trên Kafka: không per-message ack tự nhiên, consumer group thủ công, DLQ phải tự dựng — chống lại công cụ thay vì dùng nó.",
          why: [
            "1 hệ cho 2 mô hình khác nhau — phần nào đó chống lại grain của công cụ",
            "✓ Replay vs ack-xóa là 2 bản chất — 2 công cụ đúng việc từng loại",
            "Throughput Rabbit đã thừa cho SMS queue — hiệu năng không phải trục quyết định",
            "Lý do công nghệ mới không phải luận cứ kiến trúc — bản chất bài toán mới là"
          ]
        },
        {
          level: "hard",
          scenario: "Monolith 800k dòng chạy ổn. Dev mới vào refactor vội: notification service import MemberInternalProfileValidator (class internal của module member). Build xanh, chạy đúng — review không ai để ý.",
          q: "Vì sao build XANH và cơ chế nào sẽ bắt được?",
          options: [
            "Bug framework Spring — internal package phải lỗi compile tự động",
            "Java không có khái niệm module enforcement ở mức package convention — build xanh vì hợp lệ về ngôn ngữ. modules.verify() của Spring Modulith (hoặc ArchUnit rule) trong CI sẽ ĐỎ: phụ thuộc vào non-exposed type",
            "Không sao — internal chỉ là quy ước đặt tên, ai cần thì dùng",
            "Chỉ cần @Autowired thay vì import trực tiếp là hợp lệ"
          ],
          answer: 1,
          explain: "Đây chính là lý do modular monolith cần 'pháp luật': package convention không tự thực thi — JDK module system (JPMS) có thể nhưng cồng kềnh. Spring Modulith verify() / ArchUnit phân tích bytecode dependency graph: PR này vào CI là đỏ kèm thông báo chính xác module nào vi phạm internal nào. Boundary từ quy ước miệng thành test — cùng cơ chế với verify.js của chính khóa học này.",
          why: [
            "Convention không phải enforcement — ngôn ngữ không cấm import package public",
            "✓ Static analysis trong CI: dependency graph không biết nể ai",
            "Bỏ mở internal là boundary chết — mọi module dần import lẫn nhau quay lại monolith bẩn",
            "Cách inject không đổi bản chất phụ thuộc — dependency graph vẫn thấy"
          ]
        }
      ]
    }
  ]
});
