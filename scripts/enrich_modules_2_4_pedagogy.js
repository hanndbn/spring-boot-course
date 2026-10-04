const fs = require('fs');
const path = require('path');

function updateModule(modIndex, updater) {
  const filePath = path.join(__dirname, '..', 'course', 'js', 'content', `module${modIndex}.js`);
  const content = fs.readFileSync(filePath, 'utf8');
  const modObj = new Function(`let window = { COURSE_MODULES: [] }; ${content}; return window.COURSE_MODULES[0];`)();
  updater(modObj);
  const out = `window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n` + JSON.stringify(modObj, null, 2) + `\n);\n`;
  fs.writeFileSync(filePath, out, 'utf8');
  console.log(`Updated module${modIndex}.js successfully!`);
}

const module2Pillars = {
  "2-1-2": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tự tay viết REST Controller hoàn chỉnh cho Order & Payment bằng Spring MVC annotations.
- Làm chủ các annotation cốt lõi: @GetMapping, @PostMapping, @PathVariable, @RequestParam, @RequestBody.
- Nắm vững cách đóng gói dữ liệu phản hồi chuyên nghiệp với ResponseEntity và HTTP Status code.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BÀN TIẾP TÂN ĐA KÊNH
- @PathVariable: Giống như bạn bước vào khách sạn và bảo: "Cho tôi vào đúng phòng 302" (Định danh trực tiếp trong URL).
- @RequestParam: Giống như bạn yêu cầu: "Tìm cho tôi phòng nào có ban công và giá dưới 1 triệu" (Bộ lọc tìm kiếm).
- @RequestBody: Giống như bạn trao cho lễ tân chiếc vali hồ sơ đăng ký kinh doanh (Dữ liệu JSON lớn gửi qua HTTP Body).
:::`
  },
  "2-1-3": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nhận diện 3 sự cố sản xuất nguy hiểm: Lỗi lặp vô tận StackOverflowError do Jackson tuần tự hóa quan hệ 2 chiều, N+1 REST API, và rò rỉ dữ liệu mật.
- Hiểu rõ tại sao Entity không bao giờ được phép xuất hiện tại tầng Controller.
- Làm chủ kỹ thuật tách biệt DTO bằng Java 21 Record để bảo vệ hệ thống tuyệt đối.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CON RẮN TỰ CẮN ĐUÔI MÌNH
- Khi Order chứa danh sách OrderItems, và mỗi OrderItem lại trỏ ngược về Order:
- Jackson thư ký ngây thơ đọc: "Order này có Item A. Item A lại thuộc Order này. Order này lại có Item A...".
- Chu kỳ lặp vô tận làm bộ nhớ ngăn xếp nổ tung (StackOverflowError) và server sập ngay lập tức!
- DTO (Data Transfer Object) giống như tấm ảnh chụp một chiều: Chỉ ghi lại thông tin cần thiết, không bao giờ mang theo dây tơ hồng trỏ ngược!
:::`
  },
  "2-1-4": {
    target: `:::target 🎯 MỤC TIÊU BÀI TỔNG HỢP MILESTONE (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 2.1 thành Bản đồ Kiến trúc REST Chuẩn Doanh nghiệp.
- Nắm chắc Ma trận lựa chọn HTTP Method và HTTP Status Code cho 100% tình huống thực tế.
- Sẵn sàng bước sang Chuyên đề 2.2 về Validation và Chuẩn Quốc Tế RFC 7807 ProblemDetails.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẤM BẢN ĐỒ GIAO THÔNG QUỐC TẾ
Giao tiếp REST API giống như luật giao thông toàn cầu:
- Đèn xanh (200 OK, 201 Created): Mọi thứ thông suốt, tài nguyên đã sẵn sàng.
- Biển cấm đi ngược chiều (400 Bad Request, 422 Unprocessable): Xe đi sai làn, vi phạm quy tắc dữ liệu.
- Trạm kiểm soát an ninh (401 Unauthorized, 403 Forbidden): Chưa xuất trình giấy tờ hoặc không phận sự miễn vào.
- Xe cứu thương hú còi (500 Internal Error): Lỗi hỏng hóc từ chính động cơ xe máy chủ backend!
:::`
  },
  "2-2-2": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tự tay tạo Custom Constraint Validator (@ValidOrder) để kiểm tra các quy tắc nghiệp vụ phức tạp liên trường.
