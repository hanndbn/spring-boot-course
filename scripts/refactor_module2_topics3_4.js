const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module2.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m2 = window.COURSE_MODULES[0];

// Refactor Lesson 2-3-1
const l231 = m2.lessons.find(l => l.id === "2-3-1");
if (l231) {
  l231.title = "Bài 2.3.1: Kiến trúc DTO Mapping, Bản chất MapStruct Compile-Time vs Reflection";
  l231.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu vì sao thư viện MapStruct sinh mã nguồn tại thời điểm biên dịch (Compile-time) nhanh gấp 50 lần so với ModelMapper / BeanUtils (Runtime Reflection).
- Nắm chắc cơ chế Annotation Processing: MapStruct tự sinh file \`*Impl.java\` bằng code Java thuần túy.
- Cấu hình MapStruct tích hợp hoàn hảo với Spring Boot Dependency Injection (\`componentModel = "spring"\`).
- Đọc hiểu từng dòng code của MapStruct Mapper qua Bảng phân tích chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TAY ĐUA F1 VS ÔNG LÃO DÒ ĐƯỜNG
- **Thư viện cũ (ModelMapper, BeanUtils dùng Reflection)**: Giống như **Ông lão vừa đi vừa dò đường**: Mỗi khi có 1 request chuyển đổi đơn hàng, ông lão lại phải mở gương lúp soi từng thuộc tính, dùng Reflection kiểm tra kiểu dữ liệu, tốn cực nhiều CPU và sinh rác trong bộ nhớ Heap.
- **MapStruct (Compile-time Generation)**: Giống như **Tay đua F1 chạy trên đường ray chuyên dụng**: Ngay lúc bạn bấm nút \`mvn compile\`, MapStruct đã sinh ra code viết tay: \`orderDto.setTotal(order.getTotal())\` cực kỳ tối ưu. Khi chạy thực tế, nó chạy với tốc độ tối đa của CPU mà không tốn 1 nano giây Reflection nào!
:::

---

## 1. Cái này là gì? (Kiến trúc Annotation Processor Của MapStruct)

MapStruct là một Java Annotation Processor cắm trực tiếp vào trình biên dịch \`javac\`. Khi bạn định nghĩa một Interface có gắn \`@Mapper\`, MapStruct sẽ tự động sinh mã nguồn Java thuần túy ở thư mục \`target/generated-sources\`.

### Sơ Đồ Kiến Trúc: Quy Trình Sinh Mã AOT Của MapStruct

\`\`\`mermaid
flowchart LR
    Dev["Developer viết Interface:<br/>OrderMapper.java (@Mapper)"] --> Javac["Trình biên dịch javac<br/>(Maven compile)"]
    Javac --> Processor["MapStruct Annotation Processor"]
    Processor --> GenCode["Tự động sinh class:<br/>OrderMapperImpl.java (Code thuần túy)"]
    GenCode --> Bytecode["target/classes/OrderMapperImpl.class"]
    Bytecode --> Container["Spring nạp Bean vào Container (@Component)"]

    style Dev fill:#1e3a8a,stroke:#3b82f6,color:#fff
    style Processor fill:#064e3b,stroke:#10b981,color:#fff
    style GenCode fill:#78350f,stroke:#f59e0b,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### Ma trận So sánh: MapStruct vs ModelMapper vs Code Viết Tay

| Tiêu chí kỹ thuật | MapStruct (Khuyên dùng 100%) | ModelMapper (Legacy) | Code Viết Tay (Manual Getter/Setter) |
|---|---|---|---|
| **Tốc độ thực thi** | ⭐ Tối đa (Ngang ngửa code viết tay) | Chậm hơn 30 - 50 lần | Tối đa |
| **Phát hiện lỗi (Fail-Fast)** | ⭐ Báo lỗi ngay lúc \`mvn compile\` nếu sai tên trường | Chỉ ném lỗi lúc ứng dụng đang chạy (Runtime NPE) | Báo lỗi ngay lúc compile |
| **Tốn công gõ code** | Cực ít (Chỉ khai báo 1 interface) | Ít | Rất nhiều (Viết hàng trăm dòng getter/setter) |
| **Hỗ trợ Java Record** | ⭐ Hỗ trợ trọn vẹn Java 17/21 Record | Hỗ trợ kém | Hỗ trợ tốt |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là một MapStruct Mapper hoàn chỉnh chuyển đổi giữa \`Order\` Entity và \`OrderResponse\` Record:

\`\`\`java
package vn.mastery.ecommerce.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.mastery.ecommerce.domain.Order;
import vn.mastery.ecommerce.dto.OrderResponse;
import java.util.List;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    @Mapping(target = "orderId", source = "id")
    @Mapping(target = "customerName", source = "customer.fullName")
    @Mapping(target = "statusText", expression = "java(order.getStatus().name())")
    OrderResponse toResponse(Order order);

    List<OrderResponse> toResponseList(List<Order> orders);
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Tác động biên dịch MapStruct |
|---|---|---|---|
| Dòng 9 | \`@Mapper(componentModel = "spring")\` | Đánh dấu interface Mapper và tích hợp Spring DI | MapStruct sinh class \`OrderMapperImpl\` có gắn \`@Component\` để Controller/Service inject |
| Dòng 12 | \`@Mapping(target = "orderId", source = "id")\` | Ánh xạ các trường khác tên | MapStruct tự sinh: \`orderResponse.orderId = order.getId()\` |
| Dòng 13 | \`@Mapping(target = "customerName", source = "customer.fullName")\` | Điều hướng thuộc tính lồng nhau (Dot navigation) | Tự động kiểm tra an toàn \`if (order.getCustomer() != null)\` chống NullPointerException |
| Dòng 17 | \`List<OrderResponse> toResponseList(...)\` | Tự động sinh vòng lặp map danh sách | MapStruct tự sinh vòng \`for\` lặp qua từng phần tử và gọi hàm \`toResponse()\` |

---

## 4. Key Takeaways & Cạm bẫy sống còn (Senior Architect Summary)

1. **Luôn bật \`componentModel = "spring"\`**: Giúp bạn inject Mapper vào Service như bất kỳ Spring Bean nào khác.
2. **Không dùng ModelMapper trong hệ thống chịu tải cao**: ModelMapper tiêu tốn rất nhiều CPU và bộ nhớ do phải dùng Reflection để quét class mapping trong mỗi request.
`;
}

