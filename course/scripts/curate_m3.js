const fs = require('fs');
const path = require('path');

global.window = { COURSE_MODULES: [] };
const m3Path = path.join(__dirname, '..', 'js', 'content', 'module3.js');
new Function('window', fs.readFileSync(m3Path, 'utf8'))(window);
const oldM3 = window.COURSE_MODULES[0];

const topics = [
  { id: 1, title: "Hibernate Internals & Entity Mapping", desc: "Persistence Context, Dirty Checking, First-level Cache, quan hệ Entity và JPA Auditing." },
  { id: 2, title: "N+1 Problem & Fetch Strategies", desc: "Căn nguyên lỗi N+1 Query, giải pháp JOIN FETCH, @EntityGraph và tối ưu DTO Projection." },
  { id: 3, title: "Transactions & Concurrency Locking", desc: "Transaction Isolation, Propagation, Khóa lạc quan @Version và Khóa bi quan chống bán âm kho." },
  { id: 4, title: "Database Migration & Batch Processing", desc: "Quản trị schema với Flyway, tối ưu hóa Hibernate Batch Insert và full-text search." }
];

const outcomes = [
  "Làm chủ vòng đời Persistence Context, First-level Cache và cơ chế Dirty Checking tự động",
  "Triệt tiêu 100% lỗi Hibernate N+1 bằng JOIN FETCH, EntityGraph và Dynamic DTO Projection",
  "Thiết lập Transaction Isolation, Pessimistic/Optimistic Locking chống tranh chấp bán âm Flash Sale",
  "Tự động hóa Migration cơ sở dữ liệu với Flyway và tối ưu Batch Insert hàng trăm nghìn bản ghi"
];

const retrievalWarmup = [
  {
    question: "Trong Module 2, cấu trúc chuẩn hóa cho phản hồi lỗi HTTP theo đặc tả RFC 7807 (ProblemDetails) gồm những trường tối thiểu nào?",
    options: [
      "type, title, status, detail, instance",
      "success, error_code, error_message, timestamp",
      "code, message, data, traceId",
      "status, errors, exceptions, stackTrace"
    ],
    answer: 0,
    explain: "RFC 7807 chuẩn hóa cấu trúc HTTP ProblemDetails: type (URI loại lỗi), title (tiêu đề ngắn), status (HTTP status code), detail (chi tiết lỗi người dùng), instance (URI endpoint gặp sự cố).",
    targetLessonId: "2-2-1"
  },
  {
    question: "Tại sao trên bảng dữ liệu lớn hàng chục triệu dòng, thuật toán Keyset Pagination (Seek Method) lại vượt trội hoàn toàn so với Offset Pagination?",
    options: [
      "Keyset Pagination tận dụng B-Tree Index (WHERE id > :lastId LIMIT N) với độ phức tạp O(log N), không cần quét và bỏ qua hàng triệu bản ghi trước đó như OFFSET",
      "Keyset Pagination nén dữ liệu trong bộ nhớ RAM của Spring Boot",
      "Keyset Pagination tự động chuyển cơ sở dữ liệu sang chạy In-memory",
      "Keyset Pagination loại bỏ hoàn toàn câu lệnh SQL"
    ],
    answer: 0,
    explain: "OFFSET N yêu cầu database đọc tuần tự qua N dòng rồi vứt bỏ, gây tốn I/O đĩa khủng khiếp. Keyset pagination nhảy thẳng đến vị trí bản ghi tiếp theo nhờ index.",
    targetLessonId: "2-4-1"
  },
  {
    question: "Tại sao thư viện MapStruct lại mang lại hiệu năng chuyển đổi giữa DTO và Entity cao gấp hàng chục lần so với ModelMapper?",
    options: [
      "MapStruct sinh mã nguồn Java thuần (Getter/Setter) tại thời điểm biên dịch compile-time, hoàn toàn không sử dụng Reflection lúc runtime",
      "MapStruct chạy trên thread riêng biệt của hệ điều hành",
      "MapStruct lưu trữ toàn bộ DTO vào Redis Cache",
      "MapStruct sử dụng trí tuệ nhân tạo để đoán trường dữ liệu"
    ],
    answer: 0,
    explain: "MapStruct là một Annotation Processor sinh code Java thuần lúc biên dịch. Khi chạy, tốc độ mapping của nó tương đương với việc lập trình viên tự gõ tay getter/setter.",
    targetLessonId: "2-3-1"
  }
];