- Triển khai Global Exception Handler với @RestControllerAdvice bắt toàn bộ ngoại lệ Validation.
- Đóng gói thông điệp lỗi sang chuẩn RFC 7807 ProblemDetail kèm danh sách chi tiết các trường vi phạm.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BÁC BẢO VỆ CÓ KÍNH CHIẾU YÊU
- Những annotation cơ bản (@NotNull, @Min) giống như máy soi kim loại: Chỉ nhìn thấy vật sắc nhọn thô sơ.
- Custom Validator giống như vị giám định viên cao cấp: Có khả năng đối chiếu cùng lúc cả ngày đặt hàng, số tiền chiết khấu và hạng thành viên để phát hiện gian lận phức tạp!
:::`
  },
  "2-2-3": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nhận diện lỗi tai hại: Quên annotation @Valid trong đối tượng con lồng nhau khiến dữ liệu con bị lọt lưới.
- Khắc phục nguy cơ lộ toàn bộ Hibernate SQL Exception và mật khẩu Database ra ngoài Client.
- Xóa bỏ hoàn toàn thói quen "nuốt Exception" (empty catch block) làm mất dấu vết sự cố.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CÁI BẪY QUÊN KHÓA CỬA TẦNG HẦM
- Bạn khóa chặt cổng chính (@Valid trên OrderRequest), nhưng quên không khóa cửa kho rượu (@Valid trên List<OrderItemRequest> bên trong).
- Kẻ xấu chỉ cần lẻn vào đường hầm là có thể đưa sản phẩm có giá âm (-100,000đ) vào đơn hàng trót lọt!
- Luôn gắn @Valid trên mọi thuộc tính lồng nhau!
:::`
  },
  "2-2-4": {
    target: `:::target 🎯 MỤC TIÊU BÀI TỔNG HỢP MILESTONE (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 2.2 thành Bản đồ Xử lý Lỗi Toàn Diện RFC 7807 Enterprise.
- Nắm chắc Ma trận phân loại ngoại lệ từ tầng Controller, Service đến tầng JPA/Database.
- Sẵn sàng bước sang Chuyên đề 2.3 về MapStruct và API Contract-First.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: PHIẾU BẢO HÀNH ĐIỆN TỬ TOÀN CẦU
- RFC 7807 ProblemDetails chính là tấm phiếu bảo hành chuẩn hóa quốc tế.
- Bất kể bạn mua máy tính ở Tokyo, New York hay Hà Nội: Tấm phiếu luôn có mã lỗi, ngày giờ, số seri và quầy sửa chữa rõ ràng.
- Khách hàng và ứng dụng đối tác luôn cảm thấy yên tâm và chuyên nghiệp!
:::`
  },
  "2-3-1": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nắm chắc cơ chế sinh mã nguồn Java tại thời điểm biên dịch (Compile-time Code Generation) của MapStruct.
