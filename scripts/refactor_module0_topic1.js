const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module0.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m0 = window.COURSE_MODULES.find(m => m.id === 0);

// Update Module 0 Header & Topics to be 100% Spring Boot 3 focused
m0.title = "Khởi Động Spring Boot 3 & Kiến Trúc Dự Án Enterprise";
m0.subtitle = "Spring Initializr, Modern Java 21 for Boot & Multi-Module Architecture";
m0.desc = "Khóa học khởi động tập trung 100% vào Spring Boot 3: Cài đặt JDK 21 LTS, khởi tạo dự án Spring Boot 3 chuẩn mực với Spring Initializr, làm chủ các tính năng Java 21 hiện đại (Record, Sealed, Stream) ứng dụng trực tiếp trong Spring Boot Service, và tổ chức dự án đa module (Maven Multi-Module) chuẩn Enterprise.";

m0.topics = [
  {
    id: 1,
    title: "Khởi Tạo Dự Án Spring Boot 3 & Cấu Hình Môi Trường Enterprise",
    desc: "Cài đặt JDK 21 LTS, khởi tạo dự án Spring Boot 3 qua Spring Initializr, thực thi Maven Wrapper và khắc phục lỗi môi trường."
  },
  {
    id: 2,
    title: "Modern Java 21 Trong Xử Lý Nghiệp Vụ Spring Boot (Record & Stream)",
    desc: "Ứng dụng Record làm DTO bất biến, xử lý Stream Pipeline trong Service, và cạm bẫy ForkJoinPool khi xử lý đơn hàng."
  },
  {
    id: 3,
    title: "Data-Oriented Programming & State Machine trong Spring Boot Domain",
    desc: "Sealed Interface mô hình hóa trạng thái đơn hàng & phương thức thanh toán, Pattern Matching switch và cạm bẫy Shallow Immutability."
  },
  {
    id: 4,
    title: "Kiến Trúc Dự Án Spring Boot Đa Phân Tầng với Apache Maven Multi-Module",
    desc: "Cấu trúc dự án đa phân tầng (Root, Common, Domain, Service, Web API), giải quyết xung đột Jar Hell và đóng gói Spring Boot Plugin."
  }
];