const getL = (id) => oldM3.lessons.find(l => l.id === id);

// Topic 1: 3-1-1 to 3-1-4 (Consolidates 3-1, 3-5, 3-7)
const t1_l1 = {
  id: "3-1-1",
  type: "theory",
  title: "Bài 3.1.1: Kiến trúc Persistence Context, Dirty Checking & Vòng đời Entity JPA",
  minutes: 8,
  content: getL("3-1-1").content + "\n\n" + getL("3-1-2").content + "\n\n" + getL("3-7-2").content
};

const t1_l2 = {
  id: "3-1-2",
  type: "practice",
  title: "Bài 3.1.2: Thiết kế Quan hệ Entity Chuẩn: OneToMany, ManyToOne & JPA Auditing",
  minutes: 7,
  content: getL("3-1-3").content + "\n\n" + getL("3-7-7").content
};

const t1_l3 = {
  id: "3-1-3",
  type: "pitfall",
  title: "Bài 3.1.3: Cạm bẫy Lombok @Data Làm Hỏng HashCode/Equals & CascadeType.REMOVE Nguy Hiểm",
  minutes: 7,
  content: getL("3-1-5").content + "\n\n" + getL("3-7-5").content + "\n\n" + getL("3-7-8").content
};

const t1_l4 = {
  id: "3-1-4",
  type: "synthesis",
  title: "Bài 3.1.4: Milestone Synthesis: Bản đồ Vòng đời Entity & Ma trận Thiết kế Quan hệ JPA",
  minutes: 8,
  content: `## Milestone Synthesis: Tổng Hợp Kiến Trúc Hibernate & Quan Hệ Entity

### 1. Sơ Đồ Kiến Trúc: 4 Trạng Thái Vòng Đời Của Entity Trong Persistence Context

\`\`\`mermaid
stateDiagram-v2
    [*] --> Transient: new Entity() (Chưa có ID, chưa quản lý)
    Transient --> Managed: em.persist() / repository.save()
    Managed --> Detached: em.detach() / em.close() / Transaction Commit
    Detached --> Managed: em.merge()
    Managed --> Removed: em.remove() / repository.delete()
    Removed --> [*]: Transaction Commit (DELETE SQL phát sinh)
    
    note right of Managed
        Trạng thái DUY NHẤT được:
        • First-Level Cache lưu trữ
        • Dirty Checking tự động sinh UPDATE SQL khi đổi biến
        • Lazy Loading các quan hệ liên kết
    end note
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Thiết Kế Quan Hệ Entity Trong JPA

| Kiểu quan hệ | Bên sở hữu (Owner) | Khuyến nghị thiết kế thực chiến | Cạm bẫy chết người cần tránh |
|---|---|---|---|
| **ManyToOne** | Phía N (Chứa Foreign Key) | **Luôn đặt \`fetch = FetchType.LAZY\`** | Mặc định là EAGER $\rightarrow$ Gây N+1 âm thầm |
| **OneToMany** | Phía 1 (mappedBy) | Dùng \`Set<Child>\` hoặc \`List\` có quan hệ rõ ràng | Cấm dùng \`CascadeType.REMOVE\` trên bảng lớn |
| **ManyToMany** | Một trong hai bên | **KHÔNG DÙNG @ManyToMany trực tiếp**; hãy tách thành Entity trung gian (\`OrderItem\`) với 2 \`@ManyToOne\` | Bảng trung gian không thể lưu thêm thuộc tính nghiệp vụ (giá, ngày mua) |
| **OneToOne** | Bên chứa Foreign Key | Bắt buộc \`fetch = FetchType.LAZY\` và mappedBy | Phía không sở hữu luôn bị ép fetch EAGER |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Tuyệt đối cấm Lombok \`@Data\` trên Entity**: \`@Data\` tự sinh \`equals()\` và \`hashCode()\` duyệt qua mọi field, gây đệ quy vô hạn \`StackOverflowError\` khi có quan hệ 2 chiều và làm hỏng HashSet/HashMap của Hibernate. Chỉ dùng \`@Getter\`, \`@Setter\` và tự implement equals dựa trên Business Key (hoặc UUID).
2. **Cơ chế Dirty Checking**: Trong transaction, bạn chỉ cần thay đổi giá trị bằng setter; khi commit, Hibernate tự so sánh snapshot và sinh câu \`UPDATE\` SQL mà không cần gọi \`repository.save()\`.
3. **Mặc định LAZY cho mọi quan hệ**: Không bao giờ để FetchType.EAGER trên \`@ManyToOne\` hoặc \`@OneToOne\`.`
};

