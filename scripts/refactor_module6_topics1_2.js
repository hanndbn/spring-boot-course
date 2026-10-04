const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module6.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m6 = window.COURSE_MODULES.find(m => m.id === 6);

// Refactor Lesson 6-1-1
const l611 = m6.lessons.find(l => l.id === "6-1-1");
if (l611) {
  l611.title = "Bài 6.1.1: Kiến trúc Bộ Đệm Hai Tầng (Caffeine + Redis) & Cơ Chế Khóa Phân Tán Redisson";
  l611.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã kiến trúc **Bộ đệm 2 tầng (Two-Level Cache: L1 In-Memory Caffeine + L2 Distributed Redis)**.
- Hiểu tại sao dùng Java \`synchronized\` hoặc ReentrantLock hoàn toàn thất bại khi scale nhiều Pod trên Kubernetes.
- Nắm vững cơ chế hoạt động của **Redisson Distributed Lock** dựa trên Redis Pub/Sub và Watchdog tự động gia hạn khóa.
- Đọc hiểu 100% từng dòng code xử lý Cache qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BỘ ĐỆM 2 TẦNG VÀ KHÓA PHÂN TÁN
**1. Bộ đệm 2 tầng — "Túi áo và Tủ đồ chung":**
- **Tầng L1 (Caffeine In-Memory)**: Giống như "Chiếc túi áo" của bạn. Lấy đồ ra chỉ mất 1 nano-giây (siêu nhanh, không tốn đường truyền mạng), nhưng dung lượng nhỏ và chỉ mình bạn dùng được.
- **Tầng L2 (Redis Distributed Cache)**: Giống như "Chiếc tủ đồ chung của cả nhà". Mọi thành viên (tất cả các Pods) đều truy cập được chung một dữ liệu, tốc độ 1 mili-giây (nhanh gấp 50 lần Database).

**2. Khóa phân tán Redisson — "Chiếc chìa khóa phòng họp duy nhất":**
- Khi có 1,000 khách cùng tranh nhau đặt 1 chiếc vé hòa nhạc:
- Thay vì để 1,000 người cùng ùa vào cơ sở dữ liệu làm sập server:
- Người đầu tiên chạy tới chiếc tủ Redis xin lấy chiếc chìa khóa duy nhất mang tên \`lock:ticket:1\`.
- Chiếc chìa khóa này có **chú chó giữ nhà thông minh (Watchdog)**: Cứ mỗi 10 giây chú chó lại tự gia hạn thời gian khóa cho bạn. Khi bạn mua vé xong, bạn trả lại chìa khóa cho người tiếp theo!
:::

---

## 1. Cái này là gì? (Kiến trúc Two-Level Cache & Redisson)

Trong hệ thống E-Commerce chịu tải cao (High-Concurrency), kiến trúc L1 (Caffeine) giúp giảm 90% tải mạng cho Redis, và L2 (Redis) giúp giảm 99% tải truy vấn cho PostgreSQL:

### Sơ Đồ Kiến Trúc: Dòng Chảy Truy Vấn Qua Bộ Đệm 2 Tầng:

\`\`\`mermaid
flowchart LR
    REQ["HTTP Request Client"] --> L1{"L1 Cache (Caffeine)<br/>[Bộ nhớ RAM cục bộ]"}
    L1 -->|"Hit L1 (0.01ms)"| RET["Trả về dữ liệu ngay lập tức!"]
    L1 -->|"Miss L1"| L2{"L2 Cache (Redis)<br/>[Bộ nhớ phân tán]"}
    L2 -->|"Hit L2 (1ms)"| SYNC["Lưu ngược vào L1"] --> RET
    L2 -->|"Miss L2"| LOCK["Xin Redisson Distributed Lock"]
    LOCK --> DB[("PostgreSQL Database")]
    DB --> POP["Nạp dữ liệu vào Redis + Caffeine"] --> RET
    style L1 fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style L2 fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style DB fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi hiển thị trang chủ có hàng triệu lượt truy cập vào danh mục sản phẩm Hot hoặc trang Flash Sale:

### Ma trận So sánh: Chỉ dùng Redis vs Bộ đệm 2 tầng (Caffeine + Redis)

| Tiêu chí | Chỉ dùng 1 tầng Redis đơn thuần | Bộ đệm 2 tầng (Caffeine L1 + Redis L2) |
|---|---|---|
| **Độ trễ truy cập (Latency)** | ~1 - 2 miligiây (Chịu độ trễ socket mạng) | **~10 - 50 nano-giây** (Đọc trực tiếp từ RAM JVM) |
| **Băng thông mạng Redis** | Chịu 100% lượng request, dễ nghẽn card mạng Redis | **Giảm 90% tải mạng** vì phần lớn request được chặn tại L1 |
| **Đồng bộ khi dữ liệu đổi** | Đơn giản: Xóa key trên Redis | Cần dùng **Redis Pub/Sub** để thông báo cho các pod xóa L1 |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Sử dụng Redisson Distributed Lock để bảo vệ nghiệp vụ trừ tồn kho Flash Sale:

\`\`\`java
package vn.mastery.ecommerce.service;

import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;
import vn.mastery.ecommerce.exception.LockAcquisitionException;
import java.util.concurrent.TimeUnit;

@Service
public class FlashSaleLockService {

    private final RedissonClient redissonClient;
    private final InventoryService inventoryService;

    public FlashSaleLockService(RedissonClient redissonClient, InventoryService inventoryService) {
        this.redissonClient = redissonClient;
        this.inventoryService = inventoryService;
    }

    public void purchaseWithDistributedLock(Long productId, int quantity) {
        String lockKey = "lock:product:" + productId;
        RLock lock = redissonClient.getLock(lockKey);

        try {
            // Thử xin khóa trong tối đa 3 giây. Nếu được cấp, tự động gia hạn bằng Watchdog (leaseTime = -1)
            boolean isLocked = lock.tryLock(3, -1, TimeUnit.SECONDS);
            if (!isLocked) {
                throw new LockAcquisitionException("Hệ thống đang quá tải, vui lòng thử lại sau!");
            }

            // Thực thi nghiệp vụ an toàn tuyệt đối
            inventoryService.deductInventory(productId, quantity);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new LockAcquisitionException("Bị gián đoạn trong lúc chờ khóa!");
        } finally {
            // Chỉ giải phóng khóa nếu chính luồng này đang nắm giữ khóa
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }
}
\`\`\`

### Bảng Giải Mã Cú Pháp Redisson Lock:

| Lệnh thực thi | Tham số truyền vào | Ý nghĩa an toàn |
|---|---|---|
| \`lock.tryLock(3, -1, SECONDS)\` | \`waitTime = 3\`, \`leaseTime = -1\` | Chờ tối đa 3 giây. Giá trị \`-1\` kích hoạt **Redisson Watchdog** tự động gia hạn khóa sau mỗi 10 giây nếu tác vụ chạy lâu |
| \`lock.isHeldByCurrentThread()\` | Kiểm tra quyền sở hữu | **Ngăn chặn triệt để lỗi \`IllegalMonitorStateException\`**: Tránh việc luồng A giải phóng nhầm khóa của luồng B khi khóa bị quá hạn |
| \`lock.unlock()\` | Lệnh mở khóa | Bắn tín hiệu Redis Pub/Sub thông báo cho các luồng khác đang đợi biết khóa đã sẵn sàng |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa set cứng \`leaseTime\` mà không dùng Watchdog**:
   - Nếu bạn gõ: \`lock.tryLock(3, 5, TimeUnit.SECONDS)\` (khóa sẽ tự hết hạn sau 5 giây).
   - Nếu tác vụ của bạn mất 6 giây: Tại giây thứ 5, khóa tự bung ra -> Một pod khác nhảy vào xử lý -> **Mất hoàn toàn tính độc quyền và gây bán âm kho**!
   - Khắc phục: Luôn để \`leaseTime = -1\` để Redisson Watchdog quản lý thời gian sống an toàn.
`;
}

