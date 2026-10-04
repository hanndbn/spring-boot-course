const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module4.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m4 = window.COURSE_MODULES.find(m => m.id === 4);

// Refactor Lesson 4-3-1
const l431 = m4.lessons.find(l => l.id === "4-3-1");
if (l431) {
  l431.title = "Bài 4.3.1: Kiến trúc Kiểm thử Bất đồng bộ (Awaitility), Phân quyền Security & Kafka Broker";
  l431.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã bài toán hóc búa: **Kiểm thử tác vụ bất đồng bộ (Asynchronous Testing)** khi gửi event qua Kafka hoặc xử lý \`@Async\`.
- Hiểu tại sao dùng \`Thread.sleep()\` là "tội ác số 1" sinh ra các bài test chập chờn (Flaky Tests).
- Làm chủ thư viện **Awaitility** để thăm dò điều kiện (Polling Assertions) mượt mà và chính xác.
- Đọc hiểu 100% từng dòng code kiểm thử Event Consumer qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: AWAITILITY VS THREAD.SLEEP()
**Hình tượng "Chờ người giao bánh pizza":**
- Bạn đặt một chiếc pizza giao tận nhà (Tác vụ bất đồng bộ mất khoảng 2 đến 10 giây).
- **Cách làm tai hại (\`Thread.sleep(10000)\`)**:
  - Bạn bịt mắt đi ngủ cứng nhắc đúng 10 giây.
  - Nếu anh shipper giao tới lúc 2 giây: Bạn vẫn phí phạm nằm ngủ thêm 8 giây vô ích!
  - Nếu hôm trời mưa anh shipper giao mất 11 giây: Vừa mở mắt ra lúc 10s chưa thấy pizza -> Bạn lập tức gào lên báo lỗi test FAIL! Đây chính là **Flaky Test (Test chập chờn lúc pass lúc fail)**!
- **Cách làm thông minh (Awaitility Polling)**:
  - Bạn cứ mỗi 200 mili-giây lại liếc nhìn ra cửa một lần (\`pollInterval\`).
  - Hễ thấy bóng dáng anh shipper vừa tới nơi: **Nhận bánh và kết thúc bài test ngay lập tức**! Vừa siêu nhanh, vừa không bao giờ bị lỗi do lệch thời gian!
:::

---

## 1. Cái này là gì? (Kiến trúc Polling Cơ Chế Của Awaitility)

Awaitility là thư viện DSL chuyên dụng cho Java cho phép đồng bộ hóa và chờ đợi các thao tác bất đồng bộ thỏa mãn một điều kiện nhất định mà không gây lãng phí chu kỳ CPU.

### Sơ Đồ Cơ Chế Polling Thông Minh Của Awaitility:

\`\`\`mermaid
sequenceDiagram
    participant Test as Test Execution
    participant Await as Awaitility Engine
    participant Event as Background Async Worker
    
    Test->>Event: Kích hoạt xử lý ngầm (Async Task)
    Test->>Await: await().atMost(5s).untilAsserted(...)
    loop Mỗi 200ms (Poll Interval)
        Await->>Event: Đã xử lý xong chưa?
        alt Chưa xong (Văng AssertionError)
            Await-->>Await: Tiếp tục chờ...
        else ĐÃ XONG HOÀN TẤT
            Await-->>Test: Điều kiện thỏa mãn! PASS NGAY LẬP TỨC!
        end
    end
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi gửi sự kiện \`OrderCreatedEvent\` qua Kafka Broker và cần kiểm tra xem Email thông báo đã được gửi đi chưa:

### Ma trận So sánh: Thread.sleep() vs Awaitility

| Tiêu chí | Dùng \`Thread.sleep()\` | Dùng Awaitility |
|---|---|---|
| **Thời gian thực thi test** | Luôn chịu thời gian chờ tối đa (Lãng phí thời gian) | **Dừng ngay lập tức** khi điều kiện thỏa mãn |
| **Hiện tượng Flaky Test** | Rất cao khi server CI/CD bị nghẽn CPU | **0% Flaky**: Tự động co giãn theo ngưỡng \`atMost\` |
| **Thông báo lỗi khi thất bại** | Chung chung, không rõ tại sao fail | In ra chính xác điều kiện cuối cùng chưa thỏa mãn |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Kiểm thử tác vụ \`@Async\` gửi email xác nhận đơn hàng:

\`\`\`java
package vn.mastery.ecommerce.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import vn.mastery.ecommerce.notification.EmailSender;
import java.time.Duration;
import static org.awaitility.Awaitility.await;
import static org.mockito.BDDMockito.*;

@SpringBootTest
class AsyncNotificationTest {

    @Autowired
    private OrderEventConsumer orderEventConsumer;

    @MockBean
    private EmailSender emailSender;

    @Test
    @DisplayName("Gửi event đơn hàng -> Email phải được gửi bất đồng bộ trong vòng tối đa 3 giây")
    void shouldSendEmailAsynchronously() {
        // When: Kích hoạt nhận event
        orderEventConsumer.handleOrderCreated("ORDER-123", "customer@example.com");

        // Then: Dùng Awaitility thăm dò liên tục thay vì Thread.sleep
        await()
            .atMost(Duration.ofSeconds(3))
            .pollInterval(Duration.ofMillis(200))
            .untilAsserted(() -> {
                then(emailSender).should().sendOrderConfirmation(eq("ORDER-123"), anyString());
            });
    }
}
\`\`\`

### Bảng Giải Mã Cú Pháp Awaitility:

| Cú pháp Awaitility | Ý nghĩa kỹ thuật | Lợi ích kiểm thử |
|---|---|---|
| \`await().atMost(Duration.ofSeconds(3))\` | Thiết lập ngưỡng thời gian chờ tối đa | Nếu sau 3 giây mà điều kiện vẫn chưa đạt thì mới đánh rớt test |
| \`pollInterval(Duration.ofMillis(200))\` | Tần suất thăm dò trạng thái | Cứ mỗi 0.2s lại kiểm tra 1 lần, không làm nghẽn CPU |
| \`untilAsserted(() -> { ... })\` | Khối Assertion lặp | Bắt các ngoại lệ \`AssertionError\` và thử lại cho đến khi lệnh verify thành công |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Cấm tuyệt đối đặt \`Thread.sleep()\` trong code kiểm thử**:
   - Nếu phát hiện code test có \`Thread.sleep\`, hãy refactor ngay lập tức sang dùng \`await().untilAsserted()\`.
`;
}