// Topic 2: 3-2-1 to 3-2-4
const t2_l1 = {
  id: "3-2-1",
  type: "theory",
  title: "Bài 3.2.1: Bản chất Lỗi N+1 Query & So Sánh 3 Chiến Lược Triệt Tiêu N+1",
  minutes: 8,
  content: getL("3-2-1").content + "\n\n" + getL("3-2-2").content
};

const t2_l2 = {
  id: "3-2-2",
  type: "practice",
  title: "Bài 3.2.2: Triển khai JOIN FETCH, @EntityGraph & Interface-based DTO Projection",
  minutes: 8,
  content: getL("3-2-3").content + "\n\n" + getL("3-2-4").content
};

const t2_l3 = {
  id: "3-2-3",
  type: "pitfall",
  title: "Bài 3.2.3: Cạm bẫy MultipleBagFetchException & Cố Tình Dùng EAGER Để Tránh N+1",
  minutes: 7,
  content: getL("3-2-5").content + "\n\n" + getL("3-2-6").content
};

const t2_l4 = {
  id: "3-2-4",
  type: "synthesis",
  title: "Bài 3.2.4: Milestone Synthesis: Bản đồ Tối Ưu Truy Vấn JPA & Ma trận Fetch Strategies",
  minutes: 8,
  content: `## Milestone Synthesis: Triệt Tiêu Lỗi Hibernate N+1 & Tối Ưu Tải Dữ Liệu

### 1. Sơ Đồ Kiến Trúc: Cơ Chế Phát Sinh Lỗi N+1 Query vs Giải Pháp JOIN FETCH

\`\`\`mermaid
flowchart TD
    subgraph BadWay ["Thảm Họa N+1 (Mặc Định / Lazy Traversal)"]
        Q1["1 Câu Query Cha: SELECT * FROM orders (Trả về 100 orders)"] --> Loop["Lặp 100 lần trong Service: order.getCustomer().getName()"]
        Loop --> NQueries["Phát sinh 100 câu Query con: SELECT * FROM customers WHERE id = ?"]
        NQueries --> Bomb["Tổng: 1 + 100 = 101 Queries! Sập Database khi có 10,000 orders!"]
    end

    subgraph GoodWay ["Giải Pháp JOIN FETCH / EntityGraph / DTO Projection"]
        FixQ["1 Câu Query Duy Nhất: SELECT o FROM Order o JOIN FETCH o.customer"] --> SingleResult["Database trả về toàn bộ dữ liệu kết hợp trong đúng 1 lượt I/O!"]
    end

    style BadWay fill:#7f1d1d,stroke:#ef4444,color:#fff
    style GoodWay fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Lựa Chọn Phương Án Giải Quyết N+1

| Giải pháp | JOIN FETCH (JPQL) | @EntityGraph (Spring Data) | DTO Projection (Constructor / Interface) |
|---|---|---|---|
| **Cơ chế** | Viết trực tiếp \`JOIN FETCH\` trong câu JPQL | Khai báo annotation trên method repository | Chỉ SELECT các cột cần thiết trực tiếp vào DTO |
| **Quản lý Entity** | Entity trả về nằm trong Persistence Context | Entity trả về nằm trong Persistence Context | **Read-only**, không tốn bộ nhớ lưu Entity snapshot |
| **Phân trang (Pagination)** | **CẤM DÙNG với quan hệ ToMany** (gây In-memory paging) | Hạn chế với ToMany | **Tối ưu tuyệt đối** (Hỗ trợ phân trang an toàn) |
| **Khuyến nghị** | Dùng khi cần cập nhật dữ liệu của cả cha và con | Dùng cho các query đơn giản của Spring Data | **Khuyến nghị số 1 cho 100% màn hình hiển thị/đọc** |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Hiểu lầm về EAGER**: Đổi sang \`FetchType.EAGER\` KHÔNG giải quyết được N+1 khi dùng JPQL (\`findAll()\`), ngược lại còn khiến Hibernate luôn tự động query join kể cả khi nghiệp vụ không cần.
2. **Cạm bẫy \`MultipleBagFetchException\`**: Hibernate cấm JOIN FETCH cùng lúc 2 collection kiểu \`java.util.List\` (Bag) vì tạo ra tích đề-các (Cartesian Product) khổng lồ làm nổ memory. Giải pháp: đổi sang \`Set\` hoặc chia làm 2 query riêng biệt.
3. **DTO Projection là cứu tinh**: Khi viết API trả về danh sách, luôn dùng DTO Projection (\`SELECT new com.app.dto.OrderSummaryDTO(...) FROM Order o\`) để giảm 80% RAM và tăng tốc 5x.`
};