- So sánh hiệu năng vượt trội của MapStruct so với ModelMapper và BeanUtils dựa trên Reflection.
- Hiểu rõ triết lý Contract-First: Thiết kế hợp đồng OpenAPI trước, sinh code Controller sau.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: ROBOT IN 3D VS THẦY BÓI XEM VOI
- ModelMapper / BeanUtils (Reflection) giống như thầy bói bịt mắt sờ voi lúc nửa đêm: Mò mẫm từng trường lúc runtime, vừa chậm chạp vừa dễ vấp ngã.
- MapStruct giống như máy in 3D công nghiệp: Đọc bản vẽ lúc biên dịch javac và đúc ra class Java thuần túy chạy với tốc độ ánh sáng!
:::`
  },
  "2-3-2": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tự tay cấu hình MapStruct Mapper với Spring component model (@Mapper(componentModel = "spring")).
- Tích hợp springdoc-openapi tự động sinh tài liệu Swagger UI sống động từ mã nguồn Java.
- Cấu hình bảo mật JWT Bearer Authentication cho tài liệu Swagger để test API trực tiếp trên trình duyệt.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CUỐN CATALOG TỰ ĐỘNG CẬP NHẬT
- Mỗi khi bạn thêm một món ăn mới vào bếp: Một chú robot tự động in thêm một trang ảnh bóng bẩy vào cuốn Menu đặt trên bàn ăn (Swagger UI).
- Khách hàng chỉ cần lật menu, nhập mã thẻ và bấm thử món ngay tại chỗ mà không cần mở Postman!
:::`
  },
  "2-3-3": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nhận diện hiểm họa N+1 truy vấn ngầm khi MapStruct vô tình kích hoạt Lazy Loading của quan hệ JPA.
- Xử lý triệt để NullPointerException khi ánh xạ các trường lồng nhau với NullValuePropertyMappingStrategy.
- Khắc phục xung đột thứ tự biên dịch giữa annotation processor của Lombok và MapStruct trong Maven/Gradle.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: VÔ TÌNH ĐÁ VÀO DÂY CHUYỀN BÁO ĐỘNG
- Bạn chỉ muốn in tên đơn hàng và số tiền: Nhưng mapper ngây thơ gọi getCustomer().getAddress().getCity().
- Hibernate lập tức phát hoảng, kích hoạt 100 câu truy vấn lén lút vào bảng Customer và Address trong bóng tối!
- Hãy dùng DTO Projection hoặc cấu hình @Mapping bỏ qua các trường Lazy để chặn đứng cạm bẫy!
:::`
  },
  "2-3-4": {
    target: `:::target 🎯 MỤC TIÊU BÀI TỔNG HỢP MILESTONE (10 PHÚT)
- Tổng hợp toàn diện chiến lược chuyển đổi dữ liệu phân tầng giữa Web DTO và Database Entity.
- Nắm vững Ma trận Quyết định Công nghệ: Khi nào dùng MapStruct, khi nào dùng Spring Data DTO Projection.
- Nắm chắc 3 quy tắc sống còn khi làm việc với API Contract-First.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: KHUÔN ĐÚC BẰNG NHỰA VS GỌT THỦ CÔNG
- Cách làm thủ công (Get/Set từng trường): Giống như bạn cầm dao tự tay gọt từng con thú gỗ từ khúc gỗ thô. Vừa mỏi tay, vừa dễ gọt lẹm vào ngón tay (nhầm trường).
- MapStruct (Khuôn đúc công nghiệp): Trình biên dịch tạo sẵn một chiếc khuôn thép lúc build. Bạn chỉ cần đổ nhựa vào là ra ngay 1,000 chú gấu bông giống hệt nhau trong 1 giây, tốc độ nhanh ngang ngửa code viết tay và không bao giờ sót lỗi!
:::`
  },
  "2-4-1": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Phân tích sự sụp đổ hiệu năng của Offset Pagination khi duyệt đến các trang sâu (Deep Paging).
- Nắm vững cơ chế vận hành của Keyset Pagination (Seek Method) dựa trên B-Tree Index.
- Hiểu rõ kiến trúc tải tệp lớn quy mô lớn thông qua AWS S3 Presigned URL mà không nghẽn máy chủ.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TÌM TRANG TRONG CUỐN TỪ ĐIỂN
- Offset Pagination: Bạn muốn xem từ ở trang 500, nhưng bạn bắt buộc phải lật qua từng trang từ 1 đến 499 rồi mới đọc. Càng về cuối từ điển càng mỏi tay!
- Keyset Pagination: Bạn chỉ cần nhìn mép sách có gắn chữ 'O' và mở thẳng ra trong 1 giây. Tốc độ trang thứ 1 hay trang thứ 1,000,000 đều như nhau!
:::`
  },
  "2-4-2": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tự tay triển khai API tìm kiếm và phân trang Keyset với Spring Data JPA Specification.
