const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module3.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m3 = window.COURSE_MODULES.find(m => m.id === 3);

// Refactor Lesson 3-1-1
const l311 = m3.lessons.find(l => l.id === "3-1-1");
if (l311) {
  l311.title = "Bài 3.1.1: Kiến trúc Persistence Context, Dirty Checking & Vòng đời Entity JPA";
  l311.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã cơ chế hoạt động ngầm của Hibernate EntityManager và Persistence Context (Bộ nhớ đệm cấp 1 - L1 Cache).
- Hiểu tại sao trong Spring Boot ta không cần gọi hàm \`repository.save()\` mà database vẫn tự động cập nhật (Cơ chế Dirty Checking).
- Nắm vững 4 trạng thái sinh tử của một Entity: **Transient (Mới tạo) -> Managed (Được quản lý) -> Detached (Tách rời) -> Removed (Bị xóa)**.
- Đọc hiểu 100% từng dòng code xử lý Entity Đơn hàng qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: PERSISTENCE CONTEXT & DIRTY CHECKING
**1. Persistence Context — "Chiếc bàn làm việc của người thủ thư":**
- Khi bạn đọc sách từ kho (Database), thủ thư (Hibernate) lấy cuốn sách ra và đặt lên chiếc bàn làm việc (**Persistence Context**). Cuốn sách bây giờ ở trạng thái **Managed**.
- Đồng thời, người thủ thư lén chụp lại một bức ảnh ban đầu của cuốn sách (gọi là **Snapshot**).

**2. Dirty Checking — "Tự động phát hiện trang sách bị viết thêm":**
- Bạn dùng bút gạch chân vài dòng trong sách (\`order.setStatus(PAID)\`). Chú ý: bạn **chưa hề mang sách trả lại kho hay ký giấy xác nhận gì cả**!
- Khi chuông hết giờ vang lên (Transaction kết thúc / Commit): Thủ thư mang cuốn sách ra so sánh với bức ảnh Snapshot ban đầu.
- Nhận thấy cuốn sách bị "bẩn" (Dirty - có sự thay đổi), thủ thư **tự động sinh ra câu lệnh \`UPDATE orders SET status = 'PAID' WHERE id = 1\`** và ghi xuống kho Database!
- Bạn không cần gọi \`save()\` thủ công, Hibernate tự làm mọi thứ!
:::

---

## 1. Cái này là gì? (Kiến trúc Persistence Context & State Machine)

Persistence Context là môi trường lưu trữ tạm thời trong RAM của mỗi Transaction, đóng vai trò là **First-Level Cache (L1 Cache)** và bộ theo dõi thay đổi dữ liệu (Change Tracker).

### Sơ Đồ Chuyển Dịch Trạng Thái Entity (Entity Lifecycle State Machine)

\`\`\`mermaid
stateDiagram-v2
    [*] --> Transient: new Order() (Chưa có ID, DB chưa biết)
    Transient --> Managed: em.persist() / repo.save()
    Managed --> Managed: Thay đổi thuộc tính (Dirty Checking chụp Snapshot)
    Managed --> Detached: em.detach() / Transaction đóng / Clear context
    Detached --> Managed: em.merge() (Tái nạp vào Context)
    Managed --> Removed: em.remove() / repo.delete()
    Removed --> [*]: Transaction Commit (DELETE SQL thực thi)
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi cập nhật trạng thái đơn hàng từ \`PENDING\` sang \`PAID\` sau khi nhận Webhook từ cổng thanh toán:

### Ma trận So sánh: Tư duy JDBC thủ công vs Tư duy Hibernate JPA Dirty Checking

| Tiêu chí | Tư duy JDBC cũ / Gọi \`save()\` thừa | Tư duy Hibernate Dirty Checking Chuẩn |
|---|---|---|
| **Cú pháp cập nhật** | \`order.setStatus(PAID); orderRepository.save(order);\` | Chỉ cần \`@Transactional\` và \`order.markAsPaid();\` |
| **Số câu lệnh SQL** | Dễ phát sinh 2 câu: 1 câu \`SELECT\` kiểm tra và 1 câu \`UPDATE\` toàn bộ cột | Chỉ sinh đúng 1 câu \`UPDATE\` duy nhất vào thời điểm Flush |
| **Đồng bộ dữ liệu** | Nếu quên gọi \`save()\`, dữ liệu trên RAM và Database bị lệch nhau | **Tự động 100%**: Mọi thay đổi trên Managed Entity đều được flush khi commit |
| **Truy vấn lặp lại trong 1 request** | Gọi lại ID đó sẽ query DB lần nữa tốn tài nguyên | **Hit L1 Cache**: Lấy ngay instance từ Persistence Context, 0 query phụ |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là Service xác nhận thanh toán đơn hàng chuẩn Senior:

\`\`\`java
package vn.mastery.ecommerce.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.mastery.ecommerce.domain.Order;
import vn.mastery.ecommerce.domain.OrderStatus;
import vn.mastery.ecommerce.exception.OrderNotFoundException;
import vn.mastery.ecommerce.repository.OrderRepository;

@Service
public class OrderPaymentService {

    private final OrderRepository orderRepository;

    public OrderPaymentService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Transactional
    public void confirmPayment(Long orderId, String transactionId) {
        // 1. Nạp Entity vào Persistence Context (Trạng thái: Managed)
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException("Không tìm thấy đơn hàng: " + orderId));

        // 2. Thay đổi trạng thái trực tiếp trên đối tượng (Dirty Checking theo dõi)
        order.setStatus(OrderStatus.PAID);
        order.setPaymentTransactionId(transactionId);

        // KHÔNG CẦN GỌI orderRepository.save(order)!
        // Khi phương thức kết thúc, @Transactional commit -> Hibernate tự động flush UPDATE SQL xuống DB!
    }
}
\`\`\`

### Bảng Giải Mã Chi Tiết Cơ Chế Vận Hành:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Tác động Spring & Hibernate |
|---|---|---|---|
| \`@Transactional\` | Spring AOP Transaction | Mở một Transaction mới và liên kết với một Persistence Context | Mọi thao tác bên trong được đảm bảo tính ACID; tự động commit/rollback |
| \`orderRepository.findById(orderId)\` | Spring Data JPA Query | Truy vấn DB và nạp Entity vào L1 Cache | Tạo bản ghi Managed Entity kèm theo một bản Snapshot lưu trạng thái gốc |
| \`order.setStatus(OrderStatus.PAID);\` | Business Setter | Thay đổi trường dữ liệu trong RAM | Hibernate so sánh với Snapshot lúc flush; đánh dấu Entity là "Dirty" |
| Kết thúc method | Transaction Commit | Kích hoạt chu kỳ \`em.flush()\` | Hibernate tự động sinh câu lệnh \`UPDATE orders SET status = ?, transaction_id = ? WHERE id = ?\` |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Cạm bẫy gọi \`save()\` trong phương thức có \`@Transactional\`**:
   - Gọi \`repo.save(entity)\` khi entity đã ở trạng thái \`Managed\` là **hoàn toàn vô nghĩa và thừa thãi**. Nó chỉ tốn thêm chu kỳ CPU kiểm tra \`isNew()\` bên trong Spring Data JPA.
   - Hãy tin tưởng vào cơ chế Dirty Checking của Hibernate!

2. **Cạm bẫy cập nhật dữ liệu ngoài Transaction (\`Detached Entity\`)**:
   - Nếu bạn gọi \`order.setStatus(PAID)\` trong một phương thức **KHÔNG CÓ \`@Transactional\`**, Entity đã rơi vào trạng thái \`Detached\`. Hibernate sẽ không theo dõi và **không có câu lệnh UPDATE nào được sinh ra**! Dữ liệu bị mất âm thầm!
`;
}

