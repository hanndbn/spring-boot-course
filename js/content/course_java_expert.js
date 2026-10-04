/* =========================================================================
   DevMastery — Java 21 Expert: JVM Internals, GC Tuning & Ultra Low-Latency
   Standardized to CES-2026 v2.5 (Golden 6-Part Hierarchy)
   Domain: Financial Trading Core Matching Engine
   ========================================================================= */
(function() {
  "use strict";

  window.EXTRA_COURSES = window.EXTRA_COURSES || {};

  window.EXTRA_COURSES["java-expert"] = {
  "id": "java-expert",
  "trackId": "java-track",
  "title": "Java 21 Expert — JVM Internals, GC Tuning & Ultra Low-Latency",
  "shortTitle": "Java 21 Expert",
  "icon": "⚡",
  "badge": "Expert Level",
  "category": "backend",
  "level": "expert",
  "hours": "~18h",
  "modulesCount": 4,
  "lessonsCount": 16,
  "quizCount": 16,
  "certificateTitle": "DevMastery Verified — Java 21 Expert",
  "instructor": "DevMastery Java Architecture Council",
  "bestseller": false,
  "themeGradient": "linear-gradient(135deg, #7c2d12 0%, #b91c1c 50%, #ef4444 100%)",
  "desc": "Chạm tới tầng vật lý của Java: HotSpot JIT C1/C2, Escape Analysis, Garbage Collection Tuning (G1GC & Generational ZGC), Java Memory Model, Lock-Free RingBuffer và đồ án Financial Matching Engine.",
  "outcomes": [
    "Phân tích JIT Compilation (C1/C2), Method Inlining, Escape Analysis và Assembly code",
    "Làm chủ GC Tuning với G1GC và Generational ZGC đạt độ trễ sub-millisecond",
    "Hiểu sâu Java Memory Model: Happens-Before, Memory Barriers, VarHandle, FFM API",
    "Xây dựng Order Book Matching Engine zero-allocation với độ trễ P99.99 < 5µs"
  ],
  "prerequisites": [
    "Đã hoàn thành Modern Java Professional và nắm vững Concurrency"
  ],
  "stackVersion": {
    "java": "21 LTS",
    "jvm": "HotSpot OpenJDK 21",
    "gc": "Generational ZGC & G1GC",
    "profiler": "Async-Profiler & JFR",
    "lastReviewedDate": "2026-10-04",
    "maintainer": "DevMastery Java Architecture Council"
  },
  "tags": [
    "JVM Internals",
    "JIT Compiler",
    "ZGC",
    "Low Latency",
    "Lock-Free",
    "Disruptor",
    "JMH"
  ],
  "isAvailable": true,
  "modules": [
    {
      "id": 301,
      "title": "Kiến Trúc HotSpot JVM, ClassLoader & JIT Compilation",
      "icon": "⚙️",
      "color": "#b91c1c",
      "desc": "Metaspace, Compressed OOPs, Tiered Compilation (C1/C2), Escape Analysis & Assembly.",
      "lessons": [
        {
          "id": "j2-1-1",
          "type": "theory",
          "title": "Bài 1.1: HotSpot Architecture: Metaspace, Compressed OOPs & Bytecode Structure",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải phẫu kiến trúc nội bộ của HotSpot OpenJDK 21: Runtime Data Areas, Metaspace, Code Cache.\n- Khám phá kỹ thuật **Compressed OOPs** (-XX:+UseCompressedOops) giúp tiết kiệm hàng chục GB RAM Heap.\n- Đọc hiểu cấu trúc một Java Object Header trong bộ nhớ: Mark Word (64-bit), Klass Word (32/64-bit), Data Padding.\n- Sử dụng Java Object Layout (JOL) để đo lường kích thước vật lý chính xác của đối tượng.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: PHIẾU ĐÍNH KÈM HÀNG HÓA VÀ KỸ THUẬT NÉN MÃ VẠCH\n- Mọi món hàng trong kho (Java Object trên Heap): Đều có một chiếc tem nhãn gắn ở đầu (Object Header 12 - 16 bytes). Trên tem ghi thông tin khóa (Lock state), số tuổi để thu gom rác (GC age 4 bits), và mã hash code.\n- **Compressed OOPs (Ordinary Object Pointers)**: Giống như việc thay vì in địa chỉ kho hàng dài 64 chữ số (tốn 8 bytes), kho hàng áp dụng quy ước: *\"Mọi kiện hàng luôn nằm ở vị trí chia hết cho 8 mét\"*. Nhờ đó, người ta chỉ cần in số thứ tự ngắn 32-bit mà vẫn định vị được 32GB kho hàng!\n:::\n\n---\n\n## 1. Cái này là gì? (Cấu Trúc Vật Lý 64-bit Của Một Java Object Trên RAM)\n\n```mermaid\nflowchart LR\n    subgraph OBJ_HEADER [\"Java Object Header (12 - 16 Bytes)\"]\n        MW[\"Mark Word (64 bits / 8 Bytes)<br/>• Identity HashCode: 31 bits<br/>• GC Age: 4 bits (Max 15)<br/>• Lock State: 2 bits (Biased/Thin/Fat)\"]\n        KW[\"Klass Word (32 bits / 4 Bytes)<br/>(Compressed OOP trỏ về Metaspace)\"]\n    end\n\n    subgraph OBJ_PAYLOAD [\"Object Payload & Padding\"]\n        FD[\"Instance Fields Data<br/>(Dữ liệu của các biến thực thể)\"]\n        PAD[\"Alignment Padding (0 - 7 Bytes)<br/>(Bù cho tròn bội số của 8 bytes)\"]\n    end\n\n    MW --- KW --- FD --- PAD\n    style OBJ_HEADER fill:#1e3a8a,stroke:#3b82f6,color:#fff\n    style OBJ_PAYLOAD fill:#064e3b,stroke:#10b981,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận Đánh Đổi Heap Size: Ngưỡng Vàng 32GB)\n\n| Dung lượng Heap cấu hình (`-Xmx`) | Trạng thái Compressed OOPs | Kích thước con trỏ Pointer | Hệ quả thực tế trên Production |\n|---|---|---|---|\n| **`-Xmx4g` đến `-Xmx31g`** | ✅ **Bật tự động (Enabled)** | **4 bytes (32-bit shifted)** | ⭐ **Tối ưu nhất**: Tiết kiệm 40% RAM, L1/L2 CPU cache chứa được nhiều data hơn |\n| **`-Xmx32g` trở lên** | ❌ **Tắt tự động (Disabled)** | **8 bytes (64-bit full)** | 💥 **LỖ VỐN NẶNG**: Bạn nâng RAM từ 31GB lên 32GB nhưng thực tế số lượng Object lưu được lại **ÍT HƠN** do con trỏ phình to gấp đôi! |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Đo Lường Bộ Nhớ Thực Tế Với JOL)\n\n```java\npackage vn.mastery.jvm;\n\nimport org.openjdk.jol.info.ClassLayout;\n\npublic class ObjectLayoutInspector {\n\n    public static class FinancialOrder {\n        private final long orderId = 1001L; // 8 bytes\n        private final int quantity = 50;     // 4 bytes\n        private final boolean isBuy = true;  // 1 byte\n        // Padding sẽ tự động chèn thêm 3 bytes để tròn 16 bytes payload!\n    }\n\n    public static void main(String[] args) {\n        FinancialOrder order = new FinancialOrder();\n        \n        // In ra chi tiết sơ đồ bố trí bộ nhớ của object\n        System.out.println(ClassLayout.parseInstance(order).toPrintable());\n    }\n}\n```\n\n### Bảng Phân Tích Layout In Ra Bởi JOL:\n\n| Offset (Bytes) | Kích thước | Thành phần nội bộ | Mô tả |\n|---|---|---|---|\n| `0` | 8 bytes | `Mark Word` | Chứa trạng thái khóa, hashcode và 4-bit GC age |\n| `8` | 4 bytes | `Klass Word` | Con trỏ nén 32-bit trỏ tới Metadata của class trên Metaspace |\n| `12` | 8 bytes | `long orderId` | Dữ liệu trường nguyên thủy 64-bit |\n| `20` | 4 bytes | `int quantity` | Dữ liệu trường nguyên thủy 32-bit |\n| `24` | 1 byte | `boolean isBuy` | Dữ liệu trường boolean 8-bit |\n| `25` | 3 bytes | `loss due to padding` | 3 bytes rỗng được chèn vào để tổng size là 28 -> bù lên 32 bytes (Bội số 8) |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Cấu hình `-Xmx32g` mà không hiểu biết\n- **Vấn đề**: Đội ngũ infra thấy server dư RAM nên chỉnh `-Xmx32g`. Lập tức Compressed OOPs bị tắt, toàn bộ reference chuyển thành 64-bit, ứng dụng ngốn thêm 6GB RAM vô ích và CPU cache miss tăng 20%.\n- **Giải pháp**: Luôn đặt `-Xmx31g` (hoặc tối đa `-Xmx31744m`) để tận dụng Compressed OOPs.\n\n### Checklist Bài 1.1\n- [ ] Luôn kiểm tra cờ `-XX:+UseCompressedOops` còn hiệu lực hay không.\n- [ ] Không bao giờ đặt `-Xmx` nằm trong khoảng lấp lửng từ 32GB đến 36GB.\n- [ ] Sắp xếp thứ tự các trường hoặc dùng Record để JVM tối ưu đóng gói layout.\n"
        },
        {
          "id": "j2-1-2",
          "type": "practice",
          "title": "Bài 1.2: JIT Compiler Pipeline: C1, C2, Tiered Compilation & On-Stack Replacement (OSR)",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải mã cơ chế biên dịch thích ứng của HotSpot: **Tiered Compilation (5 cấp độ)**.\n- Phân biệt rõ vai trò của Trình thông dịch (Interpreter), C1 Client Compiler, và C2 Server Compiler.\n- Cơ chế phát hiện \"Code nóng\" (Hotspot) qua **Invocation Counters** và **Backedge Counters**.\n- Kỹ thuật **On-Stack Replacement (OSR)**: Thay thế mã đang chạy giữa chừng bằng mã máy siêu tốc.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CUỘC ĐUA TIẾP SỨC CỦA CỖ XE F1\n- **Interpreter (Cấp độ 0)**: Giống như người chạy bộ khởi động. Không cần chuẩn bị gì, chạy được ngay lập tức (Khởi động ứng dụng nhanh), nhưng tốc độ chậm.\n- **C1 Compiler (Cấp độ 1, 2, 3)**: Giống như chiếc xe hơi thể thao thông thường. Mất vài giây nổ máy nhưng chạy nhanh gấp 10 lần người đi bộ.\n- **C2 Compiler (Cấp độ 4)**: Cỗ xe đua F1 đỉnh cao! C2 quan sát đường đua rất lâu (Profiling), phân tích từng khúc cua, rồi tung ra toàn bộ các tối ưu hóa phần cứng mãnh liệt nhất để xe lao đi với vận tốc âm thanh!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc 5 Cấp Độ Tiered Compilation)\n\n```mermaid\nflowchart TD\n    Bytecode[\"Java Bytecode (.class)\"] --> Tier0[\"Tier 0: Interpreter<br/>(Chạy ngay, thu thập Profile Data)\"]\n    Tier0 -->|\"Hàm được gọi >= 2000 lần\"| Tier3[\"Tier 3: C1 Compiler Full Profiling<br/>(Biên dịch nhanh, gài cảm biến đo lường)\"]\n    Tier3 -->|\"Hàm cực nóng (Hotspot) >= 10.000 lần\"| Tier4[\"Tier 4: C2 Server Compiler<br/>(Tối ưu tối đa: Inlining, Vectorization, ASM)\"]\n    Tier4 --> Machine[\"Mã Máy Nhị Phân Native x86/ARM<br/>(Chạy trực tiếp trên CPU, tốc độ C/C++)\"]\n    style Tier4 fill:#7f1d1d,stroke:#ef4444,color:#fff\n    style Machine fill:#064e3b,stroke:#10b981,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận So Sánh Các Tầng Biên Dịch JIT)\n\n| Tầng biên dịch | Tên gọi | Thời gian biên dịch | Mức độ tối ưu hóa mã máy | Mục đích chính |\n|---|---|---|---|---|\n| **Tier 0** | Interpreter | **0 ms** (Tức thì) | Không tối ưu | Khởi động app nhanh |\n| **Tier 1 - 3** | C1 Compiler | Vài chục ms | Trung bình (Tối ưu cơ bản) | Giúp ứng dụng đạt hiệu năng cao nhanh chóng |\n| **Tier 4** | C2 Compiler | Vài trăm ms đến vài giây | ⭐ **Tối đa (Aggressive Optimization)** | Đưa hệ thống vào trạng thái Steady-State đỉnh cao |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Theo Dõi JIT Compilation)\n\nTham số JVM theo dõi quá trình JIT biên dịch mã nguồn sang mã máy:\n\n```bash\n# Chạy ứng dụng và in toàn bộ nhật ký JIT ra console\njava -XX:+TieredCompilation -XX:+PrintCompilation -XX:+UnlockDiagnosticVMOptions vn.mastery.jvm.MatchingEngineApp\n```\n\n### Bảng Giải Mã Nhật Ký PrintCompilation Của JVM:\n\n| Dòng nhật ký mẫu | Cột số | Ý nghĩa kỹ thuật | Phân tích trạng thái |\n|---|---|---|---|\n| `124 ms   123   3   OrderService::calculateTotal (45 bytes)` | Cột thứ tư = `3` | Đã được biên dịch bởi C1 Compiler ở Tier 3 | Mã đang được chạy nhanh và tiếp tục theo dõi profile |\n| `350 ms   456   4   OrderService::calculateTotal (45 bytes)` | Cột thứ tư = `4` | **Đã thăng hạng lên C2 Compiler Tier 4!** | Mã đã được biên dịch thành Assembly tối ưu tuyệt đối |\n| `420 ms   789   %   OrderBook::matchOrders @ 12 (120 bytes)` | Ký tự `%` | **On-Stack Replacement (OSR)** | Vòng lặp đang chạy dở dang bên trong hàm được thay thế bằng mã JIT ngay trên Stack! |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Đo Benchmark khi JVM chưa Warm-up\n- **Vấn đề**: Chạy hàm 100 lần và lấy `System.currentTimeMillis()` đo tốc độ. Bạn thực chất đang đo tốc độ của **Trình thông dịch (Interpreter)** chứ không phải tốc độ thực tế của Java JIT C2!\n- **Giải pháp**: Luôn dùng thư viện chuẩn khoa học **JMH (Java Microbenchmark Harness)** với ít nhất 3 - 5 vòng Warm-up iterations trước khi đo kết quả.\n\n### Checklist Bài 1.2\n- [ ] Hiểu rõ hiện tượng \"JIT Warm-up period\" trong các microservices khởi động lạnh.\n- [ ] Bật cờ `-XX:+TieredCompilation` (mặc định đã bật trong OpenJDK 21).\n- [ ] Không bao giờ đo tốc độ Java bằng vòng lặp thủ công nghiệp dư.\n"
        },
        {
          "id": "j2-1-3",
          "type": "theory",
          "title": "Bài 1.3: JIT Optimizations: Method Inlining, Escape Analysis & Scalar Replacement",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải mã 3 kỹ thuật tối ưu hóa vĩ đại nhất của C2 Compiler:\n  1. **Method Inlining**: Triệt tiêu chi phí gọi hàm và nạp Stack Frame.\n  2. **Escape Analysis**: Phân tích tầm với (Scope) của Object trên bộ nhớ.\n  3. **Scalar Replacement**: Phá hủy đối tượng thành các biến nguyên thủy và cấp phát thẳng trên thanh ghi CPU (Zero-Allocation on Heap)!\n- Khám phá hiện tượng **Monomorphic vs Megamorphic Inlining** (Tại sao gọi hàm đa hình quá nhiều class con lại chậm).\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: PHÙ THỦY BIẾN ĐỒ VẬT THÀNH HƯ KHÔNG\n- Thông thường, mỗi lần bạn gõ `new Point(x, y)`, một đối tượng bằng xương bằng thịt phải được sinh ra trên Heap và tốn bộ nhớ.\n- **Escape Analysis & Scalar Replacement**: Giống như một vị phù thủy đứng quan sát: *\"Cái đối tượng Point này chỉ được tạo ra và dùng nội bộ trong đúng 1 hàm, không bao giờ thoát ra ngoài (No Escape)!\"*.\n- Phù thủy liền **xóa sổ hoàn toàn đối tượng Point**, lấy trực tiếp giá trị `x` và `y` nhét thẳng vào 2 chiếc túi quần của CPU (Thanh ghi CPU Registers)! Bạn có đối tượng dùng mà **Heap không tốn dù chỉ 1 byte rác**!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Escape Analysis & Scalar Replacement)\n\n```mermaid\nflowchart TD\n    Code[\"public long calculate() {<br/>Point p = new Point(10, 20);<br/>return p.x + p.y;<br/>}\"]\n    \n    subgraph JIT_C2 [\"Tối Ưu Hóa C2 Compiler\"]\n        EA[\"1. Escape Analysis:<br/>Phát hiện đối tượng 'p' KHÔNG thoát khỏi hàm\"]\n        SR[\"2. Scalar Replacement:<br/>Giải thể Point, biến thành 2 biến int x=10, int y=20\"]\n        REG[\"3. Register Allocation:<br/>Gán x và y vào thanh ghi CPU EAX / EBX\"]\n    end\n\n    Code --> EA --> SR --> REG\n    REG --> ZeroGC[\"💥 KẾT QUẢ: 0 BYTES TRÊN HEAP! 0 LẦN GỌI HÀM! TỐC ĐỘ GẤP 50 LẦN!\"]\n    style ZeroGC fill:#064e3b,stroke:#10b981,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận 3 Mức Độ Thoát Của Đối Tượng - Escape States)\n\n| Mức độ thoát | Định nghĩa | C2 Compiler có thể tối ưu không? |\n|---|---|---|\n| **NoEscape** | Đối tượng chỉ được sử dụng và biến mất bên trong hàm tạo ra nó | ⭐ **Tối đa**: Scalar Replacement (Cấp phát trên thanh ghi, 0 bytes Heap) |\n| **ArgEscape** | Đối tượng được truyền làm tham số cho hàm khác nhưng không gán vào field toàn cục | Có thể tối ưu nếu hàm nhận được Inlined thành công |\n| **GlobalEscape** | Đối tượng được gán vào biến static, trả về qua `return`, hoặc đẩy sang Thread khác | ❌ **Không thể tối ưu**: Bắt buộc phải cấp phát vật lý trên Heap |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Chứng Minh Scalar Replacement)\n\n```java\npackage vn.mastery.jvm;\n\npublic class EscapeAnalysisBenchmark {\n\n    public record Coordinate(int x, int y) {}\n\n    // Hàm này chạy hàng triệu lần: Liệu có sinh ra hàng triệu rác Coordinate trên Heap?\n    public static int sumCoordinates(int a, int b) {\n        // C2 Compiler nhận diện Coordinate là NoEscape\n        Coordinate coord = new Coordinate(a, b);\n        return coord.x() + coord.y();\n    }\n\n    public static void main(String[] args) {\n        int total = 0;\n        // Chạy vòng lặp 50.000.000 lần\n        for (int i = 0; i < 50_000_000; i++) {\n            total += sumCoordinates(i, i + 1);\n        }\n        System.out.println(\"Kết quả: \" + total);\n    }\n}\n```\n\n### Cờ JVM Kiểm Chứng:\n\n```bash\n# Tắt Escape Analysis để thấy bộ nhớ Heap bị tàn phá:\njava -XX:-DoEscapeAnalysis -verbose:gc vn.mastery.jvm.EscapeAnalysisBenchmark\n# Kết quả: Garbage Collector liên tục chạy hàng trăm lần vì tràn Young Gen!\n\n# Bật lại Escape Analysis (Mặc định):\njava -XX:+DoEscapeAnalysis -verbose:gc vn.mastery.jvm.EscapeAnalysisBenchmark\n# Kết quả: HOÀN TOÀN KHÔNG CÓ BẤT KỲ LẦN GC NÀO! (Zero Allocation)\n```\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Hàm quá dài khiến JIT từ chối Inlining\n- **Vấn đề**: C2 Compiler có giới hạn `-XX:FreqInlineSize=325 bytes`. Nếu bạn viết một phương thức dài hàng trăm dòng, JIT sẽ từ chối Inlining, kéo theo việc Escape Analysis bị vô hiệu hóa!\n- **Giải pháp**: Luôn chia nhỏ hàm thành các phương thức ngắn, súc tích (dưới 35 bytecode instructions).\n\n### Checklist Bài 1.3\n- [ ] Giữ các phương thức nghiệp vụ cốt lõi ngắn gọn để JIT Inlining hoạt động tối đa.\n- [ ] Thiết kế các DTO cục bộ kiểu Record để tận dụng Scalar Replacement.\n- [ ] Không rò rỉ đối tượng nội bộ ra biến static hoặc global context.\n"
        },
        {
          "id": "j2-1-4",
          "type": "practice",
          "title": "Bài 1.4: Đọc Mã Assembly Thực Tế Của JVM Bằng HSDIS & -XX:+PrintAssembly",
          "minutes": 8,
          "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Cài đặt thư viện plugin dịch ngược **HSDIS** (HotSpot Disassembler) vào JDK 21.\n- Xuất và đọc mã hợp ngữ Assembly x86_64 / ARM trực tiếp từ JVM qua cờ `-XX:+PrintAssembly`.\n- Nhận diện các lệnh vi xử lý tối thượng: `vmovdqu` (SIMD Vectorization), `lock cmpxchg` (CAS Atomic), `test` (Safepoint Poll).\n- Kiểm chứng xem JIT Compiler có thực sự vector hóa vòng lặp tính toán tài chính của bạn hay không.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: NHÌN QUA KÍNH HIỂN VI ĐIỆN TỬ\n- Bạn viết code Java: `int c = a + b;`. Bạn đang ở tầng vũ trụ vĩ mô.\n- Bytecode: `iload_1, iload_2, iadd`. Bạn đang ở tầng phân tử.\n- **HSDIS Assembly**: Giống như việc bạn đặt mẫu vật dưới kính hiển vi điện tử chiếu thẳng vào hạt nhân nguyên tử! Bạn thấy chính xác dòng electron nhảy múa trên thanh ghi CPU `add %edx, %eax`! Không còn bất kỳ bí mật nào bị che giấu!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến Trúc Pipeline Xuất Mã Assembly)\n\n```mermaid\nflowchart LR\n    Source[\"Java 21 Code<br/>(MatchingEngine.java)\"] --> Bytecode[\"Bytecode (.class)\"]\n    Bytecode --> JIT[\"HotSpot C2 Compiler\"]\n    JIT --> HSDIS[\"HSDIS Plugin Library<br/>(hsdis-amd64.dll / .so)\"]\n    HSDIS --> ASM[\"Mã Hợp Ngữ x86_64 Native Assembly<br/>(mov, add, vmovdqu, lock cmpxchg)\"]\n    style HSDIS fill:#7f1d1d,stroke:#ef4444,color:#fff\n    style ASM fill:#064e3b,stroke:#10b981,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Khi Nào Cần Soi Tới Mã Assembly?)\n\n| Tình huống thực chiến | Mục đích kiểm tra Assembly | Lợi ích kinh tế |\n|---|---|---|\n| **Hệ thống giao dịch tài chính HFT** | Đảm bảo không phát sinh lệnh gọi bộ nhớ chậm (`mov`), chỉ dùng thanh ghi | Giảm độ trễ từng microsecond cho lệnh khớp |\n| **Thuật toán mã hóa & nén dữ liệu** | Kiểm tra CPU có kích hoạt tập lệnh **AVX-512 / SIMD** (Vectorization) | Tăng tốc độ xử lý dữ liệu lên 4x - 8x |\n| **Đồng bộ hóa đa luồng Lock-Free** | Kiểm tra vị trí của lệnh rào cản bộ nhớ (`mfence` hoặc `lock cmpxchg`) | Chống xung đột cache CPU (Cache Bouncing) |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Lệnh Chạy & Trích Xuất Assembly)\n\nChạy xuất Assembly cho phương thức khớp lệnh:\n\n```bash\n# Lệnh chạy JDK 21 với HSDIS được kích hoạt:\njava -XX:+UnlockDiagnosticVMOptions \\\n     -XX:+PrintAssembly \\\n     -XX:CompileCommand=print,vn.mastery.jvm.MatchingEngine::matchOrder \\\n     vn.mastery.jvm.MatchingEngineApp\n```\n\n### Trích Đoạn Mã Assembly C2 Sinh Ra:\n\n```assembly\n[Verified Entry Point]\n  0x00007f88e14a2a10:   mov    %eax,-0x14000(%rsp)   # Kiểm tra Stack Overflow\n  0x00007f88e14a2a17:   push   %rbp\n  0x00007f88e14a2a18:   sub    $0x20,%rsp            # Cấp phát 32 bytes Stack Frame\n  0x00007f88e14a2a1c:   mov    0x10(%rdx),%r8d       # Load quantity từ thanh ghi\n  0x00007f88e14a2a20:   cmp    $0x0,%r8d\n  0x00007f88e14a2a24:   jle    0x00007f88e14a2a50    # Nhảy nhánh nếu quantity <= 0\n  0x00007f88e14a2a26:   lock cmpxchg %r8d,(%rcx)     # ⚡ ATOMIC CAS TRÊN PHẦN CỨNG!\n```\n\n### Bảng Giải Mã Các Lệnh Assembly Then Chốt:\n\n| Lệnh Hợp Ngữ (x86_64) | Bản chất phần cứng | Ý nghĩa trong Java |\n|---|---|---|\n| `lock cmpxchg` | Khóa bus bộ nhớ CPU trong vài chu kỳ clock và thực thi so sánh tráo đổi nguyên tử | Tương ứng với lệnh `AtomicInteger.compareAndSet()` hoặc `VarHandle` |\n| `vmovdqu` / `vpaddd` | Sử dụng thanh ghi vector 256-bit YMM của CPU | Tương ứng với JIT Auto-Vectorization (Cộng 8 số int cùng lúc trong 1 chu kỳ!) |\n| `test %eax, -0x...(%rip)` | Thăm dò trang nhớ Safepoint (Safepoint Polling) | Nơi Garbage Collector ra tín hiệu dừng thread để Stop-the-world |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices (Production Pitfalls & Actionable Checklist)\n\n### Cạm bẫy 1: Quá tải thông tin khi in toàn bộ Assembly của JVM\n- **Vấn đề**: Gõ `-XX:+PrintAssembly` mà không giới hạn tên hàm sẽ in ra hàng triệu dòng assembly của toàn bộ runtime Spring/JVM, làm tràn console.\n- **Giải pháp**: Luôn kết hợp cờ `-XX:CompileCommand=print,com.pkg.Class::methodName`.\n\n### Checklist Bài 1.4\n- [ ] Tải file thư viện `hsdis-amd64.dll` (Windows) hoặc `hsdis-amd64.so` (Linux) đặt vào thư mục `bin/server/` của JDK.\n- [ ] Xuất thử mã Assembly của một hàm xử lý toán học hoặc thuật toán băm.\n- [ ] Xác thực xem tập lệnh SIMD Vectorization có được kích hoạt hay không.\n"
        }
      ],
      "quiz": {
        "id": "j2-quiz-1",
        "type": "quiz",
        "title": "Sát Hạch Module J2.1: HotSpot Architecture & JIT Compilation",
        "questions": [
          {
            "level": "hard",
            "scenario": "Một kỹ sư DevOps nhận thấy server microservice chạy Spring Boot 3 có 64GB RAM vật lý. Kỹ sư này cấu hình tham số khởi động: -Xms32g -Xmx32g với hy vọng ứng dụng chứa được gấp đôi dữ liệu so với cấu hình 16GB.",
            "q": "Hậu quả thực tế về mặt kiến trúc bộ nhớ JVM là gì?",
            "options": [
              "Compressed OOPs bị tắt tự động (vượt ngưỡng 32GB); kích thước con trỏ phình từ 4 bytes lên 8 bytes khiến dung lượng Heap thực tế lưu trữ object ít hơn và CPU cache miss tăng cao.",
              "JVM bị từ chối khởi động vì không hỗ trợ Heap quá 31GB.",
              "Tự động kích hoạt Generational ZGC nên không ảnh hưởng.",
              "Các đối tượng được tự động chuyển lên bộ nhớ GPU."
            ],
            "answer": 0,
            "explanation": "Compressed OOPs chỉ có thể mã hóa tối đa 32GB không gian nhớ bằng con trỏ 32-bit (dịch 3 bits). Khi -Xmx chạm hoặc vượt ngưỡng 32GB, Compressed OOPs bị tắt hoàn toàn, con trỏ thành 64-bit (8 bytes). Số lượng object lưu được trên 32GB thực tế lại ít hơn trên 31GB!"
          },
          {
            "level": "hard",
            "scenario": "Trong một phương thức xử lý giao dịch tài chính, lập trình viên liên tục tạo ra đối tượng TransactionContext ctx = new TransactionContext(orderId, amount). Đối tượng này chỉ được dùng để tính toán nội bộ trong hàm và không bao giờ được trả về hay truyền ra ngoài.",
            "q": "Tối ưu hóa nào của C2 Compiler sẽ loại bỏ hoàn toàn việc cấp phát đối tượng ctx trên Heap?",
            "options": [
              "Escape Analysis nhận diện đối tượng là NoEscape kết hợp với Scalar Replacement phân giải ctx thành các biến nguyên thủy cấp phát trực tiếp trên CPU Registers.",
              "Garbage Collector tự động gom rác ngay trong microsecond.",
              "JIT Compiler chuyển đổi đối tượng thành String Pool.",
              "Java Virtual Threads tự động hủy đối tượng khi luồng ngủ."
            ],
            "answer": 0,
            "explanation": "Khi Escape Analysis xác nhận đối tượng không thoát khỏi hàm (NoEscape), Scalar Replacement sẽ giải thể đối tượng thành các trường dữ liệu rời rạc và gán trực tiếp vào thanh ghi CPU. Không có bất kỳ byte nào bị cấp phát trên Heap (Zero Allocation)."
          }
        ]
      }
    }
  ]
};
})();