// Refactor Lesson 2-3-2
const l232 = m2.lessons.find(l => l.id === "2-3-2");
if (l232) {
  l232.title = "Bài 2.3.2: Triển khai MapStruct Nâng Cao: Nested Mapping, Custom Qualifier & Collection";
  l232.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Làm chủ kỹ thuật ánh xạ đối tượng lồng nhau phức tạp (Order -> OrderItem -> Product).
- Tự viết Custom Mapping Methods với \`@Named\` và \`@Qualifier\` để định dạng tiền tệ hoặc mã hóa dữ liệu.
- Xử lý mảng và tập hợp Collection (\`List\`, \`Set\`) mà không gây rò rỉ quan hệ Hibernate Lazy.
- Đọc hiểu toàn bộ mã nguồn Mapper nâng cao qua Bảng phân tích chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: PHIÊN DỊCH VIÊN ĐA NGÔN NGỮ
Trong hệ thống E-Commerce:
- Database lưu tiền dưới dạng số nguyên nhỏ nhất (\`Long 250000\` cents / đồng).
- Nhưng giao diện hiển thị cho khách hàng phải là chuỗi đẹp mắt (\`"250.000 VNĐ"\`).
- MapStruct giống như **Người phiên dịch viên tài năng**: Không chỉ dịch từ tiếng Anh sang tiếng Việt, mà còn tự biết đổi đơn vị tiền tệ, ghép họ và tên, và đóng gói hộp quà theo đúng quy cách của từng khách hàng!
:::

---

## 1. Cái này là gì? (Custom Qualifier Mapping Trong MapStruct)

Khi một kiểu dữ liệu cần quy tắc chuyển đổi đặc thù (ví dụ: chuyển \`BigDecimal\` thành chuỗi tiền tệ có dấu phẩy hoặc format ngày tháng \`Instant\` sang \`dd/MM/yyyy\`), ta dùng \`@Named\` để chỉ định phương thức format riêng.

### Sơ Đồ Kiến Trúc: Luồng Chuyển Đổi Dữ Liệu Qua Custom Qualifier

\`\`\`mermaid
flowchart LR
    Entity["Order Entity<br/>amount: 5000000<br/>createdAt: 2026-10-04T08:00:00Z"] --> Mapper["OrderMapper.toResponse()"]
    Mapper --> Q1["@Named('formatCurrency')<br/>CurrencyFormatter::format()"]
    Mapper --> Q2["@Named('formatDate')<br/>DateFormatter::toVietnamDate()"]
    Q1 --> DTO["OrderResponse DTO<br/>formattedAmount: '5.000.000 đ'<br/>displayDate: '04/10/2026'"]
    Q2 --> DTO

    style Entity fill:#78350f,stroke:#f59e0b,color:#fff
    style Mapper fill:#1e3a8a,stroke:#3b82f6,color:#fff
    style DTO fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### Mã Nguồn Hoàn Chỉnh: Advanced E-Commerce Order Mapper

\`\`\`java
package vn.mastery.ecommerce.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import vn.mastery.ecommerce.domain.Order;
import vn.mastery.ecommerce.domain.OrderItem;
import vn.mastery.ecommerce.dto.OrderItemResponse;
import vn.mastery.ecommerce.dto.OrderResponse;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

@Mapper(componentModel = "spring")
public interface AdvancedOrderMapper {

    @Mapping(target = "orderId", source = "id")
    @Mapping(target = "formattedTotal", source = "totalAmount", qualifiedByName = "formatVnd")
    @Mapping(target = "items", source = "orderItems")
    OrderResponse toOrderResponse(Order order);

    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "itemTotal", expression = "java(item.getUnitPrice().multiply(new java.math.BigDecimal(item.getQuantity())))")
    OrderItemResponse toItemResponse(OrderItem item);

    @Named("formatVnd")
    default String formatVnd(BigDecimal amount) {
        if (amount == null) return "0 đ";
        NumberFormat nf = NumberFormat.getInstance(new Locale("vi", "VN"));
        return nf.format(amount) + " đ";
    }
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Tác động sinh mã MapStruct |
|---|---|---|---|
| Dòng 18 | \`qualifiedByName = "formatVnd"\` | Chỉ định phương thức chuyển đổi riêng | MapStruct gọi method \`formatVnd()\` để gán vào trường \`formattedTotal\` |
| Dòng 19 | \`@Mapping(target = "items", source = "orderItems")\` | Tự động ánh xạ danh sách con | Tự tìm và gọi \`toItemResponse()\` cho từng phần tử trong danh sách |
| Dòng 23 | \`expression = "java(...)"\` | Nhúng biểu thức tính toán trực tiếp | Tự tính tiền: \`unitPrice * quantity\` ngay trong lúc mapping |
| Dòng 26 | \`@Named("formatVnd") default String ...\` | Định nghĩa hàm format tùy biến | Viết logic Java tùy biến trực tiếp trong interface |

---

## 3. Key Takeaways & Cạm bẫy sống còn (Senior Architect Summary)

1. **Cạm bẫy kích hoạt Lazy Load ngầm**: Khi map thuộc tính lồng nhau (\`source = "customer.fullName"\`), nếu quan hệ \`customer\` được cấu hình là \`FetchType.LAZY\` và session database đã đóng, Hibernate sẽ ném ngay lỗi kinh điển \`LazyInitializationException\`!
2. **Quy tắc**: Luôn sử dụng \`JOIN FETCH\` trong Repository trước khi đưa Entity vào Mapper.
`;
}

