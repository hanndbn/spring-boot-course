const fs = require('fs');
const path = require('path');

const modPath = path.join(__dirname, '..', 'js', 'content', 'module0.js');
global.window = { COURSE_MODULES: [], EXPANDED_QUIZZES: {} };
new Function('window', fs.readFileSync(modPath, 'utf8'))(window);

const mod = window.COURSE_MODULES[0];

// Diagram 0-1-1: HotSpot JVM Subsystems & Memory Areas
const diag_0_1_1 = `
### Sơ Đồ Kiến Trúc: HotSpot JVM Internals & Bố Cục Bộ Nhớ Java 21

\`\`\`mermaid
flowchart TD
    subgraph ClassLoaderSystem ["1. Class Loader Subsystem (Nạp Lớp)"]
        CL1["Bootstrap ClassLoader (C++ Native / lib/modules)"] --> CL2["Platform ClassLoader (java.net, java.sql)"]
        CL2 --> CL3["Application ClassLoader (Classpath & App JARs)"]
    end

    subgraph MemoryAreas ["2. JVM Memory Areas (Vùng Nhớ Runtime)"]
        Metaspace["Metaspace (Off-Heap: Class Metadata, Bytecode, Static Vars)"]
        Heap["Heap Space (Tenured / G1 Regions: Tồn tại Objects, Records)"]
        Stack["JVM Thread Stacks (Mỗi Thread: Frame, Local Vars, Operand Stack)"]
        VThreadArea["Virtual Threads Carrier Pool (ForkJoinPool Worker Threads)"]
    end

    subgraph ExecEngine ["3. Execution Engine (Cỗ Máy Thực Thi)"]
        Interpreter["Bytecode Interpreter (Thực thi ban đầu)"]
        JIT["Tiered JIT Compiler (C1 Client -> C2 Server Machine Code)"]
        GC["Garbage Collector (G1GC mặc định / ZGC siêu thấp latency)"]
    end

    ClassLoaderSystem --> MemoryAreas
    MemoryAreas --> ExecEngine
    Stack -.->|Virtual Thread Mounted on Carrier| VThreadArea
    style Heap fill:#064e3b,stroke:#10b981,color:#fff
    style ExecEngine fill:#1e293b,stroke:#3b82f6,color:#fff
\`\`\`
`;

// Diagram 0-1-2: Team Environment Pipeline
const diag_0_1_2 = `
### Sơ Đồ Quy Trình: Chuẩn Hóa Môi Trường & CI/CD Guardrails Cho Đội Ngũ

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer (Win/Mac/Linux)
    participant IDE as IntelliJ / VS Code (.editorconfig)
    participant Git as Git Client (.gitattributes)
    participant Script as env-doctor.ps1 / .sh
    participant CI as Jenkins / GitHub Actions CI (Linux Docker)

    Dev->>Script: Chạy env-doctor chẩn đoán máy cục bộ
    Script-->>Dev: Xác nhận JDK 21+, Docker Daemon, UTF-8 OK
    Dev->>IDE: Viết code nghiệp vụ E-Commerce
    IDE->>IDE: Tự động format indent=4, newline=LF theo .editorconfig
    Dev->>Git: git commit & push code
    Git->>Git: Ép eol=lf, ngăn chặn ký tự \\r\\n làm hỏng script
    Git->>CI: Webhook kích hoạt Pipeline
    CI->>CI: Chạy mvnw clean test trên Linux Alpine Container (Thành công 100%)
\`\`\`
`;

// Diagram 0-1-3: CRLF Bug vs Corporate SSL Inspection
const diag_0_1_3 = `
### Sơ Đồ Phân Tích: Cạm Bẫy CRLF Khi Build Docker & Tường Lửa Proxy SSL

\`\`\`mermaid
flowchart TD
    subgraph CRLFBug ["Sự Cố 1: Ký Tự Xuống Dòng CRLF Trên Linux"]
        Win["Windows OS: Lưu file mvnw với \\r\\n"] -->|git push| Repo["Git Repo"]
        Repo -->|git clone| DockerLinux["Docker Linux Container: Chỉ hiểu \\n"]
        DockerLinux -->|Exec ./mvnw| Crash["LỖI: /bin/sh: ./mvnw\\r: not found (CRASH!)"]
        DockerLinux -.->|Khắc phục| Solution1[".gitattributes: * text=auto eol=lf"]
    end

    subgraph SSLBug ["Sự Cố 2: Tường Lửa Corporate SSL Inspection Proxy"]
        Maven["Maven / JDK 21 Client"] -->|HTTPS GET Maven Central| FW["Tường Lửa Proxy Công Ty (Zscaler / Fortinet)"]
        FW -->|Thay thế chứng chỉ bằng Corporate Root CA| Maven
        Maven -->|Kiểm tra cacerts mặc định| SSLError["LỖI: PKIX path building failed: unable to find valid certification path"]
        Maven -.->|Khắc phục| Solution2["keytool -importcert -keystore cacerts -file company-root-ca.crt"]
    end

    style Crash fill:#7c2d12,stroke:#f97316,color:#fff
    style SSLError fill:#7c2d12,stroke:#f97316,color:#fff
    style Solution1 fill:#064e3b,stroke:#10b981,color:#fff
    style Solution2 fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 0-2-2: Custom Collector Accumulator State Diagram
const diag_0_2_2 = `
### Sơ Đồ Luồng Dữ Liệu: Cơ Chế Single-Pass Accumulation Của Custom Collector

