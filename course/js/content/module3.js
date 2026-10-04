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
      title: "Spring Data JPA & Entity Mapping: Vòng đời EntityManager, First-Level Cache & Dirty Checking",
      minutes: 55,
      content: `
## Từ JDBC thuần đến JPA/Hibernate: Sự trừu tượng hóa và cái giá phải trả

Trong những ngày đầu của Java Enterprise, việc tương tác với cơ sở dữ liệu quan hệ (RDBMS) phụ thuộc hoàn toàn vào JDBC thuần:
~~~java
// Mã nguồn JDBC cổ điển: Tốn 30 dòng boilerplate chỉ để đọc 1 bản ghi
try (Connection conn = dataSource.getConnection();
     PreparedStatement ps = conn.prepareStatement("SELECT id, title, status FROM tasks WHERE id = ?")) {
    ps.setLong(1, taskId);
    try (ResultSet rs = ps.executeQuery()) {
        if (rs.next()) {
            Task task = new Task();
            task.setId(rs.getLong("id"));
            task.setTitle(rs.getString("title"));
            task.setStatus(TaskStatus.valueOf(rs.getString("status")));
            return Optional.of(task);
        }
    }
}
~~~

JDBC thuần mang lại hiệu năng tối đa và sự kiểm soát tuyệt đối trên từng byte dữ liệu, nhưng chi phí bảo trì khổng lồ: lập trình viên phải tự mở/đóng kết nối, tự map từng cột vào thuộc tính Java, tự bắt <code>SQLException</code> và đối mặt với lỗi chính tả trong chuỗi SQL.

**JPA (Jakarta Persistence API)** và **Hibernate ORM** ra đời nhằm thu hẹp khoảng cách giữa Mô hình Hướng đối tượng (Object-Oriented Domain Model) và Mô hình Quan hệ (Relational Model). Với **Spring Data JPA**, bạn chỉ cần khai báo một dòng Interface:
~~~java
public interface TaskRepository extends JpaRepository<Task, Long> {}
~~~
Spring Boot sẽ tự động sinh mã proxy thực thi toàn bộ các thao tác CRUD, phân trang và truy vấn phức tạp.

Tuy nhiên, ORM **không phải là phép màu miễn phí**. Nếu không thấu hiểu sâu sắc cơ chế bên dưới của <code>EntityManager</code>, Bộ đệm Cấp một (First-Level Cache), cơ chế Kiểm tra Thay đổi (Dirty Checking), và chiến lược sinh khóa chính (ID Generation), hệ thống của bạn sẽ đối mặt với các sự cố nghiêm trọng trên Production: cạn kiệt Connection Pool, Deadlock dữ liệu và suy giảm hiệu năng tới 10 lần.

---

## 1. Bản chất Kiến trúc & Cơ chế Tầng Persistence (Under the Hood)

### Sơ Đồ Mô Phỏng: 4 Trạng Thái Của JPA Entity & First-Level Cache Dirty Checking

~~~mermaid
stateDiagram-v2
    [*] --> TRANSIENT: new Entity() (Chưa có ID, chưa quản lý)
    TRANSIENT --> MANAGED: em.persist()
    MANAGED --> DETACHED: em.detach() / em.clear() / em.close()
    DETACHED --> MANAGED: em.merge()
    MANAGED --> REMOVED: em.remove()
    REMOVED --> [*]: Transaction COMMIT (SQL DELETE)
    
    note right of MANAGED
        Nằm trong First-Level Cache (Persistence Context)
        Tự động Dirty Checking khi Transaction COMMIT!
        Không cần gọi repository.save() thủ công!
    end note
~~~


### 1.1 Không gian Quản lý Thực thể (Persistence Context) & 4 Trạng thái Vòng đời của Entity

Trái tim của Hibernate là **Persistence Context** — một vùng bộ nhớ tạm (First-Level Cache / L1 Cache) lưu trữ các đối tượng Java mà Hibernate đang theo dõi trong suốt vòng đời của một Transaction.

Một Entity trong JPA luôn tồn tại ở 1 trong 4 trạng thái sau:

~~~text
+-----------------------------------------------------------------------------------+
|                        Vòng đời Entity trong JPA / Hibernate                       |
+-----------------------------------------------------------------------------------+

                       [ TRANSIENT (New) ]
                  (Khởi tạo bằng từ khóa 'new',
                   chưa có ID, DB chưa hề biết)
                               |
                               | em.persist()
                               v
+-------------------------------------------------------------+
|                   MANAGED (Persistent)                      |
|  - Nằm trong First-Level Cache của EntityManager            |
|  - Có ID hợp lệ                                             |
|  - Được giám sát thay đổi tự động (Dirty Checking)          |
|  - Mọi setter gọi trên Entity sẽ tự đồng bộ xuống DB        |
+-------------------------------------------------------------+
         |                                           ^
         | em.detach()                               | em.merge()
         | em.clear()                                |
         | commit transaction                        |
         v                                           |
  [ DETACHED ] --------------------------------------+
  (Có ID, có trong DB,
   nhưng KHÔNG còn nằm
   trong Persistence Context)
         |
         | em.remove()
         v
  [ REMOVED ] ---> (Bị đánh dấu xóa, SQL DELETE sẽ bắn khi flush)
~~~

1. **TRANSIENT (Mới tạo)**: Đối tượng vừa được khởi tạo bằng toán tử <code>new Task()</code>. Nó chỉ là một object Java thông thường trên Heap, chưa có khóa chính (ID = null), Hibernate hoàn toàn không biết đến sự tồn tại của nó.
2. **MANAGED (Đang quản lý)**: Đối tượng đã được đưa vào Persistence Context (sau khi gọi <code>entityManager.persist(entity)</code> hoặc đọc lên từ DB thông qua <code>repository.findById(id)</code>). Mọi thay đổi thuộc tính trên đối tượng này sẽ được Hibernate tự động ghi nhận mà **không cần gọi bất kỳ hàm save() nào**!
3. **DETACHED (Tách rời)**: Đối tượng đã từng ở trạng thái Managed nhưng Transaction đã kết thúc hoặc Session đã bị đóng (ví dụ: đối tượng được chuyển từ Service layer sang Controller khi đã tắt OSIV). Hibernate không còn theo dõi đối tượng này. Nếu truy cập vào các quan hệ Lazy, hệ thống sẽ ném ngoại lệ <code>LazyInitializationException</code>.
4. **REMOVED (Đã đánh dấu xóa)**: Đối tượng được chuyển sang trạng thái này sau lệnh <code>entityManager.remove(entity)</code> và sẽ bị xóa khỏi cơ sở dữ liệu bằng câu lệnh SQL <code>DELETE</code> khi Transaction flush.

### 1.2 Cơ chế Kiểm tra Thay đổi Tự động (Dirty Checking Engine)
Làm thế nào Hibernate biết được thuộc tính nào của Entity đã bị thay đổi để phát câu lệnh <code>UPDATE</code>?

Khi một Entity được nạp vào Persistence Context (trạng thái Managed):
1. **Lưu Snapshot**: Hibernate tạo một bản sao chụp nguyên trạng (Snapshot Copy) của toàn bộ các trường dữ liệu của Entity đó trong bộ nhớ RAM L1 Cache.
2. **Theo dõi Thực thi**: Trong suốt Transaction, lập trình viên gọi các phương thức nghiệp vụ: <code>task.setStatus(TaskStatus.COMPLETED);</code>.
3. **Pha Flush (Trước khi Transaction Commit)**:
   - Hibernate duyệt qua tất cả các Entity trong Persistence Context.
   - So sánh từng trường của Entity hiện tại với bản Snapshot ban đầu.
   - Nếu phát hiện có sự sai lệch (Dirty), Hibernate tự động sinh câu lệnh SQL <code>UPDATE tasks SET status = 'COMPLETED', updated_at = ... WHERE id = ?</code> và đưa vào hàng đợi JDBC Statement.
   - **Ý nghĩa thực chiến**: Trong Service có <code>@Transactional</code>, bạn **tuyệt đối không cần gọi <code>repository.save(task)</code>** sau khi thay đổi dữ liệu! Lệnh <code>save()</code> chỉ gây dư thừa và tiềm ẩn rủi ro gọi câu lệnh <code>merge()</code> không đáng có.

### 1.3 Bản chất Chiến lược Sinh Khóa Chính: IDENTITY vs SEQUENCE
Chiến lược sinh ID quyết định trực tiếp việc Hibernate có thể thực hiện **JDBC Batching** (ghi hàng loạt) hay không:

| Tiêu chí | GenerationType.IDENTITY | GenerationType.SEQUENCE | GenerationType.UUID |
| :--- | :--- | :--- | :--- |
| **Cơ chế DB** | Cột <code>AUTO_INCREMENT</code> (MySQL) hoặc <code>SERIAL</code> / <code>IDENTITY</code> (PostgreSQL) | Bảng Sequence độc lập của Database (<code>CREATE SEQUENCE ...</code>) | Thuật toán sinh UUID v4 hoặc UUID v7 trên JVM |
| **Thời điểm sinh ID** | Do Database sinh ra **khi thực thi lệnh INSERT** | Do Hibernate lấy trước từ Sequence **trước khi INSERT** | Do ứng dụng sinh ngay trên RAM trong nano giây |
| **Ảnh hưởng đến JDBC Batching** | **PHÁ VỠ HOÀN TOÀN BATCH INSERT!** Hibernate buộc phải bắn từng câu <code>INSERT</code> đơn lẻ ngay khi gọi <code>persist()</code> để lấy generated key | **HỖ TRỢ BATCH INSERT TỐI ĐA**. Hibernate lấy 1 dải ID (ví dụ: 50 ID) rồi gom toàn bộ INSERT thành 1 batch | **HỖ TRỢ BATCH INSERT TỐI ĐA**. Không cần giao tiếp DB để sinh ID |
| **Hỗ trợ Hệ cơ sở dữ liệu** | Phổ biến trên MySQL, SQL Server | PostgreSQL, Oracle, DB2, MariaDB | Mọi RDBMS / NoSQL |

:::danger CẢNH BÁO KIẾN TRÚC: IDENTITY PHÁ HỦY HIỆU NĂNG BATCH INSERT
Khi bạn khai báo <code>@GeneratedValue(strategy = GenerationType.IDENTITY)</code>, Hibernate **buộc phải vô hiệu hóa tính năng JDBC Batching**. Mỗi khi gọi <code>save()</code>, Hibernate phải lập tức thực thi câu lệnh SQL <code>INSERT INTO ...</code> xuống Database để lấy về giá trị ID tự tăng thông qua JDBC <code>getGeneratedKeys()</code>.
Nếu bạn cần insert 10,000 bản ghi, hệ thống sẽ thực hiện 10,000 lượt giao tiếp mạng (Network Round-trips)! Trong môi trường High-Throughput hoặc PostgreSQL, luôn ưu tiên **<code>GenerationType.SEQUENCE</code>** với <code>allocationSize = 50</code>.
:::

---

## 2. Triển khai Mã nguồn Thực chiến (Production-Grade Code)

### 2.1 Lớp Cơ sở Kiểm toán & Khóa Lạc quan: BaseAuditableEntity
Một Entity chuẩn Enterprise phải có tính năng tự động ghi nhận thời gian tạo, người sửa đổi và cơ chế khóa lạc quan (Optimistic Locking) chống Race Condition:

~~~java
package vn.mastery.data.domain;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseAuditableEntity<ID extends Serializable> {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "global_id_seq_gen")
    @SequenceGenerator(
            name = "global_id_seq_gen",
            sequenceName = "global_entity_seq",
            allocationSize = 50 // Cấp phát dải 50 ID một lần, tối ưu JDBC Batching
    )
    @Column(name = "id", updatable = false, nullable = false)
    private ID id;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false, length = 50)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "updated_by", length = 50)
    private String updatedBy;

    @Version
    @Column(name = "version", nullable = false)
    private Long version; // Khóa lạc quan (Optimistic Locking)

    // Getters
    public ID getId() { return id; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public String getCreatedBy() { return createdBy; }
    public String getUpdatedBy() { return updatedBy; }
    public Long getVersion() { return version; }

    // Setters cần thiết cho ID
    protected void setId(ID id) { this.id = id; }

    // QUY TẮC BẮT BUỘC: Override equals và hashCode an toàn cho JPA Entity
    // Tuyệt đối không dùng Lombok @Data hoặc @EqualsAndHashCode trên Entity!
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BaseAuditableEntity<?> that = (BaseAuditableEntity<?>) o;
        // Nếu id chưa được sinh (transient object), so sánh theo địa chỉ tham chiếu
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        // Luôn trả về hằng số cố định cho Entity để đảm bảo tính bất biến trong Set/Map
        return getClass().hashCode();
    }
}
~~~

### 2.2 Cấu hình Spring Data JPA Auditing: AuditorAware
Tự động lấy danh tính người dùng hiện tại từ Spring Security Context:

~~~java
package vn.mastery.data.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class JpaAuditingConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated() 
                    || "anonymousUser".equals(authentication.getPrincipal())) {
                return Optional.of("SYSTEM");
            }
            return Optional.of(authentication.getName());
        };
    }
}
~~~

### 2.3 Entity Nghiệp vụ Hoàn chỉnh: AccountEntity
Áp dụng các kỹ thuật Entity Mapping chuyên nghiệp:
- Đặt tên chỉ mục (Index) rõ ràng phục vụ tối ưu câu lệnh tìm kiếm.
- Ép kiểu Enum dạng <code>EnumType.STRING</code>.
- Sử dụng quan hệ <code>FetchType.LAZY</code> tuyệt đối.

~~~java
package vn.mastery.data.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "accounts",
    indexes = {
        @Index(name = "idx_accounts_cif", columnList = "cif", unique = true),
        @Index(name = "idx_accounts_status", columnList = "status")
    }
)
public class AccountEntity extends BaseAuditableEntity<Long> {

    @Column(name = "cif", nullable = false, length = 10, unique = true)
    private String cif;

    @Column(name = "account_number", nullable = false, length = 20, unique = true)
    private String accountNumber;

    @Column(name = "balance", nullable = false, precision = 19, scale = 4)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "VND";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AccountStatus status = AccountStatus.ACTIVE;

    // Quan hệ 1-N luôn là LAZY. Cascade ALL + orphanRemoval để quản lý vòng đời chặt chẽ
    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<TransactionRecordEntity> transactions = new ArrayList<>();

    protected AccountEntity() {
        // Bắt buộc có default constructor cho JPA reflection
    }

    public AccountEntity(String cif, String accountNumber, BigDecimal initialBalance, String currency) {
        this.cif = cif;
        this.accountNumber = accountNumber;
        this.balance = initialBalance;
        this.currency = currency;
        this.status = AccountStatus.ACTIVE;
    }

    // Phương thức nghiệp vụ (Domain Business Methods)
    public void credit(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền nạp phải lớn hơn 0");
        }
        this.balance = this.balance.add(amount);
    }

    public void debit(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền trừ phải lớn hơn 0");
        }
        if (this.balance.compareTo(amount) < 0) {
            throw new IllegalStateException("Số dư khả dụng không đủ");
        }
        this.balance = this.balance.subtract(amount);
    }

    // Helper methods duy trì tính toàn vẹn 2 chiều của quan hệ Entity
    public void addTransaction(TransactionRecordEntity transaction) {
        transactions.add(transaction);
        transaction.setAccount(this);
    }

    // Getters
    public String getCif() { return cif; }
    public String getAccountNumber() { return accountNumber; }
    public BigDecimal getBalance() { return balance; }
    public String getCurrency() { return currency; }
    public AccountStatus getStatus() { return status; }
    public List<TransactionRecordEntity> getTransactions() { return transactions; }
}
~~~

### 2.4 Repository & Kỹ thuật Chiếu Dữ liệu (Projections)
Khi bạn chỉ cần lấy thông tin cơ bản của tài khoản để hiển thị lên UI, việc nạp toàn bộ <code>AccountEntity</code> vào Persistence Context là lãng phí tài nguyên CPU và RAM. Giải pháp tối ưu là sử dụng **Record Projection**:

~~~java
package vn.mastery.data.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.mastery.data.domain.AccountEntity;
import vn.mastery.data.domain.AccountStatus;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<AccountEntity, Long> {

    // 1. Derived Query an toàn
    Optional<AccountEntity> findByAccountNumber(String accountNumber);

    boolean existsByCif(String cif);

    // 2. Class-based Projection với Java Record (Cực kỳ nhẹ, không dính Dirty Checking)
    record AccountSummaryView(String accountNumber, BigDecimal balance, String currency, AccountStatus status) {}

    @Query("""
        SELECT new vn.mastery.data.repository.AccountRepository$AccountSummaryView(
            a.accountNumber, a.balance, a.currency, a.status
        )
        FROM AccountEntity a
        WHERE a.cif = :cif
    """)
    Optional<AccountSummaryView> findSummaryByCif(@Param("cif") String cif);

    // 3. Phân trang kết hợp Projection
    @Query("""
        SELECT new vn.mastery.data.repository.AccountRepository$AccountSummaryView(
            a.accountNumber, a.balance, a.currency, a.status
        )
        FROM AccountEntity a
        WHERE a.status = :status
    """)
    Page<AccountSummaryView> findAllByStatus(@Param("status") AccountStatus status, Pageable pageable);

    // 4. Bulk Update có kiểm soát: Bắt buộc kèm @Modifying và clearAutomatically = true
    @Modifying(clearAutomatically = true)
    @Query("UPDATE AccountEntity a SET a.status = :newStatus WHERE a.status = :oldStatus")
    int bulkUpdateStatus(@Param("oldStatus") AccountStatus oldStatus, @Param("newStatus") AccountStatus newStatus);
}
~~~

### 2.5 Service Minh họa Dirty Checking Tự động
~~~java
package vn.mastery.data.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.data.domain.AccountEntity;
import vn.mastery.data.repository.AccountRepository;

import java.math.BigDecimal;

@Service
public class AccountDomainService {

    private static final Logger log = LoggerFactory.getLogger(AccountDomainService.class);
    private final AccountRepository accountRepository;

    public AccountDomainService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Transactional
    public void deposit(String accountNumber, BigDecimal amount) {
        log.info("Bắt đầu xử lý nạp tiền cho số tài khoản: {}", accountNumber);

        // 1. Entity được tải vào Persistence Context -> Trạng thái MANAGED
        AccountEntity account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản không tồn tại: " + accountNumber));

        // 2. Thay đổi trạng thái thực thể trên bộ nhớ Java
        account.credit(amount);

        // 3. TUYỆT ĐỐI KHÔNG CẦN GỌI: accountRepository.save(account);
        // Khi hàm kết thúc, @Transactional commit -> Hibernate kích hoạt Dirty Checking
        // Tự động phát hiện trường 'balance' bị thay đổi và bắn câu UPDATE xuống DB!
        log.info("Hoàn tất logic nạp tiền. Dirty checking sẽ tự động đồng bộ khi commit transaction.");
    }
}
~~~

---

## 3. Thử nghiệm, Xác thực & Cấu hình Tối ưu (Verification & Tuning)

### 3.1 Cấu hình application.yml Chuẩn Mực cho Production
~~~yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/core_banking_db
    username: banking_app
    password: secret_password
    hikari:
      pool-name: BankingHikariPool
      maximum-pool-size: 20
      minimum-idle: 10
      idle-timeout: 300000
      connection-timeout: 20000
      max-lifetime: 1800000
  jpa:
    # ddl-auto: BẮT BUỘC là validate hoặc none trên môi trường Production!
    # Không bao giờ dùng 'update' vì nguy cơ mất dữ liệu hoặc lock bảng
    hibernate:
      ddl-auto: validate
    
    # open-in-view: BẮT BUỘC là false để đóng kết nối DB ngay sau Service Layer
    open-in-view: false

    show-sql: false # Tắt log SQL thuần trên Production để tránh nghẽn I/O
    properties:
      hibernate:
        format_sql: false
        # Tối ưu Batching với Sequence
        jdbc:
          batch_size: 50
          order_inserts: true
          order_updates: true
        # Cảnh báo truy vấn chậm vượt ngưỡng 2000ms
        session:
          events:
            log:
              LOG_QUERIES_SLOWER_THAN_MS: 2000
~~~

### 3.2 Kiểm chứng Hành vi Dirty Checking trong Integration Test
Viết bài kiểm thử với <code>@DataJpaTest</code> để xác nhận Hibernate tự động bắn câu lệnh <code>UPDATE</code> mà không cần gọi <code>repository.save()</code>:

~~~java
package vn.mastery.data.test;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import vn.mastery.data.domain.AccountEntity;
import vn.mastery.data.repository.AccountRepository;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class DirtyCheckingIntegrationTest {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("Kiểm chứng: Entity trạng thái Managed tự động cập nhật xuống DB khi flush()")
    void shouldAutomaticallyUpdateDatabaseViaDirtyChecking() {
        // 1. Chuẩn bị dữ liệu ban đầu
        AccountEntity account = new AccountEntity("0123456789", "ACC-1001", BigDecimal.valueOf(100_000), "VND");
        entityManager.persistAndFlush(account);
        entityManager.clear(); // Xóa sạch session để giả lập request mới

        // 2. Nạp entity lên bộ nhớ (Managed)
        AccountEntity managedAccount = accountRepository.findByAccountNumber("ACC-1001").orElseThrow();
        assertThat(managedAccount.getBalance()).isEqualByComparingTo(BigDecimal.valueOf(100_000));

        // 3. Thay đổi thuộc tính Java nhưng KHÔNG gọi save()
        managedAccount.credit(BigDecimal.valueOf(50_000));

        // 4. Ép flush session xuống Database
        entityManager.flush();
        entityManager.clear(); // Xóa session để đọc lại dữ liệu thật từ DB

        // 5. Xác thực dữ liệu trong Database đã được cập nhật thành 150,000
        AccountEntity updatedAccount = accountRepository.findByAccountNumber("ACC-1001").orElseThrow();
        assertThat(updatedAccount.getBalance()).isEqualByComparingTo(BigDecimal.valueOf(150_000));
        assertThat(updatedAccount.getVersion()).isEqualTo(1L); // Optimistic version tự tăng lên 1
    }
}
~~~

---

## 4. Cạm bẫy Triển khai & Khắc phục Sự cố (Production Pitfalls)

### Cạm bẫy 1: Sử dụng Lombok @Data hoặc @EqualsAndHashCode trên JPA Entity
Đây là một trong những lỗi gây thảm họa lớn nhất mà các lập trình viên thường mắc phải:
~~~java
// ❌ CỰC KỲ NGUY HIỂM:
@Entity
@Data // Lombok tự sinh equals/hashCode dựa trên toàn bộ các trường bao gồm cả quan hệ con!
public class Customer {
    @OneToMany(mappedBy = "customer")
    private List<Order> orders;
}
~~~
Hậu quả khôn lường:
1. **StackOverflowError**: Khi quan hệ là 2 chiều (<code>Customer</code> chứa <code>orders</code>, <code>Order</code> chứa <code>customer</code>), hàm <code>toString()</code> và <code>hashCode()</code> do <code>@Data</code> sinh ra sẽ gọi qua lại lẫn nhau vô tận làm tràn ngăn xếp luồng ngay lập tức.
2. **Hỏng cấu trúc dữ liệu Set/Map**: Ban đầu đối tượng mới tạo có <code>id = null</code>. Sau khi gọi <code>persist()</code>, database sinh <code>id = 101</code>. Khi đó giá trị băm <code>hashCode()</code> của đối tượng bị thay đổi hoàn toàn! Nếu bạn lưu đối tượng này trong <code>HashSet<Customer></code>, tập hợp sẽ không thể tìm thấy phần tử đó nữa, gây ra lỗi logic cực kỳ khó debug.
**Quy tắc**: Chỉ dùng <code>@Getter</code>, <code>@Setter</code> (hoặc viết tay), và tự override <code>equals</code>/<code>hashCode</code> chỉ dựa trên khóa chính <code>id</code> hoặc một trường nghiệp vụ duy nhất bất biến (Business Key / Natural ID) như hướng dẫn trong <code>BaseAuditableEntity</code>.

### Cạm bẫy 2: Bật open-in-view=true (OSIV) trên Production
Mặc định Spring Boot bật <code>spring.jpa.open-in-view=true</code>. Tính năng này giữ kết nối Database (JDBC Connection) mở xuyên suốt từ khi HTTP Request vào Controller cho tới khi render xong JSON response gửi về Client.
Hậu quả:
- Nếu một client tải dữ liệu qua đường truyền 3G chậm chạp mất 5 giây, kết nối Database bị giam cầm trong suốt 5 giây đó dù không thực hiện câu lệnh SQL nào!
- 20 kết nối của HikariCP Connection Pool bị cạn kiệt chỉ với 20 request tải chậm. Toàn bộ hệ thống sẽ bị treo cứng và báo lỗi: <code>ConnectionTimeoutException: Connection is not available, request timed out after 20000ms</code>.
**Biện pháp khắc phục**: Luôn đặt <code>spring.jpa.open-in-view=false</code>. Khi cần nạp dữ liệu quan hệ, nạp triệt để ngay tại tầng Service bằng <code>JOIN FETCH</code> hoặc DTO Projection.

### Cạm bẫy 3: Quên clearAutomatically = true trên câu lệnh @Modifying Bulk Update
Khi bạn thực thi câu lệnh cập nhật hàng loạt:
~~~java
@Modifying
@Query("UPDATE AccountEntity a SET a.status = 'SUSPENDED' WHERE a.balance < 0")
int suspendOverdrawnAccounts();
~~~
Câu lệnh này sẽ bắn trực tiếp câu <code>UPDATE</code> xuống Database mà **hoàn toàn bỏ qua First-Level Cache (Persistence Context)** của Hibernate.
Nếu trước đó trong cùng Transaction, bạn đã nạp một tài khoản âm tiền vào bộ nhớ:
- Database đã chuyển tài khoản đó thành <code>SUSPENDED</code>.
- Nhưng Entity trong RAM vẫn mang trạng thái cũ <code>ACTIVE</code>.
- Khi bạn tiếp tục dùng Entity đó, hệ thống sẽ sử dụng dữ liệu sai lệch (Stale Data)!
**Biện pháp khắc phục**: Luôn khai báo <code>@Modifying(clearAutomatically = true)</code>. Thuộc tính này sẽ xóa sạch Persistence Context ngay sau khi câu lệnh bulk update thực thi, buộc Hibernate phải đọc lại dữ liệu mới nhất từ Database.

---

## 5. Thử thách Thực chiến (Hands-on Challenge)

### Đề bài:
Xây dựng Subsystem Quản lý Sổ cái Giao dịch Ngân hàng (Banking Ledger Subsystem):
1. Thiết kế Entity <code>JournalEntryEntity</code> kế thừa <code>BaseAuditableEntity<Long></code>:
   - Sử dụng chiến lược sinh khóa chính <code>GenerationType.SEQUENCE</code> với dải cấp phát 50 ID.
   - Các trường bắt buộc: <code>entryReference</code> (duy nhất), <code>accountNumber</code>, <code>amount</code>, <code>entryType</code> (<code>DEBIT</code>, <code>CREDIT</code>), <code>description</code>.
2. Xây dựng Repository hỗ trợ:
   - Phương thức kiểm tra trùng lặp mã tham chiếu: <code>existsByEntryReference(String ref)</code>.
   - Record Projection <code>JournalSummaryView</code> lấy thông tin tóm tắt để kết xuất sao kê nhanh không tốn RAM.
3. Service xử lý ghi sổ kép (Double-Entry Ledger Service):
   - Đảm bảo tính toán toàn vẹn dữ liệu trong <code>@Transactional</code>.
   - Chứng minh cơ chế Dirty Checking hoạt động chuẩn xác mà không gọi hàm <code>save()</code>.

### Lời giải Chuẩn Kỹ sư Cấp cao:

~~~java
package vn.mastery.ledger.domain;

import jakarta.persistence.*;
import vn.mastery.data.domain.BaseAuditableEntity;

import java.math.BigDecimal;
import java.util.Objects;

public enum EntryType { DEBIT, CREDIT }

@Entity
@Table(
    name = "journal_entries",
    indexes = {
        @Index(name = "idx_journal_ref", columnList = "entry_reference", unique = true),
        @Index(name = "idx_journal_account", columnList = "account_number")
    }
)
public class JournalEntryEntity extends BaseAuditableEntity<Long> {

    @Column(name = "entry_reference", nullable = false, length = 36, unique = true)
    private String entryReference;

    @Column(name = "account_number", nullable = false, length = 20)
    private String accountNumber;

    @Column(name = "amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 10)
    private EntryType entryType;

    @Column(name = "description", nullable = false, length = 255)
    private String description;

    protected JournalEntryEntity() {}

    public JournalEntryEntity(String entryReference, String accountNumber, 
                              BigDecimal amount, EntryType entryType, String description) {
        this.entryReference = Objects.requireNonNull(entryReference, "entryReference không được null");
        this.accountNumber = Objects.requireNonNull(accountNumber, "accountNumber không được null");
        this.amount = Objects.requireNonNull(amount, "amount không được null");
        this.entryType = Objects.requireNonNull(entryType, "entryType không được null");
        this.description = description;
    }

    public void updateDescription(String newDescription) {
        this.description = newDescription;
    }

    // Getters
    public String getEntryReference() { return entryReference; }
    public String getAccountNumber() { return accountNumber; }
    public BigDecimal getAmount() { return amount; }
    public EntryType getEntryType() { return entryType; }
    public String getDescription() { return description; }
}
~~~

~~~java
package vn.mastery.ledger.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.mastery.ledger.domain.EntryType;
import vn.mastery.ledger.domain.JournalEntryEntity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntryEntity, Long> {

    boolean existsByEntryReference(String entryReference);

    Optional<JournalEntryEntity> findByEntryReference(String entryReference);

    // Record Projection cho hiệu năng tối đa khi xuất sao kê
    record JournalSummaryView(String entryReference, String accountNumber, 
                              BigDecimal amount, EntryType entryType, Instant createdAt) {}

    @Query("""
        SELECT new vn.mastery.ledger.repository.JournalEntryRepository$JournalSummaryView(
            j.entryReference, j.accountNumber, j.amount, j.entryType, j.createdAt
        )
        FROM JournalEntryEntity j
        WHERE j.accountNumber = :accountNumber
        ORDER BY j.createdAt DESC
    """)
    Page<JournalSummaryView> findStatementByAccount(@Param("accountNumber") String accountNumber, Pageable pageable);
}
~~~

~~~java
package vn.mastery.ledger.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.ledger.domain.EntryType;
import vn.mastery.ledger.domain.JournalEntryEntity;
import vn.mastery.ledger.repository.JournalEntryRepository;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class DoubleEntryLedgerService {

    private static final Logger log = LoggerFactory.getLogger(DoubleEntryLedgerService.class);
    private final JournalEntryRepository journalRepository;

    public DoubleEntryLedgerService(JournalEntryRepository journalRepository) {
        this.journalRepository = journalRepository;
    }

    @Transactional
    public void recordTransfer(String sourceAccount, String destinationAccount, 
                               BigDecimal amount, String note) {
        log.info("Thực hiện ghi sổ kép: {} -> {} Số tiền: {}", sourceAccount, destinationAccount, amount);

        String txBatchId = UUID.randomUUID().toString();

        // 1. Tạo bút toán DEBIT (Ghi nợ tài khoản nguồn)
        JournalEntryEntity debitEntry = new JournalEntryEntity(
                "DEBIT-" + txBatchId,
                sourceAccount,
                amount,
                EntryType.DEBIT,
                "Chuyển tiền tới: " + destinationAccount + " | " + note
        );

        // 2. Tạo bút toán CREDIT (Ghi có tài khoản đích)
        JournalEntryEntity creditEntry = new JournalEntryEntity(
                "CREDIT-" + txBatchId,
                destinationAccount,
                amount,
                EntryType.CREDIT,
                "Nhận tiền từ: " + sourceAccount + " | " + note
        );

        // Đưa vào Persistence Context (Sequence generator cấp phát ID trước, hỗ trợ batch insert 50 bản ghi)
        journalRepository.save(debitEntry);
        journalRepository.save(creditEntry);

        log.info("Đã lưu 2 bút toán vào Persistence Context thành công");
    }

    @Transactional
    public void amendDescription(String entryReference, String updatedNote) {
        // Tải thực thể lên trạng thái MANAGED
        JournalEntryEntity entry = journalRepository.findByEntryReference(entryReference)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bút toán: " + entryReference));

        // Cập nhật trường dữ liệu trên Java Object
        entry.updateDescription(updatedNote);

        // KHÔNG CẦN gọi journalRepository.save(entry)!
        // Dirty checking sẽ tự động phát hiện sự thay đổi và sinh câu SQL UPDATE khi commit transaction.
        log.info("Cập nhật ghi chú bút toán {}. Dirty checking sẽ tự động flush.", entryReference);
    }
}
~~~

:::takeaways
- **Bản chất của First-Level Cache**: Mọi thực thể được tìm kiếm hoặc lưu vào <code>EntityManager</code> đều nằm trong Persistence Context. Đây là bộ đệm cục bộ của từng Transaction giúp tránh các câu truy vấn lặp lại.
- **Cơ chế Dirty Checking**: Hibernate tự so sánh trạng thái hiện tại của Managed Entity với bản Snapshot ban đầu. Khi Transaction commit, các thay đổi sẽ tự động được đồng bộ xuống Database mà không cần gọi <code>repository.save()</code>.
- **Ưu tiên GenerationType.SEQUENCE**: <code>GenerationType.IDENTITY</code> vô hiệu hóa hoàn toàn cơ chế JDBC Batching vì bắt buộc phải thực thi INSERT ngay lập tức để lấy ID tự tăng. Luôn ưu tiên <code>SEQUENCE</code> với <code>allocationSize = 50</code> trên PostgreSQL/Oracle.
- **Tắt Open Session In View (OSIV)**: Luôn thiết lập <code>spring.jpa.open-in-view=false</code> trên Production để giải phóng kết nối HikariCP ngay khi kết thúc Service Layer, bảo vệ hệ thống khỏi nghẽn tài nguyên.
- **Quy tắc Vàng về equals & hashCode**: Tuyệt đối không dùng Lombok <code>@Data</code> trên JPA Entity. Chỉ override <code>equals</code> và <code>hashCode</code> dựa trên khóa chính hoặc Business Key duy nhất bất biến.
:::
`
    },
    {
      id: "3-2",
      type: "lesson",
      title: "N+1 Problem & Fetch Strategies: JOIN FETCH, EntityGraph, BatchSize, DTO Projections & Memory Pagination Trap",
      minutes: 55,
      content: `
## N+1 Query: Thảm họa Âm thầm Giết chết Hiệu năng Production

Khi phát triển ứng dụng ở môi trường Local với Database chỉ có vài chục dòng dữ liệu mẫu, mọi câu truy vấn qua Spring Data JPA đều chạy với tốc độ vài mili-giây. Nhưng ngay khi đưa lên môi trường Production với hàng trăm ngàn khách hàng:
- CPU của Database Server đột ngột vọt lên 100%.
- Connection Pool HikariCP bị cạn kiệt, các request bị nghẽn (Hang) tới 15-30 giây.
- Khách hàng phản ánh ứng dụng bị đơ giật khi mở danh sách đơn hàng.

Nguyên nhân số một đứng sau 80% các vụ sập hệ thống ORM chính là **Thảm họa N+1 Query**.

~~~java
// ❌ Mã nguồn ngây thơ dẫn đến 201 câu truy vấn SQL:
List<OrderEntity> orders = orderRepository.findAll(); // 1 câu SELECT orders (lấy 100 đơn)
for (OrderEntity order : orders) {
    // Mỗi vòng lặp, Hibernate âm thầm bắn thêm 1 câu SELECT customer và 1 câu SELECT items!
    log.info("Đơn hàng: {}, Khách: {}, Số item: {}", 
             order.getOrderNumber(), 
             order.getCustomer().getFullName(),     // 100 câu SELECT customers
             order.getItems().size());              // 100 câu SELECT order_items
}
// TỔNG CỘNG: 1 + 100 + 100 = 201 CÂU TRUY VẤN MẠNG!
~~~

Nếu bạn lấy 1,000 đơn hàng, hệ thống sẽ thực thi **2,001 câu lệnh SQL**. Mỗi câu lệnh tiêu tốn chi phí phân tích cú pháp (SQL Parsing), lập chỉ mục (Index Lookup) và độ trễ mạng (Network Latency). Bài học này sẽ mổ xẻ tận gốc cơ chế bên dưới của Proxy Hibernate, 4 chiến lược triệt tiêu N+1, và cảnh báo hiểm họa **Tràn bộ nhớ do Phân trang trong RAM (HHH000104)**.

---

## 1. Bản chất Kiến trúc & Cơ chế Tầng Mạng (Under the Hood)

### 1.1 Cơ chế Hibernate Proxy & Thời điểm Bắn Query
Khi bạn khai báo quan hệ lười biếng (Lazy Loading):
~~~java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "customer_id")
private CustomerEntity customer;
~~~
Khi nạp <code>OrderEntity</code> từ database, Hibernate **KHÔNG** hề truy vấn bảng <code>customers</code>. Thay vào đó, nó sử dụng thư viện **ByteBuddy** để tạo ra một đối tượng đại diện ảo (**Proxy Object**) kế thừa từ <code>CustomerEntity</code>:

~~~text
+-----------------------------------------------------------------------------------+
|                        Cơ chế Hibernate Proxy & Lazy Loading                       |
+-----------------------------------------------------------------------------------+

     [ OrderEntity (Real Object) ]
                 |
                 +---> customer: [ CustomerEntity$ByteBuddy$Proxy ]
                                            |
                                            | (Trạng thái: Uninitialized)
                                            | target = null, id = 8888
                                            |
       Client gọi: order.getCustomer().getFullName()
                                            |
                                            v
                                 Proxy đánh chặn (Intercept)
                                            |
                                            +---> Đã có session mở không?
                                            |       |
                                            |       +-- KHÔNG: Ném LazyInitializationException!
                                            |       |
                                            |       +-- CÓ: Bắn câu SQL tức thì:
                                            v
                                 SELECT * FROM customers WHERE id = 8888;
                                            |
                                            v
                                 target = Real Customer Object
                                            |
                                            v
                                 Trả về "Nguyen Van A"
~~~

N+1 sinh ra bởi vì Hibernate hoàn toàn **mù quáng** trước vòng lặp Java của bạn. Nó không thể biết rằng sau bản ghi thứ nhất, bạn sẽ tiếp tục gọi <code>.getCustomer()</code> cho 99 bản ghi còn lại. Do đó, nó buộc phải phát sinh từng câu truy vấn đơn lẻ cho từng vòng lặp!

### 1.2 Bẫy Mặc định Nguy hiểm: EAGER Fetching trên @ManyToOne và @OneToOne
Một sai lầm chết người trong đặc tả JPA là thiết lập mặc định:
- <code>@ManyToOne</code>: Mặc định là **EAGER**!
- <code>@OneToOne</code>: Mặc định là **EAGER**!
- <code>@OneToMany</code>: Mặc định là **LAZY**.
- <code>@ManyToMany</code>: Mặc định là **LAZY**.

Khi một quan hệ là EAGER, ngay cả khi bạn viết JPQL <code>SELECT o FROM OrderEntity o</code>, Hibernate vẫn tự động bắn thêm N câu query để nạp <code>Customer</code> ngay lập tức, ngay cả khi code của bạn không hề đụng đến trường <code>customer</code>!
**Quy tắc vàng**: Bắt buộc phải khai báo tường minh <code>fetch = FetchType.LAZY</code> cho TẤT CẢ các quan hệ <code>@ManyToOne</code> và <code>@OneToOne</code>.

### 1.3 So sánh 4 Chiến lược Triệt tiêu N+1 Query

| Tiêu chí | 1. JOIN FETCH | 2. @EntityGraph | 3. default_batch_fetch_size | 4. DTO Projection |
| :--- | :--- | :--- | :--- | :--- |
| **Cơ chế SQL** | <code>LEFT JOIN ...</code> trong 1 câu SQL | <code>LEFT JOIN ...</code> trong 1 câu SQL | Gom IN: <code>WHERE id IN (?, ?, ...)</code> | <code>SELECT col1, col2 FROM ...</code> |
| **Số lượng Query** | **Đúng 1 câu SQL duy nhất** | **Đúng 1 câu SQL duy nhất** | $\lceil N / \text{batch\_size} \rceil + 1$ câu | **Đúng 1 câu SQL duy nhất** |
| **Hỗ trợ Phân trang (Pageable)** | **CỰC KỲ NGUY HIỂM (HHH000104)** | **CỰC KỲ NGUY HIỂM (HHH000104)** | **AN TOÀN 100% (Phân trang tại DB)** | **AN TOÀN 100% (Phân trang tại DB)** |
| **Nạp nhiều Collection cùng lúc** | Lỗi <code>MultipleBagFetchException</code> | Lỗi <code>MultipleBagFetchException</code> | **Hỗ trợ hoàn hảo không giới hạn** | **Hỗ trợ tối đa (Flat projection)** |
| **Tiêu tốn Bộ nhớ RAM** | Nạp toàn bộ Entity vào L1 Cache | Nạp toàn bộ Entity vào L1 Cache | Nạp Entity vào L1 Cache | **TỐI THIỂU (Không qua L1 Cache)** |
| **Khả năng Chỉnh sửa dữ liệu** | Có (Entity Managed, Dirty Checking) | Có (Entity Managed, Dirty Checking) | Có (Entity Managed, Dirty Checking) | Không (Read-Only Immutable Record) |

---

## 2. Triển khai Mã nguồn Thực chiến (Production-Grade Code)

### 2.1 Thiết kế Entity Mô hình Thương mại Điện tử: Order, Customer, OrderItem

~~~java
package vn.mastery.data.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customers")
public class CustomerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    protected CustomerEntity() {}

    public CustomerEntity(String fullName, String email) {
        this.fullName = fullName;
        this.email = email;
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
}
~~~

~~~java
package vn.mastery.data.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_orders_status", columnList = "status"),
    @Index(name = "idx_orders_created", columnList = "created_at")
})
public class OrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", nullable = false, unique = true, length = 32)
    private String orderNumber;

    @Column(name = "total_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OrderStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    // BẮT BUỘC LAZY: Khắc phục mặc định EAGER của @ManyToOne
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private CustomerEntity customer;

    // Quan hệ 1-N kèm @BatchSize phòng vệ cục bộ
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @BatchSize(size = 50)
    private List<OrderItemEntity> items = new ArrayList<>();

    protected OrderEntity() {}

    public OrderEntity(String orderNumber, BigDecimal totalAmount, OrderStatus status, CustomerEntity customer) {
        this.orderNumber = orderNumber;
        this.totalAmount = totalAmount;
        this.status = status;
        this.customer = customer;
    }

    public void addItem(String productName, int quantity, BigDecimal unitPrice) {
        OrderItemEntity item = new OrderItemEntity(this, productName, quantity, unitPrice);
        this.items.add(item);
    }

    // Getters
    public Long getId() { return id; }
    public String getOrderNumber() { return orderNumber; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public OrderStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public CustomerEntity getCustomer() { return customer; }
    public List<OrderItemEntity> getItems() { return items; }
}
~~~

~~~java
package vn.mastery.data.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private OrderEntity order;

    @Column(name = "product_name", nullable = false, length = 150)
    private String productName;

    @Column(name = "quantity", nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal unitPrice;

    protected OrderItemEntity() {}

    public OrderItemEntity(OrderEntity order, String productName, int quantity, BigDecimal unitPrice) {
        this.order = order;
        this.productName = productName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    public Long getId() { return id; }
    public String getProductName() { return productName; }
    public int getQuantity() { return quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
}
~~~

### 2.2 Repository Minh họa Toàn diện 4 Chiến lược Triệt tiêu N+1

~~~java
package vn.mastery.data.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.mastery.data.domain.OrderEntity;
import vn.mastery.data.domain.OrderStatus;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, Long>, 
                                         JpaSpecificationExecutor<OrderEntity> {

    // CHIẾN LƯỢC 1: JOIN FETCH trong JPQL thuần (Chỉ áp dụng khi KHÔNG phân trang)
    @Query("""
        SELECT DISTINCT o FROM OrderEntity o
        JOIN FETCH o.customer
        LEFT JOIN FETCH o.items
        WHERE o.status = :status
    """)
    List<OrderEntity> findAllWithCustomerAndItems(@Param("status") OrderStatus status);

    // CHIẾN LƯỢC 2: @EntityGraph động — Không cần viết dài dòng JPQL
    @EntityGraph(attributePaths = {"customer", "items"})
    List<OrderEntity> findByStatus(OrderStatus status);

    // CHIẾN LƯỢC 3: Phân trang an toàn với default_batch_fetch_size
    // Lưu ý: Chỉ JOIN FETCH quan hệ To-One (customer), KHÔNG FETCH To-Many (items)!
    @Query(value = """
        SELECT o FROM OrderEntity o
        JOIN FETCH o.customer
        WHERE o.status = :status
    """, countQuery = """
        SELECT count(o) FROM OrderEntity o WHERE o.status = :status
    """)
    Page<OrderEntity> findPagedOrdersSafe(@Param("status") OrderStatus status, Pageable pageable);

    // CHIẾN LƯỢC 4: DTO Projection đỉnh cao hiệu năng (Read-Only)
    record OrderFlatSummaryDto(
            String orderNumber,
            String customerName,
            String customerEmail,
            BigDecimal totalAmount,
            OrderStatus status
    ) {}

    @Query("""
        SELECT new vn.mastery.data.repository.OrderRepository$OrderFlatSummaryDto(
            o.orderNumber, c.fullName, c.email, o.totalAmount, o.status
        )
        FROM OrderEntity o
        JOIN o.customer c
        WHERE o.status = :status
    """)
    Page<OrderFlatSummaryDto> findFlatSummaries(@Param("status") OrderStatus status, Pageable pageable);
}
~~~

### 2.3 Spring Data JPA Specification: Lọc Dữ liệu Động Tối ưu hóa JOIN
Khi xây dựng màn hình tìm kiếm đơn hàng nâng cao (Admin Search Dashboard):
- Khách hàng có thể lọc theo <code>status</code>, <code>customerName</code>, <code>minAmount</code>, <code>fromDate</code>, <code>toDate</code>.
- Kỹ thuật nâng cao: Tự động dùng <code>root.join("customer", JoinType.LEFT)</code> và xử lý distinct an toàn:

~~~java
package vn.mastery.data.specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import vn.mastery.data.domain.CustomerEntity;
import vn.mastery.data.domain.OrderEntity;
import vn.mastery.data.domain.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public final class OrderSpecifications {

    public record SearchCriteria(
            OrderStatus status,
            String customerKeyword,
            BigDecimal minAmount,
            Instant fromDate,
            Instant toDate
    ) {}

    public static Specification<OrderEntity> buildDynamicQuery(SearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Lọc theo trạng thái
            if (criteria.status() != null) {
                predicates.add(cb.equal(root.get("status"), criteria.status()));
            }

            // 2. Lọc theo tên hoặc email khách hàng (Sử dụng JOIN an toàn)
            if (criteria.customerKeyword() != null && !criteria.customerKeyword().isBlank()) {
                Join<OrderEntity, CustomerEntity> customerJoin = root.join("customer", JoinType.LEFT);
                String pattern = "%" + criteria.customerKeyword().trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(customerJoin.get("fullName")), pattern);
                Predicate emailMatch = cb.like(cb.lower(customerJoin.get("email")), pattern);
                predicates.add(cb.or(nameMatch, emailMatch));
            }

            // 3. Lọc theo ngưỡng số tiền tối thiểu
            if (criteria.minAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("totalAmount"), criteria.minAmount()));
            }

            // 4. Lọc theo dải ngày tạo
            if (criteria.fromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), criteria.fromDate()));
            }
            if (criteria.toDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), criteria.toDate()));
            }

            // Đảm bảo không trùng lặp khi có quan hệ JOIN
            if (query != null) {
                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
~~~

---

## 3. Thử nghiệm, Xác thực & Phát hiện N+1 (Verification & Profiling)

### 3.1 Bật Hibernate SQL & Statistics Logging
Để phát hiện N+1 ngay trong quá trình phát triển, hãy cấu hình trong <code>application.yml</code>:

~~~yaml
spring:
  jpa:
    properties:
      hibernate:
        generate_statistics: true # In thống kê số câu query và thời gian sau session
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.orm.jdbc.bind: TRACE # In giá trị bind parameter trong Hibernate 6
    org.hibernate.stat: INFO           # In bản tóm tắt số câu lệnh JDBC Statement
~~~

Khi gọi API, nếu thấy khối log sau:
~~~text
Session Metrics {
    155400 nanoseconds spent acquiring 1 JDBC connections;
    0 nanoseconds spent releasing 0 JDBC connections;
    2050000 nanoseconds spent executing 101 JDBC statements; // ❌ CẢNH BÁO N+1: 101 statements!
    101 JDBC statements executed;
}
~~~
Bạn biết ngay lập tức hệ thống đang bị N+1 truy vấn!

### 3.2 Tự động Chặn đứng N+1 bằng Unit Test với StatementInspector
Bạn có thể viết bài Test tự động trượt (Fail) nếu số lượng câu lệnh SQL vượt quá 2 câu:

~~~java
package vn.mastery.data.test;

import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.data.domain.OrderStatus;
import vn.mastery.data.repository.OrderRepository;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class PerformanceQueryCountTest {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private SessionFactory sessionFactory;

    private Statistics statistics;

    @BeforeEach
    void setUp() {
        statistics = sessionFactory.getStatistics();
        statistics.setStatisticsEnabled(true);
        statistics.clear();
    }

    @Test
    @Transactional(readOnly = true)
    @DisplayName("Kiểm tra findAllWithCustomerAndItems chỉ thực thi DUY NHẤT 1 câu SQL")
    void shouldExecuteOnlySingleQueryWithoutNPlusOne() {
        // Thực thi truy vấn với JOIN FETCH
        var orders = orderRepository.findAllWithCustomerAndItems(OrderStatus.PENDING_PAYMENT);

        // Duyệt qua toàn bộ phần tử con để chứng minh proxy không cần bắn thêm SQL
        orders.forEach(order -> {
            order.getCustomer().getFullName();
            order.getItems().size();
        });

        // Khẳng định: Tổng số câu lệnh SQL phát ra đúng bằng 1
        long queryCount = statistics.getPrepareStatementCount();
        assertThat(queryCount)
                .withFailMessage("Phát hiện N+1 Query! Dự kiến 1 câu SQL nhưng đã bắn: %d", queryCount)
                .isEqualTo(1L);
    }
}
~~~

---

## 4. Cạm bẫy Triển khai & Khắc phục Sự cố (Production Pitfalls)

### Cạm bẫy 1: Thảm họa HHH000104 — Phân trang trong RAM làm Tràn Bộ nhớ (OOM)
Khi lập trình viên muốn vừa phân trang (<code>Pageable</code>) vừa muốn tránh N+1 nên viết:
~~~java
// ❌ CỰC KỲ NGUY HIỂM:
@Query("SELECT o FROM OrderEntity o JOIN FETCH o.items")
Page<OrderEntity> findAllOrdersWithItems(Pageable pageable);
~~~
Khi chạy ứng dụng, console xuất hiện dòng cảnh báo màu vàng:
~~~text
WARN: HHH000104: firstResult/maxResults specified with collection fetch; applying in memory!
~~~
**Cơ chế sự cố**:
1. Một đơn hàng có thể có 5 items. Khi <code>LEFT JOIN</code>, cơ sở dữ liệu trả về 5 dòng cho 1 đơn hàng.
2. Nếu Database áp dụng <code>LIMIT 10 OFFSET 0</code>, nó sẽ cắt ngang ở dòng thứ 10, khiến đơn hàng thứ hai bị mất 3 items!
3. Vì vậy, Hibernate **buộc phải bỏ qua LIMIT/OFFSET của SQL**! Nó tải **TOÀN BỘ 1,000,000 DÒNG** của bảng orders và order_items vào bộ nhớ RAM của JVM, sau đó tự đếm và phân trang trên RAM!
4. **Hậu quả**: Khi bảng có 500,000 đơn hàng, một request phân trang <code>page=0&size=20</code> sẽ nạp 500MB dữ liệu vào Heap, kích hoạt Full GC và sập Pod với lỗi <code>OutOfMemoryError: Java heap space</code>!

**Biện pháp khắc phục chuẩn Enterprise**:
- **KHÔNG BAO GIỜ JOIN FETCH quan hệ Collection (@OneToMany) kèm Pageable!**
- Chỉ JOIN FETCH các quan hệ <code>@ManyToOne</code> (như Customer) vì quan hệ To-One không làm nhân bản dòng.
- Với quan hệ To-Many (<code>items</code>), hãy dựa vào cấu hình <code>hibernate.default_batch_fetch_size: 50</code>! Khi đó, Hibernate sẽ phân trang <code>OrderEntity</code> ở tầng DB bằng SQL <code>LIMIT 20</code>, sau đó bắn thêm **1 câu lệnh duy nhất**:
  <code>SELECT * FROM order_items WHERE order_id IN (?, ?, ..., ?)</code> để nạp items cho đúng 20 orders đó!

### Cạm bẫy 2: Lỗi MultipleBagFetchException khi JOIN FETCH 2 Collection cùng lúc
Khi bạn cố gắng viết:
~~~java
// ❌ LỖI COMPILE / STARTUP CỦA HIBERNATE:
@Query("SELECT o FROM OrderEntity o JOIN FETCH o.items JOIN FETCH o.tags")
List<OrderEntity> findOrdersWithItemsAndTags();
~~~
Hibernate sẽ ném ngoại lệ:
~~~text
org.hibernate.loader.MultipleBagFetchException: cannot simultaneously fetch multiple bags: [OrderEntity.items, OrderEntity.tags]
~~~
**Nguyên nhân**: Tích Descartes (Cartesian Product) giữa 2 danh sách dạng <code>List</code> (Bag) sẽ nhân số lượng dòng theo cấp số nhân ($N \times M$). Nếu đơn hàng có 10 items và 5 tags, DB sẽ trả về 50 dòng cho 1 đơn hàng duy nhất!
**Biện pháp**:
1. Đổi kiểu dữ liệu từ <code>List<T></code> sang <code>Set<T></code>.
2. Hoặc tốt nhất: Sử dụng <code>default_batch_fetch_size: 50</code> để Hibernate tách thành 2 câu query <code>WHERE id IN (...)</code> độc lập, an toàn và hiệu quả hơn nhiều.

### Cạm bẫy 3: Cấu hình default_batch_fetch_size ở mức toàn cục
Thay vì phải nhớ gắn <code>@BatchSize</code> trên từng Entity, hãy cấu hình mức toàn cục trong <code>application.yml</code>:
~~~yaml
spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 50
~~~
Cấu hình này là "phao cứu sinh vô giá" cho toàn bộ dự án: Bất kỳ chỗ nào lập trình viên vô tình gọi lazy-load trong vòng lặp, Hibernate sẽ tự động gom các ID theo từng khối 50 phần tử và dùng toán tử <code>IN</code> thay vì bắn N câu lệnh đơn lẻ.

---

## 5. Thử thách Thực chiến (Hands-on Challenge)

### Đề bài:
Xây dựng Subsystem Truy vấn Báo cáo Đơn hàng Đa điều kiện (Order Fulfillment & Search Subsystem):
1. Thiết kế endpoint tìm kiếm đơn hàng phân trang đáp ứng các tiêu chí lọc động:
   - Trạng thái đơn hàng (<code>OrderStatus</code>).
   - Tên khách hàng (Tìm kiếm không phân biệt hoa thường, <code>LIKE %keyword%</code>).
   - Khoảng giá trị đơn hàng (<code>minAmount</code> đến <code>maxAmount</code>).
2. Yêu cầu Hiệu năng Tuyệt đối:
   - Trả về đối tượng <code>Page<OrderDTO></code> gồm thông tin Đơn hàng, Tên khách hàng và Danh sách tên sản phẩm trong đơn.
   - **Tuyệt đối không được xuất hiện cảnh báo HHH000104** (Phân trang phải diễn ra 100% tại Database với <code>LIMIT/OFFSET</code>).
   - **Tuyệt đối không bị lỗi N+1 Query** (Tổng số câu lệnh SQL cho 1 trang dữ liệu 20 đơn hàng không được vượt quá 3 câu).

### Lời giải Chuẩn Kỹ sư Cấp cao:

~~~java
package vn.mastery.fulfillment.dto;

import vn.mastery.data.domain.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class FulfillmentDtos {

    public record OrderSearchRequest(
            OrderStatus status,
            String customerName,
            BigDecimal minAmount,
            BigDecimal maxAmount
    ) {}

    public record OrderFulfillmentResponse(
            Long orderId,
            String orderNumber,
            String customerName,
            BigDecimal totalAmount,
            OrderStatus status,
            Instant createdAt,
            List<String> productNames
    ) {}
}
~~~

~~~java
package vn.mastery.fulfillment.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.data.domain.OrderEntity;
import vn.mastery.data.domain.OrderItemEntity;
import vn.mastery.data.repository.OrderRepository;
import vn.mastery.data.specification.OrderSpecifications;
import vn.mastery.fulfillment.dto.FulfillmentDtos.*;

import java.util.List;

@Service
public class OrderFulfillmentService {

    private static final Logger log = LoggerFactory.getLogger(OrderFulfillmentService.class);
    private final OrderRepository orderRepository;

    public OrderFulfillmentService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Transactional(readOnly = true)
    public Page<OrderFulfillmentResponse> searchOrders(OrderSearchRequest request, Pageable pageable) {
        log.info("Thực hiện tìm kiếm đơn hàng phân trang không gây HHH000104 và khử N+1");

        // 1. Tạo Specification động kết hợp JOIN LEFT sang CustomerEntity
        OrderSpecifications.SearchCriteria criteria = new OrderSpecifications.SearchCriteria(
                request.status(),
                request.customerName(),
                request.minAmount(),
                null,
                null
        );
        Specification<OrderEntity> spec = OrderSpecifications.buildDynamicQuery(criteria);

        // 2. Thực thi phân trang: Câu lệnh 1 (COUNT) + Câu lệnh 2 (SELECT Order + Customer với LIMIT/OFFSET)
        // Nhờ default_batch_fetch_size: 50, quan hệ items sẽ không bắn N câu lẻ
        Page<OrderEntity> orderPage = orderRepository.findAll(spec, pageable);

        // 3. Chuyển đổi sang Response DTO an toàn
        // Khi gọi order.getItems(), Hibernate tự động gom toàn bộ order_id trong trang 20 phần tử
        // và bắn DUY NHẤT 1 câu: SELECT * FROM order_items WHERE order_id IN (?, ?, ..., ?)
        List<OrderFulfillmentResponse> content = orderPage.getContent().stream().map(order -> {
            List<String> productNames = order.getItems().stream()
                    .map(OrderItemEntity::getProductName)
                    .toList();

            return new OrderFulfillmentResponse(
                    order.getId(),
                    order.getOrderNumber(),
                    order.getCustomer().getFullName(),
                    order.getTotalAmount(),
                    order.getStatus(),
                    order.getCreatedAt(),
                    productNames
            );
        }).toList();

        log.debug("Đã chuyển đổi thành công {} bản ghi sang DTO", content.size());
        return new PageImpl<>(content, pageable, orderPage.getTotalElements());
    }
}
~~~

:::takeaways
- **Bản chất của N+1**: Do Hibernate Proxy chỉ nạp dữ liệu quan hệ khi được truy cập lần đầu. Trong vòng lặp Java, nó buộc phải phát sinh N câu truy vấn đơn lẻ.
- **Khai tử EAGER**: Luôn khai báo <code>fetch = FetchType.LAZY</code> cho toàn bộ <code>@ManyToOne</code> và <code>@OneToOne</code> để tránh N+1 ngầm ngay cả khi không gọi getter.
- **Cạm bẫy HHH000104 (In-Memory Pagination)**: Tuyệt đối không dùng <code>JOIN FETCH</code> trên quan hệ Collection <code>@OneToMany</code> khi có tham số <code>Pageable</code>. Việc này sẽ kéo toàn bộ cơ sở dữ liệu vào RAM của JVM và gây sập hệ thống (OOM).
- **Vũ khí default_batch_fetch_size**: Cấu hình <code>hibernate.default_batch_fetch_size: 50</code> là giải pháp cân bằng hoàn hảo nhất, vừa cho phép phân trang tại Database, vừa gom các truy vấn con thành câu lệnh <code>WHERE id IN (...)</code>.
- **Đỉnh cao tối ưu với DTO Projection**: Với các màn hình chỉ đọc (Read-Only List/Search), sử dụng Java Record Constructor Expression để SQL chỉ chọn đúng các cột cần thiết, bỏ qua hoàn toàn chi phí tạo Entity và Snapshot của First-Level Cache.
:::
`
    },
    {
      id: "3-3",
      type: "lesson",
      title: "Transactions & Concurrency Control: ACID Internals, Propagation, Isolation & Locking",
      minutes: 55,
      content: `
## @Transactional: Annotation Quyền năng nhưng Tiềm ẩn Nguy cơ Chết người

Trong hệ thống ngân hàng và thương mại điện tử, tính toàn vẹn dữ liệu là sinh mệnh của doanh nghiệp:
~~~java
// Nghiệp vụ Chuyển khoản Tiền tệ:
@Service
public class TransferService {

    @Transactional
    public void transferMoney(String fromAccount, String toAccount, BigDecimal amount) {
        accountRepository.debit(fromAccount, amount);
        accountRepository.credit(toAccount, amount);
        // Nguyên tắc All-or-Nothing: Nếu việc cộng tiền thất bại, việc trừ tiền BẮT BUỘC phải rollback!
    }
}
~~~

Rất nhiều lập trình viên xem <code>@Transactional</code> như một câu thần chú ma thuật: chỉ cần gắn lên method là an tâm dữ liệu được bảo vệ. Nhưng trong thực tế sản xuất:
- Tại sao ném ra một ngoại lệ <code>IOException</code> nhưng cơ sở dữ liệu **vẫn commit âm thầm** làm thất thoát tiền của ngân hàng?
- Tại sao 100 người dùng cùng đặt mua một món hàng còn 1 sản phẩm duy nhất trong kho, và kết quả là **kho bị âm 20 sản phẩm** (Lost Update)?
- Tại sao cấu hình <code>REQUIRES_NEW</code> trên hệ thống chịu tải cao lại dẫn đến **Deadlock toàn bộ Connection Pool**, làm tê liệt toàn bộ cụm dịch vụ?

Bài học này sẽ đi sâu vào bản chất tầng thấp của Spring Transaction Management, kiến trúc ACID, các cấp độ cô lập (Isolation Levels), cơ chế khóa Lạc quan (Optimistic) vs Bi quan (Pessimistic), và cách phòng vệ trước các cuộc tấn công tranh chấp tài nguyên (Concurrency Race Conditions).

---

## 1. Bản chất Kiến trúc & Cơ chế Tầng Mạng (Under the Hood)

### Sơ Đồ Mô Phỏng: Cuộc Đua Dữ Liệu (Race Condition) & Optimistic Lock @Version

~~~mermaid
sequenceDiagram
    autonumber
    actor UserA as Khách hàng A (Web)
    actor UserB as Khách hàng B (App)
    participant DB as PostgreSQL Database (t_wallets)
    
    UserA->>DB: SELECT * FROM t_wallets WHERE id = 1<br/>(Balance: 100$, Version: 1)
    UserB->>DB: SELECT * FROM t_wallets WHERE id = 1<br/>(Balance: 100$, Version: 1)
    
    Note over UserA: Tính toán trừ 30$ -> Số dư mới: 70$
    Note over UserB: Tính toán trừ 50$ -> Số dư mới: 50$
    
    UserA->>DB: UPDATE t_wallets SET balance = 70, version = 2<br/>WHERE id = 1 AND version = 1
    DB-->>UserA: 1 row updated (SUCCESS!)
    
    UserB->>DB: UPDATE t_wallets SET balance = 50, version = 2<br/>WHERE id = 1 AND version = 1
    Note over DB: Version hiện tại là 2 (Không khớp version = 1!)
    DB-->>UserB: 0 rows updated!
    Note over UserB: Hibernate ném OptimisticLockException!<br/>Chống trừ tiền âm thành công 100%!
~~~


### 1.1 Chuẩn ACID và Cơ chế Hoạt động Nội tại của Database
Mọi giao dịch đáng tin cậy đều phải tuân thủ 4 thuộc tính ACID:
1. **Atomicity (Tính nguyên tử)**: Tất cả các thao tác thành công trọn vẹn, hoặc không có thao tác nào được ghi nhận. Tầng DB đảm bảo điều này bằng **Undo Log** hoặc **Write-Ahead Logging (WAL)** để khôi phục lại trạng thái cũ khi có lệnh <code>ROLLBACK</code>.
2. **Consistency (Tính nhất quán)**: Dữ liệu chuyển từ trạng thái hợp lệ này sang trạng thái hợp lệ khác, không vi phạm các ràng buộc (Foreign Key, Check Constraint, Business Invariants).
3. **Isolation (Tính cô lập)**: Các giao dịch chạy đồng thời không được nhìn thấy dữ liệu dở dang của nhau. Được thực thi bằng cơ chế **MVCC (Multi-Version Concurrency Control)** hoặc khóa hàng (Row-level Locks).
4. **Durability (Tính bền vững)**: Một khi giao dịch đã commit thành công, dữ liệu sẽ vĩnh viễn tồn tại ngay cả khi máy chủ bị mất điện đột ngột nhờ cơ chế ghi log **Redo Log / WAL** xuống đĩa cứng (fsync).

### 1.2 Kiến trúc Quản lý Giao dịch của Spring Framework
Spring không tự quản lý kết nối JDBC mà sử dụng mô hình AOP Proxy bọc quanh <code>PlatformTransactionManager</code> (cụ thể là <code>JpaTransactionManager</code>):

~~~text
+-----------------------------------------------------------------------------------+
|                        Spring Transaction AOP Interceptor                         |
+-----------------------------------------------------------------------------------+

     Client gọi: transferService.transferMoney(...)
                           |
                           v
         +------------------------------------+
         |   TransferService$$SpringCGLIB     |  (CGLIB Dynamic Proxy)
         +------------------------------------+
                           |
                           v
         +------------------------------------+
         |       TransactionInterceptor       |
         +------------------------------------+
                           |
            1. Bắt đầu: Lấy kết nối từ DataSource
            2. Gắn kết nối vào ThreadLocal qua TransactionSynchronizationManager
            3. conn.setAutoCommit(false);
                           |
                           v
         +------------------------------------+
         |  Target Business Method (Thực tế)  |  <--- Thực thi logic Java & SQL
         +------------------------------------+
                           |
            +--------------+--------------+
            |                             |
      Thành công                     Ném Exception
            |                             |
            v                             v
   conn.commit();                Kiểm tra có thuộc rollbackFor?
            |                             |
            |                             +-- CÓ: conn.rollback();
            |                             +-- KHÔNG: conn.commit(); (NGUY HIỂM!)
            v                             v
   Giải phóng kết nối            Giải phóng kết nối
   trả về HikariCP Pool          trả về HikariCP Pool
~~~

**Cơ chế ThreadLocal**: <code>TransactionSynchronizationManager</code> lưu trữ JDBC Connection và Session Hibernate trong <code>ThreadLocal</code>. Điều này có nghĩa là: **Transaction trong Spring gắn chặt với 1 Luồng duy nhất (Thread-bound)**. Nếu bạn mở một luồng mới (<code>CompletableFuture.runAsync()</code>, <code>@Async</code>), luồng con sẽ **hoàn toàn nằm ngoài Transaction của luồng cha**!

### 1.3 Cơ chế Lan truyền Giao dịch (Transaction Propagation)

| Thuộc tính | Hành vi khi đã có Transaction ngoài | Hành vi khi CHƯA có Transaction ngoài | Trường hợp Thực tế |
| :--- | :--- | :--- | :--- |
| **REQUIRED** *(Mặc định)* | Tham gia vào Transaction hiện tại | Khởi tạo một Transaction mới | 95% các nghiệp vụ CRUD thông thường |
| **REQUIRES_NEW** | **Treo Transaction hiện tại**, mở một kết nối DB mới độc lập | Khởi tạo một Transaction mới | **Ghi nhận Audit Log, Trừ số dư ví độc lập** |
| **NESTED** | Tạo một **Savepoint** trong Transaction hiện tại | Khởi tạo một Transaction mới | Rollback một phần khi một bước phụ thất bại |
| **MANDATORY** | Tham gia vào Transaction hiện tại | **Ném TransactionRequiredException** | Phương thức con bắt buộc phải chạy trong bối cảnh cha |
| **SUPPORTS** | Tham gia vào Transaction hiện tại | Chạy ở chế độ Non-transactional | Các tác vụ chỉ đọc dữ liệu không bắt buộc lock |
| **NOT_SUPPORTED** | Treo Transaction hiện tại, chạy non-transactional | Chạy ở chế độ Non-transactional | Tác vụ đọc báo cáo nặng không cần lock |
| **NEVER** | **Ném IllegalTransactionStateException** | Chạy ở chế độ Non-transactional | Ngăn cấm chạy bên trong bất kỳ Transaction nào |

:::danger HIỂM HỌA DEADLOCK CONNECTION POOL VỚI REQUIRES_NEW
Khi sử dụng <code>REQUIRES_NEW</code>: Luồng hiện tại giữ chặt Connection 1 của Transaction cha, và yêu cầu HikariCP cấp thêm Connection 2 cho Transaction con.
Nếu hệ thống có 10 luồng đồng thời gọi vào Service này, và <code>maximum-pool-size</code> của HikariCP được cấu hình là 10:
- Cả 10 luồng đều chiếm giữ 10 Connection đầu tiên cho Transaction cha.
- Khi đến dòng gọi <code>REQUIRES_NEW</code>, cả 10 luồng đồng loạt yêu cầu Connection thứ hai từ Pool!
- Pool đã cạn kiệt (hết 10 kết nối), cả 10 luồng rơi vào trạng thái chờ vô hạn định.
- **Kết quả: Hệ thống Deadlock 100% và sập toàn bộ dịch vụ!**
**Công thức an toàn**: Khi dùng <code>REQUIRES_NEW</code>, <code>Pool Size</code> tối thiểu phải bằng: <code>Threads × 2 + 1</code>.
:::

### 1.4 Các Cấp độ Cô lập (Isolation Levels) & Các Hiện tượng Bất thường

| Cấp độ Cô lập | Hiện tượng Dirty Read | Non-Repeatable Read | Phantom Read | Serialization Anomaly | Chi phí Hiệu năng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **READ UNCOMMITTED** | Có thể xảy ra | Có thể xảy ra | Có thể xảy ra | Có thể xảy ra | Thấp nhất |
| **READ COMMITTED** *(Mặc định PG/Oracle)* | **ĐÃ CHẶN** | Có thể xảy ra | Có thể xảy ra | Có thể xảy ra | Thấp |
| **REPEATABLE READ** *(Mặc định MySQL)* | **ĐÃ CHẶN** | **ĐÃ CHẶN** | **ĐÃ CHẶN (bởi MVCC)** | Có thể xảy ra | Trung bình |
| **SERIALIZABLE** | **ĐÃ CHẶN** | **ĐÃ CHẶN** | **ĐÃ CHẶN** | **ĐÃ CHẶN** | Rất cao (dễ abort transaction) |

- **Dirty Read**: Transaction A đọc dữ liệu mà Transaction B đang sửa nhưng chưa commit. Nếu B rollback, A đã đọc dữ liệu "rác".
- **Non-Repeatable Read**: Transaction A đọc 1 dòng dữ liệu. Transaction B sửa dòng đó và commit. Transaction A đọc lại dòng đó và thấy giá trị bị thay đổi!
- **Phantom Read**: Transaction A đếm số dòng thỏa mãn điều kiện (<code>WHERE status = 'ACTIVE'</code>). Transaction B chèn thêm 1 dòng mới và commit. Transaction A đếm lại và thấy xuất hiện thêm 1 dòng "ma"!

---

## 2. Triển khai Mã nguồn Thực chiến (Production-Grade Code)

### 2.1 Khóa Lạc quan với @Version và Cơ chế Tự Động Thử lại (Optimistic Locking & Retry)
Khóa Lạc quan (Optimistic Locking) giả định rằng xung đột dữ liệu rất hiếm khi xảy ra. Nó không khóa Database mà sử dụng cột số nguyên <code>version</code> tăng dần.

#### Entity với Cột Version
~~~java
package vn.mastery.concurrency.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "wallets")
public class WalletEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private String userId;

    @Column(name = "balance", nullable = false, precision = 19, scale = 4)
    private BigDecimal balance;

    @Version // Khóa Lạc quan (Optimistic Locking)
    @Column(name = "version", nullable = false)
    private Long version;

    protected WalletEntity() {}

    public WalletEntity(String userId, BigDecimal balance) {
        this.userId = userId;
        this.balance = balance;
    }

    public void deduct(BigDecimal amount) {
        if (this.balance.compareTo(amount) < 0) {
            throw new InsufficientBalanceException("Số dư ví không đủ để trừ tiền: " + amount);
        }
        this.balance = this.balance.subtract(amount);
    }

    public Long getId() { return id; }
    public String getUserId() { return userId; }
    public BigDecimal getBalance() { return balance; }
    public Long getVersion() { return version; }
}
~~~

#### Service Xử lý Trừ tiền với Spring Retry
Khi có xung đột cập nhật đồng thời, Hibernate sẽ ném ngoại lệ <code>ObjectOptimisticLockingFailureException</code>. Thay vì báo lỗi cho khách hàng, ta sử dụng **Spring Retry** với thuật toán Exponential Backoff để thử lại tự động:

Khai báo dependency trong <code>pom.xml</code>:
~~~xml
<dependency>
    <groupId>org.springframework.retry</groupId>
    <artifactId>spring-retry</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
~~~

~~~java
package vn.mastery.concurrency.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.concurrency.domain.WalletEntity;
import vn.mastery.concurrency.repository.WalletRepository;

import java.math.BigDecimal;

@Service
public class WalletOptimisticService {

    private static final Logger log = LoggerFactory.getLogger(WalletOptimisticService.class);
    private final WalletRepository walletRepository;

    public WalletOptimisticService(WalletRepository walletRepository) {
        this.walletRepository = walletRepository;
    }

    // Tự động thử lại tối đa 3 lần nếu dính Optimistic Locking Failure
    // Thời gian chờ tăng theo cấp số nhân: 100ms -> 200ms
    @Retryable(
        retryFor = { ObjectOptimisticLockingFailureException.class },
        maxAttempts = 3,
        backoff = @Backoff(delay = 100, multiplier = 2.0)
    )
    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public void deductBalanceWithRetry(String userId, BigDecimal amount) {
        log.info("Bắt đầu xử lý trừ ví cho user: {} Số tiền: {}", userId, amount);

        WalletEntity wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Ví không tồn tại: " + userId));

        wallet.deduct(amount);
        // Khi commit, câu lệnh SQL sẽ tự động chèn điều kiện:
        // UPDATE wallets SET balance = ?, version = version + 1 WHERE id = ? AND version = ?
    }

    // Phương thức phục hồi (Fallback) khi đã thử lại 3 lần mà vẫn thất bại
    @Recover
    public void recoverFromOptimisticLockFailure(ObjectOptimisticLockingFailureException ex, 
                                                 String userId, BigDecimal amount) {
        log.error("Hệ thống quá tải! Đã thử lại 3 lần nhưng không thể cập nhật ví cho user: {}", userId);
        throw new ConcurrencyLimitExceededException(
                "Yêu cầu giao dịch bị nghẽn do có nhiều thao tác đồng thời. Vui lòng thử lại sau.");
    }
}
~~~

### 2.2 Khóa Bi quan với SKIP LOCKED (Pessimistic Locking & High-Throughput Worker)
Trong các trường hợp xung đột cực cao (ví dụ: Săn Voucher Flash-Sale, Khớp lệnh sàn giao dịch, hoặc Hàng đợi tác vụ), Optimistic Lock sẽ khiến hầu hết các request bị abort do lỗi version. Ta bắt buộc phải dùng **Khóa Bi quan (Pessimistic Locking)**.

Sử dụng <code>PESSIMISTIC_WRITE</code> kết hợp **<code>SKIP LOCKED</code>** (tính năng cực mạnh của PostgreSQL và MySQL 8.0) cho phép các worker xử lý hàng ngàn giao dịch song song mà không bao giờ bị block lẫn nhau:

~~~java
package vn.mastery.concurrency.repository;

import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.mastery.concurrency.domain.VoucherEntity;
import vn.mastery.concurrency.domain.WalletEntity;

import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<VoucherEntity, Long> {

    // Khóa Bi quan chuẩn: SELECT * FROM vouchers WHERE id = ? FOR UPDATE
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000")}) // Timeout 3s tránh deadlock
    @Query("SELECT v FROM VoucherEntity v WHERE v.id = :id")
    Optional<VoucherEntity> findByIdWithPessimisticLock(@Param("id") Long id);

    // VŨ KHÍ TỐI THƯỢNG CHO WORKER HÀNG ĐỢI: SELECT ... FOR UPDATE SKIP LOCKED
    // Bỏ qua các dòng đang bị worker khác khóa, lập tức lấy dòng rảnh rỗi tiếp theo!
    @Query(value = """
        SELECT * FROM vouchers 
        WHERE campaign_id = :campaignId AND status = 'AVAILABLE' 
        LIMIT 1 
        FOR UPDATE SKIP LOCKED
    """, nativeQuery = true)
    Optional<VoucherEntity> claimNextAvailableVoucherSkipLocked(@Param("campaignId") String campaignId);
}
~~~

### 2.3 Bảo đảm Ghi nhận Audit Log Độc lập với REQUIRES_NEW
Kịch bản: Một hacker cố tình tấn công chuyển tiền trái phép. Giao dịch chính chắc chắn bị lỗi và ném Exception để Rollback. Tuy nhiên, hệ thống **bắt buộc phải ghi nhận lại hành vi vi phạm vào bảng Security Audit Log** để phục vụ điều tra của cơ quan an ninh.

~~~java
package vn.mastery.concurrency.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.concurrency.domain.SecurityAuditLogEntity;
import vn.mastery.concurrency.repository.SecurityAuditLogRepository;

import java.time.Instant;

@Service
public class SecurityAuditService {

    private static final Logger log = LoggerFactory.getLogger(SecurityAuditService.class);
    private final SecurityAuditLogRepository auditRepository;

    public SecurityAuditService(SecurityAuditLogRepository auditRepository) {
        this.auditRepository = auditRepository;
    }

    // REQUIRES_NEW: Treo transaction hiện tại, mở kết nối mới, commit ĐỘC LẬP
    // Dù giao dịch chuyển tiền bên ngoài bị ném Exception và Rollback, Log này VẪN ĐƯỢC LƯU!
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSecurityIncident(String userId, String action, String reason, String ipAddress) {
        log.warn("Ghi nhận sự cố an ninh khẩn cấp: User [{}] Hành động [{}] Lý do [{}]", 
                 userId, action, reason);

        SecurityAuditLogEntity logEntity = new SecurityAuditLogEntity(
                userId,
                action,
                reason,
                ipAddress,
                Instant.now()
        );

        auditRepository.save(logEntity);
    }
}
~~~

---

## 3. Thử nghiệm, Xác thực & Kiểm thử Tranh chấp (Concurrency Stress Testing)

### 3.1 Bài Kiểm thử Tải Đa luồng Thực tế (Multithreaded Race Condition Test)
Viết bài kiểm thử sử dụng <code>ExecutorService</code> và <code>CountDownLatch</code> giả lập **20 luồng đồng thời tấn công rút tiền** từ cùng một tài khoản có số dư 1,000,000 VND (mỗi luồng rút 100,000 VND).

~~~java
package vn.mastery.concurrency.test;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import vn.mastery.concurrency.domain.WalletEntity;
import vn.mastery.concurrency.repository.WalletRepository;
import vn.mastery.concurrency.service.WalletOptimisticService;

import java.math.BigDecimal;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ConcurrencyWalletTest {

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private WalletOptimisticService walletService;

    @Test
    @DisplayName("Kiểm thử 20 luồng đồng thời trừ tiền: Chống Lost Update và bảo toàn số dư")
    void testConcurrentDeductionWithOptimisticLocking() throws InterruptedException {
        // 1. Chuẩn bị ví có 1,000,000 VND
        String userId = "USER-TEST-88";
        walletRepository.save(new WalletEntity(userId, BigDecimal.valueOf(1_000_000)));

        int numberOfThreads = 20;
        BigDecimal deductionAmount = BigDecimal.valueOf(50_000); // 20 x 50,000 = 1,000,000 VND

        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch readyLatch = new CountDownLatch(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        for (int i = 0; i < numberOfThreads; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await(); // Toàn bộ 20 luồng xuất phát cùng 1 mili-giây
                    walletService.deductBalanceWithRetry(userId, deductionAmount);
                    successCount.incrementAndGet();
                } catch (Exception ex) {
                    failCount.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await();
        startLatch.countDown(); // KÍCH HOẠT ĐỒNG THỜI
        doneLatch.await();
        executor.shutdown();

        // 2. Kiểm tra số dư cuối cùng
        WalletEntity updatedWallet = walletRepository.findByUserId(userId).orElseThrow();
        BigDecimal expectedBalance = BigDecimal.valueOf(1_000_000)
                .subtract(deductionAmount.multiply(BigDecimal.valueOf(successCount.get())));

        System.out.println("Kết quả kiểm thử Concurrency:");
        System.out.println("- Giao dịch thành công: " + successCount.get());
        System.out.println("- Giao dịch thất bại (Conflict/Abort): " + failCount.get());
        System.out.println("- Số dư thực tế trong DB: " + updatedWallet.getBalance());

        // KHẲNG ĐỊNH: Số dư trong Database KHÔNG BAO GIỜ bị trừ sai (Lost Update đã bị chặn đứng!)
        assertThat(updatedWallet.getBalance()).isEqualByComparingTo(expectedBalance);
    }
}
~~~

---

## 4. Cạm bẫy Triển khai & Khắc phục Sự cố (Production Pitfalls)

### Cạm bẫy 1: Cái bẫy Âm thầm Nuốt Checked Exception của @Transactional
Mặc định trong đặc tả của Spring: **<code>@Transactional</code> CHỈ ROLLBACK KHI GẶP RuntimeException VÀ Error**!
Nếu phương thức của bạn ném ra một Checked Exception (kế thừa từ <code>java.lang.Exception</code>, ví dụ: <code>IOException</code>, <code>SQLException</code>, hoặc các Exception nghiệp vụ tự viết):
~~~java
// ❌ CỰC KỲ NGUY HIỂM:
@Transactional
public void processPayment() throws PaymentFailedException { // PaymentFailedException extends Exception
    walletRepository.deduct(100000);
    throw new PaymentFailedException("Cổng thanh toán bị gián đoạn");
    // HẬU QUẢ: Transaction VẪN COMMIT! Tiền của khách hàng bị trừ mất!
}
~~~
**Biện pháp bắt buộc**: Luôn luôn khai báo tường minh:
~~~java
@Transactional(rollbackFor = Exception.class)
~~~

### Cạm bẫy 2: Lỗi Tự Gọi Nội Bộ (AOP Self-Invocation Bypass)
Đây là lỗi kinh điển liên quan đến cơ chế hoạt động của Spring AOP Proxy:
~~~java
@Service
public class OrderService {

    public void processOrder() {
        // ... Logic chuẩn bị đơn hàng
        this.saveOrderWithTransaction(); // ❌ THẢM HỌA: Gọi trực tiếp nội bộ qua 'this'!
    }

    @Transactional
    public void saveOrderWithTransaction() {
        orderRepository.save(order);
    }
}
~~~
**Cơ chế sự cố**: Khi gọi <code>this.saveOrderWithTransaction()</code>, lệnh gọi xuất phát trực tiếp từ bên trong đối tượng Target, **hoàn toàn bỏ qua lớp vỏ bọc CGLIB Proxy**!
Kết quả: <code>saveOrderWithTransaction()</code> chạy như một phương thức Java thuần túy, **hoàn toàn không có Transaction nào được mở ra**!
**Giải pháp**: Tách phương thức có <code>@Transactional</code> sang một Service độc lập và inject vào, hoặc tự inject chính <code>OrderService</code> thông qua <code>@Lazy</code>.

### Cạm bẫy 3: Kẹp Lệnh Gọi Mạng Chậm (HTTP/RPC/Email) vào bên trong Transaction
~~~java
// ❌ CỰC KỲ NGUY HIỂM:
@Transactional
public void submitOrder(OrderCommand cmd) {
    orderRepo.save(order);
    
    // GỌI API SANG ĐỐI TÁC NGOÀI BÊN TRONG TRANSACTION:
    emailService.sendConfirmationEmail(cmd.getEmail()); // Mất 2 giây!
    smsGateway.sendOtpSms(cmd.getPhone());             // Mất 3 giây!
}
~~~
Hậu quả: Kết nối Database bị giam giữ trong suốt 5 giây chỉ để chờ gửi Email và SMS! Dưới áp lực 50 request/giây, toàn bộ 20 kết nối của HikariCP sẽ bị cạn sạch, làm sập toàn bộ hệ thống.
**Quy tắc bất di bất dịch**: Transaction **CHỈ BAO GỒM CÁC THAO TÁC DATABASE**. Mọi lệnh gọi HTTP, gửi mail, bắn tin nhắn phải được đưa ra ngoài Transaction hoặc sử dụng mô hình **Transactional Outbox Pattern** (Sẽ học chi tiết ở Module 6).

---

## 5. Thử thách Thực chiến (Hands-on Challenge)

### Đề bài:
Xây dựng Subsystem Săn Vé Khuyến Mãi Flash-Sale (High-Concurrency Flash-Sale Engine):
1. Thiết kế Entity <code>FlashSaleVoucherEntity</code>:
   - Các trường: <code>id</code>, <code>campaignCode</code>, <code>voucherCode</code>, <code>status</code> (<code>AVAILABLE</code>, <code>CLAIMED</code>), <code>claimedBy</code>, <code>claimedAt</code>.
2. Xây dựng Service nhận yêu cầu nhận vé từ 1,000 người dùng đồng thời:
   - Sử dụng giải pháp Khóa Bi quan tối ưu <code>FOR UPDATE SKIP LOCKED</code> để giật vé tức thì mà không gây nghẽn hàng đợi (Zero Blocking).
   - Đảm bảo 100% không phát vé trùng lặp và không bán vượt số lượng tồn kho (Zero Over-selling).
   - Tích hợp <code>SecurityAuditService</code> (chạy <code>REQUIRES_NEW</code>) ghi lại lịch sử nhận vé thành công.

### Lời giải Chuẩn Kỹ sư Cấp cao:

~~~java
package vn.mastery.flashsale.domain;

import jakarta.persistence.*;
import java.time.Instant;

public enum VoucherStatus { AVAILABLE, CLAIMED }

@Entity
@Table(
    name = "flash_sale_vouchers",
    indexes = {
        @Index(name = "idx_fs_campaign_status", columnList = "campaign_code, status")
    }
)
public class FlashSaleVoucherEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "campaign_code", nullable = false, length = 50)
    private String campaignCode;

    @Column(name = "voucher_code", nullable = false, unique = true, length = 32)
    private String voucherCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private VoucherStatus status = VoucherStatus.AVAILABLE;

    @Column(name = "claimed_by", length = 50)
    private String claimedBy;

    @Column(name = "claimed_at")
    private Instant claimedAt;

    protected FlashSaleVoucherEntity() {}

    public FlashSaleVoucherEntity(String campaignCode, String voucherCode) {
        this.campaignCode = campaignCode;
        this.voucherCode = voucherCode;
        this.status = VoucherStatus.AVAILABLE;
    }

    public void claim(String userId) {
        if (this.status != VoucherStatus.AVAILABLE) {
            throw new IllegalStateException("Voucher này đã có người khác sở hữu!");
        }
        this.status = VoucherStatus.CLAIMED;
        this.claimedBy = userId;
        this.claimedAt = Instant.now();
    }

    // Getters
    public Long getId() { return id; }
    public String getCampaignCode() { return campaignCode; }
    public String getVoucherCode() { return voucherCode; }
    public VoucherStatus getStatus() { return status; }
    public String getClaimedBy() { return claimedBy; }
    public Instant getClaimedAt() { return claimedAt; }
}
~~~

~~~java
package vn.mastery.flashsale.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.mastery.flashsale.domain.FlashSaleVoucherEntity;

import java.util.Optional;

@Repository
public interface FlashSaleVoucherRepository extends JpaRepository<FlashSaleVoucherEntity, Long> {

    // VŨ KHÍ SKIP LOCKED: Lấy ngay vé rảnh rỗi mà không bị lock chặn luồng
    @Query(value = """
        SELECT * FROM flash_sale_vouchers 
        WHERE campaign_code = :campaignCode AND status = 'AVAILABLE' 
        LIMIT 1 
        FOR UPDATE SKIP LOCKED
    """, nativeQuery = true)
    Optional<FlashSaleVoucherEntity> claimAvailableVoucherSkipLocked(@Param("campaignCode") String campaignCode);

    long countByCampaignCodeAndStatus(String campaignCode, String status);
}
~~~

~~~java
package vn.mastery.flashsale.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.concurrency.service.SecurityAuditService;
import vn.mastery.flashsale.domain.FlashSaleVoucherEntity;
import vn.mastery.flashsale.repository.FlashSaleVoucherRepository;

@Service
public class FlashSaleClaimService {

    private static final Logger log = LoggerFactory.getLogger(FlashSaleClaimService.class);

    private final FlashSaleVoucherRepository voucherRepository;
    private final SecurityAuditService auditService;

    public FlashSaleClaimService(FlashSaleVoucherRepository voucherRepository, 
                                 SecurityAuditService auditService) {
        this.voucherRepository = voucherRepository;
        this.auditService = auditService;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public String claimVoucher(String campaignCode, String userId, String clientIp) {
        log.info("User [{}] tham gia săn vé Flash-Sale chiến dịch [{}]", userId, campaignCode);

        // 1. Áp dụng SKIP LOCKED giật dòng vé rảnh rỗi tức thì
        FlashSaleVoucherEntity voucher = voucherRepository.claimAvailableVoucherSkipLocked(campaignCode)
                .orElseThrow(() -> new OutOfStockException("Rất tiếc! Toàn bộ vé khuyến mại của đợt này đã hết sạch!"));

        // 2. Chuyển quyền sở hữu cho User
        voucher.claim(userId);

        // 3. Ghi nhận Audit Log trong Transaction độc lập (REQUIRES_NEW)
        auditService.recordSecurityIncident(
                userId,
                "CLAIM_FLASH_SALE_VOUCHER",
                "Thành công nhận vé: " + voucher.getVoucherCode(),
                clientIp
        );

        log.info("CHÚC MỪNG: User [{}] săn vé thành công: {}", userId, voucher.getVoucherCode());
        return voucher.getVoucherCode();
    }
}
~~~

:::takeaways
- **Bản chất của @Transactional**: Được thực thi bởi Spring AOP Proxy bọc quanh <code>PlatformTransactionManager</code>, gắn kết nối JDBC vào <code>ThreadLocal</code>.
- **Luôn khai báo rollbackFor = Exception.class**: Mặc định Spring không rollback khi gặp Checked Exception. Đây là nguyên nhân hàng đầu gây thất thoát dữ liệu.
- **Tách biệt Transaction với I/O Mạng**: Không bao giờ kẹp các lệnh gọi REST API, gửi Email, gửi SMS vào trong <code>@Transactional</code>. Hãy dùng Transactional Outbox Pattern.
- **Cơ chế Khóa Lạc quan (@Version)**: Phù hợp cho 90% các tác vụ CRUD thông thường, kết hợp với Spring Retry để tự động xử lý xung đột mà không chặn tài nguyên DB.
- **Khóa Bi quan với SKIP LOCKED**: Là tiêu chuẩn vàng cho các hệ thống hàng đợi tác vụ và săn vé Flash-Sale tốc độ cao, triệt tiêu hoàn toàn hiện tượng nghẽn luồng và tranh chấp khóa.
:::
`
    },
    {
      id: "3-4",
      type: "lesson",
      title: "Flyway & Database Migration: Schema Versioning, Expand-Contract Zero-Downtime & Java-based Migrations",
      minutes: 50,
      content: `
## Vì sao Chỉnh sửa Schema Bằng Tay là Con đường Ngắn nhất Dẫn tới Thảm họa?

Trong các nhóm phát triển phần mềm nghiệp dư, việc cập nhật cơ sở dữ liệu thường diễn ra theo cách:
1. Một lập trình viên mở DBeaver/Navicat chạy lệnh: <code>ALTER TABLE users ADD COLUMN phone VARCHAR(20);</code> trên máy cá nhân.
2. Quên gửi câu lệnh SQL này cho đồng nghiệp, khiến code của người khác bị lỗi khi <code>git pull</code>.
3. Khi deploy lên Staging hoặc Production, ai đó phải mở cửa sổ dòng lệnh chạy SQL bằng tay (Manual Execution), tiềm ẩn nguy cơ gõ nhầm lệnh, chạy sai thứ tự hoặc quên không tạo Index.
4. Khi cần khôi phục (Rollback) một bản phát hành lỗi, không ai nhớ rõ cấu trúc database ban đầu đã bị thay đổi những gì!

**Flyway** sinh ra để xóa sổ hoàn toàn sự hỗn loạn này: Nó là công cụ **Quản lý Phiên bản Cơ sở dữ liệu (Database Version Control)** tương tự như Git đối với mã nguồn. Mọi thay đổi về bảng, cột, khóa ngoại, chỉ mục đều được ghi nhận thành các file kịch bản SQL có đánh số phiên bản chặt chẽ, được áp dụng tự động và tuần tự ngay khi ứng dụng Spring Boot khởi động.

---

## 1. Bản chất Kiến trúc & Cơ chế Tầng Mạng (Under the Hood)

### 1.1 Thứ tự Khởi động Spring Boot: Mối quan hệ giữa Flyway và Hibernate
Một trong những hiểu lầm phổ biến nhất là: "Liệu Hibernate có tạo bảng trước rồi Flyway mới chạy không?"

Câu trả lời là **KHÔNG**. Spring Boot thiết lập một chuỗi vòng đời (Lifecycle Dependency) cực kỳ nghiêm ngặt:

~~~text
+-----------------------------------------------------------------------------------+
|               Thứ tự Bootstrap: Flyway vs Hibernate EntityManager                |
+-----------------------------------------------------------------------------------+

     Spring Boot Application Startup
                  |
                  v
         [ DataSource Initialized ]  <--- HikariCP Pool kết nối sẵn sàng
                  |
                  v
    +--------------------------------+
    |  FlywayMigrationInitializer    |  <--- FLYWAY LUÔN CHẠY TRƯỚC!
    +--------------------------------+
                  |
                  +---> 1. Khóa bảng 'flyway_schema_history' (Advisory Lock)
                  |     2. Kiểm tra checksum các file đã áp dụng
                  |     3. Thực thi tuần tự các script mới (V1 -> V2 -> V3)
                  |     4. Commit và giải phóng Lock
                  v
    +--------------------------------+
    |  LocalContainerEntityManager   |  <--- HIBERNATE CHẠY SAU!
    |  FactoryBean                   |
    +--------------------------------+
                  |
                  +---> Kiểm tra 'hibernate.ddl-auto=validate'
                  |     Đối chiếu Schema thực tế trong DB với các Entity Java
                  |     - Khớp 100%: Ứng dụng khởi động thành công ✓
                  |     - Lệch cột / sai type: Dừng ứng dụng ngay lập tức! ❌
                  v
       [ Application Ready to Serve ]
~~~

### 1.2 Bảng Siêu dữ liệu: flyway_schema_history & Cơ chế Checksum SHA-256
Khi chạy lần đầu tiên, Flyway tự động tạo một bảng đặc biệt có tên <code>flyway_schema_history</code>:

~~~sql
-- Cấu trúc bảng lịch sử của Flyway (PostgreSQL)
SELECT installed_rank, version, description, type, script, checksum, installed_by, execution_time, success 
FROM flyway_schema_history;
~~~

| installed_rank | version | description | type | script | checksum | success |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 1 | init core banking | SQL | V1__init_core_banking.sql | -148920194 | true |
| 2 | 2 | add transaction fee | SQL | V2__add_transaction_fee.sql | 892014115 | true |
| 3 | 3 | customer kyc status | SQL | V3__customer_kyc_status.sql | 110294812 | true |

**Cơ chế Checksum Bất biến (Immutability Validation)**:
- Mỗi khi thực thi một file migration, Flyway tính toán mã băm **CRC32 / SHA-256** của toàn bộ nội dung file đó và lưu vào cột <code>checksum</code>.
- Ở lần khởi động tiếp theo, Flyway đọc lại toàn bộ các file cũ trên ổ đĩa và so sánh mã băm với giá trị đã lưu trong bảng <code>flyway_schema_history</code>.
- **Nếu phát hiện dù chỉ 1 dấu cách hoặc ký tự bị sửa đổi trong file cũ đã áp dụng**, Flyway lập tức kích hoạt cơ chế **Fail-Fast**:
  ~~~text
  Migration checksum mismatch for migration version 2:
  -> Applied to database : 892014115
  -> Resolved locally    : -491028472
  ~~~
  Ứng dụng sẽ từ chối khởi động để ngăn chặn sự sai lệch trạng thái dữ liệu (State Drift)!

### 1.3 Quy ước Đặt tên Tập tin Migration
Flyway quét thư mục <code>src/main/resources/db/migration/</code> theo 3 mẫu tên:

~~~text
1. Versioned Migration (Chạy 1 lần duy nhất theo thứ tự tăng dần):
   V{Version}__{Description}.sql
   Ví dụ: V1_0_0__create_accounts_table.sql
          V1_0_1__add_cif_index.sql
   (Chú ý: BẮT BUỘC có HAI DẤU GẠCH DƯỚI '__' phân tách Version và Mô tả!)

2. Repeatable Migration (Chạy lại mỗi khi nội dung file thay đổi):
   R__{Description}.sql
   Ví dụ: R__recreate_account_balance_view.sql
          R__update_calculate_tax_function.sql
   (Luôn chạy SAU TOÀN BỘ các file Versioned Migration).

3. Undo Migration (Chỉ có trên bản Flyway Teams thương mại):
   U{Version}__{Description}.sql
~~~

---

## 2. Triển khai Mã nguồn Thực chiến (Production-Grade Code)

### 2.1 Cấu hình Maven & application.yml Chuẩn Doanh nghiệp
Khai báo dependencies trong <code>pom.xml</code>:
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

Cấu hình trong <code>application.yml</code>:
~~~yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/core_banking_db
    username: banking_app
    password: secret_password
  
  flyway:
    enabled: true
    # Thư mục chứa các file SQL migration
    locations: classpath:db/migration
    # Bảng lưu lịch sử
    table: flyway_schema_history
    # Khóa database trong tối đa 60 giây khi nhiều Pod cùng khởi động
    lock-retry-count: 60
    # Cho phép chạy các migration có version thấp hơn version cao nhất hiện tại (dành cho mô hình nhánh Git song song)
    out-of-order: true
    # Trên cơ sở dữ liệu đã có sẵn bảng từ trước: Lấy mốc hiện tại làm version 0
    baseline-on-migrate: true
    baseline-version: "0"

  jpa:
    hibernate:
      # BẮT BUỘC: Validate schema giữa Entity và DB thật, cấm dùng 'update'
      ddl-auto: validate
    open-in-view: false
~~~

### 2.2 Các File Kịch bản Migration Thực tế

#### File V1__init_banking_schema.sql
Tạo các bảng lõi, sequence và ràng buộc khóa ngoại:

~~~sql
-- V1__init_banking_schema.sql
-- Tạo sequence độc lập cấp phát theo dải 50 ID
CREATE SEQUENCE global_entity_seq START WITH 1000 INCREMENT BY 50;

-- Bảng tài khoản thanh toán
CREATE TABLE accounts (
    id             BIGINT PRIMARY KEY DEFAULT nextval('global_entity_seq'),
    cif            VARCHAR(10) NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    balance        NUMERIC(19, 4) NOT NULL DEFAULT 0.0000,
    currency       VARCHAR(3) NOT NULL DEFAULT 'VND',
    status         VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    version        BIGINT NOT NULL DEFAULT 0,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by     VARCHAR(50),
    updated_by     VARCHAR(50),
    CONSTRAINT uq_accounts_cif UNIQUE (cif),
    CONSTRAINT uq_accounts_number UNIQUE (account_number)
);

CREATE INDEX idx_accounts_status ON accounts(status);
~~~

#### File R__create_customer_financial_summary_view.sql
Kịch bản Repeatable Migration: Mỗi khi nhóm phát triển sửa đổi logic của View, chỉ cần sửa trực tiếp vào file này và commit Git. Flyway sẽ tự động chạy lại câu lệnh <code>CREATE OR REPLACE VIEW</code>:

~~~sql
-- R__create_customer_financial_summary_view.sql
CREATE OR REPLACE VIEW v_customer_financial_summary AS
SELECT 
    cif,
    account_number,
    balance,
    currency,
    status,
    CASE 
        WHEN balance >= 1000000000 THEN 'VIP_DIAMOND'
        WHEN balance >= 100000000  THEN 'VIP_GOLD'
        ELSE 'STANDARD'
    END AS customer_segment
FROM accounts;
~~~

### 2.3 Java-based Migration: Xử lý Dữ liệu Lớn Phức tạp
Có những tác vụ di trú dữ liệu mà SQL thuần không thể thực hiện an toàn hoặc cần gọi các thuật toán mã hóa (ví dụ: băm mật khẩu legacy bằng BCrypt, hoặc gọi KMS giải mã dữ liệu cũ). Flyway hỗ trợ viết **Java Migration**:

~~~java
package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

// Quy ước đặt tên: V{Version}__{Description} dạng CamelCase
public class V2_1__EncryptLegacyPasswordsWithBcrypt extends BaseJavaMigration {

    private static final Logger log = LoggerFactory.getLogger(V2_1__EncryptLegacyPasswordsWithBcrypt.class);
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);

    @Override
    public void migrate(Context context) throws Exception {
        log.info("Bắt đầu di trú: Băm toàn bộ mật khẩu Plaintext của hệ thống cũ bằng BCrypt...");

        try (Statement selectStmt = context.getConnection().createStatement();
             ResultSet rs = selectStmt.executeQuery(
                     "SELECT id, password_plaintext FROM users WHERE password_hash IS NULL");
             PreparedStatement updateStmt = context.getConnection().prepareStatement(
                     "UPDATE users SET password_hash = ? WHERE id = ?")) {

            int processedCount = 0;
            while (rs.next()) {
                long userId = rs.getLong("id");
                String rawPassword = rs.getString("password_plaintext");

                if (rawPassword != null && !rawPassword.isBlank()) {
                    String hashedPassword = passwordEncoder.encode(rawPassword);
                    updateStmt.setString(1, hashedPassword);
                    updateStmt.setLong(2, userId);
                    updateStmt.addBatch();
                    processedCount++;

                    // Thực thi theo từng lô 1000 bản ghi để không tràn RAM
                    if (processedCount % 1000 == 0) {
                        updateStmt.executeBatch();
                        log.info("Đã xử lý mã hóa: {} người dùng", processedCount);
                    }
                }
            }
            updateStmt.executeBatch(); // Flush số lượng còn lại
            log.info("Hoàn tất di trú bảo mật. Tổng số tài khoản đã băm BCrypt: {}", processedCount);
        }
    }
}
~~~

---

## 3. Chiến lược Triển khai Không Gián đoạn (Zero-Downtime Deployment)

### 3.1 Mô hình Mở rộng - Thu hẹp (Expand and Contract Pattern)
Khi triển khai ứng dụng trên Kubernetes với chiến lược Rolling Update: Pod phiên bản cũ (v1) và Pod phiên bản mới (v2) sẽ **chạy song song đồng thời** trong khoảng thời gian từ 5 đến 15 phút.

Nếu bạn thực hiện một câu lệnh phá vỡ tương thích như:
~~~sql
-- ❌ THẢM HỌA LÀM SẬP POD V1 CŨ ĐANG CHẠY:
ALTER TABLE accounts DROP COLUMN legacy_phone;
ALTER TABLE accounts RENAME COLUMN phone TO msisdn;
~~~
Pod v1 cũ lập tức ném lỗi <code>BadSqlGrammarException: column "phone" does not exist</code> khi khách hàng thực hiện giao dịch!

Quy trình **Expand - Contract** chuẩn công nghiệp:

~~~text
+-----------------------------------------------------------------------------------+
|                        Mô hình Expand and Contract 3 Pha                          |
+-----------------------------------------------------------------------------------+

[ Pha 1: EXPAND (Mở rộng Schema) ]
- Thêm cột mới dạng NULLable (ví dụ: 'contact_msisdn').
- Cột cũ 'phone' VẪN GIỮ NGUYÊN.
- Pod v1 (cũ) tiếp tục đọc/ghi vào 'phone'.
- Pod v2 (mới) ghi vào CẢ HAI cột 'phone' và 'contact_msisdn'.
                |
                v
[ Pha 2: MIGRATE (Đồng bộ Dữ liệu Lịch sử) ]
- Chạy Background Worker di chuyển dữ liệu cũ từ 'phone' sang 'contact_msisdn'.
- Chờ 100% người dùng chuyển hẳn sang dùng Pod v2 mới.
- Xóa bỏ hoàn toàn Pod v1 cũ.
                |
                v
[ Pha 3: CONTRACT (Thu hẹp & Dọn dẹp) ]
- Đặt ràng buộc NOT NULL trên cột mới:
  ALTER TABLE accounts ALTER COLUMN contact_msisdn SET NOT NULL;
- Xóa bỏ cột cũ 'phone':
  ALTER TABLE accounts DROP COLUMN phone;
~~~

### 3.2 Thêm Cột và Chỉ mục trên Bảng Khổng lồ 50 Triệu Dòng (Zero-Locking)
1. **Thêm cột có giá trị mặc định**:
   - Từ PostgreSQL 11+, lệnh <code>ALTER TABLE orders ADD COLUMN is_flagged BOOLEAN NOT NULL DEFAULT false;</code> chỉ cập nhật Metadata và chạy trong **vài mili-giây**, không khóa bảng!
2. **Tạo Index trên bảng đang chịu tải cao**:
   - Mặc định <code>CREATE INDEX</code> sẽ chiếm cờ khóa ghi (<code>ShareLock</code>), ngăn chặn toàn bộ thao tác <code>INSERT</code>, <code>UPDATE</code> của khách hàng.
   - **Giải pháp**: Luôn sử dụng lệnh **<code>CONCURRENTLY</code>**:
     ~~~sql
     CREATE INDEX CONCURRENTLY idx_orders_created_at ON orders(created_at);
     ~~~
     Lưu ý: <code>CREATE INDEX CONCURRENTLY</code> không được phép chạy bên trong Transaction block của Flyway. Trong Flyway, hãy tắt chế độ Transaction cho file đó bằng cách đặt Header ở đầu file:
     ~~~sql
     -- V4__add_concurrent_index.sql
     -- flyway:cleanDisabled=true
     -- flyway:executeInTransaction=false
     CREATE INDEX CONCURRENTLY idx_orders_created_at ON orders(created_at);
     ~~~

---

## 4. Cạm bẫy Triển khai & Khắc phục Sự cố (Production Pitfalls)

### Cạm bẫy 1: Sửa tay vào file migration cũ đã merge Git (Checksum Mismatch)
Một lập trình viên nhận thấy file <code>V3__add_column.sql</code> bị gõ sai độ dài <code>VARCHAR(20)</code> thành <code>VARCHAR(50)</code>, liền sửa trực tiếp vào file <code>V3</code>.
Hậu quả: Toàn bộ máy chủ Staging và Production đã chạy file <code>V3</code> cũ sẽ lập tức từ chối khởi động vì Checksum bị sai lệch!
**Quy tắc Forward-Only**:
- File migration đã chạy trên bất kỳ môi trường chia sẻ nào là **bất biến (Immutable)**.
- Muốn sửa? Tạo file mới **<code>V4__alter_column_length.sql</code>** và sửa tiếp tiến lên phía trước.
- **Nếu lỡ tay sửa trên máy Local**: Dùng lệnh <code>mvn flyway:repair</code> để Flyway cập nhật lại bảng lịch sử theo mã băm mới.

### Cạm bẫy 2: Out of Order Migration trong mô hình Git Flow
Nhánh <code>feature-A</code> viết script <code>V4__feature_a.sql</code> được merge trước. Nhánh <code>feature-B</code> viết script <code>V3__feature_b.sql</code> merge sau.
Mặc định, Flyway sẽ từ chối chạy <code>V3</code> vì đã có phiên bản <code>V4</code> tồn tại trong bảng lịch sử!
**Biện pháp khắc phục**: Luôn bật cấu hình:
~~~yaml
spring.flyway.out-of-order: true
~~~
Cấu hình này cho phép Flyway tự động phát hiện và bù đắp các file có version thấp hơn bị merge sau.

### Cạm bẫy 3: Đụng độ nhiều Pod cùng chạy Migration lúc khởi động (Race Condition)
Khi triển khai cụm Kubernetes với 5 Pod cùng scale up một lúc, 5 ứng dụng Spring Boot sẽ đồng thời cố gắng thực thi câu lệnh DDL lên Database.
Flyway giải quyết điều này bằng cơ chế **Advisory Lock**: Pod đầu tiên giành được Lock sẽ thực thi migration, 4 Pod còn lại sẽ chờ.
Tuy nhiên, nếu migration xử lý dữ liệu kéo dài hơn 60 giây và bạn không tăng thời gian chờ, các Pod phụ sẽ ném lỗi:
~~~text
org.flywaydb.core.api.FlywayException: Waiting for lock on flyway_schema_history timed out!
~~~
**Biện pháp khắc phục**: Cấu hình thời gian chờ: <code>spring.flyway.lock-retry-count: 120</code>.

---

## 5. Thử thách Thực chiến (Hands-on Challenge)

### Đề bài:
Thực hiện Kế hoạch Di trú Không Gián đoạn (Zero-Downtime Migration Exercise) đổi tên trường số điện thoại trên bảng <code>merchants</code>:
1. Bảng hiện tại: <code>merchants (id, merchant_name, phone_number, created_at)</code>.
2. Mục tiêu: Chuyển sang trường chuẩn hóa quốc tế <code>msisdn_e164</code>.
3. Yêu cầu:
   - Viết file <code>V5__expand_add_msisdn_column.sql</code>: Thêm cột mới và tạo Trigger tự động đồng bộ dữ liệu 2 chiều giữa <code>phone_number</code> và <code>msisdn_e164</code>.
   - Viết Java Migration <code>V5_1__BackfillMerchantMsisdnData.java</code>: Chuẩn hóa dữ liệu cũ (ví dụ: chuyển đổi <code>0901234567</code> thành <code>+84901234567</code>) theo từng batch 500 bản ghi.
   - Viết file <code>V6__contract_drop_legacy_phone.sql</code>: Xóa bỏ trigger và cột cũ sau khi toàn bộ dịch vụ đã ổn định.

### Lời giải Chuẩn Kỹ sư Cấp cao:

#### 1. File V5__expand_add_msisdn_column.sql
~~~sql
-- V5__expand_add_msisdn_column.sql
-- Pha 1 (Expand): Thêm cột mới dạng NULLable
ALTER TABLE merchants ADD COLUMN msisdn_e164 VARCHAR(20);

-- Tạo Trigger đồng bộ 2 chiều: Đảm bảo cả Pod cũ (ghi phone_number) và Pod mới (ghi msisdn_e164) đều hoạt động
CREATE OR REPLACE FUNCTION sync_merchant_phone_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Nếu ứng dụng cũ ghi vào phone_number, đồng bộ sang msisdn_e164
    IF NEW.phone_number IS NOT NULL AND NEW.msisdn_e164 IS NULL THEN
        NEW.msisdn_e164 := NEW.phone_number;
    END IF;
    -- Nếu ứng dụng mới ghi vào msisdn_e164, đồng bộ ngược về phone_number
    IF NEW.msisdn_e164 IS NOT NULL AND NEW.phone_number IS NULL THEN
        NEW.phone_number := NEW.msisdn_e164;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_merchant_phone
BEFORE INSERT OR UPDATE ON merchants
FOR EACH ROW
EXECUTE FUNCTION sync_merchant_phone_fields();
~~~

#### 2. Java Migration V5_1__BackfillMerchantMsisdnData.java
~~~java
package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

public class V5_1__BackfillMerchantMsisdnData extends BaseJavaMigration {

    private static final Logger log = LoggerFactory.getLogger(V5_1__BackfillMerchantMsisdnData.class);

    @Override
    public void migrate(Context context) throws Exception {
        log.info("Bắt đầu chuẩn hóa định dạng số điện thoại E.164 cho dữ liệu lịch sử...");

        String selectSql = "SELECT id, phone_number FROM merchants WHERE msisdn_e164 IS NULL FOR UPDATE";
        String updateSql = "UPDATE merchants SET msisdn_e164 = ? WHERE id = ?";

        try (Statement selectStmt = context.getConnection().createStatement();
             ResultSet rs = selectStmt.executeQuery(selectSql);
             PreparedStatement updateStmt = context.getConnection().prepareStatement(updateSql)) {

            int count = 0;
            while (rs.next()) {
                long merchantId = rs.getLong("id");
                String rawPhone = rs.getString("phone_number");

                if (rawPhone != null && !rawPhone.isBlank()) {
                    String formattedE164 = formatToE164(rawPhone);
                    updateStmt.setString(1, formattedE164);
                    updateStmt.setLong(2, merchantId);
                    updateStmt.addBatch();
                    count++;

                    if (count % 500 == 0) {
                        updateStmt.executeBatch();
                        log.debug("Đã chuẩn hóa {} đối tác", count);
                    }
                }
            }
            updateStmt.executeBatch();
            log.info("Hoàn tất chuẩn hóa E.164 cho {} đối tác", count);
        }
    }

    private String formatToE164(String phone) {
        String cleaned = phone.replaceAll("[^0-9]", "");
        if (cleaned.startsWith("0")) {
            return "+84" + cleaned.substring(1);
        }
        if (!cleaned.startsWith("+")) {
            return "+" + cleaned;
        }
        return cleaned;
    }
}
~~~

#### 3. File V6__contract_drop_legacy_phone.sql
Chỉ được phép thực thi sau khi phiên bản code mới đã vận hành ổn định 100% trên Production:

~~~sql
-- V6__contract_drop_legacy_phone.sql
-- Pha 3 (Contract): Dọn dẹp trigger và xóa cột cũ
DROP TRIGGER IF EXISTS trg_sync_merchant_phone ON merchants;
DROP FUNCTION IF EXISTS sync_merchant_phone_fields();

-- Đặt ràng buộc bắt buộc cho cột mới
ALTER TABLE merchants ALTER COLUMN msisdn_e164 SET NOT NULL;

-- Xóa bỏ cột cũ an toàn
ALTER TABLE merchants DROP COLUMN phone_number;

-- Đánh chỉ mục tìm kiếm trên cột mới
CREATE INDEX idx_merchants_msisdn ON merchants(msisdn_e164);
~~~

:::takeaways
- **Flyway là Người quản lý Duy nhất**: Tuyệt đối không dùng <code>hibernate.ddl-auto=update</code> trên Production. Luôn sử dụng <code>ddl-auto=validate</code> và để Flyway độc quyền kiểm soát cấu trúc cơ sở dữ liệu.
- **Quy tắc Bất biến Checksum**: Không bao giờ chỉnh sửa nội dung file migration đã được áp dụng. Mọi sự thay đổi phải luôn là **Forward-Only** bằng các script có số phiên bản mới hơn.
- **Chiến lược Expand-Contract**: Để đạt được khả năng triển khai Zero-Downtime, các thay đổi schema không tương thích ngược phải được phân tách thành 3 pha độc lập: Mở rộng (Expand), Di trú ngầm (Migrate), và Thu hẹp dọn dẹp (Contract).
- **Tối ưu Bảng Lớn**: Sử dụng <code>CREATE INDEX CONCURRENTLY</code> (kèm <code>flyway:executeInTransaction=false</code>) để tránh khóa chặt các luồng ghi của hệ thống khi lập chỉ mục trên các bảng hàng chục triệu bản ghi.
- **Linh hoạt với Java-based Migration**: Tận dụng <code>BaseJavaMigration</code> cho các tác vụ di chuyển dữ liệu phức tạp đòi hỏi logic nghiệp vụ, thuật toán mã hóa hoặc xử lý chia nhỏ theo Batch.
:::
`
    },
    {
      id: "3-5",
      type: "lesson",
      title: "Entity Mapping Nâng cao: Kế thừa (Inheritance Strategies), JSONB Mapping, Soft Delete Hibernate 6.3+ & AttributeConverter",
      minutes: 55,
      content: `
## Vượt qua CRUD Phẳng: Khi Dữ liệu Doanh nghiệp Mang Tính Đa hình và Phức hợp

Trong các ứng dụng thực tế, dữ liệu hiếm khi tồn tại dưới dạng các bảng độc lập đơn giản. Hãy xem xét các bài toán nghiệp vụ phức tạp:
1. **Phân cấp Thanh toán Đa hình (Polymorphic Payments)**: Cổng thanh toán tiếp nhận giao dịch thẻ (<code>CreditCardPayment</code>), chuyển khoản ngân hàng (<code>BankTransferPayment</code>), và ví điện tử/tiền mã hóa (<code>CryptoPayment</code>). Mỗi loại thanh toán chia sẻ các trường chung (mã giao dịch, số tiền, trạng thái) nhưng sở hữu các trường đặc thù hoàn toàn khác nhau.
2. **Dữ liệu Phi cấu trúc Động (Dynamic JSON Payloads)**: Báo cáo phân tích rủi ro chống gian lận (Anti-Fraud) trả về một cây dữ liệu JSON lồng nhau phức tạp mà cấu trúc có thể thay đổi liên tục theo từng đối tác.
3. **Xóa mềm An toàn (Soft Delete)**: Các quy định tài chính và kiểm toán (GDPR, PCI-DSS) nghiêm cấm việc dùng lệnh <code>DELETE</code> vật lý xóa dữ liệu khỏi đĩa cứng. Dữ liệu phải được đánh dấu đã xóa (<code>deleted_at</code>), tự động ẩn đi khỏi người dùng thông thường nhưng vẫn truy vết được cho kiểm toán viên.

Bài học này sẽ hướng dẫn chuyên sâu 3 chiến lược ánh xạ kế thừa (**SINGLE_TABLE**, **JOINED**, **TABLE_PER_CLASS**), kỹ thuật lưu trữ **Native JSONB** trên Hibernate 6 (Spring Boot 3.x), và cơ chế Xóa mềm chuẩn mực với **<code>@SQLRestriction</code>** và **<code>@SQLDelete</code>**.

---

## 1. Bản chất Kiến trúc & Cơ chế Tầng Mạng (Under the Hood)

### 1.1 So sánh 3 Chiến lược Ánh xạ Kế thừa (Inheritance Mapping Strategies)

JPA cung cấp annotation <code>@Inheritance(strategy = ...)</code> để ánh xạ cây phả hệ Hướng đối tượng vào Cơ sở dữ liệu Quan hệ:

| Tiêu chí | 1. SINGLE_TABLE *(Mặc định)* | 2. JOINED *(Chuẩn Chuẩn hóa)* | 3. TABLE_PER_CLASS *(Bảng Độc lập)* |
| :--- | :--- | :--- | :--- |
| **Cấu trúc Bảng trong RDBMS** | **Chỉ có 1 bảng duy nhất** chứa toàn bộ các cột của lớp cha và tất cả các lớp con | **1 bảng cha** (chứa cột chung) + **N bảng con** (chỉ chứa cột riêng của con), dùng chung Khóa chính | **Mỗi lớp con cụ thể có 1 bảng riêng biệt** chứa toàn bộ cột cha + con |
| **Cột Phân biệt (Discriminator)** | **BẮT BUỘC** (cột <code>DTYPE</code> hoặc <code>payment_type</code>) | Tùy chọn (Hibernate tự JOIN để biết loại) | Không dùng |
| **Ràng buộc NOT NULL** | **KHÔNG THỂ ĐẶT NOT NULL** trên các cột riêng của con (phải chấp nhận NULL) | **ĐẶT NOT NULL CHẶT CHẼ** trên mọi bảng | **ĐẶT NOT NULL ĐẦY ĐỦ** trên từng bảng |
| **Hiệu năng Truy vấn Cụ thể** | Cực nhanh (1 bảng, không JOIN) | Nhanh (JOIN bảng cha với 1 bảng con) | Cực nhanh (chỉ quét đúng 1 bảng con) |
| **Hiệu năng Truy vấn Đa hình**<br>*(SELECT p FROM Payment p)* | **NHANH NHẤT** (Quét 1 bảng duy nhất) | Trung bình (Bắt buộc dùng <code>LEFT JOIN</code> sang tất cả các bảng con) | **CHẬM NHẤT** (Bắt buộc dùng <code>UNION ALL</code> trên toàn bộ các bảng) |
| **Trường hợp Sử dụng Tối ưu** | Các lớp con có ít trường riêng, hệ thống đọc dữ liệu cực lớn | **Mô hình tài chính chuẩn hóa nghiêm ngặt, audit chặt chẽ** | Rất hiếm khi dùng trên Production |

~~~text
+-----------------------------------------------------------------------------------+
|                        So sánh Cấu trúc Bảng trong RDBMS                          |
+-----------------------------------------------------------------------------------+

[ 1. SINGLE_TABLE ]
Table: payments
| id | amount | payment_type | card_token | bank_code | crypto_tx_hash |
|----+--------+--------------+------------+-----------+----------------|
| 1  | 100.0  | CREDIT_CARD  | TOK_9999   | NULL      | NULL           |
| 2  | 500.0  | BANK_TRANS   | NULL       | VCB       | NULL           |

[ 2. JOINED ]
Table: payments (Cột chung)
| id | amount | status |

Table: cc_payments            Table: bank_payments          Table: crypto_payments
| id | card_token |          | id | bank_code |            | id | tx_hash |
(id vừa là PK vừa là FK trỏ về payments.id)
~~~

### 1.2 Value Objects: @Embeddable vs @ElementCollection
- **Value Object (@Embeddable / @Embedded)**: Là một nhóm thuộc tính không có định danh độc lập (không có ID riêng), vòng đời gắn chặt hoàn toàn vào Entity sở hữu.
- **@ElementCollection**: Dùng để lưu trữ một tập hợp (List, Set) các kiểu dữ liệu cơ bản (String, Integer) hoặc <code>@Embeddable</code>.
- **Cảnh báo Hiệu năng chết người**: Khi bạn thay đổi một phần tử trong <code>@ElementCollection</code> dạng <code>List</code>, Hibernate có thể **XÓA TOÀN BỘ CÁC DÒNG CŨ** bằng câu <code>DELETE FROM member_phones WHERE member_id = ?</code> và sau đó chèn lại từ đầu! Luôn ưu tiên dùng <code>Set</code> hoặc chuyển hẳn sang <code>@OneToMany</code> Entity nếu dữ liệu có tính biến động cao.

### 1.3 Đột phá của Hibernate 6: @JdbcTypeCode(SqlTypes.JSON) & @SQLRestriction
Trong Spring Boot 3.x (Hibernate 6+):
1. **Quản lý JSON/JSONB Native**: Không cần cài thêm thư viện bên ngoài <code>hibernate-types</code> (vladmihalcea). Chỉ cần sử dụng annotation chuẩn Hibernate 6:
   ~~~java
   @JdbcTypeCode(SqlTypes.JSON)
   @Column(columnDefinition = "jsonb")
   private Map<String, Object> metadata;
   ~~~
   PostgreSQL sẽ tự động lưu trữ dưới dạng nhị phân <code>jsonb</code>, hỗ trợ đánh chỉ mục GIN Index và cho phép tìm kiếm sâu vào các thuộc tính JSON với toán tử <code>->></code>.
2. **Cơ chế Xóa mềm Hiện đại**:
   - Annotation cũ <code>@Where(clause = "deleted = false")</code> đã chính thức bị **Deprecate** (khai tử) trong Hibernate 6.3+.
   - Thay thế bằng: **<code>@SQLRestriction("deleted_at IS NULL")</code>** cho phép lọc tự động ở tầng thực thể, kết hợp cùng **<code>@SQLDelete(sql = "UPDATE ... SET deleted_at = NOW() WHERE id = ? AND version = ?")</code>**.

---

## 2. Triển khai Mã nguồn Thực chiến (Production-Grade Code)

### 2.1 Cây Phả hệ Thanh toán Đa hình: JOINED Inheritance

#### Lớp Cha Trừu tượng: PaymentEntity
~~~java
package vn.mastery.advancedmapping.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_payments_status", columnList = "status"),
    @Index(name = "idx_payments_created", columnList = "created_at")
})
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "payment_method", discriminatorType = DiscriminatorType.STRING, length = 30)
// HIBERNATE 6.3+ SOFT DELETE CHUẨN:
@SQLDelete(sql = "UPDATE payments SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
public abstract class PaymentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "payment_seq_gen")
    @SequenceGenerator(name = "payment_seq_gen", sequenceName = "payment_id_seq", allocationSize = 50)
    private Long id;

    @Column(name = "payment_reference", nullable = false, unique = true, length = 36)
    private String paymentReference;

    @Column(name = "amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "deleted_at")
    private Instant deletedAt; // Cột cờ xóa mềm

    // HIBERNATE 6 NATIVE JSONB MAPPING: Lưu trữ thông tin thẩm định rủi ro linh hoạt
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "risk_metadata", columnDefinition = "jsonb")
    private Map<String, Object> riskMetadata = new HashMap<>();

    protected PaymentEntity() {}

    public PaymentEntity(String paymentReference, BigDecimal amount, String currency) {
        this.paymentReference = paymentReference;
        this.amount = amount;
        this.currency = currency;
        this.status = PaymentStatus.PENDING;
    }

    public void addRiskAttribute(String key, Object value) {
        this.riskMetadata.put(key, value);
    }

    // Getters
    public Long getId() { return id; }
    public String getPaymentReference() { return paymentReference; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
    public PaymentStatus getStatus() { return status; }
    public Map<String, Object> getRiskMetadata() { return riskMetadata; }
    public Instant getDeletedAt() { return deletedAt; }
}
~~~

#### Lớp Con 1: CreditCardPaymentEntity
~~~java
package vn.mastery.advancedmapping.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "credit_card_payments")
@DiscriminatorValue("CREDIT_CARD")
@PrimaryKeyJoinColumn(name = "payment_id") // Khóa chính đồng thời là Khóa ngoại trỏ về payments(id)
public class CreditCardPaymentEntity extends PaymentEntity {

    @Column(name = "card_token", nullable = false, length = 64)
    private String cardToken;

    @Column(name = "masked_pan", nullable = false, length = 20)
    private String maskedPan;

    @Column(name = "auth_code", length = 30)
    private String authorizationCode;

    @Column(name = "cvv_verified", nullable = false)
    private boolean cvvVerified;

    protected CreditCardPaymentEntity() {}

    public CreditCardPaymentEntity(String reference, java.math.BigDecimal amount, String currency,
                                   String cardToken, String maskedPan, boolean cvvVerified) {
        super(reference, amount, currency);
        this.cardToken = cardToken;
        this.maskedPan = maskedPan;
        this.cvvVerified = cvvVerified;
    }

    public String getCardToken() { return cardToken; }
    public String getMaskedPan() { return maskedPan; }
    public String getAuthorizationCode() { return authorizationCode; }
    public void setAuthorizationCode(String authCode) { this.authorizationCode = authCode; }
}
~~~

#### Lớp Con 2: CryptoPaymentEntity
~~~java
package vn.mastery.advancedmapping.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "crypto_payments")
@DiscriminatorValue("CRYPTO")
@PrimaryKeyJoinColumn(name = "payment_id")
public class CryptoPaymentEntity extends PaymentEntity {

    @Column(name = "wallet_address", nullable = false, length = 64)
    private String walletAddress;

    @Column(name = "tx_hash", length = 66)
    private String transactionHash;

    @Column(name = "blockchain_network", nullable = false, length = 30)
    private String blockchainNetwork; // Ví dụ: ETHEREUM, SOLANA, BITCOIN

    protected CryptoPaymentEntity() {}

    public CryptoPaymentEntity(String reference, java.math.BigDecimal amount, String currency,
                               String walletAddress, String blockchainNetwork) {
        super(reference, amount, currency);
        this.walletAddress = walletAddress;
        this.blockchainNetwork = blockchainNetwork;
    }

    public String getWalletAddress() { return walletAddress; }
    public String getTransactionHash() { return transactionHash; }
    public void setTransactionHash(String txHash) { this.transactionHash = txHash; }
}
~~~

### 2.2 Custom AttributeConverter: Mã hóa Dữ liệu Nhạy cảm Tầng Database
Sử dụng <code>AttributeConverter</code> để tự động mã hóa chuỗi số định danh công dân (CCCD) hoặc số tài khoản trước khi ghi xuống cột DB và giải mã tự động khi nạp lên Java:

~~~java
package vn.mastery.advancedmapping.converter;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Converter(autoApply = false)
public class SensitiveDataCryptoConverter implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES";
    // Trong thực tế, secret key phải được nạp an toàn từ HashiCorp Vault hoặc AWS Secrets Manager
    private static final byte[] KEY_BYTES = "MySuperSecretKey1234567890123456".getBytes(StandardCharsets.UTF_8);

    @Override
    public String convertToDatabaseColumn(String plainText) {
        if (plainText == null || plainText.isBlank()) {
            return null;
        }
        try {
            SecretKeySpec keySpec = new SecretKeySpec(KEY_BYTES, ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec);
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception ex) {
            throw new IllegalStateException("Lỗi mã hóa dữ liệu nhạy cảm trước khi lưu DB", ex);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbEncryptedData) {
        if (dbEncryptedData == null || dbEncryptedData.isBlank()) {
            return null;
        }
        try {
            SecretKeySpec keySpec = new SecretKeySpec(KEY_BYTES, ALGORITHM);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, keySpec);
            byte[] decoded = Base64.getDecoder().decode(dbEncryptedData);
            return new String(cipher.doFinal(decoded), StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new IllegalStateException("Lỗi giải mã dữ liệu nhạy cảm từ DB", ex);
        }
    }
}
~~~

Áp dụng Converter trên Entity:
~~~java
@Convert(converter = SensitiveDataCryptoConverter.class)
@Column(name = "citizen_id_encrypted", length = 255)
private String nationalCitizenId;
~~~

### 2.3 Repository Truy vấn Đa hình & Tìm kiếm trên Cột JSONB
Spring Data JPA hỗ trợ truy vấn đa hình tự nhiên trên lớp cha trừu tượng:

~~~java
package vn.mastery.advancedmapping.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.mastery.advancedmapping.domain.PaymentEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<PaymentEntity, Long> {

    // 1. TRUY VẤN ĐA HÌNH (Polymorphic Query):
    // Tự động trả về danh sách gồm cả CreditCardPaymentEntity và CryptoPaymentEntity
    // Tự động áp dụng bộ lọc @SQLRestriction("deleted_at IS NULL")
    Optional<PaymentEntity> findByPaymentReference(String paymentReference);

    // 2. Tìm kiếm các giao dịch có độ rủi ro cao dựa trên thuộc tính bên trong JSONB (PostgreSQL)
    @Query(value = """
        SELECT * FROM payments p 
        WHERE p.deleted_at IS NULL 
          AND (p.risk_metadata->>'risk_score')::numeric >= :minScore
    """, nativeQuery = true)
    List<PaymentEntity> findHighRiskPaymentsNative(@Param("minScore") double minScore);

    // 3. Native Query dành riêng cho Kiểm toán viên: Xem được cả các bản ghi ĐÃ BỊ XÓA MỀM
    @Query(value = "SELECT * FROM payments WHERE deleted_at IS NOT NULL", nativeQuery = true)
    List<PaymentEntity> findAllSoftDeletedAuditRecords();
}
~~~

---

## 3. Thử nghiệm, Xác thực & Phân tích Câu lệnh SQL (Verification & SQL Inspection)

### 3.1 Kiểm chứng Câu lệnh SQL Đa hình (Polymorphic Join SQL)
Khi bạn thực thi:
~~~java
paymentRepository.findById(1001L);
~~~
Hibernate tự động phát sinh câu lệnh SQL <code>LEFT OUTER JOIN</code> sang toàn bộ các bảng con:
~~~sql
SELECT 
    p.id, p.amount, p.currency, p.status, p.payment_method, p.risk_metadata,
    cc.card_token, cc.masked_pan, cc.auth_code,
    cr.wallet_address, cr.tx_hash, cr.blockchain_network
FROM payments p
LEFT OUTER JOIN credit_card_payments cc ON p.id = cc.payment_id
LEFT OUTER JOIN crypto_payments cr ON p.id = cr.payment_id
WHERE p.id = ? AND p.deleted_at IS NULL;
~~~
- Nếu dòng đó có <code>payment_method = 'CREDIT_CARD'</code>, các trường của <code>crypto_payments</code> là <code>NULL</code> và Hibernate tự động instantiate đối tượng <code>CreditCardPaymentEntity</code>.
- Bộ lọc <code>p.deleted_at IS NULL</code> tự động được đính kèm vào mọi câu lệnh <code>SELECT</code>, bảo đảm không bao giờ để lọt dữ liệu đã xóa mềm ra ngoài!

### 3.2 Kiểm chứng Hành vi Xóa mềm với @SQLDelete
Viết bài kiểm thử khẳng định lệnh xóa trong Spring Data JPA không hề làm mất dòng dữ liệu:

~~~java
package vn.mastery.advancedmapping.test;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.jdbc.core.JdbcTemplate;
import vn.mastery.advancedmapping.domain.CreditCardPaymentEntity;
import vn.mastery.advancedmapping.domain.PaymentEntity;
import vn.mastery.advancedmapping.repository.PaymentRepository;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class SoftDeleteAndPolymorphicIntegrationTest {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("Kiểm chứng: Gọi repository.delete() sẽ chuyển thành UPDATE deleted_at thay vì DELETE vật lý")
    void shouldSoftDeleteEntityCorrectly() {
        // 1. Tạo và lưu một giao dịch thẻ tín dụng
        CreditCardPaymentEntity payment = new CreditCardPaymentEntity(
                "REF-998877",
                BigDecimal.valueOf(250_000),
                "VND",
                "TOKEN-ABC-XYZ",
                "**** **** **** 1234",
                true
        );
        payment.addRiskAttribute("risk_score", 15);
        entityManager.persistAndFlush(payment);
        Long paymentId = payment.getId();
        entityManager.clear();

        // 2. Thực hiện xóa qua Spring Data Repository
        paymentRepository.deleteById(paymentId);
        entityManager.flush();
        entityManager.clear();

        // 3. Khẳng định: Tìm kiếm thông thường qua JPA sẽ KHÔNG THẤY (đã bị lọc bởi @SQLRestriction)
        Optional<PaymentEntity> queryResult = paymentRepository.findById(paymentId);
        assertThat(queryResult).isEmpty();

        // 4. Khẳng định: Dữ liệu VẪN TỒN TẠI dưới tầng Database vật lý (Khẳng định qua JdbcTemplate)
        Integer rowCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM payments WHERE id = ? AND deleted_at IS NOT NULL", 
                Integer.class, 
                paymentId
        );
        assertThat(rowCount).isEqualTo(1);
    }
}
~~~

---

## 4. Cạm bẫy Triển khai & Khắc phục Sự cố (Production Pitfalls)

### Cạm bẫy 1: Xóa mềm Xung đột Ràng buộc Toàn vẹn Duy nhất (Unique Constraint Conflict)
Đây là lỗi kinh điển khiến các hệ thống sử dụng Soft Delete bị tê liệt:
Giả sử bảng <code>users</code> có cột <code>email</code> với ràng buộc <code>UNIQUE</code>:
1. Người dùng A đăng ký tài khoản <code>alice@mastery.vn</code>.
2. Sau đó A nhấn "Xóa tài khoản" -> Hệ thống đánh dấu xóa mềm <code>deleted_at = NOW()</code>. Dòng dữ liệu vẫn nằm trong Database!
3. Ngày hôm sau, A quay lại và muốn đăng ký lại tài khoản với cùng email <code>alice@mastery.vn</code>.
4. Câu lệnh <code>INSERT</code> lập tức nổ tung với lỗi:
   ~~~text
   org.postgresql.util.PSQLException: ERROR: duplicate key value violates unique constraint "uq_users_email"
   ~~~

**Biện pháp khắc phục Chuẩn Kỹ sư Cấp cao**:
Tuyệt đối không dùng ràng buộc <code>UNIQUE</code> toàn cục trên toàn bảng. Hãy tạo **Partial Unique Index (Chỉ mục duy nhất có điều kiện)** trong PostgreSQL:
~~~sql
-- Xóa unique constraint cũ:
ALTER TABLE users DROP CONSTRAINT uq_users_email;

-- Tạo Partial Unique Index: Chỉ bắt buộc duy nhất đối với các bản ghi CHƯA BỊ XÓA!
CREATE UNIQUE INDEX uq_users_active_email ON users(email) WHERE deleted_at IS NULL;
~~~
Nhờ giải pháp này, một email có thể xuất hiện 10 lần ở các tài khoản đã bị xóa trong quá khứ, nhưng chỉ được phép tồn tại duy nhất 1 lần ở trạng thái hoạt động!

### Cạm bẫy 2: Thảm họa Phân trang trên TABLE_PER_CLASS
Nếu bạn chọn chiến lược <code>InheritanceType.TABLE_PER_CLASS</code> với 5 lớp con, khi gọi <code>paymentRepository.findAll(pageable)</code>:
Hibernate buộc phải sinh ra một câu lệnh khổng lồ:
~~~sql
SELECT * FROM (
    SELECT id, amount, ... FROM credit_card_payments
    UNION ALL
    SELECT id, amount, ... FROM crypto_payments
    UNION ALL
    SELECT id, amount, ... FROM bank_payments
) AS combined_payments
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
~~~
Database phải quét toàn bộ 5 bảng, đưa dữ liệu vào bộ nhớ đệm tạm của RDBMS để thực hiện <code>UNION ALL</code> rồi mới tiến hành sắp xếp và phân trang. Mọi Index trên từng bảng đều bị vô hiệu hóa, dẫn đến truy vấn chậm kinh hoàng khi số lượng dữ liệu lớn!
**Biện pháp**: Luôn ưu tiên chiến lược **<code>JOINED</code>** hoặc **<code>SINGLE_TABLE</code>**.

### Cạm bẫy 3: Quên Thêm Điều Kiện deleted_at IS NULL trong các Câu Lệnh Native Query
Annotation <code>@SQLRestriction</code> **CHỈ ÁP DỤNG CHO CÁC TRUY VẤN JPQL / HQL**.
Nếu bạn viết câu lệnh SQL thuần (<code>nativeQuery = true</code>):
~~~java
// ❌ CỰC KỲ NGUY HIỂM:
@Query(value = "SELECT * FROM payments WHERE amount > 1000000", nativeQuery = true)
List<PaymentEntity> findLargePayments();
~~~
Hibernate sẽ bắn nguyên văn chuỗi SQL này xuống Database mà **hoàn toàn không đính kèm điều kiện <code>deleted_at IS NULL</code>**! Kết quả là hệ thống sẽ lôi cả các đơn hàng đã bị khách hàng xóa vào báo cáo!
**Quy tắc**: Trong các câu <code>nativeQuery</code>, lập trình viên bắt buộc phải tự thêm điều kiện <code>WHERE deleted_at IS NULL</code> bằng tay.

---

## 5. Thử thách Thực chiến (Hands-on Challenge)

### Đề bài:
Xây dựng Subsystem Quản lý Vận đơn Logistics Đa phương thức (Multimodal Logistics Shipment Engine):
1. Thiết kế Cây kế thừa <code>ShipmentEntity</code> với chiến lược <code>InheritanceType.JOINED</code>:
   - Các trường chung: <code>trackingNumber</code> (duy nhất), <code>originHub</code>, <code>destinationHub</code>, <code>declaredWeightKg</code>, <code>status</code>.
   - Lớp con 1 <code>AirFreightShipmentEntity</code>: có trường <code>flightNumber</code>, <code>iataAirportCode</code>, <code>temperatureControlled</code> (boolean).
   - Lớp con 2 <code>OceanFreightShipmentEntity</code>: có trường <code>containerNumber</code>, <code>vesselImoCode</code>, <code>billOfLadingNumber</code>.
2. Tích hợp Hibernate 6 Native JSONB cho trường <code>customsDeclarationPayload</code> lưu thông tin tờ khai hải quan.
3. Kích hoạt cơ chế Soft Delete chuẩn Hibernate 6.3+ và thiết lập Partial Unique Index cho <code>trackingNumber</code>.

### Lời giải Chuẩn Kỹ sư Cấp cao:

~~~java
package vn.mastery.logistics.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;

public enum ShipmentStatus { REGISTERED, IN_TRANSIT, CUSTOMS_HOLD, DELIVERED }

@Entity
@Table(name = "shipments", indexes = {
    @Index(name = "idx_shipment_status", columnList = "status"),
    @Index(name = "idx_shipment_tracking", columnList = "tracking_number")
})
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "transport_mode", length = 20)
@SQLDelete(sql = "UPDATE shipments SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
public abstract class ShipmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tracking_number", nullable = false, length = 32)
    private String trackingNumber;

    @Column(name = "origin_hub", nullable = false, length = 50)
    private String originHub;

    @Column(name = "destination_hub", nullable = false, length = 50)
    private String destinationHub;

    @Column(name = "declared_weight_kg", nullable = false)
    private double declaredWeightKg;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ShipmentStatus status = ShipmentStatus.REGISTERED;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "deleted_at")
    private Instant deletedAt;

    // JSONB LƯU TỜ KHAI HẢI QUAN
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "customs_declaration", columnDefinition = "jsonb")
    private Map<String, Object> customsDeclaration;

    protected ShipmentEntity() {}

    public ShipmentEntity(String trackingNumber, String originHub, String destinationHub, 
                          double weight, Map<String, Object> customsDeclaration) {
        this.trackingNumber = trackingNumber;
        this.originHub = originHub;
        this.destinationHub = destinationHub;
        this.declaredWeightKg = weight;
        this.customsDeclaration = customsDeclaration;
        this.status = ShipmentStatus.REGISTERED;
    }

    // Getters
    public Long getId() { return id; }
    public String getTrackingNumber() { return trackingNumber; }
    public String getOriginHub() { return originHub; }
    public String getDestinationHub() { return destinationHub; }
    public double getDeclaredWeightKg() { return declaredWeightKg; }
    public ShipmentStatus getStatus() { return status; }
    public Map<String, Object> getCustomsDeclaration() { return customsDeclaration; }
}
~~~

~~~java
package vn.mastery.logistics.domain;

import jakarta.persistence.*;
import java.util.Map;

@Entity
@Table(name = "air_shipments")
@DiscriminatorValue("AIR")
@PrimaryKeyJoinColumn(name = "shipment_id")
public class AirFreightShipmentEntity extends ShipmentEntity {

    @Column(name = "flight_number", nullable = false, length = 20)
    private String flightNumber;

    @Column(name = "iata_airport_code", nullable = false, length = 3)
    private String iataAirportCode;

    @Column(name = "temperature_controlled", nullable = false)
    private boolean temperatureControlled;

    protected AirFreightShipmentEntity() {}

    public AirFreightShipmentEntity(String trackingNumber, String originHub, String destinationHub,
                                   double weight, Map<String, Object> customs, String flightNumber,
                                   String airportCode, boolean tempControlled) {
        super(trackingNumber, originHub, destinationHub, weight, customs);
        this.flightNumber = flightNumber;
        this.iataAirportCode = airportCode;
        this.temperatureControlled = tempControlled;
    }

    public String getFlightNumber() { return flightNumber; }
    public String getIataAirportCode() { return iataAirportCode; }
    public boolean isTemperatureControlled() { return temperatureControlled; }
}
~~~

~~~java
package vn.mastery.logistics.domain;

import jakarta.persistence.*;
import java.util.Map;

@Entity
@Table(name = "ocean_shipments")
@DiscriminatorValue("OCEAN")
@PrimaryKeyJoinColumn(name = "shipment_id")
public class OceanFreightShipmentEntity extends ShipmentEntity {

    @Column(name = "container_number", nullable = false, length = 30)
    private String containerNumber;

    @Column(name = "vessel_imo_code", nullable = false, length = 20)
    private String vesselImoCode;

    @Column(name = "bill_of_lading_no", nullable = false, length = 50)
    private String billOfLadingNumber;

    protected OceanFreightShipmentEntity() {}

    public OceanFreightShipmentEntity(String trackingNumber, String originHub, String destinationHub,
                                     double weight, Map<String, Object> customs, String containerNumber,
                                     String imoCode, String bolNumber) {
        super(trackingNumber, originHub, destinationHub, weight, customs);
        this.containerNumber = containerNumber;
        this.vesselImoCode = imoCode;
        this.billOfLadingNumber = bolNumber;
    }

    public String getContainerNumber() { return containerNumber; }
    public String getVesselImoCode() { return vesselImoCode; }
    public String getBillOfLadingNumber() { return billOfLadingNumber; }
}
~~~

#### Kịch bản Flyway Tạo Bảng & Partial Index
~~~sql
-- V3__logistics_multimodal_schema.sql
CREATE TABLE shipments (
    id                 BIGSERIAL PRIMARY KEY,
    transport_mode     VARCHAR(20) NOT NULL,
    tracking_number    VARCHAR(32) NOT NULL,
    origin_hub         VARCHAR(50) NOT NULL,
    destination_hub    VARCHAR(50) NOT NULL,
    declared_weight_kg NUMERIC(10, 2) NOT NULL,
    status             VARCHAR(20) NOT NULL DEFAULT 'REGISTERED',
    version            BIGINT NOT NULL DEFAULT 0,
    created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at         TIMESTAMP WITH TIME ZONE,
    customs_declaration JSONB
);

-- PARTIAL UNIQUE INDEX CHUẨN: Chỉ yêu cầu duy nhất mã tracking cho các kiện hàng chưa bị xóa
CREATE UNIQUE INDEX uq_active_tracking_no ON shipments(tracking_number) WHERE deleted_at IS NULL;

-- Bảng con Air
CREATE TABLE air_shipments (
    shipment_id            BIGINT PRIMARY KEY REFERENCES shipments(id) ON DELETE CASCADE,
    flight_number          VARCHAR(20) NOT NULL,
    iata_airport_code      VARCHAR(3) NOT NULL,
    temperature_controlled BOOLEAN NOT NULL DEFAULT false
);

-- Bảng con Ocean
CREATE TABLE ocean_shipments (
    shipment_id        BIGINT PRIMARY KEY REFERENCES shipments(id) ON DELETE CASCADE,
    container_number   VARCHAR(30) NOT NULL,
    vessel_imo_code    VARCHAR(20) NOT NULL,
    bill_of_lading_no  VARCHAR(50) NOT NULL
);
~~~

:::takeaways
- **Chiến lược Kế thừa JOINED**: Là sự lựa chọn chuẩn mực nhất cho các mô hình dữ liệu doanh nghiệp cần tính toàn vẹn (Normalized Schema) và kiểm soát <code>NOT NULL</code> nghiêm ngặt trên từng bảng con.
- **Hibernate 6 JSONB Native**: Sử dụng <code>@JdbcTypeCode(SqlTypes.JSON)</code> giúp loại bỏ hoàn toàn boilerplate code chuyển đổi JSON, tận dụng tối đa sức mạnh lập chỉ mục GIN của PostgreSQL.
- **Tiêu chuẩn Xóa mềm Mới**: Thay thế <code>@Where</code> cũ bằng <code>@SQLRestriction("deleted_at IS NULL")</code> và <code>@SQLDelete</code> có tích hợp cột khóa lạc quan <code>@Version</code>.
- **Giải quyết Xung đột Unique Constraint**: Luôn sử dụng **Partial Unique Index** (<code>WHERE deleted_at IS NULL</code>) trên Database để tránh việc dữ liệu đã xóa mềm chặn người dùng đăng ký lại cùng một giá trị định danh.
- **AttributeConverter cho An toàn Bảo mật**: Dùng <code>AttributeConverter</code> để mã hóa và giải mã dữ liệu nhạy cảm (CCCD, Số tài khoản, Khóa bí mật) trong suốt giữa tầng ứng dụng và cơ sở dữ liệu.
:::
`
    },
    {
      id: "3-6",
      type: "lesson",
      title: "Batch Operations & High-Volume Processing: JDBC Batching, StatelessSession, Cursor Streaming & HikariCP Tuning",
      minutes: 55,
      content: `
## saveAll() trên 1 Triệu Bản ghi: Con Đường Nhanh Nhất Dẫn Đến OutOfMemoryError

Khi phát triển tính năng Import danh sách giao dịch hoặc quyết toán lãi suất cuối ngày (End-of-Day Settlement), một lập trình viên thường viết đoạn mã sau:
~~~java
// ❌ THẢM HỌA LÀM SẬP POD JVM NGAY LẬP TỨC:
List<TransactionRecordEntity> records = parseCsvFile(inputStream); // 1,000,000 objects trên Heap
transactionRepository.saveAll(records);
~~~

Đoạn code trên sẽ ngay lập tức hủy diệt máy chủ vì 3 nguyên nhân:
1. **Nổ tung First-Level Cache (Persistence Context Explosion)**: Khi gọi <code>saveAll()</code>, Hibernate nạp toàn bộ 1,000,000 Entity vào bộ đệm L1 Cache. Mỗi Entity đi kèm một bản sao Snapshot nguyên trạng để phục vụ Dirty Checking.
   $$1,000,000 \text{ entities} + 1,000,000 \text{ snapshots} \approx 1.8\text{GB đến } 2.5\text{GB RAM}!$$
2. **Full GC Freeze (Hiện tượng Đông Cứng Máy Chủ)**: Garbage Collector của JVM liên tục kích hoạt Full GC "Stop-The-World" trong tuyệt vọng để dọn dẹp Old Generation. Toàn bộ các request HTTP khác của khách hàng đều bị treo cứng 10-15 giây.
3. **Thực thi Đơn lẻ (Zero Batching)**: Nếu Entity sử dụng <code>GenerationType.IDENTITY</code>, Hibernate sẽ bắn **1 triệu câu lệnh INSERT tuần tự**, tiêu tốn hàng giờ đồng hồ giao tiếp mạng.

Bài học này sẽ hướng dẫn kỹ thuật **Batch Processing cấp độ Enterprise**: Tối ưu hóa JDBC Batching, sử dụng **<code>StatelessSession</code>** (tính năng cực mạnh của Hibernate 6), kỹ thuật **Server-Side Cursor Streaming**, và phương pháp cấu hình **HikariCP Connection Pool** chuẩn xác dưới tải hàng triệu bản ghi.

---

## 1. Bản chất Kiến trúc & Cơ chế Tầng Mạng (Under the Hood)

### 1.1 Cơ chế Tầng Mạng của JDBC Batching
Trong giao thức TCP chuẩn giữa ứng dụng Java và cơ sở dữ liệu (PostgreSQL/MySQL):
- **Không có Batching**: Mỗi câu lệnh <code>INSERT</code> yêu cầu 1 gói tin TCP gửi đi (Client -> DB) và 1 gói tin TCP phản hồi (DB -> Client). 10,000 bản ghi = 10,000 Network Round-trips.
- **Có JDBC Batching**: Trình điều khiển JDBC gom 50 câu lệnh SQL và danh sách tham số tương ứng vào một khung nhị phân duy nhất (Socket Buffer) và gửi đi trong **1 lượt Round-trip duy nhất**:

~~~text
+-----------------------------------------------------------------------------------+
|                        Cơ chế Hoạt động của JDBC Batching                         |
+-----------------------------------------------------------------------------------+

[ 1. Ghi tuần tự từng dòng (Không Batch) ]
App ---> [INSERT Row 1] ---> DB (Disk write) ---> [OK] ---> App (RTT: 2ms)
App ---> [INSERT Row 2] ---> DB (Disk write) ---> [OK] ---> App (RTT: 2ms)
... lặp lại 1,000 lần = 2,000ms

[ 2. Ghi theo Lô (JDBC Batch size = 50) ]
App gom: ps.addBatch(row1); ps.addBatch(row2); ... ps.addBatch(row50);
App ---> [ MỘT GÓI TCP CHỨA 50 INSERTS ] ---> DB (Batch disk write) ---> [OK 50 rows] ---> App
... chỉ tốn 20 lượt Round-trip = 40ms (Nhanh gấp 50 lần!)
~~~

### 1.2 Điều kiện Tiên quyết để Kích hoạt JDBC Batching trong Hibernate
Rất nhiều lập trình viên khai báo <code>hibernate.jdbc.batch_size: 50</code> nhưng khi đo đếm thực tế thì Hibernate **vẫn bắn từng câu lệnh riêng lẻ**! Đó là vì họ thiếu 2 điều kiện bắt buộc:
1. **Chiến lược sinh khóa chính**: BẮT BUỘC là <code>GenerationType.SEQUENCE</code> hoặc <code>UUID</code>. Tuyệt đối không dùng <code>IDENTITY</code> (vì DB bắt buộc phải thực thi INSERT ngay lập tức để lấy generated ID).
2. **Sắp xếp thứ tự chèn (Order Inserts / Updates)**:
   ~~~yaml
   spring.jpa.properties.hibernate.order_inserts: true
   spring.jpa.properties.hibernate.order_updates: true
   ~~~
   **Tại sao cần sắp xếp?** Trình điều khiển JDBC chỉ có thể batch các câu lệnh liên tiếp nhau **trên cùng một bảng**. Nếu trong bộ nhớ xuất hiện xen kẽ: <code>Insert Order 1</code> -> <code>Insert Item 1</code> -> <code>Insert Order 2</code> -> <code>Insert Item 2</code>, Hibernate sẽ buộc phải ngắt đứt (Flush) bộ đệm Batch liên tục, khiến kích thước batch thực tế bị tụt về 1!

### 1.3 Vũ khí Tối thượng của Hibernate 6: StatelessSession
Khi xử lý hàng trăm ngàn dòng dữ liệu (ETL, Data Migration, Import CSV):
- Bạn **hoàn toàn không cần** First-Level Cache (không cần lưu Snapshot).
- Bạn **hoàn toàn không cần** Dirty Checking tự động.
- Bạn **hoàn toàn không cần** Hibernate Interceptors hay Cascading phức tạp.

Hibernate cung cấp giao diện **<code>StatelessSession</code>**:
- Nó là một lớp trừu tượng siêu mỏng bọc quanh JDBC Connection.
- **Bộ nhớ RAM tiêu thụ = 0**: Không lưu giữ bất kỳ Entity nào sau khi gọi lệnh <code>insert()</code> hoặc <code>update()</code>.
- Tốc độ thực thi ngang ngửa với JDBC thuần nhưng vẫn giữ được tính an toàn kiểu dữ liệu (Type-Safety) của Java Entity!

---

## 2. Triển khai Mã nguồn Thực chiến (Production-Grade Code)

### 2.1 Cấu hình application.yml Tối ưu Batching & HikariCP
~~~yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/core_banking_db?reWriteBatchedInserts=true
    username: banking_app
    password: secret_password
    hikari:
      pool-name: HighVolumeBatchPool
      # CÔNG THỨC VÀNG TÍNH CONNECTION POOL: (CPU Cores * 2) + Spindle Count
      # Với server 8 Cores: pool-size tối ưu là (8 * 2) + 1 = 17 to 20 kết nối
      maximum-pool-size: 20
      minimum-idle: 10
      idle-timeout: 300000
      max-lifetime: 1800000
      connection-timeout: 30000
      # Cảnh báo rò rỉ kết nối nếu 1 thread giữ kết nối quá 60 giây
      leak-detection-threshold: 60000

  jpa:
    open-in-view: false
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        # Kích thước Lô JDBC
        jdbc:
          batch_size: 50
          fetch_size: 500
        # Sắp xếp câu lệnh tránh phân mảnh bộ đệm batch
        order_inserts: true
        order_updates: true
        # Tắt tự động tính toán batch versioned data để tối ưu hiệu năng
        jdbc.batch_versioned_data: true
~~~

*Lưu ý*: Với PostgreSQL JDBC Driver, tham số <code>reWriteBatchedInserts=true</code> trên chuỗi kết nối URL sẽ gộp nhiều câu <code>INSERT INTO t VALUES (1), (2), (3)...</code> thành một câu SQL đa giá trị duy nhất, tăng tốc độ ghi thêm 300%!

### 2.2 Triển khai 3 Phương pháp Ghi Hàng loạt (Batch Ingestion)

#### Phương pháp 1: Chunked Batching với EntityManager chuẩn (Flush & Clear)
Áp dụng khi bạn vẫn muốn tận dụng các Entity Listener và Auditing:

~~~java
package vn.mastery.batch.service;

import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.batch.domain.TransactionRecordEntity;

import java.util.List;

@Service
public class StandardJpaBatchService {

    private static final Logger log = LoggerFactory.getLogger(StandardJpaBatchService.class);
    private static final int BATCH_SIZE = 50;

    private final EntityManager entityManager;

    public StandardJpaBatchService(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Transactional
    public void insertBatchWithFlushAndClear(List<TransactionRecordEntity> records) {
        long startTime = System.currentTimeMillis();
        log.info("Bắt đầu ghi {} bản ghi bằng EntityManager Chunking...", records.size());

        for (int i = 0; i < records.size(); i++) {
            entityManager.persist(records.get(i));

            // CỨ MỖI 50 BẢN GHI: ÉP FLUSH VÀ CLEAR RAM
            if ((i + 1) % BATCH_SIZE == 0) {
                entityManager.flush(); // Phát lệnh INSERT theo batch 50 xuống JDBC
                entityManager.clear(); // XÓA SẠCH L1 CACHE: Giải phóng RAM ngay lập tức!
            }
        }

        // Flush nốt những bản ghi lẻ cuối cùng
        entityManager.flush();
        entityManager.clear();

        long duration = System.currentTimeMillis() - startTime;
        log.info("Hoàn tất ghi {} bản ghi. Tổng thời gian: {}ms", records.size(), duration);
    }
}
~~~

#### Phương pháp 2: Đỉnh cao Hiệu năng với Hibernate 6 StatelessSession
Khi cần tốc độ tối đa (nhập 500,000 - 1,000,000 dòng):

~~~java
package vn.mastery.batch.service;

import org.hibernate.SessionFactory;
import org.hibernate.StatelessSession;
import org.hibernate.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import vn.mastery.batch.domain.TransactionRecordEntity;

import java.util.List;

@Service
public class StatelessSessionBatchService {

    private static final Logger log = LoggerFactory.getLogger(StatelessSessionBatchService.class);
    private final SessionFactory sessionFactory;

    public StatelessSessionBatchService(SessionFactory sessionFactory) {
        this.sessionFactory = sessionFactory;
    }

    public void highSpeedBulkInsert(List<TransactionRecordEntity> records) {
        long startTime = System.currentTimeMillis();
        log.info("Khởi động StatelessSession High-Speed Ingestion cho {} bản ghi...", records.size());

        // Mở một StatelessSession độc lập — Không First-Level Cache, Không Snapshot!
        try (StatelessSession session = sessionFactory.openStatelessSession()) {
            Transaction tx = session.beginTransaction();
            try {
                for (int i = 0; i < records.size(); i++) {
                    session.insert(records.get(i)); // Bắn trực tiếp qua JDBC Batch
                }
                tx.commit();
            } catch (Exception ex) {
                tx.rollback();
                log.error("Lỗi giao dịch trong StatelessSession", ex);
                throw ex;
            }
        }

        long duration = System.currentTimeMillis() - startTime;
        log.info("Hoàn tất StatelessSession Ingestion. Tổng thời gian: {}ms", duration);
    }
}
~~~

### 2.3 Đọc Dữ liệu Hàng triệu Dòng với Database Cursor Streaming
Khi cần xuất file Excel/CSV từ bảng chứa 1,000,000 giao dịch: Nếu gọi <code>findAll()</code>, toàn bộ dữ liệu sẽ nạp vào RAM gây OOM. Giải pháp là **Server-Side Cursor Streaming**:

~~~java
package vn.mastery.batch.repository;

import org.hibernate.jpa.AvailableHints;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.stereotype.Repository;
import vn.mastery.batch.domain.TransactionRecordEntity;

import jakarta.persistence.QueryHint;
import java.util.stream.Stream;

@Repository
public interface TransactionStreamingRepository extends JpaRepository<TransactionRecordEntity, Long> {

    // Record Projection cực nhẹ
    record StatementExportRow(String transactionRef, String accountNumber, 
                              java.math.BigDecimal amount, java.time.Instant createdAt) {}

    // BẮT BUỘC: Thiết lập HINT_FETCH_SIZE để kích hoạt Server-Side Cursor của PostgreSQL
    @QueryHints(value = {
        @QueryHint(name = AvailableHints.HINT_FETCH_SIZE, value = "500"),
        @QueryHint(name = AvailableHints.HINT_CACHEABLE, value = "false")
    })
    @Query("""
        SELECT new vn.mastery.batch.repository.TransactionStreamingRepository$StatementExportRow(
            t.reference, t.accountNumber, t.amount, t.createdAt
        )
        FROM TransactionRecordEntity t
        WHERE t.status = 'COMPLETED'
        ORDER BY t.createdAt ASC
    """)
    Stream<StatementExportRow> streamAllCompletedTransactions();
}
~~~

#### Service Tiêu thụ Stream An toàn (RAM luôn phẳng)
~~~java
package vn.mastery.batch.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.batch.repository.TransactionStreamingRepository;

import java.io.BufferedWriter;
import java.io.Writer;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Stream;

@Service
public class StatementExportService {

    private static final Logger log = LoggerFactory.getLogger(StatementExportService.class);
    private final TransactionStreamingRepository streamingRepository;

    public StatementExportService(TransactionStreamingRepository streamingRepository) {
        this.streamingRepository = streamingRepository;
    }

    // BẮT BUỘC: readOnly = true để Hibernate tắt cơ chế tạo Snapshot kiểm tra thay đổi
    @Transactional(readOnly = true)
    public void exportLargeStatementToCsv(Writer writer) throws Exception {
        BufferedWriter bufferedWriter = new BufferedWriter(writer, 32768); // Buffer 32KB
        bufferedWriter.write("Mã Giao Dịch,Số Tài Khoản,Số Tiền,Thời Gian\\n");

        AtomicLong counter = new AtomicLong(0);

        // BẮT BUỘC dùng try-with-resources để tự động đóng Database Cursor khi đọc xong
        try (Stream<TransactionStreamingRepository.StatementExportRow> stream = 
                     streamingRepository.streamAllCompletedTransactions()) {

            stream.forEach(row -> {
                try {
                    bufferedWriter.write(String.format("%s,%s,%s,%s\\n",
                            row.transactionRef(),
                            row.accountNumber(),
                            row.amount().toPlainString(),
                            row.createdAt().toString()));

                    if (counter.incrementAndGet() % 10_000 == 0) {
                        bufferedWriter.flush();
                        log.info("Đã xuất ra CSV: {} dòng dữ liệu (RAM ổn định)", counter.get());
                    }
                } catch (Exception ex) {
                    throw new RuntimeException("Lỗi ghi file CSV", ex);
                }
            });
        }

        bufferedWriter.flush();
        log.info("Xuất file hoàn tất thành công với tổng số {} dòng.", counter.get());
    }
}
~~~

---

## 3. Thử nghiệm, Xác thực & Benchmark Hiệu năng (Verification & Metrics)

### 3.1 Bảng So sánh Hiệu năng Thực tế: 50,000 Bản ghi

| Phương pháp | Thời gian Xử lý | Đỉnh Bộ nhớ Heap (RAM) | Tần suất Garbage Collection |
| :--- | :--- | :--- | :--- |
| **1. Naive <code>saveAll(list)</code>** | **18,500 ms** (18.5 giây) | **950 MB** | 12 lần Full GC Stop-the-world |
| **2. Chunking <code>flush() & clear()</code>** | **1,850 ms** (1.85 giây) | **65 MB** | 0 lần Full GC, chỉ Minor GC nhẹ |
| **3. Hibernate 6 <code>StatelessSession</code>**| **420 ms** (0.42 giây) | **22 MB** | Hầu như không cấp phát RAM |
| **4. JDBC Template Batch** | **380 ms** (0.38 giây) | **18 MB** | Hầu như không cấp phát RAM |

*Kết luận*: Chuyển đổi từ <code>saveAll()</code> sang <code>StatelessSession</code> mang lại sự bứt phá **gấp 44 lần về tốc độ** và **giảm 97% áp lực bộ nhớ RAM**!

### 3.2 Giám sát HikariCP Metrics trên Môi trường Production
Kích hoạt Actuator metrics để theo dõi sức khỏe kết nối trong <code>application.yml</code>:
~~~yaml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
~~~

Các chỉ số sống còn cần tạo cảnh báo (Alert) trên Grafana/Prometheus:
- <code>hikaricp.connections.active</code>: Số kết nối đang bận thực thi câu lệnh SQL. Nếu chạm mức <code>maximum-pool-size</code> (20/20) liên tục trong 1 phút -> Báo động cạn kiệt kết nối!
- <code>hikaricp.connections.pending</code>: Số luồng đang phải xếp hàng chờ xin kết nối. Giá trị này **bắt buộc phải bằng 0** trong điều kiện bình thường.
- <code>hikaricp.connections.timeout.total</code>: Tổng số request bị lỗi do chờ kết nối quá thời gian quy định (<code>connection-timeout</code>).

---

## 4. Cạm bẫy Triển khai & Khắc phục Sự cố (Production Pitfalls)

### Cạm bẫy 1: Quên Bật order_inserts và order_updates
Nếu bạn có Entity <code>Order</code> chứa danh sách <code>OrderItem</code>:
Khi gọi lưu: Hibernate sẽ đẩy vào bộ đệm: <code>Order 1</code>, <code>OrderItem 1a</code>, <code>OrderItem 1b</code>, <code>Order 2</code>, <code>OrderItem 2a</code>...
Vì hai bảng xen kẽ lẫn nhau, JDBC Driver buộc phải ngắt batch mỗi khi bảng thay đổi:
~~~text
Batch 1: 1 row (Order 1) -> Flush
Batch 2: 2 rows (Item 1a, 1b) -> Flush
Batch 3: 1 row (Order 2) -> Flush
~~~
Toàn bộ cấu hình <code>batch_size: 50</code> trở nên vô dụng!
**Biện pháp khắc phục**: Luôn luôn bật:
~~~yaml
spring.jpa.properties.hibernate.order_inserts: true
spring.jpa.properties.hibernate.order_updates: true
~~~
Hibernate sẽ tự động gom nhóm toàn bộ <code>Order</code> vào một đợt batch duy nhất, và gom toàn bộ <code>OrderItem</code> vào đợt batch tiếp theo.

### Cạm bẫy 2: OOM khi Streaming trong PostgreSQL vì Thiếu Server-Side Cursor
Khi bạn dùng Java <code>Stream<T></code> với PostgreSQL: Mặc định PostgreSQL JDBC Driver sẽ tải **TOÀN BỘ KẾT QUẢ VÀO BỘ NHỚ RAM CỦA CLIENT** trước khi trả về <code>Stream</code>!
Dẫn đến việc gọi <code>.stream()</code> trên bảng 5 triệu dòng vẫn bị sập OOM như thường.
**Quy tắc bắt buộc để kích hoạt Server-Side Cursor trên PostgreSQL**:
1. Transaction phải mở ở chế độ <code>readOnly = true</code> hoặc tắt Auto-commit.
2. Bắt buộc phải gắn Hint: <code>@QueryHint(name = AvailableHints.HINT_FETCH_SIZE, value = "500")</code>. Khi đó PostgreSQL mới mở Cursor trên máy chủ và chỉ truyền về 500 dòng mỗi đợt.

### Cạm bẫy 3: Nguy cơ Treo Giữ Kết nối HikariCP Quá Lâu (Connection Starvation)
Nếu một tác vụ Batch đọc và ghi 1,000,000 dòng chạy trong một Transaction duy nhất kéo dài 30 phút:
- 1 kết nối của HikariCP sẽ bị chiếm dụng suốt 30 phút.
- Nguy hiểm hơn: Nếu mạng bị chập chờn hoặc có lỗi giữa chừng, toàn bộ 30 phút công sức sẽ bị <code>ROLLBACK</code> sạch sẽ!
**Quy tắc chuẩn**: Chia nhỏ khối lượng công việc thành các **Chunk độc lập** (ví dụ: mỗi Chunk 1,000 bản ghi). Mỗi Chunk chạy trong một Transaction ngắn riêng biệt (<code>Propagation.REQUIRES_NEW</code>). Nếu lỗi ở bản ghi thứ 50,000, ta có thể lưu checkpoint và tiếp tục chạy từ bản ghi 50,001 mà không phải làm lại từ đầu.

---

## 5. Thử thách Thực chiến (Hands-on Challenge)

### Đề bài:
Xây dựng Batch Job Quyết toán Lãi suất Tiết kiệm Định kỳ Cuối tháng (Month-End Interest Settlement Engine):
1. Yêu cầu tải dữ liệu:
   - Hệ thống có 500,000 tài khoản tiết kiệm đang hoạt động (<code>status = 'ACTIVE'</code>).
   - Sử dụng **Server-Side Cursor Streaming** nạp tài khoản theo từng đợt 500 phần tử, đảm bảo RAM của JVM không vượt quá 100MB trong suốt quá trình xử lý.
2. Xử lý tính toán và ghi dữ liệu hàng loạt:
   - Tính lãi suất tháng cho từng tài khoản và tạo đối tượng <code>InterestPaymentRecordEntity</code>.
   - Sử dụng **Hibernate 6 StatelessSession** để ghi hàng loạt các bản ghi tiền lãi vào cơ sở dữ liệu với tốc độ cao.
   - Cứ mỗi 5,000 bản ghi xử lý thành công, thực hiện <code>commit</code> một Transaction ngắn để lưu checkpoint tiến độ.

### Lời giải Chuẩn Kỹ sư Cấp cao:

~~~java
package vn.mastery.settlement.job;

import org.hibernate.SessionFactory;
import org.hibernate.StatelessSession;
import org.hibernate.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.settlement.domain.InterestPaymentEntity;
import vn.mastery.settlement.repository.SavingAccountStreamingRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Stream;

@Service
public class MonthEndInterestSettlementJob {

    private static final Logger log = LoggerFactory.getLogger(MonthEndInterestSettlementJob.class);
    private static final int COMMIT_CHUNK_SIZE = 5000;

    private final SavingAccountStreamingRepository accountRepository;
    private final SessionFactory sessionFactory;

    public MonthEndInterestSettlementJob(SavingAccountStreamingRepository accountRepository, 
                                        SessionFactory sessionFactory) {
        this.accountRepository = accountRepository;
        this.sessionFactory = sessionFactory;
    }

    // BẮT BUỘC: readOnly = true để mở Server-Side Cursor an toàn trên PostgreSQL
    @Transactional(readOnly = true)
    public void executeMonthlyInterestSettlement(LocalDate settlementMonth) {
        long startTime = System.currentTimeMillis();
        log.info("BẮT ĐẦU JOB QUYẾT TOÁN LÃI SUẤT THÁNG: {}", settlementMonth);

        AtomicLong totalProcessed = new AtomicLong(0);
        AtomicLong chunkCounter = new AtomicLong(0);

        // 1. Mở StatelessSession riêng để thực thi chèn dữ liệu tốc độ cao không tốn RAM
        StatelessSession statelessSession = sessionFactory.openStatelessSession();
        Transaction currentTx = statelessSession.beginTransaction();

        try (Stream<SavingAccountStreamingRepository.AccountInterestView> accountStream = 
                     accountRepository.streamActiveSavingAccounts()) {

            accountStream.forEach(acc -> {
                // Tính lãi suất tháng: (Số dư * Lãi suất năm) / 12 tháng / 100
                BigDecimal annualRate = acc.interestRate();
                BigDecimal monthlyInterest = acc.balance()
                        .multiply(annualRate)
                        .divide(BigDecimal.valueOf(1200), 4, RoundingMode.HALF_UP);

                InterestPaymentEntity paymentRecord = new InterestPaymentEntity(
                        "INT-" + settlementMonth.toString() + "-" + UUID.randomUUID().toString().substring(0, 8),
                        acc.accountNumber(),
                        monthlyInterest,
                        settlementMonth
                );

                // Ghi qua StatelessSession (Không lưu snapshot, không phình RAM)
                statelessSession.insert(paymentRecord);

                totalProcessed.incrementAndGet();

                // 2. CHECKPOINT PATTERN: Cứ mỗi 5,000 bản ghi thì COMMIT 1 lần
                if (chunkCounter.incrementAndGet() >= COMMIT_CHUNK_SIZE) {
                    currentTx.commit();
                    log.info("Đã cam kết checkpoint thành công {} tài khoản...", totalProcessed.get());
                    chunkCounter.set(0);
                    // Bắt đầu transaction mới cho chunk tiếp theo
                    currentTx = statelessSession.beginTransaction();
                }
            });

            // Commit số lượng còn lại
            if (currentTx.isActive()) {
                currentTx.commit();
            }

        } catch (Exception ex) {
            if (currentTx != null && currentTx.isActive()) {
                currentTx.rollback();
            }
            log.error("Sự cố nghiêm trọng khi đang chạy Job quyết toán lãi suất", ex);
            throw new RuntimeException("Quyết toán thất bại", ex);
        } finally {
            statelessSession.close();
        }

        long duration = System.currentTimeMillis() - startTime;
        log.info("HOÀN TẤT TOÀN BỘ JOB: Xử lý {} tài khoản trong {}ms (RAM luôn duy trì dưới 80MB).", 
                 totalProcessed.get(), duration);
    }
}
~~~

:::takeaways
- **Cái chết mang tên saveAll()**: Tuyệt đối không dùng <code>saveAll()</code> cho các tác vụ hàng chục ngàn đến hàng triệu dòng. Sự phình to của First-Level Cache và cơ chế Snapshot Dirty Checking sẽ đánh sập JVM với lỗi OutOfMemoryError.
- **Khai thác Tối đa StatelessSession**: Với các tác vụ nạp hoặc trích xuất dữ liệu khối lượng lớn, sử dụng <code>StatelessSession</code> của Hibernate 6 giúp loại bỏ 100% overhead của L1 Cache và đem lại tốc độ tương đương JDBC thuần.
- **Bắt buộc Kèm Theo order_inserts**: Cấu hình <code>hibernate.jdbc.batch_size</code> chỉ phát huy tối đa sức mạnh khi đi cùng <code>order_inserts=true</code> và <code>order_updates=true</code> để tránh phân mảnh bộ đệm batch.
- **Server-Side Cursor Streaming**: Kết hợp <code>Stream<T></code>, <code>@QueryHint(fetch_size = 500)</code> và <code>@Transactional(readOnly = true)</code> để đọc hàng triệu dòng dữ liệu từ cơ sở dữ liệu với bộ nhớ RAM phẳng tuyệt đối.
- **Cấu hình HikariCP Chuẩn Khoa học**: Không bao giờ đặt <code>maximum-pool-size</code> quá lớn (hàng trăm kết nối) vì sẽ gây thắt cổ chai CPU Context-Switching. Cấu hình hồ kết nối hợp lý kết hợp <code>leak-detection-threshold</code> để giữ hệ thống luôn ổn định dưới tải cao.
:::
`
    },
    {
      id: "3-7",
      type: "lesson",
      title: "Quan hệ Entity chuyên sâu & JPA Auditing — OneToMany, ManyToMany, Cascade & Auditing",
      minutes: 50,
      content: `
## Bẫy ngầm trong quan hệ Entity và Cơ chế Kiểm toán JPA Auditing

Trong kiến trúc cơ sở dữ liệu doanh nghiệp, hơn 80% các lỗi nghiêm trọng về suy giảm hiệu năng (Performance Degradation), khóa chết (Deadlock), rò rỉ dữ liệu hoặc thậm chí xóa nhầm hàng triệu dòng dữ liệu (Cascading Delete Disaster) đều bắt nguồn từ việc ánh xạ quan hệ Object-Relational Mapping (ORM) thiếu hiểu biết.

JPA và Hibernate cung cấp các công cụ mạnh mẽ như <code>@OneToMany</code>, <code>@ManyToOne</code>, <code>@ManyToMany</code>, <code>cascade</code>, <code>orphanRemoval</code> và <code>@EntityListeners</code>. Tuy nhiên, nếu không nắm vững vòng đời của Entity trong <code>PersistenceContext</code>, cách thức <code>ActionQueue</code> sắp xếp thứ tự thực thi câu lệnh SQL, cũng như các giới hạn của cơ chế quản lý con trỏ bộ nhớ JVM Heap, hệ thống của bạn sẽ đứng trước nguy cơ sụp đổ khi lượng truy cập tăng vọt.

---

## 1. Kiến trúc & Cơ chế ngầm của Entity Relationships (Under the Hood)

### Nguyên tắc Owning Side và Inverse Side trong JPA

Trong mô hình quan hệ cơ sở dữ liệu (RDBMS), quan hệ giữa 2 bảng được thiết lập thông qua **Khóa ngoại (Foreign Key - FK)** nằm ở bảng con. Tuy nhiên, trong mô hình hướng đối tượng của Java, một quan hệ hai chiều (Bidirectional Relationship) lại được biểu diễn bằng hai tham chiếu đối tượng độc lập trong bộ nhớ RAM:
- Đối tượng cha giữ một collection các đối tượng con: <code>Order.items -> List&lt;OrderItem&gt;</code>
- Đối tượng con giữ một tham chiếu đến đối tượng cha: <code>OrderItem.order -> Order</code>

Hibernate không thể tự động đoán biết tham chiếu nào đại diện cho cột Foreign Key thực tế dưới cơ sở dữ liệu nếu lập trình viên không chỉ định rõ ràng.

~~~text
+-----------------------------------------------------------------------------------+
|                           PERSISTENCE CONTEXT (RAM)                               |
|                                                                                   |
|   +--------------------------+              +---------------------------------+   |
|   |       Order Entity       |              |        OrderItem Entity         |   |
|   |   (Inverse / Non-Owning) |              |          (Owning Side)          |   |
|   +--------------------------+              +---------------------------------+   |
|   | id: 100                  |              | id: 501                         |   |
|   | items: [OrderItem@501]   | <----------> | order: Order@100                |   |
|   +--------------------------+              +---------------------------------+   |
|             |                                                |                    |
|             | mappedBy = "order"                             | @JoinColumn        |
|             | (BỊ HIBERNATE BỎ QUA KHI GHI SQL)              | (name="order_id")  |
+-------------|------------------------------------------------|--------------------+
              |                                                |
              v                                                v
+-----------------------------------------------------------------------------------+
|                              ACTION QUEUE & RDBMS                                 |
|                                                                                   |
|  * Hibernate CHỈ quét Owning Side để phát sinh SQL DML:                           |
|    INSERT INTO order_items (id, order_id, product, price)                         |
|    VALUES (501, 100, 'MacBook Pro M3', 2500.00);                                  |
|                                                                                   |
|  * Nếu OrderItem.order == null trong RAM:                                         |
|    INSERT INTO order_items (id, order_id, ...) VALUES (501, NULL, ...);           |
|    ==> Gây lỗi NOT NULL constraint violation ngay lập tức!                        |
+-----------------------------------------------------------------------------------+
~~~

#### Quy tắc bất biến:
1. **Owning Side**: Là Entity chứa annotation <code>@JoinColumn</code> (tương ứng với bảng chứa cột Foreign Key vật lý trong database). Trong quan hệ 1-N, **phía con (<code>@ManyToOne</code>) LUÔN LUÔN là Owning Side**. Chỉ có các thay đổi trạng thái trên Owning Side mới kích hoạt Hibernate tạo câu lệnh SQL <code>INSERT</code> hoặc <code>UPDATE</code> giá trị khóa ngoại.
2. **Inverse Side (Non-Owning Side)**: Là Entity chứa thuộc tính <code>mappedBy</code>. Thuộc tính <code>mappedBy</code> báo cho Hibernate biết: *"Tôi không sở hữu khóa ngoại. Hãy nhìn vào trường được đặt tên trong <code>mappedBy</code> ở Entity đối tác để biết cách liên kết"*. Mọi thao tác thêm/xóa trên collection của Inverse Side mà không cập nhật Owning Side sẽ **hoàn toàn bị Hibernate bỏ qua** khi Flush xuống DB.

### Tại sao bắt buộc phải có Helper Methods (Bi-directional Sync)?

Xem xét đoạn mã thường gặp của lập trình viên sơ cấp:

~~~java
// TAI HỌA: Chỉ thêm vào Inverse Side
Order order = orderRepository.findById(orderId).orElseThrow();
OrderItem item = new OrderItem();
item.setProductName("Gaming Mouse");
item.setPrice(new BigDecimal("99.00"));

order.getItems().add(item); // Chỉ cập nhật collection trong RAM của Order!
// Quên gọi: item.setOrder(order);

orderRepository.save(order);
~~~

Hậu quả:
1. Nếu cột <code>order_id</code> trong bảng <code>order_items</code> có ràng buộc <code>NOT NULL</code>: Hibernate thực hiện <code>INSERT INTO order_items (id, order_id, ...) VALUES (1, NULL, ...)</code> -> Cơ sở dữ liệu lập tức quăng ngoại lệ <code>DataIntegrityViolationException: Column 'order_id' cannot be null</code>.
2. Nếu cột <code>order_id</code> chấp nhận <code>NULL</code>: Bản ghi được insert mồ côi không có cha. Lần truy vấn tiếp theo <code>order.getItems()</code> sẽ biến mất dòng sản phẩm vừa thêm.
3. Trong phạm vi cùng một Transaction (First-Level Cache): Nếu một Service khác đọc lại <code>order</code> hoặc <code>item</code> từ <code>EntityManager</code>, dữ liệu trong bộ nhớ bị mâu thuẫn (Inconsistent State).

Do đó, bắt buộc phải đóng gói việc đồng bộ con trỏ hai chiều vào các **Helper Methods** ngay bên trong Entity cha:

~~~java
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(
        mappedBy = "order",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<OrderItem> items = new ArrayList<>();

    // HELPER METHOD CHUẨN ENTERPRISE: Đồng bộ 2 chiều nguyên tử trong RAM
    public void addItem(OrderItem item) {
        if (item == null) {
            throw new IllegalArgumentException("OrderItem cannot be null");
        }
        this.items.add(item);
        item.setOrder(this); // Cập nhật Owning Side
    }

    public void removeItem(OrderItem item) {
        if (item == null) {
            return;
        }
        this.items.remove(item);
        item.setOrder(null); // Gỡ liên kết Owning Side
    }
}
~~~

---

## 2. CascadeType & orphanRemoval — Giải phẫu Chi tiết & Ranh giới Tử thần

Nhiều kỹ sư thường nhầm lẫn giữa <code>CascadeType.REMOVE</code> và <code>orphanRemoval = true</code>, hoặc lạm dụng <code>CascadeType.ALL</code> dẫn đến những thảm họa xóa sạch dữ liệu trên môi trường Production.

### Bảng đối chiếu bản chất kỹ thuật

| Thuộc tính | Ngữ cảnh kích hoạt | Hành động SQL tương ứng | Mục đích sử dụng an toàn |
|---|---|---|---|
| <code>CascadeType.PERSIST</code> | Khi gọi <code>entityManager.persist(parent)</code> | Tự động lan truyền lệnh <code>INSERT</code> sang các Entity con | Lưu Parent kèm danh sách Child mới tạo trong 1 lần gọi. |
| <code>CascadeType.MERGE</code> | Khi gọi <code>entityManager.merge(parent)</code> | Tự động lan truyền lệnh <code>UPDATE</code> sang các Entity con | Cập nhật thông tin Parent và toàn bộ con sau khi nhận DTO từ client. |
| <code>CascadeType.REMOVE</code> | Chỉ kích hoạt khi gọi <code>entityManager.remove(parent)</code> hoặc <code>repo.delete(parent)</code> | Phát sinh lệnh <code>DELETE FROM child WHERE id = ...</code> cho toàn bộ con | Xóa toàn bộ Entity con khi Entity cha bị xóa sổ khỏi hệ thống. |
| <code>orphanRemoval = true</code> | Kích hoạt khi một phần tử con bị gỡ khỏi Collection của cha: <code>parent.getChildren().remove(child)</code> | Tự động phát sinh lệnh <code>DELETE FROM child WHERE id = child.id</code> | Quản lý vòng đời chặt chẽ của Aggregate Root. Khi con mất cha, con phải bị tiêu hủy. |

### Hiểm họa tột cùng: CascadeType.REMOVE trên @ManyToOne hoặc @ManyToMany

~~~java
// THẢM HỌA KHÔNG THỂ CỨU VÃN
@Entity
@Table(name = "products")
public class Product {
    @Id
    private Long id;

    @ManyToOne(cascade = CascadeType.ALL) // <-- ÁC MỘNG BẮT ĐẦU TẠI ĐÂY!
    @JoinColumn(name = "category_id")
    private Category category;
}
~~~

**Kịch bản thảm họa:**
1. Nhân viên quản trị kho ấn nút xóa một sản phẩm đã hết hàng: <code>productRepository.deleteById(productId)</code>.
2. Vì <code>Product</code> đặt <code>CascadeType.ALL</code> trỏ tới <code>Category</code>, Hibernate hiểu rằng: *"Xóa Product thì phải xóa luôn Category liên kết"*.
3. Hibernate phát lệnh: <code>DELETE FROM categories WHERE id = category_id</code>.
4. Nếu <code>Category</code> lại có <code>@OneToMany(cascade = CascadeType.ALL)</code> trỏ tới toàn bộ <code>Product</code> khác thuộc danh mục đó: Cơ chế Cascading Delete domino sẽ kích hoạt xóa sạch hàng triệu sản phẩm khác trong danh mục đó của toàn bộ sàn thương mại điện tử!

:::danger NGUYÊN TẮC BẤT DI BẤT DỊCH
1. **TUYỆT ĐỐI KHÔNG BAO GIỜ** khai báo <code>CascadeType.REMOVE</code> hoặc <code>CascadeType.ALL</code> trên annotation <code>@ManyToOne</code> hoặc <code>@ManyToMany</code>.
2. Cascade chỉ được truyền theo chiều từ **Aggregate Root (Cha) -> Dependent Component (Con)**, không bao giờ truyền ngược từ Con lên Cha hoặc giữa các Entity ngang hàng độc lập!
:::

---

## 3. @ManyToMany Thực chiến — Tránh Bẫy Bảng Trung gian Vô hồn

Annotation <code>@ManyToMany</code> mặc định của JPA chỉ hỗ trợ bảng trung gian thuần túy gồm 2 cột khóa ngoại:

~~~text
+-----------------------+          +-----------------------+
|        courses        |          |       students        |
+-----------------------+          +-----------------------+
| id (PK)               |          | id (PK)               |
+-----------------------+          +-----------------------+
            ^                                  ^
            |       +------------------+       |
            +-------| courses_students |-------+
                    +------------------+
                    | course_id (FK)   |
                    | student_id (FK)  |
                    +------------------+
~~~

### 3 Nhược điểm chí mạng của @ManyToMany thuần túy:
1. **Không thể lưu thông tin nghiệp vụ mở rộng**: Trong thực tế, một quan hệ nhiều - nhiều không bao giờ đứng yên. Ví dụ: Sinh viên đăng ký môn học thì cần lưu: *ngày đăng ký (enrolled_at)*, *điểm tổng kết (grade)*, *trạng thái (status: ENROLLED, DROPPED, PASSED)*, *số tín chỉ tích lũy (credits)*.
2. **Cơ chế Delete-All-Insert của Hibernate với <code>java.util.List</code>**: Nếu bạn dùng <code>List&lt;Course&gt;</code> trong quan hệ <code>@ManyToMany</code>, khi bạn xóa 1 môn học khỏi danh sách, Hibernate sẽ thực hiện:
   ~~~sql
   DELETE FROM courses_students WHERE student_id = ?; -- XÓA HẾT TOÀN BỘ!
   INSERT INTO courses_students (student_id, course_id) VALUES (?, ?); -- Insert lại các môn còn lại!
   ~~~
   Thao tác này gây ra khóa bảng, phân mảnh Index và làm chậm hệ thống khủng khiếp khi danh sách có hàng trăm phần tử.
3. **Mất dấu vết Audit**: Không thể biết ai là người gán sinh viên vào khóa học, vào thời điểm nào.

### Giải pháp Chuẩn Enterprise: Tách Bảng Trung gian thành Entity Độc lập

Chúng ta chuyển đổi quan hệ <code>N-N</code> thành hai quan hệ <code>1-N</code> với một Entity trung gian đại diện cho bản hợp đồng/phiên đăng ký:

~~~text
+----------------+        1     N        +-----------------------+        N     1        +----------------+
|    Student     | <-------------------> |   CourseEnrollment    | <-------------------> |     Course     |
| (Aggregate)    |                       | (Intermediate Entity) |                       |  (Aggregate)   |
+----------------+                       +-----------------------+                       +----------------+
| id: Long (PK)  |                       | id: Composite Key     |                       | id: Long (PK)  |
| studentCode    |                       | student: Student      |                       | courseCode     |
| fullName       |                       | course: Course        |                       | title          |
+----------------+                       | enrolledAt: Instant   |                       | maxCredits     |
                                         | grade: BigDecimal     |                       +----------------+
                                         | status: String        |
                                         +-----------------------+
~~~

---

## 4. Bẫy Chết người: Lombok @Data và Hỏng Contract của Set & StackOverflow

Hơn 90% các dự án Spring Boot sử dụng thư viện Project Lombok. Tuy nhiên, việc đặt annotation <code>@Data</code> hoặc <code>@EqualsAndHashCode</code> bừa bãi trên JPA Entity là nguyên nhân gây ra 2 loại bug "ác mộng" nhất trong Java.

### Bug 1: StackOverflowError do Vòng lặp Đệ quy vô tận trong toString()

Lombok <code>@Data</code> ngầm tạo ra phương thức <code>toString()</code> bao gồm toàn bộ các trường của lớp.

~~~java
// THẢM HỌA: Lombok @Data trên quan hệ 2 chiều
@Entity
@Data // Tự động sinh toString() bao gồm cả "items"
public class Order {
    @Id private Long id;
    @OneToMany(mappedBy = "order")
    private List<OrderItem> items;
}

@Entity
@Data // Tự động sinh toString() bao gồm cả "order"
public class OrderItem {
    @Id private Long id;
    @ManyToOne
    private Order order;
}
~~~

Khi bạn ghi log: <code>log.info("Processing order: {}", order);</code>:
- <code>Order.toString()</code> gọi <code>OrderItem.toString()</code>.
- <code>OrderItem.toString()</code> lại gọi ngược lại <code>Order.toString()</code>.
- Chu trình đệ quy lặp đi lặp lại hàng nghìn lần trong micro-giây cho đến khi bộ nhớ Call Stack của Thread cạn kiệt:
  ~~~text
  java.lang.StackOverflowError
      at com.example.Order.toString(Order.java:12)
      at java.lang.String.valueOf(String.java:4218)
      at com.example.OrderItem.toString(OrderItem.java:15)
      at java.lang.String.valueOf(String.java:4218)
      at com.example.Order.toString(Order.java:12)
  ~~~
  Thread xử lý của Tomcat chết ngay lập tức, và nếu có 200 request đồng thời cùng kích hoạt lệnh in log này, toàn bộ Web Server sẽ bị tê liệt hoàn toàn (DoS).

### Bug 2: Phá vỡ Contract của java.util.Set và HashSet do Equals/HashCode đổi giá trị

Lombok <code>@EqualsAndHashCode</code> mặc định tính toán mã băm dựa trên **tất cả các trường**, hoặc tệ hơn là tính trên trường <code>id</code>.

~~~java
Set<Order> set = new HashSet<>();
Order newOrder = new Order(); // id = null
set.add(newOrder); // HashSet tính hashCode dựa trên id = null và đưa vào Bucket A

orderRepository.save(newOrder); // Database cấp phát ID tự tăng, ví dụ: id = 100L

// NGHIỆM THU TAI HỌA:
boolean exists = set.contains(newOrder); // TRẢ VỀ FALSE!
~~~

**Tại sao lại trả về <code>false</code> trong khi đối tượng sờ sờ nằm trong Set?**
- Khi đưa vào <code>HashSet</code> ban đầu, mã băm tính theo <code>id = null</code>.
- Sau khi được lưu xuống cơ sở dữ liệu, trường <code>id</code> được Hibernate gán giá trị <code>100L</code>.
- Khi gọi <code>set.contains(newOrder)</code>, Java tính lại mã băm mới theo <code>id = 100L</code>. Mã băm này trỏ tới Bucket B hoàn toàn khác trong cấu trúc bảng băm nội bộ của <code>HashSet</code>.
- Kết quả: Không tìm thấy object! Dẫn đến lỗi nhân bản dữ liệu, kiểm tra trùng lặp bị sai lệch hoàn toàn.

### Quy tắc Vàng: Thiết kế equals() và hashCode() An toàn cho JPA

1. Tuyệt đối không dùng <code>@Data</code> trên JPA Entity. Hãy thay thế bằng: <code>@Getter</code>, <code>@Setter</code>.
2. <code>toString()</code> chỉ bao gồm các trường dữ liệu nguyên thủy cơ bản (tránh xa các collection và quan hệ liên kết).
3. Triển khai <code>equals()</code> và <code>hashCode()</code> theo **Business Key duy nhất** (UUID, Mã sinh viên, Mã đơn hàng, Email). Nếu bắt buộc dùng surrogate primary key (<code>id</code>), phải tuân thủ chuẩn Hibernate Proxy Safe:

~~~java
@Entity
@Table(name = "courses")
@Getter
@Setter
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_code", nullable = false, unique = true, length = 32)
    private String courseCode; // Business Key bất biến

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        // Kiểm tra an toàn cho Hibernate Proxy (sử dụng getClass của Hibernate thay vì == trực tiếp)
        if (o == null || org.hibernate.Hibernate.getClass(this) != org.hibernate.Hibernate.getClass(o)) {
            return false;
        }
        Course course = (Course) o;
        return courseCode != null && java.util.Objects.equals(courseCode, course.courseCode);
    }

    @Override
    public int hashCode() {
        // Luôn trả về giá trị cố định hoặc hash của Business Key để đảm bảo không bị thay đổi trạng thái băm
        return getClass().hashCode();
    }
}
~~~

---

## 5. JPA Auditing Chuẩn Enterprise — Tự động Ghi dấu Vết Dữ liệu

Trong các hệ thống phân tán, ngân hàng, viễn thông và bảo hiểm, mọi thao tác tạo mới hoặc sửa đổi dữ liệu bắt buộc phải được ghi lại dấu vết (Audit Trail) phục vụ việc điều tra sự cố và tuân thủ pháp lý (SOX, PCI-DSS, ISO 27001).

Spring Data JPA cung cấp cơ chế Auditing thông qua các annotation:
- <code>@CreatedDate</code>: Thời điểm tạo bản ghi.
- <code>@LastModifiedDate</code>: Thời điểm cập nhật bản ghi gần nhất.
- <code>@CreatedBy</code>: Định danh người/hệ thống tạo bản ghi.
- <code>@LastModifiedBy</code>: Định danh người/hệ thống sửa bản ghi.
- <code>@Version</code>: Phiên bản bản ghi phục vụ Optimistic Locking (chống xung đột ghi đè dữ liệu).

~~~text
+-----------------------------------------------------------------------------------+
|                        SPRING DATA JPA AUDITING FLOW                              |
|                                                                                   |
|  HTTP Request (Bearer JWT Token)                                                  |
|       |                                                                           |
|       v                                                                           |
|  [SecurityContextHolder] <--- Authentication (username: "admin_tran")             |
|       |                                                                           |
|       v                                                                           |
|  [AuditorAware<String>]  ---> Trích xuất "admin_tran"                             |
|       |                                                                           |
|       v                                                                           |
|  [AuditingEntityListener] (Kích hoạt tại các sự kiện PrePersist / PreUpdate)      |
|       |                                                                           |
|       +--> Gán createdAt = Instant.now(), createdBy = "admin_tran"                |
|       +--> Gán updatedAt = Instant.now(), updatedBy = "admin_tran"                |
|       |                                                                           |
|       v                                                                           |
|  [ActionQueue]                                                                    |
|       |                                                                           |
|       v                                                                           |
|  SQL DML: INSERT INTO course_enrollments (..., created_at, created_by)            |
+-----------------------------------------------------------------------------------+
~~~

---

## 6. Triển khai Production-Grade: Hệ thống Đăng ký Tín chỉ Đại học

Chúng ta sẽ xây dựng trọn vẹn phân hệ **Quản lý Đăng ký Học phần (University Course Enrollment Subsystem)** đạt chuẩn khắt khe của Enterprise:
1. <code>Course</code> (Môn học): Giới hạn số tín chỉ, mã môn học chuẩn quốc tế.
2. <code>Student</code> (Sinh viên): Mã sinh viên duy nhất, quản lý danh sách đăng ký.
3. <code>CourseEnrollment</code> (Bảng trung gian có Composite Key): Quản lý trạng thái đăng ký, điểm số, và kế thừa toàn bộ cơ chế JPA Auditing.
4. Cấu hình Spring Security Auditor Provider trích xuất Principal thông minh.

### 6.1. Base Entity dùng chung cho toàn bộ Hệ thống

~~~java
package com.university.academic.domain.common;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.io.Serializable;
import java.time.Instant;

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public abstract class BaseAuditableEntity implements Serializable {

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false, length = 64)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "updated_by", nullable = false, length = 64)
    private String updatedBy;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;
}
~~~

### 6.2. Cấu hình JPA Auditing kết nối SecurityContext

~~~java
package com.university.academic.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "springSecurityAuditorAware")
public class JpaAuditingConfiguration {

    @Bean
    public AuditorAware<String> springSecurityAuditorAware() {
        return () -> Optional.ofNullable(SecurityContextHolder.getContext())
            .map(SecurityContext::getAuthentication)
            .filter(Authentication::isAuthenticated)
            .filter(auth -> !(auth instanceof AnonymousAuthenticationToken))
            .map(Authentication::getName)
            .or(() -> Optional.of("SYSTEM_BATCH_DAEMON"));
    }
}
~~~

### 6.3. Entity Course (Môn học)

~~~java
package com.university.academic.domain.course;

import com.university.academic.domain.common.BaseAuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.Hibernate;

import java.util.Objects;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
public class Course extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_code", nullable = false, unique = true, length = 16)
    private String courseCode;

    @Column(name = "title", nullable = false, length = 128)
    private String title;

    @Column(name = "credits", nullable = false)
    private Integer credits;

    @Column(name = "max_capacity", nullable = false)
    private Integer maxCapacity;

    public Course(String courseCode, String title, Integer credits, Integer maxCapacity) {
        this.courseCode = courseCode;
        this.title = title;
        this.credits = credits;
        this.maxCapacity = maxCapacity;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        Course course = (Course) o;
        return courseCode != null && Objects.equals(courseCode, course.courseCode);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Course{" +
            "id=" + id +
            ", courseCode='" + courseCode + '\'' +
            ", title='" + title + '\'' +
            ", credits=" + credits +
            "}";
    }
}
~~~

### 6.4. Composite Key & Entity CourseEnrollment

~~~java
package com.university.academic.domain.enrollment;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CourseEnrollmentId implements Serializable {

    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "course_id")
    private Long courseId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CourseEnrollmentId that = (CourseEnrollmentId) o;
        return Objects.equals(studentId, that.studentId) &&
               Objects.equals(courseId, that.courseId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(studentId, courseId);
    }
}
~~~

~~~java
package com.university.academic.domain.enrollment;

import com.university.academic.domain.common.BaseAuditableEntity;
import com.university.academic.domain.course.Course;
import com.university.academic.domain.student.Student;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "course_enrollments")
@Getter
@Setter
@NoArgsConstructor
public class CourseEnrollment extends BaseAuditableEntity {

    @EmbeddedId
    private CourseEnrollmentId id = new CourseEnrollmentId();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("studentId")
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("courseId")
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private EnrollmentStatus status = EnrollmentStatus.ENROLLED;

    @Column(name = "enrolled_at", nullable = false)
    private Instant enrolledAt = Instant.now();

    @Column(name = "grade", precision = 4, scale = 2)
    private BigDecimal grade;

    public CourseEnrollment(Student student, Course course) {
        this.student = student;
        this.course = course;
        this.id = new CourseEnrollmentId(student.getId(), course.getId());
    }

    public enum EnrollmentStatus {
        ENROLLED,
        DROPPED,
        COMPLETED,
        FAILED
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CourseEnrollment that = (CourseEnrollment) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
~~~

### 6.5. Entity Student (Aggregate Root) với Helper Methods

~~~java
package com.university.academic.domain.student;

import com.university.academic.domain.common.BaseAuditableEntity;
import com.university.academic.domain.course.Course;
import com.university.academic.domain.enrollment.CourseEnrollment;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.Hibernate;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
public class Student extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_code", nullable = false, unique = true, length = 32)
    private String studentCode;

    @Column(name = "full_name", nullable = false, length = 128)
    private String fullName;

    @Column(name = "email", nullable = false, unique = true, length = 128)
    private String email;

    @OneToMany(
        mappedBy = "student",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<CourseEnrollment> enrollments = new ArrayList<>();

    public Student(String studentCode, String fullName, String email) {
        this.studentCode = studentCode;
        this.fullName = fullName;
        this.email = email;
    }

    // HELPER METHODS: Đảm bảo tính nhất quán 2 chiều
    public CourseEnrollment enrollCourse(Course course) {
        Objects.requireNonNull(course, "Course must not be null");

        // Kiểm tra xem đã đăng ký chưa
        Optional<CourseEnrollment> existing = this.enrollments.stream()
            .filter(e -> e.getCourse().equals(course))
            .findFirst();

        if (existing.isPresent()) {
            CourseEnrollment enrollment = existing.get();
            if (enrollment.getStatus() == CourseEnrollment.EnrollmentStatus.DROPPED) {
                enrollment.setStatus(CourseEnrollment.EnrollmentStatus.ENROLLED);
                return enrollment;
            }
            throw new IllegalStateException("Student already enrolled in course: " + course.getCourseCode());
        }

        CourseEnrollment enrollment = new CourseEnrollment(this, course);
        this.enrollments.add(enrollment);
        return enrollment;
    }

    public void dropCourse(Course course) {
        Objects.requireNonNull(course, "Course must not be null");
        this.enrollments.stream()
            .filter(e -> e.getCourse().equals(course))
            .findFirst()
            .ifPresent(e -> e.setStatus(CourseEnrollment.EnrollmentStatus.DROPPED));
    }

    public void removeEnrollmentCompletely(Course course) {
        Objects.requireNonNull(course, "Course must not be null");
        this.enrollments.removeIf(e -> {
            boolean match = e.getCourse().equals(course);
            if (match) {
                e.setStudent(null);
                e.setCourse(null);
            }
            return match;
        });
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        Student student = (Student) o;
        return studentCode != null && Objects.equals(studentCode, student.studentCode);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
~~~

### 6.6. Repositories & Service Layer Xử lý Nghiệp vụ

~~~java
package com.university.academic.repository;

import com.university.academic.domain.course.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    Optional<Course> findByCourseCode(String courseCode);
}
~~~

~~~java
package com.university.academic.repository;

import com.university.academic.domain.student.Student;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByStudentCode(String studentCode);

    // Sử dụng EntityGraph để Fetch Join toàn bộ quan hệ 1-N tránh N+1 Query
    @EntityGraph(attributePaths = {"enrollments", "enrollments.course"})
    Optional<Student> findWithEnrollmentsByStudentCode(String studentCode);
}
~~~

~~~java
package com.university.academic.service;

import com.university.academic.domain.course.Course;
import com.university.academic.domain.enrollment.CourseEnrollment;
import com.university.academic.domain.student.Student;
import com.university.academic.repository.CourseRepository;
import com.university.academic.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnrollmentService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;

    private static final int MAX_CREDITS_PER_SEMESTER = 24;

    @Transactional
    public EnrollmentResultDto enrollStudentInCourse(String studentCode, String courseCode) {
        log.info("Processing enrollment request: student={}, course={}", studentCode, courseCode);

        Student student = studentRepository.findWithEnrollmentsByStudentCode(studentCode)
            .orElseThrow(() -> new IllegalArgumentException("Student not found: " + studentCode));

        Course course = courseRepository.findByCourseCode(courseCode)
            .orElseThrow(() -> new IllegalArgumentException("Course not found: " + courseCode));

        // Kiểm tra tổng số tín chỉ hiện tại đã đăng ký
        int currentCredits = student.getEnrollments().stream()
            .filter(e -> e.getStatus() == CourseEnrollment.EnrollmentStatus.ENROLLED)
            .mapToInt(e -> e.getCourse().getCredits())
            .sum();

        if (currentCredits + course.getCredits() > MAX_CREDITS_PER_SEMESTER) {
            throw new IllegalStateException(String.format(
                "Credit limit exceeded! Current: %d, New Course: %d, Max: %d",
                currentCredits, course.getCredits(), MAX_CREDITS_PER_SEMESTER
            ));
        }

        CourseEnrollment enrollment = student.enrollCourse(course);
        studentRepository.save(student);

        log.info("Enrollment successful: student={}, course={}, auditBy={}",
            studentCode, courseCode, enrollment.getCreatedBy());

        return new EnrollmentResultDto(
            student.getStudentCode(),
            course.getCourseCode(),
            enrollment.getStatus().name(),
            enrollment.getEnrolledAt().toString()
        );
    }

    public record EnrollmentResultDto(
        String studentCode,
        String courseCode,
        String status,
        String enrolledAt
    ) {}
}
~~~

### 6.7. REST API Controller & Kiểm thử Thực tế với cURL

~~~java
package com.university.academic.controller;

import com.university.academic.service.EnrollmentService;
import com.university.academic.service.EnrollmentService.EnrollmentResultDto;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping("/{studentCode}/enrollments")
    public ResponseEntity<EnrollmentResultDto> enrollCourse(
            @PathVariable @NotBlank String studentCode,
            @RequestBody CourseEnrollRequest request) {

        EnrollmentResultDto result = enrollmentService.enrollStudentInCourse(studentCode, request.courseCode());
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    public record CourseEnrollRequest(@NotBlank String courseCode) {}
}
~~~

#### Kiểm thử kịch bản Đăng ký thành công (HTTP 201 Created):

~~~bash
curl -X POST http://localhost:8080/api/v1/students/STU-2026-99/enrollments   -H "Content-Type: application/json"   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."   -d '{"courseCode": "CS-401"}'
~~~

Response Headers & Payload:
~~~json
HTTP/1.1 201 Created
Content-Type: application/json
Date: Sat, 03 Oct 2026 09:30:00 GMT

{
  "studentCode": "STU-2026-99",
  "courseCode": "CS-401",
  "status": "ENROLLED",
  "enrolledAt": "2026-10-03T09:30:00.124562Z"
}
~~~

#### Kiểm thử kịch bản Vượt quá hạn mức tín chỉ (HTTP 409 Conflict - RFC 7807):

~~~bash
curl -X POST http://localhost:8080/api/v1/students/STU-2026-99/enrollments   -H "Content-Type: application/json"   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."   -d '{"courseCode": "MATH-302"}'
~~~

Response RFC 7807 Problem Details:
~~~json
HTTP/1.1 409 Conflict
Content-Type: application/problem+json
Date: Sat, 03 Oct 2026 09:31:15 GMT

{
  "type": "https://api.university.edu/errors/credit-limit-exceeded",
  "title": "Conflict - Credit Limit Exceeded",
  "status": 409,
  "detail": "Credit limit exceeded! Current: 22, New Course: 4, Max: 24",
  "instance": "/api/v1/students/STU-2026-99/enrollments"
}
~~~

---

## 7. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Hibernate N+1 DELETE & INSERT khi gỡ phần tử khỏi List

- **Triệu chứng**: Khi cập nhật danh sách các tag/quyền hạn của một User, hệ thống mất 450ms và database cảnh báo số lượng write operations tăng đột biến gấp 100 lần.
- **Nguyên nhân cốt lõi**:
  Sử dụng <code>java.util.List</code> cho quan hệ <code>@OneToMany</code> kết hợp không có Primary Key độc lập trên bảng liên kết:
  ~~~java
  @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
  private List<Tag> tags = new ArrayList<>();
  ~~~
  Trong đặc tả của Hibernate, <code>List</code> có tính thứ tự (ordered). Khi gỡ 1 phần tử ở giữa, Hibernate không thể xác định vị trí dòng tương ứng trong database. Giải pháp mặc định tồi tệ của Hibernate là:
  1. Phát sinh lệnh <code>DELETE FROM tags WHERE user_id = ?</code> (xóa toàn bộ 50 tags hiện có).
  2. Phát sinh 49 lệnh <code>INSERT INTO tags ...</code> (chèn lại toàn bộ danh sách còn lại).
- **Cách khắc phục**:
  Đổi kiểu dữ liệu sang <code>java.util.Set</code> kết hợp triển khai <code>equals()</code> và <code>hashCode()</code> chuẩn mực. Với <code>Set</code>, Hibernate nhận diện chính xác phần tử nào bị gỡ bỏ và chỉ phát sinh đúng **1 câu lệnh DELETE duy nhất**:
  ~~~sql
  DELETE FROM tags WHERE user_id = ? AND tag_id = ?;
  ~~~

### Post-mortem 2: Thất thoát Dữ liệu Audit do Async Thread Pool

- **Triệu chứng**: Khi kích hoạt xử lý hàng loạt bằng phương thức <code>@Async</code> hoặc Kafka Consumer:
  Cột <code>created_by</code> và <code>updated_by</code> trong database luôn bị gán giá trị <code>null</code> hoặc giá trị fallback <code>SYSTEM_BATCH_DAEMON</code>, mặc dù request ban đầu được gửi bởi nhân viên xác thực hợp lệ.
- **Nguyên nhân cốt lõi**:
  Mặc định, <code>SecurityContextHolder</code> của Spring Security lưu trữ dữ liệu xác thực bên trong <code>ThreadLocal</code>. Khi chuyển giao tác vụ sang một Thread Pool bất đồng bộ (<code>ThreadPoolTaskExecutor</code>), Thread mới không thừa hưởng bộ nhớ <code>ThreadLocal</code> của Thread cha, dẫn đến việc <code>SecurityContextHolder.getContext().getAuthentication()</code> trả về <code>null</code>.
- **Cách khắc phục**:
  Cấu hình chuyển giao Context qua <code>DelegatingSecurityContextAsyncTaskExecutor</code> hoặc kích hoạt chế độ thừa kế:
  ~~~java
  @PostConstruct
  public void configureSecurityContext() {
      SecurityContextHolder.setStrategyName(SecurityContextHolder.MODE_INHERITABLETHREADLOCAL);
  }
  ~~~

---

## 8. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống ngân hàng của bạn cần triển khai phân hệ **Quản lý Thẻ Tín dụng Phụ (Supplementary Credit Card Management)**:
1. Mỗi khách hàng chính (<code>PrimaryCustomer</code>) có thể bảo lãnh mở tối đa 5 thẻ tín dụng phụ (<code>SupplementaryCard</code>).
2. Khi khách hàng chính bị khóa tài khoản hoặc hủy thông tin, tất cả thẻ phụ phải bị đóng tự động.
3. Nếu một thẻ phụ bị khách hàng hủy trên ứng dụng di động (gỡ khỏi danh sách), thẻ phụ đó phải được tự động đánh dấu trạng thái <code>CANCELLED</code> và ghi nhận thời gian hủy, người hủy mà **không được phép xóa vật lý (Hard Delete)** khỏi cơ sở dữ liệu.
4. Mọi giao dịch thêm/sửa/hủy phải được kế thừa đầy đủ <code>BaseAuditableEntity</code> có Optimistic Locking để chống race-condition khi 2 người cùng thao tác mở thẻ phụ cùng một thời điểm.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.bank.card.domain;

import com.university.academic.domain.common.BaseAuditableEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.Hibernate;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "primary_customers")
@Getter
@Setter
@NoArgsConstructor
public class PrimaryCustomer extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cif_number", nullable = false, unique = true, length = 16)
    private String cifNumber;

    @Column(name = "full_name", nullable = false, length = 128)
    private String fullName;

    @OneToMany(
        mappedBy = "primaryCustomer",
        cascade = CascadeType.ALL,
        orphanRemoval = false // Không xóa vật lý vì phải giữ dữ liệu kế toán
    )
    private List<SupplementaryCard> supplementaryCards = new ArrayList<>();

    public SupplementaryCard issueSupplementaryCard(String holderName, String cardMaskedNumber, BigDecimal spendingLimit) {
        long activeCount = this.supplementaryCards.stream()
            .filter(card -> card.getStatus() == CardStatus.ACTIVE)
            .count();

        if (activeCount >= 5) {
            throw new IllegalStateException("Maximum 5 active supplementary cards allowed per primary customer!");
        }

        SupplementaryCard card = new SupplementaryCard();
        card.setHolderName(holderName);
        card.setCardMaskedNumber(cardMaskedNumber);
        card.setSpendingLimit(spendingLimit);
        card.setStatus(CardStatus.ACTIVE);
        card.setPrimaryCustomer(this);

        this.supplementaryCards.add(card);
        return card;
    }

    public void terminateSupplementaryCard(Long cardId) {
        this.supplementaryCards.stream()
            .filter(card -> Objects.equals(card.getId(), cardId))
            .findFirst()
            .ifPresent(card -> card.setStatus(CardStatus.CANCELLED));
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        PrimaryCustomer that = (PrimaryCustomer) o;
        return cifNumber != null && Objects.equals(cifNumber, that.cifNumber);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
~~~

~~~java
package com.bank.card.domain;

import com.university.academic.domain.common.BaseAuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.Hibernate;

import java.math.BigDecimal;
import java.util.Objects;

@Entity
@Table(name = "supplementary_cards")
@Getter
@Setter
@NoArgsConstructor
public class SupplementaryCard extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "card_masked_number", nullable = false, unique = true, length = 19)
    private String cardMaskedNumber;

    @Column(name = "holder_name", nullable = false, length = 128)
    private String holderName;

    @Column(name = "spending_limit", nullable = false, precision = 15, scale = 2)
    private BigDecimal spendingLimit;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private CardStatus status = CardStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "primary_customer_id", nullable = false)
    private PrimaryCustomer primaryCustomer;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        SupplementaryCard that = (SupplementaryCard) o;
        return cardMaskedNumber != null && Objects.equals(cardMaskedNumber, that.cardMaskedNumber);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
~~~

~~~java
package com.bank.card.domain;

public enum CardStatus {
    ACTIVE,
    BLOCKED,
    CANCELLED
}
~~~

~~~java
package com.bank.card.service;

import com.bank.card.domain.PrimaryCustomer;
import com.bank.card.domain.SupplementaryCard;
import com.bank.card.repository.PrimaryCustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupplementaryCardService {

    private final PrimaryCustomerRepository customerRepository;

    @Transactional
    public CardResponseDto issueCard(String cif, String holderName, String cardMaskedNumber, BigDecimal limit) {
        PrimaryCustomer customer = customerRepository.findByCifNumber(cif)
            .orElseThrow(() -> new IllegalArgumentException("Customer CIF not found: " + cif));

        SupplementaryCard card = customer.issueSupplementaryCard(holderName, cardMaskedNumber, limit);
        customerRepository.save(customer);

        log.info("Issued card {} for CIF {} by auditor {}",
            cardMaskedNumber, cif, card.getCreatedBy());

        return new CardResponseDto(
            card.getCardMaskedNumber(),
            card.getHolderName(),
            card.getStatus().name(),
            card.getSpendingLimit(),
            card.getCreatedAt().toString(),
            card.getCreatedBy()
        );
    }

    @Transactional
    public void cancelCard(String cif, Long cardId) {
        PrimaryCustomer customer = customerRepository.findByCifNumber(cif)
            .orElseThrow(() -> new IllegalArgumentException("Customer CIF not found: " + cif));

        customer.terminateSupplementaryCard(cardId);
        customerRepository.save(customer);
        log.info("Cancelled card {} under CIF {}", cardId, cif);
    }

    public record CardResponseDto(
        String cardMaskedNumber,
        String holderName,
        String status,
        BigDecimal limit,
        String createdAt,
        String createdBy
    ) {}
}
~~~

:::takeaways
- **Owning Side Quyết Định SQL**: Phía con (<code>@ManyToOne</code>) luôn chứa <code>@JoinColumn</code> và là Owning Side. Chỉ có việc thay đổi trạng thái trên Owning Side mới kích hoạt Hibernate sinh câu lệnh SQL DML cập nhật khóa ngoại.
- **Bắt Buộc Dùng Helper Methods**: Khi quan hệ là 2 chiều, luôn tạo <code>addItem()</code> và <code>removeItem()</code> trong Entity cha để bảo đảm cả 2 con trỏ trong bộ nhớ JVM Heap luôn được cập nhật đồng thời.
- **Ranh Giới Tử Thần Của Cascade**: Tuyệt đối không dùng <code>CascadeType.ALL</code> hay <code>CascadeType.REMOVE</code> trên quan hệ <code>@ManyToOne</code> hoặc <code>@ManyToMany</code>. Cascade chỉ truyền theo một chiều từ Aggregate Root xuống các thành phần phụ thuộc trực tiếp.
- **Tẩy Chay @ManyToMany Thuần Túy**: Thay thế bảng trung gian vô hồn bằng một Entity độc lập có <code>@EmbeddedId</code> và <code>@MapsId</code> để lưu vết các thuộc tính nghiệp vụ, ngày tháng và kiểm toán.
- **Nói Không Với Lombok @Data Trên Entity**: <code>@Data</code> gây sập hệ thống vì vòng lặp vô hạn trong <code>toString()</code> và phá vỡ cấu trúc của <code>HashSet</code> khi <code>id</code> được sinh tự động. Chỉ dùng <code>@Getter, @Setter</code> và triển khai <code>equals()/hashCode()</code> bằng Business Key.
- **JPA Auditing Toàn Diện**: Kế thừa <code>BaseAuditableEntity</code> kết hợp <code>AuditorAware</code> lấy thông tin từ Spring Security để tự động ghi nhận dấu vết truy vết kiểm toán và chống Lost Update bằng <code>@Version</code>.
:::
`
    },
    {
      id: "3-8",
      type: "lesson",
      title: "Elasticsearch Full-Text Search — tìm LIKE '%...%' là tự hạ mình",
      minutes: 45,
      content: `
## Tối ưu hóa Tìm kiếm Doanh nghiệp: Elasticsearch vs PostgreSQL pg_trgm, Inverted Index & CDC Sync

Trong các hệ thống quản trị nội dung, thương mại điện tử hoặc ứng dụng ngân hàng số, tính năng tìm kiếm là một trong những điểm nóng (hotspot) chịu tải lớn nhất và quyết định trực tiếp tới trải nghiệm người dùng.

Hầu hết lập trình viên bắt đầu bằng câu truy vấn quen thuộc:
~~~sql
SELECT * FROM products WHERE name LIKE '%macbook pro%';
~~~
Trên tập dữ liệu nhỏ vài nghìn dòng, câu truy vấn này phản hồi trong vài mili-giây. Nhưng khi dữ liệu mở rộng đến hàng triệu bản ghi, hệ thống cơ sở dữ liệu quan hệ (RDBMS) bắt đầu rơi vào tình trạng thắt cổ chai: CPU đạt 100%, hàng dài các kết nối xếp hàng chờ (Connection Pool Exhaustion) và thời gian phản hồi kéo dài từ 5 đến 15 giây.

Bài học này sẽ đi sâu vào bản chất khoa học máy tính của cấu trúc **Inverted Index**, so sánh thực chiến giữa **PostgreSQL <code>pg_trgm</code>** với **Elasticsearch**, và xây dựng một kiến trúc tìm kiếm phân tán đạt chuẩn Enterprise với cơ chế đồng bộ **Transactional Outbox CDC** chống lệch dữ liệu.

---

## 1. Bản chất Khoa học Máy tính: B-Tree Index vs Inverted Index (Under the Hood)

### Sơ Đồ Mô Phỏng: Pipeline Đồng Bộ CDC Debezium & Outbox Sang Elasticsearch

~~~mermaid
flowchart LR
    App["Spring Boot App"] --> LocalTx["Local ACID Transaction"]
    subgraph DB ["PostgreSQL 16"]
        LocalTx --> Biz["t_orders"]
        LocalTx --> Outbox["t_outbox_events"]
        Outbox --> WAL["Write-Ahead Log (WAL)"]
    end
    WAL --> Deb["Debezium CDC Connector"]
    Deb --> Kafka["Kafka Topic: outbox.events"]
    Kafka --> Sync["Search Indexer Consumer"]
    Sync --> ES[("Elasticsearch Cluster")]
    Client["Search Client"] --> ES
    style WAL fill:#1f6feb,stroke:#388bfd,color:#fff
    style ES fill:#238636,stroke:#2ea043,color:#fff
~~~


### Vì sao LIKE '%keyword%' là "kẻ hủy diệt" cơ sở dữ liệu quan hệ?

Các hệ quản trị cơ sở dữ liệu quan hệ như PostgreSQL hay MySQL sử dụng cấu trúc **B-Tree Index** để đánh chỉ mục cho các cột dữ liệu. B-Tree sắp xếp các giá trị theo thứ tự từ điển từ trái sang phải:

~~~text
+-----------------------------------------------------------------------------------+
|                         CẤU TRÚC B-TREE INDEX TRUYỀN THỐNG                        |
|                                                                                   |
|                              [ Apple ... Mango ]                                  |
|                             /                                                    |
|            [ Apple ... Dell ]                   [ Lenovo ... Samsung ]            |
|           /                                   /                                 |
|  [ Apple, Asus ]      [ Dell, HP ]     [ Lenovo, LG ]          [ Sony, Xiaomi ]   |
+-----------------------------------------------------------------------------------+
~~~

- **Tìm kiếm Prefix (<code>LIKE 'Apple%'</code>)**: B-Tree thực hiện phép duyệt cây nhị phân/đa phân với độ phức tạp <code>O(log N)</code>. Cơ sở dữ liệu định vị ngay nhánh có tiền tố 'Apple'.
- **Tìm kiếm Wildcard (<code>LIKE '%macbook%'</code>)**: Dấu <code>%</code> ở đầu vô hiệu hóa hoàn toàn cấu trúc sắp xếp thứ tự của B-Tree. Bộ tối ưu hóa truy vấn (Query Optimizer) buộc phải chuyển sang chế độ **Sequential Scan / Full Table Scan** (quét toàn bộ hàng triệu dòng dữ liệu và nạp từng trang ổ cứng vào RAM để kiểm tra chuỗi).

### Cơ chế Inverted Index (Chỉ mục Đảo ngược) trong Elasticsearch

Elasticsearch (được xây dựng trên nền Apache Lucene) giải quyết bài toán bằng cách đảo ngược hoàn toàn mối quan hệ giữa Văn bản (Document) và Từ ngữ (Term):
- Thay vì lưu: *"Tài liệu A chứa các từ X, Y, Z"*.
- Inverted Index lưu: *"Từ X xuất hiện trong những Tài liệu nào, tại vị trí nào, với tần suất bao nhiêu"*.

~~~text
+-----------------------------------------------------------------------------------+
|                        KIẾN TRÚC INVERTED INDEX (LUCENE)                          |
|                                                                                   |
|  Document 1: "MacBook Pro M3 Max 36GB"                                            |
|  Document 2: "MacBook Air M2 8GB"                                                 |
|  Document 3: "Dell XPS 15 Intel Core i9"                                          |
|                                                                                   |
|  +--------------------+--------------------------------------------------------+  |
|  | TERM DICTIONARY    | POSTING LIST (Chứa Document ID + Tần suất + Vị trí)    |  |
|  | (Tra cứu FST O(1)) | (Skip List nén Roaring Bitmaps)                        |  |
|  +--------------------+--------------------------------------------------------+  |
|  | air                | Doc 2 [pos: 1]                                         |  |
|  | dell               | Doc 3 [pos: 0]                                         |  |
|  | macbook            | Doc 1 [pos: 0], Doc 2 [pos: 0]                         |  |
|  | max                | Doc 1 [pos: 3]                                         |  |
|  | pro                | Doc 1 [pos: 1]                                         |  |
|  | xps                | Doc 3 [pos: 1]                                         |  |
|  +--------------------+--------------------------------------------------------+  |
|                                                                                   |
|  * Khi tìm "MacBook Pro":                                                         |
|    1. Tra term "macbook" -> [Doc 1, Doc 2]                                        |
|    2. Tra term "pro"     -> [Doc 1]                                               |
|    3. Giao hai danh sách (Bitwise AND qua Roaring Bitmaps) -> [Doc 1]              |
|    4. Tính điểm liên quan BM25 dựa trên TF (Term Frequency) & IDF                 |
|       ==> Trả về kết quả trong vòng 2ms trên 10 triệu văn bản!                    |
+-----------------------------------------------------------------------------------+
~~~

### Thuật toán chấm điểm mức độ liên quan: BM25 (Best Matching 25)

Elasticsearch không chỉ kiểm tra xem một tài liệu có chứa từ khóa hay không, mà còn chấm điểm mức độ liên quan thông qua thuật toán BM25:
1. **TF (Term Frequency)**: Từ khóa xuất hiện càng nhiều lần trong một văn bản thì điểm số càng cao (có mức trần bão hòa).
2. **IDF (Inverse Document Frequency)**: Một từ ngữ càng hiếm xuất hiện trên toàn bộ các tài liệu (ví dụ: "MacBook") thì càng có trọng số điểm cao hơn các từ thông dụng (ví dụ: "the", "và", "máy").
3. **Field Length Norm**: Văn bản càng ngắn mà chứa từ khóa thì càng liên quan hơn văn bản dài lê thê chứa từ khóa đó.

---

## 2. Khi nào dùng PostgreSQL pg_trgm và Khi nào Bắt buộc Dùng Elasticsearch?

Nhiều kỹ sư có thói quen dựng ngay một cụm Elasticsearch độc lập khi nhận yêu cầu tìm kiếm. Tuy nhiên, việc đưa một hệ thống phân tán mới vào hạ tầng đi kèm với chi phí vận hành rất lớn (quản lý phân mảnh Shard, JVM Heap tuning, Cluster rebalancing, chi phí bản quyền/phần cứng).

### Bảng so sánh Kiến trúc & Ra quyết định (Decision Matrix)

| Tiêu chí kỹ thuật | PostgreSQL + <code>pg_trgm</code> (GIN Index) | Elasticsearch / OpenSearch |
|---|---|---|
| **Cơ chế hoạt động** | Tách chuỗi thành các cụm 3 ký tự (Trigram) và lập chỉ mục qua GIN (Generalized Inverted Index). | Inverted Index hoàn chỉnh với Analysis Pipeline phong phú (Tokenizers, Stemming, Synonym). |
| **Quy mô dữ liệu tối ưu** | Dưới 2.000.000 dòng. | Hàng trăm triệu đến hàng tỷ documents. |
| **Tìm kiếm mờ (Fuzzy/Typo)** | Hỗ trợ tốt qua hàm <code>similarity()</code> (nguyeen ~ nguyen). | Hỗ trợ vượt trội qua Levenshtein Edit Distance (Fuzziness.AUTO). |
| **Đánh chỉ mục Tiếng Việt** | Cơ bản (cần custom config từ điển unaccent). | Hỗ trợ mạnh mẽ qua ICU Analysis Plugin hoặc từ điển phân tích từ ghép chuyên dụng. |
| **Faceted Search & Aggregations** | Phức tạp, phải viết nhiều câu lệnh <code>GROUP BY</code> nặng nề. | Tốc độ cực nhanh nhờ cấu trúc Doc Values cột (Columnar Storage). |
| **Tính nhất quán dữ liệu** | ACID tuyệt đối (Strong Consistency). Tìm thấy dữ liệu ngay sau lệnh COMMIT. | Eventual Consistency (mặc định refresh interval = 1s). Không thể dùng làm Single Source of Truth. |
| **Độ phức tạp vận hành** | Rất thấp (tận dụng luôn DB hiện có). | Cao (Cần quản lý cụm Master/Data node, Outbox Sync, Reindex khi đổi Schema). |

:::tip QUY TẮC THIẾT KẾ THỰC CHIẾN
- **Chọn PostgreSQL pg_trgm**: Khi quy mô dữ liệu dưới 1 triệu bản ghi, nghiệp vụ tìm kiếm chỉ ở mức lọc sản phẩm cơ bản, và team muốn duy trì hạ tầng tối giản, không muốn bảo trì thêm cluster.
- **Chọn Elasticsearch**: Khi tìm kiếm là tính năng cốt lõi (Core Business) như sàn thương mại điện tử, ứng dụng tuyển dụng việc làm, tra cứu hóa đơn ngân hàng, cần gợi ý từ khóa (Autocomplete Suggestion), lọc đa chiều (Facets: Brand, Price Range, Tags), hoặc tìm kiếm toàn văn tiếng Việt chuyên sâu.
:::

---

## 3. Bản thiết kế Mapping: Text vs Keyword & Analysis Pipeline

Trong Elasticsearch, sai lầm phổ biến nhất của lập trình viên là không phân biệt được hai kiểu dữ liệu: <code>Text</code> và <code>Keyword</code>.

~~~text
+-----------------------------------------------------------------------------------+
|                           ANALYSIS PIPELINE CỦA ELASTICSEARCH                     |
|                                                                                   |
|  Chuỗi thô đầu vào: "<b>Điện Thoại Apple iPhone 15 Pro Max 256GB!</b>"            |
|                                                                                   |
|  1. Character Filters: Xóa thẻ HTML, chuẩn hóa ký tự Unicode                      |
|     -> "Điện Thoại Apple iPhone 15 Pro Max 256GB!"                                |
|                                                                                   |
|  2. Tokenizer (Standard / Vietnamese Tokenizer): Tách từ                          |
|     -> ["Điện", "Thoại", "Apple", "iPhone", "15", "Pro", "Max", "256GB"]          |
|                                                                                   |
|  3. Token Filters: Lowercase, bỏ dấu Tiếng Việt (ASCII folding), Stopwords        |
|     -> ["dien", "thoai", "apple", "iphone", "15", "pro", "max", "256gb"]          |
|                                                                                   |
|  ==> Dữ liệu được ghi vào INVERTED INDEX để phục vụ Full-Text Search.             |
+-----------------------------------------------------------------------------------+
~~~

### Sự khác biệt cốt tử:
- **FieldType.Text**: Dữ liệu đi qua Analysis Pipeline (bị bẻ nhỏ thành các token, lowercase). Dùng cho các trường tìm kiếm văn bản tự do (Title, Description, Content). **Không thể** dùng trực tiếp để sắp xếp (Sort) hoặc tổng hợp (Aggregations).
- **FieldType.Keyword**: Giữ nguyên vẹn 100% chuỗi ký tự ban đầu, không phân tích từ. Dùng cho việc tìm kiếm chính xác tuyệt đối (Exact Match), bộ lọc lọc theo mã danh mục (Category Code), mã trạng thái (Status), hoặc để gom nhóm (Aggregations/Facets) và sắp xếp (Sorting).
- **Multi-Field (fields = ...)**: Kỹ thuật tốt nhất là ánh xạ một trường vừa là <code>Text</code> (để tìm kiếm mờ) vừa có trường phụ <code>keyword</code> (để filter/sort).

---

## 4. Triển khai Production-Grade: Hệ thống Tìm kiếm Sản phẩm Đa chiều

Chúng ta sẽ xây dựng phân hệ Tìm kiếm Sản phẩm Thương mại Điện tử hoàn chỉnh bằng Spring Boot 3.3+ và Spring Data Elasticsearch, bao gồm:
1. Document mapping chuẩn đa trường (Multi-fields) và hỗ trợ phân tích từ.
2. Search Service sử dụng <code>NativeQuery</code> hiện đại (kết hợp <code>bool</code>, <code>multi_match</code>, <code>fuzziness</code>, <code>filter</code> và <code>aggregations</code>).
3. Pagination an toàn chống tràn bộ nhớ.
4. Highlight từ khóa tìm kiếm trả về người dùng.

### 4.1. File cấu hình Dependencies (pom.xml)

~~~xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-elasticsearch</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
</dependencies>
~~~

### 4.2. Cấu hình Elasticsearch Client chuẩn Production

~~~java
package com.ecommerce.search.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.client.ClientConfiguration;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchConfiguration;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

import java.time.Duration;

@Configuration
@EnableElasticsearchRepositories(basePackages = "com.ecommerce.search.repository")
public class ElasticsearchClientConfig extends ElasticsearchConfiguration {

    @Value("\${spring.elasticsearch.uris:localhost:9200}")
    private String elasticsearchUris;

    @Value("\${spring.elasticsearch.connection-timeout:5s}")
    private Duration connectionTimeout;

    @Value("\${spring.elasticsearch.socket-timeout:30s}")
    private Duration socketTimeout;

    @Override
    public ClientConfiguration clientConfiguration() {
        return ClientConfiguration.builder()
            .connectedTo(elasticsearchUris.replace("http://", "").replace("https://", "").split(","))
            .withConnectTimeout(connectionTimeout)
            .withSocketTimeout(socketTimeout)
            .build();
    }
}
~~~

### 4.3. Entity Document: ProductDocument

~~~java
package com.ecommerce.search.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.InnerField;
import org.springframework.data.elasticsearch.annotations.MultiField;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Document(indexName = "products_v1", createIndex = false)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDocument {

    @Id
    private String id; // Đồng bộ với Primary Key ID bên Database

    @MultiField(
        mainField = @Field(type = FieldType.Text, analyzer = "standard"),
        otherFields = {
            @InnerField(suffix = "keyword", type = FieldType.Keyword, ignoreAbove = 256)
        }
    )
    private String name;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String description;

    @Field(type = FieldType.Keyword)
    private String sku;

    @Field(type = FieldType.Keyword)
    private String category;

    @Field(type = FieldType.Keyword)
    private String brand;

    @Field(type = FieldType.Double)
    private Double price;

    @Field(type = FieldType.Integer)
    private Integer stockQuantity;

    @Field(type = FieldType.Boolean)
    private Boolean active;

    @Field(type = FieldType.Keyword)
    private List<String> tags;

    @Field(type = FieldType.Date)
    private Instant createdAt;
}
~~~

### 4.4. Service Tìm kiếm Phức tạp với NativeQuery & Aggregations

~~~java
package com.ecommerce.search.service;

import co.elastic.clients.elasticsearch._types.aggregations.StringTermsBucket;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.QueryBuilders;
import com.ecommerce.search.document.ProductDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchAggregation;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.client.elc.NativeQueryBuilder;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.highlight.Highlight;
import org.springframework.data.elasticsearch.core.query.highlight.HighlightField;
import org.springframework.data.elasticsearch.core.query.highlight.HighlightParameters;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductSearchService {

    private final ElasticsearchOperations elasticsearchOperations;

    public ProductSearchResult searchProducts(SearchCriteria criteria) {
        log.info("Executing product search: criteria={}", criteria);

        NativeQueryBuilder queryBuilder = NativeQuery.builder();

        // Xây dựng Bool Query gồm MUST và FILTER
        BoolQuery.Builder boolQuery = QueryBuilders.bool();

        // 1. MUST CLAUSE: Full-Text Search có tính điểm Relevance (BM25)
        if (criteria.keyword() != null && !criteria.keyword().isBlank()) {
            boolQuery.must(QueryBuilders.multiMatch(m -> m
                .query(criteria.keyword())
                .fields("name^3", "description^1", "tags^2") // Tăng trọng số cho name gấp 3 lần
                .fuzziness("AUTO") // Tự động sửa lỗi gõ sai chính tả (Typo tolerance)
            ));
        } else {
            boolQuery.must(QueryBuilders.matchAll(m -> m));
        }

        // 2. FILTER CLAUSE: Lọc tuyệt đối, không tính điểm relevance và được bộ đệm ES Cache
        boolQuery.filter(QueryBuilders.term(t -> t.field("active").value(true)));

        if (criteria.category() != null && !criteria.category().isBlank()) {
            boolQuery.filter(QueryBuilders.term(t -> t.field("category").value(criteria.category())));
        }

        if (criteria.brand() != null && !criteria.brand().isBlank()) {
            boolQuery.filter(QueryBuilders.term(t -> t.field("brand").value(criteria.brand())));
        }

        if (criteria.minPrice() != null || criteria.maxPrice() != null) {
            boolQuery.filter(QueryBuilders.range(r -> {
                r.field("price");
                if (criteria.minPrice() != null) r.gte(co.elastic.clients.json.JsonData.of(criteria.minPrice()));
                if (criteria.maxPrice() != null) r.lte(co.elastic.clients.json.JsonData.of(criteria.maxPrice()));
                return r;
            }));
        }

        queryBuilder.withQuery(boolQuery.build()._toQuery());

        // 3. HIGHLIGHTING: Làm nổi bật từ khóa trong kết quả tìm kiếm
        Highlight highlight = new Highlight(
            HighlightParameters.builder().withPreTags("<mark>").withPostTags("</mark>").build(),
            List.of(new HighlightField("name"), new HighlightField("description"))
        );
        queryBuilder.withHighlightQuery(new org.springframework.data.elasticsearch.core.query.HighlightQuery(highlight, ProductDocument.class));

        // 4. AGGREGATIONS: Thống kê số lượng theo Danh mục và Thương hiệu (Faceted Search)
        queryBuilder.withAggregation("categories_facet",
            co.elastic.clients.elasticsearch._types.aggregations.Aggregation.of(a ->
                a.terms(t -> t.field("category").size(10))));

        queryBuilder.withAggregation("brands_facet",
            co.elastic.clients.elasticsearch._types.aggregations.Aggregation.of(a ->
                a.terms(t -> t.field("brand").size(10))));

        // 5. PHÂN TRANG AN TOÀN
        int page = Math.max(criteria.page(), 0);
        int size = Math.min(Math.max(criteria.size(), 10), 100);
        queryBuilder.withPageable(PageRequest.of(page, size));

        NativeQuery nativeQuery = queryBuilder.build();
        SearchHits<ProductDocument> hits = elasticsearchOperations.search(nativeQuery, ProductDocument.class);

        // Chuyển đổi kết quả tìm kiếm kèm Highlight
        List<ProductResponseItem> items = hits.getSearchHits().stream().map(hit -> {
            ProductDocument doc = hit.getContent();
            String highlightedName = hit.getHighlightField("name").stream().findFirst().orElse(doc.getName());
            return new ProductResponseItem(
                doc.getId(),
                highlightedName,
                doc.getSku(),
                doc.getCategory(),
                doc.getBrand(),
                doc.getPrice(),
                hit.getScore()
            );
        }).collect(Collectors.toList());

        // Trích xuất Facets từ Aggregations
        Map<String, Long> categoryFacets = extractFacet(hits, "categories_facet");
        Map<String, Long> brandFacets = extractFacet(hits, "brands_facet");

        return new ProductSearchResult(
            hits.getTotalHits(),
            page,
            size,
            items,
            categoryFacets,
            brandFacets
        );
    }

    @SuppressWarnings("unchecked")
    private Map<String, Long> extractFacet(SearchHits<ProductDocument> hits, String aggName) {
        if (hits.getAggregations() == null) return Collections.emptyMap();

        ElasticsearchAggregation agg = (ElasticsearchAggregation) hits.getAggregations().get(aggName);
        if (agg == null || agg.aggregation() == null) return Collections.emptyMap();

        Map<String, Long> result = new LinkedHashMap<>();
        var termsAgg = agg.aggregation().getAggregate().sterms();
        if (termsAgg != null && termsAgg.buckets() != null) {
            for (StringTermsBucket bucket : termsAgg.buckets().array()) {
                result.put(bucket.key().stringValue(), bucket.docCount());
            }
        }
        return result;
    }

    public record SearchCriteria(
        String keyword,
        String category,
        String brand,
        Double minPrice,
        Double maxPrice,
        int page,
        int size
    ) {}

    public record ProductResponseItem(
        String id,
        String name,
        String sku,
        String category,
        String brand,
        Double price,
        float score
    ) {}

    public record ProductSearchResult(
        long totalHits,
        int currentPage,
        int pageSize,
        List<ProductResponseItem> products,
        Map<String, Long> categoryDistribution,
        Map<String, Long> brandDistribution
    ) {}
}
~~~

### 4.5. REST API Controller

~~~java
package com.ecommerce.search.controller;

import com.ecommerce.search.service.ProductSearchService;
import com.ecommerce.search.service.ProductSearchService.SearchCriteria;
import com.ecommerce.search.service.ProductSearchService.ProductSearchResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products/search")
@RequiredArgsConstructor
public class ProductSearchController {

    private final ProductSearchService productSearchService;

    @GetMapping
    public ResponseEntity<ProductSearchResult> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        SearchCriteria criteria = new SearchCriteria(q, category, brand, minPrice, maxPrice, page, size);
        return ResponseEntity.ok(productSearchService.searchProducts(criteria));
    }
}
~~~

---

## 5. Kiểm thử & Xác thực Thực tế (cURL & Response Verification)

### Kiểm thử cURL Tìm kiếm Văn bản kèm Lọc và Phân trang

~~~bash
curl -X GET "http://localhost:8080/api/v1/products/search?q=macbok%20pro&category=LAPTOP&minPrice=1500&page=0&size=2" \
  -H "Accept: application/json"
~~~

Response Headers & JSON Body:
~~~json
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sat, 03 Oct 2026 10:15:30 GMT

{
  "totalHits": 142,
  "currentPage": 0,
  "pageSize": 2,
  "products": [
    {
      "id": "PROD-10992",
      "name": "<mark>MacBook</mark> <mark>Pro</mark> 16 inch M3 Max",
      "sku": "MBP-16-M3MAX-36GB",
      "category": "LAPTOP",
      "brand": "Apple",
      "price": 3499.00,
      "score": 8.412
    },
    {
      "id": "PROD-10995",
      "name": "<mark>MacBook</mark> <mark>Pro</mark> 14 inch M3 Pro",
      "sku": "MBP-14-M3PRO-18GB",
      "category": "LAPTOP",
      "brand": "Apple",
      "price": 1999.00,
      "score": 7.985
    }
  ],
  "categoryDistribution": {
    "LAPTOP": 142
  },
  "brandDistribution": {
    "Apple": 138,
    "Dell": 4
  }
}
~~~

### Giám sát Sức khỏe Cụm Elasticsearch qua Spring Boot Actuator

~~~bash
curl -X GET http://localhost:8080/actuator/health
~~~

Response Payload:
~~~json
{
  "status": "UP",
  "components": {
    "elasticsearch": {
      "status": "UP",
      "details": {
        "cluster_name": "ecommerce-search-cluster",
        "status": "GREEN",
        "timed_out": false,
        "number_of_nodes": 3,
        "number_of_data_nodes": 3,
        "active_primary_shards": 5,
        "active_shards": 10
      }
    }
  }
}
~~~

---

## 6. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Thảm họa Dual-Write (Lệch dữ liệu vĩnh viễn)

- **Triệu chứng**: Sau 3 tháng vận hành, phòng kinh doanh phản ánh có hàng ngàn sản phẩm đã tạo thành công trong hệ thống quản lý kho (PostgreSQL) nhưng khách hàng gõ từ khóa tìm kiếm trên Web lại không thấy.
- **Nguyên nhân cốt lõi**:
  Mã nguồn Service thực hiện ghi đồng thời 2 hệ thống trong cùng một phương thức:
  ~~~java
  @Transactional
  public void createProduct(ProductRequest request) {
      Product product = productRepository.save(toEntity(request)); // Ghi vào PostgreSQL
      elasticsearchOperations.save(toDocument(product));           // Ghi vào Elasticsearch trực tiếp
  }
  ~~~
  Vấn đề là: **Elasticsearch không tham gia vào Transaction của cơ sở dữ liệu quan hệ**. Nếu:
  1. Lệnh <code>save()</code> vào Elasticsearch gặp timeout hoặc mạng bị trập trùng trong 200ms -> ném ngoại lệ -> giao dịch DB bị rollback nhưng Elasticsearch đã nhận dữ liệu (Ghost Document).
  2. Ngược lại, nếu ES lưu thành công nhưng sau đó phương thức DB quăng lỗi hoặc ngắt kết nối mạng ngay lúc commit -> DB không có dữ liệu nhưng ES lại có.
  3. Khi cụm Elasticsearch bảo trì khởi động lại, các bản ghi tạo trong thời gian này bị mất dấu vết vĩnh viễn mà không có bất kỳ cơ chế bù trừ nào.
- **Giải pháp Chuẩn Enterprise: Transactional Outbox Pattern + Debezium CDC**:
  ~~~text
  +---------------------------------------------------------------------------------+
  |                       KIẾN TRÚC TRANSACTIONAL OUTBOX CDC                        |
  |                                                                                 |
  |   Client Request                                                                |
  |         |                                                                       |
  |         v                                                                       |
  |   [Spring Service]                                                              |
  |         |                                                                       |
  |         +--- 1. INSERT INTO products (...)           CÙNG MỘT TRANSACTION      |
  |         +--- 2. INSERT INTO outbox_events (...)    /  (ACID NGUYÊN TỬ)          |
  |         |                                                                       |
  |         v                                                                       |
  |   [PostgreSQL WAL (Write-Ahead-Log)]                                            |
  |         |                                                                       |
  |         v                                                                       |
  |   [Debezium CDC / Kafka Connect]                                                |
  |         |                                                                       |
  |         v                                                                       |
  |   [Kafka Topic: product-index-events]                                           |
  |         |                                                                       |
  |         v                                                                       |
  |   [Search Indexer Consumer] ---> ES Index Bulk Request (At-least-once)          |
  |                                  (Idempotent Upsert theo Product ID)            |
  +---------------------------------------------------------------------------------+
  ~~~

### Post-mortem 2: Quả bom Bộ nhớ Deep Paging (from + size > 10,000)

- **Triệu chứng**: Khi một Web Crawler tự động cào dữ liệu đến trang 500 của danh mục sản phẩm (<code>?page=500&size=25</code> tương ứng với <code>from=12500</code>), cụm Elasticsearch đồng loạt phát cảnh báo CPU 100%, sau đó một Data Node văng lỗi <code>OutOfMemoryError</code> và rớt khỏi cụm.
- **Nguyên nhân cốt lõi**:
  Trong cơ chế phân tán của Elasticsearch, một Index được chia thành nhiều Shard (ví dụ: 5 Shards). Khi nhận lệnh truy vấn <code>from=12500, size=25</code>:
  1. **Từng Shard độc lập** phải nạp và sắp xếp toàn bộ <code>12,525</code> documents hàng đầu vào RAM của nó.
  2. Coordinating Node nhận về <code>5 * 12,525 = 62,625</code> documents qua mạng nội bộ để thực hiện Global Merge Sort.
  3. Việc này tiêu tốn bộ nhớ khủng khiếp. Elasticsearch mặc định chặn lỗi này bằng tham số:
     ~~~text
     Result window is too large, from + size must be less than or equal to: [10000]
     ~~~
- **Giải pháp**:
  - Không bao giờ cho phép người dùng click pagination vượt quá trang 50 (giống Google Search chỉ giới hạn tối đa vài chục trang).
  - Với các tác vụ cuộn vô tận (Infinite Scroll) hoặc xuất dữ liệu lớn, bắt buộc phải sử dụng **Search After** kết hợp với **Point in Time (PIT)**:
    ~~~java
    // Thay vì dùng page, sử dụng giá trị sort của dòng cuối cùng trang trước làm con trỏ:
    queryBuilder.withSearchAfter(List.of(lastScore, lastId));
    ~~~

### Post-mortem 3: Zero-Downtime Index Migration qua Aliases

Trong Elasticsearch, khi cần thay đổi Analyzer (ví dụ: chuyển từ Standard Analyzer sang Vietnamese Tokenizer chuyên dụng) hoặc đổi kiểu dữ liệu của một trường, **bạn không thể sửa đổi Index Mapping tại chỗ**. Bạn bắt buộc phải tạo Index mới và chuyển dữ liệu sang (Reindex).

Nếu ứng dụng trỏ trực tiếp vào tên Index vật lý (<code>products_v1</code>), hệ thống sẽ phải dừng hoạt động (Downtime).

**Giải pháp Chuẩn Sản xuất: Sử dụng Index Aliases**:
1. Ứng dụng luôn luôn đọc và ghi thông qua Alias: <code>products_search</code>.
2. Khi cần nâng cấp Mapping:
   - Tạo Index mới: <code>products_v2</code> với cấu hình mapping mới.
   - Chạy lệnh Reindex từ <code>products_v1</code> sang <code>products_v2</code> trong background:
     ~~~bash
     POST _reindex
     {
       "source": { "index": "products_v1" },
       "dest": { "index": "products_v2" }
     }
     ~~~
   - Chuyển đổi con trỏ Alias sang <code>products_v2</code> và gỡ khỏi <code>products_v1</code> một cách nguyên tử (Zero-downtime):
     ~~~bash
     POST _aliases
     {
       "actions": [
         { "remove": { "index": "products_v1", "alias": "products_search" } },
         { "add":    { "index": "products_v2", "alias": "products_search" } }
       ]
     }
     ~~~
   - Xóa bỏ index cũ <code>products_v1</code> sau khi kiểm tra toàn vẹn.

---

## 7. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống tuyển dụng công nghệ cao cần xây dựng dịch vụ **Tìm kiếm Ứng viên Chuyên gia (Candidate Job Search Service)**:
1. Mỗi hồ sơ ứng viên (<code>CandidateProfileDoc</code>) gồm:
   - <code>id</code>: UUID.
   - <code>fullName</code>: Tên đầy đủ (Text, hỗ trợ tìm kiếm mờ).
   - <code>primaryRole</code>: Vị trí chuyên môn (Keyword, ví dụ: "JAVA_BACKEND", "DEVOPS").
   - <code>skills</code>: Danh sách kỹ năng (Keyword, ví dụ: ["Java", "Spring Boot", "Kafka", "PostgreSQL"]).
   - <code>yearsOfExperience</code>: Số năm kinh nghiệm (Integer).
   - <code>expectedSalaryUsd</code>: Mức lương mong muốn (Double).
   - <code>availableForRelocation</code>: Trạng thái sẵn sàng di chuyển (Boolean).
2. Xây dựng dịch vụ tìm kiếm thỏa mãn:
   - Tìm kiếm theo từ khóa (kỹ năng hoặc chức danh) với độ ưu tiên chức danh cao hơn.
   - Bắt buộc lọc theo số năm kinh nghiệm tối thiểu và trần lương tối đa.
   - Trả về danh sách ứng viên phù hợp kèm **Aggregation thống kê số lượng ứng viên theo từng Kỹ năng (Skills Facet)** để Recruiter dễ dàng bấm chọn.
   - Xây dựng Consumer nhận thông điệp từ Kafka Outbox để tự động đồng bộ hóa hồ sơ từ Database sang Elasticsearch.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.recruitment.search.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.util.List;

@Document(indexName = "candidates_v1", createIndex = false)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateProfileDoc {

    @Id
    private String id;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String fullName;

    @Field(type = FieldType.Keyword)
    private String primaryRole;

    @Field(type = FieldType.Keyword)
    private List<String> skills;

    @Field(type = FieldType.Integer)
    private Integer yearsOfExperience;

    @Field(type = FieldType.Double)
    private Double expectedSalaryUsd;

    @Field(type = FieldType.Boolean)
    private Boolean availableForRelocation;
}
~~~

~~~java
package com.recruitment.search.service;

import co.elastic.clients.elasticsearch._types.aggregations.StringTermsBucket;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.QueryBuilders;
import com.recruitment.search.document.CandidateProfileDoc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchAggregation;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.client.elc.NativeQueryBuilder;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateSearchService {

    private final ElasticsearchOperations elasticsearchOperations;

    public CandidateSearchResult searchCandidates(CandidateFilterCriteria filter) {
        NativeQueryBuilder queryBuilder = NativeQuery.builder();
        BoolQuery.Builder boolQuery = QueryBuilders.bool();

        // 1. MUST: Full-Text matching trên chức danh và kỹ năng
        if (filter.keyword() != null && !filter.keyword().isBlank()) {
            boolQuery.must(QueryBuilders.multiMatch(m -> m
                .query(filter.keyword())
                .fields("fullName^1", "primaryRole^3", "skills^2")
                .fuzziness("AUTO")
            ));
        } else {
            boolQuery.must(QueryBuilders.matchAll(m -> m));
        }

        // 2. FILTER: Kinh nghiệm, mức lương, relocation
        if (filter.minExperience() != null) {
            boolQuery.filter(QueryBuilders.range(r -> r
                .field("yearsOfExperience")
                .gte(co.elastic.clients.json.JsonData.of(filter.minExperience()))
            ));
        }

        if (filter.maxSalary() != null) {
            boolQuery.filter(QueryBuilders.range(r -> r
                .field("expectedSalaryUsd")
                .lte(co.elastic.clients.json.JsonData.of(filter.maxSalary()))
            ));
        }

        if (filter.availableOnly() != null && filter.availableOnly()) {
            boolQuery.filter(QueryBuilders.term(t -> t.field("availableForRelocation").value(true)));
        }

        queryBuilder.withQuery(boolQuery.build()._toQuery());

        // 3. AGGREGATION: Thống kê số ứng viên theo từng Skill
        queryBuilder.withAggregation("skills_distribution",
            co.elastic.clients.elasticsearch._types.aggregations.Aggregation.of(a ->
                a.terms(t -> t.field("skills").size(20))));

        // 4. Phân trang
        queryBuilder.withPageable(PageRequest.of(filter.page(), filter.size()));

        SearchHits<CandidateProfileDoc> hits = elasticsearchOperations.search(queryBuilder.build(), CandidateProfileDoc.class);

        List<CandidateResponseItem> candidates = hits.getSearchHits().stream().map(h -> {
            CandidateProfileDoc doc = h.getContent();
            return new CandidateResponseItem(
                doc.getId(),
                doc.getFullName(),
                doc.getPrimaryRole(),
                doc.getSkills(),
                doc.getYearsOfExperience(),
                doc.getExpectedSalaryUsd(),
                h.getScore()
            );
        }).collect(Collectors.toList());

        Map<String, Long> skillFacet = new LinkedHashMap<>();
        if (hits.getAggregations() != null) {
            ElasticsearchAggregation agg = (ElasticsearchAggregation) hits.getAggregations().get("skills_distribution");
            if (agg != null && agg.aggregation() != null) {
                var terms = agg.aggregation().getAggregate().sterms();
                if (terms != null && terms.buckets() != null) {
                    for (StringTermsBucket b : terms.buckets().array()) {
                        skillFacet.put(b.key().stringValue(), b.docCount());
                    }
                }
            }
        }

        return new CandidateSearchResult(
            hits.getTotalHits(),
            filter.page(),
            filter.size(),
            candidates,
            skillFacet
        );
    }

    public record CandidateFilterCriteria(
        String keyword,
        Integer minExperience,
        Double maxSalary,
        Boolean availableOnly,
        int page,
        int size
    ) {}

    public record CandidateResponseItem(
        String id,
        String fullName,
        String primaryRole,
        List<String> skills,
        Integer experienceYears,
        Double expectedSalary,
        float matchScore
    ) {}

    public record CandidateSearchResult(
        long totalCandidates,
        int page,
        int size,
        List<CandidateResponseItem> candidates,
        Map<String, Long> topSkillsBreakdown
    ) {}
}
~~~

~~~java
package com.recruitment.search.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.recruitment.search.document.CandidateProfileDoc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class CandidateOutboxSyncConsumer {

    private final ElasticsearchOperations elasticsearchOperations;
    private final ObjectMapper objectMapper;

    @KafkaListener(
        topics = "candidate-cdc-events",
        groupId = "candidate-search-indexer",
        concurrency = "3"
    )
    public void onCandidateEvent(String messagePayload, Acknowledgment ack) {
        try {
            CandidateCdcEvent event = objectMapper.readValue(messagePayload, CandidateCdcEvent.class);
            log.info("Received candidate CDC event: type={}, candidateId={}", event.eventType(), event.candidateId());

            switch (event.eventType()) {
                case "CREATED", "UPDATED" -> {
                    CandidateProfileDoc doc = CandidateProfileDoc.builder()
                        .id(event.candidateId())
                        .fullName(event.fullName())
                        .primaryRole(event.primaryRole())
                        .skills(event.skills())
                        .yearsOfExperience(event.yearsOfExperience())
                        .expectedSalaryUsd(event.expectedSalaryUsd())
                        .availableForRelocation(event.availableForRelocation())
                        .build();

                    elasticsearchOperations.save(doc);
                    log.info("Successfully indexed candidate document: id={}", event.candidateId());
                }
                case "DELETED" -> {
                    elasticsearchOperations.delete(event.candidateId(), CandidateProfileDoc.class);
                    log.info("Successfully removed candidate from index: id={}", event.candidateId());
                }
                default -> log.warn("Unknown event type: {}", event.eventType());
            }

            // Commit Kafka Offset an toàn sau khi đã index thành công
            ack.acknowledge();
        } catch (Exception e) {
            log.error("Failed to process candidate CDC message: {}", messagePayload, e);
            throw new RuntimeException("Triggering Kafka retry for event", e);
        }
    }

    public record CandidateCdcEvent(
        String eventType,
        String candidateId,
        String fullName,
        String primaryRole,
        List<String> skills,
        Integer yearsOfExperience,
        Double expectedSalaryUsd,
        Boolean availableForRelocation
    ) {}
}
~~~

:::takeaways
- **LIKE %...% Quét Toàn Bảng**: Dấu wildcard ở đầu vô hiệu hóa B-Tree index, biến mọi câu truy vấn thành Sequential Scan làm tê liệt database.
- **Sức Mạnh Của Inverted Index**: Elasticsearch dùng Term Dictionary kết hợp Posting List và giải thuật BM25 để tra cứu O(1) và chấm điểm mức độ liên quan văn bản cực nhanh.
- **Ranh Giới Giữa PostgreSQL pg_trgm & Elasticsearch**: Dùng <code>pg_trgm</code> cho các hệ thống nhỏ dưới 1-2 triệu dòng cần hạ tầng đơn giản; chuyển sang Elasticsearch khi cần tìm kiếm toàn văn chuyên sâu, faceted search, aggregation đa chiều và auto-complete.
- **Bắt Buộc Phân Biệt Text và Keyword**: <code>Text</code> bị phân tách qua Analysis Pipeline dùng cho Full-Text Search; <code>Keyword</code> giữ nguyên chuỗi dùng cho Exact Match, Filter, Sort và Aggregations.
- **Nghiêm Cấm Dual-Write Trực Tiếp**: Không bao giờ đồng thời ghi Database và Elasticsearch trong cùng một method; bắt buộc dùng Transactional Outbox Pattern kết hợp Debezium/Kafka CDC để đảm bảo Eventual Consistency.
- **Chống Sập Bộ Nhớ Do Deep Paging**: Giới hạn phân trang người dùng hoặc chuyển sang kỹ thuật <code>Search After</code> với Point-in-Time (PIT) để thay thế <code>from + size &gt; 10,000</code>.
- **Zero-Downtime Index Aliases**: Ứng dụng luôn trỏ tới Alias thay vì Index vật lý, cho phép Reindex và nâng cấp schema dữ liệu ngầm mà không gây gián đoạn hệ thống.
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
          scenario: "Dev gọi order.getItems().remove(0) để xóa một dòng sản phẩm khỏi đơn hàng, sau đó gọi orderRepo.save(order). Tuy nhiên khi kiểm tra database, dòng sản phẩm đó VẪN TỒN TẠI trong bảng order_items.",
          q: "Nguyên nhân vì sao và cấu hình nào giải quyết vấn đề này?",
          options: [
            "Cần thêm CascadeType.REMOVE vào @OneToMany",
            "Thiếu orphanRemoval = true trên @OneToMany — CascadeType.REMOVE chỉ xóa con khi xóa cả cha, còn gỡ item khỏi collection cần orphanRemoval",
            "Do transaction chưa commit, cần gọi entityManager.flush()",
            "Cần đổi List thành Set để Hibernate nhận diện thay đổi"
          ],
          answer: 1,
          explain: "CascadeType.REMOVE chỉ kích hoạt khi thực hiện xóa Entity cha (orderRepo.delete). Khi xóa phần tử mồ côi (orphan) ra khỏi danh sách con trong RAM mà muốn DB tự phát sinh lệnh DELETE, bắt buộc phải có orphanRemoval = true.",
          why: [
            "CascadeType.REMOVE chỉ ăn theo khi DELETE Order — xóa item khỏi list không kích hoạt cascade remove.",
            "✓ Đúng — orphanRemoval = true chuyên trị trường hợp phần tử con bị ngắt liên kết khỏi cha, Hibernate sẽ tự động bắn câu lệnh DELETE.",
            "Transaction commit vẫn không xóa nếu Hibernate không coi item đó là orphan cần xóa.",
            "List hay Set không thay đổi bản chất cascade — thiếu orphanRemoval thì Hibernate chỉ UPDATE order_id = null (nếu nullable) hoặc không làm gì."
          ]
        },
        {
          level: "hard",
          scenario: "Sau khi dev thêm annotation @Data của Lombok lên hai Entity Order và OrderItem có quan hệ 2 chiều, API GET /orders/1 bị crash với lỗi java.lang.StackOverflowError và log server in lặp vô tận.",
          q: "Nguyên nhân gốc rễ và cách khắc phục chuẩn Enterprise?",
          options: [
            "Do database bị đệ quy vòng lặp foreign key — cần xóa constraint foreign key",
            "Lombok @Data tự sinh toString/equals/hashCode và Jackson serialize duyệt ngược xuôi 2 chiều vô tận. Khắc phục: Dùng DTO/Record cho REST response và thay @Data bằng @Getter/@Setter",
            "Cần tăng dung lượng stack JVM (-Xss10m) để xử lý đệ quy sâu",
            "Chuyển toàn bộ quan hệ sang EAGER fetching"
          ],
          answer: 1,
          explain: "Quan hệ 2 chiều Order ↔ OrderItem khiến Jackson và Lombok toString()/hashCode() gọi chéo nhau vô hạn → StackOverflow. Chuẩn Enterprise: không bao giờ expose Entity ra REST API (dùng DTO), và không dùng @Data trên JPA Entity (chỉ dùng @Getter, @Setter).",
          why: [
            "Database foreign key là quan hệ vật lý, không tự chạy code đệ quy trong bộ nhớ JVM.",
            "✓ Đúng — tách bạch rõ rệt: Entity dùng @Getter/@Setter, response trả về DTO/Record độc lập, chấm dứt hoàn toàn loop serialize.",
            "Tăng -Xss chỉ kéo dài thời gian trước khi sập — đệ quy vô hạn thì stack bao nhiêu cũng sẽ cạn.",
            "EAGER fetching không giải quyết vòng lặp, ngược lại còn khiến Hibernate load toàn bộ database vào RAM trước khi crash."
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