// Refactor Lesson 3-1-2
const l312 = m3.lessons.find(l => l.id === "3-1-2");
if (l312) {
  l312.title = "Bài 3.1.2: Thiết kế Quan hệ Entity Chuẩn: OneToMany, ManyToOne & JPA Auditing";
  l312.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nắm chắc nguyên tắc thiết kế quan hệ 1-Nhiều (\`OneToMany\` & \`ManyToOne\`) hai chiều chuẩn mực giữa \`Order\` và \`OrderItem\`.
- Hiểu rõ khái niệm Relationship Owner (Bên sở hữu khóa ngoại) và vai trò của \`mappedBy\`.
- Tự động hóa việc ghi nhận người tạo, ngày tạo, ngày sửa đổi thông qua **Spring Data JPA Auditing**.
- Đọc hiểu 100% từng dòng code Entity và Helper methods qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: MAPPEDBY & RELATIONSHIP OWNER
**Hình tượng "Cuốn sổ hộ khẩu (Order) và Thẻ căn cước (OrderItem)":**
- Khóa ngoại (\`order_id\`) nằm trên bảng con \`order_items\` trong cơ sở dữ liệu.
- Trong Java, \`OrderItem\` chính là **Relationship Owner (Chủ sở hữu mối quan hệ)** vì nó nắm giữ cột khóa ngoại \`@JoinColumn(name = "order_id")\`.
- Còn class \`Order\` chỉ là bên quan sát (Inverse Side), do đó nó phải ghi rõ: \`@OneToMany(mappedBy = "order")\`.
- \`mappedBy = "order"\` có nghĩa là: *"Này Hibernate, việc lưu trữ liên kết giữa 2 bảng hãy nhìn vào biến 'order' bên class OrderItem mà làm, đừng tạo thêm một bảng trung gian vô nghĩa!"*.
:::

---

## 1. Cái này là gì? (Kiến trúc Quan hệ Hai Chiều Bidirectional)

Trong quan hệ 1-N, phía \`ManyToOne\` luôn là bên sở hữu khóa ngoại (Owner), còn phía \`OneToMany\` luôn là bên bị sở hữu (Inverse) có thuộc tính \`mappedBy\`.

### Sơ Đồ Thiết Kế Bảng Database & Ánh Xạ Entity Java:

\`\`\`mermaid
erDiagram
    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDERS {
        bigint id PK
        varchar customer_id
        numeric total_amount
        timestamp created_at
        timestamp updated_at
    }
    ORDER_ITEMS {
        bigint id PK
        bigint order_id FK "Chủ sở hữu liên kết (@JoinColumn)"
        varchar product_id
        int quantity
        numeric unit_price
    }
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi một khách hàng tạo đơn hàng gồm nhiều sản phẩm, việc thêm/xóa sản phẩm phải đồng bộ cả 2 đầu trong bộ nhớ Java trước khi Hibernate ghi xuống DB:

### Ma trận So sánh: Thiết kế cẩu thả vs Thiết kế Chuẩn Senior

| Tiêu chí | Thiết kế cẩu thả | Thiết kế Chuẩn Senior (Best Practice) |
|---|---|---|
| **Khai báo \`OneToMany\` không có \`mappedBy\`** | Hibernate tự động sinh ra thêm 1 bảng phụ vô nghĩa (\`orders_order_items\`) làm chậm gấp đôi | Khai báo \`mappedBy = "order"\`, chỉ dùng duy nhất 1 khóa ngoại tại bảng con |
| **Đồng bộ quan hệ trong RAM** | Chỉ gọi \`order.getItems().add(item)\`, quên set ngược lại \`item.setOrder(order)\` | Viết **Helper Method \`addOrderItem()\`** tự động đồng bộ cả 2 chiều |
| **Theo dõi lịch sử chỉnh sửa** | Viết code thủ công \`setCreatedAt(Instant.now())\` ở khắp mọi Service | Kích hoạt **JPA Auditing \`@CreatedDate\`, \`@LastModifiedDate\`** tự động 100% |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

### 1. Entity Cha (\`Order.java\`):

\`\`\`java
package vn.mastery.ecommerce.domain;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@EntityListeners(AuditingEntityListener.class)
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String customerId;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private Instant updatedAt;

    // Helper Method sống còn để duy trì tính nhất quán 2 chiều
    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this); // Rất quan trọng!
    }

    public void removeItem(OrderItem item) {
        items.remove(item);
        item.setOrder(null);
    }
}
\`\`\`

### 2. Entity Con (\`OrderItem.java\`):

\`\`\`java
package vn.mastery.ecommerce.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false)
    private String productId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private BigDecimal unitPrice;

    public void setOrder(Order order) {
        this.order = order;
    }
}
\`\`\`

### Bảng Giải Mã Các Annotation Cốt Lõi:

| Annotation / Thuộc tính | Ý nghĩa kỹ thuật | Tác động hệ thống |
|---|---|---|
| \`cascade = CascadeType.ALL\` | Lan truyền vòng đời từ Cha sang Con | Khi lưu/xóa \`Order\`, toàn bộ danh sách \`OrderItem\` bên trong tự động được lưu/xóa theo |
| \`orphanRemoval = true\` | Tự động xóa bản ghi mồ côi | Nếu một item bị remove khỏi mảng \`items\`, Hibernate sẽ tự động bắn câu lệnh \`DELETE\` bản ghi đó khỏi DB |
| \`fetch = FetchType.LAZY\` | Tải dữ liệu lười | Khi truy vấn \`OrderItem\`, Hibernate KHÔNG tự động join bảng \`orders\` trừ khi ta gọi getter |
| \`@CreatedDate / @LastModifiedDate\` | Spring Data Auditing | Tự động điền timestamp chính xác vào cột ngày tạo/ngày sửa lúc INSERT/UPDATE |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Quên gọi \`item.setOrder(this)\` trong Helper Method**:
   - Nếu bạn chỉ gọi \`order.getItems().add(item)\` mà không gọi \`item.setOrder(this)\`, cột \`order_id\` trong bảng \`order_items\` sẽ bị **NULL**! Kết quả là câu lệnh INSERT sẽ văng lỗi \`NotNullConstraintViolationException\`.

2. **Kích hoạt JPA Auditing trong cấu hình**:
   - Đừng quên thêm annotation **\`@EnableJpaAuditing\`** trên một class \`@Configuration\` (hoặc class chính \`@SpringBootApplication\`), nếu không các annotation \`@CreatedDate\` sẽ không có tác dụng.
`;
}

// Refactor Lesson 3-1-3
const l313 = m3.lessons.find(l => l.id === "3-1-3");
if (l313) {
  l313.title = "Bài 3.1.3: Cạm bẫy Lombok @Data Làm Hỏng HashCode/Equals & CascadeType.REMOVE Nguy Hiểm";
  l313.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu tại sao dùng annotation Lombok \`@Data\` hoặc \`@EqualsAndHashCode\` trên JPA Entity là "tội đồ" gây ra lỗi tràn bộ nhớ \`StackOverflowError\`.
- Nắm vững quy tắc vàng cài đặt \`equals()\` và \`hashCode()\` chuẩn Hibernate dựa trên Business Key hoặc Id.
- Nhận diện hiểm họa xóa nhầm dữ liệu trên diện rộng của \`CascadeType.REMOVE\` trong quan hệ \`@ManyToMany\` hoặc \`@ManyToOne\`.
- Đọc hiểu 100% đoạn code chuẩn và bảng phân tích triệu chứng lỗi.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: VÒNG LẶP VÔ TẬN VÀ HIỂM HỌA XÓA NHẦM
**1. Thảm họa Lombok \`@Data\` — "Chiếc gương phản chiếu vô tận":**
- Class \`Order\` có trường \`List<OrderItem> items\`.
- Class \`OrderItem\` lại có trường \`Order order\`.
- Khi bạn đặt \`@Data\`, Lombok tự động sinh ra hàm \`toString()\` và \`hashCode()\`.
- Khi in log: \`Order\` in danh sách \`items\`. Mỗi \`OrderItem\` lại in \`order\`. \`Order\` lại in \`items\`... Hai chiếc gương soi vào nhau lặp đi lặp lại hàng triệu lần cho đến khi bộ nhớ RAM bị nổ tung: **\`java.lang.StackOverflowError\`**!

**2. Hiểm họa \`CascadeType.REMOVE\` — "Xóa một đơn hàng, bay luôn tài khoản khách":**
- Nếu trên trường \`@ManyToOne Customer customer\` trong \`Order\` mà bạn dại dột đặt \`cascade = CascadeType.REMOVE\`:
- Khi quản trị viên xóa 1 đơn hàng bị hủy, Hibernate sẽ tiện tay **xóa sổ luôn bản ghi Khách hàng** trong bảng \`customers\`!
:::

---

## 1. Cái này là gì? (Bản chất kỹ thuật của Equals, HashCode & Set Collection)

Khi Entity được lưu vào \`Set<Order>\` (hoặc cấu trúc bảng băm HashSet), nếu hàm \`hashCode()\` phụ thuộc vào cột \`id\` (vốn bị null khi chưa lưu vào DB), giá trị hash sẽ bị thay đổi sau khi lưu, dẫn đến việc **không thể tìm lại Entity trong Set**!

### Sơ Đồ Vòng Lặp Vô Tận Của Lombok @ToString / @EqualsAndHashCode:

\`\`\`mermaid
flowchart LR
    A["Order.toString()"] -->|"Gọi in trường"| B["OrderItem.toString()"]
    B -->|"Gọi ngược lại trường"| A
    style A fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
    style B fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
    NOTE["STACK OVERFLOW ERROR CRASH JVM!"]
    style NOTE fill:#000,stroke:#f59e0b,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bảng Phân Định Quy Tắc Thiết Kế)

### Ma trận So sánh: Lombok @Data vs Chuẩn Senior JPA Entity

| Tiêu chí | Dùng Lombok \`@Data\` trên Entity | Chuẩn Senior JPA Entity |
|---|---|---|
| **Hàm \`toString()\`** | Tự động in toàn bộ trường, gây **\`StackOverflowError\`** với quan hệ 2 chiều | Chỉ in các trường nguyên thủy (id, code, status), loại bỏ hoàn toàn các trường quan hệ |
| **Hàm \`equals/hashCode\`** | Tính toán trên mọi trường, làm hỏng L1 Cache và \`HashSet\` khi Entity chuyển trạng thái | Cài đặt \`equals/hashCode\` dựa trên **Business Key duy nhất** (VD: \`orderCode\`, \`sku\`) |
| **Annotation Lombok an toàn** | ❌ \`@Data\` (Cấm dùng) | ⭐ Dùng riêng lẻ: **\`@Getter\`**, **\`@Setter\`** |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là cách triển khai \`equals\` và \`hashCode\` chuẩn mực không bao giờ lỗi:

\`\`\`java
package vn.mastery.ecommerce.domain;

import jakarta.persistence.*;
import org.hibernate.proxy.HibernateProxy;
import java.util.Objects;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String orderTrackingNumber; // Business Key duy nhất

    // CHỈ DÙNG @Getter, @Setter, TUYỆT ĐỐI KHÔNG DÙNG @Data!

    @Override
    public final boolean equals(Object o) {
        if (this == o) return true;
        if (o == null) return false;
        // Xử lý an toàn khi Entity bị bọc bởi Hibernate Proxy CGLIB
        Class<?> oEffectiveClass = o instanceof HibernateProxy hp 
            ? hp.getHibernateLazyInitializer().getPersistentClass() 
            : o.getClass();
        Class<?> thisEffectiveClass = this instanceof HibernateProxy hp 
            ? hp.getHibernateLazyInitializer().getPersistentClass() 
            : this.getClass();
        if (thisEffectiveClass != oEffectiveClass) return false;
        Order order = (Order) o;
        return orderTrackingNumber != null && Objects.equals(orderTrackingNumber, order.orderTrackingNumber);
    }

    @Override
    public final int hashCode() {
        // Trả về giá trị cố định hoặc hash của business key để không đổi khi nạp ID
        return this instanceof HibernateProxy hp 
            ? hp.getHibernateLazyInitializer().getPersistentClass().hashCode() 
            : getClass().hashCode();
    }
}
\`\`\`

### Bảng Giải Mã Các Kỹ Thuật Phòng Thủ:

| Đoạn mã | Kỹ thuật sử dụng | Lợi ích hệ thống |
|---|---|---|
| \`HibernateProxy hp = ...\` | Kiểm tra Proxy Unwrapping | Đảm bảo so sánh \`equals\` chính xác ngay cả khi một bên là Hibernate Proxy lười (Lazy Proxy) |
| \`Objects.equals(orderTrackingNumber, ...)\` | So sánh theo Business Key | Đảm bảo tính nhất quán của Entity trước và sau khi lưu xuống Database |
| Trả về hằng số trong \`hashCode()\` | Fixed Class HashCode | Đảm bảo Entity không bị "thất lạc" bên trong cấu trúc \`HashSet\` khi chuyển trạng thái |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Nguyên tắc vàng của CascadeType**:
   - \`CascadeType.ALL\` và \`orphanRemoval = true\` **CHỈ ĐƯỢC PHÉP DÙNG** trên quan hệ Cha - Con sở hữu độc quyền (\`Order -> OrderItem\`).
   - Trên quan hệ \`@ManyToOne\` hoặc \`@ManyToMany\`, **TUYỆT ĐỐI KHÔNG BAO GIỜ dùng \`CascadeType.REMOVE\`**.

2. **Loại bỏ Lombok \`@ToString.Exclude\`**:
   - Nếu bạn bắt buộc phải dùng Lombok \`@ToString\`, hãy luôn đặt **\`@ToString.Exclude\`** trên tất cả các trường tham chiếu quan hệ (\`@ManyToOne\`, \`@OneToMany\`) để chặn đứng StackOverflow.
`;
}

// Refactor Lesson 3-1-4
const l314 = m3.lessons.find(l => l.id === "3-1-4");
if (l314) {
  l314.title = "Bài 3.1.4: Tổng Kết Thực Chiến: Bản Đồ Vòng Đời Entity & Ma Trận Thiết Kế Quan Hệ JPA";
  l314.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 3.1 thành Bản đồ thiết kế dữ liệu JPA chuẩn Senior.
- Nắm chắc checklist 5 nguyên tắc vàng khi thiết kế Entity trong dự án E-Commerce.
- Rèn luyện phản xạ phát hiện sai lầm thiết kế quan hệ trước khi chạy migration database.
- Đọc hiểu bảng quyết định kỹ thuật ADR khi lựa chọn Fetch Type và Cascade Type.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỔNG KẾT BẢN THIẾT KẾ CƠ SỞ DỮ LIỆU
Bạn vừa hoàn thành việc thiết lập "Trái tim lưu trữ dữ liệu" của ứng dụng Spring Boot:
- Chúng ta đã thuần hóa **Persistence Context** và cơ chế **Dirty Checking** để không còn viết code thừa thãi.
- Chúng ta đã làm chủ quan hệ 1-N hai chiều chuẩn mực với **\`mappedBy\`** và **Helper Methods**.
- Chúng ta đã giải trừ lời nguyền **Lombok \`@Data\`** và bẫy xóa nhầm dữ liệu **Cascade Remove**.
Hệ thống Entity đã vững như bàn thạch, sẵn sàng bước sang thử thách lớn nhất của lập trình viên Backend: **Diệt trừ triệt để lỗi N+1 Query!**
:::

---

## 1. Cái này là gì? (Bản Đồ Kiến Trúc Toàn Diện Chuyên Đề 3.1)

### Sơ Đồ Tổng Thể: Vòng Đời Entity & Quản Trị Trạng Thái Trong Spring Data JPA

\`\`\`mermaid
flowchart TD
    A["Tạo mới Entity trong RAM<br/>(Transient State)"] -->|"repo.save() / em.persist()"| B["Persistence Context (L1 Cache)<br/>(Managed State)"]
    B -->|"Snapshot so sánh"| C{"Có thay đổi thuộc tính?<br/>(Dirty Checking)"}
    C -->|"CÓ"| D["Tự sinh câu lệnh UPDATE lúc Flush"]
    C -->|"KHÔNG"| E["Bỏ qua, 0 câu lệnh SQL thừa"]
    D --> F["Transaction Commit<br/>Ghi xuống PostgreSQL"]
    style B fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style D fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bảng Quyết Định Kỹ Thuật ADR)

### Bảng Quyết Định Kiến Trúc Thiết Kế Entity (ADR Matrix)

| Hạng mục quyết định | Chuẩn Senior khuyến nghị | Lý do kiến trúc | Phương án cấm kỵ |
|---|---|---|---|
| **Lombok trên Entity** | Chỉ dùng \`@Getter\`, \`@Setter\` | Tránh vòng lặp vô tận và lỗi băm bộ nhớ | Dùng \`@Data\` hoặc \`@EqualsAndHashCode\` |
| **FetchType mặc định** | **LAZY 100%** trên mọi quan hệ | Ngăn chặn việc tải dữ liệu thừa thãi kéo sập RAM | Dùng \`EAGER\` trên quan hệ \`OneToMany\` |
| **Khóa ngoại hai chiều** | Dùng \`mappedBy\` ở bên One, \`@JoinColumn\` ở bên Many | Tránh sinh bảng phụ vô nghĩa | Bỏ quên \`mappedBy\` |
| **Xóa bản ghi con** | Dùng \`orphanRemoval = true\` | Tự động dọn rác bản ghi mồ côi sạch sẽ | Xóa thủ công từng dòng con |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (Checklist Test Case)

Dưới đây là Unit Test kiểm tra tính toàn vẹn của Helper Method và Auditing:

\`\`\`java
package vn.mastery.ecommerce;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import vn.mastery.ecommerce.domain.Order;
import vn.mastery.ecommerce.domain.OrderItem;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class OrderEntityMappingTest {

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("Kiểm tra lưu đơn hàng kèm các item con tự động lan truyền (Cascade)")
    void testCascadeSaveAndOrphanRemoval() {
        Order order = new Order("CUST-100");
        OrderItem item = new OrderItem("PROD-IPHONE", 1, new BigDecimal("25000000"));
        order.addItem(item);

        Order savedOrder = entityManager.persistFlushFind(order);
        assertNotNull(savedOrder.getId());
        assertEquals(1, savedOrder.getItems().size());
        assertEquals(savedOrder, savedOrder.getItems().get(0).getOrder());
    }
}
\`\`\`

### Bảng Giải Mã Test Case Sliced Test:

| Dòng code test | Ý nghĩa kỹ thuật | Kết quả xác nhận |
|---|---|---|
| \`@DataJpaTest\` | Test cắt lớp JPA | Chỉ nạp tầng Database & Hibernate, tốc độ chạy siêu tốc trong vài trăm miligiây |
| \`entityManager.persistFlushFind(...)\` | Thao tác Flush tức thì | Ép Hibernate bắn SQL xuống DB trong bộ nhớ và nạp lại để kiểm tra mapping |
| \`assertEquals(savedOrder, item.getOrder())\` | Kiểm tra tính nhất quán 2 chiều | Xác nhận Helper method \`addItem\` đã gán ngược khóa ngoại thành công |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **5 Nguyên tắc vàng khi thiết kế JPA Entity**:
   - **Nguyên tắc 1**: Luôn gán \`FetchType.LAZY\` cho tất cả các quan hệ (\`@ManyToOne\`, \`@OneToOne\`).
   - **Nguyên tắc 2**: Không bao giờ dùng \`@Data\` của Lombok trên Entity.
   - **Nguyên tắc 3**: Luôn khởi tạo danh sách con bằng \`new ArrayList<>()\` để tránh \`NullPointerException\`.
   - **Nguyên tắc 4**: Viết Helper Method cho quan hệ 2 chiều (\`addItem\`, \`removeItem\`).
   - **Nguyên tắc 5**: Sử dụng \`orphanRemoval = true\` cho các thành phần con gắn liền với vòng đời cha.
`;
}

fs.writeFileSync(modulePath, "window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n" + JSON.stringify(m3, null, 2) + "\n);\n", "utf8");
console.log("Successfully refactored Module 3 Topic 3.1 (Lessons 3-1-1 to 3-1-4)!");