// Refactor Lesson 6-1-2
const l612 = m6.lessons.find(l => l.id === "6-1-2");
if (l612) {
  l612.title = "Bài 6.1.2: Triển khai Redisson Distributed Lock & Chống Cache Stampede với Probabilistic Early Expiration";
  l612.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã hiện tượng "Bão giẫm đạp Cache": **Cache Stampede / Thundering Herd Problem**.
- Nắm vững thuật toán xác suất **Probabilistic Early Expiration (XFetch)**: Tự động làm mới cache trước khi nó kịp hết hạn.
- Cấu hình Redis Cache Manager với định dạng JSON Serializer (Jackson) an toàn.
- Đọc hiểu 100% từng dòng code xử lý chống bão cache qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CACHE STAMPEDE (BÃO GIẪM ĐẠP)
**Hình tượng "10,000 người cùng khát nước và chiếc bình nước cạn":**
- Đang có 10,000 người xếp hàng lấy nước từ một chiếc bình lớn (**Redis Cache**).
- Đột nhiên, đúng 12:00:00, chiếc bình nước hết hạn và cạn sạch nước!
- Cùng một giây đó, cả **10,000 người cùng lúc ùa vào giếng làng (PostgreSQL Database)** để múc nước!
- Giếng làng không thể chịu nổi 10,000 chiếc gàu múc cùng một lúc -> **Sập giếng và cả làng mất nước (Database Crash sập toàn hệ thống)**!
- **Giải pháp Probabilistic Early Expiration (Làm mới sớm)**:
  - Khi bình nước còn khoảng 10% (gần hết hạn): Một người ngẫu nhiên được chọn nhẹ nhàng đi bơm nước đầy lại bình từ trước.
  - 9,999 người còn lại vẫn uống nước bình thường mà không hề hay biết bình vừa được thay mới!
:::

---

## 1. Cái này là gì? (Kiến trúc Thuật Toán XFetch)

Thuật toán XFetch sử dụng công thức xác suất dựa trên thời gian tính toán của câu query ($ \Delta $) và hệ số $ \beta $:
$$ -\beta \times \Delta \times \ln(\text{random}()) > \text{TTL còn lại} $$
Nếu điều kiện thỏa mãn, luồng đó sẽ tự động kích hoạt truy vấn DB ngầm để ghi đè cache trước khi TTL về 0.

### Sơ Đồ Cơ Chế Chống Cache Stampede:

\`\`\`mermaid
flowchart TD
    A["Request đọc dữ liệu"] --> B["Đọc Cache Redis (TTL còn 30 giây)"]
    B --> C{"Thuật toán XFetch kích hoạt?"}
    C -->|"CHƯA"| D["Trả về dữ liệu Cache ngay lập tức"]
    C -->|"THỎA MÃN (Xác suất trúng)"| E["Bật luồng ngầm nạp lại DB"]
    E --> F["Cập nhật Cache mới (TTL = 10 phút)"]
    E --> D
    style D fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style E fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa Cache Avalanche (Tuyết lở Cache)**:
   - Nếu bạn set TTL cho 10,000 sản phẩm cùng là 60 phút: Đúng 60 phút sau, toàn bộ 10,000 key cùng chết một lúc!
   - Khắc phục: Luôn cộng thêm một khoảng thời gian ngẫu nhiên (Jitter): \`TTL = 60 phút + Random(1 đến 10 phút)\`.
`;
}

