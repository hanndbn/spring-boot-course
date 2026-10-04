const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'course', 'js', 'content', 'module2.js');
const content = fs.readFileSync(filePath, 'utf8');
const mod = new Function(`let window = { COURSE_MODULES: [] }; ${content}; return window.COURSE_MODULES[0];`)();

// Lesson 2-1-1
const l211 = mod.lessons.find(x => x.id === '2-1-1');
if (l211) {
  l211.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nắm chắc vòng đời xử lý của một HTTP Request từ khi chạm vào Tomcat nhúng đến khi đi qua DispatcherServlet và trả về JSON.
- Hiểu rõ cơ chế phối hợp giữa HandlerMapping, HandlerAdapter, Interceptors và HttpMessageConverter.
- Nắm vững cấu trúc phân tầng Controller -> Service -> Repository theo chuẩn Clean REST Architecture.
- Đọc hiểu 100% từng dòng code cấu hình và xử lý của Spring MVC Controller.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: REST API & NHÀ HÀNG GỌI MÓN
Hãy tưởng tượng việc Client (App điện thoại/Web) giao tiếp với Server Spring Boot giống như bạn đi ăn tại một nhà hàng cao cấp:
- **URL (Tài nguyên / Danh từ)**: Giống như tên món ăn trên thực đơn, ví dụ \`/api/v1/orders\` (Danh sách đơn hàng), \`/api/v1/orders/102\` (Đơn hàng cụ thể số 102). Tuyệt đối không dùng động từ như \`/createOrder\` hay \`/deleteOrder\`!
- **HTTP Method (Hành động / Động từ)**: Là hành động bạn yêu cầu nhà hàng phục vụ:
  - \`GET\`: "Cho tôi xem thực đơn / xem đơn hàng" (Chỉ đọc, không làm thay đổi gì).
  - \`POST\`: "Làm cho tôi một món ăn mới / tạo đơn hàng mới".
  - \`PUT\`: "Đổi toàn bộ món ăn thành món khác / cập nhật toàn bộ đơn".
  - \`PATCH\`: "Thêm chút ớt vào món ăn / cập nhật một phần (chỉ đổi trạng thái thanh toán)".
  - \`DELETE\`: "Hủy món ăn / xóa đơn hàng".
- **DispatcherServlet (Lễ tân nhà hàng)**: Người đứng ở cửa chính đón bạn, kiểm tra xem bạn muốn gọi món gì (HandlerMapping), sau đó chỉ định anh bồi bàn nào (HandlerAdapter / Controller) phục vụ bạn.
:::

---

## 1. Cái này là gì? (Vòng Đời HTTP Request & DispatcherServlet)

### Sơ Đồ Tuần Tự: Vòng Đời HTTP Request Qua Spring MVC Pipeline

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as 📱 Mobile / Web Client
    participant Filter as 🛡️ Filter Chain
    participant DS as 🚀 DispatcherServlet
    participant HM as 🗺️ HandlerMapping
    participant HA as ⚙️ HandlerAdapter
    participant Ctrl as 🎮 OrderController
    participant Conv as 🔄 HttpMessageConverter

    Client->>Filter: 1. Gửi HTTP Request (JSON Body)
    Filter->>DS: 2. Request hợp lệ, chuyển vào Front Controller
    DS->>HM: 3. Tìm Handler phù hợp với URL & Method?
    HM-->>DS: 4. Trả về OrderController#createOrder()
    DS->>HA: 5. Kích hoạt Adapter gọi Controller
    HA->>Conv: 6. Jackson deserialize JSON -> OrderRequestDTO
    Conv-->>HA: 7. DTO đã parse & validate
    HA->>Ctrl: 8. Thực thi nghiệp vụ createOrder(dto)
    Ctrl-->>HA: 9. Trả về OrderResponseDTO
    HA->>Conv: 10. Jackson serialize DTO -> JSON Byte Stream
    Conv-->>DS: 11. Đóng gói ResponseEntity
    DS-->>Filter: 12. HTTP 201 Created (Header + Body)
    Filter-->>Client: 13. Client nhận dữ liệu
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Clean Architecture Phân Tầng)

### Ma Trận Phân Tách Trách Nhiệm Trong Clean Architecture:

| Thành phần | Trách nhiệm chính | Điều NÊN làm | Điều TUYỆT ĐỐI TRÁNH |
|---|---|---|---|
| **Controller** | Giao tiếp Web | Nhận request, validate định dạng DTO, trả về HTTP status code phù hợp | Viết logic nghiệp vụ, tính toán tiền bạc, gọi trực tiếp Repository |
| **Service** | Trái tim nghiệp vụ | Thực hiện tính toán chiết khấu, kiểm tra tồn kho, điều phối transaction | Nhập thư viện Servlet (\`HttpServletRequest\`, \`HttpSession\`) |
| **Repository** | Tương tác dữ liệu | Định nghĩa câu truy vấn SQL/JPQL, thao tác đọc/ghi Database | Chứa logic nghiệp vụ tính toán |
| **DTO (Record)** | Vận chuyển dữ liệu | Khóa ranh giới bảo mật API, không lộ cấu trúc bảng CSDL | Dùng chung Entity làm Request/Response |

---

## 3. Dùng như thế nào & Phân tích từng dòng code

Dưới đây là một REST Controller hoàn chỉnh chuẩn hóa cho nghiệp vụ đặt hàng E-Commerce:

\`\`\`java
package vn.mastery.ecommerce.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.mastery.ecommerce.dto.OrderRequestDTO;
import vn.mastery.ecommerce.dto.OrderResponseDTO;
import vn.mastery.ecommerce.service.OrderService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponseDTO> createOrder(@Valid @RequestBody OrderRequestDTO request) {
        OrderResponseDTO created = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
\`\`\`

### Bảng Phân Tích Chi Tiết Từng Dòng Code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Spring |
|---|---|---|---|
| \`@RestController\` | Meta-Annotation | Hợp nhất \`@Controller\` và \`@ResponseBody\` | Đăng ký bean vào IoC Container; mọi phương thức tự động serialize kết quả thành JSON |
| \`@RequestMapping("/api/v1/orders")\` | URL Mapping | Khai báo tiền tố URI danh từ số nhiều kèm phiên bản API | DispatcherServlet định tuyến mọi request bắt đầu bằng \`/api/v1/orders\` tới class này |
| \`private final OrderService\` | Constructor Injection | Tiêm phụ thuộc tầng nghiệp vụ theo nguyên tắc Immutability | Đảm bảo tính nhất quán của Bean, dễ dàng mock khi viết Unit Test |
| \`@PostMapping\` | HTTP Method Mapping | Lắng nghe phương thức HTTP POST tạo mới tài nguyên | DispatcherServlet định tuyến request tạo mới đơn hàng vào hàm này |
| \`@Valid\` | Bean Validation | Kích hoạt bộ kiểm tra hợp lệ dữ liệu của Hibernate Validator | Đọc các annotation kiểm tra trong DTO (\`@NotNull\`, \`@Positive\`); ném lỗi nếu vi phạm |
| \`@RequestBody\` | Body Binding | Jackson đọc JSON từ HTTP Body chuyển thành đối tượng Java | \`HttpMessageConverter\` phân giải chuỗi JSON sang instance \`OrderRequestDTO\` |
| \`ResponseEntity.status(HttpStatus.CREATED)\` | HTTP Status Wrapper | Trả về mã phản hồi chuẩn hóa HTTP 201 Created | Báo cho Client biết tài nguyên đã được tạo thành công trên hệ thống |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Cạm bẫy dùng Entity trực tiếp trong Controller**:
   - **Hậu quả**: Rò rỉ cấu trúc database, rò rỉ trường nhạy cảm (\`password_hash\`, \`internal_notes\`), và gây lỗi lặp vô tận (\`StackOverflowError\`) khi serialize quan hệ hai chiều JPA.
   - **Best Practice**: 100% endpoint chỉ giao tiếp qua Java 21 Record DTO.
2. **Cạm bẫy trả về HTTP 200 cho mọi tình huống**:
   - **Hậu quả**: Tạo mới trả về 200 thay vì 201, lỗi server trả về 200 kèm \`{ success: false }\` làm hỏng cơ chế retry tự động của API Gateway.
   - **Best Practice**: Luôn tuân thủ mã trạng thái HTTP chuẩn: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 404 Not Found, 500 Internal Error.
`;
}

