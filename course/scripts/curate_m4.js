const fs = require('fs');
const path = require('path');

global.window = { COURSE_MODULES: [] };
const m4Path = path.join(__dirname, '..', 'js', 'content', 'module4.js');
new Function('window', fs.readFileSync(m4Path, 'utf8'))(window);
const oldM4 = window.COURSE_MODULES[0];

const topics = [
  { id: 1, title: "Unit Testing với JUnit 5 & Mockito", desc: "JUnit 5 Jupiter, Mockito 5 ByteBuddy, BDDMockito, ArgumentCaptor và kim tự tháp kiểm thử." },
  { id: 2, title: "Sliced Testing & Testcontainers PostgreSQL", desc: "Kiểm thử phân tầng @WebMvcTest, @DataJpaTest và tích hợp Docker Testcontainers PostgreSQL thật." },
  { id: 3, title: "Asynchronous & Security Testing", desc: "Kiểm thử phân quyền Spring Security, xử lý bất đồng bộ với Awaitility và kiểm thử Kafka." },
  { id: 4, title: "Architecture Testing với ArchUnit", desc: "Cưỡng chế kiến trúc Clean Architecture tự động bằng ArchUnit và tiêu chuẩn chất lượng CI/CD." }
];

const outcomes = [
  "Viết Unit Test cô lập tầng Service sử dụng BDDMockito và ArgumentCaptor đạt độ tin cậy cao",
  "Thiết lập Integration Test với Testcontainers chạy PostgreSQL thật đạt chuẩn CI/CD môi trường yếu",
  "Kiểm thử bảo mật phân quyền với @WithMockUser và xử lý kiểm thử bất đồng bộ với Awaitility",
  "Cưỡng chế quy tắc kiến trúc Clean Architecture tự động bằng ArchUnit ngăn chặn vi phạm phân tầng"
];

const retrievalWarmup = [
  {
    question: "Trong Module 3, nguyên nhân cốt lõi gây ra lỗi Hibernate N+1 Query là gì và giải pháp triệt để là gì?",
    options: [
      "Do Hibernate phát sinh 1 query cha và thêm N query con để nạp quan hệ Lazy; giải pháp triệt để là dùng JOIN FETCH, @EntityGraph hoặc DTO Projection",
      "Do cơ sở dữ liệu thiếu RAM",
      "Do đổi FetchType sang EAGER",
      "Do Hibernate bị lỗi phiên bản"
    ],
    answer: 0,
    explain: "N+1 query xảy ra khi truy vấn cha sinh 1 query và mỗi lần duyệt phần tử con lại bắn thêm 1 query phụ. JOIN FETCH gom tất cả vào đúng 1 câu query duy nhất.",
    targetLessonId: "3-2-1"
  },
  {
    question: "Trong nghiệp vụ Flash Sale có tranh chấp cao, tại sao Pessimistic Write Lock (SELECT FOR UPDATE) lại ngăn chặn được việc bán âm tồn kho?",
    options: [
      "Vì nó khóa độc quyền hàng dữ liệu tại tầng Database, buộc các request khác phải xếp hàng chờ cho đến khi transaction trước commit xong",
      "Vì nó tự động hủy các request đến sau",
      "Vì nó tăng số lượng tồn kho lên vô hạn",
      "Vì nó lưu trữ dữ liệu trên trình duyệt của khách hàng"
    ],
    answer: 0,
    explain: "Pessimistic Write Lock giữ Exclusive Lock trên dòng dữ liệu trong DB. Mọi giao dịch cạnh tranh cố đọc dòng này để update đều bị block, bảo đảm tính nguyên tố và không bao giờ bán âm.",
    targetLessonId: "3-3-2"
  },
  {
    question: "Nguyên tắc bất biến quan trọng nhất khi quản trị di trú cơ sở dữ liệu bằng Flyway là gì?",
    options: [
      "Một file migration (ví dụ: V1__init.sql) khi đã commit và thực thi thì TUYỆT ĐỐI không được sửa đổi nội dung; mọi thay đổi phải tạo file version mới",
      "Phải xóa bảng flyway_schema_history trước mỗi lần deploy",
      "Mỗi tuần phải đổi tên file migration một lần",
      "Chỉ được viết migration bằng Java code, không được dùng SQL"
    ],
    answer: 0,
    explain: "Flyway kiểm tra checksum của từng file migration so với bảng lịch sử. Nếu nội dung file đã chạy bị sửa đổi, Flyway sẽ dừng ứng dụng ngay lập tức để bảo vệ tính nhất quán của schema.",
    targetLessonId: "3-4-1"
  }
];