- Viết endpoint sinh URL có chữ ký bảo mật AWS S3 Presigned URL cho phép Client upload file thẳng lên Cloud.
- Tích hợp StreamingResponseBody để xuất báo cáo dữ liệu lớn trực tiếp ra HTTP Socket mà không tốn Heap RAM.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: ỐNG DẪN NƯỚC TRỰC TIẾP
- Thay vì bạn phải tự tay xách từng thùng nước 50kg đi qua cửa chính phòng khách (Server RAM):
- Bạn lắp một đường ống dẫn trực tiếp từ xe bồn ngoài đường vào thẳng bể chứa trên mái nhà (S3 Bucket)!
- Phòng khách của bạn luôn khô ráo, sạch sẽ và an toàn tuyệt đối!
:::`
  },
  "2-4-3": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nhận diện 3 sự cố sập server kinh điển: OFFSET 1.000.000 làm nghẽn CPU database, Upload file lớn làm nổ RAM (OutOfMemoryError), và Connection Timeout khi xuất báo cáo.
- Cấu hình giới hạn kích thước file an toàn: spring.servlet.multipart.max-file-size.
- Đọc hiểu toàn bộ giải pháp phòng chống sập hệ thống qua Bảng phân tích chi tiết.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: LẬT TRANG SÁCH TRIỆU TRANG
- OFFSET 1,000,000: Database ngây thơ phải tự tay lật qua từng trang từ trang 1 đến trang 999,999 rồi vứt đi, chỉ để đọc đúng 10 dòng cuối cùng! Càng về sau càng chậm khủng khiếp!
- Keyset Pagination: Bạn chỉ cần nói: "Mở ngay trang có mã ID lớn hơn 1000000". Cơ sở dữ liệu nhảy vèo đến đúng trang đó trong 1 mili-giây nhờ Index!
:::`
  },
  "2-4-4": {
    target: `:::target 🎯 MỤC TIÊU BÀI TỔNG HỢP MILESTONE (10 PHÚT)
- Tổng hợp toàn diện chiến lược phân trang và truyền tải dữ liệu quy mô lớn trong Spring Boot.
- Nắm vững Ma trận Quyết định Công nghệ: Khi nào dùng OFFSET, khi nào dùng Keyset, khi nào dùng S3 Presigned URL.
- Nắm chắc các nguyên tắc vàng để xây dựng hệ thống REST API triệu người dùng ổn định.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CHIẾC KÍNH VIỄN VỌNG QUAN SÁT VŨ TRỤ
Dữ liệu lớn giống như dải ngân hà với hàng triệu vì sao:
- Bạn không thể chụp một bức ảnh bao trùm toàn bộ bầu trời đêm (Nổ tung bộ nhớ).
- Bạn dùng chiếc kính viễn vọng di động (Keyset Pagination) lia dần qua từng cụm sao.
- Khi người dùng cần tải file ảnh 5GB: Dùng chiếc phễu dẫn đường trực tiếp S3 Presigned URL, không bao giờ để dòng nước lũ chảy tràn qua phòng khách Spring Boot!
:::`
  }
};

updateModule(2, (mod) => {
  mod.lessons.forEach(l => {
    const item = module2Pillars[l.id];
    if (item) {
      if (!l.content.includes(':::target') && item.target) {
        l.content = item.target + '\n\n' + l.content;
      }
      if (!l.content.includes(':::beginner') && item.beginner) {
        if (l.content.includes(':::\n')) {
          const pos = l.content.indexOf(':::\n') + 4;
          l.content = l.content.slice(0, pos) + '\n\n' + item.beginner + '\n' + l.content.slice(pos);
        } else {
          l.content = item.beginner + '\n\n' + l.content;
        }
      }
    }
  });
});

