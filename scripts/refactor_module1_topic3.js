const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module1.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m1 = window.COURSE_MODULES[0];

// Refactor Lesson 1-3-1
const l131 = m1.lessons.find(l => l.id === "1-3-1");
if (l131) {
  l131.title = "Bài 1.3.1: Kiến trúc Spring AOP, Vòng Đời Dynamic Proxy (JDK vs CGLIB) & Pointcut Expression";
  l131.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu bản chất các "annotation ma thuật" \`@Transactional\`, \`@Async\`, \`@Secured\` thực chất được vận hành bởi Spring AOP Dynamic Proxy.
- Phân biệt sự khác nhau giữa JDK Dynamic Proxy (dựa trên Interface) và CGLIB Proxy (sinh bytecode kế thừa class con).
- Nắm vững các khái niệm cốt lõi: Aspect, Pointcut, JoinPoint, Advice (\`@Before\`, \`@After\`, \`@Around\`).
- Đọc hiểu từng dòng code của một Aspect đo lường hiệu năng API qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CỬA AN NINH SÂN BAY (SPRING AOP)
Hãy tưởng tượng hành khách lên máy bay là **hàm xử lý thanh toán tiền** (\`processPayment()\`).
- **Nếu KHÔNG CÓ AOP**: Trong hàm thanh toán tiền, bạn phải tự viết code: kiểm tra vé (Bảo mật), cân hành lý (Validation), ghi sổ nhật ký (Logging), và chốt cửa (Transaction). Hàm thanh toán tiền biến thành một bãi rác code khổng lồ!
- **KHI CÓ Spring AOP**: Hàm thanh toán tiền chỉ lo duy nhất việc trừ tiền. Spring dựng một **Cổng kiểm soát an ninh (Aspect / Dynamic Proxy)** đứng chặn ngay trước cửa:
  - Trước khi vào: Cổng kiểm tra token đăng nhập (\`@Before\` / \`@Secured\`).
  - Lúc bắt đầu: Mở phiên ghi sổ kế toán (\`@Around\` / \`@Transactional\`).
  - Nếu có bom mìn (Exception): Kích hoạt còi báo động và đảo ngược giao dịch (\`@AfterThrowing\` Rollback).
  - Sau khi xong: Đóng sổ và in hóa đơn (\`@AfterReturning\`).
=> Mã nguồn nghiệp vụ của bạn sạch sẽ 100%, không bị vấy bẩn bởi các logic phụ trợ!
:::

---

## 1. Cái này là gì? (Bản chất Dynamic Proxy trong Spring Boot)

Spring không trực tiếp đưa instance thực của Service cho Controller gọi. Thay vào đó, ở bước \`BeanPostProcessor.postProcessAfterInitialization\`, Spring tạo ra một **Đối tượng Đại Diện (Dynamic Proxy)** bọc ngoài instance thực.

### Sơ Đồ Kiến Trúc: Chuỗi Chặn Bắt Yêu Cầu AOP Dynamic Proxy

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as Controller Thread
    participant Proxy as Dynamic Proxy (CGLIB / JDK)
    participant Aspect as PerformanceAspect (@Around)
    participant Target as OrderPaymentService (Bean Thực)

    Client->>Proxy: Gọi payOrder(orderId, amount)
    Proxy->>Aspect: Kích hoạt @Around advice
    Note over Aspect: Ghi nhận startTime = System.currentTimeMillis()
    Aspect->>Target: joinPoint.proceed() (Ủy nhiệm cho Bean thực thi)
    Target-->>Aspect: Trả về kết quả PaymentResult
    Note over Aspect: duration = System.currentTimeMillis() - startTime
    Note over Aspect: Ghi log: [SLOW QUERY ALERT] nếu duration > 500ms
    Aspect-->>Proxy: Trả kết quả
    Proxy-->>Client: Client nhận PaymentResult
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### Ma trận So sánh: JDK Dynamic Proxy vs CGLIB Proxy

| Tiêu chí kỹ thuật | JDK Dynamic Proxy | CGLIB Dynamic Proxy |
|---|---|---|
| **Cơ chế hoạt động** | Sử dụng \`java.lang.reflect.Proxy\`, yêu cầu class phải implement **Interface** | Sử dụng thư viện Bytecode sinh class con kế thừa class gốc |
| **Hạn chế** | Không thể proxy các method không nằm trong Interface | Không thể proxy các class hoặc method có từ khóa \`final\` |
| **Cấu hình Spring Boot 3** | Cần bật cờ \`spring.aop.proxy-target-class=false\` | ⭐ **Mặc định 100% trong Spring Boot**: \`proxy-target-class=true\` |
| **Lỗi phổ biến** | \`ClassCastException\` khi ép kiểu bean proxy về class cụ thể | Bị lỗi khi khai báo \`final class\` hoặc \`final method\` |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là một Aspect đo lường thời gian thực thi của mọi Service thanh toán E-Commerce:

\`\`\`java
package vn.mastery.ecommerce.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class PaymentExecutionTimeAspect {

    @Pointcut("execution(* vn.mastery.ecommerce.service.*Service.*(..))")
    public void allServiceMethods() {}

    @Around("allServiceMethods()")
    public Object measureExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().toShortString();

        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - start;
            if (duration > 300) {
                System.err.println("[CẢNH BÁO CHẬM] " + methodName + " thực thi mất: " + duration + " ms");
            }
            return result;
        } catch (Throwable ex) {
            System.err.println("[LỖI NÉM RA TỪ] " + methodName + ": " + ex.getMessage());
            throw ex; // BẮT BUỘC ném lại exception để không nuốt chửng lỗi
        }
    }
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Container |
|---|---|---|---|
| Dòng 9 | \`@Aspect\` | Đánh dấu class là một Aspect của AspectJ | Spring nhận diện và phân tích các Pointcut / Advice bên trong |
| Dòng 10 | \`@Component\` | Đăng ký Aspect làm Spring Bean | Cần thiết để Spring nạp class này vào \`ApplicationContext\` |
| Dòng 13 | \`@Pointcut("execution(...)")\` | Định nghĩa biểu thức định vị method cần chặn | Chặn tất cả các method công khai trong mọi class có đuôi \`Service\` |
| Dòng 16 | \`@Around("allServiceMethods()")\` | Advice quyền lực nhất: bao bọc cả trước và sau method | Toàn quyền kiểm soát thời điểm chạy, kết quả trả về hoặc hủy bỏ method |
| Dòng 17 | \`ProceedingJoinPoint joinPoint\` | Đại diện cho phương thức đang bị chặn bắt | Cung cấp thông tin tên hàm, tham số đầu vào và quyền cho phép chạy tiếp |
| Dòng 22 | \`Object result = joinPoint.proceed();\` | Kích hoạt method nghiệp vụ thực sự chạy | Chạy mã nguồn gốc của Service và nhận lại kết quả trả về |
| Dòng 30 | \`throw ex;\` | Ném lại ngoại lệ bắt được | Bắt buộc phải có để Spring Transaction Manager nhận diện lỗi và kích hoạt Rollback |

---

## 4. Cạm bẫy thực tế & Best Practices (Senior Trap Guide)

:::danger CẠM BẪY CHẾT NGƯỜI: NUỐT CHỬNG NGOẠI LỆ TRONG @Around
- **Lỗi kinh điển**: Trong khối \`catch (Throwable ex)\`, nhiều dev chỉ viết \`log.error(ex)\` rồi return \`null\` mà không \`throw ex;\`.
- **Hậu quả thảm khốc**: \`@Transactional\` đứng ở lớp proxy bên ngoài thấy method trả về bình thường (không có Exception văng ra) -> **Commit thành công đơn hàng lỗi vào cơ sở dữ liệu**! Tiền bị trừ nhưng đơn hàng không được ghi nhận!
- **Quy tắc vàng**: Luôn luôn re-throw ngoại lệ trong mọi \`@Around\` advice trừ khi bạn cố ý nuốt lỗi theo tài liệu nghiệp vụ.
:::
`;
}

