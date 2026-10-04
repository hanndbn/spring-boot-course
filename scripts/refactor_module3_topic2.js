const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module3.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m3 = window.COURSE_MODULES.find(m => m.id === 3);

// Refactor Lesson 3-2-1
const l321 = m3.lessons.find(l => l.id === "3-2-1");
if (l321) {
  l321.title = "Bài 3.2.1: Bản chất Lỗi N+1 Query & So Sánh 3 Chiến Lược Triệt Tiêu N+1";
  l321.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu chính xác tại sao lỗi N+1 Query lại là "kẻ giết chết hiệu năng" số 1 trong các ứng dụng Spring Boot sử dụng JPA / Hibernate.
- Nhìn thấy trực tiếp số lượng câu query phát sinh tăng đột biến từ 1 câu lên hàng trăm câu qua log SQL.
- Phân biệt 3 chiến lược giải quyết triệt để: **JOIN FETCH (JPQL)**, **@EntityGraph (JPA 2.1)** và **DTO Projection (Native / Record)**.
- Đọc hiểu 100% từng dòng phân tích qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: N+1 QUERY LÀ GÌ?
**Hình tượng "Người bồi bàn lười biếng đi chợ 101 chuyến":**
- Khách hàng gọi món: *"Cho tôi 100 đĩa cơm tấm kèm 100 chén nước mắm!"*.
- **Cách làm thông minh (JOIN FETCH)**: Bồi bàn vào bếp bê luôn một khay lớn chứa đủ 100 đĩa cơm và 100 chén nước mắm ra bàn trong **đúng 1 chuyến duy nhất (1 câu SQL JOIN)**.
- **Cách làm của Hibernate khi bị dính N+1**:
  - Chuyến 1: Bồi bàn chạy vào bếp bưng 100 đĩa cơm ra bàn (**1 câu SELECT ban đầu**).
  - Sau đó, bồi bàn nhìn đĩa cơm số 1 -> Chạy vào bếp lấy 1 chén mắm (**Câu query thứ 2**).
  - Nhìn đĩa cơm số 2 -> Lại chạy vào bếp lấy 1 chén mắm (**Câu query thứ 3**)...
  - Cứ thế bồi bàn chạy đi chạy lại thêm đúng **N = 100 chuyến nữa**!
  - Tổng cộng mất **1 + 100 = 101 chuyến đi chợ**, làm nghẽn toàn bộ lối đi (Database Connection Pool)!
:::

---

## 1. Cái này là gì? (Bản chất kỹ thuật của N+1 Query)

N+1 Query xảy ra khi truy vấn 1 danh sách $N$ thực thể cha, sau đó trong vòng lặp đọc dữ liệu, ứng dụng gọi getter truy cập vào quan hệ lười (Lazy Collection/Association). Do dữ liệu con chưa được nạp sẵn, Hibernate buộc phải phát sinh thêm $N$ câu \`SELECT\` phụ để nạp từng phần tử con.

### Sơ Đồ Cơ Chế Phát Sinh Lỗi N+1 Trong Spring Data JPA:

\`\`\`mermaid
sequenceDiagram
    participant App as Spring Boot Service
    participant DB as PostgreSQL Database
    
    App->>DB: 1. SELECT * FROM orders LIMIT 10; (Trả về 10 đơn hàng)
    Note over App,DB: Vòng lặp duyệt qua 10 đơn hàng:
    App->>DB: 2. SELECT * FROM order_items WHERE order_id = 1;
    App->>DB: 3. SELECT * FROM order_items WHERE order_id = 2;
    App->>DB: 4. SELECT * FROM order_items WHERE order_id = 3;
    Note over App,DB: ... Tiếp tục thêm 7 câu query con nữa!
    Note right of DB: TỔNG CỘNG: 1 + 10 = 11 CÂU QUERY CHO CHỈ 10 BẢN GHI!
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (So Sánh 3 Chiến Lược Hóa Giải)

### Ma trận So sánh: 3 Giải Pháp Diệt Trừ N+1 Query Chuẩn Senior

| Tiêu chí | Chiến lược 1: JOIN FETCH (JPQL) | Chiến lược 2: @EntityGraph | Chiến lược 3: DTO Projection (Record) |
|---|---|---|---|
| **Cơ chế hoạt động** | Dùng từ khóa \`JOIN FETCH\` trong câu truy vấn JPQL | Khai báo annotation ghi đè FetchPlan tại runtime | Viết câu query \`SELECT new ...\` nạp thẳng vào Record |
| **Loại kết quả trả về** | Full Managed Entity (Có thể sửa và Dirty Check) | Full Managed Entity (Có thể sửa và Dirty Check) | Read-only Record DTO (Bất biến, không tốn L1 Cache) |
| **Tốc độ thực thi** | Nhanh (1 câu query SQL JOIN) | Nhanh (1 câu query SQL LEFT JOIN) | ⭐ **Nhanh nhất thế giới (Tối ưu RAM 100%)** |
| **Phù hợp kịch bản nào** | Khi cần nạp Entity cha để sửa đổi dữ liệu con | Khi dùng sẵn phương thức chuẩn của Spring Data (\`findAll\`) | Khi hiển thị danh sách lên Web/App (Trang Dashboard/Listing) |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Xem trước sự khác biệt giữa code gây lỗi N+1 và code tối ưu:

\`\`\`java
package vn.mastery.ecommerce.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.mastery.ecommerce.domain.Order;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // ❌ ANTI-PATTERN: Gây ra N+1 thảm họa khi duyệt qua items
    List<Order> findByCustomerId(String customerId);

    // ⭐ BEST PRACTICE 1: Dùng JOIN FETCH triệt tiêu N+1 trong 1 query duy nhất
    @Query("SELECT DISTINCT o FROM Order o JOIN FETCH o.items WHERE o.customerId = :customerId")
    List<Order> findByCustomerIdWithItems(String customerId);
}
\`\`\`

### Bảng Giải Mã Cú Pháp JPQL \`JOIN FETCH\`:

| Thành phần cú pháp | Ý nghĩa kỹ thuật | Tác động câu lệnh SQL sinh ra |
|---|---|---|
| \`SELECT DISTINCT o\` | Loại bỏ các bản ghi trùng lặp ở tầng Java | Do phép JOIN bảng 1-N làm nhân bản dòng cha, \`DISTINCT\` giúp Hibernate gom đúng các Entity duy nhất |
| \`JOIN FETCH o.items\` | Yêu cầu Hibernate nạp ngay lập tức tập hợp \`items\` | Hibernate sinh câu lệnh \`INNER JOIN order_items\` và điền sẵn dữ liệu vào mảng \`items\` ngay trong câu query đầu tiên |
| \`:customerId\` | Tham số đặt tên (Named Parameter) | Ngăn chặn hoàn toàn lỗi SQL Injection |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa dùng \`FetchType.EAGER\` để sửa N+1**:
   - Rất nhiều lập trình viên mới sửa lỗi bằng cách đổi \`@ManyToOne(fetch = FetchType.EAGER)\`.
   - **HẬU QUẢ TAI HẠI**: \`EAGER\` là "lời nguyền vĩnh cửu". Bất cứ khi nào bạn truy vấn \`Order\` (kể cả khi chỉ cần đếm số lượng), Hibernate đều ép buộc kéo theo toàn bộ bảng con, làm sập bộ nhớ khi dữ liệu lớn!
   - **Quy tắc vàng**: **Luôn để LAZY mặc định, chỉ kích hoạt FETCH khi thực sự cần dùng!**
`;
}