// Module 4 Pillars
const module4Pillars = {
  "4-1-1": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nắm chắc kiến trúc nền tảng của JUnit 5: Jupiter Engine, Vintage Engine và Platform Launcher.
- Hiểu rõ cơ chế Bytecode Manipulation lúc runtime của Mockito 5 với ByteBuddy.
- Nắm vững triết lý Kiểm thử Kim tự tháp (Test Pyramid): Tại sao Unit Test phải chiếm 70% số lượng kiểm thử.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: DIỄN TẬP VÀ ĐÓNG THẾ
- Unit Test giống như buổi diễn tập của một diễn viên chính:
- Để kiểm tra xem anh ta có nhớ lời thoại không: Bạn không cần mời cả đoàn làm phim 100 người, không cần thuê trực thăng hay dựng trường quay triệu đô!
- Bạn chỉ cần một diễn viên đóng thế (Mockito Mock) đứng đọc đối đáp là đủ! Nhanh gọn trong 1 phần nghìn giây!
:::`
  },
  "4-1-2": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Viết Unit Test cho Service Layer theo chuẩn hành vi BDDMockito (given - when - then).
- Sử dụng ArgumentCaptor để bắt và kiểm tra giá trị tham số truyền vào hàm Mock.
- Khắc phục lỗi kiểm thử chạy chậm bằng cách cô lập hoàn toàn khỏi Spring Context.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: KỊCH BẢN 3 MÀN (GIVEN - WHEN - THEN)
- Màn 1 (Given - Giả sử): Trong tài khoản có 1 triệu đồng.
- Màn 2 (When - Khi): Thực hiện rút 200 nghìn đồng.
- Màn 3 (Then - Thì): Số dư phải còn đúng 800 nghìn đồng và có tin nhắn SMS báo biến động số dư.
- Cấu trúc 3 màn giúp bất kỳ ai đọc vào cũng hiểu ngay nghiệp vụ mà không cần giải thích!
:::`
  },
  "4-1-3": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nhận diện cạm bẫy Over-mocking: Mock quá nhiều khiến test case vẫn xanh nhưng code chạy thật thì sập.
- Hiểu rõ cơ chế Strict Stubs của Mockito 5: Tự động ném lỗi khi có stubbing thừa không được sử dụng.
- Phân biệt ranh giới rõ ràng giữa Mockito Mock (giả lập 100%) và Mockito Spy (bọc ngoài đối tượng thật).
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CHÚ BÙ NHÌN RƠM TRÊN ĐỒNG CỎ
- Mockito Mock giống như chú bù nhìn rơm: Bên trong rỗng tuếch, bạn bảo nó kêu tiếng chim thì nó kêu, không có nội tâm thật.
- Mockito Spy giống như một người thám tử theo dõi bạn: Bạn vẫn làm việc thật, nhưng thám tử ghi chép lại bạn đã đi đâu, gặp ai bao nhiêu lần!
:::`
  },
  "4-1-4": {
    target: `:::target 🎯 MỤC TIÊU BÀI TỔNG HỢP MILESTONE (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 4.1 thành Bản đồ Kim Tự Tháp Kiểm Thử Doanh Nghiệp.
- Nắm chắc Ma trận lựa chọn công cụ kiểm thử: JUnit 5, Mockito, AssertJ, ArchUnit.
- Sẵn sàng bước sang Chuyên đề 4.2 về Sliced Testing và Testcontainers PostgreSQL thật.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẤM PHIẾU KIỂM ĐỊNH XUẤT XƯỞNG
Trước khi một chiếc xe hơi lăn bánh ra thị trường:
- Hàng nghìn con ốc và vi mạch được kiểm tra độc lập trên bàn thí nghiệm (Unit Test).
- Cụm động cơ và hộp số được ghép nối thử nghiệm trong xưởng (Integration Test).
- Chiếc xe hoàn chỉnh được lái thử trên đường trường (End-to-End Test).
- Hệ thống phần mềm của bạn cũng cần quy trình kiểm định khắt khe tương tự!
:::`
  },
  "4-2-1": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nắm chắc khái niệm Sliced Testing trong Spring Boot: Chỉ nạp một phần ApplicationContext để tăng tốc độ chạy test.
- Phân biệt phạm vi hoạt động của @WebMvcTest (chỉ nạp Controller) và @DataJpaTest (chỉ nạp Repository).
- Hiểu rõ kiến trúc của Testcontainers: Khởi chạy Database Docker thật chuẩn CI/CD.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CẮT TỪNG LÁT BÁNH TRỌNG TÂM
- Full Context (@SpringBootTest) giống như bạn bê cả một chiếc bánh sinh nhật 5 tầng ra ăn: Rất nặng nề, khởi động mất 15 giây!
- Sliced Testing (@WebMvcTest) giống như bạn cắt đúng một lát dâu tây ở tầng trên cùng: Chỉ kiểm tra tầng Web, chạy trong 0.2 giây siêu tốc!
:::`
  },
  "4-2-2": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Triển khai Integration Test hoàn chỉnh với Testcontainers PostgreSQL thật.