// Refactor Lesson 4-3-2
const l432 = m4.lessons.find(l => l.id === "4-3-2");
if (l432) {
  l432.title = "Bài 4.3.2: Kiểm thử Spring Security Context & Event-Driven Consumer với Awaitility";
  l432.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Kiểm thử cơ chế phân quyền bảo mật: **\`@WithMockUser\`** và **\`@WithUserDetails\`** trong Spring Security 6.
- Kiểm tra tính bảo vệ của các endpoint: Khách vãng lai bị chặn (HTTP 401), Sai quyền bị từ chối (HTTP 403 Forbidden).
- Kiểm tra các phương thức bảo mật tầng Service với annotation \`@PreAuthorize\`.
- Đọc hiểu 100% từng dòng code kiểm thử bảo mật qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: @WITHMOCKUSER LÀ GÌ?
**Hình tượng "Chiếc thẻ bài giả lập thân phận":**
- Bạn muốn kiểm tra xem cánh cửa phòng Giám Đốc (Endpoint \`/api/admin/reports\`) có chặn người lạ không:
- **Cách không có thẻ bài (Ẩn danh)**: Đi thẳng vào cửa -> Cảnh vệ Spring Security chặn lại quát: *"Bạn là ai? Xuất trình thẻ!"* -> Nhận vé phạt **HTTP 401 Unauthorized**.
- **Cách đeo thẻ bài giả lập (\`@WithMockUser(roles = "USER")\`)**: Bạn xuất trình thẻ nhân viên bình thường -> Cảnh vệ kiểm tra: *"Thẻ hợp lệ nhưng phòng này chỉ dành cho ADMIN!"* -> Nhận vé phạt **HTTP 403 Forbidden**.
- **Cách đeo thẻ bài VIP (\`@WithMockUser(roles = "ADMIN")\`)**: Cánh cửa mở toang chào đón -> Nhận kết quả **HTTP 200 OK**!
:::

---

## 1. Cái này là gì? (Kiến trúc SecurityContextHolder Trong Unit Test)

Trong Spring Security, thông tin đăng nhập của người dùng được lưu trữ trong \`SecurityContextHolder\` gắn liền với Thread hiện tại. Annotation \`@WithMockUser\` tự động tạo một \`Authentication\` token giả lập và nạp vào SecurityContext trước khi test method chạy.

### Sơ Đồ Cơ Chế Nạp Thân Phận Của @WithMockUser:

\`\`\`mermaid
flowchart LR
    A["@Test @WithMockUser(username='admin', roles={'ADMIN'})"] --> B["SecurityMockTestExecutionListener"]
    B --> C["Tạo UsernamePasswordAuthenticationToken"]
    C --> D["Nạp vào SecurityContextHolder.getContext()"]
    D --> E["MockMvc thực thi gọi Controller / Service"]
    E --> F["SecurityFilterChain kiểm tra vai trò: PASS!"]
    style C fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style F fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Ma Trận Kiểm Thử Phân Quyền)

### Bảng Ma Trận Test Case Bảo Mật Bắt Buộc Trong E-Commerce

| Kịch bản kiểm thử | Thân phận thiết lập | Kết quả mong đợi |
|---|---|---|
| Khách chưa đăng nhập xem thông tin đơn hàng | Không dùng annotation (Anonymous) | **HTTP 401 Unauthorized** |
| Khách hàng bình thường cố tình gọi API xóa sản phẩm | \`@WithMockUser(roles = "CUSTOMER")\` | **HTTP 403 Forbidden** |
| Quản trị viên gọi API xóa sản phẩm | \`@WithMockUser(roles = "ADMIN")\` | **HTTP 200 OK / 204 No Content** |
| Nhân viên chăm sóc khách hàng chỉ đọc | \`@WithMockUser(authorities = "order:read")\` | **HTTP 200 OK** |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Kiểm thử phân quyền Endpoint Admin với \`MockMvc\`:

\`\`\`java
package vn.mastery.ecommerce.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminOrderController.class)
class AdminOrderSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Khách chưa đăng nhập -> Nhận lỗi 401 Unauthorized")
    void unauthenticatedUserShouldGet401() throws Exception {
        mockMvc.perform(delete("/api/admin/orders/1"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("User bình thường không có quyền ADMIN -> Nhận lỗi 403 Forbidden")
    @WithMockUser(username = "normal_user", roles = "CUSTOMER")
    void normalUserShouldGet403Forbidden() throws Exception {
        mockMvc.perform(delete("/api/admin/orders/1"))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Quản trị viên có role ADMIN -> Được phép xóa đơn hàng thành công")
    @WithMockUser(username = "admin_boss", roles = "ADMIN")
    void adminUserShouldBeAllowed() throws Exception {
        mockMvc.perform(delete("/api/admin/orders/1"))
            .andExpect(status().isOk());
    }
}
\`\`\`

### Bảng Giải Mã Cú Pháp Phân Quyền:

| Annotation | Tham số | Ý nghĩa kỹ thuật |
|---|---|---|
| \`@WithMockUser\` | \`roles = "ADMIN"\` | Spring Security tự động gắn tiền tố \`ROLE_ADMIN\` vào Authorities |
| \`@WithMockUser\` | \`authorities = "order:write"\` | Thiết lập quyền hạn chi tiết (Fine-grained Permission) theo chuẩn RBAC |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa quên làm sạch SecurityContext**:
   - Nếu bạn tự tay gọi \`SecurityContextHolder.getContext().setAuthentication(auth)\` trong code test, thông tin này có thể bị rò rỉ sang bài test tiếp theo!
   - Luôn sử dụng annotation **\`@WithMockUser\`** vì Spring sẽ tự động dọn sạch Context sau khi method test kết thúc.
`;
}

