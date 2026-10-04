const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module0.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m0 = window.COURSE_MODULES.find(m => m.id === 0);

// Refactor Lesson 0-3-1
const l031 = m0.lessons.find(l => l.id === "0-3-1");
if (l031) {
  l031.title = "Bài 0.3.1: Sealed Interface & Pattern Matching switch Xử lý Trạng thái Đơn hàng OrderStatus";
  l031.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nắm chắc triết lý Data-Oriented Programming (DOP) và vai trò của \`sealed interface\` trong việc mô hình hóa miền nghiệp vụ (Domain Model).
- Hiểu cơ chế Exhaustive Pattern Matching: Trình biên dịch Java 21 tự động cảnh báo nếu bạn quên xử lý một trạng thái đơn hàng.
- Loại bỏ hoàn toàn khối lệnh \`default\` thừa thãi và nguy hiểm trong biểu thức \`switch\`.
- Đọc hiểu 100% từng dòng code xử lý chuyển đổi trạng thái đơn hàng qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: SEALED INTERFACE & PATTERN MATCHING
**1. Interface thông thường — "Cánh cửa mở toang ai cũng vào được":**
- Bạn định nghĩa \`interface OrderEvent\`.
- Bất kỳ ai trong dự án cũng có thể tạo ra một class mới kế thừa interface này (\`class HackEvent implements OrderEvent\`).
- Khi viết hàm xử lý \`handleEvent(OrderEvent event)\`, bạn không bao giờ biết được có bao nhiêu loại event trên đời! Bạn buộc phải viết nhánh \`default: throw new RuntimeException()\` trong hoang mang.

**2. Sealed Interface — "Danh sách khách mời có kiểm soát tại cổng":**
- \`sealed interface PaymentMethod permits CreditCard, Momo, BankTransfer\`.
- Từ khóa **\`sealed\` (niêm phong)** tuyên bố: *"Chỉ có đúng 3 phương thức này được phép tồn tại, cấm bất kỳ ai tạo thêm class thứ 4!"*.
- Khi bạn dùng biểu thức **\`switch\` Pattern Matching** trong Java 21: Trình biên dịch kiểm tra đúng 3 trường hợp. Nếu ngày mai ai đó thêm \`ZaloPay\` vào danh sách, **code sẽ báo đỏ ngay lúc biên dịch** để bắt bạn phải cập nhật logic! Không bao giờ bị sót lỗi khi chạy thật!
:::

---

## 1. Cái này là gì? (Kiến trúc Type-Safe State Machine)

Sealed Interface (kết hợp với Java Record) tạo thành kiến trúc **Algebraic Data Types (ADTs)** chuẩn mực của phong cách lập trình hướng dữ liệu (Data-Oriented Programming).

### Sơ Đồ Kiến Trúc: Cây Phân Cấp Khép Kín & Pattern Matching Switch

\`\`\`mermaid
flowchart TD
    A["sealed interface OrderState<br/>(permits Pending, Paid, Shipped, Cancelled)"] --> B["record Pending(Instant createdAt)"]
    A --> C["record Paid(Instant paidAt, String txnId)"]
    A --> D["record Shipped(Instant shippedAt, String trackingCode)"]
    A --> E["record Cancelled(String reason)"]
    
    F["switch (orderState)"] -->|"Khớp kiểu & Tự ép kiểu (Smart Cast)"| G["case Pending p -> ..."]
    F --> H["case Paid p -> ..."]
    F --> I["case Shipped s -> ..."]
    F --> J["case Cancelled c -> ..."]
    style A fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style F fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi xử lý các trạng thái phức tạp của đơn hàng hoặc tích hợp các phương thức thanh toán khác nhau:

### Ma trận So sánh: Chuỗi if-else instanceof cũ vs Sealed Pattern Matching

| Tiêu chí | Cách cũ: if-else & instanceof | Sealed Interface & Pattern Matching switch |
|---|---|---|
| **Ép kiểu (Type Casting)** | Phải viết thủ công: \`CreditCard cc = (CreditCard) method;\` | **Smart Casting tự động**: \`case CreditCard cc\` biến \`cc\` dùng được ngay |
| **Kiểm tra sót trường hợp** | Không thể phát hiện, runtime sẽ rơi vào nhánh \`else\` âm thầm | **Trình biên dịch bắt buộc kiểm tra toàn diện (Exhaustiveness Check)** |
| **Độ an toàn khi mở rộng** | Thêm loại thanh toán mới nhưng quên sửa code xử lý -> sinh bug production | Thêm loại mới là code báo lỗi compile ngay lập tức, bắt buộc dev phải bổ sung |
| **Cú pháp** | Rườm rà, nhiều ngoặc nhọn, dễ nhầm lẫn | Biểu thức lambda arrow (\`->\`), ngắn gọn, trả về kết quả trực tiếp |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là mô hình hóa trạng thái đơn hàng bất biến chuẩn Enterprise:

\`\`\`java
package vn.mastery.ecommerce.domain;

import java.time.Instant;

public sealed interface OrderState 
    permits OrderState.Pending, OrderState.Paid, OrderState.Shipped, OrderState.Cancelled {

    record Pending(Instant createdAt) implements OrderState {}
    record Paid(Instant paidAt, String transactionId) implements OrderState {}
    record Shipped(Instant shippedAt, String trackingCode) implements OrderState {}
    record Cancelled(String reason, Instant cancelledAt) implements OrderState {}
}
\`\`\`

Và Service xử lý thông điệp gửi cho khách hàng bằng Pattern Matching:

\`\`\`java
package vn.mastery.ecommerce.service;

import org.springframework.stereotype.Service;
import vn.mastery.ecommerce.domain.OrderState;

@Service
public class OrderNotificationService {

    public String generateCustomerMessage(OrderState state) {
        // Switch expression kiểu mới: Không cần break, không cần default!
        return switch (state) {
            case OrderState.Pending p -> 
                "Đơn hàng đang chờ thanh toán (Tạo lúc: " + p.createdAt() + ")";
            case OrderState.Paid p -> 
                "Đã thanh toán thành công! Mã giao dịch: " + p.transactionId();
            case OrderState.Shipped s -> 
                "Đơn hàng đang giao. Mã vận đơn: " + s.trackingCode();
            case OrderState.Cancelled c -> 
                "Đơn hàng đã hủy. Lý do: " + c.reason();
        };
    }
}
\`\`\`

### Bảng Giải Mã Từng Dòng Code Trong Biểu Thức Switch:

| Dòng code | Cú pháp / Tính năng | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động |
|---|---|---|---|
| \`sealed interface OrderState permits ...\` | Sealed Interface Declaration | Niêm phong interface, chỉ cấp phép cho 4 record con | Trình biên dịch Java biết chính xác 100% tất cả các implementation hợp lệ |
| \`return switch (state) { ... }\` | Switch Expression | Biểu thức switch trả về giá trị trực tiếp | Thay thế chuỗi lệnh \`if-else if\` dài dòng, cú pháp gọn gàng |
| \`case OrderState.Paid p -> ...\` | Pattern Matching Case | Kiểm tra xem đối tượng có phải kiểu \`Paid\` không | Nếu đúng, tự động gán vào biến \`p\` (Smart Cast) mà không cần ép kiểu thủ công |
| Không cần \`default\` branch | Exhaustiveness Check | Tính toàn vẹn của Sealed Hierarchy | Nếu bạn xóa đi 1 nhánh case, trình biên dịch sẽ từ chối build ngay lập tức |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Cạm bẫy thêm nhánh \`default\` vào Sealed Switch**:
   - Khi đã dùng \`sealed interface\`, **TUYỆT ĐỐI KHÔNG VIẾT NHÁNH \`default\`**.
   - Nếu bạn viết \`default\`, khi sau này thêm trạng thái mới \`Refunded\`, trình biên dịch sẽ nhảy vào \`default\` mà không báo lỗi compile, làm mất tác dụng lớn nhất của Sealed Interface!

2. **Cạm bẫy đặt các Record con ở file khác nhau**:
   - Nếu các implementation cùng nằm chung 1 file với \`sealed interface\`, bạn có thể bỏ qua từ khóa \`permits\` vì Java sẽ tự động suy diễn.
`;
}