const getL = (id) => oldM4.lessons.find(l => l.id === id);

// Topic 1: 4-1-1 to 4-1-4 (Consolidates 4-1 and 4-3)
const t1_l1 = {
  id: "4-1-1",
  type: "theory",
  title: "Bài 4.1.1: Kiến trúc JUnit 5 Jupiter, Mockito 5 ByteBuddy & Triết lý Kiểm thử Đơn vị",
  minutes: 8,
  content: getL("4-1-2").content + "\n\n" + getL("4-1-3").content + "\n\n" + getL("4-3-2").content
};

const t1_l2 = {
  id: "4-1-2",
  type: "practice",
  title: "Bài 4.1.2: Triển khai Unit Test Service Layer với BDDMockito & ArgumentCaptor",
  minutes: 8,
  content: getL("4-1-4").content + "\n\n" + getL("4-3-3").content + "\n\n" + getL("4-3-4").content
};

const t1_l3 = {
  id: "4-1-3",
  type: "pitfall",
  title: "Bài 4.1.3: Cạm bẫy Over-mocking, Strict Stubs & Mockito Spy Rò Rỉ Trạng Thái Thật",
  minutes: 7,
  content: getL("4-1-6").content + "\n\n" + getL("4-3-5").content
};

const t1_l4 = {
  id: "4-1-4",
  type: "synthesis",
  title: "Bài 4.1.4: Milestone Synthesis: Bản đồ Kim Tự Tháp Kiểm Thử & Ma trận Lựa Chọn Công Cụ Test",
  minutes: 8,
  content: `## Milestone Synthesis: Kim Tự Tháp Kiểm Thử & Kỹ Thuật Mocking Chuyên Sâu

### 1. Sơ Đồ Kiến Trúc: Kim Tự Tháp Kiểm Thử Chuẩn Doanh Nghiệp (Test Pyramid)

\`\`\`mermaid
flowchart TD
    E2E["End-to-End Tests (5%)<br/>• Chạy toàn bộ hệ thống + UI / API Gateway<br/>• Chậm nhất, đắt đỏ nhất, dễ flaky"]
    Integration["Integration & Sliced Tests (25%)<br/>• Testcontainers (PostgreSQL, Kafka)<br/>• @WebMvcTest, @DataJpaTest"]
    Unit["Unit Tests Đơn Vị (70%)<br/>• JUnit 5 + Mockito cô lập hoàn toàn<br/>• Cực nhanh (< 10ms/test), chạy hàng nghìn test trong vài giây"]

    E2E --> Integration
    Integration --> Unit

    style Unit fill:#064e3b,stroke:#10b981,color:#fff
    style Integration fill:#1e293b,stroke:#3b82f6,color:#fff
    style E2E fill:#7f1d1d,stroke:#ef4444,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Mock vs Spy vs Fake vs Real Component

| Loại Test Double | Cơ chế hoạt động | Khi nào nên dùng | Cạm bẫy cần tránh |
|---|---|---|---|
| **Mock (@Mock)** | Đối tượng giả lập hoàn toàn, trả về giá trị mặc định | Giả lập dịch vụ bên ngoài, tầng DB Repository | Over-mocking: mock cả logic nghiệp vụ nội bộ |
| **Spy (@Spy)** | Bọc đối tượng thật, chỉ ghi đè một vài method chỉ định | Khi cần kiểm tra tương tác với class di sản | Rò rỉ side-effect thực sự của đối tượng thật |
| **ArgumentCaptor** | Bắt lại tham số truyền vào method của Mock | Xác minh nội dung payload phức tạp gửi đi | Lạm dụng khi chỉ cần assert equals đơn giản |
| **Real Component** | Khởi tạo thật trong Spring Context | Khi viết Integration Test với Testcontainers | Chạy chậm hơn 100 lần so với Mock |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Triết lý BDD (Given - When - Then)**: Viết test theo cấu trúc BDDMockito (\`given(...).willReturn(...)\`) giúp test case đóng vai trò như tài liệu sống của nghiệp vụ.
2. **Cạm bẫy Over-Mocking**: Đừng mock quá nhiều đến mức bài test chỉ verify lại chính những gì bạn mock mà không kiểm tra bất kỳ logic tính toán nào của mã nguồn thật.
3. **Strict Stubbing**: Mockito 5 mặc định bật Strict Stubs; nếu bạn khai báo mock mà không sử dụng, test sẽ fail ngay lập tức để giữ test suite sạch sẽ.`
};

