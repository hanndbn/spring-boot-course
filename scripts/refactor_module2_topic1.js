const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module2.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m2 = window.COURSE_MODULES[0];

// Refactor Lesson 2-1-1
const l211 = m2.lessons.find(l => l.id === "2-1-1");
if (l211) {
  l211.title = "Bài 2.1.1: Kiến trúc DispatcherServlet, Front Controller Pattern & Vòng Đời HTTP Request";
  l211.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu sâu Front Controller Pattern và vai trò "nhạc trưởng điều phối" của \`DispatcherServlet\`.
- Nắm chắc chuỗi xử lý 5 bước: Tomcat -> FilterChain -> HandlerMapping -> HandlerAdapter -> HttpMessageConverter (Jackson).
- Phân biệt sự khác nhau giữa \`@Controller\` và \`@RestController\`.
- Đọc hiểu 100% từng dòng code của một REST Controller chuẩn mực qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: NHÀ HÀNG GỌI MÓN (REST API & DISPATCHERSERVLET)
Hãy tưởng tượng việc Client (App điện thoại / Web) gọi API đến Spring Boot giống như bạn bước vào một nhà hàng sang trọng:
- **DispatcherServlet (Lễ tân trưởng đón khách)**: Đứng ở cửa đón bạn, chào hỏi và hỏi bạn muốn ăn món gì.
- **HandlerMapping (Sổ thực đơn phân công đầu bếp)**: Tra cứu URL \`/api/v1/orders\` và Method \`POST\` để biết đưa yêu cầu cho Đầu bếp nào (\`OrderController\`).
- **HandlerAdapter (Người phục vụ bưng món)**: Chuyển đổi ngôn ngữ của khách (chuỗi JSON gửi lên) thành đĩa nguyên liệu sạch (\`OrderRequestDto\`) cho đầu bếp nấu.
- **HttpMessageConverter (Jackson JSON Serializer)**: Biến món ăn chín của đầu bếp (\`OrderResponseDto\`) thành chiếc hộp cơm mang về (chuỗi JSON Byte Stream) trao tận tay khách hàng!
- **HTTP Status Code (Phản hồi từ bồi bàn)**:
  - \`200 OK\`: Món ăn của bạn đây!
  - \`201 Created\`: Đã chế biến xong đơn hàng mới thành công!
  - \`400 Bad Request\`: Quý khách gọi món sai định dạng (thiếu số lượng hoặc email không hợp lệ)!
  - \`401 Unauthorized\`: Xin lỗi, quý khách chưa đăng nhập / chưa xuất trình thẻ hội viên!
  - \`404 Not Found\`: Món này không có trong thực đơn (không tìm thấy ID)!
  - \`500 Internal Server Error\`: Bếp nhà hàng bị chập điện (Server crash lỗi unhandled)!
:::

---

## 1. Cái này là gì? (Kiến trúc DispatcherServlet Pipeline)

Spring MVC được xây dựng trên mô hình thiết kế **Front Controller Pattern**, trong đó \`DispatcherServlet\` là điểm tiếp nhận duy nhất của mọi HTTP Request gửi tới ứng dụng.

### Sơ Đồ Kiến Trúc: Hành Trình 1 HTTP Request Qua Spring MVC Pipeline

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as Mobile App / Frontend
    participant Tomcat as Embedded Tomcat Connector (8080)
    participant Filters as Security / MDC FilterChain
    participant DS as DispatcherServlet
    participant Mapping as RequestMappingHandlerMapping
    participant Adapter as RequestMappingHandlerAdapter (Jackson)
    participant Ctrl as OrderController (@RestController)

    Client->>Tomcat: HTTP POST /api/v1/orders
    Tomcat->>Filters: doFilter()
    Note over Filters: Xác thực JWT & Tạo MDC TraceId
    Filters->>DS: doDispatch()
    DS->>Mapping: Tìm Controller xử lý URL & POST
    Mapping-->>DS: Trả về HandlerMethod
    DS->>Adapter: invokeHandlerMethod()
    Note over Adapter: Jackson chuyển JSON Body -> OrderCreateRequest
    Adapter->>Ctrl: createOrder(request)
    Ctrl-->>Adapter: Trả về ResponseEntity<OrderResponse>
    Note over Adapter: Jackson chuyển OrderResponse -> JSON Byte Stream
    Adapter-->>DS: Hoàn tất xử lý
    DS-->>Filters: HTTP 201 Created
    Filters-->>Client: Response Body (JSON)
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### Ma trận So sánh: API Nghiệp Dư vs API Cấp Doanh Nghiệp (Enterprise-grade)

| Tiêu chí | API Nghiệp Dư (Code ẩu) | API Chuẩn Enterprise Senior |
|---|---|---|
| **Mã HTTP Status** | Luôn trả về \`200 OK\` kể cả khi lỗi (kèm \`{"status": "error"}\`) | ⭐ Chuẩn REST: \`201 Created\`, \`400 Bad Request\`, \`404 Not Found\`, \`409 Conflict\` |
| **Bảo mật dữ liệu** | Trả thẳng JPA Entity ra ngoài (lộ password hash, số dư ví) | ⭐ Luôn dùng DTO Record bất biến để che giấu trường nhạy cảm |
| **Truy vết lỗi** | Không có Trace ID, khách báo lỗi không biết tìm log ở đâu | ⭐ Tích hợp MDC Trace ID trả về header \`X-Trace-ID\` để tra cứu trong 3 giây |
| **Giám sát hệ thống** | Prometheus/Datadog tưởng hệ thống chạy 100% bình thường vì toàn 200 | ⭐ Giám sát theo dõi chính xác tỷ lệ lỗi 4xx/5xx theo thời gian thực |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là một REST Controller chuẩn mực cho nghiệp vụ Đặt hàng E-Commerce:

\`\`\`java
package vn.mastery.ecommerce.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.mastery.ecommerce.dto.OrderCreateRequest;
import vn.mastery.ecommerce.dto.OrderResponse;
import vn.mastery.ecommerce.service.OrderService;
import java.net.URI;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@RequestBody OrderCreateRequest request) {
        OrderResponse response = orderService.createOrder(request);
        URI location = URI.create("/api/v1/orders/" + response.orderId());
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long orderId) {
        OrderResponse response = orderService.getOrderById(orderId);
        return ResponseEntity.ok(response);
    }
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động DispatcherServlet |
|---|---|---|---|
| Dòng 10 | \`@RestController\` | Kết hợp \`@Controller\` và \`@ResponseBody\` | Báo hiệu cho DispatcherServlet: mọi kết quả trả về tự động serialize sang JSON |
| Dòng 11 | \`@RequestMapping("/api/v1/orders")\` | Định tuyến URL gốc với tiền tố phiên bản API | Đăng ký URL prefix vào \`RequestMappingHandlerMapping\` |
| Dòng 20 | \`@PostMapping\` | So khớp HTTP Method POST | Chỉ xử lý khi Client gửi HTTP POST tới \`/api/v1/orders\` |
| Dòng 21 | \`@RequestBody OrderCreateRequest request\` | Kích hoạt Jackson MessageConverter | Đọc chuỗi JSON từ HTTP Request Body và parse thành đối tượng Java |
| Dòng 23 | \`URI location = URI.create(...)\` | Chuẩn RESTful: Header \`Location\` | Trả về URL nơi Client có thể truy cập tài nguyên vừa tạo |
| Dòng 24 | \`return ResponseEntity.created(location).body(...)\` | Trả về mã HTTP 201 Created | DispatcherServlet set status = 201 và nạp header Location vào response |
| Dòng 28 | \`@PathVariable Long orderId\` | Trích xuất biến từ đường dẫn URL | Lấy số ID từ URL \`/api/v1/orders/123\` gán vào tham số \`orderId\` |

---

## 4. Cạm bẫy thực tế & Best Practices (Senior Trap Guide)

:::danger 2 CẠM BẪY PHỔ BIẾN KHI VIẾT REST CONTROLLER
1. **Dùng \`@Controller\` thay vì \`@RestController\`**:
   - Nếu bạn dùng \`@Controller\` mà quên gắn \`@ResponseBody\`, Spring MVC sẽ tưởng bạn muốn trả về một trang giao diện HTML (JSP/Thymeleaf) -> Ném lỗi \`404 View Not Found\`!
2. **Trả về \`null\` khi không tìm thấy tài nguyên**:
   - Trả về \`null\` sẽ khiến Spring trả về mã \`200 OK\` với body rỗng. Phía Mobile App / Frontend tưởng thành công và cố đọc dữ liệu -> Bị sập app với lỗi \`TypeError: Cannot read properties of undefined\`!
   - *Cách chuẩn*: Ném ngoại lệ \`ResourceNotFoundException\` để Global Exception Handler trả về \`404 Not Found\`.
:::
`;
}

