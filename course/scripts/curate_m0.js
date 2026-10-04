const fs = require('fs');
const path = require('path');

global.window = { COURSE_MODULES: [] };
const m0Path = path.join(__dirname, '..', 'js', 'content', 'module0.js');
new Function('window', fs.readFileSync(m0Path, 'utf8'))(window);
const oldM0 = window.COURSE_MODULES[0];

// Topics definition
const topics = [
  { id: 1, title: "Thiết lập Môi trường JDK 21 & Bộ Công Cụ Enterprise", desc: "Bản đồ OpenJDK, kiến trúc JVM, cấu hình CLI và công cụ chuẩn hóa đội ngũ." },
  { id: 2, title: "Java Hiện Đại: Stream API, Lambda & Optional Monad", desc: "Cơ chế invokedynamic, Spliterator, Custom Collector và lập trình hàm an toàn." },
  { id: 3, title: "Lập trình Hướng Dữ Liệu: Record & Sealed Interface", desc: "Triết lý Data-Oriented Programming, Algebraic Data Types và Pattern Matching Java 21." },
  { id: 4, title: "Quản trị Dự án Đa Module với Apache Maven", desc: "Kiến trúc đa module enterprise, dependency mediation, plugin quản lý chất lượng." }
];

const outcomes = [
  "Thiết lập và tự động hóa chẩn đoán môi trường JDK 21 LTS đạt chuẩn doanh nghiệp",
  "Làm chủ Stream API, viết Custom Collector O(N) và triệt tiêu hoàn toàn lỗi NullPointerException",
  "Áp dụng triết lý Data-Oriented Programming với Record và Sealed Interface xây dựng Domain Model",
  "Tổ chức và quản trị kiến trúc dự án Maven đa module sạch, phân tách rõ ràng trách nhiệm"
];

// Helper to get lesson by old id
const getL = (id) => oldM0.lessons.find(l => l.id === id);

// Curate Topic 1 (0-1-1 to 0-1-4)
const t1_l1 = {
  id: "0-1-1",
  type: "theory",
  title: "Bài 0.1.1: Kiến trúc JDK 21, JVM Internals & Quản trị Môi trường Đa Phiên bản",
  minutes: 7,
  content: getL("0-1-1").content
};

const t1_l2 = {
  id: "0-1-2",
  type: "practice",
  title: "Bài 0.1.2: Triển khai Script Chẩn đoán Môi trường & Chuẩn hóa Code Style Đội ngũ",
  minutes: 7,
  content: getL("0-1-2").content + "\n\n" + getL("0-1-3").content
};

const t1_l3 = {
  id: "0-1-3",
  type: "pitfall",
  title: "Bài 0.1.3: Cạm bẫy Line-Ending CRLF, Thiếu Heap Memory & Lỗi Chứng chỉ SSL CA",
  minutes: 6,
  content: getL("0-1-4").content + "\n\n" + getL("0-1-5").content
};