\`\`\`mermaid
flowchart LR
    subgraph InputData ["Dòng Chảy 1,000,000 Giao Dịch E-Commerce"]
        Tx1["Tx 1: 100k"] --> Stream
        Tx2["Tx 2: 500k"] --> Stream
        TxN["Tx N: 250k"] --> Stream["Stream Pipeline"]
    end

    subgraph CollectorCore ["Custom Collector (1 Lượt Duyệt Duy Nhất O(N))"]
        Supplier["Supplier: Tạo Accumulator mới"] --> Accumulator["Accumulator: accept(amount)"]
        Stream --> Accumulator
        Accumulator -->|Cập nhật tại chỗ| State["count++<br/>totalVolume += amt<br/>min = min(min, amt)<br/>max = max(max, amt)"]
        State --> Finisher["Finisher: toSummary()<br/>Tính trung bình avg = total / count"]
    end

    Finisher --> Output["TransactionSummary Record (Bất biến)"]
    style CollectorCore fill:#1e293b,stroke:#3b82f6,color:#fff
    style Output fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 0-2-3: ForkJoinPool CommonPool Starvation
const diag_0_2_3 = `
### Sơ Đồ Cảnh Báo: Sự Cố Tràn ForkJoinPool.commonPool Do Blocking I/O

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor ClientA as User A (Yêu Cầu Xuất Báo Cáo 1,000 Đơn Hàng)
    participant JVM as JVM ForkJoinPool.commonPool (7 Threads)
    actor ClientB as User B (Đăng Nhập / Mua Hàng)
    participant ExtAPI as External Payment Gateway / Database

    ClientA->>JVM: parallelStream().map(gọi ExtAPI)
    Note over JVM: Toàn bộ 7 Worker Threads bị chiếm dụng để CHỜ I/O mạng!
    JVM->>ExtAPI: HTTP Request (Network Latency 1500ms)
    ClientB->>JVM: Gửi request mua hàng (Cần CPU tính toán)
    JVM-->>ClientB: ĐÓNG BĂNG! Không còn Worker Thread nào khả dụng!
    Note over ClientB: 504 Gateway Timeout hoặc Crash Tomcat Server!
    ExtAPI-->>JVM: Response trả về
    Note over JVM: Giải pháp: Cô lập trong custom new ForkJoinPool(4)
\`\`\`
`;

// Diagram 0-3-2: E-Commerce Payment State Machine
const diag_0_3_2 = `
### Sơ Đồ Trạng Thái: State Machine Thanh Toán Bất Biến (E-Commerce Payment Lifecycle)

\`\`\`mermaid
stateDiagram-v2
    [*] --> PaymentPending: Khách bấm 'Thanh Toán'
    
    state PaymentPending {
        [*] --> ValidatingOrder
        ValidatingOrder --> CallingGateway: Hợp lệ
    }
    
    PaymentPending --> PaymentSuccess: Gateway trả về TxnId (Đã trừ tiền)
    PaymentPending --> PaymentFailed: Thẻ hết hạn / Số dư không đủ
    PaymentPending --> GatewayTimeout: Gateway không phản hồi sau 5s
    
    GatewayTimeout --> ManualReconcileRequired: Bắn vào hàng đợi đối soát
    PaymentSuccess --> PaymentRefunded: Khách hủy đơn trong 24h
    PaymentFailed --> [*]: Hủy phiên giao dịch
    PaymentRefunded --> [*]: Hoàn tiền vào ví
\`\`\`
`;

