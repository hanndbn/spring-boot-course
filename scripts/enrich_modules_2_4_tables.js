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

// Module 2
updateModule(2, (mod) => {
  // 2-3-2
  const l232 = mod.lessons.find(x => x.id === '2-3-2');
  if (l232 && (!l232.content.includes('|') || !l232.content.includes('---'))) {
    l232.content += `\n\n### Bảng Phân Tích Cú Pháp Annotation OpenAPI 3.0 & MapStruct:

| Dòng code / Thành phần | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động |
|---|---|---|---|
| \`@Mapper(componentModel = "spring")\` | MapStruct Meta | Khai báo Mapper và đăng ký làm Spring Bean | Trình biên dịch \`javac\` tự sinh class implementation và đánh dấu \`@Component\` |
| \`@Mapping(target = "orderId", source = "id")\` | Field Mapping | Ánh xạ thuộc tính \`id\` sang \`orderId\` | Tự động sinh code gán: \`dto.setOrderId(entity.getId())\` |
| \`@Tag(name = "Order Controller")\` | OpenAPI Doc | Phân nhóm tài liệu API theo cụm nghiệp vụ trên Swagger UI | Gom nhóm toàn bộ endpoint đặt hàng vào cùng 1 danh mục trực quan |
| \`@Operation(summary = "...")\` | OpenAPI Doc | Mô tả tóm tắt chức năng và kết quả trả về của API | Swagger UI hiển thị thông tin này kèm hướng dẫn tham số chi tiết |
`;
  }

  // 2-4-2
  const l242 = mod.lessons.find(x => x.id === '2-4-2');
  if (l242 && (!l242.content.includes('|') || !l242.content.includes('---'))) {
    l242.content += `\n\n### Bảng Phân Tích Kỹ Thuật Keyset Pagination & Presigned URL:

| Thành phần / Dòng code | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động |
|---|---|---|---|
| \`WHERE id > :lastId ORDER BY id ASC\` | Keyset Seek Clause | Dùng B-Tree Index để nhảy thẳng đến vị trí bản ghi kế tiếp | Loại bỏ hoàn toàn chi phí quét dữ liệu cũ, thời gian thực thi ổn định < 5ms |
| \`s3Client.generatePresignedUrl(...)\` | AWS SDK Presigned | Tạo đường link tạm thời kèm chữ ký số HMAC-SHA256 | Cho phép Client upload trực tiếp lên S3 bucket trong thời hạn 15 phút |
| \`StreamingResponseBody\` | Spring Async Streaming | Kênh truyền dữ liệu dạng luồng nhị phân trực tiếp | Ghi từng chunk dữ liệu ra HTTP Response OutputStream mà không tích lũy trong RAM |
`;
  }

  // 2-4-3
  const l243 = mod.lessons.find(x => x.id === '2-4-3');
  if (l243 && (!l243.content.includes('|') || !l243.content.includes('---'))) {
    l243.content += `\n\n### Bảng So Sánh Các Sự Cố REST & Giải Pháp Khắc Phục:

| Sự cố sản xuất | Triệu chứng kỹ thuật | Nguyên nhân gốc rễ | Giải pháp chuẩn Senior |
|---|---|---|---|
| **OFFSET Scan Bão Táp** | CPU Database vọt 100%, treo kết nối pool HikariCP | Database phải đọc và hủy bỏ hàng triệu bản ghi trước đó | Khóa trần \`page <= 100\`, chuyển sang Keyset Seek (\`WHERE id > :lastId\`) |
| **Tràn Heap MultipartFile** | JVM sập đột ngột với \`java.lang.OutOfMemoryError\` | Mặc định Spring Boot đệm toàn bộ file vào bộ nhớ RAM | Giới hạn dung lượng và cấu hình \`file-size-threshold\` đệm ra đĩa cứng |
| **Treo Connection Timeout** | Xuất báo cáo 100.000 dòng làm nghẽn kết nối HTTP | Thu thập toàn bộ dữ liệu vào List trước khi gửi về | Sử dụng \`StreamingResponseBody\` để stream từng dòng trực tiếp ra Socket |
`;
  }
});