const t1_l4 = {
  id: "0-1-4",
  type: "synthesis",
  title: "Bài 0.1.4: Milestone Synthesis: Bản đồ Kiến trúc JVM & Ma trận Công cụ Java 21 Enterprise",
  minutes: 8,
  content: `## Milestone Synthesis: Tổng Hợp Kiến Trúc Hạ Tầng JVM & Bộ Công Cụ Java 21 Enterprise

### 1. Sơ Đồ Kiến Trúc Tổng Thể: JVM Subsystems & Quản Trị Runtime Đa Môi Trường

\`\`\`mermaid
flowchart TD
    subgraph DevEnvironment ["Môi Trường Phát Triển & Chuẩn Hóa Đội Ngũ"]
        OS["Hệ Điều Hành (Windows / macOS / Linux)"] --> CLI["Trình Quản Lý SDK (Scoop / SDKMAN / winget)"]
        CLI --> Adoptium["OpenJDK 21 LTS (Eclipse Temurin)"]
        Adoptium --> GitConfig[".gitattributes (eol=lf) + .editorconfig"]
    end

    subgraph JVMRuntime ["Kiến Trúc Tầng Sâu JVM (HotSpot 64-Bit Server VM)"]
        ClassLoaders["Class Loader Subsystem<br/>(Bootstrap -> Platform -> App)"] --> BytecodeExec["Execution Engine"]
        BytecodeExec --> JIT["JIT Tiered Compilation<br/>(C1 Quick -> C2 Hotspot Optimizations)"]
        BytecodeExec --> Interp["Bytecode Interpreter"]
        BytecodeExec --> GC["Garbage Collector (Mặc định: G1GC / Virtual Threads Support)"]
    end

    DevEnvironment --> JVMRuntime
    JVMRuntime --> ContainerPack["Đóng Gói Docker Container (eclipse-temurin:21-jre-alpine)"]
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ (ADR Matrix): Lựa Chọn Bản Phân Phối OpenJDK

| Tiêu chí | Eclipse Temurin (Adoptium) | Amazon Corretto | GraalVM Community | Oracle JDK Thương Mại |
|---|---|---|---|---|
| **Bản quyền & Chi phí** | Hoàn toàn miễn phí, mã nguồn mở, không rủi ro bản quyền | Miễn phí, được AWS bảo đảm pháp lý | Miễn phí (bản CE) | Bắt buộc trả phí OTN khi dùng thương mại |
| **Hạ tầng tối ưu** | Đa nền tảng, on-premise, đa cloud | AWS EC2, ECS, EKS, Lambda | Serverless, Kubernetes cold-start cực nhanh | Hệ thống di sản phụ thuộc Oracle stack |
| **Tính năng nổi bật** | Đạt chuẩn 100% Java TCK, cộng đồng lớn nhất | Bản vá hiệu năng mạng/IO từ Amazon | Ahead-Of-Time (AOT) Native Image | Đội ngũ hỗ trợ kỹ thuật trực tiếp của Oracle |
| **Khuyến nghị sử dụng** | **Mặc định số 1 cho mọi dự án Spring Boot** | Bắt buộc khi hạ tầng 100% nằm trên AWS | Chỉ dùng khi cần cold-start < 50ms & RAM < 64MB | Tránh dùng trừ khi công ty đã mua license |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Tiêu chuẩn Java 21 LTS**: Spring Boot 3.3+ bắt buộc JDK 21+ để tận dụng Virtual Threads và Modern Pattern Matching.
2. **Triệt tiêu CRLF**: File script (\`mvnw\`, \`entrypoint.sh\`) luôn phải được định dạng \`LF\` bằng file \`.gitattributes\`.
3. **Phân biệt JDK và JRE**: Build môi trường dùng JDK (\`eclipse-temurin:21-jdk\`), nhưng image production chỉ chứa JRE (\`eclipse-temurin:21-jre\`) để giảm 40% dung lượng và xóa bỏ công cụ tấn công của hacker.
4. **Xử lý Proxy SSL Doanh Nghiệp**: Khi gặp lỗi \`PKIX path building failed\`, import chứng chỉ Root CA vào \`cacerts\` bằng lệnh \`keytool\`, tuyệt đối không tắt xác thực SSL bừa bãi.
5. **Deterministic Builds**: Khai báo rõ ràng \`maven.compiler.release=21\` trong POM để tránh phụ thuộc vào compiler của máy dev.

---

### 4. Câu Hỏi Phản Biện Kiến Trúc (Architect Review)
> **Tình huống**: Nhóm dự án của bạn đề xuất chuyển toàn bộ Microservices sang biên dịch GraalVM Native Image để giảm RAM xuống dưới 50MB. Là một Senior Engineer, bạn đưa ra những rủi ro kỹ thuật (trade-offs) nào cần cân nhắc trước khi đồng ý?
> 
> *Gợi ý phản biện*: Thời gian build CI/CD kéo dài gấp 10-20 lần (tốn 10-15 phút thay vì 30 giây); tính năng Dynamic Reflection và CGLIB proxy của Spring bị giới hạn; và JIT compiler lâu dài trên HotSpot có thể tối ưu throughput đỉnh cao hơn AOT trong các ứng dụng web chạy liên tục 24/7.`
};

// Curate Topic 2 (0-2-1 to 0-2-4)
const t2_l1 = {
  id: "0-2-1",
  type: "theory",
  title: "Bài 0.2.1: Cơ chế Lambda invokedynamic, Spliterator & Vòng đời Stream Pipeline",
  minutes: 8,
  content: getL("0-2-1").content
};

const t2_l2 = {
  id: "0-2-2",
  type: "practice",
  title: "Bài 0.2.2: Xây dựng Custom Collector Single-Pass O(N) & Optional Monad Chaining",
  minutes: 7,
  content: getL("0-2-2").content + "\n\n" + getL("0-2-3").content
};