// Refactor Lesson 4-3-3
const l433 = m4.lessons.find(l => l.id === "4-3-3");
if (l433) {
  l433.title = "Bài 4.3.3: Cạm bẫy Thread Sleep Gây Flaky Test & Rò rỉ SecurityContext Giữa Các Test Case";
  l433.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải phẫu nguyên nhân sâu xa của "Bóng ma Flaky Test" phá nát độ tin cậy của quy trình CI/CD.
- Xử lý triệt để hiện tượng rò rỉ \`SecurityContext\` và dữ liệu rác trong các bài test chạy song song.
- Sử dụng annotation **\`@DirtiesContext\`** đúng nơi đúng lúc và hiểu rõ cái giá đắt đỏ về hiệu năng của nó.
- Đọc hiểu bảng phân tích triệu chứng lỗi ô nhiễm môi trường kiểm thử.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: RÒ RỈ NGỮ CẢNH VÀ FLAKY TEST
**Hình tượng "Căn phòng khách sạn không được dọn dẹp sau khi khách trả phòng":**
- Vị khách thứ nhất (Test Case A) là ADMIN. Anh ta bước vào phòng, bật đèn, để chìa khóa trên bàn (\`SecurityContextHolder\` lưu quyền ADMIN).
- Vị khách thứ nhất rời đi, nhưng nhân viên khách sạn **quên dọn phòng**!
- Vị khách thứ hai (Test Case B) là một kẻ trộm không có chìa khóa. Kẻ trộm bước vào phòng thấy chìa khóa ADMIN vẫn nằm nguyên trên bàn -> Tự do lấy đồ mà không bị bắt!
- Bài test B đáng lẽ phải FAIL thì lại báo XANH! Và khi chạy riêng một mình thì lại báo ĐỎ! Đây chính là thảm họa **Test Pollution (Ô nhiễm ngữ cảnh giữa các bài test)**!
:::

---

## 1. Cái này là gì? (Bản chất Ô Nhiễm ThreadLocal)

\`SecurityContextHolder\` mặc định lưu trữ dữ liệu trong biến \`ThreadLocal\`. Nếu luồng thực thi được tái sử dụng bởi Thread Pool mà không được gọi hàm \`SecurityContextHolder.clearContext()\`, dữ liệu xác thực của bài test trước sẽ lây nhiễm sang bài test sau.

### Sơ Đồ Cơ Chế Lây Nhiễm Ngữ Cảnh Qua ThreadLocal:

\`\`\`mermaid
flowchart TD
    T1["Test Case 1 (Set ADMIN)"] -->|"Ghi vào ThreadLocal"| THREAD["Worker Thread #1"]
    T1 -->|"Kết thúc nhưng QUÊN clear!"| THREAD
    THREAD -->|"Tái sử dụng cùng Thread #1"| T2["Test Case 2 (Anonymous Expected)"]
    T2 -->|"Đọc thấy quyền ADMIN cũ!"| ERR["LỖI SAI LỆCH KIỂM THỬ!<br/>(Test chạy lẻ thì pass, chạy cả suite thì fail)"]
    style ERR fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Cái Giá Của @DirtiesContext)

### Bảng Đánh Giá Đánh Đổi Kỹ Thuật (Trade-off Matrix)

| Biện pháp | Cách thức hoạt động | Ưu điểm | Nhược điểm |
|---|---|---|---|
| **\`@DirtiesContext\`** | Đập bỏ hoàn toàn ApplicationContext và nạp lại từ đầu | Đảm bảo sạch sẽ 100% | **CỰC KỲ CHẬM**: Làm thời gian chạy test tăng gấp 10 lần! |
| **Dọn dẹp thủ công \`@AfterEach\`** | Gọi \`SecurityContextHolder.clearContext()\` | **Siêu nhanh**, giữ nguyên Context tái sử dụng | Cần nhớ viết code dọn dẹp |
| **Dùng \`@WithMockUser\`** | Spring Security Test Listener tự dọn | ⭐ **Tối ưu nhất**: Tự động, sạch sẽ, không tốn tài nguyên | Không cần cấu hình thêm |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Cách viết dọn dẹp ngữ cảnh an toàn tuyệt đối:

\`\`\`java
package vn.mastery.ecommerce;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.context.SecurityContextHolder;
import static org.junit.jupiter.api.Assertions.assertNull;

class SafeSecurityCleanupTest {

    @AfterEach
    void tearDown() {
        // Luôn dọn sạch SecurityContext sau mỗi bài test nếu có can thiệp thủ công
        SecurityContextHolder.clearContext();
    }

    @Test
    void testCleanState() {
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hạn chế tối đa việc lạm dụng \`@DirtiesContext\`**:
   - Chỉ dùng \`@DirtiesContext\` khi bạn thực sự thay đổi một cấu hình Singleton Bean trong quá trình test mà không thể khôi phục lại.
`;
}