// Topic 2: 4-2-1 to 4-2-4
const t2_l1 = {
  id: "4-2-1",
  type: "theory",
  title: "Bài 4.2.1: Bản chất Sliced Testing (@WebMvcTest, @DataJpaTest) & Kiến trúc Testcontainers",
  minutes: 8,
  content: getL("4-2-2").content + "\n\n" + getL("4-2-3").content
};

const t2_l2 = {
  id: "4-2-2",
  type: "practice",
  title: "Bài 4.2.2: Triển khai Integration Test với Testcontainers PostgreSQL Thật Chuẩn CI/CD",
  minutes: 8,
  content: getL("4-2-4").content
};

const t2_l3 = {
  id: "4-2-3",
  type: "pitfall",
  title: "Bài 4.2.3: Cạm bẫy H2 In-Memory Giấu Lỗi Production & Khởi Động Container Chậm",
  minutes: 7,
  content: getL("4-2-5").content + "\n\n" + getL("4-2-6").content
};

const t2_l4 = {
  id: "4-2-4",
  type: "synthesis",
  title: "Bài 4.2.4: Milestone Synthesis: Bản đồ Sliced Testing & Ma trận Testcontainers vs Embedded DB",
  minutes: 8,
  content: `## Milestone Synthesis: Sliced Testing & Testcontainers Chuyên Sâu

### 1. Sơ Đồ Kiến Trúc: Vòng Đời Testcontainers PostgreSQL Trong Chu Trình CI/CD

\`\`\`mermaid
flowchart TD
    MavenTest["mvn verify / test"] --> JUnitRunner["JUnit 5 Test Runner"]
    JUnitRunner --> DockerCheck["Kiểm tra Docker Engine Socket"]
    DockerCheck --> Ryuk["Khởi động Container Ryuk (Resource Reaper Quản lý Rác)"]
    Ryuk --> PGContainer["Kéo & Khởi động Docker Container: postgres:16-alpine (Ephemeral Port)"]
    PGContainer --> FlywayMigrate["Flyway tự động chạy toàn bộ file V1, V2 Migration trên Postgres thật"]
    FlywayMigrate --> DynamicProp["@DynamicPropertySource nạp jdbcUrl động vào Spring Context"]
    DynamicProp --> RunTests["Thực thi bộ Integration Tests trên Database Thật!"]
    RunTests --> TearDown["Ryuk tự động hủy Container và giải phóng bộ nhớ khi test kết thúc"]
    
    style PGContainer fill:#1e3a8a,stroke:#3b82f6,color:#fff
    style RunTests fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Testcontainers PostgreSQL vs In-Memory H2

| Tiêu chuẩn | Testcontainers (PostgreSQL Thật) | Cơ sở dữ liệu In-Memory (H2) |
|---|---|---|
| **Độ chân thực với Production** | **100% giống hệt Production** (dialect, locking, jsonb) | Sai lệch cơ chế locking, type casting, cú pháp SQL |
| **Phát hiện lỗi Concurrency** | Phát hiện chuẩn xác Deadlock, Race Condition | **Bỏ lọt hầu hết lỗi Concurrency** |
| **Tốc độ khởi động** | Tốn 2 - 5 giây khởi tạo container lúc đầu | Cực nhanh (< 500ms) |
| **Yêu cầu hạ tầng** | Cần Docker Engine trên máy dev và CI runner | Không cần Docker, chạy thuần túy trên JVM |
| **Khuyến nghị theo CES-2026** | **BẮT BUỘC từ Level 2 (Professional) trở lên** | Chỉ được dùng ở Level 1 (Foundation) |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Quy tắc Singleton Container**: Tái sử dụng cùng 1 PostgreSQL container cho toàn bộ test classes thay vì bật/tắt container ở mỗi class, giúp giảm 80% thời gian chạy CI/CD.
2. **Dynamic Property Source**: Dùng \`@DynamicPropertySource\` để map port động của container vào \`spring.datasource.url\`, ngăn chặn hoàn toàn xung đột port trên máy build.
3. **Sliced Test cô lập**: Dùng \`@WebMvcTest\` chỉ nạp tầng Controller + Filter (mock Service) và \`@DataJpaTest\` chỉ nạp tầng Repository + Entity để test chạy nhanh gấp 10 lần full \`@SpringBootTest\`.`
};

