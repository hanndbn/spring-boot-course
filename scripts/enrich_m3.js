const fs = require('fs');
const path = require('path');

const modPath = path.join(__dirname, '..', 'js', 'content', 'module3.js');
global.window = { COURSE_MODULES: [], EXPANDED_QUIZZES: {} };
new Function('window', fs.readFileSync(modPath, 'utf8'))(window);

const mod = window.COURSE_MODULES[0];

// Diagram 3-1-2: Entity Relationship Modeling
const diag_3_1_2 = `
### Sơ Đồ Thực Thể: Thiết Kế Quan Hệ Chuẩn One-To-Many & Many-To-One Trong E-Commerce

\`\`\`mermaid
erDiagram
    ORDER ||--o{ ORDER_ITEM : "1 Order có Nhiều OrderItem (mappedBy='order')"
    CUSTOMER ||--o{ ORDER : "1 Customer có Nhiều Order"
    
    ORDER {
        bigint id PK
        string order_code UK
        string customer_id FK
        numeric total_amount
        string status
        timestamp created_at "JPA Auditing"
        string created_by "JPA Auditing"
    }
    
    ORDER_ITEM {
        bigint id PK
        bigint order_id FK "Foreign Key vật lý"
        string product_id
        integer quantity
        numeric unit_price
    }
\`\`\`
`;

// Diagram 3-1-3: Lombok @Data HashCode Bug
const diag_3_1_3 = `
### Sơ Đồ Cơ Chế: Cạm Bẫy Lombok @Data Làm Hỏng HashSet & Equals Trong Hibernate

\`\`\`mermaid
flowchart TD
    subgraph LombokBug ["CẠM BẪY: Lombok @Data Tính HashCode Dựa Trên ID"]
        NewEntity["Order order = new Order() (id = null)<br/>hashCode = 0"] --> InsertSet["set.add(order)<br/>Lưu vào Bucket 0 của HashSet"]
        InsertSet --> Persist["entityManager.persist(order)<br/>Database sinh ID = 99"]
        Persist --> HashChanged["order.getId() = 99 -> hashCode() nhảy thành 12345!"]
        HashChanged --> LookUp["set.contains(order) tìm ở Bucket 12345 -> TRẢ VỀ FALSE!"]
        LookUp --> Fatal["HẬU QUẢ: Mất dấu thực thể trong Session, xóa nhầm dữ liệu, rò rỉ RAM!"]
    end

    subgraph SolutionFix ["GIẢI PHÁP CHUẨN KỸ THUẬT: Business Key / Chỉ Dùng Getter/Setter"]
        Clean["Chỉ dùng @Getter, @Setter. Tự viết equals/hashCode dựa trên Business Key duy nhất (orderCode)!"]
    end

    style LombokBug fill:#7c2d12,stroke:#f97316,color:#fff
    style SolutionFix fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 3-2-1: N+1 Query Problem Mechanism
const diag_3_2_1 = `
### Sơ Đồ Tuần Tự: Bản Chất Thảm Họa N+1 Query Khi Lấy Danh Sách Đơn Hàng

\`\`\`mermaid
sequenceDiagram
    autonumber
    participant App as Spring Boot Application
    participant DB as PostgreSQL Database

    App->>DB: 1. SELECT * FROM orders LIMIT 10 (Truy vấn gốc 1)
    DB-->>App: Trả về 10 đơn hàng (IDs: 1, 2, 3... 10)
    Note over App,DB: Hibernate phát hiện fetch = LAZY và duyệt qua từng order.getItems():
    App->>DB: 2. SELECT * FROM order_items WHERE order_id = 1 (Query phụ 1)
    App->>DB: 3. SELECT * FROM order_items WHERE order_id = 2 (Query phụ 2)
    App->>DB: 4. SELECT * FROM order_items WHERE order_id = 3 (Query phụ 3)
    Note over App,DB: ... Bắn liên tiếp thêm 10 câu SQL riêng biệt!
    App->>DB: 11. SELECT * FROM order_items WHERE order_id = 10 (Query phụ 10)
    Note over App: Tổng cộng: 1 + 10 = 11 Queries! Nếu có 1,000 đơn hàng -> BẮN 1,001 QUERIES SẬP DATABASE!
\`\`\`
`;