const t2_l3 = {
  id: "0-2-3",
  type: "pitfall",
  title: "Bài 0.2.3: Hiểm họa parallelStream làm kiệt commonPool & Bẫy Optional Serialization",
  minutes: 6,
  content: getL("0-2-4").content + "\n\n" + getL("0-2-5").content
};

const t2_l4 = {
  id: "0-2-4",
  type: "synthesis",
  title: "Bài 0.2.4: Milestone Synthesis: Bản đồ Dòng chảy Stream Pipeline & Ma trận Xử lý Dữ liệu Lập trình Hàm",
  minutes: 8,
  content: `## Milestone Synthesis: Tổng Hợp Kiến Trúc Dữ Liệu Stream API & Lập Trình Hàm

### 1. Sơ Đồ Kiến Trúc: Cơ Chế Lazy Spliterator & Single-Pass Pipeline

\`\`\`mermaid
flowchart LR
    Source["Data Source<br/>(Collection, Array, I/O)"] --> Spliterator["Spliterator<br/>(tryAdvance / trySplit)"]
    subgraph IntermediateOps ["Giai Đoạn Đăng Ký Lười (Lazy Evaluation)"]
        Spliterator --> Filter["filter(Predicate)"]
        Filter --> Map["map(Function)"]
        Map --> Distinct["distinct() / sorted()"]
    end
    subgraph TerminalOp ["Giai Đoạn Kích Hoạt Thực Thi (Eager Execution)"]
        Distinct --> Collector["collect(Collector)<br/>Single-Pass Duyệt 1 Lượt O(N)"]
        Collector --> Result["Immutable Result / DTO"]
    end
    style IntermediateOps fill:#1e293b,stroke:#3b82f6,color:#fff
    style TerminalOp fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Lựa Chọn Mô Hình Xử Lý Dữ Liệu

| Mô hình | Vòng lặp For truyền thống | Java Stream API | Parallel Stream | Reactive Streams (Reactor) |
|---|---|---|---|---|
| **Độ phức tạp code** | Dài dòng, nhiều mutable state | Ngắn gọn, phong cách khai báo (declarative) | Ngắn nhưng ẩn chứa cạm bẫy thread pool | Phức tạp, đường cong học dốc |
| **Hiệu năng CPU** | Nhanh nhất cho tập dữ liệu cực nhỏ (< 1000 items) | Tương đương for-loop khi JIT tối ưu | Rất nhanh cho CPU-bound nặng trên triệu items | Tối ưu I/O non-blocking, không dành cho CPU nặng |
| **Quản trị Thread** | Chạy trên caller thread | Chạy trên caller thread | Dùng chung \`ForkJoinPool.commonPool()\` | Event loop (Netty) đa luồng phản hồi |
| **Khi nào nên dùng** | Thuật toán low-level cần break/continue sớm | **Mặc định cho hầu hết nghiệp vụ backend** | Chỉ dùng khi tập dữ liệu > 1M phần tử và CPU-heavy | Hệ thống gateway, webchat, streaming thời gian thực |
| **Chống chỉ định** | Code nghiệp vụ phức tạp dễ dính NPE | Cần break sớm khỏi vòng lặp vô tận | **Cấm dùng cho I/O blocking (DB, HTTP API)** | Ứng dụng CRUD thông thường (tăng độ phức tạp thừa) |

---

### 3. Key Takeaways & Nguyên Tắc Thiết Kế
1. **Bản chất \`invokedynamic\`**: Lambda không sinh file class nội danh; nó tận dụng bytecode liên kết động giúp JVM không tiêu tốn heap object rác.
2. **Quy tắc vàng Optional**: Chỉ dùng Optional làm kiểu trả về của phương thức. Không dùng làm field của Entity/Class, không làm tham số method.
3. **Cấm lạm dụng \`get()\`**: Tuyệt đối không gọi \`optional.get()\` trực tiếp; hãy dùng \`.map()\`, \`.filter()\`, \`.orElse()\` hoặc \`.orElseThrow()\`.
4. **Single-Pass Collector**: Khi cần tính nhiều thông số (sum, avg, min, max), viết Custom Collector duyệt 1 vòng thay vì gọi stream 4 lần riêng biệt.
5. **Cô lập Parallel Stream**: Nếu bắt buộc xử lý song song, bọc trong một instance \`ForkJoinPool\` riêng biệt.`
};