// Refactor Lesson 6-1-3
const l613 = m6.lessons.find(l => l.id === "6-1-3");
if (l613) {
  l613.title = "Bài 6.1.3: Cạm bẫy RLock Quá Hạn Làm Mất Tính Độc Quyền & Lỗ Hổng Serialization Redis";
  l613.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã lỗi bảo mật nghiêm trọng khi dùng Java Native Serialization trên Redis: **Lỗ hổng Remote Code Execution (RCE)**.
- Chuyển đổi 100% cấu hình Redis Serializer sang **Jackson2JsonRedisSerializer** an toàn.
- Xử lý cạm bẫy Stop-the-world của Garbage Collection làm Redisson Lock bị quá hạn.
- Đọc hiểu bảng phân tích các định dạng tuần tự hóa dữ liệu (Serialization Formats).
:::

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Tuyệt đối không dùng \`JdkSerializationRedisSerializer\`**:
   - Sử dụng Java Native Serialization là nguyên nhân hàng đầu dẫn đến các cuộc tấn công Deserialization RCE.
   - Luôn sử dụng JSON hoặc Protobuf.
`;
}

// Refactor Lesson 6-1-4
const l614 = m6.lessons.find(l => l.id === "6-1-4");
if (l614) {
  l614.title = "Bài 6.1.4: Tổng Kết Thực Chiến: Bản Đồ Caching Phân Tán & Kỹ Thuật Redisson Distributed Lock";
  l614.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 6.1 thành Bản đồ Chiến lược Bộ đệm Phân tán.
- Nắm chắc 3 tam giác vàng: **Cache Aside**, **Read Through**, **Write Behind**.
- Sẵn sàng bước sang Chuyên đề 6.2 (Apache Kafka & Transactional Outbox Pattern).
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỔNG KẾT CHUYÊN ĐỀ 6.1
Chúng ta đã trang bị cho hệ thống E-Commerce một "Tấm đệm lò xo siêu tốc":
- 99% tải truy cập được phục vụ từ bộ nhớ RAM của **Caffeine và Redis**.
- Các sự kiện tranh chấp nghìn người mua 1 vé được điều tiết nhịp nhàng bằng **Redisson Distributed Lock**.
- Giờ đây, chúng ta sẽ bước sang xương sống truyền tin của kiến trúc phân tán: **Apache Kafka!**
:::

---

## 1. Cái này là gì? (Bản Đồ Kiến Trúc Chuyên Đề 6.1)

\`\`\`mermaid
graph TD
    subgraph C1["CHUYÊN ĐỀ 6.1: REDIS CACHING & LOCKING"]
        T1["L1 Cache: Caffeine In-Memory (Nano-seconds)"]
        T2["L2 Cache: Redis Cluster (1ms)"]
        T3["Chống Thundering Herd: XFetch & Jitter TTL"]
        T4["Đồng Thời: Redisson Watchdog Distributed Lock"]
    end
    T1 --> T2 --> T3 --> T4
    style C1 fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
\`\`\`
`;
}