// Refactor Lesson 2-3-3
const l233 = m2.lessons.find(l => l.id === "2-3-3");
if (l233) {
  l233.title = "Bài 2.3.3: Cạm bẫy Circular Reference trong DTO Mapping & Kích Hoạt N+1 Ngầm";
  l233.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã lỗi tràn bộ nhớ \`StackOverflowError\` khi Mapper cố chuyển đổi quan hệ 2 chiều giữa Cha và Con.
- Nhận diện hiểm họa kích hoạt hàng trăm câu query N+1 ngầm khi MapStruct lặp qua các collection lười (Lazy Collection).
- Làm chủ kỹ thuật cắt đứt quan hệ vòng tròn bằng DTO phẳng và cấu hình \`@Context CycleAvoidingMappingContext\`.
- Đọc hiểu toàn bộ mã nguồn xử lý triệt để cạm bẫy qua Bảng phân tích chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẤM GƯƠNG ĐỐI CHIẾU VÔ TẬN
- Entity Đơn hàng (\`Order\`) chứa Danh sách món (\`OrderItem\`).
- Mỗi Món (\`OrderItem\`) lại chứa Đơn hàng (\`Order\`).
- Giống như bạn đặt **2 chiếc gương soi đối diện nhau**: Hình ảnh phản chiếu qua lại đến vô tận! Trình biên dịch và máy ảo JVM bị kẹt trong vòng lặp chuyển đổi cho đến khi cạn sạch bộ nhớ RAM!
:::

---

## 1. Cái này là gì? (Bản chất lỗi Circular Reference trong Mapping)

### Sơ Đồ Vòng Lặp Vô Tận & Cơ Chế Khắc Phục Bằng DTO Phẳng

\`\`\`mermaid
flowchart TD
    subgraph Bug ["CẠM BẪY SẢN XUẤT: Vòng Lặp Hai Chiều"]
        Order["Order Entity"] -->|has many| Item["OrderItem Entity"]
        Item -->|belongs to| Order
        Order -.-> Crash["StackOverflowError lúc serialize hoặc mapping!"]
    end

    subgraph Fixed ["GIẢI PHÁP SENIOR: DTO Phẳng Một Chiều"]
        OrderDto["OrderResponse DTO"] --> ItemDto["OrderItemResponse DTO (Chỉ chứa ID cha, không chứa cả Object cha)"]
    end

    style Bug fill:#7c2d12,stroke:#f97316,color:#fff
    style Fixed fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### Mã Nguồn DTO Phẳng Chuẩn Ngắt Vòng Lặp:

\`\`\`java
package vn.mastery.ecommerce.dto;

import java.math.BigDecimal;
import java.util.List;

public record OrderFlatResponse(
    Long orderId,
    String customerEmail,
    BigDecimal totalAmount,
    List<OrderItemFlatDto> items // Danh sách con
) {}

// Con CHỈ LƯU orderId, tuyệt đối KHÔNG chứa cả OrderFlatResponse cha
public record OrderItemFlatDto(
    Long itemId,
    Long orderId, // Chỉ là số ID phẳng, không tạo vòng lặp tham chiếu
    String productName,
    int quantity,
    BigDecimal price
) {}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Khai báo | Ý nghĩa kỹ thuật | Tác dụng phòng ngừa lỗi |
|---|---|---|---|
| Dòng 6 | \`public record OrderFlatResponse(...)\` | DTO cha đại diện cho đơn hàng | Đóng gói thông tin đơn hàng và danh sách món |
| Dòng 14 | \`Long orderId\` trong \`OrderItemFlatDto\` | Thay thế tham chiếu Object bằng ID nguyên thủy | Cắt đứt hoàn toàn quan hệ hai chiều, loại bỏ 100% lỗi lặp vô tận |

---

## 3. Key Takeaways & Cạm bẫy sống còn (Senior Architect Summary)

1. **DTO luôn luôn là cấu hình cây một chiều (Unidirectional Tree)**: Không bao giờ thiết kế DTO con trỏ ngược lại DTO cha.
2. **Cảnh giác với N+1 query**: Nếu danh sách \`items\` là Lazy, việc gọi \`orderMapper.toResponse(order)\` ngoài phạm vi Transaction sẽ ném lỗi \`LazyInitializationException\`. Luôn nạp dữ liệu bằng \`JOIN FETCH\` trong Repository trước khi gọi Mapper!
`;
}