// Refactor Lesson 0-1-1
const l011 = m0.lessons.find(l => l.id === "0-1-1");
if (l011) {
  l011.title = "Bài 0.1.1: Cài đặt JDK 21 LTS & Khởi tạo dự án Spring Boot 3 qua Spring Initializr";
  l011.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu tại sao Spring Boot 3 bắt buộc phải chạy trên nền Java 17/21 LTS (chuyển dịch từ javax.* sang jakarta.*).
- Nắm chắc cơ chế khởi tạo dự án Spring Boot qua Spring Initializr (start.spring.io) với các dependency cốt lõi.
- Phân biệt vai trò của JVM, JRE và JDK 21 trong quy trình biên dịch và thực thi ứng dụng Spring Boot.
- Đọc hiểu 100% từng dòng cấu hình trong file \`pom.xml\` khởi tạo qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: MÔI TRƯỜNG SPRING BOOT & SPRING INITIALIZR
**1. JDK 21 vs Spring Boot 3:**
Hãy tưởng tượng **Spring Boot 3** là một chiếc "Xe điện thông minh thế hệ mới". Chiếc xe này được thiết kế theo chuẩn sạc siêu tốc mới nhất:
- Nếu bạn mang một "Trạm sạc đời cũ" (JDK 8 hoặc JDK 11) ra để cắm sạc, xe sẽ từ chối khởi động ngay lập tức (\`UnsupportedClassVersionError: 65.0\`).
- **JDK 21 LTS** chính là "Hạ tầng trạm sạc tiêu chuẩn": Cung cấp động cơ Java 21, trình biên dịch hiện đại và hỗ trợ Virtual Threads giúp xe chạy êm ái, chịu tải cao.

**2. Spring Initializr (start.spring.io) là gì?**
- Giống như việc bạn đi mua một "Căn hộ bàn giao thô nhưng có sẵn khung kết cấu chuẩn":
- Thay vì phải tự đi xây từng bức tường, tự viết hàng trăm dòng XML cấu hình phức tạp, bạn chỉ cần tích chọn: *"Tôi cần phòng khách (Spring Web), tôi cần tủ an toàn (Spring Security), tôi cần kho hàng (Spring Data JPA)"*.
- Spring Initializr sẽ tự động xuất ra một bộ khung dự án hoàn chỉnh, chuẩn chỉ 100% theo các best practice của Pivotal/VMware.
:::

---

## 1. Cái này là gì? (Bản chất kỹ thuật Spring Boot 3 & JDK 21)

Spring Boot 3.x đánh dấu bước nhảy vọt lớn nhất trong lịch sử 10 năm của Spring Framework:
1. **Baseline Java 17 & tối ưu cho Java 21 LTS**: Tận dụng tối đa Records, Sealed Classes, Pattern Matching và Virtual Threads (Project Loom).
2. **Jakarta EE 10 Migration**: Toàn bộ namespace \`javax.*\` (Servlet, JPA, Validation) được đổi thành \`jakarta.*\`.
3. **Ahead-of-Time (AOT) & GraalVM Native Image**: Cho phép biên dịch Spring Boot thành binary độc lập, khởi động trong vài mili-giây và tốn chỉ vài chục MB RAM.

### Sơ Đồ Kiến Trúc: Quy Trình Khởi Tạo & Biên Dịch Dự Án Spring Boot 3

\`\`\`mermaid
flowchart LR
    A["Spring Initializr<br/>(start.spring.io)"] -->|"Tạo mã nguồn & pom.xml"| B["Thư mục Dự án Spring Boot 3"]
    B -->|"Maven Compiler Plugin (Java 21 source)"| C["Bytecode Java 21 (.class / Class File 65.0)"]
    C -->|"Spring Boot Maven Plugin"| D["Fat JAR / Executable JAR<br/>(Bao gồm Tomcat nhúng & Libs)"]
    D -->|"java -jar app.jar"| E["JVM 21 Runtime (HotSpot / ZGC)"]
    style A fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style D fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style E fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi bắt đầu xây dựng hệ thống quản lý đơn hàng & thanh toán (**E-Commerce Order & Payment Management System**), việc cấu hình chuẩn ngay từ ngày đầu tiên quyết định sự thành bại:

### Ma trận So sánh: Khởi tạo thủ công cũ vs Chuẩn Spring Boot 3 Initializr

| Tiêu chí | Khởi tạo thủ công (Legacy War / Java 8/11) | Chuẩn Spring Boot 3 & Initializr (Java 21) |
|---|---|---|
| **Thời gian thiết lập** | Mất 2-3 ngày cấu hình \`web.xml\`, tải Tomcat rời, sửa lỗi thư viện | Mất **2 phút** tải ZIP từ start.spring.io với cấu hình sẵn sàng chạy |
| **Quản lý thư viện phụ thuộc** | Xung đột phiên bản liên miên giữa Jackson, Hibernate, Servlet API | Nhờ **Spring Boot Dependencies BOM**, phiên bản mọi thư viện tương thích 100% |
| **Server triển khai** | Cài đặt Tomcat/JBoss độc lập trên server rồi deploy file WAR | **Nhúng sẵn Tomcat / Netty** bên trong file Fat JAR, chạy bằng lệnh \`java -jar\` |
| **Tối ưu hạ tầng** | Tốn nhiều CPU, thread pooling truyền thống dễ bị tắc nghẽn IO | Tương thích Java 21 Virtual Threads, chịu hàng chục nghìn kết nối đồng thời |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là file \`pom.xml\` chuẩn của dịch vụ quản lý đơn hàng (\`order-service\`) trong hệ sinh thái Spring Boot 3:

\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.4</version>
        <relativePath/>
    </parent>
    
    <groupId>vn.mastery.ecommerce</groupId>
    <artifactId>order-service</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <name>order-service</name>
    <description>E-Commerce Order & Payment Management Service</description>
    
    <properties>
        <java.version>21</java.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
\`\`\`

### Bảng Giải Mã Chi Tiết Từng Khối Cấu Hình Maven:

| Đoạn mã | Thẻ / Thuộc tính | Ý nghĩa kỹ thuật | Tác động Spring Boot & Quá trình Build |
|---|---|---|---|
| \`<parent>...spring-boot-starter-parent</parent>\` | Thẻ kế thừa Parent POM | Thiết lập các cấu hình mặc định (plugin, mã hóa UTF-8, compiler) | Thừa hưởng bộ quản lý phiên bản dependency chuẩn (BOM), không cần ghi tag \`<version>\` cho các thư viện con |
| \`<java.version>21</java.version>\` | Property cấu hình Java | Định nghĩa phiên bản Java nguồn và Java đích | Báo cho \`maven-compiler-plugin\` biên dịch mã nguồn theo chuẩn bytecode Java 21 (Class file format 65) |
| \`<artifactId>spring-boot-starter-web</artifactId>\` | Starter Dependency | Kéo trọn gói Spring MVC, Jackson JSON, và Tomcat Server nhúng | Biến ứng dụng thành một Web Server REST API hoàn chỉnh mà không cần cài đặt thêm bất kỳ server rời nào |
| \`<artifactId>spring-boot-starter-validation</artifactId>\` | Starter Validation | Kéo Hibernate Validator và Jakarta Validation API | Cung cấp các annotation kiểm tra dữ liệu như \`@NotNull\`, \`@Positive\`, \`@NotBlank\` cho DTO |
| \`<plugin>spring-boot-maven-plugin</plugin>\` | Build Plugin | Plugin đóng gói chuyên dụng của Spring Boot | Đóng gói toàn bộ dependencies và tomcat nhúng vào 1 file Fat JAR duy nhất (\`java -jar app.jar\`) |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Cạm bẫy \`UnsupportedClassVersionError: 65.0\`**:
   - **Hiện tượng**: Khi gõ \`./mvnw spring-boot:run\`, terminal báo lỗi \`has been compiled by a more recent version of the Java Runtime (class file version 65.0), this version of the Java Runtime only recognizes class file versions up to 61.0\`.
   - **Nguyên nhân**: Bạn khai báo Java 21 trong \`pom.xml\` nhưng biến môi trường \`JAVA_HOME\` hoặc phiên bản Java trong terminal đang trỏ về Java 17 (class version 61.0).
   - **Khắc phục**: Kiểm tra bằng lệnh \`java -version\` và \`javac -version\`. Đảm bảo cả hai đều trỏ về JDK 21 LTS.

2. **Cạm bẫy import nhầm \`javax.validation.*\` thay vì \`jakarta.validation.*\`**:
   - **Hiện tượng**: Bạn đặt annotation \`@NotNull\` nhưng Spring Boot 3 hoàn toàn phớt lờ và không kiểm tra lỗi.
   - **Nguyên nhân**: Bạn import nhầm gói \`javax.validation.constraints.NotNull\` của Java EE cũ thay vì \`jakarta.validation.constraints.NotNull\` của Jakarta EE 10.
   - **Khắc phục**: Luôn kiểm tra namespace import trong Spring Boot 3 phải bắt đầu bằng **\`jakarta.*\`**.
`;
}