// Topic 3: 4-3-1 to 4-3-4
const t3_l1 = {
  id: "4-3-1",
  type: "theory",
  title: "Bài 4.3.1: Kiến trúc Kiểm thử Bất đồng bộ (Awaitility), Phân quyền Security & Kafka Broker",
  minutes: 8,
  content: getL("4-4-2").content + "\n\n" + getL("4-4-3").content + "\n\n" + getL("4-4-4").content
};

const t3_l2 = {
  id: "4-3-2",
  type: "practice",
  title: "Bài 4.3.2: Kiểm thử Spring Security Context & Event-Driven Consumer với Awaitility",
  minutes: 8,
  content: getL("4-4-5").content
};

const t3_l3 = {
  id: "4-3-3",
  type: "pitfall",
  title: "Bài 4.3.3: Cạm bẫy Thread Sleep Gây Flaky Test & Rò rỉ SecurityContext Giữa Các Test Case",
  minutes: 7,
  content: getL("4-4-6").content + "\n\n" + getL("4-4-7").content
};

const t3_l4 = {
  id: "4-3-4",
  type: "synthesis",
  title: "Bài 4.3.4: Milestone Synthesis: Bản đồ Kiểm Thử Bất Đồng Bộ & Ma trận Đo Lường Test Stability",
  minutes: 8,
  content: `## Milestone Synthesis: Kiểm Thử Bất Đồng Bộ, Bảo Mật & Event Messaging

### 1. Sơ Đồ Kiến Trúc: Cơ Chế Polling Thông Minh Của Thư Viện Awaitility

\`\`\`mermaid
flowchart TD
    Trigger["1. Kích hoạt tác vụ bất đồng bộ (@Async / Kafka Event)"] --> StartPolling["2. Awaitility bắt đầu cơ chế Polling (Mỗi 100ms kiểm tra 1 lần)"]
    StartPolling --> CheckCondition{"Điều kiện thỏa mãn?<br/>(Order status == COMPLETED)"}
    CheckCondition -- "CHƯA THỎA" --> CheckTimeout{"Đã vượt quá Timeout (ví dụ 5s)?"}
    CheckTimeout -- "CHƯA" --> SleepPoll["Chờ 100ms tiếp theo"]
    SleepPoll --> CheckCondition
    CheckTimeout -- "QUÁ 5s" --> Fail["Test FAIL: ConditionTimeoutException"]
    CheckCondition -- "ĐÃ THỎA" --> Pass["Test PASS NGAY LẬP TỨC (Không tốn thêm 1ms chờ vô ích!)"]

    style Pass fill:#064e3b,stroke:#10b981,color:#fff
    style Fail fill:#7f1d1d,stroke:#ef4444,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Xử Lý Kiểm Thử Tác Vụ Bất Đồng Bộ

| Kỹ thuật | Thư viện Awaitility | Thread.sleep() Thủ Công | CountdownLatch |
|---|---|---|---|
| **Tính ổn định (Flakiness)** | **Cực kỳ ổn định**, không bị ảnh hưởng bởi tải CPU | **Rất dễ Flaky** (Máy yếu chạy chậm dẫn đến fail ngẫu nhiên) | Ổn định nếu luồng con gọi countDown đúng |
| **Thời gian chạy test** | Tối ưu: Pass ngay khi điều kiện đạt được | Lãng phí: Luôn phải chờ hết số giây cố định | Tối ưu nếu quản lý latch chuẩn |
| **Mức độ phức tạp code** | Đơn giản, phong cách khai báo (fluent DSL) | Ngắn nhưng nghiệp dư | Phức tạp, dễ dính timeout treo máy nếu luồng con chết |
| **Khuyến nghị sử dụng** | **Tiêu chuẩn công nghiệp số 1 cho Spring Boot Async** | **CẤM DÙNG trên production codebase** | Chỉ dùng khi đồng bộ nhiều luồng phức tạp |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Tuyệt đối cấm \`Thread.sleep()\`**: Sleep cố định là nguyên nhân hàng đầu khiến pipeline CI/CD chạy chậm và test bị flaky trên server build. Luôn thay bằng \`await().atMost(5, SECONDS).until(...)\`.
2. **Kiểm thử Security với Annotation**: Dùng \`@WithMockUser(username = "admin", roles = {"ADMIN"})\` để giả lập ngữ cảnh xác thực một cách thanh lịch mà không cần tự build JWT token giả.
3. **Dọn dẹp Context**: Đảm bảo SecurityContext được clear sạch sau mỗi test để tránh tình trạng test trước lọt quyền sang test sau.`
};