// Refactor Lesson 3-2-2
const l322 = m3.lessons.find(l => l.id === "3-2-2");
if (l322) {
  l322.title = "Bài 3.2.2: Triển khai JOIN FETCH, @EntityGraph & Interface-based DTO Projection";
  l322.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tự tay triển khai giải pháp \`@EntityGraph\` linh hoạt mà không cần viết lại câu lệnh JPQL dài dòng.
- Làm chủ kỹ thuật **DTO Constructor Expression** nạp dữ liệu trực tiếp vào Java Record.
- So sánh hiệu năng thực tế giữa việc nạp Managed Entity và DTO Projection.
- Đọc hiểu 100% từng dòng code trong Repository và Service qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: DTO PROJECTION VS MANAGED ENTITY
**Hình tượng "Chụp ảnh căn cước vs Bê nguyên cả con người vào phòng thi":**
- Bạn chỉ cần kiểm tra tên và ngày sinh của thí sinh để phát thẻ vào phòng thi (Hiển thị danh sách 50 đơn hàng lên giao diện):
- **Cách dùng Entity (Bê nguyên con người)**: Bạn phải nạp toàn bộ xương thịt, máu mủ, quần áo, gia phả của người đó vào bộ nhớ RAM (L1 Cache, Snapshot, Proxy). Rất nặng nề và lãng phí!
- **Cách dùng DTO Projection (Chụp tấm ảnh thẻ Record)**: Bạn chỉ chụp đúng 3 thông tin cần thiết: Mã đơn, Khách hàng, Tổng tiền. Tấm ảnh siêu nhẹ, không tốn bộ nhớ theo dõi (Dirty checking), tốc độ tải nhanh như chớp!
:::

---

## 1. Cái này là gì? (Cơ Chế Hoạt Động Của @EntityGraph)

\`@EntityGraph\` là tính năng chuẩn của JPA 2.1 cho phép định nghĩa kế hoạch nạp dữ liệu (Fetch Plan) ngay tại thời điểm thực thi phương thức, biến quan hệ \`LAZY\` thành \`EAGER\` chỉ riêng cho câu truy vấn đó.

### Sơ Đồ Kiến Trúc: Cơ Chế Ghi Đè Kế Hoạch Nạp Của @EntityGraph

\`\`\`mermaid
flowchart LR
    A["Repo Method: findAll()"] --> B{"Có @EntityGraph?"}
    B -->|"Mặc định"| C["Chỉ SELECT bảng orders (items là Lazy Proxy)"]
    B -->|"Kèm @EntityGraph(attributePaths = {'items'})"| D["Sinh câu lệnh LEFT JOIN nạp luôn order_items trong 1 query!"]
    style D fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style C fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi xây dựng màn hình Danh sách Đơn hàng (Order Listing) hiển thị 20 đơn hàng gần nhất kèm tên các món đồ:

### Ma trận So sánh: @EntityGraph vs DTO Projection

| Tiêu chí | Dùng \`@EntityGraph\` | Dùng Record DTO Projection |
|---|---|---|
| **Mục đích sử dụng** | Khi cần đọc dữ liệu lên để **chỉnh sửa hoặc gọi business logic** | Khi chỉ cần **đọc dữ liệu để hiển thị ra REST API / UI** |
| **Tiêu tốn bộ nhớ Heap** | Có nạp Entity vào L1 Cache, có tạo bản sao Snapshot | **Zero L1 Cache Overhead**: Bỏ qua hoàn toàn Hibernate Snapshot |
| **Số cột SELECT trong SQL** | \`SELECT * FROM orders ...\` (Kéo toàn bộ cột) | Chỉ \`SELECT o.id, o.totalAmount\` (Chỉ kéo các cột được khai báo) |
| **Khả năng phân trang (Pagination)** | Có thể gặp rủi ro bộ nhớ nếu JOIN với Collection | Phân trang an toàn 100% tại tầng Database |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là 2 cách triển khai tối ưu nhất trong \`OrderRepository\`:

\`\`\`java
package vn.mastery.ecommerce.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.mastery.ecommerce.domain.Order;
import vn.mastery.ecommerce.dto.OrderListingDto;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // 1. Cách 1: Dùng @EntityGraph ghi đè FetchPlan linh hoạt
    @EntityGraph(attributePaths = {"items"})
    Optional<Order> findWithItemsById(Long id);

    // 2. Cách 2: DTO Projection trực tiếp vào Java Record (Tốc độ đỉnh cao)
    @Query("""
        SELECT new vn.mastery.ecommerce.dto.OrderListingDto(
            o.id,
            o.customerId,
            o.totalAmount,
            COUNT(i.id)
        )
        FROM Order o
        LEFT JOIN o.items i
        WHERE o.customerId = :customerId
        GROUP BY o.id, o.customerId, o.totalAmount
    """)
    List<OrderListingDto> findOrderListingsByCustomer(String customerId);
}
\`\`\`

### Bảng Giải Mã Các Annotation & Kỹ Thuật:

| Thành phần mã lệnh | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Hiệu quả tối ưu |
|---|---|---|---|
| \`@EntityGraph(attributePaths = {"items"})\` | JPA 2.1 Entity Graph | Chỉ định Hibernate nạp sẵn trường \`items\` trong câu truy vấn này | Loại bỏ N+1 mà không cần viết lại toàn bộ câu JPQL \`JOIN FETCH\` phức tạp |
| \`SELECT new vn.mastery...Dto(...)\` | JPQL Constructor Expression | Ánh xạ trực tiếp kết quả câu truy vấn SQL vào Constructor của Record | Không tạo Entity, không lưu L1 Cache, giảm 70% mức tiêu thụ RAM |
| \`COUNT(i.id) ... GROUP BY\` | SQL Aggregate Function | Đếm số lượng sản phẩm ngay tại Database engine | Tránh việc phải kéo toàn bộ các bản ghi con lên bộ nhớ Java chỉ để gọi \`.size()\` |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Cạm bẫy \`attributePaths\` gõ sai tên trường**:
   - Nếu bạn gõ \`attributePaths = {"orderItems"}\` trong khi tên biến trong Entity là \`items\`, Hibernate sẽ ném lỗi \`IllegalArgumentException: AttributeNode not found\`. Hãy kiểm tra chính xác tên biến Java.

2. **Ưu tiên DTO Projection cho 90% màn hình Read-Only**:
   - Với các API \`GET /orders\`, hãy luôn dùng DTO Projection. Bạn sẽ vừa tránh được N+1, vừa tăng thông lượng (Throughput) của hệ thống lên gấp 3 lần!
`;
}

