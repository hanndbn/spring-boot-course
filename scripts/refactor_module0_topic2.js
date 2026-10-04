const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module0.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m0 = window.COURSE_MODULES.find(m => m.id === 0);

// Refactor Lesson 0-2-1
const l021 = m0.lessons.find(l => l.id === "0-2-1");
if (l021) {
  l021.title = "Bài 0.2.1: Ứng dụng Java Record làm DTO Bất Biến trong Spring Boot Controller & Service";
  l021.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu rõ tại sao Java Record là sự thay thế hoàn hảo cho Class POJO truyền thống và thư viện Lombok trong Spring Boot 3 DTO.
- Nắm vững đặc tính bất biến tuyệt đối (Immutability) và Thread-Safe của Record khi truyền nhận dữ liệu qua REST API.
- Tự triển khai Compact Constructor để kiểm tra tính hợp lệ của dữ liệu đầu vào (Compact Validation).
- Đọc hiểu 100% từng dòng code tạo DTO Đặt hàng (\`CreateOrderRequest\`) qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CLASS POJO TRUYỀN THỐNG VS JAVA RECORD
**1. Class POJO truyền thống (Lombok \`@Data\`) — "Tờ giấy ghi chú có thể bị ai đó tẩy xóa":**
- Khi khách hàng gửi yêu cầu đặt hàng, hệ thống tạo ra một đối tượng DTO.
- Nếu dùng Class POJO có hàm \`setter\`: Bất kỳ lập trình viên nào trong nhóm hoặc một đoạn code bên thứ ba cũng có thể vô tình gọi \`order.setPrice(BigDecimal.ZERO)\` để sửa đổi dữ liệu giữa đường đi!
- Điều này tạo ra rủi ro rò rỉ trạng thái (Mutable State Bug) cực kỳ nguy hiểm trong môi trường xử lý đồng thời hàng nghìn request.

**2. Java Record — "Hợp đồng công chứng in trên đá bất biến":**
- Một khi đã được tạo ra, **không ai có thể thay đổi bất kỳ trường nào** của Record (chỉ có getter, không hề có setter).
- Không cần viết hàng chục dòng boilerplate code (\`getter\`, \`equals\`, \`hashCode\`, \`toString\`) và không cần cài thêm plugin Lombok phức tạp.
- Spring Boot 3 và Jackson tự động ánh xạ JSON trực tiếp vào Record một cách mượt mà và an toàn 100%!
:::

---

## 1. Cái này là gì? (Bản chất kỹ thuật của Record trong Spring Boot)

Java Record (được chuẩn hóa từ Java 16/17 và là công dân hạng nhất trong Spring Boot 3) là một loại class đặc biệt được thiết kế để làm **vật chứa dữ liệu bất biến (Transparent Carrier for Immutable Data)**.

### Sơ Đồ So Sánh Bộ Nhớ: Class POJO có Setter vs Java Record Bất Biến

\`\`\`mermaid
flowchart LR
    subgraph POJO["Class POJO Truyền Thống (Nguy Hiểm)"]
        A1["HTTP Request Thread 1"] -->|Đọc| OBJ["OrderDTO Object (Bộ nhớ Heap)"]
        A2["Background Async Thread 2"] -->|"Vô tình gọi .setTotalAmount(0)!"| OBJ
    end
    subgraph RECORD["Java Record Chuẩn Mực Spring Boot 3"]
        B1["HTTP Request Thread 1"] -->|Đọc an toàn| REC["CreateOrderRequest Record (Immutable)"]
        B2["Background Async Thread 2"] -->|Đọc an toàn| REC
    end
    style RECORD fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style POJO fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Trong hệ thống thương mại điện tử, các gói dữ liệu gửi lên từ Mobile App / Web Frontend cần được đảm bảo toàn vẹn:

### Ma trận So sánh: Lombok POJO DTO vs Java Record DTO

| Tiêu chí | POJO DTO thông thường (Lombok) | Java Record DTO (Spring Boot 3) |
|---|---|---|
| **Boilerplate Code** | Cần hàng loạt annotation: \`@Getter\`, \`@Setter\`, \`@EqualsAndHashCode\`, \`@ToString\` | **1 dòng duy nhất**: \`public record CreateOrderRequest(...) {}\` |
| **Tính bất biến (Immutability)** | Mặc định có thể sửa đổi nếu có \`@Setter\`, dễ gây lỗi Race Condition đa luồng | **Bất biến 100%**: Mọi trường mặc định là \`private final\`, không thể sửa sau khi khởi tạo |
| **Hỗ trợ từ Spring Boot** | Cần cấu hình plugin Lombok trong IDE, dễ lỗi khi nâng cấp JDK | Được **Spring Boot 3 và Jackson nạp trực tiếp** mà không cần bất kỳ plugin ngoài nào |
| **Validation ngay tại Constructor** | Cần viết hàm setter kiểm tra hoặc đợi nạp Spring Bean | Hỗ trợ **Compact Constructor** tự kiểm tra tính hợp lệ ngay thời điểm sinh ra |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là mã nguồn Record DTO tiếp nhận yêu cầu đặt hàng từ khách hàng:

\`\`\`java
package vn.mastery.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.List;

public record CreateOrderRequest(
    @NotBlank(message = "Mã khách hàng không được để trống")
    String customerId,

    @NotNull(message = "Danh sách sản phẩm không được null")
    List<OrderItemDto> items,

    @NotNull(message = "Tổng tiền không được null")
    @Positive(message = "Tổng tiền phải lớn hơn 0")
    BigDecimal totalAmount
) {
    // Compact Constructor: Kiểm tra logic bảo vệ (Invariants)
    public CreateOrderRequest {
        if (items != null && items.isEmpty()) {
            throw new IllegalArgumentException("Đơn hàng phải chứa ít nhất 1 sản phẩm");
        }
        // Bảo vệ tính bất biến sâu: Tạo bản sao unmodifiable
        items = (items == null) ? List.of() : List.copyOf(items);
    }
}
\`\`\`

### Bảng Phân Tích Từng Dòng Code DTO:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Spring |
|---|---|---|---|
| \`public record CreateOrderRequest(...)\` | Khai báo Record | Định nghĩa một immutable data carrier với các components | Trình biên dịch Java tự động sinh constructor, getters (\`customerId()\`), \`equals()\`, \`hashCode()\` |
| \`@NotBlank / @NotNull / @Positive\` | Jakarta Validation Annotations | Khai báo quy tắc kiểm tra tính hợp lệ của dữ liệu payload | Spring Boot 3 \`@Valid\` sẽ tự động kích hoạt bộ validator kiểm tra JSON gửi lên từ client |
| \`public CreateOrderRequest { ... }\` | Compact Constructor | Constructor tinh gọn không cần lặp lại danh sách tham số | Cho phép chèn logic kiểm tra nghiệp vụ và xử lý trước khi gán vào các trường nội tại |
| \`items = List.copyOf(items);\` | Defensive Copy | Tạo danh sách bất biến tuyệt đối (Unmodifiable List) | Ngăn chặn việc ai đó bên ngoài gọi \`items.add()\` hoặc \`items.clear()\` làm biến đổi dữ liệu của Record |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Cạm bẫy "Bất biến nông" (Shallow Immutability)**:
   - **Hiện tượng**: Bạn tạo Record chứa trường \`List<Item>\`. Bên ngoài vẫn có thể gọi \`request.items().add(newItem)\` và làm danh sách thay đổi!
   - **Bản chất**: Bản thân biến tham chiếu \`items\` là final, nhưng đối tượng \`ArrayList\` mà nó trỏ tới lại có thể biến đổi.
   - **Khắc phục**: Luôn dùng \`List.copyOf(items)\` trong Compact Constructor để biến danh sách thành bất biến thật sự.

2. **TUYỆT ĐỐI không dùng Record làm JPA \`@Entity\`**:
   - **Nguyên nhân**: Hibernate / JPA bắt buộc class Entity phải có No-Arg Constructor (hàm tạo không tham số) và các trường có thể sửa đổi (Mutable) để quản lý Dirty Checking và Proxy CGLIB. Record hoàn toàn không hỗ trợ điều này!
   - **Nguyên tắc vàng**: **Record dùng cho DTO (Data Transfer Object), Class thông thường dùng cho JPA Entity**.
`;
}

// Refactor Lesson 0-2-2
const l022 = m0.lessons.find(l => l.id === "0-2-2");
if (l022) {
  l022.title = "Bài 0.2.2: Xử lý Stream Pipeline trong Service: Filter, Map, Grouping đơn hàng E-Commerce";
  l022.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nắm chắc vòng đời của một Stream Pipeline: Nguồn khởi tạo (Source) -> Các thao tác trung gian (Intermediate) -> Thao tác kết thúc (Terminal).
- Áp dụng các toán tử cốt lõi \`filter\`, \`map\`, \`reduce\` và \`Collectors.groupingBy\` vào bài toán tổng hợp doanh thu đơn hàng.
- Hiểu rõ cơ chế Lazy Evaluation (Thực thi lười): Stream chỉ chạy khi có Terminal Operation.
- Đọc hiểu 100% từng dòng code Service tổng hợp đơn hàng qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: STREAM PIPELINE LÀ GÌ?
**Hình tượng "Dây chuyền băng tải đóng gói hàng hóa":**
- Hãy tưởng tượng bạn có một thùng hàng gồm 1,000 kiện hàng vừa nhập kho (\`List<Order>\`).
- **Cách làm cũ (For-loop lồng nhau)**: Bạn tự tay bê từng kiện hàng sang bàn 1 để kiểm tra hạn sử dụng, rồi lại bê sang bàn 2 để dán tem, rồi lại bê sang bàn 3 để tính tiền. Rất mệt nhọc và code rối rắm.
- **Stream Pipeline (Băng tải tự động)**:
  - Băng tải bắt đầu chạy (\`.stream()\`).
  - Trạm lọc quét mã: Chỉ giữ lại kiện hàng hợp lệ (\`.filter(Order::isPaid)\`).
  - Trạm dán nhãn: Trích xuất số tiền thanh toán (\`.map(Order::totalAmount)\`).
  - Cân tổng kết thúc: Tính tổng toàn bộ tiền trên băng tải (\`.reduce(BigDecimal.ZERO, BigDecimal::add)\`).
  - **Đặc điểm vi diệu**: Băng tải sẽ **không hề tốn một giọt điện nào** nếu ở cuối dây chuyền không có người đứng nhận thùng hàng kết quả (Lazy Evaluation)!
:::

---

## 1. Cái này là gì? (Kiến trúc Stream Pipeline trong Java 21)

Stream API không phải là một cấu trúc dữ liệu lưu trữ (không phải Collection), mà là một **luồng tính toán dữ liệu theo phong cách lập trình hàm (Functional Pipeline)**.

### Sơ Đồ Luồng: 3 Giai Đoạn Vận Hành Của Stream Pipeline

\`\`\`mermaid
flowchart LR
    A["Collection Nguồn<br/>(orders: List)"] -->|".stream()"| B["Toán Tử Trung Gian 1<br/>filter(status == COMPLETED)"]
    B -->|"Stream mới"| C["Toán Tử Trung Gian 2<br/>map(Order::getTotalAmount)"]
    C -->|"Stream mới"| D["Terminal Operation<br/>.reduce() / .collect()"]
    D --> E["KẾT QUẢ ĐẦU RA<br/>(Tổng doanh thu: BigDecimal)"]
    style A fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style D fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style E fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi viết tầng Service trong Spring Boot để xử lý báo cáo, thống kê hoặc lọc danh sách sản phẩm theo giỏ hàng:

### Ma trận So sánh: Vòng lặp For truyền thống vs Stream Pipeline

| Tiêu chí | Dùng For-loop / Biến trung gian | Dùng Stream Pipeline (Java 21) |
|---|---|---|
| **Phong cách viết code** | Mệnh lệnh (Imperative): Phải chỉ định rõ *làm thế nào*, chỉ số \`i\`, biến cờ | Khai báo (Declarative): Tập trung vào *muốn kết quả gì*, code trong sáng ngắn gọn |
| **Phân loại nhóm (Grouping)** | Phải tạo \`Map<Key, List>\`, viết logic \`if (!map.containsKey) map.put\` | Dùng \`Collectors.groupingBy()\` gói gọn trong đúng 1 dòng lệnh |
| **Khả năng tái sử dụng** | Logic kiểm tra bị dính chặt vào thân vòng lặp | Tách rời các Predicate và Function thành các hàm tiện ích tái sử dụng toàn hệ thống |
| **Tối ưu hóa ngầm** | Thực thi tuần tự từng phần tử dù có thể kết thúc sớm | Trình tối ưu hóa JVM có thể chập các toán tử (\`fusion\`) và dừng ngay khi thỏa mãn (\`short-circuit\`) |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là phương thức trong \`OrderAnalyticsService\` thống kê tổng doanh thu theo từng phương thức thanh toán:

\`\`\`java
package vn.mastery.ecommerce.service;

import org.springframework.stereotype.Service;
import vn.mastery.ecommerce.domain.Order;
import vn.mastery.ecommerce.domain.OrderStatus;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderAnalyticsService {

    public Map<String, BigDecimal> calculateRevenueByPaymentMethod(List<Order> orders) {
        return orders.stream()
            // 1. Chỉ lấy những đơn hàng đã thanh toán thành công
            .filter(order -> order.status() == OrderStatus.PAID)
            // 2. Nhóm theo tên phương thức thanh toán và cộng dồn tổng tiền
            .collect(Collectors.groupingBy(
                Order::paymentMethod,
                Collectors.reducing(BigDecimal.ZERO, Order::totalAmount, BigDecimal::add)
            ));
    }
}
\`\`\`

### Bảng Giải Mã Từng Dòng Code Trong Stream Pipeline:

| Dòng code | Cú pháp / Toán tử | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động |
|---|---|---|---|
| \`orders.stream()\` | Source Operation | Khởi tạo luồng tuần tự từ danh sách \`List<Order>\` | Tạo ra Stream pipeline ban đầu, chưa thực thi tính toán nào (Lazy) |
| \`.filter(order -> ... == PAID)\` | Intermediate Operation | Bộ lọc điều kiện dựa trên Predicate | Chỉ cho phép các đơn hàng có trạng thái \`PAID\` đi tiếp qua băng tải |
| \`.collect(Collectors.groupingBy(...))\` | Terminal Operation | Kích hoạt toàn bộ luồng và thu thập kết quả vào Map | Duyệt qua các đơn hàng thỏa mãn, phân loại theo Key là \`paymentMethod\` |
| \`Collectors.reducing(...)\` | Downstream Collector | Thực hiện phép cộng dồn (\`BigDecimal::add\`) trên từng nhóm | Tính tổng doanh thu cho từng loại thẻ/ví mà không gây lỗi tràn số hay null |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Cạm bẫy "Tái sử dụng Stream đã đóng" (\`IllegalStateException: stream has already been operated upon or closed\`)**:
   - **Nguyên nhân**: Stream trong Java chỉ được tiêu thụ đúng 1 lần duy nhất. Nếu bạn gọi Terminal Operation lần 2 trên cùng một biến stream, ứng dụng sẽ crash.
   - **Khắc phục**: Luôn tạo stream mới từ Collection nguồn mỗi khi cần xử lý.

2. **Cạm bẫy gọi truy vấn Database bên trong Stream \`map()\` (N+1 Query thảm họa)**:
   - **Hiện tượng**: \`orders.stream().map(o -> userRepo.findById(o.getUserId())).collect(...)\`.
   - **Hậu quả**: Nếu danh sách có 1,000 đơn hàng, Spring sẽ phát sinh thêm 1,000 câu query vào DB!
   - **Khắc phục**: Thu thập toàn bộ ID trước (\`setOfUserIds\`), sau đó truy vấn 1 câu duy nhất \`findAllByIdIn\`.
`;
}

// Refactor Lesson 0-2-3
const l023 = m0.lessons.find(l => l.id === "0-2-3");
if (l023) {
  l023.title = "Bài 0.2.3: Cạm bẫy ParallelStream làm kiệt CommonPool & Bẫy NullPointerException trong Stream";
  l023.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã nguyên lý ngầm của \`parallelStream()\` và hiểm họa dùng chung \`ForkJoinPool.commonPool()\`.
- Hiểu tại sao dùng \`parallelStream()\` trong Spring Boot Web Service có thể làm sập toàn bộ ứng dụng khi gọi IO/Database.
- Nhận diện và loại bỏ hoàn toàn nguy cơ \`NullPointerException\` khi xử lý pipeline bằng \`Optional\` và \`Objects::nonNull\`.
- Đọc hiểu bảng phân tích triệu chứng tắc nghẽn thread pool trong hệ thống E-Commerce quy mô lớn.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: HIỂM HỌA PARALLEL STREAM TRONG WEB APP
**Hình tượng "Cả công ty dùng chung một chiếc xe chở hàng":**
- \`ForkJoinPool.commonPool()\` giống như chiếc xe tải duy nhất của công ty.
- Số lượng tài xế lái xe tải bị giới hạn cứng bằng số nhân CPU của máy chủ (ví dụ máy có 4 CPU thì chỉ có 4 luồng).
- Giờ đây, một lập trình viên viết code: \`orders.parallelStream().forEach(order -> callExternalPaymentApi(order))\`.
- Mỗi lần gọi API thanh toán bên thứ ba mất tới **3 giây**.
- => **Hậu quả**: 4 luồng trên chiếc xe tải bị giữ chặt trong 3 giây để chờ mạng. Toàn bộ các dịch vụ khác của Spring Boot trong cùng JVM cần dùng CommonPool đều bị **đóng băng (Deadlock / Thread Starvation)**! Hàng trăm người dùng khác không thể đăng nhập hay mua hàng!
:::

---

## 1. Cái này là gì? (Bản chất ForkJoinPool.commonPool trong JVM)

Khi gọi \`.parallelStream()\`, JVM tự động chia nhỏ mảng dữ liệu (dùng Spliterator) và phân phối các phần việc vào cụm luồng dùng chung toàn hệ thống gọi là **ForkJoinPool.commonPool()**. Số lượng Worker Thread mặc định bằng \`Runtime.getRuntime().availableProcessors() - 1\`.

### Sơ Đồ Cơ Chế Tắc Nghẽn Cụm Luồng ForkJoinPool Chung:

\`\`\`mermaid
sequenceDiagram
    participant Web as HTTP Request Worker
    participant Pool as ForkJoinPool.commonPool() (4 Threads)
    participant Ext as Cổng Thanh Toán VNPay (Mạng chậm 3s)
    
    Web->>Pool: parallelStream() xử lý 100 đơn hàng
    Pool->>Ext: Thread 1 gọi HTTP Request (Block 3s)
    Pool->>Ext: Thread 2 gọi HTTP Request (Block 3s)
    Pool->>Ext: Thread 3 gọi HTTP Request (Block 3s)
    Pool->>Ext: Thread 4 gọi HTTP Request (Block 3s)
    Note over Pool: TOÀN BỘ CỤM COMMONPOOL BỊ NGHẼN 100%!
    Note right of Pool: Mọi tác vụ ngầm khác trong Spring Boot bị treo hoàn toàn!
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Quy tắc quyết định Senior)

### Ma trận Đánh giá: Khi nào ĐƯỢC và KHÔNG ĐƯỢC dùng \`parallelStream()\`

| Tình huống nghiệp vụ | Được dùng \`parallelStream()\`? | Lý do kỹ thuật |
|---|:---:|---|
| **Tính toán CPU-bound thuần túy** (Mã hóa, thuật toán nén, ma trận số liệu lớn trong RAM) | ✅ **NÊN DÙNG** | Tận dụng tối đa 100% các lõi CPU mà không bị block I/O |
| **Gọi I/O (Database Query, REST API bên ngoài, Đọc file)** | ❌ **CẤM TUYỆT ĐỐI** | Gây nghẽn ForkJoinPool chung, làm sập toàn bộ ứng dụng web |
| **Danh sách nhỏ dưới 10,000 phần tử** | ❌ **KHÔNG NÊN** | Chi phí chia tách luồng và gộp kết quả (Fork/Join Overhead) còn chậm hơn chạy tuần tự |
| **Có thao tác ghi vào biến dùng chung (Shared Mutable State)** | ❌ **CẤM TUYỆT ĐỐI** | Gây lỗi Race Condition và sai lệch số liệu thanh toán nghiêm trọng |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là cách lọc danh sách an toàn tuyệt đối, loại bỏ NullPointerException và xử lý đồng thời đúng chuẩn:

\`\`\`java
package vn.mastery.ecommerce.service;

import org.springframework.stereotype.Service;
import vn.mastery.ecommerce.dto.OrderItemDto;
import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class OrderSanitizerService {

    // Xử lý tuần tự, an toàn 100% với Null
    public List<OrderItemDto> sanitizeAndFilterItems(List<OrderItemDto> rawItems) {
        return Optional.ofNullable(rawItems)
            .orElseGet(List::of)
            .stream()
            // 1. Loại bỏ hoàn toàn các phần tử null
            .filter(Objects::nonNull)
            // 2. Loại bỏ các sản phẩm có giá trị tiền không hợp lệ
            .filter(item -> item.unitPrice() != null && item.unitPrice().compareTo(BigDecimal.ZERO) > 0)
            .toList();
    }
}
\`\`\`

### Bảng Giải Mã Các Biện Pháp Phòng Vệ (Defensive Programming):

| Đoạn code phòng vệ | Ý nghĩa kỹ thuật | Rủi ro ngăn chặn được |
|---|---|---|
| \`Optional.ofNullable(rawItems).orElseGet(List::of)\` | Bọc danh sách đầu vào, nếu null thì trả về danh sách rỗng bất biến | Ngăn chặn lỗi \`NullPointerException\` khi client truyền JSON không có mảng items |
| \`.filter(Objects::nonNull)\` | Bộ lọc loại bỏ bất kỳ phần tử nào bên trong danh sách có giá trị null | Tránh lỗi khi truy cập getter của phần tử con bị null |
| \`item.unitPrice() != null\` | Kiểm tra trường con trước khi thực hiện phép so sánh \`compareTo\` | Ngăn chặn việc gọi phương thức trên đối tượng BigDecimal null |
| \`.toList()\` | Thu thập kết quả vào Unmodifiable List (Java 16+) | Hiệu năng nhanh hơn \`Collectors.toList()\` và đảm bảo bất biến |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Cạm bẫy dùng \`parallelStream()\` để cập nhật danh sách chia sẻ**:
   - Sai lầm: \`List<Order> list = new ArrayList<>(); orders.parallelStream().forEach(list::add);\`.
   - Vì \`ArrayList\` không phải là cấu trúc Thread-Safe, kết quả cuối cùng sẽ bị mất dữ liệu hoặc ném ra \`ArrayIndexOutOfBoundsException\`.
   - Đúng: Dùng \`.toList()\` hoặc \`.collect(Collectors.toList())\` để Spring gom luồng an toàn.

2. **Cách chạy đồng thời IO an toàn trong Spring Boot**:
   - Khi cần gọi đồng thời nhiều API bên ngoài, **không dùng parallelStream**. Hãy sử dụng **Spring \`@Async\` với ThreadPoolTaskExecutor riêng biệt** hoặc Java 21 **Virtual Threads (\`Executors.newVirtualThreadPerTaskExecutor()\`)**.
`;
}

// Refactor Lesson 0-2-4
const l024 = m0.lessons.find(l => l.id === "0-2-4");
if (l024) {
  l024.title = "Bài 0.2.4: Tổng Kết Thực Chiến: Lựa Chọn Stream API, For-Loop Hay Async Trong Service Spring Boot";
  l024.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 0.2 thành Bảng ma trận quyết định chọn công cụ xử lý dữ liệu chuẩn Senior.
- Biết chính xác khi nào nên dùng Stream API, khi nào nên giữ lại vòng lặp For truyền thống, và khi nào dùng Async/Virtual Threads.
- Nắm vững 5 nguyên tắc vàng khi viết code xử lý dữ liệu trong Spring Boot Service.
- Tự giải quyết bài toán thực tế: Tổng hợp báo cáo tồn kho & doanh số giỏ hàng E-Commerce.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CHỌN PHƯƠNG TIỆN CHO ĐÚNG ĐOẠN ĐƯỜNG
- Đi bộ 100 mét ra đầu ngõ mua gói xôi: Hãy đi bộ (**Vòng lặp For đơn giản**). Bạn không cần phải dắt siêu xe ra nổ máy làm gì cho cồng kềnh.
- Vận chuyển 1,000 kiện hàng trên băng chuyền tự động: Hãy dùng băng tải (**Stream API**). Rất sạch sẽ, tuần tự, ít tốn sức.
- Chở hàng hóa đi 10 tỉnh thành khác nhau cùng một lúc: Hãy thuê 10 chiếc xe tải riêng (**Async / Virtual Threads**). Đừng bao giờ bắt 1 chiếc xe phải gánh tất cả!
:::

---

## 1. Cái này là gì? (Bản Đồ Quyết Định Xử Lý Dữ Liệu)

### Sơ Đồ Luồng Quyết Định: Lựa Chọn Phương Pháp Duyệt Dữ Liệu

\`\`\`mermaid
flowchart TD
    A["Cần xử lý danh sách dữ liệu trong Service"] --> B{"Trong logic có gọi I/O<br/>(Query DB / Gọi REST API)?"}
    B -->|"CÓ"| C["Dùng Vòng lặp For tuần tự<br/>hoặc Virtual Threads / CompletableFuture riêng"]
    B -->|"KHÔNG (Xử lý dữ liệu thuần trong RAM)"| D{"Số lượng phần tử dữ liệu?"}
    D -->|"Dưới 100 phần tử & logic đơn giản"| E["Dùng For-loop truyền thống<br/>(Đơn giản, debug dễ nhất)"]
    D -->|"Dữ liệu trung bình & cần biến đổi phức tạp"| F["DÙNG STREAM API TUẦN TỰ<br/>(.filter, .map, .collect)"]
    D -->|"Hàng triệu phần tử CPU-Heavy"| G["Xem xét ParallelStream<br/>(Cân nhắc kỹ tài nguyên CPU)"]
    style F fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style C fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style E fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Ma trận So sánh Toàn Diện)

### Ma Trận Quyết Định Kỹ Thuật (Senior Decision Matrix)

| Tiêu chí so sánh | Vòng lặp For truyền thống | Stream API tuần tự | Virtual Threads / CompletableFuture |
|---|---|---|---|
| **Độ phức tạp cú pháp** | Đơn giản, ai cũng hiểu ngay | Ngắn gọn, phong cách khai báo hiện đại | Cần quản lý cấu hình ThreadPool / Context |
| **Khả năng Debug (Đặt Breakpoint)** | ⭐ Rất dễ, soi giá trị biến từng vòng lặp | Hơi khó soi biến trung gian (cần dùng \`.peek()\`) | Phức tạp hơn vì chạy trên nhiều luồng khác nhau |
| **Xử lý ngoại lệ (Checked Exception)** | Rất tự nhiên với khối \`try-catch\` | Bị cồng kềnh vì Lambda không cho ném checked exception | Cần xử lý qua \`.exceptionally()\` hoặc try-with-resources |
| **Hiệu năng với tập dữ liệu nhỏ** | ⭐ Nhanh nhất (Không tốn overhead tạo object) | Chậm hơn vài nano-giây (không đáng kể trong ứng dụng web) | Chi phí khởi tạo luồng lớn hơn tính toán |
| **Thực thi gọi I/O mạng song song** | ❌ Chạy tuần tự rất chậm | ❌ Cấm dùng (Gây nghẽn ForkJoinPool) | ⭐ **Tối ưu nhất cho hệ thống phân tán** |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (Production Sample)

Dưới đây là phương thức tổng hợp đơn hàng chuẩn mực của kỹ sư Senior:

\`\`\`java
package vn.mastery.ecommerce.service;

import org.springframework.stereotype.Service;
import vn.mastery.ecommerce.domain.Order;
import vn.mastery.ecommerce.dto.OrderSummaryReport;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderReportService {

    public OrderSummaryReport generateDailyReport(List<Order> orders) {
        if (orders == null || orders.isEmpty()) {
            return OrderSummaryReport.empty();
        }

        // 1. Dùng Stream để phân loại và tổng hợp
        Map<String, Long> countByStatus = orders.stream()
            .collect(Collectors.groupingBy(o -> o.status().name(), Collectors.counting()));

        BigDecimal totalRevenue = orders.stream()
            .filter(Order::isPaid)
            .map(Order::totalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new OrderSummaryReport(orders.size(), totalRevenue, countByStatus);
    }
}
\`\`\`

### Bảng Phân Tích Kỹ Thuật Từng Bước:

| Bước xử lý | Kỹ thuật sử dụng | Ý nghĩa nghiệp vụ |
|---|---|---|
| \`if (orders == null \|\| orders.isEmpty())\` | Early Return Guard Clause | Trả về báo cáo rỗng ngay lập tức, tránh tiêu tốn CPU khởi tạo Stream |
| \`Collectors.groupingBy(..., Collectors.counting())\` | Downstream Aggregation | Đếm chính xác số lượng đơn hàng theo từng trạng thái (PENDING, PAID, CANCELLED) |
| \`.filter(Order::isPaid).map(...).reduce(...)\` | Functional Map-Reduce | Tính tổng doanh thu thực thu từ những đơn hàng đã thanh toán thành công |
| \`new OrderSummaryReport(...)\` | Immutable Record Return | Đóng gói báo cáo vào một đối tượng bất biến trả về cho Controller |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **5 Nguyên tắc vàng khi viết code xử lý dữ liệu**:
   - **Nguyên tắc 1**: Không bao giờ gọi Database Repository hoặc HTTP Client bên trong thân hàm Stream.
   - **Nguyên tắc 2**: Ưu tiên tính dễ đọc và bảo trì. Nếu một biểu thức Stream dài quá 5 tầng lồng nhau, hãy cân nhắc tách hàm hoặc dùng vòng lặp For thông thường.
   - **Nguyên tắc 3**: Luôn kiểm tra null an toàn trước khi mở stream (\`Optional.ofNullable\` hoặc \`Objects::nonNull\`).
   - **Nguyên tắc 4**: Dùng \`.toList()\` của Java 16+ thay vì \`.collect(Collectors.toList())\` khi muốn nhận về danh sách bất biến.
   - **Nguyên tắc 5**: Tránh dùng \`parallelStream()\` trong các service phục vụ HTTP Request của Spring Boot.
`;
}

fs.writeFileSync(modulePath, "window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n" + JSON.stringify(m0, null, 2) + "\n);\n", "utf8");
console.log("Successfully refactored Module 0 Topic 0.2 (Lessons 0-2-1 to 0-2-4)!");