// Lesson 2-2-1
const l221 = mod.lessons.find(x => x.id === '2-2-1');
if (l221) {
  l221.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nắm chắc cơ chế hoạt động của Bean Validation (Jakarta Validation API) và Hibernate Validator trong Spring Boot.
- Nắm vững Tiêu chuẩn Quốc tế RFC 7807 (Problem Details for HTTP APIs) để trả về thông điệp lỗi nhất quán.
- Làm chủ cách cấu hình Global Exception Handler với \`@RestControllerAdvice\` và \`ProblemDetail\`.
- Đọc hiểu 100% từng dòng code xử lý ngoại lệ và bắt lỗi Validation qua Bảng phân tích chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỔNG ĐÀI TIẾP NHẬN SỰ CỐ 24/7
- **Khi không có RFC 7807 (Khách hàng bối rối)**: Mỗi lập trình viên trong công ty trả về lỗi một kiểu: Người thì trả về \`{ "err": "Sai gia" }\`, người thì trả về chuỗi text thuần \`"Lỗi rồi"\`, người thì trả về trang HTML 500 màu trắng xóa kèm stacktrace dài ngoằng! App mobile không biết đường nào mà parse!
- **Khi có RFC 7807 & @RestControllerAdvice (Quy chuẩn quốc tế)**: Giống như một tổng đài viên chuyên nghiệp: Bất kể lỗi xảy ra ở đâu, hệ thống luôn trả về một mẫu phiếu biên nhận sự cố chuẩn quốc tế gồm 5 trường: Mã lỗi (\`type\`), Tiêu đề (\`title\`), HTTP Status (\`status\`), Lý do chi tiết (\`detail\`), và Đường dẫn gặp sự cố (\`instance\`).
:::

---

## 1. Cái này là gì? (Kiến trúc Validation & RFC 7807 ProblemDetails)

### Sơ Đồ Tuần Tự: Luồng Kiểm Thử DTO & Xử Lý Lỗi Tập Trung

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as 📱 Frontend / Mobile
    participant DS as 🚀 DispatcherServlet
    participant Val as 🛡️ Hibernate Validator
    participant Adv as 🏛️ @RestControllerAdvice
    
    Client->>DS: POST /api/v1/orders { quantity: -5, amount: 0 }
    DS->>Val: Kích hoạt @Valid kiểm tra DTO
    Note over Val: Phát hiện vi phạm: quantity <= 0, amount <= 0!
    Val-->>DS: Ném MethodArgumentNotValidException
    DS->>Adv: Đánh chặn ngoại lệ tại GlobalExceptionHandler
    Adv->>Adv: Đóng gói thành ProblemDetail (RFC 7807)
    Adv-->>Client: HTTP 400 Bad Request + RFC 7807 JSON Body
\`\`\`

---

## 2. Dùng khi nào & Tại sao?

### Ma Trận So Sánh Các Định Dạng Báo Lỗi:

| Tiêu chuẩn | Định dạng tự chế (Custom Ad-hoc) | Tiêu chuẩn Quốc tế RFC 7807 (\`ProblemDetail\`) |
|---|---|---|
| **Tính nhất quán** | Rời rạc, mỗi microservice trả một kiểu cấu trúc | **100% đồng nhất** trên toàn bộ hệ thống phân tán |
| **Tương thích Client** | Frontend phải viết code parse riêng cho từng API | Thư viện HTTP Client (Axios, Retrofit) hỗ trợ parse tự động |
| **Hỗ trợ từ Framework** | Lập trình viên phải tự tạo class \`ErrorResponse\` | **Tích hợp sẵn gốc từ Spring Boot 3.0+ / Spring 6.0+** |
| **Bảo mật hệ thống** | Dễ vô tình làm lộ Hibernate SQL Stacktrace | Che giấu chi tiết nhạy cảm, chỉ trả thông điệp an toàn |

---

## 3. Dùng như thế nào & Phân tích từng dòng code

Dưới đây là Record DTO có Validation và Bộ xử lý ngoại lệ toàn cục chuẩn RFC 7807:

\`\`\`java
package vn.mastery.ecommerce.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record CreateOrderRequest(
    @NotBlank(message = "Mã khách hàng không được để trống")
    String customerId,

    @NotNull(message = "Số tiền đơn hàng không được null")
    @DecimalMin(value = "1000.00", message = "Đơn hàng tối thiểu là 1,000 VND")
    BigDecimal totalAmount,

    @Min(value = 1, message = "Số lượng sản phẩm tối thiểu là 1")
    @Max(value = 100, message = "Số lượng sản phẩm tối đa trong 1 đơn là 100")
    int quantity
) {}
\`\`\`

\`\`\`java
package vn.mastery.ecommerce.exception;

import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST, "Dữ liệu yêu cầu không hợp lệ"
        );
        problem.setTitle("Validation Failed");
        problem.setType(URI.create("https://api.mastery.vn/errors/validation-failed"));
        problem.setProperty("timestamp", Instant.now());

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err -> 
            errors.put(err.getField(), err.getDefaultMessage())
        );
        problem.setProperty("invalidFields", errors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problem);
    }
}
\`\`\`

### Bảng Phân Tích Chi Tiết Từng Dòng Code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Spring |
|---|---|---|---|
| \`@NotBlank\` | Validation Constraint | Kiểm tra chuỗi khác null và độ dài sau trim > 0 | Ngăn chặn việc gửi chuỗi rỗng hoặc chỉ có khoảng trắng |
| \`@DecimalMin("1000.00")\` | Validation Constraint | Kiểm tra giá trị \`BigDecimal\` phải lớn hơn hoặc bằng ngưỡng | Đảm bảo tính toàn vẹn của số tiền thanh toán trong E-Commerce |
| \`@RestControllerAdvice\` | Global Advice Component | Kết hợp của \`@ControllerAdvice\` và \`@ResponseBody\` | Đánh chặn mọi ngoại lệ văng ra từ tất cả các Controller trong hệ thống |
| \`@ExceptionHandler(...)\` | Exception Router | Khai báo phương thức xử lý loại Exception cụ thể | Khi Controller ném \`MethodArgumentNotValidException\`, Spring tự động gọi hàm này |
| \`ProblemDetail.forStatusAndDetail\` | RFC 7807 Factory | Khởi tạo đối tượng lỗi tiêu chuẩn RFC 7807 của Spring Boot 3 | Tạo payload gồm \`status: 400\`, \`detail: "Dữ liệu yêu cầu không hợp lệ"\` |
| \`problem.setProperty("invalidFields")\` | Dynamic Extension | Bổ sung các trường tùy chỉnh vào JSON phản hồi RFC 7807 | Client nhận danh sách chi tiết các trường bị lỗi để highlight màu đỏ trên giao diện |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Cạm bẫy quên annotation \`@Valid\` tại Controller**:
   - **Hậu quả**: Bạn viết đầy đủ annotation \`@NotNull\`, \`@Min\` trong Record DTO nhưng khi gọi API thì Spring hoàn toàn không kiểm tra, dữ liệu rác vẫn đi thẳng vào Database!
   - **Khắc phục**: Luôn đặt \`@Valid\` trước tham số \`@RequestBody\` trong phương thức Controller.
2. **Cạm bẫy trả về 500 Internal Server Error khi Client gửi thiếu trường**:
   - **Hậu quả**: Làm sai lệch chỉ số đo lường độ ổn định (SLA/SLI) của hệ thống backend.
   - **Khắc phục**: Mọi lỗi do phía Client gửi sai định dạng bắt buộc phải map sang mã **400 Bad Request** hoặc **422 Unprocessable Entity**.
`;
}

