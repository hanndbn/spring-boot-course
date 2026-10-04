const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module1.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m1 = window.COURSE_MODULES[0];

// Refactor Lesson 1-1-1
const l111 = m1.lessons.find(l => l.id === "1-1-1");
if (l111) {
  l111.title = "Bài 1.1.1: Kiến trúc IoC Container, Bean Lifecycle & Ba kiểu Dependency Injection";
  l111.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu rõ tại sao tự dùng từ khóa \`new\` là "tử huyệt" phá nát kiến trúc của ứng dụng E-Commerce Enterprise.
- Nắm chắc bản chất Inversion of Control (IoC) & Spring IoC Container qua hình tượng "Tổng đài gọi xe thông minh".
- Phân biệt sự khác nhau một trời một vực giữa Java Object thông thường và Spring Bean.
- Làm chủ 3 kiểu Dependency Injection và giải thích cặn kẽ tại sao Constructor Injection là chuẩn mực Senior tối thượng.
- Đọc hiểu 100% từng dòng code Service Đặt hàng (Order Checkout) qua Bảng phân tích chi tiết: Dòng code -> Cú pháp -> Ý nghĩa kỹ thuật -> Tác động Container.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: INVERSION OF CONTROL (IoC) & DEPENDENCY INJECTION (DI)
**1. Cuộc sống KHÔNG CÓ IoC (Cách làm cũ - Tự new mọi thứ):**
Bạn muốn lái xe máy đi làm. Bạn phải:
- Tự tay đi đúc khung sắt (\`new Frame()\`)
- Tự tiện động cơ xăng (\`new Engine()\`)
- Tự bơm bánh xe và tự lắp ráp mọi thứ (\`new Motorbike(engine, frame)\`).
=> **Hậu quả**: Nếu ngày mai bạn muốn đổi sang xe điện, bạn phải vứt bỏ toàn bộ và chế tạo lại từ đầu! Đây gọi là **Tight Coupling (Gắn kết quá chặt)**.

**2. Cuộc sống CÓ IoC & DI (Cách làm chuẩn mực của Spring Boot):**
Bạn chỉ cần bước ra cửa và mở app Grab/Be: *"Tôi cần một chuyến xe đến công ty"* (Khai báo dependency \`private final TransportService transport;\`).
- **Spring IoC Container** chính là **Tổng đài gọi xe thông minh**: Nó đã chuẩn bị sẵn xe máy, xe hơi, bảo dưỡng động cơ và cử tài xế đến tận cửa đón bạn.
- Bạn **không cần biết chiếc xe được chế tạo thế nào**, bạn chỉ việc lên xe đi làm (tập trung 100% vào logic nghiệp vụ). Quyền điều khiển việc tạo đối tượng đã được "đảo ngược" (Inversion of Control) từ tay bạn sang tay tổng đài Spring!

**3. Spring Bean là gì?**
- **Java Object thông thường (bạn tự \`new\`)** là "Người làm nghề tự do (Freelancer)": bạn tự gọi đến, bạn tự trả tiền và bạn phải tự lo việc dọn rác.
- Còn **Spring Bean** là "Nhân viên chính thức của công ty Spring": Được quản gia Spring sinh ra, nuôi dưỡng, tiêm các công cụ làm việc vào người, và quản lý suốt đời cho đến khi tắt ứng dụng.
:::

---

## 1. Cái này là gì? (Bản chất kỹ thuật IoC & ApplicationContext)

**Inversion of Control (IoC - Đảo ngược quyền điều khiển)**: Lập trình viên không tự \`new\` các service phụ thuộc nữa. Quyền khởi tạo, định cấu hình và quản lý vòng đời của đối tượng được trao toàn quyền cho **Spring IoC Container** (thể hiện qua interface \`ApplicationContext\`).

### Sơ Đồ Kiến Trúc: 11 Giai Đoạn Vòng Đời Spring Bean (Bean Lifecycle State Machine)

\`\`\`mermaid
flowchart TD
    A["1. Nạp BeanDefinition<br/>(@Component, @Service, @Bean)"] --> B["2. Instantiation<br/>(Constructor Reflection / CGLIB)"]
    B --> C["3. Populate Properties<br/>(Bơm Dependency Injection)"]
    C --> D["4. Aware Interfaces<br/>(BeanNameAware, ApplicationContextAware)"]
    D --> E["5. BeanPostProcessor<br/>postProcessBeforeInitialization()"]
    E --> F["6. Initialization Phase<br/>(@PostConstruct -> afterPropertiesSet -> initMethod)"]
    F --> G["7. BeanPostProcessor<br/>postProcessAfterInitialization() (Bọc AOP Proxy!)"]
    G --> H["8. BEAN SẴN SÀNG PHỤC VỤ REQUEST<br/>(Nằm trong Singleton Registry)"]
    H --> I["9. Destruction Phase<br/>(@PreDestroy -> DisposableBean -> destroyMethod)"]
    style H fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style G fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Hãy tưởng tượng bạn đang viết code xử lý thanh toán đặt hàng cho hệ thống thương mại điện tử:

### Ma trận So sánh: Cách làm cũ (Anti-pattern) vs Chuẩn Spring Boot (Best Practice)

| Tiêu chí so sánh | Cách cũ: Tự \`new\` đối tượng cứng | Cách chuẩn: Spring IoC & DI |
|---|---|---|
| **Cú pháp khởi tạo** | \`private EmailService email = new EmailService();\` | Khai báo \`private final EmailService emailService;\` trong Constructor |
| **Khả năng Unit Test** | ❌ **Bất khả thi**: Mỗi lần test \`checkout()\` là gọi thẳng vào database thật và trừ tiền thật qua cổng VNPay | ⭐ **Dễ dàng 100%**: Dễ dàng truyền \`Mockito.mock(PaymentGateway.class)\` vào constructor để test độc lập trong 5 miligiây |
| **Mở rộng nghiệp vụ (OCP)** | ❌ Muốn đổi từ VNPay sang MoMo phải mở code Service ra sửa lại, vi phạm Open-Closed Principle | ⭐ Chỉ cần hoán đổi Bean qua \`@Qualifier\` hoặc \`@Primary\` mà không sửa 1 dòng code nghiệp vụ |
| **Quản lý tài nguyên RAM** | ❌ Mỗi lần gọi lại \`new\` connection database dẫn tới cạn kiệt Connection Pool | ⭐ Spring quản lý Singleton Bean: 1 instance duy nhất phục vụ hàng triệu request an toàn |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là mã nguồn chuẩn Production của Service Đặt Hàng Thương Mại Điện Tử:

\`\`\`java
package vn.mastery.ecommerce.service;

import org.springframework.stereotype.Service;
import vn.mastery.ecommerce.payment.PaymentGateway;
import vn.mastery.ecommerce.notification.NotificationService;
import vn.mastery.ecommerce.repository.OrderRepository;
import vn.mastery.ecommerce.domain.Order;
import java.math.BigDecimal;

@Service
public class OrderCheckoutService {

    private final PaymentGateway paymentGateway;
    private final NotificationService notificationService;
    private final OrderRepository orderRepository;

    public OrderCheckoutService(PaymentGateway paymentGateway,
                                NotificationService notificationService,
                                OrderRepository orderRepository) {
        this.paymentGateway = paymentGateway;
        this.notificationService = notificationService;
        this.orderRepository = orderRepository;
    }

    public Order checkout(Long customerId, BigDecimal amount) {
        Order order = new Order(customerId, amount, "PENDING");
        Order savedOrder = orderRepository.save(order);
        paymentGateway.charge(savedOrder.getId(), amount);
        notificationService.sendReceipt(customerId, savedOrder.getId());
        return savedOrder;
    }
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Spring |
|---|---|---|---|
| Dòng 10 | \`@Service\` | Đánh dấu class là một Spring Managed Bean thuộc tầng nghiệp vụ | Spring ComponentScan tìm thấy class lúc khởi động và đăng ký vào \`BeanDefinitionRegistry\` |
| Dòng 12-14 | \`private final PaymentGateway paymentGateway;\` | Khai báo dependency với từ khóa \`final\` (bất biến) | Ngăn chặn việc thay đổi tham chiếu lúc runtime; Compiler ép buộc phải inject đủ qua Constructor |
| Dòng 16-22 | \`public OrderCheckoutService(...)\` | Constructor Injection (từ Spring 4.3+ không cần viết \`@Autowired\`) | Container tự động tìm các bean tương ứng trong Context và tiêm vào instance khi khởi tạo |
| Dòng 20-22 | \`this.paymentGateway = paymentGateway;\` | Gán đối tượng được inject vào biến \`final\` | Khởi tạo hoàn tất, object đạt trạng thái Thread-Safe tuyệt đối, an toàn cho hàng nghìn thread đồng thời |
| Dòng 24-30 | \`public Order checkout(...)\` | Phương thức nghiệp vụ cốt lõi | Nhận \`customerId, amount\` -> Lưu DB -> Gọi thanh toán -> Bắn thông báo -> Trả về đơn hàng đã lưu |

---

## 4. Cạm bẫy thực tế & Best Practices (Senior Trap Guide)

:::danger 3 CẠM BẪY CHẾT NGƯỜI KHI DÙNG SPRING DI
1. **Dùng Field Injection (\`@Autowired private PaymentGateway gateway;\`)**:
   - *Hậu quả*: Khi viết Unit Test với JUnit 5 không có Spring Container (\`new OrderCheckoutService()\`), biến \`gateway\` sẽ bị \`null\` dẫn tới \`NullPointerException\` ngay lập tức.
   - *Cách khắc phục*: Luôn luôn dùng **Constructor Injection** kết hợp từ khóa \`final\`.
2. **Khởi tạo Service bằng từ khóa \`new\` trong Controller**:
   - *Hậu quả*: \`OrderCheckoutService svc = new OrderCheckoutService(...);\`. Đối tượng này không do Spring quản lý, toàn bộ AOP Proxy (\`@Transactional\`, \`@Secured\`) bị vô hiệu hóa 100%!
   - *Cách khắc phục*: Để Controller nhận Service qua Constructor do Spring inject vào.
3. **Bỏ quên từ khóa \`final\`**:
   - *Hậu quả*: Biến phụ thuộc có thể bị một method vô tình gán lại thành \`null\` hoặc trỏ sang đối tượng khác lúc đang chạy đa luồng, làm hỏng toàn bộ dữ liệu giao dịch.
:::
`;
}

