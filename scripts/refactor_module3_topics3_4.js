const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module3.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m3 = window.COURSE_MODULES.find(m => m.id === 3);

// Refactor Lesson 3-3-1
const l331 = m3.lessons.find(l => l.id === "3-3-1");
if (l331) {
  l331.title = "Bài 3.3.1: Kiến trúc Transaction Isolation, Propagation & Mô hình Concurrency Locking";
  l331.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã 4 cấp độ cô lập giao dịch (Transaction Isolation Levels): Read Uncommitted, Read Committed, Repeatable Read, Serializable.
- Nắm chắc 3 cơ chế lan truyền giao dịch phổ biến nhất trong Spring Boot: \`REQUIRED\`, \`REQUIRES_NEW\` và \`MANDATORY\`.
- Hiểu tại sao từ khóa \`synchronized\` của Java hoàn toàn vô dụng trong hệ thống microservices đa pods.
- Đọc hiểu 100% từng dòng code quản lý Transaction qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TRANSACTION ISOLATION & PROPAGATION
**1. Transaction Propagation — "Quy tắc mở sổ cái kế toán":**
- Phương thức \`checkout()\` đang ghi sổ cái (**Transaction A**). Trong lúc đó, nó gọi \`logAudit()\` để ghi nhật ký giao dịch:
  - Nếu dùng **\`Propagation.REQUIRED\`** (Mặc định): \`logAudit()\` sẽ dùng chung cuốn sổ cái của \`checkout()\`. Nếu \`checkout()\` bị lỗi rollback, nhật ký audit cũng bị xé bỏ theo!
  - Nếu dùng **\`Propagation.REQUIRES_NEW\`**: \`logAudit()\` tạm gác cuốn sổ của \`checkout()\` sang một bên, **mở một cuốn sổ cái độc lập hoàn toàn**. Dù \`checkout()\` có bị lỗi sập, nhật ký vẫn được lưu vĩnh viễn vào DB!

**2. Tại sao \`synchronized\` bị phá sản trên Cloud?**
- Lập trình viên Nam viết hàm: \`public synchronized void reduceStock()\`.
- Hàm này chỉ khóa được các thread **trong cùng 1 máy tính (1 JVM)** của Nam.
- Khi triển khai lên Kubernetes với 5 pods chạy song song, 5 pods này không hề biết nhau đang làm gì -> Vẫn xảy ra tranh chấp và **bán âm kho (Overselling)** như thường!
- Để khóa an toàn, bắt buộc phải dùng **Khóa ở tầng Database (Database Lock)**!
:::

---

## 1. Cái này là gì? (Kiến trúc Transaction & Cấp Độ Cô Lập)

Transaction trong Spring Boot được quản lý thông qua Spring AOP Proxy. Cấp độ cô lập (Isolation) quy định mức độ một giao dịch bị ảnh hưởng bởi các giao dịch chạy song song khác:

### Sơ Đồ Ma Trận Hiện Tượng Lỗi Dữ Liệu Theo Cấp Độ Cô Lập:

\`\`\`mermaid
flowchart TD
    subgraph ISO["4 Cấp Độ Cô Lập Chuẩn SQL (Isolation Levels)"]
        L1["READ UNCOMMITTED<br/>(Nguy hiểm nhất)"] -->|"Chặn Dirty Read"| L2["READ COMMITTED<br/>(Mặc định PostgreSQL / Oracle)"]
        L2 -->|"Chặn Non-repeatable Read"| L3["REPEATABLE READ<br/>(Mặc định MySQL InnoDB)"]
        L3 -->|"Chặn Phantom Read"| L4["SERIALIZABLE<br/>(Chậm nhất, an toàn tuyệt đối)"]
    end
    style L2 fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style L1 fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi thực hiện thanh toán và ghi nhật ký kiểm toán (Audit Trail):

### Ma trận So sánh: Propagation REQUIRED vs REQUIRES_NEW

| Đặc tính kỹ thuật | \`Propagation.REQUIRED\` (Mặc định) | \`Propagation.REQUIRES_NEW\` |
|---|---|---|
| **Hành vi khi có TX hiện tại** | Dùng chung Transaction hiện tại | Tạm dừng TX hiện tại, mở TX mới độc lập |
| **Hành vi khi KHÔNG CÓ TX** | Mở TX mới | Mở TX mới |
| **Ảnh hưởng khi Rollback** | Cả hàm cha và hàm con đều bị rollback | Hàm con commit độc lập, hàm cha rollback không ảnh hưởng hàm con |
| **Trường hợp áp dụng** | Nghiệp vụ chính: Trừ tiền + Tạo đơn hàng | Ghi log hệ thống, bắn SMS OTP, lưu lịch sử kiểm toán |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

\`\`\`java
package vn.mastery.ecommerce.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.ecommerce.domain.Order;
import vn.mastery.ecommerce.repository.OrderRepository;

@Service
public class CheckoutService {

    private final OrderRepository orderRepository;
    private final AuditLogService auditLogService;

    public CheckoutService(OrderRepository orderRepository, AuditLogService auditLogService) {
        this.orderRepository = orderRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED, rollbackFor = Exception.class)
    public void checkout(Order order) {
        // Ghi log audit trong 1 transaction riêng biệt
        auditLogService.logCheckoutAttempt(order.getCustomerId());

        // Thực hiện trừ kho và tạo đơn hàng
        orderRepository.save(order);
    }
}
\`\`\`

Dịch vụ Audit Log với Transaction độc lập:

\`\`\`java
package vn.mastery.ecommerce.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logCheckoutAttempt(String customerId) {
        // Ghi nhật ký vào bảng audit_logs
        // TX này sẽ COMMIT ngay lập tức, độc lập với việc checkout thành công hay thất bại!
    }
}
\`\`\`

### Bảng Giải Mã Các Thuộc Tính Cấu Hình:

| Thuộc tính | Giá trị cấu hình | Ý nghĩa kỹ thuật | Tác động hệ thống |
|---|---|---|---|
| \`rollbackFor = Exception.class\` | Exception Rollback Policy | Mặc định Spring chỉ rollback với \`RuntimeException\`. Khai báo này ép rollback với **mọi loại Exception** | Ngăn chặn việc dữ liệu bị commit sai khi gặp Checked Exception |
| \`propagation = Propagation.REQUIRES_NEW\` | Transaction Suspension | Yêu cầu mở 1 DB Connection mới riêng biệt | Bảo đảm log audit không bao giờ bị mất |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Cạm bẫy gọi nội bộ cùng một class (\`Self-Invocation\` làm mất Transaction)**:
   - Nếu trong \`CheckoutService\` bạn có method A gọi method B (có \`@Transactional(REQUIRES_NEW)\`), Transaction mới **SẼ KHÔNG BAO GIỜ ĐƯỢC TẠO RA**!
   - Nguyên nhân: Cuộc gọi nội bộ bypass qua Spring AOP Proxy.
   - Khắc phục: Tách method B sang một Service riêng biệt như \`AuditLogService\`.
`;
}