// Topic 4: 4-4-1 to 4-4-4
const t4_l1 = {
  id: "4-4-1",
  type: "theory",
  title: "Bài 4.4.1: Kiến trúc Bytecode Analysis của ArchUnit & Triết lý Architecture as Code",
  minutes: 8,
  content: getL("4-5-2").content + "\n\n" + getL("4-5-3").content
};

const t4_l2 = {
  id: "4-4-2",
  type: "practice",
  title: "Bài 4.4.2: Triển khai Bộ Quy Tắc ArchUnit Cưỡng Chế Clean Architecture & Layered Rules",
  minutes: 8,
  content: getL("4-5-4").content + "\n\n" + getL("4-5-5").content
};

const t4_l3 = {
  id: "4-4-3",
  type: "pitfall",
  title: "Bài 4.4.3: Cạm bẫy Bỏ qua Quy tắc Kiểm tra Package & Code Coverage Ảo 100% Không Có Assert",
  minutes: 7,
  content: getL("4-5-6").content + "\n\n" + getL("4-5-7").content
};

const t4_l4 = {
  id: "4-4-4",
  type: "synthesis",
  title: "Bài 4.4.4: Milestone Synthesis: Bản đồ Kiến trúc ArchUnit & Ma trận Tiêu Chuẩn Chất Lượng CI/CD",
  minutes: 8,
  content: `## Milestone Synthesis: Architecture Testing & Quản Trị Chất Lượng CI/CD

### 1. Sơ Đồ Kiến Trúc: Cưỡng Chế Quy Tắc Clean Architecture Bằng ArchUnit

\`\`\`mermaid
flowchart TD
    subgraph ArchRules ["Bộ Quy Tắc ArchUnit (Architecture as Code)"]
        R1["Quy Tắc 1: Controller KHÔNG ĐƯỢC PHÉP gọi trực tiếp Repository"]
        R2["Quy Tắc 2: Package Domain KHÔNG ĐƯỢC PHÉP phụ thuộc vào Spring Framework"]
        R3["Quy Tắc 3: Các class @Service bắt buộc phải có hậu tố 'Service'"]
        R4["Quy Tắc 4: Không được dùng field injection @Autowired trên private field"]
    end

    ArchRules --> BytecodeParser["ArchUnit Bytecode Engine (Đọc file .class trong target/)"]
    BytecodeParser --> Verifier["Kiểm Tra Cây Phụ Thuộc (Dependency Verification)"]
    Verifier -- "Có Vi Phạm" --> BuildBreak["GÃY BUILD CI/CD NGAY LẬP TỨC! (Ngăn chặn code bẩn merge vào main)"]
    Verifier -- "Tuân Thủ 100%" --> BuildPass["BUILD SUCCESS ✓"]

    style BuildBreak fill:#7f1d1d,stroke:#ef4444,color:#fff
    style BuildPass fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Các Tầng Bảo Vệ Chất Lượng Code Trên CI/CD

| Công cụ | Phạm vi kiểm tra | Lợi ích cốt lõi | Thời điểm thực thi |
|---|---|---|---|
| **ArchUnit** | Kiến trúc phân tầng, quy tắc đặt tên, dependency direction | Bảo vệ Clean Architecture không bị xói mòn theo thời gian | Lúc chạy \`mvn test\` |
| **JaCoCo** | Độ bao phủ mã nguồn (Line Coverage, Branch Coverage) | Đo lường tỷ lệ code có test case kiểm thử | Lúc chạy \`mvn verify\` |
| **SpotBugs / SonarQube** | Lỗ hổng bảo mật (CVE), code smells, bug patterns | Phát hiện rò rỉ tài nguyên, null pointer tiềm ẩn | Trong pipeline CI/CD pull request |
| **Mutation Testing (PIT)** | Chất lượng thực sự của câu lệnh assert trong test | Phát hiện test suite ảo (test chạy pass nhưng không có assert) | Chạy định kỳ hàng đêm (Nightly build) |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Kiến trúc tự động kiểm tra**: Thay vì phải review code bằng mắt để nhắc nhở 'Controller không được gọi Repository', hãy để ArchUnit tự động gãy build nếu ai đó vi phạm.
2. **Cạm bẫy Coverage ảo**: 100% Code Coverage không có ý nghĩa gì nếu trong bài test không có lệnh assert nào (\`assertThat\`). Hãy chú trọng Branch Coverage và Boundary Testing.
3. **Fail Fast trên CI/CD**: Thiết lập ArchUnit và Unit test chạy đầu tiên trong pipeline để trả về kết quả trong 60 giây trước khi chạy các tác vụ integration nặng.`
};