// Diagram 0-3-3: Shallow vs Deep Immutability Memory Layout
const diag_0_3_3 = `
### Sơ Đồ Bố Cục Bộ Nhớ: Bất Biến Nông (Shallow) vs Bất Biến Sâu (Deep Immutability)

\`\`\`mermaid
flowchart TD
    subgraph ShallowBug ["Bẫy Bất Biến Nông (Shallow Immutability)"]
        R1["record Order(String id, List items)"] -->|Final Reference| L1["ArrayList trên Heap (MUTABLE!)"]
        L1 --> I1["Item 1"]
        L1 --> I2["Item 2"]
        Hacker["Mã bên ngoài: order.items().clear()"] -.->|Phá hủy dữ liệu ngầm| L1
    end

    subgraph DeepSafe ["Chuẩn Sản Xuất: Bất Biến Sâu (Deep Immutability)"]
        R2["record Order(String id, List items)<br/>Constructor: this(id, List.copyOf(items))"] -->|Final Reference| L2["UnmodifiableList trên Heap (IMMUTABLE)"]
        L2 --> I3["Item 1"]
        L2 --> I4["Item 2"]
        Caller["order.items().add(newItem)"] -.->|Ném UnsupportedOperationException!| L2
    end

    style ShallowBug fill:#7c2d12,stroke:#f97316,color:#fff
    style DeepSafe fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 0-4-2: Maven Multi-Module Dependency Graph
const diag_0_4_2 = `
### Sơ Đồ Kiến Trúc: Đồ Thị Phụ Thuộc Dự Án Đa Module (Maven Dependency Graph)

\`\`\`mermaid
graph TD
    Parent["ecommerce-platform (Root POM: Quản lý dependencyManagement & plugins)"]
    
    subgraph Modules ["Cấu Trúc Đa Tầng Phân Tách Trách Nhiệm"]
        Common["ecommerce-common<br/>(DTOs, Exceptions, Utilities, Constants)"]
        Domain["ecommerce-domain<br/>(Entities, Value Objects, JPA Repositories)"]
        Core["ecommerce-core<br/>(Business Logic Services, Payment Workflows, Events)"]
        Web["ecommerce-web-api<br/>(Spring Boot Main App, Controllers, OpenAPI Swagger)"]
    end

    Parent --> Common
    Parent --> Domain
    Parent --> Core
    Parent --> Web

    Domain --> Common
    Core --> Domain
    Core --> Common
    Web --> Core
    Web --> Domain
    Web --> Common

    style Parent fill:#1e293b,stroke:#3b82f6,color:#fff
    style Web fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 0-4-3: Maven Nearest-Wins Conflict Tree
const diag_0_4_3 = `
### Sơ Đồ Cây Phân Giải: Thuật Toán Nearest-Wins & Cạm Bẫy Jar Hell Của Maven

\`\`\`mermaid
flowchart TD
    App["ecommerce-web-api (Ứng Dụng Chính)"]
    
    subgraph BranchA ["Nhánh A (Độ Sâu = 2: Gần Hơn)"]
        App --> StarterA["spring-boot-starter-logging (Tầng 1)"]
        StarterA --> Log4jA["log4j-to-slf4j: 2.14.0 (Tầng 2 - CHỨA LỖ HỔNG BẢO MẬT LOG4SHELL!)"]
    end

    subgraph BranchB ["Nhánh B (Độ Sâu = 3: Xa Hơn)"]
        App --> StarterB["custom-payment-sdk (Tầng 1)"]
        StarterB --> LibC["audit-lib (Tầng 2)"]
        LibC --> Log4jB["log4j-to-slf4j: 2.22.0 (Tầng 3 - BẢN ĐÃ VÁ LỖ HỔNG)"]
    end

    Decision{"Maven Nearest-Wins Phán Quyết:"}
    BranchA --> Decision
    BranchB --> Decision
    Decision -->|Chọn bản ở tầng nông hơn| Selected["Maven Ép Dùng Bản 2.14.0 CŨ! Nguy cơ sập hệ thống!"]
    Selected -.->|Giải Pháp Chuẩn| Fix["Khai báo đè trong Root POM dependencyManagement để ép version toàn dự án"]

    style Selected fill:#7c2d12,stroke:#f97316,color:#fff
    style Fix fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Map of diagrams to inject
const injections = {
  '0-1-1': diag_0_1_1,
  '0-1-2': diag_0_1_2,
  '0-1-3': diag_0_1_3,
  '0-2-2': diag_0_2_2,
  '0-2-3': diag_0_2_3,
  '0-3-2': diag_0_3_2,
  '0-3-3': diag_0_3_3,
  '0-4-2': diag_0_4_2,
  '0-4-3': diag_0_4_3,
};

let updatedCount = 0;
mod.lessons.forEach(l => {
  if (injections[l.id] && !l.content.includes('mermaid')) {
    l.content = injections[l.id] + '\n\n' + l.content;
    updatedCount++;
    console.log(`[ENRICHED] ${l.id}: ${l.title}`);
  }
});

// Write back
const outputCode = `/* MODULE 0 — Nền tảng Java & Công cụ (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(${JSON.stringify(mod, null, 2)});\n`;

fs.writeFileSync(modPath, outputCode, 'utf8');
console.log(`\nHoàn thành bổ sung sơ đồ Mermaid cho Module 0! Số bài cập nhật: ${updatedCount}/9`);