- Nạp động cấu hình JDBC bằng @DynamicPropertySource từ Docker Container.
- Kỹ thuật Singleton Container Pattern: Tái sử dụng 1 Container duy nhất cho toàn bộ test suite.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: MANG CÔNG TRƯỜNG THẬT VÀO PHÒNG THÍ NGHIỆM
- Thay vì dùng cơ sở dữ liệu giả lập H2 có cú pháp sai lệch:
- Testcontainers tự động bật một cỗ máy Docker chứa đúng phiên bản PostgreSQL 16 Alpine đang chạy trên Production!
- Mọi câu lệnh SQL phức tạp, JSONB hay Transaction Lock đều được kiểm chứng với độ tin cậy 100%!
:::`
  },
  "4-2-3": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nhận diện cạm bẫy H2 In-Memory giấu nhẹm lỗi cú pháp SQL và khóa đồng thời của Production.
- Khắc phục hiện tượng Testcontainers khởi động chậm làm nghẽn pipeline CI/CD.
- Xóa bỏ lỗi @DirtiesContext gây khởi động lại Spring ApplicationContext liên tục.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẬP BƠI TRONG BỂ BƠI PHAO
- H2 In-Memory giống như bể bơi phao trẻ em: Không có sóng lớn, nước phẳng lặng. Bạn bơi rất giỏi trong bể phao (Test pass hết).
- Nhưng khi ra biển lớn sóng dữ (PostgreSQL thật): Bạn bị sóng cuốn trôi ngay vì bể phao không có dòng chảy ngầm hay thủy triều!
:::`
  },
  "4-2-4": {
    target: `:::target 🎯 MỤC TIÊU BÀI TỔNG HỢP MILESTONE (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 4.2 thành Bản đồ Sliced Testing & Testcontainers.
- Nắm chắc Ma trận đánh đổi: Khi nào dùng Sliced Test, khi nào dùng Full Integration Test.
- Sẵn sàng bước sang Chuyên đề 4.3 về Async Testing và Security Testing.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BỘ CÂN TIỂU LY VÀ BÀN CÂN XE TẢI
- Sliced Test (@WebMvcTest) là chiếc cân tiểu ly đo vàng: Cực nhanh, cực chính xác cho từng chi tiết nhỏ.
- Testcontainers là bàn cân xe tải tại trạm thu phí: Cân trọn gói cả hệ thống với độ vững chãi tuyệt đối!
:::`
  },
  "4-3-1": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nắm chắc kiến trúc kiểm thử các tác vụ bất đồng bộ (Asynchronous Tasks) trong Spring Boot.