// Refactor Lesson 6-2-1
const l621 = m6.lessons.find(l => l.id === "6-2-1");
if (l621) {
  l621.title = "Bài 6.2.1: Bản chất Thảm họa Dual-Write & Kiến trúc Transactional Outbox với Apache Kafka";
  l621.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã "Cơn ác mộng kinh điển của Microservices": **Thảm họa Dual-Write (Ghi đồng thời DB và gửi Message)**.
- Hiểu tại sao việc đặt \`kafkaTemplate.send()\` bên trong phương thức \`@Transactional\` là một sai lầm chết người.
- Làm chủ kiến trúc **Transactional Outbox Pattern**: Đảm bảo dữ liệu DB và Message Kafka luôn nhất quán 100%.
- Đọc hiểu 100% sơ đồ thiết kế bảng Outbox qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: THẢM HỌA DUAL-WRITE LÀ GÌ?
**Hình tượng "Chuyển tiền xong nhưng mất sóng điện thoại":**
- Lập trình viên Nam viết code:
  1. Trừ tiền tài khoản khách 10 triệu trong Database (\`orderRepository.save(order)\`).
  2. Bắn tin nhắn sang Kafka để kích hoạt giao hàng (\`kafkaTemplate.send("orders", event)\`).
- **Tình huống thảm họa 1**: Bước 1 chạy xong, nhưng chuẩn bị sang bước 2 thì mạng đứt hoặc Kafka bị sập!
  - Kết quả: Khách bị trừ 10 triệu, nhưng tin nhắn không bao giờ sang được kho -> Đơn hàng biến mất vĩnh viễn!
- **Tình huống thảm họa 2**: Nam đổi thứ tự: Gửi Kafka trước, rồi mới lưu DB.
  - Vừa gửi Kafka xong, bước lưu DB bị lỗi trùng khóa chính (Rollback)!
  - Kết quả: Database không lưu đơn, nhưng kho hàng đã nhận được tin nhắn và... ship hàng miễn phí cho khách!
- **Giải pháp Transactional Outbox — "Bỏ phong thư vào chiếc hòm Outbox ngay trong Database"**:
  - Lưu đơn hàng VÀ lưu phong thư sự kiện vào cùng một bảng \`outbox_events\` **TRONG CÙNG MỘT TRANSACTION CỦA DATABASE**!
  - Cả 2 cùng thành công, hoặc cả 2 cùng thất bại! Không bao giờ bị lệch!
:::

---

## 1. Cái này là gì? (Kiến trúc Transactional Outbox Pattern)

Thay vì gửi message trực tiếp tới Kafka từ tầng nghiệp vụ, ứng dụng lưu sự kiện đó dưới dạng một dòng dữ liệu trong bảng \`outbox_messages\` ngay trong Database nội bộ. Một tiến trình độc lập (Worker Poller hoặc Debezium CDC) sẽ đọc bảng này và đẩy sang Kafka an toàn.

### Sơ Đồ Kiến Trúc: Đảm Bảo Nhất Quán Tuyệt Đối Bằng Bảng Outbox:

\`\`\`mermaid
flowchart TD
    subgraph ACID["CÙNG 1 DATABASE TRANSACTION DUY NHẤT"]
        A["1. INSERT INTO orders (Lưu đơn hàng)"] 
        B["2. INSERT INTO outbox_messages (Lưu sự kiện)"]
    end
    
    ACID -->|"COMMIT 100% AN TOÀN"| DB[("PostgreSQL")]
    
    subgraph POLLER["Tiến Trình Chuyển Tiếp Độc Lập"]
        P["Outbox Poller Worker / Debezium CDC"] -->|"Đọc các sự kiện chưa gửi"| DB
        P -->|"Bắn sang Kafka Broker"| KAFKA["Apache Kafka Cluster"]
        P -->|"Đánh dấu: status = SENT"| DB
    end
    style ACID fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style KAFKA fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi bất kỳ thao tác nào cần thông báo cho các dịch vụ khác (Thanh toán xong -> Thông báo Kho giữ hàng -> Thông báo Email):

### Ma trận So sánh: Gửi Kafka Trực Tiếp vs Transactional Outbox

| Tiêu chí | Gửi trực tiếp (\`kafkaTemplate.send\`) | Transactional Outbox Pattern |
|---|---|---|
| **Tính toàn vẹn dữ liệu** | ❌ Dễ mất message hoặc gửi thừa khi rollback | ⭐ **Bảo đảm 100% không bao giờ mất message** |
| **Độ trễ phản hồi API** | Chịu độ trễ bắt tay mạng với Kafka broker | **Siêu nhanh**: Chỉ ghi 1 dòng SQL vào DB nội bộ |
| **Khả năng chịu lỗi khi Kafka chết** | Ứng dụng nghiệp vụ bị nghẽn và sập theo | **Vẫn hoạt động bình thường**: Sự kiện xếp hàng trong bảng Outbox đợi Kafka sống lại |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

### 1. Bảng \`outbox_messages\` trong PostgreSQL:

\`\`\`sql
CREATE TABLE outbox_messages (
    id UUID PRIMARY KEY,
    aggregate_type VARCHAR(64) NOT NULL, -- Ví dụ: "ORDER"
    aggregate_id VARCHAR(64) NOT NULL,   -- Mã đơn hàng: "ORD-999"
    event_type VARCHAR(64) NOT NULL,     -- Tên sự kiện: "ORDER_CREATED"
    payload JSONB NOT NULL,              -- Nội dung JSON chi tiết
    status VARCHAR(32) NOT NULL,         -- "PENDING", "SENT", "FAILED"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_outbox_pending ON outbox_messages (status, created_at) WHERE status = 'PENDING';
\`\`\`

### 2. Service lưu cả Order và Outbox trong 1 Transaction:

\`\`\`java
package vn.mastery.ecommerce.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.ecommerce.domain.Order;
import vn.mastery.ecommerce.domain.OutboxMessage;
import vn.mastery.ecommerce.dto.CreateOrderRequest;
import vn.mastery.ecommerce.repository.OrderRepository;
import vn.mastery.ecommerce.repository.OutboxRepository;
import java.util.UUID;

@Service
public class OrderCheckoutService {

    private final OrderRepository orderRepository;
    private final OutboxRepository outboxRepository;
    private final ObjectMapper objectMapper;

    public OrderCheckoutService(OrderRepository orderRepository, OutboxRepository outboxRepository,
                                ObjectMapper objectMapper) {
        this.orderRepository = orderRepository;
        this.outboxRepository = outboxRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Order createOrderWithOutbox(CreateOrderRequest request) {
        // 1. Lưu Order vào Database
        Order order = new Order(request.customerId(), request.totalAmount());
        Order savedOrder = orderRepository.save(order);

        // 2. Đóng gói sự kiện vào bảng Outbox (CÙNG TRANSACTION!)
        String payloadJson = objectMapper.writeValueAsString(savedOrder.toEventDto());
        OutboxMessage outbox = new OutboxMessage(
            UUID.randomUUID(),
            "ORDER",
            String.valueOf(savedOrder.getId()),
            "ORDER_CREATED",
            payloadJson,
            "PENDING"
        );
        outboxRepository.save(outbox);

        return savedOrder;
        // COMMIT: Cả Order và Outbox cùng được ghi vĩnh viễn vào Database!
    }
}
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa Outbox Polling làm nghẽn Database (Database Hammering)**:
   - Nếu bạn viết \`@Scheduled(fixedRate = 100)\` quét bảng outbox liên tục 10 lần mỗi giây: Database sẽ bị quá tải CPU chỉ để đọc bảng rỗng!
   - Khắc phục: Sử dụng công cụ **Debezium Change Data Capture (CDC)** đọc trực tiếp PostgreSQL WAL log mà không cần bắn câu lệnh \`SELECT\`!
`;
}