// Diagram 3-2-2: JOIN FETCH Single Query Solution
const diag_3_2_2 = `
### Sơ Đồ Tối Ưu: Giải Pháp JOIN FETCH & @EntityGraph Thu Gọn Về 1 Truy Vấn Duy Nhất

\`\`\`mermaid
flowchart TD
    subgraph Unoptimized ["Trước Khi Tối Ưu (N+1 Query)"]
        Q1["1 Query lấy Orders"] --> QN["100 Queries con lấy Items (100 Roundtrips mạng = 2,500ms)"]
    end

    subgraph OptimizedJoinFetch ["Sau Khi Áp Dụng JOIN FETCH (@EntityGraph)"]
        SingleQuery["SELECT o FROM Order o LEFT JOIN FETCH o.items WHERE o.status = 'COMPLETED'"]
        SingleQuery --> OneRoundtrip["CHỈ 1 ROUNDTRIP MẠNG DUY NHẤT!<br/>Thời gian thực thi: 12ms (Tăng tốc 200 lần!)"]
    end

    style Unoptimized fill:#7c2d12,stroke:#f97316,color:#fff
    style OptimizedJoinFetch fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 3-2-3: MultipleBagFetchException Cartesian Product
const diag_3_2_3 = `
### Sơ Đồ Cảnh Báo: Lỗi MultipleBagFetchException Do Nhân Tích Descartes (Cartesian Product)

\`\`\`mermaid
flowchart TD
    subgraph CartesianTrap ["CẠM BẪY: JOIN FETCH 2 List Cùng Lúc"]
        Query["SELECT o FROM Order o JOIN FETCH o.items JOIN FETCH o.payments"]
        Query --> Cartesian["Nhân tích Descartes: 10 items * 5 payments = 50 rows trùng lặp cho 1 order!"]
        Cartesian --> HibernateError["Hibernate ném ngoại lệ: org.hibernate.loader.MultipleBagFetchException: cannot simultaneously fetch multiple bags"]
    end

    subgraph SolutionFix ["GIẢI PHÁP SẢN XUẤT"]
        Fix1["1. Đổi List sang java.util.Set"]
        Fix2["2. Hoặc chia làm 2 câu query riêng biệt kết hợp PersistenceContext nạp tự động"]
    end

    style CartesianTrap fill:#7c2d12,stroke:#f97316,color:#fff
    style SolutionFix fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 3-3-2: Optimistic vs Pessimistic Concurrency Control
const diag_3_3_2 = `
### Sơ Đồ Đối Chiếu: Cơ Chế Khóa Bi Quan (Pessimistic) vs Khóa Lạc Quan (Optimistic)

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Alice as Khách A (Mua Sản Phẩm Cuối Cùng)
    participant DB as PostgreSQL (Kho Hàng: iPhone = 1 chiếc)
    actor Bob as Khách B (Cũng Bấm Mua Cùng Giây)

    alt CHIẾN LƯỢC 1: KHÓA BI QUAN (PESSIMISTIC_WRITE - SELECT FOR UPDATE)
        Alice->>DB: SELECT * FROM inventory WHERE id = 1 FOR UPDATE
        Note over DB: Database KHÓA CỨNG hàng này!
        Bob->>DB: SELECT * FROM inventory WHERE id = 1 FOR UPDATE
        Note over Bob,DB: Bob bị BLOCK, phải chờ Alice xong giao dịch!
        Alice->>DB: UPDATE inventory SET stock = 0; COMMIT;
        Note over DB: Mở khóa
        Bob->>DB: Đọc được stock = 0 -> Báo hết hàng an toàn!
    else CHIẾN LƯỢC 2: KHÓA LẠC QUAN (OPTIMISTIC @Version)
        Alice->>DB: Đọc stock = 1, version = 1
        Bob->>DB: Đọc stock = 1, version = 1 (Không ai bị block)
        Alice->>DB: UPDATE SET stock = 0, version = 2 WHERE id = 1 AND version = 1
        DB-->>Alice: 1 row affected (Alice thành công)
        Bob->>DB: UPDATE SET stock = 0, version = 2 WHERE id = 1 AND version = 1
        DB-->>Bob: 0 row affected!
        Note over Bob: Hibernate ném OptimisticLockException -> Bắt exception và báo lỗi thân thiện!
    end
\`\`\`
`;