// Refactor Lesson 0-1-2
const l012 = m0.lessons.find(l => l.id === "0-1-2");
if (l012) {
  l012.title = "Bài 0.1.2: Khám phá Cấu trúc Dự án Spring Boot 3 & Thực thi Maven/Gradle Wrapper";
  l012.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nắm chắc cấu trúc thư mục tiêu chuẩn Maven (\`src/main/java\`, \`src/main/resources\`, \`src/test/java\`) của ứng dụng Spring Boot 3.
- Hiểu rõ vai trò sống còn của Maven Wrapper (\`mvnw\`, \`mvnw.cmd\`) trong môi trường phát triển nhóm và CI/CD.
- Nắm vững cách nạp file cấu hình môi trường (\`application.yml\` / \`application.properties\`).
- Đọc hiểu 100% từng dòng lệnh thực thi và cấu trúc class khởi chạy \`@SpringBootApplication\`.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: MAVEN WRAPPER (mvnw)
**Vấn đề "Code chạy ngon trên máy tôi nhưng gãy trên máy bạn":**
- Lập trình viên Nam dùng Maven bản 3.9.6 cài sẵn trong máy.
- Lập trình viên Lan lại dùng Maven bản 3.6.0 cũ từ 4 năm trước.
- Server CI/CD Jenkins lại cài Maven bản 3.8.1.
- => **Hậu quả**: Cùng một dự án nhưng mỗi máy build ra một kiểu, lỗi plugin, lệch hash thư viện!

**Giải pháp: Maven Wrapper (\`mvnw\`) — "Chiếc vali công cụ xách tay":**
- Thay vì bắt mọi lập trình viên phải tự cài Maven trên máy tính, dự án Spring Boot đính kèm sẵn file script \`mvnw\`.
- Khi Nam hoặc Lan gõ \`./mvnw clean package\`, script này sẽ tự kiểm tra: Nếu máy chưa có Maven phiên bản chuẩn quy định trong \`.mvn/wrapper/maven-wrapper.properties\`, nó sẽ **tự động tải đúng phiên bản đó về một thư mục cô lập** và chạy!
- Đảm bảo 100% thành viên trong team và server CI/CD build ra cùng một kết quả đồng nhất!
:::

---

## 1. Cái này là gì? (Cấu trúc thư mục Spring Boot Chuẩn)

### Sơ Đồ Cây Thư Mục & Vai Trò Các Thành Phần:

\`\`\`
order-service/
├── .mvn/wrapper/                # Cấu hình tải phiên bản Maven cố định
├── mvnw                         # Shell script chạy trên Linux/macOS
├── mvnw.cmd                     # Batch script chạy trên Windows CMD/PowerShell
├── pom.xml                      # Khai báo thư viện & plugin build
└── src/
    ├── main/
    │   ├── java/                # Chứa toàn bộ mã nguồn Java nghiệp vụ
    │   │   └── vn/mastery/ecommerce/
    │   │       ├── OrderApplication.java     # Class chứa main method khởi động Spring
    │   │       ├── controller/               # Tầng Web API REST Controller
    │   │       ├── service/                  # Tầng Xử lý Nghiệp vụ (Business Logic)
    │   │       ├── repository/               # Tầng Giao tiếp Database (Spring Data JPA)
    │   │       └── dto/                      # Các Record DTO truyền nhận dữ liệu
    │   └── resources/
    │       ├── application.yml  # File cấu hình ứng dụng (port, database, log)
    │       └── static/          # Chứa file tĩnh (css, js, images - nếu có)
    └── test/                    # Chứa mã nguồn kiểm thử (Unit Test, Integration Test)
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi onboard một lập trình viên mới vào dự án E-Commerce hoặc đưa code lên pipeline CI/CD (GitHub Actions / GitLab CI):

### Ma trận So sánh: Dùng Maven cài cứng vs Dùng Maven Wrapper (mvnw)

| Tiêu chí | Cài đặt Maven thủ công (\`mvn\`) | Sử dụng Maven Wrapper (\`./mvnw\`) |
|---|---|---|
| **Yêu cầu cài đặt** | Bắt buộc lập trình viên phải tự tải, giải nén và set biến môi trường \`PATH\` | **Không cần cài gì cả**, chỉ cần máy có cài JDK 21 |
| **Tính đồng nhất CI/CD** | Dễ lệch phiên bản giữa local dev và server production | **100% đồng nhất**: Cả dev và CI/CD đều dùng chung 1 phiên bản Maven được chỉ định |
| **Bảo trì dự án dài hạn** | Dự án sau 3 năm có thể không build được vì Maven trên máy đã quá mới | Dự án luôn tự kéo đúng phiên bản tương thích tại thời điểm phát triển |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là class khởi động của dịch vụ đặt hàng:

\`\`\`java
package vn.mastery.ecommerce;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OrderApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrderApplication.class, args);
    }
}
\`\`\`

### Bảng Phân Tích Chi Tiết Từng Thành Phần Khởi Động:

| Dòng lệnh | Cú pháp / Annotation | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động Spring |
|---|---|---|---|
| \`@SpringBootApplication\` | Meta-Annotation | Tổ hợp của \`@Configuration\`, \`@EnableAutoConfiguration\`, \`@ComponentScan\` | Kích hoạt cỗ máy quét component tự động từ package \`vn.mastery.ecommerce\` trở xuống và nạp các Auto-Config |
| \`public class OrderApplication\` | Class định danh | Class gốc định vị vị trí package gốc (Root Package) | Spring lấy package của class này làm mốc để quét toàn bộ Controller, Service, Repository con |
| \`public static void main(String[] args)\` | Standard Java Main | Điểm nhập (Entrypoint) tiêu chuẩn của ứng dụng Java | Hệ điều hành gọi phương thức này khi chạy lệnh \`java -jar order-service.jar\` |
| \`SpringApplication.run(OrderApplication.class, args);\` | Phương thức Bootstrap | Tạo và khởi động Spring ApplicationContext | Khởi tạo Tomcat Server nhúng, đăng ký beans vào IoC Container, lắng nghe cổng HTTP (mặc định 8080) |

### Lệnh chạy ứng dụng qua Wrapper trên Terminal:

\`\`\`bash
# Trên Windows (PowerShell):
./mvnw.cmd spring-boot:run

# Trên Linux / macOS:
./mvnw spring-boot:run

# Đóng gói file JAR sản xuất (bỏ qua chạy test để build nhanh):
./mvnw clean package -DskipTests
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Cạm bẫy đặt sai package class \`@SpringBootApplication\`**:
   - **Hiện tượng**: Bạn tạo Controller \`OrderController\` nhưng khi gọi API thì nhận lỗi \`404 Not Found\`.
   - **Nguyên nhân**: Bạn đặt class \`OrderApplication\` trong package \`vn.mastery.ecommerce.app\`, còn Controller lại nằm ở \`vn.mastery.ecommerce.controller\`. Mặc định Spring chỉ quét từ package chứa file Application trở xuống!
   - **Khắc phục**: Luôn đặt class \`@SpringBootApplication\` ở package cha cao nhất (\`vn.mastery.ecommerce\`).

2. **Lỗi quyền thực thi script trên Linux/macOS (\`Permission denied: ./mvnw\`)**:
   - **Nguyên nhân**: Khi commit file từ Windows lên Git, quyền thực thi \`+x\` của file \`mvnw\` bị mất.
   - **Khắc phục**: Chạy lệnh \`chmod +x mvnw\` hoặc dùng git update index: \`git update-index --chmod=+x mvnw\`.
`;
}

// Refactor Lesson 0-1-3
const l013 = m0.lessons.find(l => l.id === "0-1-3");
if (l013) {
  l013.title = "Bài 0.1.3: Cạm bẫy Port 8080 Conflict, SSL Handshake & Sai phiên bản Java Compiler";
  l013.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nhận diện và xử lý triệt để 3 lỗi phổ biến nhất khiến Spring Boot không thể khởi động.
- Khắc phục lỗi đụng độ cổng \`Web server failed to start. Port 8080 was already in use\`.
- Xử lý lỗi \`PKIX path building failed\` khi tải dependency qua proxy công ty hoặc maven central.
- Tự cấu hình linh hoạt cổng mạng qua file \`application.yml\` và tham số dòng lệnh.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: XUNG ĐỘT CỔNG 8080
**Hình tượng "Chung cư có một hòm thư số 8080":**
- Cổng mạng (Port) giống như số hòm thư nhận hàng của một tòa nhà.
- Mặc định, Spring Boot muốn đăng ký nhận đơn hàng tại hòm thư số **8080**.
- Tuy nhiên, nếu trên máy bạn đang chạy một ứng dụng khác (ví dụ: Oracle Database, Jenkins, hoặc một tiến trình Spring Boot chạy ngầm chưa tắt), chiếc hòm thư 8080 đã bị chiếm giữ.
- Người đưa thư Spring Boot đến thấy hòm thư đã bị khóa, liền quăng ra lỗi: *"Port 8080 was already in use"* và lập tức dừng toàn bộ hệ thống!
:::

---

## 1. Cái này là gì? (Triệu chứng lỗi & Nguyên nhân sâu xa)

### Sơ Đồ Chẩn Đoán Lỗi Khởi Động Thường Gặp Trong Spring Boot 3

\`\`\`mermaid
flowchart TD
    A["Gõ ./mvnw spring-boot:run"] --> B{"Lỗi xảy ra lúc nào?"}
    B -->|"Lúc tải thư viện (Maven Build)"| C["Lỗi SSL / PKIX Path Failed<br/>-> Do mạng chặn chứng chỉ CA"]
    B -->|"Lúc biên dịch (Compilation)"| D["Lỗi Fatal error compiling / 65.0<br/>-> Lệch JDK giữa pom.xml và JAVA_HOME"]
    B -->|"Lúc khởi động Tomcat Server"| E["Port 8080 was already in use<br/>-> Tiến trình ngầm chiếm cổng"]
    style C fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
    style D fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
    style E fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi chạy đồng thời nhiều microservices trong hệ thống thương mại điện tử (\`order-service\`, \`payment-service\`, \`inventory-service\`), các dịch vụ không thể cùng chiếm chung một cổng 8080. Bạn cần nắm rõ kỹ năng cấu hình đa môi trường:

### Ma trận Giải pháp Xử lý Cạm bẫy

| Cạm bẫy | Triệu chứng thông báo | Cách khắc phục chuẩn Senior |
|---|---|---|
| **Port 8080 Conflict** | \`Port 8080 was already in use\` | Đổi cổng trong \`application.yml\` thành \`server.port=8081\` hoặc dùng cổng ngẫu nhiên \`server.port=0\` |
| **Sai Java Version** | \`invalid source release: 21\` | Cài đặt đúng JDK 21 LTS và export lại biến \`JAVA_HOME\` chuẩn |
| **Lỗi SSL CA** | \`PKIX path building failed\` | Thêm chứng chỉ công ty vào Java cacerts keystore hoặc cấu hình mirror nội bộ Nexus |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

### 1. Cấu hình đổi cổng linh hoạt trong \`src/main/resources/application.yml\`:

\`\`\`yaml
server:
  port: 8081 # Đổi cổng sang 8081 để tránh xung đột với các dịch vụ khác
  shutdown: graceful # Cho phép hoàn tất nốt các request đang xử lý trước khi tắt

spring:
  application:
    name: order-service
\`\`\`

### 2. Lệnh tìm và tiêu diệt tiến trình chiếm cổng trên Windows / Linux:

\`\`\`bash
# Trên Windows PowerShell (Tìm tiến trình đang chiếm cổng 8080):
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process -Force

# Trên Linux / macOS:
lsof -i :8080 | awk 'NR>1 {print $2}' | xargs kill -9
\`\`\`

### 3. Ghi đè cổng khi chạy lệnh từ Terminal (Không cần sửa file yml):

\`\`\`bash
./mvnw spring-boot:run -Dspring-boot.run.arguments="--server.port=8085"
\`\`\`

### Bảng Phân Tích Ý Nghĩa Cơ Chế Xử Lý:

| Tham số cấu hình | Loại thiết lập | Ý nghĩa kỹ thuật | Tác động hệ thống |
|---|---|---|---|
| \`server.port: 8081\` | Application Config | Chỉ định cổng TCP socket mà Tomcat lắng nghe | Tránh xung đột với các tiến trình mặc định 8080 khác |
| \`server.port: 0\` | Dynamic Port | Yêu cầu hệ điều hành tự cấp 1 cổng trống bất kỳ | Cực kỳ hữu ích khi chạy Integration Test song song nhiều instance |
| \`server.shutdown: graceful\` | Graceful Shutdown | Cho phép Tomcat đợi hoàn tất request dở dang (tối đa 30s) | Không làm mất đơn hàng của khách hàng khi pod container khởi động lại |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Cạm bẫy Hardcode Port trên code**:
   - Không bao giờ hardcode cổng cố định trong code Java. Luôn định nghĩa qua \`server.port\` và nạp qua biến môi trường \`SERVER_PORT\` khi đóng gói Docker.

2. **Chế độ DevTools Restart bị treo port**:
   - Nếu dùng \`spring-boot-devtools\`, khi sửa code IDE tự reload. Đôi khi tiến trình cũ chưa giải phóng socket kịp thời dẫn đến lỗi port. Giải pháp: Sử dụng tính năng Graceful Shutdown kết hợp kiểm tra Task Manager.
`;
}

// Refactor Lesson 0-1-4
const l014 = m0.lessons.find(l => l.id === "0-1-4");
if (l014) {
  l014.title = "Bài 0.1.4: Tổng Kết Thực Chiến: Checklist Chuẩn Hóa Môi Trường & Khởi Động Dự Án Spring Boot 3";
  l014.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 0.1 thành một Checklist thực chiến 6 bước khởi động dự án Spring Boot 3.
- Nắm vững sơ đồ luồng tổng quan từ mã nguồn Java 21 đến container thực thi trong production.
- Rèn luyện phản xạ phát hiện nhanh các lỗi môi trường trước khi bắt tay vào code nghiệp vụ.
- Đọc hiểu bảng quyết định kỹ thuật (ADR) khi lựa chọn build tool và phiên bản runtime.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CHECKLIST CHUẨN BỊ TRƯỚC CHUYẾN BAY
Trước khi máy bay cất cánh, phi công trưởng luôn cầm trên tay một bảng danh sách (Checklist) để kiểm tra:
1. Động cơ có đủ nhiên liệu không? (JDK 21 đã sẵn sàng chưa?)
2. Hệ thống điện đàm có thông suốt không? (Cổng mạng 8080/8081 có bị nghẽn không?)
3. Hộp đen và bản đồ bay đã được nạp chưa? (Maven wrapper và dependencies đã tải đủ chưa?)
Chỉ khi toàn bộ các mục được tích xanh, máy bay mới được phép rời đường băng. Lập trình viên Backend chuyên nghiệp cũng vậy: Cần một Checklist chuẩn mực trước khi gõ dòng code đầu tiên!
:::

---

## 1. Cái này là gì? (Kiến trúc Khởi động Hoàn Chỉnh)

### Sơ Đồ Luồng: Từ Source Code Đến Production Executable Trong Spring Boot 3

\`\`\`mermaid
flowchart TD
    A["1. JDK 21 LTS Kiểm Tra<br/>(java -version & JAVA_HOME)"] --> B["2. Khởi tạo qua Spring Initializr<br/>(Spring Boot 3.3+, Web, Validation)"]
    B --> C["3. Thực thi qua Maven Wrapper<br/>(./mvnw clean compile)"]
    C --> D["4. Cấu hình application.yml<br/>(server.port, graceful shutdown)"]
    D --> E["5. Chạy Kiểm Thử Khởi Động<br/>(@SpringBootTest contextLoads)"]
    E --> F["6. DỰ ÁN SẴN SÀNG PHÁT TRIỂN NGHIỆP VỤ E-COMMERCE"]
    style F fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style A fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bảng Quyết Định Kỹ Thuật ADR)

### Bảng Quyết Định Kiến Trúc Môi Trường (Architectural Decision Record - ADR)

| Hạng mục quyết định | Lựa chọn Senior | Lý do kỹ thuật & Đánh đổi | Lựa chọn cần tránh |
|---|---|---|---|
| **Java Runtime Version** | **Java 21 LTS** | Hỗ trợ Virtual Threads, Records hoàn chỉnh, được Spring Boot 3 hỗ trợ tối ưu lâu dài | Java 8/11 (Không được hỗ trợ trên Spring Boot 3) |
| **Công cụ Build** | **Maven Wrapper (\`./mvnw\`)** | Độc lập môi trường, không bắt dev cài Maven, đảm bảo tính đồng nhất 100% | Maven cài cục bộ không có wrapper |
| **Định dạng cấu hình** | **YAML (\`application.yml\`)** | Cấu trúc phân cấp rõ ràng, dễ đọc khi có nhiều tầng môi trường (dev/staging/prod) | File \`.properties\` dài dòng trùng lặp tiền tố |
| **Cổng lắng nghe** | **Phân tách theo dịch vụ** (8081, 8082...) | Tránh đụng độ cổng 8080 mặc định khi chạy cụm microservices local | Giữ nguyên 8080 cho tất cả dịch vụ |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (Step-by-step Execution)

Dưới đây là Unit Test tự động kiểm tra xem toàn bộ Spring Context có khởi động thành công không:

\`\`\`java
package vn.mastery.ecommerce;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class OrderApplicationTests {

    @Test
    void contextLoads() {
        // Phương thức này rỗng nhưng nếu Spring Context gặp bất kỳ lỗi nào 
        // (đụng độ bean, thiếu cấu hình, sai version), test case này sẽ FAIL ngay lập tức!
    }
}
\`\`\`

### Bảng Giải Mã Test Case Chẩn Đoán Sức Khỏe Môi Trường:

| Dòng code | Cú pháp | Ý nghĩa kỹ thuật | Tác động kiểm thử |
|---|---|---|---|
| \`@SpringBootTest\` | Annotation Test | Nạp toàn bộ ApplicationContext giống như khi ứng dụng chạy thật | Khởi tạo mọi Bean, quét component và kiểm tra tính toàn vẹn của đồ thị phụ thuộc |
| \`void contextLoads()\` | Test Method | Phương thức test smoke-test tiêu chuẩn | Đảm bảo rằng ứng dụng có thể khởi động thành công mà không ném ra exception nghiêm trọng nào |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Checklist 6 bước trước khi bắt đầu code**:
   - [ ] Kiểm tra \`java -version\` đúng phiên bản JDK 21 LTS.
   - [ ] Kiểm tra file \`pom.xml\` có thẻ \`<parent>\` trỏ về Spring Boot 3.3+.
   - [ ] Kiểm tra toàn bộ package import đều dùng \`jakarta.*\` thay vì \`javax.*\`.
   - [ ] Kiểm tra \`application.yml\` đã cấu hình cổng và tên ứng dụng chuẩn.
   - [ ] Chạy \`./mvnw test\` để xác nhận \`contextLoads()\` trả về màu xanh (PASS).
   - [ ] Đảm bảo file \`mvnw\` có quyền thực thi trong kho lưu trữ Git.
`;
}

fs.writeFileSync(modulePath, "window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n" + JSON.stringify(m0, null, 2) + "\n);\n", "utf8");
console.log("Successfully refactored Module 0 Header and Topic 0.1 (Lessons 0-1-1 to 0-1-4)!");