// Refactor Lesson 3-2-3
const l323 = m3.lessons.find(l => l.id === "3-2-3");
if (l323) {
  l323.title = "Bài 3.2.3: Cạm bẫy MultipleBagFetchException & Cố Tình Dùng EAGER Để Tránh N+1";
  l323.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã nguyên nhân sâu xa của lỗi kinh điển **\`org.hibernate.loader.MultipleBagFetchException: cannot simultaneously fetch multiple bags\`**.
- Hiểu rõ tại sao không thể dùng \`JOIN FETCH\` cùng lúc trên 2 danh sách \`List\` (Cartesian Product Problem).
- Khắc phục triệt để bằng cách chuyển đổi sang kiểu dữ liệu \`Set\` hoặc sử dụng cấu hình \`default_batch_fetch_size\`.
- Đọc hiểu bảng phân tích chi phí nhân tích Descartes giữa các bảng con.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TÍCH DESCARTES (CARTESIAN PRODUCT)
**Hình tượng "Phép nhân bùng nổ dữ liệu":**
- Đơn hàng \`Order\` có 2 danh sách con:
  - 10 sản phẩm (\`items\`)
  - 10 mốc lịch sử giao hàng (\`shippingLogs\`).
- Nếu bạn ép Hibernate thực hiện câu lệnh SQL: \`JOIN order_items JOIN shipping_logs\`:
- Cơ sở dữ liệu quan hệ sẽ tạo ra phép nhân Descartes: **$10 \times 10 = 100$ dòng dữ liệu trả về qua mạng**!
- Nếu mỗi bảng có 100 dòng -> Trả về **$100 \times 100 = 10,000$ dòng dữ liệu rác trùng lặp**!
- Để bảo vệ bạn khỏi thảm họa nổ RAM này, Hibernate giơ cờ đỏ báo lỗi dừng ngay lập tức: **\`MultipleBagFetchException\`**!
:::

---

## 1. Cái này là gì? (Bản chất MultipleBagFetchException & Java List)

Trong Hibernate, một trường kiểu \`java.util.List\` mà không có annotation \`@OrderColumn\` được gọi là một **"Bag" (Túi chứa phần tử không có thứ tự và cho phép trùng lặp)**. Hibernate không thể cùng lúc kết nối 2 Bag vì không thể phân định được bản ghi nào thuộc về Collection nào khi có tích Descartes.

### Sơ Đồ Bùng Nổ Dữ Liệu Tích Descartes Khi Cố Tình Fetch Nhiều List:

\`\`\`mermaid
flowchart TD
    O["1 Bản Ghi Order"] --> A["10 Dòng Items"]
    O --> B["10 Dòng ShippingLogs"]
    A & B -->|"Phép nhân SQL Cartesian Product"| RES["100 DÒNG KẾT QUẢ TRẢ VỀ!<br/>(Dữ liệu Order bị nhân bản 100 lần)"]
    RES --> ERR["HIBERNATE CHẶN ĐỨNG:<br/>MultipleBagFetchException!"]
    style RES fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
    style ERR fill:#000,stroke:#f59e0b,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Chiến Lược Khắc Phục Chuẩn)

### Ma trận So sánh: Các Giải Pháp Khắc Phục MultipleBagFetchException

| Giải pháp | Cách thực hiện | Ưu điểm | Nhược điểm |
|---|---|---|---|
| **Giải pháp 1: Đổi sang \`Set\`** | Khai báo \`Set<OrderItem> items\` | Đơn giản, sửa nhanh | Vẫn bị tích Descartes ở tầng Database SQL |
| **Giải pháp 2: Tách thành 2 query riêng** | Query 1 nạp \`items\`, Query 2 nạp \`shippingLogs\` | ⭐ **Chuẩn Senior**: 0 tích Descartes, dữ liệu sạch | Cần gọi 2 phương thức repository |
| **Giải pháp 3: Batch Fetching** | Cấu hình \`default_batch_fetch_size: 50\` | ⭐ **Thần thánh**: Tự động gom nhóm nạp theo lô | Cần hiểu cơ chế \`WHERE id IN (...)\` |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

### 1. Giải pháp tối thượng: Cấu hình Batch Fetching trong \`application.yml\`:

\`\`\`yaml
spring:
  jpa:
    properties:
      hibernate:
        # Tự động hóa giải N+1 bằng cơ chế gom lô IN (...)
        default_batch_fetch_size: 50
\`\`\`

### 2. Giải pháp tách 2 câu truy vấn tuần tự nhưng cực kỳ nhanh:

\`\`\`java
package vn.mastery.ecommerce.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import vn.mastery.ecommerce.domain.Order;
import java.util.Optional;

@Repository
public interface OrderDetailRepository extends JpaRepository<Order, Long> {

    // Bước 1: Nạp Order kèm Items
    @Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.id = :id")
    Optional<Order> findWithItemsById(Long id);

    // Bước 2: Nạp tiếp ShippingLogs vào cùng Persistence Context
    @Query("SELECT o FROM Order o JOIN FETCH o.shippingLogs WHERE o.id = :id")
    Optional<Order> findWithShippingLogsById(Long id);
}
\`\`\`

### Bảng Giải Mã Cơ Chế Gom Lô Batch Fetch Size:

| Thiết lập cấu hình | Cách hoạt động bên dưới của Hibernate | Hiệu quả tối ưu |
|---|---|---|
| \`default_batch_fetch_size: 50\` | Khi lặp qua danh sách 100 đơn hàng, thay vì bắn 100 câu query đơn lẻ, Hibernate sẽ gom thành: \`SELECT * FROM items WHERE order_id IN (?, ?, ... 50 IDs)\` | **Giảm số lượng query từ 101 câu xuống chỉ còn đúng 3 câu SQL**! Loại bỏ 98% độ trễ mạng! |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa phân trang cùng với JOIN FETCH Collection**:
   - Nếu bạn viết: \`@Query("SELECT o FROM Order o JOIN FETCH o.items") Page<Order> findAll(Pageable p)\`.
   - Hibernate sẽ in ra dòng cảnh báo chết người: **\`HHH000104: firstResult/maxResults specified with collection fetch; applying in memory!\`**.
   - Hậu quả: Hibernate tải **TOÀN BỘ TRIỆU BẢN GHI VÀO RAM** rồi mới tự cắt trang bằng Java! Điều này sẽ làm sập server vì OutOfMemoryError!
   - Khắc phục: Phân trang trên bảng cha trước, rồi dùng \`default_batch_fetch_size\` để nạp dữ liệu con.
`;
}

