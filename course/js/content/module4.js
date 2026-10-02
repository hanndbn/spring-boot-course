/* MODULE 4 — Testing */
window.COURSE_MODULES = window.COURSE_MODULES || [];
window.COURSE_MODULES.push({
  id: 4,
  title: "Testing",
  subtitle: "JUnit 5, Mockito, Testcontainers",
  icon: "🧪",
  desc: "Test pyramid bài bản: unit → slice → integration với DB thật qua Testcontainers.",
  lessons: [
    {
      id: "4-1",
      type: "lesson",
      title: "JUnit 5 & Mockito — Unit Test",
      minutes: 45,
      content: `
## Test pyramid — chiến lược phân bổ

~~~text
        /  E2E  \        ← ít (chậm, đắt): full request qua HTTP thật
       / Integra- \      ← vừa: @SpringBootTest + Testcontainers
      /   tion     \
     /  Slice test  \    ← @WebMvcTest, @DataJpaTest (chọn 1 tầng)
    / Unit test      \   ← nhiều (nhanh, rẻ): JUnit + Mockito
~~~

Tỷ lệ lành mạnh: ~70% unit, ~20% slice/integration, ~10% E2E.

---

## 1. JUnit 5 căn bản

~~~java
class CalculatorTest {

    @BeforeAll                    // chạy 1 lần trước tất cả (static)
    static void setupAll() { ... }

    @BeforeEach                   // chạy trước MỖI test method
    void setup() { ... }

    @Test
    @DisplayName("Cộng 2 số dương")
    void testAdd() {
        assertEquals(5, calculator.add(2, 3));
    }

    @Test
    void testDivideByZero() {
        assertThrows(ArithmeticException.class,
            () -> calculator.divide(10, 0));
    }

    @Test
    @Disabled("Chưa implement")   // bỏ qua tạm
    void future() { ... }
}
~~~

### Assertions xịn (AssertJ đi kèm spring-boot-starter-test)

~~~java
import static org.assertj.core.api.Assertions.*;

@Test
void listAssertions() {
    var tasks = service.findByStatus(DONE);

    assertThat(tasks)
        .hasSize(3)
        .extracting(Task::title)          // bóc field
        .containsExactly("A", "B", "C")   // đúng thứ tự
        .doesNotContain("X");
}

@Test
void exceptionAssertions() {
    assertThatThrownBy(() -> service.find(-1L))
        .isInstanceOf(TaskNotFoundException.class)
        .hasMessageContaining("không tồn tại");
}
~~~

### @ParameterizedTest — 1 test, nhiều case

~~~java
@ParameterizedTest
@ValueSource(strings = {"", " ", "   "})     // 3 case tự chạy
void blankTitleRejected(String title) {
    assertThatThrownBy(() -> service.create(new CreateTaskRequest(title, ...)))
        .isInstanceOf(ValidationException.class);
}

@ParameterizedTest(name = "{0} + {1} = {2}")
@CsvSource({
    "1, 2, 3",
    "0, 0, 0",
    "-1, 5, 4"
})
void addWorks(int a, int b, int expected) {
    assertEquals(expected, calculator.add(a, b));
}
~~~

## 2. Mockito — mock dependency

~~~java
@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock                       // tạo giả
    TaskRepository repository;

    @InjectMocks                // tạo thật + inject mock vào
    TaskService service;

    @Test
    void findByIdReturnsDto() {
        // Arrange — chuẩn bị dữ liệu giả
        Task task = new Task(1L, "Học Spring", TODO);
        given(repository.findById(1L)).willReturn(Optional.of(task));

        // Act
        TaskDto dto = service.findById(1L);

        // Assert
        assertThat(dto.title()).isEqualTo("Học Spring");
        then(repository).should().findById(1L);      // verify gọi đúng
    }

    @Test
    void findByIdThrowsWhenMissing() {
        given(repository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(99L))
            .isInstanceOf(TaskNotFoundException.class);
    }
}
~~~

### BDD style (given/willReturn/then)

~~~java
BDDMockito.given(mock.method(arg)).willReturn(x);   // thay when(...).thenReturn
BDDMockito.then(mock).should(times(1)).method(arg); // thay verify
~~~

### ArgumentCaptor — kiểm tra tham số truyền vào mock

~~~java
@Test
void createSavesCorrectEntity() {
    service.create(new CreateTaskRequest("Viết test", ...));

    ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
    verify(repository).save(captor.capture());       // chụp lại

    Task saved = captor.getValue();
    assertThat(saved.getTitle()).isEqualTo("Viết test");
    assertThat(saved.getStatus()).isEqualTo(TaskStatus.TODO);
}
~~~

## 3. Nguyên tắc viết test tốt

:::tip F.I.R.S.T
- **F**ast: millisecond — chậm thì không ai chạy
- **I**solated: test không phụ thuộc nhau, không phụ thuộc network
- **R**epeatable: chạy lần nào cũng ra kết quả như lần nào
- **S**elf-validating: pass/fail rõ ràng, không cần đọc log đoán
- **T**imely: viết cùng lúc với code production
:::

### Naming convention gợi ý

~~~java
@Test
void shouldReturnTaskWhenExists() { ... }

@Test
void shouldThrowNotFoundWhenTaskMissing() { ... }

@Test
void shouldNotCompleteTaskWhenAlreadyCompleted() { ... }
// method_scanario_expectedOutcome
~~~

## 4. Test coverage — con số tham khảo, không phải mục tiêu

~~~xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <executions>
        <execution>
            <goals><goal>prepare-agent</goal></goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>verify</phase>
            <goals><goal>report</goal></goals>
        </execution>
    </executions>
</plugin>
~~~

~~~bash
./mvnw verify
# Mở target/site/jacoco/index.html
~~~

80% coverage ≠ code tốt. 100% coverage code rác vẫn là rác. Coverage chỉ phát hiện **code chưa được test chạm tới**.

:::laas ĐỐI CHIẾU LAAS
Hệ thống tài chính như LAAS không thể thiếu test cho business logic quan trọng (interest calculation, idempotency). Kỹ năng mock repository/service giúp bạn test flow phức tạp mà không cần DB.
:::

:::takeaways
- Test pyramid: 70% unit (nhanh) / 20% slice / 10% E2E
- AssertJ + BDDMockito cho test đọc như tiếng Anh
- @ParameterizedTest = 1 method, nhiều case dữ liệu
- ArgumentCaptor soi object truyền vào mock.save()
- Coverage là chỉ báo, không phải mục tiêu
:::
`
    },
    {
      id: "4-2",
      type: "lesson",
      title: "Slice & Integration tests, Testcontainers",
      minutes: 50,
      content: `
## Slice test — test đúng tầng, nhẹ nhàng

Load cả Spring context cho test 1 controller thì quá đắt. Slice test chỉ nạp **đúng phần cần**.

---

## 1. @WebMvcTest — test controller + validation

~~~java
@WebMvcTest(TaskController.class)        // chỉ nạp MVC + controller này
class TaskControllerTest {

    @Autowired
    MockMvc mockMvc;                       // giả HTTP client

    @MockBean                              // mock service bên dưới
    TaskService taskService;

    @Test
    void getByIdReturns200() throws Exception {
        given(taskService.findById(1L))
            .willReturn(new TaskDto(1L, "Học Spring", ...));

        mockMvc.perform(get("/api/v1/tasks/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.title").value("Học Spring"));
    }

    @Test
    void getByIdReturns404ProblemDetail() throws Exception {
        given(taskService.findById(99L))
            .willThrow(new TaskNotFoundException(99L));

        mockMvc.perform(get("/api/v1/tasks/99"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.title").value("Resource not found"))
            .andExpect(jsonPath("$.errorCode").value("TASK_NOT_FOUND"));
    }

    @Test
    void createReturns400WhenValidationFails() throws Exception {
        String body = """
            {"title": "", "dueDate": "2030-01-01"}
            """;                          // title blank → fail

        mockMvc.perform(post("/api/v1/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors.title").exists());
    }
}
~~~

:::info MockBean là gì?
<code>@MockBean</code> thay bean thật trong context bằng mock Mockito — controller test độc lập với DB/service thật. (Spring Boot 3.4 khuyến nghị <code>@MockitoBean</code> mới.)
:::

## 2. @DataJpaTest — test repository thuần

~~~java
@DataJpaTest                              // chỉ JPA + DB in-memory, tự rollback
class TaskRepositoryTest {

    @Autowired
    TaskRepository repository;

    @Test
    void findByStatusReturnsMatching() {
        repository.save(new Task("A", TODO));
        repository.save(new Task("B", DONE));

        var result = repository.findByStatus(TODO);

        assertThat(result).hasSize(1)
            .first().extracting(Task::getTitle).isEqualTo("A");
    }
}
~~~

Mặc định dùng H2 in-memory — nhưng **H2 khác PostgreSQL**! Query native/handler cụ thể có thể pass H2 mà fail PG.

## 3. Testcontainers — DB thật trong Docker

~~~xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-testcontainers</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
            <scope>test</scope>
</dependency>
~~~

~~~java
@SpringBootTest
@Testcontainers
class TaskRepositoryIT {

    @Container
    @ServiceConnection       // Spring Boot 3.1+ tự wire datasource!
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16");

    @Autowired
    TaskRepository repository;

    @Test
    void nativeQueryWorksOnRealPostgres() {
        repository.save(new Task("A", TODO));
        var overdue = repository.findOverdue(LocalDate.now());
        assertThat(overdue).hasSize(1);
    }
}
~~~

Lần chạy đầu Docker kéo image (chậm), các lần sau container up trong ~2-3s. Bạn test trên **đúng engine DB production dùng**.

## 4. @SpringBootTest — integration full context

~~~java
@SpringBootTest(webEnvironment = RANDOM_PORT)
class TaskApiIT {

    @Autowired
    TestRestTemplate restTemplate;

    @Test
    void fullCrudFlow() {
        // Create
        var create = restTemplate.postForEntity("/api/v1/tasks",
            new CreateTaskRequest("Từ test", LocalDate.now().plusDays(3)), TaskDto.class);
        assertThat(create.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        String location = create.getHeaders().getLocation().toString();

        // Read back
        var get = restTemplate.getForEntity(location, TaskDto.class);
        assertThat(get.getBody().title()).isEqualTo("Từ test");

        // Delete
        restTemplate.delete(location);
        assertThat(restTemplate.getForEntity(location, TaskDto.class)
            .getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
~~~

## 5. Test naming & tổ chức

~~~text
src/test/java/...
├── TaskServiceTest.java          ← unit (nhanh)
├── api/
│   └── TaskControllerTest.java   ← @WebMvcTest
├── domain/
│   └── TaskRepositoryIT.java     ← @DataJpaTest + TC (*IT = integration)
└── TaskApiIT.java                ← @SpringBootTest E2E
~~~

Maven Surefire chạy <code>*Test</code> mỗi build; Failsafe chạy <code>*IT</code> ở phase verify (CI pipeline).

~~~xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-failsafe-plugin</artifactId>
    <executions>
        <execution>
            <goals>
                <goal>integration-test</goal>
                <goal>verify</goal>
            </goals>
        </execution>
    </executions>
</plugin>
~~~

## 6. Best practices tổng kết

| Nên | Tránh |
|---|---|
| 1 assertion concept / test | 1 test assert 20 thứ |
| Test hành vi, không test implementation | Mock mọi thứ rồi test chính mock đó |
| Dữ liệu test qua builder/factory | new object 50 field lặp từng test |
| Test thất bại đọc được nguyên nhân ngay | Assert message trống |
| IT riêng (*IT.java) chạy ở verify | Trộn IT vào unit test làm build chậm |

:::laas ĐỐI CHIẾU LAAS
CI/CD pipeline LAAS qua Jenkins — build fail khi test fail. Failsafe tách IT giúp <code>mvn test</code> local nhanh, còn <code>mvn verify</code> đầy đủ chạy trên Jenkins agent có Docker (Testcontainers).
:::

:::takeaways
- @WebMvcTest + MockMvc: test HTTP contract (status, jsonPath) không cần server
- @DataJpaTest: repository nhanh — nhưng H2 ≠ PG, dùng Testcontainers khi cần thật
- Testcontainers + @ServiceConnection: DB thật, tự wire
- *Test chạy mỗi build, *IT chạy phase verify (CI)
- TestRestTemplate cho E2E flow CRUD
:::
`
    },
    {
      id: "4-3",
      type: "lesson",
      title: "Mockito nâng cao — ArgumentCaptor, BDDMockito, spy",
      minutes: 40,
      content: `
## verify(mock.method()) chỉ trả lời "đã gọi" — còn dữ liệu gửi đi thì sao?

Unit test service phải xác minh: đúng tham số, đúng số lần, đúng thứ tự. Và đôi khi cần mock "gần thật" (spy) hoặc mockito-inline cho class final. Bộ công cụ nâng cao.

---

## 1. ArgumentCaptor — soi tham số truyền cho mock

~~~java
@ExtendWith(MockitoExtension.class)
class LoyaltyServiceTest {

    @Mock OutboxRepository outboxRepo;
    @Mock MemberRepository memberRepo;
    @InjectMocks LoyaltyService service;

    @Captor ArgumentCaptor<OutboxEvent> eventCaptor;

    @Test
    void earn_writes_outbox_event_with_member_data() {
        // given
        when(memberRepo.findByCif("CIF-001"))
            .thenReturn(Optional.of(Member.of(1L, "CIF-001", 500)));

        // when
        service.earn(new EarnCommand("CIF-001", 100));

        // then — soi nội dung event gửi vào outbox
        verify(outboxRepo).save(eventCaptor.capture());
        OutboxEvent event = eventCaptor.getValue();

        assertThat(event.getEventType()).isEqualTo("POINTS_EARNED");
        assertThat(event.getAggregateId()).isEqualTo("1");
        assertThat(event.getPayload())
            .contains("\\"cif\\":\\"CIF-001\\"")
            .contains("\\"amount\\":100");
    }
}
~~~

<code>verify(save(any()))</code> chỉ biết "có gọi save" — captor mở gói tham số thật để assert nghiệp vụ. Mọi test publisher/outbox/notification nên có captor: đó là điểm giao tiếp giữa service và thế giới ngoài.

## 2. BDDMockito — given/willReturn thay when/then

~~~java
import static org.mockito.BDDMockito.*;

@Test
void bdd_style() {
    // given
    given(memberRepo.findByCif("CIF-001"))
        .willReturn(Optional.of(member));

    // when
    service.earn(cmd);

    // then
    then(memberRepo).should(times(1)).findByCif("CIF-001");
    then(outboxRepo).shouldHaveNoMoreInteractions();
}
~~~

when/thenReturn đọc ngược cấu trúc Given-When-Then — BDDMockito đưa cấu trúc về đúng trật tự đọc. Cùng engine, khác cú pháp — team thống nhất 1 style.

## 3. spy — wrapper thật, đè từng method

~~~java
@Test
void spy_only_stub_heavy_method() {
    ReportService real = new ReportService(s3, reportRepo);
    ReportService spied = spy(real);

    // Chỉ đè phương thức nặng — phần còn lại chạy CODE THẬT
    doReturn(precomputed).when(spied).aggregateLargeDataset(any());

    String url = spied.generateReport("tenant-a", Q3);
    assertThat(url).isNotBlank();
}
~~~

| | mock | spy |
|---|---|---|
| Trạng thái mặc định | Rỗng — mọi method trả null/0 | Gọi method thật trừ khi stub |
| Dùng khi | Dependency giao tiếp (repo, client) | Class thật quá nặng 1 method, giữ phần còn lại |

:::warn WHEN-THEN TRÊN SPY LÀ BẪY
spy.aggregateLargeDataset(any()) stub bằng when(...) → method NẶNG vẫn chạy trước khi stub áp dụng. Trên spy luôn dùng doReturn().when(spy).method() — stub áp dụng trước, không gọi thật.
:::

## 4. mockito-inline — mock final class / static

~~~xml
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-inline</artifactId>
    <scope>test</scope>
</dependency>
~~~

~~~java
@Test
void clock_injection_better_than_static_mock() {
    Instant fixed = Instant.parse("2026-01-15T09:00:00Z");
    Clock clock = Clock.fixed(fixed, ZoneOffset.UTC);

    ExpiryService service = new ExpiryService(clock);
    assertThat(service.isExpired(Instant.parse("2026-01-14T09:00:00Z"))).isTrue();
}
~~~

mockStatic cho LocalDate.now() tồn tại nhưng là dấu hiệu code smell — inject <code>Clock</code> bean từ đầu là thiết kế sạch hơn mocking static (như ví dụ Clock.fixed vừa thấy ở trên). mockStatic chỉ cho legacy code không sửa được.

## 5. @InjectMocks — tiêm mock vào field thật

~~~java
@Mock MemberRepository memberRepo;
@Mock OutboxRepository outboxRepo;
@Mock PointEventMapper mapper;
@InjectMocks LoyaltyService service;   // constructor injection tự động

// LoyaltyService(MemberRepository, OutboxRepository, PointEventMapper)
// — Mockito tiêm 3 mock trên vào constructor lớn nhất khớp
~~~

Constructor matching: @InjectMocks tìm constructor khớp số lượng + type. Thiết kế service bằng constructor injection (final fields) → test tự nhiên sạch.

## 6. Timeout & verifyNoInteractions

~~~java
// Async method — chờ kết quả trong giới hạn
verify(executor, timeout(500)).submit(any(Runnable.class));

// Đảm bảo KHÔNG đụng dependency
verifyNoInteractions(auditRepo);
// Hoặc sau vài tương tác hợp lệ, không thêm gì khác
verifyNoMoreInteractions(memberRepo);
~~~

verifyNoInteractions là assertion thiết kế: "method này KHÔNG nên đụng audit" — chặn regression khi dev vô tình thêm coupling.

:::laas ĐỐI CHIẾU LAAS
Audit LAAS từng thấy test dùng verify(save(any())) pass nhưng event payload sai mapping — đúng vì "có gọi", sai vì "gọi cái gì". ArgumentCaptor là chuẩn bắt lỗi này: assert nội dung, không chỉ hành vi gọi. Outbox worker test của LAAS luôn captor payload JSON để chặn regression mapping.
:::

:::takeaways
- ArgumentCaptor: verify nội dung tham số — bắt lỗi mapping payload
- BDDMockito given/willReturn: đúng trật tự Given-When-Then
- spy giữ code thật + stub chọn lọc; doReturn().when() cho spy
- mockito-inline mock final/static — nhưng inject Clock luôn sạch hơn
- @InjectMocks + constructor injection = test setup chuẩn
- verifyNoInteractions là assertion kiến trúc — chặn coupling vô tình
:::
`
    },
    {
      id: "4-4",
      type: "lesson",
      title: "Test Async, Security & Kafka — những mảnh ghép khó",
      minutes: 45,
      content: `
## @Async, security context, Kafka consumer — test kiểu gì cho đúng?

Ba lớp này "vô hình" trong test thường: async chạy thread khác, security nằm filter chain, Kafka listener chạy trong container riêng. Bộ kỹ thuật chuyên biệt.

---

## 1. Test @Async method

Vấn đề: @Async trả CompletableFuture — assertion chạy trước khi method xong.

~~~java
@Configuration
@TestConfiguration
public class SyncAsyncConfig {

    @Bean("taskExecutor")        // ĐÈ executor sync trong test
    public Executor taskExecutor() {
        return Runnable::run;    // chạy ngay trên thread gọi
    }
}

@SpringBootTest
@Import(SyncAsyncConfig.class)
class ReportServiceIT {

    @Test
    void async_report_completes() throws Exception {
        CompletableFuture<ReportResult> future = service.generateQuarterly(tenant, Q3);

        ReportResult result = future.get(5, TimeUnit.SECONDS);  // chờ kết quả
        assertThat(result.url()).contains("s3://");
    }
}
~~~

2 cách: (1) @TestConfiguration đè executor bằng synchronous — @Async trở thành block call trong test, deterministic; (2) future.get(timeout) — giữ async thật nhưng chờ có giới hạn (không sleep mù quáng).

:::tip @ASYNC TEST QUYẮT ĐỊNH THÀNH
Flaky test @Async thường do thread pool race: assertion chạy trước method hoàn tất. Fix gốc: sync executor trong test profile — flakiness biến mất, test chạy nhanh hơn (không pool spawn).
:::

## 2. Test Security — @WithMockUser & jwt() mocking

~~~java
@WebMvcTest(MemberController.class)
class MemberControllerSecurityTest {

    @Autowired MockMvc mockMvc;
    @MockBean MemberService memberService;

    @Test
    void no_token_401() throws Exception {
        mockMvc.perform(get("/api/v1/members/1"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "ops@addpay.africa", roles = "OPERATOR")
    void operator_role_access_ok() throws Exception {
        given(memberService.findById(1L)).willReturn(dto);

        mockMvc.perform(get("/api/v1/members/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.cif").value("CIF-001"));
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void viewer_cannot_delete() throws Exception {
        mockMvc.perform(delete("/api/v1/members/1"))
            .andExpect(status().isForbidden());
    }
}
~~~

Resource server JWT — SecurityMockMvcRequestPostProcessors:

~~~java
import static org.springframework.security.test.web.servlet.request
    .SecurityMockMvcRequestPostProcessors.jwt;

@Test
void jwt_with_scope_claim_access() throws Exception {
    mockMvc.perform(get("/api/v1/members/1").with(jwt().jwt(t -> t
            .claim("iss", "https://keycloak:8180/realms/laas")
            .claim("preferred_username", "nguyen.van")
            .claim("scope", "openid profile member:read"))))
        .andExpect(status().isOk());
}
~~~

jwt() post-processor sinh token giả gắn claim tùy ý — không cần Keycloak chạy, filter chain xử lý đúng authentication converter thật.

## 3. Test Kafka consumer — @EmbeddedKafka

~~~xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka-test</artifactId>
    <scope>test</scope>
</dependency>
~~~

~~~java
@SpringBootTest
@EmbeddedKafka(partitions = 1, topics = "task-events")
class NotificationConsumerIT {

    @Autowired KafkaTemplate<String, TaskEvent> kafka;
    @Autowired NotificationConsumer consumer;

    @Test
    void event_consumed_and_deduped() throws Exception {
        TaskEvent event = new TaskEvent(42L, "TASK_CREATED", ...);

        kafka.send("task-events", "42", event);
        kafka.flush();

        await("consumer xử lý")
            .atMost(Duration.ofSeconds(5))
            .untilAsserted(() ->
                assertThat(consumer.processedEvents()).contains(event.id()));
    }
~~~

~~~java
        // Idempotency — gửi lại cùng event
        kafka.send("task-events", "42", event);
        kafka.flush();

        await().atMost(Duration.ofSeconds(5)).untilAsserted(() ->
            assertThat(consumer.processCount(event.id())).isEqualTo(1));  // KHÔNG tăng
    }
}
~~~

@EmbeddedKafka khởi broker trong JVM test — producer thật gửi, consumer thật nhận, assertion bằng awaitility (poll — không Thread.sleep).

:::warn AWAITILITY KHÔNG SLEEP
Thread.sleep(2000) là flaky factory: chậm machine fail, nhanh machine waste. Awaitility poll mỗi 100ms tới khi assert pass hoặc timeout — deterministic theo điều kiện, không theo thời gian cứng.
:::

## 4. Test configuration sẵn có của Spring Security test

~~~java
// Method security — @PreAuthorize service layer
@SpringBootTest
class LoyaltyServiceSecurityIT {

    @Test
    @WithMockUser(roles = "OPERATOR")
    void operator_can_call_redeem() { ... }

    @Test
    @WithMockUser(roles = "VIEWER")
    void viewer_denied_redeem() {
        assertThatThrownBy(() -> service.redeem(cmd))
            .isInstanceOf(AccessDeniedException.class);
    }
}
~~~

Method security test không cần MockMvc — gọi service trực tiếp, AccessDeniedException bắn thẳng.

:::laas LAAS notification consumer test bằng @EmbeddedKafka + awaitility: broker in-JVM, send event thật, await consumer record. Idempotency test gửi event 2 lần assert processedCount == 1 — chính là quy tắc at-least-once của Module 6 được verify bằng test.
:::

:::takeaways
- @Async test: đè executor sync (@TestConfiguration) hoặc future.get(timeout)
- @WithMockUser cho form login; jwt() post-processor cho resource server
- @EmbeddedKafka: broker thật trong JVM, awaitility poll thay sleep
- Method security test gọi service trực tiếp — AccessDeniedException assert
- Flaky async/kafka test = race condition — sync executor + awaitility là 2 chìa khóa
:::
`
    },
    {
      id: "4-5",
      type: "lesson",
      title: "Property-Based Testing với jqwik — để máy tìm case lỗi giùm bạn",
      minutes: 40,
      content: `
## 47 test case pass — bug bung ở case thứ 48 ngoài đời

Example-based testing: dev nghĩ case, viết assertion từng case. Vấn đề: dev nghĩ theo code mình vừa viết — blind spot trùng blind spot. Property-based testing đảo chiều: bạn khai báo TÍNH CHẤT BẤT BIẾN (invariant), framework sinh ngẫu nhiên hàng trăm input tự tìm case phá vỡ.
---

## 1. Example-based vs Property-based

| | Example-based (JUnit) | Property-based (jqwik) |
|---|---|---|
| Bạn khai báo | Input cụ thể + output cụ thể | Tính chất đúng với MỌI input |
| Số case | Bằng số test viết | Hàng trăm random mỗi lần chạy |
| Phát hiện | Case bạn nghĩ ra | Case bạn KHÔNG nghĩ ra |
| Khi fail | Xem đúng case đó | jqwik shrink về case nhỏ nhất |

Ví dụ quen thuộc: tính điểm earn = amount × rate. Test example: (1000, 0.5) → 500. Còn bao nhiêu case âm/zero/overflow/rounding bạn chưa viết?

## 2. jqwik — property đầu tiên

~~~xml
<dependency>
    <groupId>net.jqwik</groupId>
    <artifactId>jqwik</artifactId>
    <version>1.8.5</version>
    <scope>test</scope>
</dependency>
~~~

~~~java
import net.jqwik.api.*;
import static org.assertj.core.api.Assertions.assertThat;

class PointsCalculatorPropertyTest {

    private final PointsCalculator calc = new PointsCalculator();

    @Property
    void earn_never_negative(
            @ForAll @IntRange(min = 0, max = 1_000_000) int amount,
            @ForAll @DoubleRange(min = 0, max = 10) double rate) {
        assertThat(calc.earn(amount, rate)).isNotNegative();
    }

    @Property
    void earn_is_monotonic(
            @ForAll @IntRange(min = 0, max = 100_000) int a,
            @ForAll @IntRange(min = 0, max = 100_000) int b,
            @ForAll @DoubleRange(min = 0, max = 5) double rate) {
        Assume.that(a <= b);
        assertThat(calc.earn(a, rate))
            .isLessThanOrEqualTo(calc.earn(b, rate));
    }
}
~~~

2 property vừa khai: điểm không bao giờ âm với input hợp lệ; earn đơn điệu (tiền nhiều hơn không bao giờ ra điểm ít hơn). jqwik chạy mặc định 1000 random input mỗi property mỗi lần build — CI của bạn liên tục săn case mới.

## 3. Tìm property ở đâu — 4 khuôn mẫu

| Khuôn mẫu | Câu hỏi | Ví dụ điểm |
|---|---|---|
| Invariant | Cái gì LUÔN đúng? | balance + pending ≥ 0 sau mọi transaction |
| Round-trip | Serialize → deserialize ra chính nó? | toJson(event) → fromJson = event gốc |
| Oracle khác | Có cách tính chậm nhưng đúng để đối chiếu? | Stream loop vs công thức closed-form |
| Biên/đơn điệu | Tham số tăng → kết quả không đổi chiều? | earn(a) ≤ earn(b) khi a ≤ b |

## 4. Shrinking — case fail nhỏ nhất có thể

~~~text
earn_is_monotonic fail với a=847291, b=382104, rate=4.71
jqwik shrink tự động → báo: a=2, b=1, rate=1.0
   → nhìn vào NGAY thấy bug off-by-one ở boundary
~~~

Không shrink: bạn nhận cặp số to vô nghĩa, mất 30 phút debug. Có shrink: case tối thiểu tự lộ — 90% thời gian nhìn phát hiểu ngay lỗi gì.

## 5. Property cho nghiệp vụ LAAS — ví dụ redeem

~~~java
@Property
void redeem_never_exceeds_balance(
        @ForAll @Positive long balance,
        @ForAll @Positive long requestAmount) {
    Assume.that(requestAmount > balance);   // vùng giao dịch từ chối
    RedeemResult result = redeemService.attempt(balance, requestAmount);
    assertThat(result.status()).isEqualTo(REJECTED);
    assertThat(result.remaining()).isEqualTo(balance);   // KHÔNG trừ gì
}

@Property
void successful_redeem_conserves_total(
        @ForAll @Positive long balance,
        @ForAll @Positive long amount) {
    Assume.that(amount <= balance);
    RedeemResult r = redeemService.attempt(balance, amount);
    assertThat(r.remaining() + r.redeemed()).isEqualTo(balance);   // bảo toàn
}
~~~

Property bảo toàn (conservation): remaining + redeemed = balance — đúng với MỌI cặp input. Đây là loại assertion bắt được lỗi trừ thừa/thiếu dòng tiền mà example-based thường bỏ sót.

## 6. Chiến lược kết hợp thực chiến

| Layer | Dùng gì | Tỷ lệ |
|---|---|---|
| Domain logic thuần | jqwik property (invariant, round-trip) | Bổ sung 10-20% |
| CRUD/adapter | example-based + Testcontainers | Phần lớn |
| Concurrency (outbox worker) | property trên thứ tự event + idempotency | Chỗ khó nhất |

Quy tắc: property cho ALGORITHM (tính toán, chuyển đổi), example cho CONFIGURATION (wiring, endpoint). Đừng ép property vào endpoint REST — những chỗ đó contract test (bài 2-7) đúng việc hơn.

:::laas LAAS đối soát giao dịch hằng ngày chính là property kiểm tự động: tổng earn − tổng redeem − tổng expire = balance cuối kỳ — tính chất bảo toàn chạy trên dữ liệu THẬT thay vì random. Đội audit không cần biết jqwik, nhưng invariant họ kiểm tay chính là property bạn nên encode vào CI: mỗi lần build trả lời "tính chất tiền không tự sinh không tự mất còn đúng không" — bằng hàng nghìn input thay vì 3 file Excel.
:::

:::takeaways
- Property-based khai báo BẤT BIẾN đúng với mọi input — framework sinh case, săn blind spot
- 4 khuôn mẫu tìm property: invariant, round-trip, oracle khác, đơn điệu
- Shrinking tự thu nhỏ case fail về tối thiểu — debug 30 phút thành 30 giây
- Property bảo toàn dòng tiền (remaining + redeemed = balance) bắt lỗi trừ sai example hay sót
- Property cho algorithm, example cho wiring, contract test cho API — đúng việc từng loại
- LAAS daily reconciliation = property trên dữ liệu thật — encode invariant tài chính vào CI
:::
`
    },
    {
      id: "4-quiz",
      type: "quiz",
      title: "Quiz Module 4 — Testing",
      minutes: 10,
      questions: [
        {
          level: "easy",
          scenario: "Team LAAS mới viết test: 90% là @SpringBootTest full context, build Jenkins mất 40 phút, dev bỏ chạy local vì chậm, bug production vẫn lọt.",
          q: "Bài học test pyramid áp dụng thế nào đây?",
          options: [
            "Tăng RAM Jenkins agent — xây cơ sở vật chất",
            "Phân bổ lại: ~70% unit test (Mockito, ms-scale), ~20% slice (@WebMvcTest/@DataJpaTest), ~10% E2E cho critical flow",
            "Xóa hết test cũ viết lại toàn bộ theo TDD",
            "Chỉ giữ lại test cho business logic quan trọng, bỏ phần còn lại"
          ],
          answer: 1,
          explain: "Pyramid không phảidogma 'bao nhiêu phần trăm' mà là nguyên tắc: tầng dưới nhanh-rẻ-phản hồi sớm. Unit ms-scale chạy mọi commit; E2E chậm đắt chỉ dành critical path (payment flow).",
          why: [
            "Tăng hạ tầng trả tiền cho vấn đề thiết kế test — 40 phút vẫn 40 phút, dev vẫn không chạy local, feedback loop vẫn chậm. Tiền mua không được kiến trúc test đúng.",
            "✓ Đúng — hạ tầng pyramid: feedback millisecond cho 70% logic (unit), second cho contract (slice), phút cho flow thật (E2E). Build tổng nhanh, phủ sâu, ổn định.",
            "Viết lại toàn bộ TDD là 'big bang' phi thực tế — mất tuần không ship feature, và TDD là kỹ năng viết test KHÔNG tự sửa phân bổ pyramid.",
            "Bỏ test phần 'không quan trọng' = vùng mù coverage — regression sẽ xuất hiện đúng chỗ không có test. Giảm số lượng không giải quyết phân bổ sai tầng."
          ]
        },
        {
          level: "medium",
          scenario: "Dev test controller: dùng @SpringBootTest load cả app (DB, Kafka, security...) chỉ để assert status 200 và jsonPath title.",
          q: "Công cụ đúng cho test HTTP contract này?",
          options: [
            "@WebMvcTest(TaskController.class) + MockMvc + @MockitoBean service — chỉ nạp MVC slice",
            "Giữ @SpringBootTest nhưng thêm @MockBean cho mọi dependency",
            "Dùng RestClient gọi URL thật deploy ở local",
            "@DataJpaTest vì controller cũng đi qua repository"
          ],
          answer: 0,
          explain: "@WebMvcTest chỉ nạp web layer: controller + converter + filter + exception handler. Service thay bằng mock → test status/jsonPath/ProblemDetail trong ~200ms, không cần DB.",
          why: [
            "✓ Đúng — slice test đúng tầng: HTTP contract (mapping, validation, status code, error format) là trách nhiệm controller. Không cần bean nào khác.",
            "@SpringBootTest + mock mọi thứ = load toàn bộ context (chậm) rồi lại mock đi phần lớn — công to mèo nhỏ. Slice annotation sinh ra cho đúng việc này.",
            "Gọi URL thật = E2E test: phụ thuộc môi trường local, chậm, khó assert chi tiết response — quá đắt cho mục đích 'kiểm contract 1 endpoint'.",
            "@DataJpaTest là JPA slice — không có MVC, không HTTP, không controller. Kiểu test hoàn toàn khác mục tiêu."
          ]
        },
        {
          level: "medium",
          scenario: "Repo test chạy H2 in-memory pass 100%. Deploy production PostgreSQL — native query findOverdue() bắn SQLSyntaxErrorException: function 'now()' không tồn tại như thế.",
          q: "Bài học và giải pháp test đúng?",
          options: [
            "Viết query thuần JPQL thay native — khỏi lo dialect",
            "Testcontainers PostgreSQLContainer: test trên cùng engine DB production dùng",
            "Chạy test trên PostgreSQL QA environment thay vì local",
            "Thêm try-catch quanh query để app không crash"
          ],
          answer: 1,
  explain: "H2 và PostgreSQL là 2 engine khác biệt (function, type system, lock, JSONB...). Testcontainers khởi postgres:16 Docker thật — dialect, function, index behavior y hệt prod. @ServiceConnection tự wire datasource.",
          why: [
            "JPQL portable hơn native thật — nhưng đôi khi native là bắt buộc (window function, CTE, performance). Tránh không phải giải pháp, là trốn tránh.",
            "✓ Đúng — 'test trên cái bạn deploy': container PostgreSQL thật trong test lifecycle, confidence production-level, chạy mọi nơi có Docker (Jenkins agent).",
            "QA environment test là staging smoke test — không phải developer test: chậm, không debug được, không chạy mỗi commit. Vấn đề cần bắt ở local/CI.",
            "try-catch nuốt SQL error = che bug dưới thảm. App 'không crash' nhưng tính năng hỏng âm thầm — tệ hơn crash."
          ]
        },
        {
          level: "easy",
          scenario: "Review: service.save(entity) được gọi nhưng test chỉ verify(repo, times(1)).save(any()) — 'chắc là ổn'. Reviewer gãi đầu.",
          q: "Cách test chặt chẽ hơn?",
          options: [
            "verify(repo, times(5)).save(any()) — gọi nhiều lần cho chắc",
            "ArgumentCaptor: verify(repo).save(captor.capture()) rồi assert từng field của entity truyền vào",
            "Thêm printStackTrace trong catch để xem log",
            "Kiểm tra coverage report — method đã 100% covered là đủ"
          ],
          answer: 1,
          explain: "any() chỉ khẳng định 'có gì đó được save' — có thể là entity rác. Captor chụp đúng object truyền vào: assert title, status, dueDate... từng field. Test nói được 'save ĐÚNG dữ liệu', không chỉ 'save có xảy ra'.",
          why: [
            "times(5) không liên quan — test đang sai ở CHẤT assertion chứ không phải SỐ LẦN verify. Gọi 5 lần vẫn any() vẫn mù.",
            "✓ Đúng — ArgumentCaptor nâng assertion từ 'hành vi xảy ra' lên 'hành vi xảy ra với dữ liệu đúng'. Đặc biệt quan trọng với mapping logic (request → entity).",
            "Print log là debug thủ công không phải assertion — test vẫn pass dù dữ liệu sai. CI log không ai đọc.",
            "100% coverage đo 'code được CHẠM tới', không đo 'code đúng'. save(garbage) vẫn coverage 100%."
          ]
        },
        {
          level: "hard",
          scenario: "Test interest calculation LAAS pass hôm qua, fail hôm nay. Logic: LocalDate.now() trực tiếp trong service — hôm nay là ngày 31 tháng, dữ liệu test fix cứng tháng 30 ngày.",
          q: "Root cause và pattern sửa đúng?",
          options: [
            "Fix cứng ngày trong dữ liệu test khớp hôm nay — sửa mỗi lần fail",
            "Inject Clock: service nhận Clock bean, test cung cấp Clock.fixed(...) — thời gian trở thành dependency kiểm soát được",
            "Đặt @Disabled cho test flaky, tạo ticket JIRA",
            "Randomize dữ liệu test để bù đắp mọi tháng"
          ],
          answer: 1,
          explain: "now() hardcoded = hidden dependency vào hệ thống ngoài (đồng hồ). Clock injectable: prod bean Clock.systemDefaultZone(), test Clock.fixed(Instant.parse(\"2026-01-15T10:00:00Z\"), ZoneId) — deterministic tuyệt đối.",
          why: [
            "Sửa dữ liệu mỗi lần fail = đuổi theo triệu chứng — cuối tháng lại fail, đầu tháng lại fail. Flaky test là nợ phải trả, không phải thói quen.",
            "✓ Đúng — thời gian là dependency như repository: inject thì control được. Test chạy 30/4 hay 31/12 đều như nhau — 'repeatable' trong F.I.R.S.T.",
            "@Disabled xóa tín hiệu regression — flaky test là canary phát hiện hidden dependency, disable = giết chim báo động.",
            "Randomize dữ liệu NGHĨA LÀ test không còn deterministic — flaky chuyển từ 'cuối tháng' sang 'random'. Trượt completely hướng giải pháp."
          ]
        },
        {
          level: "medium",
          scenario: "CI Jenkins: mvn test nhanh (unit) nhưng Testcontainers IT cần Docker — agent không có Docker, team tranh cãi nên bỏ Testcontainers.",
          q: "Giải pháp chuẩn Maven?",
          options: [
            "Bỏ Testcontainers, quay về H2 — dùng được là được",
            "Naming *IT + maven-failsafe-plugin: mvn test (Surefire) chỉ unit chạy local nhanh; mvn verify (Failsafe) chạy IT trên agent CÓ Docker ở pipeline Jenkins",
            "Chạy Docker-in-Docker trên mọi agent",
            "Đánh dấu Testcontainers test @Disabled cho đến khi có agent Docker"
          ],
          answer: 1,
          explain: "Surefire/*Test và Failsafe/*IT là cơ chế tách tầng built-in: dev local mvn test = nhanh; CI pipeline mvn verify trên agent đủ điều kiện = đầy đủ. Cùng 1 codebase, 2 chế độ chạy.",
          why: [
            "Quay về H2 = quay về vấn đề 'pass H2 fail PG' — chính lý do Testcontainers tồn tại. Giải quyết hạ tầng bằng cách hạ chất lượng test.",
            "✓ Đúng — kiến trúc standard: *Test chạy mọi nơi mỗi build (feedback nhanh), *IT chạy phase verify trên agent có Docker (confidence đầy đủ). Jenkins file cấu hình agent label cho IT stage.",
            "DinD mọi agent = phức tạp vận hành + rủi ro bảo mật (privileged container) cho vấn đề có giải pháp đơn giản hơn nhiều.",
            "@Disabled IT = mất toàn bộ giá trị Testcontainers — đúng lúc cần nhất (CI) lại không chạy. Vấn đề hạ tầng nên giải quyết bằng hạ tầng (agent label), không phải bằng cách tắt test."
          ]
        },
        {
          level: "hard",
          scenario: "UT service phức tạp: mock 5 dependency, verify 8 lần gọi, 15 assertion trong 1 method test. Refactor service đổi internals → 12 test fail dù HÀNH VI ngoài không đổi.",
          q: "Nguyên tắc test bị vi phạm?",
          options: [
            "Assertion quá ít — tăng lên 30 assertion cho chắc",
            "Test implementation thay vì behavior: mock verify chi tiết internal calls là khớp với CÁCH làm, không phải KẾT QUẢ. Assert input/output + vài tương tác then chốt",
            "Mockito không đủ mạnh — chuyển sang PowerMock",
            "Coverage thấp — bổ sung test phủ mọi branch"
          ],
          answer: 1,
          explain: "Mock verifying mọi internal call = coupling test với implementation. Refactor (đổi cách, giữ kết quả) không nên vỡ test. Chicago vs London school: với service có state, test hành vi quan sát được từ ngoài.",
          why: [
            "Tăng assertion làm tệ hơn — đã 15 assertion over-specified, 30 assertion là khóa implementation chặt hơn nữa.",
            "✓ Đúng — test contract của unit (input → output + side-effect chính), không test ánh xạ từng bước bên trong. Refactor tự do mà test vẫn xanh = test đúng vai trò regression safety net.",
            "PowerMock là công cụ legacy hack static/final — vấn đề ở đây không phải khả năng mock mà là THIẾT KẾ test. PowerMock thêm_complexity không giải quyết over-specification.",
            "Coverage không phải vấn đề — đã over-testing implementation. Thêm branch test chỉ đào sâu sai hướng."
          ]
        },
        {
          level: "easy",
          scenario: "PM hỏi: 'Coverage 85% có nghĩa 85% bug được phát hiện chứ?' Tech lead phải giải thích.",
          q: "Coverage thực sự nói lên điều gì?",
          options: [
            "85% bug bị bắt — coverage tương đương chất lượng test",
            "85% dòng/branch code được test THỰC THI qua — nhưng test có assert đúng không, có test case đủ không, coverage không nói gì",
            "85% requirement được verify",
            "85% khả năng không có bug production"
          ],
          answer: 1,
  explain: "Coverage đo 'code được chạy trong test' — mechanical fact. Test rác (assert tầm thường, không edge case) vẫn đạt coverage cao. Coverage là smoke detector: chỉ báo code KHÔNG được test chạm, không chứng minh code được test ĐÚNG.",
          why: [
            "Tương đương bug-caught là hiểu lầm phổ biến nhất — 100% coverage với assert 1==1 vẫn là 0 giá trị. Con số dễ đo bị lạm dụng thành KPI.",
            "✓ Đúng — coverage = 'đo sự thực thi', không phải 'đo sự đúng đắn'. Dùng coverage để tìm vùng MÙ (untested) thì giá trị; dùng làm mục tiêu chất lượng thì bị gaming.",
            "Requirement coverage là metrics khác (traceability matrix) — không liên quan line coverage.",
            "Xác suất bug là hàm của chất lượng test + độ phức tạp code — coverage chỉ 1 input yếu trong công thức đó."
          ]
        },
        {
          level: "hard",
          scenario: "Team viết property cho PointsCalculator: earn(amount, rate) với @ForAll int amount không giới hạn và @ForAll double rate không giới hạn. Test fail liên tục với rate âm và amount âm — nghiệp vụ thực tế không bao giờ có input này.",
          q: "Property sai ở đâu và sửa thế nào?",
          options: [
            "Framework lỗi — jqwik nên tự loại input âm",
            "Thiếu ràng buộc miền giá trị: @IntRange(min=0) cho amount, @DoubleRange(min=0,max=10) cho rate — property phải mô tả ĐÚNG tiền đề nghiệp vụ",
            "Thêm if (amount < 0) return; đầu hàm earn — cho code pass property",
            "Bỏ property testing — example-based đã đủ"
          ],
          answer: 1,
          explain: "Property-based test mạnh BẰNG chất lượng định nghĩa miền: @ForAll nghĩa là 'với MỌI input thỏa ràng buộc'. Không ràng buộc = kiểm cả vùng input không có ý nghĩa nghiệp vụ → fail không phải bug mà là property sai tiền đề. @IntRange/@DoubleRange/@Positive thu hẹp về miền hợp đồng thực — đúng nơi bug ẩn nấp. Sửa code cho qua property là đầu độc nguồn sự thật.",
          why: [
            "Framework sinh đúng những gì khai báo — vấn đề là khai báo thiếu",
            "✓ Miền giá trị là PHẦN của contract — ràng buộc đúng thì property có ý nghĩa",
            "Sửa production code cho test pass khi test sai tiền đề — đảo ngược vai trò",
            "Bỏ công cụ vì dùng sai tham số — mất đúng năng lực săn blind spot"
          ]
        }
      ]
    }
  ]
});