- Làm chủ cơ chế Polling động của thư viện Awaitility thay thế cho Thread.sleep().
- Hiểu rõ cách giả lập ngữ cảnh bảo mật với @WithMockUser và @WithSecurityContext.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CHIẾC ĐÈN BÁO BẾP TỰ ĐỘNG
- Thread.sleep(5000): Giống như bạn đứng đực mặt nhìn đồng hồ bấm đúng 5 phút mới mở nồi cơm, dù cơm đã chín từ phút thứ 2! Vừa lãng phí thời gian vừa dễ cháy!
- Awaitility: Giống như chiếc nồi cơm điện thông minh có cảm biến: Cứ mỗi 100ms nó kiểm tra một lần, cơm vừa chín tới là nó nhảy nút "Tách" và thông báo ngay lập tức!
:::`
  },
  "4-3-2": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Viết bài test kiểm thử hoàn chỉnh cho Kafka Event-Driven Consumer với Awaitility.
- Kiểm thử phân quyền truy cập Method Security (@PreAuthorize) với các vai trò giả lập khác nhau.
- Đảm bảo tính ổn định tuyệt đối (Deterministic Testing) của bộ kiểm thử trên CI/CD runner.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẤM THẺ CĂN CƯỚC GIẢ CHO ĐOÀN DIỄN
- Khi cần kiểm thử xem cổng an ninh có chặn đúng người không có vé không:
- Bạn phát cho diễn viên thử nghiệm tấm thẻ: "Học viên Nguyễn Văn A - Role: USER" (@WithMockUser).
- Sau đó cho anh ta bước qua cửa để kiểm tra còi báo động có kêu đúng chuẩn không!
:::`
  },
  "4-3-3": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Khắc phục triệt để hiện tượng Flaky Test: Test chạy trên máy local thì pass nhưng đẩy lên GitHub Actions lại fail ngẫu nhiên.
- Xóa bỏ cạm bẫy rò rỉ SecurityContextHolder giữa các luồng kiểm thử chạy song song.
- Dọn dẹp sạch sẽ dữ liệu database sau mỗi test case với cơ chế Rollback tự động.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CHÚ MA TRƠN TRONG MÁY CHỦ CI/CD
- Flaky Test giống như một chú ma trơn vô hình: Hôm nay máy chủ chạy nhanh thì bài test đậu, ngày mai máy chủ bận xử lý tác vụ khác thì bài test trượt!
- Một bộ test không ổn định còn nguy hiểm hơn không có test, vì nó làm đội ngũ kỹ sư mất niềm tin vào hệ thống!
:::`
  },
  "4-3-4": {
    target: `:::target 🎯 MỤC TIÊU BÀI TỔNG HỢP MILESTONE (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 4.3 thành Bản đồ Kiểm Thử Bất Đồng Bộ & Security Context.
- Nắm chắc Ma trận đo lường độ ổn định Test Stability và checklist triệt tiêu Flaky Test.
- Sẵn sàng bước sang Chuyên đề 4.4 về Kiến Trúc Như Mã Nguồn (Architecture as Code) với ArchUnit.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CHIẾC LA BÀN CÂN BẰNG THỦY LỰC
- Bộ kiểm thử bất đồng bộ chuẩn mực giống như chiếc la bàn trên tàu biển: Dù sóng gió đại dương có lắc lư chao đảo, kim la bàn vẫn chỉ đúng hướng bắc mà không bị sai lệch một độ nào!
:::`
  },
  "4-4-1": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nắm chắc cơ chế phân tích Bytecode Java của ArchUnit mà không cần khởi động Spring Context.
- Hiểu rõ triết lý Architecture as Code (Kiến trúc như Mã nguồn): Tự động hóa kiểm tra quy chuẩn thiết kế.
- Nắm vững các quy tắc kiến trúc phổ biến: Cấm Controller gọi Repository, cấm rò rỉ gói package.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: VỊ THANH TRA KIẾN TRÚC TỰ ĐỘNG
- Thay vì Trưởng nhóm kỹ thuật phải thức trắng đêm đọc từng dòng code (Code Review thủ công) để nhắc nhở: "Em ơi Controller không được gọi thẳng DB":
- ArchUnit giống như máy quét tự động ở cổng công trình: Phát hiện bất kỳ viên gạch nào đặt sai vị trí thiết kế là báo động ngay trong 0.1 giây!
:::`
  },
  "4-4-2": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tự tay viết bộ quy tắc ArchUnit cưỡng chế Clean Architecture phân tầng nghiêm ngặt.