// Refactor Lesson 2-3-4
const l234 = m2.lessons.find(l => l.id === "2-3-4");
if (l234) {
  l234.title = "Bài 2.3.4: Milestone Synthesis: Bản đồ DTO Mapping & Ma trận Lựa chọn Công nghệ Chuyển đổi";
  l234.content = `
:::target 🎯 MỤC TIÊU BÀI TỔNG HỢP MILESTONE (10 PHÚT)
- Tổng hợp toàn diện chiến lược chuyển đổi dữ liệu phân tầng giữa Web DTO và Database Entity.
- Nắm vững Ma trận Quyết định Công nghệ: Khi nào dùng MapStruct, khi nào dùng Spring Data DTO Projection.
- Đọc hiểu toàn bộ mã nguồn Mapper tổng hợp chuẩn Enterprise qua Bảng phân tích chi tiết.
- Nắm chắc 3 quy tắc sống còn khi làm việc với API Contract-First.
:::

---

## 1. Cái này là gì? (Ma trận So sánh Chiến Lược Chuyển Đổi Dữ Liệu)

| Chiến lược | Cơ chế thực thi | Tốc độ | Khả năng kiểm soát | Khi nào nên dùng? |
|---|---|---|---|---|
| **MapStruct** | Sinh mã nguồn Java lúc compile (\`javac\`) | ⭐⭐⭐ Siêu nhanh | Rất cao (Hỗ trợ biểu thức Java, qualifier) | 90% Nghiệp vụ Controller - Service |
| **Spring Data Projections** | Hibernate map thẳng từ SQL vào Interface/Record | ⭐⭐⭐ Siêu nhanh (Không nạp cả Entity) | Trung bình (Chỉ đọc, không logic) | Các màn hình báo cáo, thống kê đọc dữ liệu lớn |
| **Code viết tay thủ công** | Lập trình viên tự viết từng dòng getter/setter | ⭐⭐⭐ Siêu nhanh | Tối đa | Khi nghiệp vụ mapping quá dị biệt và phức tạp |
| **ModelMapper / BeanUtils** | Quét Reflection lúc runtime | ❌ Rất chậm (Nghẽn CPU) | Thấp (Dễ bug ngầm) | **Tối kỵ trong dự án lớn** |

---

## 2. Key Takeaways & Nguyên Tắc Sống Còn

1. **MapStruct là tiêu chuẩn công nghiệp**: Mọi dự án Spring Boot hiện đại đều sử dụng MapStruct vì tốc độ và độ an toàn tại thời điểm biên dịch.
2. **Tách biệt rõ ranh giới**: DTO phục vụ Client Web/Mobile; Entity phục vụ Database. Trộn lẫn hai khái niệm này là nguyên nhân số 1 dẫn tới các cuộc tấn công Mass Assignment và lỗi sập server do vòng lặp dữ liệu.
`;
}