// 6 Additional Quiz Questions for Module 4 (10 + 6 = 16 questions)
const additionalQuestions = [
  {
    level: "hard",
    scenario: "Một nhóm phát triển sử dụng H2 In-Memory Database cho toàn bộ Integration Tests để test chạy nhanh. Khi deploy lên production chạy PostgreSQL thật, ứng dụng liên tục gặp lỗi Deadlock và lỗi cú pháp JSONB.",
    q: "Tại sao theo quy chuẩn kỹ thuật CES-2026, các bài thi cấp Professional bắt buộc phải dùng Testcontainers với PostgreSQL thật thay vì H2?",
    options: [
      "Vì H2 có cơ chế Locking, SQL Dialect và Transaction Isolation rất khác biệt so với PostgreSQL; H2 giấu nhẹm các lỗi Concurrency và hàm đặc thù của Postgres, dẫn đến test pass giả tạo",
      "Vì Spring Boot 3 đã ngừng hoàn toàn việc hỗ trợ thư viện H2",
      "Vì H2 tốn nhiều dung lượng ổ cứng hơn Docker",
      "Vì H2 không thể chạy được trên hệ điều hành Windows"
    ],
    answer: 0,
    explain: "H2 in-memory là một database đơn giản hóa. Nó không có cơ chế MVCC, Row-level lock và các tính năng nâng cao (như JSONB, pg_trgm, trigger) giống hệt PostgreSQL. Sử dụng Testcontainers bảo đảm môi trường kiểm thử tương đồng 100% với Production.",
    why: [
      "✓ Đúng — Đây là triết lý sống còn của CES-2026: 'H2 giấu lỗi production. Từ Professional, bài data và concurrency bắt profile thật mới tính Certified'.",
      "Spring Boot vẫn hỗ trợ H2 cho các bài demo đơn giản.",
      "H2 chạy trong RAM nên tốn ít tài nguyên hơn Docker.",
      "H2 viết bằng Java nên chạy được trên mọi OS."
    ]
  },
  {
    level: "medium",
    scenario: "Khi kiểm thử một phương thức Service thực hiện gửi thông báo bất đồng bộ (@Async), nếu dùng Thread.sleep(2000) để chờ kết quả thì bài test đôi khi bị FAIL ngẫu nhiên trên máy chủ Jenkins CI.",
    q: "Thư viện chuyên dụng nào được khuyến nghị áp dụng để kiểm thử bất đồng bộ mà không gây Flaky Test?",
    options: [
      "Thư viện Awaitility với cơ chế Polling điều kiện (await().atMost(...).until(...))",
      "Thư viện Lombok",
      "Thư viện MapStruct",
      "Thư viện Logback"
    ],
    answer: 0,
    explain: "Awaitility cung cấp DSL khai báo chờ đợi theo điều kiện. Nó liên tục kiểm tra trạng thái bất đồng bộ và cho test pass ngay khi điều kiện đạt được, tránh hiện tượng máy build chậm làm Thread.sleep bị thiếu thời gian.",
    why: [
      "✓ Đúng — Awaitility là tiêu chuẩn công nghiệp cho asynchronous testing trong hệ sinh thái JVM.",
      "Lombok là thư viện sinh code, không dùng để kiểm thử.",
      "MapStruct dùng cho DTO mapping.",
      "Logback dùng để ghi log."
    ]
  },
  {
    level: "hard",
    scenario: "Trong Clean Architecture, bạn muốn bảo đảm rằng không một lập trình viên nào được phép inject JpaRepository trực tiếp vào tầng Controller. Công cụ nào giúp cưỡng chế quy tắc này tự động trong quá trình build?",
    q: "Giải pháp Architecture as Code chuẩn xác nhất là gì?",
    options: [
      "Viết test case bằng thư viện ArchUnit: noClasses().that().resideInAPackage('..controller..').should().dependOnClassesThat().resideInAPackage('..repository..')",
      "Tự kiểm tra bằng mắt trong các buổi họp review code",
      "Sử dụng annotation @Transactional(readOnly = true)",
      "Đặt mật khẩu cho package repository"
    ],
    answer: 0,
    explain: "ArchUnit phân tích bytecode của các file .class và cho phép viết các quy tắc kiến trúc dưới dạng Unit Test. Nếu có class Controller nào vi phạm quy tắc phụ thuộc, ArchUnit sẽ gãy build ngay lập tức.",
    why: [
      "✓ Đúng — ArchUnit là công cụ hàng đầu hiện nay giúp tự động hóa việc bảo vệ kiến trúc phần mềm.",
      "Review bằng mắt tốn thời gian và rất dễ bỏ sót khi dự án có hàng trăm file.",
      "@Transactional không có chức năng kiểm soát cấu trúc code.",
      "Java không có tính năng đặt mật khẩu cho package."
    ]
  },
  {
    level: "medium",
    scenario: "Khi viết Unit Test cho một Service với Mockito, bạn cần xác minh rằng đối tượng UserEntity được lưu xuống DB có trường 'status' mang giá trị 'ACTIVE' và 'createdAt' không bị null.",
    q: "Kỹ thuật Mockito nào cho phép bắt lại đối tượng Entity được truyền vào repository.save() để thực hiện các assertion chi tiết?",
    options: [
      "Sử dụng ArgumentCaptor<UserEntity> kết hợp verify(repository).save(captor.capture())",
      "Sử dụng annotation @Autowired",
      "Gọi trực tiếp method private của Entity",
      "In log ra màn hình console bằng System.out.println"
    ],
    answer: 0,
    explain: "ArgumentCaptor cho phép 'bắt' lấy tham số thực tế được truyền vào phương thức của đối tượng Mock, từ đó giúp lập trình viên viết các câu lệnh assert sâu vào bên trong trạng thái của đối tượng đó.",
    why: [
      "✓ Đúng — ArgumentCaptor là công cụ mạnh mẽ trong các bài test xác thực nghiệp vụ phức tạp.",
      "@Autowired dùng để inject bean, không dùng để bắt tham số test.",
      "Method private không thể gọi trực tiếp từ bên ngoài.",
      "In console không kiểm tra được tính đúng đắn của dữ liệu tự động."
    ]
  },
  {
    level: "medium",
    scenario: "Lập trình viên muốn kiểm thử Controller của một REST API mà không muốn nạp toàn bộ ApplicationContext của Spring Boot (không nạp Service, không kết nối DB).",
    q: "Annotation Sliced Test nào của Spring Boot được thiết kế tối ưu cho mục đích này?",
    options: [
      "@WebMvcTest kết hợp @MockBean cho các Service phụ thuộc",
      "@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)",
      "@DataJpaTest",
      "@ContextConfiguration"
    ],
    answer: 0,
    explain: "@WebMvcTest chỉ nạp các thành phần tầng Web (Controller, ControllerAdvice, Filter, Converter). Nó bỏ qua hoàn toàn tầng Service và Repository, giúp test khởi động cực nhanh chỉ trong vài trăm mili-giây.",
    why: [
      "✓ Đúng — @WebMvcTest là mẫu hình Sliced Test điển hình cho tầng Web MVC.",
      "@SpringBootTest nạp toàn bộ context, chạy rất chậm và không phải là sliced test.",
      "@DataJpaTest dùng để test tầng Database, không nạp Controller.",
      "@ContextConfiguration là annotation bậc thấp của Spring Test."
    ]
  },
  {
    level: "medium",
    scenario: "Khi kiểm thử một REST endpoint yêu cầu quyền hạn ADMIN, annotation nào của Spring Security Test cho phép giả lập một người dùng đã đăng nhập với vai trò 'ROLE_ADMIN' một cách nhanh gọn nhất?",
    q: "Annotation chuẩn xác là gì?",
    options: [
      "@WithMockUser(roles = 'ADMIN')",
      "@Secured('ADMIN')",
      "@PreAuthorize('hasRole(\"ADMIN\")')",
      "@PermitAll"
    ],
    answer: 0,
    explain: "@WithMockUser thiết lập một SecurityContext giả lập trong thread kiểm thử, chứa một Authentication token có quyền hạn được chỉ định mà không cần thực hiện đăng nhập thật.",
    why: [
      "✓ Đúng — @WithMockUser là annotation hỗ trợ đắc lực trong Spring Security Test.",
      "@Secured và @PreAuthorize dùng để bảo vệ method trong code chính, không dùng để nạp mock user trong test.",
      "@PermitAll cho phép tất cả mọi người truy cập, không phải công cụ kiểm thử."
    ]
  }
];

