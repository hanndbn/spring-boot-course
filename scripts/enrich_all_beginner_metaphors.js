const fs = require("fs");
const path = require("path");

const contentDir = path.join(__dirname, "..", "course", "js", "content");

const metaphors = {
  "2-3-4": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: KHUÔN ĐÚC BẰNG NHỰA VS GỌT THỦ CÔNG
- **Cách làm thủ công (Get/Set từng trường)**: Giống như việc bạn cầm dao tự tay gọt từng con thú gỗ từ khúc gỗ thô. Vừa mỏi tay, vừa dễ gọt lẹm vào ngón tay (nhầm trường).
- **MapStruct (Khuôn đúc công nghiệp)**: Trình biên dịch tạo sẵn một chiếc khuôn thép lúc build. Bạn chỉ cần đổ nhựa vào là ra ngay 1,000 chú gấu bông giống hệt nhau trong 1 giây, tốc độ nhanh ngang ngửa code viết tay và không bao giờ sót lỗi!
:::`,

  "2-4-3": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: LẬT TRANG SÁCH TRIỆU TRANG
- **OFFSET 1,000,000**: Hãy tưởng tượng bạn muốn đọc trang thứ 1,000,000 của cuốn từ điển. Cơ sở dữ liệu ngây thơ phải **tự tay lật qua từng trang từ trang 1 đến trang 999,999 rồi vứt đi**, chỉ để đọc đúng 10 dòng cuối cùng! Càng về sau càng chậm khủng khiếp!
- **Keyset Pagination (Thẻ đánh dấu trang)**: Bạn chỉ cần nói: *"Mở ngay trang có mã ID lớn hơn 1000000"*. Cơ sở dữ liệu nhảy vèo đến đúng trang đó trong 1 mili-giây nhờ Index!
:::`,

  "2-4-4": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CHIẾC KÍNH VIỄN VỌNG QUAN SÁT VŨ TRỤ
Dữ liệu lớn giống như dải ngân hà với hàng triệu vì sao:
- Bạn không thể chụp một bức ảnh bao trùm toàn bộ bầu trời đêm (Nổ tung bộ nhớ).
- Bạn dùng chiếc kính viễn vọng di động (Keyset Pagination) lia dần qua từng cụm sao.
- Khi người dùng cần tải file ảnh 5GB: Dùng chiếc phễu dẫn đường trực tiếp **S3 Presigned URL**, không bao giờ để dòng nước lũ chảy tràn qua phòng khách Spring Boot!
:::`,

  "5-4-2": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: LỄ TÂN KHÁCH SẠN GIỮ HỘ CHIẾU
- Khi khách hàng đến khách sạn (Trình duyệt Frontend): Lễ tân (**Spring Cloud Gateway**) giữ hộ chiếu của khách và cất vào két an toàn.
- Lễ tân chỉ phát cho khách một chiếc thẻ từ mở cửa (**HttpOnly Cookie**).
- Mỗi khi khách cần gọi món ăn hay dọn phòng: Lễ tân tự lấy hộ chiếu ra đối chiếu với các phòng ban nội bộ (**Token Relay**). Khách không bao giờ sợ bị kẻ gian móc túi mất hộ chiếu!
:::`,

  "5-4-3": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: KẺ MÓC TÚI TRÊN XE BUÝT ĐÔNG NGƯỜI
- Lưu JWT trong \`LocalStorage\` giống như bạn nhét bọc tiền 100 triệu thò ra ngoài túi quần sau khi đi xe buýt.
- Bất kỳ một thư viện npm lạ nào có mã độc (Tấn công XSS) đều có thể thò tay rút sạch tiền của bạn trong tích tắc.
- Hãy cất bọc tiền đó vào két sắt bí mật của ngân hàng (**HttpOnly Cookie hoặc Mobile Keychain**)!
:::`,

  "6-1-3": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CHIẾC ĐỒNG HỒ HẸN GIỜ BỊ KẸT KIM
- Bạn thuê một phòng họp trong 5 phút.
- Nhưng do mải mê thảo luận, bạn bị kẹt trong phòng mất 6 phút.
- Chiếc đồng hồ hẹn giờ cứng nhắc hết 5 phút liền tự động mở toang cửa phòng! Người khác ùa vào trong lúc bạn chưa kịp cất tài liệu bí mật!
- **Redisson Watchdog**: Cứ mỗi 10 giây lại tự liếc nhìn bạn, thấy bạn vẫn đang họp thì tự động vặn thêm cót cho chiếc đồng hồ. Bạn không bao giờ sợ bị mở cửa bất ngờ!
:::`,

  "6-2-4": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: HÒM THƯ BẢO CHỨNG CỦA BƯU ĐIỆN HOÀNG GIA
Trong thế giới phân tán đầy bão táp:
- Bảng **Outbox** giống như chiếc hòm thư sắt kiên cố nằm ngay trong phòng khách của bạn.
- Dù bão tuyết ngoài đường có làm đứt dây cáp viễn thông (Kafka sập), bức thư vẫn nằm an toàn trong hòm.
- Khi bão tan, người đưa thư tin cậy (**Debezium / Outbox Poller**) sẽ đến gom thư và chuyển phát an toàn tới từng hộ gia đình!
:::`,

  "6-3-2": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: NHẠC TRƯỞNG DÀN NHẠC GIAO HƯỞNG
- Dàn nhạc có 3 nghệ sĩ: Nghệ sĩ Piano (\`payment-service\`), Nghệ sĩ Violin (\`inventory-service\`), Nghệ sĩ Trống (\`delivery-service\`).
- **Saga Orchestrator chính là vị Nhạc Trưởng**:
  - Nhạc trưởng chỉ đũa: *"Piano chơi khúc trừ tiền!"*.
  - Piano xong, Nhạc trưởng chỉ đũa: *"Violin chơi khúc giữ kho!"*.
  - Nếu Violin bị đứt dây đàn: Nhạc trưởng lập tức vẫy tay ra hiệu cho Piano: *"Dừng lại và chơi bản nhạc hoàn tiền bù trừ ngay lập tức!"*.
  - Không nghệ sĩ nào tự ý đánh lung tung!
:::`,

  "6-3-3": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: XEM ĐIỂM THI TRƯỚC KHI PHÚC KHẢO
- Trong lúc bài thi đang được chấm phúc khảo (Saga đang chạy dở dang):
- Nếu bạn cho phép phụ huynh vào xem điểm số tạm thời, phụ huynh sẽ tưởng con mình đỗ thủ khoa.
- Nhưng 2 phút sau phúc khảo phát hiện chấm nhầm -> Điểm bị tụt xuống trượt đại học! Phụ huynh sẽ vô cùng bức xúc!
- **Giải pháp Semantic Lock**: Luôn đóng dấu lên hồ sơ: *"ĐIỂM ĐANG CHỜ DUYỆT"* (\`ORDER_PENDING\`). Không cho ai rút tiền hay chuyển hàng khi con dấu chưa được đóng chính thức!
:::`,

  "6-3-4": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: KẾ HOẠCH BAY DỰ PHÒNG KHI BÃO ĐỔ BỘ
Một chuyến bay xuyên lục địa luôn có sẵn 3 sân bay dự phòng:
- Sân bay chính đóng cửa -> Chuyển hướng hạ cánh tại sân bay phụ.
- Không thể hạ cánh -> Quay đầu về điểm xuất phát và hoàn tiền cho hành khách.
- Hệ thống Saga bảo đảm mọi chuyến bay của khách hàng đều có kết cục rõ ràng: Hoặc là đến đích an toàn, hoặc là được bồi hoàn trọn vẹn, không bao giờ có chuyện máy bay biến mất giữa bầu trời!
:::`,

  "6-4-2": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: PHAO CỨU SINH TỰ BUNG VÀ CỔNG XOAY SOÁT VÉ
- **Cổng xoay soát vé (Rate Limiter)**: Mỗi phút chỉ cho đúng 100 người bước qua cửa ga tàu điện. Người thứ 101 phải đợi 1 giây, tránh việc hàng nghìn người giẫm đạp lên nhau tại sân ga.
- **Phao cứu sinh (Circuit Breaker Fallback)**: Khi tàu điện bị mất điện giữa hầm, hệ thống tự động phát đèn pin và loa thông báo hướng dẫn hành khách đi bộ thoát hiểm nhẹ nhàng, không gây hoảng loạn!
:::`,

  "6-4-3": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: THỨ TỰ MẶC QUẦN ÁO MÙA ĐÔNG
- Bạn phải mặc chiếc áo sơ mi bên trong, rồi mới khoác chiếc áo ấm ra ngoài.
- Nếu bạn làm ngược lại: Mặc áo ấm trước rồi cố nhét áo sơ mi trùm ra ngoài -> Toàn bộ trang phục bị rách toạc!
- **Với Resilience4j**: Cầu dao CircuitBreaker phải ôm sát hàm Service, còn bộ thử lại Retry phải nằm ở ngoài cùng để đếm chính xác số lần vấp ngã!
:::`,

  "6-4-4": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: HỆ THỐNG MIỄN DỊCH TỰ CHỮA LÀNH
Cơ thể con người là một kỳ quan tự phục hồi:
- Khi một ngón tay bị xước: Các mạch máu tự co lại, tiểu cầu kéo đến đông máu (**Circuit Breaker ngắt mạch**).
- Toàn bộ cơ thể vẫn tiếp tục đi đứng, thở và làm việc bình thường (**Graceful Degradation**).
- Hệ thống Microservices của bạn cũng vậy: Một dịch vụ phụ gặp sự cố không bao giờ được phép làm liệt toàn bộ hoạt động kinh doanh!
:::`,

  "6-5-2": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: NHÀ MÁY ĐÓNG GÓI MÌ TÔM 1 TRIỆU GÓI
- Một triệu gói mì tôm chạy trên băng chuyền:
- Máy tự động đếm: Cứ đủ **100 gói mì** thì đóng vào một chiếc thùng carton và dán băng dính niêm phong (**1 Chunk Transaction**).
- Sau đó dọn sạch mặt bàn để đón 100 gói mì tiếp theo.
- Dù có đóng gói 1 tỷ gói mì thì nhà máy cũng không bao giờ bị nghẽn mặt bằng!
:::`,

  "6-5-3": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: UỐNG NƯỚC TỪ VÒI CỨU HỎA
- Bạn muốn uống nước: Bạn chỉ cần một chiếc cốc nhỏ 200ml.
- Nếu bạn mở toang vòi phun nước cứu hỏa xối thẳng vào mặt (Dùng Streaming Cursor trên Database không hỗ trợ): Áp lực nước khổng lồ sẽ thổi bay cả căn phòng và làm ngập lụt toàn bộ ngôi nhà (**OutOfMemoryError**)!
- Hãy dùng chiếc bình rót từng đợt vừa phải (**Paged Reader**)!
:::`,

  "7-1-4": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: HÀNH LÝ GỌN GÀNG CỦA PHI HÀNH GIA
- Mỗi kilogam mang lên vũ trụ tốn 10,000 USD tiền nhiên liệu tên lửa.
- Phi hành gia không bao giờ mang theo ghế sofa, tủ lạnh hay bình nóng lạnh. Họ chỉ mang đúng những viên thực phẩm nén siêu nhẹ và bộ đồ du hành tiêu chuẩn (**Alpine JRE 21**).
- Container của bạn cũng vậy: Càng nhỏ gọn, thời gian kéo image trên Kubernetes càng nhanh, tự động hồi phục sau sự cố chỉ trong 2 giây!
:::`,

  "7-2-2": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: ĐỔI LỐP XE ĐUA F1 KHI XE ĐANG CHẠY
- Hãy tưởng tượng chiếc xe đua F1 không cần dừng lại ở trạm Pit-stop:
- Bánh xe mới được hạ xuống tiếp đất và quay cùng vận tốc với bánh xe cũ (Readiness Probe = UP).
- Khi bánh mới đã bám chặt mặt đường, bánh cũ mới từ từ được thu lên!
- Chiếc xe đua vẫn phóng đi với tốc độ 300km/h mà không mất một phần nghìn giây nào!
:::`,

  "7-2-3": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BÁC SĨ ĐO NHỊP TIM NHẦM NGƯỜI
- Bệnh nhân (Spring Boot Pod) đang nằm nghỉ ngơi rất khỏe khoắn.
- Nhưng bác sĩ (Liveness Probe) lại đi đo nhịp tim của... người đi đường ngoài phố (Database bên ngoài).
- Người đi đường bị mệt dừng lại thở dốc -> Bác sĩ tưởng bệnh nhân chết, liền lao vào giật điện tim làm bệnh nhân ngất thật (**Restart Pod liên tục thành CrashLoopBackOff**)!
- Hãy để bác sĩ Liveness đo đúng tim của bệnh nhân!
:::`,

  "7-3-2": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: THỬ TẢI CHIẾC CẦU TREO BẰNG ĐOÀN XE TẢI
- Trước khi khánh thành chiếc cầu dây văng lớn nhất thành phố:
- Ban quản lý cho 100 chiếc xe tải chở đầy đá cùng lúc chạy lên cầu (**k6 Load Test**).
- Máy đo độ rung (Prometheus) và cảm biến dây cáp (OpenTelemetry) đo đạc từng milimet võng của thân cầu.
- Khi vượt qua bài kiểm tra khắc nghiệt này, chiếc cầu mới được phép mở cửa cho người dân lưu thông an toàn!
:::`,

  "7-3-3": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: IN DANH THIẾP CHO TỪNG HẠT CÁT BỜ BIỂN
- Bạn muốn đếm xem có bao nhiêu người đi dạo trên bãi biển:
- Cách đúng: Bạn chỉ cần đếm: *"Có 500 nam, 600 nữ"* (2 chiếc nhãn hữu hạn: Gender = Male / Female).
- Cách tai hại (Cardinality Explosion): Bạn đòi in một chiếc thẻ tên riêng biệt cho từng hạt cát mà người đó giẫm lên (Gắn \`userId = 12345\` vào Prometheus Tag)!
- Sau 1 ngày, bạn phải in 1 tỷ chiếc thẻ tên -> Kho giấy của bạn nổ tung vì không còn chỗ chứa!
:::`,

  "7-4-1": `:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TRUNG TÂM THƯƠNG MẠI THÔNG MINH 5 TẦNG
Toàn bộ khóa học kết tinh thành một tòa cao ốc mua sắm hiện đại:
- **Tầng 1 (Gateway)**: Cổng kiểm soát an ninh tự động nhận diện khuôn mặt và điều tiết lưu lượng khách.
- **Tầng 2 (Order)**: Quầy tiếp nhận đơn hàng với sổ cái kế toán kép không thể bị làm giả.
- **Tầng 3 (Payment)**: Két sắt thanh toán đa kênh có bảo hiểm hoàn tiền tức thì.
- **Tầng 4 (Inventory)**: Kho hàng robot tự động cập nhật số lượng từng giây.
- **Tầng 5 (Control Tower)**: Tháp chỉ huy giám sát toàn cảnh bằng radar Prometheus và camera OpenTelemetry 24/7!
:::`,
};

// Apply to files
const modulesToUpdate = [2, 5, 6, 7];

modulesToUpdate.forEach(mId => {
  const p = path.join(contentDir, "module" + mId + ".js");
  if (!fs.existsSync(p)) return;

  global.window = { COURSE_MODULES: [] };
  eval(fs.readFileSync(p, "utf8"));
  const m = window.COURSE_MODULES.find(mod => mod.id === mId);
  if (!m) return;

  let updatedCount = 0;
  m.lessons.forEach(l => {
    if (metaphors[l.id] && !(l.content || "").includes(":::beginner")) {
      // Insert after :::target ... ::: block or at top of content
      if (l.content.includes(":::target")) {
        const targetEnd = l.content.indexOf(":::\n", l.content.indexOf(":::target"));
        if (targetEnd !== -1) {
          const insertPos = targetEnd + 4;
          l.content = l.content.slice(0, insertPos) + "\n\n" + metaphors[l.id] + "\n" + l.content.slice(insertPos);
          updatedCount++;
        } else {
          l.content = metaphors[l.id] + "\n\n" + l.content;
          updatedCount++;
        }
      } else {
        l.content = metaphors[l.id] + "\n\n" + l.content;
        updatedCount++;
      }
    }
  });

  fs.writeFileSync(p, "window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n" + JSON.stringify(m, null, 2) + "\n);\n", "utf8");
  console.log(`Updated Module ${mId}: inserted ${updatedCount} beginner metaphors.`);
});
