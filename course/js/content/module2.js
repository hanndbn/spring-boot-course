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
      title: "Spring MVC & xây CRUD API đầu tiên",
      minutes: 50,
      content: `
## Kiến trúc request trong Spring MVC

~~~text
HTTP Request
  → DispatcherServlet (front controller)
  → HandlerMapping (tìm method khớp URL + HTTP method)
  → Interceptors (tiền xử lý)
  → Controller method (của bạn)
  → Service (business) → Repository (data)
  → Trả về → HttpMessageConverter (Jackson: object ↔ JSON)
  → HTTP Response
~~~

Nghĩa là: bạn chỉ viết Controller mỏng, Spring lo phần đường ống.

---

## 1. Controller đầu tiên — đầy đủ read operations

~~~java
@RestController                     // = @Controller + mọi method trả JSON
@RequestMapping("/api/v1/tasks")
public class TaskController {

    private final TaskService service;

    public TaskController(TaskService service) {   // constructor injection
        this.service = service;
    }

    // GET /api/v1/tasks/42
    @GetMapping("/{id}")
    public ResponseEntity<TaskDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    // GET /api/v1/tasks?status=TODO&page=0&size=20&sort=createdAt,desc
    @GetMapping
    public ResponseEntity<Page<TaskDto>> list(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(service.list(status, pageable));
    }
}
~~~

### Annotation Binding cheat-sheet

| Annotation | Nguồn dữ liệu | Ví dụ |
|---|---|---|
| <code>@PathVariable</code> | Đường dẫn URL | <code>/tasks/{id}</code> → id |
| <code>@RequestParam</code> | Query string | <code>?status=TODO</code> |
| <code>@RequestBody</code> | Body JSON → object | POST/PUT payload |
| <code>@RequestHeader</code> | HTTP header | <code>X-Idempotency-Key</code> |
| <code>@ModelAttribute</code> | Query string → object | form/filter object |

## 2. Create, Update, Delete

~~~java
@PostMapping                        // 201 Created + Location header
public ResponseEntity<TaskDto> create(
        @Valid @RequestBody CreateTaskRequest request,
        UriComponentsBuilder uri) {

    TaskDto created = service.create(request);
    var location = uri.path("/api/v1/tasks/{id}")
                      .buildAndExpand(created.id()).toUri();
    return ResponseEntity.created(location).body(created);
}

@PutMapping("/{id}")
public ResponseEntity<TaskDto> update(
        @PathVariable Long id,
        @Valid @RequestBody UpdateTaskRequest request) {
    return ResponseEntity.ok(service.update(id, request));
}

@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable Long id) {
    service.delete(id);
    return ResponseEntity.noContent().build();   // 204
}
~~~

### Mã trạng thái phải chuẩn

| Tình huống | Status |
|---|---|
| Tạo mới thành công | **201 Created** + header Location |
| GET/PUT thành công | **200 OK** |
| DELETE thành công | **204 No Content** |
| Thiếu/sai dữ liệu client gửi | **400/422** |
| Không tìm thấy resource | **404 Not Found** |
| Conflict (trùng email...) | **409 Conflict** |
| Lỗi hệ thống | **500 Internal Server Error** |

:::warn TRẢ 200 CHO MỌI THỨ = API NGHIỆP DƯƠNG
Nhiều API trả <code>{"success": false, "code": "NOT_FOUND"}</code> kèm HTTP 200. Điều này phá vỡ contract REST — client library, monitoring, gateway đều dựa vào status code để xử lý. Hãy trả đúng status.
:::

## 3. Pagination chuẩn Spring

~~~java
// Service trả Page<TaskDto>
public Page<TaskDto> list(String status, Pageable pageable) {
    return repo.findAll(pageable).map(mapper::toDto);
}
~~~

Response JSON tự có cấu trúc chuẩn:

~~~json
{
  "content": [ { "id": 1, "title": "..." } ],
  "pageable": { "pageNumber": 0, "pageSize": 20 },
  "totalElements": 57,
  "totalPages": 3,
  "last": false
}
~~~

:::tip PAGEABLE RESOLVER
<code>spring.data.web.pageable.max-page-size=200</code> — giới hạn client không thể yêu cầu <code>?size=999999</code> và đánh sập DB.
:::

## 4. DTO — và vì sao không expose Entity

~~~java
// Entity — phản ánh bảng DB, có quan hệ lazy...
public class Task {
    @Id @GeneratedValue Long id;
    String title;
    @ManyToOne(fetch = LAZY) User assignee;   // có thể lộ thông tin!
    @OneToMany List<Comment> comments;
    LocalDateTime createdAt;
}

// DTO — đúng thứ client cần, không hơn
public record TaskDto(
    Long id,
    String title,
    String assigneeName,
    int commentCount,
    LocalDateTime createdAt
) {}
~~~

Lý do phải tách:

1. **Bảo mật**: Entity có thể chứa password hash, internal id
2. **Ổn định contract**: Thêm cột DB không làm vỡ API client
3. **Tránh serialization bug**: Lazy relation + Jackson = LazyInitializationException kinh điển
4. **Tối ưu**: API chỉ trả đúng field cần, không over-fetch

## 5. Service layer — nơi chứa business

~~~java
@Service
public class TaskService {

    private final TaskRepository repo;
    private final TaskMapper mapper;

    public TaskService(TaskRepository repo, TaskMapper mapper) {
        this.repo = repo;
        this.mapper = mapper;
    }

    public TaskDto findById(Long id) {
        return repo.findById(id)
            .map(mapper::toDto)
            .orElseThrow(() -> new TaskNotFoundException(id));
    }
    // ...
}
~~~

## 6. Cấu trúc package gợi ý

~~~text
vn/mastery/taskmanager/
├── api/            ← controller
│   └── TaskController.java
├── dto/            ← request/response records
│   ├── CreateTaskRequest.java
│   └── TaskDto.java
├── service/        ← business logic
│   └── TaskService.java
├── domain/         ← entity + repository (Module 3)
│   ├── Task.java
│   └── TaskRepository.java
├── exception/      ← custom exceptions + handler
└── config/
~~~

:::laas ĐỐI CHIẾU LAAS
Mở ListingController trong OLS và trace flow: AJAX từ sub-listing.jsp → @GetMapping → service dispatch động. Bạn sẽ thấy đúng pattern Controller mỏng + Service dày mà ta vừa xây.
:::

:::takeaways
- DispatcherServlet route request đến method khớp annotation mapping
- Trả đúng HTTP status: 201+Location khi create, 204 khi delete, 404 khi thiếu
- DTO tách Entity — bảo mật + ổn định contract + tránh lazy bug
- Pageable/Sort resolve tự động từ query param
- Package theo tầng: api / dto / service / domain / exception / config
:::
`
    },
    {
      id: "2-2",
      type: "lesson",
      title: "Validation & Global Exception Handling",
      minutes: 45,
      content: `
## Validation — cổng kiểm tra dữ liệu đầu vào

Client luôn gửi rác — API của bạn phải tự vệ. Bean Validation (Jakarta) cho phép khai báo ràng buộc **ngay trên DTO**.

---

## 1. Bean Validation cơ bản

Thêm dependency (nếu chưa có):

~~~xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
~~~

~~~java
public record CreateTaskRequest(
    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(min = 3, max = 120, message = "Tiêu đề 3-120 ký tự")
    String title,

    @NotNull(message = "Hạn chót bắt buộc")
    @Future(message = "Hạn chót phải ở tương lai")
    LocalDate dueDate,

    @Min(1) @Max(5)
    int priority,

    @Email(message = "Email không hợp lệ")
    String email,

    @Pattern(regexp = "^[A-Z]{2,10}-\\d{3,8}$",
             message = "Mã định dạng XX-1234")
    String code
) {}
~~~

Kích hoạt bằng <code>@Valid</code> tại controller:

~~~java
@PostMapping
public ResponseEntity<TaskDto> create(
        @Valid @RequestBody CreateTaskRequest request) { ... }
~~~

### Annotation thường dùng

| Annotation | Kiểm tra |
|---|---|
| <code>@NotNull</code> / <code>@NotBlank</code> / <code>@NotEmpty</code> | null / blank / null+cả collection rỗng |
| <code>@Size(min, max)</code> | Độ dài chuỗi / collection |
| <code>@Min / @Max</code> | Số nguyên |
| <code>@Positive / @PositiveOrZero</code> | Số > 0 / ≥ 0 |
| <code>@Email</code> | Format email |
| <code>@Pattern(regexp)</code> | Regex |
| <code>@Past / @Future</code> | Ngày trước/khiến sau hiện tại |
| <code>@DecimalMin / @DecimalMax</code> | Số thực |

:::tip @NULL vs @BLANK
<code>@NotNull</code>: "abc" và "" đều pass. <code>@NotBlank</code>: chỉ chuỗi có ký tự whitespace mới fail — dùng cho String. Với String, gần như luôn muốn @NotBlank.
:::

## 2. Validation Groups — luật khác nhau cho Create vs Update

Vấn đề: khi create, dueDate phải tương lai; khi update, cho phép sửa về quá khứ.

~~~java
public interface Create {}
public interface Update {}

public record TaskRequest(
    @Null(groups = Create.class)                    // create: client KHÔNG được gửi id
    @NotNull(groups = Update.class)                 // update: id bắt buộc
    Long id,

    @Future(groups = Create.class)                  // create: tương lai
    LocalDate dueDate
) {}
~~~

~~~java
@PostMapping
public ResponseEntity<TaskDto> create(
        @Validated(TaskRequest.Create.class)        // áp nhóm Create
        @RequestBody TaskRequest request) { ... }

@PutMapping("/{id}")
public ResponseEntity<TaskDto> update(
        @PathVariable Long id,
        @Validated(TaskRequest.Update.class)        // áp nhóm Update
        @RequestBody TaskRequest request) { ... }
~~~

:::laas ĐỐI CHIẾU LAAS
Đây chính là kỹ thuật đằng sau @AgeValidation bạn đã viết cho LAAS — custom constraint + ConstraintValidator. Bài tiếp theo ta sẽ viết lại bài bản hơn.
:::

## 3. Custom Constraint — viết @PhoneNumber riêng

Bước 1 — annotation:

~~~java
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PhoneNumberValidator.class)
@Documented
public @interface PhoneNumber {
    String message() default "Số điện thoại Việt Nam không hợp lệ";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
~~~

Bước 2 — validator:

~~~java
public class PhoneNumberValidator
        implements ConstraintValidator<PhoneNumber, String> {

    private static final Pattern VN =
        Pattern.compile("^(0|\\+84)(\\d{9})$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext ctx) {
        if (value == null) return true;         // null do @NotNull lo
        return VN.matcher(value).matches();
    }
}
~~~

Dùng: <code>@PhoneNumber String phone</code> — tái sử dụng ở mọi DTO!

## 4. Global Exception Handler — RFC 7807 ProblemDetail

Thay vì try/catch rải khắp controller, ta viết **một nơi duy nhất**:

~~~java
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 404 — business not-found
    @ExceptionHandler(TaskNotFoundException.class)
    public ProblemDetail handleNotFound(TaskNotFoundException ex) {
        ProblemDetail pd = ProblemDetail
            .forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setTitle("Resource not found");
        pd.setProperty("errorCode", "TASK_NOT_FOUND");
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }

    // 400 — validation fail (MethodArgumentNotValidException)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        ProblemDetail pd = ProblemDetail
            .forStatusAndDetail(HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ");
        pd.setTitle("Validation failed");
        Map<String, String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(fe ->
            errors.put(fe.getField(), fe.getDefaultMessage()));
        pd.setProperty("errors", errors);        // client đọc map field→lỗi
        return pd;
    }

    // 409 — xung đột business
    @ExceptionHandler(DuplicateTaskException.class)
    public ProblemDetail handleConflict(DuplicateTaskException ex) { ... }

    // 500 — phòng xa
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneric(Exception ex) {
        log.error("Unhandled", ex);
        ProblemDetail pd = ProblemDetail
            .forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
                "Lỗi hệ thống, vui lòng thử lại sau");
        pd.setTitle("Internal error");
        return pd;   // KHÔNG leak stacktrace ra ngoài!
    }
}
~~~

Response chuẩn RFC 7807:

~~~json
{
  "type": "about:blank",
  "title": "Validation failed",
  "status": 400,
  "detail": "Dữ liệu không hợp lệ",
  "errors": {
    "title": "Tiêu đề không được để trống",
    "dueDate": "Hạn chót phải ở tương lai"
  },
  "errorCode": "VALIDATION_FAILED",
  "timestamp": "2026-10-02T06:30:00Z"
}
~~~

:::info VÌ SAO RFC 7807?
Trước đây mỗi hệ thống tự bịa format lỗi → client phải viết code riêng cho từng API. RFC 7807/9457 chuẩn hóa: <b>type/title/status/detail</b> — mọi client (web, mobile, gateway) đều hiểu. Spring Boot 3 hỗ trợ ProblemDetail sẵn.
:::

## 5. Câu hỏi kinh điển: 400 hay 422?

- **400 Bad Request**: sai cú pháp / thiếu field / sai type — lỗi **hình thức**
- **422 Unprocessable Entity**: cú pháp đúng nhưng vi phạm **luật business** (ví dụ: rút tiền vượt hạn mức)

Nhiều API gộp hết vào 400. Chọn chuẩn và nhất quán là điều quan trọng nhất.

## 6. Don't leak lỗi nội bộ

~~~java
// ❌ Leak: message chứa SQL, tên bảng, internal path
{"detail": "could not execute statement [Table 'tasks' doesn't exist]"}

// ✅ Đúng: log đầy đủ ở server, trả message trung tính
{"detail": "Lỗi hệ thống, vui lòng thử lại sau"}
~~~

Log đầy đủ (kèm stacktrace) bên server; trả client thông điệp an toàn + correlationId để tra cứu.

:::takeaways
- @Valid/@Validated + Bean Validation annotation trên DTO — validation khai báo
- Validation groups: luật khác nhau cho Create vs Update
- Custom constraint = annotation + ConstraintValidator — tái sử dụng
- @RestControllerAdvice + ProblemDetail (RFC 7807) — error contract thống nhất
- Log đầy đủ server-side; không leak chi tiết nội bộ cho client
:::
`
    },
    {
      id: "2-3",
      type: "lesson",
      title: "MapStruct & OpenAPI (Swagger) documentation",
      minutes: 40,
      content: `
## MapStruct — mapping Entity ↔ DTO lúc compile

Mapping thủ công = code nhàm chán, dễ sai, khó bảo trì. MapStruct generate code mapping **lúc compile** → nhanh như code tay, type-safe.

---

## 1. Cài đặt

~~~xml
<properties>
    <mapstruct.version>1.6.3</mapstruct.version>
</properties>

<dependencies>
    <dependency>
        <groupId>org.mapstruct</groupId>
        <artifactId>mapstruct</artifactId>
        <version>\${mapstruct.version}</version>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <configuration>
                <annotationProcessorPaths>
                    <path>
                        <groupId>org.mapstruct</groupId>
                        <artifactId>mapstruct-processor</artifactId>
                        <version>\${mapstruct.version}</version>
                    </path>
                    <!-- Nếu dùng Lombok, phải có lombok-mapstruct-binding -->
                    <path>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                        <version>\${lombok.version}</version>
                    </path>
                    <path>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok-mapstruct-binding</artifactId>
                        <version>0.2.0</version>
                    </path>
                </annotationProcessorPaths>
            </configuration>
        </plugin>
    </plugins>
</build>
~~~

## 2. Mapper cơ bản

~~~java
@Mapper(componentModel = "spring")   // tạo bean, inject như thường
public interface TaskMapper {

    TaskDto toDto(Task entity);

    Task toEntity(CreateTaskRequest request);

    List<TaskDto> toDtoList(List<Task> entities);
}
~~~

Sau khi build, MapStruct đã generate implementation (xem trong <code>target/generated-sources</code>):

~~~java
// Generated — như code tay nhưng không bao giờ typo
@Component
public class TaskMapperImpl implements TaskMapper {
    @Override
    public TaskDto toDto(Task task) {
        if (task == null) return null;
        return new TaskDto(task.getId(), task.getTitle(),
            task.getAssignee() != null ? task.getAssignee().getName() : null,
            task.getComments() != null ? task.getComments().size() : 0,
            task.getCreatedAt());
    }
}
~~~

## 3. Mapping phức tạp

~~~java
@Mapper(componentModel = "spring")
public interface TaskMapper {

    @Mapping(target = "assigneeName", source = "assignee.name")
    @Mapping(target = "commentCount",
             expression = "java(entity.getComments() != null ? entity.getComments().size() : 0)")
    @Mapping(target = "internalNotes", ignore = true)     // không map field này
    TaskDto toDto(Task entity);

    // 2 nguồn ghép: request + user hiện tại
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "assignee", source = "user")
    @Mapping(target = "status", constant = "TODO")
    Task toEntity(CreateTaskRequest request, User user);

    // Cập nhật có chọn lọc — null không ghi đè
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy =
                 NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(UpdateTaskRequest request, @MappingTarget Task entity);
}
~~~

### Chiến lược null an toàn

| Tình huống | Giải pháp |
|---|---|
| Field DTO không khớp tên entity | <code>@Mapping(source, target)</code> |
| Không muốn map field | <code>@Mapping(target=..., ignore=true)</code> |
| Update partial (PATCH) | <code>@BeanMapping(IGNORE)</code> + <code>@MappingTarget</code> |
| Object lồng nhau cần map đệ quy | <code>uses = {UserMapper.class}</code> |

## 4. OpenAPI / Swagger UI — tài liệu sống

Dependency:

~~~xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.7.0</version>
</dependency>
~~~

Mở <code>http://localhost:8080/swagger-ui.html</code> → UI thử API ngay trên trình duyệt.

### Bổ sung metadata cho docs

~~~java
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI taskManagerOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Task Manager API")
                .description("API học tập Spring Boot — chuẩn RFC 7807 lỗi")
                .version("v1"))
            .components(new Components()
                .addSecuritySchemes("bearer-jwt",
                    new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")))
            .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"));
    }
}
~~~

~~~java
@RestController
@RequestMapping("/api/v1/tasks")
@Tag(name = "Tasks", description = "Quản lý công việc")
public class TaskController {

    @Operation(summary = "Tạo task mới",
               description = "Trả 201 + Location header")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Tạo thành công"),
        @ApiResponse(responseCode = "400",
                     description = "Validation fail",
                     content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
    })
    @PostMapping
    public ResponseEntity<TaskDto> create(...) { ... }
}
~~~

## 5. Thiết kế RESTful đường dẫn đúng chuẩn

| ✅ Đúng | ❌ Sai | Vì sao |
|---|---|---|
| <code>GET /tasks</code> | <code>GET /getAllTasks</code> | GET trên collection ngầm "list" |
| <code>POST /tasks</code> | <code>POST /createTask</code> | POST tạo resource trong collection |
| <code>DELETE /tasks/42</code> | <code>POST /deleteTask?id=42</code> | DELETE + id trong path |
| <code>GET /tasks/42/comments</code> | <code>GET /getCommentsOfTask?taskId=42</code> | Quan hệ lồng nhau qua path |
| <code>GET /tasks?status=DONE</code> | <code>GET /doneTasks</code> | Filter qua query param |

**Chuẩn version**: <code>/api/v1/...</code> — đổi breaking change → bump v2.

:::laas ĐỐI CHIẾU LAAS
OLS/LAAS có endpoint <code>batchUpload</code> bị gán nhầm @GetMapping (một trong những vấn đề bạn từng audit). Bài học: **upload = thay đổi dữ liệu = POST**, không bao giờ GET. GET phải an toàn + idempotent.
:::

:::takeaways
- MapStruct: code mapping generated lúc compile — nhanh, an toàn, refactor-friendly
- <code>@Mapping(source/target)</code> rename field; IGNORE cho update partial
- springdoc-openapi: Swagger UI + OpenAPI JSON tự sinh từ code
- Thiết kế path RESTful: danh từ số nhiều, filter bằng query, version ở /api/v1
:::
`
    },
    {
      id: "2-4",
      type: "lesson",
      title: "Pagination, Sorting & Dynamic Filtering",
      minutes: 40,
      content: `
## 10 dòng dữ liệu thì dễ — 10 triệu dòng thì sao?

Table UI cần page 3, sort theo createdAt, filter theo status + tenant. SELECT * rồi lọc Java = tự sát memory. JPA Specification + Pageable là combo chuẩn cho bài toán này.

---

## 1. Pageable — request chuẩn

~~~http
GET /api/v1/members?page=0&size=20&sort=createdAt,desc
~~~

~~~java
@GetMapping
public Page<MemberDto> list(@ParameterObject Pageable pageable) {
    return memberService.list(pageable);
}
~~~

~~~java
// Pageable đếm + slice dữ liệu:
// SELECT ... LIMIT 20 OFFSET 0
// SELECT count(*) — tổng để tính số page
~~~

| Field | Ý nghĩa |
|---|---|
| <code>page</code> | Từ 0 (không phải 1!) |
| <code>size</code> | Số phần tử / page — max chặn ở service (500 chẳng hạn) |
| <code>sort</code> | property,ASC/DESC — nhiều sort cách nhau \&sort=a,desc\&sort=b,asc |

:::warn COUNT QUERY CŨNG ĐẮT
Vì sao page sâu là chết: page=10000 &rarr; OFFSET 200000 → DB quét + bỏ 200k row trước khi trả 20. Giải pháp: keyset pagination (WHERE id &lt; cursor ORDER BY id DESC LIMIT 20) — luôn O(20) dù page sâu cỡ nào. Trade-off: không nhảy page, chỉ next/prev.
:::

:::warn OFFSET DEEP PAGINATION
\`page=9999\` : DB phải scan và bỏ 9999 × size rows — page càng sâu càng chậm tuyến tính. Keyset/seek (WHERE created_at &lt; last_seen ORDER BY created_at DESC LIMIT 20) trả về đúng 20 row gần nhất luôn O(log n). API mobile infinite-scroll nên dùng cursor.
:::

## 2. Sort an toàn — chống SQL injection qua sort param

Client gửi \`sort=email;DROP TABLE\`? Pageable chỉ cho phép property thuộc entity. Chặn trắng:

~~~java
@ControllerAdvice
public class PageableSanitizer extends OncePerRequestFilter {

    private static final Set<String> ALLOWED = Set.of("id", "cif", "createdAt", "points");

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        String[] sorts = req.getParameterValues("sort");
        if (sorts != null) {
            for (String s : sorts) {
                String prop = s.split(",")[0];
                if (!ALLOWED.contains(prop)) {
                    res.sendError(400, "Sort property not allowed: " + prop);
                    return;
                }
            chain.doFilter(req, res);
    }
}
~~~

Hoặc đơn giản hơn: whitelist property &rarr; tự map sang sort SQL trong service.

## 3. Sort whitelist — service tự kiểm soát

~~~java
public Page<MemberDto> list(Pageable pageable) {
    for (Sort.Order o : pageable.getSort()) {
        if (!ALLOWED_SORT.contains(o.getProperty()))
            throw new BadRequestException("sort", o.getProperty());
    }
    ...
}
~~~

## 4. Specification — dynamic filter compositional

~~~java
// Interface JpaSpecificationExecutor<Member>
public interface MemberRepository extends
        JpaRepository<Member, Long>, JpaSpecificationExecutor<Member> {
}

// Điều kiện ghép
public class MemberSpecs {

    public static Specification<Member> hasTenant(String tenantId) {
        return (root, query, cb) -> cb.equal(root.get("tenantId"), tenantId);
    }

    public static Specification<Member> statusIn(List<Status> statuses) {
        return (root, query, cb) -> root.get("status").in(statuses);
    }

    public static Specification<Member> pointsGte(Long min) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("points"), min);
    }
}
~~~

~~~java
// Ghép WHERE tenant = ? AND status IN (...) AND points >= ?
Specification<Member> spec = Specification
    .where(MemberSpecs.hasTenant(ctx.tenantId()))
    .and(MemberSpecs.statusIn(filters.statuses()))
    .and(MemberSpecs.pointsGte(filters.minPoints()));

Page<Member> page = memberRepo.findAll(spec, pageable);
~~~

Mọi điều kiện null → tự skip (Specification null an toàn khi compose bằng .where().and()) — controller nhận object filter thoải mái, service tự quyết định điều kiện nào áp dụng.

## 5. DTO projection — đừng map trong stream

~~~java
public interface MemberSummary {        // interface projection
    Long getId();
    String getCif();
    long getPoints();
}

public interface MemberRepository extends JpaRepository<Member, Long> {
    Page<MemberSummary> findByTenantId(String tenantId, Pageable pageable);
}
~~~

SELECT cột cần thiết — không kéo entire entity + lazy relations. Page&lt;MemberSummary&gt; serialize trực tiếp: nhẹ RAM, nhẹ network.

## 6. Cursor pagination — infinite scroll

~~~java
public record CursorPage<T>(List<T> items, String nextCursor) {}

public record Cursor(
    Instant lastCreatedAt,
    Long lastId            // tie-breaker khi createdAt trùng
) {}

// Query
List<Member> items = memberRepo.findTop20ByTenantIdAndCreatedAtLessThanEqualOr...(
    tenantId, cursor.lastCreatedAt(), cursor.lastId(), Sort.by(desc("createdAt"), desc("id")));
~~~

Encode cursor Base64 URL-safe trả về client: \`?cursor=eyJjcmVhdGVkQXQiOi...\`. Mobile app cuộn &rarr; gửi cursor &rarr; server đọc 20 row tiếp theo O(log n).

:::laas ĐỐI CHIẾU LAAS
OLS/LAAS danh sách transaction hàng triệu dòng: page-based cho admin web (gần page 1 đa số), cursor cho mobile infinite scroll. Transaction list API của LAAS phân trang cursor — phân tích audit bạn từng làm cho thấy core API luôn keyset, chỉ reporting dùng offset cho chart.
:::

:::takeaways
- Pageable từ query params chuẩn Spring; page tính từ 0
- Sort whitelist property — chống injection qua orderBy
- Specification compose: .where().and().or() — filter động type-safe
- Interface projection: SELECT đúng cột, Page serialize nhẹ
- Deep offset page = linear scan; cursor/keyset = O(log n) cho infinite scroll
- Page<Student> hỏi count(*) — slice (Slice<T>) bỏ count khi không cần tổng
:::
`
    },
    {
      id: "2-5",
      type: "lesson",
      title: "File Upload & Async Reports — 10GB CSV không giết service",
      minutes: 45,
      content: `
## Upload lớn + report nặng = 2 kịch bản chết service

Request HTTP bình thường 30s timeout. Upload CSV 10k dòng + import: 5 phút. Báo cáo tổng hợp quý: 3 phút. Làm synchronous = request thread bị giữ, LB timeout, pod OOM. Giải pháp: async job pattern.

---

## 1. Upload nhỏ — MultipartFile trực tiếp

~~~java
@PostMapping(value = "/imports", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<ImportResult> importCsv(
        @RequestPart("file") MultipartFile file) {

    if (file.getSize() > 1_000_000) throw new PayloadTooLargeException();

    try (BufferedReader reader = new BufferedReader(
            new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
        ImportResult result = importService.process(reader);   // < 30s
        return ResponseEntity.ok(result);
    } catch (IOException e) {
        throw new FileStorageException("Cannot read upload", e);
    }
}
~~~

Giới hạn upload server:

~~~yaml
spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 12MB
~~~

## 2. Upload lớn — S3 presigned URL (server không trung chuyển)

~~~text
Client → POST /imports {filename, contentType}      → server sinh presigned PUT URL
Client → PUT S3 presigned URL (upload thẳng S3)     → bytes không qua server!
Client → POST /imports/{id}/complete                → server đọc từ S3 xử lý
~~~

~~~java
@Value("\${app.import.bucket}")
private String bucket;

@PostMapping("/imports")
public PresignedUpload create(
        @RequestBody CreateImportRequest req) {

    String key = "imports/%s/%s.csv".formatted(tenantId(), UUID.randomUUID());

    String uploadId = importStore.create(key, req);    // record PENDING

    PutObjectRequest put = PutObjectRequest.builder()
        .bucket(bucket).key(key)
        .contentType(req.contentType()).build();

    String url = s3.presignPutObject(b -> b
        .signatureDuration(Duration.ofMinutes(15))
        .putObjectRequest(put));

    return new PresignedUpload(uploadId, url);
}
~~~

10GB không chạm pod — bandwidth + memory của app không tốn 1 byte cho việc trung chuyển.

## 3. Report nặng — async job + status polling

~~~java
@Service
public class ReportService {

    @Async("reportExecutor")
    public CompletableFuture<ReportResult> generateQuarterly(String tenantId, Quarter q) {
        // 3 phút query + aggregate + ghi S3
        ReportResult r = aggregate(tenantId, q);
        reportStore.markCompleted(r.id(), s3Url(r));
        return CompletableFuture.completedFuture(r);
        // Callers poll GET /reports/{id} lấy URL
    }
}
~~~

~~~java
@PostMapping("/reports/quarterly")
public ResponseEntity<Void> requestReport(@RequestBody QuarterlyReportRequest req) {
    String id = reportService.create(req);       // PENDING row
    reportService.generateQuarterlyAsync(id, req);
    return ResponseEntity.accepted()
        .location(URI.create("/reports/" + id))  // 202 + Location header
        .build();
}

@GetMapping("/reports/{id}")
public ReportStatus status(@PathVariable String id) {
    return reportService.status(id);             // PENDING / RUNNING / COMPLETED(url) / FAILED(error)
}
~~~

Pattern **202 Accepted + Location + polling** là chuẩn REST cho tác vụ dài — client không giữ connection, service không giữ thread chờ.

## 4. Executor riêng — không mượn pool chung

~~~java
@Configuration
@EnableAsync
public class ReportConfig {

    @Bean("reportExecutor")
    public Executor reportExecutor() {
        ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(2);           // report nặng, ít thread
        ex.setMaxPoolSize(2);
        ex.setQueueCapacity(20);         // hàng đợi dài — job chờ thay vì từ chối
        ex.setThreadNamePrefix("report-");
        ex.setRejectedExecutionHandler(new ThreadPoolExecutor.AbortPolicy());
        return ex;
    }
}
~~~

:::warn QUEUE ĐẦY = 500
Queue 20 job đang full &rarr; request mới nhận RejectedExecutionException &rarr; 503 Service Unavailable (đúng semantic). Đừng để CallerRunsPolicy mặc định cho report pool — nó đẩy việc nặng về Tomcat request thread, giết toàn service.
:::

## 5. Progress tracking — client hiển thị %

~~~java
public record ReportStatus(
    String id,
    ReportState state,        // PENDING, RUNNING, COMPLETED, FAILED
    int percentComplete,      // 0-100
    String resultUrl,         // S3 URL khi COMPLETED
    String error              // khi FAILED
) {}
~~~

Worker cập nhật progress vào DB/Redis mỗi 5% — polling GET /reports/{id} thấy tiến độ. UX không treo "loading..." 3 phút.

## 6. Import CSV streaming — batch 500 dòng

~~~java
@Transactional
public void importBatch(List<MemberRow> rows) {
    // 500 dòng / batch — batch_insert_max_size
    memberRepo.saveAll(rows.stream().map(this::toEntity).toList());
}
~~~

Đọc streaming + commit theo batch: crash giữa chừng &rarr; batch đã commit còn, batch chưa được rollback — resume được bằng row cursor. KHÔNG mở transaction 5 phút cho 1 triệu dòng: lock kéo dài, connection bị timeout, undo log khổng lồ.

:::laas OLS/LAAS batchUpload từng bị gán @GetMapping — ngoài lỗi semantics, endpoint xử lý đồng bộ request 5 phút là vấn đề 2 tầng. Bài này cho bạn pattern chuẩn: upload &rarr; S3 presigned, xử lý &rarr; async job + polling, tiến độ &rarr; status endpoint. Đối chiếu flow cũ bị treo connection với pattern mới.
:::

:::takeaways
- File nhỏ: MultipartFile + giới hạn max-file-size
- File lớn: S3 presigned PUT — bytes không qua server
- Tác vụ dài: 202 + Location + polling status — không giữ connection
- Executor riêng cho report/import — queue có giới hạn, reject rõ ràng
- Import lớn: streaming + batch commit — không transaction 5 phút
- Progress % qua status endpoint — UX không "treo"
:::
`
    },
    {
      id: "2-6",
      type: "lesson",
      title: "Real-time: SSE & WebSocket — server đẩy thay vì client kéo",
      minutes: 45,
      content: `
## Polling mỗi 5 giây cho notification = đốt server vô nghĩa

Dashboard admin muốn thấy transaction mới ngay lập tức. Cách thủ công: setInterval polling — 1000 user × 12 request/phút = 12.000 request rác mỗi phút khi chẳng có gì mới. Real-time đúng nghĩa: server PUSH. 2 lựa chọn: WebSocket (2 chiều) và SSE (1 chiều).
---

## 1. Chọn đúng công cụ

| | Polling | SSE | WebSocket |
|---|---|---|---|
| Hướng | Client kéo | Server đẩy (1 chiều) | 2 chiều song song |
| Protocol | HTTP | HTTP thường | WS (upgrade) |
| Tự reconnect | — | Có sẵn (EventSource) | Tự viết |
| Dùng khi | Đơn giản, dữ liệu ít đổi | Notification, feed, progress | Chat, collaborative edit, game |

90% use case "hiện real-time cho user" chỉ cần SSE — notification vốn 1 chiều. WebSocket khi CLIENT cũng cần đẩy liên tục (chat, editing chung tài liệu).

## 2. SSE — 40 dòng, production-ready

~~~java
@RestController
public class TransactionStreamController {

    private final SseEmitterManager emitters;

    public TransactionStreamController(SseEmitterManager emitters) {
        this.emitters = emitters;
    }

    @GetMapping(value = "/api/v1/transactions/stream",
                produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@AuthenticationPrincipal Jwt jwt) {
        return emitters.register(jwt.getSubject());   // 1 connection per user
    }
}
~~~

~~~java
@Component
public class SseEmitterManager {

    private final Map<String, SseEmitter> active = new ConcurrentHashMap<>();

    public SseEmitter register(String userId) {
        SseEmitter emitter = new SseEmitter(30_000L);   // timeout 30s

        emitter.onCompletion(() -> active.remove(userId));
        emitter.onTimeout(() -> active.remove(userId));
        emitter.onError(e -> active.remove(userId));

        active.put(userId, emitter);
        return emitter;
    }

    public void push(String userId, TransactionEvent event) {
        SseEmitter emitter = active.get(userId);
        if (emitter == null) return;            // user offline — bỏ qua

        try {
            emitter.send(SseEmitter.event()
                .name("transaction")
                .data(event));
        } catch (IOException e) {
            active.remove(userId);              // connection chết — dọn
        }
    }
}
~~~

Frontend — 5 dòng:

~~~javascript
const es = new EventSource("/api/v1/transactions/stream");
es.addEventListener("transaction", (e) => {
    appendToDashboard(JSON.parse(e.data));   // UI tự update
});
// EventSource TỰ reconnect khi mạng đứt — không viết thêm gì
~~~

## 3. Kafka consumer đẩy vào SSE — chuỗi hoàn chỉnh

~~~java
@KafkaListener(topics = "transaction-events")
public void onTransaction(TransactionEvent event) {
    if (event.type().equals("TXN_CREATED")) {
        emitters.push(event.memberId(), event);    // chỉ user liên quan
    }
}
~~~

Kafka (service ghi) → consumer (notification-svc) → SSE → browser. Outbox đảm bảo event không mất (Module 6) — SSE chỉ là cánh cửa hiển thị.

## 4. WebSocket + STOMP — khi cần 2 chiều

~~~xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
~~~

~~~java
@Configuration
@EnableWebSocketMessageBroker
public class WsConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("https://admin.addpay.africa");
    }
}
~~~

~~~java
@Controller
public class LiveController {

    @MessageMapping("/redeem")                    // client gửi /app/redeem
    @SendToUser("/queue/redeem-result")           // phản hồi RIÊNG user đó
    public RedeemResult redeem(RedeemCommand cmd, Principal user) {
        return redeemService.execute(cmd, user.getName());
    }
}
~~~

:::warn AUTH WEBSOCKET — BẪY SỐ 1
Browser WebSocket API KHÔNG cho set Authorization header khi upgrade. 3 lối: (1) token trong query param — lộ trong access log, tránh; (2) handshake interceptor đọc cookie HttpOnly (BFF pattern — sạch nhất); (3) first-message auth (connect xong mới gửi token). Production: cookie qua BFF hoặc subprotocol header. KHÔNG dùng query param chứa token dài hạn.
:::

## 5. Scale-out — nhiều pod, connection rải rác

Pod A giữ connection của user X, Kafka consumer chạy ở pod B → push không tới X. Giải pháp:

~~~text
Cách 1: Redis pub/sub — consumer publish "user-X có event",
        MỌI pod nhận, pod nào đang giữ X thì đẩy SSE

Cách 2: Kafka partition key = userId — event route về pod xử lý user đó
~~~

~~~java
@EventListener
public void onRedisMessage(RedisPushMessage msg) {
    emitters.push(msg.getUserId(), msg.getEvent());
    // chỉ pod giữ connection mới có user trong map — pod khác no-op
}
~~~

## 6. Backpressure — server không phải vô hạn

~~~java
@Bean("ssePushExecutor")
public TaskExecutor ssePushExecutor() {
    ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
    ex.setCorePoolSize(4);
    ex.setQueueCapacity(100);
    // đầy queue → discard event hiển thị, KHÔNG block thread nghiệp vụ
    ex.setRejectedExecutionHandler(new ThreadPoolExecutor.DiscardPolicy());
    return ex;
}
~~~

Dashboard mất 1 event hiển thị không chết ai — quá tải thì DROP sớm, không để phình queue. Nghiệp vụ thì khác: redemption result phải guaranteed (HTTP response hoặc Kafka + outbox), SSE chỉ là display layer.

:::laas OLS dashboard transaction bạn từng fix (mapper Pm lỗi) là ứng cử viên hoàn hảo cho SSE: hiện tại frontend poll hoặc refresh tay. Chuỗi chuẩn: OL60 transaction event → Kafka → notification-svc → SSE push → dashboard tự update. Backpressure: burst giờ cao điểm 500 event/s — push queue đầy thì drop display event, KHÔNG đụng nghiệp vụ.
:::

:::takeaways
- 90% real-time notification chỉ cần SSE: 1 chiều, tự reconnect, đi HTTP thường qua được gateway
- WebSocket+STOMP khi client cũng đẩy liên tục (chat, collab edit)
- Auth browser không set header khi upgrade — cookie BFF hoặc handshake interceptor
- Scale-out: Redis pub/sub hoặc Kafka partition key để event tới đúng pod giữ connection
- Backpressure: display layer được phép DROP — nghiệp vụ layer không bao giờ
- SSE là display layer — guaranteed delivery vẫn thuộc outbox + Kafka
:::
`
    },
    {
      id: "2-7",
      type: "lesson",
      title: "API Contract-First — OpenAPI generate & Pact consumer-driven",
      minutes: 40,
      content: `
## Frontend chờ backend xong, backend chờ chốt design — vòng lặp chết

Code-first: backend viết xong mới sinh OpenAPI từ annotation → frontend bắt đầu mock từ đó. Contract-first: 2 team duyệt chung 1 file yaml TRƯỚC, generate cả server lẫn client từ cùng spec. Thêm lớp chốt hạ: consumer-driven contract test chặn regression phá API trước khi lên production.
---

## 1. Code-first vs Contract-first

| | Code-first (springdoc) | Contract-first (openapi-generator) |
|---|---|---|
| Nguồn sự thật | Code Java | File api.yaml |
| Docs lạc hậu | Hay xảy ra (quên annotation) | Không thể (docs generate từ spec) |
| Frontend bắt đầu | Sau khi backend xong | Ngay từ spec (mock server) |
| Review | Đọc code diff | Đọc yaml diff — review API như review schema DB |
| Breaking change | Phát hiện muộn (consumer chết) | Tool diff phát hiện ngay |

## 2. Workflow contract-first

~~~text
1. Design:   api.yaml (paths, schemas, errors, examples)
2. Review:   tech lead frontend + backend cùng duyệt yaml
3. Generate: server interfaces + DTOs, client TypeScript
4. Mock:     Prism chạy từ yaml — frontend dev không chờ backend
5. Implement: controller implements interface đã generate
6. CI:       openapi-diff chặn breaking change vô tình
~~~

## 3. api.yaml — spec chuẩn enterprise

~~~yaml
openapi: 3.1
info:
  title: Loyalty API
  version: "1.0.0"
paths:
  /api/v1/members/{cif}/points:
    get:
      operationId: getPoints
      parameters:
        - name: cif
          in: path
          required: true
          schema: { type: string }
      responses:
        "200":
          description: Diem hien tai
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PointsBalance"
        "404":
          $ref: "#/components/responses/NotFound"
components:
  schemas:
    PointsBalance:
      type: object
      required: [cif, available, pending]
      properties:
        cif: { type: string, examples: ["CIF-001"] }
        available: { type: integer, format: int64 }
        pending: { type: integer, format: int64 }
~~~

Spec chứa cả examples — mock server trả đúng shape, frontend code thật từ ngày đầu.

## 4. Generate + implement — compile là luật

~~~xml
<plugin>
    <groupId>org.openapitools</groupId>
    <artifactId>openapi-generator-maven-plugin</artifactId>
    <executions>
        <execution>
            <goals>
                <goal>generate</goal>
            </goals>
            <configuration>
                <inputSpec>\${project.basedir}/src/main/resources/api.yaml</inputSpec>
                <generatorName>spring</generatorName>
                <configOptions>
                    <interfaceOnly>true</interfaceOnly>
                    <useSpringBoot3>true</useSpringBoot3>
                </configOptions>
            </configuration>
        </execution>
    </executions>
</plugin>
~~~

~~~java
// GENERATE — không sửa tay
public interface PointsApi {
    ResponseEntity<PointsBalance> getPoints(String cif);
}

// IMPLEMENT — signature phải khớp
@RestController
public class PointsController implements PointsApi {

    private final LoyaltyService loyaltyService;

    @Override
    public ResponseEntity<PointsBalance> getPoints(String cif) {
        return ResponseEntity.ok(loyaltyService.balance(cif));
    }
}
~~~

Đổi yaml → generate lại → controller lệch signature → COMPILE ERROR. Contract là luật được compiler thực thi, không phải tài liệu hy vọng dev đọc.

Frontend dùng cùng 1 file:

~~~bash
npx @openapitools/openapi-generator-cli generate \
  -i api.yaml -g typescript-fetch -o src/api
~~~

## 5. Breaking change — detect trước khi ship

~~~bash
npx @openapi-diff api-v1.yaml api-v2.yaml
~~~

~~~text
BREAKING: GET /points — response 200: removed property 'available'
NON-BREAKING: added optional property 'pendingExpiry'
~~~

Xóa field = breaking (client cũ đang đọc). Thêm optional = an toàn. Quy tắc versioning: breaking → đường dẫn /v2 hoặc versioned header — không âm thầm đổi shape.

## 6. Consumer-driven contract — Pact

Provider test khẳng định API thật KHÔNG phá expectation mà consumer đã ghi lại:

~~~java
@PactBroker
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Provider("loyalty-service")
class LoyaltyProviderPactTest {

    @TestTemplate
    @ExtendWith(PactVerificationSpringProvider.class)
    void verifyPact(PactVerificationContext ctx) {
        ctx.verifyInteraction();   // từng expectation của từng consumer
    }
}
~~~

~~~bash
# Provider CI: kéo mọi contract consumer đã publish → verify
# Chốt hạ trước deploy:
pact-broker can-i-deploy --pacticipant loyalty-service --version \${GIT_SHA}
~~~

can-i-deploy FAIL trong CI = chặn deploy — provider vừa phá hợp đồng với consumer, biết TRƯỚC khi production chết.

:::laas OLS có OL51 (campaign), OL56 (balance), OL60 (transactions) — mỗi API bị admin SPA + mobile app + internal service cùng tiêu thụ: xóa 1 field phản hồi phá 3 chỗ một lúc. Đối chiếu incident bạn từng xử lý: proxy phải tự tổng hợp campaignData vì backend lỗi — với contract-first + Pact, backend biết chính xác ai đang phụ thuộc field nào TRƯỚC khi đụng vào.
:::

:::takeaways
- Contract-first: yaml là nguồn sự thật — generate server + client từ cùng 1 spec
- interfaceOnly: controller implements interface — compile chặn sai contract
- Mock server (Prism) từ yaml — frontend dev song song, không chờ backend
- openapi-diff trong CI: breaking change phát hiện trước khi ship
- Pact + can-i-deploy: provider verify expectation consumer — chặn deploy phá hợp đồng
- Review yaml như review schema DB — API là interface sống lâu nhất của hệ thống
:::
`
    },
    {
      id: "2-8",
      type: "lesson",
      title: "GraphQL cho aggregate API — và khi nào KHÔNG dùng",
      minutes: 40,
      content: `
## Mobile cần 3 field, REST trả 40 — over-fetching đốt bandwidth

Dashboard tổng quan cần: tên member + điểm + 3 transaction cuối. REST: gọi 3 endpoint, mỗi payload 40 field, mobile burn data. GraphQL: 1 query, đúng field mình cần, không thừa 1 byte. Bài này: schema-first, resolver, N+1 — và ranh giới khi GraphQL là over-engineering.
---

## 1. Vấn đề GraphQL giải quyết

| REST đau | GraphQL đáp |
|---|---|
| Over-fetch: /members trả 40 field, UI dùng 3 | Query chọn field chính xác |
| Under-fetch: dashboard gọi 3-5 endpoint lặp | 1 query lấy đủ aggregate |
| Endpoint nổ: /members?include=points&expand=txns | Client tự nối graph |
| Versioning: /v1 /v2 song song tồn tại | Evolve schema không breaking (deprecated field) |

## 2. SDL — schema trước, code sau

~~~graphql
type Member {
  cif: ID!
  fullName: String!
  tier: Tier!
  balance: PointsBalance!
  recentTransactions(limit: Int = 5): [Transaction!]!
}

type Query {
  member(cif: ID!): Member
  members(page: Int = 0, size: Int = 20): MemberPage!
}

type Mutation {
  earn(input: EarnInput!): Transaction!
}
~~~

Schema là hợp đồng — đúng tinh thần contract-first bài trước, nhưng client được quyền "cắt" hợp đồng theo nhu cầu field.

## 3. Spring for GraphQL

~~~xml
<dependency>
    <groupId>org.springframework.graphql</groupId>
    <artifactId>spring-graphql-starter</artifactId>
</dependency>
~~~

~~~java
@Controller
public class MemberGraphController {

    @QueryMapping
    public Member member(@Argument String cif) {
        return memberService.findByCif(cif);
        // Member là record — field đơn giản (cif, fullName) map tự động
    }

    @SchemaMapping(typeName = "Member", field = "recentTransactions")
    public List<Transaction> recentTransactions(Member member, @Argument int limit) {
        return txService.findTopByCif(member.cif(), limit);
    }
}
~~~

@QueryMapping = root query. @SchemaMapping = resolver cho field phức tạp cần query riêng. Query client:

~~~graphql
query Dashboard($cif: ID!) {
  member(cif: $cif) {
    fullName
    tier
    balance { available }
    recentTransactions(limit: 3) {
      amount
      createdAt
    }
  }
}
~~~

Response có đúng shape đã query — mobile tải vài trăm byte thay vì vài KB rác.

## 4. N+1 — bẫy chết người của resolver

~~~text
Query: members(page: 0, size: 20) { tier { name } }

Resolver naive: 1 query danh sách member + MỖI member 1 query tier = 21 query
DataLoader:    1 query danh sách + 1 query WHERE id IN (20 tier id) = 2 query
~~~

~~~java
@Bean
public BatchLoaderRegistry tierBatchLoader(TierRepository repo) {
    return (keys, env) -> CompletableFuture.supplyAsync(() ->
        repo.findAllById(keys));   // 1 query IN cho cả batch
}
~~~

GraphQL Java tự gom các resolve đồng thời → DataLoader batch thành 1 query. Quên DataLoader: dashboard 20 item = 21 query DB, p99 cháy — mà GraphiQL dev test không lộ, chỉ bung khi load test.

## 5. Security & limits — surface tấn công rộng hơn REST

| Bảo vệ | Lý do |
|---|---|
| Query depth limit | Đệ quy member.friends.friends... nổ theo cấp số nhân |
| Complexity limit | 1 query kéo cả bảng — DoS bằng query đẹp |
| Field-level auth | balance chỉ chủ sở hữu + operator thấy (check JWT claim trong resolver) |
| Persisted queries | Client gửi hash thay vì query text — whitelist chặn chèn query lạ |
| Disable GraphiQL + introspection ở prod | Không tặng kèm IDE và sơ đồ API cho kẻ tấn công |

~~~yaml
spring:
  graphql:
    graphiql:
      enabled: false        # khong ship IDE vao prod
    schema:
      inspection:
        enabled: false
~~~

## 6. Khi nào KHÔNG dùng GraphQL

- CRUD đơn giản ít entity — REST + springdoc đủ, thêm layer là over-engineering
- Upload/download file lớn — REST streaming hợp hơn
- Cần cache HTTP đơn giản (GET + CDN) — GraphQL POST mặc định bypass CDN (phải dùng persisted queries)
- Team chưa nắm N+1 — tồi tệ hơn REST vì chậm một cách ẩn

Sweet spot: BFF cho dashboard/mobile tổng hợp nhiều nguồn — 1 GraphQL gateway chuẩn bị data đúng shape cho từng loại client.

:::laas OLS admin dashboard (OL51 campaign + OL56 balance + OL60 transactions) là use case BFF GraphQL kinh điển: 1 query tổng quan thay 3 endpoint riêng lẻ. Nhưng lưu ý thực tế bạn từng gặp: dashboard phải tổng hợp campaignData ở proxy vì backend chết — GraphQL gateway không hồi sinh được backend, chỉ gom chỗ gọi. GraphQL có value khi các nguồn SỐNG và client đa dạng shape.
:::

:::takeaways
- GraphQL giải over/under-fetch: client chọn đúng field, 1 query aggregate
- SDL schema là hợp đồng — tinh thần contract-first, client cắt theo nhu cầu
- @QueryMapping root, @SchemaMapping field phức tạp; record field đơn map tự động
- N+1 là bẫy số 1: DataLoader batch — 20 item là 2 query chứ không phải 21
- Depth/complexity limit + field auth + tắt GraphiQL prod — surface tấn công rộng hơn REST
- Sweet spot: BFF aggregate cho dashboard/mobile — không thay REST cho CRUD thuần
:::
`
    },
    {
      id: "2-9",
      type: "lesson",
      title: "REST nâng cao — HATEOAS, i18n & lỗi đa ngôn ngữ",
      minutes: 40,
      content: `
## Mobile client hard-code đường link — API đổi path là chết hàng loạt

Client ghép URL tay: /api/v1/members/ + cif + /points. Backend refactor path → mọi client bản cũ gãy. HATEOAS trả về CẢ đường link trong response — client follow link, không tự ghép. Cùng lúc đó: hệ đa thị trường (VN + Africa) cần message lỗi tiếng Việt/tiếng Anh theo Accept-Language của user.
---

## 1. Maturity model Richardson — REST level nào?

| Level | Ý nghĩa | Ví dụ |
|---|---|---|
| 0 | HTTP làm transport | POST /getPoints |
| 1 | Resource riêng biệt | GET /members/CIF-001 |
| 2 | HTTP verbs + status code đúng nghĩa | GET/POST/PUT/DELETE + 201/404/409 |
| 3 | HATEOAS — hypermedia điều hướng | Response chứa link next step |

Hầu hết hệ enterprise dừng ở level 2 — và đó ỔN. Level 3 có giá trị khi client đa dạng không kiểm soát được version (public API, mobile app cũ không force update).

## 2. Spring HATEOAS — response tự mô tả

~~~xml
<dependency>
    <groupId>org.springframework.hateoas</groupId>
    <artifactId>spring-hateoas</artifactId>
</dependency>
~~~

~~~java
import static org.springframework.hateoas.server.mvc
    .WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc
    .WebMvcLinkBuilder.methodOn;

@GetMapping("/api/v1/members/{cif}/points")
public EntityModel<PointsBalance> getPoints(@PathVariable String cif) {
    PointsBalance balance = loyaltyService.balance(cif);

    return EntityModel.of(balance,
        linkTo(methodOn(PointsController.class)
            .getPoints(cif)).withSelfRel(),
        linkTo(methodOn(TransactionController.class)
            .recentTransactions(cif, 20)).withRel("recent-transactions"),
        linkTo(methodOn(RedeemController.class)
            .redeem(null, null)).withRel("redeem"));
}
~~~

~~~json
{
  "cif": "CIF-001",
  "available": 15000,
  "_links": {
    "self": { "href": "http://api.addpay.africa/api/v1/members/CIF-001/points" },
    "recent-transactions": { "href": ".../members/CIF-001/transactions?size=20" },
    "redeem": { "href": ".../redeem", "type": "POST" }
  }
}
~~~

Client chỉ cần biết ĐIỂM VÀO (entry point /api) — mọi bước sau follow link. Backend đổi cấu trúc URL, client không cần release.

:::warn HATEOAS KHÔNG PHẢI LUÔN ĐÁNG
HATEOAS tăng kích thước response (link lặp lại mỗi item trong list — paging 50 item × 5 link) và chi phí build. Với internal API giữa các service mình kiểm soát version — REST level 2 + OpenAPI contract (bài 2-7) gọn hơn nhiều. Dùng HATEOAS cho public API/mobile lâu dài; không dùng để "đúng chuẩn" hình thức.
:::

## 3. i18n — MessageSource

~~~text
src/main/resources/
  messages.properties          (mặc định — fallback)
  messages_vi.properties       (tiếng Việt)
  messages_en.properties       (tiếng Anh)
~~~

~~~properties
# messages_vi.properties
error.member.notfound=Không tìm thấy thành viên {0}
error.points.insufficient=Số dư không đủ: cần {0}, hiện có {1}

# messages_en.properties
error.member.not_found=Member not found: {0}
error.points.insufficient=Insufficient balance: need {0}, have {1}
~~~

~~~java
@RestController
@RequestMapping("/api/v1")
public class MemberController {

    private final MessageSource messages;

    @GetMapping("/members/{cif}")
    public ResponseEntity<?> get(@PathVariable String cif, Locale locale) {
        return memberService.findByCif(cif)
            .<ResponseEntity<?>>map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.status(404).body(
                Map.of("error", messages.getMessage(
                    "error.member.notfound", new Object[]{cif}, locale))));
    }
}
~~~

Spring tự resolve Locale từ header Accept-Language (en, vi-VN...) — client chỉ cần gửi đúng header, không cần endpoint riêng từng ngôn ngữ.

## 4. Tự động hóa — AcceptHeaderLocaleResolver

~~~java
@Configuration
public class LocaleConfig {

    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setDefaultLocale(Locale.of("vi"));   // thị trường chính
        resolver.setSupportedLocales(List.of(Locale.of("vi"), Locale.of("en")));
        return resolver;
    }
}
~~~

Locale unsupported → fallback default. Không expose LocaleResolver qua URL query (?lang=) cho API công — header là chuẩn HTTP, không tạo URL khác nhau cùng nội dung (tốn cache).

## 5. Kết hợp Problem Details RFC 7807 + i18n

~~~java
@RestControllerAdvice
public class GlobalExceptionHandler {

    private final MessageSource messages;

    @ExceptionHandler(InsufficientPointsException.class)
    public ProblemDetail handleInsufficient(InsufficientPointsException ex,
                                            Locale locale) {
        ProblemDetail pd = ProblemDetail
            .forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY,
                messages.getMessage("error.points.insufficient",
                    new Object[]{ex.getRequired(), ex.getCurrent()}, locale));
        pd.setTitle("insufficient-points");
        pd.setProperty("required", ex.getRequired());
        pd.setProperty("current", ex.getCurrent());
        pd.setProperty("correlationId", MDC.get("traceId"));
        return pd;
    }
}
~~~

Chi tiết kỹ thuật (title machine-readable, correlationId) giữ nguyên mọi locale — chỉ human-detail dịch. Log phân tích không vỡ vì keyword tiếng Anh chuẩn; user đọc message ngôn ngữ mình.

## 6. Validation message đa ngôn ngữ

~~~java
public record RedeemRequest(
    @NotBlank(message = "{redeem.cif.notblank}")
    String cif,

    @Min(value = 1, message = "{redeem.amount.min}")
    long amount
) {}
~~~

~~~properties
# messages_vi.properties
redeem.cif.notblank=CIF không được để trống
redeem.amount.min=Số điểm đổi tối thiểu là {value}

# messages_en.properties
redeem.cif.notblank=CIF must not be blank
redeem.amount.min=Minimum redeem amount is {value}
~~~

Chuỗi {key} trong annotation → MessageSource resolve theo locale của request. Toàn bộ message tập trung 1 chỗ properties — dịch viên/PO sửa không đụng code, không recompile.

:::laas AddPay vận hành đa thị trường châu Phi + đội dev VN: API lỗi trả tiếng Anh cho operator tool, tiếng địa phương cho mobile app end-user — cùng 1 backend, khác mỗi header Accept-Language. Đối chiếu: chuẩn hóa error.title machine-readable (insufficient-points) giúp CloudWatch alarm và dashboard filter theo loại lỗi không phụ thuộc ngôn ngữ hiển thị — tách bạch message cho MÁY và message cho NGƯỜI.
:::

:::takeaways
- HATEOAS (Richardson level 3): response chứa link, client follow không tự ghép URL — cho public/mobile API
- Internal API mình kiểm soát version: level 2 + OpenAPI contract gọn hơn HATEOAS
- MessageSource + Accept-Language: 1 backend đa ngôn ngữ — không endpoint riêng từng thứ tiếng
- Problem Details + i18n: title machine-readable cố định mọi locale, detail dịch theo user
- Validation message {key} → properties tập trung — sửa nội dung không đụng code, không recompile
- URL query ?lang= cho API công là anti-pattern — header chuẩn HTTP và cache-friendly
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
