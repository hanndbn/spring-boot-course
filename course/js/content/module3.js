/* MODULE 3 — Data Access: JPA, Hibernate, Flyway */
window.COURSE_MODULES = window.COURSE_MODULES || [];
window.COURSE_MODULES.push({
  id: 3,
  title: "Data Access & JPA",
  subtitle: "JPA, Hibernate, Flyway, Transactions",
  icon: "🗄️",
  desc: "Làm chủ persistence: entity mapping, N+1, transaction, migration — phase quan trọng nhất.",
  lessons: [
    {
      id: "3-1",
      type: "lesson",
      title: "Spring Data JPA & Entity Mapping",
      minutes: 55,
      content: `
## Từ JDBC đến JPA — vì sao cần abstraction

~~~java
// JDBC thuần — 25 dòng cho 1 query
try (Connection conn = dataSource.getConnection();
     PreparedStatement ps = conn.prepareStatement(
         "SELECT * FROM tasks WHERE id = ?")) {
    ps.setLong(1, id);
    try (ResultSet rs = ps.executeQuery()) {
        if (rs.next()) {
            Task t = new Task();
            t.setId(rs.getLong("id"));
            t.setTitle(rs.getString("title"));
            // ... 10 dòng set nữa
        }
    }
}

// Spring Data JPA — 1 dòng interface
public interface TaskRepository extends JpaRepository<Task, Long> {}
// repo.findById(id) — xong!
~~~

---

## 1. Thiết lập

~~~xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>
~~~

~~~bash
docker run -d --name taskdb -p 5432:5432 \
  -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=taskdb postgres:16
~~~

~~~yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/taskdb
    username: postgres
    password: secret
  jpa:
    hibernate:
      ddl-auto: validate        # ← production LUÔN validate/none!
    open-in-view: false          # ← tắt OSIV (giải thích bên dưới)
    properties:
      hibernate:
        format_sql: true
~~~

:::danger ddl-auto — quyết định 1 lần, đúng
<code>create</code>/<code>create-drop</code>: CHỈ cho demo. <code>update</code>: nguy hiểm (không xóa cột, không đổi type).\n<code>validate</code>: kiểm tra schema khớp entity, không sửa gì — **dùng cùng Flyway trong production**. <code>none</code>: mặc định khi có Flyway.
:::

## 2. Entity Mapping căn bản

~~~java
@Entity
@Table(name = "tasks",                        // tên bảng
       indexes = @Index(name = "idx_tasks_status",
                        columnList = "status"))
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String title;

    @Enumerated(EnumType.STRING)              // ⚠ LUÔN STRING, không ORDINAL!
    private TaskStatus status;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    private Long version;                     // optimistic locking

    // getters/setters (hoặc Lombok @Getter @Setter — KHÔNG @Data cho entity!)
}
~~~

:::warn ENUM: STRING, KHÔNG BAO GIỜ ORDINAL
<code>EnumType.ORDINAL</code> lưu số thứ tự — chèn enum mới vào giữa → toàn bộ dữ liệu cũ bị sai nghĩa, không có cách hồi phục. STRING tốn chút chỗ nhưng an toàn tuyệt đối.
:::

## 3. Quan hệ giữa các entity

~~~java
@Entity
public class User {
    @Id @GeneratedValue Long id;
    String name;

    // 1 user — N tasks. Manga mặc định là "bên nhiều"
    @OneToMany(mappedBy = "assignee", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Task> tasks = new ArrayList<>();
}

@Entity
public class Task {
    // N task — 1 user: bên này giữ FK
    @ManyToOne(fetch = FetchType.LAZY)        // luôn LAZY cho @ManyToOne!
    @JoinColumn(name = "assignee_id")
    private User assignee;
}
~~~

### Quy tắc vàng fetch type

| Quan hệ | Mặc định | Nên dùng |
|---|---|---|
| <code>@ManyToOne</code> | EAGER | **LAZY** |
| <code>@OneToMany</code> | LAZY | LAZY (mặc định đã đúng) |
| <code>@OneToOne</code> | EAGER | LAZY (khó hơn, nhưng cố) |
| <code>@ManyToMany</code> | LAZY | LAZY (và cân nhắc bỏ hẳn) |

:::tip NGUYÊN TẮC CỐT LÕI
**Mặc định mọi thứ LAZY, fetch eager chỉ khi chắc chắn cần.** Eager = query phình to, N+1 ẩn, không kiểm soát. Ta sẽ học cách fetch đúng chỗ ở bài N+1.
:::

## 4. Repository — derived queries

~~~java
public interface TaskRepository extends JpaRepository<Task, Long> {

    // Spring parse tên method → SQL!
    List<Task> findByStatus(TaskStatus status);

    List<Task> findByAssigneeNameAndStatus(String name, TaskStatus status);

    Optional<Task> findFirstByStatusOrderByPriorityDesc(TaskStatus status);

    boolean existsByTitleIgnoreCase(String title);   // không load entity

    long countByStatus(TaskStatus status);

    // Phân trang + sắp xếp built-in
    Page<Task> findByStatus(TaskStatus status, Pageable pageable);

    @Query("SELECT t FROM Task t WHERE t.dueDate < :date AND t.status = 'TODO'")
    List<Task> findOverdue(@Param("date") LocalDate date);

    @Query(value = "SELECT * FROM tasks WHERE ...", nativeQuery = true)
    List<Task> complexReport();
}
~~~

### Từ khóa derived query

| Keyword | Ví dụ | SQL sinh ra |
|---|---|---|
| <code>Is</code>/<code>Equals</code> | <code>findByStatus</code> | <code>WHERE status = ?</code> |
| <code>And</code> / <code>Or</code> | <code>findByAAndB</code> | AND / OR |
| <code>Between</code> | <code>findByDueDateBetween</code> | BETWEEN |
| <code>LessThan</code> | <code>findByPriorityLessThan</code> | &lt; |
| <code>IsNull</code> | <code>findByCompletedAtIsNull</code> | IS NULL |
| <code>Containing</code> | <code>findByTitleContaining</code> | LIKE %x% |
| <code>In</code> | <code>findByStatusIn(List)</code> | IN (...) |
| <code>OrderBy</code> | <code>findByStatusOrderByPriorityDesc</code> | ORDER BY |
| <code>Exists</code> / <code>Count</code> | <code>existsBy...</code> | EXISTS / COUNT |

## 5. open-in-view: false — tại sao phải tắt

Mặc định Spring Boot bật OSIV (Open Session In View): giữ Hibernate session mở cho đến khi render xong response — cho phép lazy load trong view layer.

Vấn đề: connection bị chiếm trong suốt thời gian render (kể cả render chậm), che giấu N+1, khó xử lý khi async.

:::warn CHUẨN PRODUCTION
<code>spring.jpa.open-in-view=false</code>. Load mọi dữ liệu cần trong service layer (fetch join / entity graph), DTO map xong mới ra controller. Connection trả sớm → pool khỏe.
:::

## 6. Auditing với @MappedSuperclass

~~~java
@MappedSuperclass
public abstract class Auditable {

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", updatable = false)
    private String createdBy;
}

@Entity
public class Task extends Auditable { ... }
~~~

:::laas ĐỐI CHIẾU LAAS
LAAS dùng **multi-tenant** với dynamic datasource routing. Hãy tìm class extends <code>AbstractRoutingDataSource</code> và TenantContext — đó là pattern nâng cao, sau khi xong module này bạn sẽ đọc hiểu được nó.
:::

:::takeaways
- JpaRepository + derived query = 90% nhu cầu CRUD không cần viết SQL
- @Enumerated(EnumType.STRING) — luôn luôn
- @ManyToOne set LAZY thủ công (mặc định EAGER là cái bẫy)
- open-in-view: false — tắt trong production
- Auditing qua @MappedSuperclass — createdAt/updatedAt tự động
:::
`
    },
    {
      id: "3-2",
      "type": "lesson",
      title: "N+1 Problem, Fetch strategies & Specifications",
      minutes: 50,
      content: `
## N+1 — vấn đề huyền thoại của ORM

**Định nghĩa**: query 1 lần lấy danh sách (N phần tử), rồi với mỗi phần tử lại query thêm 1 lần → tổng N+1 query.

~~~java
// ❌ N+1 kinh điển
List<Task> tasks = taskRepository.findAll();          // 1 query
for (Task t : tasks) {
    t.getAssignee().getName();                        // N query thêm!
    t.getComments().size();                           // lại N query nữa!
}
// Với 100 tasks → 201 query!
~~~

---

## 1. Phát hiện N+1

### Bật log SQL + statistic

~~~yaml
spring:
  jpa:
    properties:
      hibernate:
        format_sql: true
logging:
  level:
    org.hibernate.SQL: DEBUG              // in mọi câu SQL
    org.hibernate.orm.jdbc.bind: TRACE    // bind param (Hibernate 6)
~~~

Với 10 tasks mà log in ra 11+ câu <code>SELECT</code> giống nhau — bạn đang có N+1.

## 2. Giải pháp theo tầng

### Cách 1 — EntityGraph (khai báo trên repo)

~~~java
public interface TaskRepository extends JpaRepository<Task, Long> {

    @EntityGraph(attributePaths = {"assignee", "comments"})
    List<Task> findAll();      // JOIN FETCH assignee + comments luôn
}
~~~

### Cách 2 — JOIN FETCH trong @Query

~~~java
@Query("""
    SELECT DISTINCT t FROM Task t
    LEFT JOIN FETCH t.assignee
    LEFT JOIN FETCH t.comments
    WHERE t.status = :status
    """)
List<Task> findAllWithDetails(@Param("status") TaskStatus status);
~~~

:::tip DISTINCT LÀ BẮT BUỘC với JOIN FETCH collection
Không có DISTINCT, JOIN với collection nhân bản row — 1 task 3 comments → 3 row → Hibernate trùng lặp. DISTINCT (và Hibernate 6 fix tốt hơn) khử trùng.
:::

### Cách 3 — @BatchSize (fetch theo lô)

~~~java
@Entity
@BatchSize(size = 50)               // khi lazy load, gom 50 bản ghi/lần
public class Task { ... }

// hoặc global
spring.jpa.properties.hibernate.default_batch_fetch_size: 50
~~~

Không fix hoàn hảo như fetch join (vẫn nhiều query, chỉ là gom lại IN (...)), nhưng cứu cánh khi không thể fetch join (pagination!).

### Cách 4 — Projection (đỉnh cao tối ưu)

Cần chỉ vài field? Đừng load entity:

~~~java
// Interface projection
public interface TaskSummary {
    Long getId();
    String getTitle();
    String getAssigneeName();      // Spring tự join!

    @Value("#{target.assignee.name.toUpperCase()}")
    String getAssigneeNameUpper();
}

List<TaskSummary> findByStatus(TaskStatus status);
// SQL: SELECT t.id, t.title, u.name FROM tasks t JOIN users u ...
~~~

### So sánh 4 cách

| Cách | Khi nào dùng | Pagination? |
|---|---|---|
| JOIN FETCH | Cần entity đầy đủ + quan hệ | ❌ Cẩn thận (HHH000104) |
| EntityGraph | Tương tự fetch join, gọn hơn | ⚠ Như trên |
| @BatchSize | Không thể fetch join (page) | ✅ |
| Projection | Chỉ cần vài field | ✅ Tối ưu nhất |

:::danger JOIN FETCH + Pageable — CẢNH BÁO
Fetch join collection + phân trang in-memory: Hibernate load TOÀN BỘ row rồi mới phân trang trong RAM (HHH000104). Với bảng lớn → OOM. Giải pháp: 2 query (page ids → fetch collection theo ids) hoặc @BatchSize.
:::

## 3. Specification — dynamic query builder

Yêu cầu thực tế: "lọc task theo status HOẶC assignee HOẶC keyword, tùy client truyền gì".

~~~java
// Bật JpaSpecificationExecutor
public interface TaskRepository
        extends JpaRepository<Task, Long>,
                JpaSpecificationExecutor<Task> {}
~~~

~~~java
public class TaskSpecs {

    public static Specification<Task> hasStatus(TaskStatus status) {
        return (root, query, cb) ->
            status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<Task> assigneeNamed(String name) {
        return (root, query, cb) ->
            name == null ? null
                : cb.equal(root.get("assignee").get("name"), name);
    }

    public static Specification<Task> titleContains(String keyword) {
        return (root, query, cb) ->
            keyword == null || keyword.isBlank() ? null
                : cb.like(cb.lower(root.get("title")),
                          "%" + keyword.toLowerCase() + "%");
    }
}

// Service — kết hợp động!
Specification<Task> spec = TaskSpecs.hasStatus(status)
    .and(TaskSpecs.assigneeNamed(assignee))
    .and(TaskSpecs.titleContains(keyword));
Page<Task> page = repo.findAll(spec, pageable);
~~~

Specification trả <code>null</code> = điều kiện bị bỏ qua. <code>.and()/.or()/.not()</code> compose như predicate.

## 4. Thực hành chẩn đoán trên hệ thống thật

Bước kiểm tra nhanh 1 endpoint có N+1 không:

1. Bật <code>org.hibernate.SQL: DEBUG</code>
2. Gọi endpoint với dữ liệu vừa đủ (10-20 bản ghi)
3. Đếm câu SELECT lặp lại cùng pattern
4. Nếu lặp → chọn giải pháp ở bảng trên

:::laas ĐỐI CHIẾU LAAS
LAAS là hệ thống giao dịch tài chính — N+1 trên bảng transaction có thể kéo giãn response từ 50ms → 5s. Kỹ năng đọc log SQL và nhận diện pattern query lặp là kỹ năng "ăn tiền" khi bạn đi audit hiệu năng.
:::

:::takeaways
- N+1 = 1 query danh sách + N query quan hệ lazy
- Phát hiện: log SQL DEBUG + đếm SELECT lặp
- Fix: JOIN FETCH / EntityGraph / @BatchSize / Projection tùy ngữ cảnh pagination
- Specification = dynamic filter compose — và/trừ nhau như LEGO
:::
`
    },
    {
      id: "3-3",
      type: "lesson",
      title: "Transactions & Optimistic Locking",
      minutes: 45,
      content: `
## @Transactional — annotated giết người thầm lặng

<code>@Transactional</code> mở transaction trước method, commit khi thành công, rollback khi RuntimeException.

~~~java
@Service
public class TransferService {

    @Transactional
    public void transfer(Long from, Long to, BigDecimal amount) {
        Account a = repo.debit(from, amount);
        Account b = repo.credit(to, amount);
        // Nếu credit fail → debit cũng rollback — nguyên tắc all-or-nothing
    }
}
~~~

---

## 1. Propagation — cách transaction lan truyền

| Propagation | Ý nghĩa |
|---|---|
| <code>REQUIRED</code> (mặc định) | Có sẵn thì tham gia, không thì tạo mới |
| <code>REQUIRES_NEW</code> | Treo transaction hiện tại, tạo transaction MỚI độc lập |
| <code>NESTED</code> | Savepoint bên trong — rollback một phần |
| <code>SUPPORTS</code> | Có thì dùng, không thì chạy non-transactional |
| <code>MANDATORY</code> | Phải có sẵn, không thì exception |
| <code>NEVER</code> | Phải KHÔNG có, có thì exception |
| <code>NOT_SUPPORTED</code> | Treo transaction, chạy thường |

### Case kinh điển: REQUIRES_NEW cho audit log

~~~java
@Service
public class AuditService {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action) {
        auditRepo.save(...);    // LƯU NGAY cả khi transaction ngoài fail & rollback!
    }
}
~~~

## 2. Rollback rules — cái bẫy lớn nhất

Mặc định: **chỉ rollback với RuntimeException & Error**, KHÔNG rollback checked exception!

~~~java
@Transactional
public void process() throws Exception {
    repo.save(a);
    throw new Exception("Checked!");   // ⚠ KHÔNG rollback! a vẫn được lưu!
}

// Fix — khai báo rollbackFor
@Transactional(rollbackFor = Exception.class)
public void process2() throws Exception { ... }
~~~

:::danger QUY TẮC SỐNG CÒN
Team chuẩn nào cũng có rule: **mọi @Transactional đều ghi rõ** <code>rollbackFor = Exception.class</code>. Trừ khi bạn chắc 100% không ném checked.
:::

## 3. Isolation levels

| Level | Dirty read | Non-repeatable read | Phantom read |
|---|---|---|---|
| READ_UNCOMMITTED | Có thể | Có thể | Có thể |
| READ_COMMITTED (PG mặc định) | Không | Có thể | Có thể |
| REPEATABLE_READ | Không | Không | Có thể |
| SERIALIZABLE | Không | Không | Không |

~~~java
@Transactional(isolation = Isolation.REPEATABLE_READ)
public void report() { ... }
~~~

Thực tế: dùng mức mặc định của DB (PostgreSQL = READ_COMMITTED), chỉ nâng khi có lý do đo đếm được — SERIALIZABLE rất đắt.

## 4. Optimistic Locking với @Version

2 user cùng sửa 1 task → ghi đè lẫn nhau (lost update). <code>@Version</code> giải quyết:

~~~java
@Entity
public class Task {
    @Id @GeneratedValue Long id;

    @Version
    private Long version;        // Hibernate tự +1 mỗi update

    String title;
}
~~~

Cách hoạt động:

~~~text
User A đọc task (version=5) ─┐
                             ├─ ai update sau, version không khớp →
User B đọc task (version=5) ─┘   ObjectOptimisticLockingFailureException
User A update → version=6 ✓
User B update WHERE version=5 → 0 row → EXCEPTION
~~~

Xử lý trong controller:

~~~java
@ExceptionHandler(ObjectOptimisticLockingFailureException.class)
public ProblemDetail handleOptimistic(ObjectOptimisticLockingFailureException ex) {
    ProblemDetail pd = ProblemDetail.forStatusAndDetail(
        HttpStatus.CONFLICT,                     // 409
        "Dữ liệu đã bị người khác cập nhật. Vui lòng tải lại và thử lại.");
    pd.setTitle("Conflict");
    return pd;
}
~~~

### Khi nào Optimistic vs Pessimistic?

| | Optimistic (@Version) | Pessimistic (SELECT FOR UPDATE) |
|---|---|---|
| Giả định | Xung đột hiếm | Xung đột thường |
| Chi phí | Rẻ (không lock DB) | Đắt (giữ lock, block khác) |
| Deadlock | Không | Có thể |
| Phù hợp | Web app CRUD | Đếm số dư tài khoản, seat booking |

## 5. Idempotency — keyword ngành tài chính

LAAS có idempotency — dùng để client retry an toàn:

~~~java
@Entity
public class PaymentRequest {
    @Id String idempotencyKey;      // client sinh UUID, gửi kèm
    String status;                  // PENDING/COMPLETED
    @OneToOne Payment payment;
}

// Service
@Transactional
public Payment execute(String idemKey, PaymentCmd cmd) {
    return paymentRequestRepo.findById(idemKey)
        .map(PaymentRequest::getPayment)      // đã xử lý rồi → trả kết quả cũ
        .orElseGet(() -> {
            Payment p = doPayment(cmd);       // lần đầu → xử lý
            paymentRequestRepo.save(
                new PaymentRequest(idemKey, "COMPLETED", p));
            return p;
        });
}
~~~

Client timeout → retry với cùng key → không bị trừ tiền 2 lần.

## 6. Những lỗi @Transactional thường gặp

~~~java
// ❌ Lỗi 1: self-invocation
@Service
public class AService {
    @Transactional
    public void methodX() { ... }

    public void caller() {
        this.methodX();     // proxy bị bypass — KHÔNG có transaction!
    }
}

// ❌ Lỗi 2: @Transactional trên private method
@Transactional
private void doWork() { ... }        // proxy không intercept được

// ❌ Lỗi 3: catch nuốt exception
@Transactional
public void process() {
    try {
        risky();
    } catch (Exception e) {
        log.error("Bỏ qua", e);      // transaction KHÔNG rollback!
    }
}

// ❌ Lỗi 4: transaction quá dài
@Transactional
public void slowProcess() {
    callExternalApi();               // HTTP call chậm 5s bên trong transaction!
    repo.save(x);
    // Connection bị giữ 5s → pool cạn kiệt dưới tải
}
~~~

:::tip NGUYÊN TẮC
Transaction nên **ngắn, chỉ bao việc DB**. HTTP/RPC call → đưa ra ngoài transaction. Đó là lý do các hệ thống lớn (như LAAS) dùng **Transactional Outbox** (Module 6) thay vì gọi API trong transaction.
:::

:::takeaways
- REQUIRED mặc định; REQUIRES_NEW cho audit/log độc lập
- Mặc định KHÔNG rollback checked exception → luôn ghi rollbackFor
- @Version + 409 Conflict cho concurrent update
- Idempotency key: retry an toàn cho payment/API quan trọng
- Transaction ngắn — không HTTP call bên trong
:::
`
    },
    {
      id: "3-4",
      type: "lesson",
      title: "Flyway & Database Migration",
      minutes: 35,
      content: `
## Vì sao cần migration tool?

Team 5 người sửa schema bằng tay → ai thêm cột trước? Môi trường dev/staging/prod khác nhau xử lý thế nào? Muốn rollback?

**Flyway** = version control cho database: mọi thay đổi schema là **file script**, chạy theo thứ tự, chạy 1 lần duy nhất.

---

## 1. Cài đặt

~~~xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
~~~

~~~yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
~~~

## 2. Cấu trúc file migration

~~~text
src/main/resources/db/migration/
├── V1__create_tasks_table.sql
├── V2__create_users_table.sql
├── V3__add_due_date_column.sql
├── V4__create_indexes.sql
└── V5__seed_reference_data.sql
~~~

Quy ước tên: <code>V{version}__{description}.sql</code> — **2 gạch dưới** giữa version và mô tả.

## 3. Viết migration

**V1__create_tasks_table.sql**

~~~sql
CREATE TABLE tasks (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(120) NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'TODO',
    priority    INT          NOT NULL DEFAULT 3,
    assignee_id BIGINT,
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP,
    version     BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id)
        REFERENCES users (id)
);

CREATE INDEX idx_tasks_status ON tasks (status);
~~~

**V3__add_due_date_column.sql**

~~~sql
ALTER TABLE tasks ADD COLUMN due_date DATE;

-- Migration có data: update dữ liệu cũ ngay trong script
UPDATE tasks SET due_date = created_at + INTERVAL '7 day'
WHERE due_date IS NULL;

ALTER TABLE tasks ALTER COLUMN due_date SET NOT NULL;
~~~

## 4. Flyway quản lý thế nào?

~~~text
Table flyway_schema_history:
| version | description        | success | installed_on        |
|---------|--------------------|---------|---------------------|
| 1       | create tasks table | true    | 2026-10-01 10:00:00 |
| 2       | create users table | true    | 2026-10-01 10:00:01 |
| 3       | add due date       | true    | 2026-10-02 09:15:00 |
~~~

Khi app start: đọc history → chỉ chạy các script **chưa chạy** → theo thứ tự version. Script đã chạy **không bao giờ được sửa** (checksum sẽ lệch → lỗi start!).

:::danger QUY TẮC SẮT
1. **Không sửa file migration đã chạy** — tạo file mới V{next}
2. **Version tăng dần đều** — không nhảy, không dùng lại số
3. **Mỗi PR/feature một migration** — dễ review, dễ revert
4. Trước khi merge, pull rebase để tránh conflict version số
:::

## 5. Repair & advanced

~~~bash
# Lịch sử lệch checksum (ai đó sửa file cũ) → repair
./mvnw flyway:repair

# Xem trạng thái
./mvnw flyway:info
~~~

Repeatable migrations — chạy lại khi content đổi:

~~~text
db/migration/
├── V1__create_tables.sql
└── R__views.sql      ← R = repeatable: đổi content là chạy lại (DROP+CREATE view)
~~~

## 6. Chiến lược migration an toàn production (expand-contract)

Bước deploy nhiều instance (blue-green) KHÔNG thể đổi schema breaking ngay:

~~~text
Phase 1 (Expand):  V10 — thêm cột NULLable mới, cả 2 phiên bản code chạy được
Phase 2 (Migrate): chạy job backfill data cũ → cột mới
Phase 3 (Contract): V11 — sau khi mọi instance đã chạy code mới,
                    mới xóa cột cũ
~~~

:::laas ĐỐI CHIẾU LAAS
Hệ thống LAAS deploy qua Jenkins + OKD nhiều pod — bắt buộc migration tương thích cả 2 phiên bản code (expand-contract). Nếu bạn thấy folder db/migration trong repo, đó chính là quy trình này.
:::

:::takeaways
- Flyway = git cho schema: file script version hóa, chạy đúng 1 lần
- V{n}__{description}.sql — 2 gạch dưới, không sửa file cũ
- flyway_schema_history table theo dõi trạng thái
- Expand-contract cho zero-downtime deploy
- Repeatable (R__) cho view/trigger
:::
`
    },
    {
      id: "3-5",
      type: "lesson",
      title: "Entity Mapping nâng cao — Inheritance, ElementCollection, Converter",
      minutes: 45,
      content: `
## Khi model vượt quá CRUD phẳng

Member có địa chỉ embedded, hệ thống có taxonomy phân cấp (Điểm giao dịch / Loại thẻ / Hạng thành viên). @ManyToOne lặp lại 3 nơi. Bài này: 3 công cụ giảm sự lặp vật lý của model.

---

## 1. @Embedded — value object tái sử dụng

~~~java
@Embeddable
public record Address(
    String street,
    String city,
    String postalCode,
    String country
) {}

@Entity
public class Member {
    @Id @GeneratedValue
    private Long id;

    @Embedded
    private Address homeAddress;

    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "street",  column = @Column(name = "work_street")),
        @AttributeOverride(name = "city",    column = @Column(name = "work_city")),
        @AttributeOverride(name = "postalCode", column = @Column(name = "work_postal")),
        @AttributeOverride(name = "country", column = @Column(name = "work_country"))
    })
    private Address workAddress;
}
~~~

2 Address cùng entity → cột đè tên nhau → @AttributeOverrides đổi tên cột. Value object không identity riêng — sống chết theo owner.

## 2. @ElementCollection — collection value type

~~~java
@Entity
public class Member {
    @ElementCollection
    @CollectionTable(name = "member_phones",
        joinColumns = @JoinColumn(name = "member_id"))
    @Column(name = "phone")
    private Set<String> phones = new HashSet<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "member_tags")
    @Column(name = "tag")
    private Set<String> tags = new HashSet<>();
}
~~~

Bảng con KHÔNG có entity riêng — chỉ (member_id, phone). Phù hợp tag, label, permission đơn giản. Hạn chế: không query 2 chiều (không tìm "member nào có tag X" hiệu quả), element không có lifecycle riêng.

:::warn ELEMENTCOLLECTION KHÔNG PHẢI PANACEA
Cần tìm ngược "members có tag vip" → cần @OneToMany entity Tag riêng với query được. ElementCollection là dữ liệu phụ thuộc tuyệt đối — không có ngữ nghĩa nghiệp vụ độc lập. Quyết định bằng câu hỏi: "bảng này có sinh ra transaction riêng không?"
:::

## 2b. @Enumerated(EnumType.STRING) — không bao giờ ORDINAL

~~~java
@Enumerated(EnumType.STRING)
private TransactionStatus status;      // PENDING, COMPLETED, FAILED
~~~

| | STRING | ORDINAL (mặc định!) |
|---|---|---|
| DB value | PENDING, COMPLETED | 0, 1, 2 |
| Thêm enum giữa chừng | An toàn | Dịch số — toàn bộ row cũ sai! |
| Đọc log | Self-describing | "status=2" là gì? |

Một dev chèn CANCELLED vào giữa enum → hàng triệu row COMPLETED (2) thành CANCELLED, FAILED (3) thành COMPLETED. Disaster im lặng.

## 3. Inheritance — JOINED vs SINGLE_TABLE vs TABLE_PER_CLASS

~~~java
// Chiến lược JOINED — chuẩn production
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class Transaction {
    @Id @GeneratedValue
    private Long id;
    private BigDecimal amount;
    private Instant createdAt;
}

@Entity
@PrimaryKeyJoinColumn(name = "transaction_id")
public class EarnTransaction extends Transaction {
    private String campaignCode;       // earn theo chiến dịch
}

@Entity
@PrimaryKeyJoinColumn(name = "transaction_id")
public class RedeemTransaction extends Transaction {
    private String partnerCode;        // redeem tại đối tác
}
~~~

| Strategy | Bảng | Query polymorphic | Dữ liệu dư |
|---|---|---|---|
| **JOINED** | Cha + con riêng, FK chung | JOIN nhiều bảng | Không — chuẩn hóa |
| SINGLE_TABLE | 1 bảng + discriminator | Nhanh nhất (1 bảng) | Cột NULL nhiều |
| TABLE_PER_CLASS | Con riêng, không bảng cha | UNION ALL | Cột chung lặp |

Lựa chọn: audit/schema nghiêm ngặt + ít polymorphic query → JOINED. Đọc nặng polymorphic + cột con ít → SINGLE_TABLE + @DiscriminatorValue.

## 4. AttributeConverter — bridge legacy ↔ enum/JSON

~~~java
@Converter
public class MoneyConverter implements AttributeConverter<BigDecimal, String> {

    @Override
    public String convertToDatabaseColumn(BigDecimal amount) {
        return amount == null ? null : amount.scaleByPowerOfTen(2).toBigInteger().toString();
    }

    @Override
    public BigDecimal convertToEntityAttribute(String stored) {
        return stored == null ? null : new BigDecimal(stored)
            .movePointLeft(2).setScale(2);
    }
}
~~~

Dòng tiền lưu minor units (integer cents) trong DB legacy, domain model dùng BigDecimal: converter dịch 2 chiều trong suốt — service không biết sự tồn tại của việc chuyển đổi.

:::warn MỘT LỖI TRONG CONVERTER
convertToEntityAttribute scaleByPowerOfTenths sai — API đúng là movePointLeft(2). Đây là minh họa có chủ ý: converter là điểm single-point-of-failure cho đúng đắn dữ liệu — 1 dòng sai, toàn bộ đọc/ghi sai lệch. Test converter độc lập với unit test 2 chiều, cả edge case (null, 0, số âm, scale lớn).
:::

## 5. @Where / @SQLDelete — soft delete chuẩn

~~~java
@SQLDelete(sql = "UPDATE member SET deleted = true WHERE id = ?")
@Where(clause = "deleted = false")
public class Member {
    private boolean deleted;
}
~~~

repo.delete() → UPDATE thay DELETE vật lý; mọi query tự thêm WHERE deleted = false. Un-deleted history vẫn query được qua native query khi audit.

Cẩn trọng: @Where áp GLOBAL — kể cả khi nghiệp vụ cần thấy cả deleted (admin view). Lúc đó cần native query bypass hoặc 2 repository pattern.

:::laas ĐỐI CHIẾU LAAS
LAAS dùng JOINED cho transaction taxonomy (EarnTransaction/RedeemTransaction) và converter minor-units ↔ BigDecimal — bạn từng audit thấy mọi transaction amount lưu integer cents, service layer BigDecimal. ENUM toàn STRING sau migration từ ORDINAL (trước đó "status=2" không ai giải thích được).
:::

:::takeaways
- @Embedded value object: tái sử dụng, không identity — @AttributeOverrides khi trùng cột
- @ElementCollection cho phụ thuộc tuyệt đối (tags); entity riêng khi cần query ngược
- @Enumerated(EnumType.STRING) luôn — ORDINAL là quả bom nổ chậm
- JOINED chuẩn hóa + polymorphic qua JOIN; SINGLE_TABLE nhanh + NULL dư
- AttributeConverter cầu nối legacy: unit test 2 chiều là bắt buộc
- Soft delete @SQLDelete + @Where — nhớ @Where là global filter
:::
`
    },
    {
      id: "3-6",
      type: "lesson",
      title: "Batch operations & Projections — 1 triệu dòng không giết persistence",
      minutes: 45,
      content: `
## saveAll() 1 triệu entity — tại sao OOM và cách đúng

repo.saveAll(millionRows) giữ toàn bộ trong persistence context → heap đầy → Full GC → chết. Persistence context chỉ nên chứa vài trăm entity. Bài này: ghi/cập nhật hàng loạt đúng cách + đọc chỉ cột cần.

---

## 1. Vấn đề persistence context

~~~java
// ❌ 1 triệu row
List<Member> all = memberRepo.findAll();          // list 1M trong RAM
memberRepo.saveAll(all.stream().map(...).toList()); // + persistence context 1M
~~~

Persistence context = bản đồ dirty-checking. 10k entity là ngưỡng đau bắt đầu (Hibernate session flush dirty check toàn bộ). Giải pháp: chia batch + clear.

---

## 2. Batch insert đúng cách

~~~java
@Entity
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;
}
~~~

~~~yaml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true
~~~

~~~java
@Transactional
public void importMembers(List<MemberRow> rows) {
    int i = 0;
    for (MemberRow row : rows) {
        memberRepo.save(new Member(row));          // save() không ghi ngay
        if (++i % 50 == 0) {
            em.flush();                            // phát INSERT batch 50
            em.clear();                            // xóa persistence context — RAM phẳng
        }
    }
}
~~~

| Config | Hiệu ứng |
|---|---|
| <code>jdbc.batch_size=50</code> | JDBC addBatch — 1 network round-trip / 50 insert |
| <code>order_inserts=true</code> | Gom các insert cùng bảng cạnh nhau (batch được) |
| <code>SEQUENCE + allocationSize</code> | ID lấy từ sequence, không identity (identity tắt batching!) |
| <code>em.flush() + em.clear()</code> mỗi 50 | Heap phẳng, dirty check nhẹ |

:::warn IDENTITY GIẾT BATCH
@GeneratedValue IDENTITY → Hibernate phải insert từng dòng để lấy ID → batching tắt. SEQUENCE với allocationSize 50 lấy 50 ID một lần. PostgreSQL khuyên SEQUENCE; MySQL không có sequence → IDENTITY là bắt buộc, batching chỉ còn update.
:::

## 3. Bulk update — JPQL thay saveAll-loop

~~~java
@Transactional
public int deactivateExpired(Instant cutoff) {
    return em.createQuery("""
            UPDATE Member m
            SET m.status = :expired, m.updatedAt = :now
            WHERE m.status = :active AND m.createdAt < :cutoff
            """)
        .setParameter("expired", Status.EXPIRED)
        .executeUpdate();
}
~~~

Vấn đề: JPQL bulk update KHÔNG đụng persistence context — entity loaded trước đó vẫn giữ giá trị cũ trong cùng session. Hoặc clear() trước, hoặc chấp nhận stale trong session đó.

## 3b. Bulk update đúng

~~~java
@Transactional
public int deactivateExpired(Instant cutoff) {
    em.clear();                                    // tránh stale entity
    return em.createQuery("""
            UPDATE Member m
            SET m.status = :newStatus, m.updatedAt = :now
            WHERE m.status = :active AND m.createdAt < :cutoff
            """)
        .setParameter("newStatus", Status.EXPIRED)
        .setParameter("active", Status.ACTIVE)
        .setParameter("cutoff", cutoff)
        .setParameter("now", Instant.now())
        .executeUpdate();
}
~~~

1 câu UPDATE đụng N triệu row trong 1 round-trip — so với N lần select+update từng entity.

## 4. Projections — đọc chỉ cái cần

~~~java
// Interface projection
public interface MemberSummary {
    Long getId();
    String getCif();
    long getPoints();
}

Page<MemberSummary> findByTenantId(String tenantId, Pageable pageable);
~~~

~~~java
// Class-based (DTO) projection — constructor expression
public record MemberView(Long id, String cif, long points) {}

@Query("""
    select new vn.addpay.loyalty.dto.MemberView(m.id, m.cif, m.points)
    from Member m
    where m.tenantId = :tenantId
    """)
Page<MemberView> findViews(String tenantId, Pageable pageable);
~~~

~~~java
// Scalar projection — Object[] khi cần tooling admin
@Query("select m.id, m.cif, m.status from Member m where ...")
List<Object[]> findRawRows(...);
~~~

| Projection | Điểm mạnh | Điểm yếu |
|---|---|---|
| Interface | Spring Data tự gen, đơn giản | Chỉ getter |
| DTO constructor | Type-safe đầy đủ, immutable | Viết constructor expression |
| Scalar Object[] | Không cần class | Ép kiểu thủ công |

## 5. Streaming — đọc 1M row không OOM

~~~java
@QueryHints(@QueryHint(name = AvailableHints.HINT_FETCH_SIZE, value = "50"))
@Query("select m from Member m where m.tenantId = :t")
Stream<Member> streamByTenant(@Param("t") String tenant);
~~~

~~~java
@Transactional(readOnly = true)
public void exportCsv(String tenant, Writer out) {
    try (Stream<Member> stream = memberRepo.streamByTenant(tenant)) {
        stream.forEach(m -> writeRow(out, m));    // từng row — RAM phẳng
    }
}
~~~

FETCH_SIZE 50 → JDBC cursor đọc từng nhóm, không tải cả tập. Kết hợp readOnly transaction: không dirty-check, không snapshot copy.

:::laas LAAS EOD settlement batch xử lý transaction ngày: đọc streaming theo cursor, xử lý theo batch 500 với flush/clear, bulk update trạng thái. Ba kỹ thuật của bài này chính là 3 bước pipeline đó. Bạn từng audit thấy outbox worker dùng findTop100ByPublishedFalse — batch 100 là con số cùng tư duy: giới hạn working set.
:::

:::takeaways
- saveAll 1M = persistence context nổ — chia batch + flush + clear
- jdbc.batch_size + SEQUENCE (không IDENTITY) + order_inserts
- JPQL bulk update: 1 câu cho N row — clear() trước khi read lại
- Projections: interface/DTO/scalar — SELECT đúng cột thay entire entity
- Stream + FETCH_SIZE + readOnly tx: export 1M row RAM phẳng
- Quy mô quyết định kỹ thuật: CRUD thường → entity; khối lượng lớn → batch/bulk/stream
:::
`
    },
    {
      id: "3-7",
      type: "lesson",
      title: "Flyway & Schema Migrations — schema là code, version là luật",
      minutes: 45,
      content: `
## "Trên máy tôi chạy được" — schema drift giữa dev/sit/prod

Dev thêm cột bằng ddl-auto=update, sit thiếu cột đó, prod lại khác nữa. Sau 6 tháng không ai biết schema thật của production trông thế nào. Migration tool biến schema thành CODE: versioned, review được qua PR, chạy đúng 1 lần, mọi env khớp tuyệt đối.
---

## 1. ddl-auto=update là thảm họa production

| ddl-auto | Hành vi | Dùng ở |
|---|---|---|
| none (mặc định) | Không đụng schema | Production |
| validate | Kiểm schema khớp entity, fail sớm | Production + CI |
| update | Tạo/sửa table theo entity | KHÔNG BAO GIỜ prod |
| create-drop | Tạo rồi xóa cuối session | Test |

update KHÔNG: xóa cột cũ, không đổi type có dữ liệu, không tạo index đúng chiến lược, không backfill. Nó chỉ "đủ để dev chạy" — và biến prod thành chiến trường không sơ đồ.

## 2. Flyway — migration versioned

~~~xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
~~~

~~~yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
  jpa:
    hibernate:
      ddl-auto: validate        # Flyway làm schema, JPA chỉ kiểm tra khớp
~~~

~~~text
src/main/resources/db/migration/
  V1__init_member_transaction.sql
  V2__add_points_expiry_column.sql
  V3__create_outbox_table.sql
  V4__backfill_member_tier.sql
  V5__index_transaction_cif_created.sql
  R__views_dashboard.sql          (repeatable — chạy lại khi đổi)
~~~

~~~sql
-- V2__add_points_expiry_column.sql
ALTER TABLE points_balance
    ADD COLUMN expiry_date DATE,
    ADD COLUMN expired_amount BIGINT NOT NULL DEFAULT 0;

-- V4__backfill_member_tier.sql — migration CÓ DỮ LIỆU, không chỉ DDL
UPDATE member
SET tier = CASE
    WHEN lifetime_points >= 100000 THEN 'PLATINUM'
    WHEN lifetime_points >= 50000  THEN 'GOLD'
    WHEN lifetime_points >= 10000  THEN 'SILVER'
    ELSE 'BRONZE'
END
WHERE tier IS NULL;
~~~

Startup: Flyway đọc bảng flyway_schema_history, chạy các file CHƯA có theo thứ tự version. Checksum được lưu — sửa file đã chạy = fail cứng ngay từ đầu, chặn tweak lén sau lưng review.

## 3. Nguyên tắc forward-only

~~~text
V7 sai? KHÔNG sửa V7 (checksum fail mọi env đã chạy).
Viết V8__fix_xxx.sql sửa tiếp. Lịch sử schema bất biến như git history.
~~~

Rollback = forward fix. Với DB có dữ liệu thật, "undo migration" nguy hiểm hơn sửa tiến — V8 chỉnh lại sai sót của V7, audit trail giữ nguyên toàn bộ hành trình.

:::warn KHÔNG BAO GIỜ SỬA MIGRATION ĐÃ CHẠY
Sửa V2 đã chạy ở SIT: máy dev mới chạy được, còn SIT FAIL checksum ngay lúc khởi động — downtime vì "sửa nhẹ một dòng". Quy tắc review: PR đụng file V số đã merge = reject, bắt buộc tạo file mới.
:::

## 4. Migration lớn không khóa table

~~~sql
-- V9__add_channel_with_backfill.sql — bảng 50 triệu row

-- BƯỚC 1: thêm cột nullable (PostgreSQL 11+ không rewrite table)
ALTER TABLE transaction ADD COLUMN channel VARCHAR(20);

-- BƯỚC 2: backfill theo đợt — mỗi đợt commit riêng, không giữ lock dài
UPDATE transaction SET channel = 'WEB'
WHERE channel IS NULL AND id BETWEEN 1 AND 5000000;
UPDATE transaction SET channel = 'WEB'
WHERE channel IS NULL AND id BETWEEN 5000001 AND 10000000;

-- BƯỚC 3: chốt constraint SAU khi sạch dữ liệu
ALTER TABLE transaction ALTER COLUMN channel SET NOT NULL;
~~~

Tương tự index: CREATE INDEX CONCURRENTLY không chặn write — chú ý Flyway mặc định chạy trong transaction, loại này cần cấu hình executeInTransaction=false cho đúng.

## 5. Repeatable + baseline

~~~text
R__views_dashboard.sql  — chạy LẠI mỗi lần checksum đổi (view, function, procedure)
baseline-on-migrate=true — nhận DB đang sống: đánh dấu schema hiện tại làm mốc,
                           migration áp từ điểm đó trở đi
~~~

DB tồn tại 2 năm chưa từng có Flyway? baseline-on-migrate + V1 rỗng làm mốc — không cần export schema hiện hành giả làm V1 (lộ ngaychecksum lỗi khi thêm instance mới).

## 6. CI/CD — migration là cổng deploy

~~~text
Jenkins: mvn verify (chạy migration trên Testcontainer sạch từ 0)
       → flyway validate chống drift môi trường
       → deploy rolling
~~~

Rolling rollout: pod cũ + pod mới song song vài phút — migration phải backward-compatible cho CẢ HAI version code. Pattern expand-contract: release 1 thêm cột/bảng (cả 2 version sống được), release 2 sau khi pod cũ hết mới xóa field cũ.

Liquibase so nhanh: changelog XML/YAML, precondition mạnh, có diff tool — nhưng SQL thuần Flyway dễ review + git diff sạch hơn cho team thuần SQL.

:::laas LAAS platform-service bạn từng theo dõi qua CloudWatch: bootstrap gồm Flyway migrate schema xong mới mở port serve. Đối chiếu incident "platform-service không start": nguyên nhân kinh điển là migration fail (checksum drift do ai đó hotfix tay DB prod) — Flyway từ chối khởi động thay vì lặng lẽ chạy schema lệch. Fail-fast ở đây là feature, không phải bug.
:::

:::takeaways
- ddl-auto: validate ở prod (Flyway giữ schema), update chỉ dành cho dev
- V theo thứ tự + checksum: chạy đúng 1 lần, sửa file cũ = fail cứng mọi env
- Forward-only: sai V7 → viết V8 sửa, history bất biến như git
- Bảng lớn: thêm nullable → backfill đợt → constraint sau; index CONCURRENTLY
- Expand-contract khi rolling deploy: schema phải phục vụ 2 version code cùng lúc
- baseline-on-migrate nhận DB sống — không export giả làm V1
:::
`
    },
    {
      id: "3-8",
      type: "lesson",
      title: "Elasticsearch Full-Text Search — tìm LIKE '%...%' là tự hạ mình",
      minutes: 45,
      content: `
## SELECT * FROM member WHERE full_name LIKE '%nguyen%' — 8 giây, không dùng index

LIKE '%...%' quét toàn bảng (leading wildcard vô hiệu hóa B-tree index). Trang admin search member theo tên/từ khóa lẻ — càng nhiều data càng chậm tuyến tính. Elasticsearch đảo ngược vấn đề: inverted index đánh chỉ mục TỪ NGỮ, tìm theo prefix/suffix/fuzzy đều là tra bảng hash — mili-giây bất kể 10 triệu record.
---

## 1. Vì sao LIKE chậm, inverted index nhanh

| | PostgreSQL LIKE %x% | Elasticsearch |
|---|---|---|
| Cấu trúc | B-tree index — vô dụng với leading % | Inverted index: từ → danh sách document |
| Độ phức tạp | O(n) quét toàn bảng | ~O(1) tra term + gộp posting list |
| Fuzzy (nguen ~ nguyen) | Không có sẵn | Có — edit distance |
| Ranking theo độ liên quan | Không | TF-IDF/BM25 built-in |
| Gợi ý gõ 1 vài ký tự | Không | prefix + completion suggester |

PostgreSQL có pg_trgm + GIN index cho fuzzy — giải pháp tốt nếu search đơn giản và đã dùng PG. ES đáng thêm khi: search là feature chính, cần facet/aggregation, log analytics quy mô lớn.

## 2. Spring Data Elasticsearch

~~~xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-elasticsearch</artifactId>
</dependency>
~~~

~~~yaml
spring:
  elasticsearch:
    uris: http://es-node1:9200,http://es-node2:9200
~~~

~~~java
@Document(indexName = "member")
public class MemberDoc {

    @Id
    private String id;

    @Field(type = FieldType.Keyword)          // exact match — không tách từ
    private String cif;

    @Field(type = FieldType.Text, analyzer = "vietnamese")
    private String fullName;

    @Field(type = FieldType.Keyword)
    private String tier;

    @Field(type = FieldType.Date)
    private Instant joinedAt;

    @Field(type = FieldType.Long)
    private long lifetimePoints;
}
~~~

Text vs Keyword là quyết định quan trọng nhất: Text chạy analyzer tách từ (tìm full-text), Keyword giữ nguyên chuỗi (filter chính xác, aggregate). Sai chỗ này là search sai hoặc filter chậm.

## 3. Query — repository và NativeQuery

~~~java
public interface MemberSearchRepo
        extends ElasticsearchRepository<MemberDoc, String> {

    // Derived query — search đơn giản
    List<MemberDoc> findByFullNameContaining(String keyword);
    Page<MemberDoc> findByTierAndLifetimePointsGreaterThan(
        String tier, long points, Pageable pageable);
}
~~~

~~~java
@Repository
public class MemberSearchQuery {

    private final ElasticsearchOperations operations;

    public SearchHits<MemberDoc> search(String keyword, String tier,
                                        int page, int size) {
        NativeQuery query = NativeQuery.builder()
            .withQuery(q -> q
                .bool(b -> b
                    .must(m -> m
                        .multiMatch(mm -> mm
                            .query(keyword)
                            .fields("fullName^3", "cif")
                            .fuzziness(Fuzziness.AUTO)))   // ngyen ~ nguyen
                    .filter(f -> f
                        .term(t -> t.field("tier").value(tier)))))
            .withPageable(PageRequest.of(page, size))
            .withHighlightQuery(new HighlightQuery(
                Highlight.of(h -> h.fields("fullName", HighlightField.of(f -> f))), null))
            .build();

        return operations.search(query, MemberDoc.class);
    }
}
~~~

must = ảnh hưởng điểm relevance; filter = điều kiện tuyệt đối KHÔNG tính điểm và được cache — luôn dùng filter khi không cần ranking.

## 4. Đồng bộ DB → ES: KHÔNG BAO GIỜ dual-write trực tiếp

~~~text
SAI: service method
     save DB
     save ES          ← 1 trong 2 fail = lệch dữ liệu vĩnh viễn, không ai biết

ĐÚNG: Transactional Outbox (Module 6)
     save DB + outbox row CÙNG transaction (atomic)
     worker đọc outbox → index vào ES → mark done
     ES hỏng? outbox retry — không mất, không lệch
~~~

~~~java
@KafkaListener(topics = "member-events")
public void onMemberEvent(MemberEvent event) {
    switch (event.type()) {
        case CREATED, UPDATED -> indexer.upsert(toDoc(event));
        case DELETED -> indexer.delete(event.cif());
    }
}
~~~

Toàn vẹn cuối cùng (eventually consistent): ES trễ vài trăm ms sau DB — chấp nhận được cho search, KHÔNG chấp nhận cho nguồn sự thật. Read path: chi tiết member lấy từ DB; search lấy danh sách từ ES rồi hydrate.

## 5. Reindex & mapping evolution

~~~text
Mapping sai không sửa được tại chỗ (analyzer đổi = reindex toàn bộ).
Chuẩn: alias member-read + member-write → index thật member-v1
Đổi mapping: tạo member-v2 (mapping mới) → _reindex → đổi alias sang v2 → xóa v1
Application chỉ biết alias — zero downtime.
~~~

## 6. Khi nào KHÔNG dùng Elasticsearch

- Search đơn giản prefix/equals → PG index thường + JPA đủ
- Fuzzy vừa phải → PostgreSQL pg_trgm + GIN (thêm 1 hệ ít hơn 1 hệ)
- Cần transactional strongly-consistent search → ES không phải DB, không có transaction đa document
- Team chưa vận hành ES cluster — ES ops (JVM heap, shard balancing, version upgrade) không rẻ

Công cụ đúng việc: DB là nguồn sự thật, ES là read-model tối ưu search (CQRS nhẹ — bài CQRS ở Module 6).

:::laas OLS admin search member/theo campaign theo tên — hiện chạy LIKE trên PostgreSQL: 2 triệu member là bắt đầu thấy chậm trang danh sách. Đường chuẩn: outbox event member tạo/sửa → indexer cập nhật MemberDoc → admin search full-text + filter tier bằng 1 query ES, hydrate chi tiết từ PG. Lưu ý vận hành bạn từng gặp: ES là hệ JVM riêng — cùng bộ kỹ năng tuning heap/GC như bài JVM Module 7, đừng để 2 hệ cùng 1 lỗi OOM cùng lúc.
:::

:::takeaways
- LIKE %x% quét toàn bảng — inverted index tra từ ngữ O(1) bất kể data size
- Text (analyzer tách từ) vs Keyword (exact match) — quyết định mapping quan trọng nhất
- must tính relevance, filter tuyệt đối + cache — filter mọi điều kiện không cần ranking
- Đồng bộ DB→ES qua outbox/CDC — dual-write trực tiếp là lệch dữ liệu chờ ngày bung
- Mapping đổi = reindex: alias read/write tách index vật lý — zero downtime
- PG pg_trgm đủ cho fuzzy nhẹ — chỉ thêm ES khi search là feature chính
:::
`
    },
    {
      id: "3-quiz",
      type: "quiz",
      title: "Quiz Module 3 — Data Access",
      minutes: 12,
      questions: [
        {
          level: "easy",
          scenario: "Junior dev cấu hình spring.jpa.hibernate.ddl-auto=update cho 'tiện — schema tự theo entity'. Bạn review và từ chối.",
          q: "Vì sao ddl-auto=update nguy hiểm ở production?",
          options: [
            "Chậm khi khởi động app",
            "Chỉ thêm cột không xóa/đổi type → schema lệch âm thầm giữa các môi trường, không có lịch sử thay đổi",
            "Không hỗ trợ PostgreSQL production",
            "Gây conflict khi nhiều instance cùng start"
          ],
          answer: 1,
          explain: "update là 'một chiều mù': thêm cột mới nhưng không xóa/đổi type → entity và DB lệch nhau từ từ. Không ai biết schema đã đổi lúc nào, ai đổi — vì không có audit trail. Flyway giải quyết: mọi thay đổi là file script version hóa, review được.",
          why: [
            "Vấn đề startup chậm là phụ trợ. Bất biến 'ddl-auto=update không an toàn' nằm ở tính mù loà về schema, không phải hiệu năng.",
            "✓ Đúng — từ từ: không xóa cột bỏ đi, không đổi type, không rename → môi trường dev có cột X mà prod không có (hoặc ngược lại). Không có history = không thể tái hiện schema từ đầu (rebuild DB chết chìm).",
            "Hibernate update chạy tốt trên PostgreSQL — không đúng sự thật.",
            "Multiple instance cùng start CÓ thể race khi update schema — đây là vấn đề thật nhưng phụ thuộc triển khai, không phải gốc rễ lý do cấm."
          ]
        },
        {
          level: "hard",
          scenario: "Incident kinh điển ở LAAS 2 năm trước: enum TransactionStatus có PENDING, SUCCESS, FAILED. Dev thêm CANCELLED vào GIỮA danh sách (thứ 3). Sau deploy, mọi giao dịch SUCCESS cũ hiển thị 'FAILED'.",
          q: "Root cause và cách lưu enum đúng?",
          options: [
            "DB encoding sai charset → đổi UTF8",
            "EnumType.ORDINAL mặc định lưu số thứ tự — chèn giữa làm lệch toàn bộ mapping cũ. Luôn dùng @Enumerated(EnumType.STRING)",
            "Hibernate cache stale → clear second-level cache",
            "Jackson serialize enum sai thứ tự — thêm @JsonProperty"
          ],
          answer: 1,
          explain: "ORDINAL lưu 0,1,2 theo vị trí khai báo. Chèn CANCELLED vào vị trí 2: SUCCESS cũ (giá trị 1) giờ map về PENDING, FAILED cũ (2) map về SUCCESS... Dữ liệu số trong DB không đổi nhưng Ý NGHĨA đổi — không thể tự hồi phục.",
          why: [
            "Charset không liên quan — số thứ tự enum là integer, không phải chuỗi text.",
            "✓ Đúng — STRING lưu 'SUCCESS'/'FAILED' literal: thêm enum mới không ảnh hưởng dữ liệu cũ, đọc SQL trực tiếp cũng hiểu được. Đây là rule số 1 khi map enum.",
            "Cache stale hết hạn sau khi clear — triệu chứng sẽ tự hết, không phải incident kéo dài. Và đây là lỗi mapping vĩnh viễn, không phải stale.",
            "Vấn đề ở tầng PERSISTENCE (Hibernate viết gì vào DB), không phải serialization JSON ra client."
          ]
        },
        {
          level: "hard",
          scenario: "Report API LAAS chậm 8s. Bật log SQL: 1 query SELECT tasks + sau đó 200 câu SELECT y hệt nhau cho từng task để lấy assignee. DBA phàn nàn.",
          q: "Đây là bệnh gì và đơn thuốc đúng?",
          code: "// Log quan sát được\n// [1] SELECT * FROM tasks WHERE status='DONE'\n// [2] SELECT * FROM users WHERE id=101\n// [3] SELECT * FROM users WHERE id=101   ← lặp lại 200 lần!\n// ...",
          options: [
            "Bệnh N+1 — đổi fetch=EAGER trên @ManyToOne assignee",
            "Bệnh N+1 — @EntityGraph(attributePaths=\"assignee\") trên repo method, hoặc JOIN FETCH",
            "Bệnh lazy loading — bật open-in-view để session sống lâu hơn",
            "Bệnh thiếu index — thêm index users.id"
          ],
          answer: 1,
          explain: "1 query chính + N query lazy-load quan hệ = N+1. EntityGraph/FETCH JOIN gom thành 1 câu duy nhất với JOIN. EAGER chỉ chuyển N+1 từ 'lúc duyệt' sang 'luôn luôn' — không giải quyết gì.",
          why: [
            "EAGER là 'luôn tải' thay vì 'tải khi chạm' — query vẫn N+1 (hoặc JOIN khổng lồ) cho MỌI use case, kể cả chỗ chỉ cần task không cần assignee. Trả bệnh từ spot sang toàn hệ thống.",
            "✓ Đúng — fetch join/EntityGraph áp per-query: chỉ endpoint report trả dữ liệu kèm assignee. Còn lại vẫn lazy như cũ. Đúng thuốc đúng liều đúng chỗ.",
            "open-in-view chỉ khiến lazy load chạy được trong view layer — query vẫn 201 câu, chỉ khác thời điểm. Còn tốn thêm connection giữ suốt request.",
            "users.id là PK đã có index. Vấn đề là SỐ LƯỢNG query, không phải tốc độ từng query."
          ]
        },
        {
          level: "medium",
          scenario: "Danh sách task LAAS cần filter động: client có thể truyền status, hoặc assignee, hoặc keyword, hoặc kết hợp — hoặc khôngtruyền gì lấy tất cả.",
          q: "Công cụ đúng cho dynamic query này?",
          options: [
            "N method derived: findByStatus, findByAssigneeAndStatus, findByAssigneeAndKeyword... (chuẩn tổ hợp)",
            "JPA Specification + JpaSpecificationExecutor — compose điều kiện runtime theo param có/không",
            "Native query với chuỗi SQLghép thủ công theo param",
            "Dùng @Query với :status IS NULL OR t.status = :status pattern cho mọi field"
          ],
          answer: 1,
          explain: "Specification là predicate LEGO: mỗi spec trả điều kiện hoặc null (bỏ qua). .and()/.or() kết hợp runtime — 1 method xử mọi tổ hợp, type-safe, test được.",
          why: [
            "Bùng nổ tổ hợp — 3 filter = 8 method, 4 filter = 16. Team thật từng có repo 40+ method kiểu này. Bảo trì ác mộng.",
            "✓ Đúng — hasStatus(s).and(assigneeNamed(a)).and(titleContains(k)): param null thì spec đó tự vô hiệu. 1 entry point, mọi tổ hợp.",
            "String SQL thủ công = SQL injection risk + mất type-check + mất pagination/sort tích hợp. Specification đạt cùng mục tiêu an toàn hơn.",
            "Pattern ':param IS NULL OR ...' chạy được nhưng query plan xấu (optimizer khó dùng index), khó thêm sort động, và với 5+ param WHERE clause phình to khó đọc."
          ]
        },
        {
          level: "hard",
          scenario: "2 teller cùng customer mở form sửa khách hàng. Teller A lưu trước. Teller B (form mở từ lúc cũ) lưu sau — ghi đè mất thay đổi của A. Khách hàng khiếu nại.",
          q: "Cơ chế Spring Data chống lost update này?",
          options: [
            "synchronized trên method update — lock JVM",
            "@Version (optimistic locking): update kèm WHERE version=cũ, ai sau bị ObjectOptimisticLockingFailureException → 409",
            "SELECT FOR UPDATE (pessimistic) mỗi lần mở form",
            "WebSocket đồng bộ real-time giữa 2 form"
          ],
          answer: 1,
          explain: "@Version: mỗi update version +1 và WHERE kiểm tra version đọc ban đầu. B đọc version 5, A update → 6, B update WHERE version=5 → 0 row → exception → app trả 409 'tải lại và thử'.",
          why: [
            "synchronized chỉ lock trong 1 JVM — LAAS chạy nhiều pod, vô dụng. Và lock JVM không giải quyết được 'form mở 5 phút trước'.",
            "✓ Đúng — optimistic: giả định xung đột hiếm, không giữ lock (không block ai), phát hiện khi ghi. Frontend nhận 409 + refresh. Chuẩn web app CRUD.",
            "Pessimistic khóa DB row từ lúc MỞ FORM — form treo 10 phút là row bị khóa 10 phút. Hợp cho transaction ngắn (đếm tiền), không hợp cho form người dùng.",
            "Real-time sync là UX enhancement phức tạp — không phải correctness guarantee. Vẫn cần optimistic locking làm nền tảng."
          ]
        },
        {
          level: "medium",
          scenario: "Code legacy LAAS: method @Transactional ném checked exception CustomException, team tá hỏa phát hiện dữ liệu VẪN ĐƯỢC LƯU dù business fail.",
          q: "Vì sao và sửa thế nào?",
          code: "@Transactional\npublic void process() throws CustomException {\n    repo.save(record);\n    if (somethingWrong) {\n        throw new CustomException(\"business fail\");  // nhưng record vẫn lưu!\n    }\n}",
          options: [
            "Bug Spring — nâng version là hết",
            "Mặc định @Transactional chỉ rollback RuntimeException — checked exception đi qua → commit. Thêm rollbackFor = Exception.class",
            " CustomException phải extends RuntimeException",
            "Gọi repo.save sau khi check điều kiện"
          ],
          answer: 1,
  explain: "Spring mô phỏng EJB convention cũ: checked = 'khả năng hồi phục, không cần rollback'; unchecked = 'lỗi hệ thống, rollback'. Thực tế modern: luôn khai báo rollbackFor = Exception.class.",
          why: [
            "Không phải bug — là hành vi CỐ Ý thiết kế từ EJB era mà Spring kế thừa. Biết rule này là kiến thức interview senior kinh điển.",
            "✓ Đúng — rollbackFor = Exception.class phủ BOTH checked và unchecked. Nhiều team đặt rule checkstyle: mọi @Transactional thiếu rollbackFor là build fail.",
            "Đổi unchecked là MỘT cách — nhưng đổi design exception chỉ để lách rule transaction là đặt xe trước ngựa. CustomException checked có lý do tồn tại (ép caller handle).",
            "Đúng là refactor tốt (validate trước khi save) — nhưng không sửa được gốc rễ: method khác throws checked vẫn dính. Fix framework-level (rollbackFor) phủ mọi trường hợp."
          ]
        },
        {
          level: "medium",
          scenario: "Deploy thứ 6 hung thần: pod mới LAAS start fail với Flyway error 'Migration checksum mismatch for migration version 3'. Dev nhận ra tuần trước đã 'sửa nhỏ' file V3__init.sql.",
          q: "Nguyên tắc bị vi phạm và cách xử lý ĐÚNG?",
          options: [
            "Chạy flyway:repair để cập nhật checksum — xong tiếp tục deploy",
            "Migration đã chạy là BẤT BIẾN — sửa gì cũng phải file mới V{n+1}. Hiện tại: repair để đồng bộ checksum đã lệch (chấp nhận deviations), và rule team: cấm sửa file cũ",
            "Rollback code về bản trước rồi deploy lại",
            "Xóa bảng flyway_schema_history để Flyway chạy lại từ đầu"
          ],
          answer: 1,
          explain: "File đã chạy trên môi trường nào là bất biến — checksum là 'chữ ký' phát hiện sửa đổi. repair chỉ ghi nhận sự thật lệch (cho phép start) chứ không làm phép màu. Prevention: code review + git hook chặn sửa file trong db/migration đã merge.",
          why: [
            "repair giải quyết triệu chứng ngay nhưng nếu im lặng dùng thường xuyên = văn hóa 'sửa file cũ thoải mái,dù sao repair được'. Chấp nhận như cứu cánh MỘT LẦN kèm post-mortem.",
            "✓ Đúng — hai phần: chữa (repair 1 lần, hiểu nó ghi nhận deviation chứ không 'sửa đúng') và phòng (quy trình cấm sửa). Incident response đúng nghĩa.",
            "Rollback code không giúp — schema DB của các môi trường đã chạy V3 bản 'sửa' rồi. Lịch sử Flyway là trạng thái DB thật, không phải code repo.",
            "Xóa history = Flyway không biết V1-V5 đã chạy → thử chạy lại V1 CREATE TABLE → fail vì table tồn tại. Hoặc tệ hơn: drop + recreate nếu configure sai → MẤT DỮ LIỆU."
          ]
        },
        {
          level: "medium",
          scenario: "LAAS cần zero-downtime deploy: 5 pod đang chạy code cũ, rolling update từng pod lên code mới. Migration thêm cột phone VARCHAR mới.",
          q: "Chiến lược migration tương thích cả 2 phiên bản code?",
          options: [
            "1 migration duy nhất: ADD COLUMN phone NOT NULL — deploy 1 phát",
            "Expand-contract: V10 ADD COLUMN NULLable (cả 2 code chạy được) → code mới backfill → V11 (sau rollout xong) NOT NULL/xóa cột cũ",
            "Tắt service 2h đêm để migrate — đơn giản nhất",
            "Chạy migration bằng tay trên DB trước khi deploy code"
          ],
          answer: 1,
          explain: "Pod cũ và mới đồng thời sống trong rolling window: pod cũ INSERT không có phone (NOT NULL → crash!), pod mới cần phone. NULLable pha expand cho cả hai cùng tồn tại; contract phase dọn sau khi 100% pod chạy code mới.",
          why: [
            "NOT NULL ngay lập tức giết pod cũ: INSERT không cung cấp phone → constraint violation → lỗi 500 loạt trong lúc rolling. Classic cause của 'deploy khiến sập'.",
            "✓ Đúng — expand (thêm rỗng) → migrate (backfill dần) → contract (ép ràng buộc/xóa cũ). Mỗi bước an toàn với mọi phiên bản code đang sống. Đây là pattern chuẩn Netflix/Amazon zero-downtime.",
            "Maintenance window 'đơn giản' nhưng LAAS là hệ thống giao dịch — 2h downtime không phải option business chấp nhận. Và vẫn không giải quyết được rolling deploy trong tương lai.",
            "Migration tay ngoài Flyway = môi trường lệch nhau (quên môi trường nào đó), không audit được, không reproduce được cho environment mới."
          ]
        },
        {
          level: "hard",
          scenario: "Mobile app LAAS gửi POST /payments, network timeout nhưng server ĐÃ xử lý thành công. App retry → khách bị trừ 2 lần. Khách khiếu nại newspaper.",
          q: "Pattern nào phòng việc này từ gốc?",
          options: [
            "Idempotency key: client sinh UUID gửi kèm — server lưu key, retry cùng key trả kết quả lần đầu, không xử lý lại",
            "Request dedup ở gateway theo IP + timestamp window",
            "Yêu cầu app chờ 30s trước khi cho retry",
            "DB unique constraint trên amount + currency"
          ],
          answer: 0,
          explain: "Idempotency key chuyển API từ 'thực hiện' sang 'tra kết quả theo key': lần 2 tìm thấy key → trả payment đã tạo. Client retry thoải mái — an toàn tuyệt đối. Chuẩn ngành payment (Stripe pioneering).",
          why: [
            "✓ Đúng — key do CLIENT sinh (không phải server — retry phải cùng key). Table payment_request với PK là key: findById trước, có thì trả, không thì xử lý + save. Retry an toàn vô hạn lần.",
            "IP + timestamp window là heuristic yếu: NAT nhiều user chung IP, window picked sai vẫn trùng (2 payment thật khác nhau trong window), và không chịu được client đổi IP giữa retry.",
            "Chờ 30s giảm xác suất trùng nhưng không ELIMINATE — timeout có thể do response mất trên đường về sau khi xử lý xong, chờ bao lâu retry cũng trùng.",
            "Unique(amount,currency) sai ngữ nghĩa hoàn toàn — chặn 2 giao dịch hợp lệ cùng số tiền (rất phổ biến: cùng shop cùng giá). Không phải tính duy nhất của REQUEST mà là của AMOUNT."
          ]
        },
        {
          level: "medium",
          scenario: "Dev sua V2__add_points_expiry_column.sql da chay o SIT 2 tuan truoc (them 1 index bi thieu). Merge PR. Dem do SIT deploy — moi pod platform-service FAIL khoi dong hang loat.",
          q: "Dieu gi xay ra va xu ly dung?",
          options: [
            "Flyway chay lai V2 theo noi dung moi — SIT co index, prod se co sau lan deploy toi",
            "Checksum V2 o SIT khong khop file moi → Flyway REFUSE migrate, pod fail-fast. Fix: revert V2 ve nguyen ban, viet V6__add_missing_index.sql",
            "Flyway tu skip file da chay — khong co gi xay ra, pod start binh thuong",
            "Can chay flyway repair tren SIT de cap nhat checksum roi deploy tiep"
          ],
          answer: 1,
          explain: "Flyway luu checksum moi file da chay — sua noi dung = mismatch = tu choi khoi dong (fail-fast la feature: chan tweak len schema sau lung review). Forward-only: revert file cu ve nguyen ban (khoi phuc checksum khop) + migration moi V6 cho thay doi. repair cap nhat checksum nhung hop le khi MOI biet chac schema SIT da dung noi dung moi — dung nhu thoi quen la che giau drift.",
          why: [
            "File da chay KHONG chay lai — Flyway nhan dien theo history, khong re-execute",
            "Dung — forward fix bang file moi, khong sua lich su da chay",
            "Khong skip — checksum mismatch chinh la cai khien pod fail",
            "repair blind = xoa bang chung drift; chi repair khi da xac minh schema that khop noi dung moi"
          ]
        },
        {
          level: "hard",
          scenario: "Bang transaction 50 trieu row, can them cot channel NOT NULL DEFAULT 'WEB' — truc tiep ALTER se khoa write hang chuc phut. PostgreSQL 11+.",
          q: "Chuoi migration an toan?",
          options: [
            "1 file V: ADD COLUMN NOT NULL DEFAULT — PostgreSQL 11+ toi uu, xong trong mili-giay",
            "ADD COLUMN (nullable, khong default vat ly) → backfill UPDATE theo dot id → cuoi cung ALTER SET NOT NULL — 3 giai doan, lock ngan tung buoc",
            "Tao bang moi + INSERT SELECT toan bo + doi ten — an toan co dien",
            "Tat service, chay migration, bat lai — maintenance window 1 gio"
          ],
          answer: 1,
          explain: "PG 11+ them cot DEFAULT khong rewrite bang — nhung SET NOT NULL tren cot dang NULL du lieu phai quet xac minh toan bang voi lock. Chuoi 3 buoc: them nullable (tuc thoi), backfill theo dot (moi dot lock ngan, service van song), chot NOT NULL sau khi sach (quet xac minh voi du lieu da day — an toan vi khong con NULL). Bang moi + rename double storage 50M row; downtime window la lua chon cuoi cung.",
          why: [
            "ADD COLUMN nhanh dung — nhung yeu cau la NOT NULL: chot constraint van la buoc quet day du",
            "Dung — expand (nullable + backfill theo dot) roi contract (SET NOT NULL): moi buoc lock toi thieu",
            "Double storage + copy 50M row + rename co khoanh khac bang khong ton tai — rui ro hon nhieu",
            "Maintenance window kha thi nhung khong can — chuoi online migration tranh duoc hoan toan"
          ]
        },
        {
          level: "medium",
          scenario: "Service method: memberRepository.save(member) xong gọi elasticsearchIndexer.index(doc) ngay sau — 2 dòng trong 1 method, KHÔNG outbox. Deploy 3 tuần ổn định, tự nhiên 1 đêm ES cluster restart đúng lúc — sáng ra 200 member mới KHÔNG tìm được qua search.",
          q: "Chẩn đoán và đường chuẩn?",
          options: [
            "Thêm try-catch + retry 3 lần quanh call ES — đủ an toàn",
            "Dual-write không atomic: DB commit còn ES fail = lệch vĩnh viễn không tự lành. Đường chuẩn: outbox cùng transaction → worker index — ES hỏng thì retry, không mất",
            "Tăng ES replicas + rolling restart zero-downtime — chống tái phát là đủ",
            "Cron job đối chiếu DB vs ES mỗi đêm reindex toàn bộ — đơn giản nhất"
          ],
          answer: 1,
          explain: "Lỗi không phải 'ES chết' mà là THIẾU CƠ CHẾ ĐẢM BẢO: 2 hệ ghi không transaction chung thì phải có đường phục hồi. Outbox giải quyết tận gốc: event ghi cùng transaction DB (atomic), worker index độc lập — ES down bao lâu cũng không mất event, lên là index lại. Retry trong method giữ nguyên lỗ hổng (pod chết giữa retry); reindex đêm là băng ghế đắt và lệch tới 24h.",
          why: [
            "Retry trong method vẫn thất bại âm thầm khi hết lượt hoặc pod chết — không bền",
            "✓ Outbox: atomic với DB, worker retry — eventual consistency có bảo đảm",
            "Zero-downtime ES giảm xác suất nhưng không loại bỏ — một lần nữa là lệch nữa",
            "Reindex toàn bộ mỗi đêm tốn tài nguyên và window lệch tới 24h — không là giải pháp đồng bộ"
          ]
        }
      ]
    }
  ]
});