// Topic 3: 3-3-1 to 3-3-4
const t3_l1 = {
  id: "3-3-1",
  type: "theory",
  title: "Bài 3.3.1: Kiến trúc Transaction Isolation, Propagation & Mô hình Concurrency Locking",
  minutes: 8,
  content: getL("3-3-1").content + "\n\n" + getL("3-3-2").content
};

const t3_l2 = {
  id: "3-3-2",
  type: "practice",
  title: "Bài 3.3.2: Triển khai Optimistic Locking @Version & Pessimistic Write Lock Chống Bán Âm Kho",
  minutes: 8,
  content: getL("3-3-3").content + "\n\n" + getL("3-3-4").content
};

const t3_l3 = {
  id: "3-3-3",
  type: "pitfall",
  title: "Bài 3.3.3: Cạm bẫy Deadlock Database, Lost Update & Nuốt Ngoại lệ Làm Hỏng Rollback",
  minutes: 7,
  content: getL("3-3-5").content + "\n\n" + getL("3-3-6").content
};

const t3_l4 = {
  id: "3-3-4",
  type: "synthesis",
  title: "Bài 3.3.4: Milestone Synthesis: Bản đồ Transaction & Ma trận Lựa Chọn Khóa Đồng Thời (Locking)",
  minutes: 8,
  content: `## Milestone Synthesis: Transaction Isolation & Concurrency Control

### 1. Sơ Đồ Kiến Trúc: Pessimistic Write Lock Trong Nghiệp Vụ Flash Sale (Chống Bán Âm)

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor T1 as Thread 1 (User A Mua Cuối Cùng)
    actor T2 as Thread 2 (User B Cùng Bấm Mua)
    participant DB as PostgreSQL Database Engine (Row-Level Lock)

    T1->>DB: BEGIN TRANSACTION
    T2->>DB: BEGIN TRANSACTION
    
    T1->>DB: SELECT * FROM products WHERE id = 1 FOR UPDATE (PESSIMISTIC_WRITE)
    activate DB
    Note over DB: PostgreSQL cấp Khóa Độc Quyền (Exclusive Row Lock) cho Thread 1!
    
    T2->>DB: SELECT * FROM products WHERE id = 1 FOR UPDATE
    Note over T2,DB: Thread 2 BỊ TREO CHỜ (BLOCKED) tại tầng Database!
    
    T1->>DB: Kiểm tra stock = 1 >= 1 -> UPDATE products SET stock = 0 WHERE id = 1
    T1->>DB: COMMIT TRANSACTION
    deactivate DB
    Note over DB: Khóa hàng được giải phóng!
    
    activate DB
    DB-->>T2: Thread 2 được tiếp tục: Đọc thấy stock = 0!
    T2->>T2: Phát hiện hết hàng -> Ném OutOfStockException!
    T2->>DB: ROLLBACK TRANSACTION
    deactivate DB
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Lựa Chọn Cơ Chế Kiểm Soát Đồng Thời (Locking)

| Tiêu chí | Khóa Lạc Quan (Optimistic @Version) | Khóa Bi Quan (Pessimistic Write Lock) | Atomic Conditional Update |
|---|---|---|---|
| **Cơ chế hoạt động** | Cột \`version\`, kiểm tra \`WHERE version = :old\` | \`SELECT ... FOR UPDATE\` khóa hàng tại DB | \`UPDATE ... WHERE stock >= :qty\` |
| **Mức độ tranh chấp** | Tranh chấp thấp đến trung bình (Low contention) | **Tranh chấp cực cao (High contention - Flash Sale)** | Tranh chấp cao cho các phép toán số học |
| **Chi phí tài nguyên** | Không tốn lock DB, nhưng tốn CPU retry khi văng lỗi | Chiếm giữ connection và lock DB, có nguy cơ deadlock | **Tối ưu nhất, 1 câu SQL duy nhất** |
| **Xử lý khi xung đột** | Ném \`OptimisticLockException\`, cần client retry | Request đến sau xếp hàng chờ request trước commit | Trả về số dòng cập nhật = 0 nếu không đủ điều kiện |
| **Khuyến nghị sử dụng** | Chỉnh sửa hồ sơ cá nhân, cập nhật tài liệu | Thanh toán ngân hàng, trừ số dư ví điện tử | Trừ tồn kho sản phẩm Flash Sale |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Cấm nuốt Exception trong \`@Transactional\`**: Nếu bắt lỗi \`try-catch\` mà không ném lại \`RuntimeException\`, Spring coi như phương thức thành công và **vẫn commit dữ liệu sai**.
2. **Thứ tự khóa chống Deadlock**: Khi cần khóa nhiều bản ghi (ví dụ chuyển tiền từ ví A sang ví B), luôn sắp xếp khóa theo ID tăng dần (\`idA < idB\`) để loại trừ 100% nguy cơ Deadlock chéo luồng.
3. **Transaction Timeout**: Luôn thiết lập timeout (\`@Transactional(timeout = 5)\`) cho các nghiệp vụ dùng Pessimistic Lock để tránh treo thread vô tận khi database bị nghẽn.`
};