// Refactor Lesson 1-1-2
const l112 = m1.lessons.find(l => l.id === "1-1-2");
if (l112) {
  l112.title = "Bài 1.1.2: Triển khai Dynamic Bean Injection & Khắc phục Prototype-in-Singleton";
  l112.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu cách giải quyết xung đột khi 1 Interface có nhiều Implementation (VNPay, MoMo, ZaloPay) qua \`@Primary\` và \`@Qualifier\`.
- Nắm chắc bản chất vòng đời Bean Scopes: Singleton vs Prototype.
- Giải mã cạm bẫy kinh điển "Prototype bị đóng băng trong Singleton" làm rò rỉ dữ liệu giữa các khách hàng.
- Làm chủ kỹ thuật \`ObjectProvider<T>\` để lazy-resolve instance Prototype mới tinh theo yêu cầu.
- Đọc hiểu toàn bộ mã nguồn điều phối đa cổng thanh toán và tạo hóa đơn qua Bảng phân tích từng dòng code.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BEAN SCOPES TRONG ĐỜI THỰC
**1. Singleton Scope (Mặc định trong 99% Spring Boot):**
Giống như **Chiếc quạt trần trong phòng học**:
- Dù phòng học có 1 học sinh hay 50 học sinh (tương ứng với 50 request gọi API đồng thời), tất cả đều dùng chung **1 chiếc quạt trần duy nhất**.
- Tiết kiệm điện và không gian (tiết kiệm bộ nhớ RAM). Vì vậy các Service, Repository đều là Singleton và **tuyệt đối không được lưu biến trạng thái của từng khách hàng vào class field**!

**2. Prototype Scope:**
Giống như **Chiếc ly giấy uống cà phê mang đi (Take-away)**:
- Mỗi khi có khách hàng bước vào yêu cầu (\`getObject()\`), nhân viên lại rút một chiếc ly mới tinh ra phục vụ. Khách uống xong tự vứt đi, không ai dùng chung ly với ai!
:::

---

## 1. Cái này là gì? (Điều phối Bean Đa hình & Cơ chế Scopes)

Trong dự án thực tế, một Interface thanh toán \`PaymentProcessor\` thường có nhiều nhà cung cấp khác nhau: VNPay, MoMo, ZaloPay. Nếu bạn chỉ khai báo \`PaymentProcessor\`, Spring sẽ bối rối không biết chọn ai (\`NoUniqueBeanDefinitionException\`).

### Sơ Đồ Kiến Trúc: Phân Giải Dynamic Bean & ObjectProvider Cho Prototype

\`\`\`mermaid
flowchart TD
    Client["OrderCheckoutService (Singleton Scope)"]
    
    subgraph SpringContainer ["Spring ApplicationContext Container"]
        PrimaryBean["@Primary: MomoPaymentProcessor"]
        QualifierBean["@Qualifier('vnpayProcessor'): VNPayPaymentProcessor"]
        ProtoProvider["ObjectProvider&lt;InvoiceBuilder&gt; (Lazy Resolver)"]
        PrototypeFactory["Prototype Bean Factory: Sinh instance mới khi gọi getObject()"]
    end

    Client -->|Mặc định không chỉ định qualifier| PrimaryBean
    Client -->|Chỉ định rõ qualifier('vnpayProcessor')| QualifierBean
    Client -->|Yêu cầu cấp instance mới| ProtoProvider
    ProtoProvider -->|Kéo từ Container| PrototypeFactory
    PrototypeFactory -->|new InvoiceBuilder()| FreshInstance["Fresh Instance 1, 2, 3... (Không bị đóng băng)"]

    style PrimaryBean fill:#064e3b,stroke:#10b981,color:#fff
    style QualifierBean fill:#1e3a8a,stroke:#3b82f6,color:#fff
    style FreshInstance fill:#78350f,stroke:#f59e0b,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### Ma trận Phân Biệt: @Primary vs @Qualifier vs ObjectProvider

| Cơ chế | Annotation / Kiểu dữ liệu | Khi nào sử dụng? | Ví dụ thực tế |
|---|---|---|---|
| **Cổng mặc định** | \`@Primary\` | Khi có 1 implementation chính chiếm 80% lưu lượng giao dịch | MoMo là cổng ví điện tử mặc định của ứng dụng |
| **Cổng chỉ định đích danh** | \`@Qualifier("vnpayProcessor")\` | Khi cần chọn đích danh một nhà cung cấp cụ thể | Khách hàng bấm chọn thanh toán qua thẻ nội địa VNPay |
| **Tạo instance mới động** | \`ObjectProvider<T>\` | Khi cần tạo đối tượng Prototype stateful bên trong Singleton Service | Mỗi đơn hàng cần một \`InvoiceBuilder\` riêng để gom dữ liệu thuế, giảm giá |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là mã nguồn hoàn chỉnh xử lý đa cổng thanh toán và xuất hóa đơn động:

\`\`\`java
package vn.mastery.ecommerce.payment;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

public interface PaymentProcessor {
    String processPayment(String orderId, BigDecimal amount);
}

@Component("momoProcessor")
@Primary
public class MomoPaymentProcessor implements PaymentProcessor {
    public String processPayment(String orderId, BigDecimal amount) {
        return "MOMO_PAID_" + orderId;
    }
}

@Component("vnpayProcessor")
public class VNPayPaymentProcessor implements PaymentProcessor {
    public String processPayment(String orderId, BigDecimal amount) {
        return "VNPAY_PAID_" + orderId;
    }
}

@Component
@Scope("prototype")
class InvoiceBuilder {
    private String orderId;
    public void init(String orderId) { this.orderId = orderId; }
    public String buildPdf() { return "PDF_INVOICE_FOR_" + this.orderId; }
}

@Service
public class DynamicPaymentService {

    private final PaymentProcessor defaultProcessor;
    private final PaymentProcessor vnpayProcessor;
    private final ObjectProvider<InvoiceBuilder> invoiceBuilderProvider;

    public DynamicPaymentService(PaymentProcessor defaultProcessor,
                                 @Qualifier("vnpayProcessor") PaymentProcessor vnpayProcessor,
                                 ObjectProvider<InvoiceBuilder> invoiceBuilderProvider) {
        this.defaultProcessor = defaultProcessor;
        this.vnpayProcessor = vnpayProcessor;
        this.invoiceBuilderProvider = invoiceBuilderProvider;
    }

    public String pay(String orderId, BigDecimal amount, boolean preferVnPay) {
        PaymentProcessor selected = preferVnPay ? vnpayProcessor : defaultProcessor;
        String payResult = selected.processPayment(orderId, amount);

        InvoiceBuilder builder = invoiceBuilderProvider.getObject();
        builder.init(orderId);
        String pdf = builder.buildPdf();

        return payResult + " -> " + pdf;
    }
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Spring |
|---|---|---|---|
| Dòng 17 | \`@Primary\` | Đánh dấu \`MomoPaymentProcessor\` là bean ưu tiên mặc định | Khi inject \`PaymentProcessor\` mà không có Qualifier, Spring tự chọn MoMo |
| Dòng 25 | \`@Component("vnpayProcessor")\` | Định danh bean cụ thể với tên chuỗi rõ ràng | Cho phép các service khác tìm chính xác bean này qua tên |
| Dòng 33 | \`@Scope("prototype")\` | Đổi scope của \`InvoiceBuilder\` sang Prototype | Mỗi lần yêu cầu tạo bean sẽ sinh ra 1 instance mới tinh trong bộ nhớ Heap |
| Dòng 44 | \`private final ObjectProvider<InvoiceBuilder> ...\` | Bọc bean Prototype vào \`ObjectProvider\` (Lazy Resolver) | Ngăn chặn việc tạo Prototype cố định lúc startup; giữ quyền triệu hồi động |
| Dòng 47 | \`@Qualifier("vnpayProcessor")\` | Chỉ định đích danh bean VNPay cho tham số này | Spring bỏ qua \`@Primary\` và tiêm đúng instance của \`VNPayPaymentProcessor\` |
| Dòng 58 | \`invoiceBuilderProvider.getObject()\` | Kích hoạt Container tạo instance Prototype mới | Mỗi đơn hàng nhận 1 \`InvoiceBuilder\` riêng biệt, loại bỏ nguy cơ trùng lặp dữ liệu |

---

## 4. Cạm bẫy thực tế & Best Practices (Senior Trap Guide)

:::danger CẠM BẪY CHẾT NGƯỜI: INJECT TRỰC TIẾP PROTOTYPE VÀO SINGLETON
- **Hiện tượng**: Bạn viết \`public DynamicPaymentService(InvoiceBuilder builder)\`.
- **Cơ chế lỗi**: \`DynamicPaymentService\` là Singleton (chỉ khởi tạo **ĐÚNG 1 LẦN** lúc khởi động app). Khi đó, Spring cũng chỉ gọi constructor để tạo \`InvoiceBuilder\` **1 LẦN DUY NHẤT**!
- **Hậu quả kinh hoàng**: Bean Prototype bị "đóng băng" thành Singleton! Khi Khách hàng A thanh toán, thông tin của họ lưu vào \`builder\`. Ngay sau đó Khách hàng B thanh toán, \`builder\` vẫn giữ thông tin cũ của Khách A -> Hóa đơn của Khách B bị in tên của Khách A!
- **Giải pháp chuẩn Senior**: Luôn luôn dùng \`ObjectProvider<T>\` hoặc \`@Lookup\` method injection.
:::
`;
}