// Refactor Lesson 4-3-4
const l434 = m4.lessons.find(l => l.id === "4-3-4");
if (l434) {
  l434.title = "Bài 4.3.4: Tổng Kết Thực Chiến: Bản Đồ Kiểm Thử Bất Đồng Bộ & Ma Trận Đo Lường Test Stability";
  l434.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 4.3 thành Bản đồ đo lường độ ổn định của Test Suite (Test Stability).
- Nắm chắc 3 chỉ số cốt lõi đánh giá chất lượng test: **Tốc độ thực thi**, **Độ tin cậy (0% Flaky)** và **Tính độc lập**.
- Sẵn sàng bước sang Chuyên đề 4.4 (Architecture Testing cưỡng chế kiến trúc với ArchUnit).
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỔNG KẾT KIỂM THỬ BẤT ĐỒNG BỘ
Một bộ test suite chuyên nghiệp giống như một dàn nhạc giao hưởng:
- Mỗi nhạc công (Test Case) chơi đúng nốt của mình mà không làm ồn sang nhạc công bên cạnh (Tính cô lập độc lập).
- Nhịp phách được giữ chính xác từng mili-giây bằng Awaitility thay vì tiếng ngáy ngủ của Thread.sleep.
- Toàn bộ bản giao hưởng diễn ra mượt mà, uyển chuyển, sẵn sàng biểu diễn trước hàng triệu khán giả Production!
:::

---

## 1. Cái này là gì? (Bản Đồ Kiểm Thử Bất Đồng Bộ)

### Sơ Đồ Hệ Thống: Chuỗi Kiểm Thử Bất Đồng Bộ Chuẩn Enterprise

\`\`\`mermaid
flowchart TD
    A["Sự Kiện Bất Đồng Bộ (Async Event / Message)"] --> B{"Loại hình kiểm thử"}
    B -->|"Kiểm thử phân quyền"| C["@WithMockUser(roles = '...')"]
    B -->|"Kiểm thử Event Consumer"| D["Awaitility.await().untilAsserted(...)"]
    B -->|"Dọn dẹp môi trường"| E["SecurityContextHolder.clearContext()"]
    style C fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style D fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Ma Trận Tiêu Chuẩn Chất Lượng Test)

### Bảng Đo Lường Độ Ổn Định Test Suite (Test Health Metrics)

| Chỉ số sức khỏe | Ngưỡng đạt chuẩn Senior | Cách khắc phục nếu vi phạm |
|---|:---:|---|
| **Tỷ lệ Flaky Test (Lúc đỗ lúc trượt)** | **Đúng 0%** | Thay thế toàn bộ \`Thread.sleep\` bằng Awaitility |
| **Thời gian chạy Unit Test Suite** | **< 10 giây cho 500 tests** | Đảm bảo không nạp Spring Context trong Unit Test |
| **Tính độc lập thứ tự chạy** | **100% độc lập** (Chạy xáo trộn không fail) | Dọn sạch dữ liệu test và SecurityContext sau mỗi bài |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (Checklist Tự Động)

\`\`\`java
// Kiểm tra khả năng chạy ngẫu nhiên độc lập thứ tự
@TestMethodOrder(MethodOrderer.Random.class)
class OrderSuiteRandomOrderTest {
    // Nếu các test phụ thuộc lẫn nhau, việc chạy ngẫu nhiên sẽ phát hiện ngay lập tức!
}
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Checklist kiểm toán Asynchronous Test**:
   - [ ] 0 dòng lệnh \`Thread.sleep\` trong toàn bộ thư mục \`src/test/java\`.
   - [ ] Sử dụng \`@WithMockUser\` cho mọi bài test có dính líu đến bảo mật.
   - [ ] Kiểm thử khả năng chạy ngẫu nhiên thứ tự (\`MethodOrderer.Random\`).
`;
}