// Topic 4: 3-4-1 to 3-4-4 (Consolidates 3-4, 3-6, 3-8)
const t4_l1 = {
  id: "3-4-1",
  type: "theory",
  title: "Bài 3.4.1: Kiến trúc Database Migration Không Gián Đoạn (Flyway) & Batch Processing Triệu Bản Ghi",
  minutes: 8,
  content: getL("3-4-1").content + "\n\n" + getL("3-4-2").content + "\n\n" + getL("3-6-1").content
};

const t4_l2 = {
  id: "3-4-2",
  type: "practice",
  title: "Bài 3.4.2: Cấu hình Flyway Versioning & Tối Ưu Hibernate Batch Insert jdbc.batch_size",
  minutes: 8,
  content: getL("3-4-3").content + "\n\n" + getL("3-6-3").content
};

const t4_l3 = {
  id: "3-4-3",
  type: "pitfall",
  title: "Bài 3.4.3: Cạm bẫy Sửa File Migration Đã Chạy, GenerationType.IDENTITY Vô Hiệu Hóa Batch",
  minutes: 7,
  content: getL("3-4-5").content + "\n\n" + getL("3-6-5").content
};

const t4_l4 = {
  id: "3-4-4",
  type: "synthesis",
  title: "Bài 3.4.4: Milestone Synthesis: Bản đồ Database Operations & Ma trận Di Trú Schema Production",
  minutes: 8,
  content: `## Milestone Synthesis: Quản Trị Schema Flyway & Vận Hành Database Lớn

### 1. Sơ Đồ Kiến Trúc: Quy Trình Di Trú Schema Không Gián Đoạn (Zero-Downtime Migration)

\`\`\`mermaid
flowchart TD
    Step1["Bước 1: Expand (Mở rộng)<br/>Thêm cột mới 'full_name' nullable bằng Flyway V2"] --> Step2["Bước 2: Dual-Write<br/>Code Spring Boot phiên bản mới ghi vào cả cột cũ và cột mới"]
    Step2 --> Step3["Bước 3: Backfill Data<br/>Chạy batch script ngầm đồng bộ dữ liệu cũ sang cột mới"]
    Step3 --> Step4["Bước 4: Switch Read<br/>Chuyển mã đọc hoàn toàn sang cột 'full_name'"]
    Step4 --> Step5["Bước 5: Contract (Thu hẹp)<br/>Flyway V3 xóa bỏ cột cũ an toàn mà không làm gián đoạn hệ thống!"]
    
    style Step1 fill:#1e293b,stroke:#3b82f6,color:#fff
    style Step5 fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Quản Lý Schema Cơ Sở Dữ Liệu

| Tiêu chuẩn | Flyway Migration | Liquibase | Hibernate ddl-auto=update |
|---|---|---|---|
| **Cú pháp định nghĩa** | **SQL thuần túy** (Dễ đọc, kiểm soát 100% index/query) | XML, YAML, JSON hoặc SQL | Tự động sinh từ Entity Java |
| **Khả năng rollback** | Hỗ trợ qua file migration mới (Forward-only) | Hỗ trợ thẻ rollback tự động | Không hỗ trợ rollback |
| **Kiểm soát môi trường** | Theo dõi chặt chẽ qua bảng \`flyway_schema_history\` | Theo dõi qua bảng \`DATABASECHANGELOG\` | Mù mờ, không ai biết schema đang ở version nào |
| **Mức độ an toàn** | **Rất an toàn trên production** | Rất an toàn trên production | **THẢM HỌA: CẤM DÙNG trên production** |
| **Khuyến nghị** | **Tiêu chuẩn số 1 cho lập trình viên Backend** | Phù hợp khi cần hỗ trợ đa database dialect | Chỉ dùng cho đồ án sinh viên hoặc prototype |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Quy tắc bất biến Flyway**: Một file migration (ví dụ \`V1__init.sql\`) khi đã commit và chạy trên dev/staging thì **tuyệt đối không được sửa đổi nội dung**. Mọi thay đổi phải tạo file version mới (\`V2__add_index.sql\`).
2. **Cạm bẫy \`GenerationType.IDENTITY\`**: Khi dùng chiến lược IDENTITY (auto-increment cột ID), Hibernate buộc phải phát sinh lệnh INSERT tức thì để lấy ID về, dẫn đến **vô hiệu hóa hoàn toàn tính năng JDBC Batching**. Để batch insert hàng nghìn bản ghi, bắt buộc phải dùng \`GenerationType.SEQUENCE\` có cấp phát allocationSize.
3. **Giải phóng Persistence Context trong Batch**: Khi xử lý 100,000 bản ghi, cứ sau mỗi 50 bản ghi phải gọi \`entityManager.flush()\` và \`entityManager.clear()\` để tránh tràn bộ nhớ Heap.`
};