// Refactor Lesson 1-1-3
const l113 = m1.lessons.find(l => l.id === "1-1-3");
if (l113) {
  l113.title = "Bài 1.1.3: Cạm bẫy Circular Dependency, Rò rỉ Memory Bean Scope & Deadlock Startup";
  l113.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã nghịch lý "Con gà và quả trứng" (Circular Dependency) gây crash ứng dụng ngay lúc khởi động (\`BeanCurrentlyInCreationException\`).
- Hiểu lý do tại sao từ Spring Boot 2.6+, tính năng cho phép Circular Dependency mặc định bị TẮT HOÀN TOÀN.
- Tự tay refactor triệt tiêu vòng tròn phụ thuộc bằng mô hình Bất đồng bộ In-JVM Event (\`ApplicationEventPublisher\`).
- Đọc hiểu toàn bộ mã nguồn xử lý thanh toán tách rời sự kiện qua Bảng phân tích từng dòng code chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CIRCULAR DEPENDENCY & CHIM BỒ CÂU ĐƯA THƯ
**1. Nghịch lý con gà và quả trứng:**
- Service Đặt Hàng (\`OrderService\`) nói: *"Tôi cần Service Thanh Toán (\`PaymentService\`) thì tôi mới chịu khởi động!"*
- Service Thanh Toán (\`PaymentService\`) lại nói: *"Tôi cũng cần Service Đặt Hàng (\`OrderService\`) thì tôi mới chịu khởi động!"*
=> Cả hai đứng nhìn nhau chờ đợi vô tận. Quản gia Spring lập tức thổi còi, giơ thẻ đỏ và dập tắt ứng dụng ngay lập tức (\`BeanCurrentlyInCreationException\`)!

**2. Giải pháp: Chim bồ câu đưa thư (\`ApplicationEvent\`):**
- Khi Đặt hàng xong, \`OrderService\` không cần biết ai xử lý tiếp, chỉ việc thả một chú chim bồ câu mang theo thư báo: *"Đơn hàng #123 vừa tạo thành công!"* (\`publisher.publishEvent(...)\`).
- \`PaymentService\` chỉ việc ngước nhìn bầu trời (\`@EventListener\`), thấy chim bồ câu bay qua thì tự động đón lấy thư và thực hiện trừ tiền ví.
=> **Kết quả**: Hai service hoàn toàn độc lập, không còn biết mặt nhau, vòng tròn phụ thuộc bị đập tan 100%!
:::

---

## 1. Cái này là gì? (Bản chất lỗi Circular Dependency)

Circular Dependency (Vòng tròn phụ thuộc) xảy ra khi Bean A phụ thuộc vào Bean B qua Constructor, và đồng thời Bean B lại phụ thuộc ngược lại Bean A (hoặc qua chuỗi A -> B -> C -> A).

### Sơ Đồ Kiến Trúc: Đảo Ngược Phụ Thuộc Bằng In-JVM Event

\`\`\`mermaid
flowchart TD
    subgraph Bug ["CẠM BẪY: Vòng Tròn Phụ Thuộc (Startup Crash)"]
        OrderSvc["OrderService"] -->|Constructor injects| PaySvc["PaymentService"]
        PaySvc -->|Constructor injects| OrderSvc
        Crash["BeanCurrentlyInCreationException: Startup sập hoàn toàn!"]
        OrderSvc -.-> Crash
        PaySvc -.-> Crash
    end

    subgraph Fixed ["GIẢI PHÁP CHUẨN: Đảo Ngược Bằng ApplicationEvent"]
        OrderSvcFixed["OrderService (Tạo đơn hàng)"] -->|1. Publish| Event["OrderCreatedEvent (DTO bất biến)"]
        Event -->|2. Lắng nghe sự kiện| PayListener["PaymentEventListener (@EventListener)"]
        PayListener -->|3. Thực thi| PaySvcFixed["PaymentService (Trừ tiền ví)"]
    end

    style Bug fill:#7c2d12,stroke:#f97316,color:#fff
    style Fixed fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

### Ma trận So sánh: Cách giải quyết Circular Dependency

| Phương pháp | Đánh giá kiến trúc | Ưu điểm / Nhược điểm |
|---|---|---|
| **Bật cờ \`allow-circular-references=true\`** | ❌ **Tối kỵ trong dự án lớn** | Chỉ che giấu "mùi hôi của code" (Code Smell), dễ gây deadlock lúc runtime |
| **Dùng \`@Lazy\` trên Constructor** | ⚠️ **Chỉ là giải pháp tạm bợ (Band-aid)** | Trì hoãn việc tạo proxy lúc boot, nhưng kiến trúc tổng thể vẫn bị gắn chặt |
| **Tách Service Điều Phối (Orchestrator)** | ⭐ **Chuẩn Clean Architecture** | Tạo \`CheckoutOrchestrator\` phụ thuộc cả 2, rút sạch dependency chéo |
| **Dùng Spring \`ApplicationEventPublisher\`** | ⭐⭐ **Chuẩn Enterprise Decoupled** | Phân tách tuyệt đối 100%, dễ mở rộng thêm gửi Email, tích điểm mà không sửa code cũ |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là mã nguồn chuẩn hóa triệt tiêu hoàn toàn Circular Dependency:

\`\`\`java
package vn.mastery.ecommerce.order;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;

public record OrderCreatedEvent(Long orderId, Long customerId, BigDecimal amount) {}

@Service
public class OrderService {

    private final ApplicationEventPublisher eventPublisher;

    public OrderService(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    public void createOrder(Long orderId, Long customerId, BigDecimal amount) {
        // 1. Lưu đơn hàng vào DB...
        // 2. Bắn sự kiện ra ngoài mà không cần gọi trực tiếp PaymentService
        eventPublisher.publishEvent(new OrderCreatedEvent(orderId, customerId, amount));
    }
}

@Component
public class PaymentEventListener {

    @EventListener
    public void onOrderCreated(OrderCreatedEvent event) {
        // Thực hiện trừ tiền thanh toán an toàn
        System.out.println("Tiến hành trừ tiền cho đơn hàng: " + event.orderId() + " Số tiền: " + event.amount());
    }
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Container |
|---|---|---|---|
| Dòng 10 | \`public record OrderCreatedEvent(...)\` | Khai báo Java Record làm DTO sự kiện bất biến | Chứa dữ liệu giao dịch sạch, không bị sửa đổi khi truyền qua các listener |
| Dòng 15 | \`private final ApplicationEventPublisher ...\` | Inject interface phát sự kiện sẵn có của Spring Context | Không phụ thuộc vào bất kỳ Service nghiệp vụ thanh toán nào |
| Dòng 25 | \`eventPublisher.publishEvent(...)\` | Phát thông điệp sự kiện In-JVM | Spring tìm tất cả các Bean có \`@EventListener\` phù hợp và kích hoạt |
| Dòng 31 | \`@EventListener\` | Đăng ký phương thức làm người nghe sự kiện | Tự động hứng \`OrderCreatedEvent\` ngay khi được bắn ra |

---

## 4. Cạm bẫy thực tế & Best Practices (Senior Trap Guide)

:::danger CẢNH BÁO TỪ SPRING BOOT 2.6+
Từ phiên bản 2.6 trở lên, Spring Boot mặc định ném lỗi ngay khi phát hiện Circular Dependency:
\`\`\`text
APPLICATION FAILED TO START
***************************
Description:
The dependencies of some of the beans in the application context form a cycle:
   orderService -> paymentService -> orderService
Action:
Relying upon circular references is discouraged and they are prohibited by default.
Update your application to remove the dependency cycle between beans.
\`\`\`
**Lời khuyên Senior**: Tuyệt đối không bật \`spring.main.allow-circular-references=true\` trong \`application.yml\` để qua mặt CI/CD. Đó là dấu hiệu cảnh báo mã nguồn của bạn đang vi phạm nghiêm trọng nguyên lý Single Responsibility (SRP)!
:::
`;
}

// Refactor Lesson 1-1-4
const l114 = m1.lessons.find(l => l.id === "1-1-4");
if (l114) {
  l114.title = "Bài 1.1.4: Milestone Synthesis: Bản đồ Bean Lifecycle & Ma trận Lựa chọn Bean Scope";
  l114.content = `
:::target 🎯 MỤC TIÊU BÀI TỔNG HỢP MILESTONE (10 PHÚT)
- Tổng hợp toàn diện 11 giai đoạn vòng đời của Spring Bean từ file bytecode đến lúc tiêu hủy.
- Hiểu chính xác vị trí AOP Dynamic Proxy được sinh ra (BeanPostProcessor sau Initialization).
- Làm chủ Ma trận Quyết định Lựa chọn Bean Scope cho mọi thành phần trong hệ thống E-Commerce.
- Đọc hiểu và làm chủ mã nguồn \`PaymentGatewayLifecycleManager\` tích hợp trọn vẹn Aware, PostConstruct, PreDestroy qua Bảng phân tích từng dòng code.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: VÒNG ĐỜI MỘT NHÂN VIÊN CHÍNH THỨC
Hành trình một **Spring Bean** trong Container giống hệt như vòng đời của **Nhân viên trong Tập đoàn**:
1. **Nộp hồ sơ (BeanDefinition)**: Doanh nghiệp ghi nhận thông tin ứng viên.
2. **Ký hợp đồng nhận việc (Instantiation)**: Gọi Constructor tạo con người bằng xương bằng thịt.
3. **Cấp phát công cụ (Dependency Injection)**: Phát laptop, bàn làm việc, thẻ nhân viên.
4. **Học nội quy (Aware Callbacks)**: Nhận biết phòng ban, sếp trực tiếp (\`ApplicationContextAware\`).
5. **Đào tạo hội nhập (@PostConstruct)**: Cắm điện laptop, kết nối VPN nội bộ trước khi làm việc.
6. **Bọc thẻ bảo an (AOP Proxy)**: Trang bị đồ bảo hộ an ninh trước khi ra chiến trường.
7. **Làm việc chính thức**: Phục vụ hàng triệu khách hàng ổn định.
8. **Nghỉ hưu bàn giao tài sản (@PreDestroy)**: Tắt máy, trả lại laptop, ngắt kết nối an toàn.
:::

---

## 1. Cái này là gì? (Bản đồ Dòng chảy Bean Lifecycle & Container Architecture)

### Sơ Đồ Kiến Trúc: Chuỗi Thực Thi 11 Giai Đoạn Vòng Đời Bean

\`\`\`mermaid
flowchart TD
    Start["Khởi Động Spring ApplicationContext"] --> Instantiation["1. Khởi Tạo Đối Tượng (Constructor Call)"]
    Instantiation --> PopulateProps["2. Bơm Phụ Thuộc (Dependency Injection)"]
    PopulateProps --> AwareInterfaces["3. Bơm Ngữ Cảnh (BeanNameAware, ApplicationContextAware)"]
    AwareInterfaces --> BPP_Before["4. BeanPostProcessor: postProcessBeforeInitialization()"]
    BPP_Before --> InitMethods["5. Khởi Tạo: @PostConstruct -> InitializingBean::afterPropertiesSet()"]
    InitMethods --> BPP_After["6. BeanPostProcessor: postProcessAfterInitialization()<br/>⭐ TẠO DYNAMIC PROXY TẠI ĐÂY!"]
    BPP_After --> Ready["7. BEAN SẴN SÀNG PHỤC VỤ (Ready for Service)"]
    Ready --> Destruction["8. Khi Tắt Server: @PreDestroy -> DisposableBean::destroy()"]
    
    style BPP_After fill:#064e3b,stroke:#10b981,color:#fff
    style Instantiation fill:#1e3a8a,stroke:#3b82f6,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Ma trận Quyết định Lựa chọn Bean Scope)

### Bảng Ma Trận So Sánh Các Kiểu Bean Scope Trong E-Commerce

| Tiêu chí kỹ thuật | Singleton (Mặc định 99%) | Prototype Scope | Request / Session Scope | RefreshScope (Spring Cloud) |
|---|---|---|---|---|
| **Số lượng instance** | Đúng 1 instance duy nhất trên toàn ApplicationContext | Mỗi lần injection hoặc gọi \`getObject()\` sinh 1 instance mới | 1 instance trên mỗi HTTP request/session web | 1 instance mới khi nhận tín hiệu reload cấu hình |
| **Vấn đề Đa luồng** | **Bắt buộc Stateless** (không lưu mutable state) | Thread-safe tự nhiên nếu dùng riêng biệt | Thread-safe cho từng HTTP worker thread | Thread-safe qua cơ chế Locking nội bộ |
| **Quản lý Tiêu hủy** | Spring tự động gọi \`@PreDestroy\` khi shutdown | ❌ **Spring KHÔNG quản lý việc hủy** (dễ rò rỉ RAM) | Tự dọn dẹp khi kết thúc request HTTP | Tự dọn instance cũ khi nạp cấu hình mới |
| **Áp dụng thực tế** | **99% Services, Repositories, Controllers** | \`ReportBuilder\`, \`InvoiceExporter\` giữ dữ liệu tạm | Giỏ hàng tạm thời, User IP context | Dynamic reload Secret Key cổng thanh toán |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Mã nguồn dưới đây minh họa toàn bộ các móc nối vòng đời (Lifecycle Hooks) của một Bean Quản Lý Kết Nối Cổng Thanh Toán Cấp Doanh Nghiệp:

\`\`\`java
package vn.mastery.ecommerce.payment;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.BeanNameAware;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

@Component
public class PaymentGatewayLifecycleManager implements BeanNameAware, ApplicationContextAware {

    private String beanName;
    private ApplicationContext context;
    private boolean gatewayConnected = false;

    @Override
    public void setBeanName(String name) {
        this.beanName = name;
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) {
        this.context = applicationContext;
    }

    @PostConstruct
    public void initializeConnectionPool() {
        // Thiết lập kết nối socket an toàn sang cổng VNPay/MoMo
        this.gatewayConnected = true;
        System.out.println("Bean [" + beanName + "] đã mở Connection Pool sang Payment Gateway!");
    }

    public boolean isReady() {
        return this.gatewayConnected;
    }

    @PreDestroy
    public void gracefulShutdown() {
        // Ngắt kết nối socket, flush các giao dịch dở dang trước khi tắt pod
        this.gatewayConnected = false;
        System.out.println("Bean [" + beanName + "] đã ngắt kết nối an toàn (Graceful Shutdown)!");
    }
}
\`\`\`

### 🔍 Bảng giải mã chi tiết từng dòng code:

| Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Container |
|---|---|---|---|
| Dòng 10 | \`implements BeanNameAware, ApplicationContextAware\` | Đăng ký các interface Aware để nhận metadata từ Spring | Spring phát hiện và gọi các phương thức setter tương ứng ở Giai đoạn 4 |
| Dòng 17 | \`setBeanName(String name)\` | Nhận tên định danh của Bean do Container cấp | Lưu lại tên \`paymentGatewayLifecycleManager\` để phục vụ logging |
| Dòng 22 | \`setApplicationContext(...)\` | Nhận tham chiếu tới chính Spring Container | Cho phép truy vấn môi trường, profile hoặc publish event nếu cần |
| Dòng 26 | \`@PostConstruct\` | Khởi tạo tài nguyên sau khi DI hoàn tất | Chạy **SAU** khi toàn bộ dependency đã được bơm xong; an toàn để mở socket kết nối |
| Dòng 37 | \`@PreDestroy\` | Dọn dẹp tài nguyên trước khi Bean bị tiêu hủy | Chạy khi nhận tín hiệu \`SIGTERM\` từ Kubernetes, đảm bảo không rớt giao dịch thanh toán |

---

## 4. Key Takeaways & Cạm bẫy sống còn (Senior Architect Summary)

1. **Vị trí Dynamic Proxy**: Các tính năng quyền lực (\`@Transactional\`, \`@Async\`, \`@Secured\`) được bọc vào Bean ở bước \`BeanPostProcessor.postProcessAfterInitialization\`. Do đó trong hàm \`@PostConstruct\`, việc gọi các method có \`@Transactional\` nội bộ có thể không có hiệu lực proxy!
2. **Không bao giờ lưu trạng thái người dùng trong Singleton**: Mọi biến lưu trong Singleton Bean đều được chia sẻ cho hàng nghìn thread. Nếu biến đó không phải là \`final\` hoặc \`Atomic\`, hệ thống sẽ bị lỗi tranh chấp dữ liệu (Race Condition).
3. **Luôn dùng @PreDestroy để ngắt kết nối an toàn**: Trong kiến trúc microservices chạy trên Kubernetes, pod có thể bị scale-down bất kỳ lúc nào. Luôn giải phóng ThreadPool và Connection trong \`@PreDestroy\` để đạt chuẩn Zero-Downtime.
`;
}

// Serialize back to file
const outContent = `/* MODULE 1 — Spring Core & Boot căn bản (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n` + JSON.stringify(m1, null, 2) + `\n);\n`;

fs.writeFileSync(modulePath, outContent, "utf8");
console.log("Successfully refactored Module 1 Topic 1 (Lessons 1-1-1, 1-1-2, 1-1-3, 1-1-4)!");