// Refactor Lesson 4-4-1
const l441 = m4.lessons.find(l => l.id === "4-4-1");
if (l441) {
  l441.title = "Bài 4.4.1: Kiến trúc Bytecode Analysis của ArchUnit & Triết lý Architecture as Code";
  l441.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu rõ triết lý **Architecture as Code (Kiến trúc dưới dạng mã nguồn)**: Biến các quy tắc thiết kế thành Unit Test tự động.
- Nắm vững cơ chế hoạt động của thư viện **ArchUnit**: Quét và phân tích Bytecode Java (.class) mà không cần nạp Spring ApplicationContext.
- Tự động chặn đứng các hành vi "phá hoại kiến trúc" ngay tại máy dev hoặc trên pipeline PR của GitHub.
- Đọc hiểu 100% từng dòng code định nghĩa quy tắc kiểm tra qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: ARCHUNIT LÀ GÌ?
**Hình tượng "Vị cảnh sát trưởng tự động gác cổng dự án":**
- Trưởng nhóm kiến trúc (Tech Lead) ra quy định: *"Tầng Controller chỉ được phép gọi Service, TUYỆT ĐỐI không được gọi thẳng vào Database Repository!"*.
- Tuy nhiên, một lập trình viên mới vào team, vì muốn làm nhanh cho xong việc, đã tiêm thẳng \`@Autowired OrderRepository\` vào trong \`OrderController\`!
- Khi review code bằng mắt thường, người khác có thể vô tình bỏ qua.
- **ArchUnit chính là vị cảnh sát trưởng tự động**:
  - Khi bạn gõ \`./mvnw test\`, ArchUnit quét toàn bộ file Bytecode \`.class\` trong 1 giây.
  - Hễ phát hiện bất kỳ Controller nào dính líu đến Repository, nó sẽ **đánh FAIL bài test ngay lập tức** kèm thông báo đanh thép: *"Vi phạm quy tắc Clean Architecture tại dòng 15 của OrderController!"*.
- Không một ai có thể merge code sai kiến trúc vào nhánh chính!
:::

---

## 1. Cái này là gì? (Kiến trúc Bytecode Analysis Trong ArchUnit)

ArchUnit không sử dụng Java Reflection thông thường mà đọc trực tiếp cấu trúc nhị phân của các file \`.class\` đã được biên dịch (dùng thư viện ASM), xây dựng nên đồ thị quan hệ giữa các Package, Class, Field và Method.

### Sơ Đồ Cơ Chế Quét Bytecode Của ArchUnit:

\`\`\`mermaid
flowchart LR
    A["Mã nguồn .java"] -->|"javac compile"| B["Bytecode .class Files"]
    B -->|"ClassFileImporter"| C["JavaClasses Graph (ArchUnit Memory)"]
    C -->|"Kiểm tra quy tắc ArchRule"| D{"Có vi phạm kiến trúc?"}
    D -->|"CÓ"| E["FAIL BUILD TRÊN CI/CD!<br/>(Chặn đứng PR phá vỡ kiến trúc)"]
    D -->|"KHÔNG"| F["PASS! Kiến trúc đảm bảo 100% chuẩn mực"]
    style E fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
    style F fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi dự án có nhiều thành viên cùng phát triển và cần duy trì sự chuẩn mực của Clean Architecture dài hạn:

### Ma trận So sánh: Review code bằng mắt vs Kiểm định tự động với ArchUnit

| Tiêu chí | Review code bằng mắt (Manual PR Review) | Dùng ArchUnit Test tự động |
|---|---|---|
| **Độ chính xác** | Dễ bị sót khi PR quá dài hàng nghìn dòng | **Chính xác 100%**: Soi từng dòng bytecode |
| **Chi phí thời gian** | Mất hàng giờ tranh luận trong lúc review | Chạy trong **chưa tới 1 giây** lúc build |
| **Tính cưỡng chế** | Dựa trên sự tự giác, dễ bị phá vỡ sau vài tháng | **Bắt buộc tuyệt đối**: Vi phạm là không thể build |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Định nghĩa quy tắc kiến trúc tầng với ArchUnit:

\`\`\`java
package vn.mastery.ecommerce.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

class ArchitectureRulesTest {

    private final JavaClasses importedClasses = new ClassFileImporter()
        .importPackages("vn.mastery.ecommerce");

    @Test
    @DisplayName("Quy tắc 1: Controller tuyệt đối không được phụ thuộc trực tiếp vào Repository")
    void controllersShouldNotDependOnRepositories() {
        ArchRule rule = noClasses()
            .that().resideInAPackage("..controller..")
            .should().dependOnClassesThat().resideInAPackage("..repository..");

        rule.check(importedClasses);
    }

    @Test
    @DisplayName("Quy tắc 2: Tên class kết thúc bằng Controller phải nằm trong package controller")
    void controllerNamesShouldBeConsistent() {
        ArchRule rule = classes()
            .that().haveSimpleNameEndingWith("Controller")
            .should().resideInAPackage("..controller..");

        rule.check(importedClasses);
    }
}
\`\`\`

### Bảng Giải Mã Cú Pháp Fluent API Của ArchUnit:

| Cú pháp ArchUnit | Ý nghĩa kỹ thuật | Quy tắc bảo vệ |
|---|---|---|
| \`noClasses().that().resideInAPackage("..controller..")\` | Lọc toàn bộ các class nằm trong package controller | Thiết lập phạm vi áp dụng quy tắc |
| \`.should().dependOnClassesThat().resideInAPackage("..repository..")\` | Định nghĩa hành vi bị cấm | Chặn đứng việc Controller tiêm hoặc gọi Repository |
| \`rule.check(importedClasses)\` | Kích hoạt quét và xác thực | Nếu có vi phạm, ném \`AssertionError\` chi tiết vị trí file và dòng lệnh sai |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa quét nhầm package test**:
   - Nếu bạn dùng \`importPackages("vn.mastery")\` mà không loại trừ thư mục test, ArchUnit sẽ quét luôn cả các class test (nơi thường xuyên gọi trực tiếp repo để chuẩn bị data) và báo lỗi nhầm!
   - Khắc phục: Sử dụng \`ImportOption.DoNotIncludeTests\` để chỉ quét mã nguồn sản xuất.
`;
}