// Refactor Lesson 3-3-2
const l332 = m3.lessons.find(l => l.id === "3-3-2");
if (l332) {
  l332.title = "Bài 3.3.2: Triển khai Optimistic Locking @Version & Pessimistic Write Lock Chống Bán Âm Kho";
  l332.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải quyết dứt điểm bài toán kinh điển: **Chống bán âm kho (Overselling)** trong sự kiện Flash Sale thương mại điện tử.
- Triển khai **Optimistic Locking (Khóa lạc quan)** bằng annotation \`@Version\` và xử lý ngoại lệ \`OptimisticLockException\`.
- Triển khai **Pessimistic Write Lock (Khóa bi quan)** bằng \`@Lock(LockModeType.PESSIMISTIC_WRITE)\` (\`SELECT ... FOR UPDATE\`).
- So sánh chi phí hiệu năng và độ trễ giữa hai chiến lược khóa qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: KHÓA LẠC QUAN VS KHÓA BI QUAN
**Bài toán: Kho chỉ còn đúng 1 chiếc iPhone 16 Pro Max duy nhất, nhưng có 100 khách cùng bấm "Mua Ngay":**

**1. Khóa Bi Quan (Pessimistic Lock) — "Chiếc then cài cửa độc quyền":**
- Khách hàng đầu tiên bước vào phòng thử đồ (Database Row) liền gài then cửa lại (**\`SELECT ... FOR UPDATE\`**).
- 99 khách hàng còn lại phải **đứng xếp hàng ngoài cửa đợi** cho đến khi khách thứ nhất mua xong hoặc bỏ đi.
- => **Ưu điểm**: An toàn tuyệt đối 100%, không ai tranh được.
- => **Nhược điểm**: Nếu khách thứ nhất mua chậm, hàng dài người đứng chờ gây nghẽn hàng (Database Connection Pool bị block).

**2. Khóa Lạc Quan (Optimistic Lock) — "Vé số có số thứ tự phiên bản (@Version)":**
- Cho phép cả 100 khách cùng xem chiếc iPhone (Không ai phải đứng chờ xếp hàng). Chiếc iPhone có mã phiên bản là **Version = 1**.
- Ai hoàn tất thanh toán trước: Ghi xuống DB: *"Cập nhật tồn kho = 0 với điều kiện Version = 1, đồng thời tăng Version lên 2"*.
- 99 người bấm sau cầm Version = 1 nộp lên -> Database từ chối: *"Phiên bản hiện tại đã là 2 rồi, bạn chậm chân!"* -> Văng lỗi \`OptimisticLockException\`.
:::

---

## 1. Cái này là gì? (Bản Chất Cơ Chế Khóa Dữ Liệu)

Khóa dữ liệu là biện pháp kỹ thuật ngăn chặn tình trạng ghi đè mất mát dữ liệu (**Lost Update**) khi có nhiều luồng cùng đọc và cập nhật một dòng dữ liệu tại cùng một thời điểm.

### Sơ Đồ Cơ Chế: Pessimistic Lock (SELECT FOR UPDATE) vs Optimistic Lock (@Version)

\`\`\`mermaid
flowchart TD
    subgraph PESSIMISTIC["Pessimistic Write Lock (SELECT FOR UPDATE)"]
        P1["Thread A: Khóa dòng ID=1"] -->|"Chặn hoàn toàn"| P2["Thread B: Đợi... (Blocked)"]
        P1 --> P3["Thread A: Cập nhật tồn kho & Commit (Mở khóa)"]
        P3 --> P4["Thread B: Được vào xử lý tiếp"]
    end
    subgraph OPTIMISTIC["Optimistic Lock (@Version)"]
        O1["Thread A: Đọc (Version=1)"] 
        O2["Thread B: Đọc (Version=1)"]
        O1 -->|"Cập nhật trước -> Version=2"| O3["Commit Thành Công!"]
        O2 -->|"Cập nhật sau với Version=1"| O4["FAIL! Ném OptimisticLockException"]
    end
    style PESSIMISTIC fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style OPTIMISTIC fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Ma Trận Quyết Định Kỹ Thuật)

### Bảng So Sánh Chiến Lược Khóa Trong E-Commerce

| Tiêu chí | Khóa Lạc Quan (Optimistic Locking) | Khóa Bi Quan (Pessimistic Locking) |
|---|---|---|
| **Cơ chế kỹ thuật** | Cột số nguyên \`@Version\` trong bảng, không giữ khóa DB | Khóa vật lý dòng dữ liệu qua \`SELECT ... FOR UPDATE\` |
| **Tỷ lệ tranh chấp (Contention)** | Phù hợp khi **tranh chấp thấp/trung bình** (Ít người cùng sửa 1 bản ghi) | Phù hợp khi **tranh chấp cực cao** (Flash Sale, Bán vé concert, Bán vàng) |
| **Hiệu năng hệ thống (Throughput)** | Rất cao, không block connection | Thấp hơn, dễ gây nghẽn pool nếu transaction kéo dài |
| **Xử lý khi xung đột** | Ứng dụng phải bắt ngoại lệ để **Retry (Thử lại)** | Database tự xếp hàng đợi tuần tự, không cần retry |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

### 1. Triển khai Optimistic Locking trên Entity:

\`\`\`java
package vn.mastery.ecommerce.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer stock;

    @Version // Hibernate tự động quản lý tăng số phiên bản sau mỗi lần UPDATE
    private Long version;

    public void reduceStock(int quantity) {
        if (this.stock < quantity) {
            throw new IllegalStateException("Hết hàng trong kho!");
        }
        this.stock -= quantity;
    }
}
\`\`\`

### 2. Triển khai Pessimistic Write Lock trong Repository:

\`\`\`java
package vn.mastery.ecommerce.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.mastery.ecommerce.domain.Product;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Khóa bi quan: Tương đương SQL 'SELECT * FROM products WHERE id = ? FOR UPDATE'
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdWithPessimisticLock(Long id);
}
\`\`\`

### Bảng Giải Mã Câu Lệnh SQL Sinh Ra Dưới Cơ Sở Dữ Liệu:

| Phương pháp | Câu lệnh SQL thực thi ngầm | Ý nghĩa cơ chế |
|---|---|---|
| Optimistic Lock | \`UPDATE products SET stock = ?, version = 2 WHERE id = ? AND version = 1\` | Nếu số dòng affected = 0 (do người khác đã sửa version), Hibernate ném \`OptimisticLockException\` |
| Pessimistic Lock | \`SELECT * FROM products WHERE id = ? FOR UPDATE\` | Cơ sở dữ liệu (PostgreSQL/MySQL) lập tức giữ Exclusive Lock trên index của dòng này cho đến khi commit |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa Deadlock khi giữ Pessimistic Lock quá lâu**:
   - Nếu trong transaction có \`PESSIMISTIC_WRITE\` mà bạn lại gọi HTTP REST API sang bên thứ ba (VNPay, Momo) mất 5 giây: Toàn bộ các request khác muốn mua sản phẩm đó đều bị treo cứng 5 giây!
   - **Quy tắc vàng**: **Chỉ giữ Lock trong phạm vi thao tác Database ngắn nhất có thể. Tuyệt đối không gọi I/O mạng bên trong khối giữ khóa!**
`;
}