// Refactor Lesson 1-3-2
const l132 = m1.lessons.find(l => l.id === "1-3-2");
if (l132) {
  l132.title = "Bài 1.3.2: Xây dựng Production Aspect Giám Sát Hiệu Năng & Phân Quyền E-Commerce";
  l132.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tự thiết kế Custom Annotation: \`@TrackExecutionTime\` và \`@RequireRole\`.
- Xây dựng Aspect chặn bắt chính xác theo Annotation thay vì viết biểu thức Pointcut phức tạp.
- Trích xuất thông tin tham số đầu vào, User Context và HTTP Session trong Aspect.
- Đọc hiểu toàn bộ mã nguồn Aspect phân quyền và đo lường qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CON DẤU ĐỎ CỦA THƯ KÝ TRƯỞNG
Thay vì phải nhớ quy tắc *"Tất cả các file trong phòng kế toán đều phải kiểm tra"*, bạn tạo ra một **Con dấu đỏ đặc biệt**: \`@TrackExecutionTime\` và \`@RequireRole\`.
- Bất kỳ hồ sơ nào được dập con dấu này lên đầu, thư ký an ninh ở cửa (Aspect) sẽ tự động kiểm tra giấy tờ tùy thân và bấm đồng hồ bấm giờ!
- Giúp mã nguồn cực kỳ trực quan: Nhìn vào hàm là biết ngay hàm này được bảo vệ bởi lớp an ninh nào!
:::

---

## 1. Cái này là gì? (Custom Annotation-Driven AOP)

Thay vì dùng \`execution(* com.service.*(..))\` dễ bị gãy khi đổi tên package, chuẩn Senior trong dự án lớn luôn sử dụng **Annotation-Driven Pointcut** (\`@annotation(vn.mastery.TrackExecutionTime)\`).

### Sơ Đồ Luồng: Chặn Bắt Bằng Custom Annotation

\`\`\`mermaid
flowchart TD
    Req["HTTP Request: POST /api/v1/orders/checkout"] --> Filter["Security Filter: Nạp User Context"]
    Filter --> Proxy["Service Proxy"]
    Proxy --> CheckAnn{"Method có gắn<br/>@RequireRole('ADMIN')?"}
    CheckAnn -- NO --> Direct["Thực thi bình thường"]
    CheckAnn -- YES --> Aspect["AuthorizeAspect.checkPermission()"]
    Aspect --> Verify{"User có role ADMIN?"}
    Verify -- NO --> Block["Ném AccessDeniedException (HTTP 403)"]
    Verify -- YES --> Proceed["joinPoint.proceed() -> Gọi Service"]

    style CheckAnn fill:#1e3a8a,stroke:#3b82f6,color:#fff
    style Block fill:#7c2d12,stroke:#f97316,color:#fff
    style Proceed fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### So sánh: Pointcut Theo Package vs Pointcut Theo Annotation

| Tiêu chí | Pointcut Theo Package (\`execution\`) | Pointcut Theo Annotation (\`@annotation\`) |
|---|---|---|
| **Độ linh hoạt** | Kém: Áp dụng cứng nhắc cho toàn bộ class trong package | ⭐ **Rất cao**: Thích áp dụng cho method nào chỉ cần gắn annotation lên method đó |
| **Tính bền vững** | Dễ gãy: Khi dev refactor đổi tên package, Aspect ngừng hoạt động trong im lặng | ⭐ **Bất biến**: Dù chuyển class đi đâu, annotation vẫn giữ nguyên hiệu lực |
| **Độ rõ ràng (Clarity)** | Người đọc code nhìn vào method không biết hàm này có Aspect bọc ngoài hay không | ⭐ **Rõ ràng 100%**: Nhìn thấy ngay \`@RequireRole("ADMIN")\` trên đầu method |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

### Bước 1: Khai báo Custom Annotation
\`\`\`java
package vn.mastery.ecommerce.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireRole {
    String value(); // Role yêu cầu, ví dụ: "ADMIN", "SUPERVISOR"
}
\`\`\`

### Bước 2: Viết Aspect Chặn Bắt
\`\`\`java
package vn.mastery.ecommerce.security;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class SecurityRoleAspect {

    @Before("@annotation(requireRole)")
    public void enforceSecurityRole(JoinPoint joinPoint, RequireRole requireRole) {
        String requiredRole = requireRole.value();
        String currentUserRole = SecurityContextHolderMock.getCurrentUserRole();

        if (!requiredRole.equalsIgnoreCase(currentUserRole)) {
            throw new SecurityException("Từ chối truy cập! Yêu cầu quyền: " + requiredRole + 
                                       " nhưng tài khoản hiện tại là: " + currentUserRole);
        }
    }
}

class SecurityContextHolderMock {
    public static String getCurrentUserRole() { return "CUSTOMER"; } // Giả lập người dùng hiện tại
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Spring |
|---|---|---|---|
| Dòng 8 | \`@Target(ElementType.METHOD)\` | Giới hạn phạm vi đặt annotation | Chỉ cho phép gắn annotation lên phương thức, không gắn lên class |
| Dòng 9 | \`@Retention(RetentionPolicy.RUNTIME)\` | Giữ lại annotation lúc runtime | Bắt buộc phải có để Spring Reflection và AOP đọc được lúc ứng dụng đang chạy |
| Dòng 19 | \`@Before("@annotation(requireRole)")\` | Chặn trước khi method chạy và bind annotation vào tham số | Lấy trực tiếp instance của \`RequireRole\` truyền vào tham số thứ 2 của hàm |
| Dòng 21 | \`requireRole.value()\` | Lấy giá trị tham số cấu hình | Trích xuất chuỗi role cần kiểm tra (ví dụ: \`ADMIN\`) |
| Dòng 25 | \`throw new SecurityException(...)\` | Ném lỗi chặn đứng cuộc gọi | Ngăn chặn việc thực thi Service gốc, bảo vệ tuyệt đối dữ liệu nhạy cảm |

---

## 4. Cạm bẫy thực tế & Best Practices (Senior Trap Guide)

:::danger LẠM DỤNG AOP LÀM MÃ NGUỒN BIẾN THÀNH "HỘP ĐEN"
- AOP rất mạnh nhưng nếu lạm dụng cho cả logic nghiệp vụ cốt lõi (Business Logic), luồng chạy của chương trình sẽ trở nên vô hình và cực kỳ khó debug.
- **Nguyên tắc Senior**: Chỉ dùng AOP cho các **Cross-Cutting Concerns** (Các mối quan tâm xuyên suốt):
  1. Bảo mật & Phân quyền (Security)
  2. Ghi vết kiểm toán & Nhật ký (Audit Logging & Tracing)
  3. Đo lường hiệu năng (Performance Metrics)
  4. Quản lý giao dịch (Transaction Management)
  5. Giới hạn tần suất gọi API (Rate Limiting)
:::
`;
}