const inlineQuiz = oldM4.lessons.find(l => l.type === 'quiz');
const updatedQuizQuestions = inlineQuiz.questions.concat(additionalQuestions);

const newLessons = [
  t1_l1, t1_l2, t1_l3, t1_l4,
  t2_l1, t2_l2, t2_l3, t2_l4,
  t3_l1, t3_l2, t3_l3, t3_l4,
  t4_l1, t4_l2, t4_l3, t4_l4,
  {
    id: "4-quiz",
    type: "quiz",
    title: "Quiz Module 4 — Sát Hạch Toàn Diện Kiểm Thử Testing & Testcontainers",
    questions: updatedQuizQuestions
  }
];

const newM4 = {
  id: 4,
  title: "Testing",
  subtitle: "JUnit 5, Mockito, Sliced Tests, Testcontainers & ArchUnit",
  icon: "🧪",
  desc: "Làm chủ kim tự tháp kiểm thử, viết Unit Test với Mockito, Sliced Testing và kiểm thử tích hợp trên Testcontainers PostgreSQL thật.",
  topics: topics,
  outcomes: outcomes,
  retrievalWarmup: retrievalWarmup,
  lessons: newLessons
};

const outputContent = `/* MODULE 4 — Testing (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(${JSON.stringify(newM4, null, 2)});\n`;

fs.writeFileSync(m4Path, outputContent, 'utf8');
console.log('Successfully curated module4.js!');
console.log('Total content lessons:', newLessons.filter(l => l.type !== 'quiz').length);
console.log('Total quiz questions:', updatedQuizQuestions.length);
