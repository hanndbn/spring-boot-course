const fs = require("fs");
const path = require("path");

const contentDir = path.join(__dirname, "..", "course", "js", "content");

// Map of beginner explanations to inject per lesson ID
const BRIDGES = {
  // --- MODULE 0: JAVA 21 & FOUNDATION ---
  "0-1-1": `\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN CHO NGƯỜI MỚI (BEGINNER BRIDGE)
**1. JVM (Java Virtual Machine) là gì trong đời thực?**
Hãy tưởng tượng mã code bạn viết (\`.java\`) là một **bản vẽ thiết kế ngôi nhà bằng tiếng Việt**.
- Nếu bạn mang bản vẽ này sang thợ xây chỉ nói tiếng Anh (Windows x64) hay thợ xây chỉ nói tiếng Nhật (macOS Apple Silicon M1/M2/M3), máy tính sẽ hoàn toàn không hiểu gì cả!
- **JVM giống như một vị Kiến trúc sư trưởng thông dịch viên**: Trình biên dịch \`javac\` dịch bản vẽ sang ngôn ngữ tiêu chuẩn quốc tế (**Bytecode \`.class\`**). Mỗi hệ điều hành sẽ cài đặt một JVM riêng phù hợp với nó, và JVM sẽ chỉ đạo phần cứng máy tính thi công chính xác từng viên gạch. Đó là lý do Java có triết lý nổi tiếng: *"Viết một lần, chạy khắp mọi nơi"* (Write Once, Run Anywhere)!

**2. JIT Compiler vs Interpreter là gì?**
- **Interpreter (Thông dịch viên nói đuổi)**: Đọc từng câu lệnh bytecode và dịch ngay cho CPU thực thi. Ưu điểm: Bắt đầu chạy ngay lập tức (khởi động cực nhanh). Nhược điểm: Nếu một đoạn code tính tiền lặp lại 1,000,000 lần, nó lại phải cặm cụi dịch lại 1,000,000 lần từ đầu (rất chậm).
- **JIT Compiler (Kỹ sư dịch máy tự động)**: Theo dõi xem đoạn mã nào chạy nhiều nhất ("Hotspot"), sau đó dịch thẳng đoạn đó ra mã máy nhị phân siêu tốc (Native Machine Code). Kể từ lần thứ hai trở đi, CPU chạy với tốc độ ánh sáng!

**3. Garbage Collector (GC - Đội dọn vệ sinh tự động):**
Trong các ngôn ngữ như C/C++, bạn xin cấp phát bộ nhớ thì khi dùng xong bạn phải tự nhớ để giải phóng (nếu quên sẽ làm tràn RAM máy chủ). Trong Java, **GC giống như đội ngũ dọn vệ sinh thông minh**: Bất kỳ object nào không còn được ai sử dụng nữa sẽ được GC tự động dọn dẹp và trả lại RAM sạch sẽ cho máy chủ.
:::\n`,

  "0-2-1": `\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BĂNG CHUYỀN STREAM API & LAMBDA
**1. Stream API khác gì với List/Array truyền thống?**
- **List/Array (Mâm cơm dọn sẵn)**: Giống như bạn dọn sẵn toàn bộ 100 món ăn lên bàn cùng một lúc. Rất tốn chỗ bày biện (tốn bộ nhớ Heap RAM).
- **Stream API (Băng chuyền thức ăn tự động)**: Thức ăn chỉ trôi qua từng người một. Bạn đặt các trạm xử lý:
  - \`.filter()\`: Giống trạm kiểm tra chất lượng (chỉ cho đĩa tươi ngon đi tiếp).
  - \`.map()\`: Giống trạm chế biến (rưới thêm sốt hoặc đổi sang đĩa mới).
  - **Đặc biệt (Lazy Evaluation - Lười biếng thông minh)**: Dù bạn có xếp 10 trạm \`filter\`, \`map\` trên băng chuyền thì băng chuyền VẪN CHƯA HỀ CHẠY! Chỉ khi nào thực khách ở cuối bàn bấm nút gọi món (\`.collect()\` hoặc \`.findFirst()\`), băng chuyền mới bắt đầu lăn bánh và các phần tử mới được kéo qua đúng 1 lần duy nhất!

**2. Lambda Expression là gì?**
Trước đây trong Java cũ, nếu bạn muốn nhờ ai đó giặt quần áo, bạn phải thuê một người giúp việc có đầy đủ chứng minh nhân dân, hợp đồng lao động, tên tuổi (tạo Anonymous Class \`new Runnable() { public void run() { ... } }\` tốn 6 dòng code cồng kềnh).
Với **Lambda**, bạn chỉ cần để lại một mẩu giấy ghi nhớ: \`quần_áo -> giặt(quần_áo)\`. Không cần thủ tục rườm rà, ngắn gọn, súc tích và máy tính hiểu ngay lập tức!
:::\n`,

  "0-3-1": `\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẠI SAO PHẢI CẦN JAVA RECORD?
**1. Class thường vs Record trong đời thực:**
- **Class thường (Chiếc hộp mở nắp)**: Bạn tạo một object \`User\`, nhưng ai cũng có thể thò tay vào gọi \`.setName("Hacked")\`, \`.setRole("ADMIN")\` làm thay đổi trạng thái lung tung. Để an toàn, bạn phải tự viết tay hàng chục hàm Getter, Setter, Equals, HashCode, ToString (hoặc cài Lombok).
- **Record (Chiếc phong bì niêm phong đóng dấu sáp)**: Một khi bạn đã bỏ thư vào và đóng dấu gửi đi, bức thư trở thành **Bất biến (Immutable)**. Không ai có quyền sửa nội dung trên đường vận chuyển. Chỉ với đúng 1 dòng: \`public record UserDto(String name, String email) {}\`, Java tự động tạo sẵn toàn bộ hàm đọc dữ liệu an toàn, chống bị can thiệp trái phép!

**2. Sealed Class/Interface là gì?**
Hãy tưởng tượng công ty bạn có đúng 3 hình thức thanh toán: *Tiền mặt*, *Chuyển khoản*, và *Ví điện tử*.
- Trong Java cũ: Ai đó vô tình tạo thêm một class thứ 4 tên là *Trả góp bằng sao hỏa* mà bạn không hề hay biết, dẫn đến khi chạy app bị lỗi bất thình lình.
- Với từ khóa **\`sealed\`**: Bạn khóa cứng danh sách: *"Chỉ đúng 3 hình thức này được phép tồn tại"*. Nhờ đó, trình biên dịch (Compiler) sẽ canh chừng cho bạn 100%, nếu trong code bạn quên xử lý 1 trong 3 trường hợp, app sẽ nhắc nhở ngay lập tức!
:::\n`,

  // --- MODULE 1: SPRING CORE & BOOT CĂN BẢN ---
  "1-1-1": `\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: INVERSION OF CONTROL (IoC) & DEPENDENCY INJECTION (DI)
**1. Cuộc sống KHÔNG CÓ IoC (Cách làm cũ):**
Bạn muốn lái xe máy đi làm. Bạn phải:
- Tự tay đi đúc khung sắt (\`new Frame()\`)
- Tự chế tạo động cơ xăng (\`new Engine()\`)
- Tự bơm bánh xe và tự lắp ráp mọi thứ (\`new Motorbike(engine, frame)\`).
=> Hậu quả: Nếu ngày mai bạn muốn đổi sang xe điện, bạn phải vứt bỏ toàn bộ và chế tạo lại từ đầu! Đây gọi là **Tight Coupling (Gắn kết quá chặt)**.

**2. Cuộc sống CÓ IoC & DI (Cách làm của Spring Boot):**
Bạn chỉ cần bước ra cửa và mở app Grab/Be: *"Tôi cần một chuyến xe đến công ty"* (Khai báo dependency \`@Autowired private TransportService transport\`).
- **Spring IoC Container** giống như **Tổng đài gọi xe thông minh**: Nó đã chuẩn bị sẵn xe máy, xe hơi, bảo dưỡng động cơ và cử tài xế đến tận cửa đón bạn.
- Bạn **không cần biết chiếc xe được chế tạo thế nào**, bạn chỉ việc lên xe đi làm (tập trung 100% vào logic nghiệp vụ). Quyền điều khiển việc tạo đối tượng đã được "đảo ngược" (Inversion of Control) từ tay bạn sang tay tổng đài Spring!

**3. Spring Bean là gì?**
Một Object Java bình thường bạn tự \`new\` là "Người làm nghề tự do (Freelancer)": bạn tự gọi đến và bạn phải tự lo việc dọn dẹp.
Còn **Spring Bean** là "Nhân viên chính thức của công ty Spring": Được quản gia Spring sinh ra, nuôi dưỡng, tiêm các công cụ làm việc vào người, và quản lý suốt đời cho đến khi tắt ứng dụng.
:::\n`,

  "1-1-2": `\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BEAN SCOPE TRONG ĐỜI THỰC
**1. Singleton Scope (Mặc định trong 99% Spring Boot):**
Giống như **Chiếc quạt trần trong phòng học**:
- Dù trong lớp có 1 học sinh hay 40 học sinh (tương ứng với 40 request đồng thời), tất cả đều dùng chung đúng **1 chiếc quạt trần duy nhất**.
- Tiết kiệm tiền điện và không gian (tiết kiệm bộ nhớ RAM tối đa). Vì vậy các Service, Repository đều là Singleton và không được lưu trạng thái riêng của từng khách hàng vào biến toàn cục!

**2. Prototype Scope:**
Giống như **Chiếc ly giấy uống cà phê mang đi (Take-away)**:
- Mỗi khi có khách hàng bước vào yêu cầu (\`getBean()\`), nhân viên lại rút một chiếc ly mới tinh ra phục vụ. Khách uống xong tự vứt đi, không ai dùng chung ly với ai!
:::\n`,

  "1-1-3": `\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CIRCULAR DEPENDENCY LÀ GÌ?
**Nghịch lý "Con gà và quả trứng - Ai có trước?":**
- Service A nói: *"Tôi cần Service B thì tôi mới khởi động được!"*
- Service B lại nói: *"Tôi cũng cần Service A thì tôi mới khởi động được!"*
=> Kết quả: Cả 2 đứng nhìn nhau chờ đợi vô tận, và quản gia Spring lập tức giơ cờ đỏ báo lỗi và dập tắt ứng dụng ngay lúc khởi động (\`BeanCurrentlyInCreationException\`).
- **Cách giải quyết thông minh**: Dùng **Chim bồ câu đưa thư (ApplicationEvent)**: Khi A làm xong việc thì thả chim bồ câu bay đi (\`publishEvent\`). B nhìn thấy chim bồ câu thì tự động làm việc của mình (\`@EventListener\`) mà A và B không cần biết mặt nhau!
:::\n`,

  "1-2-1": `\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: AUTO-CONFIGURATION LÀ GÌ?
**1. Thời đại Spring Framework cũ (Căn nhà thô không có gì):**
Bạn nhận một căn nhà thô trống hoác. Bạn phải tự mua dây điện về đi, tự lắp từng bóng đèn, tự gắn công tơ nước, tự viết hàng trăm dòng cấu hình XML mệt mỏi.

**2. Thời đại Spring Boot (Căn hộ Smart-Home Full Nội Thất):**
Khi bạn bước vào nhà:
- Thấy trời tối -> Cảm biến tự bật đèn (\`@ConditionalOnClass\`).
- Thấy bạn chưa mang máy lạnh riêng -> Căn nhà tự bật máy lạnh sẵn có (\`@ConditionalOnMissingBean\`).
- Nếu bạn tự mang máy lạnh xịn của bạn vào cắm điện -> Căn nhà tự động tắt máy lạnh mặc định và nhường chỗ cho máy của bạn!
=> Đó chính là Auto-Configuration: Mọi thứ tự động sẵn sàng theo các quy ước thông minh, giúp bạn code ngay sản phẩm trong 5 phút!
:::\n`,

  "1-3-1": `\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: SPRING AOP (LẬP TRÌNH HƯỚNG KHÍA CẠNH)
**Cửa an ninh sân bay kiểm tra hành khách:**
Hãy tưởng tượng hành khách lên máy bay là **hàm xử lý thanh toán tiền**.
- Nếu không có AOP: Trong hàm thanh toán tiền, bạn phải tự viết code: kiểm tra vé (Bảo mật Security), cân hành lý (Validation), ghi sổ nhật ký (Logging), và chốt cửa (Transaction). Hàm thanh toán tiền biến thành một đống hỗn độn!
- **Với Spring AOP**: Hàm thanh toán tiền chỉ lo duy nhất việc trừ tiền. Spring dựng một **Cổng kiểm soát an ninh (Aspect/Proxy)** đứng chặn ngay trước cửa:
  - Trước khi vào: Cổng an ninh kiểm tra token đăng nhập (\`@Secured\`).
  - Lúc bắt đầu: Mở phiên ghi sổ kế toán (\`@Transactional\`).
  - Nếu có sự cố bom mìn (Exception): Kích hoạt còi báo động và đảo ngược giao dịch (Rollback).
Mã nguồn nghiệp vụ của bạn hoàn toàn sạch sẽ, không bị vấy bẩn bởi các logic phụ trợ!
:::\n`,

  // --- MODULE 2: REST API CHUYÊN NGHIỆP ---
  "2-1-1": `\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: REST API & NHÀ HÀNG GỌI MÓN
Hãy tưởng tượng việc Client (App điện thoại/Web) giao tiếp với Server Spring Boot giống như bạn đi ăn tại nhà hàng:
- **URL (Tài nguyên / Danh từ)**: Giống như tên món ăn trên thực đơn, ví dụ \`/api/v1/orders\` (Danh sách đơn hàng), \`/api/v1/products/42\` (Sản phẩm số 42). Luôn dùng **danh từ số nhiều**, tuyệt đối không đặt tên là \`/api/v1/getOrders\` hay \`/api/v1/deleteProduct\`!
- **HTTP Method (Động từ hành động)**:
  - \`GET\`: "Cho tôi xem món này" (Chỉ đọc, không làm thay đổi dữ liệu).
  - \`POST\`: "Cho tôi đặt một món mới" (Tạo mới tài nguyên).
  - \`PUT\`: "Đổi toàn bộ món này sang món khác" (Cập nhật toàn bộ).
  - \`PATCH\`: "Cho tôi xin thêm ít tương ớt vào món này" (Cập nhật một phần).
  - \`DELETE\`: "Hủy món này giúp tôi" (Xóa tài nguyên).
- **HTTP Status Code (Phản hồi từ bồi bàn)**:
  - \`200 OK\`: "Món ăn của bạn đây, chúc ngon miệng!"
  - \`201 Created\`: "Đã tạo xong đơn hàng mới thành công!"
  - \`400 Bad Request\`: "Quý khách gọi món không hợp lệ (thiếu số lượng hoặc sai định dạng)!"
  - \`401 Unauthorized\`: "Xin lỗi, quý khách chưa đăng nhập/chưa xuất trình thẻ hội viên!"
  - \`403 Forbidden\`: "Quý khách là khách thường, khu vực này chỉ dành cho VIP (thiếu quyền Admin)!"
  - \`404 Not Found\`: "Món này không có trong thực đơn (không tìm thấy ID)!"
  - \`500 Internal Server Error\`: "Bếp nhà hàng bị chập điện (Server bị crash/lỗi code unhandled)!"
:::\n`,

  "2-1-2": `\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẠI SAO PHẢI CẦN DTO?
**Bảo vệ bí mật và che giấu thông tin:**
- **Entity trong Database**: Giống như **Chứng minh thư nhân dân và Hồ sơ y tế đầy đủ** của bạn (chứa cả mật khẩu mã hóa, số căn cước, lịch sử giao dịch nhạy cảm, số dư tài khoản).
- Nếu bạn trả thẳng Entity ra ngoài giao diện web, bất kỳ ai dùng F12 inspect cũng có thể xem trộm các thông tin bí mật này!
- **DTO (Data Transfer Object)**: Giống như một **Tấm thẻ tên học viên mang trên ngực**: Nó chỉ chứa đúng 2 thông tin công khai: \`Họ tên\` và \`Ảnh đại diện\`. Những bí mật riêng tư đều được giấu kín bên trong hậu trường.
:::\n`,

  "2-3-1": `\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỔNG ĐÀI XỬ LÝ SỰ CỐ TẬP TRUNG
Trong các dự án nghiệp dư, lập trình viên thường viết \`try-catch\` ở khắp mọi Controller. Nếu có 100 Controller thì có 100 khối \`try-catch\` giống hệt nhau, và khi có lỗi thì trả về trang báo lỗi màu trắng xoá ghê rợn của Tomcat (Whitelabel Error Page).

**\`@RestControllerAdvice\` giống như Tổng đài chăm sóc khách hàng 24/7:**
- Mọi Controller chỉ cần tập trung làm việc chuyên môn. Nếu có bất kỳ sự cố gì xảy ra (hết hàng trong kho, sai mật khẩu, mất mạng database), nó cứ thoải mái ném lỗi ra (\`throw new ProductNotFoundException()\`).
- Tổng đài viên \`@RestControllerAdvice\` đứng chờ sẵn ở cửa ra, đón lấy mọi ngoại lệ, gói nó thành một định dạng JSON lịch sự, chuyên nghiệp theo chuẩn RFC 7807 (Problem Details) và gửi về cho người dùng một cách thân thiện nhất!
:::\n`,

  // --- MODULE 3: DATA ACCESS & JPA ---
  "3-1-1": `\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: JPA & HIBERNATE LÀ GÌ?
**Sự bất đồng ngôn ngữ giữa 2 thế giới:**
- **Thế giới lập trình Java**: Chúng ta tư duy bằng **Đối tượng (Object-Oriented)**: Có tính kế thừa, danh sách liên kết \`order.getItems()\`, kiểu dữ liệu phong phú.
- **Thế giới Cơ sở dữ liệu (RDBMS - PostgreSQL/MySQL)**: Chỉ tư duy bằng **Bảng phẳng (Tables)** gồm các hàng và cột (Rows & Columns), khóa ngoại (Foreign Keys).
- **JPA & Hibernate đóng vai trò Thông dịch viên cấp cao**: Bạn chỉ cần làm việc với các Class Java quen thuộc, Hibernate sẽ tự động dịch các thao tác đó thành các câu lệnh SQL chuẩn chỉnh gửi xuống ổ cứng mà bạn không phải cặm cụi nối từng chuỗi \`SELECT * FROM...\` bằng tay!
:::\n`,

  "3-1-2": `\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BÀN LÀM VIỆC CỦA THƯ KÝ HIBERNATE
**Persistence Context (Bộ nhớ đệm cấp 1):**
Hãy tưởng tượng Hibernate là một người thư ký mẫn cán có một **Bàn làm việc (Persistence Context)** đặt ngay cạnh chiếc **Két sắt (Database)**.
1. **Transient (Mới toanh)**: Bạn vừa cầm tờ giấy nháp viết vẽ (\`new User()\`). Tờ giấy chưa nằm trên bàn thư ký và két sắt chưa hề hay biết.
2. **Managed (Đang quản lý trên bàn)**: Thư ký cầm tờ giấy đặt lên bàn (\`entityManager.persist(user)\`). Kể từ lúc này, mọi vết mực bạn sửa trên tờ giấy (\`user.setName("Đức")\`), người thư ký đều âm thầm theo dõi (**Dirty Checking**). Cuối giờ khi chốt ca (\`commit transaction\`), thư ký sẽ tự động mở két sắt ra và ghi đúng những chỗ bạn đã sửa vào sổ cái mà bạn không cần gọi lệnh \`save()\`!
3. **Detached (Rời khỏi bàn)**: Phiên làm việc kết thúc, tờ giấy bị cất vào ngăn tủ tạm. Mọi sửa đổi sau đó thư ký không còn theo dõi nữa.
:::\n`,

  "3-3-1": `\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CẠM BẪY N+1 QUERY TRONG ĐỜI THỰC
**Nỗi ám ảnh của người giao hàng:**
Bạn nhờ shipper đi siêu thị mua nguyên liệu cho 10 đơn lẩu hải sản:
- **Cách ngớ ngẩn (Bẫy N+1 Query)**:
  - 1 chuyến đi lấy danh sách 10 đơn lẩu (\`SELECT * FROM orders\` -> 1 query).
  - Sau đó, với mỗi đơn, bạn bắt shipper: Đi mua tôm cho đơn 1 rồi chạy về nhà... Lại đi mua tôm cho đơn 2 rồi chạy về nhà... Lặp lại 10 lần (\`SELECT * FROM items WHERE order_id = ?\` -> 10 queries nữa!).
  => Tổng cộng: **1 + 10 = 11 chuyến xe**! Nếu có 10,000 đơn hàng, máy chủ sẽ bắn 10,001 câu lệnh SQL xuống database làm nghẽn toàn bộ đường truyền và sập hệ thống!
- **Cách thông minh (JOIN FETCH / EntityGraph)**:
  Shipper cầm một chiếc xe tải lớn, ghé siêu thị bốc toàn bộ 10 đơn lẩu kèm đầy đủ tôm cá trong **đúng 1 chuyến xe duy nhất** (\`JOIN FETCH o.items\`) mang về!
:::\n`
};