// Diagram 3-3-3: Database Deadlock Cycle
const diag_3_3_3 = `
### Sơ Đồ Cảnh Báo: Chu Trình Khóa Chéo Gây Deadlock Database Giữa 2 Giao Dịch

\`\`\`mermaid
flowchart TD
    subgraph DeadlockCycle ["CHU TRÌNH CHẾT: 2 Giao Dịch Chờ Nhau Vô Tận"]
        Tx1["Transaction 1 (Trừ Kho Rồi Cập Nhật Ví)"]
        Tx2["Transaction 2 (Nạp Tiền Ví Rồi Giữ Chỗ Kho)"]
        RowA["Khóa Hàng A (Bảng Inventory)"]
        RowB["Khóa Hàng B (Bảng Wallet)"]

        Tx1 -->|Đang giữ| RowA
        Tx1 -->|Đang chờ lấy| RowB
        Tx2 -->|Đang giữ| RowB
        Tx2 -->|Đang chờ lấy| RowA
    end

    DeadlockCycle --> DBEngine["PostgreSQL Deadlock Detector (sau 1000ms): Phát hiện chu trình kín!"]
    DBEngine --> KillTx["Tự động KILL Transaction 2 (PSQLException: deadlock detected) và rollback!"]

    style DeadlockCycle fill:#7c2d12,stroke:#f97316,color:#fff
    style KillTx fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 3-4-1: Flyway Zero-Downtime Migration Architecture
const diag_3_4_1 = `
### Sơ Đồ Vòng Đời: Quản Trị Di Trú Schema Cơ Sở Dữ Liệu Với Flyway Versioning

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Boot as Spring Boot Startup Engine
    participant Flyway as Flyway Migration Engine
    participant MetaTable as flyway_schema_history (Bảng Siêu Dữ Liệu)
    participant DB as PostgreSQL Schema

    Boot->>Flyway: Kích hoạt migrate() trước khi Hibernate JPA khởi tạo
    Flyway->>MetaTable: Đọc danh sách các script đã chạy
    MetaTable-->>Flyway: Đã chạy V1__init.sql (Checksum: a8b9c...)
    Flyway->>Flyway: Quét thư mục classpath:db/migration
    Note over Flyway: Phát hiện V2__add_payment_status.sql CHƯA CHẠY!
    Flyway->>DB: Thực thi: ALTER TABLE payments ADD COLUMN status VARCHAR(32);
    DB-->>Flyway: Thành công
    Flyway->>MetaTable: Ghi bản ghi V2 (Version, Description, Checksum, InstalledOn, Success=true)
    Flyway-->>Boot: Database Schema Đồng Bộ Hoàn Hảo -> Bàn giao cho Hibernate!
\`\`\`
`;

// Diagram 3-4-2: JDBC Batching Performance Comparison
const diag_3_4_2 = `
### Sơ Đồ Đo Lường: Đơn Lẻ (Single Insert) vs JDBC Batching Khi Chèn 10,000 Bản Ghi

\`\`\`mermaid
flowchart LR
    subgraph SingleInsert ["1. Không Batch (Mặc Định): 10,000 Network Roundtrips"]
        A1["Insert 1"] --> DB1["Database"]
        A2["Insert 2"] --> DB1
        AN["Insert 10000"] --> DB1
        DB1 --> Slow["Tổng thời gian: 14,200 ms (14 giây!)"]
    end

    subgraph BatchInsert ["2. Bật spring.jpa.properties.hibernate.jdbc.batch_size=50"]
        BGroup["Gom 50 lệnh SQL vào 1 Network Packet duy nhất"] --> DB2["Database"]
        DB2 --> Fast["Tổng thời gian: 420 ms (Tăng tốc 35 lần!)"]
    end

    style SingleInsert fill:#7c2d12,stroke:#f97316,color:#fff
    style BatchInsert fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 3-4-3: GenerationType.IDENTITY Disables Batching
const diag_3_4_3 = `
### Sơ Đồ Cảnh Báo: GenerationType.IDENTITY Phá Hủy Tính Năng Batching Của Hibernate

\`\`\`mermaid
flowchart TD
    subgraph IdentityTrap ["CẠM BẪY: GenerationType.IDENTITY Ép Thực Thi Ngay Lập Tức"]
        Call["save(new Order())"] --> Hibernate["Hibernate cần biết ID để đưa vào Persistence Context"]
        Hibernate --> IdentitySQL["Vì dùng IDENTITY (auto-increment), DB mới là nơi sinh ID!"]
        IdentitySQL --> ForceExec["Hibernate BẮT BUỘC phải INSERT ngay lập tức để lấy ID (Return Generated Keys)"]
        ForceExec --> DisabledBatch["HẬU QUẢ: HIBERNATE TẮT TOÀN BỘ BATCHING ÂM THẦM! Tốc độ rớt thảm hại!"]
    end

    subgraph SequenceFix ["GIẢI PHÁP: Sử Dụng GenerationType.SEQUENCE Với AllocationSize"]
        SeqCall["GenerationType.SEQUENCE (allocationSize = 50)"] --> PreAlloc["Hibernate lấy sẵn 50 IDs từ Sequence bằng 1 câu SELECT"]
        PreAlloc --> EnableBatch["Thoải mái gom 50 entities vào JDBC Batch Insert cực nhanh!"]
    end

    style IdentityTrap fill:#7c2d12,stroke:#f97316,color:#fff
    style SequenceFix fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

const injections = {
  '3-1-2': diag_3_1_2,
  '3-1-3': diag_3_1_3,
  '3-2-1': diag_3_2_1,
  '3-2-2': diag_3_2_2,
  '3-2-3': diag_3_2_3,
  '3-3-2': diag_3_3_2,
  '3-3-3': diag_3_3_3,
  '3-4-1': diag_3_4_1,
  '3-4-2': diag_3_4_2,
  '3-4-3': diag_3_4_3,
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
const outputCode = `/* MODULE 3 — Data Access & JPA (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(${JSON.stringify(mod, null, 2)});\n`;

fs.writeFileSync(modPath, outputCode, 'utf8');
console.log(`\nHoàn thành bổ sung sơ đồ Mermaid cho Module 3! Số bài cập nhật: ${updatedCount}/10`);