// Refactor Lesson 0-3-2
const l032 = m0.lessons.find(l => l.id === "0-3-2");
if (l032) {
  l032.title = "Bài 0.3.2: Thiết kế State Machine Thanh Toán Bất Biến cho PaymentMethod trong Spring Boot";
  l032.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Áp dụng Sealed Interface và Record để xây dựng cỗ máy xử lý thanh toán đa kênh (Thẻ quốc tế, Ví MoMo, Chuyển khoản ngân hàng).
- Sử dụng Guard Pattern (mệnh đề \`when\`) trong switch để kiểm tra điều kiện bổ sung mà không cần lồng \`if\`.
- Đảm bảo tính Thread-Safe tuyệt đối khi xử lý giao dịch thanh toán trong môi trường Spring Boot đa luồng.
- Đọc hiểu 100% từng dòng code xử lý thanh toán qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CỖ MÁY THANH TOÁN ĐA KÊNH
**Hình tượng "Quầy thanh toán thông minh tại siêu thị":**
- Khách hàng bước tới quầy thanh toán có thể đưa ra:
  1. Chiếc thẻ tín dụng Visa (\`CreditCard(cardNumber, cvv)\`)
  2. Mã QR ví điện tử MoMo (\`MomoWallet(phoneNumber, otp)\`)
  3. Tiền mặt chuyển khoản (\`BankTransfer(accountNo, refCode)\`)
- Nhân viên thu ngân thông minh (Spring Boot Service) không cần hỏi lúng túng: Chỉ cần đưa phương thức vào máy quét (\`switch\`).
- Máy quét tự động nhận diện: *"À, đây là thẻ Visa, nếu là thẻ Platinum (mệnh đề when) thì tự động giảm giá 5%, còn nếu là ví MoMo thì kiểm tra mã OTP"*.
- Toàn bộ dữ liệu thanh toán là bất biến (Record), không ai có thể can thiệp sửa đổi số tiền giữa chừng!
:::

---

## 1. Cái này là gì? (Mô hình hóa Phương Thức Thanh Toán Đa Kênh)

Trong Spring Boot 3, thay vì tạo class cha đồ sộ với hàng chục trường rỗng (như \`cardNumber\`, \`momoPhone\`, \`bankAccount\` cùng nhồi vào 1 class), ta dùng **Polymorphic Domain Modeling** với Sealed Interface:

### Sơ Đồ Khối: Xử Lý Đa Kênh Thanh Toán

\`\`\`mermaid
flowchart TD
    A["Khách Hàng Chọn Thanh Toán"] --> B{"PaymentMethod (Sealed)"}
    B -->|"Thẻ Tín Dụng"| C["CreditCardPayment<br/>(Kiểm tra số dư & CVV)"]
    B -->|"Ví MoMo"| D["MomoPayment<br/>(Gọi API Gateway MoMo)"]
    B -->|"Chuyển Khoản"| E["BankTransferPayment<br/>(Tạo mã VietQR)"]
    C --> F["PaymentResult.Success / Failure"]
    D --> F
    E --> F
    style B fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style F fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi cổng thanh toán của sàn thương mại điện tử cần hỗ trợ nhiều nhà cung cấp dịch vụ khác nhau mà không làm loãng dữ liệu:

### Ma trận So sánh: Thiết kế Class Đơn (Fat Class) vs Sealed Records

| Tiêu chí | Thiết kế Fat Class (Class đơn chứa mọi trường) | Thiết kế Sealed Records (Phân tầng chuẩn) |
|---|---|---|
| **Dung lượng bộ nhớ** | Chứa hàng loạt trường null vô nghĩa (\`cvv\` null khi trả MoMo) | Mỗi Record chỉ chứa **đúng những trường bắt buộc** của phương thức đó |
| **Tính hợp lệ dữ liệu** | Khó kiểm soát, dễ xảy ra tình trạng thiếu trường quan trọng | Bắt buộc phải truyền đủ tham số ngay thời điểm khởi tạo |
| **Logic mở rộng kênh mới** | Phải thêm cột vào database và thêm trường vào class, rất dễ vỡ | Chỉ cần tạo thêm 1 Record mới kế thừa Sealed Interface |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Định nghĩa miền nghiệp vụ thanh toán:

\`\`\`java
package vn.mastery.ecommerce.payment;

import java.math.BigDecimal;

public sealed interface PaymentMethod permits 
    PaymentMethod.CreditCard, PaymentMethod.Momo, PaymentMethod.BankTransfer {

    record CreditCard(String cardNumber, String cvv, String expiryMonthYear, boolean isVip) 
        implements PaymentMethod {}

    record Momo(String phoneNumber, String transactionToken) 
        implements PaymentMethod {}

    record BankTransfer(String bankCode, String accountNumber, String transferNote) 
        implements PaymentMethod {}
}
\`\`\`

Service điều hướng thanh toán với Guard Clause (\`when\`):

\`\`\`java
package vn.mastery.ecommerce.service;

import org.springframework.stereotype.Service;
import vn.mastery.ecommerce.payment.PaymentMethod;
import java.math.BigDecimal;

@Service
public class PaymentProcessingService {

    public String processPayment(PaymentMethod method, BigDecimal amount) {
        return switch (method) {
            // Sử dụng mệnh đề 'when' để kiểm tra điều kiện phụ thuộc
            case PaymentMethod.CreditCard cc when cc.isVip() -> 
                "Áp dụng giảm giá VIP 5% cho thẻ " + maskCard(cc.cardNumber()) + ". Số tiền: " + amount.multiply(BigDecimal.valueOf(0.95));

            case PaymentMethod.CreditCard cc -> 
                "Xử lý thanh toán thẻ tín dụng: " + maskCard(cc.cardNumber()) + ". Số tiền: " + amount;

            case PaymentMethod.Momo momo -> 
                "Gửi yêu cầu trừ tiền ví MoMo tới số: " + momo.phoneNumber();

            case PaymentMethod.BankTransfer bank -> 
                "Tạo mã VietQR cho ngân hàng: " + bank.bankCode() + " - STK: " + bank.accountNumber();
        };
    }

    private String maskCard(String cardNumber) {
        return "**** **** **** " + cardNumber.substring(cardNumber.length() - 4);
    }
}
\`\`\`

### Bảng Giải Mã Chi Tiết Cơ Chế Xử Lý:

| Dòng code | Cú pháp mới Java 21 | Ý nghĩa kỹ thuật | Tác động nghiệp vụ |
|---|---|---|---|
| \`case PaymentMethod.CreditCard cc when cc.isVip()\`| Pattern Matching với Guard \`when\` | Khớp kiểu \`CreditCard\` ĐỒNG THỜI điều kiện \`cc.isVip()\` phải là true | Ưu tiên xử lý chính sách khách hàng VIP mà không cần lồng lệnh \`if\` phức tạp |
| \`case PaymentMethod.CreditCard cc\` | Fallback Pattern | Khớp cho các loại thẻ tín dụng thông thường không phải VIP | Xử lý quy trình thanh toán tiêu chuẩn |
| \`maskCard(cc.cardNumber())\` | Helper Method | Che giấu thông tin nhạy cảm của thẻ tín dụng | Đảm bảo tuân thủ tiêu chuẩn an toàn thanh toán PCI-DSS |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Thứ tự của các nhánh \`case\` khi có mệnh đề \`when\`**:
   - Nhánh có điều kiện hẹp hơn (\`when cc.isVip()\`) **BẮT BUỘC PHẢI ĐẶT TRƯỚC** nhánh tổng quát (\`case CreditCard cc\`).
   - Nếu bạn đặt nhánh tổng quát lên trước, nhánh \`when\` phía dưới sẽ trở thành **Unreachable Code** và trình biên dịch sẽ báo lỗi!

2. **Bảo mật dữ liệu nhạy cảm**:
   - Khi ghi log thanh toán, không bao giờ in thô đối tượng Record chứa mã \`cvv\` hay \`cardNumber\`. Hãy ghi đè hàm \`toString()\` của Record để che dấu dữ liệu nhạy cảm.
`;
}

// Refactor Lesson 0-3-3
const l033 = m0.lessons.find(l => l.id === "0-3-3");
if (l033) {
  l033.title = "Bài 0.3.3: Cạm bẫy Bất biến Nông (Shallow Immutability) & Rủi ro Dùng Record làm JPA Entity";
  l033.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu rõ sự khác biệt giữa Bất biến nông (Shallow Immutability) và Bất biến sâu (Deep Immutability).
- Giải thích cặn kẽ 4 lý do kỹ thuật tại sao **TUYỆT ĐỐI KHÔNG ĐƯỢC dùng Java Record làm JPA \`@Entity\`**.
- Nắm vững cách dùng \`List.copyOf()\` và \`Collections.unmodifiableList()\` để bảo vệ tính toàn vẹn dữ liệu.
- Đọc hiểu bảng phân tích kiến trúc Hibernate dirty-checking và proxy requirement.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẠI SAO RECORD KHÔNG THỂ LÀM JPA ENTITY?
**Hình tượng "Bức tượng đá (Record) vs Con rối linh hoạt (JPA Entity)":**
- **Java Record giống như một bức tượng đá nguyên khối**: Khi tạc xong thì nó cứng ngắc, vĩnh viễn không thể thay đổi tay chân, không thể bẻ cong.
- **JPA Entity (Hibernate) giống như một con rối sân khấu**:
  - Người điều khiển (Hibernate Framework) cần gắn dây vào các khớp (Proxy CGLIB).
  - Khi cần cập nhật trạng thái đơn hàng từ DB lên, Hibernate cần gọi hàm rỗng không tham số để sinh ra con rối (\`no-arg constructor\`).
  - Khi bạn đổi giá tiền, Hibernate cần lén theo dõi xem trường nào vừa đổi để chuẩn bị sinh câu lệnh \`UPDATE\` (Dirty Checking).
- Nếu bạn mang một bức tượng đá nguyên khối (Record) đưa cho người điều khiển rối Hibernate, cả sân khấu sẽ **gãy đổ ngay lập tức** vì tượng đá không hề có khớp cử động!
:::

---

## 1. Cái này là gì? (Bản chất kỹ thuật xung đột giữa Record và JPA)

### Sơ Đồ So Sánh: Cơ Chế Hibernate Entity vs Java Record

\`\`\`mermaid
flowchart LR
    subgraph HIBERNATE["Yêu cầu bắt buộc của Hibernate Entity"]
        A["1. Phải có Constructor không tham số<br/>(No-arg constructor)"]
        B["2. Các trường phải Mutable để hỗ trợ Dirty Checking"]
        C["3. Hỗ trợ Subclassing để tạo Dynamic Proxy / Lazy Loading"]
    end
    subgraph RECORD["Bản chất cố hữu của Java Record"]
        D["1. KHÔNG CÓ No-arg constructor<br/>(Bắt buộc truyền đủ tham số)"]
        E["2. Bất biến 100% (final fields)<br/>Không cho sửa sau khởi tạo"]
        F["3. Là 'final class'<br/>CẤM TUYỆT ĐỐI việc tạo subclass!"]
    end
    style HIBERNATE fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
    style RECORD fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Phân chia Ranh giới Trách nhiệm)

### Bảng Phân Định Ranh Giới: Khi nào dùng Record vs Khi nào dùng Class

| Thành phần trong Spring Boot | Loại đối tượng phù hợp | Lý do kỹ thuật cốt lõi |
|---|:---:|---|
| **DTO (Request / Response Payload)** | ⭐ **Java Record** | Dữ liệu truyền nhận chỉ đọc, bất biến, an toàn đa luồng, map JSON siêu tốc |
| **JPA Entity (\`@Entity\`)** | ⭐ **Regular Java Class** | Cần no-arg constructor, setter hoặc business methods, hỗ trợ Hibernate Proxy |
| **Cấu hình (\`@ConfigurationProperties\`)** | ⭐ **Java Record** (Spring Boot 3) | Type-safe configuration nạp từ \`application.yml\` vào các trường final |
| **Domain State Machine** | ⭐ **Sealed Interface + Records** | Mô hình hóa các trạng thái và sự kiện nghiệp vụ khép kín |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Cách tổ chức kết hợp chuẩn giữa JPA Entity (Mutable) và Record DTO (Immutable):

\`\`\`java
package vn.mastery.ecommerce.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;

// 1. JPA Entity: Dùng Class thông thường
@Entity
@Table(name = "orders")
public class OrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String customerId;

    @Column(nullable = false)
    private BigDecimal totalAmount;

    // Hibernate bắt buộc cần constructor không tham số
    protected OrderEntity() {}

    public OrderEntity(String customerId, BigDecimal totalAmount) {
        this.customerId = customerId;
        this.totalAmount = totalAmount;
    }

    // Chuyển đổi Entity sang Record DTO an toàn
    public OrderResponseDto toResponseDto() {
        return new OrderResponseDto(this.id, this.customerId, this.totalAmount);
    }
}
\`\`\`

Record DTO trả về cho Client:

\`\`\`java
package vn.mastery.ecommerce.dto;

import java.math.BigDecimal;

// 2. DTO: Dùng Record bất biến
public record OrderResponseDto(
    Long id,
    String customerId,
    BigDecimal totalAmount
) {}
\`\`\`

### Bảng Phân Tích Sự Kết Hợp Chuẩn Mực:

| Thành phần | Vai trò | Tác động hệ thống |
|---|---|---|
| \`protected OrderEntity() {}\` | No-arg constructor của JPA Entity | Cho phép Hibernate khởi tạo instance thông qua Java Reflection khi đọc dữ liệu từ DB lên |
| \`public OrderResponseDto toResponseDto()\` | Mapper method chuyển đổi tầng | Đóng gói dữ liệu từ Entity thành Record DTO trước khi trả về Controller |
| \`public record OrderResponseDto(...)\` | Immutable Data Transfer Object | Đảm bảo dữ liệu gửi ra client qua REST API không thể bị bất kỳ ai can thiệp sửa đổi |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa Shallow Immutability với List bên trong Record**:
   - Nếu Record chứa \`List<Item>\`, đừng để tham chiếu ra ngoài:
   - Sai: \`public record Cart(List<Item> items) {}\` -> Ai đó gọi \`cart.items().clear()\` sẽ xóa sạch giỏ hàng!
   - Đúng: Dùng Compact Constructor: \`items = List.copyOf(items);\`.

2. **Spring Data JPA DTO Projection**:
   - Mặc dù Record không thể làm \`@Entity\`, bạn **HOÀN TOÀN CÓ THỂ dùng Record làm DTO Projection** trong Spring Data JPA:
   - Ví dụ: \`@Query("SELECT new vn.mastery.ecommerce.dto.OrderSummary(o.id, o.totalAmount) FROM OrderEntity o")\`.
   - Đây là kỹ thuật Senior giúp truy vấn dữ liệu nhanh gấp 3 lần so với nạp toàn bộ Entity!
`;
}

// Refactor Lesson 0-3-4
const l034 = m0.lessons.find(l => l.id === "0-3-4");
if (l034) {
  l034.title = "Bài 0.3.4: Tổng Kết Thực Chiến: Ma Trận Phân Định Record DTO, Class Entity & State Machine";
  l034.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 0.3 thành Ma trận kiến trúc lựa chọn cấu trúc dữ liệu chuẩn Senior.
- Nắm vững quy trình chuyển dịch dữ liệu (Data Pipeline) từ Client Request -> Controller DTO -> Service Domain -> JPA Entity -> Database.
- Rèn luyện phản xạ phát hiện sai lầm kiến trúc khi thấy ai đó dùng Record sai mục đích.
- Đọc hiểu bảng quyết định kỹ thuật ADR khi thiết kế Domain Model cho dự án E-Commerce.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: QUY TRÌNH CHUYỂN DỊCH HÀNG HÓA
**Hãy nhìn dòng chảy dữ liệu như dây chuyền sản xuất bánh ngọt:**
1. **Khách đặt hàng**: Khách gửi đơn yêu cầu in trên giấy bất biến (**Record Request DTO**).
2. **Xưởng làm bánh**: Trưởng ca kiểm tra xem loại bánh này là bánh nướng hay bánh dẻo (**Sealed Interface Pattern Matching**).
3. **Nhào bột và nướng**: Bột được nhào nặn biến đổi linh hoạt theo khuôn (**Class JPA Entity** trong lò nướng Database).
4. **Đóng hộp giao hàng**: Bánh chín được đóng vào hộp niêm phong bất biến (**Record Response DTO**) gửi về tận tay khách.
Mỗi giai đoạn cần đúng một loại vật liệu: Đừng bao giờ mang hộp niêm phong ném vào lò nướng!
:::

---

## 1. Cái này là gì? (Kiến Trúc Dòng Chảy Dữ Liệu Phân Tầng)

### Sơ Đồ Luồng: Chuyển Dịch Dữ Liệu Qua Các Tầng Ứng Dụng Spring Boot

\`\`\`mermaid
flowchart LR
    A["HTTP Request<br/>JSON Payload"] -->|"Jackson Deserialize"| B["Record DTO<br/>(CreateOrderRequest)<br/>[BẤT BIẾN]"]
    B -->|"Controller chuyển Service"| C["Domain State Machine<br/>(Sealed Interface)<br/>[XỬ LÝ NGHIỆP VỤ]"]
    C -->|"Service chuyển Entity"| D["Class JPA Entity<br/>(OrderEntity)<br/>[MUTABLE / HIBERNATE]"]
    D -->|"Spring Data JPA"| E[("PostgreSQL<br/>Database")]
    style B fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style C fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style D fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Ma Trận Quyết Định Kỹ Thuật)

### Ma Trận Lựa Chọn Mô Hình Dữ Liệu Chuẩn Senior (ADR Matrix)

| Đặc tính kỹ thuật | Java Record | Regular Class | Sealed Interface + Records |
|---|:---:|:---:|:---:|
| **Mục đích chính** | Chứa dữ liệu vận chuyển (DTO, Event) | Quản lý đối tượng nghiệp vụ JPA | Mô hình hóa trạng thái hữu hạn |
| **Tính bất biến (Immutability)** | ✅ Tuyệt đối (mọi field là final) | ❌ Tùy biến (thường là mutable) | ✅ Tuyệt đối |
| **Tương thích Hibernate Entity** | ❌ Không được phép | ✅ 100% bắt buộc | ❌ Không được phép |
| **Tương thích Spring Boot 3 REST** | ✅ Tối ưu nhất | Có thể dùng nhưng dài dòng | ✅ Rất tốt cho đa hình JSON |
| **Hỗ trợ Pattern Matching switch** | ✅ Rất mạnh | Hạn chế (cần ép kiểu) | ⭐ **Mạnh nhất (Toàn diện)** |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (End-to-End Flow)

Dưới đây là một Controller hoàn chỉnh kết nối trọn vẹn cả 3 mô hình dữ liệu:

\`\`\`java
package vn.mastery.ecommerce.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.mastery.ecommerce.dto.CreateOrderRequest;
import vn.mastery.ecommerce.dto.OrderResponseDto;
import vn.mastery.ecommerce.service.OrderService;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponseDto> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        // Tiếp nhận Record Request -> Gọi Service xử lý -> Trả về Record Response
        OrderResponseDto response = orderService.processOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
\`\`\`

### Bảng Giải Mã Luồng Dữ Liệu Tầng Controller:

| Thành phần mã lệnh | Vai trò kỹ thuật | Tác động an toàn hệ thống |
|---|---|---|
| \`@Valid @RequestBody CreateOrderRequest request\` | Jackson tự động parse JSON sang Record DTO | Dữ liệu đầu vào được kiểm tra tính hợp lệ và được bảo đảm bất biến ngay tại cổng Web |
| \`orderService.processOrder(request)\` | Chuyển dữ liệu sang tầng nghiệp vụ | Service yên tâm xử lý logic mà không sợ bất kỳ luồng nào khác thay đổi thuộc tính của request |
| \`ResponseEntity.status(...CREATED).body(response)\` | Đóng gói HTTP 201 Created kèm Record Response | Jackson chuyển đổi Record Response thành JSON trả về cho khách hàng với hiệu năng cao nhất |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Quy tắc bỏ túi của Kỹ sư Senior**:
   - DTO truyền vào / DTO trả ra: **100% dùng Record**.
   - Entity lưu trữ cơ sở dữ liệu: **100% dùng Regular Class**.
   - Trạng thái đơn hàng / Phương thức thanh toán: **100% dùng Sealed Interface**.
   - Không bao giờ để Entity rò rỉ ra ngoài tầng Controller (Luôn chuyển đổi sang Record DTO trước khi trả về).
`;
}

// Refactor Lesson 0-4-1
const l041 = m0.lessons.find(l => l.id === "0-4-1");
if (l041) {
  l041.title = "Bài 0.4.1: Kiến trúc Maven Multi-Module cho Dự án Spring Boot (Root, Common, Domain, Web)";
  l041.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu rõ tại sao các hệ thống Enterprise quy mô lớn bắt buộc phải chia dự án thành Maven Multi-Module thay vì nhồi nhét vào một Monolith duy nhất.
- Nắm chắc cơ chế Parent-Child POM, \`<dependencyManagement>\` và \`<modules>\`.
- Phân biệt sự khác nhau giữa \`dependencies\` thông thường và \`dependencyManagement\`.
- Đọc hiểu 100% từng dòng cấu hình trong Root POM qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỔ CHỨC CÔNG TY ĐA PHÒNG BAN
**1. Dự án Single Module (Monolith một đống) — "Cửa hàng một người làm tất":**
- Một người vừa đi chợ, vừa nấu ăn, vừa bưng bê, vừa làm kế toán kiểm toán.
- Khi người này bị ốm hoặc sửa đổi công thức nấu ăn, toàn bộ hoạt động của cửa hàng bị rối loạn. Code lẫn lộn giữa tầng Web, tầng Database và tầng DTO.

**2. Dự án Maven Multi-Module — "Tập đoàn chuyên nghiệp hóa":**
- **Root Parent POM**: Ban giám đốc tập đoàn — Đưa ra quy định chung về phiên bản công nghệ (Java 21, Spring Boot 3.3.4), nhân viên không được tự ý phá vỡ.
- **Module \`order-common\`**: Phòng hành chính — Chứa các tiện ích, exception dùng chung.
- **Module \`order-domain\`**: Phòng thiết kế sản phẩm — Chứa các Record, Sealed Interface định nghĩa nghiệp vụ cốt lõi, không phụ thuộc vào bất kỳ framework web nào.
- **Module \`order-api\`**: Phòng kinh doanh & tiếp tân — Chứa các REST Controller tiếp đón khách hàng và điều phối công việc.
:::

---

## 1. Cái này là gì? (Kiến trúc Maven Multi-Module Chuẩn)

### Sơ Đồ Kiến Trúc: Cây Phân Cấp Multi-Module Enterprise

\`\`\`mermaid
flowchart TD
    ROOT["ecommerce-platform (Root Parent POM)<br/>packaging: pom<br/>Quản lý dependencyManagement & plugins"]
    
    ROOT --> M1["ecommerce-common<br/>(Tiện ích, Validation, Exception DTO)"]
    ROOT --> M2["ecommerce-domain<br/>(Records, Sealed Interfaces, Entity JPA)"]
    ROOT --> M3["ecommerce-service<br/>(Business Logic, Transactional Services)"]
    ROOT --> M4["ecommerce-api-web<br/>(Spring Boot Main Application, REST Controllers)"]
    
    M4 --> M3
    M3 --> M2
    M2 --> M1
    style ROOT fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style M4 fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi hệ thống phát triển từ 3 lập trình viên lên 20 lập trình viên, hoặc khi cần tái sử dụng mã nguồn giữa nhiều dịch vụ:

### Ma trận So sánh: Single Module vs Multi-Module Architecture

| Tiêu chí | Single Module Dự án đơn | Maven Multi-Module Phân tầng |
|---|---|---|
| **Ranh giới phụ thuộc (Boundaries)** | Lỏng lẻo: Controller có thể vô tình gọi trực tiếp JPA Repository | **Nghiêm ngặt**: Module Web không thể thấy Repository nếu không khai báo phụ thuộc |
| **Tốc độ Build dự án** | Phải biên dịch lại toàn bộ dự án dù chỉ sửa 1 file nhỏ | **Incremental Build**: Chỉ biên dịch lại module có thay đổi, tiết kiệm 70% thời gian |
| **Khả năng tái sử dụng** | Bắt buộc phải copy-paste code DTO sang dự án khác | Đóng gói \`order-common\` thành thư viện dùng chung cho toàn bộ công ty |
| **Quản lý phiên bản thư viện** | Dễ xung đột giữa các thành viên | **Tập trung hóa 100%** tại Root POM qua \`<dependencyManagement>\` |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

File \`pom.xml\` tại thư mục gốc (Root POM):

\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.4</version>
        <relativePath/>
    </parent>

    <groupId>vn.mastery.ecommerce</groupId>
    <artifactId>ecommerce-parent</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>pom</packaging>

    <modules>
        <module>ecommerce-common</module>
        <module>ecommerce-domain</module>
        <module>ecommerce-service</module>
        <module>ecommerce-api-web</module>
    </modules>

    <properties>
        <java.version>21</java.version>
        <ecommerce.version>1.0.0-SNAPSHOT</ecommerce.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>vn.mastery.ecommerce</groupId>
                <artifactId>ecommerce-common</artifactId>
                <version>\${ecommerce.version}</version>
            </dependency>
            <dependency>
                <groupId>vn.mastery.ecommerce</groupId>
                <artifactId>ecommerce-domain</artifactId>
                <version>\${ecommerce.version}</version>
            </dependency>
            <dependency>
                <groupId>vn.mastery.ecommerce</groupId>
                <artifactId>ecommerce-service</artifactId>
                <version>\${ecommerce.version}</version>
            </dependency>
        </dependencies>
    </dependencyManagement>
</project>
\`\`\`

### Bảng Giải Mã Cấu Trúc Root POM:

| Thẻ XML | Giá trị / Cú pháp | Ý nghĩa kỹ thuật | Tác động hệ thống build |
|---|---|---|---|
| \`<packaging>pom</packaging>\` | Kiểu đóng gói POM | Khai báo đây là Project cha quản lý, không sinh ra file jar thực thi | Maven hiểu đây là module điều phối các module con bên trong |
| \`<modules>...</modules>\` | Danh sách module con | Liệt kê các thư mục con cần biên dịch theo thứ tự | Maven tự động xây dựng cây đồ thị phụ thuộc (Reactor Build Order) để build từ dưới lên |
| \`<dependencyManagement>\` | Bộ quản lý phiên bản tập trung | Khai báo sẵn phiên bản cho các thư viện và module nội bộ | **Không tải thư viện về ngay**, chỉ định nghĩa khuôn mẫu để module con thừa hưởng mà không cần ghi tag \`<version>\` |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Cạm bẫy nhầm lẫn giữa \`<dependencies>\` và \`<dependencyManagement>\`**:
   - Nếu bạn đặt thư viện vào thẻ \`<dependencies>\` của Root POM, **100% tất cả module con đều bị ép phải tải thư viện đó**, kể cả khi module con không cần đến!
   - Best practice: Đặt vào \`<dependencyManagement>\` ở Root POM, module con nào cần dùng thì tự khai báo lại tên không cần thẻ \`<version>\`.

2. **Cạm bẫy vòng lặp phụ thuộc (Circular Dependency giữa các module)**:
   - Nếu \`module-A\` phụ thuộc vào \`module-B\`, mà \`module-B\` lại phụ thuộc ngược lại \`module-A\`, Maven sẽ báo lỗi chết đứng: \`The projects in the reactor contain a cycle\`.
   - Khắc phục: Tuân thủ quy tắc phụ thuộc 1 chiều: Web -> Service -> Domain -> Common.
`;
}

// Refactor Lesson 0-4-2
const l042 = m0.lessons.find(l => l.id === "0-4-2");
if (l042) {
  l042.title = "Bài 0.4.2: Khởi tạo và Phân tách Module: order-common, order-domain, order-service, order-api";
  l042.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tự tay tạo lập cấu trúc 4 module chuẩn mực cho hệ thống xử lý đơn hàng E-Commerce.
- Cấu hình file \`pom.xml\` cho từng module con kế thừa chính xác từ Root Parent POM.
- Hiểu rõ tại sao chỉ có duy nhất module \`order-api-web\` mới được áp dụng \`spring-boot-maven-plugin\`.
- Đọc hiểu 100% lệnh build Maven Reactor và cách xuất bản các artifact.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: 4 TẦNG NHÀ CỦA TÒA CAO ỐC E-COMMERCE
- **Tầng 1 (order-common) — "Nền móng & Hệ thống ống nước"**: Cung cấp các công cụ tiện ích cơ bản, format ngày tháng, mã hóa chuỗi. Không dính dáng gì đến nghiệp vụ bán hàng.
- **Tầng 2 (order-domain) — "Bản thiết kế kiến trúc"**: Chứa các bản vẽ Record, quy định đơn hàng gồm những thông tin gì, thanh toán gồm những hình thức nào.
- **Tầng 3 (order-service) — "Đội thi công & Quản lý"**: Xử lý logic nghiệp vụ, tính toán khuyến mãi, trừ tiền, lưu database.
- **Tầng 4 (order-api-web) — "Cổng tiếp tân & Cửa sổ giao dịch"**: Nơi duy nhất mở cửa đón khách qua giao thức HTTP REST API, cũng là nơi duy nhất có chìa khóa khởi động toàn bộ tòa nhà (\`@SpringBootApplication\`).
:::

---

## 1. Cái này là gì? (Cấu hình Chi tiết Từng Module Con)

### Sơ Đồ Phụ Thuộc Một Chiều (Strict Layered Dependency Hierarchy)

\`\`\`mermaid
flowchart TD
    API["ecommerce-api-web<br/>(REST Controllers & Main App)<br/>packaging: jar (Fat JAR)"] -->|"Phụ thuộc"| SVC["ecommerce-service<br/>(Business Logic & Transactions)<br/>packaging: jar (Library)"]
    SVC -->|"Phụ thuộc"| DOM["ecommerce-domain<br/>(Entities & Records)<br/>packaging: jar (Library)"]
    DOM -->|"Phụ thuộc"| COM["ecommerce-common<br/>(Exceptions & Utils)<br/>packaging: jar (Library)"]
    style API fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style SVC fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style DOM fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#fff
    style COM fill:#374151,stroke:#9ca3af,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Nguyên Tắc Đóng Gói Plugin)

Trong 4 module trên, quy tắc đóng gói là khác nhau hoàn toàn:

### Bảng Phân Tích Cơ Chế Đóng Gói (Packaging Strategy)

| Module | Kiểu đóng gói | Có dùng \`spring-boot-maven-plugin\`? | Lý do kỹ thuật |
|---|:---:|:---:|---|
| \`ecommerce-common\` | Library JAR | ❌ **KHÔNG** | Là thư viện thuần túy, nếu đóng gói Fat JAR các module khác sẽ không thể import class |
| \`ecommerce-domain\` | Library JAR | ❌ **KHÔNG** | Chứa data models dùng chung, chỉ cần JAR thông thường |
| \`ecommerce-service\` | Library JAR | ❌ **KHÔNG** | Chứa business logic, đóng vai trò dependency cho module Web |
| \`ecommerce-api-web\` | **Executable Fat JAR** | ⭐ **CÓ (BẮT BUỘC)** | Là điểm khởi chạy duy nhất của ứng dụng, cần nhúng Tomcat và toàn bộ libs để chạy \`java -jar\` |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

### 1. File \`pom.xml\` của module \`ecommerce-api-web\` (Module chạy chính):

\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>vn.mastery.ecommerce</groupId>
        <artifactId>ecommerce-parent</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>ecommerce-api-web</artifactId>
    <packaging>jar</packaging>

    <dependencies>
        <!-- Kéo module service nội bộ (không cần ghi version) -->
        <dependency>
            <groupId>vn.mastery.ecommerce</groupId>
            <artifactId>ecommerce-service</artifactId>
        </dependency>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <!-- CHỈ DUY NHẤT MODULE NÀY ĐƯỢC CHỨA PLUGIN NÀY -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
\`\`\`

### Bảng Giải Mã Cấu Hình Module Web:

| Thẻ XML | Ý nghĩa kỹ thuật | Tác động Spring Boot |
|---|---|---|
| \`<parent>...ecommerce-parent</parent>\` | Kế thừa từ Root POM của toàn dự án | Thừa hưởng toàn bộ cấu hình compiler Java 21 và bộ quản lý version tập trung |
| \`<artifactId>ecommerce-service</artifactId>\` | Phụ thuộc vào module Service | Tự động kéo theo cả \`ecommerce-domain\` và \`ecommerce-common\` theo cơ chế Transitively |
| \`<plugin>spring-boot-maven-plugin</plugin>\` | Plugin tạo Fat JAR | Đóng gói toàn bộ mã nguồn của 4 module thành 1 file jar duy nhất có thể chạy bằng lệnh \`java -jar\` |

### Lệnh Build toàn bộ hệ thống từ thư mục gốc:

\`\`\`bash
# Build tuần tự cả 4 module theo đúng thứ tự phụ thuộc:
./mvnw clean install

# Chạy ứng dụng từ thư mục gốc chỉ định module web:
./mvnw spring-boot:run -pl ecommerce-api-web
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Cạm bẫy gắn \`spring-boot-maven-plugin\` vào Root POM hoặc Library Module**:
   - Nếu bạn đặt plugin này vào Root POM mà không tắt \`<skip>true</skip>\`, các module thư viện (\`common\`, \`domain\`) cũng sẽ bị biến thành Fat JAR.
   - Hậu quả: Khi module Web kéo \`common\` vào làm dependency, Maven sẽ báo lỗi không tìm thấy class: \`ZipException: archive is not a ZIP archive\` hoặc không thể import class!
`;
}

// Refactor Lesson 0-4-3
const l043 = m0.lessons.find(l => l.id === "0-4-3");
if (l043) {
  l043.title = "Bài 0.4.3: Cạm bẫy Xung đột Phiên bản Jar Hell, Circular Dependency & Lỗi Plugin Execution";
  l043.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nhận diện và giải quyết triệt để vấn đề "Jar Hell" (đụng độ nhiều phiên bản của cùng một thư viện trong Classpath).
- Sử dụng công cụ chẩn đoán \`mvn dependency:tree\` để truy tìm nguồn gốc dependency gây xung đột.
- Áp dụng thẻ \`<exclusions>\` để loại bỏ các thư viện cũ độc hại hoặc không tương thích.
- Cấu hình plugin \`maven-enforcer-plugin\` để tự động chặn đứng lỗi xung đột trước khi commit code.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: NỖI ÁM ẢNH "JAR HELL"
**Hình tượng "Hai người cùng tên nhưng làm việc trái ngược nhau":**
- Trong công ty có hai chuyên gia cùng tên là "Jackson JSON Parser".
- Một anh là **Jackson 2.15** (chuẩn mới, hỗ trợ Java 21 Record).
- Một anh là **Jackson 2.8** (cũ từ 7 năm trước, do một thư viện bên thứ ba vô tình kéo vào).
- Khi người giao việc (JVM Classloader) gọi tên: *"Jackson ơi, hãy parse cho tôi cái Record này!"*.
- Thật không may, anh Jackson 2.8 cũ kỹ lại giơ tay trước! Và vì anh ta không hề biết Record là gì, anh ta hét toáng lên: \`NoSuchMethodError\` hoặc \`ClassNotFoundException\` rồi làm sập toàn bộ hệ thống! Đây chính là thảm họa **Jar Hell** kinh điển.
:::

---

## 1. Cái này là gì? (Nguyên lý Dependency Mediation của Maven)

Khi có xung đột phiên bản, Maven áp dụng quy tắc **"Nearest-Wins" (Thư viện nào nằm gần Root POM hơn trong cây phụ thuộc thì chiến thắng)**:

### Sơ Đồ Cây Phụ Thuộc Xung Đột & Cơ Chế Loại Bỏ (Exclusion)

\`\`\`mermaid
flowchart TD
    ROOT["order-service (pom.xml)"] --> A["Thư viện X (Version 1.0)"]
    A -->|"Kéo ngầm (Transitive)"| BAD["Jackson 2.9 (Cũ - Gây lỗi ClassNotFound)"]
    
    ROOT --> B["spring-boot-starter-web"]
    B --> GOOD["Jackson 2.17 (Mới - Tương thích Java 21)"]
    
    style BAD fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
    style GOOD fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    
    SOL["GIẢI PHÁP: Khai báo exclusion trong Thư viện X<br/>để ép dùng duy nhất Jackson 2.17"]
    style SOL fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Kỹ Thuật Chẩn Đoán Thực Chiến)

### Bảng Lệnh Chẩn Đoán Lỗi Dependency Thần Thánh:

| Lệnh Maven Terminal | Ý nghĩa chẩn đoán | Thời điểm sử dụng |
|---|---|---|
| \`./mvnw dependency:tree\` | In ra toàn bộ cây phụ thuộc phân cấp của dự án | Khi gặp lỗi lạ về \`NoSuchMethodError\`, \`NoClassDefFoundError\` |
| \`./mvnw dependency:tree -Dincludes=com.fasterxml.jackson.*\` | Lọc riêng cây phụ thuộc của nhóm thư viện Jackson | Khi cần truy tìm xem thư viện nào đang kéo ngầm bản Jackson cũ |
| \`./mvnw dependency:analyze\` | Phân tích các thư viện khai báo nhưng không dùng, hoặc dùng mà không khai báo | Tối ưu hóa dung lượng file JAR trước khi go-live production |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Cách sử dụng thẻ \`<exclusions>\` để loại bỏ phiên bản thư viện cũ:

\`\`\`xml
<dependency>
    <groupId>com.thirdparty.payment</groupId>
    <artifactId>legacy-payment-sdk</artifactId>
    <version>1.2.0</version>
    <!-- Loại bỏ thư viện json cũ kỹ bị kéo ngầm theo SDK -->
    <exclusions>
        <exclusion>
            <groupId>org.json</groupId>
            <artifactId>json</artifactId>
        </exclusion>
        <exclusion>
            <groupId>commons-logging</groupId>
            <artifactId>commons-logging</artifactId>
        </exclusion>
    </exclusions>
</dependency>
\`\`\`

Cấu hình \`maven-enforcer-plugin\` tại Root POM để bắt buộc tuân thủ chuẩn:

\`\`\`xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-enforcer-plugin</artifactId>
    <version>3.4.1</version>
    <executions>
        <execution>
            <id>enforce-rules</id>
            <goals>
                <goal>enforce</goal>
            </goals>
            <configuration>
                <rules>
                    <!-- Bắt buộc phiên bản Java phải đúng 21 -->
                    <requireJavaVersion>
                        <version>[21,)</version>
                    </requireJavaVersion>
                    <!-- Chặn đứng mọi xung đột phiên bản dependency -->
                    <dependencyConvergence/>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
\`\`\`

### Bảng Giải Mã Quy Tắc Bảo Vệ Enforcer:

| Quy tắc cấu hình | Ý nghĩa kỹ thuật | Hiệu quả ngăn chặn lỗi |
|---|---|---|
| \`<requireJavaVersion>[21,)</requireJavaVersion>\` | Bắt buộc máy tính phải chạy JDK 21 trở lên | Ngăn chặn việc ai đó trong team dùng Java 11/17 để build gây lỗi bytecode |
| \`<dependencyConvergence/>\` | Quy tắc hội tụ phụ thuộc nghiêm ngặt | Nếu có 2 module kéo 2 phiên bản khác nhau của cùng 1 thư viện, quá trình build sẽ **FAIL NGAY LẬP TỨC** |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa \`NoSuchMethodError\` khi chạy Production**:
   - Khi chạy ở môi trường test thì bình thường, nhưng lên production lại crash.
   - Nguyên nhân: Thứ tự nạp file JAR trong Classpath của Docker container khác với IDE local.
   - Khắc phục: Luôn kích hoạt \`<dependencyConvergence/>\` để đảm bảo Classpath 100% đồng nhất.
`;
}

// Refactor Lesson 0-4-4
const l044 = m0.lessons.find(l => l.id === "0-4-4");
if (l044) {
  l044.title = "Bài 0.4.4: Tổng Kết Thực Chiến: Bản Đồ Phân Tầng Dự Án Spring Boot Đa Module & Dependency Mediation";
  l044.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 0.4 thành Bản đồ phân tầng dự án Spring Boot Multi-Module hoàn chỉnh.
- Nắm chắc 4 nguyên tắc vàng của Clean Architecture khi chia module trong hệ sinh thái Spring Boot.
- Hoàn thành bài tập Milestone Capstone của Module 0: Kiểm thử khả năng liên kết giữa 4 module \`common\`, \`domain\`, \`service\`, \`api\`.
- Sẵn sàng 100% bước vào Module 1 (Spring Core & IoC Container chuyên sâu).
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỔNG KẾT BẢN ĐỒ KIẾN TRÚC MÔ PHỎNG
Bạn vừa hoàn thành việc xây dựng "Bộ khung xương sống" của một dự án E-Commerce tầm cỡ Enterprise:
- Chúng ta có nền móng **Java 21 LTS** vững chãi.
- Chúng ta có **Maven Wrapper** đảm bảo mọi máy tính chạy đều chuẩn xác.
- Chúng ta có **Java Record & Sealed Interface** bảo vệ dữ liệu bất biến không thể bị xâm phạm.
- Chúng ta có **Maven Multi-Module** phân chia ranh giới quyền lực rành mạch giữa các tầng nghiệp vụ.
Ngôi nhà đã hoàn tất phần móng và khung cột bê tông cốt thép. Bây giờ là lúc đưa hệ thống điện nước thông minh (Spring Core, IoC, Dependency Injection) vào vận hành!
:::

---

## 1. Cái này là gì? (Bản Đồ Kiến Trúc Toàn Diện Module 0)

### Sơ Đồ Tổng Thể: Kiến Trúc Dự Án Spring Boot 3 Multi-Module Hoàn Chỉnh

\`\`\`mermaid
graph TD
    subgraph MODULE0["MODULE 0: KHỞI ĐỘNG SPRING BOOT 3 & KIẾN TRÚC DỰ ÁN"]
        T1["Chuyên Đề 0.1: Môi Trường & Initializr<br/>(JDK 21 LTS, mvnw, Port & SSL Check)"]
        T2["Chuyên Đề 0.2: Modern Java 21<br/>(Record DTO, Stream Pipeline, Safe Null)"]
        T3["Chuyên Đề 0.3: Data-Oriented Programming<br/>(Sealed State Machine, Immutable Boundary)"]
        T4["Chuyên Đề 0.4: Maven Multi-Module<br/>(Root POM, Reactor Build, Dependency Convergence)"]
    end
    
    T1 --> T2 --> T3 --> T4
    T4 ==> NEXT["MODULE 1: SPRING CORE & BOOT CĂN BẢN<br/>(IoC Container, Bean Lifecycle, AutoConfig, AOP)"]
    style MODULE0 fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style NEXT fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Quy Tắc Thiết Kế Phân Tầng Clean Architecture)

### 4 Quy Tắc Vàng Khi Phân Tách Module Spring Boot:

| Nguyên tắc | Nội dung quy tắc | Lợi ích kiến trúc |
|---|---|---|
| **Quy tắc 1: Dependency Rule** | Chiều phụ thuộc luôn hướng từ ngoài vào trong: \`Web -> Service -> Domain -> Common\`. Tầng trong không được biết tầng ngoài | Giữ cho core nghiệp vụ hoàn toàn độc lập với giao thức hiển thị (REST, GraphQL hay gRPC) |
| **Quy tắc 2: Single Entrypoint** | Chỉ có duy nhất 1 module chứa \`@SpringBootApplication\` và plugin đóng gói executable | Tránh xung đột manifest, tối ưu dung lượng build |
| **Quy tắc 3: Version Isolation** | Toàn bộ phiên bản thư viện nằm tại \`dependencyManagement\` của Root POM | Tránh xung đột Jar Hell trên toàn hệ thống |
| **Quy tắc 4: Clean Interface** | Giao tiếp giữa các module chỉ thông qua Java Record DTO và Service Interface | Bảo đảm tính đóng gói (Encapsulation) cao nhất |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (Capstone Verification)

Dưới đây là Integration Test kiểm tra toàn bộ chuỗi liên kết 4 module hoạt động trơn tru:

\`\`\`java
package vn.mastery.ecommerce;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import vn.mastery.ecommerce.dto.CreateOrderRequest;
import vn.mastery.ecommerce.dto.OrderItemDto;
import vn.mastery.ecommerce.dto.OrderResponseDto;
import vn.mastery.ecommerce.service.OrderService;
import java.math.BigDecimal;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class MultiModuleIntegrationTest {

    @Autowired
    private OrderService orderService;

    @Test
    @DisplayName("Kiểm tra dòng chảy đơn hàng xuyên suốt từ DTO qua Service và Entity")
    void testEndToEndOrderFlow() {
        // 1. Tạo Record DTO (Từ module ecommerce-domain)
        var item = new OrderItemDto("PROD-01", 2, new BigDecimal("500000"));
        var request = new CreateOrderRequest("CUST-999", List.of(item), new BigDecimal("1000000"));

        // 2. Gọi Service xử lý nghiệp vụ (Từ module ecommerce-service)
        OrderResponseDto response = orderService.processOrder(request);

        // 3. Xác thực kết quả
        assertNotNull(response);
        assertEquals("CUST-999", response.customerId());
        assertEquals(new BigDecimal("1000000"), response.totalAmount());
    }
}
\`\`\`

### Bảng Giải Mã Test Case Đa Phân Tầng:

| Đoạn mã | Module cung cấp | Ý nghĩa kiểm thử |
|---|---|---|
| \`new OrderItemDto(...)\` | \`ecommerce-domain\` | Kiểm tra khả năng biên dịch và khởi tạo Record DTO bất biến |
| \`orderService.processOrder(...)\` | \`ecommerce-service\` | Kiểm tra Spring IoC Container đã tiêm thành công Bean Service vào tầng test |
| \`assertNotNull(response)\` | \`org.junit.jupiter\` | Khẳng định dòng chảy dữ liệu qua 4 module hoạt động hoàn hảo 100% |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Checklist tốt nghiệp Module 0**:
   - [ ] Đã làm chủ môi trường JDK 21 và Spring Initializr.
   - [ ] Biết cách dùng Maven Wrapper để build dự án độc lập môi trường.
   - [ ] Nắm chắc Record DTO và biết cách dùng Compact Constructor để validate.
   - [ ] Hiểu rõ Stream Pipeline và tránh được cạm bẫy cạn kiệt CommonPool.
   - [ ] Phân biệt rõ ràng vai trò của Record DTO, Regular Entity và Sealed Interface.
   - [ ] Thành thạo chia dự án Maven Multi-Module chuẩn Enterprise.
`;
}

fs.writeFileSync(modulePath, "window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n" + JSON.stringify(m0, null, 2) + "\n);\n", "utf8");
console.log("Successfully refactored Module 0 Topics 0.3 & 0.4 (Lessons 0-3-1 to 0-4-4)!");