- Cưỡng chế quy tắc đặt tên (Naming Convention): Class kết thúc bằng 'Service' phải nằm trong package 'service'.
- Ngăn chặn triệt để hiện tượng vòng lặp phụ thuộc (Cyclic Dependency) giữa các package.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: HÀNG RÀO ĐIỆN PHÂN TẦNG
- Tầng Web nằm ở bên ngoài. Tầng Service nằm ở giữa. Tầng Domain nằm ở trong cùng.
- ArchUnit dựng lên hàng rào điện một chiều: Tầng ngoài được phép nhìn vào tầng trong, nhưng tầng trong tuyệt đối KHÔNG ĐƯỢC PHÉP biết đến sự tồn tại của tầng ngoài!
:::`
  },
  "4-4-3": {
    target: `:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nhận diện hiểm họa Code Coverage ảo: Độ phủ 100% nhưng bên trong test case không có bất kỳ câu lệnh Assert nào!
- Khắc phục lỗi cấu hình sai đường dẫn package trong ArchUnit khiến bài test bị bỏ qua trong im lặng.
- Tối ưu hóa thời gian chạy ArchUnit bằng cách lưu cache phân tích bytecode.
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CUỐN SỔ ĐIỂM DANH HÌNH THỨC
- Bạn đến lớp nhưng chỉ ngồi bấm điện thoại rồi về, không học được chữ nào. Giáo viên vẫn điểm danh bạn có mặt 100%!
- Code Coverage ảo cũng vậy: Code được chạy qua nhưng không có kiểm tra (Assert), khi có lỗi xảy ra bài test vẫn báo xanh lè lừa dối người quản lý!
:::`
  },
  "4-4-4": {
    target: `:::target 🎯 MỤC TIÊU BÀI TỔNG HỢP MILESTONE (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Module 4 thành Bản đồ Chiến lược Kiểm thử Chất lượng Toàn diện (QA Pipeline).
- Nắm chắc checklist 6 tiêu chuẩn vàng của một bộ Test Suite đạt chuẩn Senior.
- Sẵn sàng bước sang Module 5 (Bảo Mật Chuyên Sâu: Spring Security 6, Stateless JWT & Keycloak SSO).
:::`,
    beginner: `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẤM LÁ CHẮN BẤT KHẢ XÂM PHẠM
Bạn vừa xây dựng xong "Tấm lá chắn bất khả xâm phạm" cho toàn bộ hệ thống:
1. Tầng đáy: Hàng trăm Unit Tests chạy trong 1 giây với JUnit 5 & Mockito.
2. Tầng giữa: Kiểm thử Web tinh gọn với @WebMvcTest và Database thật với Testcontainers PostgreSQL.
3. Tầng bất đồng bộ: Xóa sổ Flaky Test bằng Awaitility và kiểm tra bảo mật bằng @WithMockUser.
4. Vị cảnh sát trưởng: Tự động cưỡng chế Clean Architecture bằng ArchUnit.
Mã nguồn của bạn giờ đây đã sẵn sàng đối đầu với bất kỳ đợt kiểm toán kỹ thuật nào!
:::`
  }
};

updateModule(4, (mod) => {
  mod.lessons.forEach(l => {
    const item = module4Pillars[l.id];
    if (item) {
      if (!l.content.includes(':::target') && item.target) {
        l.content = item.target + '\n\n' + l.content;
      }
      if (!l.content.includes(':::beginner') && item.beginner) {
        if (l.content.includes(':::\n')) {
          const pos = l.content.indexOf(':::\n') + 4;
          l.content = l.content.slice(0, pos) + '\n\n' + item.beginner + '\n' + l.content.slice(pos);
        } else {
          l.content = item.beginner + '\n\n' + l.content;
        }
      }
    }
  });
});
