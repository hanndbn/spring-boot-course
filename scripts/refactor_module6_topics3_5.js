const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module6.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m6 = window.COURSE_MODULES.find(m => m.id === 6);

// Refactor Lesson 6-3-1
const l631 = m6.lessons.find(l => l.id === "6-3-1");
if (l631) {
  l631.title = "Bài 6.3.1: Bản chất Saga Pattern: Chuỗi Giao Dịch Bù Trừ & So Sánh Choreography vs Orchestration";
  l631.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã tại sao cơ chế 2-Phase Commit (2PC) truyền thống bị phá sản hoàn toàn trên Cloud Native Microservices.
- Nắm vững kiến trúc **Saga Pattern**: Phân rã một giao dịch lớn thành chuỗi các giao dịch cục bộ (Local Transactions) kèm theo các giao dịch bù trừ (**Compensating Transactions**).
- Phân biệt sự khác nhau một trời một vực giữa **Choreography-based Saga** (Sự kiện nhảy múa tự do) và **Orchestration-based Saga** (Nhạc trưởng chỉ huy tập trung).
- Đọc hiểu 100% sơ đồ luồng bù trừ qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: SAGA PATTERN LÀ GÌ?
**Hình tượng "Chuyến du lịch 3 chặng và chính sách hoàn tiền":**
- Bạn lên kế hoạch đi du lịch Đà Lạt gồm 3 chặng:
  1. Đặt vé máy bay khứ hồi (Chặng 1 - \`order-service\`).
  2. Đặt phòng khách sạn 3 đêm (Chặng 2 - \`hotel-service\`).
  3. Thuê xe máy tự lái (Chặng 3 - \`vehicle-service\`).
- Bạn đã mua xong vé máy bay và đặt xong phòng khách sạn. Nhưng đến chặng 3 thì... **hết xe máy để thuê**!
- Trong kiến trúc Microservices phân tán, bạn không thể bấm nút "Rollback" toàn bộ Database của 3 công ty khác nhau!
- **Saga Pattern chính là "Quy trình bù trừ (Hoàn tiền)"**:
  - Khi chặng 3 thất bại -> Hệ thống tự động kích hoạt vé hoàn hủy:
  - Gọi khách sạn: *"Hủy phòng và hoàn tiền lại cho tôi!"* (**Giao dịch bù trừ C2**).
  - Gọi hãng máy bay: *"Hủy vé và hoàn tiền vé lại cho tôi!"* (**Giao dịch bù trừ C1**).
  - Trạng thái quay trở lại an toàn như lúc chưa từng đặt!
:::

---

## 1. Cái này là gì? (Kiến trúc Chuỗi Giao Dịch Bù Trừ Saga)

Một Saga là chuỗi gồm $N$ bước: $T_1, T_2, ..., T_n$. Mỗi bước $T_i$ có một giao dịch bù trừ tương ứng $C_i$ (Compensating Transaction) có nhiệm vụ hoàn tác lại kết quả của $T_i$ nếu bất kỳ bước nào phía sau gặp sự cố.

### Sơ Đồ So Sánh: Choreography (Tự do) vs Orchestration (Nhạc trưởng):

\`\`\`mermaid
flowchart TD
    subgraph CHOREOGRAPHY["1. Choreography Saga (Nhảy múa tự do qua Event)"]
        O1["Order Service"] -->|"Bắn event OrderCreated"| P1["Payment Service"]
        P1 -->|"Bắn event PaymentSuccess"| I1["Inventory Service"]
        Note right of I1: "Ưu điểm: Không có điểm nghẽn tập trung.<br/>Nhược điểm: Cực kỳ khó debug khi có 10 services!"
    end
    subgraph ORCHESTRATION["2. Orchestration Saga (Nhạc trưởng chỉ huy tập trung)"]
        MGR["Order Saga Orchestrator<br/>(Class Nhạc Trưởng Quản Lý State Machine)"]
        MGR -->|"1. Lệnh trừ tiền"| P2["Payment Service"]
        MGR -->|"2. Lệnh giữ hàng"| I2["Inventory Service"]
        MGR -->|"3. Lệnh giao hàng"| D2["Delivery Service"]
        Note right of MGR: "⭐ Chuẩn Senior: Kiểm soát trạng thái tập trung 100%!"
    end
    style ORCHESTRATION fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style CHOREOGRAPHY fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Ma Trận Quyết Định Kỹ Thuật)

### Ma trận So sánh: Choreography vs Orchestration Saga

| Tiêu chí | Choreography Saga (Event-driven) | Orchestration Saga (Coordinator) |
|---|---|---|
| **Độ phức tạp** | Đơn giản khi chỉ có 2-3 services | Cần viết thêm 1 Orchestrator Service |
| **Khả năng quan sát (Observability)** | Rất khó: Luồng đi rải rác khắp nơi | ⭐ **Dễ dàng 100%**: Xem trạng thái Saga trên 1 bảng |
| **Nguy cơ phụ thuộc vòng tròn** | Dễ bị lặp vô tận giữa các event | Hoàn toàn không có phụ thuộc vòng |
| **Khuyến nghị thực tế** | Dự án nhỏ dưới 3 microservices | **Bắt buộc cho luồng thanh toán E-Commerce** |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Giao dịch bù trừ bắt buộc phải có tính Idempotent (Bất biến)**:
   - Khi mạng bị chập chờn, lệnh bù trừ \`refundMoney()\` có thể bị gọi lại 2 lần.
   - Bắt buộc phải kiểm tra để không hoàn tiền 2 lần cho khách!
`;
}

// Refactor Lesson 6-3-2
const l632 = m6.lessons.find(l => l.id === "6-3-2");
if (l632) {
  l632.title = "Bài 6.3.2: Triển khai Saga Orchestrator cho Chuỗi Đặt Hàng Order -> Payment -> Inventory";
  l632.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tự tay xây dựng class **\`OrderSagaOrchestrator\`** quản lý vòng đời chuyển trạng thái của chuỗi đặt hàng.
- Mô phỏng kịch bản: Trừ tiền thành công -> Giữ hàng thất bại -> Tự động kích hoạt hoàn tiền bù trừ.
- Đọc hiểu 100% từng dòng code điều phối Saga qua Bảng giải mã chi tiết.
:::

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Mã nguồn điều phối Saga Orchestration:

\`\`\`java
package vn.mastery.ecommerce.saga;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import vn.mastery.ecommerce.client.InventoryClient;
import vn.mastery.ecommerce.client.PaymentClient;
import vn.mastery.ecommerce.domain.Order;
import vn.mastery.ecommerce.domain.OrderStatus;
import vn.mastery.ecommerce.repository.OrderRepository;

@Service
public class OrderSagaOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(OrderSagaOrchestrator.class);

    private final PaymentClient paymentClient;
    private final InventoryClient inventoryClient;
    private final OrderRepository orderRepository;

    public OrderSagaOrchestrator(PaymentClient paymentClient, InventoryClient inventoryClient,
                                 OrderRepository orderRepository) {
        this.paymentClient = paymentClient;
        this.inventoryClient = inventoryClient;
        this.orderRepository = orderRepository;
    }

    public void executeOrderSaga(Order order) {
        log.info("Bắt đầu Saga cho Đơn hàng ID: {}", order.getId());

        // BƯỚC 1: Thực hiện trừ tiền
        boolean paymentSuccess = paymentClient.processPayment(order.getId(), order.getTotalAmount());
        if (!paymentSuccess) {
            order.setStatus(OrderStatus.FAILED);
            orderRepository.save(order);
            log.warn("Thanh toán thất bại, kết thúc Saga!");
            return;
        }

        // BƯỚC 2: Thực hiện giữ hàng trong kho
        boolean inventoryReserved = inventoryClient.reserveStock(order.getId(), order.getItems());
        if (!inventoryReserved) {
            log.error("Kho hết hàng! KÍCH HOẠT GIAO DỊCH BÙ TRỪ: Hoàn tiền lại cho khách!");
            // BƯỚC BÙ TRỪ: Hoàn tiền
            paymentClient.refundPayment(order.getId(), order.getTotalAmount());

            order.setStatus(OrderStatus.CANCELLED_OUT_OF_STOCK);
            orderRepository.save(order);
            return;
        }

        // BƯỚC 3: Toàn bộ chuỗi thành công!
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);
        log.info("Saga hoàn tất 100% thành công cho đơn hàng: {}", order.getId());
    }
}
\`\`\`

### Bảng Giải Mã Logic Điều Phối:

| Bước xử lý | Hành động | Cơ chế bù trừ khi lỗi |
|---|---|---|
| Bước 1 | Gọi \`paymentClient.processPayment\` | Nếu fail: Đánh dấu đơn FAILED, dừng lại |
| Bước 2 | Gọi \`inventoryClient.reserveStock\` | Nếu fail: **Lập tức gọi \`refundPayment\`** để hoàn tiền, đổi trạng thái CANCELLED |
| Bước 3 | Cập nhật \`CONFIRMED\` | Chuỗi Saga khép lại hoàn mỹ |
`;
}

// Refactor Lesson 6-3-3
const l633 = m6.lessons.find(l => l.id === "6-3-3");
if (l633) {
  l633.title = "Bài 6.3.3: Cạm bẫy Thiếu Tính Cô Lập (Lack of Isolation) Trong Saga & Bù Trừ Thất Bại Giữa Chừng";
  l633.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã rủi ro lớn nhất của Saga: **Thiếu tính cô lập (Lack of Isolation - Chữ I trong ACID)**.
- Xử lý hiện tượng "Dirty Read giữa các Saga": Người dùng nhìn thấy trạng thái trung gian trước khi bị bù trừ.
- Áp dụng kỹ thuật **Semantic Lock** (Đặt cờ trạng thái \`PENDING_PAYMENT\` / \`PENDING_REFUND\`).
- Xử lý khi chính giao dịch bù trừ bị lỗi mạng: Cơ chế **Idempotent Retry** bền bỉ.
:::

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Không bao giờ trừ thẳng vào số dư khả dụng khi chưa hoàn tất Saga**:
   - Luôn dùng trường \`frozen_balance\` (Số dư đóng băng) hoặc \`reserved_stock\` (Kho tạm giữ).
   - Chỉ khi toàn bộ Saga thành công mới trừ dứt điểm.
`;
}

// Refactor Lesson 6-3-4
const l634 = m6.lessons.find(l => l.id === "6-3-4");
if (l634) {
  l634.title = "Bài 6.3.4: Tổng Kết Thực Chiến: Bản Đồ Điều Phối Saga & Ma Trận Lựa Chọn Mô Hình Giao Dịch Phân Tán";
  l634.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 6.3 thành Bản đồ Giao dịch Phân tán Chuẩn Senior.
- Sẵn sàng bước sang Chuyên đề 6.4 (Kiến trúc Tự phục hồi Resilience4j & Spring Cloud Gateway).
:::

---

## 1. Cái này là gì? (Bản Đồ Kiến Trúc Saga Toàn Cảnh)

\`\`\`mermaid
flowchart TD
    START["Khách Bấm Đặt Hàng"] --> SAGA["Order Saga Orchestrator"]
    SAGA --> T1["T1: Payment (Trừ tiền)"]
    T1 -->|Thành công| T2["T2: Inventory (Giữ kho)"]
    T2 -->|Thất bại!| C1["C1: Bù trừ Hoàn tiền lại (Compensating)"]
    C1 --> FAILED["Đơn hàng hủy an toàn, tiền về ví khách"]
    T2 -->|Thành công| SUCCESS["Đơn hàng xác nhận thành công 100%!"]
    style SAGA fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style C1 fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
    style SUCCESS fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`
`;
}

// Refactor Lesson 6-4-1
const l641 = m6.lessons.find(l => l.id === "6-4-1");
if (l641) {
  l641.title = "Bài 6.4.1: Kiến trúc Tự Phục Hồi: Circuit Breaker State Machine & Cỗ Máy Spring Cloud Gateway";
  l641.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã hiện tượng sập đổ dây chuyền (Cascading Failure) khi một microservice bị chậm kéo sập toàn bộ cụm hệ thống.
- Làm chủ cỗ máy trạng thái của **Circuit Breaker (Resilience4j)**: **CLOSED -> OPEN -> HALF-OPEN**.
- Hiểu cơ chế hoạt động phi nghẽn (Non-blocking Reactive) của **Spring Cloud Gateway** dựa trên Netty.
- Đọc hiểu 100% sơ đồ chuyển đổi trạng thái cầu dao qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CẦU DAO ĐIỆN VÀ BỨC TƯỜNG CÁCH LY
**Hình tượng "Chiếc cầu dao tự ngắt trong nhà bạn":**
- Khi trời mưa bão, một chiếc quạt điện trong phòng ngủ bị chập cháy (Dịch vụ \`payment-service\` bị treo).
- Nếu trong nhà không có cầu dao an toàn: Dòng điện chập sẽ lan sang tủ lạnh, tivi, máy giặt làm **cháy rụi toàn bộ ngôi nhà (Cascading Failure sập toàn bộ hệ thống)**!
- **Chiếc cầu dao thông minh (Circuit Breaker Resilience4j)**:
  - Bình thường: Cầu dao đóng (**CLOSED**), dòng điện chạy êm đềm.
  - Khi thấy 5 lần liên tiếp có mùi khét (Tỷ lệ lỗi > 50%): Cầu dao **TỰ ĐỘNG BẬT CÔNG TẮC NGẮT ĐIỆN (OPEN)**!
  - 100% các yêu cầu tiếp theo sẽ bị chặn lại ngay tại cửa và trả về thông báo lỗi lịch sự (**Fallback**) trong 1 mili-giây, không để ai phải đứng chờ!
  - Sau 10 giây: Cầu dao hé mở một nửa (**HALF-OPEN**) cho 3 người đi qua thử. Nếu thấy quạt đã sửa xong -> Đóng cầu dao lại bình thường!
:::

---

## 1. Cái này là gì? (Cỗ Máy Trạng Thái Circuit Breaker)

\`\`\`mermaid
stateDiagram-v2
    [*] --> CLOSED: Khởi động bình thường
    CLOSED --> OPEN: Tỷ lệ lỗi vượt ngưỡng (Failure Rate > 50%)
    OPEN --> HALF_OPEN: Hết thời gian chờ (waitDurationInOpenState: 10s)
    HALF_OPEN --> CLOSED: Thử nghiệm thành công (Tỷ lệ lỗi thấp)
    HALF_OPEN --> OPEN: Thử nghiệm vẫn thất bại -> Mở lại cầu dao!
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi dịch vụ Cổng thanh toán hoặc Đơn vị vận chuyển thứ ba gặp sự cố mạng chậm:

### Ma trận So sánh: Không có Circuit Breaker vs Có Resilience4j

| Tiêu chí | Không có Circuit Breaker | Có Resilience4j Circuit Breaker |
|---|---|---|
| **Hành vi khi đối tác chậm 10s** | Toàn bộ thread của Tomcat bị giữ chặt 10s -> Server nghẽn chết | Cầu dao ngắt sau 5 lỗi -> Trả về lỗi Fallback ngay trong **1ms** |
| **Bảo vệ hệ thống đối tác** | Tiếp tục nã hàng nghìn request khiến đối tác chết sâu hơn | Chặn request từ xa, cho đối tác thời gian hồi phục |
| **Trải nghiệm người dùng** | Màn hình xoay vòng chờ đợi vô vọng rồi báo timeout | Hiện ngay thông báo thân thiện: *"Cổng thanh toán đang bảo trì, vui lòng chọn COD"* |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Không bao giờ bọc Circuit Breaker trên các dịch vụ nội bộ có độ tin cậy cao**:
   - Chỉ nên áp dụng cho các cuộc gọi ra mạng bên ngoài hoặc các microservices có nguy cơ cao.
`;
}

// Refactor Lesson 6-4-2
const l642 = m6.lessons.find(l => l.id === "6-4-2");
if (l642) {
  l642.title = "Bài 6.4.2: Cấu hình Resilience4j Circuit Breaker Kết Hợp Gateway Rate Limiting Redis";
  l642.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Cấu hình trọn bộ tham số Resilience4j Circuit Breaker và TimeLimiter trong \`application.yml\`.
- Triển khai phương thức dự phòng **Fallback Method** xử lý mượt mà khi cầu dao ngắt.
- Cấu hình thuật toán giới hạn tần suất **Token Bucket Rate Limiter** bằng Redis trên Spring Cloud Gateway.
- Đọc hiểu 100% từng dòng cấu hình qua Bảng giải mã chi tiết.
:::

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Sử dụng annotation \`@CircuitBreaker\` kèm fallback:

\`\`\`java
package vn.mastery.ecommerce.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import vn.mastery.ecommerce.client.PaymentGatewayClient;
import java.math.BigDecimal;

@Service
public class ResilientPaymentService {

    private static final Logger log = LoggerFactory.getLogger(ResilientPaymentService.class);
    private final PaymentGatewayClient client;

    public ResilientPaymentService(PaymentGatewayClient client) {
        this.client = client;
    }

    @CircuitBreaker(name = "paymentServiceBreaker", fallbackMethod = "fallbackProcessPayment")
    public String processPayment(Long orderId, BigDecimal amount) {
        return client.callExternalGateway(orderId, amount);
    }

    // Phương thức Fallback được gọi tự động khi Circuit Breaker ở trạng thái OPEN hoặc Timeout
    public String fallbackProcessPayment(Long orderId, BigDecimal amount, Throwable throwable) {
        log.warn("Cầu dao ngắt hoặc cổng thanh toán lỗi: {}. Chuyển sang thanh toán COD!", throwable.getMessage());
        return "FALLBACK_PAYMENT_COD_PENDING";
    }
}
\`\`\`

Cấu hình \`application.yml\` chuẩn:

\`\`\`yaml
resilience4j:
  circuitbreaker:
    instances:
      paymentServiceBreaker:
        slidingWindowType: COUNT_BASED
        slidingWindowSize: 10              # Theo dõi 10 cuộc gọi gần nhất
        failureRateThreshold: 50           # Nếu > 50% cuộc gọi bị lỗi -> Mở cầu dao
        waitDurationInOpenState: 10s       # Sau 10 giây mở cầu dao chuyển sang Half-Open
        permittedNumberOfCallsInHalfOpenState: 3 # Thử nghiệm 3 cuộc gọi
\`\`\`
`;
}

// Refactor Lesson 6-4-3
const l643 = m6.lessons.find(l => l.id === "6-4-3");
if (l643) {
  l643.title = "Bài 6.4.3: Cạm bẫy Thứ Tự Bọc AOP Sai (Retry bọc ngoài CircuitBreaker) & Gateway Chậm I/O";
  l643.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã lỗi kiến trúc tai hại: **Thứ tự bọc Aspect AOP sai giữa \`@Retry\` và \`@CircuitBreaker\`**.
- Hiểu tại sao nếu bọc Retry ra ngoài CircuitBreaker, cầu dao sẽ bị vô hiệu hóa hoàn toàn.
- Cấu hình thứ tự ưu tiên chuẩn: **Retry -> CircuitBreaker -> RateLimiter -> TimeLimiter**.
:::

---

## 1. Cái này là gì? (Thứ Tự Bọc AOP Chuẩn Của Resilience4j)

\`\`\`mermaid
flowchart TD
    CALL["Request Gọi Hàm"] --> R["1. Retry (Thử lại 3 lần)"]
    R --> CB["2. CircuitBreaker (Đếm tỷ lệ lỗi)"]
    CB --> RL["3. RateLimiter (Kiểm tra quota)"]
    RL --> TL["4. TimeLimiter (Giới hạn timeout 2s)"]
    TL --> TARGET["Mã Nguồn Service Thật"]
    style CB fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style R fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`
`;
}

// Refactor Lesson 6-4-4
const l644 = m6.lessons.find(l => l.id === "6-4-4");
if (l644) {
  l644.title = "Bài 6.4.4: Tổng Kết Thực Chiến: Bản Đồ Tự Phục Hồi Hệ Thống & Ma Trận Xử Lý Sự Cố Phân Tán";
  l644.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 6.4 thành Bản đồ Tự Phục Hồi (Self-Healing Architecture).
- Sẵn sàng bước sang Chuyên đề 6.5 (Xử lý dữ liệu lớn với Spring Batch & Chuyển dịch Spring Modulith).
:::

---

## 1. Cái này là gì? (Bản Đồ Tự Phục Hồi Toàn Cảnh)

\`\`\`mermaid
flowchart LR
    GW["Spring Cloud Gateway<br/>(Redis Rate Limiting)"] --> CB["Resilience4j Circuit Breaker<br/>(Chống sập đổ dây chuyền)"]
    CB --> FB["Fallback Graceful Degradation<br/>(Chuyển sang COD / Cache)"]
    style GW fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style CB fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style FB fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#fff
\`\`\`
`;
}

// Refactor Lesson 6-5-1
const l651 = m6.lessons.find(l => l.id === "6-5-1");
if (l651) {
  l651.title = "Bài 6.5.1: Kiến trúc Chunk-Oriented Processing (Spring Batch) & Triết lý Spring Modulith";
  l651.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã kiến trúc xử lý dữ liệu lớn theo từng mảnh: **Chunk-Oriented Processing (ItemReader -> ItemProcessor -> ItemWriter)** trong Spring Batch 5.
- Hiểu tại sao dùng vòng lặp thông thường để duyệt 1 triệu bản ghi sẽ làm tràn bộ nhớ \`OutOfMemoryError\` ngay lập tức.
- Nắm vững triết lý **Spring Modulith**: Kiến trúc nguyên khối có cấu trúc module chặt chẽ (Modular Monolith) — bước chuyển tiếp hoàn hảo trước khi nhảy sang Microservices.
- Đọc hiểu 100% từng dòng kiến trúc qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CHUNK PROCESSING VÀ SPRING MODULITH
**1. Chunk-Oriented Processing — "Ăn từng miếng thay vì nuốt cả chiếc bánh":**
- Bạn có 1 triệu đơn hàng cần chốt sổ đối soát vào lúc nửa đêm:
- **Cách làm dại dột**: Viết lệnh \`orderRepository.findAll()\` -> Nạp cả 1 triệu đối tượng vào RAM -> Server nổ tung \`OutOfMemoryError\`!
- **Spring Batch Chunk Processing**:
  - Đọc đúng **100 đơn hàng** (\`ItemReader\`).
  - Xử lý tính toán hoa hồng cho 100 đơn đó (\`ItemProcessor\`).
  - Ghi 100 dòng kết quả xuống DB trong 1 Transaction (\`ItemWriter\`).
  - Giải phóng bộ nhớ RAM và lặp lại cho mảnh tiếp theo! Xử lý 100 triệu dòng vẫn chỉ tốn đúng 200MB RAM!

**2. Spring Modulith — "Căn hộ nhiều phòng ngủ có cửa cách âm":**
- Thay vì vội vã chia tách thành 10 dịch vụ Microservices riêng lẻ với chi phí hạ tầng đắt đỏ:
- Bạn giữ toàn bộ mã nguồn trong 1 ứng dụng duy nhất, nhưng dùng **Spring Modulith** để dựng các bức tường ngăn cách tuyệt đối giữa các module.
- Khi cần scale, tách một module ra thành Microservice chỉ mất **nửa ngày**!
:::

---

## 1. Cái này là gì? (Kiến trúc Chunk-Oriented Trong Spring Batch 5)

\`\`\`mermaid
flowchart LR
    A["JobLauncher"] --> B["Job (DailyReconciliationJob)"]
    B --> C["Step (Chunk: 100)"]
    
    subgraph CHUNK["Vòng Lặp Chunk 100 Bản Ghi"]
        R["ItemReader (Đọc 1 dòng từ DB)"] --> P["ItemProcessor (Tính toán logic)"]
        P --> W["ItemWriter (Ghi 100 dòng trong 1 TX)"]
    end
    
    C --> CHUNK
    style B fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style CHUNK fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`
`;
}

// Refactor Lesson 6-5-2
const l652 = m6.lessons.find(l => l.id === "6-5-2");
if (l652) {
  l652.title = "Bài 6.5.2: Triển khai Spring Batch Job Xử Lý 1 Triệu Giao Dịch & Kiểm Soát Ranh Giới Modulith";
  l652.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tự tay cấu hình một Batch Job hoàn chỉnh với Spring Boot 3.3+: **JobBuilderFactory**, **StepBuilderFactory** (Cú pháp JobBuilder mới).
- Sử dụng \`JpaPagingItemReader\` phân trang nạp dữ liệu mượt mà từ PostgreSQL.
- Kiểm thử ranh giới kiến trúc Spring Modulith bằng **\`ApplicationModules.of(Application.class).verify()\`**.
- Đọc hiểu 100% từng dòng code cấu hình Batch qua Bảng giải mã chi tiết.
:::

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Cấu hình Spring Batch 5 trong Spring Boot 3:

\`\`\`java
package vn.mastery.ecommerce.batch;

import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.batch.item.ItemReader;
import org.springframework.batch.item.ItemWriter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;
import vn.mastery.ecommerce.domain.Order;
import vn.mastery.ecommerce.dto.OrderSettlementDto;

@Configuration
public class OrderBatchConfig {

    @Bean
    public Job dailySettlementJob(JobRepository jobRepository, Step settlementStep) {
        return new JobBuilder("dailySettlementJob", jobRepository)
            .start(settlementStep)
            .build();
    }

    @Bean
    public Step settlementStep(JobRepository jobRepository,
                               PlatformTransactionManager transactionManager,
                               ItemReader<Order> orderReader,
                               ItemProcessor<Order, OrderSettlementDto> orderProcessor,
                               ItemWriter<OrderSettlementDto> orderWriter) {
        return new StepBuilder("settlementStep", jobRepository)
            .<Order, OrderSettlementDto>chunk(100, transactionManager) // Chunk size: 100 bản ghi
            .reader(orderReader)
            .processor(orderProcessor)
            .writer(orderWriter)
            .build();
    }
}
\`\`\`

Kiểm thử toàn vẹn ranh giới Spring Modulith:

\`\`\`java
package vn.mastery.ecommerce;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class ModulithArchitectureTest {

    @Test
    void verifyModularStructure() {
        // Tự động kiểm tra: Không module con nào được gọi lậu code nội bộ của module khác!
        ApplicationModules.of(EcommerceApplication.class).verify();
    }
}
\`\`\`
`;
}

// Refactor Lesson 6-5-3
const l653 = m6.lessons.find(l => l.id === "6-5-3");
if (l653) {
  l653.title = "Bài 6.5.3: Cạm bẫy Tràn Heap Memory Trong ItemReader & Rò Rỉ Tenant Context Đa Khách Hàng";
  l653.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã lỗi tràn RAM kinh điển khi dùng \`JpaCursorItemReader\` trên cơ sở dữ liệu không hỗ trợ Streaming Cursor.
- Khắc phục bằng \`JpaPagingItemReader\` kết hợp \`pageSize\` bằng đúng \`chunkSize\`.
- Xử lý cạm bẫy rò rỉ dữ liệu Tenant trong môi trường Multi-tenant SaaS Batch.
:::

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Luôn đặt \`pageSize\` của PagingItemReader bằng với \`chunkSize\`**:
   - Nếu \`pageSize = 10\` còn \`chunkSize = 100\`, Hibernate phải bắn 10 câu query phân trang chỉ để gom đủ 1 đợt ghi!
`;
}

// Refactor Lesson 6-5-4
const l654 = m6.lessons.find(l => l.id === "6-5-4");
if (l654) {
  l654.title = "Bài 6.5.4: Tổng Kết Thực Chiến: Bản Đồ Xử Lý Dữ Liệu Lớn & Ma Trận Kiến Trúc Monolith vs Modulith vs Microservices";
  l654.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Module 6 thành Bản đồ Hệ thống Phân tán (Distributed Systems Blueprint).
- Nắm vững ma trận chuyển đổi kiến trúc: **Monolith -> Spring Modulith -> Event-Driven Microservices**.
- Sẵn sàng bước sang Module 7 (DevOps & Observability: Docker Multi-Stage, Kubernetes & OpenTelemetry).
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỔNG KẾT MODULE 6
Bạn vừa hoàn thành một trong những đỉnh núi cao nhất của kỹ sư phần mềm:
- **Bộ nhớ siêu tốc**: Caffeine L1 + Redis L2 + Redisson Lock.
- **Truyền tin cậy cao**: Transactional Outbox + Kafka Idempotent Consumer.
- **Giao dịch phân tán**: Saga Orchestrator tự động hoàn tiền bù trừ.
- **Tự phục hồi**: Resilience4j Circuit Breaker ngăn chặn sập đổ dây chuyền.
- **Dữ liệu triệu dòng**: Spring Batch Chunk Processing chạy êm ái trên ít RAM.
Toàn bộ hệ thống của bạn đã sẵn sàng đóng gói đưa lên Kubernetes Production!
:::

---

## 1. Cái này là gì? (Bản Đồ Toàn Cảnh Module 6)

\`\`\`mermaid
graph TD
    subgraph M6["MODULE 6: MICROSERVICES & MESSAGING"]
        T1["6.1 Caching & Distributed Lock (Caffeine, Redis, Redisson)"]
        T2["6.2 Messaging (Transactional Outbox, Kafka, Idempotent)"]
        T3["6.3 Distributed Transactions (Saga Orchestration, Bù trừ)"]
        T4["6.4 Self-Healing (Resilience4j Circuit Breaker, Gateway)"]
        T5["6.5 Big Data & Modulith (Spring Batch Chunk, Spring Modulith)"]
    end
    
    T1 --> T2 --> T3 --> T4 --> T5
    T5 ==> NEXT["MODULE 7: DEVOPS & OBSERVABILITY<br/>(Docker Layered JAR, Kubernetes Probes, Prometheus, OTel)"]
    style M6 fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style NEXT fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Checklist tốt nghiệp Module 6**:
   - [ ] Làm chủ Redis Caching 2 tầng và Redisson Lock.
   - [ ] Triệt tiêu lỗi Dual-Write bằng Transactional Outbox Pattern.
   - [ ] Đảm bảo tính Idempotent cho 100% Kafka Consumers.
   - [ ] Xây dựng Saga Orchestrator cho luồng đặt hàng.
   - [ ] Bật Circuit Breaker bảo vệ hệ thống trước sự cố đối tác.
   - [ ] Chạy Spring Batch xử lý dữ liệu lớn không tràn bộ nhớ.
`;
}

fs.writeFileSync(modulePath, "window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n" + JSON.stringify(m6, null, 2) + "\n);\n", "utf8");
console.log("Successfully refactored Module 6 Topics 6.3, 6.4, 6.5 (Lessons 6-3-1 to 6-5-4)!");