// Process each module file
["module0", "module1", "module2", "module3"].forEach(modName => {
  const filePath = path.join(contentDir, modName + ".js");
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }

  // Load module by executing in isolated context
  const mockWindow = { COURSE_MODULES: [] };
  const rawCode = fs.readFileSync(filePath, "utf8");
  new Function("window", rawCode)(mockWindow);

  if (mockWindow.COURSE_MODULES.length === 0) {
    console.error(`Failed to load module from ${modName}.js`);
    return;
  }

  const mod = mockWindow.COURSE_MODULES[0];
  let enrichedCount = 0;

  (mod.lessons || []).forEach(lesson => {
    if (BRIDGES[lesson.id]) {
      const bridge = BRIDGES[lesson.id];
      // Check if already injected
      if (lesson.content.includes("GÓC GIẢI THÍCH TRỰC QUAN")) {
        console.log(`[SKIP] Lesson ${lesson.id} already has beginner bridge.`);
        return;
      }
      
      // Inject after the first Mermaid block if present, or at the start
      if (lesson.content.includes("```\n")) {
        const parts = lesson.content.split("```\n");
        // parts[0] is everything before closing ```, parts[1] is after
        if (parts.length >= 2) {
          lesson.content = parts[0] + "```\n" + bridge + parts.slice(1).join("```\n");
          enrichedCount++;
          console.log(`[ENRICHED] Injected bridge into ${lesson.id} (after Mermaid diagram)`);
          return;
        }
      }

      // Default prepend
      lesson.content = bridge + "\n" + lesson.content;
      enrichedCount++;
      console.log(`[ENRICHED] Injected bridge into ${lesson.id} (at start)`);
    }
  });

  if (enrichedCount > 0) {
    const formatted = `/* MODULE ${mod.id} — ${mod.title} (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n${JSON.stringify(mod, null, 2)}\n);\n`;
    fs.writeFileSync(filePath, formatted, "utf8");
    console.log(`=> Successfully updated ${modName}.js (${enrichedCount} lessons enriched)\n`);
  } else {
    console.log(`=> No updates needed for ${modName}.js\n`);
  }
});

console.log("Pedagogical enrichment completed!");