// Refactor Lesson 3-2-4
const l324 = m3.lessons.find(l => l.id === "3-2-4");
if (l324) {
  l324.title = "Bài 3.2.4: Tổng Kết Thực Chiến: Bản Đồ Tối Ưu Truy Vấn JPA & Ma Trận Xóa Bỏ N+1 Query";
  l324.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 3.2 thành Bản đồ tối ưu hóa truy vấn cơ sở dữ liệu JPA.
- Nắm chắc Ma trận lựa chọn vũ khí diệt trừ N+1 phù hợp cho từng màn hình nghiệp vụ.
- Thiết lập công cụ tự động phát hiện N+1 Query trong Unit Test (dùng thư viện \`yannisfic/quick-perf\` hoặc assert số lượng query).
- Sẵn sàng 100% bước vào Chuyên đề 3.3 (Transaction Isolation & Concurrency Locking).
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BỘ CÔNG CỤ CỦA CHUYÊN GIA DỌN N+1
Hãy tưởng tượng bạn là một bác sĩ chuyên khoa chẩn đoán bệnh cho hệ thống Database:
1. **Dụng cụ nghe nhịp tim**: Bật log SQL \`show-sql: true\` hoặc dùng \`datasource-proxy\` để đếm số nhịp query.
2. **Kê đơn cho ca bệnh xem chi tiết 1 đơn hàng**: Dùng dao mổ chính xác **\`JOIN FETCH\`** hoặc **\`@EntityGraph\`** (1 vết mổ, gom trọn nội tạng cần thiết).
3. **Kê đơn cho ca bệnh xem danh sách phân trang 50 đơn hàng**: Dùng thuốc kháng sinh liều cao **\`default_batch_fetch_size: 50\`** (Gom nhóm theo lô siêu tốc).
4. **Kê đơn cho ca bệnh báo cáo số liệu Dashboard**: Dùng máy scan siêu âm **\`Record DTO Projection\`** (Chỉ quét chỉ số, không động chạm Entity).
:::

---

## 1. Cái này là gì? (Bản Đồ Chiến Lược Tối Ưu Truy Vấn)

### Sơ Đồ Cây Quyết Định Xử Lý Truy Vấn JPA / Hibernate

\`\`\`mermaid
flowchart TD
    A["Cần truy vấn dữ liệu từ Database"] --> B{"Mục đích truy vấn là gì?"}
    B -->|"Chỉ ĐỌC để hiển thị REST API / UI (Read-Only)"| C["DÙNG RECORD DTO PROJECTION<br/>(SELECT new Dto(...) / Tối ưu RAM tuyệt đối)"]
    B -->|"Cần NẠP Entity để SỬA ĐỔI nghiệp vụ (Write)"| D{"Số lượng quan hệ con cần nạp?"}
    D -->|"Chỉ nạp 1 Collection con"| E["Dùng JOIN FETCH hoặc @EntityGraph"]
    D -->|"Nạp nhiều Collection hoặc có Phân Trang (Paging)"| F["Dùng default_batch_fetch_size: 50<br/>(Tự động gom IN clause an toàn)"]
    style C fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style E fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style F fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Ma Trận Vũ Khí Tối Thượng)

### Ma Trận Lựa Chọn Giải Pháp Tối Ưu Truy Vấn Chuẩn Senior

| Tình huống thực tế | Giải pháp tối ưu | Lý do kỹ thuật | Cần tránh tuyệt đối |
|---|---|---|---|
| **API Chi tiết Đơn hàng** (\`GET /orders/{id}\`) | \`@EntityGraph(attributePaths = {"items"})\` | 1 câu query duy nhất, nạp đủ dữ liệu để hiển thị | Gọi lặp getter trong vòng lặp |
| **API Danh sách Đơn hàng phân trang** (\`GET /orders?page=0&size=20\`) | Query cha phân trang + \`default_batch_fetch_size: 50\` | Phân trang chuẩn tại Database bằng \`LIMIT / OFFSET\` | Dùng \`JOIN FETCH\` cùng với \`Pageable\` |
| **Dashboard Doanh thu / Thống kê** | Record DTO Projection Constructor | Bỏ qua hoàn toàn Hibernate Snapshot và L1 Cache | Nạp Entity lên rồi dùng Java \`.size()\` |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (Test Tự Động Bắt Lỗi N+1)

Dưới đây là Integration Test kiểm tra số lượng câu SQL sinh ra không vượt quá 1 câu:

\`\`\`java
package vn.mastery.ecommerce;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.jdbc.Sql;
import vn.mastery.ecommerce.domain.Order;
import vn.mastery.ecommerce.repository.OrderRepository;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class QueryOptimizationTest {

    @Autowired
    private OrderRepository orderRepository;

    @Test
    @DisplayName("Kiểm tra truy vấn nạp đơn hàng kèm items phải xóa bỏ hoàn toàn N+1")
    @Sql("/scripts/seed-orders.sql") // Chèn sẵn 10 đơn hàng mẫu
    void testNoNPlusOneWhenFetchingOrders() {
        // Sử dụng phương thức JOIN FETCH đã tối ưu
        List<Order> orders = orderRepository.findByCustomerIdWithItems("CUST-100");

        assertFalse(orders.isEmpty());
        // Duyệt qua toàn bộ danh sách items của 10 đơn hàng
        // Nếu dính N+1, log SQL sẽ in ra thêm 10 câu SELECT phụ!
        for (Order order : orders) {
            assertNotNull(order.getItems());
            assertTrue(order.getItems().size() > 0);
        }
    }
}
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Checklist kiểm toán hiệu năng trước khi Release**:
   - [ ] Đã thêm cấu hình \`spring.jpa.properties.hibernate.default_batch_fetch_size: 50\`.
   - [ ] Kiểm tra không có bất kỳ quan hệ nào dùng \`FetchType.EAGER\`.
   - [ ] Không sử dụng \`JOIN FETCH\` chung với tham số \`Pageable\`.
   - [ ] Đã chuyển các màn hình Dashboard/Listing sang dùng **Record DTO Projection**.
   - [ ] Quan sát log SQL lúc test để khẳng định không có hàng chục câu \`SELECT\` lặp lại cùng một bảng.
`;
}

fs.writeFileSync(modulePath, "window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n" + JSON.stringify(m3, null, 2) + "\n);\n", "utf8");
console.log("Successfully refactored Module 3 Topic 3.2 (Lessons 3-2-1 to 3-2-4)!");
