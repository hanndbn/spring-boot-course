/* =========================================================================
   DevMastery — Modern Java 21 Professional: Generics, Streams & Concurrency
   Standardized to CES-2026 v2.5 (Golden 6-Part Hierarchy)
   Domain: High-Throughput Payment & Analytics Engine
   ========================================================================= */
(function() {
  "use strict";

  window.EXTRA_COURSES = window.EXTRA_COURSES || {};

  window.EXTRA_COURSES["java-professional"] = {
  "id": "java-professional",
  "trackId": "java-track",
  "title": "Modern Java 21 Professional — Generics, Streams & Concurrency",
  "shortTitle": "Modern Java Professional",
  "icon": "🚀",
  "badge": "Professional Level",
  "category": "backend",
  "level": "professional",
  "hours": "~16h",
  "modulesCount": 4,
  "lessonsCount": 16,
  "quizCount": 16,
  "certificateTitle": "DevMastery Verified — Modern Java 21 Professional",
  "instructor": "DevMastery Java Architecture Council",
  "bestseller": true,
  "themeGradient": "linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%)",
  "desc": "Nâng cấp tư duy lập trình hiện đại: Record, Sealed Classes, Pattern Matching, Generics chuyên sâu (PECS), Stream API, CompletableFuture và Virtual Threads (Project Loom JEP 444).",
  "outcomes": [
    "Làm chủ Modern Java 21: Records, Sealed Interfaces, Pattern Matching for switch",
    "Hiểu sâu Generics Type Erasure, Wildcards và quy tắc thiết kế API PECS",
    "Xây dựng Custom Collectors và xử lý dữ liệu song song an toàn",
    "Lập trình đa luồng hiệu năng cao với Virtual Threads và CompletableFuture"
  ],
  "prerequisites": [
    "Đã hoàn thành Java 21 Foundation hoặc có 1+ năm kinh nghiệm Java Core"
  ],
  "stackVersion": {
    "java": "21 LTS",
    "concurrency": "Virtual Threads (JEP 444)",
    "lastReviewedDate": "2026-10-04",
    "maintainer": "DevMastery Java Architecture Council"
  },
  "tags": [
    "Modern Java 21",
    "Virtual Threads",
    "Streams",
    "Generics",
    "CompletableFuture",
    "Records"
  ],
  "isAvailable": true,
  "modules": [
    {
      "id": 201,
      "title": "Tính Năng Hiện Đại Java 17/21 LTS",
      "icon": "💎",
      "color": "#059669",
      "desc": "Records, Compact Constructors, Sealed Classes, Pattern Matching & Sequenced Collections.",
      "lessons": [
        {
          "id": "j1-1-1",
          "type": "theory",
          "title": "Bài 1.1: Records Deep Dive: Canonical Constructor, Compact Validation & Bytecode",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải mã bản chất Bytecode của Java Record: Kế thừa ngầm `java.lang.Record`, các trường `private final`.\n- Sử dụng Compact Constructor để chuẩn hóa và validate dữ liệu mà không cần lặp lại danh sách tham số.\n- Bảo vệ tính bất biến sâu (Deep Immutability) khi Record chứa collection hoặc mutable objects.\n- Áp dụng Record làm Data Transfer Objects (DTO) chuẩn mực trong Spring Boot REST API.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: PHÒNG ÉP NHỰA VÀ ĐỐI TƯỢNG ĐÚC NGUYÊN KHỐI\n- Đối tượng thông thường (Class JavaBeans): Giống như một mô hình ghép từ các mảnh LEGO. Bạn có thể tháo tay, thay đầu bất kỳ lúc nào (`setLastName(\"...\")`).\n- **Java Record**: Giống như một món đồ chơi đúc nhựa nguyên khối. Một khi đã ra khỏi khuôn ép (Constructor chạy xong), hình dáng và thông tin của nó vĩnh viễn không thể biến dạng!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Bytecode Của Record)\n\n```mermaid\nclassDiagram\n    class Record {\n        <<abstract>>\n        +equals(Object) boolean\n        +hashCode() int\n        +toString() String\n    }\n    class PaymentRequest {\n        <<final>>\n        -String orderId\n        -long amountCents\n        +orderId() String\n        +amountCents() long\n    }\n    Record <|-- PaymentRequest : Extends ngầm (Final)\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Record vs Lombok @Value vs JavaBeans)\n\n| Tiêu chí | JavaBeans Truyền Thống | Lombok `@Value` / `@Data` | Java 21 Record Chính Thức |\n|---|---|---|---|\n| **Cú pháp boilerplate** | Hàng chục dòng getter/setter/equals | 1 annotation nhưng cần Annotation Processor | ⭐ **1 dòng duy nhất** (Native trong compiler) |\n| **Tính bất biến** | Khả biến (Mutable) nguy hiểm | Bất biến (nhờ bytecode manipulation) | ⭐ **Bất biến nguyên thủy ở cấp ngôn ngữ** |\n| **Hỗ trợ Serialization** | Tiềm ẩn lỗi bảo mật qua constructor rỗng | Tùy thuộc vào cấu hình | ⭐ **Siêu an toàn**: Bắt buộc đi qua Constructor chính |\n| **Khả năng kế thừa** | Kế thừa class thoải mái | Hạn chế | Không thể kế thừa class khác (Đã extend `Record`) |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Compact Constructor & Defensive Copy)\n\n```java\npackage vn.mastery.ecommerce.dto;\n\nimport java.util.List;\nimport java.util.Objects;\n\npublic record CheckoutRequest(String customerId, List<String> skuList, long totalAmount) {\n\n    // ✅ COMPACT CONSTRUCTOR: Không cần viết lại (String customerId, List<String> skuList, ...)\n    public CheckoutRequest {\n        Objects.requireNonNull(customerId, \"customerId không được null\");\n        if (totalAmount <= 0) {\n            throw new IllegalArgumentException(\"Tổng tiền phải lớn hơn 0!\");\n        }\n        // Đảm bảo Deep Immutability: Tạo unmodifiable defensive copy cho collection\n        skuList = (skuList == null) ? List.of() : List.copyOf(skuList);\n        customerId = customerId.trim(); // Normalize dữ liệu trước khi gán ngầm vào field\n    }\n\n    // Accessor tùy biến nếu cần\n    @Override\n    public List<String> skuList() {\n        return skuList; // Đã là unmodifiable list nên an toàn tuyệt đối\n    }\n}\n```\n\n### Bảng Phân Tích Logic Compact Constructor:\n\n| Cú pháp | Bản chất thực thi | Tác dụng |\n|---|---|---|\n| `public CheckoutRequest { ... }` | Mã nguồn này được chèn vào ngay trước khi gán tham số vào field `private final` | Cho phép can thiệp chuẩn hóa dữ liệu mà không cần gõ `this.x = x` |\n| `List.copyOf(skuList)` | Tạo một danh sách độc lập hoàn toàn với list bên ngoài truyền vào | Chống việc bên ngoài thay đổi phần tử sau khi tạo Record |\n| Gán `customerId = customerId.trim()` | Thay đổi giá trị biến tham số trước lệnh gán trường ngầm định | Tự động loại bỏ khoảng trắng thừa |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Ngộ nhận Record tự động làm bất biến các object bên trong nó\n- **Vấn đề**: Record chứa `List<User>` hoặc `Date`. Dù không có setter, bên ngoài vẫn có thể lấy `record.list().add(...)` hoặc sửa thuộc tính của `User`.\n- **Giải pháp**: Luôn dùng `List.copyOf()` trong Compact Constructor và chỉ chứa các Record hoặc Immutable Object bên trong Record.\n\n### Checklist Bài 1.1\n- [ ] Dùng Record cho toàn bộ các DTO, Event Payload và Key đối tượng.\n- [ ] Triển khai kiểm tra tính hợp lệ dữ liệu ngay trong Compact Constructor.\n- [ ] Áp dụng Defensive Copying nếu Record có chứa Collection.\n"
        },
        {
          "id": "j1-1-2",
          "type": "practice",
          "title": "Bài 1.2: Sealed Classes & Interfaces: Kiểm Soát Phân Cấp & Exhaustive Pattern Matching",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Hiểu rõ triết lý của **Sealed Classes & Interfaces** (JEP 409): Giới hạn chính xác những class nào được phép kế thừa.\n- Nắm vững 3 từ khóa định vị quyền kế thừa của class con: `final`, `sealed`, và `non-sealed`.\n- Kết hợp Sealed Types với Pattern Matching để đạt tính năng **Exhaustiveness** (Không cần nhánh `default`).\n- Ứng dụng mô hình hóa máy trạng thái đơn hàng (Order State Machine) an toàn tuyệt đối ở Compile-time.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: DANH SÁCH KHÁCH MỜI DẠ TIỆC CỦA VUA\n- Class `public` thông thường: Giống như một hội chợ mở cửa tự do. Bất kỳ ai qua đường cũng có thể bước vào (Ai cũng có thể `extends` class của bạn).\n- Class `final`: Cửa đóng kín hoàn toàn, nội bất xuất ngoại bất nhập (Cấm 100% kế thừa).\n- **Sealed Class**: Giống như một dạ tiệc cung đình có **Danh sách khách mời chính danh (`permits`)**: Chỉ những vị khách có tên trên thiệp mời mới được phép bước vào kế thừa!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Sealed Class Của Java)\n\n```mermaid\nclassDiagram\n    class OrderEvent {\n        <<sealed interface>>\n    }\n    class OrderCreatedEvent {\n        <<final record>>\n    }\n    class OrderPaidEvent {\n        <<final record>>\n    }\n    class OrderCancelledEvent {\n        <<final record>>\n    }\n\n    OrderEvent <|.. OrderCreatedEvent : permits\n    OrderEvent <|.. OrderPaidEvent : permits\n    OrderEvent <|.. OrderCancelledEvent : permits\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Kế Thừa Mở vs Sealed Hierarchy)\n\n| Tiêu chí | Kế thừa thông thường (`abstract class`) | Sealed Class / Interface (`sealed ... permits`) |\n|---|---|---|\n| **Kiểm soát kế thừa** | Bất kỳ ai trong project đều `extends` được | Chỉ các class được liệt kê trong `permits` mới được `extends` |\n| **Kiểm tra Exhaustive (`switch`)** | Bắt buộc phải có nhánh `default:` | ⭐ **Compiler biết toàn bộ nhánh**, không cần `default` |\n| **Bảo trì khi thêm loại mới** | Thêm class con mới dễ sót logic ở các tầng gọi | Thêm class mới vào `permits`, **Compiler báo đỏ toàn bộ nơi cần xử lý** |\n| **Phù hợp nhất cho** | Framework mở rộng cho bên thứ ba | **Mô hình hóa Domain nghiệp vụ nội bộ (Domain Modeling)** |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (State Machine Xử Lý Sự Kiện)\n\n```java\npackage vn.mastery.ecommerce.event;\n\nimport java.time.Instant;\n\n// 1. Khai báo sealed interface chỉ cho phép 3 loại sự kiện cụ thể\npublic sealed interface OrderEvent \n    permits OrderCreatedEvent, OrderPaidEvent, OrderCancelledEvent {\n    String orderId();\n    Instant timestamp();\n}\n\n// 2. Các class con bắt buộc phải là final, sealed hoặc non-sealed\npublic record OrderCreatedEvent(String orderId, long amount, Instant timestamp) implements OrderEvent {}\npublic record OrderPaidEvent(String orderId, String transactionId, Instant timestamp) implements OrderEvent {}\npublic record OrderCancelledEvent(String orderId, String reason, Instant timestamp) implements OrderEvent {}\n\n// 3. Xử lý Exhaustive Pattern Matching Switch\npublic class OrderEventHandler {\n\n    public String handle(OrderEvent event) {\n        // Compiler tự động xác thực đủ 3 case, không cần nhánh default!\n        return switch (event) {\n            case OrderCreatedEvent created -> \n                \"Khởi tạo đơn \" + created.orderId() + \" với số tiền \" + created.amount();\n            case OrderPaidEvent paid -> \n                \"Thanh toán thành công mã GD: \" + paid.transactionId();\n            case OrderCancelledEvent cancelled -> \n                \"Đơn bị hủy do: \" + cancelled.reason();\n        };\n    }\n}\n```\n\n### Bảng Phân Tích Cơ Chế Exhaustiveness:\n\n| Dòng lệnh | Cơ chế ngầm định của Compiler | Lợi ích khi refactor |\n|---|---|---|\n| `sealed interface ... permits ...` | Lưu danh sách class được cấp phép vào thuộc tính `PermittedSubclasses` của file .class | Chặn đứng việc class bên ngoài lén lút kế thừa |\n| `switch (event) { case ... }` | Java Compiler duyệt qua danh sách `PermittedSubclasses` | Nếu bạn thêm `OrderRefundedEvent` vào `permits`, lệnh switch này lập tức báo lỗi đỏ compile-time, giúp bạn không bao giờ bỏ quên xử lý sự kiện mới! |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Khai báo class con là `non-sealed` làm mất tính toàn vẹn\n- **Vấn đề**: Đánh dấu một class con là `non-sealed` sẽ mở toang cánh cửa cho các class cháu chắt kế thừa tự do, làm mất khả năng kiểm tra Exhaustive của compiler.\n- **Giải pháp**: Ưu tiên tối đa biến các class con thành `final record` hoặc `final class`.\n\n### Checklist Bài 1.2\n- [ ] Dùng Sealed Interfaces để định nghĩa tập hữu hạn các Events hoặc Commands.\n- [ ] Kết hợp Sealed Hierarchy với Switch Pattern Matching thay vì chuỗi `if-else if`.\n- [ ] Tận dụng cảnh báo compiler để phát hiện các nhánh logic bị bỏ quên khi thêm tính năng mới.\n"
        },
        {
          "id": "j1-1-3",
          "type": "practice",
          "title": "Bài 1.3: Pattern Matching Cho Switch & Record Patterns (Destructuring Data)",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Nắm vững tính năng **Pattern Matching for switch** (JEP 441) và **Record Patterns** (JEP 440) trong Java 21.\n- Loại bỏ hoàn toàn các chuỗi ép kiểu thô lỗ `(Type) obj` và `instanceof` lồng nhau.\n- Bóc tách thuộc tính của đối tượng trực tiếp trong chữ ký case (Destructuring Patterns).\n- Sử dụng mệnh đề `when` (Guarded Patterns) để lọc điều kiện logic ngay trên pattern.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: MÁY QUÉT HÀNH LÝ SÂN BAY TỰ ĐỘNG\n- Cách cũ (Java 8): Bạn mở vali của khách ra, nhấc từng món đồ lên, soi kính lúp xem nó là gì (`if (obj instanceof Laptop)`), rồi tự tay bê nó sang bàn kiểm tra (`(Laptop) obj`).\n- **Pattern Matching Java 21**: Giống như máy quét tia X AI! Máy quét xuyên qua lớp vỏ vali, nhận diện ngay: *\"Đây là chiếc Laptop Dell có màn hình 15 inch và pin còn 80%\"* (`case Laptop(String brand, int size, int battery) when battery > 50`) chỉ trong một bước duy nhất!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Pattern Matching & Record Destructuring)\n\n```mermaid\nflowchart TD\n    Req[\"Đối Tượng Payload Tổng Quát (Object)\"] --> Switch{\"switch (payload)\"}\n    Switch -->|\"Kiểm tra & Bóc tách trực tiếp\"| C1[\"case PaymentRequest(var id, var amount) when amount > 10_000_000L<br/>➔ Xử lý VIP Cảnh Báo Gian Lận\"]\n    Switch -->|\"Khớp kiểu & gán biến\"| C2[\"case PaymentRequest(var id, var amount)<br/>➔ Trừ tiền thông thường\"]\n    Switch -->|\"Khớp rỗng\"| C3[\"case null<br/>➔ Ném lỗi BadRequestException\"]\n    style C1 fill:#7f1d1d,stroke:#ef4444,color:#fff\n    style C2 fill:#064e3b,stroke:#10b981,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Code Cũ vs Java 21 Pattern Matching)\n\n| Tiêu chí | Java 8/11 Truyền Thống | Java 21 Pattern Matching |\n|---|---|---|\n| **Kiểm tra kiểu & Ép kiểu** | 2 bước: `if (o instanceof User) { User u = (User) o; }` | ⭐ 1 bước: `if (o instanceof User u)` |\n| **Bóc tách dữ liệu Record** | Phải gọi từng hàm: `req.customerId()`, `req.amount()` | ⭐ Bóc tách thẳng: `case Request(var custId, var amt)` |\n| **Lọc điều kiện phụ** | Viết `if` lồng sâu bên trong nhánh case | Dùng mệnh đề `when` ngay tại định nghĩa case |\n| **Xử lý giá trị null** | Ném `NullPointerException` nếu không check trước | Hỗ trợ `case null:` trực tiếp trong switch |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Hệ Thống Đánh Giá Rủi Ro Gian Lận)\n\n```java\npackage vn.mastery.ecommerce.fraud;\n\npublic class FraudDetectionEngine {\n\n    public record Location(String ip, String countryCode) {}\n    public record Transaction(String txnId, long amount, Location location) {}\n\n    // Bóc tách Record lồng nhau (Nested Record Patterns) kết hợp Guarded Pattern\n    public String evaluateRisk(Object request) {\n        return switch (request) {\n            case null -> \"PAYLOAD_NULL_ERROR\";\n\n            // Bóc tách Transaction lồng Location, kèm điều kiện ngoại lệ\n            case Transaction(var id, var amt, Location(var ip, var country)) \n                when amt >= 50_000_000L && !\"VN\".equals(country) -> \n                \"HIGH_RISK_ALERT: Giao dịch trên 50 triệu từ nước ngoài (\" + country + \") qua IP \" + ip;\n\n            case Transaction(var id, var amt, var loc) when amt >= 100_000_000L -> \n                \"MANUAL_REVIEW_REQUIRED: Giao dịch vượt ngưỡng 100 triệu\";\n\n            case Transaction(var id, var amt, var loc) -> \n                \"AUTO_APPROVED: Giao dịch an toàn\";\n\n            default -> \"UNKNOWN_PAYLOAD_TYPE\";\n        };\n    }\n}\n```\n\n### Bảng Bóc Tách Cú Pháp:\n\n| Cú pháp Pattern | Ý nghĩa thực thi | Giá trị trong hệ thống |\n|---|---|---|\n| `Transaction(var id, var amt, Location(var ip, var country))` | Bóc tách đệ quy 2 tầng Record: Lấy trường `id`, `amt` và chui vào trong `Location` lấy `ip`, `country` | Tiết kiệm 10 dòng gọi getter rườm rà |\n| `when amt >= 50_000_000L && ...` | Mệnh đề Guarded Pattern: Chỉ nhảy vào case nếu biểu thức boolean trả về `true` | Biến switch thành một Rule Engine cực mạnh mẽ |\n| `case null ->` | Xử lý an toàn khi tham số truyền vào là `null` | Triệt tiêu hoàn toàn `NullPointerException` tại cổng switch |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Thứ tự case bị che khuất (Dominance of Patterns)\n- **Vấn đề**: Nếu bạn đặt case tổng quát `case Transaction t` lên trên case có điều kiện `case Transaction t when t.amount() > 50`, Java Compiler sẽ báo lỗi **Pattern Dominance Error** vì case dưới không bao giờ có cơ hội chạm tới!\n- **Giải pháp**: Luôn sắp xếp case từ cụ thể nhất (có điều kiện `when`) đến tổng quát nhất.\n\n### Checklist Bài 1.3\n- [ ] Loại bỏ 100% các thao tác ép kiểu tường minh `(MyClass) obj` trong toàn bộ dự án.\n- [ ] Tận dụng Record Patterns để destructure dữ liệu trực tiếp trong luồng nghiệp vụ.\n- [ ] Luôn xử lý `case null` tường minh trong các lệnh switch quan trọng.\n"
        },
        {
          "id": "j1-1-4",
          "type": "practice",
          "title": "Bài 1.4: Sequenced Collections (JEP 431) & Biến Vô Danh Unnamed Patterns (Java 21)",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải quyết sự thiếu nhất quán 25 năm của Java Collections bằng **Sequenced Collections (JEP 431)**.\n- Thao tác lấy phần tử đầu, phần tử cuối và đảo ngược Collection với API thống nhất: `getFirst()`, `getLast()`, `reversed()`.\n- Sử dụng biến vô danh ký hiệu gạch dưới `_` (**Unnamed Variables & Patterns - JEP 443**) để làm sạch code.\n- Loại bỏ các biến thừa không dùng trong catch block, lambda và vòng lặp.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CUỐN SỔ CÓ ĐẦU CÓ ĐUÔI VÀ CHIẾC THÙNG RÁC GẠCH DƯỚI\n- **Sự hỗn loạn trước Java 21**: Bạn muốn lấy phần tử cuối cùng:\n  - Với `List`: Bạn phải gõ `list.get(list.size() - 1)`.\n  - Với `Deque`: Bạn phải gọi `deque.getLast()`.\n  - Với `SortedSet`: Bạn phải gọi `set.last()`.\n  - Mỗi nơi một kiểu! Java 21 đã thống nhất tất cả: Cứ có thứ tự là gọi chung `.getFirst()` và `.getLast()`.\n- **Biến vô danh `_`**: Giống như bạn đi nhận hàng bưu điện, bạn chỉ quan tâm gói hàng bên trong, còn chiếc dây chun buộc hộp thì ném thẳng vào sọt rác (Đặt tên là `_`) chứ không cần tốn công đặt tên cho nó!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Cây Phả Hệ Sequenced Collections)\n\n```mermaid\nclassDiagram\n    class SequencedCollection {\n        <<interface>>\n        +reversed() SequencedCollection\n        +addFirst(E)\n        +addLast(E)\n        +getFirst() E\n        +getLast() E\n        +removeFirst() E\n        +removeLast() E\n    }\n    class List { <<interface>> }\n    class Deque { <<interface>> }\n    class SequencedSet { <<interface>> }\n\n    SequencedCollection <|-- List\n    SequencedCollection <|-- Deque\n    SequencedCollection <|-- SequencedSet\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Thao Tác Đầu / Cuối)\n\n| Thao tác | Trước Java 21 (Hỗn loạn) | Java 21 Sequenced Collections (Thống nhất) |\n|---|---|---|\n| **Lấy phần tử đầu** | `list.get(0)`, `deque.getFirst()`, `set.first()` | ⭐ `collection.getFirst()` |\n| **Lấy phần tử cuối** | `list.get(list.size() - 1)`, `deque.getLast()` | ⭐ `collection.getLast()` |\n| **Tạo view đảo ngược** | Phải gọi `Collections.reverse(list)` (Sửa mảng gốc) | ⭐ `collection.reversed()` ($O(1)$ Reverse View) |\n| **Thêm vào đầu danh sách** | `list.add(0, e)` | ⭐ `collection.addFirst(e)` |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Ứng Dụng Trong Giỏ Hàng & Log)\n\n```java\npackage vn.mastery.ecommerce.modern;\n\nimport java.util.LinkedHashMap;\nimport java.util.List;\nimport java.util.SequencedCollection;\nimport java.util.SequencedMap;\n\npublic class RecentActivityTracker {\n\n    // 1. Dùng Sequenced Collections để lấy hoạt động gần nhất\n    public static void logRecentActivities(SequencedCollection<String> history) {\n        if (!history.isEmpty()) {\n            System.out.println(\"Hoạt động đầu tiên: \" + history.getFirst());\n            System.out.println(\"Hoạt động mới nhất: \" + history.getLast());\n            \n            // Duyệt theo chiều ngược lại mà KHÔNG làm thay đổi danh sách gốc\n            for (String activity : history.reversed()) {\n                System.out.println(\"-> Ngược dòng: \" + activity);\n            }\n        }\n    }\n\n    // 2. Dùng Unnamed Variables (_) để bỏ qua các tham số thừa\n    public static void parseTransactions(List<String> rawRows) {\n        for (String row : rawRows) {\n            try {\n                processRow(row);\n            } catch (NumberFormatException _) { \n                // Dùng _ để báo hiệu rõ ràng biến ngoại lệ này cố tình không dùng đến\n                System.err.println(\"Dòng sai định dạng số, bỏ qua!\");\n            }\n        }\n    }\n\n    private static void processRow(String row) { /* ... */ }\n}\n```\n\n### Bảng Bóc Tách Tính Năng:\n\n| Cú pháp | Bản chất kỹ thuật | Giá trị sản xuất |\n|---|---|---|\n| `history.reversed()` | Trả về một **View** đảo ngược $O(1)$, không copy mảng hay mutate mảng gốc | Tiết kiệm 100% chi phí CPU và RAM khi duyệt ngược |\n| `catch (NumberFormatException _)` | Unnamed Variable: Trình biên dịch không sinh biến cục bộ trên stack | Làm sạch SonarQube linter warning \"Unused variable\" |\n| `SequencedMap` | Hỗ trợ `firstEntry()`, `lastEntry()`, `pollFirstEntry()` | Quản trị bộ đệm LRU Cache cực kỳ ngắn gọn |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Nhầm lẫn giữa `reversed()` và `Collections.reverse()`\n- **Vấn đề**: `Collections.reverse(list)` làm đảo ngược trực tiếp dữ liệu của List gốc (Side-effect). Trong khi `list.reversed()` chỉ trả về một góc nhìn (View) đảo ngược mà danh sách gốc vẫn giữ nguyên thứ tự!\n- **Giải pháp**: Luôn ưu tiên dùng `list.reversed()` để đảm bảo tính bất biến dữ liệu.\n\n### Checklist Bài 1.4\n- [ ] Thay thế toàn bộ các cú pháp rườm rà `list.get(list.size() - 1)` bằng `list.getLast()`.\n- [ ] Dùng `_` cho các biến không sử dụng trong Lambda, catch blocks và try-with-resources.\n- [ ] Sử dụng `SequencedMap` khi thiết kế bộ nhớ đệm có giới hạn (Cache).\n"
        }
      ],
      "quiz": {
        "id": "j1-quiz-1",
        "type": "quiz",
        "title": "Sát Hạch Module J1.1: Modern Java 17/21 LTS Features",
        "questions": [
          {
            "level": "medium",
            "scenario": "Một hệ thống xử lý giao dịch định nghĩa: public sealed interface Transaction permits CashTxn, CardTxn {}. Trong hàm xử lý switch(txn), lập trình viên viết đủ 2 case cho CashTxn và CardTxn. 3 tháng sau, một đồng nghiệp thêm class CryptoTxn vào danh sách permits.",
            "q": "Hiện tượng gì sẽ xảy ra tại thời điểm biên dịch (Compile-time)?",
            "options": [
              "Trình biên dịch Java lập tức báo lỗi đỏ tại lệnh switch vì thiếu case cho CryptoTxn (Vi phạm Exhaustiveness).",
              "Chương trình vẫn biên dịch bình thường và bỏ qua CryptoTxn khi chạy.",
              "Trình biên dịch tự động sinh ra case rỗng cho CryptoTxn.",
              "Hệ thống bị ném ngoại lệ NullPointerException lúc khởi động."
            ],
            "answer": 0,
            "explanation": "Đây là sức mạnh lớn nhất của Sealed Types kết hợp Switch Pattern Matching: Compiler kiểm tra tính đầy đủ (Exhaustiveness). Khi mở rộng thêm class con vào permits, mọi switch case chưa xử lý class mới này sẽ bị chặn ngay lúc compile."
          },
          {
            "level": "hard",
            "scenario": "Lập trình viên viết một Record: public record UserSession(String id, List<String> permissions) {}. Sau khi tạo UserSession session = new UserSession('1', new ArrayList<>(List.of('READ'))), bên ngoài gọi: session.permissions().add('ADMIN_ROOT');",
            "q": "Quyền 'ADMIN_ROOT' có bị thêm thành công vào session không?",
            "options": [
              "Có, quyền bị thêm thành công vì Record chỉ là shallow-immutable; biến List bên trong vẫn là mutable ArrayList.",
              "Không, compiler báo lỗi vì Record cấm gọi hàm sửa đổi.",
              "Ném ra ngoại lệ UnsupportedOperationException ngay lập tức.",
              "Record tự động tạo bản sao bất biến ngầm định nên không đổi."
            ],
            "answer": 0,
            "explanation": "Record chỉ đảm bảo các trường của nó là final (không gán lại được con trỏ). Nhưng nếu trường đó trỏ tới một object khả biến (Mutable) như ArrayList, nội dung bên trong nó vẫn bị sửa đổi bình thường! Phải dùng List.copyOf() trong Compact Constructor để ngăn chặn."
          }
        ]
      }
    }
  ]
};
})();
