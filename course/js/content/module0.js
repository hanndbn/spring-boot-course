/* MODULE 0 — Nền tảng Java & Công cụ */
window.COURSE_MODULES = window.COURSE_MODULES || [];
window.COURSE_MODULES.push({
  id: 0,
  title: "Nền tảng Java & Công cụ",
  subtitle: "Java hiện đại + Maven + môi trường",
  icon: "☕",
  desc: "Làm chủ Java 8→21 và Maven — nền móng vững trước khi chạm vào Spring.",
  lessons: [
    {
      id: "0-1",
      type: "lesson",
      title: "Giới thiệu khóa học & Setup môi trường",
      minutes: 45,
      content: `
## Chào mừng đến với Spring Boot Mastery! 🎉

Trong khóa này, bạn sẽ đi từ **người biết Java cơ bản** đến **dev Spring Boot tự tin làm việc ở môi trường production**. Mỗi bài học đều gắn với tình huống thực tế mà bạn sẽ gặp trong các hệ thống như LAAS/OLS: multi-tenant, Keycloak, Kafka, Jenkins, AWS.

### Bạn cần chuẩn bị gì?

- Một chiếc máy tính ~8GB RAM (16GB lý tưởng)
- Kiến thức Java OOP cơ bản (class, interface, inheritance)
- ~8-10 giờ/tuần trong 6 tháng — hoặc nhanh hơn nếu bạn đã đi làm với Java

---

## 1. Cài đặt JDK 21

Spring Boot 3.x yêu cầu **tối thiểu Java 17**. Ta dùng JDK 21 (LTS) để có đủ tính năng hiện đại.

Tải **Eclipse Temurin 21** (bản open-source, miễn phí, được dùng rộng rãi production):

- Windows: <https://adoptium.net/temurin/releases/?version=21>
- Cài xong, kiểm tra terminal:

~~~bash
java -version
# openjdk version "21.0.x" ...

javac -version
# javac 21.0.x
~~~

:::warn QUAN TRỌNG — JAVA_HOME
Hãy set biến môi trường <code>JAVA_HOME</code> trỏ tới thư mục JDK (ví dụ <code>C:\\Program Files\\Eclipse Adoptium\\jdk-21</code>). Maven và IDE đều cần nó.
:::

## 2. Cài IntelliJ IDEA

- Tải **IntelliJ IDEA Community Edition** (miễn phí): <https://www.jetbrains.com/idea/download>
- Khi mở project lần đầu, IntelliJ sẽ tự download dependencies — chờ nó chạy xong ở thanh progress dưới góc phải.
- Plugin nên bật: **Lombok** (cài sẵn), **Maven Helper**, **EnvFile** (đọc .env).

## 3. Tạo project đầu tiên

Vào <https://start.spring.io> và cấu hình:

| Mục | Giá trị |
|---|---|
| Project | **Maven** |
| Language | **Java** |
| Spring Boot | **3.4.x** (bản stable mới nhất) |
| Group | <code>vn.mastery</code> |
| Artifact | <code>taskmanager</code> |
| Packaging | **Jar** |
| Java | **21** |
| Dependencies | Spring Web, Spring Boot DevTools, Spring Boot Actuator |

Bấm **Generate** → giải nén → mở bằng IntelliJ.

### Cấu trúc project chuẩn

~~~text
taskmanager/
├── src/
│   ├── main/
│   │   ├── java/vn/mastery/taskmanager/
│   │   │   └── TaskmanagerApplication.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── static/
│   │       └── templates/
│   └── test/java/vn/mastery/taskmanager/
├── mvnw, mvnw.cmd          ← Maven wrapper (không cần cài Maven!)
└── pom.xml                 ← "trái tim" của project
~~~

## 4. Viết API đầu tiên

~~~java
package vn.mastery.taskmanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class TaskmanagerApplication {

    public static void main(String[] args) {
        SpringApplication.run(TaskmanagerApplication.class, args);
    }
}

@RestController
class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "Xin chào Spring Boot!";
    }
}
~~~

Chạy bằng nút ▶ cạnh <code>main()</code> hoặc lệnh:

~~~bash
./mvnw spring-boot:run
~~~

Mở trình duyệt tại <code>http://localhost:8080/hello</code> — bạn vừa chạy web service Java đầu tiên! 🎊

## 5. Đổi properties → YAML

YAML gọn hơn và dễ phân tầng môi trường. Đổi tên <code>application.properties</code> thành <code>application.yml</code>:

~~~yaml
spring:
  application:
    name: taskmanager

server:
  port: 8080

management:
  endpoints:
    web:
      exposure:
        include: health,info,beans,env
~~~

Truy cập <code>http://localhost:8080/actuator/health</code> → <code>{"status":"UP"}</code>.

:::laas ĐỐI CHIẾU LAAS
Khi bạn debug dịch vụ platform-service không start được trên AWS, **Actuator /actuator/health** chính là endpoint đầu tiên để kiểm tra "service sống chưa". Các hệ thống production luôn expose ít nhất health + info.
:::

:::takeaways
- JDK 21 (Temurin) + IntelliJ CE là bộ đôi miễn phí đủ dùng đến production
- Maven wrapper <code>mvnw</code> giúp mọi người chạy build mà không cần cài Maven thủ công
- <code>@SpringBootApplication</code> = auto-configuration + component scan + cấu hình
- Actuator cho health-check — công cụ sống còn khi vận hành
:::
`
    },
    {
      id: "0-2",
      type: "lesson",
      title: "Java hiện đại: Lambda, Stream, Optional",
      minutes: 40,
      content: `
## Vì sao phải thành thạo Java 8+?

Code Spring hiện đại **ngập tràn** lambda và stream: từ định nghĩa route trong Security, đến converter trong JPA, đến filter collection trong service. Nếu không nhuần nhuyễn, bạn sẽ đọc code Spring như "chữ tượng hình".

---

## 1. Lambda & Functional Interface

Functional interface = interface có **đúng 1 abstract method**. Lambda là cú pháp viết nhanh implementation của nó.

~~~java
// Cách truyền thống — anonymous class
Runnable r1 = new Runnable() {
    @Override
    public void run() {
        System.out.println("Chạy!");
    }
};

// Lambda — ngắn gọn hơn 5 lần
Runnable r2 = () -> System.out.println("Chạy!");

// Function<T, R>: nhận T, trả R
Function<String, Integer> length = s -> s.length();

// Predicate<T>: trả boolean
Predicate<Integer> isEven = n -> n % 2 == 0;

// Consumer<T>: nhận T, không trả gì
Consumer<String> printer = s -> System.out.println(s);

// Supplier<T>: không nhận, trả T
Supplier<List<String>> listFactory = () -> new ArrayList<>();
~~~

### 4 functional interface phải thuộc lòng

| Interface | Chữ ký | Dùng khi |
|---|---|---|
| <code>Function<T,R></code> | <code>T → R</code> | Biến đổi dữ liệu |
| <code>Predicate<T></code> | <code>T → boolean</code> | Lọc / điều kiện |
| <code>Consumer<T></code> | <code>T → void</code> | Thực thi tác dụng phụ |
| <code>Supplier<T></code> | <code>() → T</code> | Tạo / lazy-init object |

**Method reference** — lambda gọn hơn nữa:

~~~java
Consumer<String> p1 = s -> System.out.println(s);
Consumer<String> p2 = System.out::println;   // method reference

Function<Task, String> t1 = task -> task.getTitle();
Function<Task, String> t2 = Task::getTitle;  // tham chiếu method của instance
~~~

## 2. Stream API — xử lý collection declarative

~~~java
record Task(String title, String assignee, int priority, boolean done) {}

List<Task> tasks = List.of(
    new Task("Viết API", "An", 2, true),
    new Task("Fix bug", "Bình", 1, false),
    new Task("Deploy", "An", 3, false),
    new Task("Review", "Cường", 2, true)
);

// Lấy tên các task CHƯA xong của "An", sắp theo ưu tiên
List<String> result = tasks.stream()
    .filter(t -> !t.done() && t.assignee().equals("An"))
    .sorted(Comparator.comparingInt(Task::priority).reversed())
    .map(Task::title)
    .toList();

// ["Deploy"]
~~~

### Các operation hay gặp nhất

| Operation | Loại | Ví dụ |
|---|---|---|
| <code>filter</code> | Intermediate | <code>.filter(t -> t.priority() > 1)</code> |
| <code>map</code> | Intermediate | <code>.map(Task::title)</code> |
| <code>flatMap</code> | Intermediate | Gộp nhiều stream con thành 1 |
| <code>sorted</code> | Intermediate | <code>.sorted(comparator)</code> |
| <code>distinct</code> | Intermediate | Bỏ phần tử trùng |
| <code>limit / skip</code> | Intermediate | Phân trang thủ công |
| <code>collect</code> | Terminal | <code>.collect(Collectors.toMap(...))</code> |
| <code>forEach</code> | Terminal | Duyệt side-effect |
| <code>reduce</code> | Terminal | Gộp về 1 giá trị (sum, concat...) |
| <code>anyMatch / allMatch</code> | Terminal | Kiểm tra điều kiện |
| <code>findFirst</code> | Terminal | Lấy phần tử đầu (thường sau filter) |

:::tip GHI NHỚ
Stream là **lazy**: intermediate operation không chạy gì cho tới khi gặp terminal operation. Đây là lý do stream có thể tối ưu (ví dụ <code>findFirst</code> dừng sớm).
:::

### Collector thông dụng

~~~java
// Nhóm task theo assignee
Map<String, List<Task>> byAssignee = tasks.stream()
    .collect(Collectors.groupingBy(Task::assignee));

// Đếm theo nhóm
Map<String, Long> countBy = tasks.stream()
    .collect(Collectors.groupingBy(Task::assignee, Collectors.counting()));

// Join chuỗi
String titles = tasks.stream().map(Task::title)
    .collect(Collectors.joining(", "));
~~~

## 3. Optional — diệt NPE có kỷ luật

~~~java
Optional<Task> found = tasks.stream()
    .filter(t -> t.title().equals("Deploy"))
    .findFirst();

// ❌ Đừng bao giờ: found.get() — ném NoSuchElementException nếu rỗng

// ✅ Kiểu 1: orElse
Task t = found.orElse(new Task("Mặc định", "-", 0, false));

// ✅ Kiểu 2: ném exception có ý nghĩa
Task t2 = found.orElseThrow(
    () -> new TaskNotFoundException("Không tìm thấy task Deploy"));

// ✅ Kiểu 3: chỉ làm gì đó khi có giá trị
found.ifPresent(task -> notify(task.assignee()));

// ✅ Kiểu 4: chain biến đổi
String title = found.map(Task::title)
    .filter(s -> s.length() > 3)
    .orElse("N/A");
~~~

:::danger TỎI KIẾN
Đừng dùng Optional cho **field của class** hay **tham số method** — nó chỉ designed cho **kiểu trả về**. Đừng gọi <code>.get()</code> trần — luôn kèm orElse/orElseThrow/isPresent.
:::

## 4. CompletableFuture — bất đồng bộ

~~~java
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> callExternalApi())           // chạy trên thread pool
    .thenApply(resp -> resp.toUpperCase())          // biến đổi
    .exceptionally(ex -> "FALLBACK");               // xử lý lỗi

// Kết hợp 2 call song song
CompletableFuture<User> userF = CompletableFuture.supplyAsync(() -> getUser(1));
CompletableFuture<Orders> ordersF = CompletableFuture.supplyAsync(() -> getOrders(1));

userF.thenCombine(ordersF, (user, orders) ->
    new UserDto(user, orders)).join();
~~~

Trong Spring, ta sẽ dùng <code>@Async</code> (Module 6) để Spring quản lý thread pool giúp — nhưng bên dưới vẫn là những concept này.

:::takeaways
- 4 functional interface: Function, Predicate, Consumer, Supplier — nền của mọi API hiện đại
- Stream = pipeline lazy: intermediate (filter/map) + terminal (collect/forEach)
- Optional chỉ cho return type; luôn orElse/orElseThrow
- CompletableFuture cho song song hóa I/O call
:::
`
    },
    {
      id: "0-3",
      type: "lesson",
      title: "Java 17/21: record, sealed, pattern matching",
      minutes: 35,
      content: `
## Java hiện đại = code ngắn hơn, an toàn hơn

Kể từ Spring Boot 3, tối thiểu đã là Java 17 — và các codebase mới (như LAAS) tận dụng mạnh các tính năng dưới đây. Đây là "ngôn ngữ mới" bạn cần nói thành thạo.

---

## 1. record — immutable data class trong 1 dòng

~~~java
// Trước: 40 dòng (fields, constructor, getter, equals, hashCode, toString)
public class Point {
    private final int x;
    private final int y;
    // constructor, getters, equals, hashCode, toString...
}

// Sau: 1 dòng
public record Point(int x, int y) {}

// Dùng
var p = new Point(3, 4);
p.x();          // accessor (không phải getX())
p.equals(new Point(3, 4));  // true — tự sinh
~~~

record tự động có: **constructor chuẩn tắc**, **accessor**, **equals/hashCode/toString**. Và là **immutable** — không thể set lại giá trị.

### Record trong Spring — cực kỳ phổ biến

~~~java
// DTO cho REST API (Spring Boot 3 hỗ trợ record làm @RequestBody)
public record CreateTaskRequest(
    @NotBlank String title,
    @Future LocalDate dueDate,
    @Min(1) @Max(5) int priority
) {}

// Config binding
public record AppProperties(
    String apiUrl,
    int maxRetries
) {}

// Compact constructor — validate ngay khi tạo
public record Money(BigDecimal amount, String currency) {
    public Money {
        if (amount.signum() < 0)
            throw new IllegalArgumentException("amount >= 0");
        if (currency == null || currency.isBlank())
            throw new IllegalArgumentException("currency bắt buộc");
    }
}
~~~

## 2. sealed — kiểm soát ai được kế thừa

~~~java
// Chỉ PaymentResult hoặc con của nó mới được implement
public sealed interface PaymentResult
    permits Success, Pending, Failed {}

public record Success(String txnId) implements PaymentResult {}
public record Pending(String txnId, Instant checkAt) implements PaymentResult {}
public record Failed(String reason) implements PaymentResult {}
~~~

Lợi ích: compiler biết **tập hợp con bị đóng kín** → pattern matching switch có thể kiểm tra exhaustiveness (thiếu case nào là báo lỗi compile).

## 3. Pattern matching cho switch (Java 21)

~~~java
String describe(PaymentResult result) {
    return switch (result) {
        case Success s when s.txnId().startsWith("TX") -> // guard clause
            "Thành công, txn nội bộ: " + s.txnId();
        case Success s -> "Thành công";
        case Pending p -> "Đang chờ, kiểm tra lại lúc " + p.checkAt();
        case Failed f -> "Thất bại: " + f.reason();
        // KHÔNG cần default — compiler biết đã đủ case (nhờ sealed)!
    };
}

// Pattern matching cho instanceof (Java 16+)
if (obj instanceof String s && s.length() > 5) {
    System.out.println(s.toUpperCase());  // s đã cast sẵn
}

// Record pattern (Java 21) — bóc tách field ngay trong pattern
if (obj instanceof Money(BigDecimal amt, String cur)) {
    System.out.println("Số tiền: " + amt + " " + cur);
}
~~~

## 4. var, text blocks, các tiện ích khác

~~~java
// var — kiểu cục bộ tự suy luận (chỉ biến local)
var tasks = new ArrayList<Task>();       // ArrayList<Task>
var map = new HashMap<String, List<Order>>();

// Text block — chuỗi nhiều dòng (SQL, JSON)
String sql = """
    SELECT t.id, t.title, u.name
    FROM tasks t
    JOIN users u ON u.id = t.assignee_id
    WHERE t.done = false
    ORDER BY t.priority DESC
    """;

// Switch expression (Java 14+)
int numDays = switch (month) {
    case JAN, MAR, MAY, JUL, AUG, OCT, DEC -> 31;
    case APR, JUN, SEP, NOV -> 30;
    case FEB -> isLeapYear ? 29 : 28;
    default -> throw new IllegalArgumentException();
};
~~~

:::warn var — dùng đúng chỗ
Chỉ dùng <code>var</code> khi kiểu **rõ ràng ngay lập tức** (<code>var list = new ArrayList&lt;String&gt;()</code>) hoặc tên biến mô tả đủ (<code>var userService = ...</code>). Đừng dùng khi phải đoán: <code>var result = process(x);</code> ❌
:::

## 5. Bảng tra nhanh theo version

| Version | Tính năng chính |
|---|---|
| Java 8 | Lambda, Stream, Optional, CompletableFuture |
| Java 11 | <code>var</code> (10), HTTP Client, String methods |
| Java 17 | record (16), sealed, instanceof pattern, switch expression |
| Java 21 | **virtual threads**, record pattern, switch pattern matching |
| Java 25 (LTS) | Refined generics, structured concurrency (preview) |

:::info VIRTUAL THREADS (Java 21)
Spring Boot 3.2+ bật virtual threads chỉ bằng 1 dòng: <code>spring.threads.virtual.enabled=true</code>. Thread "rẻ như cơm bữa" → tối ưu throughput cho I/O-heavy service mà không đổi code. Ta sẽ thực hành ở Module 7.
:::

:::laas ĐỐI CHIẾU LAAS
Mở bất kỳ service LAAS nào và tìm <code>record</code> trong package dto/request — codebase production hiện đại đã dùng record làm DTO chuẩn. Biết đọc nó = đọc được nửa codebase.
:::

:::takeaways
- record cho data class immutable — DTO, config, event message
- sealed + switch pattern = mô hình hóa domain khít như "enum mở rộng"
- var chỉ cho biến local, khi kiểu hiển nhiên
- Text block cho SQL/JSON — đừng cộng chuỗi nữa
:::
`
    },
    {
      id: "0-4",
      type: "lesson",
      title: "Maven thành thạo: lifecycle, scope, multi-module",
      minutes: 35,
     content: `
## Maven — người quản lý dự án của bạn

Bạn đã từng thêm dependency vào <code>pom.xml</code> (như nimbus-jose-jwt cho Identity Service). Bài này biến bạn từ "biết copy dependency" thành "hiểu Maven vận hành".

---

## 1. pom.xml giải phẫu

~~~xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>

    <!-- Tọa độ duy nhất của artifact — giống "địa chỉ nhà" -->
    <groupId>vn.mastery</groupId>
        <!-- tổ chức / domain ngược -->
    <artifactId>taskmanager</artifactId>
        <!-- tên project -->
    <version>0.0.1-SNAPSHOT</version>
        <!-- SNAPSHOT = đang phát triển, 1.0.0 = release -->

    <properties>
        <java.version>21</java.version>
        <!-- Phiên bản dependencies tập trung ở đây -->
        <mapstruct.version>1.6.3</mapstruct.version>
    </properties>

    <parent>
        <!-- Spring Boot BOM — quản lý phiên bản ~300 thư viện phổ biến -->
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.4.1</version>
    </parent>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
            <!-- KHÔNG cần <version> — BOM parent đã lo! -->
        </dependency>
    </dependencies>
</project>
~~~

:::tip VÌ SAO KHÔNG GHI VERSION?
<code>spring-boot-starter-parent</code> chứa <code>dependencyManagement</code> cho hàng trăm thư viện tương thích đã test kỹ. Không ghi version = không bao giờ dính "xung đột phiên bản" kinh điển (Jackson vs Hibernate vs SLF4J).
:::

## 2. Dependency scope — ai biên dịch, ai chạy

| Scope | Compile | Test | Runtime | Đóng gói vào jar? |
|---|---|---|---|---|
| <code>compile</code> (mặc định) | ✅ | ✅ | ✅ | ✅ |
| <code>provided</code> | ✅ | ✅ | ❌ | ❌ (container lo) |
| <code>runtime</code> | ❌ | ✅ | ✅ | ✅ (VD: JDBC driver) |
| <code>test</code> | ❌ | ✅ | ❌ | ❌ |
| <code>optional</code> | ✅ | ✅ | ❌ | ❌ (người dùng tự quyết) |

Ví dụ điển hình:

~~~xml
<!-- Chỉ cần khi chạy — driver DB -->
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>

<!-- Lombok: chỉ cần lúc compile -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
~~~

## 3. Lifecycle — các phase phải thuộc

~~~text
validate → compile → test → package → verify → install → deploy
~~~

| Lệnh | Phase đạt được | Kết quả |
|---|---|---|
| <code>mvn compile</code> | compile | .class trong target/classes |
| <code>mvn test</code> | test | Chạy unit test |
| <code>mvn package</code> | package | Tạo jar/war trong target/ |
| <code>mvn verify</code> | verify | Chạy integration test (Failsafe) |
| <code>mvn install</code> | install | Đưa jar vào ~/.m2 local |
| <code>mvn clean</code> | — | Xóa target/ (thuần túy dọn dẹp) |

:::warn LỖI KINH ĐIỂN NHẤT
"Code mới không được build / dependency lạ lỗi" → chạy <code>mvn clean package</code>. Nếu vẫn lỗi: xóa cache <code>rm -rf ~/.m2/repository</code> (rất hiếm khi cần).
:::

## 4. Xử lý conflict dependency — kỹ năng cứu deadline

Khi 2 thư viện kéo về cùng 1 artifact khác version → **Maven lấy bản gần gốc nhất (nearest wins)**. Chẩn đoán:

~~~bash
# Xem cây dependency đầy đủ
./mvnw dependency:tree

# Lọc artifact đang nghi ngờ
./mvnw dependency:tree -Dincludes=com.fasterxml.jackson.core:jackson-databind
~~~

Override bắt buộc khi cần pin version:

~~~xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.nimbusds</groupId>
            <artifactId>nimbus-jose-jwt</artifactId>
            <version>9.37.3</version>
        </dependency>
    </dependencies>
</dependencyManagement>
~~~

:::laas ĐỐI CHIẾU LAAS
Trong conversation trước, bạn đã thêm <code>nimbus-jose-jwt</code> vào <code>&lt;dependencyManagement&gt;</code> của Identity Service — chính là kỹ thuật pin version này. Giờ bạn hiểu vì sao: đặt ở dependencyManagement = **điều khiển version tập trung** mà không ép tất cả module phải dùng.
:::

## 5. Multi-module — kiến trúc LAAS style

~~~text
laas-parent/
├── pom.xml                  ← packaging: pom, khai báo <modules>
├── laas-common/             ← DTO, util dùng chung
├── laas-domain/             ← entity + repository
├── laas-identity/           ← service authentication (bạn đang làm!)
├── laas-platform/           ← service chính
└── laas-notification/
~~~

Parent:

~~~xml
<packaging>pom</packaging>
<modules>
    <module>laas-common</module>
    <module>laas-domain</module>
    <module>laas-identity</module>
</modules>
~~~

Con (laas-identity) phụ thuộc common:

~~~xml
<parent>
    <groupId>vn.laas</groupId>
    <artifactId>laas-parent</artifactId>
    <version>1.2.0</version>
</parent>

<dependencies>
    <dependency>
        <groupId>vn.laas</groupId>
        <artifactId>laas-common</artifactId>
        <version>\${project.version}</version>
    </dependency>
</dependencies>
~~~

## 6. Maven Wrapper & build production

~~~bash
./mvnw clean verify                    # CI chạy lệnh này
./mvnw spring-boot:run                 # chạy app local
./mvnw clean package -DskipTests       # build nhanh (đừng dùng trong CI!)
./mvnw versions:set -DnewVersion=1.2.0 # bump version
~~~

:::takeaways
- BOM parent của Spring Boot = không cần ghi version cho thư viện phổ biến
- Scope: runtime (JDBC driver), optional (Lombok), test (JUnit)
- <code>dependency:tree</code> là đèn pin khi dính conflict jar
- Multi-module: parent packaging pom + các module con
:::
`
    },
    {
      id: "0-quiz",
      type: "quiz",
      title: "Quiz Module 0 — Nền tảng",
      minutes: 10,
      questions: [
        {
          level: "easy",
          scenario: "Team bạn bắt đầu dự án mới trên máy company vừa cài lại. Tech lead yêu cầu dùng Spring Boot 3.4.x. Bạn mở start.spring.io và thấy option Java 8/11/17/21/23.",
          q: "Chọn Java version nào cho project mới và vì sao?",
          options: [
            "Java 8 — vì codebase legacy LAAS cũ vẫn chạy Java 8, đồng bộ cho dễ chuyển người",
            "Java 11 — LTS, ổn định, được Spring Boot 3 hỗ trợ đầy đủ",
            "Java 17 — vừa đủ baseline tối thiểu của Spring Boot 3, không cần hơn",
            "Java 21 — LTS mới nhất, có virtual threads, Spring Boot 3.2+ hỗ trợ đầy đủ"
          ],
          answer: 3,
          explain: "Java 21 là LTS (support đến 2031), có virtual threads miễn phí cấu hình cho I/O-heavy service. Spring Boot 3.4 + Java 21 là combo chuẩn production 2025.",
          why: [
            "Sai — Spring Boot 3.x KHÔNG chạy được trên Java 8 (baseline 17). Codebase cũ thì ở lại Spring Boot 2.7, dự án mới thì không lý do gì xuống mức này.",
            "Sai — Java 11 cũng dưới baseline 17 của Spring Boot 3. Đây là bẫy 'LTS nào cũng được' — phải đọc yêu cầu version của framework.",
            "Sai về chiến lược — đúng là 17 chạy được, nhưng chọn 'vừa đủ tối thiểu' nghĩa là bỏ lỡ virtual threads (21) và phải upgrade giữa dự án sau này — tốn kém hơn nhiều.",
            "✓ Đúng — LTS mới nhất, virtual threads bật bằng 1 dòng config, mọi tính năng Spring Boot 3.4 chạy trọn vẹn. Đó là lý do các service LAAS mới đều target 21."
          ]
        },
        {
          level: "easy",
          scenario: "Bạn review code của bạn mới vào team, thấy anh ấy loop qua danh sách task rồi check null thủ công từng field.",
          q: "Đoạn code sau in ra gì?",
          code: "var list = List.of(1, 2, 3, 4, 5);\nvar result = list.stream()\n    .filter(n -> n % 2 == 0)\n    .map(n -> n * 10)\n    .toList();\nSystem.out.println(result);",
          options: ["[10, 20, 30, 40, 50]", "[2, 4]", "[20, 40]", "Compile error — không chain được map sau filter"],
          answer: 2,
          explain: "filter giữ số chẵn (2, 4) → map nhân 10 → [20, 40]. Pipeline lazy nhưng toList() là terminal nên toàn bộ chạy.",
          why: [
            "Sai — đây là lỗi đọc thiếu filter. Nếu chỉ map thì mới ra [10,20,...,50]. Phải đọc pipeline theo thứ tự: filter TRƯỚC, map SAU.",
            "Sai — quên mất map đã nhân 10. Kết quả middle-step là [2,4] nhưng map biến đổi giá trị trước khi collect.",
            "✓ Đúng — filter(2,4) → map(n*10) → [20, 40]. Đây là pattern chuẩn khi transform data trước khi trả về DTO.",
            "Sai — Stream cho phép chain bao nhiêu intermediate operation tùy ý. Đây chính là sức mạnh declarative của nó."
          ]
        },
        {
          level: "medium",
          scenario: "Production LAAS 2 giờ sáng: 500 lỗi NoSuchElementException dồn về Sentry từ method getUserName(Long id). Log cho thấy user bị xóa mềm (soft-delete) nhưng record vẫn null khi query.",
          q: "Nguyên nhân gốc và cách sửa ĐÚNG nhất?",
          code: "// Code hiện tại đang gây sự cố\npublic String getUserName(Long id) {\n    return userRepository.findById(id).get().getFullName();\n}",
          options: [
            "Gốc rễ: DB mất kết nối → thêm retry + circuit breaker quanh findById",
            "Gốc rễ: .get() trên Optional rỗng ném NoSuchElementException → dùng orElseThrow với exception nghiệp vụ",
            "Gốc rễ: soft-delete filter chưa bật → thêm @Where(clause = \"deleted = false\")",
            "Gốc rễ: thiếu cache → user bị xóa vẫn nằm trong Redis, dùng @Cacheable"
          ],
          answer: 1,
          explain: "findById trả Optional rỗng khi không tìm thấy (kể cả soft-deleted nếu query không lọc) → .get() trần ném NoSuchElementException — crash 500 thay vì 404 sạch sẽ.",
          why: [
            "Không phải gốc rễ — nếu mất kết nối DB thì exception là DataAccessResourceFailureException, và lỗi sẽ không lặp đúng 1 chỗ thế này. Đây là cách đoán theo symptom.",
            "✓ Đúng — thay .get() bằng orElseThrow(() -> new UserNotFoundException(id)) để framework map sang 404 có thông điệp rõ ràng. Optional.get() trần là code smell cấp production.",
            "Có thể là tình huống thật nhưng không phải cái app crash — nếu filter soft-delete sai thì user vẫn được trả về (dữ liệu ảo), chứ không phải Optional rỗng.",
            "Sai hướng hoàn toàn — cache không liên quan việc Optional rỗng; ngược lại @Cacheable còn khiến dữ liệu xóa mềm cũ sống lâu hơn nữa."
          ]
        },
        {
          level: "medium",
          scenario: "Tech lead duyệt PR của bạn và hỏi: 'Em định dùng record cho class này — hợp không?'",
          q: "Trường hợp nào dùng record là ĐÚNG trong Spring Boot 3?",
          options: [
            "Làm @Entity JPA — vì record tự sinh equals/hashCode tiện so sánh",
            "Làm DTO request/response cho REST API (@RequestBody / @ResponseBody)",
            "Làm @Service business logic — code gọn hơn class thường",
            "Làm @ConfigurationProperties binding file yml"
          ],
          answer: 1,
          explain: "record immutable + tự sinh boilerplate → lý tưởng cho DTO. REST payload là dữ liệu một chiều, không cần thay đổi sau khi tạo.",
          why: [
            "Sai nghiêm trọng — JPA cần no-arg constructor + setter (hoặc field access) để proxy và dirty-checking. Record không có → Hibernate throw exception hoặc hành vi lạ. Entity PHẢI là class thường.",
            "✓ Đúng — Jackson 2.15+ và Spring Boot 3 bind record làm @RequestBody hoàn hảo, kể cả kèm Bean Validation (@NotBlank, @Past...). Codebase LAAS mới đã dùng record DTO chuẩn.",
            "Sai — @Service là component có hành vi + dependency injection; record là pure data. Compiler không cấm nhưng đánh mất toàn bộ mục đích thiết kế.",
            "Bẫy tinh vi — @ConfigurationProperties DÙNG được record (constructor binding từ Boot 2.6+) nhưng đây là Use case thứ yếu. Đáp án tốt nhất cho câu 'chuẩn nhất' vẫn là DTO."
          ]
        },
        {
          level: "hard",
          scenario: "Sáng thứ 2, service LAAS fail khởi động với: java.lang.NoSuchMethodError: com.fasterxml.jackson.databind.ObjectMapper.readerFor(Ljava/lang/Class;). Bạn vừa thêm dependency Kafka client mới.",
          q: "Chẩn đoán và xử lý theo đúng trình tự?",
          options: [
            "Restart Jenkins clean workspace rồi build lại — cache Jenkins bị bẩn",
            "Chạy ./mvnw dependency:tree -Dincludes=com.fasterxml.jackson.core:jackson-databind → xác định 2 version → pin version bằng <dependencyManagement>",
            "Xóa ~/.m2/repository toàn bộ rồi re-download",
            "Downgrade Kafka client về bản cũ hơn cho khớp Jackson"
          ],
          answer: 1,
          explain: "NoSuchMethodError = classpath có 2 version cùng artifact, runtime nạp bản cũ thiếu method. dependency:tree chỉ ra xung đột → dependencyManagement ép một version duy nhất cho toàn cây.",
          why: [
            "Không giải quyết gì — cache build sạch hay bẩn, cây dependency vẫn xung đột như cũ khi compile xong. Lỗi sẽ quay lại ở build sau.",
            "✓ Đúng quy trình chuẩn: (1) dependency:tree lọc đúng artifact nghi ngờ, (2) nhìn version nào thắng theo quy tắc nearest-wins, (3) dependencyManagement pin version tương thích mà Spring Boot BOM khuyên dùng.",
            "Quá mức — xóa cả local repo tải lại cả GB, và kết quả vẫn y hệt vì cây dependency logic không đổi. Chỉ là cách 'đập nhà làm lại' thay vì đọc bản đồ.",
            "Giải pháp ngược đời — downgrade thư viện mới để né xung đột nghĩa là đánh mất tính năng/cảnh báo security của bản mới. Nguyên tắc: pin version MỚI tương thích, không hạ cấp."
          ]
        },
        {
          level: "medium",
          scenario: "Đêm release LAAS, bạn deploy notification-service. Jenkins build thành công nhưng container exit ngay lập tức với log: 'Cannot find JAVA_HOME'. Máy local vẫn chạy OK.",
          q: "Root cause và fix bền vững nhất?",
          options: [
            "Thêm export JAVA_HOME=/usr/lib/jvm/... vào Dockerfile trước lệnh CMD",
            "Dùng base image chính thức có sẵn JDK: FROM eclipse-temurin:21-jre-alpine",
            "Mount biến môi trường từ host vào container qua -e JAVA_HOME",
            "Cài JDK thủ công bằng RUN apt-get install trong Dockerfile"
          ],
          answer: 1,
          explain: "Container không kế thừa môi trường host — image base phải tự chứa JRE. eclipse-temurin:21-jre là chuẩn công nghiệp: có sẵn JDK, slim, bảo mật update đều.",
          why: [
            "Hack cứng đường dẫn — chết khi đổi base image hoặc architecture (ARM vs x86). Fix kiểu 'dán băng keo' sẽ nổ vào lần refactor sau.",
            "✓ Đúng chuẩn production — base image chính thức đã set JAVA_HOME đúng, tối ưu size (jre thay vì jdk đầy đủ), và được bảo trì security patch bởi Adoptium.",
            "Sai kiến trúc cơ bản — container KHÔNG thấy được env host trừ khi pass -e, và -e lại phụ thuộc người chạy lệnh. Image phải self-contained để chạy được ở mọi orchestrator.",
            "Chạy được nhưng tệ — apt-get cài OpenJDK phình to image (~300MB thêm), không control được minor version, và các layer update phải rebuild thủ công."
          ]
        },
        {
          level: "medium",
          scenario: "Code review, mentor chỉ vào interface PaymentResult với 3 implementation (Success/Pending/Failed) và hỏi: 'Nếu thêm trạng thái Chargeback mà quên update switch, em muốn compiler bắt hay runtime bắt?'",
          q: "Cấu trúc nào cho compiler tự phát hiện thiếu case?",
          code: "// Cấu trúc đang xét\n??? interface PaymentResult\n    permits Success, Pending, Failed {}\n\nString classify(PaymentResult r) {\n    return switch (r) {\n        case Success s -> \"OK\";\n        case Pending p -> \"WAIT\";\n        case Failed f -> \"FAIL\";\n    }; // có cần default không?\n}",
          options: [
            "interface thường — rồi thêm default throw mới chắc chắn",
            "sealed interface — switch pattern matching không cần default, thiếu case là compile error",
            "abstract class + visitor pattern — visitor ép implement mỗi khi thêm subclass",
            "enum PaymentStatus — vì enum tự exhaustiveness trong switch"
          ],
          answer: 1,
          explain: "sealed + permits khóa tập implementation → compiler biết tập đóng → kiểm tra exhaustiveness. Thêm Chargeback mà không thêm case = lỗi build ngay tại CI, không chờ đến runtime.",
          why: [
            "Đi ngược tiến hóa — default throw đúng là cách runtime bắt lỗi nhưng chính là cái ta đang tránh. Người ta thêm default để 'im compiler' rồi quên update.",
            "✓ Đúng — sealed interface (Java 17) + switch pattern (Java 21) là cặp đôi hoàn hảo cho domain model đóng. LAAS có loại use case này ở payment/loyalty state machine.",
            "Hợp lý về lý thuyết nhưng nặng đô — visitor đòi ~4 interface + factory cho mỗi trạng thái. sealed đạt cùng guarantee bằng 2 từ khóa.",
            "Sai hướng — enum không chứa được data per-case (Success có txnId, Pending có checkAt...). Enum chỉ phù hợp khi mỗi case là hằng số thuần."
          ]
        },
        {
          level: "easy",
          scenario: "Bạn viết pom.xml lần đầu cho module mới, thắc mắc sao các dependency Spring đều không có tag <version>.",
          q: "Vì sao starter Spring Boot không cần khai báo version?",
          options: [
            "Maven tự download version mới nhất từ Maven Central",
            "spring-boot-starter-parent chứa dependencyManagement quản lý version ~300 thư viện tương thích đã test",
            "IDE tự động điền version khi save file",
            "Các thư viện Spring đặc biệt được Maven đối xử riêng"
          ],
          answer: 1,
          explain: "Parent POM của Spring Boot là 'bảng chỉ đạo version' — dependencyManagement khai báo version đã được test tương thích cho cả hệ sinh thái (Jackson, Hibernate, Logback...).",
          why: [
            "Nguy hiểm nếu đúng — version mới nhất có thể vỡ tương thích. Chính triết lý Spring Boot là NGĂN hành vi này: version phải deterministic.",
            "✓ Đúng — cứ nhìn pom của spring-boot-starter-parent: có <dependencyManagement> khổng lồ. Bạn ghi artifact không version → Maven tra bảng này. Muốn override thì tự khai ở dependencyManagement của mình.",
            "Hoàn toàn sai — Maven không quan tâm IDE. Build trên server Jenkins không có IDE vẫn chạy đúng.",
            "Không có cơ chế 'đối xử riêng' — mọi artifact Maven đều cùng luật. Khác biệt nằm ở POM kế thừa, không phải magic."
          ]
        },
        {
          level: "medium",
          scenario: "Audit bảo mật nội bộ yêu cầu giảm attack surface: image production không được chứa JDK đầy đủ (javac, tooling), chỉ cần chạy bytecode.",
          q: "Dependency scope + base image nào thỏa yêu cầu?",
          options: [
            "scope compile + image eclipse-temurin:21-jdk",
            "scope provided cho postgresql + image jdk",
            "postgresql scope runtime + base image eclipse-temurin:21-jre",
            "scope test cho postgresql + image jre"
          ],
          answer: 2,
          explain: "runtime scope: driver JDBC không cần lúc compile (code chỉ đụng JPA interface) nhưng phải có lúc chạy. JRE image: chỉ đủ chạy bytecode, không có compiler → nhẹ hơn ~40% và ít CVE hơn.",
          why: [
            "Đủ chạy nhưng phí — JDK đầy đủ trong production chứa tooling không bao giờ dùng: javac, jdb, jstack dev-only. Image phình + attack surface rộng vô ích.",
            "provided nghĩa là 'container lo' — hợp cho WAR deploy vào Tomcat ngoài, nhưng với Spring Boot fat-jar tự chạy thì driver sẽ BIẾN MẤT khỏi classpath khi start → NoClassDefFoundError.",
            "✓ Đúng cả hai đầu — scope runtime cho JDBC driver (chuẩn Spring Initializr tự generate) và jre-alpine/jre cho image tối giản production.",
            "test scope loại driver khỏi production runtime — service sẽ không kết nối được DB khi deploy. Chỉ dùng nếu thay bằng H2 in-memory cho test."
          ]
        },
        {
          level: "hard",
          scenario: "LAAS đang gánh 200 concurrent requests/insert order mỗi giây trên platform-service (Java 17, platform threads). CPU chỉ 30% nhưng latency P99 chạm 2s vì thread pool 200 đầy, request xếp hàng chờ.",
          q: "Giải pháp nào đúng bản chất vấn đề?",
          options: [
            "Tăng server.tomcat.threads.max lên 1000 — càng nhiều thread càng tốt",
            "Scale ngang thêm 2 pod — chia tải 3 phần",
            "Bật spring.threads.virtual.enabled=true (nâng Java 21) — virtual thread không block platform thread khi chờ I/O",
            "Thêm Redis cache toàn bộ order path — giảm DB hit"
          ],
          answer: 2,
          explain: "CPU rảnh + thread đầy = I/O-bound. Platform thread chờ DB/network thì cũng nằm chiếm chỗ. Virtual thread: khi chờ I/O nó 'trả' carrier thread về pool → 1 máy chạy hàng chục nghìn concurrent I/O operations.",
          why: [
            "Chữa đúng symptom sai bệnh — 1000 platform thread = 1GB stack mặc định, context-switch mở rộng, và nếu query DB chờ 2s thì 1000 thread cũng đầy như thường. Đáy bể chỉ dịch chứ không biến mất.",
            "Giảm tải thật nhưng không sửa thiết kế — mỗi pod vẫn dính ceiling 200. Tốn tiền infra cho vấn đề giải được bằng 1 dòng config.",
            "✓ Đúng căn nguyên — đây chính là use case lý tưởng của virtual threads (JDK 21): workload I/O-heavy, CPU idle. Loom project sinh ra cho kịch bản LAAS này.",
            "Cache không giúp insert path (write-heavy). Có thể giảm vài read phụ, nhưng bottleneck chính là thread chờ I/O vẫn nguyên vẹn."
          ]
        }
      ]
    }
  ]
});