// Ensure 2-3-2 and 2-4-2 have line tables
const l232 = mod.lessons.find(x => x.id === '2-3-2');
if (l232 && !l232.content.includes('Dòng code | Cú pháp')) {
  const lineTable232 = `
### Bảng Phân Tích Cú Pháp Annotation OpenAPI 3.0 & MapStruct:

| Dòng code / Thành phần | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động |
|---|---|---|---|
| \`@Mapper(componentModel = "spring")\` | MapStruct Annotation | Khai báo interface này là một Mapper và đăng ký làm Spring Bean | Trình biên dịch \`javac\` tự sinh class implementation và đánh dấu \`@Component\` |
| \`@Mapping(target = "orderId", source = "id")\` | Field Mapping | Định tuyến thuộc tính nguồn \`id\` sang thuộc tính đích \`orderId\` | Tự động sinh code gán: \`dto.setOrderId(entity.getId())\` |
| \`@Tag(name = "Order Controller")\` | OpenAPI Metadata | Phân nhóm tài liệu API theo cụm nghiệp vụ trên Swagger UI | Gom nhóm toàn bộ endpoint đặt hàng vào cùng 1 danh mục trực quan |
| \`@Operation(summary = "...")\` | OpenAPI Endpoint Doc | Mô tả tóm tắt chức năng và kết quả trả về của API | Swagger UI hiển thị thông tin này kèm hướng dẫn tham số chi tiết |
`;
  l232.content = l232.content.replace('## 4. Cạm bẫy thực tế & Best Practices', lineTable232 + '\n\n## 4. Cạm bẫy thực tế & Best Practices');
}