// Refactor Lesson 2-1-2
const l212 = m2.lessons.find(l => l.id === "2-1-2");
if (l212) {
  l212.title = "Bài 2.1.2: Triển khai Clean Architecture Phân Tầng (Controller - Service - Repository)";
  l212.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nắm vững quy tắc phụ thuộc (Dependency Rule) của Clean Architecture phân tầng: Web -> Application -> Domain -> Persistence.
- Phân tách tuyệt đối giữa DTO Request/Response (tầng Web) và JPA Entity (tầng Persistence).
- Tự tay xây dựng luồng Đặt hàng hoàn chỉnh chuẩn Senior: Controller -> Service -> Repository.
- Đọc hiểu toàn bộ mã nguồn qua Bảng phân tích chi tiết từng dòng code.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: DÂY CHUYỀN 3 TẦNG TRONG NHÀ MÁY
Hãy hình dung hệ thống E-Commerce như một nhà máy sản xuất:
1. **Tầng Lễ tân / Bán hàng (Controller Layer)**: Giao tiếp với khách hàng, nhận đơn đặt hàng, kiểm tra giấy tờ hợp lệ (Validation). Lễ tân **không bao giờ tự mình đi xuống kho bốc vác**!
2. **Tầng Kỹ thuật / Quản đốc (Service Layer)**: Nắm giữ toàn bộ bí quyết công nghệ và quy trình nghiệp vụ: kiểm tra tồn kho, áp mã giảm giá, tính tiền, gọi ngân hàng trừ tiền.
3. **Tầng Thủ kho (Repository Layer)**: Chỉ làm duy nhất việc ghi chép sổ sách và lấy hàng ra khỏi kho dữ liệu (Database).
=> Mỗi người một việc rõ ràng, khi cần đổi hệ thống kho từ MySQL sang PostgreSQL, tầng Lễ tân và Quản đốc **không bị ảnh hưởng gì cả**!
:::

---

## 1. Cái này là gì? (Quy tắc phụ thuộc trong Clean Architecture)

Quy tắc bất biến: Tầng ngoài (Controller) phụ thuộc vào tầng trong (Service); Tầng Service phụ thuộc vào Interface của tầng Repository; Tầng Persistence (Database) nằm ở ngoài cùng. Tuyệt đối **KHÔNG BAO GIỜ** cho phép Controller bypass Service để gọi thẳng Repository!

### Sơ Đồ Kiến Trúc: Dòng Chảy Dữ Liệu Phân Tầng E-Commerce

\`\`\`mermaid
flowchart LR
    Client["Client HTTP"] -->|JSON Request| Controller["OrderController (Web Layer)"]
    Controller -->|OrderCommand DTO| Service["OrderService (Application Layer)"]
    Service -->|Business Logic| Domain["Order Entity (Domain Logic)"]
    Service -->|Save / Query| Repository["OrderRepository (Data Access)"]
    Repository -->|SQL| Database[("PostgreSQL DB")]

    style Controller fill:#1e3a8a,stroke:#3b82f6,color:#fff
    style Service fill:#064e3b,stroke:#10b981,color:#fff
    style Domain fill:#78350f,stroke:#f59e0b,color:#fff
    style Repository fill:#1e293b,stroke:#64748b,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### Vì sao không được gọi thẳng Repository từ Controller?

| Tiêu chí | Viết logic trực tiếp trong Controller | Phân tầng Clean Architecture |
|---|---|---|
| **Tái sử dụng nghiệp vụ** | ❌ Bị khóa chặt trong HTTP: Khi có Event Kafka hoặc Cron Job cần đặt hàng, phải copy-paste code | ⭐ **Tái sử dụng 100%**: Cả REST Controller, Kafka Consumer và Scheduler đều gọi chung \`orderService.createOrder()\` |
| **Quản lý Transaction** | ❌ Controller không nên mở \`@Transactional\` vì làm giữ Connection DB quá lâu lúc parse JSON | ⭐ \`@Transactional\` chỉ mở trong Service, tối ưu hóa Connection Pool |
| **Khả năng kiểm thử** | ❌ Phải dựng MockMvc giả lập HTTP request mới test được logic tính tiền | ⭐ Viết Unit Test cho Service thuần túy chạy trong 2 miligiây |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là mã nguồn phân tầng chuẩn mực cho nghiệp vụ Đặt hàng:

\`\`\`java
package vn.mastery.ecommerce.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.ecommerce.dto.OrderCreateRequest;
import vn.mastery.ecommerce.dto.OrderResponse;
import vn.mastery.ecommerce.domain.Order;
import vn.mastery.ecommerce.repository.OrderRepository;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;

    public OrderServiceImpl(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Override
    @Transactional
    public OrderResponse createOrder(OrderCreateRequest request) {
        // 1. Chuyển đổi DTO -> Domain Entity
        Order order = new Order(request.customerId(), request.totalAmount(), "PENDING");
        
        // 2. Lưu xuống cơ sở dữ liệu
        Order savedOrder = orderRepository.save(order);

        // 3. Chuyển đổi Domain Entity -> DTO Response
        return new OrderResponse(
            savedOrder.getId(),
            savedOrder.getCustomerId(),
            savedOrder.getTotalAmount(),
            savedOrder.getStatus(),
            savedOrder.getCreatedAt()
        );
    }
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Spring |
|---|---|---|---|
| Dòng 10 | \`@Service\` | Khai báo bean nghiệp vụ | Đăng ký vào ApplicationContext để Controller inject vào |
| Dòng 19 | \`@Transactional\` | Mở ACID Transaction | Tự động mở connection, commit khi hàm kết thúc, rollback khi có Exception |
| Dòng 22 | \`Order order = new Order(...)\` | Khởi tạo Domain Entity sạch | Đảm bảo tính toàn vẹn dữ liệu nghiệp vụ trước khi lưu |
| Dòng 25 | \`orderRepository.save(order)\` | Ủy nhiệm cho Repository tương tác DB | Hibernate sinh câu lệnh \`INSERT INTO orders ...\` |
| Dòng 28-34 | \`return new OrderResponse(...)\` | Đóng gói DTO an toàn | Chỉ trả về các trường cần thiết cho Client, không lộ toàn bộ cấu trúc bảng |

---

## 4. Cạm bẫy thực tế & Best Practices (Senior Trap Guide)

:::danger LỖI GIỮ TRANSACTION QUÁ LÂU TẠI CONTROLLER
- Đặt \`@Transactional\` trên phương thức Controller là một "tội ác kiến trúc".
- Trong Controller, luồng có thể mất 3-5 giây để upload file, gọi API bên thứ ba hoặc parse JSON lớn. Nếu gắn \`@Transactional\`, connection database sẽ bị chiếm giữ trong suốt 5 giây đó -> Connection Pool cạn kiệt, toàn bộ hệ thống bị nghẽn (Connection Timeout)!
- **Quy tắc vàng**: \`@Transactional\` **CHỈ NẰM Ở TẦNG SERVICE**, chỉ bao bọc phạm vi các thao tác database thực sự cần thiết.
:::
`;
}