// Curate Topic 3 (0-3-1 to 0-3-4)
const t3_l1 = {
  id: "0-3-1",
  type: "theory",
  title: "Bài 0.3.1: Triết lý Data-Oriented Programming: Record, Sealed Hierarchy & Exhaustive Pattern Matching",
  minutes: 8,
  content: getL("0-3-1").content
};

const t3_l2 = {
  id: "0-3-2",
  type: "practice",
  title: "Bài 0.3.2: Thiết kế State Machine Thanh Toán Bất Biến với Sealed Interface & Pattern Matching",
  minutes: 7,
  content: getL("0-3-2").content + "\n\n" + getL("0-3-3").content
};

const t3_l3 = {
  id: "0-3-3",
  type: "pitfall",
  title: "Bài 0.3.3: Cạm bẫy Bất biến Nông (Shallow Immutability) & Rủi ro Dùng Record làm JPA Entity",
  minutes: 6,
  content: getL("0-3-4").content + "\n\n" + getL("0-3-5").content
};

const t3_l4 = {
  id: "0-3-4",
  type: "synthesis",
  title: "Bài 0.3.4: Milestone Synthesis: Bản đồ Kiến trúc DOP & Ma trận Mô hình hóa Dữ liệu Doanh nghiệp",
  minutes: 8,
  content: `## Milestone Synthesis: Data-Oriented Programming & Algebraic Data Types

### 1. Sơ Đồ Cấu Trúc: Algebraic Data Types (Sum Types + Product Types)

\`\`\`mermaid
classDiagram
    class PaymentEvent {
        <<sealed interface>>
    }
    class PaymentCreated {
        <<record>>
        +String orderId
        +BigDecimal amount
    }
    class PaymentAuthorized {
        <<record>>
        +String transactionId
        +String authCode
    }
    class PaymentFailed {
        <<record>>
        +String errorCode
        +String reason
    }
    PaymentEvent <|-- PaymentCreated : permits
    PaymentEvent <|-- PaymentAuthorized : permits
    PaymentEvent <|-- PaymentFailed : permits
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Lựa Chọn Mô Hình Class Trong Java 21

| Tiêu chuẩn | Java 21 Record | Lombok @Data / @Value | Class POJO Truyền Thống | JPA @Entity |
|---|---|---|---|---|
| **Tính bất biến** | Bất biến nông mặc định (final fields) | Cần cấu hình \`@Value\` thủ công | Phải tự code private final và bỏ setter | **Mutable bắt buộc** (Hibernate cần setter/proxy) |
| **Phù hợp làm DTO** | **Tối ưu tuyệt đối** (REST payload, Event) | Tốt, nhưng cần plugin IDE & annotation | Tốn hàng trăm dòng boilerplate | Cấm dùng Entity làm DTO trực tiếp |
| **Pattern Matching** | Hỗ trợ Record Pattern Deconstruction | Không hỗ trợ Record Pattern | Không hỗ trợ deconstruction | Không hỗ trợ deconstruction |
| **Khả năng tương thích JPA** | **KHÔNG DÙNG làm Entity** (vi phạm no-arg constructor) | Hỗ trợ (\`@Getter\`, \`@Setter\`, tránh \`@EqualsAndHashCode\`) | Tương thích 100% | Là đối tượng cốt lõi của Hibernate |
| **Khuyến nghị** | Dùng cho 100% Request/Response DTO và Domain Events | Dùng bổ trợ cho Entity và Spring Bean | Chỉ duy trì trên mã nguồn legacy cũ | Chỉ dùng thuần túy cho tầng Persistence (DB mapping) |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Triết lý DOP**: Phân tách rạch ròi Dữ liệu (Record bất biến) và Hành vi (Service stateless).
2. **Bất biến sâu (Deep Immutability)**: Nếu Record chứa List/Set, luôn bọc bằng \`List.copyOf()\` trong Compact Constructor để ngăn chặn sửa đổi tham chiếu.
3. **Exhaustive Pattern Matching**: Khi kết hợp \`sealed interface\` với \`switch expression\`, trình biên dịch kiểm tra đầy đủ mọi trường hợp, không cần nhánh \`default\` thừa thãi.
4. **Cấm dùng Record làm JPA Entity**: JPA yêu cầu class phải có no-argument constructor và mutable state để Hibernate proxy hoạt động; Record sinh ra để làm DTO bất biến, không phải Entity cơ sở dữ liệu.`
};