// Module 4
updateModule(4, (mod) => {
  // 4-2-2
  const l422 = mod.lessons.find(x => x.id === '4-2-2');
  if (l422 && (!l422.content.includes('|') || !l422.content.includes('---'))) {
    l422.content += `\n\n### Bảng Phân Tích Cú Pháp Testcontainers PostgreSQL:

| Dòng code / Annotation | Cú pháp kỹ thuật | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động môi trường |
|---|---|---|---|
| \`@Container static PostgreSQLContainer<?>\` | Testcontainers JUnit 5 | Khởi chạy Docker container chứa PostgreSQL thật | Docker tự kéo image postgres:16-alpine và cấp phát ngẫu nhiên cổng port |
| \`@DynamicPropertySource\` | Spring Boot Test Engine | Ghi đè động các thuộc tính \`spring.datasource.*\` | Nạp URL JDBC, username và password từ container thật vào ApplicationContext |
| \`@SpringBootTest(webEnvironment = RANDOM_PORT)\` | Full Integration Test | Khởi động toàn bộ Spring Context với cổng HTTP ngẫu nhiên | Đảm bảo không đụng độ cổng khi chạy đồng thời nhiều test suite trên CI/CD |
`;
  }

  // 4-2-3
  const l423 = mod.lessons.find(x => x.id === '4-2-3');
  if (l423 && (!l423.content.includes('|') || !l423.content.includes('---'))) {
    l423.content += `\n\n### Ma Trận So Sánh: In-Memory H2 vs Testcontainers PostgreSQL Thật:

| Tiêu chuẩn kỹ thuật | Database H2 In-Memory | Testcontainers PostgreSQL Thật |
|---|---|---|
| **Độ tin cậy** | ❌ Thấp (H2 bỏ qua cú pháp JSONB, Fulltext Search, Lock) | ⭐⭐⭐ Tuyệt đối (Chính là database chạy trên Production) |
| **Tốc độ khởi động** | Rất nhanh (< 100ms) | Chậm hơn (1-3 giây cho lần pull đầu tiên) |
| **Chi phí hạ tầng** | Không cần Docker daemon | Yêu cầu Docker daemon hoạt động trên máy dev và CI runner |
| **Phát hiện bug ngầm** | Không phát hiện được lỗi xung đột trigger, hàm native SQL | Phát hiện 100% lỗi migration Flyway và cú pháp dialect |
`;
  }

  // 4-3-2
  const l432 = mod.lessons.find(x => x.id === '4-3-2');
  if (l432 && (!l432.content.includes('|') || !l432.content.includes('---'))) {
    l432.content += `\n\n### Bảng Phân Tích Kỹ Thuật Kiểm Thử Bất Đồng Bộ Với Awaitility:

| Lệnh / Cú pháp | Tham số thiết lập | Ý nghĩa kỹ thuật | Cơ chế hoạt động ngầm |
|---|---|---|---|
| \`await().atMost(Duration.ofSeconds(5))\` | Timeout tối đa 5 giây | Giới hạn thời gian tối đa chờ điều kiện thỏa mãn | Nếu quá 5s chưa thỏa, ném ConditionTimeoutException thông báo lỗi |
| \`.pollInterval(Duration.ofMillis(100))\` | Chu kỳ thăm dò 100ms | Tần suất kiểm tra lại điều kiện trong lúc chờ | Không khóa cứng CPU, poll định kỳ mỗi 100ms để kiểm tra kết quả |
| \`.untilAsserted(() -> ...)\` | Assertion Supplier | Đưa lambda assertion của AssertJ / JUnit vào | Lặp lại kiểm tra cho đến khi không còn AssertionFailedError văng ra |
`;
  }

  // 4-3-3
  const l433 = mod.lessons.find(x => x.id === '4-3-3');
  if (l433 && (!l433.content.includes('|') || !l433.content.includes('---'))) {
    l433.content += `\n\n### Bảng So Sánh Nguyên Nhân & Giải Pháp Triệt Tiêu Flaky Test:

| Nguyên nhân Flaky Test | Hậu quả thực tế | Cách giải quyết sai lầm | Giải pháp chuẩn Senior |
|---|---|---|---|
| **Thread.sleep(2000)** | CI chạy máy chậm bị timeout, máy nhanh lãng phí thời gian | Tăng sleep lên 5000ms làm test suite chạy hàng tiếng đồng hồ | Dùng \`Awaitility.await().untilAsserted()\` với polling động |
| **Rò rỉ SecurityContext** | Quyền của test case trước làm sai lệch test case sau | Tắt Spring Security trong lúc chạy test | Dùng \`@WithMockUser\` bọc ngoài từng phương thức test độc lập |
| **Dữ liệu database sót lại** | Test sau đọc trúng dữ liệu của test trước | Xóa tay từng bảng bằng JDBC thô | Bọc test case trong \`@Transactional\` để tự rollback khi kết thúc |
`;
  }
});