// Refactor Lesson 4-4-2
const l442 = m4.lessons.find(l => l.id === "4-4-2");
if (l442) {
  l442.title = "Bài 4.4.2: Triển khai Bộ Quy Tắc ArchUnit Cưỡng Chế Clean Architecture & Layered Rules";
  l442.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Triển khai bộ quy tắc phân tầng hoàn chỉnh: **Layered Architecture Rule** bảo vệ 4 tầng: Web, Service, Persistence, Domain.
- Cưỡng chế các quy ước chuẩn Spring Boot: Class \`@Service\` phải đặt tên kết thúc bằng \`Service\`, không dùng Field Injection (\`@Autowired\` trên biến private).
- Đọc hiểu 100% từng dòng code cấu hình ArchUnit nâng cao qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: 4 TẦNG THÁC NƯỚC MỘT CHIỀU
**Hình tượng "Thác nước 4 tầng chỉ chảy một chiều":**
- Tầng 1: **Presentation Layer (Web Controller)** - Đỉnh thác.
- Tầng 2: **Business Layer (Service)** - Tầng giữa.
- Tầng 3: **Persistence Layer (Repository)** - Chân thác.
- Tầng 4: **Domain Layer (Entity & DTO)** - Lòng hồ nước trong lành.
- Nước chỉ được phép chảy xuôi: Web gọi Service, Service gọi Repository.
- **Quy tắc ArchUnit**: Tuyệt đối không cho phép nước chảy ngược lên đỉnh thác! Lòng hồ Domain không bao giờ được phụ thuộc vào bất kỳ tầng nào phía trên!
:::

---

## 1. Cái này là gì? (Kiến trúc LayeredArchitecture Trong ArchUnit)

ArchUnit cung cấp sẵn API \`architectures().layeredArchitecture()\` giúp mô hình hóa toàn bộ kiến trúc phân tầng chỉ trong vài dòng code:

### Sơ Đồ Phân Tầng Được Cưỡng Chế Bởi ArchUnit:

\`\`\`mermaid
flowchart TD
    WEB["Layer Web (Controller)"] -->|"Được phép gọi"| SVC["Layer Service"]
    SVC -->|"Được phép gọi"| REPO["Layer Persistence (Repository)"]
    WEB & SVC & REPO -->|"Được phép truy cập"| DOM["Layer Domain (Entities & DTOs)"]
    DOM -.->|"CẤM TUYỆT ĐỐI"| WEB
    DOM -.->|"CẤM TUYỆT ĐỐI"| SVC
    DOM -.->|"CẤM TUYỆT ĐỐI"| REPO
    style DOM fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style WEB fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

\`\`\`java
package vn.mastery.ecommerce.architecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noFields;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

@AnalyzeClasses(packages = "vn.mastery.ecommerce", importOptions = ImportOption.DoNotIncludeTests.class)
public class LayeredArchitectureTest {

    // Quy tắc phân tầng Clean Architecture toàn diện
    @ArchTest
    static final ArchRule layerDependenciesAreRespected = layeredArchitecture()
        .consideringAllDependencies()
        .layer("Web").definedBy("..controller..")
        .layer("Service").definedBy("..service..")
        .layer("Persistence").definedBy("..repository..")
        .layer("Domain").definedBy("..domain..", "..dto..")

        .whereLayer("Web").mayNotBeAccessedByAnyLayer()
        .whereLayer("Service").mayOnlyBeAccessedByLayers("Web")
        .whereLayer("Persistence").mayOnlyBeAccessedByLayers("Service")
        .whereLayer("Domain").mayOnlyBeAccessedByLayers("Web", "Service", "Persistence");

    // Cưỡng chế: CẤM DÙNG FIELD INJECTION (@Autowired trên field private)
    @ArchTest
    static final ArchRule noFieldInjection = noFields()
        .should().beAnnotatedWith("org.springframework.beans.factory.annotation.Autowired")
        .because("Bắt buộc phải dùng Constructor Injection để đảm bảo immutability và dễ viết test!");
}
\`\`\`

### Bảng Giải Mã Các Quy Tắc Cưỡng Chế:

| Khai báo ArchRule | Ý nghĩa kỹ thuật | Lợi ích hệ thống |
|---|---|---|
| \`whereLayer("Service").mayOnlyBeAccessedByLayers("Web")\` | Chỉ có tầng Web mới được gọi Service | Chặn việc các tầng lạ bên ngoài chọc thẳng vào Service |
| \`whereLayer("Persistence").mayOnlyBeAccessedByLayers("Service")\` | Chỉ có Service mới được gọi Repository | Chặn đứng hoàn toàn việc Controller gọi tắt Repository |
| \`noFieldInjection\` | Cấm dùng \`@Autowired\` trên field | Ép buộc 100% thành viên trong team phải dùng Constructor Injection chuẩn mực |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Gắn ArchUnit vào vòng đời build tự động**:
   - Chỉ cần đặt class này trong thư mục \`src/test/java\`.
   - Mỗi lần gõ \`mvn test\`, toàn bộ quy tắc kiến trúc sẽ được tự động rà soát trong 1 giây!
`;
}