// Curate Topic 4 (0-4-1 to 0-4-4)
const t4_l1 = {
  id: "0-4-1",
  type: "theory",
  title: "Bài 0.4.1: Kiến trúc Maven Multi-Module, Dependency Mediation & Vòng đời Build Chuẩn",
  minutes: 8,
  content: getL("0-4-1").content
};

const t4_l2 = {
  id: "0-4-2",
  type: "practice",
  title: "Bài 0.4.2: Khởi tạo Cấu trúc Dự án Đa Module Chuẩn: Common, Domain, Core, Web",
  minutes: 7,
  content: getL("0-4-2").content + "\n\n" + getL("0-4-3").content
};

const t4_l3 = {
  id: "0-4-3",
  type: "pitfall",
  title: "Bài 0.4.3: Cạm bẫy Xung đột Phiên bản Jar Hell, Circular Dependency & Lỗi Plugin Execution",
  minutes: 6,
  content: getL("0-4-4").content + "\n\n" + getL("0-4-5").content
};

const t4_l4 = {
  id: "0-4-4",
  type: "synthesis",
  title: "Bài 0.4.4: Milestone Synthesis: Bản đồ Phân tầng Đa Module Maven & Ma trận Kiến trúc Dự án",
  minutes: 8,
  content: `## Milestone Synthesis: Tổng Hợp Kiến Trúc Quản Trị Đa Module Maven Enterprise

### 1. Sơ Đồ Kiến Trúc: Đồ Thị Phụ Thuộc Hướng Một Chiều (Directed Acyclic Graph)

\`\`\`mermaid
flowchart TD
    Root["root-parent (pom.xml)<br/>• Khai báo <dependencyManagement><br/>• Khai báo <modules>"]
    
    subgraph Layers ["Kiến Trúc Phân Tầng Đa Module"]
        Common["ecommerce-common<br/>(Tiện ích, Validation, Exception chuẩn)"]
        Domain["ecommerce-domain<br/>(Records, Value Objects, Domain Events)"]
        Core["ecommerce-core<br/>(Service Interfaces, Business Logic, Port)"]
        Web["ecommerce-web-api<br/>(REST Controller, Spring Boot Application Entry)"]
    end

    Root --> Common
    Root --> Domain
    Root --> Core
    Root --> Web

    Domain --> Common
    Core --> Domain
    Core --> Common
    Web --> Core
    Web --> Domain

    style Root fill:#1e293b,stroke:#3b82f6,color:#fff
    style Web fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Lựa Chọn Cấu Trúc Quản Trị Mã Nguồn

| Tiêu chuẩn | Maven Multi-Module (Monorepo) | Single-Module Monolith | Micro-Repos (Polyrepo) |
|---|---|---|---|
| **Quy mô phù hợp** | Dự án vừa và lớn (10 - 50 kỹ sư) | Dự án nhỏ, MVP, Proof of Concept | Doanh nghiệp lớn với hàng chục team độc lập |
| **Kiểm soát phụ thuộc** | **Cực tốt**, ngăn chặn circular dependency | Không có ranh giới module vật lý | Phụ thuộc qua artifact Nexus/Artifactory |
| **Tốc độ CI/CD** | Tối ưu với Maven Build Cache & Docker Layer | Nhanh ban đầu, chậm dần khi phình to | Build độc lập nhưng khó kiểm thử end-to-end |
| **Tái sử dụng code** | Tái sử dụng trực tiếp qua Maven coordinates | Khó tái sử dụng, code bị copy-paste | Tái sử dụng qua shared library JAR |
| **Khuyến nghị** | **Tiêu chuẩn công nghiệp hàng đầu cho Spring Boot** | Chỉ dùng cho bài tập nhỏ hoặc prototype 1 ngày | Chỉ áp dụng khi có nền tảng DevOps & CI/CD hoàn thiện |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Quy tắc phân giải Nearest-Wins**: Maven ưu tiên version ở tầng nông hơn trên dependency tree. Luôn dùng \`<dependencyManagement>\` ở parent POM để khóa chết phiên bản.
2. **Cấm vòng tròn phụ thuộc (Circular Dependency)**: Module A gọi B, B gọi A là lỗi thiết kế nghiêm trọng, Maven sẽ từ chối build ngay lập tức.
3. **Phân tách rạch ròi phạm vi**: Tầng Domain không bao giờ phụ thuộc vào tầng Web/Controller. Mã nghiệp vụ phải độc lập với framework trình diễn.
4. **Quản lý dependency scope**: Dùng đúng \`scope\` (\`compile\`, \`runtime\`, \`provided\`, \`test\`) để giữ artifact production nhẹ nhất và bảo mật nhất.`
};