// Refactor Lesson 1-3-3
const l133 = m1.lessons.find(l => l.id === "1-3-3");
if (l133) {
  l133.title = "Bài 1.3.3: Cạm bẫy Self-Invocation Làm Mất Proxy (@Transactional Không Hoạt Động) & Lạm Dụng AOP";
  l133.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã lỗi kinh điển bậc nhất trong thế giới Spring: **Self-Invocation (Tự gọi nội bộ)** làm vô hiệu hóa hoàn toàn \`@Transactional\`, \`@Async\`, \`@Cacheable\`.
- Hiểu rõ cơ chế \`this.method()\` gọi thẳng trên instance thực thay vì đi qua Dynamic Proxy.
- Nắm vững 3 giải pháp xử lý triệt để: Tách class riêng (Clean Architecture), Dùng \`ObjectProvider<Self>\`, và Cấu hình AspectJ Weaving.
- Đọc hiểu toàn bộ mã nguồn sửa lỗi qua Bảng phân tích từng dòng code chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỰ GỌI ĐIỆN CHO CHÍNH MÌNH (SELF-INVOCATION)
Hãy tưởng tượng **Dynamic Proxy** là **Người thư ký an ninh** đứng ở cửa văn phòng:
- Khi Khách hàng bên ngoài (Controller) gọi tới bạn: Khách hàng phải bước qua cửa văn phòng -> Thư ký an ninh kiểm tra giấy tờ, bấm giờ, ghi sổ nhật ký (\`@Transactional\`).
- Nhưng khi **bạn đang ngồi trong phòng**, bạn tự quay sang nói chuyện với chính mình (\`this.methodB()\`) hoặc tự làm việc: Bạn **không hề bước qua cửa văn phòng**!
=> **Hậu quả**: Thư ký an ninh hoàn toàn không biết bạn đang làm gì! Tất cả các con dấu \`@Transactional\`, \`@Async\` trên \`methodB()\` bị bỏ qua 100%!
:::

---

## 1. Cái này là gì? (Bản chất kỹ thuật của lỗi Self-Invocation)

### Sơ Đồ Kiến Trúc: Cơ Chế Bỏ Qua Proxy Khi Gọi Nội Bộ (Bypass Proxy)

\`\`\`mermaid
flowchart TD
    subgraph Bug ["CẠM BẪY SẢN XUẤT: Gọi Nội Bộ (this.methodB)"]
        Client["Client / Controller"] -->|Bước qua cửa| Proxy["Service Proxy"]
        Proxy -->|Ủy nhiệm| Target["Service Bean Thật: methodA()"]
        Target -->|❌ GỌI NỘI BỘ: this.methodB()| TargetB["methodB() (@Transactional)"]
        NoteB["KHÔNG BƯỚC QUA PROXY!<br/>=> @Transactional BỊ VÔ HIỆU HÓA HOÀN TOÀN!"]
        TargetB -.-> NoteB
    end

    subgraph Fixed ["GIẢI PHÁP SENIOR: Tách Class Riêng (Clean Architecture)"]
        Client2["Client"] --> ProxyA["ServiceA Proxy"]
        ProxyA --> TargetA["ServiceA: methodA()"]
        TargetA -->|✅ Gọi qua Proxy khác| ProxyB["ServiceB Proxy (@Transactional)"]
        ProxyB --> TargetBFixed["ServiceB: methodB() ĐƯỢC BẢO VỆ 100%!"]
    end

    style NoteB fill:#7c2d12,stroke:#f97316,color:#fff
    style TargetBFixed fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### Kịch bản Sự Cố Sản Xuất Thực Tế: Mất Dữ Liệu Thanh Toán Đơn Hàng

\`\`\`java
@Service
public class OrderService {

    public void processOrder(Long orderId) {
        // Method này KHÔNG có @Transactional
        // ... thực hiện một số bước kiểm tra ...
        this.savePaymentTransaction(orderId); // ❌ LỖI CHẾT NGƯỜI: Self-Invocation
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void savePaymentTransaction(Long orderId) {
        // Ghi nhận trừ 5.000.000đ vào tài khoản ngân hàng
        // Khi có Exception ném ra ở đây, TRANSACTION KHÔNG THỂ ROLLBACK!
        // Tiền vẫn bị trừ nhưng đơn hàng bị fail!
    }
}
\`\`\`

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

### Cách 1: Tách Thành 2 Service Độc Lập (Khuyên Dùng 100%)
Cách chuẩn mực nhất theo nguyên lý Single Responsibility (SRP): Tách logic thanh toán giao dịch sang một Service riêng:

\`\`\`java
package vn.mastery.ecommerce.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentTransactionService {

    @Transactional
    public void recordPayment(Long orderId) {
        // Chạy qua Proxy của PaymentTransactionService -> @Transactional hoạt động hoàn hảo!
        System.out.println("Ghi nhận giao dịch thanh toán an toàn cho đơn: " + orderId);
    }
}

@Service
public class OrderCheckoutService {

    private final PaymentTransactionService transactionService;

    public OrderCheckoutService(PaymentTransactionService transactionService) {
        this.transactionService = transactionService;
    }

    public void checkout(Long orderId) {
        // Gọi qua Proxy của transactionService
        transactionService.recordPayment(orderId);
    }
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Spring |
|---|---|---|---|
| Dòng 6 | \`@Service public class PaymentTransactionService\` | Tách class riêng biệt chuyên trách thanh toán | Spring tạo riêng một Dynamic Proxy cho \`PaymentTransactionService\` |
| Dòng 9 | \`@Transactional\` | Khởi tạo Transaction Interceptor | Mở kết nối Database Transaction trước khi method chạy và commit khi hoàn tất |
| Dòng 21 | \`private final PaymentTransactionService ...\` | Inject Service qua Constructor | \`OrderCheckoutService\` nhận tham chiếu tới **Proxy của Service kia**, không phải instance nội bộ |
| Dòng 30 | \`transactionService.recordPayment(orderId);\` | Cuộc gọi đi xuyên qua Proxy | Kích hoạt chuỗi AOP Advice -> Transaction hoạt động chính xác 100% |

---

## 4. Key Takeaways & Cạm bẫy sống còn (Senior Architect Summary)

1. **Bản chất của mọi annotation AOP**: Cả \`@Transactional\`, \`@Async\`, \`@Cacheable\`, \`@Retryable\` đều sử dụng chung một cơ chế AOP Proxy. Bất kỳ khi nào bạn thấy một method tự gọi một method khác trong cùng một class, các annotation trên method được gọi đều **VÔ TÁC DỤNG**!
2. **Không dùng hack \`AopContext.currentProxy()\`**: Cách làm này ép bạn phải bật \`exposeProxy = true\` và tạo ra sự phụ thuộc chặt chẽ vào Spring AOP API nội bộ. Hãy luôn ưu tiên tách class riêng.
`;
}