// Refactor Lesson 4-4-3
const l443 = m4.lessons.find(l => l.id === "4-4-3");
if (l443) {
  l443.title = "Bài 4.4.3: Cạm bẫy Bỏ qua Quy tắc Kiểm tra Package & Code Coverage Ảo 100% Không Có Assert";
  l443.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nhận diện cạm bẫy "Code Coverage ảo 100%": Chạy qua hết các dòng lệnh nhưng không hề có câu lệnh \`assert\` nào.
- Hiểu tại sao dùng công cụ **Mutation Testing (PITest)** là giải pháp tối thượng để vạch trần các bài test vô dụng.
- Nắm vững cách cấu hình ngưỡng Code Coverage thực chất trong Maven với plugin **JaCoCo**.
- Đọc hiểu bảng phân tích các loại test rác và cách phòng chống.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BẪY CODE COVERAGE ẢO
**Hình tượng "Chạy xe qua các tuyến phố nhưng nhắm tịt mắt":**
- Lập trình viên Nam muốn đạt chỉ tiêu công ty: "Code Coverage phải trên 90%".
- Nam viết bài test: Gọi \`orderService.checkout()\` từ đầu đến cuối.
- Dòng code chạy qua 100% các dòng lệnh trong Service. JaCoCo đo được: **Xanh lè 100% Coverage**!
- Nhưng trong bài test, Nam **không hề viết một dòng \`assertEquals\` nào cả**!
- Hôm sau, một đồng nghiệp vô tình sửa đổi công thức tính tiền: \`total = 0\`. Bài test của Nam **vẫn chạy qua bình thường và vẫn báo XANH 100%**!
- Coverage cao không có nghĩa là test có giá trị nếu thiếu những câu Assertion đanh thép!
:::

---

## 1. Cái này là gì? (Bản chất Mutation Testing & JaCoCo)

Mutation Testing (như công cụ PITest) hoạt động bằng cách cố tình chèn lỗi vào mã nguồn (đổi dấu \`+\` thành \`-\`, xóa lệnh gọi hàm, đổi điều kiện \`>\` thành \`<\`). Nếu bộ test của bạn không phát hiện ra lỗi (Test không bị FAIL), con "Mutant" đó đã sống sót -> Chứng tỏ bài test của bạn là **vô dụng**!

### Sơ Đồ Cơ Chế Vạch Trần Test Ảo Của Mutation Testing:

\`\`\`mermaid
flowchart TD
    A["Mã nguồn Service: total = price * quantity"] --> B["PITest tạo Mutant cố tình phá hoại: total = price + quantity"]
    B --> C["Chạy Test Suite hiện tại"]
    C --> D{"Bài test có bị FAIL không?"}
    D -->|"CÓ (Test phát hiện ra lỗi)"| E["MUTANT KILLED!<br/>(Bài test chất lượng thực sự)"]
    D -->|"KHÔNG (Test vẫn báo xanh!)"| F["MUTANT SURVIVED!<br/>(Cảnh báo: Test ảo không có Assert!)"]
    style E fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style F fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Cấu Hình Ngưỡng JaCoCo Chuẩn)

### Cấu hình JaCoCo ép buộc ngưỡng Coverage trong \`pom.xml\`:

\`\`\`xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.12</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>check-coverage</id>
            <goals>
                <goal>check</goal>
            </goals>
            <configuration>
                <rules>
                    <rule>
                        <element>PACKAGE</element>
                        <limits>
                            <!-- Ép buộc độ phủ nhánh (Branch Coverage) phải đạt tối thiểu 80% -->
                            <limit>
                                <counter>BRANCH</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Nguyên tắc vàng của Assertion**:
   - Một bài test không có Assertion hoặc Verification là một bài test vô nghĩa.
   - Luôn kiểm tra cả kết quả trả về (\`assertEquals\`) và hành vi tương tác (\`then().should()\`).
`;
}

