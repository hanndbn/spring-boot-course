/* =========================================================================
   DevMastery — Java 21 Foundation: Core Language, Memory & Clean OOP
   Standardized to CES-2026 v2.5 (Golden 6-Part Hierarchy)
   Domain: E-Commerce Console Order Management Engine
   ========================================================================= */
(function() {
  "use strict";

  window.EXTRA_COURSES = window.EXTRA_COURSES || {};

  window.EXTRA_COURSES["java-foundation"] = {
  "id": "java-foundation",
  "trackId": "java-track",
  "title": "Java 21 Foundation — Core Language, Memory & Clean OOP",
  "shortTitle": "Java 21 Foundation",
  "icon": "☕",
  "badge": "Foundation Level",
  "category": "backend",
  "level": "foundation",
  "hours": "~12h",
  "modulesCount": 4,
  "lessonsCount": 16,
  "quizCount": 16,
  "certificateTitle": "DevMastery Verified — Java 21 Foundation",
  "instructor": "DevMastery Java Architecture Council",
  "bestseller": true,
  "themeGradient": "linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)",
  "desc": "Làm chủ nền tảng ngôn ngữ Java 21 LTS: Bản chất bộ nhớ Stack vs Heap, Pass-by-value, thiết kế hướng đối tượng sạch chuẩn SOLID, Java Collections Framework và Unit Testing JUnit 5.",
  "outcomes": [
    "Nắm chắc bản chất bộ nhớ Stack, Heap, Metaspace và vòng đời Object",
    "Thiết kế class hướng đối tượng chuẩn mực theo 5 nguyên lý SOLID",
    "Làm chủ cấu trúc dữ liệu Java Collections: HashMap, ArrayList, Red-Black Tree",
    "Hoàn thành đồ án Console E-Commerce Order Manager có test JUnit 5 đạt 85% coverage"
  ],
  "prerequisites": [
    "Tư duy logic lập trình căn bản"
  ],
  "stackVersion": {
    "java": "21 LTS",
    "buildTool": "Maven 3.9+",
    "test": "JUnit 5.10+",
    "lastReviewedDate": "2026-10-04",
    "maintainer": "DevMastery Java Architecture Council"
  },
  "tags": [
    "Java 21",
    "OOP",
    "SOLID",
    "Collections",
    "HashMap",
    "JUnit 5",
    "Clean Code"
  ],
  "isAvailable": true,
  "modules": [
    {
      "id": 101,
      "title": "Cú Pháp Hiện Đại, Hệ Thống Kiểu & Bản Chất Bộ Nhớ",
      "icon": "☕",
      "color": "#b45309",
      "desc": "Bytecode, ClassLoader, Primitive vs Reference, Stack/Heap và String Pool.",
      "lessons": [
        {
          "id": "j0-1-1",
          "type": "theory",
          "title": "Bài 1.1: Cấu Trúc Thực Thi Java 21: Javac, Bytecode, ClassLoader & JVM",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải mã hành trình của một file nguồn Java: Từ mã nguồn .java -> Bytecode .class -> Máy ảo JVM.\n- Phân biệt rõ vai trò của JDK, JRE, JVM và bộ thực thi JIT Compiler (Just-In-Time).\n- Nắm vững 3 giai đoạn của ClassLoader: Loading, Linking và Initialization.\n- Chạy trực tiếp chương trình Java 21 chỉ với 1 lệnh đơn ('java Main.java').\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỪ BẢN THIẾT KẾ ĐẾN CÔNG TRƯỜNG THỰC TẾ\n- **File .java**: Giống như bản vẽ kiến trúc viết bằng tiếng người (Java code).\n- **javac compiler**: Là người dịch thuật chuyển bản vẽ thành bảng mã tiêu chuẩn quốc tế (Bytecode trong file .class).\n- **JVM (Java Virtual Machine)**: Là robot thợ xây đa năng. Dù đặt robot ở Windows, Linux hay macOS, robot đều đọc bảng mã bytecode và xây ra tòa nhà chạy mượt mà giống hệt nhau (\"Write Once, Run Anywhere\").\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Thực Thi Mã Nguồn Trong JVM)\n\n```mermaid\nflowchart LR\n    Source[\"Mã nguồn Java<br/>(OrderService.java)\"] -->|\"javac compiler\"| Bytecode[\"Bytecode di động<br/>(OrderService.class)\"]\n    \n    subgraph JVM [\"Máy Ảo Java (Java Virtual Machine)\"]\n        CL[\"ClassLoader Subsystem<br/>(Bootstrap, Platform, App)\"]\n        RTD[\"Runtime Data Areas<br/>(Method Area, Heap, Stack)\"]\n        EE[\"Execution Engine<br/>(Interpreter + JIT Compiler C1/C2)\"]\n        CL --> RTD --> EE\n    end\n\n    Bytecode --> CL\n    EE --> OS[\"Hệ Điều Hành & Phần Cứng<br/>(CPU x86/ARM, RAM, Linux/Win)\"]\n    style JVM fill:#1e3a8a,stroke:#3b82f6,color:#fff\n    style Bytecode fill:#064e3b,stroke:#10b981,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Các Thành Phần Trong Hệ Sinh Thái Java)\n\n| Thành phần | Viết tắt | Bao gồm những gì? | Dùng khi nào? |\n|---|---|---|---|\n| **Java Virtual Machine** | **JVM** | Trình thông dịch (Interpreter) + JIT + Garbage Collector | Môi trường trừu tượng hóa phần cứng để chạy Bytecode |\n| **Java Runtime Environment** | **JRE** | JVM + Thư viện cốt lõi (`java.base`, `rt.jar`) | Chỉ dùng để chạy ứng dụng (Đã bỏ từ Java 11) |\n| **Java Development Kit** | **JDK** | JRE + Bộ công cụ phát triển (`javac`, `jdb`, `jstack`, `jcmd`) | Bắt buộc cho lập trình viên để biên dịch và debug |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Chương Trình Java 21 Đầu Tiên)\n\nChạy chương trình tính toán tổng đơn hàng E-Commerce bằng tính năng Java 21 Single-File Source Code:\n\n```java\npackage vn.mastery.ecommerce;\n\npublic class OrderCalculationApp {\n\n    // Record DTO bất biến chuẩn Java 21\n    public record OrderItem(String sku, long priceCents, int quantity) {\n        public long subtotal() {\n            return priceCents * quantity;\n        }\n    }\n\n    public static void main(String[] args) {\n        OrderItem item1 = new OrderItem(\"IPHONE-15\", 25_000_000L, 2);\n        OrderItem item2 = new OrderItem(\"AIRPODS-PRO\", 5_500_000L, 1);\n\n        long grandTotal = item1.subtotal() + item2.subtotal();\n        System.out.println(\"Tổng giá trị đơn hàng: \" + grandTotal + \" VND\");\n    }\n}\n```\n\n### Bảng Phân Tích Kỹ Thuật Từng Dòng Code:\n\n| Khối mã nguồn | Bản chất hoạt động ngầm | Lợi ích trong Enterprise |\n|---|---|---|\n| `public record OrderItem(...)` | Compiler sinh ngầm class final, constructor, getters, `equals()`, `hashCode()` | Giảm 90% boilerplate code so với Java 8 |\n| `25_000_000L` | Dấu gạch dưới (Numeric Underscores) và hậu tố `L` cho kiểu `long` | Chống nhầm lẫn số 0 trong các giao dịch tiền tệ lớn |\n| `item.subtotal()` | Lời gọi phương thức instance trên đối tượng bất biến | Đảm bảo tính đóng gói (Encapsulation) |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Nhầm lẫn giữa Compile-time và Runtime\n- **Vấn đề**: Compiler `javac` chỉ kiểm tra tính hợp lệ về mặt cú pháp và kiểu dữ liệu tĩnh. Các lỗi như `NullPointerException` hoặc `OutOfMemoryError` chỉ bùng phát ở Runtime trên JVM.\n- **Giải pháp**: Luôn kết hợp kiểm tra tĩnh bằng SonarQube/SpotBugs và viết Unit Test JUnit 5 cho toàn bộ các nhánh logic.\n\n### Checklist Bài 1.1\n- [ ] Cài đặt OpenJDK 21 LTS (Temurin hoặc Amazon Corretto) trên máy trạm.\n- [ ] Kiểm tra phiên bản bằng lệnh `java -version` và `javac -version`.\n- [ ] Hiểu rõ sự khác biệt giữa file `.java` và bytecode `.class`.\n- [ ] Thực thi thử một file Java duy nhất bằng `java OrderCalculationApp.java`.\n"
        },
        {
          "id": "j0-1-2",
          "type": "practice",
          "title": "Bài 1.2: Primitive Types vs Reference Types & Cạm Bẫy Tràn Số (Integer Overflow)",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Phân biệt rõ 8 kiểu dữ liệu nguyên thủy (Primitive Types) và Kiểu tham chiếu (Reference Types).\n- Nắm bắt chi phí bộ nhớ ẩn của Wrapper Classes (`Integer`, `Long`) do hiện tượng Autoboxing.\n- Nhận diện và phòng chống thảm họa tràn số (Integer Overflow) trong hệ thống tính tiền thương mại điện tử.\n- Sử dụng `Math.addExact()` và `BigDecimal` để bảo vệ số dư tài khoản.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CHIẾC HỘP ĐỰNG VÀNG VÀ TỜ GIẤY GHI ĐỊA CHỈ\n- **Primitive (Nguyên thủy như int, double)**: Giống như bạn cầm trực tiếp thỏi vàng trên tay. Nhanh, nhẹ, không mất công tìm kiếm.\n- **Reference (Tham chiếu như Integer, String)**: Giống như bạn cầm một chiếc phong bì bên trong ghi *\"Thỏi vàng đang nằm ở két sắt số 99\"*. Bạn phải mất thêm một bước đi tới két sắt (Truy cập bộ nhớ Heap) mới lấy được vàng!\n- **Tràn số (Overflow)**: Giống như đồng hồ công tơ mét xe máy chỉ có 5 chữ số. Khi vượt qua 99,999 km, nó tự động lộn ngược về số 0!\n:::\n\n---\n\n## 1. Cái này là gì? (Bản Chất Bộ Nhớ Primitive vs Wrapper Object)\n\n```mermaid\nflowchart TD\n    subgraph STACK_FRAME [\"Thread Stack Frame\"]\n        P[\"int primitiveValue = 42<br/>(4 bytes trực tiếp trên Stack)\"]\n        R[\"Integer refValue = 0x88FFAA<br/>(8 bytes con trỏ tham chiếu)\"]\n    end\n\n    subgraph HEAP_MEMORY [\"JVM Heap Memory\"]\n        OBJ[\"Integer Object (0x88FFAA)<br/>• Mark Word: 8 bytes<br/>• Klass Word: 4 bytes (Compressed OOP)<br/>• int value: 4 bytes<br/>➔ TỔNG CỘNG: 16 BYTES!\"]\n    end\n\n    R -->|\"Trỏ tới địa chỉ Heap\"| OBJ\n    style STACK_FRAME fill:#1e3a8a,stroke:#3b82f6,color:#fff\n    style HEAP_MEMORY fill:#7f1d1d,stroke:#ef4444,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Kiểu Nguyên Thủy & Wrapper)\n\n| Tiêu chí | Kiểu Nguyên Thủy (`int`, `long`) | Kiểu Wrapper (`Integer`, `Long`) | Khuyến nghị sử dụng |\n|---|---|---|---|\n| **Bộ nhớ chiếm dụng** | 4 bytes (`int`), 8 bytes (`long`) | 16 bytes (`Integer`), 24 bytes (`Long`) | Ưu tiên `primitive` cho thuật toán và mảng lớn |\n| **Giá trị khởi tạo** | Mặc định là `0` hoặc `0.0` | Mặc định là `null` | Bắt buộc dùng Wrapper cho Entity ID (đại diện null) |\n| **Generics & Collection** | Không hỗ trợ (`List<int>` ❌) | Bắt buộc dùng (`List<Integer>` ✅) | Dùng Wrapper khi làm việc với Collection |\n| **Độ trễ truy xuất CPU** | Cực nhanh (nằm trong CPU L1/L2 Cache) | Chậm hơn (phát sinh Cache Miss do nhảy Heap) | Dùng `primitive` trong các vòng lặp tính toán triệu bản ghi |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Phòng Chống Tràn Số Khi Thanh Toán)\n\nMã nguồn phòng chống Integer Overflow trong tính toán giao dịch:\n\n```java\npackage vn.mastery.ecommerce;\n\npublic class SafePaymentCalculator {\n\n    // ❌ CÁCH NGUY HIỂM: Tràn số âm thầm\n    public static int unsafeCalculateTotal(int price, int quantity) {\n        return price * quantity; // Nếu price = 1_000_000_000 và quantity = 3 -> Trả về số âm!\n    }\n\n    // ✅ CHUẨN SENIOR: Phát hiện tràn số ngay lập tức\n    public static long safeCalculateTotal(long priceCents, long quantity) {\n        try {\n            // Ném ArithmeticException nếu vượt ngưỡng Long.MAX_VALUE\n            return Math.multiplyExact(priceCents, quantity);\n        } catch (ArithmeticException ex) {\n            throw new IllegalArgumentException(\"Giao dịch vượt quá giá trị thanh toán tối đa cho phép!\", ex);\n        }\n    }\n}\n```\n\n### Bảng Phân Tích Logic Chống Tràn Số:\n\n| Dòng lệnh | Cơ chế ngầm định | Hậu quả nếu không áp dụng |\n|---|---|---|\n| `price * quantity` | Phép nhân 32-bit CPU thông thường; bit dấu bị lật nếu vượt `2^31 - 1` | Khách mua hàng 3 tỷ bị tính tiền thành -1.2 tỷ VND! |\n| `Math.multiplyExact(...)` | Kiểm tra cờ tràn số (Overflow Flag) của thanh ghi CPU x86/ARM | Báo lỗi ngay lập tức, bảo vệ tuyệt đối số dư tài chính |\n| `long priceCents` | Lưu trữ tiền dưới dạng đơn vị nhỏ nhất (xu/cents) kiểu `long` (64-bit) | Tránh sai số dấu phẩy động của `double` và tràn số của `int` |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Dùng `double` hoặc `float` để tính tiền tệ\n- **Vấn đề**: Chuẩn IEEE 754 của số thực dấu phẩy động khiến phép tính `0.1 + 0.2` ra kết quả `0.30000000000000004`. Sau 1 triệu đơn hàng, số tiền kế toán bị lệch hàng trăm triệu đồng!\n- **Giải pháp**: Luôn lưu tiền tệ bằng kiểu `long` (đơn vị cents) hoặc dùng `BigDecimal` cho các phép chia tỷ giá ngoại tệ.\n\n### Checklist Bài 1.2\n- [ ] Không bao giờ dùng `double`/`float` cho bất kỳ nghiệp vụ tính tiền tệ nào.\n- [ ] Dùng `Math.addExact()` và `Math.multiplyExact()` khi tính toán tổng số tiền lớn.\n- [ ] Hạn chế tối đa Autoboxing trong các vòng lặp xử lý hàng triệu phần tử.\n"
        },
        {
          "id": "j0-1-3",
          "type": "theory",
          "title": "Bài 1.3: Bản Chất Bộ Nhớ Stack, Heap, Metaspace & Truyền Tham Trị (Pass-by-Value)",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải phẫu phân vùng bộ nhớ của JVM: Thread Stack, Shared Heap và Native Metaspace.\n- Khẳng định và chứng minh: **Java 100% là Pass-by-Value** (Không có Pass-by-Reference).\n- Hiểu rõ cơ chế biến tham chiếu (Reference Variable) trỏ tới ô nhớ trên Heap.\n- Phân tích rò rỉ bộ nhớ (Memory Leak) ngay cả khi có Garbage Collector.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẤM BẢN ĐỒ VÀ KHO HÀNG\n- **Heap Memory**: Giống như kho chứa hàng khổng lồ của cả công ty (Shared Memory). Bất kỳ ai có chìa khóa đều có thể vào kho xem hàng.\n- **Thread Stack**: Giống như cuốn sổ tay bỏ túi của từng nhân viên giao hàng (Private Memory). Khi nhân viên giao xong 1 đơn hàng (hàm kết thúc), trang sổ tay bị xé bỏ ngay lập tức!\n- **Pass-by-Value**: Khi bạn nhờ đồng nghiệp sửa hàng, bạn **photocopy địa chỉ kho hàng** đưa cho họ. Nếu họ dùng địa chỉ đó vào kho sơn lại màu món hàng, món hàng bị đổi màu. Nhưng nếu họ lấy bút xóa sửa địa chỉ trên tờ giấy photocopy của họ, kho hàng ban đầu của bạn hoàn toàn không bị ảnh hưởng!\n:::\n\n---\n\n## 1. Cái này là gì? (Bản Đồ Bộ Nhớ Java Runtime Memory)\n\n```mermaid\nflowchart TD\n    subgraph STACK [\"Thread Stack (Mỗi Thread một Stack riêng)\"]\n        Frame1[\"main() Stack Frame<br/>- int discount = 10<br/>- Order ref = 0x55AA (Địa chỉ Heap)\"]\n        Frame2[\"applyDiscount(Order o, int d)<br/>- int d = 10 (Bản sao giá trị)<br/>- Order o = 0x55AA (Bản sao con trỏ)\"]\n    end\n\n    subgraph HEAP [\"JVM Heap (Bộ nhớ chung cho toàn ứng dụng)\"]\n        OrderObj[\"Order Object (Địa chỉ: 0x55AA)<br/>• id: 1001L<br/>• totalAmount: 500,000L\"]\n    end\n\n    Frame1 -.-> OrderObj\n    Frame2 --> OrderObj\n    style STACK fill:#1e3a8a,stroke:#3b82f6,color:#fff\n    style HEAP fill:#064e3b,stroke:#10b981,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Stack vs Heap Memory)\n\n| Tiêu chí | Thread Stack | JVM Heap Memory |\n|---|---|---|\n| **Phạm vi truy cập** | Cục bộ trong 1 Thread duy nhất (Thread-safe tuyệt đối) | Dùng chung toàn ứng dụng (Cần đồng bộ Thread-safe) |\n| **Vòng đời tồn tại** | Tồn tại theo thời gian thực thi của hàm (LIFO) | Tồn tại cho đến khi không còn ai trỏ tới và bị GC dọn |\n| **Tốc độ cấp phát** | Siêu nhanh (Chỉ dịch chuyển thanh ghi Stack Pointer) | Chậm hơn (Cần tìm block nhớ trống và cấp phát qua TLAB) |\n| **Sự cố lỗi bộ nhớ** | `java.lang.StackOverflowError` (Đệ quy vô tận) | `java.lang.OutOfMemoryError: Java heap space` |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Chứng Minh Pass-by-Value)\n\n```java\npackage vn.mastery.ecommerce;\n\npublic class PassByValueProof {\n\n    public static class Order {\n        public long amount;\n        public Order(long amount) { this.amount = amount; }\n    }\n\n    public static void modifyOrder(Order o) {\n        o.amount = 999_000L; // Sửa thuộc tính bên trong Heap Object -> CẢ HAI BÊN ĐỀU THẤY\n        o = new Order(111_000L); // Gán biến tham chiếu cục bộ sang Object mới -> BÊN NGOÀI KHÔNG ẢNH HƯỞNG!\n    }\n\n    public static void main(String[] args) {\n        Order myOrder = new Order(500_000L);\n        modifyOrder(myOrder);\n        \n        System.out.println(\"Giá trị đơn hàng: \" + myOrder.amount); \n        // In ra 999,000 (Không phải 111,000!) -> Chứng minh Java chỉ copy giá trị con trỏ!\n    }\n}\n```\n\n### Bảng Bóc Tách Bản Chất Pass-by-Value:\n\n| Thao tác mã nguồn | Trạng thái vùng nhớ Stack | Trạng thái vùng nhớ Heap |\n|---|---|---|\n| `modifyOrder(myOrder)` | Tạo biến `o` trong Stack frame mới, copy giá trị con trỏ `0x55AA` | Không tạo object mới, cả 2 biến cùng trỏ tới 1 ô nhớ |\n| `o.amount = 999_000L` | Con trỏ `o` không đổi | Giá trị field `amount` của object tại `0x55AA` bị thay đổi |\n| `o = new Order(111_000L)` | Biến `o` bị gán trỏ sang địa chỉ mới `0x99BB` | Object ban đầu tại `0x55AA` hoàn toàn không bị ảnh hưởng |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Tưởng rằng gán tham số = null trong hàm sẽ xóa được Object\n- **Vấn đề**: Viết `public void clear(Order o) { o = null; }` rồi tưởng rằng đối tượng ngoài `main` đã bị giải phóng. Thực tế biến `myOrder` ngoài main vẫn giữ nguyên tham chiếu tới object.\n- **Giải pháp**: Để dọn dẹp, phải gán chính biến tham chiếu ở scope cha hoặc gọi method hủy dữ liệu rõ ràng.\n\n### Checklist Bài 1.3\n- [ ] Ghi nhớ quy tắc vàng: **Java luôn luôn truyền tham trị (Pass-by-value)**.\n- [ ] Hiểu rõ biến tham chiếu chỉ lưu con trỏ (Memory Address), không lưu object.\n- [ ] Kiểm soát độ sâu của các hàm đệ quy để chống `StackOverflowError`.\n"
        },
        {
          "id": "j0-1-4",
          "type": "practice",
          "title": "Bài 1.4: String Immutability, String Pool & Tối Ưu StringBuilder Bytecode",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải mã tính bất biến (Immutability) của lớp `java.lang.String`.\n- Cơ chế lưu trữ chuỗi ký tự trong **String Constant Pool** của Heap.\n- Phân biệt toán tử so sánh `==` (so địa chỉ) và phương thức `.equals()` (so nội dung).\n- Tránh thảm họa cộng chuỗi trong vòng lặp bằng `StringBuilder` và Compact Strings Java 21.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CUỐN SÁCH KHÔNG THỂ BỊ TẨY XÓA\n- Khi bạn in một cuốn sách giấy (tạo đối tượng `String`), mực in đã cố định. Nếu bạn muốn thêm 1 chữ, bạn không thể bôi xóa trang sách cũ, mà buộc phải **in một cuốn sách mới hoàn toàn**!\n- Nếu trong 1 vòng lặp 10,000 lần bạn dùng toán tử `str += i`, bạn đang bắt máy in in ra **10,000 cuốn sách mới** và vứt bỏ 9,999 cuốn vào sọt rác -> Máy in nghẽn mực, bộ nhớ RAM sập vì Garbage Collector quá tải!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Vùng Nhớ String Constant Pool)\n\n```mermaid\nflowchart TD\n    subgraph STACK [\"Thread Stack\"]\n        S1[\"String s1 = 'PAID'\"]\n        S2[\"String s2 = 'PAID'\"]\n        S3[\"String s3 = new String('PAID')\"]\n    end\n\n    subgraph HEAP [\"JVM Heap Memory\"]\n        subgraph POOL [\"String Constant Pool (Tái sử dụng)\"]\n            P1[\"'PAID' (Ô nhớ 0x1111)\"]\n        end\n        OBJ[\"String Object độc lập (0x2222)\"]\n    end\n\n    S1 --> P1\n    S2 --> P1\n    S3 --> OBJ\n    OBJ -.->|\"Trỏ value nội bộ\"| P1\n    style POOL fill:#064e3b,stroke:#10b981,color:#fff\n    style STACK fill:#1e3a8a,stroke:#3b82f6,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh String, StringBuilder & StringBuffer)\n\n| Tiêu chí | `String` | `StringBuilder` | `StringBuffer` |\n|---|---|---|---|\n| **Tính khả biến** | Bất biến (Immutable) | Có thể thay đổi (Mutable) | Có thể thay đổi (Mutable) |\n| **An toàn đa luồng** | Thread-safe 100% | ❌ Không Thread-safe | ✅ Thread-safe (Có `synchronized`) |\n| **Hiệu năng nối chuỗi** | Kém trong vòng lặp lớn | ⭐ Siêu nhanh (Không lock) | Chậm hơn do overhead lock |\n| **Trường hợp sử dụng** | Khóa HashMap, DTO, Config | Nối chuỗi trong 1 luồng cục bộ | Dùng khi nhiều luồng cùng ghi 1 chuỗi |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Tối Ưu Xuất Báo Cáo Đơn Hàng)\n\nMã nguồn xuất hóa đơn CSV cho 10,000 sản phẩm:\n\n```java\npackage vn.mastery.ecommerce;\n\nimport java.util.List;\n\npublic class OrderReportGenerator {\n\n    public record InvoiceRow(String orderId, String sku, long amount) {}\n\n    // ✅ CHUẨN SENIOR: Dùng StringBuilder với dung lượng dự tính (Initial Capacity)\n    public static String generateCsvReport(List<InvoiceRow> rows) {\n        // Ước tính 50 ký tự mỗi dòng để tránh mảng ký tự nội bộ phải resize nhiều lần\n        StringBuilder sb = new StringBuilder(rows.size() * 50);\n        sb.append(\"order_id,sku,amount\\n\");\n\n        for (InvoiceRow row : rows) {\n            sb.append(row.orderId()).append(\",\")\n              .append(row.sku()).append(\",\")\n              .append(row.amount()).append(\"\\n\");\n        }\n        return sb.toString();\n    }\n}\n```\n\n### Bảng Phân Tích Kỹ Thuật StringBuilder:\n\n| Lệnh gọi | Cơ chế tối ưu ngầm | Lợi ích hiệu năng |\n|---|---|---|\n| `new StringBuilder(capacity)` | Cấp phát sẵn mảng byte[] nội bộ với kích thước chuẩn | Triệt tiêu hoàn toàn các thao tác `Arrays.copyOf()` mở rộng mảng |\n| `.append(...)` | Ghi trực tiếp các byte vào mảng bộ đệm hiện tại | Không sinh bất kỳ object rác nào trên Heap trong suốt vòng lặp |\n| Compact Strings (Java 9+) | Tự động mã hóa Latin-1 (1 byte/ký tự) thay vì UTF-16 (2 bytes) | Tiết kiệm 50% RAM cho các chuỗi ASCII (Mã đơn hàng, SKU) |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: So sánh chuỗi bằng toán tử `==`\n- **Vấn đề**: `orderStatus == \"PAID\"` trả về `true` khi chuỗi được lấy từ String Pool nhưng lập tức trả về `false` khi chuỗi được đọc từ Database hoặc JSON Request của Client!\n- **Giải pháp**: Luôn so sánh chuỗi bằng phương thức `\"PAID\".equals(orderStatus)` (đặt hằng số lên trước để chống `NullPointerException`).\n\n### Checklist Bài 1.4\n- [ ] Tuyệt đối không dùng toán tử `+` để cộng chuỗi bên trong vòng lặp `for`/`while`.\n- [ ] Luôn khởi tạo `StringBuilder` với kích thước dự tính (Initial Capacity) nếu biết trước.\n- [ ] Sử dụng `equals()` hoặc `equalsIgnoreCase()` thay cho toán tử `==`.\n"
        },
        {
          "id": "j0-1-quiz",
          "type": "quiz",
          "title": "Sát Hạch Năng Lực Module 1: Cú Pháp Hiện Đại & Quản Lý Bộ Nhớ JVM",
          "minutes": 15,
          "questions": [
            {
              "level": "medium",
              "targetLessonId": "j0-1-2",
              "scenario": "Trong hệ thống E-Commerce, một vòng lặp duyệt qua 500,000 giao dịch để tính tổng doanh thu. Lập trình viên khai báo biến tổng: Long total = 0L; và trong vòng lặp viết: total += item.getAmount();",
              "q": "Hiện tượng tiêu cực nào sẽ xảy ra trong bộ nhớ JVM?",
              "options": [
                "Phát sinh 500,000 đối tượng Long rác trên Heap do Autoboxing và Unboxing liên tục, làm kích hoạt GC STW pause kéo dài độ trễ hệ thống.",
                "Trình biên dịch tự động tối ưu thành biến nguyên thủy long nên không ảnh hưởng gì đến bộ nhớ.",
                "Biến Long tự động chia sẻ ô nhớ trong String Constant Pool.",
                "Chương trình bị lỗi biên dịch Compile Error vì không thể cộng dồn Wrapper."
              ],
              "answer": 0,
              "explain": "Biến Wrapper Long là immutable. Mỗi lần thực hiện toán tử +=, JVM phải unbox thành long nguyên thủy, cộng dồn, rồi autobox tạo ra một đối tượng Long mới trên Heap. 500,000 object rác sẽ làm quá tải Young Generation của Garbage Collector gây hiện tượng lag giật hệ thống."
            },
            {
              "level": "hard",
              "targetLessonId": "j0-1-3",
              "scenario": "Một hàm nhận vào tham số: public void processOrder(Order order, int discountRate). Bên trong hàm, lập trình viên gán discountRate = 20; và order.setDiscount(discountRate);",
              "q": "Sau khi hàm kết thúc, biến discountRate ở hàm gọi ban đầu có bị thay đổi không?",
              "options": [
                "Không đổi, vì Java hoàn toàn là Pass-by-value; hàm chỉ nhận bản sao của biến nguyên thủy trên Stack frame của riêng nó.",
                "Có đổi thành 20, vì biến được truyền theo tham chiếu (Pass-by-reference).",
                "Chỉ đổi nếu biến discountRate được khai báo là static.",
                "Ném ra ngoại lệ ConcurrentModificationException."
              ],
              "answer": 0,
              "explain": "Java chỉ có cơ chế Pass-by-value. Khi truyền kiểu nguyên thủy int, một bản sao giá trị được đẩy vào Stack frame mới của hàm con. Mọi thay đổi đối với bản sao này biến mất khi hàm con kết thúc. Với order, giá trị bản sao của con trỏ trỏ tới cùng Object trên Heap nên thuộc tính bên trong Object thay đổi nhưng tham chiếu order không đổi."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-1-2",
              "scenario": "Một hệ thống thanh toán tính toán tổng tiền đơn hàng lớn bằng công thức int total = price * quantity; Khi price = 100,000,000 và quantity = 30, giá trị in ra lại là một số âm.",
              "q": "Nguyên nhân kỹ thuật và giải pháp chuẩn mực trong Java 21 là gì?",
              "options": [
                "Do hiện tượng tràn số nguyên 32-bit (Integer Overflow); giải pháp là dùng Math.multiplyExact() hoặc ép kiểu sang long.",
                "Do CPU bị lỗi tính toán số học trên thanh ghi x86-64.",
                "Do Java tự động convert sang số nhị phân bù 1.",
                "Do bộ nhớ Heap bị quá tải dẫn đến sai lệch dữ liệu."
              ],
              "answer": 0,
              "explain": "Kiểu int trong Java có giới hạn tối đa là 2^31 - 1 (khoảng 2.14 tỷ). Phép nhân vượt quá giới hạn này sẽ làm lật bit dấu (sign bit) thành số âm mà không hề ném lỗi. Trong Java, sử dụng Math.multiplyExact() sẽ chủ động ném ArithmeticException khi bị tràn số, hoặc sử dụng long/BigDecimal."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-1-4",
              "scenario": "Hai chuỗi được tạo như sau: String s1 = \"ORDER_PAID\"; String s2 = new String(\"ORDER_PAID\");",
              "q": "Biểu thức so sánh nào sau đây trả về kết quả false?",
              "options": [
                "s1 == s2",
                "s1.equals(s2)",
                "s1.intern() == s2.intern()",
                "s1.compareTo(s2) == 0"
              ],
              "answer": 0,
              "explain": "s1 là string literal được lưu trong String Constant Pool (nằm trong Heap). s2 được tạo qua từ khóa new sẽ luôn tạo một Object String mới hoàn toàn trên Heap thông thường. Do đó s1 == s2 so sánh địa chỉ tham chiếu sẽ trả về false, dù nội dung ký tự (s1.equals(s2)) là hoàn toàn giống nhau."
            },
            {
              "level": "hard",
              "targetLessonId": "j0-1-4",
              "scenario": "Trong một dịch vụ xuất hóa đơn, lập trình viên ghép chuỗi 10,000 dòng log bằng vòng lặp: String result = \"\"; for (int i = 0; i < 10000; i++) result += lines[i];",
              "q": "Tại sao giải pháp này bị cấm ngặt nghèo trong mã nguồn doanh nghiệp?",
              "options": [
                "Độ phức tạp thuật toán O(N^2) về thời gian và tạo ra 10,000 đối tượng String/StringBuilder rác do String là immutable.",
                "Vì phép cộng chuỗi bằng toán tử += không hỗ trợ ký tự UTF-8 tiếng Việt.",
                "Vì vòng lặp for tự động khóa Thread (thread starvation).",
                "Vì Java compiler sẽ từ chối biên dịch vòng lặp chứa chuỗi."
              ],
              "answer": 0,
              "explain": "Do String là immutable, mỗi lần gọi result += lines[i], Java phải tạo ra một StringBuilder mới, sao chép toàn bộ chuỗi cũ result rồi tạo chuỗi mới. Với N=10,000, số lượng ký tự phải copy là cấp số cộng O(N^2), tốn hàng chục MB RAM và làm nghẽn CPU. Giải pháp bắt buộc là khởi tạo trước một StringBuilder với initialCapacity."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-1-1",
              "scenario": "Khi biên dịch một file OrderService.java, lệnh javac tạo ra file OrderService.class. File class này chứa thông tin gì?",
              "q": "Bản chất của mã Bytecode trong file .class là gì?",
              "options": [
                "Là tập lệnh nhị phân độc lập nền tảng được thiết kế cho kiến trúc máy ảo JVM thực thi.",
                "Là mã máy assembly trực tiếp cho CPU Intel/AMD x86.",
                "Là mã nguồn Java gốc đã được nén lại bằng thuật toán Gzip.",
                "Là mã bytecode chỉ chạy được trên hệ điều hành Linux."
              ],
              "answer": 0,
              "explain": "Bytecode là tập lệnh trung gian (opcode 1 byte) độc lập với phần cứng vật lý. Máy ảo JVM của từng hệ điều hành cụ thể (Windows, Linux, macOS) sẽ đọc mã bytecode này và biên dịch (JIT) hoặc thông dịch (Interpreter) thành mã máy bản địa (native machine code)."
            },
            {
              "level": "hard",
              "targetLessonId": "j0-1-3",
              "scenario": "Một ứng dụng microservice gặp lỗi: java.lang.OutOfMemoryError: Metaspace. Đội vận hành muốn tìm hiểu vùng nhớ Metaspace dùng để chứa những dữ liệu gì.",
              "q": "Vùng nhớ Metaspace (từ Java 8+) lưu trữ thành phần nào sau đây?",
              "options": [
                "Metadata của Class, Constant Pool của class, Method Bytecode và Static variables nằm trong bộ nhớ native (ngoài Java Heap).",
                "Tất cả các đối tượng Object thông thường được khởi tạo bằng từ khóa new.",
                "Các biến cục bộ (Local variables) và Stack frame của mỗi Thread.",
                "Các file tạm do ứng dụng ghi vào ổ đĩa cứng."
              ],
              "answer": 0,
              "explain": "Từ Java 8, PermGen đã bị loại bỏ và thay thế bằng Metaspace. Metaspace nằm ở bộ nhớ native của hệ điều hành (không bị giới hạn bởi -Xmx của Heap trừ khi cấu hình -XX:MaxMetaspaceSize) và chịu trách nhiệm lưu Class Metadata, Method table, Field metadata khi class được nạp bởi ClassLoader."
            },
            {
              "level": "easy",
              "targetLessonId": "j0-1-2",
              "scenario": "Trong hệ thống tính tiền, lập trình viên sử dụng double price = 0.1 + 0.2; System.out.println(price == 0.3);",
              "q": "Màn hình console sẽ in ra kết quả gì và tại sao?",
              "options": [
                "false — Vì kiểu số thực double chuẩn IEEE 754 không thể biểu diễn chính xác số thập phân nhị phân hữu hạn, dẫn đến sai số 0.30000000000000004.",
                "true — Vì phép toán 0.1 + 0.2 luôn bằng 0.3 trong mọi ngôn ngữ lập trình.",
                "Compile Error — Vì Java không cho phép so sánh == giữa biến double.",
                "NullPointerException — Vì kiểu nguyên thủy double chưa được khởi tạo."
              ],
              "answer": 0,
              "explain": "Chuẩn IEEE 754 lưu trữ số thực dưới dạng nhị phân cơ số 2. Một số thập phân như 0.1 và 0.2 khi đổi sang nhị phân sẽ thành số vô hạn tuần hoàn, dẫn đến phép cộng tạo ra 0.30000000000000004. Trong nghiệp vụ tài chính, bắt buộc phải dùng BigDecimal."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-1-3",
              "scenario": "Một lập trình viên gọi đệ quy vô hạn: public void recursiveCall() { recursiveCall(); }",
              "q": "Lỗi gì sẽ phát sinh và xảy ra ở vùng nhớ nào của JVM?",
              "options": [
                "StackOverflowError — Xảy ra trên vùng nhớ Call Stack của Thread do cạn kiệt Stack Frame.",
                "OutOfMemoryError: Java heap space — Xảy ra trên vùng nhớ Heap.",
                "OutOfMemoryError: Metaspace — Xảy ra trên vùng nhớ Metaspace.",
                "ConcurrentModificationException — Xảy ra trên vùng nhớ Cache."
              ],
              "answer": 0,
              "explain": "Mỗi lời gọi hàm sẽ tạo ra một Stack Frame (chứa return address, local variables, operand stack) đẩy vào Stack của Thread hiện tại. Khi đệ quy không có điểm dừng, kích thước Call Stack vượt quá hạn mức (-Xss) và JVM ném ra java.lang.StackOverflowError."
            },
            {
              "level": "hard",
              "targetLessonId": "j0-1-2",
              "scenario": "Trong Java 21, từ khóa 'final' khi đặt trước một biến đối tượng (Object reference) có ý nghĩa kỹ thuật chuẩn xác là gì?",
              "q": "Điều gì bị ngăn cấm khi một biến được khai báo 'final Order order = new Order();'?",
              "options": [
                "Ngăn cản việc gán lại con trỏ order sang một đối tượng Order khác; nhưng trạng thái nội tại bên trong Order vẫn có thể bị sửa đổi nếu class không immutable.",
                "Đóng băng hoàn toàn toàn bộ thuộc tính bên trong Order không thể thay đổi giá trị.",
                "Tự động biến class Order thành immutable và lưu trên Metaspace.",
                "Yêu cầu mọi hàm trong class Order phải là static."
              ],
              "answer": 0,
              "explain": "Từ khóa final trên biến đối tượng chỉ có nghĩa là con trỏ tham chiếu (reference pointer) không được phép trỏ tới địa chỉ ô nhớ khác (reassign). Nó hoàn toàn không bảo vệ các field bên trong đối tượng đó khỏi việc bị thay đổi (mutate)."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-1-1",
              "scenario": "Trong Java 21, tính năng Local-Variable Type Inference cho phép dùng từ khóa 'var' khi khai báo biến.",
              "q": "Trường hợp nào sau đây việc sử dụng 'var' là HỢP LỆ?",
              "options": [
                "var order = new Order(\"ORD-01\"); bên trong thân hàm phương thức.",
                "public var processOrder() { return 1; } làm kiểu trả về của phương thức.",
                "private var orderId = \"ORD-01\"; làm trường thuộc tính (field) của Class.",
                "var item; sau đó mới gán item = new OrderItem(); ở dòng tiếp theo."
              ],
              "answer": 0,
              "explain": "'var' chỉ được phép áp dụng cho biến cục bộ (Local variable) bên trong thân phương thức hoặc vòng lặp, và bắt buộc phải có giá trị khởi tạo ngay tại dòng khai báo để trình biên dịch suy luận kiểu dữ liệu tại Compile-time. 'var' không được dùng cho field, method parameter hay return type."
            },
            {
              "level": "hard",
              "targetLessonId": "j0-1-4",
              "scenario": "Một lập trình viên gọi: String s = new String(\"PAYMENT\").intern();",
              "q": "Phương thức .intern() thực hiện cơ chế gì bên dưới JVM?",
              "options": [
                "Kiểm tra xem chuỗi có nội dung tương đương đã tồn tại trong String Constant Pool chưa; nếu có thì trả về tham chiếu trong Pool, nếu chưa thì thêm chuỗi này vào Pool và trả về tham chiếu.",
                "Chuyển đổi toàn bộ chuỗi thành mã hex nhị phân trong Metaspace.",
                "Khóa chuỗi lại để ngăn cản các Thread khác truy cập đồng thời.",
                "Tự động ép kiểu chuỗi thành StringBuilder để tối ưu hóa."
              ],
              "answer": 0,
              "explain": "Phương thức native .intern() truy xuất trực tiếp vào String Table (String Pool) do JVM quản lý. Nếu chuỗi đã có trong Pool, nó trả về địa chỉ ô nhớ trong Pool, giúp tối ưu dung lượng RAM khi có hàng triệu chuỗi trùng lặp giá trị."
            }
          ]
        }
      ],
      "quiz": {
        "id": "j0-1-quiz",
        "title": "Sát Hạch Năng Lực Module 1: Cú Pháp Hiện Đại & Quản Lý Bộ Nhớ JVM",
        "poolSize": 12,
        "pullCount": 12,
        "passThresholdPct": 80,
        "questions": [
          {
            "level": "medium",
            "targetLessonId": "j0-1-2",
            "scenario": "Trong hệ thống E-Commerce, một vòng lặp duyệt qua 500,000 giao dịch để tính tổng doanh thu. Lập trình viên khai báo biến tổng: Long total = 0L; và trong vòng lặp viết: total += item.getAmount();",
            "q": "Hiện tượng tiêu cực nào sẽ xảy ra trong bộ nhớ JVM?",
            "options": [
              "Phát sinh 500,000 đối tượng Long rác trên Heap do Autoboxing và Unboxing liên tục, làm kích hoạt GC STW pause kéo dài độ trễ hệ thống.",
              "Trình biên dịch tự động tối ưu thành biến nguyên thủy long nên không ảnh hưởng gì đến bộ nhớ.",
              "Biến Long tự động chia sẻ ô nhớ trong String Constant Pool.",
              "Chương trình bị lỗi biên dịch Compile Error vì không thể cộng dồn Wrapper."
            ],
            "answer": 0,
            "explain": "Biến Wrapper Long là immutable. Mỗi lần thực hiện toán tử +=, JVM phải unbox thành long nguyên thủy, cộng dồn, rồi autobox tạo ra một đối tượng Long mới trên Heap. 500,000 object rác sẽ làm quá tải Young Generation của Garbage Collector gây hiện tượng lag giật hệ thống."
          },
          {
            "level": "hard",
            "targetLessonId": "j0-1-3",
            "scenario": "Một hàm nhận vào tham số: public void processOrder(Order order, int discountRate). Bên trong hàm, lập trình viên gán discountRate = 20; và order.setDiscount(discountRate);",
            "q": "Sau khi hàm kết thúc, biến discountRate ở hàm gọi ban đầu có bị thay đổi không?",
            "options": [
              "Không đổi, vì Java hoàn toàn là Pass-by-value; hàm chỉ nhận bản sao của biến nguyên thủy trên Stack frame của riêng nó.",
              "Có đổi thành 20, vì biến được truyền theo tham chiếu (Pass-by-reference).",
              "Chỉ đổi nếu biến discountRate được khai báo là static.",
              "Ném ra ngoại lệ ConcurrentModificationException."
            ],
            "answer": 0,
            "explain": "Java chỉ có cơ chế Pass-by-value. Khi truyền kiểu nguyên thủy int, một bản sao giá trị được đẩy vào Stack frame mới của hàm con. Mọi thay đổi đối với bản sao này biến mất khi hàm con kết thúc. Với order, giá trị bản sao của con trỏ trỏ tới cùng Object trên Heap nên thuộc tính bên trong Object thay đổi nhưng tham chiếu order không đổi."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-1-2",
            "scenario": "Một hệ thống thanh toán tính toán tổng tiền đơn hàng lớn bằng công thức int total = price * quantity; Khi price = 100,000,000 và quantity = 30, giá trị in ra lại là một số âm.",
            "q": "Nguyên nhân kỹ thuật và giải pháp chuẩn mực trong Java 21 là gì?",
            "options": [
              "Do hiện tượng tràn số nguyên 32-bit (Integer Overflow); giải pháp là dùng Math.multiplyExact() hoặc ép kiểu sang long.",
              "Do CPU bị lỗi tính toán số học trên thanh ghi x86-64.",
              "Do Java tự động convert sang số nhị phân bù 1.",
              "Do bộ nhớ Heap bị quá tải dẫn đến sai lệch dữ liệu."
            ],
            "answer": 0,
            "explain": "Kiểu int trong Java có giới hạn tối đa là 2^31 - 1 (khoảng 2.14 tỷ). Phép nhân vượt quá giới hạn này sẽ làm lật bit dấu (sign bit) thành số âm mà không hề ném lỗi. Trong Java, sử dụng Math.multiplyExact() sẽ chủ động ném ArithmeticException khi bị tràn số, hoặc sử dụng long/BigDecimal."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-1-4",
            "scenario": "Hai chuỗi được tạo như sau: String s1 = \"ORDER_PAID\"; String s2 = new String(\"ORDER_PAID\");",
            "q": "Biểu thức so sánh nào sau đây trả về kết quả false?",
            "options": [
              "s1 == s2",
              "s1.equals(s2)",
              "s1.intern() == s2.intern()",
              "s1.compareTo(s2) == 0"
            ],
            "answer": 0,
            "explain": "s1 là string literal được lưu trong String Constant Pool (nằm trong Heap). s2 được tạo qua từ khóa new sẽ luôn tạo một Object String mới hoàn toàn trên Heap thông thường. Do đó s1 == s2 so sánh địa chỉ tham chiếu sẽ trả về false, dù nội dung ký tự (s1.equals(s2)) là hoàn toàn giống nhau."
          },
          {
            "level": "hard",
            "targetLessonId": "j0-1-4",
            "scenario": "Trong một dịch vụ xuất hóa đơn, lập trình viên ghép chuỗi 10,000 dòng log bằng vòng lặp: String result = \"\"; for (int i = 0; i < 10000; i++) result += lines[i];",
            "q": "Tại sao giải pháp này bị cấm ngặt nghèo trong mã nguồn doanh nghiệp?",
            "options": [
              "Độ phức tạp thuật toán O(N^2) về thời gian và tạo ra 10,000 đối tượng String/StringBuilder rác do String là immutable.",
              "Vì phép cộng chuỗi bằng toán tử += không hỗ trợ ký tự UTF-8 tiếng Việt.",
              "Vì vòng lặp for tự động khóa Thread (thread starvation).",
              "Vì Java compiler sẽ từ chối biên dịch vòng lặp chứa chuỗi."
            ],
            "answer": 0,
            "explain": "Do String là immutable, mỗi lần gọi result += lines[i], Java phải tạo ra một StringBuilder mới, sao chép toàn bộ chuỗi cũ result rồi tạo chuỗi mới. Với N=10,000, số lượng ký tự phải copy là cấp số cộng O(N^2), tốn hàng chục MB RAM và làm nghẽn CPU. Giải pháp bắt buộc là khởi tạo trước một StringBuilder với initialCapacity."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-1-1",
            "scenario": "Khi biên dịch một file OrderService.java, lệnh javac tạo ra file OrderService.class. File class này chứa thông tin gì?",
            "q": "Bản chất của mã Bytecode trong file .class là gì?",
            "options": [
              "Là tập lệnh nhị phân độc lập nền tảng được thiết kế cho kiến trúc máy ảo JVM thực thi.",
              "Là mã máy assembly trực tiếp cho CPU Intel/AMD x86.",
              "Là mã nguồn Java gốc đã được nén lại bằng thuật toán Gzip.",
              "Là mã bytecode chỉ chạy được trên hệ điều hành Linux."
            ],
            "answer": 0,
            "explain": "Bytecode là tập lệnh trung gian (opcode 1 byte) độc lập với phần cứng vật lý. Máy ảo JVM của từng hệ điều hành cụ thể (Windows, Linux, macOS) sẽ đọc mã bytecode này và biên dịch (JIT) hoặc thông dịch (Interpreter) thành mã máy bản địa (native machine code)."
          },
          {
            "level": "hard",
            "targetLessonId": "j0-1-3",
            "scenario": "Một ứng dụng microservice gặp lỗi: java.lang.OutOfMemoryError: Metaspace. Đội vận hành muốn tìm hiểu vùng nhớ Metaspace dùng để chứa những dữ liệu gì.",
            "q": "Vùng nhớ Metaspace (từ Java 8+) lưu trữ thành phần nào sau đây?",
            "options": [
              "Metadata của Class, Constant Pool của class, Method Bytecode và Static variables nằm trong bộ nhớ native (ngoài Java Heap).",
              "Tất cả các đối tượng Object thông thường được khởi tạo bằng từ khóa new.",
              "Các biến cục bộ (Local variables) và Stack frame của mỗi Thread.",
              "Các file tạm do ứng dụng ghi vào ổ đĩa cứng."
            ],
            "answer": 0,
            "explain": "Từ Java 8, PermGen đã bị loại bỏ và thay thế bằng Metaspace. Metaspace nằm ở bộ nhớ native của hệ điều hành (không bị giới hạn bởi -Xmx của Heap trừ khi cấu hình -XX:MaxMetaspaceSize) và chịu trách nhiệm lưu Class Metadata, Method table, Field metadata khi class được nạp bởi ClassLoader."
          },
          {
            "level": "easy",
            "targetLessonId": "j0-1-2",
            "scenario": "Trong hệ thống tính tiền, lập trình viên sử dụng double price = 0.1 + 0.2; System.out.println(price == 0.3);",
            "q": "Màn hình console sẽ in ra kết quả gì và tại sao?",
            "options": [
              "false — Vì kiểu số thực double chuẩn IEEE 754 không thể biểu diễn chính xác số thập phân nhị phân hữu hạn, dẫn đến sai số 0.30000000000000004.",
              "true — Vì phép toán 0.1 + 0.2 luôn bằng 0.3 trong mọi ngôn ngữ lập trình.",
              "Compile Error — Vì Java không cho phép so sánh == giữa biến double.",
              "NullPointerException — Vì kiểu nguyên thủy double chưa được khởi tạo."
            ],
            "answer": 0,
            "explain": "Chuẩn IEEE 754 lưu trữ số thực dưới dạng nhị phân cơ số 2. Một số thập phân như 0.1 và 0.2 khi đổi sang nhị phân sẽ thành số vô hạn tuần hoàn, dẫn đến phép cộng tạo ra 0.30000000000000004. Trong nghiệp vụ tài chính, bắt buộc phải dùng BigDecimal."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-1-3",
            "scenario": "Một lập trình viên gọi đệ quy vô hạn: public void recursiveCall() { recursiveCall(); }",
            "q": "Lỗi gì sẽ phát sinh và xảy ra ở vùng nhớ nào của JVM?",
            "options": [
              "StackOverflowError — Xảy ra trên vùng nhớ Call Stack của Thread do cạn kiệt Stack Frame.",
              "OutOfMemoryError: Java heap space — Xảy ra trên vùng nhớ Heap.",
              "OutOfMemoryError: Metaspace — Xảy ra trên vùng nhớ Metaspace.",
              "ConcurrentModificationException — Xảy ra trên vùng nhớ Cache."
            ],
            "answer": 0,
            "explain": "Mỗi lời gọi hàm sẽ tạo ra một Stack Frame (chứa return address, local variables, operand stack) đẩy vào Stack của Thread hiện tại. Khi đệ quy không có điểm dừng, kích thước Call Stack vượt quá hạn mức (-Xss) và JVM ném ra java.lang.StackOverflowError."
          },
          {
            "level": "hard",
            "targetLessonId": "j0-1-2",
            "scenario": "Trong Java 21, từ khóa 'final' khi đặt trước một biến đối tượng (Object reference) có ý nghĩa kỹ thuật chuẩn xác là gì?",
            "q": "Điều gì bị ngăn cấm khi một biến được khai báo 'final Order order = new Order();'?",
            "options": [
              "Ngăn cản việc gán lại con trỏ order sang một đối tượng Order khác; nhưng trạng thái nội tại bên trong Order vẫn có thể bị sửa đổi nếu class không immutable.",
              "Đóng băng hoàn toàn toàn bộ thuộc tính bên trong Order không thể thay đổi giá trị.",
              "Tự động biến class Order thành immutable và lưu trên Metaspace.",
              "Yêu cầu mọi hàm trong class Order phải là static."
            ],
            "answer": 0,
            "explain": "Từ khóa final trên biến đối tượng chỉ có nghĩa là con trỏ tham chiếu (reference pointer) không được phép trỏ tới địa chỉ ô nhớ khác (reassign). Nó hoàn toàn không bảo vệ các field bên trong đối tượng đó khỏi việc bị thay đổi (mutate)."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-1-1",
            "scenario": "Trong Java 21, tính năng Local-Variable Type Inference cho phép dùng từ khóa 'var' khi khai báo biến.",
            "q": "Trường hợp nào sau đây việc sử dụng 'var' là HỢP LỆ?",
            "options": [
              "var order = new Order(\"ORD-01\"); bên trong thân hàm phương thức.",
              "public var processOrder() { return 1; } làm kiểu trả về của phương thức.",
              "private var orderId = \"ORD-01\"; làm trường thuộc tính (field) của Class.",
              "var item; sau đó mới gán item = new OrderItem(); ở dòng tiếp theo."
            ],
            "answer": 0,
            "explain": "'var' chỉ được phép áp dụng cho biến cục bộ (Local variable) bên trong thân phương thức hoặc vòng lặp, và bắt buộc phải có giá trị khởi tạo ngay tại dòng khai báo để trình biên dịch suy luận kiểu dữ liệu tại Compile-time. 'var' không được dùng cho field, method parameter hay return type."
          },
          {
            "level": "hard",
            "targetLessonId": "j0-1-4",
            "scenario": "Một lập trình viên gọi: String s = new String(\"PAYMENT\").intern();",
            "q": "Phương thức .intern() thực hiện cơ chế gì bên dưới JVM?",
            "options": [
              "Kiểm tra xem chuỗi có nội dung tương đương đã tồn tại trong String Constant Pool chưa; nếu có thì trả về tham chiếu trong Pool, nếu chưa thì thêm chuỗi này vào Pool và trả về tham chiếu.",
              "Chuyển đổi toàn bộ chuỗi thành mã hex nhị phân trong Metaspace.",
              "Khóa chuỗi lại để ngăn cản các Thread khác truy cập đồng thời.",
              "Tự động ép kiểu chuỗi thành StringBuilder để tối ưu hóa."
            ],
            "answer": 0,
            "explain": "Phương thức native .intern() truy xuất trực tiếp vào String Table (String Pool) do JVM quản lý. Nếu chuỗi đã có trong Pool, nó trả về địa chỉ ô nhớ trong Pool, giúp tối ưu dung lượng RAM khi có hàng triệu chuỗi trùng lặp giá trị."
          }
        ]
      },
      "subtitle": "JVM Architecture, Memory Layout, Data Types & String Pool Internals",
      "outcomes": [
        "Nắm vững bản chất bộ nhớ Stack, Heap, Metaspace và cơ chế thực thi Bytecode trên JVM 21",
        "Phân biệt rạch ròi Primitive vs Wrapper Types và triệt tiêu cạm bẫy tràn số (Integer Overflow)",
        "Làm chủ cơ chế Pass-by-value và cách truyền tham chiếu trong Java",
        "Tối ưu hóa bộ nhớ với String Immutability, String Constant Pool và StringBuilder Bytecode"
      ],
      "topics": [
        {
          "id": 1,
          "title": "Kiểu Dữ Liệu & Bản Chất Bộ Nhớ"
        },
        {
          "id": 2,
          "title": "Cơ Chế Truyền Tham Trị & Tối Ưu String"
        }
      ],
      "retrievalWarmup": null
    },
    {
      "id": 102,
      "title": "Lập Trình Hướng Đối Tượng Chuẩn Mực & SOLID",
      "icon": "🏛️",
      "color": "#059669",
      "desc": "4 Trụ cột OOP, Dynamic Binding, 5 nguyên lý SOLID, Builder Pattern & Immutability.",
      "lessons": [
        {
          "id": "j0-2-1",
          "type": "theory",
          "title": "Bài 2.1: 4 Trụ Cột OOP Trong Thiết Kế Hệ Thống Đơn Hàng E-Commerce",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Vận dụng 4 trụ cột OOP: **Đóng gói (Encapsulation)**, **Kế thừa (Inheritance)**, **Đa hình (Polymorphism)**, **Trừu tượng (Abstraction)** vào bài toán thanh toán.\n- Thiết kế Domain Entity chuẩn mực: Bảo vệ bất biến (Invariants) qua constructor và method private.\n- Triệt tiêu hoàn toàn anti-pattern \"Anemic Domain Model\" (Class chỉ có getter/setter thụ động).\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: 4 TRỤ CỘT QUA CỖ MÁY BÁN HÀNG TỰ ĐỘNG\n- **Đóng gói (Encapsulation)**: Két tiền của máy bán hàng bị khóa kín bên trong vỏ sắt. Khách hàng không thể tự thò tay vào lấy tiền thừa (không public field), mà phải bấm nút để máy tự tính toán nhả tiền thừa.\n- **Trừu tượng (Abstraction)**: Bạn chỉ thấy khe nhét tiền và nút bấm (Interface đơn giản). Bạn không cần biết bên trong có bao nhiêu rơ-le điện và cảm biến quang học.\n- **Kế thừa (Inheritance)**: Máy bán nước ngọt và Máy bán bánh snack cùng kế thừa từ một khung sườn máy bán hàng cơ bản (có bộ nhận diện tiền mặt).\n- **Đa hình (Polymorphism)**: Cùng là hành động \"Thanh toán\", nhưng đưa thẻ ngân hàng, tiền mặt hay quét mã QR máy đều xử lý được theo cách riêng của từng phương thức!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc 4 Trụ Cột OOP Trong E-Commerce)\n\n```mermaid\nclassDiagram\n    class PaymentMethod {\n        <<interface>>\n        +pay(long amountCents) PaymentResult\n    }\n    class CreditCardPayment {\n        -String cardNumber\n        -String cvv\n        +pay(long amountCents) PaymentResult\n    }\n    class MomoPayment {\n        -String phoneNumber\n        +pay(long amountCents) PaymentResult\n    }\n    class Order {\n        -String orderId\n        -long totalAmount\n        -OrderStatus status\n        +checkout(PaymentMethod method)\n    }\n\n    PaymentMethod <|.. CreditCardPayment : Implements (Polymorphism)\n    PaymentMethod <|.. MomoPayment : Implements (Polymorphism)\n    Order --> PaymentMethod : Depends on Abstraction\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận Đánh Giá: Rich Domain Model vs Anemic Domain Model)\n\n| Tiêu chí | Anemic Domain Model (Mô hình thiếu máu) | Rich Domain Model (Mô hình giàu nghiệp vụ) |\n|---|---|---|\n| **Cấu trúc Entity** | Chỉ chứa private fields + Getters/Setters công khai | Chứa dữ liệu + Phương thức hành vi nghiệp vụ |\n| **Bảo vệ toàn vẹn** | ❌ Kém: Bất kỳ đâu cũng có thể gọi `order.setStatus(PAID)` | ⭐ Tuyệt đối: Trạng thái chỉ đổi qua `order.completePayment()` |\n| **Vị trí logic nghiệp vụ** | Bị đẩy hết ra ngoài Service class khổng lồ (God Class) | Được đóng gói gọn gàng bên trong chính Entity liên quan |\n| **Khả năng Unit Test** | Khó test logic vì phụ thuộc vào Service và Mockito | Dễ test 100% bằng Java thuần (POJO Unit Test không cần Spring) |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Rich Domain Entity Chuẩn)\n\n```java\npackage vn.mastery.ecommerce.domain;\n\nimport java.util.Collections;\nimport java.util.List;\nimport java.util.Objects;\n\npublic class Order {\n    private final String orderId;\n    private final List<OrderItem> items;\n    private OrderStatus status;\n    private long totalAmount;\n\n    public Order(String orderId, List<OrderItem> items) {\n        this.orderId = Objects.requireNonNull(orderId, \"orderId không được null\");\n        if (items == null || items.isEmpty()) {\n            throw new IllegalArgumentException(\"Đơn hàng phải chứa ít nhất 1 sản phẩm!\");\n        }\n        // Đóng gói: Tạo unmodifiable defensive copy chống sửa đổi danh sách từ bên ngoài\n        this.items = List.copyOf(items);\n        this.status = OrderStatus.CREATED;\n        this.totalAmount = this.items.stream().mapToLong(OrderItem::subtotal).sum();\n    }\n\n    // Hành vi nghiệp vụ: Chuyển đổi trạng thái có kiểm tra logic\n    public void markAsPaid() {\n        if (this.status != OrderStatus.CREATED) {\n            throw new IllegalStateException(\"Chỉ đơn hàng ở trạng thái CREATED mới được thanh toán!\");\n        }\n        this.status = OrderStatus.PAID;\n    }\n\n    public String getOrderId() { return orderId; }\n    public OrderStatus getStatus() { return status; }\n    public long getTotalAmount() { return totalAmount; }\n    public List<OrderItem> getItems() { return items; }\n}\n```\n\n### Bảng Phân Tích Tính Đóng Gói (Encapsulation):\n\n| Khối mã nguồn | Ý nghĩa kỹ thuật | Bảo vệ hệ thống |\n|---|---|---|\n| `List.copyOf(items)` | Tạo danh sách bất biến (Unmodifiable List) | Ngăn Client lấy `order.getItems().add(...)` lén lút thêm hàng sau khi tính tiền |\n| Không có `setStatus(...)` | Triệt tiêu Setter công khai bừa bãi | Trạng thái bắt buộc phải qua phương thức nghiệp vụ `markAsPaid()` |\n| `markAsPaid()` validation | State Machine Validation | Ngăn chặn việc thanh toán 2 lần cho đơn đã hủy hoặc đã giao |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Để lộ tham chiếu đối tượng khả biến (Mutable Reference Leak)\n- **Vấn đề**: Getter trả về trực tiếp đối tượng `java.util.Date` hoặc `List` có thể bị bên ngoài gọi `clear()` làm rỗng dữ liệu nội bộ của Entity.\n- **Giải pháp**: Dùng `java.time.Instant` (bất biến) thay cho `Date`, và dùng `Collections.unmodifiableList()` hoặc `List.copyOf()`.\n\n### Checklist Bài 2.1\n- [ ] Loại bỏ toàn bộ các Setter không cần thiết trên Entity.\n- [ ] Bảo vệ tính toàn vẹn (Invariants) ngay tại Constructor.\n- [ ] Sử dụng Defensive Copying cho toàn bộ Collection fields.\n"
        },
        {
          "id": "j0-2-2",
          "type": "practice",
          "title": "Bài 2.2: Phân Biệt Static Binding vs Dynamic Binding (Invokevirtual Trong Bytecode)",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Hiểu rõ cơ chế liên kết tĩnh (Static Binding) và liên kết động (Dynamic Binding / Late Binding).\n- So sánh Overloading (Nạp chồng phương thức) vs Overriding (Ghi đè phương thức).\n- Giải mã bytecode: Lệnh `invokestatic`, `invokespecial` vs `invokevirtual`.\n- Tránh lỗi bẫy phỏng vấn Senior kinh điển về đa hình khi gọi method trên biến kiểu cha.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: ĐIỂM HẸN TỪ TRƯỚC VÀ TÌNH HUỐNG THỰC TẾ\n- **Static Binding (Liên kết tĩnh)**: Giống như bạn đặt vé xem phim có in sẵn số ghế 12 hàng F từ 3 ngày trước. Mọi thứ được chốt cứng ngay từ lúc in vé (Compile-time)! Các hàm `static`, `private`, `final` đều là Static Binding.\n- **Dynamic Binding (Liên kết động)**: Giống như bạn gọi xe taxi công nghệ. Khi bấm nút đặt xe, bạn chỉ biết là có \"Xe taxi đến đón\" (Biến kiểu cha `Vehicle`). Nhưng chỉ đến khi chiếc xe trờ tới cửa vào giờ hẹn, bạn mới biết đó là xe máy Honda hay xe hơi Toyota (Runtime Object)!\n:::\n\n---\n\n## 1. Cái này là gì? (Cơ Chế Dynamic Method Dispatch Trên JVM)\n\n```mermaid\nsequenceDiagram\n    autonumber\n    actor Caller as 💻 Client Code\n    participant Ref as 🏷️ Biến Kiểu Cha (PaymentMethod)\n    participant VTable as 📋 vtable (Virtual Method Table)\n    participant Actual as ⚙️ Đối Tượng Thật (MomoPayment)\n\n    Caller->>Ref: pay(500000) [invokevirtual]\n    Ref->>VTable: Tra cứu địa chỉ method của class thực tế tại Runtime\n    VTable->>Actual: Gọi thực thi method MomoPayment.pay()\n    Actual-->>Caller: Trả về kết quả thanh toán Momo\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Overloading vs Overriding)\n\n| Tiêu chí | Method Overloading (Nạp chồng) | Method Overriding (Ghi đè) |\n|---|---|---|\n| **Thời điểm phân giải** | **Compile-time** (Static Binding) | **Runtime** (Dynamic Binding) |\n| **Phạm vi áp dụng** | Trong cùng 1 class | Giữa class con và class cha / Interface |\n| **Chữ ký phương thức** | Cùng tên, **khác tham số** (số lượng/kiểu) | **Giống hệt 100%** tên và tham số |\n| **Lệnh Bytecode JVM** | `invokestatic` hoặc `invokevirtual` theo kiểu khai báo | `invokevirtual` tra cứu qua `vtable` |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Cạm Bẫy Đa Hình Nạp Chồng)\n\n```java\npackage vn.mastery.ecommerce;\n\npublic class PolymorphismTrap {\n\n    public static class Payment { public String name() { return \"GENERIC_PAYMENT\"; } }\n    public static class VnpayPayment extends Payment { \n        @Override public String name() { return \"VNPAY_QR\"; } \n    }\n\n    public static class Dispatcher {\n        public void process(Payment p) { System.out.println(\"Xử lý chung: \" + p.name()); }\n        public void process(VnpayPayment v) { System.out.println(\"Xử lý VNPAY riêng: \" + v.name()); }\n    }\n\n    public static void main(String[] args) {\n        Payment actualVnpay = new VnpayPayment();\n        Dispatcher dispatcher = new Dispatcher();\n\n        // ⚠️ BẪY PHỎNG VẤN SENIOR: Method nào sẽ được gọi?\n        dispatcher.process(actualVnpay);\n        // KẾT QUẢ IN RA: \"Xử lý chung: VNPAY_QR\"\n    }\n}\n```\n\n### Bảng Phân Tích Kết Quả:\n\n| Lời gọi hàm | Phân giải Compile-time | Phân giải Runtime |\n|---|---|---|\n| `dispatcher.process(actualVnpay)` | Compiler nhìn vào kiểu khai báo của biến (`Payment`) -> Chọn hàm `process(Payment)` (Static Binding)! | Không đổi hàm overload, thực thi hàm `process(Payment)` |\n| `p.name()` bên trong | Compiler thấy phương thức ảo (Virtual Method) | JVM dùng Dynamic Binding gọi `VnpayPayment.name()` -> Trả về `VNPAY_QR`! |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Gọi phương thức có thể bị ghi đè bên trong Constructor\n- **Vấn đề**: Class cha gọi `init()` trong constructor của nó. Khi class con kế thừa và override `init()`, phương thức của con được gọi trước khi các field của con kịp khởi tạo -> Gây ra `NullPointerException` bí ẩn!\n- **Giải pháp**: Không bao giờ gọi phương thức non-private, non-final bên trong bất kỳ Constructor nào.\n\n### Checklist Bài 2.2\n- [ ] Luôn đặt annotation `@Override` để nhờ compiler kiểm tra chữ ký hàm.\n- [ ] Hiểu rõ Overloading chọn hàm theo kiểu khai báo (Compile-time).\n- [ ] Hiểu rõ Overriding chọn hàm theo đối tượng thực tế trên Heap (Runtime).\n"
        },
        {
          "id": "j0-2-3",
          "type": "theory",
          "title": "Bài 2.3: Áp Dụng 5 Nguyên Lý SOLID Vào Kiến Trúc Xử Lý Thanh Toán",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Nắm vững 5 nguyên lý cốt lõi của lập trình hướng đối tượng: **S.O.L.I.D**.\n- Phân tích mã nguồn vi phạm và cách refactor từng nguyên lý:\n  - **S**: Single Responsibility Principle.\n  - **O**: Open/Closed Principle.\n  - **L**: Liskov Substitution Principle.\n  - **I**: Interface Segregation Principle.\n  - **D**: Dependency Inversion Principle.\n- Xây dựng Module thanh toán E-Commerce sẵn sàng mở rộng thêm cổng mới mà không sửa code cũ.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BỘ DỤNG CỤ ĐA NĂNG VS CỔNG USB TIÊU CHUẨN\n- **Vi phạm Single Responsibility (S)**: Giống như một con dao Thụy Sĩ tích hợp cả bấm móng tay, kìm, bật lửa và USB. Khi bấm móng tay bị cùn, bạn phải vứt cả chiếc dao đi!\n- **Open/Closed (O) & Dependency Inversion (D)**: Giống như cổng cắm USB trên máy tính. Máy tính không cần biết bạn cắm chuột Logitech hay bàn phím cơ Razer (Phụ thuộc vào Interface chuẩn USB). Khi bạn mua chuột mới, bạn không cần phải tháo tung bo mạch chủ máy tính ra hàn lại dây (Mở rộng thoải mái, đóng với sửa đổi)!\n:::\n\n---\n\n## 1. Cái này là gì? (Bản Đồ 5 Nguyên Lý SOLID Trong E-Commerce)\n\n```mermaid\nflowchart TD\n    subgraph SOLID [\"5 NGUYÊN LÝ THIẾT KẾ SOLID\"]\n        S[\"S: Single Responsibility<br/>(Tách OrderService chỉ tính tiền, NotificationService gửi email)\"]\n        O[\"O: Open/Closed<br/>(Thêm cổng ZaloPay chỉ cần tạo class mới, không sửa code switch cũ)\"]\n        L[\"L: Liskov Substitution<br/>(Mọi cổng thanh toán con đều phải thay thế được PaymentGateway cha)\"]\n        I[\"I: Interface Segregation<br/>(Tách RefundablePayment riêng, không ép COD phải hoàn tiền online)\"]\n        D[\"D: Dependency Inversion<br/>(OrderCheckoutService phụ thuộc vào PaymentGateway Interface)\"]\n    end\n    style SOLID fill:#064e3b,stroke:#10b981,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Vi Phạm vs Tuân Thủ SOLID)\n\n| Nguyên lý | Dấu hiệu vi phạm (Code mùi) | Giải pháp chuẩn SOLID |\n|---|---|---|\n| **S** | Một class `OrderService` vừa validate, vừa trừ kho, vừa gửi email, vừa in PDF | Tách thành `InventoryClient`, `EmailSender`, `InvoicePrinter` riêng biệt |\n| **O** | Dùng chuỗi lệnh `if-else if (type == \"MOMO\")` dài dằng dặc | Dùng Strategy Pattern kết hợp Map/Factory để nạp động |\n| **L** | Class con quăng ra ngoại lệ `throw new UnsupportedOperationException()` | Tách nhỏ Interface cha để class con chỉ kế thừa đúng khả năng của nó |\n| **I** | Interface `PaymentProcessor` có 15 methods từ quẹt thẻ, hoàn tiền, ký số | Tách thành `PaymentProcessor`, `Refundable`, `Tokenizable` |\n| **D** | `OrderService` tự tay khởi tạo `new VnpayClient()` cứng trong code | Truyền `PaymentGateway` interface qua Constructor Injection |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Open/Closed & Dependency Inversion)\n\nThiết kế hệ thống thanh toán mở rộng theo Strategy Pattern:\n\n```java\npackage vn.mastery.ecommerce.payment;\n\nimport java.util.Map;\n\n// 1. D & I: Interface nhỏ gọn, trừu tượng hóa\npublic interface PaymentGateway {\n    String getChannelCode();\n    PaymentResponse charge(String orderId, long amountCents);\n}\n\n// 2. O: Thêm cổng ZaloPay không cần sửa bất kỳ dòng code nào của OrderService\npublic class ZaloPayGateway implements PaymentGateway {\n    @Override public String getChannelCode() { return \"ZALOPAY\"; }\n    @Override public PaymentResponse charge(String orderId, long amountCents) {\n        // Thực thi gọi API ZaloPay...\n        return new PaymentResponse(\"SUCCESS\", \"TRANS-ZALO-9988\");\n    }\n}\n\n// 3. S & D: OrderPaymentService chỉ điều phối, phụ thuộc vào Map của các Gateway Interface\npublic class OrderPaymentService {\n    private final Map<String, PaymentGateway> gateways;\n\n    public OrderPaymentService(Map<String, PaymentGateway> gateways) {\n        this.gateways = gateways;\n    }\n\n    public PaymentResponse process(String channel, String orderId, long amount) {\n        PaymentGateway gateway = gateways.get(channel);\n        if (gateway == null) {\n            throw new IllegalArgumentException(\"Kênh thanh toán không được hỗ trợ: \" + channel);\n        }\n        return gateway.charge(orderId, amount);\n    }\n}\n```\n\n### Bảng Phân Tích Kiến Trúc SOLID:\n\n| Thành phần | Nguyên lý thỏa mãn | Lợi ích khi vận hành hệ thống |\n|---|---|---|\n| `interface PaymentGateway` | **D & I** | Cho phép dễ dàng viết Mock Unit Test mà không cần gọi API ngân hàng thật |\n| `ZaloPayGateway` | **O** | Khi tích hợp thêm Apple Pay, Momo chỉ cần tạo file mới -> Rủi ro gãy code cũ = 0% |\n| `OrderPaymentService` | **S** | Chỉ làm đúng nhiệm vụ tìm gateway và chuyển tiếp yêu cầu |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Lạm dụng Abstraction quá đà (Over-Engineering)\n- **Vấn đề**: Dự án chỉ có đúng 1 loại thanh toán duy nhất nhưng tạo ra 5 tầng Interface, AbstractClass, Adapter khiến việc đọc code mất hàng giờ.\n- **Giải pháp**: Tuân thủ quy tắc *YAGNI (You Aren't Gonna Need It)* và *Rule of Three*: Chỉ trừu tượng hóa khi bắt đầu xuất hiện trường hợp thứ 2 hoặc thứ 3.\n\n### Checklist Bài 2.3\n- [ ] Mỗi class chỉ phục vụ duy nhất 1 lý do để thay đổi (Single Responsibility).\n- [ ] Loại bỏ các chuỗi `switch-case` kiểm tra loại đối tượng để thay bằng Polymorphism.\n- [ ] Tuyệt đối không để class con ném ngoại lệ `UnsupportedOperationException` khi override.\n"
        },
        {
          "id": "j0-2-4",
          "type": "practice",
          "title": "Bài 2.4: Clean Class Design: Builder Pattern, Defensive Copying & Immutability",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải quyết bài toán \"Constructor ác mộng\" (Telescoping Constructor) bằng **Builder Pattern**.\n- Đảm bảo tính bất biến (Immutability) tuyệt đối cho các đối tượng tài chính DTO.\n- Áp dụng kỹ thuật sao chép phòng vệ (Defensive Copying) hai chiều.\n- So sánh Builder thủ công vs Java 21 Record Compact Constructor.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: GỌI MÓN THEO YÊU CẦU TẠI NHÀ HÀNG\n- **Telescoping Constructor**: Giống như phục vụ ép bạn phải đọc liền một câu dài: *\"Cho tôi 1 tô phở nhiều bánh, ít nước, không hành, thêm thịt bò tái, có quẩy, không trứng, nước ngọt Coca\"*. Chỉ cần đọc nhầm vị trí của \"quẩy\" và \"trứng\", bạn sẽ nhận nhầm món!\n- **Builder Pattern**: Giống như phiếu tích chọn món (Checklist):\n  - `builder.setPhanBanh(\"nhiều\").setHanh(false).setThit(\"tái\").build()`\n  - Rõ ràng, dễ đọc, không bao giờ nhầm thứ tự!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Builder Pattern Chuẩn Joshua Bloch)\n\n```mermaid\nflowchart LR\n    Client[\"Client Code\"] --> BInit[\"Order.builder()\"]\n    BInit --> B1[\".customerId('CUST-01')\"]\n    B1 --> B2[\".shippingAddress('Hà Nội')\"]\n    B2 --> B3[\".addItem(item)\"]\n    B3 --> Build[\".build()\"]\n    Build --> Order[\"Immutable Order Instance<br/>(Không thể sửa đổi sau khi tạo)\"]\n    style Order fill:#064e3b,stroke:#10b981,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Các Phương Pháp Khởi Tạo Đối Tượng)\n\n| Tiêu chí | Constructor thông thường | JavaBeans (Getters/Setters) | Builder Pattern (Chuẩn Effective Java) |\n|---|---|---|---|\n| **Số lượng thuộc tính** | Tốt khi $le 3$ thuộc tính | Linh hoạt nhưng rất nguy hiểm | Hoàn hảo khi $ge 4$ thuộc tính |\n| **Tính bất biến (Immutable)** | ✅ Có thể làm bất biến | ❌ Hoàn toàn khả biến (Mutable) | ✅ Bất biến 100% |\n| **Tính an toàn trạng thái** | Toàn vẹn lúc gọi constructor | Có thể bị dùng dở dang giữa chừng | Chỉ tạo object khi gọi `.build()` hợp lệ |\n| **Độ rõ nghĩa khi đọc** | Dễ nhầm giữa các tham số cùng kiểu (`String, String`) | Rõ ràng từng tên setter | Cực kỳ rõ ràng, fluent API mượt mà |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Triển Khai Builder & Defensive Copy)\n\n```java\npackage vn.mastery.ecommerce.dto;\n\nimport java.util.ArrayList;\nimport java.util.Collections;\nimport java.util.List;\nimport java.util.Objects;\n\npublic final class CustomerOrder {\n    private final String orderId;\n    private final String customerId;\n    private final List<String> itemSkus;\n\n    private CustomerOrder(Builder builder) {\n        this.orderId = Objects.requireNonNull(builder.orderId, \"orderId không được null\");\n        this.customerId = Objects.requireNonNull(builder.customerId, \"customerId không được null\");\n        // Defensive Copying chiều nạp vào: Ngăn builder sửa list sau khi build\n        this.itemSkus = Collections.unmodifiableList(new ArrayList<>(builder.itemSkus));\n    }\n\n    public String getOrderId() { return orderId; }\n    public String getCustomerId() { return customerId; }\n    // Defensive Copying chiều đọc ra\n    public List<String> getItemSkus() { return itemSkus; }\n\n    public static Builder builder() { return new Builder(); }\n\n    public static final class Builder {\n        private String orderId;\n        private String customerId;\n        private final List<String> itemSkus = new ArrayList<>();\n\n        public Builder orderId(String orderId) { this.orderId = orderId; return this; }\n        public Builder customerId(String customerId) { this.customerId = customerId; return this; }\n        public Builder addItem(String sku) { this.itemSkus.add(sku); return this; }\n\n        public CustomerOrder build() {\n            if (itemSkus.isEmpty()) throw new IllegalStateException(\"Đơn hàng không có sản phẩm!\");\n            return new CustomerOrder(this);\n        }\n    }\n}\n```\n\n### Bảng Phân Tích Kỹ Thuật Builder:\n\n| Chi tiết triển khai | Bản chất kỹ thuật | Mục đích bảo vệ |\n|---|---|---|\n| `private CustomerOrder(Builder)` | Constructor của class chính là `private` | Ép buộc 100% việc tạo object phải thông qua Builder |\n| `public final class` | Khóa kế thừa | Không cho phép bất kỳ class con nào phá vỡ tính bất biến |\n| `new ArrayList<>(builder.itemSkus)` | Defensive Copy 2 chiều | Ngăn việc Client sửa list bên ngoài làm thay đổi dữ liệu bên trong |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Quên Defensive Copying trong Builder\n- **Vấn đề**: Gán trực tiếp `this.itemSkus = builder.itemSkus`. Client sau khi gọi `CustomerOrder order = builder.build()` vẫn có thể gọi `builder.addItem(\"HACK\")` làm thay đổi đơn hàng đã chốt!\n- **Giải pháp**: Luôn bọc qua `new ArrayList<>()` và `Collections.unmodifiableList()`.\n\n### Checklist Bài 2.4\n- [ ] Sử dụng Builder Pattern cho các class có trên 4 tham số khởi tạo.\n- [ ] Đặt class là `final` và các trường là `private final` để đảm bảo tính bất biến.\n- [ ] Luôn kiểm tra tính hợp lệ dữ liệu trong phương thức `build()`.\n"
        },
        {
          "id": "j0-2-quiz",
          "type": "quiz",
          "title": "Sát Hạch Năng Lực Module 2: Lập Trình Hướng Đối Tượng & SOLID Thực Chiến",
          "minutes": 15,
          "questions": [
            {
              "level": "hard",
              "targetLessonId": "j0-2-3",
              "scenario": "Một class PaymentProcessor có cấu trúc: if (type.equals(\"CREDIT\")) payCredit(); else if (type.equals(\"MOMO\")) payMomo(); else if (type.equals(\"ZALO\")) payZalo(); Khi công ty muốn tích hợp thêm cổng thanh toán VNPay, lập trình viên bắt buộc phải sửa đổi code của PaymentProcessor.",
              "q": "Thiết kế trên đang vi phạm nguyên lý SOLID nào nghiêm trọng nhất?",
              "options": [
                "Open/Closed Principle (OCP) — Module nên mở cho việc mở rộng (Open for extension) nhưng đóng với việc sửa đổi (Closed for modification).",
                "Single Responsibility Principle (SRP) — Class có quá ít dòng code.",
                "Liskov Substitution Principle (LSP) — Class con không thể thay thế class cha.",
                "Interface Segregation Principle (ISP) — Interface quá nhiều method."
              ],
              "answer": 0,
              "explain": "Việc dùng if-else kiểm tra kiểu thanh toán vi phạm nguyên lý Open/Closed Principle (OCP). Giải pháp chuẩn mực là tạo interface PaymentMethod với method pay(), sau đó mỗi loại thanh toán (MomoPayment, VnpayPayment) sẽ tự implement riêng. PaymentProcessor chỉ phụ thuộc vào interface này, khi thêm cổng thanh toán mới không cần sửa lại code cũ."
            },
            {
              "level": "hard",
              "targetLessonId": "j0-2-4",
              "scenario": "Một lập trình viên tạo class Order với field private final List<OrderItem> items; và viết getter: public List<OrderItem> getItems() { return this.items; } Một developer khác viết code: order.getItems().clear();",
              "q": "Lỗ hổng bảo mật và kiến trúc nào đang xảy ra ở đây?",
              "options": [
                "Lỗ hổng để lộ tham chiếu khả biến (Mutable Reference Leak) làm phá vỡ tính đóng gói (Encapsulation) của đối tượng.",
                "Lỗi vi phạm nguyên lý Interface Segregation.",
                "Hiện tượng rò rỉ bộ nhớ Metaspace Leak.",
                "Lỗi Deadlock do tranh chấp khóa danh sách."
              ],
              "answer": 0,
              "explain": "Getter trả về trực tiếp đối tượng List nội bộ cho phép bên ngoài có thể gọi hàm .add(), .clear(), .remove() làm sai lệch trạng thái đơn hàng mà class Order không hề kiểm soát được. Giải pháp là áp dụng Defensive Copying: return Collections.unmodifiableList(this.items) hoặc List.copyOf(this.items)."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-2-2",
              "scenario": "Cho hai class: class SuperClass { public void show() {} } và class SubClass extends SuperClass { public void show() {} } Biến được gọi: SuperClass obj = new SubClass(); obj.show();",
              "q": "Cơ chế nào của JVM được kích hoạt để thực thi phương thức show() của SubClass?",
              "options": [
                "Dynamic Binding (Late Binding) thông qua lệnh bytecode invokevirtual tra cứu bảng vtable tại Runtime.",
                "Static Binding thông qua lệnh invokestatic tại thời điểm Compile-time.",
                "Cơ chế Reflection ép kiểu ngầm định.",
                "Cơ chế nạp chồng phương thức Method Overloading."
              ],
              "answer": 0,
              "explain": "Các phương thức thông thường (non-static, non-private, non-final) trong Java đều là Virtual Method. Tại Runtime, JVM thực hiện lệnh invokevirtual để tra cứu bảng phương thức ảo (vtable) của đối tượng thực tế trên Heap (SubClass) để gọi đúng phương thức đã được override."
            },
            {
              "level": "hard",
              "targetLessonId": "j0-2-3",
              "scenario": "Một interface OrderRepository định nghĩa 15 phương thức bao gồm: saveOrder(), findById(), exportOrderToPdf(), sendSmsConfirmation(), calculateTax().",
              "q": "Interface này vi phạm những nguyên lý SOLID nào?",
              "options": [
                "Vi phạm Single Responsibility Principle (SRP) và Interface Segregation Principle (ISP).",
                "Vi phạm Dependency Inversion Principle (DIP).",
                "Vi phạm Liskov Substitution Principle (LSP).",
                "Không vi phạm nguyên lý nào vì interface càng đầy đủ chức năng càng tốt."
              ],
              "answer": 0,
              "explain": "Một repository chỉ nên chịu trách nhiệm truy xuất cơ sở dữ liệu cho Order (SRP). Việc nhét thêm xuất PDF và gửi SMS khiến interface bị phình to (Fat Interface). Các class implement phải chịu trách nhiệm về những chức năng nó không quan tâm, vi phạm nghiêm trọng Interface Segregation Principle (ISP)."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-2-1",
              "scenario": "Trong thiết kế hướng đối tượng, Anemic Domain Model là một anti-pattern phổ biến.",
              "q": "Đặc điểm nhận diện rõ ràng nhất của Anemic Domain Model là gì?",
              "options": [
                "Entity chỉ chứa các thuộc tính private cùng toàn bộ Getters/Setters thụ động, không chứa bất kỳ logic nghiệp vụ nào.",
                "Entity chứa quá nhiều phương thức tính toán phức tạp.",
                "Entity không kế thừa từ bất kỳ class cha nào.",
                "Entity sử dụng Java Record thay cho Class thông thường."
              ],
              "answer": 0,
              "explain": "Anemic Domain Model là class chỉ có dữ liệu (data container) mà thiếu hẳn hành vi (behavior). Toàn bộ logic nghiệp vụ bị phân tán và đưa ra các Service class khổng lồ. Thiết kế Rich Domain Model đưa logic validation và chuyển đổi trạng thái (state machine) vào chính Entity."
            },
            {
              "level": "hard",
              "targetLessonId": "j0-2-3",
              "scenario": "Class Square kế thừa từ class Rectangle. Khi client gọi rect.setWidth(10); rect.setHeight(20);, nếu là đối tượng Square, cả chiều rộng và dài đều biến thành 20, làm sai lệch kỳ vọng tính diện tích của Rectangle.",
              "q": "Đây là ví dụ kinh điển vi phạm nguyên lý nào trong SOLID?",
              "options": [
                "Liskov Substitution Principle (LSP) — Đối tượng của class con không thể thay thế cho class cha mà không làm thay đổi tính đúng đắn của chương trình.",
                "Single Responsibility Principle (SRP).",
                "Dependency Inversion Principle (DIP).",
                "Open/Closed Principle (OCP)."
              ],
              "answer": 0,
              "explain": "Theo nguyên lý Liskov (LSP), nếu S là class con của T, thì các đối tượng kiểu T phải có thể được thay thế bởi đối tượng kiểu S mà không làm gián đoạn chương trình. Square thay đổi hành vi bất biến của Rectangle (cho phép thay đổi độc lập width và height), do đó Square không thể là con hợp lệ của Rectangle trong OOP."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-2-4",
              "scenario": "Một lập trình viên muốn xây dựng một class Order bất biến (Immutable Class) an toàn trong môi trường đa luồng.",
              "q": "Quy tắc nào sau đây KHÔNG bắt buộc khi thiết kế Immutable Class trong Java?",
              "options": [
                "Bắt buộc toàn bộ các phương thức của class phải được đánh dấu là synchronized.",
                "Đánh dấu class là final (hoặc private constructor) để ngăn chặn class con kế thừa ghi đè.",
                "Tất cả các field phải là private và final.",
                "Không cung cấp bất kỳ setter nào và áp dụng Defensive Copying với các thuộc tính là mutable object."
              ],
              "answer": 0,
              "explain": "Immutable Class đạt được sự an toàn đa luồng (Thread-safety) tự nhiên do trạng thái của nó không bao giờ thay đổi sau khi khởi tạo. Do đó, hoàn toàn không cần thiết phải đánh dấu các method là synchronized, giúp tối ưu hóa hiệu năng tối đa."
            },
            {
              "level": "hard",
              "targetLessonId": "j0-2-2",
              "scenario": "Trong Constructor của class cha (BaseOrder), lập trình viên gọi phương thức init(). Class con (VipOrder) override lại init() và sử dụng một thuộc tính vipCode được khai báo trong VipOrder.",
              "q": "Hiện tượng tai hại nào sẽ xảy ra khi chạy new VipOrder()?",
              "options": [
                "init() của class con được gọi trước khi các field của class con kịp khởi tạo, dẫn đến vipCode mang giá trị null gây ra NullPointerException bí ẩn.",
                "Java compiler báo lỗi đỏ Compile Error tại dòng gọi init().",
                "JVM tự động hoãn lời gọi init() cho tới khi toàn bộ class con hoàn tất.",
                "Class cha tự động bỏ qua phương thức override của class con."
              ],
              "answer": 0,
              "explain": "Đây là cạm bẫy OOP cực kỳ nguy hiểm. Constructor của class cha luôn chạy trước constructor của con. Do Dynamic Binding, lời gọi init() trong constructor cha sẽ dispatch tới method init() của class con. Lúc này, các field của class con chưa hề được khởi tạo và đang mang giá trị mặc định (null/0), dẫn đến crash hệ thống."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-2-4",
              "scenario": "Builder Pattern thường được áp dụng cho các Entity có nhiều thuộc tính tùy chọn.",
              "q": "Lợi ích vượt trội của Builder Pattern so với Telescoping Constructor (nhiều constructor nạp chồng) là gì?",
              "options": [
                "Mã nguồn dễ đọc, linh hoạt thiết lập thuộc tính theo tên hàm, và cho phép kiểm tra tính toàn vẹn (validate) dữ liệu trước khi build() object.",
                "Giúp tiết kiệm 100% dung lượng bộ nhớ Heap.",
                "Tự động đồng bộ hóa đa luồng cho đối tượng.",
                "Giúp class tự động chuyển thành interface."
              ],
              "answer": 0,
              "explain": "Telescoping Constructor (như Order(a), Order(a,b), Order(a,b,c)) cực kỳ dễ gây nhầm lẫn thứ tự tham số cùng kiểu dữ liệu. Builder Pattern cung cấp cú pháp Fluent API rõ ràng, dễ bảo trì và cho phép kiểm tra tính hợp lệ của toàn bộ thuộc tính tại method build()."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-2-3",
              "scenario": "Nguyên lý Dependency Inversion Principle (DIP) yêu cầu các module cấp cao không nên phụ thuộc vào module cấp thấp.",
              "q": "Quy chuẩn kiến trúc nào thể hiện đúng nguyên lý DIP?",
              "options": [
                "Cả module cấp cao (OrderService) và cấp thấp (SqlOrderRepository) đều phụ thuộc vào một abstraction (OrderRepository interface).",
                "Module cấp cao gọi trực tiếp new SqlOrderRepository() trong constructor của nó.",
                "Tất cả các class phải phụ thuộc vào class cha chung Object.",
                "Mọi class chỉ được phép giao tiếp thông qua socket mạng."
              ],
              "answer": 0,
              "explain": "DIP khẳng định: Cả module cấp cao và cấp thấp đều phải phụ thuộc vào Abstraction (Interface/Abstract Class). Nhờ đó, OrderService có thể dễ dàng hoán đổi từ SqlOrderRepository sang MongoOrderRepository hoặc MockOrderRepository cho Unit Test mà không phải sửa 1 dòng code logic."
            },
            {
              "level": "easy",
              "targetLessonId": "j0-2-1",
              "scenario": "Tính đóng gói (Encapsulation) trong lập trình hướng đối tượng.",
              "q": "Mục đích cốt lõi của tính đóng gói là gì?",
              "options": [
                "Ẩn giấu chi tiết cài đặt bên trong và bảo vệ trạng thái của đối tượng khỏi sự can thiệp trực tiếp không hợp lệ từ bên ngoài.",
                "Tự động biên dịch code thành mã máy nhị phân.",
                "Cho phép tất cả các class trong project truy cập tự do vào field của nhau.",
                "Tăng tốc độ kết nối cơ sở dữ liệu."
              ],
              "answer": 0,
              "explain": "Đóng gói kết hợp dữ liệu (fields) và hành vi (methods) vào cùng một đơn vị (class), đồng thời sử dụng các access modifier (private, protected) để ngăn chặn việc sửa đổi dữ liệu tùy tiện từ bên ngoài, duy trì tính đúng đắn của đối tượng (Invariants)."
            },
            {
              "level": "hard",
              "targetLessonId": "j0-2-2",
              "scenario": "Một class có phương thức nạp chồng: public void log(Object o) và public void log(String s). Khi gọi logger.log(null);",
              "q": "Phương thức nào sẽ được trình biên dịch lựa chọn và tại sao?",
              "options": [
                "log(String s) — Vì String là kiểu dữ liệu cụ thể và hẹp hơn (more specific) so với Object trong cây kế thừa.",
                "log(Object o) — Vì Object là kiểu cha bao quát mọi kiểu dữ liệu.",
                "Compile Error — Báo lỗi mơ hồ (Ambiguous method call) không thể biên dịch.",
                "Ném ra NullPointerException tại thời điểm Runtime."
              ],
              "answer": 0,
              "explain": "Theo Java Language Specification (JLS), khi chọn phương thức overload, compiler sẽ ưu tiên phương thức có kiểu tham số cụ thể nhất (most specific subtype). Do String là con trực tiếp của Object nên compiler sẽ chọn log(String). Nếu có 2 nhánh con ngang hàng (ví dụ String và Integer), lúc đó mới báo lỗi ambiguous."
            }
          ]
        }
      ],
      "quiz": {
        "id": "j0-2-quiz",
        "title": "Sát Hạch Năng Lực Module 2: Lập Trình Hướng Đối Tượng & SOLID Thực Chiến",
        "poolSize": 12,
        "pullCount": 12,
        "passThresholdPct": 80,
        "questions": [
          {
            "level": "hard",
            "targetLessonId": "j0-2-3",
            "scenario": "Một class PaymentProcessor có cấu trúc: if (type.equals(\"CREDIT\")) payCredit(); else if (type.equals(\"MOMO\")) payMomo(); else if (type.equals(\"ZALO\")) payZalo(); Khi công ty muốn tích hợp thêm cổng thanh toán VNPay, lập trình viên bắt buộc phải sửa đổi code của PaymentProcessor.",
            "q": "Thiết kế trên đang vi phạm nguyên lý SOLID nào nghiêm trọng nhất?",
            "options": [
              "Open/Closed Principle (OCP) — Module nên mở cho việc mở rộng (Open for extension) nhưng đóng với việc sửa đổi (Closed for modification).",
              "Single Responsibility Principle (SRP) — Class có quá ít dòng code.",
              "Liskov Substitution Principle (LSP) — Class con không thể thay thế class cha.",
              "Interface Segregation Principle (ISP) — Interface quá nhiều method."
            ],
            "answer": 0,
            "explain": "Việc dùng if-else kiểm tra kiểu thanh toán vi phạm nguyên lý Open/Closed Principle (OCP). Giải pháp chuẩn mực là tạo interface PaymentMethod với method pay(), sau đó mỗi loại thanh toán (MomoPayment, VnpayPayment) sẽ tự implement riêng. PaymentProcessor chỉ phụ thuộc vào interface này, khi thêm cổng thanh toán mới không cần sửa lại code cũ."
          },
          {
            "level": "hard",
            "targetLessonId": "j0-2-4",
            "scenario": "Một lập trình viên tạo class Order với field private final List<OrderItem> items; và viết getter: public List<OrderItem> getItems() { return this.items; } Một developer khác viết code: order.getItems().clear();",
            "q": "Lỗ hổng bảo mật và kiến trúc nào đang xảy ra ở đây?",
            "options": [
              "Lỗ hổng để lộ tham chiếu khả biến (Mutable Reference Leak) làm phá vỡ tính đóng gói (Encapsulation) của đối tượng.",
              "Lỗi vi phạm nguyên lý Interface Segregation.",
              "Hiện tượng rò rỉ bộ nhớ Metaspace Leak.",
              "Lỗi Deadlock do tranh chấp khóa danh sách."
            ],
            "answer": 0,
            "explain": "Getter trả về trực tiếp đối tượng List nội bộ cho phép bên ngoài có thể gọi hàm .add(), .clear(), .remove() làm sai lệch trạng thái đơn hàng mà class Order không hề kiểm soát được. Giải pháp là áp dụng Defensive Copying: return Collections.unmodifiableList(this.items) hoặc List.copyOf(this.items)."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-2-2",
            "scenario": "Cho hai class: class SuperClass { public void show() {} } và class SubClass extends SuperClass { public void show() {} } Biến được gọi: SuperClass obj = new SubClass(); obj.show();",
            "q": "Cơ chế nào của JVM được kích hoạt để thực thi phương thức show() của SubClass?",
            "options": [
              "Dynamic Binding (Late Binding) thông qua lệnh bytecode invokevirtual tra cứu bảng vtable tại Runtime.",
              "Static Binding thông qua lệnh invokestatic tại thời điểm Compile-time.",
              "Cơ chế Reflection ép kiểu ngầm định.",
              "Cơ chế nạp chồng phương thức Method Overloading."
            ],
            "answer": 0,
            "explain": "Các phương thức thông thường (non-static, non-private, non-final) trong Java đều là Virtual Method. Tại Runtime, JVM thực hiện lệnh invokevirtual để tra cứu bảng phương thức ảo (vtable) của đối tượng thực tế trên Heap (SubClass) để gọi đúng phương thức đã được override."
          },
          {
            "level": "hard",
            "targetLessonId": "j0-2-3",
            "scenario": "Một interface OrderRepository định nghĩa 15 phương thức bao gồm: saveOrder(), findById(), exportOrderToPdf(), sendSmsConfirmation(), calculateTax().",
            "q": "Interface này vi phạm những nguyên lý SOLID nào?",
            "options": [
              "Vi phạm Single Responsibility Principle (SRP) và Interface Segregation Principle (ISP).",
              "Vi phạm Dependency Inversion Principle (DIP).",
              "Vi phạm Liskov Substitution Principle (LSP).",
              "Không vi phạm nguyên lý nào vì interface càng đầy đủ chức năng càng tốt."
            ],
            "answer": 0,
            "explain": "Một repository chỉ nên chịu trách nhiệm truy xuất cơ sở dữ liệu cho Order (SRP). Việc nhét thêm xuất PDF và gửi SMS khiến interface bị phình to (Fat Interface). Các class implement phải chịu trách nhiệm về những chức năng nó không quan tâm, vi phạm nghiêm trọng Interface Segregation Principle (ISP)."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-2-1",
            "scenario": "Trong thiết kế hướng đối tượng, Anemic Domain Model là một anti-pattern phổ biến.",
            "q": "Đặc điểm nhận diện rõ ràng nhất của Anemic Domain Model là gì?",
            "options": [
              "Entity chỉ chứa các thuộc tính private cùng toàn bộ Getters/Setters thụ động, không chứa bất kỳ logic nghiệp vụ nào.",
              "Entity chứa quá nhiều phương thức tính toán phức tạp.",
              "Entity không kế thừa từ bất kỳ class cha nào.",
              "Entity sử dụng Java Record thay cho Class thông thường."
            ],
            "answer": 0,
            "explain": "Anemic Domain Model là class chỉ có dữ liệu (data container) mà thiếu hẳn hành vi (behavior). Toàn bộ logic nghiệp vụ bị phân tán và đưa ra các Service class khổng lồ. Thiết kế Rich Domain Model đưa logic validation và chuyển đổi trạng thái (state machine) vào chính Entity."
          },
          {
            "level": "hard",
            "targetLessonId": "j0-2-3",
            "scenario": "Class Square kế thừa từ class Rectangle. Khi client gọi rect.setWidth(10); rect.setHeight(20);, nếu là đối tượng Square, cả chiều rộng và dài đều biến thành 20, làm sai lệch kỳ vọng tính diện tích của Rectangle.",
            "q": "Đây là ví dụ kinh điển vi phạm nguyên lý nào trong SOLID?",
            "options": [
              "Liskov Substitution Principle (LSP) — Đối tượng của class con không thể thay thế cho class cha mà không làm thay đổi tính đúng đắn của chương trình.",
              "Single Responsibility Principle (SRP).",
              "Dependency Inversion Principle (DIP).",
              "Open/Closed Principle (OCP)."
            ],
            "answer": 0,
            "explain": "Theo nguyên lý Liskov (LSP), nếu S là class con của T, thì các đối tượng kiểu T phải có thể được thay thế bởi đối tượng kiểu S mà không làm gián đoạn chương trình. Square thay đổi hành vi bất biến của Rectangle (cho phép thay đổi độc lập width và height), do đó Square không thể là con hợp lệ của Rectangle trong OOP."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-2-4",
            "scenario": "Một lập trình viên muốn xây dựng một class Order bất biến (Immutable Class) an toàn trong môi trường đa luồng.",
            "q": "Quy tắc nào sau đây KHÔNG bắt buộc khi thiết kế Immutable Class trong Java?",
            "options": [
              "Bắt buộc toàn bộ các phương thức của class phải được đánh dấu là synchronized.",
              "Đánh dấu class là final (hoặc private constructor) để ngăn chặn class con kế thừa ghi đè.",
              "Tất cả các field phải là private và final.",
              "Không cung cấp bất kỳ setter nào và áp dụng Defensive Copying với các thuộc tính là mutable object."
            ],
            "answer": 0,
            "explain": "Immutable Class đạt được sự an toàn đa luồng (Thread-safety) tự nhiên do trạng thái của nó không bao giờ thay đổi sau khi khởi tạo. Do đó, hoàn toàn không cần thiết phải đánh dấu các method là synchronized, giúp tối ưu hóa hiệu năng tối đa."
          },
          {
            "level": "hard",
            "targetLessonId": "j0-2-2",
            "scenario": "Trong Constructor của class cha (BaseOrder), lập trình viên gọi phương thức init(). Class con (VipOrder) override lại init() và sử dụng một thuộc tính vipCode được khai báo trong VipOrder.",
            "q": "Hiện tượng tai hại nào sẽ xảy ra khi chạy new VipOrder()?",
            "options": [
              "init() của class con được gọi trước khi các field của class con kịp khởi tạo, dẫn đến vipCode mang giá trị null gây ra NullPointerException bí ẩn.",
              "Java compiler báo lỗi đỏ Compile Error tại dòng gọi init().",
              "JVM tự động hoãn lời gọi init() cho tới khi toàn bộ class con hoàn tất.",
              "Class cha tự động bỏ qua phương thức override của class con."
            ],
            "answer": 0,
            "explain": "Đây là cạm bẫy OOP cực kỳ nguy hiểm. Constructor của class cha luôn chạy trước constructor của con. Do Dynamic Binding, lời gọi init() trong constructor cha sẽ dispatch tới method init() của class con. Lúc này, các field của class con chưa hề được khởi tạo và đang mang giá trị mặc định (null/0), dẫn đến crash hệ thống."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-2-4",
            "scenario": "Builder Pattern thường được áp dụng cho các Entity có nhiều thuộc tính tùy chọn.",
            "q": "Lợi ích vượt trội của Builder Pattern so với Telescoping Constructor (nhiều constructor nạp chồng) là gì?",
            "options": [
              "Mã nguồn dễ đọc, linh hoạt thiết lập thuộc tính theo tên hàm, và cho phép kiểm tra tính toàn vẹn (validate) dữ liệu trước khi build() object.",
              "Giúp tiết kiệm 100% dung lượng bộ nhớ Heap.",
              "Tự động đồng bộ hóa đa luồng cho đối tượng.",
              "Giúp class tự động chuyển thành interface."
            ],
            "answer": 0,
            "explain": "Telescoping Constructor (như Order(a), Order(a,b), Order(a,b,c)) cực kỳ dễ gây nhầm lẫn thứ tự tham số cùng kiểu dữ liệu. Builder Pattern cung cấp cú pháp Fluent API rõ ràng, dễ bảo trì và cho phép kiểm tra tính hợp lệ của toàn bộ thuộc tính tại method build()."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-2-3",
            "scenario": "Nguyên lý Dependency Inversion Principle (DIP) yêu cầu các module cấp cao không nên phụ thuộc vào module cấp thấp.",
            "q": "Quy chuẩn kiến trúc nào thể hiện đúng nguyên lý DIP?",
            "options": [
              "Cả module cấp cao (OrderService) và cấp thấp (SqlOrderRepository) đều phụ thuộc vào một abstraction (OrderRepository interface).",
              "Module cấp cao gọi trực tiếp new SqlOrderRepository() trong constructor của nó.",
              "Tất cả các class phải phụ thuộc vào class cha chung Object.",
              "Mọi class chỉ được phép giao tiếp thông qua socket mạng."
            ],
            "answer": 0,
            "explain": "DIP khẳng định: Cả module cấp cao và cấp thấp đều phải phụ thuộc vào Abstraction (Interface/Abstract Class). Nhờ đó, OrderService có thể dễ dàng hoán đổi từ SqlOrderRepository sang MongoOrderRepository hoặc MockOrderRepository cho Unit Test mà không phải sửa 1 dòng code logic."
          },
          {
            "level": "easy",
            "targetLessonId": "j0-2-1",
            "scenario": "Tính đóng gói (Encapsulation) trong lập trình hướng đối tượng.",
            "q": "Mục đích cốt lõi của tính đóng gói là gì?",
            "options": [
              "Ẩn giấu chi tiết cài đặt bên trong và bảo vệ trạng thái của đối tượng khỏi sự can thiệp trực tiếp không hợp lệ từ bên ngoài.",
              "Tự động biên dịch code thành mã máy nhị phân.",
              "Cho phép tất cả các class trong project truy cập tự do vào field của nhau.",
              "Tăng tốc độ kết nối cơ sở dữ liệu."
            ],
            "answer": 0,
            "explain": "Đóng gói kết hợp dữ liệu (fields) và hành vi (methods) vào cùng một đơn vị (class), đồng thời sử dụng các access modifier (private, protected) để ngăn chặn việc sửa đổi dữ liệu tùy tiện từ bên ngoài, duy trì tính đúng đắn của đối tượng (Invariants)."
          },
          {
            "level": "hard",
            "targetLessonId": "j0-2-2",
            "scenario": "Một class có phương thức nạp chồng: public void log(Object o) và public void log(String s). Khi gọi logger.log(null);",
            "q": "Phương thức nào sẽ được trình biên dịch lựa chọn và tại sao?",
            "options": [
              "log(String s) — Vì String là kiểu dữ liệu cụ thể và hẹp hơn (more specific) so với Object trong cây kế thừa.",
              "log(Object o) — Vì Object là kiểu cha bao quát mọi kiểu dữ liệu.",
              "Compile Error — Báo lỗi mơ hồ (Ambiguous method call) không thể biên dịch.",
              "Ném ra NullPointerException tại thời điểm Runtime."
            ],
            "answer": 0,
            "explain": "Theo Java Language Specification (JLS), khi chọn phương thức overload, compiler sẽ ưu tiên phương thức có kiểu tham số cụ thể nhất (most specific subtype). Do String là con trực tiếp của Object nên compiler sẽ chọn log(String). Nếu có 2 nhánh con ngang hàng (ví dụ String và Integer), lúc đó mới báo lỗi ambiguous."
          }
        ]
      },
      "subtitle": "OOP Pillars, Dynamic Binding, 5 SOLID Principles & Clean Class Architecture",
      "outcomes": [
        "Thiết kế Rich Domain Model chuẩn mực, bảo vệ Invariants và triệt tiêu Anemic Domain Model",
        "Hiểu sâu cơ chế Dynamic Binding, Invokevirtual và cách thức JVM tra cứu bảng vtable",
        "Vận dụng thuần thục 5 nguyên lý SOLID vào kiến trúc thanh toán E-Commerce",
        "Áp dụng Builder Pattern, Defensive Copying và kiến trúc Class bất biến (Immutable Class)"
      ],
      "topics": [
        {
          "id": 1,
          "title": "4 Trụ Cột OOP & Cơ Chế Binding"
        },
        {
          "id": 2,
          "title": "5 Nguyên Lý SOLID & Clean Design"
        }
      ],
      "retrievalWarmup": [
        {
          "q": "Tại sao nên dùng Math.multiplyExact() thay vì toán tử nhân (*) thông thường khi tính toán tài chính?",
          "options": [
            "Vì Math.multiplyExact() sẽ ném ngoại lệ ArithmeticException ngay khi xảy ra tràn số nguyên.",
            "Vì Math.multiplyExact() chạy nhanh gấp 10 lần toán tử nhân.",
            "Vì toán tử nhân thông thường không hỗ trợ kiểu dữ liệu long.",
            "Vì Math.multiplyExact() tự động làm tròn số thập phân."
          ],
          "answer": 0,
          "explain": "Toán tử * khi vượt quá phạm vi lưu trữ sẽ âm thầm tràn số và đổi thành số âm mà không báo lỗi, gây tổn thất tài chính nghiêm trọng. Math.multiplyExact() bảo vệ hệ thống bằng cách ném ArithmeticException."
        },
        {
          "q": "Phát biểu nào sau đây đúng về cơ chế truyền tham số trong Java?",
          "options": [
            "Java là 100% Pass-by-value đối với cả kiểu nguyên thủy và kiểu đối tượng tham chiếu.",
            "Java truyền kiểu nguyên thủy bằng Pass-by-value, truyền đối tượng bằng Pass-by-reference.",
            "Java chỉ truyền Pass-by-value nếu có từ khóa final.",
            "Java cho phép chọn Pass-by-reference bằng con trỏ pointer."
          ],
          "answer": 0,
          "explain": "Java chỉ có duy nhất cơ chế Pass-by-value. Khi truyền đối tượng, giá trị được sao chép chính là địa chỉ tham chiếu (reference address) trỏ tới object trên Heap."
        },
        {
          "q": "String Constant Pool trong Java 21 được lưu trữ tại vùng nhớ nào?",
          "options": [
            "Java Heap Space",
            "Metaspace",
            "Native C-Heap",
            "Thread Stack"
          ],
          "answer": 0,
          "explain": "Từ Java 7 trở đi, String Constant Pool đã được chuyển hoàn toàn về vùng nhớ Java Heap để được Garbage Collector dọn dẹp khi không còn tham chiếu."
        }
      ]
    },
    {
      "id": 103,
      "title": "Java Collections Framework & Thuật Toán Ứng Dụng",
      "icon": "📦",
      "color": "#2563eb",
      "desc": "ArrayList, LinkedList, Hashing HashMap, Cây Đỏ Đen TreeSet, PriorityQueue.",
      "lessons": [
        {
          "id": "j0-3-1",
          "type": "theory",
          "title": "Bài 3.1: Tổng Quan Collection Hierarchy: ArrayList vs LinkedList",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Nắm vững cây phả hệ Java Collections Framework: `Iterable` -> `Collection` -> `List`, `Set`, `Queue`.\n- So sánh bản chất bộ nhớ và hiệu năng giữa `ArrayList` (Mảng động liên tục) và `LinkedList` (Danh sách liên kết đôi).\n- Giải mã tại sao trên phần cứng máy tính hiện đại, `ArrayList` hầu như luôn đánh bại `LinkedList`.\n- Nắm bắt cơ chế tự động mở rộng dung lượng (Growth Factor 1.5x) của `ArrayList`.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: DÃY GHẾ LIỀN NHAU VÀ TRÒ CHƠI NẮM TAY\n- **ArrayList**: Giống như một hàng ghế dài có đánh số từ 0 đến 99 trong rạp chiếu phim. Bạn muốn tìm người ở ghế số 45? Chỉ cần liếc mắt 1 giây là thấy ngay (`O(1)` Random Access).\n- **LinkedList**: Giống như 100 người đứng rải rác khắp công viên, người này nắm tay người kia. Bạn muốn tìm người thứ 45? Bạn bắt buộc phải chạy từ người số 1, hỏi xem họ đang nắm tay ai, lần mò từng bước qua 44 người mới tới (`O(N)` Traversal)!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Bộ Nhớ ArrayList vs LinkedList)\n\n```mermaid\nflowchart TD\n    subgraph ARRAY_LIST [\"ArrayList: Vùng nhớ liên tục (Contiguous Memory)\"]\n        A0[\"[0] 0x10\"] --- A1[\"[1] 0x18\"] --- A2[\"[2] 0x20\"] --- A3[\"[3] 0x28\"]\n    end\n\n    subgraph LINKED_LIST [\"LinkedList: Các Node rải rác trên Heap\"]\n        N1[\"Node 1 (0x500)<br/>prev: null<br/>next: 0x880\"] -.->|\"Con trỏ\"| N2[\"Node 2 (0x880)<br/>prev: 0x500<br/>next: 0x920\"] -.->|\"Con trỏ\"| N3[\"Node 3 (0x920)\"]\n    end\n\n    style ARRAY_LIST fill:#064e3b,stroke:#10b981,color:#fff\n    style LINKED_LIST fill:#7f1d1d,stroke:#ef4444,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Độ Phức Tạp Thuật Toán)\n\n| Thao tác | `ArrayList` | `LinkedList` | Lý do thực tế |\n|---|---|---|---|\n| **Truy cập theo chỉ số (`get(i)`)** | ⭐ **$O(1)$** | ❌ **$O(N)$** | ArrayList tính địa chỉ: `base + i * size`; LinkedList phải duyệt từng Node |\n| **Thêm vào cuối (`add(e)`)** | ⭐ **$O(1)$** (Amortized) | ⭐ **$O(1)$** | ArrayList thỉnh thoảng resize; LinkedList chỉ tạo Node mới |\n| **Chèn/Xóa ở giữa (`add(i, e)`)** | $O(N)$ (Copy mảng) | $O(N)$ (Tìm vị trí) | Dù LinkedList trỏ node nhanh nhưng vẫn tốn $O(N)$ tìm kiếm |\n| **CPU Cache Friendliness** | ⭐ **Rất cao (Spatial Locality)** | ❌ **Rất thấp (Cache Miss)** | CPU nạp nguyên Cache Line 64 bytes của ArrayList vào L1/L2 cache |\n| **Chi phí bộ nhớ phụ trội** | Rất thấp (Chỉ mảng rỗng) | Cực cao (24 bytes overhead/Node) | LinkedList ngốn thêm con trỏ `prev`, `next` và Node wrapper |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Tối Ưu Hiệu Năng ArrayList)\n\n```java\npackage vn.mastery.ecommerce.collection;\n\nimport java.util.ArrayList;\nimport java.util.List;\n\npublic class CartService {\n\n    // ✅ CHUẨN SENIOR: Khởi tạo với dung lượng dự tính để triệt tiêu Resize\n    public List<String> processBatchOrder(int expectedItems) {\n        // Tránh mảng phải resize từ 10 -> 15 -> 22 -> 33...\n        List<String> orderList = new ArrayList<>(expectedItems);\n\n        for (int i = 0; i < expectedItems; i++) {\n            orderList.add(\"ORD-ITEM-\" + i);\n        }\n        return orderList;\n    }\n}\n```\n\n### Bảng Phân Tích Logic Mở Rộng Dung Lượng ArrayList:\n\n| Trạng thái mảng | Hành động của JVM | Chi phí hiệu năng |\n|---|---|---|\n| Kích thước vượt quá Capacity | JVM tính toán: `newCapacity = oldCapacity + (oldCapacity >> 1)` (Tăng 1.5 lần) | Cấp phát mảng mới trên Heap |\n| `Arrays.copyOf()` | Gọi hàm native của C++ sao chép vùng nhớ mảng cũ sang mảng mới | Tiêu tốn CPU và sinh mảng cũ thành rác cho GC |\n| `new ArrayList<>(expectedItems)` | Cấp phát duy nhất 1 mảng vừa vặn ngay từ đầu | Tốc độ thêm phần tử đạt tối đa $O(1)$ liên tục |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Sử dụng LinkedList vì nghĩ rằng nó chèn nhanh hơn\n- **Vấn đề**: Các sách giáo khoa cũ thường khuyên \"muốn chèn nhiều thì dùng LinkedList\". Thực tế trên CPU hiện đại, do LinkedList phân mảnh khắp RAM, CPU liên tục bị Cache Miss khiến thao tác chèn của LinkedList chậm hơn ArrayList gấp 5 đến 10 lần!\n- **Giải pháp**: Mặc định **luôn luôn dùng `ArrayList`** trong 99% các bài toán danh sách.\n\n### Checklist Bài 3.1\n- [ ] Luôn khai báo kiểu Interface: `List<T> list = new ArrayList<>();`.\n- [ ] Chỉ định Initial Capacity nếu biết trước số lượng phần tử xấp xỉ.\n- [ ] Hạn chế tối đa việc sử dụng `LinkedList` trừ khi làm Queue đơn giản.\n"
        },
        {
          "id": "j0-3-2",
          "type": "theory",
          "title": "Bài 3.2: Bản Chất Hashing, Bucket Collision & Hợp Đồng Equals() / HashCode()",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải phẫu cấu trúc nội bộ của `HashMap` trong Java: Mảng Buckets, Băm modulo, Cây Đỏ Đen (Treeify).\n- Hiểu tường tận nguyên nhân suy biến từ $O(1)$ thành $O(N)$ khi băm xung đột (Collision).\n- Nắm vững **Hợp đồng equals() và hashCode()**: Cùng hashCode chưa chắc equals, nhưng đã equals bắt buộc phải cùng hashCode!\n- Khắc phục lỗi rò rỉ dữ liệu khi dùng Mutable Object làm khóa HashMap.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỦ GỬI ĐỒ CÓ 16 NGĂN\n- Bạn vào siêu thị gửi túi xách:\n  - Nhân viên nhìn tên bạn, tính toán ra số 5 (Băm - Hash function).\n  - Họ mở ngăn tủ số 5 và cất túi xách của bạn vào đó.\n- **Xung đột (Collision)**: Nếu người tiếp theo cũng băm ra số 5, ngăn số 5 sẽ móc thêm một chiếc giỏ treo túi của họ vào chung (LinkedList).\n- Nếu có quá nhiều người chung ngăn số 5 (vượt quá 8 người), nhân viên sẽ biến ngăn số 5 thành một chiếc giá xoay thông minh (Cây Đỏ Đen - Red-Black Tree) để tìm kiếm trong nháy mắt (`O(\\log N)`)!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Cấu Trúc Dữ Liệu HashMap)\n\n```mermaid\nflowchart TD\n    subgraph HASHMAP [\"Cấu Trúc HashMap: Mảng Node<K,V>[] table\"]\n        B0[\"Bucket 0: null\"]\n        B1[\"Bucket 1: Node(K1,V1) -> Node(K2,V2) (Collision List)\"]\n        B2[\"Bucket 2: null\"]\n        B3[\"Bucket 3: TreeNode (Đã Treeify khi >= 8 phần tử)\"]\n    end\n    style HASHMAP fill:#064e3b,stroke:#10b981,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Quy Chuẩn Hợp Đồng Equals & HashCode)\n\n| Trường hợp | Kết quả `a.equals(b)` | Kết quả `a.hashCode() == b.hashCode()` | Hợp lệ theo chuẩn Java Specification? |\n|---|---|---|---|\n| Hai đối tượng tương đương | `true` | **BẮT BUỘC `true`** | ✅ **Bắt buộc tuyệt đối** |\n| Hai đối tượng khác nhau | `false` | Có thể `true` (Xung đột băm) | ✅ Được phép (Nhưng càng ít xung đột càng tốt) |\n| **Vi phạm nghiêm trọng** | `true` | `false` | ❌ **VI PHẠM HỢP ĐỒNG** (Mất tích dữ liệu trong HashMap/HashSet) |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Override Đúng Chuẩn Cho Khóa Đơn Hàng)\n\n```java\npackage vn.mastery.ecommerce.model;\n\nimport java.util.Objects;\n\npublic final class OrderKey {\n    private final String tenantId;\n    private final String orderId;\n\n    public OrderKey(String tenantId, String orderId) {\n        this.tenantId = Objects.requireNonNull(tenantId);\n        this.orderId = Objects.requireNonNull(orderId);\n    }\n\n    @Override\n    public boolean equals(Object o) {\n        if (this == o) return true; // Cùng ô nhớ -> Bằng nhau ngay lập tức\n        if (o == null || getClass() != o.getClass()) return false;\n        OrderKey orderKey = (OrderKey) o;\n        return Objects.equals(tenantId, orderKey.tenantId) &&\n               Objects.equals(orderId, orderKey.orderId);\n    }\n\n    @Override\n    public int hashCode() {\n        // Thuật toán nhân 31 chuẩn của Joshua Bloch\n        return Objects.hash(tenantId, orderId);\n    }\n}\n```\n\n### Bảng Phân Tích Logic HashMap `put()` & `get()`:\n\n| Bước thực thi | Thao tác toán học / logic | Bản chất cơ chế |\n|---|---|---|\n| 1. Tính Hash | `h = key.hashCode() ^ (h >>> 16)` | Trộn các bit bậc cao xuống bậc thấp (Spread hash bits) |\n| 2. Định vị Bucket | `index = (table.length - 1) & h` | Phép AND bit tương đương `h % length` (Với length là lũy thừa của 2) |\n| 3. Kiểm tra trùng | Kiểm tra `key == node.key || (equals)` | Tìm đúng phần tử để cập nhật value hoặc chèn mới |\n| 4. Treeify Threshold | Khi bucket có $ge 8$ phần tử và dung lượng bảng $ge 64$ | Chuyển LinkedList thành Red-Black Tree để chặn tấn công Hash DoS |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Thay đổi thuộc tính của đối tượng sau khi đã đưa vào làm Key\n- **Vấn đề**: Đưa object vào `map.put(key, val)`. Sau đó sửa `key.setName(\"NEW\")`. Khi gọi `map.get(key)`, `hashCode` đã đổi, HashMap tìm vào sai bucket và báo `null` dù dữ liệu vẫn còn nguyên trong RAM!\n- **Giải pháp**: Luôn dùng **Đối tượng Bất biến (Immutable Objects)** như `String`, `UUID`, hoặc `Record` làm Khóa cho HashMap/HashSet.\n\n### Checklist Bài 3.2\n- [ ] Luôn override đồng thời cả `equals()` và `hashCode()` cùng nhau.\n- [ ] Đảm bảo các field tham gia vào `equals()` đều có mặt trong `hashCode()`.\n- [ ] Khóa của HashMap/HashSet phải là đối tượng bất biến (Immutable).\n"
        },
        {
          "id": "j0-3-3",
          "type": "practice",
          "title": "Bài 3.3: Cây Đỏ Đen (Red-Black Tree), TreeSet & So Sánh Comparable vs Comparator",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải mã cấu trúc dữ liệu Cây Đỏ Đen (Red-Black Tree) tự cân bằng trong `TreeMap` và `TreeSet`.\n- Đảm bảo độ phức tạp $O(\\log N)$ ổn định cho các tác vụ tìm kiếm, thêm, xóa.\n- Phân biệt bản chất giữa sắp xếp tự nhiên (`Comparable`) và sắp xếp tùy biến linh hoạt (`Comparator`).\n- Viết bộ so sánh đa tiêu chí cho đơn hàng E-Commerce bằng cú pháp Lambda hiện đại.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BẢN NĂNG TỰ CÂN BẰNG CỦA CÂY ĐỎ ĐEN\n- Nếu bạn trồng một cái cây và chỉ tưới nước cho một bên, cây sẽ bị nghiêng và đổ gãy (Cây nhị phân suy biến thành danh sách thẳng hàng $O(N)$).\n- **Cây Đỏ Đen**: Giống như một cái cây ma thuật thông minh. Bất cứ khi nào một nhánh mọc quá dài, các cành cây tự động xoay chuyển (Left/Right Rotation) và đổi màu (Red/Black Recolor) để đảm bảo độ cao của các nhánh không bao giờ chênh lệch quá 2 lần!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Cây Đỏ Đen Trong Java TreeSet)\n\n```mermaid\nflowchart TD\n    Root[\"Đơn 500k (Black - Gốc)\"]\n    L1[\"Đơn 200k (Black)\"]\n    R1[\"Đơn 800k (Black)\"]\n    L1_L[\"Đơn 100k (Red)\"]\n    L1_R[\"Đơn 350k (Red)\"]\n    R1_R[\"Đơn 1000k (Red)\"]\n\n    Root --- L1\n    Root --- R1\n    L1 --- L1_L\n    L1 --- L1_R\n    R1 --- R1_R\n    style Root fill:#0f172a,stroke:#38bdf8,color:#fff\n    style L1_L fill:#7f1d1d,stroke:#ef4444,color:#fff\n    style L1_R fill:#7f1d1d,stroke:#ef4444,color:#fff\n    style R1_R fill:#7f1d1d,stroke:#ef4444,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Comparable vs Comparator)\n\n| Tiêu chí | `Comparable<T>` | `Comparator<T>` |\n|---|---|---|\n| **Vị trí định nghĩa** | Viết trực tiếp bên trong Class đối tượng | Viết ở một class riêng hoặc Lambda biểu thức |\n| **Phương thức cốt lõi** | `public int compareTo(T o)` | `public int compare(T o1, T o2)` |\n| **Số lượng tiêu chí** | Duy nhất **1 thứ tự sắp xếp tự nhiên** mặc định | Có thể tạo **vô số thứ tự** khác nhau tùy ngữ cảnh |\n| **Sửa đổi mã nguồn** | Bắt buộc phải có quyền sửa class ban đầu | Không cần sửa class ban đầu (Dùng được cho class thư viện ngoài) |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Sắp Xếp Đơn Hàng Đa Tiêu Chí)\n\n```java\npackage vn.mastery.ecommerce.sorting;\n\nimport java.time.Instant;\nimport java.util.Comparator;\nimport java.util.Set;\nimport java.util.TreeSet;\n\npublic class OrderSortingEngine {\n\n    public record OrderSummary(String id, long amount, Instant createdAt) implements Comparable<OrderSummary> {\n        // 1. Thứ tự tự nhiên: Theo ngày tạo giảm dần (Đơn mới nhất lên đầu)\n        @Override\n        public int compareTo(OrderSummary other) {\n            return other.createdAt.compareTo(this.createdAt);\n        }\n    }\n\n    // 2. Thứ tự tùy biến: Ưu tiên đơn số tiền cao nhất, nếu bằng tiền thì đơn mới hơn lên trước\n    public static final Comparator<OrderSummary> VIP_COMPARATOR = Comparator\n        .comparingLong(OrderSummary::amount).reversed()\n        .thenComparing(OrderSummary::createdAt, Comparator.reverseOrder());\n\n    public static void main(String[] args) {\n        Set<OrderSummary> vipQueue = new TreeSet<>(VIP_COMPARATOR);\n        vipQueue.add(new OrderSummary(\"ORD-1\", 500_000L, Instant.now()));\n        vipQueue.add(new OrderSummary(\"ORD-2\", 2_000_000L, Instant.now()));\n        vipQueue.add(new OrderSummary(\"ORD-3\", 500_000L, Instant.now().minusSeconds(60)));\n\n        // Đơn 2 triệu sẽ luôn đứng đầu danh sách!\n        vipQueue.forEach(o -> System.out.println(o.id() + \": \" + o.amount()));\n    }\n}\n```\n\n### Bảng Phân Tích Kỹ Thuật Comparator Chaining:\n\n| Cú pháp | Hành vi kỹ thuật | Giá trị thực tiễn |\n|---|---|---|\n| `comparingLong(...)` | Tránh Autoboxing sang đối tượng `Long` | Tối ưu CPU khi so sánh hàng vạn phần tử |\n| `.reversed()` | Đảo ngược thứ tự so sánh (Từ bé -> lớn thành lớn -> bé) | Đưa các khách hàng VIP nhiều tiền lên ưu tiên trước |\n| `.thenComparing(...)` | Tiêu chí phụ (Secondary Sort) khi tiêu chí 1 bằng nhau | Đảm bảo tính ổn định và không làm mất phần tử trong `TreeSet` |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Nuốt mất phần tử trong TreeSet do Comparator trả về 0\n- **Vấn đề**: `TreeSet` xác định 2 phần tử trùng nhau bằng `compare() == 0` chứ **không dùng `equals()`**! Nếu 2 đơn hàng có cùng số tiền và Comparator chỉ so sánh theo `amount`, đơn hàng thứ hai sẽ **bị vứt bỏ âm thầm**!\n- **Giải pháp**: Luôn bổ sung tiêu chí ID duy nhất ở cuối chuỗi so sánh: `.thenComparing(Order::id)`.\n\n### Checklist Bài 3.3\n- [ ] Luôn đảm bảo `compareTo()` nhất quán với `equals()` (`(x.compareTo(y)==0) == (x.equals(y))`).\n- [ ] Bổ sung khóa định danh duy nhất vào `thenComparing()` để chống mất dữ liệu trong `TreeSet`.\n"
        },
        {
          "id": "j0-3-4",
          "type": "practice",
          "title": "Bài 3.4: Hàng Đợi Ưu Tiên PriorityQueue, ArrayDeque & Thread-Safe Collections",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Làm chủ cấu trúc dữ liệu Hàng Đợi Ưu Tiên (`PriorityQueue` - Min/Max Binary Heap).\n- Phân biệt `ArrayDeque` (Double-Ended Queue) và `Stack` cổ lỗ sĩ bị khuyến cáo tránh dùng.\n- Hiểu rõ sự khác biệt giữa `ConcurrentHashMap` và `Collections.synchronizedMap()`.\n- Xây dựng hàng đợi điều phối giao dịch Flash Sale theo độ ưu tiên khách hàng VIP.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: PHÒNG CẤP CỨU BỆNH VIỆN\n- **Queue thông thường (FIFO - Vào trước ra trước)**: Giống như xếp hàng mua vé xem phim. Ai đến trước mua trước.\n- **PriorityQueue (Hàng đợi ưu tiên)**: Giống như phòng cấp cứu bệnh viện! Dù một bệnh nhân bị cảm cúm đến trước 1 tiếng, nhưng khi có ca tai nạn nguy kịch (Độ ưu tiên cao nhất) vừa đến cửa, ca tai nạn sẽ được đẩy lên bàn mổ xử lý ngay lập tức!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Min-Heap Trong PriorityQueue)\n\n```mermaid\nflowchart TD\n    subgraph HEAP [\"PriorityQueue: Cấu Trúc Binary Heap (Mảng Phẳng)\"]\n        H0[\"[0] VIP Khẩn Cấp (Ưu tiên 1)\"]\n        H1[\"[1] Khách VIP (Ưu tiên 2)\"]\n        H2[\"[2] Đơn Thường (Ưu tiên 3)\"]\n        H0 --- H1\n        H0 --- H2\n    end\n    style HEAP fill:#064e3b,stroke:#10b981,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Các Cấu Trúc Hàng Đợi)\n\n| Cấu trúc dữ liệu | Cơ chế hoạt động | Độ phức tạp `poll()` | An toàn đa luồng? | Trường hợp sử dụng |\n|---|---|---|---|---|\n| **`ArrayDeque`** | FIFO hoặc LIFO (Circular Array) | ⭐ $O(1)$ | ❌ Không | Thay thế hoàn toàn class `Stack` cũ kỹ |\n| **`PriorityQueue`** | Min-Heap / Max-Heap | $O(\\log N)$ | ❌ Không | Sắp xếp lịch chạy tác vụ, Dijkstra, Flash Sale |\n| **`ConcurrentLinkedQueue`** | Non-blocking Lock-Free (CAS) | $O(1)$ | ✅ **Thread-safe** | Hệ thống đa luồng chịu tải cao |\n| **`ArrayBlockingQueue`** | Bounded Blocking Queue (ReentrantLock) | $O(1)$ | ✅ **Thread-safe** | Làm Buffer điều phối Producer - Consumer |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Điều Phối Đơn Hàng VIP Flash Sale)\n\n```java\npackage vn.mastery.ecommerce.queue;\n\nimport java.util.PriorityQueue;\nimport java.util.Queue;\n\npublic class FlashSaleDispatcher {\n\n    public record FlashOrder(String orderId, int priorityTier, long amount) implements Comparable<FlashOrder> {\n        // Số tier càng nhỏ độ ưu tiên càng cao (Tier 1 = Kim cương, Tier 3 = Thường)\n        @Override\n        public int compareTo(FlashOrder o) {\n            return Integer.compare(this.priorityTier, o.priorityTier);\n        }\n    }\n\n    public static void main(String[] args) {\n        Queue<FlashOrder> orderQueue = new PriorityQueue<>();\n\n        // Nạp đơn hàng lộn xộn\n        orderQueue.offer(new FlashOrder(\"ORD-NORMAL-1\", 3, 200_000L));\n        orderQueue.offer(new FlashOrder(\"ORD-VIP-DIAMOND\", 1, 50_000_000L));\n        orderQueue.offer(new FlashOrder(\"ORD-VIP-GOLD\", 2, 5_000_000L));\n\n        // Rút đơn hàng ra xử lý: Luôn lấy đơn quan trọng nhất trước!\n        while (!orderQueue.isEmpty()) {\n            FlashOrder next = orderQueue.poll();\n            System.out.println(\"Đang xử lý: \" + next.orderId() + \" (Tier: \" + next.priorityTier() + \")\");\n        }\n    }\n}\n```\n\n### Bảng Phân Tích Thao Tác Binary Heap:\n\n| Phương thức | Chi phí thời gian | Cơ chế thực thi |\n|---|---|---|\n| `offer(e)` | $O(\\log N)$ | Thêm phần tử vào cuối mảng rồi sàng lên (Sift-Up) để giữ tính chất Heap |\n| `poll()` | $O(\\log N)$ | Lấy phần tử gốc (Root), lấy lá cuối mảng đưa lên đầu rồi sàng xuống (Sift-Down) |\n| `peek()` | $O(1)$ | Chỉ đọc giá trị tại `elementData[0]` mà không làm thay đổi mảng |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Sửa đổi thuộc tính của phần tử khi nó đang nằm trong PriorityQueue\n- **Vấn đề**: Sau khi `orderQueue.offer(order)`, bạn sửa `order.setPriority(1)`. `PriorityQueue` **không tự sắp xếp lại**! Thứ tự heap bị sai lệch hoàn toàn.\n- **Giải pháp**: Nếu cần đổi độ ưu tiên, bắt buộc phải `remove(order)`, sửa thuộc tính, rồi `offer()` lại.\n\n### Checklist Bài 3.4\n- [ ] Tuyệt đối không dùng class cổ điển `Vector` và `Stack` (Đã lỗi thời từ Java 1.2).\n- [ ] Dùng `ArrayDeque` khi cần cấu trúc Ngăn xếp (Stack) hoặc Hàng đợi (Queue) đơn luồng.\n- [ ] Dùng `PriorityQueue` khi cần liên tục lấy ra phần tử có độ ưu tiên cao nhất.\n"
        },
        {
          "id": "j0-3-quiz",
          "type": "quiz",
          "title": "Sát Hạch Năng Lực Module 3: Java Collections Framework & Cấu Trúc Dữ Liệu Chuyên Sâu",
          "minutes": 15,
          "questions": [
            {
              "level": "hard",
              "targetLessonId": "j0-3-2",
              "scenario": "Một class CustomerKey chỉ override phương thức equals(Object o) để so sánh mã khách hàng, nhưng quên không override phương thức hashCode(). Lập trình viên đưa CustomerKey vào HashMap: map.put(key1, \"VIP_DATA\"); Sau đó gọi: map.get(key2); với key1.equals(key2) == true.",
              "q": "Hiện tượng gì sẽ xảy ra và nguyên nhân kỹ thuật bên dưới là gì?",
              "options": [
                "map.get(key2) trả về null — Vì key1 và key2 có mã hashCode() mặc định khác nhau (do địa chỉ ô nhớ khác nhau), dẫn đến tra cứu nhầm bucket trong HashMap.",
                "map.get(key2) vẫn lấy được đúng \"VIP_DATA\" vì HashMap chỉ quan tâm hàm equals().",
                "HashMap tự động ném ra ngoại lệ IllegalStateException.",
                "Toàn bộ HashMap bị xóa sạch dữ liệu."
              ],
              "answer": 0,
              "explain": "Đây là lỗi vi phạm Hợp đồng equals() và hashCode() kinh điển: Hai đối tượng equals bằng true BẮT BUỘC phải có cùng hashCode(). HashMap dựa vào hashCode() để tính chỉ số bucket index: index = (n - 1) & hash. Nếu hashCode khác nhau, JVM sẽ tìm kiếm ở một bucket hoàn toàn khác và trả về null dù equals() là true!"
            },
            {
              "level": "hard",
              "targetLessonId": "j0-3-2",
              "scenario": "Lập trình viên sử dụng một đối tượng khả biến (Mutable Object) làm Key trong HashMap: CustomerKey key = new CustomerKey(\"C01\"); map.put(key, order); Sau đó, thuộc tính của key bị thay đổi: key.setId(\"C02\");",
              "q": "Hậu quả thực tế xảy ra trên môi trường Production là gì?",
              "options": [
                "Dữ liệu của order bị 'mất tích' vĩnh viễn trong Map; gọi map.get(key) trả về null và gây rò rỉ ô nhớ (Memory Leak) vì không thể xóa được phần tử này.",
                "HashMap tự động phát hiện và tính toán lại vị trí bucket cho key mới.",
                "Chương trình ném ra ConcurrentModificationException.",
                "Key tự động khôi phục lại giá trị ban đầu là 'C01'."
              ],
              "answer": 0,
              "explain": "Khi put, vị trí bucket được tính dựa trên hashCode của 'C01'. Khi sửa thành 'C02', hashCode của key thay đổi. Khi get(key), HashMap tính chỉ số bucket dựa trên hashCode mới và tìm ở bucket khác -> trả về null. Node cũ vẫn nằm ở bucket cũ nhưng không thể truy xuất hay remove được, gây Memory Leak nghiêm trọng."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-3-1",
              "scenario": "So sánh hiệu năng giữa ArrayList và LinkedList trong Java.",
              "q": "Tại sao trong thực tế phát triển phần mềm doanh nghiệp hiện đại, ArrayList hầu như luôn được ưu tiên hơn LinkedList ngay cả khi có nhiều thao tác chèn/xóa?",
              "options": [
                "ArrayList lưu trữ mảng liên tục trên ô nhớ nên tận dụng tối đa CPU L1/L2 Cache Locality và không tốn chi phí con trỏ Node như LinkedList.",
                "LinkedList không hỗ trợ đa luồng còn ArrayList hỗ trợ đa luồng an toàn.",
                "ArrayList có dung lượng không giới hạn còn LinkedList bị giới hạn tối đa 65,536 phần tử.",
                "Vì LinkedList đã bị Java 21 đánh dấu là deprecated."
              ],
              "answer": 0,
              "explain": "LinkedList phân mảnh bộ nhớ vì mỗi Node là một object riêng biệt (tốn thêm 24 byte con trỏ next/prev trên 64-bit JVM). Khi duyệt LinkedList, CPU liên tục bị Cache Miss vì các Node nằm rải rác trên Heap. ArrayList lưu các phần tử kế tiếp nhau trong mảng, CPU tải trước toàn bộ Cache Line vào L1/L2 Cache giúp tốc độ duyệt nhanh hơn từ 5-10 lần."
            },
            {
              "level": "hard",
              "targetLessonId": "j0-3-2",
              "scenario": "Trong Java 8 trở lên, khi một bucket trong HashMap xảy ra quá nhiều xung đột băm (Hash Collision), JVM sẽ thực hiện tối ưu hóa cấu trúc dữ liệu.",
              "q": "Điều kiện và cấu trúc dữ liệu chuyển đổi của bucket trong HashMap là gì?",
              "options": [
                "Khi số phần tử trong 1 bucket vượt quá 8 (TREEIFY_THRESHOLD) và tổng capacity >= 64, danh sách liên kết đơn sẽ chuyển hóa thành Cây Đỏ Đen (Red-Black Tree) với độ phức tạp O(log N).",
                "Chuyển hóa toàn bộ HashMap thành HashTable để đảm bảo đồng bộ.",
                "Chuyển bucket thành mảng hai chiều với độ phức tạp O(1).",
                "Tự động xóa bớt các phần tử trùng lặp để giảm kích thước."
              ],
              "answer": 0,
              "explain": "Để chống lại các cuộc tấn công DoS Hash Collision (kẻ xấu cố tình gửi các key có cùng hashCode để biến HashMap thành Linked List O(N)), Java chuyển bucket thành Cây Đỏ Đen khi bucket có >= 8 node, đảm bảo hiệu năng tra cứu xấu nhất chỉ là O(log N)."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-3-3",
              "scenario": "Một hệ thống cần lưu trữ danh sách đơn hàng được sắp xếp theo thời gian tạo và tự động loại bỏ các đơn hàng trùng mã ID.",
              "q": "Collection nào sau đây là lựa chọn phù hợp nhất?",
              "options": [
                "TreeSet kết hợp với Comparator theo thời gian tạo.",
                "ArrayList kết hợp Collections.sort().",
                "HashSet thông thường.",
                "LinkedList."
              ],
              "answer": 0,
              "explain": "TreeSet triển khai NavigableSet dựa trên cấu trúc Cây Đỏ Đen (Red-Black Tree). Nó đảm bảo 2 tính chất: Không chứa phần tử trùng lặp (Set) và các phần tử luôn được duy trì ở trạng thái có thứ tự theo Comparator hoặc Comparable."
            },
            {
              "level": "hard",
              "targetLessonId": "j0-3-4",
              "scenario": "Một lập trình viên duyệt danh sách đơn hàng và xóa các đơn đã hủy: for (Order o : orderList) { if (o.isCancelled()) orderList.remove(o); }",
              "q": "Ngoại lệ nào sẽ bị ném ra tại thời điểm thực thi và nguyên nhân là gì?",
              "options": [
                "ConcurrentModificationException — Do cơ chế Fail-Fast của Iterator phát hiện modCount bị thay đổi mà không thông qua Iterator.remove().",
                "NullPointerException — Do phần tử bị gán thành null.",
                "IndexOutOfBoundsException — Do chỉ số mảng vượt quá độ dài.",
                "Không có lỗi nào phát sinh, code chạy hoàn hảo."
              ],
              "answer": 0,
              "explain": "Vòng lặp for-each bản chất sử dụng Iterator bên dưới. ArrayList duy trì biến modCount đếm số lần sửa đổi cấu trúc. Khi gọi orderList.remove(o) trực tiếp, modCount tăng lên nhưng expectedModCount của Iterator không đổi, dẫn đến cơ chế Fail-Fast kích hoạt và ném ConcurrentModificationException. Giải pháp là dùng iterator.remove() hoặc orderList.removeIf()."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-3-4",
              "scenario": "Trong hệ thống xử lý tác vụ nền (Background Job), các tác vụ cần được xử lý theo mức độ khẩn cấp (Priority High xử lý trước Priority Low).",
              "q": "Cấu trúc dữ liệu nào trong Java Collections được thiết kế tối ưu nhất cho kịch bản này?",
              "options": [
                "PriorityQueue — Cấu trúc Hàng đợi ưu tiên dựa trên cây nhị phân Min/Max Heap.",
                "ArrayDeque — Hàng đợi hai đầu LIFO/FIFO thông thường.",
                "LinkedList — Danh sách liên kết hai chiều.",
                "Stack — Ngăn xếp truyền thống."
              ],
              "answer": 0,
              "explain": "PriorityQueue sắp xếp các phần tử dựa trên thứ tự tự nhiên (Comparable) hoặc Comparator thông qua cấu trúc Min/Max Heap. Thao tác poll() luôn lấy ra phần tử có độ ưu tiên cao nhất với thời gian O(log N)."
            },
            {
              "level": "hard",
              "targetLessonId": "j0-3-4",
              "scenario": "Một ứng dụng đa luồng có 95% thao tác là đọc danh sách cấu hình và chỉ 5% là ghi (thêm/sửa cấu hình).",
              "q": "Collection nào sau đây mang lại hiệu năng đọc đồng thời cao nhất mà không cần lock đồng bộ?",
              "options": [
                "CopyOnWriteArrayList — Cho phép thao tác đọc không cần khóa (lock-free), mỗi lần ghi sẽ sao chép toàn bộ mảng ngầm định.",
                "Collections.synchronizedList(new ArrayList<>()) — Khóa toàn bộ danh sách ở mọi thao tác đọc và ghi.",
                "Vector — Class đồng bộ truyền thống từ Java 1.0.",
                "ArrayList thông thường không đồng bộ."
              ],
              "answer": 0,
              "explain": "CopyOnWriteArrayList cực kỳ phù hợp cho mô hình Read-Heavy, Write-Rare. Thao tác đọc truy cập trực tiếp vào mảng snapshot hiện tại mà không tốn chi phí khóa. Khi ghi, nó tạo bản sao mảng mới nên thao tác ghi tốn chi phí, nhưng đảm bảo tính nhất quán tuyệt đối cho hàng triệu luồng đọc đồng thời."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-3-1",
              "scenario": "Hệ số tải mặc định (Default Load Factor) của HashMap trong Java là 0.75.",
              "q": "Ý nghĩa của hệ số tải 0.75 là gì?",
              "options": [
                "Khi số lượng phần tử vượt quá 75% sức chứa hiện tại (capacity), HashMap sẽ tự động mở rộng gấp đôi (resize) và rehash lại toàn bộ dữ liệu.",
                "Mỗi bucket chỉ được phép chứa tối đa 75 phần tử.",
                "HashMap chỉ sử dụng 75% dung lượng RAM của JVM.",
                "Hiệu suất tra cứu của HashMap đạt 75% so với mảng nguyên thủy."
              ],
              "answer": 0,
              "explain": "Hệ số tải (Load Factor) là tỷ lệ ngưỡng để kích hoạt việc tăng dung lượng bảng băm. Giá trị 0.75 là mức cân bằng hoàn hảo giữa chi phí không gian (bộ nhớ RAM) và chi phí thời gian (xác suất xảy ra collision trong các phép toán get/put)."
            },
            {
              "level": "easy",
              "targetLessonId": "j0-3-1",
              "scenario": "Lập trình viên tạo danh sách: List<String> list = Arrays.asList(\"A\", \"B\"); Sau đó gọi list.add(\"C\");",
              "q": "Kết quả thực thi dòng lệnh trên là gì?",
              "options": [
                "Ném ra UnsupportedOperationException — Vì Arrays.asList() trả về danh sách có kích thước cố định (fixed-size wrapper) bọc lấy mảng ban đầu.",
                "Phần tử \"C\" được thêm thành công vào danh sách.",
                "Mảng tự động tăng kích thước thành 3 phần tử.",
                "Chương trình bị lỗi biên dịch Compile Error."
              ],
              "answer": 0,
              "explain": "Arrays.asList() tạo ra một wrapper kiểu java.util.Arrays$ArrayList bao bọc lấy mảng nguyên thủy, có kích thước cố định. Bạn có thể sửa phần tử cũ (.set()), nhưng không thể gọi .add() hay .remove(), nếu gọi sẽ ném UnsupportedOperationException. Trong Java 21, List.of() thậm chí còn bất biến hoàn toàn (immutable)."
            },
            {
              "level": "hard",
              "targetLessonId": "j0-3-3",
              "scenario": "Hai interface Comparable và Comparator được dùng để sắp xếp đối tượng trong Java.",
              "q": "Điểm khác biệt kiến trúc mấu chốt giữa Comparable và Comparator là gì?",
              "options": [
                "Comparable định nghĩa thứ tự tự nhiên (Natural ordering) bên trong chính class (hàm compareTo); Comparator định nghĩa chiến lược sắp xếp tùy biến bên ngoài class (hàm compare).",
                "Comparable chỉ áp dụng cho số nguyên, Comparator chỉ áp dụng cho chuỗi ký tự.",
                "Comparable chạy chậm hơn Comparator vì dùng Reflection.",
                "Comparable là class cha của Comparator."
              ],
              "answer": 0,
              "explain": "Comparable<T> (phương thức compareTo) định nghĩa thứ tự mặc định của chính đối tượng đó. Comparator<T> (phương thức compare) là một Strategy Pattern độc lập cho phép định nghĩa nhiều cách sắp xếp khác nhau (sắp xếp theo giá, theo tên, theo ngày) mà không cần can thiệp sửa đổi mã nguồn của Entity."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-3-2",
              "scenario": "Một bảng băm HashMap có kích thước capacity ban đầu là 16.",
              "q": "Tại sao kích thước capacity của HashMap luôn bắt buộc phải là lũy thừa của 2 (2^N)?",
              "options": [
                "Để phép toán chia lấy dư tính chỉ số bucket index = hash % capacity có thể tối ưu thành phép toán bitwise siêu tốc: index = (capacity - 1) & hash.",
                "Vì hệ điều hành 64-bit chỉ hỗ trợ mảng có kích thước chẵn.",
                "Để ngăn cản việc rò rỉ bộ nhớ Heap.",
                "Vì thuật toán băm MurmurHash yêu cầu độ dài chẵn."
              ],
              "answer": 0,
              "explain": "Phép toán chia lấy dư (%) trong CPU rất tốn clock cycles. Khi capacity là lũy thừa của 2 (ví dụ 16 = 00010000_b), (capacity - 1) sẽ là chuỗi toàn bit 1 (15 = 00001111_b). Phép toán bitwise AND '&' trên thanh ghi CPU chỉ tốn 1 clock cycle và phân bổ đều các bit băm vào mảng."
            }
          ]
        }
      ],
      "quiz": {
        "id": "j0-3-quiz",
        "title": "Sát Hạch Năng Lực Module 3: Java Collections Framework & Cấu Trúc Dữ Liệu Chuyên Sâu",
        "poolSize": 12,
        "pullCount": 12,
        "passThresholdPct": 80,
        "questions": [
          {
            "level": "hard",
            "targetLessonId": "j0-3-2",
            "scenario": "Một class CustomerKey chỉ override phương thức equals(Object o) để so sánh mã khách hàng, nhưng quên không override phương thức hashCode(). Lập trình viên đưa CustomerKey vào HashMap: map.put(key1, \"VIP_DATA\"); Sau đó gọi: map.get(key2); với key1.equals(key2) == true.",
            "q": "Hiện tượng gì sẽ xảy ra và nguyên nhân kỹ thuật bên dưới là gì?",
            "options": [
              "map.get(key2) trả về null — Vì key1 và key2 có mã hashCode() mặc định khác nhau (do địa chỉ ô nhớ khác nhau), dẫn đến tra cứu nhầm bucket trong HashMap.",
              "map.get(key2) vẫn lấy được đúng \"VIP_DATA\" vì HashMap chỉ quan tâm hàm equals().",
              "HashMap tự động ném ra ngoại lệ IllegalStateException.",
              "Toàn bộ HashMap bị xóa sạch dữ liệu."
            ],
            "answer": 0,
            "explain": "Đây là lỗi vi phạm Hợp đồng equals() và hashCode() kinh điển: Hai đối tượng equals bằng true BẮT BUỘC phải có cùng hashCode(). HashMap dựa vào hashCode() để tính chỉ số bucket index: index = (n - 1) & hash. Nếu hashCode khác nhau, JVM sẽ tìm kiếm ở một bucket hoàn toàn khác và trả về null dù equals() là true!"
          },
          {
            "level": "hard",
            "targetLessonId": "j0-3-2",
            "scenario": "Lập trình viên sử dụng một đối tượng khả biến (Mutable Object) làm Key trong HashMap: CustomerKey key = new CustomerKey(\"C01\"); map.put(key, order); Sau đó, thuộc tính của key bị thay đổi: key.setId(\"C02\");",
            "q": "Hậu quả thực tế xảy ra trên môi trường Production là gì?",
            "options": [
              "Dữ liệu của order bị 'mất tích' vĩnh viễn trong Map; gọi map.get(key) trả về null và gây rò rỉ ô nhớ (Memory Leak) vì không thể xóa được phần tử này.",
              "HashMap tự động phát hiện và tính toán lại vị trí bucket cho key mới.",
              "Chương trình ném ra ConcurrentModificationException.",
              "Key tự động khôi phục lại giá trị ban đầu là 'C01'."
            ],
            "answer": 0,
            "explain": "Khi put, vị trí bucket được tính dựa trên hashCode của 'C01'. Khi sửa thành 'C02', hashCode của key thay đổi. Khi get(key), HashMap tính chỉ số bucket dựa trên hashCode mới và tìm ở bucket khác -> trả về null. Node cũ vẫn nằm ở bucket cũ nhưng không thể truy xuất hay remove được, gây Memory Leak nghiêm trọng."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-3-1",
            "scenario": "So sánh hiệu năng giữa ArrayList và LinkedList trong Java.",
            "q": "Tại sao trong thực tế phát triển phần mềm doanh nghiệp hiện đại, ArrayList hầu như luôn được ưu tiên hơn LinkedList ngay cả khi có nhiều thao tác chèn/xóa?",
            "options": [
              "ArrayList lưu trữ mảng liên tục trên ô nhớ nên tận dụng tối đa CPU L1/L2 Cache Locality và không tốn chi phí con trỏ Node như LinkedList.",
              "LinkedList không hỗ trợ đa luồng còn ArrayList hỗ trợ đa luồng an toàn.",
              "ArrayList có dung lượng không giới hạn còn LinkedList bị giới hạn tối đa 65,536 phần tử.",
              "Vì LinkedList đã bị Java 21 đánh dấu là deprecated."
            ],
            "answer": 0,
            "explain": "LinkedList phân mảnh bộ nhớ vì mỗi Node là một object riêng biệt (tốn thêm 24 byte con trỏ next/prev trên 64-bit JVM). Khi duyệt LinkedList, CPU liên tục bị Cache Miss vì các Node nằm rải rác trên Heap. ArrayList lưu các phần tử kế tiếp nhau trong mảng, CPU tải trước toàn bộ Cache Line vào L1/L2 Cache giúp tốc độ duyệt nhanh hơn từ 5-10 lần."
          },
          {
            "level": "hard",
            "targetLessonId": "j0-3-2",
            "scenario": "Trong Java 8 trở lên, khi một bucket trong HashMap xảy ra quá nhiều xung đột băm (Hash Collision), JVM sẽ thực hiện tối ưu hóa cấu trúc dữ liệu.",
            "q": "Điều kiện và cấu trúc dữ liệu chuyển đổi của bucket trong HashMap là gì?",
            "options": [
              "Khi số phần tử trong 1 bucket vượt quá 8 (TREEIFY_THRESHOLD) và tổng capacity >= 64, danh sách liên kết đơn sẽ chuyển hóa thành Cây Đỏ Đen (Red-Black Tree) với độ phức tạp O(log N).",
              "Chuyển hóa toàn bộ HashMap thành HashTable để đảm bảo đồng bộ.",
              "Chuyển bucket thành mảng hai chiều với độ phức tạp O(1).",
              "Tự động xóa bớt các phần tử trùng lặp để giảm kích thước."
            ],
            "answer": 0,
            "explain": "Để chống lại các cuộc tấn công DoS Hash Collision (kẻ xấu cố tình gửi các key có cùng hashCode để biến HashMap thành Linked List O(N)), Java chuyển bucket thành Cây Đỏ Đen khi bucket có >= 8 node, đảm bảo hiệu năng tra cứu xấu nhất chỉ là O(log N)."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-3-3",
            "scenario": "Một hệ thống cần lưu trữ danh sách đơn hàng được sắp xếp theo thời gian tạo và tự động loại bỏ các đơn hàng trùng mã ID.",
            "q": "Collection nào sau đây là lựa chọn phù hợp nhất?",
            "options": [
              "TreeSet kết hợp với Comparator theo thời gian tạo.",
              "ArrayList kết hợp Collections.sort().",
              "HashSet thông thường.",
              "LinkedList."
            ],
            "answer": 0,
            "explain": "TreeSet triển khai NavigableSet dựa trên cấu trúc Cây Đỏ Đen (Red-Black Tree). Nó đảm bảo 2 tính chất: Không chứa phần tử trùng lặp (Set) và các phần tử luôn được duy trì ở trạng thái có thứ tự theo Comparator hoặc Comparable."
          },
          {
            "level": "hard",
            "targetLessonId": "j0-3-4",
            "scenario": "Một lập trình viên duyệt danh sách đơn hàng và xóa các đơn đã hủy: for (Order o : orderList) { if (o.isCancelled()) orderList.remove(o); }",
            "q": "Ngoại lệ nào sẽ bị ném ra tại thời điểm thực thi và nguyên nhân là gì?",
            "options": [
              "ConcurrentModificationException — Do cơ chế Fail-Fast của Iterator phát hiện modCount bị thay đổi mà không thông qua Iterator.remove().",
              "NullPointerException — Do phần tử bị gán thành null.",
              "IndexOutOfBoundsException — Do chỉ số mảng vượt quá độ dài.",
              "Không có lỗi nào phát sinh, code chạy hoàn hảo."
            ],
            "answer": 0,
            "explain": "Vòng lặp for-each bản chất sử dụng Iterator bên dưới. ArrayList duy trì biến modCount đếm số lần sửa đổi cấu trúc. Khi gọi orderList.remove(o) trực tiếp, modCount tăng lên nhưng expectedModCount của Iterator không đổi, dẫn đến cơ chế Fail-Fast kích hoạt và ném ConcurrentModificationException. Giải pháp là dùng iterator.remove() hoặc orderList.removeIf()."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-3-4",
            "scenario": "Trong hệ thống xử lý tác vụ nền (Background Job), các tác vụ cần được xử lý theo mức độ khẩn cấp (Priority High xử lý trước Priority Low).",
            "q": "Cấu trúc dữ liệu nào trong Java Collections được thiết kế tối ưu nhất cho kịch bản này?",
            "options": [
              "PriorityQueue — Cấu trúc Hàng đợi ưu tiên dựa trên cây nhị phân Min/Max Heap.",
              "ArrayDeque — Hàng đợi hai đầu LIFO/FIFO thông thường.",
              "LinkedList — Danh sách liên kết hai chiều.",
              "Stack — Ngăn xếp truyền thống."
            ],
            "answer": 0,
            "explain": "PriorityQueue sắp xếp các phần tử dựa trên thứ tự tự nhiên (Comparable) hoặc Comparator thông qua cấu trúc Min/Max Heap. Thao tác poll() luôn lấy ra phần tử có độ ưu tiên cao nhất với thời gian O(log N)."
          },
          {
            "level": "hard",
            "targetLessonId": "j0-3-4",
            "scenario": "Một ứng dụng đa luồng có 95% thao tác là đọc danh sách cấu hình và chỉ 5% là ghi (thêm/sửa cấu hình).",
            "q": "Collection nào sau đây mang lại hiệu năng đọc đồng thời cao nhất mà không cần lock đồng bộ?",
            "options": [
              "CopyOnWriteArrayList — Cho phép thao tác đọc không cần khóa (lock-free), mỗi lần ghi sẽ sao chép toàn bộ mảng ngầm định.",
              "Collections.synchronizedList(new ArrayList<>()) — Khóa toàn bộ danh sách ở mọi thao tác đọc và ghi.",
              "Vector — Class đồng bộ truyền thống từ Java 1.0.",
              "ArrayList thông thường không đồng bộ."
            ],
            "answer": 0,
            "explain": "CopyOnWriteArrayList cực kỳ phù hợp cho mô hình Read-Heavy, Write-Rare. Thao tác đọc truy cập trực tiếp vào mảng snapshot hiện tại mà không tốn chi phí khóa. Khi ghi, nó tạo bản sao mảng mới nên thao tác ghi tốn chi phí, nhưng đảm bảo tính nhất quán tuyệt đối cho hàng triệu luồng đọc đồng thời."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-3-1",
            "scenario": "Hệ số tải mặc định (Default Load Factor) của HashMap trong Java là 0.75.",
            "q": "Ý nghĩa của hệ số tải 0.75 là gì?",
            "options": [
              "Khi số lượng phần tử vượt quá 75% sức chứa hiện tại (capacity), HashMap sẽ tự động mở rộng gấp đôi (resize) và rehash lại toàn bộ dữ liệu.",
              "Mỗi bucket chỉ được phép chứa tối đa 75 phần tử.",
              "HashMap chỉ sử dụng 75% dung lượng RAM của JVM.",
              "Hiệu suất tra cứu của HashMap đạt 75% so với mảng nguyên thủy."
            ],
            "answer": 0,
            "explain": "Hệ số tải (Load Factor) là tỷ lệ ngưỡng để kích hoạt việc tăng dung lượng bảng băm. Giá trị 0.75 là mức cân bằng hoàn hảo giữa chi phí không gian (bộ nhớ RAM) và chi phí thời gian (xác suất xảy ra collision trong các phép toán get/put)."
          },
          {
            "level": "easy",
            "targetLessonId": "j0-3-1",
            "scenario": "Lập trình viên tạo danh sách: List<String> list = Arrays.asList(\"A\", \"B\"); Sau đó gọi list.add(\"C\");",
            "q": "Kết quả thực thi dòng lệnh trên là gì?",
            "options": [
              "Ném ra UnsupportedOperationException — Vì Arrays.asList() trả về danh sách có kích thước cố định (fixed-size wrapper) bọc lấy mảng ban đầu.",
              "Phần tử \"C\" được thêm thành công vào danh sách.",
              "Mảng tự động tăng kích thước thành 3 phần tử.",
              "Chương trình bị lỗi biên dịch Compile Error."
            ],
            "answer": 0,
            "explain": "Arrays.asList() tạo ra một wrapper kiểu java.util.Arrays$ArrayList bao bọc lấy mảng nguyên thủy, có kích thước cố định. Bạn có thể sửa phần tử cũ (.set()), nhưng không thể gọi .add() hay .remove(), nếu gọi sẽ ném UnsupportedOperationException. Trong Java 21, List.of() thậm chí còn bất biến hoàn toàn (immutable)."
          },
          {
            "level": "hard",
            "targetLessonId": "j0-3-3",
            "scenario": "Hai interface Comparable và Comparator được dùng để sắp xếp đối tượng trong Java.",
            "q": "Điểm khác biệt kiến trúc mấu chốt giữa Comparable và Comparator là gì?",
            "options": [
              "Comparable định nghĩa thứ tự tự nhiên (Natural ordering) bên trong chính class (hàm compareTo); Comparator định nghĩa chiến lược sắp xếp tùy biến bên ngoài class (hàm compare).",
              "Comparable chỉ áp dụng cho số nguyên, Comparator chỉ áp dụng cho chuỗi ký tự.",
              "Comparable chạy chậm hơn Comparator vì dùng Reflection.",
              "Comparable là class cha của Comparator."
            ],
            "answer": 0,
            "explain": "Comparable<T> (phương thức compareTo) định nghĩa thứ tự mặc định của chính đối tượng đó. Comparator<T> (phương thức compare) là một Strategy Pattern độc lập cho phép định nghĩa nhiều cách sắp xếp khác nhau (sắp xếp theo giá, theo tên, theo ngày) mà không cần can thiệp sửa đổi mã nguồn của Entity."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-3-2",
            "scenario": "Một bảng băm HashMap có kích thước capacity ban đầu là 16.",
            "q": "Tại sao kích thước capacity của HashMap luôn bắt buộc phải là lũy thừa của 2 (2^N)?",
            "options": [
              "Để phép toán chia lấy dư tính chỉ số bucket index = hash % capacity có thể tối ưu thành phép toán bitwise siêu tốc: index = (capacity - 1) & hash.",
              "Vì hệ điều hành 64-bit chỉ hỗ trợ mảng có kích thước chẵn.",
              "Để ngăn cản việc rò rỉ bộ nhớ Heap.",
              "Vì thuật toán băm MurmurHash yêu cầu độ dài chẵn."
            ],
            "answer": 0,
            "explain": "Phép toán chia lấy dư (%) trong CPU rất tốn clock cycles. Khi capacity là lũy thừa của 2 (ví dụ 16 = 00010000_b), (capacity - 1) sẽ là chuỗi toàn bit 1 (15 = 00001111_b). Phép toán bitwise AND '&' trên thanh ghi CPU chỉ tốn 1 clock cycle và phân bổ đều các bit băm vào mảng."
          }
        ]
      },
      "subtitle": "List Internals, Hashing & Bucket Collision, Tree Structures & Thread-Safe Collections",
      "outcomes": [
        "Hiểu rõ bản chất cơ chế tăng kích thước của ArrayList và chi phí con trỏ của LinkedList",
        "Làm chủ thuật toán băm (Hashing), Bucket Collision và giải mã chuyển đổi Red-Black Tree trong HashMap",
        "Thực thi nghiêm ngặt hợp đồng equals() và hashCode() để tránh rò rỉ ô nhớ và mất dữ liệu trong Map/Set",
        "Vận dụng đúng đắn cấu trúc Cây đỏ đen (TreeSet), Hàng đợi ưu tiên (PriorityQueue) và Thread-safe Collections"
      ],
      "topics": [
        {
          "id": 1,
          "title": "List & Hashing Internals"
        },
        {
          "id": 2,
          "title": "Tree, Queue & Thread-Safe Collections"
        }
      ],
      "retrievalWarmup": [
        {
          "q": "Tại sao Anemic Domain Model lại bị xem là anti-pattern trong thiết kế hướng đối tượng?",
          "options": [
            "Vì nó biến Entity thành cấu trúc dữ liệu thụ động, đẩy toàn bộ logic ra ngoài Service làm mất tính đóng gói.",
            "Vì nó chiếm quá nhiều dung lượng bộ nhớ Heap.",
            "Vì nó không thể tương thích với Spring Data JPA.",
            "Vì nó bắt buộc phải sử dụng con trỏ pointer."
          ],
          "answer": 0,
          "explain": "Anemic Domain Model biến OOP thành lập trình thủ tục (Procedural Programming), làm logic nghiệp vụ bị phân tán rải rác và các ràng buộc toàn vẹn của Entity không được bảo vệ."
        },
        {
          "q": "Khi một class con ghi đè (override) phương thức của class cha, JVM dùng lệnh bytecode nào để gọi phương thức tại Runtime?",
          "options": [
            "invokevirtual",
            "invokestatic",
            "invokespecial",
            "invokedynamic"
          ],
          "answer": 0,
          "explain": "invokevirtual được JVM sử dụng để thực hiện Dynamic Method Dispatch tra cứu qua bảng vtable của đối tượng thực tế tại Runtime."
        },
        {
          "q": "Lợi ích cốt lõi của việc áp dụng Defensive Copying trong Getter trả về Collection là gì?",
          "options": [
            "Ngăn chặn client bên ngoài tự ý thêm, sửa, xóa dữ liệu làm sai lệch trạng thái nội tại của đối tượng.",
            "Giúp tăng tốc độ truy vấn cơ sở dữ liệu lên 50%.",
            "Tự động chuyển đổi List thành mảng nhị phân.",
            "Khóa luồng ngăn chặn hoàn toàn hiện tượng deadlock."
          ],
          "answer": 0,
          "explain": "Defensive Copying (trả về bản sao bất biến) ngăn chặn hiện tượng Mutable Reference Leak, bảo vệ tuyệt đối tính đóng gói của Entity."
        }
      ]
    },
    {
      "id": 104,
      "title": "Quản Trị Lỗi, Java I/O & Đồ Án Tốt Nghiệp Foundation",
      "icon": "🧪",
      "color": "#4f46e5",
      "desc": "Exception Hierarchy, Try-with-resources, NIO.2 Files, JUnit 5 & Capstone Console App.",
      "lessons": [
        {
          "id": "j0-4-1",
          "type": "theory",
          "title": "Bài 4.1: Phân Cấp Exception: Checked vs Unchecked & Try-With-Resources",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải phẫu cây phả hệ `Throwable` trong Java: `Error`, `Exception`, `RuntimeException`.\n- Phân biệt triệt để **Checked Exception** (Bắt buộc try-catch) vs **Unchecked Exception** (Lỗi lập trình).\n- Làm chủ cú pháp quản lý tài nguyên tự động **Try-with-resources** và interface `AutoCloseable`.\n- Thiết kế cây ngoại lệ nghiệp vụ riêng (Custom Business Exceptions) cho ứng dụng thương mại.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: DỰ BÁO THỜI TIẾT VÀ TAI NẠN BẤT NGỜ\n- **Checked Exception**: Giống như bạn đi phượt vào mùa mưa bão. Bản tin thời tiết đã cảnh báo trước (Compiler ép bạn): *\"Bạn bắt buộc phải mang áo mưa hoặc hủy chuyến đi (Try-catch hoặc Throws)\"*. Nếu không chuẩn bị, bạn không được phép xuất phát!\n- **Unchecked Exception (RuntimeException)**: Giống như bạn đang đi bộ thì bất ngờ giẫm phải vỏ chuối trượt ngã (`NullPointerException`). Đây là lỗi do người đi bất cẩn, không thể lường trước bằng dự báo thời tiết!\n- **Try-with-resources**: Giống như cánh cửa tự động có bản lề lò xo. Bất kể bạn bước ra ngoài vui vẻ hay hớt hải bỏ chạy, cánh cửa luôn tự động khép kín lại sau lưng bạn (`close()`)!\n:::\n\n---\n\n## 1. Cái này là gì? (Cây Phả Hệ Throwable Của Java)\n\n```mermaid\nflowchart TD\n    Throwable[\"java.lang.Throwable\"]\n    Error[\"Error (Lỗi JVM nghiêm trọng)<br/>- OutOfMemoryError<br/>- StackOverflowError\"]\n    Exception[\"Exception (Ứng dụng xử lý được)\"]\n    Runtime[\"RuntimeException (Unchecked)<br/>- NullPointerException<br/>- IllegalArgumentException<br/>- IllegalStateException\"]\n    Checked[\"Checked Exception (Compile ép)<br/>- IOException<br/>- SQLException<br/>- TimeoutException\"]\n\n    Throwable --- Error\n    Throwable --- Exception\n    Exception --- Runtime\n    Exception --- Checked\n    style Error fill:#7f1d1d,stroke:#ef4444,color:#fff\n    style Runtime fill:#b45309,stroke:#f59e0b,color:#fff\n    style Checked fill:#1e3a8a,stroke:#3b82f6,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Checked vs Unchecked Exception)\n\n| Tiêu chí | Checked Exception | Unchecked Exception (`RuntimeException`) |\n|---|---|---|\n| **Bắt buộc xử lý?** | ✅ Bắt buộc phải `try-catch` hoặc khai báo `throws` | ❌ Không bắt buộc, compiler bỏ qua |\n| **Bản chất lỗi** | Các tình huống ngoại cảnh (Mạng rớt, đĩa đầy, file mất) | Lỗi logic của lập trình viên (Tham số sai, con trỏ null) |\n| **Xu hướng hiện đại** | Giảm thiểu (Gây ô nhiễm chữ ký hàm) | ⭐ **Khuyên dùng**: Spring Boot, Quarkus đều dùng Unchecked |\n| **Cách khắc phục** | Thử lại (Retry), chuyển hướng fallback | Sửa code, kiểm tra điều kiện trước khi gọi hàm |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Try-With-Resources An Toàn Tuyệt Đối)\n\nĐọc file cấu hình tài khoản thanh toán tự động đóng kết nối:\n\n```java\npackage vn.mastery.ecommerce.exception;\n\nimport java.io.BufferedReader;\nimport java.io.FileReader;\nimport java.io.IOException;\n\npublic class ConfigLoader {\n\n    // ✅ CHUẨN SENIOR: Tự động đóng tài nguyên kể cả khi có ngoại lệ quăng ra\n    public static String readMerchantSecret(String filePath) {\n        try (BufferedReader reader = new BufferedReader(new FileReader(filePath))) {\n            return reader.readLine();\n        } catch (IOException ex) {\n            // Wrap Checked Exception thành Business Unchecked Exception sạch sẽ\n            throw new PaymentConfigurationException(\"Không thể đọc khóa bảo mật từ: \" + filePath, ex);\n        }\n    }\n}\n```\n\n### Bảng Phân Tích Cơ Chế `AutoCloseable`:\n\n| Thành phần | Cơ chế hoạt động ngầm | Lợi ích hệ thống |\n|---|---|---|\n| `try (BufferedReader reader = ...)` | Compiler sinh mã bytecode gọi `reader.close()` trong khối `finally` ẩn | Triệt tiêu 100% rò rỉ File Descriptor của hệ điều hành Linux |\n| `Suppressed Exceptions` | Nếu cả khối `try` và hàm `close()` cùng quăng lỗi | Java tự động ghim lỗi của `close()` vào `ex.getSuppressed()` không làm mất gốc lỗi |\n| `new PaymentConfigurationException(..., ex)` | Kỹ thuật Exception Chaining (Giữ nguyên cause) | Giúp SRE và DevOps xem lại được trọn vẹn Stacktrace ban đầu |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Nuốt ngoại lệ âm thầm (Empty Catch Block)\n- **Vấn đề**: Viết `catch (Exception e) {}`. Khi lỗi xảy ra, hệ thống tiếp tục chạy với dữ liệu rác, không có bất kỳ dòng log nào báo hiệu. Lập trình viên mất cả tuần để debug!\n- **Giải pháp**: Luôn ghi log lỗi hoặc rethrow thành RuntimeException có nghĩa.\n\n### Checklist Bài 4.1\n- [ ] Sử dụng 100% Try-with-resources cho toàn bộ Stream, Connection, Socket.\n- [ ] Không bao giờ viết khối catch rỗng mà không có xử lý hoặc log.\n- [ ] Bảo toàn nguyên nhân gốc (Original Cause) khi wrap ngoại lệ.\n"
        },
        {
          "id": "j0-4-2",
          "type": "practice",
          "title": "Bài 4.2: Java I/O Chuyên Sâu: Byte Streams, Character Streams & NIO.2 Files API",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Phân biệt rõ bản chất giữa **Byte Streams** (`InputStream`/`OutputStream`) và **Character Streams** (`Reader`/`Writer`).\n- Hiểu rõ cơ chế bộ đệm (Buffering) giảm thiểu tối đa các lệnh gọi hệ thống (System Calls - `syscall`).\n- Sử dụng thư viện hiện đại **Java NIO.2 (`java.nio.file.Files`)** để xử lý file nhanh gọn.\n- Ghi log giao dịch đơn hàng tuần tự không làm nghẽn CPU.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: XE TẢI CHỞ GẠCH VÀ BÊ TÔNG TƯƠI\n- **Byte Stream (InputStream)**: Giống như đổ bê tông tươi lỏng qua ống dẫn. Bất kỳ dữ liệu thô nào (file ảnh, file nhạc mp3, file nén zip) cũng chảy qua dưới dạng dòng nhị phân 0 và 1.\n- **Character Stream (Reader)**: Giống như xếp từng viên gạch có khắc chữ. Nó tự động giải mã bảng mã UTF-8 thành ký tự tiếng Việt có dấu.\n- **Bộ đệm (BufferedStream)**: Thay vì mỗi lần cần 1 viên gạch bạn lại đánh xe tải chạy từ Hà Nội vào Sài Gòn (Tốn 1 syscall tốn kém), bạn chất đầy 8,192 viên gạch lên xe tải chở 1 chuyến duy nhất về kho đệm!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Java I/O vs Java NIO.2)\n\n```mermaid\nflowchart LR\n    subgraph CLASSIC_IO [\"Java Classic I/O (java.io) - Stream Blocking\"]\n        FIS[\"FileInputStream\"] --> BIS[\"BufferedInputStream<br/>(Bộ đệm 8KB RAM)\"] --> APP1[\"Ứng dụng\"]\n    end\n\n    subgraph MODERN_NIO [\"Java NIO.2 (java.nio.file) - Path & Channels\"]\n        PATH[\"Path.of('orders.csv')\"] --> FILES[\"Files.readAllLines()<br/>Files.newBufferedReader()\"] --> APP2[\"Ứng dụng\"]\n    end\n\n    style CLASSIC_IO fill:#1e3a8a,stroke:#3b82f6,color:#fff\n    style MODERN_NIO fill:#064e3b,stroke:#10b981,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Các API Đọc/Ghi File Trong Java)\n\n| Công cụ API | Thao tác trên loại dữ liệu | Mức độ tối ưu bộ nhớ | Trường hợp sử dụng chuẩn |\n|---|---|---|---|\n| **`FileInputStream`** | Byte nhị phân nguyên thủy | Thấp (nếu không bọc buffer) | Đọc file ảnh, PDF, mã hóa file |\n| **`BufferedReader`** | Văn bản có cấu trúc dòng (`String`) | ⭐ Rất cao (Đọc tuần tự từng dòng) | Đọc file log khổng lồ hàng GB mà không lo OOM |\n| **`Files.readAllBytes()`** | Byte mảng toàn bộ | ❌ Nguy hiểm nếu file lớn | Chỉ dùng cho file config nhỏ (< 5MB) |\n| **`Files.lines()` (NIO.2)** | Trả về Stream<String> Lazy | ⭐ Cực kỳ tối ưu (Kết hợp Stream API) | Lọc và phân tích file log lớn kiểu declarative |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Ghi Nhật Ký Giao Dịch An Toàn)\n\nGhi dữ liệu đơn hàng bằng Java NIO.2 kết hợp Buffer:\n\n```java\npackage vn.mastery.ecommerce.io;\n\nimport java.io.BufferedWriter;\nimport java.io.IOException;\nimport java.nio.charset.StandardCharsets;\nimport java.nio.file.Files;\nimport java.nio.file.Path;\nimport java.nio.file.StandardOpenOption;\n\npublic class TransactionAuditLogger {\n\n    public static void appendAuditLog(Path logPath, String transactionRecord) throws IOException {\n        // Đảm bảo thư mục cha tồn tại\n        if (logPath.getParent() != null) {\n            Files.createDirectories(logPath.getParent());\n        }\n\n        // Mở file ở chế độ ghi tiếp (APPEND), tạo mới nếu chưa có (CREATE)\n        try (BufferedWriter writer = Files.newBufferedWriter(\n                logPath,\n                StandardCharsets.UTF_8,\n                StandardOpenOption.CREATE,\n                StandardOpenOption.APPEND)) {\n            writer.write(transactionRecord);\n            writer.newLine(); // Đảm bảo xuống dòng đúng chuẩn hệ điều hành (CRLF / LF)\n        }\n    }\n}\n```\n\n### Bảng Phân Tích Logic Ghi File Chuẩn:\n\n| Lệnh gọi | Cơ chế ngầm định | Giá trị bảo vệ |\n|---|---|---|\n| `StandardCharsets.UTF_8` | Cố định bảng mã UTF-8 | Tránh lỗi biến ký tự tiếng Việt thành dấu hỏi chấm `???` khi chạy trên máy Windows |\n| `StandardOpenOption.APPEND` | Ghi nối tiếp vào cuối file | Không ghi đè làm mất lịch sử các giao dịch trước đó |\n| `Files.newBufferedWriter(...)` | Tích hợp sẵn bộ đệm 8KB trong nhân hệ điều hành | Giảm 99% số lần tương tác đĩa cứng IOPS |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Dùng `Files.readAllLines()` để đọc file 10GB\n- **Vấn đề**: Hàm này nạp toàn bộ nội dung file vào Heap cùng một lúc dưới dạng `List<String>`. Server lập tức nổ tung vì `OutOfMemoryError`!\n- **Giải pháp**: Với file lớn, luôn dùng `Files.lines(path)` (xử lý theo luồng Stream) hoặc dùng `BufferedReader.readLine()`.\n\n### Checklist Bài 4.2\n- [ ] Luôn chỉ định rõ ràng `StandardCharsets.UTF_8` trong mọi thao tác đọc ghi ký tự.\n- [ ] Sử dụng Java NIO.2 (`java.nio.file.Path`, `Files`) thay cho `java.io.File` cũ.\n- [ ] Không dùng `readAllBytes` hoặc `readAllLines` cho các file không giới hạn kích thước.\n"
        },
        {
          "id": "j0-4-3",
          "type": "practice",
          "title": "Bài 4.3: Viết Bộ Kiểm Thử Tự Động Đầu Tiên Với JUnit 5 (Assertions & Lifecycle)",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Hiểu rõ triết lý Kiểm thử tự động (Automated Testing) bảo vệ mã nguồn.\n- Nắm vững kiến trúc JUnit 5 (Jupiter): `@Test`, `@BeforeEach`, `@AfterEach`, `@ParameterizedTest`.\n- Sử dụng thành thạo các câu lệnh khẳng định: `assertEquals`, `assertNotNull`, `assertThrows`.\n- Đo lường và đảm bảo chất lượng code với quy tắc Arrange - Act - Assert (AAA).\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẤM LƯỚI AN TOÀN DƯỚI RẠP XIẾC\n- Viết code mà không có Unit Test giống như một nghệ sĩ xiếc đi thăng bằng trên dây ở độ cao 20 mét mà không có lưới an toàn bên dưới. Một cú sảy chân là rơi tự do!\n- **JUnit 5**: Chính là tấm lưới an toàn vững chắc. Mỗi lần bạn sửa code hoặc tối ưu thuật toán, chỉ cần 1 giây chạy bộ test: Nếu đèn xanh bật lên, bạn hoàn toàn tự tin đẩy code lên production mà không sợ gãy tính năng cũ (Regression Testing)!\n:::\n\n---\n\n## 1. Cái này là gì? (Vòng Đời Thực Thi Của Một Test Class JUnit 5)\n\n```mermaid\nflowchart TD\n    Init[\"Khởi tạo Test Class\"] --> BeforeEach[\"@BeforeEach<br/>(Chuẩn bị dữ liệu mẫu mới)\"]\n    BeforeEach --> Test1[\"@Test testCalculateDiscount()<br/>(Thực thi kiểm thử)\"]\n    Test1 --> AfterEach[\"@AfterEach<br/>(Dọn dẹp tài nguyên)\"]\n    AfterEach --> Next{\"Còn test case nào không?\"}\n    Next -->|\"Còn\"| BeforeEach\n    Next -->|\"Hết\"| Done[\"Hoàn tất: Xuất báo cáo Xanh/Đỏ\"]\n    style Test1 fill:#064e3b,stroke:#10b981,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận Cấu Trúc Kiểm Thử Chuẩn AAA)\n\n| Bước trong AAA | Tên bước | Trách nhiệm thực hiện | Ví dụ trong E-Commerce |\n|---|---|---|---|\n| **A - Arrange** | Thiết lập ngữ cảnh | Chuẩn bị dữ liệu đầu vào, khởi tạo đối tượng | Tạo một đơn hàng có 2 sản phẩm với giá 100k và 200k |\n| **A - Act** | Kích hoạt hành vi | Gọi đúng duy nhất phương thức nghiệp vụ cần test | Gọi `order.applyCoupon(\"GIAM_10_PHAN_TRAM\")` |\n| **A - Assert** | Khẳng định kết quả | So sánh kết quả thực tế với mong đợi | Khẳng định số tiền sau giảm phải là `270_000L` |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Viết Test Cho Dịch Vụ Đơn Hàng)\n\n```java\npackage vn.mastery.ecommerce.service;\n\nimport org.junit.jupiter.api.BeforeEach;\nimport org.junit.jupiter.api.DisplayName;\nimport org.junit.jupiter.api.Test;\nimport org.junit.jupiter.params.ParameterizedTest;\nimport org.junit.jupiter.params.provider.ValueSource;\nimport vn.mastery.ecommerce.domain.Order;\nimport vn.mastery.ecommerce.domain.OrderItem;\n\nimport java.util.List;\n\nimport static org.junit.jupiter.api.Assertions.*;\n\n@DisplayName(\"Kiểm Thử Nghiệp Vụ Quản Lý Đơn Hàng\")\nclass OrderPricingTest {\n\n    private Order order;\n\n    @BeforeEach\n    void setUp() {\n        // Arrange chung cho từng bài test: Mỗi test case chạy trên 1 đối tượng độc lập\n        OrderItem item1 = new OrderItem(\"ITEM-1\", 100_000L, 2); // 200k\n        OrderItem item2 = new OrderItem(\"ITEM-2\", 300_000L, 1); // 300k\n        order = new Order(\"ORD-TEST-001\", List.of(item1, item2));\n    }\n\n    @Test\n    @DisplayName(\"Tính tổng giá trị đơn hàng chính xác trước khi giảm giá\")\n    void shouldCalculateCorrectTotalAmount() {\n        // Act & Assert\n        assertEquals(500_000L, order.getTotalAmount(), \"Tổng tiền đơn hàng phải là 500,000 VND\");\n    }\n\n    @Test\n    @DisplayName(\"Ném ngoại lệ IllegalStateException khi cố tình thanh toán đơn hàng rỗng\")\n    void shouldThrowExceptionWhenCreatingEmptyOrder() {\n        // AssertThrows kiểm tra bắt đúng lỗi\n        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {\n            new Order(\"ORD-EMPTY\", List.of());\n        });\n        assertTrue(ex.getMessage().contains(\"ít nhất 1 sản phẩm\"));\n    }\n}\n```\n\n### Bảng Phân Tích Kỹ Thuật JUnit 5:\n\n| Annotation / Method | Ý nghĩa kỹ thuật | Lợi ích trong CI/CD |\n|---|---|---|\n| `@BeforeEach` | Thực thi trước MỖI phương thức `@Test` | Đảm bảo tính cô lập (Test Isolation), không làm test này ảnh hưởng test khác |\n| `assertEquals(expected, actual, msg)` | So sánh giá trị kỳ vọng và thực tế | In ra thông báo lỗi chi tiết khi test thất bại |\n| `assertThrows(Class, Executable)` | Bắt và kiểm tra exception ném ra | Xác thực hệ thống phòng thủ từ chối dữ liệu bẩn |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Các bài test phụ thuộc thứ tự chạy của nhau\n- **Vấn đề**: Test 2 dựa vào dữ liệu do Test 1 ghi vào biến static. Khi chạy lẻ từng test thì pass, nhưng khi chạy cả suite trên Jenkins CI thì gãy!\n- **Giải pháp**: Thiết kế mỗi test case độc lập 100%. Luôn dọn dẹp hoặc khởi tạo mới trong `@BeforeEach`.\n\n### Checklist Bài 4.3\n- [ ] Tuân thủ nghiêm ngặt cấu trúc 3 chữ A (Arrange - Act - Assert).\n- [ ] Đặt tên test thể hiện rõ hành vi mong đợi (`should...When...`).\n- [ ] Luôn viết test cho cả trường hợp thành công (Happy Path) và trường hợp lỗi (Corner Case).\n"
        },
        {
          "id": "j0-4-4",
          "type": "synthesis",
          "title": "Bài 4.4: Tổng Kết & Đồ Án Tốt Nghiệp Capstone: Console E-Commerce Order Manager",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Tổng hợp toàn bộ kiến thức 4 Module: Cú pháp Java 21, Bản chất bộ nhớ, SOLID, Collections và JUnit 5.\n- Hoàn thành đồ án tốt nghiệp Capstone: **Console E-Commerce Order Management Engine**.\n- Đạt tiêu chuẩn nghiệm thu kỹ thuật: Phân tầng sạch (Layered Architecture), 0 memory leak, test coverage $ge 85\\%$.\n- Nhận chứng chỉ xác thực **DevMastery Verified — Java 21 Foundation**.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CHÚC MỪNG BẠN TỐT NGHIỆP CỘT MỐC ĐẦU TIÊN!\nBạn đã chính thức bước qua chặng khởi đầu quan trọng nhất của một kỹ sư Java:\n- Bạn không còn viết code theo bản năng \"chạy được là được\".\n- Giờ đây trong đầu bạn luôn hiện diện hình ảnh của **Stack frame**, **Heap memory**, các con trỏ tham chiếu và thuật toán phân giải **vtable**.\n- Bạn hiểu tại sao `HashMap` chạy nhanh, tại sao cần `equals/hashCode`, và làm thế nào để thiết kế một hệ thống hướng đối tượng bền vững với SOLID!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Tổng Thể Đồ Án Capstone Foundation)\n\n```mermaid\nflowchart TD\n    CLI[\"CLI Main Application<br/>(Giao diện điều khiển Console)\"] --> SVC[\"OrderService<br/>(Xử lý nghiệp vụ, tính tiền, áp mã)\"]\n    SVC --> REPO[\"OrderRepository<br/>(Lưu trữ in-memory dùng HashMap & TreeSet)\"]\n    SVC --> AUDIT[\"AuditLogService<br/>(Ghi log giao dịch qua NIO.2 Files)\"]\n    SVC --> DOMAIN[\"Domain Entities<br/>(Order, OrderItem, Customer - Rich Domain Model)\"]\n    \n    style SVC fill:#064e3b,stroke:#10b981,color:#fff\n    style DOMAIN fill:#1e3a8a,stroke:#3b82f6,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Tiêu Chuẩn Đánh Giá Đồ Án Tốt Nghiệp Capstone Rubric)\n\n### Bảng Đánh Giá Tiêu Chuẩn Kỹ Thuật Đồ Án:\n\n| Hạng mục đánh giá | Yêu cầu kỹ thuật bắt buộc | Trọng số điểm |\n|---|---|---|\n| **Clean Architecture & OOP** | Áp dụng 5 nguyên lý SOLID, Rich Domain Model, không leak mutable state | 30% |\n| **Collections & Thuật toán** | Dùng đúng HashMap, PriorityQueue và TreeSet theo đặc tả bài toán | 25% |\n| **Quản trị lỗi & An toàn bộ nhớ** | Try-with-resources, không nuốt lỗi, dùng long cents cho tiền tệ | 20% |\n| **Độ phủ kiểm thử tự động** | Bộ test JUnit 5 độc lập đạt Branch Coverage $ge 85\\%$ | 25% |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Khung Sườn OrderRepository In-Memory)\n\n```java\npackage vn.mastery.ecommerce.repository;\n\nimport vn.mastery.ecommerce.domain.Order;\nimport java.util.*;\nimport java.util.concurrent.ConcurrentHashMap;\n\npublic class InMemoryOrderRepository {\n\n    // Sử dụng ConcurrentHashMap để an toàn trong đa luồng\n    private final Map<String, Order> storage = new ConcurrentHashMap<>();\n\n    public void save(Order order) {\n        Objects.requireNonNull(order, \"Order không được null\");\n        storage.put(order.getOrderId(), order);\n    }\n\n    public Optional<Order> findById(String orderId) {\n        return Optional.ofNullable(storage.get(orderId));\n    }\n\n    public List<Order> findAllSortedByTotalAmount() {\n        List<Order> list = new ArrayList<>(storage.values());\n        // Sắp xếp đơn hàng có giá trị cao nhất lên đầu\n        list.sort(Comparator.comparingLong(Order::getTotalAmount).reversed());\n        return Collections.unmodifiableList(list);\n    }\n}\n```\n\n### Bảng Bóc Tách Kỹ Thuật:\n\n| Dòng lệnh | Giá trị kỹ thuật | Ngăn chặn lỗi |\n|---|---|---|\n| `ConcurrentHashMap<>()` | Khóa phân đoạn (Segment Locking) an toàn | Chống hỏng cấu trúc dữ liệu khi nhiều lệnh ghi đồng thời |\n| `Optional.ofNullable(...)` | Xử lý giá trị có thể vắng mặt một cách rõ ràng | Triệt tiêu hoàn toàn `NullPointerException` ở tầng Service |\n| `Collections.unmodifiableList(...)` | Trả về danh sách bất biến | Bảo vệ dữ liệu gốc trong repository không bị bên ngoài sửa đổi |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Để lộ tham chiếu bộ nhớ nội bộ của Repository\n- **Vấn đề**: Trả về trực tiếp `return storage.values()` khiến bên ngoài có thể gọi `.clear()` xóa sạch dữ liệu của repository!\n- **Giải pháp**: Luôn tạo bản sao phòng vệ `new ArrayList<>()` và bọc `Collections.unmodifiableList()`.\n\n### Checklist Tốt Nghiệp Khóa 1 (Java 21 Foundation)\n- [ ] Hoàn thành 100% 16 bài học vi mô chuẩn cấu trúc 6 phần CES-2026 v2.5.\n- [ ] Vượt qua 4 bài thi trắc nghiệm tình huống kịch bản với điểm số $ge 80\\%$.\n- [ ] Đồ án Capstone có đầy đủ kiểm thử JUnit 5 với độ phủ branch $ge 85\\%$.\n- [ ] Tự tin bước tiếp lên Khóa 2: **Modern Java 21 Professional (Generics, Streams & Concurrency)**!\n"
        },
        {
          "id": "j0-4-quiz",
          "type": "quiz",
          "title": "Sát Hạch Năng Lực Module 4: Ngoại Lệ, Java I/O, JUnit 5 & Đồ Án Capstone",
          "minutes": 15,
          "questions": [
            {
              "level": "medium",
              "targetLessonId": "j0-4-1",
              "scenario": "Một lập trình viên viết code đọc file: try (BufferedReader br = new BufferedReader(new FileReader(\"orders.csv\"))) { return br.readLine(); }",
              "q": "Cơ chế Try-With-Resources (từ Java 7+) hoạt động dựa trên interface bắt buộc nào?",
              "options": [
                "java.lang.AutoCloseable (hoặc java.io.Closeable).",
                "java.io.Serializable.",
                "java.lang.Cloneable.",
                "java.util.concurrent.Callable."
              ],
              "answer": 0,
              "explain": "Bất kỳ class nào triển khai interface java.lang.AutoCloseable (chứa method void close()) đều có thể được khai báo trong mệnh đề try (...) của Try-With-Resources. JVM đảm bảo phương thức close() luôn được gọi tự động kể cả khi có ngoại lệ xảy ra."
            },
            {
              "level": "hard",
              "targetLessonId": "j0-4-1",
              "scenario": "Trong khối try-with-resources, cả code bên trong khối try và phương thức close() của resource đều ném ra ngoại lệ Exception.",
              "q": "Java xử lý ngoại lệ ném ra từ close() như thế nào để không làm lu mờ ngoại lệ chính trong try?",
              "options": [
                "Ngoại lệ trong try được ném ra chính thức; ngoại lệ trong close() được đính kèm vào như một ngoại lệ bị triệt tiêu (Suppressed Exception) lấy qua getSuppressed().",
                "Ngoại lệ trong close() ghi đè hoàn toàn ngoại lệ trong try.",
                "JVM bị crash ngay lập tức vì không thể ném 2 lỗi cùng lúc.",
                "Ngoại lệ trong close() tự động bị bỏ qua và không lưu lại bất kỳ dấu vết nào."
              ],
              "answer": 0,
              "explain": "Trước Java 7, ngoại lệ trong khối finally sẽ nuốt chửng ngoại lệ gốc trong try. Try-with-resources giải quyết dứt điểm bằng cơ chế Suppressed Exceptions: Ngoại lệ gốc trong try được ưu tiên ném ra, còn các lỗi xảy ra khi đóng tài nguyên được gắn vào mảng suppressed exceptions có thể đọc bằng hàm e.getSuppressed()."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-4-1",
              "scenario": "Một lập trình viên viết code: try { doPayment(); } catch (Exception e) { // Không làm gì cả }",
              "q": "Anti-pattern này được gọi là gì và gây ra hậu quả tai hại nào?",
              "options": [
                "Swallowing Exceptions (Nuốt ngoại lệ) — Khiến lỗi bị chôn vùi trong im lặng, lập trình viên và hệ thống giám sát hoàn toàn mất dấu vết nguyên nhân lỗi khi xảy ra sự cố.",
                "Deadlock Exception.",
                "Fail-Fast Pattern.",
                "Circuit Breaker Pattern."
              ],
              "answer": 0,
              "explain": "Bắt ngoại lệ mà để trống khối catch (hoặc chỉ in e.printStackTrace() mà không log có ngữ cảnh hoặc rethrow) là một trong những lỗi tồi tệ nhất. Nó làm hệ thống tiếp tục chạy trong trạng thái dữ liệu đã bị sai lệch mà không ai hay biết."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-4-2",
              "scenario": "Một hệ thống xử lý file log lớn 5GB. Lập trình viên sử dụng Files.readAllLines(Path.of(\"app.log\")).",
              "q": "Hiện tượng gì sẽ xảy ra và giải pháp tối ưu bằng Java NIO.2 là gì?",
              "options": [
                "Ném ra java.lang.OutOfMemoryError: Java heap space; giải pháp chuẩn là dùng Files.lines(path) để đọc dữ liệu dạng Stream từng dòng theo cơ chế lười (Lazy Evaluation).",
                "Chương trình chạy hoàn hảo vì Java tự động nén file 5GB.",
                "Hệ điều hành khóa file không cho đọc.",
                "File bị tự động chia nhỏ thành 100 file con."
              ],
              "answer": 0,
              "explain": "Files.readAllLines() nạp toàn bộ nội dung file vào một List<String> trên RAM cùng một lúc. Với file 5GB, Heap sẽ nổ tung ngay lập tức. Files.lines() trả về một Stream<String> đọc từng dòng từ đĩa vào RAM rồi giải phóng ngay, tiêu tốn rất ít bộ nhớ."
            },
            {
              "level": "hard",
              "targetLessonId": "j0-4-2",
              "scenario": "Khi sử dụng Files.lines(Path path) trong Java NIO.2 để xử lý dữ liệu file.",
              "q": "Lưu ý sống còn nào bắt buộc phải thực hiện để tránh rò rỉ tài nguyên hệ thống (File Descriptor Leak)?",
              "options": [
                "Stream trả về từ Files.lines() phải được bọc trong khối Try-With-Resources vì Stream này cài đặt AutoCloseable để đóng file descriptor bên dưới.",
                "Bắt buộc phải gọi hàm System.gc() sau khi xử lý xong Stream.",
                "Chỉ được phép đọc file có đuôi .txt.",
                "Phải đổi tên file thành temp trước khi đọc."
              ],
              "answer": 0,
              "explain": "Khác với các Stream thông thường trên Collections, Stream do Files.lines() tạo ra nắm giữ một tài nguyên I/O của hệ điều hành (File Handle/Descriptor). Nếu không đóng Stream (qua Try-With-Resources), file descriptor sẽ bị rò rỉ, dẫn đến lỗi 'Too many open files' làm sập server."
            },
            {
              "level": "easy",
              "targetLessonId": "j0-4-3",
              "scenario": "Trong framework kiểm thử JUnit 5, một phương thức cần được chạy trước MỖI test case để thiết lập dữ liệu mẫu.",
              "q": "Annotation nào được sử dụng?",
              "options": [
                "@BeforeEach",
                "@BeforeAll",
                "@SetUp",
                "@TestInit"
              ],
              "answer": 0,
              "explain": "Trong JUnit 5, @BeforeEach được thực thi trước mỗi phương thức @Test. @BeforeAll chỉ chạy đúng 1 lần duy nhất trước toàn bộ các test trong class (phải là static method theo mặc định)."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-4-3",
              "scenario": "Bạn muốn kiểm tra xem phương thức order.checkout() có ném ra ngoại lệ OrderEmptyException khi giỏ hàng rỗng hay không.",
              "q": "Cú pháp kiểm thử chuẩn mực trong JUnit 5 là gì?",
              "options": [
                "assertThrows(OrderEmptyException.class, () -> order.checkout());",
                "try { order.checkout(); } catch(OrderEmptyException e) {}",
                "@Test(expected = OrderEmptyException.class) trên đầu hàm test.",
                "assertTrue(order.checkout() instanceof OrderEmptyException);"
              ],
              "answer": 0,
              "explain": "JUnit 5 sử dụng assertion hàm chức năng: assertThrows(ExpectedException.class, Executable executable). Nó không chỉ kiểm tra ngoại lệ có được ném ra không mà còn trả về chính đối tượng Exception đó để bạn kiểm tra tiếp message hoặc error code."
            },
            {
              "level": "hard",
              "targetLessonId": "j0-4-3",
              "scenario": "Trong kiểm thử tự động với JUnit 5, kiểm thử tham số hóa (Parameterized Tests) cho phép chạy cùng một test case với nhiều bộ dữ liệu đầu vào khác nhau.",
              "q": "Tổ hợp annotation nào được sử dụng để nạp dữ liệu kiểm thử từ danh sách giá trị?",
              "options": [
                "@ParameterizedTest kết hợp với @ValueSource (hoặc @CsvSource, @MethodSource).",
                "@RepeatTest kết hợp @DataDriven.",
                "@TestSuite kết hợp @Inputs.",
                "@BatchTest kết hợp @Parameters."
              ],
              "answer": 0,
              "explain": "@ParameterizedTest cho phép thực thi một test case nhiều lần với các tham số khác nhau. Nguồn cấp dữ liệu có thể là @ValueSource (mảng số/chuỗi đơn giản), @CsvSource (chuỗi định dạng CSV), hoặc @MethodSource (Stream các đối tượng phức tạp)."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-4-4",
              "scenario": "Trong đồ án tốt nghiệp Console E-Commerce Order Manager, nguyên tắc phân tách tầng (Separation of Concerns) được áp dụng.",
              "q": "Luồng dữ liệu chuẩn mực giữa các tầng kiến trúc trong đồ án là gì?",
              "options": [
                "UI Console View -> Controller -> Service (Business Logic) -> Repository (Data Access) -> Model (Entities).",
                "UI Console View truy cập trực tiếp và sửa đổi dữ liệu trong Repository.",
                "Repository gọi ngược lại UI để in kết quả ra màn hình.",
                "Model chịu trách nhiệm gửi tin nhắn SMS cho khách hàng."
              ],
              "answer": 0,
              "explain": "Kiến trúc phân tầng chuẩn mực đảm bảo tính độc lập: UI chỉ nhận input và hiển thị; Service xử lý toàn bộ logic nghiệp vụ và ràng buộc; Repository chỉ lo việc lưu trữ và truy vấn dữ liệu. Không tầng nào được phép nhảy cóc hoặc đảo ngược quyền phụ thuộc."
            },
            {
              "level": "hard",
              "targetLessonId": "j0-4-1",
              "scenario": "Triết lý thiết kế Exception trong Java hiện đại (Java 17, 21 và Spring Framework).",
              "q": "Xu hướng kiến trúc nào được các chuyên gia kiến trúc phần mềm Java khuyến nghị đối với Business Exceptions?",
              "options": [
                "Ưu tiên sử dụng Unchecked Exceptions (kế thừa RuntimeException) kết hợp với Global Error Handler thay vì lạm dụng Checked Exceptions.",
                "100% mọi ngoại lệ nghiệp vụ bắt buộc phải là Checked Exception kế thừa Throwable.",
                "Không bao giờ sử dụng Exception mà luôn trả về mã lỗi int kiểu mã C.",
                "Mọi lỗi nghiệp vụ đều phải kế thừa trực tiếp từ java.lang.Error."
              ],
              "answer": 0,
              "explain": "Checked Exception gây ô nhiễm chữ ký phương thức (throws clause) qua hàng loạt các tầng kiến trúc và làm rối mã nguồn với các khối try-catch boilerplate vô ích. Kiến trúc hiện đại (như Spring Framework) đóng gói lỗi nghiệp vụ vào Unchecked Exceptions (RuntimeException) và xử lý tập trung tại Global Exception Handler."
            },
            {
              "level": "medium",
              "targetLessonId": "j0-4-2",
              "scenario": "Đọc và ghi file văn bản chứa ký tự tiếng Việt có dấu trong Java.",
              "q": "Lập trình viên bắt buộc phải chỉ định thành phần nào để tránh lỗi vỡ font ký tự (Mojibake)?",
              "options": [
                "Bảng mã ký tự chuẩn StandardCharsets.UTF_8 trong FileReader/FileWriter hoặc Files.readString().",
                "Ép kiểu toàn bộ chuỗi sang kiểu nhị phân byte.",
                "Sử dụng bảng mã mặc định US-ASCII.",
                "Tắt tính năng mã hóa của hệ điều hành."
              ],
              "answer": 0,
              "explain": "Nếu không chỉ định rõ Charset, Java sẽ sử dụng bảng mã mặc định của hệ điều hành (trên Windows có thể là Windows-1252), gây vỡ toàn bộ ký tự tiếng Việt có dấu. Luôn luôn truyền StandardCharsets.UTF_8 vào các phương thức I/O."
            },
            {
              "level": "hard",
              "targetLessonId": "j0-4-4",
              "scenario": "Chỉ số Code Coverage (Độ bao phủ mã nguồn kiểm thử) của đồ án tốt nghiệp Foundation.",
              "q": "Ý nghĩa của việc đạt 85% Line & Branch Coverage trong kiểm thử đơn vị (Unit Test) là gì?",
              "options": [
                "Ít nhất 85% số dòng lệnh và 85% các nhánh rẽ logic (if/else/switch) trong mã nguồn nghiệp vụ đã được thực thi và xác nhận tính đúng đắn bởi bộ test JUnit 5.",
                "Chương trình chạy nhanh hơn 85% so với phiên bản không có test.",
                "Bộ test chiếm 85% tổng số file trong dự án.",
                "85% các class trong dự án là interface."
              ],
              "answer": 0,
              "explain": "Branch Coverage đảm bảo rằng cả nhánh đúng (true) và nhánh sai (false) của mọi câu lệnh điều kiện đều có test case kiểm thử. Đạt 85% Line & Branch Coverage là tiêu chuẩn vàng của các dự án phần mềm doanh nghiệp, loại bỏ gần như toàn bộ các lỗi tiềm ẩn khi triển khai lên Production."
            }
          ]
        }
      ],
      "quiz": {
        "id": "j0-4-quiz",
        "title": "Sát Hạch Năng Lực Module 4: Ngoại Lệ, Java I/O, JUnit 5 & Đồ Án Capstone",
        "poolSize": 12,
        "pullCount": 12,
        "passThresholdPct": 80,
        "questions": [
          {
            "level": "medium",
            "targetLessonId": "j0-4-1",
            "scenario": "Một lập trình viên viết code đọc file: try (BufferedReader br = new BufferedReader(new FileReader(\"orders.csv\"))) { return br.readLine(); }",
            "q": "Cơ chế Try-With-Resources (từ Java 7+) hoạt động dựa trên interface bắt buộc nào?",
            "options": [
              "java.lang.AutoCloseable (hoặc java.io.Closeable).",
              "java.io.Serializable.",
              "java.lang.Cloneable.",
              "java.util.concurrent.Callable."
            ],
            "answer": 0,
            "explain": "Bất kỳ class nào triển khai interface java.lang.AutoCloseable (chứa method void close()) đều có thể được khai báo trong mệnh đề try (...) của Try-With-Resources. JVM đảm bảo phương thức close() luôn được gọi tự động kể cả khi có ngoại lệ xảy ra."
          },
          {
            "level": "hard",
            "targetLessonId": "j0-4-1",
            "scenario": "Trong khối try-with-resources, cả code bên trong khối try và phương thức close() của resource đều ném ra ngoại lệ Exception.",
            "q": "Java xử lý ngoại lệ ném ra từ close() như thế nào để không làm lu mờ ngoại lệ chính trong try?",
            "options": [
              "Ngoại lệ trong try được ném ra chính thức; ngoại lệ trong close() được đính kèm vào như một ngoại lệ bị triệt tiêu (Suppressed Exception) lấy qua getSuppressed().",
              "Ngoại lệ trong close() ghi đè hoàn toàn ngoại lệ trong try.",
              "JVM bị crash ngay lập tức vì không thể ném 2 lỗi cùng lúc.",
              "Ngoại lệ trong close() tự động bị bỏ qua và không lưu lại bất kỳ dấu vết nào."
            ],
            "answer": 0,
            "explain": "Trước Java 7, ngoại lệ trong khối finally sẽ nuốt chửng ngoại lệ gốc trong try. Try-with-resources giải quyết dứt điểm bằng cơ chế Suppressed Exceptions: Ngoại lệ gốc trong try được ưu tiên ném ra, còn các lỗi xảy ra khi đóng tài nguyên được gắn vào mảng suppressed exceptions có thể đọc bằng hàm e.getSuppressed()."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-4-1",
            "scenario": "Một lập trình viên viết code: try { doPayment(); } catch (Exception e) { // Không làm gì cả }",
            "q": "Anti-pattern này được gọi là gì và gây ra hậu quả tai hại nào?",
            "options": [
              "Swallowing Exceptions (Nuốt ngoại lệ) — Khiến lỗi bị chôn vùi trong im lặng, lập trình viên và hệ thống giám sát hoàn toàn mất dấu vết nguyên nhân lỗi khi xảy ra sự cố.",
              "Deadlock Exception.",
              "Fail-Fast Pattern.",
              "Circuit Breaker Pattern."
            ],
            "answer": 0,
            "explain": "Bắt ngoại lệ mà để trống khối catch (hoặc chỉ in e.printStackTrace() mà không log có ngữ cảnh hoặc rethrow) là một trong những lỗi tồi tệ nhất. Nó làm hệ thống tiếp tục chạy trong trạng thái dữ liệu đã bị sai lệch mà không ai hay biết."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-4-2",
            "scenario": "Một hệ thống xử lý file log lớn 5GB. Lập trình viên sử dụng Files.readAllLines(Path.of(\"app.log\")).",
            "q": "Hiện tượng gì sẽ xảy ra và giải pháp tối ưu bằng Java NIO.2 là gì?",
            "options": [
              "Ném ra java.lang.OutOfMemoryError: Java heap space; giải pháp chuẩn là dùng Files.lines(path) để đọc dữ liệu dạng Stream từng dòng theo cơ chế lười (Lazy Evaluation).",
              "Chương trình chạy hoàn hảo vì Java tự động nén file 5GB.",
              "Hệ điều hành khóa file không cho đọc.",
              "File bị tự động chia nhỏ thành 100 file con."
            ],
            "answer": 0,
            "explain": "Files.readAllLines() nạp toàn bộ nội dung file vào một List<String> trên RAM cùng một lúc. Với file 5GB, Heap sẽ nổ tung ngay lập tức. Files.lines() trả về một Stream<String> đọc từng dòng từ đĩa vào RAM rồi giải phóng ngay, tiêu tốn rất ít bộ nhớ."
          },
          {
            "level": "hard",
            "targetLessonId": "j0-4-2",
            "scenario": "Khi sử dụng Files.lines(Path path) trong Java NIO.2 để xử lý dữ liệu file.",
            "q": "Lưu ý sống còn nào bắt buộc phải thực hiện để tránh rò rỉ tài nguyên hệ thống (File Descriptor Leak)?",
            "options": [
              "Stream trả về từ Files.lines() phải được bọc trong khối Try-With-Resources vì Stream này cài đặt AutoCloseable để đóng file descriptor bên dưới.",
              "Bắt buộc phải gọi hàm System.gc() sau khi xử lý xong Stream.",
              "Chỉ được phép đọc file có đuôi .txt.",
              "Phải đổi tên file thành temp trước khi đọc."
            ],
            "answer": 0,
            "explain": "Khác với các Stream thông thường trên Collections, Stream do Files.lines() tạo ra nắm giữ một tài nguyên I/O của hệ điều hành (File Handle/Descriptor). Nếu không đóng Stream (qua Try-With-Resources), file descriptor sẽ bị rò rỉ, dẫn đến lỗi 'Too many open files' làm sập server."
          },
          {
            "level": "easy",
            "targetLessonId": "j0-4-3",
            "scenario": "Trong framework kiểm thử JUnit 5, một phương thức cần được chạy trước MỖI test case để thiết lập dữ liệu mẫu.",
            "q": "Annotation nào được sử dụng?",
            "options": [
              "@BeforeEach",
              "@BeforeAll",
              "@SetUp",
              "@TestInit"
            ],
            "answer": 0,
            "explain": "Trong JUnit 5, @BeforeEach được thực thi trước mỗi phương thức @Test. @BeforeAll chỉ chạy đúng 1 lần duy nhất trước toàn bộ các test trong class (phải là static method theo mặc định)."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-4-3",
            "scenario": "Bạn muốn kiểm tra xem phương thức order.checkout() có ném ra ngoại lệ OrderEmptyException khi giỏ hàng rỗng hay không.",
            "q": "Cú pháp kiểm thử chuẩn mực trong JUnit 5 là gì?",
            "options": [
              "assertThrows(OrderEmptyException.class, () -> order.checkout());",
              "try { order.checkout(); } catch(OrderEmptyException e) {}",
              "@Test(expected = OrderEmptyException.class) trên đầu hàm test.",
              "assertTrue(order.checkout() instanceof OrderEmptyException);"
            ],
            "answer": 0,
            "explain": "JUnit 5 sử dụng assertion hàm chức năng: assertThrows(ExpectedException.class, Executable executable). Nó không chỉ kiểm tra ngoại lệ có được ném ra không mà còn trả về chính đối tượng Exception đó để bạn kiểm tra tiếp message hoặc error code."
          },
          {
            "level": "hard",
            "targetLessonId": "j0-4-3",
            "scenario": "Trong kiểm thử tự động với JUnit 5, kiểm thử tham số hóa (Parameterized Tests) cho phép chạy cùng một test case với nhiều bộ dữ liệu đầu vào khác nhau.",
            "q": "Tổ hợp annotation nào được sử dụng để nạp dữ liệu kiểm thử từ danh sách giá trị?",
            "options": [
              "@ParameterizedTest kết hợp với @ValueSource (hoặc @CsvSource, @MethodSource).",
              "@RepeatTest kết hợp @DataDriven.",
              "@TestSuite kết hợp @Inputs.",
              "@BatchTest kết hợp @Parameters."
            ],
            "answer": 0,
            "explain": "@ParameterizedTest cho phép thực thi một test case nhiều lần với các tham số khác nhau. Nguồn cấp dữ liệu có thể là @ValueSource (mảng số/chuỗi đơn giản), @CsvSource (chuỗi định dạng CSV), hoặc @MethodSource (Stream các đối tượng phức tạp)."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-4-4",
            "scenario": "Trong đồ án tốt nghiệp Console E-Commerce Order Manager, nguyên tắc phân tách tầng (Separation of Concerns) được áp dụng.",
            "q": "Luồng dữ liệu chuẩn mực giữa các tầng kiến trúc trong đồ án là gì?",
            "options": [
              "UI Console View -> Controller -> Service (Business Logic) -> Repository (Data Access) -> Model (Entities).",
              "UI Console View truy cập trực tiếp và sửa đổi dữ liệu trong Repository.",
              "Repository gọi ngược lại UI để in kết quả ra màn hình.",
              "Model chịu trách nhiệm gửi tin nhắn SMS cho khách hàng."
            ],
            "answer": 0,
            "explain": "Kiến trúc phân tầng chuẩn mực đảm bảo tính độc lập: UI chỉ nhận input và hiển thị; Service xử lý toàn bộ logic nghiệp vụ và ràng buộc; Repository chỉ lo việc lưu trữ và truy vấn dữ liệu. Không tầng nào được phép nhảy cóc hoặc đảo ngược quyền phụ thuộc."
          },
          {
            "level": "hard",
            "targetLessonId": "j0-4-1",
            "scenario": "Triết lý thiết kế Exception trong Java hiện đại (Java 17, 21 và Spring Framework).",
            "q": "Xu hướng kiến trúc nào được các chuyên gia kiến trúc phần mềm Java khuyến nghị đối với Business Exceptions?",
            "options": [
              "Ưu tiên sử dụng Unchecked Exceptions (kế thừa RuntimeException) kết hợp với Global Error Handler thay vì lạm dụng Checked Exceptions.",
              "100% mọi ngoại lệ nghiệp vụ bắt buộc phải là Checked Exception kế thừa Throwable.",
              "Không bao giờ sử dụng Exception mà luôn trả về mã lỗi int kiểu mã C.",
              "Mọi lỗi nghiệp vụ đều phải kế thừa trực tiếp từ java.lang.Error."
            ],
            "answer": 0,
            "explain": "Checked Exception gây ô nhiễm chữ ký phương thức (throws clause) qua hàng loạt các tầng kiến trúc và làm rối mã nguồn với các khối try-catch boilerplate vô ích. Kiến trúc hiện đại (như Spring Framework) đóng gói lỗi nghiệp vụ vào Unchecked Exceptions (RuntimeException) và xử lý tập trung tại Global Exception Handler."
          },
          {
            "level": "medium",
            "targetLessonId": "j0-4-2",
            "scenario": "Đọc và ghi file văn bản chứa ký tự tiếng Việt có dấu trong Java.",
            "q": "Lập trình viên bắt buộc phải chỉ định thành phần nào để tránh lỗi vỡ font ký tự (Mojibake)?",
            "options": [
              "Bảng mã ký tự chuẩn StandardCharsets.UTF_8 trong FileReader/FileWriter hoặc Files.readString().",
              "Ép kiểu toàn bộ chuỗi sang kiểu nhị phân byte.",
              "Sử dụng bảng mã mặc định US-ASCII.",
              "Tắt tính năng mã hóa của hệ điều hành."
            ],
            "answer": 0,
            "explain": "Nếu không chỉ định rõ Charset, Java sẽ sử dụng bảng mã mặc định của hệ điều hành (trên Windows có thể là Windows-1252), gây vỡ toàn bộ ký tự tiếng Việt có dấu. Luôn luôn truyền StandardCharsets.UTF_8 vào các phương thức I/O."
          },
          {
            "level": "hard",
            "targetLessonId": "j0-4-4",
            "scenario": "Chỉ số Code Coverage (Độ bao phủ mã nguồn kiểm thử) của đồ án tốt nghiệp Foundation.",
            "q": "Ý nghĩa của việc đạt 85% Line & Branch Coverage trong kiểm thử đơn vị (Unit Test) là gì?",
            "options": [
              "Ít nhất 85% số dòng lệnh và 85% các nhánh rẽ logic (if/else/switch) trong mã nguồn nghiệp vụ đã được thực thi và xác nhận tính đúng đắn bởi bộ test JUnit 5.",
              "Chương trình chạy nhanh hơn 85% so với phiên bản không có test.",
              "Bộ test chiếm 85% tổng số file trong dự án.",
              "85% các class trong dự án là interface."
            ],
            "answer": 0,
            "explain": "Branch Coverage đảm bảo rằng cả nhánh đúng (true) và nhánh sai (false) của mọi câu lệnh điều kiện đều có test case kiểm thử. Đạt 85% Line & Branch Coverage là tiêu chuẩn vàng của các dự án phần mềm doanh nghiệp, loại bỏ gần như toàn bộ các lỗi tiềm ẩn khi triển khai lên Production."
          }
        ]
      },
      "subtitle": "Exception Hierarchy, Modern Java I/O & NIO.2, Unit Testing with JUnit 5 & Capstone",
      "outcomes": [
        "Phân biệt triệt để Checked vs Unchecked Exceptions và áp dụng Try-With-Resources chuẩn mực",
        "Làm chủ Java NIO.2 Files API, Buffering Channels và quản lý luồng dữ liệu an toàn",
        "Xây dựng bộ kiểm thử tự động toàn diện với JUnit 5 (Assertions, Lifecycle, Parameterized Tests)",
        "Hoàn thành Đồ án Tốt nghiệp Capstone: Console E-Commerce Order Management Engine đạt chuẩn 85% coverage"
      ],
      "topics": [
        {
          "id": 1,
          "title": "Quản Trị Ngoại Lệ & Java I/O NIO.2"
        },
        {
          "id": 2,
          "title": "Kiểm Thử Tự Động JUnit 5 & Đồ Án Tốt Nghiệp"
        }
      ],
      "retrievalWarmup": [
        {
          "q": "Điều gì xảy ra khi hai đối tượng trong Java có equals() == true nhưng hashCode() khác nhau và được đưa vào HashMap?",
          "options": [
            "map.get() sẽ trả về null vì đối tượng bị tra cứu ở sai vị trí bucket băm.",
            "HashMap tự động phát hiện và gộp chung dữ liệu.",
            "Chương trình ném ngoại lệ IllegalStateException.",
            "Bộ nhớ Heap tự động tăng dung lượng gấp đôi."
          ],
          "answer": 0,
          "explain": "Vi phạm hợp đồng equals/hashCode khiến HashMap tính sai chỉ số bucket, làm mất dấu phần tử và gây rò rỉ bộ nhớ."
        },
        {
          "q": "Cấu trúc dữ liệu nào trong Java Collections Framework sử dụng thuật toán Cây Đỏ Đen (Red-Black Tree)?",
          "options": [
            "TreeSet và TreeMap (cũng như bucket của HashMap khi bị collision vượt ngưỡng 8).",
            "ArrayList và Vector.",
            "PriorityQueue.",
            "ArrayDeque."
          ],
          "answer": 0,
          "explain": "TreeMap, TreeSet và các bucket bị collision của HashMap sử dụng Cây Đỏ Đen (Red-Black Tree) để đảm bảo thời gian tìm kiếm luôn là O(log N)."
        },
        {
          "q": "Tại sao không nên sử dụng đối tượng có thể thay đổi (Mutable Object) làm Key trong HashMap?",
          "options": [
            "Vì khi thuộc tính của key thay đổi, hashCode thay đổi theo khiến không thể get() hay remove() phần tử đó ra khỏi Map.",
            "Vì Java compiler sẽ báo lỗi không cho phép biên dịch.",
            "Vì Map tự động chuyển thành LinkedList làm giảm hiệu năng.",
            "Vì dữ liệu của key sẽ bị ghi đè thành chuỗi rỗng."
          ],
          "answer": 0,
          "explain": "Key bị thay đổi trạng thái sẽ làm lệch vị trí bucket băm, biến entry đó thành 'hồn ma' vĩnh viễn không thể tìm thấy trong Map."
        }
      ]
    }
  ]
};
})();