// 4 Additional Quiz Questions for Module 3 (12 + 4 = 16 questions)
const additionalQuestions = [
  {
    level: "hard",
    scenario: "Một hệ thống thanh toán sử dụng Hibernate để batch insert 100,000 bản ghi đơn hàng. Lập trình viên đã cấu hình 'spring.jpa.properties.hibernate.jdbc.batch_size=50' nhưng khi kiểm tra log SQL thì Hibernate vẫn thực thi 100,000 câu lệnh INSERT đơn lẻ.",
    q: "Nguyên nhân kỹ thuật nào khiến cơ chế JDBC Batching của Hibernate bị vô hiệu hóa trong trường hợp này?",
    options: [
      "Entity đang sử dụng khóa chính với chiến lược @GeneratedValue(strategy = GenerationType.IDENTITY); Hibernate bắt buộc phải thực thi INSERT ngay lập tức để lấy generated ID từ database",
      "Do cơ sở dữ liệu PostgreSQL không hỗ trợ batch insert",
      "Do lập trình viên chưa cài đặt Redis làm bộ nhớ đệm",
      "Do Spring Boot 3 đã ngừng hỗ trợ thuộc tính jdbc.batch_size"
    ],
    answer: 0,
    explain: "Chiến lược GenerationType.IDENTITY dựa vào cột tự tăng của database. Để lấy được ID gán vào object Managed, Hibernate không thể gom batch mà phải bắn từng câu INSERT một. Giải pháp là chuyển sang GenerationType.SEQUENCE (hoặc UUID) với allocationSize lớn.",
    why: [
      "✓ Đúng — Đây là cạm bẫy hiệu năng kinh điển khi tối ưu hóa ghi dữ liệu lớn trong Hibernate.",
      "PostgreSQL hỗ trợ batch insert cực mạnh qua pgjdbc driver.",
      "Redis là cache, không liên quan đến JDBC batching của Hibernate.",
      "jdbc.batch_size là cấu hình chuẩn của Hibernate Core được Spring Boot hỗ trợ đầy đủ."
    ]
  },
  {
    level: "hard",
    scenario: "Trong một dịch vụ chuyển tiền giữa 2 tài khoản ngân hàng A và B, hai giao dịch đồng thời xảy ra: Giao dịch 1 chuyển tiền từ A sang B; Giao dịch 2 chuyển tiền từ B sang A. Cả hai giao dịch đều dùng Pessimistic Write Lock.",
    q: "Hiện tượng gì có nguy cơ cao xảy ra và giải pháp kiến trúc chuẩn để triệt tiêu nó là gì?",
    options: [
      "Nguy cơ Deadlock (Khóa chết chéo); giải pháp là luôn sắp xếp thứ tự các tài khoản cần khóa theo ID tăng dần trước khi thực hiện câu lệnh SELECT FOR UPDATE",
      "Nguy cơ Dirty Read; giải pháp là nâng Isolation Level lên READ UNCOMMITTED",
      "Nguy cơ tràn RAM của máy chủ JVM; giải pháp là tăng heap size",
      "Không có nguy cơ nào vì database tự động xử lý"
    ],
    answer: 0,
    explain: "Giao dịch 1 khóa A chờ B, Giao dịch 2 khóa B chờ A dẫn đến chu trình chờ khóa (Deadlock cycle). Bằng cách cưỡng chế thứ tự khóa theo quy tắc tất định (ví dụ: luôn khóa account có ID nhỏ hơn trước), chu trình chờ chéo sẽ bị triệt tiêu hoàn toàn.",
    why: [
      "✓ Đúng — Sắp xếp thứ tự khóa (Lock Ordering) là thuật toán kinh điển giải quyết Deadlock trong khoa học máy tính.",
      "Dirty Read không xảy ra khi dùng Pessimistic Write Lock; hạ isolation level càng làm sai lệch dữ liệu.",
      "Deadlock xảy ra tại database engine, không liên quan đến heap size của JVM.",
      "Database chỉ phát hiện và ngắt (kill) một trong hai transaction khi deadlock xảy ra, chứ không thể ngăn ngừa nếu code viết sai thứ tự."
    ]
  },
  {
    level: "medium",
    scenario: "Lập trình viên viết câu truy vấn JPQL: 'SELECT o FROM Order o JOIN FETCH o.items JOIN FETCH o.payments'. Khi khởi động ứng dụng, Hibernate ném ngoại lệ org.hibernate.loader.MultipleBagFetchException.",
    q: "Nguyên nhân cốt lõi của lỗi này là gì và cách khắc phục chuẩn xác nhất là gì?",
    options: [
      "Hibernate không cho phép JOIN FETCH đồng thời 2 collection dạng java.util.List (Bag) vì tạo ra tích đề-các (Cartesian Product) bùng nổ dữ liệu; cách khắc phục là đổi kiểu dữ liệu collection sang java.util.Set hoặc tách thành 2 query riêng biệt",
      "Do câu lệnh JPQL thiếu từ khóa WHERE",
      "Do cơ sở dữ liệu không có bảng payments",
      "Do Spring Boot 3 cấm dùng JOIN FETCH"
    ],
    answer: 0,
    explain: "Một 'Bag' trong Hibernate là một List không có thứ tự và cho phép duplicate. JOIN FETCH đồng thời hai Bag sẽ sinh ra số dòng dữ liệu bằng (Số items x Số payments), làm Hibernate không thể phân biệt và tái tạo chính xác collection trong bộ nhớ.",
    why: [
      "✓ Đúng — MultipleBagFetchException là cơ chế an toàn của Hibernate ngăn chặn thảm họa Cartesian Product làm cạn kiệt RAM.",
      "Từ khóa WHERE không ảnh hưởng đến lỗi MultipleBagFetchException.",
      "Lỗi này ném ra từ quá trình parse metadata của Hibernate, không phải do thiếu bảng DB.",
      "JOIN FETCH là tính năng chuẩn của JPA spec."
    ]
  },
  {
    level: "medium",
    scenario: "Khi một transaction thực hiện sửa đổi 10 thuộc tính của một Entity đang ở trạng thái Managed, tại sao lập trình viên không cần gọi lệnh repository.save(entity) mà cơ sở dữ liệu vẫn được cập nhật tự động khi kết thúc method?",
    q: "Cơ chế nào của Hibernate/JPA chịu trách nhiệm cho hành vi này?",
    options: [
      "Cơ chế Tự Động Kiểm Tra Bẩn (Dirty Checking): Khi commit transaction, Hibernate so sánh trạng thái hiện tại của Entity với bản snapshot lúc tải vào First-Level Cache và tự sinh câu lệnh UPDATE SQL nếu có thay đổi",
      "Cơ chế Garbage Collection của JVM tự động đẩy dữ liệu xuống database",
      "Do Spring Boot sử dụng WebSockets đồng bộ liên tục với DB",
      "Do trigger tự động của cơ sở dữ liệu"
    ],
    answer: 0,
    explain: "First-Level Cache lưu trữ bản snapshot ban đầu của Entity. Tại thời điểm Flush/Commit của Transaction, Hibernate thực hiện Dirty Checking so sánh trạng thái và tự động phát sinh câu UPDATE cho những entity bị thay đổi.",
    why: [
      "✓ Đúng — Dirty Checking là một trong những tính năng cốt lõi và thanh lịch nhất của JPA/Hibernate.",
      "Garbage Collector chỉ dọn dẹp bộ nhớ RAM, hoàn toàn không biết gì về cơ sở dữ liệu.",
      "WebSockets là giao thức mạng client-server, không liên quan đến ORM persistence context.",
      "Trigger của DB chỉ kích hoạt sau khi có câu lệnh SQL gửi đến, không tự đọc được biến Java."
    ]
  }
];

