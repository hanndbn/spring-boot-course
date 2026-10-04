const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module2.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m2 = window.COURSE_MODULES[0];

// Refactor Lesson 2-2-1
const l221 = m2.lessons.find(l => l.id === "2-2-1");
if (l221) {
  l221.title = "Bài 2.2.1: Kiến trúc Bean Validation (Jakarta Validation) & Thiết Kế Custom Validator";
  l221.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu sâu cơ chế thẩm định dữ liệu đầu vào của Jakarta Bean Validation (\`@NotNull\`, \`@NotBlank\`, \`@Size\`, \`@Pattern\`).
- Tự thiết kế một Custom Constraint Validator: \`@ValidPhoneNumber\` kiểm tra định dạng số điện thoại Việt Nam (+84 / 09x).
- Hiểu vì sao phải đặt \`@Valid\` trên \`@RequestBody\` thì Bean Validation mới có hiệu lực.
- Đọc hiểu từng dòng code của Custom Validator qua Bảng phân tích chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CỔNG SOÁT VÉ TỰ ĐỘNG Ở GA TÀU
- **Nếu KHÔNG CÓ Bean Validation**: Bạn phải viết 50 dòng \`if-else\` trong Service: *"Nếu tên null thì báo lỗi, nếu tuổi < 18 báo lỗi, nếu email thiếu @ báo lỗi..."*. Code nghiệp vụ biến thành bãi rác điều kiện!
- **KHI CÓ Bean Validation**: Giống như **Cửa quét vé tự động bằng laser**:
  - Khách quét mã vé (\`@NotBlank\`, \`@Pattern\`).
  - Hợp lệ: Cửa tự động mở cho khách vào trong (\`joinPoint.proceed()\`).
  - Sai định dạng: Cửa laser lập tức hú còi báo động (\`MethodArgumentNotValidException\`) và đuổi khách ra ngoài ngay tại cổng Controller!
:::

---

## 1. Cái này là gì? (Kiến trúc Jakarta Validation)

Bean Validation sử dụng metadata dạng annotation để tách rời logic kiểm tra hợp lệ ra khỏi code xử lý nghiệp vụ, được kích hoạt tự động bởi Spring MVC HandlerMethodArgumentResolver trước khi method của Controller thực sự chạy.

### Sơ Đồ Luồng: Quá Trình Đánh Giá Validation Tại Cửa Ngõ Controller

\`\`\`mermaid
flowchart TD
    Req["HTTP POST /api/v1/orders (JSON)"] --> Resolver["HandlerMethodArgumentResolver"]
    Resolver --> CheckValid{"Tham số có gắn @Valid?"}
    CheckValid -- NO --> Skip["Bỏ qua validation (NGUY HIỂM!)"]
    CheckValid -- YES --> Validator["Jakarta Validator Engine"]
    Validator --> Eval{"Dữ liệu thỏa mãn mọi @Constraint?"}
    Eval -- YES --> Ctrl["Controller Method thực thi"]
    Eval -- NO --> Ex["Ném MethodArgumentNotValidException (BindingResult)"]
    Ex --> Advice["@RestControllerAdvice trả về RFC 7807 (400 Bad Request)"]

    style CheckValid fill:#1e3a8a,stroke:#3b82f6,color:#fff
    style Ex fill:#7c2d12,stroke:#f97316,color:#fff
    style Ctrl fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### Ma trận Các Annotation Validation Thường Dùng Nhất

| Annotation | Áp dụng cho kiểu dữ liệu | Ý nghĩa kiểm tra | Ví dụ thực tế trong E-Commerce |
|---|---|---|---|
| \`@NotBlank\` | \`CharSequence / String\` | Không null, độ dài > 0 sau khi trim | Tên người nhận, địa chỉ giao hàng |
| \`@NotNull\` | Mọi kiểu dữ liệu Object | Không được là \`null\` | ID khách hàng, ID sản phẩm |
| \`@Positive\` | Kiểu số (\`int, long, BigDecimal\`) | Phải là số dương (> 0) | Số lượng mua, giá trị đơn hàng |
| \`@Email\` | \`String\` | Đúng định dạng email quốc tế | Email nhận hóa đơn điện tử |
| \`@Pattern\` | \`String\` | So khớp biểu thức chính quy (Regex) | Mã giảm giá voucher (\`^[A-Z0-9]{6,10}$\`) |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là mã nguồn Custom Annotation \`@ValidPhoneNumber\` kiểm tra đầu số viễn thông Việt Nam:

\`\`\`java
package vn.mastery.ecommerce.validation;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PhoneNumberValidator.class)
@Documented
public @interface ValidPhoneNumber {
    String message() default "Số điện thoại không hợp lệ (yêu cầu đầu số Việt Nam 10 chữ số: 03x, 05x, 07x, 08x, 09x)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

class PhoneNumberValidator implements ConstraintValidator<ValidPhoneNumber, String> {
    private static final String VN_PHONE_REGEX = "^(0|\\+84)(3|5|7|8|9)[0-9]{8}$";

    @Override
    public boolean isValid(String phone, ConstraintValidatorContext context) {
        if (phone == null || phone.isBlank()) {
            return false;
        }
        return phone.matches(VN_PHONE_REGEX);
    }
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Validation |
|---|---|---|---|
| Dòng 10 | \`@Constraint(validatedBy = PhoneNumberValidator.class)\` | Liên kết annotation với class xử lý logic | Báo cho Jakarta Engine dùng \`PhoneNumberValidator\` để thẩm định |
| Dòng 13 | \`String message() default "..."\` | Thông điệp lỗi mặc định | Trả về thông báo này khi số điện thoại không thỏa mãn regex |
| Dòng 18 | \`implements ConstraintValidator<ValidPhoneNumber, String>\` | Kế thừa interface của Jakarta | Nhận annotation cấu hình và kiểu dữ liệu của field cần kiểm tra |
| Dòng 25 | \`return phone.matches(VN_PHONE_REGEX);\` | So khớp biểu thức chính quy | Kiểm tra đầu số hợp lệ (+84 hoặc 0) kết hợp 9 chữ số tiếp theo |

---

## 4. Cạm bẫy thực tế & Best Practices (Senior Trap Guide)

:::danger QUÊN GẮN @Valid TRÊN @RequestBody TẠI CONTROLLER
- **Hiện tượng**: Bạn đã viết hàng chục annotation \`@NotBlank\`, \`@Min\` trên DTO, nhưng khi gửi request rỗng lên, hệ thống vẫn chấp nhận và chạy vào Service!
- **Nguyên nhân**: Trong Controller, bạn chỉ viết:
  \`public ResponseEntity<?> createOrder(@RequestBody OrderRequest req)\`
  mà **QUÊN GẮN** từ khóa \`@Valid\`!
- **Khắc phục**: Luôn luôn viết:
  \`public ResponseEntity<?> createOrder(@Valid @RequestBody OrderRequest req)\`.
:::
`;
}

// Refactor Lesson 2-2-2
const l222 = m2.lessons.find(l => l.id === "2-2-2");
if (l222) {
  l222.title = "Bài 2.2.2: Chuẩn Quốc Tế RFC 7807 ProblemDetails & Global Exception Handler";
  l222.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu sâu chuẩn quốc tế IETF RFC 7807 (Problem Details for HTTP APIs) được tích hợp chính thức trong Spring Boot 3 / Spring Framework 6.
- Nắm chắc cấu trúc 5 trường chuẩn: \`type\`, \`title\`, \`status\`, \`detail\`, \`instance\` và mở rộng thuộc tính tùy biến (\`properties\`).
- Xây dựng một \`@RestControllerAdvice\` kế thừa \`ResponseEntityExceptionHandler\` xử lý tập trung mọi ngoại lệ của hệ thống.
- Đọc hiểu toàn bộ mã nguồn xử lý lỗi qua Bảng phân tích chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: MẪU PHIẾU KHÁM BỆNH TIÊU CHUẨN QUỐC TẾ (RFC 7807)
- **Cách báo lỗi tự chế lộn xộn (Kiểu cũ)**: Mỗi dev tự chế một kiểu JSON: lúc thì \`{"code": 400, "msg": "Lỗi"}\`, lúc thì \`{"error_message": "Hỏng rồi"}\`, lúc thì \`{"success": false}\`. Phía Frontend và Mobile App phát điên vì không biết đường nào mà lần!
- **Chuẩn RFC 7807 (ProblemDetails)**: Giống như **Phiếu kết quả xét nghiệm chuẩn WHO**:
  - \`status\`: Mã số y khoa (HTTP 400).
  - \`title\`: Tên bệnh tóm tắt ("Yêu cầu thanh toán không hợp lệ").
  - \`detail\`: Mô tả triệu chứng cụ thể ("Số dư trong ví của bạn là 50.000đ, không đủ trả đơn hàng 200.000đ").
  - \`instance\`: Mã số bệnh án gắn với request này (\`/api/v1/orders/123\`).
  - \`timestamp\` & \`traceId\`: Dấu vết thời gian và mã định danh để tra cứu hồ sơ.
:::

---

## 1. Cái này là gì? (Kiến trúc RFC 7807 ProblemDetails Trong Spring Boot 3)

Kể từ Spring Boot 3+, lớp \`org.springframework.http.ProblemDetail\` được giới thiệu làm chuẩn mực trả lời lỗi REST API cấp toàn cầu.

### Sơ Đồ Kiến Trúc: Bộ Lọc Ngoại Lệ Tập Trung @RestControllerAdvice

\`\`\`mermaid
flowchart TD
    Req["Request: POST /api/v1/orders"] --> Ctrl["OrderController"]
    Ctrl --> Svc["OrderService"]
    Svc -->|"Ném OutOfStockException('Hết hàng trong kho')!"| ExRoute["Spring MVC Exception Resolver"]
    
    subgraph Handler ["GlobalExceptionHandler (@RestControllerAdvice)"]
        MatchMethod{"Bắt đúng @ExceptionHandler(OutOfStockException)?"}
        BuildRFC["Khởi tạo ProblemDetail.forStatusAndDetail(409, msg)"]
        AddProps["Bổ sung traceId, timestamp, errorCode"]
    end

    ExRoute --> MatchMethod
    MatchMethod --> BuildRFC
    BuildRFC --> AddProps
    AddProps --> Res["HTTP 409 Conflict<br/>Content-Type: application/problem+json"]
    Res --> Client["Client Mobile App hiển thị thông báo thân thiện"]

    style ExRoute fill:#7c2d12,stroke:#f97316,color:#fff
    style BuildRFC fill:#064e3b,stroke:#10b981,color:#fff
    style Res fill:#1e3a8a,stroke:#3b82f6,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### So sánh: Báo Lỗi Tự Chế vs Chuẩn Quốc Tế RFC 7807

| Thuộc tính | Định dạng tự chế (Legacy) | Chuẩn quốc tế RFC 7807 (Spring Boot 3) |
|---|---|---|
| **Content-Type** | \`application/json\` thông thường | ⭐ \`application/problem+json\` |
| **Tính tương thích** | Phải viết code parser riêng cho từng project | ⭐ Mọi SDK, API Gateway và thư viện HTTP toàn cầu đều tự động hiểu |
| **Mở rộng linh hoạt** | Sửa class DTO lỗi mỗi khi cần thêm trường | ⭐ Dùng \`problemDetail.setProperty("traceId", ...)\` cực kỳ nhẹ nhàng |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là mã nguồn \`GlobalExceptionHandler\` chuẩn mực cấp doanh nghiệp:

\`\`\`java
package vn.mastery.ecommerce.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Bắt lỗi sai định dạng DTO (@Valid thất bại)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationErrors(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST, 
            "Dữ liệu gửi lên không thỏa mãn các ràng buộc hợp lệ"
        );
        problem.setTitle("Lỗi Thẩm Định Dữ Liệu (Validation Error)");
        problem.setType(URI.create("https://ecommerce.mastery.vn/errors/validation-failed"));

        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fe.getField(), fe.getDefaultMessage());
        }

        problem.setProperty("invalidFields", fieldErrors);
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("traceId", UUID.randomUUID().toString());
        return problem;
    }

    // 2. Bắt lỗi tài nguyên không tồn tại (404)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Không Tìm Thấy Tài Nguyên");
        problem.setType(URI.create("https://ecommerce.mastery.vn/errors/not-found"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Spring |
|---|---|---|---|
| Dòng 15 | \`@RestControllerAdvice\` | Bắt lỗi tập trung trên toàn bộ các Controller | Kích hoạt chuỗi AOP ExceptionHandler cho mọi request web |
| Dòng 18 | \`@ExceptionHandler(MethodArgumentNotValidException.class)\` | Bắt chính xác ngoại lệ validation | Tự động kích hoạt khi có trường DTO vi phạm \`@NotBlank\`, \`@Min\` |
| Dòng 20 | \`ProblemDetail.forStatusAndDetail(...)\` | Khởi tạo đối tượng RFC 7807 | Tạo payload chuẩn với mã status 400 Bad Request và lời giải thích ngắn gọn |
| Dòng 31 | \`problem.setProperty("invalidFields", fieldErrors)\` | Mở rộng thuộc tính chi tiết | Đính kèm danh sách các trường bị lỗi kèm câu thông báo cho Client hiển thị cạnh input form |
| Dòng 33 | \`problem.setProperty("traceId", ...)\` | Gắn mã Trace ID | Hỗ trợ lập trình viên tra cứu chính xác log sự cố trên Kibana / Grafana |

---

## 4. Cạm bẫy thực tế & Best Practices (Senior Trap Guide)

:::danger LỖI BẮT TẤT CẢ NGOẠI LỆ BẰNG Exception.class MÀ NUỐT CHỬNG 404
- Nếu bạn viết \`@ExceptionHandler(Exception.class)\` nhưng không cẩn thận, nó sẽ bắt luôn cả \`NoHandlerFoundException\` (khi user gõ sai URL) và biến lỗi \`404 Not Found\` thành lỗi \`500 Internal Server Error\`!
- **Cách làm chuẩn**: Hãy kế thừa \`ResponseEntityExceptionHandler\` có sẵn của Spring Boot và override lại các method chuẩn hóa như \`handleMethodArgumentNotValid\`.
:::
`;
}

// Refactor Lesson 2-2-3
const l223 = m2.lessons.find(l => l.id === "2-2-3");
if (l223) {
  l223.title = "Bài 2.2.3: Cạm bẫy Lộ StackTrace Hệ Thống, Nuốt Lỗi 500 & Thiếu RFC 7807 Header";
  l223.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nhận diện lỗ hổng an ninh thông tin khi để lộ StackTrace Java và câu lệnh SQL nội bộ ra ngoài Client.
- Cấu hình Spring Boot tự động che giấu chi tiết ngoại lệ trên môi trường Production: \`server.error.include-stacktrace=never\`.
- Xử lý các ngoại lệ bất khả kháng (Unhandled Exception) mà vẫn trả về định dạng RFC 7807 sạch sẽ.
- Đọc hiểu toàn bộ mã nguồn cấu hình phòng hộ qua Bảng phân tích chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: PHƠI BÀY VẾT THƯƠNG CHO KẺ ĐỊCH
Khi máy chủ Spring Boot gặp lỗi \`SQLException\` hoặc \`NullPointerException\`:
- **Nếu không che giấu StackTrace**: Màn hình trả về 200 dòng chữ đỏ chót hiển thị: tên bảng database, tên cột, mật khẩu kết nối, phiên bản PostgreSQL, cấu trúc thư mục ổ đĩa của server. Hacker chỉ cần nhìn vào StackTrace là biết chính xác hệ thống dùng thư viện nào có lỗ hổng để tấn công!
- **Xử lý chuẩn Senior**: Trả về một thông điệp lịch sự chuẩn RFC 7807: *"Đã xảy ra sự cố nội bộ trong quá trình xử lý đơn hàng. Mã sự cố: ERR-883921"*. Toàn bộ chi tiết kỹ thuật được ghi ngầm vào file log an toàn!
:::

---

## 1. Cái này là gì? (Lỗ Hổng Lộ Dấu Vết Kỹ Thuật)

### Sơ Đồ So Sánh: Lộ StackTrace vs Che Mờ An Toàn

\`\`\`mermaid
flowchart TD
    Crash["Lỗi Hệ Thống: NullPointerException / SQLException"] --> CheckConfig{"server.error.include-stacktrace?"}
    CheckConfig -- "always (Mặc định dev)" --> Danger["❌ LỘ NGUYÊN BẢN STACKTRACE:<br/>at org.postgresql.core.v3...<br/>-> HACKER NẮM TRỌN CẤU TRÚC DB!"]
    CheckConfig -- "never (Chuẩn Production)" --> Safe["⭐ BẢO MẬT TUYỆT ĐỐI:<br/>HTTP 500 Internal Server Error<br/>detail: 'Lỗi xử lý nội bộ. Vui lòng liên hệ hỗ trợ kèm TraceID'"]
    
    style Danger fill:#7c2d12,stroke:#f97316,color:#fff
    style Safe fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### Cấu hình An toàn trong \`application-prod.yml\`

\`\`\`yaml
server:
  error:
    include-stacktrace: never # Tuyệt đối KHÔNG BAO GIỜ bật always trên production
    include-message: never    # Không lộ message ngoại lệ raw của Java
    include-binding-errors: never
    include-exception: false
\`\`\`

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là phương thức bắt lỗi Fallback an toàn cuối cùng trong \`GlobalExceptionHandler\`:

\`\`\`java
package vn.mastery.ecommerce.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.net.URI;
import java.time.Instant;
import java.util.UUID;

@RestControllerAdvice
public class ProductionSecurityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ProductionSecurityExceptionHandler.class);

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleAllUncaughtExceptions(Exception ex) {
        String errorId = UUID.randomUUID().toString();

        // Ghi lại toàn bộ StackTrace vào file log an toàn của server để kỹ sư debug
        log.error("[SỰ CỐ NGUY HIỂM - ERROR_ID: {}] Ngoại lệ chưa được xử lý: {}", errorId, ex.getMessage(), ex);

        // Chỉ trả về thông điệp chung chung sạch sẽ cho người dùng bên ngoài
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Đã xảy ra sự cố kỹ thuật ngoài ý muốn. Vui lòng liên hệ CSKH và cung cấp mã lỗi này: " + errorId
        );
        problem.setTitle("Lỗi Hệ Thống Nội Bộ (Internal Server Error)");
        problem.setType(URI.create("https://ecommerce.mastery.vn/errors/internal-error"));
        problem.setProperty("errorId", errorId);
        problem.setProperty("timestamp", Instant.now());

        return problem;
    }
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Khai báo | Ý nghĩa kỹ thuật | Tác dụng bảo mật |
|---|---|---|---|
| Dòng 19 | \`@ExceptionHandler(Exception.class)\` | Chốt chặn an toàn cuối cùng (Catch-All) | Đảm bảo không có bất kỳ ngoại lệ nào thoát ra làm sập server |
| Dòng 21 | \`String errorId = UUID.randomUUID().toString();\` | Sinh mã định danh sự cố duy nhất | Tạo cầu nối giữa người dùng và log của kỹ sư phần mềm |
| Dòng 24 | \`log.error("[ERROR_ID: {}] ...", errorId, ex);\` | Ghi trọn vẹn StackTrace vào log nội bộ | Cho phép kỹ sư tra cứu nguyên nhân gốc rễ mà không để lộ ra ngoài |
| Dòng 27-30 | \`ProblemDetail.forStatusAndDetail(...)\` | Đóng gói thông báo lịch sự | Khách hàng chỉ thấy mã lỗi \`errorId\`, không thấy cấu trúc code Java |

---

## 4. Key Takeaways & Cạm bẫy sống còn (Senior Architect Summary)

1. **Khóa chặt \`include-stacktrace: never\`**: Luôn kiểm tra cấu hình này trong pipeline CI/CD trước khi xuất bản bản build lên Production.
2. **Luôn gắn Error ID / Trace ID**: Một thông báo lỗi không có Trace ID là một "ngõ cụt" cho cả khách hàng và đội ngũ hỗ trợ kỹ thuật.
`;
}

// Refactor Lesson 2-2-4
const l224 = m2.lessons.find(l => l.id === "2-2-4");
if (l224) {
  l224.title = "Bài 2.2.4: Milestone Synthesis: Bản đồ Xử lý Lỗi Toàn Cục & Ma trận HTTP Error Codes";
  l224.content = `
:::target 🎯 MỤC TIÊU BÀI TỔNG HỢP MILESTONE (10 PHÚT)
- Tổng hợp toàn diện kiến trúc xử lý lỗi tập trung bằng Spring \`@RestControllerAdvice\` và RFC 7807.
- Nắm vững Ma trận Quyết định Lựa chọn Mã Lỗi HTTP Status Codes chuẩn thế giới.
- Đọc hiểu toàn bộ mã nguồn bộ xử lý lỗi tổng hợp \`ComprehensiveApiExceptionHandler\` qua Bảng phân tích chi tiết.
- Nắm chắc 3 quy tắc sống còn khi thiết kế thông điệp lỗi cho ứng dụng E-Commerce.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BẢNG CHỈ DẪN TRẠM CỨU HỘ
Global Exception Handler giống như **Trạm cứu hộ khẩn cấp trên đường cao tốc**:
- Khi xe gặp sự cố hết xăng (\`ResourceNotFoundException\`): Cứu hộ mang xăng đến (\`404 Not Found\`).
- Khi xe chở quá tải (\`MethodArgumentNotValidException\`): Cảnh sát giao thông chặn lại cân xe (\`400 Bad Request\`).
- Khi xe không có bằng lái (\`AccessDeniedException\`): Yêu cầu dừng xe kiểm tra (\`403 Forbidden\`).
- Khi đường bị sập cầu (\`SystemCrashException\`): Cắm biển cảnh báo dừng lưu thông (\`500 Internal Error\`).
Mọi tình huống đều có phương án xử lý thống nhất, chuyên nghiệp và có văn hóa!
:::

---

## 1. Cái này là gì? (Bản đồ Dòng chảy Bắt Lỗi Toàn Cục)

### Sơ Đồ Kiến Trúc: Chuỗi Phân Giải Ngoại Lệ Trong Spring Web

\`\`\`mermaid
flowchart TD
    Client["Client HTTP Request"] --> Controller["REST Controller"]
    Controller --> Service["Business Service"]
    Service --> Exception{"Phát sinh Ngoại Lệ?"}
    
    Exception -- "Bad Data" --> ValEx["MethodArgumentNotValidException"]
    Exception -- "Không tìm thấy" --> NFEx["ResourceNotFoundException"]
    Exception -- "Xung đột kho" --> ConflictEx["OptimisticLockException"]
    Exception -- "Lỗi không xác định" --> UncaughtEx["Throwable / Exception"]

    subgraph Advice ["@RestControllerAdvice: Phân Loại & Đóng Gói"]
        ValEx --> P400["ProblemDetail: 400 Bad Request"]
        NFEx --> P404["ProblemDetail: 404 Not Found"]
        ConflictEx --> P409["ProblemDetail: 409 Conflict"]
        UncaughtEx --> P500["ProblemDetail: 500 Internal Error"]
    end

    Advice --> Out["Content-Type: application/problem+json<br/>Trả về Client"]

    style Exception fill:#7c2d12,stroke:#f97316,color:#fff
    style Advice fill:#064e3b,stroke:#10b981,color:#fff
    style Out fill:#1e3a8a,stroke:#3b82f6,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Ma trận HTTP Error Codes Chuẩn Doanh Nghiệp)

### Bảng Ma Trận: Lựa Chọn Mã Lỗi HTTP Trong Dự Án E-Commerce

| Mã HTTP | Ý nghĩa kỹ thuật | Khi nào sử dụng? | Ví dụ thực tế |
|---|---|---|---|
| **400 Bad Request** | Cú pháp request sai hoặc validation thất bại | Khi client gửi thiếu trường, sai định dạng số/email | \`@NotBlank\` trên số điện thoại thất bại |
| **401 Unauthorized** | Chưa xác thực danh tính | Khi client chưa gửi kèm JWT Token hoặc Token đã hết hạn | Gọi API xem đơn hàng mà chưa đăng nhập |
| **403 Forbidden** | Đã đăng nhập nhưng không đủ quyền | User thường cố gọi API của Admin | Khách hàng cố gọi API đổi giá sản phẩm |
| **404 Not Found** | Không tìm thấy tài nguyên | Tra cứu ID không tồn tại trong database | Gọi \`/api/v1/orders/999999\` |
| **409 Conflict** | Xung đột trạng thái tài nguyên | Tranh chấp dữ liệu, vi phạm Unique Constraint | Hai người cùng bấm mua chiếc vé máy bay cuối cùng |
| **422 Unprocessable** | Cú pháp đúng nhưng vi phạm business rule | Lỗi logic nghiệp vụ chuyên sâu | Áp mã giảm giá đã hết hạn sử dụng |
| **500 Internal Error** | Máy chủ gặp lỗi bất ngờ | Lỗi code chưa bắt, sập database | Lỗi \`NullPointerException\` trong code |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Mã nguồn tổng hợp bộ bắt lỗi toàn diện:

\`\`\`java
package vn.mastery.ecommerce.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.net.URI;
import java.time.Instant;

@RestControllerAdvice
public class ComprehensiveApiExceptionHandler {

    @ExceptionHandler(BusinessRuleException.class)
    public ProblemDetail handleBusinessRuleViolation(BusinessRuleException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
        problem.setTitle("Vi Phạm Quy Tắc Nghiệp Vụ");
        problem.setType(URI.create("https://ecommerce.mastery.vn/errors/business-rule-violation"));
        problem.setProperty("errorCode", ex.getErrorCode());
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(InventoryConflictException.class)
    public ProblemDetail handleInventoryConflict(InventoryConflictException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setTitle("Xung Đột Tồn Kho Hàng Hóa");
        problem.setType(URI.create("https://ecommerce.mastery.vn/errors/inventory-conflict"));
        problem.setProperty("productId", ex.getProductId());
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Spring |
|---|---|---|---|
| Dòng 10 | \`@RestControllerAdvice\` | Đăng ký bộ xử lý lỗi toàn cục | Can thiệp vào mọi response văng lỗi từ Controller |
| Dòng 14 | \`@ExceptionHandler(BusinessRuleException.class)\` | Bắt lỗi nghiệp vụ | Xử lý các tình huống như ví không đủ tiền, voucher hết hạn |
| Dòng 16 | \`HttpStatus.UNPROCESSABLE_ENTITY\` | Mã HTTP 422 chuẩn hóa | Báo cho Mobile App biết cú pháp JSON đúng nhưng nghiệp vụ từ chối |
| Dòng 25 | \`HttpStatus.CONFLICT\` | Mã HTTP 409 chuẩn hóa | Báo cho Client biết tồn kho bị tranh chấp, nên tải lại trang để thấy số lượng mới |

---

## 4. Key Takeaways & Nguyên Tắc Sống Còn (Senior Architect Summary)

1. **Chuẩn hóa 100% bằng RFC 7807**: Không dùng các cấu trúc tự phát \`ApiResponse<T>\` cho trường hợp lỗi. Hãy dùng \`ProblemDetail\` để tuân thủ tiêu chuẩn web hiện đại.
2. **Tách biệt rõ ràng 4xx và 5xx**: Lỗi 4xx là do Client làm sai (không cần đánh thức kỹ sư trực đêm); Lỗi 5xx là do Server bị lỗi (cần kích hoạt cảnh báo PagerDuty ngay lập tức).
`;
}

// Serialize back to file
const outContent = `/* MODULE 2 — REST API chuyên nghiệp (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n` + JSON.stringify(m2, null, 2) + `\n);\n`;

fs.writeFileSync(modulePath, outContent, "utf8");
console.log("Successfully refactored Module 2 Topic 2 (Lessons 2-2-1, 2-2-2, 2-2-3, 2-2-4)!");