// Refactor Lesson 2-4-1
const l241 = m2.lessons.find(l => l.id === "2-4-1");
if (l241) {
  l241.title = "Bài 2.4.1: Kiến trúc Phân Trang Quy Mô Lớn: OFFSET Pagination vs Keyset (Cursor-Based)";
  l241.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu rõ "cái bẫy tử thần" của phân trang truyền thống \`OFFSET ... LIMIT\`: Tại sao trang số 10.000 làm đơ database cả phút.
- Nắm chắc nguyên lý phân trang theo con trỏ (**Keyset / Cursor-Based Pagination**) dựa trên chỉ mục B-Tree Index.
- So sánh thời gian truy vấn giữa OFFSET và Keyset trên bảng 10 triệu bản ghi đơn hàng E-Commerce.
- Đọc hiểu từng dòng code câu lệnh truy vấn phân trang qua Bảng phân tích chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: ĐẾM TRANG SÁCH (OFFSET) VS ĐÁNH DẤU TRANG (KEYSET)
Hãy tưởng tượng cuốn danh bạ điện thoại dày 10 triệu trang:
- **Phân trang kiểu cũ (\`OFFSET 1000000 LIMIT 20\`)**: Bạn muốn đọc trang thứ 1.000.000. Bạn phải **ngồi đếm từng trang từ trang 1, trang 2... đến trang 1.000.000 rồi mới đọc 20 dòng tiếp theo**! Rất kiệt sức và vô ích!
- **Phân trang kiểu Senior (\`Keyset / Cursor: WHERE id > :lastSeenId LIMIT 20\`)**: Bạn chỉ cần kẹp một chiếc que đánh dấu trang: *"Lần trước tôi dừng ở đơn hàng mã #89421. Giờ hãy lấy cho tôi 20 đơn hàng tiếp theo có mã > 89421"*. Nhờ có mục lục (Index), Database mở phắt đúng trang đó trong **1 miligiây** mà không cần đếm lại từ đầu!
:::

---

## 1. Cái này là gì? (Bản chất sự suy kiệt hiệu năng của OFFSET)

Khi bạn viết \`SELECT * FROM orders ORDER BY id LIMIT 20 OFFSET 1000000\`, PostgreSQL/MySQL buộc phải:
1. Đọc qua đủ 1.000.020 bản ghi từ đĩa cứng.
2. Vứt bỏ 1.000.000 bản ghi đầu tiên vào sọt rác.
3. Chỉ trả về 20 bản ghi cuối cùng!
=> Càng lùi về các trang sau, độ trễ càng tăng theo cấp số nhân (Full Table Scan), làm cạn kiệt I/O của database máy chủ!

### Sơ Đồ So Sánh: Chi Phí Quét Dữ Liệu Của Database

\`\`\`mermaid
flowchart TD
    subgraph OffsetWay ["OFFSET Pagination (Càng sâu càng chậm)"]
        ScanAll["Quét qua 1.000.000 dòng từ đầu"] --> Drop["Vứt bỏ 1.000.000 dòng"] --> Pick["Lấy 20 dòng -> MẤT 4.500 ms!"]
    end

    subgraph KeysetWay ["Keyset / Cursor Pagination (Tốc độ bất biến O(log N))"]
        BTree["B-Tree Index Lookup: WHERE id > 89421"] --> DirectPick["Nhảy thẳng tới vị trí con trỏ -> Lấy 20 dòng -> MẤT 2 ms!"]
    end

    style OffsetWay fill:#7c2d12,stroke:#f97316,color:#fff
    style KeysetWay fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### Ma trận So sánh: OFFSET Pagination vs Keyset Pagination

| Tiêu chí | OFFSET Pagination (\`Pageable\`) | Keyset / Cursor Pagination |
|---|---|---|
| **Độ trễ trang đầu** | Nhanh (~5ms) | Nhanh (~2ms) |
| **Độ trễ trang cuối (Trang 100.000)** | ❌ **Rất chậm (~5.000ms - Sập DB)** | ⭐ **Bất biến (~2ms)** |
| **Nhảy cóc tới trang bất kỳ** | Hỗ trợ (Bấm nhảy sang trang 50) | ❌ Không hỗ trợ nhảy cóc (Chỉ đi tới/lui) |
| **Bảo toàn dữ liệu khi có đơn mới chèn** | ❌ Bị trùng hoặc sót bản ghi khi có đơn mới tạo | ⭐ Không bao giờ bị trùng lặp dữ liệu |
| **Kịch bản thực tế tối ưu** | Trang quản trị Admin (vài nghìn bản ghi) | Cuộn vô tận (Infinite Scroll) TikTok, Shopee Feed, App Mobile |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Mã nguồn truy vấn Keyset Pagination chuẩn Senior với Spring Data JPA:

\`\`\`java
package vn.mastery.ecommerce.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.mastery.ecommerce.domain.Order;
import java.util.List;

public interface OrderKeysetRepository extends JpaRepository<Order, Long> {

    // Phân trang theo con trỏ id (Keyset Pagination)
    @Query("SELECT o FROM Order o WHERE o.id > :lastSeenId ORDER BY o.id ASC")
    List<Order> findNextOrders(@Param("lastSeenId") Long lastSeenId, Pageable pageable);
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Truy vấn | Ý nghĩa kỹ thuật | Hiệu năng Database |
|---|---|---|---|
| Dòng 13 | \`WHERE o.id > :lastSeenId\` | Sử dụng điều kiện khóa chính B-Tree Index | Tận dụng Index Scan, nhảy trực tiếp đến bản ghi tiếp theo mà không quét lại từ đầu |
| Dòng 13 | \`ORDER BY o.id ASC\` | Sắp xếp theo thứ tự Index tăng dần | Không tốn chi phí sắp xếp (Sort Cost = 0) do dữ liệu đã được index sẵn |
| Dòng 14 | \`Pageable pageable\` | Dùng \`PageRequest.of(0, 20)\` | Chỉ lấy đúng 20 bản ghi đầu tiên sau con trỏ, tuyệt đối không dùng OFFSET |

---

## 4. Key Takeaways & Cạm bẫy sống còn (Senior Architect Summary)

1. **Với bảng dưới 100.000 dòng**: Dùng \`Pageable\` với OFFSET là chấp nhận được vì tính tiện lợi (cho phép hiển thị tổng số trang \`totalPages\`).
2. **Với bảng hàng chục triệu dòng (Orders, Transactions)**: Bắt buộc phải chuyển sang **Keyset / Cursor-Based Pagination** để cứu sống Database khỏi thảm họa quá tải I/O.
`;
}

