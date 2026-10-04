/* =========================================================================
   Spring Boot Mastery — Expanded High-Caliber Quiz Bank
   Expands quiz question count to 30-36 questions per module (~256 questions total).
   Each question includes Level, Real Production Scenario, Options, Answer,
   Explanation, and Deep 'Why' breakdown for each option.
   ========================================================================= */
(function() {
  "use strict";

  const EXPANDED_QUIZZES = {
  "0": [
    {
      "level": "medium",
      "scenario": "Dự án yêu cầu định nghĩa domain model cho các loại thanh toán (CreditCard, Momo, VNPAY, BankTransfer) và không cho phép bên thứ ba tự ý kế thừa thêm loại mới ngoài domain package.",
      "q": "Cơ chế nào trong Java hiện đại giúp giới hạn chính xác các class được phép kế thừa?",
      "options": [
        "Đánh dấu class cha là abstract và private constructor",
        "Sử dụng Sealed Classes với từ khóa 'sealed' và 'permits'",
        "Dùng interface thông thường kết hợp Enum",
        "Đánh dấu class cha là final"
      ],
      "answer": 1,
      "explain": "Sealed Classes (Java 17+) cho phép chỉ định chính xác danh sách các subclass được kế thừa thông qua mệnh đề 'permits', đảm bảo tính toàn vẹn của domain model.",
      "why": [
        "Sai — Abstract với private constructor ngăn chặn việc kế thừa từ bên ngoài nhưng cũng làm code khó mở rộng nội bộ và không tận dụng được pattern matching của Java compiler.",
        "✓ Đúng — Sealed classes ('public sealed interface Payment permits Momo, VNPay...') cho phép kiểm soát chặt chẽ kế thừa và giúp switch-pattern matching exhaustive mà không cần default case.",
        "Sai — Interface kết hợp Enum chỉ biểu diễn định danh hằng số, không chứa được state và behavior riêng biệt cho từng loại payment phức tạp.",
        "Sai — Class 'final' chặn hoàn toàn mọi sự kế thừa, không thể tạo subclass cho Momo hay VNPay."
      ]
    },
    {
      "level": "medium",
      "scenario": "Bạn có một chuỗi JSON hoặc câu lệnh SQL nhiều dòng trong Java code. Trước Java 15, lập trình viên phải cộng chuỗi với '\\n' và escape dấu nháy kép rất phức tạp.",
      "q": "Tính năng Text Blocks trong Java xử lý khoảng trắng thụt đầu dòng (indentation) như thế nào?",
      "options": [
        "Giữ nguyên toàn bộ khoảng trắng từ đầu dòng của file mã nguồn",
        "Tự động loại bỏ khoảng trắng dư thừa dựa trên vị trí của dấu đóng triple-quote '\"\"\"'",
        "Luôn luôn xóa sạch mọi khoảng trắng ở đầu mỗi dòng",
        "Cần phải gọi hàm .trimIndent() thủ công sau chuỗi"
      ],
      "answer": 1,
      "explain": "Text Blocks tính toán khoảng trắng chung nhỏ nhất (incidental whitespace) dựa trên lề của nội dung và vị trí của '\"\"\"' đóng để tự động cắt bỏ, giữ lại đúng indentation mong muốn.",
      "why": [
        "Sai — Nếu giữ nguyên từ đầu file thì code bị thụt lề vô lý khi hiển thị chuỗi.",
        "✓ Đúng — Trình biên dịch Java xác định khoảng trắng ngẫu nhiên (incidental whitespace) dựa trên vị trí của dấu đóng \"\"\" hoặc dòng có indent nhỏ nhất.",
        "Sai — Không xóa sạch toàn bộ vì cấu trúc JSON/SQL nhiều dòng cần giữ lại thụt lề cấp con.",
        "Sai — Java compiler tự động xử lý khi compile, không cần gọi runtime method như Kotlin."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong Java 21, bộ sưu tập được bổ sung interface SequencedCollection để chuẩn hóa việc truy cập phần tử đầu và cuối.",
      "q": "Phương thức nào sau đây KHÔNG thuộc interface SequencedCollection?",
      "options": [
        "addFirst(E e)",
        "removeLast()",
        "reversed()",
        "peekFirst()"
      ],
      "answer": 3,
      "explain": "'peekFirst()' thuộc Deque interface. SequencedCollection chuẩn hóa: getFirst(), getLast(), addFirst(), addLast(), removeFirst(), removeLast(), và reversed().",
      "why": [
        "Sai — addFirst(e) là method chuẩn của SequencedCollection để thêm vào đầu.",
        "Sai — removeLast() là method chuẩn để xóa và trả về phần tử cuối cùng.",
        "Sai — reversed() trả về một SequencedCollection có thứ tự đảo ngược dạng view.",
        "✓ Đúng — peekFirst() thuộc Deque (Queue), không phải phương thức của SequencedCollection."
      ]
    },
    {
      "level": "hard",
      "scenario": "Một lập trình viên sử dụng ThreadLocal trong môi trường Spring Boot với Virtual Threads (Project Loom) và Tomcat mặc định.",
      "q": "Rủi ro lớn nhất khi lạm dụng ThreadLocal với số lượng hàng triệu Virtual Threads là gì?",
      "options": [
        "ThreadLocal không hoạt động trên Virtual Threads và gây UnsupportedOperationException",
        "Tiêu tốn bộ nhớ khổng lồ (OOM) vì mỗi Virtual Thread lưu một bản sao riêng của đối tượng",
        "Virtual Threads sẽ bị deadlock khi gọi ThreadLocal.get()",
        "ThreadLocal tự động bị chia sẻ giữa các Virtual Threads gây race condition"
      ],
      "answer": 1,
      "explain": "Virtual Threads rất nhẹ và được tạo ra hàng triệu instance. Nếu mỗi thread giữ một ThreadLocal với object lớn, heap memory sẽ cạn kiệt rất nhanh. Java 21 khuyến nghị dùng Scoped Values.",
      "why": [
        "Sai — ThreadLocal vẫn hoạt động bình thường trên Virtual Threads vì tính tương thích ngược.",
        "✓ Đúng — Mặc dù Virtual Thread rất nhẹ (~1KB), nhưng nếu mỗi thread đính kèm một object vài chục KB qua ThreadLocal, 100.000 request đồng thời sẽ ngốn hàng Gigabyte RAM.",
        "Sai — ThreadLocal.get() không gây deadlock vì chỉ truy cập local thread map.",
        "Sai — ThreadLocal độc lập tuyệt đối giữa các thread, không bị chia sẻ dữ liệu."
      ]
    },
    {
      "level": "hard",
      "scenario": "Ứng dụng Spring Boot chạy trên Kubernetes gặp hiện tượng bộ nhớ RSS của Linux process tăng dần đến khi container bị OOMKilled (Exit Code 137), dù JVM Heap usage chỉ chiếm 40% giới hạn.",
      "q": "Nguyên nhân phổ biến nhất ngoài vùng nhớ Heap dẫn đến tình huống trên là gì?",
      "options": [
        "Do CPU throttling làm ứng dụng chậm",
        "Metaspace, Thread Stacks, Native Memory (JNI/Direct Byte Buffers/Netty) vượt quá giới hạn",
        "Do Garbage Collector G1 không bao giờ giải phóng bộ nhớ cho OS",
        "Do dung lượng ổ đĩa của container bị đầy"
      ],
      "answer": 1,
      "explain": "Linux Container tính toàn bộ Resident Set Size (RSS) bao gồm: Heap + Metaspace + Code Cache + Thread Stacks + Off-Heap Native Memory (Netty, Direct ByteBuffers). Nếu tổng vượt cgroup limit, kernel sẽ gửi SIGKILL (137).",
      "why": [
        "Sai — CPU throttling chỉ làm request xử lý chậm, không làm tăng RSS hay kích hoạt Linux OOM Killer.",
        "✓ Đúng — Rất nhiều lỗi OOMKilled đến từ Native Memory (Off-Heap) do Netty buffer leak, số lượng thread stack quá lớn, hoặc Metaspace không giới hạn.",
        "Sai — Từ Java 12+, G1GC có tính năng uncommit memory trả lại RAM cho hệ điều hành khi nhàn rỗi.",
        "Sai — Đĩa đầy gây IOException, không kích hoạt Linux Kernel OOM Killer giết process."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong Java 21, Garbage Collector nào được khuyến nghị cho các microservices backend đòi hỏi độ trễ cực thấp (Sub-millisecond pause times) với dung lượng Heap từ vài GB đến hàng TB?",
      "q": "Chọn Garbage Collector phù hợp nhất:",
      "options": [
        "Serial GC (-XX:+UseSerialGC)",
        "Parallel GC (-XX:+UseParallelGC)",
        "Generational ZGC (-XX:+UseZGC -XX:+ZGenerational)",
        "CMS (Concurrent Mark Sweep)"
      ],
      "answer": 2,
      "explain": "Generational ZGC trong Java 21 mang lại thời gian dừng Stop-The-World dưới 1 millisecond độc lập với kích thước Heap, đồng thời tối ưu thông lượng cho các thế hệ object ngắn hạn.",
      "why": [
        "Sai — Serial GC là collector đơn luồng, chỉ thích hợp cho ứng dụng siêu nhỏ hoặc CLI tool.",
        "Sai — Parallel GC tối ưu throughput tối đa nhưng chấp nhận pause time lớn (vài trăm ms đến vài giây).",
        "✓ Đúng — Generational ZGC là đột phá của Java 21, giải quyết triệt để bài toán pause time siêu thấp mà vẫn đạt throughput cao.",
        "Sai — CMS đã bị deprecated từ Java 9 và bị gỡ bỏ hoàn toàn từ Java 14."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong dự án Maven nhiều module, hai thư viện transitive phụ thuộc vào 2 phiên bản khác nhau của Jackson Core (2.15.2 và 2.16.1).",
      "q": "Thẻ cấu hình nào trong file pom.xml cha giúp cố định một phiên bản duy nhất xuyên suốt tất cả các module?",
      "options": [
        "<dependencies>",
        "<dependencyManagement>",
        "<pluginManagement>",
        "<build>"
      ],
      "answer": 1,
      "explain": "'<dependencyManagement>' dùng để quản lý tập trung phiên bản thư viện mà không tự động import nếu module con không khai báo, giúp đồng nhất version trong toàn bộ project.",
      "why": [
        "Sai — '<dependencies>' ở pom cha sẽ ép buộc import thư viện đó vào MỌI module con, kể cả module không cần.",
        "✓ Đúng — '<dependencyManagement>' khai báo version chuẩn, các module con chỉ cần gọi dependency mà không cần ghi tag '<version>', tránh xung đột phiên bản.",
        "Sai — '<pluginManagement>' chỉ áp dụng cho Maven build plugins, không dùng cho application dependencies.",
        "Sai — '<build>' chứa cấu hình build lifecycle, resources và plugins."
      ]
    },
    {
      "level": "easy",
      "scenario": "Bạn muốn chạy build Maven trên CI/CD server nhưng máy chủ này không cài đặt sẵn Maven trong biến môi trường PATH.",
      "q": "Cách thực thi tối ưu và chuẩn mực nhất là gì?",
      "options": [
        "Cài đặt Maven thủ công bằng apt-get hoặc yum trong pipeline script",
        "Sử dụng Maven Wrapper có sẵn trong repo: './mvnw clean package'",
        "Copy thư mục cài đặt Maven từ máy cá nhân lên server qua SSH",
        "Chuyển toàn bộ dự án sang Makefile"
      ],
      "answer": 1,
      "explain": "Maven Wrapper (mvnw / mvnw.cmd) tự động tải đúng phiên bản Maven được chỉ định trong '.mvn/wrapper/maven-wrapper.properties', đảm bảo tính độc lập môi trường.",
      "why": [
        "Sai — Cài thủ công bằng apt/yum có thể tải sai phiên bản Maven so với bản developer test trên máy local.",
        "✓ Đúng — Maven Wrapper là chuẩn mực ngành công nghiệp, tự động download và cache đúng version Maven mà dự án yêu cầu.",
        "Sai — Copy binary thủ công vi phạm nguyên tắc CI/CD immutable và không tự động hóa.",
        "Sai — Makefile không phải công cụ build hệ sinh thái Java tiêu chuẩn."
      ]
    },
    {
      "level": "hard",
      "scenario": "Khi ứng dụng Java chạy với Virtual Threads, lập trình viên sử dụng khối 'synchronized' bao quanh một tác vụ I/O tốn 500ms (ví dụ gọi Socket).",
      "q": "Hiện tượng gì xảy ra với Virtual Thread và OS Thread (Carrier Thread) bên dưới?",
      "options": [
        "Virtual Thread tự động unmount và giải phóng Carrier Thread cho task khác",
        "Xảy ra hiện tượng Thread Pinning: Virtual Thread bị ghim chặt vào Carrier Thread, chặn đứng Carrier Thread trong 500ms",
        "Java runtime ném ra IllegalStateException",
        "Khối synchronized bị bỏ qua tự động"
      ],
      "answer": 1,
      "explain": "Trong Java 21, khi Virtual Thread gặp 'synchronized' hoặc native call (JNI) trong lúc block I/O, nó bị 'pinned' vào carrier thread bên dưới. Giải pháp là thay bằng ReentrantLock.",
      "why": [
        "Sai — Khối synchronized trong Java 21 ngăn cản cơ chế unmount của Virtual Thread (trừ khi nâng cấp lên Java 24 preview).",
        "✓ Đúng — Hiện tượng 'Thread Pinning' làm triệt tiêu ưu thế của Virtual Threads, gây cạn kiệt Carrier Thread pool (mặc định bằng số CPU cores).",
        "Sai — JVM không ném exception mà âm thầm block Carrier Thread, làm giảm throughput nghiêm trọng.",
        "Sai — Khối synchronized vẫn đảm bảo mutual exclusion, không bao giờ bị bỏ qua."
      ]
    },
    {
      "level": "medium",
      "scenario": "Để tránh hiện tượng Thread Pinning khi sử dụng Virtual Threads, lập trình viên cần thay thế khối 'synchronized' bằng cơ chế đồng bộ nào?",
      "q": "Lựa chọn thay thế tương thích tốt nhất với Virtual Threads:",
      "options": [
        "java.util.concurrent.locks.ReentrantLock",
        "Thread.sleep()",
        "Object.wait()",
        "volatile boolean flag"
      ],
      "answer": 0,
      "explain": "'ReentrantLock' được thiết kế lại hoàn toàn tương thích với Virtual Threads: khi lock bị chiếm giữ, Virtual Thread sẽ unmount êm đẹp khỏi carrier thread mà không gây pinning.",
      "why": [
        "✓ Đúng — ReentrantLock cho phép Virtual Thread unmount bình thường khi chờ lock, giải phóng Carrier Thread cho hàng ngàn Virtual Thread khác.",
        "Sai — Thread.sleep() không cung cấp cơ chế mutual exclusion (khóa bảo vệ tài nguyên).",
        "Sai — Object.wait() phải được gọi bên trong synchronized block, vẫn gây pinning.",
        "Sai — Biến volatile chỉ đảm bảo tính hiển thị (visibility), không bảo vệ được critical section gồm nhiều thao tác."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong Java 21 Record, bạn muốn kiểm tra dữ liệu đầu vào (validation) khi tạo đối tượng mà không muốn viết lại toàn bộ danh sách tham số.",
      "q": "Loại constructor nào sau đây là đặc trưng của Record phục vụ mục đích này?",
      "options": [
        "Default Constructor không tham số",
        "Compact Constructor không có cặp ngoặc tròn tham số: 'public User { ... }'",
        "Static Factory Method bắt buộc",
        "Copy Constructor có từ khóa 'clone'"
      ],
      "answer": 1,
      "explain": "Compact Constructor trong Record loại bỏ phần khai báo tham số '(String name, int age)'. Lập trình viên chỉ cần validate và gán lại biến trước khi compiler tự động gán vào các field private final.",
      "why": [
        "Sai — Record mặc định không có no-args constructor nếu các component có khai báo fields.",
        "✓ Đúng — 'public OrderRecord { if (amount < 0) throw new IllegalArgumentException(); }' là Compact Constructor chuẩn của Record.",
        "Sai — Static Factory Method là pattern thiết kế, không phải cú pháp constructor tích hợp của ngôn ngữ.",
        "Sai — Record không khuyến khích cơ chế clone() cổ điển."
      ]
    },
    {
      "level": "easy",
      "scenario": "Bạn có một đoạn code sử dụng Optional.orElse() và Optional.orElseGet().",
      "q": "Đoạn code sau đây có hành vi khác nhau như thế nào?",
      "code": "User u1 = optUser.orElse(callDatabase());\nUser u2 = optUser.orElseGet(() -> callDatabase());",
      "options": [
        "Cả hai phương thức đều chỉ gọi callDatabase() khi optUser bị rỗng",
        "orElse() LUÔN LUÔN thực thi callDatabase() ngay cả khi optUser đã có giá trị; orElseGet() chỉ thực thi khi optUser rỗng",
        "orElseGet() chạy nhanh hơn vì dùng đa luồng",
        "orElse() trả về Optional<User>, orElseGet() trả về User"
      ],
      "answer": 1,
      "explain": "orElse(T other) nhận một giá trị tính toán sẵn, do đó tham số luôn được evaluate ngay lập tức (eager evaluation). orElseGet(Supplier<T>) là lazy evaluation, chỉ gọi hàm khi rỗng.",
      "why": [
        "Sai — orElse() không lazy! Đây là cái bẫy kinh điển khiến ứng dụng liên tục gọi database hoặc external API vô ích.",
        "✓ Đúng — orElse() đánh giá biểu thức tham số ngay thời điểm gọi hàm. orElseGet() nhận Supplier và chỉ kích hoạt khi Optional.empty().",
        "Sai — orElseGet() chạy trên cùng luồng hiện tại, không liên quan đến đa luồng.",
        "Sai — Cả hai phương thức đều unwrap và trả về đối tượng User bên trong."
      ]
    },
    {
      "level": "medium",
      "scenario": "Một lập trình viên Java lâu năm viết vòng lặp xử lý 10 triệu số nguyên sử dụng đối tượng 'Integer' thay vì kiểu nguyên thủy 'int'.",
      "q": "Hậu quả nghiêm trọng nhất của việc Autoboxing liên tục trong vòng lặp lớn là gì?",
      "options": [
        "Chương trình bị lỗi NullPointerException ngay lập tức",
        "Tạo ra hàng triệu đối tượng ngắn hạn trên Heap, gây áp lực rác khổng lồ (GC Pressure) và tốn bộ nhớ gấp 4 lần",
        "Trình biên dịch Java từ chối biên dịch vòng lặp",
        "Không có khác biệt nào vì JIT compiler sẽ chuyển hết thành int"
      ],
      "answer": 1,
      "explain": "Kiểu nguyên thủy 'int' chiếm 4 bytes trên Stack/CPU register. Đối tượng 'Integer' chiếm 16-24 bytes trên Heap kèm overhead object header và con trỏ tham chiếu, làm GC chạy liên tục.",
      "why": [
        "Sai — Không có NPE nếu các số đều có giá trị hợp lệ.",
        "✓ Đúng — Autoboxing trong hot-path tạo ra rác liên tục, gây GC pause và giảm băng thông bộ nhớ cache L1/L2 của CPU.",
        "Sai — Java hỗ trợ autoboxing hoàn toàn hợp lệ về mặt cú pháp.",
        "Sai — Mặc dù JIT có Escape Analysis, nhưng với collection hoặc phạm vi lớn, việc cấp phát Heap cho Integer vẫn xảy ra."
      ]
    },
    {
      "level": "hard",
      "scenario": "Trong kiến trúc Microservices hiện đại, khi build Docker image cho ứng dụng Java Spring Boot chạy trên production.",
      "q": "Tại sao nên sử dụng Docker Multi-stage build và phân tách COPY pom.xml trước khi COPY src/?",
      "options": [
        "Để mã hóa mã nguồn không bị hacker đọc trộm trong image",
        "Tận dụng tối đa Docker Layer Caching: chỉ tải lại dependencies khi pom.xml thay đổi, giúp build nhanh hơn gấp 10 lần",
        "Vì Docker bắt buộc phải copy file pom.xml đầu tiên mới chạy được lệnh RUN",
        "Để giảm độ trễ mạng khi chạy container trên Kubernetes"
      ],
      "answer": 1,
      "explain": "Docker cache các layer theo thứ tự. Nếu không sửa dependencies (pom.xml), Docker sẽ tái sử dụng cache của layer tải dependencies, chỉ build lại layer code (src/) khi developer commit.",
      "why": [
        "Sai — Docker multi-stage build không mã hóa source code, nó chỉ tách biệt môi trường build (JDK) và môi trường chạy (JRE).",
        "✓ Đúng — Đây là best practice hàng đầu của DevOps: tách biệt layer ít thay đổi (dependencies) với layer thay đổi liên tục (mã nguồn ứng dụng).",
        "Sai — Docker không có ràng buộc thứ tự file, đây là kỹ thuật chủ động của lập trình viên.",
        "Sai — Layer caching chỉ ảnh hưởng đến tốc độ build, không can thiệp vào network latency runtime."
      ]
    },
    {
      "level": "medium",
      "scenario": "Để bảo mật container trên Kubernetes theo tiêu chuẩn CIS Benchmark, container Java không được phép chạy với quyền root (UID 0).",
      "q": "Chỉ thị nào trong Dockerfile giúp chuyển container sang chạy dưới user không có đặc quyền?",
      "options": [
        "RUN chmod 777 /app.jar",
        "USER appuser:appgroup",
        "ENV PRIVILEGE=false",
        "EXPOSE 8080"
      ],
      "answer": 1,
      "explain": "Chỉ thị 'USER <user>[:<group>]' chuyển tiến độ thực thi của container sang một người dùng thường, ngăn chặn việc leo thang đặc quyền (privilege escalation) nếu container bị tấn công.",
      "why": [
        "Sai — chmod 777 cấp toàn quyền đọc ghi thực thi cho mọi người, là lỗ hổng bảo mật nghiêm trọng.",
        "✓ Đúng — Tạo user bằng 'RUN addgroup -S appgroup && adduser -S appuser -G appgroup' rồi dùng 'USER appuser:appgroup' là chuẩn production.",
        "Sai — Không có biến môi trường nào của Docker tự động tước quyền root.",
        "Sai — EXPOSE chỉ là tài liệu khai báo cổng, không quản lý phân quyền tiến trình."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong Git, một developer vô tình commit thông tin nhạy cảm (API Secret Key) vào commit gần nhất trên branch cá nhân và chưa push lên remote.",
      "q": "Lệnh Git nào sau đây giúp loại bỏ file đó khỏi commit mà vẫn giữ nguyên các thay đổi khác?",
      "options": [
        "git push --force",
        "git rm -rf . && git commit",
        "git reset --soft HEAD~1 rồi unstage file nhạy cảm và commit lại",
        "git branch -D main"
      ],
      "answer": 2,
      "explain": "'git reset --soft HEAD~1' đưa HEAD về commit trước đó nhưng vẫn giữ nguyên tất cả thay đổi trên Staging Area, cho phép unstage file nhạy cảm dễ dàng trước khi commit mới.",
      "why": [
        "Sai — git push --force đẩy mã lên remote, làm lộ thông tin nhạy cảm ra toàn team.",
        "Sai — git rm -rf . sẽ xóa sạch toàn bộ mã nguồn của dự án.",
        "✓ Đúng — 'git reset --soft HEAD~1' là cách an toàn và chuyên nghiệp nhất để chỉnh sửa commit cuối cùng chưa push.",
        "Sai — Xóa branch main gây mất dữ liệu nhánh chính."
      ]
    },
    {
      "level": "hard",
      "scenario": "Trong HotSpot JVM, cơ chế Tiered Compilation bao gồm nhiều tầng xử lý mã bytecode.",
      "q": "Vai trò chính của C1 Compiler (Client) và C2 Compiler (Server) là gì?",
      "options": [
        "C1 biên dịch code sang C++, C2 biên dịch code sang Assembly",
        "C1 tối ưu thời gian khởi động nhanh (fast startup); C2 phân tích thống kê chuyên sâu (profiling) để sinh mã máy tối ưu hiệu năng cao nhất (peak performance)",
        "C1 xử lý frontend HTML, C2 xử lý backend Java",
        "C1 chỉ chạy trên máy tính Windows, C2 chạy trên máy tính Linux"
      ],
      "answer": 1,
      "explain": "Tiered Compilation kết hợp tốc độ khởi động nhanh của C1 (với các cấp profiling) và khả năng tối ưu hóa mã máy tối thượng của C2 cho các đoạn mã 'nóng' (hotspots).",
      "why": [
        "Sai — Cả C1 và C2 đều biên dịch trực tiếp từ Java bytecode sang mã máy nhị phân (Machine code).",
        "✓ Đúng — C1 biên dịch nhanh với ít tối ưu để ứng dụng start mượt mà; C2 áp dụng Inlining, Loop Unrolling, Escape Analysis cho peak throughput.",
        "Sai — JVM compiler không liên quan đến HTML frontend.",
        "Sai — C1 và C2 đều là các module nội bộ của HotSpot JVM đa nền tảng."
      ]
    },
    {
      "level": "medium",
      "scenario": "Bạn muốn định nghĩa một Class trong Java mà dữ liệu của nó hoàn toàn bất biến (Immutable), không thể sửa đổi sau khi khởi tạo.",
      "q": "Quy tắc nào sau đây KHÔNG bắt buộc để tạo ra một class Immutable chuẩn mực?",
      "options": [
        "Đánh dấu tất cả các trường dữ liệu là private và final",
        "Không cung cấp bất kỳ hàm setter nào",
        "Bắt buộc class phải kế thừa từ abstract class cha",
        "Khóa class bằng từ khóa final (hoặc dùng Record) và tạo defensive copy cho các mutable fields như Date/List"
      ],
      "answer": 2,
      "explain": "Một class bất biến không cần kế thừa từ bất kỳ class nào. Ngược lại, nó nên được đánh dấu là 'final' để ngăn chặn các subclass ghi đè behavior và phá vỡ tính bất biến.",
      "why": [
        "Sai — Đây là quy tắc bắt buộc: private để đóng gói, final để chỉ gán giá trị 1 lần trong constructor.",
        "Sai — Đây là quy tắc bắt buộc: không có setter để ngăn chặn thay đổi trạng thái sau khởi tạo.",
        "✓ Đúng — Không cần kế thừa từ abstract class nào cả. Thực tế class immutable thường trực tiếp kế thừa Object hoặc dùng Record.",
        "Sai — Đây là quy tắc cực kỳ quan trọng: class final chống override và defensive copy bảo vệ mutable collections."
      ]
    },
    {
      "level": "hard",
      "scenario": "Trong ứng dụng backend xử lý tài chính, lập trình viên cần tính toán số tiền và lãi suất chính xác tuyệt đối mà không bị sai số làm tròn số thực dấu phẩy động.",
      "q": "Kiểu dữ liệu và constructor nào phải được sử dụng?",
      "options": [
        "double hoặc float",
        "new BigDecimal(0.1)",
        "BigDecimal.valueOf(0.1) hoặc new BigDecimal(\"0.1\")",
        "Long.MAX_VALUE"
      ],
      "answer": 2,
      "explain": "'new BigDecimal(0.1)' với tham số double vẫn bị sai số nhị phân (0.10000000000000000555...). Phải dùng 'new BigDecimal(\"0.1\")' dạng chuỗi hoặc 'BigDecimal.valueOf(0.1)'.",
      "why": [
        "Sai — float và double tuân theo chuẩn IEEE 754, không thể biểu diễn chính xác số thập phân như 0.1, gây sai lệch tiền tệ.",
        "Sai — Bẫy kinh điển: new BigDecimal(double) truyền vào giá trị đã bị sai số từ trước.",
        "✓ Đúng — Luôn dùng chuỗi String constructor 'new BigDecimal(\"0.1\")' hoặc static factory 'BigDecimal.valueOf(val)' trong nghiệp vụ tài chính.",
        "Sai — Long chỉ chứa số nguyên, không xử lý được các phép tính lãi suất phần trăm có số lẻ."
      ]
    },
    {
      "level": "medium",
      "scenario": "Một method trong Java nhận tham số danh sách các đối tượng và chỉ đọc dữ liệu, không sửa đổi danh sách.",
      "q": "Khai báo kiểu generic nào sau đây tuân thủ đúng nguyên lý PECS (Producer Extends, Consumer Super)?",
      "options": [
        "List<? extends Number> list",
        "List<? super Number> list",
        "List<Object> list",
        "List<?> list không cho phép đọc dữ liệu Number"
      ],
      "answer": 0,
      "explain": "PECS: Producer Extends, Consumer Super. Nếu danh sách đóng vai trò cung cấp dữ liệu để đọc (Producer), ta dùng '? extends T' (cho phép truyền List<Integer>, List<Double>).",
      "why": [
        "✓ Đúng — '? extends Number' cho phép phương thức đọc dữ liệu dưới dạng Number từ bất kỳ subtype nào (Integer, Long, Double).",
        "Sai — '? super Number' dùng cho Consumer khi cần ghi (write/add) dữ liệu vào danh sách.",
        "Sai — 'List<Object>' không chấp nhận đối số 'List<Integer>' vì generic trong Java mang tính bất biến (invariant).",
        "Sai — 'List<?>' chỉ cho phép đọc dưới dạng Object thuần túy, mất thông tin Number."
      ]
    }
  ],
  "1": [
    {
      "level": "medium",
      "scenario": "Trong Spring Boot 3, khi bạn khai báo @Configuration(proxyBeanMethods = false), container sẽ hoạt động khác gì so với mặc định?",
      "q": "Ý nghĩa kỹ thuật của thuộc tính 'proxyBeanMethods = false' (Lite Mode) là gì?",
      "options": [
        "Tắt toàn bộ việc tạo bean bên trong configuration class",
        "Không sinh proxy CGLIB bao bọc class cấu hình, các method gọi trực tiếp lẫn nhau sẽ tạo instance mới chứ không lấy từ IoC container (tối ưu tốc độ khởi động)",
        "Chuyển toàn bộ các Bean bên trong thành Prototype scope",
        "Ép buộc class phải implement interface"
      ],
      "answer": 1,
      "explain": "proxyBeanMethods=false giúp Spring không cần sinh CGLIB subclass để can thiệp vào các lời gọi method @Bean nội bộ, giúp giảm overhead và tăng tốc độ khởi động (thích hợp cho GraalVM Native Image).",
      "why": [
        "Sai — Các bean vẫn được đăng ký bình thường vào ApplicationContext.",
        "✓ Đúng — Không có CGLIB proxy, method call là Java method call bình thường, giúp tiết kiệm bộ nhớ và tương thích native compilation.",
        "Sai — Scope của bean vẫn là singleton mặc định trong ApplicationContext.",
        "Sai — Không yêu cầu interface vì không dùng JDK dynamic proxy."
      ]
    },
    {
      "level": "hard",
      "scenario": "Hai bean ServiceA và ServiceB phụ thuộc lẫn nhau qua Constructor Injection, khiến ứng dụng ném ra BeanCurrentlyInCreationException khi khởi động.",
      "q": "Cách giải quyết kiến trúc (Architectural solution) tốt nhất cho vấn đề Circular Dependency là gì?",
      "options": [
        "Dùng @Lazy trên một trong hai constructor",
        "Bật spring.main.allow-circular-references=true trong application.properties",
        "Tách phần logic dùng chung của cả 2 ra một ServiceC độc lập hoặc sử dụng Spring ApplicationEvent để giải phóng phụ thuộc vòng",
        "Chuyển cả hai sang Field Injection với @Autowired"
      ],
      "answer": 2,
      "explain": "Phụ thuộc vòng là dấu hiệu vi phạm nguyên lý Single Responsibility Principle (SRP). Giải pháp kiến trúc chuẩn mực nhất là tách lớp trung gian (ServiceC) hoặc dùng Event-driven.",
      "why": [
        "Sai về mặt kiến trúc — @Lazy chỉ là mẹo hoãn khởi tạo bằng proxy tạm thời, không giải quyết được code smell.",
        "Sai — Cờ này bị Spring Boot 2.6+ tắt mặc định vì đây là thiết kế xấu, bật lại sẽ che giấu lỗi thiết kế.",
        "✓ Đúng — Tái cấu trúc (refactoring) tách logic chung ra Service trung gian hoặc dùng Event là chuẩn Enterprise Clean Architecture.",
        "Sai — Spring Boot 3 vẫn phát hiện và chặn circular references ngay cả với field injection."
      ]
    },
    {
      "level": "medium",
      "scenario": "Một lập trình viên muốn một Bean chỉ được tạo ra khi biến môi trường hoặc cấu hình trong application.yml thỏa mãn giá trị nhất định.",
      "q": "Annotation điều kiện nào sau đây được dùng phổ biến nhất cho kịch bản này?",
      "options": [
        "@ConditionalOnClass",
        "@ConditionalOnProperty(prefix = \"app.feature\", name = \"enabled\", havingValue = \"true\")",
        "@ConditionalOnMissingBean",
        "@Profile"
      ],
      "answer": 1,
      "explain": "@ConditionalOnProperty kiểm tra sự tồn tại và giá trị cụ thể của cấu hình property trong Environment trước khi quyết định khởi tạo Bean.",
      "why": [
        "Sai — @ConditionalOnClass kiểm tra sự tồn tại của class trong classpath (thường dùng trong Spring AutoConfiguration).",
        "✓ Đúng — @ConditionalOnProperty cho phép bật/tắt tính năng linh hoạt qua configuration file.",
        "Sai — @ConditionalOnMissingBean kiểm tra xem trong IoC container đã có bean nào cùng kiểu chưa.",
        "Sai — @Profile kiểm tra profile kích hoạt (dev, prod) chứ không kiểm tra từng thuộc tính cụ thể."
      ]
    },
    {
      "level": "medium",
      "scenario": "Bạn muốn thực thi một đoạn mã logic khởi tạo ngay sau khi Bean đã được Spring inject đầy đủ các dependencies.",
      "q": "Annotation chuẩn Java (Jakarta) nào được khuyến nghị sử dụng?",
      "options": [
        "@PostConstruct (từ jakarta.annotation)",
        "@PreDestroy",
        "@EventListener(ContextRefreshedEvent.class)",
        "@Bean(initMethod = \"setup\")"
      ],
      "answer": 0,
      "explain": "@PostConstruct là lifecycle callback tiêu chuẩn được gọi ngay sau khi dependency injection hoàn tất và trước khi Bean được đưa vào sử dụng.",
      "why": [
        "✓ Đúng — @PostConstruct từ jakarta.annotation là phương pháp chuẩn và tiện lợi nhất cho lifecycle initialization của Bean.",
        "Sai — @PreDestroy được gọi ngay trước khi bean bị hủy khỏi container.",
        "Sai — ContextRefreshedEvent lắng nghe khi toàn bộ ApplicationContext đã tải xong, không phải vòng đời của riêng bean đó.",
        "Sai — initMethod dùng trong @Bean của class cấu hình, không viết trực tiếp lên method của component class."
      ]
    },
    {
      "level": "hard",
      "scenario": "Một Service dạng Singleton inject một Prototype Bean để thực hiện công việc cho từng request người dùng.",
      "q": "Vấn đề gì sẽ xảy ra và cách xử lý đúng chuẩn trong Spring là gì?",
      "options": [
        "Prototype Bean vẫn được tạo mới mỗi khi Service gọi method của nó",
        "Prototype Bean chỉ được inject đúng 1 lần khi Singleton Service được tạo, trở thành Singleton gián tiếp; khắc phục bằng @Lookup method injection hoặc ObjectProvider<T>",
        "Spring ném ra IllegalStateException khi khởi động",
        "Mỗi luồng sẽ tự động nhân bản Prototype Bean"
      ],
      "answer": 1,
      "explain": "Vì Singleton bean chỉ khởi tạo một lần duy nhất, các dependency của nó (dù khai báo Prototype) cũng chỉ được inject 1 lần tại thời điểm đó. Phải dùng @Lookup hoặc ObjectProvider để lấy instance mới mỗi lần.",
      "why": [
        "Sai — Nhận thức sai lầm phổ biến: Spring chỉ inject tại thời điểm tạo Singleton bean, không tự inject lại khi gọi method.",
        "✓ Đúng — Đây là bài toán kinh điển 'Scoped Bean Injection'. Dùng ObjectProvider<MyPrototype> hoặc @Lookup method để kéo instance mới.",
        "Sai — Spring không ném exception vì cú pháp hoàn toàn hợp lệ.",
        "Sai — Prototype scope không phụ thuộc vào Thread mà phụ thuộc vào mỗi lần getBean()."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong tệp application.yml, bạn khai báo cấu hình có tiền tố 'app.security.jwt' với nhiều trường: secret, expiration-days, issuer.",
      "q": "Cách tiếp cận type-safe và clean code nhất để map cấu hình này vào Java object trong Spring Boot 3 là gì?",
      "options": [
        "Dùng nhiều annotation @Value(\"${app.security.jwt.secret}\") trên từng biến",
        "Tạo một Record hoặc Class có gắn @ConfigurationProperties(prefix = \"app.security.jwt\")",
        "Đọc thủ công qua Environment.getProperty()",
        "Tạo một Singleton static class"
      ],
      "answer": 1,
      "explain": "@ConfigurationProperties cung cấp cơ chế type-safe binding, hỗ trợ validation với JSR-380, tự động chuyển đổi kiểu dữ liệu và code completion trong IDE.",
      "why": [
        "Sai — @Value phân tán, không type-safe, khó bảo trì khi số lượng cấu hình lớn.",
        "✓ Đúng — @ConfigurationProperties kết hợp Record hoặc Immutable class là chuẩn mực Spring Boot hiện đại.",
        "Sai — Environment.getProperty() đòi hỏi viết code thủ công và ép kiểu, dễ lỗi runtime.",
        "Sai — Static class không tận dụng được cơ chế reload và dependency injection của Spring."
      ]
    },
    {
      "level": "medium",
      "scenario": "Thứ tự ưu tiên nạp cấu hình (Property Resolution Order) nào sau đây trong Spring Boot là chính xác từ CAO NHẤT đến THẤP NHẤT?",
      "q": "Chọn thứ tự ghi đè cấu hình đúng:",
      "options": [
        "application.yml → OS Environment Variables → Command Line Arguments (--server.port=9090)",
        "Command Line Arguments → OS Environment Variables → application-{profile}.yml → application.yml",
        "application.yml → application-{profile}.yml → OS Environment Variables",
        "OS Environment Variables → Command Line Arguments → application.yml"
      ],
      "answer": 1,
      "explain": "Command Line Arguments luôn có ưu tiên cao nhất, kế đến là Java System Properties, OS Environment Variables, application-{profile}.yml và cuối cùng là application.yml mặc định.",
      "why": [
        "Sai — Command Line có độ ưu tiên cao nhất chứ không phải thấp nhất.",
        "✓ Đúng — Tham số dòng lệnh (--param) > Biến môi trường hệ điều hành (ENV) > Profile-specific config > Default config.",
        "Sai — Profile specific file luôn ghi đè file application.yml mặc định.",
        "Sai — Command line args cao hơn OS environment variables."
      ]
    },
    {
      "level": "easy",
      "scenario": "Bạn muốn truyền nhiều profile cùng lúc khi khởi động Spring Boot bằng biến môi trường trên Linux server.",
      "q": "Cú pháp biến môi trường chuẩn xác của Spring Boot là gì?",
      "options": [
        "SPRING_PROFILES_ACTIVE=prod,kafka",
        "SPRING_ACTIVE_PROFILES: prod",
        "PROFILES_ACTIVE=prod",
        "SPRING_BOOT_ENV=prod"
      ],
      "answer": 0,
      "explain": "Thuộc tính 'spring.profiles.active' được chuyển đổi sang biến môi trường dạng UPPERCASE_UNDERSCORE là 'SPRING_PROFILES_ACTIVE'. Có thể truyền nhiều profile cách nhau bởi dấu phẩy.",
      "why": [
        "✓ Đúng — Cú pháp chuẩn của Spring Boot relaxed binding cho environment variable.",
        "Sai — Tên biến sai quy ước của framework.",
        "Sai — Thiếu tiền tố 'SPRING_'.",
        "Sai — Không phải biến môi trường của Spring."
      ]
    },
    {
      "level": "hard",
      "scenario": "Trong Spring Core, sự khác biệt căn bản giữa BeanFactory và ApplicationContext là gì?",
      "q": "Phát biểu nào sau đây phản ánh chính xác nhất bản chất kỹ thuật?",
      "options": [
        "BeanFactory khởi tạo tất cả singleton bean ngay khi nạp; ApplicationContext chỉ khởi tạo khi được gọi (lazy)",
        "ApplicationContext là interface con của BeanFactory, bổ sung tính năng i18n, Event publishing, tích hợp AOP và mặc định EAGER khởi tạo tất cả Singleton beans khi startup",
        "BeanFactory chỉ dùng cho ứng dụng console; ApplicationContext chỉ dùng cho web application",
        "BeanFactory không hỗ trợ Dependency Injection"
      ],
      "answer": 1,
      "explain": "ApplicationContext mở rộng BeanFactory, thêm enterprise features và eager-loads singleton beans để phát hiện lỗi cấu hình ngay lúc khởi động thay vì đợi runtime.",
      "why": [
        "Sai — Ngược lại: BeanFactory mặc định lazy-load, còn ApplicationContext mặc định eager-load singleton beans.",
        "✓ Đúng — ApplicationContext kế thừa BeanFactory và cung cấp bộ tính năng hoàn chỉnh của Spring Enterprise Container.",
        "Sai — Cả hai đều có thể dùng cho bất kỳ loại ứng dụng Java nào.",
        "Sai — BeanFactory là tầng lõi cung cấp IoC và DI đầu tiên của Spring."
      ]
    },
    {
      "level": "medium",
      "scenario": "Một service cần phát đi sự kiện 'OrderCreatedEvent' mà không muốn gọi trực tiếp đến NotificationService hay InventoryService.",
      "q": "Cơ chế nào trong Spring Framework hỗ trợ mô hình In-Memory Event Publishing này?",
      "options": [
        "ApplicationEventPublisher và @EventListener",
        "JMS Queue",
        "Kafka Template bắt buộc",
        "Observer pattern tự viết bằng Thread"
      ],
      "answer": 0,
      "explain": "Spring tích hợp sẵn ApplicationEventPublisher. Service chỉ cần gọi 'publisher.publishEvent(new OrderCreatedEvent(...))' và các listener gắn @EventListener sẽ tự động nhận sự kiện.",
      "why": [
        "✓ Đúng — Cơ chế ApplicationEvent in-process của Spring giúp loose coupling tuyệt đối giữa các service.",
        "Sai — JMS là messaging middleware ngoài, quá phức tạp cho in-memory event.",
        "Sai — Kafka là distributed broker, không bắt buộc cho in-process decoupling.",
        "Sai — Tự viết thread phức tạp và không tận dụng được transaction lifecycle của Spring (@TransactionalEventListener)."
      ]
    },
    {
      "level": "hard",
      "scenario": "Bạn muốn một Event Listener chỉ được thực thi sau khi Transaction hiện tại của cơ sở dữ liệu đã COMMIT thành công.",
      "q": "Annotation nào cần được sử dụng thay thế cho @EventListener?",
      "options": [
        "@Transactional(propagation = Propagation.REQUIRES_NEW)",
        "@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)",
        "@Async(\"eventExecutor\")",
        "@Order(1)"
      ],
      "answer": 1,
      "explain": "@TransactionalEventListener lắng nghe sự kiện đồng bộ với pha của transaction. Pha 'AFTER_COMMIT' đảm bảo chỉ khi DB lưu xong thì mới gửi email/bắn thông báo.",
      "why": [
        "Sai — @Transactional chỉ quản lý transaction, không điều khiển việc lắng nghe event theo pha.",
        "✓ Đúng — Đây là pattern chuẩn xử lý side-effects: đảm bảo data an toàn trong DB trước khi gửi SMS/Email.",
        "Sai — @Async chỉ đẩy task sang thread pool khác, không đảm bảo transaction đã commit.",
        "Sai — @Order chỉ xác định thứ tự ưu tiên giữa các listener."
      ]
    },
    {
      "level": "medium",
      "scenario": "Khi tạo một custom Spring Boot Starter (ví dụ: my-company-spring-boot-starter), file nào là điểm neo đăng ký Auto-Configuration trong Spring Boot 3?",
      "q": "Vị trí file cấu hình chuẩn trong Spring Boot 3 là gì?",
      "options": [
        "src/main/resources/META-INF/spring.factories",
        "src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports",
        "src/main/resources/application.properties",
        "src/main/resources/META-INF/spring-boot.xml"
      ],
      "answer": 1,
      "explain": "Từ Spring Boot 2.7 và bắt buộc trong Spring Boot 3, cơ chế 'spring.factories' cũ cho auto-configuration đã bị thay thế hoàn toàn bằng file 'META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports'.",
      "why": [
        "Sai — spring.factories là cách cũ của Spring Boot 2.x, không còn được dùng cho AutoConfiguration trong Spring Boot 3.",
        "✓ Đúng — Spring Boot 3 đọc danh sách class cấu hình tự động từ file .imports này.",
        "Sai — application.properties dùng cho config properties của user, không đăng ký Starter.",
        "Sai — XML không phải định dạng đăng ký Auto-configuration hiện đại."
      ]
    },
    {
      "level": "medium",
      "scenario": "Một method trong Spring Service có đánh dấu @Async nhưng khi chạy thì method vẫn bị block trên luồng chính (Main/HTTP Thread).",
      "q": "Nguyên nhân phổ biến nhất dẫn đến hiện tượng @Async không hoạt động là gì?",
      "options": [
        "Chưa bật @EnableAsync trên Configuration class HOẶC gọi method @Async từ một method khác trong CÙNG một class (Self-invocation)",
        "Do CPU máy tính chỉ có 1 core",
        "Do method trả về CompletableFuture",
        "Do method có tham số truyền vào"
      ],
      "answer": 0,
      "explain": "Spring AOP hoạt động dựa trên Proxy. Khi gọi 'this.myAsyncMethod()', lời gọi không đi qua Spring Proxy nên interceptor @Async không được kích hoạt.",
      "why": [
        "✓ Đúng — 2 nguyên nhân cốt tử: Quên @EnableAsync hoặc lỗi Self-invocation gọi trực tiếp method nội bộ bỏ qua Spring Proxy.",
        "Sai — Luồng ảo hoặc thread pool vẫn tạo được trên 1 core.",
        "Sai — @Async khuyến khích trả về CompletableFuture<T> để lấy kết quả.",
        "Sai — Method có tham số hoàn toàn hợp lệ."
      ]
    },
    {
      "level": "hard",
      "scenario": "Trong Spring AOP, sự khác biệt giữa JDK Dynamic Proxy và CGLIB Proxy là gì?",
      "q": "Phát biểu nào sau đây là chính xác?",
      "options": [
        "JDK Dynamic Proxy tạo proxy bằng cách kế thừa class; CGLIB tạo proxy qua Interface",
        "JDK Dynamic Proxy yêu cầu target class phải implement ít nhất một Interface; CGLIB tạo proxy bằng cách kế thừa và sinh subclass của target class",
        "Spring Boot 3 mặc định dùng JDK Dynamic Proxy cho mọi trường hợp",
        "CGLIB có thể can thiệp vào các phương thức được đánh dấu 'final'"
      ],
      "answer": 1,
      "explain": "JDK Proxy dựa trên java.lang.reflect.Proxy và bắt buộc Interface. CGLIB sinh bytecode mở rộng subclass, và Spring Boot mặc định sử dụng CGLIB proxy cho tất cả bean.",
      "why": [
        "Sai — Ngược lại hoàn toàn: JDK Proxy dùng Interface, CGLIB kế thừa class.",
        "✓ Đúng — JDK Dynamic Proxy cần interface, trong khi CGLIB tạo subclass kế thừa class mục tiêu.",
        "Sai — Spring Boot mặc định bật 'spring.aop.proxy-target-class=true' (ưu tiên dùng CGLIB).",
        "Sai — CGLIB không thể ghi đè (override) phương thức hoặc class final."
      ]
    },
    {
      "level": "medium",
      "scenario": "Bạn muốn định nghĩa thời gian sống của Bean gắn liền với vòng đời của một phiên làm việc người dùng trên trình duyệt.",
      "q": "Scope nào trong Spring Web MVC phục vụ mục đích này?",
      "options": [
        "prototype",
        "singleton",
        "session (hoặc @SessionScope)",
        "application"
      ],
      "answer": 2,
      "explain": "@SessionScope (hoặc scope = 'session') tạo ra một bean instance duy nhất cho mỗi HTTP Session của người dùng và tự hủy khi session hết hạn.",
      "why": [
        "Sai — prototype tạo mới mỗi lần getBean().",
        "Sai — singleton chỉ có 1 instance cho toàn bộ ứng dụng.",
        "✓ Đúng — Session scope gắn liền với HttpSession của người dùng cụ thể.",
        "Sai — application scope gắn liền với ServletContext của cả web app."
      ]
    },
    {
      "level": "easy",
      "scenario": "Bạn muốn inject giá trị từ biến môi trường của hệ thống máy chủ vào một trường trong Spring Bean.",
      "q": "Cú pháp SpEL / Property Placeholder nào là chính xác?",
      "options": [
        "@Value(\"#{systemEnvironment['MY_VAR']}\") hoặc @Value(\"${MY_VAR:default_val}\")",
        "@Inject(\"MY_VAR\")",
        "@Environment(\"MY_VAR\")",
        "@Property(\"MY_VAR\")"
      ],
      "answer": 0,
      "explain": "@Value(\"${KEY:default}\") dùng cú pháp property placeholder hỗ trợ giá trị mặc định, hoặc #{...} dùng cú pháp Spring Expression Language (SpEL).",
      "why": [
        "✓ Đúng — @Value là annotation chuẩn để inject property và SpEL expression trong Spring.",
        "Sai — @Inject là chuẩn JSR-330 chỉ inject Bean theo kiểu, không bind property.",
        "Sai — Không có annotation @Environment trong Spring.",
        "Sai — Không có annotation @Property độc lập."
      ]
    },
    {
      "level": "medium",
      "scenario": "Để kích hoạt tính năng lập lịch tác vụ định kỳ (Scheduled Tasks) trong Spring Boot.",
      "q": "Cặp annotation nào cần phải có?",
      "options": [
        "@EnableScheduling trên configuration class và @Scheduled(cron = \"...\") trên method",
        "@EnableAsync và @Async",
        "@CronJob và @Timer",
        "@ScheduleExecutor và @Task"
      ],
      "answer": 0,
      "explain": "Cần gắn @EnableScheduling ở tầng cấu hình để khởi tạo TaskScheduler, sau đó đánh dấu @Scheduled(fixedRate/cron) trên method void không tham số.",
      "why": [
        "✓ Đúng — Bộ đôi chuẩn mực của Spring Task Scheduling.",
        "Sai — @EnableAsync dùng cho tác vụ bất đồng bộ, không phải lập lịch định kỳ.",
        "Sai — @CronJob không phải annotation chuẩn của Spring.",
        "Sai — @ScheduleExecutor không tồn tại trong Spring Framework."
      ]
    },
    {
      "level": "hard",
      "scenario": "Một method @Scheduled chạy một cronjob tốn 10 phút. Nếu đặt fixedDelay = 5000 (5 giây) hoặc cron, chuyện gì xảy ra với luồng mặc định?",
      "q": "Cấu hình mặc định của Spring TaskScheduler có đặc điểm gì?",
      "options": [
        "TaskScheduler mặc định có thread pool size = 1 (đơn luồng), khiến các task khác bị nghẽn hoàn toàn khi một task chạy chậm",
        "Mỗi task tự động tạo 10 luồng song song",
        "Spring sẽ ném TimeoutException sau 30 giây",
        "Task tự động bị hủy nếu chạy quá 1 phút"
      ],
      "answer": 0,
      "explain": "Mặc định ThreadPoolTaskScheduler của Spring có pool size là 1. Nếu một task chiếm giữ luồng, tất cả các scheduled task khác trong hệ thống sẽ bị treo chờ luồng đó hoàn thành.",
      "why": [
        "✓ Đúng — Bẫy hiệu năng nguy hiểm trong production: cần cấu hình 'spring.task.scheduling.pool.size=5' để có đa luồng.",
        "Sai — Mặc định chỉ có duy nhất 1 luồng xử lý scheduler.",
        "Sai — Không có timeout mặc định nào tự ngắt tác vụ.",
        "Sai — Tác vụ sẽ tiếp tục chạy đến khi kết thúc hoặc crash."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong Spring Boot 3, bạn muốn kiểm tra xem một Bean có tên 'customSecurityFilter' đã được đăng ký chưa trước khi tạo bean mặc định.",
      "q": "Annotation nào đáp ứng đúng điều kiện này?",
      "options": [
        "@ConditionalOnMissingBean(name = \"customSecurityFilter\")",
        "@ConditionalOnBean(type = \"customSecurityFilter\")",
        "@ConditionalOnClass(Filter.class)",
        "@ConditionalOnProperty"
      ],
      "answer": 0,
      "explain": "@ConditionalOnMissingBean cho phép lập trình viên tạo ra cơ chế 'Fallback Bean': nếu người dùng đã định nghĩa bean đó thì dùng của họ, nếu chưa có thì Spring mới tạo bean mặc định.",
      "why": [
        "✓ Đúng — @ConditionalOnMissingBean là xương sống của toàn bộ hệ sinh thái Spring Boot AutoConfiguration.",
        "Sai — @ConditionalOnBean làm ngược lại: chỉ tạo khi bean kia ĐÃ tồn tại.",
        "Sai — @ConditionalOnClass kiểm tra file .class trong classpath, không kiểm tra bean trong container.",
        "Sai — @ConditionalOnProperty kiểm tra file cấu hình .yml/.properties."
      ]
    },
    {
      "level": "medium",
      "scenario": "Khi đóng gói ứng dụng Spring Boot thành file JAR tự chạy (Executable Fat JAR).",
      "q": "Class nào đóng vai trò là Main-Class thực sự trong MANIFEST.MF chịu trách nhiệm giải nén và nạp các JAR phụ thuộc?",
      "options": [
        "Class chứa hàm main của lập trình viên (@SpringBootApplication)",
        "org.springframework.boot.loader.launch.JarLauncher",
        "java.lang.ClassLoader",
        "org.apache.catalina.startup.Bootstrap"
      ],
      "answer": 1,
      "explain": "Trong Fat JAR của Spring Boot, Main-Class thực tế là JarLauncher. Nó tạo ra một ClassLoader tùy chỉnh có khả năng đọc các nested JAR nằm trong 'BOOT-INF/lib/' rồi mới gọi đến Start-Class của developer.",
      "why": [
        "Sai — Class của developer được khai báo là 'Start-Class', không phải Main-Class của Fat JAR.",
        "✓ Đúng — JarLauncher thiết lập môi trường Classpath cho nested JARs rồi invoke Start-Class của ứng dụng.",
        "Sai — ClassLoader là abstract class của JDK, không phải executable main class.",
        "Sai — Bootstrap là của Tomcat standalone server."
      ]
    }
  ],
  "2": [
    {
      "level": "medium",
      "scenario": "Một mobile client gửi HTTP PUT request để cập nhật hồ sơ người dùng nhưng chỉ truyền trường 'fullName', bỏ qua 'phoneNumber' và 'address'.",
      "q": "Theo đặc tả RESTful chuẩn mực và nguyên tắc Idempotency, điều gì sẽ xảy ra với các trường bị bỏ qua?",
      "options": [
        "Hệ thống tự động giữ nguyên giá trị cũ của 'phoneNumber' và 'address'",
        "Hệ thống sẽ ghi đè toàn bộ tài nguyên, biến 'phoneNumber' và 'address' thành null (hoặc giá trị mặc định); nếu muốn cập nhật một phần phải dùng PATCH",
        "Máy chủ phải trả về mã lỗi 405 Method Not Allowed",
        "PUT và PATCH hoàn toàn giống nhau không có khác biệt"
      ],
      "answer": 1,
      "explain": "HTTP PUT biểu thị việc thay thế hoàn toàn (full replacement) tài nguyên đích. Nếu chỉ muốn cập nhật từng phần (partial update) mà giữ nguyên các field khác, chuẩn HTTP yêu cầu dùng PATCH.",
      "why": [
        "Sai — Đó là hành vi của PATCH (Partial Update), không phải PUT.",
        "✓ Đúng — PUT thay thế toàn bộ entity representation. Thiếu field nghĩa là client muốn set field đó về null/default.",
        "Sai — Method PUT hoàn toàn hợp lệ, không phải 405.",
        "Sai — PUT mang tính idempotent và full replacement, PATCH dùng cho delta change."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong Spring Boot 3, chuẩn trả về lỗi API nào của IETF (RFC 7807) được hỗ trợ mặc định thông qua class 'ProblemDetail'?",
      "q": "Cấu trúc trả về ProblemDetail chuẩn gồm những trường chính nào?",
      "options": [
        "code, message, data, timestamp",
        "type, title, status, detail, instance",
        "error_code, error_description, error_uri",
        "status, payload, errors"
      ],
      "answer": 1,
      "explain": "RFC 7807 (Problem Details for HTTP APIs) định nghĩa 5 trường chuẩn: type (URI loại lỗi), title (tóm tắt lỗi), status (HTTP code), detail (mô tả chi tiết lỗi cụ thể), instance (URI của request gây lỗi).",
      "why": [
        "Sai — Đây là định dạng tự chế (custom) phổ biến của các dev đời cũ, không phải chuẩn IETF RFC 7807.",
        "✓ Đúng — RFC 7807 là tiêu chuẩn quốc tế được Spring Boot 3 tích hợp sâu qua class org.springframework.http.ProblemDetail.",
        "Sai — Định dạng này là chuẩn của OAuth 2.0 error response (RFC 6749).",
        "Sai — Định dạng không tuân theo RFC 7807."
      ]
    },
    {
      "level": "hard",
      "scenario": "Để kích hoạt tự động sinh ProblemDetail cho toàn bộ các ngoại lệ mặc định của Spring MVC (MethodArgumentNotValidException, HttpMediaTypeNotSupportedException...).",
      "q": "Lập trình viên cần kế thừa class nào trong @RestControllerAdvice?",
      "options": [
        "ResponseEntityExceptionHandler",
        "DefaultHandlerExceptionResolver",
        "ExceptionHandlerExceptionResolver",
        "ControllerAdviceBean"
      ],
      "answer": 0,
      "explain": "Kế thừa 'ResponseEntityExceptionHandler' và bật 'spring.mvc.problemdetails.enabled=true' giúp Spring Boot 3 tự động chuyển đổi mọi standard web exception thành chuẩn ProblemDetail.",
      "why": [
        "✓ Đúng — ResponseEntityExceptionHandler là base class tiện ích cung cấp các method override sẵn cho mọi ngoại lệ của Spring MVC.",
        "Sai — DefaultHandlerExceptionResolver xử lý ở tầng thấp hơn, không trực tiếp hỗ trợ trả về ProblemDetail trong @RestControllerAdvice.",
        "Sai — ExceptionHandlerExceptionResolver là internal processor của Spring Framework.",
        "Sai — ControllerAdviceBean chỉ là metadata wrapper của Spring."
      ]
    },
    {
      "level": "medium",
      "scenario": "Một API nhận request body JSON và bạn muốn validate các trường bên trong một DTO lồng nhau (Nested Object): UserDTO chứa AddressDTO.",
      "q": "Annotation nào bắt buộc phải đặt trên trường AddressDTO trong UserDTO để Spring kích hoạt validation đệ quy?",
      "options": [
        "@NotNull",
        "@Valid",
        "@Validated",
        "@NestedValidation"
      ],
      "answer": 1,
      "explain": "Để validator kiểm tra các ràng buộc bên trong đối tượng con (nested object), trường đó phải được đánh dấu bằng '@Valid'. Nếu thiếu, đối tượng con sẽ bị bỏ qua kiểm tra.",
      "why": [
        "Sai — @NotNull chỉ kiểm tra address khác null, không kích hoạt validation bên trong AddressDTO.",
        "✓ Đúng — @Valid là trigger bắt buộc để Java Bean Validation (Hibernate Validator) kiểm tra cascade vào nested object.",
        "Sai — @Validated là annotation của Spring dùng trên class hoặc method để kích hoạt validation ở tầng service, không dùng cho nested field.",
        "Sai — Không có annotation @NestedValidation trong JSR-380."
      ]
    },
    {
      "level": "medium",
      "scenario": "Một API phân trang yêu cầu trả về danh sách sản phẩm. Nếu bạn chỉ cần cung cấp tính năng cuộn vô tận (Infinite Scroll) trên Mobile mà không cần hiển thị tổng số trang.",
      "q": "Kiểu trả về nào của Spring Data JPA tối ưu hiệu năng cơ sở dữ liệu hơn?",
      "options": [
        "Page<Product> (org.springframework.data.domain.Page)",
        "Slice<Product> (org.springframework.data.domain.Slice)",
        "List<Product> lấy toàn bộ",
        "Iterator<Product>"
      ],
      "answer": 1,
      "explain": "'Page' luôn thực hiện thêm 1 câu truy vấn 'SELECT COUNT(*)' tốn kém để tính tổng số trang. 'Slice' chỉ truy vấn 'LIMIT size + 1' để biết có trang tiếp theo hay không, giúp tiết kiệm triệt để tài nguyên.",
      "why": [
        "Sai — Page bắt buộc chạy câu lệnh COUNT(*) đắt đỏ trên bảng hàng triệu dòng.",
        "✓ Đúng — Slice không bao giờ chạy COUNT(*), cực kỳ lý tưởng cho Infinite Scroll hoặc nút 'Tải thêm'.",
        "Sai — List không có metadata phân trang, nếu dữ liệu lớn sẽ gây tràn RAM (OOM).",
        "Sai — Iterator không phải kiểu trả về tiện ích của Spring Data repository."
      ]
    },
    {
      "level": "easy",
      "scenario": "Một client gọi API 'DELETE /api/v1/orders/123'. Máy chủ xóa đơn hàng thành công và không cần trả về bất kỳ dữ liệu nội dung nào trong body.",
      "q": "Mã trạng thái HTTP chuẩn xác nhất cần phản hồi là gì?",
      "options": [
        "200 OK kèm body rỗng",
        "204 No Content",
        "201 Created",
        "202 Accepted"
      ],
      "answer": 1,
      "explain": "204 No Content biểu thị yêu cầu đã được thực thi thành công và response không chứa bất kỳ entity-body nào.",
      "why": [
        "Sai — 200 OK thường kỳ vọng có body trả về; nếu không có body thì 204 là chuẩn ngữ nghĩa hơn.",
        "✓ Đúng — 204 No Content là HTTP status code chuẩn quốc tế cho các thao tác thành công không cần payload trả về.",
        "Sai — 201 Created chỉ dùng khi một tài nguyên mới được tạo ra (thường là POST).",
        "Sai — 202 Accepted biểu thị request đã được tiếp nhận để xử lý bất đồng bộ (chưa xong ngay)."
      ]
    },
    {
      "level": "hard",
      "scenario": "API trả về thông tin nhạy cảm của người dùng. Bạn muốn client khi gửi header 'Accept: application/json' thì nhận JSON, khi gửi 'Accept: application/xml' thì nhận XML.",
      "q": "Khái niệm này trong kiến trúc web RESTful gọi là gì và Spring MVC hiện thực nó thông qua cơ chế nào?",
      "options": [
        "Content Negotiation (Thương lượng nội dung) thông qua HttpMessageConverter",
        "Data Serialization thông qua Java Reflection",
        "Polymorphic Serialization",
        "Protocol Buffers"
      ],
      "answer": 0,
      "explain": "Content Negotiation cho phép client và server thương lượng định dạng dữ liệu (JSON, XML) qua headers 'Accept' và 'Content-Type'. Spring MVC dùng danh sách HttpMessageConverter tương ứng để serialize.",
      "why": [
        "✓ Đúng — Content Negotiation là tính năng cốt lõi của HTTP và REST. Spring dùng MappingJackson2HttpMessageConverter (cho JSON) và MappingJackson2XmlHttpMessageConverter (cho XML).",
        "Sai — Java Reflection là công nghệ bên dưới, không phải tên khái niệm kiến trúc web.",
        "Sai — Polymorphic Serialization là kỹ thuật của Jackson cho kế thừa class OOP.",
        "Sai — Protocol Buffers là định dạng binary của gRPC, không liên quan đến JSON/XML negotiation."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong @RestController, bạn muốn nhận một chuỗi tham số truy vấn từ URL: 'GET /api/v1/products?category=laptop&sort=desc'.",
      "q": "Annotation nào cần được sử dụng trên tham số method của controller?",
      "options": [
        "@PathVariable(\"category\")",
        "@RequestParam(name = \"category\", required = false) String category",
        "@RequestBody String category",
        "@RequestHeader(\"category\")"
      ],
      "answer": 1,
      "explain": "@RequestParam dùng để trích xuất query parameters (sau dấu ?) hoặc form data trong HTTP request.",
      "why": [
        "Sai — @PathVariable dùng để lấy tham số nằm trong đường dẫn URL (ví dụ: /products/{id}).",
        "✓ Đúng — @RequestParam là annotation chuẩn để lấy query params từ URL query string.",
        "Sai — @RequestBody dùng để deserialize payload trong thân HTTP request (JSON/XML body).",
        "Sai — @RequestHeader lấy giá trị từ HTTP Header."
      ]
    },
    {
      "level": "medium",
      "scenario": "Khi chuyển đổi dữ liệu giữa Entity (JPA) và DTO (Data Transfer Object), công cụ nào sau đây sinh mã chuyển đổi tại thời điểm biên dịch (Compile-time code generation) đem lại hiệu năng cao nhất?",
      "q": "Thư viện Object Mapping tối ưu nhất cho Spring Boot:",
      "options": [
        "ModelMapper (dùng reflection runtime)",
        "MapStruct (dùng annotation processor sinh code Java thuần)",
        "BeanUtils.copyProperties() của Spring",
        "Dozer"
      ],
      "answer": 1,
      "explain": "MapStruct là một Annotation Processor sinh mã nguồn Java getter/setter thuần túy tại thời điểm compile, không dùng Reflection nên tốc độ tương đương code viết tay và an toàn type-safe.",
      "why": [
        "Sai — ModelMapper sử dụng Reflection và Type Inspection runtime rất chậm và dễ lỗi runtime.",
        "✓ Đúng — MapStruct là tiêu chuẩn công nghiệp hiện đại trong Spring Boot: zero-overhead runtime, type-safe, phát hiện thiếu field ngay khi compile.",
        "Sai — BeanUtils.copyProperties() dùng reflection ngầm, dễ gây bug khi tên trường giống nhau nhưng khác kiểu hoặc null.",
        "Sai — Dozer đã lỗi thời và hiệu năng rất thấp."
      ]
    },
    {
      "level": "hard",
      "scenario": "Một lập trình viên tạo API cập nhật dữ liệu với method: 'public ResponseEntity<?> update(@RequestBody UserDTO dto)'. Nếu người dùng gửi JSON sai định dạng cú pháp (ví dụ thiếu dấu ngoặc kép hoặc thừa dấu phẩy).",
      "q": "Ngoại lệ nào của Spring Boot sẽ được ném ra trước khi vào method của Controller?",
      "options": [
        "MethodArgumentNotValidException",
        "HttpMessageNotReadableException",
        "NullPointerException",
        "IllegalArgumentException"
      ],
      "answer": 1,
      "explain": "Khi Jackson Parser không thể đọc hoặc parse cú pháp JSON từ HttpInputMessage, Spring MVC sẽ ném ra HttpMessageNotReadableException (tương ứng HTTP status 400 Bad Request).",
      "why": [
        "Sai — MethodArgumentNotValidException chỉ ném ra khi JSON parse thành công nhưng vi phạm các annotation validation (@NotNull, @Size).",
        "✓ Đúng — Jackson thất bại khi parse JSON thô sẽ kích hoạt HttpMessageNotReadableException.",
        "Sai — Không có NPE vì luồng xử lý bị chặn ngay tại DispatcherServlet/HttpMessageConverter.",
        "Sai — Đây là lỗi tầng Web framework chuyên biệt."
      ]
    },
    {
      "level": "medium",
      "scenario": "Một client cố tình tạo một tài nguyên đã tồn tại duy nhất trong cơ sở dữ liệu (ví dụ: đăng ký tài khoản với email đã tồn tại).",
      "q": "Mã trạng thái HTTP nào thể hiện chính xác nhất sự xung đột trạng thái dữ liệu này?",
      "options": [
        "400 Bad Request",
        "409 Conflict",
        "422 Unprocessable Entity",
        "500 Internal Server Error"
      ],
      "answer": 1,
      "explain": "409 Conflict biểu thị rằng request không thể hoàn thành do xung đột với trạng thái hiện tại của tài nguyên đích (rất phổ biến cho Unique Constraint violation).",
      "why": [
        "Sai — 400 Bad Request quá chung chung, thường dùng cho lỗi cú pháp request.",
        "✓ Đúng — 409 Conflict là HTTP code chuẩn chỉ rõ sự xung đột tài nguyên (Duplicate key, Version mismatch).",
        "Sai — 422 dùng khi cú pháp đúng nhưng ngữ nghĩa dữ liệu không hợp lệ (Validation failure).",
        "Sai — 500 là lỗi máy chủ (bug backend), không được trả về cho lỗi do client gây ra."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong Spring Boot 3, để kích hoạt tính năng CORS (Cross-Origin Resource Sharing) cho toàn bộ các Controller trong hệ thống.",
      "q": "Cách cấu hình chuẩn xác và tập trung nhất là gì?",
      "options": [
        "Đặt @CrossOrigin trên từng method của mọi controller",
        "Implement WebMvcConfigurer và override method addCorsMappings(CorsRegistry registry)",
        "Tắt tường lửa của máy chủ",
        "Thêm thẻ meta HTML vào response"
      ],
      "answer": 1,
      "explain": "Implement 'WebMvcConfigurer.addCorsMappings' cho phép cấu hình tập trung các quy tắc CORS (allowedOrigins, allowedMethods, allowedHeaders, allowCredentials) cho toàn bộ endpoint.",
      "why": [
        "Sai — Đặt @CrossOrigin phân tán trên từng controller dễ trùng lặp và cực kỳ khó bảo trì.",
        "✓ Đúng — WebMvcConfigurer.addCorsMappings là giải pháp tập trung, sạch sẽ và an toàn nhất cho cấu hình CORS.",
        "Sai — Tường lửa mạng (Network Firewall) không liên quan đến chính sách Same-Origin Policy của trình duyệt web.",
        "Sai — Trình duyệt kiểm tra CORS qua HTTP Headers (Access-Control-Allow-Origin), không đọc meta tag trong API JSON."
      ]
    },
    {
      "level": "hard",
      "scenario": "Trình duyệt gửi một HTTP OPTIONS request trước khi thực hiện request POST có kèm Header 'Authorization: Bearer ...'.",
      "q": "HTTP OPTIONS request này được gọi là gì và mục đích của nó là gì?",
      "options": [
        "Heartbeat Ping để kiểm tra máy chủ còn sống hay không",
        "CORS Preflight Request để kiểm tra xem server có cho phép method, headers và origin đó hay không trước khi gửi request thật",
        "Request để lấy CSRF token",
        "Request để đo độ trễ mạng"
      ],
      "answer": 1,
      "explain": "CORS Preflight (OPTIONS) là cơ chế bảo mật của trình duyệt đối với các request phức tạp (có custom headers như Authorization). Server phải phản hồi 200/204 với các headers 'Access-Control-Allow-*' thì browser mới gửi request chính.",
      "why": [
        "Sai — Đây không phải là ping hay healthcheck của load balancer.",
        "✓ Đúng — Preflight Request bảo vệ server khỏi các request trái phép từ domain lạ của trình duyệt.",
        "Sai — Preflight không liên quan đến việc cấp phát CSRF token.",
        "Sai — Đo độ trễ mạng là việc của DevTools/APM, không phải mục đích của HTTP OPTIONS."
      ]
    },
    {
      "level": "medium",
      "scenario": "Bạn muốn ghi lại thời gian thực thi (execution time) của tất cả các HTTP Request gửi đến REST API để thống kê hiệu năng.",
      "q": "Thành phần nào trong Spring MVC là phù hợp nhất để can thiệp trước và sau khi request vào Controller?",
      "options": [
        "HandlerInterceptor (với preHandle và afterCompletion)",
        "JPA EntityListener",
        "Converter<String, Object>",
        "ViewResolver"
      ],
      "answer": 0,
      "explain": "HandlerInterceptor trong Spring MVC cung cấp 3 hook: preHandle (trước khi vào controller), postHandle (sau khi controller xử lý xong), afterCompletion (sau khi view/json đã render xong), rất lý tưởng để tính thời gian và logging.",
      "why": [
        "✓ Đúng — HandlerInterceptor can thiệp vào chu trình xử lý của DispatcherServlet cho HTTP requests.",
        "Sai — JPA EntityListener chỉ can thiệp vào vòng đời của database entity (@PrePersist, @PostUpdate).",
        "Sai — Converter dùng để chuyển đổi kiểu dữ liệu của request param.",
        "Sai — ViewResolver dùng trong MVC truyền thống để tìm file HTML template."
      ]
    },
    {
      "level": "medium",
      "scenario": "Một Controller trả về 'ResponseEntity<StreamingResponseBody>'.",
      "q": "Kỹ thuật này thường được áp dụng cho kịch bản nào?",
      "options": [
        "Gửi email hàng loạt",
        "Xuất dữ liệu lớn (File Excel/CSV hàng triệu dòng) hoặc stream media trực tiếp xuống client mà không load toàn bộ vào RAM",
        "Lưu trữ dữ liệu vào database NoSQL",
        "Chạy ngầm cronjob"
      ],
      "answer": 1,
      "explain": "StreamingResponseBody cho phép ứng dụng ghi trực tiếp từng phần dữ liệu vào OutputStream của HTTP Response, giúp truyền tải file dung lượng lớn mà không sợ tràn bộ nhớ Heap.",
      "why": [
        "Sai — Gửi email dùng JavaMailSender bất đồng bộ.",
        "✓ Đúng — Rất hữu hiệu khi export báo cáo lớn: stream thẳng ra socket OutputStream thay vì tạo byte array khổng lồ trên RAM.",
        "Sai — Không liên quan đến lưu trữ NoSQL.",
        "Sai — Cronjob dùng @Scheduled."
      ]
    },
    {
      "level": "hard",
      "scenario": "Trong Spring Boot 3, khi bạn đánh dấu method là: '@GetMapping(value = \"/export\", produces = MediaType.APPLICATION_NDJSON_VALUE)'.",
      "q": "Định dạng 'application/x-ndjson' có đặc điểm gì nổi bật?",
      "options": [
        "Là file nén zip chứa các file JSON",
        "Newline Delimited JSON: mỗi dòng là một JSON object hoàn chỉnh, hỗ trợ HTTP Streaming liên tục",
        "Định dạng JSON được mã hóa Base64",
        "Là định dạng chỉ dùng cho database MongoDB"
      ],
      "answer": 1,
      "explain": "NDJSON (Newline Delimited JSON) phân tách các JSON object bằng ký tự xuống dòng '\\n', cho phép client đọc và parse dữ liệu theo luồng (streaming) ngay khi từng record xuất hiện mà không cần đợi đóng ngoặc mảng ']'.",
      "why": [
        "Sai — Không phải định dạng nén zip.",
        "✓ Đúng — NDJSON là tiêu chuẩn vàng cho streaming dữ liệu JSON từng phần trong reactive và realtime APIs.",
        "Sai — Dữ liệu là văn bản thuần (plain text UTF-8), không phải Base64.",
        "Sai — MongoDB có hỗ trợ import nhưng đây là chuẩn web format chung."
      ]
    },
    {
      "level": "medium",
      "scenario": "Bạn muốn truyền một tham số ma trận (Matrix Variable) trong URL của Spring MVC: '/cars;color=red;year=2024'.",
      "q": "Để Spring MVC nhận diện được @MatrixVariable, cấu hình nào cần phải bật?",
      "options": [
        "UrlPathHelper.setRemoveSemicolonContent(false)",
        "spring.mvc.matrix.enabled=true",
        "server.servlet.context-path=/matrix",
        "Không cần cấu hình gì, mặc định đã bật"
      ],
      "answer": 0,
      "explain": "Mặc định Spring MVC loại bỏ phần nội dung sau dấu chấm phẩy ';' trong URL vì lý do bảo mật. Muốn dùng @MatrixVariable phải cấu hình setRemoveSemicolonContent(false) trong PathMatchConfigurer.",
      "why": [
        "✓ Đúng — Phải cấu hình PathMatchConfigurer với UrlPathHelper bỏ cờ removeSemicolonContent.",
        "Sai — Không có property spring.mvc.matrix.enabled trong Spring Boot.",
        "Sai — Context path chỉ là đường dẫn gốc của app.",
        "Sai — Mặc định Spring tắt tính năng này để bảo vệ ứng dụng."
      ]
    },
    {
      "level": "medium",
      "scenario": "Khi thiết kế URL cho RESTful API, quy ước nào sau đây được coi là Chuẩn Best Practice toàn cầu?",
      "q": "Chọn URI được thiết kế chuẩn mực nhất:",
      "options": [
        "POST /api/createNewUser",
        "GET /api/v1/users/getUserById?id=5",
        "DELETE /api/v1/users/5",
        "POST /api/v1/deleteUser/5"
      ],
      "answer": 2,
      "explain": "RESTful URI đại diện cho Danh từ (Noun/Resource) ở dạng số nhiều: '/users/5'. Hành động được biểu thị bằng HTTP Method (GET, POST, PUT, DELETE), không đưa động từ (verb) vào URI.",
      "why": [
        "Sai — Đưa động từ 'createNewUser' vào URL là vi phạm quy ước REST (đây là phong cách RPC).",
        "Sai — Lấy chi tiết user theo ID chuẩn là 'GET /api/v1/users/5', không dùng động từ trong path.",
        "✓ Đúng — Sử dụng danh từ số nhiều '/users/{id}' kết hợp với HTTP Method DELETE là chuẩn mực RESTful hoàn hảo.",
        "Sai — Dùng POST kết hợp động từ 'deleteUser' là sai lệch nghiêm trọng về ngữ nghĩa HTTP."
      ]
    },
    {
      "level": "hard",
      "scenario": "Một API cần xử lý upload file dung lượng lớn (1GB) từ client. Cấu hình nào trong application.properties giúp tránh lỗi 'MaxUploadSizeExceededException'?",
      "q": "Bộ đôi cấu hình Multipart chuẩn của Spring Boot là:",
      "options": [
        "spring.servlet.multipart.max-file-size=1GB và spring.servlet.multipart.max-request-size=1GB",
        "server.tomcat.max-http-post-size=1GB",
        "spring.http.multipart.enabled=true",
        "server.max-buffer-size=1GB"
      ],
      "answer": 0,
      "explain": "Spring Boot quản lý giới hạn file upload qua 2 thuộc tính: 'max-file-size' (giới hạn 1 file đơn lẻ) và 'max-request-size' (tổng dung lượng cả request chứa nhiều file).",
      "why": [
        "✓ Đúng — Bộ đôi chuẩn của Spring Boot 3: spring.servlet.multipart.max-file-size và max-request-size.",
        "Sai — Cấu hình Tomcat chỉ áp dụng cho POST form payload thông thường, không kiểm soát multipart parser.",
        "Sai — Thuộc tính cũ hoặc không quy định dung lượng cụ thể.",
        "Sai — Thuộc tính không tồn tại trong Spring Boot."
      ]
    },
    {
      "level": "medium",
      "scenario": "Khi trả về một danh sách rỗng (không tìm thấy phần tử nào thỏa mãn điều kiện tìm kiếm, ví dụ tìm sách theo tên tác giả).",
      "q": "Phản hồi RESTful nào sau đây được xem là chuẩn mực và thân thiện với client nhất?",
      "options": [
        "HTTP 404 Not Found",
        "HTTP 200 OK kèm mảng JSON rỗng: '[]'",
        "HTTP 500 Internal Server Error",
        "HTTP 204 No Content"
      ],
      "answer": 1,
      "explain": "Khi tìm kiếm danh sách (Collection resource), việc không tìm thấy kết quả là một trạng thái bình thường: trả về 200 OK với mảng rỗng '[]'. 404 chỉ dùng khi một tài nguyên cụ thể theo định danh (/books/999) không tồn tại.",
      "why": [
        "Sai — Trả về 404 cho collection query khiến client lầm tưởng endpoint URL bị sai đường dẫn.",
        "✓ Đúng — 200 OK với mảng rỗng '[]' giúp frontend parse dữ liệu mượt mà mà không phải bắt try-catch lỗi 404.",
        "Sai — 500 là lỗi máy chủ crash, hoàn toàn sai.",
        "Sai — 204 không có body, client khó phân biệt với việc xóa thành công."
      ]
    }
  ],
  "3": [
    {
      "level": "hard",
      "scenario": "Một truy vấn JPA lấy 100 User, mỗi User có danh sách Roles (quan hệ @OneToMany với FetchType.LAZY). Khi duyệt qua từng User để in ra Role, Hibernate sinh ra 101 câu lệnh SELECT.",
      "q": "Hiện tượng này được gọi là gì và 2 giải pháp tối ưu nhất trong Spring Data JPA là gì?",
      "options": [
        "Lỗi LazyInitializationException; giải pháp là đổi thành FetchType.EAGER cho toàn bộ Entity",
        "Vấn đề N+1 Query; giải pháp là dùng 'JOIN FETCH' trong JPQL hoặc sử dụng '@EntityGraph'",
        "Vấn đề Dirty Checking; giải pháp là dùng @Transactional(readOnly = true)",
        "Deadlock cơ sở dữ liệu; giải pháp là tăng connection pool"
      ],
      "answer": 1,
      "explain": "Vấn đề N+1: 1 câu query lấy danh sách cha, sau đó N câu query lấy danh sách con. Đổi FetchType.EAGER không giải quyết được N+1 mà còn tệ hơn. Giải pháp đúng là JOIN FETCH hoặc @EntityGraph.",
      "why": [
        "Sai — FetchType.EAGER với truy vấn JPQL 'SELECT u FROM User u' VẪN BỊ N+1 query!",
        "✓ Đúng — JOIN FETCH hoặc @EntityGraph ép Hibernate JOIN các bảng liên quan chỉ trong 1 câu SQL duy nhất.",
        "Sai — Dirty checking là cơ chế phát hiện thay đổi của Persistence Context, không liên quan đến N+1.",
        "Sai — Đây là bài toán tối ưu truy vấn ORM, không phải deadlock."
      ]
    },
    {
      "level": "hard",
      "scenario": "Trong Entity Order có quan hệ @OneToMany với OrderItem. Bạn muốn cấu hình để khi xóa một Order thì toàn bộ OrderItem của nó trong DB cũng bị xóa, và khi remove một item khỏi List trong Java thì hàng đó cũng bị xóa khỏi DB.",
      "q": "Cấu hình annotation nào đáp ứng đầy đủ yêu cầu này?",
      "options": [
        "@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)",
        "@OneToMany(cascade = CascadeType.REMOVE)",
        "@OneToMany(fetch = FetchType.EAGER)",
        "@OneToMany(cascade = CascadeType.PERSIST)"
      ],
      "answer": 0,
      "explain": "'orphanRemoval = true' đảm bảo khi một item bị gỡ khỏi collection (list.remove(item)), Hibernate sẽ tự động sinh lệnh DELETE trong DB. CascadeType.ALL lan truyền mọi thao tác persist/merge/remove.",
      "why": [
        "✓ Đúng — Bộ đôi kinh điển CascadeType.ALL + orphanRemoval = true quản lý vòng đời chặt chẽ của Aggregate Root trong DDD.",
        "Sai — CascadeType.REMOVE chỉ xóa con khi XÓA CHA (delete order), nhưng KHÔNG xóa con khi chỉ gỡ con khỏi list.",
        "Sai — FetchType.EAGER chỉ liên quan đến thời điểm load dữ liệu, không quản lý cascade delete.",
        "Sai — PERSIST chỉ áp dụng cho thao tác lưu mới."
      ]
    },
    {
      "level": "medium",
      "scenario": "Một method trong Service có đánh dấu @Transactional. Bên trong method gọi 'userRepository.findById(1L)', sau đó gọi 'user.setEmail(\"new@email.com\")' mà KHÔNG hề gọi 'userRepository.save(user)'.",
      "q": "Khi kết thúc method, email mới có được lưu xuống cơ sở dữ liệu hay không và vì sao?",
      "options": [
        "Không lưu — vì không gọi hàm save() rõ ràng",
        "Có lưu — nhờ cơ chế Dirty Checking (Tự động phát hiện thay đổi) của Hibernate trong Persistence Context khi transaction commit",
        "Ném ra TransactionRequiredException",
        "Chỉ lưu nếu class có gắn @DynamicUpdate"
      ],
      "answer": 1,
      "explain": "Trong một Transaction, các Entity được quản lý (Managed State) bởi Persistence Context. Khi commit, Hibernate tự động so sánh snapshot trạng thái ban đầu và hiện tại (Dirty Checking) để sinh lệnh UPDATE tự động.",
      "why": [
        "Sai — Nhận thức sai lầm rất phổ biến: trong JPA không cần gọi save() cho entity đã ở trạng thái Managed!",
        "✓ Đúng — Cơ chế Dirty Checking là tính năng cốt lõi của JPA/Hibernate giúp đồng bộ trạng thái in-memory xuống DB.",
        "Sai — Transaction đã có sẵn từ @Transactional.",
        "Sai — @DynamicUpdate chỉ giúp câu lệnh UPDATE chỉ chứa các cột thay đổi, không quyết định việc có update hay không."
      ]
    },
    {
      "level": "hard",
      "scenario": "ServiceA có method có @Transactional. Method này gọi sang method khác của ServiceB được đánh dấu: '@Transactional(propagation = Propagation.REQUIRES_NEW)'.",
      "q": "Hành vi của Transaction khi gọi sang ServiceB là gì?",
      "options": [
        "ServiceB tham gia vào cùng Transaction hiện tại của ServiceA",
        "Transaction của ServiceA bị tạm dừng (suspend); một Transaction mới hoàn toàn độc lập được mở cho ServiceB; khi ServiceB xong thì Transaction của ServiceA tiếp tục",
        "Ném ra lỗi IllegalTransactionStateException",
        "Cả hai transaction tự động gộp thành một distributed transaction (XA)"
      ],
      "answer": 1,
      "explain": "Propagation.REQUIRES_NEW luôn tạo một physical transaction mới. Transaction cũ của caller sẽ bị suspend. Nếu ServiceB rollback, nó không tự động làm ServiceA rollback trừ khi exception bị rethrow lên ServiceA.",
      "why": [
        "Sai — Đó là hành vi của Propagation.REQUIRED (mặc định).",
        "✓ Đúng — REQUIRES_NEW tách biệt hoàn toàn 2 transaction vật lý, thường dùng cho audit log hoặc counter độc lập.",
        "Sai — Đây là kịch bản hợp lệ hoàn toàn trong Spring Transaction.",
        "Sai — Hai transaction chạy tuần tự trên cùng database connection pool, không phải 2-Phase Commit XA."
      ]
    },
    {
      "level": "medium",
      "scenario": "Một method có @Transactional gặp một ngoại lệ dạng Checked Exception (ví dụ: IOException hoặc Exception tự định nghĩa kế thừa Exception).",
      "q": "Hành vi mặc định của Spring đối với Transaction Rollback là gì?",
      "options": [
        "Tự động Rollback cho mọi loại Exception",
        "Mặc định CHỈ Rollback đối với Unchecked Exception (RuntimeException và Error); KHÔNG rollback đối với Checked Exception trừ khi cấu hình rollbackFor",
        "Không bao giờ rollback trừ khi gọi TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()",
        "Ném ra TransactionSystemException"
      ],
      "answer": 1,
      "explain": "Quy tắc mặc định của Spring Transaction: chỉ tự động rollback với RuntimeException và Error. Với Checked Exception, Spring vẫn commit bình thường! Phải chỉ định rõ '@Transactional(rollbackFor = Exception.class)'.",
      "why": [
        "Sai — Bẫy nguy hiểm bậc nhất trong Spring: Checked Exception mặc định KHÔNG bị rollback!",
        "✓ Đúng — Chuẩn Spring: Unchecked rollback, Checked commit. Luôn luôn nên ghi rõ '@Transactional(rollbackFor = Exception.class)'.",
        "Sai — Spring tự động bắt exception để rollback theo quy tắc trên.",
        "Sai — Không ném system exception."
      ]
    },
    {
      "level": "hard",
      "scenario": "Hai giao dịch đồng thời cùng đọc số dư tài khoản là 1.000.000đ và cùng trừ 600.000đ. Do chạy song song, tài khoản bị trừ 2 lần nhưng số dư cuối cùng lại thành 400.000đ (mất tiền của ngân hàng).",
      "q": "Kỹ thuật Optimistic Locking (Khóa lạc quan) giải quyết bài toán này như thế nào?",
      "options": [
        "Khóa dòng bằng câu lệnh 'SELECT ... FOR UPDATE' ngay khi đọc",
        "Thêm một trường '@Version' (int hoặc timestamp) vào Entity; khi update Hibernate kiểm tra version trong DB có khớp không, nếu lệch sẽ ném OptimisticLockException",
        "Dùng từ khóa synchronized trên method Java",
        "Tăng mức cô lập transaction lên SERIALIZABLE"
      ],
      "answer": 1,
      "explain": "Optimistic Locking không khóa dữ liệu ở DB level mà dùng trường @Version: 'UPDATE account SET balance = ?, version = version + 1 WHERE id = ? AND version = ?'. Nếu rowCount = 0 nghĩa là đã bị sửa đổi trước đó, Spring ném OptimisticLockException.",
      "why": [
        "Sai — 'SELECT ... FOR UPDATE' là Pessimistic Locking (Khóa bi quan).",
        "✓ Đúng — @Version là cơ chế Optimistic Locking chuẩn của JPA, mang lại hiệu năng cao cho hệ thống có tỉ lệ tranh chấp thấp/vừa.",
        "Sai — synchronized chỉ có tác dụng trên 1 JVM đơn lẻ, vô dụng trong môi trường nhiều instance/pod.",
        "Sai — SERIALIZABLE làm giảm thông lượng hệ thống nghiêm trọng và dễ gây Deadlock."
      ]
    },
    {
      "level": "hard",
      "scenario": "Khi nào lập trình viên NÊN lựa chọn Pessimistic Locking (LockModeType.PESSIMISTIC_WRITE) thay vì Optimistic Locking?",
      "q": "Kịch bản phù hợp nhất cho Khóa bi quan là gì?",
      "options": [
        "Ứng dụng đọc nhiều ghi ít (Read-heavy)",
        "Hệ thống bán vé flash-sale, số lượng tồn kho cực ít nhưng hàng triệu người cùng tranh chấp mua tại một giây (High Concurrency & High Contention)",
        "Hệ thống chỉ chạy trên môi trường Development",
        "Khi không có quyền tạo bảng trong cơ sở dữ liệu"
      ],
      "answer": 1,
      "explain": "Khi mức độ tranh chấp cực cao (Flash-sale, giữ ghế rạp phim), Optimistic Locking sẽ khiến hàng ngàn giao dịch bị fail và rollback liên tục, gây lãng phí CPU. Pessimistic Write Lock xếp hàng xử lý trực tiếp tại DB.",
      "why": [
        "Sai — Read-heavy dùng Optimistic lock hoặc không cần lock sẽ cho hiệu năng tối ưu nhất.",
        "✓ Đúng — Tranh chấp cao điểm (High Contention) là đất diễn hoàn hảo của Pessimistic Locking ('SELECT ... FOR UPDATE').",
        "Sai — Lock mode là giải pháp kiến trúc production, không phải cho dev environment.",
        "Sai — Pessimistic lock không yêu cầu thêm cột version nhưng không phải lý do lựa chọn."
      ]
    },
    {
      "level": "medium",
      "scenario": "Sau khi session Hibernate đóng lại (ngoài tầng Service), Jackson cố gắng serialize một Entity có trường LAZY ra JSON ở Controller thì bị lỗi: 'LazyInitializationException: could not initialize proxy - no Session'.",
      "q": "Giải pháp kiến trúc chuẩn mực và an toàn nhất để loại bỏ triệt để lỗi này là gì?",
      "options": [
        "Bật cấu hình 'spring.jpa.open-in-view=true' (OSIV)",
        "Chuyển toàn bộ quan hệ LAZY sang EAGER trong entity",
        "Không bao giờ trả Entity trực tiếp ra Controller; luôn map Entity sang DTO tại tầng Service trước khi trả về",
        "Gắn @JsonIgnore trên tất cả các trường của Entity"
      ],
      "answer": 2,
      "explain": "Anti-pattern trả trực tiếp Entity ra Web Controller gây rò rỉ database structure và lỗi LazyInitializationException. Map sang DTO tại tầng Service đảm bảo mọi dữ liệu cần thiết được load trọn vẹn trong Transaction.",
      "why": [
        "Sai — Open-in-View (OSIV) giữ connection DB mở suốt vòng đời HTTP request, là nguyên nhân hàng đầu gây cạn kiệt Connection Pool trong production.",
        "Sai — EAGER gây thảm họa hiệu năng N+1 và tải toàn bộ database vào RAM.",
        "✓ Đúng — DTO Pattern là quy tắc bất di bất dịch của kiến trúc Enterprise Clean Architecture.",
        "Sai — @JsonIgnore chỉ che giấu field, không giải quyết được nhu cầu thực tế cần hiển thị dữ liệu đó."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong Spring Data JPA, bạn muốn truy vấn chỉ lấy 3 trường 'id', 'name', 'email' từ bảng User có 50 cột để tối ưu băng thông và RAM.",
      "q": "Tính năng nào của Spring Data JPA hỗ trợ việc này mà không cần viết câu lệnh native phức tạp?",
      "options": [
        "Spring Data Projections (Interface-based hoặc Class-based DTO Projections)",
        "Hibernate Second-Level Cache",
        "Flyway Migration",
        "EntityManager.clear()"
      ],
      "answer": 0,
      "explain": "Spring Data Projections cho phép khai báo một Java Interface có các hàm getter (ví dụ: 'interface UserSummary { Long getId(); String getName(); }') hoặc DTO record. Spring Data sẽ tự động sinh câu SELECT chỉ lấy đúng các cột đó.",
      "why": [
        "✓ Đúng — Projections là giải pháp thanh lịch, gọn gàng và hiệu năng cao nhất của Spring Data JPA để lấy partial fields.",
        "Sai — Second-level cache dùng để lưu cache chia sẻ, không phục vụ mục đích chiếu cột (projection).",
        "Sai — Flyway là công cụ quản lý version database schema.",
        "Sai — clear() xóa sạch cache L1 của EntityManager."
      ]
    },
    {
      "level": "medium",
      "scenario": "Để viết một câu truy vấn có logic điều kiện phức tạp (Search Filter động gồm nhiều tiêu chí: giá từ... đến, danh mục, từ khóa, trạng thái...).",
      "q": "Công cụ nào của JPA/Spring Data được thiết kế chuyên dụng cho việc xây dựng truy vấn động Type-Safe?",
      "options": [
        "Cộng chuỗi SQL thủ công bằng StringBuilder",
        "JPA Criteria API hoặc thư viện QueryDSL (JPAQueryFactory)",
        "Viết 20 method khác nhau trong JpaRepository",
        "Dùng Stored Procedure cho mọi trường hợp"
      ],
      "answer": 1,
      "explain": "JPA Criteria API hoặc QueryDSL cho phép lập trình viên tạo câu query dạng hướng đối tượng (Type-safe), an toàn trước SQL Injection và tự động sinh code dựa trên APT (Annotation Processing Tool).",
      "why": [
        "Sai — Cộng chuỗi SQL cực kỳ nguy hiểm, dễ dính SQL Injection và khó bảo trì.",
        "✓ Đúng — QueryDSL hoặc Spring Data JPA Specification (Criteria API) là chuẩn mực xây dựng dynamic filter type-safe.",
        "Sai — Vi phạm nguyên tắc DRY và làm repository bùng nổ hàng tá method thừa thãi.",
        "Sai — Stored procedure gắn chặt vào vendor DB, khó unit test và mất khả năng kiểm soát version code."
      ]
    },
    {
      "level": "hard",
      "scenario": "Trong @Transactional, thuộc tính 'readOnly = true' mang lại những lợi ích tối ưu hóa nào cho Hibernate và Cơ sở dữ liệu?",
      "q": "Chọn phát biểu đầy đủ và chính xác nhất:",
      "options": [
        "Chỉ ngăn chặn người dùng gọi hàm DELETE",
        "Hibernate tắt cơ chế Dirty Checking (không lưu snapshot, không kiểm tra thay đổi), giúp tiết kiệm RAM và CPU; đồng thời JDBC driver có thể route câu query sang Read-Replica của DB",
        "Tự động khóa toàn bộ bảng không cho ai ghi",
        "Chỉ có tác dụng ghi log tài liệu cho developer đọc"
      ],
      "answer": 1,
      "explain": "'@Transactional(readOnly = true)' là optimization hint quan trọng: Hibernate bỏ qua dirty checking snapshot giúp giảm 50% memory cho persistence context, và hỗ trợ routing datasource phân tải sang Slave/Read-Replica DB.",
      "why": [
        "Sai — Nó áp dụng cho toàn bộ thao tác thay đổi dữ liệu (INSERT, UPDATE, DELETE).",
        "✓ Đúng — Tối ưu hóa bộ nhớ RAM vượt trội do bỏ dirty checking snapshot và mở đường cho read/write replica routing.",
        "Sai — Không khóa bảng DB.",
        "Sai — Có tác động kỹ thuật trực tiếp đến runtime của Hibernate và JDBC Connection."
      ]
    },
    {
      "level": "medium",
      "scenario": "Một method trong repository: '@Modifying @Query(\"UPDATE User u SET u.status = :status WHERE u.age > :age\") int updateStatus(...)'.",
      "q": "Tại sao bắt buộc phải có annotation @Modifying kèm theo @Query cho các câu lệnh UPDATE/DELETE?",
      "options": [
        "Để Spring Data JPA biết đây là thao tác DML và thực thi qua executeUpdate() thay vì executeQuery()",
        "Để tự động mã hóa dữ liệu",
        "Để mở rộng connection pool",
        "Để bỏ qua khóa ngoại"
      ],
      "answer": 0,
      "explain": "Mặc định @Query chỉ thực thi executeQuery() mong đợi trả về ResultSet. @Modifying báo hiệu cho Spring Data JPA gọi executeUpdate() và trả về số dòng bị ảnh hưởng (int).",
      "why": [
        "✓ Đúng — Thiếu @Modifying khi chạy UPDATE/DELETE sẽ ném ra InvalidDataAccessApiUsageException ngay lập tức.",
        "Sai — Không liên quan đến mã hóa dữ liệu.",
        "Sai — Không can thiệp vào connection pool.",
        "Sai — Khóa ngoại do RDBMS quản lý toàn vẹn."
      ]
    },
    {
      "level": "hard",
      "scenario": "Sau khi thực hiện câu lệnh bulk update bằng @Modifying, các entity User đã nạp từ trước trong Persistence Context vẫn giữ giá trị cũ mà không phản ánh giá trị mới dưới DB.",
      "q": "Thuộc tính nào của @Modifying giúp tự động xóa sạch First-Level Cache sau khi thực thi câu lệnh?",
      "options": [
        "@Modifying(clearAutomatically = true)",
        "@Modifying(flushAutomatically = true)",
        "@Modifying(purge = true)",
        "@Modifying(evictAll = true)"
      ],
      "answer": 0,
      "explain": "Câu lệnh JPQL Bulk Update đi thẳng xuống DB và bỏ qua First-Level Cache (Persistence Context). Đặt 'clearAutomatically = true' sẽ gọi EntityManager.clear() để các lần đọc sau nạp dữ liệu mới nhất từ DB.",
      "why": [
        "✓ Đúng — 'clearAutomatically = true' ngăn chặn hiện tượng dữ liệu không nhất quán giữa Hibernate Cache và DB sau bulk update.",
        "Sai — flushAutomatically = true thực hiện flush các thay đổi trước đó xuống DB trước khi query, không xóa cache sau khi chạy.",
        "Sai — Thuộc tính 'purge' không tồn tại.",
        "Sai — Thuộc tính 'evictAll' không tồn tại trong @Modifying."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong cơ sở dữ liệu quan hệ, bạn muốn một Entity có mối quan hệ N-N (ManyToMany) giữa Student và Course. JPA tạo ra bảng trung gian 'student_course'.",
      "q": "Nếu bảng trung gian cần lưu thêm các thuộc tính bổ sung như 'enrollment_date' và 'grade', cách thiết kế đúng chuẩn JPA là gì?",
      "options": [
        "Vẫn dùng @ManyToMany và thêm field vào annotation",
        "Tách bảng trung gian thành một Entity độc lập 'Enrollment' có quan hệ @ManyToOne với Student và @ManyToOne với Course",
        "Tạo một JSON column trong bảng Student",
        "Dùng @OneToMany lồng nhau không có Entity"
      ],
      "answer": 1,
      "explain": "Khi bảng nối (join table) mang thêm thông tin thuộc tính (payload), nó không còn là pure join table nữa mà trở thành một Domain Entity thực thụ. Phải tạo entity trung gian với 2 quan hệ @ManyToOne.",
      "why": [
        "Sai — @ManyToMany trong JPA không thể ánh xạ các cột bổ sung trên bảng trung gian.",
        "✓ Đúng — Đây là chuẩn thiết kế mô hình quan hệ trong JPA: nâng cấp join table thành thực thể trung gian (Associative Entity).",
        "Sai — Dùng JSON column làm mất tính toàn vẹn dữ liệu quan hệ và khó index truy vấn.",
        "Sai — Không thể map đúng ngữ nghĩa cơ sở dữ liệu."
      ]
    },
    {
      "level": "medium",
      "scenario": "Bạn muốn tự động điền các trường kiểm toán (Audit fields) như 'createdAt', 'updatedAt', 'createdBy' cho mọi Entity trong hệ thống.",
      "q": "Bộ đôi tính năng nào của Spring Data JPA hỗ trợ cơ chế này?",
      "options": [
        "@EnableJpaAuditing trên Configuration và @EntityListeners(AuditingEntityListener.class) trên BaseEntity",
        "@Scheduled và @Async",
        "Trigger của MySQL bắt buộc",
        "Viết thủ công setter trong Controller"
      ],
      "answer": 0,
      "explain": "Spring Data JPA Auditing tự động kích hoạt thông qua @EnableJpaAuditing và AuditingEntityListener, kết hợp các annotation @CreatedDate, @LastModifiedDate, @CreatedBy.",
      "why": [
        "✓ Đúng — Giải pháp chuẩn Enterprise: tự động hóa 100% việc lưu vết ai tạo/sửa bản ghi và vào thời điểm nào.",
        "Sai — Scheduled và Async không dùng cho data auditing.",
        "Sai — Trigger DB khó tích hợp với thông tin user từ SecurityContext của ứng dụng Java.",
        "Sai — Viết setter thủ công dễ quên và trùng lặp mã nguồn khắp nơi."
      ]
    },
    {
      "level": "hard",
      "scenario": "Sự khác biệt căn bản giữa phương thức 'findById()' và 'getReferenceById()' (trước đây là getOne()) trong JpaRepository là gì?",
      "q": "Phát biểu nào sau đây là chính xác?",
      "options": [
        "findById() sinh câu lệnh SELECT ngay lập tức; getReferenceById() chỉ trả về một Lazy Proxy rỗng chứa ID mà không query DB (chỉ query khi truy cập các trường khác)",
        "getReferenceById() chạy nhanh hơn vì dùng ThreadLocal",
        "findById() ném EntityNotFoundException nếu không thấy; getReferenceById() trả về Optional.empty()",
        "Hai hàm hoàn toàn giống hệt nhau"
      ],
      "answer": 0,
      "explain": "getReferenceById() sử dụng EntityManager.getReference(), trả về một Hibernate Proxy mà không chạm vào DB. Rất hữu ích khi bạn chỉ cần gán khóa ngoại FK cho entity khác mà không cần tốn 1 câu SELECT đọc dữ liệu.",
      "why": [
        "✓ Đúng — Tiết kiệm được một câu lệnh SELECT không cần thiết khi tạo liên kết khóa ngoại (Foreign Key binding).",
        "Sai — Không liên quan đến ThreadLocal.",
        "Sai — Ngược lại: findById() trả về Optional<T>, còn getReferenceById() ném EntityNotFoundException khi serialize nếu ID không có thật trong DB.",
        "Sai — Khác biệt căn bản về cơ chế Proxy và thời điểm query DB."
      ]
    },
    {
      "level": "medium",
      "scenario": "Bạn muốn định nghĩa quy tắc đặt tên cột trong DB tự động chuyển từ camelCase trong Java sang snake_case trong SQL (ví dụ: 'userEmail' thành 'user_email').",
      "q": "Component nào của Hibernate quản lý quy ước chuyển đổi tên này?",
      "options": [
        "PhysicalNamingStrategy (mặc định là CamelCaseToUnderscoresNamingStrategy trong Spring Boot)",
        "ImplicitNamingStrategy",
        "Dialect",
        "ConnectionProvider"
      ],
      "answer": 0,
      "explain": "PhysicalNamingStrategy chịu trách nhiệm biến đổi tên logic thành tên thực tế trên DB. Spring Boot cấu hình mặc định CamelCaseToUnderscoresNamingStrategy để chuẩn hóa snake_case.",
      "why": [
        "✓ Đúng — PhysicalNamingStrategy là chuẩn quản lý mapping tên vật lý trên bảng cơ sở dữ liệu.",
        "Sai — ImplicitNamingStrategy chỉ dùng khi trường không có tên rõ ràng (ví dụ tên bảng join).",
        "Sai — Dialect quản lý cú pháp SQL đặc thù của từng hệ quản trị CSDL (Oracle, Postgres, MySQL).",
        "Sai — ConnectionProvider quản lý kết nối JDBC."
      ]
    },
    {
      "level": "medium",
      "scenario": "Để quản lý việc nâng cấp phiên bản cơ sở dữ liệu (Database Schema Migration) một cách tự động, có lịch sử rollback và version control an toàn.",
      "q": "Thư viện nào là lựa chọn hàng đầu được tích hợp sẵn trong Spring Boot?",
      "options": [
        "Flyway hoặc Liquibase",
        "Hibernate hbm2ddl.auto=create-drop",
        "File SQL chạy bằng tay qua DBeaver",
        "JDBC Template"
      ],
      "answer": 0,
      "explain": "Flyway và Liquibase là 2 công cụ Database Migration chuẩn mực. Chúng lưu bảng lịch sử 'flyway_schema_history', tự động chạy các script V1__, V2__ khi ứng dụng start.",
      "why": [
        "✓ Đúng — Tuyệt đối dùng Flyway hoặc Liquibase trên production để kiểm soát toàn vẹn cấu trúc cơ sở dữ liệu.",
        "Sai — 'hbm2ddl.auto=create-drop' sẽ xóa sạch dữ liệu khách hàng khi restart server, là thảm họa trên production.",
        "Sai — Chạy bằng tay vi phạm nguyên tắc CI/CD và dễ sai sót giữa các môi trường.",
        "Sai — JdbcTemplate là công cụ thực thi SQL, không có cơ chế quản lý migration version."
      ]
    },
    {
      "level": "hard",
      "scenario": "Khi sử dụng HikariCP (Connection Pool mặc định của Spring Boot), tham số 'maximum-pool-size' nên được tính toán dựa trên công thức khuyến nghị của HikariCP team như thế nào?",
      "q": "Công thức kinh điển để tối ưu pool size kết nối DB là gì?",
      "options": [
        "pool_size = Số lượng lập trình viên trong team * 10",
        "pool_size = (CPU cores * 2) + effective_spindle_count (số đĩa I/O)",
        "pool_size = 1000 cho mọi ứng dụng",
        "pool_size = Dung lượng RAM tính bằng GB"
      ],
      "answer": 1,
      "explain": "Nghiên cứu của PostgreSQL và HikariCP chỉ ra rằng: một pool size nhỏ (khoảng 10-20 kết nối cho máy 4-8 core) đem lại thông lượng cao nhất vì giảm thiểu context switching của CPU và disk I/O.",
      "why": [
        "Sai — Số kết nối DB phụ thuộc vào năng lực phần cứng của Database Server, không phụ thuộc số người.",
        "✓ Đúng — Công thức chuẩn của Brett Wooldridge (tác giả HikariCP): connections = (core_count * 2) + disk_count.",
        "Sai — Đặt 1000 kết nối sẽ làm sập DB Server vì nghẽn CPU và bộ nhớ context switch.",
        "Sai — Không dựa trên RAM."
      ]
    },
    {
      "level": "medium",
      "scenario": "Một truy vấn JPA cần gọi trực tiếp một câu lệnh SQL phức tạp có sử dụng tính năng đặc thù của PostgreSQL (ví dụ toán tử JSONB '@>').",
      "q": "Cách khai báo trong Spring Data JPA Repository là gì?",
      "options": [
        "@Query(value = \"SELECT * FROM orders WHERE data @> :jsonFilter\", nativeQuery = true)",
        "@NativeQuery(sql = \"...\")",
        "@PostgreSQLQuery",
        "@CustomQuery"
      ],
      "answer": 0,
      "explain": "Đặt thuộc tính 'nativeQuery = true' trong @Query cho phép viết câu SQL thuần tùy biến theo hệ quản trị cơ sở dữ liệu cụ thể, bỏ qua trình thông dịch JPQL.",
      "why": [
        "✓ Đúng — '@Query(value = \"...\", nativeQuery = true)' là cú pháp chuẩn của Spring Data JPA.",
        "Sai — Không có annotation @NativeQuery riêng biệt trong Spring Data JPA.",
        "Sai — Không có annotation theo tên database.",
        "Sai — Không có annotation @CustomQuery."
      ]
    }
  ],
  "4": [
    {
      "level": "medium",
      "scenario": "Bạn muốn viết Unit Test cho một Service độc lập (OrderService) sử dụng Mockito để cô lập hoàn toàn với tầng Database.",
      "q": "Cặp annotation nào của Mockito được dùng để mock Repository và inject mock đó vào Service?",
      "options": [
        "@Mock trên OrderRepository và @InjectMocks trên OrderService",
        "@MockBean trên OrderRepository và @Autowired trên OrderService",
        "@Spy trên OrderRepository và @Resource trên OrderService",
        "@Fake trên OrderRepository và @Service trên OrderService"
      ],
      "answer": 0,
      "explain": "Trong pure Mockito Unit Test (không khởi động Spring Context), dùng '@Mock' để tạo mock object và '@InjectMocks' để Mockito tự động inject mock vào constructor của target class.",
      "why": [
        "✓ Đúng — @Mock + @InjectMocks kết hợp @ExtendWith(MockitoExtension.class) giúp test chạy siêu nhanh chỉ trong vài millisecond.",
        "Sai — @MockBean là annotation của Spring Test, dùng khi chạy Integration Test cần nạp Spring ApplicationContext.",
        "Sai — @Spy tạo wrapper theo dõi object thật, không phải pure mock.",
        "Sai — Không có annotation @Fake trong Mockito."
      ]
    },
    {
      "level": "hard",
      "scenario": "Trong Spring Boot 3.4, annotation '@MockBean' quen thuộc đã bị deprecated để chuẩn hóa tích hợp với framework Mockito.",
      "q": "Annotation mới nào được khuyến nghị thay thế cho '@MockBean' trong Spring Framework 6.2+ / Spring Boot 3.4+?",
      "options": [
        "@MockitoBean (từ org.springframework.test.context.bean.override.mockito.MockitoBean)",
        "@MockSpring",
        "@TestMock",
        "@OverrideBean"
      ],
      "answer": 0,
      "explain": "Từ Spring Boot 3.4, cơ chế Bean Overriding được đại tu: '@MockBean' và '@SpyBean' được thay thế chính thức bằng '@MockitoBean' và '@MockitoSpyBean' nằm trong gói bean.override.",
      "why": [
        "✓ Đúng — @MockitoBean là chuẩn mới nhất của Spring Boot 3.4+ thay thế hoàn toàn cho @MockBean cũ.",
        "Sai — @MockSpring không tồn tại.",
        "Sai — @TestMock không phải annotation của Spring.",
        "Sai — @OverrideBean không phải annotation chuyên dụng cho Mockito."
      ]
    },
    {
      "level": "medium",
      "scenario": "Bạn muốn viết test kiểm tra tầng Controller (REST API endpoints) một cách nhanh chóng mà KHÔNG cần khởi động toàn bộ Spring Boot server, Database hay Message broker.",
      "q": "Annotation Test Slice nào của Spring Boot được thiết kế chuyên biệt cho tầng Web MVC?",
      "options": [
        "@WebMvcTest(UserController.class)",
        "@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)",
        "@DataJpaTest",
        "@RestClientTest"
      ],
      "answer": 0,
      "explain": "@WebMvcTest là một Test Slice chỉ nạp các thành phần tầng Web (Controller, ControllerAdvice, Filter, Converter, Jackson), tự động cấu hình MockMvc và bỏ qua hoàn toàn Service/JPA.",
      "why": [
        "✓ Đúng — @WebMvcTest nạp slice siêu nhẹ, chỉ focus test HTTP status, serialization và validation của Controller.",
        "Sai — @SpringBootTest khởi động toàn bộ ngữ cảnh ứng dụng (Full Context), rất nặng và chậm.",
        "Sai — @DataJpaTest chỉ nạp cấu hình cơ sở dữ liệu và Spring Data Repositories.",
        "Sai — @RestClientTest dùng để test RestTemplate/RestClient gọi ra ngoài."
      ]
    },
    {
      "level": "hard",
      "scenario": "Khi kiểm thử tích hợp (Integration Test) với cơ sở dữ liệu thật, giải pháp sử dụng H2 In-Memory Database thường gặp vấn đề sai khác cú pháp SQL (PostgreSQL JSONB, Trigger, Sequence) so với Production.",
      "q": "Công nghệ nào hiện nay là tiêu chuẩn vàng để chạy Database thật (PostgreSQL, MySQL) bên trong Docker container phục vụ Integration Test?",
      "options": [
        "Testcontainers",
        "Embedded Derby DB",
        "Cài đặt database thủ công trên từng máy developer",
        "Mock database connection bằng tay"
      ],
      "answer": 0,
      "explain": "Testcontainers khởi tạo các Docker container thực thụ (PostgreSQL, Kafka, Redis) trong lúc chạy test và tự động tiêu hủy khi test xong, đảm bảo môi trường test giống 100% production.",
      "why": [
        "✓ Đúng — Testcontainers là tiêu chuẩn vàng ngành công nghiệp, được Spring Boot 3.1+ hỗ trợ native qua @ServiceConnection.",
        "Sai — Derby cũng là in-memory DB giống H2, không giải quyết được khác biệt cú pháp.",
        "Sai — Cài thủ công vi phạm nguyên tắc tự động hóa và gây lỗi 'chạy được trên máy tôi'.",
        "Sai — Mock connection không kiểm tra được tính toàn vẹn của câu lệnh SQL thật."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong Spring Boot 3.1+, bạn muốn kết nối một Testcontainer PostgreSQL với ứng dụng Spring Boot mà không cần phải cấu hình thủ công 'DynamicPropertyRegistry'.",
      "q": "Annotation tiện ích nào mới được giới thiệu để tự động bind JDBC URL, username và password từ container?",
      "options": [
        "@ServiceConnection (org.springframework.boot.testcontainers.service.connection.ServiceConnection)",
        "@AutoConfigureTestDatabase",
        "@DockerProperty",
        "@ContainerBinding"
      ],
      "answer": 0,
      "explain": "@ServiceConnection là tính năng đột phá của Spring Boot 3.1: tự động phát hiện loại container (Postgres, Mongo, Redis...) và inject toàn bộ cấu hình kết nối vào Spring Environment tự động.",
      "why": [
        "✓ Đúng — @ServiceConnection giúp loại bỏ hoàn toàn boilerplate code cấu hình @DynamicPropertySource trước đây.",
        "Sai — @AutoConfigureTestDatabase là annotation cũ thường thay thế DataSource bằng H2 in-memory.",
        "Sai — @DockerProperty không tồn tại.",
        "Sai — @ContainerBinding không phải annotation của Spring Boot."
      ]
    },
    {
      "level": "medium",
      "scenario": "Khi viết test với MockMvc, bạn muốn kiểm tra trường 'data.name' trong JSON response trả về có giá trị đúng bằng 'Nguyen Van A'.",
      "q": "Cú pháp JsonPath nào của Spring Test là chính xác?",
      "options": [
        "mockMvc.perform(...).andExpect(jsonPath(\"$.data.name\").value(\"Nguyen Van A\"))",
        "mockMvc.perform(...).andExpect(body(\"name == Nguyen Van A\"))",
        "mockMvc.perform(...).andExpect(json(\"data/name/Nguyen Van A\"))",
        "mockMvc.perform(...).andExpect(xpath(\"//data/name\").text(\"Nguyen Van A\"))"
      ],
      "answer": 0,
      "explain": "'jsonPath(\"$.data.name\").value(...)' sử dụng thư viện Jayway JsonPath để duyệt và kiểm tra giá trị của các trường trong JSON payload một cách trực quan.",
      "why": [
        "✓ Đúng — jsonPath(\"$.field\").value(...) là cú pháp chuẩn mực trong MockMvc ResultMatcher.",
        "Sai — body(...) không phải method assertion chuẩn của Spring Test.",
        "Sai — json(...) không hỗ trợ kiểm tra giá trị trường lồng nhau.",
        "Sai — xpath() dùng cho XML, không dùng cho JSON."
      ]
    },
    {
      "level": "hard",
      "scenario": "Service của bạn gọi một API thanh toán bên thứ ba (VNPay hoặc Stripe) qua HTTP REST client. Khi viết Integration Test, bạn không muốn gọi ra Internet thật.",
      "q": "Công cụ giả lập HTTP Server nào sau đây là lựa chọn hàng đầu để mock các REST API bên ngoài?",
      "options": [
        "WireMock",
        "Mockito spy trên Socket",
        "Postman Runner",
        "Apache JMeter"
      ],
      "answer": 0,
      "explain": "WireMock khởi tạo một HTTP Mock Server cục bộ, cho phép cấu hình URL stubbing, mô phỏng latency, mã lỗi 500, timeout để kiểm tra độ tin cậy của HTTP Client trong ứng dụng.",
      "why": [
        "✓ Đúng — WireMock là công cụ hàng đầu thế giới để mock external HTTP services trong integration testing.",
        "Sai — Mock socket quá phức tạp và không thực tế.",
        "Sai — Postman là công cụ gửi request test, không phải mock server nhúng trong JUnit.",
        "Sai — JMeter là công cụ load testing, không phải integration test mock tool."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong một test method có đánh dấu @Test bên trong một class kiểm thử được gắn @DataJpaTest.",
      "q": "Mặc định, các thay đổi dữ liệu (INSERT, UPDATE) thực hiện trong test method sẽ có hành vi gì sau khi test chạy xong?",
      "options": [
        "Được commit vĩnh viễn vào database",
        "Tự động ROLLBACK toàn bộ để giữ môi trường sạch sẽ cho các test method tiếp theo",
        "Bị treo chờ người dùng xác nhận",
        "Ném ra TransactionException"
      ],
      "answer": 1,
      "explain": "@DataJpaTest có gắn sẵn @Transactional. Trong môi trường test của Spring, mỗi test method được bọc trong một transaction và mặc định tự động ROLLBACK sau khi test kết thúc.",
      "why": [
        "Sai — Nếu commit vĩnh viễn thì các test method sau sẽ bị ảnh hưởng dữ liệu rác (ô nhiễm dữ liệu).",
        "✓ Đúng — Mặc định Spring Test tự động rollback mọi transaction trong test method để đảm bảo tính độc lập (Test Isolation).",
        "Sai — Test chạy tự động hoàn toàn.",
        "Sai — Không có exception xảy ra."
      ]
    },
    {
      "level": "hard",
      "scenario": "Bạn muốn kiểm tra các quy tắc kiến trúc phần mềm trong dự án (ví dụ: 'Các Controller không được phép truy cập trực tiếp Repository', 'Các class Service phải nằm trong package service').",
      "q": "Thư viện Java Unit Test nào hỗ trợ kiểm tra kiến trúc mã nguồn tự động thông qua bytecode analysis?",
      "options": [
        "ArchUnit",
        "Checkstyle",
        "SonarQube Scanner",
        "JUnit Vintage"
      ],
      "answer": 0,
      "explain": "ArchUnit là một thư viện Java cho phép viết các unit test để kiểm tra kiến trúc hệ thống (Layered Architecture, Dependency rules, Package containment) chạy trực tiếp trong JUnit pipeline.",
      "why": [
        "✓ Đúng — ArchUnit ('noClasses().that().resideInAPackage(\"..controller..\").should().dependOnClassesThat()...') biến quy tắc kiến trúc thành code test tự động.",
        "Sai — Checkstyle chỉ kiểm tra định dạng code (khoảng trắng, đặt tên), không kiểm tra kiến trúc phụ thuộc component.",
        "Sai — SonarQube là hệ thống phân tích tĩnh ngoài, không phải thư viện nhúng chạy trong luồng JUnit test.",
        "Sai — JUnit Vintage dùng để chạy các test case cũ của JUnit 4."
      ]
    },
    {
      "level": "medium",
      "scenario": "Khi viết assertions trong Unit Test, thư viện nào cung cấp cú pháp Fluent API (chuỗi phương thức tự nhiên: assertThat(x).isNotNull().hasSize(3).contains(\"a\")) được ưa chuộng nhất?",
      "q": "Thư viện Assertion chuẩn mực được tích hợp sẵn trong spring-boot-starter-test là:",
      "options": [
        "AssertJ (org.assertj.core.api.Assertions)",
        "JUnit 3 assert(true)",
        "Apache Commons Lang Validate",
        "Hamcrest Matchers thuần"
      ],
      "answer": 0,
      "explain": "AssertJ cung cấp giao diện Fluent Assertions cực kỳ phong phú, dễ đọc, thông báo lỗi trực quan chi tiết và là assertion library khuyến nghị mặc định của Spring Boot.",
      "why": [
        "✓ Đúng — AssertJ là lựa chọn số 1 hiện nay trong hệ sinh thái Java và Spring Boot.",
        "Sai — JUnit 3 assertions rất thô sơ và đã lỗi thời.",
        "Sai — Commons Lang Validate dùng để validate argument nghiệp vụ runtime, không tối ưu cho unit test.",
        "Sai — Hamcrest dùng cú pháp 'assertThat(x, is(notNullValue()))' rườm rà hơn AssertJ."
      ]
    },
    {
      "level": "medium",
      "scenario": "Một test case kiểm tra hành vi ném ngoại lệ khi truyền tham số không hợp lệ vào hàm: 'service.transferMoney(null, 100)'.",
      "q": "Cú pháp chuẩn của JUnit 5 để xác nhận một ngoại lệ được ném ra là gì?",
      "options": [
        "assertThrows(IllegalArgumentException.class, () -> service.transferMoney(null, 100))",
        "@Test(expected = IllegalArgumentException.class)",
        "try { service.transferMoney(null, 100); } catch (Exception e) {}",
        "assertThatException().fails()"
      ],
      "answer": 0,
      "explain": "JUnit 5 sử dụng phương thức 'assertThrows(Class<T> expectedType, Executable executable)', trả về chính instance ngoại lệ đó để lập trình viên có thể tiếp tục assert message bên trong.",
      "why": [
        "✓ Đúng — assertThrows là cú pháp chuẩn của JUnit 5 (org.junit.jupiter.api.Assertions).",
        "Sai — '@Test(expected = ...)' là cú pháp cũ của JUnit 4, không còn hỗ trợ trong JUnit 5.",
        "Sai — Dùng try-catch thủ công rất dễ bỏ sót trường hợp hàm KHÔNG ném lỗi mà test vẫn pass.",
        "Sai — Cú pháp sai."
      ]
    },
    {
      "level": "hard",
      "scenario": "Một lập trình viên nhận thấy bộ Test Suite của dự án chạy mất 15 phút vì Spring ApplicationContext bị khởi động lại (restart) hàng chục lần giữa các class test.",
      "q": "Nguyên nhân phổ biến nhất khiến Spring TestContext Framework làm mất tính năng tái sử dụng Context Cache (Context Caching) là gì?",
      "options": [
        "Lạm dụng annotation '@DirtiesContext' trên các class test hoặc cấu hình các @MockBean khác nhau giữa các test class",
        "Do CPU máy tính quá nóng",
        "Do viết quá nhiều assertion trong 1 test method",
        "Do file pom.xml có quá nhiều dependency"
      ],
      "answer": 0,
      "explain": "Spring Test tự động cache ApplicationContext giữa các test class nếu chúng có cùng cấu hình. Sử dụng @DirtiesContext ép buộc Spring phá hủy cache; đồng thời mỗi tập hợp @MockBean khác nhau tạo ra một biến thể Context mới, gây reload liên tục.",
      "why": [
        "✓ Đúng — Hiểu rõ Context Caching là chìa khóa để tối ưu tốc độ CI/CD test từ 20 phút xuống dưới 2 phút.",
        "Sai — CPU nóng không làm thay đổi số lần restart ApplicationContext của Spring.",
        "Sai — Số lượng assertion không ảnh hưởng đến lifecycle của Context.",
        "Sai — Dependency không làm mất cache nếu cấu hình test đồng nhất."
      ]
    },
    {
      "level": "medium",
      "scenario": "Bạn muốn chạy cùng một test method với nhiều bộ dữ liệu đầu vào khác nhau (ví dụ: test hàm validate email với 10 email hợp lệ và 10 email không hợp lệ).",
      "q": "Tính năng nào của JUnit 5 được thiết kế chuyên dụng cho việc này?",
      "options": [
        "@ParameterizedTest kết hợp với @ValueSource hoặc @CsvSource",
        "@RepeatedTest(10)",
        "Viết vòng lặp for bên trong @Test",
        "@DynamicTest"
      ],
      "answer": 0,
      "explain": "@ParameterizedTest trong JUnit 5 cho phép truyền các tham số khác nhau vào test method thông qua @ValueSource, @CsvSource, hoặc @MethodSource, hiển thị kết quả từng case riêng biệt.",
      "why": [
        "✓ Đúng — Parameterized Tests là chuẩn mực viết data-driven unit testing trong JUnit 5.",
        "Sai — @RepeatedTest chỉ lặp lại test với CÙNG một bộ tham số (thường dùng để test flaky hoặc concurrency).",
        "Sai — Vòng lặp for nếu fail ở phần tử đầu tiên sẽ ngắt toàn bộ các case sau và không báo rõ case nào fail.",
        "Sai — DynamicTest dùng cho test factory phức tạp, quá mức cần thiết cho data test thông thường."
      ]
    },
    {
      "level": "medium",
      "scenario": "Khi viết test cho một phương thức bất đồng bộ trả về CompletableFuture<String>, bạn muốn đợi kết quả tối đa 2 giây trước khi assert.",
      "q": "Cách tiếp cận an toàn và chính xác nhất là gì?",
      "options": [
        "Thread.sleep(2000)",
        "future.get(2, TimeUnit.SECONDS) hoặc dùng thư viện Awaitility: await().atMost(2, SECONDS).until(...)",
        "Bỏ qua không cần assert",
        "Chuyển method sang chạy đồng bộ"
      ],
      "answer": 1,
      "explain": "Sử dụng 'future.get(timeout)' hoặc thư viện 'Awaitility' cho phép kiểm tra điều kiện bất đồng bộ một cách chủ động (polling), test pass ngay khi xong thay vì phải ngủ cứng (sleep) lãng phí thời gian.",
      "why": [
        "Sai — Thread.sleep() làm chậm build pipeline và vẫn có thể fail nếu máy chủ CI chạy chậm (flaky test).",
        "✓ Đúng — Awaitility hoặc future.get(timeout) là best practice xử lý kiểm thử bất đồng bộ trong Java.",
        "Sai — Không assert thì test case vô nghĩa.",
        "Sai — Thay đổi logic mã nguồn chỉ để phục vụ test là sai lầm."
      ]
    },
    {
      "level": "hard",
      "scenario": "Trong Mockito, phương thức 'verify(mockRepository, times(1)).save(any())' dùng để làm gì?",
      "q": "Ý nghĩa của phương thức verify():",
      "options": [
        "Thực hiện lưu dữ liệu vào database",
        "Kiểm tra xem phương thức save() của mockRepository có thực sự được gọi ĐÚNG 1 LẦN trong suốt quá trình test hay không",
        "Đo thời gian chạy của method save()",
        "Mã hóa tham số truyền vào hàm save()"
      ],
      "answer": 1,
      "explain": "Mockito.verify() kiểm tra hành vi tương tác (Interaction Testing): xác nhận một method trên mock object có được gọi với đúng số lần (times, never, atLeastOnce) và đúng tham số kỳ vọng hay không.",
      "why": [
        "Sai — Mock object không lưu dữ liệu thật.",
        "✓ Đúng — Verification là nửa còn lại quan trọng của Mocking: kiểm tra side-effects và flow điều hướng của code.",
        "Sai — Không đo thời gian.",
        "Sai — Không liên quan đến mã hóa."
      ]
    },
    {
      "level": "medium",
      "scenario": "Để đo lường mức độ bao phủ mã nguồn (Code Coverage: Line coverage, Branch coverage) của các unit test trong dự án Spring Boot.",
      "q": "Maven plugin nào được sử dụng phổ biến nhất trong hệ sinh thái Java?",
      "options": [
        "JaCoCo (jacoco-maven-plugin)",
        "Maven Surefire Plugin",
        "Maven Shade Plugin",
        "SonarQube Maven Plugin"
      ],
      "answer": 0,
      "explain": "JaCoCo (Java Code Coverage) chèn bytecode instrumentation để đo chính xác số dòng code và nhánh rẽ (branch) được thực thi bởi tests, xuất báo cáo HTML và XML cho CI/CD.",
      "why": [
        "✓ Đúng — JaCoCo là tiêu chuẩn công nghiệp về Code Coverage trong thế giới Java.",
        "Sai — Surefire là plugin để chạy test, không tự sinh báo cáo đo độ bao phủ chi tiết.",
        "Sai — Shade plugin dùng để đóng gói Uber/Fat JAR.",
        "Sai — SonarQube plugin gửi báo cáo lên server, nhưng file báo cáo coverage bên dưới vẫn do JaCoCo tạo ra."
      ]
    },
    {
      "level": "medium",
      "scenario": "Bạn muốn một class kiểm thử chỉ được thực thi trên môi trường Continuous Integration (CI), bỏ qua khi chạy ở máy local của lập trình viên.",
      "q": "Tính năng Conditional Execution nào của JUnit 5 đáp ứng việc này?",
      "options": [
        "@EnabledIfEnvironmentVariable(named = \"CI\", matches = \"true\")",
        "@Disabled",
        "@Ignore",
        "@Test(timeout = 0)"
      ],
      "answer": 0,
      "explain": "JUnit 5 cung cấp bộ annotation '@EnabledIf...' và '@DisabledIf...' (dựa trên OS, Java version, System Property, Environment Variable) để điều khiển việc thực thi test linh hoạt.",
      "why": [
        "✓ Đúng — @EnabledIfEnvironmentVariable kiểm tra biến môi trường của hệ thống CI/CD để bật/tắt test case.",
        "Sai — @Disabled sẽ vô hiệu hóa test vô điều kiện trên mọi môi trường.",
        "Sai — @Ignore là của JUnit 4 cũ.",
        "Sai — Không liên quan đến điều kiện môi trường."
      ]
    },
    {
      "level": "hard",
      "scenario": "Khi viết test cho Repository với @DataJpaTest, nếu bạn muốn dùng cơ sở dữ liệu thật của Testcontainers thay vì để Spring tự động thay thế bằng H2 In-Memory.",
      "q": "Cấu hình nào bắt buộc phải thêm vào class test?",
      "options": [
        "@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)",
        "spring.datasource.url=h2:mem",
        "@NoRepositoryBean",
        "@EnableTransactionManagement(proxyTargetClass = false)"
      ],
      "answer": 0,
      "explain": "Mặc định @DataJpaTest sẽ tự động dò tìm H2 trong classpath và thay thế DataSource của bạn. Đặt 'Replace.NONE' ra lệnh cho Spring giữ nguyên cấu hình DataSource thật (Testcontainers).",
      "why": [
        "✓ Đúng — 'Replace.NONE' là cấu hình bắt buộc khi kết hợp @DataJpaTest với Docker container hoặc database thật.",
        "Sai — Đó là cấu hình để dùng H2, ngược với yêu cầu đề bài.",
        "Sai — @NoRepositoryBean dùng cho generic repository base interface.",
        "Sai — Không liên quan đến datasource replacement."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong Mockito, để thiết lập một phương thức void ném ra ngoại lệ khi được gọi (ví dụ: emailService.send() ném MailException).",
      "q": "Cú pháp Mockito nào là chính xác cho void method?",
      "options": [
        "doThrow(new MailException(\"Failed\")).when(emailService).send(any())",
        "when(emailService.send(any())).thenThrow(...)",
        "mock(emailService).throws(...)",
        "emailService.send(any()).willThrow(...)"
      ],
      "answer": 0,
      "explain": "Với method có kiểu trả về void, không thể viết 'when(voidMethod())' vì trình biên dịch Java không cho phép truyền void làm tham số. Phải dùng cú pháp 'doThrow(...).when(mock).method()'.",
      "why": [
        "✓ Đúng — Cú pháp doThrow/doNothing/doAnswer bắt buộc phải dùng cho các phương thức void trong Mockito.",
        "Sai — 'when(emailService.send())' sẽ báo lỗi biên dịch vì hàm send() trả về void.",
        "Sai — Cú pháp sai.",
        "Sai — Cú pháp sai."
      ]
    },
    {
      "level": "medium",
      "scenario": "Bạn muốn sắp xếp thứ tự thực thi của các test method trong cùng một test class (ví dụ: testCreateUser chạy trước testUpdateUser rồi đến testDeleteUser).",
      "q": "Cặp cấu hình nào của JUnit 5 quản lý việc này?",
      "options": [
        "@TestMethodOrder(MethodOrderer.OrderAnnotation.class) trên class và @Order(1) trên từng method",
        "@FixMethodOrder trên class",
        "@Sequence(1)",
        "Tự động sắp xếp theo thứ tự bảng chữ cái alphabet"
      ],
      "answer": 0,
      "explain": "JUnit 5 sử dụng @TestMethodOrder kết hợp với MethodOrderer (OrderAnnotation, DisplayName, MethodName, Random) và @Order trên method để kiểm soát thứ tự chạy.",
      "why": [
        "✓ Đúng — Chuẩn JUnit 5: @TestMethodOrder(MethodOrderer.OrderAnnotation.class) + @Order(n).",
        "Sai — @FixMethodOrder là annotation cũ của JUnit 4.",
        "Sai — Không có annotation @Sequence trong JUnit.",
        "Sai — Mặc định JUnit không đảm bảo thứ tự chạy để khuyến khích test độc lập; muốn xếp thứ tự phải cấu hình rõ ràng."
      ]
    }
  ],
  "5": [
    {
      "level": "hard",
      "scenario": "Trong Spring Security 6 (Spring Boot 3), class 'WebSecurityConfigurerAdapter' đã bị gỡ bỏ hoàn toàn.",
      "q": "Cơ chế cấu hình bảo mật chuẩn mực hiện nay dựa trên Bean nào?",
      "options": [
        "Đăng ký một Bean kiểu 'SecurityFilterChain' nhận HttpSecurity làm tham số và trả về http.build()",
        "Kế thừa class SecurityConfigurer",
        "Cấu hình trong file web.xml",
        "Sử dụng ServletFilter đơn thuần"
      ],
      "answer": 0,
      "explain": "Spring Security 6 chuyển đổi hoàn toàn sang mô hình Component-based: lập trình viên định nghĩa Bean '@Bean public SecurityFilterChain filterChain(HttpSecurity http) throws Exception { ... return http.build(); }'.",
      "why": [
        "✓ Đúng — SecurityFilterChain Bean là kiến trúc cốt lõi duy nhất để cấu hình bảo mật web trong Spring Boot 3.",
        "Sai — Kế thừa adapter đã lỗi thời và bị xóa bỏ hoàn toàn.",
        "Sai — web.xml là của chuẩn Servlet cổ điển, không dùng trong Spring Boot hiện đại.",
        "Sai — Không tận dụng được chuỗi filter bảo mật tinh vi của Spring Security."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong kiến trúc Spring Security, thông tin danh tính của người dùng hiện tại (Principal, Authorities/Roles) được lưu trữ ở đâu trong luồng thực thi request?",
      "q": "Vị trí lưu trữ Authentication context chuẩn là gì?",
      "options": [
        "SecurityContextHolder.getContext().getAuthentication() (lưu trong ThreadLocal)",
        "HttpSession của Tomcat",
        "Biến static cục bộ trong Controller",
        "Cookie của trình duyệt"
      ],
      "answer": 0,
      "explain": "Spring Security sử dụng 'SecurityContextHolder' (mặc định dựa trên ThreadLocal) để lưu trữ SecurityContext của luồng xử lý hiện tại, cho phép truy cập danh tính ở bất kỳ tầng nào của code.",
      "why": [
        "✓ Đúng — SecurityContextHolder -> SecurityContext -> Authentication là cấu trúc phân cấp chuẩn của Spring Security.",
        "Sai — Trong stateless REST API (dùng JWT), Session bị vô hiệu hóa (STATELESS), thông tin không lưu trong HttpSession.",
        "Sai — Biến static sẽ bị ghi đè và làm lộ thông tin giữa các người dùng với nhau (lỗ hổng bảo mật nghiêm trọng).",
        "Sai — Cookie ở phía client, server giải mã và đưa vào SecurityContextHolder."
      ]
    },
    {
      "level": "hard",
      "scenario": "Khi ứng dụng REST API sử dụng kiến trúc Stateless Authentication với JWT (JSON Web Token), client lưu token ở LocalStorage/Header.",
      "q": "Tại sao trong cấu hình HttpSecurity ta có thể an toàn tắt bảo vệ CSRF: 'http.csrf(csrf -> csrf.disable())'?",
      "options": [
        "Vì CSRF chỉ là tính năng thừa thãi của Spring",
        "Vì CSRF (Cross-Site Request Forgery) khai thác cơ chế trình duyệt tự động đính kèm Cookie; khi dùng Bearer Token trong Header 'Authorization', trình duyệt không bao giờ tự động gửi token này từ trang web của kẻ tấn công",
        "Vì JWT đã tự động mã hóa chống CSRF",
        "Vì tắt CSRF giúp server xử lý nhanh hơn 100 lần"
      ],
      "answer": 1,
      "explain": "Tấn công CSRF phụ thuộc vào việc trình duyệt tự động gửi Ambient Credentials (Session Cookie) khi click vào link độc hại. Khi API dùng Authorization: Bearer Header, attacker không thể ép trình duyệt tự gửi header này được, do đó CSRF không còn là mối đe dọa.",
      "why": [
        "Sai — CSRF là lỗ hổng nguy hiểm bậc nhất đối với ứng dụng dùng Session/Cookie truyền thống.",
        "✓ Đúng — Hiểu rõ bản chất CSRF: nó chỉ đe dọa cơ chế xác thực tự động bằng Cookie. Stateless JWT dùng custom header hoàn toàn miễn nhiễm.",
        "Sai — Bản thân chữ ký JWT không chống được việc bị trình duyệt gửi lén nếu token nằm trong Cookie.",
        "Sai — Tắt CSRF không phải vì mục đích tốc độ mà vì sự khác biệt về cơ chế bảo mật."
      ]
    },
    {
      "level": "medium",
      "scenario": "Khi lưu mật khẩu người dùng vào cơ sở dữ liệu, yêu cầu an toàn thông tin bắt buộc không được lưu plain-text.",
      "q": "PasswordEncoder nào sau đây được Spring Security khuyến nghị sử dụng mặc định với cơ chế tự động sinh Salt ngẫu nhiên và Work Factor chống tấn công Brute-force?",
      "options": [
        "BCryptPasswordEncoder (hoặc Argon2PasswordEncoder)",
        "MessageDigest MD5",
        "SHA-256 thuần túy",
        "Base64 encoder"
      ],
      "answer": 0,
      "explain": "BCrypt sử dụng thuật toán hash một chiều thích ứng (Adaptive One-Way Hash), tự động nhúng Salt 128-bit vào chuỗi kết quả và cho phép tăng cost factor để kháng cự phần cứng GPU đào coin tấn công brute-force.",
      "why": [
        "✓ Đúng — BCryptPasswordEncoder là chuẩn mặc định của Spring Security PasswordEncoderFactories.",
        "Sai — MD5 đã bị bẻ khóa hoàn toàn, cực kỳ nguy hiểm.",
        "Sai — SHA-256 thuần túy không có salt và tốc độ tính toán quá nhanh, dễ bị tấn công bằng Rainbow Table.",
        "Sai — Base64 chỉ là bảng mã hóa nhị phân đảo ngược được trong 1 tích tắc, không phải là hàm băm mật khẩu."
      ]
    },
    {
      "level": "medium",
      "scenario": "Một chuỗi JSON Web Token (JWT) hợp lệ bao gồm 3 phần được phân tách bởi 2 dấu chấm (header.payload.signature).",
      "q": "Phần thứ 3 (Chữ ký - Signature) được tạo ra nhằm mục đích gì?",
      "options": [
        "Mã hóa ẩn giấu thông tin trong payload không cho ai đọc được",
        "Đảm bảo tính toàn vẹn (Integrity) của dữ liệu: chứng minh payload không bị sửa đổi bởi bên thứ ba trên đường truyền",
        "Lưu trữ ảnh avatar của người dùng",
        "Quy định thời gian hết hạn của token"
      ],
      "answer": 1,
      "explain": "Chữ ký số (Signature) được tính toán bằng cách băm (Base64(Header) + '.' + Base64(Payload)) với Secret Key. Nếu hacker sửa đổi dù chỉ 1 ký tự trong payload, chữ ký tính lại sẽ không khớp và token bị từ chối.",
      "why": [
        "Sai — JWT mặc định chỉ được Encode Base64Url, bất kỳ ai cũng có thể giải mã và đọc được Payload (không phải Encryption).",
        "✓ Đúng — Chữ ký bảo vệ tính toàn vẹn và xác thực nguồn gốc của token (Tamper-proof).",
        "Sai — Avatar không lưu trong signature.",
        "Sai — Thời gian hết hạn nằm trong trường 'exp' của Payload."
      ]
    },
    {
      "level": "hard",
      "scenario": "Hệ thống xác thực chuyển sang mô hình chữ ký bất đối xứng (Asymmetric Signing - RSA/ECDSA ví dụ thuật toán RS256) thay vì mã đối xứng (Symmetric - HS256).",
      "q": "Lợi ích kiến trúc lớn nhất của việc dùng RS256 trong hệ thống Microservices là gì?",
      "options": [
        "Token có dung lượng nhỏ hơn một nửa",
        "Auth Server giữ Private Key để ký token; hàng chục Microservices khác chỉ cần giữ Public Key để xác thực chữ ký mà không sợ bị lộ Private Key hay bị giả mạo token",
        "Tốc độ xác thực nhanh hơn HS256 gấp 10 lần",
        "Không bao giờ cần refresh token"
      ],
      "answer": 1,
      "explain": "Với khóa bất đối xứng, Auth Server là thực thể duy nhất nắm Private Key để cấp token. Các Resource Services chỉ cần Public Key (thường tải qua endpoint /.well-known/jwks.json) để verify, tăng cường tính bảo mật phân tán tối đa.",
      "why": [
        "Sai — Ngược lại: RSA token có chữ ký dài hơn HS256.",
        "✓ Đúng — Đây là nguyên lý nền tảng của OAuth 2.0 và OpenID Connect (OIDC) cho kiến trúc Microservices phân tán.",
        "Sai — Tính toán khóa bất đối xứng RSA/ECDSA tốn CPU hơn HMAC đối xứng.",
        "Sai — Vòng đời token vẫn cần refresh token như bình thường."
      ]
    },
    {
      "level": "hard",
      "scenario": "Để giảm thiểu rủi ro khi Access Token (thời hạn 15 phút) bị đánh cắp, hệ thống áp dụng kỹ thuật 'Refresh Token Rotation'.",
      "q": "Quy trình hoạt động chuẩn của Refresh Token Rotation là gì?",
      "options": [
        "Mỗi khi client dùng Refresh Token cũ để lấy Access Token mới, server hủy bỏ Refresh Token cũ và cấp một Refresh Token hoàn toàn mới; nếu phát hiện một Refresh Token đã bị hủy được dùng lại, server lập tức thu hồi toàn bộ token của phiên đó",
        "Không bao giờ thay đổi Refresh Token",
        "Gửi Refresh Token qua email mỗi giờ",
        "Đổi thuật toán mã hóa mỗi 5 phút"
      ],
      "answer": 0,
      "explain": "Refresh Token Rotation đảm bảo mỗi Refresh Token chỉ được dùng đúng 1 lần (Single-use). Nếu token cũ bị dùng lại (dấu hiệu kẻ gian đã lấy trộm), hệ thống tự động phát hiện vi phạm và vô hiệu hóa toàn bộ gia đình token (Token Family Revocation).",
      "why": [
        "✓ Đúng — Refresh Token Rotation kết hợp cơ chế Automatic Reuse Detection là tiêu chuẩn bảo mật cao cấp nhất theo khuyến cáo của OAuth 2.0 BCP (Best Current Practice).",
        "Sai — Không thay đổi sẽ tạo ra cửa sổ tấn công vĩnh viễn nếu token bị lộ.",
        "Sai — Không gửi qua email trong luồng HTTP API.",
        "Sai — Không đổi thuật toán."
      ]
    },
    {
      "level": "medium",
      "scenario": "Bạn muốn phân quyền trên từng phương thức trong tầng Service: chỉ người dùng có Role 'ADMIN' mới được thực thi hàm 'deleteUser()'.",
      "q": "Cú pháp Spring Security SpEL chuẩn xác trên method là gì?",
      "options": [
        "@PreAuthorize(\"hasRole('ADMIN')\")",
        "@RolesAllowed(\"ROLE_ADMIN\")",
        "@Secured(\"ADMIN\")",
        "@CheckRole(\"ADMIN\")"
      ],
      "answer": 0,
      "explain": "@PreAuthorize hỗ trợ ngôn ngữ biểu thức SpEL mạnh mẽ. 'hasRole('ADMIN')' tự động kiểm tra authority có tiền tố 'ROLE_ADMIN' trong Authentication object. Cần bật @EnableMethodSecurity ở tầng cấu hình.",
      "why": [
        "✓ Đúng — @PreAuthorize(\"hasRole('ADMIN')\") là chuẩn mực hiện đại và linh hoạt nhất trong Spring Security 6.",
        "Sai — @RolesAllowed là chuẩn JSR-250, thiếu tính năng SpEL nâng cao.",
        "Sai — @Secured là annotation cũ của Spring, bắt buộc phải viết đầy đủ tiền tố 'ROLE_ADMIN' và không hỗ trợ SpEL.",
        "Sai — @CheckRole không phải annotation của Spring Security."
      ]
    },
    {
      "level": "medium",
      "scenario": "Để kích hoạt các annotation phân quyền phương thức như @PreAuthorize, @PostAuthorize trong Spring Boot 3.",
      "q": "Annotation nào cần được khai báo trên Configuration class?",
      "options": [
        "@EnableMethodSecurity",
        "@EnableGlobalMethodSecurity(prePostEnabled = true)",
        "@EnableWebSecurity",
        "@EnableSecurity"
      ],
      "answer": 0,
      "explain": "Trong Spring Security 6 / Spring Boot 3, '@EnableGlobalMethodSecurity' đã bị deprecated và thay thế chính thức bằng '@EnableMethodSecurity' (mặc định đã bật sẵn prePostEnabled = true).",
      "why": [
        "✓ Đúng — @EnableMethodSecurity là annotation chuẩn mới của Spring Boot 3.",
        "Sai — @EnableGlobalMethodSecurity là annotation cũ của Spring Boot 2.x.",
        "Sai — @EnableWebSecurity chỉ cấu hình bảo mật web HTTP filter, không tự động kích hoạt proxy cho method-level security.",
        "Sai — Không có @EnableSecurity."
      ]
    },
    {
      "level": "hard",
      "scenario": "Khi tích hợp với Identity Provider bên ngoài như Keycloak qua chuẩn OAuth2 Resource Server.",
      "q": "Spring Boot 3 cung cấp dependency nào để tự động giải mã và xác thực JWT token từ Keycloak?",
      "options": [
        "spring-boot-starter-oauth2-resource-server",
        "keycloak-spring-boot-starter (cũ)",
        "spring-boot-starter-security-client",
        "jwt-authenticator"
      ],
      "answer": 0,
      "explain": "Keycloak Adapter cũ đã bị RedHat khai tử. Chuẩn hiện đại là dùng 'spring-boot-starter-oauth2-resource-server' kết hợp cấu hình 'spring.security.oauth2.resourceserver.jwt.issuer-uri' trỏ về Keycloak Realm.",
      "why": [
        "✓ Đúng — Chuẩn OAuth2 Resource Server chính thức của Spring Security: không phụ thuộc vendor, hoạt động hoàn hảo với Keycloak, Auth0, Okta, Azure AD.",
        "Sai — keycloak-spring-boot-starter đã bị deprecated và không hỗ trợ Spring Boot 3.",
        "Sai — Starter này dùng khi ứng dụng là Client (đăng nhập bằng Google/Facebook), không phải Resource Server bảo vệ API.",
        "Sai — Không phải starter chính thức."
      ]
    },
    {
      "level": "medium",
      "scenario": "Keycloak lưu các roles của người dùng trong cấu trúc JSON claim: 'realm_access.roles' hoặc 'resource_access.{client}.roles'. Mặc định Spring Security đọc roles từ claim 'scope' hoặc 'scp'.",
      "q": "Để chuyển đổi đúng các roles từ Keycloak thành GrantedAuthority của Spring Security, lập trình viên cần triển khai interface nào?",
      "options": [
        "Converter<Jwt, ? extends AbstractAuthenticationToken> (hoặc JwtAuthenticationConverter)",
        "UserDetailsService",
        "AuthenticationProvider",
        "SecurityContextFilter"
      ],
      "answer": 0,
      "explain": "JwtAuthenticationConverter cho phép cấu hình một custom GrantedAuthoritiesConverter để trích xuất mảng roles từ nested claim 'realm_access.roles' của Keycloak và thêm tiền tố 'ROLE_'.",
      "why": [
        "✓ Đúng — JwtAuthenticationConverter là cầu nối chuẩn mực để trích xuất custom claims từ bất kỳ Identity Provider nào.",
        "Sai — UserDetailsService dùng cho mô hình username/password truy vấn database truyền thống.",
        "Sai — AuthenticationProvider ở tầng cao hơn, không cần thiết phải viết lại toàn bộ provider.",
        "Sai — Filter là thành phần hạ tầng, không tối ưu cho claim mapping."
      ]
    },
    {
      "level": "hard",
      "scenario": "Một lập trình viên muốn chặn brute-force login bằng cách khóa tài khoản tạm thời sau 5 lần nhập sai mật khẩu liên tiếp.",
      "q": "Spring Security phát đi Event nào khi xác thực thất bại mà lập trình viên có thể lắng nghe bằng @EventListener?",
      "options": [
        "AuthenticationFailureBadCredentialsEvent",
        "LoginFailedEvent",
        "SecurityContextEmptyEvent",
        "UnauthorizedUserEvent"
      ],
      "answer": 0,
      "explain": "Khi mật khẩu không khớp, DaoAuthenticationProvider phát đi 'AuthenticationFailureBadCredentialsEvent'. Lắng nghe sự kiện này cho phép tăng counter số lần thử sai trong Redis và khóa IP/User nếu vượt ngưỡng.",
      "why": [
        "✓ Đúng — AuthenticationFailureBadCredentialsEvent là sự kiện chuẩn của Spring Security Event Publishing.",
        "Sai — Tên event sai.",
        "Sai — Không liên quan đến bad credentials.",
        "Sai — Không tồn tại trong Spring Framework."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong cấu hình HttpSecurity, hai matcher sau có sự khác biệt gì về phân quyền: 'hasRole(\"ADMIN\")' và 'hasAuthority(\"ROLE_ADMIN\")'?",
      "q": "Phát biểu nào sau đây là chính xác?",
      "options": [
        "Hoàn toàn tương đương nhau về mặt ngữ nghĩa",
        "hasRole(\"ADMIN\") tự động thêm tiền tố 'ROLE_' vào trước chuỗi để so sánh với danh sách GrantedAuthority; còn hasAuthority(\"ROLE_ADMIN\") so sánh chính xác chuỗi thô không thêm tiền tố",
        "hasAuthority chỉ dùng cho OAuth2, hasRole dùng cho Basic Auth",
        "hasRole chạy chậm hơn vì phải truy vấn DB"
      ],
      "answer": 1,
      "explain": "'hasRole(x)' tự động gọi 'hasAuthority(\"ROLE_\" + x)'. Hiểu rõ quy tắc này giúp tránh lỗi 403 Forbidden kinh điển khi JWT trả về role không có tiền tố ROLE_ hoặc cấu hình lệch chuẩn.",
      "why": [
        "Sai — Cú pháp truyền vào khác nhau (ADMIN vs ROLE_ADMIN).",
        "✓ Đúng — hasRole tự động gán prefix 'ROLE_'. hasAuthority kiểm tra chuỗi chính xác 100%.",
        "Sai — Cả hai đều dùng được trong mọi cơ chế xác thực của Spring Security.",
        "Sai — Cả hai đều kiểm tra in-memory trên Authentication object, tốc độ nano giây."
      ]
    },
    {
      "level": "medium",
      "scenario": "Khi người dùng gửi request không có token hoặc token không hợp lệ đến một endpoint được bảo vệ, máy chủ trả về mã lỗi 401 Unauthorized.",
      "q": "Interface nào trong Spring Security chịu trách nhiệm xử lý và tùy biến phản hồi khi người dùng CHƯA ĐĂNG NHẬP (Unauthenticated)?",
      "options": [
        "AuthenticationEntryPoint (commence method)",
        "AccessDeniedHandler (handle method)",
        "LogoutSuccessHandler",
        "AuthenticationSuccessHandler"
      ],
      "answer": 0,
      "explain": "AuthenticationEntryPoint xử lý khi người dùng CHƯA xác thực (401). AccessDeniedHandler xử lý khi người dùng ĐÃ xác thực nhưng KHÔNG ĐỦ quyền hạn (403 Forbidden).",
      "why": [
        "✓ Đúng — AuthenticationEntryPoint.commence() là nơi custom JSON response 401 chuẩn RFC 7807.",
        "Sai — AccessDeniedHandler dùng cho lỗi 403 (Đã login nhưng thiếu quyền), không phải 401.",
        "Sai — Xử lý sau khi logout.",
        "Sai — Xử lý sau khi login thành công."
      ]
    },
    {
      "level": "medium",
      "scenario": "Để ngăn chặn kẻ tấn công thực hiện Clickjacking (nhúng trang web của bạn vào một <iframe> trên trang độc hại để lừa người dùng click).",
      "q": "Header bảo mật HTTP nào được Spring Security bật mặc định để bảo vệ ứng dụng?",
      "options": [
        "X-Frame-Options: DENY (hoặc SAMEORIGIN)",
        "Content-Type: application/json",
        "Strict-Transport-Security",
        "Access-Control-Allow-Origin"
      ],
      "answer": 0,
      "explain": "Header 'X-Frame-Options: DENY' chỉ thị cho trình duyệt cấm tuyệt đối việc hiển thị trang web trong thẻ <frame>, <iframe> hoặc <object>, triệt tiêu hoàn toàn nguy cơ Clickjacking.",
      "why": [
        "✓ Đúng — X-Frame-Options là lá chắn chống Clickjacking chuẩn mực được Spring Security tự động cấu hình.",
        "Sai — Content-Type quy định định dạng dữ liệu.",
        "Sai — HSTS ép buộc trình duyệt chỉ kết nối qua HTTPS.",
        "Sai — Header của cơ chế CORS."
      ]
    },
    {
      "level": "hard",
      "scenario": "Bạn muốn cấu hình một Filter xác thực JWT tùy chỉnh (JwtAuthenticationFilter) để chạy TRƯỚC Filter xử lý đăng nhập username/password mặc định của Spring.",
      "q": "Cú pháp đăng ký vị trí Filter trong SecurityFilterChain là gì?",
      "options": [
        "http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)",
        "http.addFilter(jwtAuthFilter)",
        "http.setFilter(jwtAuthFilter, 0)",
        "http.insertFilter(jwtAuthFilter)"
      ],
      "answer": 0,
      "explain": "Spring Security cung cấp 'http.addFilterBefore(filter, targetClass)' và 'http.addFilterAfter(filter, targetClass)' để sắp xếp chính xác thứ tự của custom filter trong Security Filter Chain.",
      "why": [
        "✓ Đúng — Đặt JwtAuthenticationFilter trước UsernamePasswordAuthenticationFilter là vị trí kinh điển để trích xuất Bearer token từ sớm.",
        "Sai — addFilter() không xác định rõ thứ tự, dễ gây lỗi nếu filter không kế thừa đúng class chuẩn.",
        "Sai — Cú pháp không tồn tại.",
        "Sai — Cú pháp không tồn tại."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong JWT, claim nào sau đây được đăng ký chuẩn trong RFC 7519 dùng để lưu trữ thời điểm token hết hạn (Expiration Time)?",
      "q": "Tên claim chuẩn là:",
      "options": [
        "exp (dạng số nguyên Unix Timestamp tính bằng giây)",
        "expire_time",
        "expiration_date",
        "ttl"
      ],
      "answer": 0,
      "explain": "RFC 7519 định nghĩa các Registered Claims chuẩn ngắn gọn: 'exp' (Expiration Time), 'iat' (Issued At), 'sub' (Subject), 'iss' (Issuer), 'aud' (Audience).",
      "why": [
        "✓ Đúng — 'exp' là claim chuẩn quốc tế, nhận giá trị Epoch timestamp tính bằng giây.",
        "Sai — expire_time là tên tự đặt, các thư viện JWT chuẩn sẽ không tự động validate được.",
        "Sai — Tên sai quy ước RFC.",
        "Sai — TTL (Time-To-Live) thường dùng trong Redis hoặc DNS, không phải registered claim của JWT."
      ]
    },
    {
      "level": "hard",
      "scenario": "Lập trình viên muốn lấy thông tin của User hiện tại từ SecurityContext trực tiếp tại tham số của Controller method mà không cần gọi SecurityContextHolder thủ công.",
      "q": "Annotation tiện ích nào của Spring Security hỗ trợ inject Principal hiện tại?",
      "options": [
        "@AuthenticationPrincipal CustomUserDetails userDetails",
        "@CurrentUser",
        "@PrincipalUser",
        "@SessionUser"
      ],
      "answer": 0,
      "explain": "@AuthenticationPrincipal tự động trích xuất đối tượng Principal bên trong SecurityContextHolder.getContext().getAuthentication().getPrincipal() và inject thẳng vào tham số controller.",
      "why": [
        "✓ Đúng — @AuthenticationPrincipal là giải pháp clean code nhất để lấy current authenticated user.",
        "Sai — @CurrentUser là meta-annotation do developer tự tạo kết hợp với @AuthenticationPrincipal.",
        "Sai — Không tồn tại trong framework.",
        "Sai — Không tồn tại trong framework."
      ]
    },
    {
      "level": "medium",
      "scenario": "Một kẻ tấn công đánh cắp được chuỗi băm (hash) BCrypt của mật khẩu từ database: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'.",
      "q": "Tại sao kẻ tấn công KHÔNG thể dùng kỹ thuật Rainbow Table (Bảng băm tính toán sẵn) để tra ngược ra mật khẩu gốc?",
      "options": [
        "Vì BCrypt sử dụng Salt ngẫu nhiên được nhúng trực tiếp trong chuỗi hash (phần '$N9qo8uLOickgx2ZMRZoMye'), khiến mỗi mật khẩu dù giống hệt nhau cũng sinh ra hash khác nhau",
        "Vì BCrypt đổi mật khẩu sau mỗi 30 ngày",
        "Vì chuỗi hash được mã hóa thêm bằng RSA",
        "Vì Rainbow Table chỉ hoạt động trên hệ điều hành Windows"
      ],
      "answer": 0,
      "explain": "Salt ngẫu nhiên 128-bit làm tăng không gian mẫu lên đến 2^128 khả năng, khiến việc dựng Rainbow Table tính toán trước trở nên bất khả thi về mặt lưu trữ và tính toán.",
      "why": [
        "✓ Đúng — Salt ngẫu nhiên là khắc tinh số 1 của Rainbow Table attacks, bảo vệ mật khẩu an toàn.",
        "Sai — Hash trong DB là tĩnh, không tự đổi ngày.",
        "Sai — BCrypt là thuật toán độc lập, không dùng RSA.",
        "Sai — Rainbow Table là phương pháp toán học, không phụ thuộc hệ điều hành."
      ]
    },
    {
      "level": "hard",
      "scenario": "Khi kiểm tra tính hợp lệ của chữ ký JWT trong Microservices, lỗi bảo mật 'None Algorithm Attack' (CVE-2015-9235) là gì?",
      "q": "Bản chất của lỗ hổng 'alg: none' trong JWT là gì?",
      "options": [
        "Kẻ tấn công sửa Header JWT thành '{\"alg\": \"none\"}', xóa bỏ phần Signature, và một số thư viện JWT parser cũ tin tưởng header này mà bỏ qua hoàn toàn việc kiểm tra chữ ký, chấp nhận token giả mạo",
        "Kẻ tấn công đánh sập server bằng DDoS",
        "Kẻ tấn công giải mã được database bằng thuật toán none",
        "Token bị tự động xóa sau khi tạo"
      ],
      "answer": 0,
      "explain": "Lỗ hổng kinh điển 'alg: none': đặc tả JWT cho phép token không có chữ ký khi alg=none. Nếu server không ép buộc chặt chẽ thuật toán kỳ vọng, kẻ tấn công có thể tự sửa role thành ADMIN và xóa chữ ký để vượt qua xác thực.",
      "why": [
        "✓ Đúng — Lỗ hổng nghiêm trọng này từng làm chao đảo ngành an toàn thông tin; Spring Security bảo vệ mặc định bằng cách từ chối alg=none.",
        "Sai — Không liên quan đến DDoS.",
        "Sai — Không giải mã database.",
        "Sai — Không tự xóa token."
      ]
    }
  ],
  "6": [
    {
      "level": "hard",
      "scenario": "Trong kiến trúc Microservices, một service gọi sang PaymentService nhưng PaymentService đang bị sập hoặc quá tải khiến các connection HTTP bị giữ chặt, gây cạn kiệt Tomcat thread pool của toàn bộ hệ thống (Cascading Failure).",
      "q": "Design Pattern nào giúp ngắt kết nối tạm thời đến service lỗi và trả về fallback ngay lập tức?",
      "options": [
        "Circuit Breaker Pattern (ví dụ Resilience4j)",
        "Singleton Pattern",
        "Adapter Pattern",
        "Proxy Pattern đơn thuần"
      ],
      "answer": 0,
      "explain": "Circuit Breaker theo dõi tỉ lệ lỗi (Failure Rate). Khi lỗi vượt ngưỡng (ví dụ > 50%), Circuit Breaker chuyển từ CLOSED sang OPEN, từ chối gọi tiếp và chuyển hướng ngay sang Fallback Method để bảo toàn tài nguyên.",
      "why": [
        "✓ Đúng — Circuit Breaker (Resilience4j) là chốt chặn sinh tử chống lỗi dây chuyền (Cascading Failures) trong Microservices.",
        "Sai — Singleton chỉ quản lý 1 instance, không xử lý fault tolerance.",
        "Sai — Adapter chuyển đổi interface, không có cơ chế state machine ngắt mạch.",
        "Sai — Proxy đơn thuần chỉ forward lời gọi, không có thuật toán đo lường tỉ lệ lỗi và timeout."
      ]
    },
    {
      "level": "hard",
      "scenario": "Một Circuit Breaker của Resilience4j đang ở trạng thái 'OPEN'. Sau một khoảng thời gian chờ (waitDurationInOpenState = 10s).",
      "q": "Trạng thái tiếp theo của Circuit Breaker là gì và nó hành xử như thế nào?",
      "options": [
        "Tự động chuyển về CLOSED ngay lập tức",
        "Chuyển sang trạng thái 'HALF_OPEN': cho phép một lượng request giới hạn đi qua để thăm dò xem downstream service đã hồi phục chưa",
        "Chuyển sang trạng thái ERROR và tắt ứng dụng",
        "Xóa toàn bộ cache dữ liệu"
      ],
      "answer": 1,
      "explain": "Trạng thái 'HALF_OPEN' là giai đoạn thử nghiệm: gửi một số lượng request mẫu (permittedNumberOfCallsInHalfOpenState). Nếu thành công, mạch đóng lại (CLOSED); nếu vẫn lỗi, mạch quay lại OPEN.",
      "why": [
        "Sai — Nếu đóng ngay về CLOSED mà service kia vẫn chết thì hệ thống sẽ lập tức sụp đổ trở lại.",
        "✓ Đúng — HALF_OPEN là cơ chế thăm dò thông minh (Probing) để quyết định tự động phục hồi (Self-healing).",
        "Sai — Không bao giờ tắt ứng dụng.",
        "Sai — Không liên quan đến cache."
      ]
    },
    {
      "level": "medium",
      "scenario": "Khi gửi message lên Apache Kafka, bạn muốn đảm bảo độ tin cậy dữ liệu cao nhất (không bao giờ bị mất message ngay cả khi Broker bị crash).",
      "q": "Cấu hình 'acks' nào của Kafka Producer đảm bảo message đã được ghi an toàn trên tất cả các In-Sync Replicas (ISR)?",
      "options": [
        "acks=0",
        "acks=1",
        "acks=all (hoặc acks=-1)",
        "acks=none"
      ],
      "answer": 2,
      "explain": "'acks=all' yêu cầu Leader broker phải đợi toàn bộ các bản sao đồng bộ (In-Sync Replicas - ISR) ghi thành công message vào log đĩa thì mới gửi acknowledgement cho Producer.",
      "why": [
        "Sai — acks=0 là Fire-and-forget: Producer không chờ xác nhận, nguy cơ mất dữ liệu cao nhất.",
        "Sai — acks=1 chỉ chờ Leader ghi xong; nếu Leader crash trước khi kịp sync sang Follower thì message bị mất vĩnh viễn.",
        "✓ Đúng — 'acks=all' kết hợp với 'min.insync.replicas=2' là tiêu chuẩn vàng chống mất dữ liệu của các hệ thống tài chính.",
        "Sai — Không có giá trị acks=none."
      ]
    },
    {
      "level": "hard",
      "scenario": "Một Consumer đọc message từ Kafka Topic để cộng tiền vào tài khoản người dùng. Do sự cố mạng, message bị gửi lại (Redelivery) lần thứ hai.",
      "q": "Consumer cần được thiết kế theo nguyên lý nào để dù nhận 1 lần hay 10 lần thì tài khoản vẫn chỉ được cộng tiền đúng 1 lần duy nhất?",
      "options": [
        "Idempotent Consumer Pattern (Consumer có tính lũy thừa / kiểm tra Idempotency Key)",
        "Chạy Consumer đơn luồng",
        "Tắt hoàn toàn cơ chế Retry của Kafka",
        "Tăng số lượng partition của topic"
      ],
      "answer": 0,
      "explain": "Idempotent Consumer lưu trữ 'messageId' (Transaction ID) đã xử lý vào cơ sở dữ liệu (Unique Constraint hoặc Redis). Khi nhận message, kiểm tra nếu ID đã có thì bỏ qua (Deduplication), đảm bảo an toàn nghiệp vụ.",
      "why": [
        "✓ Đúng — Trong hệ phân tán, mạng lưới chỉ đảm bảo 'At-least-once delivery'. Phía Consumer bắt buộc phải thiết kế Idempotent để đạt 'Effectively-once'.",
        "Sai — Đơn luồng vẫn nhận lại message trùng khi consumer restart hoặc rebalance.",
        "Sai — Tắt retry sẽ làm mất dữ liệu khi có sự cố mạng tạm thời.",
        "Sai — Số partition không giải quyết được tính trùng lặp của message."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong Apache Kafka, làm thế nào để đảm bảo tất cả các sự kiện của CÙNG MỘT khách hàng (customerId = 12345) luôn luôn được xử lý theo đúng thứ tự thời gian nghiêm ngặt?",
      "q": "Cơ chế phân phối Partition Key của Kafka Producer là gì?",
      "options": [
        "Gửi message không kèm Key",
        "Sử dụng customerId làm Message Key khi Producer gửi record; Kafka sẽ hash Key đó để luôn route vào CÙNG MỘT Partition duy nhất",
        "Tạo một Topic riêng cho mỗi khách hàng",
        "Consumer tự sắp xếp lại trong RAM"
      ],
      "answer": 1,
      "explain": "Kafka đảm bảo thứ tự (Ordering Guarantee) tuyệt đối BÊN TRONG MỘT PARTITION. Các message có cùng Key sẽ luôn được hash vào cùng một Partition và được đọc tuần tự bởi 1 consumer.",
      "why": [
        "Sai — Không có key thì Kafka sẽ round-robin phân tán sang các partition khác nhau, thứ tự bị đảo lộn hoàn toàn.",
        "✓ Đúng — Cùng Key -> Cùng Partition -> Đảm bảo tuần tự thời gian 100%.",
        "Sai — Tạo hàng triệu Topic sẽ làm tê liệt ZooKeeper/KRaft và tốn tài nguyên broker nghiêm trọng.",
        "Sai — Sắp xếp trong RAM không khả thi khi dữ liệu streaming liên tục và nhiều instance consumer."
      ]
    },
    {
      "level": "hard",
      "scenario": "Một nghiệp vụ thanh toán gồm 2 thao tác: (1) Lưu đơn hàng vào Database của OrderService, và (2) Bắn sự kiện 'OrderCreated' lên Kafka để NotificationService gửi mail. Nếu DB lưu xong mà Kafka broker bị sập, hệ thống bị mất đồng bộ dữ liệu.",
      "q": "Design Pattern nào giải quyết triệt để vấn đề phân tán này mà không cần dùng 2-Phase Commit (XA)?",
      "options": [
        "Transactional Outbox Pattern (kết hợp Debezium / CDC hoặc Polling Publisher)",
        "Chạy cả 2 trong cùng 1 khối try-catch",
        "Sử dụng Thread.sleep() chờ Kafka",
        "Chuyển toàn bộ database sang Kafka"
      ],
      "answer": 0,
      "explain": "Transactional Outbox: Ghi Order và Event vào cùng một Database vật lý trong CÙNG MỘT Local Transaction (bảng 'outbox'). Một worker riêng (hoặc Debezium đọc DB log) sẽ đọc bảng outbox và publish lên Kafka đảm bảo không bao giờ mất sự kiện.",
      "why": [
        "✓ Đúng — Transactional Outbox Pattern là giải pháp kinh điển và mạnh mẽ nhất cho bài toán Dual-Write trong Microservices.",
        "Sai — Try-catch không giải quyết được trường hợp mạng đứt giữa chừng hoặc server sập nguồn sau bước 1 trước bước 2.",
        "Sai — Thread.sleep() vô ích trước sự cố hạ tầng.",
        "Sai — Kafka là streaming platform, không thay thế được RDBMS transactional business logic."
      ]
    },
    {
      "level": "hard",
      "scenario": "Trong kiến trúc Event-Driven Microservices, để thực hiện một chuỗi giao dịch phân tán xuyên suốt nhiều service (Order -> Payment -> Inventory -> Shipping) có khả năng Hoàn tác (Compensating Transaction) khi 1 bước thất bại.",
      "q": "Pattern nào là tiêu chuẩn quản lý phân tán thay thế cho ACID truyền thống?",
      "options": [
        "SAGA Pattern (Choreography hoặc Orchestration)",
        "Factory Pattern",
        "Model-View-Controller (MVC)",
        "MapReduce"
      ],
      "answer": 0,
      "explain": "SAGA Pattern phân rã giao dịch lớn thành chuỗi các local transaction. Nếu một bước thất bại (ví dụ trừ kho hết hàng), SAGA sẽ kích hoạt chuỗi giao dịch bù (Compensating Transactions) theo chiều ngược lại để hoàn tiền và hủy đơn.",
      "why": [
        "✓ Đúng — SAGA Pattern (Orchestration với Temporal/Camunda hoặc Choreography với Kafka) là chuẩn mực quản lý distributed transaction.",
        "Sai — Factory là creational pattern cho OOP object.",
        "Sai — MVC là kiến trúc trình bày giao diện người dùng.",
        "Sai — MapReduce là mô hình xử lý dữ liệu lớn theo lô (Big Data batch processing)."
      ]
    },
    {
      "level": "medium",
      "scenario": "Khi một Kafka Consumer gặp ngoại lệ không thể xử lý (ví dụ: dữ liệu JSON bị hỏng, lỗi nghiệp vụ vĩnh viễn), việc retry liên tục tại offset đó sẽ làm tắc nghẽn toàn bộ luồng xử lý (Head-of-Line Blocking).",
      "q": "Cơ chế nào giúp chuyển các message lỗi này sang một Topic cách ly riêng để điều tra sau?",
      "options": [
        "Dead Letter Topic (DLT) / Dead Letter Queue (DLQ)",
        "Xóa vĩnh viễn message và bỏ qua",
        "Restart lại toàn bộ Kafka Broker",
        "Tự động tăng timeout của consumer"
      ],
      "answer": 0,
      "explain": "Spring Kafka cung cấp 'DeadLetterPublishingRecoverer'. Khi retry vượt số lần tối đa, message sẽ được đẩy sang Dead Letter Topic (thường có hậu tố '.DLT') để hệ thống tiếp tục xử lý các message bình thường khác.",
      "why": [
        "✓ Đúng — Dead Letter Topic (DLT) là thành phần sống còn để giải phóng queue tắc nghẽn và lưu vết lỗi phục vụ phân tích.",
        "Sai — Xóa bỏ làm mất mát dữ liệu khách hàng và không thể truy vết nguyên nhân lỗi.",
        "Sai — Restart broker không sửa được lỗi của message nội dung sai.",
        "Sai — Tăng timeout càng làm hệ thống bị treo lâu hơn."
      ]
    },
    {
      "level": "hard",
      "scenario": "Trong hệ thống Microservices gồm 20 services giao tiếp qua HTTP và Kafka, một request của người dùng bị chậm 5 giây. Làm thế nào để theo dõi và tìm ra chính xác service nào đang bị nghẽn?",
      "q": "Công nghệ Distributed Tracing (Truy vết phân tán) dựa trên 2 mã định danh cơ bản nào?",
      "options": [
        "Trace ID (xuyên suốt toàn bộ luồng request) và Span ID (đại diện cho từng chặng xử lý riêng biệt)",
        "User ID và Password",
        "IP Address và Port",
        "Session ID và Cookie"
      ],
      "answer": 0,
      "explain": "Distributed Tracing (OpenTelemetry, Micrometer Tracing, Zipkin, Jaeger) gắn 'TraceId' cho toàn bộ vòng đời request từ Gateway đến DB, và 'SpanId' cho từng sub-task, giúp vẽ sơ đồ timeline chi tiết từng millisecond.",
      "why": [
        "✓ Đúng — Cặp đôi Trace ID & Span ID (W3C TraceContext) là nền tảng của mọi hệ thống Distributed Tracing hiện đại.",
        "Sai — User/Password không đo lường thời gian thực thi từng chặng dịch vụ.",
        "Sai — IP/Port không liên kết được luồng nghiệp vụ qua nhiều service.",
        "Sai — Session ID chỉ nằm ở tầng web frontend."
      ]
    },
    {
      "level": "medium",
      "scenario": "Spring Cloud Gateway hoạt động trên nền tảng Reactive (Spring WebFlux và Project Reactor) thay vì Spring MVC truyền thống.",
      "q": "Ưu điểm kỹ thuật cốt lõi của kiến trúc Non-blocking I/O (Netty) trong API Gateway là gì?",
      "options": [
        "Xử lý được hàng chục nghìn kết nối đồng thời với số lượng luồng (Threads) rất ít, không bị nghẽn do Thread-per-request",
        "Tự động sửa lỗi cú pháp code Java",
        "Giảm dung lượng file JAR xuống còn 1MB",
        "Không bao giờ bị tấn công DDoS"
      ],
      "answer": 0,
      "explain": "API Gateway là cửa ngõ tập trung chịu tải cực lớn. Kiến trúc Event-loop Non-blocking của Netty cho phép một vài worker thread phục vụ hàng vạn kết nối đồng thời với mức tiêu thụ RAM cực thấp.",
      "why": [
        "✓ Đúng — Non-blocking Event Loop là lý do Spring Cloud Gateway chuyển từ Zuul 1 (blocking) sang WebFlux/Netty.",
        "Sai — Gateway không sửa code.",
        "Sai — Không liên quan đến dung lượng file JAR.",
        "Sai — Vẫn cần các giải pháp Rate Limiting và WAF để chống DDoS."
      ]
    },
    {
      "level": "hard",
      "scenario": "Để bảo vệ các Microservices nội bộ không bị quá tải bởi các cuộc tấn công quét request, Spring Cloud Gateway tích hợp thuật toán Rate Limiting nào phổ biến nhất với Redis?",
      "q": "Thuật toán giới hạn tốc độ truy cập chuẩn mực là gì?",
      "options": [
        "Token Bucket Algorithm (thông qua RedisRateLimiter)",
        "FIFO Queue",
        "Bubble Sort",
        "Round Robin"
      ],
      "answer": 0,
      "explain": "Token Bucket cho phép hệ thống kiểm soát lượng request ổn định (replenishRate) đồng thời cho phép đáp ứng lưu lượng tăng đột biến trong giới hạn cho phép (burstCapacity) một cách mượt mà.",
      "why": [
        "✓ Đúng — Token Bucket kết hợp Redis Lua script là thuật toán Rate Limiter chuẩn của Spring Cloud Gateway.",
        "Sai — FIFO chỉ là hàng đợi, không giới hạn tốc độ theo thời gian.",
        "Sai — Thuật toán sắp xếp mảng.",
        "Sai — Round Robin là thuật toán cân bằng tải, không phải giới hạn tốc độ."
      ]
    },
    {
      "level": "medium",
      "scenario": "Khi hai Microservices cần gọi nhau qua HTTP REST API nội bộ, thư viện Declarative REST Client nào của Spring Cloud giúp viết code đơn giản như gọi một Interface Java?",
      "q": "Tên thư viện Declarative HTTP Client của Spring Cloud là:",
      "options": [
        "OpenFeign (Spring Cloud OpenFeign)",
        "OkHttp thuần",
        "HttpClient của Java 11",
        "Curl wrapper"
      ],
      "answer": 0,
      "explain": "Spring Cloud OpenFeign cho phép khai báo Interface với các annotation Spring MVC (@GetMapping, @PathVariable...). Spring tự động sinh runtime implementation, tự tích hợp Load Balancer và Circuit Breaker.",
      "why": [
        "✓ Đúng — OpenFeign mang lại phong cách viết code hướng đối tượng declarative cực kỳ trực quan và gọn nhẹ.",
        "Sai — OkHttp đòi hỏi viết code thủ công và xử lý HTTP connection cấp thấp.",
        "Sai — Java 11 HttpClient là thư viện chuẩn nhưng không tự động tích hợp Service Discovery và LoadBalancer.",
        "Sai — Curl wrapper không phải giải pháp enterprise."
      ]
    },
    {
      "level": "hard",
      "scenario": "Hai instance của OrderService cùng chạy song song trên 2 container Kubernetes khác nhau. Cả hai cùng muốn thực thi một tác vụ duy nhất (ví dụ: quét đơn hàng quá hạn lúc 12:00 đêm).",
      "q": "Cơ chế nào giúp đảm bảo chỉ có duy nhất MỘT instance được phép chạy tác vụ tại một thời điểm?",
      "options": [
        "Distributed Lock (Khóa phân tán dùng Redis Redlock hoặc ShedLock / Zookeeper)",
        "Dùng từ khóa synchronized trong Java",
        "Dùng cờ boolean in-memory",
        "Tắt bớt 1 container vào ban đêm"
      ],
      "answer": 0,
      "explain": "synchronized chỉ có phạm vi 1 JVM đơn lẻ. Để đồng bộ giữa các container độc lập, bắt buộc phải dùng Khóa phân tán (Distributed Lock) dựa trên Redis (Redlock/ShedLock) hoặc cơ sở dữ liệu dùng chung.",
      "why": [
        "✓ Đúng — Distributed Lock là kiến thức bắt buộc để xử lý race condition và cronjob đa instance trong Microservices.",
        "Sai — synchronized hoàn toàn vô dụng giữa 2 JVM khác nhau trên 2 máy chủ.",
        "Sai — Biến in-memory nằm riêng trên từng RAM của mỗi container.",
        "Sai — Phản trực giác của hệ thống tự động co giãn cao (High Availability)."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong Apache Kafka, khái niệm 'Consumer Lag' biểu thị điều gì?",
      "q": "Định nghĩa chính xác của Consumer Lag là:",
      "options": [
        "Khoảng cách chênh lệch giữa Offset mới nhất được ghi vào Partition (Log End Offset) và Offset cuối cùng mà Consumer đã commit",
        "Thời gian trễ mạng tính bằng millisecond",
        "Kích thước file log trên ổ cứng",
        "Số lượng consumer đang offline"
      ],
      "answer": 0,
      "explain": "Consumer Lag = Log End Offset - Current Consumer Offset. Lag càng lớn nghĩa là Consumer đang bị quá tải, xử lý chậm và bị tụt lại phía sau so với tốc độ Producer đẩy dữ liệu.",
      "why": [
        "✓ Đúng — Consumer Lag là chỉ số quan trọng hàng đầu trong việc giám sát (monitoring) và auto-scaling consumer trong Kafka.",
        "Sai — Lag đo bằng số lượng message chưa kịp đọc, không phải đơn vị thời gian millisecond.",
        "Sai — Không phải dung lượng ổ đĩa.",
        "Sai — Không phải số lượng consumer."
      ]
    },
    {
      "level": "hard",
      "scenario": "Khi một Kafka Consumer Group có 3 Consumer instances nhưng Topic chỉ có 2 Partitions.",
      "q": "Phân bổ nhận message giữa các Consumer sẽ diễn ra như thế nào?",
      "options": [
        "Cả 3 consumer đều đọc chung 2 partition",
        "2 consumer mỗi người phụ trách 1 partition; consumer thứ 3 sẽ ở trạng thái nhàn rỗi (IDLE) không nhận được message nào",
        "Kafka báo lỗi ConsumerGroupOverflowException",
        "Partition tự động chia làm đôi để đủ cho 3 consumer"
      ],
      "answer": 1,
      "explain": "Quy tắc vàng của Kafka: Trong cùng một Consumer Group, mỗi Partition chỉ được gán cho TỐI ĐA MỘT Consumer. Do đó, số lượng active consumer tối đa chỉ bằng số lượng partition của topic.",
      "why": [
        "Sai — Hai consumer trong cùng 1 group không bao giờ đọc song song trên cùng 1 partition.",
        "✓ Đúng — Consumer thứ 3 đóng vai trò dự phòng nóng (Standby/Idle). Muốn tăng throughput xử lý song song, bắt buộc phải tăng số Partition của Topic.",
        "Sai — Kafka không báo lỗi, đây là hành vi thiết kế có chủ đích.",
        "Sai — Partition không tự động chia nhỏ."
      ]
    },
    {
      "level": "medium",
      "scenario": "Mô hình Service Discovery (như Eureka hoặc Kubernetes CoreDNS) đóng vai trò gì trong kiến trúc Microservices?",
      "q": "Lợi ích lớn nhất của Service Discovery là gì?",
      "options": [
        "Giúp các service tự động tìm thấy địa chỉ IP và Port động của nhau mà không cần hardcode IP tĩnh trong file cấu hình",
        "Tự động dịch mã nguồn sang ngôn ngữ khác",
        "Thay thế database",
        "Tự động deploy code lên server"
      ],
      "answer": 0,
      "explain": "Trong môi trường đám mây và container, các Pod/Instance sinh ra và mất đi liên tục với IP thay đổi. Service Discovery đăng ký và phân giải tên dịch vụ (ví dụ http://order-service) thành danh sách IP còn sống.",
      "why": [
        "✓ Đúng — Service Discovery giải quyết triệt để vấn đề Dynamic IP addressing trong hạ tầng Cloud Native.",
        "Sai — Không liên quan đến dịch mã nguồn.",
        "Sai — Không phải cơ sở dữ liệu nghiệp vụ.",
        "Sai — Deploy code là việc của CI/CD pipeline."
      ]
    },
    {
      "level": "hard",
      "scenario": "Trong giao tiếp bất đồng bộ qua Kafka, nếu một message vi phạm logic nghiệp vụ vĩnh viễn (ví dụ số tài khoản không tồn tại trong toàn bộ ngân hàng) thì hành động nào sau đây là SAI LẦM nghiêm trọng nhất?",
      "q": "Anti-pattern nguy hiểm nhất khi xử lý Poison Message là gì?",
      "options": [
        "Retry vô hạn (Infinite Retry) tại cùng một offset khiến consumer bị kẹt mãi mãi không đọc được các giao dịch hợp lệ phía sau",
        "Đẩy vào Dead Letter Topic (DLT) và ghi log chi tiết",
        "Cập nhật trạng thái đơn hàng là FAILED",
        "Bắn cảnh báo Alert đến team trực vận hành"
      ],
      "answer": 0,
      "explain": "Poison Message (Message độc hại) không bao giờ thành công dù có thử lại hàng triệu lần. Retry vô hạn sẽ block đứng toàn bộ partition (Poison Pill problem). Phải giới hạn retry (ví dụ 3 lần) rồi đẩy vào DLT.",
      "why": [
        "✓ Đúng — Retry vô hạn là anti-pattern chết người làm nghẽn toàn bộ luồng xử lý của hệ thống.",
        "Sai — Đẩy vào DLT là best practice chuẩn.",
        "Sai — Cập nhật FAILED là xử lý nghiệp vụ đúng đắn.",
        "Sai — Bắn alert là việc cần làm của hệ sinh thái Observability."
      ]
    },
    {
      "level": "medium",
      "scenario": "Để bảo mật giao tiếp giữa các Microservices nội bộ trong cụm Kubernetes (East-West traffic).",
      "q": "Công nghệ nào thường được sử dụng để tự động mã hóa lưu lượng bằng Mutual TLS (mTLS) mà không cần can thiệp sửa code ứng dụng?",
      "options": [
        "Service Mesh (ví dụ: Istio, Linkerd)",
        "Chỉ dùng HTTP thuần túy",
        "Hardcode chứng chỉ SSL vào từng file JAR",
        "Tắt kết nối mạng giữa các pod"
      ],
      "answer": 0,
      "explain": "Service Mesh (Istio với Envoy Sidecar Proxy) chặn bắt toàn bộ traffic mạng ra vào Pod và tự động thiết lập kênh truyền mã hóa mTLS hai chiều, xác thực danh tính service mà developer không phải viết 1 dòng code bảo mật nào.",
      "why": [
        "✓ Đúng — Service Mesh là giải pháp hạ tầng tối thượng quản lý mTLS, Traffic Shifting và Observability cho Microservices.",
        "Sai — HTTP thuần túy bị nghe lén (sniffing) dữ liệu nội bộ.",
        "Sai — Hardcode cert rất khó xoay vòng gia hạn chứng chỉ khi hết hạn.",
        "Sai — Tắt mạng thì các service không giao tiếp được."
      ]
    }
  ],
  "7": [
    {
      "level": "medium",
      "scenario": "Trên Kubernetes, kubelet kiểm tra tính ổn định của container thông qua các Probe định kỳ.",
      "q": "Sự khác biệt căn bản giữa Liveness Probe và Readiness Probe trong K8s là gì?",
      "options": [
        "Liveness Probe kiểm tra container còn sống không (nếu fail -> restart container); Readiness Probe kiểm tra ứng dụng đã sẵn sàng nhận traffic người dùng chưa (nếu fail -> tạm thời gỡ Pod khỏi K8s Service Load Balancer)",
        "Liveness dùng cho CPU, Readiness dùng cho RAM",
        "Hai probe này hoàn toàn giống nhau",
        "Liveness chỉ chạy lúc container vừa bật, Readiness chạy suốt đời"
      ],
      "answer": 0,
      "explain": "Liveness chết -> K8s giết container tạo mới (chữa treo luồng/deadlock). Readiness chết -> K8s ngừng đẩy traffic người dùng vào Pod (chữa quá tải tạm thời hoặc lúc khởi động chưa xong).",
      "why": [
        "✓ Đúng — Hiểu rõ Liveness vs Readiness là kiến thức sống còn để vận hành Microservices không gián đoạn (Zero Downtime) trên Kubernetes.",
        "Sai — Không phân chia theo CPU hay RAM.",
        "Sai — Mục đích và hành động khắc phục của Kubernetes hoàn toàn khác nhau.",
        "Sai — Startup Probe mới chạy lúc vừa bật; Liveness và Readiness đều thăm dò định kỳ suốt vòng đời Pod."
      ]
    },
    {
      "level": "medium",
      "scenario": "Spring Boot 2.3+ và 3.x cung cấp sẵn 2 endpoint Actuator chuyên dụng tích hợp tự nhiên với Kubernetes Probes.",
      "q": "Đường dẫn 2 endpoint Actuator đó là gì?",
      "options": [
        "/actuator/health/liveness và /actuator/health/readiness",
        "/actuator/live và /actuator/ready",
        "/healthz và /readyz",
        "/k8s/liveness và /k8s/readiness"
      ],
      "answer": 0,
      "explain": "Spring Boot kích hoạt Health Groups tự động: 'liveness' (trạng thái LivenessState: CORRECT) và 'readiness' (trạng thái ReadinessState: ACCEPTING_TRAFFIC) khi phát hiện chạy trong môi trường K8s.",
      "why": [
        "✓ Đúng — Endpoint chuẩn của Spring Boot Actuator: /actuator/health/liveness và /actuator/health/readiness.",
        "Sai — Sai quy ước đường dẫn của Spring Boot.",
        "Sai — /healthz và /readyz là quy ước của Kubernetes API server hoặc Ingress, không phải URL mặc định của Spring Boot Actuator.",
        "Sai — Đường dẫn sai."
      ]
    },
    {
      "level": "hard",
      "scenario": "Khi Pod nhận tín hiệu dừng (SIGTERM) từ Kubernetes trong quá trình Rolling Update, nếu container tắt ngay lập tức, các HTTP request đang xử lý dở sẽ bị ngắt đột ngột (Lỗi 502 Bad Gateway phía người dùng).",
      "q": "Cấu hình nào trong application.yml giúp Spring Boot hoàn thành nốt các request dở dang trước khi tắt hẳn tiến trình?",
      "options": [
        "server.shutdown: graceful kết hợp spring.lifecycle.timeout-per-shutdown-phase: 30s",
        "server.port: 0",
        "management.endpoints.enabled: false",
        "spring.main.banner-mode: off"
      ],
      "answer": 0,
      "explain": "'server.shutdown=graceful' chỉ thị cho embedded Tomcat dừng nhận request mới và chờ tối đa 30 giây để xử lý xong toàn bộ các request đang chạy ngầm trước khi shutdown JVM an toàn.",
      "why": [
        "✓ Đúng — Graceful Shutdown là cấu hình bắt buộc trên production để đảm bảo Zero-Downtime Deployment.",
        "Sai — Cổng ngẫu nhiên không giải quyết được tắt an toàn.",
        "Sai — Không liên quan đến Actuator.",
        "Sai — Tắt banner chỉ để ẩn logo Spring lúc start."
      ]
    },
    {
      "level": "medium",
      "scenario": "Để hệ thống giám sát Prometheus có thể kéo dữ liệu đo đạc (Metrics scraping) định kỳ từ ứng dụng Spring Boot 3.",
      "q": "Dependency nào của hệ sinh thái Micrometer cần được thêm vào pom.xml?",
      "options": [
        "micrometer-registry-prometheus",
        "spring-boot-starter-prometheus",
        "prometheus-client-pure",
        "micrometer-core đơn thuần"
      ],
      "answer": 0,
      "explain": "'io.micrometer:micrometer-registry-prometheus' chuyển đổi toàn bộ chỉ số Micrometer nội bộ thành định dạng văn bản chuẩn của Prometheus và mở endpoint '/actuator/prometheus'.",
      "why": [
        "✓ Đúng — micrometer-registry-prometheus là cầu nối chuẩn giữa Spring Boot Actuator và Prometheus Server.",
        "Sai — Không có starter chính thức mang tên này trong Spring Boot.",
        "Sai — Thư viện cấp thấp của Prometheus, không tận dụng được trừu tượng hóa của Micrometer.",
        "Sai — micrometer-core thiếu registry exporter cho Prometheus."
      ]
    },
    {
      "level": "hard",
      "scenario": "Trong Micrometer, lập trình viên muốn đo lường số lần một sự kiện xảy ra (ví dụ: số lượng đơn hàng thanh toán thành công). Số này chỉ tăng dần theo thời gian và không bao giờ giảm.",
      "q": "Loại Metric Type nào là phù hợp nhất?",
      "options": [
        "Counter",
        "Gauge",
        "Timer",
        "DistributionSummary"
      ],
      "answer": 0,
      "explain": "Counter là bộ đếm chỉ tăng đơn điệu (Monotonically Increasing), rất lý tưởng cho số lượng request, số lượng lỗi, số đơn hàng. Prometheus sử dụng hàm rate() hoặc increase() trên Counter.",
      "why": [
        "✓ Đúng — Counter.builder(\"orders.placed\").register(meterRegistry).increment() là chuẩn mực.",
        "Sai — Gauge dùng để đo giá trị có thể tăng hoặc giảm (ví dụ: dung lượng RAM hiện tại, số kết nối connection pool).",
        "Sai — Timer dùng để đo thời gian thực thi (Latency) kèm theo số lần gọi.",
        "Sai — DistributionSummary dùng để đo phân phối kích thước (ví dụ payload size)."
      ]
    },
    {
      "level": "medium",
      "scenario": "Khi giám sát nhiệt độ CPU hiện tại hoặc số lượng thread đang active trong thread pool (giá trị có thể tăng lên hoặc giảm xuống bất kỳ lúc nào).",
      "q": "Loại Metric Type nào trong Micrometer phải được sử dụng?",
      "options": [
        "Gauge",
        "Counter",
        "Histogram",
        "Timer"
      ],
      "answer": 0,
      "explain": "Gauge phản ánh trạng thái tức thời (Instantaneous Value) tại thời điểm đo, giá trị có thể trồi sụt linh hoạt.",
      "why": [
        "✓ Đúng — Gauge.builder(\"threads.active\", () -> pool.getActiveCount()).register(meterRegistry) là cú pháp chuẩn.",
        "Sai — Counter không cho phép giảm giá trị.",
        "Sai — Histogram đo phân phối mẫu.",
        "Sai — Timer đo thời lượng."
      ]
    },
    {
      "level": "hard",
      "scenario": "Khi tối ưu Docker Image cho ứng dụng Spring Boot chạy trên production, tính năng Layered Jars (hỗ trợ bởi Spring Boot Maven Plugin) giải quyết bài toán gì?",
      "q": "Lợi ích kỹ thuật của Layered Jars là:",
      "options": [
        "Tự động chia tách file JAR thành 4 lớp: dependencies, spring-boot-loader, snapshot-dependencies, application; giúp Docker chỉ tải lại lớp application (~ vài MB) khi có thay đổi code thay vì tải lại cả file 100MB",
        "Nén file JAR thành file .zip siêu nhỏ",
        "Mã hóa bytecode chống dịch ngược",
        "Tự động tạo cluster cho database"
      ],
      "answer": 0,
      "explain": "Lớp 'dependencies' chiếm 95% dung lượng nhưng hiếm khi thay đổi. Layered Jars tách các tầng này ra để Docker cache hoàn toàn các layer nặng, giúp tốc độ push/pull image trên CI/CD diễn ra chỉ trong 3 giây.",
      "why": [
        "✓ Đúng — Layered Jars là công nghệ đỉnh cao được Spring Boot tích hợp sâu với Docker multi-stage build.",
        "Sai — Không phải nén zip.",
        "Sai — Không mã hóa bytecode.",
        "Sai — Không liên quan đến DB cluster."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong tệp Logback (logback-spring.xml) của ứng dụng production, việc in log ra Console dưới dạng plain-text màu mè gây khó khăn cho việc thu thập và phân tích trên ELK / Loki.",
      "q": "Định dạng xuất log nào được xem là chuẩn mực bắt buộc cho Cloud Native Logging?",
      "options": [
        "Structured JSON Logging (sử dụng LogstashLogbackEncoder hoặc ECS Encoder)",
        "Plain Text không màu",
        "Ghi trực tiếp vào file Word .docx",
        "Chỉ in dấu chấm"
      ],
      "answer": 0,
      "explain": "Structured JSON Logging in ra mỗi dòng log là một JSON hoàn chỉnh chứa các trường chuẩn: timestamp, level, thread, logger, traceId, spanId, message. Logstash, Fluentd hoặc Vector có thể parse trực tiếp mà không cần viết regex phức tạp.",
      "why": [
        "✓ Đúng — Structured JSON là chuẩn công nghiệp để tập trung hóa log trên ELK Stack (Elasticsearch), Grafana Loki hoặc AWS CloudWatch.",
        "Sai — Plain text đòi hỏi viết bộ lọc regex Grok rất dễ gãy khi cấu trúc log đổi.",
        "Sai — Không ai ghi log server vào file docx.",
        "Sai — Không cung cấp thông tin điều tra lỗi."
      ]
    },
    {
      "level": "hard",
      "scenario": "Một lập trình viên muốn viết câu truy vấn PromQL trên Prometheus để cảnh báo khi tỉ lệ lỗi HTTP 5xx của ứng dụng vượt quá 5% trong vòng 5 phút qua.",
      "q": "Biểu thức PromQL nào sau đây là chính xác?",
      "options": [
        "sum(rate(http_server_requests_seconds_count{status=~\"5..\"}[5m])) / sum(rate(http_server_requests_seconds_count[5m])) > 0.05",
        "http_error_count > 5",
        "rate(5xx) = 5%",
        "SELECT count(*) FROM metrics WHERE status = 500"
      ],
      "answer": 0,
      "explain": "Hàm 'rate()[5m]' tính tốc độ tăng trưởng mỗi giây của Counter trong cửa sổ 5 phút. Chia tổng số request 5xx cho tổng toàn bộ request cho ra tỉ lệ lỗi (Error Rate) chuẩn xác.",
      "why": [
        "✓ Đúng — Biểu thức PromQL chuẩn mực trong thiết lập SLA/SLO Alertmanager cho backend service.",
        "Sai — Biểu thức thô sơ không tính theo tỉ lệ thời gian thực.",
        "Sai — Cú pháp PromQL không hỗ trợ toán tử phần trăm trực tiếp như vậy.",
        "Sai — Đây là cú pháp SQL, Prometheus sử dụng PromQL hoàn toàn khác biệt."
      ]
    },
    {
      "level": "medium",
      "scenario": "Trong Helm Chart (trình quản lý gói cho Kubernetes), file nào đóng vai trò chứa toàn bộ các biến cấu hình mặc định (như replicaCount, image.tag, port, database host) có thể ghi đè linh hoạt?",
      "q": "Tên file cấu hình biến của Helm là gì?",
      "options": [
        "values.yaml",
        "Chart.yaml",
        "deployment.yaml",
        "templates.yaml"
      ],
      "answer": 0,
      "explain": "'values.yaml' định nghĩa các tham số mặc định cho template của Helm. Khi deploy lên các môi trường khác nhau, ta có thể ghi đè qua 'helm install -f values-prod.yaml'.",
      "why": [
        "✓ Đúng — values.yaml là trung tâm quản lý cấu hình động của bất kỳ Helm Chart nào.",
        "Sai — Chart.yaml chứa metadata của chart (name, version, description).",
        "Sai — deployment.yaml là template manifest nằm trong thư mục templates/.",
        "Sai — Tên file không tồn tại theo chuẩn Helm."
      ]
    },
    {
      "level": "hard",
      "scenario": "Khi ứng dụng chạy trên Kubernetes, pod bị khởi động lại liên tục với mã lỗi 'CrashLoopBackOff'.",
      "q": "Lệnh kubectl nào sau đây giúp lập trình viên xem được log của container ở lần crash TRƯỚC ĐÓ?",
      "options": [
        "kubectl logs <pod-name> --previous",
        "kubectl describe node",
        "kubectl delete pod",
        "kubectl top pod"
      ],
      "answer": 0,
      "explain": "Cờ '--previous' (hoặc -p) ra lệnh cho Kubernetes in ra log của container instance vừa bị terminate/crash trước đó, giúp đọc được stack trace lỗi khởi động.",
      "why": [
        "✓ Đúng — 'kubectl logs -p <pod-name>' là câu thần chú điều tra lỗi CrashLoopBackOff hàng đầu của kỹ sư DevOps.",
        "Sai — describe node chỉ xem thông tin máy chủ worker, không xem được log ứng dụng.",
        "Sai — Xóa pod sẽ làm mất vết tích điều tra.",
        "Sai — top pod chỉ xem tài nguyên CPU/RAM hiện thời."
      ]
    },
    {
      "level": "medium",
      "scenario": "Để bảo vệ các thông tin bí mật (Database Password, JWT Secret Key) trong Kubernetes một cách an toàn thay vì ghi trực tiếp vào ConfigMap.",
      "q": "Resource nào của Kubernetes được thiết kế chuyên biệt cho việc lưu trữ dữ liệu nhạy cảm?",
      "options": [
        "Secret (kết hợp SealedSecrets hoặc External Secrets Operator / Vault)",
        "ConfigMap",
        "PersistentVolume",
        "Namespace"
      ],
      "answer": 0,
      "explain": "Kubernetes Secret lưu trữ dữ liệu mã hóa Base64 và có thể gắn quyền truy cập RBAC nghiêm ngặt, kết hợp với HashiCorp Vault hoặc SealedSecrets để mã hóa an toàn trên Git (GitOps).",
      "why": [
        "✓ Đúng — Secret là resource chuẩn của K8s để chứa thông tin nhạy cảm.",
        "Sai — ConfigMap chỉ dùng cho các cấu hình văn bản không nhạy cảm (plain-text).",
        "Sai — PersistentVolume dùng để mount ổ đĩa lưu trữ file/data lâu dài.",
        "Sai — Namespace là không gian phân chia tài nguyên ảo."
      ]
    },
    {
      "level": "hard",
      "scenario": "Trong pipeline CI/CD với GitHub Actions, quy trình triển khai nào sau đây tuân thủ đúng nguyên lý 'Immutable Infrastructure' (Hạ tầng bất biến)?",
      "q": "Chọn flow CI/CD chuẩn mực nhất:",
      "options": [
        "Build Docker Image gắn tag là Git Commit SHA (ví dụ: myapp:a1b2c3d) -> Push lên Registry -> Cập nhật manifest K8s với tag này -> Deploy",
        "SSH vào server -> Chạy 'git pull' -> Chạy 'mvn clean package' -> Chạy 'java -jar app.jar &'",
        "Luôn luôn dùng tag image 'latest' để deploy",
        "Sửa trực tiếp file cấu hình trên server production qua nano/vim"
      ],
      "answer": 0,
      "explain": "Gắn tag image theo Git SHA đảm bảo tính bất biến (Immutable): mỗi image tương ứng chính xác với một commit mã nguồn, cho phép truy vết và rollback tức thì trong 10 giây nếu có lỗi.",
      "why": [
        "✓ Đúng — Build một lần, test và thăng cấp (promote) image bất biến qua các môi trường là chuẩn mực DevOps quốc tế.",
        "Sai — SSH git pull trực tiếp trên server là cách làm thủ công lỗi thời, dễ sai lệch môi trường và không thể scale.",
        "Sai — Dùng tag 'latest' khiến K8s không nhận biết được thay đổi mới và không thể rollback về version cũ.",
        "Sai — Anti-pattern nguy hiểm, vi phạm nguyên tắc Configuration as Code."
      ]
    },
    {
      "level": "medium",
      "scenario": "Để phân tải lưu lượng người dùng bên ngoài Internet vào các Service nội bộ trong Kubernetes thông qua một Domain duy nhất (ví dụ: api.mycompany.com).",
      "q": "Resource nào của Kubernetes đóng vai trò là HTTP/HTTPS Reverse Proxy & Router?",
      "options": [
        "Ingress (kết hợp Ingress Controller như NGINX hoặc Traefik)",
        "NodePort",
        "ClusterIP",
        "Kube-proxy"
      ],
      "answer": 0,
      "explain": "Ingress quản lý việc định tuyến bên ngoài (External Routing) vào các Service bên trong cluster dựa trên Host header và Path, đồng thời xử lý SSL Termination tập trung.",
      "why": [
        "✓ Đúng — Ingress Controller là cửa ngõ chuẩn mực để quản lý traffic HTTP/HTTPS vào cụm Kubernetes.",
        "Sai — NodePort mở cổng thô (30000-32767) trên từng Node, khó quản lý domain và SSL.",
        "Sai — ClusterIP chỉ cho phép truy cập nội bộ bên trong cụm (Internal only).",
        "Sai — Kube-proxy là component hạ tầng xử lý iptables/IPVS trên từng node."
      ]
    },
    {
      "level": "hard",
      "scenario": "Khi cấu hình tài nguyên cho Pod trên Kubernetes, hai thông số 'requests' và 'limits' có ý nghĩa kỹ thuật khác nhau như thế nào?",
      "q": "Phát biểu nào sau đây là chính xác?",
      "options": [
        "'requests' là lượng tài nguyên tối thiểu được K8s Scheduler đảm bảo dành riêng cho Pod khi tìm Node; 'limits' là ngưỡng trần tối đa mà Pod được phép sử dụng (vượt RAM limit sẽ bị OOMKilled, vượt CPU limit sẽ bị Throttled)",
        "'requests' dùng cho CPU, 'limits' dùng cho RAM",
        "'limits' luôn phải nhỏ hơn 'requests'",
        "Hai thông số này không có tác dụng trên môi trường cloud"
      ],
      "answer": 0,
      "explain": "Requests quyết định Pod được đặt vào Node nào có đủ chỗ trống. Limits bảo vệ Node: nếu Pod vượt quá CPU limit nó bị bóp nghẹt (CPU throttle), nếu vượt quá Memory limit Linux kernel sẽ gửi OOMKilled (137) hủy Pod.",
      "why": [
        "✓ Đúng — Hiểu rõ requests vs limits là điều kiện tiên quyết để định cỡ (Sizing) và chống sập cụm Kubernetes.",
        "Sai — Cả requests và limits đều áp dụng cho cả CPU và Memory.",
        "Sai — Limits luôn phải LỚN HƠN HOẶC BẰNG Requests.",
        "Sai — Hoạt động trên mọi môi trường chạy Kubernetes (EKS, GKE, AKS, On-premise)."
      ]
    },
    {
      "level": "medium",
      "scenario": "Để tự động cấp phát và gia hạn chứng chỉ bảo mật HTTPS (Let's Encrypt SSL/TLS) cho các Ingress trong Kubernetes.",
      "q": "Công cụ Add-on mã nguồn mở nào được sử dụng phổ biến nhất?",
      "options": [
        "cert-manager",
        "OpenSSL thủ công",
        "Apache HTTPD",
        "Keytool của Java"
      ],
      "answer": 0,
      "explain": "'cert-manager' là controller tự động hóa hoàn toàn việc xin cấp mới, lưu trữ vào K8s Secret và tự gia hạn chứng chỉ TLS từ Let's Encrypt qua ACME protocol trước khi hết hạn.",
      "why": [
        "✓ Đúng — cert-manager là giải pháp tiêu chuẩn vàng cho quản lý chứng chỉ SSL tự động trong Kubernetes.",
        "Sai — Tạo thủ công sẽ khiến chứng chỉ bị hết hạn sau 90 ngày và làm gián đoạn dịch vụ.",
        "Sai — Không phải controller quản lý chứng chỉ tự động của K8s.",
        "Sai — Keytool là CLI của JDK, không tự động hóa gia hạn cert Let's Encrypt."
      ]
    },
    {
      "level": "hard",
      "scenario": "Khi ứng dụng Spring Boot sử dụng Spring Cloud Config Server để lưu trữ cấu hình tập trung trên Git. Để các microservices tự động cập nhật cấu hình mới mà KHÔNG cần restart ứng dụng.",
      "q": "Cơ chế nào được Spring Cloud cung cấp để làm mới cấu hình trong runtime?",
      "options": [
        "Gắn @RefreshScope trên các Bean và gọi endpoint POST '/actuator/refresh' (hoặc dùng Spring Cloud Bus với Kafka/RabbitMQ)",
        "Chạy lệnh git pull trên máy chủ",
        "Khởi động lại Tomcat",
        "Viết lại toàn bộ mã nguồn"
      ],
      "answer": 0,
      "explain": "Beans có '@RefreshScope' được quản lý bởi Spring Proxy đặc biệt. Khi gọi '/actuator/refresh', Spring xóa cache của Bean đó; lần gọi tiếp theo Bean sẽ được tái tạo với các giá trị cấu hình mới nhất.",
      "why": [
        "✓ Đúng — @RefreshScope kết hợp Actuator Refresh cho phép Dynamic Configuration Reload không cần restart service.",
        "Sai — git pull chỉ lấy file, không kích hoạt reload in-memory bean trong JVM.",
        "Sai — Restart trái với mục tiêu của đề bài.",
        "Sai — Không liên quan."
      ]
    },
    {
      "level": "medium",
      "scenario": "Để tự động tăng hoặc giảm số lượng Pod của một Deployment dựa trên mức độ sử dụng CPU hoặc số lượng request thực tế.",
      "q": "Resource nào của Kubernetes chịu trách nhiệm quản lý việc Auto-scaling theo chiều ngang này?",
      "options": [
        "Horizontal Pod Autoscaler (HPA)",
        "Vertical Pod Autoscaler (VPA)",
        "Cluster Autoscaler",
        "DaemonSet"
      ],
      "answer": 0,
      "explain": "HPA (Horizontal Pod Autoscaler) liên tục truy vấn Metrics Server. Khi CPU vượt ngưỡng (ví dụ > 70%), HPA sẽ tự động tăng 'replicas' từ 2 lên 5 pod để chia tải.",
      "why": [
        "✓ Đúng — HPA là công cụ cốt lõi cho tính năng co giãn đàn hồi theo chiều ngang trong Kubernetes.",
        "Sai — VPA tăng kích thước CPU/RAM của 1 pod đơn lẻ (chiều dọc), thường yêu cầu restart pod.",
        "Sai — Cluster Autoscaler tăng số lượng máy chủ vật lý (Nodes) trong cụm, không quản lý số Pod của Deployment.",
        "Sai — DaemonSet đảm bảo mỗi Node chạy đúng 1 bản copy của Pod (thường dùng cho agent log/metric)."
      ]
    },
    {
      "level": "medium",
      "scenario": "Một kỹ sư muốn kiểm tra nhanh độ trễ và khả năng chịu tải của REST API bằng cách bắn 10.000 requests đồng thời từ máy tính cá nhân.",
      "q": "Công cụ CLI kiểm thử tải (Load Testing / Benchmarking) gọn nhẹ và phổ biến nào sau đây thường được sử dụng?",
      "options": [
        "k6 hoặc Apache Bench (ab) / wrk",
        "Postman gửi từng request",
        "curl chạy vòng lặp bash",
        "Vim"
      ],
      "answer": 0,
      "explain": "k6 (viết kịch bản bằng JS), Apache Bench (ab), wrk hoặc Locust là các công cụ load testing chuyên nghiệp cho phép mô phỏng hàng ngàn kết nối đồng thời và xuất biểu đồ percentile p95, p99.",
      "why": [
        "✓ Đúng — k6 và wrk là công cụ benchmark hiệu năng tiêu chuẩn hàng đầu.",
        "Sai — Postman thủ công không tạo được tải áp lực cao (high concurrency).",
        "Sai — Vòng lặp curl chạy tuần tự, không mô phỏng được môi trường concurrent requests.",
        "Sai — Trình soạn thảo văn bản."
      ]
    },
    {
      "level": "hard",
      "scenario": "Trong kiến trúc Observability chuẩn mực gồm 3 trụ cột (Three Pillars of Observability): Metrics, Logs, Traces.",
      "q": "Sự kết hợp ăn ý của bộ ba công cụ mã nguồn mở nào sau đây tạo nên giải pháp hoàn chỉnh được các tập đoàn lớn ưa chuộng nhất?",
      "options": [
        "Prometheus (Metrics) + Grafana Loki (Logs) + Tempo / Jaeger (Traces), trực quan hóa tập trung trên Grafana Dashboard",
        "Chỉ dùng file text log4j.log",
        "Chỉ dùng bảng điều khiển Cloudflare",
        "Chỉ dùng Google Analytics"
      ],
      "answer": 0,
      "explain": "Bộ ba 'Prometheus + Loki + Tempo' (Grafana LGTM Stack) được tích hợp sâu sắc qua TraceId: từ một điểm spike trên biểu đồ Prometheus có thể bấm xem ngay log trong Loki và nhảy sang Trace span trong Tempo chỉ với 1 cú click.",
      "why": [
        "✓ Đúng — Grafana LGTM Stack (Loki, Grafana, Tempo, Mimir/Prometheus) là đỉnh cao của hệ thống giám sát Cloud Native hiện đại.",
        "Sai — File text không thể tìm kiếm và tương quan dữ liệu giữa các cụm microservices.",
        "Sai — Cloudflare chỉ ở tầng CDN/WAF biên mạng, không thấy được nội tại bên trong application.",
        "Sai — Google Analytics dùng cho hành vi người dùng web marketing, không dùng cho hạ tầng backend."
      ]
    }
  ]
};

  window.EXPANDED_QUIZZES = EXPANDED_QUIZZES;

  function injectQuizzes() {
    if (!window.COURSE_MODULES || !Array.isArray(window.COURSE_MODULES)) return;

    window.COURSE_MODULES.forEach(function(m) {
      var extra = EXPANDED_QUIZZES[m.id] || EXPANDED_QUIZZES[String(m.id)];
      if (!extra || !Array.isArray(extra)) return;

      var quiz = (m.lessons || []).find(function(l) { return l.type === "quiz"; });
      if (!quiz) return;

      quiz.questions = quiz.questions || [];
      var existingSet = new Set(quiz.questions.map(function(q) { return q.q; }));

      extra.forEach(function(item) {
        if (!existingSet.has(item.q)) {
          quiz.questions.push(item);
          existingSet.add(item.q);
        }
      });
      quiz.minutes = Math.max(quiz.minutes || 10, Math.round(quiz.questions.length * 1.5));
    });
  }

  // Run immediately and also bind to DOMContentLoaded if needed
  injectQuizzes();
  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", injectQuizzes);
  }
})();
