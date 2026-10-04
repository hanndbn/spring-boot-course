const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module4.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m4 = window.COURSE_MODULES.find(m => m.id === 4);

// Refactor Lesson 4-1-1
const l411 = m4.lessons.find(l => l.id === "4-1-1");
if (l411) {
  l411.title = "Bài 4.1.1: Kiến trúc JUnit 5 Jupiter, Mockito 5 ByteBuddy & Triết lý Kiểm thử Đơn vị";
  l411.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu rõ bản chất kiểm thử đơn vị (Unit Test) trong Spring Boot: Cô lập hoàn toàn lớp nghiệp vụ khỏi Spring Container.
- Nắm vững kiến trúc JUnit 5 Jupiter Engine và cơ chế tạo Mock Object thông qua thư viện Mockito 5 (ByteBuddy).
- Phân biệt sự khác nhau một trời một vực giữa **Mock**, **Spy**, **Stub** và **Fake**.
- Đọc hiểu 100% từng dòng code Unit Test Service qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẠI SAO PHẢI DÙNG MOCKITO?
**Hình tượng "Diễn viên đóng thế trong phim hành động":**
- Bạn đang kiểm tra kỹ năng của viên cảnh sát chính (Class \`OrderCheckoutService\`).
- Trong kịch bản, cảnh sát phải đối đầu với một tên cướp có vũ khí (\`PaymentGateway\` trừ tiền thật qua cổng VNPay/Visa).
- Nếu bạn mang một tên cướp thật và súng thật vào trường quay (gọi vào Database thật và cổng thanh toán thật): Bạn sẽ bị trừ tiền thật trong tài khoản và mất hàng giờ dọn dẹp hiện trường!
- **Mockito chính là diễn viên đóng thế (Mock Object)**:
  - Khi cảnh sát bắn súng -> Diễn viên đóng thế giả vờ ngã xuống và hô to: *"Tôi đã nhận tiền thành công!"* (\`given(paymentGateway.charge(...)).willReturn(true)\`).
  - Bạn kiểm tra được 100% phản xạ của cảnh sát trong **5 miligiây**, không tốn 1 xu, không cần mạng Internet!
:::

---

## 1. Cái này là gì? (Kiến trúc JUnit 5 & Mockito Engine)

JUnit 5 tách biệt rõ ràng giữa **Platform** (Chạy trên IDE/Maven), **Jupiter** (Cú pháp viết test hiện đại) và **Vintage** (Chạy test JUnit 3/4 cũ). Mockito sử dụng ByteBuddy để tạo ra các class Proxy giả lập ngay trong bộ nhớ Heap.

### Sơ Đồ Kiến Trúc: Cơ Chế Tạo Mock Proxy Của Mockito

\`\`\`mermaid
flowchart TD
    A["OrderServiceTest (JUnit 5 Runner)"] -->|"@ExtendWith(MockitoExtension.class)"| B["Mockito 5 Engine"]
    B -->|"ByteBuddy sinh Dynamic Subclass"| C["Mock Object (OrderRepository$MockitoMock)"]
    B -->|"ByteBuddy sinh Dynamic Subclass"| D["Mock Object (PaymentGateway$MockitoMock)"]
    A -->|"Bơm qua Constructor"| E["OrderService (Target - Class Thật Cần Test)"]
    E -->|"Gọi repo.save()"| C
    E -->|"Gọi payment.charge()"| D
    style E fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style C fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style D fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi viết Unit Test cho tầng nghiệp vụ (Service Layer) của sàn thương mại điện tử:

### Ma trận So sánh: Test nạp Spring Boot đầy đủ vs Unit Test thuần Mockito

| Tiêu chí | Dùng \`@SpringBootTest\` | Dùng Unit Test thuần Mockito (\`@ExtendWith\`) |
|---|---|---|
| **Thời gian khởi động** | Mất **5 - 15 giây** nạp toàn bộ ApplicationContext và Tomcat | Mất **10 miligiây (0.01s)** chạy trực tiếp trên JVM |
| **Phụ thuộc môi trường** | Cần kết nối Database, Kafka, Redis hoặc nạp Docker | **Zero phụ thuộc**: Chạy ở bất kỳ đâu, không cần mạng |
| **Khả năng mô phỏng lỗi** | Khó giả lập tình huống cổng thanh toán bị timeout | **Dễ dàng 100%**: \`willThrow(new GatewayTimeoutException())\` |
| **Số lượng test case có thể chạy** | Chạy 1,000 test mất 15 phút trên CI/CD | Chạy 1,000 test mất **chưa tới 3 giây** |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là Unit Test chuẩn mực kiểm tra luồng thanh toán đơn hàng:

\`\`\`java
package vn.mastery.ecommerce.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.mastery.ecommerce.domain.Order;
import vn.mastery.ecommerce.domain.OrderStatus;
import vn.mastery.ecommerce.payment.PaymentGateway;
import vn.mastery.ecommerce.repository.OrderRepository;
import java.math.BigDecimal;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class OrderCheckoutServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentGateway paymentGateway;

    @InjectMocks
    private OrderCheckoutService orderCheckoutService;

    @Test
    @DisplayName("Thanh toán thành công: Cập nhật trạng thái PAID và gọi trừ tiền cổng thanh toán")
    void shouldCheckoutSuccessfullyWhenPaymentSucceeds() {
        // 1. Given (Chuẩn bị kịch bản giả lập)
        Order order = new Order(1L, "CUST-01", new BigDecimal("500000"), OrderStatus.PENDING);
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));
        given(paymentGateway.charge(anyString(), any(BigDecimal.class))).willReturn("TXN-SUCCESS-999");

        // 2. When (Thực thi hành động nghiệp vụ)
        orderCheckoutService.processCheckout(1L);

        // 3. Then (Kiểm tra kết quả và hành vi)
        assertEquals(OrderStatus.PAID, order.getStatus());
        then(paymentGateway).should(times(1)).charge(eq("CUST-01"), eq(new BigDecimal("500000")));
        then(orderRepository).should(times(1)).save(order);
    }
}
\`\`\`

### Bảng Giải Mã Các Annotation & Cú Pháp BDDMockito:

| Cú pháp / Annotation | Ý nghĩa kỹ thuật | Tác động kiểm thử |
|---|---|---|
| \`@ExtendWith(MockitoExtension.class)\` | Tích hợp Mockito vào vòng đời JUnit 5 | Tự động khởi tạo và giải phóng các Mock Object trước mỗi \`@Test\` |
| \`@Mock\` | Khai báo đối tượng giả lập | Mockito tạo ra một instance ảo hoàn toàn không có logic bên trong |
| \`@InjectMocks\` | Tự động tiêm các Mock vào Target | Tự tìm Constructor phù hợp của \`OrderCheckoutService\` để bơm các mock vào |
| \`given(...).willReturn(...)\` | Phong cách BDD Stubbing | Quy định hành vi: *"Khi hàm này được gọi với tham số này, hãy trả về giá trị này"* |
| \`then(...).should(times(1))\` | Behavior Verification | Khẳng định chính xác phương thức phải được gọi đúng 1 lần với tham số hợp lệ |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa Over-Mocking (Mock quá đà)**:
   - Nếu bạn mock luôn cả đối tượng \`Order\` (\`@Mock Order order\`), bạn sẽ không kiểm tra được logic thực sự của hàm \`order.setStatus(PAID)\`.
   - **Quy tắc vàng**: **Chỉ Mock các phụ thuộc bên ngoài (Repository, External API, Email). Domain Entity và DTO phải luôn dùng đối tượng thật!**
`;
}

// Refactor Lesson 4-1-2
const l412 = m4.lessons.find(l => l.id === "4-1-2");
if (l412) {
  l412.title = "Bài 4.1.2: Triển khai Unit Test Service Layer với BDDMockito & ArgumentCaptor";
  l412.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nắm chắc phong cách viết test BDD (Behavior-Driven Development): **Given -> When -> Then**.
- Sử dụng công cụ **\`ArgumentCaptor\`** để "bắt quả tang" và kiểm tra sâu dữ liệu được truyền vào Mock Object.
- Kiểm thử các nhánh xử lý ngoại lệ nghiệp vụ (\`assertThrows\`).
- Đọc hiểu 100% từng dòng code kiểm thử nâng cao qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: ARGUMENT CAPTOR LÀ GÌ?
**Hình tượng "Thám tử chặn thư kiểm tra nội dung phong bì":**
- \`OrderCheckoutService\` tạo ra một phong bì hóa đơn (\`Invoice\`) và gửi sang cho bên chuyển phát bưu điện (\`ShippingService.dispatch(invoice)\`).
- Bạn là thám tử (Unit Test): Bạn không chỉ muốn biết phong bì có được gửi đi hay không (\`should(times(1))\`), mà bạn muốn **mở chiếc phong bì ra để soi từng chữ bên trong**!
- **ArgumentCaptor chính là chiếc máy soi thư**:
  - Nó tóm lấy đối tượng \`invoice\` ngay tại thời điểm phương thức được gọi.
  - Sau đó cho phép bạn kiểm tra: *"Mã đơn hàng có đúng không? Địa chỉ nhà có bị thiếu không? Tiền phí ship tính có chuẩn không?"*.
:::

---

## 1. Cái này là gì? (Cơ Chế ArgumentCaptor Trong Mockito)

\`ArgumentCaptor\` là tính năng chuyên dụng của Mockito cho phép thu giữ (Capture) đối tượng tham số truyền vào một phương thức mock để thực hiện các assertion chi tiết sau đó.

### Sơ Đồ Cơ Chế Bắt Giữ Tham Số Của ArgumentCaptor:

\`\`\`mermaid
flowchart LR
    A["OrderCheckoutService"] -->|"Gọi repo.save(order)"| B["Mock OrderRepository"]
    C["ArgumentCaptor<Order>"] -.->|"Bắt lấy đối tượng order giữa đường"| B
    C -->|"captor.getValue()"| D["assert: order.getTotal() == 500k<br/>order.getStatus() == PAID"]
    style C fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style D fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi đối tượng cần lưu được sinh ra hoặc biến đổi bên trong thân hàm Service và không được trả về trực tiếp qua return value:

### Ma trận So sánh: Assert Return Value vs ArgumentCaptor

| Tiêu chí | Kiểm tra qua Return Value thông thường | Sử dụng ArgumentCaptor |
|---|---|---|
| **Áp dụng khi nào** | Khi phương thức có \`return responseDto\` | Khi phương thức trả về \`void\` hoặc tạo mới Entity bên trong |
| **Độ sâu kiểm tra** | Chỉ kiểm tra được các trường có trong DTO trả ra | Soi được **tất cả các thuộc tính nội bộ** gửi xuống DB |
| **Bảo vệ tính toàn vẹn** | Dễ bị sót các trường ngầm (createdAt, trackingCode) | Bắt được chính xác trạng thái của đối tượng lúc gửi đi |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là Unit Test sử dụng ArgumentCaptor và kiểm thử ngoại lệ:

\`\`\`java
package vn.mastery.ecommerce.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.mastery.ecommerce.domain.Order;
import vn.mastery.ecommerce.domain.OrderStatus;
import vn.mastery.ecommerce.exception.PaymentFailedException;
import vn.mastery.ecommerce.payment.PaymentGateway;
import vn.mastery.ecommerce.repository.OrderRepository;
import java.math.BigDecimal;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class AdvancedOrderTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentGateway paymentGateway;

    @InjectMocks
    private OrderCheckoutService checkoutService;

    @Captor
    private ArgumentCaptor<Order> orderCaptor;

    @Test
    @DisplayName("Bắt giữ Entity: Xác nhận Order được lưu có đúng mã giao dịch và trạng thái")
    void shouldCaptureSavedOrder() {
        // Given
        Order order = new Order(10L, "CUST-VIP", new BigDecimal("1000000"), OrderStatus.PENDING);
        given(orderRepository.findById(10L)).willReturn(Optional.of(order));
        given(paymentGateway.charge(anyString(), any())).willReturn("TXN-999");

        // When
        checkoutService.processCheckout(10L);

        // Then: Bắt lấy đối tượng order được truyền vào orderRepository.save()
        then(orderRepository).should().save(orderCaptor.capture());
        Order savedOrder = orderCaptor.getValue();

        assertEquals(10L, savedOrder.getId());
        assertEquals(OrderStatus.PAID, savedOrder.getStatus());
        assertEquals("TXN-999", savedOrder.getPaymentTransactionId());
    }

    @Test
    @DisplayName("Xử lý lỗi: Khi cổng thanh toán ném ngoại lệ -> Phải rollback và báo lỗi")
    void shouldThrowExceptionWhenPaymentGatewayFails() {
        // Given
        Order order = new Order(10L, "CUST-VIP", new BigDecimal("1000000"), OrderStatus.PENDING);
        given(orderRepository.findById(10L)).willReturn(Optional.of(order));
        given(paymentGateway.charge(anyString(), any()))
            .willThrow(new PaymentFailedException("Thẻ tín dụng hết hạn mức"));

        // When & Then: Khẳng định Service phải ném đúng ngoại lệ ra ngoài
        assertThrows(PaymentFailedException.class, () -> checkoutService.processCheckout(10L));
        // Đảm bảo đơn hàng KHÔNG BAO GIỜ được lưu thành công
        then(orderRepository).should(never()).save(any());
    }
}
\`\`\`

### Bảng Giải Mã Cú Pháp Nâng Cao:

| Đoạn mã | Cú pháp | Ý nghĩa kỹ thuật | Lợi ích kiểm thử |
|---|---|---|---|
| \`@Captor ArgumentCaptor<Order> orderCaptor\` | Khai báo Captor | Tạo công cụ bắt tham số theo kiểu dữ liệu \`Order\` | Tự động khởi tạo mà không cần gọi \`ArgumentCaptor.forClass()\` |
| \`orderCaptor.capture()\` | Phương thức thu giữ | Đặt bẫy tại vị trí tham số của hàm mock | Tóm lấy instance chính xác tại thời điểm gọi |
| \`then(repo).should(never()).save(any())\` | Negative Assertion | Khẳng định một hành vi **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP XẢY RA** | Bảo đảm không lưu đơn hàng rác khi thanh toán thất bại |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Cạm bẫy gọi \`orderCaptor.getValue()\` khi hàm chưa được gọi**:
   - Nếu hàm mock chưa từng được gọi hoặc bị nhảy qua do lỗi phía trước, gọi \`getValue()\` sẽ ném ra \`IndexOutOfBoundsException\`.
   - Luôn đặt dòng verify \`then().should()\` trước khi lấy giá trị.
`;
}

// Refactor Lesson 4-1-3
const l413 = m4.lessons.find(l => l.id === "4-1-3");
if (l413) {
  l413.title = "Bài 4.1.3: Cạm bẫy Over-mocking, Strict Stubs & Mockito Spy Rò Rỉ Trạng Thái Thật";
  l413.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã lỗi phổ biến trong Mockito 3/4/5: **\`UnnecessaryStubbingException\` (Strict Stubs)**.
- Hiểu rõ tại sao Mockito cấm khai báo các stub thừa không được sử dụng trong bài test.
- Phân biệt sự nguy hiểm của **Mockito \`@Spy\`** (Gọi một nửa code thật, một nửa code giả) gây rò rỉ trạng thái.
- Đọc hiểu bảng phân tích triệu chứng lỗi và cách khắc phục chuẩn Senior.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: STRICT STUBS VÀ CHIẾC MOCK THỪA
**Hình tượng "Người chuẩn bị đồ nghề thừa thãi":**
- Bạn chuẩn bị đi câu cá: Bạn mang theo cần câu, mồi câu, nhưng lại tiện tay mang thêm một chiếc xẻng đào đất!
- Trong suốt chuyến đi câu, bạn không hề động đến chiếc xẻng một lần nào.
- **Mockito Strict Stubs (Quy tắc nghiêm ngặt)**:
  - Mockito giống như vị giám khảo khó tính: *"Này bạn, bạn đã khai báo 'given(repo.count()).willReturn(10)', nhưng trong toàn bộ bài test bạn chưa hề gọi hàm count() một lần nào! Tôi sẽ phạt bạn rớt ngay lập tức (\`UnnecessaryStubbingException\`)!"*.
  - Tại sao lại làm vậy? Vì việc khai báo code thừa là dấu hiệu của việc copy-paste code ẩu, khiến người đọc sau bị nhầm lẫn về phạm vi của bài test!
:::

---

## 1. Cái này là gì? (Bản chất Cơ Chế Strictness Trong Mockito 5)

Mặc định từ Mockito 3+, chế độ **Strictness.STRICT_STUBS** được kích hoạt tự động. Mục đích nhằm phát hiện sớm:
1. Các dòng stubbing thừa thãi không bao giờ được gọi.
2. Các dòng stubbing khai báo sai tham số dẫn đến việc mock không khớp.

### Sơ Đồ Chẩn Đoán Lỗi UnnecessaryStubbingException:

\`\`\`mermaid
flowchart TD
    A["Viết code test: given(gateway.ping()).willReturn(true)"] --> B["Thực thi Service: checkout()"]
    B --> C["Service KHÔNG HỀ gọi gateway.ping()!"]
    C --> D["JUnit 5 kết thúc bài test"]
    D --> ERR["MOCKITO NÉM LỖI:<br/>UnnecessaryStubbingException!<br/>(Cảnh báo code rác / stub thừa)"]
    style ERR fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (So Sánh Mock vs Spy)

### Ma trận So sánh: Khi nào dùng Mock vs Khi nào dùng Spy

| Tiêu chí | Mockito \`@Mock\` | Mockito \`@Spy\` |
|---|---|---|
| **Bản chất đối tượng** | Đối tượng ảo 100%, mọi hàm đều trả về null/0 trừ khi được stub | Đối tượng bọc ngoài một **instance thật**, mặc định chạy code thật |
| **Rủi ro rò rỉ (State Leak)** | Tuyệt đối an toàn (0 rủi ro) | **Rất nguy hiểm**: Có thể vô tình ghi dữ liệu thật hoặc thay đổi trạng thái |
| **Cú pháp stubbing an toàn** | \`given(m.doSomething()).willReturn(...)\` | Bắt buộc dùng: \`doReturn(...).when(spy).doSomething()\` |
| **Khuyến nghị Senior** | **Ưu tiên dùng 95%** trong mọi bài test | Chỉ dùng khi cần test một legacy class không thể refactor |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Cách khắc phục lỗi Stubbing thừa và dùng Spy đúng chuẩn:

\`\`\`java
package vn.mastery.ecommerce.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.mastery.ecommerce.repository.OrderRepository;
import java.util.ArrayList;
import java.util.List;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class StrictStubbingFixTest {

    @Mock
    private OrderRepository orderRepository;

    // Ví dụ về Spy: Bọc ngoài một ArrayList thật
    @Spy
    private List<String> listSpy = new ArrayList<>();

    @Test
    void testSafeSpying() {
        // Cú pháp chuẩn với Spy: Dùng doReturn thay vì given
        // Tránh việc hàm listSpy.get(0) thật sự bị chạy và ném IndexOutOfBoundsException!
        doReturn("FakeItem").when(listSpy).get(0);

        // Sử dụng lenient() nếu stub đó thực sự là cấu hình chung tùy chọn
        lenient().when(orderRepository.count()).thenReturn(100L);
    }
}
\`\`\`

### Bảng Giải Mã Các Kỹ Thuật An Toàn:

| Cú pháp | Ý nghĩa kỹ thuật | Khắc phục lỗi |
|---|---|---|
| \`doReturn(...).when(spy)...)\` | Cú pháp stubbing an toàn cho Spy | Ngăn chặn việc thực thi code thật bên trong instance khi đang thiết lập mock |
| \`lenient().when(...)\` | Nới lỏng kiểm tra Strict Stub | Cho phép stub đó tồn tại kể cả khi test case không gọi tới (dùng cho hàm \`@BeforeEach\` dùng chung) |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa Spy gọi code thật ném lỗi**:
   - Nếu bạn viết: \`given(listSpy.get(0)).willReturn("X")\` -> Java sẽ thực sự chạy lệnh \`listSpy.get(0)\` trên list rỗng và văng lỗi \`IndexOutOfBoundsException\` ngay dòng setup!
   - Luôn nhớ: **Với Spy, hãy dùng \`doReturn().when()\`!**
`;
}

// Refactor Lesson 4-1-4
const l414 = m4.lessons.find(l => l.id === "4-1-4");
if (l414) {
  l414.title = "Bài 4.1.4: Tổng Kết Thực Chiến: Bản Đồ Kim Tự Tháp Kiểm Thử & Ma Trận Lựa Chọn Công Cụ Test";
  l414.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 4.1 thành Bản đồ Kim tự tháp Kiểm thử (Test Pyramid) chuẩn công nghiệp.
- Nắm vững tỷ lệ phân bổ chi phí và số lượng test: **70% Unit Test -> 20% Integration Test -> 10% E2E Test**.
- Rèn luyện kỹ năng phân định chính xác khi nào chỉ cần Unit Test và khi nào bắt buộc phải dùng Integration Test.
- Sẵn sàng bước sang Chuyên đề 4.2 (Sliced Testing & Testcontainers PostgreSQL thật).
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: KIM TỰ THÁP KIỂM THỬ (TEST PYRAMID)
**Hình tượng "Xây một chiếc xe ô tô an toàn":**
- **Tầng đáy (70% - Unit Test)**: Bạn kiểm tra riêng lẻ từng chiếc bu lông, con ốc, bugi đánh lửa. Chi phí siêu rẻ, làm cực nhanh (vài giây xong hàng nghìn chiếc).
- **Tầng giữa (20% - Integration Test / Sliced Test)**: Bạn lắp bugi vào động cơ và cắm bình ắc quy vào xem động cơ có nổ máy trơn tru không (Test kết nối Spring với Database thật).
- **Tầng đỉnh (10% - End-to-End Test)**: Bạn đóng nắp xe lại, bật điều hòa và lái thử chiếc xe trên đường cao tốc thật. Chi phí cực đắt, chạy rất chậm, chỉ làm cho các kịch bản cốt lõi nhất.
Một dự án thông minh luôn có phần đáy Kim tự tháp thật vững chắc!
:::

---

## 1. Cái này là gì? (Bản Đồ Kim Tự Tháp Kiểm Thử Enterprise)

### Sơ Đồ Kim Tự Tháp Kiểm Thử & Tỷ Lệ Phân Bổ Chuẩn:

\`\`\`mermaid
flowchart TD
    E2E["10% End-to-End Test<br/>(Toàn bộ hệ thống + Frontend + Network)"]
    INT["20% Sliced & Integration Test<br/>(@WebMvcTest, @DataJpaTest, Testcontainers)"]
    UNIT["70% Unit Tests Thuần Túy<br/>(JUnit 5 + Mockito / Siêu nhanh: 10ms/test)"]
    
    E2E --> INT --> UNIT
    style UNIT fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style INT fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style E2E fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Ma Trận Lựa Chọn Chiến Lược Test)

### Ma Trận Lựa Chọn Công Cụ Kiểm Thử Cho Từng Tầng Spring Boot

| Tầng ứng dụng | Công cụ kiểm thử tối ưu | Thời gian chạy | Độ phụ thuộc hạ tầng |
|---|---|:---:|:---:|
| **Service Layer (Logic nghiệp vụ)** | ⭐ **JUnit 5 + Mockito** (Unit Test) | **~5 - 10 ms** | Không có (0 dependency) |
| **REST Controller (API Endpoint)** | \`@WebMvcTest\` + MockMvc | ~500 ms | Chỉ nạp tầng Web MVC |
| **Repository (JPA Query / SQL)** | \`@DataJpaTest\` + Testcontainers | ~2 - 4 s | Cần Docker nạp PostgreSQL thật |
| **Luồng E2E Đặt Hàng Hoàn Chỉnh** | \`@SpringBootTest\` (Full Context) | ~10 - 20 s | Nạp toàn bộ ứng dụng |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (Checklist Test Suite)

Dưới đây là một bộ Test Suite hoàn chỉnh cho một chức năng E-Commerce:

\`\`\`java
package vn.mastery.ecommerce;

import org.junit.platform.suite.api.SelectPackages;
import org.junit.platform.suite.api.Suite;
import org.junit.platform.suite.api.SuiteDisplayName;

@Suite
@SuiteDisplayName("Bộ Kiểm Thử Nghiệp Vụ Đơn Hàng Toàn Diện")
@SelectPackages("vn.mastery.ecommerce.service")
public class OrderTestSuite {
    // JUnit 5 Suite tự động gom và chạy toàn bộ Unit Tests trong package
}
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Checklist kiểm toán Unit Test chất lượng cao**:
   - [ ] 100% các class Service phải có Unit Test kiểm tra cả nhánh thành công và thất bại.
   - [ ] Không sử dụng \`@SpringBootTest\` cho các bài test logic tính toán đơn thuần.
   - [ ] Sử dụng \`ArgumentCaptor\` để bảo đảm dữ liệu lưu xuống Database không bị thiếu sót.
   - [ ] Không có bất kỳ cảnh báo \`UnnecessaryStubbingException\` nào khi chạy \`mvn test\`.
`;
}

// Refactor Lesson 4-2-1
const l421 = m4.lessons.find(l => l.id === "4-2-1");
if (l421) {
  l421.title = "Bài 4.2.1: Bản chất Sliced Testing (@WebMvcTest, @DataJpaTest) & Kiến trúc Testcontainers";
  l421.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã kỹ thuật **Sliced Testing (Cắt lát kiểm thử)**: Chỉ nạp một phần nhỏ của Spring Container thay vì nạp toàn bộ.
- Làm chủ annotation **\`@WebMvcTest\`** để kiểm tra Controller (Validation, HTTP Status, JSON Serialization).
- Hiểu kiến trúc đột phá của **Testcontainers**: Tự động kích hoạt Docker Container chứa Database thật lúc chạy test.
- Đọc hiểu 100% từng dòng code kiểm thử Controller qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: SLICED TESTING LÀ GÌ?
**Hình tượng "Cắt một lát bánh kem để nếm thử":**
- Bạn muốn kiểm tra xem lớp kem trên mặt bánh có ngon không (Kiểm tra tầng Web Controller):
- **Cách làm vụng về (\`@SpringBootTest\`)**: Bạn phải bê nguyên chiếc bánh cưới khổng lồ 5 tầng (nạp cả Service, Database, Kafka, Security, Email) lên bàn cân. Mất 15 giây khởi động và tốn 1GB RAM!
- **Cách làm thông minh (\`@WebMvcTest\`)**: Bạn chỉ dùng dao **cắt đúng một lát kem mỏng trên bề mặt**. Toàn bộ các tầng bên dưới được thay thế bằng hình nộm giả (\`@MockBean\`).
- Bài test chạy vèo trong **500 miligiây**, kiểm tra chính xác HTTP 200, 400 và định dạng JSON!
:::

---

## 1. Cái này là gì? (Kiến trúc Sliced Testing Trong Spring Boot)

Spring Boot cung cấp các annotation chuyên biệt để khởi tạo một góc nhỏ của \`ApplicationContext\`:

### Sơ Đồ Cắt Lát Ứng Dụng (Application Slicing Overview):

\`\`\`mermaid
flowchart TD
    subgraph APP["Toàn Bộ Ứng Dụng Spring Boot (@SpringBootTest)"]
        WEB["Tầng Web (@WebMvcTest)<br/>Controllers, Filters, Json"]
        SVC["Tầng Service<br/>Business Logic"]
        DATA["Tầng Data Access (@DataJpaTest)<br/>Repositories, Entities, Hibernate"]
    end
    WEB -.->|"Thay thế bằng"| M1["@MockBean Service"]
    DATA -.->|"Kết nối vào"| DOCKER["Testcontainers<br/>PostgreSQL Docker Thật"]
    style WEB fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style DATA fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style DOCKER fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi cần kiểm tra hợp đồng API REST (Validation payload, Status code) mà không muốn chạm vào Database:

### Ma trận So sánh: @SpringBootTest vs @WebMvcTest

| Tiêu chí | \`@SpringBootTest\` | \`@WebMvcTest\` |
|---|---|---|
| **Phạm vi nạp Bean** | Quét toàn bộ project (\`@Component\`, \`@Service\`, \`@Repository\`) | **Chỉ nạp**: \`@Controller\`, \`@ControllerAdvice\`, \`JsonComponent\` |
| **Thời gian khởi động** | Rất chậm (~10s - 20s) | **Siêu nhanh (~500ms - 1s)** |
| **Mục đích kiểm thử** | Tích hợp toàn diện luồng đi cuối cùng (End-to-End) | Kiểm tra Validation JSON, HTTP 200/400/404, Format ngày tháng |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Kiểm thử \`OrderController\` với \`@WebMvcTest\` và \`MockMvc\`:

\`\`\`java
package vn.mastery.ecommerce.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import vn.mastery.ecommerce.dto.CreateOrderRequest;
import vn.mastery.ecommerce.dto.OrderResponseDto;
import vn.mastery.ecommerce.service.OrderService;
import java.math.BigDecimal;
import java.util.List;
import static org.mockito.BDDMockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderService orderService;

    @Test
    @DisplayName("Gửi payload hợp lệ -> Trả về HTTP 201 Created kèm JSON chi tiết")
    void shouldCreateOrderSuccessfully() throws Exception {
        // Given
        var request = new CreateOrderRequest("CUST-100", List.of(), new BigDecimal("500000"));
        var response = new OrderResponseDto(1L, "CUST-100", new BigDecimal("500000"));
        given(orderService.processOrder(any())).willReturn(response);

        // When & Then
        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1L))
            .andExpect(jsonPath("$.customerId").value("CUST-100"))
            .andExpect(jsonPath("$.totalAmount").value(500000));
    }

    @Test
    @DisplayName("Gửi payload rỗng customerId -> Bị Validation chặn lại trả về HTTP 400 Bad Request")
    void shouldReturnBadRequestWhenCustomerIdIsBlank() throws Exception {
        var invalidRequest = new CreateOrderRequest("", List.of(), new BigDecimal("500000"));

        mockMvc.perform(post("/api/v1/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.title").value("Dữ liệu đầu vào không hợp lệ"));
    }
}
\`\`\`

### Bảng Giải Mã Các Thành Phần MockMvc:

| Đoạn mã | Cú pháp | Ý nghĩa kỹ thuật | Lợi ích kiểm thử |
|---|---|---|---|
| \`@WebMvcTest(OrderController.class)\` | Sliced Annotation | Chỉ khởi động đúng một Controller được chỉ định | Tiết kiệm tối đa RAM và CPU |
| \`@MockBean private OrderService orderService\` | Spring Mockito Bean | Tạo một Mock Bean và tự động tiêm vào ApplicationContext của Web | Controller gọi service sẽ nhận kết quả mock |
| \`mockMvc.perform(post(...))\` | Giả lập HTTP Call | Gửi HTTP Request ảo mà không cần mở socket cổng mạng thật | Kiểm tra toàn diện bộ lọc Filter, ControllerAdvice |
| \`jsonPath("$.id").value(1L)\` | JsonPath Assertion | Trích xuất và so sánh giá trị trong JSON response | Khẳng định hợp đồng API không bị lệch trường |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa lạm dụng \`@MockBean\` gây tải lại Context**:
   - Mỗi khi một test class có tập hợp \`@MockBean\` khác nhau, Spring bắt buộc phải phá bỏ Context cũ và nạp lại một Context mới từ đầu!
   - Nếu có 50 test class dùng các mock khác nhau, thời gian test sẽ bị kéo dài hàng phút!
   - Khắc phục: Giữ cấu hình \`@MockBean\` đồng nhất hoặc gom nhóm các class Controller test chung.
`;
}

// Refactor Lesson 4-2-2
const l422 = m4.lessons.find(l => l.id === "4-2-2");
if (l422) {
  l422.title = "Bài 4.2.2: Triển khai Integration Test với Testcontainers PostgreSQL Thật Chuẩn CI/CD";
  l422.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu tại sao dùng H2 In-Memory Database để test là "quả bom nổ chậm" giấu lỗi cú pháp SQL thật.
- Tự tay tích hợp **Testcontainers PostgreSQL** khởi chạy Docker container tự động trong quá trình chạy test.
- Sử dụng annotation **\`@ServiceConnection\`** mới nhất của Spring Boot 3.1+ để tự động cấu hình DataSource mà không cần viết file cấu hình.
- Đọc hiểu 100% từng dòng code kiểm thử Repository với cơ sở dữ liệu thật qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TESTCONTAINERS VS H2 IN-MEMORY
**Hình tượng "Lái máy bay mô hình bằng xốp vs Buồng lái giả lập phi công thật":**
- **H2 In-Memory Database giống như máy bay đồ chơi bằng xốp**:
  - Nó rất nhẹ, bay được trong phòng ngủ (chạy trong RAM Java).
  - Nhưng nó không có gió bão, không có động cơ phản lực thật. Nhiều câu lệnh SQL nâng cao của PostgreSQL (JSONB, CTE, Lock FOR UPDATE, Sequence) H2 không hề hiểu! Bạn test trên H2 thấy xanh lè, nhưng đẩy lên Production thì crash tan tành!
- **Testcontainers PostgreSQL giống như buồng lái giả lập chuyên nghiệp**:
  - Nó bật một chiếc container **PostgreSQL phiên bản 16 thật 100%**.
  - Mọi câu lệnh SQL, index, khóa bi quan, trigger đều chạy y hệt môi trường Production thật.
  - Khi test xong, nó tự động dọn dẹp và tiêu hủy container sạch sẽ!
:::

---

## 1. Cái này là gì? (Kiến trúc Testcontainers & Spring Boot 3.1+)

Testcontainers là thư viện Java điều khiển Docker daemon thông qua Docker API để khởi chạy các container phục vụ kiểm thử tích hợp (Integration Test).

### Sơ Đồ Kiến Trúc: Cơ Chế Tự Động Kết Nối Của @ServiceConnection

\`\`\`mermaid
flowchart LR
    TEST["Integration Test Execution"] -->|"@Container"| TC["Testcontainers Engine"]
    TC -->|"Docker API"| DOCKER["PostgreSQL 16 Container<br/>(Cổng ngẫu nhiên: 5432 -> 49152)"]
    DOCKER -.->|"@ServiceConnection tự dò cổng & user/pass"| DS["Spring Boot Dynamic DataSource"]
    TEST -->|"Spring Data JPA"| DS
    style DOCKER fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style DS fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi kiểm thử các câu truy vấn phức tạp, Native Query, Lock bi quan hoặc kiểm thử file migration Flyway:

### Ma trận So sánh: H2 In-Memory vs Testcontainers PostgreSQL

| Tiêu chí so sánh | H2 In-Memory Database | Testcontainers PostgreSQL |
|---|---|---|
| **Độ chân thực với Production** | ❌ Kém: Khác cú pháp hàm ngày tháng, thiếu JSONB, thiếu Locking thật | ⭐ **100% đồng nhất**: Chạy đúng phiên bản PostgreSQL trên production |
| **Kiểm thử script Flyway** | Thường xuyên báo lỗi do cú pháp SQL đặc thù của Postgres | Chạy script Flyway trơn tru hoàn hảo |
| **Yêu cầu môi trường** | Chỉ cần JVM | Cần cài Docker trên máy dev và runner CI/CD |
| **Thời gian khởi động** | ~50 miligiây | ~1.5 giây (Lần đầu), tái sử dụng cho các test sau |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là Integration Test kiểm thử Repository trên PostgreSQL thật với Spring Boot 3.3+:

\`\`\`java
package vn.mastery.ecommerce.repository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import vn.mastery.ecommerce.domain.Order;
import java.math.BigDecimal;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class OrderRepositoryTestcontainersTest {

    // Khởi tạo Docker Container PostgreSQL 16 thật
    @Container
    @ServiceConnection // Tính năng đột phá: Tự động map JDBC URL, username, password vào Spring Boot!
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private OrderRepository orderRepository;

    @Test
    @DisplayName("Kiểm tra lưu đơn hàng và truy vấn Native Query trên PostgreSQL thật")
    void shouldSaveAndQueryOnRealPostgres() {
        Order order = new Order("CUST-DOCKER", new BigDecimal("750000"));
        Order saved = orderRepository.save(order);

        assertNotNull(saved.getId());

        Optional<Order> found = orderRepository.findById(saved.getId());
        assertTrue(found.isPresent());
        assertEquals("CUST-DOCKER", found.get().getCustomerId());
    }
}
\`\`\`

### Bảng Giải Mã Các Thành Phần Đột Phá:

| Annotation / Khai báo | Ý nghĩa kỹ thuật | Lợi ích vượt trội |
|---|---|---|
| \`@Testcontainers\` | JUnit 5 Extension | Tự động quản lý vòng đời khởi động (\`start\`) và tắt (\`stop\`) Docker container |
| \`@ServiceConnection\` | Spring Boot 3.1+ Feature | **Tự động tiêm thông tin kết nối động** (DynamicPropertySource) vào DataSource mà không cần viết 1 dòng cấu hình yml nào! |
| \`Replace.NONE\` | Ngăn cản Spring thay thế DB | Ngăn chặn việc Spring tự động tráo đổi sang H2 nhúng |
| \`static PostgreSQLContainer\` | Khai báo biến static | Chia sẻ 1 container duy nhất cho tất cả các test method trong class, giảm 90% thời gian khởi động |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Cạm bẫy không khai báo \`static\` cho Container**:
   - Nếu bạn bỏ từ khóa \`static\`, Testcontainers sẽ **bật một container mới và tắt đi cho MỖI TEST METHOD**!
   - 10 test method sẽ bật tắt Docker 10 lần mất cả phút!
   - Luôn nhớ: **Luôn khai báo \`static\` cho đối tượng container** để tái sử dụng.
`;
}

// Refactor Lesson 4-2-3
const l423 = m4.lessons.find(l => l.id === "4-2-3");
if (l423) {
  l423.title = "Bài 4.2.3: Cạm bẫy H2 In-Memory Giấu Lỗi Production & Khởi Động Container Chậm";
  l423.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nhận diện 5 lỗi kinh điển "Chạy ngon trên H2 nhưng chết đứng trên PostgreSQL Production".
- Tối ưu hóa thời gian chạy Testcontainers bằng kỹ thuật **Singleton Container Pattern (Tái sử dụng 1 container duy nhất cho toàn bộ Test Suite)**.
- Kích hoạt tính năng **Testcontainers Reuse (\`.withReuse(true)\`)** để giữ container sống khi đang phát triển local.
- Đọc hiểu bảng so sánh thời gian thực thi của các mô hình nạp container.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TÁI SỬ DỤNG CONTAINER
**Hình tượng "Để lò sưởi luôn cháy thay vì nhóm lửa lại 100 lần":**
- Nếu mỗi khi cần nướng 1 chiếc bánh (1 test class), bạn lại đi kiếm củi, quẹt diêm nhóm lò từ đầu (bật Docker container mới): Bạn sẽ mất 100 lần nhóm lò, tốn hàng chục phút!
- **Singleton Container Pattern — "Chiếc lò nướng công nghiệp luôn đỏ lửa"**:
  - Bật chiếc lò nướng PostgreSQL một lần duy nhất lúc bắt đầu chạy bài test đầu tiên.
  - Sau đó cho cả 50 bài test cùng dùng chung chiếc lò đó.
  - Khi toàn bộ bài test kết thúc và tắt máy tính, người dọn dẹp (Ryuk container) mới tự động dập lửa và dọn sạch sẽ!
:::

---

## 1. Cái này là gì? (Triệu chứng Lỗi H2 Giấu Giếm)

Các hệ CSDL quan hệ khác nhau rất lớn về:
1. **Kiểu dữ liệu đặc thù**: H2 không có kiểu \`JSONB\`, không có kiểu mảng \`VARCHAR[]\` của PostgreSQL.
2. **Cú pháp hàm thời gian**: \`EXTRACT(EPOCH FROM ...)\`, \`NOW()\` vs \`CURRENT_TIMESTAMP\`.
3. **Cơ chế Khóa dòng**: H2 không mô phỏng chính xác \`SELECT ... FOR UPDATE SKIP LOCKED\`.

### Sơ Đồ So Sánh Thời Gian Chạy: Mở Mới Từng Class vs Singleton Pattern:

\`\`\`mermaid
flowchart TD
    subgraph BAD["Mở mới Container cho mỗi Class (Chậm chạp: 45s)"]
        B1["Test Class 1: Khởi động Docker (3s)"]
        B2["Test Class 2: Khởi động Docker (3s)"]
        B3["Test Class 3: Khởi động Docker (3s)..."]
    end
    subgraph GOOD["Singleton Container Pattern (Siêu tốc: 5s)"]
        G1["Khởi động 1 Docker duy nhất lúc đầu (2s)"]
        G1 --> G2["Class 1 dùng chung"]
        G1 --> G3["Class 2 dùng chung"]
        G1 --> G4["Class 3 dùng chung"]
    end
    style GOOD fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style BAD fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Kỹ Thuật Tối Ưu Tốc Độ CI/CD)

### Bảng Benchmark Thời Gian Thực Thi Khi Có 20 Test Classes:

| Phương pháp triển khai | Thời gian thực thi | Tài nguyên tiêu thụ |
|---|:---:|:---:|
| Khởi tạo Container riêng từng class | **48 giây** | Bật tắt Docker 20 lần liên tục |
| **Singleton Container Pattern** | **6.2 giây** | **Tiết kiệm 87% thời gian build CI/CD!** |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Cách thiết lập Base Integration Test dùng chung 1 Container duy nhất:

\`\`\`java
package vn.mastery.ecommerce;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;

// Class cha cơ sở: Mọi Integration Test đều kế thừa từ class này!
@SpringBootTest
public abstract class BaseIntegrationTest {

    // Khởi tạo một container duy nhất cho toàn bộ quá trình chạy JVM
    @ServiceConnection
    protected static final PostgreSQLContainer<?> postgresContainer;

    static {
        postgresContainer = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("test_db")
            .withUsername("test_user")
            .withPassword("test_pass")
            .withReuse(true); // Bật chế độ tái sử dụng container trên máy dev
        postgresContainer.start();
    }
}
\`\`\`

Các class con chỉ việc kế thừa và viết test thoải mái:

\`\`\`java
package vn.mastery.ecommerce.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import vn.mastery.ecommerce.BaseIntegrationTest;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ProductRepositoryIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private ProductRepository productRepository;

    @Test
    void testFindAll() {
        assertNotNull(productRepository.findAll());
    }
}
\`\`\`

### Bảng Giải Mã Khối Mã Khởi Tạo Tĩnh:

| Đoạn mã | Ý nghĩa kỹ thuật | Lợi ích vượt bậc |
|---|---|---|
| \`static { postgresContainer.start(); }\` | Khối static initializer | Chạy trước bất kỳ bài test nào và chỉ chạy đúng 1 lần trong suốt vòng đời JVM |
| \`.withReuse(true)\` | Bật cờ Testcontainers Reuse | Không tắt container khi test xong, giúp lần bấm test tiếp theo chạy ngay lập tức trong 0.1s |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Ô nhiễm dữ liệu giữa các bài test (Data Pollution)**:
   - Vì các bài test dùng chung 1 container database, nếu bài test A chèn dữ liệu mà không xóa, bài test B có thể bị sai lệch kết quả!
   - Khắc phục: Đặt annotation **\`@Transactional\`** trên method test để Spring tự động rollback dữ liệu sau mỗi bài test, hoặc dùng annotation \`@Sql\` với script dọn rác.
`;
}

// Refactor Lesson 4-2-4
const l424 = m4.lessons.find(l => l.id === "4-2-4");
if (l424) {
  l424.title = "Bài 4.2.4: Tổng Kết Thực Chiến: Bản Đồ Sliced Testing & Ma Trận Testcontainers vs Embedded DB";
  l424.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 4.2 thành Bản đồ chiến lược kiểm thử tích hợp.
- Nắm chắc ma trận quyết định khi nào dùng Sliced Test (\`@WebMvcTest\`, \`@DataJpaTest\`) và khi nào dùng Full Context.
- Tự tay xây dựng một pipeline kiểm thử hoàn chỉnh tích hợp Docker container trên GitHub Actions.
- Sẵn sàng bước sang Chuyên đề 4.3 (Kiểm thử Bất đồng bộ với Awaitility & Security Testing).
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỔNG KẾT BẢN ĐỒ TÍCH HỢP
Bạn vừa trang bị cho mình bộ áo giáp kiểm thử hiện đại nhất của kỹ sư Spring Boot 3:
1. **Tầng Web**: Dùng dao mổ tinh xảo **\`@WebMvcTest\`** kiểm tra từng trường dữ liệu JSON.
2. **Tầng Data**: Dùng xe tăng bọc thép **Testcontainers PostgreSQL 16 thật** để dập tắt mọi rủi ro lệch cú pháp SQL.
3. **Hiệu năng CI/CD**: Áp dụng **Singleton Container Pattern** giúp chạy hàng chục bài test chỉ trong vài giây.
Không còn nỗi sợ hãi mỗi khi deploy code lên môi trường thật!
:::

---

## 1. Cái này là gì? (Bản Đồ Kiến Trúc Sliced Testing)

### Sơ Đồ Toàn Cảnh: Lựa Chọn Kiểu Test Phù Hợp Từng Tầng

\`\`\`mermaid
flowchart TD
    A["Yêu cầu viết Kiểm Thử (Test Requirement)"] --> B{"Tầng nào trong hệ thống?"}
    B -->|"Tầng Controller (REST Contract / Validation)"| C["@WebMvcTest + MockMvc<br/>(Mock tầng Service bên dưới)"]
    B -->|"Tầng Repository (Database Queries / Flyway)"| D["@DataJpaTest + Testcontainers<br/>(Chạy trên PostgreSQL Docker thật)"]
    B -->|"Toàn bộ luồng nghiệp vụ xuyên suốt"| E["@SpringBootTest + Testcontainers<br/>(Full Integration Test)"]
    style C fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style D fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style E fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Ma Trận Quyết Định Kỹ Thuật)

### Ma Trận Lựa Chọn Cơ Chế Kiểm Thử Chuẩn Senior

| Mục tiêu kiểm thử | Công cụ chuẩn | Điểm kiểm tra cốt lõi |
|---|---|---|
| Kiểm tra annotation \`@NotBlank\`, \`@Positive\` trên DTO | \`@WebMvcTest\` | HTTP 400 Bad Request kèm ProblemDetails |
| Kiểm tra câu lệnh JPQL / Native Query phức tạp | \`@DataJpaTest\` + Testcontainers | Kết quả trả về từ PostgreSQL thật |
| Kiểm tra Transaction Rollback khi có lỗi | \`@DataJpaTest\` | Dữ liệu không bị commit lén |
| Kiểm tra luồng gọi từ HTTP tới ghi DB | \`@SpringBootTest\` | Khẳng định dòng chảy end-to-end thông suốt |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (GitHub Actions CI/CD Config)

Cấu hình file \`.github/workflows/ci.yml\` tự động chạy Testcontainers trên server CI:

\`\`\`yaml
name: Java CI/CD Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout mã nguồn
        uses: actions/checkout@v4

      - name: Cài đặt JDK 21 LTS
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      # GitHub Actions Ubuntu đã có sẵn Docker daemon cho Testcontainers!
      - name: Chạy kiểm thử toàn diện
        run: ./mvnw clean verify
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Checklist kiểm toán Sliced Testing**:
   - [ ] Đã thay thế hoàn toàn database H2 bằng Testcontainers PostgreSQL thật.
   - [ ] Sử dụng \`@ServiceConnection\` để cấu hình kết nối tự động.
   - [ ] Áp dụng Singleton Pattern kế thừa từ \`BaseIntegrationTest\`.
   - [ ] Đảm bảo Docker daemon hoạt động trên máy local dev.
`;
}

fs.writeFileSync(modulePath, "window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n" + JSON.stringify(m4, null, 2) + "\n);\n", "utf8");
console.log("Successfully refactored Module 4 Topics 4.1 & 4.2 (Lessons 4-1-1 to 4-2-4)!");