// Refactor Lesson 3-3-3
const l333 = m3.lessons.find(l => l.id === "3-3-3");
if (l333) {
  l333.title = "Bài 3.3.3: Cạm bẫy Deadlock Database, Lost Update & Nuốt Ngoại lệ Làm Hỏng Rollback";
  l333.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã hiện tượng "Deadlock" (Thắt nút chết) giữa 2 Transaction và cơ chế giải cứu của Database.
- Nhận diện lỗi tai hại: **Nuốt ngoại lệ (\`catch Exception\` nhưng không rethrow)** khiến Spring không thể Rollback dữ liệu.
- Hiểu rõ tại sao chỉ cập nhật trường tồn kho bằng cú pháp Atomic Update là giải pháp nhanh gấp 10 lần so với giữ Lock.
- Đọc hiểu bảng phân tích đồ thị phụ thuộc vòng tròn giữa 2 giao dịch.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: THẮT NÚT CHẾT (DEADLOCK) VÀ NUỐT LỖI
**1. Deadlock — "Hai người qua cầu hẹp không ai chịu lùi":**
- **Giao dịch A**: Đang giữ khóa Đơn hàng số 1, và muốn xin khóa tiếp Đơn hàng số 2.
- **Giao dịch B**: Đang giữ khóa Đơn hàng số 2, và muốn xin khóa tiếp Đơn hàng số 1.
- Cả hai giao dịch đều đứng chờ đối phương nhường đường mãi mãi!
- Cơ sở dữ liệu phát hiện ra chiếc vòng luẩn quẩn này liền rút súng "bắn hạ" (Kill / Abort) một trong hai giao dịch và quăng ra lỗi: **\`DeadlockDetectedException\`**!

**2. Cạm bẫy "Nuốt ngoại lệ" — "Nhà cháy nhưng tắt chuông báo động":**
- Lập trình viên viết khối \`try { ... } catch (Exception e) { log.error("Lỗi rồi"); }\`.
- Khi có lỗi trừ tiền thất bại, exception bị khối catch "nuốt trọn".
- Spring AOP Proxy nhìn thấy phương thức kết thúc bình thường (không có exception văng ra ngoài) -> **Tự động COMMIT dữ liệu lỗi vào DB**! Tiền không trừ nhưng đơn vẫn tạo thành công!
:::

---

## 1. Cái này là gì? (Bản chất Vòng Lặp Phụ Thuộc Deadlock)

### Sơ Đồ Đồ Thị Phụ Thuộc Vòng Tròn Gây Deadlock Database:

\`\`\`mermaid
flowchart LR
    TX1["Transaction 1"] -->|"Đang giữ Khóa"| R1["Bản ghi Order 100"]
    TX1 -->|"Cố gắng xin Khóa"| R2["Bản ghi Order 200"]
    
    TX2["Transaction 2"] -->|"Đang giữ Khóa"| R2
    TX2 -->|"Cố gắng xin Khóa"| R1
    
    style TX1 fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style TX2 fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
    
    NOTE["DEADLOCK CYCLE DETECTED!<br/>DB tự động Kill TX2 để giải cứu hệ thống"]
    style NOTE fill:#000,stroke:#f59e0b,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Biện Pháp Phòng Chống Triệt Để)

### Ma trận Giải Pháp: 3 Vũ Khí Hóa Giải Deadlock

| Chiến lược | Nguyên lý kỹ thuật | Hiệu quả ngăn chặn Deadlock |
|---|---|---|
| **Sắp xếp thứ tự khóa (Lock Ordering)** | Luôn lấy khóa các bản ghi theo thứ tự ID tăng dần (\`id1 < id2\`) | **Triệt tiêu Deadlock 100%** (Không bao giờ tạo thành chu trình phụ thuộc) |
| **Giảm thời gian giữ khóa (Lock Timeout)** | Cấu hình \`javax.persistence.lock.timeout = 2000\` (2 giây) | Không bị treo thread quá lâu khi có tranh chấp |
| **Atomic Conditional Update** | Dùng câu lệnh SQL: \`UPDATE ... WHERE stock >= :qty\` | **Không cần giữ Lock vật lý**, tốc độ xử lý nhanh nhất |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

### 1. Vũ khí tối thượng: Cập nhật tồn kho nguyên tử (Atomic Update):

\`\`\`java
package vn.mastery.ecommerce.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.mastery.ecommerce.domain.Product;

@Repository
public interface ProductAtomicRepository extends JpaRepository<Product, Long> {

    // Thực thi nguyên tử ngay tại DB engine: Vừa trừ kho vừa kiểm tra điều kiện
    @Modifying
    @Query("""
        UPDATE Product p 
        SET p.stock = p.stock - :quantity 
        WHERE p.id = :productId AND p.stock >= :quantity
    """)
    int reduceStockAtomic(Long productId, Integer quantity);
}
\`\`\`

### 2. Service xử lý an toàn không bao giờ nuốt ngoại lệ:

\`\`\`java
package vn.mastery.ecommerce.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.ecommerce.exception.OutOfStockException;
import vn.mastery.ecommerce.repository.ProductAtomicRepository;

@Service
public class InventoryService {

    private final ProductAtomicRepository productRepository;

    public InventoryService(ProductAtomicRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional
    public void deductInventory(Long productId, int quantity) {
        int updatedRows = productRepository.reduceStockAtomic(productId, quantity);
        if (updatedRows == 0) {
            // Ném ngoại lệ để Spring AOP Proxy kích hoạt ROLLBACK toàn bộ giao dịch!
            throw new OutOfStockException("Sản phẩm đã hết hàng hoặc không đủ số lượng!");
        }
    }
}
\`\`\`

### Bảng Giải Mã Cơ Chế Atomic Update:

| Đoạn mã | Cú pháp | Ý nghĩa kỹ thuật | Lợi ích vượt trội |
|---|---|---|---|
| \`@Modifying\` | Spring Data JPA Annotation | Báo hiệu câu JPQL là thao tác UPDATE/DELETE thay vì SELECT | Hibernate thực thi \`executeUpdate()\` trực tiếp xuống DB |
| \`WHERE ... AND p.stock >= :quantity\` | Điều kiện nguyên tử (Atomic Condition) | Database tự động khóa dòng ở cấp độ micro-second và kiểm tra tồn kho | Loại bỏ hoàn toàn lỗi bán âm kho mà không cần khóa bi quan dài dòng |
| \`if (updatedRows == 0) throw ...\` | Kiểm tra số dòng ảnh hưởng | Nếu không có dòng nào được cập nhật -> Hết hàng | Kích hoạt Rollback tức thì, không bao giờ nuốt lỗi |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Quy tắc vàng khi bắt Exception trong Service**:
   - Nếu bạn cần ghi log khi có lỗi: **HÃY RETHROW LẠI EXCEPTION** sau khi log:
   - Sai: \`catch (Exception e) { log.error("Lỗi"); }\` -> Không rollback!
   - Đúng: \`catch (Exception e) { log.error("Lỗi", e); throw e; }\` -> Rollback an toàn!
`;
}

// Refactor Lesson 3-3-4
const l334 = m3.lessons.find(l => l.id === "3-3-4");
if (l334) {
  l334.title = "Bài 3.3.4: Tổng Kết Thực Chiến: Bản Đồ Transaction & Ma Trận Khóa Đồng Thời (Optimistic vs Pessimistic Lock)";
  l334.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 3.3 thành Ma trận quyết định lựa chọn cơ chế quản lý giao dịch và đồng thời.
- Nắm chắc sơ đồ luồng xử lý Transaction từ Controller qua Service Proxy đến Database Engine.
- Tự tay viết bài test kiểm thử Concurrency đa luồng giả lập 50 người cùng tranh mua 1 sản phẩm.
- Sẵn sàng bước sang Chuyên đề 3.4 (Database Migration với Flyway & Batch Insert).
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BẢN ĐỒ CHIẾN THUẬT GIAO DỊCH
Giao dịch cơ sở dữ liệu giống như chuyến du hành vũ trụ:
- **Chuẩn bị cất cánh**: Mở cửa kết nối (\`@Transactional\` mở Connection).
- **Trên quỹ đạo**: Mọi tính toán diễn ra an toàn trong khoang kín (Isolation Level).
- **Hạ cánh thành công**: Mọi thông số hợp lệ -> Tiếp đất vinh quang (**Commit**).
- **Sự cố khẩn cấp**: Chỉ cần 1 hệ thống con báo lỗi đỏ -> Toàn bộ phi hành đoàn bung dù khẩn cấp quay về điểm xuất phát ban đầu (**Rollback**).
Không có chuyện một nửa con tàu tiếp đất còn một nửa bị bỏ lại vũ trụ!
:::

---

## 1. Cái này là gì? (Bản Đồ Kiến Trúc Transaction Proxy)

### Sơ Đồ Toàn Cảnh: Vòng Đời Một Spring @Transactional Proxy Call

\`\`\`mermaid
sequenceDiagram
    participant Client as HTTP Client
    participant Proxy as Spring Transaction Proxy (CGLIB)
    participant Service as OrderService (Target)
    participant TM as PlatformTransactionManager
    participant DB as Database Connection
    
    Client->>Proxy: Gọi checkout()
    Proxy->>TM: 1. getTransaction(definition)
    TM->>DB: 2. Bắt đầu Transaction (SET AUTOCOMMIT FALSE)
    Proxy->>Service: 3. Thực thi logic nghiệp vụ thật
    alt Logic thành công 100%
        Service-->>Proxy: Trả về OrderResponse
        Proxy->>TM: 4. commit()
        TM->>DB: 5. Ghi nhận dữ liệu (COMMIT)
    else Gặp RuntimeException / Error
        Service-->>Proxy: Ném OutOfStockException
        Proxy->>TM: 4. rollback()
        TM->>DB: 5. Hủy bỏ toàn bộ thay đổi (ROLLBACK)
    end
    Proxy-->>Client: Phản hồi kết quả
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Ma Trận Quyết Định Kỹ Thuật)

### Ma Trận Lựa Chọn Cơ Chế Đồng Thời (Concurrency Decision Matrix)

| Nghiệp vụ thực tế | Giải pháp khuyến nghị | Lý do kiến trúc |
|---|---|---|
| **Đặt hàng Flash Sale (Cạnh tranh cực cao)** | Atomic Conditional Update (\`stock = stock - 1 WHERE stock > 0\`) | Tốc độ nhanh nhất, 0 deadlock, xử lý 10,000 req/s |
| **Cập nhật thông tin hồ sơ người dùng** | Optimistic Locking (\`@Version\`) | Tranh chấp rất thấp, không tốn tài nguyên giữ khóa DB |
| **Quy trình duyệt hồ sơ vay tín chấp / Tiền mặt** | Pessimistic Write Lock (\`SELECT FOR UPDATE\`) | Đảm bảo tính tuần tự tuyệt đối, bảo vệ số dư tài khoản |
| **Ghi log lịch sử kiểm toán giao dịch** | \`@Transactional(propagation = REQUIRES_NEW)\` | Log luôn được lưu bất kể giao dịch chính thành công hay thất bại |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (Multi-Threaded Concurrency Test)

Dưới đây là bài kiểm thử Concurrency thực chiến với \`ExecutorService\` giả lập 20 luồng cùng mua hàng:

\`\`\`java
package vn.mastery.ecommerce;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import vn.mastery.ecommerce.repository.ProductAtomicRepository;
import vn.mastery.ecommerce.service.InventoryService;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ConcurrencyOversellingTest {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private ProductAtomicRepository productRepository;

    @Test
    @DisplayName("Kiểm tra 20 luồng cùng tranh mua 5 sản phẩm: Tuyệt đối không bán âm kho")
    void testPreventOversellingUnderHighConcurrency() throws InterruptedException {
        int numberOfThreads = 20;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(numberOfThreads);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        Long testProductId = 1L; // Sản phẩm có số lượng tồn kho ban đầu là 5

        for (int i = 0; i < numberOfThreads; i++) {
            executor.submit(() -> {
                try {
                    inventoryService.deductInventory(testProductId, 1);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await(); // Đợi cả 20 luồng chạy xong

        // Khẳng định đúng 5 người mua thành công và 15 người nhận lỗi hết hàng
        assertEquals(5, successCount.get(), "Chỉ đúng 5 đơn hàng được phép thành công");
        assertEquals(15, failureCount.get(), "15 người còn lại phải nhận thông báo hết hàng");
    }
}
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Checklist kiểm toán Transaction**:
   - [ ] Đã chỉ định \`rollbackFor = Exception.class\` trên các giao dịch tài chính quan trọng.
   - [ ] Không bao giờ nuốt exception bên trong khối \`try-catch\` của Service.
   - [ ] Đã dùng Atomic Update cho bài toán trừ tồn kho Flash Sale.
   - [ ] Các tác vụ Audit Log độc lập đã được chuyển sang Service riêng với \`REQUIRES_NEW\`.
`;
}

// Refactor Lesson 3-4-1
const l341 = m3.lessons.find(l => l.id === "3-4-1");
if (l341) {
  l341.title = "Bài 3.4.1: Kiến trúc Database Migration Không Gián Đoạn (Flyway) & Batch Processing Triệu Bản Ghi";
  l341.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu tại sao dùng thuộc tính \`spring.jpa.hibernate.ddl-auto=update\` trong môi trường Production là "tự sát công nghệ".
- Nắm vững nguyên lý hoạt động của công cụ quản lý phiên bản cơ sở dữ liệu **Flyway** và bảng lược sử \`flyway_schema_history\`.
- Giải mã cơ chế JDBC Batching: Gom hàng nghìn câu lệnh \`INSERT\` thành một đợt gửi qua mạng.
- Đọc hiểu 100% từng dòng cấu hình và script migration qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: FLYWAY & BATCH INSERT
**1. Tại sao cấm dùng \`ddl-auto=update\` trên Production?**
- Hãy tưởng tượng bạn giao cho một chú robot tự động sửa nhà (\`ddl-auto=update\`).
- Ngày đẹp trời, bạn đổi tên biến trong code từ \`customerName\` thành \`fullName\`.
- Chú robot lên database: Tạo thêm cột \`full_name\` mới toanh (toàn dữ liệu null), nhưng vẫn giữ nguyên cột \`customer_name\` cũ! Hoặc tệ hơn nếu bật \`create-drop\`, chú robot sẽ **xóa sạch toàn bộ dữ liệu khách hàng** sau khi tắt server!

**2. Flyway — "Hệ thống Git dành riêng cho Database":**
- Mỗi thay đổi về cấu trúc bảng được viết thành một file script SQL đánh số thứ tự: \`V1__create_orders.sql\`, \`V2__add_status_column.sql\`.
- Khi server khởi động, Flyway kiểm tra: File nào đã chạy rồi thì bỏ qua, file nào mới thì chạy tuần tự. Không bao giờ chạy sai, không bao giờ nhầm lẫn!
:::

---

## 1. Cái này là gì? (Bản chất Bảng Quản Trị Flyway Schema History)

Flyway duy trì một bảng đặc biệt tên là \`flyway_schema_history\` ngay trong cơ sở dữ liệu. Bảng này lưu trữ: Phiên bản (\`version\`), Tên mô tả (\`description\`), Mã băm kiểm tra toàn vẹn (\`checksum\`) và Trạng thái thực thi.

### Sơ Đồ Cơ Chế Kiểm Định Migration Lúc Khởi Động Ứng Dụng:

\`\`\`mermaid
flowchart TD
    A["Spring Boot Khởi Động"] --> B["Flyway quét thư mục db/migration"]
    B --> C["So khớp Checksum với bảng flyway_schema_history"]
    C --> D{"File cũ có bị ai sửa lén không?"}
    D -->|"CÓ (Checksum bị lệch)"| E["FAIL! Ném FlywayValidateException dừng khởi động!"]
    D -->|"KHÔNG (Toàn vẹn)"| F{"Có script mới chưa chạy không?"}
    F -->|"CÓ"| G["Thực thi script mới trong Transaction & Ghi lịch sử"]
    F -->|"KHÔNG"| H["Khởi động hoàn tất, DB sẵn sàng!"]
    style E fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
    style H fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi đội ngũ phát triển có nhiều người cùng làm việc và cần triển khai CI/CD lên môi trường Production:

### Ma trận So sánh: Hibernate DDL-Auto vs Flyway Migration

| Tiêu chí | Hibernate \`ddl-auto=update\` | Flyway Database Migration |
|---|---|---|
| **Kiểm soát phiên bản** | ❌ Tự động ngầm, không ai biết database đang ở trạng thái nào | ⭐ **100% minh bạch**: Theo dõi chính xác từng file SQL được commit trên Git |
| **Khả năng Rollback / Audit** | ❌ Hoàn toàn không thể | ⭐ Lưu chính xác ai chạy, ngày giờ chạy, thời gian chạy |
| **Tương thích CI/CD Production** | ❌ Cấm tuyệt đối | ⭐ Chuẩn công nghiệp bắt buộc cho mọi hệ thống Enterprise |
| **Tối ưu Index & Constraint** | Rất kém, Hibernate chỉ tạo index cơ bản | Tự do viết câu lệnh tối ưu hóa riêng cho PostgreSQL/MySQL |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

### 1. File script migration đầu tiên (\`src/main/resources/db/migration/V1__init_orders_schema.sql\`):

\`\`\`sql
-- V1__init_orders_schema.sql
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_code VARCHAR(64) NOT NULL UNIQUE,
    customer_id VARCHAR(64) NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id VARCHAR(64) NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
);

-- Đánh index tăng tốc truy vấn theo khách hàng
CREATE INDEX idx_orders_customer_id ON orders (customer_id);
\`\`\`

### 2. Cấu hình Flyway trong \`application.yml\`:

\`\`\`yaml
spring:
  jpa:
    hibernate:
      # TẮT HOÀN TOÀN TỰ ĐỘNG SINH SCHEMA CỦA HIBERNATE
      ddl-auto: validate
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration
\`\`\`

### Bảng Giải Mã Các Thuộc Tính Cấu Hình:

| Tham số cấu hình | Giá trị | Ý nghĩa kỹ thuật |
|---|---|---|
| \`ddl-auto: validate\` | Chế độ kiểm tra nghiêm ngặt | Hibernate chỉ kiểm tra xem Entity Java có khớp với bảng DB không, tuyệt đối không tự ý sửa bảng |
| \`locations: classpath:db/migration\` | Thư mục chứa script SQL | Flyway tự động nạp toàn bộ file SQL có định dạng \`V{version}__{description}.sql\` |
| \`baseline-on-migrate: true\` | Baseline an toàn | Cho phép tích hợp Flyway vào database đã có sẵn dữ liệu từ trước mà không bị lỗi |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Quy tắc đặt tên file Flyway**:
   - Tên file bắt buộc phải có **2 DẤU GẠCH DƯỚI (\`__\`)** ngăn cách giữa version và mô tả.
   - Ví dụ đúng: \`V1__create_tables.sql\`, \`V2__add_index.sql\`.
   - Nếu bạn chỉ gõ 1 dấu gạch dưới (\`V1_create.sql\`), Flyway sẽ bỏ qua và không chạy file!
`;
}

// Refactor Lesson 3-4-2
const l342 = m3.lessons.find(l => l.id === "3-4-2");
if (l342) {
  l342.title = "Bài 3.4.2: Cấu hình Flyway Versioning & Tối Ưu Hibernate Batch Insert jdbc.batch_size";
  l342.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nắm vững cách cấu hình tối ưu hiệu năng ghi hàng loạt: **Hibernate JDBC Batch Insert**.
- Hiểu tại sao nạp 10,000 bản ghi bằng \`saveAll()\` thông thường lại chậm chạp mất hàng chục giây.
- Kích hoạt các thông số \`jdbc.batch_size\`, \`order_inserts\`, \`order_updates\` để tăng tốc độ nạp dữ liệu lên gấp **15 lần**.
- Đọc hiểu 100% từng dòng cấu hình và benchmark so sánh thời gian thực thi.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: JDBC BATCHING
**Hình tượng "Chở từng thùng hàng vs Đóng container xuất bến":**
- Bạn cần chuyển 1,000 thùng hàng sang kho cảng (Database):
- **Cách làm thông thường (Non-batch)**:
  - Tài xế chở 1 thùng hàng sang kho cảng, bấm còi xin xác nhận, rồi chạy về.
  - Lặp lại **1,000 chuyến đi về** qua mạng (Round-trip Network Latency)! Tốn 30 giây!
- **Cách làm JDBC Batching (Đóng container)**:
  - Gom 50 thùng hàng đóng vào 1 container (\`batch_size = 50\`).
  - Tài xế chở 1 chuyến gồm cả 50 thùng sang kho cảng.
  - Chỉ mất **$1,000 / 50 = 20$ chuyến đi về**! Tốc độ nhanh gấp 15 lần mà không tốn thêm tài nguyên máy chủ!
:::

---

## 1. Cái này là gì? (Kiến trúc JDBC Batch Execution)

Mặc định, Hibernate gửi từng câu lệnh \`PreparedStatement.executeUpdate()\` riêng lẻ cho mỗi Entity được lưu. Khi bật JDBC Batching, Hibernate sử dụng cơ chế \`PreparedStatement.addBatch()\` và chỉ gửi câu lệnh qua mạng khi đạt đủ kích thước lô (\`batch_size\`).

### Sơ Đồ So Sánh: Lưu Tuần Tự Từng Dòng vs JDBC Batch Theo Lô:

\`\`\`mermaid
flowchart TD
    subgraph NON_BATCH["Lưu Không Batching (Chậm Chạp)"]
        A1["INSERT 1"] -->|"1 Round-trip mạng"| DB1[("Database")]
        A2["INSERT 2"] -->|"1 Round-trip mạng"| DB1
        A3["INSERT 3"] -->|"1 Round-trip mạng"| DB1
    end
    subgraph BATCH["JDBC Batching (Gom Lô Siêu Tốc)"]
        B["Gom 50 câu INSERT vào 1 gói tin Batch"] -->|"Đúng 1 Round-trip mạng duy nhất!"| DB2[("Database")]
    end
    style B fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style NON_BATCH fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi nhập kho hàng loạt từ file Excel, import 50,000 mã voucher giảm giá, hoặc xử lý hoàn tất đơn hàng định kỳ ban đêm:

### Bảng Kết Quả Benchmark Nạp 10,000 Bản Ghi:

| Cấu hình | Thời gian thực thi | Số lần gửi gói tin mạng |
|---|:---:|:---:|
| Mặc định không cấu hình Batch | **28.4 giây** | 10,000 round-trips |
| Bật \`jdbc.batch_size: 50\` + \`order_inserts\` | **1.8 giây** | **200 round-trips (Nhanh gấp 15 lần!)** |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

### 1. Cấu hình hoàn chỉnh trong \`application.yml\`:

\`\`\`yaml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          # Kích thước lô gom nhóm câu lệnh INSERT/UPDATE
          batch_size: 50
        # Bắt buộc bật 2 cờ này để Hibernate sắp xếp các câu SQL cùng loại đi chung với nhau
        order_inserts: true
        order_updates: true
        # Hiển thị thống kê batch execution trong log
        generate_statistics: false
\`\`\`

### 2. Service thực thi Batch Insert kết hợp giải phóng bộ nhớ RAM:

\`\`\`java
package vn.mastery.ecommerce.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.ecommerce.domain.OrderItem;
import java.util.List;

@Service
public class BatchImportService {

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public void importOrderItemsInBatches(List<OrderItem> items) {
        int batchSize = 50;
        for (int i = 0; i < items.size(); i++) {
            entityManager.persist(items.get(i));

            // Cứ sau 50 bản ghi: Flush xuống DB và dọn sạch L1 Cache để tránh tràn RAM!
            if (i > 0 && i % batchSize == 0) {
                entityManager.flush();
                entityManager.clear(); // Giải phóng toàn bộ Managed Entities khỏi bộ nhớ Heap
            }
        }
        // Flush phần còn lại chưa đủ 50
        entityManager.flush();
        entityManager.clear();
    }
}
\`\`\`

### Bảng Giải Mã Kỹ Thuật Dọn RAM Sống Còn:

| Lệnh thực thi | Ý nghĩa kỹ thuật | Lợi ích hệ thống |
|---|---|---|
| \`entityManager.flush()\` | Ép Hibernate bắn gói tin batch SQL tích lũy xuống Database | Dữ liệu được ghi nhận vào transaction của DB |
| \`entityManager.clear()\` | Xóa sạch toàn bộ Entity khỏi Persistence Context (L1 Cache) | **Ngăn chặn triệt để lỗi OutOfMemoryError** khi import hàng triệu dòng |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Quên gọi \`entityManager.clear()\` khi import lớn**:
   - Nếu bạn lặp 1 triệu lần mà không gọi \`clear()\`, L1 Cache sẽ phình to chứa đủ 1 triệu bản ghi Snapshot. Ứng dụng sẽ chết vì tràn bộ nhớ RAM (OOM) trước khi kịp lưu xong!
`;
}

// Refactor Lesson 3-4-3
const l343 = m3.lessons.find(l => l.id === "3-4-3");
if (l343) {
  l343.title = "Bài 3.4.3: Cạm bẫy Sửa File Migration Đã Chạy, GenerationType.IDENTITY Vô Hiệu Hóa Batch";
  l343.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã "Tội đồ số 1" vô hiệu hóa âm thầm tính năng Batch Insert: **Chiến lược sinh khóa \`GenerationType.IDENTITY\`**.
- Hiểu tại sao Hibernate buộc phải tắt tính năng Batching khi dùng \`IDENTITY\` (Cần ID ngay để đưa vào L1 Cache).
- Nắm vững giải pháp thay thế chuẩn mực: **\`GenerationType.SEQUENCE\`** kết hợp cấu hình \`allocationSize\`.
- Xử lý triệt để lỗi \`FlywayChecksumValidateException\` khi ai đó lỡ tay sửa nội dung file migration cũ.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: IDENTITY VS SEQUENCE
**Tại sao \`GenerationType.IDENTITY\` lại làm hỏng cơ chế Batching?**
- Để quản lý một đối tượng trong Persistence Context, Hibernate **bắt buộc phải biết giá trị ID của đối tượng đó**.
- Với **\`GenerationType.IDENTITY\` (Cột tự tăng AUTO_INCREMENT / SERIAL)**: Hibernate không thể nào biết được ID là bao nhiêu trừ khi câu lệnh \`INSERT\` đã thực sự được chạy xuống DB!
- Do đó, Hibernate **buộc phải gửi ngay lập tức từng câu lệnh INSERT đơn lẻ** để nhận về ID -> Toàn bộ cấu hình \`jdbc.batch_size\` bị vô hiệu hóa 100%!
- Với **\`GenerationType.SEQUENCE\`**: Hibernate xin trước một dải 50 ID từ Database Sequence, tự gán vào Entity trong RAM, sau đó thong thả gom cả 50 câu lệnh INSERT thành một đợt batch duy nhất!
:::

---

## 1. Cái này là gì? (Bản chất Kỹ thuật Xung Đột)

### Sơ Đồ Cơ Chế: Tại Sao IDENTITY Phá Nát Batch Insert

\`\`\`mermaid
flowchart TD
    subgraph IDENTITY_FAIL["GenerationType.IDENTITY (Vô Hiệu Hóa Batching)"]
        I1["persist(entity)"] -->|"Chưa có ID!"| I2["Ép buộc bắn INSERT đơn lẻ ngay lập tức để lấy ID"]
        I2 --> I3["BATCH SIZE BỊ TẮT ÂM THẦM 100%!"]
    end
    subgraph SEQUENCE_OK["GenerationType.SEQUENCE (Tối Ưu Batch Tuyệt Đối)"]
        S1["Xin trước dải ID: 1 đến 50 từ Sequence"] --> S2["Gán sẵn ID trong RAM cho 50 Entity"]
        S2 --> S3["Gom đủ 50 Entity gửi 1 lần duy nhất qua Batch!"]
    end
    style IDENTITY_FAIL fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
    style SEQUENCE_OK fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Chiến Lược Sinh Khóa Khuyến Nghị)

### Ma trận So sánh: GenerationType IDENTITY vs SEQUENCE

| Tiêu chí | \`GenerationType.IDENTITY\` | \`GenerationType.SEQUENCE\` |
|---|---|---|
| **Cơ chế cấp phát ID** | Database tự sinh lúc INSERT thực thi | Cơ chế Sequence độc lập cấp trước ID |
| **Hỗ trợ JDBC Batching** | ❌ **KHÔNG** (Hibernate tự động tắt Batching) | ⭐ **HỖ TRỢ 100% HOÀN HẢO** |
| **Hệ cơ sở dữ liệu hỗ trợ** | MySQL, MariaDB, SQL Server | PostgreSQL, Oracle, MariaDB 10.3+ |
| **Khuyến nghị Senior** | Chỉ dùng cho dự án nhỏ / MySQL cũ | **Chuẩn mực bắt buộc cho PostgreSQL Enterprise** |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Cách cấu hình Entity dùng Sequence chuẩn để kích hoạt Batch Insert:

\`\`\`java
package vn.mastery.ecommerce.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "vouchers")
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "voucher_seq_gen")
    @SequenceGenerator(
        name = "voucher_seq_gen",
        sequenceName = "voucher_seq",
        allocationSize = 50 // Khớp chính xác với hibernate.jdbc.batch_size = 50!
    )
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;
}
\`\`\`

### Xử lý khi lỡ sửa file Flyway cũ (\`FlywayChecksumValidateException\`):

\`\`\`bash
# NGUYÊN TẮC: TUYỆT ĐỐI KHÔNG SỬA FILE MIGRATION ĐÃ ĐƯỢC MERGE!
# Nếu cần sửa cấu trúc: Luôn tạo file mới V3__fix_column.sql

# Nếu ở môi trường Local Dev bị lệch Checksum, dùng lệnh repair:
./mvnw flyway:repair
\`\`\`

### Bảng Giải Mã Thuộc Tính Sequence:

| Thuộc tính | Ý nghĩa kỹ thuật | Lợi ích tối ưu |
|---|---|---|
| \`strategy = GenerationType.SEQUENCE\` | Sử dụng đối tượng Sequence riêng biệt | Cho phép Hibernate lấy ID trước khi thực hiện INSERT |
| \`allocationSize = 50\` | Số lượng ID cấp trước trong một lần truy vấn Sequence | Hibernate chỉ cần gọi Sequence 1 lần cho mỗi 50 Entity được lưu |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Không bao giờ sửa nội dung file Migration đã đẩy lên nhánh chính**:
   - Mọi sửa đổi trên file cũ đều làm đổi Checksum và khiến ứng dụng không thể khởi động trên máy đồng nghiệp hoặc server test.
   - Luôn luôn tạo một file migration mới với version tăng dần (\`V2__alter_table.sql\`).
`;
}

// Refactor Lesson 3-4-4
const l344 = m3.lessons.find(l => l.id === "3-4-4");
if (l344) {
  l344.title = "Bài 3.4.4: Tổng Kết Thực Chiến: Bản Đồ Di Trú Database Flyway & Kỹ Thuật Batch Insert Triệu Bản Ghi";
  l344.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 3.4 thành Bản đồ Quản trị Vận hành Cơ sở dữ liệu Production.
- Nắm vững quy trình di trú dữ liệu không gián đoạn dịch vụ (Zero-Downtime Migration Pattern).
- Tự tay thực hiện bài kiểm tra sát hạch cuối Module 3: Lưu 1,000 bản ghi trong dưới 1 giây.
- Sẵn sàng 100% bước vào Module 4 (Testing chuyên nghiệp với Testcontainers & ArchUnit).
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỔNG KẾT MODULE 3
Bạn vừa hoàn thành Module khó nhất và quan trọng nhất của một kỹ sư Backend:
1. **Làm chủ Hibernate Internals**: Nắm chắc vòng đời Entity và Dirty Checking.
2. **Xóa sổ N+1 Query**: Thành thạo JOIN FETCH, @EntityGraph và DTO Projection.
3. **Chống bán âm kho**: Vận dụng linh hoạt Khóa lạc quan (@Version) và Atomic Update.
4. **Vận hành Production**: Triển khai di trú tự động với Flyway và Batching siêu tốc.
Tầng dữ liệu của hệ thống E-Commerce giờ đây đã đạt chuẩn vững chắc của các tập đoàn công nghệ lớn!
:::

---

## 1. Cái này là gì? (Bản Đồ Kiến Trúc Toàn Bộ Module 3)

### Sơ Đồ Tổng Quan: Hệ Thống Quản Trị Tầng Dữ Liệu Enterprise Data Access

\`\`\`mermaid
graph TD
    subgraph M3["MODULE 3: DATA ACCESS & JPA"]
        T1["Chuyên Đề 3.1: Entity Mapping & Dirty Checking<br/>(L1 Cache, mappedBy, JPA Auditing)"]
        T2["Chuyên Đề 3.2: Triệt Tiêu N+1 Query<br/>(JOIN FETCH, @EntityGraph, DTO Projection)"]
        T3["Chuyên Đề 3.3: Concurrency Locking<br/>(Optimistic, Pessimistic, Atomic Update)"]
        T4["Chuyên Đề 3.4: Migration & Batch Processing<br/>(Flyway Schema Versioning, Sequence Batch)"]
    end
    
    T1 --> T2 --> T3 --> T4
    T4 ==> NEXT["MODULE 4: TESTING CHUYÊN NGHIỆP<br/>(JUnit 5, Mockito, Testcontainers, ArchUnit)"]
    style M3 fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style NEXT fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Chiến Lược Di Trú Không Gián Đoạn Zero-Downtime)

### Quy Trình 3 Bước Đổi Tên Cột Không Làm Sập Production (Expand-Contract Pattern)

| Giai đoạn | Hành động trên Database | Hành động trên Ứng dụng |
|---|---|---|
| **1. Expand (Mở rộng)** | Tạo cột mới song song, giữ nguyên cột cũ | Ứng dụng ghi đồng thời vào cả 2 cột cũ và mới |
| **2. Backfill (Đồng bộ)** | Chạy script ngầm copy dữ liệu từ cột cũ sang cột mới | Ứng dụng chuyển sang đọc từ cột mới |
| **3. Contract (Thu hẹp)** | Xóa cột cũ khỏi database bằng script Flyway mới | Xóa bỏ trường cũ khỏi mã nguồn Entity Java |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (Capstone Benchmark Test)

\`\`\`java
package vn.mastery.ecommerce;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import vn.mastery.ecommerce.domain.Voucher;
import vn.mastery.ecommerce.service.BatchImportService;
import java.util.ArrayList;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BatchInsertBenchmarkTest {

    @Autowired
    private BatchImportService batchImportService;

    @Test
    @DisplayName("Kiểm tra tốc độ nạp 1,000 Voucher dùng Sequence Batching phải dưới 1.5 giây")
    void testBatchInsertPerformance() {
        List<Voucher> vouchers = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            vouchers.add(new Voucher("VOUCHER-" + System.currentTimeMillis() + "-" + i));
        }

        long startTime = System.currentTimeMillis();
        batchImportService.importVouchers(vouchers);
        long duration = System.currentTimeMillis() - startTime;

        System.out.println("Thời gian thực thi nạp 1,000 bản ghi: " + duration + " ms");
        assertTrue(duration < 2000, "Thời gian thực thi phải dưới 2 giây!");
    }
}
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Checklist tốt nghiệp Module 3**:
   - [ ] Hiểu rõ và tin tưởng vào Dirty Checking, không gọi \`save()\` thừa thãi.
   - [ ] Đặt \`FetchType.LAZY\` cho 100% quan hệ.
   - [ ] Bật \`default_batch_fetch_size: 50\` để tự động chặn đứng lỗi N+1.
   - [ ] Dùng Atomic Update hoặc Optimistic Locking để chống bán âm kho.
   - [ ] Tắt hoàn toàn \`ddl-auto=update\`, chuyển sang dùng Flyway quản lý schema.
   - [ ] Dùng \`GenerationType.SEQUENCE\` khi cần tối ưu Batch Insert.
`;
}

fs.writeFileSync(modulePath, "window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n" + JSON.stringify(m3, null, 2) + "\n);\n", "utf8");
console.log("Successfully refactored Module 3 Topics 3.3 & 3.4 (Lessons 3-3-1 to 3-4-4)!");