// Refactor Lesson 6-2-2
const l622 = m6.lessons.find(l => l.id === "6-2-2");
if (l622) {
  l622.title = "Bài 6.2.2: Triển khai Outbox Poller & Idempotent Consumer với Database Unique Constraint";
  l622.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải quyết bài toán then chốt của hệ phân tán: **Idempotent Consumer (Xử lý trùng lặp thông điệp)**.
- Hiểu tại sao Kafka chỉ đảm bảo ngữ nghĩa **At-Least-Once Delivery (Ít nhất một lần)**, đồng nghĩa với việc Consumer có thể nhận trùng 2 lần cùng một tin nhắn!
- Triển khai cơ chế khóa chống trùng lặp bằng bảng **\`processed_messages\`** và Database Unique Constraint.
- Đọc hiểu 100% từng dòng code Consumer an toàn qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẠI SAO PHẢI CÓ TÍNH BẤT BIẾN (IDEMPOTENCY)?
**Hình tượng "Bấm nút nạp tiền điện thoại bị mạng lag":**
- Bạn bấm "Nạp 100k vào số điện thoại".
- Hệ thống gửi tin nhắn sang tổng đài nạp thẻ. Tổng đài nạp thành công 100k.
- Nhưng lúc tổng đài gửi lại tin nhắn xác nhận cho bạn thì mạng bị rớt!
- Kafka thấy chưa có xác nhận liền **gửi lại tin nhắn lần thứ 2**!
- Nếu tổng đài không có cơ chế kiểm tra trùng lặp: Nó sẽ nạp tiếp 100k nữa -> Tài khoản bạn bị trừ 200k!
- **Idempotent Consumer (Bất biến)**:
  - Tổng đài cầm mã giao dịch \`TXN-123\` kiểm tra sổ cái: *"Mã này tôi đã xử lý rồi!"*.
  - Bỏ qua việc nạp tiền, chỉ xác nhận OK với Kafka! Dù có gửi lại 100 lần thì tài khoản vẫn chỉ bị trừ đúng 100k!
:::

---

## 1. Cái này là gì? (Kiến trúc Idempotent Consumer)

Consumer lưu mã định danh duy nhất của mỗi message (\`message_id\`) vào một bảng \`consumed_messages\` có khóa chính hoặc Unique Index. Nếu có message trùng lặp gửi đến, câu lệnh INSERT sẽ ném lỗi trùng khóa và giao dịch lập tức bỏ qua.

### Sơ Đồ Cơ Chế Chặn Đứng Message Trùng Lặp:

\`\`\`mermaid
flowchart TD
    KAFKA["Kafka gửi Message (ID: MSG-999)"] --> C["OrderEventConsumer"]
    C --> B{"Kiểm tra bảng consumed_messages"}
    B -->|"MSG-999 ĐÃ TỒN TẠI"| D["BỎ QUA TỨC THÌ (Idempotent Hit)<br/>Commit Offset an toàn cho Kafka"]
    B -->|"CHƯA TỒN TẠI"| E["Bắt đầu Transaction"]
    E --> F["1. Xử lý nghiệp vụ (Trừ kho, Giao hàng)"]
    E --> G["2. INSERT INTO consumed_messages (MSG-999)"]
    E --> H["Commit Transaction & Xác nhận Kafka"]
    style D fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style H fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Consumer xử lý thông điệp an toàn tuyệt đối với Spring Kafka:

\`\`\`java
package vn.mastery.ecommerce.consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.ecommerce.dto.OrderCreatedEvent;
import vn.mastery.ecommerce.repository.ConsumedMessageRepository;
import vn.mastery.ecommerce.service.InventoryDeductionService;

@Component
public class IdempotentOrderConsumer {

    private static final Logger log = LoggerFactory.getLogger(IdempotentOrderConsumer.class);

    private final ConsumedMessageRepository consumedRepo;
    private final InventoryDeductionService inventoryService;

    public IdempotentOrderConsumer(ConsumedMessageRepository consumedRepo,
                                  InventoryDeductionService inventoryService) {
        this.consumedRepo = consumedRepo;
        this.inventoryService = inventoryService;
    }

    @KafkaListener(topics = "order.events", groupId = "inventory-service-group")
    @Transactional
    public void consume(OrderCreatedEvent event) {
        String eventId = event.eventId();

        // 1. Kiểm tra tính bất biến: Nếu đã xử lý rồi -> Bỏ qua ngay lập tức
        if (consumedRepo.existsById(eventId)) {
            log.info("Phát hiện message trùng lặp ID: {}, bỏ qua an toàn!", eventId);
            return;
        }

        try {
            // 2. Thực thi nghiệp vụ giữ hàng trong kho
            inventoryService.reserveItems(event.orderId(), event.items());

            // 3. Đánh dấu đã xử lý thành công
            consumedRepo.recordMessageAsProcessed(eventId, "order.events");

        } catch (DataIntegrityViolationException e) {
            // Bắt trường hợp 2 thread cùng chạy đồng thời 1 message trùng
            log.warn("Đụng độ Unique Constraint ID: {}, bỏ qua!", eventId);
        }
    }
}
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Luôn dùng Database Constraint làm chốt chặn cuối cùng**:
   - Kiểm tra bằng \`existsById\` có thể bị Race Condition nếu 2 luồng đọc cùng lúc.
   - Bắt buộc phải có **Unique Constraint trên cột \`event_id\`** tại tầng Database để đảm bảo an toàn tuyệt đối!
`;
}

