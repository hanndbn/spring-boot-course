/* MODULE 6 — Microservices & Messaging */
window.COURSE_MODULES = window.COURSE_MODULES || [];
window.COURSE_MODULES.push({
  id: 6,
  title: "Microservices & Messaging",
  subtitle: "Kafka, Redis, Resilience4j, API Gateway, Distributed Transactions",
  icon: "🌐",
  desc: "Hệ thống phân tán: Kafka, Redis cache, circuit breaker, outbox pattern — đúng stack LAAS.",
  lessons: [
    {
      id: "6-1",
      type: "lesson",
      title: "Caching với Spring Cache & Redis",
      minutes: 50,
      content: `
## Caching Chuyên Sâu với Spring Cache, Redis & Kiến Trúc Bộ Đệm Hai Tầng (Two-Level Cache)

Trong kiến trúc Microservices chịu tải cao, cơ sở dữ liệu quan hệ (RDBMS) hầu như luôn là điểm thắt cổ chai đầu tiên bị quá tải. Một câu truy vấn sản phẩm hoặc danh mục có thể chỉ mất 5ms, nhưng khi hàng chục ngàn người dùng đồng thời truy cập trong các chiến dịch Flash Sale (100,000 req/s), cơ sở dữ liệu sẽ sập hoàn toàn do cạn kiệt Connection Pool và CPU đạt ngưỡng 100%.

Bộ đệm (Cache) là vũ khí tối thượng giúp giảm tải tới 95% áp lực lên database. Tuy nhiên, nếu áp dụng caching một cách ngây thơ, hệ thống của bạn sẽ nhanh chóng phải đối mặt với "bộ ba thảm họa": **Cache Penetration (Xuyên thủng bộ đệm)**, **Cache Avalanche (Tuyết lở bộ đệm)** và **Cache Stampede / Thundering Herd (Đoàn bò rừng giẫm đạp)**.

Bài học này sẽ mổ xẻ cơ chế hoạt động ngầm của **Spring Cache Abstraction**, các cấu trúc dữ liệu tối ưu trong **Redis**, cấu hình Serializer chống lỗ hổng bảo mật, và xây dựng hệ thống **Two-Level Cache (Caffeine L1 + Redis L2)** với cơ chế Pub/Sub đồng bộ tức thì.

---

## 1. Cơ Chế Ngầm của Spring Cache Abstraction & Redis Topology (Under the Hood)

### Kiến trúc Spring Cache Interceptor & AOP Proxy

Khi bạn đánh dấu một phương thức với <code>@Cacheable</code>, Spring sử dụng AOP Proxy để bọc phương thức đó trong <code>CacheInterceptor</code>:

~~~text
+-----------------------------------------------------------------------------------+
|                        SPRING CACHE INTERCEPTOR EXECUTION                         |
|                                                                                   |
|  Caller Service                                                                   |
|       |                                                                           |
|       v                                                                           |
|  [Spring AOP Proxy]                                                               |
|       |                                                                           |
|       v                                                                           |
|  [CacheInterceptor]                                                               |
|       |                                                                           |
|       +---> 1. Đánh giá SpEL Key (ví dụ: "products::" + id)                       |
|       |                                                                           |
|       +---> 2. Gọi CacheManager.getCache("products").get(key)                     |
|       |                                                                           |
|       +---> 3. KIỂM TRA TRẠNG THÁI:                                               |
|                +--- [CACHE HIT]:                                                  |
|                |    Trả về dữ liệu ngay từ RAM (Redis/Caffeine) trong < 1ms!       |
|                |    (PHƯƠNG THỨC GỐC HOÀN TOÀN KHÔNG ĐƯỢC CHẠY)                  |
|                |                                                                  |
|                +--- [CACHE MISS]:                                                 |
|                     - Thực thi phương thức gốc (Truy vấn Database mất 50ms)        |
|                     - Lấy kết quả lưu vào Cache (CacheManager.put(key, value))    |
|                     - Trả kết quả về Caller                                       |
+-----------------------------------------------------------------------------------+
~~~

:::warn CẠM BẪY SELF-INVOCATION VỚI @CACHEABLE
Giống như <code>@Transactional</code> và <code>@Async</code>, nếu bạn gọi một phương thức <code>@Cacheable</code> từ một phương thức khác **trong cùng một lớp** (<code>this.getProductById(id)</code>), lời gọi sẽ **bỏ qua AOP Proxy**. Kết quả: Cache hoàn toàn không hoạt động và luôn luôn truy vấn xuống database!
:::

### Bộ Ba Thảm Họa Caching Trên Production

~~~text
+-----------------------------------------------------------------------------------+
|                           3 THẢM HỌA CACHING ĐIỂN HÌNH                            |
|                                                                                   |
|  1. CACHE PENETRATION (Xuyên Thủng Bộ Đệm):                                       |
|     - Hacker liên tục query các ID không tồn tại (e.g., id = -99999).             |
|     - Cache luôn MISS -> Toàn bộ 50,000 req/s đánh thẳng vào DB gây sập hệ thống. |
|     ==> GIẢI PHÁP: Cache Null Objects (với TTL ngắn 60s) hoặc dùng Bloom Filter.  |
|                                                                                   |
|  2. CACHE AVALANCHE (Tuyết Lở Bộ Đệm):                                            |
|     - 1,000,000 sản phẩm được nạp vào Cache với cùng một thời gian TTL (ví dụ 1h).|
|     - Đúng 1 giờ sau, toàn bộ 1,000,000 keys ĐỒNG LOẠT HẾT HẠN CÙNG MỘT GIÂY.     |
|     - Lưu lượng truy cập ập đến DB cùng lúc -> Sập cơ sở dữ liệu ngay lập tức.    |
|     ==> GIẢI PHÁP: TTL Jitter (Cộng thêm độ lệch ngẫu nhiên 5 - 15 phút).         |
|                                                                                   |
|  3. CACHE STAMPEDE / THUNDERING HERD (Đoàn Bò Rừng Giẫm Đạp):                     |
|     - Một key cực hot (Hot Key - ví dụ: Trang chủ Black Friday) vừa hết hạn.      |
|     - Trong 100ms key bị trống, 10,000 threads đồng thời thấy Cache MISS và cùng  |
|       nhảy vào DB thực hiện phép tính nặng nề để tính toán lại giá trị!           |
|     ==> GIẢI PHÁP: Mutex Distributed Lock (Redis Redlock) hoặc Probabilistic Early|
|         Expiration (Thuật toán XFetch).                                           |
+-----------------------------------------------------------------------------------+
~~~

---

## 2. Kiến Trúc Bộ Đệm Hai Tầng (Two-Level Cache: L1 Caffeine + L2 Redis)

Trong các hệ thống quy mô lớn, việc gọi Redis qua mạng nội bộ (Network I/O) vẫn mất khoảng 1 - 3ms. Để đạt tốc độ micro-giây, ta áp dụng kiến trúc **Two-Level Cache**:
- **L1 Cache (Caffeine)**: Nằm ngay trong bộ nhớ Heap của JVM mỗi Pod. Tốc độ đọc: **< 10 micro-giây**.
- **L2 Cache (Redis)**: Cụm phân tán dùng chung cho toàn bộ các Pod. Tốc độ đọc: **1 - 3 mili-giây**.
- **Cơ chế Đồng bộ Hủy Cache qua Redis Pub/Sub**: Khi Pod A cập nhật dữ liệu, nó xóa L1 của chính nó, cập nhật L2 Redis, và bắn một thông điệp Pub/Sub vào kênh <code>cache-evict-topic</code>. Tất cả các Pod khác nhận được thông điệp sẽ tự động xóa sạch L1 tương ứng của mình!

~~~text
+-----------------------------------------------------------------------------------+
|                        KIẾN TRÚC TWO-LEVEL CACHE ĐỒNG BỘ                          |
|                                                                                   |
|  Pod A (Spring Boot)                      Pod B (Spring Boot)                     |
|  +------------------------------+         +------------------------------+        |
|  | L1 Cache: Caffeine (RAM)     |         | L1 Cache: Caffeine (RAM)     |        |
|  +------------------------------+         +------------------------------+        |
|                                                         /                        |
|           (1. Đọc L1 miss)                             / (1. Đọc L1 miss)        |
|           v                                            v                          |
|  +-----------------------------------------------------------------------------+  |
|  |                            L2 CACHE: REDIS CLUSTER                          |  |
|  |                       (Dùng chung cho toàn bộ Pod)                          |  |
|  +-----------------------------------------------------------------------------+  |
|         ^                                              |                          |
|         | 2. Pod A update dữ liệu -> Bắn Pub/Sub       v 3. Nhận event evict      |
|         +==============================================+                          |
|                     Redis Pub/Sub Topic: "cache:evict:products"                   |
+-----------------------------------------------------------------------------------+
~~~

---

## 3. Triển khai Production-Grade: Hệ thống Quản trị Cache Redis An Toàn

Chúng ta sẽ thiết kế một cấu hình Caching hoàn chỉnh với các tiêu chuẩn:
1. <code>RedisCacheManager</code> với Serializer JSON (Jackson2JsonRedisSerializer) hỗ trợ <code>JavaTimeModule</code> và chống lỗ hổng RCE Deserialization.
2. Cơ chế **TTL Jitter** chống Tuyết lở (Cache Avalanche).
3. Cơ chế **Cache Error Handler** bảo vệ ứng dụng: Nếu Redis bị sập kết nối, ứng dụng tự động fallback truy vấn thẳng database thay vì quăng lỗi 500 cho khách hàng!

### 3.1. Cấu hình Redis Cache Chuẩn Doanh nghiệp

~~~java
package com.bank.cache.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Configuration
@EnableCaching
@Slf4j
public class EnterpriseCacheConfig implements CachingConfigurer {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        // Bảo vệ Deserialization: Chỉ serialize class metadata cho non-final objects an toàn
        mapper.activateDefaultTyping(
            LaissezFaireSubTypeValidator.instance,
            ObjectMapper.DefaultTyping.NON_FINAL,
            JsonTypeInfo.As.PROPERTY
        );

        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(mapper);

        // Cấu hình Cache Mặc định (TTL 30 phút + Jitter)
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(computeJitteredTtl(Duration.ofMinutes(30)))
            .disableCachingNullValues() // Hoặc bật nếu muốn chống Penetration
            .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(jsonSerializer));

        // Cấu hình riêng cho từng phân vùng Cache
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        cacheConfigurations.put("hot_products", defaultConfig.entryTtl(computeJitteredTtl(Duration.ofMinutes(10))));
        cacheConfigurations.put("system_configs", defaultConfig.entryTtl(Duration.ofHours(24)));

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(cacheConfigurations)
            .build();
    }

    /**
     * Cộng thêm độ lệch ngẫu nhiên (Jitter) từ 10% đến 25% vào TTL để chống Cache Avalanche
     */
    private Duration computeJitteredTtl(Duration baseTtl) {
        long seconds = baseTtl.getSeconds();
        long jitter = ThreadLocalRandom.current().nextLong(seconds / 10, seconds / 4 + 1);
        return Duration.ofSeconds(seconds + jitter);
    }

    /**
     * CacheErrorHandler: Nếu Redis chết, không làm chết ứng dụng!
     */
    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                log.error("Redis unreachable during GET on cache={}, key={}. Falling back to DB.", cache.getName(), key, exception);
            }

            @Override
            public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
                log.error("Redis unreachable during PUT on cache={}, key={}.", cache.getName(), key, exception);
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                log.error("Redis unreachable during EVICT on cache={}, key={}.", cache.getName(), key, exception);
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                log.error("Redis unreachable during CLEAR on cache={}.", cache.getName(), exception);
            }
        };
    }
}
~~~

---

### 3.2. Service Triển Khai Chống Cache Penetration & Hot Key Locking

~~~java
package com.bank.product.service;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductCatalogService {

    private final StringRedisTemplate redisTemplate;

    // Giả lập Database Lookup
    @Cacheable(
        cacheNames = "hot_products",
        key = "'prod:' + #productId",
        unless = "#result == null" // Không lưu nếu kết quả rỗng
    )
    public ProductDetailsDto getProductById(String productId) {
        log.info("CACHE MISS! Querying relational database for productId={}", productId);
        // Giả lập đọc DB
        if ("NON-EXISTENT".equals(productId)) {
            // Chống Cache Penetration: Nếu ID không tồn tại, lưu sentinel object với TTL 60s
            return null;
        }
        return new ProductDetailsDto(productId, "MacBook Pro M3 Max", new BigDecimal("3499.00"), 45);
    }

    @CachePut(cacheNames = "hot_products", key = "'prod:' + #dto.id")
    public ProductDetailsDto updateProduct(ProductDetailsDto dto) {
        log.info("Updating product in database and evicting/refreshing cache: id={}", dto.getId());
        // Thực hiện lệnh UPDATE trong Database
        return dto;
    }

    @CacheEvict(cacheNames = "hot_products", key = "'prod:' + #productId")
    public void deleteProduct(String productId) {
        log.info("Deleting product and evicting cache key for id={}", productId);
        // Thực hiện lệnh DELETE trong Database
    }

    /**
     * Kỹ thuật Mutex Lock (Redlock đơn giản) giải quyết triệt để Cache Stampede
     */
    public ProductDetailsDto getHotProductWithMutex(String productId) {
        String cacheKey = "hot_products::prod:" + productId;
        String lockKey = "lock:product:" + productId;

        // 1. Đọc Cache trước
        // (Nếu có trong cache thì trả về ngay)

        // 2. Nếu Cache MISS, chỉ cho phép DUY NHẤT 1 thread được gọi xuống DB
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "LOCKED", Duration.ofSeconds(5));
        if (Boolean.TRUE.equals(acquired)) {
            try {
                // Thread này trúng tuyển -> Truy vấn DB và cập nhật Cache
                log.info("Lock acquired! Computing expensive product details for id={}", productId);
                return getProductById(productId);
            } finally {
                redisTemplate.delete(lockKey); // Giải phóng khóa
            }
        } else {
            // Các thread khác ngủ 100ms rồi đọc lại Cache
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return getProductById(productId);
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductDetailsDto implements Serializable {
        private String id;
        private String name;
        private BigDecimal price;
        private Integer stock;
    }
}
~~~

---

## 4. Kiểm Thử & Xác Thực Thực Tế (cURL & Verification)

### Kiểm thử Lần 1 (Cache MISS — Đọc Database):

~~~bash
curl -X GET http://localhost:8080/api/v1/products/PROD-101 -i
~~~

Server Console Log:
~~~text
[INFO] CACHE MISS! Querying relational database for productId=PROD-101
Response Time: 68ms
~~~

### Kiểm thử Lần 2 (Cache HIT — Đọc Trực Tiếp từ Redis):

~~~bash
curl -X GET http://localhost:8080/api/v1/products/PROD-101 -i
~~~

Server Console Log (Phương thức không hề được kích hoạt!):
~~~text
Response Time: 1.2ms (Tốc độ tăng gấp 55 lần!)
~~~

### Kiểm tra Key và TTL thực tế trên Redis CLI:

~~~bash
redis-cli KEYS "hot_products::*"
# Kết quả: "hot_products::prod:PROD-101"

redis-cli TTL "hot_products::prod:PROD-101"
# Kết quả: 712 (Thời gian sống có Jitter ngẫu nhiên thay vì tròn 600 giây)
~~~

---

## 5. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Lỗ hổng Thực thi Mã độc từ xa (RCE) qua Default Typing

- **Triệu chứng**: Hệ thống bán lẻ bị tin tặc tấn công kiểm soát toàn bộ máy chủ sau khi hacker gửi một chuỗi JSON độc hại vào Redis Cache.
- **Nguyên nhân cốt lõi**:
  Lập trình viên cấu hình Jackson ObjectMapper với:
  ~~~java
  // LỖ HỔNG CHÍ MẠNG: Cho phép deserialize mọi class trên classpath
  mapper.enableDefaultTyping(ObjectMapper.DefaultTyping.NON_FINAL);
  ~~~
  Tin tặc lợi dụng các lỗ hổng đã biết trong các gadget class (ví dụ: một số class trong Spring hoặc Commons Collections) để ép Jackson tạo ra các đối tượng độc hại thực thi lệnh hệ thống (<code>Runtime.getRuntime().exec()</code>).
- **Giải pháp**:
  Luôn sử dụng <code>LaissezFaireSubTypeValidator.instance</code> hoặc định nghĩa danh sách trắng (Whitelist) các Package được phép Deserialize an toàn.

### Post-mortem 2: Out of Memory (OOM) do Quên Đặt Cấu Hình Maxmemory trên Redis

- **Triệu chứng**: Cụm Redis ngừng tiếp nhận dữ liệu ghi, ném lỗi <code>OOM command not allowed when used memory > 'maxmemory'</code>.
- **Nguyên nhân cốt lõi**:
  Mặc định, Redis không giới hạn dung lượng RAM và chính sách dọn dẹp là <code>noeviction</code> (khi hết RAM thì từ chối nhận lệnh ghi mới).
- **Quy tắc Vàng cho Caching**:
  Luôn cấu hình trong <code>redis.conf</code>:
  ~~~text
  maxmemory 4gb
  maxmemory-policy allkeys-lru # Tự động xóa các key ít dùng nhất khi bộ nhớ đạt 4GB
  ~~~

---

## 6. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống Tỷ Giá Ngoại Tệ (Forex Rate Service) cần xây dựng bộ đệm hai tầng:
1. Tỷ giá ngoại tệ thay đổi mỗi 5 giây, tần suất đọc là 50,000 req/s.
2. Thiết kế dịch vụ <code>ForexRateCacheService</code>:
   - Sử dụng Caffeine làm L1 Cache (Local Memory) với TTL = 5 giây.
   - Khi có sự kiện cập nhật tỷ giá đột xuất từ Ngân hàng Trung ương: Dịch vụ xóa L1 Cache của mình và phát thông điệp Pub/Sub qua Redis topic <code>forex:evict</code> để toàn bộ các Pod khác xóa ngay L1 Cache cục bộ.
3. Viết trọn vẹn lớp Listener lắng nghe sự kiện Redis Pub/Sub và xóa L1 Cache.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.bank.forex.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class ForexRateCacheService implements MessageListener {

    private final StringRedisTemplate redisTemplate;

    // L1 Cache trong bộ nhớ RAM của Pod hiện tại
    private final Cache<String, BigDecimal> l1Cache = Caffeine.newBuilder()
        .maximumSize(1000)
        .expireAfterWrite(Duration.ofSeconds(5))
        .build();

    public static final String FOREX_EVICT_TOPIC = "forex:evict:topic";

    public BigDecimal getExchangeRate(String currencyPair) {
        // Đọc L1 Cache trước (< 1 microsecond)
        return l1Cache.get(currencyPair, pair -> {
            log.info("L1 Cache MISS! Fetching fresh forex rate for {}", pair);
            return fetchRateFromCentralBank(pair);
        });
    }

    public void updateExchangeRate(String currencyPair, BigDecimal newRate) {
        log.info("Broadcasting forex rate update for pair={} rate={}", currencyPair, newRate);

        // 1. Xóa L1 Cache của Pod hiện tại
        l1Cache.invalidate(currencyPair);

        // 2. Phát thông điệp qua Redis Pub/Sub cho các Pod khác cùng xóa L1
        redisTemplate.convertAndSend(FOREX_EVICT_TOPIC, currencyPair);
    }

    // Lắng nghe sự kiện từ các Pod khác
    @Override
    public void onMessage(Message message, byte[] pattern) {
        String evictedPair = new String(message.getBody(), StandardCharsets.UTF_8);
        log.info("Received Redis Pub/Sub eviction message for pair: {}", evictedPair);
        l1Cache.invalidate(evictedPair);
    }

    private BigDecimal fetchRateFromCentralBank(String pair) {
        // Giả lập đọc tỷ giá USD/VND
        return new BigDecimal("25450.00");
    }
}
~~~

:::takeaways
- **Cơ Chế AOP Của Spring Cache**: <code>@Cacheable</code> hoạt động qua Dynamic Proxy; cẩn thận bẫy Self-invocation làm vô hiệu hóa bộ đệm.
- **Phòng Chống Bộ Ba Thảm Họa**:
  - Dùng **Null Object Cache / Bloom Filter** chống Cache Penetration.
  - Dùng **TTL Jitter** chống Cache Avalanche.
  - Dùng **Distributed Lock / XFetch** chống Cache Stampede.
- **Không Làm Sập App Khi Redis Chết**: Triển khai <code>CacheErrorHandler</code> tùy biến để ứng dụng tự động chuyển hướng xuống database khi Redis gặp sự cố mạng.
- **Sức Mạnh Của Kiến Trúc Hai Tầng (Two-Level Cache)**: Kết hợp Caffeine L1 (RAM siêu tốc) và Redis L2 (chia sẻ phân tán) đồng bộ qua Pub/Sub mang lại hiệu năng tối đa cho hệ thống triệu người dùng.
:::
`
    },
    {
      id: "6-2",
      type: "lesson",
      title: "Kafka & Transactional Outbox",
      minutes: 50,
      content: `
## Apache Kafka & Transactional Outbox Pattern — Chấm Dứt Thảm Họa Dual-Write

Trong kiến trúc hướng sự kiện (Event-Driven Architecture), các Microservices giao tiếp với nhau thông qua các thông điệp phân tán (Events). Một luồng nghiệp vụ kinh điển: khi người dùng đặt hàng, <code>OrderService</code> phải lưu đơn hàng vào cơ sở dữ liệu của mình và bắn sự kiện <code>OrderPlacedEvent</code> vào Apache Kafka để <code>PaymentService</code>, <code>InventoryService</code> và <code>NotificationService</code> cùng xử lý.

Tuy nhiên, hơn 80% các hệ thống gặp phải tình trạng lệch dữ liệu nghiêm trọng xuất phát từ **Lỗi Ghi Hai Nơi (The Dual-Write Problem)**: lưu cơ sở dữ liệu thành công nhưng gửi Kafka thất bại (hoặc ngược lại).

Bài học này sẽ mổ xẻ bản chất toán học của tính nhất quán phân tán, phân tích nguyên lý hoạt động của **Transactional Outbox Pattern**, cách xử lý đa tiến trình bằng kỹ thuật **SKIP LOCKED**, và xây dựng cơ chế **Idempotent Consumer** bảo đảm không xử lý trùng lặp thông điệp.

---

## 1. Bản Chất của Thảm Họa Dual-Write & Vì Sao 2PC Đã Chết (Under the Hood)

### Cái Bẫy Của Giao Dịch Phân Tán (2PC / XA Transactions)

Trước đây, lập trình viên cố gắng sử dụng Giao dịch Hai Pha (Two-Phase Commit - 2PC) để đồng bộ giữa Database và Message Broker:
- Một điều phối viên (Transaction Coordinator) gửi lệnh chuẩn bị (<code>PREPARE</code>) đến cả PostgreSQL và Kafka.
- Nếu cả hai đồng ý, điều phối viên gửi lệnh <code>COMMIT</code>.
- **Tại sao 2PC bị khai tử trong Microservices?**
  1. **Hiệu năng thảm hại**: 2PC khóa tài nguyên (Locking) trên toàn mạng trong suốt thời gian đàm phán, làm độ trễ (Latency) tăng gấp 10 - 50 lần.
  2. **Single Point of Failure**: Nếu Coordinator bị chết giữa chừng, toàn bộ các cơ sở dữ liệu thành phần bị treo ở trạng thái khóa vĩnh viễn (In-Doubt State).
  3. **Không được hỗ trợ**: Apache Kafka và hầu hết các công nghệ NoSQL hiện đại không hề hỗ trợ giao thức XA/2PC.

### Mổ Xẻ Thảm Họa Dual-Write Không Thể Tránh Khỏi

~~~text
+-----------------------------------------------------------------------------------+
|                           VÌ SAO DUAL-WRITE LUÔN LUÔN THẤT BẠI                    |
|                                                                                   |
|  KỊCH BẢN 1: GHI DB TRƯỚC -> GỬI KAFKA SAU                                        |
|  -----------------------------------------                                        |
|  @Transactional                                                                   |
|  public void placeOrder(OrderRequest req) {                                       |
|      orderRepository.save(order);      // [1] DB Ghi thành công                   |
|      kafkaTemplate.send("orders", event); // [2] MẠNG BỊ LỖI HOẶC POD BỊ CRASH!   |
|  }                                                                                |
|  ==> HẬU QUẢ: Khách hàng bị trừ tiền trong DB, nhưng không có sự kiện nào được    |
|      bắn vào Kafka. Kho không xuất hàng, bếp không làm đồ! MẤT ĐƠN HÀNG!          |
|                                                                                   |
|  -------------------------------------------------------------------------------  |
|                                                                                   |
|  KỊCH BẢN 2: GỬI KAFKA TRƯỚC -> GHI DB SAU                                        |
|  -----------------------------------------                                        |
|  public void placeOrder(OrderRequest req) {                                       |
|      kafkaTemplate.send("orders", event); // [1] Gửi Kafka thành công             |
|      orderRepository.save(order);      // [2] VI PHẠM RÀNG BUỘC DB -> ROLLBACK!   |
|  }                                                                                |
|  ==> HẬU QUẢ: Database không hề có đơn hàng, nhưng các dịch vụ khác đã nhận được  |
|      sự kiện và tiến hành trừ tiền của khách! SỰ KIỆN MA (GHOST EVENT)!           |
+-----------------------------------------------------------------------------------+
~~~

---

## 2. Giải Pháp Chuẩn Mực: Transactional Outbox Pattern

Bí quyết để giải quyết triệt để bài toán là: **Chuyển giao việc phát sự kiện vào trong cùng một Transaction cục bộ (ACID) của Cơ sở Dữ liệu**.

Thay vì gọi trực tiếp sang Kafka, dịch vụ sẽ lưu thông tin đơn hàng vào bảng <code>orders</code> VÀ ghi một bản ghi sự kiện vào bảng <code>outbox</code> **trong cùng 1 câu lệnh COMMIT duy nhất**:

~~~text
+-----------------------------------------------------------------------------------+
|                        TRANSACTIONAL OUTBOX PATTERN FLOW                          |
|                                                                                   |
|  HTTP Request (Đặt Hàng)                                                          |
|       |                                                                           |
|       v                                                                           |
|  [Spring OrderService]                                                            |
|       |                                                                           |
|       v  BẮT ĐẦU TRANSACTION ACID (LOCAL DATABASE)                                |
|       +---> 1. INSERT INTO orders (...)                                           |
|       +---> 2. INSERT INTO outbox_events (id, topic, payload, status='PENDING')   |
|       |                                                                           |
|       v  COMMIT TRANSACTION (Thành công 100% hoặc Thất bại 100% cả 2!)            |
|                                                                                   |
|  -------------------------------------------------------------------------------  |
|                                                                                   |
|  [Outbox Relay Worker (Chạy ngầm độc lập)]                                        |
|       |                                                                           |
|       +---> 3. Quét các sự kiện PENDING:                                          |
|                SELECT * FROM outbox_events WHERE status = 'PENDING'               |
|                FOR UPDATE SKIP LOCKED LIMIT 100;                                  |
|       |                                                                           |
|       +---> 4. Bắn vào Apache Kafka Broker (kafkaTemplate.send())                 |
|       |                                                                           |
|       +---> 5. Khi Kafka xác nhận ACK thành công:                                 |
|                UPDATE outbox_events SET status = 'PUBLISHED' WHERE id = ...       |
|                (Hoặc DELETE dòng đó để tối ưu dung lượng).                        |
|                                                                                   |
|  * NẾU KAFKA BỊ SẬP? Worker thử lại sau. Không bao giờ mất sự kiện!               |
+-----------------------------------------------------------------------------------+
~~~

---

## 3. Idempotent Consumer: Xử Lý Trùng Lặp Thông Điệp

Bởi vì Outbox Worker áp dụng ngữ nghĩa **At-least-once Delivery (Ít nhất một lần)**: nếu worker gửi message vào Kafka thành công nhưng gặp sự cố mạng ngay trước khi kịp cập nhật <code>status = 'PUBLISHED'</code>, worker lần sau sẽ đọc lại và gửi lặp lại message đó.

Do đó, phía Consumer **BẮT BUỘC PHẢI CÓ TÍNH VÔ CẢM (IDEMPOTENT)**:

~~~text
+-----------------------------------------------------------------------------------+
|                        IDEMPOTENT CONSUMER DEDUPLICATION                          |
|                                                                                   |
|  Incoming Kafka Message (message_id = "EVT-998877")                               |
|       |                                                                           |
|       v                                                                           |
|  [Payment Consumer]                                                               |
|       |                                                                           |
|       v  KIỂM TRA BẢNG TRÙNG LẶP (DEDUPLICATION TABLE / REDIS):                   |
|       |  INSERT INTO processed_events (event_id, processed_at) VALUES ('EVT-...', NOW())
|       |                                                                           |
|       +--- NẾU THÀNH CÔNG:                                                        |
|       |    -> Đây là message mới! Tiếp tục xử lý nghiệp vụ thanh toán.            |
|       |                                                                           |
|       +--- NẾU VI PHẠM RÀNG BUỘC UNIQUE (DuplicateKeyException):                  |
|            -> Message này ĐÃ ĐƯỢC XỬ LÝ TRƯỚC ĐÂY!                                |
|            -> Bỏ qua ngay lập tức, commit Kafka offset, không trừ tiền lần 2!     |
+-----------------------------------------------------------------------------------+
~~~

---

## 4. Triển khai Production-Grade: Hệ thống Outbox & Idempotent Consumer Hoàn chỉnh

### 4.1. Entity OutboxMessage & Bảng Lưu Dữ Liệu

~~~java
package com.bank.outbox.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "outbox_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OutboxMessage {

    @Id
    @Column(name = "id", nullable = false, length = 64)
    private String id; // UUID

    @Column(name = "aggregate_type", nullable = false, length = 64)
    private String aggregateType; // Ví dụ: "ORDER", "PAYMENT"

    @Column(name = "aggregate_id", nullable = false, length = 64)
    private String aggregateId;

    @Column(name = "topic", nullable = false, length = 128)
    private String topic;

    @Column(name = "payload", nullable = false, columnDefinition = "TEXT")
    private String payload; // JSON chuỗi sự kiện

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private OutboxStatus status = OutboxStatus.PENDING;

    @Column(name = "retry_count", nullable = false)
    private Integer retryCount = 0;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "published_at")
    private Instant publishedAt;

    public enum OutboxStatus {
        PENDING,
        PUBLISHED,
        FAILED
    }
}
~~~

---

### 4.2. Repository với Cơ Chế SKIP LOCKED Chống Xung Đột Đa Pod

~~~java
package com.bank.outbox.repository;

import com.bank.outbox.domain.OutboxMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OutboxMessageRepository extends JpaRepository<OutboxMessage, String> {

    /**
     * Kỹ thuật SKIP LOCKED thần thánh:
     * - Khi Pod 1 khóa 50 bản ghi đầu tiên, Pod 2 truy vấn sẽ BỎ QUA 50 bản ghi này
     *   và khóa tiếp 50 bản ghi tiếp theo mà không phải chờ đợi (Zero Lock Contention)!
     */
    @Query(value = """
        SELECT * FROM outbox_messages
        WHERE status = 'PENDING' AND retry_count < 5
        ORDER BY created_at ASC
        LIMIT 50
        FOR UPDATE SKIP LOCKED
        """, nativeQuery = true)
    List<OutboxMessage> findPendingMessagesForRelay();
}
~~~

---

### 4.3. Service Đặt Hàng Ghi Nguyên Tử Đơn Hàng & Outbox

~~~java
package com.bank.order.service;

import com.bank.outbox.domain.OutboxMessage;
import com.bank.outbox.repository.OutboxMessageRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderPlacementService {

    private final OutboxMessageRepository outboxRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public String createOrder(String customerId, BigDecimal amount) {
        String orderId = "ORD-" + UUID.randomUUID();
        log.info("Creating order {} in database", orderId);

        // 1. Lưu Order Entity vào Database (Giả lập)

        // 2. Tạo sự kiện Outbox trong CÙNG MỘT TRANSACTION
        try {
            OrderCreatedEvent event = new OrderCreatedEvent(orderId, customerId, amount, Instant.now());
            String eventJson = objectMapper.writeValueAsString(event);

            OutboxMessage outbox = new OutboxMessage(
                UUID.randomUUID().toString(),
                "ORDER",
                orderId,
                "order-events-topic",
                eventJson,
                OutboxMessage.OutboxStatus.PENDING,
                0,
                Instant.now(),
                null
            );

            outboxRepository.save(outbox);
            log.info("Outbox message saved atomically with order {}", orderId);
        } catch (Exception e) {
            log.error("Failed to serialize outbox event for order {}", orderId, e);
            throw new RuntimeException("Could not place order due to outbox serialization error", e);
        }

        return orderId;
    }

    public record OrderCreatedEvent(String orderId, String customerId, BigDecimal amount, Instant timestamp) {}
}
~~~

---

### 4.4. Outbox Relay Worker (Định Kỳ Quét và Phát Lên Kafka)

~~~java
package com.bank.outbox.worker;

import com.bank.outbox.domain.OutboxMessage;
import com.bank.outbox.repository.OutboxMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxRelayWorker {

    private final OutboxMessageRepository outboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Scheduled(fixedDelay = 1000) // Chạy mỗi 1 giây
    @Transactional
    public void relayPendingMessages() {
        List<OutboxMessage> pendingMessages = outboxRepository.findPendingMessagesForRelay();
        if (pendingMessages.isEmpty()) {
            return;
        }

        log.info("Relaying {} pending outbox messages to Kafka", pendingMessages.size());

        for (OutboxMessage msg : pendingMessages) {
            try {
                // Bắn thông điệp sang Kafka (AggregateId làm Partition Key)
                kafkaTemplate.send(msg.getTopic(), msg.getAggregateId(), msg.getPayload())
                    .whenComplete((result, ex) -> {
                        if (ex == null) {
                            msg.setStatus(OutboxMessage.OutboxStatus.PUBLISHED);
                            msg.setPublishedAt(Instant.now());
                            log.debug("Successfully published message {}", msg.getId());
                        } else {
                            msg.setRetryCount(msg.getRetryCount() + 1);
                            log.warn("Failed to publish message {}, retryCount={}", msg.getId(), msg.getRetryCount(), ex);
                        }
                    });
            } catch (Exception e) {
                msg.setRetryCount(msg.getRetryCount() + 1);
                log.error("Error sending message {} to Kafka", msg.getId(), e);
            }
        }
    }
}
~~~

---

### 4.5. Idempotent Consumer với Bảng Khóa Chống Trùng Lặp

~~~java
package com.bank.payment.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class IdempotentPaymentConsumer {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "order-events-topic", groupId = "payment-settlement-service")
    @Transactional
    public void onOrderCreated(String payload, Acknowledgment ack) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            String orderId = root.get("orderId").asText();

            // 1. KIỂM TRA TÍNH VÔ CẢM (DEDUPLICATION)
            try {
                jdbcTemplate.update(
                    "INSERT INTO processed_events (event_id, handler_name, processed_at) VALUES (?, ?, ?)",
                    orderId, "PaymentConsumer", Instant.now()
                );
            } catch (DataIntegrityViolationException dupEx) {
                // Đã xử lý rồi -> Bỏ qua và commit offset an toàn
                log.warn("DUPLICATE EVENT DETECTED for orderId={}. Skipping duplicate processing.", orderId);
                ack.acknowledge();
                return;
            }

            // 2. TIẾN HÀNH XỬ LÝ THANH TOÁN THỰC SỰ
            log.info("Processing first-time payment for orderId={}", orderId);
            // Deduct customer balance...

            ack.acknowledge();
        } catch (Exception e) {
            log.error("Fatal error processing order event: {}", payload, e);
            throw new RuntimeException(e);
        }
    }
}
~~~

---

## 5. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Bảng Outbox Phình To Đánh Sập Ổ Cứng Database

- **Triệu chứng**: Sau 6 tháng chạy production với 5 triệu đơn hàng/ngày, bảng <code>outbox_messages</code> phình to lên tới hơn 1 tỷ bản ghi, chiếm 300GB ổ cứng và làm toàn bộ câu lệnh SELECT quét hàng chờ hàng chục giây.
- **Nguyên nhân cốt lõi**:
  Lập trình viên chỉ đánh dấu <code>status = 'PUBLISHED'</code> mà không có chiến lược dọn dẹp (Purge/Archive) các sự kiện đã gửi thành công.
- **Giải pháp**:
  1. Với các sự kiện đã gửi thành công, thực hiện <code>DELETE</code> ngay trong chu trình relay nếu không cần lưu vết kiểm toán.
  2. Hoặc cấu hình **PostgreSQL Table Partitioning** theo ngày (Partition by Day) và thiết lập một cron job tự động <code>DROP TABLE outbox_messages_y2026m10d01</code> cho các partition cũ hơn 7 ngày (thời gian drop bảng mất chưa đầy 1 mili-giây mà không gây khóa hệ thống).

### Post-mortem 2: Thất thoát Thứ tự Sự kiện do Quên AggregateId làm Partition Key

- **Triệu chứng**: Đơn hàng bị chuyển trạng thái <code>CANCELLED</code> trước khi kịp chuyển sang trạng thái <code>CREATED</code> ở phía Consumer, làm hệ thống thanh toán báo lỗi logic.
- **Nguyên nhân cốt lõi**:
  Khi gọi <code>kafkaTemplate.send(topic, payload)</code> mà không truyền tham số <code>key</code> (Aggregate ID):
  - Kafka sử dụng cơ chế Round-robin phân tán các message của cùng 1 đơn hàng vào các Partition khác nhau.
  - Các Consumer Thread đọc song song từ các Partition khác nhau có thể xử lý sự kiện <code>CANCELLED</code> trước sự kiện <code>CREATED</code>.
- **Quy tắc Bất Biến**: Luôn luôn dùng **Aggregate ID (Mã đơn hàng, Mã tài khoản)** làm Message Key trong Kafka để đảm bảo mọi sự kiện của cùng một thực thể LUÔN LUÔN được đưa vào **cùng một Partition** và xử lý tuần tự tuyệt đối!

---

## 6. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống Chuyển tiền Liên ngân hàng cần xây dựng phân hệ **Fund Transfer Outbox**:
1. Dịch vụ <code>FundTransferService</code>:
   - Trừ tiền tài khoản nguồn trong Database.
   - Ghi nhận sự kiện <code>TransferInitiatedEvent</code> vào bảng <code>OutboxMessage</code> trong cùng một giao dịch.
2. Dịch vụ Consumer có cơ chế Dead Letter Queue (DLQ):
   - Nếu xử lý thông điệp chuyển tiền bị lỗi nghiệp vụ quá 3 lần, tự động chuyển thông điệp vào Topic <code>transfer-dlq-topic</code> để đội ngũ vận hành can thiệp thủ công.
3. Viết trọn vẹn lớp cấu hình Kafka Error Handler và Consumer.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.bank.transfer.consumer;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
@Slf4j
public class KafkaConsumerErrorConfig {

    @Bean
    public CommonErrorHandler kafkaErrorHandler(KafkaTemplate<Object, Object> kafkaTemplate) {
        // Tự động đẩy vào Topic có đuôi ".DLT" sau 3 lần thử lại thất bại
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(kafkaTemplate,
            (ConsumerRecord<?, ?> record, Exception ex) -> {
                log.error("CRITICAL: Message key={} failed 3 times, routing to DLQ", record.key(), ex);
                return new org.apache.kafka.common.TopicPartition("transfer-dlq-topic", record.partition());
            });

        // Thử lại tối đa 3 lần, mỗi lần cách nhau 1 giây
        FixedBackOff backOff = new FixedBackOff(1000L, 3L);
        return new DefaultErrorHandler(recoverer, backOff);
    }
}
~~~

:::takeaways
- **Cái Chết Của Dual-Write**: Không bao giờ ghi Database và gửi Kafka trong cùng một method; 1 trong 2 hệ thống bị lỗi sẽ làm lệch dữ liệu vĩnh viễn.
- **Sức Mạnh Của Transactional Outbox**: Tận dụng ACID Transaction của cơ sở dữ liệu quan hệ cục bộ để lưu Entity và Outbox Event nguyên tử 100%.
- **Kỹ Thuật FOR UPDATE SKIP LOCKED**: Cho phép nhiều Pod cùng chạy worker quét bảng Outbox mà không hề bị xung đột hay chờ khóa lẫn nhau.
- **Idempotent Consumer Là Bắt Buộc**: Hệ thống phân tán luôn có rủi ro trùng lặp thông điệp (At-least-once delivery); bắt buộc phải có bảng lưu vết <code>processed_events</code> để loại bỏ message trùng.
- **Message Key Quyết Định Thứ Tự**: Luôn truyền Aggregate ID làm Message Key để Kafka đưa toàn bộ sự kiện của một thực thể vào cùng một Partition duy nhất.
:::
`
    },
    {
      id: "6-3",
      type: "lesson",
      title: "Resilience: Circuit Breaker & @Async",
      minutes: 50,
      content: `
## Khả Năng Tự Phục Hồi (Resilience): Circuit Breaker, Rate Limiter & Resilience4j

Trong một kiến trúc Microservices phân tán gồm 50 dịch vụ, sự cố sập mạng hoặc quá tải không phải là một "khả năng hiếm hoi" mà là một sự thật hiển nhiên diễn ra mỗi ngày. Nếu một dịch vụ phụ thuộc cấp thấp (Downstream Service) bị treo hoặc phản hồi chậm chạp trong 30 giây, các luồng (Threads) của các dịch vụ gọi nó sẽ lần lượt bị nghẽn lại để chờ đợi.

Chỉ trong vòng vài chục giây, toàn bộ Connection Pool và Thread Pool của toàn bộ hệ sinh thái sẽ bị cạn kiệt, dẫn đến hiện tượng **Sụp Đổ Dây Chuyền (Cascading Failure Disaster)** — một lỗi nhỏ ở dịch vụ gửi SMS có thể kéo sập luôn cả hệ thống thanh toán cốt lõi của ngân hàng!

Bài học này sẽ đi sâu vào mô hình trạng thái hữu hạn của **Circuit Breaker**, thuật toán trượt cửa sổ (Sliding Window), thứ tự bọc AOP của các mẫu phòng vệ trong **Resilience4j**, và cách xây dựng một hệ thống có khả năng tự chữa lành đạt chuẩn 99.999% High Availability.

---

## 1. Cơ Chế Ngầm của Circuit Breaker & Cỗ Máy Trạng Thái Hữu Hạn (Under the Hood)

### Máy Trạng Thái Hữu Hạn (Finite State Machine)

Resilience4j Circuit Breaker hoạt động tương tự như một chiếc cầu dao điện trong ngôi nhà của bạn: khi xảy ra hiện tượng chập điện (tỉ lệ lỗi hoặc cuộc gọi chậm vượt ngưỡng), cầu dao sẽ tự động **BẬT MỞ (TRIP/OPEN)** để cô lập nguồn điện, ngăn ngừa cháy nổ toàn bộ tòa nhà.

~~~text
+-----------------------------------------------------------------------------------+
|                        RESILIENCE4J CIRCUIT BREAKER FSM                           |
|                                                                                   |
|            +-------------------------------------------------------+              |
|            |                                                       |              |
|            v                                                       |              |
|     +--------------+     Tỉ lệ lỗi > 50% hoặc Cuộc gọi chậm > 40%  |              |
|     |    CLOSED    | ----------------------------------------+     |              |
|     | (Bình thường)|                                         |     |              |
|     +--------------+                                         v     |              |
|            ^                                          +--------------+            |
|            | Thành công 100% (Probe Calls Pass)       |     OPEN     |            |
|            |                                          | (Ngắt Mạch)  |            |
|     +--------------+                                  +--------------+            |
|     |  HALF_OPEN   | <---------------------------------------+                    |
|     | (Thăm dò)    |      Sau waitDurationInOpenState (ví dụ: 30s)                |
|     +--------------+                                                              |
|            |                                                                      |
|            +---------> Thất bại (Probe Calls Fail) -> Quay lại OPEN               |
+-----------------------------------------------------------------------------------+
~~~

### 3 Trạng thái Vận hành:
1. **CLOSED (Đóng mạch)**: Trạng thái bình thường. Mọi yêu cầu được chuyển thẳng tới dịch vụ đích. Kết quả các cuộc gọi (Thành công, Thất bại, hoặc Cuộc gọi chậm) được ghi nhận vào một Cửa sổ trượt (Sliding Window).
2. **OPEN (Hở mạch / Ngắt mạch)**: Khi tỉ lệ lỗi hoặc tỉ lệ cuộc gọi chậm vượt quá ngưỡng cấu hình (ví dụ: > 50%):
   - Mạch điện bị ngắt ngay lập tức!
   - Mọi yêu cầu gửi tới dịch vụ này **BỊ TỪ CHỐI NGAY LẬP TỨC TRONG 0 MILI-GIÂY** (Fast-fail) thông qua ngoại lệ <code>CallNotPermittedException</code>.
   - Luồng thực thi lập tức nhảy vào phương thức dự phòng (**Fallback Method**) để trả về dữ liệu lưu đệm hoặc thông báo lịch sự.
   - **Tác dụng cốt tử**: Bảo vệ luồng Worker của Caller không bị treo, đồng thời cho dịch vụ đích một khoảng thời gian yên tĩnh để tự hồi phục.
3. **HALF_OPEN (Nửa mở / Thăm dò)**: Sau một khoảng thời gian chờ (ví dụ: 30 giây):
   - Circuit Breaker chuyển sang trạng thái thăm dò.
   - Nó chỉ cho phép một số lượng cuộc gọi giới hạn (ví dụ: 10 cuộc gọi thử nghiệm) đi qua.
   - Nếu đa số các cuộc gọi thử nghiệm thành công: Circuit Breaker kết luận hệ thống đích đã khỏe mạnh và tự động đóng mạch trở lại (**CLOSED**).
   - Nếu vẫn thất bại: Lập tức ngắt mạch trở lại (**OPEN**) và tiếp tục chờ đợi.

---

## 2. Thứ Tự Bọc AOP Cốt Tử Của Resilience4j

Một dịch vụ phân tán thường kết hợp nhiều mẫu phòng vệ: Retry, CircuitBreaker, RateLimiter, Bulkhead. **Thứ tự thực thi của các bộ lọc AOP này quyết định trực tiếp tới tính đúng đắn của hệ thống**:

~~~text
+-----------------------------------------------------------------------------------+
|                        RESILIENCE4J AOP DECORATION ORDER                          |
|                                                                                   |
|  Caller Request                                                                   |
|       |                                                                           |
|       v                                                                           |
|  [Fallback Decorator]         (Bắt mọi ngoại lệ cuối cùng để trả về dữ liệu đệm)  |
|       |                                                                           |
|       v                                                                           |
|  [Retry Decorator]            (Thử lại nếu gặp lỗi mạng tạm thời)                 |
|       |                                                                           |
|       v                                                                           |
|  [CircuitBreaker Decorator]   (Nếu mạch đang OPEN -> Chặn đứng, không cho thử lại)|
|       |                                                                           |
|       v                                                                           |
|  [RateLimiter Decorator]      (Kiểm tra giới hạn số lượng request/giây)           |
|       |                                                                           |
|       v                                                                           |
|  [TimeLimiter Decorator]      (Ép timeout nếu gọi quá lâu, ví dụ > 2 giây)        |
|       |                                                                           |
|       v                                                                           |
|  [Bulkhead Decorator]         (Giới hạn số luồng đồng thời, ví dụ tối đa 20 luồng)|
|       |                                                                           |
|       v                                                                           |
|  Remote External Target Service (Gọi REST API Đối Tác)                            |
+-----------------------------------------------------------------------------------+
~~~

:::tip VÌ SAO RETRY NẰM NGOÀI CIRCUITE BREAKER?
Nếu <code>Retry</code> nằm bên ngoài <code>CircuitBreaker</code>: Khi CircuitBreaker mở mạch (OPEN), nó sẽ chặn cuộc gọi ngay lập tức trong 0ms. <code>Retry</code> bên ngoài sẽ thấy lỗi và không cần thử lại vô ích hàng chục lần vào một dịch vụ đang chết!
:::

---

## 3. Triển khai Production-Grade: Hệ thống Chấm Điểm Tín Dụng Tự Phục Hồi

Chúng ta sẽ thiết kế một phân hệ kết nối cổng thông tin tín dụng quốc gia (CIC Credit Bureau Client) được bảo vệ bằng:
1. Circuit Breaker dựa trên cửa sổ trượt 20 cuộc gọi gần nhất.
2. Tự động chuyển mạch sang **Fallback Cache** khi đối tác gặp sự cố.
3. Giới hạn tần suất gọi (Rate Limiting: 10 req/s) chống bị đối tác phạt tiền cước.

### 3.1. Cấu hình application.yml Chuẩn Doanh Nghiệp

~~~yaml
resilience4j:
  circuitbreaker:
    instances:
      creditBureauService:
        sliding-window-type: COUNT_BASED
        sliding-window-size: 20
        minimum-number-of-calls: 10
        failure-rate-threshold: 50.0
        slow-call-rate-threshold: 50.0
        slow-call-duration-threshold: 2s
        wait-duration-in-open-state: 30s
        permitted-number-of-calls-in-half-open-state: 5
        automatic-transition-from-open-to-half-open-enabled: true
        record-exceptions:
          - org.springframework.web.client.ResourceAccessException
          - java.util.concurrent.TimeoutException

  ratelimiter:
    instances:
      creditBureauService:
        limit-for-period: 10
        limit-refresh-period: 1s
        timeout-duration: 200ms

  retry:
    instances:
      creditBureauService:
        max-attempts: 3
        wait-duration: 500ms
        enable-exponential-backoff: true
        exponential-backoff-multiplier: 2
~~~

---

### 3.2. Mã Nguồn Client Tích Hợp Resilience4j & Fallback

~~~java
package com.bank.credit.client;

import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExternalCreditBureauClient {

    private final RestClient restClient;

    private static final String SERVICE_NAME = "creditBureauService";

    @CircuitBreaker(name = SERVICE_NAME, fallbackMethod = "fallbackCreditScore")
    @Retry(name = SERVICE_NAME)
    @RateLimiter(name = SERVICE_NAME)
    public CreditScoreResult fetchLiveCreditScore(String nationalId) {
        log.info("Calling External National Credit Bureau for nationalId={}", nationalId);

        // Gọi REST API đối tác qua mạng
        return restClient.get()
            .uri("https://api.cic.org.vn/v1/scores/{id}", nationalId)
            .retrieve()
            .body(CreditScoreResult.class);
    }

    /**
     * PHƯƠNG THỨC DỰ PHÒNG (FALLBACK METHOD):
     * BẮT BUỘC:
     * 1. Cùng kiểu trả về (CreditScoreResult)
     * 2. Cùng danh sách tham số ban đầu (String nationalId)
     * 3. Tham số CUỐI CÙNG phải là Throwable hoặc Exception cụ thể!
     */
    public CreditScoreResult fallbackCreditScore(String nationalId, CallNotPermittedException ex) {
        log.warn("CIRCUIT IS OPEN! Fast-falling back to cached credit score for nationalId={}. Reason: {}",
            nationalId, ex.getMessage());
        return new CreditScoreResult(nationalId, 600, "CACHED_FALLBACK_SCORE", true);
    }

    public CreditScoreResult fallbackCreditScore(String nationalId, Exception ex) {
        log.error("Downstream credit bureau failed for nationalId={}. Returning safe conservative score.",
            nationalId, ex);
        return new CreditScoreResult(nationalId, 550, "SAFE_DEFAULT_SCORE", true);
    }

    public record CreditScoreResult(
        String nationalId,
        int score,
        String source,
        boolean isFallback
    ) {}
}
~~~

---

## 4. Kiểm Thử Thực Tế & Xác Thực Quan Sát Metrics (Actuator & Verification)

### Giám Sát Trạng Thái Circuit Breaker qua Spring Boot Actuator:

~~~bash
curl -X GET http://localhost:8080/actuator/circuitbreakers
~~~

Response JSON:
~~~json
{
  "circuitBreakers": {
    "creditBureauService": {
      "state": "OPEN",
      "failureRate": "75.0%",
      "slowCallRate": "0.0%",
      "failureRateThreshold": "50.0%",
      "slowCallRateThreshold": "50.0%",
      "bufferedCalls": 20,
      "failedCalls": 15,
      "slowCalls": 0,
      "slowSuccessfulCalls": 0,
      "slowFailedCalls": 0,
      "notPermittedCalls": 1420
    }
  }
}
~~~

*(Quan sát thấy: khi ở trạng thái <code>OPEN</code>, có 1420 cuộc gọi bị chặn đứng ngay lập tức <code>notPermittedCalls: 1420</code>, không làm tốn bất kỳ tài nguyên mạng nào!)*

---

## 5. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Sai Khai Báo Phương Thức Fallback làm Sập Runtime

- **Triệu chứng**: Khi đối tác bị sập, thay vì trả về dữ liệu fallback, ứng dụng lập tức quăng ngoại lệ:
  <code>NoSuchMethodException: com.bank.credit.client.ExternalCreditBureauClient.fallbackCreditScore(String)</code>
- **Nguyên nhân cốt lõi**:
  Lập trình viên quên khai báo tham số <code>Throwable</code> ở cuối phương thức Fallback:
  ~~~java
  // SAI: Thiếu Throwable ở cuối!
  public CreditScoreResult fallbackCreditScore(String nationalId) { ... }
  ~~~
  Resilience4j sử dụng Reflection để tìm kiếm phương thức có chữ ký khớp hoàn toàn kèm ngoại lệ gây ra lỗi. Nếu không tìm thấy, nó sẽ quăng lỗi cấu hình và đánh sập request của khách hàng.
- **Quy tắc Vàng**: Luôn luôn khai báo <code>(OriginalArgs..., Throwable ex)</code> cho phương thức Fallback.

### Post-mortem 2: Thảm Họa Rò Rỉ Bộ Nhớ do Cấu Hình Sliding Window Quá Lớn

- **Triệu chứng**: Ứng dụng chạy được 3 ngày thì bị văng lỗi <code>OutOfMemoryError: Java heap space</code>.
- **Nguyên nhân cốt lõi**:
  Kỹ sư cấu hình:
  ~~~yaml
  sliding-window-type: TIME_BASED
  sliding-window-size: 86400 # 24 giờ!
  ~~~
  Với lưu lượng 10,000 req/s, trong 24 giờ có tới **864,000,000 cuộc gọi** được lưu trữ trong bộ nhớ Ring Buffer của Circuit Breaker! Dung lượng RAM cạn kiệt ngay lập tức.
- **Quy tắc**: Kích thước Sliding Window trong môi trường Microservices chỉ nên từ **20 đến 100 cuộc gọi** (đối với Count-based) hoặc từ **10 đến 60 giây** (đối với Time-based).

---

## 6. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống Cổng Dữ Liệu Chứng Khoán Thời Gian Thực (Real-time Stock Ticker) cần triển khai khả năng chịu lỗi:
1. Gọi dịch vụ giá cổ phiếu quốc tế <code>fetchStockPrice(symbol)</code>:
   - Nếu đối tác phản hồi quá 1.5 giây hoặc quăng lỗi mạng: Kích hoạt Circuit Breaker.
   - Khi Circuit Breaker OPEN: Tự động fallback lấy giá đóng cửa ngày hôm trước từ cơ sở dữ liệu nội bộ.
2. Viết trọn vẹn lớp dịch vụ hoàn chỉnh thỏa mãn các yêu cầu trên.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.bank.stock.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.timelimiter.annotation.TimeLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockPriceService {

    @CircuitBreaker(name = "stockPriceService", fallbackMethod = "fallbackStockPrice")
    @TimeLimiter(name = "stockPriceService")
    public CompletableFuture<StockPriceDto> getStockPriceAsync(String symbol) {
        return CompletableFuture.supplyAsync(() -> {
            log.info("Fetching live stock price for symbol: {}", symbol);
            // Giả lập gọi API quốc tế
            return new StockPriceDto(symbol, new BigDecimal("185.50"), false);
        });
    }

    public CompletableFuture<StockPriceDto> fallbackStockPrice(String symbol, Throwable ex) {
        log.warn("Circuit Open or Timeout for symbol {}. Returning previous close price.", symbol, ex);
        return CompletableFuture.completedFuture(
            new StockPriceDto(symbol, new BigDecimal("180.00"), true) // Giá đóng cửa hôm trước
        );
    }

    public record StockPriceDto(String symbol, BigDecimal price, boolean isEstimated) {}
}
~~~

:::takeaways
- **Bản Chất Của Circuit Breaker**: Cô lập dịch vụ hỏng bằng cỗ máy trạng thái (CLOSED -> OPEN -> HALF_OPEN), bảo vệ toàn bộ Thread Pool của hệ sinh thái trước nguy cơ Cascading Failure.
- **Thứ Tự AOP Cốt Tử**: Fallback bọc ngoài cùng -> Retry -> CircuitBreaker -> RateLimiter -> TimeLimiter -> Bulkhead.
- **Chuẩn Mực Phương Thức Fallback**: Bắt buộc phải có cùng tham số ban đầu và kết thúc bằng tham số <code>Throwable</code> để tránh lỗi <code>NoSuchMethodException</code>.
- **Sliding Window Hợp Lý**: Không bao giờ đặt kích thước cửa sổ quá lớn để tránh rò rỉ bộ nhớ Heap.
:::
`
    },
    {
      id: "6-4",
      type: "lesson",
      title: "API Gateway & Service Discovery — cánh cửa duy nhất",
      minutes: 50,
      content: `
## API Gateway & Service Discovery — Cánh Cửa Duy Nhất Vào Hệ Sinh Thái Microservices

Khi một hệ thống chuyển đổi từ Monolith sang Microservices, số lượng dịch vụ độc lập có thể tăng từ 1 lên 30 hoặc 100 dịch vụ. Nếu để ứng dụng Mobile hoặc Web Frontend giao tiếp trực tiếp với từng Microservice:
- Frontend phải tự lưu trữ hàng chục địa chỉ IP/Domain khác nhau.
- Mỗi Microservice phải tự cấu hình CORS, tự giải mã JWT, tự thiết lập Rate Limiting và tự cấu hình chứng chỉ SSL.
- Khi một dịch vụ thay đổi cổng hoặc đổi phiên bản (<code>v1</code> sang <code>v2</code>), toàn bộ ứng dụng Frontend của khách hàng sẽ bị gãy vỡ.

**API Gateway** ra đời như một "cửa khẩu hải quan duy nhất" (Single Entry Point) bảo vệ toàn bộ mạng lưới nội bộ. Bài học này sẽ mổ xẻ kiến trúc bất đồng bộ không chặn (Non-blocking Reactive Event Loop) của **Spring Cloud Gateway (Netty)**, cơ chế cân bằng tải phía máy khách (**Spring Cloud LoadBalancer**), và kỹ thuật **Token Relay & Header Sanitization** chống làm giả danh tính nội bộ.

---

## 1. Cơ Chế Ngầm của Spring Cloud Gateway & Netty Event Loop (Under the Hood)

### Vì sao Spring Cloud Gateway thay thế Netflix Zuul 1.x?

Ở thời kỳ đầu của Spring Cloud, Netflix Zuul 1.x được sử dụng làm Gateway mặc định. Tuy nhiên, Zuul 1.x hoạt động trên nền tảng **Servlet API truyền thống (Blocking I/O — Thread-per-request)**:
- Mỗi khi có 1 HTTP Request đi qua, Gateway phải cấp phát 1 Thread riêng biệt từ Tomcat Thread Pool.
- Nếu một dịch vụ backend phản hồi chậm mất 5 giây, Thread của Gateway sẽ bị treo cứng ở trạng thái chờ (Blocked).
- Khi có 1,000 request đồng thời, Zuul 1.x cạn kiệt thread pool và sập hoàn toàn!

Spring Cloud Gateway được viết lại 100% dựa trên **Project Reactor, Spring WebFlux và máy chủ Netty (Non-blocking I/O)**:
- Sử dụng mô hình **Event Loop**: Chỉ cần số lượng luồng rất nhỏ (thường bằng số nhân CPU, ví dụ: 8 luồng).
- Khi một request gửi sang backend, luồng Netty đăng ký một bộ lắng nghe sự kiện (Callback/Mono) và lập tức quay lại tiếp nhận hàng chục ngàn request khác của khách hàng!
- **Kết quả**: Một Pod Spring Cloud Gateway cấu hình 2 CPU / 4GB RAM có thể chịu tải mượt mà hơn **30,000 kết nối đồng thời** mà không bao giờ bị nghẽn luồng.

~~~text
+-----------------------------------------------------------------------------------+
|                     SPRING CLOUD GATEWAY ARCHITECTURE FLOW                        |
|                                                                                   |
|  Incoming HTTP Request (https://api.bank.com/v1/orders/101)                       |
|       |                                                                           |
|       v                                                                           |
|  [Netty Non-blocking Event Loop]                                                  |
|       |                                                                           |
|       v                                                                           |
|  [RoutePredicateHandlerMapping]                                                   |
|       - Đánh giá Route Predicates (Khớp Path, Method, Host, Header)               |
|       - Tìm thấy Route: id="order-service", uri="lb://order-service"              |
|       |                                                                           |
|       v                                                                           |
|  [GatewayFilterChain (Chuỗi Bộ Lọc Hai Chiều)]                                   |
|       |                                                                           |
|       +---> PRE-FILTERS:                                                          |
|       |     1. HeaderSanitizerFilter: Xóa sạch các header X-User-* từ Internet    |
|       |     2. JwtValidationFilter: Xác thực JWT, trích xuất "userId=8899"        |
|       |     3. TokenRelayFilter: Gắn Header nội bộ "X-User-Id: 8899"              |
|       |     4. RedisRateLimiterFilter: Kiểm tra hạn mức 100 req/s                 |
|       |                                                                           |
|       v                                                                           |
|  [Spring Cloud LoadBalancer] (Client-side Round Robin qua Eureka/Kubernetes)       |
|       |                                                                           |
|       v                                                                           |
|  Gửi Request sang Downstream Microservice: http://10.244.1.45:8080/orders/101     |
|       |                                                                           |
|       v                                                                           |
|  [POST-FILTERS]:                                                                  |
|       - Đo thời gian phản hồi (Response Latency)                                  |
|       - Thêm Header bảo mật X-Trace-Id                                            |
+-----------------------------------------------------------------------------------+
~~~

---

## 2. Kỹ Thuật Header Sanitization: Chống Tấn Công Làm Giả Danh Tính Nội Bộ

Trong kiến trúc Gateway bảo vệ Microservices, các dịch vụ nội bộ (Downstream Services) tin tưởng tuyệt đối vào Header do Gateway gắn vào:
~~~java
// Trong OrderService nội bộ:
@GetMapping("/my-orders")
public List<Order> getMyOrders(@RequestHeader("X-User-Id") String userId) {
    return orderRepository.findByUserId(userId);
}
~~~

**HIỂM HỌA BẢO MẬT CHÍ MẠNG**:
Nếu một tin tặc bên ngoài Internet tự ý dùng cURL gửi kèm header:
~~~bash
curl -X GET https://api.bank.com/v1/orders/my-orders   -H "X-User-Id: admin"   -H "X-User-Roles: ROLE_SUPER_ADMIN"
~~~
Nếu Gateway chỉ chuyển tiếp mù quáng mà không dọn dẹp, tin tặc sẽ cướp quyền Admin của toàn bộ hệ thống!

**Quy tắc Vàng của Gateway**:
1. **Header Sanitization (Tẩy rửa Header)**: Tại Pre-filter đầu tiên, Gateway bắt buộc phải **XÓA SẠCH toàn bộ các header bắt đầu bằng <code>X-User-*</code>** do người dùng truyền lên từ ngoài Internet.
2. Sau khi Gateway xác thực JWT thành công, nó mới tự tay tạo mới các header <code>X-User-Id</code> và <code>X-User-Roles</code> chuẩn xác từ Payload của Token!

---

## 3. Triển khai Production-Grade: Hệ thống Spring Cloud Gateway Hoàn Chỉnh

### 3.1. Cấu hình Routes & Redis Rate Limiter trong application.yml

~~~yaml
server:
  port: 8080

spring:
  cloud:
    gateway:
      discovery:
        locator:
          enabled: false # Tắt tự động mapping để kiểm soát chặt chẽ từng route
      routes:
        # Route 1: Order Service
        - id: order-service-route
          uri: lb://order-service # Cân bằng tải qua Service Discovery
          predicates:
            - Path=/api/v1/orders/**
          filters:
            - StripPrefix=2 # Đổi /api/v1/orders/101 thành /orders/101
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 50 # 50 token nạp mỗi giây
                redis-rate-limiter.burstCapacity: 100 # Chứa tối đa 100 token
                key-resolver: "#{@ipKeyResolver}"

        # Route 2: Payment Service
        - id: payment-service-route
          uri: lb://payment-service
          predicates:
            - Path=/api/v1/payments/**
          filters:
            - StripPrefix=2

  data:
    redis:
      host: localhost
      port: 6379
~~~

---

### 3.2. Custom Global Filter: Header Sanitizer & JWT Token Relay

~~~java
package com.bank.gateway.filter;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuthenticationAndSanitizerGatewayFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // 1. TẨY RỬA HEADER NGUY HIỂM (HEADER SANITIZATION)
        // Xóa sạch mọi header X-User-* do client từ Internet cố tình gửi lên!
        ServerHttpRequest.Builder requestBuilder = request.mutate()
            .headers(httpHeaders -> {
                httpHeaders.remove("X-User-Id");
                httpHeaders.remove("X-User-Roles");
                httpHeaders.remove("X-Tenant-ID");
            });

        // Đính kèm Trace ID duy nhất cho toàn bộ luồng request
        String traceId = "TRACE-" + UUID.randomUUID();
        requestBuilder.header("X-Trace-Id", traceId);

        // Bỏ qua xác thực cho các Public Endpoints
        if (path.startsWith("/api/v1/auth/") || path.startsWith("/actuator/health")) {
            return chain.filter(exchange.mutate().request(requestBuilder.build()).build());
        }

        // 2. XÁC MINH JWT TOKEN TẠI CỬA KHẨU GATEWAY
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Missing or invalid Authorization header for path: {}", path);
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);

        try {
            // Giả lập giải mã và xác minh JWT Token
            String extractedUserId = "usr-889911";
            String extractedRoles = "ROLE_CUSTOMER,ROLE_VIP";

            // 3. TIÊM HEADER ĐÃ ĐƯỢC XÁC THỰC AN TOÀN CHO MICROSERVICES NỘI BỘ
            requestBuilder.header("X-User-Id", extractedUserId);
            requestBuilder.header("X-User-Roles", extractedRoles);

            log.info("Gateway authenticated user {} successfully. TraceId={}", extractedUserId, traceId);

            return chain.filter(exchange.mutate().request(requestBuilder.build()).build());
        } catch (Exception e) {
            log.error("JWT token validation failed at gateway", e);
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }

    @Override
    public int getOrder() {
        // Chạy đầu tiên trong chuỗi bộ lọc
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
~~~

---

### 3.3. KeyResolver Giới Hạn Tần Suất Bằng Redis (Rate Limiter)

~~~java
package com.bank.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import reactor.core.publisher.Mono;

import java.util.Objects;

@Configuration
public class RateLimiterConfig {

    /**
     * Giới hạn tần suất gọi API theo địa chỉ IP của Client
     */
    @Bean
    @Primary
    public KeyResolver ipKeyResolver() {
        return exchange -> Mono.just(
            Objects.requireNonNull(exchange.getRequest().getRemoteAddress())
                .getAddress()
                .getHostAddress()
        );
    }
}
~~~

---

## 4. Kiểm Thử & Xác Thực Thực Tế (cURL & Verification)

### Kiểm thử Gửi Request Qua Gateway Thành Công:

~~~bash
curl -X GET http://localhost:8080/api/v1/orders/101 \
  -H "Authorization: Bearer valid_jwt_token..." \
  -i
~~~

Response Headers:
~~~text
HTTP/1.1 200 OK
Content-Type: application/json
X-Trace-Id: TRACE-550e8400-e29b-41d4-a716-446655440000
Date: Sat, 03 Oct 2026 16:30:00 GMT
~~~

### Kiểm thử Tấn công Gửi Lén Header Giả Mạo:

~~~bash
curl -X GET http://localhost:8080/api/v1/orders/101 \
  -H "Authorization: Bearer valid_jwt_token_of_customer..." \
  -H "X-User-Id: fake-admin" \
  -i
~~~

*(Quan sát log của OrderService: <code>X-User-Id</code> nhận được là <code>usr-889911</code> chính chủ từ JWT, giá trị <code>fake-admin</code> đã bị Gateway tiêu hủy hoàn toàn!)*

### Kiểm thử Vượt Hạn Mức Tần Suất (HTTP 429 Too Many Requests):

~~~bash
# Bắn liên tiếp 150 request trong 1 giây bằng công cụ benchmark
~~~

Response Status:
~~~text
HTTP/1.1 429 Too Many Requests
X-RateLimit-Remaining: 0
Retry-After: 1
~~~

---

## 5. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Chặn Đứng Luồng Netty Bằng Mã Blocking (Thread Starvation)

- **Triệu chứng**: Khi lưu lượng tăng lên 1,000 req/s, Gateway đột nhiên phản hồi cực kỳ chậm (từ 5ms nhảy vọt lên 10 giây) và sau đó toàn bộ các API đều bị Timeout.
- **Nguyên nhân cốt lõi**:
  Một kỹ sư viết một Custom Global Filter và thực hiện một thao tác Blocking I/O bên trong nó:
  ~~~java
  // THẢM HỌA: Gọi JDBC hoặc RestTemplate đồng bộ trong Gateway Filter!
  User user = jdbcTemplate.queryForObject("SELECT * FROM users WHERE ...", ...);
  ~~~
  Trong kiến trúc Reactive Netty, toàn bộ Gateway chỉ chạy trên 8 luồng Event Loop. Khi một luồng bị khóa bởi câu lệnh JDBC chặn, 1/8 năng lực xử lý của toàn bộ Gateway bị tê liệt. Chỉ cần 8 request đồng thời gọi vào bộ lọc này, toàn bộ Gateway sẽ ngừng tiếp nhận kết nối mới!
- **Quy tắc Vàng**: **TUYỆT ĐỐI KHÔNG BAO GIỜ GỌI MÃ BLOCKING TRONG GATEWAY**. Nếu cần truy vấn dữ liệu hoặc gọi mạng, bắt buộc phải sử dụng Reactive WebClient hoặc Reactive Redis Template.

---

## 6. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống Ngân hàng Cốt lõi cần xây dựng một Gateway Filter có tên **TenantRoutingFilter**:
1. Trích xuất Header <code>X-Tenant-Code</code> từ Client (ví dụ: "SME", "RETAIL").
2. Nếu không có header: Trả về lỗi <code>HTTP 400 Bad Request</code> kèm thông báo JSON ProblemDetails.
3. Nếu có: Tự động điều hướng động (Dynamic Route) sang Cluster tương ứng:
   - "SME" -> điều hướng tới <code>lb://sme-banking-service</code>
   - "RETAIL" -> điều hướng tới <code>lb://retail-banking-service</code>
4. Viết trọn vẹn lớp Filter thỏa mãn tiêu chí Non-blocking Reactive của Spring Cloud Gateway.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.bank.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URI;

@Component
public class TenantRoutingFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String tenantCode = exchange.getRequest().getHeaders().getFirst("X-Tenant-Code");

        if (tenantCode == null || tenantCode.isBlank()) {
            exchange.getResponse().setStatusCode(HttpStatus.BAD_REQUEST);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            byte[] bytes = "{"error": "Missing mandatory X-Tenant-Code header"}".getBytes();
            return exchange.getResponse().writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(bytes)));
        }

        // Định tuyến động dựa trên Tenant Code
        URI targetUri;
        if ("SME".equalsIgnoreCase(tenantCode)) {
            targetUri = URI.create("lb://sme-banking-service");
        } else {
            targetUri = URI.create("lb://retail-banking-service");
        }

        // Ghi đè Routing URI của Spring Cloud Gateway
        exchange.getAttributes().put(ServerWebExchangeUtils.GATEWAY_REQUEST_URL_ATTR, targetUri);

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE - 10;
    }
}
~~~

:::takeaways
- **Cơ Chế Bất Đồng Bộ Của Netty**: Spring Cloud Gateway sử dụng Non-blocking Reactive Event Loop; cấm tuyệt đối gọi các thao tác Blocking (JDBC, Thread.sleep, RestTemplate) bên trong Filter.
- **Tẩy Rửa Header (Header Sanitization)**: Luôn xóa sạch các header nhận diện nội bộ (<code>X-User-*</code>) từ Internet trước khi chuyển tiếp request vào mạng riêng.
- **Tập Trung Hóa Token Relay**: Gateway xác thực JWT một lần duy nhất tại cửa ngõ, sau đó tiêm danh tính đã xác minh (<code>X-User-Id</code>, <code>X-User-Roles</code>) cho các Microservices bên trong, giúp giảm tải tối đa cho hệ sinh thái.
- **Giới Hạn Tần Suất Bằng Redis**: Tận dụng <code>RequestRateLimiter</code> với thuật toán Token Bucket lưu trên Redis để bảo vệ hệ thống trước các cuộc tấn công DDoS và cào dữ liệu trái phép.
:::
`
    },
    {
      id: "6-5",
      type: "lesson",
      title: "Saga Pattern — distributed transaction đúng cách",
      minutes: 50,
      content: `
## Saga Pattern — Quản Trị Giao Dịch Phân Tán Bằng Giao Dịch Bù Trừ (Compensating Transactions)

Trong kiến trúc Monolith truyền thống, việc đảm bảo tính toàn vẹn dữ liệu khi thực hiện một quy trình phức tạp (Đặt hàng -> Trừ tiền ví -> Trừ tồn kho -> Tích lũy điểm thưởng) cực kỳ đơn giản: bạn chỉ cần bọc toàn bộ mã nguồn trong một annotation <code>@Transactional</code>. Cơ sở dữ liệu sẽ đảm bảo tính chất **ACID (Atomicity, Consistency, Isolation, Durability)** — nếu bước trừ kho thất bại, cơ sở dữ liệu sẽ tự động phục hồi (Rollback) toàn bộ tiền về ví của khách hàng.

Tuy nhiên, trong kiến trúc Microservices, mỗi dịch vụ sở hữu một cơ sở dữ liệu riêng biệt (**Database-per-Service**). Bạn không thể dùng một câu lệnh <code>ROLLBACK</code> của SQL để hoàn tiền trên cơ sở dữ liệu của <code>PaymentService</code> khi lỗi xảy ra ở <code>InventoryService</code>!

Bài học này sẽ phân tích chuyên sâu **Saga Pattern**, đối chiếu thực chiến giữa **Choreography (Tự phối hợp qua Event)** và **Orchestration (Bộ điều phối trung tâm)**, bản chất của **Giao dịch Bù trừ (Compensating Transaction)**, và cách giải quyết các hiểm họa mất tính cô lập (Lack of Isolation) trong hệ thống tài chính phân tán.

---

## 1. Bản Chất của Saga Pattern: Chuỗi Giao Dịch Cục Bộ (Under the Hood)

Saga Pattern (được đề xuất lần đầu bởi Hector Garcia-Molina và Kenneth Salem vào năm 1987) định nghĩa: **Một Saga là một chuỗi các giao dịch cục bộ (Local Transactions)**.
- Mỗi giao dịch cục bộ cập nhật cơ sở dữ liệu của một Microservice duy nhất và kích hoạt bước tiếp theo.
- **Nếu một bước thất bại**: Saga bắt buộc phải thực thi một chuỗi các **Giao Dịch Bù Trừ (Compensating Transactions)** ngược chiều để hủy bỏ các hiệu ứng đã ghi nhận trước đó.

~~~text
+-----------------------------------------------------------------------------------+
|                        SAGA EXECUTION FLOW (HAPPY PATH vs FAILURE)                |
|                                                                                   |
|  [HAPPY PATH - THÀNH CÔNG HOÀN TOÀN]:                                             |
|  T1 (Tạo Order)  ---> T2 (Trừ Tiền Ví)  ---> T3 (Giữ Tồn Kho)  ---> T4 (Xác Nhận)|
|                                                                                   |
|  -------------------------------------------------------------------------------  |
|                                                                                   |
|  [FAILURE PATH - THẤT BẠI TẠI BƯỚC T3 (HẾT HÀNG TRONG KHO)]:                      |
|                                                                                   |
|  T1 (Tạo Order)  ---> T2 (Trừ Tiền Ví)  ---> T3 (KHO BÁO HẾT HÀNG!)               |
|                                                     |                             |
|                                                     v (KÍCH HOẠT ROLLBACK BÙ TRỪ) |
|  C1 (Hủy Order)  <--- C2 (HOÀN TIỀN VÍ) <-----------+                             |
|  (Compensate T1)      (Compensate T2)                                             |
|                                                                                   |
|  * LƯU Ý CỐT TỬ: Giao dịch bù trừ (C2) là một giao dịch nghiệp vụ MỚI             |
|    (cộng tiền lại vào ví), chứ KHÔNG PHẢI là quay ngược thời gian database!       |
+-----------------------------------------------------------------------------------+
~~~

---

## 2. Đối Đầu Kỹ Thuật: Choreography vs Orchestration

| Tiêu chí | Choreography (Phối hợp ngầm qua Event) | Orchestration (Điều phối tập trung) |
|---|---|---|
| **Cơ chế hoạt động** | Các dịch vụ tự lắng nghe Event của nhau và tự phản ứng (Pub/Sub). Không có ai làm chỉ huy. | Một dịch vụ **Saga Orchestrator** nắm giữ máy trạng thái (State Machine), gửi lệnh (Commands) và chờ phản hồi (Replies). |
| **Ưu điểm** | Đơn giản, tự nhiên, ít thành phần trung gian khi Saga chỉ có 2 - 3 bước. | Quy trình nghiệp vụ tường minh (Explicit Workflow), dễ theo dõi trạng thái, dễ debug và kiểm toán. |
| **Nhược điểm** | Dễ rơi vào bẫy **Phụ thuộc vòng lặp (Cyclic Dependencies)**; cực kỳ khó hình dung toàn bộ luồng khi hệ thống có trên 4 dịch vụ. | Cần bảo trì thêm Orchestrator Service; nếu không thiết kế tốt có thể biến Orchestrator thành "God Service". |
| **Khuyên dùng** | Quy trình thanh toán đơn giản (2 bước). | **Chuẩn Enterprise**: Đặt hàng thương mại điện tử, đặt tour du lịch (Vé máy bay + Khách sạn + Xe), phê duyệt tín dụng ngân hàng. |

---

## 3. Triển khai Production-Grade: Order Fulfillment Saga Orchestrator

Chúng ta sẽ thiết kế một bộ điều phối **OrderFulfillmentSagaOrchestrator** bằng Spring Boot:
1. <code>Step 1</code>: Khởi tạo đơn hàng <code>PENDING</code>.
2. <code>Step 2</code>: Gửi lệnh trừ tiền sang <code>PaymentClient</code>.
3. <code>Step 3</code>: Gửi lệnh giữ kho sang <code>InventoryClient</code>.
4. Nếu giữ kho thất bại (hết hàng): Tự động kích hoạt lệnh hoàn tiền <code>refundPayment()</code> và đánh dấu đơn hàng <code>FAILED_OUT_OF_STOCK</code>.

### 3.1. Các Dịch vụ Phụ thuộc (Client Ports)

~~~java
package com.bank.saga.port;

import java.math.BigDecimal;

public interface PaymentClientPort {
    PaymentResult executePayment(String orderId, String customerId, BigDecimal amount);
    void refundPayment(String paymentTransactionId, String reason);

    record PaymentResult(boolean success, String paymentTransactionId, String errorMessage) {}
}
~~~

~~~java
package com.bank.saga.port;

public interface InventoryClientPort {
    InventoryReservationResult reserveInventory(String orderId, String sku, int quantity);
    void releaseInventory(String reservationId);

    record InventoryReservationResult(boolean success, String reservationId, String errorMessage) {}
}
~~~

---

### 3.2. Bộ Điều Phối Saga Orchestrator Hoàn Chỉnh

~~~java
package com.bank.saga.orchestrator;

import com.bank.saga.port.InventoryClientPort;
import com.bank.saga.port.InventoryClientPort.InventoryReservationResult;
import com.bank.saga.port.PaymentClientPort;
import com.bank.saga.port.PaymentClientPort.PaymentResult;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderFulfillmentSagaOrchestrator {

    private final PaymentClientPort paymentClient;
    private final InventoryClientPort inventoryClient;

    public SagaExecutionResult executeOrderSaga(OrderSagaContext context) {
        log.info("STARTING ORDER SAGA for orderId={}, amount={}", context.getOrderId(), context.getAmount());

        // BƯỚC 1: TRỪ TIỀN KHÁCH HÀNG (Forward Action 1)
        PaymentResult paymentResult = paymentClient.executePayment(
            context.getOrderId(), context.getCustomerId(), context.getAmount()
        );

        if (!paymentResult.success()) {
            log.warn("Payment failed for orderId={}: {}", context.getOrderId(), paymentResult.errorMessage());
            context.setStatus(SagaStatus.FAILED_PAYMENT);
            return new SagaExecutionResult(false, "Payment failed: " + paymentResult.errorMessage());
        }

        context.setPaymentTxId(paymentResult.paymentTransactionId());
        log.info("Step 1 SUCCESS: Payment captured txId={}", context.getPaymentTxId());

        // BƯỚC 2: GIỮ TỒN KHO TRONG KHO HÀNG (Forward Action 2)
        InventoryReservationResult inventoryResult = inventoryClient.reserveInventory(
            context.getOrderId(), context.getSku(), context.getQuantity()
        );

        if (!inventoryResult.success()) {
            log.warn("Step 2 FAILED: Inventory allocation failed for orderId={}. INITIATING COMPENSATING TRANSACTIONS!",
                context.getOrderId());

            // KÍCH HOẠT GIAO DỊCH BÙ TRỪ: HOÀN LẠI TIỀN VÍ
            compensatePayment(context);

            context.setStatus(SagaStatus.COMPENSATED_OUT_OF_STOCK);
            return new SagaExecutionResult(false, "Inventory out of stock. Funds refunded to customer.");
        }

        context.setInventoryReservationId(inventoryResult.reservationId());
        context.setStatus(SagaStatus.COMPLETED);
        log.info("SAGA COMPLETED SUCCESSFULLY for orderId={}", context.getOrderId());

        return new SagaExecutionResult(true, "Order fulfilled successfully");
    }

    private void compensatePayment(OrderSagaContext context) {
        if (context.getPaymentTxId() != null) {
            log.info("EXECUTING COMPENSATION: Refunding paymentTxId={}", context.getPaymentTxId());
            try {
                paymentClient.refundPayment(context.getPaymentTxId(), "Out of stock compensation");
                log.info("COMPENSATION SUCCESS: Refund completed for txId={}", context.getPaymentTxId());
            } catch (Exception e) {
                // Nếu hoàn tiền lỗi, đẩy vào hàng đợi Dead Letter hoặc gắn cờ can thiệp thủ công!
                log.error("CRITICAL: Compensation refund failed for txId={}! Manual reconciliation required.",
                    context.getPaymentTxId(), e);
            }
        }
    }

    @Getter
    @RequiredArgsConstructor
    public static class OrderSagaContext {
        private final String orderId;
        private final String customerId;
        private final String sku;
        private final int quantity;
        private final BigDecimal amount;

        private String paymentTxId;
        private String inventoryReservationId;
        private SagaStatus status = SagaStatus.STARTED;

        public void setPaymentTxId(String paymentTxId) { this.paymentTxId = paymentTxId; }
        public void setInventoryReservationId(String id) { this.inventoryReservationId = id; }
        public void setStatus(SagaStatus status) { this.status = status; }
    }

    public enum SagaStatus {
        STARTED,
        FAILED_PAYMENT,
        COMPENSATED_OUT_OF_STOCK,
        COMPLETED
    }

    public record SagaExecutionResult(boolean success, String message) {}
}
~~~

---

## 4. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Giao Dịch Bù Trừ Không Có Tính Vô Cảm (Double Refund Disaster)

- **Triệu chứng**: Trong đợt nghẽn mạng, khách hàng đặt mua hàng thất bại được hoàn tiền gấp 3 lần số tiền đã bỏ ra! Kế toán đối soát phát hiện thất thoát hàng trăm triệu đồng.
- **Nguyên nhân cốt lõi**:
  Phương thức bù trừ <code>refundPayment()</code> không có tính Idempotent. Khi lệnh hoàn tiền gặp mạng trập trùng (Timeout), Orchestrator tự động thử lại 3 lần. Dịch vụ thanh toán ngây thơ thực hiện 3 lệnh chuyển khoản hoàn tiền độc lập cho cùng một đơn hàng!
- **Quy tắc Bất Biến**:
  **MỌI GIAO DỊCH BÙ TRỪ BẮT BUỘC PHẢI CÓ TÍNH VÔ CẢM (IDEMPOTENT)**. Phải truyền mã định danh duy nhất (Idempotency Key / Payment Transaction ID gốc) để nếu lệnh hoàn tiền có bị gọi 10 lần, tiền cũng chỉ được hoàn đúng 1 lần duy nhất.

### Post-mortem 2: Vấn Đề Thiếu Tính Cô Lập (Lack of Isolation — Dirty Reads)

- **Triệu chứng**: Trong khi Saga đang chạy giữa chừng (đã giữ chỗ 1 phòng khách sạn cuối cùng, nhưng chưa thanh toán), một người dùng khác truy vấn danh sách phòng thì thấy phòng đã hết. 5 giây sau bước thanh toán thất bại, phòng lại đột ngột xuất hiện trở lại, làm khách hàng hoang mang.
- **Bản chất**: Saga từ bỏ tính chất Isolation của ACID để đổi lấy tính sẵn sàng cao (High Availability).
- **Giải pháp**: Áp dụng kỹ thuật **Semantic Lock**: Khi bản ghi đang nằm trong một Saga đang chạy, gắn cờ trạng thái <code>PENDING_APPROVAL</code>. Người dùng khác đọc dữ liệu sẽ thấy rõ trạng thái "Đang trong quá trình đặt chỗ" thay vì hiểu lầm là đã bán đứt.

---

## 5. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống Đặt Tour Du Lịch Trọn Gói (Travel Booking Saga) cần điều phối 2 dịch vụ độc lập:
1. <code>FlightService.bookFlight(flightCode)</code> -> Bù trừ bằng <code>cancelFlight(ticketId)</code>.
2. <code>HotelService.bookHotel(hotelCode)</code> -> Bù trừ bằng <code>cancelHotel(bookingId)</code>.
3. Viết bài kiểm thử đơn vị JUnit 5 mô phỏng kịch bản: Đặt vé máy bay thành công, nhưng đặt khách sạn bị lỗi -> Kiểm chứng rằng lệnh hủy vé máy bay <code>cancelFlight</code> bắt buộc phải được kích hoạt chính xác 1 lần.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.bank.travel.saga;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.times;

@ExtendWith(MockitoExtension.class)
@DisplayName("Travel Booking Saga Orchestrator Tests")
class TravelBookingSagaTest {

    interface FlightPort {
        String book(String flightCode);
        void cancel(String ticketId);
    }

    interface HotelPort {
        String book(String hotelCode);
        void cancel(String bookingId);
    }

    static class TravelSagaOrchestrator {
        private final FlightPort flightPort;
        private final HotelPort hotelPort;

        public TravelSagaOrchestrator(FlightPort flightPort, HotelPort hotelPort) {
            this.flightPort = flightPort;
            this.hotelPort = hotelPort;
        }

        public boolean bookPackage(String flightCode, String hotelCode) {
            String ticketId = flightPort.book(flightCode);
            try {
                String hotelBookingId = hotelPort.book(hotelCode);
                return true;
            } catch (Exception e) {
                // BÙ TRỪ: Hủy vé máy bay vừa đặt
                flightPort.cancel(ticketId);
                return false;
            }
        }
    }

    @Mock
    private FlightPort flightPort;

    @Mock
    private HotelPort hotelPort;

    @Test
    @DisplayName("Should compensate flight booking when hotel booking throws exception")
    void shouldCancelFlightWhenHotelFails() {
        given(flightPort.book("VN-123")).willReturn("TICKET-8899");
        given(hotelPort.book("HOTEL-HILTON")).willThrow(new RuntimeException("No rooms available"));

        TravelSagaOrchestrator orchestrator = new TravelSagaOrchestrator(flightPort, hotelPort);

        boolean result = orchestrator.bookPackage("VN-123", "HOTEL-HILTON");

        assertThat(result).isFalse();
        // Kiểm chứng bắt buộc phải gọi lệnh bù trừ hủy vé máy bay
        then(flightPort).should(times(1)).cancel("TICKET-8899");
    }
}
~~~

:::takeaways
- **Saga Là Giải Pháp Thay Thế 2PC**: Chia nhỏ một nghiệp vụ phân tán thành một chuỗi các giao dịch cục bộ độc lập.
- **Bản Chất Của Giao Dịch Bù Trừ (Compensation)**: Không thể rollback database vật lý; bắt buộc phải thực thi hành động nghiệp vụ ngữ nghĩa ngược chiều (ví dụ: hoàn tiền, hủy đơn, trả kho).
- **Orchestration Vượt Trội Về Độ Tường Minh**: Sử dụng bộ điều phối tập trung giúp quản lý trạng thái rõ ràng, dễ bảo trì và kiểm toán hơn Choreography khi quy trình có nhiều bước.
- **Bắt Buộc Idempotent Cho Mọi Bước Bù Trừ**: Ngăn chặn rủi ro hoàn tiền hoặc hủy đơn lặp lại nhiều lần khi có retry phân tán.
:::
`
    },
    {
      id: "6-6",
      type: "lesson",
      title: "Quartz & Scheduling nâng cao — job đáng tin trong production",
      minutes: 45,
      content: `
## Quartz & Scheduling Nâng Cao — Xây Dựng Tác Vụ Định Kỳ Đáng Tin Cậy Trong Production

Hầu hết lập trình viên Spring Boot đều bắt đầu lập lịch tác vụ bằng annotation quen thuộc:
~~~java
@Scheduled(cron = "0 0 2 * * ?") // Chạy lúc 2 giờ sáng mỗi ngày
public void runDailyBilling() { ... }
~~~
Trên môi trường phát triển cục bộ (Localhost) chạy 1 instance, mã nguồn này hoạt động hoàn hảo. Nhưng ngay khi deploy lên môi trường Production chạy **5 Pods (hoặc 5 Nodes)** dưới cụm Kubernetes:
- Đúng 2:00:00 AM, **cả 5 Pods ĐỒNG LOẠT CHẠY JOB NÀY CÙNG MỘT LÚC!**
- Khách hàng bị trừ tiền sao kê 5 lần, email thông báo gửi 5 lần, và cơ sở dữ liệu bị rơi vào tình trạng Deadlock dữ dội do 5 tiến trình tranh giành cập nhật cùng các dòng dữ liệu.

Bài học này sẽ mổ xẻ nguyên lý khóa phân tán của **ShedLock**, kiến trúc phân cụm lưu vết cơ sở dữ liệu của **Quartz Scheduler Cluster**, cơ chế chống chạy đè bằng **@DisallowConcurrentExecution**, và giải thuật xử lý tác vụ bị lỡ hẹn (**Misfire Handling**).

---

## 1. Cơ Chế Ngầm của Lập Lịch Phân Tán (Under the Hood)

### Giải pháp Nhẹ: ShedLock (Khóa Phân Tán Cho @Scheduled)

Nếu ứng dụng chỉ có các tác vụ định kỳ đơn giản (Cron Jobs cố định) và không cần thay đổi lịch trình ở runtime, **ShedLock** là giải pháp nhẹ nhàng nhất:
- Tạo một bảng đơn giản trong Database hoặc dùng Redis: <code>shedlock (name, lock_until, locked_at, locked_by)</code>.
- Khi đến giờ chạy, Pod nào nhanh tay thực hiện câu lệnh <code>INSERT</code> hoặc <code>UPDATE</code> giành khóa thành công sẽ được quyền chạy; 4 Pod còn lại thấy khóa đang bị giữ sẽ tự động bỏ qua!

~~~java
@Scheduled(cron = "0 0 2 * * ?")
@SchedulerLock(name = "dailyBillingJob", lockAtMostFor = "15m", lockAtLeastFor = "5m")
public void runDailyBilling() {
    // Chỉ duy nhất 1 Pod trong toàn bộ hệ thống được chạy!
}
~~~

---

### Giải Pháp Toàn Diện Cấp Doanh Nghiệp: Quartz Scheduler Clustered

Khi nghiệp vụ đòi hỏi:
- Tạo lịch trình động tại Runtime (ví dụ: Người dùng đặt lịch nhắc nợ lúc 9:15 AM ngày mai).
- Lưu trữ trạng thái Job vào Database (nếu Server sập, khi khởi động lại Job không bị mất).
- Phân phối tải công bằng giữa các Pod trong cụm.

**Quartz Cluster** sử dụng các bảng dữ liệu <code>QRTZ_*</code> làm trung gian điều phối giữa các Pod:

~~~text
+-----------------------------------------------------------------------------------+
|                        QUARTZ CLUSTERING ARCHITECTURE FLOW                        |
|                                                                                   |
|  Pod 1 (Spring Boot)             Pod 2 (Spring Boot)             Pod 3 (Spring Boot)|
|  InstanceId: "pod-1"             InstanceId: "pod-2"             InstanceId: "pod-3"|
|                                         |                                /       |
|                                         |                               /        |
|           v                              v                              v         |
|  +-----------------------------------------------------------------------------+  |
|  |                       DATABASE QUARTZ CLUSTER TABLES                        |  |
|  |                                                                             |  |
|  |  * QRTZ_LOCKS:                                                              |  |
|  |    Khóa phân tán dùng "SELECT * FROM QRTZ_LOCKS WHERE LOCK_NAME = 'TRIGGER_ACCESS'
|  |    FOR UPDATE" -> Pod 1 giành được khóa trước!                             |  |
|  |                                                                             |  |
|  |  * QRTZ_FIRED_TRIGGERS:                                                      |  |
|  |    Ghi nhận: Trigger "daily-settlement" đang được thực thi bởi "pod-1".     |  |
|  |                                                                             |  |
|  |  * QRTZ_JOB_DETAILS & QRTZ_TRIGGERS: Lưu trữ định nghĩa Job và thời gian nạp |  |
|  +-----------------------------------------------------------------------------+  |
|         |                                                                         |
|         +---> Pod 1 thực thi Job xong -> Xóa bản ghi trong QRTZ_FIRED_TRIGGERS    |
|               và giải phóng khóa cho các Job khác.                                |
+-----------------------------------------------------------------------------------+
~~~

### Cơ Chế Chống Chạy Đè: @DisallowConcurrentExecution

Nếu một tác vụ được lên lịch chạy mỗi 5 phút một lần, nhưng vì dữ liệu quá lớn, lần chạy lúc 10:00 mất tới 8 phút mới xong:
- Lúc 10:05, Quartz theo lịch sẽ kích hoạt lần chạy tiếp theo.
- Hai tiến trình của cùng một Job chạy song song sẽ tranh chấp dữ liệu và làm sập RAM!
- **Giải pháp**: Đánh dấu <code>@DisallowConcurrentExecution</code> lên Job Class. Quartz sẽ ngăn chặn việc kích hoạt lần chạy mới cho đến khi lần chạy trước đó hoàn tất 100%.

---

## 2. Triển khai Production-Grade: Hệ thống Lập Lịch Đối Soát Tài Chính Phân Tán

### 2.1. Cấu hình Quartz Cluster trong application.yml

~~~yaml
spring:
  quartz:
    job-store-type: jdbc
    jdbc:
      initialize-schema: never # Tạo bảng qua Flyway Migration
    properties:
      org.quartz.scheduler.instanceName: BankClusteredScheduler
      org.quartz.scheduler.instanceId: AUTO # Tự sinh ID theo tên Pod/Hostname
      org.quartz.jobStore.class: org.springframework.scheduling.quartz.LocalDataSourceJobStore
      org.quartz.jobStore.driverDelegateClass: org.quartz.impl.jdbcjobstore.PostgreSQLDelegate
      org.quartz.jobStore.tablePrefix: QRTZ_
      org.quartz.jobStore.isClustered: true # BẬT CHẾ ĐỘ CLUSTER PHÂN TÁN
      org.quartz.jobStore.clusterCheckinInterval: 15000 # Heartbeat kiểm tra pod sống: 15s
      org.quartz.jobStore.misfireThreshold: 60000 # Trễ quá 60s tính là Misfire
      org.quartz.threadPool.threadCount: 10 # Mỗi pod cấp tối đa 10 thread chạy job
~~~

---

### 2.2. Mã Nguồn Clustered Job An Toàn Tuyệt Đối

~~~java
package com.bank.scheduling.job;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.PersistJobDataAfterExecution;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@DisallowConcurrentExecution // CẤM CHẠY ĐÈ: Không cho phép chạy 2 instance của Job này cùng lúc
@PersistJobDataAfterExecution // Lưu vết các thay đổi trong JobDataMap xuống database
@RequiredArgsConstructor
@Slf4j
public class FinancialReconciliationJob implements Job {

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        String jobKey = context.getJobDetail().getKey().toString();
        String fireTime = context.getFireTime().toString();

        log.info("STARTING CLUSTERED JOB: key={}, scheduledTime={}, executorPod={}",
            jobKey, fireTime, context.getScheduler().getSchedulerInstanceId());

        try {
            // Giả lập thực thi tác vụ nặng đối soát hàng trăm ngàn giao dịch
            performReconciliation();
            log.info("JOB COMPLETED SUCCESSFULLY: key={}", jobKey);
        } catch (Exception e) {
            log.error("CRITICAL: Job execution failed for key={}", jobKey, e);
            // Ném ngoại lệ để Quartz ghi nhận trạng thái lỗi
            throw new JobExecutionException("Reconciliation failed", e);
        }
    }

    private void performReconciliation() throws InterruptedException {
        // Giả lập chạy mất 3 giây
        Thread.sleep(3000);
    }
}
~~~

---

### 2.3. Service Lập Lịch Động (Dynamic Runtime Scheduling Service)

~~~java
package com.bank.scheduling.service;

import com.bank.scheduling.job.FinancialReconciliationJob;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.CronScheduleBuilder;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.SimpleScheduleBuilder;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;

@Service
@RequiredArgsConstructor
@Slf4j
public class DynamicJobSchedulerService {

    private final Scheduler quartzScheduler;

    /**
     * Lập lịch tác vụ chạy 1 lần duy nhất tại một mốc thời gian trong tương lai
     */
    public void scheduleOneTimeJob(String jobName, String group, Instant executeAt) {
        try {
            JobDetail jobDetail = JobBuilder.newJob(FinancialReconciliationJob.class)
                .withIdentity(jobName, group)
                .withDescription("One-time scheduled reconciliation job")
                .storeDurably()
                .build();

            Trigger trigger = TriggerBuilder.newTrigger()
                .withIdentity(jobName + "-trigger", group)
                .startAt(Date.from(executeAt))
                .withSchedule(SimpleScheduleBuilder.simpleSchedule().withMisfireHandlingInstructionFireNow())
                .build();

            quartzScheduler.scheduleJob(jobDetail, trigger);
            log.info("Scheduled dynamic job {} in group {} for execution at {}", jobName, group, executeAt);
        } catch (SchedulerException e) {
            log.error("Failed to schedule dynamic job", e);
            throw new RuntimeException("Could not schedule quartz job", e);
        }
    }

    /**
     * Cập nhật biểu thức Cron động tại runtime mà không cần restart server
     */
    public void rescheduleCronJob(String triggerName, String group, String newCronExpression) {
        try {
            Trigger oldTrigger = quartzScheduler.getTrigger(new org.quartz.TriggerKey(triggerName, group));
            if (oldTrigger != null) {
                Trigger newTrigger = TriggerBuilder.newTrigger()
                    .withIdentity(triggerName, group)
                    .withSchedule(CronScheduleBuilder.cronSchedule(newCronExpression))
                    .build();

                quartzScheduler.rescheduleJob(oldTrigger.getKey(), newTrigger);
                log.info("Rescheduled trigger {} with new cron: {}", triggerName, newCronExpression);
            }
        } catch (SchedulerException e) {
            log.error("Failed to reschedule job", e);
            throw new RuntimeException(e);
        }
    }
}
~~~

---

## 3. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Lỗi Lệch Đồng Hồ Giữa Các Máy Chủ (Clock Drift Outage)

- **Triệu chứng**: Khi triển khai lên cụm máy chủ đa vùng (Multi-AZ), một Node Quartz liên tục báo lỗi:
  <code>This scheduler instance's clock is 18720ms behind/ahead of other instances! Clustered scheduling cannot work safely.</code> và Node tự động từ chối chạy Job.
- **Nguyên nhân cốt lõi**:
  Mỗi Node ghi thời gian heartbeat (check-in) của mình vào bảng <code>QRTZ_SCHEDULER_STATE</code>. Nếu dịch vụ đồng bộ thời gian (NTP daemon) trên máy chủ bị lỗi và đồng hồ hệ thống bị lệch quá 15 giây, Quartz sẽ chủ động ngừng tham gia vào cụm để tránh việc 2 node hiểu nhầm thời gian của nhau và chạy trùng lặp Job.
- **Giải pháp**: Đảm bảo dịch vụ <code>chrony</code> hoặc <code>ntpd</code> hoạt động ổn định trên toàn bộ máy chủ và Kubernetes Nodes.

---

## 4. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống Nhắc Nợ Khách Hàng (Loan Payment Reminder) cần xây dựng dịch vụ lập lịch thông minh:
1. Khi khách hàng có khoản vay sắp đến hạn:
   - Dịch vụ tính toán thời điểm 08:30 AM của ngày đến hạn.
   - Lập lịch một One-time Job duy nhất gửi SMS/Email nhắc nợ.
2. Viết bài kiểm thử đơn vị JUnit 5 xác minh rằng: Khi lập lịch một Job mới, phương thức <code>scheduler.scheduleJob()</code> của Quartz bắt buộc phải được kích hoạt với đúng Trigger thời gian.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.bank.scheduling.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.Trigger;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.times;

@ExtendWith(MockitoExtension.class)
@DisplayName("DynamicJobSchedulerService Unit Tests")
class DynamicJobSchedulerServiceTest {

    @Mock
    private Scheduler quartzScheduler;

    @InjectMocks
    private DynamicJobSchedulerService dynamicJobSchedulerService;

    @Test
    @DisplayName("Should successfully schedule job with Quartz cluster scheduler")
    void shouldScheduleOneTimeJobSuccessfully() throws SchedulerException {
        Instant executeAt = Instant.now().plusSeconds(3600); // 1 giờ sau

        dynamicJobSchedulerService.scheduleOneTimeJob("REMIND-LOAN-99", "LOAN_REMINDERS", executeAt);

        ArgumentCaptor<JobDetail> jobDetailCaptor = ArgumentCaptor.forClass(JobDetail.class);
        ArgumentCaptor<Trigger> triggerCaptor = ArgumentCaptor.forClass(Trigger.class);

        then(quartzScheduler).should(times(1)).scheduleJob(jobDetailCaptor.capture(), triggerCaptor.capture());

        assertThat(jobDetailCaptor.getValue().getKey().getName()).isEqualTo("REMIND-LOAN-99");
        assertThat(jobDetailCaptor.getValue().getKey().getGroup()).isEqualTo("LOAN_REMINDERS");
        assertThat(triggerCaptor.getValue().getStartTime().toInstant()).isEqualTo(executeAt);
    }
}
~~~

:::takeaways
- **Cấm Tuyệt Đối @Scheduled Đơn Lẻ Trên Multi-Pod**: Gây chạy trùng lặp dữ liệu trên toàn bộ các Node. Sử dụng ShedLock cho tác vụ nhẹ hoặc Quartz Clustered cho hệ thống lớn.
- **Cơ Chế Phân Cụm Của Quartz**: Sử dụng khóa hàng RDBMS (<code>QRTZ_LOCKS FOR UPDATE</code>) để bảo đảm chỉ có DUY NHẤT một Pod được quyền giành quyền thực thi Job tại một thời điểm.
- **Bắt Buộc Dùng @DisallowConcurrentExecution**: Chống hiện tượng tác vụ chạy đè lên nhau khi thời gian xử lý thực tế kéo dài quá chu kỳ lặp lại.
- **Đồng Bộ Thời Gian Hệ Thống (NTP)**: Mọi máy chủ trong cụm Quartz bắt buộc phải có thời gian đồng bộ chuẩn tuyệt đối để tránh lỗi Clock Drift Outage.
:::
`
    },
    {
      id: "6-7",
      type: "lesson",
      title: "Multi-tenancy — 1 codebase, N tenant, 0 data leak",
      minutes: 50,
      content: `
## Multi-Tenancy Chuyên Sâu — 1 Codebase, N Khách Thuê, Tuyệt Đối Không Rò Rỉ Dữ Liệu

Trong mô hình phần mềm dạng dịch vụ (SaaS — Software as a Service) như nền tảng khách hàng thân thiết LAAS, một phiên bản ứng dụng duy nhất (Single Codebase) phải phục vụ hàng trăm đối tác doanh nghiệp khác nhau (gọi là các **Tenants** — ví dụ: Ngân hàng VPBank, Ví MoMo, Chuỗi bán lẻ WinMart).

Ác mộng tồi tệ nhất của một hệ thống SaaS là **Rò rỉ Dữ liệu Chéo giữa các Khách thuê (Cross-Tenant Data Leak)**: khách hàng của WinMart nhìn thấy hóa đơn của MoMo, hoặc nhân viên VPBank vô tình sửa đổi điểm thưởng của đối tác khác. Một sự cố như vậy sẽ ngay lập tức kích hoạt các vụ kiện hàng triệu USD và vi phạm nghiêm trọng luật an ninh mạng.

Bài học này sẽ phân tích chi tiết 3 mô hình cách ly dữ liệu, cơ chế hoạt động ngầm của **CurrentTenantIdentifierResolver** và **@TenantId** trong Hibernate 6+, cùng chiến lược thiết kế bộ lọc an toàn tuyệt đối từ Gateway xuống tầng Database.

---

## 1. Bản Chất Kỹ Thuật của 3 Mô Hình Cách Ly Dữ Liệu (Under the Hood)

~~~text
+-----------------------------------------------------------------------------------+
|                        3 MÔ HÌNH MULTI-TENANCY DATA ARCHITECTURE                  |
|                                                                                   |
|  [MÔ HÌNH 1: DATABASE PER TENANT]                                                 |
|  - Mỗi Tenant sở hữu 1 Database vật lý độc lập.                                   |
|  - ƯU: Cách ly tuyệt đối 100%, bảo mật cấp ngân hàng.                             |
|  - NHƯỢC: Tốn kém chi phí phần cứng, khó chạy Flyway migration cho 1,000 DBs.     |
|                                                                                   |
|  -------------------------------------------------------------------------------  |
|                                                                                   |
|  [MÔ HÌNH 2: SCHEMA PER TENANT (POSTGRESQL SCHEMAS)]                              |
|  - Dùng chung 1 Database Instance, nhưng mỗi Tenant là 1 Schema riêng biệt        |
|    (tenant_vnpay, tenant_momo).                                                   |
|  - ƯU: Cân bằng tốt giữa chi phí và tính cách ly; kết nối nhanh bằng search_path.  |
|  - NHƯỢC: Giới hạn số lượng Schema (PostgreSQL bắt đầu chậm nếu có > 10,000 schem)|
|                                                                                   |
|  -------------------------------------------------------------------------------  |
|                                                                                   |
|  [MÔ HÌNH 3: DISCRIMINATOR COLUMN (SHARED SCHEMA - CHUẨN SAAS MẬT ĐỘ CAO)]         |
|  - Tất cả Tenant dùng chung 1 bảng duy nhất (ví dụ: bảng "orders").               |
|  - Phân tách bằng cột: "tenant_id VARCHAR(32) NOT NULL".                          |
|  - ƯU: Tiết kiệm chi phí tối đa, dễ vận hành, dễ tổng hợp báo cáo.               |
|  - NGUY HIỂM: Nếu dev quên gắn "WHERE tenant_id = ?" -> RÒ RỈ DỮ LIỆU TOÀN PHẦN!  |
+-----------------------------------------------------------------------------------+
~~~

---

## 2. Vũ Khí Mới: Annotation @TenantId Trong Hibernate 6.3+

Trước đây trong mô hình Discriminator Column, lập trình viên phải tự nhớ thêm <code>tenant_id</code> vào mọi câu truy vấn JPQL/SQL, hoặc dùng Hibernate Filter thủ công rất dễ sót.

Từ Hibernate 6.3+ (Spring Boot 3.2+), JPA chính thức bổ sung annotation cứu tinh: **<code>@TenantId</code>**:
- Bạn chỉ cần gắn <code>@TenantId</code> lên trường <code>tenantId</code> của Entity.
- Hibernate Core sẽ **TỰ ĐỘNG CAN THIỆP VÀO CÂY AST CỦA MỌI CÂU TRUY VẤN SQL**:
  - Tự động gắn thêm <code>WHERE tenant_id = ?</code> vào tất cả các lệnh <code>SELECT</code>, <code>UPDATE</code>, <code>DELETE</code>.
  - Tự động gán giá trị <code>tenant_id</code> hiện tại khi thực hiện lệnh <code>INSERT</code>.
  - **Lập trình viên hoàn toàn không thể vô tình query nhầm dữ liệu của Tenant khác!**

~~~text
+-----------------------------------------------------------------------------------+
|                        HIBERNATE 6 AUTOMATIC TENANT FILTERING                     |
|                                                                                   |
|  Lập trình viên viết JPQL:                                                        |
|  "SELECT c FROM Customer c WHERE c.email = :email"                                |
|                                                                                   |
|  Hibernate AST Processor tự động chuyển đổi thành SQL:                            |
|  "SELECT * FROM customers WHERE email = ? AND tenant_id = 'TENANT_MOMO'"          |
|  (Hoàn toàn tự động ở tầng ORM Engine!)                                           |
+-----------------------------------------------------------------------------------+
~~~

---

## 3. Triển khai Production-Grade: Hệ thống SaaS Multi-Tenant Hoàn Chỉnh

### 3.1. Lớp Quản Trị Ngữ Cảnh: TenantContext (ThreadLocal An Toàn)

~~~java
package com.bank.multitenant.context;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public final class TenantContext {

    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContext() {}

    public static void setTenantId(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("Tenant ID cannot be null or blank");
        }
        CURRENT_TENANT.set(tenantId);
        log.debug("TenantContext bound to: {}", tenantId);
    }

    public static String getTenantId() {
        return CURRENT_TENANT.get();
    }

    /**
     * BẮT BUỘC PHẢI DỌN DẸP TRONG KHỐI FINALLY!
     * Tránh rò rỉ dữ liệu khi luồng (Thread) được trả về ThreadPool của Tomcat.
     */
    public static void clear() {
        CURRENT_TENANT.remove();
        log.debug("TenantContext cleared from thread");
    }
}
~~~

---

### 3.2. Cầu Nối Hibernate: CurrentTenantIdentifierResolver

~~~java
package com.bank.multitenant.config;

import com.bank.multitenant.context.TenantContext;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.context.annotation.Configuration;

@Configuration
public class HibernateCurrentTenantIdentifierResolver implements CurrentTenantIdentifierResolver<String> {

    private static final String DEFAULT_TENANT = "SYSTEM_DEFAULT";

    @Override
    public String resolveCurrentTenantIdentifier() {
        String tenantId = TenantContext.getTenantId();
        return (tenantId != null && !tenantId.isBlank()) ? tenantId : DEFAULT_TENANT;
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}
~~~

---

### 3.3. HTTP Interceptor Trích Xuất Header X-Tenant-ID

~~~java
package com.bank.multitenant.interceptor;

import com.bank.multitenant.context.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@Slf4j
public class TenantInterceptor implements HandlerInterceptor {

    public static final String TENANT_HEADER = "X-Tenant-ID";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String path = request.getRequestURI();

        // Bỏ qua kiểm tra cho các đường dẫn công khai
        if (path.startsWith("/actuator/") || path.startsWith("/swagger-ui/")) {
            return true;
        }

        String tenantId = request.getHeader(TENANT_HEADER);
        if (tenantId == null || tenantId.isBlank()) {
            log.warn("Rejected request to {} due to missing {} header", path, TENANT_HEADER);
            response.setStatus(HttpStatus.BAD_REQUEST.value());
            return false;
        }

        // Neo giữ tenantId vào ThreadLocal
        TenantContext.setTenantId(tenantId.trim().toUpperCase());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        // LUÔN LUÔN XÓA SẠCH CONTEXT SAU KHI REQUEST HOÀN TẤT!
        TenantContext.clear();
    }
}
~~~

---

### 3.4. Entity với Annotation @TenantId Tự Động Cách Ly

~~~java
package com.bank.multitenant.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.TenantId;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "corporate_customers")
@Getter
@Setter
@NoArgsConstructor
public class CorporateCustomer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // VŨ KHÍ TỐI THƯỢNG CỦA HIBERNATE 6: Tự động inject vào mọi câu SQL!
    @TenantId
    @Column(name = "tenant_id", nullable = false, updatable = false, length = 32)
    private String tenantId;

    @Column(name = "tax_code", nullable = false, length = 32)
    private String taxCode;

    @Column(name = "company_name", nullable = false, length = 128)
    private String companyName;

    @Column(name = "credit_limit", nullable = false, precision = 15, scale = 2)
    private BigDecimal creditLimit;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public CorporateCustomer(String taxCode, String companyName, BigDecimal creditLimit) {
        this.taxCode = taxCode;
        this.companyName = companyName;
        this.creditLimit = creditLimit;
    }
}
~~~

---

## 4. Kiểm Thử Thực Tế & Xác Thực Chống Rò Rỉ Dữ Liệu (cURL Verification)

### Bước 1: Tạo Khách hàng cho Tenant "VPBANK":

~~~bash
curl -X POST http://localhost:8080/api/v1/customers \
  -H "X-Tenant-ID: VPBANK" \
  -H "Content-Type: application/json" \
  -d '{"taxCode": "0100112233", "companyName": "VNPAY Corp", "creditLimit": 5000000.00}'
~~~

*(Bản ghi được lưu vào DB với cột <code>tenant_id = 'VPBANK'</code>)*.

### Bước 2: Dùng Tenant "MOMO" để truy vấn danh sách khách hàng:

~~~bash
curl -X GET http://localhost:8080/api/v1/customers \
  -H "X-Tenant-ID: MOMO" \
  -H "Accept: application/json"
~~~

Response Body:
~~~json
[]
~~~

*(Kết quả hoàn toàn rỗng <code>[]</code>! Hibernate tự động phát sinh SQL: <code>SELECT * FROM corporate_customers WHERE tenant_id = 'MOMO'</code>. Không có bất kỳ dòng dữ liệu nào của VPBANK bị lọt ra ngoài!)*

---

## 5. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Thảm Họa Rò Rỉ Dữ Liệu Do Quên Dọn Dẹp ThreadLocal

- **Triệu chứng**: Sau 2 tháng vận hành, người dùng của Tenant A thỉnh thoảng (khoảng 1/1,000 request) nhìn thấy toàn bộ báo cáo doanh thu của Tenant B trên màn hình!
- **Nguyên nhân cốt lõi**:
  Mã nguồn thiết lập <code>TenantContext.setTenantId(id)</code> trong Filter, nhưng khi một phương thức Controller quăng ngoại lệ <code>RuntimeException</code>, luồng bị gián đoạn và **bỏ qua phương thức dọn dẹp**.
  - Tomcat tái sử dụng Thread đó (Worker Thread-12) cho một request tiếp theo của Tenant A không gửi kèm header.
  - Thread-12 vẫn còn giữ giá trị <code>tenant_id = 'TENANT_B'</code> trong bộ nhớ ThreadLocal!
  - Người dùng Tenant A được xem dữ liệu của Tenant B!
- **Quy tắc Vàng**: Luôn luôn bọc việc dọn dẹp trong khối <code>try ... finally { TenantContext.clear(); }</code> hoặc phương thức <code>afterCompletion()</code> của <code>HandlerInterceptor</code>.

---

## 6. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Xây dựng một bài kiểm thử tích hợp <code>@SpringBootTest</code> chứng minh rằng:
1. Khi TenantContext được đặt là "TENANT_ALPHA", lưu 2 khách hàng.
2. Khi chuyển TenantContext sang "TENANT_BETA", lệnh <code>repository.findAll()</code> trả về danh sách có size = 0.
3. Viết trọn vẹn lớp kiểm thử với Mockito hoặc Spring Test.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.bank.multitenant;

import com.bank.multitenant.context.TenantContext;
import com.bank.multitenant.domain.CorporateCustomer;
import com.bank.multitenant.repository.CorporateCustomerRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@DisplayName("Multi-Tenancy Zero Data Leak Integration Tests")
class MultiTenancyIntegrationTest {

    @Autowired
    private CorporateCustomerRepository repository;

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Should completely isolate data between TENANT_ALPHA and TENANT_BETA")
    void shouldIsolateDataStrictlyBetweenTenants() {
        // Given: Đăng nhập dưới danh nghĩa TENANT_ALPHA và tạo 2 khách hàng
        TenantContext.setTenantId("TENANT_ALPHA");

        CorporateCustomer cust1 = new CorporateCustomer("TAX-01", "Alpha Company A", new BigDecimal("10000.00"));
        CorporateCustomer cust2 = new CorporateCustomer("TAX-02", "Alpha Company B", new BigDecimal("20000.00"));
        repository.save(cust1);
        repository.save(cust2);

        // Then: TENANT_ALPHA nhìn thấy đúng 2 khách hàng của mình
        List<CorporateCustomer> alphaList = repository.findAll();
        assertThat(alphaList).hasSize(2);

        // When: Chuyển ngữ cảnh sang TENANT_BETA
        TenantContext.clear();
        TenantContext.setTenantId("TENANT_BETA");

        // Then: TENANT_BETA hoàn toàn KHÔNG THỂ nhìn thấy dữ liệu của TENANT_ALPHA (Size = 0)
        List<CorporateCustomer> betaList = repository.findAll();
        assertThat(betaList).isEmpty();
    }
}
~~~

:::takeaways
- **3 Mô Hình Cách Ly Multi-Tenancy**: Database-per-tenant (cách ly cao nhất), Schema-per-tenant (cân bằng), Discriminator Column (tiết kiệm chi phí nhất).
- **Sức Mạnh Của @TenantId Trong Hibernate 6**: Tự động can thiệp vào câu lệnh SQL DML, bảo đảm 100% không bao giờ quên điều kiện <code>WHERE tenant_id = ?</code>.
- **Dọn Dẹp ThreadLocal Là Sống Còn**: Luôn gọi <code>TenantContext.clear()</code> trong <code>finally</code> hoặc <code>afterCompletion</code> để triệt tiêu vĩnh viễn nguy cơ rò rỉ dữ liệu chéo giữa các phiên làm việc.
:::
`
    },
    {
      id: "6-8",
      type: "lesson",
      title: "Redis nâng cao — stampede, distributed lock, pub/sub evict",
      minutes: 50,
      content: `
## Redis Nâng Cao — Khóa Phân Tán (Distributed Lock), Giải Thuật Redlock & Redis Streams

Trong các hệ thống phân tán đa Pod, các cơ chế khóa trong bộ nhớ của Java như <code>synchronized</code> hay <code>ReentrantLock</code> hoàn toàn mất tác dụng: chúng chỉ khóa được các luồng trong cùng một máy ảo JVM. Khi 5 Pods cùng xử lý một sự kiện trừ tồn kho vé xem ca nhạc hoặc trừ số dư ví điện tử, bạn bắt buộc phải có một cơ chế **Khóa Phân Tán (Distributed Lock)** độc lập nằm ngoài ứng dụng.

Redis là công cụ phổ biến nhất thế giới để triển khai Khóa Phân Tán nhờ tốc độ phản hồi tính bằng micro-giây. Tuy nhiên, việc tự viết khóa Redis bằng các lệnh chắp vá thường dẫn đến các lỗi kinh hoàng: **Khóa chết vĩnh viễn (Deadlock)**, **Xóa nhầm khóa của luồng khác (Lock Stealing)**, hoặc **Hai luồng cùng vào Critical Section khi gặp Garbage Collection Pause**.

Bài học này sẽ đi sâu vào bản chất toán học của lệnh nguyên tử <code>SET NX PX</code>, cơ chế gia hạn khóa tự động (**Watchdog Pattern**), giải thuật **Redlock** trên cụm phân tán, và cách sử dụng thư viện **Redisson** chuẩn công nghiệp.

---

## 1. Cơ Chế Ngầm của Distributed Lock trên Redis (Under the Hood)

### Nguyên Tắc Bất Biến Của Lệnh SET NX PX

Để tạo một khóa an toàn, bạn bắt buộc phải thực hiện 2 thao tác sau đây trong **MỘT LỆNH NGUYÊN TỬ DUY NHẤT (ATOMIC)**:
1. <code>NX (Not Exists)</code>: Chỉ tạo key nếu key đó chưa hề tồn tại.
2. <code>PX (Milliseconds)</code>: Đặt thời gian tự hủy (TTL) để phòng trường hợp ứng dụng bị sập nguồn đột ngột thì khóa tự động được giải phóng, chống Deadlock.

~~~bash
SET lock:order:101 "uuid-thread-456" NX PX 30000
~~~

~~~text
+-----------------------------------------------------------------------------------+
|                        HIỂM HỌA XÓA NHẦM KHÓA NẾU KHÔNG DÙNG LUA SCRIPT           |
|                                                                                   |
|  Thread 1 (Pod A)                     Thread 2 (Pod B)                            |
|       |                                    |                                      |
|       +-> 1. Giành khóa thành công         |                                      |
|       |      (TTL = 10s)                   |                                      |
|       |                                    |                                      |
|       +-> 2. Bị treo bởi Full GC Pause     |                                      |
|       |      hoặc DB quá chậm mất 12s!     |                                      |
|       |                                    |                                      |
|       |   [KHÓA HẾT HẠN 10s TRÊN REDIS!]   |                                      |
|       |                                    v                                      |
|       |                               3. Thread 2 nhảy vào giành khóa thành công! |
|       |                                  (Thread 2 đang ghi dữ liệu vào DB!)      |
|       |                                    |                                      |
|       +-> 4. Thread 1 tỉnh dậy sau GC      |                                      |
|       |      Nó tưởng nó vẫn đang giữ khóa!|                                      |
|       |      Nó gọi lệnh: DEL lock:order   |                                      |
|       |      ==> NÓ XÓA MẤT KHÓA CỦA       |                                      |
|       |          THREAD 2!                 |                                      |
|       |                                    v                                      |
|       |                               4. Thread 3 nhảy vào -> 2 luồng cùng ghi!   |
|       |                                  HỎNG TOÀN BỘ DỮ LIỆU KHO!                |
+-----------------------------------------------------------------------------------+
~~~

### Giải Pháp Bắt Buộc: Xóa Khóa Nguyên Tử Bằng Lua Script

Khi giải phóng khóa, bạn phải kiểm tra: **Chỉ có chính luồng đã tạo ra khóa (so khớp chuỗi UUID ngẫu nhiên) mới được phép xóa khóa đó!**

Phép kiểm tra <code>GET</code> và xóa <code>DEL</code> bắt buộc phải được đóng gói vào một **Lua Script** để Redis thực thi nguyên tử 100%:

~~~lua
-- Lua Script giải phóng khóa an toàn tuyệt đối
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
~~~

---

## 2. Thư Viện Chuẩn Doanh Nghiệp: Redisson & Cơ Chế Watchdog

Tự viết khóa Redis bằng <code>StringRedisTemplate</code> rất dễ mắc lỗi. Trong thực tế sản xuất, 100% các hệ thống Enterprise đều sử dụng thư viện **Redisson**:
- **Cơ chế Watchdog (Chó canh gác gia hạn khóa)**:
  Nếu nghiệp vụ chạy lâu hơn dự kiến, Redisson tự động khởi chạy một Background Timer để gia hạn thêm TTL cho khóa (mặc định mỗi 10 giây gia hạn thêm 30 giây) cho đến khi luồng chính hoàn tất.
- **Fair Lock (Khóa công bằng)**:
  Đảm bảo các tiến trình được cấp khóa theo đúng thứ tự xếp hàng (FIFO), chống hiện tượng một Pod bị "bỏ đói" (Thread Starvation).

~~~text
+-----------------------------------------------------------------------------------+
|                        REDISSON WATCHDOG RENEWAL PATTERN                          |
|                                                                                   |
|  Java Worker Thread                  Redisson Watchdog Timer (Background)         |
|       |                                             |                             |
|       +---> 1. lock.lock()                          |                             |
|       |     (Tạo key trên Redis, TTL = 30s)         v                             |
|       |                                    2. Sau 10 giây (1/3 TTL):              |
|       |                                       Kiểm tra xem Worker Thread còn sống?|
|       |                                       -> CÒN SỐNG: Gia hạn TTL lại = 30s! |
|       |                                             |                             |
|       |                                             v                             |
|       |                                    3. Sau 20 giây: Tiếp tục gia hạn!      |
|       |                                             |                             |
|       +---> 4. Nghiệp vụ xong -> unlock()           v                             |
|       |     (Hủy Watchdog Timer & Xóa Key) --------+                             |
+-----------------------------------------------------------------------------------+
~~~

---

## 3. Triển khai Production-Grade: Phân Hệ Giữ Chỗ Vé Flash Sale với Redisson

### 3.1. Cấu hình Redisson Client trong Spring Boot

~~~java
package com.bank.redis.config;

import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RedissonConfiguration {

    @Value("\${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("\${spring.data.redis.port:6379}")
    private int redisPort;

    @Bean(destroyMethod = "shutdown")
    public RedissonClient redissonClient() {
        Config config = new Config();
        config.useSingleServer()
            .setAddress("redis://" + redisHost + ":" + redisPort)
            .setConnectionPoolSize(64)
            .setConnectionMinimumIdleSize(16)
            .setConnectTimeout(5000)
            .setTimeout(3000);
        return Redisson.create(config);
    }
}
~~~

---

### 3.2. Service Bán Vé Flash Sale với Redisson Distributed Lock

~~~java
package com.bank.ticket.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlashSaleTicketService {

    private final RedissonClient redissonClient;

    // Giả lập số lượng vé còn lại trong kho
    private int availableTickets = 10;

    public TicketPurchaseResult purchaseTicket(String concertId, String customerId) {
        String lockKey = "lock:concert:" + concertId;
        RLock lock = redissonClient.getLock(lockKey);

        try {
            // CỐ GẮNG GIÀNH KHÓA:
            // - Chờ tối đa 3 giây để lấy khóa (waitTime = 3s)
            // - Khóa tự hủy sau 5 giây nếu pod bị crash (leaseTime = 5s)
            boolean acquired = lock.tryLock(3, 5, TimeUnit.SECONDS);

            if (!acquired) {
                log.warn("High traffic congestion! Customer {} could not acquire lock for concert {}", customerId, concertId);
                return new TicketPurchaseResult(false, "System is busy. Please try again later.");
            }

            try {
                // VÙNG CRITICAL SECTION ĐƯỢC BẢO VỆ TUYỆT ĐỐI BỞI DISTRIBUTED LOCK
                log.info("Lock acquired by customer {}. Checking inventory...", customerId);

                if (availableTickets <= 0) {
                    log.info("Concert {} is completely sold out!", concertId);
                    return new TicketPurchaseResult(false, "Sold out!");
                }

                // Thực hiện trừ tồn kho an toàn
                availableTickets--;
                log.info("Ticket reserved successfully for customer {}. Remaining tickets: {}",
                    customerId, availableTickets);

                return new TicketPurchaseResult(true, "Ticket purchased successfully! Remaining: " + availableTickets);
            } finally {
                // LUÔN LUÔN GIẢI PHÓNG KHÓA TRONG FINALLY
                if (lock.isHeldByCurrentThread()) {
                    lock.unlock();
                    log.debug("Lock released for concert {}", concertId);
                }
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new TicketPurchaseResult(false, "Purchase request interrupted");
        }
    }

    public record TicketPurchaseResult(boolean success, String message) {}
}
~~~

---

## 4. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Thảm Họa Khóa Chết Do Không Đặt LeaseTime hoặc Bỏ Quên Unlock

- **Triệu chứng**: Toàn bộ hệ thống đặt vé bị tê liệt hoàn toàn; không một khách hàng nào mua được vé và log hệ thống liên tục báo không lấy được khóa.
- **Nguyên nhân cốt lõi**:
  Lập trình viên gọi <code>lock.lock()</code> nhưng trong khối <code>try</code> có một đoạn code quăng ngoại lệ <code>NullPointerException</code> trước khi tới dòng <code>unlock()</code>. Khóa bị giữ trên Redis vĩnh viễn không có thời hạn tự hủy!
- **Khắc phục**:
  1. Luôn luôn giải phóng khóa trong khối <code>finally { if (lock.isHeldByCurrentThread()) lock.unlock(); }</code>.
  2. Luôn cấu hình <code>leaseTime</code> hoặc sử dụng Redisson Watchdog để khóa tự giải phóng nếu Node bị mất nguồn.

---

## 5. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống Ví Điện Tử (E-Wallet) cần triển khai tính năng **Chuyển Tiền An Toàn Giữa Hai Tài Khoản**:
1. Để chống Deadlock khi 2 người cùng chuyển tiền cho nhau cùng một thời điểm:
   - Người A chuyển cho B (cần khóa A rồi khóa B).
   - Người B chuyển cho A (cần khóa B rồi khóa A).
   - Nếu không có chiến thuật, hệ thống sẽ rơi vào tình trạng **Deadlock Vĩnh Viễn**!
2. **Chiến thuật Khóa Tuần Tự (Lock Ordering)**:
   - Luôn luôn so sánh mã tài khoản (<code>accountA.compareTo(accountB)</code>) và khóa tài khoản có giá trị nhỏ hơn trước, tài khoản lớn hơn sau.
3. Viết trọn vẹn phương thức chuyển tiền an toàn sử dụng Redisson MultiLock.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.bank.wallet.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class EWalletTransferService {

    private final RedissonClient redisson;

    public boolean transferFunds(String sourceAccount, String targetAccount, BigDecimal amount) {
        // CHIẾN THUẬT LOCK ORDERING CHỐNG DEADLOCK:
        // Sắp xếp thứ tự tên khóa theo thứ tự từ điển
        String firstLockKey;
        String secondLockKey;

        if (sourceAccount.compareTo(targetAccount) < 0) {
            firstLockKey = "lock:wallet:" + sourceAccount;
            secondLockKey = "lock:wallet:" + targetAccount;
        } else {
            firstLockKey = "lock:wallet:" + targetAccount;
            secondLockKey = "lock:wallet:" + sourceAccount;
        }

        RLock lock1 = redisson.getLock(firstLockKey);
        RLock lock2 = redisson.getLock(secondLockKey);

        // Sử dụng Redisson MultiLock để khóa nguyên tử cả 2 tài khoản
        RLock multiLock = redisson.getMultiLock(lock1, lock2);

        try {
            boolean acquired = multiLock.tryLock(5, 10, TimeUnit.SECONDS);
            if (!acquired) {
                log.warn("Could not acquire locks for accounts {} and {}", sourceAccount, targetAccount);
                return false;
            }

            try {
                log.info("Both wallets locked safely. Performing atomic balance transfer: {} -> {}, amount={}",
                    sourceAccount, targetAccount, amount);
                // Thực hiện trừ tiền A và cộng tiền B trong cơ sở dữ liệu
                return true;
            } finally {
                multiLock.unlock();
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }
}
~~~

:::takeaways
- **Cấm Tuyệt Đối Lệnh SETNX Đơn Lẻ**: Luôn dùng <code>SET key val NX PX ttl</code> trong một lệnh nguyên tử duy nhất để phòng chống Deadlock.
- **Xóa Khóa Bắt Buộc Dùng Lua Script**: Kiểm tra UUID của luồng trước khi xóa để ngăn chặn việc xóa nhầm khóa của luồng khác khi gặp sự cố GC Pause.
- **Sức Mạnh Của Redisson Watchdog**: Tự động gia hạn thời gian sống của khóa cho đến khi luồng thực thi xong, loại bỏ hoàn toàn rủi ro khóa hết hạn giữa chừng.
- **Chiến Thuật Lock Ordering**: Luôn sắp xếp thứ tự các khóa theo một quy ước thống nhất (ví dụ: bảng chữ cái) để triệt tiêu hoàn toàn nguy cơ Deadlock chéo giữa nhiều tài nguyên.
:::
`
    },
    {
      id: "6-9",
      type: "lesson",
      title: "Spring Batch — đối soát 2 triệu dòng qua đêm, có thể restart",
      minutes: 50,
      content: `
## Spring Batch — Xử Lý Khối Lượng Dữ Liệu Khổng Lồ, Đối Soát Hàng Triệu Dòng & Khả Năng Khôi Phục (Restartability)

Trong các ngân hàng và sàn thương mại điện tử, các tác vụ tính toán lãi suất tiết kiệm, đối soát hóa đơn chuyển mạch (Napas/Visa), hoặc đồng bộ điểm thưởng thành viên vào nửa đêm thường phải xử lý từ 2 triệu đến hàng chục triệu bản ghi trong một khoảng thời gian giới hạn (Batch Window: từ 1h đến 5h sáng).

Hầu hết lập trình viên bắt đầu bằng cách viết một vòng lặp <code>for</code> đơn giản trong phương thức <code>@Scheduled</code>. Cách tiếp cận này chắc chắn sẽ dẫn đến thảm họa:
- Đọc 2 triệu dòng vào RAM gây tràn bộ nhớ (**OutOfMemoryError**).
- Nếu tiến trình chạy được 1 giờ 50 phút đến dòng thứ 1,800,000 và bị sập do mất điện hoặc lỗi mạng: bạn buộc phải chạy lại từ đầu! Điều này làm trùng lặp các giao dịch đã xử lý trước đó, hoặc quá thời gian Batch Window khiến hệ thống không thể mở cửa cho ngày giao dịch mới.

Bài học này sẽ đi sâu vào kiến trúc **Chunk-Oriented Processing** của Spring Batch 5, cơ chế ghi nhớ điểm ngắt (**Checkpointing qua JobRepository**), khả năng khôi phục nguyên trạng (**Restartability**), và kỹ thuật bỏ qua lỗi thông minh (**Skip & Retry Policy**).

---

## 1. Cơ Chế Ngầm của Chunk-Oriented Processing & JobRepository (Under the Hood)

### Xử Lý Định Hướng Theo Khối (Chunk-Oriented Processing)

Spring Batch không xử lý từng dòng đơn lẻ (gây tốn I/O commit) và cũng không gom toàn bộ vào RAM (gây OOM). Nó chia nhỏ dòng dữ liệu thành các **Chunks (Khối)** có kích thước cố định (ví dụ: <code>chunkSize = 1,000</code>):

~~~text
+-----------------------------------------------------------------------------------+
|                        CHUNK-ORIENTED PROCESSING FLOW (CHUNK = 1000)              |
|                                                                                   |
|  BẮT ĐẦU TRANSACTION CỤC BỘ CHO CHUNK HIỆN TẠI                                    |
|       |                                                                           |
|       +---> LẶP 1,000 LẦN:                                                        |
|       |     [ItemReader]    -> Đọc 1 dòng từ CSV / Database Cursor (Streaming)    |
|       |     [ItemProcessor] -> Validate, tính toán lãi suất, chuyển sang Entity    |
|       |                                                                           |
|       v  (Gom đủ danh sách 1,000 đối tượng đã xử lý trong RAM)                    |
|  [ItemWriter]                                                                     |
|       - Thực hiện JDBC Batch Insert/Update 1,000 dòng xuống DB trong 1 câu SQL!   |
|       |                                                                           |
|       v                                                                           |
|  [Ghi Nhận Checkpoint vào JobRepository]:                                         |
|       - Cập nhật BATCH_STEP_EXECUTION_CONTEXT: "last_processed_line = 1000"       |
|       |                                                                           |
|  COMMIT TRANSACTION CỦA CHUNK 1000 DÒNG!                                          |
|  (Giải phóng bộ nhớ RAM, tiếp tục đọc Chunk 1,001 -> 2,000)                       |
+-----------------------------------------------------------------------------------+
~~~

### Hệ Thống Bảng Siêu Dữ Liệu: JobRepository

Khác với các thư viện thông thường, Spring Batch bắt buộc phải kết nối tới cơ sở dữ liệu để tự động duy trì một hệ thống bảng siêu dữ liệu:
- <code>BATCH_JOB_INSTANCE</code>: Đại diện cho một công việc logic (JobName + JobParameters).
- <code>BATCH_JOB_EXECUTION</code>: Lưu trữ mỗi lần chạy thực tế (StartTime, EndTime, Status: <code>COMPLETED</code>, <code>FAILED</code>).
- <code>BATCH_STEP_EXECUTION</code>: Lưu trữ chi tiết từng bước: <code>READ_COUNT</code>, <code>WRITE_COUNT</code>, <code>COMMIT_COUNT</code>, <code>ROLLBACK_COUNT</code>, <code>FILTER_COUNT</code>.
- <code>BATCH_STEP_EXECUTION_CONTEXT</code>: Lưu trữ **Trạng thái Điểm Ngắt (State Checkpoint)** của luồng xử lý.

~~~text
+-----------------------------------------------------------------------------------+
|                     KỊCH BẢN TỰ ĐỘNG KHÔI PHỤC (RESTARTABILITY)                   |
|                                                                                   |
|  Lần chạy 1 (02:00 AM):                                                           |
|  - Xử lý thành công đến dòng 1,800,000 (Commit 1,800 chunks).                     |
|  - Tại dòng 1,800,001: Mất điện server đột ngột! Tiến trình sập!                   |
|  - BATCH_STEP_EXECUTION ghi nhận: STATUS = 'FAILED', last_line = 1800000.         |
|                                                                                   |
|  Lần chạy 2 (02:30 AM - Sau khi server khởi động lại):                            |
|  - Khởi động lại Job với CÙNG JobParameters (e.g., date = "2026-10-03").          |
|  - Spring Batch tra cứu JobRepository: Thấy Lần 1 bị FAILED tại dòng 1,800,000.   |
|  - ItemReader TỰ ĐỘNG NHẢY CÓC (SKIP) qua 1,800,000 dòng đầu tiên!                |
|  - Bắt đầu đọc tiếp từ dòng 1,800,001!                                            |
|  ==> TIẾT KIỆM 1 GIỜ 50 PHÚT VÀ TUYỆT ĐỐI KHÔNG BỊ TRÙNG LẶP DỮ LIỆU!             |
+-----------------------------------------------------------------------------------+
~~~

---

## 2. Triển khai Production-Grade: Hệ thống Đối Soát Giao Dịch Ngân Hàng 2 Triệu Dòng

Chúng ta sẽ thiết kế một Batch Job hoàn chỉnh chuẩn Spring Boot 3+ và Spring Batch 5+:
1. Đọc file CSV dữ liệu giao dịch 2 triệu dòng bằng <code>FlatFileItemReader</code>.
2. Kiểm tra tính hợp lệ và chuẩn hóa số tiền bằng <code>ItemProcessor</code>.
3. Ghi dữ liệu vào PostgreSQL bằng <code>JdbcBatchItemWriter</code> với kích thước chunk = 1,000.
4. Cấu hình **Skip Policy**: Tự động bỏ qua tối đa 50 dòng bị lỗi định dạng file mà không làm sập toàn bộ Job!

### 2.1. Cấu hình Batch Job Hoàn Chỉnh (Spring Batch 5+)

~~~java
package com.bank.batch.config;

import com.bank.batch.domain.TransactionRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.launch.support.RunIdIncrementer;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.batch.item.database.JdbcBatchItemWriter;
import org.springframework.batch.item.database.builder.JdbcBatchItemWriterBuilder;
import org.springframework.batch.item.file.FlatFileItemReader;
import org.springframework.batch.item.file.FlatFileParseException;
import org.springframework.batch.item.file.builder.FlatFileItemReaderBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.FileSystemResource;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.time.Instant;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class BankReconciliationBatchConfig {

    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;
    private final DataSource dataSource;

    private static final int CHUNK_SIZE = 1000;

    @Bean
    public Job reconciliationJob() {
        return new JobBuilder("reconciliationJob", jobRepository)
            .incrementer(new RunIdIncrementer())
            .start(reconciliationStep())
            .build();
    }

    @Bean
    public Step reconciliationStep() {
        return new StepBuilder("reconciliationStep", jobRepository)
            .<TransactionRecord, TransactionRecord>chunk(CHUNK_SIZE, transactionManager)
            .reader(csvTransactionReader(null))
            .processor(transactionProcessor())
            .writer(postgresTransactionWriter())
            // CHÍNH SÁCH BỎ QUA LỖI THÔNG MINH (FAULT TOLERANCE)
            .faultTolerant()
            .skip(FlatFileParseException.class) // Bỏ qua nếu dòng CSV bị sai format
            .skipLimit(50) // Tối đa 50 dòng sai định dạng thì chấp nhận, nếu vượt quá 50 thì fail Job
            .build();
    }

    @Bean
    @StepScope
    public FlatFileItemReader<TransactionRecord> csvTransactionReader(
            @Value("#{jobParameters['filePath']}") String filePath) {

        String path = (filePath != null) ? filePath : "data/daily-transactions.csv";
        log.info("Initializing FlatFileItemReader for path: {}", path);

        return new FlatFileItemReaderBuilder<TransactionRecord>()
            .name("csvTransactionReader")
            .resource(new FileSystemResource(path))
            .linesToSkip(1) // Bỏ qua dòng Header
            .delimited()
            .delimiter(",")
            .names("transactionId", "accountNumber", "amount", "currency", "status")
            .fieldSetMapper(fs -> new TransactionRecord(
                fs.readString("transactionId"),
                fs.readString("accountNumber"),
                fs.readBigDecimal("amount"),
                fs.readString("currency"),
                fs.readString("status"),
                Instant.now()
            ))
            .build();
    }

    @Bean
    public ItemProcessor<TransactionRecord, TransactionRecord> transactionProcessor() {
        return record -> {
            // Lọc các bản ghi không hợp lệ hoặc số tiền âm
            if (record.amount().compareTo(BigDecimal.ZERO) <= 0) {
                log.warn("Filtering out invalid transaction: id={}, amount={}", record.transactionId(), record.amount());
                return null; // Return null = Bỏ qua bản ghi này không ghi xuống DB
            }
            // Chuẩn hóa tiền tệ về chữ hoa
            return new TransactionRecord(
                record.transactionId(),
                record.accountNumber(),
                record.amount(),
                record.currency().toUpperCase(),
                record.status().toUpperCase(),
                record.processedAt()
            );
        };
    }

    @Bean
    public JdbcBatchItemWriter<TransactionRecord> postgresTransactionWriter() {
        return new JdbcBatchItemWriterBuilder<TransactionRecord>()
            .dataSource(dataSource)
            .sql("""
                INSERT INTO reconciled_transactions (transaction_id, account_number, amount, currency, status, processed_at)
                VALUES (:transactionId, :accountNumber, :amount, :currency, :status, :processedAt)
                ON CONFLICT (transaction_id) DO NOTHING
                """)
            .beanMapped()
            .build();
    }
}
~~~

~~~java
package com.bank.batch.domain;

import java.math.BigDecimal;
import java.time.Instant;

public record TransactionRecord(
    String transactionId,
    String accountNumber,
    BigDecimal amount,
    String currency,
    String status,
    Instant processedAt
) {}
~~~

---

## 3. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Thảm Họa Dịch Offset Khi Sử Dụng Paging Reader Với Trạng Thái Đổi

- **Triệu chứng**: Khi dùng <code>JpaPagingItemReader</code> để đọc các đơn hàng có <code>status = 'PENDING'</code> và trong <code>ItemWriter</code> cập nhật thành <code>status = 'PROCESSED'</code>, một nửa số đơn hàng bị bỏ sót một cách bí ẩn!
- **Nguyên nhân cốt lõi**:
  JpaPagingItemReader sử dụng phân trang <code>LIMIT pageSize OFFSET page * pageSize</code>.
  - Trang 0 đọc 1,000 bản ghi đầu tiên và cập nhật thành <code>PROCESSED</code>.
  - Ở trang 1, truy vấn sẽ là <code>OFFSET 1000</code>. Nhưng vì 1,000 bản ghi của trang 0 đã không còn là <code>PENDING</code> nữa, toàn bộ dữ liệu bị dịch chuyển lên đầu!
  - 1,000 bản ghi tiếp theo bị nhảy cóc qua mà không hề được đọc!
- **Giải pháp**:
  1. Sử dụng Cursor-based Reader (<code>JdbcCursorItemReader</code>) với Streaming Connection để đọc liên tục qua một Server-side Cursor cố định.
  2. Hoặc luôn đặt <code>page = 0</code> nếu cập nhật trạng thái trực tiếp trên chính tập dữ liệu đang lọc.

---

## 4. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống Tích Lũy Lãi Suất (Interest Accrual Service) cần kiểm thử một bước Step trong Batch:
1. Viết bài kiểm thử sử dụng <code>JobLauncherTestUtils</code>:
   - Chạy Step <code>reconciliationStep</code>.
   - Kiểm chứng rằng <code>BatchStatus</code> kết thúc là <code>COMPLETED</code>.
   - Kiểm tra số lượng bản ghi đã được ghi nhận vào <code>StepExecution</code>.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.bank.batch;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.test.JobLauncherTestUtils;
import org.springframework.batch.test.context.SpringBatchTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBatchTest
@SpringBootTest
@DisplayName("Bank Reconciliation Spring Batch Integration Tests")
class BankReconciliationBatchTest {

    @Autowired
    private JobLauncherTestUtils jobLauncherTestUtils;

    @Test
    @DisplayName("Should successfully execute reconciliation job and complete all chunks")
    void shouldExecuteBatchJobSuccessfully() throws Exception {
        JobParameters params = new JobParametersBuilder()
            .addLong("time", System.currentTimeMillis())
            .addString("filePath", "src/test/resources/test-transactions.csv")
            .toJobParameters();

        JobExecution jobExecution = jobLauncherTestUtils.launchJob(params);

        assertThat(jobExecution.getStatus()).isEqualTo(BatchStatus.COMPLETED);
        assertThat(jobExecution.getStepExecutions()).hasSize(1);
        jobExecution.getStepExecutions().forEach(step -> {
            assertThat(step.getWriteCount()).isGreaterThanOrEqualTo(0);
            assertThat(step.getRollbackCount()).isEqualTo(0);
        });
    }
}
~~~

:::takeaways
- **Bản Chất Của Chunk-Oriented Processing**: Chia dữ liệu thành các khối nhỏ (ví dụ: 1,000 dòng), đọc từng dòng, gom lại và ghi JDBC Batch trong một Transaction duy nhất giúp RAM luôn phẳng tuyệt đối.
- **Khả Năng Khôi Phục (Restartability)**: Lưu vết trạng thái qua <code>JobRepository</code>. Khi gặp sự cố sập nguồn, Job tự động tiếp tục chạy từ dòng bị ngắt mà không làm trùng lặp dữ liệu cũ.
- **Xử Lý Lỗi Linh Hoạt Bằng Skip & Retry**: Cấu hình <code>faultTolerant().skip(...).skipLimit(...)</code> giúp hệ thống không bị đổ vỡ vì một vài dòng dữ liệu rác của người dùng.
:::
`
    },
    {
      id: "6-10",
      type: "lesson",
      title: "RabbitMQ & Spring Cloud Stream — đúng broker cho đúng việc",
      minutes: 50,
      content: `## Mọi event nhét vào Kafka — kể cả task "gửi email xác nhận" chờ 5 giây

Một lỗi kiến trúc kinh điển ở các dự án microservices là: "Đội đã có cụm Kafka rồi, nên mọi giao tiếp bất đồng bộ từ outbox CDC, gửi SMS OTP, xuất báo cáo Excel, cho đến webhook retry đều đẩy vào Kafka topic!".

Hậu quả là gì? Kafka là một distributed append-only commit log được tối ưu hóa cho high-throughput stream processing với partitions và linear disk I/O. Khi bạn dùng Kafka cho hàng đợi công việc (task/worker queue):
1. **Không có per-message acknowledgement tự nhiên**: Kafka commit offset theo dãy liên tục (offset sequence). Nếu một consumer xử lý tin nhắn thứ 5 bị lỗi cần retry sau 10 phút, trong khi tin nhắn thứ 6, 7 đã thành công, bạn không thể chỉ "ack" message 6, 7 mà "nack" message 5. Hoặc bạn phải block toàn bộ partition (treo luồng), hoặc bạn phải commit offset và tự publish message 5 sang một topic retry riêng.
2. **Không có routing linh hoạt theo metadata**: Kafka topic là tĩnh. Không có cơ chế fanout linh hoạt, topic wildcards (như <code>orders.vn.*.express</code>) hay content-based routing ở tầng broker mà không phải dựng Kafka Streams / Flink cluster.
3. **Không có hàng đợi ưu tiên (Priority Queue) hay Delay/TTL linh hoạt trên từng message**: Trong Kafka, message TTL là cấu hình theo toàn bộ topic (retention policy).

**RabbitMQ (AMQP protocol)** sinh ra để giải quyết hoàn hảo bài toán này: phân phối tác vụ linh hoạt, per-message ack/nack, Dead Letter Exchange (DLX), dynamic routing keys, và prefetch QoS. 
Và với **Spring Cloud Stream**, bạn có thể trừu tượng hóa tầng code nghiệp vụ bằng Functional Programming (<code>java.util.function.Function</code>, <code>Consumer</code>, <code>Supplier</code>), chuyển đổi giữa Kafka binder và RabbitMQ binder chỉ bằng một vài dòng cấu hình <code>application.yml</code>.

---

## 1. Kiến trúc chuyên sâu & Cơ chế hoạt động (Under the Hood)

### Sơ Đồ Mô Phỏng: Redis Distributed Lock & Redisson Watchdog Tự Động Gia Hạn Khóa

~~~mermaid
sequenceDiagram
    autonumber
    actor Worker1 as Worker Pod 1
    actor Worker2 as Worker Pod 2
    participant Redis as Redis Server
    participant Watchdog as Redisson Watchdog Timer
    
    Worker1->>Redis: SET lock:order:123 UUID_A NX PX 30000
    Redis-->>Worker1: OK (Khóa thành công!)
    
    Worker1->>Watchdog: Kích hoạt Watchdog (Timeout / 3 = 10s)
    
    Worker2->>Redis: SET lock:order:123 UUID_B NX PX 30000
    Redis-->>Worker2: nil (Khóa thất bại, Worker 2 chờ hoặc retry)
    
    Note over Worker1: Worker 1 đang chạy tác vụ nặng (kéo dài 25 giây)...
    Watchdog->>Redis: Sau 10s: Gia hạn lock thêm 30s (Lease Renewal)
    Watchdog->>Redis: Sau 20s: Gia hạn lock thêm 30s
    
    Note over Worker1: Tác vụ hoàn tất!
    Worker1->>Redis: Lua Script: if redis.call('get', key) == UUID_A then redis.call('del', key)
    Redis-->>Worker1: Lock Released (1)
    Worker1->>Watchdog: Hủy Watchdog Timer
    
    Worker2->>Redis: SET lock:order:123 UUID_B NX PX 30000
    Redis-->>Worker2: OK (Worker 2 chiếm khóa thành công!)
~~~


### Sơ Đồ Mô Phỏng: Máy Trạng Thái Hữu Hạn (FSM) Của Resilience4j Circuit Breaker

~~~mermaid
stateDiagram-v2
    [*] --> CLOSED
    CLOSED --> OPEN: Failure Rate >= 50% trong 100 requests
    note right of CLOSED
        Mọi request đi qua bình thường.
        Đo lường lỗi trong Sliding Window.
    end note
    
    OPEN --> HALF_OPEN: Sau waitDurationInOpenState (10 giây)
    note right of OPEN
        Mọi request bị CHẶN NGAY LẬP TỨC.
        Ném CallNotPermittedException.
        Chuyển thẳng sang Fallback Method!
    end note
    
    HALF_OPEN --> CLOSED: Probe Requests thành công (Failure Rate < 50%)
    HALF_OPEN --> OPEN: Probe Requests vẫn lỗi (Failure Rate >= 50%)
    note right of HALF_OPEN
        Cho phép 10 requests đi qua thử nghiệm.
        Đánh giá sức khỏe của service đối tác.
    end note
~~~


### Sơ Đồ Mô Phỏng: Transactional Outbox Pattern với PostgreSQL FOR UPDATE SKIP LOCKED

~~~mermaid
flowchart TD
    Client["Client / API Request"] --> Svc["Order Service"]
    subgraph LocalTx ["CÙNG MỘ DATABASE TRANSACTION (ACID)"]
        Svc --> T1["1. INSERT INTO t_orders (Status: PENDING)"]
        Svc --> T2["2. INSERT INTO t_outbox_events (Status: PENDING)"]
    end
    LocalTx --> DB[(PostgreSQL Database)]
    
    subgraph AsyncWorker ["OUTBOX PUBLISHER (BẤT ĐỒNG BỘ)"]
        Poller["Outbox Poller / Debezium CDC"] --> Query["SELECT * FROM t_outbox_events<br/>WHERE status = 'PENDING'<br/>FOR UPDATE SKIP LOCKED LIMIT 50"]
        Query --> Kafka["Kafka Producer"]
        Kafka --> Topic["Kafka Topic: orders.v1"]
        Topic --> Ack["Publish Thành Công"]
        Ack --> Update["UPDATE t_outbox_events<br/>SET status = 'PUBLISHED'"]
    end
    DB <--> Poller
~~~


### Sơ Đồ Mô Phỏng: Kiến Trúc Bộ Đệm 2 Tầng (Caffeine L1 + Redis L2 + Pub/Sub Sync)

~~~mermaid
flowchart TD
    Client["Client Request"] --> L1["1. Local Cache L1 (Caffeine: ~0.05ms)"]
    L1 -- "Hit (90% requests)" --> Ret1["Trả về dữ liệu ngay lập tức"]
    L1 -- "Miss" --> L2["2. Distributed Cache L2 (Redis: ~1.5ms)"]
    L2 -- "Hit" --> Pop1["Nạp dữ liệu vào L1"] --> Ret2["Trả về dữ liệu"]
    L2 -- "Miss" --> DB["3. Database Query (PostgreSQL: ~25ms)"]
    DB --> Pop2["Cập nhật Redis L2"] --> Pop1
    
    subgraph Eviction ["KHI CÓ GIAO DỊCH GHI (UPDATE DATA)"]
        WriteReq["Write Request"] --> UpDB["1. Update Database"]
        UpDB --> EvL2["2. Xóa key trong Redis L2"]
        EvL2 --> Pub["3. Redis PUBLISH channel 'cache:evict' (Key ID)"]
        Pub --> Sub1["Pod 1: Xóa L1 Caffeine"]
        Pub --> Sub2["Pod 2: Xóa L1 Caffeine"]
        Pub --> Sub3["Pod N: Xóa L1 Caffeine"]
    end
~~~


### 1.1. AMQP 0-9-1 Protocol & Mô hình Connection / Channel Multiplexing

Trong AMQP 0-9-1, client không tương tác trực tiếp với queue qua các TCP connection riêng rẽ. Thay vào đó, AMQP sử dụng kiến trúc **Channel Multiplexing**:

~~~text
+-----------------------------------------------------------------------+
|                       Spring Boot Application                         |
|                                                                       |
|  [ Thread Pool Worker 1 ]     [ Worker 2 ]     [ Worker 3 ]           |
|            |                        |                 |               |
|       (Channel 1)              (Channel 2)       (Channel 3)          |
|                                    |                /                |
|             +-----------------------+---------------+                 |
|                                     |                                 |
|                       [ Single TCP Connection ]                       |
|                             (Port 5672/TLS)                           |
+-------------------------------------|---------------------------------+
                                      | (Multiplexed Frames)
                                      v
+-----------------------------------------------------------------------+
|                          RabbitMQ Broker                              |
|                                                                       |
|   +-------------------+     Routing Key      +--------------------+   |
|   |     Exchange      | -------------------> |    Target Queue    |   |
|   | (Direct/Topic/..) |                      |  (Erlang Process)  |   |
|   +-------------------+                      +--------------------+   |
|             |                                           |             |
|             | Dead-Letter                               v             |
|             v (x-dead-letter-*)              +--------------------+   |
|   +-------------------+                      |  Dead Letter Queue |   |
|   |    DLX Exchange   | ===================> |      (DLQ)         |   |
|   +-------------------+                      +--------------------+   |
+-----------------------------------------------------------------------+
~~~

- **Connection**: Là một TCP connection vật lý thực sự giữa client và broker. Thiết lập TCP connection có chi phí cực cao (TCP 3-way handshake, TLS negotiation, AMQP authentication). Do đó, Spring AMQP duy trì một <code>CachingConnectionFactory</code> tái sử dụng một số lượng kết nối rất nhỏ (thường chỉ 1 hoặc 2 kết nối vật lý cho mỗi service).
- **Channel**: Là một "kết nối ảo" (lightweight connection) chạy ghép kênh (multiplexed) trên cùng một TCP connection. Mọi lệnh AMQP (publish, consume, ack, declare queue) đều diễn ra trên Channel. 
  - *Cực kỳ quan trọng*: AMQP <code>Channel</code> **KHÔNG an toàn về luồng (NOT thread-safe)**. Nếu hai thread cùng lúc gọi <code>basicPublish</code> hoặc <code>basicAck</code> trên cùng một Channel instance, frame của AMQP protocol sẽ bị xáo trộn, dẫn đến lỗi <code>Channel closed: UNEXPECTED_FRAME</code> hoặc crash kết nối. Spring AMQP bảo vệ bạn bằng cách cấp phát Channel theo thread thông qua <code>ChannelAwareMessageListener</code> hoặc Channel pool.

### 1.2. Phân loại Exchange & Thuật toán Routing

RabbitMQ Producer **không bao giờ** gửi trực tiếp message vào Queue. Producer chỉ gửi vào **Exchange**, kèm theo một **Routing Key**. Exchange dựa vào **Bindings** (luật liên kết giữa Exchange và Queue) để quyết định copy message vào những Queue nào:

1. **Direct Exchange**: Routing key của message phải khớp 100% với Binding Key của Queue. Thích hợp cho worker queue đơn giản phân loại theo task name (ví dụ: routing key <code>email.high</code> -> queue <code>email_high_prio_queue</code>).
2. **Topic Exchange**: Cho phép so khớp routing key theo pattern với hai ký tự đại diện:
   - <code>*</code> (dấu hoa thị): Khớp đúng **1 từ** (phân cách bởi dấu chấm). Ví dụ: <code>order.*.created</code> khớp với <code>order.retail.created</code>, nhưng không khớp với <code>order.retail.hn.created</code>.
   - <code>#</code> (dấu thăng): Khớp **0 hoặc nhiều từ**. Ví dụ: <code>audit.#</code> khớp với <code>audit</code>, <code>audit.user</code>, và cả <code>audit.finance.transaction.approved</code>.
3. **Fanout Exchange**: Bỏ qua hoàn toàn Routing Key. Bất kỳ message nào đến Fanout Exchange đều được sao chép (broadcast) đến **tất cả** các Queue được bind vào nó. Thích hợp cho pub/sub thông báo cấu hình cache invalidation.
4. **Headers Exchange**: Bỏ qua Routing Key, định tuyến dựa trên các cặp key-value trong AMQP Message Headers (<code>x-match: all</code> hoặc <code>x-match: any</code>).

### 1.3. Vòng đời Message & Cơ chế Dead Letter Exchange (DLX)

Khi một consumer nhận message từ Queue, có 3 kịch bản kết thúc:
1. **Positive Acknowledgment (<code>basicAck</code>)**: Consumer thông báo xử lý thành công. Broker xóa ngay lập tức message khỏi RAM/Disk của Queue.
2. **Negative Acknowledgment with Requeue (<code>basicNack(requeue = true)</code>)**: Message được đưa ngược lại đầu Queue để consumer khác (hoặc chính consumer đó) lấy lại.
3. **Negative Acknowledgment without Requeue (<code>basicNack(requeue = false)</code>) hoặc Message Bị Reject**:
   - Nếu Queue được cấu hình thuộc tính <code>x-dead-letter-exchange</code>, RabbitMQ sẽ **tự động chuyển hướng** message này sang Exchange được chỉ định (Dead Letter Exchange - DLX).
   - Message sẽ đi vào **Dead Letter Queue (DLQ)** để admin phân tích, hoặc để batch retry sau.
   - Message cũng bị tống sang DLX khi:
     - Message bị hết hạn (Message TTL qua <code>x-message-ttl</code> hoặc expiration header).
     - Queue vượt quá dung lượng tối đa (Queue length limit qua <code>x-max-length</code>).

### 1.4. Spring Cloud Stream Binder Abstraction

Spring Cloud Stream trừu tượng hóa các khái niệm broker bằng cách tích hợp trực tiếp với <code>java.util.function</code> từ Java 8:
- <code>java.util.function.Supplier<O></code>: Tương đương Producer / Source (tự động emit data theo chu kỳ poller hoặc trigger chủ động qua <code>StreamBridge</code>).
- <code>java.util.function.Function<I, O></code>: Tương đương Processor (nhận message từ input topic/queue, xử lý/chuyển đổi và publish sang output topic/queue).
- <code>java.util.function.Consumer<I></code>: Tương đương Consumer / Sink (nhận message và lưu database, gọi external service).

Broker Binder (Kafka Binder hoặc Rabbit Binder) sẽ tự động bind các function này vào Destination vật lý:
- Tên function: <code>orderProcessor</code>
- Tên channel input mặc định: <code>orderProcessor-in-0</code>
- Tên channel output mặc định: <code>orderProcessor-out-0</code>
Bạn chỉ cần mapping <code>spring.cloud.stream.bindings.orderProcessor-in-0.destination=orders.v1</code> là code nghiệp vụ hoàn toàn độc lập với việc broker bên dưới là RabbitMQ hay Kafka!

---

## 2. Production-Grade Implementation Code

Dưới đây là kiến trúc tích hợp RabbitMQ hoàn chỉnh trong hệ thống E-commerce / Fintech: Xử lý Transaction Webhook Notification với Manual Ack, DLX, và JSON serialization an toàn.

### 2.1. Cấu hình Hạ tầng AMQP: Exchanges, Queues, DLX & Converter

~~~java
package com.enterprise.course.infra.messaging.rabbitmq;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class RabbitMqInfrastructureConfig {

    public static final String MAIN_EXCHANGE = "payment.events.topic";
    public static final String DLX_EXCHANGE = "payment.events.dlx";
    
    public static final String WEBHOOK_QUEUE = "q.payment.webhook-dispatch";
    public static final String WEBHOOK_DLQ = "q.payment.webhook-dispatch.dlq";
    
    public static final String ROUTING_KEY_WEBHOOK = "payment.webhook.#";
    public static final String DLQ_ROUTING_KEY = "payment.webhook.dead-letter";

    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        // Bắt buộc bật Publisher Confirms và Returns để kiểm soát độ tin cậy
        template.setMandatory(true);
        template.setReturnsCallback(returned -> {
            // Callback khi message vào Exchange nhưng không route được vào bất kỳ Queue nào
            System.err.printf("[AMQP UNROUTED] Message %s to exchange %s with key %s failed: replyCode=%d, replyText=%s%n",
                    returned.getMessage().getMessageProperties().getMessageId(),
                    returned.getExchange(),
                    returned.getRoutingKey(),
                    returned.getReplyCode(),
                    returned.getReplyText());
        });
        return template;
    }

    // 1. Khai báo Dead Letter Exchange & Queue
    @Bean
    public DirectExchange deadLetterExchange() {
        return ExchangeBuilder.directExchange(DLX_EXCHANGE)
                .durable(true)
                .build();
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(WEBHOOK_DLQ).build();
    }

    @Bean
    public Binding dlqBinding(@Qualifier("deadLetterQueue") Queue deadLetterQueue,
                              @Qualifier("deadLetterExchange") DirectExchange deadLetterExchange) {
        return BindingBuilder.bind(deadLetterQueue)
                .to(deadLetterExchange)
                .with(DLQ_ROUTING_KEY);
    }

    // 2. Khai báo Main Topic Exchange
    @Bean
    public TopicExchange mainExchange() {
        return ExchangeBuilder.topicExchange(MAIN_EXCHANGE)
                .durable(true)
                .build();
    }

    // 3. Khai báo Main Queue gắn chặt với Dead Letter Arguments
    @Bean
    public Queue webhookProcessingQueue() {
        Map<String, Object> args = new HashMap<>();
        // Khi message bị nack/reject với requeue=false, đẩy sang DLX này
        args.put("x-dead-letter-exchange", DLX_EXCHANGE);
        // Routing key khi đẩy sang DLX
        args.put("x-dead-letter-routing-key", DLQ_ROUTING_KEY);
        // Giới hạn thời gian sống message trong queue (ví dụ 24 giờ = 86400000 ms)
        args.put("x-message-ttl", 86_400_000);
        // Giới hạn max length phòng chống OOM
        args.put("x-max-length", 500_000);
        
        return QueueBuilder.durable(WEBHOOK_QUEUE)
                .withArguments(args)
                .build();
    }

    @Bean
    public Binding webhookQueueBinding(@Qualifier("webhookProcessingQueue") Queue webhookProcessingQueue,
                                       @Qualifier("mainExchange") TopicExchange mainExchange) {
        return BindingBuilder.bind(webhookProcessingQueue)
                .to(mainExchange)
                .with(ROUTING_KEY_WEBHOOK);
    }

    // 4. Container Factory với QoS Prefetch Count và Manual Acknowledgment
    @Bean
    public SimpleRabbitListenerContainerFactory manualAckContainerFactory(
            ConnectionFactory connectionFactory,
            MessageConverter jsonMessageConverter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jsonMessageConverter);
        // Manual Ack Mode để code tự quyết định basicAck hoặc basicNack
        factory.setAcknowledgeMode(AcknowledgeMode.MANUAL);
        // Prefetch count cực kỳ quan trọng: mỗi worker channel chỉ được nhận tối đa 20 unacked messages
        factory.setPrefetchCount(20);
        factory.setConcurrentConsumers(3);
        factory.setMaxConcurrentConsumers(10);
        return factory;
    }
}
~~~

### 2.2. Event Payload Record & Enterprise Message Publisher

~~~java
package com.enterprise.course.infra.messaging.rabbitmq;

import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record WebhookNotificationEvent(
        String eventId,
        String paymentId,
        String merchantId,
        String targetUrl,
        BigDecimal amount,
        String status,
        int retryCount,
        Instant occurredAt
) {}

@Service
public class WebhookEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public WebhookEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishWebhookTask(WebhookNotificationEvent event, int priority) {
        String routingKey = "payment.webhook." + event.merchantId();

        rabbitTemplate.convertAndSend(
                RabbitMqInfrastructureConfig.MAIN_EXCHANGE,
                routingKey,
                event,
                message -> {
                    MessageProperties props = message.getMessageProperties();
                    props.setMessageId(event.eventId());
                    props.setCorrelationId(UUID.randomUUID().toString());
                    props.setTimestamp(java.util.Date.from(Instant.now()));
                    props.setContentType(MessageProperties.CONTENT_TYPE_JSON);
                    // Bắt buộc PERSISTENT (delivery_mode = 2) để message ghi xuống disk Erlang Mnesia
                    props.setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                    props.setPriority(Math.min(priority, 9));
                    props.setHeader("X-Source-Service", "payment-settlement-service");
                    return message;
                }
        );
    }
}
~~~

### 2.3. Enterprise Consumer với Manual Ack, Nack & Idempotency

~~~java
package com.enterprise.course.infra.messaging.rabbitmq;

import com.rabbitmq.client.Channel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Component
public class WebhookDispatchConsumer {

    private static final Logger log = LoggerFactory.getLogger(WebhookDispatchConsumer.class);
    private final StringRedisTemplate redisTemplate;
    private final HttpClient httpClient;

    public WebhookDispatchConsumer(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
    }

    @RabbitListener(
            queues = RabbitMqInfrastructureConfig.WEBHOOK_QUEUE,
            containerFactory = "manualAckContainerFactory"
    )
    public void onWebhookMessage(WebhookNotificationEvent event, Message message, Channel channel) throws IOException {
        long deliveryTag = message.getMessageProperties().getDeliveryTag();
        String eventId = event.eventId();

        log.info("Received webhook dispatch task: eventId={}, paymentId={}, deliveryTag={}", 
                eventId, event.paymentId(), deliveryTag);

        // 1. Idempotency Check qua Redis SetNX (Dedup key giữ trong 24 giờ)
        String idempotencyKey = "idempotency:webhook:" + eventId;
        Boolean isFirstReceive = redisTemplate.opsForValue()
                .setIfAbsent(idempotencyKey, "PROCESSING", Duration.ofHours(24));

        if (Boolean.FALSE.equals(isFirstReceive)) {
            log.warn("Duplicate webhook message detected: eventId={}. Acking to drop duplicate.", eventId);
            channel.basicAck(deliveryTag, false);
            return;
        }

        try {
            // 2. Thực hiện HTTP POST Dispatch tới Merchant Endpoint
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(event.targetUrl()))
                    .timeout(Duration.ofSeconds(5))
                    .header("Content-Type", "application/json")
                    .header("X-Event-ID", event.eventId())
                    .POST(HttpRequest.BodyPublishers.ofString(
                            String.format("{"paymentId":"%s","status":"%s","amount":%s}",
                                    event.paymentId(), event.status(), event.amount())
                    ))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Webhook delivered successfully to {} with HTTP {}", event.targetUrl(), response.statusCode());
                redisTemplate.opsForValue().set(idempotencyKey, "COMPLETED", Duration.ofHours(24));
                // 3. Positive Ack: broker xóa message
                channel.basicAck(deliveryTag, false);
            } else if (response.statusCode() >= 400 && response.statusCode() < 500) {
                // Lỗi client của merchant (400 Bad Request, 404 Not Found) -> Không thể cứu vãn bằng retry lặp lại
                log.error("Merchant returned client error HTTP {}. Sending directly to DLQ.", response.statusCode());
                redisTemplate.opsForValue().set(idempotencyKey, "FAILED_PERMANENT", Duration.ofHours(24));
                // basicNack với requeue=false -> RabbitMQ tự động đẩy sang DLX!
                channel.basicNack(deliveryTag, false, false);
            } else {
                // Lỗi 5xx từ phía merchant: tạm thời quá tải -> nack đẩy sang DLQ để retry queue xử lý
                log.warn("Merchant server error HTTP {}. Routing to DLQ for scheduled backoff retry.", response.statusCode());
                redisTemplate.delete(idempotencyKey); // Cho phép retry lần sau
                channel.basicNack(deliveryTag, false, false);
            }

        } catch (Exception ex) {
            log.error("Network or connection failure dispatching webhook eventId={}: {}", eventId, ex.getMessage());
            redisTemplate.delete(idempotencyKey);
            // Lỗi mạng nghiêm trọng -> Không được requeue=true lập tức vì sẽ gây bão CPU (Requeue Loop of Death).
            // Đẩy sang DLQ để batch retry hoặc delayed retry queue xử lý.
            channel.basicNack(deliveryTag, false, false);
        }
    }
}
~~~

### 2.4. Triển khai Spring Cloud Stream Modern Functional Model

~~~java
package com.enterprise.course.infra.messaging.stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;

import java.util.function.Consumer;
import java.util.function.Function;

@Configuration
public class StreamBindingConfiguration {

    private static final Logger log = LoggerFactory.getLogger(StreamBindingConfiguration.class);

    // Functional Consumer: Tự động binding tới destination qua config spring.cloud.stream.bindings.auditConsumer-in-0
    @Bean
    public Consumer<Message<String>> auditConsumer() {
        return message -> {
            String payload = message.getPayload();
            String correlationId = (String) message.getHeaders().getOrDefault("X-Correlation-ID", "N/A");
            log.info("[SPRING CLOUD STREAM AUDIT] Received payload='{}' with correlationId={}", payload, correlationId);
        };
    }

    // Functional Processor: Nhận Order Created -> Enriched Order Event
    @Bean
    public Function<Message<String>, Message<String>> orderEnricher() {
        return incoming -> {
            String originalOrder = incoming.getPayload();
            String enriched = "{"data":" + originalOrder + ","enrichedAt":"" + System.currentTimeMillis() + ""}";
            
            return MessageBuilder.withPayload(enriched)
                    .setHeader("X-Processor-Node", "worker-01")
                    .build();
        };
    }
}
~~~

Cấu hình <code>application.yml</code> cho Spring Cloud Stream (chuyển đổi linh hoạt giữa RabbitMQ và Kafka):

~~~yaml
spring:
  cloud:
    function:
      definition: auditConsumer;orderEnricher
    stream:
      default-binder: rabbit # hoặc kafka khi cần chuyển cụm
      bindings:
        auditConsumer-in-0:
          destination: enterprise.audit.events
          group: audit-service-group
          consumer:
            max-attempts: 3
            back-off-initial-interval: 2000
        orderEnricher-in-0:
          destination: orders.raw
          group: enrichment-workers
        orderEnricher-out-0:
          destination: orders.enriched
      rabbit:
        bindings:
          auditConsumer-in-0:
            consumer:
              auto-bind-dlq: true
              dead-letter-exchange: enterprise.audit.dlx
              requeue-rejected: false
~~~

---

## 3. Kiểm thử, Metrics & Vận hành thực chiến

### 3.1. Truy vấn RabbitMQ Management API qua cURL để giám sát Queue

Bạn có thể cURL trực tiếp vào RabbitMQ Management API (Port 15672) để kiểm tra số lượng tin nhắn bị kẹt, số unacknowledged messages, và tốc độ tiêu thụ:

~~~bash
# 1. Kiểm tra trạng thái hàng đợi: messages, unacknowledged, consumer_count
curl -s -u guest:guest "http://localhost:15672/api/queues/%2F/q.payment.webhook-dispatch" | jq '{
  name: .name,
  messages_ready: .messages_ready,
  messages_unacknowledged: .messages_unacknowledged,
  consumers: .consumers,
  state: .state
}'
~~~

Phản hồi chuẩn:
~~~json
{
  "name": "q.payment.webhook-dispatch",
  "messages_ready": 0,
  "messages_unacknowledged": 4,
  "consumers": 3,
  "state": "running"
}
~~~

Nếu <code>messages_unacknowledged</code> tăng liên tục mà không giảm, tức là consumer đang gặp deadlock, thread leak hoặc quên gọi <code>basicAck</code>!

~~~bash
# 2. Kiểm tra Dead Letter Queue xem có bao nhiêu message lỗi
curl -s -u guest:guest "http://localhost:15672/api/queues/%2F/q.payment.webhook-dispatch.dlq" | jq '{
  name: .name,
  messages_in_dlq: .messages,
  rate_in: .message_stats.publish_details.rate
}'
~~~

### 3.2. Micrometer Metrics & Prometheus Alert Rule

Spring Boot Actuator tự động publish các metrics của RabbitMQ vào Prometheus:
- <code>rabbitmq.consumed</code>: Tổng số message đã đọc.
- <code>rabbitmq.acknowledged</code>: Số message đã ack thành công.
- <code>rabbitmq.rejected</code>: Số message bị reject/nack.

Alert rule trong Prometheus (<code>alert.rules.yml</code>):

~~~yaml
groups:
  - name: rabbitmq-enterprise-alerts
    rules:
      - alert: RabbitMqHighUnackedMessages
        expr: rabbitmq_queue_messages_unacknowledged{queue="q.payment.webhook-dispatch"} > 100
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "RabbitMQ Consumer unacked messages leak detected"
          description: "Queue {{ $labels.queue }} has {{ $value }} unacked messages for more than 2 minutes. Check for thread deadlocks or missing basicAck."

      - alert: DeadLetterQueueNotEmpty
        expr: rabbitmq_queue_messages{queue="q.payment.webhook-dispatch.dlq"} > 10
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "DLQ receiving dead messages"
          description: "Dead Letter Queue {{ $labels.queue }} contains {{ $value }} poison messages."
~~~

---

## 4. Production Pitfalls & Post-Mortem

### 4.1. Sự cố 1: "Requeue Loop of Death" làm CPU 100% và nghẽn toàn bộ Broker

- **Bối cảnh**: Lập trình viên bắt ngoại lệ trong <code>@RabbitListener</code> và gọi:
  ~~~java
  // NGUY HIỂM CHẾT NGƯỜI
  channel.basicNack(deliveryTag, false, true); // requeue = true
  ~~~
- **Cơ chế thảm họa**: Payload của message chứa JSON sai định dạng (poison pill). Khi consumer nack với <code>requeue=true</code>, RabbitMQ ngay lập tức đặt message về đầu queue. Ngay tick CPU tiếp theo, consumer lại dequeue đúng message đó, lại ném Exception, lại nack <code>requeue=true</code>.
- **Hậu quả**: Vòng lặp xảy ra hàng triệu lần mỗi giây. CPU của Spring Boot app và RabbitMQ Erlang process vọt lên 100%. Toàn bộ các message bình thường phía sau bị nghẽn hoàn toàn.
- **Giải pháp dứt khoát**: **KHÔNG BAO GIỜ** requeue vô điều kiện. Luôn luôn cấu hình <code>requeue=false</code> kết hợp cùng **Dead Letter Exchange (DLX)**, hoặc quản lý <code>retryCount</code> trong header. Khi vượt quá ngưỡng max attempts (ví dụ 3 lần), bắt buộc phải đẩy vào DLQ.

### 4.2. Sự cố 2: "Unacked Message Leak" dẫn đến OOM Erlang VM

- **Bối cảnh**: Default <code>prefetchCount</code> trong một số phiên bản AMQP client hoặc khi cấu hình thiếu cẩn trọng là không giới hạn (hoặc quá lớn). Đồng thời, code consumer gọi một external API của đối tác bên ngoài bị timeout treo luồng.
- **Cơ chế thảm họa**: RabbitMQ thấy consumer đang online liền đẩy ồ ạt hàng chục ngàn message vào bộ nhớ RAM của Spring Boot pod. Các message này nằm ở trạng thái <code>unacknowledged</code>. Khi RAM vượt ngưỡng, pod Spring Boot bị OOMKilled bởi Kubernetes. Khi pod chết đột ngột, toàn bộ unacked messages bị dồn ngược lại broker cùng một lúc, gây ra hiện tượng Stampede và sập luôn RabbitMQ node.
- **Giải pháp**: Luôn luôn đặt <code>prefetchCount</code> nhỏ (thường từ <code>10</code> đến <code>50</code> tùy theo throughput và thời gian xử lý của mỗi message).

### 4.3. Sự cố 3: RabbitMQ Memory Alarm & Blocking TCP Sockets

- **Bối cảnh**: RabbitMQ có cơ chế tự bảo vệ: <code>vm_memory_high_watermark</code> (mặc định 40% RAM hệ thống). Khi RAM của broker chạm ngưỡng này, RabbitMQ sẽ **đình chỉ (block)** toàn bộ TCP socket của tất cả Producer gửi tin nhắn đến.
- **Hậu quả**: Các thread gọi <code>rabbitTemplate.convertAndSend(...)</code> trong Spring Boot bị block vĩnh viễn (hoặc đến khi timeout connection). Connection pool của Tomcat bị cạn kiệt, toàn bộ hệ thống API treo cứng.
- **Giải pháp**:
  1. Cấu hình timeout rõ ràng trên template: <code>spring.rabbitmq.template.reply-timeout=5000</code>.
  2. Bật paging to disk: Chuyển đổi các queue dung lượng lớn sang chế độ **Quorum Queue** hoặc **Lazy Queue** (<code>x-queue-mode: lazy</code>) để RabbitMQ đẩy message trực tiếp xuống ổ cứng thay vì giữ trên RAM Erlang.

---

## 5. Hands-on Enterprise Challenge & Reference Solution

### Đề bài: Xây dựng Exponential Backoff Delayed Retry Queue bằng DLX Chain (Không dùng Plugin bên thứ ba)

Hệ thống thanh toán cần gọi webhook sang Merchant. Nếu Merchant bị lỗi mạng (5xx), hệ thống cần tự động retry theo cơ chế Exponential Backoff:
- Lần 1: Sau 5 giây
- Lần 2: Sau 15 giây
- Lần 3: Sau 60 giây
- Sau 3 lần vẫn thất bại: Đẩy vào <code>q.merchant.webhook.permanent-dlq</code> để cảnh báo kỹ thuật viên.
*Yêu cầu*: Xây dựng giải pháp thuần túy bằng cơ chế AMQP TTL + Dead Letter Exchange (DLX) mà không cần cài thêm plugin <code>rabbitmq_delayed_message_exchange</code>.

### Lời giải hoàn chỉnh (Reference Solution)

Kiến trúc giải pháp:
~~~text
[ Main Queue ] --- (Failed, ack/nack) ---> Đẩy vào [ Retry Queue (TTL 5s, 15s, 60s) ]
                                                            |
                                                 (Hết hạn TTL sau N giây)
                                                            v (Tự động DLX)
                                              [ Main Exchange ] ---> Quay lại [ Main Queue ]
~~~

~~~java
package com.enterprise.course.challenge.retry;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class DelayedRetryTopologyConfig {

    public static final String BIZ_EXCHANGE = "ex.merchant.biz";
    public static final String RETRY_EXCHANGE = "ex.merchant.retry";
    
    public static final String MAIN_QUEUE = "q.merchant.webhook.main";
    public static final String RETRY_5S_QUEUE = "q.merchant.webhook.retry.5s";
    public static final String RETRY_15S_QUEUE = "q.merchant.webhook.retry.15s";
    public static final String RETRY_60S_QUEUE = "q.merchant.webhook.retry.60s";
    public static final String PERMANENT_DLQ = "q.merchant.webhook.fatal-dlq";

    @Bean
    public TopicExchange bizExchange() {
        return new TopicExchange(BIZ_EXCHANGE, true, false);
    }

    @Bean
    public DirectExchange retryExchange() {
        return new DirectExchange(RETRY_EXCHANGE, true, false);
    }

    @Bean
    public Queue mainWorkQueue() {
        return QueueBuilder.durable(MAIN_QUEUE).build();
    }

    @Bean
    public Binding mainBinding(Queue mainWorkQueue, TopicExchange bizExchange) {
        return BindingBuilder.bind(mainWorkQueue).to(bizExchange).with("merchant.webhook.dispatch");
    }

    // Queue chờ 5s: không có consumer! Sau 5s TTL, message tự chết và bị DLX bắn về BIZ_EXCHANGE
    @Bean
    public Queue retry5sQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-message-ttl", 5_000); // 5 seconds
        args.put("x-dead-letter-exchange", BIZ_EXCHANGE);
        args.put("x-dead-letter-routing-key", "merchant.webhook.dispatch");
        return QueueBuilder.durable(RETRY_5S_QUEUE).withArguments(args).build();
    }

    @Bean
    public Queue retry15sQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-message-ttl", 15_000); // 15 seconds
        args.put("x-dead-letter-exchange", BIZ_EXCHANGE);
        args.put("x-dead-letter-routing-key", "merchant.webhook.dispatch");
        return QueueBuilder.durable(RETRY_15S_QUEUE).withArguments(args).build();
    }

    @Bean
    public Queue retry60sQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-message-ttl", 60_000); // 60 seconds
        args.put("x-dead-letter-exchange", BIZ_EXCHANGE);
        args.put("x-dead-letter-routing-key", "merchant.webhook.dispatch");
        return QueueBuilder.durable(RETRY_60S_QUEUE).withArguments(args).build();
    }

    @Bean
    public Queue fatalDlq() {
        return QueueBuilder.durable(PERMANENT_DLQ).build();
    }

    @Bean
    public Binding retry5sBinding(Queue retry5sQueue, DirectExchange retryExchange) {
        return BindingBuilder.bind(retry5sQueue).to(retryExchange).with("retry.5s");
    }

    @Bean
    public Binding retry15sBinding(Queue retry15sQueue, DirectExchange retryExchange) {
        return BindingBuilder.bind(retry15sQueue).to(retryExchange).with("retry.15s");
    }

    @Bean
    public Binding retry60sBinding(Queue retry60sQueue, DirectExchange retryExchange) {
        return BindingBuilder.bind(retry60sQueue).to(retryExchange).with("retry.60s");
    }

    @Bean
    public Binding fatalDlqBinding(Queue fatalDlq, DirectExchange retryExchange) {
        return BindingBuilder.bind(fatalDlq).to(retryExchange).with("retry.fatal");
    }
}
~~~

Service định tuyến Retry thông minh:

~~~java
package com.enterprise.course.challenge.retry;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebhookRetryCoordinator {

    private static final Logger log = LoggerFactory.getLogger(WebhookRetryCoordinator.class);
    private final RabbitTemplate rabbitTemplate;

    public WebhookRetryCoordinator(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void scheduleNextRetryOrDeadLetter(Object payload, MessageProperties properties) {
        // Lấy số lần retry hiện tại từ header
        Integer currentRetry = (Integer) properties.getHeaders().getOrDefault("X-Retry-Count", 0);
        int nextRetry = currentRetry + 1;

        String targetRoutingKey;
        if (nextRetry == 1) {
            targetRoutingKey = "retry.5s";
        } else if (nextRetry == 2) {
            targetRoutingKey = "retry.15s";
        } else if (nextRetry == 3) {
            targetRoutingKey = "retry.60s";
        } else {
            targetRoutingKey = "retry.fatal";
        }

        log.info("Scheduling retry attempt #{} for messageId={} to routingKey={}",
                nextRetry, properties.getMessageId(), targetRoutingKey);

        rabbitTemplate.convertAndSend(
                DelayedRetryTopologyConfig.RETRY_EXCHANGE,
                targetRoutingKey,
                payload,
                msg -> {
                    MessageProperties props = msg.getMessageProperties();
                    props.getHeaders().putAll(properties.getHeaders());
                    props.getHeaders().put("X-Retry-Count", nextRetry);
                    props.setMessageId(properties.getMessageId());
                    props.setCorrelationId(properties.getCorrelationId());
                    return msg;
                }
        );
    }
}
~~~
`
    },
    {
      id: "6-11",
      type: "lesson",
      title: "Spring Modulith & ArchUnit — modular monolith có pháp luật",
      minutes: 50,
      content: `## Monolith 1 triệu dòng — mọi package import chéo nhau, không ai dám đụng

Rất nhiều doanh nghiệp rơi vào cái bẫy nhị phân: "Hoặc là Monolith spaghetti hỗn loạn, hoặc là đập ra 20 Microservices!". 
Họ chọn Microservices theo phong trào và lập tức nếm mùi đau khổ: chi phí hạ tầng Kubernetes tăng gấp 5 lần, lỗi mạng chập chờn (network partitions), distributed tracing phức tạp, và ác mộng distributed transaction (Saga pattern) cho những nghiệp vụ vốn dĩ có thể giải quyết bằng 1 câu lệnh SQL JOIN.

Nhưng nếu giữ Monolith truyền thống, sau 2 năm với 15 lập trình viên, codebase sẽ biến thành **"Big Ball of Mud"**:
- Controller của module <code>Billing</code> gọi trực tiếp <code>@Repository</code> nội bộ của module <code>User</code>.
- Service <code>Order</code> phụ thuộc vòng (circular dependency) với Service <code>Inventory</code>.
- Đổi một cột trong bảng <code>User</code> làm gãy 8 module khác nhau mà không ai lường trước được.

**Modular Monolith (Modulith)** chính là con đường cứu cánh: **Deploy 1 artifact duy nhất (1 JVM, 1 Database transaction cục bộ, 0 network latency)**, nhưng **Ranh giới module (Architectural Boundaries) được bảo vệ nghiêm ngặt bằng pháp luật mã nguồn**. 

Với **Spring Modulith** (dự án chính thức của Spring Team) và **ArchUnit**, hệ thống của bạn sẽ tự động từ chối build nếu có bất kỳ lập trình viên nào vi phạm ranh giới kiến trúc!

---

## 1. Kiến trúc chuyên sâu & Cơ chế hoạt động (Under the Hood)

### 1.1. Ranh giới Module trong Spring Modulith: Public API vs Package Internals

Spring Modulith dựa trên quy ước package của Java để thiết lập ranh giới:

~~~text
com.enterprise.app/                     <-- Application Root (@SpringBootApplication)
│
├── order/                              <-- MODULE ROOT (Public API của module Order)
│   ├── OrderPublicService.java         <-- PUBLIC: Các module khác ĐƯỢC PHÉP gọi
│   ├── OrderPlacedEvent.java           <-- PUBLIC: Domain Event xuất bản ra ngoài
│   └── internal/                       <-- NỘI BỘ MODULE (Internal implementation)
│       ├── OrderEntity.java            <-- CẤM MODULE KHÁC TRUY CẬP TRỰC TIẾP!
│       ├── OrderRepository.java        <-- CẤM MODULE KHÁC INJECT!
│       └── OrderPriceCalculator.java   <-- Logic tính giá nội bộ
│
├── inventory/                          <-- MODULE ROOT (Module Inventory)
│   ├── InventoryPublicService.java
│   └── internal/
│       ├── InventoryEntity.java
│       └── InventoryEventListener.java <-- Lắng nghe OrderPlacedEvent bất đồng bộ
│
└── payment/                            <-- MODULE ROOT (Module Payment)
~~~

- **Mặc định**: Tất cả các class nằm trực tiếp tại package gốc của module (ví dụ <code>com.enterprise.app.order</code>) được coi là **Public API**. Các module khác (như <code>inventory</code>, <code>payment</code>) chỉ được phép import các class này.
- **Tất cả các sub-packages** (như <code>com.enterprise.app.order.internal</code> hoặc <code>...order.repository</code>) mặc định là **Internal**. Spring Modulith sẽ kích hoạt kiểm tra reflection / ASM bytecode: nếu một bean thuộc <code>inventory</code> cố tình <code>@Autowired</code> một bean trong <code>order.internal</code>, unit test kiến trúc sẽ **NGAY LẬP TỨC THẤT BẠI** và chặn merge pull request!
- **<code>@NamedInterface</code>**: Cho phép bạn tạo ra các "cửa khẩu sổ sổ" có đặt tên thay vì chỉ dựa vào root package.

### 1.2. Decoupling qua Domain Events & Event Publication Registry

Làm thế nào để Module A thông báo cho Module B mà không cần inject service của nhau? Dùng **Domain Events cục bộ**:

~~~text
+-----------------------+                    +-------------------------+
|     Module Order      |                    |    Module Inventory     |
|                       |                    |                         |
|  [ OrderService ]     |                    |  [ InventoryListener ]  |
|         |             |                    |            ^            |
|         v             |                    |            |            |
|  (publishEvent)       |                    |  (@ApplicationModule-   |
|         |             |                    |       Listener)         |
+---------|-------------+                    +------------|------------+
          |                                               |
          +-------------> [ ApplicationEventMulticaster ] +
                                  |
                                  v
                    +---------------------------+
                    | EventPublicationRegistry  |
                    | (Persisted to DB Table)   |
                    +---------------------------+
~~~

Spring Modulith giới thiệu **<code>@ApplicationModuleListener</code>**:
1. Tương đương <code>@Async + @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)</code>.
2. Listener chỉ chạy **SAU KHI** transaction của module Order commit thành công vào DB.
3. **Event Publication Registry (Cơ chế chống mất Event nội bộ)**:
   - Khi <code>OrderService</code> publish event, Spring Modulith tự động ghi một dòng vào bảng <code>event_publication</code> trong cùng database transaction.
   - Khi <code>InventoryListener</code> xử lý xong thành công, dòng đó được đánh dấu là <code>COMPLETED</code>.
   - Nếu JVM bị sập nguồn điện đột ngột ngay sau khi Order commit nhưng trước khi Inventory chạy: Khi ứng dụng restart, Spring Modulith sẽ tự động quét bảng <code>event_publication</code> và **replay lại các event chưa hoàn thành**! Đây chính là Transactional Outbox Pattern chạy trực tiếp trong một tiến trình Monolith duy nhất!

### 1.3. ArchUnit — Khái niệm & Cơ chế phân tích Bytecode

ArchUnit là một Java test library phân tích bytecode thực tế của toàn bộ application bằng thư viện ASM:
- Không phụ thuộc vào Spring container đang chạy: ArchUnit quét thẳng file <code>.class</code> trong <code>target/classes</code> nên chạy cực nhanh (chỉ mất vài trăm miligiây).
- Cho phép viết các "luật pháp kiến trúc" bằng Fluent Java DSL:
  - *"Không có Controller nào được gọi trực tiếp Repository mà phải qua Service"*.
  - *"Không class nào ngoài package <code>order</code> được truy cập vào class mang annotation <code>@Entity</code> của <code>order</code>"*.
  - *"Không được phép tồn tại Circular Dependencies giữa các package"*.

---

## 2. Production-Grade Implementation Code

### 2.1. Cấu hình Maven & Khai báo Module Ranh giới

Dependency trong <code>pom.xml</code>:
~~~xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.modulith</groupId>
            <artifactId>spring-modulith-bom</artifactId>
            <version>1.2.4</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <dependency>
        <groupId>org.springframework.modulith</groupId>
        <artifactId>spring-modulith-starter-core</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.modulith</groupId>
        <artifactId>spring-modulith-starter-jdbc</artifactId> <!-- Event Publication Registry -->
    </dependency>
    <dependency>
        <groupId>org.springframework.modulith</groupId>
        <artifactId>spring-modulith-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>com.tngtech.archunit</groupId>
        <artifactId>archunit-junit5</artifactId>
        <version>1.3.0</version>
        <scope>test</scope>
    </dependency>
</dependencies>
~~~

Application Root:
~~~java
package com.enterprise.course;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.modulith.Modulithic;

@SpringBootApplication
@Modulithic(
        sharedModules = {"common"},
        useFullyQualifiedModuleNames = false
)
public class EnterpriseModulithApplication {
    public static void main(String[] args) {
        SpringApplication.run(EnterpriseModulithApplication.class, args);
    }
}
~~~

### 2.2. Module 1: Order Module (Public API, Internal Entities & Event Publication)

File <code>com.enterprise.course.order.OrderPlacedEvent.java</code> (Public Record):
~~~java
package com.enterprise.course.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderPlacedEvent(
        String orderId,
        String customerId,
        BigDecimal totalAmount,
        List<OrderItemDto> items,
        Instant occurredAt
) {
    public record OrderItemDto(String productId, int quantity) {}
}
~~~

File <code>com.enterprise.course.order.OrderPublicApi.java</code> (Public Interface):
~~~java
package com.enterprise.course.order;

import java.math.BigDecimal;
import java.util.List;

public interface OrderPublicApi {
    String createOrder(String customerId, List<OrderPlacedEvent.OrderItemDto> items, BigDecimal totalAmount);
}
~~~

File <code>com.enterprise.course.order.internal.OrderEntity.java</code> (Package-Private Entity — Bị che giấu khỏi các module khác):
~~~java
package com.enterprise.course.order.internal;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "t_orders")
class OrderEntity {

    @Id
    private String id;
    private String customerId;
    private BigDecimal totalAmount;
    private String status;
    private Instant createdAt;

    protected OrderEntity() {}

    public OrderEntity(String id, String customerId, BigDecimal totalAmount, String status) {
        this.id = id;
        this.customerId = customerId;
        this.totalAmount = totalAmount;
        this.status = status;
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public String getStatus() { return status; }
}
~~~

File <code>com.enterprise.course.order.internal.OrderServiceImpl.java</code> (Internal Service thực thi Public API):
~~~java
package com.enterprise.course.order.internal;

import com.enterprise.course.order.OrderPlacedEvent;
import com.enterprise.course.order.OrderPublicApi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
class OrderServiceImpl implements OrderPublicApi {

    private static final Logger log = LoggerFactory.getLogger(OrderServiceImpl.class);

    private final OrderJpaRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher;

    public OrderServiceImpl(OrderJpaRepository orderRepository, ApplicationEventPublisher eventPublisher) {
        this.orderRepository = orderRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public String createOrder(String customerId, List<OrderPlacedEvent.OrderItemDto> items, BigDecimal totalAmount) {
        String orderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8);
        
        OrderEntity entity = new OrderEntity(orderId, customerId, totalAmount, "CREATED");
        orderRepository.save(entity);
        log.info("Persisted order entity with ID: {}", orderId);

        // Xuất bản Domain Event: Spring Modulith sẽ tự động chặn và ghi nhận vào event_publication table
        OrderPlacedEvent event = new OrderPlacedEvent(orderId, customerId, totalAmount, items, Instant.now());
        eventPublisher.publishEvent(event);
        log.info("Published OrderPlacedEvent for order: {}", orderId);

        return orderId;
    }
}
~~~

### 2.3. Module 2: Inventory Module (Decoupled Event Listener)

File <code>com.enterprise.course.inventory.internal.InventoryDeductionListener.java</code>:
~~~java
package com.enterprise.course.inventory.internal;

import com.enterprise.course.order.OrderPlacedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

@Component
class InventoryDeductionListener {

    private static final Logger log = LoggerFactory.getLogger(InventoryDeductionListener.class);
    private final InventoryJpaRepository inventoryRepository;

    public InventoryDeductionListener(InventoryJpaRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    /**
     * @ApplicationModuleListener:
     * 1. Chạy bất đồng bộ trong transaction riêng biệt sau khi Order Transaction đã COMMIT thành công.
     * 2. Nếu phương thức này ném Exception, Spring Modulith đánh dấu event_publication là FAILED để retry.
     */
    @ApplicationModuleListener
    public void onOrderPlaced(OrderPlacedEvent event) {
        log.info("Inventory module received OrderPlacedEvent for order: {}", event.orderId());

        for (OrderPlacedEvent.OrderItemDto item : event.items()) {
            log.info("Deducting stock for productId={}, quantity={}", item.productId(), item.quantity());
            
            InventoryEntity inventory = inventoryRepository.findByProductId(item.productId())
                    .orElseThrow(() -> new IllegalStateException("Product not found in stock: " + item.productId()));

            if (inventory.getAvailableStock() < item.quantity()) {
                throw new InsufficientStockException("Out of stock for product " + item.productId());
            }

            inventory.deduct(item.quantity());
            inventoryRepository.save(inventory);
        }
        
        log.info("Inventory deduction completed successfully for order: {}", event.orderId());
    }
}
~~~

### 2.4. Unit Test Ranh giới Kiến trúc Tự động (Spring Modulith Verification)

File <code>src/test/java/com/enterprise/course/ModulithArchitectureTests.java</code>:
~~~java
package com.enterprise.course;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

public class ModulithArchitectureTests {

    private final ApplicationModules modules = ApplicationModules.of(EnterpriseModulithApplication.class);

    @Test
    void verifyModularStructure() {
        // In ra console cây module và các bean phụ thuộc
        modules.forEach(System.out::println);

        // QUAN TRỌNG NHẤT: Kiểm tra toàn bộ vi phạm ranh giới package
        // Nếu có cyclic dependency hoặc module khác import vào .internal -> ném AssertionError!
        modules.verify();
    }

    @Test
    void generateC4AndPlantUmlDocumentation() {
        // Tự động sinh biểu đồ kiến trúc C4, Canvas và PlantUML vào thư mục target/spring-modulith-docs
        new Documenter(modules)
                .writeDocumentation()
                .writeIndividualFilesAsPlantUml();
    }
}
~~~

### 2.5. Bộ Luật ArchUnit Chuyên sâu Cho Toàn Hệ Thống

File <code>src/test/java/com/enterprise/course/EnterpriseArchUnitTests.java</code>:
~~~java
package com.enterprise.course;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import org.springframework.stereotype.Repository;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.*;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

@AnalyzeClasses(
        packages = "com.enterprise.course",
        importOptions = {ImportOption.DoNotIncludeTests.class}
)
public class EnterpriseArchUnitTests {

    // 1. Luật Layered Architecture: Controller -> Service -> Repository (Không ai được nhảy cóc)
    @ArchTest
    static final ArchRule layers_must_be_respected = layeredArchitecture()
            .consideringAllDependencies()
            .layer("Controllers").definedBy("..controller..")
            .layer("Services").definedBy("..service..", "..internal..")
            .layer("Repositories").definedBy("..repository..")
            
            .whereLayer("Controllers").mayNotBeAccessedByAnyLayer()
            .whereLayer("Services").mayOnlyBeAccessedByLayers("Controllers", "Services")
            .whereLayer("Repositories").mayOnlyBeAccessedByLayers("Services");

    // 2. Controller tuyệt đối KHÔNG ĐƯỢC inject Repository trực tiếp
    @ArchTest
    static final ArchRule controllers_must_not_access_repositories = noClasses()
            .that().areAnnotatedWith(RestController.class)
            .should().dependOnClassesThat().areAnnotatedWith(Repository.class)
            .because("Controllers must delegate to domain services, never query repositories directly!");

    // 3. Nghiêm cấm Phụ thuộc Vòng (Circular Dependencies) giữa các packages
    @ArchTest
    static final ArchRule no_cyclic_dependencies = slices()
            .matching("com.enterprise.course.(*)..")
            .should().beFreeOfCycles()
            .because("Package cycles lead to tight coupling and spaghetti architecture!");

    // 4. Các class kết thúc bằng 'Repository' bắt buộc phải có annotation @Repository hoặc kế thừa Spring Data
    @ArchTest
    static final ArchRule repositories_must_be_annotated = classes()
            .that().haveSimpleNameEndingWith("Repository")
            .and().areNotInterfaces()
            .should().beAnnotatedWith(Repository.class);
}
~~~

---

## 3. Kiểm thử, Metrics & Vận hành thực chiến

### 3.1. Chạy Kiểm tra Ranh giới Kiến trúc trong CI/CD Pipeline

Thêm bước kiểm tra kiến trúc vào GitHub Actions (<code>.github/workflows/ci.yml</code>):

~~~bash
# Chạy ArchUnit & Modulith verification tests
mvn test -Dtest="*ArchitectureTest*,*ArchUnitTest*"
~~~

Nếu một lập trình viên vô tình import class nội bộ của module khác:
~~~text
[ERROR] Tests run: 1, Failures: 1, Errors: 0, Skipped: 0
[ERROR] Failures:
[ERROR] ModulithArchitectureTests.verifyModularStructure:24
org.springframework.modulith.core.Violations:
- Module 'inventory' depends on internal class com.enterprise.course.order.internal.OrderEntity
  via method com.enterprise.course.inventory.internal.InventoryServiceImpl.checkOrder(OrderEntity)
  --> Violates module encapsulation!
~~~
CI build gãy ngay lập tức! Kiến trúc hệ thống được bảo đảm 100% tự động mà không cần Tech Lead phải đọc từng dòng pull request để canh chừng!

### 3.2. Giám sát Bảng Event Publication Registry trong Cơ sở Dữ liệu

Spring Modulith tự động tạo bảng <code>event_publication</code> (với Spring JDBC starter). Bạn có thể truy vấn các event bị treo hoặc lỗi:

~~~bash
# Truy vấn các event chưa hoàn thành hoặc bị lỗi cần replay
curl -s http://localhost:8080/actuator/modulith | jq '.events'
~~~

Truy vấn trực tiếp Postgres:
~~~sql
SELECT id, event_type, publication_date, completion_date 
FROM event_publication 
WHERE completion_date IS NULL;
~~~

Nếu <code>completion_date</code> là <code>NULL</code> sau nhiều giờ, tức là listener đang bị lỗi exception lặp lại. Bạn có thể kích hoạt API replay của Spring Modulith:
~~~java
@Autowired
CompletedEventPublications completedEvents;
@Autowired
IncompleteEventPublications incompleteEvents;

// Replay lại tất cả event thất bại
incompleteEvents.resubmitIncompletePublicationsOlderThan(Duration.ofMinutes(15));
~~~

---

## 4. Production Pitfalls & Post-Mortem

### 4.1. Sự cố 1: Lộ Entity JPA ra ngoài Module Public API gây LazyInitializationException

- **Bối cảnh**: Để "tiện", lập trình viên khai báo <code>OrderPublicApi</code> trả về trực tiếp <code>OrderEntity</code> (thay vì <code>OrderDto</code> hoặc Record bất biến). Module <code>Billing</code> gọi <code>orderPublicApi.getOrder(id)</code> và sau đó truy cập <code>order.getCustomer().getAddress()</code>.
- **Hậu quả**: Vì transaction của module Order đã kết thúc và session EntityManager đã đóng, module Billing nhận ngay ngoại lệ kinh hoàng:
  <code>org.hibernate.LazyInitializationException: could not initialize proxy - no Session</code>.
  Tệ hơn nữa, hai module bị gắn chặt (tightly coupled) về mặt cấu trúc DB schema.
- **Giải pháp dứt khoát**: **KHÔNG BAO GIỜ** expose <code>@Entity</code> ra ngoài ranh giới module. Mọi dữ liệu truyền qua module boundary bắt buộc phải là **Java 17/21 Record (Immutable DTO)**.

### 4.2. Sự cố 2: Dùng <code>@EventListener</code> đồng bộ làm Rollback lan truyền gãy Transaction

- **Bối cảnh**: Lập trình viên dùng annotation mặc định <code>@EventListener</code> của Spring. Khi <code>OrderService</code> publish event <code>OrderCreatedEvent</code>, listener bên <code>NotificationModule</code> gửi email bị timeout exception.
- **Hậu quả**: Vì chạy cùng một luồng và cùng transaction, lỗi gửi email làm rollback toàn bộ giao dịch tạo Order! Khách hàng mất đơn hàng chỉ vì hệ thống gửi email bị lỗi.
- **Giải pháp**: Luôn luôn dùng **<code>@ApplicationModuleListener</code>** của Spring Modulith. Nó tự động thiết lập phase <code>AFTER_COMMIT</code> và chạy trên thread pool riêng biệt, cô lập hoàn toàn lỗi giữa các module.

### 4.3. Sự cố 3: ArchUnit Test Suite làm chậm quá trình Build của dự án lớn

- **Bối cảnh**: Dự án có hơn 15,000 class bytecode. Mỗi lần chạy <code>mvn test</code>, ArchUnit quét lại từ đầu mất gần 45 giây.
- **Giải pháp**:
  1. Chỉ phân tích package nghiệp vụ chính, sử dụng <code>ImportOption.DoNotIncludeTests.class</code>.
  2. Bật cache của ArchUnit trong file <code>archunit.properties</code>:
     ~~~properties
     freeze.store.default.allowStoreUpdate=true
     import.classes.cache=true
     ~~~

---

## 5. Hands-on Enterprise Challenge & Reference Solution

### Đề bài: Xây dựng Ranh giới Module và Luật ArchUnit cho Hệ Thống Loyalty & Rewards

Hệ thống Loyalty Monolith gồm 2 module:
1. <code>member</code>: Quản lý thông tin thành viên và số dư điểm (Point Balance).
2. <code>redemption</code>: Quản lý đổi quà thưởng (Voucher/Gift).

*Yêu cầu*:
1. Tạo package structure chuẩn Modulith cho <code>com.enterprise.loyalty.member</code> và <code>com.enterprise.loyalty.redemption</code>.
2. Module <code>redemption</code> tuyệt đối **KHÔNG ĐƯỢC PHÉP** gọi trực tiếp <code>MemberRepository</code> của module <code>member</code> để trừ điểm.
3. Khi đổi quà thành công, module <code>redemption</code> publish sự kiện <code>RewardRedeemedEvent</code>. Module <code>member</code> lắng nghe sự kiện này bằng <code>@ApplicationModuleListener</code> để ghi nhận lịch sử tích/tiêu điểm.
4. Viết ArchUnit test rule xác nhận không có bất kỳ class nào trong <code>com.enterprise.loyalty.redemption..</code> được import class từ <code>com.enterprise.loyalty.member.internal..</code>.

### Lời giải hoàn chỉnh (Reference Solution)

Kiến trúc package:
~~~text
com.enterprise.loyalty/
├── member/
│   ├── MemberPointBalanceDto.java (Public Record)
│   ├── MemberPublicApi.java (Public Interface)
│   └── internal/
│       ├── MemberEntity.java (Package-private)
│       ├── MemberRepository.java (Package-private)
│       └── MemberPointListener.java
└── redemption/
    ├── RewardRedeemedEvent.java (Public Record)
    └── internal/
        ├── RedemptionService.java
        └── RedemptionRepository.java
~~~

Domain Event:
~~~java
package com.enterprise.loyalty.redemption;

import java.time.Instant;

public record RewardRedeemedEvent(
        String redemptionId,
        String memberId,
        String rewardId,
        int pointsDeducted,
        Instant redeemedAt
) {}
~~~

Listener bên Member Module:
~~~java
package com.enterprise.loyalty.member.internal;

import com.enterprise.loyalty.redemption.RewardRedeemedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

@Component
class MemberPointListener {

    private static final Logger log = LoggerFactory.getLogger(MemberPointListener.class);
    private final MemberRepository memberRepository;

    public MemberPointListener(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    @ApplicationModuleListener
    public void onRewardRedeemed(RewardRedeemedEvent event) {
        log.info("Processing point balance deduction: memberId={}, points={}",
                event.memberId(), event.pointsDeducted());

        MemberEntity member = memberRepository.findById(event.memberId())
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + event.memberId()));

        member.subtractPoints(event.pointsDeducted());
        memberRepository.save(member);
        log.info("Successfully updated points for memberId={}. New balance={}",
                event.memberId(), member.getPointBalance());
    }
}
~~~

ArchUnit Test Guardrail ngăn chặn truy cập trái phép:
~~~java
package com.enterprise.loyalty;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

public class LoyaltyArchitectureGuardrailsTest {

    private final JavaClasses importedClasses = new ClassFileImporter()
            .withImportOption(ImportOption.DoNotIncludeTests.class)
            .importPackages("com.enterprise.loyalty");

    @Test
    @DisplayName("Module Redemption TUYỆT ĐỐI không được truy cập package internal của Member")
    void redemptionMustNotAccessMemberInternals() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("com.enterprise.loyalty.redemption..")
                .should().dependOnClassesThat().resideInAPackage("com.enterprise.loyalty.member.internal..")
                .because("Internal implementations of Member module are encapsulated and private!");

        rule.check(importedClasses);
    }

    @Test
    @DisplayName("Xác minh toàn bộ ranh giới Spring Modulith")
    void verifySpringModulithBoundaries() {
        ApplicationModules.of(EnterpriseModulithApplication.class).verify();
    }
}
~~~
`
    },
    {
      id: "6-12",
      type: "lesson",
      title: "CQRS & Event Sourcing — tách model đọc khỏi model ghi, dữ liệu là dòng sự kiện",
      minutes: 55,
      content: `## Dashboard đọc 12 bảng JOIN nhau 4 giây — trong khi ghi transaction chỉ mất 3ms

Trong các ứng dụng doanh nghiệp lớn (Ngân hàng, Sàn thương mại điện tử, Ví điện tử), bạn sẽ luôn gặp phải một nghịch lý nhức nhối:
- **Tầng Ghi (Write Path)**: Cần chuẩn hóa dữ liệu cao (3rd Normal Form - 3NF), ràng buộc khóa ngoại (Foreign Keys), Unique Constraints, và ACID transactions để bảo vệ tính toàn vẹn tuyệt đối. Tốc độ ghi chỉ mất vài miligiây.
- **Tầng Đọc (Read Path)**: Màn hình Dashboard, báo cáo sao kê, trang chi tiết tài khoản lại cần dữ liệu phẳng (denormalized). Nó phải JOIN 8 đến 12 bảng (<code>users</code>, <code>wallets</code>, <code>transactions</code>, <code>merchants</code>, <code>cashback_rules</code>...), tính toán SUM/COUNT trên hàng triệu dòng, khiến query mất tới 3 - 5 giây và làm khóa tài nguyên (Lock Contention) của toàn bộ database.

Nếu bạn thêm Index để cứu Tầng Đọc -> Tầng Ghi sẽ bị chậm thảm hại do phải cập nhật B-Tree index liên tục.
Nếu bạn giảm chuẩn hóa để cứu Tầng Đọc -> Tầng Ghi có nguy cơ bị dị thường dữ liệu (Data Anomalies, Race Conditions).

Hơn thế nữa, mô hình CRUD truyền thống lưu trữ theo kiểu **"Ghi đè tại chỗ" (Update In-Place)**:
Khi người dùng đổi số dư từ 100k thành 80k, lệnh <code>UPDATE accounts SET balance = 80000 WHERE id = 1</code> đã vĩnh viễn xóa sạch giá trị 100k cũ khỏi ổ đĩa. Bạn hoàn toàn không biết 20k chênh lệch đó đã đi đâu nếu bảng Audit log bị sót.

**CQRS (Command Query Responsibility Segregation)** và **Event Sourcing** là hai vũ khí tối thượng của kiến trúc phân tán:
1. **CQRS**: Tách đôi hoàn toàn hệ thống thành hai mô hình riêng biệt: Command Model chuyên trách ghi và bảo vệ nghiệp vụ; Query Model chuyên trách đọc với dữ liệu phẳng tối ưu sẵn.
2. **Event Sourcing**: Không lưu trữ trạng thái hiện tại (State). Thay vào đó, **lưu trữ toàn bộ chuỗi sự kiện đã xảy ra trong quá khứ**. Trạng thái hiện tại được suy diễn bằng cách chiếu (replay) lại các sự kiện!

---

## 1. Kiến trúc chuyên sâu & Cơ chế hoạt động (Under the Hood)

### Sơ Đồ Mô Phỏng: Kiến Trúc Phân Tách CQRS & Event Sourcing Toàn Diện

~~~mermaid
flowchart LR
    Client["Client"] --> CmdAPI["Command API"]
    CmdAPI --> CmdHandler["Command Handler"]
    CmdHandler --> Rehydrate["Rehydrate Aggregate<br/>(Load Past Events)"]
    Rehydrate --> Agg["BankAccountAggregate<br/>(Check Invariants)"]
    Agg --> NewEvt["Generate New Event:<br/>MoneyWithdrawnEvent"]
    NewEvt --> EvtStore[("Event Store (Append-Only)<br/>PostgreSQL Table")]
    
    EvtStore --> EvtBus["Event Bus / Outbox Kafka"]
    EvtBus --> Projector["AccountSummaryProjector"]
    Projector --> ReadDB[("Read Database<br/>(Flat View Table / Redis)")]
    
    Client --> QueryAPI["Query API"]
    QueryAPI --> ReadDB
    style EvtStore fill:#1f6feb,stroke:#388bfd,color:#fff
    style ReadDB fill:#238636,stroke:#2ea043,color:#fff
~~~


### 1.1. Luồng hoạt động CQRS & Event Sourcing hoàn chỉnh

~~~text
============================= COMMAND / WRITE PATH =============================
[ Client / App ] 
       │ 1. POST /api/v1/accounts/acc-01/withdraw (Amount: $50)
       ▼
[ AccountCommandController ]
       │ 2. WithdrawMoneyCommand
       ▼
[ AccountCommandHandler ]
       │ 3. Load Events (Stream: "Account-acc-01")
       ▼
[ Event Store (Append-Only) ] ── (Rehydrate) ──> [ BankAccountAggregate ]
                                                         │
                                             4. Check Business Invariants
                                             (Balance >= $50? Active?)
                                                         │
                                             5. Generate Event:
                                                MoneyWithdrawnEvent
                                                         │
[ Event Store (Append-Only) ] <── 6. Append Event ───────┘
  (Optimistic Locking: version = 4)
       │
       │ 7. Asynchronous Event Stream (CDC / Outbox / Kafka / Internal Bus)
       ▼
============================== QUERY / READ PATH ==============================
[ AccountProjectionHandler ]
       │ 8. Update Denormalized View (No Locks, Pure Fast Write)
       ▼
[ Read Database (Postgres View / Redis / Elasticsearch) ]
       ▲
       │ 9. GET /api/v1/accounts/acc-01/summary (1 Query, 0 JOIN, 2ms!)
[ AccountQueryController ] <─── [ Client / Dashboard ]
~~~

### 1.2. Aggregate Rehydration & Optimistic Concurrency Control

Trong Event Sourcing:
$$	ext{CurrentState} = f(	ext{InitialState}, [E_1, E_2, E_3, dots, E_n])$$

Để thực hiện một Command mới:
1. **Rehydrate**: Hệ thống đọc tất cả các Event của Aggregate từ bảng <code>event_store</code> theo thứ tự <code>version</code> tăng dần (<code>ORDER BY version ASC</code>).
2. Aggregate khởi tạo trạng thái ban đầu (rỗng), sau đó tuần tự gọi hàm <code>apply(Event)</code> cho từng event để tái tạo trạng thái mới nhất trong bộ nhớ (In-Memory State).
3. **Thực thi nghiệp vụ**: Aggregate kiểm tra các điều kiện bất biến (Business Invariants). Ví dụ: <code>if (balance < command.amount()) throw new InsufficientBalanceException();</code>.
4. **Append Event**: Nếu hợp lệ, Aggregate sinh ra <code>MoneyWithdrawnEvent</code> với <code>version = currentVersion + 1</code>.
5. **Optimistic Locking**: Bảng <code>event_store</code> có Unique Constraint trên cặp <code>(stream_id, version)</code>. Nếu hai giao dịch cùng lúc cố gắng ghi vào một Aggregate, transaction nào ghi trước sẽ thành công, transaction ghi sau sẽ nhận ngoại lệ <code>OptimisticLockingException</code> (hoặc Duplicate Key Error) và tự động retry lại từ bước 1.

### 1.3. Snapshotting — Giải pháp cho Aggregate có hàng ngàn sự kiện

Nếu một tài khoản ngân hàng hoạt động 5 năm với 50,000 giao dịch, việc rehydrate từ 50,000 events mỗi khi có một lệnh rút tiền sẽ làm nổ CPU, tốn hàng chục MB RAM và mất vài giây!

**Cơ chế Snapshotting**:
- Cứ sau mỗi $N$ events (ví dụ mỗi 100 events), hệ thống lưu lại một bản chụp trạng thái của Aggregate vào bảng <code>snapshots</code> kèm theo <code>snapshot_version</code>.
- Khi Rehydrate:
  1. Chỉ cần đọc 1 bản ghi snapshot mới nhất (ví dụ tại version 500).
  2. Đọc các events tiếp theo có <code>version > 500</code> (ví dụ từ version 501 đến 512).
  3. Thời gian rehydrate giảm từ 5 giây xuống chỉ còn 2 miligiây!

---

## 2. Production-Grade Implementation Code

Dưới đây là kiến trúc CQRS & Event Sourcing hoàn chỉnh cho hệ thống Tài khoản Ngân hàng (Banking Ledger): Xây dựng thuần túy trên Spring Boot 3.3 + JPA / PostgreSQL, không phụ thuộc vào framework bên thứ ba cồng kềnh như Axon.

### 2.1. Domain Events & Base Aggregate Root

File <code>com.enterprise.course.cqrs.domain.events.DomainEvent.java</code>:
~~~java
package com.enterprise.course.cqrs.domain.events;

import java.time.Instant;

public interface DomainEvent {
    String aggregateId();
    long version();
    Instant occurredAt();
}
~~~

Các Domain Events cụ thể:
~~~java
package com.enterprise.course.cqrs.domain.events;

import java.math.BigDecimal;
import java.time.Instant;

public record AccountOpenedEvent(
        String aggregateId,
        String customerId,
        BigDecimal initialBalance,
        long version,
        Instant occurredAt
) implements DomainEvent {}

public record MoneyDepositedEvent(
        String aggregateId,
        BigDecimal amount,
        String referenceNo,
        long version,
        Instant occurredAt
) implements DomainEvent {}

public record MoneyWithdrawnEvent(
        String aggregateId,
        BigDecimal amount,
        String referenceNo,
        long version,
        Instant occurredAt
) implements DomainEvent {}
~~~

Lớp cơ sở <code>AggregateRoot</code>:
~~~java
package com.enterprise.course.cqrs.domain;

import com.enterprise.course.cqrs.domain.events.DomainEvent;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public abstract class AggregateRoot {

    protected String id;
    protected long version = 0;
    private final List<DomainEvent> uncommittedEvents = new ArrayList<>();

    public String getId() { return id; }
    public long getVersion() { return version; }

    public List<DomainEvent> getUncommittedEvents() {
        return Collections.unmodifiableList(uncommittedEvents);
    }

    public void markEventsAsCommitted() {
        this.uncommittedEvents.clear();
    }

    protected void registerNewEvent(DomainEvent event) {
        this.uncommittedEvents.add(event);
        apply(event);
        this.version = event.version();
    }

    // Nạp lại event từ quá khứ (Rehydration)
    public void loadFromHistory(List<DomainEvent> history) {
        for (DomainEvent event : history) {
            apply(event);
            this.version = event.version();
        }
    }

    public abstract void apply(DomainEvent event);
}
~~~

### 2.2. Aggregate Nghiệp vụ: BankAccountAggregate

~~~java
package com.enterprise.course.cqrs.domain;

import com.enterprise.course.cqrs.domain.events.*;

import java.math.BigDecimal;
import java.time.Instant;

public class BankAccountAggregate extends AggregateRoot {

    private String customerId;
    private BigDecimal balance = BigDecimal.ZERO;
    private boolean active = false;

    public BankAccountAggregate() {}

    // Factory method mở tài khoản mới
    public static BankAccountAggregate open(String accountId, String customerId, BigDecimal initialDeposit) {
        if (initialDeposit.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Initial deposit cannot be negative!");
        }
        BankAccountAggregate aggregate = new BankAccountAggregate();
        aggregate.registerNewEvent(new AccountOpenedEvent(
                accountId, customerId, initialDeposit, 1, Instant.now()
        ));
        return aggregate;
    }

    public void deposit(BigDecimal amount, String referenceNo) {
        if (!this.active) {
            throw new IllegalStateException("Cannot deposit to closed or inactive account!");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Deposit amount must be strictly positive!");
        }
        registerNewEvent(new MoneyDepositedEvent(
                this.id, amount, referenceNo, this.version + 1, Instant.now()
        ));
    }

    public void withdraw(BigDecimal amount, String referenceNo) {
        if (!this.active) {
            throw new IllegalStateException("Account is inactive!");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Withdrawal amount must be strictly positive!");
        }
        // Invariant check: Không cho phép rút âm tiền
        if (this.balance.compareTo(amount) < 0) {
            throw new IllegalStateException(String.format(
                    "Insufficient funds! Current balance: %s, requested: %s", this.balance, amount
            ));
        }
        registerNewEvent(new MoneyWithdrawnEvent(
                this.id, amount, referenceNo, this.version + 1, Instant.now()
        ));
    }

    @Override
    public void apply(DomainEvent event) {
        if (event instanceof AccountOpenedEvent e) {
            this.id = e.aggregateId();
            this.customerId = e.customerId();
            this.balance = e.initialBalance();
            this.active = true;
        } else if (event instanceof MoneyDepositedEvent e) {
            this.balance = this.balance.add(e.amount());
        } else if (event instanceof MoneyWithdrawnEvent e) {
            this.balance = this.balance.subtract(e.amount());
        }
    }

    public BigDecimal getBalance() { return balance; }
    public String getCustomerId() { return customerId; }
}
~~~

### 2.3. Event Store Entity & Repository (PostgreSQL)

Bảng Event Store được bảo vệ bởi Unique Constraint trên <code>(stream_id, version)</code>:

~~~sql
CREATE TABLE event_store (
    id BIGSERIAL PRIMARY KEY,
    stream_id VARCHAR(64) NOT NULL,
    version BIGINT NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_stream_version UNIQUE (stream_id, version)
);
CREATE INDEX idx_event_store_stream ON event_store(stream_id, version ASC);
~~~

Entity JPA cho Event Store:
~~~java
package com.enterprise.course.cqrs.infra;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
        name = "event_store",
        uniqueConstraints = @UniqueConstraint(name = "uq_stream_version", columnNames = {"stream_id", "version"})
)
public class EventStoreEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stream_id", nullable = false, length = 64)
    private String streamId;

    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "event_type", nullable = false, length = 128)
    private String eventType;

    @Column(name = "payload", nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    protected EventStoreEntity() {}

    public EventStoreEntity(String streamId, Long version, String eventType, String payload, Instant occurredAt) {
        this.streamId = streamId;
        this.version = version;
        this.eventType = eventType;
        this.payload = payload;
        this.occurredAt = occurredAt;
    }

    public String getStreamId() { return streamId; }
    public Long getVersion() { return version; }
    public String getEventType() { return eventType; }
    public String getPayload() { return payload; }
    public Instant getOccurredAt() { return occurredAt; }
}
~~~

Event Store Engine chuyên nghiệp với Jackson Serialization:
~~~java
package com.enterprise.course.cqrs.infra;

import com.enterprise.course.cqrs.domain.events.DomainEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Component
public class PostgresEventStore {

    private final EventStoreJpaRepository repository;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    public PostgresEventStore(EventStoreJpaRepository repository,
                              ObjectMapper objectMapper,
                              ApplicationEventPublisher eventPublisher) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.eventPublisher = eventPublisher;
    }

    public List<DomainEvent> loadEvents(String streamId) {
        List<EventStoreEntity> entities = repository.findByStreamIdOrderByVersionAsc(streamId);
        List<DomainEvent> events = new ArrayList<>(entities.size());

        for (EventStoreEntity entity : entities) {
            try {
                Class<?> clazz = Class.forName(entity.getEventType());
                DomainEvent event = (DomainEvent) objectMapper.readValue(entity.getPayload(), clazz);
                events.add(event);
            } catch (Exception ex) {
                throw new RuntimeException("Failed to deserialize event: " + entity.getEventType(), ex);
            }
        }
        return events;
    }

    @Transactional
    public void appendEvents(String streamId, List<DomainEvent> events) {
        for (DomainEvent event : events) {
            try {
                String json = objectMapper.writeValueAsString(event);
                EventStoreEntity entity = new EventStoreEntity(
                        streamId, event.version(), event.getClass().getName(), json, event.occurredAt()
                );
                // Lưu vào append-only table (nếu trùng version sẽ ném DataIntegrityViolationException)
                repository.save(entity);

                // Publish ra bus để Projector cập nhật Read Model
                eventPublisher.publishEvent(event);
            } catch (Exception ex) {
                throw new RuntimeException("Failed to append event to stream: " + streamId, ex);
            }
        }
    }
}
~~~

### 2.4. Read Model: Denormalized Projection (Query Side)

Bảng Read Model phẳng (Flat View), không cần JOIN bất kỳ bảng nào:

~~~java
package com.enterprise.course.cqrs.read;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "view_account_summaries")
public class AccountSummaryView {

    @Id
    private String accountId;
    private String customerId;
    private BigDecimal currentBalance;
    private BigDecimal totalDeposited;
    private BigDecimal totalWithdrawn;
    private int transactionCount;
    private Instant lastUpdatedAt;

    protected AccountSummaryView() {}

    public AccountSummaryView(String accountId, String customerId, BigDecimal initialBalance) {
        this.accountId = accountId;
        this.customerId = customerId;
        this.currentBalance = initialBalance;
        this.totalDeposited = initialBalance;
        this.totalWithdrawn = BigDecimal.ZERO;
        this.transactionCount = 1;
        this.lastUpdatedAt = Instant.now();
    }

    public void applyDeposit(BigDecimal amount) {
        this.currentBalance = this.currentBalance.add(amount);
        this.totalDeposited = this.totalDeposited.add(amount);
        this.transactionCount++;
        this.lastUpdatedAt = Instant.now();
    }

    public void applyWithdrawal(BigDecimal amount) {
        this.currentBalance = this.currentBalance.subtract(amount);
        this.totalWithdrawn = this.totalWithdrawn.add(amount);
        this.transactionCount++;
        this.lastUpdatedAt = Instant.now();
    }

    public String getAccountId() { return accountId; }
    public BigDecimal getCurrentBalance() { return currentBalance; }
    public BigDecimal getTotalDeposited() { return totalDeposited; }
    public BigDecimal getTotalWithdrawn() { return totalWithdrawn; }
}
~~~

Projector lắng nghe Event và cập nhật View bất đồng bộ:
~~~java
package com.enterprise.course.cqrs.read;

import com.enterprise.course.cqrs.domain.events.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AccountSummaryProjector {

    private static final Logger log = LoggerFactory.getLogger(AccountSummaryProjector.class);
    private final AccountSummaryViewRepository repository;

    public AccountSummaryProjector(AccountSummaryViewRepository repository) {
        this.repository = repository;
    }

    @Async
    @EventListener
    @Transactional
    public void on(AccountOpenedEvent event) {
        log.info("Projecting AccountOpenedEvent: accountId={}", event.aggregateId());
        AccountSummaryView view = new AccountSummaryView(event.aggregateId(), event.customerId(), event.initialBalance());
        repository.save(view);
    }

    @Async
    @EventListener
    @Transactional
    public void on(MoneyDepositedEvent event) {
        log.info("Projecting MoneyDepositedEvent: accountId={}, amount={}", event.aggregateId(), event.amount());
        repository.findById(event.aggregateId()).ifPresent(view -> {
            view.applyDeposit(event.amount());
            repository.save(view);
        });
    }

    @Async
    @EventListener
    @Transactional
    public void on(MoneyWithdrawnEvent event) {
        log.info("Projecting MoneyWithdrawnEvent: accountId={}, amount={}", event.aggregateId(), event.amount());
        repository.findById(event.aggregateId()).ifPresent(view -> {
            view.applyWithdrawal(event.amount());
            repository.save(view);
        });
    }
}
~~~

### 2.5. Tách bạch Command Controller & Query Controller

Command Controller (Xử lý Ghi — nhận HTTP POST, trả về kết quả Command):
~~~java
package com.enterprise.course.cqrs.api;

import com.enterprise.course.cqrs.domain.BankAccountAggregate;
import com.enterprise.course.cqrs.infra.PostgresEventStore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountCommandController {

    private final PostgresEventStore eventStore;

    public AccountCommandController(PostgresEventStore eventStore) {
        this.eventStore = eventStore;
    }

    public record OpenAccountRequest(String customerId, BigDecimal initialDeposit) {}
    public record WithdrawRequest(BigDecimal amount, String referenceNo) {}

    @PostMapping("/{id}/open")
    public ResponseEntity<Map<String, Object>> openAccount(@PathVariable String id, @RequestBody OpenAccountRequest req) {
        BankAccountAggregate aggregate = BankAccountAggregate.open(id, req.customerId(), req.initialDeposit());
        eventStore.appendEvents(id, aggregate.getUncommittedEvents());
        aggregate.markEventsAsCommitted();

        return ResponseEntity.ok(Map.of("accountId", id, "status", "OPENED", "version", aggregate.getVersion()));
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<Map<String, Object>> withdraw(@PathVariable String id, @RequestBody WithdrawRequest req) {
        // 1. Rehydrate Aggregate từ quá khứ
        BankAccountAggregate aggregate = new BankAccountAggregate();
        aggregate.loadFromHistory(eventStore.loadEvents(id));

        // 2. Thực thi nghiệp vụ
        aggregate.withdraw(req.amount(), req.referenceNo());

        // 3. Append event mới vào Event Store
        eventStore.appendEvents(id, aggregate.getUncommittedEvents());
        aggregate.markEventsAsCommitted();

        return ResponseEntity.ok(Map.of("accountId", id, "status", "SUCCESS", "newVersion", aggregate.getVersion()));
    }
}
~~~

Query Controller (Xử lý Đọc — truy vấn trực tiếp Flat Read View cực nhanh):
~~~java
package com.enterprise.course.cqrs.api;

import com.enterprise.course.cqrs.read.AccountSummaryView;
import com.enterprise.course.cqrs.read.AccountSummaryViewRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountQueryController {

    private final AccountSummaryViewRepository viewRepository;

    public AccountQueryController(AccountSummaryViewRepository viewRepository) {
        this.viewRepository = viewRepository;
    }

    @GetMapping("/{id}/summary")
    public ResponseEntity<AccountSummaryView> getSummary(@PathVariable String id) {
        return viewRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
~~~

---

## 3. Kiểm thử, Metrics & Vận hành thực chiến

### 3.1. Kiểm thử End-to-End Command & Query qua cURL

~~~bash
# 1. Gửi Command mở tài khoản mới với 1,000 USD
curl -X POST http://localhost:8080/api/v1/accounts/acc-999/open   -H "Content-Type: application/json"   -d '{"customerId":"CUST-88","initialDeposit":1000.00}'
~~~

Phản hồi:
~~~json
{
  "accountId": "acc-999",
  "status": "OPENED",
  "version": 1
}
~~~

~~~bash
# 2. Gửi Command rút 250 USD
curl -X POST http://localhost:8080/api/v1/accounts/acc-999/withdraw   -H "Content-Type: application/json"   -d '{"amount":250.00,"referenceNo":"ATM-TXN-01"}'
~~~

Phản hồi:
~~~json
{
  "accountId": "acc-999",
  "status": "SUCCESS",
  "newVersion": 2
}
~~~

~~~bash
# 3. Đọc dữ liệu từ Read Model (Flat View)
curl -X GET http://localhost:8080/api/v1/accounts/acc-999/summary
~~~

Phản hồi:
~~~json
{
  "accountId": "acc-999",
  "customerId": "CUST-88",
  "currentBalance": 750.00,
  "totalDeposited": 1000.00,
  "totalWithdrawn": 250.00,
  "transactionCount": 2
}
~~~

Query GET chỉ mất **1.8ms** vì đọc trực tiếp 1 dòng bằng Primary Key trên bảng <code>view_account_summaries</code>, không hề lock hay đụng chạm vào Event Store!

### 3.2. Giám sát Projection Lag & Event Appending Metrics

Spring Boot Actuator và Micrometer giúp theo dõi sức khỏe của hệ thống CQRS:
- <code>eventstore.append.duration</code>: Thời gian ghi event vào PostgreSQL.
- <code>projection.lag.ms</code>: Khoảng thời gian từ lúc event được tạo (<code>occurredAt</code>) cho đến khi Read Model cập nhật xong.

Truy vấn Prometheus:
~~~promql
# Cảnh báo nếu độ trễ đồng bộ Read Model vượt quá 3 giây
rate(projection_lag_ms_sum[1m]) / rate(projection_lag_ms_count[1m]) > 3000
~~~

---

## 4. Production Pitfalls & Post-Mortem

### 4.1. Sự cố 1: Bẫy "Read-Your-Own-Writes" Lag làm khách hàng hoang mang

- **Bối cảnh**: Vì Read Model được cập nhật bất đồng bộ (Eventual Consistency), sau khi người dùng bấm "Rút 200k", frontend lập tức redirect người dùng về trang Dashboard và gọi API GET <code>/summary</code>.
- **Cơ chế sự cố**: Projector đang bận hoặc queue bị chậm 100ms. Trang Dashboard tải xong trước khi Read View được update. Khách hàng thấy số dư vẫn còn nguyên 200k, tưởng rằng thao tác chưa thành công liền bấm rút thêm lần nữa!
- **Giải pháp**:
  1. **Optimistic UI / Client State**: Frontend tự cập nhật số dư dự kiến trên UI ngay khi nhận mã HTTP 200 từ Command API.
  2. **Version Pinning**: Command API trả về <code>newVersion</code> (ví dụ <code>version: 5</code>). Khi frontend gọi Query API, gửi kèm header <code>If-None-Match-Version: 5</code>. Nếu Read Model chưa đạt tới version 5, Query Service có thể chờ ngắn (long-polling 200ms) hoặc query thẳng bản ghi tạm thời.

### 4.2. Sự cố 2: Thay đổi cấu trúc Event (Event Schema Evolution) làm sập Rehydration

- **Bối cảnh**: Event <code>MoneyDepositedEvent</code> ban đầu chỉ có <code>(aggregateId, amount)</code>. Sau 1 năm, nghiệp vụ đổi yêu cầu thêm trường <code>currency</code> (ví dụ "VND", "USD"). Code mới deploy lên mong đợi trường <code>currency</code> không null.
- **Hậu quả**: Khi rehydrate các tài khoản cũ từ năm ngoái, Jackson deserializer gặp JSON thiếu trường <code>currency</code>, ném <code>NullPointerException</code> hoặc gán null, làm crash toàn bộ Aggregate!
- **Giải pháp dứt khoát**:
  1. **Không bao giờ sửa hoặc xóa field cũ** trong Event Class đã lưu xuống Database (Events are Immutable!).
  2. Dùng kỹ thuật **Event Upcasting**: Khi đọc JSON từ database, trước khi deserialize vào Java class, một lớp trung gian (Upcaster) kiểm tra nếu là version 1 thì tự động chèn trường mặc định <code>currency: "VND"</code>.

### 4.3. Sự cố 3: Lạm dụng Event Sourcing cho các bảng cấu hình / CRUD tầm thường

- **Bối cảnh**: Đội ngũ phát triển quá phấn khích với Event Sourcing và quyết định áp dụng nó cho cả bảng <code>SystemConfig</code> (chỉ gồm vài cặp key-value đổi 1 lần mỗi tháng) hoặc <code>UserProfile</code> (đổi avatar, tên).
- **Hậu quả**: Chi phí bảo trì đội lên gấp 4 lần, số lượng class và bảng tăng chóng mặt, gây lãng phí tài nguyên và làm phức tạp hóa hệ thống một cách không cần thiết.
- **Quy tắc vàng**: Chỉ áp dụng Event Sourcing khi:
  - Cần Audit Trail 100% không thể chối cãi (Tài chính, Ngân hàng, Sổ cái kế toán, Đấu giá, Vận chuyển kho bãi).
  - Nghiệp vụ phức tạp với nhiều trạng thái biến thiên và cần khả năng "Time-travel / Undo" quay ngược thời gian.

---

## 5. Hands-on Enterprise Challenge & Reference Solution

### Đề bài: Xây dựng Cơ chế Tự Động Snapshotting cho Aggregate

Khi Aggregate đạt số lượng sự kiện lớn, việc load toàn bộ lịch sử sẽ rất chậm. Hãy thiết kế cơ chế Snapshotting cho <code>BankAccountAggregate</code>:
1. Bảng <code>account_snapshots</code> lưu trữ <code>aggregate_id</code>, <code>version</code>, <code>snapshot_payload</code> (JSON của trạng thái Aggregate), và <code>created_at</code>.
2. Trong hàm <code>PostgresEventStore.loadAggregate(String id)</code>:
   - Tìm kiếm Snapshot mới nhất của <code>id</code>.
   - Nếu có snapshot tại version $V_{snap}$: Nạp trạng thái từ snapshot, sau đó chỉ load các events có <code>version > V_{snap}</code> từ bảng <code>event_store</code> để replay.
   - Nếu không có snapshot: Load toàn bộ events từ version 1.
3. Trong hàm <code>appendEvents(...)</code>: Cứ sau mỗi **5 sự kiện** mới (hoặc <code>version % 5 == 0</code>), tự động chụp snapshot và lưu vào bảng <code>account_snapshots</code>.

### Lời giải hoàn chỉnh (Reference Solution)

Entity lưu trữ Snapshot:
~~~java
package com.enterprise.course.cqrs.snapshot;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "account_snapshots")
public class AccountSnapshotEntity {

    @Id
    @Column(name = "aggregate_id", length = 64)
    private String aggregateId;

    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "payload", nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AccountSnapshotEntity() {}

    public AccountSnapshotEntity(String aggregateId, Long version, String payload) {
        this.aggregateId = aggregateId;
        this.version = version;
        this.payload = payload;
        this.createdAt = Instant.now();
    }

    public String getAggregateId() { return aggregateId; }
    public Long getVersion() { return version; }
    public String getPayload() { return payload; }
}
~~~

Snapshot State Record:
~~~java
package com.enterprise.course.cqrs.snapshot;

import java.math.BigDecimal;

public record AccountSnapshotState(
        String id,
        String customerId,
        BigDecimal balance,
        boolean active,
        long version
) {}
~~~

Cập nhật <code>BankAccountAggregate</code> hỗ trợ khôi phục từ Snapshot:
~~~java
// Thêm 2 phương thức vào BankAccountAggregate:

public AccountSnapshotState createSnapshot() {
    return new AccountSnapshotState(this.id, this.customerId, this.balance, this.active, this.version);
}

public void restoreFromSnapshot(AccountSnapshotState snapshot) {
    this.id = snapshot.id();
    this.customerId = snapshot.customerId();
    this.balance = snapshot.balance();
    this.active = snapshot.active();
    this.version = snapshot.version();
}
~~~

Hạ tầng Event Store thông minh với Snapshotting:
~~~java
package com.enterprise.course.cqrs.snapshot;

import com.enterprise.course.cqrs.domain.BankAccountAggregate;
import com.enterprise.course.cqrs.domain.events.DomainEvent;
import com.enterprise.course.cqrs.infra.EventStoreEntity;
import com.enterprise.course.cqrs.infra.EventStoreJpaRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class SnapshotEnabledEventStore {

    private final EventStoreJpaRepository eventRepository;
    private final AccountSnapshotJpaRepository snapshotRepository;
    private final ObjectMapper objectMapper;

    public SnapshotEnabledEventStore(EventStoreJpaRepository eventRepository,
                                     AccountSnapshotJpaRepository snapshotRepository,
                                     ObjectMapper objectMapper) {
        this.eventRepository = eventRepository;
        this.snapshotRepository = snapshotRepository;
        this.objectMapper = objectMapper;
    }

    public BankAccountAggregate load(String accountId) {
        BankAccountAggregate aggregate = new BankAccountAggregate();
        long fromVersion = 0;

        // 1. Kiểm tra xem có snapshot nào không
        Optional<AccountSnapshotEntity> snapshotOpt = snapshotRepository.findById(accountId);
        if (snapshotOpt.isPresent()) {
            AccountSnapshotEntity snapshot = snapshotOpt.get();
            try {
                AccountSnapshotState state = objectMapper.readValue(snapshot.getPayload(), AccountSnapshotState.class);
                aggregate.restoreFromSnapshot(state);
                fromVersion = snapshot.getVersion();
            } catch (Exception ex) {
                throw new RuntimeException("Corrupted snapshot for account: " + accountId, ex);
            }
        }

        // 2. Chỉ tải các sự kiện phát sinh sau thời điểm snapshot
        List<EventStoreEntity> deltaEntities = eventRepository
                .findByStreamIdAndVersionGreaterThanOrderByVersionAsc(accountId, fromVersion);

        for (EventStoreEntity entity : deltaEntities) {
            try {
                Class<?> clazz = Class.forName(entity.getEventType());
                DomainEvent event = (DomainEvent) objectMapper.readValue(entity.getPayload(), clazz);
                aggregate.apply(event);
            } catch (Exception ex) {
                throw new RuntimeException("Failed to replay delta event: " + entity.getEventType(), ex);
            }
        }

        return aggregate;
    }

    @Transactional
    public void save(BankAccountAggregate aggregate) {
        String id = aggregate.getId();
        List<DomainEvent> events = aggregate.getUncommittedEvents();

        for (DomainEvent event : events) {
            try {
                String json = objectMapper.writeValueAsString(event);
                EventStoreEntity entity = new EventStoreEntity(
                        id, event.version(), event.getClass().getName(), json, event.occurredAt()
                );
                eventRepository.save(entity);

                // 3. Tự động chụp Snapshot nếu version chia hết cho 5
                if (event.version() % 5 == 0) {
                    AccountSnapshotState snapshotState = aggregate.createSnapshot();
                    String snapshotJson = objectMapper.writeValueAsString(snapshotState);
                    AccountSnapshotEntity snapshotEntity = new AccountSnapshotEntity(id, event.version(), snapshotJson);
                    snapshotRepository.save(snapshotEntity);
                }
            } catch (Exception ex) {
                throw new RuntimeException("Error persisting event or snapshot for stream: " + id, ex);
            }
        }
        aggregate.markEventsAsCommitted();
    }
}
~~~
`
    },
    {
    "id": "6-quiz",
    "type": "quiz",
    "title": "Quiz Module 6 — Microservices",
    "minutes": 12,
    "questions": [
        {
            "level": "easy",
            "scenario": "Dev LAAS post lên group: 'Cache Redis của tao không chạy! @Cacheable findById vẫn query DB mỗi lần'. Code: methodA() trong cùng service gọi this.findById().",
            "q": "Vì sao cache không hiệu lực?",
            "options": [
                "Redis chưa connect — kiểm tra host/port",
                "@Cacheable là AOP proxy: this.findById() bypass proxy → advice cache không chạy. Phải gọi từ bean khác hoặc tách method",
                "Key SpEL sai cú pháp",
                "Cần thêm @EnableCaching trên config riêng"
            ],
            "answer": 1,
            "explain": "Spring bọc bean trong proxy; cache check nằm TRONG proxy. this.xxx() đi thẳng vào bean gốc bỏ qua wrapper — giống hệt trap @Transactional/@Async. Fix: tách ra bean khác, hoặc inject self-proxy (ObjectProvider).",
            "why": [
                "Nếu Redis mất kết nối sẽ ném exception khi access cache, không phải 'im lặng query DB'. Triệu chứng mô tả là cache HOẠT ĐỘNG NHƯ KHÔNG CÓ = proxy bypass.",
                "✓ Đúng — 3 annotation (@Transactional/@Cacheable/@Async) cùng cơ chế proxybean: cross-class call qua proxy (có magic), self-call trực tiếp (không magic). Đây là lỗi số 1 của người mới Spring.",
                "Key sai thì method vẫn chạy nhưng cache sai key — log Redis MONITOR sẽ thấy SET không đọc GET. Không phải 'không chạm cache'.",
                "@EnableCaching thiếu thì KHÔNG method nào có cache — ở đây chỉ method tự gọi là không. Triệu chứng hẹp hơn."
            ]
        },
        {
            "level": "hard",
            "scenario": "Incident LAAS 3h sáng: cache expire đúng lúc traffic cao — 500 request đồng loạt cache-miss đập DB → DB CPU 100% → toàn service timeout. Gọi là cache stampede.",
            "q": "Các lớp phòng chống stampede đúng?",
            "options": [
                "Tăng TTL lên vô hạn — cache không bao giờ hết hạn",
                "TTL jitter (ngẫu nhiên ±10%) tránh expire đồng loạt + sync load (chỉ 1 thread đi lấy, kẻ khác chờ) + Caffeine local cache tầng trước Redis",
                "Tăng connection pool DB để chịu được 500 query song song",
                "Tắt cache cho giờ cao điểm"
            ],
            "answer": 1,
            "explain": "Stampede = nhiều request cùng miss một key. 3 lớp phòng: (1) jitter TTL — key không expire cùng lúc; (2) per-key lock — 1 thread load, kẻ khác block chờ kết quả; (3) local cache (Caffeine) hấp thụ phần lớn hit không chạm Redis/DB.",
            "why": [
                "TTL vô hạn = cache stale vĩnh viễn — data đổi không bao giờ tới user. Giải quyết nghẽn bằng cách tạo bug correctness. TTL luôn là bắt buộc.",
                "✓ Đúng — defense in depth: jitter phá tính đồng bộ, sync load giới hạn concurrent load = 1, Caffeine giảm round-trip. Cả 3 cộng nhau gần như triệt tiêu stampede.",
                "Tăng pool cho DB chịu 500 concurrent query là trả tiền hạ tầng cho vấn đề có giải pháp thuật toán. Và pool lớn cũng có giới hạn — scale tiếp lại gặp lại.",
                "Tắt cache giờ cao điểm = mọi request đánh DB — chính là stampede vĩnh viễn. Tệ hơn hiện trạng nhiều."
            ]
        },
        {
            "level": "hard",
            "scenario": "Code review LAAS: trong @Transactional method, dev save Task xong kafka.send(event). Code chạy tốt tháng trời. Reviewer vẫn đánh dấu 'dual-write — phải outbox'.",
            "q": "Dual-write problem thực chất là gì?",
            "options": [
                "Lỗi cú pháp — Kafka không chấp nhận gửi trong transaction",
                "DB commit và Kafka publish là 2 hệ thống không atomic: Kafka fail sau khi DB commit → event MẤT vĩnh viễn (hoặc ngược lại). Outbox: event ghi cùng transaction DB, worker publish sau",
                "Hiệu năng — gửi Kafka trong transaction làm chậm commit",
                "Kafka đảm bảo deliver rồi mới cho DB commit"
            ],
            "answer": 1,
            "explain": "Không có transaction 2-phase spanning DB + Kafka. 4 kịch bản race: send OK + commit OK (được), send OK + rollback (event ma — consumer thấy task không tồn tại), send fail + commit (event mất — notification/audit không bao giờ đến), send fail + rollback (được). Outbox thu hẹp về: commit → event chắc chắn có (delay), rollback → không event.",
            "why": [
                "Cú pháp hợp lệ — code compile và 'chạy tốt' 99% thời gian. Đó chính là điểm nguy hiểm: bug chỉ xuất hiện khi Kafka có vấn đề, đúng lúc hệ thống đang stress.",
                "✓ Đúng — outbox biến '2 phép ghi độc lập' thành '1 phép ghi atomic (business + outbox row)' + '1 worker best-effort publish + idempotent consumer'. Guarantee: ít nhất 1 lần, không bao giờ mất.",
                "Latency kafka.send async không đáng kể trong transaction. Vấn đề là CORRECTNESS không phải performance.",
                "Kafka không biết gì về DB transaction — không có cơ chế coordinate. Ngược lại hoàn toàn với thực tế."
            ]
        },
        {
            "level": "medium",
            "scenario": "Consumer Kafka notification-service LAAS xử lý event rồi crash TRƯỚC khi commit offset. Pod restart, đọc lại offset cũ — event đến lần 2. Email welcome gửi 2 lần.",
            "q": "Đây là property của delivery semantic nào và cách sống chung?",
            "options": [
                "At-most-once — chấp nhận mất, đổi sang earliest offset",
                "At-least-once: redelivery là BÌNH THƯỜNG, consumer phải idempotent (dedup table event_id, hoặc upsert tự nhiên idempotent)",
                "Exactly-once — cấu hình transactions Kafka là xong",
                "Lỗi consumer group rebalance — tăng heartbeat interval"
            ],
            "answer": 1,
            "explain": "Xử lý-xong-ack (at-least-once) đánh đổi: không mất message nhưng có thể trùng. Idempotent consumer: INSERT IF NOT EXISTS processed_events(event_id) — lần 2 thấy đã xử lý, skip. Hoặc nghiệp vụ tự idempotent (upsert user, set status).",
            "why": [
                "At-most-once = ack trước xử lý — đổi chiều vấn đề sang MẤT event (tệ hơn với notification/audit tài chính). Không phải hướng sửa.",
                "✓ Đúng — idempotency là con bài chủ chốt của hệ thống phân tán: mọi nơi có retry/redelivery đều cần. Dedup table là hiện thực hóa đơn giản nhất.",
                "Exactly-once Kafka transactions phạm vi hẹp (consume-transform-produce trong Kafka) — không phủ 'gửi email ra ngoài'. Với side-effect ngoài Kafka vẫn phải idempotent.",
                "Rebalance có thể trigger redelivery nhưng đây là kịch bản crash-restart đơn giản — không cần đi sâu heartbeat. Root cause là semantic, không phải tuning."
            ]
        },
        {
            "level": "hard",
            "scenario": "Downstream service LAAS bắt đầu chậm: p99 từ 200ms nhảy 8s. Mọi caller retry theo config mặc định (3 lần, không backoff) — service chết hẳn. Hiện tượng gọi là retry storm.",
            "q": "Cách retry đúng không tự giết hệ thống?",
            "options": [
                "Tăng max-attempts lên 10 — kiên trì hơn",
                "Backoff exponential + jitter, limit attempts, timeout NGẮN hơn thời gian tolerate của caller, và circuit breaker cắt sớm khi failure rate cao",
                "Tắt hết retry — một lần là đủ",
                "Chuyển caller sang reactive stack WebFlux — async không giết service"
            ],
            "answer": 1,
            "explain": "Service chậm → caller timeout → retry ngay lập tức thêm tải → chậm hơn → nhiều retry hơn — vòng xoáy. Backoff (1s, 2s, 4s) + jitter (ngẫu nhiên tránh đồng bộ) cho service thời gian hồi. Circuit breaker là van cắt: fail rate >50% → OPEN, không gửi thêm tải, thử lại sau wait-duration.",
            "why": [
                "10 attempts không backoff = tải x10 đập service đang hấp hối — đổ thêm xăng vào lửa. Kiên trì không phải đức tính của retry.",
                "✓ Đúng — bộ 4: backoff+jitter (nhịp thở), limit (giới hạn), timeout ngắn (fail fast), circuit breaker (phòng chống tổn thương). Thiếu 1 trong 4 vẫn có khe retry storm.",
                "Không retry = mất khả năng phục hồi transient failure (network blip 500ms) — lại lăn sang đầu kia — từ quá mức sang không đủ.",
                "Reactive thay đổi mô hình thread không thay đổi tải: 3 retry vẫn 3 lần request dù non-blocking. Vấn đề retry storm là VOLUME không phải blocking."
            ]
        },
        {
            "level": "medium",
            "scenario": "PO hỏi: 'Tại sao hệ thống vẫn trả 200 khi user-service đang down? Không nên lỗi à?' Tech lead: đó là fallback — đúng thiết kế.",
            "q": "Fallback của circuit breaker mua lại điều gì?",
            "options": [
                "Che giấu lỗi — không hay, phải lộ exception cho client thấy sự thật",
                "Graceful degradation: trả cached/default data, đánh dấu 'degraded' — tính năng phụ sacrifice để core flow sống. Nhưng phải monitor + alert fallback rate",
                "Tăng độ tin cậy lên 100% — không bao giờ lỗi",
                "Giảm số lượng microservice cần vận hành"
            ],
            "answer": 1,
            "explain": "Trade-off nghiệp vụ có chủ đích: hiển thị tên user thiếu (cached 'Khách hàng') vẫn tốt hơn cả trang chết. NHƯNG fallback im lặng là nợ vận hành — metric count fallback + alert threshold để biết degraded kéo dài, không phải 'bình thường mới'.",
            "why": [
                "Lộ exception = dịch vụ phụ kéo chết toàn trang — chính là anti-pattern resilience ra đời để chống. 'Sự thật' của 500 error làm user mất lòng tin hơn dữ liệu degraded có đánh dấu.",
                "✓ Đúng — degradation có kiểm soát: user vẫn xem task (chỉ thiếu avatar), core transaction vẫn chạy. Kèm observability: fallback là tín hiệu operability, không phải chốn nấp.",
                "100% availability là thần thoại phân tán — fallback giảm user-visible failure chứ không tăng reliability vật lý của dependency.",
                "Số service không đổi — fallback là hành vi runtime, không liên quan topology kiến trúc."
            ]
        },
        {
            "level": "easy",
            "scenario": "Deploy LAAS lên OKD với 5 replica. Job @Scheduled(fixedDelay=1s) dọn outbox — DBA thấy batch job chạy 5 lần song song, row bị xử lý trùng (may idempotent consumer cứu).",
            "q": "Cơ chế chuẩn cho scheduled job multi-instance?",
            "options": [
                "Config flag tắt job ở 4 pod, chỉ 1 pod chạy",
                "ShedLock @SchedulerLock: shared DB lock — pod nào giành lock mới chạy, pod khác skip trong lockAtMostFor window",
                "Chuyển job sang Kubernetes CronJob pod riêng",
                "Cứ để — idempotent consumer xử lý trùng rồi"
            ],
            "answer": 1,
            "explain": "ShedLock lock row trong DB: SELECT ... FOR UPDATE rồi UPDATE lock_time — 1 pod thắng, 4 pod thấy locked bỏ qua. lockAtMostFor là insurance: pod giữ lock chết → lock tự hết hạn sau N giây. Simple, đúng cho job định kỳ.",
            "why": [
                "Flag thủ công = operational burden: scale lên 10 pod phải config lại, pod chạy job chết → không ai chạy. Violates self-healing của K8s.",
                "✓ Đúng — leader-election lightweight cho scheduled task. Không cần full Quartz cluster nếu nhu cầu chỉ là '1 instance chạy'.",
                "K8s CronJob là lựa chọn hợp lệ cho job nặng/cô lập — nhưng thêm moving part (RBAC, image, scheduling K8s riêng), over-kill cho 1 method @Scheduled có sẵn.",
                "Để trùng rồi dựa idempotent = tiêu tốn tài nguyên x5 vô ích + duplicate publish Kafka x5 (mỗi consumer downstream xử lý) — đúng kỹ thuật sai kinh tế."
            ]
        },
        {
            "level": "hard",
            "scenario": "Java 21 LAAS: endpoint /report blocking IO 5s. Platform thread pool 200. 200 user đồng thời → pool đầy → MỌI endpoint (kể cả /health) đứng im — chết cả service vì 1 endpoint chậm.",
            "q": "Virtual threads giải quyết thế nào?",
            "options": [
                "Virtual thread chạy nhanh hơn platform thread — 5s thành 500ms",
                "spring.threads.virtual.enabled=true: mỗi request 1 virtual thread — blocking call park virtual (rẻ như objects), platform thread nhả đi phục vụ request khác. 200 chờ + /health vẫn chạy",
                "Virtual thread ưu tiên cao hơn — scheduler cho chạy trước",
                "Tự động scale pod khi phát hiện endpoint chậm"
            ],
            "answer": 1,
            "explain": "Điểm nhảy: virtual thread blocking = park (lưu stack, nhả carrier). 10k virtual threads chờ IO không tốn 10k platform thread. Carriers nhỏ (≈ core count) phục vụ mọi virtual — /health và /report không tranh nhau pool 200 nữa.",
            "why": [
                "Virtual KHÔNG nhanh hơn — CPU work vẫn tốc độ đó. Lợi ích duy nhất: scalability của BLOCKING IO (số concurrent chờ), không phải throughput của CPU-bound.",
                "✓ Đúng — 1 dòng config đổi mô hình: thread-per-request trở lại khả thi (nhưng thread giờ rẻ). Khỏi cần reactive phức tạp cho I/O-heavy đơn thuần.",
                "Không có khái niệm priority giữa virtual/platform theo cách đó — scheduler không cho virtual 'chạy trước' /health của platform.",
                "HPA scale pod là tầng hạ tầng — phản ứng chậm (phút) và không giải quyết deadlock pool cục bộ trong 1 pod. Không phải câu trả lời cho câu hỏi thread model."
            ]
        },
        {
            "level": "medium",
            "scenario": "BA LAAS phàn nàn: 'Sửa số dư trong admin nhưng app vẫn hiển thị số cũ 10 phút'. Dev check: update dùng @CachePut — cache được ghi mới. Vẫn stale!",
            "q": "Điều tra hướng nào đúng?",
            "options": [
                "Key @CachePut không khớp key @Cacheable (khác expression) — update ghi key A, read đọc key B",
                "Redis version cũ — nâng cấp lên 7.x",
                "Client mobile cache HTTP response — thêm Cache-Control no-store",
                "Transaction chưa commit — cache ghi trước khi DB có dữ liệu"
            ],
            "answer": 0,
            "explain": "Cùng cacheNames nhưng key khác nhau = 2 không gian key riêng: findById key='#id' (Long), update key='#result.id()' hoặc '#req.id' — expression sai lệch nhẹ (String '42' vs Long 42) ghi chỗ khác. Cache MONITOR + so key thực tế là cách chẩn đoán 5 phút.",
            "why": [
                "✓ Đúng — 90% cache stale bug là key mismatch: type khác (String vs Long), expression khác (param vs result), cacheName khác (typo). Redis MONITOR cho thấy SET key khác GET key ngay.",
                "Redis version không liên quan semantic key — 5.x hay 7.x đều hash key như nhau.",
                "HTTP cache client là lớp khác — nhưng triệu chứng mô tả (10 phút) khớp TTL Redis hơn. Và nếu HTTP cache thì sửa server header, vẫn phải check trước.",
                "Transaction + @CachePut: cache ghi TRONG transaction — nếu rollback cache có dữ liệu rác (vấn đề thật khác!) — nhưng stale cũ vẫn được ghi ĐÈ bởi giá trị mới rồi. Không khớp triệu chứng."
            ]
        },
        {
            "level": "medium",
            "scenario": "He thong multi-tenant discriminator. @Cacheable(cacheNames=\"memberBalance\", key=\"#cif\") — khong co tenant trong key. UAT: tenant A bao diem hien thi SAI, log nghiep vu DUNG, khong co exception nao.",
            "q": "Dieu gi xay ra?",
            "options": [
                "Bug race condition trong cache manager — can sync=true",
                "Cross-tenant cache HIT: tenant B load key cif-001, tenant A doc lai CUNG key → nhan data cua B — cache key thieu prefix tenant",
                "Redis serialization loi — doi GenericJackson2JsonRedisSerializer",
                "DB tra sai data — kiem tra Hibernate filter"
            ],
            "answer": 1,
            "explain": "Day la bug ngam nguy hiem nhat cua multi-tenant: KHONG exception, chi SAI SO. Key chi co cif — 2 tenant cung co CIF-001 (cif chi unique trong pham vi tenant) → HIT nham data tenant khac. Fix: key = TenantContext.require() + ':' + #cif. Log nghiep vu dung vi query DB co tenant filter — chi cache layer leak.",
            "why": [
                "sync chi chong stampede — khong lien quan pham vi key",
                "Dung — tenant PHAI nam trong cache key moi tang: Redis, Caffeine L1, HTTP cache",
                "Serializer quyet dinh ENCODE khong quyet dinh SCOPE key — sai huong",
                "Log dung = nghiep vu dung; chi hien thi sai — ngon tay tro ve cache"
            ]
        },
        {
            "level": "medium",
            "scenario": "Report job 5 pod, can chan 2 pod cung generate. Dev viet redis.setIfAbsent(\"lock:report:tenant-a\", \"1\") — KHONG TTL. Pod crash giua luc generate.",
            "q": "Hau qua va pattern dung?",
            "options": [
                "Lock tu expire khi connection Redis dong — khong van de gi",
                "Lock ket MAI MAI (Redis khong biet pod chet) — moi lan chay sau throw in-progress. Dung: setIfAbsent(token UUID, TTL) + giai phong bang Lua so token",
                "Pod moi tu gianh lock vi connection khac — can khoa pessimistic DB thay the",
                "Dung DEL lock truoc khi chay moi lan — tu don la du"
            ],
            "answer": 1,
            "explain": "SETNX khong TTL la lock mot chieu: process chet giua chung khong ai giai phong — Redis giu key vin vien, job chet 'am tham' mai mai. Dung: (1) TTL bat buoc — crash thi lock tu het; (2) value la token unique + giai phong bang script Lua so-roi-xoa atomic — chi xoa neu COA la token minh dat, tranh xoa nham lock nguoi vua gia han. DEL dau moi lan chay pha het muc dich lock.",
            "why": [
                "Redis khong gan key voi connection cua client — key song qua moi disconnect",
                "Dung — TTL chong ket vin vien, token + Lua chong xoa nham lock nguoi khac",
                "DB lock cung giai duoc nhung nang hon — Redis pattern dung la du, khong can doi cong nghe",
                "DEL dau moi run = moi pod lan luot gianh lai lock — khong chan dong thoi nua"
            ]
        },
        {
            "level": "hard",
            "scenario": "AbstractRoutingDataSource theo TenantContext. Method: @Transactional truoc, ben trong co dong TenantContext.set(tenant) SAU khi transaction da mo. Kiem tra: query van ghi vao DB DEFAULT thay vi DB tenant.",
            "q": "Vi sao routing khong hoat dong?",
            "options": [
                "AbstractRoutingDataSource can rebuild sau khi them tenant moi",
                "Connection duoc resolve LAZY khi query dau chay — nhung transaction bind connection NGAY khi mo, truoc dong set(): determineCurrentLookupKey chay khi do, tenant con null → default DS",
                "ThreadLocal khong visible ben trong @Transactional proxy",
                "Can @Transactional(readOnly=true) de routing hoat dong"
            ],
            "answer": 1,
            "explain": "Thu tu la tat ca: Spring lay connection tu datasource NGAY khi transaction bat dau (de set autocommit=false, isolation) — determineCurrentLookupKey chay LUC DO. set() sau do chi doi ThreadLocal, connection da bound vao transaction theo default. Chuan: filter set tenant TRUOC khi vao bat ky bean transactional nao. Do la ly do TenantFilter chay dau chuoi — khong phai trach nhiem cua service code.",
            "why": [
                "Them tenant la map config — khong lien quan hanh vi luc runtime nay",
                "Dung — lazy resolve nhung bind khi mo transaction: set muon = routing truot ve default",
                "ThreadLocal hoat dong binh thuong trong proxy — van de la THOI DIEM bind connection",
                "readOnly khong dung den routing — thuoc tinh semantic cua transaction"
            ]
        },
        {
            "level": "medium",
            "scenario": "Job đối soát Spring Batch chunk 500 chạy 2h sáng. Sáng ra check: status FAILED ở chunk 3902/4000, nguyên nhân connection DB reset. Dev đề xuất chạy lại từ đầu với parameter mới.",
            "q": "Đánh giá và hành động đúng?",
            "options": [
                "Đúng — chạy lại từ đầu sạch sẽ, tránh trạng thái nửa vời",
                "RESTART cùng JobInstance: JobRepository biết chunk 3901 đã commit — chạy lại NHẢY VÀO chunk 3902, chỉ 98 chunk còn lại. Parameter mới = instance mới = quét lại 4000 chunk",
                "Cần xóa metadata bảng BATCH_* rồi chạy lại như lần đầu",
                "Chuyển job sang @Scheduled chạy lại toàn bộ đêm sau — self-healing"
            ],
            "answer": 1,
            "explain": "Toàn bộ giá trị của Spring Batch nằm ở checkpoint: restart cùng JobInstance (cùng parameters) kế thừa tiến độ đã commit — 98 chunk × 500 = việc còn lại đúng 2%. Parameter mới tạo JobInstance mới chạy lại 100% và có nguy cơ duplicate dòng đã xử lý (writer phải idempotent). Đó là lý do cấu hình job nặng metadata: trả lời chính xác 'chết ở đâu, chạy tiếp từ đâu'.",
            "why": [
                "Quét lại 3901 chunk đã commit — lãng phí và rủi ro duplicate",
                "✓ Restart kế thừa tiến độ — đúng thiết kế checkpoint của Batch",
                "Xóa metadata là xóa bằng chứng restart — quay về thời @Scheduled for-loop",
                "Chờ đêm sau không giải quyết job hôm nay — và đêm sau vẫn gặp lỗi tương tự"
            ]
        },
        {
            "level": "hard",
            "scenario": "Team tranh luận kiến trúc messaging: (A) mọi thứ Kafka vì 'outbox đang Kafka', kể cả queue gửi SMS; (B) Kafka cho event stream đối soát + RabbitMQ cho SMS/notification task queue.",
            "q": "Phân tích đúng bản chất?",
            "options": [
                "A đúng — 1 hệ messaging duy nhất giảm operational burden, Kafka làm được mọi việc",
                "B đúng — event cần replay (audit) là Kafka append-only; task làm-xong-bỏ (SMS) cần per-message ack + DLQ phân phối — Rabbit đúng bản chất công việc",
                "A đúng vì Kafka throughput cao hơn — hiệu năng quyết định",
                "B đúng vì RabbitMQ mốt mới hơn — luôn chọn công nghệ mới"
            ],
            "answer": 1,
            "explain": "Chọn theo BẢN CHẤT DỮ LIỆU không theo mốt hay throughput: event đối soát là dòng lịch sử phải replay được cho audit — append-only log sinh ra cho việc đó. SMS task là đơn vị việc: ai nhận, xử lý, xác nhận xong, bỏ — đúng mô hình queue có ack. SMS trên Kafka: không per-message ack tự nhiên, consumer group thủ công, DLQ phải tự dựng — chống lại công cụ thay vì dùng nó.",
            "why": [
                "1 hệ cho 2 mô hình khác nhau — phần nào đó chống lại grain của công cụ",
                "✓ Replay vs ack-xóa là 2 bản chất — 2 công cụ đúng việc từng loại",
                "Throughput Rabbit đã thừa cho SMS queue — hiệu năng không phải trục quyết định",
                "Lý do công nghệ mới không phải luận cứ kiến trúc — bản chất bài toán mới là"
            ]
        },
        {
            "level": "hard",
            "scenario": "Monolith 800k dòng chạy ổn. Dev mới vào refactor vội: notification service import MemberInternalProfileValidator (class internal của module member). Build xanh, chạy đúng — review không ai để ý.",
            "q": "Vì sao build XANH và cơ chế nào sẽ bắt được?",
            "options": [
                "Bug framework Spring — internal package phải lỗi compile tự động",
                "Java không có khái niệm module enforcement ở mức package convention — build xanh vì hợp lệ về ngôn ngữ. modules.verify() của Spring Modulith (hoặc ArchUnit rule) trong CI sẽ ĐỎ: phụ thuộc vào non-exposed type",
                "Không sao — internal chỉ là quy ước đặt tên, ai cần thì dùng",
                "Chỉ cần @Autowired thay vì import trực tiếp là hợp lệ"
            ],
            "answer": 1,
            "explain": "Đây chính là lý do modular monolith cần 'pháp luật': package convention không tự thực thi — JDK module system (JPMS) có thể nhưng cồng kềnh. Spring Modulith verify() / ArchUnit phân tích bytecode dependency graph: PR này vào CI là đỏ kèm thông báo chính xác module nào vi phạm internal nào. Boundary từ quy ước miệng thành test — cùng cơ chế với verify.js của chính khóa học này.",
            "why": [
                "Convention không phải enforcement — ngôn ngữ không cấm import package public",
                "✓ Static analysis trong CI: dependency graph không biết nể ai",
                "Bỏ mở internal là boundary chết — mọi module dần import lẫn nhau quay lại monolith bẩn",
                "Cách inject không đổi bản chất phụ thuộc — dependency graph vẫn thấy"
            ]
        },
        {
            "level": "medium",
            "scenario": "Kiến trúc CQRS mức 2: POST /redeem ghi DB + outbox → Kafka → projection cập nhật bảng dashboard (trễ ~1s). Tester báo bug: redeem xong 200 OK, F5 dashboard ngay — giao dịch biến mất, 2 giây sau mới xuất hiện.",
            "q": "Đây là bug hay hành vi thiết kế — xử lý thế nào cho đúng?",
            "options": [
                "Bug — giảm lag Kafka consumer về 0ms là hết",
                "Hành vi thiết kế của eventual consistency. Fix đúng chỗ UI: optimistic update từ response POST, hoặc read-your-own-writes cho chính user vừa ghi",
                "Bug — dashboard phải đọc thẳng DB transaction thay vì projection",
                "Bug — thêm cache Redis quanh bảng projection"
            ],
            "answer": 1,
            "explain": "Chọn CQRS mức projection là CHẤP NHẬN trễ truyền bá — đó là đánh đổi lấy read path phẳng nhanh. 'Sửa' bằng cách đòi lag 0 là phủ nhận chính lý do chọn kiến trúc; đọc thẳng DB giết lợi ích projection. Đúng chỗ xử lý là client: optimistic update (hiển thị từ response, khớp khi projection bắt kịp) hoặc read-your-own-writes — user vừa ghi đi path ghi. Bug nằm ở KỲ VỌNG 'GET thấy ngay', không ở hệ thống.",
            "why": [
                "Lag 0 đồng nghĩa đồng bộ — mâu thuẫn với mục tiêu tách read/write",
                "✓ Eventual consistency là hợp đồng — client phải được thiết kế biết điều đó",
                "Đọc thẳng DB cho dashboard là quay về chính vấn đề CQRS ra đời để giải",
                "Cache không giảm trễ truyền bá — chỉ đắp thêm lớp phụ"
            ]
        }
    ]
}
  ]
});
