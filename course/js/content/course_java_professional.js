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
  "quizCount": 4,
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
    "lastReviewedDate": "2026-10-05",
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
      "subtitle": "Records, Sealed Classes, Pattern Matching & Sequenced Collections",
      "icon": "💎",
      "color": "#059669",
      "desc": "Nâng cấp tư duy lập trình hiện đại: Record, Sealed Classes, Pattern Matching for switch, Record Patterns và Sequenced Collections.",
      "outcomes": [
        "Làm chủ Record: Canonical & Compact Constructors, deep immutability, DTO pattern chuẩn mực",
        "Ứng dụng Sealed Classes/Interfaces và Exhaustive Pattern Matching để mô hình hóa State Machine an toàn",
        "Bóc tách dữ liệu linh hoạt với Record Patterns và Guarded Patterns (mệnh đề when)",
        "Chuẩn hóa thao tác duyệt danh sách hai chiều với Sequenced Collections (JEP 431)"
      ],
      "topics": [
        {
          "id": "modern-oop-data",
          "title": "Mô Hình Dữ Liệu Hiện Đại (Records & Sealed Classes)",
          "lessonIds": [
            "j1-1-1",
            "j1-1-2"
          ]
        },
        {
          "id": "patterns-and-collections",
          "title": "Pattern Matching & Cấu Trúc Dữ Liệu Java 21",
          "lessonIds": [
            "j1-1-3",
            "j1-1-4"
          ]
        }
      ],
      "retrievalWarmup": [
        {
          "q": "Đặc điểm mấu chốt của một Immutable Class chuẩn mực trong Java là gì?",
          "options": [
            "Class là final, mọi trường là private final, không cung cấp setter và tạo defensive copy cho các mutable fields.",
            "Chỉ cần đánh dấu từ khóa final ở class và các trường.",
            "Sử dụng static method thay vì constructor.",
            "Khai báo interface thay vì class thông thường."
          ],
          "answer": 0,
          "explain": "Một class bất biến thực sự phải chặn kế thừa (final class), trường dữ liệu không thể gán lại (private final), không lộ setter và phải clone/defensive copy các object khả biến (như Date, List) để bên ngoài không can thiệp được."
        },
        {
          "q": "Tại sao từ khóa 'instanceof' truyền thống kết hợp ép kiểu tường minh '(TargetType) obj' lại bị coi là 'code smell'?",
          "options": [
            "Dễ phát sinh lỗi ClassCastException lúc runtime nếu logic kiểm tra sai sót, gây boilerplate rườm rà và khó refactor.",
            "Làm chương trình chạy chậm hơn 100 lần do CPU không tối ưu được.",
            "Gây rò rỉ bộ nhớ Heap vì đối tượng bị nhân đôi.",
            "Không thể sử dụng được bên trong các hàm generic."
          ],
          "answer": 0,
          "explain": "Ép kiểu thủ công (explicit casting) làm mất tính an toàn của type system lúc biên dịch. Pattern Matching trong Java hiện đại tích hợp kiểm tra kiểu và gán biến cục bộ ngay trong một bước an toàn."
        },
        {
          "q": "Phương thức nào sau đây trên List truyền thống sẽ làm thay đổi (mutate) thứ tự trực tiếp của danh sách ban đầu?",
          "options": [
            "Collections.reverse(list)",
            "list.reversed() (Java 21 Sequenced Collection)",
            "list.stream().sorted()",
            "List.copyOf(list)"
          ],
          "answer": 0,
          "explain": "Collections.reverse(list) hoán đổi trực tiếp các phần tử trong danh sách gốc (side-effect). Ngược lại, list.reversed() của Java 21 chỉ tạo ra một View đảo ngược O(1) mà giữ nguyên danh sách gốc."
        }
      ],
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
            "targetLessonId": "j1-1-2",
            "scenario": "Một hệ thống xử lý giao dịch định nghĩa: public sealed interface Transaction permits CashTxn, CardTxn {}. Trong hàm xử lý switch(txn), lập trình viên viết đủ 2 case cho CashTxn và CardTxn. 3 tháng sau, một đồng nghiệp thêm class CryptoTxn vào danh sách permits.",
            "q": "Hiện tượng gì sẽ xảy ra tại thời điểm biên dịch (Compile-time)?",
            "options": [
              "Trình biên dịch Java lập tức báo lỗi đỏ tại lệnh switch vì thiếu case cho CryptoTxn (Vi phạm Exhaustiveness).",
              "Chương trình vẫn biên dịch bình thường và bỏ qua CryptoTxn khi chạy.",
              "Trình biên dịch tự động sinh ra case rỗng cho CryptoTxn.",
              "Hệ thống bị ném ngoại lệ NullPointerException lúc khởi động."
            ],
            "answer": 0,
            "explain": "Đây là sức mạnh lớn nhất của Sealed Types kết hợp Switch Pattern Matching: Compiler kiểm tra tính đầy đủ (Exhaustiveness). Khi mở rộng thêm class con vào permits, mọi switch case chưa xử lý class mới này sẽ bị chặn ngay lúc compile."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-1-1",
            "scenario": "Lập trình viên viết một Record: public record UserSession(String id, List<String> permissions) {}. Sau khi tạo UserSession session = new UserSession('1', new ArrayList<>(List.of('READ'))), bên ngoài gọi: session.permissions().add('ADMIN_ROOT');",
            "q": "Quyền 'ADMIN_ROOT' có bị thêm thành công vào session không?",
            "options": [
              "Có, quyền bị thêm thành công vì Record chỉ là shallow-immutable; biến List bên trong vẫn là mutable ArrayList.",
              "Không, compiler báo lỗi vì Record cấm gọi hàm sửa đổi.",
              "Ném ra ngoại lệ UnsupportedOperationException ngay lập tức.",
              "Record tự động tạo bản sao bất biến ngầm định nên không đổi."
            ],
            "answer": 0,
            "explain": "Record chỉ đảm bảo các trường của nó là final (không gán lại được con trỏ). Nhưng nếu trường đó trỏ tới một object khả biến (Mutable) như ArrayList, nội dung bên trong nó vẫn bị sửa đổi bình thường! Phải dùng List.copyOf() trong Compact Constructor để ngăn chặn."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-1-1",
            "scenario": "Lập trình viên muốn validate trường 'email' không được null và phải chứa ký tự '@' bên trong Record Account(String email, String username).",
            "q": "Cú pháp chuẩn mực và tối ưu nhất của Java Record để thực hiện validate này là gì?",
            "options": [
              "Dùng Compact Constructor: public Account { Objects.requireNonNull(email); if(!email.contains(\"@\")) throw new IllegalArgumentException(); }",
              "Dùng setter truyền thống: public void setEmail(String email) { ... }",
              "Ghi đè Canonical Constructor lặp lại toàn bộ danh sách tham số: public Account(String email, String username) { this.email = email; ... }",
              "Dùng static factory method duy nhất và private constructor."
            ],
            "answer": 0,
            "explain": "Compact Constructor (bỏ qua danh sách tham số và lệnh gán `this.x = x`) là tính năng đặc trưng của Record, cho phép validate và normalize dữ liệu trước khi các trường được compiler gán ngầm định."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-1-1",
            "scenario": "Một lập trình viên muốn cho Record OrderItem kế thừa từ BaseEntity (class chứa trường id và createdAt) để tái sử dụng mã nguồn.",
            "q": "Trình biên dịch Java phản ứng như thế nào với lệnh 'public record OrderItem(...) extends BaseEntity'?",
            "options": [
              "Báo lỗi biên dịch ngay lập tức vì mọi Java Record đều đã kế thừa ngầm từ java.lang.Record và Java không hỗ trợ đa kế thừa class.",
              "Biên dịch thành công nếu BaseEntity là abstract class rỗng.",
              "Biên dịch thành công nhưng cảnh báo runtime warning.",
              "Tự động chuyển BaseEntity thành Interface."
            ],
            "answer": 0,
            "explain": "Java Record tự động kế thừa java.lang.Record ở cấp độ Bytecode và là final class. Do Java là ngôn ngữ đơn kế thừa class, Record KHÔNG THỂ extends bất kỳ class nào khác (chỉ được implements interface)."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-1-2",
            "scenario": "Trong một kiến trúc Microservices, bạn muốn định nghĩa sealed interface PaymentMethod permits CreditCard, EWallet, Crypto. Class nào sau đây là KHÔNG hợp lệ khi kế thừa PaymentMethod?",
            "q": "Quy tắc định vị quyền kế thừa của class con trực tiếp của một Sealed Interface là gì?",
            "options": [
              "Class con trực tiếp bắt buộc phải được khai báo với đúng 1 trong 3 modifier: final, sealed, hoặc non-sealed.",
              "Class con trực tiếp có thể khai báo là class thông thường không cần modifier đặc biệt.",
              "Toàn bộ các class con bắt buộc phải là abstract class.",
              "Các class con phải nằm khác package với Sealed Interface cha."
            ],
            "answer": 0,
            "explain": "Quy tắc vàng của Sealed Types: Mọi class con trực tiếp được liệt kê trong permits bắt buộc phải chỉ định rõ tương lai kế thừa bằng đúng 1 trong 3 từ khóa: final (chặn đứng kế thừa), sealed (tiếp tục giới hạn class cháu), hoặc non-sealed (mở toang kế thừa tự do)."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-1-2",
            "scenario": "Lập trình viên muốn một class con `Cash` kế thừa `sealed interface Payment` nhưng muốn sau này các thư viện bên thứ ba có thể tự do mở rộng thêm các loại tiền mặt khác mà không bị compiler chặn.",
            "q": "Lập trình viên nên đánh dấu class Cash bằng từ khóa nào?",
            "options": [
              "non-sealed class Cash implements Payment",
              "open class Cash implements Payment",
              "unsealed class Cash implements Payment",
              "public flexible class Cash implements Payment"
            ],
            "answer": 0,
            "explain": "Từ khóa `non-sealed` cho phép một nhánh con thoát khỏi sự kiểm soát khép kín của sealed hierarchy cha, mở quyền kế thừa tự do cho các class con sau này."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-1-3",
            "scenario": "Xét đoạn mã sau: switch (order) { case Order(var id, var total) -> processGeneral(order); case Order(var id, var total) when total > 100_000_000L -> processVip(order); }",
            "q": "Chuyện gì sẽ xảy ra khi biên dịch đoạn mã trên?",
            "options": [
              "Báo lỗi Pattern Dominance Error lúc compile vì case thứ nhất tổng quát đã che khuất (dominate) hoàn toàn case thứ hai có điều kiện when.",
              "Biên dịch bình thường và nhánh VIP vẫn được ưu tiên khi chạy.",
              "Ném ngoại lệ IllegalStateException lúc runtime.",
              "Trình biên dịch tự động đảo thứ tự 2 case cho lập trình viên."
            ],
            "answer": 0,
            "explain": "Trong Java Switch Pattern Matching, quy tắc Dominance bắt buộc case có điều kiện lọc hẹp hơn (guarded pattern với `when`) phải được đặt TRƯỚC case tổng quát. Nếu đặt case bao quát ở trên, case hẹp ở dưới sẽ không bao giờ chạm tới và compiler báo lỗi ngay lập tức."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-1-3",
            "scenario": "Một hệ thống định nghĩa: record Point(int x, int y) {} và record Circle(Point center, int radius) {}. Trong lệnh switch, bạn muốn bóc tách trực tiếp tọa độ x của tâm hình tròn có bán kính lớn hơn 10.",
            "q": "Cú pháp Record Pattern lồng nhau (Nested Record Pattern) chuẩn xác là gì?",
            "options": [
              "case Circle(Point(int x, var _), var r) when r > 10 -> handle(x);",
              "case Circle.Point.x when Circle.radius > 10 -> handle(x);",
              "case Circle(center.x, center.y, radius) -> handle(center.x);",
              "case Circle where radius > 10 extract center.x -> handle(x);"
            ],
            "answer": 0,
            "explain": "Java 21 hỗ trợ Nested Record Patterns: Bạn có thể lồng mẫu của Point ngay bên trong tham số của Circle, kết hợp `when r > 10` để bóc tách thẳng tọa độ x chỉ trong một biểu thức duy nhất."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-1-3",
            "scenario": "Trong Java truyền thống trước bản 21, nếu bạn truyền biến có giá trị null vào lệnh `switch (obj)`, điều gì sẽ xảy ra?",
            "q": "Lệnh switch trong Java 21 xử lý giá trị null như thế nào?",
            "options": [
              "Java 21 cho phép khai báo tường minh 'case null -> ...' trực tiếp trong switch, triệt tiêu NullPointerException.",
              "Java 21 tự động bỏ qua toàn bộ switch và trả về null.",
              "Lệnh switch vẫn luôn ném NullPointerException kể cả khi có case null.",
              "Giá trị null tự động được ép kiểu thành chuỗi 'null'."
            ],
            "answer": 0,
            "explain": "Trước Java 21, switch(null) luôn ném NPE ngay tại cổng vào. Java 21 đã chuẩn hóa hỗ trợ `case null ->` (hoặc `case null, default ->`) giúp xử lý an toàn và thanh thoát mà không cần if(obj == null) bên ngoài."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-1-4",
            "scenario": "Hệ thống có một List<Order> orders đã sắp xếp theo thời gian đặt hàng. Lập trình viên muốn lấy đơn hàng mới nhất (nằm ở cuối danh sách) bằng API hiện đại của Java 21.",
            "q": "Cách viết nào sau đây chuẩn mực và an toàn nhất theo JEP 431 Sequenced Collections?",
            "options": [
              "orders.getLast()",
              "orders.get(orders.size() - 1)",
              "orders.lastElement()",
              "orders.stream().reduce((first, second) -> second).get()"
            ],
            "answer": 0,
            "explain": "JEP 431 Sequenced Collections bổ sung interface SequencedCollection cung cấp các phương thức thống nhất: `getFirst()`, `getLast()`, `addFirst()`, `addLast()`, `reversed()` thay thế cho các cách viết rườm rà `list.get(list.size() - 1)`."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-1-4",
            "scenario": "Một kỹ sư gọi `SequencedCollection<String> rev = list.reversed();` rồi sau đó duyệt vòng lặp qua `rev`. Kỹ sư khác lo ngại việc này sẽ tốn O(N) bộ nhớ RAM để sao chép danh sách ngược.",
            "q": "Bản chất kiến trúc bên dưới của phương thức `reversed()` trong Sequenced Collections là gì?",
            "options": [
              "Nó chỉ tạo ra một View O(1) nghịch đảo đại diện cho danh sách gốc, hoàn toàn không sao chép mảng hay tốn thêm RAM.",
              "Nó tạo ra một ArrayList mới và đảo ngược các phần tử tốn O(N) bộ nhớ.",
              "Nó đảo ngược trực tiếp các con trỏ trong mảng gốc làm hỏng dữ liệu ban đầu.",
              "Nó chuyển đổi danh sách thành LinkedList để duyệt hai chiều."
            ],
            "answer": 0,
            "explain": "Phương thức `reversed()` của Sequenced Collections hoạt động như một Reverse View với độ phức tạp thời gian và không gian là O(1). Các thay đổi trên view sẽ phản chiếu vào list gốc và ngược lại, không hề tốn RAM cấp phát mảng mới."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-1-4",
            "scenario": "Trong một khối bắt ngoại lệ: try { int port = Integer.parseInt(val); } catch (NumberFormatException e) { port = 8080; }. Linter SonarQube cảnh báo biến 'e' được khai báo nhưng không dùng đến.",
            "q": "Tính năng Java 21 nào (JEP 443) giải quyết triệt để cảnh báo này?",
            "options": [
              "Sử dụng biến vô danh với ký tự gạch dưới: catch (NumberFormatException _) { port = 8080; }",
              "Đặt tên biến là eIgnore: catch (NumberFormatException eIgnore)",
              "Bỏ qua tên biến: catch (NumberFormatException) { port = 8080; }",
              "Thêm annotation @SuppressWarnings(\"unused\") trước khối catch."
            ],
            "answer": 0,
            "explain": "Java 21 chính thức giới thiệu Unnamed Patterns and Variables (ký tự `_`). Khi bạn không cần dùng đến biến trong catch block, lambda parameter hoặc vòng lặp, việc đặt tên `_` báo hiệu cho compiler và linter biết biến này cố tình bị loại bỏ."
          }
        ]
      }
    },
    {
      "id": 202,
      "title": "Generics Chuyên Sâu, Type Erasure & Thiết Kế Thư Viện API (PECS)",
      "subtitle": "Generic Types, Type Erasure, Bridge Methods, Wildcards & PECS Principle",
      "icon": "🧬",
      "color": "#059669",
      "desc": "Làm chủ bản chất Generics trong Java: Ràng buộc kiểu, Type Erasure, Bridge Methods, Wildcards, quy tắc vàng PECS và kiến trúc Type Tokens.",
      "outcomes": [
        "Hiểu sâu cơ chế Generic Classes, Generic Methods và đa ràng buộc kiểu (Multiple Type Bounds)",
        "Giải mã cơ chế Type Erasure của HotSpot JVM, Bridge Methods và lý do mảng Generic bị cấm",
        "Áp dụng thành thạo nguyên tắc PECS (Producer Extends, Consumer Super) trong thiết kế Clean API",
        "Xây dựng Typesafe Heterogeneous Containers và Recursive Generic Builders nâng cao"
      ],
      "topics": [
        {
          "id": "generics-core-erasure",
          "title": "Cốt Lõi Generics & Cơ Chế Type Erasure",
          "lessonIds": [
            "j1-2-1",
            "j1-2-2"
          ]
        },
        {
          "id": "wildcards-pecs-advanced",
          "title": "Wildcards, PECS & Mẫu Thiết Kế Nâng Cao",
          "lessonIds": [
            "j1-2-3",
            "j1-2-4"
          ]
        }
      ],
      "retrievalWarmup": [
        {
          "q": "Tại sao Java 5 lại bổ sung tính năng Generics vào ngôn ngữ?",
          "options": [
            "Cung cấp cơ chế Type Safety tại thời điểm biên dịch (Compile-time) và loại bỏ thao tác ép kiểu thủ công (explicit cast).",
            "Giúp chương trình chạy nhanh hơn gấp 10 lần tại thời điểm thực thi (Runtime).",
            "Để hỗ trợ đa thừa kế giữa các lớp (Multiple Inheritance).",
            "Để thay thế hoàn toàn cấu trúc mảng nguyên thủy trong Java."
          ],
          "answer": 0,
          "explain": "Mục đích tối thượng của Generics là Type Safety tại thời điểm biên dịch: Phát hiện lỗi sai kiểu dữ liệu ngay khi compile, thay vì để phát nổ ClassCastException tại môi trường Production của khách hàng."
        },
        {
          "q": "Điều gì sẽ xảy ra nếu lập trình viên sử dụng 'Raw Type' (ví dụ: List list = new ArrayList();) trong mã nguồn Java hiện đại?",
          "options": [
            "Mất hoàn toàn khả năng kiểm tra an toàn kiểu của trình biên dịch và tiềm ẩn lỗi ClassCastException nguy hiểm.",
            "Trình biên dịch Java 21 từ chối biên dịch và báo lỗi cú pháp (Syntax Error).",
            "JVM tự động suy luận kiểu dữ liệu thông minh nên an toàn tuyệt đối.",
            "Mảng bên trong ArrayList tự động chuyển thành kiểu int nguyên thủy."
          ],
          "answer": 0,
          "explain": "Raw Type là tính năng tương thích ngược với Java 1.4. Sử dụng Raw Type làm mất hoàn toàn tính năng kiểm tra kiểu của Generics, khiến compiler không thể bảo vệ bạn trước các lỗi sai kiểu lúc runtime."
        },
        {
          "q": "Trong Java, mảng (Array) và Generic List có điểm khác biệt căn bản nào về tính tương thích kiểu (Variance)?",
          "options": [
            "Mảng là Covariant (String[] là con của Object[]) và Reified; còn Generics là Invariant (List<String> không phải là con của List<Object>) và Erased.",
            "Mảng và Generics có cơ chế kiểm tra kiểu hoàn toàn giống hệt nhau.",
            "Mảng là Invariant, còn Generics là Covariant.",
            "Mảng không tồn tại kiểu tại runtime, còn Generics giữ nguyên thông tin kiểu."
          ],
          "answer": 0,
          "explain": "Mảng là Covariant (dẫn đến ArrayStoreException lúc runtime) và Reified (biết kiểu lúc chạy). Ngược lại, Generic Types là Invariant (an toàn hơn lúc compile) và Erased (thông tin kiểu bị xóa sạch lúc compile)."
        }
      ],
      "quiz": {
        "id": "j1-quiz-2",
        "type": "quiz",
        "title": "Sát Hạch Module J1.2: Deep Generics, Type Erasure & PECS Architecture",
        "questions": [
          {
            "level": "hard",
            "targetLessonId": "j1-2-3",
            "scenario": "Một lập trình viên thiết kế thư viện thanh toán viết phương thức: public void processOrders(List<? extends Order> orders) { orders.add(new Order(\"101\")); }. Trình biên dịch Java phản ứng thế nào?",
            "q": "Hiện tượng gì xảy ra tại dòng lệnh 'orders.add(...)'?",
            "options": [
              "Báo lỗi biên dịch ngay lập tức vì List<? extends Order> là một Producer (chỉ đọc), compiler không thể đảm bảo an toàn kiểu khi thêm phần tử.",
              "Biên dịch thành công và thêm đối tượng vào danh sách bình thường.",
              "Chương trình biên dịch được nhưng ném UnsupportedOperationException lúc runtime.",
              "Compiler tự động ép kiểu đối tượng thành null."
            ],
            "answer": 0,
            "explain": "Nguyên tắc PECS: '? extends T' biểu thị một Producer (chỉ đọc dữ liệu). Vì compiler không thể biết chính xác danh sách lúc runtime là List của lớp con cụ thể nào (ví dụ List<VipOrder>), nên compiler cấm tiệt mọi thao tác ghi (add) ngoại trừ giá trị null."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-2-2",
            "scenario": "Lập trình viên muốn tạo một Generic Array trong lớp lưu trữ: public class Buffer<T> { private T[] elements = new T[10]; }.",
            "q": "Tại sao trình biên dịch Java báo lỗi đỏ tại lệnh 'new T[10]'?",
            "options": [
              "Do cơ chế Type Erasure, thông tin kiểu T bị xóa sạch lúc runtime; JVM không thể xác định kiểu phần tử để cấp phát cấu trúc mảng reified.",
              "Do mảng trong Java chỉ hỗ trợ các kiểu dữ liệu nguyên thủy (primitive types).",
              "Do từ khóa new chỉ được phép dùng với các lớp cụ thể đã implement Serializable.",
              "Do kích thước 10 vượt quá giới hạn cấp phát của Generics."
            ],
            "answer": 0,
            "explain": "Mảng trong Java là Reified (bắt buộc phải biết chính xác kiểu dữ liệu phần tử tại Runtime để kiểm tra tính an toàn ô nhớ). Trong khi đó, Generic type T bị xóa sạch (Type Erasure) khi biên dịch ra bytecode, do đó lệnh `new T[]` hoàn toàn bất khả thi."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-2-3",
            "scenario": "Bạn cần viết một phương thức tiện ích sao chép toàn bộ phần tử từ 'source' sang 'target'. Bạn muốn phương thức này linh hoạt tối đa cho người dùng thư viện.",
            "q": "Chữ ký phương thức nào sau đây tuân thủ chuẩn xác nguyên tắc PECS của Joshua Bloch?",
            "options": [
              "public static <T> void copy(List<? extends T> source, List<? super T> target)",
              "public static <T> void copy(List<? super T> source, List<? extends T> target)",
              "public static <T> void copy(List<T> source, List<T> target)",
              "public static <T> void copy(List<?> source, List<?> target)"
            ],
            "answer": 0,
            "explain": "PECS: Producer Extends, Consumer Super. 'source' là nguồn cung cấp dữ liệu (Producer) nên dùng '? extends T'. 'target' là nơi nhận và tiêu thụ dữ liệu (Consumer) nên dùng '? super T'."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-2-1",
            "scenario": "Một class generic cần giới hạn kiểu T phải vừa là lớp con của Number, vừa phải implement Comparable<T> và Serializable.",
            "q": "Cú pháp khai báo Bounded Type Parameter nào sau đây là hợp lệ trong Java?",
            "options": [
              "public class SafeNumber<T extends Number & Comparable<T> & Serializable>",
              "public class SafeNumber<T extends Comparable<T> & Number & Serializable>",
              "public class SafeNumber<T implements Number, Comparable<T>, Serializable>",
              "public class SafeNumber<T extends Number, implements Comparable<T>>"
            ],
            "answer": 0,
            "explain": "Quy tắc đa ràng buộc (Multiple Bounds) trong Java: Sử dụng dấu '&' để kết nối các ràng buộc. Nếu trong danh sách ràng buộc có chứa một Class (như Number), class đó BẮT BUỘC phải đứng ở vị trí đầu tiên trước các Interface."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-2-2",
            "scenario": "Cho interface: interface Task<T> { void execute(T param); } và class: class StringTask implements Task<String> { public void execute(String param) {} }. Khi biên dịch class StringTask, JVM sinh ra thêm điều gì trong bytecode?",
            "q": "Khái niệm kỹ thuật nào giải thích phương thức do compiler tự động sinh ra trong StringTask.class?",
            "options": [
              "Bridge Method (Synthetic Method): Nhận tham số Object và chuyển tiếp lời gọi sang phương thức nhận String để bảo toàn tính đa hình.",
              "Virtual Dispatch Table độc lập cho kiểu String.",
              "ClassLoader tự động nhân bản class StringTask thành hai phiên bản khác nhau.",
              "Reflection Handler tự động chặn mọi lời gọi lúc runtime."
            ],
            "answer": 0,
            "explain": "Sau khi Type Erasure xóa kiểu T thành Object, interface cha có phương thức `execute(Object)`. Để class con `execute(String)` vẫn ghi đè thành công theo tính đa hình, javac tự động sinh ra một 'Bridge Method' `execute(Object)` để ép kiểu và gọi `execute(String)`."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-2-4",
            "scenario": "Lập trình viên muốn xây dựng một Typesafe Heterogeneous Container để lưu trữ các dịch vụ ứng dụng với khóa là Class<T> và giá trị là đối tượng T tương ứng.",
            "q": "Phương thức lấy đối tượng ra khỏi Map: public <T> T getService(Class<T> type) nên hiện thực việc ép kiểu như thế nào để an toàn nhất?",
            "options": [
              "return type.cast(map.get(type));",
              "return (T) map.get(type); (với @SuppressWarnings)",
              "return (T) type.newInstance();",
              "return (T) map.get(type.getName());"
            ],
            "answer": 0,
            "explain": "Phương thức `type.cast(obj)` của đối tượng `Class<T>` thực hiện dynamic casting một cách an toàn và tường minh mà không gây ra bất kỳ cảnh báo unchecked warning nào, chuẩn mực cho pattern Typesafe Container."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-2-3",
            "scenario": "Một hàm nhận tham số: public void printSize(List<?> list). Lập trình viên gọi list.add(null) và list.add(\"hello\").",
            "q": "Lệnh nào sẽ biên dịch thành công?",
            "options": [
              "Chỉ lệnh list.add(null) biên dịch thành công; lệnh list.add(\"hello\") bị báo lỗi đỏ lúc compile.",
              "Cả hai lệnh đều biên dịch thành công.",
              "Cả hai lệnh đều bị báo lỗi biên dịch.",
              "Chỉ lệnh list.add(\"hello\") biên dịch thành công."
            ],
            "answer": 0,
            "explain": "Với Unbounded Wildcard `List<?>`, bạn không thể add bất kỳ đối tượng cụ thể nào vào danh sách vì không biết kiểu phần tử là gì. Giá trị DUY NHẤT được phép add là `null` vì null đại diện cho mọi kiểu tham chiếu."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-2-4",
            "scenario": "Khi thiết kế một hệ thống Fluent Builder có kế thừa: abstract class AbstractOrderBuilder<B extends AbstractOrderBuilder<B>>. Kỹ thuật này được gọi là gì trong lý thuyết ngôn ngữ lập trình?",
            "q": "Tên gọi chính xác của kỹ thuật Generic này là gì?",
            "options": [
              "Recursive Type Bound (hoặc F-bounded Polymorphism)",
              "Dynamic Type Dispatching",
              "Covariant Method Overriding",
              "Type Erasure Reflection"
            ],
            "answer": 0,
            "explain": "Kỹ thuật tham số kiểu tự tham chiếu tới chính nó hoặc lớp con của nó `<B extends AbstractOrderBuilder<B>>` được gọi là Recursive Type Bound (trong lý thuyết kiểu dữ liệu gọi là F-bounded Polymorphism), giúp bảo toàn kiểu trả về trong Fluent API khi kế thừa."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-2-1",
            "scenario": "Một lập trình viên viết: List<Object> list = new ArrayList<String>();. Trình biên dịch Java phản ứng thế nào?",
            "q": "Tại sao dòng lệnh trên không thể biên dịch thành công?",
            "options": [
              "Báo lỗi Type Mismatch vì Generics trong Java là Invariant (Bất biến); List<String> KHÔNG PHẢI là kiểu con của List<Object>.",
              "Biên dịch thành công vì String là con của Object.",
              "Chỉ cảnh báo vàng (compiler warning) nhưng vẫn sinh file .class.",
              "Ném ngoại lệ ClassCastException lúc runtime."
            ],
            "answer": 0,
            "explain": "Khác với mảng (Array là Covariant), Generics trong Java là Invariant (Bất biến). Dù String kế thừa Object, `List<String>` hoàn toàn KHÔNG kế thừa `List<Object>`. Nếu cho phép gán, bạn có thể gọi `list.add(12345)` nhét số vào danh sách chuỗi!"
          },
          {
            "level": "medium",
            "targetLessonId": "j1-2-2",
            "scenario": "Tại sao phương thức nhận tham số biến thiên generic varargs (ví dụ: public static <T> void logAll(T... args)) lại thường bị trình biên dịch cảnh báo 'Possible heap pollution'?",
            "q": "Bản chất nguyên nhân gây ra cảnh báo Heap Pollution là gì?",
            "options": [
              "Java tạo ngầm một mảng T[] (thực chất là Object[]) để chứa varargs, và mảng không an toàn kiểu này có thể bị gán nhầm đối tượng sai kiểu.",
              "Làm tràn bộ nhớ Heap vì số lượng tham số vô hạn.",
              "Gây dừng luồng Garbage Collection.",
              "Làm vô hiệu hóa bộ nhớ đệm CPU L1."
            ],
            "answer": 0,
            "explain": "Varargs trong Java được hiện thực bằng cách tạo ra một mảng ngầm. Nhưng mảng Generic `T[]` bị xóa kiểu thành `Object[]`. Nếu mảng này bị lộ ra ngoài hoặc bị sửa đổi, nó có thể chứa đối tượng sai kiểu dẫn đến ô nhiễm bộ nhớ (Heap Pollution)."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-2-4",
            "scenario": "Tại sao ta không thể lưu trữ kiểu generic phức tạp như List<String> trong Typesafe Container chuẩn bằng cách gọi container.bind(List<String>.class, list)?",
            "q": "Lý do kỹ thuật gì khiến cú pháp 'List<String>.class' không tồn tại trong Java?",
            "options": [
              "Do Type Erasure, chỉ tồn tại duy nhất một đối tượng class là List.class tại runtime; không có đối tượng class riêng cho List<String>.",
              "Do JVM cấm sử dụng String trong reflection.",
              "Do cú pháp dấu ngoặc nhọn bị trùng lặp với biểu thức lambda.",
              "Do List là một abstract class không thể lấy class literal."
            ],
            "answer": 0,
            "explain": "Tại runtime, toàn bộ các biến thể generic như `List<String>`, `List<Integer>`, `List<Order>` đều bị xóa kiểu và cùng chia sẻ chung duy nhất một đối tượng đại diện là `List.class`. Do đó cú pháp `List<String>.class` là không hợp lệ."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-2-3",
            "scenario": "Quy tắc vàng của Joshua Bloch khi áp dụng Wildcards cho giá trị trả về của phương thức là gì?",
            "q": "Có nên sử dụng Wildcard (? extends T hoặc ? super T) làm kiểu trả về (Return Type) của method không?",
            "options": [
              "Tuyệt đối không nên: Hãy linh hoạt kiểu ở tham số đầu vào (Arguments), nhưng trả về kiểu cụ thể tường minh để tránh gây khó khăn cho người dùng gọi API.",
              "Nên dùng cho 100% các phương thức để tăng tính đa hình.",
              "Chỉ dùng khi kiểu trả về là một Interface.",
              "Bắt buộc dùng nếu phương thức là public static."
            ],
            "answer": 0,
            "explain": "Quy tắc thiết kế API: 'Flexible in what you accept, strict in what you produce'. Trả về Wildcard ép người dùng method cũng phải khai báo wildcard, làm mã nguồn bên ngoài bị rối loạn và mất khả năng ghi dữ liệu."
          }
        ]
      },
      "lessons": [
        {
          "id": "j1-2-1",
          "type": "theory",
          "title": "Bài 2.1: Generic Classes, Methods & Ràng Buộc Kiểu (Bounded Type Parameters)",
          "minutes": 10,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Hiểu rõ cú pháp và kiến trúc của Generic Classes, Generic Interfaces và Generic Methods độc lập.\n- Nắm vững cú pháp ràng buộc trên (Upper Bounded Types): `<T extends Number>` và `<T extends Comparable<T>>`.\n- Áp dụng kỹ thuật đa ràng buộc (Multiple Bounds) `<T extends Entity & Serializable & Comparable<T>>`.\n- Phân biệt phạm vi tham số kiểu (Type Parameter Scope) giữa Class Level và Method Level.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: KHUÔN ĐÚC BÁNH THÔNG MINH CÓ CẢM BIẾN\n- Không dùng Generics (Object): Giống như một chiếc thùng xốp đựng đồ không nhãn. Bất kỳ ai cũng có thể nhét vào đó một quả táo, một viên gạch, hay một con cá. Khi thò tay vào lấy, bạn phải cầu nguyện không bốc nhầm gạch đập vào đầu!\n- **Generics (`<T>`)**: Chiếc hộp đựng bánh có nhãn định danh cụ thể: *\"Chỉ nhận bánh kem dâu\"*. Compiler là bác bảo vệ đứng ngay cửa: hễ ai mang gạch đến nhét vào là bị giữ lại ngay lập tức!\n- **Bounded Type (`<T extends Number>`)**: Chiếc khuôn đúc bánh có thước đo tự động: Bạn có thể đưa vào bột mì, bột gạo, bột ngô tùy thích, nhưng bắt buộc phải là *\"chất liệu ăn được\"*!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Generic Classes & Bounded Parameters)\n\n```mermaid\nclassDiagram\n    class Number {\n        <<abstract>>\n        +doubleValue() double\n    }\n    class Comparable~T~ {\n        <<interface>>\n        +compareTo(T) int\n    }\n    class PaymentAmount~T~ {\n        -T value\n        +getValue() T\n        +asDouble() double\n    }\n    PaymentAmount ..> Number : T extends Number\n    PaymentAmount ..> Comparable : & Comparable~T~\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận Đánh Đổi Thiết Kế API: Object vs Generics)\n\n| Tiêu chí | Dùng `Object` Truyền Thống | Dùng Generics (`<T>`) | Dùng Bounded Generics (`<T extends Comparable<T>>`) |\n|---|---|---|---|\n| **Kiểm tra an toàn kiểu (Type Safety)** | ❌ Lúc chạy (Runtime Crash) | ⭐ **100% lúc biên dịch (Compile-time)** | ⭐ **Compile-time + Nghiệp vụ ràng buộc** |\n| **Boilerplate ép kiểu (Casting)** | Bắt buộc phải ép kiểu `(Type) obj` | ⭐ Tự động ép kiểu an toàn ngầm định | Tự động, gọi trực tiếp hàm của cha |\n| **Khả năng tái sử dụng (Reusability)** | Cao nhưng nguy hiểm | Rất cao cho cấu trúc dữ liệu tổng quát | Rất cao cho các thuật toán tính toán/so sánh |\n| **Tối ưu hóa IDE & Auto-complete** | Chỉ gợi ý các hàm của `Object` | Gợi ý đúng kiểu cụ thể được khai báo | Gợi ý đầy đủ các phương thức của Type Bounds |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Hệ Thống Thanh Toán Đa Tiền Tệ)\n\n```java\npackage vn.mastery.ecommerce.payment;\n\nimport java.io.Serializable;\nimport java.math.BigDecimal;\nimport java.util.Objects;\n\n// 1. Generic Interface với Ràng buộc kiểu dữ liệu so sánh được\npublic interface SchedulablePayment<T extends Comparable<T>> {\n    T getPriority();\n}\n\n// 2. Generic Class với ĐA RÀNG BUỘC (Multiple Bounds): Vừa là Number vừa Serializable\npublic final class MonetaryAmount<T extends Number & Comparable<T> & Serializable> \n        implements SchedulablePayment<T>, Serializable {\n\n    private final String currencyCode;\n    private final T value;\n\n    public MonetaryAmount(String currencyCode, T value) {\n        this.currencyCode = Objects.requireNonNull(currencyCode, \"Mã tiền tệ không được null\");\n        this.value = Objects.requireNonNull(value, \"Giá trị thanh toán không được null\");\n    }\n\n    public T getValue() {\n        return value;\n    }\n\n    public double toDouble() {\n        // Gọi an toàn phương thức doubleValue() từ class Number mà không cần ép kiểu!\n        return value.doubleValue();\n    }\n\n    @Override\n    public T getPriority() {\n        return value;\n    }\n\n    // 3. Generic Method độc lập: Tìm giá trị lớn nhất trong mảng thanh toán\n    public static <E extends Comparable<E>> E findMax(E[] items) {\n        if (items == null || items.length == 0) {\n            return null;\n        }\n        E max = items[0];\n        for (E item : items) {\n            if (item.compareTo(max) > 0) {\n                max = item;\n            }\n        }\n        return max;\n    }\n}\n```\n\n### Bảng Phân Tích Kỹ Thuật:\n\n| Cú pháp Generic | Ý nghĩa kỹ thuật bên dưới | Lợi ích thiết kế phần mềm |\n|---|---|---|\n| `<T extends Number & Comparable<T>>` | Khai báo tham số kiểu `T` bắt buộc phải là lớp con của `Number` VÀ hiện thực interface `Comparable` | Cho phép vừa gọi toán học `.doubleValue()` vừa gọi so sánh `.compareTo()` |\n| `Class trước, Interface sau` | Quy tắc ngôn ngữ Java: Nếu có class trong multiple bounds, class bắt buộc phải đứng đầu tiên | Vi phạm sẽ báo lỗi biên dịch `interface expected here` |\n| `<E extends Comparable<E>> E findMax(E[] items)` | Khai báo một Generic Method tĩnh độc lập với tham số kiểu của class | Tái sử dụng thuật toán tìm Max cho bất kỳ kiểu dữ liệu nào có thứ tự |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Che khuất tham số kiểu (Type Parameter Shadowing)\n- **Vấn đề**: Trong class `class Repository<T>`, bạn lại viết `public <T> void save(T entity)`. Biến `T` của hàm đã che khuất (shadow) hoàn toàn biến `T` của class, gây hiểu lầm tai hại khi bảo trì mã nguồn!\n- **Giải pháp**: Nếu phương thức dùng chung kiểu với class, không khai báo lại `<T>` ở method; nếu là kiểu độc lập, hãy đặt tên khác như `<R>` hoặc `<U>`.\n\n### Checklist Bài 2.1\n- [ ] Luôn sử dụng Generics thay cho kiểu Raw Type (`List` thay vì `List<Order>`).\n- [ ] Đặt Class đầu tiên trong danh sách đa ràng buộc (`extends BaseClass & InterfaceA & InterfaceB`).\n- [ ] Đảm bảo không shadow biến kiểu giữa class level và method level.\n"
        },
        {
          "id": "j1-2-2",
          "type": "practice",
          "title": "Bài 2.2: Cơ Chế Type Erasure, Bridge Methods & Giới Hạn Runtime Reification",
          "minutes": 10,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải mã cơ chế **Type Erasure** của JVM: Bytecode thực tế lưu trữ cái gì sau khi biên dịch?\n- Khám phá hiện tượng **Bridge Methods**: Cách HotSpot bảo toàn tính đa hình ở mức Bytecode.\n- Hiểu rõ nguồn gốc sâu xa vì sao Java cấm: `new T()`, `new T[]`, và `instanceof List<String>`.\n- Phòng chống lỗi ô nhiễm bộ nhớ Heap (**Heap Pollution**) và cảnh báo `@SafeVarargs`.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: GIÀN GIÁO XÂY DỰNG VÀ TÒA NHÀ HOÀN THIỆN\n- **Lúc Biên Dịch (Compile-time)**: Generics giống như **giàn giáo và lưới an toàn** bao quanh công trình. Các bác thợ xây (Compiler) liên tục đo đạc, kiểm tra từng viên gạch để đảm bảo tòa nhà không bị đổ.\n- **Lúc Thực Thi (Runtime)**: Khi tòa nhà xây xong (biên dịch ra `.class`), toàn bộ giàn giáo được tháo dỡ sạch sẽ! Bên trong Bytecode của JVM hoàn toàn không còn khái niệm `List<Order>` hay `List<String>`, tất cả chỉ còn là `List` thuần túy và các lệnh ép kiểu vô hình `checkcast`!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Type Erasure & Bytecode Transformation)\n\n```mermaid\nflowchart LR\n    Source[\"Java Source Code<br/>class Box<T extends Number> {<br/>  private T value;<br/>  public T get() { return value; }<br/>}\"]\n    \n    Compiler[\"Java Compiler (javac)<br/>1. Kiểm tra Type Safety<br/>2. Xóa bỏ Generics (Type Erasure)<br/>3. Chèn lệnh checkcast tự động\"]\n    \n    Bytecode[\"Java Bytecode (.class)<br/>class Box {<br/>  private Number value;<br/>  public Number get() { return value; }<br/>}\"]\n\n    Source --> Compiler --> Bytecode\n    style Source fill:#1e3a8a,stroke:#3b82f6,color:#fff\n    style Bytecode fill:#064e3b,stroke:#10b981,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Reified Types vs Erased Types)\n\n| Đặc tính | Reified Types (Nguyên thủy & Mảng `String[]`) | Non-Reified Types (Generics `List<String>`) |\n|---|---|---|\n| **Thông tin kiểu tại Runtime** | Còn nguyên vẹn 100% trong bộ nhớ JVM | **Bị xóa hoàn toàn (Erased)** về Object hoặc Upper Bound |\n| **Toán tử khởi tạo `new`** | Hoạt động bình thường: `new String[10]` | ❌ Bị cấm: `new T()` hoặc `new T[10]` |\n| **Toán tử `instanceof`** | Cho phép: `if (arr instanceof String[])` | ❌ Bị cấm: `if (list instanceof List<String>)` |\n| **Kiểm tra tính an toàn** | Kiểm tra liên tục lúc chạy (Throw `ArrayStoreException`) | Kiểm tra 1 lần duy nhất lúc compile (Zero runtime overhead) |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Giải Phẫu Bridge Method & Bytecode)\n\nHãy xem đoạn mã Java kế thừa Generic Interface sau:\n\n```java\npackage vn.mastery.ecommerce.erasure;\n\n// 1. Interface cha với tham số kiểu\npublic interface OrderProcessor<T> {\n    void process(T payload);\n}\n\n// 2. Class con cụ thể hóa kiểu là String\npublic class StringOrderProcessor implements OrderProcessor<String> {\n    \n    @Override\n    public void process(String payload) {\n        System.out.println(\"Xử lý đơn hàng: \" + payload.toUpperCase());\n    }\n}\n```\n\n### Điều gì thực sự xảy ra trong Bytecode? (Decompiled bằng `javap -c`):\n\nKhi xóa kiểu, interface `OrderProcessor` trở thành phương thức nhận `Object`: `void process(Object payload)`. Nhưng trong class con, bạn lại viết `void process(String payload)`. \nTheo quy tắc OOP, hai hàm này khác chữ ký tham số (Signature), nên class con KHÔNG hề ghi đè (`@Override`) interface cha! \n\nĐể giải quyết mâu thuẫn này, Java Compiler **tự động sinh ra một phương thức cầu nối (Synthetic Bridge Method)** trong file `.class`:\n\n```java\n// Mã giả mô phỏng Bridge Method do Compiler tự động sinh ra trong StringOrderProcessor.class:\npublic /* synthetic bridge */ void process(Object payload) {\n    // 1. Ép kiểu an toàn sang String\n    // 2. Chuyển tiếp lời gọi đến phương thức thực tế\n    this.process((String) payload);\n}\n```\n\n### Bảng Giải Mã Các Giới Hạn Của Type Erasure:\n\n| Lệnh bị cấm | Lý do kỹ thuật tại sao JVM cấm | Giải pháp chuẩn mực thay thế |\n|---|---|---|\n| `new T()` | Lúc runtime JVM không biết `T` là gì để gọi constructor | Truyền `Supplier<T>` hoặc `Class<T> clazz` qua reflection |\n| `new T[capacity]` | Mảng cần biết chính xác Type Descriptor lúc runtime để cấp phát ô nhớ | Dùng `(T[]) new Object[capacity]` có `@SuppressWarnings` |\n| `obj instanceof List<String>` | Lúc runtime mọi list đều là `List`, không còn chữ `String` | Dùng Wildcard không gán kiểu: `obj instanceof List<?>` |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Ô nhiễm bộ nhớ (Heap Pollution) với Varargs\n- **Vấn đề**: Truyền Generic types vào phương thức có tham số biến thiên (`varargs`), ví dụ `public static <T> void addToList(List<T> list, T... items)`. Mảng ngầm `T[]` thực chất là `Object[]`, cho phép kẻ xấu nhét nhầm kiểu vào mảng dẫn đến `ClassCastException` ở một vị trí hoàn toàn xa lạ!\n- **Giải pháp**: Nếu phương thức varargs chỉ đọc và không để lộ tham số mảng ra ngoài, hãy đánh dấu annotation `@SafeVarargs` để cam kết an toàn với compiler.\n\n### Checklist Bài 2.2\n- [ ] Không bao giờ dựa vào reflection để lấy thông tin kiểu `T` của một instance thông thường.\n- [ ] Sử dụng `@SafeVarargs` cho các phương thức Generic Varargs an toàn.\n- [ ] Thay thế `new T()` bằng Factory Pattern hoặc `Supplier<T>`.\n"
        },
        {
          "id": "j1-2-3",
          "type": "practice",
          "title": "Bài 2.3: Ký Tự Đại Diện (Wildcards) & Nguyên Tắc PECS (Producer Extends, Consumer Super)",
          "minutes": 10,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải thích bản chất bất biến (Invariance) của Generics: Tại sao `List<Dog>` KHÔNG PHẢI là `List<Animal>`?\n- Làm chủ Ký tự đại diện (Wildcards): Bounded Wildcards (`? extends T`, `? super T`) và Unbounded (`?`).\n- Khắc cốt ghi tâm nguyên tắc vàng **PECS: Producer Extends, Consumer Super** của Joshua Bloch.\n- Thiết kế API thư viện linh hoạt tối đa, cho phép đọc và ghi dữ liệu an toàn.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: ỐNG HÚT MỘT CHIỀU VÀ PHỄU ĐỔ NƯỚC\n- **Producer Extends (`? extends Fruit`)**: Giống như một chiếc **ống hút một chiều** cắm vào ly nước trái cây. Bạn chỉ có thể **HÚT RA (Read/Produce)** những quả táo, cam để ăn. Bạn KHÔNG THỂ nhét thêm bất kỳ quả nào ngược vào ống, vì bạn không biết dưới ly là giống cam gì!\n- **Consumer Super (`? super Apple`)**: Giống như một chiếc **phễu gom rác** chuyên tiêu thụ. Bạn có thể **BỎ VÀO (Write/Consume)** bất kỳ quả táo nào vào phễu. Phễu chắc chắn nuốt được táo vì đáy phễu là giỏ chứa trái cây hoặc thực phẩm nói chung!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Covariance, Contravariance & Nguyên Tắc PECS)\n\n```mermaid\nflowchart TD\n    subgraph PECS_RULE [\"Nguyên Tắc Thiết Kế API: PECS\"]\n        PROD[\"PRODUCER EXTENDS (? extends T)<br/>• Nguồn cung cấp dữ liệu<br/>• Chỉ ĐỌC (Read-Only)<br/>• get() trả về T<br/>• add() BỊ CẤM (chỉ nhận null)\"]\n        \n        CONS[\"CONSUMER SUPER (? super T)<br/>• Nơi tiêu thụ dữ liệu<br/>• Chỉ GHI (Write-Only)<br/>• add(T) an toàn tuyệt đối<br/>• get() chỉ trả về Object\"]\n    end\n    style PROD fill:#064e3b,stroke:#10b981,color:#fff\n    style CONS fill:#1e3a8a,stroke:#3b82f6,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Các Loại Wildcards)\n\n| Cú pháp Wildcard | Bản chất toán học | Khả năng đọc (`get()`) | Khả năng ghi (`add()`) | Tình huống sử dụng chuẩn |\n|---|---|---|---|---|\n| `List<T>` | Bất biến (Invariant) | Đọc ra kiểu `T` | Ghi vào kiểu `T` | Khi cần cả đọc lẫn ghi với đúng 1 kiểu cố định |\n| `List<? extends T>` | Đồng biến (Covariant) | ⭐ **Đọc ra kiểu `T`** an toàn | ❌ **BỊ CẤM** (Không thể add bất kỳ object nào) | **PRODUCER**: Khi hàm chỉ cần đọc dữ liệu từ tham số truyền vào |\n| `List<? super T>` | Nghịch biến (Contravariant) | Chỉ đọc ra `Object` thô | ⭐ **Ghi vào kiểu `T`** (hoặc con của `T`) | **CONSUMER**: Khi hàm cần ghi/chèn phần tử vào collection |\n| `List<?>` | Không xác định (Unbounded) | Chỉ đọc ra `Object` | ❌ Bị cấm (chỉ add được `null`) | Khi logic chỉ thao tác với `size()`, `clear()`, in log |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Cỗ Máy Chuyển Tiền Siêu Cấp)\n\nHãy xem cách hiện thực hàm `Collections.copy` kinh điển áp dụng chuẩn mực nguyên tắc PECS:\n\n```java\npackage vn.mastery.ecommerce.pecs;\n\nimport java.util.ArrayList;\nimport java.util.List;\n\npublic class TransactionPipeline {\n\n    public static class Transaction {\n        private final String id;\n        public Transaction(String id) { this.id = id; }\n        public String getId() { return id; }\n    }\n\n    public static class PaymentTransaction extends Transaction {\n        private final long amount;\n        public PaymentTransaction(String id, long amount) {\n            super(id);\n            this.amount = amount;\n        }\n        public long getAmount() { return amount; }\n    }\n\n    // ✅ NGUYÊN TẮC PECS HOÀN HẢO:\n    // src là PRODUCER: Cung cấp dữ liệu để đọc -> Dùng ? extends T\n    // dest là CONSUMER: Nhận dữ liệu để tiêu thụ -> Dùng ? super T\n    public static <T> void transferAll(List<? extends T> src, List<? super T> dest) {\n        for (T item : src) {\n            dest.add(item); // dest là consumer, chấp nhận ghi đối tượng kiểu T\n        }\n    }\n\n    public static void main(String[] args) {\n        // Danh sách nguồn: Chứa các giao dịch thanh toán cụ thể\n        List<PaymentTransaction> paymentList = List.of(\n            new PaymentTransaction(\"TX100\", 500_000L),\n            new PaymentTransaction(\"TX101\", 1_200_000L)\n        );\n\n        // Danh sách đích: Chứa Transaction cha hoặc Object tổng quát\n        List<Transaction> generalLedger = new ArrayList<>();\n\n        // Biên dịch thành công 100% nhờ PECS!\n        // Nếu dùng transferAll(List<T> src, List<T> dest) thì dòng này sẽ báo lỗi đỏ compile-time!\n        transferAll(paymentList, generalLedger);\n\n        System.out.println(\"Đã ghi sổ thành công: \" + generalLedger.size() + \" giao dịch.\");\n    }\n}\n```\n\n### Bảng Giải Thích Logic Tại Sao `src.add()` Lại Bị Cấm:\n\nGiả sử Java cho phép bạn gọi `src.add()` trên `List<? extends Transaction>`:\n1. Biến `src` lúc chạy có thể thực chất là `List<RefundTransaction>`.\n2. Nếu bạn được phép gọi `src.add(new PaymentTransaction())`, bạn đã vừa nhét một khoản **Thanh toán (Payment)** vào danh sách **Hoàn tiền (Refund)**!\n3. Toàn bộ tính an toàn kiểu của Java sẽ sụp đổ ngay lập tức! Vì vậy, Compiler bắt buộc phải cấm tiệt lệnh ghi đối với `? extends`.\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Dùng Wildcards làm kiểu trả về (Return Type)\n- **Vấn đề**: Viết hàm `public List<? extends Transaction> getPendingTxns()`. Việc này ép người dùng thư viện của bạn cũng phải dùng wildcard, khiến code bên ngoài không thể thêm phần tử vào danh sách nhận được!\n- **Giải pháp**: Quy tắc của Joshua Bloch: *\"Không bao giờ sử dụng wildcard làm return type. Chỉ dùng wildcard cho tham số đầu vào (arguments) của hàm.\"*\n\n### Checklist Bài 2.3\n- [ ] Áp dụng PECS: Tham số đầu vào sinh dữ liệu dùng `? extends`, tham số nạp dữ liệu dùng `? super`.\n- [ ] Không dùng Wildcard cho giá trị trả về của method.\n- [ ] Nhớ thần chú: Muốn `add` vào Collection thì dùng `? super`; muốn lấy `get` ra thì dùng `? extends`.\n"
        },
        {
          "id": "j1-2-4",
          "type": "practice",
          "title": "Bài 2.4: Generics Nâng Cao: Recursive Type Bounds, Type Tokens & Generic Builders",
          "minutes": 10,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải quyết bài toán kế thừa Builder Pattern bằng **Recursive Type Bounds** (`<B extends Builder<B>>`).\n- Xây dựng kho lưu trữ an toàn kiểu không đồng nhất (**Typesafe Heterogeneous Container**).\n- Vượt qua giới hạn Type Erasure bằng **Type Tokens** (`Class<T>`) và Super Type Tokens.\n- Áp dụng kiến trúc Clean API chuẩn mực được sử dụng trong Spring Data và Jackson ObjectMapper.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỦ ĐỒ NHIỀU NGĂN CÓ KHÓA ĐIỆN TỬ\n- Tủ đồ thông thường (Map<String, Object>): Bạn gửi món đồ gì vào thì lúc lấy ra cũng nhận được một chiếc túi đen bí ẩn (Object). Bạn phải mở túi soi kính lúp và ép kiểu `(Laptop) map.get(\"key\")`.\n- **Typesafe Heterogeneous Container (Type Token)**: Mỗi ngăn tủ được trang bị một ổ khóa quét mã ADN! Chiếc chìa khóa của bạn chính là class đại diện: `Class<T>`. Bạn đút chìa `String.class` vào, tủ trả về đúng `String`; bạn đút chìa `Integer.class` vào, tủ trả về đúng `Integer` mà **không cần ép kiểu thủ công một dòng nào**!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Typesafe Container & Recursive Generics)\n\n```mermaid\nclassDiagram\n    class Container {\n        -Map~Class, Object~ values\n        +put(Class~T~ type, T instance)\n        +get(Class~T~ type) T\n    }\n    class BaseBuilder~B extends BaseBuilder~B~~ {\n        <<abstract>>\n        #self() B\n        +withTrackingId(String) B\n    }\n    class OrderBuilder {\n        +withAmount(long) OrderBuilder\n        +build() Order\n    }\n    BaseBuilder <|-- OrderBuilder : Extends & Trả về chính nó\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Các Giải Pháp Lưu Trữ Cấu Hình Đa Kiểu)\n\n| Tiêu chí | Dùng `Map<String, Object>` | Dùng Typesafe Container (`Map<Class<?>, Object>`) |\n|---|---|---|\n| **An toàn kiểu (Type Safety)** | ❌ Dễ crash `ClassCastException` lúc runtime | ⭐ **100% Type-safe**, không bao giờ cast lỗi |\n| **Cú pháp người dùng** | Phải viết `(User) map.get(\"user\")` | Gọi trực tiếp: `User u = container.get(User.class)` |\n| **Bảo vệ tính toàn vẹn** | Cho phép nhét chuỗi String vào key mong đợi Integer | Ngăn chặn ngay lúc gọi `put(Integer.class, \"Sai\")` |\n| **Ứng dụng thực tế** | Code legacy cũ | Spring ApplicationContext, Jackson TypeFactory |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Hiện Thực Typesafe Container & Fluent Builder)\n\n### Phần 1: Typesafe Heterogeneous Container\n\n```java\npackage vn.mastery.ecommerce.advanced;\n\nimport java.util.HashMap;\nimport java.util.Map;\nimport java.util.Objects;\n\npublic class AppContext {\n\n    // Khóa là Class<?> đại diện cho kiểu dữ liệu (Type Token)\n    private final Map<Class<?>, Object> registry = new HashMap<>();\n\n    // Ghi dữ liệu: Đảm bảo instance truyền vào đúng chuẩn kiểu T của type token\n    public <T> void bind(Class<T> type, T instance) {\n        Objects.requireNonNull(type, \"Type token không được null\");\n        registry.put(type, type.cast(instance)); // Sử dụng Class.cast() để bảo vệ an toàn\n    }\n\n    // Đọc dữ liệu: Trả về chính xác kiểu T mà không cần người dùng ép kiểu thủ công!\n    public <T> T get(Class<T> type) {\n        Object raw = registry.get(type);\n        return type.cast(raw); // Ép kiểu an toàn bằng phương thức cast() của Class\n    }\n}\n```\n\n### Phần 2: Recursive Generic Builder (Fluent API Trong Kế Thừa)\n\n```java\npackage vn.mastery.ecommerce.advanced;\n\n// Lớp Builder cha sử dụng Recursive Type Bound: B bắt buộc phải là con của BaseBuilder<B>\npublic abstract class BaseTransactionBuilder<B extends BaseTransactionBuilder<B>> {\n    protected String transactionId;\n\n    // Kỹ thuật getThis() / self() giúp trả về đúng kiểu của Builder con\n    @SuppressWarnings(\"unchecked\")\n    protected B self() {\n        return (B) this;\n    }\n\n    public B withTransactionId(String id) {\n        this.transactionId = id;\n        return self(); // Trả về Builder con thay vì BaseTransactionBuilder\n    }\n}\n\n// Lớp Builder con: Kế thừa và truyền chính nó vào tham số kiểu\npublic class CryptoPaymentBuilder extends BaseTransactionBuilder<CryptoPaymentBuilder> {\n    private String walletAddress;\n\n    public CryptoPaymentBuilder withWallet(String address) {\n        this.walletAddress = address;\n        return self();\n    }\n\n    public void execute() {\n        // Chuỗi gọi hàm mượt mà (Fluent API) xuyên suốt từ cha đến con!\n        System.out.println(\"Giao dịch \" + transactionId + \" qua ví: \" + walletAddress);\n    }\n}\n```\n\n### Bảng Giải Thích Kỹ Thuật:\n\n| Cú pháp | Bản chất giải pháp | Vấn đề nó giải quyết |\n|---|---|---|\n| `B extends BaseTransactionBuilder<B>` | Recursive Generics: Ép class con phải tự tham chiếu chính nó | Giải quyết triệt để lỗi mất chuỗi Fluent API khi gọi method của class cha |\n| `type.cast(instance)` | Dynamic Casting của `java.lang.Class<T>` | Đảm bảo không bị ô nhiễm bộ nhớ ngay tại thời điểm đăng ký vào Map |\n| `Class<T>` | Type Token: Đóng gói thông tin kiểu vào một đối tượng thực tế | Vượt qua hạn chế Type Erasure để truyền định danh kiểu vào hàm |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Giới hạn của `Class<T>` với Generic Types\n- **Vấn đề**: Bạn muốn lưu `List<String>` vào Typesafe Container. Bạn không thể viết `List<String>.class` vì Java không hỗ trợ syntax này (chỉ có `List.class`). Mọi loại List đều bị gom chung về một class duy nhất!\n- **Giải pháp**: Áp dụng kỹ thuật **Super Type Tokens** (do Neal Gafter sáng lập), sử dụng Anonymous Subclass để lưu lại generic type qua Reflection (cách Jackson sử dụng `new TypeReference<List<String>>() {}`).\n\n### Checklist Bài 2.4\n- [ ] Dùng `Class<T>` làm Type Token khi thiết kế DI Container hoặc Service Locator.\n- [ ] Sử dụng Recursive Generic Bounds khi thiết kế Fluent Builder có tính kế thừa.\n- [ ] Sử dụng `type.cast()` thay vì ép kiểu thô lỗ `(T) obj` trong các container generic.\n"
        }
      ]
    },
    {
      "id": 203,
      "title": "Lập Trình Hàm, Stream Pipeline & Xây Dựng Custom Collector",
      "subtitle": "Functional Interfaces, Stream Internals, Spliterator, Reductions & Custom Collectors",
      "icon": "🌊",
      "color": "#059669",
      "desc": "Làm chủ kiến trúc Stream API chuyên sâu: Bản chất invokedynamic của Lambda, cơ chế Spliterator, Lazy Evaluation, tự viết Custom Collector và xử lý song song với Parallel Streams.",
      "outcomes": [
        "Giải mã cơ chế thực thi của Lambda Expressions dưới Bytecode với invokedynamic và LambdaMetafactory",
        "Hiểu sâu chuỗi đường ống Stream Pipeline: Spliterator, Stateless vs Stateful Operations, Short-circuiting",
        "Tự tay thiết kế và hiện thực Custom Collector triển khai Collector<T, A, R> interface",
        "Đánh giá chính xác mô hình chi phí N x Q khi quyết định chuyển đổi sang Parallel Streams và ForkJoinPool"
      ],
      "topics": [
        {
          "id": "lambda-stream-internals",
          "title": "Bản Chất Lambda & Kiến Trúc Stream Pipeline",
          "lessonIds": [
            "j1-3-1",
            "j1-3-2"
          ]
        },
        {
          "id": "collectors-parallel",
          "title": "Custom Collectors & Tối Ưu Hóa Parallel Streams",
          "lessonIds": [
            "j1-3-3",
            "j1-3-4"
          ]
        }
      ],
      "retrievalWarmup": [
        {
          "q": "Điều kiện cần và đủ để một Interface được xem là Functional Interface trong Java là gì?",
          "options": [
            "Interface đó có chứa đúng 1 phương thức trừu tượng duy nhất (Single Abstract Method - SAM), không tính các default, static methods hay các phương thức của java.lang.Object.",
            "Interface bắt buộc phải được đánh dấu bằng annotation @FunctionalInterface.",
            "Interface không được chứa bất kỳ phương thức nào có phần thân (body).",
            "Interface chỉ được phép trả về kiểu boolean."
          ],
          "answer": 0,
          "explain": "Functional Interface tuân theo quy tắc SAM: Có duy nhất 1 phương thức trừu tượng. Annotation @FunctionalInterface chỉ là công cụ kiểm tra của compiler, không bắt buộc về mặt ngữ nghĩa."
        },
        {
          "q": "Điểm khác biệt mấu chốt giữa Intermediate Operations (thao tác trung gian) và Terminal Operations (thao tác kết thúc) trong Stream API là gì?",
          "options": [
            "Intermediate operations mang tính Lazy (lười biếng), chỉ định nghĩa pipeline; còn Terminal operation mới thực sự kích hoạt luồng duyệt và xử lý dữ liệu.",
            "Intermediate operations làm thay đổi trực tiếp collection ban đầu.",
            "Terminal operations có thể gọi được nhiều lần trên cùng một Stream.",
            "Intermediate operations chỉ chạy trên một luồng duy nhất."
          ],
          "answer": 0,
          "explain": "Stream API hoạt động theo cơ chế Lazy Evaluation: Các hàm như filter(), map() không hề chạy ngay mà chỉ tạo ra một pipeline. Khi Terminal operation (như collect, count, forEach) được gọi, toàn bộ pipeline mới bắt đầu kéo dữ liệu qua một lượt duy nhất."
        },
        {
          "q": "Điều gì sẽ xảy ra nếu lập trình viên cố gắng tái sử dụng (reuse) một đối tượng Stream đã qua Terminal Operation?",
          "options": [
            "Ném ngoại lệ IllegalStateException: stream has already been operated upon or closed.",
            "Stream tự động khởi động lại từ phần tử đầu tiên.",
            "Trả về một Stream rỗng an toàn.",
            "Tạo ra một bản sao mới của collection ban đầu."
          ],
          "answer": 0,
          "explain": "Java Stream chỉ có thể được tiêu thụ (consumed) một lần duy nhất trong vòng đời của nó. Sau khi một Terminal Operation hoàn tất, Stream sẽ bị đóng lại; mọi nỗ lực gọi tiếp sẽ ném IllegalStateException."
        }
      ],
      "quiz": {
        "id": "j1-quiz-3",
        "type": "quiz",
        "title": "Sát Hạch Module J1.3: Functional Programming, Streams & Custom Collectors",
        "questions": [
          {
            "level": "hard",
            "targetLessonId": "j1-3-1",
            "scenario": "Một hệ thống thanh toán chạy một vòng lặp 10 triệu giao dịch. Trong vòng lặp có đoạn code: String prefix = getPrefix(); list.forEach(item -> auditLog(prefix + item));. Kỹ sư đo lường phát hiện GC Young Generation tăng đột biến hàng gigabyte rác.",
            "q": "Nguyên nhân kỹ thuật gì khiến đoạn mã lambda trên làm tràn bộ nhớ Heap?",
            "options": [
              "Lambda trên là một Capturing Lambda (truy cập biến ngoài prefix), buộc JVM phải cấp phát đối tượng mới trên Heap ở mỗi lần chạy qua, làm sinh ra hàng triệu object rác.",
              "Do phương thức auditLog không có từ khóa synchronized.",
              "Do kiểu String trong Java tự động nhân bản khi dùng toán tử cộng chuỗi.",
              "Do trình biên dịch Java tự động chuyển lambda thành file class trên đĩa."
            ],
            "answer": 0,
            "explain": "Nếu lambda không truy cập biến cục bộ bên ngoài (Non-capturing), JVM tối ưu tái sử dụng duy nhất một Singleton instance (Zero Heap Allocation). Khi capture biến môi trường bên ngoài (Capturing), JVM bắt buộc phải cấp phát một instance mới trên Heap mỗi lần thực thi để lưu trữ trạng thái biến capture."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-3-2",
            "scenario": "Lập trình viên viết đoạn mã: Stream.iterate(1, i -> i + 1).filter(i -> i % 2 == 0).sorted().limit(5).forEach(System.out::println);. Khi chạy ứng dụng, điều gì sẽ xảy ra?",
            "q": "Chương trình sẽ hoạt động như thế nào?",
            "options": [
              "Chương trình bị treo vĩnh viễn (Hang) hoặc tràn bộ nhớ OutOfMemoryError vì sorted() là thao tác Stateful đòi hỏi phải tích lũy toàn bộ luồng vô hạn trước khi sort.",
              "Chương trình in ra ngay lập tức: 2, 4, 6, 8, 10.",
              "Trình biên dịch báo lỗi đỏ tại dòng iterate().",
              "Chương trình tự động bỏ qua phương thức sorted() và chạy tiếp."
            ],
            "answer": 0,
            "explain": "Phương thức `sorted()` là một Stateful Intermediate Operation: Để sắp xếp, nó bắt buộc phải gom tất cả phần tử của luồng vào một mảng nội bộ. Vì `Stream.iterate` là luồng dữ liệu vô hạn (Infinite Stream), `sorted()` sẽ chạy tích lũy không bao giờ dừng cho đến khi cạn kiệt RAM!"
          },
          {
            "level": "medium",
            "targetLessonId": "j1-3-2",
            "scenario": "Khái niệm 'Loop Fusion' trong cơ chế thực thi của Java Stream API có nghĩa là gì?",
            "q": "Ý nghĩa của Loop Fusion trong tối ưu hóa hiệu năng Stream là gì?",
            "options": [
              "JVM gộp các thao tác trung gian liên tiếp (như filter, map) của từng phần tử vào xử lý cùng nhau trong một lượt duyệt duy nhất, tránh tạo collection phụ trung gian.",
              "Tự động biến đổi vòng lặp tuần tự thành vòng lặp song song trên nhiều CPU core.",
              "Gộp nhiều luồng dữ liệu khác nhau thành một luồng duy nhất.",
              "Chuyển đổi toàn bộ Stream sang mã nhị phân native của card đồ họa GPU."
            ],
            "answer": 0,
            "explain": "Loop Fusion là kỹ thuật gộp đường ống: Thay vì lọc toàn bộ mảng rồi mới map mảng mới, Java Stream duyệt từng phần tử qua lần lượt filter rồi map ngay lập tức. Điều này giúp chỉ cần duyệt 1 lần và tận dụng tối đa CPU L1/L2 cache."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-3-3",
            "scenario": "Khi tự xây dựng một Custom Collector triển khai Collector<T, A, R>, phương thức nào chịu trách nhiệm hợp nhất hai bộ chứa tích lũy trung gian (A) thành một khi Stream được thực thi song song?",
            "q": "Phương thức đó có tên là gì trong interface Collector?",
            "options": [
              "combiner()",
              "accumulator()",
              "supplier()",
              "finisher()"
            ],
            "answer": 0,
            "explain": "Trong `Collector<T, A, R>`, phương thức `combiner()` trả về một `BinaryOperator<A>` dùng để merge (hợp nhất) hai bộ tích lũy trung gian của các luồng con khi chạy song song (Parallel Streams)."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-3-3",
            "scenario": "Bạn muốn phân loại một danh sách các giao dịch thành đúng 2 nhóm: Giao dịch thành công (true) và Giao dịch thất bại (false).",
            "q": "Collector có sẵn nào trong Java là lựa chọn tối ưu và trực diện nhất?",
            "options": [
              "Collectors.partitioningBy(Transaction::isSuccess)",
              "Collectors.groupingBy(Transaction::getStatus)",
              "Collectors.toMap(Transaction::getId, Transaction::isSuccess)",
              "Collectors.filtering(Transaction::isSuccess, Collectors.toList())"
            ],
            "answer": 0,
            "explain": "`Collectors.partitioningBy()` là trường hợp đặc biệt của groupingBy, nhận một `Predicate<T>` và luôn trả về một `Map<Boolean, List<T>>` với đúng hai key `true` và `false`, cực kỳ tối ưu cho bài toán nhị phân."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-3-4",
            "scenario": "Một lập trình viên gọi: list.parallelStream().map(this::fetchExchangeRateFromBankApi).toList();. Hệ thống bất ngờ bị treo cứng toàn bộ các tác vụ nền khác.",
            "q": "Nguyên nhân gốc rễ (Root Cause) của sự cố nghẽn hệ thống này là gì?",
            "options": [
              "Parallel Stream mặc định dùng chung ForkJoinPool.commonPool() toàn cục của JVM; khi gọi API ngân hàng (Blocking I/O), toàn bộ thread của pool bị chiếm dụng khiến các tác vụ khác tê liệt.",
              "Do Stream API không hỗ trợ kiểu dữ liệu trả về từ API ngân hàng.",
              "Do phương thức toList() tự động khóa toàn bộ CPU.",
              "Do số lượng thread trong Parallel Stream bị giới hạn tối đa là 1 thread."
            ],
            "answer": 0,
            "explain": "`parallelStream()` sử dụng `ForkJoinPool.commonPool()`, vốn chỉ có số lượng thread bằng số lõi CPU (CPU Cores - 1). Việc đưa các tác vụ Blocking I/O vào đây sẽ làm cạn kiệt thread pool chung của toàn bộ ứng dụng, gây tắc nghẽn nghiêm trọng."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-3-4",
            "scenario": "Theo mô hình chi phí của Brian Goetz, công thức ngưỡng để cân nhắc sử dụng Parallel Stream thay vì Sequential Stream là gì?",
            "q": "Điều kiện thực nghiệm để Parallel Stream phát huy hiệu quả là gì?",
            "options": [
              "N x Q > 10,000 (với N là số phần tử và Q là chi phí tính toán CPU trên mỗi phần tử).",
              "N > 100 và Q = 0.",
              "Tập dữ liệu phải là kiểu String hoặc Record.",
              "Máy chủ phải có ít nhất 128GB RAM."
            ],
            "answer": 0,
            "explain": "Quy tắc N x Q > 10,000 của Brian Goetz chỉ ra rằng chi phí tạo luồng, chia cắt nhiệm vụ (split) và hợp nhất kết quả (join) chỉ được bù đắp xứng đáng khi khối lượng công việc tính toán CPU tổng thể đủ lớn."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-3-1",
            "scenario": "Trong Java 8+, lệnh gọi lambda được biên dịch sang mã Bytecode sử dụng chỉ lệnh nào của máy ảo JVM?",
            "q": "Chỉ lệnh bytecode nào được giới thiệu từ Java 7 và được dùng để thực thi lambda?",
            "options": [
              "invokedynamic",
              "invokevirtual",
              "invokespecial",
              "invokestatic"
            ],
            "answer": 0,
            "explain": "Lambda trong Java không biên dịch thành anonymous class thông thường mà sử dụng chỉ lệnh `invokedynamic` kết hợp với `LambdaMetafactory` để liên kết động lời gọi hàm tại runtime một cách cực kỳ nhẹ nhàng."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-3-3",
            "scenario": "Trong một Custom Collector, nếu ta gán cờ 'Characteristics.IDENTITY_FINISH', điều này báo hiệu điều gì cho Stream execution engine?",
            "q": "Ý nghĩa của cờ IDENTITY_FINISH là gì?",
            "options": [
              "Phương thức finisher() chỉ là phép chiếu đồng nhất Function.identity(), JVM có thể ép kiểu an toàn trực tiếp từ bộ chứa A sang kết quả R mà không cần gọi hàm finisher().",
              "Collector chỉ chạy được trên một luồng duy nhất.",
              "Dữ liệu kết quả không được phép chứa giá trị null.",
              "Collector bắt buộc phải bảo toàn thứ tự ban đầu của mảng."
            ],
            "answer": 0,
            "explain": "Cờ `IDENTITY_FINISH` thông báo cho JVM biết kiểu của bộ tích lũy trung gian A và kết quả cuối cùng R là một (`A == R`). JVM sẽ bỏ qua việc gọi `finisher().apply()` và cast trực tiếp kết quả, giúp tiết kiệm chi phí gọi hàm."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-3-2",
            "scenario": "Cho đoạn mã: List.of(\"a\", \"b\", \"c\").stream().peek(System.out::println);. Khi chạy ứng dụng, màn hình console in ra nội dung gì?",
            "q": "Kết quả in ra màn hình là gì?",
            "options": [
              "Không in ra bất kỳ dòng chữ nào cả vì chưa có Terminal Operation kích hoạt Stream pipeline (Lazy Evaluation).",
              "In ra 3 dòng: a, b, c.",
              "Ném ngoại lệ NullPointerException.",
              "In ra mã băm của đối tượng Stream."
            ],
            "answer": 0,
            "explain": "`peek()` chỉ là một Intermediate Operation mang tính Lazy. Do không có bất kỳ Terminal Operation nào (như forEach, collect, count) được gọi ở cuối, pipeline không bao giờ được kích hoạt và không có dòng log nào được in!"
          },
          {
            "level": "hard",
            "targetLessonId": "j1-3-4",
            "scenario": "Khi chạy parallel stream: IntStream.range(0, 1000).parallel().forEach(list::add); với list là một ArrayList thông thường. Hậu quả thực tế xảy ra là gì?",
            "q": "Hiện tượng gì sẽ xảy ra do tranh chấp luồng (Race Condition)?",
            "options": [
              "Mất mát dữ liệu (size < 1000) hoặc phát nổ ArrayIndexOutOfBoundsException do ArrayList không phải là cấu trúc thread-safe.",
              "ArrayList tự động đồng bộ hóa an toàn và đủ 1000 phần tử.",
              "Trình biên dịch Java phát hiện và báo lỗi ngay lúc compile.",
              "Hệ thống tự động chuyển ArrayList thành CopyOnWriteArrayList."
            ],
            "answer": 0,
            "explain": "`ArrayList` có cấu trúc mảng nội bộ không được đồng bộ hóa. Khi nhiều worker threads cùng ghi đồng thời qua `forEach()`, các thao tác tăng index và ghi đè ô nhớ sẽ dẫm đạp lên nhau gây mất mát dữ liệu hoặc crash mảng."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-3-1",
            "scenario": "Phương thức `DoubleSummaryStatistics stats = orders.stream().collect(Collectors.summarizingDouble(Order::amount));` mang lại lợi ích gì vượt trội so với gọi riêng lẻ các hàm mapToDouble?",
            "q": "Lợi ích lớn nhất của summarizingDouble trong một lượt duyệt là gì?",
            "options": [
              "Tính toán đồng thời cả count, sum, min, max, và average chỉ trong duy nhất 1 lần duyệt dữ liệu (Single-pass computation).",
              "Tự động nhân đôi độ chính xác số học của kiểu double.",
              "Lưu trữ dữ liệu vào cơ sở dữ liệu quan hệ ngầm định.",
              "Chuyển đổi số double thành tiền tệ USD tự động."
            ],
            "answer": 0,
            "explain": "Nếu gọi riêng `count()`, `sum()`, `max()`, bạn phải duyệt qua tập dữ liệu nhiều lần. `summarizingDouble` tính toán toàn bộ 5 thông số thống kê cốt lõi trong đúng 1 lần duyệt duy nhất ($O(N)$), tối ưu hiệu năng vượt trội."
          }
        ]
      },
      "lessons": [
        {
          "id": "j1-3-1",
          "type": "theory",
          "title": "Bài 3.1: Functional Interfaces, Method References & Bản Chất invokedynamic Của Lambda",
          "minutes": 10,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Nắm vững 4 nhóm Functional Interface trụ cột: `Function`, `Predicate`, `Consumer`, và `Supplier`.\n- Làm chủ 4 loại **Method References**: Static method, Bound instance method, Unbound instance method, và Constructor reference.\n- Giải mã cơ chế Bytecode của Lambda trong HotSpot: So sánh Lớp ẩn danh (Anonymous Inner Class) vs `invokedynamic` (Indy).\n- Đo lường mức độ cấp phát bộ nhớ (Memory Allocation Overhead) giữa Non-capturing và Capturing Lambdas.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: HỢP ĐỒNG GIẤY TỜ VS CHỨNG MINH THƯ ĐIỆN TỬ\n- **Lớp ẩn danh cũ (Java 7)**: Giống như mỗi lần ký một hợp đồng dịch vụ, bạn phải đúc ra một con dấu đồng mới toanh, in hàng tá giấy tờ (`new Runnable() { public void run() {...} }`). Kết quả: Sinh ra cả ngàn file `$1.class` làm chật kín bộ nhớ Metaspace và Heap!\n- **Lambda với `invokedynamic` (Java 8+)**: Giống như ký số qua app ngân hàng! Không tốn một tờ giấy, không sinh file class rác. Lần đầu gọi, JVM chỉ tạo một CallSite siêu nhẹ qua `LambdaMetafactory` rồi lưu vào cache. Các lần sau chạy thẳng như một phương thức tĩnh với tốc độ xé gió!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Thực Thi Lambda Bằng `invokedynamic`)\n\n```mermaid\nflowchart TD\n    JavaCode[\"Biểu Thức Lambda: list.forEach(x -> print(x))\"] --> Compiler[\"Java Compiler (javac)\"]\n    Compiler --> Bytecode[\"Bytecode: Lệnh invokedynamic #BootstrapMethod\"]\n    \n    subgraph HotSpot_Runtime [\"HotSpot JVM Runtime\"]\n        Indy[\"invokedynamic CallSite\"] --> LMF[\"LambdaMetafactory.metafactory()\"]\n        LMF --> DynClass[\"Tạo Dynamic CallSite / MethodHandle (Trong RAM)\"]\n        DynClass --> NativeExec[\"Thực thi trực tiếp mã hàm gốc\"]\n    end\n    \n    Bytecode --> Indy\n    style Bytecode fill:#1e3a8a,stroke:#3b82f6,color:#fff\n    style HotSpot_Runtime fill:#064e3b,stroke:#10b981,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Anonymous Class vs Lambda Indy)\n\n| Tiêu chí | Lớp Ẩn Danh (Anonymous Class) | Biểu Thức Lambda (`invokedynamic`) |\n|---|---|---|\n| **Sinh file `.class` trên đĩa** | Có sinh file: `MyService$1.class` | ⭐ **Không sinh file class nào trên đĩa** |\n| **Chi phí cấp phát bộ nhớ** | Tạo mới 1 instance trên Heap mỗi lần gọi | ⭐ **Non-capturing lambda: Tái sử dụng Singleton (0 Heap Alloc)** |\n| **Ý nghĩa của từ khóa `this`** | `this` trỏ tới instance của Anonymous Class | `this` trỏ tới instance của Outer Class bao bọc nó |\n| **Tải Class (Class Loading)** | Tốn chi phí nạp class mới vào Metaspace | JVM liên kết động qua MethodHandle lúc runtime |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Hệ Thống Kiểm Duyệt Thanh Toán)\n\n```java\npackage vn.mastery.ecommerce.lambda;\n\nimport java.math.BigDecimal;\nimport java.util.Objects;\nimport java.util.function.*;\n\npublic class PaymentRuleValidator {\n\n    public record Payment(String txnId, BigDecimal amount, String currency) {}\n\n    // 1. Predicate: Kiểm tra điều kiện (Boolean-valued function)\n    private static final Predicate<Payment> IS_VND = p -> \"VND\".equalsIgnoreCase(p.currency());\n    private static final Predicate<Payment> IS_LARGE = p -> p.amount().compareTo(BigDecimal.valueOf(100_000_000L)) >= 0;\n\n    // 2. Function: Biến đổi dữ liệu từ T sang R\n    private static final Function<Payment, String> TXN_FORMATTER = Payment::txnId; // Method reference\n\n    // 3. Consumer: Tiêu thụ dữ liệu (Side-effect, trả về void)\n    private static final Consumer<String> AUDIT_LOGGER = System.out::println;\n\n    // 4. Supplier: Cung cấp kết quả (Lazy supplier)\n    private static final Supplier<Payment> DEFAULT_PAYMENT = () -> new Payment(\"FALLBACK\", BigDecimal.ZERO, \"VND\");\n\n    public static void validateAndLog(Payment payment) {\n        // Kết hợp Predicate bằng and(), or(), negate()\n        Predicate<Payment> vipVndCheck = IS_VND.and(IS_LARGE);\n\n        if (vipVndCheck.test(payment)) {\n            String id = TXN_FORMATTER.apply(payment);\n            AUDIT_LOGGER.accept(\"CẢNH BÁO GIAO DỊCH LỚN CẦN PHÊ DUYỆT: \" + id);\n        }\n    }\n}\n```\n\n### Bảng Phân Tích Sự Khác Biệt Giữa Capturing vs Non-Capturing Lambda:\n\n```java\n// ✅ NON-CAPTURING LAMBDA: Không truy cập biến bên ngoài -> Singleton, 0 byte cấp phát trên Heap!\nConsumer<String> logger = msg -> System.out.println(msg);\n\n// ⚠️ CAPTURING LAMBDA: Truy cập biến 'prefix' của môi trường ngoài -> Bắt buộc tạo mới Object trên Heap mỗi lần gọi!\nString prefix = \"LOG: \";\nConsumer<String> capturingLogger = msg -> System.out.println(prefix + msg);\n```\n\n| Loại Lambda | Cơ chế cấp phát | Ảnh hưởng hiệu năng |\n|---|---|---|\n| **Non-capturing Lambda** | JVM khởi tạo 1 Singleton Instance duy nhất và tái sử dụng mãi mãi | ⭐ **Hiệu năng cực cao**, không gây áp lực cho Garbage Collector |\n| **Capturing Lambda** | Mỗi lần chạy qua, JVM phải cấp phát một đối tượng mới để lưu giá trị biến captured | 💥 Tạo nhiều rác ngắn hạn nếu nằm trong vòng lặp hàng triệu lần |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Bẫy biến môi trường bị capture (Effectively Final Trap)\n- **Vấn đề**: Cố gắng thay đổi biến bên ngoài lambda: `int count = 0; list.forEach(x -> count++);`. Trình biên dịch báo lỗi vì biến địa phương được capture bắt buộc phải là `final` hoặc `effectively final` để tránh Race Condition đa luồng!\n- **Giải pháp**: Nếu cần tích lũy kết quả, hãy dùng Stream Reductions (`reduce`, `collect`) hoặc `LongAdder` thay vì cố gắng mutate biến địa phương.\n\n### Checklist Bài 3.1\n- [ ] Ưu tiên Non-capturing Lambda để JVM tối ưu Singleton zero-allocation.\n- [ ] Dùng Method Reference (`Class::method`) khi lambda chỉ đơn thuần chuyển tiếp tham số.\n- [ ] Sử dụng các biến thể nguyên thủy (`IntPredicate`, `LongFunction`) để tránh Boxing/Unboxing overhead.\n"
        },
        {
          "id": "j1-3-2",
          "type": "practice",
          "title": "Bài 3.2: Kiến Trúc Bên Dưới Stream API: Spliterator, Lazy Evaluation & Short-Circuiting",
          "minutes": 10,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Khám phá giải phẫu bên trong của một Java Stream: `ReferencePipeline` và cấu trúc Linked List của các Operations.\n- Phân biệt bản chất sâu sắc giữa **Stateless Operations** (`filter`, `map`) và **Stateful Operations** (`sorted`, `distinct`).\n- Cơ chế **Loop Fusion & Lazy Evaluation**: Tại sao chuỗi 10 hàm map-filter chỉ chạy qua mảng đúng 1 lượt duy nhất?\n- Tối ưu hóa **Short-circuiting Operations** (`findFirst`, `anyMatch`, `limit`) để dừng vòng lặp sớm.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: DÂY CHUYỀN LẮP RÁP XE HƠI TỰ ĐỘNG\n- Cách nghĩ sai lầm: Bạn nghĩ Stream chạy theo kiểu: Lọc hết 1 triệu đơn hàng (`filter`), sinh ra danh sách mới 500k đơn; rồi lấy danh sách đó nhân đôi (`map`), sinh tiếp danh sách mới; rồi mới in ra. Tốn 3 lần duyệt mảng và tràn RAM!\n- **Thực tế bên dưới của Java Stream**: Giống như **dây chuyền băng chuyền công xưởng**! Từng món hàng lần lượt chạy qua các cánh tay robot: Robot 1 lọc mã, Robot 2 đóng dấu, Robot 3 dán nhãn... Một phần tử đi xuyên suốt từ đầu tới cuối đường ống chỉ trong **MỘT LƯỢT DUYỆT DUY NHẤT**!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Linked List Bên Dưới Stream Pipeline)\n\n```mermaid\nflowchart LR\n    Source[\"Head (Spliterator)<br/>List.stream()\"] --> Op1[\"StatelessOp: filter()<br/>(Chỉ kiểm tra predicate)\"]\n    Op1 --> Op2[\"StatelessOp: map()<br/>(Chuyển đổi dữ liệu)\"]\n    Op2 --> Op3[\"StatefulOp: sorted()<br/>(Bắt buộc gom đủ dữ liệu vào mảng)\"]\n    Op3 --> Term[\"TerminalOp: findFirst()<br/>(Kích hoạt kéo dữ liệu & Dừng sớm)\"]\n    \n    style Source fill:#1e3a8a,stroke:#3b82f6,color:#fff\n    style Op1 fill:#064e3b,stroke:#10b981,color:#fff\n    style Op2 fill:#064e3b,stroke:#10b981,color:#fff\n    style Op3 fill:#7f1d1d,stroke:#ef4444,color:#fff\n    style Term fill:#4c1d95,stroke:#8b5cf6,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận Phân Loại Các Thao Tác Trong Stream)\n\n| Loại thao tác | Các phương thức tiêu biểu | Cơ chế bộ nhớ | Khả năng Streaming vô hạn |\n|---|---|---|---|\n| **Stateless Intermediate** | `filter()`, `map()`, `flatMap()`, `peek()` | $O(1)$ Không cần lưu nhớ trạng thái | ⭐ Hoạt động tốt trên Infinite Stream |\n| **Stateful Intermediate** | `sorted()`, `distinct()`, `skip()`, `limit()` | Phải tích lũy dữ liệu vào bộ đệm nội bộ | 💥 `sorted()` sẽ treo máy vĩnh viễn trên Infinite Stream! |\n| **Terminal (Short-circuit)** | `anyMatch()`, `allMatch()`, `findFirst()` | Dừng xử lý ngay khi thỏa mãn điều kiện | Dừng sớm, tiết kiệm CPU tối đa |\n| **Terminal (Full reduction)** | `reduce()`, `collect()`, `count()`, `toList()` | Tiêu thụ toàn bộ các phần tử còn lại | Bắt buộc duyệt hết pipeline |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Chứng Minh Loop Fusion & Short-Circuit)\n\nĐoạn mã sau chứng minh các phần tử được duyệt đan xen theo từng phần tử (vertical execution), chứ không chạy hết bước này mới sang bước khác (horizontal execution):\n\n```java\npackage vn.mastery.ecommerce.stream;\n\nimport java.util.List;\n\npublic class StreamExecutionProfiler {\n\n    public static void main(String[] args) {\n        List<String> names = List.of(\"An\", \"Bình\", \"Cường\", \"Dũng\", \"Em\");\n\n        System.out.println(\"--- BẮT ĐẦU CHUỖI STREAM ---\");\n\n        String matchedName = names.stream()\n            .filter(name -> {\n                System.out.println(\"1. Filter: \" + name);\n                return name.length() >= 4;\n            })\n            .map(name -> {\n                System.out.println(\"2. Map sang IN HOA: \" + name);\n                return name.toUpperCase();\n            })\n            .findFirst() // Short-circuit: Tìm thấy phần tử đầu tiên thỏa mãn là DỪNG NGAY!\n            .orElse(\"KHÔNG TÌM THẤY\");\n\n        System.out.println(\"--- KẾT QUẢ CUỐI: \" + matchedName);\n    }\n}\n```\n\n### Kết Quả In Ra Console Thực Tế:\n\n```text\n--- BẮT ĐẦU CHUỖI STREAM ---\n1. Filter: An        (Độ dài 2 < 4: Loại)\n1. Filter: Bình      (Độ dài 4 >= 4: Thỏa mãn!)\n2. Map sang IN HOA: Bình\n--- KẾT QUẢ CUỐI: BÌNH\n```\n\n### Bảng Giải Thích Bản Chất Kỹ Thuật:\n\n| Hiện tượng | Giải thích bản chất | Lợi ích hiệu năng |\n|---|---|---|\n| **Các phần tử Cường, Dũng, Em không hề bị đụng tới** | `findFirst()` kích hoạt cơ chế Short-circuiting, phát cờ ngắt xử lý ngay khi có kết quả | Tiết kiệm 60% thời gian chạy trong ví dụ trên |\n| **Bình được lọc rồi map ngay lập tức** | Cơ chế **Loop Fusion**: JVM gộp các bước xử lý liên tiếp của từng phần tử vào một vòng lặp duy nhất | Không cần tạo ra bất kỳ Collection phụ trung gian nào, bảo vệ bộ nhớ Cache L1/L2 |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Chèn `sorted()` vào giữa Stream kích thước lớn\n- **Vấn đề**: Đặt `sorted()` sau một loạt filter. `sorted()` là một thao tác Stateful, nó buộc phải dừng toàn bộ luồng, kéo hết tất cả phần tử vào một mảng nội bộ rồi mới sort xong mới đẩy tiếp!\n- **Giải pháp**: Luôn lọc bớt dữ liệu tối đa bằng `filter()` trước khi gọi `sorted()`, hoặc sắp xếp từ tầng Database trước khi đưa lên Java.\n\n### Checklist Bài 3.2\n- [ ] Tận dụng tính lười biếng (Lazy Evaluation) để xây dựng các câu truy vấn động linh hoạt.\n- [ ] Đặt các thao tác Short-circuiting (`findFirst`, `limit`) để ngắt sớm các pipeline nặng.\n- [ ] Không sử dụng Stateful Operations (`sorted`, `distinct`) trên luồng dữ liệu vô hạn hoặc luồng thời gian thực.\n"
        },
        {
          "id": "j1-3-3",
          "type": "practice",
          "title": "Bài 3.3: Thu Gom Dữ Liệu Nâng Cao: Grouping, Partitioning & Tự Viết Custom Collector",
          "minutes": 10,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Thành thạo các hàm Collector phức tạp: `Collectors.groupingBy`, `partitioningBy`, và `teeing`.\n- Kết hợp Downstream Collectors nhiều tầng (`mapping`, `filtering`, `summarizingDouble`).\n- Giải phẫu interface `Collector<T, A, R>`: 5 phương thức trụ cột (`supplier`, `accumulator`, `combiner`, `finisher`, `characteristics`).\n- Tự tay hiện thực một **Custom Batching Collector** dùng gom đơn hàng thành từng lô để gửi qua REST API.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: DÂY CHUYỀN ĐÓNG THÙNG BƯU KIỆN\n- **Collector** giống như một công nhân đứng ở cuối băng chuyền với nhiệm vụ gom hàng vào thùng:\n  1. `supplier()`: Công nhân lấy ra một chiếc thùng carton rỗng mới tinh.\n  2. `accumulator()`: Mỗi khi có kiện hàng chạy tới, công nhân nhặt nhét vào thùng.\n  3. `combiner()`: Nếu có 2 công nhân đóng 2 thùng song song, họ đổ chung hàng của 2 thùng vào làm 1.\n  4. `finisher()`: Dán băng dính niêm phong thùng và in mã vận đơn chuyển phát đi!\n  5. `characteristics()`: Tờ giấy ghi chú: Thùng này có cần dán băng dính không (`IDENTITY_FINISH`), có đóng lộn xộn được không (`UNORDERED`).\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc 5 Trụ Cột Của Interface Collector<T, A, R>)\n\n```mermaid\nflowchart LR\n    subgraph COLLECTOR_API [\"Collector<T, A, R> Contract\"]\n        S[\"supplier(): () -> A<br/>Khởi tạo bộ chứa kết quả trung gian\"]\n        A[\"accumulator(): (A, T) -> void<br/>Thêm từng phần tử T vào bộ chứa A\"]\n        C[\"combiner(): (A, A) -> A<br/>Hợp nhất 2 bộ chứa khi chạy song song\"]\n        F[\"finisher(): (A) -> R<br/>Biến đổi bộ chứa A sang kết quả cuối R\"]\n        CH[\"characteristics(): Set<Characteristics><br/>Cấu hình: CONCURRENT, UNORDERED, IDENTITY_FINISH\"]\n    end\n    style S fill:#1e3a8a,stroke:#3b82f6,color:#fff\n    style A fill:#064e3b,stroke:#10b981,color:#fff\n    style C fill:#7f1d1d,stroke:#ef4444,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Các Giải Pháp Thu Gom Dữ Liệu)\n\n| Yêu cầu nghiệp vụ | Giải pháp chuẩn mực trong Java 21 |\n|---|---|\n| Gom nhóm theo trạng thái thanh toán | `Collectors.groupingBy(Order::status)` |\n| Phân chia thành 2 nhóm Đạt / Không đạt | `Collectors.partitioningBy(Order::isVip)` |\n| Tính cả Min, Max, Sum, Avg trong 1 lượt duyệt duy nhất | `Collectors.summarizingLong(Order::amount)` hoặc `Collectors.teeing()` |\n| Gom danh sách thành từng lô Batch kích thước cố định | ⭐ **Tự viết Custom Collector (`BatchingCollector`)** |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Hiện Thực Custom Batching Collector)\n\nYêu cầu thực chiến: Nhận vào một Stream các đơn hàng, gom chúng thành từng lô danh sách con `List<List<Order>>` với kích thước mỗi lô là `batchSize` để gửi bulk sang cổng thanh toán.\n\n```java\npackage vn.mastery.ecommerce.collector;\n\nimport java.util.*;\nimport java.util.function.*;\nimport java.util.stream.Collector;\n\npublic class BatchingCollector<T> implements Collector<T, List<List<T>>, List<List<T>>> {\n\n    private final int batchSize;\n\n    public BatchingCollector(int batchSize) {\n        if (batchSize <= 0) throw new IllegalArgumentException(\"Batch size phải > 0\");\n        this.batchSize = batchSize;\n    }\n\n    // 1. Khởi tạo container trung gian: Một danh sách chứa các lô\n    @Override\n    public Supplier<List<List<T>>> supplier() {\n        return () -> {\n            List<List<T>> list = new ArrayList<>();\n            list.add(new ArrayList<>()); // Tạo lô đầu tiên\n            return list;\n        };\n    }\n\n    // 2. Tích lũy phần tử: Đẩy vào lô hiện tại; nếu lô đầy thì mở lô mới\n    @Override\n    public BiConsumer<List<List<T>>, T> accumulator() {\n        return (batches, item) -> {\n            List<T> currentBatch = batches.get(batches.size() - 1);\n            if (currentBatch.size() >= batchSize) {\n                currentBatch = new ArrayList<>();\n                batches.add(currentBatch);\n            }\n            currentBatch.add(item);\n        };\n    }\n\n    // 3. Kết hợp kết quả khi chạy song song (Merge 2 danh sách lô)\n    @Override\n    public BinaryOperator<List<List<T>>> combiner() {\n        return (left, right) -> {\n            // Gom lô cuối của left với lô đầu của right nếu chưa đủ size\n            List<T> lastLeft = left.get(left.size() - 1);\n            for (List<T> rightBatch : right) {\n                for (T item : rightBatch) {\n                    if (lastLeft.size() >= batchSize) {\n                        lastLeft = new ArrayList<>();\n                        left.add(lastLeft);\n                    }\n                    lastLeft.add(item);\n                }\n            }\n            return left;\n        };\n    }\n\n    // 4. Hoàn tất: Trả về trực tiếp container mà không cần biến đổi\n    @Override\n    public Function<List<List<T>>, List<List<T>>> finisher() {\n        return Function.identity();\n    }\n\n    // 5. Đặc tính của Collector: IDENTITY_FINISH\n    @Override\n    public Set<Characteristics> characteristics() {\n        return Collections.singleton(Characteristics.IDENTITY_FINISH);\n    }\n\n    // Factory method tiện lợi\n    public static <T> BatchingCollector<T> ofSize(int batchSize) {\n        return new BatchingCollector<>(batchSize);\n    }\n}\n```\n\n### Sử Dụng BatchingCollector Trong Thực Tế:\n\n```java\nList<Integer> transactions = List.of(1, 2, 3, 4, 5, 6, 7);\nList<List<Integer>> batches = transactions.stream()\n    .collect(BatchingCollector.ofSize(3));\n\n// Kết quả in ra: [[1, 2, 3], [4, 5, 6], [7]]\nSystem.out.println(\"Các lô gom được: \" + batches);\n```\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Khai báo cờ `Characteristics.CONCURRENT` bừa bãi\n- **Vấn đề**: Đánh dấu `CONCURRENT` cho một Collector dùng `ArrayList` tích lũy dữ liệu. Khi chạy trên Parallel Stream, nhiều thread sẽ cùng gọi `accumulator.accept()` vào một ArrayList không an toàn, gây mất mát dữ liệu hoặc lỗi `ArrayIndexOutOfBoundsException`!\n- **Giải pháp**: Chỉ đánh dấu `CONCURRENT` nếu container của bạn là thread-safe (như `ConcurrentHashMap`) và không yêu cầu `combiner`.\n\n### Checklist Bài 3.3\n- [ ] Dùng `Collectors.teeing()` khi cần tính toán đồng thời 2 giá trị gộp khác nhau trong 1 lượt.\n- [ ] Tự viết Custom Collector khi các hàm dựng sẵn của Java không đáp ứng đủ cấu trúc nghiệp vụ phức tạp.\n- [ ] Đảm bảo tính nhất quán giữa container trung gian và cờ `Characteristics`.\n"
        },
        {
          "id": "j1-3-4",
          "type": "practice",
          "title": "Bài 3.4: Xử Lý Dữ Liệu Song Song (Parallel Streams): ForkJoinPool & Hiệu Năng Thực Chiến",
          "minutes": 10,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải mã cơ chế thực thi của **Parallel Streams**: Phân bổ luồng trên `ForkJoinPool.commonPool()`.\n- Nắm vững thuật toán **Work-Stealing**: Cách các worker thread đánh cắp công việc để cân bằng tải CPU.\n- Ứng dụng mô hình chi phí của Brian Goetz: **Quy tắc vàng $N \\times Q > 10,000$**.\n- Nhận diện 4 cạm bẫy chết người: Tranh chấp tài nguyên, chia sẻ trạng thái khả biến, nghẽn I/O và suy giảm hiệu năng.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: MỘT NGƯỜI LÀM SO VỚI ĐỘI BỐC VÁC CÓ TRƯỞNG NHÓM\n- **Tuần tự (Sequential Stream)**: Giống như một anh công nhân tự tay vác 100 bao xi măng từ xe tải xuống kho. Chậm nhưng chắc, không cần họp hành bàn bạc.\n- **Song song (Parallel Stream)**: Bạn thuê hẳn 8 anh lực lưỡng (8 CPU Cores). \n  - **Mặt tốt**: Nếu có 10.000 bao xi măng nặng, 8 người vác xong nhanh gấp 7 lần!\n  - **Mặt trái**: Nếu chỉ có đúng 2 bao xi măng con con, thời gian nhóm trưởng đứng điểm danh, phân chia xe, chia đường đi... còn **LÂU HƠN GẤP MƯỜI LẦN** so với để một người tự vác!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Fork/Join Framework & Work-Stealing)\n\n```mermaid\nflowchart TD\n    Task[\"Công Việc Lớn: Tính Toán 10.000.000 Giao Dịch\"] --> Split[\"Spliterator: Chẻ đôi công việc (Fork)\"]\n    \n    subgraph ForkJoin_Threads [\"ForkJoinPool.commonPool() Worker Threads\"]\n        T1[\"Worker Thread 1<br/>[Deque Nhiệm Vụ 1]\"] \n        T2[\"Worker Thread 2<br/>[Deque Nhiệm Vụ 2]\"]\n        T3[\"Worker Thread 3<br/>[Deque Rỗng ➔ Đánh cắp việc từ T1!]\"]\n    end\n    \n    Split --> T1\n    Split --> T2\n    T1 -.->|\"Work-Stealing Algorithm\"| T3\n    \n    T1 --> Join[\"Hợp Nhất Kết Quả (Join)\"]\n    T2 --> Join\n    T3 --> Join\n    Join --> Result[\"Kết Quả Tổng Hợp Hoàn Chỉnh\"]\n    style ForkJoin_Threads fill:#064e3b,stroke:#10b981,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Mô Hình Chi Phí Quyết Định Của Brian Goetz: $N \\times Q$)\n\nBrian Goetz (Kiến trúc sư trưởng ngôn ngữ Java) đề xuất công thức thực nghiệm:\n\n$$\\text{Chỉ dùng Parallel Stream khi } N \\times Q > 10,000$$\n\n- Trong đó:\n  - $N$: Số lượng phần tử trong tập dữ liệu.\n  - $Q$: Chi phí tính toán CPU trên mỗi phần tử (Số chu kỳ lệnh CPU).\n\n### Ma Trận Đánh Giá Hiệu Năng Thực Tế:\n\n| Tình huống | $N \\times Q$ | Sequential Stream | Parallel Stream | Quyết định chuẩn |\n|---|---|---|---|---|\n| 50 đơn hàng, tính thuế đơn giản | $50 \\times 10 = 500$ | **0.01 ms** | 1.5 ms (Tốn chi phí chia thread) | ❌ **Tuyệt đối không dùng Parallel** |\n| 5.000 ảnh, trích xuất mã hóa SHA-256 | $5,000 \\times 500 = 2,500,000$ | 8.2 giây | **1.2 giây (Nhanh gấp 7 lần)** | ⭐ **RẤT NÊN DÙNG Parallel** |\n| Đọc ghi Database hoặc gọi REST API | N/A (I/O Bound) | Chậm | 💥 Gây nghẽn toàn bộ CommonPool của app | ❌ **CẤM DÙNG (Dùng Virtual Threads)** |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Đo Lường Hiệu Năng & Tránh Bẫy Chia Sẻ Trạng Thái)\n\n### Cạm bẫy phá hủy tính toàn vẹn dữ liệu do chia sẻ trạng thái:\n\n```java\npackage vn.mastery.ecommerce.parallel;\n\nimport java.util.ArrayList;\nimport java.util.List;\nimport java.util.stream.IntStream;\n\npublic class ParallelDataRaceTrap {\n\n    public static void main(String[] args) {\n        List<Integer> unsafeList = new ArrayList<>();\n\n        // 💥 NGUY HIỂM CHẾT NGƯỜI: Nhiều thread cùng ghi vào ArrayList không đồng bộ!\n        IntStream.range(0, 10_000)\n            .parallel()\n            .forEach(unsafeList::add);\n\n        // Kết quả mong đợi: 10.000 phần tử\n        // Kết quả thực tế: Chỉ có khoảng ~9.200 phần tử, hoặc ném ArrayIndexOutOfBoundsException!\n        System.out.println(\"Số lượng phần tử thực tế trong danh sách: \" + unsafeList.size());\n    }\n}\n```\n\n### Cách Viết Chuẩn Mực Thread-Safe Bằng Stream Reduction:\n\n```java\n// ✅ GIẢI PHÁP CHUẨN: Sử dụng toList() hoặc collect() an toàn đa luồng\nList<Integer> safeList = IntStream.range(0, 10_000)\n    .parallel()\n    .boxed()\n    .toList(); // Compiler và JDK tự xử lý gom kết quả an toàn 100%\n\nSystem.out.println(\"Số lượng phần tử an toàn: \" + safeList.size()); // Luôn là 10.000!\n```\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Dùng Parallel Stream cho các tác vụ Blocking I/O\n- **Vấn đề**: `parallelStream()` mặc định dùng chung `ForkJoinPool.commonPool()`. Nếu bạn gọi lệnh sleep, HTTP call hoặc JDBC call trong parallel stream, toàn bộ các luồng worker của JVM sẽ bị giữ chặt, khiến toàn bộ các luồng parallel stream khác trong toàn hệ thống bị tê liệt hoàn toàn!\n- **Giải pháp**: Chỉ dùng Parallel Stream cho các bài toán tính toán thuần túy trên CPU (CPU-bound). Đối với Blocking I/O, hãy chuyển sang Virtual Threads (Java 21).\n\n### Checklist Bài 3.4\n- [ ] Chỉ cân nhắc Parallel Stream khi tập dữ liệu lớn và thuật toán tốn CPU ($N \\times Q > 10,000$).\n- [ ] Tuyệt đối không thực hiện bất kỳ thao tác I/O hay sleep nào trong Parallel Stream.\n- [ ] Không chia sẻ các biến khả biến (Mutable state) trong biểu thức lambda song song.\n"
        }
      ]
    },
    {
      "id": 204,
      "title": "Lập Trình Bất Đồng Bộ, CompletableFuture & Virtual Threads (Project Loom)",
      "subtitle": "ThreadPoolExecutor Tuning, Asynchronous CompletableFuture & Virtual Threads JEP 444",
      "icon": "⚡",
      "color": "#059669",
      "desc": "Chinh phục đỉnh cao xử lý đa luồng hiện đại: Cấu hình ThreadPoolExecutor, lập trình bất đồng bộ với CompletableFuture, cách mạng Virtual Threads (JEP 444) và Structured Concurrency.",
      "outcomes": [
        "Cấu hình ThreadPoolExecutor chuẩn công nghiệp: Định cỡ Core/Max Pool, chọn Work Queue và Rejection Policies",
        "Xây dựng Non-blocking Pipeline phức tạp với CompletableFuture: thenCompose, thenCombine, allOf và xử lý timeout",
        "Hiểu sâu kiến trúc Virtual Threads (Project Loom): M:N Scheduling, Carrier Threads, và triệt tiêu Thread Pinning",
        "Áp dụng Structured Concurrency và Scoped Values để loại bỏ rò rỉ luồng và thay thế ThreadLocal nặng nề"
      ],
      "topics": [
        {
          "id": "threadpool-completablefuture",
          "title": "Thread Pools & Lập Trình Bất Đồng Bộ CompletableFuture",
          "lessonIds": [
            "j1-4-1",
            "j1-4-2"
          ]
        },
        {
          "id": "virtual-threads-loom",
          "title": "Virtual Threads & Đồng Thời Cấu Trúc (Structured Concurrency)",
          "lessonIds": [
            "j1-4-3",
            "j1-4-4"
          ]
        }
      ],
      "retrievalWarmup": [
        {
          "q": "Chi phí tài nguyên hệ thống (RAM & OS) để tạo một Platform Thread (Thread của hệ điều hành) trong Java là khoảng bao nhiêu?",
          "options": [
            "Mỗi Platform Thread ngốn khoảng 1MB bộ nhớ Stack trên RAM và liên kết 1:1 với Kernel Thread của hệ điều hành, khiến số lượng luồng bị giới hạn ở vài nghìn.",
            "Mỗi Thread chỉ tốn vài bytes RAM và có thể tạo hàng chục triệu thread tùy thích.",
            "Java Thread hoàn toàn không dùng bộ nhớ RAM của hệ điều hành.",
            "Chi phí tạo thread trong Java bằng 0 nhờ bộ nhớ đệm CPU."
          ],
          "answer": 0,
          "explain": "Platform Thread trong Java truyền thống ánh xạ 1:1 với OS Kernel Thread. Mỗi thread cần cấp phát khoảng 1MB Stack memory và tốn chi phí chuyển ngữ cảnh (Context Switching) đắt đỏ, là rào cản lớn đối với hệ thống hàng triệu kết nối đồng thời."
        },
        {
          "q": "Tại sao các chuyên gia Java luôn khuyến cáo TUYỆT ĐỐI KHÔNG dùng Executors.newCachedThreadPool() hoặc Executors.newFixedThreadPool() trên Production?",
          "options": [
            "newCachedThreadPool có thể tạo vô hạn thread (Integer.MAX_VALUE), còn newFixedThreadPool dùng hàng đợi LinkedBlockingQueue không giới hạn (Unbounded Queue), đều dễ dàng gây sập hệ thống vì OutOfMemoryError.",
            "Các phương thức này không hỗ trợ cú pháp lambda.",
            "Chúng bị Java 21 khai tử hoàn toàn.",
            "Chúng chỉ chạy được trên hệ điều hành Windows."
          ],
          "answer": 0,
          "explain": "Executors factory methods che giấu các cấu hình nguy hiểm: Hàng đợi không giới hạn (Unbounded Queue) làm tích tụ hàng triệu request khi server quá tải, dẫn đến cạn kiệt RAM và sập JVM với OutOfMemoryError."
        },
        {
          "q": "Mục đích cốt lõi của tính năng Virtual Threads (JEP 444) trong Java 21 là gì?",
          "options": [
            "Cho phép viết mã đồng bộ blocking quen thuộc, dễ đọc, dễ debug nhưng vẫn đạt được thông lượng xử lý hàng triệu request đồng thời như Reactive Programming.",
            "Làm cho một tác vụ tính toán CPU đơn lẻ chạy nhanh hơn gấp 100 lần.",
            "Thay thế hoàn toàn cấu trúc dữ liệu ArrayList và HashMap.",
            "Tự động chuyển đổi mã Java sang chạy trên GPU."
          ],
          "answer": 0,
          "explain": "Virtual Threads giải quyết triệt để sự đánh đổi giữa 'mã dễ đọc' và 'thông lượng cao': Cho phép lập trình viên viết code blocking tuần tự (Thread-per-request) nhưng bên dưới JVM tự động unmount thread khi gặp I/O, phục vụ hàng triệu request với chi phí cực thấp."
        }
      ],
      "quiz": {
        "id": "j1-quiz-4",
        "type": "quiz",
        "title": "Sát Hạch Module J1.4: Concurrency, CompletableFuture & Virtual Threads",
        "questions": [
          {
            "level": "hard",
            "targetLessonId": "j1-4-3",
            "scenario": "Một lập trình viên chuyển đổi hệ thống backend Spring Boot sang dùng Virtual Threads trong Java 21. Trong mã nguồn có một khối synchronized bên trong chứa lệnh gọi truy vấn cơ sở dữ liệu qua JDBC: synchronized (lock) { resultSet = stmt.executeQuery(); }. Khi chịu tải 10.000 requests, server bị treo cứng.",
            "q": "Hiện tượng gì đã xảy ra với các Virtual Threads của hệ thống?",
            "options": [
              "Hiện tượng 'Thread Pinning': Khối synchronized làm luồng ảo bị ghim chặt vào Carrier Thread (OS Thread), khiến Carrier Thread không thể unmount khi gặp blocking I/O, dẫn đến cạn kiệt toàn bộ pool luồng vận chuyển.",
              "Cơ sở dữ liệu bị quá tải do số lượng kết nối ảo vô hạn.",
              "JDBC Driver tự động ngắt kết nối khi phát hiện Virtual Thread.",
              "Trình biên dịch Java 21 từ chối thực thi khối synchronized."
            ],
            "answer": 0,
            "explain": "Thread Pinning xảy ra khi một Virtual Thread thực hiện thao tác Blocking I/O bên trong một khối `synchronized` hoặc lời gọi Native Frame. Khi bị pinned, luồng ảo không thể unmount khỏi Carrier Thread, biến Carrier Thread thành luồng bị block, làm tê liệt toàn bộ hệ thống. Giải pháp là thay `synchronized` bằng `ReentrantLock`."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-4-1",
            "scenario": "Hệ thống thanh toán cấu hình ThreadPoolExecutor với corePoolSize = 5, maxPoolSize = 20, và workQueue = new LinkedBlockingQueue<>(100). Hiện tại có 5 thread đang chạy và có 50 request mới đồng thời gửi đến.",
            "q": "Hành động nào sẽ được ThreadPoolExecutor thực hiện tiếp theo?",
            "options": [
              "50 request mới sẽ được đưa vào hàng đợi workQueue; số lượng thread đang chạy vẫn giữ nguyên là 5.",
              "Hệ thống tạo thêm ngay lập tức 15 thread mới để nâng tổng số thread lên 20.",
              "Kích hoạt Rejection Policy vì vượt quá corePoolSize.",
              "Ném ngoại lệ OutOfMemoryError."
            ],
            "answer": 0,
            "explain": "Quy tắc hoạt động của ThreadPoolExecutor: Khi số thread đã đạt `corePoolSize`, mọi request mới đến sẽ được ưu tiên xếp vào `workQueue`. Chỉ khi nào workQueue bị đầy kín (đạt ngưỡng 100 trong trường hợp này), pool mới bắt đầu tạo thêm thread vượt quá corePoolSize lên tới maxPoolSize."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-4-2",
            "scenario": "Lập trình viên muốn nối tiếp 2 tác vụ bất đồng bộ: Bước 1 lấy User từ DB (trả về CompletableFuture<User>), Bước 2 lấy Order của User đó (hàm nhận User và trả về CompletableFuture<List<Order>>).",
            "q": "Toán tử nào của CompletableFuture nên được sử dụng để kết quả cuối cùng là CompletableFuture<List<Order>> phẳng (không bị lồng 2 tầng Future)?",
            "options": [
              "thenCompose()",
              "thenApply()",
              "thenCombine()",
              "allOf()"
            ],
            "answer": 0,
            "explain": "`thenCompose()` đóng vai trò như flatMap trong functional programming: Nếu hàm truyền vào trả về một `CompletableFuture`, `thenCompose` sẽ làm phẳng (flatten) kết quả thành một tầng Future duy nhất, thay vì sinh ra kiểu lồng `CompletableFuture<CompletableFuture<List<Order>>>` như `thenApply`."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-4-1",
            "scenario": "Chính sách từ chối tác vụ 'CallerRunsPolicy' trong ThreadPoolExecutor mang lại lợi ích đặc biệt gì khi máy chủ bị quá tải?",
            "q": "Cơ chế của CallerRunsPolicy giúp ích gì cho khả năng chịu tải?",
            "options": [
              "Ép chính Thread gọi lệnh gửi task (thường là luồng tiếp nhận HTTP) phải tự tay thực thi task đó, tạo ra cơ chế Backpressure tự nhiên làm giảm tốc độ nhận request mới của hệ thống.",
              "Tự động tăng gấp đôi dung lượng bộ nhớ RAM của máy chủ.",
              "Lưu các task bị từ chối vào file đĩa cứng.",
              "Tự động chuyển tiếp các task sang máy chủ phụ trong cụm cluster."
            ],
            "answer": 0,
            "explain": "Khi dùng `CallerRunsPolicy`, luồng gọi lệnh (ví dụ luồng HTTP container tiếp nhận request) phải tự mình thực thi tác vụ bị tràn. Trong thời gian luồng này bận chạy task, nó không thể nhận thêm request mới, giúp hạ nhiệt hệ thống một cách tự nhiên (Natural Backpressure)."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-4-4",
            "scenario": "Trong mô hình Structured Concurrency (Java 21), chiến lược 'StructuredTaskScope.ShutdownOnFailure' hoạt động theo nguyên lý nào?",
            "q": "Nguyên lý vận hành của ShutdownOnFailure là gì?",
            "options": [
              "Nếu có bất kỳ một tác vụ con nào bị thất bại (ném ngoại lệ), phạm vi sẽ lập tức phát tín hiệu hủy (cancel/interrupt) toàn bộ các tác vụ con còn lại và fail-fast.",
              "Nó lẳng lặng nuốt lỗi và tiếp tục chờ các tác vụ khác chạy xong.",
              "Tự động khởi động lại tác vụ bị lỗi vô hạn lần.",
              "Chỉ dừng khi toàn bộ 100% các tác vụ con đều bị thất bại."
            ],
            "answer": 0,
            "explain": "`ShutdownOnFailure` triển khai mô hình Fail-Fast: Khi một nhánh con thất bại, nó nhận ra kết quả tổng thể không còn hợp lệ nữa và ngay lập tức gửi tín hiệu ngắt (interrupt) tới toàn bộ các luồng con anh chị em đang chạy, triệt tiêu lãng phí tài nguyên và ngăn ngừa luồng mồ côi."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-4-3",
            "scenario": "Tại sao trên môi trường chạy Java 21 với Virtual Threads, lập trình viên được khuyến cáo KHÔNG NÊN sử dụng cơ chế Thread Pool (ví dụ không dùng pool luồng ảo)?",
            "q": "Lý do căn bản vì sao không nên tạo pool cho Virtual Threads?",
            "options": [
              "Virtual Threads siêu nhẹ (chỉ tốn vài trăm bytes RAM), được thiết kế với vòng đời ngắn (Short-lived) để tạo ra khi có việc và hủy ngay khi xong; việc pool hóa không mang lại lợi ích mà còn gây nghẽn.",
              "Do Java Virtual Machine cấm gọi phương thức submit() trên Virtual Thread.",
              "Do Virtual Threads tự động biến mất sau 1 giây.",
              "Pool luồng ảo sẽ làm hỏng bộ nhớ Metaspace."
            ],
            "answer": 0,
            "explain": "Khác với Platform Threads nặng nề cần pool để tránh chi phí tạo luồng đắt đỏ, Virtual Threads có chi phí cấp phát tương đương một đối tượng Java thông thường. Việc pool hóa luồng ảo là anti-pattern; hãy dùng `Executors.newVirtualThreadPerTaskExecutor()` và dùng Semaphore nếu cần giới hạn tài nguyên."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-4-2",
            "scenario": "Hệ thống cần gọi đồng thời 3 cổng thanh toán bên thứ ba để lấy tỷ giá: BankA, BankB, BankC. Bạn chỉ muốn lấy kết quả từ cổng nào phản hồi NHANH NHẤT và bỏ qua 2 cổng còn lại.",
            "q": "Phương thức nào của CompletableFuture phù hợp nhất cho bài toán này?",
            "options": [
              "CompletableFuture.anyOf(futureA, futureB, futureC)",
              "CompletableFuture.allOf(futureA, futureB, futureC)",
              "futureA.thenCombine(futureB, ...)",
              "futureA.thenAcceptBoth(futureB, ...)"
            ],
            "answer": 0,
            "explain": "`CompletableFuture.anyOf()` nhận vào một danh sách các CompletableFuture và hoàn tất ngay khi có BẤT KỲ MỘT future nào trong danh sách hoàn thành (dù thành công hay ném ngoại lệ), cực kỳ tối ưu cho bài toán đua tốc độ (Race for the fastest result)."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-4-4",
            "scenario": "Điểm vượt trội căn bản của 'ScopedValue' (JEP 446) so với 'ThreadLocal' truyền thống trong các ứng dụng chịu tải cao là gì?",
            "q": "Ưu điểm cốt lõi của ScopedValue là gì?",
            "options": [
              "Dữ liệu là bất biến (Immutable), vòng đời gắn chặt theo phạm vi thực thi của Stack Frame, loại bỏ hoàn toàn nguy cơ rò rỉ bộ nhớ (Memory Leak) và tối ưu hóa vượt bậc cho hàng triệu Virtual Threads.",
              "Cho phép chia sẻ biến khả biến giữa nhiều tiến trình máy chủ khác nhau.",
              "Tự động mã hóa dữ liệu thành chuỗi Base64.",
              "Cho phép thay đổi giá trị biến ở bất kỳ tầng nào trong ứng dụng."
            ],
            "answer": 0,
            "explain": "`ThreadLocal` có tính khả biến và dễ gây rò rỉ bộ nhớ nghiêm trọng nếu quên gọi `.remove()` trong môi trường Thread Pool. `ScopedValue` giải quyết triệt để vấn đề này nhờ tính bất biến (Immutable) và cơ chế tự động giải phóng khi rời khỏi phạm vi khối lệnh (Bounded Lifetime)."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-4-1",
            "scenario": "Một lập trình viên gọi lệnh executor.shutdown() trên ExecutorService. Điều gì sẽ xảy ra với các tác vụ đang chạy dở dang và các tác vụ đang nằm chờ trong queue?",
            "q": "Trạng thái của Thread Pool sau khi gọi shutdown() là gì?",
            "options": [
              "Executor từ chối nhận các task mới gửi đến, nhưng vẫn tiếp tục thực thi hết các task đang chạy và các task còn nằm trong hàng đợi.",
              "Toàn bộ các task đang chạy bị dừng cưỡng bức ngay lập tức.",
              "Hàng đợi task bị xóa sạch ngay lập tức.",
              "Máy ảo JVM bị tắt ngay lập tức."
            ],
            "answer": 0,
            "explain": "`shutdown()` bắt đầu quy trình tắt êm ái (Graceful Shutdown): Không nhận thêm nhiệm vụ mới (ném RejectedExecutionException nếu cố submit), nhưng vẫn kiên nhẫn xử lý nốt các tác vụ đang chạy và các tác vụ đang xếp hàng trong queue."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-4-3",
            "scenario": "Cờ JVM nào sau đây được sử dụng để in ra chi tiết Stack Trace cảnh báo tại console mỗi khi phát hiện một Virtual Thread bị ghim (Pinning) vào OS Thread?",
            "q": "Cờ tham số chẩn đoán Thread Pinning của HotSpot JVM là gì?",
            "options": [
              "-Djdk.tracePinnedThreads=full",
              "-XX:+PrintGCDetails",
              "-Dvirtual.threads.debug=true",
              "-XX:+UseVirtualThreadsTrace"
            ],
            "answer": 0,
            "explain": "HotSpot JVM cung cấp cờ `-Djdk.tracePinnedThreads=full` (hoặc `=short`). Khi kích hoạt cờ này, mỗi khi có một luồng ảo bị ghim chặt do lock synchronized hoặc native method trong khi đang block I/O, JVM sẽ in cảnh báo chi tiết."
          },
          {
            "level": "medium",
            "targetLessonId": "j1-4-2",
            "scenario": "Một CompletableFuture đang chờ kết quả từ microservice khác. Lập trình viên muốn nếu sau 3 giây microservice đó không trả lời thì trả về giá trị mặc định là 'GIAO_DICH_CHO_XU_LY'.",
            "q": "Phương thức nào (từ Java 9+) hiện thực logic này một cách trực tiếp nhất?",
            "options": [
              "future.completeOnTimeout(\"GIAO_DICH_CHO_XU_LY\", 3, TimeUnit.SECONDS)",
              "future.orTimeout(3, TimeUnit.SECONDS)",
              "future.get(3, TimeUnit.SECONDS)",
              "future.timeoutFallback(\"GIAO_DICH_CHO_XU_LY\")"
            ],
            "answer": 0,
            "explain": "`completeOnTimeout(defaultVal, time, unit)` sẽ hoàn tất CompletableFuture với giá trị mặc định được cung cấp nếu thời gian chờ vượt quá ngưỡng, mà không hề ném ngoại lệ TimeoutException."
          },
          {
            "level": "hard",
            "targetLessonId": "j1-4-4",
            "scenario": "Khi sử dụng StructuredTaskScope, nếu lập trình viên gọi 'subtask.get()' trước khi gọi phương thức 'scope.join()', điều gì sẽ xảy ra?",
            "q": "Hậu quả khi gọi subtask.get() quá sớm là gì?",
            "options": [
              "Ném ngoại lệ IllegalStateException vì tác vụ con chưa được đảm bảo đã hoàn tất.",
              "Trả về giá trị null an toàn.",
              "Chương trình bị khóa luồng vĩnh viễn (Deadlock).",
              "Trình biên dịch Java báo lỗi đỏ lúc compile."
            ],
            "answer": 0,
            "explain": "Quy tắc của StructuredTaskScope: Luôn bắt buộc phải gọi `scope.join()` (để chờ các luồng con kết thúc) trước khi được phép đọc kết quả bằng `subtask.get()`. Nỗ lực truy cập trước khi join sẽ bị chặn bởi IllegalStateException."
          }
        ]
      },
      "lessons": [
        {
          "id": "j1-4-1",
          "type": "theory",
          "title": "Bài 4.1: Làm Chủ Thread Pools: ExecutorService, Cấu Hình Kích Thước & Rejection Policies",
          "minutes": 10,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải phẫu cấu trúc nội bộ của **ThreadPoolExecutor**: Core Pool Size, Maximum Pool Size, Keep-Alive, và Work Queue.\n- Công thức khoa học xác định kích thước Thread Pool tối ưu cho tác vụ CPU-bound vs I/O-bound.\n- Làm chủ 4 chính sách từ chối tác vụ khi quá tải (**RejectedExecutionHandler**): `AbortPolicy`, `CallerRunsPolicy`, `DiscardPolicy`, và `DiscardOldestPolicy`.\n- Quy trình tắt Thread Pool an toàn (Graceful Shutdown) không làm rớt giao dịch đang dở dang.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: PHÒNG GIAO DỊCH NGÂN HÀNG GIỜ CAO ĐIỂM\n- **Core Pool Size (Số quầy cố định)**: Ngân hàng luôn mở sẵn 4 quầy giao dịch thường trực, kể cả khi vắng khách.\n- **Work Queue (Ghế chờ)**: Khi cả 4 quầy đều bận, khách mới đến sẽ ngồi vào hàng ghế chờ (Kích thước 50 ghế).\n- **Max Pool Size (Quầy tăng cường)**: Khi hàng ghế chờ đã kín chỗ (50 khách), ngân hàng mới mở thêm các quầy tăng cường lên tối đa 10 quầy.\n- **Rejection Policy (Bảo vệ)**: Khi 10 quầy đều kín và 50 ghế chờ đều hết chỗ: Bác bảo vệ sẽ ra tay! Hoặc đuổi khách về (`AbortPolicy`), hoặc bắt chính vị khách đó tự ra cây ATM làm (`CallerRunsPolicy`)!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Luồng Quyết Định Của ThreadPoolExecutor)\n\n```mermaid\nflowchart TD\n    Req[\"Nhiệm Vụ Mới Đến (execute/submit)\"] --> C1{\"Số Thread hiện tại < CorePoolSize?\"}\n    C1 -->|\"Đúng\"| NewCore[\"Tạo Thread mới phục vụ ngay\"]\n    C1 -->|\"Sai\"| C2{\"Hàng đợi WorkQueue còn chỗ trống?\"}\n    \n    C2 -->|\"Còn chỗ\"| Enqueue[\"Xếp vào hàng đợi (Queue)\"]\n    C2 -->|\"Đầy nghẽn\"| C3{\"Số Thread < MaximumPoolSize?\"}\n    \n    C3 -->|\"Còn chỗ mở thêm\"| NewMax[\"Tạo Thread tạm thời để gánh tải\"]\n    C3 -->|\"Đã chạm trần Max\"| Reject[\"💥 KÍCH HOẠT REJECTION POLICY<br/>(CallerRuns, Abort, Discard)\"]\n    \n    style Req fill:#1e3a8a,stroke:#3b82f6,color:#fff\n    style Enqueue fill:#064e3b,stroke:#10b981,color:#fff\n    style Reject fill:#7f1d1d,stroke:#ef4444,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Công Thức Định Cỡ Thread Pool & Ma Trận Rejection)\n\n### Công Thức Định Cỡ Chuẩn (Goetz Formula):\n\n$$\\text{Threads} = \\text{Số Cores CPU} \\times \\left(1 + \\frac{\\text{Thời gian chờ I/O}}{\\text{Thời gian tính toán CPU}}\\right)$$\n\n- **Tác vụ CPU-bound (Mã hóa, nén ảnh, băm số)**: $\\text{Threads} = \\text{Số Cores} + 1$ (Tránh tranh chấp CPU).\n- **Tác vụ I/O-bound (Gọi REST API, Query SQL)**: $\\text{Threads} = \\text{Số Cores} \\times 5 \\text{ đến } 10$ (hoặc chuyển sang Virtual Threads).\n\n### Ma Trận Lựa Chọn Rejection Policy Cho Production:\n\n| Rejection Policy | Hành vi khi quá tải | Khi nào nên dùng trên Production? |\n|---|---|---|\n| **`AbortPolicy` (Mặc định)** | Ném ngoại lệ `RejectedExecutionException` | Khi cần fail-fast và có hệ thống Circuit Breaker phía trước |\n| **`CallerRunsPolicy`** | Ép chính Thread gửi lệnh (Caller) phải tự chạy task | ⭐ **KHUYÊN DÙNG**: Tự động giảm tốc độ gửi request của client (Backpressure tự nhiên)! |\n| **`DiscardPolicy`** | Lẳng lặng vứt bỏ task mà không báo gì | Chỉ dùng cho tác vụ không quan trọng như in log phụ, đo telemetry |\n| **`DiscardOldestPolicy`** | Vứt bỏ task nằm lâu nhất trong queue để nhét task mới vào | Dùng cho dữ liệu thời gian thực (Giá chứng khoán mới quan trọng hơn giá cũ) |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Khởi Tạo ThreadPool Chuẩn Mực)\n\n```java\npackage vn.mastery.ecommerce.concurrency;\n\nimport java.util.concurrent.*;\n\npublic class ProductionThreadPoolFactory {\n\n    public static ExecutorService createPaymentExecutor() {\n        int cpuCores = Runtime.getRuntime().availableProcessors();\n        int corePoolSize = cpuCores * 2;\n        int maxPoolSize = cpuCores * 4;\n        long keepAliveTime = 60L;\n\n        // 1. Luôn dùng Bounded Queue (Hàng đợi có giới hạn kích thước) để chống OOM!\n        BlockingQueue<Runnable> workQueue = new ArrayBlockingQueue<>(500);\n\n        // 2. ThreadFactory có đặt tên tùy biến giúp đọc Thread Dump dễ dàng\n        ThreadFactory threadFactory = new ThreadFactory() {\n            private int counter = 1;\n            @Override\n            public Thread newThread(Runnable r) {\n                Thread t = new Thread(r, \"payment-worker-\" + counter++);\n                t.setDaemon(false);\n                return t;\n            }\n        };\n\n        // 3. Khởi tạo ThreadPoolExecutor với CallerRunsPolicy để có cơ chế Backpressure tự nhiên\n        return new ThreadPoolExecutor(\n            corePoolSize,\n            maxPoolSize,\n            keepAliveTime,\n            TimeUnit.SECONDS,\n            workQueue,\n            threadFactory,\n            new ThreadPoolExecutor.CallerRunsPolicy() // Chống quá tải thông minh\n        );\n    }\n\n    // 4. Quy trình Graceful Shutdown chuẩn mực\n    public static void shutdownGracefully(ExecutorService executor) {\n        executor.shutdown(); // Ngừng nhận task mới\n        try {\n            if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {\n                executor.shutdownNow(); // Hủy các task đang kẹt\n                if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {\n                    System.err.println(\"Thread pool không thể dừng hoàn toàn!\");\n                }\n            }\n        } catch (InterruptedException ie) {\n            executor.shutdownNow();\n            Thread.currentThread().interrupt();\n        }\n    }\n}\n```\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Quên bắt ngoại lệ bên trong `submit()`\n- **Vấn đề**: Gọi `executor.submit(runnable)`. Nếu bên trong runnable phát nổ ngoại lệ (`NullPointerException`), ngoại lệ sẽ bị nuốt chửng hoàn toàn mà không hề in ra log, trừ khi bạn gọi `future.get()`!\n- **Giải pháp**: Luôn bọc `try-catch` bên trong nhiệm vụ hoặc dùng `execute()` nếu không cần lấy kết quả Future.\n\n### Checklist Bài 4.1\n- [ ] 100% Thread Pools phải sử dụng Bounded Queue (tuyệt đối không dùng LinkedBlockingQueue không giới hạn).\n- [ ] Đặt tên gợi nhớ cho Thread qua Custom ThreadFactory.\n- [ ] Luôn cài đặt phương thức Graceful Shutdown trong Spring Bean `@PreDestroy`.\n"
        },
        {
          "id": "j1-4-2",
          "type": "practice",
          "title": "Bài 4.2: Lập Trình Bất Đồng Bộ Với CompletableFuture: Pipelines, Combinators & Xử Lý Lỗi",
          "minutes": 10,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Thoát khỏi sự bế tắc của `Future.get()` blocking bằng **CompletableFuture** không khóa luồng (Non-blocking).\n- Phân biệt bản chất chuỗi nối tiếp (**Chaining** với `thenApply`, `thenCompose`) vs kết hợp song song (**Combining** với `thenCombine`).\n- Hợp nhất kết quả từ nhiều nguồn dịch vụ phân tán bằng `CompletableFuture.allOf()` và `anyOf()`.\n- Xử lý timeout và phục hồi lỗi thanh thoát với `orTimeout()`, `exceptionally()`, và `handle()`.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: THẺ RUNG ĐẶT ĐỒ UỐNG VÀ BỮA ĂN GIA ĐÌNH\n- **`Future.get()` cổ điển**: Bạn gọi đồ ăn xong đứng chôn chân tại quầy thu ngân. Mọi người phía sau đều bị bạn chặn đứng, không ai làm ăn gì được!\n- **`CompletableFuture`**: Thu ngân đưa cho bạn một **chiếc thẻ rung thông minh**:\n  - Bạn cầm thẻ về bàn ngồi lướt điện thoại (`Non-blocking`).\n  - Thẻ rung lên báo cà phê xong: Bạn tự động rẽ sang lấy bánh ngọt (`thenCompose`).\n  - Trong lúc đó, bạn của bạn đi mua pizza ở quầy bên cạnh. Cả hai món cùng xong thì 2 bạn cùng ngồi ăn (`thenCombine`)!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Pipeline Bất Đồng Bộ Trong CompletableFuture)\n\n```mermaid\nflowchart TD\n    Start[\"Bắt Đầu: Yêu Cầu Thanh Toán Đơn Hàng\"] --> CF1[\"CompletableFuture 1: Gọi Core Banking Trừ Tiền\"]\n    Start --> CF2[\"CompletableFuture 2: Gọi Kho Giữ Hàng (Inventory)\"]\n    Start --> CF3[\"CompletableFuture 3: Kiểm Tra Điểm Thưởng Khách Hàng\"]\n    \n    CF1 --> AllOf[\"CompletableFuture.allOf(CF1, CF2, CF3)<br/>(Chờ cả 3 dịch vụ hoàn tất song song)\"]\n    CF2 --> AllOf\n    CF3 --> AllOf\n    \n    AllOf --> Notify[\"thenApply(): Gửi Email Thông Báo Thành Công\"]\n    AllOf -.->|\"Nếu có 1 service timeout > 2s\"| Fallback[\"exceptionally(): Kích Hoạt Hoàn Tiền Tự Động\"]\n    \n    style Start fill:#1e3a8a,stroke:#3b82f6,color:#fff\n    style AllOf fill:#064e3b,stroke:#10b981,color:#fff\n    style Fallback fill:#7f1d1d,stroke:#ef4444,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Bảng Tra Cứu Các Toán Tử CompletableFuture Cốt Lõi)\n\n| Toán tử | Chữ ký hàm | Tác dụng nghiệp vụ |\n|---|---|---|\n| **`thenApply(fn)`** | `Function<T, R>` | Biến đổi kết quả đồng bộ khi bước trước hoàn tất (Map dữ liệu) |\n| **`thenCompose(fn)`** | `Function<T, CompletableFuture<R>>` | Nối tiếp 2 tác vụ bất đồng bộ liên tiếp (FlatMap tránh lồng Future trong Future) |\n| **`thenCombine(other, biFn)`** | `BiFunction<T, U, V>` | Chạy 2 tác vụ song song độc lập, khi cả hai xong thì hợp nhất kết quả |\n| **`allOf(cfs...)`** | `CompletableFuture<Void>` | Chờ một danh sách nhiều Future hoàn thành đồng thời |\n| **`orTimeout(time, unit)`** | `timeout, unit` | (Java 9+) Tự động ném `TimeoutException` nếu tác vụ chạy quá hạn |\n| **`exceptionally(fn)`** | `Function<Throwable, T>` | Bắt lỗi và trả về giá trị mặc định dự phòng (Fallback) |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Hệ Thống Thanh Toán Song Song & Fallback)\n\n```java\npackage vn.mastery.ecommerce.async;\n\nimport java.util.concurrent.*;\n\npublic class CheckoutAsyncEngine {\n\n    public record PaymentResult(String orderId, boolean success, String txnId) {}\n    public record InventoryResult(String orderId, boolean reserved) {}\n    public record CheckoutSummary(String orderId, String status) {}\n\n    private final ExecutorService executor = Executors.newFixedThreadPool(10);\n\n    public CompletableFuture<CheckoutSummary> processCheckoutAsync(String orderId, long amount) {\n        // Tác vụ 1: Gọi ngân hàng trừ tiền (chạy trên executor riêng)\n        CompletableFuture<PaymentResult> paymentFuture = CompletableFuture.supplyAsync(() -> {\n            return callBankApi(orderId, amount);\n        }, executor).orTimeout(2, TimeUnit.SECONDS); // Timeout sau 2 giây!\n\n        // Tác vụ 2: Giữ hàng trong kho\n        CompletableFuture<InventoryResult> inventoryFuture = CompletableFuture.supplyAsync(() -> {\n            return callInventoryApi(orderId);\n        }, executor).orTimeout(2, TimeUnit.SECONDS);\n\n        // Hợp nhất 2 kết quả chạy song song bằng thenCombine\n        return paymentFuture.thenCombine(inventoryFuture, (payment, inventory) -> {\n            if (payment.success() && inventory.reserved()) {\n                return new CheckoutSummary(orderId, \"HOÀN TẤT ĐƠN HÀNG\");\n            } else {\n                return new CheckoutSummary(orderId, \"THẤT BẠI: Kho hoặc Ngân hàng từ chối\");\n            }\n        }).exceptionally(ex -> {\n            // Xử lý khi có Timeout hoặc Exception\n            System.err.println(\"Lỗi xử lý thanh toán: \" + ex.getMessage());\n            return new CheckoutSummary(orderId, \"GIAO DỊCH THẤT BẠI (TIMEOUT / LỖI MẠNG)\");\n        });\n    }\n\n    private PaymentResult callBankApi(String orderId, long amount) {\n        return new PaymentResult(orderId, true, \"BANK_TXN_999\");\n    }\n\n    private InventoryResult callInventoryApi(String orderId) {\n        return new InventoryResult(orderId, true);\n    }\n}\n```\n\n### Bảng So Sánh `thenApply` vs `thenCompose`:\n\n| Phương thức | Kết quả trả về nếu hàm con trả về `CompletableFuture<String>` | Hậu quả |\n|---|---|---|\n| `cf.thenApply(this::asyncFetch)` | `CompletableFuture<CompletableFuture<String>>` | 💥 Bị lồng 2 tầng Future, rất khó xử lý tiếp |\n| `cf.thenCompose(this::asyncFetch)` | `CompletableFuture<String>` | ⭐ **Làm phẳng (Flatten)** thành 1 tầng duy nhất |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Không truyền ThreadPool riêng cho `supplyAsync()`\n- **Vấn đề**: Gọi `CompletableFuture.supplyAsync(supplier)` mà không chỉ định `Executor`. Mặc định CompletableFuture sẽ dùng chung `ForkJoinPool.commonPool()`. Nếu tác vụ bị block I/O, nó sẽ làm nghẽn toàn bộ ứng dụng!\n- **Giải pháp**: Luôn truyền ThreadPool chuyên dụng làm tham số thứ hai: `supplyAsync(supplier, customExecutor)`.\n\n### Checklist Bài 4.2\n- [ ] Luôn truyền Executor tường minh vào `supplyAsync` và các biến thể `*Async`.\n- [ ] Thiết lập `orTimeout()` trên tất cả các lời gọi mạng bất đồng bộ.\n- [ ] Dùng `thenCompose` khi nối tiếp các phương thức trả về CompletableFuture.\n"
        },
        {
          "id": "j1-4-3",
          "type": "practice",
          "title": "Bài 4.3: Virtual Threads (Java 21 LTS - JEP 444): Carrier Threads & Phòng Ngừa Pinning",
          "minutes": 10,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải mã cuộc cách mạng **Project Loom (JEP 444)** trong Java 21 LTS: Mô hình M:N Scheduling.\n- Phân biệt kiến trúc giữa **Virtual Threads** (tồn tại trên Java Heap) và **Carrier Threads** (OS Platform Threads).\n- Cơ chế Continuation: Cách JVM tự động tháo dỡ (Unmount) luồng ảo khi gặp thao tác Blocking I/O.\n- Phát hiện và loại bỏ cạm bẫy **Thread Pinning**: Khối `synchronized` vs `ReentrantLock`.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: DIỄN VIÊN ĐIỆN ẢNH VÀ TRANG PHỤC HÓA TRANG\n- **Platform Thread (Luồng truyền thống)**: Giống như một diễn viên mặc nguyên bộ giáp sắt nặng 50kg từ sáng đến tối. Kể cả khi ngồi chờ đạo diễn chỉnh đèn (Blocking I/O), diễn viên vẫn phải mặc giáp, chiếm trọn một chiếc ghế nghỉ đắt tiền của đoàn làm phim!\n- **Virtual Thread (Java 21)**: Giống như cuốn kịch bản siêu nhẹ bằng giấy! \n  - Khi đến cảnh quay (Tính toán CPU), kịch bản được trao cho một anh diễn viên đóng thế (Carrier Thread) diễn vài giây.\n  - Khi phải chờ đợi (Gọi Database, ngủ chờ mạng): Kịch bản được gấp lại cất vào ngăn kéo (Heap RAM). Anh diễn viên đóng thế lập tức quay sang diễn kịch bản cho người khác! Nhờ đó, chỉ 8 diễn viên có thể phục vụ **1.000.000 kịch bản cùng lúc**!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc M:N Scheduling & Thao Tác Mount/Unmount)\n\n```mermaid\nflowchart TD\n    subgraph VIRTUAL_LAYER [\"Tầng Luồng Ảo (Hàng Triệu Virtual Threads Trong Heap RAM)\"]\n        VT1[\"Virtual Thread 1<br/>(Gọi SQL Query)\"]\n        VT2[\"Virtual Thread 2<br/>(Gọi HTTP REST)\"]\n        VT3[\"Virtual Thread 3<br/>(Xử lý logic đơn hàng)\"]\n    end\n    \n    subgraph CARRIER_LAYER [\"Tầng Luồng Vận Chuyển (ForkJoinPool Carrier Threads = Số CPU Cores)\"]\n        CT1[\"Carrier Thread 1 (OS Thread)\"]\n        CT2[\"Carrier Thread 2 (OS Thread)\"]\n    end\n\n    VT3 -->|\"Mounted (Đang chạy CPU)\"| CT1\n    VT1 -.->|\"UNMOUNTED (Đang chờ I/O)<br/>Giải phóng Carrier Thread!\"| WaitQueue[\"Trạng Thái Chờ I/O\"]\n    style VIRTUAL_LAYER fill:#064e3b,stroke:#10b981,color:#fff\n    style CARRIER_LAYER fill:#1e3a8a,stroke:#3b82f6,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Nền Tảng: Platform Thread vs Virtual Thread)\n\n| Tiêu chí | Platform Thread (OS Thread) | Virtual Thread (Java 21 Project Loom) |\n|---|---|---|\n| **Dung lượng bộ nhớ RAM** | ~1MB (Cấp phát cố định ngoài Heap) | ⭐ **Chỉ vài trăm Bytes** (Cấp phát động trên Java Heap) |\n| **Số lượng tối đa tạo được** | 2.000 - 5.000 luồng (Quá tải là sập OS) | ⭐ **Hàng triệu luồng** đồng thời dễ dàng |\n| **Chi phí khởi tạo** | Rất nặng (Cần hệ điều hành cấp phát) | Siêu nhẹ (Tương đương tạo một đối tượng Java thông thường) |\n| **Có cần Thread Pool không?** | Bắt buộc phải có Pool để tái sử dụng | ❌ **CẤM DÙNG POOL**: Cứ có việc là `new` luồng ảo mới, dùng xong bỏ |\n| **Phù hợp nhất cho** | Thuật toán tính toán CPU nặng (AI, đồ họa) | ⭐ **Hệ sinh thái Microservices, Web API, JDBC Blocking I/O** |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Khởi Tạo Virtual Threads & Khắc Phục Pinning)\n\n### 1. Khởi Tạo Virtual Thread Trong Java 21:\n\n```java\npackage vn.mastery.ecommerce.loom;\n\nimport java.util.concurrent.Executors;\n\npublic class VirtualThreadServerDemo {\n\n    public static void main(String[] args) {\n        // Cách 1: Khởi tạo ExecutorService tự động sinh Virtual Thread cho mỗi task (Chuẩn nhất)\n        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n            for (int i = 0; i < 100_000; i++) {\n                final int taskId = i;\n                executor.submit(() -> {\n                    // Giả lập tác vụ Blocking I/O (Thread.sleep unmounts Virtual Thread ngay lập tức!)\n                    Thread.sleep(1000);\n                    return \"Task \" + taskId + \" hoàn tất\";\n                });\n            }\n        } // Tự động awaitTermination khi kết thúc khối try-with-resources!\n        \n        System.out.println(\"Đã hoàn tất 100.000 tác vụ đồng thời trên luồng ảo mượt mà!\");\n    }\n}\n```\n\n### 2. Cạm Bẫy Thread Pinning & Giải Pháp Thay Thế Bằng ReentrantLock:\n\n```java\npackage vn.mastery.ecommerce.loom;\n\nimport java.util.concurrent.locks.ReentrantLock;\n\npublic class ThreadPinningSolution {\n\n    // 💥 CÁCH SAI LÀM PINNING: Dùng synchronized block với I/O bên trong!\n    public synchronized void badSynchronizedMethod() throws Exception {\n        // Khi thread ảo bị block I/O bên trong khối synchronized,\n        // nó sẽ GHIM CHẶT (PIN) luồng Carrier Thread, không cho tháo dỡ!\n        Thread.sleep(1000); \n    }\n\n    private final ReentrantLock lock = new ReentrantLock();\n\n    // ✅ CÁCH ĐÚNG TRONG JAVA 21: Dùng ReentrantLock\n    public void goodLockMethod() throws Exception {\n        lock.lock();\n        try {\n            // ReentrantLock hoàn toàn tương thích với Virtual Threads!\n            // Thread ảo unmount bình thường, giải phóng Carrier Thread cho task khác.\n            Thread.sleep(1000);\n        } finally {\n            lock.unlock();\n        }\n    }\n}\n```\n\n### Cách Phát Hiện Thread Pinning Trên Production:\n\nChạy ứng dụng với cờ tham số chẩn đoán của HotSpot JVM:\n\n```bash\njava -Djdk.tracePinnedThreads=full -jar my-ecommerce-service.jar\n```\n\nNếu có luồng ảo bị ghim chặt không unmount được, JVM sẽ in toàn bộ Stack Trace chỉ đích danh dòng code vi phạm ra console!\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Mang Virtual Thread vào gom chung trong Thread Pool\n- **Vấn đề**: Tạo `Executors.newFixedThreadPool(100, virtualThreadFactory)`. Virtual Threads sinh ra để dùng một lần rồi vứt bỏ, việc pool hóa chúng hoàn toàn vô nghĩa và phản tác dụng!\n- **Giải pháp**: Luôn dùng `Executors.newVirtualThreadPerTaskExecutor()`. Nếu muốn giới hạn tần suất gọi tài nguyên hữu hạn (như Database Connection), hãy dùng `Semaphore` thay vì pool luồng.\n\n### Checklist Bài 4.3\n- [ ] Thay thế `synchronized` bằng `ReentrantLock` ở các đoạn mã có chứa Blocking I/O.\n- [ ] Bật cờ `-Djdk.tracePinnedThreads=full` trong môi trường kiểm thử để săn lùng pinning.\n- [ ] Không pool hóa Virtual Threads; dùng `Semaphore` để quản trị giới hạn tải.\n"
        },
        {
          "id": "j1-4-4",
          "type": "practice",
          "title": "Bài 4.4: Lập Trình Đồng Thời Cấu Trúc: Structured Concurrency & Scoped Values",
          "minutes": 10,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải quyết bài toán luồng mồ côi (Thread Leaks) bằng **Đồng thời cấu trúc (Structured Concurrency)**.\n- Làm chủ 2 chiến lược phối hợp nhiệm vụ: `ShutdownOnFailure` và `ShutdownOnSuccess`.\n- Đảm bảo cơ chế ngắt lan truyền (Cancellation Propagation) khi một nhiệm vụ con thất bại.\n- Thay thế biến `ThreadLocal` nặng nề và dễ rò rỉ bộ nhớ bằng **Scoped Values (JEP 446)**.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: GIA ĐÌNH ĐI DU LỊCH VS ĐÁM ĐÔNG PHÂN TÁN\n- **Đa luồng truyền thống (Unstructured)**: Giống như bạn thả 3 đứa trẻ vào siêu thị chơi. Mỗi đứa chạy một góc, một đứa bị ngã khóc (Lỗi), 2 đứa kia vẫn tiếp tục chạy nhảy phá phách; còn bố mẹ thì không biết tìm con ở đâu (Luồng mồ côi rò rỉ tài nguyên)!\n- **Đồng thời cấu trúc (Structured Concurrency)**: Giống như một người cha dắt tay các con:\n  - Cả nhà cùng bước vào một phòng (`StructuredTaskScope`).\n  - Nếu một đứa con bị vấp chân ngã (`ShutdownOnFailure`): Người cha lập tức huýt sáo gọi tất cả các con khác dừng lại ngay lập tức và cùng nhau xử lý!\n  - Cả nhà chỉ cùng rời đi khi toàn bộ nhiệm vụ đã hoàn thành ngăn nắp!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Vòng Đời Của Structured Task Scope)\n\n```mermaid\nflowchart TD\n    Parent[\"Luồng Cha: Bắt Đầu StructuredTaskScope\"] --> Fork1[\"scope.fork(): Lấy Thông Tin Người Dùng\"]\n    Parent --> Fork2[\"scope.fork(): Lấy Danh Sách Đơn Hàng\"]\n    Parent --> Fork3[\"scope.fork(): Lấy Điểm Khuyến Mãi\"]\n    \n    Fork1 --> ScopeJoin[\"scope.join(): Chờ Toàn Bộ Các Con\"]\n    Fork2 --> ScopeJoin\n    Fork3 --> ScopeJoin\n    \n    ScopeJoin --> Success{\"Có Tác Vụ Con Nào Bị Lỗi Không?\"}\n    Success -->|\"Không lỗi\"| Ret[\"Hợp Nhất Kết Quả Thành DTO Trả Về\"]\n    Success -->|\"Fork 2 bị Timeout / Lỗi\"| Cancel[\"💥 Tự Động Gửi Lệnh Interrupt Hủy Fork 1 & Fork 3!<br/>(Cancellation Propagation)\"]\n    \n    style Parent fill:#1e3a8a,stroke:#3b82f6,color:#fff\n    style ScopeJoin fill:#064e3b,stroke:#10b981,color:#fff\n    style Cancel fill:#7f1d1d,stroke:#ef4444,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh ThreadLocal vs Scoped Values)\n\n| Tiêu chí | Biến Cục Bộ Luồng `ThreadLocal` | Biến Phạm Vi `ScopedValue` (Java 21+) |\n|---|---|---|\n| **Tính khả biến (Mutability)** | Khả biến (Có thể gọi `.set()` bất kỳ lúc nào) | ⭐ **Bất biến hoàn toàn (Immutable)** |\n| **Kế thừa sang luồng con** | Tốn chi phí sao chép sâu toàn bộ mảng dữ liệu | ⭐ Chia sẻ trực tiếp dữ liệu dạng Tree, không tốn RAM |\n| **Nguy cơ rò rỉ bộ nhớ (Memory Leak)** | 💥 **Cực kỳ nguy hiểm** nếu quên gọi `.remove()` | ⭐ **0% Rò rỉ**: Tự động dọn dẹp khi khối code kết thúc |\n| **Hiệu năng trên hàng triệu Virtual Threads** | Nặng nề, làm phình to bộ nhớ mỗi thread | Siêu nhẹ, được JVM và JIT tối ưu hóa ở tầng thanh ghi |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Hiện Thực Structured Concurrency)\n\n```java\npackage vn.mastery.ecommerce.structured;\n\nimport java.util.concurrent.StructuredTaskScope;\nimport java.util.function.Supplier;\n\npublic class OrderAggregationService {\n\n    public record UserProfile(String id, String name) {}\n    public record OrderHistory(String id, int orderCount) {}\n    public record DashboardResponse(UserProfile profile, OrderHistory history) {}\n\n    // 1. Khai báo ScopedValue bất biến thay thế ThreadLocal để truyền Context\n    public static final ScopedValue<String> TRACE_ID = ScopedValue.newInstance();\n\n    public DashboardResponse fetchDashboardData(String userId) throws Exception {\n        // Thực thi khối mã trong ngữ cảnh của ScopedValue\n        return ScopedValue.where(TRACE_ID, \"TRACE_REQ_8888\").call(() -> {\n            \n            // 2. Khởi tạo StructuredTaskScope với chiến lược Fail-Fast (ShutdownOnFailure)\n            try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {\n                \n                // Rẽ nhánh chạy 2 tác vụ con song song\n                Supplier<UserProfile> userSubtask = scope.fork(() -> queryUserProfile(userId));\n                Supplier<OrderHistory> orderSubtask = scope.fork(() -> queryOrderHistory(userId));\n\n                // 3. Chờ cho đến khi tất cả hoàn tất hoặc có một luồng con bị thất bại\n                scope.join();\n                \n                // 4. Nếu có luồng con ném ngoại lệ, ném tiếp ra ngoài và tự động cancel luồng còn lại!\n                scope.throwIfFailed(Exception::new);\n\n                // 5. Đọc kết quả một cách an toàn tuyệt đối\n                return new DashboardResponse(userSubtask.get(), orderSubtask.get());\n            }\n        });\n    }\n\n    private UserProfile queryUserProfile(String userId) {\n        System.out.println(\"Trace ID: \" + TRACE_ID.get() + \" đang lấy User\");\n        return new UserProfile(userId, \"Nguyễn Văn A\");\n    }\n\n    private OrderHistory queryOrderHistory(String userId) {\n        System.out.println(\"Trace ID: \" + TRACE_ID.get() + \" đang lấy Đơn hàng\");\n        return new OrderHistory(userId, 15);\n    }\n}\n```\n\n### Bảng Giải Thích Kỹ Thuật:\n\n| Dòng lệnh | Bản chất kỹ thuật | Giá trị thực tiễn |\n|---|---|---|\n| `new StructuredTaskScope.ShutdownOnFailure()` | Mô hình hóa công việc rẽ nhánh như một khối lệnh đơn nguyên | Xóa bỏ hoàn toàn hiện tượng tác vụ con chạy ngầm vô thừa nhận sau khi cha đã chết |\n| `scope.join()` | Rào cản đồng bộ hóa chờ tất cả luồng con kết thúc | Ngăn ngừa việc đọc kết quả khi dữ liệu chưa tính toán xong |\n| `ScopedValue.where(TRACE_ID, ...).call(...)` | Gắn giá trị chỉ có hiệu lực bên trong phạm vi ngăn xếp (Stack Frame) của hàm gọi | Không thể bị ghi đè lung tung, tự động hủy khi hết Scope |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Gọi `subtask.get()` trước khi gọi `scope.join()`\n- **Vấn đề**: Bạn gọi `userSubtask.get()` ngay sau lệnh `fork()`. Java sẽ lập tức ném ra ngoại lệ `IllegalStateException: Subtask not completed`!\n- **Giải pháp**: Luôn luôn bắt buộc phải gọi `scope.join()` (và `throwIfFailed`) trước khi được phép đọc giá trị qua phương thức `get()`.\n\n### Checklist Bài 4.4\n- [ ] Áp dụng Structured Concurrency cho toàn bộ các nghiệp vụ gọi song song nhiều API con.\n- [ ] Sử dụng `ShutdownOnFailure` cho tác vụ yêu cầu đủ tất cả; dùng `ShutdownOnSuccess` khi đua tốc độ (tìm kết quả nhanh nhất).\n- [ ] Thay thế dần các biến `ThreadLocal` sang `ScopedValue` trong Java 21+.\n"
        }
      ]
    }
  ]
};
})();