// 4 Additional Quiz questions to make inline quiz 16 questions (16 + 20 in expanded = 36 total)
const additionalQuestions = [
  {
    level: "medium",
    scenario: "Một lập trình viên cấu trúc dự án đa module khai báo module 'order-domain' phụ thuộc vào module 'order-web-api' để sử dụng tiện ích parse HTTP Request.",
    q: "Hành vi này vi phạm nguyên tắc kiến trúc nào và hậu quả trực tiếp khi build bằng Maven là gì?",
    options: [
      "Vi phạm Dependency Rule của Clean Architecture và có nguy cơ cao tạo ra Circular Dependency khiến Maven báo lỗi 'The projects in the reactor contain a cycle'",
      "Không vi phạm gì, Maven tự động hợp nhất các class vào chung một package",
      "Vi phạm quy tắc bảo mật JVM khiến file JAR bị từ chối chạy trên Docker",
      "Maven sẽ tự động xóa bỏ dependency này mà không thông báo"
    ],
    answer: 0,
    explain: "Trong Clean Architecture, tầng trong (Domain) tuyệt đối không được biết hoặc phụ thuộc vào tầng ngoài (Web/API). Nếu Web phụ thuộc Domain mà Domain lại phụ thuộc Web sẽ sinh ra Circular Dependency (phụ thuộc vòng tròn) làm Maven Reactor gãy ngay lập tức.",
    why: [
      "✓ Đúng — Đây là nguyên lý cốt lõi của việc tổ chức module: dòng phụ thuộc luôn hướng một chiều từ ngoài vào trong.",
      "Maven không bao giờ tự động gộp class nếu cấu trúc phụ thuộc bị sai.",
      "JVM không kiểm tra kiến trúc phân tầng ở tầng class loader theo cách này.",
      "Maven là công cụ build tất định (deterministic), không bao giờ tự xóa dependency của người dùng."
    ]
  },
  {
    level: "medium",
    scenario: "Khi một client gửi payload JSON đến Spring Boot REST Controller nhận đối tượng Java 21 Record làm @RequestBody DTO.",
    q: "Tại sao thư viện Jackson trong Spring Boot 3 có thể deserialize trực tiếp vào Record mà không cần bất kỳ method setter hay constructor rỗng nào?",
    options: [
      "Jackson tự động nhận diện Canonical Constructor của Java Record và map các JSON properties vào đúng tên các component của Record",
      "Jackson can thiệp sửa đổi bytecode của JVM khi ứng dụng khởi động",
      "Jackson tự động chuyển đổi Record thành HashMap trước khi gán dữ liệu",
      "Jackson bắt buộc developer phải tự viết Deserializer tùy biến cho mọi Record"
    ],
    answer: 0,
    explain: "Kể từ Jackson 2.12+, Jackson có hỗ trợ native cho Java Record (JEP 395). Nó sử dụng Canonical Constructor của Record để nạp dữ liệu trực tiếp trong 1 bước duy nhất mà không cần setter hay no-arg constructor.",
    why: [
      "✓ Đúng — Tính năng hỗ trợ native này biến Java Record thành DTO hoàn hảo cho Spring Boot 3 REST API.",
      "Jackson sử dụng Java Reflection chuẩn, không hack bytecode của JVM runtime.",
      "Jackson map trực tiếp vào type an toàn, không thông qua HashMap trung gian.",
      "Không cần viết custom deserializer, Jackson xử lý tự động hoàn toàn."
    ]
  },
  {
    level: "hard",
    scenario: "Hệ thống Microservices tài chính chạy trên Java 21 có yêu cầu độ trễ P99 cực thấp (dưới 10ms) với bộ nhớ Heap lớn (16GB) phục vụ hàng nghìn request/giây.",
    q: "Garbage Collector nào được khuyến nghị cấu hình để giảm thiểu tối đa hiện tượng Stop-The-World pause?",
    options: [
      "Generational ZGC (kích hoạt qua cờ -XX:+UseZGC -XX:+ZGenerational) với thời gian pause điển hình dưới 1 mili-giây",
      "Serial GC (-XX:+UseSerialGC) để tiết kiệm CPU cho các tiến trình khác",
      "Parallel GC (-XX:+UseParallelGC) để tối ưu throughput tối đa bất chấp thời gian dừng",
      "Tắt hoàn toàn Garbage Collector bằng Epsilon GC trên production"
    ],
    answer: 0,
    explain: "Java 21 chính thức giới thiệu Generational ZGC (JEP 439). ZGC thực hiện hầu hết công việc dọn dẹp bộ nhớ đồng thời (concurrent) cùng luồng ứng dụng, mang lại thời gian dừng Stop-the-world cực nhỏ (dưới 1ms) bất kể kích thước heap từ vài GB đến vài TB.",
    why: [
      "✓ Đúng — Generational ZGC là bước nhảy vọt về hiệu năng độ trễ thấp của JVM trong Java 21 LTS.",
      "Serial GC là bộ thu gom đơn luồng, sẽ gây pause hàng giây trên heap lớn.",
      "Parallel GC ưu tiên throughput tính toán nhưng thời gian dừng Stop-the-world có thể lên tới vài giây khi dọn Full GC.",
      "Epsilon GC không thu gom bộ nhớ, ứng dụng sẽ bị OutOfMemoryError sập chỉ sau vài phút chạy."
    ]
  },
  {
    level: "medium",
    scenario: "Khi đóng gói Docker Image cho ứng dụng Spring Boot trên Linux container, tại sao file .gitattributes cần có quy tắc '* text=auto eol=lf'?",
    q: "Hậu quả kỹ thuật nếu commit file script chứa ký tự CRLF lên repository là gì?",
    options: [
      "Linux bash shell sẽ coi ký tự \\r là một phần của tên lệnh/file và báo lỗi '/bin/sh: ./mvnw\\r: not found' khiến container khởi động thất bại",
      "Docker Daemon sẽ từ chối kéo base image từ Docker Hub",
      "File JAR sẽ bị mã hóa sai và tăng dung lượng gấp đôi",
      "Không có ảnh hưởng nào vì Docker tự động chuẩn hóa định dạng ký tự"
    ],
    answer: 0,
    explain: "Windows sử dụng cặp ký tự \\r\\n (CRLF) trong khi Unix/Linux chỉ sử dụng \\n (LF). Khi file script như mvnw hoặc entrypoint.sh có \\r, Linux shell sẽ cố tìm file có tên 'mvnw\\r' và ném lỗi không tìm thấy file.",
    why: [
      "✓ Đúng — Đây là lỗi môi trường phổ biến nhất của các lập trình viên làm việc trên Windows khi deploy lên Linux container.",
      "Docker Daemon không kiểm tra định dạng ký tự xuống dòng khi tải image.",
      "Dung lượng JAR không bị ảnh hưởng bởi line-ending của file script.",
      "Docker không can thiệp sửa đổi nội dung file script của người dùng."
    ]
  }
];