// Refactor Lesson 2-4-2
const l242 = m2.lessons.find(l => l.id === "2-4-2");
if (l242) {
  l242.title = "Bài 2.4.2: Tối Ưu Upload File Lớn: S3 Presigned URL vs StreamingResponseBody";
  l242.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã nghịch lý upload file qua Backend Server làm sập RAM và nghẽn băng thông Tomcat.
- Hiểu kiến trúc tải file trực tiếp lên Cloud Storage bằng **AWS S3 Presigned URL**.
- Triển khai \`StreamingResponseBody\` để tải file xuất báo cáo Excel/CSV triệu dòng mà không tràn bộ nhớ Heap.
- Đọc hiểu toàn bộ mã nguồn qua Bảng phân tích chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: SHIPPER TRỰC TIẾP VS BƯU ĐIỆN QUÁ TẢI
Bạn muốn chuyển một kiện hàng nặng 500kg (File video/ảnh nặng) đến kho hàng AWS S3:
- **Cách làm cũ ngây thơ (Upload qua Backend)**: Bạn chở kiện hàng 500kg đến quầy giao dịch bưu điện nhỏ (Tomcat Server). Server phải gồng mình ôm kiện hàng 500kg vào bộ nhớ RAM, rồi lại chở tiếp sang kho S3! Kết quả: Bưu điện sập mái vì quá tải (\`OutOfMemoryError\`), nghẽn toàn bộ các cuộc gọi khác!
- **Chuẩn Senior (S3 Presigned URL)**: Bạn chỉ cần gửi một mảnh giấy nhỏ: *"Cho tôi xin giấy thông hành gửi hàng"* (Request URL). Server cấp cho bạn một **Tấm vé thông hành có chữ ký số bí mật** (Presigned URL có hạn 15 phút). Bạn cầm tấm vé đó mang thẳng kiện hàng đến kho S3 gửi trực tiếp! Server hoàn toàn thảnh thơi, không tốn 1 byte RAM nào!
:::

---

## 1. Cái này là gì? (Kiến trúc S3 Presigned URL)

Thay vì để file đi qua Server Spring Boot, Server chỉ đóng vai trò sinh một đường link an toàn (Presigned URL) có kèm chữ ký xác thực HMAC và thời hạn hết hạn ngắn. Client dùng URL đó để upload thẳng file lên S3 qua giao thức HTTP PUT.

### Sơ Đồ Kiến Trúc: Tải File Trực Tiếp Lên Cloud Bằng Presigned URL

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as Mobile / Web Client
    participant Server as Spring Boot API Server
    participant S3 as AWS S3 Storage Bucket

    Client->>Server: 1. POST /api/v1/files/upload-url?filename=invoice.pdf
    Note over Server: Tạo Presigned URL với AWS SDK<br/>Kèm chữ ký bảo mật & hết hạn trong 15 phút
    Server-->>Client: 2. Trả về presignedUrl: "https://my-bucket.s3...&Signature=xyz"
    Client->>S3: 3. HTTP PUT presignedUrl (Upload thẳng file 500MB lên S3!)
    S3-->>Client: 4. HTTP 200 OK (Upload thành công)
    Client->>Server: 5. POST /api/v1/orders/123/attach-file (Lưu URL file vào DB)
    Server-->>Client: 6. Ghi nhận thành công!
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### So sánh: Upload Qua Server vs S3 Presigned URL

| Tiêu chí | Upload qua Server Spring Boot (\`MultipartFile\`) | Upload trực tiếp qua S3 Presigned URL |
|---|---|---|
| **Tiêu tốn RAM Server** | ❌ Cực cao: Càng nhiều người upload đồng thời càng dễ dính \`OutOfMemoryError\` | ⭐ **Bằng 0**: File không hề đi qua máy chủ Spring Boot |
| **Băng thông mạng Server** | ❌ Chịu tải 2 lần (Client -> Server -> S3) | ⭐ **Chịu tải 0 lần**: Client đẩy thẳng sang AWS S3 Network |
| **Giới hạn kích thước file** | Bị giới hạn bởi cấu hình \`max-file-size\` của Tomcat | ⭐ Hỗ trợ file lên tới 5 Terabytes (Multi-part S3) |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Mã nguồn sinh Presigned URL an toàn bằng Spring Boot Service:

\`\`\`java
package vn.mastery.ecommerce.service;

import org.springframework.stereotype.Service;
import java.time.Duration;
import java.util.UUID;

public record PresignedUrlResponse(String fileKey, String uploadUrl, long expiresInSeconds) {}

@Service
public class CloudStorageService {

    public PresignedUrlResponse generateUploadUrl(String originalFilename, String contentType) {
        String fileKey = "orders/" + UUID.randomUUID() + "_" + originalFilename;
        long expireSeconds = 900; // 15 phút

        // Giả lập sinh Presigned URL có chữ ký số của AWS S3
        String mockPresignedUrl = "https://ecommerce-bucket.s3.ap-southeast-1.amazonaws.com/" 
                                + fileKey + "?X-Amz-Signature=VALID_HMAC_SIGNATURE&expires=" + expireSeconds;

        return new PresignedUrlResponse(fileKey, mockPresignedUrl, expireSeconds);
    }
}
\`\`\`

### Xuất báo cáo dữ liệu lớn bằng StreamingResponseBody:
\`\`\`java
@GetMapping("/export-orders")
public ResponseEntity<StreamingResponseBody> exportOrdersCsv() {
    StreamingResponseBody responseBody = outputStream -> {
        try (var writer = new java.io.BufferedWriter(new java.io.OutputStreamWriter(outputStream))) {
            writer.write("id,customer_id,total_amount,status\\n");
            // Stream từng dòng dữ liệu từ DB đẩy thẳng ra Client mà không tích tụ vào RAM
            for (int i = 1; i <= 100000; i++) {
                writer.write(i + ",100" + i + ",250000,COMPLETED\\n");
                if (i % 1000 == 0) writer.flush(); // Xả buffer liên tục
            }
        }
    };

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=orders.csv")
        .contentType(MediaType.TEXT_PLAIN)
        .body(responseBody);
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Tác dụng tối ưu tài nguyên |
|---|---|---|---|
| Dòng 13 | \`UUID.randomUUID() + "_" + ...\` | Sinh fileKey độc nhất trên Cloud Bucket | Ngăn chặn việc khách hàng upload trùng tên file đè lên dữ liệu của nhau |
| Dòng 25 | \`StreamingResponseBody\` | Giao diện xuất luồng bất đồng bộ của Spring MVC | Ghi dữ liệu trực tiếp vào Socket của Client mà không cần nạp toàn bộ vào Heap RAM |
| Dòng 31 | \`writer.flush()\` | Đẩy dữ liệu ra network card theo từng đợt | Giữ mức tiêu thụ RAM luôn ở mức cố định vài Megabytes dù xuất file 10GB |

---

## 4. Key Takeaways & Cạm bẫy sống còn (Senior Architect Summary)

1. **Tuyệt đối không lưu file trên ổ cứng local của Container**: Pod trong Kubernetes có tính chất phù du (Ephemeral), khi pod restart toàn bộ file upload sẽ biến mất vĩnh viễn!
2. **Luôn dùng Presigned URL cho file trên 10MB**: Giúp giải phóng hoàn toàn áp lực băng thông và bộ nhớ cho máy chủ ứng dụng.
`;
}