// Refactor Lesson 4-4-4
const l444 = m4.lessons.find(l => l.id === "4-4-4");
if (l444) {
  l444.title = "Bài 4.4.4: Tổng Kết Thực Chiến: Bản Đồ Kiến Trúc ArchUnit & Ma Trận Tiêu Chuẩn Chất Lượng CI/CD";
  l444.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Module 4 thành Bản đồ Chiến lược Kiểm thử Chất lượng Toàn diện (QA Pipeline).
- Nắm chắc checklist 6 tiêu chuẩn vàng của một bộ Test Suite đạt chuẩn Senior.
- Sẵn sàng bước sang Module 5 (Bảo Mật Chuyên Sâu: Spring Security 6, Stateless JWT & Keycloak SSO).
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỔNG KẾT MODULE 4
Bạn vừa xây dựng xong "Tấm lá chắn bất khả xâm phạm" cho toàn bộ hệ thống:
1. **Tầng đáy**: Hàng trăm Unit Tests chạy trong 1 giây với **JUnit 5 & Mockito**.
2. **Tầng giữa**: Kiểm thử Web tinh gọn với **@WebMvcTest** và Database thật với **Testcontainers PostgreSQL**.
3. **Tầng bất đồng bộ**: Xóa sổ Flaky Test bằng **Awaitility** và kiểm tra bảo mật bằng **@WithMockUser**.
4. **Vị cảnh sát trưởng**: Tự động cưỡng chế Clean Architecture bằng **ArchUnit**.
Mã nguồn của bạn giờ đây đã sẵn sàng đối đầu với bất kỳ đợt kiểm toán kỹ thuật nào!
:::

---

## 1. Cái này là gì? (Bản Đồ Toàn Cảnh Module 4)

### Sơ Đồ Kiến Trúc Toàn Diện: Hệ Thống Kiểm Thử Đa Tầng Enterprise

\`\`\`mermaid
graph TD
    subgraph M4["MODULE 4: TESTING CHUYÊN NGHIỆP"]
        T1["Chuyên Đề 4.1: Unit Testing & Mockito 5<br/>(BDDMockito, ArgumentCaptor, Strict Stubs)"]
        T2["Chuyên Đề 4.2: Sliced Testing & Testcontainers<br/>(@WebMvcTest, PostgreSQL Container, Singleton)"]
        T3["Chuyên Đề 4.3: Async & Security Testing<br/>(Awaitility Polling, @WithMockUser)"]
        T4["Chuyên Đề 4.4: Architecture as Code<br/>(ArchUnit Rules, Clean Architecture Guard)"]
    end
    
    T1 --> T2 --> T3 --> T4
    T4 ==> NEXT["MODULE 5: BẢO MẬT JWT & KEYCLOAK<br/>(Spring Security 6, OAuth2 Resource Server)"]
    style M4 fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style NEXT fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Checklist tốt nghiệp Module 4**:
   - [ ] Nắm vững cách viết Unit Test với Mockito và ArgumentCaptor.
   - [ ] Kiểm thử Controller bằng \`@WebMvcTest\` và MockMvc.
   - [ ] Chạy Integration Test trên PostgreSQL Docker thật bằng Testcontainers.
   - [ ] Dùng Awaitility cho toàn bộ tác vụ bất đồng bộ.
   - [ ] Cưỡng chế Clean Architecture bằng ArchUnit Test.
`;
}

fs.writeFileSync(modulePath, "window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n" + JSON.stringify(m4, null, 2) + "\n);\n", "utf8");
console.log("Successfully refactored Module 4 Topics 4.3 & 4.4 (Lessons 4-3-1 to 4-4-4)!");