const inlineQuiz = oldM3.lessons.find(l => l.type === 'quiz');
const updatedQuizQuestions = inlineQuiz.questions.concat(additionalQuestions);

const newLessons = [
  t1_l1, t1_l2, t1_l3, t1_l4,
  t2_l1, t2_l2, t2_l3, t2_l4,
  t3_l1, t3_l2, t3_l3, t3_l4,
  t4_l1, t4_l2, t4_l3, t4_l4,
  {
    id: "3-quiz",
    type: "quiz",
    title: "Quiz Module 3 — Sát Hạch Toàn Diện Data Access & JPA",
    questions: updatedQuizQuestions
  }
];

const newM3 = {
  id: 3,
  title: "Data Access & JPA",
  subtitle: "Hibernate Internals, N+1 Fix, Locking & Flyway Migration",
  icon: "🗄️",
  desc: "Tối ưu hóa Database chuyên sâu, triệt tiêu lỗi N+1, xử lý Concurrency/Locking chống bán âm và di trú schema với Flyway.",
  topics: topics,
  outcomes: outcomes,
  retrievalWarmup: retrievalWarmup,
  lessons: newLessons
};

const outputContent = `/* MODULE 3 — Data Access & JPA (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(${JSON.stringify(newM3, null, 2)});\n`;

fs.writeFileSync(m3Path, outputContent, 'utf8');
console.log('Successfully curated module3.js!');
console.log('Total content lessons:', newLessons.filter(l => l.type !== 'quiz').length);
console.log('Total quiz questions:', updatedQuizQuestions.length);