// Refactor Lesson 1-3-4
const l134 = m1.lessons.find(l => l.id === "1-3-4");
if (l134) {
  l134.title = "Bài 1.3.4: Milestone Synthesis: Bản đồ Kiến trúc AOP & Ma trận So sánh JDK Proxy vs CGLIB";
  l134.content = `
:::target 🎯 MỤC TIÊU BÀI TỔNG HỢP MILESTONE (10 PHÚT)
- Tổng kết toàn diện kiến trúc Spring AOP và chuỗi thực thi Invocation Chain.
- Nắm vững Ma trận Quyết định Lựa chọn Công nghệ: JDK Dynamic Proxy vs CGLIB Bytecode.
- Đọc hiểu mã nguồn tổng hợp một Aspect giám sát toàn diện hệ thống E-Commerce (Log, Metrics, Error Masking).
- Nắm chắc 4 nguyên tắc vàng để không bao giờ gặp lỗi mất Transaction trong dự án lớn.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BỨC TƯỜNG BẢO VỆ ĐA TẦNG
Spring AOP giống như **Hệ thống cửa từ an ninh nhiều lớp** bảo vệ ngân quỹ kho tiền E-Commerce:
- Lớp 1: Cửa quét vân tay (Bảo mật \`@Secured\`).
- Lớp 2: Camera đo lường tốc độ di chuyển (Metrics \`@TrackExecutionTime\`).
- Lớp 3: Thủ kho mở két sắt (Giao dịch \`@Transactional\`).
Mọi người ra vào kho tiền đều phải đi qua đủ 3 lớp cửa. Nếu có cướp giật (Lỗi), két sắt tự động đóng sập lại (Rollback)!
:::

---

## 1. Cái này là gì? (Bản đồ Kiến trúc Toàn diện Spring AOP Pipeline)

### Sơ Đồ Kiến Trúc: Chuỗi Nạp Proxy & Invocation Chain

\`\`\`mermaid
flowchart TD
    Client["Client HTTP Request"] --> Proxy["CGLIB Dynamic Proxy"]
    
    subgraph AOPChain ["AOP Interceptor Chain"]
        Proxy --> Advisor1["Advisor 1: SecurityInterceptor (@Secured)"]
        Advisor1 --> Advisor2["Advisor 2: PerformanceInterceptor (@Around)"]
        Advisor2 --> Advisor3["Advisor 3: TransactionInterceptor (@Transactional)"]
    end

    Advisor3 --> Target["Target Bean Method: executeOrder()"]
    Target --> Advisor3
    Advisor3 --> Advisor2
    Advisor2 --> Advisor1
    Advisor1 --> Client

    style Proxy fill:#1e3a8a,stroke:#3b82f6,color:#fff
    style Target fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Ma trận So sánh Công nghệ)

### Bảng Ma Trận: So Sánh Toàn Diện Các Cơ Chế Proxy Trong Hệ Sinh Thái Java

| Tiêu chí kỹ thuật | JDK Dynamic Proxy | CGLIB Proxy (Spring Boot mặc định) | AspectJ Compile-Time Weaving |
|---|---|---|---|
| **Thời điểm sinh mã** | Runtime (Reflection) | Runtime (Bytecode ASM) | Compile-time / Load-time |
| **Yêu cầu cấu trúc** | Bắt buộc có Interface | Không cần Interface (Kế thừa class) | Can thiệp trực tiếp vào bytecode file .class |
| **Hỗ trợ Self-Invocation** | ❌ Không hỗ trợ | ❌ Không hỗ trợ | ⭐ **Hỗ trợ 100%** (Sửa thẳng bytecode) |
| **Hiệu năng thực thi** | Trung bình (qua Reflection) | Rất nhanh sau khi JIT nạp | Tối đa (Nhanh như code viết tay) |
| **Độ phức tạp cấu hình** | Rất thấp (Có sẵn trong JDK) | Bật sẵn tự động trong Spring Boot 3 | Cao (Cần AspectJ compiler \`ajc\`) |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Mã nguồn dưới đây là một Aspect giám sát toàn diện cho nghiệp vụ Đặt hàng E-Commerce:

\`\`\`java
package vn.mastery.ecommerce.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 50)
public class EnterpriseOrderMonitoringAspect {

    @Around("@annotation(vn.mastery.ecommerce.annotation.MonitoredOrder)")
    public Object monitorOrderOperation(ProceedingJoinPoint pjp) throws Throwable {
        String operationName = pjp.getSignature().toShortString();
        long startTime = System.currentTimeMillis();

        try {
            Object result = pjp.proceed();
            long executionTime = System.currentTimeMillis() - startTime;
            System.out.println("[MONITOR] " + operationName + " hoàn thành trong: " + executionTime + " ms");
            return result;
        } catch (Throwable ex) {
            System.err.println("[MONITOR-ALERT] " + operationName + " gặp sự cố: " + ex.getMessage());
            throw ex; // Tái ném exception để Transaction Manager rollback
        }
    }
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Spring |
|---|---|---|---|
| Dòng 10 | \`@Aspect\` | Đánh dấu class xử lý khía cạnh | Spring AOP tự động phân tích các Advice bên trong |
| Dòng 12 | \`@Order(Ordered.HIGHEST_PRECEDENCE + 50)\` | Sắp xếp thứ tự trong chuỗi Interceptor Chain | Đảm bảo Aspect giám sát này bọc **NGOÀI CÙNG**, đo được cả thời gian mở kết nối DB của Transaction |
| Dòng 15 | \`@Around("@annotation(...)")\` | Chặn bắt mọi method có gắn \`@MonitoredOrder\` | Tránh quét nhầm các package khác, đạt hiệu năng tối đa |
| Dòng 21 | \`Object result = pjp.proceed();\` | Cho phép hàm nghiệp vụ thực tế chạy | Nhận kết quả và chuyển tiếp về Client sau khi đã ghi log thời gian |
| Dòng 27 | \`throw ex;\` | Ném lại ngoại lệ nguyên bản | Đảm bảo tính toàn vẹn của ACID Transaction |

---

## 4. Key Takeaways & Nguyên Tắc Sống Còn (Senior Architect Summary)

1. **Hiểu bản chất Proxy**: Mọi tính năng AOP chỉ hoạt động khi cuộc gọi đến từ bên ngoài (Client -> Proxy -> Target). Không bao giờ tự gọi hàm nội bộ có annotation AOP qua từ khóa \`this\`.
2. **Kiểm soát thứ tự bọc AOP bằng \`@Order\`**: Aspect có số \`@Order\` nhỏ hơn sẽ chạy trước khi vào (Before) và chạy sau cùng khi ra (After).
3. **Luôn re-throw ngoại lệ trong \`@Around\`**: Tuyệt đối không nuốt chửng exception, vì các tầng AOP khác (\`TransactionInterceptor\`) cần nhìn thấy exception để quyết định rollback dữ liệu.
`;
}

// Serialize back to file
const outContent = `/* MODULE 1 — Spring Core & Boot căn bản (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n` + JSON.stringify(m1, null, 2) + `\n);\n`;

fs.writeFileSync(modulePath, outContent, "utf8");
console.log("Successfully refactored Module 1 Topic 3 (Lessons 1-3-1, 1-3-2, 1-3-3, 1-3-4)!");