// Refactor Lesson 2-4-3
const l243 = m2.lessons.find(l => l.id === "2-4-3");
if (l243) {
  l243.title = "Bài 2.4.3: Cạm bẫy OFFSET Triệu Dòng, Tràn Heap MultipartFile & Lỗi Connection Timeout";
  l243.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nhận diện 3 sự cố sập server kinh điển: OFFSET 1.000.000 làm nghẽn CPU database, Upload file lớn làm nổ RAM (\`OutOfMemoryError\`), và Connection Timeout khi xuất báo cáo.
- Cấu hình giới hạn kích thước file an toàn: \`spring.servlet.multipart.max-file-size\`.
- Đọc hiểu toàn bộ giải pháp phòng chống sập hệ thống qua Bảng phân tích chi tiết.
:::

---

## 1. Ba Sự Cố Sản Xuất Phổ Biến Nhất Trong Tầng REST Web

### 1. Sự cố 1: Khách hàng crawl dữ liệu bằng OFFSET làm sập PostgreSQL
- **Hiện tượng**: Một con bot tự động gửi liên tục các request: \`GET /api/v1/orders?page=50000&size=100\`.
- **Cơ chế lỗi**: Database phải scan và sort qua 5 triệu bản ghi cho mỗi request -> CPU database vọt lên 100%, hàng nghìn request mua hàng hợp lệ khác bị treo dẫn đến \`ConnectionTimeoutException\`!
- **Giải pháp Senior**: Khóa trần phân trang \`Pageable\`: Không bao giờ cho phép \`page > 100\` hoặc \`size > 50\`. Bắt buộc các bot thu thập dữ liệu phải chuyển sang dùng API Keyset Export!

### 2. Sự cố 2: Upload file lớn gây OutOfMemoryError
- **Hiện tượng**: Lập trình viên để mặc định cấu hình multipart, khi có 10 request upload file video 500MB cùng lúc, JVM bị Linux OOM Killer tiêu diệt ngay lập tức.
- **Cấu hình bảo hộ**:
\`\`\`yaml
spring:
  servlet:
    multipart:
      max-file-size: 10MB        # Giới hạn dung lượng 1 file
      max-request-size: 20MB     # Giới hạn tổng dung lượng request
      file-size-threshold: 2MB   # File > 2MB tự động ghi tạm vào đĩa cứng, không ngậm trong RAM
\`\`\`

---

## 2. Key Takeaways & Nguyên Tắc Sống Còn

1. **Khóa trần Page Size**: Luôn kiểm tra \`if (pageable.getPageSize() > 50) throw new BadRequestException(...)\` để ngăn chặn request độc hại vét cạn database.
2. **Cấu hình \`file-size-threshold\`**: Giúp bảo vệ Heap RAM an toàn bằng cách đệm dữ liệu ra ổ cứng tạm thời khi xử lý file upload.
`;
}

// Refactor Lesson 2-4-4
const l244 = m2.lessons.find(l => l.id === "2-4-4");
if (l244) {
  l244.title = "Bài 2.4.4: Milestone Synthesis: Bản đồ Phân Trang & Ma trận Lựa Chọn Chiến Lược Tải Dữ Liệu Lớn";
  l244.content = `
:::target 🎯 MỤC TIÊU BÀI TỔNG HỢP MILESTONE (10 PHÚT)
- Tổng hợp toàn diện chiến lược phân trang và truyền tải dữ liệu quy mô lớn trong Spring Boot.
- Nắm vững Ma trận Quyết định Công nghệ: Khi nào dùng OFFSET, khi nào dùng Keyset, khi nào dùng S3 Presigned URL.
- Nắm chắc các nguyên tắc vàng để xây dựng hệ thống REST API triệu người dùng ổn định.
:::

---

## 1. Ma Trận Quyết Định Công Nghệ: Phân Trang & Xử Lý Tệp Tin

| Kịch bản nghiệp vụ | Giải pháp kỹ thuật chuẩn | Lý do lựa chọn |
|---|---|---|
| Trang quản trị đơn hàng nội bộ (< 50.000 dòng) | Spring Data \`Pageable\` (OFFSET) | Cần hiển thị tổng số trang (\`totalPages\`) để nhân viên nhảy trang |
| Bảng tin mua sắm, Lịch sử giao dịch hàng triệu dòng | Keyset Pagination (\`WHERE id > :lastId\`) | Tốc độ siêu nhanh, không phụ thuộc vào độ sâu của trang |
| Tải file chứng từ hóa đơn, ảnh sản phẩm (> 10MB) | S3 Presigned URL (Upload trực tiếp Cloud) | Tiết kiệm 100% RAM và băng thông cho máy chủ Spring Boot |
| Xuất file Excel/CSV báo cáo 500.000 dòng | \`StreamingResponseBody\` | Ghi dữ liệu thẳng vào Socket, không bao giờ lo tràn bộ nhớ Heap |

---

## 2. Key Takeaways & Tổng Kết Module 2

1. **DispatcherServlet là trái tim**: Nắm vững vòng đời từ Filter -> HandlerMapping -> Adapter -> Converter để debug mọi vấn đề HTTP.
2. **Chuẩn hóa thông điệp lỗi bằng RFC 7807**: Dùng \`ProblemDetail\` để mang lại trải nghiệm chuyên nghiệp cho đối tác và lập trình viên Frontend.
3. **Bảo vệ Database bằng Keyset Pagination**: Khi dữ liệu lớn lên, Keyset là cứu cánh duy nhất giữ cho thời gian phản hồi của API luôn dưới 50ms.
`;
}

// Serialize back to file
const outContent = `/* MODULE 2 — REST API chuyên nghiệp (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n` + JSON.stringify(m2, null, 2) + `\n);\n`;

fs.writeFileSync(modulePath, outContent, "utf8");
console.log("Successfully refactored Module 2 Topics 3 & 4 (Lessons 2-3-1 to 2-4-4)!");
