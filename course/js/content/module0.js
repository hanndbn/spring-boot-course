/* MODULE 0 — Nền tảng Java & Công cụ */
window.COURSE_MODULES = window.COURSE_MODULES || [];
window.COURSE_MODULES.push({
  id: 0,
  title: "Nền tảng Java & Công cụ",
  subtitle: "JDK 21, Modern Java, Stream & Multi-Module Maven",
  icon: "☕",
  desc: "Nền tảng Java 21 LTS hiện đại, lambda/stream chuyên sâu, record, sealed class và quản trị Maven đa module.",
  lessons: [
    {
      id: "0-1",
      type: "lesson",
      title: "Giới thiệu khóa học & Setup môi trường",
      minutes: 45,
      content: `## Chào mừng bạn đến với Tiêu Chuẩn Kỹ Sư Spring Boot Chuyên Nghiệp 🚀

Hầu hết các khóa học Spring Boot trên thị trường chỉ dạy bạn:
1. Vào <code>start.spring.io</code> bấm vài cái click chuột tải file zip.
2. Mở IntelliJ lên gõ vài class Controller đơn giản trả về chuỗi "Hello World".
3. Dùng thử cURL một lần rồi tự coi mình là "Spring Boot Developer".

Nhưng khi bước chân vào môi trường doanh nghiệp thực tế (Fintech, Ngân hàng, Sàn thương mại điện tử, các dự án lớn như LAAS/OLS):
- Bạn phải đối mặt với hạ tầng đa phiên bản Java (Java 8, 11, 17, 21), các quy định cấp phép bản quyền (Licensing) nghiêm ngặt giữa Oracle JDK và OpenJDK.
- Dự án thất bại khi build trên CI/CD chỉ vì sự sai lệch ký tự xuống dòng (<code>CRLF</code> trên Windows vs <code>LF</code> trên Linux).
- Lỗi kết nối mạng doanh nghiệp đứt gãy do chứng chỉ SSL/TLS bị chặn (<code>PKIX path building failed</code>).
- Bộ nhớ JVM cấp phát sai trên Docker làm máy chủ production bị Linux OOM-Killer tiêu diệt giữa đêm.

Khóa học này được thiết kế để biến bạn từ một người chỉ biết Java cú pháp cơ bản thành một **Senior Spring Boot Engineer thực thụ**, tự tin thiết kế, tối ưu và vận hành các hệ thống phân tán chịu tải cao.

Bài học khởi đầu này sẽ giúp bạn chuẩn hóa môi trường làm việc đạt chuẩn Enterprise: Quản trị đa JDK với công cụ CLI hiện đại, thiết lập Docker engine, và cấu hình IDE chuẩn hóa cho đội ngũ kỹ sư.

---

## 1. Kiến trúc chuyên sâu & Cơ chế hoạt động (Under the Hood)

### 1.1. Bản Đồ Hệ Sinh Thái JDK & Vấn Đề Bản Quyền Doanh Nghiệp

Kể từ năm 2019, Oracle đã thay đổi chính sách cấp phép (Oracle Technology Network - OTN License): Việc sử dụng Oracle JDK cho mục đích thương mại có thể phát sinh chi phí bản quyền khổng lồ. 

Trong các doanh nghiệp toàn cầu, 95% hạ tầng chuyển sang các bản phân phối **OpenJDK miễn phí, mã nguồn mở, đạt chuẩn TCK (Technology Compatibility Kit)**:

~~~text
+─────────────────────────────────────────────────────────────────────────────+
| BẢN ĐỒ CÁC BẢN PHÂN PHỐI OPENJDK UY TÍN NHẤT HIỆN NAY                       |
|                                                                             |
| 1. Eclipse Temurin (Adoptium / Eclipse Foundation):                         |
|    - Tiêu chuẩn công nghiệp hàng đầu thế giới.                              |
|    - Độc lập với các nhà cung cấp cloud, hoàn toàn miễn phí sản xuất.       |
|    - KHUYẾN NGHỊ MẶC ĐỊNH CHO KHÓA HỌC NÀY.                                 |
|                                                                             |
| 2. Amazon Corretto:                                                         |
|    - Tối ưu hóa đặc biệt cho hạ tầng AWS (EC2, ECS, EKS).                   |
|    - Hỗ trợ dài hạn (LTS) miễn phí, tích hợp sẵn các bản vá hiệu năng I/O.  |
|                                                                             |
| 3. GraalVM Community / Oracle GraalVM:                                      |
|    - Hỗ trợ Native Image biên dịch AOT (Ahead-Of-Time) ra file nhị phân.    |
|    - Khởi động trong 10ms, tiết kiệm 80% RAM, tối ưu cho Serverless.        |
+─────────────────────────────────────────────────────────────────────────────+
~~~

### 1.2. Kiến Trúc Bên Trong Java Virtual Machine (JVM Architecture)

Để viết mã nguồn hiệu năng cao, bạn cần nắm vững cách JVM thực thi bytecode:

~~~text
+─────────────────────────────────────────────────────────────────────────────+
| JAVA VIRTUAL MACHINE (JVM) INTERNALS                                        |
|                                                                             |
|  [ Java Source (.java) ] ──(javac)──> [ Bytecode (.class) ]                 |
|                                                │                            |
|  +─────────────────────────────────────────────▼─────────────────────────+  |
|  | CLASS LOADER SUBSYSTEM                                                |  |
|  |  1. Loading: Bootstrap ClassLoader (java.base)                        |  |
|  |              Platform ClassLoader (mở rộng)                           |  |
|  |              Application ClassLoader (classpath ứng dụng của bạn)     |  |
|  |  2. Linking: Verification (Bytecode an toàn) -> Preparation -> Resolve|  |
|  |  3. Initialization: Thực thi static initializers                      |  |
|  +─────────────────────────────────────────────┬─────────────────────────+  |
|                                                │                            |
|  +─────────────────────────────────────────────▼─────────────────────────+  |
|  | EXECUTION ENGINE                                                      |  |
|  |  [ Interpreter ]         --> Thông dịch từng lệnh bytecode (nhanh lúc |  |
|  |                              khởi động, chậm lúc chạy lâu dài)        |  |
|  |  [ JIT Compiler ]        --> Tiered Compilation:                      |  |
|  |    - C1 Compiler (Tier 1-3): Biên dịch nhanh sang native code máy     |  |
|  |    - C2 Compiler (Tier 4): Tối ưu hóa sâu các vùng "Hotspot code"     |  |
|  |  [ Garbage Collector ]   --> G1GC, Generational ZGC dọn dẹp bộ nhớ    |  |
|  +───────────────────────────────────────────────────────────────────────+  |
+─────────────────────────────────────────────────────────────────────────────+
~~~

### 1.3. Quản Lý Đa Phiên Bản Java Bằng CLI Hiện Đại (Tránh Xung Đột <code>JAVA_HOME</code>)

Việc vào giao diện đồ họa Windows <code>Environment Variables</code> để sửa <code>JAVA_HOME</code> bằng tay là nguyên nhân hàng đầu khiến lập trình viên mất hàng giờ debug khi chuyển đổi giữa các dự án (ví dụ: dự án cũ chạy Java 11, dự án mới chạy Java 21).

Tiêu chuẩn hiện đại của các Senior Engineer:
- **macOS / Linux / Windows WSL**: Sử dụng **SDKMAN!** (<code>sdk install java 21.0.4-tem</code>).
- **Windows Native**: Sử dụng **Scoop** (<code>scoop install temurin21-jdk</code>) hoặc **winget**.

---

## 2. Production-Grade Implementation Code

### 2.1. Script Tự Động Hóa Kiểm Tra & Chuẩn Hóa Môi Trường (<code>env-doctor.ps1</code>)

File script PowerShell chạy trên Windows để xác minh toàn bộ môi trường phát triển trước khi bắt đầu code:

~~~powershell
# env-doctor.ps1 — Chẩn đoán môi trường chuẩn Enterprise
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       KIỂM TRA TIÊU CHUẨN MÔI TRƯỜNG PHÁT TRIỂN           " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Kiểm tra phiên bản Java (Bắt buộc JDK >= 21)
try {
    $javaOutput = java -version 2>&1 | Out-String
    if ($javaOutput -match 'version "([0-9]+)') {
        $javaVersion = [int]$matches[1]
        if ($javaVersion -ge 21) {
            Write-Host "[OK] Java SDK version $javaVersion detected (Adoptium/OpenJDK)." -ForegroundColor Green
        } else {
            Write-Host "[FAIL] Java version is $javaVersion. Spring Boot 3.3 requires Java 21+!" -ForegroundColor Red
            Exit 1
        }
    }
} catch {
    Write-Host "[FAIL] java command not found! Please install JDK 21 and configure PATH." -ForegroundColor Red
    Exit 1
}

# 2. Kiểm tra JAVA_HOME
$javaHome = $env:JAVA_HOME
if ($javaHome -and (Test-Path "$javaHomeinjavac.exe")) {
    Write-Host "[OK] JAVA_HOME is properly configured: $javaHome" -ForegroundColor Green
} else {
    Write-Host "[WARN] JAVA_HOME is not set or invalid. Maven might fail during build!" -ForegroundColor Yellow
}

# 3. Kiểm tra Docker Daemon đang chạy
try {
    $dockerInfo = docker info 2>&1 | Out-String
    if ($dockerInfo -match "Server Version") {
        Write-Host "[OK] Docker Engine is running and healthy." -ForegroundColor Green
    } else {
        Write-Host "[WARN] Docker is installed but daemon is NOT running. Testcontainers will not work!" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARN] docker command not found. Docker is strongly required for Module 4, 6, 7." -ForegroundColor Yellow
}

# 4. Kiểm tra Git Autocrlf (Bảo vệ dự án khỏi lỗi line-ending CRLF/LF)
$crlfSetting = git config --get core.autocrlf
if ($crlfSetting -eq "input" -or $crlfSetting -eq "true") {
    Write-Host "[OK] Git core.autocrlf is configured safely ($crlfSetting)." -ForegroundColor Green
} else {
    Write-Host "[NOTICE] Setting git core.autocrlf to 'input' to protect Linux bash scripts..." -ForegroundColor Cyan
    git config --global core.autocrlf input
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       MÔI TRƯỜNG ĐÃ SẴN SÀNG ĐẠT CHUẨN ENTERPRISE!        " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
~~~

### 2.2. Chuẩn Hóa Mã Nguồn Đội Ngũ: <code>.editorconfig</code> & <code>.gitattributes</code>

Để 10 lập trình viên sử dụng hệ điều hành khác nhau (Windows, Mac, Ubuntu) không bao giờ bị xung đột định dạng file:

File <code>.editorconfig</code> ở thư mục gốc của repository:
~~~ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 4

[*.{yml,yaml,json,xml}]
indent_size = 2

[*.md]
trim_trailing_whitespace = false
~~~

File <code>.gitattributes</code>:
~~~gitattributes
# Tự động chuẩn hóa line-ending sang LF trên repository
* text=auto eol=lf

# File nhị phân không được can thiệp
*.jar binary
*.hprof binary
*.png binary
*.jpg binary

# Giữ nguyên quyền thực thi cho Maven Wrapper script trên Linux
mvnw text eol=lf
*.sh text eol=lf
~~~

### 2.3. Cấu Hình Tăng Tốc Maven Doanh Nghiệp (<code>settings.xml</code>)

File cấu hình <code>~/.m2/settings.xml</code> tối ưu hóa download thư viện từ Maven Central và cấu hình pool kết nối mạng:

~~~xml
<settings xmlns="http://maven.apache.org/SETTINGS/1.2.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.2.0 https://maven.apache.org/xsd/settings-1.2.0.xsd">
    
    <!-- Định vị thư mục cache local repository -->
    <localRepository>\${user.home}/.m2/repository</localRepository>

    <profiles>
        <profile>
            <id>developer-optimizations</id>
            <activation>
                <activeByDefault>true</activeByDefault>
            </activation>
            <properties>
                <!-- Biên dịch UTF-8 chuẩn hóa -->
                <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
                <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
                <maven.compiler.release>21</maven.compiler.release>
            </properties>
        </profile>
    </profiles>
</settings>
~~~

---

## 3. Kiểm thử, Metrics & Vận hành thực chiến

### 3.1. Truy Vấn Cấu Hình Chi Tiết JVM Bằng Lệnh CLI

Kiểm tra toàn bộ các thông số mặc định của OpenJDK 21 trên máy của bạn:

~~~bash
# Xem toàn bộ cấu hình hệ thống, encoding, garbage collector mặc định
java -XshowSettings:all -version
~~~

Kết quả output chuyên sâu:
~~~text
VM settings:
    Max. Heap Size (Estimated): 7.82G
    Using VM: OpenJDK 64-Bit Server VM

Property settings:
    file.encoding = UTF-8             <-- Java 21 mặc định UTF-8 theo chuẩn JEP 400!
    java.class.version = 65.0         <-- Mã bytecode của Java 21
    java.home = C:Program FilesEclipse Adoptiumjdk-21.0.4.7-hotspot
    os.arch = amd64
    os.name = Windows 11

Locale settings:
    default locale = en_US
~~~

### 3.2. Kiểm Tra Cơ Chế Tiered Compilation Của JIT

~~~bash
# Kiểm tra cờ JIT TieredCompilation và Garbage Collector mặc định
java -XX:+PrintFlagsFinal -version | findstr /I "TieredCompilation UseG1GC"
~~~

Output xác nhận:
~~~text
bool TieredCompilation = true        {product} {default}
bool UseG1GC            = true        {product} {ergonomic}
~~~
JVM tự động bật Tiered Compilation (C1/C2) và kích hoạt Garbage-First GC (G1GC).

---

## 4. Production Pitfalls & Post-Mortem

### 4.1. Sự cố 1: Ký Tự Xuống Dòng <code>
</code> (CRLF) Làm Hỏng Maven Wrapper Trên Docker/Linux

- **Bối cảnh**: Lập trình viên dùng Windows mở file script <code>mvnw</code> hoặc <code>entrypoint.sh</code> ra chỉnh sửa rồi commit lên Git.
- **Hậu quả thảm họa**: Khi Jenkins CI hoặc Docker chạy trên Linux, tiến trình lập tức gãy với lỗi vô cùng khó hiểu:
  <code>/bin/sh: ./mvnw: not found</code> hoặc <code>/bin/sh: 1: exec: ./mvnw: not found</code>.
- **Nguyên nhân**: Windows sử dụng cặp ký tự <code>
</code> (Carriage Return + Line Feed), trong khi Linux chỉ hiểu <code>
</code> (Line Feed). Ký tự <code></code> bị Linux coi là một phần của tên file!
- **Giải pháp dứt khoát**:
  1. Tạo file <code>.gitattributes</code> với quy tắc <code>* text=auto eol=lf</code>.
  2. Chạy lệnh chuyển đổi trên file bị lỗi: <code>dos2unix mvnw</code> hoặc trong Notepad++ / IntelliJ chuyển <code>CRLF</code> -> <code>LF</code>.

### 4.2. Sự cố 2: Lỗi Chứng Chỉ SSL Mạng Doanh Nghiệp (<code>PKIX path building failed</code>)

- **Bối cảnh**: Khi làm việc tại văn phòng công ty có tường lửa Proxy hoặc VPN (như Zscaler, Fortinet), mỗi khi Maven tải thư viện hoặc Spring Boot gọi API bên ngoài, chương trình bị ném ngoại lệ:
  <code>sun.security.validator.ValidatorException: PKIX path building failed: unable to find valid certification path to requested target</code>.
- **Nguyên nhân**: Tường lửa Proxy của doanh nghiệp thực hiện giải mã SSL (SSL Inspection) bằng chứng chỉ Root CA nội bộ của công ty. JVM không tin tưởng chứng chỉ này vì nó không có sẵn trong file <code>cacerts</code> mặc định.
- **Giải pháp**:
  Import chứng chỉ Root CA của công ty vào keystore của JDK 21:
  ~~~bash
  keytool -importcert -trustcacerts -alias corporate-ca     -file "C:Certscompany-root-ca.crt"     -keystore "$env:JAVA_HOMElibsecuritycacerts"     -storepass changeit -noprompt
  ~~~

---

## 5. Hands-on Enterprise Challenge & Reference Solution

### Đề bài: Xây Dựng Ứng Dụng CLI Smoke Test Xác Minh Runtime & Bộ Nhớ

Viết một lớp Java 21 độc lập <code>RuntimeDiagnosticsSmokeTest</code>:
1. In ra phiên bản JDK, mã kiến trúc CPU, và số lượng Logical CPU Cores.
2. Kiểm tra xem Garbage Collector đang chạy có phải là G1GC hay không.
3. Đo lường kích thước Heap tối đa (<code>Runtime.getRuntime().maxMemory()</code>) và kiểm tra xem tính năng Virtual Threads có khả dụng trong môi trường runtime hay không bằng cách khởi tạo thử một Virtual Thread.

### Lời giải hoàn chỉnh (Reference Solution)

~~~java
package com.enterprise.course.setup;

import java.lang.management.GarbageCollectorMXBean;
import java.lang.management.ManagementFactory;
import java.nio.charset.Charset;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

public class RuntimeDiagnosticsSmokeTest {

    public static void main(String[] args) throws InterruptedException {
        System.out.println("==========================================================");
        System.out.println("      ENTERPRISE RUNTIME ENVIRONMENT SMOKE TEST           ");
        System.out.println("==========================================================");

        // 1. Kiểm tra Version & Cores
        String javaVersion = System.getProperty("java.version");
        String osName = System.getProperty("os.name");
        int availableProcessors = Runtime.getRuntime().availableProcessors();
        long maxMemoryMB = Runtime.getRuntime().maxMemory() / (1024 * 1024);

        System.out.printf("OS: %s | Java Runtime: %s%n", osName, javaVersion);
        System.out.printf("Available CPU Cores: %d | Max Heap Memory: %d MB%n", availableProcessors, maxMemoryMB);
        System.out.printf("Default Charset Encoding: %s (Standard UTF-8: %b)%n",
                Charset.defaultCharset(), Charset.defaultCharset().name().equalsIgnoreCase("UTF-8"));

        // 2. Kiểm tra Garbage Collector
        List<GarbageCollectorMXBean> gcBeans = ManagementFactory.getGarbageCollectorMXBeans();
        System.out.print("Active Garbage Collectors: ");
        for (GarbageCollectorMXBean gc : gcBeans) {
            System.out.printf("[%s] ", gc.getName());
        }
        System.out.println();

        // 3. Smoke Test Java 21 Virtual Threads
        AtomicBoolean virtualThreadSuccess = new AtomicBoolean(false);
        Thread vThread = Thread.ofVirtual().name("smoke-test-vthread").start(() -> {
            boolean isVirtual = Thread.currentThread().isVirtual();
            virtualThreadSuccess.set(isVirtual);
            System.out.printf("[SUCCESS] Virtual Thread executed successfully! isVirtual=%b, ThreadName=%s%n",
                    isVirtual, Thread.currentThread().getName());
        });

        vThread.join(2000);

        if (!virtualThreadSuccess.get()) {
            System.err.println("[CRITICAL] Virtual Threads failed to execute! Ensure you are running on JDK 21+.");
            System.exit(1);
        }

        System.out.println("==========================================================");
        System.out.println("     ALL RUNTIME DIAGNOSTIC CHECKS PASSED! READY!         ");
        System.out.println("==========================================================");
    }
}
~~~
`
    },
    {
      id: "0-2",
      type: "lesson",
      title: "Java hiện đại: Lambda, Stream, Optional",
      minutes: 50,
      content: `## Lập trình Hàm, Bản chất Stream Pipeline & Chống Bẫy Optional

Khi chuyển sang các phiên bản Spring Boot hiện đại (Spring Boot 3.x trên Java 21), toàn bộ hệ sinh thái Spring đều được tái cấu trúc dựa trên nền tảng **Functional Programming (Lập trình hàm)**:
- Spring Security 6 loại bỏ hoàn toàn <code>authorizeRequests().and()</code> và bắt buộc chuyển sang **Lambda DSL**: <code>http.authorizeHttpRequests(auth -> auth.anyRequest().authenticated())</code>.
- Spring Cloud Stream và Spring Cloud Function trừu tượng hóa xử lý tin nhắn bằng <code>java.util.function.Function</code>, <code>Consumer</code>, và <code>Supplier</code>.
- Spring Data JPA trả về <code>Optional<T></code> ở mọi phương thức tìm kiếm khóa chính <code>findById()</code>.

Tuy nhiên, rất nhiều lập trình viên sử dụng Stream và Optional theo phong cách "OOP lai tạp":
- Dùng <code>optional.get()</code> mà không kiểm tra, biến nó thành <code>NullPointerException</code> trá hình.
- Gọi <code>parallelStream()</code> để gọi REST API bên ngoài, vô tình chiếm dụng và làm cạn kiệt toàn bộ <code>ForkJoinPool.commonPool()</code> của cả máy chủ JVM.
- Tạo ra các Stream pipeline lồng nhau làm tăng độ phức tạp thuật toán từ $O(N)$ lên $O(N^2)$ và gây áp lực khủng khiếp lên Garbage Collector.

Bài học này sẽ mổ xẻ cơ chế hoạt động tầng sâu của **Lambda (<code>invokedynamic</code>)**, kiến trúc **Stream Pipeline & Spliterator**, và thiết lập tư duy xử lý dữ liệu chuẩn chỉ của Senior Java Engineer.

---

## 1. Kiến trúc chuyên sâu & Cơ chế hoạt động (Under the Hood)

### 1.1. Bản Chất Của Lambda Expression: <code>invokedynamic</code> vs Anonymous Class

Nhiều người lầm tưởng: *"Lambda chỉ là cú pháp viết tắt của Anonymous Inner Class (Lớp nội danh)"*. **Hoàn toàn sai!**

Nếu là Anonymous Inner Class:
- Trình biên dịch <code>javac</code> sẽ tạo ra một file class vật lý riêng trên đĩa (ví dụ: <code>OrderService$1.class</code>).
- Mỗi lần khởi tạo, JVM phải cấp phát một Object mới trên Heap, gây tốn bộ nhớ và tăng thời gian nạp lớp (Class Loading time).

Trong Java hiện đại, Lambda sử dụng chỉ mục bytecode **<code>invokedynamic</code> (JEP 292)**:
1. Khi biên dịch, <code>javac</code> không sinh ra file <code>.class</code> mới. Thay vào đó, nó chèn một chỉ thị <code>invokedynamic</code> kèm theo con trỏ trỏ tới phương thức <code>LambdaMetafactory.metafactory()</code>.
2. Trong lần đầu tiên thực thi, JVM gọi Bootstrap Method để liên kết động (Dynamic Linkage) và sinh ra một <code>CallSite</code> duy nhất tối ưu hóa cao trong bộ nhớ.
3. Các lần gọi tiếp theo được JIT Compiler tối ưu hóa trực tiếp thành Native Machine Code, đạt tốc độ ngang ngửa với việc gọi một static method bình thường và **hoàn toàn không rò rỉ bộ nhớ Heap**!

### 1.2. Vòng Đời Của Stream Pipeline: Lazy Evaluation & Spliterator

Một Stream Pipeline không phải là một cấu trúc dữ liệu lưu trữ phần tử. Nó là một **Dòng chảy biến đổi dữ liệu (Data Pipeline)** hoạt động theo cơ chế **Đánh giá lười biếng (Lazy Evaluation)**:

~~~text
+─────────────────────────────────────────────────────────────────────────────+
| STREAM PIPELINE LIFECYCLE                                                   |
|                                                                             |
|  [ Data Source ] ──> (Collection, Array, I/O Channel)                       |
|         │                                                                   |
|         ▼ (Spliterator phân tách phần tử)                                   |
|  [ Intermediate Operations (LAZY) ]                                         |
|    - filter(Predicate)  --> Không thực thi ngay!                            |
|    - map(Function)      --> Chỉ ghi nhận cấu hình bước chuyển đổi           |
|    - distinct() / sorted()                                                  |
|         │                                                                   |
|         ▼                                                                   |
|  [ Terminal Operation (EAGER) ]                                             |
|    - collect(Collector) / forEach / reduce / anyMatch                       |
|    ==> KÍCH HOẠT DÒNG CHẢY DỮ LIỆU CHẠY TỪ NGUỒN ĐẾN ĐÍCH TRONG 1 LƯỢT DUY NHẤT!|
+─────────────────────────────────────────────────────────────────────────────+
~~~

- **Spliterator (Splitable Iterator)**: Trái tim của Stream. Nó cung cấp 2 phương thức cốt lõi:
  - <code>tryAdvance(Consumer)</code>: Duyệt tuần tự từng phần tử.
  - <code>trySplit()</code>: Chia đôi tập dữ liệu thành 2 Spliterator độc lập để phục vụ xử lý song song (Parallel Processing).

### 1.3. Cạm Bẫy Chết Người: <code>parallelStream()</code> Trong Ứng Dụng Web Spring Boot

Trong Java, <code>collection.parallelStream()</code> mặc định sử dụng chung một thread pool toàn cục của JVM: **<code>ForkJoinPool.commonPool()</code>**. Kích thước của pool này bị giới hạn cứng bằng $	ext{Số CPU Cores} - 1$.

~~~text
+─────────────────────────────────────────────────────────────────────────────+
| THẢM HỌA: ForkJoinPool.commonPool() BỊ NGHẼN BỞI I/O CHẬM                   |
|                                                                             |
|  Request A (Bắn 1,000 tasks gọi external API qua parallelStream)            |
|       │                                                                     |
|       ▼ (Chiếm trọn 7 worker threads của commonPool)                        |
|  [ ForkJoinPool.commonPool() (8 Cores = 7 Threads) ] ──> [ BLOCKED / HANG! ]|
|       ▲                                                                     |
|       │                                                                     |
|  Request B (Tác vụ tính toán nội bộ của user khác) ──> BỊ ĐÓNG BĂNG VÔ CỚ!  |
+─────────────────────────────────────────────────────────────────────────────+
~~~

> [!WARNING]
> **Quy tắc vàng**: **TUYỆT ĐỐI KHÔNG** dùng <code>parallelStream()</code> cho các tác vụ I/O chặn (Blocking I/O: gọi Database, đọc file, gọi HTTP REST API). Nếu cần xử lý song song CPU-bound nặng, bắt buộc phải tạo một <code>ForkJoinPool</code> riêng biệt!

---

## 2. Production-Grade Implementation Code

### 2.1. Refactor Code Nghiệp Vụ: Xóa Bỏ Bẫy Null Bằng Optional Monad Chaining

Ví dụ thực chiến: Lấy tên chi nhánh ngân hàng từ hồ sơ của User.

Cách viết cẩu thả truyền thống (Dễ gặp <code>NullPointerException</code> hoặc <code>optional.get()</code> cẩu thả):
~~~java
// PHONG CÁCH BAD-PRACTICE
User user = userRepository.findById(userId).get(); // RỦI RO: Ném NoSuchElementException nếu rỗng!
if (user.getProfile() != null) {
    if (user.getProfile().getBankDetails() != null) {
        return user.getProfile().getBankDetails().getBranchName();
    }
}
return "UNKNOWN_BRANCH";
~~~

Cách viết chuyên nghiệp đạt chuẩn Functional Monad:
~~~java
package com.enterprise.course.modernjava.optional;

import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class UserProfileQueryService {

    private final UserJpaRepository userRepository;

    public UserProfileQueryService(UserJpaRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String resolveBankBranchName(String userId) {
        return userRepository.findById(userId) // Trả về Optional<User>
                .map(User::getProfile)           // Nếu có User -> lấy Profile (an toàn)
                .map(UserProfile::getBankDetails)// Nếu có Profile -> lấy BankDetails
                .map(BankDetails::getBranchName) // Nếu có BankDetails -> lấy BranchName
                .filter(branch -> !branch.isBlank()) // Lọc bỏ chuỗi rỗng
                .orElse("DEFAULT_HEADQUARTERS"); // Giá trị mặc định nếu bất kỳ bước nào bị null!
    }
}
~~~

### 2.2. Xây Dựng Custom Collector Hiệu Năng Cao: Single-Pass Analytics

Một lỗi phổ biến là duyệt qua List 4 lần để tính Min, Max, Sum, Average.
Chúng ta sẽ xây dựng một **Custom Collector** tính toán toàn bộ chỉ số tài chính trong **1 lượt duyệt duy nhất ($O(N)$)**:

~~~java
package com.enterprise.course.modernjava.stream;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collections;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.function.BinaryOperator;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collector;

public record TransactionSummary(
        long count,
        BigDecimal totalVolume,
        BigDecimal averageAmount,
        BigDecimal minAmount,
        BigDecimal maxAmount
) {
    // Accumulator lưu trữ trạng thái trung gian trong bộ nhớ
    public static class Accumulator {
        private long count = 0;
        private BigDecimal totalVolume = BigDecimal.ZERO;
        private BigDecimal minAmount = null;
        private BigDecimal maxAmount = null;

        public void accept(BigDecimal amount) {
            this.count++;
            this.totalVolume = this.totalVolume.add(amount);
            this.minAmount = (this.minAmount == null) ? amount : this.minAmount.min(amount);
            this.maxAmount = (this.maxAmount == null) ? amount : this.maxAmount.max(amount);
        }

        public Accumulator combine(Accumulator other) {
            this.count += other.count;
            this.totalVolume = this.totalVolume.add(other.totalVolume);
            if (other.minAmount != null) {
                this.minAmount = (this.minAmount == null) ? other.minAmount : this.minAmount.min(other.minAmount);
            }
            if (other.maxAmount != null) {
                this.maxAmount = (this.maxAmount == null) ? other.maxAmount : this.maxAmount.max(other.maxAmount);
            }
            return this;
        }

        public TransactionSummary toSummary() {
            BigDecimal avg = (this.count == 0)
                    ? BigDecimal.ZERO
                    : this.totalVolume.divide(BigDecimal.valueOf(this.count), 2, RoundingMode.HALF_UP);
            
            return new TransactionSummary(
                    this.count,
                    this.totalVolume,
                    avg,
                    this.minAmount != null ? this.minAmount : BigDecimal.ZERO,
                    this.maxAmount != null ? this.maxAmount : BigDecimal.ZERO
            );
        }
    }

    public static Collector<BigDecimal, Accumulator, TransactionSummary> collector() {
        return new Collector<>() {
            @Override
            public Supplier<Accumulator> supplier() { return Accumulator::new; }

            @Override
            public BiConsumer<Accumulator, BigDecimal> accumulator() { return Accumulator::accept; }

            @Override
            public BinaryOperator<Accumulator> combiner() { return Accumulator::combine; }

            @Override
            public Function<Accumulator, TransactionSummary> finisher() { return Accumulator::toSummary; }

            @Override
            public Set<Characteristics> characteristics() { return Collections.emptySet(); }
        };
    }
}
~~~

### 2.3. Cô Lập Parallel Stream Bằng Custom <code>ForkJoinPool</code>

Khi bắt buộc phải xử lý dữ liệu nặng song song, hãy bọc trong một ForkJoinPool riêng biệt để bảo vệ <code>commonPool</code>:

~~~java
package com.enterprise.course.modernjava.stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ForkJoinPool;

@Service
public class IsolatedParallelProcessingService {

    private static final Logger log = LoggerFactory.getLogger(IsolatedParallelProcessingService.class);

    // Tạo riêng 1 pool với 4 threads, không bao giờ dùng chung commonPool của JVM
    private final ForkJoinPool customPool = new ForkJoinPool(4);

    public List<String> processHeavyCpuTasks(List<String> rawData) {
        try {
            // Nộp tác vụ vào pool riêng biệt
            return customPool.submit(() -> rawData.parallelStream()
                    .map(this::heavyHashingAlgorithm)
                    .toList()
            ).get();
        } catch (InterruptedException | ExecutionException e) {
            log.error("Parallel processing failed: {}", e.getMessage());
            throw new RuntimeException("Error processing batch data", e);
        }
    }

    private String heavyHashingAlgorithm(String input) {
        // Tác vụ tính toán CPU-bound
        return "HASHED-" + input.hashCode();
    }
}
~~~

---

## 3. Kiểm thử, Metrics & Vận hành thực chiến

### 3.1. So Sánh Hiệu Năng: Vòng Lặp Imperative For vs Stream vs Custom Collector

Chạy thử nghiệm trên 1,000,000 giao dịch:

~~~java
package com.enterprise.course.modernjava;

import com.enterprise.course.modernjava.stream.TransactionSummary;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class StreamPerformanceBenchmark {

    public static void main(String[] args) {
        int recordCount = 1_000_000;
        List<BigDecimal> amounts = new ArrayList<>(recordCount);
        Random random = new Random();
        for (int i = 0; i < recordCount; i++) {
            amounts.add(BigDecimal.valueOf(random.nextDouble() * 1000));
        }

        // Đo thời gian Custom Collector (Single-pass)
        long start = System.currentTimeMillis();
        TransactionSummary summary = amounts.stream()
                .collect(TransactionSummary.collector());
        long duration = System.currentTimeMillis() - start;

        System.out.println("Computed 1,000,000 records in: " + duration + " ms");
        System.out.printf("Count: %d | Total: %s | Avg: %s | Min: %s | Max: %s%n",
                summary.count(), summary.totalVolume(), summary.averageAmount(), summary.minAmount(), summary.maxAmount());
    }
}
~~~

Kết quả đo đạc:
~~~text
Computed 1,000,000 records in: 84 ms
Count: 1000000 | Total: 499823121.45 | Avg: 499.82 | Min: 0.01 | Max: 999.99
~~~
Tốc độ xử lý đạt hơn **12 triệu bản ghi mỗi giây** với thuật toán Single-Pass!

---

## 4. Production Pitfalls & Post-Mortem

### 4.1. Sự cố 1: Dùng <code>Optional</code> Làm Field Trong JPA Entity Gây Lỗi Serialization

- **Bối cảnh**: Lập trình viên muốn thể hiện thuộc tính có thể null và khai báo:
  ~~~java
  @Entity
  public class User {
      private Optional<String> middleName; // SAI LẦM NGHIÊM TRỌNG
  }
  ~~~
- **Hậu quả**:
  1. <code>java.util.Optional</code> **KHÔNG implement interface <code>java.io.Serializable</code>**. Khi session serialize xuống Redis hoặc Hibernate flush cache, ứng dụng ném ngoại lệ <code>java.io.NotSerializableException: java.util.Optional</code>.
  2. Hibernate/JPA không hỗ trợ mapping <code>Optional</code> vào cột database.
- **Quy tắc vàng**:
  - <code>Optional</code> **CHỈ DÙNG** làm kiểu dữ liệu trả về của phương thức (Return type).
  - **KHÔNG BAO GIỜ** dùng <code>Optional</code> làm Field của Class, tham số truyền vào của phương thức (Method parameter), hoặc phần tử trong Collection (<code>List<Optional<T>></code>).

### 4.2. Sự cố 2: Tái Sử Dụng Stream Đã Bị Đóng (<code>IllegalStateException</code>)

- **Bối cảnh**:
  ~~~java
  Stream<String> stream = names.stream().filter(n -> n.startsWith("A"));
  long count = stream.count(); // Terminal operation 1: Stream đã bị tiêu thụ và ĐÓNG!
  List<String> list = stream.toList(); // Terminal operation 2 -> CRASH!
  ~~~
- **Hậu quả**: JVM ném ngay <code>java.lang.IllegalStateException: stream has already been operated upon or closed</code>.
- **Giải pháp**: Stream là ống dẫn dùng 1 lần (One-off pipeline). Nếu cần dùng lại, phải tạo Stream mới từ tập dữ liệu gốc.

---

## 5. Hands-on Enterprise Challenge & Reference Solution

### Đề bài: Phân Nhóm và Kiểm Soát Giao Dịch Gian Lận Bằng Stream API

Hệ thống Fraud Detection cần phân tích danh sách các giao dịch thanh toán trong 1 giờ qua:
1. Lọc bỏ các giao dịch có trạng thái <code>CANCELLED</code>.
2. Phân nhóm các giao dịch theo đơn vị tiền tệ (<code>Currency</code>: "VND", "USD", "EUR").
3. Với mỗi loại tiền tệ, tìm danh sách **Top 3 giao dịch có giá trị lớn nhất**.
4. Toàn bộ logic phải viết bằng Stream API thuần túy, không dùng vòng lặp <code>for/while</code>, tối ưu bộ nhớ.

### Lời giải hoàn chỉnh (Reference Solution)

~~~java
package com.enterprise.course.challenge.modernjava;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

public class FraudDetectionStreamChallenge {

    public record Transaction(
            String id,
            String customerId,
            BigDecimal amount,
            String currency,
            String status,
            Instant createdAt
    ) {}

    public static Map<String, List<Transaction>> findTop3TransactionsPerCurrency(List<Transaction> transactions) {
        return transactions.stream()
                // 1. Loại bỏ các giao dịch bị hủy
                .filter(tx -> !"CANCELLED".equalsIgnoreCase(tx.status()))
                
                // 2. Nhóm theo Currency và thu thập Top 3 giao dịch lớn nhất
                .collect(Collectors.groupingBy(
                        Transaction::currency,
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                list -> list.stream()
                                        .sorted(Comparator.comparing(Transaction::amount).reversed())
                                        .limit(3)
                                        .toList()
                        )
                ));
    }

    public static void main(String[] args) {
        List<Transaction> mockData = List.of(
                new Transaction("TX1", "C1", new BigDecimal("100"), "USD", "COMPLETED", Instant.now()),
                new Transaction("TX2", "C2", new BigDecimal("500"), "USD", "COMPLETED", Instant.now()),
                new Transaction("TX3", "C3", new BigDecimal("250"), "USD", "COMPLETED", Instant.now()),
                new Transaction("TX4", "C4", new BigDecimal("900"), "USD", "CANCELLED", Instant.now()), // Bị lọc bỏ
                new Transaction("TX5", "C5", new BigDecimal("1200"), "USD", "COMPLETED", Instant.now()),
                new Transaction("TX6", "C6", new BigDecimal("5000000"), "VND", "COMPLETED", Instant.now())
        );

        Map<String, List<Transaction>> result = findTop3TransactionsPerCurrency(mockData);

        result.forEach((currency, topTxList) -> {
            System.out.println("Currency: " + currency);
            topTxList.forEach(tx -> System.out.printf("  - ID: %s | Amount: %s %s%n", tx.id(), tx.amount(), tx.currency()));
        });
    }
}
~~~
`
    },
    {
      id: "0-3",
      type: "lesson",
      title: "Java 17/21: record, sealed, pattern matching",
      minutes: 50,
      content: `## Lập trình Hướng Dữ Liệu (Data-Oriented Programming) Với Java 17 & Java 21

Khi Spring Boot 3.0 ra mắt, quyết định táo bạo nhất của Spring Team là: **Khai tử Java 8 và đặt mức tối thiểu là Java 17, đồng thời khuyến nghị Java 21 LTS**.

Tại sao Spring lại có bước nhảy vọt này? Bởi vì Java 17 và 21 không chỉ là "vài cú pháp viết tắt cho đẹp". Chúng đại diện cho một bước chuyển mình mang tính cách mạng trong kiến trúc phần mềm: **Data-Oriented Programming (Lập trình hướng dữ liệu)** do Brian Goetz (Kiến trúc sư trưởng ngôn ngữ Java) khởi xướng:
1. **Tách biệt rạch ròi giữa Dữ liệu (Data) và Hành vi (Behavior)**: Dữ liệu là bất biến và trong suốt (Records).
2. **Mô hình hóa các trạng thái nghiệp vụ dưới dạng Algebraic Data Types (Kiểu dữ liệu đại số)**: Kết hợp giữa <code>record</code> (Product Types) và <code>sealed interface</code> (Sum Types).
3. **Phân tích hình dạng dữ liệu bằng Pattern Matching & Deconstruction**: Thay thế hoàn toàn hàng chục câu lệnh <code>if-else instanceof</code> và Design Pattern Visitor cồng kềnh bằng biểu thức <code>switch</code> có sự bảo đảm toàn diện từ Compiler.
4. **Đột phá Concurrency với Virtual Threads**: Mở ra kỷ nguyên xử lý hàng triệu kết nối đồng thời với mô hình đồng bộ đơn giản.

Bài học này sẽ hướng dẫn bạn làm chủ toàn bộ các vũ khí tối tân này để viết mã nguồn Spring Boot 3.3 sạch, an toàn và tối ưu tuyệt đối.

---

## 1. Kiến trúc chuyên sâu & Cơ chế hoạt động (Under the Hood)

### 1.1. Bản Chất Tầng Sâu Của <code>record</code>: An Toàn Deserialization & Bất Biến Nông

Trong OOP truyền thống, một POJO DTO cần tới 50 dòng code (getters, setters, equals, hashCode, toString). Nhưng nguy hiểm hơn là: **Lỗ hổng Deserialization Attack**.
Khi Java deserialize một class thông thường, nó sử dụng Reflection để can thiệp trực tiếp vào bộ nhớ và gán giá trị cho các private fields **mà hoàn toàn không gọi Constructor**. Tin tặc có thể inject dữ liệu độc hại để tạo ra các Object có trạng thái vô lý (ví dụ: <code>age = -50</code> hoặc <code>role = "ADMIN"</code>).

Với **<code>record</code>**:
- JVM áp đặt quy tắc bất di bất dịch: **Mọi quá trình Deserialization BẮT BUỘC phải đi qua Canonical Constructor**!
- Điều này có nghĩa là mọi kiểm tra hợp lệ (Invariants) trong Compact Constructor sẽ luôn luôn được thực thi, chặn đứng 100% các cuộc tấn công dữ liệu giả mạo!

~~~text
+─────────────────────────────────────────────────────────────────────────────+
| CẠM BẪY BẤT BIẾN NÔNG (SHALLOW IMMUTABILITY) TRONG RECORD                   |
|                                                                             |
|  public record OrderDto(String id, List<String> items) {}                   |
|                                                                             |
|  - Biến tham chiếu "items" là final (không thể gán List khác)               |
|  - NHƯNG: Nội dung bên trong List VẪN BỊ SỬA ĐƯỢC nếu là ArrayList!         |
|                                                                             |
|  order.items().add("HACKED"); // VẪN CHẠY ĐƯỢC VÀ LÀM BẨN DỮ LIỆU!          |
|                                                                             |
|  --> GIẢI PHÁP: Bắt buộc dùng Defensive Copying với List.copyOf()           |
+─────────────────────────────────────────────────────────────────────────────+
~~~

### 1.2. Sealed Classes & Interfaces: Tính Toàn Vẹn Compile-Time (Exhaustiveness)

Trước Java 17, khi bạn tạo một interface <code>PaymentResult</code>, bất kỳ class nào trong toàn bộ dự án cũng có thể implement nó. Bạn không thể kiểm soát được có bao nhiêu kịch bản kết quả có thể xảy ra.

Với **<code>sealed</code>**:
- Bạn ra lệnh cho Compiler: *"Interface này CHỈ CHO PHÉP đúng 4 class cụ thể kế thừa!"*
- Khi kết hợp với Pattern Matching trong <code>switch</code>, Compiler biết chính xác toàn bộ không gian trạng thái. Nếu bạn xử lý thiếu 1 kịch bản, **code sẽ không thể compile**! Bạn không còn cần đến nhánh <code>default: throw new IllegalStateException()</code> nữa!

~~~text
               +───────────────────────────────────+
               | <<sealed>> PaymentResult (Sum)    |
               +─────────────────┬─────────────────+
                                 │ permits
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
+─────────────────+     +─────────────────+     +─────────────────+
| PaymentSuccess  |     | InsufficientFund|     | GatewayTimeout  |
| (record - final)|     | (record - final)|     | (record - final)|
+─────────────────+     +─────────────────+     +─────────────────+
~~~

### 1.3. Pattern Matching & Record Deconstruction (Bóc Tách Dữ Liệu)

Java 21 cho phép bạn "bóc tách" (deconstruct) các thành phần bên trong Record trực tiếp ngay tại mệnh đề <code>case</code>, kết hợp với điều kiện bảo vệ <code>when</code>:

~~~text
case PaymentSuccess(var txnId, var amount) when amount.compareTo(LIMIT) > 0 -> ...
~~~
Không còn ép kiểu <code>(PaymentSuccess) result</code>, không còn gọi <code>.getAmount()</code>. Tất cả diễn ra tự nhiên, an toàn kiểu 100%!

---

## 2. Production-Grade Implementation Code

### 2.1. Thiết Kế Record DTO Chuẩn Mực Với Defensive Copying & Validation

~~~java
package com.enterprise.course.modernjava.records;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.math.BigDecimal;
import java.util.List;

public record CreateOrderRequest(
        @NotBlank(message = "Customer ID must not be blank")
        String customerId,

        @DecimalMin(value = "0.01", message = "Amount must be strictly positive")
        BigDecimal totalAmount,

        @NotEmpty(message = "Order must contain at least one item")
        List<String> itemSkus
) {
    // Compact Constructor: Nơi thực thi Invariant Rules và Defensive Copy
    public CreateOrderRequest {
        if (customerId == null || customerId.isBlank()) {
            throw new IllegalArgumentException("Customer ID cannot be empty");
        }
        if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        // DEFENSIVE COPYING: Đảm bảo tính bất biến sâu (Deep Immutability)
        // Ngăn chặn caller can thiệp sửa đổi List từ bên ngoài!
        itemSkus = (itemSkus != null) ? List.copyOf(itemSkus) : List.of();
    }

    // Custom helper method không phá vỡ cấu trúc record
    public int totalItemCount() {
        return itemSkus.size();
    }
}
~~~

### 2.2. Xây Dựng Miền Nghiệp Vụ Với Sealed Interface & Algebraic Data Types

Mô hình hóa kết quả giao dịch thanh toán trong hệ thống Core Banking:

~~~java
package com.enterprise.course.modernjava.adt;

import java.math.BigDecimal;
import java.time.Instant;

// Sealed Interface: Chỉ cho phép 4 Records cụ thể thực thi
public sealed interface PaymentExecutionResult permits 
        PaymentExecutionResult.Success,
        PaymentExecutionResult.InsufficientFunds,
        PaymentExecutionResult.GatewayTimeout,
        PaymentExecutionResult.FraudRejected {

    record Success(
            String transactionId,
            BigDecimal chargedAmount,
            String authCode,
            Instant timestamp
    ) implements PaymentExecutionResult {}

    record InsufficientFunds(
            String accountId,
            BigDecimal currentBalance,
            BigDecimal requiredAmount
    ) implements PaymentExecutionResult {}

    record GatewayTimeout(
            String gatewayName,
            String targetEndpoint,
            long elapsedMs
    ) implements PaymentExecutionResult {}

    record FraudRejected(
            String reasonCode,
            int riskScore,
            String flaggedRule
    ) implements PaymentExecutionResult {}
}
~~~

### 2.3. Bộ Xử Lý Sự Kiện Bằng Pattern Matching & Record Deconstruction

Sử dụng <code>switch</code> biểu thức với Record Patterns và Guard <code>when</code> trong Java 21:

~~~java
package com.enterprise.course.modernjava.adt;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class PaymentResultOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(PaymentResultOrchestrator.class);
    private static final BigDecimal VIP_AUDIT_THRESHOLD = new BigDecimal("5000.00");

    public String handlePaymentOutcome(PaymentExecutionResult result) {
        // COMPILER EXHAUSTIVENESS CHECK:
        // Không cần nhánh "default". Nếu thêm một class mới vào sealed interface, code này sẽ báo lỗi compile ngay!
        return switch (result) {
            // 1. Deconstruction Pattern + Guard 'when' cho giao dịch giá trị lớn
            case PaymentExecutionResult.Success(var txnId, var amount, var authCode, var time)
                    when amount.compareTo(VIP_AUDIT_THRESHOLD) >= 0 -> {
                log.warn("VIP Transaction detected! Triggering AML audit for txnId={}, amount={}", txnId, amount);
                yield "NOTIFY_VIP_DESK: " + txnId;
            }

            // 2. Deconstruction Pattern cho giao dịch thành công thông thường
            case PaymentExecutionResult.Success(var txnId, var amount, var authCode, var time) -> {
                log.info("Payment succeeded: txnId={}, authCode={}", txnId, authCode);
                yield "DISPATCH_GOODS: " + txnId;
            }

            // 3. Xử lý thiếu số dư
            case PaymentExecutionResult.InsufficientFunds(var accId, var curBal, var reqAmt) -> {
                BigDecimal missing = reqAmt.subtract(curBal);
                log.warn("Declined: Account {} lacks {} USD", accId, missing);
                yield "PROMPT_TOP_UP: " + missing;
            }

            // 4. Xử lý timeout đối tác
            case PaymentExecutionResult.GatewayTimeout(var gwName, var endpoint, var elapsed) -> {
                log.error("Network timeout calling {} after {}ms", gwName, elapsed);
                yield "ENQUEUE_FOR_BACKGROUND_RETRY";
            }

            // 5. Xử lý nghi vấn gian lận
            case PaymentExecutionResult.FraudRejected(var code, var riskScore, var rule) -> {
                log.error("Security alert! Fraud risk score {} exceeded by rule {}", riskScore, rule);
                yield "LOCK_ACCOUNT_AND_ALERT_SECURITY";
            }
        };
    }
}
~~~

### 2.4. Khởi Chạy 10,000 Virtual Threads Xử Lý Tác Vụ Đồng Thời Trong Java 21

So sánh sự khác biệt: Khởi tạo 10,000 Platform Threads sẽ làm crash máy tính vì tốn 10GB RAM. Trong khi đó, 10,000 Virtual Threads chỉ tốn vài Megabytes RAM và chạy trong chớp mắt:

~~~java
package com.enterprise.course.modernjava.concurrency;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

public class HighConcurrencyVirtualThreadsDemo {

    private static final Logger log = LoggerFactory.getLogger(HighConcurrencyVirtualThreadsDemo.class);

    public static void main(String[] args) {
        int totalTasks = 10_000;
        AtomicInteger completedCount = new AtomicInteger(0);
        Instant start = Instant.now();

        // Sử dụng VirtualThreadPerTaskExecutor của Java 21
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 1; i <= totalTasks; i++) {
                final int taskId = i;
                executor.submit(() -> {
                    try {
                        // Giả lập tác vụ I/O chặn (Blocking I/O) như gọi HTTP hoặc Database trong 100ms
                        Thread.sleep(100);
                        completedCount.incrementAndGet();
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                });
            }
        } // Khối try-with-resources tự động gọi executor.close() và chờ 10,000 tasks hoàn tất!

        Duration duration = Duration.between(start, Instant.now());
        log.info("Successfully executed {} virtual threads in {} ms!", completedCount.get(), duration.toMillis());
    }
}
~~~

---

## 3. Kiểm thử, Metrics & Vận hành thực chiến

### 3.1. Kiểm Chứng Tính Bất Biến Sâu Của Record

Viết bài kiểm thử Unit Test chứng minh <code>List.copyOf()</code> bảo vệ dữ liệu khỏi bị sửa đổi lén:

~~~java
package com.enterprise.course.modernjava;

import com.enterprise.course.modernjava.records.CreateOrderRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

public class RecordDeepImmutabilityTest {

    @Test
    @DisplayName("Record phải bất biến sâu: Không thể can thiệp sửa List sau khi tạo")
    void testDefensiveCopying() {
        List<String> mutableList = new ArrayList<>();
        mutableList.add("SKU-IPHONE");

        CreateOrderRequest request = new CreateOrderRequest("CUST-01", new BigDecimal("1000.00"), mutableList);

        // 1. Thử sửa đổi list gốc từ bên ngoài
        mutableList.add("SKU-MACBOOK");

        // Record vẫn giữ nguyên trạng thái độc lập, không bị ảnh hưởng!
        assertThat(request.itemSkus()).hasSize(1);
        assertThat(request.itemSkus()).containsExactly("SKU-IPHONE");

        // 2. Thử gọi add trực tiếp trên list của record -> Phải ném UnsupportedOperationException!
        assertThatThrownBy(() -> request.itemSkus().add("SKU-MALICIOUS"))
                .isInstanceOf(UnsupportedOperationException.class);
    }
}
~~~

---

## 4. Production Pitfalls & Post-Mortem

### 4.1. Sự cố 1: Dùng <code>record</code> Làm JPA <code>@Entity</code> Gây Lỗi Khởi Động

- **Bối cảnh**: Thấy cú pháp <code>record</code> quá ngắn gọn, lập trình viên quyết định áp dụng:
  ~~~java
  @Entity
  public record UserEntity(String id, String username) {} // LỖI BIÊN DỊCH HOẶC RUNTIME CRASH
  ~~~
- **Nguyên nhân cốt lõi**: JPA Specification (Hibernate) bắt buộc:
  1. Entity phải có **No-Arg Constructor** (Constructor không tham số) để Reflection nạp dữ liệu từ SQL ResultSets. Record không hỗ trợ No-Arg constructor mặc định.
  2. Entity phải có thể bị kế thừa để Hibernate sinh ra CGLIB / ByteBuddy Proxy phục vụ tính năng Lazy Loading. Trong khi đó, **Record mặc định là <code>final</code>** và cấm hoàn toàn việc kế thừa!
  3. Mọi field của Entity phải có thể bị thay đổi trạng thái (Dirty Checking). Field của Record là <code>final</code>.
- **Quy tắc vàng**:
  - <code>record</code>: Dành riêng cho **DTO, Value Object, Command, Query, Event, Config properties**.
  - <code>@Entity</code>: Bắt buộc dùng **Class thông thường** (có thể dùng Lombok <code>@Getter</code> / <code>@Setter</code>).

### 4.2. Sự cố 2: NullPointerException Khi Switch Trên Biến Null

- **Bối cảnh**:
  ~~~java
  PaymentExecutionResult result = null;
  switch (result) { // Ném NullPointerException NGAY TẠI DÒNG SWITCH!
      case PaymentExecutionResult.Success s -> ...
  }
  ~~~
- **Nguyên nhân**: Mặc định biểu thức <code>switch</code> trong Java sẽ ném <code>NullPointerException</code> nếu đối tượng truyền vào là <code>null</code> trước khi kịp so khớp các case.
- **Giải pháp trong Java 21**: Bạn có thể bắt trực tiếp case <code>null</code> bên trong switch:
  ~~~java
  switch (result) {
      case null -> log.error("Result is null!");
      case PaymentExecutionResult.Success s -> ...
  }
  ~~~

---

## 5. Hands-on Enterprise Challenge & Reference Solution

### Đề bài: Xây Dựng Core Banking Event Processor Hoàn Toàn Bằng ADT

Thiết kế mô hình sự kiện biến động số dư tài khoản ngân hàng:
1. <code>sealed interface BankAccountEvent</code> chỉ cho phép các records:
   - <code>MoneyDeposited(String accId, BigDecimal amount, String source)</code>
   - <code>MoneyWithdrawn(String accId, BigDecimal amount, String atmId)</code>
   - <code>AccountFrozen(String accId, String reason, String officerId)</code>
2. Viết phương thức <code>BigDecimal calculateNewBalance(BigDecimal currentBalance, BankAccountEvent event)</code>:
   - Xử lý nạp tiền: Cộng vào số dư.
   - Xử lý rút tiền: Kiểm tra nếu số dư không đủ thì ném <code>IllegalStateException</code>, ngược lại trừ số dư.
   - Xử lý phong tỏa: Nếu tài khoản bị phong tỏa, ném <code>AccountBlockedException</code>.
   - **Yêu cầu bắt buộc**: Viết bằng Pattern Matching <code>switch</code> biểu thức trong Java 21, tuyệt đối không dùng <code>if-else</code>.

### Lời giải hoàn chỉnh (Reference Solution)

~~~java
package com.enterprise.course.challenge.modernjava;

import java.math.BigDecimal;

public class BankingEventProcessorChallenge {

    public sealed interface BankAccountEvent permits 
            BankAccountEvent.MoneyDeposited,
            BankAccountEvent.MoneyWithdrawn,
            BankAccountEvent.AccountFrozen {

        record MoneyDeposited(String accId, BigDecimal amount, String source) implements BankAccountEvent {}
        record MoneyWithdrawn(String accId, BigDecimal amount, String atmId) implements BankAccountEvent {}
        record AccountFrozen(String accId, String reason, String officerId) implements BankAccountEvent {}
    }

    public static class AccountBlockedException extends RuntimeException {
        public AccountBlockedException(String message) { super(message); }
    }

    public static BigDecimal applyEvent(BigDecimal currentBalance, BankAccountEvent event) {
        return switch (event) {
            case BankAccountEvent.MoneyDeposited(var accId, var amount, var src) -> {
                System.out.printf("Depositing %s to account %s from %s%n", amount, accId, src);
                yield currentBalance.add(amount);
            }

            case BankAccountEvent.MoneyWithdrawn(var accId, var amount, var atmId)
                    when currentBalance.compareTo(amount) < 0 -> {
                throw new IllegalStateException(String.format(
                        "Cannot withdraw %s from account %s: Insufficient funds (Current: %s)",
                        amount, accId, currentBalance
                ));
            }

            case BankAccountEvent.MoneyWithdrawn(var accId, var amount, var atmId) -> {
                System.out.printf("Withdrawing %s from account %s at ATM %s%n", amount, accId, atmId);
                yield currentBalance.subtract(amount);
            }

            case BankAccountEvent.AccountFrozen(var accId, var reason, var officer) -> {
                throw new AccountBlockedException(String.format(
                        "Account %s was FROZEN by officer %s. Reason: %s", accId, officer, reason
                ));
            }
        };
    }

    public static void main(String[] args) {
        BigDecimal balance = new BigDecimal("1000.00");

        // 1. Nạp 500
        balance = applyEvent(balance, new BankAccountEvent.MoneyDeposited("ACC-01", new BigDecimal("500.00"), "SALARY"));
        System.out.println("Balance after deposit: " + balance); // 1500.00

        // 2. Rút 300
        balance = applyEvent(balance, new BankAccountEvent.MoneyWithdrawn("ACC-01", new BigDecimal("300.00"), "ATM-CENTER"));
        System.out.println("Balance after withdrawal: " + balance); // 1200.00

        // 3. Rút vượt quá số dư -> Ném Exception an toàn!
        try {
            applyEvent(balance, new BankAccountEvent.MoneyWithdrawn("ACC-01", new BigDecimal("5000.00"), "ATM-CENTER"));
        } catch (IllegalStateException e) {
            System.out.println("Caught expected error: " + e.getMessage());
        }
    }
}
~~~
`
    },
    {
      id: "0-4",
      type: "lesson",
      title: "Maven thành thạo: lifecycle, scope, multi-module",
      minutes: 50,
      content: `## Quản Trị Dự Án Đẳng Cấp Doanh Nghiệp Với Apache Maven

Trong các dự án phần mềm nhỏ, lập trình viên thường coi Maven chỉ là: *"Một công cụ để copy các thẻ <code><dependency></code> từ trang <code>mvnrepository.com</code> dán vào file <code>pom.xml</code>"*.

Nhưng trong các hệ thống phần mềm doanh nghiệp lớn (như nền tảng LAAS, OLS hay các hệ thống Core Banking):
- Dự án gồm 20 modules lồng nhau, phụ thuộc hàng trăm thư viện bên thứ ba.
- Một ngày đẹp trời, hệ thống ném ngoại lệ kinh hoàng trên Production:
  <code>java.lang.NoSuchMethodError: org.apache.commons.codec.binary.Base64.encodeBase64String([B)Ljava/lang/String;</code>
  Mặc dù code compile trên máy local hoàn toàn không có lỗi!
- Thời gian build CI/CD kéo dài 25 phút vì tải lại các dependency không cần thiết.
- Các module phụ thuộc vòng vèo (Cyclic Dependencies) khiến Maven không thể xác định thứ tự biên dịch (Reactor Build Order).

**Maven là xương sống của toàn bộ quy trình đóng gói và phát hành phần mềm Java**. Để trở thành một Tech Lead hoặc Senior Engineer, bạn bắt buộc phải hiểu rõ: **Giải thuật phân giải xung đột Nearest-Wins**, cơ chế **BOM (Bill of Materials)**, sự khác biệt giữa <code><dependencyManagement></code> và <code><dependencies></code>, và cách phân tách cấu trúc **Multi-Module Project** chuẩn mực.

---

## 1. Kiến trúc chuyên sâu & Cơ chế hoạt động (Under the Hood)

### 1.1. Ba Vòng Đời Tách Biệt Của Maven (Maven Lifecycles) & Plugin Goals

Maven không phải là một chuỗi lệnh tuyến tính đơn giản. Nó quản lý quá trình build thông qua **3 vòng đời độc lập hoàn toàn**:

~~~text
+─────────────────────────────────────────────────────────────────────────────+
| BA VÒNG ĐỜI ĐỘC LẬP TRONG MAVEN (LIFECYCLES)                                |
|                                                                             |
| 1. CLEAN Lifecycle: (Dọn dẹp thư mục target/)                               |
|    pre-clean ──> [ clean ] ──> post-clean                                   |
|                                                                             |
| 2. DEFAULT Lifecycle: (Biên dịch, kiểm thử và đóng gói ứng dụng)           |
|    validate ──> compile ──> test-compile ──> [ test ] ──> [ package ]      |
|    ──> [ verify ] ──> [ install ] ──> [ deploy ]                            |
|                                                                             |
| 3. SITE Lifecycle: (Sinh tài liệu dự án HTML)                               |
|    pre-site ──> [ site ] ──> post-site ──> site-deploy                      |
+─────────────────────────────────────────────────────────────────────────────+
~~~

- **Phase (Pha)**: Là một cột mốc trong vòng đời. Khi bạn gọi <code>mvn package</code>, Maven sẽ tự động thực thi tuần tự **tất cả các phase đứng trước nó** (<code>validate</code> -> <code>compile</code> -> <code>test</code> -> <code>package</code>).
- **Goal (Mục tiêu)**: Là đơn vị thực thi thực sự của một **Plugin**. Một Phase được gắn (bind) với một hoặc nhiều Plugin Goals:
  - Phase <code>compile</code> được bind với goal <code>compiler:compile</code> (của <code>maven-compiler-plugin</code>).
  - Phase <code>test</code> được bind với goal <code>surefire:test</code> (của <code>maven-surefire-plugin</code>).
  - Phase <code>package</code> của Spring Boot được bind với goal <code>spring-boot:repackage</code>.

### 1.2. Giải Thuật Phân Giải Xung Đột Thư Viện (Dependency Mediation Algorithm)

Khi Module A phụ thuộc thư viện B (cần Jackson 2.15) và thư viện C (cần Jackson 2.12), Maven giải quyết xung đột phiên bản như thế nào?

Maven sử dụng 2 quy tắc bất di bất dịch:
1. **Quy tắc 1: Nearest-Wins (Thư viện nằm ở độ sâu gần nhất trong cây phụ thuộc sẽ chiến thắng)**:

~~~text
Project A (Của bạn)
   ├── Dependency B ──> Jackson 2.15 (Độ sâu 2 - CHIẾN THẮNG!)
   └── Dependency C ──> Sub-lib D ──> Jackson 2.12 (Độ sâu 3 - BỊ LOẠI BỎ!)
~~~

2. **Quy tắc 2: First-Declared (Khai báo trước sẽ thắng nếu cùng độ sâu)**:
Nếu cả Jackson 2.15 và Jackson 2.12 đều nằm ở độ sâu 2, thư viện nào được khai báo trước trong file <code>pom.xml</code> sẽ được chọn!

> [!CAUTION]
> **Hậu quả của Nearest-Wins**: Nếu một thư viện transitively kéo theo một phiên bản cũ (ví dụ Jackson 2.12 thiếu method mới), trong khi code của bạn gọi method chỉ có ở 2.15 -> Khi chạy, JVM ném lỗi **<code>NoSuchMethodError</code>**! 
> Đây chính là cơn ác mộng mang tên **"JAR Hell"** trong Java.

### 1.3. Cơ Chế BOM (Bill of Materials) & <code><dependencyManagement></code>

Làm thế nào để các tập đoàn lớn quản lý 50 microservices mà không bao giờ bị lệch phiên bản thư viện?
Họ sử dụng **BOM (Bill of Materials)**:

- **<code><dependencies></code>**: Khai báo thư viện nào thì thư viện đó **lập tức được tải về và đính kèm vào file JAR**.
- **<code><dependencyManagement></code>**: **KHÔNG HỀ tải thư viện về**. Nó chỉ đóng vai trò như một "Bảng tra cứu phiên bản tập trung (Version Lookup Table)". 
  - Submodule chỉ cần khai báo <code><groupId></code> và <code><artifactId></code>, không cần ghi <code><version></code>.
  - Submodule nào không khai báo thì sẽ không bị gánh thư viện thừa!
  - Sử dụng <code><scope>import</scope></code> và <code><type>pom</type></code> để kế thừa toàn bộ BOM của Spring Boot và Spring Cloud!

---

## 2. Production-Grade Implementation Code

Dưới đây là cấu trúc dự án **Multi-Module Enterprise chuẩn mực** cho hệ thống Fintech:

~~~text
fintech-platform/                    <-- Root Aggregator POM (packaging: pom)
│
├── pom.xml                         <-- Quản lý BOM, Plugins, Enforcer Rules tập trung
├── .mvn/jvm.config                 <-- Cấu hình RAM cho tiến trình build Maven
│
├── core-domain/                    <-- Module 1: Chứa POJOs, Records, Domain Entities
│   └── pom.xml                     <-- 100% Thuần Java, KHÔNG phụ thuộc Spring Web!
│
├── common-security/                <-- Module 2: Keycloak JWT, Security Filters chung
│   └── pom.xml
│
└── payment-service/                <-- Module 3: Ứng dụng Spring Boot chính (@SpringBootApplication)
    └── pom.xml                     <-- Đóng gói Fat JAR, phụ thuộc core-domain & security
~~~

### 2.1. File <code>pom.xml</code> Gốc (Root Aggregator & Parent POM)

File <code>fintech-platform/pom.xml</code>:

~~~xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.enterprise.fintech</groupId>
    <artifactId>fintech-platform-parent</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>pom</packaging>

    <name>Fintech Platform :: Parent Aggregator</name>
    <description>Enterprise multi-module parent POM with centralized dependency management</description>

    <!-- Khai báo danh sách các Submodules -->
    <modules>
        <module>core-domain</module>
        <module>common-security</module>
        <module>payment-service</module>
    </modules>

    <properties>
        <java.version>21</java.version>
        <maven.compiler.release>21</maven.compiler.release>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        
        <!-- Khai báo phiên bản các BOM trung tâm -->
        <spring.boot.version>3.3.4</spring.boot.version>
        <spring.cloud.version>2023.0.3</spring.cloud.version>
        <testcontainers.version>1.20.1</testcontainers.version>
        <mapstruct.version>1.6.2</mapstruct.version>
    </properties>

    <!-- 1. Quản lý phiên bản tập trung (BOM) — Không download trực tiếp -->
    <dependencyManagement>
        <dependencies>
            <!-- Spring Boot BOM -->
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>\${spring.boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <!-- Spring Cloud BOM -->
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>\${spring.cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <!-- Testcontainers BOM -->
            <dependency>
                <groupId>org.testcontainers</groupId>
                <artifactId>testcontainers-bom</artifactId>
                <version>\${testcontainers.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <!-- Khai báo phiên bản các Submodule nội bộ -->
            <dependency>
                <groupId>com.enterprise.fintech</groupId>
                <artifactId>core-domain</artifactId>
                <version>\${project.version}</version>
            </dependency>
            <dependency>
                <groupId>com.enterprise.fintech</groupId>
                <artifactId>common-security</artifactId>
                <version>\${project.version}</version>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <!-- 2. Quản lý Plugin & Thiết lập Luật Pháp Bằng Maven Enforcer Plugin -->
    <build>
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-maven-plugin</artifactId>
                    <version>\${spring.boot.version}</version>
                </plugin>
            </plugins>
        </pluginManagement>

        <plugins>
            <!-- Maven Enforcer Plugin: Chặn đứng các lỗi cấu hình từ sớm -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-enforcer-plugin</artifactId>
                <version>3.5.0</version>
                <executions>
                    <execution>
                        <id>enforce-enterprise-rules</id>
                        <goals>
                            <goal>enforce</goal>
                        </goals>
                        <configuration>
                            <rules>
                                <!-- Bắt buộc máy dev và CI phải chạy JDK 21 trở lên -->
                                <requireJavaVersion>
                                    <version>[21,)</version>
                                    <message>CRITICAL: Project requires JDK 21 or higher!</message>
                                </requireJavaVersion>
                                <!-- Bắt buộc Maven version >= 3.9 -->
                                <requireMavenVersion>
                                    <version>[3.9.0,)</version>
                                </requireMavenVersion>
                                <!-- Cấm các thư viện log cũ bị dính lỗ hổng bảo mật -->
                                <bannedDependencies>
                                    <excludes>
                                        <exclude>commons-logging:commons-logging</exclude>
                                        <exclude>log4j:log4j</exclude>
                                    </excludes>
                                    <message>BANNED: Legacy logging libraries detected! Use SLF4J instead.</message>
                                </bannedDependencies>
                            </rules>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
~~~

### 2.2. Submodule 1: <code>core-domain/pom.xml</code> (Thuần Khiết, Không Rác)

Module chứa Domain Models, Records, Value Objects. **Không phụ thuộc vào Spring Web hay Tomcat**:

~~~xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.enterprise.fintech</groupId>
        <artifactId>fintech-platform-parent</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>core-domain</artifactId>
    <packaging>jar</packaging>

    <dependencies>
        <!-- Jakarta Validation API (Chỉ API, không kéo theo Hibernate Validator cồng kềnh) -->
        <dependency>
            <groupId>jakarta.validation</groupId>
            <artifactId>jakarta.validation-api</artifactId>
        </dependency>
        <!-- JUnit 5 cho Unit Test (Không cần ghi version!) -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
~~~

### 2.3. Submodule 2: <code>payment-service/pom.xml</code> (Spring Boot Executable Application)

Module chứa mã nguồn Web API, Controller và tạo ra Fat JAR:

~~~xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.enterprise.fintech</groupId>
        <artifactId>fintech-platform-parent</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>payment-service</artifactId>
    <packaging>jar</packaging>

    <dependencies>
        <!-- Phụ thuộc Submodule nội bộ (Không cần ghi version!) -->
        <dependency>
            <groupId>com.enterprise.fintech</groupId>
            <artifactId>core-domain</artifactId>
        </dependency>

        <!-- Spring Boot Starter Web & Actuator -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <!-- Test Starter & Testcontainers -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <!-- Chỉ đóng gói Fat JAR ở module ứng dụng cuối cùng này -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <executions>
                    <execution>
                        <goals>
                            <goal>repackage</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
~~~

---

## 3. Kiểm thử, Metrics & Vận hành thực chiến

### 3.1. Truy Vết Cây Phụ Thuộc Bằng <code>mvn dependency:tree</code>

Để điều tra xung đột thư viện hoặc tìm xem thư viện nào kéo theo lỗ hổng bảo mật:

~~~bash
# 1. In toàn bộ cây phụ thuộc chi tiết
mvn dependency:tree

# 2. Lọc chính xác xem thư viện 'log4j' đang được kéo vào từ đâu
mvn dependency:tree -Dincludes=*log4j*

# 3. Phân tích xung đột chi tiết (Verbose mode - hiển thị cả các bản bị ghi đè)
mvn dependency:tree -Dverbose
~~~

Kết quả output trực quan:
~~~text
[INFO] com.enterprise.fintech:payment-service:jar:1.0.0-SNAPSHOT
[INFO] +- com.enterprise.fintech:core-domain:jar:1.0.0-SNAPSHOT:compile
[INFO] +- org.springframework.boot:spring-boot-starter-web:jar:3.3.4:compile
[INFO] |  +- org.springframework.boot:spring-boot-starter:jar:3.3.4:compile
[INFO] |  |  - org.springframework.boot:spring-boot-starter-logging:jar:3.3.4:compile
[INFO] |  |     - ch.qos.logback:logback-classic:jar:1.5.8:compile
~~~

### 3.2. Biên Dịch Nhanh 1 Submodule Riêng Biệt Bằng Reactor Flags

Trong dự án lớn gồm 30 modules, nếu bạn chỉ sửa code trong <code>payment-service</code>, bạn **không cần compile lại từ đầu toàn bộ dự án**:

~~~bash
# Biên dịch payment-service VÀ TỰ ĐỘNG biên dịch các module mà nó phụ thuộc (-am = also-make)
mvn clean package -pl payment-service -am -DskipTests
~~~
Lệnh này tiết kiệm 80% thời gian build trong quá trình phát triển cục bộ!

---

## 4. Production Pitfalls & Post-Mortem

### 4.1. Sự cố 1: Khai Báo <code><dependencies></code> Nhầm Trong Parent POM

- **Bối cảnh**: Kỹ sư muốn "tiện" nên khai báo <code>spring-boot-starter-web</code> trực tiếp vào thẻ <code><dependencies></code> của Root Parent POM.
- **Hậu quả thảm khốc**: Toàn bộ các Submodule con (kể cả <code>core-domain</code> chỉ chứa vài Class POJO đơn giản) đều bị ép buộc tải về Spring MVC, Embedded Tomcat, Jackson. Kích thước file JAR của domain phình từ 50KB lên 40MB!
- **Giải pháp**:
  - Root Parent POM **CHỈ ĐƯỢC CHỨA** <code><dependencyManagement></code>.
  - Submodule nào thực sự cần dùng thư viện gì thì tự khai báo thư viện đó trong <code><dependencies></code> của riêng nó.

### 4.2. Sự cố 2: Phụ Thuộc Vòng (Cyclic Dependency) Giữa Các Submodules

- **Bối cảnh**: Module <code>order-service</code> gọi class trong <code>payment-service</code>. Sau đó, dev bên <code>payment-service</code> lại import class của <code>order-service</code>.
- **Hậu quả**: Khi chạy <code>mvn compile</code>, Maven lập tức dừng lại và báo lỗi:
  <code>[ERROR] The projects in the reactor contain a cyclic reference: The following loop exists: payment-service -> order-service -> payment-service</code>.
- **Giải pháp**:
  Tách các model hoặc interface dùng chung ra một module thứ 3 độc lập ở tầng dưới (ví dụ: <code>common-contracts</code> hoặc <code>shared-kernel</code>). Luồng phụ thuộc bắt buộc phải là **Đồ thị có hướng không chu trình (Directed Acyclic Graph - DAG)**.

---

## 5. Hands-on Enterprise Challenge & Reference Solution

### Đề bài: Xây Dựng Cấu Hình Maven Enforcer Cấm Thư Viện SNAPSHOT Khi Release

Khi dự án chuẩn bị đóng gói phát hành (Release Build), việc còn tồn tại các thư viện mang đuôi <code>-SNAPSHOT</code> trong <code>pom.xml</code> là một lỗ hổng vận hành nghiêm trọng (vì code SNAPSHOT có thể bị ghi đè bất kỳ lúc nào trên Artifactory, khiến build không thể tái lập).
Hãy viết cấu hình Maven Profile mang tên <code>production-release</code>:
1. Kích hoạt khi chạy lệnh <code>mvn clean verify -Pproduction-release</code>.
2. Sử dụng <code>maven-enforcer-plugin</code> với luật <code>requireReleaseDeps</code>:
   - Cấm 100% mọi dependencies (kể cả transitive dependencies) mang phiên bản <code>SNAPSHOT</code>.
   - Cho phép loại trừ các submodule nội bộ của chính dự án (<code>com.enterprise.fintech:*</code>).

### Lời giải hoàn chỉnh (Reference Solution)

Cấu hình trong file <code>fintech-platform/pom.xml</code>:

~~~xml
<profiles>
    <profile>
        <id>production-release</id>
        <build>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-enforcer-plugin</artifactId>
                    <executions>
                        <execution>
                            <id>enforce-no-snapshots</id>
                            <goals>
                                <goal>enforce</goal>
                            </goals>
                            <configuration>
                                <rules>
                                    <!-- CẤM TUYỆT ĐỐI MỌI THƯ VIỆN SNAPSHOT TRONG BẢN RELEASE -->
                                    <requireReleaseDeps>
                                        <message>CRITICAL: Production releases must NOT depend on any SNAPSHOT dependencies!</message>
                                        <searchTransitive>true</searchTransitive>
                                        <onlyWhenRelease>false</onlyWhenRelease>
                                        <!-- Cho phép submodule nội bộ cùng phiên bản -->
                                        <excludes>
                                            <exclude>com.enterprise.fintech:*</exclude>
                                        </excludes>
                                    </requireReleaseDeps>
                                </rules>
                                <fail>true</fail>
                            </configuration>
                        </execution>
                    </executions>
                </plugin>
            </plugins>
        </build>
    </profile>
</profiles>
~~~

Kiểm tra bằng lệnh:
~~~bash
mvn clean verify -Pproduction-release
~~~
Nếu có bất kỳ thư viện bên ngoài nào chưa release chính thức (ví dụ: <code>some-lib:1.2.0-SNAPSHOT</code>), bản build sẽ bị chặn đứng ngay lập tức!
`
    },
    {
    "id": "0-quiz",
    "type": "quiz",
    "title": "Quiz Module 0 — Nền tảng",
    "minutes": 10,
    "questions": [
        {
            "level": "easy",
            "scenario": "Team bạn bắt đầu dự án mới trên máy company vừa cài lại. Tech lead yêu cầu dùng Spring Boot 3.4.x. Bạn mở start.spring.io và thấy option Java 8/11/17/21/23.",
            "q": "Chọn Java version nào cho project mới và vì sao?",
            "options": [
                "Java 8 — vì codebase legacy LAAS cũ vẫn chạy Java 8, đồng bộ cho dễ chuyển người",
                "Java 11 — LTS, ổn định, được Spring Boot 3 hỗ trợ đầy đủ",
                "Java 17 — vừa đủ baseline tối thiểu của Spring Boot 3, không cần hơn",
                "Java 21 — LTS mới nhất, có virtual threads, Spring Boot 3.2+ hỗ trợ đầy đủ"
            ],
            "answer": 3,
            "explain": "Java 21 là LTS (support đến 2031), có virtual threads miễn phí cấu hình cho I/O-heavy service. Spring Boot 3.4 + Java 21 là combo chuẩn production 2025.",
            "why": [
                "Sai — Spring Boot 3.x KHÔNG chạy được trên Java 8 (baseline 17). Codebase cũ thì ở lại Spring Boot 2.7, dự án mới thì không lý do gì xuống mức này.",
                "Sai — Java 11 cũng dưới baseline 17 của Spring Boot 3. Đây là bẫy 'LTS nào cũng được' — phải đọc yêu cầu version của framework.",
                "Sai về chiến lược — đúng là 17 chạy được, nhưng chọn 'vừa đủ tối thiểu' nghĩa là bỏ lỡ virtual threads (21) và phải upgrade giữa dự án sau này — tốn kém hơn nhiều.",
                "✓ Đúng — LTS mới nhất, virtual threads bật bằng 1 dòng config, mọi tính năng Spring Boot 3.4 chạy trọn vẹn. Đó là lý do các service LAAS mới đều target 21."
            ]
        },
        {
            "level": "easy",
            "scenario": "Bạn review code của bạn mới vào team, thấy anh ấy loop qua danh sách task rồi check null thủ công từng field.",
            "q": "Đoạn code sau in ra gì?",
            "code": "var list = List.of(1, 2, 3, 4, 5);\nvar result = list.stream()\n    .filter(n -> n % 2 == 0)\n    .map(n -> n * 10)\n    .toList();\nSystem.out.println(result);",
            "options": [
                "[10, 20, 30, 40, 50]",
                "[2, 4]",
                "[20, 40]",
                "Compile error — không chain được map sau filter"
            ],
            "answer": 2,
            "explain": "filter giữ số chẵn (2, 4) → map nhân 10 → [20, 40]. Pipeline lazy nhưng toList() là terminal nên toàn bộ chạy.",
            "why": [
                "Sai — đây là lỗi đọc thiếu filter. Nếu chỉ map thì mới ra [10,20,...,50]. Phải đọc pipeline theo thứ tự: filter TRƯỚC, map SAU.",
                "Sai — quên mất map đã nhân 10. Kết quả middle-step là [2,4] nhưng map biến đổi giá trị trước khi collect.",
                "✓ Đúng — filter(2,4) → map(n*10) → [20, 40]. Đây là pattern chuẩn khi transform data trước khi trả về DTO.",
                "Sai — Stream cho phép chain bao nhiêu intermediate operation tùy ý. Đây chính là sức mạnh declarative của nó."
            ]
        },
        {
            "level": "medium",
            "scenario": "Production LAAS 2 giờ sáng: 500 lỗi NoSuchElementException dồn về Sentry từ method getUserName(Long id). Log cho thấy user bị xóa mềm (soft-delete) nhưng record vẫn null khi query.",
            "q": "Nguyên nhân gốc và cách sửa ĐÚNG nhất?",
            "code": "// Code hiện tại đang gây sự cố\npublic String getUserName(Long id) {\n    return userRepository.findById(id).get().getFullName();\n}",
            "options": [
                "Gốc rễ: DB mất kết nối → thêm retry + circuit breaker quanh findById",
                "Gốc rễ: .get() trên Optional rỗng ném NoSuchElementException → dùng orElseThrow với exception nghiệp vụ",
                "Gốc rễ: soft-delete filter chưa bật → thêm @Where(clause = \"deleted = false\")",
                "Gốc rễ: thiếu cache → user bị xóa vẫn nằm trong Redis, dùng @Cacheable"
            ],
            "answer": 1,
            "explain": "findById trả Optional rỗng khi không tìm thấy (kể cả soft-deleted nếu query không lọc) → .get() trần ném NoSuchElementException — crash 500 thay vì 404 sạch sẽ.",
            "why": [
                "Không phải gốc rễ — nếu mất kết nối DB thì exception là DataAccessResourceFailureException, và lỗi sẽ không lặp đúng 1 chỗ thế này. Đây là cách đoán theo symptom.",
                "✓ Đúng — thay .get() bằng orElseThrow(() -> new UserNotFoundException(id)) để framework map sang 404 có thông điệp rõ ràng. Optional.get() trần là code smell cấp production.",
                "Có thể là tình huống thật nhưng không phải cái app crash — nếu filter soft-delete sai thì user vẫn được trả về (dữ liệu ảo), chứ không phải Optional rỗng.",
                "Sai hướng hoàn toàn — cache không liên quan việc Optional rỗng; ngược lại @Cacheable còn khiến dữ liệu xóa mềm cũ sống lâu hơn nữa."
            ]
        },
        {
            "level": "medium",
            "scenario": "Tech lead duyệt PR của bạn và hỏi: 'Em định dùng record cho class này — hợp không?'",
            "q": "Trường hợp nào dùng record là ĐÚNG trong Spring Boot 3?",
            "options": [
                "Làm @Entity JPA — vì record tự sinh equals/hashCode tiện so sánh",
                "Làm DTO request/response cho REST API (@RequestBody / @ResponseBody)",
                "Làm @Service business logic — code gọn hơn class thường",
                "Làm @ConfigurationProperties binding file yml"
            ],
            "answer": 1,
            "explain": "record immutable + tự sinh boilerplate → lý tưởng cho DTO. REST payload là dữ liệu một chiều, không cần thay đổi sau khi tạo.",
            "why": [
                "Sai nghiêm trọng — JPA cần no-arg constructor + setter (hoặc field access) để proxy và dirty-checking. Record không có → Hibernate throw exception hoặc hành vi lạ. Entity PHẢI là class thường.",
                "✓ Đúng — Jackson 2.15+ và Spring Boot 3 bind record làm @RequestBody hoàn hảo, kể cả kèm Bean Validation (@NotBlank, @Past...). Codebase LAAS mới đã dùng record DTO chuẩn.",
                "Sai — @Service là component có hành vi + dependency injection; record là pure data. Compiler không cấm nhưng đánh mất toàn bộ mục đích thiết kế.",
                "Bẫy tinh vi — @ConfigurationProperties DÙNG được record (constructor binding từ Boot 2.6+) nhưng đây là Use case thứ yếu. Đáp án tốt nhất cho câu 'chuẩn nhất' vẫn là DTO."
            ]
        },
        {
            "level": "hard",
            "scenario": "Sáng thứ 2, service LAAS fail khởi động với: java.lang.NoSuchMethodError: com.fasterxml.jackson.databind.ObjectMapper.readerFor(Ljava/lang/Class;). Bạn vừa thêm dependency Kafka client mới.",
            "q": "Chẩn đoán và xử lý theo đúng trình tự?",
            "options": [
                "Restart Jenkins clean workspace rồi build lại — cache Jenkins bị bẩn",
                "Chạy ./mvnw dependency:tree -Dincludes=com.fasterxml.jackson.core:jackson-databind → xác định 2 version → pin version bằng <dependencyManagement>",
                "Xóa ~/.m2/repository toàn bộ rồi re-download",
                "Downgrade Kafka client về bản cũ hơn cho khớp Jackson"
            ],
            "answer": 1,
            "explain": "NoSuchMethodError = classpath có 2 version cùng artifact, runtime nạp bản cũ thiếu method. dependency:tree chỉ ra xung đột → dependencyManagement ép một version duy nhất cho toàn cây.",
            "why": [
                "Không giải quyết gì — cache build sạch hay bẩn, cây dependency vẫn xung đột như cũ khi compile xong. Lỗi sẽ quay lại ở build sau.",
                "✓ Đúng quy trình chuẩn: (1) dependency:tree lọc đúng artifact nghi ngờ, (2) nhìn version nào thắng theo quy tắc nearest-wins, (3) dependencyManagement pin version tương thích mà Spring Boot BOM khuyên dùng.",
                "Quá mức — xóa cả local repo tải lại cả GB, và kết quả vẫn y hệt vì cây dependency logic không đổi. Chỉ là cách 'đập nhà làm lại' thay vì đọc bản đồ.",
                "Giải pháp ngược đời — downgrade thư viện mới để né xung đột nghĩa là đánh mất tính năng/cảnh báo security của bản mới. Nguyên tắc: pin version MỚI tương thích, không hạ cấp."
            ]
        },
        {
            "level": "medium",
            "scenario": "Đêm release LAAS, bạn deploy notification-service. Jenkins build thành công nhưng container exit ngay lập tức với log: 'Cannot find JAVA_HOME'. Máy local vẫn chạy OK.",
            "q": "Root cause và fix bền vững nhất?",
            "options": [
                "Thêm export JAVA_HOME=/usr/lib/jvm/... vào Dockerfile trước lệnh CMD",
                "Dùng base image chính thức có sẵn JDK: FROM eclipse-temurin:21-jre-alpine",
                "Mount biến môi trường từ host vào container qua -e JAVA_HOME",
                "Cài JDK thủ công bằng RUN apt-get install trong Dockerfile"
            ],
            "answer": 1,
            "explain": "Container không kế thừa môi trường host — image base phải tự chứa JRE. eclipse-temurin:21-jre là chuẩn công nghiệp: có sẵn JDK, slim, bảo mật update đều.",
            "why": [
                "Hack cứng đường dẫn — chết khi đổi base image hoặc architecture (ARM vs x86). Fix kiểu 'dán băng keo' sẽ nổ vào lần refactor sau.",
                "✓ Đúng chuẩn production — base image chính thức đã set JAVA_HOME đúng, tối ưu size (jre thay vì jdk đầy đủ), và được bảo trì security patch bởi Adoptium.",
                "Sai kiến trúc cơ bản — container KHÔNG thấy được env host trừ khi pass -e, và -e lại phụ thuộc người chạy lệnh. Image phải self-contained để chạy được ở mọi orchestrator.",
                "Chạy được nhưng tệ — apt-get cài OpenJDK phình to image (~300MB thêm), không control được minor version, và các layer update phải rebuild thủ công."
            ]
        },
        {
            "level": "medium",
            "scenario": "Code review, mentor chỉ vào interface PaymentResult với 3 implementation (Success/Pending/Failed) và hỏi: 'Nếu thêm trạng thái Chargeback mà quên update switch, em muốn compiler bắt hay runtime bắt?'",
            "q": "Cấu trúc nào cho compiler tự phát hiện thiếu case?",
            "code": "// Cấu trúc đang xét\n??? interface PaymentResult\n    permits Success, Pending, Failed {}\n\nString classify(PaymentResult r) {\n    return switch (r) {\n        case Success s -> \"OK\";\n        case Pending p -> \"WAIT\";\n        case Failed f -> \"FAIL\";\n    }; // có cần default không?\n}",
            "options": [
                "interface thường — rồi thêm default throw mới chắc chắn",
                "sealed interface — switch pattern matching không cần default, thiếu case là compile error",
                "abstract class + visitor pattern — visitor ép implement mỗi khi thêm subclass",
                "enum PaymentStatus — vì enum tự exhaustiveness trong switch"
            ],
            "answer": 1,
            "explain": "sealed + permits khóa tập implementation → compiler biết tập đóng → kiểm tra exhaustiveness. Thêm Chargeback mà không thêm case = lỗi build ngay tại CI, không chờ đến runtime.",
            "why": [
                "Đi ngược tiến hóa — default throw đúng là cách runtime bắt lỗi nhưng chính là cái ta đang tránh. Người ta thêm default để 'im compiler' rồi quên update.",
                "✓ Đúng — sealed interface (Java 17) + switch pattern (Java 21) là cặp đôi hoàn hảo cho domain model đóng. LAAS có loại use case này ở payment/loyalty state machine.",
                "Hợp lý về lý thuyết nhưng nặng đô — visitor đòi ~4 interface + factory cho mỗi trạng thái. sealed đạt cùng guarantee bằng 2 từ khóa.",
                "Sai hướng — enum không chứa được data per-case (Success có txnId, Pending có checkAt...). Enum chỉ phù hợp khi mỗi case là hằng số thuần."
            ]
        },
        {
            "level": "easy",
            "scenario": "Bạn viết pom.xml lần đầu cho module mới, thắc mắc sao các dependency Spring đều không có tag <version>.",
            "q": "Vì sao starter Spring Boot không cần khai báo version?",
            "options": [
                "Maven tự download version mới nhất từ Maven Central",
                "spring-boot-starter-parent chứa dependencyManagement quản lý version ~300 thư viện tương thích đã test",
                "IDE tự động điền version khi save file",
                "Các thư viện Spring đặc biệt được Maven đối xử riêng"
            ],
            "answer": 1,
            "explain": "Parent POM của Spring Boot là 'bảng chỉ đạo version' — dependencyManagement khai báo version đã được test tương thích cho cả hệ sinh thái (Jackson, Hibernate, Logback...).",
            "why": [
                "Nguy hiểm nếu đúng — version mới nhất có thể vỡ tương thích. Chính triết lý Spring Boot là NGĂN hành vi này: version phải deterministic.",
                "✓ Đúng — cứ nhìn pom của spring-boot-starter-parent: có <dependencyManagement> khổng lồ. Bạn ghi artifact không version → Maven tra bảng này. Muốn override thì tự khai ở dependencyManagement của mình.",
                "Hoàn toàn sai — Maven không quan tâm IDE. Build trên server Jenkins không có IDE vẫn chạy đúng.",
                "Không có cơ chế 'đối xử riêng' — mọi artifact Maven đều cùng luật. Khác biệt nằm ở POM kế thừa, không phải magic."
            ]
        },
        {
            "level": "medium",
            "scenario": "Audit bảo mật nội bộ yêu cầu giảm attack surface: image production không được chứa JDK đầy đủ (javac, tooling), chỉ cần chạy bytecode.",
            "q": "Dependency scope + base image nào thỏa yêu cầu?",
            "options": [
                "scope compile + image eclipse-temurin:21-jdk",
                "scope provided cho postgresql + image jdk",
                "postgresql scope runtime + base image eclipse-temurin:21-jre",
                "scope test cho postgresql + image jre"
            ],
            "answer": 2,
            "explain": "runtime scope: driver JDBC không cần lúc compile (code chỉ đụng JPA interface) nhưng phải có lúc chạy. JRE image: chỉ đủ chạy bytecode, không có compiler → nhẹ hơn ~40% và ít CVE hơn.",
            "why": [
                "Đủ chạy nhưng phí — JDK đầy đủ trong production chứa tooling không bao giờ dùng: javac, jdb, jstack dev-only. Image phình + attack surface rộng vô ích.",
                "provided nghĩa là 'container lo' — hợp cho WAR deploy vào Tomcat ngoài, nhưng với Spring Boot fat-jar tự chạy thì driver sẽ BIẾN MẤT khỏi classpath khi start → NoClassDefFoundError.",
                "✓ Đúng cả hai đầu — scope runtime cho JDBC driver (chuẩn Spring Initializr tự generate) và jre-alpine/jre cho image tối giản production.",
                "test scope loại driver khỏi production runtime — service sẽ không kết nối được DB khi deploy. Chỉ dùng nếu thay bằng H2 in-memory cho test."
            ]
        },
        {
            "level": "hard",
            "scenario": "LAAS đang gánh 200 concurrent requests/insert order mỗi giây trên platform-service (Java 17, platform threads). CPU chỉ 30% nhưng latency P99 chạm 2s vì thread pool 200 đầy, request xếp hàng chờ.",
            "q": "Giải pháp nào đúng bản chất vấn đề?",
            "options": [
                "Tăng server.tomcat.threads.max lên 1000 — càng nhiều thread càng tốt",
                "Scale ngang thêm 2 pod — chia tải 3 phần",
                "Bật spring.threads.virtual.enabled=true (nâng Java 21) — virtual thread không block platform thread khi chờ I/O",
                "Thêm Redis cache toàn bộ order path — giảm DB hit"
            ],
            "answer": 2,
            "explain": "CPU rảnh + thread đầy = I/O-bound. Platform thread chờ DB/network thì cũng nằm chiếm chỗ. Virtual thread: khi chờ I/O nó 'trả' carrier thread về pool → 1 máy chạy hàng chục nghìn concurrent I/O operations.",
            "why": [
                "Chữa đúng symptom sai bệnh — 1000 platform thread = 1GB stack mặc định, context-switch mở rộng, và nếu query DB chờ 2s thì 1000 thread cũng đầy như thường. Đáy bể chỉ dịch chứ không biến mất.",
                "Giảm tải thật nhưng không sửa thiết kế — mỗi pod vẫn dính ceiling 200. Tốn tiền infra cho vấn đề giải được bằng 1 dòng config.",
                "✓ Đúng căn nguyên — đây chính là use case lý tưởng của virtual threads (JDK 21): workload I/O-heavy, CPU idle. Loom project sinh ra cho kịch bản LAAS này.",
                "Cache không giúp insert path (write-heavy). Có thể giảm vài read phụ, nhưng bottleneck chính là thread chờ I/O vẫn nguyên vẹn."
            ]
        },
        {
            "level": "hard",
            "scenario": "Ứng dụng Spring Boot của bạn phụ thuộc vào Thư viện A (yêu cầu Jackson 2.15 ở độ sâu 2) và Thư viện B (yêu cầu Sub-lib C, Sub-lib C lại yêu cầu Jackson 2.12 ở độ sâu 3).",
            "q": "Theo giải thuật Dependency Mediation của Maven, phiên bản Jackson nào sẽ được đóng gói vào ứng dụng và giải thuật nào chi phối?",
            "options": [
                "Jackson 2.15 sẽ được chọn theo quy tắc 'Nearest-Wins' (Gần nhất thắng) vì nó nằm ở độ sâu 2, gần gốc project hơn độ sâu 3",
                "Jackson 2.12 sẽ được chọn vì nó có số phiên bản nhỏ hơn để đảm bảo tính tương thích ngược",
                "Maven sẽ báo lỗi gãy build ngay lập tức và bắt buộc người dùng chọn thủ công",
                "Cả 2 phiên bản Jackson 2.15 và 2.12 sẽ cùng được đóng gói song song vào file JAR"
            ],
            "answer": 0,
            "explain": "Giải thuật phân giải xung đột của Maven tuân theo 2 quy tắc bất biến: (1) Nearest-Wins (Độ sâu gần nhất trong cây dependency tree sẽ thắng, bất kể version cao hay thấp); (2) First-Declared (Nếu cùng độ sâu thì thư viện nào khai báo trước trong pom.xml sẽ thắng). Ở đây độ sâu 2 thắng độ sâu 3, do đó Jackson 2.15 được chọn.",
            "why": [
                "✓ Đúng — 'Nearest-Wins' là giải thuật cốt lõi của Apache Maven. Nếu cần cưỡng chế phiên bản, phải khai báo trong <dependencyManagement>.",
                "Maven không so sánh ngữ nghĩa phiên bản (semver) để tự động hạ cấp phiên bản.",
                "Maven không dừng build mà tự động hòa giải theo luật Nearest-Wins, chính điều này đôi khi gây ra lỗi NoSuchMethodError âm thầm.",
                "Java Classpath chuẩn không hỗ trợ nạp 2 phiên bản của cùng một class cùng lúc trong 1 ClassLoader."
            ]
        },
        {
            "level": "hard",
            "scenario": "Một lập trình viên tạo Record: public record UserProfile(String id, List<String> roles) {}. Sau đó, một service bên ngoài gọi userProfile.roles().add(\"SUPER_ADMIN\") và thành công gán quyền trái phép.",
            "q": "Tại sao Record không ngăn chặn được hành vi này và giải pháp chuẩn là gì?",
            "options": [
                "Record chỉ có tính 'bất biến nông' (Shallow Immutability) - biến tham chiếu roles là final nhưng nội dung ArrayList bên trong vẫn có thể bị sửa đổi. Khắc phục: Dùng Compact Constructor và bọc List.copyOf(roles)",
                "Do Spring Security can thiệp vào cấu trúc bytecode của Record",
                "Do Record không hỗ trợ kiểu dữ liệu List, phải đổi sang Set",
                "Do Record bị lỗi trong Java 21, cần chuyển về dùng Class thông thường"
            ],
            "answer": 0,
            "explain": "Record đảm bảo tính bất biến nông (các component là final, không có setter). Tuy nhiên, nếu một component trỏ tới một mutable object (như java.util.ArrayList), người gọi vẫn có thể thay đổi dữ liệu bên trong object đó. Để đạt được tính bất biến sâu (Deep Immutability), bắt buộc phải thực hiện Defensive Copying trong Compact Constructor bằng List.copyOf().",
            "why": [
                "✓ Đúng — Bất biến nông vs Bất biến sâu là khái niệm nền tảng trong thiết kế phần mềm với Java Record.",
                "Spring Security hoàn toàn không can thiệp vào tính bất biến của POJO/Record.",
                "Set hay Collection nào nếu là mutable implementation (như HashSet) đều gặp vấn đề y hệt.",
                "Đây là đặc tính thiết kế chuẩn của ngôn ngữ Java theo đặc tả JEP 395, không phải lỗi."
            ]
        }
    ]
}
  ]
});
