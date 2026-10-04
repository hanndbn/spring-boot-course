window.COURSE_MODULES = window.COURSE_MODULES || [];
window.COURSE_MODULES.push(
{
  "id": 7,
  "title": "DevOps & Observability",
  "subtitle": "Docker Layered Jar, K8s Zero-Downtime, OpenTelemetry & Capstone",
  "icon": "☸️",
  "desc": "Triển khai production: Đóng gói Docker Layered Jar, cấu hình K8s Zero-Downtime, giám sát Prometheus/Grafana và Capstone Project.",
  "topics": [
    {
      "id": 1,
      "title": "Docker & Container Optimization",
      "desc": "Đóng gói Dockerfile Multi-stage, Spring Boot Layered JAR, cgroups v2 và tối ưu hóa bộ nhớ JVM."
    },
    {
      "id": 2,
      "title": "Kubernetes Zero-Downtime & Actuator",
      "desc": "Cấu hình Liveness/Readiness Probes, Graceful Shutdown và triển khai Rolling Update không gián đoạn."
    },
    {
      "id": 3,
      "title": "Distributed Observability & Load Testing",
      "desc": "Bộ ba Metrics, Traces, Logs: Micrometer, Prometheus, OpenTelemetry, Grafana và kiểm thử tải với k6."
    },
    {
      "id": 4,
      "title": "Capstone Architecture & Production Go-Live",
      "desc": "Đồ án kiến trúc phân tán Capstone hoàn chỉnh, ArchUnit rules, kiểm thử ẩn và tiêu chuẩn tốt nghiệp."
    }
  ],
  "outcomes": [
    "Đóng gói container Docker đạt chuẩn Layered JAR tối ưu băng thông kéo image và an toàn non-root",
    "Thiết lập Kubernetes Liveness/Readiness Probes và cơ chế Graceful Shutdown đảm bảo Zero-Downtime",
    "Xây dựng hạ tầng quan sát toàn diện với Prometheus, Grafana, OpenTelemetry và kiểm thử tải k6",
    "Hoàn thành xuất sắc Capstone Project hệ thống thương mại điện tử phân tán đạt chuẩn DevMastery Architect"
  ],
  "retrievalWarmup": [
    {
      "question": "Trong Module 6, để giải quyết thảm họa Dual-Write (ghi database cục bộ và gửi event Kafka đồng thời) tránh mất dữ liệu, pattern kiến trúc chuẩn mực nào bắt buộc phải áp dụng?",
      "options": [
        "Transactional Outbox Pattern (lưu event vào bảng outbox cùng local transaction của nghiệp vụ, rồi dùng CDC Debezium hoặc Poller xuất bản sang Kafka)",
        "Two-Phase Commit (2PC) phân tán giữa JDBC và Kafka producer",
        "Gửi Kafka trước bằng asynchronous fire-and-forget, sau đó mới commit database",
        "Bọc cả lệnh ghi DB và kafkaTemplate.send() trong một khối try-catch"
      ],
      "answer": 0,
      "explain": "Transactional Outbox Pattern bảo đảm tính nguyên tố cục bộ (Atomicity): Record nghiệp vụ và Event Outbox được commit trong cùng 1 local DB transaction. Sau đó Debezium CDC sẽ đẩy message lên Kafka đảm bảo At-least-once delivery.",
      "targetLessonId": "6-2-1"
    },
    {
      "question": "Khi triển khai Saga Pattern phân tán, cơ chế nào được kích hoạt để đưa toàn hệ thống trở về trạng thái nhất quán cuối cùng nếu một bước thanh toán bị thất bại?",
      "options": [
        "Thực thi Compensating Transaction (Giao dịch bù trừ) theo chiều ngược lại để hoàn trả trạng thái (ví dụ: hoàn tiền, mở khóa tồn kho)",
        "Yêu cầu database của tất cả các microservices tự động rollback",
        "Khởi động lại toàn bộ pod Kubernetes của các microservice liên quan",
        "Tự động xóa tài khoản của khách hàng"
      ],
      "answer": 0,
      "explain": "Trong kiến trúc phân tán không có 2PC, Saga giải quyết rollback bằng cách kích hoạt chuỗi Compensating Transaction (giao dịch bù trừ) theo chiều ngược lại để đưa hệ thống về trạng thái nhất quán cuối cùng.",
      "targetLessonId": "6-3-1"
    },
    {
      "question": "Tại sao khi sử dụng Redisson để tạo khóa phân tán (Distributed Lock) trên Redis, tính năng Lock Watchdog lại là cứu cánh sống còn cho hệ thống?",
      "options": [
        "Watchdog tự động gia hạn thời gian sống của lock (mỗi 10s) chừng nào thread nghiệp vụ vẫn đang chạy, ngăn ngừa việc lock bị quá hạn khi tác vụ xử lý lâu hơn dự kiến",
        "Watchdog tự động gửi email cảnh báo cho quản trị viên",
        "Watchdog xóa toàn bộ cache Redis khi có lỗi",
        "Watchdog chuyển đổi khóa phân tán thành biến Java thông thường"
      ],
      "answer": 0,
      "explain": "Nếu set thời gian lease cứng, một tác vụ chạy chậm (do GC pause hoặc DB lag) có thể làm lock hết hạn khi chưa xong việc, dẫn đến thread khác lao vào gây race condition. Watchdog tự động gia hạn lock an toàn.",
      "targetLessonId": "6-1-1"
    }
  ],
  "lessons": [
    {
      "id": "7-1-1",
      "type": "theory",
      "title": "Bài 7.1.1: Kiến trúc Docker Layered JAR, Multi-Stage Build & Giới Hạn Bộ Nhớ Cgroups v2",
      "minutes": 8,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải mã kỹ thuật **Docker Layered JAR** của Spring Boot: Tách file JAR thành 4 tầng riêng biệt để tận dụng tối đa Docker Layer Caching.\n- Nắm vững kiến trúc **Multi-Stage Build**: Biên dịch trong môi trường JDK đầy đủ, nhưng chạy trên image JRE siêu nhẹ (Eclipse Temurin / Alpine).\n- Hiểu cơ chế Linux Cgroups v2 và cách JVM tự động nhận diện giới hạn RAM của container (`-XX:MaxRAMPercentage`).\n- Đọc hiểu 100% từng dòng trong Dockerfile chuẩn Enterprise qua Bảng giải mã chi tiết.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: DOCKER LAYERED JAR\n**Hình tượng \"Chở cả tảng băng vs Chỉ thay chiếc vỏ ốc\":**\n- File JAR của bạn nặng **100MB**:\n  - Trong đó có **98MB** là các thư viện Spring, Hibernate, Jackson... (Vài tháng mới đổi 1 lần).\n  - Chỉ có đúng **2MB** là mã nguồn nghiệp vụ của bạn (Sửa và deploy liên tục 20 lần mỗi ngày!).\n- **Cách đóng gói thông thường (Cũ)**: Mỗi lần sửa 1 dòng code -> Docker phải tải và đẩy lại **cả 100MB** lên Docker Registry! Rất tốn băng thông và mất 5 phút!\n- **Spring Boot Layered JAR — \"Chia bánh thành 4 tầng\"**:\n  - Tầng 1: Dependencies (98MB) -> Docker nạp 1 lần duy nhất và **Cache vĩnh viễn**!\n  - Tầng 2: Spring Boot Loader (0.5MB).\n  - Tầng 3: Snapshot Dependencies (0.5MB).\n  - Tầng 4: Application Code của bạn (Chỉ 2MB!).\n  - Mỗi lần deploy mới: Docker chỉ cần đẩy đúng **2MB** lên mạng trong **3 giây**!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến trúc Layered JAR Trong Spring Boot)\n\nTừ Spring Boot 2.3+, công cụ `layertools` cho phép tách file fat-jar thành 4 thư mục riêng biệt trước khi nạp vào Docker:\n\n```mermaid\nflowchart TD\n    JAR[\"order-service.jar (100MB)\"] -->|\"java -Djarmode=layertools -jar app.jar extract\"| LAYERS\n    \n    subgraph LAYERS[\"4 Lớp Layer Độc Lập\"]\n        L1[\"dependencies/ (95MB - Ít thay đổi nhất -> Cached)\"]\n        L2[\"spring-boot-loader/ (500KB - Cached)\"]\n        L3[\"snapshot-dependencies/ (Tùy biến)\"]\n        L4[\"application/ (2MB - Thay đổi thường xuyên -> Rebuild)\"]\n    end\n    \n    LAYERS --> DOCKER[\"Docker Image Tối Ưu Tốc Độ Build 10X\"]\n    style L1 fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n    style L4 fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff\n```\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)\n\nDockerfile Multi-Stage chuẩn mực đạt điểm 10 tối ưu:\n\n```dockerfile\n# GIAI ĐOẠN 1: Tách các layer từ JAR (Extractor Stage)\nFROM eclipse-temurin:21-jre-alpine as builder\nWORKDIR /builder\nCOPY target/order-service.jar app.jar\nRUN java -Djarmode=layertools -jar app.jar extract\n\n# GIAI ĐOẠN 2: Chạy ứng dụng sản xuất (Production Runtime)\nFROM eclipse-temurin:21-jre-alpine\nWORKDIR /app\n\n# Tạo user không có đặc quyền root để bảo mật an ninh\nRUN addgroup -S spring && adduser -S spring -G spring\nUSER spring:spring\n\n# Copy các layer theo thứ tự từ ít đổi đến đổi nhiều nhất để tận dụng Docker Cache\nCOPY --from=builder /builder/dependencies/ ./\nCOPY --from=builder /builder/spring-boot-loader/ ./\nCOPY --from=builder /builder/snapshot-dependencies/ ./\nCOPY --from=builder /builder/application/ ./\n\n# Cấu hình JVM Flags tự động co giãn theo RAM của Kubernetes Pod\nENTRYPOINT [\"java\",   \"-XX:MaxRAMPercentage=75.0\",   \"-XX:+ExitOnOutOfMemoryError\",   \"-Djava.security.egd=file:/dev/./urandom\",   \"org.springframework.boot.loader.launch.JarLauncher\"]\n```\n\n### Bảng Giải Mã Cấu Hình JVM Flags Trong Container:\n\n| Tham số JVM Flag | Ý nghĩa kỹ thuật | Lợi ích an toàn |\n|---|---|---|\n| `-XX:MaxRAMPercentage=75.0` | Cho phép JVM dùng tối đa 75% RAM được cấp của Container | Dành 25% RAM còn lại cho OS, JVM Metaspace và luồng Native, **ngăn chặn Linux OOM-Killer tiêu diệt Pod** |\n| `-XX:+ExitOnOutOfMemoryError` | Tự động thoát tiến trình khi nổ OOM | Báo cho Kubernetes biết pod đã hỏng để tự động khởi động lại Pod mới |\n| `USER spring:spring` | Chạy với tài khoản thường không có root | Hacker dù có khai thác được lỗ hổng RCE cũng không thể kiểm soát máy chủ host |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Hiểm họa chạy container bằng quyền `root` mặc định**:\n   - Nếu bạn không thêm dòng `USER spring:spring`, ứng dụng sẽ chạy với UID 0 (root).\n   - Nếu có lỗ hổng đọc file bừa bãi, kẻ tấn công có thể đọc trộm file `/etc/shadow` hoặc can thiệp vào kernel!\n"
    },
    {
      "id": "7-1-2",
      "type": "practice",
      "title": "Bài 7.1.2: Đóng Gói Dockerfile Multi-Stage Tối Ưu Layer Caching & Cấu Hình JVM Flag Container",
      "minutes": 8,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Xây dựng Dockerfile Multi-Stage chuẩn Enterprise cho ứng dụng Spring Boot 3.\n- Tối ưu hóa kích thước Docker image từ 600MB xuống chỉ còn dưới **150MB**.\n- Cấu hình thông số JVM tối ưu cho môi trường container: `-XX:MaxRAMPercentage=75.0`.\n- Đọc hiểu 100% từng dòng lệnh Dockerfile qua Bảng giải mã chi tiết.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: MULTI-STAGE DOCKER BUILD\n**Hình tượng \"Người đầu bếp nấu ăn trong bếp lớn rồi dọn ra đĩa nhỏ\":**\n- **Giai đoạn 1 (Nhà bếp lớn - Builder Stage)**: Cần đầy đủ dao thớt, nồi niêu, bao tải gạo (Maven, JDK 21 Compiler 500MB) để nấu món ăn.\n- **Giai đoạn 2 (Bàn tiệc sang trọng - Runner Stage)**: Khách hàng chỉ cần chiếc đĩa nhỏ đựng món ăn chín (JRE 21 Runtime 50MB + File JAR 20MB). Toàn bộ dao thớt, bao tải gạo bị bỏ lại trong nhà bếp!\n- Kết quả: Chiếc đĩa siêu nhẹ, khách ăn ngon miệng, không tốn diện tích bàn ăn!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến trúc Multi-Stage Build)\n\n```mermaid\nflowchart LR\n    A[\"Stage 1: Maven + JDK 21 Compiler<br/>(Dung lượng: 600MB)\"] -->|\"mvn clean package\"| B[\"File Fat JAR: 50MB\"]\n    B --> C[\"Stage 2: Eclipse Temurin JRE 21 Alpine<br/>(Chỉ lấy JRE + JAR)\"]\n    C --> D[\"FINAL DOCKER IMAGE: 120MB<br/>(Siêu nhẹ, bảo mật cao)\"]\n    style D fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n    style A fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff\n```\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)\n\n```dockerfile\n# Stage 1: Build JAR\nFROM maven:3.9-eclipse-temurin-21-alpine AS builder\nWORKDIR /build\nCOPY pom.xml .\nRUN mvn dependency:go-offline\nCOPY src ./src\nRUN mvn clean package -DskipTests\n\n# Stage 2: Runtime Image\nFROM eclipse-temurin:21-jre-alpine\nWORKDIR /app\nRUN addgroup -S spring && adduser -S spring -G spring\nUSER spring:spring\nCOPY --from=builder /build/target/*.jar app.jar\nEXPOSE 8080\nENTRYPOINT [\"java\", \"-XX:MaxRAMPercentage=75.0\", \"-jar\", \"app.jar\"]\n```\n\n### Bảng Giải Mã Các Lệnh Dockerfile:\n\n| Dòng lệnh Dockerfile | Cú pháp | Ý nghĩa kỹ thuật | Lợi ích tối ưu |\n|---|---|---|---|\n| `FROM maven:... AS builder` | Multi-stage builder | Tạo môi trường biên dịch tạm thời | Chứa công cụ biên dịch nhưng không lọt vào image cuối |\n| `RUN mvn dependency:go-offline` | Dependency caching | Tải trước toàn bộ thư viện về cache của Docker | Nếu không sửa pom.xml, bước này không bao giờ phải tải lại |\n| `USER spring:spring` | Non-root security | Chạy tiến trình bằng user không đặc quyền | Chống tấn công chiếm quyền máy chủ host |\n| `-XX:MaxRAMPercentage=75.0` | Dynamic Heap Flag | JVM tự tính Heap theo 75% RAM cấp cho Container | Tự động thích ứng với cấu hình Pod Kubernetes |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Copy `pom.xml` trước `src/`**:\n   - Nếu bạn copy cả thư mục trước, mỗi lần sửa 1 ký tự trong Java file, Docker sẽ bắt tải lại toàn bộ dependencies từ đầu!\n"
    },
    {
      "id": "7-1-3",
      "type": "pitfall",
      "title": "Bài 7.1.3: Cạm bẫy Linux OOM-Killer Tiêu Diệt JVM, Chạy Container Bằng Root User & Layer Jar Phình To",
      "minutes": 7,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải mã hiện tượng Pod bị chết bí ẩn với mã lỗi **Exit Code 137 (OOM-Killed)**.\n- Hiểu tại sao tổng bộ nhớ JVM tiêu thụ luôn lớn hơn rất nhiều so với dung lượng Heap Memory (`-Xmx`).\n- Tính toán chính xác công thức cấp phát RAM cho Pod: **Heap + Metaspace + Native Memory + Thread Stacks**.\n- Đọc hiểu bảng phân tích cấu trúc bộ nhớ JVM Container qua Bảng giải mã chi tiết.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẠI SAO OOM-KILLER BẮN CHẾT JVM?\n**Hình tượng \"Chiếc hộp giấy 1GB và người khổng lồ thở phì phò\":**\n- Bạn cấp cho container chiếc hộp giới hạn: **1GB RAM**.\n- Lập trình viên cấu hình: `-Xmx1g` (Cho phép Heap Memory nở tới 1GB).\n- Khi Heap nở đến 800MB:\n  - JVM cần thêm 150MB cho Metaspace (lưu class bytecode).\n  - JVM cần thêm 100MB cho 200 Thread Stacks (mỗi thread tốn 1MB).\n  - JVM cần thêm 50MB cho bộ nhớ Garbage Collection.\n- **Tổng cộng tiêu thụ**: $800 + 150 + 100 + 50 = 1,100\text{MB}$ (Vượt quá chiếc hộp 1GB!).\n- Cảnh sát trưởng Linux Kernel (**OOM-Killer**) nhìn thấy vượt trần, liền rút súng bắn hạ tiến trình Java ngay lập tức: **Exit Code 137**!\n:::\n\n---\n\n## 1. Cái này là gì? (Bản chất Tổng Bộ Nhớ JVM)\n\n$$ \text{Total Memory} = \text{Heap} + \text{Metaspace} + (\text{Threads} \times \text{Xss}) + \text{Native Buffers} + \text{GC Overhead} $$\n\n```mermaid\nflowchart TD\n    subgraph POD[\"Giới Hạn Bộ Nhớ Container (1000MB)\"]\n        HEAP[\"Heap Memory (-Xmx / 75%)<br/>[750MB]\"]\n        META[\"Metaspace<br/>[120MB]\"]\n        STACK[\"Thread Stacks (200 x 1MB)<br/>[100MB]\"]\n        BUFF[\"Direct Memory / OS Overhead<br/>[30MB]\"]\n    end\n    POD --> OK[\"Dưới 1000MB -> HOÀN TOÀN AN TOÀN!\"]\n    style HEAP fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n    style OK fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff\n```\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (Bảng Phân Tích Công Thức Cấp Phát)\n\n| Thành phần bộ nhớ | Tỷ lệ khuyến nghị | Vai trò kỹ thuật |\n|---|---|---|\n| **MaxRAMPercentage** | `75.0` (75%) | Dành cho việc lưu trữ các Object Java trong Heap |\n| **Metaspace** | `-XX:MaxMetaspaceSize=256m` | Giới hạn bộ nhớ lưu trữ metadata của các class đã nạp |\n| **Thread Stack Size** | `-Xss512k` | Giảm kích thước stack mỗi thread từ 1MB xuống 512KB để tiết kiệm RAM |\n| **Dự phòng hệ điều hành** | 25% còn lại | Chống việc Linux OOM-Killer can thiệp bất ngờ |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Tuyệt đối không set cứng `-Xmx` bằng với Container Limit**:\n   - Nếu Container Limit là 1GB, chỉ set `-Xmx` tối đa 750MB.\n"
    },
    {
      "id": "7-1-4",
      "type": "synthesis",
      "title": "Bài 7.1.4: Tổng Kết Thực Chiến: Bản Đồ Đóng Gói Container & Ma Trận Lựa Chọn Base Image JVM",
      "minutes": 8,
      "content": "\n### Sơ Đồ Kiến Trúc: Đóng Gói Multi-Stage Docker Layered JAR Chuẩn Sản Xuất\n\n```mermaid\nflowchart TD\n    subgraph STAGE1 [\"Stage 1: Build & Layer Extraction (Eclipse Temurin JDK 21)\"]\n        Src[\"📁 Source Code + pom.xml\"] --> MavenBuild[\"⚙️ ./mvnw clean package\"]\n        MavenBuild --> FatJar[\"📦 order-service.jar (Executable Fat JAR)\"]\n        FatJar --> Extractor[\"🔪 java -Djarmode=layertools -jar extract\"]\n        Extractor --> L1[\"📂 dependencies/ (Thư viện ít thay đổi)\"]\n        Extractor --> L2[\"📂 spring-boot-loader/ (Trình khởi chạy Boot)\"]\n        Extractor --> L3[\"📂 snapshot-dependencies/\"]\n        Extractor --> L4[\"📂 application/ (Mã nguồn nghiệp vụ công ty)\"]\n    end\n\n    subgraph STAGE2 [\"Stage 2: Minimal Runtime Container (Distroless / Alpine JRE 21)\"]\n        L1 --> Img[\"🐳 Docker Image Layers\"]\n        L2 --> Img\n        L3 --> Img\n        L4 --> Img\n        Img --> Security[\"🔒 Chạy dưới quyền non-root: 'appuser:appgroup'\"]\n        Security --> Container[\"🚀 Production Container (< 180MB, Build trong 3s)\"]\n    end\n\n    style STAGE1 fill:#0f172a,stroke:#38bdf8,color:#fff\n    style STAGE2 fill:#064e3b,stroke:#10b981,color:#fff\n```\n\n\n\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Tổng hợp toàn bộ kiến thức Chuyên đề 7.1 thành Ma trận Lựa chọn Base Image và Checklist đóng gói Container chuẩn Production.\n- Sẵn sàng bước sang Chuyên đề 7.2 (Kubernetes Zero-Downtime & Actuator Probes).\n:::\n\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: HÀNH LÝ GỌN GÀNG CỦA PHI HÀNH GIA\n- Mỗi kilogam mang lên vũ trụ tốn 10,000 USD tiền nhiên liệu tên lửa.\n- Phi hành gia không bao giờ mang theo ghế sofa, tủ lạnh hay bình nóng lạnh. Họ chỉ mang đúng những viên thực phẩm nén siêu nhẹ và bộ đồ du hành tiêu chuẩn (**Alpine JRE 21**).\n- Container của bạn cũng vậy: Càng nhỏ gọn, thời gian kéo image trên Kubernetes càng nhanh, tự động hồi phục sau sự cố chỉ trong 2 giây!\n:::\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Ma Trận Lựa Chọn Base Image)\n\n| Base Image | Dung lượng | Thư viện C | Phù hợp kịch bản |\n|---|:---:|:---:|---|\n| **eclipse-temurin:21-jre-alpine** | **~100MB** | musl libc | ⭐ **Lựa chọn số 1 cho Microservices siêu nhẹ** |\n| **eclipse-temurin:21-jre** (Ubuntu/Debian) | ~250MB | glibc | Khi cần thư viện Native C phụ thuộc (OpenCV, AI libs) |\n| **distroless/java21-debian12** | ~180MB | glibc | Bảo mật tối cao (Không có shell, không có bash) |\n"
    },
    {
      "id": "7-2-1",
      "type": "theory",
      "title": "Bài 7.2.1: Kiến trúc Kubernetes Probes (Liveness / Readiness) & Cơ Chế Graceful Shutdown",
      "minutes": 8,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Hiểu chính xác sự khác biệt sống còn giữa **Liveness Probe** (Kiểm tra sống chết) và **Readiness Probe** (Kiểm tra sẵn sàng nhận khách).\n- Cấu hình cơ chế **Graceful Shutdown** trong Spring Boot 3: Chờ hoàn tất các đơn hàng đang thanh toán dở dang trước khi tắt pod.\n- Tích hợp Spring Boot Actuator Health Groups (`/actuator/health/liveness` và `/actuator/health/readiness`).\n- Đọc hiểu 100% sơ đồ vòng đời Kubernetes Pod qua Bảng giải mã chi tiết.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: LIVENESS VS READINESS PROBE\n**Hình tượng \"Người bán quán phở đang chuẩn bị đồ ăn\":**\n- **Liveness Probe (Tôi còn thở không?)**:\n  - Bác sĩ (Kubernetes Kubelet) đến kiểm tra tim mạch người bán phở.\n  - Nếu người bán phở bị ngất hoặc tim ngừng đập (Deadlock, OOM): Bác sĩ lập tức **thay người khác ngay (Khởi động lại Pod - Restart Pod)**!\n- **Readiness Probe (Tôi đã sẵn sàng bán hàng chưa?)**:\n  - Quán phở mới mở cửa lúc 6:00 sáng. Người bán phở còn sống rất khỏe, nhưng **nồi nước dùng chưa sôi** (Spring Boot đang nạp Hibernate, kết nối DB).\n  - Người bán phở treo biển: *\"Chưa sẵn sàng, xin khách chờ 2 phút!\"* (**Readiness = DOWN**).\n  - Kubernetes sẽ **KHÔNG BAO GIỜ điều hướng khách hàng vào quán** lúc này!\n  - Đến 6:05 nước sôi: Treo biển *\"Đã sẵn sàng!\"* (**Readiness = UP**) -> Khách ùa vào ăn mà không ai nhận lỗi 503!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến trúc Actuator Probes Trong Kubernetes)\n\nSpring Boot tự động cung cấp 2 endpoint chuyên dụng cho Kubernetes từ phiên bản 2.3+:\n- `/actuator/health/liveness`: Phản ánh trạng thái `LivenessState.CORRECT`.\n- `/actuator/health/readiness`: Phản ánh trạng thái `ReadinessState.ACCEPTING_TRAFFIC`.\n\n### Sơ Đồ Cơ Chế Rolling Update Không Gián Đoạn (Zero-Downtime Deployment):\n\n```mermaid\nsequenceDiagram\n    participant K8s as Kubernetes Ingress / Service\n    participant OldPod as Pod v1 Cũ (Đang phục vụ)\n    participant NewPod as Pod v2 Mới (Đang khởi động)\n    \n    K8s->>NewPod: 1. Bật Pod v2 mới\n    loop Readiness Probe (Mỗi 2s)\n        NewPod-->>K8s: Readiness = DOWN (Đang nạp Cache/DB...)\n    end\n    Note over K8s: 100% Request của khách vẫn gửi vào Pod v1 an toàn!\n    \n    NewPod-->>K8s: Readiness = UP (Sẵn sàng 100%!)\n    Note over K8s: Chuyển toàn bộ traffic sang Pod v2 mới!\n    \n    K8s->>OldPod: Gửi tín hiệu SIGTERM (Tắt dần)\n    OldPod->>OldPod: Graceful Shutdown (Đợi xử lý nốt các đơn dở dang tối đa 30s)\n    OldPod-->>K8s: Hoàn tất -> Tiêu hủy Pod v1!\n    Note right of K8s: KHÔNG MỘT KHÁCH HÀNG NÀO BỊ RỚT KẾT NỐI! ZERO-DOWNTIME!\n```\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)\n\n### 1. Cấu hình trong `src/main/resources/application.yml`:\n\n```yaml\nserver:\n  # Bật chế độ Graceful Shutdown: Chờ request dở dang hoàn tất\n  shutdown: graceful\n\nspring:\n  lifecycle:\n    # Cho phép tối đa 30 giây để hoàn tất các giao dịch đang chạy\n    timeout-per-shutdown-phase: 30s\n\nmanagement:\n  endpoint:\n    health:\n      probes:\n        # Bật các endpoint chuyên dụng cho Kubernetes\n        enabled: true\n  endpoints:\n    web:\n      exposure:\n        include: health, info, prometheus\n```\n\n### 2. File cấu hình `deployment.yaml` trên Kubernetes:\n\n```yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: order-service\nspec:\n  replicas: 3\n  template:\n    spec:\n      containers:\n        - name: order-service\n          image: ecommerce/order-service:1.0.0\n          ports:\n            - containerPort: 8080\n          # Liveness Probe: Kiểm tra xem app có bị treo chết không\n          livenessProbe:\n            httpGet:\n              path: /actuator/health/liveness\n              port: 8080\n            initialDelaySeconds: 20\n            periodSeconds: 10\n            failureThreshold: 3\n          # Readiness Probe: Kiểm tra xem app đã sẵn sàng nhận request chưa\n          readinessProbe:\n            httpGet:\n              path: /actuator/health/readiness\n              port: 8080\n            initialDelaySeconds: 15\n            periodSeconds: 5\n            failureThreshold: 2\n```\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Hiểm họa đưa kiểm tra Database vào Liveness Probe**:\n   - Nếu bạn cấu hình Liveness Probe kiểm tra cả Database: Khi Database bị quá tải chậm phản hồi, **Kubernetes sẽ tưởng rằng toàn bộ Pod Spring Boot bị chết và ra lệnh RESTART TOÀN BỘ CỤM POD**!\n   - Hậu quả: Cả cụm pod vừa bật lên lại chết, sinh ra vòng lặp địa ngục **`CrashLoopBackOff`**!\n   - Khắc phục: Liveness chỉ kiểm tra trạng thái nội tại của JVM (Deadlock, Thread pool). Kiểm tra Database chỉ được nằm trong Readiness Probe!\n\n\n\n### Ma Trận So Sánh Các Loại Kubernetes Probes:\n\n| Loại Probe | Đường dẫn Actuator | Mục đích kiểm tra | Hành vi của Kubernetes khi thất bại |\n|---|---|---|---|\n| **Startup Probe** | `/actuator/health/liveness` | Ứng dụng đã hoàn tất nạp Bean và khởi động xong chưa? | Tạm dừng kiểm tra Liveness/Readiness; Giết và tạo Pod mới nếu quá timeout |\n| **Liveness Probe** | `/actuator/health/liveness` | Tiến trình JVM còn sống hay đã bị Deadlock hoàn toàn? | Khởi động lại (RESTART) Pod ngay lập tức |\n| **Readiness Probe** | `/actuator/health/readiness` | Ứng dụng đã sẵn sàng nhận traffic phục vụ khách chưa? | Gỡ Pod khỏi danh sách Service Endpoints (Không route traffic vào) |\n"
    },
    {
      "id": "7-2-2",
      "type": "practice",
      "title": "Bài 7.2.2: Cấu hình Spring Boot Actuator Health Groups & K8s Deployment Rolling Update",
      "minutes": 8,
      "content": "\n### Sơ Đồ Tuần Tự: Luồng Graceful Shutdown & Zero-Downtime Rolling Update\n\n```mermaid\nsequenceDiagram\n    autonumber\n    actor K8s as ☸️ Kubernetes Kubelet\n    participant Endpoints as 🌐 K8s Service Endpoints\n    participant App as 🚀 Spring Boot Pod\n    participant Tomcat as 🧵 Tomcat Thread Pool\n\n    Note over K8s,Tomcat: BẮT ĐẦU CẬP NHẬN PHIÊN BẢN MỚI\n    K8s->>App: 1. Gửi tín hiệu SIGTERM\n    K8s->>Endpoints: 2. Gỡ IP của Pod khỏi danh sách tiếp nhận request\n    App->>App: 3. Đổi Readiness State = REFUSING_TRAFFIC\n    App->>Tomcat: 4. Ngừng nhận request mới, kích hoạt Graceful Shutdown\n    Note over Tomcat: Tiếp tục xử lý nốt các đơn hàng đang thanh toán dở (tối đa 30s)\n    Tomcat-->>App: Đã xử lý xong 100% request còn đọng!\n    App->>App: 5. Đóng DataSource HikariCP, ngắt Kafka Consumer\n    App-->>K8s: Tiến trình kết thúc an toàn (Exit Code 0)\n    Note over K8s: Zero-Downtime hoàn tất! Không một khách hàng nào bị lỗi 502!\n```\n\n\n\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Cấu hình **Health Groups** trong Spring Boot Actuator: Phân tách riêng biệt nhóm kiểm tra Liveness và nhóm kiểm tra Readiness.\n- Thiết lập chiến lược **RollingUpdate** trong Kubernetes Deployment: `maxSurge: 25%`, `maxUnavailable: 0`.\n- Đọc hiểu 100% từng dòng cấu hình qua Bảng giải mã chi tiết.\n:::\n\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: ĐỔI LỐP XE ĐUA F1 KHI XE ĐANG CHẠY\n- Hãy tưởng tượng chiếc xe đua F1 không cần dừng lại ở trạm Pit-stop:\n- Bánh xe mới được hạ xuống tiếp đất và quay cùng vận tốc với bánh xe cũ (Readiness Probe = UP).\n- Khi bánh mới đã bám chặt mặt đường, bánh cũ mới từ từ được thu lên!\n- Chiếc xe đua vẫn phóng đi với tốc độ 300km/h mà không mất một phần nghìn giây nào!\n:::\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)\n\n```yaml\n# Cấu hình Kubernetes Rolling Update không có giây phút nào bị gián đoạn:\nspec:\n  strategy:\n    type: RollingUpdate\n    rollingUpdate:\n      maxSurge: 1        # Cho phép bật thêm tối đa 1 pod mới vượt trần\n      maxUnavailable: 0  # TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP THIẾU POD NÀO TRONG LÚC UPDATE!\n```\n\n### Bảng Giải Mã Các Tham Số Rolling Update:\n\n| Tham số K8s | Giá trị | Ý nghĩa thực chiến |\n|---|---|---|\n| `maxUnavailable: 0` | 0 pod bị tắt | Bảo đảm số lượng pod đang phục vụ luôn đủ 100% định mức lúc deploy |\n| `maxSurge: 1` | Bật trước 1 pod mới | Đợi pod mới nạp xong Readiness = UP rồi mới quay lại tắt pod cũ |\n"
    },
    {
      "id": "7-2-3",
      "type": "pitfall",
      "title": "Bài 7.2.3: Cạm bẫy DB Chậm Làm Sập Liveness Probe Gây Restart Vòng Lặp (CrashLoopBackOff)",
      "minutes": 7,
      "content": "\n### Sơ Đồ Cảnh Báo: DB Chậm Gây Sập Liveness Probe & Vòng Lặp CrashLoopBackOff\n\n```mermaid\nsequenceDiagram\n    autonumber\n    participant Kubelet as ☸️ K8s Kubelet\n    participant Boot as 🚀 Spring Boot Pod\n    participant DB as 🗄️ PostgreSQL Database\n\n    Note over Kubelet,DB: SỰ CỐ TAI HẠI: ĐƯA CHECK DB VÀO LIVENESS PROBE\n    Kubelet->>Boot: GET /actuator/health/liveness (timeout 1s)\n    Boot->>DB: SELECT 1 (Database đang bị nghẽn mạng, phản hồi mất 3s!)\n    Note over Boot: Kubelet không nhận được phản hồi sau 1s -> Liveness Probe FAILED!\n    Kubelet->>Boot: Kubelet giết Pod và tạo Pod mới!\n    Note over Boot: Pod mới khởi động lại tiếp tục probe DB -> Lại FAIL!\n    Note over Kubelet,Boot: CRASHLOOPBACKOFF: Toàn bộ Pod bị khởi động lại liên tục!\n```\n\n### Bảng Ma Trận Phân Tách Health Indicator Cho Từng Nhóm Probe:\n\n| Thành phần kiểm tra | Thuộc nhóm Liveness Probe? | Thuộc nhóm Readiness Probe? | Giải thích kiến trúc |\n|---|---|---|---|\n| **JVM Thread Deadlock** | Có (`ping`, `livenessState`) | Có | Nếu JVM bị deadlock thì bắt buộc phải restart Pod |\n| **Disk Space Ổ cứng** | Có (`diskSpace`) | Có | Nếu hết ổ cứng ghi log thì Pod không thể hoạt động |\n| **PostgreSQL Database** | ❌ **TUYỆT ĐỐI KHÔNG** | ⭐⭐⭐ **BẮT BUỘC** | DB chậm chỉ nên ngừng nhận traffic, restart Pod chỉ làm DB nghẽn hơn |\n| **Kafka Broker / Redis** | ❌ **TUYỆT ĐỐI KHÔNG** | ⭐⭐⭐ **BẮT BUỘC** | Tránh hiệu ứng Domino kéo sập toàn bộ cụm server khi Broker chập chờn |\n\n\n\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Nhận diện và hóa giải thảm họa **CrashLoopBackOff dây chuyền** do cấu hình sai Liveness Probe.\n- Tách biệt hoàn toàn chỉ số kiểm tra Database ra khỏi nhóm `liveness`.\n- Thiết lập `initialDelaySeconds` và `failureThreshold` chuẩn xác theo đặc thù thời gian khởi động của Spring Boot.\n:::\n\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BÁC SĨ ĐO NHỊP TIM NHẦM NGƯỜI\n- Bệnh nhân (Spring Boot Pod) đang nằm nghỉ ngơi rất khỏe khoắn.\n- Nhưng bác sĩ (Liveness Probe) lại đi đo nhịp tim của... người đi đường ngoài phố (Database bên ngoài).\n- Người đi đường bị mệt dừng lại thở dốc -> Bác sĩ tưởng bệnh nhân chết, liền lao vào giật điện tim làm bệnh nhân ngất thật (**Restart Pod liên tục thành CrashLoopBackOff**)!\n- Hãy để bác sĩ Liveness đo đúng tim của bệnh nhân!\n:::\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Nguyên tắc vàng của Liveness Probe**:\n   - `liveness`: **CHỈ KIỂM TRA CHÍNH TIẾN TRÌNH JAVA NỘI BỘ**.\n   - Tuyệt đối không để kiểm tra Database, Redis, Kafka lọt vào Liveness Probe.\n"
    },
    {
      "id": "7-2-4",
      "type": "synthesis",
      "title": "Bài 7.2.4: Tổng Kết Thực Chiến: Bản Đồ Kubernetes Zero-Downtime & Cấu Hình Actuator Health Probes",
      "minutes": 8,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Tổng hợp toàn bộ kiến thức Chuyên đề 7.2 thành Bản đồ Triển khai Kubernetes Zero-Downtime.\n- Nắm chắc cơ chế phối hợp giữa Spring Boot Actuator Health Groups và Kubernetes Rolling Update.\n- Thực hành checklist 5 bước kiểm tra pod trước khi đẩy traffic người dùng thật vào hệ thống.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BẢN ĐỒ ZERO-DOWNTIME\nTriển khai Zero-Downtime giống như việc tiếp nhiên liệu cho máy bay phản lực ngay trên không trung:\n- Máy bay chở khách (Pod v1 cũ) vẫn tiếp tục hành trình bay đều đặn, phục vụ hành khách ăn uống bình thường.\n- Máy bay tiếp dầu (Pod v2 mới) bay áp sát, kiểm tra mọi ống nối và áp suất an toàn tuyệt đối (Readiness Probe = UP).\n- Hành khách được chuyển sang khoang mới trong chớp mắt mà không hề cảm thấy một chút rung lắc nào!\n:::\n\n---\n\n## 1. Cái này là gì? (Bản Đồ Kiến Trúc Zero-Downtime)\n\n```mermaid\nflowchart LR\n    A[\"Kubernetes Ingress\"] --> B{\"Pod Readiness State\"}\n    B -->|\"Readiness = UP\"| C[\"Pod v2 Mới: Nhận 100% Traffic\"]\n    B -->|\"Readiness = DOWN\"| D[\"Pod v1 Cũ: Tiếp tục phục vụ\"]\n    C --> E[\"Gửi tín hiệu SIGTERM cho Pod v1\"]\n    E --> F[\"Graceful Shutdown hoàn tất sau 30s\"]\n    style C fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n    style D fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Bảng Quyết Định Kỹ Thuật ADR)\n\n| Tham số cấu hình | Giá trị khuyến nghị | Lý do kiến trúc |\n|---|---|---|\n| `server.shutdown` | `graceful` | Đợi các request dở dang xử lý xong |\n| `timeout-per-shutdown-phase` | `30s` | Tránh giữ pod quá lâu làm nghẽn tiến trình rollout |\n| `readinessProbe.failureThreshold` | `2` | Phát hiện lỗi kịp thời để ngừng chuyển traffic |\n"
    },
    {
      "id": "7-3-1",
      "type": "theory",
      "title": "Bài 7.3.1: Kiến trúc Quan Sát Tam Giác Vàng (Metrics, Traces, Logs) & W3C Distributed Tracing",
      "minutes": 8,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải mã **Tam giác vàng của Hệ thống Quan sát (Observability Triad)**: Metrics, Traces và Logs.\n- Hiểu chuẩn quốc tế **W3C Trace Context**: Tiêu chuẩn truyền tải `traceparent` (`traceId`, `spanId`) xuyên suốt hàng chục microservices.\n- Tích hợp **Micrometer Tracing** (thay thế cho Spring Cloud Sleuth trên Spring Boot 3).\n- Đọc hiểu 100% sơ đồ vết vết dòng chảy dữ liệu qua Bảng giải mã chi tiết.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TAM GIÁC VÀNG VÀ TRACE ID\n**Hình tượng \"Điều tra một vụ tắc đường trong thành phố\":**\n1. **Metrics (Bảng điện tử báo số liệu)**: Cho bạn biết: *\"Tốc độ trung bình trên đường đang giảm từ 60km/h xuống còn 5km/h!\"* (CPU tăng cao, độ trễ tăng từ 50ms lên 2,000ms). Bạn biết **CÓ VẤN ĐỀ ĐANG XẢY RA**.\n2. **Logs (Cuốn sổ ghi chép từng vụ va chạm)**: Ghi lại chi tiết: *\"Lúc 14:02, xe tải A va quẹt xe con B tại ngã tư X\"*.\n3. **Traces & Trace ID (Chiếc camera định vị hành trình xuyên suốt)**:\n   - Một chiếc xe (HTTP Request) đi từ cổng thành phố (Gateway) -> Sang phố Hàng Bông (Order Service) -> Sang phố Tràng Tiền (Payment Service).\n   - Mỗi chiếc xe được dán một con tem duy nhất mang tên **`TraceId = a1b2c3d4`**.\n   - Dù xe đi qua bao nhiêu phố, camera chỉ cần gõ đúng mã TraceId là soi ra chính xác: **Nó bị dừng đèn đỏ kẹt xe ở đoạn nào mất bao nhiêu giây**!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến trúc W3C Trace Context)\n\nMỗi request khi đi vào hệ thống được gắn một header chuẩn W3C `traceparent`:\n```\ntraceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01\n              │  └───────────────┬───────────────┘  └───────┬──────┘  └─ Flags\n           Version             Trace ID                  Span ID\n```\n\n### Sơ Đồ Lan Truyền Trace ID Qua Các Microservices:\n\n```mermaid\nsequenceDiagram\n    participant Client\n    participant GW as API Gateway (Trace: 4bf92...)\n    participant Ord as Order Service (Trace: 4bf92...)\n    participant Pay as Payment Service (Trace: 4bf92...)\n    \n    Client->>GW: 1. POST /orders\n    GW->>Ord: 2. Chuyển tiếp kèm Header traceparent: 4bf92... (Span: s1)\n    Ord->>Pay: 3. Gọi trừ tiền kèm traceparent: 4bf92... (Span: s2)\n    Note over GW,Pay: TOÀN BỘ 3 DỊCH VỤ CÙNG CHIA SẺ CHUNG 1 TRACE ID DUY NHẤT!\n```\n\n\n\n### Ma Trận Tam Giác Vàng Quan Sát Hệ Thống (Observability Triad):\n\n| Trụ cột quan sát | Công nghệ tiêu chuẩn | Bản chất dữ liệu | Câu hỏi trả lời trong sự cố |\n|---|---|---|---|\n| **Metrics (Đo lường)** | Micrometer + Prometheus | Dữ liệu chuỗi thời gian số học (CPU, RAM, RPS, P99 Latency) | *\"Hệ thống có đang hoạt động bất thường không? Đang nghẽn ở đâu?\"* |\n| **Distributed Tracing** | OpenTelemetry + Zipkin/Tempo | Chuỗi liên kết Span với `trace_id` và `span_id` theo chuẩn W3C | *\"Request đặt hàng số 102 bị chậm ở service nào? Gọi DB mất bao nhiêu ms?\"* |\n| **Structured Logging** | Logback JSON + Grafana Loki / ELK | Nhật ký sự kiện chi tiết kèm ngữ cảnh lỗi (`orderId`, `userId`) | *\"Tại sao đơn hàng bị từ chối? Ngoại lệ cụ thể là gì?\"* |\n"
    },
    {
      "id": "7-3-2",
      "type": "practice",
      "title": "Bài 7.3.2: Tích hợp Micrometer Prometheus, OpenTelemetry Zipkin & Kịch Bản Load Test k6",
      "minutes": 8,
      "content": "\n### Sơ Đồ Kiến Trúc: Hạ Tầng Quan Sát Phân Tán Với Prometheus, Zipkin & Load Test k6\n\n```mermaid\nflowchart LR\n    K6[\"🚦 k6 Load Test (1.000 VUs)\"] --> Gateway[\"🛡️ Spring Cloud Gateway\"]\n    Gateway --> OrderSvc[\"📦 Order Microservice\"]\n    OrderSvc --> PaySvc[\"💳 Payment Microservice\"]\n\n    subgraph METRICS_PIPELINE [\"1. Luồng Chỉ Số Định Lượng (Metrics)\"]\n        OrderSvc -->|Micrometer /actuator/prometheus| Prom[(\"📊 Prometheus Server\")]\n        PaySvc -->|Micrometer /actuator/prometheus| Prom\n        Prom --> GrafanaM[\"📈 Grafana Dashboard (RPS, Latency P99)\"]\n    end\n\n    subgraph TRACING_PIPELINE [\"2. Luồng Vết Phân Tán (Tracing W3C)\"]\n        Gateway -.->|W3C traceparent header| OrderSvc\n        OrderSvc -.->|W3C traceparent header| PaySvc\n        OrderSvc -->|OTel Traces Export| Zipkin[(\"🕵️ Zipkin / Tempo Server\")]\n        PaySvc -->|OTel Traces Export| Zipkin\n        Zipkin --> GrafanaT[\"🔍 Grafana Trace View (End-to-End Latency)\"]\n    end\n\n    style METRICS_PIPELINE fill:#0f172a,stroke:#38bdf8,color:#fff\n    style TRACING_PIPELINE fill:#1e1b4b,stroke:#a855f7,color:#fff\n```\n\n### Bảng Phân Tích Cấu Hình Observability Trong Spring Boot 3:\n\n| Tham số cấu hình | Giá trị chuẩn | Ý nghĩa kỹ thuật |\n|---|---|---|\n| `management.tracing.sampling.probability` | `0.1` (10%) | Lấy mẫu 10% request trên Production để giảm chi phí lưu trữ và CPU |\n| `management.endpoints.web.exposure.include` | `health,prometheus,metrics` | Chỉ mở các endpoint an toàn phục vụ việc cào dữ liệu giám sát |\n| `management.metrics.distribution.percentiles-histogram.http.server.requests` | `true` | Kích hoạt biểu đồ phân bổ độ trễ (Histogram) để tính chính xác SLA P95/P99 |\n\n\n\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Cấu hình xuất khẩu Metrics chuẩn Prometheus (`/actuator/prometheus`) cho Grafana Dashboard.\n- Tích hợp Micrometer Tracing xuất Trace dữ liệu về Zipkin / OpenTelemetry Collector.\n- Viết kịch bản kiểm thử tải áp lực cao (Load Testing) bằng công cụ hiện đại **k6**.\n- Đọc hiểu 100% từng dòng cấu hình và biểu đồ tải qua Bảng giải mã chi tiết.\n:::\n\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: THỬ TẢI CHIẾC CẦU TREO BẰNG ĐOÀN XE TẢI\n- Trước khi khánh thành chiếc cầu dây văng lớn nhất thành phố:\n- Ban quản lý cho 100 chiếc xe tải chở đầy đá cùng lúc chạy lên cầu (**k6 Load Test**).\n- Máy đo độ rung (Prometheus) và cảm biến dây cáp (OpenTelemetry) đo đạc từng milimet võng của thân cầu.\n- Khi vượt qua bài kiểm tra khắc nghiệt này, chiếc cầu mới được phép mở cửa cho người dân lưu thông an toàn!\n:::\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)\n\nKịch bản Load Test với công cụ k6 (`load-test.js`):\n\n```javascript\nimport http from 'k6/http';\nimport { check, sleep } from 'k6';\n\nexport const options = {\n  stages: [\n    { duration: '30s', target: 50 },  // Tăng dần lên 50 người dùng đồng thời\n    { duration: '1m', target: 100 },  // Duy trì tải 100 người\n    { duration: '30s', target: 0 },    // Hạ nhiệt\n  ],\n  thresholds: {\n    http_req_duration: ['p(95)<500'],  // 95% request phải phản hồi dưới 500ms\n    http_req_failed: ['rate<0.01'],    // Tỷ lệ lỗi phải dưới 1%\n  },\n};\n\nexport default function () {\n  const payload = JSON.stringify({\n    customerId: 'CUST-PERF',\n    totalAmount: 250000,\n  });\n\n  const params = {\n    headers: { 'Content-Type': 'application/json' },\n  };\n\n  const res = http.post('http://localhost:8080/api/v1/orders', payload, params);\n  check(res, {\n    'status is 201': (r) => r.status === 201,\n  });\n  sleep(0.1);\n}\n```\n"
    },
    {
      "id": "7-3-3",
      "type": "pitfall",
      "title": "Bài 7.3.3: Cạm bẫy Cardinality Explosion Làm Nổ RAM Prometheus & Mất Trace ID Qua Thread Mới",
      "minutes": 7,
      "content": "\n### Sơ Đồ Cảnh Báo: Bùng Nổ Số Chiều (Cardinality Explosion) Gây Sập RAM Prometheus\n\n```mermaid\nflowchart TD\n    subgraph BAD_PRACTICE [\"❌ SAI LẦM: GẮN THẺ UNIQUE VÀO METRIC\"]\n        Req1[\"Request 1\"] --> M1[\"orders_created_total{order_id='ORD-000001'}\"]\n        Req2[\"Request 2\"] --> M2[\"orders_created_total{order_id='ORD-000002'}\"]\n        ReqN[\"Request 1.000.000\"] --> MN[\"orders_created_total{order_id='ORD-1000000'}\"]\n        MN --> PromCrash[\"💥 Prometheus nổ tung bộ nhớ RAM (OOM Crash)!\"]\n    end\n\n    subgraph GOOD_PRACTICE [\"✅ CHUẨN SENIOR: CHỈ DÙNG THẺ LOW-CARDINALITY\"]\n        GoodReq[\"1.000.000 Đơn hàng\"] --> GoodM1[\"orders_created_total{status='SUCCESS'}\"]\n        GoodReq --> GoodM2[\"orders_created_total{status='FAILED'}\"]\n        GoodReq --> GoodM3[\"orders_created_total{payment_method='MOMO'}\"]\n        GoodM3 --> PromSafe[\"⚡ Chỉ có đúng 6 chuỗi thời gian -> RAM Prometheus cực nhẹ!\"]\n    end\n\n    style BAD_PRACTICE fill:#7f1d1d,stroke:#ef4444,color:#fff\n    style GOOD_PRACTICE fill:#064e3b,stroke:#10b981,color:#fff\n```\n\n### Bảng Ma Trận Phân Biệt Thẻ Giám Sát Nên & Không Nên Dùng:\n\n| Loại Thẻ (Tag/Label) | Ví dụ giá trị | Mức độ Cardinality | Khuyến nghị sử dụng |\n|---|---|---|---|\n| **Mã đơn hàng (`order_id`)** | ORD-98124, ORD-98125... | Vô hạn ($O(N)$) | ❌ **TUYỆT ĐỐI CẤM** (Nổ RAM Prometheus) |\n| **Email / User ID** | nam@gmail.com, 10293 | Hàng triệu giá trị | ❌ **TUYỆT ĐỐI CẤM** (Đưa vào Trace/Log thay thế) |\n| **Trạng thái HTTP / Nghiệp vụ** | `200`, `400`, `500`, `SUCCESS` | Rất thấp (3 - 10 giá trị) | ⭐⭐⭐ **Khuyên dùng tuyệt đối** |\n| **Phương thức thanh toán** | `VNPAY`, `MOMO`, `COD` | Rất thấp (3 - 5 giá trị) | ⭐⭐⭐ **Khuyên dùng tuyệt đối** |\n\n\n\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải mã lỗi nổ bộ nhớ Prometheus: **Cardinality Explosion** khi gắn giá trị biến thiên (User ID, Order Code) vào Metrics Tag/Label.\n- Xử lý hiện tượng mất `TraceId` khi chuyển tác vụ sang thread mới (`@Async` hoặc `CompletableFuture`).\n- Sử dụng `ContextSnapshot` của Micrometer Context Propagation để truyền TraceContext đa luồng.\n:::\n\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: IN DANH THIẾP CHO TỪNG HẠT CÁT BỜ BIỂN\n- Bạn muốn đếm xem có bao nhiêu người đi dạo trên bãi biển:\n- Cách đúng: Bạn chỉ cần đếm: *\"Có 500 nam, 600 nữ\"* (2 chiếc nhãn hữu hạn: Gender = Male / Female).\n- Cách tai hại (Cardinality Explosion): Bạn đòi in một chiếc thẻ tên riêng biệt cho từng hạt cát mà người đó giẫm lên (Gắn `userId = 12345` vào Prometheus Tag)!\n- Sau 1 ngày, bạn phải in 1 tỷ chiếc thẻ tên -> Kho giấy của bạn nổ tung vì không còn chỗ chứa!\n:::\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Tuyệt đối không đưa User ID vào Metric Tag**:\n   - Nếu có 1 triệu khách, Prometheus sẽ phải tạo ra 1 triệu chuỗi thời gian (Time-series) riêng biệt -> Nổ tung RAM server giám sát!\n   - Tag chỉ được chứa các giá trị hữu hạn (VD: `status = 200, 400, 500`, `method = GET, POST`).\n"
    },
    {
      "id": "7-3-4",
      "type": "synthesis",
      "title": "Bài 7.3.4: Tổng Kết Thực Chiến: Bản Đồ Giám Sát Phân Tán Prometheus & OpenTelemetry Distributed Tracing",
      "minutes": 8,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Tổng hợp toàn bộ kiến thức Chuyên đề 7.3 thành Bản đồ Giám sát Toàn diện Tam giác vàng (Metrics, Logs, Traces).\n- Nắm chắc cơ chế thu thập dữ liệu bằng Prometheus, OpenTelemetry Collector và hiển thị trên Grafana Dashboard.\n- Thiết lập cảnh báo tự động (Alerting Rules) khi tỷ lệ lỗi HTTP 5xx vượt quá ngưỡng 1%.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BẢN ĐỒ GIÁM SÁT TOÀN DIỆN\nHãy tưởng tượng hệ thống Microservices của bạn là một con tàu vũ trụ hiện đại:\n- **Prometheus** là bảng đồng hồ đo tốc độ, áp suất nhiên liệu và nhiệt độ buồng đốt (Metrics).\n- **OpenTelemetry & Zipkin** là camera hành trình theo dõi vết tích từng hạt photon bay qua các khoang tàu (Distributed Tracing).\n- **Grafana** là màn hình hiển thị toàn cảnh tại trung tâm chỉ huy mặt đất NASA (Dashboard).\nBất kỳ sự cố nào xảy ra, kỹ sư trưởng đều định vị chính xác vị trí chỉ trong vài giây!\n:::\n\n---\n\n## 1. Cái này là gì? (Bản Đồ Kiến Trúc Giám Sát Toàn Cảnh)\n\n```mermaid\nflowchart TD\n    APP[\"Spring Boot Microservices (:8080)\"] -->|\"Metrics: /actuator/prometheus\"| PROM[\"Prometheus Server (:9090)\"]\n    APP -->|\"Traces: W3C TraceContext\"| OTEL[\"OpenTelemetry Collector / Zipkin (:9411)\"]\n    PROM --> GRAF[\"Grafana Dashboard Enterprise\"]\n    OTEL --> GRAF\n    GRAF --> ALERT[\"Alertmanager (Telegram / PagerDuty Alert)\"]\n    style GRAF fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n    style APP fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff\n```\n"
    },
    {
      "id": "7-4-1",
      "type": "theory",
      "title": "Bài 7.4.1: Kiến trúc Tổng Thể Capstone: E-Commerce Order & Payment Distributed System",
      "minutes": 8,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Tổng hợp toàn bộ 8 Module thành một Bản Thiết Kế Kiến Trúc Thống Nhất (Unified Architecture Blueprint).\n- Định hình sơ đồ tương tác giữa 4 dịch vụ cốt lõi: **API Gateway**, **Order Service**, **Payment Service** và **Inventory Service**.\n- Nắm chắc các chỉ số cam kết chất lượng dịch vụ: SLA 99.99%, P99 Latency < 200ms.\n- Sẵn sàng bước vào đợt bảo vệ đồ án tốt nghiệp cấp độ Architect.\n:::\n\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TRUNG TÂM THƯƠNG MẠI THÔNG MINH 5 TẦNG\nToàn bộ khóa học kết tinh thành một tòa cao ốc mua sắm hiện đại:\n- **Tầng 1 (Gateway)**: Cổng kiểm soát an ninh tự động nhận diện khuôn mặt và điều tiết lưu lượng khách.\n- **Tầng 2 (Order)**: Quầy tiếp nhận đơn hàng với sổ cái kế toán kép không thể bị làm giả.\n- **Tầng 3 (Payment)**: Két sắt thanh toán đa kênh có bảo hiểm hoàn tiền tức thì.\n- **Tầng 4 (Inventory)**: Kho hàng robot tự động cập nhật số lượng từng giây.\n- **Tầng 5 (Control Tower)**: Tháp chỉ huy giám sát toàn cảnh bằng radar Prometheus và camera OpenTelemetry 24/7!\n:::\n\n---\n\n## 1. Cái này là gì? (Bản Vẽ Kiến Trúc Tổng Thể Toàn Khóa Học)\n\n```mermaid\nflowchart TD\n    CLIENT[\"Client (Web Next.js / Mobile Flutter)\"] -->|\"HTTPS / Cookie BFF\"| GW[\"Spring Cloud Gateway (BFF)<br/>[Resilience4j + Redis RateLimiter]\"]\n    \n    subgraph SECURITY[\"Bảo Mật & Quản Trị Danh Tính\"]\n        KC[\"Keycloak SSO (OAuth2 / OIDC)\"]\n    end\n    \n    GW <-->|\"Xác thực Token\"| KC\n    \n    subgraph SERVICES[\"Cụm Microservices Nghiệp Vụ\"]\n        ORD[\"Order Service (:8081)<br/>(Clean Arch, JPA, Flyway, Outbox)\"]\n        PAY[\"Payment Service (:8082)<br/>(Saga Participant, Redisson Lock)\"]\n        INV[\"Inventory Service (:8083)<br/>(Atomic Update, Idempotent Consumer)\"]\n    end\n    \n    GW --> ORD & PAY & INV\n    \n    subgraph ASYNC[\"Truyền Tin Bất Đồng Bộ\"]\n        KAFKA[\"Apache Kafka Broker<br/>(Topics: order.events, payment.events)\"]\n    end\n    \n    ORD -->|\"Transactional Outbox\"| KAFKA\n    KAFKA -->|\"Idempotent Consumer\"| INV\n    KAFKA -->|\"Idempotent Consumer\"| PAY\n    \n    subgraph OBSERVABILITY[\"Hạ Tầng Giám Sát Production\"]\n        PROM[\"Prometheus Metrics (:9090)\"]\n        ZIP[\"Zipkin / Jaeger Tracing (:9411)\"]\n        GRAF[\"Grafana Dashboard\"]\n    end\n    \n    ORD & PAY & INV & GW -.->|\"Export Metrics & Traces\"| PROM & ZIP\n    PROM & ZIP --> GRAF\n    style GW fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n    style KAFKA fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff\n    style KC fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff\n    style GRAF fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#fff\n```\n"
    },
    {
      "id": "7-4-2",
      "type": "practice",
      "title": "Bài 7.4.2: Triển khai Bộ Kiểm Thử Tự Động Toàn Diện: ArchUnit, Testcontainers & k6 Benchmark",
      "minutes": 8,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Thiết lập kịch bản chạy tự động toàn diện: Từ kiểm tra kiến trúc ArchUnit -> Kiểm thử Database thật Testcontainers -> Kiểm thử tải k6.\n- Đảm bảo đồ án Capstone vượt qua 100% tiêu chí kiểm định kỹ thuật khắt khe.\n- Đo lường và chứng minh khả năng chịu tải của hệ thống đạt 1,000 req/s với độ trễ P95 dưới 200ms.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BÀI SÁT HẠCH CUỐI CÙNG\nTrước khi một chiếc siêu xe được phép lăn bánh ra thị trường:\n1. **Kiểm tra bản vẽ thiết kế (ArchUnit)**: Khung gầm có đúng tiêu chuẩn an toàn không?\n2. **Kiểm tra va chạm thực tế (Testcontainers)**: Thử nghiệm trong đường hầm với động cơ và mặt đường thật 100%.\n3. **Chạy thử trên đường đua khắc nghiệt (k6 Load Test)**: Đạp hết ga với 1,000 mã lực để khẳng định xe không bị nổ lốp hay quá nhiệt!\nVượt qua cả 3 bài test này, đồ án của bạn xứng đáng nhận điểm tuyệt đối!\n:::\n\n---\n\n## 1. Cái này là gì? (Quy Trình Kiểm Định Toàn Diện Capstone)\n\n```mermaid\nflowchart LR\n    A[\"1. ArchUnit Test<br/>(Kiểm tra Clean Arch: 1s)\"] --> B[\"2. Testcontainers Test<br/>(PostgreSQL + Redis thật: 5s)\"]\n    B --> C[\"3. Docker Multi-Stage Build<br/>(Đóng gói Image 120MB)\"]\n    C --> D[\"4. k6 Performance Benchmark<br/>(1,000 req/s P95 < 200ms)\"]\n    D --> PASS[\"TỐT NGHIỆP XUẤT SẮC CHUẨN ARCHITECT!\"]\n    style PASS fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n    style A fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff\n```\n\n\n\n### Ma Trận Cổng Kiểm Định Chất Lượng Tự Động Hóa (CI/CD Quality Gates):\n\n| Cổng kiểm định | Công cụ thực thi | Tiêu chí vượt qua (Pass Criteria) | Hành động khi vi phạm |\n|---|---|---|---|\n| **Quy chuẩn Kiến trúc** | ArchUnit | 0 vi phạm ranh giới phân tầng Layered Architecture | Hủy build ngay lập tức lúc compile |\n| **Độ phủ Kiểm thử** | JaCoCo Unit Tests | Branch Coverage $ge 80%$, Instruction $ge 85%$ | Chặn tạo Pull Request trên GitHub |\n| **Tính Đúng Đắn DB** | Testcontainers PostgreSQL | 100% Migration script Flyway chạy thành công | Chặn merge code vào nhánh `main` |\n| **Chỉ số Hiệu năng** | k6 Load Benchmark | Độ trễ P99 $le 100\text{ms}$ tại 1.000 RPS, Error Rate $le 0.01%$ | Chặn deploy lên môi trường Production |\n"
    },
    {
      "id": "7-4-3",
      "type": "pitfall",
      "title": "Bài 7.4.3: Cạm bẫy Bỏ Qua Idempotency Khi Retry, Rò Rỉ Bí Mật Vault & Lỗi Đồng Bộ Trạng Thái",
      "minutes": 7,
      "content": "\n### Sơ Đồ Cơ Chế: Đảm Bảo Tính Bất Khả Biến (Idempotency) Khi Xử Lý Thử Lại\n\n```mermaid\nsequenceDiagram\n    autonumber\n    actor Client as 📱 Mobile App (Khách Hàng)\n    participant API as 🌐 Order Service\n    participant Redis as ⚡ Redis (Idempotency Store)\n    participant DB as 🗄️ Database\n\n    Client->>API: 1. Gửi lệnh thanh toán (Header: Idempotency-Key = \"req-uuid-999\")\n    API->>Redis: SET req-uuid-999 \"PROCESSING\" NX EX 120\n    Redis-->>API: OK (Khóa thành công)\n    API->>DB: Trừ tiền ví: 500,000 VND\n    Note over API: Sự cố rớt mạng 4G! Client không nhận được phản hồi!\n    \n    Note over Client,API: CLIENT GỬI LẠI REQUEST Y HỆT DO TIMEOUT\n    Client->>API: 2. Thử lại (Header: Idempotency-Key = \"req-uuid-999\")\n    API->>Redis: SET req-uuid-999 \"PROCESSING\" NX\n    Redis-->>API: FAIL (Key đã tồn tại!)\n    API->>Redis: GET req-uuid-999\n    Redis-->>API: Trả về kết quả giao dịch trước: { status: \"PAID\", amount: 500000 }\n    API-->>Client: 200 OK (Thành công, KHÔNG TRỪ TIỀN LẦN 2!)\n```\n\n### Bảng Ma Trận Cạm Bẫy Vận Hành Phân Tán & Kỹ Thuật Phòng Vệ:\n\n| Cạm bẫy thực tế | Hậu quả tai hại | Giải pháp kỹ thuật chuẩn Senior |\n|---|---|---|\n| **Bỏ qua Idempotency khi Retry** | Khách hàng bị trừ tiền 2 lần cho cùng 1 đơn hàng | Cơ chế `Idempotency-Key` kết hợp Redis Atomic Lock |\n| **Hardcode Secret Trong Git** | Rò rỉ thông tin mật khẩu DB, khóa API lên GitHub | Dùng HashiCorp Vault hoặc AWS Secrets Manager |\n| **Xung đột Thứ Tự Sự Kiện** | Sự kiện `ORDER_CANCELLED` đến trước `ORDER_CREATED` | Kỹ thuật Event Versioning & Out-of-Order Buffer |\n\n\n\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Rà soát các cạm bẫy cuối cùng trước khi đưa ứng dụng lên môi trường Production thật.\n- Quản lý bí mật mật khẩu cơ sở dữ liệu và JWT Private Key bằng **HashiCorp Vault / AWS Secrets Manager**.\n- Kiểm tra tính bền vững của cơ chế Retry khi gặp sự cố mạng ngắt quãng.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: BẢO VỆ CHÌA KHÓA KÉT SẮT\n**Hình tượng \"Không bao giờ dán mật khẩu két sắt lên tường\":**\n- Rất nhiều lập trình viên sơ ý commit file `application.yml` chứa mật khẩu database `postgres:123456` lên GitHub!\n- Chỉ sau 5 phút, các bot quét trên mạng sẽ tìm thấy và mã hóa tống tiền toàn bộ dữ liệu của công ty!\n- **HashiCorp Vault / AWS Secrets Manager**:\n  - Giống như chiếc két sắt bảo mật trung tâm.\n  - Ứng dụng Spring Boot khi khởi động chỉ cần xuất trình thẻ định danh (IAM Role / Token tạm thời).\n  - Két sắt tự động cấp phát mật khẩu và tự động đổi mật khẩu (Secret Rotation) sau mỗi 30 ngày mà không cần sửa code!\n:::\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Tuyệt đối không commit mật khẩu vào Git Repository**:\n   - Sử dụng biến môi trường hoặc Spring Cloud Vault.\n   - Thêm file `.env` và các file cấu hình bí mật vào `.gitignore`.\n"
    },
    {
      "id": "7-4-4",
      "type": "synthesis",
      "title": "Bài 7.4.4: Tổng Kết Thực Chiến: Đồ Án Tốt Nghiệp Capstone & Tiêu Chuẩn Bảo Vệ Kiến Trúc Sư Phần Mềm",
      "minutes": 8,
      "content": "\n### Sơ Đồ Kiến Trúc Tổng Thể: Đồ Án Tốt Nghiệp Capstone E-Commerce\n\n```mermaid\nflowchart TD\n    Client[\"📱 Client App (Web / Mobile)\"]\n    Gateway[\"🛡️ Spring Cloud Gateway<br/>(BFF Token Relay + Redis Rate Limiter)\"]\n    Keycloak[\"🏛️ Keycloak SSO Server<br/>(OAuth2 OIDC Provider)\"]\n\n    subgraph CORE_SERVICES [\"Cụm Dịch Vụ Nghiệp Vụ Cốt Lõi\"]\n        OrderSvc[\"📦 Order Service<br/>(Spring Boot 3 + Clean Arch)\"]\n        PaySvc[\"💳 Payment Service<br/>(Transactional Outbox)\"]\n        InvSvc[\"🏢 Inventory Service<br/>(Optimistic Lock @Version)\"]\n    end\n\n    Kafka[\"📨 Apache Kafka Message Broker<br/>(order-events, payment-events)\"]\n    \n    subgraph OBSERVABILITY [\"Hạ Tầng Giám Sát & Vận Hành Zero-Downtime\"]\n        Prom[(\"📊 Prometheus Metrics\")]\n        Zipkin[(\"🕵️ OpenTelemetry Tracing\")]\n        K8s[\"☸️ Kubernetes Cluster<br/>(Rolling Update + Probes)\"]\n    end\n\n    Client --> Gateway\n    Gateway <--> Keycloak\n    Gateway --> OrderSvc\n    Gateway --> PaySvc\n    Gateway --> InvSvc\n\n    OrderSvc <-->|Saga Events| Kafka\n    PaySvc <-->|Saga Events| Kafka\n    InvSvc <-->|Saga Events| Kafka\n\n    OrderSvc -.-> Prom\n    OrderSvc -.-> Zipkin\n    CORE_SERVICES -.-> K8s\n\n    style Gateway fill:#0f172a,stroke:#38bdf8,color:#fff\n    style CORE_SERVICES fill:#064e3b,stroke:#10b981,color:#fff\n    style OBSERVABILITY fill:#1e1b4b,stroke:#a855f7,color:#fff\n```\n\n### Bảng Tiêu Chuẩn Đánh Giá Đồ Án Tốt Nghiệp (Capstone Rubric):\n\n| Hạng mục đánh giá | Yêu cầu kỹ thuật bắt buộc | Trọng số điểm |\n|---|---|---|\n| **Clean Architecture & Code** | 100% Endpoint dùng Record DTO, ArchUnit cưỡng chế ranh giới | 25% |\n| **Tính Toàn Vẹn Giao Dịch** | Saga Orchestrator + Transactional Outbox + Xóa sổ Dual-write | 25% |\n| **Bảo Mật Chuẩn Doanh Nghiệp** | BFF Gateway che giấu Token, Keycloak RBAC, phòng chống XSS | 20% |\n| **Khả Năng Chịu Tải & Giám Sát** | k6 Load Test 1,000 RPS, Prometheus SLA P99 < 100ms, Tracing W3C | 15% |\n| **Đóng Gói & Kubernetes** | Docker Layered JAR < 180MB, Liveness/Readiness Probes chuẩn | 15% |\n\n\n\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Hoàn thành toàn diện chương trình đào tạo Kỹ Sư Spring Boot & Kiến Trúc Phân Tán (132 bài vi mô chuẩn CES-2026 v2.5).\n- Tự tin bảo vệ đồ án trước Hội đồng Kiến trúc sư (Architecture Review Board).\n- Nắm chắc điều kiện nhận chứng chỉ tốt nghiệp **DevMastery Verified — Spring Boot Architect**.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: LỜI CHÚC MỪNG TỐT NGHIỆP\nChúc mừng bạn đã chinh phục trọn vẹn toàn bộ 8 Module của khóa học!\nTừ những dòng code IoC/DI đầu tiên, bạn đã từng bước làm chủ:\n- Thiết kế REST API chuẩn RFC 7807.\n- Xóa bỏ triệt để lỗi N+1 Query và chống bán âm kho với Locking.\n- Viết kiểm thử tự động với Testcontainers PostgreSQL thật.\n- Xây dựng pháo đài bảo mật Stateless JWT kết hợp Keycloak SSO và BFF.\n- Vận hành kiến trúc phân tán với Redis Lock, Kafka Outbox, Saga Pattern.\n- Đóng gói Docker Layered JAR và triển khai Zero-Downtime trên Kubernetes!\nBạn không còn là một lập trình viên gõ code đơn thuần, bạn đã trở thành một **Kỹ sư Phần mềm Chuyên nghiệp mang tư duy Kiến trúc sư**!\n:::\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Checklist tốt nghiệp Toàn Khóa Học**:\n   - [ ] Hoàn thành 100% 132 bài học vi mô.\n   - [ ] Vượt qua các bài thi Quiz với điểm số $ge 80%$.\n   - [ ] Triển khai đồ án Capstone chạy mượt mà trên môi trường Docker Compose / Kubernetes.\n   - [ ] Nhận chứng chỉ **DevMastery Verified** vinh danh trên hồ sơ kỹ sư!\n"
    },
    {
      "id": "7-quiz",
      "type": "quiz",
      "title": "Quiz Module 7 — Sát Hạch Toàn Diện DevOps, Observability & Capstone",
      "questions": [
        {
          "level": "easy",
          "scenario": "Docker build CI LAAS mất 8 phút mỗi commit. Copy pom.xml + copy src + mvn package trong 1 layer duy nhất — sửa 1 dòng code vẫn kéo lại 100MB dependency.",
          "q": "Kỹ thuật Docker rút ngắn build đó?",
          "options": [
            "Thêm .dockerignore — ít file hơn nhanh hơn",
            "Layered jar (-Djarmode=layertools extract) + COPY dependencies trước, app code sau: dependency ít đổi được cache, sửa code chỉ rebuild layer mỏng",
            "Tăng CPU cho Jenkins agent",
            "Bỏ stage test khỏi Dockerfile — test chạy ngoài"
          ],
          "answer": 1,
          "explain": "Docker cache theo layer. Dependency 100MB+ ít đổi → cache hit gần như luôn; code đổi mỗi commit → chỉ layer application (vài MB) rebuild. Build 8 phút xuống ~30s. Multi-stage JDK build/JRE chạy là kỹ thuật riêng làm image nhỏ.",
          "why": [
            "dockerignore giúp (nếu đang copy rác) nhưng dependency layer vẫn rebuild mỗi lần code đổi — không giải quyết root cause là thứ tự layer.",
            "✓ Đúng — tách cái ÍT ĐỔI ra layer dưới, cái HAY ĐỔI ra layer trên: nguyên lý cache mọi build tool (Docker layer, Maven repo, npm cache).",
            "Tăng CPU giảm 8 phút xuống 5 phút — trả tiền hạ tầng cho vấn đề cấu trúc. Layer cache đưa về dưới 1 phút.",
            "Bỏ test trong image build là chuẩn (test chạy stage trước pipeline) — nhưng câu hỏi là build Image stage, không phải bỏ test tổng thể. Không liên quan layer cache."
          ]
        },
        {
          "level": "medium",
          "scenario": "Deploy LAAS lúc 2h sáng: pod mới khởi động Spring context 40s, DB pool chưa sẵn sàng, LB gửi traffic vào → user ăn lỗi 502 trong nửa phút đầu sau mỗi deploy.",
          "q": "Cơ chế K8s đúng cho vấn đề này?",
          "options": [
            "Liveness probe fail → restart container sớm hơn",
            "Readiness probe: pod chưa sẵn sàng → bị tách khỏi Service endpoints — LB không gửi traffic cho tới khi app báo 'ready' (DB connected, warm-up xong)",
            "Tăng replica +1 khi deploy — pod cũ gánh traffic",
            "Rollback deploy nếu thấy lỗi"
          ],
          "answer": 1,
          "explain": "Readiness trả lời 'sẵn sàng nhận traffic chưa?' — fail → endpoint bị bỏ khỏi pool (pod vẫn sống). Liveness trả lời 'process còn thở?' — fail → RESTART. App 40s khởi động là bình thường, readiness gate traffic đến khi sẵn sàng: 502 biến mất.",
          "why": [
            "Restart khi app đang KHỞI ĐỘNG bình thường là hành vi phá hoại — pod không bao giờ kịp ready, CrashLoopBackOff. Liveness phải chỉ fail khi process thật sự hỏng.",
            "✓ Đúng — tách nghĩa 2 probe là kiến thức nền: readiness = traffic gate, liveness = restart trigger. Spring Boot management.endpoint.health.probes.+group readiness (include db) phản ánh đúng trạng thái.",
            "Rolling update + maxSurge mặc định đã giữ pod cũ trong lúc pod mới lên — nếu vẫn 502 nghĩa là readiness KHÔNG được cấu hình đúng, LB vẫn bắn vào pod chưa ready.",
            "Rollback là phản ứng, không phải giải pháp — deploy sau lại gặp y hệt. Fix phải ở tầng probe/traffic management."
          ]
        },
        {
          "level": "hard",
          "scenario": "Investigate sự cố LAAS: log CloudWatch tìm 'request của user X đi qua gateway → task-service → Kafka'. Log rải rác không nối được — log thiếu correlationId xuyên suốt.",
          "q": "Chuẩn thực hành logging đúng cho hệ thống phân tán?",
          "options": [
            "Tăng log level DEBUG toàn service — nhiều thông tin hơn",
            "CorrelationId filter (MDC): sinh cid per request, forward qua header X-Correlation-Id service kế tiếp, JSON structured log — lọc 1 cid ra toàn bộ hành trình request",
            "Log toàn bộ request/response body mọi service",
            "Dùng traceId của JDBC driver"
          ],
          "answer": 1,
          "explain": "MDC (Mapped Diagnostic Context) gắn cid vào mọi log line trong phạm vi request; header X-Correlation-Id truyền qua service chain; JSON encoder cho CloudWatch query được. Trace riêng của OpenTelemetry cũng dùng chung tinh thần — correlatable records.",
          "why": [
            "DEBUG toàn hệ = nhiễu trắng cô đặc, chi phí I/O log khổng lồ, và VẪN không nối được log service A với service B nếu không có cid. Volume không thay thế correlation.",
            "✓ Đúng — '1 cái tên duy nhất cho 1 hành trình request' là nền của debugging phân tán. Kèm luật: MDC.clear() trong finally (thread reuse!), và cid trả về response header cho support đối chiếu.",
            "Log body = PII leak (số tài khoản, token) + volume dữ liệu khổng lồ. Có cid + metadata chọn lọc là đủ điều tra, body chỉ log khi có governance riêng.",
            "JDBC không có traceId chuẩn xuyên suốt application flow — công cụ sai tầng cho bài toán cross-service correlation."
          ]
        },
        {
          "level": "medium",
          "scenario": "Grafana LAAS: dashboard chỉ có CPU/Memory của pod. Incident production: user phàn nàn chậm nhưng CPU/Mem đều 'bình thường' — không tìm được manh mối.",
          "q": "Bộ 4 metric đầu tiên của Spring Boot service nên là gì?",
          "options": [
            "CPU, Memory, Disk I/O, Network",
            "http_server_requests (p95 latency + error rate per endpoint), hikaricp pool usage, JVM heap/GC pause, custom business counter",
            "Số dòng log/giây, số connection Redis, số topic Kafka, số pod",
            "Database size, table count, index usage, slow query log"
          ],
          "answer": 1,
          "explain": "RED method + JVM + business: latency p95 và error rate per URI cho biết user đang đau ở đâu; HikariCP active/pending cho biết nghẽn DB; heap/GC cho biết pressure bộ nhớ; business counter (transactions/earn) cho thấy symptom nghiệp vụ. CPU/Mem là hệ quả, không phải triệu chứng.",
          "why": [
            "Infra metric cần nhưng không đủ — chính là dashboard hiện tại: 'bình thường' mà user chậm. Triệu chứng user-experienced nằm ở HTTP metric, không phải resource usage.",
            "✓ Đúng — từ trên xuống: user cảm nhận (HTTP) → dependency bottleneck (pool) → runtime (JVM) → business reality (counter). Mỗi tầng một câu hỏi điều tra.",
            "Hổn hợp không có narrative — đếm dòng log/giây không trả lời 'user nào chậm ở endpoint nào'. Metric phải gắn với hypothesis điều tra.",
            "DB internal metric quý nhưng là tầng sâu — nếu HTTP p95 ổn thì khỏi đào. Bắt đầu từ nơi user chạm."
          ]
        },
        {
          "level": "hard",
          "scenario": "p99 latency LAAS đột biến. Log mỗi service đều sạch. Trace OpenTelemetry cho thấy: gateway span 3s, task-service span 2.9s, trong đó span 'Kafka producer send' chiếm 2.8s.",
          "q": "Trace giàu thông tin hơn log/metric ở điểm nào?",
          "options": [
            "Trace log nhiều hơn — thay thế logging",
            "Trace gắn timing các span XUYÊN SUỐT service + dependency: thấy ngay 3s tổng được cấu thành từ đâu (2.8s Kafka) — causality chain mà log rời rạc không tái hiện được",
            "Trace tự sửa lỗi — APM có AI auto-remediation",
            "Trace rẻ hơn metric — nên dùng thay thế"
          ],
          "answer": 1,
          "explain": "3 trụ cột bổ sung nhau: log = event chi tiết, metric = aggregate theo thời gian, trace = causal journey. Nghẽn 2.8s ở Kafka send (broker đáp ứng chậm? acks=all + network?) hiện ra trong 1 cái nhìn — không phải grep log 3 service rồi tự ghép timeline.",
          "why": [
            "Trace KHÔNG thay logging — trace không chứa business context chi tiết (stack trace, input). Ba trụ cột là squad: metric phát hiện CÓ vấn đề, trace chỉ ra Ở ĐÂU, log giải thích TẠI SAO.",
            "✓ Đúng — span tree với duration từng node: parent-child (gateway → service → kafka send) là biểu đồ quan hệ nhân quả trực quan. OpenTelemetry java agent instrumentation tự động mọi client phổ biến.",
            "Không có AI auto-fix trong OTel — observability là đèn pin, con người vẫn lái. Auto-remediation là sản phẩm riêng (khác category).",
            "Trace đắt hơn metric (sampled, backend storage) — vì thế strategy: metric 100%, trace sample 1-10%. Dùng đúng vai trò, không thay thế lẫn nhau."
          ]
        },
        {
          "level": "medium",
          "scenario": "Dev LAAS giữ Dockerfile cũ chạy root 'vì tiện ghi log ra host volume'. Security audit bắt buộc USER non-root.",
          "q": "Vì sao non-root là baseline bắt buộc?",
          "options": [
            "Chỉ để đẹp report audit — thực tế không khác biệt",
            "Container bị compromise (RCE qua dependency lỗi) → attacker có quyền root TRONG container; kết hợp container-escape/misconfig (mount host path, privileged) → leo thang lên host. Non-root chặn nhảy leo thang này",
            "Non-root chạy nhanh hơn — ít overhead permission check",
            "Kubernetes yêu cầu bắt buộc Pod Security Standards"
          ],
          "answer": 1,
          "explain": "Defense in depth: container không phải VM — kernel chia sẻ host. Quyền root trong container + lỗ hổng escape (runc CVE-2019-5736-style) = root host. Chặn ở tầng quyền hạn là lớp rẻ nhất: USER appuser trong Dockerfile + readOnlyRootFilesystem + drop capabilities.",
          "why": [
            "'Bình thường mới' là lý do audit tồn tại — attacker không cần 0-day nếu app đã chạy root sẵn. Baseline rẻ áp dụng sớm quý hơn incident đắt xử lý muộn.",
            "✓ Đúng — mô hình tấn công cụ thể: RCE → shell trong container → nếu root: đọc secret mounted, tamper filesystem, thử escape. Non-root + read-only fs + minimal caps thu hẹp từng bước.",
            "Permission check overhead không đáng kể — không phải lý do. Lý do là security posture, không phải performance.",
            "PSS restricted KHUYẾN NGHỊ non-root nhưng không tự enforce trên cluster cũ — baseline phải nằm trong artifact (image), không trông chờ policy runtime."
          ]
        },
        {
          "level": "hard",
          "scenario": "Tuần trước LAAS deploy lúc 18h. AM nhận alert ngay 19h: lỗi 500 tăng vọt. Cuối cùng điều tra ra: dependency mới (log4j-style) có CVE critical — image được scan duy nhất 1 lần khi mới thêm.",
          "q": "Gap trong pipeline và giải pháp?",
          "options": [
            "Deploy ban ngày để phát hiện nhanh hơn",
            "Scan định kỳ image trong registry (Trivy) + dependency-check mỗi build + renovate/dependabot tự PR nâng cấp + alert CVE mới trên image đang chạy",
            "Cấm dependency mới — chỉ dùng thư viện đã approve",
            "Cài antivirus trên Jenkins agent"
          ],
          "answer": 1,
          "explain": "CVE xuất hiện SAU khi thư viện đã được duyệt — scan 1 lần lúc thêm là snapshot chết. Cần: scan mỗi build (bắt mới khi PR), scan registry định kỳ (bắt CVE mới công bố trên image đang tồn tại), auto-PR nâng cấp (giảm friction sửa), runtime alert. Security là luồng liên tục không phải cổng một lần.",
          "why": [
            "Deploy ban ngày giảm thời gian phát hiện 1-2h — không giải quyết việc CVE tồn tại trong artifact. Symptom mitigation.",
            "✓ Đúng — 4 lớp phủ vòng đời: build-time (PR), registry (image tồn tại), upgrade flow (dep bot), runtime (alert). CVE pipeline-style: thời điểm công bố ≠ thời điểm thêm dependency.",
            "Cấm dependency mới làm khô héo dev velocity và vẫn không bắt CVE trong thư viện CŨ — log4shell nằm trong dependency có sẵn từ lâu. Chính sách sai chiều vấn đề.",
            "AV quét file thực thi truyền thống — không hiểu dependency JAR/CVE database của hệ sinh thái Maven. Công cụ sai loại cho bài toán supply chain Java."
          ]
        },
        {
          "level": "easy",
          "scenario": "Nhân viên mới hỏi senior LAAS: 'Pod đang CrashLoopBackOff. Em restart cluster là xong chứ gì?'",
          "q": "Bước debug đúng đắn đầu tiên?",
          "options": [
            "Restart node — sách giáo khoa nói container tự heal",
            "kubectl describe pod (Events: OOMKilled? ImagePullBackOff? Probe fail?) + kubectl logs --previous (log lần crash trước) — chẩn đoán trước, hành động sau",
            "Tăng memory limit ngay — crash thường là hết bộ nhớ",
            "Rollback image trước rồi tìm hiểu sau"
          ],
          "answer": 1,
          "explain": "CrashLoopBackOff là container crash lặp — RESTART ĐÃ diễn ra tự động và thất bại. describe cho biết lý do hạ tầng (OOM, image, probe), logs --previous cho biết exception application. Chẩn đoán 2 phút định hướng đúng: OOM → tăng limit/fix leak; probe fail → sửa probe; app exception → fix code.",
          "why": [
            "Container đã tự restart nhiều lần (đó là ý nghĩa CrashLoopBackOff) — restart node khi root cause là app exception chỉ reset vòng lặp. May mắn không phải chiến lược.",
            "✓ Đúng — kỷ luật điều tra: sự kiện hạ tầng (describe) + bằng chứng application (logs previous). 2 lệnh này phân loại được 90% trường hợp trước khi chạm bất cứ thứ gì.",
            "Tăng memory 'chắc ăn' là đốt symptom — nếu thực ra là NPE loop thì tăng memory không sửa gì mà che tín hiệu. Chỉ tăng khi OOMKilled được xác nhận.",
            "Rollback an toàn cho user (đúng khi urgent) nhưng phải kèm điều tra root cause — không phải 'rollback xong việc'. Câu hỏi hỏi bước ĐẦU TIÊN điều tra: hiểu trước."
          ]
        },
        {
          "level": "medium",
          "scenario": "Load test k6: 500 RPS đạt p99 600ms — mọi thresholds xanh, team chốt go-live. Đêm đầu production: 400 RPS thực tế nhưng p99 8s, error 5%. Giám sát cho thấy Hikari pool 50/50 active và hàng chục request chờ connection.",
          "q": "Bài học load test nào bị bỏ sót?",
          "options": [
            "Thiếu test 500 RPS — cần tăng tải test lên 1000 RPS cho chắc",
            "Chỉ test điểm ĐẠT, không tìm KNEE: pool 50 cạn ở đâu đó giữa 400-500 RPS тест đã dùng dataset nhỏ hơn nên lock ít hơn. Phải ramp vượt tải, corr pool/GC/CPU — và đối chiếu Little's Law: in-flight = RPS × latency vs pool size",
            "k6 không đủ tin cậy — đổi sang JMeter sẽ ra số đúng",
            "Production yếu hơn SIT — nâng CPU pod lên là xong"
          ],
          "answer": 1,
          "explain": "Threshold xanh ở MỘT điểm tải không nói gì về hành vi GẦN giới hạn. Pool 50 connection: 500 RPS × 0.5s = 250 in-flight trung bình ổn, nhưng p99 tail + dataset thật tăng thời gian giữ connection → 400 RPS thực đã bóp cạn pool. Vòng lặp đúng: ramp VƯỢT tải tìm knee, correlate với Grafana (pool active? GC pause? CPU throttle?), áp Little's Law đối chiếu in-flight với pool — thay vì chỉ chốt 'điểm xanh' và rời đi.",
          "why": [
            "Tăng tải nhưng vẫn chỉ 1 điểm — không hiểu ĐỈNH sụp ở đâu và vì sao",
            "✓ Knee + Little's Law: dự đoán trước chỗ sụp bằng số, không đợi đêm go-live",
            "Công cụ không phải biến số — kịch bản + phân tích kết quả mới là",
            "Nâng CPU không giải pool cạn — giới hạn nằm ở connection config"
          ]
        },
        {
          "level": "hard",
          "scenario": "Sau khi nâng cấp Spring Boot lên 3.3 chạy trên Java 21 với Virtual Threads enabled, ứng dụng bị đóng băng (hang) khi nhận tải cao. Kiểm tra CPU chỉ ở mức 3%, nhưng hàng ngàn request bị timeout.",
          "q": "Nguyên nhân cốt lõi và cách phát hiện hiện tượng này?",
          "options": [
            "Virtual Threads bị hiện tượng Pinning do một thư viện hoặc code nội bộ sử dụng khối synchronized bọc quanh tác vụ I/O chặn; Carrier Thread bị ghim chặt và không thể phục vụ Virtual Threads khác. Phát hiện bằng cờ -Djdk.tracePinnedThreads=short",
            "Virtual Threads tiêu tốn quá nhiều RAM làm tràn bộ nhớ Heap của hệ điều hành",
            "Tomcat 10 không hỗ trợ Virtual Threads, cần chuyển sang dùng Jetty hoặc Undertow",
            "Cần tăng số lượng CPU cores của máy chủ vật lý lên tối thiểu 64 cores"
          ],
          "answer": 0,
          "explain": "Khi Virtual Thread thực thi trong khối synchronized hoặc gọi native JNI method mà gặp tác vụ I/O chặn (như Socket read hoặc DB query), JVM không thể tháo dỡ (unmount) luồng này ra khỏi Carrier Thread (ForkJoinPool worker). Khi toàn bộ Carrier Threads bị ghim (pinned), hệ thống bị cạn kiệt luồng thực thi (carrier thread starvation). Cờ -Djdk.tracePinnedThreads=short sẽ in chính xác dòng code gây pinning để refactor sang ReentrantLock.",
          "why": [
            "✓ Đúng — Pinning là cạm bẫy lớn nhất khi áp dụng Java 21 Virtual Threads. Bắt buộc phải thay synchronized bằng ReentrantLock ở các vùng I/O.",
            "Virtual Thread cực kỳ nhẹ (chỉ vài trăm bytes), không thể làm tràn RAM so với Platform Thread 1MB.",
            "Spring Boot 3.2+ và Tomcat 10 tích hợp Virtual Threads native 100% qua spring.threads.virtual.enabled=true.",
            "Tăng CPU cores không giải quyết được vấn đề mã nguồn nếu mọi luồng đều bị ghim bởi synchronized I/O."
          ]
        },
        {
          "level": "hard",
          "scenario": "Container Spring Boot được cấp giới hạn bộ nhớ mem_limit: 1024M trong Docker Compose. Lập trình viên cấu hình cờ JVM: -Xmx1024m. Sau khi chạy vài giờ với tải trung bình, container đột ngột bị sập với Exit Code 137 mà không hề có OutOfMemoryError trong file log.",
          "q": "Tại sao container bị sập và cấu hình JVM chuẩn để khắc phục triệt để?",
          "options": [
            "Exit Code 137 do Linux OOM-Killer gửi SIGKILL vì tổng bộ nhớ tiến trình (Heap 1024MB + Metaspace + Netty Direct Memory + Thread Stacks) vượt quá giới hạn 1024MB của container. Khắc phục: Dùng -XX:MaxRAMPercentage=75.0 để Heap chỉ chiếm 75% RAM container",
            "Do ứng dụng bị lỗi đứt cáp mạng TCP giữa Docker và host",
            "Do Spring Boot không tương thích với Java 21 trên hệ điều hành Linux",
            "Cần tăng tham số -Xmx lên 2048m để JVM có thêm không gian hoạt động"
          ],
          "answer": 0,
          "explain": "Tổng bộ nhớ RSS mà Java tiến trình chiếm dụng bao gồm cả Heap và Off-Heap (Metaspace, Direct ByteBuffers, Thread Stacks, GC structures). Cấu hình -Xmx1024m làm riêng Heap đã chiếm trọn 1024MB, khi Off-Heap phát sinh thêm 200MB, Linux cgroups lập tức gửi SIGKILL (128 + 9 = 137). Cấu hình chuẩn là -XX:MaxRAMPercentage=75.0 để JVM tự động tính toán trần Heap an toàn.",
          "why": [
            "✓ Đúng — Bẫy kinh điển của container hóa Java. -XX:MaxRAMPercentage là cờ container-aware chuẩn của OpenJDK.",
            "Lỗi mạng không bao giờ làm container kết thúc với Exit Code 137 (SIGKILL).",
            "Spring Boot 3 và Java 21 là chuẩn LTS hiện đại nhất.",
            "Tăng -Xmx2048m trên container 1024M chỉ làm container bị OOM-Killer giết nhanh hơn gấp bội!"
          ]
        },
        {
          "level": "hard",
          "scenario": "Đội phát triển thêm metric tùy biến vào Micrometer: meterRegistry.counter(\"http_requests_total\", \"user_id\", userId). Sau 2 ngày chạy production, cụm Prometheus server bị crash liên tục vì cạn kiệt 64GB RAM.",
          "q": "Hiện tượng này tên là gì và nguyên tắc thiết kế metric chuẩn?",
          "options": [
            "Hiện tượng High-Cardinality: user_id có hàng triệu giá trị phân biệt làm Prometheus phải sinh ra hàng triệu Time Series riêng biệt trong RAM. Nguyên tắc: Metrics chỉ chứa tags có cardinality thấp (status, method); user_id phải để trong Logs (MDC) hoặc Tracing",
            "Do Prometheus client trong Spring Boot bị memory leak",
            "Do cổng /actuator/prometheus bị cào quá nhiều lần trong 1 giây",
            "Cần chuyển sang dùng Graphite thay thế Prometheus"
          ],
          "answer": 0,
          "explain": "Mỗi tổ hợp cặp key-value duy nhất của tag/label tạo thành một Time Series riêng trong cơ sở dữ liệu thời gian của Prometheus. Với 1 triệu users, số lượng Time Series bùng nổ (High Cardinality Explosion) làm cạn kiệt RAM Prometheus. Dữ liệu định danh duy nhất (UUID, ID người dùng, Order ID) thuộc về Logs và Traces, tuyệt đối không được đưa vào Metrics tags.",
          "why": [
            "✓ Đúng — High Cardinality là nguyên nhân số 1 làm sập hệ thống giám sát Prometheus. Tag phải luôn có miền giá trị hữu hạn nhỏ.",
            "Không phải lỗi của client library mà do thiết kế data model sai lầm của kỹ sư.",
            "Tần số scrape không làm tăng số lượng time series lưu trong RAM của Prometheus.",
            "Graphite hay bất kỳ TSDB nào khác cũng sẽ bị quá tải khi phải quản lý hàng triệu Time Series bùng nổ."
          ]
        },
        {
          "level": "hard",
          "scenario": "Khi triển khai Spring Boot trên Kubernetes, nếu cấu hình Liveness Probe trỏ vào một endpoint kiểm tra kết nối Database PostgreSQL, điều gì sẽ xảy ra khi Database tạm thời bị quá tải chậm phản hồi trong 10 giây?",
          "q": "Hậu quả thảm họa nào sẽ xuất hiện trên cụm Kubernetes?",
          "options": [
            "Kubelet thấy Liveness fail và tự động kill pod rồi restart hàng loạt, tạo thành một cơn bão restart CrashLoopBackOff trên toàn cụm làm sập hoàn toàn hệ thống",
            "Kubernetes sẽ tự động khởi động một database mới",
            "Pod sẽ tự động ngắt kết nối với client một cách an toàn",
            "Không có ảnh hưởng nào vì Kubernetes bỏ qua lỗi Liveness"
          ],
          "answer": 0,
          "explain": "Liveness Probe chỉ nên kiểm tra sức khỏe nội bộ của JVM (deadlock, out of memory). Nếu DB chậm mà Liveness fail, K8s sẽ restart pod liên tục, trong khi việc restart pod hoàn toàn không giúp DB nhanh hơn mà chỉ làm tăng gánh nặng khởi động lên hệ thống.",
          "why": [
            "✓ Đúng — Đây là cạm bẫy cấu hình K8s kinh điển nhất của các kỹ sư backend.",
            "Kubelet chỉ quản lý container, không tự động sinh database mới.",
            "Restart đột ngột làm ngắt kết nối thô bạo thay vì an toàn.",
            "Kubelet luôn thực thi hành động restart khi Liveness fail quá threshold."
          ]
        },
        {
          "level": "hard",
          "scenario": "Một ứng dụng Spring Boot chạy trong container bị Linux OOM-Killer tiêu diệt đột ngột giữa đêm dù tổng kích thước Heap Memory (-Xmx) chỉ chiếm 60% giới hạn RAM của container.",
          "q": "Nguyên nhân kỹ thuật nào khiến tổng bộ nhớ của tiến trình Java vượt quá giới hạn (limit) của container?",
          "options": [
            "Ngoài Heap Memory, JVM còn sử dụng Non-Heap Memory đáng kể (Metaspace, Thread Stacks, Direct Memory cho Netty I/O, Code Cache và bộ nhớ của chính JVM runtime C++)",
            "Do hệ điều hành Linux bị lỗi bộ nhớ ảo",
            "Do người dùng gửi quá nhiều request HTTP GET",
            "Do Docker container bị rò rỉ dung lượng ổ cứng"
          ],
          "answer": 0,
          "explain": "JVM Memory = Heap + Non-Heap (Metaspace + Thread Stack + Direct Memory + Code Cache + Native Memory). Nếu container có 1GB RAM mà đặt -Xmx800MB, lượng Non-heap và thread stack (1MB/thread x 200 threads = 200MB) sẽ đẩy tổng bộ nhớ vượt 1GB, kích hoạt Linux OOM-Killer tiêu diệt pod ngay lập tức.",
          "why": [
            "✓ Đúng — Hiểu rõ cấu trúc bộ nhớ Non-Heap là kiến thức sống còn của kỹ sư vận hành Production.",
            "Linux OOM-Killer hoạt động hoàn toàn chính xác theo cơ chế cgroups.",
            "Request GET bình thường chỉ chiếm heap rác ngắn hạn, không làm tăng native memory nếu không rò rỉ.",
            "OOM-Killer tiêu diệt tiến trình dựa trên RAM, không liên quan đến ổ cứng."
          ]
        },
        {
          "level": "medium",
          "scenario": "Khi đóng gói ứng dụng Spring Boot 3 vào Docker image, kỹ thuật nào giúp Docker chỉ cần build lại lớp mã nguồn ứng dụng (vài trăm KB) thay vì phải tải lại toàn bộ file Fat JAR (hàng trăm MB) ở mỗi lần sửa code?",
          "q": "Tính năng nào của Spring Boot Maven Plugin hỗ trợ tối ưu hóa này?",
          "options": [
            "Tính năng Spring Boot Layered JAR (spring-boot:layers) phân tách các tầng dependencies, loader và application",
            "Tính năng nén file ZIP của hệ điều hành",
            "Tính năng mã hóa bảo mật ProGuard",
            "Tính năng Docker Commit"
          ],
          "answer": 0,
          "explain": "Spring Boot Layered JAR bóc tách file fat JAR thành 4 layer riêng biệt. Trong Dockerfile, các layer thư viện ít đổi (dependencies) được copy trước và được Docker cache lại, chỉ có layer application mới bị build lại, giúp tối ưu hóa thời gian build CI/CD từ vài phút xuống vài giây.",
          "why": [
            "✓ Đúng — Layered JAR là tiêu chuẩn đóng gói container hiện đại của Spring Boot.",
            "Nén zip không giúp Docker tận dụng được layer caching.",
            "ProGuard dùng để obfuscate code, không phân tách layer container.",
            "Docker commit là lệnh lưu container thủ công, không dùng trong CI/CD."
          ]
        },
        {
          "level": "medium",
          "scenario": "Khi một dịch vụ Microservices bị quá tải, lệnh gọi đến một dịch vụ bên thứ ba bị treo quá 30 giây khiến các worker thread của Tomcat bị cạn kiệt.",
          "q": "Pattern tự phục hồi nào giúp ngắt kết nối tức thì và trả về Fallback ngay lập tức mà không cần chờ timeout khi phát hiện dịch vụ đích đang bị sự cố?",
          "options": [
            "Circuit Breaker Pattern (thực hiện qua thư viện Resilience4j)",
            "Singleton Pattern",
            "Factory Pattern",
            "Decorator Pattern"
          ],
          "answer": 0,
          "explain": "Circuit Breaker theo dõi tỷ lệ lỗi của các lệnh gọi mạng. Khi tỷ lệ lỗi vượt ngưỡng, Circuit Breaker chuyển sang trạng thái OPEN và ngắt ngay các lệnh gọi tiếp theo (Fail-Fast), trả về phản hồi fallback trong 0ms để giải phóng thread cho hệ thống.",
          "why": [
            "✓ Đúng — Circuit Breaker là mẫu thiết kế tự phục hồi quan trọng nhất trong kiến trúc phân tán.",
            "Singleton quản lý instance đơn lẻ, không liên quan đến fault tolerance.",
            "Factory là creational pattern dùng để tạo object.",
            "Decorator dùng để mở rộng hành vi của object."
          ]
        }
      ]
    }
  ]
}
);