// Refactor Lesson 2-1-3
const l213 = m2.lessons.find(l => l.id === "2-1-3");
if (l213) {
  l213.title = "Bài 2.1.3: Cạm bẫy Lộ JPA Entity ra Controller, Lỗi Vòng Lặp Vô Tận Jackson & Mass Assignment";
  l213.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nhận diện 3 hiểm họa chết người khi để lộ JPA Entity ra tầng Controller: Mass Assignment, Lỗi vòng lặp vô tận Jackson, và LazyInitializationException.
- Hiểu vì sao từ khóa \`record\` trong Java là vũ khí tối thượng để thiết kế DTO bất biến.
- Khắc phục triệt để lỗi \`StackOverflowError\` khi serialize quan hệ 2 chiều giữa \`Order\` và \`OrderItem\`.
- Đọc hiểu mã nguồn DTO phân tách an toàn qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: MỜI NGƯỜI LẠ VÀO PHÒNG NGỦ
- **JPA Entity (Cấu trúc bảng Database)** giống như **Phòng ngủ riêng tư của bạn**: Chứa két sắt, giấy khai sinh, sổ đỏ, mật khẩu thẻ ngân hàng.
- **DTO (Data Transfer Object)** giống như **Phòng khách tiếp tân**: Chỉ bày hoa quả, bánh kẹo và menu món ăn cho khách xem.
- Khi bạn trả thẳng JPA Entity ra Controller: Chẳng khác nào bạn **mời người lạ vào lục lọi két sắt trong phòng ngủ**! Khách hàng có thể vô tình hoặc cố ý sửa quyền Admin (\`isAdmin: true\`) hoặc xem được mật khẩu hash của người khác!
:::

---

## 1. Cái này là gì? (3 Hiểm Họa Khi Để Lộ Entity)

### 1. Hiểm họa 1: Lỗi Bảo Mật Mass Assignment
Nếu dùng Entity nhận dữ liệu từ request:
\`\`\`java
@PostMapping("/users")
public User registerUser(@RequestBody User user) {
    return userRepository.save(user); // ❌ HACKER GỬI: {"username":"hacker", "role":"SUPER_ADMIN"}
}
\`\`\`
Hacker chỉ cần thêm trường \`"role": "SUPER_ADMIN"\` vào payload JSON. Spring Jackson sẽ tự map vào biến \`user.role\`, cấp quyền Super Admin cho hacker trong tích tắc!

### 2. Hiểm họa 2: Vòng Lặp Vô Tận Jackson (Infinite Recursion)
Khi Entity \`Order\` chứa danh sách \`items\`, và mỗi \`OrderItem\` lại chứa tham chiếu ngược lại \`order\`:
Khi Jackson cố chuyển \`Order\` thành JSON:
\`Order\` -> serialize \`items\` -> \`OrderItem\` -> serialize \`order\` -> \`Order\` -> ... lặp vô tận!
=> Kết quả: **\`java.lang.StackOverflowError\`** làm sập ngay tức khắc tiến trình JVM!

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### Sơ Đồ Kiến Trúc: Bức Tường Ngăn Cách DTO & Entity

\`\`\`mermaid
flowchart TD
    Client["Client Request (JSON)"] -->|Chỉ cho phép các trường an toàn| DtoReq["OrderCreateRequest (Java Record)"]
    DtoReq -->|Validate & Map| Service["OrderService"]
    Service -->|Chuyển đổi| Entity["Order Entity (JPA - Nằm an toàn trong DB)"]
    Entity -->|Thực thi DB| DB[("PostgreSQL")]
    Entity -->|Chỉ trích xuất trường cần thiết| DtoRes["OrderResponse (Java Record)"]
    DtoRes -->|JSON sạch| Client

    style DtoReq fill:#064e3b,stroke:#10b981,color:#fff
    style DtoRes fill:#064e3b,stroke:#10b981,color:#fff
    style Entity fill:#78350f,stroke:#f59e0b,color:#fff
\`\`\`

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Sử dụng Java Record làm DTO bất biến, miễn nhiễm 100% với Mass Assignment và Jackson Loop:

\`\`\`java
package vn.mastery.ecommerce.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

// 1. DTO nhận Request: Tuyệt đối KHÔNG có trường role, id, hay status
public record OrderCreateRequest(
    @NotNull(message = "Customer ID không được null")
    Long customerId,

    @NotNull(message = "Số tiền không được null")
    @DecimalMin(value = "1000", message = "Số tiền tối thiểu là 1.000đ")
    BigDecimal totalAmount,

    List<OrderItemDto> items
) {}

public record OrderItemDto(
    Long productId,
    int quantity,
    BigDecimal unitPrice
) {}

// 2. DTO trả Response: Chỉ lộ các trường khách hàng cần xem
public record OrderResponse(
    Long orderId,
    Long customerId,
    BigDecimal totalAmount,
    String status,
    Instant createdAt
) {}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Khai báo | Ý nghĩa kỹ thuật | Tác dụng bảo mật |
|---|---|---|---|
| Dòng 10 | \`public record OrderCreateRequest(...)\` | Khai báo Java Record bất biến | Tự động sinh constructor, getter, \`equals()\`, \`hashCode()\`, không cho phép sửa đổi dữ liệu sau khi parse |
| Dòng 11 | \`@NotNull\` | Kiểm tra tính hợp lệ dữ liệu | Chặn đứng request rác ngay tại cửa ngõ Controller |
| Dòng 15 | \`BigDecimal totalAmount\` | Dùng BigDecimal thay vì double/float | Ngăn chặn sai số dấu phẩy động trong thanh toán tiền tệ |
| Dòng 25 | \`public record OrderResponse(...)\` | DTO phân tách hoàn toàn khỏi JPA | Cắt đứt hoàn toàn quan hệ hai chiều Hibernate, loại bỏ 100% nguy cơ Jackson Infinite Loop |

---

## 4. Key Takeaways & Cạm bẫy sống còn (Senior Architect Summary)

1. **Tuyệt đối cấm trả Entity ra Controller**: Luôn luôn ánh xạ (map) sang DTO trước khi trả về cho Client.
2. **Java Record là chuẩn mực DTO**: Từ Java 17+, hãy dùng \`record\` cho mọi Request/Response DTO vì tính bất biến (Immutability) và cú pháp gọn nhẹ hơn Lombok.
`;
}

