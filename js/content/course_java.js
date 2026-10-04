/* =========================================================================
   Java Core & Clean Code Professional
   Complete Course Content: 4 Modules, 15 Lessons, 8 Quizzes.
   ========================================================================= */
(function() {
  "use strict";

  window.EXTRA_COURSES = window.EXTRA_COURSES || {};

  window.EXTRA_COURSES["java-core-mastery"] = {
    id: "java-core-mastery",
    title: "Java Core & Clean Code Professional",
    shortTitle: "Java Core & Design Patterns",
    icon: "☕",
    badge: "Java Foundation & OOP",
    level: "Core to Advanced",
    hours: "~35h",
    modulesCount: 4,
    lessonsCount: 15,
    quizCount: 8,
    desc: "Nền tảng vững chắc với Java 21 LTS: OOP, SOLID, Design Patterns, Collection Framework, Concurrency, Virtual Threads & Clean Code.",
    tags: ["Java 21", "OOP", "SOLID", "Collections", "Virtual Threads", "Design Patterns"],
    isAvailable: true,
    modules: [
  {
    "id": 0,
    "title": "Java 21 LTS & Hiện Đại Hóa Cú Pháp",
    "icon": "☕",
    "color": "#f59e0b",
    "desc": "Records, Pattern Matching, Sealed Classes, Sequenced Collections & Quản lý bộ nhớ JVM.",
    "lessons": [
      {
        "id": "java-0-1",
        "title": "Bài 0.1: Tổng quan Java 21 LTS & Lộ trình Hiện đại hóa",
        "minutes": 25,
        "type": "theory",
        "content": "# Bài 0.1: Tổng quan Java 21 LTS & Lộ trình Hiện đại hóa\n\nChào mừng bạn đến với **Java Core & Clean Code Professional**! Trong thế giới phát triển phần mềm hiện đại, Java không còn là một ngôn ngữ cồng kềnh với hàng tá boilerplate code như thời Java 8. Từ Java 17 đến Java 21 LTS, hệ sinh thái Java đã có cuộc cách mạng lớn về hiệu năng và trải nghiệm lập trình viên.\n\n:::tip Mục tiêu bài học\n- Nắm vững các cột mốc LTS của Java (8 -> 11 -> 17 -> 21)\n- Hiểu rõ vì sao Java 21 là chuẩn mực bắt buộc cho backend hiện đại\n- Setup JDK 21 (Temurin / GraalVM) và công cụ dòng lệnh (jshell, java --source)\n:::\n\n## 1. Lộ trình phát triển Java: Tại sao phải là Java 21 LTS?\n\nOracle áp dụng chu kỳ phát hành 6 tháng một phiên bản, và cứ mỗi 2 năm lại có một bản **LTS (Long Term Support)**:\n\n| Phiên bản | Năm phát hành | Hỗ trợ chuẩn | Điểm đột phá chính |\n| :--- | :--- | :--- | :--- |\n| **Java 8** | 2014 | Đã hết hạn chuẩn | Lambda, Stream API, Optional |\n| **Java 11** | 2018 | Hết hỗ trợ chính | HTTP Client, var in lambda |\n| **Java 17** | 2021 | LTS ổn định | Records, Sealed Classes, Pattern Matching switch |\n| **Java 21** | 2023 | LTS hiện tại (đến 2031) | Virtual Threads, Pattern Matching, Sequenced Collections |\n\n```mermaid\nflowchart LR\n    J8[\"Java 8 (2014)<br>Streams & Lambdas\"] --> J11[\"Java 11 (2018)<br>HTTP Client\"]\n    J11 --> J17[\"Java 17 (2021)<br>Records & Sealed\"]\n    J17 --> J21[\"Java 21 LTS (Chuẩn)<br>Virtual Threads & Loom\"]\n```\n\n## 2. Các tính năng cốt lõi của Java 21\n\n1. **Virtual Threads (Project Loom)**: Đưa luồng ảo vào production, giải quyết bài toán concurrency I/O cao mà không cần lập trình Reactive phức tạp.\n2. **Record Patterns**: Bóc tách dữ liệu từ Record trực tiếp trong các câu lệnh pattern matching.\n3. **Pattern Matching for switch**: Cho phép switch trên đối tượng và kiểu dữ liệu với điều kiện `when`.\n4. **Sequenced Collections**: Chuẩn hóa việc lấy phần tử đầu/cuối của List, Deque, Set (`getFirst()`, `getLast()`, `reversed()`).\n\n:::takeaways Ghi nhớ cốt lõi\n- Java 21 là baseline của toàn bộ framework thế hệ mới như Spring Boot 3.2+ và Quarkus 3+.\n- Virtual Threads giúp tăng throughput lên hàng chục lần cho các I/O bound application.\n:::\n"
      },
      {
        "id": "java-0-2",
        "title": "Bài 0.2: Records, Compact Constructors & Immutability",
        "minutes": 30,
        "type": "practice",
        "content": "# Bài 0.2: Records, Compact Constructors & Immutability\n\nTrước Java 14, để tạo một Data Transfer Object (DTO) bất biến, lập trình viên phải viết hàng chục dòng code boilerplate gồm: private final fields, constructor gán giá trị, getters, `equals()`, `hashCode()`, và `toString()`. **Record** ra đời để giải quyết triệt để vấn đề này.\n\n## 1. Khai báo Record chuẩn\n\nChỉ với 1 dòng code duy nhất, Java compiler tự động sinh ra toàn bộ các method cần thiết:\n\n~~~java\npublic record UserResponse(Long id, String email, String fullName, boolean active) {}\n~~~\n\nDưới đây là những gì Java compiler tự động tạo ra:\n- Các trường `private final Long id`, `private final String email`...\n- Canonical constructor nhận đủ 4 tham số\n- Public accessors: `user.id()`, `user.email()` (lưu ý không có tiền tố `get`)\n- `equals()` và `hashCode()` dựa trên tất cả các components\n- `toString()` hiển thị đầy đủ tên class và các giá trị\n\n## 2. Compact Constructor để Validation\n\nBạn không cần viết lại toàn bộ danh sách tham số khi muốn validate dữ liệu đầu vào:\n\n~~~java\npublic record CreateUserRequest(String email, int age) {\n    // Compact constructor: không có cặp ngoặc tròn (String email, int age)\n    public CreateUserRequest {\n        if (email == null || !email.contains(\"@\")) {\n            throw new IllegalArgumentException(\"Email không đúng định dạng!\");\n        }\n        if (age < 18) {\n            throw new IllegalArgumentException(\"Tuổi phải từ 18 trở lên!\");\n        }\n        email = email.trim().toLowerCase(); // Tự động normalize trước khi gán vào field\n    }\n}\n~~~\n\n:::warn Lưu ý quan trọng\nRecord là class **bất biến (Immutable)** và mặc định là **final** (không thể kế thừa). Nếu bên trong Record chứa một đối tượng có thể thay đổi (ví dụ `List<String>` hoặc `Date`), bạn nên tạo defensive copy trong constructor và accessor để đảm bảo tính bất biến!\n:::\n"
      },
      {
        "id": "java-0-3",
        "title": "Bài 0.3: Pattern Matching cho switch & Sealed Classes",
        "minutes": 35,
        "type": "practice",
        "content": "# Bài 0.3: Pattern Matching cho switch & Sealed Classes\n\n## 1. Sealed Classes: Kiểm soát cây phân cấp kế thừa\n\nTrong Java truyền thống, một class hoặc là mở cho tất cả mọi người kế thừa (`public`), hoặc là khóa hoàn toàn (`final`). **Sealed Classes** mang lại khả năng kiểm soát chính xác ai được phép kế thừa.\n\n~~~java\n// Định nghĩa Payment chỉ cho phép 3 hình thức cụ thể\npublic sealed interface Payment permits CreditCardPayment, MomoPayment, BankTransferPayment {\n    BigDecimal getAmount();\n}\n\npublic final class CreditCardPayment implements Payment { ... }\npublic final class MomoPayment implements Payment { ... }\npublic final class BankTransferPayment implements Payment { ... }\n~~~\n\n## 2. Pattern Matching cho switch\n\nKhi kết hợp Sealed Classes với Switch Pattern Matching, Java compiler biết rõ tất cả các trường hợp có thể xảy ra (**Exhaustive Checking**), giúp bạn không bao giờ cần viết nhánh `default`:\n\n~~~java\npublic String processPayment(Payment payment) {\n    return switch (payment) {\n        case CreditCardPayment c when c.getAmount().compareTo(BigDecimal.valueOf(10000000)) > 0 ->\n            \"Giao dịch thẻ tín dụng giá trị lớn: \" + c.getCardNumber();\n        case CreditCardPayment c -> \"Thanh toán thẻ thường: \" + c.getAmount();\n        case MomoPayment m -> \"Thanh toán qua ví Momo: \" + m.getPhoneNumber();\n        case BankTransferPayment b -> \"Chuyển khoản ngân hàng: \" + b.getBankCode();\n    };\n}\n~~~\n\n:::tip Lợi ích kiến trúc\nNếu trong tương lai bạn thêm `VNPayPayment` vào `permits`, compiler sẽ báo lỗi đỏ ngay tại mọi lệnh `switch` trong toàn bộ dự án chưa xử lý case mới này. Điều này giúp loại bỏ 100% các lỗi bỏ quên case ở runtime!\n:::\n"
      },
      {
        "id": "java-0-4",
        "title": "Bài 0.4: Quản lý Bộ Nhớ JVM: Heap, Stack, Metaspace & GC",
        "minutes": 35,
        "type": "theory",
        "content": "# Bài 0.4: Quản lý Bộ Nhớ JVM: Heap, Stack, Metaspace & GC\n\nĐể viết code tối ưu hiệu năng và xử lý các sự cố Memory Leak, việc hiểu rõ kiến trúc bộ nhớ JVM là yêu cầu bắt buộc của mọi Senior Java Developer.\n\n## 1. Phân vùng bộ nhớ trong JVM\n\n```mermaid\ngraph TD\n    JVM[\"JVM Runtime Memory\"]\n    JVM --> Heap[\"Heap Memory (Shared)<br>- Young Gen (Eden, S0, S1)<br>- Old Generation (Tenured)\"]\n    JVM --> NonHeap[\"Non-Heap Memory<br>- Metaspace (Class Metadata)<br>- Code Cache (JIT Compiled)<br>- Thread Stacks (Per Thread)\"]\n    JVM --> OffHeap[\"Off-Heap / Native Memory<br>- Direct ByteBuffers (Netty)<br>- JNI Native Libraries\"]\n```\n\n- **Stack Memory**: Mỗi Thread sở hữu 1 Stack riêng. Chứa các biến nguyên thủy (`int`, `boolean`), con trỏ tham chiếu (`reference`), và Stack Frame của từng lời gọi hàm. Tự động giải phóng khi hàm kết thúc.\n- **Heap Memory**: Nơi chứa tất cả các **Đối tượng (Objects)** được tạo ra bởi từ khóa `new`. Được dọn dẹp bởi Garbage Collector.\n- **Metaspace**: Lưu trữ metadata của các Class và Method. Nằm ngoài Heap (Native OS memory), tự động mở rộng theo kích thước RAM của máy chủ.\n\n## 2. Các thế hệ Garbage Collector hiện đại\n\n1. **G1GC (Garbage-First GC)**: Mặc định từ Java 9. Chia heap thành hàng ngàn vùng nhỏ, ưu tiên dọn các vùng chứa nhiều rác nhất trước.\n2. **Generational ZGC (Java 21)**: Dọn rác với thời gian dừng thế giới (STW pause time) **dưới 1 millisecond**, độc lập với dung lượng Heap từ vài GB đến hàng TB!\n\n:::takeaways Ghi nhớ\n- Tham số cấu hình chuẩn: `-Xms` (Initial Heap), `-Xmx` (Max Heap), `-XX:+UseZGC -XX:+ZGenerational`.\n- Không bao giờ lưu trữ các object lớn trong `static collection` lâu dài mà không có cơ chế dọn dẹp, đó là nguyên nhân hàng đầu gây Heap Memory Leak.\n:::\n"
      },
      {
        "id": "java-0-quiz",
        "title": "Quiz Module 0: Java 21 & Modern Syntax",
        "minutes": 20,
        "type": "quiz",
        "questions": [
          {
            "level": "easy",
            "scenario": "Bạn muốn định nghĩa một đối tượng DTO gồm 3 trường bất biến id, name, email trong Java 21.",
            "q": "Cú pháp nào sau đây là chuẩn mực và ngắn gọn nhất?",
            "options": [
              "public class UserDTO { private Long id; ... } với Lombok @Data",
              "public record UserDTO(Long id, String name, String email) {}",
              "public struct UserDTO(Long id, String name, String email)",
              "public enum UserDTO { ID, NAME, EMAIL }"
            ],
            "answer": 1,
            "explain": "Record là tính năng chính thức từ Java 14/16 và chuẩn hóa trong Java 21, tự động sinh constructor, getters, equals, hashCode, toString chuẩn bất biến.",
            "why": [
              "Sai — Dùng class truyền thống với Lombok vẫn cần dependency ngoài và không tận dụng được Pattern Matching của Java 21.",
              "✓ Đúng — 'public record UserDTO(...)' là cú pháp chuẩn của Java hiện đại.",
              "Sai — Java không có từ khóa 'struct' như C/C#.",
              "Sai — Enum dùng cho tập hợp hằng số cố định, không phải DTO."
            ]
          },
          {
            "level": "medium",
            "scenario": "Một Sealed Interface 'Shape' được khai báo: 'public sealed interface Shape permits Circle, Rectangle {}'.",
            "q": "Các class Circle và Rectangle bắt buộc phải có modifier nào sau đây?",
            "options": [
              "Bắt buộc phải là private",
              "Phải là một trong ba loại: 'final', 'sealed', hoặc 'non-sealed'",
              "Bắt buộc phải là static abstract",
              "Không cần khai báo gì thêm"
            ],
            "answer": 1,
            "explain": "Subclass của Sealed Class phải chỉ định rõ tương lai kế thừa của nó: 'final' (khóa hẳn), 'sealed' (tiếp tục giới hạn con), hoặc 'non-sealed' (mở tự do cho bên ngoài kế thừa).",
            "why": [
              "Sai — Subclass không bắt buộc phải private.",
              "✓ Đúng — Quy tắc cú pháp nghiêm ngặt của Sealed Classes: phải là final, sealed, hoặc non-sealed.",
              "Sai — Không thể vừa static vừa abstract cho top-level class.",
              "Sai — Nếu không có 1 trong 3 từ khóa trên, compiler sẽ báo lỗi cú pháp ngay lập tức."
            ]
          },
          {
            "level": "medium",
            "scenario": "Java 21 giới thiệu interface SequencedCollection để chuẩn hóa thao tác với các danh sách có thứ tự.",
            "q": "Phương thức nào cho phép lấy một view đảo ngược thứ tự của List mà KHÔNG tốn chi phí copy toàn bộ mảng?",
            "options": [
              "Collections.reverse(list)",
              "list.reversed()",
              "list.reverseOrder()",
              "list.descendingList()"
            ],
            "answer": 1,
            "explain": "Phương thức 'list.reversed()' trả về một SequencedCollection đảo ngược dưới dạng view O(1) mà không cấp phát lại bộ nhớ hay mutate danh sách gốc.",
            "why": [
              "Sai — Collections.reverse(list) làm thay đổi trực tiếp (mutate) danh sách gốc.",
              "✓ Đúng — list.reversed() là phương thức mới của Java 21, an toàn và hiệu năng cao O(1).",
              "Sai — Không có method reverseOrder() trên List.",
              "Sai — descendingList() không phải method của SequencedCollection chuẩn."
            ]
          },
          {
            "level": "hard",
            "scenario": "Trong Compact Constructor của Record, lập trình viên muốn gán lại giá trị chuẩn hóa cho một trường.",
            "q": "Đoạn code nào sau đây là hợp lệ bên trong Compact Constructor?",
            "options": [
              "this.email = email.trim();",
              "email = email.trim();",
              "setField(\"email\", email);",
              "Không được phép sửa đổi giá trị tham số trong compact constructor"
            ],
            "answer": 1,
            "explain": "Trong compact constructor, bạn gán lại trực tiếp vào tên biến tham số 'email = email.trim();'. Compiler sẽ tự động lấy giá trị cuối cùng này gán vào field ngầm định.",
            "why": [
              "Sai — Trong compact constructor, gọi 'this.field = ...' sẽ bị compiler báo lỗi vì các field chưa được khởi tạo.",
              "✓ Đúng — Gán trực tiếp 'email = email.trim()' là cú pháp chuẩn của Compact Constructor.",
              "Sai — Không có method setField.",
              "Sai — Được phép sửa biến tham số để normalize trước khi commit vào final field."
            ]
          }
        ]
      }
    ]
  },
  {
    "id": 1,
    "title": "Lập Trình Hướng Đối Tượng (OOP) & 5 Nguyên Lý SOLID",
    "icon": "🏛️",
    "color": "#3b82f6",
    "desc": "4 Trụ cột OOP thực chiến, SOLID principles, phân tích code smells và refactoring.",
    "lessons": [
      {
        "id": "java-1-1",
        "title": "Bài 1.1: 4 Trụ Cột OOP & Tư Duy Thiết Kế Hướng Đối Tượng",
        "minutes": 30,
        "type": "theory",
        "content": "# Bài 1.1: 4 Trụ Cột OOP & Tư Duy Thiết Kế Hướng Đối Tượng\n\nLập trình hướng đối tượng (OOP) không chỉ là định nghĩa class và tạo object. Trong môi trường doanh nghiệp, OOP là nghệ thuật **đóng gói sự phức tạp** và **mô hình hóa nghiệp vụ** sao cho code dễ đọc, dễ kiểm thử và bền vững trước các thay đổi liên tục.\n\n## 1. Bốn trụ cột OOP qua lăng kính Clean Code\n\n1. **Đóng gói (Encapsulation)**:\n   - Ẩn giấu trạng thái nội tại của đối tượng, chỉ cho phép tương tác qua các public method có ý nghĩa nghiệp vụ (Tell, Don't Ask).\n   - *Bad*: `order.setStatus(\"PAID\"); order.setPaidAt(now);`\n   - *Clean*: `order.markAsPaid(paymentReceipt);`\n2. **Kế thừa (Inheritance)**:\n   - Tái sử dụng và mở rộng hành vi.\n   - *Quy tắc vàng*: Ưu tiên Composition (kết hợp) hơn Inheritance (Kế thừa).\n3. **Đa hình (Polymorphism)**:\n   - Cùng một thông điệp nhưng các đối tượng khác nhau có cách thực thi khác nhau. Cho phép cắm rút (pluggable) các implementation mà không sửa code gọi.\n4. **Trừu tượng (Abstraction)**:\n   - Loại bỏ các chi tiết kỹ thuật không cần thiết để tập trung vào bản chất hành vi thông qua Interface và Abstract Class.\n"
      },
      {
        "id": "java-1-2",
        "title": "Bài 1.2: Phân Tích 5 Nguyên Lý SOLID Thực Chiến",
        "minutes": 40,
        "type": "theory",
        "content": "# Bài 1.2: Phân Tích 5 Nguyên Lý SOLID Thực Chiến\n\nSOLID là 5 nguyên lý thiết kế kinh điển được đúc kết bởi Robert C. Martin (Uncle Bob), là thước đo chất lượng của mọi dự án Java chuyên nghiệp.\n\n```mermaid\nflowchart TD\n    S[\"S: Single Responsibility<br>Một class chỉ có 1 lý do duy nhất để thay đổi\"]\n    O[\"O: Open / Closed<br>Mở để mở rộng, đóng trước sửa đổi\"]\n    L[\"L: Liskov Substitution<br>Subclass phải thay thế được cha mà không phá vỡ logic\"]\n    I[\"I: Interface Segregation<br>Tách nhỏ interface, không ép implement method thừa\"]\n    D[\"D: Dependency Inversion<br>Phụ thuộc vào Interface trừu tượng, không phụ thuộc class cụ thể\"]\n```\n\n## 1. Single Responsibility Principle (SRP)\n- Mỗi class chỉ nên chịu trách nhiệm cho một khía cạnh nghiệp vụ duy nhất.\n- Đừng biến `UserService` thành một God Object chứa cả đăng ký, mã hóa mật khẩu, gửi email, xuất PDF và log kiểm toán. Hãy tách thành: `UserRegistrationService`, `EmailNotificationService`, `UserReportGenerator`.\n\n## 2. Open/Closed Principle (OCP)\n- Mở rộng tính năng bằng cách thêm class mới, không sửa đổi code đã chạy ổn định trong production.\n- Thay vì dùng chuỗi `if-else` dài hàng chục dòng để kiểm tra loại thanh toán, hãy dùng Polymorphism hoặc Strategy Pattern.\n\n## 3. Liskov Substitution Principle (LSP)\n- Bất kỳ class con nào cũng phải có khả năng thay thế hoàn hảo cho class cha mà không làm thay đổi tính đúng đắn của chương trình (Ví dụ kinh điển: `Square` không nên kế thừa `Rectangle`).\n"
      },
      {
        "id": "java-1-3",
        "title": "Bài 1.3: Nhận Diện & Khắc Phục Code Smells",
        "minutes": 35,
        "type": "practice",
        "content": "# Bài 1.3: Nhận Diện & Khắc Phục Code Smells\n\nCode Smell là những dấu hiệu cảnh báo mã nguồn đang xuống cấp và tiềm ẩn lỗi nghiêm trọng.\n\n## 1. Các Code Smells phổ biến nhất\n1. **God Class / Large Class**: Class dài hàng nghìn dòng, làm quá nhiều việc. Khắc phục: Phân rã theo SRP.\n2. **Long Method**: Method dài hơn 30 dòng với nhiều tầng lồng nhau (nested if). Khắc phục: Extract Method và Early Return (Bouncer Pattern).\n3. **Primitive Obsession**: Sử dụng các kiểu dữ liệu nguyên thủy (`String`, `Long`) cho mọi thứ thay vì tạo Value Object (ví dụ: dùng `String` cho số điện thoại, email, tiền tệ).\n4. **Feature Envy**: Method trong Class A liên tục gọi các getter của Class B để tính toán. Dấu hiệu này cho thấy logic nên được chuyển về Class B!\n\n:::tip Quy tắc Bouncer Pattern (Early Return)\nThay vì viết if-else lồng nhau 4-5 tầng, hãy kiểm tra điều kiện lỗi trước và `return` hoặc `throw exception` ngay đầu hàm. Code của bạn sẽ phẳng và cực kỳ dễ đọc.\n:::\n"
      },
      {
        "id": "java-1-quiz",
        "title": "Quiz Module 1: OOP & SOLID Principles",
        "minutes": 20,
        "type": "quiz",
        "questions": [
          {
            "level": "medium",
            "scenario": "Một lập trình viên thiết kế class Square kế thừa từ Rectangle. Khi thay đổi chiều rộng width, hàm setWidth tự động gán luôn chiều cao height bằng width.",
            "q": "Thiết kế này vi phạm nguyên lý SOLID nào nghiêm trọng nhất?",
            "options": [
              "Single Responsibility Principle (SRP)",
              "Liskov Substitution Principle (LSP)",
              "Open/Closed Principle (OCP)",
              "Interface Segregation Principle (ISP)"
            ],
            "answer": 1,
            "explain": "Vi phạm LSP: Code client kỳ vọng khi gọi setWidth trên Rectangle thì chiều cao height không đổi. Với Square, height bị đổi theo, làm sai lệch hành vi của class cha.",
            "why": [
              "Sai — SRP liên quan đến lý do thay đổi.",
              "✓ Đúng — Bài toán Hình vuông / Hình chữ nhật là ví dụ kinh điển vi phạm nguyên lý Liskov Substitution Principle (LSP).",
              "Sai — OCP liên quan đến mở rộng code.",
              "Sai — ISP liên quan đến việc chia nhỏ interface."
            ]
          },
          {
            "level": "easy",
            "scenario": "Một Service phụ thuộc trực tiếp vào 'MySQLDatabaseConnection' thay vì phụ thuộc vào interface 'DatabaseConnection'.",
            "q": "Nguyên lý nào trong SOLID bị vi phạm?",
            "options": [
              "Dependency Inversion Principle (DIP)",
              "Single Responsibility Principle (SRP)",
              "Liskov Substitution Principle (LSP)",
              "Interface Segregation Principle (ISP)"
            ],
            "answer": 0,
            "explain": "DIP yêu cầu các module cấp cao không được phụ thuộc vào module cấp thấp; cả hai phải phụ thuộc vào abstraction (Interface).",
            "why": [
              "✓ Đúng — Phụ thuộc vào implementation cụ thể (MySQL) thay vì interface trừu tượng là vi phạm DIP.",
              "Sai — Không liên quan đến SRP.",
              "Sai — Không liên quan đến LSP.",
              "Sai — Không liên quan đến ISP."
            ]
          }
        ]
      }
    ]
  },
  {
    "id": 2,
    "title": "Bộ Sưu Tập Java (Collections) & Stream API Chuyên Sâu",
    "icon": "📦",
    "color": "#10b981",
    "desc": "List, Set, Map hashing collision, Stream pipeline, Collectors.groupingBy & Functional programming.",
    "lessons": [
      {
        "id": "java-2-1",
        "title": "Bài 2.1: Bộ Sưu Tập Java: List, Set, Map & Cơ Chế Hashing",
        "minutes": 35,
        "type": "theory",
        "content": "# Bài 2.1: Bộ Sưu Tập Java: List, Set, Map & Cơ Chế Hashing\n\n## 1. Phân loại cấu trúc dữ liệu chính trong Java\n\n- **List (ArrayList vs LinkedList)**:\n  - `ArrayList`: Mảng động liên tục trong bộ nhớ, truy cập theo index O(1), tối ưu CPU Cache L1/L2. Hầu như luôn là lựa chọn số 1.\n  - `LinkedList`: Danh sách liên kết đôi, tốn bộ nhớ cho node con trỏ, cache locality kém. Rất hiếm khi dùng trong thực tế.\n- **Set (HashSet vs TreeSet)**:\n  - `HashSet`: Đảm bảo phần tử duy nhất dựa trên `hashCode()` và `equals()`, tìm kiếm O(1).\n  - `TreeSet`: Sắp xếp phần tử tự nhiên dựa trên Red-Black Tree, tìm kiếm O(log N).\n- **Map (HashMap vs ConcurrentHashMap)**:\n  - `HashMap`: Cấu trúc mảng bucket + Node liên kết. Khi số phần tử trong 1 bucket vượt quá 8 (TREEIFY_THRESHOLD), bucket tự động chuyển thành Red-Black Tree để tránh suy biến O(N) xuống O(log N).\n\n```mermaid\ngraph TD\n    Map[\"Map Interface\"]\n    Map --> HM[\"HashMap (Non-thread-safe)\"]\n    Map --> CHM[\"ConcurrentHashMap (Thread-safe, Segment Lock)\"]\n    Map --> TM[\"TreeMap (Sorted by Key, Red-Black Tree)\"]\n```\n"
      },
      {
        "id": "java-2-2",
        "title": "Bài 2.2: Stream API Chuyên Sâu & Custom Collectors",
        "minutes": 40,
        "type": "practice",
        "content": "# Bài 2.2: Stream API Chuyên Sâu & Custom Collectors\n\nStream API cung cấp phong cách lập trình khai báo (Declarative / Functional) giúp xử lý tập hợp dữ liệu thanh lịch và trực quan.\n\n## 1. Phân biệt Intermediate và Terminal Operations\n- **Intermediate Operations (Lazy)**: `filter()`, `map()`, `flatMap()`, `distinct()`, `sorted()`. Chỉ được kích hoạt khi có Terminal operation.\n- **Terminal Operations (Eager)**: `collect()`, `forEach()`, `reduce()`, `count()`, `toList()`. Kích hoạt luồng chạy và đóng Stream.\n\n## 2. Gom nhóm dữ liệu phức tạp với Collectors.groupingBy\n\n~~~java\n// Nhóm danh sách đơn hàng theo trạng thái và tính tổng tiền của mỗi trạng thái\nMap<OrderStatus, BigDecimal> totalByStatus = orders.stream()\n    .collect(Collectors.groupingBy(\n        Order::getStatus,\n        Collectors.reducing(\n            BigDecimal.ZERO,\n            Order::getTotalAmount,\n            BigDecimal::add\n        )\n    ));\n~~~\n"
      },
      {
        "id": "java-2-quiz",
        "title": "Quiz Module 2: Collections & Stream API",
        "minutes": 20,
        "type": "quiz",
        "questions": [
          {
            "level": "medium",
            "scenario": "Bạn ghi đè phương thức equals() trong class User nhưng QUÊN không ghi đè phương thức hashCode().",
            "q": "Hậu quả nghiêm trọng gì sẽ xảy ra khi đưa User vào HashSet hoặc làm Key trong HashMap?",
            "options": [
              "Compiler báo lỗi không cho build",
              "Hai đối tượng bằng nhau (equals == true) có thể sinh ra 2 hash code khác nhau, dẫn đến HashSet cho phép lưu 2 phần tử trùng lặp và HashMap.get() trả về null",
              "Chương trình tự động sinh ra mã hash ngẫu nhiên giống nhau",
              "Ném ra UnsupportedOperationException"
            ],
            "answer": 1,
            "explain": "Quy ước vàng (Contract) của Java: Nếu a.equals(b) là true thì bắt buộc a.hashCode() PHẢI bằng b.hashCode(). Vi phạm điều này sẽ phá vỡ hoàn toàn HashMap/HashSet.",
            "why": [
              "Sai — Compiler không bắt buộc ghi đè hashCode.",
              "✓ Đúng — Đây là lỗi kinh điển: không tìm thấy object trong Map dù nội dung giống hệt nhau.",
              "Sai — Hash mặc định của Object dựa trên địa chỉ bộ nhớ nên sẽ khác nhau.",
              "Sai — Không có exception nào được ném ra."
            ]
          }
        ]
      }
    ]
  },
  {
    "id": 3,
    "title": "Đa Luồng (Concurrency), Virtual Threads & Design Patterns",
    "icon": "⚡",
    "color": "#8b5cf6",
    "desc": "Project Loom, Virtual Threads, Thread Safety, ReentrantLock và GoF Design Patterns thực chiến.",
    "lessons": [
      {
        "id": "java-3-1",
        "title": "Bài 3.1: Đa Luồng, Race Conditions & Virtual Threads (Project Loom)",
        "minutes": 40,
        "type": "theory",
        "content": "# Bài 3.1: Đa Luồng, Race Conditions & Virtual Threads (Project Loom)\n\n## 1. Platform Threads vs Virtual Threads\n\nTrước Java 21, mỗi Java Thread ánh xạ 1-1 với một OS Kernel Thread (Platform Thread). Mỗi thread tốn khoảng 1MB bộ nhớ cho stack và chi phí chuyển đổi ngữ cảnh (Context Switching) đắt đỏ, giới hạn hệ thống chỉ tạo được vài nghìn thread.\n\n**Virtual Threads (Java 21)** là các luồng do JVM quản lý trực tiếp:\n- Dung lượng siêu nhẹ: chỉ chiếm vài KB bộ nhớ.\n- Tạo được hàng triệu luồng đồng thời.\n- Tự động unmount khỏi OS Thread khi bị block I/O (Database query, HTTP call), giải phóng Carrier Thread cho tác vụ khác.\n\n```mermaid\nsequenceDiagram\n    participant VT as Virtual Thread\n    participant CT as Carrier OS Thread\n    participant DB as Database Socket\n    VT->>CT: Chạy tác vụ tính toán\n    VT->>DB: Gọi câu query I/O (Block)\n    Note over VT,CT: Virtual Thread UNMOUNT giải phóng Carrier Thread\n    DB-->>VT: Dữ liệu DB phản hồi\n    Note over VT,CT: Virtual Thread MOUNT lại vào Carrier Thread khác\n    VT->>CT: Tiếp tục xử lý kết quả\n```\n\n## 2. Kích hoạt Virtual Threads trong Java 21\n\n~~~java\ntry (var executor = Executors.newVirtualThreadPerTaskExecutor()) {\n    IntStream.range(0, 10_000).forEach(i -> {\n        executor.submit(() -> {\n            Thread.sleep(1000); // Giả lập I/O 1 giây\n            return i;\n        });\n    });\n} // Tự động đóng và đợi toàn bộ 10.000 tác vụ hoàn thành chỉ trong hơn 1 giây!\n~~~\n"
      },
      {
        "id": "java-3-2",
        "title": "Bài 3.2: Bộ Tứ Design Patterns Gang of Four (GoF) Thực Chiến",
        "minutes": 40,
        "type": "practice",
        "content": "# Bài 3.2: Bộ Tứ Design Patterns Gang of Four (GoF) Thực Chiến\n\nDesign Patterns là các mẫu thiết kế đã được chứng minh qua thời gian giúp giải quyết các bài toán kiến trúc lặp đi lặp lại.\n\n## 1. Singleton Pattern (Thread-safe Initialization on Demand)\nCách tạo Singleton chuẩn nhất trong Java hiện đại là dùng static inner class (Holder idiom) hoặc Enum:\n\n~~~java\npublic class ConfigurationManager {\n    private ConfigurationManager() {}\n    \n    private static class Holder {\n        private static final ConfigurationManager INSTANCE = new ConfigurationManager();\n    }\n    \n    public static ConfigurationManager getInstance() {\n        return Holder.INSTANCE;\n    }\n}\n~~~\n\n## 2. Strategy Pattern\nThay thế các khối `switch-case` hoặc `if-else` khổng lồ bằng cách đóng gói các thuật toán vào các class độc lập có cùng interface:\n\n~~~java\npublic interface DiscountStrategy {\n    BigDecimal applyDiscount(BigDecimal amount);\n}\n\npublic class VipDiscountStrategy implements DiscountStrategy { ... }\npublic class BlackFridayDiscountStrategy implements DiscountStrategy { ... }\n~~~\n"
      },
      {
        "id": "java-3-quiz",
        "title": "Quiz Module 3: Concurrency & Design Patterns",
        "minutes": 20,
        "type": "quiz",
        "questions": [
          {
            "level": "hard",
            "scenario": "Một Virtual Thread trong Java 21 đang chạy thì gặp một khối synchronized bao quanh lời gọi HTTP client tốn 2 giây.",
            "q": "Hiện tượng kỹ thuật gì xảy ra?",
            "options": [
              "Virtual Thread unmount bình thường",
              "Thread Pinning: Virtual Thread bị ghim chặt vào Carrier OS Thread, khiến OS Thread bên dưới bị block theo suốt 2 giây",
              "JVM ném IllegalStateException",
              "Khối synchronized tự động bị hủy bỏ"
            ],
            "answer": 1,
            "explain": "Trong Java 21, khi Virtual Thread gặp 'synchronized' hoặc native method call trong lúc block I/O, nó bị 'pinned' vào carrier thread. Giải pháp chuẩn là thay thế bằng ReentrantLock.",
            "why": [
              "Sai — synchronized cản trở cơ chế unmount của Project Loom trong Java 21.",
              "✓ Đúng — Thread Pinning làm giảm throughput và có thể gây cạn kiệt Carrier Thread pool.",
              "Sai — Không có exception nào được ném ra.",
              "Sai — Khối synchronized vẫn hoạt động bảo vệ mutual exclusion."
            ]
          }
        ]
      }
    ]
  }
]
  };
})();
