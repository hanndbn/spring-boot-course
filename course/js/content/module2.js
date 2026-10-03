/* MODULE 2 — REST API chuyên nghiệp */
window.COURSE_MODULES = window.COURSE_MODULES || [];
window.COURSE_MODULES.push({
  id: 2,
  title: "REST API chuyên nghiệp",
  subtitle: "MVC, DTO, Validation, Error handling",
  icon: "🌐",
  desc: "Thiết kế API production-grade: DTO + MapStruct, validation, RFC 7807, OpenAPI docs.",
  lessons: [
    {
      id: "2-1",
      type: "lesson",
      title: "Spring MVC & Xây dựng CRUD REST API Chuẩn Doanh nghiệp",
      minutes: 50,
      content: `
## Đằng sau một HTTP Request: Spring MVC vận hành như thế nào?

Xây dựng một API RESTful trả lời JSON trong Spring Boot dường như rất đơn giản: chỉ cần viết một class với <code>@RestController</code> và vài method <code>@GetMapping</code>. Nhưng khi hệ thống phục vụ hàng nghìn request mỗi giây, sự khác biệt giữa một API nghiệp dư và một API cấp doanh nghiệp (Enterprise-grade) bộc lộ rất rõ:
- API nghiệp dư trả về HTTP 200 cho mọi tình huống (kể cả lỗi), làm tê liệt hệ thống giám sát Datadog/Prometheus và vô hiệu hóa cơ chế tự động Retry của API Gateway.
- Để lộ trực tiếp JPA Entity ra Controller dẫn đến lỗi bảo mật **Mass Assignment** và bug kinh điển **LazyInitializationException**.
- Không quản lý phân trang dẫn đến các câu truy vấn vét cạn hàng trăm nghìn bản ghi làm sập RAM máy chủ (OutOfMemoryError).

Để thiết kế API chuẩn mực, trước hết bạn phải nắm rõ cỗ máy điều phối đằng sau Spring MVC: **DispatcherServlet** và chuỗi xử lý Request-Response.

---

## 1. Kiến trúc DispatcherServlet & Vòng đời Xử lý HTTP Request

### Sơ Đồ Mô Phỏng: Hành Trình 1 HTTP Request Qua DispatcherServlet Pipeline

~~~mermaid
sequenceDiagram
    autonumber
    actor User as Client (Browser/Mobile)
    participant Tomcat as Tomcat Connector (Port 8080)
    participant Filters as Security / MDC FilterChain
    participant DS as DispatcherServlet
    participant Mapping as HandlerMapping
    participant Interceptor as HandlerInterceptor (preHandle)
    participant Controller as @RestController Method
    
    User->>Tomcat: HTTP POST /api/v1/orders
    Tomcat->>Filters: doFilter()
    Note over Filters: JWT Auth & MDC TraceId injection
    Filters->>DS: doDispatch()
    DS->>Mapping: getHandler()
    Mapping-->>DS: HandlerExecutionChain
    DS->>Interceptor: preHandle()
    alt preHandle return true
        DS->>Controller: invoke endpoint method
        Controller-->>DS: Return ResponseEntity&lt;OrderDto&gt;
        DS->>Interceptor: postHandle()
        Note over DS: HttpMessageConverter (Jackson JSON)
        DS->>Interceptor: afterCompletion()
        DS-->>Filters: Response OK
        Filters-->>User: HTTP 201 Created (JSON Body)
    else preHandle return false
        Interceptor-->>DS: Blocked
        DS-->>User: HTTP 403 Forbidden
    end
~~~


Spring MVC được xây dựng trên mô hình thiết kế **Front Controller Pattern**, trong đó <code>DispatcherServlet</code> đóng vai trò nhạc trưởng tiếp nhận toàn bộ các cuộc gọi đến:

~~~text
                     SPRING MVC REQUEST PROCESSING PIPELINE
                     
  [Client HTTP Request]
        │
        ▼
  [Tomcat Connector / Servlet Filter Chain] (SecurityFilterChain, CorsFilter)
        │
        ▼
  [DispatcherServlet.doDispatch()]
        │
        ├── 1. HandlerMapping (RequestMappingHandlerMapping)
        │      • So khớp URL path, HTTP Method, Content-Type để tìm Controller Method
        │
        ├── 2. HandlerExecutionChain: Kích hoạt HandlerInterceptor.preHandle()
        │      • Logging, Tracing ID, Token verification
        │
        ├── 3. HandlerAdapter (RequestMappingHandlerAdapter)
        │      │
        │      ├── HandlerMethodArgumentResolver:
        │      │   • @PathVariable, @RequestParam, @RequestHeader
        │      │   • @RequestBody → HttpMessageConverter (Jackson chuyển JSON → Java Object)
        │      │   • Pageable (PageableHandlerMethodArgumentResolver)
        │      │
        │      ├── Thực thi Controller Method của bạn (OrderController.createOrder())
        │      │
        │      └── HandlerMethodReturnValueHandler:
        │          • ResponseEntityExceptionHandler
        │          • Jackson HttpMessageConverter (chuyển Java Object → JSON Byte Stream)
        │
        ├── 4. HandlerExecutionChain: Kích hoạt HandlerInterceptor.postHandle()
        │
        └── 5. HandlerExecutionChain: Kích hoạt HandlerInterceptor.afterCompletion()
               • Dọn dẹp ThreadLocal (MDC, SecurityContext)
        │
        ▼
  [Client Nhận HTTP Response]
~~~

### Bảng tra cứu các Annotation Binding cốt lõi trong Controller

| Annotation | Nguồn dữ liệu trích xuất | Ví dụ thực tế |
|---|---|---|
| <code>@PathVariable</code> | Giá trị biến trên đường dẫn URL (URI Template). Thường là ID định danh resource. | <code>GET /api/v1/contracts/{contractNumber}</code> |
| <code>@RequestParam</code> | Query Parameters phía sau dấu <code>?</code>. Thường dùng cho lọc, tìm kiếm, phân trang. | <code>GET /api/v1/contracts?status=ACTIVE&page=0&size=20</code> |
| <code>@RequestBody</code> | Toàn bộ payload body của HTTP Request (JSON/XML). Được Jackson parse thành Object. | <code>POST /api/v1/contracts</code> với JSON body |
| <code>@RequestHeader</code> | Đọc metadata từ HTTP Header. | <code>@RequestHeader("X-Idempotency-Key") String idempotencyKey</code> |
| <code>@ModelAttribute</code> | Binding form-data hoặc gom nhóm nhiều query parameters thành một DTO tìm kiếm. | <code>@ModelAttribute ContractFilterCriteria criteria</code> |

---

## 2. Toàn bộ Code Sản Xuất: Quản lý Hợp đồng Khách hàng (Enterprise Contract API)

Hãy xây dựng một hệ thống quản lý Hợp đồng kinh doanh (Business Contract API) đáp ứng các chuẩn mực khắt khe nhất của kiến trúc REST:

### Bước 1: DTO Request & Response Bất biến với Java Record

~~~java
package vn.mastery.contract.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public final class ContractDto {

    public record CreateContractRequest(
        @NotBlank(message = "Mã hợp đồng không được để trống")
        @Pattern(regexp = "^CTR-\\d{4}-[A-Z0-9]{4}$", message = "Mã hợp đồng phải có định dạng CTR-YYYY-XXXX")
        String contractNumber,

        @NotBlank(message = "Mã khách hàng không được để trống")
        String customerCif,

        @NotNull(message = "Giá trị hợp đồng không được null")
        @DecimalMin(value = "1000000.0", message = "Giá trị hợp đồng tối thiểu là 1,000,000 VND")
        BigDecimal totalValue,

        @NotNull(message = "Ngày bắt đầu hiệu lực không được null")
        @FutureOrPresent(message = "Ngày hiệu lực không được ở quá khứ")
        LocalDate startDate,

        @NotNull(message = "Ngày kết thúc không được null")
        LocalDate endDate
    ) {}

    public record UpdateContractRequest(
        @NotNull(message = "Giá trị hợp đồng không được null")
        @DecimalMin(value = "1000000.0")
        BigDecimal totalValue,

        @NotNull
        LocalDate endDate
    ) {}

    public record PatchStatusRequest(
        @NotBlank(message = "Trạng thái mới không được để trống")
        @Pattern(regexp = "^(ACTIVE|SUSPENDED|TERMINATED)$", message = "Trạng thái chỉ nhận: ACTIVE, SUSPENDED, TERMINATED")
        String newStatus,

        @NotBlank(message = "Lý do thay đổi trạng thái bắt buộc phải có")
        String changeReason
    ) {}

    public record ContractResponse(
        String contractNumber,
        String customerCif,
        BigDecimal totalValue,
        String status,
        LocalDate startDate,
        LocalDate endDate,
        String createdBy,
        String createdAt
    ) {}
}
~~~

### Bước 2: Interface & Service Layer với Transaction Phân định

~~~java
package vn.mastery.contract.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.mastery.contract.dto.ContractDto.*;

public interface ContractService {
    ContractResponse createContract(CreateContractRequest request, String createdBy);
    ContractResponse getContractByNumber(String contractNumber);
    Page<ContractResponse> searchContracts(String status, Pageable pageable);
    ContractResponse updateContract(String contractNumber, UpdateContractRequest request);
    ContractResponse patchStatus(String contractNumber, PatchStatusRequest request);
    void terminateContract(String contractNumber);
}
~~~

~~~java
package vn.mastery.contract.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.contract.dto.ContractDto.*;
import vn.mastery.contract.exception.ContractNotFoundException;
import vn.mastery.contract.service.ContractService;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ContractServiceImpl implements ContractService {
    private static final Logger log = LoggerFactory.getLogger(ContractServiceImpl.class);

    // Giả lập lưu trữ In-Memory thread-safe (Thực tế sẽ inject Spring Data JpaRepository)
    private final Map<String, ContractResponse> database = new ConcurrentHashMap<>();

    @Override
    @Transactional
    public ContractResponse createContract(CreateContractRequest request, String createdBy) {
        if (database.containsKey(request.contractNumber())) {
            throw new IllegalArgumentException("Hợp đồng với mã " + request.contractNumber() + " đã tồn tại");
        }
        if (request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("Ngày kết thúc phải diễn ra sau ngày bắt đầu");
        }

        ContractResponse newContract = new ContractResponse(
            request.contractNumber(),
            request.customerCif(),
            request.totalValue(),
            "ACTIVE",
            request.startDate(),
            request.endDate(),
            createdBy,
            Instant.now().toString()
        );
        database.put(newContract.contractNumber(), newContract);
        log.info("Tạo mới hợp đồng thành công: {}", newContract.contractNumber());
        return newContract;
    }

    @Override
    @Transactional(readOnly = true)
    public ContractResponse getContractByNumber(String contractNumber) {
        ContractResponse contract = database.get(contractNumber);
        if (contract == null) {
            throw new ContractNotFoundException("Không tìm thấy hợp đồng: " + contractNumber);
        }
        return contract;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ContractResponse> searchContracts(String status, Pageable pageable) {
        List<ContractResponse> filtered = database.values().stream()
            .filter(c -> status == null || c.status().equalsIgnoreCase(status))
            .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filtered.size());
        List<ContractResponse> pageContent = (start <= end) ? filtered.subList(start, end) : List.of();

        return new PageImpl<>(pageContent, pageable, filtered.size());
    }

    @Override
    @Transactional
    public ContractResponse updateContract(String contractNumber, UpdateContractRequest request) {
        ContractResponse existing = getContractByNumber(contractNumber);
        ContractResponse updated = new ContractResponse(
            existing.contractNumber(),
            existing.customerCif(),
            request.totalValue(),
            existing.status(),
            existing.startDate(),
            request.endDate(),
            existing.createdBy(),
            existing.createdAt()
        );
        database.put(contractNumber, updated);
        log.info("Cập nhật toàn phần hợp đồng {}", contractNumber);
        return updated;
    }

    @Override
    @Transactional
    public ContractResponse patchStatus(String contractNumber, PatchStatusRequest request) {
        ContractResponse existing = getContractByNumber(contractNumber);
        ContractResponse updated = new ContractResponse(
            existing.contractNumber(),
            existing.customerCif(),
            existing.totalValue(),
            request.newStatus(),
            existing.startDate(),
            existing.endDate(),
            existing.createdBy(),
            existing.createdAt()
        );
        database.put(contractNumber, updated);
        log.info("Thay đổi trạng thái hợp đồng {} thành {} với lý do: {}", contractNumber, request.newStatus(), request.changeReason());
        return updated;
    }

    @Override
    @Transactional
    public void terminateContract(String contractNumber) {
        if (!database.containsKey(contractNumber)) {
            throw new ContractNotFoundException("Không tìm thấy hợp đồng để chấm dứt: " + contractNumber);
        }
        database.remove(contractNumber);
        log.info("Chấm dứt và xóa bỏ hợp đồng: {}", contractNumber);
    }
}
~~~

### Bước 3: REST Controller Chuẩn Mực HTTP Semantics

~~~java
package vn.mastery.contract.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import vn.mastery.contract.dto.ContractDto.*;
import vn.mastery.contract.service.ContractService;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/contracts")
public class ContractController {

    private final ContractService contractService;

    public ContractController(ContractService contractService) {
        this.contractService = contractService;
    }

    // 1. POST: Tạo mới → Trả về 201 Created kèm Header "Location"
    @PostMapping
    public ResponseEntity<ContractResponse> createContract(
            @Valid @RequestBody CreateContractRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "SYSTEM") String userId) {
        ContractResponse created = contractService.createContract(request, userId);

        // Chuẩn REST: Header Location trỏ đến URI của resource vừa tạo
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{contractNumber}")
            .buildAndExpand(created.contractNumber())
            .toUri();

        return ResponseEntity.created(location).body(created);
    }

    // 2. GET by ID: Trả về 200 OK hoặc 404 Not Found
    @GetMapping("/{contractNumber}")
    public ResponseEntity<ContractResponse> getContract(@PathVariable String contractNumber) {
        return ResponseEntity.ok(contractService.getContractByNumber(contractNumber));
    }

    // 3. GET Collection: Phân trang và sắp xếp an toàn
    @GetMapping
    public ResponseEntity<Page<ContractResponse>> searchContracts(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "startDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(contractService.searchContracts(status, pageable));
    }

    // 4. PUT: Cập nhật toàn phần (Idempotent)
    @PutMapping("/{contractNumber}")
    public ResponseEntity<ContractResponse> updateContract(
            @PathVariable String contractNumber,
            @Valid @RequestBody UpdateContractRequest request) {
        return ResponseEntity.ok(contractService.updateContract(contractNumber, request));
    }

    // 5. PATCH: Cập nhật từng phần (Partial Update)
    @PatchMapping("/{contractNumber}/status")
    public ResponseEntity<ContractResponse> patchStatus(
            @PathVariable String contractNumber,
            @Valid @RequestBody PatchStatusRequest request) {
        return ResponseEntity.ok(contractService.patchStatus(contractNumber, request));
    }

    // 6. DELETE: Xóa resource → Bắt buộc trả về 204 No Content (Body rỗng)
    @DeleteMapping("/{contractNumber}")
    public ResponseEntity<Void> deleteContract(@PathVariable String contractNumber) {
        contractService.terminateContract(contractNumber);
        return ResponseEntity.noContent().build();
    }
}
~~~

---

## 3. Thử nghiệm & Xác thực Thực tế (Real-world Verification)

### Kịch bản 1: Tạo mới hợp đồng và kiểm tra Header Location

~~~bash
curl -i -X POST http://localhost:8080/api/v1/contracts \
  -H "Content-Type: application/json" \
  -H "X-User-Id: OFFICER_HOANG" \
  -d '{
    "contractNumber": "CTR-2026-A891",
    "customerCif": "CIF990011",
    "totalValue": 15000000.0,
    "startDate": "2026-11-01",
    "endDate": "2027-11-01"
  }'
~~~

Phản hồi từ máy chủ trả về chính xác **HTTP 201 Created** kèm đường dẫn định vị tài nguyên:

~~~text
HTTP/1.1 201 Created
Location: http://localhost:8080/api/v1/contracts/CTR-2026-A891
Content-Type: application/json

{
  "contractNumber": "CTR-2026-A891",
  "customerCif": "CIF990011",
  "totalValue": 15000000.0,
  "status": "ACTIVE",
  "startDate": "2026-11-01",
  "endDate": "2027-11-01",
  "createdBy": "OFFICER_HOANG",
  "createdAt": "2026-10-03T10:30:15.820Z"
}
~~~

### Kịch bản 2: Xóa hợp đồng và kiểm tra mã trạng thái 204 No Content

~~~bash
curl -i -X DELETE http://localhost:8080/api/v1/contracts/CTR-2026-A891
~~~

Phản hồi chuẩn: Mã HTTP 204 và tuyệt đối **không có body**:

~~~text
HTTP/1.1 204 No Content
Date: Sat, 03 Oct 2026 10:31:00 GMT
~~~

### Kịch bản 3: Truy vấn hợp đồng vừa xóa để kiểm chứng 404 Not Found

~~~bash
curl -i -X GET http://localhost:8080/api/v1/contracts/CTR-2026-A891
~~~

~~~text
HTTP/1.1 404 Not Found
Content-Type: application/problem+json

{
  "type": "https://api.mastery.vn/errors/contract-not-found",
  "title": "Contract Not Found",
  "status": 404,
  "detail": "Không tìm thấy hợp đồng: CTR-2026-A891"
}
~~~

---

## 4. Ba Cạm bẫy Chết người & Sự cố Hạ tầng (Production Pitfalls)

### Cạm bẫy 1: Để lộ trực tiếp JPA Entity ra Controller (Mass Assignment & Lazy Bug)
**Sự cố thảm họa**: 
Lập trình viên viết: <code>public ResponseEntity&lt;UserEntity&gt; register(@RequestBody UserEntity user)</code>.
**Hai hậu quả nhãn tiền**:
1. **Lỗ hổng Mass Assignment**: Hacker gửi JSON: <code>{"username": "hacker", "role": "SUPER_ADMIN", "walletBalance": 100000000}</code>. Vì Entity được binding trực tiếp, Hibernate lưu thẳng quyền Super Admin và số tiền ảo vào DB!
2. **Lỗi LazyInitializationException**: Khi Jackson cố gắng chuyển Entity thành JSON, nó đụng phải field <code>@OneToMany List&lt;Order&gt; orders</code> có <code>FetchType.LAZY</code>. Vì Controller nằm ngoài phạm vi Transaction, Session Hibernate đã đóng → Máy chủ ném lỗi HTTP 500 nát màn hình!
**Giải pháp bắt buộc**: Luôn dùng DTO / Java Record. Không bao giờ nhận hoặc trả trực tiếp JPA Entity ở tầng Controller.

### Cạm bẫy 2: Thói quen "200 OK cho mọi thứ" phá hủy hệ thống Observability
Nhiều team xây dựng format: 
<code>HTTP 200 OK: {"success": false, "code": "NOT_FOUND", "message": "User không tồn tại"}</code>.
**Tại sao đây là thiết kế thảm họa?**
- Hệ thống giám sát (Prometheus, Datadog) đếm số lượng HTTP 5xx và 4xx để vẽ đồ thị Error Rate và kích hoạt PagerDuty gọi kỹ sư dậy. Khi bạn trả 200, đồ thị báo xanh mượt (100% uptime) trong khi toàn bộ khách hàng đang không đặt được hàng!
- Kubernetes Ingress / API Gateway dựa vào HTTP Status để tự động thực hiện Circuit Breaking hoặc Failover sang Data Center dự phòng. Trả 200 làm vô hiệu hóa toàn bộ hạ tầng bảo vệ này.

### Cạm bẫy 3: DoS tự hủy vì không giới hạn max-page-size
Nếu trong <code>application.yml</code> bạn không cấu hình:
~~~yaml
spring:
  data:
    web:
      pageable:
        default-page-size: 20
        max-page-size: 100 # Bắt buộc phải có trần tối đa!
~~~
Một bên thứ ba hoặc người dùng tò mò có thể gửi: <code>GET /api/v1/contracts?size=1000000</code>. Spring Data sẽ cố nạp 1 triệu bản ghi từ DB vào RAM, gây nghẽn Garbage Collector (Stop-The-World) và làm sập Pod với lỗi OutOfMemoryError.

---

## 5. Thử thách Thực chiến (Hands-on Challenge)

### Đề bài:
Xây dựng REST API Quản lý Tài khoản Ngân hàng (Bank Account API):
1. Endpoint <code>POST /api/v1/accounts</code>:
   - Nhận vào <code>CreateAccountRequest(customerCif, accountType, initialDeposit, currency)</code>.
   - Nhận Header tùy chọn <code>X-Idempotency-Key</code>. Nếu cùng một Key được gửi lại trong vòng 5 phút với cùng nội dung, lập tức trả về kết quả cũ mà không tạo thêm tài khoản trùng lặp.
   - Thành công: Trả về <code>201 Created</code> kèm Header <code>Location: /api/v1/accounts/{accountNumber}</code>.
2. Endpoint <code>DELETE /api/v1/accounts/{accountNumber}</code>:
   - Xóa mềm (đổi trạng thái tài khoản thành <code>CLOSED</code>).
   - Trả về <code>204 No Content</code>.
3. Toàn bộ code phải sử dụng Record bất biến, Bean Validation, và Controller mỏng.

### Lời giải Chuẩn Kỹ sư Cấp cao:

~~~java
package vn.mastery.bank.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public final class AccountDto {

    public record CreateAccountRequest(
        @NotBlank(message = "CIF khách hàng không được để trống")
        String customerCif,

        @NotBlank(message = "Loại tài khoản không được để trống")
        @Pattern(regexp = "^(CHECKING|SAVINGS)$", message = "Loại tài khoản chỉ nhận CHECKING hoặc SAVINGS")
        String accountType,

        @NotNull(message = "Số dư khởi tạo không được null")
        @DecimalMin(value = "50000.0", message = "Số dư khởi tạo tối thiểu là 50,000 VND")
        BigDecimal initialDeposit,

        @NotBlank
        @Pattern(regexp = "^(VND|USD)$", message = "Đồng tiền hỗ trợ: VND hoặc USD")
        String currency
    ) {}

    public record AccountResponse(
        String accountNumber,
        String customerCif,
        String accountType,
        BigDecimal balance,
        String currency,
        String status,
        String createdAt
    ) {}
}
~~~

~~~java
package vn.mastery.bank.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import vn.mastery.bank.dto.AccountDto.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class BankAccountService {
    private static final Logger log = LoggerFactory.getLogger(BankAccountService.class);

    // Lưu trữ tài khoản và cache khóa Idempotency
    private final Map<String, AccountResponse> accounts = new ConcurrentHashMap<>();
    private final Map<String, AccountResponse> idempotencyCache = new ConcurrentHashMap<>();

    public AccountResponse openAccount(CreateAccountRequest request, String idempotencyKey) {
        if (idempotencyKey != null && idempotencyCache.containsKey(idempotencyKey)) {
            log.warn("Phát hiện request trùng lặp với Idempotency Key: {}. Trả về tài khoản đã tạo trước đó.", idempotencyKey);
            return idempotencyCache.get(idempotencyKey);
        }

        String accNumber = "AC-" + Math.abs(UUID.randomUUID().getMostSignificantBits() % 1000000000L);
        AccountResponse response = new AccountResponse(
            accNumber,
            request.customerCif(),
            request.accountType(),
            request.initialDeposit(),
            request.currency(),
            "ACTIVE",
            Instant.now().toString()
        );

        accounts.put(accNumber, response);
        if (idempotencyKey != null) {
            idempotencyCache.put(idempotencyKey, response);
        }

        log.info("Mở tài khoản thành công: Số TK={}, CIF={}", accNumber, request.customerCif());
        return response;
    }

    public void closeAccount(String accountNumber) {
        AccountResponse acc = accounts.get(accountNumber);
        if (acc == null) {
            throw new IllegalArgumentException("Không tìm thấy số tài khoản: " + accountNumber);
        }
        AccountResponse closed = new AccountResponse(
            acc.accountNumber(), acc.customerCif(), acc.accountType(),
            acc.balance(), acc.currency(), "CLOSED", acc.createdAt()
        );
        accounts.put(accountNumber, closed);
        log.info("Đã đóng tài khoản ngân hàng: {}", accountNumber);
    }
}
~~~

~~~java
package vn.mastery.bank.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import vn.mastery.bank.dto.AccountDto.*;
import vn.mastery.bank.service.BankAccountService;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/accounts")
public class BankAccountController {

    private final BankAccountService accountService;

    public BankAccountController(BankAccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    public ResponseEntity<AccountResponse> openAccount(
            @Valid @RequestBody CreateAccountRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey) {

        AccountResponse created = accountService.openAccount(request, idempotencyKey);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{accountNumber}")
            .buildAndExpand(created.accountNumber())
            .toUri();

        return ResponseEntity.created(location).body(created);
    }

    @DeleteMapping("/{accountNumber}")
    public ResponseEntity<Void> closeAccount(@PathVariable String accountNumber) {
        accountService.closeAccount(accountNumber);
        return ResponseEntity.noContent().build();
    }
}
~~~

:::takeaways
- **Front Controller Pattern**: Mọi request đều đi qua <code>DispatcherServlet</code>, được phân giải bởi <code>HandlerMapping</code> và tiền xử lý bởi chuỗi Interceptor.
- **HTTP Semantics Nghiêm ngặt**: 201 Created + Header Location khi thêm mới, 204 No Content khi xóa, 404 khi không thấy. Không bao giờ trả 200 cho lỗi.
- **Bảo vệ Vùng dữ liệu**: Tuyệt đối không expose trực tiếp JPA Entity ra Controller để tránh lỗi Mass Assignment và LazyInitializationException.
- **Bảo vệ Máy chủ khỏi DoS**: Luôn cấu hình <code>spring.data.web.pageable.max-page-size</code> để ngăn chặn các request truy vấn quá nhiều bản ghi gây tràn RAM Heap.
:::
`
    },
    {
      id: "2-2",
      type: "lesson",
      title: "Validation & Global Exception Handling — RFC 7807 ProblemDetails & Custom Constraints",
      minutes: 50,
      content: `
## Client luôn gửi dữ liệu sai — API của bạn tự vệ như thế nào?

Trong môi trường phân tán hoặc ứng dụng tài chính ngân hàng, một quy tắc bất biến là: **"Không bao giờ tin tưởng dữ liệu từ phía Client"**. Client có thể gửi thiếu trường, sai định dạng số điện thoại, ngày hết hạn ở quá khứ, hoặc thậm chí cố tình chèn payload độc hại để khai thác lỗi hệ thống.

Nếu không có cơ chế Validation và Xử lý Lỗi chuẩn mực:
1. Code controller/service sẽ ngập ngụa hàng chục câu lệnh <code>if (req.getName() == null)</code> lặp đi lặp lại.
2. Khi có lỗi, hệ thống ném thẳng <code>NullPointerException</code> hoặc mã lỗi SQL của PostgreSQL ra màn hình, phơi bày toàn bộ cấu trúc bảng và công nghệ cho tin tặc.
3. Mỗi lập trình viên trong team tự bịa ra một định dạng JSON báo lỗi khác nhau (<code>{"err": 1}</code> vs <code>{"success": false}</code> vs <code>{"status": "FAIL"}</code>), biến việc tích hợp của đội Frontend/Mobile thành một cơn ác mộng.

Bài học này sẽ hướng dẫn bạn thiết lập pháo đài phòng thủ dữ liệu với **Jakarta Bean Validation 3.0**, tự tạo **Custom Constraint & Class-level Validator**, và xây dựng **Global Exception Handler chuẩn quốc tế RFC 7807 (ProblemDetails)**.

---

## 1. Kiến trúc Validation & Chuẩn quốc tế RFC 7807 / RFC 9457

### Sơ Đồ Mô Phỏng: Luồng Xử Lý Lỗi Validation & Chuyển Đổi RFC 7807 ProblemDetail

~~~mermaid
flowchart TD
    Req["HTTP Request (Invalid JSON Body)"] --> DS["DispatcherServlet"]
    DS --> Val["Validator (Hibernate Validator Engine)"]
    Val --> Check{"Hợp lệ không?"}
    Check -- "Hợp Lệ" --> Ctrl["@RestController Method"]
    Check -- "Vi Phạm Ràng Buộc (@NotNull, @Size...)" --> Ex["Ném MethodArgumentNotValidException"]
    Ex --> Adv["@RestControllerAdvice (GlobalExceptionHandler)"]
    Adv --> MapErr["Trích xuất BindingResult & FieldErrors"]
    MapErr --> RFC["Đóng gói RFC 7807 ProblemDetail:<br/>- type: https://api.enterprise.com/errors/validation<br/>- title: Bad Request<br/>- status: 400<br/>- invalidParams: [field, message]"]
    RFC --> Res["HTTP 400 Bad Request + application/problem+json"]
    style RFC fill:#da3633,stroke:#f85149,color:#fff
~~~


Khi một HTTP Request chứa JSON body bay tới <code>DispatcherServlet</code>, chuỗi xử lý kiểm định diễn ra theo quy trình:

~~~text
                   JAKARTA BEAN VALIDATION & EXCEPTION FLOW
                   
  [HTTP Request JSON Body]
        │
        ▼
  [MappingJackson2HttpMessageConverter] (Parse JSON → Java DTO)
        │
        ▼
  [MethodValidationPostProcessor / Hibernate Validator]
        │
        ├── Kiểm tra các annotation: @NotBlank, @Min, @Valid...
        │
        ├── NẾU CÓ TRƯỜNG SAI PHẠM:
        │     • Ngắt cuộc gọi, KHÔNG cho request đi tiếp vào Controller Method!
        │     • Ném ngoại lệ MethodArgumentNotValidException (chứa BindingResult)
        │
        ▼
  [Global Exception Handler: @RestControllerAdvice]
        │
        ├── Bắt MethodArgumentNotValidException
        ├── Bóc tách danh sách FieldError (tên trường, giá trị từ chối, thông báo)
        ├── Tạo đối tượng ProblemDetail (chuẩn RFC 7807)
        │     • type: URI định danh loại lỗi
        │     • title: "Validation Failed"
        │     • status: 400 Bad Request
        │     • detail: "Dữ liệu đầu vào không hợp lệ"
        │     • instance: URI của endpoint (/api/v1/customers)
        │     • extensions: traceId, timestamp, invalidParams[]
        │
        ▼
  [HTTP 400 application/problem+json trả về Client]
~~~

### Định dạng lỗi chuẩn RFC 7807 (Problem Details for HTTP APIs)

Trước năm 2016, thế giới REST API không có tiêu chuẩn chung cho lỗi. RFC 7807 (và bản cập nhật RFC 9457) ra đời để giải quyết triệt để vấn đề này bằng cách quy định 5 trường cốt lõi:

| Thuộc tính | Kiểu dữ liệu | Ý nghĩa |
|---|---|---|
| <code>type</code> | URI Reference | Đường dẫn định danh loại lỗi (ví dụ: <code>https://api.mastery.vn/errors/validation-failed</code>). |
| <code>title</code> | String | Tóm tắt ngắn gọn, dễ hiểu về bản chất của lỗi. |
| <code>status</code> | Integer | Mã trạng thái HTTP (400, 404, 409, 422, 500). |
| <code>detail</code> | String | Mô tả cụ thể, chi tiết về nguyên nhân gây lỗi ở lần gọi này. |
| <code>instance</code> | URI Reference | Đường dẫn URI cụ thể của request gặp sự cố (Request Path). |
| *(Extensions)* | Key-Value | Các trường mở rộng tùy biến: <code>traceId</code>, <code>timestamp</code>, <code>invalidParams</code>. |

---

## 2. Toàn bộ Code Sản Xuất: KYC Onboarding & Custom Constraints

Hãy xây dựng quy trình Đăng ký Khách hàng Ngân hàng (KYC Customer Onboarding) với các ràng buộc kiểm tra khắt khe:

### Bước 1: Tự viết Custom Constraint @ValidCitizenId (CCCD 12 Số)

~~~java
package vn.mastery.validation.annotation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import vn.mastery.validation.validator.CitizenIdValidator;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = CitizenIdValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidCitizenId {
    String message() default "Số CCCD không hợp lệ (phải đủ 12 chữ số theo quy chuẩn quốc gia)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
~~~

~~~java
package vn.mastery.validation.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import vn.mastery.validation.annotation.ValidCitizenId;

public class CitizenIdValidator implements ConstraintValidator<ValidCitizenId, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return false;
        }
        // Quy chuẩn CCCD Việt Nam: 12 chữ số (3 số đầu: mã tỉnh/TP; 1 số: giới tính & thế kỷ; 2 số: năm sinh; 6 số ngẫu nhiên)
        return value.matches("^[0-9]{12}$");
    }
}
~~~

### Bước 2: Custom Class-Level Constraint @DateRange (Kiểm tra Chéo 2 Trường Ngày)

~~~java
package vn.mastery.validation.annotation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import vn.mastery.validation.validator.DateRangeValidator;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = DateRangeValidator.class)
@Target({ElementType.TYPE}) // Đặt ở cấp độ Class để so sánh giữa 2 trường
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidDateRange {
    String message() default "Ngày kết thúc phải diễn ra sau ngày bắt đầu";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};

    String startField() default "startDate";
    String endField() default "endDate";
}
~~~

~~~java
package vn.mastery.validation.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.BeanWrapperImpl;
import vn.mastery.validation.annotation.ValidDateRange;

import java.time.LocalDate;

public class DateRangeValidator implements ConstraintValidator<ValidDateRange, Object> {

    private String startField;
    private String endField;

    @Override
    public void initialize(ValidDateRange constraintAnnotation) {
        this.startField = constraintAnnotation.startField();
        this.endField = constraintAnnotation.endField();
    }

    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {
        try {
            Object startVal = new BeanWrapperImpl(value).getPropertyValue(startField);
            Object endVal = new BeanWrapperImpl(value).getPropertyValue(endField);

            if (startVal == null || endVal == null) {
                return true; // Để @NotNull trên từng field tự kiểm tra
            }

            if (startVal instanceof LocalDate start && endVal instanceof LocalDate end) {
                return end.isAfter(start);
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }
}
~~~

### Bước 3: DTO Áp dụng Ràng buộc Đa Tầng & Validation Groups

~~~java
package vn.mastery.customer.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import vn.mastery.validation.annotation.ValidCitizenId;
import vn.mastery.validation.annotation.ValidDateRange;

import java.time.LocalDate;

public final class CustomerRegistrationDto {

    public interface OnCreate {}
    public interface OnUpdate {}

    @ValidDateRange(startField = "cardIssuedDate", endField = "cardExpiredDate", message = "Ngày hết hạn thẻ căn cước phải sau ngày cấp")
    public record RegisterCustomerRequest(
        @NotBlank(message = "Họ và tên không được để trống", groups = {OnCreate.class, OnUpdate.class})
        @Size(min = 2, max = 100, message = "Họ và tên phải từ 2 đến 100 ký tự")
        String fullName,

        @NotBlank(message = "Email không được để trống", groups = OnCreate.class)
        @Email(message = "Định dạng email không hợp lệ", groups = {OnCreate.class, OnUpdate.class})
        String email,

        @NotBlank(message = "Số điện thoại không được để trống")
        @Pattern(regexp = "^(0|\\+84)[3|5|7|8|9][0-9]{8}$", message = "Số điện thoại di động Việt Nam không đúng định dạng")
        String phoneNumber,

        @ValidCitizenId(groups = OnCreate.class)
        String citizenId,

        @NotNull(message = "Ngày cấp CCCD không được null")
        @PastOrPresent(message = "Ngày cấp CCCD không thể ở tương lai")
        LocalDate cardIssuedDate,

        @NotNull(message = "Ngày hết hạn CCCD không được null")
        LocalDate cardExpiredDate,

        @NotNull(message = "Thông tin địa chỉ không được null")
        @Valid // BẮT BUỘC: Để kích hoạt validation đệ quy bên trong Object con
        AddressDto address
    ) {}

    public record AddressDto(
        @NotBlank(message = "Số nhà, tên đường không được để trống")
        String street,

        @NotBlank(message = "Tỉnh/Thành phố không được để trống")
        String city,

        @Pattern(regexp = "^[0-9]{5,6}$", message = "Mã bưu điện phải gồm 5 hoặc 6 chữ số")
        String postalCode
    ) {}
}
~~~

---

## 3. Global Exception Handler Đạt Chuẩn Doanh nghiệp

Thay vì viết rời rạc từng Controller Advice, kiến trúc chuẩn của Spring Boot 3 là kế thừa **<code>ResponseEntityExceptionHandler</code>**. Class cơ sở này của Spring đã xử lý sẵn 15+ ngoại lệ mạng của Spring MVC (Method Not Allowed, Unsupported Media Type, Missing Query Param...). Ta chỉ cần ghi đè và bổ sung các ngoại lệ nghiệp vụ:

~~~java
package vn.mastery.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.net.URI;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class GlobalProblemDetailsExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalProblemDetailsExceptionHandler.class);
    private static final String BASE_ERROR_URL = "https://api.mastery.vn/errors/";

    // 1. XỬ LÝ LỖI VALIDATION (HTTP 400 BAD REQUEST)
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {

        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        String traceId = getOrCreateTraceId();

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST,
            "Một hoặc nhiều trường dữ liệu gửi lên không thỏa mãn quy tắc kiểm tra"
        );
        problem.setTitle("Validation Constraint Violation");
        problem.setType(URI.create(BASE_ERROR_URL + "validation-violation"));
        problem.setInstance(URI.create(path));

        // Trích xuất danh sách vi phạm chi tiết
        List<Map<String, String>> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> Map.of(
                "field", fe.getField(),
                "rejectedValue", String.valueOf(fe.getRejectedValue()),
                "message", fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value"
            ))
            .toList();

        // Thêm các lỗi cấp độ Class (Global Errors)
        List<Map<String, String>> globalErrors = ex.getBindingResult().getGlobalErrors().stream()
            .map(ge -> Map.of(
                "object", ge.getObjectName(),
                "message", ge.getDefaultMessage() != null ? ge.getDefaultMessage() : "Cross-field validation failed"
            ))
            .toList();

        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("traceId", traceId);
        problem.setProperty("invalidFields", fieldErrors);
        problem.setProperty("globalViolations", globalErrors);

        log.warn("[VALIDATION-FAILED] Path: {} | TraceId: {} | Errors: {}", path, traceId, fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problem);
    }

    // 2. XỬ LÝ LỖI KHÔNG TÌM THẤY TÀI NGUYÊN (HTTP 404 NOT FOUND)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleResourceNotFound(ResourceNotFoundException ex, HttpServletRequest req) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Resource Not Found");
        problem.setType(URI.create(BASE_ERROR_URL + "resource-not-found"));
        problem.setInstance(URI.create(req.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("traceId", getOrCreateTraceId());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problem);
    }

    // 3. XỬ LÝ LỖI XUNG ĐỘT TÀI NGUYÊN / TRÙNG DỮ LIỆU (HTTP 409 CONFLICT)
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ProblemDetail> handleDuplicateResource(DuplicateResourceException ex, HttpServletRequest req) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setTitle("Duplicate Resource");
        problem.setType(URI.create(BASE_ERROR_URL + "duplicate-resource"));
        problem.setInstance(URI.create(req.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("traceId", getOrCreateTraceId());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
    }

    // 4. XỬ LÝ LỖI VI PHẠM LUẬT NGHIỆP VỤ (HTTP 422 UNPROCESSABLE ENTITY)
    @ExceptionHandler(BusinessRuleViolationException.class)
    public ResponseEntity<ProblemDetail> handleBusinessRule(BusinessRuleViolationException ex, HttpServletRequest req) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
        problem.setTitle("Business Rule Violation");
        problem.setType(URI.create(BASE_ERROR_URL + "business-rule-violation"));
        problem.setInstance(URI.create(req.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("traceId", getOrCreateTraceId());

        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(problem);
    }

    // 5. CHỐỐT CHẶN CUỐI CÙNG: BẮT TOÀN BỘ UNHANDLED EXCEPTIONS (HTTP 500)
    // TUYỆT ĐỐI KHÔNG ĐƯỢC LEAK STACKTRACE RA CLIENT!
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleGlobalInternalError(Exception ex, HttpServletRequest req) {
        String traceId = getOrCreateTraceId();
        log.error("[SYSTEM-CRITICAL-ERROR] TraceId: {} | Request: {} | Exception: ", traceId, req.getRequestURI(), ex);

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Đã xảy ra sự cố nội bộ trong hệ thống. Vui lòng cung cấp mã TraceId để đội ngũ hỗ trợ kiểm tra."
        );
        problem.setTitle("Internal Server Error");
        problem.setType(URI.create(BASE_ERROR_URL + "internal-server-error"));
        problem.setInstance(URI.create(req.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("traceId", traceId);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problem);
    }

    private String getOrCreateTraceId() {
        String traceId = MDC.get("traceId");
        return (traceId != null && !traceId.isBlank()) ? traceId : UUID.randomUUID().toString();
    }
}
~~~

---

## 4. Thử nghiệm & Xác thực Thực tế (Real-world Verification)

### Kịch bản 1: Gửi Request Vi phạm Đồng thời Cả Field-level và Class-level Constraints

~~~bash
curl -i -X POST http://localhost:8080/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "A",
    "email": "invalid-email-format",
    "phoneNumber": "123456",
    "citizenId": "999",
    "cardIssuedDate": "2026-12-01",
    "cardExpiredDate": "2024-01-01",
    "address": {
      "street": "",
      "city": "Hà Nội",
      "postalCode": "ABC"
    }
  }'
~~~

Server trả về mã **HTTP 400 Bad Request** với Content-Type chuẩn <code>application/problem+json</code>:

~~~json
{
  "type": "https://api.mastery.vn/errors/validation-violation",
  "title": "Validation Constraint Violation",
  "status": 400,
  "detail": "Một hoặc nhiều trường dữ liệu gửi lên không thỏa mãn quy tắc kiểm tra",
  "instance": "/api/v1/customers",
  "timestamp": "2026-10-03T10:45:22.102Z",
  "traceId": "9f7b3a41-2a90-410a-8d77-c918231fa092",
  "invalidFields": [
    {
      "field": "fullName",
      "rejectedValue": "A",
      "message": "Họ và tên phải từ 2 đến 100 ký tự"
    },
    {
      "field": "email",
      "rejectedValue": "invalid-email-format",
      "message": "Định dạng email không hợp lệ"
    },
    {
      "field": "citizenId",
      "rejectedValue": "999",
      "message": "Số CCCD không hợp lệ (phải đủ 12 chữ số theo quy chuẩn quốc gia)"
    },
    {
      "field": "address.street",
      "rejectedValue": "",
      "message": "Số nhà, tên đường không được để trống"
    }
  ],
  "globalViolations": [
    {
      "object": "registerCustomerRequest",
      "message": "Ngày hết hạn thẻ căn cước phải sau ngày cấp"
    }
  ]
}
~~~

Nhìn vào JSON trên: Đội lập trình viên Mobile/Frontend có thể tự động bôi đỏ chính xác từng ô nhập liệu trên giao diện người dùng mà không cần phải viết thêm một dòng code bóc tách chuỗi nào!

### Kịch bản 2: Vi phạm Luật Nghiệp vụ (HTTP 422 Unprocessable Entity)

~~~bash
curl -i -X POST http://localhost:8080/api/v1/wallets/withdraw \
  -H "Content-Type: application/json" \
  -d '{"walletId": "WAL-101", "amount": 50000000.0}'
~~~

~~~text
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json

{
  "type": "https://api.mastery.vn/errors/business-rule-violation",
  "title": "Business Rule Violation",
  "status": 422,
  "detail": "Hạn mức rút tiền tối đa trong ngày của tài khoản tiêu chuẩn là 20,000,000 VND. Số tiền yêu cầu: 50,000,000 VND.",
  "instance": "/api/v1/wallets/withdraw",
  "timestamp": "2026-10-03T10:46:00.000Z",
  "traceId": "e123-bb44-8899"
}
~~~

---

## 5. Ba Cạm bẫy Chết người & Bài học Sự cố Thực tế

### Cạm bẫy 1: Rò rỉ Stacktrace Database ra Client (Security Vulnerability)
Khi một câu lệnh SQL bị lỗi (ví dụ trùng khóa chính), nếu bạn không bắt ngoại lệ ở <code>@ExceptionHandler(Exception.class)</code>, Spring Boot sẽ mặc định trả về:
<code>org.postgresql.util.PSQLException: ERROR: duplicate key value violates unique constraint "tbl_customer_email_key" Key (email)=(victim@bank.com) already exists.</code>
**Hậu quả**: Kẻ tấn công biết ngay:
1. Bạn đang dùng cơ sở dữ liệu PostgreSQL.
2. Tên bảng nội bộ là <code>tbl_customer</code>.
3. Tên cột và index duy nhất là <code>tbl_customer_email_key</code>.
Từ những thông tin này, tin tặc có thể dựng payload SQL Injection chính xác 100%.

### Cạm bẫy 2: Quên @Valid trên Nested Objects hoặc Collection
Nhiều kỹ sư viết:
~~~java
public record OrderRequest(
    @NotBlank String customerId,
    List<OrderItemDto> items // ❌ THIẾU @Valid!
) {}
~~~
Bên trong <code>OrderItemDto</code>, bạn có gắn <code>@Min(1) int quantity</code>. Tuy nhiên, khi client gửi <code>quantity: -99</code>, Spring **bỏ qua hoàn toàn validation** bên trong class con!
**Quy tắc**: Muốn validation thẩm thấu vào các object lồng nhau hoặc phần tử trong danh sách, bắt buộc phải viết:
<code>@NotEmpty List&lt;@Valid OrderItemDto&gt; items</code>.

### Cạm bẫy 3: Nhầm lẫn giữa 400 Bad Request và 422 Unprocessable Entity
- **400 Bad Request**: Lỗi ở tầng cú pháp, định dạng, schema (gửi chuỗi vào trường số nguyên, thiếu trường bắt buộc, JSON bị cắt cụt).
- **422 Unprocessable Entity**: Cú pháp và kiểu dữ liệu hoàn toàn hợp lệ, nhưng giá trị vi phạm **luật nghiệp vụ** (ví dụ: số dư khả dụng không đủ, tài khoản đang bị tạm khóa giao dịch).
Sử dụng đúng 422 giúp client phân biệt được lỗi do form nhập liệu (để hiển thị tooltip) hay lỗi do tài khoản nghiệp vụ (để mở modal nạp tiền).

---

## 6. Thử thách Thực chiến (Hands-on Challenge)

### Đề bài:
Xây dựng hệ thống Thanh toán Thẻ Tín dụng Quốc tế (Credit Card Gateway):
1. Viết Custom Constraint <code>@ValidLuhnCard</code>:
   - Kiểm tra số thẻ có đúng 16 chữ số hay không.
   - Kiểm tra tính hợp lệ bằng **Thuật toán Luhn Checksum** (nhân đôi các chữ số ở vị trí chẵn từ phải sang trái, cộng tổng các chữ số, tổng chia hết cho 10).
2. Viết DTO <code>ChargeCardRequest(cardNumber, cardHolder, expiryMonth, expiryYear, cvv, amount)</code>:
   - Áp dụng <code>@ValidLuhnCard</code> trên <code>cardNumber</code>.
   - <code>cvv</code>: đúng 3 hoặc 4 chữ số.
   - <code>amount</code>: lớn hơn 0.
3. Đảm bảo mọi ngoại lệ ném ra từ Controller đều được chuyển hóa thành JSON RFC 7807 với đầy đủ <code>traceId</code> để đội Ops đối soát.

### Lời giải Chuẩn Kỹ sư Cấp cao:

~~~java
package vn.mastery.payment.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = LuhnCardValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidLuhnCard {
    String message() default "Số thẻ tín dụng không hợp lệ theo tiêu chuẩn quốc tế ISO/IEC 7812 (Luhn Checksum failed)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
~~~

~~~java
package vn.mastery.payment.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class LuhnCardValidator implements ConstraintValidator<ValidLuhnCard, String> {

    @Override
    public boolean isValid(String cardNumber, ConstraintValidatorContext context) {
        if (cardNumber == null || cardNumber.isBlank()) return false;
        
        String sanitized = cardNumber.replaceAll("\\\\s+", "");
        if (!sanitized.matches("^[0-9]{13,19}$")) return false;

        return checkLuhn(sanitized);
    }

    private boolean checkLuhn(String cardNo) {
        int sum = 0;
        boolean alternate = false;
        for (int i = cardNo.length() - 1; i >= 0; i--) {
            int n = Integer.parseInt(cardNo.substring(i, i + 1));
            if (alternate) {
                n *= 2;
                if (n > 9) {
                    n = (n % 10) + 1;
                }
            }
            sum += n;
            alternate = !alternate;
        }
        return (sum % 10 == 0);
    }
}
~~~

~~~java
package vn.mastery.payment.dto;

import jakarta.validation.constraints.*;
import vn.mastery.payment.validation.ValidLuhnCard;
import java.math.BigDecimal;

public record ChargeCardRequest(
    @NotBlank(message = "Số thẻ không được để trống")
    @ValidLuhnCard
    String cardNumber,

    @NotBlank(message = "Tên chủ thẻ không được để trống")
    @Pattern(regexp = "^[A-Z ]+$", message = "Tên chủ thẻ viết hoa không dấu")
    String cardHolder,

    @Min(value = 1, message = "Tháng hết hạn từ 1 đến 12")
    @Max(value = 12, message = "Tháng hết hạn từ 1 đến 12")
    int expiryMonth,

    @Min(value = 2026, message = "Năm hết hạn phải từ 2026 trở đi")
    int expiryYear,

    @Pattern(regexp = "^[0-9]{3,4}$", message = "CVV phải gồm 3 hoặc 4 chữ số bảo mật")
    String cvv,

    @NotNull(message = "Số tiền thanh toán không được null")
    @DecimalMin(value = "1000.0", message = "Giao dịch tối thiểu 1,000 VND")
    BigDecimal amount
) {}
~~~

:::takeaways
- **Bảo vệ Vùng biên (Perimeter Defense)**: Dùng Bean Validation trên DTO để chặn đứng dữ liệu rác ngay từ cửa ngõ, không để lọt vào tầng nghiệp vụ.
- **Tiêu chuẩn RFC 7807/9457**: Sử dụng <code>ProblemDetail</code> để tạo hợp đồng báo lỗi thống nhất cho toàn bộ hệ thống API doanh nghiệp.
- **Không bao giờ Leak Chi tiết Hạ tầng**: Không đưa tên bảng SQL, stacktrace hay file path vào error message trả về Client.
- **Khả năng Truy vết (Traceability)**: Luôn đính kèm <code>traceId</code> trong mọi phản hồi lỗi 4xx/5xx để đối soát nhanh với log hệ thống.
:::
`
    },
    {
      id: "2-3",
      type: "lesson",
      title: "MapStruct & OpenAPI 3.0 (Swagger) — Compile-time Mapping & Living Documentation",
      minutes: 50,
      content: `
## Nỗi ám ảnh Boilerplate Code và Tài liệu API lỗi thời

Trong bất kỳ dự án Spring Boot thực tế nào, hai công việc tốn nhiều thời gian và dễ nảy sinh lỗi ngớ ngẩn nhất là:
1. **Chuyển đổi dữ liệu giữa Entity và DTO**: Viết hàng trăm dòng <code>dto.setX(entity.getX())</code> thủ công lặp đi lặp lại. Nếu dùng <code>BeanUtils.copyProperties()</code> hoặc ModelMapper thời xưa, ứng dụng phải trả giá bằng Reflection chậm chạp lúc runtime và không thể bắt lỗi type mismatch lúc compile.
2. **Viết và duy trì tài liệu API**: Viết file Word hoặc Postman collection rời rạc. Chỉ sau 2 tuần phát triển, code đã sửa 10 fields nhưng tài liệu vẫn ở phiên bản cũ, khiến đội Frontend gọi API toàn bị lỗi 400.

Giải pháp chuẩn công nghiệp hiện đại là: **MapStruct** (sinh code mapping tĩnh lúc biên dịch, tốc độ tương đương code tay) kết hợp với **Springdoc OpenAPI 3.0** (tự động soi code và sinh Swagger UI "sống" 100% đồng bộ với mã nguồn).

---

## 1. Kiến trúc Biên dịch của MapStruct & So sánh Hiệu năng

Khác với ModelMapper sử dụng Reflection lúc runtime để dò tìm các getter/setter (gây tốn CPU và không thể tối ưu hóa JIT), MapStruct hoạt động dựa trên cơ chế **Java Annotation Processing (JSR-269)**:

~~~text
                   MAPSTRUCT ANNOTATION PROCESSING PIPELINE
                   
  [User viết Mapper Interface: @Mapper]
        │
        ▼
  [javac: Trình biên dịch Java khởi chạy]
        │
        ├── 1. Lombok Processor chạy trước: Sinh getter/setter/builder
        │
        ├── 2. MapStruct Annotation Processor (mapstruct-processor.jar) quét:
        │      • Phân tích source type (Entity) và target type (DTO)
        │      • Kiểm tra type compatibility (String → String, Long → Long)
        │      • Nếu thiếu trường hoặc sai type: BÁO LỖI NGAY LÚC COMPILE!
        │      • Sinh file TaskMapperImpl.java trong target/generated-sources
        │
        ├── 3. javac biên dịch cả TaskMapperImpl.java thành Bytecode .class
        │
        ▼
  [Runtime JVM Thực thi: Hoàn toàn thuần túy các lệnh getter/setter]
  [TỐC ĐỘ GẤP 15 - 30 LẦN SO VỚI MODELMAPPER & BEANUTILS!]
~~~

### Bảng đối chiếu các giải pháp Mapping trong hệ sinh thái Java

| Tiêu chí kỹ thuật | Code tay (Manual Getter/Setter) | Apache BeanUtils / Spring BeanUtils | ModelMapper | MapStruct (Khuyên dùng) |
|---|---|---|---|---|
| **Cơ chế hoạt động** | Thủ công | Reflection lúc runtime | Reflection + Bytecode dynamic | **Annotation Processing lúc Compile** |
| **Tốc độ thực thi** | Cực nhanh (Native) | Chậm (Reflection overhead) | Rất chậm (Type token cache) | **Ngang ngửa 100% code tay** |
| **Bắt lỗi Type Mismatch** | Compile time | Runtime (Silent fail / Null) | Runtime (Exception bất ngờ) | **Compile time (Build fail ngay lập tức)** |
| **Chi phí bảo trì** | Khổng lồ, dễ sót field | Thấp | Thấp | **Cực thấp (Chỉ khai báo Interface)** |
| **Hỗ trợ Java Record** | Tốt | Kém (Record không có setter) | Kém | **Hoàn hảo (Hỗ trợ Constructor/Record)** |

---

## 2. Toàn bộ Code Sản Xuất: Cấu hình MapStruct & OpenAPI 3.0

Hãy xây dựng module Quản lý Đơn hàng & Vận chuyển (Order Fulfillment Module):

### Bước 1: Cấu hình pom.xml chuẩn xác cho MapStruct + Lombok

Một trong những lỗi phổ biến nhất là MapStruct không nhìn thấy Getter/Setter của Lombok. Cần cấu hình chính xác thứ tự <code>annotationProcessorPaths</code>:

~~~xml
<properties>
    <mapstruct.version>1.6.3</mapstruct.version>
    <lombok.version>1.18.34</lombok.version>
    <lombok-mapstruct-binding.version>0.2.0</lombok-mapstruct-binding.version>
    <springdoc.version>2.7.0</springdoc.version>
</properties>

<dependencies>
    <!-- MapStruct -->
    <dependency>
        <groupId>org.mapstruct</groupId>
        <artifactId>mapstruct</artifactId>
        <version>\${mapstruct.version}</version>
    </dependency>

    <!-- Springdoc OpenAPI UI (Swagger 3) -->
    <dependency>
        <groupId>org.springdoc</groupId>
        <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
        <version>\${springdoc.version}</version>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.13.0</version>
            <configuration>
                <source>17</source>
                <target>17</target>
                <annotationProcessorPaths>
                    <!-- 1. Lombok phải chạy trước -->
                    <path>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                        <version>\${lombok.version}</version>
                    </path>
                    <!-- 2. Cầu nối giữa Lombok và MapStruct (BẮT BUỘC) -->
                    <path>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok-mapstruct-binding</artifactId>
                        <version>\${lombok-mapstruct-binding.version}</version>
                    </path>
                    <!-- 3. MapStruct Processor chạy sau để đọc getter/setter đã sinh -->
                    <path>
                        <groupId>org.mapstruct</groupId>
                        <artifactId>mapstruct-processor</artifactId>
                        <version>\${mapstruct.version}</version>
                    </path>
                </annotationProcessorPaths>
            </configuration>
        </plugin>
    </plugins>
</build>
~~~

### Bước 2: Domain Entity & DTO Records

~~~java
package vn.mastery.order.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class OrderEntity {
    private Long id;
    private String orderCode;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private String status;
    private CustomerEntity customer;
    private List<OrderItemEntity> items;
    private Instant createdAt;
    private String internalAuditNotes; // Trường nhạy cảm, KHÔNG được lộ ra ngoài API

    // Constructors, Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrderCode() { return orderCode; }
    public void setOrderCode(String orderCode) { this.orderCode = orderCode; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public CustomerEntity getCustomer() { return customer; }
    public void setCustomer(CustomerEntity customer) { this.customer = customer; }
    public List<OrderItemEntity> getItems() { return items; }
    public void setItems(List<OrderItemEntity> items) { this.items = items; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public String getInternalAuditNotes() { return internalAuditNotes; }
    public void setInternalAuditNotes(String internalAuditNotes) { this.internalAuditNotes = internalAuditNotes; }
}
~~~

~~~java
package vn.mastery.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.List;

@Schema(description = "Thông tin chi tiết đơn hàng trả về cho Client")
public record OrderResponseDto(
    @Schema(description = "ID hệ thống của đơn hàng", example = "100293")
    Long orderId,

    @Schema(description = "Mã tham chiếu đơn hàng", example = "ORD-2026-9901")
    String orderCode,

    @Schema(description = "Tổng giá trị thanh toán đã gồm thuế", example = "550000.0")
    BigDecimal grandTotal,

    @Schema(description = "Trạng thái đơn hàng", example = "PENDING_CONFIRMATION")
    String status,

    @Schema(description = "Tên khách hàng đặt đơn", example = "Nguyễn Văn An")
    String customerName,

    @Schema(description = "Email liên hệ của khách", example = "an.nguyen@company.vn")
    String customerEmail,

    @Schema(description = "Tổng số lượng sản phẩm", example = "3")
    int totalItemCount,

    List<OrderItemDto> items,

    String createdDateFormatted
) {}
~~~

### Bước 3: MapStruct Mapper với Custom Expressions & Null Strategy

~~~java
package vn.mastery.order.mapper;

import org.mapstruct.*;
import vn.mastery.order.domain.OrderEntity;
import vn.mastery.order.domain.OrderItemEntity;
import vn.mastery.order.dto.OrderItemDto;
import vn.mastery.order.dto.OrderPatchRequest;
import vn.mastery.order.dto.OrderResponseDto;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Mapper(
    componentModel = MappingConstants.ComponentModel.SPRING,
    unmappedTargetPolicy = ReportingPolicy.ERROR, // BẬT CHẾ ĐỘ NGHIÊM NGẶT: Báo lỗi nếu sót field!
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface OrderMapper {

    DateTimeFormatter VIETNAM_DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")
        .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    @Mapping(target = "orderId", source = "id")
    @Mapping(target = "customerName", source = "customer.fullName")
    @Mapping(target = "customerEmail", source = "customer.email")
    @Mapping(target = "grandTotal", expression = "java(calculateGrandTotal(entity))")
    @Mapping(target = "totalItemCount", expression = "java(entity.getItems() != null ? entity.getItems().size() : 0)")
    @Mapping(target = "createdDateFormatted", expression = "java(entity.getCreatedAt() != null ? VIETNAM_DATE_FORMAT.format(entity.getCreatedAt()) : \"\")")
    OrderResponseDto toResponseDto(OrderEntity entity);

    List<OrderItemDto> toItemDtoList(List<OrderItemEntity> entities);

    // Cập nhật từng phần (PATCH) — Bỏ qua các field null gửi lên từ Client
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "orderCode", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "items", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "internalAuditNotes", ignore = true)
    void patchEntityFromRequest(OrderPatchRequest request, @MappingTarget OrderEntity entity);

    default BigDecimal calculateGrandTotal(OrderEntity entity) {
        if (entity == null) return BigDecimal.ZERO;
        BigDecimal subtotal = entity.getSubtotal() != null ? entity.getSubtotal() : BigDecimal.ZERO;
        BigDecimal tax = entity.getTaxAmount() != null ? entity.getTaxAmount() : BigDecimal.ZERO;
        return subtotal.add(tax);
    }
}
~~~

### Bước 4: Cấu hình OpenAPI 3.0 với Security Scheme (JWT Bearer)

~~~java
package vn.mastery.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "BearerAuth";

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Mastery Enterprise E-Commerce API")
                .description("Hệ thống RESTful API cấp doanh nghiệp. Tuân thủ chuẩn RFC 7807 ProblemDetails.")
                .version("v1.0.0")
                .contact(new Contact()
                    .name("Engineering Team")
                    .email("devops@mastery.vn")
                    .url("https://mastery.vn"))
                .license(new License().name("Apache 2.0").url("https://www.apache.org/licenses/LICENSE-2.0")))
            .servers(List.of(
                new Server().url("http://localhost:8080").description("Local Development Server"),
                new Server().url("https://api-sit.mastery.vn").description("SIT Staging Server")
            ))
            .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
            .components(new Components()
                .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                    .name(SECURITY_SCHEME_NAME)
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("Nhập Token JWT vào ô: Bearer {token}")));
    }
}
~~~

### Bước 5: Controller Gắn Tag Tài Liệu Sinh Động

~~~java
package vn.mastery.order.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.mastery.order.dto.OrderResponseDto;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Order Management", description = "Các API phục vụ vòng đời đơn hàng: Tạo, Cập nhật, Hủy và Tra cứu")
public class OrderController {

    @Operation(
        summary = "Tra cứu chi tiết đơn hàng",
        description = "Truy xuất toàn bộ thông tin đơn hàng, danh sách sản phẩm và tổng tiền thanh toán theo ID"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "200", 
            description = "Truy xuất thành công",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = OrderResponseDto.class))
        ),
        @ApiResponse(
            responseCode = "404", 
            description = "Không tìm thấy đơn hàng với ID tương ứng",
            content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class))
        ),
        @ApiResponse(
            responseCode = "401", 
            description = "Chưa xác thực hoặc JWT Token không hợp lệ"
        )
    })
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponseDto> getOrderById(
            @Parameter(description = "ID đơn hàng trong hệ thống", example = "100293")
            @PathVariable Long id) {
        // Gọi Service và trả về DTO qua Mapper
        return ResponseEntity.ok(null);
    }
}
~~~

---

## 3. Thử nghiệm & Xác thực Thực tế (Real-world Verification)

### Kiểm tra Code do MapStruct Tự động Sinh ra

Sau khi chạy lệnh:
~~~bash
mvn clean compile
~~~

Hãy mở thư mục <code>target/generated-sources/annotations/vn/mastery/order/mapper/OrderMapperImpl.java</code>:

~~~java
package vn.mastery.order.mapper;

import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import vn.mastery.order.domain.OrderEntity;
import vn.mastery.order.dto.OrderResponseDto;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-10-03T10:48:00+07:00"
)
@Component
public class OrderMapperImpl implements OrderMapper {

    @Override
    public OrderResponseDto toResponseDto(OrderEntity entity) {
        if (entity == null) {
            return null;
        }

        Long orderId = entity.getId();
        String orderCode = entity.getOrderCode();
        String status = entity.getStatus();
        
        String customerName = null;
        String customerEmail = null;
        if (entity.getCustomer() != null) {
            customerName = entity.getCustomer().getFullName();
            customerEmail = entity.getCustomer().getEmail();
        }

        List<OrderItemDto> items = toItemDtoList(entity.getItems());
        BigDecimal grandTotal = calculateGrandTotal(entity);
        int totalItemCount = entity.getItems() != null ? entity.getItems().size() : 0;
        String createdDateFormatted = entity.getCreatedAt() != null ? VIETNAM_DATE_FORMAT.format(entity.getCreatedAt()) : "";

        return new OrderResponseDto(
            orderId, orderCode, grandTotal, status, customerName, 
            customerEmail, totalItemCount, items, createdDateFormatted
        );
    }
}
~~~

Nhìn vào implementation trên: **Không có bất kỳ reflection nào!** Từng dòng code đều là truy xuất method trực tiếp, kiểm tra null an toàn tuyệt đối và khởi tạo Java Record bất biến qua Constructor chuẩn mực.

### Kiểm tra Swagger UI & OpenAPI Specification

Khởi động ứng dụng và truy cập:
- Giao diện trực quan Swagger UI: <code>http://localhost:8080/swagger-ui/index.html</code>
- OpenAPI 3.0 Raw JSON Specification: <code>http://localhost:8080/v3/api-docs</code>

Kiểm tra xem Swagger có hiển thị nút **Authorize** (để nhập Bearer JWT token) và Schema của <code>ProblemDetail</code> trong mục Models hay không.

---

## 4. Ba Cạm bẫy Chết người & Bài học Sự cố Thực tế

### Cạm bẫy 1: Quên lombok-mapstruct-binding khiến mọi thuộc tính sinh ra bị Null
Một lỗi cực kỳ kinh điển khiến các developer mất hàng giờ debug:
Khi bạn gắn <code>@Data</code> của Lombok lên class Entity/DTO, nhưng quên khai báo <code>lombok-mapstruct-binding</code> trong <code>pom.xml</code>.
Khi Maven biên dịch, MapStruct chạy song song hoặc trước Lombok, nên nó **không tìm thấy bất kỳ getter/setter nào**. MapStruct không báo lỗi mà âm thầm sinh ra hàm rỗng:
~~~java
// ❌ Hậu quả: DTO trả về Client bị null trắng toàn bộ fields!
return new OrderResponseDto(null, null, null, null, ...);
~~~
**Giải pháp**: Luôn đảm bảo <code>lombok-mapstruct-binding</code> có mặt trong danh sách <code>annotationProcessorPaths</code>.

### Cạm bẫy 2: Lỗi Đệ quy Vô tận (StackOverflowError) với Quan hệ Hai chiều trong JPA
Nếu <code>OrderEntity</code> có quan hệ <code>@OneToMany List&lt;OrderItemEntity&gt; items</code>, và mỗi <code>OrderItemEntity</code> lại có <code>@ManyToOne OrderEntity order</code>.
Khi bạn viết Mapper chuyển cả hai chiều mà không cấu hình:
MapStruct sẽ sinh mã: Chuyển Order -> duyệt Item -> chuyển Order trong Item -> duyệt Item...
Vòng lặp vô tận khiến JVM tràn Stack Memory ngay lập tức: <code>java.lang.StackOverflowError</code>!
**Khắc phục**: Luôn ngắt một chiều bằng cách cấu hình:
<code>@Mapping(target = "order", ignore = true)</code> trên phương thức chuyển đổi <code>OrderItemEntity</code>!

### Cạm bẫy 3: Đặt unmappedTargetPolicy = ReportingPolicy.IGNORE một cách cẩu thả
Nhiều developer đặt cờ:
~~~java
@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE) // ❌ NGUY HIỂM!
~~~
Khi người khác thêm một field quan trọng vào Entity (ví dụ: <code>securityDeposit</code>), nhưng quên khai báo trong DTO hoặc Mapper. MapStruct sẽ lẳng lặng bỏ qua mà không có bất kỳ cảnh báo nào. 
**Quy tắc tiêu chuẩn**: Luôn đặt <code>unmappedTargetPolicy = ReportingPolicy.ERROR</code>. Khi có bất kỳ field nào chưa được chỉ định mapping rõ ràng, quá trình Maven build sẽ bị chặn đứng ngay lập tức để developer chủ động xem xét: nên map trường này hay chủ động <code>ignore = true</code>.

---

## 5. Thử thách Thực chiến (Hands-on Challenge)

### Đề bài:
Xây dựng Module Chuyển đổi Dữ liệu Giao dịch Ngân hàng (Bank Transaction Mapper):
1. Cho Entity <code>TransactionEntity(id, txRef, amount, fee, currency, senderAccount, recipientAccount, channel, createdAt)</code>.
2. Viết Mapper chuyển sang <code>TransactionSummaryDto</code> với các yêu cầu:
   - <code>totalDeducted</code>: Bằng <code>amount</code> cộng với <code>fee</code>.
   - <code>maskedSenderAccount</code>: Che giấu số tài khoản người gửi (ví dụ: <code>1903888899</code> thành <code>1903****99</code>).
   - <code>formattedAmount</code>: Format số tiền kèm mã tiền tệ (ví dụ: <code>1,500,000 VND</code>).
   - Ngăn chặn triệt để unmapped fields với chính sách <code>ReportingPolicy.ERROR</code>.
3. Bổ sung các annotation OpenAPI 3.0 (Swagger) để mô tả rõ ràng endpoint tra cứu lịch sử giao dịch.

### Lời giải Chuẩn Kỹ sư Cấp cao:

~~~java
package vn.mastery.banking.mapper;

import org.mapstruct.*;
import vn.mastery.banking.domain.TransactionEntity;
import vn.mastery.banking.dto.TransactionSummaryDto;

import java.math.BigDecimal;
import java.text.DecimalFormat;

@Mapper(
    componentModel = MappingConstants.ComponentModel.SPRING,
    unmappedTargetPolicy = ReportingPolicy.ERROR
)
public interface TransactionMapper {

    DecimalFormat CURRENCY_FORMAT = new DecimalFormat("#,###");

    @Mapping(target = "transactionId", source = "id")
    @Mapping(target = "referenceCode", source = "txRef")
    @Mapping(target = "totalDeducted", expression = "java(calculateTotalDeducted(entity))")
    @Mapping(target = "maskedSenderAccount", expression = "java(maskAccountNumber(entity.getSenderAccount()))")
    @Mapping(target = "formattedAmount", expression = "java(formatCurrency(entity.getAmount(), entity.getCurrency()))")
    TransactionSummaryDto toSummaryDto(TransactionEntity entity);

    default BigDecimal calculateTotalDeducted(TransactionEntity entity) {
        if (entity == null) return BigDecimal.ZERO;
        BigDecimal amt = entity.getAmount() != null ? entity.getAmount() : BigDecimal.ZERO;
        BigDecimal fee = entity.getFee() != null ? entity.getFee() : BigDecimal.ZERO;
        return amt.add(fee);
    }

    default String maskAccountNumber(String accountNo) {
        if (accountNo == null || accountNo.length() < 6) return "******";
        int len = accountNo.length();
        return accountNo.substring(0, 4) + "****" + accountNo.substring(len - 2);
    }

    default String formatCurrency(BigDecimal amount, String currency) {
        if (amount == null) return "0 " + currency;
        return CURRENCY_FORMAT.format(amount) + " " + (currency != null ? currency : "VND");
    }
}
~~~

~~~java
package vn.mastery.banking.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "Bản tóm lược giao dịch chuyển tiền đã xử lý")
public record TransactionSummaryDto(
    @Schema(description = "ID nội bộ giao dịch", example = "88992")
    Long transactionId,

    @Schema(description = "Mã tham chiếu ngân hàng (FT Ref)", example = "FT262761829910")
    String referenceCode,

    @Schema(description = "Tổng số tiền bị khấu trừ (Tiền chuyển + Phí)", example = "1005500.0")
    BigDecimal totalDeducted,

    @Schema(description = "Số tài khoản nguồn đã được che giấu bảo mật", example = "1029****88")
    String maskedSenderAccount,

    @Schema(description = "Số tài khoản người thụ hưởng", example = "0987654321")
    String recipientAccount,

    @Schema(description = "Số tiền hiển thị định dạng đẹp", example = "1,000,000 VND")
    String formattedAmount,

    @Schema(description = "Kênh chuyển tiền (MOBILE, INTERNET_BANKING, ATM)", example = "MOBILE")
    String channel
) {}
~~~

:::takeaways
- **Tốc độ Tuyệt đối lúc Runtime**: MapStruct giải phóng máy chủ khỏi gánh nặng Reflection, loại bỏ nguy cơ memory leak và đạt hiệu năng tương đương 100% code tay.
- **Fail-Fast tại Compile Time**: Bật <code>unmappedTargetPolicy = ReportingPolicy.ERROR</code> để phát hiện ngay lập tức bất kỳ sự bất đồng bộ nào giữa Entity và DTO khi có thay đổi trong schema.
- **Living Documentation**: Tích hợp Springdoc OpenAPI 3.0 để tài liệu API luôn tự động phản ánh trạng thái mới nhất của mã nguồn mà không mất công duy trì thủ công.
- **Bảo mật Thông tin Nhạy cảm**: Luôn chủ động loại bỏ các trường mật khẩu, muối băm, và ghi chú kiểm toán nội bộ thông qua DTO và cấu hình ignore rõ ràng trong Mapper.
:::
`
    },
    {
      id: "2-4",
      type: "lesson",
      title: "Pagination, Sorting & Dynamic Filtering — Offset, Keyset Cursor & JPA Specification",
      minutes: 50,
      content: `
## 10 dòng dữ liệu thì dễ — 10 triệu dòng thì sao?

Khi viết ứng dụng thử nghiệm với vài chục bản ghi, bất kỳ câu lệnh <code>findAll()</code> nào cũng chạy trong vài mili-giây. Nhưng khi đưa vào môi trường sản xuất thực tế với hàng triệu giao dịch tài chính:
- Một câu query không phân trang sẽ kéo toàn bộ dữ liệu vào bộ nhớ JVM, gây tràn RAM và kích hoạt lỗi **OutOfMemoryError (OOM)** làm sập cụm container.
- Phân trang kiểu truyền thống (Offset Pagination) bị thắt cổ chai ở các trang sâu (Deep Paging): <code>OFFSET 500000</code> khiến cơ sở dữ liệu phải duyệt và vứt bỏ nửa triệu dòng, làm CPU máy chủ nhảy vọt lên 100%.
- Người dùng bị hiện tượng **Trôi dữ liệu (Data Drift)**: vừa sang trang 2 thì thấy các bản ghi cũ của trang 1 lặp lại do có dữ liệu mới chèn vào đầu bảng.

Để giải quyết triệt để các thách thức này, kỹ sư backend chuyên nghiệp cần làm chủ 3 vũ khí cốt lõi: **Offset vs Slice vs Keyset Cursor Pagination**, **JPA Criteria Specification**, và **Kỹ thuật Sort Whitelisting an toàn**.

---

## 1. Kiến trúc Phân trang: So sánh Offset vs Slice vs Keyset Cursor

Tại tầng cơ sở dữ liệu, cách engine xử lý câu truy vấn quyết định trực tiếp tới tốc độ phản hồi:

~~~text
             SO SÁNH CƠ CHẾ OFFSET VS KEYSET (CURSOR) PAGINATION
             
  [1] OFFSET PAGINATION (spring-boot default Pageable):
      SQL: SELECT * FROM transactions ORDER BY created_at DESC LIMIT 20 OFFSET 100000;
      
      • Cơ chế DB: Duyệt qua 100,020 bản ghi trên Disk/B-Tree Index
      • Vứt bỏ: 100,000 bản ghi đầu tiên
      • Trả về: 20 bản ghi cuối cùng
      • Độ phức tạp: O(N) — Càng trang sâu càng chậm theo cấp số cộng!
      • Câu lệnh phụ: Tự động chạy thêm SELECT COUNT(*) tốn kém.
      
  ─────────────────────────────────────────────────────────────────────────────
  
  [2] KEYSET / CURSOR PAGINATION (Infinite Scroll / Mobile Feed):
      SQL: SELECT * FROM transactions 
           WHERE (created_at, id) < ('2026-10-03 10:15:00', 98210) 
           ORDER BY created_at DESC, id DESC LIMIT 20;
           
      • Cơ chế DB: Nhảy thẳng đến nút B-Tree Index chứa khóa (created_at, id)
      • Lấy ngay: Đúng 20 bản ghi kế tiếp trong Index Range Scan
      • Độ phức tạp: O(log N) — Luôn chạy trong 2-5ms dù dữ liệu có 100 triệu dòng!
      • Không có câu lệnh COUNT(*), không bao giờ bị trùng lặp dữ liệu (No Data Drift).
~~~

### Bảng lựa chọn chiến lược phân trang theo nghiệp vụ

| Tiêu chí so sánh | Page<T> (Offset) | Slice<T> (Offset không Count) | Keyset Cursor (Cursor-based) |
|---|---|---|---|
| **Câu lệnh COUNT(*)** | Có (rất nặng trên bảng lớn) | **Không có** (tiết kiệm 50% CPU) | **Không có** (tối ưu nhất) |
| **Biết tổng số trang?** | Có (để vẽ thanh số trang 1, 2, 3...) | Không (chỉ biết "Còn trang sau hay không") | Không (chỉ có nút "Xem thêm") |
| **Tốc độ ở trang sâu** | Cực chậm (O(N)) | Vẫn chậm do OFFSET lớn | **Cực nhanh (O(log N) bất biến)** |
| **Hiện tượng trôi dữ liệu** | Có bị ảnh hưởng | Có bị ảnh hưởng | **Tuyệt đối không bị trôi dữ liệu** |
| **Kịch bản phù hợp** | Bảng quản trị Admin Web ít dữ liệu | Mobile feed cần phân trang đơn giản | **Hệ thống lớn, Mobile Infinite Scroll, E-Commerce** |

---

## 2. Toàn bộ Code Sản Xuất: Banking Transaction Search Engine

Hãy xây dựng một công cụ tìm kiếm và lọc giao dịch ngân hàng hỗ trợ: Lọc động đa tiêu chí, bảo vệ Sort Whitelist, và cung cấp cả hai chế độ phân trang (Offset cho Admin và Keyset cho Mobile).

### Bước 1: DTO Criteria & Dynamic Specification Builder

~~~java
package vn.mastery.transaction.dto;

import org.springframework.format.annotation.DateTimeFormat;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record TransactionFilterCriteria(
    String accountNo,
    BigDecimal minAmount,
    BigDecimal maxAmount,
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    LocalDate fromDate,
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    LocalDate toDate,
    List<String> statuses,
    String channel
) {}
~~~

~~~java
package vn.mastery.transaction.repository;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import vn.mastery.transaction.domain.Transaction;
import vn.mastery.transaction.dto.TransactionFilterCriteria;

import java.util.ArrayList;
import java.util.List;

public final class TransactionSpecifications {

    private TransactionSpecifications() {}

    public static Specification<Transaction> withCriteria(TransactionFilterCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Lọc theo số tài khoản (Exact Match)
            if (criteria.accountNo() != null && !criteria.accountNo().isBlank()) {
                predicates.add(cb.or(
                    cb.equal(root.get("senderAccount"), criteria.accountNo()),
                    cb.equal(root.get("recipientAccount"), criteria.accountNo())
                ));
            }

            // 2. Lọc theo khoảng số tiền (Amount Range)
            if (criteria.minAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("amount"), criteria.minAmount()));
            }
            if (criteria.maxAmount() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("amount"), criteria.maxAmount()));
            }

            // 3. Lọc theo khoảng thời gian (Date Range)
            if (criteria.fromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("transactionDate"), criteria.fromDate().atStartOfDay()));
            }
            if (criteria.toDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("transactionDate"), criteria.toDate().atTime(23, 59, 59)));
            }

            // 4. Lọc theo danh sách trạng thái (IN clause)
            if (criteria.statuses() != null && !criteria.statuses().isEmpty()) {
                predicates.add(root.get("status").in(criteria.statuses()));
            }

            // 5. Lọc theo kênh giao dịch
            if (criteria.channel() != null && !criteria.channel().isBlank()) {
                predicates.add(cb.equal(root.get("channel"), criteria.channel()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
~~~

### Bước 2: Spring Data JPA Repository với Specification Support

~~~java
package vn.mastery.transaction.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.mastery.transaction.domain.Transaction;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {

    // 1. Phân trang Slice (Không tốn câu lệnh COUNT(*))
    Slice<Transaction> findSliceBySenderAccount(String senderAccount, Pageable pageable);

    // 2. Keyset (Cursor-based) Query: Lấy 20 dòng kế tiếp dựa trên Index Composite (transactionDate, id)
    @Query("""
        SELECT t FROM Transaction t
        WHERE t.senderAccount = :accountNo
          AND (t.transactionDate < :cursorDate OR (t.transactionDate = :cursorDate AND t.id < :cursorId))
        ORDER BY t.transactionDate DESC, t.id DESC
    """)
    List<Transaction> findNextCursorPage(
        @Param("accountNo") String accountNo,
        @Param("cursorDate") LocalDateTime cursorDate,
        @Param("cursorId") Long cursorId,
        Pageable pageable
    );
}
~~~

### Bước 3: Sort Whitelisting & Service Layer An toàn

Một lỗ hổng bảo mật nghiêm trọng là khi Client tự do truyền tham số <code>?sort=passwordHash</code> hoặc các trường nhạy cảm khiến Database bị leak hoặc sập lỗi. Ta xây dựng Validator kiểm tra Whitelist:

~~~java
package vn.mastery.transaction.service;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.transaction.domain.Transaction;
import vn.mastery.transaction.dto.CursorPageResponse;
import vn.mastery.transaction.dto.TransactionFilterCriteria;
import vn.mastery.transaction.dto.TransactionResponseDto;
import vn.mastery.transaction.repository.TransactionRepository;
import vn.mastery.transaction.repository.TransactionSpecifications;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class TransactionSearchService {

    // Danh sách whitelist các trường cho phép sắp xếp
    private static final Set<String> ALLOWED_SORT_PROPERTIES = Set.of(
        "id", "amount", "transactionDate", "status", "fee"
    );

    private final TransactionRepository repository;

    public TransactionSearchService(TransactionRepository repository) {
        this.repository = repository;
    }

    // 1. Tìm kiếm phân trang Offset (Dành cho Admin Dashboard)
    public Page<TransactionResponseDto> searchTransactions(TransactionFilterCriteria criteria, Pageable pageable) {
        validateSortProperties(pageable.getSort());

        Page<Transaction> page = repository.findAll(
            TransactionSpecifications.withCriteria(criteria),
            pageable
        );
        return page.map(this::toDto);
    }

    // 2. Phân trang Keyset Cursor (Dành cho Mobile App)
    public CursorPageResponse<TransactionResponseDto> getTransactionsByCursor(
            String accountNo, String rawCursor, int limit) {
        
        LocalDateTime cursorDate = LocalDateTime.now();
        Long cursorId = Long.MAX_VALUE;

        if (rawCursor != null && !rawCursor.isBlank()) {
            String decoded = new String(Base64.getUrlDecoder().decode(rawCursor), StandardCharsets.UTF_8);
            String[] parts = decoded.split("#");
            cursorDate = LocalDateTime.parse(parts[0]);
            cursorId = Long.parseLong(parts[1]);
        }

        Pageable pageRequest = PageRequest.of(0, limit);
        List<Transaction> items = repository.findNextCursorPage(accountNo, cursorDate, cursorId, pageRequest);

        String nextCursor = null;
        if (!items.isEmpty()) {
            Transaction lastItem = items.get(items.size() - 1);
            String token = lastItem.getTransactionDate().toString() + "#" + lastItem.getId();
            nextCursor = Base64.getUrlEncoder().withoutPadding().encodeToString(token.getBytes(StandardCharsets.UTF_8));
        }

        List<TransactionResponseDto> dtos = items.stream().map(this::toDto).toList();
        return new CursorPageResponse<>(dtos, nextCursor, nextCursor != null);
    }

    private void validateSortProperties(Sort sort) {
        for (Sort.Order order : sort) {
            if (!ALLOWED_SORT_PROPERTIES.contains(order.getProperty())) {
                throw new IllegalArgumentException("Thuộc tính sắp xếp không được phép: " + order.getProperty());
            }
        }
    }

    private TransactionResponseDto toDto(Transaction t) {
        return new TransactionResponseDto(
            t.getId(), t.getSenderAccount(), t.getRecipientAccount(),
            t.getAmount(), t.getFee(), t.getStatus(), t.getTransactionDate()
        );
    }
}
~~~

### Bước 4: Controller Cung cấp Cả 2 Phương thức Phân trang

~~~java
package vn.mastery.transaction.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.mastery.transaction.dto.CursorPageResponse;
import vn.mastery.transaction.dto.TransactionFilterCriteria;
import vn.mastery.transaction.dto.TransactionResponseDto;
import vn.mastery.transaction.service.TransactionSearchService;

@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionSearchService searchService;

    public TransactionController(TransactionSearchService searchService) {
        this.searchService = searchService;
    }

    // Chế độ 1: Offset Pagination cho Web Portal
    @GetMapping
    public ResponseEntity<Page<TransactionResponseDto>> searchTransactions(
            TransactionFilterCriteria criteria,
            @PageableDefault(size = 20, sort = "transactionDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(searchService.searchTransactions(criteria, pageable));
    }

    // Chế độ 2: Keyset Cursor Pagination cho Mobile Feed
    @GetMapping("/cursor")
    public ResponseEntity<CursorPageResponse<TransactionResponseDto>> getCursorTransactions(
            @RequestParam String accountNo,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(searchService.getTransactionsByCursor(accountNo, cursor, Math.min(limit, 50)));
    }
}
~~~

---

## 3. Thử nghiệm & Xác thực Thực tế (Real-world Verification)

### Kịch bản 1: Gọi Offset Pagination với Dynamic Criteria & Whitelist Sort

~~~bash
curl -X GET "http://localhost:8080/api/v1/transactions?accountNo=1903882910&minAmount=500000&statuses=SUCCESS,PENDING&page=0&size=10&sort=amount,desc"
~~~

Response trả về đối tượng <code>Page</code> chuẩn của Spring Data:

~~~json
{
  "content": [
    {
      "id": 10928,
      "senderAccount": "1903882910",
      "recipientAccount": "0987654321",
      "amount": 25000000.0,
      "fee": 5500.0,
      "status": "SUCCESS",
      "transactionDate": "2026-10-03T09:30:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "sort": {
      "sorted": true,
      "unsorted": false,
      "empty": false
    },
    "offset": 0,
    "paged": true
  },
  "totalElements": 48,
  "totalPages": 5,
  "last": false,
  "size": 10,
  "number": 0,
  "first": true,
  "numberOfElements": 1,
  "empty": false
}
~~~

### Kịch bản 2: Gọi Keyset Cursor Pagination cho Mobile App

Lần gọi đầu tiên (không truyền cursor):

~~~bash
curl -X GET "http://localhost:8080/api/v1/transactions/cursor?accountNo=1903882910&limit=2"
~~~

Phản hồi trả về kèm <code>nextCursor</code> đã được Base64 mã hóa:

~~~json
{
  "items": [
    {
      "id": 2049,
      "senderAccount": "1903882910",
      "amount": 1000000.0,
      "transactionDate": "2026-10-03T10:15:00"
    },
    {
      "id": 2048,
      "senderAccount": "1903882910",
      "amount": 500000.0,
      "transactionDate": "2026-10-03T09:40:00"
    }
  ],
  "nextCursor": "MjAyNi0xMC0wM1QwOTo0MDowMCMyMDQ4",
  "hasMore": true
}
~~~

Mobile App khi người dùng cuộn đến đáy màn hình, chỉ việc lấy <code>nextCursor</code> truyền vào request kế tiếp:

~~~bash
curl -X GET "http://localhost:8080/api/v1/transactions/cursor?accountNo=1903882910&limit=2&cursor=MjAyNi0xMC0wM1QwOTo0MDowMCMyMDQ4"
~~~

Câu SQL chạy trực tiếp trên B-Tree Index: **Thời gian thực thi chỉ mất 1.8ms!**

---

## 4. Ba Cạm bẫy Chết người & Bài học Sự cố Thực tế

### Cạm bẫy 1: Sự cố "Deep Paging" làm tê liệt Database
**Hiện tượng**: Một con bot tự động cào dữ liệu chạy vòng lặp từ trang 1 đến trang 50,000 với URL: 
<code>GET /api/v1/transactions?page=50000&size=20</code>.
**Hậu quả**: Database phải xử lý: <code>OFFSET 1000000 LIMIT 20</code>. Để trả về 20 dòng này, PostgreSQL/MySQL phải đọc **1,000,020 bản ghi** từ ổ đĩa lên bộ nhớ đệm Buffer Pool rồi loại bỏ. Khi có 10 request như vậy chạy đồng thời, I/O ổ đĩa đạt 100%, hàng đợi kết nối bị nghẽn (Connection Timeout), kéo sập toàn bộ hệ thống!
**Giải pháp**: 
1. Giới hạn trần trang tối đa cho Offset: nếu <code>page > 100</code> thì chặn lại và yêu cầu người dùng thu hẹp bộ lọc thời gian.
2. Với các bảng dữ liệu khổng lồ, bắt buộc chuyển sang dùng **Keyset Cursor Pagination**.

### Cạm bẫy 2: Sort Parameter Injection làm lộ cấu trúc hệ thống
Nếu không có Sort Whitelist, hacker có thể gửi:
<code>GET /api/v1/users?sort=passwordHash,asc</code>.
Dựa vào thứ tự bản ghi trả về, kẻ tấn công có thể suy đoán độ dài hoặc ký tự đầu tiên của hash mật khẩu (Timing/Ordering Oracle Attack).
Ngoài ra, nếu client gửi một field không hề tồn tại trong Entity: <code>?sort=nonExistentField</code>, Hibernate sẽ ném ra <code>PropertyReferenceException</code> làm sập request với mã HTTP 500 nếu không được xử lý cẩn thận.

### Cạm bẫy 3: Data Drift (Lệch dữ liệu khi phân trang bằng Offset)
Hãy tưởng tượng kịch bản:
1. Người dùng đang ở Trang 1 (gồm 10 giao dịch mới nhất từ ID 100 đến ID 91).
2. Đúng lúc đó, có 3 giao dịch mới tinh (ID 103, 102, 101) được chèn vào database.
3. Người dùng bấm chuyển sang Trang 2 (Database thực thi: <code>LIMIT 10 OFFSET 10</code>).
4. Lúc này, vị trí thứ 11 đến 20 của bảng lại chính là các bản ghi ID 93, 92, 91! Người dùng thấy giao dịch ID 93, 92, 91 xuất hiện lại lần thứ hai!
**Keyset Pagination loại bỏ hoàn toàn vấn đề này** vì nó dùng giá trị cột mốc (Anchor Point) cố định của bản ghi cuối cùng chứ không đếm số lượng dòng nhảy qua.

---

## 5. Thử thách Thực chiến (Hands-on Challenge)

### Đề bài:
Xây dựng Module Tìm kiếm Sản phẩm Thương mại Điện tử (Product Catalog Filter):
1. Cho Entity <code>Product(id, name, sku, category, price, stockQuantity, status, createdAt)</code>.
2. Viết <code>ProductSpecification</code> hỗ trợ:
   - Tìm kiếm theo từ khóa <code>name</code> (tìm tương đối không phân biệt hoa thường bằng <code>cb.like(cb.lower(...), "%keyword%")</code>).
   - Lọc theo <code>category</code> nếu có.
   - Lọc theo khoảng giá <code>minPrice</code> và <code>maxPrice</code>.
   - Chỉ lấy các sản phẩm có <code>stockQuantity > 0</code> và <code>status = 'ACTIVE'</code>.
3. Trả về kết quả dưới dạng <code>Slice&lt;ProductResponseDto&gt;</code> để tối ưu không gọi câu lệnh <code>COUNT(*)</code> vô ích, đồng thời kiểm tra Whitelist cho các trường sắp xếp (<code>price</code>, <code>createdAt</code>, <code>name</code>).

### Lời giải Chuẩn Kỹ sư Cấp cao:

~~~java
package vn.mastery.product.repository;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import vn.mastery.product.domain.Product;
import vn.mastery.product.dto.ProductFilterCriteria;

import java.util.ArrayList;
import java.util.List;

public final class ProductSpecifications {

    private ProductSpecifications() {}

    public static Specification<Product> buildSearchSpec(ProductFilterCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Mặc định chỉ lấy sản phẩm ACTIVE và CÒN HÀNG
            predicates.add(cb.equal(root.get("status"), "ACTIVE"));
            predicates.add(cb.greaterThan(root.get("stockQuantity"), 0));

            // 2. Tìm kiếm từ khóa theo tên (Case-insensitive LIKE)
            if (criteria.keyword() != null && !criteria.keyword().isBlank()) {
                String pattern = "%" + criteria.keyword().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("name")), pattern));
            }

            // 3. Lọc theo danh mục
            if (criteria.category() != null && !criteria.category().isBlank()) {
                predicates.add(cb.equal(root.get("category"), criteria.category()));
            }

            // 4. Khoảng giá
            if (criteria.minPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), criteria.minPrice()));
            }
            if (criteria.maxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), criteria.maxPrice()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
~~~

~~~java
package vn.mastery.product.service;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.product.domain.Product;
import vn.mastery.product.dto.ProductFilterCriteria;
import vn.mastery.product.dto.ProductResponseDto;
import vn.mastery.product.repository.ProductRepository;
import vn.mastery.product.repository.ProductSpecifications;

import java.util.Set;

@Service
@Transactional(readOnly = true)
public class ProductCatalogService {

    private static final Set<String> VALID_SORT_FIELDS = Set.of("price", "createdAt", "name");
    private final ProductRepository productRepository;

    public ProductCatalogService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Slice<ProductResponseDto> getCatalogSlice(ProductFilterCriteria criteria, Pageable pageable) {
        // Kiểm tra whitelist các trường sắp xếp
        for (Sort.Order order : pageable.getSort()) {
            if (!VALID_SORT_FIELDS.contains(order.getProperty())) {
                throw new IllegalArgumentException("Trường sắp xếp không hợp lệ: " + order.getProperty());
            }
        }

        // Thực thi Slice query: Không chạy COUNT(*), chỉ truy vấn LIMIT size + 1
        Slice<Product> slice = productRepository.findAll(
            ProductSpecifications.buildSearchSpec(criteria),
            pageable
        );

        return slice.map(p -> new ProductResponseDto(
            p.getId(), p.getName(), p.getSku(), p.getCategory(), p.getPrice(), p.getStockQuantity()
        ));
    }
}
~~~

:::takeaways
- **Cái giá của COUNT(*)**: Trả về <code>Page&lt;T&gt;</code> luôn kéo theo một câu lệnh <code>SELECT COUNT(*)</code> rất nặng nề trên bảng lớn. Nếu chỉ làm Mobile Feed hoặc Infinite Scroll, hãy chuyển sang dùng <code>Slice&lt;T&gt;</code> hoặc Keyset Cursor.
- **Tử huyệt Deep Offset**: Offset hàng chục nghìn dòng làm nghẽn Disk I/O của Database. Với dữ liệu lớn, Keyset Pagination (WHERE anchor_column &lt; cursor) là giải pháp O(log N) duy nhất đạt chuẩn hiệu năng cao.
- **JPA Criteria Specification**: Cho phép ghép nối các điều kiện lọc linh hoạt, type-safe lúc biên dịch và tự động loại bỏ các predicate null.
- **Bảo mật Sort Whitelist**: Luôn kiểm tra danh sách whitelist các trường cho phép sắp xếp trước khi truyền vào database để ngăn ngừa tấn công thăm dò dữ liệu.
:::
`
    },
    {
      id: "2-5",
      type: "lesson",
      title: "File Upload, Multipart & S3 Presigned URL — Streaming & Async Jobs",
      minutes: 50,
      content: `
## Tải tệp lớn và xử lý báo cáo nặng: Hai kịch bản đánh sập máy chủ

Trong hầu hết các hệ thống doanh nghiệp, chức năng import file Excel/CSV hàng trăm nghìn dòng hoặc xuất báo cáo tài chính định kỳ là nơi phát sinh nhiều sự cố Out-Of-Memory và gián đoạn dịch vụ nhất:
- Lập trình viên gọi <code>file.getBytes()</code> để đọc file vào bộ nhớ. Khi có 20 người dùng đồng thời tải lên file 100MB, 2GB RAM Heap biến mất ngay lập tức, kích hoạt Full GC kéo dài và làm sập pod.
- Đọc và xử lý file 100,000 dòng trong một HTTP request đồng bộ (Synchronous). Request chạy quá 60 giây khiến Nginx Ingress / Load Balancer ngắt kết nối với lỗi **504 Gateway Timeout**, để lại database trong trạng thái khóa dữ liệu dở dang.
- Máy chủ backend phải gánh toàn bộ băng thông mạng (Network I/O) khi đóng vai trò "người vận chuyển trung gian" giữa Client và Cloud Storage.

Bài học này sẽ hướng dẫn bạn giải quyết triệt để bài toán tải tệp lớn thông qua: **Kiến trúc S3 Presigned URL (Zero-Bandwidth Backend)**, **Mô hình Async Job chuẩn REST (202 Accepted + Polling)**, và **Kỹ thuật Streaming Batch Processing**.

---

## 1. Kiến trúc Tải Tệp: So sánh Direct Upload vs S3 Presigned URL

~~~text
             SO SÁNH HAI KIẾN TRÚC TẢI TỆP LÊN HỆ THỐNG
             
  [MÔ HÌNH 1: TRUYỀN THỐNG — SERVER LÀM TRUNG GIAN (MULTIPART)]
  
  [Client] ──(Tải file 500MB)──► [Spring Boot Server] ──(Upload 500MB)──► [Storage / S3]
  
  • Hạn chế nghiêm trọng:
    - Máy chủ tốn 1000MB băng thông mạng cho 1 file (In + Out)!
    - Chiếm giữ Thread Tomcat trong suốt thời gian truyền dữ liệu (vài phút).
    - Dễ gây tràn đĩa cứng tại thư mục tạm /tmp của container.
    
  ─────────────────────────────────────────────────────────────────────────────
  
  [MÔ HÌNH 2: HIỆN ĐẠI — S3 PRESIGNED URL (ZERO BACKEND BANDWIDTH)]
  
  1. [Client] ──(POST /files/presign: metadata)──► [Spring Boot Server]
                                                            │
  2. [Client] ◄──(Trả về S3 Presigned PUT URL)─────────────┘ (Xác thực quyền, sinh chữ ký HMAC)
        │
        ▼ (Client upload THẲNG lên Cloud)
  3. [Client] ═════════(PUT 500MB trực tiếp lên AWS S3)═════════► [AWS S3 / MinIO]
        │
        ▼
  4. [Client] ──(POST /files/complete)───────────► [Spring Boot Server]
                                                            │ (Bắt đầu đọc stream xử lý Async)
                                                            ▼
                                                   [Worker Thread Pool]
~~~

### Ưu điểm vượt trội của Presigned URL:
- **0 Byte Băng thông Trung chuyển**: Dữ liệu tệp bay thẳng từ trình duyệt/mobile của khách hàng lên AWS S3 / Cloudflare R2 / Google Cloud Storage. Máy chủ backend không tốn 1 byte RAM hay Network nào cho việc vận chuyển.
- **Bảo mật Tuyệt đối**: Presigned URL được ký bằng thuật toán HMAC-SHA256 với thời gian sống ngắn (ví dụ: 15 phút) và giới hạn đúng Content-Type, dung lượng tối đa.
- **Khả năng Mở rộng Vô hạn (Infinite Scale)**: 10,000 khách hàng upload cùng lúc không làm tăng tải CPU của Backend.

---

## 2. Toàn bộ Code Sản Xuất: S3 Presigned URL & Async Import Job

Hãy xây dựng module Import Dữ liệu Giao dịch Tài chính (Financial Import Module):

### Bước 1: DTO Request & Response Bất biến

~~~java
package vn.mastery.file.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.net.URL;

public final class FileUploadDto {

    public record PresignedUrlRequest(
        @NotBlank(message = "Tên tệp không được để trống")
        String fileName,

        @NotBlank(message = "Content-Type không được để trống")
        String contentType,

        @Positive(message = "Kích thước tệp phải lớn hơn 0")
        long fileSizeByte
    ) {}

    public record PresignedUrlResponse(
        String fileKey,
        URL uploadUrl,
        long expiresInSeconds
    ) {}

    public record CompleteUploadRequest(
        @NotBlank String fileKey,
        @NotBlank String originalFileName
    ) {}

    public record JobStatusResponse(
        String jobId,
        String status, // PENDING, PROCESSING, COMPLETED, FAILED
        int progressPercentage,
        long totalRecords,
        long successRecords,
        long failedRecords,
        String errorReportUrl,
        String createdAt
    ) {}
}
~~~

### Bước 2: Cấu hình Thread Pool Chuyên Biệt cho Xử lý Tệp Nặng

Một nguyên tắc vàng trong kiến trúc Microservices: **Không bao giờ dùng chung Thread Pool của Web Server (Tomcat) hoặc Pool Async mặc định cho các tác vụ I/O nặng!**

~~~java
package vn.mastery.file.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
@EnableAsync
public class AsyncFileProcessingConfig {

    @Bean("fileImportExecutor")
    public Executor fileImportExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2); // Giới hạn số job chạy song song để bảo vệ CPU/RAM DB
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(50); // Hàng đợi chờ
        executor.setThreadNamePrefix("file-worker-");
        
        // CỰC KỲ QUAN TRỌNG: Khi hàng đợi 50 job bị đầy, ném ngoại lệ từ chối (AbortPolicy)
        // để API trả về 503 Service Unavailable thay vì dùng CallerRunsPolicy làm đơ Tomcat!
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.AbortPolicy());
        
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        executor.initialize();
        return executor;
    }
}
~~~

### Bước 3: Service Sinh Presigned URL & Xử lý Streaming Async

~~~java
package vn.mastery.file.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import vn.mastery.file.dto.FileUploadDto.*;

import java.net.MalformedURLException;
import java.net.URL;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FileImportService {
    private static final Logger log = LoggerFactory.getLogger(FileImportService.class);

    // Lưu trữ metadata trạng thái Job (Thực tế sẽ lưu trong Redis hoặc bảng Database)
    private final Map<String, JobStatusResponse> jobDatabase = new ConcurrentHashMap<>();

    // 1. Sinh Presigned URL cho Client
    public PresignedUrlResponse generatePresignedUploadUrl(PresignedUrlRequest request) {
        String extension = request.fileName().substring(request.fileName().lastIndexOf("."));
        String fileKey = "raw-imports/" + UUID.randomUUID() + extension;

        // Giả lập sinh URL S3 Presigned PUT có hạn trong 15 phút (900 giây)
        URL fakeS3Url;
        try {
            fakeS3Url = new URL("https://mastery-storage.s3.ap-southeast-1.amazonaws.com/" + fileKey + "?X-Amz-Signature=fakeSignatureToken");
        } catch (MalformedURLException e) {
            throw new RuntimeException("Lỗi sinh URL S3", e);
        }

        log.info("Sinh Presigned URL thành công cho tệp: {} -> FileKey: {}", request.fileName(), fileKey);
        return new PresignedUrlResponse(fileKey, fakeS3Url, 900);
    }

    // 2. Tiếp nhận thông báo hoàn tất & Tạo Job PENDING
    public String registerImportJob(CompleteUploadRequest request) {
        String jobId = "JOB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        JobStatusResponse initialStatus = new JobStatusResponse(
            jobId, "PENDING", 0, 0, 0, 0, null, Instant.now().toString()
        );
        jobDatabase.put(jobId, initialStatus);
        return jobId;
    }

    // 3. Xử lý Streaming Bất đồng bộ trong Pool riêng
    @Async("fileImportExecutor")
    public void executeImportAsync(String jobId, String fileKey) {
        log.info("[WORKER-START] Bắt đầu đọc stream tệp từ Cloud: {} cho Job: {}", fileKey, jobId);
        updateJobProgress(jobId, "PROCESSING", 10, 0, 0, 0);

        try {
            // Giả lập đọc Streaming từng Batch 500 dòng (Không load hết vào bộ nhớ!)
            for (int progress = 20; progress <= 100; progress += 20) {
                Thread.sleep(1000); // Giả lập parse CSV và ghi DB batch
                updateJobProgress(jobId, "PROCESSING", progress, progress * 100L, progress * 98L, progress * 2L);
            }

            updateJobProgress(jobId, "COMPLETED", 100, 10000, 9950, 50);
            log.info("[WORKER-SUCCESS] Hoàn tất Job import: {}", jobId);

        } catch (Exception ex) {
            log.error("[WORKER-FAILED] Lỗi xử lý Job: {}", jobId, ex);
            updateJobProgress(jobId, "FAILED", 0, 0, 0, 0);
        }
    }

    public JobStatusResponse getJobStatus(String jobId) {
        JobStatusResponse status = jobDatabase.get(jobId);
        if (status == null) {
            throw new IllegalArgumentException("Không tìm thấy Job với ID: " + jobId);
        }
        return status;
    }

    private void updateJobProgress(String jobId, String state, int percent, long total, long success, long failed) {
        JobStatusResponse current = jobDatabase.get(jobId);
        if (current != null) {
            jobDatabase.put(jobId, new JobStatusResponse(
                jobId, state, percent, total, success, failed, 
                failed > 0 ? "https://storage.mastery.vn/errors/" + jobId + ".csv" : null,
                current.createdAt()
            ));
        }
    }
}
~~~

### Bước 4: REST Controller Tuân thủ Nghiêm ngặt HTTP 202 Accepted

~~~java
package vn.mastery.file.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import vn.mastery.file.dto.FileUploadDto.*;
import vn.mastery.file.service.FileImportService;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/files")
public class FileImportController {

    private final FileImportService fileImportService;

    public FileImportController(FileImportService fileImportService) {
        this.fileImportService = fileImportService;
    }

    // 1. Bước 1: Client xin Presigned URL
    @PostMapping("/presigned-upload")
    public ResponseEntity<PresignedUrlResponse> getPresignedUrl(@Valid @RequestBody PresignedUrlRequest request) {
        return ResponseEntity.ok(fileImportService.generatePresignedUploadUrl(request));
    }

    // 2. Bước 2: Client upload thẳng lên S3 xong, gửi thông báo hoàn tất
    // Chuẩn REST: Trả về HTTP 202 ACCEPTED kèm Header Location trỏ đến URI của Job!
    @PostMapping("/complete")
    public ResponseEntity<Void> completeUpload(@Valid @RequestBody CompleteUploadRequest request) {
        String jobId = fileImportService.registerImportJob(request);

        // Kích hoạt worker bất đồng bộ
        fileImportService.executeImportAsync(jobId, request.fileKey());

        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
            .path("/api/v1/files/jobs/{jobId}")
            .buildAndExpand(jobId)
            .toUri();

        return ResponseEntity.accepted().location(location).build();
    }

    // 3. Bước 3: Client Polling tiến độ xử lý
    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<JobStatusResponse> getJobStatus(@PathVariable String jobId) {
        return ResponseEntity.ok(fileImportService.getJobStatus(jobId));
    }
}
~~~

---

## 3. Thử nghiệm & Xác thực Thực tế (Real-world Verification)

### Kịch bản 1: Xin Presigned URL từ Máy chủ Backend

~~~bash
curl -i -X POST http://localhost:8080/api/v1/files/presigned-upload \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "transactions_2026_q3.csv",
    "contentType": "text/csv",
    "fileSizeByte": 104857600
  }'
~~~

Server trả về URL trực tiếp của AWS S3 kèm chữ ký:

~~~json
{
  "fileKey": "raw-imports/789a-4c22-b011.csv",
  "uploadUrl": "https://mastery-storage.s3.ap-southeast-1.amazonaws.com/raw-imports/789a-4c22-b011.csv?X-Amz-Signature=fakeSignatureToken",
  "expiresInSeconds": 900
}
~~~

### Kịch bản 2: Client Upload Trực tiếp lên S3 (Không Chạm Backend)

~~~bash
curl -i -X PUT "https://mastery-storage.s3.ap-southeast-1.amazonaws.com/raw-imports/789a-4c22-b011.csv?X-Amz-Signature=fakeSignatureToken" \
  -H "Content-Type: text/csv" \
  --data-binary @transactions_2026_q3.csv
# Trả về: HTTP 200 OK từ AWS S3 Storage
~~~

### Kịch bản 3: Thông báo Hoàn tất và Nhận HTTP 202 Accepted

~~~bash
curl -i -X POST http://localhost:8080/api/v1/files/complete \
  -H "Content-Type: application/json" \
  -d '{
    "fileKey": "raw-imports/789a-4c22-b011.csv",
    "originalFileName": "transactions_2026_q3.csv"
  }'
~~~

Phản hồi từ Spring Boot:

~~~text
HTTP/1.1 202 Accepted
Location: http://localhost:8080/api/v1/files/jobs/JOB-9A18DF02
Content-Length: 0
~~~

### Kịch bản 4: Polling Tiến độ Xử lý Của Job

~~~bash
curl -X GET http://localhost:8080/api/v1/files/jobs/JOB-9A18DF02
~~~

~~~json
{
  "jobId": "JOB-9A18DF02",
  "status": "PROCESSING",
  "progressPercentage": 60,
  "totalRecords": 6000,
  "successRecords": 5880,
  "failedRecords": 120,
  "errorReportUrl": "https://storage.mastery.vn/errors/JOB-9A18DF02.csv",
  "createdAt": "2026-10-03T10:50:00.120Z"
}
~~~

Giao diện Web/App có thể hiển thị thanh tiến trình (Progress Bar) chạy mượt mà từ 0% đến 100%, không bị treo kết nối mạng!

---

## 4. Ba Cạm bẫy Chết người & Bài học Sự cố Thực tế

### Cạm bẫy 1: Nạp toàn bộ tệp vào RAM với file.getBytes()
Một sai lầm rất phổ biến của lập trình viên junior:
~~~java
// ❌ CỰC KỲ NGUY HIỂM:
byte[] data = multipartFile.getBytes(); // Cấp phát 100MB liên tục trên JVM Heap!
~~~
Khi nạp một mảng byte lớn vào bộ nhớ, JVM buộc phải tìm một vùng nhớ liên tục (Contiguous memory) trong Old Generation. Điều này dẫn đến phân mảnh bộ nhớ và kích hoạt **Full GC Stop-the-world**. Trong thời gian Full GC (có thể mất 5 - 10 giây), toàn bộ các request khác của hệ thống đều bị đông cứng!
**Quy tắc**: Luôn sử dụng Stream (<code>multipartFile.getInputStream()</code>) kết hợp với <code>BufferedReader</code> để đọc từng dòng hoặc từng khối (Chunk 8KB).

### Cạm bẫy 2: Dùng CallerRunsPolicy cho tác vụ xử lý tệp nặng
Khi cấu hình ThreadPool cho Async Job:
~~~java
executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy()); // ❌ THẢM HỌA!
~~~
Ý nghĩa của <code>CallerRunsPolicy</code> là: Khi hàng đợi đầy, **chính thread gọi hàm sẽ phải tự chạy tác vụ đó**.
Mà thread gọi hàm ở đây chính là **Luồng Request của Tomcat** (ví dụ: <code>http-nio-8080-exec-5</code>)!
Kết quả: Luồng Tomcat bị bắt ép phải chạy job import tệp trong 5 phút. Khi có 20 job bị tràn hàng đợi, toàn bộ 20 luồng của Tomcat bị chiếm sạch, máy chủ không thể tiếp nhận thêm bất kỳ request nào khác kể cả <code>GET /actuator/health</code>, dẫn đến Kubernetes nhận định Pod đã chết và kill pod liên tục!

### Cạm bẫy 3: Mở một Transaction duy nhất kéo dài 5 phút cho 1 triệu dòng
~~~java
@Transactional // ❌ NGUY HIỂM: Transaction sống quá lâu!
public void importOneMillionRows(InputStream stream) {
    // Đọc 1 triệu dòng và saveAll()
}
~~~
Hậu quả:
1. Kết nối Database (Connection) bị giữ chặt trong suốt 5 phút, làm cạn kiệt Connection Pool (HikariCP exhaustion).
2. Bảng dữ liệu bị giữ khóa (Row Lock/Table Lock) ngăn cản các transaction thanh toán khác của khách hàng.
3. Không gian Undo Log / WAL của database phình to khủng khiếp.
**Giải pháp chuẩn**: Chia nhỏ thành các Batch độc lập (ví dụ: mỗi batch 500 dòng). Mỗi batch commit một transaction riêng biệt. Nếu job bị crash giữa chừng ở dòng thứ 50,000, ta có thể lưu checkpoint và resume lại mà không phải chạy lại từ đầu!

---

## 5. Thử thách Thực chiến (Hands-on Challenge)

### Đề bài:
Xây dựng Module Import Bảng lương Doanh nghiệp (Payroll Import Subsystem):
1. Endpoint <code>POST /api/v1/payroll/presign</code>:
   - Kiểm tra định dạng tệp: bắt buộc phải là <code>.csv</code> hoặc <code>.xlsx</code>.
   - Sinh Presigned URL cho phép tải lên thư mục an toàn <code>payrolls/tenant-{id}/</code>.
2. Endpoint <code>POST /api/v1/payroll/process</code>:
   - Nhận <code>fileKey</code>, tạo Job xử lý ngầm và trả về <code>202 Accepted</code> kèm Header <code>Location</code>.
3. Cơ chế Xử lý Lỗi Từng phần (Partial Failure Resiliency):
   - Đọc stream file theo từng batch 200 dòng.
   - Nếu một dòng bị lỗi (ví dụ: lương là số âm hoặc sai định dạng tài khoản ngân hàng), không được làm hỏng toàn bộ file! 
   - Ghi nhận dòng lỗi đó vào danh sách <code>invalidRows</code> và tiếp tục import các dòng hợp lệ còn lại.
   - Khi hoàn tất, nếu có lỗi thì tạo file báo cáo <code>payroll_errors_JOBxxx.csv</code> để kế toán tải về sửa.

### Lời giải Chuẩn Kỹ sư Cấp cao:

~~~java
package vn.mastery.payroll.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.StringReader;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class PayrollProcessingEngine {
    private static final Logger log = LoggerFactory.getLogger(PayrollProcessingEngine.class);

    public record PayrollRow(int lineNo, String employeeId, BigDecimal salary, String bankAccount) {}
    public record RowError(int lineNo, String employeeId, String reason) {}

    @Async("fileImportExecutor")
    public void processPayrollStreamAsync(String jobId, String fakeCsvData) {
        log.info("Bắt đầu xử lý bảng lương cho Job: {}", jobId);

        List<RowError> errorList = new ArrayList<>();
        List<PayrollRow> currentBatch = new ArrayList<>();
        int totalProcessed = 0;

        try (BufferedReader reader = new BufferedReader(new StringReader(fakeCsvData))) {
            String line;
            int lineIndex = 0;

            while ((line = reader.readLine()) != null) {
                lineIndex++;
                if (lineIndex == 1) continue; // Bỏ qua Header CSV

                String[] parts = line.split(",");
                if (parts.length < 3) {
                    errorList.add(new RowError(lineIndex, "UNKNOWN", "Thiếu cột dữ liệu"));
                    continue;
                }

                String empId = parts[0].trim();
                BigDecimal salary;
                try {
                    salary = new BigDecimal(parts[1].trim());
                    if (salary.compareTo(BigDecimal.ZERO) <= 0) {
                        errorList.add(new RowError(lineIndex, empId, "Lương phải lớn hơn 0"));
                        continue;
                    }
                } catch (Exception e) {
                    errorList.add(new RowError(lineIndex, empId, "Lương không đúng định dạng số"));
                    continue;
                }

                String bankAcc = parts[2].trim();
                currentBatch.add(new PayrollRow(lineIndex, empId, salary, bankAcc));
                totalProcessed++;

                // Khi đủ kích thước batch 200 dòng -> Commit DB một lần
                if (currentBatch.size() >= 200) {
                    persistBatchInNewTransaction(currentBatch);
                    currentBatch.clear();
                }
            }

            // Lưu phần còn lại của batch cuối
            if (!currentBatch.isEmpty()) {
                persistBatchInNewTransaction(currentBatch);
                currentBatch.clear();
            }

            log.info("Hoàn tất Job {}: Tổng dòng={}, Thành công={}, Lỗi={}", 
                jobId, totalProcessed, totalProcessed - errorList.size(), errorList.size());

        } catch (Exception ex) {
            log.error("Lỗi I/O khi đọc bảng lương Job: {}", jobId, ex);
        }
    }

    // Mỗi batch cam kết một Transaction ngắn độc lập
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void persistBatchInNewTransaction(List<PayrollRow> batch) {
        // Thực thi batch insert bằng jdbcTemplate hoặc jpaRepository.saveAll()
        log.debug("Đã commit thành công batch {} bản ghi vào database", batch.size());
    }
}
~~~

:::takeaways
- **Kiến trúc Zero-Bandwidth**: Dùng Presigned URL để client upload trực tiếp lên Cloud Storage (S3/GCS), giải phóng máy chủ khỏi áp lực băng thông mạng và RAM.
- **Chuẩn REST cho Tác vụ Dài**: Luôn trả về <code>202 Accepted</code> kèm Header <code>Location: /jobs/{id}</code> và cung cấp endpoint polling tiến độ.
- **Bảo vệ Bộ nhớ Tuyệt đối**: Tuyệt đối không gọi <code>file.getBytes()</code> trên file lớn. Luôn đọc theo dạng Stream kết hợp xử lý Batch ngắn gọn.
- **Cô lập Thread Pool**: Phân tách rõ ràng Thread Pool xử lý file với Tomcat Request Thread Pool và cấu hình <code>AbortPolicy</code> để tránh hiệu ứng Domino làm sập toàn bộ dịch vụ.
:::
`
    },
    {
      id: "2-6",
      type: "lesson",
      title: "Real-time: SSE & WebSocket — Server Push, STOMP & Scaling Đa Pod",
      minutes: 50,
      content: `
## Polling định kỳ: Lãng phí tài nguyên và độ trễ cao

Trong các ứng dụng fintech, ngân hàng số và thương mại điện tử, nhu cầu cập nhật trạng thái tức thời (như biến động số dư, trạng thái đơn hàng, khớp lệnh giao dịch) là bắt buộc. Một cách tiếp cận ngây thơ nhưng cực kỳ phổ biến của lập trình viên sơ cấp là cho client gọi HTTP GET định kỳ (Short Polling) mỗi 3-5 giây.

Nếu hệ thống có 50,000 người dùng trực tuyến, mỗi 3 giây sẽ có:
~~~text
50,000 users × (60 / 3) = 1,000,000 HTTP requests / phút
~~~
Hơn 99.5% các request này trả về kết quả rỗng (không có dữ liệu mới), nhưng chúng vẫn tiêu tốn chu kỳ CPU, băng thông mạng, TCP TLS handshake và luồng xử lý của Web Server. Giải pháp chuyên nghiệp là **Server Push** — máy chủ chỉ đẩy dữ liệu xuống client khi có sự kiện phát sinh. Hai công nghệ tiêu chuẩn hiện nay là **Server-Sent Events (SSE)** và **WebSocket (với giao thức STOMP)**.

---

## 1. Bản chất Kiến trúc & Cơ chế Tầng Mạng (Under the Hood)

### 1.1 So sánh Toàn diện 4 Mô hình Giao tiếp Real-time

| Tiêu chí | Short Polling | Long Polling | Server-Sent Events (SSE) | WebSocket (RFC 6455) |
| :--- | :--- | :--- | :--- | :--- |
| **Giao thức Tầng Vận chuyển** | HTTP/1.1 hoặc HTTP/2 | HTTP/1.1 hoặc HTTP/2 | HTTP/1.1 (Chunked) / HTTP/2 | TCP (Bắt đầu bằng HTTP Upgrade) |
| **Hướng Dữ liệu** | Unidirectional (Client kéo) | Unidirectional (Client kéo) | **Unidirectional (Server đẩy)** | **Full-Duplex (Hai chiều đồng thời)** |
| **Độ trễ (Latency)** | Cao (phụ thuộc interval) | Trung bình (chờ server timeout) | **Cực thấp (< 10ms)** | **Cực thấp (< 5ms, overhead nhỏ)** |
| **Tự động Tái kết nối** | Thủ công (JavaScript timer) | Thủ công (re-request) | **Tự động tích hợp (EventSource API)** | Thủ công (phải tự viết reconnection) |
| **Khả năng Vượt Proxy/Firewall** | Rất tốt (HTTP thường) | Rất tốt (HTTP thường) | **Rất tốt (HTTP chuẩn)** | Đôi khi bị Corporate Proxy/VPN chặn |
| **Tiêu tốn Tài nguyên Mạng** | Rất cao (Header gửi liên tục) | Cao (Giữ connection rồi mở lại) | **Cực thấp (1 TCP connection duy nhất)** | **Cực thấp (Frame 2-6 bytes header)** |
| **Trường hợp Sử dụng Phù hợp** | Dashboard dữ liệu tĩnh ít đổi | Hệ thống legacy không có WS | **Thông báo, Feed tin tức, Cập nhật trạng thái** | **Chat, Game online, Bảng vẽ tương tác** |

### 1.2 Cơ chế Hoạt động của Server-Sent Events (SSE)
SSE hoạt động dựa trên cơ chế kết nối HTTP sống lâu (Long-lived HTTP Connection). Khi client gửi request với Header:
~~~http
GET /api/v1/stream/notifications HTTP/1.1
Host: api.mastery.vn
Accept: text/event-stream
Cache-Control: no-cache
~~~
Máy chủ Spring Boot phản hồi với Header:
~~~http
HTTP/1.1 200 OK
Content-Type: text/event-stream;charset=UTF-8
Transfer-Encoding: chunked
Connection: keep-alive
~~~
Kết nối này được giữ mở vô hạn định. Máy chủ gửi các khối dữ liệu (chunks) theo định dạng văn bản UTF-8 chuẩn:
~~~text
id: evt-1001\n
event: balance_updated\n
data: {"accountNo":"0987654321","newBalance":150000000,"currency":"VND"}\n
retry: 5000\n
\n
~~~
- <code>id</code>: Định danh sự kiện duy nhất. Trình duyệt lưu giá trị này vào header <code>Last-Event-ID</code> khi tự động reconnect để máy chủ gửi bù các sự kiện bị sót.
- <code>event</code>: Tên sự kiện tùy biến (để client bắt bằng <code>addEventListener</code>).
- <code>data</code>: Payload JSON hoặc text.
- <code>retry</code>: Số mili-giây trình duyệt phải đợi trước khi tự động kết nối lại nếu kết nối bị đứt.
- Dấu phân cách bắt buộc: Mỗi trường kết thúc bằng <code>\\n</code>, và mỗi block sự kiện hoàn chỉnh kết thúc bằng **hai dấu xuống dòng liên tiếp** (<code>\\n\\n</code>).

### 1.3 Cơ chế Hoạt động của WebSocket & STOMP Framing
WebSocket khởi đầu bằng một yêu cầu HTTP Handshake đặc biệt:
~~~http
GET /ws-endpoint HTTP/1.1
Host: api.mastery.vn
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
~~~
Máy chủ chấp thuận nâng cấp bằng mã trạng thái <code>101 Switching Protocols</code>:
~~~http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
~~~
Kể từ thời điểm này, kết nối TCP thoát khỏi giao thức HTTP và chuyển sang chế độ truyền nhận nhị phân/văn bản hai chiều toàn phần (Full-Duplex Frame).
Tuy nhiên, WebSocket thô (Raw WebSocket) chỉ là tầng vận chuyển tương tự như một socket TCP trần trụi: nó không định nghĩa cấu trúc tin nhắn, chủ đề (Topic) hay định tuyến. Do đó, chuẩn doanh nghiệp luôn xếp lớp **STOMP (Simple Text Oriented Messaging Protocol)** lên trên WebSocket.

STOMP định nghĩa các Frame rõ ràng tương tự HTTP:
~~~text
CONNECT
accept-version:1.2
heart-beat:10000,10000
authorization:Bearer eyJhbGciOi...

^@
~~~
(với <code>^@</code> là ký tự kết thúc frame byte NULL).

### 1.4 Luồng Xử lý Nội bộ của Spring WebSocket Message Broker
~~~text
+-----------------------------------------------------------------------------------+
|                            Spring WebSocket Architecture                          |
+-----------------------------------------------------------------------------------+

   Client (Browser)
      |  (STOMP over WebSocket)
      v
+------------------------+
| InboundChannel         |
+------------------------+
      |
      +---> [ChannelInterceptor]  (Xác thực Token JWT ở frame CONNECT)
      |
      v
+-------------------------------------------------------------+
| SimpAnnotationMethodMessageHandler                          |
| (@MessageMapping, @SubscribeMapping, @SendTo, @SendToUser)  |
+-------------------------------------------------------------+
      |
      | (Xử lý nghiệp vụ xong chuyển tiếp sang Broker)
      v
+------------------------+
| BrokerChannel          |
+------------------------+
      |
      +-----------------------------------------+
      |                                         |
      v                                         v
+-------------------------------+  +--------------------------------+
| SimpleBrokerMessageHandler    |  | StompBrokerRelayMessageHandler |
| (Bộ nhớ trong - In-memory)    |  | (RabbitMQ / ActiveMQ Cluster)  |
| Đích: /topic/**, /queue/**    |  | Môi trường Cloud Multi-Pod     |
+-------------------------------+  +--------------------------------+
      |                                         |
      +--------------------+--------------------+
                           |
                           v
              +--------------------------+
              | OutboundChannel          |
              +--------------------------+
                           |
                           v
                 Client nhận Message
~~~

---

## 2. Triển khai Mã nguồn Thực chiến (Production-Grade Code)

### 2.1 Hệ Thống Quản lý SSE Emitter: SseEmitterManager
Một trong những lỗi nghiêm trọng nhất khi dùng <code>SseEmitter</code> trong Spring Boot là tạo đối tượng mà không quản lý vòng đời (Lifecycle Callbacks), dẫn đến rò rỉ bộ nhớ (Memory Leak) và chiếm dụng luồng.

Dưới đây là Service quản lý SSE Emitter chuẩn chỉ, an toàn đa luồng và tích hợp cơ chế Heartbeat định kỳ:

~~~java
package vn.mastery.realtime.sse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class SseEmitterManager {

    private static final Logger log = LoggerFactory.getLogger(SseEmitterManager.class);
    private static final Long DEFAULT_TIMEOUT_MS = 120_000L; // 2 phút

    // Lưu trữ danh sách emitter theo userId, thread-safe
    private final Map<String, SseEmitter> emitterMap = new ConcurrentHashMap<>();
    private final AtomicInteger activeConnectionsCounter = new AtomicInteger(0);

    public SseEmitter registerConnection(String userId) {
        // Khởi tạo SseEmitter với thời gian sống xác định
        SseEmitter emitter = new SseEmitter(DEFAULT_TIMEOUT_MS);

        // Đăng ký các hook dọn dẹp kết nối bắt buộc
        emitter.onCompletion(() -> removeEmitter(userId, "Hoàn tất kết nối"));
        emitter.onTimeout(() -> {
            removeEmitter(userId, "Kết nối hết thời gian chờ (Timeout)");
            emitter.complete();
        });
        emitter.onError(throwable -> {
            removeEmitter(userId, "Lỗi kết nối socket: " + throwable.getMessage());
            emitter.complete();
        });

        // Nếu user này đã có kết nối cũ trước đó, đóng kết nối cũ
        SseEmitter existingEmitter = emitterMap.put(userId, emitter);
        if (existingEmitter != null) {
            existingEmitter.complete();
        } else {
            activeConnectionsCounter.incrementAndGet();
        }

        log.info("Khởi tạo kết nối SSE cho user [{}]. Tổng số kết nối hoạt động: {}", 
                 userId, activeConnectionsCounter.get());

        // Gửi ngay event chào mừng đầu tiên để browser xác nhận handshake thành công
        try {
            emitter.send(SseEmitter.event()
                    .name("INIT")
                    .id(String.valueOf(System.currentTimeMillis()))
                    .reconnectTime(5000L) // Báo cho client thử lại sau 5s nếu mất mạng
                    .data("HANDSHAKE_ESTABLISHED"));
        } catch (IOException e) {
            removeEmitter(userId, "Lỗi gửi gói handshake INIT");
        }

        return emitter;
    }

    public boolean pushToUser(String userId, String eventName, Object payload) {
        SseEmitter emitter = emitterMap.get(userId);
        if (emitter == null) {
            log.debug("User [{}] hiện đang offline, bỏ qua push", userId);
            return false;
        }

        try {
            emitter.send(SseEmitter.event()
                    .name(eventName)
                    .id(String.valueOf(System.currentTimeMillis()))
                    .data(payload));
            return true;
        } catch (IOException e) {
            log.warn("Không thể gửi dữ liệu đến user [{}], dọn dẹp kết nối: {}", userId, e.getMessage());
            removeEmitter(userId, "Gửi thất bại (Broken Pipe)");
            return false;
        }
    }

    public void broadcast(String eventName, Object payload) {
        emitterMap.forEach((userId, emitter) -> pushToUser(userId, eventName, payload));
    }

    private void removeEmitter(String userId, String reason) {
        if (emitterMap.remove(userId) != null) {
            int current = activeConnectionsCounter.decrementAndGet();
            log.info("Đã xóa emitter của user [{}] (Lý do: {}). Số kết nối còn lại: {}", 
                     userId, reason, current);
        }
    }

    // Cơ chế Ping định kỳ 20 giây: Bắt buộc để tránh AWS ALB / NGINX ngắt kết nối sau 60s idle
    @Scheduled(fixedRate = 20_000)
    public void sendHeartbeat() {
        if (emitterMap.isEmpty()) {
            return;
        }
        log.trace("Đang phát Heartbeat ping đến {} kết nối SSE...", emitterMap.size());
        emitterMap.forEach((userId, emitter) -> {
            try {
                // Comment line trong chuẩn SSE bắt đầu bằng dấu hai chấm ':'
                emitter.send(SseEmitter.event().comment("ping"));
            } catch (Exception e) {
                removeEmitter(userId, "Heartbeat ping thất bại");
            }
        });
    }

    public int getActiveCount() {
        return activeConnectionsCounter.get();
    }
}
~~~

### 2.2 Controller Đón nhận Request SSE
~~~java
package vn.mastery.realtime.controller;

import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import vn.mastery.realtime.sse.SseEmitterManager;

@RestController
@RequestMapping("/api/v1/stream")
public class SseNotificationController {

    private final SseEmitterManager sseEmitterManager;

    public SseNotificationController(SseEmitterManager sseEmitterManager) {
        this.sseEmitterManager = sseEmitterManager;
    }

    @GetMapping(value = "/notifications", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeNotifications(@AuthenticationPrincipal Jwt jwt) {
        // Trích xuất userId từ JWT Token an toàn
        String userId = jwt.getSubject();
        return sseEmitterManager.registerConnection(userId);
    }
}
~~~

### 2.3 Cấu hình Toàn diện WebSocket STOMP với Spring Boot
Khi sử dụng STOMP, bảo mật và xác thực không diễn ra ở tầng HTTP Servlet thông thường (vì chỉ có request handshake ban đầu là HTTP, các frame sau đó là STOMP qua WebSocket). Giải pháp doanh nghiệp là dùng **ChannelInterceptor** chặn bắt Frame <code>CONNECT</code>.

~~~java
package vn.mastery.realtime.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketBrokerConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger log = LoggerFactory.getLogger(WebSocketBrokerConfig.class);
    private final JwtDecoder jwtDecoder;

    public WebSocketBrokerConfig(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Điểm kết nối handshake WebSocket
        registry.addEndpoint("/ws-connect")
                .setAllowedOriginPatterns("https://*.mastery.vn", "http://localhost:3000")
                .withSockJS(); // Bật cơ chế fallback nếu browser cũ không hỗ trợ WS
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Các đích bắt đầu bằng /app sẽ được định tuyến vào các hàm @MessageMapping trong Controller
        registry.setApplicationDestinationPrefixes("/app");

        // Bộ môi giới tin nhắn nội bộ xử lý broadcast (/topic) và tin nhắn riêng lẻ (/queue)
        registry.enableSimpleBroker("/topic", "/queue")
                .setHeartbeatValue(new long[]{10000, 10000}) // Client gửi và server gửi heartbeat mỗi 10s
                .setTaskScheduler(new org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler());

        // Đích chỉ định người dùng cá nhân (User Destination)
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Đăng ký Interceptor xác thực JWT ngay khi Frame CONNECT đến
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = 
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    log.info("Bắt được frame STOMP CONNECT với Header: {}", 
                             authHeader != null ? "BEARER_TOKEN_PRESENT" : "MISSING");

                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String rawToken = authHeader.substring(7);
                        try {
                            Jwt jwt = jwtDecoder.decode(rawToken);
                            String userId = jwt.getSubject();
                            
                            // Tạo Authentication Principal gắn vào STOMP Session
                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(
                                            userId,
                                            null,
                                            List.of(new SimpleGrantedAuthority("ROLE_USER"))
                                    );
                            accessor.setUser(authentication);
                            log.info("Xác thực thành công STOMP session cho user: {}", userId);
                        } catch (Exception ex) {
                            log.error("Xác thực JWT trên STOMP CONNECT thất bại: {}", ex.getMessage());
                            throw new IllegalArgumentException("Token không hợp lệ hoặc đã hết hạn");
                        }
                    } else {
                        throw new IllegalArgumentException("Thiếu Header Authorization");
                    }
                }
                return message;
            }
        });
    }
}
~~~

### 2.4 Controller Xử lý Tin nhắn WebSocket & Đẩy dữ liệu Đích danh User
~~~java
package vn.mastery.realtime.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.Instant;

@Controller
public class TradingWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(TradingWebSocketController.class);
    private final SimpMessagingTemplate messagingTemplate;

    public TradingWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public record PlaceOrderCommand(String symbol, String side, long quantity, double price) {}
    public record OrderMatchedNotification(String orderId, String symbol, long quantity, 
                                           double price, Instant timestamp) {}
    public record MarketBroadcastMessage(String symbol, double lastPrice, Instant updateTime) {}

    // Nhận message từ client gửi lên /app/orders/place
    // Tự động gửi kết quả lại cho CHÍNH người gửi qua /user/queue/order-status
    @MessageMapping("/orders/place")
    @SendToUser("/queue/order-status")
    public OrderMatchedNotification handleOrderPlacement(@Payload PlaceOrderCommand command, 
                                                         Principal principal) {
        log.info("User [{}] đặt lệnh: {} {} giá {}", 
                 principal.getName(), command.side(), command.quantity(), command.price());

        // Giả lập xử lý khớp lệnh
        return new OrderMatchedNotification(
                "ORD-" + System.currentTimeMillis(),
                command.symbol(),
                command.quantity(),
                command.price(),
                Instant.now()
        );
    }

    // Nhận message từ client gửi lên /app/market/ping và broadcast cho toàn bộ subscriber của /topic/tickers
    @MessageMapping("/market/ping")
    @SendTo("/topic/tickers")
    public MarketBroadcastMessage handleMarketPing(@Payload String symbol) {
        return new MarketBroadcastMessage(symbol, 145.50, Instant.now());
    }

    // Hàm nghiệp vụ được gọi từ Service bên ngoài để đẩy tin nhắn đích danh cho bất kỳ User nào
    public void notifyUserTradeExecution(String userId, OrderMatchedNotification notification) {
        // Tự động route vào /user/{userId}/queue/order-status
        messagingTemplate.convertAndSendToUser(userId, "/queue/order-status", notification);
    }
}
~~~

---

## 3. Thử nghiệm, Xác thực & Cấu hình Hạ tầng (Verification & Infrastructure)

### 3.1 Kiểm thử SSE từ Terminal bằng cURL
Do SSE là chuẩn văn bản HTTP thuần, bạn có thể kiểm thử luồng streaming ngay lập tức bằng cURL với cờ <code>-N</code> (disable buffering):

~~~bash
# Kiểm thử kết nối SSE với Token JWT
curl -N -X GET "http://localhost:8080/api/v1/stream/notifications" \
     -H "Accept: text/event-stream" \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
~~~

Phản hồi dạng luồng (Server giữ kết nối và đẩy liên tục từng chunk):
~~~http
HTTP/1.1 200 OK
Content-Type: text/event-stream;charset=UTF-8
Transfer-Encoding: chunked
Connection: keep-alive

id:1718002341000
event:INIT
retry:5000
data:HANDSHAKE_ESTABLISHED

:ping

id:1718002361000
event:BALANCE_UPDATE
data:{"accountNo":"0987654321","newBalance":150000000,"currency":"VND"}

:ping
~~~

### 3.2 Tích hợp Client Frontend Hiện đại

#### Trình duyệt Web tiêu thụ SSE (EventSource API)
~~~javascript
// JavaScript ES6 trên Browser
const eventSource = new EventSource('/api/v1/stream/notifications');

eventSource.onopen = () => {
    console.log('Đã mở kết nối SSE với Server thành công');
};

// Lắng nghe sự kiện mặc định
eventSource.onmessage = (event) => {
    console.log('Nhận thông điệp chung:', event.data);
};

// Lắng nghe sự kiện tùy biến (Custom Event Name)
eventSource.addEventListener('BALANCE_UPDATE', (event) => {
    const data = JSON.parse(event.data);
    console.log('Cập nhật số dư tài khoản:', data.accountNo, 'Số dư mới:', data.newBalance);
    document.getElementById('balance-label').innerText = data.newBalance.toLocaleString() + ' ' + data.currency;
});

eventSource.onerror = (error) => {
    console.error('Mất kết nối SSE. EventSource sẽ tự động thử kết nối lại...', error);
};
~~~

#### Client WebSocket STOMP (sử dụng thư viện @stomp/stompjs)
~~~javascript
import { Client } from '@stomp/stompjs';

const stompClient = new Client({
    brokerURL: 'ws://localhost:8080/ws-connect/websocket',
    connectHeaders: {
        Authorization: 'Bearer ' + userAccessToken
    },
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    reconnectDelay: 5000,
    onConnect: (frame) => {
        console.log('Đã kết nối STOMP Broker:', frame);

        // 1. Đăng ký nhận tin nhắn riêng của User
        stompClient.subscribe('/user/queue/order-status', (message) => {
            const orderInfo = JSON.parse(message.body);
            console.log('Khớp lệnh thành công:', orderInfo);
        });

        // 2. Đăng ký nhận broadcast toàn sàn
        stompClient.subscribe('/topic/tickers', (message) => {
            const ticker = JSON.parse(message.body);
            console.log('Biến động giá thị trường:', ticker);
        });
    },
    onStompError: (frame) => {
        console.error('Lỗi từ STOMP Broker:', frame.headers['message']);
    }
});

stompClient.activate();

// Hàm gửi lệnh mua bán
function placeOrder(symbol, side, quantity, price) {
    stompClient.publish({
        destination: '/app/orders/place',
        body: JSON.stringify({ symbol, side, quantity, price })
    });
}
~~~

### 3.3 Cấu hình NGINX Reverse Proxy cho SSE & WebSocket
Khi triển khai ra môi trường Kubernetes hoặc Docker Swarm đứng sau NGINX Ingress, kết nối SSE và WebSocket thường bị đứt đột ngột hoặc bị nghẽn buffer. Đây là cấu hình chuẩn bắt buộc:

~~~nginx
# Cấu hình NGINX tối ưu cho SSE và WebSocket
upstream spring_backend {
    server 127.0.0.1:8080;
    keepalive 64; # Giữ kết nối upstream
}

map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name api.mastery.vn;

    # Endpoint WebSocket
    location /ws-connect/ {
        proxy_pass http://spring_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;

        # WebSocket cần timeout đọc dài (ví dụ: 1 giờ) thay vì 60s mặc định
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # Endpoint SSE
    location /api/v1/stream/ {
        proxy_pass http://spring_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Host $host;

        # CỰC KỲ QUAN TRỌNG: Tắt Buffering của NGINX
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;

        proxy_read_timeout 3600s;
    }
}
~~~

---

## 4. Cạm bẫy Triển khai & Khắc phục Sự cố (Production Pitfalls)

### Cạm bẫy 1: Rò rỉ Bộ nhớ (Memory Leak) do không xóa SseEmitter
Khi client đóng trình duyệt hoặc mất kết nối 4G đột ngột, TCP connection bị ngắt. Tuy nhiên, nếu bạn chỉ lưu <code>SseEmitter</code> vào một <code>List</code> hoặc <code>Map</code> mà không bắt đầy đủ 3 sự kiện:
1. <code>emitter.onCompletion(...)</code>
2. <code>emitter.onTimeout(...)</code>
3. <code>emitter.onError(...)</code>

Thì tham chiếu của đối tượng <code>SseEmitter</code> (kèm theo toàn bộ dữ liệu session, context của Tomcat) sẽ vĩnh viễn tồn tại trong Old Generation của JVM Heap. Sau vài ngày chạy thực tế với hàng trăm ngàn lượt người dùng ra vào, hệ thống sẽ sập với lỗi kinh điển:
~~~text
java.lang.OutOfMemoryError: Java heap space
~~~
**Biện pháp khắc phục**: Luôn đăng ký hàm dọn dẹp tại cả 3 hook như đã triển khai trong <code>SseEmitterManager</code>.

### Cạm bẫy 2: NGINX / Cloudflare tự động đệm (Buffering) làm tê liệt SSE
Mặc định, các Gateway như NGINX hoặc Cloudflare cố gắng gom đủ 4KB hoặc 8KB dữ liệu từ backend trước khi gửi tiếp xuống browser để tối ưu hiệu suất mạng.
Khi đó, các sự kiện SSE nhẹ (vài chục byte) của bạn sẽ bị giữ chặt tại Proxy. Người dùng sẽ thấy giao diện đứng im không nhận được gì trong suốt 2 phút, sau đó nhận một lúc 50 thông báo dồn dập khi bộ đệm đầy!
**Biện pháp khắc phục**:
1. Trong file cấu hình NGINX: đặt <code>proxy_buffering off;</code>.
2. Hoặc cấu hình Spring Controller trả về response header: <code>X-Accel-Buffering: no</code> (Header đặc thù báo NGINX lập tức bypass buffer).

### Cạm bẫy 3: Giới hạn 6 Kết nối HTTP/1.1 trên cùng một Domain của Trình duyệt
Trong chuẩn HTTP/1.1, các trình duyệt web (Chrome, Firefox, Edge) giới hạn tối đa **6 kết nối TCP đồng thời** tới cùng một Domain (Domain-level connection limit).
Nếu ứng dụng mở 1 tab với 1 kết nối SSE liên tục, người dùng mở 6 tab trình duyệt sẽ tiêu thụ sạch 6 kết nối. Kể từ tab thứ 7, mọi lệnh gọi API thông thường (<code>GET</code>, <code>POST</code>) sẽ bị trạng thái **Stalled / Pending vô hạn định**!
**Biện pháp khắc phục**:
- Nâng cấp máy chủ lên giao thức **HTTP/2**. Với HTTP/2 Multiplexing, hàng ngàn luồng dữ liệu (Streams) bao gồm cả SSE và REST requests đều có thể chạy song song trên **duy nhất một kết nối TCP**.

### Cạm bẫy 4: Thảm họa Scale Out Đa Pod khi dùng In-Memory SimpleBroker
Mặc định <code>registry.enableSimpleBroker("/topic")</code> chỉ quản lý các subscriber lưu trong RAM của **chính Pod đó**.
Khi hệ thống scale lên 5 Pod trên Kubernetes:
- User A kết nối WebSocket vào Pod 1.
- Dịch vụ thanh toán (Payment Service) gọi Pod 3 để gửi thông báo cho User A.
- Pod 3 chỉ phát tin nhắn trong bộ nhớ RAM của chính nó -> User A kết nối ở Pod 1 **hoàn toàn không nhận được tin nhắn**!

**Giải pháp chuẩn Enterprise**:
1. Với **SSE**: Sử dụng **Redis Pub/Sub**. Khi bất kỳ Pod nào muốn gửi message, nó Publish lên kênh Redis <code>user-notifications-channel</code>. Tất cả các Pod lắng nghe, Pod nào đang giữ Emitter của User đó trong Map thì sẽ đẩy dữ liệu ra.
2. Với **STOMP**: Thay thế <code>SimpleBroker</code> bằng **StompBrokerRelay** trỏ đến cụm Message Broker tập trung chuyên dụng (RabbitMQ hoặc ActiveMQ) qua plugin STOMP:
~~~java
// Chuyển sang dùng Broker Relay ngoài (RabbitMQ)
registry.enableStompBrokerRelay("/topic", "/queue")
        .setRelayHost("rabbitmq.internal")
        .setRelayPort(61613)
        .setClientLogin("admin")
        .setClientPasscode("secret");
~~~

---

## 5. Thử thách Thực chiến (Hands-on Challenge)

### Đề bài:
Xây dựng Engine Phát sóng Tỷ giá Ngoại tệ & Cảnh báo Biến động Giá (Forex Ticker & Alert Streaming Subsystem):
1. **Luồng SSE Public (Forex Ticker Broadcast)**:
   - Endpoint <code>GET /api/v1/stream/forex-rates</code> (Không cần đăng nhập).
   - Tốc độ phát sóng: 10 lần/giây mô phỏng biến động tỷ giá các cặp tiền tệ (<code>USD/VND</code>, <code>EUR/USD</code>, <code>GBP/USD</code>).
   - Xây dựng cơ chế **Backpressure Safety**: Nếu kết nối mạng của một client bị nghẽn (chậm đọc), hệ thống phải tự động DROP các frame tỷ giá trung gian để tránh làm tràn RAM của JVM, chỉ giữ frame mới nhất.
2. **Luồng WebSocket STOMP Private (Price Target Alert)**:
   - Client đăng nhập gửi lệnh đặt mức giá mong muốn (Alert Target) lên <code>/app/forex/set-alert</code>.
   - Khi tỷ giá chạm ngưỡng cảnh báo, hệ thống sử dụng <code>SimpMessagingTemplate</code> bắn thông báo đích danh vào <code>/user/queue/forex-alerts</code> của user đó.

### Lời giải Chuẩn Kỹ sư Cấp cao:

~~~java
package vn.mastery.realtime.forex;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.http.MediaType;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.security.Principal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

// 1. Định nghĩa các Model DTO bất biến
public final class ForexModels {
    public record RateTick(String pair, double bid, double ask, Instant timestamp) {}
    public record PriceAlertRequest(String pair, double targetPrice, String direction) {}
    public record AlertTriggeredNotification(String alertId, String pair, double currentPrice, 
                                             double targetPrice, Instant triggeredAt) {}
}

// 2. Service quản lý Broadcast Tỷ giá với Cơ chế Backpressure Drop
@org.springframework.stereotype.Service
class ForexRateBroadcastService {

    private static final Logger log = LoggerFactory.getLogger(ForexRateBroadcastService.class);
    private final Set<SseEmitter> activeSubscribers = ConcurrentHashMap.newKeySet();
    private final Random random = new Random();

    public SseEmitter subscribeRates() {
        // Timeout 30 phút cho dashboard theo dõi tỷ giá
        SseEmitter emitter = new SseEmitter(1_800_000L);

        emitter.onCompletion(() -> activeSubscribers.remove(emitter));
        emitter.onTimeout(() -> {
            activeSubscribers.remove(emitter);
            emitter.complete();
        });
        emitter.onError(e -> {
            activeSubscribers.remove(emitter);
            emitter.complete();
        });

        activeSubscribers.add(emitter);
        log.info("Client mới đăng ký nhận Tỷ giá Forex. Số lượng hiện tại: {}", activeSubscribers.size());
        return emitter;
    }

    // Giả lập nhận dữ liệu thị trường và phát sóng (10Hz)
    @Scheduled(fixedRate = 100)
    public void generateAndBroadcastTicks() {
        if (activeSubscribers.isEmpty()) {
            return;
        }

        double baseUsdVnd = 25400.0 + (random.nextDouble() * 10 - 5);
        ForexModels.RateTick tick = new ForexModels.RateTick(
                "USD/VND",
                Math.round(baseUsdVnd * 100.0) / 100.0,
                Math.round((baseUsdVnd + 15.0) * 100.0) / 100.0,
                Instant.now()
        );

        List<SseEmitter> deadEmitters = new ArrayList<>();

        for (SseEmitter emitter : activeSubscribers) {
            try {
                emitter.send(SseEmitter.event()
                        .name("RATE_TICK")
                        .data(tick));
            } catch (Exception ex) {
                // Client đọc quá chậm làm tràn socket buffer (Broken pipe) -> Loại bỏ
                deadEmitters.add(emitter);
            }
        }

        if (!deadEmitters.isEmpty()) {
            activeSubscribers.removeAll(deadEmitters);
            log.debug("Đã loại bỏ {} kết nối chậm/ngắt kết nối", deadEmitters.size());
        }
    }
}

// 3. Controller cung cấp Endpoint SSE Public
@RestController
class ForexStreamController {

    private final ForexRateBroadcastService broadcastService;

    public ForexStreamController(ForexRateBroadcastService broadcastService) {
        this.broadcastService = broadcastService;
    }

    @GetMapping(value = "/api/v1/stream/forex-rates", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamRates() {
        return broadcastService.subscribeRates();
    }
}

// 4. WebSocket Controller quản lý Đặt Cảnh báo Giá Đích danh
@Controller
class ForexAlertWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(ForexAlertWebSocketController.class);
    private final SimpMessagingTemplate messagingTemplate;

    // Giả lập bộ lưu trữ Alert trong RAM
    private final Map<String, List<ForexModels.PriceAlertRequest>> userAlerts = new ConcurrentHashMap<>();

    public ForexAlertWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/forex/set-alert")
    @SendToUser("/queue/alert-confirmations")
    public String registerPriceAlert(@Payload ForexModels.PriceAlertRequest request, Principal principal) {
        String username = principal.getName();
        userAlerts.computeIfAbsent(username, k -> new CopyOnWriteArrayList<>()).add(request);

        log.info("Đã tạo cảnh báo giá cho user [{}]: Cặp {} Ngưỡng {}", 
                 username, request.pair(), request.targetPrice());
        return "CẢNH_BÁO_ĐÃ_LƯU: " + request.pair() + " @ " + request.targetPrice();
    }

    // Mô phỏng quét tỷ giá và kích hoạt cảnh báo đến đích danh người dùng
    @Scheduled(fixedRate = 5000)
    public void evaluateAlerts() {
        double currentPrice = 25405.0; // Giả sử giá thị trường hiện tại

        userAlerts.forEach((user, alerts) -> {
            Iterator<ForexModels.PriceAlertRequest> iterator = alerts.iterator();
            while (iterator.hasNext()) {
                ForexModels.PriceAlertRequest alert = iterator.next();
                if (currentPrice >= alert.targetPrice()) {
                    ForexModels.AlertTriggeredNotification notification = 
                            new ForexModels.AlertTriggeredNotification(
                                    "ALT-" + UUID.randomUUID().toString().substring(0, 8),
                                    alert.pair(),
                                    currentPrice,
                                    alert.targetPrice(),
                                    Instant.now()
                            );

                    // Đẩy tin nhắn riêng vào /user/{user}/queue/forex-alerts
                    messagingTemplate.convertAndSendToUser(user, "/queue/forex-alerts", notification);
                    log.info("ĐÃ KÍCH HOẠT CẢNH BÁO CHO USER [{}]: Giá chạm {}", user, currentPrice);
                    alerts.remove(alert); // Xóa sau khi đã kích hoạt
                }
            }
        });
    }
}
~~~

:::takeaways
- **Lựa chọn đúng công cụ**: 90% nhu cầu thông báo, hiển thị bảng tin chỉ cần **SSE** (gọn nhẹ, 1 chiều, HTTP chuẩn, tự reconnect qua <code>EventSource</code>). Chỉ chọn **WebSocket** khi ứng dụng cần giao tiếp 2 chiều tần suất cao (Chat, Game, Collaborative editing).
- **Phân lớp STOMP**: WebSocket trần chỉ là socket socket nhị phân. Luôn dùng giao thức STOMP để có cú pháp Publish/Subscribe, User routing (<code>/user/queue</code>) và Header tường minh.
- **Xác thực STOMP**: Trình duyệt không thể gửi HTTP Header <code>Authorization</code> khi thực hiện bắt tay WebSocket. Luôn xác thực Token JWT tại Frame <code>CONNECT</code> thông qua <code>ChannelInterceptor</code>.
- **Cơ chế Heartbeat bắt buộc**: Cả SSE (<code>:ping\\n\\n</code>) và WebSocket STOMP đều bắt buộc phải có heartbeat định kỳ (10-20s) để giữ kết nối không bị các Cloud Load Balancer (AWS ALB, NGINX) đóng sau 60s idle timeout.
- **Quy tắc Scale Out**: In-memory <code>SimpleBroker</code> không hỗ trợ cụm đa máy chủ (Multi-Pod). Trên Production, phải cấu hình <code>StompBrokerRelay</code> trỏ tới RabbitMQ/ActiveMQ hoặc dùng Redis Pub/Sub đồng bộ hóa sự kiện giữa các Pod.
:::
`
    },
    {
      id: "2-7",
      type: "lesson",
      title: "API Contract-First: OpenAPI 3.1 CodeGen, Declarative HTTP Interfaces & Pact CDC",
      minutes: 50,
      content: `
## Vòng lặp chết Code-First và hiện tượng Trôi dạt Hợp đồng (Contract Drift)

Trong quy trình phát triển truyền thống (Code-First), đội ngũ Backend thường cặm cụi lập trình xong Controller, Entity, Service, sau đó dùng thư viện như Springdoc-OpenAPI để quét các annotation và tự động xuất ra file Swagger UI. 

Mô hình này dẫn đến 3 tổn thất nghiêm trọng trong môi trường doanh nghiệp:
1. **Frontend bị đóng băng (Blocking Dependency)**: Đội Frontend và Mobile phải ngồi chờ Backend hoàn thành 100% logic mới có API để tích hợp, hoặc phải tự tạo file mock tạm thời với cấu trúc dữ liệu tự chế.
2. **Trôi dạt hợp đồng (Contract Drift)**: Khi Backend sửa đổi kiểu dữ liệu (ví dụ: đổi trường <code>status</code> từ số nguyên sang chuỗi Enum) mà quên thông báo, toàn bộ ứng dụng di động của khách hàng ngoài thị trường sẽ sập ngay khi parse JSON.
3. **Docs chỉ là ước vọng**: Tài liệu API được viết bằng Java code annotation thường bị lạc hậu so với hành vi thực tế của máy chủ.

Giải pháp chuẩn công nghiệp là **Contract-First (Tài liệu Hợp đồng đi trước)**: Hai bên cùng thống nhất và phê duyệt bản đặc tả **OpenAPI 3.1 YAML** duy nhất. Từ bản hợp đồng này, toàn bộ mã nguồn Java Server Interface, TypeScript Client SDK, và Mock Server độc lập đều được **sinh tự động (Generate)** trong quá trình build.

---

## 1. Bản chất Kiến trúc & Quy trình Contract-First (Under the Hood)

### 1.1 So sánh Triết lý Code-First vs Contract-First vs Consumer-Driven Contracts (CDC)

| Tiêu chí | Code-First (Springdoc / Swagger) | Contract-First (OpenAPI Generator) | Consumer-Driven Contracts (Pact CDC) |
| :--- | :--- | :--- | :--- |
| **Nguồn Chân lý (Single Source of Truth)** | Mã nguồn Java Controller | File hợp đồng <code>api-spec.yaml</code> | Các kỳ vọng (Expectations) của Client |
| **Thời điểm Frontend bắt đầu** | Sau khi Backend deploy môi trường Dev | **Ngay ngày đầu tiên (qua Mock Server)** | Ngay khi định nghĩa xong tương tác |
| **Phát hiện Xung đột Hợp đồng** | Khi test tích hợp (Integration Test) | **Ngay tại thời điểm Biên dịch (Compile Time)** | Trong CI/CD pipeline trước khi Deploy |
| **Độ tin cậy Tài liệu** | Trung bình (dễ sai lệch logic thật) | **Tuyệt đối (Code được sinh từ hợp đồng)** | Tuyệt đối (Kiểm thử thực tế với Mock) |
| **Rủi ro Breaking Change** | Cực kỳ cao, phát hiện muộn | Thấp (so sánh diff yaml bằng tool) | **Bằng 0 (Pact Broker chặn Deploy)** |

### 1.2 Vòng đời Phát triển Phần mềm Chuẩn Contract-First
~~~text
+-----------------------------------------------------------------------------------+
|                        Quy trình Phát triển Contract-First                         |
+-----------------------------------------------------------------------------------+

     [ Tech Lead / API Designer ]
                  |
                  v
         +-----------------+
         |  api-spec.yaml  |  <--- (Nguồn Chân lý Duy nhất - Lưu trong Git)
         +-----------------+
                  |
         +--------+------------------------+
         |                                 |
         v                                 v
+------------------+             +-------------------+
| Prism Mock Server|             | OpenAPI Generator |
| (Port 4010)      |             | (Maven Plugin)    |
+------------------+             +-------------------+
         |                                 |
         v                                 +-----------------------+
 [ Frontend / Mobile ]                     |                       |
 (Lập trình song song                      v                       v
  không cần chờ backend)         +--------------------+  +--------------------+
                                 | Java Server API    |  | TypeScript Client  |
                                 | (Interfaces & DTOs)|  | SDK (Model & HTTP) |
                                 +--------------------+  +--------------------+
                                           |                       |
                                           v                       v
                                 +--------------------+  [ Frontend Web App ]
                                 | Backend Controller |
                                 | (Implements Api)   |
                                 +--------------------+
                                           |
                                           v
                             +----------------------------+
                             | Pact Verification in CI/CD |
                             | (Chặn deploy nếu phá vỡ)  |
                             +----------------------------+
~~~

### 1.3 Cơ chế CodeGen của openapi-generator-maven-plugin
Khi Maven thực thi phase <code>generate-sources</code>, plugin sẽ:
1. Đọc và phân tích cây cú pháp trừu tượng (AST) của file <code>api-spec.yaml</code>.
2. Kiểm tra tính hợp lệ về kiểu dữ liệu theo chuẩn JSON Schema / OpenAPI 3.1.
3. Sử dụng bộ máy mẫu giao diện Mustache để kết xuất mã nguồn Java:
   - **Model Classes**: Các Java record hoặc POJO với đầy đủ Jakarta Validation annotations (<code>@NotNull</code>, <code>@Size</code>, <code>@Pattern</code>).
   - **API Interfaces**: Chứa các phương thức REST với Spring MVC annotations (<code>@GetMapping</code>, <code>@PostMapping</code>, <code>@Valid</code>).
4. Đội ngũ kỹ sư Backend **CHỈ CẦN** viết Controller để <code>implements</code> Interface này. Nếu ai đó sửa file YAML làm thay đổi tên trường hoặc tham số, lệnh <code>mvn compile</code> sẽ lập tức báo lỗi đỏ rực — trình biên dịch Java trở thành người giám hộ hợp đồng!

---

## 2. Triển khai Mã nguồn Thực chiến (Production-Grade Code)

### 2.1 File Hợp đồng Chuẩn Doanh nghiệp: loyalty-spec.yaml
Tạo file tại đường dẫn <code>src/main/resources/specs/loyalty-spec.yaml</code>:

~~~yaml
openapi: 3.1.0
info:
  title: Enterprise Loyalty & Rewards API
  version: 1.0.0
  description: Hợp đồng giao tiếp dịch vụ Tích lũy và Đổi điểm thưởng thành viên

paths:
  /api/v1/members/{cif}/balance:
    get:
      summary: Tra cứu số dư điểm thưởng theo mã CIF
      operationId: getMemberBalance
      tags:
        - Balance
      parameters:
        - name: cif
          in: path
          required: true
          description: Mã định danh khách hàng 10 chữ số
          schema:
            type: string
            pattern: '^[0-9]{10}$'
            example: '0123456789'
      responses:
        '200':
          description: Tra cứu thành công
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PointsBalanceResponse'
        '404':
          description: Không tìm thấy khách hàng
          content:
            application/problem+json:
              schema:
                $ref: '#/components/schemas/ProblemDetails'

  /api/v1/members/points/earn:
    post:
      summary: Tích lũy điểm từ giao dịch thanh toán
      operationId: earnPoints
      tags:
        - Transactions
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EarnPointsRequest'
      responses:
        '201':
          description: Tích lũy điểm thành công
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TransactionResultResponse'
        '400':
          description: Dữ liệu giao dịch không hợp lệ
          content:
            application/problem+json:
              schema:
                $ref: '#/components/schemas/ProblemDetails'

components:
  schemas:
    PointsBalanceResponse:
      type: object
      required:
        - cif
        - availablePoints
        - pendingPoints
        - tier
      properties:
        cif:
          type: string
          example: '0123456789'
        availablePoints:
          type: integer
          format: int64
          example: 15400
        pendingPoints:
          type: integer
          format: int64
          example: 200
        tier:
          type: string
          enum: [STANDARD, SILVER, GOLD, PLATINUM]
          example: 'PLATINUM'

    EarnPointsRequest:
      type: object
      required:
        - cif
        - orderId
        - amountVnd
      properties:
        cif:
          type: string
          pattern: '^[0-9]{10}$'
        orderId:
          type: string
          example: 'ORD-998877'
        amountVnd:
          type: integer
          format: int64
          minimum: 1000

    TransactionResultResponse:
      type: object
      required:
        - transactionId
        - cif
        - pointsEarned
        - newTotalBalance
        - status
      properties:
        transactionId:
          type: string
          example: 'TXN-456789'
        cif:
          type: string
        pointsEarned:
          type: integer
          format: int64
          example: 150
        newTotalBalance:
          type: integer
          format: int64
          example: 15550
        status:
          type: string
          example: 'SUCCESS'

    ProblemDetails:
      type: object
      required:
        - type
        - title
        - status
      properties:
        type:
          type: string
          format: uri
        title:
          type: string
        status:
          type: integer
        detail:
          type: string
        instance:
          type: string
~~~

### 2.2 Cấu hình Maven Plugin: openapi-generator-maven-plugin
Khai báo plugin trong <code>pom.xml</code>. Chú ý các tùy chọn tối quan trọng: <code>interfaceOnly=true</code> và <code>useSpringBoot3=true</code>:

~~~xml
<plugin>
    <groupId>org.openapitools</groupId>
    <artifactId>openapi-generator-maven-plugin</artifactId>
    <version>7.4.0</version>
    <executions>
        <execution>
            <id>generate-loyalty-api</id>
            <goals>
                <goal>generate</goal>
            </goals>
            <configuration>
                <inputSpec>\${project.basedir}/src/main/resources/specs/loyalty-spec.yaml</inputSpec>
                <generatorName>spring</generatorName>
                <apiPackage>vn.mastery.loyalty.api</apiPackage>
                <modelPackage>vn.mastery.loyalty.model</modelPackage>
                <supportingFilesToGenerate>ApiUtil.java</supportingFilesToGenerate>
                <configOptions>
                    <interfaceOnly>true</interfaceOnly>
                    <useSpringBoot3>true</useSpringBoot3>
                    <skipDefaultInterface>true</skipDefaultInterface>
                    <openApiNullable>false</openApiNullable>
                    <useTags>true</useTags>
                    <generateConstructorWithAllArgs>true</generateConstructorWithAllArgs>
                </configOptions>
            </configuration>
        </execution>
    </executions>
</plugin>
~~~

Khi chạy <code>mvn clean compile</code>, plugin sẽ tự động sinh Interface:
~~~java
// File được sinh tự động tại target/generated-sources/.../BalanceApi.java
package vn.mastery.loyalty.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import vn.mastery.loyalty.model.PointsBalanceResponse;

public interface BalanceApi {
    @GetMapping(
        value = "/api/v1/members/{cif}/balance",
        produces = { "application/json", "application/problem+json" }
    )
    ResponseEntity<PointsBalanceResponse> getMemberBalance(
        @Pattern(regexp = "^[0-9]{10}$") @PathVariable("cif") String cif
    );
}
~~~

### 2.3 Triển khai Controller Thực tế — Trình biên dịch Giám sát Hợp đồng
Lập trình viên chỉ việc kế thừa Interface đã được sinh ra:

~~~java
package vn.mastery.loyalty.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import vn.mastery.loyalty.api.BalanceApi;
import vn.mastery.loyalty.api.TransactionsApi;
import vn.mastery.loyalty.model.EarnPointsRequest;
import vn.mastery.loyalty.model.PointsBalanceResponse;
import vn.mastery.loyalty.model.TransactionResultResponse;
import vn.mastery.loyalty.service.LoyaltyDomainService;

@RestController
public class LoyaltyApiController implements BalanceApi, TransactionsApi {

    private final LoyaltyDomainService loyaltyService;

    public LoyaltyApiController(LoyaltyDomainService loyaltyService) {
        this.loyaltyService = loyaltyService;
    }

    @Override
    public ResponseEntity<PointsBalanceResponse> getMemberBalance(String cif) {
        PointsBalanceResponse response = loyaltyService.calculateBalance(cif);
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<TransactionResultResponse> earnPoints(EarnPointsRequest request) {
        TransactionResultResponse result = loyaltyService.processEarning(request);
        return ResponseEntity.status(201).body(result);
    }
}
~~~

### 2.4 Giao tiếp Liên Dịch vụ Hiện đại: Spring Boot 3.2+ RestClient & Declarative HTTP Interface
Trong kiến trúc Microservices, Service A gọi Service B theo đúng bản hợp đồng đã cam kết. Spring Boot 3.2 giới thiệu **RestClient** (thay thế RestTemplate) và **Declarative HTTP Interfaces** (thay thế OpenFeign):

#### Bước 1: Khai báo Declarative HTTP Interface
~~~java
package vn.mastery.loyalty.client;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.service.annotation.PostExchange;
import vn.mastery.loyalty.model.EarnPointsRequest;
import vn.mastery.loyalty.model.PointsBalanceResponse;
import vn.mastery.loyalty.model.TransactionResultResponse;

@HttpExchange(url = "/api/v1/members", accept = MediaType.APPLICATION_JSON_VALUE)
public interface LoyaltyHttpClient {

    @GetExchange("/{cif}/balance")
    PointsBalanceResponse fetchBalance(@PathVariable("cif") String cif);

    @PostExchange("/points/earn")
    TransactionResultResponse submitEarnPoints(@RequestBody EarnPointsRequest request);
}
~~~

#### Bước 2: Cấu hình Bean Proxy với RestClient kết hợp HTTP/2 Native
~~~java
package vn.mastery.loyalty.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;
import vn.mastery.loyalty.client.LoyaltyHttpClient;
import vn.mastery.loyalty.exception.RemoteServiceException;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
public class HttpClientConfig {

    @Bean
    public LoyaltyHttpClient loyaltyHttpClient(
            @Value("\${services.loyalty.base-url:https://loyalty.internal}") String baseUrl) {

        // Cấu hình JDK HttpClient thuần với HTTP/2 và Connection Pool tối ưu
        HttpClient nativeClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .connectTimeout(Duration.ofSeconds(3))
                .build();

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(nativeClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(5)); // Chống treo luồng

        RestClient restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .defaultStatusHandler(HttpStatusCode::isError, (request, response) -> {
                    throw new RemoteServiceException(
                            "Lỗi từ Loyalty Service upstream: HTTP " + response.getStatusCode());
                })
                .build();

        HttpServiceProxyFactory proxyFactory = HttpServiceProxyFactory
                .builderFor(RestClientAdapter.create(restClient))
                .build();

        return proxyFactory.createClient(LoyaltyHttpClient.class);
    }
}
~~~

### 2.5 Kiểm thử Hợp đồng Phía Nhà cung cấp với Pact (Pact Provider Verification)
Pact đảm bảo rằng dịch vụ Backend không bao giờ vô tình phá vỡ những gì mà dịch vụ Client (Web/Mobile) đang mong đợi:

~~~java
package vn.mastery.loyalty.contract;

import au.com.dius.pact.provider.junit5.PactVerificationContext;
import au.com.dius.pact.provider.junit5.PactVerificationInvocationContextProvider;
import au.com.dius.pact.provider.junitsupport.Provider;
import au.com.dius.pact.provider.junitsupport.State;
import au.com.dius.pact.provider.junitsupport.loader.PactFolder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestTemplate;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Provider("loyalty-service")
@PactFolder("src/test/resources/pacts")
class LoyaltyProviderContractTest {

    @LocalServerPort
    private int port;

    @BeforeEach
    void setUp(PactVerificationContext context) {
        context.setTarget(new au.com.dius.pact.provider.junit5.HttpTestTarget("localhost", port));
    }

    @TestTemplate
    @ExtendWith(PactVerificationInvocationContextProvider.class)
    void verifyPactInteractions(PactVerificationContext context) {
        // Tự động kiểm thử từng tương tác mà Consumer đã đăng ký trong hợp đồng Pact
        context.verifyInteraction();
    }

    @State("Khách hàng 0123456789 có 15400 điểm")
    void setupMemberWithPoints() {
        // Mock dữ liệu database hoặc chuẩn bị state tương ứng
    }
}
~~~

---

## 3. Thử nghiệm, Xác thực & Công cụ Hỗ trợ (Verification & Tools)

### 3.1 Khởi chạy Mock Server Tức thì cho Frontend bằng Prism
Đội ngũ Frontend không cần chờ Backend viết dù chỉ một dòng code. Sử dụng công cụ **Prism CLI** để tạo Mock Server chuẩn xác theo file YAML trong 1 giây:

~~~bash
# Chạy Mock Server từ file OpenAPI YAML
npx @stoplight/prism-cli mock src/main/resources/specs/loyalty-spec.yaml -p 4010
~~~

Kiểm tra Mock Server hoạt động bằng cURL:
~~~bash
curl -X GET "http://localhost:4010/api/v1/members/0123456789/balance" \
     -H "Accept: application/json"
~~~

Kết quả trả về chính xác theo schema và examples đã định nghĩa:
~~~json
{
  "cif": "0123456789",
  "availablePoints": 15400,
  "pendingPoints": 200,
  "tier": "PLATINUM"
}
~~~

### 3.2 Tự động Phát hiện Breaking Changes bằng openapi-diff
Tích hợp bước kiểm tra sự tương thích ngược vào Git Hook hoặc CI Pipeline (GitHub Actions / GitLab CI):

~~~bash
# So sánh phiên bản hợp đồng cũ trên nhánh main với phiên bản mới trên PR
npx @openapitools/openapi-diff-cli \
    specs/loyalty-v1.0.0.yaml \
    specs/loyalty-v1.1.0.yaml \
    --markdown diff_report.md
~~~

Kết quả báo cáo từ CI:
~~~text
==========================================================================
                      OPENAPI BREAKING CHANGES AUDIT                      
==========================================================================
[FAIL] BREAKING CHANGES DETECTED:
- In endpoint 'GET /api/v1/members/{cif}/balance':
  - Removed property 'pendingPoints' in response 200 (schema changed).
  - Parameter 'cif' pattern changed from '^[0-9]{10}$' to '^[0-9]{12}$'.

[INFO] NON-BREAKING CHANGES:
- Added new optional property 'expiryDate' to 'PointsBalanceResponse'.
~~~

Nếu phát hiện lỗi <code>BREAKING</code>, CI Pipeline sẽ lập tức hủy build và chặn merge code vào nhánh sản phẩm!

---

## 4. Cạm bẫy Triển khai & Khắc phục Sự cố (Production Pitfalls)

### Cạm bẫy 1: Sửa tay vào thư mục generated-sources
Nhiều lập trình viên mới làm quen với CodeGen thường mắc lỗi mở thư mục <code>target/generated-sources/openapi/</code> và trực tiếp chỉnh sửa code Java bên trong.
Hậu quả: Mỗi khi chạy <code>mvn clean install</code> hoặc khi đưa lên máy chủ CI Jenkins/GitHub Actions, toàn bộ thư mục <code>target/</code> bị xóa trắng và sinh lại từ đầu. Toàn bộ logic sửa tay biến mất không dấu vết!
**Quy tắc bất di bất dịch**: Thư mục <code>generated-sources</code> là Read-Only. Chỉ viết code vào thư mục <code>src/main/java</code> thông qua việc kế thừa (implements) Interface hoặc cấu hình Decorator.

### Cạm bẫy 2: Thêm trường bắt buộc (required: true) âm thầm phá sập Mobile App
Giả sử phiên bản v1.0.0 client gửi:
~~~json
{ "cif": "0123456789", "amountVnd": 500000 }
~~~
Đột nhiên đội Backend thêm trường mới vào YAML:
~~~yaml
required: [cif, amountVnd, storeCode] # storeCode là required
~~~
Ngay lập tức, hàng triệu người dùng ứng dụng di động đang dùng phiên bản app cũ ngoài thị trường (chưa cập nhật từ App Store) khi thực hiện giao dịch sẽ nhận lỗi <code>HTTP 400 Bad Request</code> vì payload không chứa <code>storeCode</code>!
**Quy tắc thiết kế API**: Các trường mới bổ sung trong tương lai **bắt buộc phải là tùy chọn (Optional)**. Chỉ được phép yêu cầu trường bắt buộc mới khi phát hành một API Version hoàn toàn mới (ví dụ: <code>/api/v2/...</code>).

### Cạm bẫy 3: Spring RestClient mặc định không giới hạn Timeout (Infinite Hanging)
Mặc định nếu bạn khởi tạo <code>RestClient.create()</code> mà không chỉ định <code>ClientHttpRequestFactory</code>, timeout đọc mạng là vô hạn.
Khi dịch vụ upstream phía đối tác bị nghẽn mạng hoặc deadlock database, các request gọi đi sẽ treo mãi mãi. 200 luồng xử lý của Tomcat sẽ bị giữ chặt chỉ sau 2 phút cao điểm, khiến toàn bộ ứng dụng sập vì cạn kiệt luồng (**Thread Starvation**).
**Biện pháp khắc phục**: Luôn luôn cấu hình rõ ràng <code>connectTimeout</code> và <code>readTimeout</code> thông qua <code>JdkClientHttpRequestFactory</code> như trong phần cấu hình mã nguồn.

### Cạm bẫy 4: Lệch định dạng ngày tháng giữa OpenAPI và Jackson
OpenAPI chuẩn sử dụng chuỗi ISO-8601 theo chuẩn RFC 3339 (ví dụ: <code>2026-10-03T15:30:00Z</code>). Nếu phía Java cấu hình ObjectMapper không đồng bộ, Jackson có thể serialize <code>OffsetDateTime</code> hoặc <code>Instant</code> thành số nguyên Unix timestamp (<code>1718002341000</code>). Điều này khiến các client TypeScript biên dịch từ hợp đồng bị lỗi Runtime khi parse ngày tháng.
**Biện pháp khắc phục**: Cấu hình trong <code>application.yml</code>:
~~~yaml
spring:
  jackson:
    serialization:
      write-dates-as-timestamps: false
~~~

---

## 5. Thử thách Thực chiến (Hands-on Challenge)

### Đề bài:
Xây dựng Subsystem Tích hợp Cổng Thanh toán Quốc tế (Cross-Border Payment Gateway Client):
1. Thiết kế hợp đồng <code>payment-gateway-spec.yaml</code> định nghĩa endpoint:
   - <code>POST /api/v1/payments/checkout</code>
   - Request: <code>merchantId</code>, <code>orderId</code>, <code>amount</code>, <code>currency</code> (chỉ chấp nhận USD, EUR, VND).
   - Response: <code>transactionRef</code>, <code>paymentUrl</code>, <code>expiresAt</code>.
2. Triển khai Declarative HTTP Interface <code>PaymentGatewayClient</code> với Spring Boot 3.2+:
   - Tự động bổ sung Header chữ ký bảo mật <code>X-Signature: HMAC-SHA256(...)</code> vào mọi request gọi đi thông qua <code>ClientHttpRequestInterceptor</code>.
   - Bắt các mã lỗi HTTP <code>4xx</code> và <code>5xx</code> từ Gateway và chuyển đổi thành ngoại lệ có cấu trúc <code>PaymentIntegrationException</code>.

### Lời giải Chuẩn Kỹ sư Cấp cao:

~~~java
package vn.mastery.payment.integration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.service.annotation.PostExchange;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;

// 1. Các DTO Hợp đồng bất biến
public final class PaymentContracts {
    public record CheckoutRequest(String merchantId, String orderId, long amount, String currency) {}
    public record CheckoutResponse(String transactionRef, String paymentUrl, Instant expiresAt) {}
}

// 2. Ngoại lệ nghiệp vụ có cấu trúc
class PaymentIntegrationException extends RuntimeException {
    private final int statusCode;
    public PaymentIntegrationException(int statusCode, String message) {
        super(message);
        this.statusCode = statusCode;
    }
    public int getStatusCode() { return statusCode; }
}

// 3. Khai báo Declarative HTTP Interface
@HttpExchange(url = "/api/v1/payments", accept = MediaType.APPLICATION_JSON_VALUE)
public interface PaymentGatewayClient {

    @PostExchange(value = "/checkout", contentType = MediaType.APPLICATION_JSON_VALUE)
    PaymentContracts.CheckoutResponse createCheckout(
            @RequestBody PaymentContracts.CheckoutRequest request);
}

// 4. Cấu hình Client với HMAC Signature Interceptor & Timeout chuẩn mực
@Configuration
public class PaymentGatewayConfiguration {

    private static final Logger log = LoggerFactory.getLogger(PaymentGatewayConfiguration.class);

    @Value("\${gateway.api.base-url:https://sandbox.paymentgw.com}")
    private String gatewayBaseUrl;

    @Value("\${gateway.api.secret-key:my-super-secret-hmac-key}")
    private String secretKey;

    @Bean
    public PaymentGatewayClient paymentGatewayClient() {
        // Interceptor tự động tạo Header chữ ký HMAC-SHA256 bảo vệ toàn vẹn gói tin
        ClientHttpRequestInterceptor hmacInterceptor = (request, body, execution) -> {
            long timestamp = System.currentTimeMillis();
            String payloadToSign = timestamp + "." + new String(body, StandardCharsets.UTF_8);
            String signature = calculateHmacSha256(payloadToSign, secretKey);

            request.getHeaders().add("X-Timestamp", String.valueOf(timestamp));
            request.getHeaders().add("X-Signature", signature);
            request.getHeaders().add(HttpHeaders.USER_AGENT, "Mastery-Payment-Service/1.0");

            log.debug("Đã đính kèm chữ ký bảo mật X-Signature cho request tới Gateway");
            return execution.execute(request, body);
        };

        // Cấu hình Socket Factory với timeout an toàn
        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .connectTimeout(Duration.ofSeconds(3))
                .build();

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(4));

        RestClient restClient = RestClient.builder()
                .baseUrl(gatewayBaseUrl)
                .requestFactory(requestFactory)
                .requestInterceptor(hmacInterceptor)
                .defaultStatusHandler(HttpStatusCode::isError, (req, res) -> {
                    String errorBody = new String(res.getBody().readAllBytes(), StandardCharsets.UTF_8);
                    log.error("Cổng thanh toán phản hồi lỗi HTTP {}: {}", res.getStatusCode(), errorBody);
                    throw new PaymentIntegrationException(
                            res.getStatusCode().value(), 
                            "Cổng thanh toán từ chối xử lý: " + errorBody);
                })
                .build();

        HttpServiceProxyFactory proxyFactory = HttpServiceProxyFactory
                .builderFor(RestClientAdapter.create(restClient))
                .build();

        return proxyFactory.createClient(PaymentGatewayClient.class);
    }

    private static String calculateHmacSha256(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(rawHmac);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("Không thể khởi tạo thuật toán HMAC", e);
        }
    }
}
~~~

:::takeaways
- **Hợp đồng là Nguồn chân lý duy nhất**: Tuyệt đối không để code Java quyết định hình dạng API. Viết bản đặc tả OpenAPI YAML trước, duyệt chung với các bên liên quan, sau đó dùng plugin để sinh mã nguồn.
- **Trình biên dịch là Người bảo vệ**: Sử dụng <code>interfaceOnly=true</code> để Controller buộc phải <code>implements</code> Interface được generate. Bất kỳ sự lệch pha nào giữa code và hợp đồng sẽ lập tức biến thành lỗi biên dịch.
- **Phát triển Song song với Prism Mock Server**: Frontend và Mobile có thể tích hợp với mock server chuẩn OpenAPI ngay từ ngày đầu tiên mà không phụ thuộc vào tiến độ của Backend.
- **Chặn đứng Breaking Changes trong CI**: Sử dụng <code>openapi-diff</code> để kiểm tra tính tương thích ngược của hợp đồng và Pact CDC để đảm bảo không vi phạm kỳ vọng của các consumer.
- **Chuẩn giao tiếp Microservices hiện đại**: Thay thế hoàn toàn <code>RestTemplate</code> và <code>OpenFeign</code> bằng <code>RestClient</code> (Spring Boot 3.2+) kết hợp <code>Declarative HTTP Interfaces</code> (<code>@HttpExchange</code>) cùng <code>JdkClientHttpRequestFactory</code> cho hiệu năng HTTP/2 tối đa.
:::
`
    },
    {
      id: "2-8",
      type: "lesson",
      title: "Spring for GraphQL: Schema-First, Resolvers, BatchMapping (N+1 Solution) & Security Shield",
      minutes: 50,
      content: `
## Mobile chỉ cần 3 trường, REST trả về 40 trường: Nỗi đau Over-fetching & Under-fetching

Trong kiến trúc REST truyền thống, các endpoint thường được thiết kế xoay quanh Thực thể Dữ liệu (Resource-Centric):
- <code>GET /api/v1/members/{cif}</code>: Trả về toàn bộ hồ sơ khách hàng (40-50 trường gồm CCCD, ngày sinh, địa chỉ, trạng thái KYC...).
- <code>GET /api/v1/members/{cif}/accounts</code>: Trả về danh sách tài khoản thanh toán.
- <code>GET /api/v1/members/{cif}/loyalty</code>: Trả về điểm thưởng tích lũy.

Khi xây dựng màn hình Dashboard tổng quan trên ứng dụng Mobile:
1. **Nạn Over-fetching (Thừa mứa dữ liệu)**: Màn hình chỉ cần hiển thị Tên và Hạng thành viên, nhưng phải tải về toàn bộ payload JSON 10KB chứa 50 trường không dùng đến. Đối với người dùng mạng 3G/4G chập chờn, điều này làm chậm ứng dụng và tốn pin thiết bị.
2. **Nạn Under-fetching & Network Waterfalls (Thiếu dữ liệu)**: Để hiển thị đầy đủ màn hình Dashboard, app Mobile phải kích hoạt liên tiếp 3 đến 5 HTTP requests. Mỗi request phải chịu độ trễ RTT (Round Trip Time), dẫn đến hiện tượng giật lag giao diện.

**GraphQL** ra đời để giải quyết triệt để 2 vấn đề trên: Client có quyền quyết định chính xác hình dạng dữ liệu cần nhận thông qua **một câu truy vấn (Query) duy nhất**. Bài học này cung cấp kiến trúc chuyên sâu của **Spring for GraphQL** (ra mắt từ Spring Boot 2.7 & hoàn thiện trên Spring Boot 3), giải quyết dứt điểm thảm họa **N+1 Query** và thiết lập lá chắn bảo mật chống tấn công DoS.

---

## 1. Bản chất Kiến trúc & Cơ chế Tầng Mạng (Under the Hood)

### 1.1 So sánh Toàn diện REST API vs GraphQL API

| Tiêu chí | RESTful API | GraphQL API (Spring for GraphQL) |
| :--- | :--- | :--- |
| **Giao thức Vận chuyển** | HTTP methods đa dạng (GET, POST, PUT, DELETE) | Thường dùng duy nhất **HTTP POST** tới endpoint <code>/graphql</code> |
| **Cơ chế Lấy Dữ liệu** | Server cố định cấu trúc phản hồi | **Client tùy ý chọn các trường (Declarative Data Fetching)** |
| **Số lượng Request** | Nhiều request tuần tự (Waterfalls) | **1 request duy nhất gom toàn bộ dữ liệu** |
| **Bộ đệm Tầng Mạng (HTTP Caching)** | Rất mạnh mẽ (dựa trên GET, ETag, Cache-Control) | Phức tạp (vì luôn là POST, phải dùng Persisted Queries hoặc CDN riêng) |
| **Kiểm soát Kiểu (Type Safety)** | Phụ thuộc OpenAPI / JSON Schema | **Nghiêm ngặt với Schema Definition Language (SDL)** |
| **Rủi ro Hiệu năng** | Quản lý dễ dàng ở từng Endpoint | **Dễ dính N+1 Query và tấn công DoS đệ quy sâu nếu cấu hình sai** |

### 1.2 Luồng Xử lý Nội bộ của Spring for GraphQL
Spring for GraphQL được xây dựng trên nền tảng của engine **GraphQL Java** và mô hình Reactive **Project Reactor**:

~~~text
+-----------------------------------------------------------------------------------+
|                        Kiến trúc Xử lý Spring for GraphQL                         |
+-----------------------------------------------------------------------------------+

     Client (Web / Mobile App)
                 |
                 | HTTP POST /graphql (Chứa query + variables JSON)
                 v
   +---------------------------+
   |   GraphQlHttpHandler      |
   +---------------------------+
                 |
                 v
   +---------------------------+
   | ExecutionGraphQlService   |
   +---------------------------+
                 |
                 v
   +--------------------------------------------------------------------+
   | 1. Parse AST & Validate Document                                   |
   |    - Phân tích cú pháp chuỗi query thành cây AST                   |
   |    - Kiểm tra tính hợp lệ với schema.graphqls                      |
   |    - Chặn đứng truy vấn nếu vượt quá Max Depth hoặc Max Complexity |
   +--------------------------------------------------------------------+
                 |
                 v
   +--------------------------------------------------------------------+
   | 2. Execution Engine & DataFetcher Invoker                          |
   |    - @QueryMapping: Tìm Root Query (ví dụ: memberByCif)            |
   |    - @SchemaMapping: Tìm các trường lồng nhau                      |
   |    - @BatchMapping: Gom toàn bộ các Sub-query vào DataLoader       |
   +--------------------------------------------------------------------+
                 |
                 v
   +--------------------------------------------------------------------+
   | 3. DataLoader Registry (Batch Execution)                           |
   |    - Tự động hoãn các truy vấn con đến cuối chu kỳ                 |
   |    - Thực thi 1 câu lệnh SQL 'WHERE id IN (...)' duy nhất          |
   +--------------------------------------------------------------------+
                 |
                 v
   +---------------------------+
   | Phản hồi JSON { data, ...}|
   +---------------------------+
~~~

### 1.3 Cơ chế Hoạt động của DataLoader Giải cứu N+1 Query
Giả sử ta truy vấn danh sách 20 thành viên kèm theo thông tin thẻ tín dụng của họ:
- **Cách làm ngây thơ (Naive DataFetcher)**:
  1. Câu lệnh 1: <code>SELECT * FROM members LIMIT 20;</code> -> Trả về 20 members.
  2. Câu lệnh 2 -> 21: Với mỗi member, gọi 1 câu lệnh <code>SELECT * FROM cards WHERE member_id = ?;</code>.
  => **Tổng cộng 21 câu lệnh SQL (N + 1)**. Nếu lấy 1,000 bản ghi, DB sẽ sập lập tức!
- **Cơ chế DataLoader (Batch Mapping)**:
  1. Khi duyệt qua 20 members, GraphQL Java không gọi DB ngay mà ghi nhận 20 <code>memberId</code> vào hàng đợi của DataLoader.
  2. Khi tầng hiện tại kết thúc, DataLoader gom (Dispatch) toàn bộ 20 <code>memberId</code> và thực thi:
     <code>SELECT * FROM cards WHERE member_id IN (?, ?, ..., ?);</code> (Chỉ **1 câu lệnh duy nhất**).
  3. Kết quả được phân phối lại chính xác cho từng member trong bộ nhớ.
  => **Tổng cộng đúng 2 câu lệnh SQL** bất kể có bao nhiêu bản ghi!

---

## 2. Triển khai Mã nguồn Thực chiến (Production-Grade Code)

### 2.1 File Định nghĩa Hợp đồng: schema.graphqls
Đặt file tại thư mục <code>src/main/resources/graphql/schema.graphqls</code>. Đây là Schema Definition Language (SDL) chuẩn:

~~~graphql
# Định nghĩa các Custom Scalar
scalar DateTime

# Kiểu dữ liệu Thành viên
type Member {
    id: ID!
    cif: String!
    fullName: String!
    email: String!
    tier: MemberTier!
    balance: AccountBalance!
    cards: [CreditCard!]!
    recentTransactions(limit: Int = 5): [Transaction!]!
}

enum MemberTier {
    STANDARD
    SILVER
    GOLD
    PLATINUM
}

type AccountBalance {
    availablePoints: Int!
    pendingPoints: Int!
    currency: String!
}

type CreditCard {
    cardId: ID!
    cardNumberMasked: String!
    cardType: String!
    creditLimit: Float!
    status: String!
}

type Transaction {
    id: ID!
    amount: Float!
    description: String!
    createdAt: DateTime!
}

# Root Query
type Query {
    memberByCif(cif: String!): Member
    members(page: Int = 0, size: Int = 10): [Member!]!
}

# Root Mutation
type Mutation {
    registerMember(input: RegisterMemberInput!): Member!
    transferPoints(fromCif: String!, toCif: String!, points: Int!): Boolean!
}

input RegisterMemberInput {
    cif: String!
    fullName: String!
    email: String!
}
~~~

### 2.2 Controller Xử lý Truy vấn & Khử triệt để N+1 với @BatchMapping
Trong Spring for GraphQL:
- <code>@QueryMapping</code>: Xử lý các trường gốc (Root Fields) trong <code>type Query</code>.
- <code>@SchemaMapping</code>: Xử lý từng trường phụ thuộc lồng nhau.
- <code>@BatchMapping</code>: Tự động đăng ký DataLoader, nhận danh sách cha và trả về tập dữ liệu con trong một thao tác duy nhất.

~~~java
package vn.mastery.graphql.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.BatchMapping;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;
import vn.mastery.graphql.domain.*;
import vn.mastery.graphql.repository.CardRepository;
import vn.mastery.graphql.repository.MemberRepository;
import vn.mastery.graphql.repository.TransactionRepository;

import java.util.*;
import java.util.stream.Collectors;

@Controller
public class MemberGraphQlController {

    private static final Logger log = LoggerFactory.getLogger(MemberGraphQlController.class);

    private final MemberRepository memberRepository;
    private final CardRepository cardRepository;
    private final TransactionRepository transactionRepository;

    public MemberGraphQlController(MemberRepository memberRepository,
                                   CardRepository cardRepository,
                                   TransactionRepository transactionRepository) {
        this.memberRepository = memberRepository;
        this.cardRepository = cardRepository;
        this.transactionRepository = transactionRepository;
    }

    // 1. Root Query: Tìm thành viên theo CIF
    @QueryMapping
    public Member memberByCif(@Argument String cif) {
        log.info("GraphQL Query memberByCif: {}", cif);
        return memberRepository.findByCif(cif)
                .orElseThrow(() -> new MemberNotFoundException("Không tìm thấy thành viên: " + cif));
    }

    // 2. Root Query: Lấy danh sách thành viên phân trang
    @QueryMapping
    public List<Member> members(@Argument int page, @Argument int size) {
        log.info("GraphQL Query members page={}, size={}", page, size);
        return memberRepository.findAllPaged(page, size);
    }

    // 3. SchemaMapping: Trường balance đơn giản tính toán trực tiếp từ đối tượng cha
    @SchemaMapping(typeName = "Member", field = "balance")
    public AccountBalance balance(Member member) {
        return new AccountBalance(member.points(), 0, "VND");
    }

    // 4. BATCH MAPPING: VŨ KHÍ DIỆT N+1 QUERY KINH ĐIỂN
    // Thay vì gọi database từng member một, Spring tự động gom List<Member> thành 1 batch!
    @BatchMapping(typeName = "Member", field = "cards")
    public Map<Member, List<CreditCard>> cards(List<Member> members) {
        log.info("Đang xử lý @BatchMapping cards cho {} members...", members.size());

        // Thu thập toàn bộ ID thành viên trong một batch
        List<Long> memberIds = members.stream().map(Member::id).toList();

        // Thực thi 1 CÂU QUERY DUY NHẤT: SELECT * FROM cards WHERE member_id IN (...)
        List<CreditCard> allCards = cardRepository.findAllByMemberIdIn(memberIds);

        // Gom nhóm các thẻ theo memberId trong RAM
        Map<Long, List<CreditCard>> cardsByMemberId = allCards.stream()
                .collect(Collectors.groupingBy(CreditCard::memberId));

        // Trả về ánh xạ chính xác từ từng đối tượng Member sang danh sách Card của họ
        Map<Member, List<CreditCard>> resultMap = new HashMap<>();
        for (Member member : members) {
            resultMap.put(member, cardsByMemberId.getOrDefault(member.id(), Collections.emptyList()));
        }

        return resultMap;
    }

    // 5. Root Mutation: Đăng ký thành viên mới
    @MutationMapping
    public Member registerMember(@Argument RegisterMemberInput input) {
        log.info("GraphQL Mutation registerMember: {}", input.fullName());
        return memberRepository.save(new Member(
                null,
                input.cif(),
                input.fullName(),
                input.email(),
                MemberTier.STANDARD,
                0
        ));
    }
}
~~~

### 2.3 Xử lý Ngoại lệ Tùy biến Chuẩn GraphQL: DataFetcherExceptionResolver
Khi phát sinh lỗi nghiệp vụ, REST trả về mã HTTP <code>404</code> hoặc <code>400</code>. Trong GraphQL, mã trạng thái HTTP luôn là <code>200 OK</code>, còn chi tiết lỗi được đóng gói trong mảng <code>errors</code> của payload JSON:

~~~java
package vn.mastery.graphql.config;

import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.stereotype.Component;
import vn.mastery.graphql.domain.MemberNotFoundException;

import java.time.Instant;
import java.util.Map;

@Component
public class GraphQlExceptionResolver extends DataFetcherExceptionResolverAdapter {

    @Override
    protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment env) {
        if (ex instanceof MemberNotFoundException) {
            return GraphqlErrorBuilder.newError()
                    .errorType(ErrorType.NOT_FOUND)
                    .message(ex.getMessage())
                    .path(env.getExecutionStepInfo().getPath())
                    .location(env.getField().getSourceLocation())
                    .extensions(Map.of(
                            "errorCode", "MEMBER_NOT_FOUND",
                            "timestamp", Instant.now().toString()
                    ))
                    .build();
        }

        if (ex instanceof IllegalArgumentException) {
            return GraphqlErrorBuilder.newError()
                    .errorType(ErrorType.BAD_REQUEST)
                    .message(ex.getMessage())
                    .path(env.getExecutionStepInfo().getPath())
                    .extensions(Map.of("errorCode", "INVALID_INPUT"))
                    .build();
        }

        // Lỗi không xác định: Trả về INTERNAL_ERROR nhưng giấu stack trace để bảo mật
        return GraphqlErrorBuilder.newError()
                .errorType(ErrorType.INTERNAL_ERROR)
                .message("Đã xảy ra sự cố nội bộ trong quá trình xử lý truy vấn")
                .path(env.getExecutionStepInfo().getPath())
                .build();
    }
}
~~~

### 2.4 Lá chắn Bảo mật: Giới hạn Độ sâu (Max Query Depth) & Độ phức tạp (Complexity)
Kẻ tấn công có thể dễ dàng đánh sập máy chủ GraphQL bằng các câu truy vấn lồng vô tận hoặc kéo quá nhiều quan hệ. Cấu hình bảo vệ:

~~~java
package vn.mastery.graphql.config;

import graphql.analysis.MaxQueryComplexityInstrumentation;
import graphql.analysis.MaxQueryDepthInstrumentation;
import org.springframework.boot.autoconfigure.graphql.GraphQlSourceBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GraphQlSecurityConfig {

    // Giới hạn độ sâu tối đa của cây truy vấn là 5 tầng
    // Chặn đứng các truy vấn đệ quy nguy hiểm: member { friends { friends { id } } }
    @Bean
    public MaxQueryDepthInstrumentation maxQueryDepthInstrumentation() {
        return new MaxQueryDepthInstrumentation(5);
    }

    // Giới hạn độ phức tạp tính toán tối đa là 150 điểm cho mỗi truy vấn
    @Bean
    public MaxQueryComplexityInstrumentation maxQueryComplexityInstrumentation() {
        return new MaxQueryComplexityInstrumentation(150);
    }

    @Bean
    public GraphQlSourceBuilderCustomizer sourceBuilderCustomizer() {
        return builder -> {
            // Tùy biến thêm các scalar hoặc instrumentation mở rộng
        };
    }
}
~~~

---

## 3. Thử nghiệm, Xác thực & Công cụ Tương tác (Verification & Tools)

### 3.1 Gửi Truy vấn GraphQL từ Terminal bằng cURL
Gửi HTTP POST với body chứa chuỗi <code>query</code> và đối tượng <code>variables</code>:

~~~bash
curl -X POST "http://localhost:8080/graphql" \
     -H "Content-Type: application/json" \
     -d '{
       "query": "query GetMemberDashboard($cif: String!) { memberByCif(cif: $cif) { cif fullName tier balance { availablePoints currency } cards { cardNumberMasked creditLimit } } }",
       "variables": { "cif": "0123456789" }
     }'
~~~

Phản hồi chuẩn từ Spring Boot (HTTP 200 OK):
~~~json
{
  "data": {
    "memberByCif": {
      "cif": "0123456789",
      "fullName": "Nguyen Van A",
      "tier": "PLATINUM",
      "balance": {
        "availablePoints": 15400,
        "currency": "VND"
      },
      "cards": [
        {
          "cardNumberMasked": "**** **** **** 8899",
          "creditLimit": 50000000.0
        }
      ]
    }
  }
}
~~~

### 3.2 Kiểm tra Xử lý Lỗi Tùy biến
Khi truyền vào một mã CIF không tồn tại:
~~~bash
curl -X POST "http://localhost:8080/graphql" \
     -H "Content-Type: application/json" \
     -d '{ "query": "{ memberByCif(cif: \"9999999999\") { fullName } }" }'
~~~

Kết quả trả về mảng <code>errors</code> với đầy đủ thông tin ngữ cảnh:
~~~json
{
  "errors": [
    {
      "message": "Không tìm thấy thành viên: 9999999999",
      "locations": [{ "line": 1, "column": 3 }],
      "path": ["memberByCif"],
      "extensions": {
        "classification": "NOT_FOUND",
        "errorCode": "MEMBER_NOT_FOUND",
        "timestamp": "2026-10-03T10:45:00.000Z"
      }
    }
  ],
  "data": {
    "memberByCif": null
  }
}
~~~

### 3.3 Môi trường GraphiQL IDE Nội bộ
Trong môi trường phát triển (Local / Dev), bật GraphiQL IDE để kiểm thử tương tác trực quan:
~~~yaml
# application-dev.yml
spring:
  graphql:
    graphiql:
      enabled: true
      path: /graphiql
~~~
Truy cập <code>http://localhost:8080/graphiql</code> trên trình duyệt để sử dụng giao diện tự động gợi ý code (Intellisense) và tài liệu trực tiếp (Schema Documentation).

---

## 4. Cạm bẫy Triển khai & Khắc phục Sự cố (Production Pitfalls)

### Cạm bẫy 1: Thảm họa N+1 lén lút (Silent N+1 Problem)
Trong REST API, việc phát sinh N+1 query thường lộ rõ ngay trong Repository method. Nhưng trong GraphQL, N+1 query sinh ra **ở tầng Resolver**.
Khi bạn viết:
~~~java
@SchemaMapping(typeName = "Member", field = "cards")
public List<CreditCard> cards(Member member) {
    return cardRepository.findByMemberId(member.id()); // ❌ THẢM HỌA: Chạy 1 query cho mỗi member!
}
~~~
Khi test trên máy dev với 1 member, câu lệnh SQL chạy êm ru. Nhưng khi lên Production, client gọi <code>members(size: 100) { cards { id } }</code> -> Hệ thống sẽ bắn ra **101 câu query đồng thời**, cạn kiệt HikariCP Connection Pool trong nháy mắt!
**Biện pháp**: Bắt buộc dùng <code>@BatchMapping</code> để batching các quan hệ 1-N hoặc N-N.

### Cạm bẫy 2: Bật GraphiQL & Introspection Schema trên Production
Introspection là tính năng cho phép client gửi câu truy vấn <code>{ __schema { types { name fields { name } } } }</code> để tải về toàn bộ sơ đồ cấu trúc hệ thống.
Nếu để lộ tính năng này trên Production:
1. Kẻ tấn công biết chính xác mọi bảng dữ liệu, trường nhạy cảm, quan hệ nội bộ mà không cần đoán mò.
2. Tạo điều kiện cho hacker quét lỗ hổng logic nghiệp vụ tự động.
**Biện pháp khắc phục**: Luôn tắt Introspection và GraphiQL trong file cấu hình Production:
~~~yaml
# application-prod.yml
spring:
  graphql:
    graphiql:
      enabled: false
    schema:
      introspection:
        enabled: false # Tắt lược đồ soi chiếu trên Production
~~~

### Cạm bẫy 3: Bỏ quên Tấn công DoS bằng Truy vấn Đệ quy Sâu (Deep Query Attack)
Nếu schema có quan hệ 2 chiều:
~~~graphql
type User {
    friends: [User!]!
}
~~~
Kẻ tấn công chỉ cần gửi một payload 500 ký tự:
~~~graphql
query {
    me {
        friends {
            friends {
                friends {
                    friends {
                        # lặp lại 100 lần
                    }
                }
            }
        }
    }
}
~~~
Engine GraphQL sẽ phân rã cây AST thành hàng tỷ node, làm CPU máy chủ nhảy vọt lên 100% và gây tràn bộ nhớ JVM Heap (OutOfMemoryError).
**Biện pháp khắc phục**: Luôn kích hoạt <code>MaxQueryDepthInstrumentation(5)</code>.

---

## 5. Thử thách Thực chiến (Hands-on Challenge)

### Đề bài:
Xây dựng BFF GraphQL Gateway cho Ngân hàng Số tổng hợp thông tin Khách hàng, Tài khoản và Tiết kiệm:
1. Định nghĩa Schema cho đối tượng <code>Customer</code>, <code>BankAccount</code>, và <code>SavingBook</code>.
2. Triển khai Controller với phương thức <code>@QueryMapping customerProfile(cif: String!)</code>.
3. Triển khai <code>@BatchMapping</code> cho trường <code>savingBooks</code> nhận vào danh sách Khách hàng, truy vấn toàn bộ sổ tiết kiệm tương ứng bằng duy nhất 1 lần truy vấn dữ liệu theo cơ chế Batching.
4. Cấu hình kiểm soát an ninh: Giới hạn độ sâu tối đa là 4 tầng.

### Lời giải Chuẩn Kỹ sư Cấp cao:

~~~java
package vn.mastery.graphql.challenge;

import graphql.analysis.MaxQueryDepthInstrumentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.BatchMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

// 1. Định nghĩa các Domain Records bất biến
public final class BankingModels {
    public record Customer(Long id, String cif, String fullName, String phone) {}
    public record BankAccount(Long id, Long customerId, String accountNumber, double balance) {}
    public record SavingBook(Long id, Long customerId, String depositCode, double principal, 
                             double interestRate, LocalDate maturityDate) {}
}

// 2. Interface Giả lập Truy vấn Dữ liệu Batch
@Repository
class SavingBookRepository {
    private static final Logger log = LoggerFactory.getLogger(SavingBookRepository.class);

    public List<BankingModels.SavingBook> findAllByCustomerIdIn(List<Long> customerIds) {
        log.info("SQL Executed: SELECT * FROM saving_books WHERE customer_id IN ({})", 
                 customerIds.stream().map(String::valueOf).collect(Collectors.joining(",")));

        // Giả lập dữ liệu trả về từ Database
        List<BankingModels.SavingBook> mockData = new ArrayList<>();
        for (Long custId : customerIds) {
            mockData.add(new BankingModels.SavingBook(
                    custId * 100 + 1,
                    custId,
                    "STK-" + custId + "-01",
                    200_000_000.0,
                    6.5,
                    LocalDate.now().plusMonths(6)
            ));
        }
        return mockData;
    }
}

// 3. Controller GraphQL Chuẩn Doanh nghiệp
@Controller
class BankingGraphQlController {

    private static final Logger log = LoggerFactory.getLogger(BankingGraphQlController.class);
    private final SavingBookRepository savingBookRepository;

    public BankingGraphQlController(SavingBookRepository savingBookRepository) {
        this.savingBookRepository = savingBookRepository;
    }

    @QueryMapping
    public BankingModels.Customer customerProfile(@Argument String cif) {
        log.info("GraphQL Query: customerProfile cif={}", cif);
        return new BankingModels.Customer(101L, cif, "Tran Van B", "0901234567");
    }

    @QueryMapping
    public List<BankingModels.Customer> topCustomers() {
        return List.of(
                new BankingModels.Customer(101L, "CIF101", "Tran Van B", "0901234567"),
                new BankingModels.Customer(102L, "CIF102", "Le Thi C", "0907654321")
        );
    }

    // Khử triệt để N+1 cho toàn bộ danh sách Khách hàng
    @BatchMapping(typeName = "Customer", field = "savingBooks")
    public Map<BankingModels.Customer, List<BankingModels.SavingBook>> savingBooks(
            List<BankingModels.Customer> customers) {

        log.info("Kích hoạt BatchLoader gom dữ liệu sổ tiết kiệm cho {} khách hàng...", customers.size());
        List<Long> customerIds = customers.stream().map(BankingModels.Customer::id).toList();

        // 1 lần truy vấn SQL duy nhất với điều kiện IN
        List<BankingModels.SavingBook> allBooks = savingBookRepository.findAllByCustomerIdIn(customerIds);

        Map<Long, List<BankingModels.SavingBook>> booksGroupedByCustId = allBooks.stream()
                .collect(Collectors.groupingBy(BankingModels.SavingBook::customerId));

        Map<BankingModels.Customer, List<BankingModels.SavingBook>> resultMap = new HashMap<>();
        for (BankingModels.Customer cust : customers) {
            resultMap.put(cust, booksGroupedByCustId.getOrDefault(cust.id(), Collections.emptyList()));
        }

        return resultMap;
    }
}

// 4. Cấu hình An ninh Tầng GraphQL
@Configuration
class BankingSecurityConfig {

    @Bean
    public MaxQueryDepthInstrumentation queryDepthShield() {
        // Giới hạn cây truy vấn tối đa 4 tầng để chặn DoS
        return new MaxQueryDepthInstrumentation(4);
    }
}
~~~

:::takeaways
- **Khi nào chọn GraphQL**: Rất phù hợp cho lớp **Backend-For-Frontend (BFF)** phục vụ các ứng dụng Mobile/Dashboard cần gom nhiều nguồn dữ liệu vào một phản hồi duy nhất với kích thước tối thiểu. Không nên dùng cho các tác vụ CRUD đơn giản hoặc Streaming file lớn.
- **Tư duy Schema-First**: Bản hợp đồng <code>schema.graphqls</code> là luật định. Mọi kiểu dữ liệu, trường, query, mutation đều phải được khai báo rõ ràng bằng cú pháp SDL trước khi viết code Java.
- **Khử N+1 bằng @BatchMapping**: Tuyệt đối không gọi Repository trong <code>@SchemaMapping</code> cho các trường danh sách quan hệ con. Luôn dùng <code>@BatchMapping</code> để GraphQL gom các ID và thực hiện 1 câu lệnh <code>WHERE id IN (...)</code> duy nhất.
- **Xử lý Ngoại lệ tập trung**: Kế thừa <code>DataFetcherExceptionResolverAdapter</code> để chuyển đổi các ngoại lệ miền nghiệp vụ thành mảng <code>errors</code> chuẩn GraphQL với <code>extensions.errorCode</code>.
- **Lá chắn An ninh bắt buộc**: Luôn trang bị <code>MaxQueryDepthInstrumentation</code> và <code>MaxQueryComplexityInstrumentation</code> để triệt tiêu các cuộc tấn công DoS bằng truy vấn đệ quy sâu, đồng thời **tắt Introspection** trên môi trường Production.
:::
`
    },
    {
      id: "2-9",
      type: "lesson",
      title: "RESTful Nâng cao: HATEOAS, API Versioning Strategies & Đa ngôn ngữ (i18n)",
      minutes: 50,
      content: `
## Client ghép chuỗi URL thủ công: Nguồn cơn của thảm họa vỡ giao diện

Trong hầu hết các ứng dụng di động và Frontend hiện nay, lập trình viên thường tự ghép chuỗi URL trong mã nguồn máy khách:
~~~javascript
// ❌ Mã nguồn Frontend ghép chuỗi thủ công:
const payUrl = '/api/v1/orders/' + orderId + '/payment';
const cancelUrl = '/api/v1/orders/' + orderId + '/cancellation';
~~~

Cách làm này tạo ra sự phụ thuộc chặt chẽ (Tight Coupling) giữa Frontend và cấu trúc URL của Backend. Khi đội Backend tái cấu trúc (Refactoring) chuyển <code>/cancellation</code> thành <code>/cancel</code> hoặc bổ sung quy trình phê duyệt phức tạp (đơn hàng chỉ được phép hủy nếu đang ở trạng thái <code>PENDING</code>), toàn bộ ứng dụng Mobile của khách hàng ngoài thị trường sẽ sập hàng loạt hoặc gửi các request không hợp lệ.

**HATEOAS (Hypermedia as the Engine of Application State)** giải quyết dứt điểm vấn đề này: Server trả về dữ liệu kèm theo **các đường dẫn hành động tiếp theo (Hypermedia Links)** mà người dùng được phép thực hiện dựa trên trạng thái hiện tại của tài nguyên. 

Đồng thời, khi hệ thống vươn ra thị trường quốc tế (như các dịch vụ Fintech vận hành tại Việt Nam, Đông Nam Á và Châu Phi), ứng dụng bắt buộc phải hỗ trợ **Đa ngôn ngữ (i18n)** và các chiến lược **Định phiên bản API (API Versioning)** an toàn, không làm gián đoạn người dùng cũ.

---

## 1. Bản chất Kiến trúc & Cơ chế Tầng Mạng (Under the Hood)

### 1.1 Thang đo Trưởng thành Richardson (Richardson Maturity Model)
Để đánh giá một hệ thống đạt chuẩn REST ở mức độ nào, kiến trúc sư Leonard Richardson đã đề xuất mô hình 4 cấp độ:

~~~text
+-----------------------------------------------------------------------------------+
|                        Richardson Maturity Model (RMM)                            |
+-----------------------------------------------------------------------------------+

  [ Level 3: Hypermedia Controls ]  <--- Chuẩn REST thuần khiết (HATEOAS)
         ^                               (Server điều hướng trạng thái qua Links)
         |
  [ Level 2: HTTP Verbs & Codes  ]  <--- 90% hệ thống Enterprise hiện nay dừng ở đây
         ^                               (Dùng GET/POST/PUT/DELETE, 200/201/404/409)
         |
  [ Level 1: Individual Resources]  <--- Có URI phân tách (/orders, /customers)
         ^                               nhưng dùng sai Verbs (POST cho mọi thứ)
         |
  [ Level 0: The Swamp of POX    ]  <--- RPC thô sơ (Chỉ có 1 endpoint duy nhất
                                         ví dụ: POST /api/service, payload XML/JSON)
~~~

### 1.2 So sánh 4 Chiến lược Định phiên bản API (API Versioning Strategies)

Khi API cần thay đổi cấu trúc dữ liệu không tương thích ngược (Breaking Change), việc quản lý phiên bản là bắt buộc. Dưới đây là 4 chiến lược phổ biến trong ngành:

| Chiến lược | Ví dụ URI / Request | Ưu điểm | Nhược điểm | Trường hợp Áp dụng |
| :--- | :--- | :--- | :--- | :--- |
| **1. URI Path Versioning** | <code>GET /api/v1/orders</code><br><code>GET /api/v2/orders</code> | - Dễ hiểu nhất, tường minh.<br>- Dễ cấu hình định tuyến trên NGINX / Cloudflare Gateway. | - Vi phạm tính bất biến của URI định danh thực thể. | **Tiêu chuẩn thực tế của 80% hệ thống Enterprise** |
| **2. Custom Request Header** | <code>GET /api/orders</code><br>Header: <code>X-API-Version: 2</code> | - Giữ nguyên vẻ đẹp của URI.<br>- Thân thiện với REST thuần. | - Khó kiểm thử trực tiếp trên thanh địa chỉ trình duyệt.<br>- Phải cấu hình CDN cache theo Header. | API nội bộ giữa các Microservices |
| **3. Media Type / Accept Header** | <code>GET /api/orders</code><br><code>Accept: application/vnd.company.v2+json</code> | - Đúng tinh thần REST của Roy Fielding (Content Negotiation). | - Phức tạp đối với client gọi API.<br>- Cấu hình WebMvc phức tạp hơn. | Public API cấp quốc tế (GitHub API, Stripe) |
| **4. Query Parameter** | <code>GET /api/orders?version=2</code> | - Rất dễ test từ trình duyệt.<br>- Tương thích tốt với các client legacy. | - Trộn lẫn tham số lọc dữ liệu và tham số định tuyến hệ thống. | Các dịch vụ thử nghiệm tạm thời |

### 1.3 Cơ chế Phân giải Ngôn ngữ (i18n Resolution Mechanism)
Trong Spring Boot, quá trình dịch thông điệp theo ngữ cảnh người dùng diễn ra theo luồng tự động:

~~~text
Client gửi HTTP Request
  Header: Accept-Language: vi-VN,vi;q=0.9,en-US;q=0.8
             |
             v
+-------------------------------+
|  AcceptHeaderLocaleResolver   |  <--- Phân tích Header và khớp với supportedLocales
+-------------------------------+
             |
             v (Xác định Locale: vi_VN)
+-------------------------------+
|  MessageSource                |
+-------------------------------+
             |
             +---> Tìm trong messages_vi_VN.properties
             |     (Nếu không thấy key)
             +---> Fallback về messages_vi.properties
             |     (Nếu vẫn không thấy key)
             +---> Fallback về messages.properties (Mặc định hệ thống)
             |
             v
Thông điệp đã bản địa hóa được trả về cho Client
~~~

---

## 2. Triển khai Mã nguồn Thực chiến (Production-Grade Code)

### 2.1 Triển khai Spring HATEOAS: ModelAssembler Điều hướng Động
Trong kịch bản đặt hàng thương mại điện tử:
- Nếu Đơn hàng ở trạng thái <code>PENDING_PAYMENT</code>: Server cấp liên kết thanh toán (<code>pay</code>) và hủy đơn (<code>cancel</code>).
- Nếu Đơn hàng đã ở trạng thái <code>COMPLETED</code>: Chỉ cấp liên kết tra cứu hóa đơn (<code>invoice</code>).
- Nếu Đơn hàng đã bị <code>CANCELLED</code>: Không cấp thêm bất kỳ liên kết hành động nào.

Khai báo dependency trong <code>pom.xml</code>:
~~~xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-hateoas</artifactId>
</dependency>
~~~

#### DTO Đại diện Siêu liên kết (OrderModel)
~~~java
package vn.mastery.advanced.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.hateoas.server.core.Relation;

import java.time.Instant;

@Relation(collectionRelation = "orders", itemRelation = "order")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderModel extends RepresentationModel<OrderModel> {

    private final String orderId;
    private final String customerId;
    private final double totalAmount;
    private final String status;
    private final Instant createdAt;

    public OrderModel(String orderId, String customerId, double totalAmount, 
                      String status, Instant createdAt) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.totalAmount = totalAmount;
        this.status = status;
        this.createdAt = createdAt;
    }

    public String getOrderId() { return orderId; }
    public String getCustomerId() { return customerId; }
    public double getTotalAmount() { return totalAmount; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
~~~

#### Assembler Gắn Siêu liên kết Động (OrderModelAssembler)
~~~java
package vn.mastery.advanced.assembler;

import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.stereotype.Component;
import vn.mastery.advanced.controller.OrderController;
import vn.mastery.advanced.dto.OrderModel;
import vn.mastery.advanced.entity.OrderEntity;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

@Component
public class OrderModelAssembler extends RepresentationModelAssemblerSupport<OrderEntity, OrderModel> {

    public OrderModelAssembler() {
        super(OrderController.class, OrderModel.class);
    }

    @Override
    public OrderModel toModel(OrderEntity entity) {
        OrderModel model = new OrderModel(
                entity.getId(),
                entity.getCustomerId(),
                entity.getTotalAmount(),
                entity.getStatus().name(),
                entity.getCreatedAt()
        );

        // 1. Luôn có self-link trỏ về chính đơn hàng
        model.add(linkTo(methodOn(OrderController.class).getOrderById(entity.getId())).withSelfRel());

        // 2. Link trỏ về danh sách tổng
        model.add(linkTo(methodOn(OrderController.class).getAllOrders()).withRel("orders"));

        // 3. ĐIỀU HƯỚNG ĐỘNG DỰA TRÊN TRẠNG THÁI (State-Driven Hypermedia)
        switch (entity.getStatus()) {
            case PENDING_PAYMENT -> {
                model.add(linkTo(methodOn(OrderController.class)
                        .processPayment(entity.getId())).withRel("pay"));
                model.add(linkTo(methodOn(OrderController.class)
                        .cancelOrder(entity.getId())).withRel("cancel"));
            }
            case PROCESSING -> {
                model.add(linkTo(methodOn(OrderController.class)
                        .trackShipment(entity.getId())).withRel("tracking"));
            }
            case COMPLETED -> {
                model.add(linkTo(methodOn(OrderController.class)
                        .downloadInvoice(entity.getId())).withRel("invoice"));
            }
            case CANCELLED -> {
                // Không thêm action link nào vì chu trình đã kết thúc
            }
        }

        return model;
    }
}
~~~

### 2.2 Cấu hình Toàn diện Hệ thống Đa ngôn ngữ (i18n Configuration)

#### Cấu hình LocaleResolver và MessageSource trong Java
~~~java
package vn.mastery.advanced.config;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;

@Configuration
public class InternationalizationConfig {

    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        // Ngôn ngữ mặc định nếu client không truyền Header
        resolver.setDefaultLocale(Locale.of("vi"));
        // Danh sách ngôn ngữ hệ thống chính thức hỗ trợ
        resolver.setSupportedLocales(List.of(
                Locale.of("vi"),
                Locale.of("en")
        ));
        return resolver;
    }

    @Bean
    public MessageSource messageSource() {
        ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource();
        messageSource.setBasename("classpath:i18n/messages");
        messageSource.setDefaultEncoding(StandardCharsets.UTF_8.name());
        messageSource.setCacheSeconds(3600); // Tự động reload file properties mà không cần khởi động lại app
        messageSource.setFallbackToSystemLocale(false); // Ngăn không lấy locale ngẫu nhiên của OS máy chủ
        return messageSource;
    }

    // Kết nối MessageSource vào hệ thống Bean Validation để dịch lỗi validation
    @Bean
    public LocalValidatorFactoryBean validator(MessageSource messageSource) {
        LocalValidatorFactoryBean bean = new LocalValidatorFactoryBean();
        bean.setValidationMessageSource(messageSource);
        return bean;
    }
}
~~~

#### Các File Tài nguyên Thông điệp (Resource Bundles)
Tạo thư mục <code>src/main/resources/i18n/</code>:

1. **messages.properties** (Bản mặc định hệ thống):
~~~properties
order.notfound=Order not found with identifier: {0}
order.payment.failed=Payment processing failed. Current balance is insufficient.
order.validation.amount.min=Order total amount must be at least {value} VND.
order.status.invalid_transition=Cannot transition order from {0} to {1}.
~~~

2. **messages_vi.properties** (Tiếng Việt):
~~~properties
order.notfound=Không tìm thấy đơn hàng với mã định danh: {0}
order.payment.failed=Xử lý thanh toán thất bại. Số dư hiện tại không đủ để thực hiện.
order.validation.amount.min=Tổng giá trị đơn hàng phải đạt tối thiểu {value} VNĐ.
order.status.invalid_transition=Không thể chuyển trạng thái đơn hàng từ {0} sang {1}.
~~~

3. **messages_en.properties** (Tiếng Anh):
~~~properties
order.notfound=Cannot locate order with ID: {0}
order.payment.failed=Payment rejected: Insufficient funds in member account.
order.validation.amount.min=Minimum required order amount is {value} VND.
order.status.invalid_transition=Illegal state transition from {0} to {1}.
~~~

### 2.3 Global Exception Handler Tích hợp RFC 7807 & i18n
~~~java
package vn.mastery.advanced.exception;

import org.slf4j.MDC;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.Instant;
import java.util.Locale;

@RestControllerAdvice
public class GlobalI18nExceptionHandler {

    private final MessageSource messageSource;

    public GlobalI18nExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    @ExceptionHandler(OrderNotFoundException.class)
    public ProblemDetail handleOrderNotFound(OrderNotFoundException ex) {
        // Tự động lấy Locale của Request hiện tại từ ThreadLocal
        Locale locale = LocaleContextHolder.getLocale();

        // Dịch thông báo theo ngôn ngữ người dùng
        String localizedDetail = messageSource.getMessage(
                "order.notfound",
                new Object[]{ ex.getOrderId() },
                locale
        );

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND, 
                localizedDetail
        );
        problemDetail.setType(URI.create("https://api.mastery.vn/errors/order-not-found"));
        
        // Title và ErrorCode luôn giữ tiếng Anh chuẩn cho máy tính và hệ thống Log giám sát
        problemDetail.setTitle("Order Not Found");
        problemDetail.setProperty("errorCode", "ORDER_NOT_FOUND");
        problemDetail.setProperty("timestamp", Instant.now());
        problemDetail.setProperty("traceId", MDC.get("traceId"));

        return problemDetail;
    }
}
~~~

### 2.4 Controller Hỗ trợ HATEOAS và Đa Chiến lược Versioning
~~~java
package vn.mastery.advanced.controller;

import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.mastery.advanced.assembler.OrderModelAssembler;
import vn.mastery.advanced.dto.OrderModel;
import vn.mastery.advanced.entity.OrderEntity;
import vn.mastery.advanced.entity.OrderStatus;
import vn.mastery.advanced.exception.OrderNotFoundException;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderModelAssembler assembler;

    public OrderController(OrderModelAssembler assembler) {
        this.assembler = assembler;
    }

    // CHIẾN LƯỢC 1: URI Path Versioning qua đường dẫn /api/v1/orders/{id}
    @GetMapping("/v1/{id}")
    public EntityModel<OrderModel> getOrderV1(@PathVariable String id) {
        OrderEntity entity = findOrderMock(id);
        return EntityModel.of(assembler.toModel(entity));
    }

    // CHIẾN LƯỢC 2: Custom Header Versioning qua Header X-API-Version: 2
    @GetMapping(value = "/{id}", headers = "X-API-Version=2")
    public ResponseEntity<?> getOrderV2CustomHeader(@PathVariable String id) {
        OrderEntity entity = findOrderMock(id);
        OrderModel model = assembler.toModel(entity);
        return ResponseEntity.ok()
                .header("Vary", "X-API-Version, Accept-Language") // Bắt buộc cho CDN caching
                .body(model);
    }

    @GetMapping
    public CollectionModel<OrderModel> getAllOrders() {
        List<OrderEntity> orders = List.of(
                new OrderEntity("ORD-1001", "CUST-01", 250000.0, OrderStatus.PENDING_PAYMENT, Instant.now()),
                new OrderEntity("ORD-1002", "CUST-02", 500000.0, OrderStatus.COMPLETED, Instant.now())
        );
        return assembler.toCollectionModel(orders);
    }

    @PostMapping("/{id}/payment")
    public ResponseEntity<Void> processPayment(@PathVariable String id) {
        // Thực hiện thanh toán
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelOrder(@PathVariable String id) {
        // Hủy đơn hàng
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/tracking")
    public ResponseEntity<String> trackShipment(@PathVariable String id) {
        return ResponseEntity.ok("Mã vận đơn: VNPOST-998877");
    }

    @GetMapping("/{id}/invoice")
    public ResponseEntity<String> downloadInvoice(@PathVariable String id) {
        return ResponseEntity.ok("Hóa đơn điện tử PDF tải về...");
    }

    private OrderEntity findOrderMock(String id) {
        if ("999".equals(id)) {
            throw new OrderNotFoundException(id);
        }
        return new OrderEntity(id, "CUST-88", 1200000.0, OrderStatus.PENDING_PAYMENT, Instant.now());
    }
}
~~~

---

## 3. Thử nghiệm, Xác thực & Phân tích Gói tin (Verification & Network Analysis)

### 3.1 Kiểm thử HATEOAS JSON Response (Chuẩn HAL)
Gửi yêu cầu bằng cURL với Header <code>Accept: application/hal+json</code>:
~~~bash
curl -X GET "http://localhost:8080/api/orders/v1/ORD-1001" \
     -H "Accept: application/hal+json"
~~~

Phản hồi trả về định dạng HAL JSON với các siêu liên kết tự điều hướng:
~~~json
{
  "orderId": "ORD-1001",
  "customerId": "CUST-01",
  "totalAmount": 250000.0,
  "status": "PENDING_PAYMENT",
  "createdAt": "2026-10-03T10:00:00Z",
  "_links": {
    "self": {
      "href": "http://localhost:8080/api/orders/v1/ORD-1001"
    },
    "orders": {
      "href": "http://localhost:8080/api/orders"
    },
    "pay": {
      "href": "http://localhost:8080/api/orders/ORD-1001/payment"
    },
    "cancel": {
      "href": "http://localhost:8080/api/orders/ORD-1001/cancel"
    }
  }
}
~~~

Trình khách (Client) chỉ việc kiểm tra sự tồn tại của <code>_links.pay</code>: nếu có thì hiển thị nút "Thanh toán", nếu không có thì ẩn nút đi. Frontend không cần phải code cứng logic nghiệp vụ phức tạp!

### 3.2 Kiểm thử Đa ngôn ngữ qua Header Accept-Language
Thực hiện gọi đến một đơn hàng không tồn tại (<code>id: 999</code>) với 2 ngôn ngữ khác nhau:

#### Request 1: Yêu cầu Tiếng Việt
~~~bash
curl -X GET "http://localhost:8080/api/orders/v1/999" \
     -H "Accept-Language: vi-VN,vi;q=0.9"
~~~
Phản hồi:
~~~json
{
  "type": "https://api.mastery.vn/errors/order-not-found",
  "title": "Order Not Found",
  "status": 404,
  "detail": "Không tìm thấy đơn hàng với mã định danh: 999",
  "errorCode": "ORDER_NOT_FOUND"
}
~~~

#### Request 2: Yêu cầu Tiếng Anh
~~~bash
curl -X GET "http://localhost:8080/api/orders/v1/999" \
     -H "Accept-Language: en-US,en;q=0.8"
~~~
Phản hồi:
~~~json
{
  "type": "https://api.mastery.vn/errors/order-not-found",
  "title": "Order Not Found",
  "status": 404,
  "detail": "Cannot locate order with ID: 999",
  "errorCode": "ORDER_NOT_FOUND"
}
~~~

Tiêu đề kỹ thuật và mã lỗi (<code>title</code>, <code>errorCode</code>) giữ nguyên tiếng Anh để các hệ thống APM (Datadog, Dynatrace, Prometheus) gom nhóm lỗi chuẩn xác. Chỉ có thông điệp hiển thị cho con người (<code>detail</code>) là được chuyển ngữ linh hoạt.

---

## 4. Cạm bẫy Triển khai & Khắc phục Sự cố (Production Pitfalls)

### Cạm bẫy 1: Bùng nổ Kích thước Payload khi Lạm dụng HATEOAS trên Danh sách Lớn
Trong một trang kết quả phân trang chứa 100 bản ghi, nếu mỗi bản ghi được gắn 5 liên kết siêu văn bản:
~~~text
100 items × 5 links = 500 link objects sinh ra trong JSON!
~~~
Kích thước payload có thể tăng từ 15KB lên đến 150KB chỉ vì chứa các chuỗi URL lặp đi lặp lại.
**Biện pháp khắc phục**:
1. Với các API danh sách (List / Pagination), chỉ gắn siêu liên kết điều hướng phân trang cấp cao (<code>first</code>, <code>prev</code>, <code>next</code>, <code>last</code>) trên đối tượng <code>CollectionModel</code>.
2. Không nhúng chi tiết danh sách link đầy đủ vào từng phần tử con trong mảng, hoặc chỉ nhúng liên kết <code>self</code>. Chỉ cung cấp đầy đủ liên kết hành động khi người dùng gọi API xem chi tiết 1 đơn hàng (Detail View).

### Cạm bẫy 2: CDN trả nhầm Ngôn ngữ và Phiên bản vì thiếu Header Vary
Khi đặt Cloudflare hoặc AWS CloudFront đứng trước hệ thống:
- Người dùng A tại Việt Nam gửi request với header <code>Accept-Language: vi</code>. CDN nhận được kết quả và lưu vào Cache theo URL <code>/api/orders/101</code>.
- Người dùng B tại Mỹ gửi request vào cùng URL <code>/api/orders/101</code> với header <code>Accept-Language: en</code>. CDN thấy URL trùng khớp liền lập tức trả về trang Tiếng Việt đã lưu trong cache cho người dùng B!
**Biện pháp khắc phục**: Bắt buộc phải thêm Header **<code>Vary</code>** vào phản hồi của máy chủ:
~~~http
Vary: Accept-Language, X-API-Version
~~~
Header này báo hiệu cho mọi tầng Cache trung gian biết rằng phải tạo các bản cache độc lập dựa trên sự kết hợp của URL và các Header được liệt kê.

### Cạm bẫy 3: Phụ thuộc ngầm vào Locale mặc định của Hệ điều hành Máy chủ
Nếu lập trình viên không chỉ định <code>resolver.setDefaultLocale(...)</code>, Spring sẽ gọi <code>Locale.getDefault()</code>.
Trên máy tính phát triển cá nhân tại Việt Nam, máy tính dùng Windows tiếng Việt nên code chạy ra tiếng Việt. Nhưng khi đóng gói Docker và deploy lên cụm máy chủ Amazon ECS hoặc Google Kubernetes Engine (GKE), hệ điều hành Linux mặc định là <code>en_US</code>. Kết quả là mọi thông điệp của khách hàng Việt Nam đều biến thành tiếng Anh!
**Biện pháp**: Luôn luôn cấu hình rõ ràng <code>resolver.setDefaultLocale(Locale.of("vi"))</code> và <code>messageSource.setFallbackToSystemLocale(false)</code>.

### Cạm bẫy 4: Lỗi Font Tiếng Việt do Mã hóa ISO-8859-1
Mặc định Java Properties trước đây đọc file theo mã hóa chuẩn ISO-8859-1. Nếu bạn gõ trực tiếp chữ có dấu như "Không tìm thấy" vào file <code>.properties</code>, thông điệp hiển thị ra màn hình sẽ bị biến thành ký tự rác (Mojibake: <code>KhÃ´ng tÃ¬m tháº¥y</code>).
**Biện pháp khắc phục**: Luôn sử dụng <code>ReloadableResourceBundleMessageSource</code> và kích hoạt:
~~~java
messageSource.setDefaultEncoding(StandardCharsets.UTF_8.name());
~~~

---

## 5. Thử thách Thực chiến (Hands-on Challenge)

### Đề bài:
Xây dựng Hệ thống Quản lý Hợp đồng Bảo hiểm Đa thị trường (Insurance Policy Management Subsystem):
1. Thiết kế Entity <code>InsurancePolicy</code> với các trạng thái: <code>DRAFT</code>, <code>ACTIVE</code>, <code>SUSPENDED</code>, <code>LAPSED</code>.
2. Xây dựng <code>PolicyModelAssembler</code> sinh siêu liên kết HATEOAS động:
   - Trạng thái <code>DRAFT</code>: Cung cấp link <code>submit</code> và <code>discard</code>.
   - Trạng thái <code>ACTIVE</code>: Cung cấp link <code>claim</code> (yêu cầu bồi thường) và <code>endorse</code> (sửa đổi điều khoản).
   - Trạng thái <code>LAPSED</code>: Cung cấp link <code>reinstate</code> (khôi phục hợp đồng).
3. Bản địa hóa toàn bộ thông báo nghiệp vụ (Hỗ trợ tiếng Việt <code>vi</code> và tiếng Anh <code>en</code>).
4. Endpoint <code>GET /api/v1/policies/{policyNumber}</code> trả về đúng chuẩn HATEOAS và header <code>Vary</code> tối ưu cho CDN.

### Lời giải Chuẩn Kỹ sư Cấp cao:

~~~java
package vn.mastery.insurance.domain;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.RepresentationModel;
import org.springframework.hateoas.server.core.Relation;
import org.springframework.hateoas.server.mvc.RepresentationModelAssemblerSupport;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Locale;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

// 1. Domain Entities & Enums
public enum PolicyStatus { DRAFT, ACTIVE, SUSPENDED, LAPSED }

public record PolicyEntity(String policyNo, String holderCif, double premiumAmount, 
                            PolicyStatus status, LocalDate expiryDate) {}

// 2. DTO HATEOAS Bất biến
@Relation(collectionRelation = "policies", itemRelation = "policy")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InsurancePolicyModel extends RepresentationModel<InsurancePolicyModel> {
    private final String policyNo;
    private final String holderCif;
    private final double premiumAmount;
    private final String status;
    private final String localizedStatusDescription;
    private final LocalDate expiryDate;

    public InsurancePolicyModel(String policyNo, String holderCif, double premiumAmount,
                                String status, String localizedStatusDescription, LocalDate expiryDate) {
        this.policyNo = policyNo;
        this.holderCif = holderCif;
        this.premiumAmount = premiumAmount;
        this.status = status;
        this.localizedStatusDescription = localizedStatusDescription;
        this.expiryDate = expiryDate;
    }

    public String getPolicyNo() { return policyNo; }
    public String getHolderCif() { return holderCif; }
    public double getPremiumAmount() { return premiumAmount; }
    public String getStatus() { return status; }
    public String getLocalizedStatusDescription() { return localizedStatusDescription; }
    public LocalDate getExpiryDate() { return expiryDate; }
}

// 3. Assembler Gắn Siêu Liên Kết Động Theo Trạng Thái Hợp Đồng
@Component
class InsurancePolicyModelAssembler 
        extends RepresentationModelAssemblerSupport<PolicyEntity, InsurancePolicyModel> {

    private final MessageSource messageSource;

    public InsurancePolicyModelAssembler(MessageSource messageSource) {
        super(InsurancePolicyController.class, InsurancePolicyModel.class);
        this.messageSource = messageSource;
    }

    @Override
    public InsurancePolicyModel toModel(PolicyEntity entity) {
        Locale currentLocale = LocaleContextHolder.getLocale();
        String statusDescription = messageSource.getMessage(
                "policy.status." + entity.status().name().toLowerCase(),
                null,
                currentLocale
        );

        InsurancePolicyModel model = new InsurancePolicyModel(
                entity.policyNo(),
                entity.holderCif(),
                entity.premiumAmount(),
                entity.status().name(),
                statusDescription,
                entity.expiryDate()
        );

        // Self link
        model.add(linkTo(methodOn(InsurancePolicyController.class)
                .getPolicy(entity.policyNo())).withSelfRel());

        // Điều hướng động
        switch (entity.status()) {
            case DRAFT -> {
                model.add(linkTo(methodOn(InsurancePolicyController.class)
                        .submitPolicy(entity.policyNo())).withRel("submit"));
                model.add(linkTo(methodOn(InsurancePolicyController.class)
                        .discardPolicy(entity.policyNo())).withRel("discard"));
            }
            case ACTIVE -> {
                model.add(linkTo(methodOn(InsurancePolicyController.class)
                        .fileClaim(entity.policyNo())).withRel("claim"));
                model.add(linkTo(methodOn(InsurancePolicyController.class)
                        .endorseTerms(entity.policyNo())).withRel("endorse"));
            }
            case LAPSED -> {
                model.add(linkTo(methodOn(InsurancePolicyController.class)
                        .reinstatePolicy(entity.policyNo())).withRel("reinstate"));
            }
            case SUSPENDED -> {
                model.add(linkTo(methodOn(InsurancePolicyController.class)
                        .getSuspensionDetails(entity.policyNo())).withRel("details"));
            }
        }

        return model;
    }
}

// 4. REST Controller Cung cấp Endpoint Chuẩn
@RestController
@RequestMapping("/api/v1/policies")
class InsurancePolicyController {

    private final InsurancePolicyModelAssembler assembler;

    public InsurancePolicyController(InsurancePolicyModelAssembler assembler) {
        this.assembler = assembler;
    }

    @GetMapping("/{policyNumber}")
    public ResponseEntity<InsurancePolicyModel> getPolicy(@PathVariable String policyNumber) {
        // Giả lập truy vấn hợp đồng đang có hiệu lực
        PolicyEntity mockEntity = new PolicyEntity(
                policyNumber,
                "CIF-987654",
                15000000.0,
                PolicyStatus.ACTIVE,
                LocalDate.now().plusYears(1)
        );

        InsurancePolicyModel model = assembler.toModel(mockEntity);

        return ResponseEntity.ok()
                .header(HttpHeaders.VARY, "Accept-Language, Accept")
                .body(model);
    }

    @PostMapping("/{policyNumber}/submit")
    public ResponseEntity<Void> submitPolicy(@PathVariable String policyNumber) {
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{policyNumber}/discard")
    public ResponseEntity<Void> discardPolicy(@PathVariable String policyNumber) {
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{policyNumber}/claims")
    public ResponseEntity<Void> fileClaim(@PathVariable String policyNumber) {
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{policyNumber}/endorsements")
    public ResponseEntity<Void> endorseTerms(@PathVariable String policyNumber) {
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{policyNumber}/reinstate")
    public ResponseEntity<Void> reinstatePolicy(@PathVariable String policyNumber) {
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{policyNumber}/suspension")
    public ResponseEntity<String> getSuspensionDetails(@PathVariable String policyNumber) {
        return ResponseEntity.ok("Hợp đồng tạm dừng do chưa thanh toán phí tái tục");
    }
}
~~~

:::takeaways
- **HATEOAS giải phóng Frontend**: Client không cần hard-code đường dẫn hay điều kiện hiển thị nút bấm. Server dẫn đường bằng siêu liên kết động dựa trên máy trạng thái nghiệp vụ (State Machine).
- **Richardson Maturity Model**: Level 2 (HTTP Verbs & Status Code) là nền tảng tối thiểu của mọi API nghiêm túc. Level 3 (HATEOAS) phát huy tối đa sức mạnh ở các Public API và Mobile App có chu kỳ cập nhật dài hạn.
- **Chiến lược Versioning thực tế**: URI Path Versioning (<code>/v1</code>, <code>/v2</code>) là lựa chọn trực quan và an toàn nhất cho đa số kiến trúc sư. Khi dùng Header Versioning, bắt buộc phải trả về header <code>Vary: X-API-Version</code> để bảo vệ CDN cache.
- **Đa ngôn ngữ chuyên nghiệp (i18n)**: Sử dụng <code>AcceptHeaderLocaleResolver</code> phân tích header <code>Accept-Language</code>. Phân tách rạch ròi giữa thông điệp máy đọc (<code>title</code>, <code>errorCode</code> bằng tiếng Anh) và thông điệp hiển thị người dùng (<code>detail</code> dịch theo locale).
- **Kiểm soát Encoding UTF-8**: Luôn cấu hình <code>ReloadableResourceBundleMessageSource</code> với chuẩn <code>UTF-8</code> và tắt fallback về system locale để hệ thống chạy nhất quán 100% trên mọi nền tảng đám mây.
:::
`
    },
    {
      id: "2-quiz",
      type: "quiz",
      title: "Quiz Module 2 — REST API",
      minutes: 10,
      questions: [
        {
          level: "easy",
          scenario: "Frontend team integration với API create-task của bạn. Họ hỏi: 'Sao tao POST xong nhận 200 nhưng không biết ID resource mới ở đâu?'",
          q: "Response chuẩn REST cho POST tạo mới là gì?",
          options: [
            "200 OK + body chứa resource — client tự đọc id",
            "201 Created + header Location: /api/v1/tasks/{id}",
            "204 No Content — sạch sẽ",
            "202 Accepted + jobId để poll"
          ],
          answer: 1,
          explain: "201 nói rõ 'đã tạo', Location header cho client URL chuẩn để GET/edit/delete mà không cần tự ghép chuỗi. Body vẫn trả DTO để tiện.",
          why: [
            "Chạy được nhưng thiếu chuẩn — 200 không phân biệt 'tạo mới' với 'cập nhật/đọc'. Client không có cách máy đọc được biết resource vừa sinh.",
            "✓ Đúng — cặp 201 + Location là chuẩn REST cho create: status code ngữ nghĩa + URL đích đến. Axios: response.headers.location.",
            "204 nghĩa là 'thành công nhưng không trả gì' — client phải tự đoán và tự xây URL theo id trong... thân? Không có thân. Sai ngữ nghĩa hoàn toàn.",
            "202 Accepted dành cho xử lý bất đồng bộ (job queue) — create đồng bộ dùng 202 khiến client phải poll vô ích."
          ]
        },
        {
          level: "hard",
          scenario: "Incident production LAAS: GET /users/{id} trả 500 kèm log LazyInitializationException. Code trả Entity trực tiếp, entity có @OneToMany List<Order> LAZY.",
          q: "Vì sao crash và cách sửa đúng triệt để?",
          code: "@GetMapping(\"/users/{id}\")\npublic User getUser(@PathVariable Long id) {\n    return userService.findById(id);   // trả ENTITY trực tiếp\n}",
          options: [
            "Thêm fetch = EAGER vào @OneToMany — đơn giản nhất",
            "Đổi sang DTO: trả UserDto qua MapStruct — session đóng trước serialize nên lazy list không bao giờ bị chạm",
            "Bật spring.jpa.open-in-view=true để giữ session mở suốt request",
            "Bắt LazyInitializationException rồi trả list rỗng"
          ],
          answer: 1,
          explain: "Jackson serialize entity SAU khi transaction/session đóng → truy cập lazy collection → LazyInitializationException. DTO mapping diễn ra TRONG transaction (session còn sống) → an toàn tuyệt đối.",
          why: [
            "EAGER = tải mọi quan hệ mọi lúc — user chỉ cần tên vẫn kéo cả trăm orders. Đây là cách đưa server vào nghiện tải trước — gây N+1 toàn hệ thống.",
            "✓ Đúng — DTO là ranh giới kiến trúc: map field cần (trong session sống) → Jackson chỉ thấy POJO thuần. Đồng thời khóa luôn rủi ro lộ field nhạy cảm.",
            "open-in-view=true giữ connection DB suốt request — kể cả lúc render view chậm. Anti-pattern được khuyến cáo tắt mặc định từ Boot 2.0; nó CHE vấn đề thay vì sửa.",
            "Nuốt exception trả list rỗng = client nhận dữ liệu SAI (user có 50 orders nhưng nhận []). Im lặng sai dữ liệu còn tệ hơn crash."
          ]
        },
        {
          level: "medium",
          scenario: "Audit bảo mật LAAS: endpoint admin trả Entity User serialize đầy đủ — passwordHash, internalNote, deleted flag lọt vào JSON response.",
          q: "Giải pháp kiến trúc đúng đắn?",
          options: [
            "Thêm @JsonIgnore lên các field nhạy cảm trong Entity",
            "Chuyển sang DTO chỉ chứa field client cần — Entity không bao giờ rời khỏi service layer",
            "Dùng @JsonView để lọc field theo view Admin/Public",
            "Encrypt passwordHash trước khi trả về"
          ],
          answer: 1,
          explain: "DTO là ranh giới contract: schema DB và API giải phóng khỏi nhau. @JsonIgnore/@JsonView vá chỗ này nhưng Entity vẫn là nguồn response — cám dỗ lộ field tiếp tục tồn tại.",
          why: [
            "Vá tại chỗ — lần sau ai thêm field nhạy cảm mới lại phải nhớ @JsonIgnore. Entity có nên biết gì về JSON contract đâu? Nó thuộc tầng persistence.",
            "✓ Đúng — kiến trúc boundary: Entity sống trong service/repository, DTO là đại diện ngoài. Bảo mật mặc định (deny-all trừ field khai báo) thay vì allow-all trừ field đánh dấu.",
            "@JsonView hoạt động nhưng đánh dấu annotation lên chính Entity — cùng vấn đề: tầng persistence vẫn ôm định mệnh serialization.",
            "Encrypt rồi trả vẫn lộ ciphertext — client không cần hash password dưới MỌI hình thức. Không giải quyết gì."
          ]
        },
        {
          level: "medium",
          scenario: "Mobile team phàn nàn: cùng 1 lỗi, API auth trả {error:...}, API order trả {message:...}, API payment trả {success:false,data:...}. Xử lý lỗi phải viết 3 bộ parser.",
          q: "Chuẩn nào giải quyết sự lộn xộn error contract?",
          options: [
            "Chuẩn RFC 7807 ProblemDetail — type/title/status/detail thống nhất mọi endpoint",
            "Định nghĩa Exception class riêng cho từng domain",
            "Trả lỗi về HTTP 200 với body mô tả — đơn giản cho client",
            "Dùng gRPC thay REST để có error model chuẩn"
          ],
          answer: 0,
          explain: "RFC 7807 (cập nhật RFC 9457) chuẩn hóa error payload: type (URI định danh lỗi), title, status, detail + extension field. Spring Boot 3 có class ProblemDetail built-in + spring.mvc.problemdetails.enabled=true.",
          why: [
            "✓ Đúng — một cấu trúc cho mọi lỗi: mobile team viết MỘT error parser, gateway route theo status, monitoring đếm theo type. Đó là giá trị của chuẩn mở.",
            "Exception riêng từng domain là bên SERVER — không giải quyết gì cho client vẫn phải parse 3 format khác nhau.",
            "HTTP 200 cho lỗi phá vỡ mọi công cụ HTTP: retry logic, circuit breaker, CDN, monitoring đều mù. Đây là thảm họa REST kinh điển.",
            "gRPC có error model tốt nhưng chuyển toàn bộ stack là câu trả lờiquá mức cho vấn đề 'chuẩn hóa format lỗi'. REST + RFC 7807 đạt được cùng mục tiêu."
          ]
        },
        {
          level: "medium",
          scenario: "Yêu cầu nghiệp vụ LAAS: tạo customer thì phone theo format VN (+84/0xxxxxxxxx), nhưng update thì cho phép null (không đổi) và format tự do (số quốc tế).",
          q: "Thiết kế validation đúng?",
          options: [
            "1 DTO duy nhất với @Pattern phone + check if-present ở service",
            "2 DTO riêng: CreateCustomerRequest với @PhoneNumber @NotBlank, UpdateCustomerRequest với @PhoneNumber nhưng cho phép null",
            "1 DTO + runtime validation thủ công trong service cho cả 2 path",
            "Validation groups: cùng record, @NotBlank(groups=Create), @PhoneNumber không nhóm"
          ],
          answer: 3,
          explain: "Validation groups cho cùng bộ field, khác luật theo ngữ cảnh: @NotBlank(groups = Create.class) chỉ ép create; @PhoneNumber validator trả true cho null (khuyết tắc tách bạch null-check).",
          why: [
            "Service check thủ công = bỏ mất lợi ích khai báo validation, mỗi endpoint mới phải nhớ gọi lại. Bean Validation tồn tại để loại bỏ code này.",
            "Chạy được nhưng duplicate 20 field DTO chỉ vì khác 1 annotation — mỗi field mới phải sửa 2 nơi. Drift giữa 2 DTO là bug tiềm ẩn.",
            "Toàn bộ validation thủ công = mất type-safe, mất thông báo chuẩn, mất test tự động. Tránh bằng mọi giá.",
            "✓ Đúng — 1 record + groups: @Validated(Create.class) ở POST, @Validated(Update.class) ở PUT. Custom @PhoneNumber validator bỏ qua null (để @NotBlank lo) — separation of concerns chuẩn."
          ]
        },
        {
          level: "easy",
          scenario: "Dev mới viết POST /api/tasks/batchUpload với @GetMapping vì 'cho phép test dễ bằng browser'. Reviewer phản đối.",
          q: "Vì sao GET cho upload là sai nghiêm trọng?",
          options: [
            "GET không gửi được body — file phải vào query param",
            "GET phải safe & idempotent — browser prefetcher/proxy/CDN có thể GET và tạo dữ liệu ngoài ý muốn",
            "Spring MVC không hỗ trợ multipart cho GET",
            "Chỉ là quy ước thẩm mỹ, thực tế không sao"
          ],
          answer: 1,
  explain: "HTTP spec: GET = safe (không đổi state) + idempotent (gọi N lần như 1). Browser prefetch, Chrome preload, proxy cache, crawler có thể tự GET URL → tạo batch ngoài ý muốn. Đây là bug thật của OLS từng audit.",
          why: [
            "Đúng là hạn chế nhưng không phải lý do cốt lõi — technical detail, không phải ngữ nghĩa. POST với query param vẫn tệ.",
            "✓ Đúng — ngữ nghĩa HTTP bị phá: client trung gian (prefetcher/crawler/cache) được PHÉP giả định GET vô hại và gọi tự do. Upload qua GET = kích hoạt tạo dữ liệu bằng cách 'chỉ xem'.",
            "Spring hỗ trợ multipart cho GET về mặt kỹ thuật — vấn đề không nằm ở framework mà ở contract HTTP.",
            "KHÔNG phải thẩm mỹ — là bug product-level với hậu quả thực: crawler index trang admin, prefetcher bấm nút ảo, CDN cache response đăng ký."
          ]
        },
        {
          level: "hard",
          scenario: "Code review MapStruct mapper: reviewer hỏi vì sao cùng một interface vừa có toDto(Task) vừa có updateEntity(UpdateTaskRequest, @MappingTarget Task) mà null-handling khác nhau?",
          q: "Null handling chuẩn cho PATCH update là gì?",
          options: [
            "Mapper mặc định: null trong request → set field entity thành null",
            "@BeanMapping(nullValuePropertyMappingStrategy = IGNORE) — null request field không ghi đè field entity hiện có",
            "Xử lý null thủ công từng field trong service trước khi gọi mapper",
            "Dùng @Mapping(target=..., defaultValue=...) cho mọi field"
          ],
          answer: 1,
          explain: "PATCH ngữ nghĩa 'chỉ đổi field được gửi'. NullValuePropertyMappingStrategy.IGNORE instructs MapStruct generated code bỏ qua null — đúng ngữ nghĩa patch từng phần.",
          why: [
            "Đúng là default của MapStruct — và đó chính là bẫy: PATCH {\"note\": null} kỳ vọng xóa note lại bị hiểu là 'không đổi', hoặc PUT kỳ vọng ghi đè full bị thiếu field. Phải chọn strategy theo ngữ cảnh endpoint.",
            "✓ Đúng — IGNORE strategy + @MappingTarget đạt chuẩn PATCH: field gửi → update, field vắng → giữ nguyên. Generated code có if (request.field() != null) từng field.",
            "Thủ công từng field = đúng thứ MapStruct sinh ra để loại bỏ. Mỗi field mới lại phải if-else lại — bug surface nhân lên.",
            "defaultValue chỉ áp dụng khi source null → gán default — không phải giữ giá trị HIỆN CÓ của entity. Ngữ nghĩa hoàn toàn khác."
          ]
        },
        {
          level: "medium",
          scenario: "LAAS onboard một dev mới. Tech lead nói: 'Đọc swagger-ui là hiểu API nhanh nhất.' Dev hỏi lại: 'Swagger tự sinh từ đâu mà chuẩn thế?'",
          codeLang: "java",
          q: "springdoc-openapi lấy thông tin spec từ đâu?",
          options: [
            "Quét annotation @RestController + mapping + Bean Validation → generate OpenAPI JSON runtime",
            "Đọc file openapi.yaml devs viết tay đặt trong resources",
            "Parse code Java bằng reflection mọi class có @Api",
            "Reverse-engineer từ test cases tự động"
          ],
          answer: 0,
          explain: "springdoc quét controller + annotation mapping + @Operation/@ApiResponse metadata + cả constraint validation (@NotBlank → required, @Size → maxLength trong schema) — docs luôn đồng bộ code.",
          why: [
            "✓ Đúng — 'single source of truth là code': sửa @GetMapping docs đổi theo, @Min(1) hiện trong schema. Không có doc drift như file yaml viết tay.",
            "Đó là design-first approach (contract-first) — hợp lệ nhưng khác workflow; springdoc là code-first, file yaml là OUTPUT chứ không phải input.",
            "Cũ — @Api/@ApiOperation là bộ annotation Swagger 2 (springfox era). springdoc dùng @Tag/@Operation OpenAPI 3 — nhưng vẫn là từ code annotation.",
            "Không có cơ chế nào sinh spec từ test. Test chứng minh hành vi, không mô tả API."
          ]
        },
        {
          level: "medium",
          scenario: "Pagination LAAS: client gửi ?size=10000 — DB query kèm COUNT + OFFSET khổng lồ, response chậm 30s. Cần chặn kiểu lạm dụng.",
          q: "Giải pháp đúng chuẩn Spring?",
          options: [
            "Hạn chế size ở service: if (pageable.getPageSize() > 200) throw",
            "spring.data.web.pageable.max-page-size=200 — resolver tự clamp về max",
            "Chặn ở gateway/ingress bằng regex query param",
            "Cho phép — client tự chịu trách nhiệm về size họ yêu cầu"
          ],
          answer: 1,
          explain: "Spring MVC resolver đọc config này và tự giới hạn mọi Pageable được resolve từ request — 1 dòng config phủ toàn app, không code lặp, không thể quên ở endpoint mới.",
          why: [
            "Chạy được nhưng rải rác — mỗi method mới phải nhớ check. Endpoint quên check = lỗ hổng trở lại. Guard-clause không scale bằng config tập trung.",
            "✓ Đúng — defense ở tầng framework: resolver clamp size trước khi controller thấy. Chuẩn, tự động, không thể bypass.",
            "Regex query ở gateway là brittle — encoding trick (size%3D10000) vượt qua dễ dàng, và chặn sai có thể làm hỏng client hợp lệ.",
            "Tin tưởng client là sai về security & stability — 1 client bug (vòng lặp tăng size) đủ đánh sập DB shared. Server phải tự vệ."
          ]
        },
        {
          level: "medium",
          scenario: "Admin SPA can notification real-time khi co transaction moi. Team tranh luan: full WebSocket gateway hay SSE. Use case: chi HIEN THI feed, user khong gui gi qua kenh nay. Mobile app tuong lai can push khi app dang mo.",
          q: "Chon gi va vi sao?",
          options: [
            "WebSocket — 'full-duplex' nghe hien dai hon, sau nay tinh gi cung duoc",
            "SSE — 1 chieu la du cho display, EventSource tu reconnect, di HTTP thong qua duoc gateway va proxy",
            "Long polling setInterval 3s — don gian nhat, khong can hoc gi moi",
            "WebSocket vi SSE khong ho tro authentication"
          ],
          answer: 1,
          explain: "Dung cong cu dung viec: notification la 1 chieu — SSE du, nhe hon, tu reconnect client-side, TEXT_EVENT_STREAM di qua HTTP gateway/proxy khong can cau hinh upgrade dac biet. WebSocket can handshake upgrade + auth rieng (browser khong set header khi upgrade). Polling 1000 user = 20.000 request rac/gio khi khong co gi moi.",
          why: [
            "Full-duplex tra gia bang handshake upgrade, auth phuc tap hon, infra nang hon — cho kenh chi can 1 chieu",
            "Dung — 90% use case real-time hien thi chi can SSE; du dung la thiet ke gioi",
            "Polling dot server vo nghia khi phan lon request tra ve 'khong co gi moi'",
            "SSE hoan toan dung duoc voi auth — di HTTP thong, cookie/token header nhu moi request"
          ]
        },
        {
          level: "medium",
          scenario: "Team chuyen sang contract-first voi openapi-generator, interfaceOnly=true. Backend dev phan nan: 'doi yaml xong generate lai, controller khong implement khop la build do, phien qua'.",
          q: "Cai 'phien' do thuc chat la gi?",
          options: [
            "Han che cua plugin — nen generate dto_only va tu viet controller tu do",
            "CHINH LA gia tri: compile error chan lech contract ngay tai may dev, thay vi consumer chet o production sau khi ship",
            "Dau hieu yaml thiet ke sai — yaml nen follow code chu khong nguoc lai",
            "Nen tat generate o CI de dev khong bi chan"
          ],
          answer: 1,
          explain: "Contract la luat — va compiler la canh sat re nhat: sai signature phat hien tai compile, truoc ca khi co test. Code-first chuyen phat hien lech xuong production (frontend doc docs cu, goi field khong con). 'Build do' o may dev ton 2 phut; breaking change o prod ton incident + khach hang.",
          why: [
            "Tu viet controller tu do = quay lai code-first, mat dung co che thuc thi contract",
            "Dung — fail som tai compile la thiet ke tot, khong phai phien",
            "Nguon su that la yaml da duoc 2 team duyet — code phai theo hop dong, khong nguoc lai",
            "Tat generate o CI = mat canh chan cho moi PR khac"
          ]
        },
        {
          level: "hard",
          scenario: "GraphQL BFF cho dashboard: query members(page:0, size:20) { tier { name } }. Load test p99 chay trong khi tung query don le nhanh. GraphiQL dev test khong tai hien duoc.",
          q: "Chan doan va fix?",
          options: [
            "Tang pool HikariCP — DB nghen connection",
            "N+1 resolver: tier resolved MOI member 1 query = 21 query/1 request — DataLoader batch thanh 1 query IN",
            "Cache toan bo response GraphQL o gateway",
            "Giam size xuong 10 cho moi page"
          ],
          answer: 1,
          explain: "21 query thay vi 2 — moi member trigger resolve tier rieng. GraphQL Java gom cac resolve dong thoi, DataLoader gom keys thanh WHERE id IN (...) — 1 query cho ca batch. Dev test 1-2 item khong lo (3 query van nhanh), load test 20 item moi bung (21 query x concurrency). Pool tang chi che trieu chung.",
          why: [
            "Pool lon hon chua duoc 21 query nhung DB van ganh gap 10 lan can thiet",
            "Dung — DataLoader la loi giai chuan N+1 cua GraphQL: batch + cache trong scope request",
            "Cache khong sua so query moi cache miss — N+1 van do cho lan expire sau",
            "Giam size = chia nho van de, tong query van N+1 tren nhieu request"
          ]
        },
        {
          level: "medium",
          scenario: "Public API cho 3 party tích hợp: mobile app nội bộ, webhook partner ngân hàng, plugin Shopify. Mỗi 6 tháng backend refactor đường dẫn resource. Team đề xuất HATEOAS cho mọi endpoint kể cả internal admin API.",
          q: "Đánh giá đề xuất này?",
          options: [
            "Đúng — HATEOAS là chuẩn REST level 3, mọi API nên đạt mức cao nhất",
            "Public/partner API thì đáng — internal admin API mình kiểm soát version thì level 2 + OpenAPI contract gọn hơn, tránh phình response",
            "Sai hoàn toàn — HATEOAS đã lỗi thời, không ai dùng nữa",
            "Chỉ cần HATEOAS cho internal API — public API cần URL cố định cho tài liệu"
          ],
          answer: 1,
          explain: "HATEOAS trả giá bằng kích thước response và chi phí build — trả lời xứng đáng khi client KHÔNG kiểm soát được version (mobile cũ, partner). Internal API đồng deploy, đổi cùng release: contract-first (2-7) là cơ chế đúng. Áp HATEOAS đồng loạt là tối ưu hóa hình thức không giá trị.",
          why: [
            "Level cao nhất không phải luôn tốt nhất — công cụ đúng việc mới là kiến trúc",
            "✓ Phân vùng theo khả năng kiểm soát version — đúng nguyên tắc chi phí/lợi ích",
            "HATEOAS vẫn là lựa chọn giá trị cho public API đa client",
            "Public API chính là nơi client khó force update — cần link động nhất"
          ]
        },
        {
          level: "hard",
          scenario: "API lỗi trả về message theo Accept-Language. Sau 3 tháng, dashboard CloudWatch filter 'insufficient balance' về 0 — hóa ra message đã dịch sang tiếng Việt tiếng Swahili, alarm keyword cũ không match nữa.",
          q: "Bài học thiết kế gì rút ra?",
          options: [
            "Bỏ i18n — API enterprise chỉ nên trả tiếng Anh duy nhất",
            "Tách message cho MÁY và message cho NGƯỜI: title machine-readable cố định mọi locale, chỉ detail dịch — alarm filter theo title",
            "Cập nhật alarm theo từng ngôn ngữ — thêm 4 bộ keyword cho 4 locale",
            "Log message bản tiếng Anh song song trong response body"
          ],
          answer: 1,
          explain: "Problem Details RFC 7807 tách bạch: title là định danh loại lỗi ổn định (insufficient-points) cho máy móc lọc; detail là ngôn ngữ tự nhiên cho người đọc theo locale. Trộn 2 vai trò vào 1 field là đúng lỗi này: observability vỡ khi i18n vào. Alarm filter title, user đọc detail — mỗi bên có field riêng.",
          why: [
            "Bỏ đa ngôn ngữ là hạ trải nghiệm end-user vì thiếu tách bạch kỹ thuật — sai gốc",
            "✓ Machine-readable title + human detail — đúng triết lý RFC 7807",
            "Nhân bộ keyword theo locale là ma trận duy trì không bền",
            "Response body lẫn log English song song — phình payload, vẫn 2 nguồn sự thật"
          ]
        }
      ]
    }
  ]
});