// Refactor Lesson 6-2-3
const l623 = m6.lessons.find(l => l.id === "6-2-3");
if (l623) {
  l623.title = "Bài 6.2.3: Cạm bẫy Kafka Consumer Rebalance Bão Táp, Poison Pill Message & Dead Letter Queue (DLQ)";
  l623.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã hiện tượng "Viên thuốc độc": **Poison Pill Message** làm treo cứng toàn bộ Consumer Partition.
- Cấu hình cơ chế tự động thử lại có giãn cách thời gian: **Exponential Backoff Retry**.
- Đẩy các message lỗi vào hàng đợi **Dead Letter Queue (DLQ)** để xử lý thủ công mà không làm gián đoạn dòng chảy.
- Đọc hiểu 100% từng dòng cấu hình ErrorHandler trong Spring Kafka.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: POISON PILL VÀ DEAD LETTER QUEUE (DLQ)
**Hình tượng "Kiện hàng chứa chất cấm làm tắc nghẽn cả bưu cục":**
- Bưu cục chuyển phát nhanh (Kafka Consumer) đang phân loại hàng hóa rất nhanh.
- Đột nhiên có một kiện hàng bị lỗi định dạng JSON hoặc dữ liệu rác (**Poison Pill**).
- Nhân viên quét mã kiện hàng đó -> Máy quét bị nổ lỗi (\`DeserializationException\`).
- Nhân viên không biết làm sao, liền đặt kiện hàng lại băng chuyền và quét lại -> Lại nổ lỗi!
- **Hàng nghìn kiện hàng hợp lệ phía sau bị kẹt cứng mãi mãi**!
- **Giải pháp Dead Letter Queue (DLQ) — "Chiếc thùng cách ly"**:
  - Máy quét thử lại 3 lần không được.
  - Tự động gắp kiện hàng độc hại đó ném vào **Chiếc thùng cách ly (Dead Letter Queue: order.events.DLT)**.
  - Băng chuyền tiếp tục chạy vù vù phục vụ các kiện hàng khác. Đội ngũ kỹ sư sẽ đến kiểm tra chiếc thùng cách ly sau!
:::

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Cấu hình DefaultErrorHandler với DeadLetterPublishingRecoverer trong Spring Boot 3:

\`\`\`java
package vn.mastery.ecommerce.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.ExponentialBackOff;

@Configuration
public class KafkaErrorConfig {

    @Bean
    public DefaultErrorHandler errorHandler(KafkaTemplate<String, Object> kafkaTemplate) {
        // Tự động chuyển tiếp message lỗi vào topic Dead Letter (thêm đuôi .DLT)
        var recoverer = new DeadLetterPublishingRecoverer(kafkaTemplate);

        // Cấu hình thử lại giãn cách lũy thừa: Thử lại 3 lần, bắt đầu từ 1s, nhân đôi mỗi lần
        var backOff = new ExponentialBackOff(1000L, 2.0);
        backOff.setMaxElapsedTime(10000L); // Tối đa 10s

        DefaultErrorHandler errorHandler = new DefaultErrorHandler(recoverer, backOff);

        // Bỏ qua không cần retry các lỗi vô phương cứu chữa (như sai định dạng JSON)
        errorHandler.addNotRetryableExceptions(
            org.springframework.messaging.converter.MessageConversionException.class
        );

        return errorHandler;
    }
}
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa Consumer Rebalance bão táp**:
   - Nếu thời gian xử lý 1 message vượt quá \`max.poll.interval.ms\` (Mặc định 5 phút), Kafka Coordinator sẽ coi như Consumer đã chết và kích hoạt Rebalance!
   - Khắc phục: Giảm \`max.poll.records\` xuống 50 hoặc tăng \`max.poll.interval.ms\`.
`;
}

// Refactor Lesson 6-2-4
const l624 = m6.lessons.find(l => l.id === "6-2-4");
if (l624) {
  l624.title = "Bài 6.2.4: Tổng Kết Thực Chiến: Bản Đồ Transactional Outbox & Cơ Chế Exactly-Once Messaging Kafka";
  l624.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 6.2 thành Bản đồ kiến trúc truyền thông tin cậy cao (Reliable Messaging Pipeline).
- Nắm chắc chuỗi phối hợp hoàn hảo: **Transactional Outbox (Phía Producer) + Kafka DLT (Phía Broker) + Idempotent Consumer (Phía Consumer)**.
- Sẵn sàng bước sang Chuyên đề 6.3 (Saga Pattern & Distributed Transactions).
:::

---

## 1. Cái này là gì? (Bản Đồ Kiến Trúc Truyền Tin Cậy Hoàn Chỉnh)

\`\`\`mermaid
flowchart LR
    A["Order Service<br/>(Transactional Outbox)"] -->|"Đảm bảo gửi 100%"| B["Kafka Broker<br/>(Cluster 3 Nodes)"]
    B -->|"At-Least-Once Delivery"| C["Payment Service<br/>(Idempotent Consumer)"]
    C -->|"Nếu lỗi quá 3 lần"| D["Dead Letter Queue (.DLT)"]
    style A fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style B fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style C fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#fff
    style D fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
\`\`\`
`;
}

fs.writeFileSync(modulePath, "window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n" + JSON.stringify(m6, null, 2) + "\n);\n", "utf8");
console.log("Successfully refactored Module 6 Topics 6.1 & 6.2 (Lessons 6-1-1 to 6-2-4)!");