// Refactor Lesson 2-1-4
const l214 = m2.lessons.find(l => l.id === "2-1-4");
if (l214) {
  l214.title = "Bài 2.1.4: Milestone Synthesis: Bản đồ DispatcherServlet & Ma trận Thiết Kế REST API";
  l214.content = `
:::target 🎯 MỤC TIÊU BÀI TỔNG HỢP MILESTONE (10 PHÚT)
- Tổng kết toàn diện chuỗi xử lý Request của Spring MVC từ Servlet Container đến Controller.
- Làm chủ Ma trận Thiết Kế REST API chuẩn quốc tế: HTTP Methods, Idempotency, Status Codes.
- Đọc hiểu toàn bộ mã nguồn tổng hợp một RESTful API hoàn chỉnh đạt chuẩn Clean Architecture.
- Nắm vững 4 quy tắc vàng để API đạt chứng chỉ sẵn sàng sản xuất (Production-Ready).
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BẢN ĐỒ GIAO THÔNG ĐÔ THỊ
Hệ thống REST API của bạn giống như **Hệ thống giao thông thành phố thông minh**:
- \`GET\`: Giống như camera giao thông (Chỉ nhìn, không làm hỏng đường). An toàn và có tính Idempotent (gọi 1 lần hay 100 lần kết quả vẫn vậy).
- \`POST\`: Giống như đội thợ xây làm một cây cầu mới (Tạo tài nguyên mới, không idempotent).
- \`PUT\`: Đập cây cầu cũ đi xây lại đúng vị trí đó (Thay thế toàn bộ).
- \`PATCH\`: Sơn lại lan can cây cầu (Sửa đổi một phần).
- \`DELETE\`: Phá bỏ cây cầu.
Mỗi biển báo (Status Code) chỉ dẫn rõ ràng cho tài xế (Client) biết đường thông thoáng (\`200\`), đường mới làm (\`201\`), đi nhầm đường (\`404\`) hay bị sạt lở núi (\`500\`)!
:::

---

## 1. Cái này là gì? (Bản đồ Dòng chảy Quyết định Thiết Kế REST API)

### Sơ Đồ Kiến Trúc: Chuỗi Phân Giải HTTP Request Trong DispatcherServlet

\`\`\`mermaid
flowchart TD
    Req["Client Request: POST /api/v1/orders"] --> Filter["1. SecurityFilterChain: JWT & CORS Check"]
    Filter --> DS["2. DispatcherServlet.doDispatch()"]
    DS --> HandlerMap["3. RequestMappingHandlerMapping (Tìm HandlerMethod)"]
    HandlerMap --> HandlerAdapt["4. RequestMappingHandlerAdapter"]
    HandlerAdapt --> ArgResolver["5. ArgumentResolvers: Jackson parse JSON -> DTO"]
    ArgResolver --> Invoke["6. Thực thi OrderController.createOrder()"]
    Invoke --> ReturnHandler["7. ReturnValueHandler: Đóng gói ResponseEntity"]
    ReturnHandler --> Converter["8. Jackson HttpMessageConverter: Serialize JSON"]
    Converter --> Res["9. HTTP 201 Created (JSON Body + Location Header)"]

    style DS fill:#1e3a8a,stroke:#3b82f6,color:#fff
    style Invoke fill:#064e3b,stroke:#10b981,color:#fff
    style Res fill:#78350f,stroke:#f59e0b,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Ma trận Thiết Kế RESTful Chuẩn Quốc Tế)

### Bảng Ma Trận: HTTP Method, Ngữ Nghĩa & Tính Đẳng Lực (Idempotency)

| HTTP Method | Ý nghĩa nghiệp vụ | Idempotent? | Safe? | Status Code thành công chuẩn |
|---|---|---|---|---|
| **GET** | Lấy dữ liệu tài nguyên | ⭐ **CÓ** (Gọi N lần kết quả như nhau) | ⭐ **CÓ** (Không đổi state) | \`200 OK\` |
| **POST** | Tạo mới tài nguyên | ❌ **KHÔNG** (Gọi N lần tạo N bản ghi) | ❌ Không | \`201 Created\` + Header \`Location\` |
| **PUT** | Cập nhật toàn bộ tài nguyên | ⭐ **CÓ** (Ghi đè N lần cùng dữ liệu) | ❌ Không | \`200 OK\` hoặc \`204 No Content\` |
| **PATCH** | Cập nhật một phần thuộc tính | ❌ Tùy trường hợp | ❌ Không | \`200 OK\` |
| **DELETE** | Xóa tài nguyên | ⭐ **CÓ** (Xóa N lần tài nguyên vẫn mất) | ❌ Không | \`204 No Content\` hoặc \`200 OK\` |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Mã nguồn tổng hợp dưới đây là một REST Controller hoàn chỉnh đạt chuẩn Clean Architecture cho E-Commerce:

\`\`\`java
package vn.mastery.ecommerce.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.mastery.ecommerce.dto.OrderCreateRequest;
import vn.mastery.ecommerce.dto.OrderResponse;
import vn.mastery.ecommerce.service.OrderService;
import java.net.URI;

@RestController
@RequestMapping("/api/v1/orders")
public class ProductionOrderController {

    private final OrderService orderService;

    public ProductionOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(@RequestBody OrderCreateRequest request) {
        OrderResponse created = orderService.createOrder(request);
        URI location = URI.create("/api/v1/orders/" + created.orderId());
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable Long orderId) {
        OrderResponse order = orderService.getOrderById(orderId);
        return ResponseEntity.ok(order);
    }

    @DeleteMapping("/{orderId}")
    public ResponseEntity<Void> cancelOrder(@PathVariable Long orderId) {
        orderService.cancelOrder(orderId);
        return ResponseEntity.noContent().build(); // HTTP 204 No Content
    }
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động DispatcherServlet |
|---|---|---|---|
| Dòng 10-11 | \`@RestController @RequestMapping(...)\` | Đăng ký Controller RESTful với tiền tố phiên bản API | DispatcherServlet ánh xạ mọi request \`/api/v1/orders\` vào class này |
| Dòng 20 | \`@PostMapping\` | Xử lý tạo mới đơn hàng | Gọi Service tạo đơn, sinh URL \`Location\` và trả về mã \`201 Created\` |
| Dòng 27 | \`@GetMapping("/{orderId}")\` | Tra cứu đơn hàng theo ID | Nhận ID từ path, gọi Service tìm kiếm và trả về \`200 OK\` |
| Dòng 33 | \`@DeleteMapping("/{orderId}")\` | Hủy đơn hàng | Gọi Service hủy đơn và trả về \`ResponseEntity.noContent().build()\` (HTTP 204) |

---

## 4. Key Takeaways & Nguyên Tắc Sống Còn (Senior Architect Summary)

1. **Chuẩn RESTful danh từ số nhiều**: Luôn đặt tên URI là danh từ số nhiều (\`/api/v1/orders\`, \`/api/v1/products\`), tuyệt đối không đặt động từ trong URL (\`/api/v1/createOrder\`).
2. **Luôn sử dụng ResponseEntity**: Giúp kiểm soát hoàn toàn HTTP Status Code, Response Headers và Body trả về cho Client.
3. **Phân tách DTO triệt để**: Không bao giờ để JPA Entity vượt qua ranh giới tầng Service để ra tới Controller.
`;
}

// Serialize back to file
const outContent = `/* MODULE 2 — REST API chuyên nghiệp (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n` + JSON.stringify(m2, null, 2) + `\n);\n`;

fs.writeFileSync(modulePath, outContent, "utf8");
console.log("Successfully refactored Module 2 Topic 1 (Lessons 2-1-1, 2-1-2, 2-1-3, 2-1-4)!");