const l242 = mod.lessons.find(x => x.id === '2-4-2');
if (l242 && !l242.content.includes('Dòng code | Cú pháp')) {
  const lineTable242 = `
### Bảng Phân Tích Kỹ Thuật Keyset Pagination & Presigned URL:

| Thành phần / Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động |
|---|---|---|---|
| \`WHERE id > :lastId ORDER BY id ASC\` | Keyset Seek Clause | Dùng B-Tree Index để nhảy thẳng đến vị trí bản ghi kế tiếp | Loại bỏ hoàn toàn chi phí quét dữ liệu cũ, thời gian thực thi ổn định < 5ms |
| \`s3Client.generatePresignedUrl(...)\` | AWS SDK Presigned | Tạo đường link tạm thời kèm chữ ký số HMAC-SHA256 | Cho phép Client upload trực tiếp lên S3 bucket trong thời hạn 15 phút |
| \`StreamingResponseBody\` | Spring Async Streaming | Kênh truyền dữ liệu dạng luồng nhị phân trực tiếp | Ghi từng chunk dữ liệu ra HTTP Response OutputStream mà không tích lũy trong RAM |
`;
  l242.content = l242.content.replace('## 4. Cạm bẫy thực tế & Best Practices', lineTable242 + '\n\n## 4. Cạm bẫy thực tế & Best Practices');
}

const out = `window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n` + JSON.stringify(mod, null, 2) + `\n);\n`;
fs.writeFileSync(filePath, out, 'utf8');
console.log('Module 2 successfully refactored and enriched with full 4 pillars!');