// Build new module 0
const inlineQuiz = oldM0.lessons.find(l => l.type === 'quiz');
const updatedQuizQuestions = inlineQuiz.questions.concat(additionalQuestions);

const newLessons = [
  t1_l1, t1_l2, t1_l3, t1_l4,
  t2_l1, t2_l2, t2_l3, t2_l4,
  t3_l1, t3_l2, t3_l3, t3_l4,
  t4_l1, t4_l2, t4_l3, t4_l4,
  {
    id: "0-quiz",
    type: "quiz",
    title: "Quiz Module 0 — Sát Hạch Toàn Diện Nền Tảng Java 21 & Công Cụ",
    questions: updatedQuizQuestions
  }
];

const newM0 = {
  id: 0,
  title: "Nền tảng Java & Công cụ",
  subtitle: "JDK 21, Modern Java, Stream & Multi-Module Maven",
  icon: "☕",
  desc: "Nền tảng Java 21 LTS hiện đại, lambda/stream chuyên sâu, record, sealed class và quản trị Maven đa module.",
  topics: topics,
  outcomes: outcomes,
  retrievalWarmup: null,
  lessons: newLessons
};

const outputContent = `/* MODULE 0 — Nền tảng Java & Công cụ (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(${JSON.stringify(newM0, null, 2)});\n`;

fs.writeFileSync(m0Path, outputContent, 'utf8');
console.log('Successfully curated module0.js!');
console.log('Total content lessons:', newLessons.filter(l => l.type !== 'quiz').length);
console.log('Total quiz questions:', updatedQuizQuestions.length);
